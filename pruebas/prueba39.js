// Versión 33: computadora para gabinete y jefe de área. Ancho completo, columna de filtros con conteos (varias opciones),
// tabla compacta con cabeceras que ordenan y filtran (Registros y Bandeja), Ajustes con menú lateral y dos columnas; laptop y celular.
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba39'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const escuchar = (p, n) => { p.on('pageerror', e => { errores.push(n + ': ' + e.message); console.log('PAGEERROR', n, e.message); }); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(n + ': ' + m.text()); console.log('CONSOLE', n, m.text()); } }); };
const nuevo = (extra) => ({ actividad: 'LIB', estado: 'PT', numero: '', creadoPor: ADMIN.email, origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', descripcion: 'Liberación de prueba', fechaCampo: { __ts: Date.now() - 3600e3 }, creadoEn: { __ts: Date.now() - 3600e3 }, ...extra });
async function abrir(b, opts) {
  const ctx = await b.newContext(opts);
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage(); escuchar(p, opts.viewport ? 'pc' + opts.viewport.width : 'cel'); await p.goto(URL);
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'historico-prueba.json')));
  await p.evaluate(([d, u, ns]) => { localStorage.clear(); const st = {}; d.registros.forEach(r => { const { id, ...x } = r; ['fechaCampo', 'fechaLiberacion', 'fechaEntrega'].forEach(k => { x[k] = x[k] ? { __ts: x[k] } : null; }); x.creadoEn = x.fechaCampo; x.origen = 'excel'; st['liberaciones/' + id] = x; });
    Object.entries(ns).forEach(([k, n]) => { st['liberaciones/' + k] = n; });
    localStorage.setItem('__fakeDB', JSON.stringify(st)); localStorage.setItem('__fakeUser', JSON.stringify(u)); },
    [d, ADMIN, { n1: nuevo({ pkInicio: 100, pkFin: 140, capa: 'Capa 11' }), n2: nuevo({ pkInicio: 300, pkFin: 330, capa: 'Capa 12' }), n3: nuevo({ pkInicio: 200, pkFin: 240, capa: 'Capa 12', subestructuraId: 'pp-este', topografoId: 'CS' }), n4: nuevo({ pkInicio: 50, pkFin: 90, estado: 'OB', notaObservacion: 'Falta foto' })}]);
  await p.reload(); await p.waitForSelector('#nav button');
  await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('resumen/')), null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  return [ctx, p];
}
const ir = async (p, v) => { await p.click(`#nav [data-v="${v}"]`); await p.waitForTimeout(700); };
const filas = (p, sel = '#lista tbody tr[data-id]') => p.$$eval(sel, x => x.length);
(async () => {
  const b = await chromium.launch();
  let [ctx, p] = await abrir(b, { viewport: { width: 1920, height: 1080 } });

  // --- Registros
  await ir(p, 'todos'); await p.waitForSelector('#rFil.fcol');
  ok(await p.$eval('#view', v => v.getBoundingClientRect().width) > 1600, 'Registros usa todo el ancho de la pantalla (sin el tope de 1280 px)');
  ok(await p.$eval('.rgrid', g => getComputedStyle(g).display === 'grid') && await p.$$eval('#rFil .fsec', x => x.length) >= 5, 'columna de filtros a la izquierda: fecha, frente, tipo, capa, topógrafo…');
  ok(await p.$eval('#lista', t => t.classList.contains('compacta')) && await p.$$eval('#lista thead [data-hc]', x => x.map(b => b.dataset.hc).join()) === 'cod,lib,fr,pk,fe', 'tabla compacta con columnas Código y estado, Liberación, Frente, Progresiva, Fecha y topógrafo');
  const alto = await p.$eval('#lista tbody tr[data-id]:not(:has(.tn))', tr => tr.getBoundingClientRect().height);
  ok(alto < 56, `filas de una sola línea (${Math.round(alto)} px de alto)`);
  const total = await filas(p);
  // Frente: conteo y varias opciones a la vez
  const op = async (k, v) => p.$(`#rFil [data-fk="${k}"][value="${v}"]`);
  const nOeste = +(await p.$eval('#rFil [data-fk="sub"][value="pp-oeste"]', i => i.closest('.fop').querySelector('.c').textContent));
  await (await op('sub', 'pp-oeste')).click(); await p.waitForTimeout(250);
  const fr1 = await p.$$eval('#lista tbody tr[data-id] .tfr', x => [...new Set(x.map(t => t.textContent))]);
  ok(fr1.join() === 'Presa Principal Oeste' && await filas(p) === Math.min(nOeste, 100), `marcar un frente deja solo ese, y el número decía cuántos quedarían (${nOeste})`);
  const nEste = +(await p.$eval('#rFil [data-fk="sub"][value="pp-este"]', i => i.closest('.fop').querySelector('.c').textContent));
  await (await op('sub', 'pp-este')).click(); await p.waitForTimeout(250);
  const fr2 = await p.$$eval('#lista tbody tr[data-id] .tfr', x => [...new Set(x.map(t => t.textContent))].sort());
  ok(fr2.join() === 'Presa Principal Este,Presa Principal Oeste' && await filas(p) === Math.min(nOeste + nEste, 100), 'se pueden marcar varios frentes a la vez');
  ok((await p.textContent('#rFil .fcol-h')).includes('1') && (await p.textContent('[data-fsec="sub"] summary')).includes('2'), 'los filtros puestos se cuentan en la columna');
  // Los conteos de tipo y capa se ajustan a los frentes marcados
  const capas = await p.$$eval('#rFil [data-fk="capa"]', x => x.map(i => i.value));
  ok(capas.includes('Capa 12'), 'la capa muestra las opciones de los frentes marcados');
  const nC12 = +(await p.$eval('#rFil [data-fk="capa"][value="Capa 12"]', i => i.closest('.fop').querySelector('.c').textContent));
  await (await op('capa', 'Capa 12')).click(); await p.waitForTimeout(250);
  ok(await filas(p) === nC12 && nC12 >= 2 && await p.$$eval('#lista tbody tr[data-id] .tdesc b', x => x.every(b => b.textContent.includes('Capa 12'))), `frente + capa: quedan las ${nC12} de la Capa 12`);
  // Buscar dentro de un filtro
  const busq = await p.$('[data-fsec="tipo"] [data-fbus]');
  if (busq) { await busq.fill('filtro'); await p.waitForTimeout(100); ok(await p.$$eval('[data-fsec="tipo"] .fop:not([hidden])', x => x.every(l => /filtro/i.test(l.textContent))), 'buscar dentro de «Tipo» deja solo los que coinciden'); }
  await p.screenshot({ path: OUT + '/01-registros.png' });
  // Persistencia
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(1500); await ir(p, 'todos'); await p.waitForSelector('#rFil.fcol');
  ok(await filas(p) === nC12 && await p.$eval('#rFil [data-fk="capa"][value="Capa 12"]', i => i.checked), 'los filtros se recuerdan al volver a abrir');
  await p.click('#rfX'); await p.waitForTimeout(300);
  ok(await filas(p) === total && !(await p.$('#rfX')), '«Limpiar todo» quita los filtros');
  // Cabeceras: ordenar
  await p.click('[data-hc="pk"]'); await p.waitForSelector('#hPop'); await p.click('#hPop [data-po="pk:asc"]'); await p.waitForTimeout(300);
  const pks = await p.$$eval('#lista tbody tr[data-id] td.mono', x => x.map(t => t.textContent.trim().split(' ')[0]).filter(t => /\d\+\d/.test(t)).map(t => { const [a, b] = t.split('+'); return +a * 1000 + +b; }));
  ok(pks.length > 10 && pks.every((v, i) => !i || v >= pks[i - 1]), 'clic en «Progresiva» → ordena de menor a mayor');
  ok(await p.$eval('th.hc.ord', t => t.getAttribute('aria-sort')) === 'ascending' && (await p.textContent('th.hc.ord')).includes('↑'), 'la columna ordenada lo muestra con la flecha');
  await p.click('[data-hc="fr"]'); await p.waitForSelector('#hPop'); await p.click('#hPop [data-po="fr:desc"]'); await p.waitForTimeout(300);
  const frs = await p.$$eval('#lista tbody tr[data-id] .tfr', x => x.map(t => t.textContent));
  ok(frs.every((v, i) => !i || v.localeCompare(frs[i - 1], 'es') <= 0), 'ordenar el frente de Z a A');
  // Cabeceras: filtrar estado y topógrafo
  await p.click('[data-hc="cod"]'); await p.waitForSelector('#hPop [data-fst]');
  await p.click('#hPop [data-fst="OB"]'); await p.waitForTimeout(300);
  ok(await p.$$eval('#lista tbody tr[data-id] .tcod', x => x.length > 0 && x.every(t => t.textContent.includes('Observado'))) && await p.$('#hPop'), 'filtrar por estado desde la cabecera (la ventanita sigue abierta para marcar otro)');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(!(await p.$('#hPop')) && await p.$eval('th.hc.filt [data-hc]', b => b.dataset.hc) === 'cod', 'Esc la cierra y la columna queda marcada como filtrada');
  await p.click('#rSt [data-st=""]'); await p.waitForTimeout(250);
  await p.click('[data-hc="fe"]'); await p.waitForSelector('#hPop [data-fk="topo"]');
  ok(await p.$$eval('#hPop [data-fk="topo"]', x => x.length) >= 2, 'la cabecera «Fecha y topógrafo» filtra por topógrafo');
  await p.click('#hPop [data-fk="topo"][value="CS"]'); await p.mouse.click(1000, 40); await p.waitForTimeout(250);
  ok(!(await p.$('#hPop')) && await p.$('#rFil [data-fk="topo"][value="CS"]:checked'), 'clic afuera cierra; la columna de filtros ya lo tiene marcado');
  await p.click('#rfX'); await p.waitForTimeout(250);
  // Ficha a la derecha sin tapar la lista
  await p.click('#lista tbody tr[data-id] .tdesc'); await p.waitForTimeout(600);
  const fi = await p.evaluate(() => ({ sh: document.querySelector('#sheet').getBoundingClientRect().left, tab: document.querySelector('#lista').getBoundingClientRect().right }));
  ok(fi.tab <= fi.sh + 1, 'al abrir la ficha queda a la derecha y la tabla no queda tapada');
  await p.screenshot({ path: OUT + '/02-registros-ficha.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);

  // --- Bandeja
  await ir(p, 'bandeja'); await p.waitForSelector('#bFil.fcol');
  ok(await p.$$eval('#bFil .fsec', x => x.map(d => d.dataset.fsec).join()) === 'sub,tipo,capa,topo', 'Bandeja: filtros de frente, tipo, capa y topógrafo con conteos');
  ok(await p.$('#bFr') === null, 'en computadora ya no hay desplegables de frente y topógrafo arriba');
  const nb = await filas(p, '#blist tr[data-rid]');
  await p.click('#bFil [data-fk="capa"][value="Capa 12"]'); await p.waitForTimeout(250);
  ok(await filas(p, '#blist tr[data-rid]') === 2 && nb === 3, `filtrar la Bandeja por capa (${nb} → 2)`);
  await p.click('#blist [data-hc="pk"]'); await p.click('#hPop [data-po="pk:desc"]'); await p.waitForTimeout(250);
  ok((await p.$$eval('#blist tr[data-rid] td.mono', x => x.map(t => t.textContent.trim()))).join('|').startsWith('0+300'), 'ordenar la Bandeja por progresiva (de mayor a menor)');
  await p.screenshot({ path: OUT + '/03-bandeja.png' });
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(1500); await ir(p, 'bandeja'); await p.waitForSelector('#bFil.fcol');
  ok(await filas(p, '#blist tr[data-rid]') === 2 && (await p.textContent('#blist tr[data-rid] td.mono')).trim().startsWith('0+300'), 'la Bandeja recuerda filtro y orden');
  await p.click('#bFil #rfX'); await p.waitForTimeout(250);
  ok(await filas(p, '#blist tr[data-rid]') === 3, '«Limpiar todo» en la Bandeja');

  // --- Ajustes
  await ir(p, 'ajustes'); await p.waitForSelector('.ajnav');
  const nav = await p.$$eval('.ajnav [data-tab]', x => x.map(b => b.getBoundingClientRect()));
  ok(nav.length === 9 && nav.every((r, i) => !i || (r.top > nav[i - 1].top && Math.abs(r.left - nav[0].left) < 2)), 'Ajustes: las 9 secciones en un menú a la izquierda');
  await p.click('[data-tab="usuarios"]'); await p.waitForTimeout(300);
  const cards = await p.$$eval('#ajBody > .card', x => x.map(c => c.getBoundingClientRect().left));
  ok(cards.length === 3 && cards[2] > cards[0] + 300, 'Usuarios en dos columnas: solicitudes y agregar a la izquierda, «Con acceso» a la derecha');
  await p.click('[data-tab="tipos"]'); await p.waitForTimeout(400);
  ok(!!(await p.$('.md-wrap .md-idx')) && await p.$$eval('.md-det > .tycard', x => x.filter(c => !c.hidden).length) === 1, 'Tipos: lista de elementos y el elegido al lado');
  await p.screenshot({ path: OUT + '/04-ajustes-tipos.png' });
  await p.click('[data-tab="lugares"]'); await p.waitForTimeout(400);
  ok(await p.$$eval('#ajBody .srow', x => x.every(r => r.scrollWidth <= r.clientWidth + 2)), 'Lugares: las filas de frentes caben sin cortarse');
  await ctx.close();

  // --- Laptop 1366
  [ctx, p] = await abrir(b, { viewport: { width: 1366, height: 768 } });
  await ir(p, 'todos'); await p.waitForSelector('#rFil.fcol');
  ok(await p.$eval('.twrap', w => w.scrollWidth <= w.clientWidth + 1), 'laptop 1366: la tabla cabe sin desplazarse a los lados');
  await p.screenshot({ path: OUT + '/05-laptop.png' });
  await ir(p, 'ajustes'); await p.click('[data-tab="tipos"]'); await p.waitForTimeout(300);
  ok(await p.$eval('#tyList', e => getComputedStyle(e).display !== 'grid'), 'laptop: Tipos en una columna (los nombres se leen completos)');
  await ctx.close();

  // --- Celular
  [ctx, p] = await abrir(b, { ...devices['Pixel 7'] });
  await p.click('#nav [data-v="todos"]').catch(async () => { await p.evaluate(() => { location.hash = '#todos'; }); });
  await p.waitForTimeout(800);
  ok(await p.$('#rFil.fcol') === null && await p.$('#rFilBtn') !== null, 'celular: sin columna de filtros, con el botón «Filtrar» de siempre');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'celular: sin desplazamiento horizontal');
  await ctx.close();
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
