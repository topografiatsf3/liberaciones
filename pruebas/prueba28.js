// Entregar a Calidad con el XML de la superficie (versión 23): gabinete sube obligatoriamente el XML de Civil 3D
// de cada liberación; si la superficie no tiene el mismo código SKT-TOP, no se acepta. La superficie queda en el
// Modelo 2D de su frente. Jefe y administrador tienen un acceso directo a las superficies desde Registros y la ficha.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const { supXml } = require('./xml');
const OUT = path.join(__dirname, 'capturas', 'prueba28'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const D = f => path.join(__dirname, 'datos', f);
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Jefe Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const store = p => p.evaluate(() => window.__fakeStore());
const lib = (id, numero, pk0, pk1) => ({ actividad: 'LIB', estado: 'EP', numero, creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', pkInicio: pk0, pkFin: pk1, descripcion: 'Liberación de filtro 1 capa 11 ' + id, nombreLiberacion: 'Filtro 1 capa 11 ' + id, fechaCampo: { __ts: Date.now() - 864e5 }, creadoEn: { __ts: Date.now() - 864e5 }, fechaLiberacion: { __ts: Date.now() - 3600e3 }, archivos: [] });
async function entrarComo(p, u) { await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(500); }
const errXml = p => p.textContent('.dlg.on #dXmlE');
const falta = p => p.$$eval('.dlg.on #dXmlL li', l => l.map(x => x.textContent));
// Esperas por resultado (no por tiempo fijo): en la corrida completa la máquina va más lenta
const esperarToast = (p, re) => p.waitForFunction(r => new RegExp(r).test(document.querySelector('#toast')?.textContent || ''), re.source, { timeout: 10000 }).catch(() => {});
async function subirXml(p, archivos) {
  await p.evaluate(() => { document.querySelector('.dlg.on #dXmlE').innerHTML = '<p>__esperando</p>'; });
  await p.setInputFiles('.dlg.on #dXml', archivos);
  await p.waitForFunction(() => { const t = document.querySelector('.dlg.on #dXmlE')?.textContent || ''; return !/__esperando|Leyendo/.test(t); }, null, { timeout: 15000 }).catch(() => {});
}
const esperarEstado = (p, ids, est) => p.waitForFunction(([ids, est]) => ids.every(id => window.__fakeStore()['liberaciones/' + id]?.estado === est), [ids, est], { timeout: 15000 }).catch(() => {});

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([A, d]) => {
    localStorage.clear();
    const capas = { tipos: { filtro1: { capas: [{ nombre: 'Capa 10' }, { nombre: 'Capa 11' }, { nombre: 'Capa 12' }], noAplica: [] } } };
    localStorage.setItem('__fakeDB', JSON.stringify({ 'capas/pp-oeste': capas,
      'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', activo: true },
      'usuarios/jefe@gmail.com': { nombre: 'Jefe Prueba', rol: 'jefe', activo: true }, ...d }));
    localStorage.setItem('__fakeUser', JSON.stringify(A)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('modelo'));
  }, [ADMIN, { 'liberaciones/ep1': lib('ep1', 'SKT-TOP-02686', 2220, 2260), 'liberaciones/ep2': lib('ep2', 'SKT-TOP-02688', 2290, 2310), 'liberaciones/ep3': lib('ep3', 'SKT-TOP-02689', 2320, 2340) }]);
  await p.reload(); await p.waitForSelector('#nav button');
  // El frente tiene su eje con secciones (lo sube el administrador en Panel → Modelo 2D)
  await p.click('[data-v="panel"]'); await p.waitForSelector('#mBody');
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await p.waitForSelector('.dlg.on [type=submit]'); await p.waitForTimeout(250); await p.click('.dlg.on [type=submit]');
  await p.waitForFunction(() => window.__fakeStore()['secciones/pp-oeste']);

  // 1. Gabinete entrega una: el XML es obligatorio y tiene que tener el mismo código
  await entrarComo(p, GAB);
  await p.click('[data-v="bandeja"]'); await p.click('[data-bt="EP"]'); await p.waitForSelector('#blist tr[data-rid="ep1"]');
  await p.click('#blist tr[data-rid="ep1"] [data-a="entregar"]'); await p.waitForSelector('.dlg.on #dXml', { state: 'attached' });
  ok(/SKT-TOP-02686\s*Falta XML/.test((await falta(p)).join()), 'el diálogo de entrega pide el XML de SKT-TOP-02686');
  await p.fill('#dCarpeta', 'OneDrive\\Liberaciones\\Cargo 20');
  await p.click('.dlg.on [type=submit]'); await esperarToast(p, /Falta el XML/);
  ok(!!(await p.$('.dlg.on #dXml')) && /Falta el XML de la superficie SKT-TOP-02686/.test(await p.textContent('#toast')), 'sin XML no deja entregar');
  await subirXml(p, supXml('SKT-TOP-02688', 'otra.xml'));
  ok(/es SKT-TOP-02688 y no es el mismo código de la liberación que entregas \(SKT-TOP-02686\)\. No se sube/.test(await errXml(p)), 'una superficie con otro código no se acepta: ' + (await errXml(p)).slice(0, 80));
  ok(/Falta XML/.test((await falta(p)).join()), 'sigue faltando el XML');
  await subirXml(p, supXml(null, 'sin-codigo.xml'));
  ok(/no tiene código en el nombre/.test(await errXml(p)), 'una superficie sin código no se acepta');
  await subirXml(p, { name: 'notas.xml', mimeType: 'application/xml', buffer: Buffer.from('esto no es xml') });
  ok(/no es un XML válido/.test(await errXml(p)), 'un archivo que no es XML no se acepta');
  await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(300);
  ok(!!(await p.$('.dlg.on #dXml')), 'con XML equivocados sigue sin dejar entregar');
  await subirXml(p, supXml('SKT-TOP-02686', 'liberacion 02686.xml')); await p.waitForSelector('.dlg.on .xml-ok');
  ok(/✓ 2\+220_2\+260_STN F1_SKT-TOP-02686/.test((await falta(p)).join()) && (await errXml(p)) === '', 'con el mismo código se acepta y se borra el error');
  await p.screenshot({ path: path.join(OUT, '1-entregar.png') });
  await p.click('.dlg.on [type=submit]'); await esperarEstado(p, ['ep1'], 'EC'); await esperarToast(p, /entregada a Calidad/); await p.waitForSelector('.dlg.on', { state: 'detached', timeout: 10000 }).catch(() => {});
  ok(!(await p.$('.dlg.on')) && /1 entregada a Calidad/.test(await p.textContent('#toast')), 'se entrega a Calidad');
  let st = await store(p), r1 = st['liberaciones/ep1'], x = (r1.xmlEntrega || [])[0] || {};
  ok(r1.estado === 'EC' && x.codigo === 'SKT-TOP-02686' && x.archivo === 'liberacion 02686.xml' && x.superficie === '2+220_2+260_STN F1_SKT-TOP-02686', 'el registro guarda el XML entregado');
  const sup = st['superficies/' + x.supId];
  ok(!!sup && sup.codigo === 'SKT-TOP-02686' && sup.tipoId === 'filtro1' && sup.capa === 'Capa 11' && sup.liberacionId === 'ep1' && sup.pk0 > 2200 && sup.cs.length > 0, 'la superficie queda en el Modelo 2D del frente, con su tipo, capa, progresiva y cortes');
  ok(!!st['superficiesRes/pp-oeste']?.r?.[x.supId], 'y en el resumen del modelo (se ve en el panel)');
  ok(Object.values(st).some(h => h && h.liberacionId === 'ep1' && h.a === 'EC' && /XML: liberacion 02686\.xml/.test(h.nota || '')), 'el historial anota el XML');

  // 2. En grupo: se eligen varios XML a la vez y cada uno se empareja por su código
  await p.waitForSelector('#blist tr[data-rid="ep2"]');
  await p.click('#bAll2'); await p.click('[data-bk="entregar"]'); await p.waitForSelector('.dlg.on #dXml', { state: 'attached' });
  ok((await falta(p)).length === 2, 'en grupo lista cada liberación con su código');
  await p.fill('#dCarpeta', 'OneDrive\\Liberaciones\\Cargo 21');
  await subirXml(p, supXml('SKT-TOP-02688'));
  await p.click('.dlg.on [type=submit]'); await esperarToast(p, /Falta el XML de la superficie SKT-TOP-02689/);
  ok(!!(await p.$('.dlg.on')) && /Falta el XML de la superficie SKT-TOP-02689/.test(await p.textContent('#toast')), 'en grupo no entrega mientras falte el XML de una');
  await subirXml(p, [supXml('SKT-TOP-02689'), supXml('SKT-TOP-02686', 'ya-entregada.xml')]);
  ok(/SKT-TOP-02686 y no es el mismo código de ninguna de las liberaciones que entregas/.test(await errXml(p)), 'la superficie de otra liberación no se mezcla');
  await p.click('.dlg.on [type=submit]'); await esperarEstado(p, ['ep2', 'ep3'], 'EC');
  st = await store(p);
  ok(['ep2', 'ep3'].every(id => st['liberaciones/' + id].estado === 'EC' && st['liberaciones/' + id].xmlEntrega[0].codigo === st['liberaciones/' + id].numero), 'las dos se entregan, cada una con su propio XML');

  // 3. Gabinete no tiene el acceso directo (es para jefe y administradores)
  await p.click('[data-v="todos"]'); await p.waitForSelector('#lista');
  ok(!(await p.$('#rSup')), 'gabinete no ve «Superficies (XML)» en Registros');
  await p.click('#lista tr[data-id="ep1"] .tdesc'); await p.waitForSelector('#sheet.on');
  ok(/Superficie \(XML\)/.test(await p.textContent('#sheet')) && !(await p.$('#fVerSup')), 'gabinete ve en la ficha el XML entregado, sin el acceso directo');

  // 4. Jefe de área: acceso directo desde Registros y desde la ficha
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await entrarComo(p, JEFE);
  await p.evaluate(() => { localStorage.setItem('lib.panelVista', JSON.stringify('perfil')); });
  await p.click('[data-v="todos"]'); await p.waitForSelector('#rSup');
  ok(/Superficies \(XML\)/.test(await p.textContent('#rSup')), 'el jefe ve «Superficies (XML)» en Registros');
  await p.screenshot({ path: path.join(OUT, '2-registros-jefe.png') });
  await p.click('#rSup'); await p.waitForSelector('#mBody');
  ok(await p.evaluate(() => location.hash) === '#panel' && !!(await p.$('#mFile')), 'lleva a Panel → Modelo 2D, donde se ven las superficies');
  await p.click('[data-v="todos"]'); await p.waitForSelector('#lista tr[data-id="ep1"]');
  await p.click('#lista tr[data-id="ep1"] .tdesc'); await p.waitForSelector('#sheet.on #fVerSup');
  await p.click('#fVerSup'); await p.waitForSelector('#mBody'); await p.waitForFunction(id => document.querySelector('#mGrupo')?.value === 'filtro1|Capa 11' && document.querySelector(`#mBody [data-sid="${id}"]`), x.supId, { timeout: 10000 }).catch(() => {});
  ok(await p.$eval('#pSub', s => s.value) === 'pp-oeste' && await p.$eval('#mGrupo', s => s.value) === 'filtro1|Capa 11', '«Ver en el modelo» abre su frente y su capa');
  ok(!!(await p.$(`#mBody [data-sid="${x.supId}"]`)), 'y ahí está su superficie');
  await p.screenshot({ path: path.join(OUT, '3-modelo-jefe.png') });

  // 5. Administrador también tiene el acceso directo
  await entrarComo(p, ADMIN);
  await p.click('[data-v="todos"]'); await p.waitForSelector('#lista');
  ok(!!(await p.$('#rSup')), 'el administrador también ve «Superficies (XML)»');
  // En celular el botón cabe en la pantalla y se toca con el dedo
  await p.setViewportSize({ width: 390, height: 844 }); await p.click('[data-v="todos"]').catch(() => {}); await p.waitForTimeout(600);
  const bx = await p.$eval('#rSup', e => { const r = e.getBoundingClientRect(); return { r: r.right, h: r.height, w: document.documentElement.scrollWidth }; });
  ok(bx.r <= 390 && bx.h >= 44 && bx.w <= 390, `en celular «Superficies (XML)» cabe y mide ${Math.round(bx.h)} px de alto`);
  await p.screenshot({ path: path.join(OUT, '4-registros-celular.png') });

  ok(errores.length === 0, 'sin errores de la página: ' + errores.join(' | '));
  await b.close();
})();
