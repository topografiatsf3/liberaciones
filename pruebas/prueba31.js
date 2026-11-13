// Versión 26: carpeta de OneDrive libre, pestaña «En proceso», la capa de la superficie XML sigue al renombrar,
// y Ajustes con elementos dentro del catálogo de tipos y estructuras/frentes con «⋯» (quitar, mover, desactivar).
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const { supXml } = require('./xml');
const OUT = path.join(__dirname, 'capturas', 'prueba31'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const D = f => path.join(__dirname, 'datos', f);
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const store = p => p.evaluate(() => window.__fakeStore());
const lib = (id, numero, pk0, pk1, extra) => ({ actividad: 'LIB', estado: 'EP', numero, creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', pkInicio: pk0, pkFin: pk1, descripcion: 'Filtro 1 capa 11 ' + id, nombreLiberacion: 'Filtro 1 capa 11 ' + id, fechaCampo: { __ts: Date.now() - 864e5 }, creadoEn: { __ts: Date.now() - 864e5 }, archivos: [], ...extra });
async function entrarComo(p, u) { await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(500); }
const esperar = (p, fn, arg) => p.waitForFunction(fn, arg, { timeout: 15000 }).catch(() => {});
async function subirXml(p, archivos) {
  await p.evaluate(() => { document.querySelector('.dlg.on #dXmlE').innerHTML = '<p>__esperando</p>'; });
  await p.setInputFiles('.dlg.on #dXml', archivos);
  await esperar(p, () => { const t = document.querySelector('.dlg.on #dXmlE')?.textContent || ''; return !/__esperando|Leyendo/.test(t); });
}
async function menu(p, sel, txt) { await p.click(sel); await p.waitForSelector('#ctx .ctx-i'); await p.click(`#ctx .ctx-i:has-text("${txt}")`); }
let b;
(async () => {
  b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  p.on('dialog', d => d.accept());
  await p.goto(URL);
  await p.evaluate(([A, d]) => {
    localStorage.clear();
    const capas = { tipos: { filtro1: { capas: [{ nombre: 'Capa 10' }, { nombre: 'Capa 11' }, { nombre: 'Capa 12' }], noAplica: [] } } };
    localStorage.setItem('__fakeDB', JSON.stringify({ 'capas/pp-oeste': capas, 'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', activo: true }, ...d }));
    localStorage.setItem('__fakeUser', JSON.stringify(A)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('modelo'));
  }, [ADMIN, { 'liberaciones/ep1': lib('ep1', 'SKT-TOP-02686', 2220, 2260), 'liberaciones/ep2': lib('ep2', 'SKT-TOP-02688', 2290, 2310, { carpeta: 'OneDrive\\Cargo 5' }), 'liberaciones/ep3': lib('ep3', 'SKT-TOP-02689', 2320, 2340) }]);
  await p.reload(); await p.waitForSelector('#nav button');
  await p.click('[data-v="panel"]'); await p.waitForSelector('#mBody');
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await p.waitForSelector('.dlg.on [type=submit]'); await p.waitForTimeout(250); await p.click('.dlg.on [type=submit]');
  await esperar(p, () => window.__fakeStore()['secciones/pp-oeste']);

  // 1. Gabinete: pestaña «En proceso» y entrega sin carpeta (solo el XML es obligatorio)
  await entrarComo(p, GAB);
  await p.click('[data-v="bandeja"]'); await p.waitForSelector('[data-bt="EP"]');
  ok(/^En proceso/.test((await p.textContent('[data-bt="EP"]')).trim()), 'la pestaña se llama «En proceso», como en Registros');
  await p.click('[data-bt="EP"]'); await p.waitForSelector('#blist tr[data-rid="ep1"]');
  await p.click('#blist tr[data-rid="ep1"] [data-a="entregar"]'); await p.waitForSelector('.dlg.on #dXml', { state: 'attached' });
  ok(/opcional/.test(await p.textContent('.dlg.on label[for="dCarpeta"]')), 'la carpeta de OneDrive dice «(opcional)»');
  await subirXml(p, supXml('SKT-TOP-02686', 'ep1.xml'));
  await p.click('.dlg.on [type=submit]'); await esperar(p, () => window.__fakeStore()['liberaciones/ep1']?.estado === 'EC');
  let st = await store(p);
  ok(st['liberaciones/ep1'].estado === 'EC' && st['liberaciones/ep1'].carpeta === undefined, 'se entrega sin carpeta');
  // En grupo sin carpeta: la que ya tenía ep2 se conserva
  await p.waitForSelector('#blist tr[data-rid="ep2"]'); await p.click('#bAll2'); await p.click('[data-bk="entregar"]'); await p.waitForSelector('.dlg.on #dXml', { state: 'attached' });
  ok((await p.inputValue('.dlg.on #dCarpeta')) === '', 'con carpetas distintas el campo queda vacío');
  await subirXml(p, [supXml('SKT-TOP-02688', 'ep2.xml'), supXml('SKT-TOP-02689', 'ep3.xml')]);
  await p.click('.dlg.on [type=submit]'); await esperar(p, () => ['ep2', 'ep3'].every(id => window.__fakeStore()['liberaciones/' + id]?.estado === 'EC'));
  st = await store(p);
  ok(st['liberaciones/ep2'].estado === 'EC' && st['liberaciones/ep2'].carpeta === 'OneDrive\\Cargo 5', 'entregar en grupo sin carpeta no borra la que ya tenía');
  ok(/No hay liberaciones en proceso/.test(await p.textContent('#blist')), 'la pestaña vacía dice «No hay liberaciones en proceso»');
  // Texto libre en la carpeta
  await p.click('[data-v="todos"]'); await p.waitForSelector('.rtab tr[data-id="ep1"]');
  await p.click('.rtab tr[data-id="ep1"] td:nth-child(4)'); await p.waitForSelector('#sheet.on');
  ok(!/Falta/.test(await p.textContent('#sheet dl.kv')), 'la ficha de un entregado sin carpeta ya no dice «Falta»');
  await p.click('#fCarpeta'); await p.waitForSelector('.dlg.on #dCarpeta');
  await p.fill('#dCarpeta', 'Pendiente: la sube Juan'); await p.click('.dlg.on [type=submit]');
  await esperar(p, () => window.__fakeStore()['liberaciones/ep1']?.carpeta === 'Pendiente: la sube Juan');
  ok((await store(p))['liberaciones/ep1'].carpeta === 'Pendiente: la sube Juan', 'la carpeta acepta cualquier texto');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // 2. Renombrar la capa en Ajustes → Capas: registros, superficie XML y acceso directo siguen al nombre nuevo
  await entrarComo(p, ADMIN);
  st = await store(p);
  const supId = st['liberaciones/ep1'].xmlEntrega[0].supId;
  ok(st['superficies/' + supId]?.capa === 'Capa 11', 'la superficie de ep1 quedó en «Capa 11»');
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="capas"]'); await p.waitForSelector('#cSub');
  await p.selectOption('#cSub', 'pp-oeste'); await p.waitForSelector('#cTipo'); await p.selectOption('#cTipo', 'filtro1'); await p.waitForSelector('.ct-row [data-k="nom"]');
  const fila = await p.$('.ct-row:has(input[data-k="nom"][value="Capa 11"]) [data-k="nom"]');
  await fila.fill('Capa 11A'); await fila.press('Enter');
  await esperar(p, id => window.__fakeStore()['superficies/' + id]?.capa === 'Capa 11A' && window.__fakeStore()['liberaciones/ep1']?.capa === 'Capa 11A', supId);
  st = await store(p);
  ok(['ep1', 'ep2', 'ep3'].every(id => st['liberaciones/' + id].capa === 'Capa 11A'), 'sus 3 registros pasan a «Capa 11A»');
  ok(st['superficies/' + supId].capa === 'Capa 11A' && st['superficies/' + supId].grupo === 'filtro1|Capa 11A', 'la superficie XML pasa a «Capa 11A»');
  ok(st['superficiesRes/pp-oeste'].r[supId][3] === 'Capa 11A', 'y su resumen del modelo también');
  ok(Object.keys(st).some(k => k.startsWith('historial/') && /Capa renombrada: Capa 11 → Capa 11A/.test(st[k].nota || '')), 'queda en el historial');
  await p.click('[data-v="todos"]'); await p.waitForSelector('.rtab tr[data-id="ep1"]');
  await p.click('.rtab tr[data-id="ep1"] td:nth-child(4)'); await p.waitForSelector('#sheet.on #fVerSup');
  await p.click('#fVerSup'); await p.waitForSelector('#mGrupo');
  await esperar(p, () => document.querySelector('#mGrupo')?.value === 'filtro1|Capa 11A');
  ok((await p.inputValue('#mGrupo')) === 'filtro1|Capa 11A', '«Ver en el modelo» abre la capa con su nombre nuevo');
  ok(!(await p.$$eval('#mGrupo option', o => o.map(x => x.value))).includes('filtro1|Capa 11'), 'y la capa vieja ya no aparece en el modelo');
  await p.screenshot({ path: path.join(OUT, '1-modelo-capa-nueva.png') });

  // 3. Ajustes → Tipos: elementos dentro del catálogo, agregar tipo en su grupo, quitar con «Deshacer»
  await p.setViewportSize({ width: 1100, height: 900 }); // Ajustes apilado (la lista y detalle de pantalla ancha va en prueba41)
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="tipos"]'); await p.waitForSelector('#tyList');
  await p.click('[data-tyv="cat"]').catch(() => {}); await p.waitForSelector('#tyList .elgrp');
  ok(!(await p.$('#elList')), 'los elementos ya no van en una tarjeta aparte');
  ok(await p.$$eval('#tyList .elgrp [data-k="enom"]', x => x.length) >= 2, 'cada elemento es un grupo con su nombre editable');
  await p.fill('#tyList .ty-add2[data-e="geo"] [data-k="tnew"]', 'Cuneta de prueba'); await p.click('#tyList .ty-add2[data-e="geo"] [data-k="tadd"]');
  await esperar(p, () => (window.__fakeStore()['listas/tipos']?.items || []).some(t => t.nombre === 'Cuneta de prueba'));
  let tipos = (await store(p))['listas/tipos'].items, nuevo = tipos.find(t => t.nombre === 'Cuneta de prueba');
  ok(nuevo && nuevo.elementoId === 'geo', 'el tipo nuevo se agrega en el grupo de su elemento (Geosintéticos)');
  await p.waitForSelector(`#tyList [data-id="${nuevo.id}"]`);
  await esperar(p, id => /sin registros/.test(document.querySelector(`#tyList [data-id="${id}"] .tyuso`)?.textContent || ''), nuevo.id);
  await menu(p, `#tyList [data-id="${nuevo.id}"] [data-k="mas"]`, 'Quitar de la lista');
  await esperar(p, id => !(window.__fakeStore()['listas/tipos']?.items || []).some(t => t.id === id), nuevo.id);
  ok(!(await store(p))['listas/tipos'].items.some(t => t.id === nuevo.id), '«⋯ → Quitar de la lista» quita un tipo sin registros');
  await p.waitForSelector('#toast .toast-btn'); await p.click('#toast .toast-btn');
  await esperar(p, id => (window.__fakeStore()['listas/tipos']?.items || []).some(t => t.id === id), nuevo.id);
  ok((await store(p))['listas/tipos'].items.some(t => t.id === nuevo.id), '«Deshacer» lo devuelve');
  await p.waitForSelector('#tyList [data-id="filtro1"] [data-k="mas"]');
  await p.click('#tyList [data-id="filtro1"] [data-k="mas"]'); await p.waitForSelector('#ctx .ctx-i');
  ok(!(await p.$('#ctx .ctx-i:has-text("Quitar")')), 'un tipo con registros no ofrece «Quitar», solo desactivar o unir');
  await p.keyboard.press('Escape');
  // Elemento nuevo, renombrar y quitar
  await p.fill('#elNom', 'Señalización'); await p.click('#elAdd');
  await esperar(p, () => (window.__fakeStore()['listas/elementos']?.items || []).some(e => e.nombre === 'Señalización'));
  const el = (await store(p))['listas/elementos'].items.find(e => e.nombre === 'Señalización');
  await p.waitForSelector(`#tyList .elgrp[data-e="${el.id}"]`);
  ok(!!el && !!(await p.$(`#tyList .ty-add2[data-e="${el.id}"]`)), 'un elemento sin tipos también aparece, listo para agregarle tipos');
  const en = await p.$(`#tyList .elgrp[data-e="${el.id}"] [data-k="enom"]`); await en.fill('Señalización vial'); await en.press('Enter');
  await esperar(p, id => (window.__fakeStore()['listas/elementos']?.items || []).find(e => e.id === id)?.nombre === 'Señalización vial', el.id);
  ok((await store(p))['listas/elementos'].items.find(e => e.id === el.id).nombre === 'Señalización vial', 'el elemento se renombra escribiendo encima (mismo id)');
  await menu(p, `#tyList .elgrp[data-e="${el.id}"] [data-k="emas"]`, 'Quitar de la lista');
  await esperar(p, id => !(window.__fakeStore()['listas/elementos']?.items || []).some(e => e.id === id), el.id);
  ok(!(await store(p))['listas/elementos'].items.some(e => e.id === el.id), 'un elemento vacío se quita desde «⋯»');
  await p.screenshot({ path: path.join(OUT, '2-tipos.png'), fullPage: true });

  // 4. Ajustes → Lugares: por id, quitar un frente vacío, bloquear uno con registros, mover y desactivar con «Deshacer»
  await p.click('[data-tab="lugares"]'); await p.waitForSelector('.est[data-e="pp"]');
  await p.fill('.est[data-e="pan"] [data-k="snew"]', 'Frente temporal'); await p.click('.est[data-e="pan"] [data-k="sadd"]');
  await esperar(p, () => (window.__fakeStore()['listas/estructuras']?.items || []).find(e => e.id === 'pan')?.subs.some(s => s.nombre === 'Frente temporal'));
  const tmp = (await store(p))['listas/estructuras'].items.find(e => e.id === 'pan').subs.find(s => s.nombre === 'Frente temporal');
  ok(!!tmp, 'se agrega un frente a su estructura');
  await p.waitForSelector(`.est[data-e="pan"] [data-s="${tmp.id}"]`);
  await menu(p, `.est[data-e="pan"] [data-s="${tmp.id}"] [data-k="smas"]`, 'Quitar frente');
  await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]');
  await esperar(p, id => !(window.__fakeStore()['listas/estructuras']?.items || []).find(e => e.id === 'pan')?.subs.some(s => s.id === id), tmp.id);
  ok(!(await store(p))['listas/estructuras'].items.find(e => e.id === 'pan').subs.some(s => s.id === tmp.id), 'un frente sin registros se quita');
  await p.click('.est[data-e="pp"] [data-s="pp-oeste"] [data-k="smas"]'); await p.waitForSelector('#ctx .ctx-i');
  ok(!(await p.$('#ctx .ctx-i:has-text("Quitar")')) && !!(await p.$('#ctx .ctx-i:has-text("Desactivar")')), 'un frente con registros no ofrece «Quitar», solo desactivar');
  await p.keyboard.press('Escape');
  // Teclado: «Subir eje» se alcanza con Tab
  await p.focus('.est[data-e="pp"] [data-s="pp-este"] [data-k="smax"]'); await p.keyboard.press('Tab');
  ok(await p.evaluate(() => document.activeElement?.dataset?.eje === 'pp-este'), '«Subir eje» se alcanza con Tab (teclado)');
  // Mover «pao» a Presa Principal
  await menu(p, '.est[data-e="pao"] [data-s="pao"] [data-k="smas"]', 'Mover a otra estructura');
  await p.waitForSelector('.dlg.on #dMovE'); await p.selectOption('.dlg.on #dMovE', 'pp'); await p.click('.dlg.on [type=submit]');
  await esperar(p, () => (window.__fakeStore()['listas/estructuras']?.items || []).find(e => e.id === 'pp')?.subs.some(s => s.id === 'pao'));
  st = await store(p);
  ok(st['listas/estructuras'].items.find(e => e.id === 'pp').subs.some(s => s.id === 'pao') && !st['listas/estructuras'].items.find(e => e.id === 'pao').subs.some(s => s.id === 'pao'), '«Mover a otra estructura» pasa el frente');
  // Desactivar con «Deshacer»
  await menu(p, '.est[data-e="pan"] [data-k="emas"]', 'Desactivar');
  await esperar(p, () => (window.__fakeStore()['listas/estructuras']?.items || []).find(e => e.id === 'pan')?.activo === false);
  ok((await store(p))['listas/estructuras'].items.find(e => e.id === 'pan').activo === false, 'desactivar una estructura no pide confirmar');
  ok(!(await p.$('.est[data-e="pan"]')), 'y se oculta de la lista');
  await p.waitForSelector('#toast .toast-btn'); await p.click('#toast .toast-btn');
  await esperar(p, () => (window.__fakeStore()['listas/estructuras']?.items || []).find(e => e.id === 'pan')?.activo !== false);
  ok((await store(p))['listas/estructuras'].items.find(e => e.id === 'pan').activo !== false, '«Deshacer» la vuelve a activar');
  // Renombrar después de otro cambio: se parte de la lista actual, no de una copia vieja
  const sn = await p.$('.est[data-e="pp"] [data-s="pp-este"] [data-k="snom"]'); await sn.fill('Presa Principal Este (nuevo)'); await sn.press('Enter');
  await esperar(p, () => (window.__fakeStore()['listas/estructuras']?.items || []).find(e => e.id === 'pp')?.subs.find(s => s.id === 'pp-este')?.nombre === 'Presa Principal Este (nuevo)');
  st = await store(p);
  ok(st['listas/estructuras'].items.find(e => e.id === 'pp').subs.some(s => s.id === 'pao'), 'renombrar después de mover no deshace el movimiento (se parte de la lista actual)');
  await p.screenshot({ path: path.join(OUT, '3-lugares.png'), fullPage: true });
  // Celular: nada se sale de la pantalla
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Lugares cabe en el celular sin desplazarse a los lados');
  await p.screenshot({ path: path.join(OUT, '4-lugares-celular.png'), fullPage: true });
  await p.click('[data-tab="tipos"]'); await p.waitForSelector('#tyList .elgrp'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Tipos cabe en el celular sin desplazarse a los lados');
  await p.screenshot({ path: path.join(OUT, '5-tipos-celular.png'), fullPage: true });

  ok(!errores.length, 'sin errores de la página: ' + errores.join(' | '));
  await b.close();
})().catch(async e => { console.log('FALLA:', e.message); process.exitCode = 1; await b?.close(); });
