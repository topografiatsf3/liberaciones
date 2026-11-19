// Lote A de la auditoría (rendimiento y redibujos): lo que se arregló queda fijado
// (a) Entrar al Panel de una estructura con 3 frentes (12 partes del resumen) dibuja 3 veces o menos (antes 13), y un cambio con el Panel abierto, 2 o menos
// (b) Aceptar 20 en grupo desde la Bandeja redibuja la Bandeja un número acotado de veces (antes ≈ 2 por registro)
// (c) Escribir en el buscador de la Bandeja no pierde el foco ni lo escrito cuando llega un levantamiento o un aspa de otra persona
// (d) natural() ordena igual que localeCompare("es", { numeric, sensitivity: "base" }) (capas, tildes, mayúsculas, vacíos, números)
// (e) Buscar da lo mismo antes y después de renombrar un tipo: el texto de búsqueda guardado se rehace (caché invalidada)
// (f) L.* con índices: mismo resultado que find (id que no existe, repetido, clave vieja de topógrafo)
// Uso: PUERTO=8788 node pruebas/prueba53.js   (HTML=<archivo> sirve otro index.html, para comparar con la versión anterior)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
// index.html con contadores en las funciones que redibujan y las piezas que se revisan a la vista de la prueba
let H = fs.readFileSync(process.env.HTML || path.join(__dirname, '..', 'index.html'), 'utf8');
for (const [f, k] of [['actualizarPanel', 'ap'], ['pintarBandeja', 'pb']]) H = H.replace(`function ${f}() {`, `function ${f}() { (window.__n ||= {}).${k} = (window.__n.${k} || 0) + 1;${process.env.DEPURAR ? ` (window.__pila ||= []).push(new Error().stack.split("\\n").slice(2, 5).join(" < "));` : ''}`);
{ const i = H.indexOf('<script type="module">'), j = H.indexOf('</script>', i); H = H.slice(0, j) + '\nwindow.__T = { S, L, natural, coincide, terminos };\n' + H.slice(j); }
const ahora = Date.now(), min = 6e4;
const base = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', equipo: 'ET', estado: 'PT', fechaCampo: { __ts: ahora - min }, creadoEn: { __ts: ahora - min }, editadoEn: { __ts: ahora - min }, archivos: [], descripcion: 'Registro de prueba', ...extra });
const DB = { 'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true }, 'config/general': { resumenV: 2, prefijo: 'SKT-TOP-', digitos: 5 }, 'contadores/skt': { ultimo: 500 } };
for (let i = 0; i < 20; i++) DB['liberaciones/pt' + String(i).padStart(2, '0')] = base({ descripcion: 'Pendiente número ' + i, pkInicio: i * 60, pkFin: i * 60 + 40, fechaCampo: { __ts: ahora - (i + 1) * min }, creadoEn: { __ts: ahora - (i + 1) * min } });
for (let i = 1; i <= 2; i++) DB['liberaciones/lev' + i] = base({ actividad: 'LEV', estado: 'NA', tipoId: '', descripcion: 'Levantamiento ' + i, pkInicio: null, pkFin: null });
// Resumen del Panel repartido en las partes de los 3 frentes de Presa Principal
const subs = ['pp-oeste', 'pp-este', 'pp-sur'];
subs.forEach((s, n) => { for (let k = 0; k < 4; k++) { const r = {}; for (let i = 0; i < 5; i++) r[`${s}-${k}-${i}`] = ['filtro1', 'Capa ' + (1 + (i % 3)), k * 200 + i * 30, k * 200 + i * 30 + 25, ['PT', 'EP', 'EC', 'OB'][i % 4], ahora - (k * 5 + i) * 36e5, i % 2 ? 'SKT-TOP-0' + (100 + n * 40 + k * 5 + i) : '', 'LIB', 'GN', 0]; DB['resumen/' + (k ? `${s}~${k}` : s)] = { r }; } });

const rutas = async c => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
  await c.route(u => u.pathname === '/' || u.pathname === '/index.html', r => r.fulfill({ body: H, contentType: 'text/html; charset=utf-8' }));
};
async function abrir(b, v, u, vista) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, hasTouch: !!v.tactil, isMobile: !!v.tactil, serviceWorkers: 'block' });
  await rutas(ctx); const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(v.n + ': ' + e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource|permissions/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u, vista]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.vista', JSON.stringify(vista)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); }, [DB, u, vista]);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(800);
  return { ctx, p };
}
const ir = async (p, v) => { await p.click(`#nav [data-v="${v}"]`); await p.waitForTimeout(450); };
const cuenta = (p, k) => p.evaluate(k => (window.__n || {})[k] || 0, k);
const cero = p => p.evaluate(() => { window.__n = {}; });
const escribirOtro = (p, id, datos) => p.evaluate(async ([id, datos]) => { const f = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js'); await f.setDoc(f.doc(null, ...id.split('/')), datos, { merge: true }); }, [id, datos]);

(async () => {
  const b = await chromium.launch();
  for (const v of [{ n: 'pc', w: 1366, h: 900 }, { n: 'cel', w: 390, h: 844, tactil: true }]) {
    const { ctx, p } = await abrir(b, v, ADMIN, 'todos');
    // (a) Panel
    await cero(p); await ir(p, 'panel'); await p.waitForTimeout(1200);
    const nAp = await cuenta(p, 'ap'), nSeg = await p.evaluate(() => document.querySelectorAll('#chart rect.seg, #chart .pfila, #pLista .pfila').length);
    ok(nAp >= 1 && nAp <= 3, `${v.n} (a) entrar al Panel de Presa Principal (3 frentes, 12 partes) dibuja ${nAp} veces (≤ 3; antes 13)`);
    ok(nSeg > 0 && await p.evaluate(() => !/Cargando/.test(document.querySelector('#pListaT')?.textContent || '')), `${v.n} (a) el Panel muestra los datos (${nSeg} elementos) y ya no dice «Cargando…»`);
    await cero(p);
    await escribirOtro(p, 'resumen/pp-oeste~2', { r: { 'pp-oeste-nuevo': ['filtro1', 'Capa 1', 900, 960, 'PT', Date.now(), '', 'LIB', 'GN', 0] } }); await p.waitForTimeout(600);
    if (process.env.DEPURAR) console.log(await p.evaluate(() => (window.__pila || []).slice(-4).join('\n')));
    const nAp2 = await cuenta(p, 'ap'), lo = await p.evaluate(() => document.querySelector('#pLista').innerHTML.includes('pp-oeste-nuevo'));
    // (el Firebase simulado avisa a todas las escuchas en cada escritura: la de «listas» redibuja la vista entera una vez más)
    ok(nAp2 <= 2 && lo, `${v.n} (a) un cambio con el Panel abierto: ${nAp2} dibujos (≤ 2; antes 14) y el registro nuevo aparece en la lista`);
    await cero(p);
    await escribirOtro(p, 'resumen/pp-sur~1', { r: { 'pp-sur-nuevo': ['filtro1', 'Capa 1', 900, 960, 'PT', Date.now(), '', 'LIB', 'GN', 0] } }); await p.waitForTimeout(600);
    const nAp3 = await cuenta(p, 'ap');
    ok(nAp3 <= 2 && await p.evaluate(() => __T.S.panelDatos.some(r => r.id === 'pp-sur-nuevo')), `${v.n} (a) un cambio en otro frente (Presa Principal Sur): ${nAp3} dibujos (≤ 2; antes 14), y el dato queda guardado para cuando se mire ese frente`);
    // (d) natural
    const nat = await p.evaluate(() => { const c = ['Capa 10', 'Capa 2', 'capa 2', 'Capa 02', 'Cápa 3', 'CAPA 1', '', ' ', '10', '9', '2', '02', 'b', 'B', 'á', 'a', 'Á', 'Ñandú', 'nandu', 'Capa 1A', 'Capa 1a', 'Sub-base', 'Subbase', 'base', '0+020', '0+100', '1.5', '1.25', '-3', 'Capa 10.5', 'x2', 'x10', 'X1', 'é', 'E', 'Transición', 'transicion', null, undefined, 3, 20, 'Capa  2', 'Capa 2 ']; const viejo = (a, b) => String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
      let mal = 0; for (const a of c) for (const b of c) if (Math.sign(__T.natural(a, b)) !== Math.sign(viejo(a, b))) mal++;
      return { mal, n: c.length * c.length, igual: JSON.stringify(c.slice().sort(__T.natural).map(String)) === JSON.stringify(c.slice().sort(viejo).map(String)) }; });
    ok(!nat.mal && nat.igual, `${v.n} (d) natural ordena igual que antes (${nat.n} pares, ${nat.mal} distintos; lista ordenada igual)`);
    // (f) L.* igual que find
    const lx = await p.evaluate(() => { const S = __T.S, L = __T.L, viejo = { est: id => S.listas.estructuras.find(e => e.id === id), sub: id => { for (const e of S.listas.estructuras) { const s = (e.subs || []).find(x => x.id === id); if (s) return s; } return null; }, ele: id => S.listas.elementos.find(e => e.id === id), tipo: id => S.listas.tipos.find(e => e.id === id), topo: id => S.listas.topografos.find(e => e.id === id) || (id ? S.listas.topografos.find(e => (e.antes || []).includes(id)) : undefined), act: id => S.listas.actividades.find(e => e.id === id), equipo: id => (S.listas.equipos || []).find(e => e.id === id) };
      const t0 = S.listas.tipos[0], p0 = S.listas.topografos[0];
      S.listas.tipos = [...S.listas.tipos, { ...t0, nombre: 'Repetido' }]; S.listas.topografos = [...S.listas.topografos, { id: 'QQ', nombre: 'Q', antes: [p0.id, 'VIEJA'] }, { id: 'RR', nombre: 'R', antes: ['VIEJA'] }];
      const ids = [...S.listas.estructuras.flatMap(e => [e.id, ...(e.subs || []).map(s => s.id)]), ...S.listas.tipos.map(x => x.id), ...S.listas.elementos.map(x => x.id), ...S.listas.topografos.map(x => x.id), 'VIEJA', ...S.listas.actividades.map(x => x.id), ...(S.listas.equipos || []).map(x => x.id), '', undefined, null, 'no-existe'];
      let mal = 0, n = 0; for (const k in viejo) for (const id of ids) { n++; if (L[k](id) !== viejo[k](id)) mal++; }
      return { mal, n, rep: L.tipo(t0.id) === t0, vieja: L.topo('VIEJA')?.id }; });
    ok(!lx.mal && lx.rep && lx.vieja === 'QQ', `${v.n} (f) L.* da lo mismo que find en ${lx.n} consultas (repetido: gana el primero; clave vieja → ${lx.vieja})`);
    await ctx.close();
  }
  // (b) y (c) Bandeja (computadora)
  {
    const v = { n: 'pc', w: 1366, h: 900 };
    const { ctx, p } = await abrir(b, v, ADMIN, 'bandeja');
    // (c) foco del buscador con un levantamiento y un aspa que llegan de otra persona
    await p.click('#bq'); await p.keyboard.type('pend', { delay: 40 }); await p.waitForTimeout(400);
    await cero(p);
    await escribirOtro(p, 'liberaciones/levOtro', base({ actividad: 'LEV', estado: 'NA', tipoId: '', creadoPor: 'otro@gmail.com', descripcion: 'Levantamiento de otro', pkInicio: null, pkFin: null })); await p.waitForTimeout(500);
    let f = await p.evaluate(() => ({ id: document.activeElement?.id, v: document.querySelector('#bq')?.value, lev: document.querySelector('[data-bt="LEV"] .cnt')?.textContent }));
    ok(f.id === 'bq' && f.v === 'pend' && f.lev === '3', `(c) llega un levantamiento de otra persona: el buscador sigue con el foco y «${f.v}» (Levantamientos: ${f.lev})`);
    await escribirOtro(p, 'liberaciones/aspOtro', base({ actividad: 'ASP', estado: 'NA', tipoId: '', creadoPor: 'otro@gmail.com', descripcion: 'Aspa de otro', procesado: false })); await p.waitForTimeout(500);
    await p.keyboard.type('i', { delay: 40 }); await p.waitForTimeout(500);
    f = await p.evaluate(() => ({ id: document.activeElement?.id, v: document.querySelector('#bq')?.value, n: document.querySelectorAll('#blist [data-rid]').length }));
    ok(f.id === 'bq' && f.v === 'pendi', `(c) llega un aspa y se sigue escribiendo: foco en el buscador y «${f.v}» (${f.n} filas)`);
    await p.fill('#bq', ''); await p.waitForTimeout(500); await p.evaluate(() => document.activeElement?.blur());
    // (b) aceptar 20 en grupo
    await p.evaluate(() => { const a = document.querySelector('#bAll2') || document.querySelector('#bAll'); a.click(); }); await p.waitForTimeout(300);
    const nSel = await p.evaluate(() => __T.S.bandeja.sel.size);
    await cero(p);
    await p.evaluate(() => document.querySelector('[data-bk="aceptar"]').click()); await p.waitForSelector('.dlg.on form'); await p.waitForTimeout(250);
    await p.evaluate(() => document.querySelector('.dlg.on form').requestSubmit());
    await p.waitForFunction(() => /códigos generados/.test(document.body.textContent), null, { timeout: 60000 }); await p.waitForTimeout(800);
    const nPb = await cuenta(p, 'pb'), est = await p.evaluate(() => Object.entries(window.__fakeStore()).filter(([k, x]) => k.startsWith('liberaciones/pt') && x.estado === 'EP' && x.numero).length);
    ok(nSel === 20 && est === 20, `(b) se aceptaron los 20 (con código y En proceso: ${est})`);
    ok(nPb <= 25, `(b) aceptar 20 en grupo redibuja la Bandeja ${nPb} veces (≤ 25: una por cuadro como mucho; antes 101)`);
    // (e) buscar antes y después de renombrar el tipo
    await ir(p, 'todos');
    const filasCon = async q => { await p.fill('#q', q); await p.waitForTimeout(800); return p.evaluate(() => new Set([...document.querySelectorAll('#view [data-id]')].map(x => x.dataset.id)).size); };
    const nomT = await p.evaluate(() => __T.S.listas.tipos.find(t => t.id === 'filtro1').nombre);
    const uiAntes = await filasCon(nomT); await p.fill('#q', ''); await p.waitForTimeout(500); await p.evaluate(() => document.activeElement?.blur());
    const r1 = await p.evaluate(() => { const S = __T.S, nom = S.listas.tipos.find(t => t.id === 'filtro1').nombre, c = q => S.todos.filter(r => __T.coincide(r, __T.terminos(q))).length; return { nom, viejo: c(nom), nuevo: c('Zeolitazz'), total: S.todos.filter(r => r.tipoId === 'filtro1').length }; });
    await p.evaluate(async () => { const f = await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js'); const items = __T.S.listas.tipos.map(t => t.id === 'filtro1' ? { ...t, nombre: 'Zeolitazz' } : { ...t }); await f.setDoc(f.doc(null, 'listas', 'tipos'), { items }); });
    await p.waitForTimeout(600);
    const r2 = await p.evaluate(nom => { const S = __T.S, c = q => S.todos.filter(r => __T.coincide(r, __T.terminos(q))).length; return { viejo: c(nom), nuevo: c('Zeolitazz') }; }, r1.nom);
    ok(r1.viejo === r1.total && r1.total > 0 && r1.nuevo === 0, `(e) antes de renombrar: «${r1.nom}» encuentra ${r1.viejo} de ${r1.total}; «Zeolitazz» ninguno`);
    ok(r2.nuevo === r1.total && r2.viejo === 0, `(e) después de renombrar: «Zeolitazz» encuentra ${r2.nuevo} y «${r1.nom}» ${r2.viejo} (el texto guardado se rehízo)`);
    const uiNuevo = await filasCon('zeolitazz'), uiViejo = await filasCon(nomT);
    ok(uiAntes > 0 && uiNuevo === uiAntes && uiViejo === 0, `(e) en Registros (todo el historial): «${nomT}» mostraba ${uiAntes}; tras renombrar, «zeolitazz» muestra ${uiNuevo} y el nombre viejo ${uiViejo}`);
    await ctx.close();
  }
  ok(!errores.length, 'sin errores en la consola' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
  await b.close();
})();
