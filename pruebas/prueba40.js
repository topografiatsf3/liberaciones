// Versión 34: Panel en computadora (rueda para acercar el perfil y la planta, arrastrar, doble clic, regla fija,
// filas compactas, «Qué falta» en dos columnas, tabla y lista lado a lado) y listas desplegables en Ajustes.
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba40'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const escuchar = (p, n) => { p.on('pageerror', e => { errores.push(n + ': ' + e.message); console.log('PAGEERROR', n, e.message); }); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(n + ': ' + m.text()); console.log('CONSOLE', n, m.text()); } }); };
// Ejes inventados (líneas rectas) para que la planta se dibuje
const eje = (e0, n0, largo, ang) => { const p = []; for (let k = 0; k <= largo; k += 50) p.push(k, +(e0 + k * Math.cos(ang)).toFixed(3), +(n0 + k * Math.sin(ang)).toFixed(3)); return { puntos: p, nombre: 'eje.csv' }; };
async function abrir(b, opts) {
  const ctx = await b.newContext(opts);
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage(); escuchar(p, 'pc'); await p.goto(URL);
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'historico-prueba.json')));
  await p.evaluate(([d, u, ejes]) => { localStorage.clear(); const st = {}; d.registros.forEach(r => { const { id, ...x } = r; ['fechaCampo', 'fechaLiberacion', 'fechaEntrega'].forEach(k => { x[k] = x[k] ? { __ts: x[k] } : null; }); x.creadoEn = x.fechaCampo; x.origen = 'excel'; st['liberaciones/' + id] = x; });
    Object.entries(ejes).forEach(([k, v]) => { st['ejes/' + k] = v; });
    localStorage.setItem('__fakeDB', JSON.stringify(st)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('perfil')); },
    [d, ADMIN, { 'pp-oeste': eje(500000, 8300000, 2700, 0.3), 'pp-este': eje(503000, 8301500, 1200, -0.6), 'pp-sur': eje(500500, 8299000, 1800, 1.2) }]);
  await p.reload(); await p.waitForSelector('#nav button');
  await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('resumen/')), null, { timeout: 30000 });
  await p.waitForTimeout(2000);
  return [ctx, p];
}
(async () => {
  const b = await chromium.launch();
  let [ctx, p] = await abrir(b, { viewport: { width: 1920, height: 1080 } });
  await p.click('#nav [data-v="panel"]'); await p.waitForSelector('#chart svg[role=img]'); await p.waitForTimeout(600);

  // --- Perfil
  ok(await p.$('#chart .pf-regla') && await p.$('#chart .pf-bar'), 'perfil: barra de opciones y regla de progresivas aparte');
  const ticks0 = await p.$$eval('#chart .pf-regla .tick', x => x.map(t => t.textContent));
  const sv = await (await p.$('#chart svg[role=img]')).boundingBox();
  await p.mouse.move(sv.x + sv.width * 0.6, sv.y + 60);
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(60); }
  await p.waitForTimeout(500);
  const ticks1 = await p.$$eval('#chart .pf-regla .tick', x => x.map(t => t.textContent));
  const rg = await p.textContent('#chart .pf-rg');
  ok(ticks1.join() !== ticks0.join() && /PK \d\+\d{3} a \d\+\d{3}/.test(rg), `la rueda acerca el perfil a un tramo (${rg})`);
  ok((await p.textContent('#pAcc')).includes('–'), 'el filtro «Progresiva» de la izquierda muestra el tramo acercado');
  const pkDe = t => { const [a, b] = t.split('+'); return +a * 1000 + +b; };
  const [a1, b1] = rg.match(/\d\+\d{3}/g).map(pkDe);
  ok(b1 - a1 < 1200, `el tramo es más corto que el frente (${b1 - a1} m de 2700)`);
  // regla fija
  await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(200);
  ok(await p.$eval('#chart .pf-regla', r => r.getBoundingClientRect().top < 5 && r.getBoundingClientRect().bottom > 10), 'al bajar, la regla de progresivas se queda arriba a la vista');
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
  // arrastrar
  const sv2 = await (await p.$('#chart svg[role=img]')).boundingBox();
  await p.mouse.move(sv2.x + sv2.width * 0.7, sv2.y + 20); await p.mouse.down(); await p.mouse.move(sv2.x + sv2.width * 0.4, sv2.y + 20, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(400);
  const [a2] = (await p.textContent('#chart .pf-rg')).match(/\d\+\d{3}/g).map(pkDe);
  ok(a2 > a1, `arrastrar a la izquierda avanza en la progresiva (${a1} → ${a2})`);
  ok(!(await p.$('#sheet.on')), 'y no abre la ficha del tramo que quedó debajo');
  await p.click('#chart [data-pfc="1"]'); await p.waitForTimeout(300);
  const hC = await p.$eval('#chart svg[role=img]', s => +s.getAttribute('height'));
  await p.click('#chart [data-pfc="0"]'); await p.waitForTimeout(300);
  const hN = await p.$eval('#chart svg[role=img]', s => +s.getAttribute('height'));
  ok(hC < hN * 0.75, `filas compactas: el perfil ocupa menos alto (${hC} px en vez de ${hN})`);
  await p.click('#chart [data-pfc="1"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/01-perfil-acercado.png' });
  await p.click('#chart [data-pftodo]'); await p.waitForTimeout(400);
  ok(!(await p.$('#chart .pf-rg')) && (await p.textContent('#pAcc')).includes('Todo el frente'), '«Ver todo el frente» quita el acercamiento');
  await p.mouse.move(sv.x + sv.width * 0.5, sv.y + 60); for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(60); }
  await p.waitForTimeout(400); ok(!!(await p.$('#chart .pf-rg')), 'se vuelve a acercar');
  const y0 = (await (await p.$('#chart svg[role=img]')).boundingBox()).y;
  await p.mouse.dblclick(sv.x + 5, y0 + 5); await p.waitForTimeout(400);
  ok(!(await p.$('#chart .pf-rg')), 'doble clic vuelve a todo el frente');
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(1200); await p.click('#nav [data-v="panel"]'); await p.waitForSelector('#chart svg[role=img]');
  ok(await p.$eval('#chart [data-pfc="1"]', b => b.getAttribute('aria-pressed') === 'true'), 'las filas compactas se recuerdan');
  // «Qué falta liberar» y la lista lado a lado
  const lado = await p.evaluate(() => { const f = document.querySelector('#pFalta'), l = document.querySelector('.plist'); return f && !f.hidden && l ? [f.getBoundingClientRect().left, l.getBoundingClientRect().left] : null; });
  ok(lado && lado[1] > lado[0] + 300, '«Qué falta liberar» y la lista de liberaciones van lado a lado');

  // --- Qué falta
  await p.click('[data-vista="lista"]'); await p.waitForSelector('.qflist .qf');
  const qf = await p.$$eval('.qflist .qf', x => x.slice(0, 2).map(q => q.getBoundingClientRect().top));
  ok(Math.abs(qf[0] - qf[1]) < 2, '«Qué falta»: las capas en dos columnas');
  ok(await p.$('#chart .pf-bar') === null, 'sin la barra del perfil');

  // --- Planta
  await p.click('[data-vista="planta"]'); await p.waitForSelector('.plwrap svg'); await p.waitForTimeout(400);
  const hP = await p.$eval('.plwrap svg', s => +s.getAttribute('height'));
  ok(hP >= 640, `planta alta en computadora (${hP} px)`);
  const vb0 = await p.$eval('.plwrap svg', s => s.getAttribute('viewBox'));
  const pb = await (await p.$('.plwrap svg')).boundingBox();
  await p.mouse.move(pb.x + pb.width * 0.4, pb.y + pb.height * 0.5);
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(40); }
  const vb1 = (await p.$eval('.plwrap svg', s => s.getAttribute('viewBox'))).split(' ').map(Number);
  ok(vb1[2] < +vb0.split(' ')[2] / 3 && Math.abs(vb1[2] / vb1[3] - pb.width / pb.height) < 0.05, 'planta: la rueda acerca sin deformar');
  const tam = await p.$eval('.plwrap .lab-pl', t => { const sv = t.ownerSVGElement, r = sv.getBoundingClientRect(), v = sv.getAttribute('viewBox').split(' ').map(Number); return parseFloat(getComputedStyle(t).fontSize) * r.width / v[2]; });
  ok(tam > 10 && tam < 16, `los nombres siguen legibles al acercar (${tam.toFixed(1)} px)`);
  await p.mouse.down(); await p.mouse.move(pb.x + pb.width * 0.4 + 150, pb.y + pb.height * 0.5, { steps: 5 }); await p.mouse.up();
  const vb2 = (await p.$eval('.plwrap svg', s => s.getAttribute('viewBox'))).split(' ').map(Number);
  ok(vb2[0] < vb1[0], 'arrastrar mueve la planta');
  await p.screenshot({ path: OUT + '/02-planta.png' });
  await p.click('.plwrap [data-pz="0"]'); await p.waitForTimeout(150);
  ok(await p.$eval('.plwrap svg', s => s.getAttribute('viewBox')) === vb0, '«Todo» vuelve a ver toda la planta');

  // --- Ajustes: listas desplegables
  await p.click('#nav [data-v="ajustes"]'); await p.click('[data-tab="tipos"]'); await p.waitForSelector('#tyList .tycard');
  const mt = await p.$('#tyList .tycard:has(.tygrp[data-e="mt"])');
  const vis = async c => c.$$eval(':scope > .tyrow', x => x.filter(r => !r.hidden).length);
  const nTot = await mt.$$eval(':scope > .tyrow', x => x.length);
  ok(nTot > 8 && await vis(mt) === 8 && (await mt.$eval('.plg-mas', b => b.textContent)).includes(`Ver todos (${nTot})`), `Tipos: «Movimiento de tierras» muestra 8 de ${nTot} con «Ver todos»`);
  await mt.$eval('.plg-mas', b => b.click()); await p.waitForTimeout(100);
  ok(await vis(mt) === nTot && (await mt.$eval('.plg-mas', b => b.textContent)) === 'Ver menos', '«Ver todos» despliega la lista completa');
  await mt.$eval('.plg-x', b => b.click()); await p.waitForTimeout(100);
  ok(await vis(mt) === 0 && await mt.$eval('.ty-add2', a => a.hidden) && await mt.$eval('.plg-x', b => b.getAttribute('aria-expanded') === 'false'), 'la flecha de la cabecera pliega el grupo entero');
  await p.click('[data-tab="lugares"]'); await p.click('[data-tab="tipos"]'); await p.waitForSelector('#tyList .tycard');
  ok(await p.$eval('#tyList .tycard:has(.tygrp[data-e="mt"])', c => c.classList.contains('plg-cerrado')), 'lo plegado se recuerda');
  await p.fill('#tyQ', 'relleno'); await p.waitForTimeout(500);
  ok(await p.$eval('#tyList .tycard:has(.tygrp[data-e="mt"])', c => !c.classList.contains('plg-cerrado') && [...c.querySelectorAll(':scope > .tyrow')].every(r => !r.hidden)), 'al buscar se ve todo lo que coincide, aunque el grupo esté plegado');
  await p.fill('#tyQ', ''); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/03-tipos.png' });
  await p.click('[data-tab="lugares"]'); await p.waitForTimeout(300);
  // Una estructura con 7 frentes: se agrega uno a «Accesos» (6 frentes)
  await p.fill('#ajBody .card.est[data-e="acc"] [data-k="snew"]', 'Acceso de prueba'); await p.click('#ajBody .card.est[data-e="acc"] [data-k="sadd"]'); await p.waitForTimeout(800);
  const acc = await p.$('#ajBody .card.est[data-e="acc"]');
  const visF = c => c.$$eval(':scope > .srow:not(.head)', x => x.filter(r => !r.hidden).length);
  ok(acc && await visF(acc) === 7 && (await acc.$eval('.plg-mas', b => b.textContent)) === 'Ver menos', 'Lugares: al agregar el 7.º frente el grupo se abre entero para que se vea lo nuevo');
  await acc.$eval('.plg-mas', b => b.click()); await p.waitForTimeout(100);
  ok(await visF(acc) === 6 && (await acc.$eval('.plg-mas', b => b.textContent)) === 'Ver todos (7)', 'Lugares: «Ver menos» deja 6 y «Ver todos (7)»');
  ok(await p.$$eval('#ajBody .card.est[data-e] .est-h .plg-x', x => x.length) >= 3, 'Lugares: cada estructura se puede plegar');
  await p.click('[data-tab="topografos"]'); await p.waitForTimeout(300);
  ok(await p.$$eval('#tpList > .prow[data-i]', x => x.filter(r => !r.hidden).length) <= 10, 'Topógrafos: se ven hasta 10 y el resto con «Ver todos»');
  await ctx.close();

  // --- Celular: el perfil sin rueda ni barra
  [ctx, p] = await abrir(b, { ...devices['Pixel 7'] });
  await p.click('#nav [data-v="panel"]').catch(() => {}); await p.waitForTimeout(1500);
  ok(await p.$('#chart .pf-bar') === null && await p.$('#chart .pf-regla') === null, 'celular: el perfil queda como antes');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'celular: sin desplazamiento horizontal');
  await ctx.close();
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
