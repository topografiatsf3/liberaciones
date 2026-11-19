// Lote B de la auditoría (datos, lo fácil): D2, D16, D11, D13, D19, D17, D18, S4, S21 y R13.
// Uso: PUERTO=8789 node pruebas\prueba54.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); return !!c; };
const ahora = Date.now(), hora = 36e5;
const base = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', equipo: 'ET', estado: 'PT', descripcion: 'Registro', pkInicio: 100, pkFin: 140, fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, archivos: [], ...extra });
const DB = () => ({
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', topografoId: '', activo: true },
  'listas/tipos': { items: [['filtro1', 'Relleno filtro 1'], ['filtro2', 'Relleno filtro 2'], ['masivo', 'Relleno masivo']].map(([id, nombre], i) => ({ id, nombre, elementoId: 'mt', orden: i + 1, enGrafico: true })).concat([{ id: 'masivoo', nombre: 'Relleno masivoo', elementoId: 'mt', orden: 9, enGrafico: true, nuevo: true, creadoPor: 'operario@gmail.com', creadoNombre: 'Pedro Operario' }]) },
  'listas/topografos': { items: [{ id: 'GN', nombre: 'Gabriel Nuñez' }] },
  'listas/elementos': { items: [{ id: 'mt', nombre: 'Movimiento de tierras' }] },
  'listas/estructuras': { items: [{ id: 'pp', nombre: 'Presa Principal', subs: [{ id: 'pp-oeste', nombre: 'Presa Principal Oeste', pkMin: 0, pkMax: 2700 }, { id: 'pp-este', nombre: 'Presa Principal Este', pkMin: 0, pkMax: 1200 }] }] },
  'capas/pp-oeste': { tipos: { filtro1: { capas: [{ nombre: 'Capa 12', cota: '' }, { nombre: 'Capa 11' }], noAplica: [] }, masivoo: { capas: [{ nombre: 'Capa 1' }], noAplica: [] } } },
  'liberaciones/mi1': base({ descripcion: 'Mi primera', pkInicio: -12.5 }),
  'liberaciones/mi2': base({ descripcion: '=HYPERLINK("http://x","clic")', pkInicio: 300, pkFin: 340 }),
  'liberaciones/mi3': base({ descripcion: '+SUMA(1;2)', pkInicio: 400, pkFin: 440 }),
  'liberaciones/mi4': base({ descripcion: '-cmd|calc', subestructuraId: 'pp-este', pkInicio: 10, pkFin: 20 }),
  'liberaciones/mi5': base({ descripcion: '@usuario y texto normal', pkInicio: 500, pkFin: 540 }),
  'liberaciones/lv1': base({ actividad: 'LEV', estado: 'NA', descripcion: 'Levantamiento', tipoId: '', elementoId: '', capa: '' }),
  'liberaciones/as1': base({ actividad: 'ASP', estado: 'NA', descripcion: 'Aspas', tipoId: '', elementoId: '', capa: '' }),
  'liberaciones/mx1': base({ tipoId: 'masivoo', capa: 'Capa 1', descripcion: 'Con el tipo nuevo' }),
  'liberaciones/zz1': base({ tipoId: 'filtro2', capa: 'Capa 11', descripcion: 'Otro tipo' })
});
const rutas = async c => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
};
// «parche»: la app real no da a campo la lista de Registros con selección en grupo (solo ficha y menú, de a uno), así que
// SOLO en la prueba se le muestra esa lista (veTodo) para ejercitar aPapelera con varios registros como lo haría un topógrafo.
async function abrir(b, u, hash, db, extraLS, parche) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 800 }, acceptDownloads: true, serviceWorkers: 'block' }); await rutas(ctx);
  if (parche) await ctx.route(x => /\/(index\.html)?$/.test(new globalThis.URL(x).pathname), async r => { const resp = await r.fetch(); const t = (await resp.text()).replace('const veTodo = () => ["gabinete"', 'const veTodo = () => ["operario", "gabinete"').replace('MEDIO.matches) && poder();', 'MEDIO.matches) && (poder() || rol() === "operario");'); r.fulfill({ response: resp, body: t }); });
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u, x]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); for (const k in x || {}) localStorage.setItem(k, JSON.stringify(x[k])); }, [db || DB(), u, extraLS]);
  await p.goto(URL + (hash || '')); await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(700);
  return { ctx, p };
}
const ir = async (p, v) => { await p.evaluate(v => document.querySelector(`#nav [data-v="${v}"]`).click(), v); await p.waitForTimeout(500); };
const st = p => p.evaluate(() => window.__fakeStore());
const toastTxt = p => p.evaluate(() => document.querySelector('#toast').textContent);
const envios = p => p.evaluate(() => window.__fakeEnvios || []);
const marcar = async (p, ids) => { for (const id of ids) await p.evaluate(id => document.querySelector(`#view tr[data-id="${id}"] [data-ck]`).click(), id); await p.waitForTimeout(200); };

(async () => {
  const b = await chromium.launch();

  // ===== D2 + D16: campo manda a la papelera 2 o más; un éxito parcial se informa =====
  {
    const { ctx, p } = await abrir(b, OPER, '#todos', null, null, true);
    ok(await p.evaluate(() => !!document.querySelector('#nav [data-v="todos"]')), '(prueba) con el parche, el operario ve la lista de Registros');
    await ir(p, 'todos'); await p.waitForSelector('#view tr[data-id="mi1"]');
    await marcar(p, ['mi1', 'mi2', 'mi3']);
    await p.evaluate(() => { window.__fakeEnvios = []; window.__fakeFallar = rutas => rutas.includes('liberaciones/mi2'); }); // el envío de mi2 falla
    await p.click('#rBulk [data-rk="papelera"]'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(1200);
    const ev = (await envios(p)).filter(e => e.some(x => x.startsWith('update:liberaciones/')));
    ok(ev.length === 3 && ev.every(e => e.filter(x => x.startsWith('update:liberaciones/')).length === 1), 'D2: campo manda cada registro en su propio envío (' + ev.length + ' envíos de 1 registro)');
    const s1 = await st(p);
    ok(s1['liberaciones/mi1'].borrado && s1['liberaciones/mi3'].borrado && !s1['liberaciones/mi2'].borrado, 'D16: se guardaron 2 de 3 (mi2 falló)');
    const t = await toastTxt(p);
    ok(/se guardaron 2 de 3 registros; faltan 1/.test(t), 'D16: el aviso dice cuántos se hicieron y cuántos no: «' + t + '»');
    ok(!/sin permiso/.test(t), 'D16: no se informa como fallo total');
    // Reintento: solo falta mi2; lo ya hecho no se repite ni duplica su historial
    await p.evaluate(() => { window.__fakeFallar = null; window.__fakeEnvios = []; });
    await p.waitForSelector('#view tr[data-id="mi2"]');
    await p.evaluate(() => document.querySelector('[data-rk="limpiar"]')?.click()); await p.waitForTimeout(300);
    await marcar(p, ['mi2']);
    await p.click('#rBulk [data-rk="papelera"]'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(900);
    const s2 = await st(p), hb = Object.values(s2).filter(d => d.accion === 'borrado');
    ok(s2['liberaciones/mi2'].borrado && hb.length === 3 && new Set(hb.map(h => h.liberacionId)).size === 3, 'D16: al reintentar el historial queda con 1 anotación «borrado» por registro (' + hb.length + ')');
    // «Restaurar» en grupo y las demás acciones en grupo (estado, Enterado, carpeta, capa…) no son de campo (puedeRestaurar, poder()): no hay nada más que partir
    ok(await p.evaluate(() => !document.querySelector('[data-rk="restaurar"]')), 'D2: campo no tiene «Restaurar» en grupo (solo gabinete, jefe y admin)');
    await ctx.close();
  }

  // ===== D16: gabinete con más de 150 (2 lotes): uno falla y el aviso lo dice =====
  {
    const db = DB(); for (let i = 0; i < 160; i++) db['liberaciones/g' + String(i).padStart(3, '0')] = base({ descripcion: 'Grupo ' + i, fechaCampo: { __ts: ahora - 2 * hora - i * 1000 } });
    const { ctx, p } = await abrir(b, GAB, '#todos', db);
    await ir(p, 'todos'); await p.waitForSelector('#view tr[data-id="g000"]');
    for (let i = 0; i < 8; i++) { await p.evaluate(() => { (document.querySelector('#bMasSrv') || document.querySelector('#bMas'))?.click(); }); await p.waitForTimeout(350); } // «Ver más» hasta tener todos a la vista
    await p.evaluate(() => document.querySelector('#rAll').click()); await p.waitForTimeout(400);
    const n = await p.evaluate(() => document.querySelectorAll('#view tr[data-id] [data-ck]:checked').length);
    await p.evaluate(() => { window.__fakeEnvios = []; window.__fakeFallar = rutas => rutas.filter(x => x.startsWith('liberaciones/')).length < 150 && rutas.some(x => x.startsWith('liberaciones/')); }); // falla solo el lote chico (el último)
    await p.click('#rBulk [data-rk="papelera"]'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(2500);
    const ev = (await envios(p)).filter(e => e.some(x => x.startsWith('update:liberaciones/')));
    const t = await toastTxt(p), m = t.match(/se guardaron (\d+) de (\d+) registros; faltan (\d+)/);
    ok(ev.length === 2 && ev[0].filter(x => x.startsWith('update:liberaciones/')).length === 150, 'D2: gabinete con ' + n + ' registros va en lotes de 150 (' + ev.map(e => e.filter(x => x.startsWith('update:liberaciones/')).length).join(' + ') + ')');
    ok(m && +m[1] + +m[3] === +m[2] && +m[2] === n && +m[1] === 150, 'D16: el aviso dice 150 de ' + n + ' guardados y cuántos faltan: «' + t + '»');
    await p.evaluate(() => { window.__fakeFallar = null; });
    await ctx.close();
  }

  // ===== D2: gabinete sigue en lotes grandes =====
  {
    const { ctx, p } = await abrir(b, GAB, '#todos');
    await ir(p, 'todos'); await p.waitForSelector('#view tr[data-id="mi1"]');
    await marcar(p, ['mi1', 'mi2', 'mi3']);
    await p.evaluate(() => { window.__fakeEnvios = []; });
    await p.click('#rBulk [data-rk="papelera"]'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(1000);
    const ev = (await envios(p)).filter(e => e.some(x => x.startsWith('update:liberaciones/')));
    ok(ev.length === 1 && ev[0].filter(x => x.startsWith('update:liberaciones/')).length === 3, 'D2: gabinete manda los 3 en un solo envío (' + ev.length + ' envío(s))');
    await ctx.close();
  }

  // ===== D11 (capas desde registros y renombrar), D13, D17 (unir), D18 =====
  {
    const { ctx, p } = await abrir(b, ADMIN, '#ajustes');
    await p.evaluate(() => { window.__fakeLecturas = []; });
    await p.evaluate(() => document.querySelector('.ajgrid [data-tab="capas"]').click()); await p.waitForSelector('#cCapas');
    await p.selectOption('#cSub', 'pp-oeste'); await p.waitForTimeout(300); await p.selectOption('#cTipo', 'filtro1'); await p.waitForTimeout(400);
    await p.evaluate(() => { window.__fakeLecturas = []; });
    await p.click('#cDesdeReg'); await p.waitForTimeout(700);
    const l1 = (await p.evaluate(() => window.__fakeLecturas)).filter(x => x.col === 'liberaciones');
    ok(l1.length === 1 && l1[0].w.includes('tipoId') && l1[0].w.includes('subestructuraId'), 'D11: «Desde registros» lleva el filtro de frente y de tipo: ' + JSON.stringify(l1));
    // Renombrar una capa en uso: Capa 11 (2 registros de filtro1; zz1 es de otro tipo y no se toca)
    await p.evaluate(() => { window.__fakeLecturas = []; });
    const fila = n => `#cCapas .ct-row:has(input[value="${n}"]) [data-k="nom"]`;
    await p.fill(fila('Capa 11'), 'Capa 11B'); await p.press(fila('Capa 11'), 'Tab'); await p.waitForTimeout(500);
    if (await p.$('.dlg.on')) { await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(900); }
    const l2 = (await p.evaluate(() => window.__fakeLecturas)).filter(x => x.col === 'liberaciones');
    ok(l2.length >= 1 && l2.every(x => x.w.includes('tipoId') && x.w.includes('subestructuraId')), 'D11: renombrar capa lee solo frente + tipo: ' + JSON.stringify(l2));
    const s = await st(p);
    ok(s['liberaciones/mi1'].capa === 'Capa 11B' && s['liberaciones/zz1'].capa === 'Capa 11', 'D11: renombra los de su tipo y no toca los de otro (mi1=' + s['liberaciones/mi1'].capa + ', zz1=' + s['liberaciones/zz1'].capa + ')');
    await ctx.close();
  }

  // D13: «Nueva» lee 1 vez cada parte del resumen del frente
  {
    const { ctx, p } = await abrir(b, OPER, '#nueva');
    await ir(p, 'nueva'); await p.waitForSelector('#iEst');
    await p.evaluate(() => { window.__fakeLecturas = []; });
    await p.selectOption('#iEst', 'pp'); await p.selectOption('#iSub', 'pp-oeste'); await p.waitForTimeout(900);
    const l = (await p.evaluate(() => window.__fakeLecturas)).filter(x => x.doc && /^resumen\/pp-oeste/.test(x.doc));
    const por = {}; l.forEach(x => por[x.doc] = (por[x.doc] || 0) + 1);
    ok(l.length === 4 && Object.values(por).every(n => n === 1), 'D13: una sola lectura por parte del resumen del frente: ' + JSON.stringify(por));
    await ctx.close();
  }

  // D19: «Enterado» y «Procesado» dejan el seguimiento al día en el resumen
  {
    const { ctx, p } = await abrir(b, ADMIN, '#bandeja');
    await ir(p, 'bandeja');
    const filaRes = async id => { const s = await st(p); const k = Object.keys(s).filter(x => /^resumen\/pp-oeste/.test(x)).find(x => s[x].r && s[x].r[id]); return k ? s[k].r[id][9] : undefined; };
    await p.evaluate(() => document.querySelector('[data-bt="LEV"]')?.click()); await p.waitForTimeout(500);
    const hecho = async (id, boton) => { await p.evaluate(([id, bt]) => document.querySelector(`#blist [data-rid="${id}"] [data-a="${bt}"]`)?.click(), [id, boton]); await p.waitForTimeout(700); };
    await hecho('lv1', 'enterado');
    ok((await st(p))['liberaciones/lv1'].visto === true && await filaRes('lv1') === 1, 'D19: «Enterado» pone visto en el registro y seguimiento 1 en el resumen (' + await filaRes('lv1') + ')');
    await p.evaluate(() => document.querySelector('[data-bt="ASP"]')?.click()); await p.waitForTimeout(500);
    await hecho('as1', 'procesar');
    ok((await st(p))['liberaciones/as1'].procesado === true && await filaRes('as1') === 1, 'D19: «Procesado» pone procesado y seguimiento 1 en el resumen (' + await filaRes('as1') + ')');
    await ctx.close();
  }

  // D17: escuchas (solo avisan si no es un corte de red), unir con capas que fallan
  {
    const { ctx, p } = await abrir(b, ADMIN, '#ajustes');
    await p.evaluate(() => { document.querySelector('#toast').textContent = ''; });
    const n1 = await p.evaluate(() => window.__fakeEscuchaFalla('capas', 'unavailable')); await p.waitForTimeout(300);
    ok(n1 >= 1 && (await toastTxt(p)) === '', 'D17: un error pasajero de red (unavailable) en la escucha de capas no avisa');
    await p.evaluate(() => window.__fakeEscuchaFalla('capas', 'permission-denied')); await p.waitForTimeout(300);
    ok(/No se pudo leer las capas: sin permiso/.test(await toastTxt(p)), 'D17: un error real (permiso) avisa en español: «' + await toastTxt(p) + '»');
    await p.evaluate(() => { document.querySelector('#toast').textContent = ''; window.__fakeEscuchaFalla('capas', 'permission-denied'); }); await p.waitForTimeout(300);
    ok((await toastTxt(p)) === '', 'D17: y no repite el aviso en cada fallo');
    // Unir tipo con capas que fallan: el aviso final lo dice
    await p.evaluate(() => document.querySelector('.ajgrid [data-tab="tipos"]').click()); await p.waitForSelector('#nvBox [data-nt="masivoo"] [data-k="unirP"]');
    await p.evaluate(() => { window.__fakeFallar = rutas => rutas.includes('capas/pp-oeste'); });
    await p.click('#nvBox [data-nt="masivoo"] [data-k="unirP"]'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(1200);
    const tu = await toastTxt(p);
    ok(/capas no se pudo pasar/.test(tu), 'D17: unir con la configuración de capas fallando avisa: «' + tu + '»');
    ok((await st(p))['liberaciones/mx1'].tipoId === 'filtro1' || (await st(p))['liberaciones/mx1'].tipoId !== 'masivoo', 'D17: los registros sí se unieron');
    // Deshacer con capas que fallan
    await p.click('#toast .toast-btn'); await p.waitForTimeout(1200);
    const td = await toastTxt(p);
    ok(/capas no se pudo devolver/.test(td), 'D17: deshacer con la configuración de capas fallando avisa: «' + td + '»');
    await p.evaluate(() => { window.__fakeFallar = null; });
    await ctx.close();
  }

  // D17: leer la configuración y las secciones al quitar un frente
  {
    const { ctx, p } = await abrir(b, ADMIN, '#ajustes');
    ok(await p.evaluate(() => typeof window.__fakeLeerMal === 'undefined'), 'D17: (preparación) lectura de config/general aún no negada');
    await ctx.close();
    const c2 = await b.newContext({ viewport: { width: 1366, height: 800 } }); await rutas(c2); const q = await c2.newPage();
    q.on('pageerror', e => { errores.push(e.message); });
    await q.goto(URL); await q.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [DB(), ADMIN]);
    await q.addInitScript(() => { window.__fakeLeerMal = p => p === 'config/general'; });
    await q.goto(URL + '#ajustes'); await q.reload(); await q.waitForSelector('#nav button'); await q.waitForTimeout(900);
    ok(/No se pudo leer la configuración: sin permiso/.test(await toastTxt(q)), 'D17: si falla la lectura de config/general avisa: «' + await toastTxt(q) + '»');
    await c2.close();
  }

  // D18 (la copia del SDK real no se puede cargar con el Firebase falso: se comprueba el código) y R13 en el navegador
  {
    const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    ok(/persistentLocalCache\(\{ tabManager: persistentMultipleTabManager\(\), cacheSizeBytes: 100 \* 1024 \* 1024 \}\)/.test(src), 'D18: la caché sin señal se pide de 100 MB (cacheSizeBytes dentro de persistentLocalCache)');
    ok(/const LIM_FECHA = 3000;/.test(src) && /limit\(LIM_FECHA\)/.test(src) && />= LIM_FECHA/.test(src) && /\$\{LIM_FECHA\.toLocaleString/.test(src) && !/limit\(3000\)|>= 3000/.test(src), 'R13: el límite de 3.000 vive en una sola constante usada en la consulta, la comparación y el texto');
    const db = DB(); for (let i = 0; i < 3010; i++) db['liberaciones/m' + i] = base({ descripcion: 'Masivo ' + i, fechaCampo: { __ts: ahora - hora - i * 1000 } });
    const { ctx, p } = await abrir(b, ADMIN, '#todos', db, { ['lib.filtros.' + ADMIN.email]: { todos: { fecha: '7d' }, mis: {} } });
    await ir(p, 'todos'); await p.waitForSelector('.rf-nota', { timeout: 15000 }).catch(() => {});
    const nota = await p.evaluate(() => [...document.querySelectorAll('.rf-nota')].map(e => e.textContent).join(' | '));
    ok(/3[.,]?000 más recientes y los conteos son solo de esos/.test(nota), 'R13: el aviso dice que los conteos son de esos 3000: «' + nota + '»');
    await ctx.close();
  }

  // ===== S4 y S21: CSV =====
  {
    const { ctx, p } = await abrir(b, ADMIN, '#ajustes');
    await p.evaluate(() => document.querySelector('.ajgrid [data-tab="exportar"]').click()); await p.waitForSelector('#xReg');
    await p.click('[data-r="todo"]'); await p.waitForTimeout(200);
    await p.evaluate(() => { window.__revocados = []; const r = URL.revokeObjectURL; URL.revokeObjectURL = u => { window.__revocados.push(u); return r.call(URL, u); }; });
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#xReg')]);
    const f = path.join(require('os').tmpdir(), 'p54_' + Date.now() + '.csv'); await dl.saveAs(f);
    const buf = fs.readFileSync(f); fs.unlinkSync(f);
    ok(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF, 'S21: el CSV sigue empezando con el BOM (EF BB BF)');
    const txt = buf.toString('utf8').replace(/^﻿/, '');
    const celdas = txt.split(/\r\n/).map(l => l.split(','));
    const todo = txt;
    ok(todo.includes('\'=HYPERLINK(') , 'S4: «=HYPERLINK…» sale con apóstrofo delante');
    ok(todo.includes("'+SUMA(1;2)"), 'S4: «+SUMA…» (más y letra) sale con apóstrofo');
    ok(todo.includes("'-cmd|calc"), 'S4: «-cmd…» (menos y letra) sale con apóstrofo');
    ok(todo.includes("'@usuario y texto normal"), 'S4: «@…» sale con apóstrofo');
    ok(/(^|,)-12\.5(,|$)/m.test(todo) && !todo.includes("'-12.5"), 'S4: la cota/PK negativa «-12.5» no se toca');
    ok(!todo.includes("'Mi primera") && todo.includes('Mi primera'), 'S4: el texto normal no se toca');
    await p.waitForTimeout(4600);
    ok((await p.evaluate(() => window.__revocados.length)) >= 1, 'S21: la descarga libera el Blob (revokeObjectURL llamado)');
    await ctx.close();
  }

  await b.close();
  if (errores.length) { console.log('ERRORES de página:', errores.length); process.exitCode = 1; }
  console.log(process.exitCode ? 'HAY FALLAS' : 'TODO BIEN');
})();
