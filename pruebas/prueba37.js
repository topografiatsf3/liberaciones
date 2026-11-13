// Versión 30: importaciones mes a mes desde el Excel de protocolos, sin tocar nunca lo hecho en la app.
// Respaldo, quitar lo importado antes (conservando lo trabajado en la app), leer el .xlsx, emparejar frentes y tipos,
// vista previa (nuevos, se actualizan, no se tocan), importar con nombre, ver una importación en Registros,
// una segunda carga por CSV, quitar solo una importación y reimportar sin duplicar. Todo con datos inventados.
const { chromium, devices } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const FAKE = path.join(__dirname, 'fake');
const OUT = path.join(__dirname, 'capturas', 'prueba37'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const XLSX = path.join(__dirname, 'datos', 'excel-prueba.xlsx');
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
async function preparar(ctx) {
  await ctx.addInitScript(() => { window.__autoConf = true; new MutationObserver(() => { const f = document.querySelector('.dlg.on form:has(.dlg-p)'); if (f && !f.dataset.auto) { f.dataset.auto = 1; setTimeout(() => f.querySelector('[type=submit]').click(), 30); } }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(FAKE, f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
}
const T = (y, m, d) => ({ __ts: new Date(y, m - 1, d, 12).getTime() });
const viejo = (n, extra = {}) => ({ numero: 'SKT-TOP-0' + n, actividad: 'LIB', estado: 'EC', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'stn', pkInicio: 10, pkFin: 20, capa: '', cota: '',
  descripcion: 'importado antes ' + n, topografoId: 'CS', fechaCampo: T(2025, 12, 1), fechaLiberacion: T(2025, 12, 1), fechaEntrega: T(2025, 12, 2), creadoPor: 'importado', origen: 'excel', archivos: [], linksCsv: [], linksFotos: [], ...extra });

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); await preparar(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errores.push(m.text()); });
  await p.goto(URL); await p.evaluate(() => localStorage.clear());
  await p.evaluate(u => localStorage.setItem('__fakeUser', JSON.stringify(u)), ADMIN);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(500);
  // Datos de partida: lo importado antes (sin nombre de importación) y lo hecho en la app
  await p.evaluate(({ docs }) => { const db = JSON.parse(localStorage.getItem('__fakeDB') || '{}'); Object.assign(db, docs); localStorage.setItem('__fakeDB', JSON.stringify(db)); }, { docs: {
    'liberaciones/xl-02808': viejo('2808', { descripcion: 'viejo entregado en la app', pkInicio: 100, pkFin: 140 }),
    'historial/h1': { liberacionId: 'xl-02808', accion: 'estado', de: 'EP', a: 'EC', usuario: 'gab@prueba.pe', fecha: T(2026, 1, 20), nota: '' },
    'liberaciones/xl-02809': viejo('2809'),
    'liberaciones/xl-02700': viejo('2700'),
    'liberaciones/xl-02701': viejo('2701', { carpeta: 'Entregas/enero' }),
    'liberaciones/xl-02702': viejo('2702'),
    'historial/h2': { liberacionId: 'xl-02702', accion: 'editado', usuario: 'a@prueba.pe', fecha: T(2026, 1, 21), nota: 'Capa renombrada: Capa 1 → Capa 01' },
    'liberaciones/app1': { ...viejo('2807'), descripcion: 'registrado en la app', pkInicio: 500, pkFin: 540, creadoPor: 'topo@prueba.pe', origen: 'app' },
    'liberaciones/app2': { ...viejo('0000'), numero: '', estado: 'PT', descripcion: 'pendiente en la app', creadoPor: 'topo@prueba.pe', origen: 'app', fechaEntrega: null, fechaLiberacion: null },
    'contadores/skt': { ultimo: 2805 }
  } });
  await p.reload(); await p.waitForSelector('#nav button');
  const st = () => p.evaluate(() => window.__fakeStore());
  const lib = async id => (await st())['liberaciones/' + id];
  const irHist = async () => { await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="historico"]'); await p.waitForSelector('#hFile', { state: 'attached' }); };
  await irHist();
  await p.waitForFunction(() => /Importado antes/.test(document.querySelector('#hLotes').textContent));
  ok(true, 'la lista de importaciones muestra lo importado antes, sin nombre');

  // 1. Respaldo completo
  const [dR] = await Promise.all([p.waitForEvent('download'), p.click('#hResp')]);
  const resp = JSON.parse(fs.readFileSync(await dR.path(), 'utf8'));
  ok(resp.liberaciones.length === 7 && resp.historial.length === 2 && resp.contadores.length === 1, `respaldo con ${resp.liberaciones.length} registros, historial y correlativo`);

  // 2. Quitar todo lo importado antes: se conservan los trabajados en la app y lo de la app
  const [dQ] = await Promise.all([p.waitForEvent('download'), p.click('#hBorrar')]);
  await p.waitForFunction(() => /Listo/.test(document.querySelector('#hEst2').textContent), null, { timeout: 30000 });
  const copia = JSON.parse(fs.readFileSync(await dQ.path(), 'utf8'));
  ok(copia.registros.length === 3, 'antes de quitar se descarga la copia de lo que se quita (' + copia.registros.length + ')');
  ok(!(await lib('xl-02700')) && !(await lib('xl-02809')) && !(await lib('xl-02702')), 'se quitan los importados sin tocar (también el de solo un cambio de nombre de capa)');
  ok(!!(await lib('xl-02808')) && !!(await lib('xl-02701')), 'se conservan los importados que se trabajaron en la app (entregado, con carpeta)');
  ok(!!(await lib('app1')) && !!(await lib('app2')), 'lo registrado en la app no se toca');
  ok(/se conservaron/.test(await p.textContent('#hEst2')), 'avisa cuántos se conservaron: ' + (await p.textContent('#hEst2')).trim());

  // 3. Leer el Excel y emparejar lo que no está en las listas
  await p.setInputFiles('#hFile', XLSX);
  await p.waitForSelector('#hRes .imp-par select');
  const faltan = await p.$$eval('#hRes .imp-par select', s => s.map(x => x.dataset.raw));
  ok(faltan.length === 3 && faltan.includes('Frente Inventado') && faltan.includes('Despliegue de Geomembrana') && faltan.includes('Relleno en zanja'),
    'pide emparejar el frente desconocido y los tipos de otro elemento: ' + faltan.join(', '));
  ok(await p.$eval('#hImp', x => x.disabled), 'no deja importar sin emparejar');
  await p.screenshot({ path: OUT + '/01-emparejar.png', fullPage: true });
  await p.selectOption('select[data-raw="Frente Inventado"]', 'pp-sur');
  await p.selectOption('select[data-raw="Despliegue de Geomembrana"]', '+');
  await p.selectOption('select[data-raw="Relleno en zanja"]', 'relleno-zanja');
  await p.waitForSelector('#hCuenta', { timeout: 20000 });
  const cuenta = await p.textContent('#hCuenta');
  ok(/9 nuevos/.test(cuenta) && /2 no se tocan/.test(cuenta), 'vista previa: ' + cuenta.replace(/\s+/g, ' ').trim());
  const res = await p.textContent('#hRes');
  ok(/dicen algo distinto/.test(res), 'muestra lo que el archivo dice distinto de lo que hay en la app');
  ok(/Capa: 30|capa se tomó de la descripción/.test(res) && /QX/.test(res) && /sube de SKT-TOP-02805 a SKT-TOP-02810/.test(res), 'avisa capa de la descripción, clave nueva y correlativo');
  ok(/Cómo se leyó el archivo/.test(res), 'se puede revisar cómo se leyó cada frente y tipo');
  await p.screenshot({ path: OUT + '/02-vista-previa.png', fullPage: true });
  await p.fill('#hNombre', 'Mes de prueba 1'); await p.press('#hNombre', 'Tab');
  await p.click('#hImp');
  await p.waitForFunction(() => /Listo/.test(document.querySelector('#hEst').textContent), null, { timeout: 30000 });
  ok(true, (await p.textContent('#hEst')).trim());
  await p.waitForSelector('#hCuenta');
  const tras = (await p.textContent('#hCuenta')).replace(/\s+/g, ' ');
  ok(/0 nuevos/.test(tras) && /0 se actualizan/.test(tras), 'después de importar, el mismo archivo ya no tiene nada que escribir (el tipo creado no se vuelve a crear): ' + tras.trim());
  const s1 = await st(), L1 = s1['config/importaciones'].items;
  ok(L1.length === 1 && L1[0].nombre === 'Mes de prueba 1' && L1[0].n === 9, 'queda la importación «Mes de prueba 1» con 9 registros');
  const lote1 = L1[0].id, r = id => s1['liberaciones/' + id];
  ok(r('xl-02800').lote === lote1 && r('xl-02800').origen === 'excel' && r('xl-02800').estado === 'EC', 'cada registro lleva su importación');
  ok(new Date(r('xl-02800').fechaCampo.__ts).getDate() === 5 && new Date(r('xl-02800').fechaEntrega.__ts).getDate() === 6, 'fechas del Excel en su día');
  ok(r('xl-02801').capa === 'Capa 12' && r('xl-02801').cota === 'Variable', 'capa y cota tomadas de la descripción');
  const tNuevo = s1['listas/tipos'].items.find(t => t.nombre === 'Despliegue de Geomembrana');
  ok(tNuevo && tNuevo.elementoId === 'mt' && r('xl-02802').tipoId === tNuevo.id, 'tipo nuevo creado en Movimiento de tierras');
  ok(r('xl-02803').tipoId === 'relleno-zanja' && r('xl-02803').pkFin === 380.5 && r('xl-02804').subestructuraId === 'pp-sur', 'tipo y frente elegidos a mano');
  ok(r('xl-02805').subestructuraId === 'cas-01' && r('xl-02805').pkInicio === null && r('xl-02805').tipoId === 'ubicacion', 'caseta sin progresiva («N/A»)');
  ok(r('xl-02810').estado === 'EP', 'sin fecha de entrega queda «En proceso»');
  ok(r('app1').pkInicio === 500 && !r('app1').lote && r('app1').descripcion === 'registrado en la app', 'el código repetido de la app no se tocó');
  ok(r('xl-02808').descripcion === 'viejo entregado en la app' && !r('xl-02808').lote, 'el importado trabajado en la app no se tocó');
  ok(s1['listas/topografos'].items.some(t => t.id === 'QX') && s1['contadores/skt'].ultimo === 2810, 'clave QX agregada y correlativo en 2810');
  ok(!Object.keys(s1).some(k => k.startsWith('liberaciones/') && s1[k].numero === '' && s1[k].origen === 'excel'), 'la fila sin código no se cargó');
  const enRes = id => Object.keys(s1).some(k => k.startsWith('resumen/') && s1[k].r && s1[k].r[id]);
  ok(enRes('xl-02800') && enRes('xl-02804'), 'los importados entran al resumen del panel');

  // 4. Ver solo esa importación en Registros
  await p.waitForSelector('#hLotes [data-lote="' + lote1 + '"]');
  await p.click(`#hLotes [data-lote="${lote1}"] [data-lk="ver"]`);
  await p.waitForFunction(() => /9 registros/.test(document.querySelector('.imp-ver')?.textContent || ''), null, { timeout: 15000 });
  ok(await p.$$eval('#lista tbody tr', t => t.length) === 9, 'Registros muestra solo los 9 de esa importación');
  await p.screenshot({ path: OUT + '/03-ver-importacion.png', fullPage: true });
  await p.click('#rLoteX'); await p.waitForTimeout(300);
  ok(!(await p.$('.imp-ver')), '«Ver todos los registros» vuelve a la lista completa');

  // 5. Segunda carga (otro mes) por CSV: dos nuevos y uno que se corrige
  const csv = path.join(os.tmpdir(), 'excel-prueba-2.csv');
  fs.writeFileSync(csv, '﻿N° Registro;Key_Topografo;Descripcion;Km Inicio;Km Fin;Fecha Liberacion;Fecha de entrega;Estructura;Sub-Estructura;Elemento;Tipo de Liberacion\r\n'
    + 'SKT-TOP-02800;CS;Superficie de terreno nivelado de prueba;100;145;05/01/2026;06/01/2026;Presa Principal;Presa Principal Oeste;Movimiento de tierras;Superficie Terreno Nivelado\r\n'
    + 'SKT-TOP-02811;CS;Febrero 1;0+400;0+440;03/02/2026;04/02/2026;Presa Principal;Presa Principal Oeste;Movimiento de tierras;Superficie Terreno Nivelado\r\n'
    + 'SKT-TOP-02812;CS;Febrero 2;0+440;0+480;03/02/2026;04/02/2026;Presa Principal;Presa Principal Oeste;Movimiento de tierras;Superficie Terreno Nivelado\r\n'
    + 'SKT-GEO-02813;CS;De otra obra;0+480;0+500;03/02/2026;04/02/2026;Presa Principal;Presa Principal Oeste;Movimiento de tierras;Superficie Terreno Nivelado\r\n');
  await irHist(); await p.setInputFiles('#hFile', csv); await p.waitForFunction(() => !document.querySelector('#hLeyendo') && /excel-prueba-2\.csv/.test(document.querySelector('#hRes').textContent) && document.querySelector('#hCuenta'), null, { timeout: 20000 });
  const c2 = await p.textContent('#hCuenta');
  ok(/2 nuevos/.test(c2) && /1 se actualizan/.test(c2), 'CSV: ' + c2.replace(/\s+/g, ' ').trim());
  ok(/no es de esta obra/.test(await p.textContent('#hRes')), 'un código con otro prefijo (SKT-GEO-) no se carga y se avisa');
  await p.fill('#hNombre', 'Mes de prueba 2'); await p.press('#hNombre', 'Tab');
  await p.click('#hImp'); await p.waitForFunction(() => /Listo/.test(document.querySelector('#hEst').textContent), null, { timeout: 30000 });
  let s2 = await st(); const L2 = s2['config/importaciones'].items, lote2 = L2.find(x => x.nombre === 'Mes de prueba 2').id;
  ok(L2.find(x => x.id === lote1).n === 8 && L2.find(x => x.id === lote2).n === 3, 'el corregido pasa a la importación nueva (8 y 3)');
  ok(s2['liberaciones/xl-02800'].lote === lote2 && s2['liberaciones/xl-02800'].pkFin === 145 && s2['liberaciones/xl-02811'].pkInicio === 400, 'se actualiza el corregido y entran los nuevos');

  // 6. Lo que se trabaja en la app después de importar queda protegido
  await p.evaluate(() => { const s = window.__fakeStore(); s['historial/h3'] = { liberacionId: 'xl-02801', accion: 'editado', usuario: 'a@prueba.pe', fecha: { __ts: Date.now() }, nota: 'Carpeta OneDrive: x' }; s['historial/h4'] = { liberacionId: 'xl-02811', accion: 'estado', de: 'EP', a: 'EC', usuario: 'gab@prueba.pe', fecha: { __ts: Date.now() }, nota: '' }; });
  await Promise.all([p.waitForEvent('download'), p.click(`#hLotes [data-lote="${lote1}"] [data-lk="quitar"]`)]);
  await p.waitForFunction(() => /Listo/.test(document.querySelector('#hEst2').textContent), null, { timeout: 30000 });
  s2 = await st();
  const hay = id => !!s2['liberaciones/' + id];
  ok(!hay('xl-02802') && !hay('xl-02803') && !hay('xl-02810') && hay('xl-02801'), 'quitar «Mes de prueba 1» borra los suyos y conserva el trabajado en la app');
  ok(hay('xl-02800') && hay('xl-02811') && hay('xl-02812'), 'la otra importación no se toca');
  ok(hay('app1') && hay('app2') && hay('xl-02808') && hay('xl-02701'), 'lo de la app y lo conservado antes siguen');
  ok(!Object.keys(s2).some(k => k.startsWith('resumen/') && s2[k].r && s2[k].r['xl-02802']), 'lo quitado sale del resumen del panel');
  const L3 = s2['config/importaciones'].items.find(x => x.id === lote1);
  ok(L3 && L3.n === 1 && L3.conservados === 1, 'la importación queda con 1 conservado');
  await Promise.all([p.waitForEvent('download'), p.click(`#hLotes [data-lote="${lote2}"] [data-lk="quitar"]`)]);
  await p.waitForFunction(() => /Listo/.test(document.querySelector('#hEst2').textContent), null, { timeout: 30000 });
  s2 = await st();
  ok(!s2['liberaciones/xl-02800'] && !s2['liberaciones/xl-02812'] && !!s2['liberaciones/xl-02811'], 'quitar «Mes de prueba 2» conserva el entregado en la app');

  // 7. Reimportar el mismo Excel dos veces no duplica
  const importarExcel = async nombre => {
    if (await p.$('#hCancel')) await p.click('#hCancel');
    await p.setInputFiles('#hFile', XLSX); await p.waitForFunction(() => !document.querySelector('#hLeyendo') && /excel-prueba\.xlsx/.test(document.querySelector('#hRes').textContent) && document.querySelector('#hRes .imp-par select, #hCuenta'));
    for (const [raw, v] of [['Frente Inventado', 'pp-sur'], ['Relleno en zanja', 'relleno-zanja']]) if (await p.$(`#hRes .pinfo ~ .imp-par select[data-raw="${raw}"]`)) await p.selectOption(`select[data-raw="${raw}"]`, v);
    await p.waitForSelector('#hCuenta', { timeout: 20000 });
    if (nombre) { await p.fill('#hNombre', nombre); await p.press('#hNombre', 'Tab'); }
  };
  await importarExcel('Mes de prueba 1 otra vez');
  ok(!(await p.$('select[data-raw="Despliegue de Geomembrana"]:not(#hLect select)')), 'el tipo creado antes ya se reconoce solo');
  await p.click('#hImp'); await p.waitForFunction(() => /Listo/.test(document.querySelector('#hEst').textContent), null, { timeout: 30000 });
  const n1 = Object.keys(await st()).filter(k => k.startsWith('liberaciones/')).length;
  await importarExcel();
  ok(/Nada nuevo/.test(await p.textContent('#hImp')), 'reimportar: «Nada nuevo que importar»');
  await p.click('#hImp'); await p.waitForTimeout(400);
  ok(Object.keys(await st()).filter(k => k.startsWith('liberaciones/')).length === n1, 'reimportar no duplica (' + n1 + ' registros)');
  const codigos = Object.entries(await st()).filter(([k]) => k.startsWith('liberaciones/')).map(([, v]) => v.numero).filter(Boolean);
  ok(codigos.length === new Set(codigos).size, 'ningún código SKT-TOP repetido');

  // 8. Celular
  const ctx2 = await b.newContext({ ...devices['iPhone 13'] }); await preparar(ctx2);
  const q = await ctx2.newPage(); q.on('pageerror', e => errores.push('cel: ' + e.message));
  await q.goto(URL);
  await q.evaluate(s => localStorage.setItem('__fakeDB', s), await p.evaluate(() => localStorage.getItem('__fakeDB')));
  await q.evaluate(u => localStorage.setItem('__fakeUser', JSON.stringify(u)), ADMIN);
  await q.reload(); await q.waitForSelector('#nav button');
  await q.click('[data-v="ajustes"]:not([hidden])'); await q.click('[data-tab="historico"]'); await q.waitForSelector('#hFile', { state: 'attached' });
  await q.setInputFiles('#hFile', XLSX); await q.waitForSelector('#hRes .imp-par select');
  ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'celular: sin desplazamiento lateral al emparejar');
  await q.screenshot({ path: OUT + '/04-celular.png', fullPage: true });
  await q.selectOption('select[data-raw="Frente Inventado"]', 'pp-sur'); await q.selectOption('select[data-raw="Relleno en zanja"]', 'relleno-zanja');
  await q.waitForSelector('#hCuenta', { timeout: 20000 }); await q.waitForSelector('#hLotes .imp-lote');
  ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'celular: sin desplazamiento lateral en la vista previa y la lista');
  await q.screenshot({ path: OUT + '/05-celular-lista.png', fullPage: true });
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
