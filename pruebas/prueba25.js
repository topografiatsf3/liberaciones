// Ronda de productividad: ciclo observado → corregido → re-aceptado, búsqueda sin tildes, duplicar rechazado,
// Bandeja con teclado y Mayús+clic, ficha con anterior/siguiente, «Deshacer», filtros que se recuerdan y «Ver más».
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs');
const { tipo } = require('./filtros');
const OUT = path.join(__dirname, 'capturas', 'prueba25'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
async function preparar(ctx) {
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
}
const login = async (p, u) => { await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); };
const salir = async p => { await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); };
const toastTxt = p => p.textContent('#toast');
async function registrar(p, o) {
  await p.click('[data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])');
  await p.selectOption('#iTopo', 'AB'); await p.selectOption('#iEst', 'pp'); await p.selectOption('#iSub', 'pp-oeste'); await tipo(p, o.tipo || 'masivo');
  await p.fill('#iPk1', o.a); await p.fill('#iPk2', o.b); await p.fill('#iCapa', o.capa || ''); await p.fill('#iDesc', o.d);
  await p.click('#bGuardar'); await p.waitForTimeout(250);
}
const estadoDe = (p, desc) => p.evaluate(d => { const s = window.__fakeStore(); const k = Object.keys(s).find(k => k.startsWith('liberaciones/') && (s[k].descripcion || '').includes(d)); return k ? { id: k.split('/')[1], ...s[k] } : null; }, desc);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); await preparar(ctx);
  const p = await ctx.newPage(); p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForSelector('#gEntrar');
  // Admin crea al operario y a gabinete
  await login(p, ADMIN);
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="usuarios"]'); await p.waitForSelector('#uMail');
  await p.fill('#uMail', OPER.email); await p.fill('#uNom', OPER.displayName); await p.selectOption('#uRol', 'operario'); await p.selectOption('#uTopo', 'GN'); await p.click('#uAdd'); await p.waitForTimeout(150);
  await p.fill('#uMail', GAB.email); await p.fill('#uNom', GAB.displayName); await p.selectOption('#uRol', 'gabinete'); await p.click('#uAdd'); await p.waitForTimeout(150);
  await salir(p);

  // Operario registra 5 tramos (uno con tilde para la búsqueda)
  await login(p, OPER);
  await registrar(p, { a: '3+000', b: '3+040', d: 'Tramo A transición norte' });
  await registrar(p, { a: '3+040', b: '3+080', d: 'Tramo B' });
  await registrar(p, { a: '3+080', b: '3+120', d: 'Tramo C' });
  await registrar(p, { a: '3+120', b: '3+160', d: 'Tramo E' });
  await registrar(p, { a: '3+160', b: '3+200', d: 'Tramo F' });
  await p.click('[data-v="mis"]'); await p.waitForSelector('.item');
  await p.fill('#q', 'transicion'); await p.waitForTimeout(350);
  ok(await p.$$eval('.item', i => i.length) === 1 && (await p.textContent('.list')).includes('transición'), 'Mis registros: «transicion» encuentra «transición» (sin tildes)');
  await p.fill('#q', ''); await p.waitForTimeout(300);
  await salir(p);

  // Gabinete: acepta A, lo observa estando En proceso (ya con código) y rechaza C
  await login(p, GAB);
  await p.click('[data-v="bandeja"]'); await p.waitForSelector('.brow');
  await p.click('.brow:has-text("Tramo A") [data-a="aceptar"]'); await p.waitForSelector('.dlg.on'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.activeElement?.type === 'submit'), 'aceptar uno: el foco queda en «Generar código» (Enter acepta)');
  await p.keyboard.press('Enter'); await p.waitForTimeout(450);
  const codA = (await estadoDe(p, 'Tramo A')).numero;
  ok(/SKT-TOP-\d+/.test(codA) && (await toastTxt(p)).includes(codA), 'Tramo A aceptado con código ' + codA);
  // Versión 29: en la tarjeta quedan «Aceptar» y «Observar»; «Rechazar» está en «⋯»
  await p.click('.brow:has-text("Tramo C") [data-mas]'); await p.waitForSelector('#ctx'); await p.click('#ctx .ctx-i:has-text("Rechazar")'); await p.waitForSelector('.dlg.on');
  await p.fill('#dRech', 'Tramo mal medido'); await p.click('.dlg button[type=submit]'); await p.waitForTimeout(400);
  ok((await estadoDe(p, 'Tramo C')).estado === 'RE', 'Tramo C rechazado');
  await p.click('[data-bt="EP"]'); await p.waitForSelector('.brow');
  await p.click('.brow:has-text("Tramo A") .item'); await p.waitForSelector('#sheet.on');
  ok(!!(await p.$('#fObservar')), 'la ficha de un En proceso ofrece «Observar»');
  await p.click('#fObservar'); await p.waitForSelector('.dlg.on'); await p.fill('#dNota', 'Corregir PK final'); await p.click('.dlg button[type=submit]'); await p.waitForTimeout(450);
  const a1 = await estadoDe(p, 'Tramo A');
  ok(a1.estado === 'OB' && a1.numero === codA, 'Tramo A observado y conserva su código');
  await p.waitForTimeout(400); if (await p.$('#sheet.on')) { await p.click('#fCerrar'); await p.waitForTimeout(350); }
  await salir(p);

  // Operario: Mis registros abre en «Todos» con el observado primero y su aviso (versión 29), ve la nota al editar y corrige
  await login(p, OPER);
  await p.click('[data-v="mis"]'); await p.waitForSelector('.item');
  ok(await p.getAttribute('[data-st=""]', 'aria-pressed') === 'true' && /observado/.test(await p.textContent('.mis-obs')) && /Tramo A/.test(await p.textContent('#lista .item')), 'Mis registros abre en «Todos», con el observado primero y un aviso');
  await p.click('.item:has-text("Tramo A")'); await p.waitForSelector('#sheet.on'); await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])');
  ok((await p.textContent('.nota-obs')).includes('Corregir PK final'), 'al editar se ve lo que gabinete pidió corregir');
  ok(await p.evaluate(() => location.hash) === '#nueva', 'Editar deja la dirección en #nueva');
  await p.fill('#iPk2', '3+035'); await p.click('#bGuardar'); await p.waitForTimeout(700);
  if (await p.$('.dlg.on')) { console.log('FALLA: apareció un diálogo al guardar: ' + await p.textContent('.dlg.on h3')); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(600); }
  const a2 = await estadoDe(p, 'Tramo A');
  ok(a2.estado === 'PT' && a2.notaObservacion === 'Corregir PK final', 'corregido: vuelve a Pendiente y guarda la nota anterior');
  // Rechazado: «Duplicar como nuevo»
  await p.click('[data-v="mis"]'); await p.waitForSelector('.item'); await p.click('[data-st=""]'); await p.waitForTimeout(200);
  await p.click('.item:has-text("Tramo C")'); await p.waitForSelector('#sheet.on');
  ok(!!(await p.$('#fDuplicar')), 'la ficha de un rechazado propio ofrece «Duplicar como nuevo»');
  await p.click('#fDuplicar'); await p.waitForSelector('#fLib:not([hidden])');
  ok((await p.inputValue('#iDesc')).includes('Tramo C') && !(await p.$('.nota-obs')), 'el formulario viene lleno con los datos del rechazado, como registro nuevo');
  await p.click('#bGuardar'); await p.waitForTimeout(500);
  const nC = await p.evaluate(() => Object.values(window.__fakeStore()).filter(x => (x.descripcion || '') === 'Tramo C').length);
  ok(nC === 2, 'se guardó un registro nuevo y el rechazado sigue igual');
  await salir(p);

  // Gabinete: ve «Corregido», re-acepta con el mismo código y el historial dice qué cambió
  await login(p, GAB);
  await p.click('[data-v="bandeja"]'); await p.waitForSelector('.tabs');
  ok(await p.getAttribute('[data-bt="EP"]', 'aria-pressed') === 'true', 'la Bandeja recuerda la última pestaña usada (Por entregar)');
  await p.click('[data-bt="PT"]'); await p.waitForSelector('.brow');
  ok(!!(await p.$('.brow:has-text("Tramo A") .st-corr')), 'la Bandeja marca «Corregido» al registro que volvió');
  await p.screenshot({ path: OUT + '/01-corregido.png', fullPage: true });
  await p.click('.brow:has-text("Tramo A") [data-a="aceptar"]'); await p.waitForSelector('.dlg.on'); await p.click('.dlg button[type=submit]'); await p.waitForTimeout(450);
  const a3 = await estadoDe(p, 'Tramo A');
  ok(a3.estado === 'EP' && a3.numero === codA && !a3.notaObservacion, 'al aceptar de nuevo pasa a En proceso con su mismo código (antes quedaba trabado)');
  ok((await toastTxt(p)).includes('Re-aceptado'), 'el aviso dice que conserva su código: ' + await toastTxt(p));
  const hist = await p.evaluate(id => Object.values(window.__fakeStore()).filter(h => h.liberacionId === id).map(h => h.nota).join(' | '), a3.id);
  ok(/Corregido/.test(hist) && /PK 3\+000 – 3\+040 → 3\+000 – 3\+035/.test(hist), 'el historial dice qué cambió: ' + hist.slice(0, 160));
  await salir(p);

  // Computadora (gabinete): teclado, Mayús+clic, ficha con anterior/siguiente, Deshacer, filtros que se recuerdan
  const ctx2 = await b.newContext({ viewport: { width: 1366, height: 900 } }); await preparar(ctx2);
  const d = await ctx2.newPage(); d.on('pageerror', e => { errores.push('pc: ' + e.message); console.log('PAGEERROR pc', e.message); });
  await d.goto(URL); await d.evaluate(([s, u]) => { localStorage.setItem('__fakeDB', s); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [await p.evaluate(() => localStorage.getItem('__fakeDB')), GAB]);
  await d.reload(); await d.waitForSelector('#nav button');
  await d.click('[data-v="bandeja"]'); await d.waitForSelector('#blist tr[data-rid]');
  const nFilas = await d.$$eval('#blist tr[data-rid]', t => t.length);
  ok(nFilas >= 4, 'Por aceptar con ' + nFilas + ' filas');
  await d.click('h1'); await d.keyboard.press('j'); await d.keyboard.press('j');
  ok(await d.$$eval('#blist tr.cur', t => t.length) === 1, 'j mueve la fila actual');
  await d.keyboard.press('x'); await d.waitForTimeout(100);
  ok(await d.$eval('#bBulk', x => x.classList.contains('on') && x.textContent.includes('1')), 'x marca la fila actual');
  await d.click('[data-bk="limpiar"]'); await d.waitForTimeout(150);
  const cks = await d.$$('#blist [data-sel]'); await cks[0].click(); await cks[3].click({ modifiers: ['Shift'] }); await d.waitForTimeout(150);
  ok(await d.$$eval('#blist [data-sel]:checked', c => c.length) === 4, 'Mayús+clic marca el rango completo (4)');
  ok(!!(await d.$('[data-bk="observar"]')) && !!(await d.$('[data-bk="rechazar"]')), 'en grupo también se puede observar y rechazar');
  await d.click('[data-bk="limpiar"]'); await d.waitForTimeout(150);
  // Ficha: 1 de N, flecha derecha y aceptar pasa al siguiente sin cerrar
  await d.click('#blist tr[data-rid] .tdesc'); await d.waitForSelector('#sheet.on');
  ok((await d.textContent('.fnav')).includes('1 de'), 'la ficha muestra «1 de N»');
  const t1 = await d.textContent('#fTit'); await d.keyboard.press('ArrowRight'); await d.waitForTimeout(200);
  const t2 = await d.textContent('#fTit');
  ok(t1 !== t2 && (await d.textContent('.fnav')).includes('2 de'), '→ pasa al siguiente registro en la ficha');
  await d.click('#fAceptar'); await d.waitForSelector('.dlg.on'); await d.waitForTimeout(200); await d.keyboard.press('Enter'); await d.waitForTimeout(600);
  ok(!!(await d.$('#sheet.on')) && (await d.textContent('#fTit')) !== t2, `tras aceptar, la ficha pasa sola al siguiente (no se cierra) [${!!(await d.$('#sheet.on'))} · ${t2} → ${await d.textContent('#fTit')} · ${await d.textContent('#toast')}]`);
  await d.screenshot({ path: OUT + '/02-ficha-siguiente.png' });
  await d.keyboard.press('Escape'); await d.waitForTimeout(350);
  // Devolver a pendientes sin confirmación, con «Deshacer»
  await d.click('#blist tr[data-rid] .tdesc'); await d.waitForSelector('#sheet.on'); await d.click('#fObservar'); await d.waitForSelector('.dlg.on');
  await d.fill('#dNota', 'Revisar cota'); await d.click('.dlg button[type=submit]'); await d.waitForTimeout(500);
  await d.keyboard.press('Escape'); await d.waitForTimeout(350);
  await d.click('[data-bt="OB"]'); await d.waitForSelector('#blist tr[data-rid]');
  await d.click('#blist tr[data-rid] .tdesc'); await d.waitForSelector('#sheet.on');
  ok(!!(await d.$('#fReabrir')), 'la ficha de un observado ofrece «Devolver a pendientes»');
  await d.click('#fReabrir'); await d.waitForTimeout(450);
  ok(!(await d.$('.dlg.on')) && !!(await d.$('#toast .toast-btn')), 'Devolver no pide confirmación y el aviso trae «Deshacer»');
  await d.click('#toast .toast-btn'); await d.waitForTimeout(500);
  ok(await d.evaluate(() => Object.values(window.__fakeStore()).some(x => x.notaObservacion === 'Revisar cota' && x.estado === 'OB')), '«Deshacer» lo deja observado como estaba');
  if (await d.$('#sheet.on')) { await d.keyboard.press('Escape'); await d.waitForTimeout(350); }
  // Ctrl+K sin tildes
  await d.keyboard.press('Control+k'); await d.waitForSelector('#cmdk'); await d.fill('#cmdk input', 'transicion'); await d.waitForTimeout(300);
  ok((await d.textContent('#cmdk .cmdk-res')).includes(codA), 'Ctrl+K: «transicion» encuentra el registro con tilde');
  await d.keyboard.press('Escape'); await d.waitForTimeout(250);
  // Registros: filtro de frente y estado se recuerdan al recargar; exportar lo filtrado
  await d.click('[data-v="todos"]'); await d.waitForSelector('#rFil');
  await d.selectOption('#rfSub', 'pp-oeste'); await d.waitForTimeout(200);
  await d.click('#rSt [data-st="PT"]'); await d.waitForTimeout(200);
  ok(!!(await d.$('#rExp')) && (await d.textContent('#rExp')).includes('lo filtrado'), 'botón «Exportar lo filtrado»');
  await d.click('#rSt [data-st="EP"]', { modifiers: ['Control'] }); await d.waitForTimeout(200);
  ok(await d.evaluate(() => [...document.querySelectorAll('#lista tr[data-id] .st')].every(s => s.classList.contains('PT') || s.classList.contains('EP'))), 'Ctrl+clic en un estado suma varios (Pendiente + En proceso)');
  await d.reload(); await d.waitForSelector('#rFil');
  ok(await d.inputValue('#rfSub') === 'pp-oeste', 'el filtro de frente se recuerda al recargar');
  await d.click('#rfX'); await d.waitForTimeout(200);
  ok(await d.inputValue('#rfSub') === '' && await d.getAttribute('#rSt [data-st=""]', 'aria-pressed') === 'true', '«Limpiar filtros» quita también el estado');
  await d.selectOption('#rfFecha', 'sem'); await d.waitForTimeout(400);
  ok((await d.textContent('.lead')).includes('Esta semana'), 'filtro de fecha «Esta semana»');
  await d.selectOption('#rfFecha', ''); await d.waitForTimeout(200);

  // «Ver más» en Mis registros con más de 400
  await p.evaluate(() => {
    const s = window.__fakeStore(), t0 = Date.now() - 86400000 * 30;
    for (let i = 0; i < 420; i++) s['liberaciones/v' + i] = { actividad: 'LIB', estado: 'EC', numero: 'SKT-TOP-9' + String(i).padStart(4, '0'), creadoPor: 'operario@gmail.com', estructuraId: 'pp', subestructuraId: 'pp-oeste', tipoId: 'masivo', topografoId: 'GN', pkInicio: i, pkFin: i + 1, descripcion: 'Viejo ' + i, fechaCampo: { __ts: t0 - i * 60000 }, creadoEn: { __ts: t0 - i * 60000 }, archivos: [] };
    localStorage.setItem('__fakeDB', JSON.stringify(s));
  });
  await login(p, OPER); await p.click('[data-v="mis"]'); await p.waitForSelector('.item');
  if (await p.getAttribute('[data-st=""]', 'aria-pressed') !== 'true') { await p.click('[data-st=""]'); await p.waitForTimeout(300); }
  const n0 = await p.$$eval('#lista .item', i => i.length);
  await p.click('#bMas'); await p.waitForTimeout(500);
  const n1 = await p.$$eval('#lista .item', i => i.length);
  ok(n0 === 400 && n1 > 400, `«Ver más» en Mis registros muestra el resto (${n0} → ${n1})`);

  ok(!errores.length, 'sin errores en la página' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
})().catch(e => { console.log('FALLA: excepción', e); process.exit(1); });
