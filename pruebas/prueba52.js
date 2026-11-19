// Versión 1.43.3 · Anchos en celular: controles que no se salen de su caja.
// Fallo de origen (iPhone, Ajustes → Usuarios): el desplegable de la clave de topógrafo toma el ancho de su opción más larga
// («AESEC · Abigail Elva Sofia Egocheaga Canchari»), se sale de la tarjeta y deja toda la página corrida de lado.
// Aquí se prueba con NOMBRES LARGOS DE VERDAD (como los de producción) y se mide: scrollWidth de la página, el borde derecho de cada
// control (select, input, textarea, botón, chip, celda) contra el de su tarjeta y el de la pantalla, y el texto que sobresale.
// Uso:  PUERTO=8787 node pruebas\prueba52.js
//   ANCHOS=320,360,390,430   (por defecto; el barrido completo es BARRIDO=1: 320,360,375,390,414,430,768,1024)
//   ROLES=admin,jefe,gabinete,topografo,operario   (por defecto todos)
//   ANTES=ruta\index.html    (mide una versión anterior para ver qué falla sin el arreglo)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', process.env.ANTES ? 'prueba52-antes' : 'prueba52'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ANCHOS = (process.env.ANCHOS || (process.env.BARRIDO ? '320,360,375,390,414,430,768,1024' : '320,360,390,430')).split(',').map(Number);
const ROLES_T = (process.env.ROLES || 'admin,jefe,gabinete,topografo,operario').split(',');
const SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null;
const errores = [], sinAbrir = new Set();
let nOk = 0, nMal = 0;
const ok = (c, m) => { if (!c) { nMal++; console.log('FALLA:', m); process.exitCode = 1; } else { nOk++; if (process.env.VERBOSO) console.log('ok  -', m); } return !!c; };

// ---- Datos con nombres tan largos como los de producción
const ahora = Date.now(), hora = 36e5, min = 6e4;
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Kluivert Villegas Franco' };
const MAILS = { admin: ADMIN.email, jefe: 'jefe.area.proyecto.tsf3@gmail.com', gabinete: 'gabinete.control.calidad.tsf3@gmail.com', topografo: 'abigailegocheagacanchari@gmail.com', operario: 'operario.maquinaria.pesada@gmail.com' };
const NOMBRES = { admin: 'Brandon Kluivert Villegas Franco', jefe: 'Jefe de Área Proyecto Presa de Relaves', gabinete: 'Gabinete Control de Calidad Topografía', topografo: 'Abigail Elva Sofia Egocheaga Canchari', operario: 'Operario de Maquinaria Pesada Zona Oeste' };
const TOPOS = [['AESEC', 'Abigail Elva Sofia Egocheaga Canchari'], ['LBAC', 'Lenin Brayan Alvarado Carlos'], ['RJVA', 'Raul Jesus Valenzuela Abad'], ['JMPV', 'Juan Manuel Palpa Valencia'], ['CCH', 'Carlos A. Chuquimarca Correa'], ['AB', 'Alexandre Bellido Prado']];
const FRENTES = [['pp-hdpe', 'Instalación de Tuberías HDPE – Paquete 3'], ['pp-corona', 'Acceso a corona geomembrana'], ['pp-oeste', 'Acceso perimetral Oeste']];
const TIPOS = [['pz', 'Ubicación de perforación piezometro casagrande pz3-7'], ['muro', 'Conformacion de muro de contencion línea Sur'], ['plat', 'Plataforma para tubería de relaves línea Sur'], ['geo', 'Superficie para Despliegue de Geomembrana']];
const NOMLIB = n => `0+${n}00_0+${n}40_Conformacion de muro de contencion línea Sur con material seleccionado_SKT-TOP-0270${n}`; // ≈ 85 caracteres
const PROT = ['Protocolo de topografía para conformación de muro de contención línea Sur con material seleccionado', 'Protocolo de control de compactación y densidad de campo por capas en la plataforma de relaves línea Sur', 'Protocolo de entrega de superficie para despliegue de geomembrana y anclaje en zanja perimetral'];
const base = extra => ({ actividad: 'LIB', creadoPor: MAILS.operario, origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'muro', capa: 'Capa 11', topografoId: 'AESEC', numero: '', equipo: 'ET', estado: 'PT', fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, editadoEn: { __ts: ahora - hora }, archivos: [], ...extra });
const eje = (e0, n0, largo, ang) => { const p = []; for (let k = 0; k <= largo; k += 50) p.push(k, +(e0 + k * Math.cos(ang)).toFixed(3), +(n0 + k * Math.sin(ang)).toFixed(3)); return { puntos: p, nombre: 'eje-presa-principal-oeste-linea-sur-completo.csv' }; };
const DB = {
  'listas/tipos': { items: TIPOS.map(([id, nombre], i) => ({ id, nombre, elementoId: 'mt', orden: i + 1, enGrafico: true })) },
  'listas/elementos': { items: [{ id: 'mt', nombre: 'Movimiento de tierras y obras civiles de la presa principal' }] },
  'listas/topografos': { items: TOPOS.map(([id, nombre]) => ({ id, nombre })) },
  'listas/estructuras': { items: [
    { id: 'pp', nombre: 'Presa Principal de Relaves Filtrados Etapa 3', subs: FRENTES.map(([id, nombre]) => ({ id, nombre, pkMin: 0, pkMax: 2700 })) },
    { id: 'pan', nombre: 'Presa Auxiliar Norte', subs: [{ id: 'pan', nombre: 'Presa Auxiliar Norte', pkMin: 0, pkMax: 400 }] }] },
  'listas/protocolos': { items: PROT.map((nombre, i) => ({ id: 'pr' + i, nombre, activo: true, zonas: [] })) },
  'capas/pp-oeste': { tipos: { muro: { capas: [10, 11, 12, 13].map(n => ({ nombre: 'Capa ' + n })), noAplica: [{ capa: 'Capa 11', pkInicio: 600, pkFin: 700, cota: '758.20', nota: 'Zona de roca sin relleno ni compactación, ver plano' }] } } },
  'ejes/pp-oeste': eje(500000, 8300000, 2700, 0.3), 'ejes/pp-hdpe': eje(500300, 8301600, 1200, 0.15), 'ejes/pp-corona': eje(500200, 8299000, 1800, -0.1),
  'solicitudes/abigailegocheagacanchari2@gmail.com': { email: 'abigailegocheagacanchari2@gmail.com', nombre: 'Abigail Elva Sofia Egocheaga Canchari', creadoEn: { __ts: ahora - hora } },
  'solicitudes/protocolos.jjc.topografia.gabinete@gmail.com': { email: 'protocolos.jjc.topografia.gabinete@gmail.com', nombre: 'protocolos Jjc', creadoEn: { __ts: ahora - hora } }
};
for (const k of ['admin', 'jefe', 'gabinete', 'topografo', 'operario']) if (k !== 'admin') DB['usuarios/' + MAILS[k]] = { nombre: NOMBRES[k], rol: k, topografoId: k === 'topografo' ? 'AESEC' : k === 'operario' ? 'LBAC' : '', activo: true };
[['alexandre.bellido.prado.topografia@gmail.com', 'Alexandre Bellido Prado', 'operario', 'AB'], ['lenin.brayan.alvarado.carlos@gmail.com', 'Lenin Brayan Alvarado Carlos', 'topografo', 'LBAC'], ['raul.jesus.valenzuela.abad@gmail.com', 'Raul Jesus Valenzuela Abad', 'topografo', 'RJVA'], ['juan.manuel.palpa.valencia@gmail.com', 'Juan Manuel Palpa Valencia', 'gabinete', ''], ['carlos.chuquimarca.correa@gmail.com', 'Carlos A. Chuquimarca Correa', 'topografo', 'CCH']]
  .forEach(([m, n, r, t]) => { DB['usuarios/' + m] = { nombre: n, rol: r, topografoId: t, activo: true }; });
for (let i = 0; i < 14; i++) DB['liberaciones/pt' + String(i).padStart(2, '0')] = base({ descripcion: 'Pendiente ' + i + ' ' + NOMLIB(i % 9), pkInicio: i * 60, pkFin: i * 60 + 40, tipoId: TIPOS[i % 4][0], subestructuraId: FRENTES[i % 3][0], topografoId: TOPOS[i % 5][0], fechaCampo: { __ts: ahora - (i + 1) * min }, creadoEn: { __ts: ahora - (i + 1) * min } });
for (let i = 1; i <= 3; i++) DB['liberaciones/ep' + i] = base({ estado: 'EP', numero: 'SKT-TOP-0270' + i, descripcion: 'En proceso ' + i, nombreLiberacion: NOMLIB(i), pkInicio: 2400 + i * 50, pkFin: 2420 + i * 50, capa: 'Capa 12', fechaLiberacion: { __ts: ahora - hora }, protocolos: PROT.map((nombre, k) => ({ id: 'pr' + k, nombre, numero: 'SKT-TOP-0270' + (i + k) })) });
DB['liberaciones/ob1'] = base({ estado: 'OB', numero: 'SKT-TOP-02790', descripcion: NOMLIB(5), notaObservacion: 'Falta la foto del tramo y el croquis de ubicación del punto de control topográfico', pkInicio: 2600, pkFin: 2650, capa: 'Capa 12' });
DB['liberaciones/ec1'] = base({ estado: 'EC', numero: 'SKT-TOP-02650', descripcion: NOMLIB(6), pkInicio: 1500, pkFin: 1540, capa: 'Capa 10', fechaLiberacion: { __ts: ahora - hora }, fechaEntrega: { __ts: ahora - min } });
DB['liberaciones/re1'] = base({ estado: 'RE', descripcion: NOMLIB(7), notaRechazo: 'Repetida: ya existe la liberación de este mismo tramo con otro código', pkInicio: 1600, pkFin: 1640, capa: 'Capa 10' });
DB['liberaciones/lv1'] = base({ actividad: 'LEV', estado: 'NA', descripcion: 'Levantamiento topográfico de prueba en el acceso perimetral Oeste de la presa principal', tipoId: '', elementoId: '', pkInicio: 100, pkFin: 200, capa: '' });
DB['liberaciones/as1'] = base({ actividad: 'ASP', estado: 'NA', descripcion: 'Aspas para dron en el acceso a corona de la geomembrana', tipoId: '', elementoId: '', pkInicio: 300, pkFin: 400, capa: '' });
DB['liberaciones/dr1'] = base({ actividad: 'DRN', estado: 'PT', descripcion: 'Vuelo de dron sobre la plataforma para tubería de relaves línea Sur', tipoId: '', elementoId: '', pkInicio: 500, pkFin: 600, capa: '', equipo: 'DRN' });
DB['liberaciones/bo1'] = base({ descripcion: NOMLIB(4), borrado: true, borradoPor: MAILS.operario, borradoNombre: NOMBRES.operario, borradoEn: { __ts: ahora - min }, pkInicio: 900, pkFin: 940 });
DB['liberaciones/ar1'] = base({ estado: 'EP', numero: 'SKT-TOP-02801', descripcion: NOMLIB(8), pkInicio: 1300, pkFin: 1340, capa: 'Capa 13', archivos: [{ nombre: 'Plano de la liberación del muro de contención línea Sur con un nombre larguísimo de archivo para el recorte final.pdf', tipo: 'csv', tam: 2000, url: 'x' }] });

// ---- Medición dentro de la página: devuelve una lista de problemas
const MEDIR = W => {
  const out = [], vistos = new Set();
  const desc = e => { const c = (e.className && e.className.baseVal === undefined ? String(e.className) : '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.'); const t = (e.getAttribute('aria-label') || e.value || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28); return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (c ? '.' + c : '') + (t ? ` «${t}»` : ''); };
  const visible = e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const recorta = (e, hasta) => { for (let a = e; a && a !== hasta && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== 'visible') return true; } return false; };
  const caja = e => e.parentElement && e.parentElement.closest('.card, .dlg-box, #sheet, #ctx, .menu, .abm, .sheet');
  const anota = (tipo, e, px) => { const d = tipo + ' ' + desc(e); if (!vistos.has(d)) { vistos.add(d); out.push({ tipo, d: desc(e), px: Math.round(px) }); } };
  // 1. La página entera
  const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  if (sw > W + 1) out.push({ tipo: 'PÁGINA', d: 'scrollWidth ' + sw + ' > ' + W, px: sw - W });
  // 2. Controles y cajas
  document.querySelectorAll('select, input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, button, .chip, .mini, .btn, a.btn, td, th, .card, .dlg-box, .dlg-c, .who, .st, .tag, .badge, [class*=chip]').forEach(e => {
    if (!visible(e)) return; const r = e.getBoundingClientRect(), c = caja(e);
    if (recorta(e.parentElement, c)) return;               // dentro de algo que se desplaza o recorta a propósito (tablas con scroll, listas)
    const lim = Math.min(W, c ? c.getBoundingClientRect().right : W);
    if (r.right > lim + 1 && r.left < W) anota(c ? 'FUERA DE LA TARJETA' : 'FUERA DE LA PANTALLA', e, r.right - lim);
    else if (r.left < -1 && r.right > 0) anota('CORTADO A LA IZQUIERDA', e, -r.left);
  });
  // 3. Texto que sobresale de su caja (sin recorte ni salto de línea)
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const rg = document.createRange();
  for (let n; (n = walker.nextNode());) {
    if (!n.nodeValue.trim()) continue; const e = n.parentElement; if (!e || /^(SCRIPT|STYLE|OPTION|TEXTAREA|NOSCRIPT)$/.test(e.tagName) || !visible(e)) continue;
    rg.selectNodeContents(n); const t = rg.getBoundingClientRect(); if (!t.width) continue;
    const c = caja(e); if (recorta(e, c)) continue;
    const lim = Math.min(W, c ? c.getBoundingClientRect().right : W), cr = e.getBoundingClientRect();
    if (t.right > lim + 1 && t.left < W) anota('TEXTO FUERA', e, t.right - lim);
    else if (cr.width && t.right > cr.right + 1.5 && getComputedStyle(e).display !== 'inline') anota('TEXTO SOBRESALE DE SU CAJA', e, t.right - cr.right);
  }
  // 4. Recortes: lo que se corta sin puntos suspensivos y sin poder desplazarse, o con puntos pero sin title que diga el texto completo
  document.querySelectorAll('body *').forEach(e => {
    if (/^(INPUT|SELECT|TEXTAREA|OPTION|BODY|HTML|svg|path|g|rect|text|tspan|use|line|circle|polyline|title|defs|pattern|clipPath)$/.test(e.tagName) || !visible(e)) return;
    const cs = getComputedStyle(e); if (!/hidden|clip/.test(cs.overflowX) || e.scrollWidth <= e.clientWidth + 1 || !(e.textContent || '').trim()) return;
    if (cs.textOverflow === 'ellipsis') { if (!e.title && !e.closest('[title]') && !(e.querySelector && e.querySelector('[title]'))) anota('PUNTOS SIN title', e, e.scrollWidth - e.clientWidth); return; }
    anota('RECORTADO SIN PUNTOS', e, e.scrollWidth - e.clientWidth);
  });
  // 5. Cajas con scroll vertical que, sin querer, también se desplazan unos píxeles de lado (esconden el borde del texto)
  document.querySelectorAll('body *').forEach(e => {
    if (/^(INPUT|SELECT|TEXTAREA|BODY|HTML|svg)$/.test(e.tagName) || !visible(e)) return;
    const cs = getComputedStyle(e), d = e.scrollWidth - e.clientWidth;
    if (/auto|scroll/.test(cs.overflowX) && d > 1 && d <= 24 && cs.overflowY !== 'visible') anota('SE DESPLAZA UNOS PX DE LADO', e, d);
  });
  return out;
};

const esperar = (p, fn, arg, ms = 6000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
const rutas = async c => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
  if (process.env.ANTES) await c.route(u => /\/(index\.html)?$/.test(u.pathname), r => r.fulfill({ path: process.env.ANTES, contentType: 'text/html; charset=utf-8' }));
};
async function abrir(b, w, rol) {
  const tactil = w < 600, ctx = await b.newContext({ viewport: { width: w, height: tactil ? 760 : 800 }, hasTouch: tactil, isMobile: tactil, deviceScaleFactor: tactil ? 2 : 1 });
  await rutas(ctx); const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(rol + ' ' + w + ': ' + e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  const u = rol === 'admin' ? ADMIN : { uid: 'u-' + rol, email: MAILS[rol], displayName: NOMBRES[rol] };
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); }, [DB, u]);
  await p.reload(); await p.waitForSelector('#nav button', { timeout: 15000 }); await p.waitForTimeout(900);
  return { ctx, p };
}
const ir = async (p, v) => { const h = await p.evaluate(v => { const b = document.querySelector(`#nav [data-v="${v}"]`) || document.querySelector(`[data-v="${v}"]:not([hidden])`); if (!b) return false; b.click(); return true; }, v); await p.waitForTimeout(450); return h; };
const clic = async (p, sel, espera = 350) => { const e = await p.$(sel); if (!e) return false; await e.evaluate(e => e.click()); await p.waitForTimeout(espera); return true; };
// Cierra lo que haya abierto (diálogos, ficha, menús) sin tocar nada más
const limpiar = async p => { for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(80); } await p.evaluate(() => document.querySelectorAll('.dlg').forEach(d => d.remove())); await p.waitForTimeout(150); };

// Baja por la página para que se pinte lo que se carga al verlo (listas largas) y vuelve arriba
const recorrer = async p => { await p.evaluate(async () => { const sc = document.scrollingElement; for (let y = 0; y < sc.scrollHeight + 600 && y < 12000; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } window.scrollTo(0, 0); }); await p.waitForTimeout(150); };
// ---- Pantallas: cada una recibe la página, la deja en el estado a medir y devuelve false si no pudo llegar
const abrirRegistro = async (p, id) => { const e = await p.evaluate(id => { const x = [...document.querySelectorAll('#view [data-id], #view [data-rid]')].find(e => (e.dataset.id || e.dataset.rid) === id); if (!x) return false; (x.querySelector('.item, td.tdesc') || x).click(); return true; }, id); await p.waitForTimeout(500); return e && !!(await p.$('#sheet.on')); };
const tabAj = async (p, t) => { if (!(await ir(p, 'ajustes'))) return false; const h = await p.evaluate(t => { const b = document.querySelector(`.ajgrid [data-tab="${t}"]`); if (!b) return false; b.click(); return true; }, t); await p.waitForTimeout(600); return h; };
const PANTALLAS = [
  // [nombre, roles que la tienen, función]
  ['Nueva · liberación', ['admin', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'nueva')) return false; await p.waitForSelector('#fLib:not([hidden])'); return true; }],
  ['Nueva · tipo elegido', ['admin', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'nueva')) return false; await p.waitForSelector('#fLib:not([hidden])'); await p.evaluate(() => { const s = document.querySelector('#iSub'); if (s && s.options.length > 1) { s.value = s.options[1].value; s.dispatchEvent(new Event('change', { bubbles: true })); } }); await p.waitForTimeout(300); await clic(p, '#tSel .tsel-chips .chip'); return true; }],
  ['Nueva · selector de tipo', ['admin', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'nueva')) return false; await p.evaluate(() => { const s = document.querySelector('#iSub'); if (s && s.options.length > 1) { s.value = s.options[1].value; s.dispatchEvent(new Event('change', { bubbles: true })); } }); await p.waitForTimeout(300); await clic(p, '#tCambiar'); return true; }],
  ...['LEV', 'ASP', 'DRN'].map(a => [`Nueva · actividad ${a}`, ['admin', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'nueva')) return false; return clic(p, `[data-act="${a}"]`, 500); }]),
  ['Mis registros', ['admin', 'gabinete', 'topografo', 'operario'], async p => ir(p, 'mis')],
  ['Mis registros · ficha', ['admin', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'mis')) return false; return abrirRegistro(p, 'ob1') || abrirRegistro(p, 'pt00'); }],
  ...['PT', 'OB', 'EP', 'ASP', 'LEV'].map(t => [`Bandeja · ${t}`, ['admin', 'gabinete', 'jefe'], async p => { if (!await ir(p, 'bandeja')) return false; return clic(p, `[data-bt="${t}"]`, 500) || true; }]),
  ['Bandeja · con selección', ['admin', 'gabinete'], async p => { if (!await ir(p, 'bandeja')) return false; await clic(p, '[data-bt="PT"]', 400); await clic(p, '#bAll'); return !!(await p.$('.cap-bulk.on')); }],
  ['Bandeja · EP con selección', ['admin', 'gabinete'], async p => { if (!await ir(p, 'bandeja')) return false; await clic(p, '[data-bt="EP"]', 500); await clic(p, '#bAll'); return !!(await p.$('.cap-bulk.on')); }],
  ['Bandeja · ficha', ['admin', 'gabinete'], async p => { if (!await ir(p, 'bandeja')) return false; await clic(p, '[data-bt="PT"]', 400); return abrirRegistro(p, 'pt00'); }],
  ['Registros', ['admin', 'gabinete', 'jefe'], async p => ir(p, 'todos')],
  ['Registros · ficha', ['admin', 'gabinete', 'jefe'], async p => { if (!await ir(p, 'todos')) return false; return abrirRegistro(p, 'ep1'); }],
  ['Registros · hoja de filtros', ['admin', 'gabinete', 'jefe'], async p => { if (!await ir(p, 'todos')) return false; return (await clic(p, '#rFilBtn', 500)) && !!(await p.$('.dlg.on')); }],
  ['Panel', ['admin', 'jefe', 'gabinete', 'topografo', 'operario'], async p => ir(p, 'panel')],
  ...['lista', 'perfil', 'planta', 'modelo'].map(v => [`Panel · ${v}`, ['admin', 'jefe', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'panel')) return false; return clic(p, `.chart-h [data-vista="${v}"]`, 700); }]),
  ['Panel · filtros', ['admin', 'jefe', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'panel')) return false; await clic(p, '.chart-h [data-vista="lista"]', 500); return (await clic(p, '#pFilBtn', 600)) && true; }],
  // ---- Diálogos y menús (cada uno se abre desde su pantalla)
  ...[['Aceptar (con campo de capa)', 'fAceptar'], ['Observar', 'fObservar'], ['Rechazar', 'fRechazar'], ['Borrar', 'fBorrar']].map(([n, id]) => ['Diálogo · ' + n + ' (desde la ficha)', ['admin', 'gabinete'], async p => { if (!await ir(p, 'bandeja')) return false; await clic(p, '[data-bt="PT"]', 400); if (!await abrirRegistro(p, 'pt00')) return false; return (await clic(p, '#' + id, 600)) && !!(await p.$('.dlg.on')); }]),
  ...[['Entregar con XML', 'fEntregar']].map(([n, id]) => ['Diálogo · ' + n + ' (desde la ficha)', ['admin', 'gabinete'], async p => { if (!await ir(p, 'todos')) return false; if (!await abrirRegistro(p, 'ep1')) return false; return (await clic(p, '#' + id, 600)) && !!(await p.$('.dlg.on')); }]),
  ['Diálogo · Cambiar capa (entregado)', ['admin', 'gabinete'], async p => { if (!await ir(p, 'todos')) return false; if (!await abrirRegistro(p, 'ec1')) return false; return (await clic(p, '#fCapa', 600)) && !!(await p.$('.dlg.on')); }],
  ['Diálogo · Reabrir (entregado)', ['admin', 'gabinete'], async p => { if (!await ir(p, 'todos')) return false; if (!await abrirRegistro(p, 'ec1')) return false; return (await clic(p, '#fReabrir', 600)); }],
  ['Edición en la ficha (En proceso)', ['admin'], async p => { if (!await ir(p, 'todos')) return false; if (!await abrirRegistro(p, 'ep1')) return false; return (await clic(p, '#fEditar', 700)); }],
  ['Ficha · carpeta de OneDrive', ['admin'], async p => { if (!await ir(p, 'todos')) return false; if (!await abrirRegistro(p, 'ep1')) return false; return (await clic(p, '#fCarpeta', 700)); }],
  ['Diálogo · Aceptar levantamiento con dron', ['admin', 'gabinete'], async p => { if (!await ir(p, 'todos')) return false; if (!await abrirRegistro(p, 'dr1')) return false; return (await clic(p, '#fAceptar', 600)) && !!(await p.$('.dlg.on')); }],
  ['Diálogo · Editar (operario)', ['operario', 'topografo'], async p => { if (!await ir(p, 'mis')) return false; if (!await abrirRegistro(p, 'pt00')) return false; return (await clic(p, '#fEditar', 600)) || true; }],
  ...['aceptar', 'observar', 'rechazar'].map(k => ['Diálogo · ' + k + ' en grupo', ['admin', 'gabinete'], async p => { if (!await ir(p, 'bandeja')) return false; await clic(p, '[data-bt="PT"]', 400); await clic(p, '#bAll'); return (await clic(p, '[data-bk="' + k + '"]', 600)) && !!(await p.$('.dlg.on')); }]),
  ...['entregar', 'exportar'].map(k => ['Diálogo · ' + k + ' en grupo', ['admin', 'gabinete'], async p => { if (!await ir(p, 'bandeja')) return false; await clic(p, '[data-bt="EP"]', 500); await clic(p, '#bAll'); return (await clic(p, '[data-bk="' + k + '"]', 600)); }]),
  ['Diálogo · Resumen WhatsApp', ['admin', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'mis')) return false; return (await clic(p, '#rWsp', 600)) && !!(await p.$('.dlg.on')); }],
  ['Registros · papelera', ['admin', 'gabinete', 'jefe'], async p => { if (!await ir(p, 'todos')) return false; return clic(p, '[data-pap="1"]', 600); }],
  ['Ctrl+K · buscador', ['admin', 'gabinete', 'jefe', 'topografo', 'operario'], async p => { await p.keyboard.press('Control+k'); await p.waitForTimeout(500); if (!await p.$('#cmdk')) return false; await p.keyboard.type('Conformacion de muro', { delay: 10 }); await p.waitForTimeout(700); return true; }],
  ['Panel · hoja de filtros', ['admin', 'jefe', 'gabinete', 'topografo', 'operario'], async p => { if (!await ir(p, 'panel')) return false; await clic(p, '.chart-h [data-vista="lista"]', 500); return (await clic(p, '#pFilBtn', 600)) && !!(await p.$('.dlg.on')); }],
  ['Ajustes · usuarios · cambiar rol', ['admin'], async p => { if (!await tabAj(p, 'usuarios')) return false; await p.evaluate(() => { const s = document.querySelector('#usr [data-k="rol"]'); s.value = s.value === 'gabinete' ? 'jefe' : 'gabinete'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(600); return !!(await p.$('.dlg.on')); }],
  ['Ajustes · usuarios · desactivar', ['admin'], async p => { if (!await tabAj(p, 'usuarios')) return false; return (await clic(p, '#usr [data-act]', 600)) && !!(await p.$('.dlg.on')); }],
  ['Ajustes · usuarios · aprobar sin clave', ['admin'], async p => { if (!await tabAj(p, 'usuarios')) return false; await p.evaluate(() => { const r = document.querySelector('#sol [data-uid]'); const s = r.querySelector('[data-k="rol"]'); s.value = 'topografo'; s.dispatchEvent(new Event('change', { bubbles: true })); }); return (await clic(p, '#sol [data-ap]', 600)) && !!(await p.$('.dlg.on')); }],
  ['Ajustes · lugares · menú de estructura', ['admin'], async p => { if (!await tabAj(p, 'lugares')) return false; return (await clic(p, '.est [data-k="emas"]', 500)); }],
  ['Ajustes · lugares · menú de frente', ['admin'], async p => { if (!await tabAj(p, 'lugares')) return false; return (await clic(p, '.srow [data-k="smas"]', 500)); }],
  ['Ajustes · lugares · mover frente', ['admin'], async p => { if (!await tabAj(p, 'lugares')) return false; await clic(p, '.srow [data-k="smas"]', 500); const hs = await p.$$('#ctx button, .menu button'); for (const h of hs) { if (/Mover/i.test(await h.textContent())) { await h.evaluate(e => e.click()); await p.waitForTimeout(500); return !!(await p.$('.dlg.on')); } } return false; }],
  ['Ajustes · capas · tipo elegido', ['admin'], async p => { if (!await tabAj(p, 'capas')) return false; await p.selectOption('#cTipo', 'muro').catch(() => {}); await p.waitForTimeout(500); return true; }],
  ['Ajustes · topógrafos · cambiar clave', ['admin'], async p => { if (!await tabAj(p, 'topografos')) return false; return (await clic(p, '[data-k="clave"]', 600)) && !!(await p.$('.dlg.on')); }],
  ['Ajustes · tipos · menú de tipo', ['admin'], async p => { if (!await tabAj(p, 'tipos')) return false; return (await clic(p, '.tyrow [data-k="mas"]', 500)); }],
  ['Ajustes · tipos · menú de elemento', ['admin'], async p => { if (!await tabAj(p, 'tipos')) return false; return (await clic(p, '[data-k="emas"]', 500)); }],
  ['Ajustes · protocolos · zonas', ['admin'], async p => { if (!await tabAj(p, 'protocolos')) return false; return (await clic(p, '[data-k="zonas"]', 500)); }],
  ['Ajustes · histórico · emparejar', ['admin'], async p => { if (!await tabAj(p, 'historico')) return false; await p.setInputFiles('#hFile', path.join(__dirname, 'datos', 'excel-prueba.xlsx')); await p.waitForTimeout(2500); return true; }],
  ...['usuarios', 'lugares', 'capas', 'topografos', 'tipos', 'protocolos', 'historico', 'archivos', 'exportar'].map(t => [`Ajustes · ${t}`, ['admin'], async p => tabAj(p, t)])
];

async function barrer(b, w, rol) {
  const { ctx, p } = await abrir(b, w, rol);
  for (const [nombre, roles, fn] of PANTALLAS) {
    if (!roles.includes(rol) || (SOLO && !SOLO.some(s => nombre.includes(s)))) continue;
    let llego = false; if (process.env.DEPURA) console.log('  >', nombre);
    try { llego = await fn(p); } catch (e) { llego = false; if (process.env.DEPURA) console.log('  (excepción en', nombre + ':', String(e.message).slice(0, 140) + ')'); }
    if (!llego) { sinAbrir.add(`${rol} · ${nombre}`); await limpiar(p); continue; }
    await p.waitForTimeout(250);
    await recorrer(p);
    const prob = await p.evaluate(MEDIR, w);
    const etiqueta = `${nombre} (${rol}, ${w} px)`;
    ok(!prob.length, `${etiqueta}: nada se sale de su caja ni de la pantalla${prob.length ? ' · ' + prob.slice(0, 6).map(x => `${x.tipo} ${x.d} +${x.px}px`).join(' | ') + (prob.length > 6 ? ` | … (${prob.length})` : '') : ''}`);
    if (prob.length && process.env.CAPTURAS) await p.screenshot({ path: `${OUT}/${rol}-${w}-${nombre.replace(/[^a-z0-9]+/gi, '_')}.png` });
    await limpiar(p);
  }
  await ctx.close();
}

// Entrada: sin sesión, y con una cuenta que aún no tiene acceso («acceso solicitado»)
async function entradas(b, w) {
  for (const [nombre, usuario] of [['Entrada (sin sesión)', null], ['Acceso solicitado', { uid: 'x9', email: 'cuenta.nueva.sin.acceso.todavia.proyecto.presa@gmail.com', displayName: 'Cuenta Nueva Sin Acceso Todavía del Proyecto Presa de Relaves' }]]) {
    const tactil = w < 600, ctx = await b.newContext({ viewport: { width: w, height: tactil ? 760 : 800 }, hasTouch: tactil, isMobile: tactil, deviceScaleFactor: tactil ? 2 : 1 });
    await rutas(ctx); const p = await ctx.newPage(); await p.goto(URL);
    await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); if (u) localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [DB, usuario]);
    await p.reload(); await p.waitForTimeout(1800);
    const prob = await p.evaluate(MEDIR, w);
    ok(!prob.length, `${nombre} (${w} px): nada se sale de su caja ni de la pantalla${prob.length ? ' · ' + prob.slice(0, 6).map(x => `${x.tipo} ${x.d} +${x.px}px`).join(' | ') : ''}`);
    await ctx.close();
  }
}

(async () => {
  const b = await chromium.launch();
  if (!SOLO || SOLO.includes('Entrada')) for (const w of ANCHOS) { console.log(`--- entradas · ${w} px`); await entradas(b, w); }
  for (const w of ANCHOS) for (const rol of ROLES_T) { console.log(`--- ${rol} · ${w} px`); await barrer(b, w, rol); }
  await b.close();
  if (sinAbrir.size) console.log('No se pudo llegar a (no cuenta como fallo):', [...sinAbrir].join('; '));
  console.log(`Comprobaciones: ${nOk + nMal} · bien ${nOk} · mal ${nMal}`);
  if (errores.length) { console.log('Errores de consola/página:', errores.length); process.exitCode = 1; } else console.log('Errores de consola: 0');
})();
