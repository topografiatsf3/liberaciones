// Panel sin datos falsos. P1 una capa escrita distinto («Capa 1», «capa 1», «Capa 01») es una sola banda en Perfil,
// Qué falta, Planta, Registros y exportar · P2 los filtros de estado, topógrafo y «Solo hoy» solo resaltan: el % y lo que
// falta cuentan todo lo liberado y nunca se ofrece «Registrar este tramo» sobre un tramo ya liberado · P3 los números de
// arriba dicen «sin filtros» · P4 un PK invertido se dibuja entero en «Qué falta» · P7 el total de la tabla de Planta no
// dice 100 % con huecos · P8 fmtPk · P10 «Liberadas hoy en campo» cuenta la fecha de campo.
// Para ver que la prueba falla con una versión anterior: ANTES=ruta\index.html node pruebas\prueba45.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const filasXlsx = require('./xlsx');
const OUT = path.join(__dirname, 'capturas', 'prueba45'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const dia = 864e5, ahora = Date.now();
const eje = (e0, n0, largo, ang) => { const p = []; for (let k = 0; k <= largo; k += 50) p.push(k, +(e0 + k * Math.cos(ang)).toFixed(3), +(n0 + k * Math.sin(ang)).toFixed(3)); return { puntos: p, nombre: 'eje.csv' }; };
const lib = (sub, tipo, capa, a, b, estado, topo, dias, x = {}) => ({ actividad: 'LIB', creadoPor: 'otro@gmail.com', origen: 'app', estructuraId: sub.startsWith('pp') ? 'pp' : sub, subestructuraId: sub, elementoId: 'mt', tipoId: tipo, capa, topografoId: topo, estado, numero: 'SKT-TOP-0' + Math.round(a + 7000), pkInicio: a, pkFin: b, fechaCampo: { __ts: ahora - dias * dia }, creadoEn: { __ts: ahora - dias * dia }, archivos: [], ...x });
/* Datos contados a mano (frente Presa Principal Oeste, PK 0+000 a 2+700 = 2700 m):
   Relleno masivo, la misma capa escrita de tres formas: a1 «Capa 1» 0–300 EC (GN, hace 3 días) · a2 «capa 1» 300–600 EP
   (JL, hoy) · a3 «Capa 01» 1000–1270 PT (GN, hace 10 días) → liberado 870 m = 32 %; falta 1830 m: 0+600–1+000 y 1+270–2+700.
   Relleno de transición, sin capa: t1 con PK invertido 500 → 400 EC (JL, campo hace 5 días, subido hoy) → 100 m = 4 %.
   Arriba: liberadas hoy en campo 1 (a2) · pendientes 1 (a3) · en proceso 1 (a2) · entregadas a Calidad 2 (a1, t1).
   Planta de Presa Principal, masivo: oeste 870/2700 = 32 %; este y sur 0 %; total 870/(2700+1200+1800) = 15 %.
   Presa Auxiliar Norte (0+000 a 0+400): s1 superficie nivelada 0–398,5 → 99,6 %, queda 1,5 m: celda 99 % y total 99 %. */
const DB = {
  'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', activo: true },
  'liberaciones/a1': lib('pp-oeste', 'masivo', 'Capa 1', 0, 300, 'EC', 'GN', 3),
  'liberaciones/a2': lib('pp-oeste', 'masivo', 'capa 1', 300, 600, 'EP', 'JL', 0),
  'liberaciones/a3': lib('pp-oeste', 'masivo', 'Capa 01', 1000, 1270, 'PT', 'GN', 10),
  'liberaciones/t1': lib('pp-oeste', 'transicion', '', 500, 400, 'EC', 'JL', 5, { creadoEn: { __ts: ahora - 60000 } }),
  'liberaciones/s1': lib('pan', 'stn', '', 0, 398.5, 'EC', 'GN', 2),
  'ejes/pp-oeste': eje(500000, 8300000, 2700, 0.3), 'ejes/pan': eje(510000, 8305000, 400, 0.8),
};
const esperar = (p, fn, arg, ms = 15000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
async function entrarComo(p, u) { await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(500); }
const vista = async (p, v) => { await p.click(`.chart-h [data-vista="${v}"]`); await p.waitForTimeout(350); };
// «Qué falta»: cada capa con su nombre, su %, lo que falta y sus tramos
const lista = p => p.$$eval('#chart .qf', q => q.map(x => ({ n: x.querySelector('.qf-h b').textContent.trim(), pct: x.querySelector('.qf-pct').textContent.trim(), falta: (x.querySelector('.qf-ft') || {}).textContent || '', pills: [...x.querySelectorAll('[data-falta]')].map(b => b.childNodes[0].textContent.trim()) })));
const perfil = p => p.$$eval('#chart svg[role=img] .lab2', l => l.map(t => t.textContent.trim()));
const pcts = p => p.$$eval('#chart svg[role=img] text.pct', l => l.map(t => t.textContent.trim()));
const dim = (p, id) => p.$eval(`#chart [data-id="${id}"]`, e => e.classList.contains('dimf') || e.hasAttribute('data-dim')).catch(() => null);
const mts = v => v.toLocaleString('es-PE') + ' m';
(async () => {
  // P8: fmtPk (la misma función del archivo), con una tabla de valores
  const src = fs.readFileSync(process.env.ANTES || path.join(__dirname, '..', 'index.html'), 'utf8');
  const fmtPk = new Function(src.slice(src.indexOf('function fmtPk(v) {'), src.indexOf('\nfunction rangoPk')) + ';return fmtPk;')();
  const tabla = [[0, '0+000'], [20, '0+020'], [999, '0+999'], [1000, '1+000'], [2700, '2+700'], [12345, '12+345'], [1234.5, '1+234.50'], [150.25, '0+150.25'], [0.01, '0+000.01'], [999.994, '0+999.99'],
    [999.996, '1+000'], [1999.999, '2+000'], [2999.9951, '3+000'], [1000.004, '1+000'], [12345.678, '12+345.68'], [-12.5, '-0+012.50'], [-1000, '-1+000'], [-999.996, '-1+000'], ['150', '0+150'], [null, ''], [undefined, ''], ['', ''], [NaN, ''], ['abc', '']];
  const mal = tabla.filter(([v, e]) => fmtPk(v) !== e).map(([v, e]) => `${v} → «${fmtPk(v)}» (se esperaba «${e}»)`);
  ok(!mal.length, `P8: fmtPk da lo esperado en los ${tabla.length} valores (enteros, decimales, negativos, nulos)${mal.length ? ': ' + mal.join(' · ') : ''}`);

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  if (process.env.ANTES) await ctx.route(u => /\/(index\.html)?$/.test(u.pathname), r => r.fulfill({ path: process.env.ANTES, contentType: 'text/html; charset=utf-8' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('lista')); localStorage.setItem('lib.accAbierta', JSON.stringify('fil')); }, [DB, ADMIN]);
  await p.reload(); await p.waitForSelector('#nav button');
  await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('resumen/')), null, { timeout: 30000 });
  await p.waitForTimeout(1200);
  await entrarComo(p, GAB);
  await p.click('#nav [data-v="panel"]'); await p.waitForSelector('#chart .qf'); await p.waitForTimeout(400);

  // --- P1 + P4 en «Qué falta» (sin filtros)
  let L0 = await lista(p);
  const cap = L0.find(x => x.n === 'Capa 1'), tra = L0.find(x => /transición/.test(x.n));
  ok(L0.length === 2 && cap && !L0.some(x => /^capa 1$|^Capa 01$/.test(x.n)), 'P1 «Qué falta»: las tres escrituras son una sola capa «Capa 1» (+ transición): ' + L0.map(x => x.n).join(' | '));
  ok(cap && cap.pct === '32%' && cap.falta.includes(mts(1830)), `P1: «Capa 1» suma lo de las tres: 32 % y falta ${mts(1830)}: ${cap && cap.pct} · ${cap && cap.falta}`);
  ok(cap && cap.pills.join(' | ') === '0+600 – 1+000 | 1+270 – 2+700', 'P1: sus tramos que faltan son 0+600–1+000 y 1+270–2+700 (no se ofrece lo que liberó otra escritura): ' + (cap && cap.pills.join(' | ')));
  const anchoT = await p.$$eval('#chart .qf', q => { const x = q.find(e => /transición/.test(e.textContent)); return [...x.querySelectorAll('svg.tira rect[stroke="#fff"]')].map(r => +r.getAttribute('width')); });
  ok(anchoT.length === 1 && Math.abs(anchoT[0] - 100 / 2700 * 1000) < 0.2, `P4: el tramo invertido 0+500 → 0+400 se dibuja con sus 100 m (${(100 / 2700 * 1000).toFixed(1)} de 1000), no una raya de 6: ${anchoT}`);
  ok(tra && tra.pct === '4%' && tra.pills.join(' | ') === '0+000 – 0+400 | 0+500 – 2+700', 'P4: y su % (4 %) y lo que falta no incluyen 0+400–0+500: ' + (tra && tra.pct + ' · ' + tra.pills.join(' | ')));

  // --- P3 + P10: números de arriba
  const stats = () => p.$$eval('#pStats .stat', s => s.map(x => x.querySelector('b').textContent + ' ' + x.querySelector('span').textContent));
  const st0 = await stats();
  ok(st0[0] === '1 Liberadas hoy en campo', 'P10: «Liberadas hoy en campo» = 1 (a2; t1 se subió hoy pero su fecha de campo es de hace 5 días): ' + st0[0]);
  ok(st0.slice(1).join(' | ') === '1 Pendientes | 1 En proceso | 2 Entregadas a Calidad', 'arriba: 1 pendiente, 1 en proceso, 2 entregadas: ' + st0.join(' | '));
  ok(!/sin filtros/.test(await p.textContent('#pStatsDe')) && await p.$eval('#pFilNota', e => e.hidden).catch(() => true), 'sin filtros: no dice «sin filtros» ni la nota de filtros');

  // --- P2: filtros de estado, topógrafo y «Solo hoy» en «Qué falta»
  const filtros = [
    ['estado «Entregado a Calidad»', () => p.click('#pAcc [data-st="EC"]'), () => p.click('#pAcc [data-st=""]'), ['a1', 't1'], ['a2', 'a3']],
    ['topógrafo GN', () => p.selectOption('#pTopo', 'GN'), () => p.selectOption('#pTopo', ''), ['a1', 'a3'], ['a2', 't1']],
    ['«Solo hoy»', () => p.click('#pHoy'), () => p.click('#pHoy'), ['a2'], ['a1', 'a3', 't1']],
  ];
  for (const [nom, poner, quitar, si, no] of filtros) {
    await poner(); await p.waitForTimeout(350);
    const L1 = await lista(p);
    ok(JSON.stringify(L1) === JSON.stringify(L0), `P2 ${nom}, «Qué falta»: mismas capas, mismo %, mismos metros y tramos que sin filtro: ${L1.map(x => x.n + ' ' + x.pct).join(' | ')}`);
    ok(/sin filtros/.test(await p.textContent('#pStatsDe')) && JSON.stringify(await stats()) === JSON.stringify(st0), `P3 ${nom}: los números de arriba no cambian y lo dicen: «${await p.textContent('#pStatsDe')}»`);
    const nota = await p.$eval('#pFilNota', e => e.hidden ? '' : e.textContent).catch(() => '');
    ok(nota.startsWith('Con filtros: se resalta lo que coincide') && nota.includes(`(${si.length} de 4)`) && nota.includes('lo que falta y el % cuentan todo lo liberado'), `P2 ${nom}: se ve la nota: «${nota}»`);
    await vista(p, 'perfil');
    const per = await pcts(p), d = {}; for (const id of [...si, ...no]) d[id] = await dim(p, id);
    ok(per.join(' ') === '32% 4%' || per.join(' ') === '4% 32%', `P2 ${nom}, perfil: los % siguen 32 % y 4 %: ${per.join(' ')}`);
    ok(si.every(id => d[id] === false) && no.every(id => d[id] === true), `P2 ${nom}, perfil: se resalta ${si.join(', ')} y se atenúa ${no.join(', ')} (no desaparecen): ${JSON.stringify(d)}`);
    await vista(p, 'lista');
    await quitar(); await p.waitForTimeout(350);
  }
  ok(JSON.stringify(await lista(p)) === JSON.stringify(L0) && await p.$eval('#pFilNota', e => e.hidden).catch(() => true), 'al quitar los filtros todo vuelve igual y la nota se va');

  // P2: con un filtro, tocar lo atenuado abre su ficha; los huecos que se ofrecen para registrar son solo los que faltan
  await p.click('#pAcc [data-st="EC"]'); await p.waitForTimeout(350);
  await vista(p, 'perfil');
  await p.click('#chart [data-id="a2"]', { timeout: 5000 }).catch(() => {}); await p.waitForSelector('#sheet.on', { timeout: 5000 }).catch(() => {});
  ok(await esperar(p, () => /SKT-TOP-07300/.test(document.querySelector('#sheet .fnum')?.textContent || ''), null, 5000) && !(await p.$('.dlg.on')), 'P2: con filtro, tocar el tramo atenuado (a2) abre su ficha, no «Falta liberar»');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); if (await p.$('#sheet.on')) { await p.click('#fX').catch(() => {}); await p.waitForTimeout(300); }
  await p.screenshot({ path: OUT + '/01-perfil-con-filtro.png' });
  await vista(p, 'lista');
  const ofrecidos = [];
  for (let i = 0; i < 4; i++) {
    const pill = (await p.$$('#chart [data-falta]'))[i]; if (!pill) break;
    await pill.click(); await p.waitForSelector('.dlg.on');
    const t = await p.textContent('.dlg.on'); ofrecidos.push({ capa: /Capa 1/.test(t), t: (t.match(/Tramo\s*([\d+.\s–]+)/) || [])[1]?.trim() + (/Registrar este tramo/.test(t) ? ' (Registrar)' : '') });
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  }
  const libs = c => c ? [[0, 600], [1000, 1270]] : [[400, 500]]; // lo liberado de cada capa
  const pk = t => { const m = t.match(/(\d+)\+(\d+(?:\.\d+)?)/); return m ? +m[1] * 1000 + +m[2] : NaN; };
  const solapa = ofrecidos.filter(o => { const [x, y] = o.t.split('–').map(pk); return libs(o.capa).some(([a, c]) => Math.min(y, c) - Math.max(x, a) > 0.01); });
  ok(ofrecidos.length === 4 && ofrecidos.every(o => /Registrar/.test(o.t)) && !solapa.length, 'P2: con filtro, «Registrar este tramo» solo se ofrece en lo que falta de cada capa, nunca sobre lo liberado: ' + ofrecidos.map(o => (o.capa ? 'Capa 1 ' : 'transición ') + o.t).join(' · '));
  await p.screenshot({ path: OUT + '/02-que-falta-con-filtro.png' });

  // Exportar la capa unificada: sin filtro las 3; con filtro, la que coincide
  await vista(p, 'perfil');
  const lab = await p.$('#chart .lab2[data-banda="masivo|Capa 1"]');
  await lab.click({ button: 'right' }); await p.waitForSelector('#ctx .ctx-i');
  const it1 = (await p.$$eval('#ctx .ctx-i', x => x.map(b => b.textContent.trim())))[0];
  const [dl1] = await Promise.all([p.waitForEvent('download'), p.click('#ctx .ctx-i >> nth=0')]);
  let xl = filasXlsx(await dl1.path()), iC = xl.findIndex(r => r && r[0] === 'N°');
  ok(/^Exportar sus 1 liberación que coincide con los filtros/.test(it1) && xl.slice(iC + 1).filter(r => r && /SKT-TOP-/.test(r[1] || '')).length === 1, 'exportar la capa con filtro: la que coincide (1): ' + it1);
  await p.click('#pAcc [data-st=""]'); await p.waitForTimeout(350);
  await (await p.$('#chart .lab2[data-banda="masivo|Capa 1"]')).click({ button: 'right' }); await p.waitForSelector('#ctx .ctx-i');
  const it2 = (await p.$$eval('#ctx .ctx-i', x => x.map(b => b.textContent.trim())))[0];
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('#ctx .ctx-i >> nth=0')]);
  xl = filasXlsx(await dl2.path()); iC = xl.findIndex(r => r && r[0] === 'N°');
  const filasCapa = xl.slice(iC + 1).filter(r => r && /SKT-TOP-/.test(r[1] || ''));
  ok(/^Exportar sus 3 liberaciones \(Excel\)/.test(it2) && filasCapa.length === 3, 'P1 exportar «Capa 1» sin filtro: sus 3 liberaciones (de las tres escrituras): ' + it2 + ' → ' + filasCapa.length);
  ok(JSON.stringify(await perfil(p)).includes('Capa 1') && (await perfil(p)).length === 2, 'P1 perfil: una sola fila «Capa 1» y la de transición: ' + (await perfil(p)).join(' | '));
  // Ocultar con el ojo sigue funcionando
  await p.click('#chart .ojo[data-oculta="masivo|Capa 1"]'); await p.waitForTimeout(350);
  ok((await perfil(p)).length === 1, 'el ojo oculta la capa unificada');
  await p.click('#pActivos [data-quitar="capas"]'); await p.waitForTimeout(350);
  ok((await perfil(p)).length === 2, 'y «Capas» la vuelve a mostrar');
  // «Ver en Registros»: el filtro de capa de Registros también las une
  await (await p.$('#chart .lab2[data-banda="masivo|Capa 1"]')).click({ button: 'right' }); await p.waitForSelector('#ctx .ctx-i');
  await p.click('#ctx .ctx-i:has-text("Ver en Registros")'); await p.waitForSelector('#lista', { timeout: 20000 }); await p.waitForTimeout(1200);
  const filas = await p.$$eval('#lista tr[data-id]', t => t.map(e => e.dataset.id).sort());
  ok(filas.join(',') === 'a1,a2,a3', 'P1 Registros: el filtro de capa «Capa 1» trae las tres escrituras: ' + filas.join(','));
  const ops = await p.$$eval('input[data-fk="capa"]', x => x.map(i => i.value + ' ' + i.closest('label').querySelector('.c').textContent));
  ok(ops.includes('Capa 1 3') && !ops.some(t => /^(capa 1|Capa 01) /.test(t)), 'P1 Registros: la columna de filtros cuenta «Capa 1» una sola vez, con 3: ' + ops.join(' | '));

  // --- Planta: P1, P2 y P7
  await p.click('#nav [data-v="panel"]'); await p.waitForSelector('#chart'); await p.waitForTimeout(300);
  await vista(p, 'planta'); await p.waitForSelector('.plwrap svg'); await p.waitForTimeout(300);
  if (await p.$eval('#pTipoPl', s => s.value) !== 'masivo') { await p.selectOption('#pTipoPl', 'masivo'); await p.waitForTimeout(350); }
  const planta = async () => ({ capas: await p.$$eval('#pCapaPl option', o => o.map(x => x.textContent)), filas: await p.$$eval('#plAvance tbody tr', t => t.map(r => [...r.children].map(c => c.textContent.trim()).join(' '))), lab: await p.$$eval('.plwrap .lab-pl', l => l.map(t => t.textContent)) });
  const pl0 = await planta();
  ok(pl0.capas.join('|') === 'Todas las capas|Capa 1', 'P1 Planta: el selector de capa tiene «Capa 1» una sola vez: ' + pl0.capas.join(' | '));
  ok(pl0.filas.length === 1 && pl0.filas[0].startsWith('Capa 1 32%') && pl0.filas[0].endsWith('15%'), 'P1 Planta: la tabla tiene una fila «Capa 1» con oeste 32 % y total 15 %: ' + pl0.filas.join(' / '));
  ok(pl0.lab.some(t => t === 'Presa Principal Oeste · 32%'), 'P1 Planta: el dibujo dice «Presa Principal Oeste · 32%»: ' + pl0.lab.join(' | '));
  await p.click('#pAcc [data-st="EC"]'); await p.waitForTimeout(400);
  const pl1 = await planta();
  ok(JSON.stringify(pl1) === JSON.stringify(pl0), 'P2 Planta con filtro de estado: mismos % en el dibujo y en la tabla');
  ok(await dim(p, 'a2') === true && await dim(p, 'a1') === false && /Con filtros/.test(await p.textContent('#pFilNota', { timeout: 1000 }).catch(() => '')), 'P2 Planta: lo que no coincide se atenúa y se ve la nota');
  ok(/sin filtros/.test(await p.textContent('#pStatsDe')), 'P3 Planta: los números de arriba dicen «sin filtros»: ' + await p.textContent('#pStatsDe'));
  await p.screenshot({ path: OUT + '/03-planta-con-filtro.png', fullPage: true });
  await p.click('#pAcc [data-st=""]'); await p.waitForTimeout(300);
  await p.selectOption('#pSub', 'pan'); await p.waitForTimeout(800);
  if (await p.$eval('#pTipoPl', s => s.value) !== 'stn') { await p.selectOption('#pTipoPl', 'stn'); await p.waitForTimeout(400); }
  const pl2 = await planta();
  ok(pl2.filas.length === 1 && pl2.filas[0].endsWith('99% 99%'), 'P7 Planta: 398,5 de 400 m (queda 1,5 m): la celda y el total dicen 99 %, no 100 %: ' + pl2.filas.join(' / '));

  ok(errores.length === 0, 'sin errores de página');
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
