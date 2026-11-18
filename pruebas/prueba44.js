// Versión 40: las filas resumidas del historial (Registros con texto en el buscador) se trabajan como las completas.
// G1 flechas y «siguiente» en la ficha · G2 Observar, Devolver y Entregar (con su XML) desde «⋯» y en grupo · G3 la fila
// cambia al instante sin reescribir · G4 Excel con descripción y fechas (sin señal no exporta) · G5 «Enterado»/«Por ver» de
// levantamientos antiguos (y las entradas viejas del resumen, sin el dato, siguen sin etiqueta).
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const { supXml } = require('./xml'); const filasXlsx = require('./xlsx');
const OUT = path.join(__dirname, 'capturas', 'prueba44'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const D = f => path.join(__dirname, 'datos', f);
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const ahora = Date.now(), hora = 36e5, N = 150;
const cod = i => 'SKT-TOP-' + String(10000 + i);
const id = i => 'r' + String(i).padStart(3, '0');
const capas = { tipos: { filtro1: { capas: [{ nombre: 'Capa 11' }], noAplica: [] } } };
const DB = { 'capas/pp-oeste': capas };
// Los 100 más recientes son de la app; los antiguos (r100…r149) vienen del Excel: solo están en el resumen (filas «_res»)
for (let i = 0; i < N; i++) {
  const t = ahora - (i + 1) * hora;
  DB['liberaciones/' + id(i)] = { actividad: 'LIB', creadoPor: 'otro@gmail.com', origen: i < 100 ? 'app' : 'excel', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', estado: 'EP', numero: cod(i), descripcion: 'Descripción del registro ' + i, generadoPor: 'Gabinete Uno', pkInicio: i * 100, pkFin: i * 100 + 40, fechaCampo: { __ts: t }, creadoEn: { __ts: t }, fechaLiberacion: { __ts: t + 6e5 }, archivos: [] };
}
// Levantamientos antiguos (del Excel): uno enterado, uno por ver y uno cuya entrada del resumen es de antes (sin el dato)
const lev = (pk, visto, dias) => ({ actividad: 'LEV', creadoPor: 'otro@gmail.com', origen: 'excel', estructuraId: 'pp', subestructuraId: 'pp-oeste', tipoId: 'filtro1', topografoId: 'GN', estado: 'NA', descripcion: 'Levantamiento ' + pk, pkInicio: pk, pkFin: pk + 20, fechaCampo: { __ts: ahora - dias * 864e5 }, creadoEn: { __ts: ahora - dias * 864e5 }, archivos: [], ...(visto ? { visto: true, vistoPor: 'gabinete@gmail.com', vistoNombre: 'Gabinete' } : {}) });
DB['liberaciones/lev1'] = lev(90000, true, 40); DB['liberaciones/lev2'] = lev(91000, false, 41); DB['liberaciones/lev3'] = lev(92000, true, 42);
const lead = p => p.$eval('#view .lead', e => e.textContent.trim());
const store = p => p.evaluate(() => window.__fakeStore());
const esperar = (p, fn, arg, ms = 15000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
const fnum = p => p.$eval('#sheet .fnum', e => e.textContent.trim()).catch(() => '');
const filaSt = (p, rid) => p.$eval(`#lista tr[data-id="${rid}"] .tcod`, e => e.textContent).catch(() => '');
async function subirXml(p, archivos) {
  await p.evaluate(() => { document.querySelector('.dlg.on #dXmlE').innerHTML = '<p>__esperando</p>'; });
  await p.setInputFiles('.dlg.on #dXml', archivos);
  await esperar(p, () => { const t = document.querySelector('.dlg.on #dXmlE')?.textContent || ''; return !/__esperando|Leyendo/.test(t); });
}
async function menu(p, rid, txt) { await p.click(`#lista tr[data-id="${rid}"] [data-mas]`); await p.waitForSelector('#ctx .ctx-i'); await p.click(`#ctx .ctx-i:has-text("${txt}")`); }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|ERR_INTERNET_DISCONNECTED/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  p.on('dialog', d => d.accept());
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('modelo')); }, [DB, ADMIN]);
  await p.reload(); await p.waitForSelector('#nav button');
  await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('resumen/')), null, { timeout: 30000 });
  await p.waitForTimeout(1200);
  // G5 (compatibilidad): la entrada de lev3 queda como las de antes (9 elementos, sin el seguimiento)
  const resDe = (st, rid) => Object.entries(st).find(([k, v]) => k.startsWith('resumen/') && v.r && v.r[rid]);
  let st = await store(p);
  ok(resDe(st, 'lev1')?.[1].r.lev1.length === 10 && resDe(st, 'lev1')[1].r.lev1[9] === 1 && resDe(st, 'lev2')[1].r.lev2[9] === 0 && resDe(st, id(120))[1].r[id(120)].length === 10, 'el resumen reconstruido trae el seguimiento al final (1 enterado, 0 por ver)');
  await p.evaluate(() => { const s = window.__fakeStore(), k = Object.keys(s).find(k => k.startsWith('resumen/') && s[k].r && s[k].r.lev3); s[k].r.lev3 = s[k].r.lev3.slice(0, 9); localStorage.setItem('__fakeDB', JSON.stringify(s)); });
  // Eje del frente (para entregar con XML)
  await p.click('[data-v="panel"]'); await p.waitForSelector('#mBody');
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await p.waitForSelector('.dlg.on [type=submit]'); await p.waitForTimeout(250); await p.click('.dlg.on [type=submit]');
  await esperar(p, () => window.__fakeStore()['secciones/pp-oeste']);

  await p.click('#nav [data-v="todos"]'); await p.waitForSelector('#q'); await p.waitForTimeout(500);
  await p.click('#q'); await p.keyboard.type('SKT-TOP-1014', { delay: 15 });
  await esperar(p, () => document.querySelectorAll('#lista tr[data-id]').length === 10);
  const orden = await p.$$eval('#lista tr[data-id]', t => t.map(e => e.dataset.id));
  ok(orden.length === 10 && orden.every(x => /^r14\d$/.test(x)), 'el buscador trae los 10 antiguos (filas resumidas): ' + orden.join(','));
  const codDe = rid => cod(+rid.slice(1));

  // G1: ficha desde una fila resumida, flechas y botón ›
  await p.click(`#lista tr[data-id="${orden[0]}"] td:nth-child(4)`); await p.waitForSelector('#sheet.on');
  await esperar(p, c => document.querySelector('#sheet .fnum')?.textContent.trim() === c, codDe(orden[0]));
  ok(/1 de 10/.test(await p.$eval('#sheet .fnav', e => e.textContent)), 'la ficha dice «1 de 10»');
  ok(/Descripción del registro/.test(await p.textContent('#sheet')), 'la ficha es el registro completo (trae la descripción)');
  await p.keyboard.press('ArrowRight');
  ok(await esperar(p, c => document.querySelector('#sheet .fnum')?.textContent.trim() === c, codDe(orden[1]), 5000), '→ pasa al 2.º (fila resumida, se lee al llegar): ' + await fnum(p));
  await p.click('#sheet [data-fnav="1"]');
  ok(await esperar(p, c => document.querySelector('#sheet .fnum')?.textContent.trim() === c, codDe(orden[2]), 5000), 'el botón › pasa al 3.º: ' + await fnum(p));
  await p.click('#sheet [data-fnav="-1"]');
  ok(await esperar(p, c => document.querySelector('#sheet .fnum')?.textContent.trim() === c, codDe(orden[1]), 5000), 'el botón ‹ vuelve al 2.º');
  ok(/2 de 10/.test(await p.$eval('#sheet .fnav', e => e.textContent)), 'y dice «2 de 10»');
  // Acción desde la ficha: pasa al siguiente (no se cierra) y la fila cambia en la lista sin reescribir la búsqueda
  await p.click('#fObservar'); await p.waitForSelector('.dlg.on #dNota'); await p.fill('.dlg.on #dNota', 'Revisar el PK'); await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, rid => window.__fakeStore()['liberaciones/' + rid]?.estado === 'OB', orden[1]), '«Observar» desde la ficha guarda OB');
  ok(await esperar(p, c => document.querySelector('#sheet .fnum')?.textContent.trim() === c, codDe(orden[2]), 5000) && await p.$eval('#sheet', e => !e.hidden), 'tras la acción, la ficha pasa al siguiente (3.º) en vez de cerrarse: ' + await fnum(p));
  ok(await esperar(p, rid => /Observado/.test(document.querySelector(`#lista tr[data-id="${rid}"] .tcod`)?.textContent || ''), orden[1], 5000), 'G3: la fila del 2.º ya dice «Observado» sin reescribir la búsqueda');
  ok(await p.$eval('#q', e => e.value) === 'SKT-TOP-1014', 'el buscador conserva el texto');
  ok(/Observado\s*1/.test(await p.textContent('#rSt')), 'G3: el chip «Observado» cuenta 1');
  await p.screenshot({ path: OUT + '/01-ficha-siguiente.png' });
  await p.click('#fX'); await p.waitForTimeout(500);

  // G2: Observar y Devolver desde «⋯» de una fila resumida
  const rObs = orden[3];
  await menu(p, rObs, 'Observar'); await p.waitForSelector('.dlg.on #dNota');
  await p.fill('.dlg.on #dNota', 'Falta el plano'); await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, rid => window.__fakeStore()['liberaciones/' + rid]?.estado === 'OB', rObs), '«⋯ → Observar» en una fila resumida guarda OB');
  st = await store(p);
  ok(st['liberaciones/' + rObs].notaObservacion === 'Falta el plano' && st['liberaciones/' + rObs].descripcion === 'Descripción del registro ' + rObs.slice(1) * 1, 'con su nota y sin tocar lo demás');
  ok(!/No se encontró/.test(await p.textContent('#toast')), 'sin «No se encontró el registro»');
  ok(await esperar(p, rid => /Observado/.test(document.querySelector(`#lista tr[data-id="${rid}"] .tcod`)?.textContent || ''), rObs, 5000), 'G3: la fila dice «Observado» al instante');
  await menu(p, rObs, 'Devolver a pendientes');
  ok(await esperar(p, rid => window.__fakeStore()['liberaciones/' + rid]?.estado === 'PT', rObs), '«⋯ → Devolver a pendientes» en una fila resumida guarda PT');
  ok(await esperar(p, rid => /Pendiente topografía/.test(document.querySelector(`#lista tr[data-id="${rid}"] .tcod`)?.textContent || ''), rObs, 5000), 'G3: y la fila lo muestra');
  const resObs = resDe(await store(p), rObs);
  ok(resObs && resObs[1].r[rObs][4] === 'PT', 'el resumen del registro también quedó en PT');

  // G2: Entregar en grupo (exige el XML de cada uno)
  const [e1, e2] = [orden[4], orden[5]];
  await p.click(`#lista tr[data-id="${e1}"] td.ck`); await p.click(`#lista tr[data-id="${e2}"] td.ck`);
  await p.waitForSelector('#rBulk [data-rk="entregar"]');
  await p.click('#rBulk [data-rk="entregar"]'); await p.waitForSelector('.dlg.on #dXml', { state: 'attached' });
  const lis = await p.$$eval('.dlg.on #dXmlL li', l => l.map(x => x.textContent));
  ok(lis.length === 2 && lis.every(t => /Falta XML/.test(t)) && lis.some(t => t.includes(codDe(e1))) && lis.some(t => t.includes(codDe(e2))), 'entregar en grupo: la lista de XML trae los 2 códigos («Falta XML»): ' + lis.join(' | '));
  await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(500);
  st = await store(p);
  ok(/Faltan 2 XML/.test(await p.textContent('#toast')) && st['liberaciones/' + e1].estado === 'EP' && st['liberaciones/' + e2].estado === 'EP', 'sin XML no entrega: «Faltan 2 XML» y siguen en proceso');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  // Desde «⋯»: con el XML de su código sí se entrega
  await menu(p, e1, 'Entregar a Calidad'); await p.waitForSelector('.dlg.on #dXml', { state: 'attached' });
  ok((await p.$$eval('.dlg.on #dXmlL li', l => l.map(x => x.textContent))).join('').includes(codDe(e1)), '«⋯ → Entregar» muestra el código en la lista de XML');
  await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(400);
  ok((await store(p))['liberaciones/' + e1].estado === 'EP', 'sin XML no se salta el control');
  await subirXml(p, supXml(codDe(e1), e1 + '.xml'));
  await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, rid => window.__fakeStore()['liberaciones/' + rid]?.estado === 'EC', e1), 'con el XML de su código se entrega a Calidad');
  st = await store(p);
  ok((st['liberaciones/' + e1].xmlEntrega || []).length === 1 && st['liberaciones/' + e1].fechaEntrega, 'guarda el XML y la fecha de entrega');
  ok(await esperar(p, rid => /Entregado a Calidad/.test(document.querySelector(`#lista tr[data-id="${rid}"] .tcod`)?.textContent || ''), e1, 5000), 'G3: la fila dice «Entregado a Calidad»');
  await p.screenshot({ path: OUT + '/02-entregado.png' });

  // G4: Excel de filas resumidas con los datos completos
  await p.click('#rBulk [data-rk="limpiar"]').catch(() => {}); await p.waitForTimeout(300);
  const ex = [orden[6], orden[7], orden[8]];
  for (const r of ex) await p.click(`#lista tr[data-id="${r}"] td.ck`);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#rBulk [data-rk="exportar"]')]);
  const f1 = path.join(OUT, 'seleccion.xlsx'); await dl.saveAs(f1);
  const filas = filasXlsx(f1).filter(Boolean), cab = filas.find(f => f.includes('Descripción')) || [];
  const col = t => cab.indexOf(t), datos = filas.slice(filas.indexOf(cab) + 1).filter(f => f && f[1]);
  ok(['Descripción', 'Fecha de entrega', 'Elemento', 'Generado por', 'Registrado por'].every(t => col(t) >= 0), 'Excel de la selección: trae Descripción, Fecha de entrega, Elemento, Generado por y Registrado por: ' + cab.join('|'));
  ok(datos.length === 3 && datos.every(f => /Descripción del registro 14\d/.test(f[col('Descripción')]) && f[col('Fecha de entrega')] && f[col('Generado por')] === 'Gabinete Uno'), 'las 3 filas traen descripción, fecha de entrega y quién generó');
  // «Excel: lo filtrado» (las 10 de la búsqueda)
  const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#rExp')]);
  const f2 = path.join(OUT, 'filtrado.xlsx'); await dl2.saveAs(f2);
  const fil2 = filasXlsx(f2).filter(Boolean), cab2 = fil2.find(f => f.includes('Descripción')) || [], dat2 = fil2.slice(fil2.indexOf(cab2) + 1).filter(f => f && f[1]);
  ok(dat2.length === 10 && dat2.every(f => /Descripción del registro 14\d/.test(f[cab2.indexOf('Descripción')])), '«Excel: lo filtrado» con las 10 descripciones');
  // Sin señal: no exporta (para no sacar un Excel incompleto) y lo dice
  await ctx.setOffline(true); await p.waitForTimeout(200);
  let bajo = false; const oyente = () => { bajo = true; }; p.on('download', oyente);
  // Filas que aún no se leyeron: una búsqueda nueva con otros antiguos
  await p.fill('#q', ''); await p.click('#q'); await p.keyboard.type('SKT-TOP-1013', { delay: 15 });
  await esperar(p, () => !!document.querySelector('#lista tr[data-id="r139"]') && document.querySelectorAll('#lista tr[data-id]').length === 10);
  await p.click('#rExp'); await p.waitForTimeout(800);
  ok(!bajo && /Sin señal/.test(await p.textContent('#toast')) && /No se exportó/.test(await p.textContent('#toast')), 'sin señal: no exporta y avisa: ' + await p.textContent('#toast'));
  p.off('download', oyente); await ctx.setOffline(false); await p.waitForTimeout(300);
  // Si uno ya no existe, no se hace nada a medias (ni se abre el diálogo de entrega)
  await p.evaluate(rid => { const s = window.__fakeStore(); delete s['liberaciones/' + rid]; localStorage.setItem('__fakeDB', JSON.stringify(s)); }, 'r139');
  await p.click(`#lista tr[data-id="${'r138'}"] td.ck`); await p.click(`#lista tr[data-id="${'r139'}"] td.ck`);
  await p.click('#rBulk [data-rk="entregar"]'); await p.waitForTimeout(700);
  ok(!(await p.$('.dlg.on #dXml')) && /Ya no existe el registro SKT-TOP-10139\. No se cambió nada/.test(await p.textContent('#toast')), 'entregar en grupo con uno que ya no existe: avisa cuál y no abre el diálogo: ' + await p.textContent('#toast'));
  ok((await store(p))['liberaciones/' + 'r138'].estado === 'EP', 'y el otro sigue en proceso');
  await p.click('#rBulk [data-rk="limpiar"]'); await p.waitForTimeout(300);

  // G5: seguimiento de levantamientos antiguos en la lista y en los chips
  const buscar = async t => { await p.fill('#q', ''); await p.click('#q'); await p.keyboard.type(t, { delay: 15 }); await p.waitForTimeout(900); };
  await buscar('90+010');
  ok(/Enterado/.test(await filaSt(p, 'lev1')), 'levantamiento antiguo enterado: la fila dice «Enterado»: ' + await filaSt(p, 'lev1'));
  ok(/Enterados\s*1/.test(await p.textContent('#rSt')), 'y el chip «Enterados» lo cuenta');
  await buscar('91+010');
  ok(/Por ver/.test(await filaSt(p, 'lev2')) && /Por ver\s*1/.test(await p.textContent('#rSt')), 'levantamiento antiguo sin ver: «Por ver» en la fila y en el chip');
  await buscar('92+010');
  ok(!/Por ver|Enterado/.test(await filaSt(p, 'lev3')) && /Levantamiento/.test(await filaSt(p, 'lev3')), 'entrada vieja del resumen (sin el dato): sigue como antes, sin etiqueta');
  // Marcar enterado desde «⋯»: la fila cambia y el resumen guarda el dato
  await buscar('91+010');
  await menu(p, 'lev2', 'Marcar enterado');
  ok(await esperar(p, () => window.__fakeStore()['liberaciones/lev2']?.visto === true), '«⋯ → Marcar enterado» en un levantamiento antiguo');
  ok(await esperar(p, () => /Enterado/.test(document.querySelector('#lista tr[data-id="lev2"] .tcod')?.textContent || ''), null, 5000), 'G3+G5: la fila pasa a «Enterado» sin reescribir');
  ok(resDe(await store(p), 'lev2')?.[1].r.lev2[9] === 1, 'el resumen de lev2 guarda el seguimiento (1)');
  await p.screenshot({ path: OUT + '/03-levantamientos.png' });

  ok(errores.length === 0, 'sin errores de página');
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
