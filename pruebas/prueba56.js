// Lote E de la auditoría (escuchas y lecturas de Firebase al crecer): lo que se arregló queda fijado
// (a) Documentos que baja una sesión de gabinete y una de jefe con 3.000 registros (abrir, Bandeja, Registros, «más antiguos» ×5,
//     Panel, volver a la Bandeja y 20 cambios de otros): por debajo de un tope fijo, la segunda vez en el equipo mucho menos que antes
// (b) Aspas y levantamientos: en vivo solo lo pendiente; «Procesadas» y «Enterados» muestran lo mismo que antes (número, orden,
//     primeras filas, «Ver más (N)») y «Ver más» trae el resto del servidor; los registros sin el campo se ven y quedan con false
// (c) Al salir del Panel o de la Papelera (Registros) se suelta la escucha y al volver se ve al instante (sin vacío ni «Cargando»)
// (d) «Cargar registros más antiguos» lee solo la página nueva (100), no vuelve a leer lo ya cargado
// (e) config/general en vivo y versionMin: recarga sola si no hay nada escrito, avisa si hay un formulario a medio llenar, sin bucle
// (f) «En proceso» con cientos: se escuchan 300 y «Ver más» trae el resto; el número de la pestaña es el total
// Uso: PUERTO=8791 node pruebas/prueba56.js
//      MEDIR=1 HTML_ANTES=<index.html anterior> node pruebas/prueba56.js   → tabla antes/después (3.000 y 10.000) y HTML comparado
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Jefe Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const leerHTML = f => { let H = fs.readFileSync(f, 'utf8'); H = H.replace('SOLTAR_MS = 45000', 'SOLTAR_MS = 400');
  const i = H.indexOf('<script type="module">'), j = H.indexOf('</script>', i);
  return H.slice(0, j) + '\nwindow.__T = { S, get SEGV() { try { return SEGV; } catch (e) { return null; } }, verMenor: typeof verMenor === "function" ? verMenor : null };\n' + H.slice(j); };
const NUEVO = leerHTML(path.join(__dirname, '..', 'index.html'));

// Base de N registros: 15 % levantamientos (90 % ya «Enterado»), 2 % aspas (85 % procesadas), 5 % en proceso (de la app),
// 3 % por aceptar, 1 % observadas, el resto entregadas. Lo pendiente de antes no tiene el campo (como en la base real)
function parteRes(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; return Math.abs(h) % 4; }
let LISTAS = {};
function base(N, o = {}) {
  const ahora = Date.parse('2026-11-18T12:00:00Z') - 0, dia = 864e5, DB = { ...LISTAS }, res = {};
  DB['usuarios/gabinete@gmail.com'] = { nombre: 'Gabinete Prueba', rol: 'gabinete', activo: true };
  DB['usuarios/jefe@gmail.com'] = { nombre: 'Jefe Prueba', rol: 'jefe', activo: true };
  DB['usuarios/operario@gmail.com'] = { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true };
  DB['config/general'] = { resumenV: 2, prefijo: 'SKT-TOP-', digitos: 5 };
  DB['contadores/skt'] = { ultimo: N + 10 };
  let x = 7; const azar = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  const subs = ['pp-oeste', 'pp-este', 'pp-sur'];
  const nEP = o.ep ?? Math.round(N * 0.05);
  for (let i = 0; i < N; i++) {
    const id = 'r' + String(i).padStart(6, '0'), t = ahora - (N - i) * (300 * dia / N), u = azar(), sub = subs[i % 3];
    const r = { actividad: 'LIB', estado: 'EC', numero: 'SKT-TOP-' + String(i + 1).padStart(5, '0'), creadoPor: 'operario@gmail.com', creadoNombre: 'Pedro Operario', origen: 'app', estructuraId: 'pp', subestructuraId: sub, elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa ' + (1 + (i % 9)), topografoId: 'GN', equipo: 'ET', pkInicio: (i * 7) % 2600, pkFin: (i * 7) % 2600 + 20, fechaCampo: { __ts: t }, creadoEn: { __ts: t }, editadoEn: { __ts: t }, archivos: [], descripcion: 'Registro ' + i };
    if (u < 0.15) { Object.assign(r, { actividad: 'LEV', estado: 'NA', numero: '', tipoId: '', elementoId: '', pkInicio: null, pkFin: null, descripcion: 'Levantamiento ' + i });
      if (azar() < 0.9) Object.assign(r, { visto: true, vistoPor: 'gabinete@gmail.com', vistoNombre: 'Gabinete Prueba', vistoEn: { __ts: t + 3600e3 } }); }
    else if (u < 0.17) { Object.assign(r, { actividad: 'ASP', estado: 'NA', numero: '', tipoId: '', elementoId: '', pkInicio: null, pkFin: null, descripcion: 'Aspas ' + i });
      if (azar() < 0.85) Object.assign(r, { procesado: true, procesadoPor: 'jefe@gmail.com', procesadoNombre: 'Jefe Prueba', procesadoEn: { __ts: t + 7200e3 } }); }
    else if (u < 0.17 + nEP / N) Object.assign(r, { estado: 'EP', fechaLiberacion: { __ts: t + dia } });
    else if (u < 0.25) Object.assign(r, { estado: 'PT', numero: '' });
    else if (u < 0.26) Object.assign(r, { estado: 'OB', numero: '', notaObservacion: 'Revisar' });
    DB['liberaciones/' + id] = r;
    const k = parteRes(id), rid = k ? sub + '~' + k : sub;
    (res[rid] ||= {})[id] = [r.tipoId, r.capa, r.pkInicio, r.pkFin, r.estado, t, r.numero, r.actividad, 'GN', r.visto || r.procesado ? 1 : 0];
  }
  for (const s of subs) for (let k = 0; k < 4; k++) DB['resumen/' + (k ? s + '~' + k : s)] = { r: res[k ? s + '~' + k : s] || {} };
  return DB;
}
const rutas = async (c, H) => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
  await c.route(u => u.pathname === '/' || u.pathname === '/index.html', r => r.fulfill({ body: H, contentType: 'text/html; charset=utf-8' }));
};
// Abre la app con la base en memoria (sin pasar por localStorage) y lo guardado en el equipo (lsExtra)
async function abrir(b, H, u, DB, lsExtra = {}, vista = 'bandeja', v = { w: 1366, h: 900 }) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, serviceWorkers: 'block' });
  await rutas(ctx, H);
  await ctx.addInitScript(([db, u, ex, vista]) => {
    window.__fakeDBInicial = db;
    if (!sessionStorage.getItem('__ini')) { sessionStorage.setItem('__ini', '1'); sessionStorage.setItem('__fakeDBGrande', '1'); localStorage.clear();
      localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.vista', JSON.stringify(vista)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste'));
      for (const k in ex) localStorage.setItem(k, ex[k]); }
  }, [DB, u, lsExtra, vista]);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource|permissions/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL); await p.waitForSelector('#nav button', { timeout: 60000 }); await p.waitForTimeout(1500);
  return { ctx, p };
}
const docs = p => p.evaluate(() => { let g = 0; for (const x of window.__fakeLecturas || []) g += x.n != null ? Math.max(1, x.n) : 1; return g + (window.__fakeDocsEscucha || 0); });
const ir = async (p, v, t = 600) => { await p.click(`#nav [data-v="${v}"]`); await p.waitForTimeout(t); };
const lsDe = p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^lib\.seg/.test(k)) o[k] = localStorage.getItem(k); } return o; });
const escribirOtro = (p, id, datos) => p.evaluate(async ([id, datos]) => { const f = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js'); await f.setDoc(f.doc(null, ...id.split('/')), datos, { merge: true }); }, [id, datos]);

// Sesión medida: abrir (Bandeja) → cada pestaña de la Bandeja → Registros y «más antiguos» ×5 → Panel → Bandeja → 20 cambios de otros
async function sesion(b, H, u, DB, lsExtra) {
  const { ctx, p } = await abrir(b, H, u, DB, lsExtra);
  const m = { abrir: await docs(p) };
  for (const t of await p.$$eval('#view .tabs [data-bt]', x => x.map(y => y.dataset.bt))) { await p.click(`#view .tabs [data-bt="${t}"]`); await p.waitForTimeout(250); }
  m.bandeja = await docs(p) - m.abrir;
  await ir(p, 'todos');
  for (let i = 0; i < 5; i++) { for (let j = 0; j < 20 && !(await p.$('#bMasSrv')) && await p.$('#bMas'); j++) { await p.click('#bMas'); await p.waitForTimeout(120); } if (!(await p.$('#bMasSrv'))) break; await p.click('#bMasSrv'); await p.waitForTimeout(700); }
  m.registros = await docs(p) - m.abrir - m.bandeja;
  m.nTodos = await p.evaluate(() => __T.S.todos.length);
  await ir(p, 'panel', 1500); m.panel = await docs(p) - m.abrir - m.bandeja - m.registros;
  await ir(p, 'bandeja', 1200); const a5 = await docs(p); m.volver = a5 - m.abrir - m.bandeja - m.registros - m.panel;
  // 20 cambios de otros mientras se está en la Bandeja: 10 en el resumen del Panel y 10 levantamientos nuevos de campo
  const ahora = Date.now();
  for (let i = 0; i < 10; i++) await escribirOtro(p, 'resumen/pp-oeste' + (i % 4 ? '~' + (i % 4) : ''), { r: { ['otro' + i]: ['filtro1', 'Capa 1', 10 * i, 10 * i + 5, 'PT', ahora, '', 'LIB', 'GN', 0] } });
  for (let i = 0; i < 10; i++) await escribirOtro(p, 'liberaciones/nuevo' + i, { actividad: 'LEV', estado: 'NA', numero: '', origen: 'app', creadoPor: 'operario@gmail.com', estructuraId: 'pp', subestructuraId: 'pp-este', descripcion: 'Nuevo ' + i, fechaCampo: { __ts: ahora }, creadoEn: { __ts: ahora + i }, editadoEn: { __ts: ahora + i }, archivos: [] });
  await p.waitForTimeout(1200);
  m.cambios = await docs(p) - a5; m.total = await docs(p);
  m.ls = await lsDe(p); m.store = await p.evaluate(() => JSON.parse(JSON.stringify(window.__fakeStore())));
  await ctx.close(); return m;
}
const fila = (n, m) => `| ${n.padEnd(34)} | ${String(m.abrir).padStart(6)} | ${String(m.bandeja).padStart(6)} | ${String(m.registros).padStart(6)} | ${String(m.panel).padStart(6)} | ${String(m.volver).padStart(6)} | ${String(m.cambios).padStart(6)} | ${String(m.total).padStart(7)} |`;

// HTML de la Bandeja (todas sus pestañas y filtros de hecho/por hacer) y de Registros, para comparar dos versiones
async function fotos(b, H, DB) {
  const { ctx, p } = await abrir(b, H, ADMIN, DB, {}, 'bandeja'); const out = {};
  const limpio = s => s.replace(/ data-mov="[^"]*"/g, '');
  for (const t of await p.$$eval('#view .tabs [data-bt]', x => x.map(y => y.dataset.bt))) {
    await p.click(`#view .tabs [data-bt="${t}"]`); await p.waitForTimeout(500);
    if (t === 'ASP' || t === 'LEV') { const c = t === 'ASP' ? 'asp' : 'lev';
      for (const v of ['por', 'hechas']) { await p.click(`[data-${c}="${v}"]`); await p.waitForTimeout(900); out[t + ':' + v] = limpio(await p.innerHTML('#view')); }
      await p.click(`[data-${c}="por"]`); await p.waitForTimeout(300); }
    else out[t] = limpio(await p.innerHTML('#view'));
  }
  await ir(p, 'todos', 900); out.todos = limpio(await p.innerHTML('#view'));
  await ctx.close(); return out;
}

// Las listas (frentes, tipos…) las crea la app al entrar el administrador: se toman de una entrada de prueba
async function semilla(b) { const { ctx, p } = await abrir(b, NUEVO, ADMIN, {}); await p.waitForTimeout(500); const st = await p.evaluate(() => window.__fakeStore()); await ctx.close(); LISTAS = Object.fromEntries(Object.entries(st).filter(([k]) => k.startsWith('listas/'))); }

(async () => {
  const b = await chromium.launch();
  await semilla(b);
  if (process.env.MEDIR) {
    const ANTES = leerHTML(process.env.HTML_ANTES);
    for (const N of (process.env.NS || '3000,10000').split(',').map(Number)) {
      const DB = base(N);
      console.log(`\n### ${N.toLocaleString('es-PE')} registros (15 % levantamientos, 2 % aspas, 5 % en proceso)\n| Sesión | abrir | Bandeja | Registros+5 | Panel | volver | 20 cambios | total |\n|---|---|---|---|---|---|---|---|`);
      for (const u of [GAB, JEFE]) {
        const a = await sesion(b, ANTES, u, DB); console.log(fila(`${u === GAB ? 'gabinete' : 'jefe'} · antes`, a));
        const d1 = await sesion(b, NUEVO, u, DB); console.log(fila(`${u === GAB ? 'gabinete' : 'jefe'} · después (1.ª vez en el equipo)`, d1));
        const d2 = await sesion(b, NUEVO, u, d1.store, d1.ls); console.log(fila(`${u === GAB ? 'gabinete' : 'jefe'} · después (siguientes)`, d2));
        console.log(`  (Registros cargados: antes ${a.nTodos}, después ${d2.nTodos})`);
      }
    }
    // HTML igual con los mismos datos (1.000: lo hecho cabe en la primera página; 3.000: no cabe y se pagina)
    for (const N of [1000, 3000]) {
      const DB = base(N), fa = await fotos(b, ANTES, DB), fd = await fotos(b, NUEVO, DB);
      for (const k of Object.keys(fa)) { const igual = fa[k] === fd[k]; ok(igual, `HTML de ${k} con ${N} registros: ${igual ? 'idéntico' : 'DISTINTO'} (${fa[k].length} caracteres)`);
        if (!igual) { let i = 0; while (fa[k][i] === fd[k][i]) i++; console.log('   antes:', fa[k].slice(Math.max(0, i - 120), i + 160)); console.log('   después:', fd[k].slice(Math.max(0, i - 120), i + 160)); } }
    }
    await b.close(); console.log(errores.length ? 'Errores: ' + errores.join(' | ') : 'Errores: ninguno'); return;
  }

  // (a) Documentos por sesión con 3.000 registros (topes con ≈ 18 % de margen; antes: gabinete 2.918, jefe 2.726 cada vez)
  const DB3 = base(3000);
  for (const [u, n, tope1, tope2] of [[GAB, 'gabinete', 1750, 1150], [JEFE, 'jefe', 1550, 870]]) {
    const d1 = await sesion(b, NUEVO, u, DB3), d2 = await sesion(b, NUEVO, u, d1.store, d1.ls);
    console.log(`   ${n}: 1.ª vez ${d1.total} documentos (${JSON.stringify({ abrir: d1.abrir, bandeja: d1.bandeja, registros: d1.registros, panel: d1.panel, volver: d1.volver, cambios: d1.cambios })}), siguientes ${d2.total} (${JSON.stringify({ abrir: d2.abrir, bandeja: d2.bandeja, registros: d2.registros, panel: d2.panel, volver: d2.volver, cambios: d2.cambios })})`);
    ok(d1.total <= tope1, `(a) ${n}, 3.000 registros, 1.ª vez en el equipo: ${d1.total} documentos (≤ ${tope1})`);
    ok(d2.total <= tope2, `(a) ${n}, 3.000 registros, las siguientes: ${d2.total} documentos (≤ ${tope2})`);
    ok(d2.registros <= 560 && d2.nTodos === 600, `(d) ${n}: «más antiguos» ×5 lee ${d2.registros} documentos (≤ 560; antes 2.000) y quedan ${d2.nTodos} registros cargados (600)`);
    ok(d2.cambios <= 40, `(c) ${n}: 20 cambios de otros estando en la Bandeja bajan ${d2.cambios} documentos (≤ 40: el Panel ya no escucha)`);
    // Los levantamientos y aspas que no tenían el campo quedaron con false (una vez)
    const sin = Object.entries(d1.store).filter(([k, r]) => k.startsWith('liberaciones/') && r.estado === 'NA' && r.origen === 'app' && (r.actividad === 'ASP' ? u === JEFE && r.procesado === undefined : r.visto === undefined)).length;
    ok(sin === 0, `(b) ${n}: tras la 1.ª vez no queda ${u === JEFE ? 'aspa ni levantamiento' : 'levantamiento'} sin el campo (${sin})`);
  }

  // (b) Pestañas de lo hecho iguales a lo que había, «Ver más» trae el resto del servidor
  {
    const DB = base(3000), { ctx, p } = await abrir(b, NUEVO, ADMIN, DB);
    const regs = Object.values(DB).filter(r => r.estado === 'NA' && r.origen === 'app');
    const levH = regs.filter(r => r.actividad === 'LEV' && r.visto).sort((a, c) => c.vistoEn.__ts - a.vistoEn.__ts), levP = regs.filter(r => r.actividad === 'LEV' && !r.visto);
    const aspH = regs.filter(r => r.actividad === 'ASP' && r.procesado).sort((a, c) => c.procesadoEn.__ts - a.procesadoEn.__ts), aspP = regs.filter(r => r.actividad === 'ASP' && !r.procesado);
    await p.click('[data-bt="LEV"]'); await p.waitForTimeout(500);
    const t1 = await p.textContent('#view .chips');
    ok(new RegExp(`Por ver\\s*${levP.length}`).test(t1) && new RegExp(`Enterados\\s*${levH.length}`).test(t1), `(b) Levantamientos: «Por ver ${levP.length}» y «Enterados ${levH.length}» como antes, sin bajar lo hecho (${t1.replace(/\s+/g, ' ').trim()})`);
    ok(await p.evaluate(() => !__T.SEGV.LEV.hU), '(b) lo enterado no se escucha mientras no se abre');
    await p.click('[data-lev="hechas"]'); await p.waitForTimeout(800);
    const filas = await p.$$eval('#blist [data-rid]', x => x.map(y => y.dataset.rid)), mas = await p.textContent('#bMas').catch(() => '');
    const esperado = levH.slice(0, 60).map(r => Object.keys(DB).find(k => DB[k] === r).split('/')[1]);
    ok(JSON.stringify(filas) === JSON.stringify(esperado), `(b) «Enterados»: las 60 primeras filas son las 60 más recientes, en el mismo orden (${filas.length})`);
    ok(new RegExp(`Ver más \\(${levH.length - 60}\\)`).test(mas), `(b) «Ver más (${levH.length - 60})» como antes (${mas.trim()})`);
    for (let i = 0; i < 20 && await p.$('#bMas'); i++) { await p.click('#bMas'); await p.waitForTimeout(350); }
    const todas = await p.$$eval('#blist [data-rid]', x => x.map(y => y.dataset.rid));
    ok(todas.length === levH.length && new Set(todas).size === todas.length, `(b) con «Ver más» se llega a los ${levH.length} enterados, sin repetidos (${todas.length})`);
    await p.click('[data-bt="ASP"]'); await p.waitForTimeout(400); await p.click('[data-asp="hechas"]'); await p.waitForTimeout(800);
    const tA = await p.textContent('#view .chips'), fA = await p.$$eval('#blist [data-rid]', x => x.length);
    ok(new RegExp(`Por procesar\\s*${aspP.length}`).test(tA) && new RegExp(`Procesadas\\s*${aspH.length}`).test(tA) && fA === Math.min(60, aspH.length), `(b) Aspas: «Por procesar ${aspP.length}», «Procesadas ${aspH.length}» y ${fA} filas`);
    // Un levantamiento nuevo de campo (nace sin «visto») aparece al instante en «Por ver» y queda con visto: false
    await p.click('[data-bt="LEV"]'); await p.waitForTimeout(300); await p.click('[data-lev="por"]'); await p.waitForTimeout(300);
    await escribirOtro(p, 'liberaciones/recien', { actividad: 'LEV', estado: 'NA', numero: '', origen: 'app', creadoPor: 'operario@gmail.com', estructuraId: 'pp', subestructuraId: 'pp-este', descripcion: 'Recién llegado', fechaCampo: { __ts: Date.now() }, creadoEn: { __ts: Date.now() }, editadoEn: { __ts: Date.now() }, archivos: [] });
    await p.waitForTimeout(700);
    ok((await p.textContent('#blist')).includes('Recién llegado') && new RegExp(`Por ver\\s*${levP.length + 1}`).test(await p.textContent('#view .chips')), '(b) un levantamiento nuevo sin el campo aparece al instante en «Por ver»');
    ok(await p.evaluate(() => window.__fakeStore()['liberaciones/recien'].visto === false), '(b) y queda guardado con visto: false (así lo encuentra la escucha de lo pendiente)');
    // Marcar enterado: sale de «Por ver» y el número de «Enterados» sube
    await p.click('#blist [data-rid="recien"] [data-a="enterado"]'); await p.waitForTimeout(800);
    const t2 = await p.textContent('#view .chips');
    ok(new RegExp(`Por ver\\s*${levP.length}`).test(t2) && new RegExp(`Enterados\\s*${levH.length + 1}`).test(t2), `(b) al marcar «Enterado» bajan los por ver y suben los enterados (${t2.replace(/\s+/g, ' ').trim()})`);
    // (c) Papelera: al salir de Registros se suelta su escucha; al volver se ve al instante
    await ir(p, 'todos', 600);
    const pap = await p.$('[data-pap="1"]');
    if (pap) {
      await pap.click(); await p.waitForTimeout(600);
      const conPap = () => p.evaluate(() => window.__fakeEscuchas().some(e => e.w.includes('borrado==true') && e.path === 'liberaciones'));
      ok(await conPap(), '(c) en la Papelera se escucha la papelera');
      await ir(p, 'bandeja', 900);
      ok(!(await conPap()), '(c) al salir de Registros se suelta la escucha de la papelera');
      await p.click('#nav [data-v="todos"]'); await p.waitForTimeout(30);
      ok(!/Cargando/.test(await p.textContent('#view')), '(c) al volver a la Papelera se ve lo último al instante (sin «Cargando»)');
      await p.waitForTimeout(400); ok(await conPap(), '(c) y se vuelve a escuchar');
    } else ok(false, '(c) no se encontró el botón de la Papelera');
    // (c) Panel
    await ir(p, 'panel', 1500);
    const conPanel = () => p.evaluate(() => window.__fakeEscuchas().filter(e => /^resumen\//.test(e.path)).length);
    const nPanel = await conPanel(), lista1 = await p.evaluate(() => __T.S.panelDatos.length);
    ok(nPanel === 12 && lista1 > 0, `(c) en el Panel se escuchan las 12 partes del resumen (${nPanel}) con ${lista1} registros`);
    await ir(p, 'bandeja', 900);
    ok(await conPanel() === 0, '(c) al salir del Panel se sueltan sus 12 escuchas');
    await p.click('#nav [data-v="panel"]'); await p.waitForTimeout(40);
    const lista2 = await p.evaluate(() => __T.S.panelDatos.length), carg = await p.evaluate(() => !!__T.S.panelCargando);
    ok(lista2 === lista1 && !carg, `(c) al volver al Panel se ve lo último al instante (${lista2} registros, sin «Cargando»)`);
    await p.waitForTimeout(1200); ok(await conPanel() === 12 && await p.evaluate(() => __T.S.panelDatos.length) >= lista1, '(c) y se vuelve a escuchar');
    // (e) versionMin: más vieja que la app, nada; ausente, nada
    ok(await p.evaluate(() => [__T.verMenor('1.44.2', '1.45.0'), __T.verMenor('1.44.10', '1.44.9'), __T.verMenor('1.45.0', '1.45.0'), __T.verMenor('1.9', '1.10.0'), __T.verMenor('2.0.0', '1.99.99')].join()) === 'true,false,false,true,false', '(e) versiones comparadas con tres números');
    await ctx.close();
  }

  // (e) versionMin: recarga sola si no hay nada escrito; con un formulario a medio llenar, aviso; sin bucle
  {
    const DB = base(50), { ctx, p } = await abrir(b, NUEVO, ADMIN, DB, {}, 'todos');
    let cargas = 0; p.on('load', () => cargas++);
    await escribirOtro(p, 'config/general', { versionMin: '1.0.0' }); await p.waitForTimeout(500);
    ok(cargas === 0, '(e) versionMin más vieja que la app: no pasa nada');
    // Formulario a medio llenar: avisa y no recarga
    await ir(p, 'nueva', 600); await p.fill('#iDesc', 'Escribiendo algo'); await p.waitForTimeout(200);
    await escribirOtro(p, 'config/general', { versionMin: '9.0.0' }); await p.waitForTimeout(800);
    ok(cargas === 0 && await p.$('#verNueva'), '(e) versionMin más nueva con un formulario a medio llenar: aviso «Hay una versión nueva», sin recargar');
    await ctx.close();
    // Sin nada escrito: recarga sola, y si sigue la vieja no insiste en bucle (como mucho 2 veces y un aviso)
    const DB2 = base(50); DB2['config/general'].versionMin = '9.0.0';
    const c2 = await b.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block' }); await rutas(c2, NUEVO);
    await c2.addInitScript(([db, u]) => { window.__fakeDBInicial = db; if (!sessionStorage.getItem('__ini')) { sessionStorage.setItem('__ini', '1'); sessionStorage.setItem('__fakeDBGrande', '1'); localStorage.clear(); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.vista', JSON.stringify('todos')); } }, [DB2, ADMIN]);
    const p2 = await c2.newPage(); let n2 = 0; p2.on('load', () => n2++);
    await p2.goto(URL); await p2.waitForTimeout(5000);
    ok(n2 >= 2 && n2 <= 3, `(e) versionMin más nueva sin nada escrito: recarga sola y no queda en bucle (${n2} cargas)`);
    ok(/ya no sirve/.test(await p2.textContent('body')), '(e) y si la copia nueva no llega, lo dice');
    await c2.close();
  }

  // (f) «En proceso» con 350: se escuchan 300, el número es 350 y «Ver más» trae el resto
  {
    const DB = base(1000, { ep: 0 }), ahora = Date.now();
    for (let i = 0; i < 350; i++) DB['liberaciones/ep' + String(i).padStart(3, '0')] = { actividad: 'LIB', estado: 'EP', numero: 'SKT-TOP-9' + String(i).padStart(4, '0'), origen: 'app', creadoPor: 'operario@gmail.com', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 1', topografoId: 'GN', pkInicio: i, pkFin: i + 1, fechaCampo: { __ts: ahora - i * 6e4 }, creadoEn: { __ts: ahora - i * 6e4 }, fechaLiberacion: { __ts: ahora - i * 6e4 }, archivos: [], descripcion: 'En proceso ' + i };
    const { ctx, p } = await abrir(b, NUEVO, GAB, DB);
    await p.click('[data-bt="EP"]'); await p.waitForTimeout(600);
    ok(/En proceso\s*350/.test(await p.textContent('[data-bt="EP"]')) && await p.evaluate(() => __T.S.bandeja.ep.length) === 300, '(f) «En proceso 350» con 300 escuchadas');
    for (let i = 0; i < 12 && (await p.$('#bMas') || await p.$('#bMasEP')); i++) { await p.click((await p.$('#bMas')) ? '#bMas' : '#bMasEP'); await p.waitForTimeout(400); }
    ok(await p.$$eval('#blist [data-rid]', x => x.length) === 350, '(f) con «Ver más» se llega a las 350');
    await ctx.close();
  }
  await b.close();
  console.log(errores.length ? 'Errores: ' + errores.join(' | ') : 'Errores: ninguno');
})();
