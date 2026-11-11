// Jornada completa (versión 26), de punta a punta y con cada rol, como se trabaja en obra:
// administrador arma tipo y capa → operario registra → gabinete acepta y observa → operario corrige →
// gabinete re-acepta y entrega a Calidad con XML y sin carpeta → ficha con las fechas correctas →
// se renombra la capa y el tipo, y «Ver en el modelo» muestra los nombres nuevos.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const { tipo } = require('./filtros');
const { supXml } = require('./xml');
const OUT = path.join(__dirname, 'capturas', 'prueba33'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const D = f => path.join(__dirname, 'datos', f);
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const store = p => p.evaluate(() => window.__fakeStore());
const esperar = (p, fn, arg, t = 15000) => p.waitForFunction(fn, arg, { timeout: t }).catch(() => {});
const reg = (p, desc) => p.evaluate(d => { const s = window.__fakeStore(); const k = Object.keys(s).find(k => k.startsWith('liberaciones/') && (s[k].descripcion || '') === d); return k ? { id: k.split('/')[1], ...s[k] } : null; }, desc);
async function entrarComo(p, u) { await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(400); }
async function registrar(p, o) {
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])');
  await p.selectOption('#iTopo', 'AB'); await p.selectOption('#iEst', 'pp'); await p.selectOption('#iSub', 'pp-oeste'); await tipo(p, o.tipo);
  await p.fill('#iPk1', o.a); await p.fill('#iPk2', o.b); await p.fill('#iCapa', o.capa); await p.fill('#iDesc', o.d);
  await p.click('#bGuardar'); await esperar(p, d => Object.values(window.__fakeStore()).some(x => x && x.descripcion === d), o.d);
}
async function subirXml(p, archivos) {
  await p.evaluate(() => { document.querySelector('.dlg.on #dXmlE').innerHTML = '<p>__esperando</p>'; });
  await p.setInputFiles('.dlg.on #dXml', archivos);
  await esperar(p, () => !/__esperando|Leyendo/.test(document.querySelector('.dlg.on #dXmlE')?.textContent || ''));
}
let b;
(async () => {
  b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([A, d]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(A)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('modelo')); },
    [ADMIN, { 'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true }, 'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', activo: true } }]);
  await p.reload(); await p.waitForSelector('#nav button');

  // 1. Administrador: eje del frente, tipo nuevo en su elemento y su capa
  await p.click('#nav [data-v="panel"]'); await p.waitForSelector('#mBody');
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await p.waitForSelector('.dlg.on [type=submit]'); await p.waitForTimeout(250); await p.click('.dlg.on [type=submit]');
  await esperar(p, () => window.__fakeStore()['secciones/pp-oeste']);
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="tipos"]'); await p.waitForSelector('#tyList .elgrp');
  await p.click('[data-tyv="cat"]').catch(() => {});
  await p.fill('#tyList .ty-add2[data-e="mt"] [data-k="tnew"]', 'Relleno de jornada'); await p.click('#tyList .ty-add2[data-e="mt"] [data-k="tadd"]');
  await esperar(p, () => (window.__fakeStore()['listas/tipos']?.items || []).some(t => t.nombre === 'Relleno de jornada'));
  const T = (await store(p))['listas/tipos'].items.find(t => t.nombre === 'Relleno de jornada');
  ok(T && T.elementoId === 'mt' && T.enGrafico, 'el administrador agrega el tipo «Relleno de jornada» en Movimiento de tierras');
  await p.click('[data-tab="capas"]'); await p.waitForSelector('#cSub'); await p.selectOption('#cSub', 'pp-oeste'); await p.waitForSelector('#cTipo'); await p.selectOption('#cTipo', T.id);
  await p.fill('#cNom', 'Capa 5'); await p.click('#cAdd');
  await esperar(p, t => (window.__fakeStore()['capas/pp-oeste']?.tipos?.[t]?.capas || []).some(c => c.nombre === 'Capa 5'), T.id);
  ok(((await store(p))['capas/pp-oeste']?.tipos?.[T.id]?.capas || []).some(c => c.nombre === 'Capa 5'), 'y su «Capa 5» en el frente');

  // 2. Operario registra dos tramos con el tipo nuevo
  await entrarComo(p, OPER);
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])');
  ok((await p.textContent('label[for="iFecha"]')).trim() === 'Fecha y hora de liberación', 'el formulario pide «Fecha y hora de liberación»');
  const hoy = new Date(), p2 = n => String(n).padStart(2, '0');
  ok((await p.inputValue('#iFecha')).startsWith(`${hoy.getFullYear()}-${p2(hoy.getMonth() + 1)}-${p2(hoy.getDate())}`), 'y la fecha es la de hoy');
  await registrar(p, { tipo: T.id, a: '2+220', b: '2+260', capa: 'Capa 5', d: 'Jornada uno' });
  await registrar(p, { tipo: T.id, a: '2+290', b: '2+310', capa: 'Capa 5', d: 'Jornada dos' });
  const r1 = await reg(p, 'Jornada uno'), r2 = await reg(p, 'Jornada dos');
  ok(r1?.estado === 'PT' && r2?.estado === 'PT' && r1.tipoId === T.id && r1.capa === 'Capa 5', 'quedan 2 registros pendientes con el tipo y la capa');

  // 3. Gabinete acepta uno y observa el otro
  await entrarComo(p, GAB);
  await p.click('#nav [data-v="bandeja"]'); await p.click('[data-bt="PT"]'); await p.waitForSelector(`#blist [data-rid="${r1.id}"]`);
  await p.click(`#blist [data-rid="${r1.id}"] [data-a="aceptar"]`); await p.waitForSelector('.dlg.on'); await p.waitForTimeout(200); await p.keyboard.press('Enter');
  await esperar(p, id => window.__fakeStore()['liberaciones/' + id]?.estado === 'EP', r1.id);
  const cod1 = (await store(p))['liberaciones/' + r1.id].numero;
  ok(/SKT-TOP-\d+/.test(cod1), 'gabinete acepta «Jornada uno» con código ' + cod1);
  await p.click(`#blist [data-rid="${r2.id}"] td:nth-child(3)`).catch(() => p.click(`#blist [data-rid="${r2.id}"]`)); await p.waitForSelector('#sheet.on #fObservar');
  await p.click('#fObservar'); await p.waitForSelector('.dlg.on #dNota'); await p.fill('#dNota', 'El PK final es 2+305'); await p.click('.dlg.on [type=submit]');
  await esperar(p, id => window.__fakeStore()['liberaciones/' + id]?.estado === 'OB', r2.id);
  ok((await store(p))['liberaciones/' + r2.id].estado === 'OB', 'y observa «Jornada dos» con una nota');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // 4. Operario corrige lo observado
  await entrarComo(p, OPER);
  await p.click('#nav [data-v="mis"]'); await p.waitForSelector('.item');
  await p.click('.item:has-text("Jornada dos")'); await p.waitForSelector('#sheet.on #fEditar'); await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])');
  ok(/El PK final es 2\+305/.test(await p.textContent('#view')), 'al editar ve la nota de gabinete');
  await p.fill('#iPk2', '2+305'); await p.click('#bGuardar');
  await esperar(p, id => window.__fakeStore()['liberaciones/' + id]?.estado === 'PT', r2.id);
  ok((await store(p))['liberaciones/' + r2.id].pkFin === 2305, 'el operario corrige y vuelve a pendiente');

  // 5. Gabinete re-acepta y entrega los dos a Calidad (con XML, sin carpeta)
  await entrarComo(p, GAB);
  await p.click('#nav [data-v="bandeja"]'); await p.click('[data-bt="PT"]'); await p.waitForSelector(`#blist [data-rid="${r2.id}"]`);
  ok(!!(await p.$(`#blist [data-rid="${r2.id}"] .st-corr`)), 'la Bandeja lo marca «Corregido»');
  await p.click(`#blist [data-rid="${r2.id}"] [data-a="aceptar"]`); await p.waitForSelector('.dlg.on'); await p.waitForTimeout(200); await p.keyboard.press('Enter');
  await esperar(p, id => window.__fakeStore()['liberaciones/' + id]?.estado === 'EP', r2.id);
  const cod2 = (await store(p))['liberaciones/' + r2.id].numero;
  ok(/^En proceso\s*2/.test((await p.textContent('[data-bt="EP"]')).trim()), 'la pestaña «En proceso» cuenta 2');
  await p.click('[data-bt="EP"]'); await p.waitForSelector(`#blist [data-rid="${r2.id}"]`);
  await p.click('#bAll2'); await p.click('[data-bk="entregar"]'); await p.waitForSelector('.dlg.on #dXml', { state: 'attached' });
  await subirXml(p, [supXml(cod1, 'uno.xml'), supXml(cod2, 'dos.xml')]);
  await p.click('.dlg.on [type=submit]');
  await esperar(p, ids => ids.every(id => window.__fakeStore()['liberaciones/' + id]?.estado === 'EC'), [r1.id, r2.id]);
  let st = await store(p);
  ok([r1.id, r2.id].every(id => st['liberaciones/' + id].estado === 'EC' && st['liberaciones/' + id].carpeta === undefined), 'los dos se entregan a Calidad sin carpeta (es opcional)');
  ok([r1.id, r2.id].every(id => (st['liberaciones/' + id].xmlEntrega || []).length === 1), 'cada uno con su XML de superficie');

  // 6. La ficha muestra las tres fechas con sus nombres nuevos
  await p.click('#nav [data-v="todos"]'); await p.waitForSelector(`.rtab tr[data-id="${r1.id}"]`);
  await p.click(`.rtab tr[data-id="${r1.id}"] td:nth-child(4)`); await p.waitForSelector('#sheet.on');
  const dts = await p.$$eval('#sheet dl.kv dt', x => x.map(d => d.textContent));
  ok(['Fecha de liberación', 'Fecha de entrega', 'Entrega a Calidad'].every(t => dts.includes(t)), 'la ficha muestra «Fecha de liberación», «Fecha de entrega» y «Entrega a Calidad»');
  ok(!dts.includes('Carpeta OneDrive') && !/Falta/.test(await p.textContent('#sheet dl.kv')), 'sin carpeta no aparece «Falta»');
  await p.screenshot({ path: path.join(OUT, '1-ficha-entregada.png') });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // 7. Administrador renombra la capa y el tipo: la superficie y el acceso directo los siguen
  await entrarComo(p, ADMIN);
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="capas"]'); await p.waitForSelector('#cSub');
  await p.selectOption('#cSub', 'pp-oeste'); await p.selectOption('#cTipo', T.id); await p.waitForSelector('.ct-row [data-k="nom"]');
  const fila = await p.$('.ct-row:has(input[data-k="nom"][value="Capa 5"]) [data-k="nom"]'); await fila.fill('Capa 5B'); await fila.press('Enter');
  const sup1 = st['liberaciones/' + r1.id].xmlEntrega[0].supId;
  await esperar(p, id => window.__fakeStore()['superficies/' + id]?.capa === 'Capa 5B', sup1);
  st = await store(p);
  ok([r1.id, r2.id].every(id => st['liberaciones/' + id].capa === 'Capa 5B') && st['superficies/' + sup1].capa === 'Capa 5B', 'renombrar la capa pasa los 2 registros y su superficie a «Capa 5B»');
  await p.click('[data-tab="tipos"]'); await p.waitForSelector(`#tyList [data-id="${T.id}"] [data-k="nom"]`);
  const tn = await p.$(`#tyList [data-id="${T.id}"] [data-k="nom"]`); await tn.fill('Relleno de jornada final'); await tn.press('Enter');
  await esperar(p, id => (window.__fakeStore()['listas/tipos']?.items || []).find(t => t.id === id)?.nombre === 'Relleno de jornada final', T.id);
  await p.click('#nav [data-v="todos"]'); await p.waitForSelector(`.rtab tr[data-id="${r1.id}"]`);
  await p.click(`.rtab tr[data-id="${r1.id}"] td:nth-child(4)`); await p.waitForSelector('#sheet.on #fVerSup');
  await p.click('#fVerSup'); await p.waitForSelector('#mGrupo');
  await esperar(p, g => document.querySelector('#mGrupo')?.value === g, T.id + '|Capa 5B');
  ok((await p.inputValue('#mGrupo')) === T.id + '|Capa 5B', '«Ver en el modelo» abre la capa «Capa 5B»');
  ok(/Relleno de jornada final · Capa 5B/.test(await p.textContent('#mBody .chart-t')), 'y la ruta dice el nombre nuevo del tipo y de la capa: ' + await p.textContent('#mBody .chart-t'));
  await p.screenshot({ path: path.join(OUT, '2-modelo.png') });
  await p.click('#nav [data-v="todos"]'); await p.waitForSelector('#rSup'); await p.click('#rSup'); await p.waitForSelector('#mGrupo');
  ok(!(await p.$$eval('#mGrupo option', o => o.map(x => x.textContent))).some(t => /Capa 5$/.test(t)), 'el acceso directo «Superficies (XML)» ya no muestra la capa vieja');

  ok(!errores.length, 'sin errores de la página: ' + errores.join(' | '));
  await b.close();
})().catch(async e => { console.log('FALLA:', e.message); process.exitCode = 1; await b?.close(); });
