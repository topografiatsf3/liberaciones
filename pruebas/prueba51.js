// Versión 1.44.0 · Animaciones con las animaciones ENCENDIDAS (localStorage «lib.anim» = "1"; las demás pruebas corren sin ellas).
// (a) La escritura sale antes de que termine la animación y la fila no reaparece aunque llegue un redibujo a mitad
// (b) Un fallo de escritura (__fakeNegar) devuelve la fila a su sitio · si el código no se genera, el diálogo queda abierto
// (c) Orden de «Aceptar y generar código»: «Generando código…» → visto con el código → se cierra → la fila muestra el código → sale
// (d) Varias a la vez: se anima el grupo (la lista), no fila por fila · (e) el resaltado de lo recién guardado sale una sola vez
// (f) Escribir en el buscador no vuelve a animar la lista · (g) con «reducir movimiento» no hay animaciones
// (h) Tras 1 s no queda nada a medio animar (opacidad o transformación pegadas)
// Además: con «node pruebas/prueba51.js --tanda [N] [pruebas…]» corre la tanda entera con las animaciones encendidas a la fuerza.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');

// ---- Tanda con animaciones a la fuerza: un --import en NODE_OPTIONS hace que cada contexto de Playwright de cada prueba
// empiece con localStorage «lib.anim» = "1" (sin tocar las pruebas). Las que fallan así se listan al final como siempre.
if (process.argv[2] === '--tanda') {
  const { spawn } = require('child_process');
  const pre = `import { createRequire } from 'module'; const require = createRequire(${JSON.stringify(path.join(__dirname, '..', 'x.js'))});
const pw = require('playwright'), ini = () => { try { localStorage.setItem('lib.anim', '1'); } catch (e) {} };
for (const bt of [pw.chromium, pw.webkit, pw.firefox]) { const l = bt.launch.bind(bt); bt.launch = async (...a) => { const b = await l(...a), nc = b.newContext.bind(b);
  b.newContext = async (...o) => { const c = await nc(...o); await c.addInitScript(ini); return c; };
  b.newPage = async (...o) => { const c = await b.newContext(...o), p = await c.newPage(); p.close = async (...x) => { await c.close(); }; return p; }; return b; }; }`;
  const env = { ...process.env, NODE_OPTIONS: ((process.env.NODE_OPTIONS || '') + ' --import=data:text/javascript,' + encodeURIComponent(pre)).trim() };
  const p = spawn(process.execPath, [path.join(__dirname, 'correr-paralelo.js'), ...process.argv.slice(3)], { stdio: 'inherit', env, cwd: path.join(__dirname, '..') });
  p.on('close', c => process.exit(c));
  return;
}

const OUT = path.join(__dirname, 'capturas', 'prueba51'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const ahora = Date.now(), hora = 36e5, min = 6e4;
const base = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', equipo: 'ET', estado: 'PT', fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, editadoEn: { __ts: ahora - hora }, archivos: [], ...extra });
const DB = { 'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true } };
for (let i = 0; i < 12; i++) DB['liberaciones/pt' + String(i).padStart(2, '0')] = base({ descripcion: 'Pendiente ' + i + ' relleno filtro uno', pkInicio: i * 60, pkFin: i * 60 + 40, fechaCampo: { __ts: ahora - (i + 1) * min }, creadoEn: { __ts: ahora - (i + 1) * min } });
for (let i = 1; i <= 2; i++) DB['liberaciones/ep' + i] = base({ estado: 'EP', numero: 'SKT-TOP-0270' + i, descripcion: 'En proceso ' + i, pkInicio: 2400 + i * 50, pkFin: 2420 + i * 50, fechaLiberacion: { __ts: ahora - hora } });
for (let i = 1; i <= 4; i++) DB['liberaciones/lev' + i] = base({ actividad: 'LEV', estado: 'NA', tipoId: '', descripcion: 'Levantamiento ' + i, pkInicio: null, pkFin: null, fechaCampo: { __ts: ahora - i * min } });

const rutas = async c => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
};
async function abrir(b, v, u, extra = {}) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, hasTouch: !!v.tactil, isMobile: !!v.tactil, ...extra });
  await ctx.addInitScript(() => { try { localStorage.setItem('lib.anim', '1'); } catch (e) {} });
  await rutas(ctx); const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(v.n + ': ' + e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource|permissions/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { const k = localStorage.getItem('lib.anim'); localStorage.clear(); localStorage.setItem('lib.anim', k); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [DB, u]);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(600);
  return { ctx, p };
}
const ir = async (p, v) => { await p.click(`#nav [data-v="${v}"]`); await p.waitForTimeout(450); };
const pestana = async (p, t) => { await p.click(`#view [data-bt="${t}"]`); await p.waitForTimeout(350); };
// Escribe en Firebase como si fuera otra persona (mismo módulo simulado que usa la app): llega un redibujo por datos
const escribirOtro = (p, id, datos) => p.evaluate(async ([id, datos]) => { const f = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js'); await f.setDoc(f.doc(null, 'liberaciones', id), datos, { merge: true }); }, [id, datos]);
// Registro en la página: qué pasa y cuándo (se mira en cada cambio del DOM y en cada cuadro)
// Movimiento de verdad: animación con nombre o transición de transform/opacity, de más de 1 ms (no el color de :hover)
const MOVIM = "a => a.playState === 'running' && a.effect?.getComputedTiming().duration > 1 && a.effect?.getComputedTiming().iterations !== Infinity && (a.animationName || !a.transitionProperty || /^(transform|opacity|translate|scale)$/.test(a.transitionProperty))";
const grabar = (p, id, extra = '') => p.evaluate(([id, extra]) => {
  const L = window.__L = [], t0 = performance.now(), visto = new Set();
  const marca = (k, d) => { if (!visto.has(k)) { visto.add(k); L.push({ k, t: Math.round(performance.now() - t0), d }); } };
  const mirar = () => {
    const filas = [...document.querySelectorAll(`#blist [data-rid="${id}"]`)], fila = filas[0];
    const vis = filas.filter(f => !f.closest('.mov-fuera') && f.getBoundingClientRect().height > 0);
    if (filas.length > 1) marca('duplicada');
    const st = window.__fakeStore()['liberaciones/' + id] || {};
    if (id.startsWith('lev') ? st.visto : st.estado && st.estado !== 'PT') marca('escrito', st.estado);
    const btn = document.querySelector('.dlg.on [type=submit]');
    if (btn && /Generando/.test(btn.textContent)) marca('generando', btn.textContent.trim());
    if (btn && btn.classList.contains('hecho')) marca('hecho', btn.textContent.trim());
    if (visto.has('generando') && !document.querySelector('.dlg.on')) marca('cerrado');
    if (fila && fila.querySelector('.mov-cod')) marca('codigo', fila.querySelector('.mov-cod').textContent);
    if (fila && fila.getAnimations().some(a => a.playState === 'running')) marca('sale');
    if (!vis.length) marca('fuera'); else if (visto.has('fuera')) marca('reaparece');
  };
  window.__mo = new MutationObserver(mirar); window.__mo.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  const cuadro = () => { mirar(); if (performance.now() - t0 < 4000) requestAnimationFrame(cuadro); }; cuadro();
}, [id, extra]);
const leer = async p => { const L = await p.evaluate(() => { window.__mo?.disconnect(); return window.__L; }); return Object.fromEntries(L.map(x => [x.k, x])); };
// Nada a medio animar: filas, vista, menú y ficha con opacidad 1 y sin transformación; sin animaciones vivas salvo las que giran
const pegadas = p => p.evaluate(() => {
  const malas = [];
  document.querySelectorAll('#view, #view [data-rid], #view [data-id], #view .list, #view table, #nav button, .nav, .cnt, .badge, #sheet.on').forEach(el => {
    if (el.closest('.mov-fuera') || !el.getBoundingClientRect().height) return;
    const cs = getComputedStyle(el); if (+cs.opacity < 0.999 || (cs.transform !== 'none' && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(cs.transform))) malas.push((el.id || el.className || el.tagName) + ` (opacidad ${cs.opacity}, ${cs.transform})`);
  });
  const vivas = document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity && !a.effect?.target?.closest?.('#toast'));
  return { malas: malas.slice(0, 6), vivas: vivas.length, cuales: vivas.map(a => (a.animationName || a.transitionProperty || 'waapi') + '@' + (a.effect?.target?.id || a.effect?.target?.className || '?')).join(', '), quedan: document.querySelectorAll('.mov-sale, .mov-ind, .nav.mov-nav').length };
});

let b;
(async () => {
  b = await chromium.launch();
  // ===== Computadora (tabla): Aceptar y generar código, fallo de código, grupo =====
  {
    const v = { n: '1366', w: 1366, h: 800 };
    console.log(`--- ${v.n}`);
    const { ctx, p } = await abrir(b, v, ADMIN);
    ok(await p.evaluate(() => document.documentElement.classList.contains('anim')), 'con «lib.anim» = "1" las animaciones se encienden aunque sea una prueba automática');
    await ir(p, 'bandeja'); await pestana(p, 'PT'); await p.waitForSelector('#blist tr[data-rid="pt01"]');
    // (c) + (a): la transacción queda «en el aire» (sin confirmar) para ver cada paso; mientras, llega el redibujo por datos
    const cEp0 = (await p.textContent('#view [data-bt="EP"] .cnt')).trim();
    await p.click('#blist tr[data-rid="pt01"] [data-a="aceptar"]'); await p.waitForSelector('.dlg.on'); await p.waitForTimeout(250);
    await grabar(p, 'pt01');
    await p.evaluate(() => { window.__fakeOffline = true; document.querySelector('.dlg.on [type=submit]').click(); });
    await p.waitForTimeout(500);
    const medio = await p.evaluate(() => ({ btn: document.querySelector('.dlg.on [type=submit]')?.textContent.trim(), fila: !!document.querySelector('#blist tr[data-rid="pt01"]:not(.mov-fuera)'), est: window.__fakeStore()['liberaciones/pt01'].estado }));
    ok(medio.btn === 'Generando código…', `mientras se genera, el botón dice «${medio.btn}»`);
    ok(medio.est === 'EP' && medio.fila, `la escritura ya salió (estado ${medio.est} en Firebase) y el redibujo que trajo no quitó la fila tapada por el diálogo`);
    await p.evaluate(() => window.__fakeGoOnline());
    await p.waitForTimeout(2200);
    const L = await leer(p);
    console.log('      orden:', Object.values(L).map(x => `${x.k}@${x.t}`).join(' · '));
    const orden = ['generando', 'escrito', 'hecho', 'cerrado', 'codigo', 'sale', 'fuera'];
    ok(orden.every(k => L[k]) && orden.every((k, i) => !i || k === 'escrito' || L[k].t >= L[orden[i - 1] === 'escrito' ? 'generando' : orden[i - 1]].t), `orden del diálogo: Generando código… → visto «${L.hecho?.d || '?'}» → se cierra → la fila muestra ${L.codigo?.d || '?'} → sale`);
    ok(/SKT-TOP-\d+ generado/.test(L.hecho?.d || ''), `el botón muestra el código generado («${L.hecho?.d}»)`);
    ok(L.escrito && L.fuera && L.escrito.t < L.fuera.t - 300, `la escritura sale antes de que termine la animación (escrita a ${L.escrito?.t} ms, la fila termina de irse a ${L.fuera?.t} ms)`);
    ok(!L.reaparece && !L.duplicada, 'la fila no reaparece ni se duplica después de irse');
    ok(L.fuera && L.fuera.t - L.cerrado.t <= 1000, `desde que se cierra el diálogo hasta que la fila se fue: ${L.fuera && L.fuera.t - L.cerrado.t} ms (código un instante + 0,2 s de lado + 0,2 s para subir)`);
    const cEp1 = (await p.textContent('#view [data-bt="EP"] .cnt')).trim();
    ok(+cEp1 === +cEp0 + 1, `«En proceso» pasa de ${cEp0} a ${cEp1}`);
    await p.screenshot({ path: path.join(OUT, '1-aceptada.png') });
    // (e) lo aceptado se resalta una vez en «En proceso»
    await pestana(p, 'EP');
    const r1 = await p.evaluate(() => { const f = document.querySelector('#blist tr[data-rid="pt01"]'); return f && { c: f.classList.contains('mov-nuevo'), a: f.getAnimations().map(a => a.animationName).join(',') }; });
    ok(r1 && r1.c && /movNuevo/.test(r1.a), `en «En proceso» la recién aceptada aparece resaltada (${JSON.stringify(r1)})`);
    await p.waitForTimeout(1800); await pestana(p, 'PT'); await pestana(p, 'EP');
    ok(await p.evaluate(() => !document.querySelector('#blist tr[data-rid="pt01"]').classList.contains('mov-nuevo')), 'al volver a la pestaña ya no se resalta (sale una sola vez)');
    await pestana(p, 'PT');
    // (b) el código no se puede generar: el diálogo queda abierto como hoy y la fila no se mueve
    await p.click('#blist tr[data-rid="pt02"] [data-a="aceptar"]'); await p.waitForSelector('.dlg.on'); await p.waitForTimeout(250);
    await p.evaluate(() => { window.__fakeNegar = true; document.querySelector('.dlg.on [type=submit]').click(); }); await p.waitForTimeout(700);
    const f2 = await p.evaluate(() => ({ dlg: !!document.querySelector('.dlg.on'), btn: document.querySelector('.dlg.on [type=submit]')?.textContent.trim(), fila: (() => { const f = document.querySelector('#blist tr[data-rid="pt02"]'); return f && !f.closest('.mov-fuera') && getComputedStyle(f).opacity === '1'; })(), toast: document.querySelector('#toast').textContent }));
    ok(f2.dlg && /Generar código/.test(f2.btn) && f2.fila && /No se pudo generar/.test(f2.toast), `sin código: el diálogo queda abierto («${f2.btn}»), la fila en su sitio y el aviso de siempre («${f2.toast.trim()}»)`);
    await p.evaluate(() => { window.__fakeNegar = false; }); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    // (d) varias a la vez: se anima la lista entera, no fila por fila
    for (const id of ['pt03', 'pt04', 'pt05']) { await p.click(`#blist tr[data-rid="${id}"] td.ck`); await p.waitForTimeout(80); }
    await p.click('#bBulk [data-bk="aceptar"]'); await p.waitForSelector('.dlg.on'); await p.waitForTimeout(250);
    await p.evaluate(() => { window.__G = { filas: 0, lista: 0, hecho: '' }; const mo = new MutationObserver(() => { const b = document.querySelector('.dlg.on [type=submit].hecho'); if (b) window.__G.hecho = b.textContent.trim(); });
      mo.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
      const t0 = performance.now(), mirar = () => { document.getAnimations().forEach(a => { const t = a.effect?.target; if (!t || a.playState !== 'running') return; if (t.id === 'blist') window.__G.lista++; else if (t.matches?.('#blist [data-rid]')) window.__G.filas++; }); if (performance.now() - t0 < 2500) requestAnimationFrame(mirar); else mo.disconnect(); }; mirar();
      document.querySelector('.dlg.on [type=submit]').click(); });
    await p.waitForTimeout(2600);
    const G = await p.evaluate(() => ({ ...window.__G, quedan: ['pt03', 'pt04', 'pt05'].filter(id => document.querySelector(`#blist [data-rid="${id}"]:not(.mov-fuera)`)).length }));
    ok(G.hecho === '3 códigos generados', `en grupo el botón confirma «${G.hecho}»`);
    ok(G.quedan === 0 && G.lista > 0 && G.filas === 0, `en grupo se anima la lista (${G.lista} cuadros) y ninguna fila por separado (${G.filas}); quedan ${G.quedan}`);
    await p.waitForTimeout(1000);
    const pg = await pegadas(p);
    ok(!pg.malas.length && !pg.vivas && !pg.quedan, `1366: tras 1 s no queda nada a medio animar (${pg.malas.join('; ') || 'ninguna'} · ${pg.vivas} animaciones vivas ${pg.cuales} · ${pg.quedan} marcas)`);
    // Ficha: pasar a la siguiente con las flechas es un fundido, no dos deslizamientos
    await p.click('#blist tr[data-rid="pt06"] td.tdesc'); await p.waitForTimeout(400);
    const fun = await p.evaluate(async () => { const sh = document.querySelector('#sheet'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await new Promise(r => setTimeout(r, 30)); return sh.getAnimations().map(a => a.effect.getKeyframes().map(k => k.opacity ?? k.transform).join('→')); });
    ok(fun.length === 1 && /^0\.35→1$/.test(fun[0]), `con la flecha la ficha pasa al siguiente con un fundido (${fun.join(' | ') || 'sin animación'})`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    await ctx.close();
  }
  // ===== Celular (tarjetas): Enterado con redibujo a mitad, fallo que devuelve la fila, buscador =====
  {
    const v = { n: '390', w: 390, h: 844, tactil: true };
    console.log(`--- ${v.n}`);
    const { ctx, p } = await abrir(b, v, ADMIN);
    await ir(p, 'bandeja'); await pestana(p, 'LEV'); await p.waitForSelector('#blist .brow[data-rid="lev1"]');
    // (a) Enterado: la fila sale a la derecha; a mitad llega un registro nuevo de otra persona (redibujo) y la salida sigue
    const cPt0 = (await p.textContent('#view [data-bt="PT"] .cnt')).trim();
    await grabar(p, 'lev1');
    await p.click('#blist .brow[data-rid="lev1"] [data-a="enterado"]');
    await p.waitForTimeout(90);
    const mitad = await p.evaluate(() => { const f = document.querySelector('#blist [data-rid="lev1"]'); return f && f.getAnimations().map(a => a.effect.getKeyframes().map(k => k.transform || k.height).join('→')).join(' | '); });
    await escribirOtro(p, 'nuevoOtro', base({ descripcion: 'De otra persona', pkInicio: 5000, pkFin: 5040 }));
    await p.waitForTimeout(60);
    const sigue = await p.evaluate(() => { const f = document.querySelectorAll('#blist [data-rid="lev1"]'); return { n: f.length, anima: f[0] && f[0].getAnimations().some(a => a.playState === 'running') }; });
    ok(/translateX\(56px\)/.test(mitad || ''), `«Enterado»: la tarjeta sale a la derecha (${mitad})`);
    ok(sigue.n === 1 && sigue.anima, `llega un redibujo a mitad y la salida sigue sin cortarse (${sigue.n} tarjeta, animando: ${sigue.anima})`);
    await p.waitForTimeout(1200);
    const L = await leer(p);
    console.log('      orden:', Object.values(L).map(x => `${x.k}@${x.t}`).join(' · '));
    ok(L.escrito && L.fuera && L.escrito.t < 60 && L.fuera.t >= 350, `la escritura sale al momento (${L.escrito?.t} ms) y la tarjeta termina de irse después (${L.fuera?.t} ms)`);
    ok(!L.reaparece && !L.duplicada, 'la tarjeta no reaparece ni rebota tras el redibujo');
    const cPt1 = (await p.textContent('#view [data-bt="PT"] .cnt')).trim();
    ok(+cPt1 === +cPt0 + 1, `el redibujo aplazado se hizo al terminar («Por aceptar» ${cPt0} → ${cPt1})`);
    // (b) fallo de escritura: la tarjeta vuelve a su sitio con el aviso de error de siempre
    await p.evaluate(() => { window.__fakeNegar = true; });
    const y0 = await p.$eval('#blist [data-rid="lev2"]', e => e.getBoundingClientRect().top);
    await p.click('#blist .brow[data-rid="lev2"] [data-a="enterado"]'); await p.waitForTimeout(900);
    const vuelta = await p.evaluate(() => { const f = document.querySelector('#blist [data-rid="lev2"]'); const cs = f && getComputedStyle(f); return f && { fuera: !!f.closest('.mov-fuera'), op: cs.opacity, tr: cs.transform, y: f.getBoundingClientRect().top, toast: document.querySelector('#toast').textContent }; });
    ok(vuelta && !vuelta.fuera && vuelta.op === '1' && vuelta.tr === 'none' && Math.abs(vuelta.y - y0) < 2 && /No se pudo guardar/.test(vuelta.toast), `si Firebase la rechaza, la tarjeta vuelve a su sitio (${JSON.stringify(vuelta)})`);
    await p.evaluate(() => { window.__fakeNegar = false; }); await p.waitForTimeout(400);
    // (f) escribir en el buscador no vuelve a animar la lista
    await pestana(p, 'PT'); await p.waitForTimeout(500);
    await p.evaluate(f => { const MV = eval(f); window.__A = 0; const t0 = performance.now(), mirar = () => { window.__A += document.getAnimations().filter(a => MV(a) && a.effect?.target?.closest?.('#blist')).length; if (performance.now() - t0 < 1500) requestAnimationFrame(mirar); }; mirar(); }, MOVIM);
    await p.click('#bq'); for (const c of 'Pend') { await p.keyboard.type(c); await p.waitForTimeout(220); }
    await p.waitForTimeout(500);
    ok(await p.evaluate(() => window.__A) === 0, `escribir en el buscador de la Bandeja no anima las tarjetas (${await p.evaluate(() => window.__A)} cuadros con animación)`);
    await p.fill('#bq', ''); await p.waitForTimeout(400);
    // Cambio de pantalla: fundido del contenido y la marca del menú se desliza
    const pant = await p.evaluate(async () => { document.querySelector('#nav [data-v="todos"]').click(); await new Promise(r => requestAnimationFrame(r)); return { vista: document.querySelector('#view').getAnimations().length, marca: !!document.querySelector('.nav .mov-ind') }; });
    ok(pant.vista === 1 && pant.marca, `al cambiar de pantalla el contenido entra con un fundido (${pant.vista}) y la marca del menú se desliza (${pant.marca})`);
    await p.waitForTimeout(1000);
    const pg = await pegadas(p);
    ok(!pg.malas.length && !pg.vivas && !pg.quedan, `390: tras 1 s no queda nada a medio animar (${pg.malas.join('; ') || 'ninguna'} · ${pg.vivas} vivas ${pg.cuales} · ${pg.quedan} marcas)`);
    await p.screenshot({ path: path.join(OUT, '2-celular.png') });
    await ctx.close();
  }
  // ===== Celular, operario: lo recién guardado se resalta una vez en «Mis registros»; el buscador no lo repite =====
  {
    const v = { n: '390-oper', w: 390, h: 844, tactil: true };
    console.log(`--- ${v.n}`);
    // El administrador entra primero (deja las listas de la obra en la base simulada) y luego entra el operario
    const { ctx, p } = await abrir(b, v, ADMIN);
    await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('listas/')), null, { timeout: 15000 }).catch(() => {});
    await p.click('#btnSalir'); await p.waitForSelector('#gEntrar');
    await p.evaluate(u => { window.__fakeLogin = u; }, OPER); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(500);
    await ir(p, 'mis'); await p.waitForSelector('#lista .item[data-id="pt07"]');
    await p.click('#lista .item[data-id="pt07"]'); await p.waitForSelector('#sheet.on #fEditar'); await p.waitForTimeout(300);
    await p.click('#fEditar'); await p.waitForSelector('#iObs'); await p.fill('#iObs', 'Corregido en la prueba de animaciones');
    const t0 = Date.now();
    await p.click('#bGuardar');
    await p.waitForSelector('#lista .item[data-id="pt07"]', { timeout: 6000 });
    const r1 = await p.evaluate(() => { const f = document.querySelector('#lista .item[data-id="pt07"]'); return { c: f.classList.contains('mov-nuevo'), a: f.getAnimations().map(a => a.animationName).join(',') }; });
    ok(r1.c && /movNuevo/.test(r1.a), `al guardar la edición, en «Mis registros» el registro aparece resaltado (${JSON.stringify(r1)}, ${Date.now() - t0} ms)`);
    // Un redibujo a mitad (dato de otra persona) no lo vuelve a empezar: sigue donde iba
    await p.waitForTimeout(300); await escribirOtro(p, 'pt08', { observaciones: 'cambio de otro' }); await p.waitForTimeout(50);
    const r2 = await p.evaluate(() => { const f = document.querySelector('#lista .item[data-id="pt07"]'); const a = f.getAnimations().find(x => x.animationName === 'movNuevo'); return { delay: parseFloat(f.style.animationDelay), t: a ? Math.round(a.currentTime - parseFloat(f.style.animationDelay)) : null }; });
    ok(r2.delay <= -250 && r2.t >= 250, `un redibujo a mitad no reinicia el resaltado (sigue en ${r2.t} ms)`);
    await p.waitForTimeout(1600); await escribirOtro(p, 'pt08', { observaciones: 'otro cambio' }); await p.waitForTimeout(100);
    ok(await p.evaluate(() => { const f = document.querySelector('#lista .item[data-id="pt07"]'); return !f.classList.contains('mov-nuevo') && !f.getAnimations().length; }), 'después de apagarse, otro redibujo no lo vuelve a resaltar');
    ok(await p.evaluate(() => !document.querySelector('#lista .mov-nuevo')), 'lo que cambió otra persona no se resalta');
    // (f) el buscador de Mis registros no anima nada
    await p.evaluate(f => { const MV = eval(f); window.__A = 0; const t0 = performance.now(), mirar = () => { const v = document.getAnimations().filter(a => MV(a) && a.effect?.target?.closest?.('#lista')); window.__A += v.length; v.forEach(a => (window.__AN ||= new Set()).add((a.animationName || a.transitionProperty) + '@' + a.effect.target.className + ':' + a.effect.getComputedTiming().duration)); if (performance.now() - t0 < 1500) requestAnimationFrame(mirar); }; mirar(); }, MOVIM);
    await p.click('#q'); for (const c of 'Pend') { await p.keyboard.type(c); await p.waitForTimeout(220); }
    await p.waitForTimeout(500);
    ok(await p.evaluate(() => window.__A) === 0, `escribir en el buscador de «Mis registros» no anima la lista (${await p.evaluate(() => window.__A + ' ' + [...(window.__AN || [])].join(', '))})`);
    // Guardar en «Nueva»: el botón confirma con el visto (sin esperar a nada)
    await ir(p, 'nueva');
    const g = await p.evaluate(() => { const b = document.querySelector('#bGuardar'); return !!b; });
    ok(g, 'el formulario de campo abre (el guardado nuevo se prueba en prueba7 y prueba14 con las animaciones a la fuerza)');
    await ctx.close();
  }
  // ===== (g) Con «reducir movimiento» no hay animaciones (aunque lib.anim = "1") =====
  {
    const v = { n: '390-reduce', w: 390, h: 844, tactil: true };
    console.log(`--- ${v.n}`);
    const { ctx, p } = await abrir(b, v, ADMIN, { reducedMotion: 'reduce' });
    ok(await p.evaluate(() => !document.documentElement.classList.contains('anim')), 'con «reducir movimiento» la app no enciende las animaciones');
    await ir(p, 'bandeja'); await pestana(p, 'LEV'); await p.waitForSelector('#blist [data-rid="lev3"]');
    await p.evaluate(f => { const MV = eval(f); window.__A = 0; const t0 = performance.now(), mirar = () => { const v = document.getAnimations().filter(a => MV(a)); window.__A += v.length; v.forEach(a => (window.__AN ||= new Set()).add((a.animationName || a.transitionProperty) + '@' + (a.effect.target.id || a.effect.target.className) + ':' + a.effect.getComputedTiming().duration)); if (performance.now() - t0 < 1500) requestAnimationFrame(mirar); }; mirar(); }, MOVIM);
    await p.click('#blist .brow[data-rid="lev3"] [data-a="enterado"]'); await p.waitForTimeout(80);
    ok(!(await p.$('#blist [data-rid="lev3"]:not(.mov-fuera)')), 'la tarjeta se va al instante, como antes');
    await pestana(p, 'PT'); await p.click('#blist [data-rid="pt09"] [data-a="aceptar"]'); await p.waitForSelector('.dlg.on'); await p.waitForTimeout(100);
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    ok(!(await p.$('.dlg.on')) && !(await p.$('#blist [data-rid="pt09"]')), 'el diálogo de aceptar se cierra al momento y la fila ya no está (sin visto ni esperas)');
    await p.click('#nav [data-v="todos"]'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => window.__A) === 0, `ninguna animación en toda la secuencia (${await p.evaluate(() => window.__A + ' ' + [...(window.__AN || [])].join(', '))})`);
    await ctx.close();
  }
  ok(!errores.length, `sin errores en la página (${errores.length})${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  await b.close();
})().catch(async e => { console.log('FALLA:', e.stack || e.message); process.exitCode = 1; try { await b?.close(); } catch (_) {} });
