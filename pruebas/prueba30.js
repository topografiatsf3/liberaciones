// Nombres de las fechas (versión 25): «Fecha de liberación» = fecha en campo, «Fecha de entrega» = cuando gabinete genera el código,
// «Entrega a Calidad» = fecha de entrega a Calidad. Ficha, filtro de Registros y formulario.
const { chromium } = require('playwright'); const path = require('path');
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
async function preparar(ctx) {
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
}
const dia = 864e5, ahora = Date.now();
const DB = {
  'liberaciones/f1': { actividad: 'LIB', estado: 'EC', numero: 'SKT-TOP-03000', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', topografoId: 'GN', descripcion: 'Relleno', pkInicio: 100, pkFin: 140,
    fechaCampo: { __ts: ahora - 3 * dia }, fechaLiberacion: { __ts: ahora - 2 * dia }, fechaEntrega: { __ts: ahora - dia }, creadoEn: { __ts: ahora - 3 * dia }, archivos: [] },
};
let b;
(async () => {
  b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); await preparar(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [DB, ADMIN]);
  await p.reload(); await p.waitForSelector('#nav button');

  await p.click('[data-v="todos"]'); await p.waitForSelector('.rtab tr[data-id="f1"]');
  const opciones = await p.$$eval('#rfFc option', os => os.map(o => o.textContent));
  ok(opciones.join('|') === 'Fecha de liberación|Fecha de entrega|Entrega a Calidad', 'el filtro «Filtrar por» usa los nombres nuevos: ' + opciones.join(', '));

  await p.click('.rtab tr[data-id="f1"] td:nth-child(4)'); await p.waitForSelector('#sheet.on');
  const kv = await p.$$eval('#sheet dl.kv dt', ds => ds.map(d => d.textContent));
  ok(!kv.includes('Fecha en campo') && !kv.includes('Fecha liberación'), 'la ficha ya no dice «Fecha en campo» ni «Fecha liberación»');
  const i = kv.indexOf('Fecha de liberación'), j = kv.indexOf('Fecha de entrega'), k = kv.indexOf('Entrega a Calidad');
  ok(i >= 0 && j > i && k > j, 'la ficha muestra «Fecha de liberación», «Fecha de entrega» y «Entrega a Calidad»');
  const dd = await p.$$eval('#sheet dl.kv dd', ds => ds.map(d => d.textContent));
  const fmt = t => new Date(t).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  ok(dd[i].includes(fmt(ahora - 3 * dia)), '«Fecha de liberación» es la fecha en campo');
  ok(dd[j].includes(fmt(ahora - 2 * dia)), '«Fecha de entrega» es la fecha en que se generó el código');
  await p.keyboard.press('Escape');

  await p.click('[data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])');
  ok((await p.textContent('label[for="iFecha"]')).trim() === 'Fecha y hora de liberación', 'el formulario pide «Fecha y hora de liberación»');

  ok(!errores.length, 'sin errores de la página');
  await b.close();
})().catch(async e => { console.log('FALLA:', e.message); process.exitCode = 1; await b?.close(); });
