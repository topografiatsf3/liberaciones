// Lote H: cabos sueltos de consistencia y D1 pasos 1–2 (la app de campo manda «u» en el resumen).
// (1) Capas con dos sesiones: guardar relee el frente (transacción) y conserva lo que otra sesión cambió; dos guardados seguidos no se pisan
// (2) Lugares: un frente que otra sesión agregó dentro de una estructura no se pierde al guardar
// (3) unirElemento: un tipo que campo agregó a mitad bajo el elemento que se une pasa al elemento de destino (y vuelve con «Deshacer»)
// (4) Edición sin señal que Firebase rechaza con la app cerrada: al volver se ofrece reabrirla con lo escrito o descartarla
// (5) El aviso «versión nueva» que llega antes de que la app escuche no se pierde
// (6) R10: aviso de tamaño del resumen (jefe y administrador, una vez por frente) y la parte más grande en Ajustes → Histórico
// (7) Campo escribe «u» en el resumen; gabinete no; «u» no aparece como registro en el Panel ni en el buscador
// Uso: PUERTO=8790 node pruebas/prueba59.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), { execSync } = require('child_process');
const { tipo, equipo } = require('./filtros');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Jefe Prueba' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); return !!c; };
// index.html con una ventana a lo de adentro (solo para la prueba)
const conT = H => { const i = H.indexOf('<script type="module">'), j = H.indexOf('</script>', i);
  return H.slice(0, j) + '\nwindow.__T = { S, get BUS() { return BUS; }, guardarNoAplica, TAM_RES: typeof TAM_RES === "undefined" ? null : TAM_RES };\n' + H.slice(j); };
const NUEVO = conT(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'));
// El aviso del service worker llega ANTES de que cargue el módulo (una sola vez por pestaña)
const conAvisoTemprano = H => H.replace('<script type="module">', `<script>if (localStorage.__vnMandar === '1') { localStorage.removeItem('__vnMandar'); localStorage.__vnMandado = '1';
  if (navigator.serviceWorker) navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { tipo: 'version-nueva' } })); else document.dispatchEvent(new Event('version-nueva')); }</script>\n<script type="module">`);
const ahora = Date.now(), dia = 864e5;
const reg = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', creadoNombre: 'Pedro Operario', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 1', topografoId: 'GN', numero: '', equipo: 'GNSS', estado: 'PT', descripcion: 'Registro', observaciones: '', pkInicio: 100, pkFin: 140, fechaCampo: { __ts: ahora - 3 * dia }, creadoEn: { __ts: ahora - 3 * dia }, editadoEn: { __ts: ahora - 3 * dia }, archivos: [], linksCsv: [], linksFotos: [], ...extra });
const DB = () => ({
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'usuarios/jefe@gmail.com': { nombre: 'Jefe Prueba', rol: 'jefe', topografoId: '', activo: true },
  'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', topografoId: '', activo: true },
  'config/general': { obra: 'Prueba', prefijo: 'SKT-TOP-', digitos: 5, zona: 'America/Lima', resumenV: 2 },
  'contadores/skt': { ultimo: 100 },
  'listas/tipos': { items: [['filtro1', 'Relleno filtro 1', 'mt'], ['filtro2', 'Relleno filtro 2', 'mt'], ['masivo', 'Relleno masivo', 'mt'], ['geotex', 'Geotextil', 'geo']].map(([id, nombre, e], i) => ({ id, nombre, elementoId: e, orden: i + 1, enGrafico: true })) },
  'listas/elementos': { items: [{ id: 'mt', nombre: 'Movimiento de tierras' }, { id: 'geo', nombre: 'Geosintéticos' }] },
  'listas/topografos': { items: [{ id: 'GN', nombre: 'Gabriel Nuñez' }] },
  'listas/estructuras': { items: [{ id: 'pp', nombre: 'Presa Principal', subs: [{ id: 'pp-oeste', nombre: 'Presa Principal Oeste', pkMin: 0, pkMax: 2700 }, { id: 'pp-este', nombre: 'Presa Principal Este', pkMin: 0, pkMax: 1200 }] }] },
  'capas/pp-oeste': { tipos: { filtro1: { capas: [{ nombre: 'Capa 1', cota: '' }, { nombre: 'Capa 2', cota: '' }], noAplica: [] } } }
});
const rutas = async (c, H) => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
  await c.route(u => u.pathname === '/' || u.pathname === '/index.html', r => r.fulfill({ body: H, contentType: 'text/html; charset=utf-8' }));
};
async function abrir(b, u, db, o = {}) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, serviceWorkers: 'block' }); await rutas(ctx, o.H || NUEVO);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_INTERNET|fonts|net::|Failed to load resource|Fallo simulado|insufficient permissions/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.addInitScript(() => { window.__avisos = []; const ver = () => { const t = document.getElementById('toast'); if (t && t.textContent && window.__avisos[window.__avisos.length - 1] !== t.textContent) window.__avisos.push(t.textContent); };
    new MutationObserver(ver).observe(document, { subtree: true, childList: true, characterData: true }); });
  await p.goto(URL);
  await p.evaluate(([d, u, x]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); for (const k in x) localStorage.setItem(k, JSON.stringify(x[k])); }, [db, u, o.ls || {}]);
  await p.goto(URL); await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(700);
  return { ctx, p };
}
const ir = async (p, v) => { await p.evaluate(v => document.querySelector(`#nav [data-v="${v}"]`).click(), v); await p.waitForTimeout(400); };
const pestana = async (p, t) => { await ir(p, 'ajustes'); await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(350); };
const st = p => p.evaluate(() => window.__fakeStore());
const toastTxt = p => p.evaluate(() => document.querySelector('#toast').textContent);
const avisos = p => p.evaluate(() => window.__avisos || []);
const dlgTxt = p => p.evaluate(() => [...document.querySelectorAll('.dlg.on')].map(d => d.textContent).join(' | '));
const esperar = (p, fn, arg, ms = 10000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
// Otra sesión escribe en Firebase sin que esta pantalla se entere todavía (no se avisa a las escuchas)
const otraSesion = (p, codigo) => p.evaluate(c => new Function('s', c)(window.__fakeStore()), codigo);
// Con ancho de PC, Lugares y Tipos son maestro-detalle: se elige el grupo que contiene el elemento
const ver = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel), c = e && e.closest('[hidden]'); if (c) document.querySelector('[data-md="' + (c.dataset.e ?? c.querySelector('.tygrp')?.dataset.e ?? '') + '"]')?.click(); }, sel);
async function menu(p, sel, txt) { await ver(p, sel); await p.click(sel); await p.waitForSelector('#ctx .ctx-i'); await p.click(`#ctx .ctx-i:has-text("${txt}")`); }
const resumenDe = (s, sid) => { const m = {}; Object.keys(s).filter(k => k === 'resumen/' + sid || k.startsWith('resumen/' + sid + '~')).sort().forEach(k => Object.assign(m, s[k].r || {})); return m; };
function parteRes(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; return Math.abs(h) % 4; }
const docRes = (sid, id) => 'resumen/' + (parteRes(id) ? sid + '~' + parteRes(id) : sid);

(async () => {
  const b = await chromium.launch();

  // ===== (1) Capas con dos sesiones =====
  {
    const J = await abrir(b, JEFE, DB());
    await pestana(J.p, 'capas'); await J.p.waitForSelector('#cCapas'); await J.p.selectOption('#cSub', 'pp-oeste'); await J.p.waitForTimeout(250); await J.p.selectOption('#cTipo', 'filtro1'); await J.p.waitForTimeout(350);
    // Mientras el jefe tiene la pantalla abierta, otra sesión cambia el mismo frente: cota de la capa 1, una capa nueva, un tramo y otro tipo
    await otraSesion(J.p, `const t = s['capas/pp-oeste'].tipos; t.filtro1.capas[0].cota = '750.00'; t.filtro1.capas.push({ nombre: 'Capa 7', cota: '' });
      t.filtro1.noAplica.push({ id: 'na1', capa: 'Capa 2', pkInicio: 10, pkFin: 20, nota: 'de otra sesión' }); t.filtro2 = { capas: [{ nombre: 'Capa A', cota: '' }], noAplica: [] };`);
    ok(!/Capa 7/.test(await J.p.textContent('#cCapas')), '(prueba) la pantalla del jefe aún no tiene lo de la otra sesión');
    await J.p.fill('#cCapas .ct-row:has(input[value="Capa 2"]) [data-k="cota"]', '751.30'); await J.p.press('#cCapas .ct-row:has(input[value="Capa 2"]) [data-k="cota"]', 'Tab');
    ok(await esperar(J.p, () => window.__fakeStore()['capas/pp-oeste'].tipos.filtro1.capas.find(c => c.nombre === 'Capa 2')?.cota === '751.30'), 'capas: la cota que puso el jefe (capa 2) se guarda');
    let c = (await st(J.p))['capas/pp-oeste'].tipos;
    ok(c.filtro1.capas.find(x => x.nombre === 'Capa 1')?.cota === '750.00', 'capas: la cota que puso la otra sesión en la capa 1 no se pisa');
    ok(c.filtro1.capas.some(x => x.nombre === 'Capa 7'), 'capas: la capa que agregó la otra sesión sigue ahí');
    ok(c.filtro1.noAplica.some(x => x.id === 'na1'), 'capas: el tramo «no se libera» de la otra sesión sigue ahí');
    ok(c.filtro2?.capas?.[0]?.nombre === 'Capa A', 'capas: lo de otro tipo (filtro 2) que cambió la otra sesión sigue ahí');
    ok(/^Guardado/.test(await toastTxt(J.p)), 'capas: avisa «Guardado» cuando Firebase lo confirma');
    // Dos guardados seguidos sin esperar: el segundo no toma por «quitado» lo que el primero aún no confirmaba
    await J.p.evaluate(() => document.activeElement?.blur()); await J.p.waitForTimeout(400);
    await J.p.fill('#cNom', 'Capa 3'); await J.p.click('#cAdd'); await J.p.fill('#cNom', 'Capa 4'); await J.p.click('#cAdd');
    ok(await esperar(J.p, () => ['Capa 3', 'Capa 4'].every(n => window.__fakeStore()['capas/pp-oeste'].tipos.filtro1.capas.some(c => c.nombre === n))), 'capas: dos capas agregadas una tras otra quedan las dos');
    await J.p.evaluate(() => document.activeElement?.blur()); await J.p.waitForTimeout(500);
    // Lo que el jefe quita a propósito sí se quita (aunque fuera de la otra sesión)
    await J.p.click('#cCapas .ct-row:has(input[value="Capa 7"]) [data-k="del"]'); await J.p.waitForSelector('.dlg.on [type=submit]'); await J.p.click('.dlg.on [type=submit]');
    ok(await esperar(J.p, () => !window.__fakeStore()['capas/pp-oeste'].tipos.filtro1.capas.some(c => c.nombre === 'Capa 7')), 'capas: quitar la capa 7 la quita (no vuelve como «ajena»)');
    c = (await st(J.p))['capas/pp-oeste'].tipos.filtro1.capas.map(x => x.nombre);
    ok(c.join() === 'Capa 1,Capa 2,Capa 3,Capa 4', 'capas: quedan en orden natural: ' + c.join());
    // El tramo que no se libera (desde el Panel usa la misma transacción): lo de la otra sesión se conserva
    await otraSesion(J.p, `s['capas/pp-oeste'].tipos.filtro1.noAplica.push({ id: 'na2', capa: 'Capa 1', pkInicio: 50, pkFin: 60 });`);
    await J.p.evaluate(() => { const T = window.__T, l = T.S.capasCfg['pp-oeste'].tipos.filtro1.noAplica.map(x => ({ ...x })); l.push({ capa: 'Capa 3', pkInicio: 300, pkFin: 320 }); return T.guardarNoAplica('pp-oeste', 'filtro1', l, 'Tramo marcado'); });
    ok(await esperar(J.p, () => { const n = window.__fakeStore()['capas/pp-oeste'].tipos.filtro1.noAplica; return n.some(x => x.id === 'na2') && n.some(x => x.pkInicio === 300) && n.some(x => x.id === 'na1'); }), 'capas: marcar un tramo «no se libera» conserva el que otra sesión marcó en el mismo tipo');
    // Si Firebase lo rechaza: avisa y la pantalla vuelve a como estaba
    await J.p.evaluate(() => { window.__fakeNegar = true; });
    await J.p.fill('#cNom', 'Capa 9'); await J.p.click('#cAdd'); await J.p.waitForTimeout(600);
    await J.p.evaluate(() => { window.__fakeNegar = false; document.activeElement?.blur(); }); await J.p.waitForTimeout(300);
    ok(/No se guardó/.test(await toastTxt(J.p)) && !(await J.p.$('#cCapas .ct-row input[value="Capa 9"]')), 'capas: un rechazo avisa «No se guardó» y la capa no queda en pantalla');
    // Sin señal sigue sin dejar cambiar (como en el lote D)
    await J.ctx.setOffline(true); await J.p.waitForTimeout(200);
    await J.p.click('#cAdd'); await J.p.waitForTimeout(300);
    ok(/Se necesita señal para cambiar las capas/.test(await toastTxt(J.p)), 'capas: sin señal, «Se necesita señal para cambiar las capas»');
    await J.ctx.setOffline(false);

    // ===== (2) Lugares: frente de segundo nivel con dos sesiones =====
    await pestana(J.p, 'lugares');
    await otraSesion(J.p, `s['listas/estructuras'].items[0].subs.push({ id: 'pp-norte', nombre: 'Presa Principal Norte', pkMin: 0, pkMax: 900 });`);
    ok(!/Presa Principal Norte/.test(await J.p.textContent('#ajBody')), '(prueba) la pantalla del jefe aún no tiene el frente nuevo');
    const sel = '[data-s="pp-este"] [data-k="snom"]'; await ver(J.p, sel);
    await J.p.fill(sel, 'Presa Principal Este B'); await J.p.press(sel, 'Tab');
    ok(await esperar(J.p, () => window.__fakeStore()['listas/estructuras'].items[0].subs.find(s => s.id === 'pp-este')?.nombre === 'Presa Principal Este B'), 'lugares: el frente renombrado por el jefe se guarda');
    const subs = (await st(J.p))['listas/estructuras'].items[0].subs;
    ok(subs.map(s => s.id).join() === 'pp-oeste,pp-este,pp-norte' && subs[2].nombre === 'Presa Principal Norte' && subs[2].pkMax === 900, 'lugares: el frente que otra sesión agregó dentro de la estructura sigue ahí, con sus datos: ' + subs.map(s => s.id).join());

    // ===== (3) unirElemento con un tipo agregado por campo a mitad =====
    await pestana(J.p, 'tipos');
    await otraSesion(J.p, `s['listas/tipos'].items.push({ id: 'geomalla', nombre: 'Geomalla', elementoId: 'geo', orden: 5, nuevo: true, creadoPor: 'operario@gmail.com' });`);
    await menu(J.p, '#tyList .elgrp[data-e="geo"] [data-k="emas"]', 'Unir con otro elemento'); await J.p.waitForSelector('.dlg.on [data-dest]');
    await J.p.click('.dlg.on [data-dest="mt"]');
    ok(await esperar(J.p, () => !window.__fakeStore()['listas/elementos'].items.some(e => e.id === 'geo')), 'unir: «Geosintéticos» sale de la lista de elementos');
    let ts = (await st(J.p))['listas/tipos'].items;
    ok(ts.find(t => t.id === 'geotex')?.elementoId === 'mt', 'unir: su tipo de siempre (Geotextil) pasa a «Movimiento de tierras»');
    ok(ts.find(t => t.id === 'geomalla')?.elementoId === 'mt' && ts.find(t => t.id === 'geomalla')?.creadoPor === 'operario@gmail.com', 'unir: el tipo que campo agregó a mitad (Geomalla) se conserva y también pasa a «Movimiento de tierras» (no queda con el elemento quitado)');
    await J.p.waitForSelector('#toast .toast-btn'); await J.p.click('#toast .toast-btn');
    ok(await esperar(J.p, () => { const t = window.__fakeStore()['listas/tipos'].items; return window.__fakeStore()['listas/elementos'].items.some(e => e.id === 'geo') && ['geotex', 'geomalla'].every(id => t.find(x => x.id === id)?.elementoId === 'geo'); }), 'unir: «Deshacer» devuelve los dos tipos (también Geomalla) a «Geosintéticos»');
    await J.ctx.close();
  }

  // ===== (4) Edición sin señal que Firebase rechaza con la app cerrada =====
  {
    const db = DB(); db['liberaciones/m1'] = reg({ descripcion: 'Original M1', pkInicio: 200, pkFin: 240 }); db['liberaciones/m2'] = reg({ descripcion: 'Original M2', pkInicio: 300, pkFin: 340 });
    const O = await abrir(b, OPER, db);
    const copiasEd = () => O.p.evaluate(() => JSON.parse(localStorage.getItem('lib.sinConfirmarEd.operario@gmail.com') || 'null') || {});
    const editarSinSenal = async (id, desc) => {
      await ir(O.p, 'mis'); await O.p.waitForSelector(`#lista .item[data-id="${id}"]`); await O.p.click(`#lista .item[data-id="${id}"]`);
      await O.p.waitForSelector('#sheet.on #fEditar'); await O.p.click('#fEditar'); await O.p.waitForSelector('#iDesc');
      await O.ctx.setOffline(true); await O.p.evaluate(() => { window.__fakeOffline = true; });
      await O.p.fill('#iDesc', desc); await O.p.click('#bGuardar'); await O.p.waitForTimeout(600);
    };
    // «Cerrar la app»: lo que quedó en el almacén del falso se guarda (con un cambio que simula lo que hizo Firebase) y se vuelve a entrar con señal
    const reabrir = async cambio => {
      await O.p.evaluate(c => { const s = window.__fakeStore(); if (c) new Function('s', c)(s); localStorage.setItem('__fakeDB', JSON.stringify(s)); window.__fakeOffline = false; }, cambio || '');
      await O.ctx.setOffline(false); await O.p.reload(); await O.p.waitForSelector('#nav button'); await O.p.waitForTimeout(1300);
    };
    await editarSinSenal('m1', 'Editado sin señal M1');
    ok(/Guardado en el teléfono/.test(await toastTxt(O.p)), 'edición sin señal: «Guardado en el teléfono» como siempre');
    let ce = await copiasEd();
    ok(ce.m1 && ce.m1.form.descripcion === 'Editado sin señal M1' && ce.m1.h, 'edición sin señal: queda una copia de lo editado, con el id del historial de su envío');
    const h = ce.m1.h;
    ok(!!(await st(O.p))['historial/' + h], '(prueba) ese historial va en el mismo envío que la edición');
    // Firebase la rechaza con la app cerrada: el registro queda como estaba y su historial no llega
    await reabrir(`s['liberaciones/m1'] = ${JSON.stringify(db['liberaciones/m1'])}; delete s['historial/${h}'];`);
    ok(/Una edición no llegó a subirse/.test(await dlgTxt(O.p)) && /no llegaron a subirse/.test(await dlgTxt(O.p)), 'al volver a entrar se avisa «Una edición no llegó a subirse»');
    await O.p.click('.dlg.on [type=submit]'); await O.p.waitForTimeout(1200);
    ok(await O.p.evaluate(() => document.body.classList.contains('v-nueva')) && await O.p.inputValue('#iDesc').catch(() => '') === 'Editado sin señal M1', '«Volver a abrir la edición» abre el registro con lo que se había escrito');
    ok(await O.p.evaluate(() => window.__T.S.editando?.id) === 'm1', 'y es la edición de ese registro (no un registro nuevo)');
    ok(Object.keys(await copiasEd()).length === 0, 'la copia ya no queda');
    await O.p.click('#bGuardar'); await O.p.waitForTimeout(1200);
    ok((await st(O.p))['liberaciones/m1'].descripcion === 'Editado sin señal M1' && Object.keys(await copiasEd()).length === 0, 'guardada otra vez con señal: el registro queda editado y sin copia');
    // Caso normal: la edición sí sube (aunque la app se cerró antes de confirmar): no se ofrece nada
    await editarSinSenal('m2', 'Editado sin señal M2');
    ok((await copiasEd()).m2, '(normal) queda la copia mientras no se confirma');
    await reabrir();
    ok(!/no llegó a subirse/.test(await dlgTxt(O.p)) && Object.keys(await copiasEd()).length === 0, '(normal) la edición está en Firebase: no se ofrece nada y la copia se borra');
    // Descartar
    await editarSinSenal('m2', 'Edición para descartar');
    const h2 = (await copiasEd()).m2.h;
    await reabrir(`s['liberaciones/m2'].descripcion = 'Editado sin señal M2'; delete s['historial/${h2}'];`);
    ok(/Una edición no llegó a subirse/.test(await dlgTxt(O.p)), 'otra rechazada: se ofrece');
    await O.p.click('.dlg.on [data-descartar]'); await O.p.waitForSelector('.dlg.on [type=submit]'); await O.p.click('.dlg.on [type=submit]'); await O.p.waitForTimeout(500);
    ok(Object.keys(await copiasEd()).length === 0 && (await st(O.p))['liberaciones/m2'].descripcion === 'Editado sin señal M2', '«Descartarla» (con confirmación) borra la copia; el registro queda como está en el servidor');
    await O.p.reload(); await O.p.waitForSelector('#nav button'); await O.p.waitForTimeout(1000);
    ok(!/no llegó a subirse/.test(await dlgTxt(O.p)), 'y no se vuelve a ofrecer');
    // Rechazo con la app abierta: vuelve al formulario como siempre y no queda copia
    await ir(O.p, 'mis'); await O.p.click('#lista .item[data-id="m2"]'); await O.p.waitForSelector('#sheet.on #fEditar'); await O.p.click('#fEditar'); await O.p.waitForSelector('#iDesc');
    await O.ctx.setOffline(true); await O.p.evaluate(() => { window.__fakeOffline = true; window.__fakeNegar = true; });
    await O.p.fill('#iDesc', 'Rechazada en la sesión'); await O.p.click('#bGuardar'); await O.p.waitForTimeout(700);
    await O.p.evaluate(() => { window.__fakeNegar = false; window.__fakeOffline = false; }); await O.ctx.setOffline(false); await O.p.waitForTimeout(400);
    ok(Object.keys(await copiasEd()).length === 0, 'rechazo con la app abierta: no queda copia (lo escrito vuelve al formulario, como antes)');
    await O.ctx.close();
  }

  // ===== (5) Aviso de versión nueva que llega antes de que la app escuche =====
  {
    const prob = async (H, n) => {
      const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, serviceWorkers: 'block' }); await rutas(ctx, conAvisoTemprano(H));
      const p = await ctx.newPage(); p.on('pageerror', e => { errores.push(n + ': ' + e.message); });
      await p.goto(URL); await p.evaluate(u => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify({ 'config/general': { obra: 'Prueba' } })); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('__vnMandar', '1'); }, ADMIN);
      const cargas = []; p.on('load', () => cargas.push(Date.now()));
      await p.reload().catch(() => {});
      for (let i = 0; i < 60 && cargas.length < 2; i++) await new Promise(r => setTimeout(r, 50));
      await p.waitForLoadState('load'); await p.waitForSelector('#nav button'); await p.waitForTimeout(1500);
      const r = { cargas: cargas.length, mandado: await p.evaluate(() => localStorage.__vnMandado === '1'), actualizada: await p.evaluate(() => localStorage.getItem('lib.actualizada') === '0') };
      await ctx.close(); return r;
    };
    const r = await prob(NUEVO, 'nuevo');
    ok(r.mandado && r.cargas === 2, `el aviso que llega antes de que cargue el módulo no se pierde: la app se recarga sola a la versión nueva (${r.cargas} cargas)`);
    ok(r.actualizada, 'la recarga es la de «versión nueva» de siempre (recargarApp: anota la versión y al volver la atiende)');
    try { const viejo = await prob(execSync('git show HEAD:index.html', { cwd: path.join(__dirname, '..'), maxBuffer: 64e6 }).toString('utf8'), 'main'); console.log(`     (con el index.html de main: ${viejo.cargas} carga${viejo.cargas === 1 ? '' : 's'}${viejo.cargas === 1 ? ' — el aviso se perdía' : ''})`); } catch (e) { console.log('     (no se pudo comparar con main: ' + e.message.slice(0, 60) + ')'); }
  }

  // ===== (6) R10: aviso de tamaño del resumen =====
  {
    const db = DB(), r = {};
    // Una parte de unos 760 KB (≈7.000 filas) en el frente oeste; el frente este, pequeño
    for (let i = 0; i < 7000; i++) r['x' + String(i).padStart(18, '0')] = ['filtro1', 'Capa 1', i, i + 1, 'EC', ahora - dia, 'SKT-TOP-' + String(i).padStart(5, '0'), 'LIB', 'GN', null];
    db['resumen/pp-oeste~1'] = { r }; db['resumen/pp-este'] = { r: { e1: ['filtro1', 'Capa 1', 0, 10, 'PT', ahora, '', 'LIB', 'GN', null] } };
    const A = await abrir(b, ADMIN, db, { ls: { 'lib.panelSub': 'pp-oeste' } });
    await ir(A.p, 'panel'); await A.p.waitForTimeout(1500);
    const av = (await avisos(A.p)).filter(t => /llegando al límite del resumen/.test(t));
    ok(av.length === 1 && /El frente Presa Principal Oeste está llegando al límite del resumen: avisa al administrador/.test(av[0]), 'administrador: al recibir una parte de más de 700 KB avisa «El frente Presa Principal Oeste está llegando al límite del resumen: avisa al administrador»');
    ok(!(await avisos(A.p)).some(t => /Presa Principal Este está llegando/.test(t)), 'el frente pequeño no avisa');
    await ir(A.p, 'mis'); await ir(A.p, 'panel'); await A.p.waitForTimeout(800);
    ok((await avisos(A.p)).filter(t => /llegando al límite del resumen/.test(t)).length === 1, 'una sola vez por sesión y por frente (al volver al Panel no se repite)');
    await pestana(A.p, 'historico'); await A.p.waitForSelector('#hResTam');
    ok(await esperar(A.p, () => /Parte más grande del resumen: \d+ KB de 1 MB \(Presa Principal Oeste · parte 1\) · cerca del límite/.test(document.querySelector('#hResTam').textContent)), 'Ajustes → Histórico muestra la parte más grande junto a «Reconstruir resumen»: «' + (await A.p.textContent('#hResTam')).trim() + '»');
    await A.ctx.close();
    // Jefe: Histórico sin haber abierto el Panel (lo mide al entrar)
    const J = await abrir(b, JEFE, db);
    await pestana(J.p, 'historico');
    ok(await esperar(J.p, () => /Parte más grande del resumen: \d+ KB/.test(document.querySelector('#hResTam')?.textContent || '')), 'jefe: Histórico mide el resumen aunque no se haya abierto el Panel: «' + (await J.p.textContent('#hResTam')).trim() + '»');
    ok((await avisos(J.p)).some(t => /Presa Principal Oeste está llegando al límite/.test(t)), 'jefe: también recibe el aviso');
    await J.ctx.close();
    // Gabinete y campo no reciben el aviso
    const G = await abrir(b, GAB, db, { ls: { 'lib.panelSub': 'pp-oeste' } });
    await ir(G.p, 'panel'); await G.p.waitForTimeout(1200);
    ok(!(await avisos(G.p)).some(t => /límite del resumen/.test(t)), 'gabinete: no recibe el aviso');
    await G.ctx.close();
    const O = await abrir(b, OPER, db);
    await ir(O.p, 'nueva'); await O.p.waitForSelector('#iSub'); await O.p.selectOption('#iEst', 'pp'); await O.p.waitForTimeout(80); await O.p.selectOption('#iSub', 'pp-oeste'); await O.p.waitForTimeout(800);
    ok(!(await avisos(O.p)).some(t => /límite del resumen/.test(t)), 'campo: no recibe el aviso (aunque lea el resumen del frente)');
    await O.ctx.close();
  }

  // ===== (7) Campo escribe «u» en el resumen; gabinete no; «u» no es un registro =====
  {
    const db = DB(); db['liberaciones/p1'] = reg({ descripcion: 'Para la papelera', pkInicio: 500, pkFin: 540 }); db[docRes('pp-oeste', 'p1')] = { r: { p1: ['filtro1', 'Capa 1', 500, 540, 'PT', ahora, '', 'LIB', 'GN', null] } };
    const O = await abrir(b, OPER, db);
    await ir(O.p, 'nueva'); await O.p.waitForSelector('#iTipoQ, #tCambiar');
    await tipo(O.p, 'filtro1'); await O.p.selectOption('#iTopo', 'GN'); await O.p.selectOption('#iEst', 'pp'); await O.p.waitForTimeout(80); await O.p.selectOption('#iSub', 'pp-oeste');
    await O.p.fill('#iPk1', '1000'); await O.p.fill('#iPk2', '1040'); await O.p.fill('#iDesc', 'Nueva desde campo'); await equipo(O.p);
    await O.p.evaluate(() => { window.__fakeEnvios = []; });
    await O.p.click('#bGuardar'); await O.p.waitForTimeout(900);
    let s = await st(O.p); const idN = Object.keys(s).find(k => k.startsWith('liberaciones/') && s[k].descripcion === 'Nueva desde campo')?.split('/')[1];
    const envio = (await O.p.evaluate(() => window.__fakeEnvios)).find(e => e.some(x => x.includes('liberaciones/')));
    ok(idN && envio && envio.includes('set:' + docRes('pp-oeste', idN)), 'campo: el registro y su fila del resumen van en el mismo envío');
    ok(s[docRes('pp-oeste', idN)].u === idN && s[docRes('pp-oeste', idN)].r[idN], `campo: el resumen lleva «u» con el id del registro (${idN})`);
    // Papelera desde campo: también con «u»
    await ir(O.p, 'mis'); await O.p.click('#lista .item[data-id="p1"]'); await O.p.waitForSelector('#sheet.on');
    const btnP = await O.p.$('#sheet.on button:has-text("papelera")');
    if (ok(!!btnP, 'campo: la ficha ofrece mandar a la papelera')) { await btnP.click(); await O.p.waitForSelector('.dlg.on [type=submit]'); await O.p.click('.dlg.on [type=submit]'); await O.p.waitForTimeout(900);
      s = await st(O.p); ok(s['liberaciones/p1'].borrado === true && !s[docRes('pp-oeste', 'p1')].r.p1 && s[docRes('pp-oeste', 'p1')].u === 'p1', 'campo: al mandar a la papelera quita su fila y el resumen lleva «u» = p1'); }
    await O.ctx.close();

    // Gabinete crea un registro en otro frente (resumen nuevo): sin «u»
    const db2 = DB();
    const G = await abrir(b, GAB, db2);
    await ir(G.p, 'nueva'); await G.p.waitForSelector('#iTipoQ, #tCambiar');
    await tipo(G.p, 'filtro1'); await G.p.selectOption('#iTopo', 'GN'); await G.p.selectOption('#iEst', 'pp'); await G.p.waitForTimeout(80); await G.p.selectOption('#iSub', 'pp-este');
    await G.p.fill('#iPk1', '100'); await G.p.fill('#iPk2', '140'); await G.p.fill('#iDesc', 'Nueva desde gabinete'); await equipo(G.p);
    await G.p.click('#bGuardar'); await G.p.waitForTimeout(900);
    s = await st(G.p); const idG = Object.keys(s).find(k => k.startsWith('liberaciones/') && s[k].descripcion === 'Nueva desde gabinete')?.split('/')[1];
    ok(idG && s[docRes('pp-este', idG)]?.r?.[idG] && !('u' in s[docRes('pp-este', idG)]), 'gabinete: escribe su fila del resumen sin «u»');
    await G.ctx.close();

    // Lo que escribió campo, visto por el administrador: «u» no aparece como registro en el Panel ni en el buscador
    const dbA = JSON.parse(JSON.stringify(s));
    for (const k of Object.keys(db)) if (!(k in dbA) && !k.startsWith('resumen/')) dbA[k] = db[k];
    // El resumen del frente oeste con «u» (como lo dejó campo) y un registro más
    dbA['liberaciones/q1'] = reg({ descripcion: 'Q1', pkInicio: 700, pkFin: 740 }); dbA['resumen/pp-oeste'] = { r: { q1: ['filtro1', 'Capa 1', 700, 740, 'PT', ahora, '', 'LIB', 'GN', null] }, u: 'q1' };
    dbA['resumen/pp-oeste~2'] = { r: { q2: ['filtro1', 'Capa 2', 800, 840, 'PT', ahora, '', 'LIB', 'GN', null] }, u: 'q2' }; dbA['liberaciones/q2'] = reg({ descripcion: 'Q2', capa: 'Capa 2', pkInicio: 800, pkFin: 840 });
    const A = await abrir(b, ADMIN, dbA, { ls: { 'lib.panelSub': 'pp-oeste' } });
    await ir(A.p, 'panel'); await A.p.waitForTimeout(1500);
    const pd = await A.p.evaluate(() => window.__T.S.panelDatos.map(r => r.id));
    ok(pd.includes('q1') && pd.includes('q2') && !pd.includes('u') && pd.every(id => id.length > 1), `Panel: están los registros del resumen y «u» no aparece como registro (${pd.length} filas)`);
    await A.p.keyboard.press('Control+k'); await A.p.waitForTimeout(300);
    if (!(await A.p.$('#cmdk'))) await A.p.evaluate(() => document.querySelector('[aria-label*="Buscar"]')?.click());
    await A.p.waitForSelector('#cmdk input'); await A.p.fill('#cmdk input', 'u'); await A.p.waitForTimeout(800);
    const bt = await A.p.evaluate(() => (window.__T.BUS.todos || []).map(r => r.id));
    ok(bt.length > 0 && bt.includes('q1') && !bt.includes('u'), `buscador: el resumen completo (${bt.length} registros) no tiene un registro «u»`);
    await A.ctx.close();
  }

  ok(!errores.length, 'sin errores en la consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
