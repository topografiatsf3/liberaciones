// Fecha del registro nuevo y actualización forzada (versión 26).
// Si la app queda abierta de un día para otro, o el borrador es de ayer, el registro nuevo NO debe salir con la fecha de ayer:
// mientras nadie cambie la fecha a mano, toma la hora actual al abrir «Nueva» y al volver a la app.
// Y una versión nueva se aplica sola cuando no hay nada escrito, en cualquier momento (no solo al abrir).
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba32'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const OPE = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const p2 = n => String(n).padStart(2, '0');
const local = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
const visible = p => p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
let b;
(async () => {
  b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1); ayer.setHours(17, 40, 0, 0);
  const hoy = new Date(); hoy.setHours(7, 15, 0, 0);
  await p.clock.setFixedTime(ayer);
  await p.goto(URL);
  await p.evaluate(([u, dbx]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(dbx)); localStorage.setItem('__fakeUser', JSON.stringify(u)); },
    [{ uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' }, { 'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true } }]);
  await p.reload(); await p.waitForSelector('#nav button');

  // 1. Ayer en la tarde se abre «Nueva»: sale la hora de ayer (correcto)
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#iFecha', { state: 'attached' });
  ok((await p.inputValue('#iFecha')) === local(ayer), 'al abrir «Nueva» sale la hora del momento: ' + await p.inputValue('#iFecha'));
  // 2. La app queda abierta toda la noche y se vuelve a ella hoy a las 7:15: la fecha se pone sola en la de hoy
  await p.clock.setFixedTime(hoy); await visible(p);
  ok((await p.inputValue('#iFecha')) === local(hoy), 'al volver a la app al día siguiente, el formulario toma la hora de hoy: ' + await p.inputValue('#iFecha'));
  // 3. Borrador de ayer (se fue a otra pantalla y volvió hoy): también toma la hora de hoy
  await p.clock.setFixedTime(ayer); await p.fill('#iDesc', 'Borrador de ayer');
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(200);
  await p.clock.setFixedTime(hoy);
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#iFecha', { state: 'attached' });
  ok((await p.inputValue('#iDesc')) === 'Borrador de ayer' && (await p.inputValue('#iFecha')) === local(hoy), 'el borrador de ayer se conserva, pero con la fecha de hoy');
  // 4. Recargar la app con el borrador guardado: hora de hoy
  await p.reload(); await p.waitForSelector('#nav button');
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#iFecha', { state: 'attached' });
  ok((await p.inputValue('#iFecha')) === local(hoy), 'al reabrir la app con un borrador viejo, la fecha es la de hoy');
  // 5. Quien cambia la fecha a mano la conserva (registra algo de ayer a propósito)
  await p.evaluate(v => { const i = document.querySelector('#iFecha'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, local(ayer));
  await p.clock.setFixedTime(new Date(hoy.getTime() + 3600e3)); await visible(p);
  ok((await p.inputValue('#iFecha')) === local(ayer), 'una fecha puesta a mano no se cambia sola');
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(200); await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#iFecha', { state: 'attached' });
  ok((await p.inputValue('#iFecha')) === local(ayer), 'ni al salir y volver a «Nueva»');
  await p.click('#bLimpiar'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(300);
  ok((await p.inputValue('#iFecha')) === local(new Date(hoy.getTime() + 3600e3)), '«Limpiar» vuelve a la hora actual');

  // 6. Versión nueva con algo escrito: avisa; al volver a la app sin nada escrito en pantalla, se actualiza sola
  await p.fill('#iDesc', 'No se pierde');
  const cargas = []; p.on('load', () => cargas.push(1));
  await p.evaluate(() => document.dispatchEvent(new Event('version-nueva'))); await p.waitForSelector('#verNueva');
  ok(cargas.length === 0 && (await p.inputValue('#iDesc')) === 'No se pierde', 'con algo escrito no recarga: avisa «Hay una versión nueva»');
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(200);
  await visible(p); await p.waitForSelector('#nav button'); await p.waitForTimeout(800);
  ok(cargas.length === 1, 'al volver a la app sin nada escrito en pantalla, se actualiza sola');
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#iDesc', { state: 'attached' });
  ok((await p.inputValue('#iDesc')) === 'No se pierde', 'y lo escrito sigue en el borrador');
  // 7. Versión nueva sin nada escrito, con la app abierta hace rato: se recarga sola al momento
  await p.click('#bLimpiar'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(300);
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(300);
  await p.evaluate(() => document.dispatchEvent(new Event('version-nueva'))); await p.waitForSelector('#nav button'); await p.waitForTimeout(800);
  ok(cargas.length === 2 && !(await p.$('#verNueva')), 'sin nada escrito, la versión nueva se aplica sola en cualquier momento');

  ok(!errores.length, 'sin errores de la página: ' + errores.join(' | '));
  await b.close();
})().catch(async e => { console.log('FALLA:', e.message); process.exitCode = 1; await b?.close(); });
