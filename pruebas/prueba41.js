// Versión 35: revisión de computadora. Media pantalla (960 px) con tabla compacta y filtros en fila; filtros puestos
// sobre la tabla y columna de filtros que se oculta; cabecera fija; Ajustes con lista y detalle en pantalla ancha y
// desplegables suaves a media pantalla; Modelo 2D con filtros de capas legibles y columna que se oculta.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba41'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/', D = f => path.join(__dirname, 'datos', f);
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const escuchar = (p, n) => { p.on('pageerror', e => { errores.push(n + ': ' + e.message); console.log('PAGEERROR', n, e.message); }); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(n + ': ' + m.text()); console.log('CONSOLE', n, m.text()); } }); };
const nuevo = (extra) => ({ actividad: 'LIB', estado: 'PT', numero: '', creadoPor: ADMIN.email, origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', descripcion: 'Liberación de prueba', fechaCampo: { __ts: Date.now() - 3600e3 }, creadoEn: { __ts: Date.now() - 3600e3 }, ...extra });
const aceptar = async p => { await p.waitForSelector('.dlg.on [type=submit]'); await p.waitForTimeout(250); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(500); };
async function abrir(b, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage(); escuchar(p, 'w' + w); await p.goto(URL);
  const d = JSON.parse(fs.readFileSync(D('historico-prueba.json')));
  await p.evaluate(([d, u, ns]) => { localStorage.clear(); const st = {}; d.registros.forEach(r => { const { id, ...x } = r; ['fechaCampo', 'fechaLiberacion', 'fechaEntrega'].forEach(k => { x[k] = x[k] ? { __ts: x[k] } : null; }); x.creadoEn = x.fechaCampo; x.origen = 'excel'; st['liberaciones/' + id] = x; });
    Object.entries(ns).forEach(([k, n]) => { st['liberaciones/' + k] = n; });
    st['capas/pp-oeste'] = { tipos: { filtro1: { capas: [{ nombre: 'Capa 11' }], noAplica: [] } } };
    localStorage.setItem('__fakeDB', JSON.stringify(st)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); },
    [d, ADMIN, { n1: nuevo({ pkInicio: 100, pkFin: 140 }), n2: nuevo({ pkInicio: 300, pkFin: 330, capa: 'Capa 12' }), n3: nuevo({ pkInicio: 200, pkFin: 240, subestructuraId: 'pp-este', topografoId: 'CS' }) }]);
  await p.reload(); await p.waitForSelector('#nav button');
  await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('resumen/')), null, { timeout: 30000 });
  await p.waitForTimeout(2000);
  return [ctx, p];
}
const ir = async (p, v) => { await p.click(`#nav [data-v="${v}"]`); await p.waitForTimeout(700); };
(async () => {
  const b = await chromium.launch();

  // ===== Media pantalla (960) =====
  let [ctx, p] = await abrir(b, 960, 1000);
  await ir(p, 'todos'); await p.waitForSelector('#lista');
  ok(await p.$eval('#lista', t => t.matches('table.rtab.compacta')), '960 px: Registros en tabla compacta (no tarjetas de celular)');
  ok(!!(await p.$('#rFil.rfil #rfTipo')) && !(await p.$('#rFilBtn')), '960 px: los filtros de siempre en fila, sin la hoja del celular');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '960 px: sin desplazamiento horizontal');
  await p.selectOption('#rfSub', 'pp-este'); await p.waitForTimeout(300);
  ok((await p.$$eval('#lista tbody tr[data-id] .tfr', x => [...new Set(x.map(t => t.textContent))])).join() === 'Presa Principal Este', '960 px: el filtro de frente funciona');
  await p.selectOption('#rfSub', ''); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/01-registros-960.png' });
  await ir(p, 'bandeja'); await p.waitForSelector('#blist');
  ok(await p.$eval('#blist', t => t.matches('table.rtab.compacta')) && !!(await p.$('#bFr')), '960 px: Bandeja en tabla con los filtros de frente y topógrafo');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '960 px: Bandeja sin desplazamiento horizontal');
  await ir(p, 'ajustes'); await p.click('[data-tab="tipos"]'); await p.waitForSelector('#tyList .tycard');
  ok(!(await p.$('.md-wrap')) && !!(await p.$('#tyList .plg-mas')), '960 px: Tipos con grupos desplegables');
  const mt = await p.$('#tyList .tycard:has(.tygrp[data-e="mt"])');
  await mt.$eval('.plg-mas', x => x.click()); await p.waitForTimeout(50);
  ok(await mt.$$eval(':scope > .tyrow.plg-in', x => x.length) >= 10, 'al desplegar, las filas nuevas entran con una animación suave');
  await ctx.close();

  // ===== Pantalla completa (1920) =====
  [ctx, p] = await abrir(b, 1920, 1080);
  await ir(p, 'todos'); await p.waitForSelector('#rFil.fcol');
  await p.$eval('#rFil [data-fk="sub"][value="pp-este"]', i => i.click()); await p.waitForTimeout(300);
  ok((await p.textContent('#rChips')).includes('Presa Principal Este') && (await p.textContent('#rChips')).includes('registro'), 'los filtros puestos se ven sobre la tabla con cuántos registros quedan');
  await p.click('#rChips [data-quitar="sub"]'); await p.waitForTimeout(300);
  ok(!(await p.$('#rChips')) && !(await p.$('#rFil [data-fk="sub"]:checked')), 'la ✕ de un filtro puesto lo quita');
  ok(await p.$eval('#lista thead th', th => getComputedStyle(th).position === 'sticky'), 'cabecera de la tabla fija');
  await p.evaluate(() => scrollTo(0, 1500)); await p.waitForTimeout(150);
  ok(await p.$eval('#lista thead th', th => { const r = th.getBoundingClientRect(); return r.top >= -1 && r.top < 5; }), 'al bajar por la lista, la cabecera sigue a la vista');
  await p.evaluate(() => scrollTo(0, 0));
  await p.click('#rFacT'); await p.waitForTimeout(300);
  ok(!(await p.$('#rFil.fcol')) && (await p.textContent('#rFacT')).startsWith('Filtros'), '«Ocultar filtros» deja la tabla a todo lo ancho');
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(1200); await ir(p, 'todos');
  ok(!(await p.$('#rFil.fcol')), 'se recuerda oculta');
  await p.click('#rFacT'); await p.waitForSelector('#rFil.fcol');
  ok(!!(await p.$('#rFil.fcol')), 'y vuelve con «Filtros»');
  // Ajustes: lista y detalle
  await ir(p, 'ajustes'); await p.click('[data-tab="tipos"]'); await p.waitForSelector('.md-wrap');
  const vis = () => p.$$eval('.md-det > .card', x => x.filter(c => !c.hidden).map(c => c.querySelector('.tygrp')?.dataset.e ?? c.id));
  ok((await vis()).join() === 'mt' && await p.$$eval('.md-det .tycard:not([hidden]) > .tyrow', x => x.every(r => !r.hidden)), 'Tipos: lista de elementos a la izquierda y el elegido completo a la derecha');
  await p.click('.md-idx [data-md="geo"]').catch(async () => { const ids = await p.$$eval('.md-idx [data-md]', x => x.map(b => b.dataset.md)); await p.click(`.md-idx [data-md="${ids[1]}"]`); });
  const v2 = await vis();
  ok(v2.length === 1 && v2[0] !== 'mt' && await p.$eval('.md-idx [aria-current="true"]', b => !!b), 'elegir otro elemento cambia el detalle');
  await p.click('.md-idx [data-md="_extra"]');
  ok((await vis()).join() === 'eqList', '«Equipos» también está en la lista');
  await p.screenshot({ path: OUT + '/02-tipos-1920.png' });
  await p.fill('#tyQ', 'relleno'); await p.waitForTimeout(500);
  ok(!(await p.$('.md-wrap')) && await p.$$eval('#tyList > .tycard', x => x.length) >= 1, 'al buscar se ven todos los grupos que coinciden');
  await p.fill('#tyQ', ''); await p.waitForTimeout(500);
  await p.click('[data-tab="lugares"]'); await p.waitForSelector('.md-wrap');
  ok(await p.$$eval('.md-det > .card', x => x.filter(c => !c.hidden).length) === 1, 'Lugares: lista de estructuras y el detalle de la elegida');
  await p.click('.md-idx [data-md="_nuevo"]'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => document.activeElement?.id === 'eNew'), '«+ Nueva estructura» lleva al campo para escribirla');
  // Modelo 2D
  await ir(p, 'panel'); await p.click('[data-vista="modelo"]'); await p.waitForSelector('#mBody');
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await aceptar(p);
  await p.waitForFunction(() => window.__fakeStore()['secciones/pp-oeste'], null, { timeout: 15000 });
  ok(await p.$$eval('.pside .capf select', x => x.every(s => s.getBoundingClientRect().width > 200)), 'Modelo 2D: los filtros de la lista de capas se leen completos');
  await p.click('[data-full]'); await p.waitForTimeout(500);
  ok(!!(await p.$('[data-lat]')), 'pantalla completa: botón «Ocultar capas»');
  await p.click('[data-lat]'); await p.waitForTimeout(400);
  ok(await p.$eval('.pside', s => getComputedStyle(s).display === 'none') && (await p.textContent('[data-lat]')) === 'Mostrar capas', 'oculta la columna izquierda y el modelo usa todo el ancho');
  await p.mouse.move(900, 500); await p.keyboard.press('c'); await p.waitForTimeout(400);
  ok(await p.$eval('.pside', s => getComputedStyle(s).display !== 'none'), 'la tecla C la vuelve a mostrar');
  await p.screenshot({ path: OUT + '/03-modelo-completa.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await ctx.close();
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
