// Versión 29 (etapa 1 del análisis desde cero): roces del trabajo diario.
// «Guardar» fijo y «Limpiar» arriba, «Mis registros» abre en «Todos» con aviso de observados, la ✕ de la ficha no pisa las flechas,
// «Rechazar» y la papelera aparte, gabinete entra a la Bandeja, números del Panel arriba y con su alcance, «Registrado por» con nombre,
// «Fecha de entrega a Calidad» al entregar y 44 px en pantallas táctiles anchas.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba36'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Carlos Jefe' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const ahora = Date.now(), hora = 36e5;
const base = (extra) => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, archivos: [], ...extra });
const DB = {
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', activo: true },
  'usuarios/jefe@gmail.com': { nombre: 'Carlos Jefe', rol: 'jefe', activo: true },
  'liberaciones/pt1': base({ estado: 'PT', descripcion: 'Liberación pendiente uno', pkInicio: 100, pkFin: 140 }),
  'liberaciones/pt2': base({ estado: 'PT', descripcion: 'Liberación pendiente dos', pkInicio: 140, pkFin: 170, fechaCampo: { __ts: ahora - 2 * hora }, creadoEn: { __ts: ahora - 2 * hora } }),
  'liberaciones/ob1': base({ estado: 'OB', descripcion: 'Liberación observada', notaObservacion: 'Falta foto', pkInicio: 170, pkFin: 200, fechaCampo: { __ts: ahora - 5 * hora }, creadoEn: { __ts: ahora - 5 * hora } }),
  'liberaciones/ep1': base({ estado: 'EP', numero: 'SKT-TOP-02690', descripcion: 'Liberación en proceso', nombreLiberacion: '0+200_0+240_STN F1_SKT-TOP-02690', pkInicio: 200, pkFin: 240, fechaLiberacion: { __ts: ahora - hora } }),
};
const caja = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; });
async function entrarComo(p, u, limpiarVista) {
  await p.click('#btnSalir'); await p.waitForSelector('#gEntrar');
  if (limpiarVista) await p.evaluate(() => { localStorage.removeItem('lib.vista'); history.replaceState(null, '', location.pathname); });
  await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(500);
}
let b;
(async () => {
  b = await chromium.launch();
  const rutas = async c => { await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); }); await c.route(/fonts\./, r => r.abort()); };
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); await rutas(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); }, [DB, ADMIN]);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(600);

  // ===== Campo, en celular =====
  await p.setViewportSize({ width: 375, height: 812 });
  await entrarComo(p, OPER, true);
  // 1. «Guardar» a la vista sin bajar, y «Limpiar» arriba
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])'); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
  const alto = await p.evaluate(() => document.documentElement.scrollHeight);
  const g0 = await caja(p, '#bGuardar'), nav = await caja(p, '#nav'), l0 = await caja(p, '#bLimpiar');
  ok(alto > 1500, `el formulario sigue siendo largo (${alto} px), así que la prueba tiene sentido`);
  ok(g0.y > 0 && g0.b <= nav.y + 1, `«Guardar» se ve sin bajar, sobre el menú (de ${Math.round(g0.y)} a ${Math.round(g0.b)}; el menú empieza en ${Math.round(nav.y)})`);
  ok(g0.h >= 44, `«Guardar» mide ${Math.round(g0.h)} px de alto`);
  ok(l0.y < 200 && g0.y - l0.b > 300, `«Limpiar» está arriba (en ${Math.round(l0.y)}), a ${Math.round(g0.y - l0.b)} px de «Guardar»`);
  ok(l0.h >= 44, `«Limpiar» mide ${Math.round(l0.h)} px de alto`);
  ok(!(await p.$('#fLib .actions #bLimpiar')), 'junto a «Guardar» ya no hay «Limpiar»');
  await p.screenshot({ path: path.join(OUT, '1-nueva-arriba.png') });
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(200);
  const g1 = await caja(p, '#bGuardar');
  ok(g1.b <= nav.y + 1 && g1.y > 0, '«Guardar» sigue a la vista al final del formulario');
  // El último campo no queda tapado por la barra de «Guardar»
  const ult = await caja(p, '.up');
  ok(ult.b <= g1.y + 1, 'al final, los botones de archivos quedan por encima de la barra de «Guardar»');
  await p.screenshot({ path: path.join(OUT, '2-nueva-final.png') });
  // 2. «Limpiar» sigue pidiendo confirmar
  await p.fill('#iDesc', 'algo escrito'); await p.evaluate(() => scrollTo(0, 0)); await p.click('#bLimpiar'); await p.waitForSelector('.dlg.on');
  ok(/Limpiar formulario/.test(await p.textContent('.dlg.on')), '«Limpiar» pide confirmar antes de borrar lo escrito');
  await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(400);
  ok((await p.inputValue('#iDesc')) !== 'algo escrito', 'al confirmar se limpia');
  // 3. «Mis registros» abre en «Todos», con aviso de observados
  await p.click('#nav [data-v="mis"]'); await p.waitForSelector('#lista');
  ok((await p.getAttribute('#rSt [data-st=""]', 'aria-pressed')) === 'true', '«Mis registros» abre en «Todos»');
  const ids = await p.$$eval('#lista [data-id]', x => x.map(e => e.dataset.id));
  ok(ids.includes('pt1') && ids.includes('pt2') && ids[0] === 'ob1', 'se ve todo lo registrado, con el observado primero: ' + ids.join(', '));
  ok(/Tienes 1 observado por corregir/.test(await p.textContent('.mis-obs')), 'un recuadro avisa «Tienes 1 observado por corregir»');
  await p.screenshot({ path: path.join(OUT, '3-mis-todos.png') });
  await p.click('#rVerObs'); await p.waitForTimeout(250);
  ok((await p.$$eval('#lista [data-id]', x => x.map(e => e.dataset.id))).join() === 'ob1', '«Ver solo ese» deja solo el observado');
  ok(!(await p.$('.mis-obs')), 'con el filtro puesto, el recuadro ya no hace falta');
  // Al volver desde otra pantalla abre otra vez en «Todos»
  await p.click('#nav [data-v="nueva"]'); await p.click('#nav [data-v="mis"]'); await p.waitForSelector('#lista');
  ok((await p.$$eval('#lista [data-id]', x => x.length)) === 4, 'al volver a «Mis registros» abre otra vez en «Todos»');
  // 4. Ficha: la ✕ no pisa las flechas
  await p.click('#lista [data-id="ob1"]'); await p.waitForSelector('#sheet.on'); await p.waitForTimeout(400);
  const x = await caja(p, '#fX'), sig = await caja(p, '#sheet [data-fnav="1"]');
  ok(sig.r <= x.x || sig.y >= x.b, `la flecha «siguiente» (termina en ${Math.round(sig.r)}) no queda debajo de la ✕ (empieza en ${Math.round(x.x)})`);
  await p.screenshot({ path: path.join(OUT, '4-ficha.png') });
  // 5. Al corregir un observado, «Cancelar» sigue junto a «Guardar cambios»
  await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])');
  ok((await p.textContent('#fLib .actions #bLimpiar')).trim() === 'Cancelar' && (await p.textContent('#bGuardar')).trim() === 'Guardar cambios', 'al editar, la barra fija trae «Guardar cambios» y «Cancelar»');
  await p.click('#bLimpiar'); await p.waitForTimeout(300);

  // ===== Gabinete, en celular =====
  await entrarComo(p, GAB, true);
  ok((await p.getAttribute('#nav [data-v="bandeja"]', 'aria-current')) === 'page', 'gabinete entra directo a la Bandeja');
  await p.waitForSelector('#blist [data-rid="pt1"]');
  const acc = await p.$$eval('#blist [data-rid="pt1"] .bact [data-a]', x => x.map(e => e.dataset.a));
  ok(acc.join() === 'aceptar,observar', 'la tarjeta deja solo «Aceptar» y «Observar»: ' + acc.join(', '));
  await p.screenshot({ path: path.join(OUT, '5-bandeja-cel.png') });
  await p.click('#blist [data-rid="pt1"] [data-mas]'); await p.waitForSelector('#ctx');
  const menu = await p.textContent('#ctx');
  ok(/Rechazar/.test(menu) && /Cambiar capa|Poner capa/.test(menu), '«Rechazar» y la capa están en el menú «⋯»');
  await p.evaluate(() => document.querySelector('.ctx-bd, #ctxBd')?.click()); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.click('#blist [data-rid="pt1"] .item'); await p.waitForSelector('#sheet.on'); await p.waitForTimeout(400);
  ok(!!(await p.$('#sheet .fdel #fRechazar')) && !(await p.$('#sheet .actions #fRechazar')), 'en la ficha, «Rechazar» va al pie, fuera de la fila de botones');
  const ac = await caja(p, '#fAceptar'), re = await caja(p, '#fRechazar');
  ok(re.y - ac.b > 60, `«Rechazar» queda a ${Math.round(re.y - ac.b)} px de «Aceptar y generar código»`);
  await p.click('#fRechazar'); await p.waitForSelector('.dlg.on');
  ok(/Rechazar/.test(await p.textContent('.dlg.on')), '«Rechazar» sigue abriendo su ventana con el motivo');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // ===== Jefe, en celular: números arriba y con su alcance =====
  await entrarComo(p, JEFE, true);
  await p.waitForSelector('#pStats .stat'); await p.waitForTimeout(600);
  const st = await caja(p, '#pStats'), ch = await caja(p, '.chartbox');
  ok(st.b <= ch.y + 1, `los números del Panel están arriba del gráfico (terminan en ${Math.round(st.b)}; el gráfico empieza en ${Math.round(ch.y)})`);
  ok(/Solo el frente Presa Principal Oeste/.test(await p.textContent('#pStatsDe')), 'dicen de qué frente son: «' + (await p.textContent('#pStatsDe')) + '»');
  await p.screenshot({ path: path.join(OUT, '6-panel-jefe.png') });
  await p.click('.chart-h [data-vista="planta"]'); await p.waitForTimeout(500);
  const de2 = (await p.textContent('#pStatsDe').catch(() => '')) || '';
  ok(/Toda la estructura/.test(de2), 'en «Planta» avisan que son de toda la estructura: «' + de2 + '»');

  // ===== Administrador, en computadora =====
  await p.setViewportSize({ width: 1366, height: 900 });
  await entrarComo(p, ADMIN, true);
  await p.click('#nav [data-v="bandeja"]'); await p.click('[data-bt="PT"]').catch(() => {}); await p.waitForSelector('#blist tr[data-rid="pt1"]');
  // Toda la celda de la casilla marca la fila
  const ck = await caja(p, '#blist tr[data-rid="pt1"] td.ck');
  await p.mouse.click(ck.x + 3, ck.y + 3); await p.waitForTimeout(250);
  ok(await p.$eval('#blist tr[data-rid="pt1"] [data-sel]', e => e.checked), 'un clic en el borde de la celda marca la casilla');
  const orden = await p.$$eval('#bBulk [data-bk]', x => x.map(e => e.dataset.bk));
  ok(orden.indexOf('rechazar') > orden.indexOf('limpiar') && orden.indexOf('papelera') > orden.indexOf('limpiar'), 'en la barra de grupo, «Rechazar» y la papelera van al final: ' + orden.join(', '));
  const des = await caja(p, '#bBulk [data-bk="limpiar"]'), rj = await caja(p, '#bBulk [data-bk="rechazar"]');
  ok(rj.x - des.r > 40, `y quedan separados a la derecha (${Math.round(rj.x - des.r)} px de hueco)`);
  await p.screenshot({ path: path.join(OUT, '7-barra-grupo.png') });
  await p.click('#bBulk [data-bk="limpiar"]'); await p.waitForTimeout(200);
  // «Registrado por» con nombre
  await p.click('#blist tr[data-rid="pt1"] td.tdesc'); await p.waitForSelector('#sheet.on'); await p.waitForTimeout(300);
  const kv = await p.textContent('#sheet .kv');
  ok(/Registrado por\s*Pedro Operario/.test(kv) && !/operario@gmail\.com/.test(kv), '«Registrado por» muestra el nombre, no el correo');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // Al entregar, la fecha dice a qué entrega se refiere
  await p.click('[data-bt="EP"]'); await p.waitForSelector('#blist tr[data-rid="ep1"]'); await p.click('#blist tr[data-rid="ep1"] [data-a="entregar"]'); await p.waitForSelector('.dlg.on');
  ok((await p.textContent('.dlg.on label[for="dFe"]')).trim() === 'Fecha de entrega a Calidad', 'la ventana de entrega dice «Fecha de entrega a Calidad»');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // ===== Tableta echada (táctil, 1180 px): botones de 44 px =====
  const datos = await p.evaluate(() => ({ db: localStorage.getItem('__fakeDB'), u: localStorage.getItem('__fakeUser') }));
  const ctxT = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true }); await rutas(ctxT);
  const t = await ctxT.newPage(); t.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  await t.goto(URL); await t.evaluate(d => { localStorage.clear(); localStorage.setItem('__fakeDB', d.db); localStorage.setItem('__fakeUser', d.u); }, datos);
  await t.goto(URL + '#bandeja'); await t.reload(); await t.waitForSelector('#nav button'); await t.waitForTimeout(600);
  const tactil = await t.evaluate(() => matchMedia('(pointer:coarse)').matches && matchMedia('(min-width:1024px)').matches);
  if (!tactil) console.log('ok  - (el navegador de prueba no imita una pantalla táctil ancha: no se pudo medir los 44 px)');
  else {
    await t.click('#nav [data-v="bandeja"]'); await t.click('[data-bt="PT"]').catch(() => {}); await t.waitForSelector('#blist tr[data-rid="pt1"]');
    const ba = await caja(t, '#blist tr[data-rid="pt1"] [data-a="aceptar"]'), bm = await caja(t, '#blist tr[data-rid="pt1"] [data-mas]');
    ok(ba.h >= 44, `tableta táctil: «Aceptar» mide ${Math.round(ba.h)} px de alto`);
    ok(bm.w >= 44 && bm.h >= 44, `tableta táctil: «⋯» mide ${Math.round(bm.w)} × ${Math.round(bm.h)} px`);
    ok(!(await t.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'tableta táctil: la Bandeja no se desborda de lado');
    await t.screenshot({ path: path.join(OUT, '8-tableta-tactil.png') });
  }
  await ctxT.close();

  ok(errores.length === 0, 'sin errores de página' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
})().catch(async e => { console.log('FALLA: error en la prueba:', e.message); process.exitCode = 1; if (b) await b.close(); });
