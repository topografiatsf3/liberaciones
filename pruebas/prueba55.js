// Lote D de la auditoría (consistencia: que no se pierda ni se pise lo guardado): D4, D25, D10 y D15.
// Uso: PUERTO=8790 node pruebas\prueba55.js
const { chromium } = require('playwright'); const path = require('path');
const { tipo, equipo } = require('./filtros');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Jefe Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); return !!c; };
const ahora = Date.now(), dia = 864e5;
const reg = (extra) => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 1', topografoId: 'GN', numero: '', equipo: 'GNSS', estado: 'PT', descripcion: 'Registro', pkInicio: 100, pkFin: 140, fechaCampo: { __ts: ahora - 3 * dia }, creadoEn: { __ts: ahora - 3 * dia }, editadoEn: { __ts: ahora - 3 * dia }, archivos: [], ...extra });
const DB = () => ({
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'usuarios/jefe@gmail.com': { nombre: 'Jefe Prueba', rol: 'jefe', topografoId: '', activo: true },
  'config/general': { obra: 'Prueba', prefijo: 'SKT-TOP-', digitos: 5, zona: 'America/Lima', resumenV: 2 },
  'contadores/skt': { ultimo: 100 },
  'listas/tipos': { items: [['filtro1', 'Relleno filtro 1'], ['filtro2', 'Relleno filtro 2'], ['masivo', 'Relleno masivo'], ['transicion', 'Relleno de transición']].map(([id, nombre], i) => ({ id, nombre, elementoId: 'mt', orden: i + 1, enGrafico: true })) },
  'listas/elementos': { items: [{ id: 'mt', nombre: 'Movimiento de tierras' }, { id: 'geo', nombre: 'Geosintéticos' }] },
  'listas/topografos': { items: [{ id: 'GN', nombre: 'Gabriel Nuñez' }, { id: 'AB', nombre: 'Ana Bravo' }] },
  'listas/estructuras': { items: [{ id: 'pp', nombre: 'Presa Principal', subs: [{ id: 'pp-oeste', nombre: 'Presa Principal Oeste', pkMin: 0, pkMax: 2700 }] }] },
  'capas/pp-oeste': { tipos: { filtro1: { capas: [{ nombre: 'Capa 1', cota: '' }, { nombre: 'Capa 2', cota: '' }], noAplica: [] } } }
});
const rutas = async c => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
};
async function abrir(b, u, db, hash) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 800 }, serviceWorkers: 'block' }); await rutas(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_INTERNET|fonts|net::|Failed to load resource|Fallo simulado|insufficient permissions/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [db, u]);
  await p.goto(URL + (hash || '')); await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(700);
  return { ctx, p };
}
const ir = async (p, v) => { await p.evaluate(v => document.querySelector(`#nav [data-v="${v}"]`).click(), v); await p.waitForTimeout(400); };
const pestana = async (p, t) => { await ir(p, 'ajustes'); await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(300); };
const st = p => p.evaluate(() => window.__fakeStore());
const toastTxt = p => p.evaluate(() => document.querySelector('#toast').textContent);
const lista = async (p, k) => ((await st(p))['listas/' + k] || {}).items || [];
// Lo que hay en el resumen del frente (todas sus partes juntas)
const resumen = async p => { const s = await st(p), m = {}; Object.keys(s).filter(k => k.startsWith('resumen/pp-oeste')).sort().forEach(k => Object.assign(m, s[k].r || {})); return m; };
const copias = p => p.evaluate(() => JSON.parse(localStorage.getItem('lib.sinConfirmar.operario@gmail.com') || 'null') || {});
const idb = (p, clave) => p.evaluate(k => new Promise(ok => { const r = indexedDB.open('lib-adjuntos', 1); r.onupgradeneeded = () => r.result.createObjectStore('b'); r.onsuccess = () => { const q = r.result.transaction('b').objectStore('b').get(k); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); }; r.onerror = () => ok(null); }), clave);
// Llena «Nueva» con una liberación (con un CSV adjunto)
let tramo = 0;
async function llenar(p, desc) {
  tramo += 100;
  await ir(p, 'nueva'); await p.waitForSelector('#iTipoQ, #tCambiar');
  await tipo(p, 'filtro1'); await p.selectOption('#iTopo', 'GN'); await p.selectOption('#iEst', 'pp'); await p.waitForTimeout(80); await p.selectOption('#iSub', 'pp-oeste');
  await p.fill('#iPk1', String(tramo)); await p.fill('#iPk2', String(tramo + 40)); await p.fill('#iDesc', desc); await equipo(p);
  await p.setInputFiles('#fCsv', { name: 'lev-' + desc.length + '.csv', mimeType: 'text/csv', buffer: Buffer.from('P1,1,2,3') }); await p.waitForSelector('.arch');
}
// Guarda sin señal: el registro queda en el teléfono (en el falso, ya escrito en su almacén) y su escritura sin confirmar
async function guardarSinSenal(ctx, p) {
  await ctx.setOffline(true); await p.evaluate(() => { window.__fakeOffline = true; });
  await p.click('#bGuardar'); await p.waitForTimeout(500);
  return toastTxt(p);
}
// «Cerrar la app y volver a entrar»: el almacén del falso se guarda como está (lo pendiente se pierde con la página) y se recarga con señal
async function reabrir(ctx, p, cambio) {
  await p.evaluate(c => { const s = window.__fakeStore(); if (c) new Function('s', c)(s); localStorage.setItem('__fakeDB', JSON.stringify(s)); }, cambio || '');
  await ctx.setOffline(false);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(1200);
}
// Lo que hace Firebase al rechazar la escritura de un registro nuevo: no queda nada de ese envío (registro, adjuntos, historial ni su fila del resumen)
const rechazar = id => `for (const k of Object.keys(s)) { const x = s[k]; if (k === 'liberaciones/${id}' || (x && x.liberacionId === '${id}')) delete s[k]; else if (k.startsWith('resumen/') && x.r) delete x.r['${id}']; }`;
const dlgTxt = p => p.evaluate(() => [...document.querySelectorAll('.dlg.on')].map(d => d.textContent).join(' | '));

(async () => {
  const b = await chromium.launch();

  // ===== D4: el jefe guarda un cambio de la lista con una copia vieja; lo que campo agregó mientras tanto sigue ahí =====
  {
    const C = await abrir(b, OPER, DB());
    await ir(C.p, 'nueva'); await C.p.waitForSelector('#iTipoQ');
    await C.p.fill('#iTipoQ', 'relleno filtro 3'); await C.p.waitForTimeout(150);
    await C.p.click('#tRes [data-nuevo]'); await C.p.waitForSelector('.dlg.on #nNom'); await C.p.waitForTimeout(250);
    await C.p.click('.dlg.on [data-ele="mt"]'); await C.p.click('.dlg.on [type=submit]'); await C.p.waitForSelector('.dlg', { state: 'detached' });
    const deCampo = (await st(C.p))['listas/tipos'], t3 = deCampo.items.find(t => t.nombre === 'Relleno filtro 3');
    ok(t3 && t3.nuevo && t3.orden === 5, '(campo) agrega «Relleno filtro 3» al final de la lista, para todos');
    await C.ctx.close();

    const J = await abrir(b, JEFE, DB());
    await pestana(J.p, 'tipos'); await J.p.click('[data-tyv="ord"]'); await J.p.waitForSelector('#tyOrd');
    // A Firebase ya llegó lo de campo, pero al jefe todavía no (sin señal un rato, o la escucha aún no lo trae)
    await J.p.evaluate(d => { window.__fakeStore()['listas/tipos'] = d; }, deCampo);
    ok(!/Relleno filtro 3/.test(await J.p.textContent('#tyOrd')), '(prueba) la pantalla del jefe aún no tiene el tipo de campo');
    await J.p.click('#tyOrd .tyord:nth-child(2) [data-k="up"]'); await J.p.waitForTimeout(500);
    const ts = (await lista(J.p, 'tipos')).slice().sort((a, b) => a.orden - b.orden);
    ok(ts.map(t => t.id).join() === ['filtro2', 'filtro1', 'masivo', 'transicion', t3.id].join(), 'D4: el cambio del jefe (filtro 2 sube) se guarda y el tipo de campo sigue en su sitio (al final): ' + ts.map(t => t.id).join());
    ok(ts.every((t, i) => t.orden === i + 1), 'D4: el orden queda rehecho sin repetidos (1…5)');
    ok(ts.find(t => t.id === t3.id)?.nuevo === true && ts.find(t => t.id === t3.id)?.creadoPor === 'operario@gmail.com', 'D4: el tipo de campo conserva sus datos (nuevo, quién lo agregó)');
    await J.p.evaluate(() => document.activeElement?.blur()); await J.p.waitForTimeout(400);
    ok(/Relleno filtro 3/.test(await J.p.textContent('#tyOrd')), 'D4: y aparece en la pantalla del jefe (al soltar el campo, como siempre en Ajustes)');
    ok(/posición 1/.test(await toastTxt(J.p)), 'D4: el aviso de siempre («quedó en la posición 1»)');

    // Lo que el jefe quita a propósito no vuelve (está en su copia: no es «de otro»)
    await J.p.evaluate(() => { const s = window.__fakeStore(); s['listas/topografos'].items.push({ id: 'ZZ', nombre: 'Topógrafo de otra sesión' }); });
    await pestana(J.p, 'topografos');
    await J.p.fill('#tpList [data-i="0"] [data-k="nom"]', 'Gabriel Núñez'); await J.p.press('#tpList [data-i="0"] [data-k="nom"]', 'Tab'); await J.p.waitForTimeout(400);
    const tp = await lista(J.p, 'topografos');
    ok(tp.find(t => t.id === 'GN')?.nombre === 'Gabriel Núñez' && tp.some(t => t.id === 'ZZ') && tp.length === 3, 'D4: en Topógrafos, renombrar no borra el que otra sesión agregó: ' + tp.map(t => t.id).join());

    // Si Firebase rechaza el guardado, la pantalla vuelve a lo que había (versión 42)
    await pestana(J.p, 'tipos'); await J.p.waitForSelector('#tyOrd');
    const antesTxt = await J.p.textContent('#tyOrd .tyord:nth-child(1) .tynom b');
    await J.p.evaluate(() => { window.__fakeNegar = true; });
    await J.p.click('#tyOrd .tyord:nth-child(2) [data-k="up"]'); await J.p.waitForTimeout(600);
    await J.p.evaluate(() => { window.__fakeNegar = false; });
    ok(/No se guardó/.test(await toastTxt(J.p)) && await J.p.textContent('#tyOrd .tyord:nth-child(1) .tynom b') === antesTxt, 'D4: con la transacción, un rechazo avisa y la pantalla vuelve a como estaba');

    // ===== D25: sin señal no se cambian las listas ni las capas, y la pantalla no cambia =====
    const s0 = await st(J.p);
    await J.ctx.setOffline(true); await J.p.waitForTimeout(200);
    await J.p.click('#tyOrd .tyord:nth-child(2) [data-k="up"]'); await J.p.waitForTimeout(400);
    ok(/Se necesita señal para cambiar las listas/.test(await toastTxt(J.p)), 'D25: sin señal, subir un tipo avisa «Se necesita señal para cambiar las listas»');
    ok(await J.p.textContent('#tyOrd .tyord:nth-child(1) .tynom b') === antesTxt, 'D25: y el orden en pantalla no cambia');
    await pestana(J.p, 'topografos');
    await J.p.fill('#tpList [data-i="1"] [data-k="nom"]', 'Nombre sin señal'); await J.p.press('#tpList [data-i="1"] [data-k="nom"]', 'Tab'); await J.p.waitForTimeout(400);
    ok(/cambiar las listas/.test(await toastTxt(J.p)) && await J.p.inputValue('#tpList [data-i="1"] [data-k="nom"]') === 'Ana Bravo', 'D25: renombrar un topógrafo sin señal tampoco: el nombre vuelve al guardado');
    await pestana(J.p, 'capas'); await J.p.waitForSelector('#cAdd'); await J.p.selectOption('#cTipo', 'filtro1'); await J.p.waitForTimeout(300);
    const nCap = await J.p.$$eval('#cCapas .ct-row:not(.head)', r => r.length);
    await J.p.click('#cAdd'); await J.p.waitForTimeout(400);
    ok(/Se necesita señal para cambiar las capas/.test(await toastTxt(J.p)) && await J.p.$$eval('#cCapas .ct-row:not(.head)', r => r.length) === nCap, 'D25: agregar una capa sin señal avisa y no la pone');
    await J.p.click('#cCapas .ct-row:not(.head) [data-k="oc"]'); await J.p.waitForTimeout(300);
    ok(await J.p.$eval('#cCapas .ct-row:not(.head) [data-k="oc"]', b => b.textContent) === 'Visible', 'D25: ocultar una capa sin señal tampoco cambia la pantalla');
    const s1 = await st(J.p);
    ok(JSON.stringify(['listas/tipos', 'listas/topografos', 'capas/pp-oeste'].map(k => s1[k])) === JSON.stringify(['listas/tipos', 'listas/topografos', 'capas/pp-oeste'].map(k => s0[k])), 'D25: no se escribió nada (ni quedó en cola)');
    await J.ctx.setOffline(false); await J.p.waitForTimeout(200);
    await J.p.click('#cAdd'); await J.p.waitForTimeout(400);
    ok(((await st(J.p))['capas/pp-oeste'].tipos.filtro1.capas || []).length === 3, 'D25: con señal se agrega como siempre');
    await J.ctx.close();
  }

  // ===== D10: un registro cambia mientras se reconstruye el resumen; al terminar, el resumen queda al día =====
  {
    const db = DB();
    for (let i = 1; i <= 6; i++) db['liberaciones/r' + i] = reg({ pkInicio: i * 100, pkFin: i * 100 + 40, descripcion: 'R' + i });
    const A = await abrir(b, ADMIN, db);
    await pestana(A.p, 'historico'); await A.p.waitForSelector('#hRes2');
    // Justo cuando se manda la primera parte del resumen, otras personas aceptan r1, mandan r2 a la papelera y crean r7
    await A.p.evaluate(() => { let una = false; window.__fakeFallar = rutas => {
      if (una || !rutas.some(r => r.startsWith('resumen/'))) return false; una = true;
      const s = window.__fakeStore(), t = { __ts: Date.now() };
      Object.assign(s['liberaciones/r1'], { estado: 'EC', numero: 'SKT-TOP-00090', editadoEn: t });
      Object.assign(s['liberaciones/r2'], { borrado: true, borradoEn: t }); s['historial/h-r2'] = { liberacionId: 'r2', accion: 'borrado', fecha: t };
      s['liberaciones/r7'] = { ...s['liberaciones/r3'], descripcion: 'R7', pkInicio: 900, pkFin: 940, creadoEn: t, editadoEn: t };
      return false; }; });
    await A.p.click('#hRes2'); await A.p.waitForSelector('.dlg.on [type=submit]'); await A.p.click('.dlg.on [type=submit]');
    await A.p.waitForFunction(() => /Resumen listo/.test(document.querySelector('#toast').textContent), null, { timeout: 15000 }).catch(() => {});
    await A.p.evaluate(() => { window.__fakeFallar = null; });
    const m = await resumen(A.p);
    ok(/Resumen listo/.test(await toastTxt(A.p)), 'D10: la reconstrucción termina («Resumen listo»)');
    ok(m.r1 && m.r1[4] === 'EC' && m.r1[6] === 'SKT-TOP-00090', 'D10: lo aceptado mientras corría queda al día en el resumen (r1 entregado, con su código)');
    ok(!m.r2, 'D10: lo mandado a la papelera mientras corría ya no está en el resumen');
    ok(m.r7 && m.r7[2] === 900, 'D10: lo creado mientras corría está en el resumen');
    ok(['r3', 'r4', 'r5', 'r6'].every(k => m[k] && m[k][4] === 'PT'), 'D10: los demás siguen como estaban');
    await A.ctx.close();
  }

  // ===== D15: lo guardado sin señal que después se rechaza se ofrece recuperar al volver a entrar =====
  {
    const O = await abrir(b, OPER, DB());
    // 1) Se guarda sin señal: queda la copia (y su adjunto) hasta que Firebase confirme
    await llenar(O.p, 'Liberación que Firebase rechaza');
    ok(/Guardado en el teléfono/.test(await guardarSinSenal(O.ctx, O.p)), 'D15: sin señal, «Guardado en el teléfono» como siempre');
    let cs = await copias(O.p), id = Object.keys(cs)[0];
    ok(id && cs[id].form.descripcion === 'Liberación que Firebase rechaza' && (cs[id].form.adjuntos || []).length === 1, 'D15: queda una copia del registro, por su id, con la lista de su adjunto');
    ok(((await idb(O.p, 'conf|operario@gmail.com|' + id)) || {}).archivos?.[0]?.datos, 'D15: y el adjunto en IndexedDB');
    ok(await O.p.inputValue('#iDesc') !== 'Liberación que Firebase rechaza', 'D15: el formulario queda listo para otra (como siempre)');
    // Mientras siga pendiente de subir en esta sesión no se molesta (aunque el servidor aún no lo tenga)
    await O.p.evaluate(c => { new Function('s', c)(window.__fakeStore()); }, rechazar(id));
    await O.ctx.setOffline(false); await O.p.waitForTimeout(800);
    ok(!/no llegó a subirse/.test(await dlgTxt(O.p)), 'D15: con lo guardado aún en cola en esta sesión, no se ofrece nada');
    // Se cierra la app; luego Firebase rechaza la escritura (en el falso: el registro no llega) y se vuelve a entrar
    await reabrir(O.ctx, O.p);
    ok(/Un registro que guardaste sin señal no llegó a subirse/.test(await dlgTxt(O.p)), 'D15: al volver a entrar se avisa «Un registro que guardaste sin señal no llegó a subirse»');
    ok(/Liberación que Firebase rechaza/.test(await dlgTxt(O.p)) && /1 archivo adjunto/.test(await dlgTxt(O.p)), 'D15: el aviso dice cuál es (descripción y adjunto)');
    await O.p.click('.dlg.on [type=submit]'); await O.p.waitForTimeout(900);
    ok(await O.p.evaluate(() => document.body.classList.contains('v-nueva')) && await O.p.inputValue('#iDesc') === 'Liberación que Firebase rechaza', 'D15: «Recuperar en «Nueva»» lo pone como borrador de «Nueva»');
    ok(await O.p.$$eval('.arch', a => a.length) === 1 && /lev-/.test(await O.p.textContent('.arch')), 'D15: con su archivo adjunto');
    ok(Object.keys(await copias(O.p)).length === 0 && !(await idb(O.p, 'conf|operario@gmail.com|' + id)), 'D15: la copia ya no queda');
    // Se vuelve a guardar con señal: sube y no queda copia
    await O.p.click('#bGuardar'); await O.p.waitForTimeout(800);
    ok(Object.values(await st(O.p)).filter(x => x && x.descripcion === 'Liberación que Firebase rechaza').length === 1 && Object.keys(await copias(O.p)).length === 0, 'D15: guardado otra vez con señal, sube una sola vez y sin copia');

    // 2) Caso normal: se guarda sin señal y sí sube (aunque la app se cerró antes de confirmar): no se ofrece nada
    await llenar(O.p, 'Liberación que sí sube');
    await guardarSinSenal(O.ctx, O.p);
    ok(Object.keys(await copias(O.p)).length === 1, 'D15: (normal) queda la copia mientras no se confirma');
    await reabrir(O.ctx, O.p);
    ok(!/no llegó a subirse/.test(await dlgTxt(O.p)), 'D15: (normal) el registro está en Firebase: no se ofrece recuperar');
    ok(Object.keys(await copias(O.p)).length === 0, 'D15: (normal) y la copia se borra');

    // 3) Lo que la propia persona mandó a la papelera tampoco se ofrece
    await llenar(O.p, 'Liberación a la papelera');
    await guardarSinSenal(O.ctx, O.p);
    const idP = Object.keys(await copias(O.p))[0];
    await reabrir(O.ctx, O.p, `s['liberaciones/${idP}'].borrado = true;`);
    ok(!/no llegó a subirse/.test(await dlgTxt(O.p)) && Object.keys(await copias(O.p)).length === 0, 'D15: un registro en la papelera no se ofrece (el servidor lo tiene) y la copia se borra');

    // 4) Rechazo con la app abierta: vuelve al formulario como siempre y no queda copia
    await llenar(O.p, 'Liberación rechazada en la sesión');
    await O.ctx.setOffline(true); await O.p.evaluate(() => { window.__fakeOffline = true; window.__fakeNegar = true; });
    await O.p.click('#bGuardar'); await O.p.waitForTimeout(700);
    await O.p.evaluate(() => { window.__fakeNegar = false; window.__fakeOffline = false; }); await O.ctx.setOffline(false); await O.p.waitForTimeout(400);
    // «Nueva» ya tiene la descripción automática de la siguiente: se pregunta antes de reemplazarla (como antes)
    if (/Recuperar/.test(await dlgTxt(O.p))) { await O.p.click('.dlg.on [type=submit]'); await O.p.waitForTimeout(500); }
    ok(await O.p.inputValue('#iDesc') === 'Liberación rechazada en la sesión' && /No se pudo guardar/.test(await toastTxt(O.p)), 'D15: rechazo con la app abierta: lo escrito vuelve al formulario (como antes)');
    ok(Object.keys(await copias(O.p)).length === 0, 'D15: y no queda copia (no se ofrecerá después)');

    // 5) Descartar
    await O.p.fill('#iDesc', 'Liberación para descartar');
    await guardarSinSenal(O.ctx, O.p);
    const idD = Object.keys(await copias(O.p))[0];
    await reabrir(O.ctx, O.p, rechazar(idD));
    ok(/no llegó a subirse/.test(await dlgTxt(O.p)), 'D15: otro rechazado: se ofrece');
    await O.p.click('.dlg.on [data-descartar]'); await O.p.waitForSelector('.dlg.on [type=submit]'); await O.p.click('.dlg.on [type=submit]'); await O.p.waitForTimeout(500);
    ok(Object.keys(await copias(O.p)).length === 0 && !/Liberación para descartar/.test(await O.p.inputValue('#iDesc').catch(() => '')), 'D15: «Descartarlo» (con confirmación) borra la copia sin tocar «Nueva»');
    await O.p.reload(); await O.p.waitForSelector('#nav button'); await O.p.waitForTimeout(1000);
    ok(!/no llegó a subirse/.test(await dlgTxt(O.p)), 'D15: y no se vuelve a ofrecer');
    await O.ctx.close();
  }

  ok(!errores.length, 'sin errores en la consola: ' + errores.join(' | '));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
