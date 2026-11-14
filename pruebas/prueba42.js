// Versión 37: Panel. Planta recortada a su cuadro (sin desfase), tipo y capa con etiqueta, los más liberados a un toque,
// aviso si el tipo no tiene liberaciones, tabla de avance por capa y frente; la rueda acerca solo con Ctrl;
// clic derecho en el nombre de una capa del perfil: exportar sus liberaciones (CSV completo), lo que falta, ver en Registros.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba42'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const escuchar = (p, n) => { p.on('pageerror', e => { errores.push(n + ': ' + e.message); console.log('PAGEERROR', n, e.message); }); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(n + ': ' + m.text()); console.log('CONSOLE', n, m.text()); } }); };
const eje = (e0, n0, largo, ang) => { const p = []; for (let k = 0; k <= largo; k += 50) p.push(k, +(e0 + k * Math.cos(ang)).toFixed(3), +(n0 + k * Math.sin(ang)).toFixed(3)); return { puntos: p, nombre: 'eje.csv' }; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage(); escuchar(p, 'pc'); await p.goto(URL);
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'historico-prueba.json')));
  await p.evaluate(([d, u, ejes]) => { localStorage.clear(); const st = {}; d.registros.forEach(r => { const { id, ...x } = r; ['fechaCampo', 'fechaLiberacion', 'fechaEntrega'].forEach(k => { x[k] = x[k] ? { __ts: x[k] } : null; }); x.creadoEn = x.fechaCampo; x.origen = 'excel'; st['liberaciones/' + id] = x; });
    Object.entries(ejes).forEach(([k, v]) => { st['ejes/' + k] = v; });
    localStorage.setItem('__fakeDB', JSON.stringify(st)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('planta')); },
    [d, ADMIN, { 'pp-oeste': eje(500000, 8300000, 2700, 0.3), 'pp-este': eje(503000, 8301500, 1200, -0.6) }]);
  await p.reload(); await p.waitForSelector('#nav button');
  await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('resumen/')), null, { timeout: 30000 });
  await p.waitForTimeout(2000);
  await p.click('#nav [data-v="panel"]'); await p.waitForSelector('.plwrap svg'); await p.waitForTimeout(500);

  // --- Planta
  ok(await p.$eval('.plwrap svg', s => getComputedStyle(s).overflow === 'hidden'), 'planta: el dibujo no se sale de su cuadro al acercar o mover');
  const opts = await p.$$eval('#pTipoPl optgroup', g => g.map(x => x.label));
  ok(opts[0] === 'Con liberaciones' && (await p.$eval('#pTipoPl', s => s.selectedOptions[0].closest('optgroup').label)) === 'Con liberaciones', 'tipo: primero los que tienen liberaciones y se elige solo el que más tiene');
  ok(await p.$eval('.pl-bar .plsel span', s => s.textContent) === 'Tipo' && await p.$$eval('#plTop [data-pltipo]', x => x.length) >= 2, 'tipo y capa con su etiqueta, y los más liberados a un toque');
  // Avance por capa y frente
  await p.waitForSelector('#plAvance table');
  ok(['Tipo', 'Capa'].includes(await p.$eval('#plAvance thead th', t => t.textContent.trim())), 'tabla de avance también para un tipo sin capas (una fila)');
  await p.selectOption('#pTipoPl', 'masivo'); await p.waitForTimeout(500); // un tipo con capas
  const cab = await p.$$eval('#plAvance thead th', x => x.map(t => t.textContent.trim()));
  ok(cab[0] === 'Capa' && cab.some(t => t.startsWith('Presa Principal Oeste')) && cab[cab.length - 1] === 'Total', 'tabla de avance: capas por frente con total: ' + cab.join(' | '));
  ok(cab.some(t => /Presa Principal Sur.*sin eje/.test(t)), 'el frente sin eje lo dice (y ofrece subirlo)');
  ok(await p.$$eval('#plAvance td.c-pct', x => x.length) > 0 && await p.$$eval('#plAvance td.c-pct', x => x.every(t => /^\d+%$/.test(t.textContent))), 'cada celda con su % liberado');
  const capa1 = await p.$eval('#plAvance tr[data-plcapa]', t => t.dataset.plcapa);
  await p.click('#plAvance tr[data-plcapa] td'); await p.waitForTimeout(400);
  ok(await p.$eval('#pCapaPl', s => s.value) === capa1 && await p.$eval('#plAvance tr.on', t => t.dataset.plcapa) === capa1, `tocar una capa de la tabla la muestra en la planta (${capa1})`);
  await p.screenshot({ path: OUT + '/01-planta.png', fullPage: true });
  // Tipo sin liberaciones
  const sin = await p.$eval('#pTipoPl optgroup[label="Sin liberaciones"] option', o => o.value);
  await p.selectOption('#pTipoPl', sin); await p.waitForTimeout(400);
  ok((await p.textContent('.pl-vacio')).includes('no tiene liberaciones') && await p.$$eval('.pl-vacio [data-pltipo]', x => x.length) >= 1, 'un tipo sin liberaciones lo dice y ofrece los que sí tienen');
  await p.click('.pl-vacio [data-pltipo]'); await p.waitForTimeout(400);
  ok(!(await p.$('.pl-vacio')), 'un toque vuelve a un tipo con liberaciones');
  // Rueda sin Ctrl: no acerca, avisa
  const vb0 = await p.$eval('.plwrap svg', s => s.getAttribute('viewBox'));
  const pb = await (await p.$('.plwrap svg')).boundingBox();
  await p.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2); await p.mouse.wheel(0, -300); await p.waitForTimeout(150);
  ok(await p.$eval('.plwrap svg', s => s.getAttribute('viewBox')) === vb0 && await p.$eval('.plwrap .rueda-aviso', a => a.classList.contains('on')), 'planta: la rueda sola no acerca y avisa «Mantén Ctrl…»');
  // la rueda sola bajó la página: se vuelve a poner el ratón sobre la planta
  await p.$eval('.plwrap svg', s => s.scrollIntoView({ block: 'center' })); const pb2 = await (await p.$('.plwrap svg')).boundingBox(); await p.mouse.move(pb2.x + pb2.width / 2, pb2.y + pb2.height / 2);
  await p.keyboard.down('Control'); await p.mouse.wheel(0, -300); await p.keyboard.up('Control'); await p.waitForTimeout(150);
  ok(await p.$eval('.plwrap svg', s => s.getAttribute('viewBox')) !== vb0, 'con Ctrl sí acerca');

  // --- Perfil
  await p.click('[data-vista="perfil"]'); await p.waitForSelector('#chart svg[role=img]'); await p.waitForTimeout(500);
  const sv = await (await p.$('#chart svg[role=img]')).boundingBox();
  await p.mouse.move(sv.x + sv.width * 0.6, sv.y + 60); await p.mouse.wheel(0, -300); await p.waitForTimeout(400);
  ok(!(await p.$('#chart .pf-rg')) && await p.$eval('#chart .rueda-aviso', a => a.classList.contains('on')), 'perfil: la rueda sola no acerca (la página puede bajar) y avisa');
  ok((await p.textContent('#chart .pf-ayuda')).includes('Ctrl'), 'la ayuda dice «Ctrl + rueda»');
  // Clic derecho en el nombre de una capa
  const lab = await p.$('#chart .lab2[data-banda^="filtro1|"]') || await p.$('#chart .lab2[data-banda]');
  const key = await lab.getAttribute('data-banda');
  await lab.click({ button: 'right' }); await p.waitForSelector('#ctx .ctx-i');
  const items = await p.$$eval('#ctx .ctx-i', x => x.map(b => b.textContent.trim()));
  ok(items[0].startsWith('Exportar sus') && items.includes('Ver en Registros') && items.includes('Ocultar esta capa'), 'clic derecho en el nombre: ' + items.join(' · '));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#ctx .ctx-i >> nth=0')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8'); const lineas = csv.trim().split(/\r?\n/);
  const n = +items[0].match(/\d+/)[0];
  ok(lineas.length === n + 1 && /SKT-TOP-\d+/.test(csv) && lineas[0].split(',').length > 10, `exporta las ${n} liberaciones con todas sus columnas (${lineas[0].split(',').length} columnas): ${dl.suggestedFilename()}`);
  if (items.some(t => t.startsWith('Exportar lo que falta'))) {
    await lab.click({ button: 'right' }); await p.waitForSelector('#ctx .ctx-i');
    const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('#ctx .ctx-i:has-text("Exportar lo que falta")')]);
    const c2 = fs.readFileSync(await dl2.path(), 'utf8');
    ok(c2.includes('PK desde') && /\d\+\d{3}/.test(c2), 'exporta los tramos que faltan liberar de esa capa');
  }
  await lab.click({ button: 'right' }); await p.waitForSelector('#ctx .ctx-i');
  await p.click('#ctx .ctx-i:has-text("Ver en Registros")'); await p.waitForSelector('#lista', { timeout: 20000 }); await p.waitForTimeout(1500);
  const [t0, c0] = key.split('|');
  const fl = await p.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('lib.filtros.')))).todos);
  ok(fl.tipo === t0 && fl.sub === 'pp-oeste' && (c0 ? fl.capa === c0 : true), `«Ver en Registros» abre Registros filtrado por frente, tipo${c0 ? ' y capa' : ''}`);
  await p.screenshot({ path: OUT + '/02-registros-capa.png' });
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
