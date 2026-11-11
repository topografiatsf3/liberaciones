// Etiquetas de seguimiento (versión 27): las aspas dicen «Procesado» o «Por procesar» y los levantamientos «Enterado» o «Por ver»,
// con la misma regla en la tabla de computadora, la lista del celular, la ficha, el menú «⋯» y Ctrl+K; y se puede filtrar por ellas.
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba34'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const ahora = Date.now(), dia = 864e5;
const base = (extra) => ({ creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', topografoId: 'GN', numero: '', fechaCampo: { __ts: ahora - dia }, creadoEn: { __ts: ahora - dia }, archivos: [], ...extra });
const DB = {
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'liberaciones/a1': base({ actividad: 'ASP', estado: 'NA', descripcion: 'Aspas cuadrante 17', procesado: true, procesadoPor: 'jefe@gmail.com', procesadoNombre: 'Carlos Jefe', procesadoEn: { __ts: ahora } }),
  'liberaciones/a2': base({ actividad: 'ASP', estado: 'NA', descripcion: 'Aspas cuadrante 18' }),
  'liberaciones/v1': base({ actividad: 'LEV', estado: 'NA', descripcion: 'Levantamiento caseta 1', visto: true, vistoPor: 'gabinete@gmail.com', vistoNombre: 'Gabinete Prueba', vistoEn: { __ts: ahora } }),
  'liberaciones/v2': base({ actividad: 'LEV', estado: 'NA', descripcion: 'Levantamiento caseta 2' }),
  'liberaciones/l1': base({ actividad: 'LIB', estado: 'PT', descripcion: 'Relleno común', tipoId: 'masivo', pkInicio: 100, pkFin: 140 }),
};
const chips = (p, sel) => p.$$eval(sel + ' .st', x => x.map(s => s.textContent.trim()));
let b;
(async () => {
  b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  const preparar = async c => { await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); }); await c.route(/fonts\./, r => r.abort()); };
  await preparar(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [DB, ADMIN]);
  await p.reload(); await p.waitForSelector('#nav button');

  // 1. Tabla de Registros (computadora)
  await p.click('#nav [data-v="todos"]'); await p.waitForSelector('.rtab tr[data-id="a1"]');
  ok((await chips(p, '.rtab tr[data-id="a1"] .tcod')).join() === 'Levantamiento,Procesado', 'tabla: aspas procesadas dicen «Procesado» (como en el celular)');
  ok((await chips(p, '.rtab tr[data-id="a2"] .tcod')).join() === 'Levantamiento,Por procesar', 'tabla: aspas sin procesar dicen «Por procesar»');
  ok((await chips(p, '.rtab tr[data-id="v1"] .tcod')).join() === 'Levantamiento,Enterado', 'tabla: levantamiento visto dice «Enterado»');
  ok((await chips(p, '.rtab tr[data-id="v2"] .tcod')).join() === 'Levantamiento,Por ver', 'tabla: levantamiento sin ver dice «Por ver»');
  ok((await chips(p, '.rtab tr[data-id="l1"] .tcod')).join() === 'Pendiente topografía', 'una liberación con código no lleva etiqueta de seguimiento');
  ok(/Procesado por Carlos Jefe/.test(await p.getAttribute('.rtab tr[data-id="a1"] .st.seg', 'title')), 'al pasar el mouse dice quién lo procesó');
  await p.screenshot({ path: path.join(OUT, '1-tabla.png') });
  // 2. Chips de filtro por seguimiento
  const txtChips = await p.$$eval('.chips [data-st]', x => x.map(c => c.textContent.replace(/\s+/g, ' ').trim()));
  ok(['Por procesar1', 'Procesadas1', 'Por ver1', 'Enterados1'].every(t => txtChips.map(x => x.replace(/ (\d+)$/, '$1')).includes(t)), 'hay chips de filtro «Por procesar», «Procesadas», «Por ver» y «Enterados»: ' + txtChips.join(' | '));
  await p.click('.chips [data-st="proc"]'); await p.waitForTimeout(250);
  ok((await p.$$eval('.rtab tbody tr[data-id]', x => x.map(r => r.dataset.id))).join() === 'a1', '«Procesadas» muestra solo las aspas procesadas');
  await p.click('.chips [data-st="porver"]'); await p.waitForTimeout(250);
  ok((await p.$$eval('.rtab tbody tr[data-id]', x => x.map(r => r.dataset.id))).join() === 'v2', '«Por ver» muestra solo el levantamiento que gabinete no vio');
  await p.click('.chips [data-st=""]'); await p.waitForTimeout(250);
  // 3. Ficha y menú «⋯»
  await p.click('.rtab tr[data-id="a1"] td:nth-child(3)'); await p.waitForSelector('#sheet.on');
  ok((await chips(p, '#sheet .r1')).includes('Procesado'), 'la ficha muestra «Procesado» arriba');
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  await p.click('.rtab tr[data-id="a2"]', { button: 'right' }); await p.waitForSelector('#ctx');
  ok(/Por procesar/.test(await p.textContent('#ctx')), 'el menú «⋯» también dice «Por procesar»');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // 4. Marcar procesado en la Bandeja cambia la etiqueta en Registros
  await p.click('#nav [data-v="bandeja"]'); await p.click('[data-bt="ASP"]'); await p.waitForSelector('#blist [data-rid="a2"]');
  await p.click('#blist [data-rid="a2"] [data-a="procesar"]');
  await p.waitForFunction(() => window.__fakeStore()['liberaciones/a2']?.procesado === true, null, { timeout: 10000 }).catch(() => {});
  await p.click('#nav [data-v="todos"]'); await p.waitForSelector('.rtab tr[data-id="a2"]');
  ok((await chips(p, '.rtab tr[data-id="a2"] .tcod')).join() === 'Levantamiento,Procesado', 'al marcar procesado en la Bandeja, Registros dice «Procesado» al instante');
  // 5. Ctrl+K
  await p.keyboard.press('Control+k'); await p.waitForSelector('#cmdk'); await p.keyboard.type('caseta 2');
  await p.waitForFunction(() => /caseta 2|Por ver/i.test(document.querySelector('#cmdk .cmdk-res')?.textContent || ''), null, { timeout: 8000 }).catch(() => {});
  ok(/Por ver/.test(await p.textContent('#cmdk .cmdk-res')), 'Ctrl+K muestra «Por ver»');
  await p.keyboard.press('Escape');

  // 6. Celular: el operario ve en Mis registros si gabinete ya vio su levantamiento
  const m = await (await b.newContext({ ...devices['Pixel 7'] })).newPage(); await preparar(m.context());
  m.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  await m.goto(URL);
  await m.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', d); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [await p.evaluate(() => localStorage.getItem('__fakeDB')), OPER]);
  await m.reload(); await m.waitForSelector('#nav button');
  await m.click('#nav [data-v="mis"]'); await m.waitForSelector('.item');
  const t1 = await m.textContent('.item:has-text("caseta 1")'), t2 = await m.textContent('.item:has-text("caseta 2")'), ta = await m.textContent('.item:has-text("cuadrante 18")');
  ok(/Enterado/.test(t1) && /Por ver/.test(t2) && /Procesado/.test(ta), 'en el celular: «Enterado», «Por ver» y «Procesado» con la misma regla');
  await m.screenshot({ path: path.join(OUT, '2-celular.png'), fullPage: true });

  ok(!errores.length, 'sin errores de la página: ' + errores.join(' | '));
  await b.close();
})().catch(async e => { console.log('FALLA:', e.message); process.exitCode = 1; await b?.close(); });
