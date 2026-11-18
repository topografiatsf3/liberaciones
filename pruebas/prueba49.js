// Lote 5 · Grupo A (Bandeja, Registros, Excel y Ctrl+K): G9 a G17 de la revisión v39 y el género de «seleccionado/a».
// G9 chips de estado con Ctrl/Mayús · G10 «Ver registros» de una importación · G11 Excel con «Seguimiento» y sin llamar «liberaciones» a todo
// G12 año en la fecha corta · G13 título de la columna de fecha · G14 Enter doble al abrir un diálogo · G15 (menú «⋯», sin cambio: lo cubre prueba24)
// G16 Ctrl+K con un diálogo abierto · G17 números del encabezado (lo que se ve y con separador de miles) · extra género en la Bandeja.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const filasXlsx = require('./xlsx');
const OUT = path.join(__dirname, 'capturas', 'prueba49'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const GAB = { uid: 'g1', email: 'gab@gmail.com', displayName: 'Gabi Gabinete' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const ahora = Date.now(), hora = 36e5, dia = 864e5;
const base = extra => ({ actividad: 'LIB', creadoPor: 'otro@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', estado: 'PT', descripcion: 'Registro', pkInicio: 100, pkFin: 140, fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, ...extra });
const DBbase = () => {
  const DB = { 'usuarios/gab@gmail.com': { nombre: 'Gabi Gabinete', rol: 'gabinete', activo: true } };
  DB['liberaciones/pt1'] = base({ descripcion: 'Pendiente uno', pkInicio: 100 });
  DB['liberaciones/pt2'] = base({ descripcion: 'Pendiente dos', pkInicio: 200, fechaCampo: { __ts: ahora - 2 * hora } });
  DB['liberaciones/ep1'] = base({ estado: 'EP', numero: 'SKT-TOP-02701', descripcion: 'En proceso uno', pkInicio: 300, fechaCampo: { __ts: ahora - 3 * hora }, fechaLiberacion: { __ts: ahora - 3 * hora } });
  DB['liberaciones/ep2'] = base({ estado: 'EP', numero: 'SKT-TOP-02702', descripcion: 'En proceso dos', pkInicio: 400, fechaCampo: { __ts: ahora - 4 * hora }, fechaLiberacion: { __ts: ahora - 4 * hora } });
  DB['liberaciones/ob1'] = base({ estado: 'OB', descripcion: 'Observada', notaObservacion: 'Falta foto', pkInicio: 500, fechaCampo: { __ts: ahora - 5 * hora } });
  DB['liberaciones/ant1'] = base({ estado: 'EC', numero: 'SKT-TOP-02001', descripcion: 'Antigua de otro año', pkInicio: 600, fechaCampo: { __ts: ahora - 800 * dia }, fechaLiberacion: { __ts: ahora - 800 * dia }, fechaEntrega: { __ts: ahora - 799 * dia } });
  DB['liberaciones/asp1'] = base({ actividad: 'ASP', estado: 'NA', tipoId: '', descripcion: 'Aspa por procesar', procesado: false, pkInicio: 700, fechaCampo: { __ts: ahora - 6 * hora } });
  DB['liberaciones/lev1'] = base({ actividad: 'LEV', estado: 'NA', tipoId: '', descripcion: 'Levantamiento por ver', visto: false, pkInicio: 800, fechaCampo: { __ts: ahora - 7 * hora } });
  DB['liberaciones/lev2'] = base({ actividad: 'LEV', estado: 'NA', tipoId: '', descripcion: 'Levantamiento enterado', visto: true, pkInicio: 900, fechaCampo: { __ts: ahora - 8 * hora } });
  return DB;
};
const esperar = (p, fn, arg, ms = 8000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
async function abrir(b, DB, user, filtros) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u, f]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); if (f) localStorage.setItem('lib.filtros.' + u.email, JSON.stringify(f)); }, [DB, user, filtros]);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(900);
  return { ctx, p };
}
const ir = async (p, v) => { await p.evaluate(v => { (document.querySelector(`#nav [data-v="${v}"]`) || document.querySelector(`[data-v="${v}"]`)).click(); }, v); await p.waitForTimeout(500); };
const lead = p => p.$eval('#view .lead', e => e.textContent.trim()).catch(() => '');
const pres = p => p.$$eval('#rSt [data-st]', bs => Object.fromEntries(bs.map(x => [x.dataset.st, x.getAttribute('aria-pressed')])));
const selFc = (p, v) => p.evaluate(v => { const e = document.querySelector('#rfFc'); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
let b;
(async () => {
  b = await chromium.launch();
  // ===== Administrador: Registros =====
  {
    const { ctx, p } = await abrir(b, { ...DBbase(), 'config/importaciones': { items: [{ id: 'imp-1', nombre: 'Carga de prueba', n: 2, fecha: ahora }, { id: 'imp-2', nombre: 'Carga grande', n: 1100, fecha: ahora }] },
      'liberaciones/im1': base({ origen: 'excel', lote: 'imp-1', estado: 'EC', numero: 'SKT-TOP-01001', descripcion: 'Importado uno', fechaCampo: { __ts: ahora - 700 * dia } }),
      'liberaciones/im2': base({ origen: 'excel', lote: 'imp-1', estado: 'EC', numero: 'SKT-TOP-01002', descripcion: 'Importado dos', fechaCampo: { __ts: ahora - 701 * dia } }),
      ...Object.fromEntries(Array.from({ length: 1100 }, (_, i) => ['liberaciones/g' + i, base({ origen: 'excel', lote: 'imp-2', estado: 'EC', numero: 'SKT-TOP-' + (20000 + i), descripcion: 'Grande ' + i, pkInicio: i, pkFin: i + 5, fechaCampo: { __ts: ahora - (900 + i) * dia } })])) },
      ADMIN, { mis: {}, todos: { fecha: 'hoy' } });
    // G10: «Ver registros» de una importación con el filtro «Hoy» recordado
    await ir(p, 'ajustes'); await p.click('#view [data-tab="historico"]'); await p.waitForSelector('#hLotes [data-lote="imp-1"]', { timeout: 10000 });
    await p.click('#hLotes [data-lote="imp-1"] [data-lk="ver"]');
    await esperar(p, () => document.querySelectorAll('#lista tbody tr').length > 0);
    let l = await lead(p);
    ok(/importaci[oó]n/i.test(l) && l.includes('Carga de prueba') && /2 registros/.test(l) && !/de todos/.test(l), 'G10: el encabezado dice que son los de esa importación y cuántos: «' + l + '»');
    ok(await p.$$eval('#lista tbody tr', t => t.length) === 2, 'G10: los filtros recordados (Hoy) no dejan la lista vacía: salen los 2 de la importación');
    ok(await p.$eval('#rfFecha', e => e.value).catch(() => '') === '', 'G10: el filtro de fecha quedó limpio');
    // G12: año en las fechas de otro año
    const tq = await p.$$eval('#lista tbody .tq', t => t.map(x => x.textContent.trim()));
    ok(tq.length && tq.every(t => /^\d\d\/\d\d\/\d{4} \d\d:\d\d/.test(t)), 'G12: las fechas de otro año llevan el año: ' + tq.join(' | '));
    // G17: miles
    await p.click('#rLoteX'); await p.waitForTimeout(300);
    await ir(p, 'ajustes'); await p.click('#view [data-tab="historico"]'); await p.waitForSelector('#hLotes [data-lote="imp-2"]');
    await p.click('#hLotes [data-lote="imp-2"] [data-lk="ver"]');
    await esperar(p, () => /1[,.\s\u00a0]?100/.test(document.querySelector('.imp-ver')?.textContent || ''), null, 20000);
    l = await lead(p); const av = await p.$eval('.imp-ver', e => e.textContent).catch(() => '');
    ok(/1[,\u00a0 ]100 registros/.test(l) && /1[,\u00a0 ]100 registros/.test(av), 'G17: 1100 sale con separador de miles en el encabezado y en el aviso: «' + l + '» / «' + av.trim() + '»');
    await p.click('#rLoteX'); await p.waitForTimeout(400);
    // Registros normal: filtros a mano
    await p.click('#rfX').catch(() => {}); await p.waitForTimeout(300);
    // G12: fecha de este año sin año, la de otro año con año
    const tq2 = await p.$$eval('#lista tbody tr', t => Object.fromEntries(t.map(x => [x.dataset.id, x.querySelector('.tq')?.textContent.trim() || ''])));
    ok(/^\d\d\/\d\d \d\d:\d\d/.test(tq2.pt1) && !/^\d\d\/\d\d\/\d{4}/.test(tq2.pt1), 'G12: la fecha de este año va sin año: ' + tq2.pt1);
    ok(/^\d\d\/\d\d\/\d{4} \d\d:\d\d/.test(tq2.ant1 || ''), 'G12: la de hace 800 días lleva el año: ' + tq2.ant1);
    // G9: chips con Ctrl y Mayús
    let pr = await pres(p);
    ok(pr[''] === 'true' && pr.PT === 'false', 'G9: sin elegir nada solo «Todos» está marcado');
    await p.click('#rSt [data-st="PT"]'); await p.waitForTimeout(250);
    pr = await pres(p); ok(pr.PT === 'true' && pr[''] === 'false', 'G9: un clic marca solo ese chip');
    await p.click('#rSt [data-st="EP"]', { modifiers: ['Control'] }); await p.waitForTimeout(250);
    pr = await pres(p);
    ok(pr.PT === 'true' && pr.EP === 'true' && pr[''] === 'false', 'G9: Ctrl+clic deja marcados los dos elegidos y «Todos» no: ' + JSON.stringify(pr));
    ok(await p.$$eval('#lista tbody tr', t => t.length) === 4, 'G9: la lista muestra los 4 (2 pendientes + 2 en proceso)');
    await p.click('#rSt [data-st="OB"]', { modifiers: ['Shift'] }); await p.waitForTimeout(250);
    pr = await pres(p); ok(pr.PT === 'true' && pr.EP === 'true' && pr.OB === 'true', 'G9: Mayús+clic suma un tercero marcado');
    await p.click('#rSt [data-st=""]'); await p.waitForTimeout(250);
    pr = await pres(p); ok(pr[''] === 'true' && pr.PT === 'false' && pr.EP === 'false', 'G9: «Todos» vuelve a marcarse y se sueltan los otros');
    // G13: título de la columna de fecha según «Filtrar por»
    const th = () => p.$eval('#lista thead th [data-hc="fe"]', e => e.textContent.trim()).catch(() => '');
    const t0 = await th(); ok(/^Fecha y top/.test(t0), 'G13: por defecto «Fecha y topógrafo»: ' + t0);
    await selFc(p, 'lib'); await p.waitForTimeout(500);
    const t1 = await th(); ok(/^Fecha de entrega y top/.test(t1), 'G13: filtrando por «Fecha de entrega» el título lo dice: ' + t1);
    await selFc(p, 'ent'); await p.waitForTimeout(500);
    const t2 = await th(); ok(/^Entrega a Calidad y top/.test(t2), 'G13: filtrando por «Entrega a Calidad» el título lo dice: ' + t2);
    await selFc(p, ''); await p.waitForTimeout(500);
    // G11: Excel con «Seguimiento»; mezclado de actividades no dice «liberaciones» en el resumen
    await p.check('#rAll'); await p.waitForTimeout(250);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#rBulk [data-rk="exportar"]')]);
    const f1 = path.join(OUT, 'mezcla.xlsx'); await dl.saveAs(f1);
    const filas = filasXlsx(f1), cab = filas.find(f => f && f.includes('Estado')), iSeg = cab ? cab.indexOf('Seguimiento') : -1;
    ok(iSeg > 0, 'G11: el Excel trae la columna «Seguimiento»');
    const iDesc = cab ? cab.indexOf('Descripción') : -1, seg = d => { const f = filas.find(x => x && x[iDesc] === d); return f ? f[iSeg] : null; };
    ok(seg('Aspa por procesar') === 'Por procesar' && seg('Levantamiento por ver') === 'Por ver' && seg('Levantamiento enterado') === 'Enterado' && !seg('Pendiente uno'), 'G11: Seguimiento: Por procesar / Por ver / Enterado y vacío para una liberación');
    const textoCab = filas.slice(0, filas.indexOf(cab)).flat().join(' ').replace(/LIBERACIONES TSF3/, '');
    const resum = (filas.flat().find(c => /^[\d,]+ (registros|liberaciones)/.test(c || '')) || '').split(' · ')[0];
    ok(/^[\d,]+ registros$/.test(resum) && /Reporte de registros/.test(textoCab), 'G11: con aspas y levantamientos mezclados el resumen dice «registros»: ' + textoCab.slice(0, 160));
    const h2 = filasXlsx(f1, 2).flat().join(' | ');
    ok(!/Liberaciones/.test(h2), 'G11: la hoja de resumen tampoco los llama «Liberaciones»');
    // Solo liberaciones: sigue diciendo «liberaciones» y sin columna Seguimiento
    await p.click('#rBulk [data-rk="limpiar"]'); await p.waitForTimeout(200);
    await p.click('#lista tr[data-id="pt1"] input[data-ck]'); await p.click('#lista tr[data-id="pt2"] input[data-ck]'); await p.waitForTimeout(250);
    const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#rBulk [data-rk="exportar"]')]);
    const f2 = path.join(OUT, 'liberaciones.xlsx'); await dl2.saveAs(f2);
    const fl2 = filasXlsx(f2), cab2 = fl2.find(f => f && f.includes('Estado'));
    ok(/2 liberaciones/.test(fl2.slice(0, fl2.indexOf(cab2)).flat().join(' ')) && !cab2.includes('Seguimiento'), 'G11: solo liberaciones: «2 liberaciones» y sin columna Seguimiento');
    await p.click('#rBulk [data-rk="limpiar"]'); await p.waitForTimeout(200);
    // G16: Ctrl+K con un diálogo abierto
    await ir(p, 'bandeja'); await p.click('#view [data-bt="EP"]'); await p.waitForTimeout(400);
    // G14: Enter doble sobre «Entregar» abre un solo diálogo
    await p.focus('#blist [data-rid="ep1"] [data-a="entregar"]');
    await p.keyboard.press('Enter'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    ok(await p.$$eval('.dlg', d => d.length) === 1, 'G14: Enter pulsado justo al abrir no abre un segundo diálogo igual');
    await p.keyboard.press('Control+k'); await p.waitForTimeout(400);
    ok(!(await p.$('#cmdk')), 'G16: Ctrl+K no abre el buscador encima de un diálogo');
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    ok(!(await p.$('.dlg')), 'el diálogo se cierra con Escape');
    await p.keyboard.press('Control+k'); await p.waitForTimeout(400);
    ok(!!(await p.$('#cmdk')), 'G16: sin diálogo, Ctrl+K sí abre el buscador');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    // Extra: género en la barra de acciones de la Bandeja
    await p.click('#view [data-bt="LEV"]'); await p.waitForTimeout(400);
    await p.click('#blist [data-rid="lev1"] input[data-sel]'); await p.waitForTimeout(300);
    ok(/1 seleccionado\b/.test(await p.$eval('#bBulk span', e => e.textContent)), 'Extra: Levantamientos dice «1 seleccionado»');
    await p.click('#view [data-bt="ASP"]'); await p.waitForTimeout(400);
    await p.click('#blist [data-rid="asp1"] input[data-sel]'); await p.waitForTimeout(300);
    ok(/1 seleccionada\b/.test(await p.$eval('#bBulk span', e => e.textContent)), 'Extra: Aspas dice «1 seleccionada»');
    await ctx.close();
  }
  // ===== Gabinete: G17 los eliminados no se cuentan =====
  {
    const DB = DBbase(); DB['liberaciones/x1'] = base({ estado: 'X', descripcion: 'Eliminada', pkInicio: 1000 }); DB['liberaciones/x2'] = base({ estado: 'X', descripcion: 'Eliminada dos', pkInicio: 1100 });
    const { ctx, p } = await abrir(b, DB, GAB);
    await ir(p, 'todos'); await p.waitForSelector('#lista tbody tr');
    const filas = await p.$$eval('#lista tbody tr', t => t.length), l = await lead(p), n = +(l.match(/últimos (\d+)/) || [])[1];
    ok(n === filas && filas === 9, `G17: «${l.slice(0, 40)}…» cuenta las ${filas} filas que se ven, no los eliminados`);
    await ctx.close();
  }
  ok(errores.length === 0, 'sin errores de página' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
})().catch(async e => { console.log('FALLA: error en la prueba:', e.message); process.exitCode = 1; if (b) await b.close(); });
