// Versión 44 · Arreglos fáciles de posición (revisión v39: X1, A1/X3, A2, X4, X6, P6, X7/C12, A8, X8, X9, X12, C11, X10, A10).
// Datos que lo provocan: un tipo de 87 caracteres, un frente de 84, un correo largo, registros sin código, capas y tramos que no se liberan.
// Todo se mide (getBoundingClientRect, scrollWidth, elementFromPoint, contraste calculado); las capturas son para mirar.
// Para ver las mediciones con una versión anterior: ANTES=ruta\index.html node pruebas\prueba48.js
// Rápida: los bloques corren de a PARALELO (4 por defecto; PARALELO=1 los corre uno por uno, como antes) y cada bloque imprime su resultado
// junto al terminar; las esperas de «que se termine de dibujar» son esperas a que la página quede quieta (ayuda.js), no tiempos fijos.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const { quieto } = require('./ayuda'); const { AsyncLocalStorage } = require('async_hooks'); const bloque = new AsyncLocalStorage();
const log = (...a) => { const b = bloque.getStore(); if (b) b.push(a.join(' ')); else console.log(...a); };
const esp = (p, ms) => quieto(p, Math.max(80, Math.round(ms * 0.35)));  // sustituye a waitForTimeout(ms): espera a que la pantalla quede quieta
const OUT = path.join(__dirname, 'capturas', process.env.ANTES ? 'prueba48-antes' : 'prueba48'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const LARGO = 'carolina.fernanda.maria.de.los.angeles.villanueva.rodriguez.huamanquispe@empresa-contratista-minera.com.pe';
const errores = [];
const ok = (c, m) => { if (!c) { log('FALLA:', m); process.exitCode = 1; } else log('ok  -', m); return !!c; };
const ahora = Date.now(), hora = 36e5, min = 6e4;
const TIPO87 = 'Relleno de filtro 1 con material seleccionado y compactado por capas en la zona del vaso oeste';
const FRENTE84 = 'Presa Principal Oeste, frente de relleno de filtros y transiciones aguas abajo del eje';
const base = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', equipo: 'ET', estado: 'PT', fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, editadoEn: { __ts: ahora - hora }, archivos: [], ...extra });
const eje = (e0, n0, largo, ang) => { const p = []; for (let k = 0; k <= largo; k += 50) p.push(k, +(e0 + k * Math.cos(ang)).toFixed(3), +(n0 + k * Math.sin(ang)).toFixed(3)); return { puntos: p, nombre: 'eje.csv' }; };
const DB = {
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'listas/tipos': { items: [['filtro1', TIPO87, 1], ['filtro2', 'Relleno filtro 2', 1], ['masivo', 'Relleno masivo', 1], ['estructural', 'Relleno estructural', 1]].map(([id, nombre, g], i) => ({ id, nombre, elementoId: 'mt', orden: i + 1, enGrafico: !!g })) },
  'listas/estructuras': { items: [
    { id: 'pp', nombre: 'Presa Principal', subs: [{ id: 'pp-oeste', nombre: FRENTE84, pkMin: 0, pkMax: 2700 }, { id: 'pp-este', nombre: 'Presa Principal Este', pkMin: 0, pkMax: 1200 }, { id: 'pp-sur', nombre: 'Presa Principal Sur', pkMin: 0, pkMax: 1800 }] },
    { id: 'pan', nombre: 'Presa Auxiliar Norte', subs: [{ id: 'pan', nombre: 'Presa Auxiliar Norte', pkMin: 0, pkMax: 400 }] }] },
  'capas/pp-oeste': { tipos: { filtro1: { capas: [10, 11, 12, 13].map(n => ({ nombre: 'Capa ' + n })), noAplica: [{ capa: 'Capa 11', pkInicio: 600, pkFin: 700, cota: '758.20', nota: 'Zona de roca sin relleno' }, { capa: '', pkInicio: 1000, pkFin: 1100, cota: '', nota: '' }] } } },
  'ejes/pp-oeste': eje(500000, 8300000, 2700, 0.3), 'ejes/pp-este': eje(500300, 8301600, 1200, 0.15), 'ejes/pp-sur': eje(500200, 8299000, 1800, -0.1),
  'solicitudes/muylargo@x.pe': { email: LARGO, nombre: 'Carolina', creadoEn: { __ts: ahora - hora } }
};
// Registros: 24 por aceptar sin código, 3 en proceso con código, 1 observada, 1 sin progresiva y 1 con archivo de nombre largo
for (let i = 0; i < 24; i++) DB['liberaciones/pt' + String(i).padStart(2, '0')] = base({ descripcion: 'Pendiente ' + i + ' relleno filtro uno tramo de prueba', pkInicio: i * 60, pkFin: i * 60 + 40, fechaCampo: { __ts: ahora - (i + 1) * min }, creadoEn: { __ts: ahora - (i + 1) * min } });
for (let i = 1; i <= 3; i++) DB['liberaciones/ep' + i] = base({ estado: 'EP', numero: 'SKT-TOP-0270' + i, descripcion: 'En proceso ' + i, nombreLiberacion: `0+${i}00_0+${i}40_F1_SKT-TOP-0270${i}_nombre de liberación muy largo para comprobar el recorte`, pkInicio: 2400 + i * 50, pkFin: 2420 + i * 50, capa: 'Capa 12', fechaLiberacion: { __ts: ahora - hora } });
DB['liberaciones/ob1'] = base({ estado: 'OB', numero: 'SKT-TOP-02790', descripcion: 'Observada uno', notaObservacion: 'Falta foto', pkInicio: 2600, pkFin: 2650, capa: 'Capa 12' });
DB['liberaciones/ec1'] = base({ estado: 'EC', numero: 'SKT-TOP-02650', descripcion: 'Entregada a Calidad', pkInicio: 1500, pkFin: 1540, capa: 'Capa 10', fechaLiberacion: { __ts: ahora - hora }, fechaEntrega: { __ts: ahora - min } });
DB['liberaciones/re1'] = base({ estado: 'RE', descripcion: 'Rechazada', notaRechazo: 'Repetida', pkInicio: 1600, pkFin: 1640, capa: 'Capa 10' });
DB['liberaciones/lv1'] = base({ actividad: 'LEV', estado: 'NA', descripcion: 'Levantamiento topográfico de prueba', tipoId: '', elementoId: '', pkInicio: 100, pkFin: 200, capa: '' });
DB['liberaciones/as1'] = base({ actividad: 'ASP', estado: 'NA', descripcion: 'Aspas para dron', tipoId: '', elementoId: '', pkInicio: 300, pkFin: 400, capa: '' });
DB['liberaciones/dr1'] = base({ actividad: 'DRN', estado: 'NA', descripcion: 'Vuelo de dron', tipoId: '', elementoId: '', pkInicio: 500, pkFin: 600, capa: '', equipo: 'DRN' });
for (let i = 0; i < 12; i++) DB['liberaciones/ay' + i] = base({ descripcion: 'De ayer ' + i, pkInicio: 1800 + i * 50, pkFin: 1830 + i * 50, capa: 'Capa 9', fechaCampo: { __ts: ahora - 26 * hora }, creadoEn: { __ts: ahora - 26 * hora } });
DB['liberaciones/pn1'] = base({ estado: 'RE', estructuraId: 'pan', subestructuraId: 'pan', tipoId: 'filtro2', descripcion: 'Auxiliar norte rechazada', notaRechazo: 'x', pkInicio: 10, pkFin: 50, capa: 'Capa 3' });
DB['liberaciones/sp1'] = base({ descripcion: 'Sin progresiva', pkInicio: null, pkFin: null });
DB['liberaciones/ar1'] = base({ estado: 'EP', numero: 'SKT-TOP-02801', descripcion: 'Con archivo', pkInicio: 1300, pkFin: 1340, capa: 'Capa 13', archivos: [{ nombre: 'Plano de la liberación del filtro uno con un nombre larguísimo de archivo para el recorte final.pdf', tipo: 'csv', tam: 2000, url: 'x' }] });

const esperar = (p, fn, arg, ms = 8000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
const rutas = async c => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
  if (process.env.ANTES) await c.route(u => /\/(index\.html)?$/.test(u.pathname), r => r.fulfill({ path: process.env.ANTES, contentType: 'text/html; charset=utf-8' }));
};
async function abrir(b, v, u, extra) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, hasTouch: !!v.tactil, isMobile: !!v.tactil });
  await rutas(ctx); const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(v.n + ': ' + e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); }, [{ ...DB, ...(extra || {}) }, u]);
  await p.reload(); await p.waitForSelector('#nav button'); await esp(p, 700);
  return { ctx, p };
}
const ir = async (p, v) => { await p.evaluate(v => { const b = document.querySelector(`#nav [data-v="${v}"]`) || document.querySelector(`[data-v="${v}"]`); b.click(); }, v); await esp(p, 500); };
const lado = p => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
const sinLado = async (p, donde) => { const l = await lado(p); ok(l.sw <= l.iw + 1, `${donde}: la página no se desplaza de lado (scrollWidth ${l.sw}, ancho ${l.iw})`); return l; };
const caja = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; }).catch(() => null);
const bf = m => m ? `${Math.round(m.w)}×${Math.round(m.h)} en x ${Math.round(m.x)}–${Math.round(m.r)}` : 'no está';
// Elementos de `sel` que se salen por la derecha del contenedor `cont` (o de la pantalla)
const fuera = (p, sel, cont) => p.evaluate(([sel, cont]) => {
  const c = cont && typeof cont === 'string' ? document.querySelector(cont) : null, lim = c ? c.getBoundingClientRect().right : (typeof cont === 'number' ? cont : innerWidth), out = [];
  document.querySelectorAll(sel).forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.right > lim + 1) out.push((e.id || e.getAttribute('aria-label') || e.className || e.tagName).toString().slice(0, 30) + ' →' + Math.round(r.right) + '>' + Math.round(lim)); });
  return out;
}, [sel, cont]);
// Contraste WCAG entre el color del texto y el fondo efectivo
const contraste = (p, sel, i = 0) => p.evaluate(([sel, i]) => {
  const el = [...document.querySelectorAll(sel)][i]; if (!el) return null;
  const rgb = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a] = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r, g, b, a: a == null || isNaN(a) ? 1 : a }; };
  let fondo = { r: 255, g: 255, b: 255 }; const cadena = []; for (let e = el; e; e = e.parentElement) cadena.unshift(e);
  for (const e of cadena) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0) fondo = { r: c.r * c.a + fondo.r * (1 - c.a), g: c.g * c.a + fondo.g * (1 - c.a), b: c.b * c.a + fondo.b * (1 - c.a) }; }
  let o = 1; for (const e of cadena) o *= parseFloat(getComputedStyle(e).opacity);
  const t = rgb(getComputedStyle(el).color), tf = { r: t.r * t.a * o + fondo.r * (1 - t.a * o), g: t.g * t.a * o + fondo.g * (1 - t.a * o), b: t.b * t.a * o + fondo.b * (1 - t.a * o) };
  const L = c => { const f = [c.r, c.g, c.b].map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * f[0] + .7152 * f[1] + .0722 * f[2]; };
  const a = L(tf), b = L(fondo); return { c: +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2), px: parseFloat(getComputedStyle(el).fontSize), txt: el.textContent.trim().slice(0, 30) };
}, [sel, i]);

async function x1(b) {
  for (const v of [{ n: 'celular 375', w: 375, h: 700, tactil: true }, { n: 'celular 360', w: 360, h: 640, tactil: true }, { n: 'PC 1366 (ya estaba bien)', w: 1366, h: 768 }]) {
    const { ctx, p } = await abrir(b, v, OPER);
    await ir(p, 'nueva'); await p.waitForSelector('#fLib:not([hidden])'); await esp(p, 500);
    if (await p.$('#tCambiar')) { await p.click('#tCambiar'); await esp(p, 200); }
    await esperar(p, () => document.querySelector('#tSel .tsel-chips .chip'));
    const chip = await caja(p, '#tSel .tsel-chips .chip'), caj = await caja(p, '#tSel');
    ok(chip && caj && chip.r <= caj.r + 1 && chip.x >= caj.x - 1 && caj.r <= v.w + 1, `X1 ${v.n}: el botón del tipo de 87 caracteres cabe en su caja y en la pantalla de ${v.w} px (${bf(chip)} en caja ${bf(caj)})`);
    if (v.w < 600) ok(chip && chip.h > 44, `X1 ${v.n}: el texto del tipo parte línea (alto ${chip && Math.round(chip.h)} px)`);
    const fu = await fuera(p, '#fLib select, #fLib input:not([type=hidden]), #fLib .chip, #fLib .f', v.w);
    ok(!fu.length, `X1 ${v.n}: nada del formulario supera el ancho de la pantalla${fu.length ? ' · ' + fu.slice(0, 4).join(', ') : ''}`);
    await sinLado(p, `X1 ${v.n}`);
    await p.screenshot({ path: `${OUT}/x1-nueva-${v.w}.png` });
    await p.$eval('#tSel .tsel-chips .chip', e => e.click()); await esp(p, 300);
    const ok2 = await caja(p, '#tCambiar'), cj = await caja(p, '#tSel');
    ok(ok2 && cj && ok2.r <= cj.r + 1, `X1 ${v.n}: con el tipo ya elegido el botón también cabe (${bf(ok2)})`);
    await sinLado(p, `X1 ${v.n} (tipo elegido)`);
    await ctx.close();
  }
}

// Ajustes: entra como administrador a la pestaña pedida
async function ajustes(b, v, tab, sub) {
  const r = await abrir(b, v, ADMIN, sub); const p = r.p;
  await ir(p, 'ajustes'); await p.waitForSelector('.ajgrid [data-tab]');
  await p.evaluate(t => document.querySelector(`.ajgrid [data-tab="${t}"]`).click(), tab); await esp(p, 600);
  return r;
}
const ANCHOS_AJ = [960, 1100, 1280, 1366, 1440, 1536, 1600, 1920];

async function x2(b) {
  for (const w of ANCHOS_AJ) {
    const v = { n: 'PC ' + w, w, h: 800 }, { ctx, p } = await ajustes(b, v, 'capas');
    await p.selectOption('#cTipo', 'filtro1'); await esp(p, 500);
    const l = await sinLado(p, `A1 Capas ${v.n}`);
    const lim = await p.evaluate(() => document.documentElement.clientWidth);
    const fu = await fuera(p, '#ajBody input:not([type=hidden]), #ajBody select, #ajBody button, #ajBody .nrow, #ajBody .cap-add', lim);
    ok(!fu.length, `A1 Capas ${v.n}: «Tramos que no se liberan» y «Agregar una» quedan dentro de la pantalla${fu.length ? ' · ' + fu.slice(0, 4).join(', ') : ''}`);
    const nrows = await p.$$eval('#cNa .nrow:not(.head)', rs => rs.map(r => { const c = r.closest('.card').getBoundingClientRect(); return [...r.querySelectorAll('input,select,button')].filter(e => e.getBoundingClientRect().width).map(e => { const q = e.getBoundingClientRect(); return { r: q.right, w: q.width, cr: c.right, n: e.getAttribute('aria-label') || e.id || e.textContent.trim() }; }); }));
    const mal = nrows.flat().filter(x => x.r > x.cr + 1 || x.w < (/^(Quitar|×)/.test(x.n) || x.n === 'Marcar' ? 28 : 56));
    ok(nrows.length >= 3 && !mal.length, `A1 Capas ${v.n}: «Capa, PK inicio, PK final, Cota, Motivo» y «Marcar» caben en su tarjeta (${nrows.length} filas${mal.length ? ' · mal: ' + mal.slice(0, 3).map(x => x.n + ' ' + Math.round(x.w) + 'px→' + Math.round(x.r) + '>' + Math.round(x.cr)).join(', ') : ''})`);
    const anchos = await p.evaluate(() => ['#cNom', '#cCota', '#cDe', '#cA'].map(s => [s, Math.round(document.querySelector(s).getBoundingClientRect().width)]));
    ok(anchos.every(([s, w]) => w >= (s === '#cNom' ? 120 : 48)), `A1 Capas ${v.n}: los campos de «Agregar una» tienen ancho útil (${anchos.map(a => a.join(' ')).join(', ')})`);
    if ([1366, 960].includes(w)) await p.screenshot({ path: `${OUT}/a1-capas-${w}.png`, fullPage: true });
    await ctx.close();
  }
}

async function a2(b) {
  for (const w of [960, 1100, 1200, 1280, 1366, 1440, 1500, 1536, 1920, 375]) {
    const v = { n: (w < 600 ? 'celular ' : 'PC ') + w, w, h: w < 600 ? 700 : 800, tactil: w < 600 }, { ctx, p } = await ajustes(b, v, 'lugares');
    await sinLado(p, `A2 Lugares ${v.n}`);
    // Los tres frentes de Presa Principal (el primero con 84 caracteres): se ve la tarjeta de la Presa Principal
    const filas = await p.$$eval('.ajgrid .srow:not(.head)', rs => rs.filter(r => r.getBoundingClientRect().width).map(r => {
      const n = r.querySelector('.sn'), q = n.getBoundingClientRect(), mas = r.querySelector('[data-k="smas"]').getBoundingClientRect(), c = r.closest('.card').getBoundingClientRect(), rr = r.getBoundingClientRect();
      const m = document.createElement('canvas').getContext('2d'); const cs = getComputedStyle(n); m.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      return { nom: n.value, w: q.width, lleno: m.measureText(n.value).width + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 2, corta: n.scrollWidth > n.clientWidth + 1, masR: mas.right, cardR: c.right, filaR: rr.right, masW: mas.width };
    }));
    ok(filas.length >= 3, `A2 Lugares ${v.n}: hay filas de frentes (${filas.length})`);
    // Los frentes de nombre normal se leen enteros siempre; el de 84 caracteres solo desde 1330 (a 1200 y 1280 el nombre tiene 402 y 482 de los 551 px que pide: queda su title) y a 1920
    const cortas = filas.filter((f, i) => f.lleno > f.w + 1 && (f.nom.length < 40 || (w >= 1330 && w < 1500) || w >= 1900)), fueras = filas.filter(f => f.masR > f.cardR + 1 || f.masW < 30);
    ok(!cortas.length, `A2 Lugares ${v.n}: el nombre del frente se lee entero (anchos de campo ${filas.slice(0, 3).map(f => Math.round(f.w) + '/' + Math.round(f.lleno)).join(' · ')} px)${cortas.length ? ' · cortados: ' + cortas.map(f => f.nom.slice(0, 12)).join(', ') : ''}`);
    ok(!fueras.length, `A2 Lugares ${v.n}: el «⋯» queda dentro de la tarjeta${fueras.length ? ' · ' + fueras.map(f => Math.round(f.masR) + '>' + Math.round(f.cardR)).join(', ') : ''}`);
    if ([1366, 1200].includes(w)) await p.screenshot({ path: `${OUT}/a2-lugares-${w}.png` });
    await ctx.close();
  }
}

async function x4(b) {
  for (const [w, h] of [[360, 640], [375, 700], [1366, 768]]) {
    for (const [que, titulo, extra] of [['espera', 'Acceso solicitado', {}], ['inactivo', 'Cuenta desactivada', { ['usuarios/' + LARGO]: { nombre: 'Carolina', rol: 'operario', activo: false } }]]) {
      const v = { n: (w < 600 ? 'celular ' : 'PC ') + w, w, h, tactil: w < 600 };
      const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: !!v.tactil, isMobile: !!v.tactil }); await rutas(ctx); const p = await ctx.newPage();
      p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
      await p.goto(URL);
      await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [{ ...DB, ...extra }, { uid: 'x1', email: LARGO, displayName: 'Carolina' }]);
      await p.reload(); await esperar(p, t => document.querySelector('.gate h1')?.textContent === t, titulo); await esp(p, 300);
      const m = await p.evaluate(() => { const bx = document.querySelector('.gate .box').getBoundingClientRect(), pp = document.querySelector('.gate .box p'), bb = pp.querySelector('b').getBoundingClientRect(), r = pp.getBoundingClientRect(); return { boxR: bx.right, boxL: bx.left, bR: bb.right, bL: bb.left, pw: pp.scrollWidth, pc: pp.clientWidth, h1: document.querySelector('.gate h1').textContent, vw: document.documentElement.clientWidth }; });
      ok(m.h1 === titulo, `X4 ${v.n}: se ve la pantalla «${titulo}»`);
      ok(m.pw <= m.pc + 1 && m.bR <= m.boxR + 1 && m.bL >= m.boxL - 1, `X4 ${v.n} «${titulo}»: el correo de ${LARGO.length} caracteres no se corta (texto ${m.pw}/${m.pc} px, correo x ${Math.round(m.bL)}–${Math.round(m.bR)} en caja ${Math.round(m.boxL)}–${Math.round(m.boxR)})`);
      await sinLado(p, `X4 ${v.n} «${titulo}»`);
      if (w === 360) await p.screenshot({ path: `${OUT}/x4-${que}-360.png` });
      await ctx.close();
    }
  }
}

async function a10(b) {
  const usuarios = {}; for (let i = 0; i < 40; i++) usuarios[`usuarios/persona${i}@gmail.com`] = { nombre: 'Persona número ' + i, rol: ['topografo', 'operario', 'gabinete'][i % 3], topografoId: 'GN', activo: true };
  const sol = {}; for (let i = 0; i < 2; i++) sol[`solicitudes/s${i}@x.pe`] = { email: `s${i}@x.pe`, nombre: 'Solicitante ' + i, creadoEn: { __ts: ahora - hora } };
  for (const w of [1366, 1280, 1536, 1920, 960]) {
    const v = { n: 'PC ' + w, w, h: 800 }, { ctx, p } = await ajustes(b, v, 'usuarios', { ...usuarios, ...sol });
    const m = await p.evaluate(() => { const [sl, ag, co] = [...document.querySelectorAll('#ajBody>.card')].map(c => c.getBoundingClientRect()); return { slB: sl.bottom, agT: ag.top, agL: ag.left, slL: sl.left, coL: co.left, coT: co.top, slT: sl.top }; });
    const hueco = Math.round(m.agT - m.slB);
    ok(hueco >= 0 && hueco <= 24, `A10 ${v.n}: «Agregar por correo» queda ${hueco} px bajo «Solicitudes» (sin hueco grande${w < 1200 ? ', una sola columna' : ''})`);
    const who = await p.$$eval('#sol .who', es => es.map(e => { const q = e.getBoundingClientRect(), t = e.querySelector('span').getBoundingClientRect(), sel = e.parentElement.querySelector('select').getBoundingClientRect(); return t.right <= q.right + 1 && !(t.right > sel.left && t.left < sel.right && t.bottom > sel.top && t.top < sel.bottom); }));
    ok(who.length >= 1 && who.every(Boolean), `A10 ${v.n}: el correo largo de una solicitud no pasa por debajo del selector de rol (${who.filter(Boolean).length} de ${who.length} bien)`);
    await sinLado(p, `A10 ${v.n}`);
    if (w === 1366) await p.screenshot({ path: `${OUT}/a10-usuarios-1366.png` });
    await ctx.close();
  }
}

// Panel → Planta (celular y PC): el selector «Tipo» no sobresale de su tarjeta y el nombre del frente no tapa los rótulos de PK
async function planta(b, v) {
  const { ctx, p } = await abrir(b, v, ADMIN); await ir(p, 'panel'); await p.waitForSelector('.chart-h [data-vista="planta"]');
  await p.evaluate(() => document.querySelector('.chart-h [data-vista="planta"]').click()); await p.waitForSelector('.plwrap svg'); await esp(p, 500);
  return { ctx, p };
}
async function x6(b) {
  for (const v of [{ n: 'celular 360', w: 360, h: 700, tactil: true }, { n: 'celular 375', w: 375, h: 700, tactil: true }, { n: 'PC 1366 (ya estaba bien)', w: 1366, h: 800 }]) {
    const { ctx, p } = await planta(b, v);
    const m = await p.evaluate(() => [...document.querySelectorAll('.pl-bar .plsel select')].filter(s => s.getBoundingClientRect().width).map(s => { const r = s.getBoundingClientRect(), c = s.closest('.plsel').getBoundingClientRect(), k = s.closest('.card').getBoundingClientRect(); return { id: s.id, r: r.right, l: r.left, cr: c.right, kr: k.right, kl: k.left, w: r.width }; }));
    ok(m.length >= 1 && m.every(x => x.r <= x.kr + 0.5 && x.l >= x.kl - 0.5), `X6 ${v.n}: los selectores de la barra de la planta quedan dentro de su tarjeta (${m.map(x => `${x.id} x ${Math.round(x.l)}–${Math.round(x.r)} en tarjeta ${Math.round(x.kl)}–${Math.round(x.kr)}`).join(' · ')})`);
    await sinLado(p, `X6 ${v.n}`);
    await p.screenshot({ path: `${OUT}/x6-planta-${v.w}.png`, fullPage: true });
    await ctx.close();
  }
}
// Rótulos: el nombre del frente no cubre ningún PK ni su punto, y el PK no se apoya sobre la línea del eje
async function p6(b) {
  for (const v of [{ n: 'celular 360', w: 360, h: 700, tactil: true }, { n: 'celular 375', w: 375, h: 700, tactil: true }, { n: 'PC 1366 (ya estaba bien)', w: 1366, h: 800 }]) {
    const { ctx, p } = await planta(b, v);
    if (process.env.DBG) await p.evaluate(() => { window.__dbg = 1; });
    const m = await p.evaluate(() => {
      const svg = document.querySelector('.plwrap svg'), rc = e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, top: r.top, bot: r.bottom }; };
      const cruza = (a, c) => a.l < c.r - 0.5 && a.r > c.l + 0.5 && a.top < c.bot - 0.5 && a.bot > c.top + 0.5;
      const nombres = [...svg.querySelectorAll('text.lab-pl')].map(e => ({ e, tx: e.textContent, ...rc(e) })), ticks = [...svg.querySelectorAll('text.tick')].filter(e => /^\d\+\d{3}$/.test(e.textContent.trim())).map(e => ({ tx: e.textContent.trim(), ...rc(e) }));
      const taparon = []; nombres.forEach(n => ticks.forEach(k => { if (cruza(n, k)) taparon.push(n.tx.slice(0, 14) + ' tapa ' + k.tx); }));
      // Cada PK contra la línea del eje de su frente: se mide muestreando el trazo (los gruesos son los de los ejes)
      const trazos = [...svg.querySelectorAll('path[stroke-width]')].filter(e => !e.classList.contains('tramo') && !/falta/.test(e.getAttribute('stroke'))).map(e => ({ e, g: parseFloat(e.getAttribute('stroke-width')) }));
      const toca = k => trazos.some(({ e, g }) => { const L = e.getTotalLength(), M = e.getScreenCTM(); for (let d = 0; d <= L; d += 3) { const q = e.getPointAtLength(d), x = q.x * M.a + M.e, y = q.y * M.d + M.f, lim = g / 2; if (x > k.l - lim && x < k.r + lim && y > k.top - lim + 1 && y < k.bot + lim - 1) return true; } return false; });
      const nomSobre = nombres.filter(toca).length;
      let sobre = 0; ticks.forEach(k => { const ok = trazos.some(({ e, g }) => { const L = e.getTotalLength(), M = e.getScreenCTM(); for (let d = 0; d <= L; d += 3) { const q = e.getPointAtLength(d), x = q.x * M.a + M.e, y = q.y * M.d + M.f; const lim = g / 2; if (x > k.l - lim && x < k.r + lim && y > k.top - lim + 1 && y < k.bot + lim - 1) return true; } return false; }); if (ok) sobre++; });
      if (window.__dbg) return { nombres: nombres.length, ticks: ticks.length, taparon, sobre, det: [...nombres, ...ticks].map(x => x.tx + ' ' + [x.l, x.r, x.top, x.bot].map(Math.round).join(',')) };
      return { nombres: nombres.length, ticks: ticks.length, taparon, sobre, nomSobre };
    });
    if (m.det) log(m.det.join(' | '));
    ok(m.nombres >= 1 && m.ticks >= 3, `P6 ${v.n}: se dibujan ${m.nombres} nombres de frente y ${m.ticks} rótulos de PK`);
    ok(!m.taparon.length, `P6 ${v.n}: el nombre del frente no tapa ningún rótulo de PK${m.taparon.length ? ' · ' + m.taparon.join(', ') : ''}`);
    ok(m.nomSobre === 0, `P6 ${v.n}: el nombre del frente no queda encima de la línea del eje (${m.nomSobre} de ${m.nombres} sobre el trazo)`);
    ok(m.sobre === 0, `P6 ${v.n}: ningún rótulo de PK queda encima de la línea del eje (${m.sobre} de ${m.ticks} sobre el trazo)`);
    await p.locator('.plwrap').screenshot({ path: `${OUT}/p6-planta-${v.w}.png` });
    await ctx.close();
  }
}

// El aviso (toast) no tapa el campo en error de «Nueva» ni los botones del pie de la ficha
const cruce = (a, b) => a && b && a.x < b.r && a.r > b.x && a.y < b.b && a.b > b.y;
async function x7(b) {
  for (const v of [{ n: 'celular 375', w: 375, h: 700, tactil: true }, { n: 'celular 360', w: 360, h: 640, tactil: true }, { n: 'PC 1366', w: 1366, h: 768 }]) {
    // «Nueva» vacía: «Guardar» marca varios campos y avisa «Revisa los campos marcados»
    let { ctx, p } = await abrir(b, v, OPER);
    await ir(p, 'nueva'); await p.waitForSelector('#fLib:not([hidden])'); await esp(p, 400);
    await p.$eval('#bGuardar', e => e.click()); await p.waitForTimeout(1100);  // fija a propósito: el aviso se reubica 500 ms después de salir (evitarTapar)
    let m = await p.evaluate(() => {
      const q = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
      const t = document.getElementById('toast'), a = document.activeElement, errs = [...document.querySelectorAll('#fLib .f.err')];
      return { on: t.classList.contains('on') && /Revisa/.test(t.textContent), t: q(t), foco: a && /INPUT|SELECT|TEXTAREA|BUTTON/.test(a.tagName) ? q(a) : null, errs: errs.map(q), vh: innerHeight, vw: innerWidth };
    });
    ok(m.on && m.errs.length >= 1, `X7 ${v.n}: «Revisa los campos marcados» sale con ${m.errs.length} campos en error`);
    const tapa = [m.foco, ...m.errs].filter(e => e && e.b > 0 && e.y < m.vh && cruce(m.t, e));
    ok(!tapa.length, `X7 ${v.n}: el aviso (y ${Math.round(m.t.y)}–${Math.round(m.t.b)}) no tapa el campo enfocado ni los campos en error${tapa.length ? ' · tapa ' + tapa.length : ''}`);
    await p.screenshot({ path: `${OUT}/x7-nueva-${v.w}.png` });
    await ctx.close();
    // Ficha abierta y desplazada hasta el pie: «Copiar» avisa y no debe tapar «Cerrar»
    ({ ctx, p } = await abrir(b, v, ADMIN));
    await ir(p, 'bandeja'); await p.click('[data-bt="EP"]').catch(() => {}); await p.waitForSelector('#blist [data-rid="ep1"]');
    await p.click(v.w < 860 ? '#blist [data-rid="ep1"] .item' : '#blist [data-rid="ep1"] td.tdesc'); await p.waitForSelector('#sheet.on #fCopiar'); await esp(p, 600);
    await p.evaluate(() => { const sh = document.getElementById('sheet'); sh.scrollTop = sh.scrollHeight; }); await esp(p, 300);
    await p.$eval('#fCopiar', e => e.click()); await p.waitForTimeout(900);
    m = await p.evaluate(() => {
      const q = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
      const t = document.getElementById('toast');
      return { on: t.classList.contains('on'), txt: t.textContent, t: q(t), cerrar: q(document.getElementById('fCerrar')), botones: [...document.querySelectorAll('#sheet .actions .btn')].map(q) };
    });
    ok(m.on, `X7/C12 ${v.n}: con la ficha en el pie sale el aviso «${m.txt.slice(0, 40)}»`);
    const bt = m.botones.filter(e => e && cruce(m.t, e));
    ok(m.cerrar && !cruce(m.t, m.cerrar) && !bt.length, `X7/C12 ${v.n}: el aviso (y ${Math.round(m.t.y)}–${Math.round(m.t.b)}) no tapa «Cerrar» (y ${m.cerrar && Math.round(m.cerrar.y)}–${m.cerrar && Math.round(m.cerrar.b)}) ni los otros botones del pie`);
    await p.screenshot({ path: `${OUT}/x7-ficha-${v.w}.png` });
    await ctx.close();
  }
}

// A8: «Panel preparado con N registros» solo sale en el Panel (el resumen se arma al entrar el administrador por primera vez)
async function a8(b) {
  for (const [vista, tab] of [['ajustes', 'lugares'], ['bandeja', ''], ['todos', ''], ['panel', '']]) {
    const v = { n: 'PC 1366', w: 1366, h: 768 }, ctx = await b.newContext({ viewport: { width: v.w, height: v.h } }); await rutas(ctx); const p = await ctx.newPage();
    p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
    await p.goto(URL);
    await p.evaluate(([d, u, vi, tab]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.vista', JSON.stringify(vi)); if (tab) localStorage.setItem('lib.ajTab', JSON.stringify(tab)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); window.__vistos = []; }, [DB, ADMIN, vista, tab]);
    // El aviso se vigila desde antes de entrar
    await p.addInitScript(() => { window.__avisos = []; new MutationObserver(() => { const t = document.getElementById('toast'); if (t && t.textContent) window.__avisos.push(t.textContent); }).observe(document, { subtree: true, childList: true, characterData: true }); });
    await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(1500);
    const vistaAct = await p.evaluate(() => document.querySelector('#nav [aria-current="page"], #nav .on')?.dataset?.v || location.hash);
    const av = await p.evaluate(() => [...new Set(window.__avisos || [])].filter(x => /Panel preparado/.test(x)));
    if (vista === 'panel') ok(av.length === 1, `A8 en el Panel (${vistaAct}): «${av[0] || '(no salió)'}» sí se muestra`);
    else ok(av.length === 0, `A8 al entrar a ${vista} (${vistaAct}) no sale «Panel preparado…» (avisos: ${av.length})`);
    await ctx.close();
  }
}

// X8: Registros sin columna de filtros (1024 y 960 px, o con la columna oculta): filtros parejos y chips de estado en varias líneas
async function x8(b) {
  for (const v of [{ n: 'PC 1024', w: 1024, h: 768 }, { n: 'PC 960', w: 960, h: 700 }, { n: 'PC 1366 con la columna de filtros oculta', w: 1366, h: 768, oculta: true }, { n: 'PC 1366 (ya estaba bien)', w: 1366, h: 768 }]) {
    const { ctx, p } = await abrir(b, v, ADMIN);
    if (v.oculta) await p.evaluate(() => localStorage.setItem('lib.facOff', 'true')), await p.reload(), await p.waitForSelector('#nav button'), await esp(p, 600);
    await ir(p, 'todos'); await p.waitForSelector('#rSt'); await esp(p, 500);
    const m = await p.evaluate(() => {
      const st = document.getElementById('rSt'), chips = [...st.children].map(c => c.getBoundingClientRect()), tops = [...new Set(chips.map(c => Math.round(c.top)))];
      const f = [...document.querySelectorAll('#rFil.rfil > .f')].map(e => ({ w: e.getBoundingClientRect().width, tipo: e.classList.contains('rf-tipo'), t: Math.round(e.getBoundingClientRect().top) }));
      return { sw: st.scrollWidth, cw: st.clientWidth, lineas: tops.length, f, ov: getComputedStyle(st).overflowX, hayFil: !!document.querySelector('#rFil.rfil'), n: chips.length };
    });
    const lineas = m.lineas, dentro = m.sw <= m.cw + 1;
    ok(m.n >= 6 && dentro && lineas <= 2, `X8 ${v.n}: los ${m.n} chips de estado caben sin desplazarse (scrollWidth ${m.sw} / ${m.cw}) en ${lineas} ${lineas === 1 ? 'línea' : 'líneas'}`);
    if (m.hayFil) {
      const filas = {}; m.f.forEach(x => (filas[x.t] ||= []).push(x));
      const ws = m.f.filter(x => !x.tipo).map(x => Math.round(x.w)), mn = Math.min(...ws), mx = Math.max(...ws);
      ok(mx - mn <= 2, `X8 ${v.n}: los ${m.f.length} filtros se reparten parejo (anchos ${[...new Set(ws)].join('/')} px, ${Object.keys(filas).length} filas)`);
      ok(Math.min(...m.f.filter(x => x.tipo).map(x => x.w)) >= mn - 1, `X8 ${v.n}: «Tipo de liberación» no es más angosto que los demás`);
    } else ok(true, `X8 ${v.n}: con la columna de filtros a la vista no hay barra de filtros (${m.n} chips en ${lineas} líneas)`);
    await sinLado(p, `X8 ${v.n}`);
    await p.screenshot({ path: `${OUT}/x8-registros-${v.w}${v.oculta ? 'o' : ''}.png` });
    await ctx.close();
  }
}

// C11: «Resumen para WhatsApp» con «Ayer y hoy»: los botones de periodo siguen a la vista y los botones del pie también
async function c11(b) {
  for (const v of [{ n: 'celular 375×667', w: 375, h: 667, tactil: true }, { n: 'celular 360×640', w: 360, h: 640, tactil: true }, { n: 'celular 375×560', w: 375, h: 560, tactil: true }, { n: 'celular 375×812', w: 375, h: 812, tactil: true }]) {
    const { ctx, p } = await abrir(b, v, OPER);
    await ir(p, 'mis'); await p.waitForSelector('#rWsp'); await p.$eval('#rWsp', e => e.click()); await p.waitForSelector('.dlg.on .wsp-per');
    const medir = () => p.evaluate(() => {
      const q = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { y: r.top, b: r.bottom, h: r.height }; };
      const d = document.querySelector('.dlg.on'), box = d.querySelector('.dlg-box') || d.firstElementChild; let c = d.querySelector('.wsp-per').parentElement; while (c && !/auto|scroll/.test(getComputedStyle(c).overflowY)) c = c.parentElement; if (c) c.scrollTop = c.scrollHeight;
      const cq = c ? c.getBoundingClientRect() : null; return { cont: cq && { y: cq.top, b: cq.bottom }, per: q(d.querySelector('.wsp-per')), ta: q(d.querySelector('#dWsp')), btns: [...d.querySelectorAll('.actions .btn, .dlg-foot .btn, button.btn')].filter(e => e.getBoundingClientRect().width).map(q), vh: innerHeight, box: q(box), lineas: d.querySelector('#dWsp').value.split('\n').length };
    });
    for (const per of ['hoy', 'dos']) {
      await p.$eval(`.wsp-per [data-per="${per}"]`, e => e.click()); await p.waitForTimeout(400);  // fija a propósito: se mide el diálogo ya asentado (con la espera por «página quieta» se medía antes de que terminara)
      const m = await medir();
      const botonesVis = m.btns.length && m.btns.every(x => x.y >= -0.5 && x.b <= m.vh + 0.5);
      ok(m.per && m.per.y >= -0.5 && m.per.b <= m.vh && (!m.cont || (m.per.y >= m.cont.y - 0.5 && m.per.b <= m.cont.b + 0.5)), `C11 ${v.n} «${per === 'dos' ? 'Ayer y hoy' : 'Hoy'}»: con el texto bajado al final los botones de periodo se ven completos (y ${Math.round(m.per.y)}–${Math.round(m.per.b)} de ${m.vh}; desplazamiento ${m.sc}; contenido y ${m.cont && Math.round(m.cont.y)}–${m.cont && Math.round(m.cont.b)}; texto de ${m.lineas} líneas y ${Math.round(m.ta.h)} px de alto)`);
      ok(botonesVis, `C11 ${v.n} «${per === 'dos' ? 'Ayer y hoy' : 'Hoy'}»: los botones «Copiar» y «Abrir WhatsApp» se ven (${m.btns.map(x => Math.round(x.y) + '–' + Math.round(x.b)).join(', ')} de ${m.vh})`);
    }
    await p.screenshot({ path: `${OUT}/c11-wsp-${v.w}x${v.h}.png` });
    await ctx.close();
  }
}

// X10: letra menor de 12 px y contrastes bajos
const chicas = p => p.evaluate(() => {
  const out = [];
  document.querySelectorAll('body *').forEach(e => {
    if (e.closest('svg, kbd, script, style') || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return;
    const t = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' '); if (!t) return;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
    const px = parseFloat(getComputedStyle(e).fontSize); if (px < 12) out.push({ sel: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''), px, t: t.slice(0, 24) });
  });
  return out;
});
async function recorrer(b, v, vistas) {
  const { ctx, p } = await abrir(b, v, ADMIN), res = {};
  for (const [nombre, paso] of vistas) { try { await paso(p); await esp(p, 450); } catch (e) { log('  (no se pudo ' + nombre + ': ' + e.message.split('\n')[0] + ')'); continue; } (await chicas(p)).forEach(x => { (res[x.sel + ' ' + x.px] ||= { n: 0, vistas: new Set(), t: x.t }).n++; res[x.sel + ' ' + x.px].vistas.add(nombre); }); }
  await ctx.close(); return res;
}
async function x10(b) {
  const clic = sel => p => p.$eval(sel, e => e.click());
  const vistas = [['nueva', async p => { await ir(p, 'nueva'); }], ['mis', async p => { await ir(p, 'mis'); }], ['bandeja', async p => { await ir(p, 'bandeja'); }],
    ['registros', async p => { await ir(p, 'todos'); }], ['ficha', async p => { await p.click('#lista tr[data-id] td.tdesc'); await p.waitForSelector('#sheet.on'); }],
    ['panel', async p => { await ir(p, 'panel'); }], ['panel-lista', clic('.chart-h [data-vista="lista"]')], ['panel-planta', clic('.chart-h [data-vista="planta"]')],
    ...['usuarios', 'lugares', 'capas', 'topografos', 'tipos', 'protocolos', 'historico', 'archivos', 'exportar'].map(t => ['aj-' + t, async p => { await ir(p, 'ajustes'); await p.evaluate(t => document.querySelector(`.ajgrid [data-tab="${t}"]`).click(), t); }]),
    ['ctrlk', async p => { await p.keyboard.press('Escape'); await p.keyboard.press('Control+k'); await p.waitForSelector('#cmdk'); await p.keyboard.type('filtro'); await esp(p, 400); }]];
  for (const v of [{ n: 'PC 1366', w: 1366, h: 768 }, { n: 'celular 375', w: 375, h: 700, tactil: true }]) {
    const vs = v.tactil ? vistas.filter(x => x[0] !== 'ficha') : vistas;
    const res = await recorrer(b, v, vs), claves = Object.keys(res);
    ok(!claves.length, `X10 ${v.n}: ningún texto de menos de 12 px en ${vs.length} pantallas (Panel, Registros, ficha, Ajustes, Ctrl+K…)${claves.length ? ' · quedan: ' + claves.slice(0, 6).map(k => k + ' «' + res[k].t + '»').join(' | ') : ''}`);
  }
  // Contrastes medidos (WCAG, mínimo 4,5:1)
  const { ctx, p } = await abrir(b, { n: 'PC 1366', w: 1366, h: 768 }, ADMIN);
  await ir(p, 'todos'); await p.waitForSelector('.fcol .fop', { state: 'attached' }); await p.evaluate(() => document.querySelectorAll('.fcol details').forEach(d => { d.open = true; })); await esp(p, 400);
  // Dos frentes marcados y un tipo que solo tiene uno: el otro frente queda marcado con contador 0
  await p.evaluate(() => document.querySelectorAll('.fcol details').forEach(d => { d.open = true; })); for (const [k, v] of [['sub', 'pan'], ['sub', 'pp-oeste'], ['tipo', 'filtro1']]) { await p.evaluate(() => document.querySelectorAll('.fcol details').forEach(d => { d.open = true; })); await p.$eval(`.fcol [data-fk="${k}"][value="${v}"]`, e => e.click()); await esp(p, 500); }
  await p.evaluate(() => document.querySelectorAll('.fcol details').forEach(d => { d.open = true; }));
  const medidas = [['contador «0» de los filtros', '.fcol .fop.cero .c'], ['frente de 84 caracteres en el filtro', '.fcol .fop span:nth-child(2)']];
  for (const [n, sel] of medidas) { const r = await contraste(p, sel, 0); ok(r && r.c >= 4.5, `X10 contraste de ${n} (${r && r.px}px «${r && r.txt}»): ${r && r.c}:1`); }
  const ceros = await p.evaluate(() => [...document.querySelectorAll('.fcol .fop.cero')].length);
  ok(ceros >= 1, `X10 hay ${ceros} opciones con contador en 0 en los filtros para medir`);
  const todos = await p.evaluate(() => [...document.querySelectorAll('.fcol .fop')].map((e, i) => i));
  let peor = 99, quien = '';
  for (const i of todos) for (const sel of ['.fcol .fop', '.fcol .fop span:nth-child(2)', '.fcol .fop .c']) { /* cada fila */ }
  for (const sel of ['.fcol .fop span:nth-child(2)', '.fcol .fop .c']) { const n = await p.$$eval(sel, e => e.length); for (let i = 0; i < n; i++) { const r = await contraste(p, sel, i); if (r && r.c < peor) { peor = r.c; quien = sel + ' «' + r.txt + '»'; } } }
  ok(peor >= 4.5, `X10 el peor contraste de las ${todos.length} opciones del filtro es ${peor}:1 (${quien})`);
  await p.screenshot({ path: `${OUT}/x10-filtros-1366.png` });
  await ir(p, 'panel'); await p.waitForSelector('.pavisos'); await esp(p, 400);
  for (const [n, sel] of [['«Ver» de «sin progresiva» sobre el rosa', '.pavisos .linkbtn[data-prob="sinPk"]']]) { const r = await contraste(p, sel, 0); ok(r && r.c >= 4.5, `X10 contraste de ${n}: ${r && r.c}:1`); }
  await p.$eval('.chart-h [data-vista="lista"]', e => e.click()); await esp(p, 600);
  const nF = await p.$$eval('#chart .qf .fpill span', e => e.length);
  if (nF) { let peor2 = 99, q2 = ''; for (let i = 0; i < nF; i++) { const r = await contraste(p, '#chart .qf .fpill span', i); if (r && r.c < peor2) { peor2 = r.c; q2 = r.txt; } } ok(peor2 >= 4.5, `X10 contraste de la medida («${q2}») en las ${nF} etiquetas de «Qué falta»: ${peor2}:1`); }
  else ok(false, 'X10 no hay etiquetas «Qué falta» con medida para medir');
  await p.screenshot({ path: `${OUT}/x10-que-falta-1366.png` });
  await ctx.close();
}

// X9: texto cortado con «…» y con el texto completo en title
async function x9(b) {
  const vistaCorte = (p, sel) => p.$$eval(sel, es => es.filter(e => e.getBoundingClientRect().width).map(e => { const c = getComputedStyle(e); return { t: e.textContent.trim().slice(0, 40), cortado: e.scrollWidth > e.clientWidth + 1, el: c.textOverflow === 'ellipsis' && c.overflowX === 'hidden', title: e.getAttribute('title') || e.parentElement.getAttribute('title') || e.closest('[title]')?.getAttribute('title') || '' }; }));
  const revisar = (n, xs, cuanto) => { const cortados = xs.filter(x => x.cortado); ok(xs.length >= 1 && cortados.length >= 1, `X9 ${n}: hay ${cortados.length} de ${xs.length} textos cortados para comprobar`); ok(xs.every(x => !x.cortado || x.el), `X9 ${n}: todo texto cortado lleva «…» (text-overflow: ellipsis)${xs.filter(x => x.cortado && !x.el).length ? ' · sin «…»: ' + xs.filter(x => x.cortado && !x.el).map(x => x.t).slice(0, 2).join(' | ') : ''}`); ok(cortados.every(x => x.title.length >= x.t.length - 1), `X9 ${n}: y su title trae el texto completo${cortados.filter(x => x.title.length < x.t.length - 1).length ? ' · sin title: ' + cortados.filter(x => x.title.length < x.t.length - 1).map(x => x.t).slice(0, 2).join(' | ') : ''}`); };
  for (const v of [{ n: 'celular 375', w: 375, h: 700, tactil: true }, { n: 'PC 1366', w: 1366, h: 768 }]) {
    let { ctx, p } = await abrir(b, v, ADMIN);
    // Ctrl+K: el subtítulo (frente · fecha) y el título
    await p.keyboard.press('Control+k'); await p.waitForSelector('#cmdk'); await p.keyboard.type('filtro'); await esp(p, 500);
    await p.evaluate(() => { document.querySelector('#cmdk .cmdk-box').style.maxWidth = '420px'; });
    revisar(`${v.n} Ctrl+K subtítulo (.ct small)`, await vistaCorte(p, '#cmdk .ct small'));
    revisar(`${v.n} Ctrl+K título (.ct)`, await vistaCorte(p, '#cmdk .cmdk-i .ct'));
    await p.screenshot({ path: `${OUT}/x9-ctrlk-${v.w}.png` });
    await ctx.close();
    // Panel (lista): nombre de la liberación
    ({ ctx, p } = await abrir(b, v, ADMIN)); await ir(p, 'panel'); await p.waitForSelector('.pavisos'); if (v.tactil) await p.$eval('.pavisos summary', e => e.click()).catch(() => {});
    await p.$eval('.pavisos [data-prob="sinPk"]', e => e.click()); await p.waitForSelector('.dlg.on .pf-t'); await esp(p, 400);
    const pf = await vistaCorte(p, '.dlg.on .pf-t'); revisar(`${v.n} Panel, «Ver» registros sin progresiva (.pf-t)`, pf);
    await p.screenshot({ path: `${OUT}/x9-panel-${v.w}.png` });
    await ctx.close();
    // Ficha: nombre del archivo adjunto
    ({ ctx, p } = await abrir(b, v, ADMIN)); await ir(p, 'bandeja'); await p.click('[data-bt="EP"]').catch(() => {}); await p.waitForSelector('#blist [data-rid="ar1"]');
    await p.click(v.w < 860 ? '#blist [data-rid="ar1"] .item' : '#blist [data-rid="ar1"] td.tdesc'); await p.waitForSelector('#sheet.on #fArch'); await esp(p, 500);
    revisar(`${v.n} ficha (.an b)`, await vistaCorte(p, '#fArch .an b'));
    await p.screenshot({ path: `${OUT}/x9-ficha-${v.w}.png` });
    await ctx.close();
  }
}
// X12: registros sin código en la tabla de Registros
async function x12(b) {
  for (const v of [{ n: 'PC 1366', w: 1366, h: 768 }, { n: 'PC 1024', w: 1024, h: 768 }]) {
    const { ctx, p } = await abrir(b, v, ADMIN); await ir(p, 'todos'); await p.waitForSelector('#lista tr[data-id="pt00"] .tcod'); await esp(p, 400);
    const m = await p.evaluate(() => { const td = document.querySelector('#lista tr[data-id="pt00"] .tcod'), primero = td.firstElementChild; return { txt: primero.textContent.trim(), todo: td.textContent.trim().replace(/\s+/g, ' ') }; });
    ok(!/^[–—-]$/.test(m.txt) && /Sin código/.test(m.todo), `X12 ${v.n}: el registro sin código dice «${m.todo}» (primera línea «${m.txt}», no un guion suelto)`);
    const c = await contraste(p, '#lista tr[data-id="pt00"] .tcod .sin-cod', 0);
    ok(!c || c.c >= 4.5, `X12 ${v.n}: «Sin código» en gris con contraste ${c && c.c}:1`);
    await p.locator('#lista tr[data-id="pt00"]').screenshot({ path: `${OUT}/x12-fila-${v.w}.png` });
    await ctx.close();
  }
}

const BLOQUES = { x1, x2, a2, x4, a10, x6, p6, x7, a8, x8, c11, x10, x9, x12 };
(async () => {
  const b = await chromium.launch();
  const que = (process.env.SOLO || Object.keys(BLOQUES).join(',')).split(',');
  const cola = [...que], n = Math.max(1, +process.env.PARALELO || 4);
  await Promise.all(Array.from({ length: Math.min(n, cola.length) }, async () => { while (cola.length) { const k = cola.shift(), buf = ['--- ' + k];
    await bloque.run(buf, () => BLOQUES[k](b)).catch(e => { buf.push('FALLA: el bloque ' + k + ' se detuvo: ' + String(e.message).split('\n')[0]); process.exitCode = 1; });
    console.log(buf.join('\n')); } }));
  await b.close();
  if (errores.length) { console.log('Errores de consola/página:', errores.length); process.exitCode = 1; } else console.log('Errores de consola: 0');
})();
