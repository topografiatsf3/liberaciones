// Lote F2 (auditoría de salud): lo que se unificó y cambia lo que la persona ve.
// (1) S5 · errGuardar: el texto de un guardado rechazado según el código de Firebase y según quién lo lee
//     (administrador: revisar las reglas; los demás: avisar al administrador). Nunca el mensaje en inglés.
//     Un onOk de un diálogo que falla avisa (antes solo quedaba en la consola).
// (2) S13 · Mayús + clic marca el tramo también en Aspas y Levantamientos de la Bandeja
// (3) S12 · Los tres buscadores (Bandeja de seguimiento #bq, capas del Modelo #cfQ, Ajustes → Capas #cQ)
//     conservan el foco y el cursor (o lo seleccionado) cuando llegan datos de otra persona o se repinta tras escribir
// Uso: PUERTO=8790 node pruebas/prueba60.js     (HTML=ruta\index.html la corre contra otro archivo)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const D = f => path.join(__dirname, 'datos', f);
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Jefe Prueba' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const FS = 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); return !!c; };
const HTML = process.env.HTML ? fs.readFileSync(process.env.HTML, 'utf8') : null;
// Firebase falso de las pruebas, con el código del error simulado a elegir: __fakeCodigo / __fakeMsg (solo en esta prueba)
const FAKE = fs.readFileSync(path.join(__dirname, 'fake', 'firebase-firestore.js'), 'utf8')
  .replace("const e = new Error('Fallo simulado del envío.'); e.code = 'internal';", "const e = new Error(window.__fakeMsg || 'Fallo simulado del envío.'); e.code = window.__fakeCodigo || 'internal';");
if (!FAKE.includes('__fakeCodigo')) { console.log('FALLA: no se pudo preparar el Firebase falso con códigos'); process.exit(1); }
const ahora = Date.now(), dia = 864e5;
const reg = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', creadoNombre: 'Pedro Operario', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 1', topografoId: 'GN', numero: '', equipo: 'GNSS', estado: 'PT', descripcion: 'Registro', observaciones: '', pkInicio: 100, pkFin: 140, fechaCampo: { __ts: ahora - dia }, creadoEn: { __ts: ahora - dia }, archivos: [], ...extra });
const DB = () => {
  const d = {
    'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
    'usuarios/jefe@gmail.com': { nombre: 'Jefe Prueba', rol: 'jefe', topografoId: '', activo: true },
    'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', topografoId: '', activo: true },
    'usuarios/otro@gmail.com': { nombre: 'Otro Usuario', rol: 'topografo', topografoId: 'GN', activo: false },
    'config/general': { obra: 'Prueba', prefijo: 'SKT-TOP-', digitos: 5, zona: 'America/Lima', resumenV: 2 },
    'contadores/skt': { ultimo: 100 },
    'listas/tipos': { items: [['filtro1', 'Relleno filtro 1', 'mt'], ['filtro2', 'Relleno filtro 2', 'mt']].map(([id, nombre, e], i) => ({ id, nombre, elementoId: e, orden: i + 1, enGrafico: true })) },
    'listas/elementos': { items: [{ id: 'mt', nombre: 'Movimiento de tierras' }] },
    'listas/topografos': { items: [{ id: 'GN', nombre: 'Gabriel Nuñez' }] },
    'listas/estructuras': { items: [{ id: 'pp', nombre: 'Presa Principal', subs: [{ id: 'pp-oeste', nombre: 'Presa Principal Oeste', pkMin: 0, pkMax: 2700 }, { id: 'pp-este', nombre: 'Presa Principal Este', pkMin: 0, pkMax: 1200 }] }] },
    'capas/pp-oeste': { tipos: { filtro1: { capas: ['Capa 1', 'Capa 2', 'Capa 3', 'Capa 10', 'Capa 11'].map(nombre => ({ nombre, cota: '' })), noAplica: [] } } },
    'liberaciones/pt1': reg({ descripcion: 'Pendiente uno' }), 'liberaciones/pt2': reg({ descripcion: 'Pendiente dos', pkInicio: 200, pkFin: 240 })
  };
  for (let i = 1; i <= 6; i++) {
    d['liberaciones/asp' + i] = reg({ actividad: 'ASP', estado: 'NA', tipoId: '', capa: '', descripcion: 'Aspas ' + i, procesado: false, pkInicio: 100 * i, pkFin: 100 * i + 20, creadoEn: { __ts: ahora - i * 36e5 }, fechaCampo: { __ts: ahora - i * 36e5 } });
    d['liberaciones/lev' + i] = reg({ actividad: 'LEV', estado: 'NA', tipoId: '', capa: '', descripcion: 'Levantamiento ' + i, visto: false, pkInicio: 100 * i, pkFin: 100 * i + 20, creadoEn: { __ts: ahora - i * 36e5 }, fechaCampo: { __ts: ahora - i * 36e5 } });
  }
  return d;
};
async function abrir(b, u, o = {}) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, serviceWorkers: 'block' });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; if (f === 'firebase-firestore.js') return r.fulfill({ body: FAKE, contentType: 'application/javascript' }); r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  if (HTML) await ctx.route(u => u.pathname === '/' || u.pathname === '/index.html', r => r.fulfill({ body: HTML, contentType: 'text/html; charset=utf-8' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  // (los errores que provoca la prueba a propósito: permisos, fallos simulados y el TypeError del diálogo)
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource|Fallo simulado|insufficient permissions|Escritura rota|too large/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.addInitScript(() => { window.__avisos = []; const ver = () => { const t = document.getElementById('toast'); if (t && t.textContent && window.__avisos[window.__avisos.length - 1] !== t.textContent) window.__avisos.push(t.textContent); };
    new MutationObserver(ver).observe(document, { subtree: true, childList: true, characterData: true }); });
  await p.goto(URL);
  await p.evaluate(([d, u, x]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); for (const k in x) localStorage.setItem(k, JSON.stringify(x[k])); }, [DB(), u, o.ls || {}]);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(700);
  return { ctx, p };
}
const ir = async (p, v) => { await p.evaluate(v => document.querySelector(`#nav [data-v="${v}"]`).click(), v); await p.waitForTimeout(400); };
const pestana = async (p, t) => { await ir(p, 'ajustes'); await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(350); };
const ultimoAviso = p => p.evaluate(() => window.__avisos[window.__avisos.length - 1] || '');
const limpiarAvisos = p => p.evaluate(() => { window.__avisos = []; });
const esperarAviso = (p, re) => p.waitForFunction(r => (window.__avisos || []).some(a => new RegExp(r).test(a)), re.source, { timeout: 6000 }).then(() => true).catch(() => false);
const cambiarDoc = (p, ruta, datos) => p.evaluate(async ([FS, ruta, datos]) => { const m = await import(FS); const [c, id] = ruta.split('/'); await m.setDoc(m.doc({}, c, id), datos); }, [FS, ruta, datos]);
const foco = (p, id) => p.evaluate(id => { const a = document.activeElement; return { id: a && a.id, s: a && a.selectionStart, e: a && a.selectionEnd, v: a && a.value }; }, id);

// Textos nuevos por código (los fija esta prueba)
const PERM_ADMIN = 'sin permiso. Revisa que las reglas de Firebase estén publicadas.';
const PERM_OTROS = 'sin permiso. Avisa al administrador.';
const CODIGOS = [
  ['unavailable', '', 'sin señal o el servicio no está disponible. Inténtalo de nuevo.'],
  ['deadline-exceeded', '', 'tardó demasiado. Inténtalo de nuevo.'],
  ['not-found', '', 'ya no existe (alguien lo borró).'],
  ['aborted', '', 'alguien lo cambió mientras tanto. Inténtalo de nuevo.'],
  ['resource-exhausted', '', 'se alcanzó el límite de lecturas o escrituras de hoy. Inténtalo mañana.'],
  ['invalid-argument', 'Document is too large: exceeds the maximum allowed size of 1,048,576 bytes.', 'es demasiado grande para guardarlo.'],
  ['unauthenticated', '', 'la sesión se cerró. Vuelve a entrar.'],
  ['internal', 'Some English message', 'error inesperado (internal).'],
  ['algo-raro', 'Unknown thing happened', 'error inesperado (algo-raro).']
];

(async () => {
  const b = await chromium.launch();

  // ===== (1) Administrador: Ajustes → Topógrafos → agregar, con cada código =====
  {
    const { ctx, p } = await abrir(b, ADMIN);
    await pestana(p, 'topografos'); await p.waitForSelector('#tpAdd');
    let n = 0; const agregar = async () => { n++; await limpiarAvisos(p); await p.fill('#tpId', 'Z' + String.fromCharCode(64 + n)); await p.fill('#tpNom', 'Rechazado ' + n); await p.click('#tpAdd'); await esperarAviso(p, /^No se guardó/); await p.waitForTimeout(150); return ultimoAviso(p); };
    await p.evaluate(() => { window.__fakeNegar = true; });
    let t = await agregar(); ok(t === 'No se guardó: ' + PERM_ADMIN, `administrador, sin permiso: «${t}»`);
    await p.evaluate(() => { window.__fakeNegar = false; window.__fakeFallar = () => true; });
    for (const [c, msg, txt] of CODIGOS) {
      await p.evaluate(([c, msg]) => { window.__fakeCodigo = c; window.__fakeMsg = msg; }, [c, msg]);
      t = await agregar(); ok(t === 'No se guardó: ' + txt && (!msg || !t.includes(msg)), `administrador, ${c}: «${t}»`);
    }
    await p.evaluate(() => { window.__fakeFallar = null; window.__fakeCodigo = ''; window.__fakeMsg = ''; });
    // Ya sin fallos se guarda (lo rechazado no quedó a medias)
    await p.fill('#tpId', 'ZQ'); await p.fill('#tpNom', 'Aceptado'); await p.click('#tpAdd'); await p.waitForTimeout(700);
    ok(await p.evaluate(() => (window.__fakeStore()['listas/topografos'].items || []).map(t => t.id).join()) === 'GN,ZQ', 'sin fallos, se guarda solo el último (los rechazados no quedaron)');
    // Lectura rechazada (errLeer): mismo texto que un guardado
    await ctx.close();
  }

  // ===== (1b) Jefe de área: el mismo rechazo le dice que avise al administrador =====
  {
    const { ctx, p } = await abrir(b, JEFE);
    await pestana(p, 'topografos'); await p.waitForSelector('#tpAdd');
    await p.evaluate(() => { window.__fakeNegar = true; }); await limpiarAvisos(p);
    await p.fill('#tpId', 'ZZ'); await p.fill('#tpNom', 'Rechazado'); await p.click('#tpAdd'); await esperarAviso(p, /^No se guardó/);
    let t = await ultimoAviso(p); ok(t === 'No se guardó: ' + PERM_OTROS, `jefe, sin permiso: «${t}»`);
    ok(!/reglas/i.test(t), 'a quien no es administrador no se le habla de las reglas de Firebase');
    await p.evaluate(() => { window.__fakeNegar = false; });
    await ctx.close();
  }

  // ===== (1c) Operario: guardar en «Nueva» rechazado =====
  {
    const { ctx, p } = await abrir(b, OPER);
    await ir(p, 'mis');
    await p.evaluate(() => document.querySelector('#view [data-id="pt1"]')?.click()); await p.waitForSelector('#sheet:not([hidden])');
    await p.evaluate(() => [...document.querySelectorAll('#sheet button')].find(x => /Editar/.test(x.textContent))?.click()); await p.waitForSelector('#fLib');
    await p.fill('#iDesc', 'Pendiente uno corregido'); await p.evaluate(() => { window.__fakeNegar = true; }); await limpiarAvisos(p);
    await p.click('#bGuardar'); await esperarAviso(p, /^No se pudo guardar/);
    const t = await ultimoAviso(p); ok(t === 'No se pudo guardar: ' + PERM_OTROS + ' Lo escrito sigue en el formulario.', `operario, editar sin permiso: «${t}»`);
    await p.evaluate(() => { window.__fakeNegar = false; });
    await ctx.close();
  }

  // ===== (1d) Gabinete: un diálogo cuyo onOk falla (error que nadie esperaba) avisa y queda abierto =====
  {
    const { ctx, p } = await abrir(b, GAB);
    await ir(p, 'bandeja'); await p.waitForSelector('#blist [data-rid="pt1"] [data-sel]');
    await p.click('#blist [data-rid="pt1"] [data-sel]'); await p.waitForTimeout(250); await p.click('#bBulk [data-bk="observar"]'); await p.waitForSelector('.dlg.on textarea, .dlg.on [name="nota"]'); await p.waitForTimeout(250);
    await p.fill('.dlg.on [name="nota"]', 'Falta el CSV');
    await p.evaluate(() => { window.__fakeFallar = () => { throw new TypeError('Escritura rota'); }; }); await limpiarAvisos(p);
    await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(900);
    const t = await ultimoAviso(p);
    ok(t === 'No se guardó: error inesperado (TypeError).', `onOk que falla: avisa «${t}»`);
    ok(await p.evaluate(() => !!document.querySelector('.dlg.on') && !document.querySelector('.dlg.on [type=submit]').disabled), 'y el diálogo queda abierto, listo para reintentar');
    ok(await p.evaluate(() => window.__fakeStore()['liberaciones/pt1'].estado) === 'PT', 'el registro no cambió');
    await p.evaluate(() => { window.__fakeFallar = null; }); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await ctx.close();
  }
  // Aspas solo las ve quien entra a Ajustes: estas dos partes, con el administrador
  {
    const { ctx, p } = await abrir(b, ADMIN);
    await ir(p, 'bandeja'); await p.waitForSelector('.tabs [data-bt="ASP"]');
    // ===== (2) Mayús + clic en Aspas y Levantamientos =====
    for (const [tab, pref] of [['ASP', 'asp'], ['LEV', 'lev']]) {
      await p.click(`.tabs [data-bt="${tab}"]`); await p.waitForSelector(`#blist [data-rid="${pref}1"]`); await p.waitForTimeout(300);
      const orden = await p.$$eval('#blist [data-rid]', r => [...new Set(r.map(x => x.dataset.rid))]);
      await p.click(`#blist [data-rid="${orden[0]}"] [data-sel]`); await p.waitForTimeout(250);
      await p.click(`#blist [data-rid="${orden[3]}"] [data-sel]`, { modifiers: ['Shift'] }); await p.waitForTimeout(300);
      const marcadas = await p.$$eval('#blist [data-sel]:checked', c => [...new Set(c.map(x => x.closest('[data-rid]').dataset.rid))]);
      ok(marcadas.join() === orden.slice(0, 4).join(), `${tab}: Mayús + clic marca el tramo (${marcadas.join()})`);
      await p.click(`#blist [data-rid="${orden[1]}"] [data-sel]`, { modifiers: ['Shift'] }); await p.waitForTimeout(300);
      const tras = await p.$$eval('#blist [data-sel]:checked', c => [...new Set(c.map(x => x.closest('[data-rid]').dataset.rid))]);
      ok(tras.join() === orden[0], `${tab}: Mayús + clic en una marcada desmarca el tramo desde la última tocada (${tras.join()})`);
      await p.click(`#blist [data-rid="${orden[5]}"] [data-sel]`); await p.waitForTimeout(250);
      const sin = await p.$$eval('#blist [data-sel]:checked', c => c.length);
      ok(sin === tras.length + 1, `${tab}: sin Mayús, el clic marca solo esa (${sin})`);
      await p.evaluate(() => document.querySelector('#bBulk [data-bk="limpiar"]')?.click()); await p.waitForTimeout(250);
    }

    // ===== (3a) Buscador de la Bandeja de seguimiento (#bq) =====
    await p.click('.tabs [data-bt="ASP"]'); await p.waitForSelector('#bq'); await p.waitForTimeout(300);
    await p.click('#bq'); await p.keyboard.type('aspas'); await p.evaluate(() => document.querySelector('#bq').setSelectionRange(1, 3)); await p.waitForTimeout(400);
    let f = await foco(p); ok(f.id === 'bq' && f.s === 1 && f.e === 3 && f.v === 'aspas', `#bq: al repintar tras escribir conserva el foco y lo seleccionado (${JSON.stringify(f)})`);
    await p.evaluate(() => document.querySelector('#bq').setSelectionRange(2, 2));
    await cambiarDoc(p, 'liberaciones/asp9', reg({ actividad: 'ASP', estado: 'NA', tipoId: '', capa: '', descripcion: 'Aspas de otra persona', procesado: false, creadoPor: 'otro@gmail.com', creadoEn: { __ts: Date.now() }, fechaCampo: { __ts: Date.now() } }));
    await p.waitForFunction(() => /otra persona/.test(document.querySelector('#blist')?.textContent || ''), null, { timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(300);
    f = await foco(p); ok(f.id === 'bq' && f.s === 2 && f.e === 2, `#bq: llegan aspas de otra persona y el foco y el cursor siguen (${JSON.stringify(f)})`);
    ok(await p.evaluate(() => /otra persona/.test(document.querySelector('#blist').textContent)), '#bq: y la lista ya las muestra');
    // Sin el foco en el buscador, un repintado no se lo da
    await p.evaluate(() => document.activeElement.blur()); await p.evaluate(() => { const i = document.querySelector('#bq'); i.value = 'aspa'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(400);
    f = await foco(p); ok(f.id !== 'bq', `#bq: si no tenía el foco, el repintado no se lo da (foco en «${f.id || 'body'}»)`);
    await ctx.close();
  }

  // ===== (3b) Ajustes → Capas (#cQ) =====
  {
    const { ctx, p } = await abrir(b, JEFE);
    await pestana(p, 'capas'); await p.waitForSelector('#cQ');
    await p.click('#cQ'); await p.keyboard.type('capa 1'); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('#cQ').setSelectionRange(2, 4));
    await cambiarDoc(p, 'capas/pp-oeste', { tipos: { filtro1: { capas: ['Capa 1', 'Capa 2', 'Capa 3', 'Capa 10', 'Capa 11', 'Capa 12'].map(nombre => ({ nombre, cota: '' })), noAplica: [] } } });
    await p.waitForTimeout(600);
    let f = await foco(p); ok(f.id === 'cQ' && f.s === 2 && f.e === 4 && f.v === 'capa 1', `#cQ: llega una capa que agregó otra persona y el foco y lo seleccionado siguen (${JSON.stringify(f)})`);
    await p.keyboard.type('2'); await p.waitForTimeout(300);
    f = await foco(p); ok(f.id === 'cQ' && f.v === 'ca2 1' && f.s === 3, `#cQ: al escribir sobre lo seleccionado el cursor queda tras lo escrito (${JSON.stringify(f)})`);
    await p.evaluate(() => document.activeElement.blur()); await p.evaluate(() => { const i = document.querySelector('#cQ'); i.value = 'capa'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(300);
    f = await foco(p); ok(f.id !== 'cQ', `#cQ: si no tenía el foco, el repintado no se lo da (foco en «${f.id || 'body'}»)`);
    await ctx.close();
  }

  // ===== (3c) Panel → Modelo 2D → lista de capas (#cfQ) =====
  {
    const { ctx, p } = await abrir(b, ADMIN, { ls: { 'lib.panelSub': 'pp-oeste', 'lib.panelVista': 'modelo' } });
    await ir(p, 'panel'); await p.waitForSelector('#mBody');
    await p.setInputFiles('#mFile', D('eje-prueba.xml')); await p.waitForSelector('.dlg.on .mprev-r'); await p.click('.dlg.on [type=submit]');
    await p.waitForFunction(() => window.__fakeStore()['secciones/pp-oeste'], null, { timeout: 10000 }); await p.waitForTimeout(800);
    ok(!!await p.$('#cfQ'), 'el modelo muestra su lista de capas con buscador');
    await p.click('#cfQ'); await p.keyboard.type('stn'); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('#cfQ').setSelectionRange(1, 1));
    let f = await foco(p); ok(f.id === 'cfQ' && f.s === 1 && f.v === 'stn', `#cfQ: escribir conserva el foco y el cursor (${JSON.stringify(f)})`);
    // Otra persona sube una superficie al mismo frente
    const st = await p.evaluate(() => window.__fakeStore()), sid = Object.keys(st).find(k => k.startsWith('superficies/pp-oeste~'));
    if (sid) { const x = JSON.parse(JSON.stringify(st[sid])); x.codigo = 'SKT-TOP-09999'; x.v = (x.v || 0) + 1; await cambiarDoc(p, sid.replace(/~.*/, '~otra-persona'), x); }
    await p.waitForTimeout(800);
    f = await foco(p); ok(f.id === 'cfQ' && f.s === 1 && f.e === 1 && f.v === 'stn', `#cfQ: llega una superficie de otra persona y el foco y el cursor siguen (${JSON.stringify(f)})`);
    await p.evaluate(() => document.activeElement.blur()); await p.evaluate(() => { const i = document.querySelector('#cfQ'); i.value = 'st'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(300);
    f = await foco(p); ok(f.id !== 'cfQ', `#cfQ: si no tenía el foco, el repintado no se lo da (foco en «${f.id || 'body'}»)`);
    await ctx.close();
  }

  await b.close();
  ok(errores.length === 0, 'sin errores en la consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
})();
