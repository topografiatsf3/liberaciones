// Versión 28: tipos sugeridos según el frente, «Detalle» aparte del tipo (separar «pz3-7» del nombre),
// y en Ajustes → Tipos: corregir antes de aprobar, ver los registros, unir con buscador y «Deshacer» al unir.
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs');
const { equipo } = require('./filtros');
const OUT = path.join(__dirname, 'capturas', 'prueba35'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPE = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Jefe Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
async function preparar(ctx) {
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
}
const escuchar = (p, n) => { p.on('pageerror', e => { errores.push(n + ': ' + e.message); console.log('PAGEERROR', n, e.message); }); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(n + ': ' + m.text()); console.log('CONSOLE', n, m.text()); } }); };
async function entrarComo(p, u) { await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(400); }
const resultados = p => p.$$eval('#tRes .tsel-i[data-tipo] b', b => b.map(x => x.textContent));
const buscar = async (p, q) => { await p.fill('#iTipoQ', q); await p.waitForTimeout(150); };
const lista = (p, k) => p.evaluate(k => (window.__fakeStore()['listas/' + k] || {}).items || [], k);
const registro = (p, desc) => p.evaluate(d => Object.values(window.__fakeStore()).find(x => x && x.descripcion === d), desc);
const regPorDet = (p, det) => p.evaluate(d => Object.values(window.__fakeStore()).find(x => x && x.origen && x.detalle === d), det);
const chipsSel = p => p.$$eval('#tSel .tsel-sub, #tSel .tsel-chips .chip', c => c.map(x => x.textContent.trim()));
async function lugar(p, est, sub) { await p.selectOption('#iEst', est); await p.waitForTimeout(80); await p.selectOption('#iSub', sub); await p.waitForTimeout(150); }

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); await preparar(ctx);
  const p = await ctx.newPage(); escuchar(p, 'cel');
  await p.goto(URL);
  await p.evaluate(([a]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify({
    'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
    'usuarios/jefe@gmail.com': { nombre: 'Jefe Prueba', rol: 'jefe', activo: true } })); localStorage.setItem('__fakeUser', JSON.stringify(a)); }, [ADMIN]);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(600);
  await entrarComo(p, OPE);
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#tSel');

  // 1. Una liberación de «Geotextil» en Presa Principal Oeste
  await p.selectOption('#iTopo', 'GN'); await lugar(p, 'pp', 'pp-oeste');
  await buscar(p, 'geotextil'); await p.click('#tRes [data-tipo="geotextil"]');
  ok(await p.$('#iDet'), 'al elegir el tipo aparece «Detalle (opcional)»');
  await p.fill('#iPk1', '0+100'); await p.fill('#iPk2', '0+140'); await p.fill('#iDesc', 'Geotextil oeste');
  await equipo(p); await p.click('#bGuardar'); await p.waitForTimeout(900);
  ok(!!(await registro(p, 'Geotextil oeste')), 'se guarda la primera liberación');

  // 2. En ese frente, «Geotextil» sale en «Usados en Presa Principal Oeste»; en otro frente no
  await p.click('#tCambiar'); await p.waitForTimeout(400);
  let ch = await chipsSel(p);
  ok(ch.some(t => /Usados en Presa Principal Oeste/i.test(t)) && ch.includes('Geotextil'), 'con el frente elegido, arriba salen los tipos usados en ese frente');
  await p.screenshot({ path: path.join(OUT, '1-usados-en-frente.png') });
  await buscar(p, 'geo');
  ok(/usado aquí/.test(await p.textContent('#tRes')), 'al buscar, los usados en el frente se marcan «usado aquí»');
  await buscar(p, ''); await p.click('#tRes [data-todos]');
  ok(/Usados en Presa Principal Oeste/i.test(await p.textContent('#tRes .tsel-g')), '«Ver todos» empieza con los usados en el frente');
  await lugar(p, 'pp', 'pp-este'); await p.waitForTimeout(400);
  ch = await chipsSel(p);
  ok(!ch.some(t => /Usados en/i.test(t)), 'en un frente sin registros no hay «Usados en…» (solo «Usados por ti»)');

  // 3. Tipo nuevo con un código al final: se ofrece separar el detalle
  await buscar(p, 'Ubicación piezometro casagrande pz3-7');
  await p.click('#tRes [data-nuevo]'); await p.waitForSelector('.dlg.on #nNom'); await p.waitForTimeout(250);
  ok(/PZ3-7/.test(await p.textContent('#nDet')) && await p.$('.dlg.on [data-sep]'), 'el diálogo detecta «PZ3-7» como dato del registro y ofrece separarlo');
  ok(await p.$eval('.dlg.on [type=submit]', b => b.classList.contains('sec')), 'mientras tanto «Agregar» queda como segunda opción');
  await p.screenshot({ path: path.join(OUT, '2-separar.png') });
  await p.click('.dlg.on [data-sep]'); await p.waitForTimeout(150);
  ok(await p.inputValue('#nNom') === 'Ubicación piezometro casagrande', 'al separar, el nombre del tipo queda sin el código');
  await p.click('.dlg.on [data-ele="ins"]'); await p.click('.dlg.on [type=submit]'); await p.waitForSelector('.dlg', { state: 'detached' });
  const tu = (await lista(p, 'tipos')).find(t => t.nombre === 'Ubicación piezometro casagrande');
  ok(tu && tu.nuevo, 'se agrega el tipo general, marcado como nuevo');
  ok(await p.inputValue('#iDet') === 'PZ3-7', 'y el código pasa al campo «Detalle»');
  await p.check('#iSinPk');
  await p.waitForTimeout(100);
  ok(/PZ3-7/.test(await p.inputValue('#iDesc')), 'la descripción automática incluye el detalle');
  await p.click('#bGuardar'); await p.waitForTimeout(900);
  const rp = await regPorDet(p, 'PZ3-7');
  ok(rp && rp.tipoId === tu.id, 'el registro guarda el tipo general y detalle «PZ3-7»');

  // 4. El siguiente piezómetro reutiliza el tipo
  await p.click('#tCambiar'); await buscar(p, 'piezometro casagrande pz3-8');
  ok((await resultados(p))[0] === 'Ubicación piezometro casagrande', 'el siguiente piezómetro encuentra el mismo tipo');
  ok(/detalle PZ3-8/.test(await p.textContent('#tRes .tsel-i[data-tipo]')), 'y avisa que «PZ3-8» irá como detalle');
  await p.click('#tRes .tsel-i[data-tipo]'); await p.waitForTimeout(150);
  ok(await p.inputValue('#iDet') === 'PZ3-8', 'al elegirlo, el código queda en «Detalle»');

  // 5. Otro tipo nuevo, repetido de uno que existe, con un registro (para unir y deshacer)
  await p.fill('#iDet', ''); await p.click('#tCambiar'); await buscar(p, 'Relleno filtro uno');
  await p.click('#tRes [data-nuevo]'); await p.waitForSelector('.dlg.on #nNom'); await p.waitForTimeout(200);
  await p.click('.dlg.on [data-ele="mt"]'); await p.click('.dlg.on [type=submit]'); await p.waitForSelector('.dlg', { state: 'detached' });
  const tr = (await lista(p, 'tipos')).find(t => t.nombre === 'Relleno filtro uno');
  await p.uncheck('#iSinPk').catch(() => {}); await p.fill('#iPk1', '0+200'); await p.fill('#iPk2', '0+220'); await p.fill('#iDesc', 'Filtro repetido');
  await p.click('#bGuardar'); await p.waitForTimeout(900);
  ok((await registro(p, 'Filtro repetido'))?.tipoId === tr.id, 'se guarda un registro con el tipo repetido');

  // 6. Jefe: corrige el nombre antes de aprobar
  await entrarComo(p, JEFE);
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="tipos"]'); await p.waitForSelector('#nvBox');
  await p.waitForTimeout(800);
  const fila = `#nvBox [data-nt="${tu.id}"]`;
  ok(await p.$(`${fila} [data-k="nom"]`) && await p.$(`${fila} [data-k="ele"]`), 'cada agregado desde campo trae su nombre y elemento editables');
  await p.locator('#nvBox').screenshot({ path: path.join(OUT, '3-revisar.png') });
  // Ver sus registros
  await p.click(`${fila} [data-k="regs"]`); await p.waitForSelector('.dlg.on .dlg-lista');
  ok(await p.$$eval('.dlg.on .dlg-lista [data-id]', r => r.length) === 1, '«1 registro» abre la lista de sus registros');
  await p.click('.dlg.on [type=submit]'); await p.waitForSelector('.dlg', { state: 'detached' });
  await p.fill(`${fila} [data-k="nom"]`, 'ubicación de piezómetro casagrande');
  await p.press(`${fila} [data-k="nom"]`, 'Enter'); await p.waitForTimeout(700);
  const tu2 = (await lista(p, 'tipos')).find(t => t.id === tu.id);
  ok(tu2.nombre === 'Ubicación de piezómetro casagrande' && tu2.nuevo === false && tu2.revisadoPor === 'jefe@gmail.com', 'Enter guarda el nombre corregido (con mayúscula) y lo da por revisado');
  ok(!(await p.$(fila)), 'y sale de «Agregados desde campo»');

  // 7. Unir con buscador y deshacer
  const filaR = `#nvBox [data-nt="${tr.id}"]`;
  await p.click(`${filaR} [data-k="unirB"]`); await p.waitForSelector('.dlg.on #dQ');
  ok(await p.$$eval('.dlg.on #dRes [data-dest]', r => r.length) > 20 && !(await p.$(`.dlg.on #dRes [data-dest="${tr.id}"]`)), 'el buscador para unir lista los demás tipos (sin el mismo)');
  await p.fill('.dlg.on #dQ', 'filtro 1'); await p.waitForTimeout(150);
  ok(await p.$('.dlg.on #dRes [data-dest="filtro1"]'), 'al escribir encuentra «Relleno filtro 1»');
  await p.screenshot({ path: path.join(OUT, '4-unir-buscador.png') });
  await p.click('.dlg.on #dRes [data-dest="filtro1"]'); await p.waitForTimeout(1200);
  ok((await registro(p, 'Filtro repetido'))?.tipoId === 'filtro1' && !(await lista(p, 'tipos')).some(t => t.id === tr.id), 'al unir, el registro pasa a «Relleno filtro 1» y el repetido se quita');
  ok(/Deshacer/.test(await p.textContent('#toast')), 'el aviso de la unión trae «Deshacer»');
  await p.click('#toast .toast-btn'); await p.waitForTimeout(1500);
  ok((await registro(p, 'Filtro repetido'))?.tipoId === tr.id && (await lista(p, 'tipos')).some(t => t.id === tr.id && t.nuevo), '«Deshacer» devuelve el tipo (aún por revisar) y su registro');
  ok(await p.evaluate(() => Object.values(window.__fakeStore()).some(x => x && x.accion === 'editado' && /Unión deshecha/.test(x.nota || ''))), 'y queda «Unión deshecha» en el historial');

  // 8. Celular sin desplazamiento lateral en Ajustes → Tipos
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Ajustes → Tipos cabe en el celular sin desplazamiento lateral');

  await b.close();
  ok(errores.length === 0, 'sin errores en la consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
})();
