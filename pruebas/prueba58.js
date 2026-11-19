// Revisión de los lotes D y E (escuchas de lo «por hacer»): lo que bloqueaba la publicación queda fijado
// (1) Un cambio masivo de otro (2.000 registros en lotes de 120, como renombrar una capa) y luego 5 ediciones sueltas: la escucha
//     de «editados desde la marca» baja cerca de esos 2.000 y después 1 documento por edición (antes: 19.120 y 10.005, porque la
//     escucha se rehacía en cadena con cada cambio)
// (2) Un «Enterado» que otra persona puso no se pisa aunque la primera entrega de la escucha venga de la caché con la copia
//     vieja (sin el campo): la app no escribe false con datos de la caché, y lo que de verdad no tiene el campo sí queda en false.
//     Se prueba la primera vez en el equipo (sin marca) y las siguientes (con marca)
// Uso: PUERTO=8791 node pruebas/prueba58.js
//      HTML_ANTES=<index.html anterior> node pruebas/prueba58.js   → además, los mismos casos con la versión anterior (solo se muestran)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const leerHTML = f => { const H = fs.readFileSync(f, 'utf8');
  const i = H.indexOf('<script type="module">'), j = H.indexOf('</script>', i);
  return H.slice(0, j) + '\nwindow.__T = { S, get SEGV() { try { return SEGV; } catch (e) { return null; } } };\n' + H.slice(j); };
const NUEVO = leerHTML(path.join(__dirname, '..', 'index.html'));
// Firestore simulado con «caché vieja»: si window.__fakeCacheVieja tiene copias ({ ruta: datos }), cada escucha nueva sobre
// liberaciones entrega primero el resultado calculado con esas copias (fromCache: true), como Firestore con la caché del teléfono.
// (No se toca pruebas/fake: se sirve una copia con esta envoltura)
const FAKE = (() => {
  const src = fs.readFileSync(path.join(__dirname, 'fake', 'firebase-firestore.js'), 'utf8').replace('export function onSnapshot(', 'function onSnapshot0(');
  return src + [
    'export function onSnapshot(ref, a, b, c) {',
    '  const V = window.__fakeCacheVieja, next = typeof a === "object" && a && typeof b === "function" ? b : a;',
    '  if (V && ref.type !== "doc" && ref.path === "liberaciones") {',
    '    const real = store, falso = { ...real }; for (const k in V) falso[k] = V[k];',
    '    store = falso; let s; try { s = runQuery(ref); } finally { store = real; }',
    '    const docs = s.docs.map(d => { const raw = falso["liberaciones/" + d.id]; return { id: d.id, exists: () => !!raw, data: () => dec(raw), metadata: { hasPendingWrites: false, fromCache: true } }; });',
    '    setTimeout(() => next({ docs, size: docs.length, metadata: { fromCache: true, hasPendingWrites: false } }), 0);',
    '  }',
    '  return onSnapshot0(ref, a, b, c);',
    '}'].join('\n');
})();
function parteRes(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; return Math.abs(h) % 4; }
let LISTAS = {};
// Base de N registros: 15 % levantamientos (90 % «Enterado»), 2 % aspas, el resto entregadas (como prueba56)
function base(N) {
  const ahora = Date.parse('2026-11-18T12:00:00Z'), dia = 864e5, DB = { ...LISTAS }, res = {};
  DB['usuarios/gabinete@gmail.com'] = { nombre: 'Gabinete Prueba', rol: 'gabinete', activo: true };
  DB['usuarios/operario@gmail.com'] = { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true };
  DB['config/general'] = { resumenV: 2, prefijo: 'SKT-TOP-', digitos: 5 };
  DB['contadores/skt'] = { ultimo: N + 10 };
  let x = 7; const azar = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  const subs = ['pp-oeste', 'pp-este', 'pp-sur'];
  for (let i = 0; i < N; i++) {
    const id = 'r' + String(i).padStart(6, '0'), t = ahora - (N - i) * (300 * dia / N), u = azar(), sub = subs[i % 3];
    const r = { actividad: 'LIB', estado: 'EC', numero: 'SKT-TOP-' + String(i + 1).padStart(5, '0'), creadoPor: 'operario@gmail.com', creadoNombre: 'Pedro Operario', origen: 'app', estructuraId: 'pp', subestructuraId: sub, elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa ' + (1 + (i % 9)), topografoId: 'GN', equipo: 'ET', pkInicio: (i * 7) % 2600, pkFin: (i * 7) % 2600 + 20, fechaCampo: { __ts: t }, creadoEn: { __ts: t }, editadoEn: { __ts: t }, archivos: [], descripcion: 'Registro ' + i };
    if (u < 0.15) { Object.assign(r, { actividad: 'LEV', estado: 'NA', numero: '', tipoId: '', elementoId: '', pkInicio: null, pkFin: null, descripcion: 'Levantamiento ' + i });
      if (azar() < 0.9) Object.assign(r, { visto: true, vistoPor: 'gabinete@gmail.com', vistoNombre: 'Gabinete Prueba', vistoEn: { __ts: t + 3600e3 } }); }
    else if (u < 0.17) Object.assign(r, { actividad: 'ASP', estado: 'NA', numero: '', tipoId: '', elementoId: '', pkInicio: null, pkFin: null, descripcion: 'Aspas ' + i });
    DB['liberaciones/' + id] = r;
    const k = parteRes(id), rid = k ? sub + '~' + k : sub;
    (res[rid] ||= {})[id] = [r.tipoId, r.capa, r.pkInicio, r.pkFin, r.estado, t, r.numero, r.actividad, 'GN', r.visto ? 1 : 0];
  }
  for (const s of subs) for (let k = 0; k < 4; k++) DB['resumen/' + (k ? s + '~' + k : s)] = { r: res[k ? s + '~' + k : s] || {} };
  return DB;
}
const rutas = async (c, H) => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1];
    if (f === 'firebase-firestore.js') r.fulfill({ body: FAKE, contentType: 'application/javascript' }); else r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
  await c.route(u => u.pathname === '/' || u.pathname === '/index.html', r => r.fulfill({ body: H, contentType: 'text/html; charset=utf-8' }));
};
async function abrir(b, H, u, DB, lsExtra = {}, vieja = null, vista = 'bandeja') {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block' });
  await rutas(ctx, H);
  await ctx.addInitScript(([db, u, ex, vista, vieja]) => {
    window.__fakeDBInicial = db; if (vieja) window.__fakeCacheVieja = vieja;
    if (!sessionStorage.getItem('__ini')) { sessionStorage.setItem('__ini', '1'); sessionStorage.setItem('__fakeDBGrande', '1'); localStorage.clear();
      localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.vista', JSON.stringify(vista)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste'));
      for (const k in ex) localStorage.setItem(k, ex[k]); }
  }, [DB, u, lsExtra, vista, vieja]);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource|permissions/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL); await p.waitForSelector('#nav button', { timeout: 60000 }); await p.waitForTimeout(1500);
  return { ctx, p };
}
const lsDe = p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^lib\.seg/.test(k)) o[k] = localStorage.getItem(k); } return o; });
const escribirOtro = (p, id, datos) => p.evaluate(async ([id, datos]) => { const f = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js'); await f.setDoc(f.doc(null, ...id.split('/')), datos, { merge: true }); }, [id, datos]);
const porRuta = p => p.evaluate(() => (window.__fakeDocsPorRuta || {}).liberaciones || 0);
const masivo = (p, ids, lote) => p.evaluate(async ([ids, lote]) => {
  const f = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
  for (let i = 0; i < ids.length; i += lote) { const b = f.writeBatch(null); ids.slice(i, i + lote).forEach(id => b.update(f.doc(null, 'liberaciones', id), { capa: 'Capa X', editadoEn: { __ts: Date.now() }, editadoPor: 'jefe@gmail.com' })); await b.commit(); await new Promise(r => setTimeout(r, 30)); }
}, [ids, lote]);
async function semilla(b) { const { ctx, p } = await abrir(b, NUEVO, ADMIN, {}); await p.waitForTimeout(500); const st = await p.evaluate(() => window.__fakeStore()); await ctx.close(); LISTAS = Object.fromEntries(Object.entries(st).filter(([k]) => k.startsWith('listas/'))); }

// (1) Cambio masivo y ediciones sueltas: documentos que bajan las escuchas de liberaciones en un equipo de gabinete (2.ª sesión)
async function caso1(b, H) {
  const DB = base(3000);
  let { ctx, p } = await abrir(b, H, GAB, DB); await p.waitForTimeout(2500);
  const ls1 = await lsDe(p), st = await p.evaluate(() => JSON.parse(JSON.stringify(window.__fakeStore()))); await ctx.close();
  ({ ctx, p } = await abrir(b, H, GAB, st, ls1)); await p.waitForTimeout(2500);
  const ids = Object.keys(st).filter(k => k.startsWith('liberaciones/') && st[k].estado === 'EC').map(k => k.split('/')[1]).slice(0, 2000);
  const a0 = await porRuta(p); await masivo(p, ids, 120); await p.waitForTimeout(1500);
  const a1 = await porRuta(p);
  for (let i = 0; i < 5; i++) { await escribirOtro(p, 'liberaciones/' + ids[i], { descripcion: 'edit ' + i, editadoEn: { __ts: Date.now() } }); await p.waitForTimeout(300); }
  const a2 = await porRuta(p);
  const n = await p.evaluate(() => window.__fakeEscuchas().filter(e => e.path === 'liberaciones' && e.w.some(w => /^editadoEn>=/.test(w))).length);
  await ctx.close();
  return { marca: Object.keys(ls1).some(k => /segMarca/.test(k)), masivo: a1 - a0, sueltas: a2 - a1, n, ids: ids.length };
}
// (2) «Enterado» de otro con la caché vieja: R está «Enterado» en el servidor y la caché lo tiene sin el campo; R2 de verdad no lo tiene
async function caso2(b, H, conMarca) {
  const DB = base(300), ahora = Date.now();
  const lev = (desc, t) => ({ actividad: 'LEV', estado: 'NA', numero: '', origen: 'app', creadoPor: 'operario@gmail.com', creadoNombre: 'Pedro Operario', estructuraId: 'pp', subestructuraId: 'pp-este', descripcion: desc, fechaCampo: { __ts: t }, creadoEn: { __ts: t }, editadoEn: { __ts: t }, archivos: [] });
  const R = lev('Marcado por otro', ahora - 60000);
  DB['liberaciones/R'] = { ...R, visto: true, vistoPor: 'otro@gmail.com', vistoNombre: 'Otra Persona', vistoEn: { __ts: ahora - 30000 } };
  DB['liberaciones/R2'] = lev('Sin campo de verdad', ahora - 50000);
  const ls = conMarca ? { 'lib.segMarca.LEV.gabinete@gmail.com': String(ahora - 5 * 60000) } : {};
  const { ctx, p } = await abrir(b, H, GAB, DB, ls, { 'liberaciones/R': R });
  await p.waitForTimeout(2500);
  const st = await p.evaluate(() => { const s = window.__fakeStore(); return { R: s['liberaciones/R'], R2: s['liberaciones/R2'] }; });
  const levs = await p.evaluate(() => __T.S.bandeja.levs.map(r => ({ id: r.id, visto: r.visto })));
  await ctx.close();
  return { R: st.R, R2: st.R2, rPor: levs.some(r => r.id === 'R' && !r.visto), r2Por: levs.some(r => r.id === 'R2' && !r.visto) };
}

(async () => {
  const b = await chromium.launch();
  await semilla(b);
  const versiones = [['después', NUEVO]]; if (process.env.HTML_ANTES) versiones.unshift(['antes', leerHTML(process.env.HTML_ANTES)]);
  for (const [v, H] of versiones) {
    const c1 = await caso1(b, H);
    console.log(`   [${v}] (1) cambio masivo de ${c1.ids}: ${c1.masivo} documentos · 5 ediciones sueltas: ${c1.sueltas} · escuchas de «editados desde la marca» abiertas: ${c1.n}`);
    for (const m of [false, true]) {
      const c2 = await caso2(b, H, m);
      console.log(`   [${v}] (2) ${m ? 'con marca' : '1.ª vez'}: R en el servidor ${JSON.stringify({ visto: c2.R.visto, vistoPor: c2.R.vistoPor })} · R2 ${JSON.stringify({ visto: c2.R2.visto })} · R en «Por ver»: ${c2.rPor} · R2 en «Por ver»: ${c2.r2Por}`);
      if (v === 'después') {
        const q = m ? 'con marca' : '1.ª vez en el equipo';
        ok(c2.R.visto === true && c2.R.vistoPor === 'otro@gmail.com', `(2) ${q}: el «Enterado» de otro no se pisa aunque la caché traiga la copia vieja`);
        ok(c2.R2.visto === false && c2.r2Por, `(2) ${q}: lo que de verdad no tiene el campo se ve en «Por ver» y queda con visto: false`);
        ok(!c2.rPor, `(2) ${q}: al llegar el servidor, lo «Enterado» no queda en «Por ver»`);
      }
    }
    if (v === 'después') {
      ok(c1.marca, '(1) la 1.ª sesión deja la marca del equipo');
      ok(c1.masivo <= 2300, `(1) cambio masivo de 2.000 registros: ${c1.masivo} documentos (≤ 2.300; antes 19.120)`);
      ok(c1.sueltas <= 10, `(1) 5 ediciones sueltas después: ${c1.sueltas} documentos (≤ 10; antes 10.005)`);
      ok(c1.n === 1, `(1) una sola escucha de «editados desde la marca» (${c1.n})`);
    }
  }
  await b.close();
  console.log(errores.length ? 'Errores: ' + errores.join(' | ') : 'Errores: ninguno');
  if (errores.length) process.exitCode = 1;
})();
