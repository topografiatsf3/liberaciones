// Versión 43 · Posición de las cosas que más estorban (revisión v39: X2/G7, G6, X5/G8/C14/P5, X11) y dos pérdidas de lo escrito (E1, E2).
// (a) Marcar una casilla en Bandeja o Registros no mueve la lista y la barra de acciones en grupo queda a la vista sin tapar la última fila
// (b) Con la ficha abierta a 1366 y 1440 se ven el código, el estado, la liberación y la acción de cada fila sin desplazarse de lado
// (c) Lo que se toca mide 44 × 44 en pantallas táctiles y el toque en su centro llega al control (elementFromPoint)
// (d) La cabecera de la ficha (✕, flechas, «Copiar») sigue a la vista al bajar · (e) E1 salir mientras se edita pregunta (también «Atrás»)
// y E2 «Registrar este tramo» y «Duplicar» preguntan antes de reemplazar lo de «Nueva» · (f) la página no se desplaza de lado.
// Todo se mide (getBoundingClientRect, elementFromPoint, scrollWidth); las capturas son para mirar.
// Para ver las mediciones con una versión anterior: ANTES=ruta\index.html node pruebas\prueba47.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', process.env.ANTES ? 'prueba47-antes' : 'prueba47'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const ahora = Date.now(), hora = 36e5, min = 6e4;
const base = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', equipo: 'ET', estado: 'PT', fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, editadoEn: { __ts: ahora - hora }, archivos: [], ...extra });
const DB = { 'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true } };
// 40 por aceptar (una capa con muchos tramos cortos y huecos chicos), 3 en proceso con código, 1 observada, 1 rechazada,
// una sin progresiva (aviso «Ver») y 7 capas de filtro 2 (para «Ver todas»)
for (let i = 0; i < 40; i++) DB['liberaciones/pt' + String(i).padStart(2, '0')] = base({ descripcion: 'Pendiente ' + i + ' relleno filtro uno tramo de prueba', pkInicio: i * 60, pkFin: i * 60 + 40, fechaCampo: { __ts: ahora - (i + 1) * min }, creadoEn: { __ts: ahora - (i + 1) * min } });
const OBS = 'Observaciones largas para que la ficha tenga que desplazarse. '.repeat(40);
for (let i = 1; i <= 3; i++) DB['liberaciones/ep' + i] = base({ estado: 'EP', numero: 'SKT-TOP-0270' + i, descripcion: 'En proceso ' + i, nombreLiberacion: `0+${i}00_0+${i}40_F1_SKT-TOP-0270${i}`, pkInicio: 2400 + i * 50, pkFin: 2420 + i * 50, capa: 'Capa 12', fechaLiberacion: { __ts: ahora - hora }, observaciones: OBS });
DB['liberaciones/ob1'] = base({ estado: 'OB', descripcion: 'Observada uno', notaObservacion: 'Falta foto', pkInicio: 2600, pkFin: 2650, capa: 'Capa 12' });
DB['liberaciones/re1'] = base({ estado: 'RE', descripcion: 'Rechazada del administrador', notaRechazo: 'Repetida', creadoPor: ADMIN.email, pkInicio: 2650, pkFin: 2690, capa: 'Capa 12' });
DB['liberaciones/sp1'] = base({ descripcion: 'Sin progresiva', pkInicio: null, pkFin: null });
for (let c = 1; c <= 7; c++) DB['liberaciones/f2c' + c] = base({ tipoId: 'filtro2', capa: 'Capa ' + c, descripcion: 'Filtro dos capa ' + c, pkInicio: 100 * c, pkFin: 100 * c + 300 });

const esperar = (p, fn, arg, ms = 8000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
const rutas = async c => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
  if (process.env.ANTES) await c.route(u => /\/(index\.html)?$/.test(u.pathname), r => r.fulfill({ path: process.env.ANTES, contentType: 'text/html; charset=utf-8' }));
};
async function abrir(b, v, u) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, hasTouch: !!v.tactil, isMobile: !!v.tactil });
  await rutas(ctx); const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(v.n + ': ' + e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); }, [DB, u]);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(700);
  return { ctx, p };
}
const ir = async (p, v) => { await p.evaluate(v => { const b = document.querySelector(`#nav [data-v="${v}"]`) || document.querySelector(`[data-v="${v}"]`); b.click(); }, v); await p.waitForTimeout(450); };
const lado = p => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
const sinLado = async (p, donde) => { const l = await lado(p); ok(l.sw <= l.iw + 1, `${donde}: la página no se desplaza de lado (scrollWidth ${l.sw}, ancho ${l.iw})`); };
const caja = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; }).catch(() => null);
const topDe = (p, sel) => p.$eval(sel, e => e.getBoundingClientRect().top).catch(() => null);
// Área que de verdad recibe el toque: desde el centro se avanza de a 1 px hacia los 4 lados mientras elementFromPoint
// siga cayendo en el control (el mismo elemento, algo dentro, su etiqueta o una zona con el mismo data-*)
const zona = (p, sel, i = 0, datos = '') => p.evaluate(([sel, i, datos]) => {
  const el = [...document.querySelectorAll(sel)][i]; if (!el) return null;
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const es = (x, y) => {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
    const t = document.elementFromPoint(x, y); if (!t) return false;
    if (t === el || el.contains(t)) return true;
    if (el.tagName === 'INPUT' && (t.closest('label') === el.closest('label') && el.closest('label'))) return true;
    if (datos && t.closest(`[${datos}="${CSS.escape(el.getAttribute(datos))}"]`)) return true;
    return false;
  };
  const paso = (dx, dy) => { let k = 0; while (k < 70 && es(cx + dx * (k + 1), cy + dy * (k + 1))) k++; return k; };
  return { rw: Math.round(r.width), rh: Math.round(r.height), w: paso(-1, 0) + paso(1, 0) + 1, h: paso(0, -1) + paso(0, 1) + 1, centro: es(cx, cy) };
}, [sel, i, datos]);
const toque = (z, nombre, v, soloAlto) => {
  if (!z) { ok(false, `${v.n}: ${nombre} no está en la pantalla`); return; }
  const bien = z.centro && z.h >= 44 && (soloAlto || z.w >= 44);
  ok(bien, `${v.n}: ${nombre} se toca en ${z.w}×${z.h} px (dibujo ${z.rw}×${z.rh})${z.centro ? '' : ' · el toque en su centro NO llega'}${soloAlto ? ' · ancho limitado por sus vecinos' : ''}`);
};

// (a) Marcar no mueve la fila y la barra queda a la vista, sin tapar la última fila
async function marcar(p, v, cual) {
  const fila = cual === 'b' ? '#blist [data-rid]' : '#lista tr[data-id]', casilla = cual === 'b' ? '[data-sel]' : '[data-ck]', barra = cual === 'b' ? '#bBulk' : '#rBulk', limpiar = cual === 'b' ? '[data-bk="limpiar"]' : '[data-rk="limpiar"]';
  const nom = cual === 'b' ? 'Bandeja' : 'Registros';
  const ids = await p.$$eval(fila, f => f.map(x => x.dataset.rid || x.dataset.id));
  const medir = async (idx, donde) => {
    const sel = `${fila.split(' ')[0]} [data-${cual === 'b' ? 'rid' : 'id'}="${ids[idx]}"]`;
    await p.$eval(sel, (e, d) => { if (d === 'arriba') scrollTo(0, 0); else { e.scrollIntoView({ block: 'end' }); scrollBy(0, Math.min(140, innerHeight / 4)); } }, donde); await p.waitForTimeout(250);
    const y0 = await topDe(p, sel);
    await p.click(`${sel} ${casilla}`); await p.waitForTimeout(350);
    const y1 = await topDe(p, sel), bk = await caja(p, barra), nav = v.w < 860 ? await caja(p, '#nav') : null;
    const dentro = bk && bk.h > 0 && bk.y >= 0 && bk.b <= innerH(v) + 0.5 && bk.x >= 0 && bk.r <= v.w + 0.5 && (!nav || bk.b <= nav.y + 0.5);
    ok(Math.abs(y1 - y0) <= 2, `${v.n} ${nom}: al marcar la fila ${idx + 1} (${donde}) no se mueve (${Math.round(y0)} → ${Math.round(y1)} px, salto ${Math.round(y1 - y0)})`);
    ok(dentro, `${v.n} ${nom}: la barra en grupo queda dentro de la pantalla${nav ? ' y sobre el menú de abajo' : ''} (${bk ? `arriba ${Math.round(bk.y)}, abajo ${Math.round(bk.b)} de ${innerH(v)}${nav ? `, menú en ${Math.round(nav.y)}` : ''}` : 'no está'})`);
    return bk;
  };
  await medir(0, 'arriba');
  await p.click(`${barra} ${limpiar}`); await p.waitForTimeout(350);
  const n = Math.min(ids.length - 1, 24);
  const bk = await medir(n, 'abajo');
  // El aviso (toast) va sobre la barra
  const ts = await p.evaluate(() => { const t = document.getElementById('toast'), r = t.getBoundingClientRect(); return r.bottom - 12; });
  ok(!bk || ts <= bk.y + 1, `${v.n} ${nom}: el aviso sale por encima de la barra (aviso termina en ${Math.round(ts)}, barra empieza en ${bk ? Math.round(bk.y) : '?'})`);
  await p.screenshot({ path: path.join(OUT, `a-${v.n}-${nom.toLowerCase()}-marcada.png`) });
  // Al final de la lista la barra no tapa el centro de ningún botón de la última fila
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(300);
  const ult = await p.evaluate(([fila, barra]) => {
    const fs = document.querySelectorAll(fila), f = fs[fs.length - 1], bk = document.querySelector(barra).getBoundingClientRect();
    return [...f.querySelectorAll('button,input,label.ck,td.ck')].filter(x => x.getBoundingClientRect().width).map(x => { const r = x.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, t = document.elementFromPoint(cx, cy);
      return { q: x.dataset.a || x.dataset.mas && 'mas' || x.tagName.toLowerCase(), cy: Math.round(cy), tapa: cx >= bk.left && cx <= bk.right && cy >= bk.top && cy <= bk.bottom, llega: !!t && (t === x || x.contains(t) || f.contains(t)) }; });
  }, [fila, barra]);
  ok(ult.length && ult.every(x => !x.tapa && x.llega), `${v.n} ${nom}: al final, la barra no tapa la última fila (${ult.map(x => `${x.q}@${x.cy}${x.tapa ? ' TAPADO' : ''}${x.llega ? '' : ' sin toque'}`).join(', ')})`);
  await p.screenshot({ path: path.join(OUT, `a-${v.n}-${nom.toLowerCase()}-final.png`) });
  const bw = await p.$eval(barra, e => ({ sw: e.scrollWidth, cw: e.clientWidth }));
  await sinLado(p, `${v.n} ${nom} con la barra (la barra mide ${bw.cw} px y sus botones ${bw.sw})`);
  await p.click(`${barra} ${limpiar}`).catch(() => {}); await p.waitForTimeout(300);
}
const innerH = v => v.h;

const TAM = [
  { n: '360', w: 360, h: 640, tactil: true }, { n: '375', w: 375, h: 812, tactil: true }, { n: '768', w: 768, h: 1024, tactil: true },
  { n: '1024t', w: 1024, h: 768, tactil: true }, { n: '1366', w: 1366, h: 768 }, { n: '1440', w: 1440, h: 900 }, { n: '1920', w: 1920, h: 1080 },
];
let b;
(async () => {
  b = await chromium.launch();
  const SOLO = (process.env.SOLO || '').split(',').filter(Boolean); // para correr solo algunos tamaños mientras se trabaja
  for (const v of TAM.filter(v => !SOLO.length || SOLO.includes(v.n))) {
    console.log(`--- ${v.n} (${v.w}×${v.h}${v.tactil ? ', táctil' : ''})`);
    const { ctx, p } = await abrir(b, v, ADMIN);
    // ===== Bandeja =====
    await ir(p, 'bandeja'); await p.click('[data-bt="PT"]').catch(() => {}); await p.waitForSelector('#blist [data-rid]');
    if (v.tactil) {
      toque(await zona(p, '.bsel-todo, #bAll2'), '«Seleccionar todo» (#bAll2)', v);
      if (v.w < 860) toque(await zona(p, '#blist .brow > label.ck', 0), 'casilla de la tarjeta', v);
      else { toque(await zona(p, '#blist td.ck', 0), 'casilla de la tabla (celda)', v); toque(await zona(p, '#blist .hcb', 0), 'cabecera de columna (.hcb)', v); }
    }
    await marcar(p, v, 'b');
    if (v.tactil) { await p.click('#blist [data-sel] >> nth=0'); await p.waitForTimeout(300); toque(await zona(p, '#bBulk label.ck'), 'casilla «Seleccionar todo» de la barra (#bAll)', v); await p.click('#bBulk [data-bk="limpiar"]'); await p.waitForTimeout(300); }
    await sinLado(p, `${v.n} Bandeja`);
    // ===== Registros (la barra en grupo existe con la tabla, desde 860 px) =====
    if (v.w >= 860) {
      await ir(p, 'todos'); await p.waitForSelector('#lista tr[data-id]');
      if (v.tactil) { toque(await zona(p, '#lista td.ck', 0), 'casilla de la tabla de Registros (celda)', v); toque(await zona(p, '#lista thead th.ck'), 'casilla «Seleccionar todos» de Registros (celda)', v); }
      await marcar(p, v, 'r');
      await sinLado(p, `${v.n} Registros`);
    }
    // ===== (b) ficha abierta: la acción de cada fila se ve sin desplazarse de lado =====
    if (v.w >= 1320) {
      for (const [vista, fila, acc, desc] of [['bandeja', '#blist tr[data-rid]', '[data-a]', 'Bandeja'], ['todos', '#lista tr[data-id]', '[data-mas]', 'Registros']]) {
        await ir(p, vista); if (vista === 'bandeja') await p.click('[data-bt="EP"]'); await p.waitForSelector(fila);
        await p.evaluate(() => scrollTo(0, 0));
        await p.click(`${fila} >> nth=0 >> td.tdesc`); await p.waitForSelector('#sheet.on'); await p.waitForTimeout(500);
        const m = await p.evaluate(([fila, acc]) => {
          const tw = document.querySelector('.twrap'), r = tw.getBoundingClientRect(), fcol = document.querySelector('.fcol');
          const filas = [...document.querySelectorAll(fila)].filter(f => { const q = f.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight; });
          const fuera = filas.filter(f => { const a = f.querySelector(acc).getBoundingClientRect(), c = f.querySelector('td.tcod,td.mono'), cr = c && c.getBoundingClientRect(), d = f.querySelector('td.tdesc').getBoundingClientRect();
            return a.right > r.right + 1 || a.left < r.left - 1 || (cr && cr.right > r.right + 1) || d.width < 90; });
          const st = filas[0]?.querySelector('.st')?.getBoundingClientRect();
          return { ancho: Math.round(r.width), sw: tw.scrollWidth, cw: tw.clientWidth, n: filas.length, fuera: fuera.length, desc: Math.round(filas[0]?.querySelector('td.tdesc').getBoundingClientRect().width || 0), estado: !!st && st.right <= r.right + 1 && st.width > 0, fcol: !!fcol && getComputedStyle(fcol).display !== 'none' };
        }, [fila, acc]);
        if (v.w < 1800) {
          ok(m.n > 0 && m.fuera === 0 && m.sw <= m.cw + 1, `${v.n} ${desc} con la ficha abierta: tabla de ${m.ancho} px sin desplazarse de lado (scrollWidth ${m.sw} / ${m.cw}); acción, código y liberación (${m.desc} px) a la vista en las ${m.n} filas visibles${m.fuera ? ` · ${m.fuera} con algo fuera` : ''}`);
          if (vista === 'todos') ok(m.estado, `${v.n} Registros con la ficha abierta: el estado se ve`);
        } else ok(m.fcol && m.sw <= m.cw + 1 && m.fuera === 0, `${v.n} ${desc} con la ficha abierta sigue como antes: columna de filtros a la vista, tabla de ${m.ancho} px sin desplazarse`);
        await p.screenshot({ path: path.join(OUT, `b-${v.n}-${desc.toLowerCase()}-ficha.png`) });
        await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      }
    }
    // ===== (d) cabecera de la ficha pegajosa (ficha larga: observaciones extensas) =====
    if (['375', '1366', '1024t'].includes(v.n)) {
      await ir(p, 'bandeja'); await p.click('[data-bt="EP"]'); await p.waitForSelector('#blist [data-rid="ep1"]');
      await p.click(v.w < 860 ? '#blist [data-rid="ep1"] .item' : '#blist [data-rid="ep1"] td.tdesc'); await p.waitForSelector('#sheet.on #fCopiar'); await p.waitForTimeout(500);
      if (v.tactil) toque(await zona(p, '#fCopiar'), '«Copiar» de la ficha', v);
      const d = await p.evaluate(() => {
        const sh = document.getElementById('sheet'); sh.scrollTop = sh.scrollHeight;
        return new Promise(ok => setTimeout(() => { const s = sh.getBoundingClientRect(), vis = el => { if (!el) return 'falta'; const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return r.top >= s.top - 1 && r.bottom <= s.bottom && !!t && (t === el || el.contains(t)) ? 'sí' : `no (arriba ${Math.round(r.top)}, ficha desde ${Math.round(s.top)})`; };
          ok({ baja: Math.round(sh.scrollTop), x: vis(document.getElementById('fX')), sig: vis(document.querySelector('#sheet [data-fnav="1"]')), copiar: vis(document.getElementById('fCopiar')) }); }, 250));
      });
      ok(d.baja > 200 && d.x === 'sí' && d.sig === 'sí' && d.copiar === 'sí', `${v.n}: con la ficha bajada ${d.baja} px siguen a la vista y se tocan la ✕ (${d.x}), «siguiente» (${d.sig}) y «Copiar» (${d.copiar})`);
      await p.screenshot({ path: path.join(OUT, `d-${v.n}-ficha-al-fondo.png`) });
      await p.click('#fX'); await p.waitForTimeout(400);
    }
    // ===== (c) Toast «Deshacer» (táctil): devolver una observada a pendientes =====
    if (v.tactil) {
      await ir(p, 'bandeja'); await p.click('[data-bt="OB"]'); await p.waitForSelector('#blist [data-rid="ob1"]');
      if (v.w < 860) await p.click('#blist [data-rid="ob1"] [data-a="reabrir"]');
      else { await p.click('#blist [data-rid="ob1"] [data-mas]'); await p.click('#ctx .ctx-i:has-text("Devolver a pendientes")'); }
      await p.waitForSelector('#toast.on .toast-btn', { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(250);
      if (process.env.DEPURAR) console.log(await p.evaluate(() => { const r = document.querySelector('#toast .toast-btn').getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return [r.left, r.top, t && t.outerHTML.slice(0, 120)]; }));
      toque(await zona(p, '#toast .toast-btn'), '«Deshacer» del aviso', v);
      await p.click('#toast .toast-btn').catch(() => {}); await p.waitForTimeout(600);
    }
    // ===== Nueva: «No aplica progresiva» =====
    if (v.tactil) { await ir(p, 'nueva'); await p.waitForSelector('#iSinPk'); toque(await zona(p, '#iSinPk'), '«No aplica progresiva»', v); await sinLado(p, `${v.n} Nueva`); }
    // ===== Panel =====
    await ir(p, 'panel'); await p.click('[data-vista="perfil"]').catch(() => {}); await p.waitForSelector('#chart .ojo'); await p.waitForTimeout(500);
    if (v.tactil) {
      const movil = await p.$eval('#chart', c => c.clientWidth < 560);
      if (movil) {
        toque(await zona(p, '#chart .ojo', 0), 'ojo de la capa en el Perfil', v);
        const iSeg = await p.$$eval('#chart rect.seg', r => { let k = 0; r.forEach((x, i) => { if (x.getBoundingClientRect().width < r[k].getBoundingClientRect().width) k = i; }); return k; });
        const iHue = await p.$$eval('#chart rect.hueco', r => { let k = 0; r.forEach((x, i) => { if (x.getBoundingClientRect().width < r[k].getBoundingClientRect().width) k = i; }); return k; });
        toque(await zona(p, '#chart rect.seg', iSeg, 'data-id'), 'tramo más angosto del Perfil', v, true);
        toque(await zona(p, '#chart rect.hueco', iHue, 'data-gap'), 'hueco más angosto del Perfil', v, true);
        // Las zonas de toque de una misma fila no se pisan
        const pisan = await p.$$eval('#chart rect.toq', z => { const f = {}; z.forEach(r => { const y = r.getAttribute('y'); (f[y] ||= []).push([+r.getAttribute('x'), +r.getAttribute('x') + +r.getAttribute('width')]); });
          let n = 0; Object.values(f).forEach(a => { a.sort((p, q) => p[0] - q[0]); for (let i = 1; i < a.length; i++) if (a[i][0] < a[i - 1][1] - 0.6) n++; }); return { n, total: z.length }; });
        ok(pisan.total > 0 && pisan.n === 0, `${v.n}: las ${pisan.total} zonas de toque del Perfil no se pisan entre vecinas (${pisan.n} se pisan)`);
        const ojoVsTramo = await p.evaluate(() => { const o = document.querySelector('#chart .ojo rect').getBoundingClientRect(), z = [...document.querySelectorAll('#chart rect.toq')].map(r => r.getBoundingClientRect()); return z.some(r => r.left < o.right - 0.5 && r.right > o.left + 0.5 && r.top < o.bottom - 0.5 && r.bottom > o.top + 0.5); });
        ok(!ojoVsTramo, `${v.n}: la zona del ojo no se pisa con las de los tramos`);
        const pista = await p.$eval('#chart rect.pista', r => Math.round(r.getBoundingClientRect().width));
        console.log(`    (la franja del Perfil mide ${pista} px)`);
        await p.screenshot({ path: path.join(OUT, `c-${v.n}-perfil.png`) });
        // Un toque en un tramo angosto abre su ficha
        const id = await p.$$eval('#chart rect.seg', (r, i) => r[i].dataset.id, iSeg);
        const pt = await p.$$eval('#chart rect.seg', (r, i) => { const q = r[i].getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 + 15 }; }, iSeg);
        await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(500);
        ok(await p.$eval('#fTit', () => true).catch(() => false) && await p.evaluate(() => !document.getElementById('sheet').hidden), `${v.n}: tocar 15 px debajo de un tramo de ${await p.$$eval('#chart rect.seg', (r, i) => Math.round(r[i].getBoundingClientRect().width), iSeg)} px abre su ficha (${id})`);
        if (await p.$('#ctx')) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
        await p.click('#fX', { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(400);
        if (await p.$('#pVerTodas')) toque(await zona(p, '#pVerTodas'), '«Ver todas»', v);
      }
      if (await p.$('#pAvisos details.pav-d')) { await p.click('#pAvisos summary'); await p.waitForTimeout(200); }
      if (await p.$('.pavisos .linkbtn')) toque(await zona(p, '.pavisos .linkbtn', 0), '«Ver» del recuadro de avisos', v);
      if (await p.$('#ftAgr')) toque(await zona(p, '#ftAgr'), '«Agrupar por capa» (#ftAgr)', v);
      if (await p.$('#pFilBtn')) {
        await p.click('#pFilBtn'); await p.waitForSelector('.dlg.on'); await p.waitForTimeout(300);
        if (await p.$('.dlg.on .cgrp-h .cgrp-t')) toque(await zona(p, '.dlg.on .cgrp-h .cgrp-t', 0), 'plegar/mostrar capa en el diálogo de filtros', v);
        await p.screenshot({ path: path.join(OUT, `c-${v.n}-filtros.png`) });
        await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      }
    }
    await sinLado(p, `${v.n} Panel`);
    await ctx.close();
  }

  if (!SOLO.length || SOLO.includes('E')) {
  // ===== (e) E1: salir mientras se edita un registro con cambios pregunta (también con «Atrás») =====
  {
    const v = { n: 'E1 375', w: 375, h: 812, tactil: true };
    const { ctx, p } = await abrir(b, v, ADMIN);
    await p.evaluate(u => { window.__fakeLogin = u; }, OPER); await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, OPER); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(600);
    await ir(p, 'mis'); await p.waitForSelector('#lista [data-id="pt05"]');
    await p.click('#lista [data-id="pt05"]'); await p.waitForSelector('#fEditar'); await p.click('#fEditar'); await p.waitForSelector('#iDesc');
    await p.fill('#iDesc', 'Cambio sin guardar E1');
    await ir(p, 'mis'); await p.waitForTimeout(300);
    const dlg = await p.$eval('.dlg.on', d => d.textContent).catch(() => '');
    ok(/Estás editando/.test(dlg) && /salir a «Mis registros»/.test(dlg), 'E1: ir a «Mis registros» con cambios pregunta: «' + dlg.replace(/\s+/g, ' ').slice(0, 140) + '»');
    await p.screenshot({ path: path.join(OUT, 'e1-pregunta.png') });
    await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(400);
    ok(await p.inputValue('#iDesc').catch(() => '') === 'Cambio sin guardar E1', 'E1: «Seguir editando» deja el formulario con lo escrito');
    await p.goBack(); await p.waitForTimeout(600);
    const dlg2 = await p.$eval('.dlg.on', d => d.textContent).catch(() => '');
    ok(/Estás editando/.test(dlg2), 'E1: el botón «Atrás» del teléfono también pregunta');
    ok(await p.$('#iDesc') && await p.inputValue('#iDesc') === 'Cambio sin guardar E1' && await p.evaluate(() => location.hash) === '#nueva', 'E1: mientras pregunta, el formulario y la dirección siguen en «Nueva»');
    await p.goBack(); await p.waitForTimeout(500);
    ok(!(await p.$('.dlg.on')) && await p.inputValue('#iDesc').catch(() => '') === 'Cambio sin guardar E1', 'E1: «Atrás» con la pregunta abierta la cierra y se sigue editando');
    await ir(p, 'panel'); await p.waitForSelector('.dlg.on [data-descartar]');
    await p.click('.dlg.on [data-descartar]'); await p.waitForTimeout(700);
    const tras = await p.evaluate(() => ({ h: location.hash, d: Object.entries(window.__fakeStore()).find(([k]) => k === 'liberaciones/pt05')[1].descripcion }));
    ok(tras.h === '#panel' && /Pendiente 5 /.test(tras.d) && await p.$('#chart'), `E1: «Descartar» va al Panel y el registro queda como estaba («${tras.d.slice(0, 30)}…»)`);
    // Sin cambios sale sin preguntar
    await ir(p, 'mis'); await p.click('#lista [data-id="pt06"]'); await p.waitForSelector('#fEditar'); await p.click('#fEditar'); await p.waitForSelector('#iDesc');
    await ir(p, 'panel'); await p.waitForTimeout(400);
    ok(!(await p.$('.dlg.on')) && await p.evaluate(() => location.hash) === '#panel', 'E1: sin cambios sale sin preguntar');
    await ctx.close();
  }
  // ===== (e) E2: «Registrar este tramo» y «Duplicar» preguntan antes de reemplazar lo de «Nueva» =====
  {
    const v = { n: 'E2 1366', w: 1366, h: 900 };
    const { ctx, p } = await abrir(b, v, ADMIN);
    await ir(p, 'nueva'); await p.waitForSelector('#iDesc');
    await p.fill('#iCota', '771.50'); await p.fill('#iDesc', 'Liberación a medio llenar E2');
    await p.setInputFiles('#fLib input[type=file][accept*="image"]', { name: 'foto-e2.png', mimeType: 'image/png', buffer: fs.readFileSync(path.join(__dirname, 'datos', 'foto-prueba.png')) }).catch(() => {});
    await p.waitForTimeout(900);
    const nArch = await p.$$eval('#fLib .arch', a => a.length);
    await ir(p, 'panel'); await p.click('[data-vista="perfil"]').catch(() => {}); await p.waitForSelector('#chart rect.hueco');
    // Administrador: el hueco abre un menú con «Registrar liberación aquí» (irNuevaCon, igual que «Registrar este tramo» de campo)
    const tramo = async () => { await p.$eval('#chart rect.hueco', h => h.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 600, clientY: 300 }))); await p.waitForSelector('#ctx .ctx-i'); await p.click('#ctx .ctx-i:has-text("Registrar liberación aquí")'); await p.waitForTimeout(500); };
    await tramo();
    const t2 = await p.$eval('.dlg.on', d => d.textContent).catch(() => '');
    ok(/Tienes una liberación a medio llenar/.test(t2) && /Conservarla/.test(t2) && /Reemplazarla/.test(t2), `E2: «Registrar este tramo» con algo escrito (${nArch} adjunto) pregunta: «${t2.replace(/\s+/g, ' ').slice(0, 120)}»`);
    await p.screenshot({ path: path.join(OUT, 'e2-pregunta.png') });
    await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => location.hash) === '#panel', 'E2: «Conservarla» deja todo como estaba (sigue en el Panel)');
    await ir(p, 'nueva'); await p.waitForTimeout(600);
    ok(await p.inputValue('#iDesc') === 'Liberación a medio llenar E2' && await p.inputValue('#iCota') === '771.50' && await p.$$eval('#fLib .arch', a => a.length) === nArch, `E2: en «Nueva» sigue lo escrito y ${nArch} adjunto`);
    await ir(p, 'panel'); await p.click('[data-vista="perfil"]').catch(() => {}); await p.waitForSelector('#chart rect.hueco');
    await tramo(); await p.waitForSelector('.dlg.on [data-reemplazar]'); await p.click('.dlg.on [data-reemplazar]'); await p.waitForTimeout(700);
    const pk = await p.inputValue('#iPk1').catch(() => '');
    ok(await p.evaluate(() => location.hash) === '#nueva' && pk && await p.inputValue('#iDesc') !== 'Liberación a medio llenar E2' && await p.$$eval('#fLib .arch', a => a.length) === 0, `E2: «Reemplazarla» abre «Nueva» con el tramo (PK ${pk}) y sin lo anterior`);
    // Duplicar un rechazado: «Nueva» ya tiene el tramo cargado (PK), así que pregunta
    await ir(p, 'todos'); await p.waitForSelector('#lista tr[data-id="re1"]'); await p.click('#lista tr[data-id="re1"] td.tdesc'); await p.waitForSelector('#fDuplicar');
    await p.click('#fDuplicar'); await p.waitForTimeout(400);
    ok(/Tienes una liberación a medio llenar/.test(await p.$eval('.dlg.on', d => d.textContent).catch(() => '')), 'E2: «Duplicar como nuevo» también pregunta');
    await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => location.hash) !== '#nueva', 'E2: «Conservarla» no abre el duplicado');
    await p.click('#fDuplicar').catch(async () => { await p.click('#lista tr[data-id="re1"] td.tdesc'); await p.waitForSelector('#fDuplicar'); await p.click('#fDuplicar'); });
    await p.waitForSelector('.dlg.on [data-reemplazar]'); await p.click('.dlg.on [data-reemplazar]'); await p.waitForTimeout(700);
    ok(await p.inputValue('#iDesc').catch(() => '') === 'Rechazada del administrador', 'E2: «Reemplazarla» abre el duplicado del rechazado');
    // Sin nada escrito no pregunta
    await p.click('#bLimpiar').catch(() => {}); await p.waitForTimeout(300); if (await p.$('.dlg.on [type=submit]')) { await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(300); }
    await ir(p, 'panel'); await p.click('[data-vista="perfil"]').catch(() => {}); await p.waitForSelector('#chart rect.hueco'); await tramo();
    ok(!(await p.$('.dlg.on')) && await p.evaluate(() => location.hash) === '#nueva', 'E2: con «Nueva» vacía, «Registrar este tramo» no pregunta');
    await ctx.close();
  }

  }
  ok(errores.length === 0, 'sin errores de página' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
})().catch(async e => { console.log('FALLA: error en la prueba:', e.message); process.exitCode = 1; if (b) await b.close(); });
