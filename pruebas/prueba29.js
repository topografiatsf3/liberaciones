// Cambiar la clave de un topógrafo en Ajustes → Topógrafos (versión 24): pasa a todos sus registros, al resumen
// del panel, al historial y a su cuenta. La clave vieja queda como «antes»: un registro que llega tarde con ella
// se sigue viendo con el nombre y sale con la clave nueva en el Excel; nadie más puede usarla.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba29'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Jefe Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const store = p => p.evaluate(() => window.__fakeStore());
const reg = (id, topo, h) => ({ actividad: 'LIB', estado: 'PT', numero: '', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: topo, pkInicio: 2200 + h * 10, pkFin: 2210 + h * 10, descripcion: 'Liberación ' + id, fechaCampo: { __ts: Date.now() - h * 3600e3 }, creadoEn: { __ts: Date.now() - h * 3600e3 }, archivos: [] });
async function entrarComo(p, u) { await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(500); }
const filaDe = (p, id) => p.$(`#tpList .prow:has(.tp-clave .mono:text-is("${id}"))`);
const abrirClave = async (p, id) => { await p.click(`#tpList .prow:has(.tp-clave .mono:text-is("${id}")) .tp-clave`); await p.waitForSelector('.dlg.on #dClave'); };
const ponerClave = async (p, v) => { await p.fill('.dlg.on #dClave', v); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(700); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([A, d]) => {
    localStorage.clear();
    localStorage.setItem('__fakeDB', JSON.stringify({ ...d,
      'usuarios/operario@gmail.com': { nombre: 'Gregorio Navarro', rol: 'operario', topografoId: 'GN', activo: true },
      'usuarios/jefe@gmail.com': { nombre: 'Jefe Prueba', rol: 'jefe', activo: true } }));
    localStorage.setItem('__fakeUser', JSON.stringify(A));
  }, [ADMIN, { 'liberaciones/l1': reg('l1', 'GN', 1), 'liberaciones/l2': reg('l2', 'GN', 2), 'liberaciones/l3': reg('l3', 'JS', 3) }]);
  await p.reload(); await p.waitForSelector('#nav button');
  await entrarComo(p, JEFE);

  // 1. Ajustes → Topógrafos: la clave se toca para cambiarla
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="topografos"]'); await p.waitForSelector('#tpList');
  ok(/toca la clave/.test(await p.textContent('#ajBody')) && (await p.$$('#tpList .tp-clave')).length >= 5, 'cada topógrafo tiene su clave como botón para cambiarla');
  ok(await p.$eval('#tpList .tp-clave', e => e.getBoundingClientRect().height >= 44), 'el botón de la clave se toca con el dedo (44 px)');
  await abrirClave(p, 'GN');
  ok(/Gregorio Navarro/.test(await p.textContent('.dlg.on')) && await p.$eval('#dClave', i => i.value) === 'GN', 'el diálogo muestra el nombre y la clave actual');
  await ponerClave(p, 'JS');
  ok(!!(await p.$('.dlg.on')) && /La clave JS ya es de Jaime Sauce Cotrina/.test(await p.textContent('#toast')), 'no deja usar la clave de otro topógrafo');
  await ponerClave(p, 'G1');
  ok(!!(await p.$('.dlg.on')) && /de 2 a 5 letras/.test(await p.textContent('#toast')), 'no deja una clave con números');
  await p.screenshot({ path: path.join(OUT, '1-dialogo.png') });
  await ponerClave(p, 'gnv'); await p.waitForSelector('.dlg.on', { state: 'detached' }).catch(() => {}); await p.waitForTimeout(500);
  ok(/Clave cambiada a GNV · 2 registros/.test(await p.textContent('#toast')), 'avisa la clave nueva y cuántos registros cambió: ' + await p.textContent('#toast'));
  let st = await store(p);
  ok(st['liberaciones/l1'].topografoId === 'GNV' && st['liberaciones/l2'].topografoId === 'GNV' && st['liberaciones/l3'].topografoId === 'JS', 'sus 2 registros pasan a GNV; el de otro topógrafo no cambia');
  ok(st['usuarios/operario@gmail.com'].topografoId === 'GNV', 'su cuenta también pasa a GNV');
  const t = st['listas/topografos'].items.find(x => x.nombre === 'Gregorio Navarro');
  ok(t.id === 'GNV' && JSON.stringify(t.antes) === '["GN"]', 'la lista guarda la clave nueva y la vieja como «antes»');
  const res = Object.entries(st).filter(([k]) => k.startsWith('resumen/pp-oeste')).flatMap(([, v]) => Object.entries(v.r || {}));
  ok(['l1', 'l2'].every(id => res.some(([k, a]) => k === id && a[8] === 'GNV')), 'el resumen del panel también tiene GNV');
  ok(Object.values(st).filter(h => h && /Clave del topógrafo: GN → GNV/.test(h.nota || '')).length === 2, 'el historial anota el cambio en cada registro');
  ok(!!(await filaDe(p, 'GNV')) && !(await filaDe(p, 'GN')), 'la fila muestra la clave nueva');
  await p.screenshot({ path: path.join(OUT, '2-lista.png') });

  // 2. La clave vieja no se puede dar a otro topógrafo
  await p.fill('#tpId', 'gn'); await p.fill('#tpNom', 'Otro Topógrafo'); await p.click('#tpAdd'); await p.waitForTimeout(300);
  ok(/GN fue la clave de Gregorio Navarro; usa otra/.test(await p.textContent('#toast')), 'no deja crear un topógrafo con la clave vieja');

  // 3. Un registro que llega tarde con la clave vieja (teléfono sin señal) se ve con su nombre y sale con GNV en el Excel
  await p.evaluate(r => { const s = window.__fakeStore(); s['liberaciones/l4'] = r; localStorage.setItem('__fakeDB', JSON.stringify(s)); }, reg('l4', 'GN', 0));
  await p.reload(); await p.waitForSelector('#nav button');
  await p.click('[data-v="todos"]'); await p.waitForSelector('#lista tr[data-id="l4"]');
  ok(/G\. Navarro/.test(await p.textContent('#lista tr[data-id="l4"]')), 'el registro con la clave vieja se ve con el nombre del topógrafo');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#rExp')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  const filaL4 = csv.split(/\r?\n/).find(l => l.includes('Liberación l4')) || '';
  ok(/[;,]GNV[;,]/.test(filaL4) && !/[;,]GN[;,]/.test(csv), 'en el Excel sale con la clave nueva (GNV), nunca con GN');

  // 4. Volver a la clave anterior también se puede
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="topografos"]'); await p.waitForSelector('#tpList');
  await abrirClave(p, 'GNV'); await ponerClave(p, 'GN'); await p.waitForTimeout(500);
  st = await store(p);
  const t2 = st['listas/topografos'].items.find(x => x.nombre === 'Gregorio Navarro');
  ok(t2.id === 'GN' && JSON.stringify(t2.antes) === '["GNV"]' && ['l1', 'l2'].every(id => st['liberaciones/' + id].topografoId === 'GN'), 'se puede volver a GN (GNV queda como «antes»)');

  // 5. Una clave de 5 letras cabe en su botón; en celular la fila cabe
  await abrirClave(p, 'JS'); await ponerClave(p, 'jswxy'); await p.waitForTimeout(500);
  const cabe = c => p.$eval(`#tpList .prow:has(.tp-clave .mono:text-is("JSWXY")) .tp-clave`, e => e.scrollWidth <= e.clientWidth + 1);
  ok(await cabe(), 'una clave de 5 letras cabe en su botón (computadora)');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
  ok(await cabe(), 'una clave de 5 letras cabe en su botón (celular)');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'en celular la lista de topógrafos no se sale de la pantalla');
  await p.screenshot({ path: path.join(OUT, '3-celular.png') });

  ok(errores.length === 0, 'sin errores de la página: ' + errores.join(' | '));
  await b.close();
})();
