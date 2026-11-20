// Cobertura (hallazgo S8): funciones importantes que ninguna otra prueba ejercitaba. Todo se comprueba en los DATOS del Firebase falso (__fakeStore), no solo que no dé error.
//  · Panel → Modelo 2D: guardarModelo (eje + secciones + superficies de diseño) y supDesdeSecciones (la liberación que viene cortada en las secciones)
//  · Ajustes → Lugares: moverLugar (estructura y frente) y quitarEstructura (con su eje y sus capas)
//  · Ajustes → Tipos: unirElemento (+ «Deshacer»), cambiarEleTipo, separarDetTipo, moverElemento, activarElemento
//  · Panel: menuNoLibera (quitar un tramo «no se libera»; cancelar no cambia nada)
//  · Avisos de error de guardado con window.__fakeNegar en cinco sitios: el texto unificado del lote F2 (errGuardar), el del administrador
// Las comprobaciones que dependan de una función rota se dejan como PENDIENTE (comentario + línea «pendiente»), no se arreglan aquí.
const { chromium } = require('playwright'); const path = require('path');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const D = f => path.join(__dirname, 'datos', f);
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = []; // (el error «Missing or insufficient permissions» de la consola es el que provoca a propósito __fakeNegar)
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const pendiente = m => console.log('pendiente -', m);
// Causa de un guardado rechazado por permisos, tal como la lee el administrador (lote F2: errGuardar)
const PERM = /: sin permiso\. Revisa que las reglas de Firebase estén publicadas\.$/;
const store = p => p.evaluate(() => window.__fakeStore());
const esperar = (p, fn, arg, ms = 12000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
// Avisos (toast) que han salido, desde antes de entrar
const avisos = p => p.evaluate(() => (window.__avisos || []).map(a => a.t));
const esperarAviso = (p, re) => p.waitForFunction(r => (window.__avisos || []).some(a => new RegExp(r).test(a.t)), re.source, { timeout: 12000 }).then(() => true).catch(() => false);
const textoAviso = async (p, re) => (await avisos(p)).filter(t => re.test(t)).pop() || '(no salió)';
const limpiarAvisos = p => p.evaluate(() => { window.__avisos = []; });
// Con ancho de PC, Lugares y Tipos son maestro-detalle: solo se ve el grupo elegido; se elige el que contiene el botón
const ver = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel), c = e && e.closest('[hidden]'); if (c) document.querySelector('[data-md="' + (c.dataset.e ?? c.querySelector('.tygrp')?.dataset.e ?? '') + '"]')?.click(); }, sel);
async function menu(p, sel, txt) { await ver(p, sel); await p.click(sel); await p.waitForSelector('#ctx .ctx-i'); await p.click(`#ctx .ctx-i:has-text("${txt}")`); }
const lista = (st, k) => (st['listas/' + k] || {}).items || [];
const aceptar = async p => { await p.waitForSelector('.dlg.on [type=submit]'); await p.waitForTimeout(250); await p.click('.dlg.on [type=submit]'); };
const lib = (extra) => ({ actividad: 'LIB', estado: 'PT', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', equipo: 'ET', pkInicio: 100, pkFin: 140, descripcion: 'Registro de prueba', fechaCampo: { __ts: Date.now() - 36e5 }, creadoEn: { __ts: Date.now() - 36e5 }, editadoEn: { __ts: Date.now() - 36e5 }, archivos: [], ...extra });
const DB = {
  'listas/estructuras': { items: [
    { id: 'pp', nombre: 'Presa Principal', subs: [{ id: 'pp-oeste', nombre: 'Presa Principal Oeste', pkMin: 0, pkMax: 2700 }, { id: 'pp-este', nombre: 'Presa Principal Este', pkMin: 0, pkMax: 1200 }] },
    { id: 'ta', nombre: 'Talud A', subs: [{ id: 'ta1', nombre: 'Talud A frente 1', pkMin: 0, pkMax: 500 }, { id: 'ta2', nombre: 'Talud A frente 2', pkMin: 0, pkMax: 300 }] },
    { id: 'tb', nombre: 'Talud B', subs: [{ id: 'tb1', nombre: 'Talud B frente 1', pkMin: 0, pkMax: 400 }] },
    { id: 'tc', nombre: 'Talud C', subs: [{ id: 'tc1', nombre: 'Talud C frente 1', pkMin: 0, pkMax: 400 }] }] },
  'ejes/ta1': { puntos: [0, 0, 0, 100, 100, 0], nombre: 'eje-ta1.csv' }, 'capas/ta1': { tipos: {} }, 'capas/ta2': { tipos: {} },
  'ejes/tc1': { puntos: [0, 0, 0, 100, 100, 0], nombre: 'eje-tc1.csv' },
  'listas/elementos': { items: [{ id: 'mt', nombre: 'Movimiento de tierras', orden: 1 }, { id: 'geo', nombre: 'Geosintéticos', orden: 2 }, { id: 'vac', nombre: 'Drenaje', orden: 3 }] },
  'listas/tipos': { items: [['filtro1', 'Relleno de filtro 1', 'mt'], ['filtro2', 'Relleno de filtro 2', 'mt'], ['geotextil', 'Geotextil', 'geo'], ['pz', 'Ubicación piezometro casagrande pz3-7', 'mt']].map(([id, nombre, elementoId], i) => ({ id, nombre, elementoId, orden: i + 1, enGrafico: true })) },
  'capas/pp-oeste': { tipos: { filtro1: { capas: [{ nombre: 'Capa 10' }, { nombre: 'Capa 11' }], noAplica: [{ capa: 'Capa 11', pkInicio: 600, pkFin: 700, cota: '758.20', nota: 'Zona de roca' }, { capa: 'Capa 10', pkInicio: 800, pkFin: 850, cota: '', nota: '' }] } } },
  'liberaciones/r1': lib({ descripcion: 'Filtro uno' }),
  'liberaciones/r2': lib({ tipoId: 'filtro2', descripcion: 'Filtro dos A', pkInicio: 200, pkFin: 240 }),
  'liberaciones/r3': lib({ tipoId: 'filtro2', descripcion: 'Filtro dos B', pkInicio: 300, pkFin: 340 }),
  'liberaciones/r4': lib({ tipoId: 'geotextil', elementoId: 'geo', descripcion: 'Geotextil A', pkInicio: 400, pkFin: 440 }),
  'liberaciones/r5': lib({ tipoId: 'geotextil', elementoId: 'geo', descripcion: 'Geotextil B', pkInicio: 500, pkFin: 540 }),
  'liberaciones/r6': lib({ tipoId: 'pz', descripcion: 'Piezómetro', pkInicio: 900, pkFin: 910 })
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  // HTML=ruta\index.html corre la prueba contra otro index.html (por ejemplo uno con una función rota, para ver que la prueba lo nota)
  if (process.env.HTML) await ctx.route(u => /\/(index\.html)?$/.test(u.pathname), r => r.fulfill({ path: process.env.HTML, contentType: 'text/html; charset=utf-8' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|Failed to load resource|Missing or insufficient permissions/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.addInitScript(() => { window.__avisos = []; const ver = () => { const t = document.getElementById('toast'); if (t && t.textContent) window.__avisos.push({ t: t.textContent, c: t.className }); };
    new MutationObserver(ver).observe(document, { subtree: true, childList: true, characterData: true }); });
  await p.goto(URL);
  await p.evaluate(([A, d]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(A)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('modelo')); }, [ADMIN, DB]);
  await p.reload(); await p.waitForSelector('#nav button');

  // ===== 1. Panel → Modelo 2D: guardarModelo y supDesdeSecciones =====
  await p.click('[data-v="panel"]'); await p.waitForSelector('#mBody');
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await p.waitForSelector('.dlg.on .mprev-r');
  const filas = await p.$$eval('.dlg.on .mprev-r', rs => rs.map(r => ({ n: r.querySelector('.mprev-n').childNodes[0].textContent, k: r.querySelector('select').value })));
  const disN = filas.filter(f => f.k === 'dis').length, libF = filas.filter(f => f.k === 'lib');
  ok(disN >= 4 && libF.length >= 1 && libF.some(f => /SKT-TOP-02360/.test(f.n)), `el diálogo clasifica ${filas.length} superficies: ${disN} de diseño y ${libF.length} de liberación (entre ellas «0_000_0_015_STN F1_SKT-TOP-02360»)`);
  await limpiarAvisos(p);
  await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, () => window.__fakeStore()['secciones/pp-oeste'] && window.__fakeStore()['superficies/pp-oeste~0-000-0-015-stn-f1-skt-top-02360']), 'se guardan las secciones del frente y la superficie que venía cortada en ellas');
  let st = await store(p); const sec = st['secciones/pp-oeste'], eje = st['ejes/pp-oeste'];
  ok(sec && sec.nombre === 'eje-prueba.xml' && sec.eje === 'EJE PRUEBA' && sec.partes === 1 && sec.editadoPor === ADMIN.email, `secciones/pp-oeste: archivo «${sec && sec.nombre}», eje «${sec && sec.eje}», ${sec && sec.partes} parte, editadoPor ${sec && sec.editadoPor}`);
  ok(sec.n > 100 && sec.est.length === sec.n && sec.cs.length === sec.n && sec.sups.length === disN, `guardarModelo: ${sec.n} secciones (est y cs del mismo largo) y ${sec.sups.length} superficies de diseño (las de liberación no entran en sups)`);
  ok(sec.pk0 === 0 && sec.pk1 > 2600 && sec.cs.some(t => /^0:/.test(t)), `el rango de PK sale del eje (${sec.pk0} a ${sec.pk1}) y los cortes de diseño usan «índice:trazo»`);
  ok(eje && eje.nombre === 'eje-prueba.xml' && eje.puntos.length % 3 === 0 && eje.puntos.length >= 30 && eje.puntos[0] === 0, `ejes/pp-oeste: ${eje && eje.puntos.length / 3} puntos [PK, E, N] del eje, nombre del archivo`);
  const su = st['superficies/pp-oeste~0-000-0-015-stn-f1-skt-top-02360'];
  ok(su && su.origen === 'secciones' && su.codigo === 'SKT-TOP-02360' && su.subId === 'pp-oeste', `supDesdeSecciones: superficie con origen «${su && su.origen}», código «${su && su.codigo}», archivo «${su && su.archivo}»`);
  ok(su.pk0 <= 0.01 && su.pk1 >= 14.9 && su.pk1 < 40 && su.area > 0 && su.zMin <= su.zMed && su.zMed <= su.zMax && su.puntos > 0, `supDesdeSecciones: PK ${su.pk0} a ${su.pk1} (del nombre 0+000 a 0+015), área ${su.area} m², cota ${su.zMin} a ${su.zMax}, ${su.puntos} puntos`);
  ok(Array.isArray(su.cs) && su.cs.length >= 1 && /^\d/.test(su.cs[0]) && su.borde.length >= 8 && su.borde.length % 2 === 0 && su.v === 1, `supDesdeSecciones: ${su.cs.length} cortes por sección y un borde cerrado de ${su.borde.length / 2} vértices (versión ${su.v})`);
  ok(su.bordeEN.length === su.borde.length, 'supDesdeSecciones: el borde también queda en coordenadas reales (como el frente ya tiene eje)');
  ok(!!(st['superficiesRes/pp-oeste'] && st['superficiesRes/pp-oeste'].r && st['superficiesRes/pp-oeste'].r[su.id || 'pp-oeste~0-000-0-015-stn-f1-skt-top-02360']), 'y su resumen compacto queda en superficiesRes/pp-oeste');
  ok(await esperarAviso(p, /Modelo guardado: \d+ secciones, \d+ superficies de diseño/) && await esperarAviso(p, new RegExp(`Modelo guardado con ${libF.length} liberaciones que venían en las secciones`)), `avisos: «${await textoAviso(p, /Modelo guardado: /)}» y «${await textoAviso(p, /Modelo guardado con/)}»`);
  ok(await esperar(p, () => document.querySelector('#mBody') && /secci/i.test(document.querySelector('#mBody').textContent) || document.querySelector('#mSel, #mGrupo, #mReal, #mSec')), 'el Modelo 2D se dibuja con lo guardado');

  // Subir otra vez eligiendo otros usos: una de diseño pasa a «No usar»; la de liberación pasa a «No usar» (no se vuelve a crear) y la ya subida se queda
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await p.waitForSelector('.dlg.on .mprev-r');
  ok(/Reemplaza el modelo actual \(eje-prueba\.xml\)/.test(await p.textContent('.dlg.on')) && /Las superficies de liberación ya subidas se quedan/.test(await p.textContent('.dlg.on')), 'al subir de nuevo el diálogo avisa que reemplaza el modelo y que las liberaciones subidas se quedan');
  const antesSups = sec.sups.slice(), cual = await p.$$eval('.dlg.on .mprev-r', rs => rs.findIndex(r => r.querySelector('select').value === 'dis'));
  const nomQuitada = await p.$$eval('.dlg.on .mprev-r', (rs, i) => rs[i].querySelector('.mprev-n').childNodes[0].textContent, cual);
  await p.$$eval('.dlg.on .mprev-r select', (ss, i) => { ss[i].value = 'no'; ss.forEach(s => { if (s.value === 'lib') s.value = 'no'; }); }, cual);
  await limpiarAvisos(p); await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, n => window.__fakeStore()['secciones/pp-oeste'].sups.length === n, antesSups.length - 1), 'con una superficie en «No usar» el modelo guardado la deja fuera');
  st = await store(p);
  ok(!st['secciones/pp-oeste'].sups.includes(nomQuitada) && st['secciones/pp-oeste'].sups.length === antesSups.length - 1 && !!st['superficies/pp-oeste~0-000-0-015-stn-f1-skt-top-02360'], `«${nomQuitada.slice(0, 30)}» ya no está en sups y la liberación ya subida sigue en superficies`);

  // Aviso de error de guardado nº 1: guardarModelo con el servidor rechazando
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await p.waitForSelector('.dlg.on .mprev-r');
  await limpiarAvisos(p); await p.evaluate(() => { window.__fakeNegar = true; }); await p.click('.dlg.on [type=submit]');
  ok(await esperarAviso(p, /No se guardó el modelo/) && PERM.test(await textoAviso(p, /No se guardó el modelo/)), `aviso nº 1 (Panel → guardar el modelo sin permiso): «${await textoAviso(p, /No se guardó el modelo/)}»`);
  const a1 = await textoAviso(p, /No se guardó el modelo/);
  ok(/permiso|reglas/i.test(a1) && /[a-záéíóú]{4}/i.test(a1) && !/permission-denied|insufficient/i.test(a1) && (await p.$eval('#toast', t => t.classList.contains('bad'))), 'el aviso está en español, dice qué hacer (publicar las reglas) y sale como error (rojo)');
  await p.evaluate(() => { window.__fakeNegar = false; });

  // ===== 2. Panel: menuNoLibera =====
  await p.evaluate(() => localStorage.setItem('lib.panelVista', JSON.stringify('perfil')));
  await p.click('.chart-h [data-vista="perfil"]').catch(() => {}); await p.waitForSelector('#chart rect.nolib[data-na]', { timeout: 15000 }).catch(() => {});
  let nRect = await p.$$eval('#chart rect.nolib[data-na]', x => x.length);
  if (!nRect) { await p.click('[data-v="panel"]'); await p.waitForSelector('.chart-h [data-vista]'); await p.click('.chart-h [data-vista="lista"]'); await p.waitForSelector('#chart rect.nolib[data-na]', { timeout: 15000 }).catch(() => {}); nRect = await p.$$eval('#chart rect.nolib[data-na]', x => x.length); }
  ok(nRect >= 2, `el Panel dibuja los tramos «no se libera» de Capas (${nRect})`);
  const naAntes = JSON.stringify((await store(p))['capas/pp-oeste'].tipos.filtro1.noAplica);
  const grande = async () => { const rects = await p.$$('#chart rect.nolib[data-na]'); let big = rects[0], bw = 0; for (const r of rects) { const w = (await r.boundingBox()).width; if (w > bw) { bw = w; big = r; } } await big.scrollIntoViewIfNeeded(); return big.boundingBox(); };
  let box = await grande(); await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' }); await p.waitForSelector('#ctx .ctx-i');
  const titulo = await p.textContent('#ctx .ctx-head');
  ok(/No se libera/.test(titulo) && /Capa 1[01]/.test(titulo) && /\d\+\d{3}/.test(titulo) && (await p.textContent('#ctx')).includes('Quitar «no se libera»'), `menuNoLibera: el menú dice «${titulo.replace(/\s+/g, ' ').slice(0, 70)}» y ofrece «Quitar «no se libera»»`);
  await p.click('#ctx .ctx-i'); await p.waitForSelector('.dlg.on .dlg-p');
  ok(/vuelve a contarse como «falta liberar»/.test(await p.textContent('.dlg.on .dlg-p')), 'pide confirmar: el tramo vuelve a contarse como «falta liberar»');
  await p.click('.dlg.on .dlg-x, .dlg.on [data-cancel], .dlg.on .btn:not([type=submit])').catch(async () => { await p.keyboard.press('Escape'); });
  await p.waitForFunction(() => !document.querySelector('.dlg'), null, { timeout: 5000 }).catch(() => {});
  ok(JSON.stringify((await store(p))['capas/pp-oeste'].tipos.filtro1.noAplica) === naAntes, 'si se cancela, los tramos «no se libera» no cambian');
  box = await grande(); await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' }); await p.waitForSelector('#ctx .ctx-i'); await p.click('#ctx .ctx-i'); await p.waitForSelector('.dlg.on [type=submit]');
  const pkQuitado = (await p.textContent('.dlg.on .dlg-p')).match(/\d\+\d{3}/)?.[0];
  await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, () => window.__fakeStore()['capas/pp-oeste'].tipos.filtro1.noAplica.length === 1), 'al confirmar, el tramo se quita de capas/pp-oeste (queda 1 de 2)');
  st = await store(p); const resta = st['capas/pp-oeste'].tipos.filtro1.noAplica;
  ok(resta.length === 1 && JSON.parse(naAntes).some(x => x.pkInicio === resta[0].pkInicio) && !/^\s*$/.test(String(pkQuitado)) && (await avisos(p)).some(t => /Tramo quitado/.test(t)), `queda el otro tramo (${resta[0].pkInicio}–${resta[0].pkFin}), quitado el de ${pkQuitado}, con aviso «Tramo quitado»`);
  // Aviso de error nº 2: quitar el que queda con el servidor rechazando
  await p.waitForFunction(() => document.querySelectorAll('#chart rect.nolib[data-na]').length === 1 && !document.querySelector('.dlg'), null, { timeout: 10000 }); await limpiarAvisos(p);
  await p.click('#chart rect.nolib[data-na]', { button: 'right', force: true }); await p.waitForSelector('#ctx .ctx-i'); await p.click('#ctx .ctx-i'); await p.waitForSelector('.dlg.on [type=submit]');
  await p.evaluate(() => { window.__fakeNegar = true; }); await p.click('.dlg.on [type=submit]');
  ok(await esperarAviso(p, /No se guardó/), `aviso nº 2 (Panel → quitar «no se libera» sin permiso): «${await textoAviso(p, /No se guardó/)}»`);
  await p.evaluate(() => { window.__fakeNegar = false; });
  ok(PERM.test(await textoAviso(p, /No se guardó/)) && (await store(p))['capas/pp-oeste'].tipos.filtro1.noAplica.length === 1, 'el aviso está en español y los datos no cambian');

  // ===== 3. Ajustes → Lugares: moverLugar y quitarEstructura =====
  await p.click('#nav [data-v="ajustes"]'); await p.waitForSelector('[data-tab="lugares"]'); await p.click('[data-tab="lugares"]'); await p.waitForSelector('.est[data-e="pp"]');
  const ordenEst = st => lista(st, 'estructuras').map(e => e.id).join();
  ok(ordenEst(await store(p)) === 'pp,ta,tb,tc', 'punto de partida: pp, ta, tb, tc');
  await p.waitForFunction(() => document.querySelector('.est[data-e="ta"] [data-k="emas"]'));
  await menu(p, '.est[data-e="ta"] [data-k="emas"]', 'Mover abajo');
  ok(await esperar(p, () => window.__fakeStore()['listas/estructuras'].items.map(e => e.id).join() === 'pp,tb,ta,tc'), 'moverLugar: «Mover abajo» pasa Talud A después de Talud B en listas/estructuras');
  await p.waitForFunction(() => document.activeElement && document.activeElement.dataset.k === 'emas' && document.activeElement.closest('[data-e="ta"]'), null, { timeout: 5000 }).catch(() => {});
  ok(await p.evaluate(() => !!document.activeElement.closest('[data-e="ta"]')) && (await p.$$eval('#ajBody .est[data-e]', x => x.map(e => e.dataset.e).join())) === 'pp,tb,ta,tc', 'la pantalla se repinta en el orden nuevo y el foco vuelve al «⋯» de la estructura movida');
  await menu(p, '.est[data-e="ta"] [data-k="emas"]', 'Mover arriba');
  ok(await esperar(p, () => window.__fakeStore()['listas/estructuras'].items.map(e => e.id).join() === 'pp,ta,tb,tc'), '«Mover arriba» la devuelve a su sitio');
  await ver(p, '.est[data-e="pp"] [data-k="emas"]'); await p.click('.est[data-e="pp"] [data-k="emas"]'); await p.waitForSelector('#ctx .ctx-i');
  ok(!(await p.$('#ctx .ctx-i:has-text("Mover arriba")')) && !!(await p.$('#ctx .ctx-i:has-text("Mover abajo")')), 'la primera estructura no ofrece «Mover arriba»');
  await p.keyboard.press('Escape');
  // Frente: Talud A frente 1 baja detrás de frente 2
  await menu(p, '.est[data-e="ta"] [data-s="ta1"] [data-k="smas"]', 'Mover abajo');
  ok(await esperar(p, () => window.__fakeStore()['listas/estructuras'].items.find(e => e.id === 'ta').subs.map(s => s.id).join() === 'ta2,ta1'), 'moverLugar de un frente: «Mover abajo» cambia el orden de subs dentro de su estructura (ta2, ta1) sin tocar las demás');
  st = await store(p);
  ok(ordenEst(st) === 'pp,ta,tb,tc' && lista(st, 'estructuras').find(e => e.id === 'pp').subs.map(s => s.id).join() === 'pp-oeste,pp-este', 'las otras estructuras y frentes siguen igual');
  // Aviso de error nº 3: mover con el servidor rechazando (la lista vuelve a lo que había)
  await limpiarAvisos(p); await p.evaluate(() => { window.__fakeNegar = true; });
  await menu(p, '.est[data-e="tb"] [data-k="emas"]', 'Mover abajo');
  ok(await esperarAviso(p, /No se guardó/), `aviso nº 3 (Ajustes → Lugares → mover sin permiso): «${await textoAviso(p, /No se guardó/)}»`);
  await p.evaluate(() => { window.__fakeNegar = false; }); await p.waitForTimeout(300);
  ok(ordenEst(await store(p)) === 'pp,ta,tb,tc' && PERM.test(await textoAviso(p, /No se guardó/)), 'el aviso está en español y el orden guardado no cambia');
  // quitarEstructura: Talud A (sin registros, con eje y capas de sus frentes) → se quita con sus datos; la que tiene registros no ofrece «Quitar estructura»
  await ver(p, '.est[data-e="pp"] [data-k="emas"]'); await p.click('.est[data-e="pp"] [data-k="emas"]'); await p.waitForSelector('#ctx .ctx-i');
  ok(!(await p.$('#ctx .ctx-i:has-text("Quitar estructura")')), 'una estructura con registros no ofrece «Quitar estructura…»');
  await p.keyboard.press('Escape');
  await ver(p, '.est[data-e="ta"] [data-k="emas"]');
  await p.waitForFunction(() => { document.querySelector('.est[data-e="ta"] [data-k="emas"]').click(); const ok = !!document.querySelector('#ctx .ctx-i') && [...document.querySelectorAll('#ctx .ctx-i')].some(b => /Quitar estructura/.test(b.textContent)); if (!ok) document.querySelector('#ctxbd')?.click(); return ok; }, null, { timeout: 15000, polling: 400 }).catch(() => {});
  ok(!!(await p.$('#ctx .ctx-i:has-text("Quitar estructura")')), 'una estructura sin registros ofrece «Quitar estructura…» (cuando ya se cargó el resumen)');
  await p.click('#ctx .ctx-i:has-text("Quitar estructura")'); await p.waitForSelector('.dlg.on [type=submit]');
  ok(/Talud A/.test(await p.textContent('.dlg.on .dlg-p')) && /2 frentes/.test(await p.textContent('.dlg.on .dlg-p')) && /No se puede deshacer/.test(await p.textContent('.dlg.on .dlg-p')), `pide confirmar: «${(await p.textContent('.dlg.on .dlg-p')).replace(/\s+/g, ' ').slice(0, 110)}»`);
  await limpiarAvisos(p); await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, () => !window.__fakeStore()['listas/estructuras'].items.some(e => e.id === 'ta')), 'quitarEstructura: Talud A sale de listas/estructuras');
  ok(await esperar(p, () => !window.__fakeStore()['ejes/ta1'] && !window.__fakeStore()['capas/ta1'] && !window.__fakeStore()['capas/ta2']), 'y se borran el eje y las capas de sus frentes (ejes/ta1, capas/ta1, capas/ta2)');
  st = await store(p);
  ok(ordenEst(st) === 'pp,tb,tc' && !!st['ejes/tc1'] && !!st['capas/pp-oeste'] && lista(st, 'estructuras').find(e => e.id === 'pp').subs.length === 2, 'lo de las demás estructuras (ejes/tc1, capas/pp-oeste) no se toca');
  ok(await esperarAviso(p, /Estructura «Talud A» quitada/) && !(await p.$('.est[data-e="ta"]')), 'aviso «Estructura «Talud A» quitada» y desaparece de la pantalla');
  // Cancelar no quita nada
  await menu(p, '.est[data-e="tb"] [data-k="emas"]', 'Quitar estructura'); await p.waitForSelector('.dlg.on [type=submit]'); await p.keyboard.press('Escape');
  await p.waitForFunction(() => !document.querySelector('.dlg.on'), null, { timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(300);
  ok(ordenEst(await store(p)) === 'pp,tb,tc', 'si se cancela la confirmación, la estructura sigue');
  // Con el servidor rechazando, no se quita ni se borran sus datos
  await p.evaluate(() => { window.__fakeNegar = true; }); await limpiarAvisos(p);
  await menu(p, '.est[data-e="tc"] [data-k="emas"]', 'Quitar estructura'); await p.waitForSelector('.dlg.on [type=submit]'); await p.click('.dlg.on [type=submit]');
  ok(await esperarAviso(p, /No se guardó/) && PERM.test(await textoAviso(p, /No se guardó/)), `quitarEstructura sin permiso: «${await textoAviso(p, /No se guardó/)}»`);
  await p.evaluate(() => { window.__fakeNegar = false; }); await p.waitForTimeout(300);
  st = await store(p);
  ok(ordenEst(st) === 'pp,tb,tc' && !!st['ejes/tc1'], 'y no se borra nada (Talud C y su eje siguen)');

  // ===== 4. Ajustes → Tipos =====
  await p.click('[data-tab="tipos"]'); await p.waitForSelector('#tyList .elgrp');
  const regsDe = (st, campo, val) => Object.entries(st).filter(([k, v]) => k.startsWith('liberaciones/') && v[campo] === val).map(([k]) => k.split('/')[1]).sort().join();
  // 4a. moverElemento y activarElemento
  const ordenEle = st => lista(st, 'elementos').map(e => e.id).join();
  ok(ordenEle(await store(p)) === 'mt,geo,vac', 'punto de partida de los elementos: mt, geo, vac');
  await menu(p, '#tyList .elgrp[data-e="mt"] [data-k="emas"]', 'Mover abajo');
  ok(await esperar(p, () => window.__fakeStore()['listas/elementos'].items.map(e => e.id).join() === 'geo,mt,vac'), 'moverElemento: «Mover abajo» pasa «Movimiento de tierras» después de «Geosintéticos» en listas/elementos');
  ok(await esperar(p, () => document.activeElement && document.activeElement.closest('#tyList .elgrp[data-e="mt"]') && document.activeElement.dataset.k === 'emas'), 'el foco vuelve al «⋯» del elemento movido');
  await menu(p, '#tyList .elgrp[data-e="mt"] [data-k="emas"]', 'Mover arriba');
  ok(await esperar(p, () => window.__fakeStore()['listas/elementos'].items.map(e => e.id).join() === 'mt,geo,vac'), '«Mover arriba» lo devuelve a su sitio');
  await limpiarAvisos(p);
  await menu(p, '#tyList .elgrp[data-e="vac"] [data-k="emas"]', 'Desactivar');
  ok(await esperar(p, () => window.__fakeStore()['listas/elementos'].items.find(e => e.id === 'vac').activo === false), 'activarElemento: «Desactivar» deja activo:false en «Drenaje» y no toca a los otros');
  st = await store(p); ok(lista(st, 'elementos').filter(e => e.activo === false).length === 1 && lista(st, 'tipos').length === 4, 'los otros elementos y los tipos siguen igual');
  ok(await esperarAviso(p, /«Drenaje» desactivado: ya no aparece al registrar/), `aviso: «${(await textoAviso(p, /desactivado/)).replace(/Deshacer$/, '').trim()}» con «Deshacer»`);
  await p.waitForSelector('#toast .toast-btn'); await p.click('#toast .toast-btn');
  ok(await esperar(p, () => window.__fakeStore()['listas/elementos'].items.find(e => e.id === 'vac').activo !== false), '«Deshacer» lo vuelve a activar');
  // Aviso de error nº 4: desactivar con el servidor rechazando (el elemento vuelve a como estaba)
  await limpiarAvisos(p); await p.evaluate(() => { window.__fakeNegar = true; });
  await menu(p, '#tyList .elgrp[data-e="vac"] [data-k="emas"]', 'Desactivar');
  ok(await esperarAviso(p, /No se guardó/), `aviso nº 4 (Ajustes → Tipos → desactivar elemento sin permiso): «${await textoAviso(p, /No se guardó/)}»`);
  await p.evaluate(() => { window.__fakeNegar = false; }); await p.waitForTimeout(300);
  ok(PERM.test(await textoAviso(p, /No se guardó/)) && (await store(p))['listas/elementos'].items.find(e => e.id === 'vac').activo !== false && !(await avisos(p)).some(t => /desactivado: ya no aparece/.test(t)), 'el aviso está en español, el elemento sigue activo y no sale el falso «desactivado»');

  // 4b. cambiarEleTipo: «Relleno de filtro 2» pasa a «Geosintéticos» con sus 2 registros
  await limpiarAvisos(p);
  await esperar(p, () => document.querySelector('#tyList [data-id="filtro2"] [data-k="mas"]'));
  await menu(p, '#tyList [data-id="filtro2"] [data-k="mas"]', 'Cambiar elemento'); await p.waitForSelector('.dlg.on #dEle');
  ok(await p.inputValue('.dlg.on #dEle') === 'mt' && /sus 2 registros/.test(await p.textContent('.dlg.on')) && await p.isChecked('.dlg.on [name=regs]').catch(() => false), 'cambiarEleTipo: el diálogo parte del elemento actual y ofrece pasar sus 2 registros (marcado)');
  await p.selectOption('.dlg.on #dEle', 'geo'); await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, () => window.__fakeStore()['listas/tipos'].items.find(t => t.id === 'filtro2').elementoId === 'geo' && ['r2', 'r3'].every(k => window.__fakeStore()['liberaciones/' + k].elementoId === 'geo')), 'el tipo pasa a «geo» en listas/tipos y sus 2 registros (r2, r3) también');
  st = await store(p);
  ok(regsDe(st, 'elementoId', 'mt') === 'r1,r6' && lista(st, 'tipos').find(t => t.id === 'filtro1').elementoId === 'mt', 'los registros y tipos de otros tipos no se tocan (r1, r6 siguen en «mt»)');
  ok(await esperarAviso(p, /2 registros pasados a Geosintéticos/), `aviso: «${await textoAviso(p, /registros pasados/)}»`);
  ok(Object.values(st).some(v => v && v.accion === 'editado' && /Elemento del tipo «Relleno de filtro 2»: Movimiento de tierras → Geosintéticos/.test(v.detalle || v.texto || v.nota || JSON.stringify(v))), 'cada registro queda con su línea de historial «Elemento del tipo …: Movimiento de tierras → Geosintéticos»');
  // Sin marcar «pasar registros»: solo cambia el tipo
  await menu(p, '#tyList [data-id="filtro1"] [data-k="mas"]', 'Cambiar elemento'); await p.waitForSelector('.dlg.on #dEle');
  await p.selectOption('.dlg.on #dEle', 'vac'); await p.uncheck('.dlg.on [name=regs]'); await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, () => window.__fakeStore()['listas/tipos'].items.find(t => t.id === 'filtro1').elementoId === 'vac'), 'sin marcar «Pasar también sus registros» el tipo cambia de elemento…');
  await p.waitForTimeout(400); ok((await store(p))['liberaciones/r1'].elementoId === 'mt', '…y su registro (r1) se queda en el elemento anterior');
  // Con el mismo elemento no hace nada
  await menu(p, '#tyList [data-id="filtro1"] [data-k="mas"]', 'Cambiar elemento'); await p.waitForSelector('.dlg.on #dEle'); const antesT = JSON.stringify(lista(await store(p), 'tipos'));
  await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(500); ok(JSON.stringify(lista(await store(p), 'tipos')) === antesT, 'si se deja el mismo elemento no se guarda nada');
  await p.waitForFunction(() => !document.querySelector('.dlg.on'), null, { timeout: 5000 }).catch(() => {});

  // 4c. separarDetTipo: «Ubicación piezometro casagrande pz3-7» → tipo «Ubicación piezometro casagrande» y detalle PZ3-7 en su registro
  await limpiarAvisos(p);
  await menu(p, '#tyList [data-id="pz"] [data-k="mas"]', 'Separar detalle'); await p.waitForSelector('.dlg.on [type=submit]');
  ok(/PZ3-7/.test(await p.textContent('.dlg.on .dlg-p')) && /Ubicación piezometro casagrande/.test(await p.textContent('.dlg.on .dlg-p')), `separarDetTipo: pide confirmar «${(await p.textContent('.dlg.on .dlg-p')).replace(/\s+/g, ' ').slice(0, 120)}»`);
  await p.click('.dlg.on [type=submit]');
  ok(await esperar(p, () => window.__fakeStore()['liberaciones/r6'].detalle === 'PZ3-7' && window.__fakeStore()['listas/tipos'].items.find(t => t.id === 'pz').nombre === 'Ubicación piezometro casagrande'), 'el registro r6 guarda detalle «PZ3-7» y el tipo pasa a llamarse «Ubicación piezometro casagrande» (mismo id)');
  st = await store(p);
  ok(!lista(st, 'tipos').some(t => /pz3-7/i.test(t.nombre)) && lista(st, 'tipos').length === 4 && Object.entries(st).filter(([k, v]) => k.startsWith('liberaciones/') && v.detalle).length === 1, 'ningún otro tipo ni registro cambió (solo r6 tiene detalle)');
  ok(await esperarAviso(p, /Ahora se llama «Ubicación piezometro casagrande»/), `aviso: «${await textoAviso(p, /Ahora se llama/)}»`);

  // 4d. unirElemento (desde «Unir con otro elemento…», con «Deshacer»): «Geosintéticos» (con filtro 2, geotextil y 4 registros) se une con «Movimiento de tierras»
  await limpiarAvisos(p);
  await menu(p, '#tyList .elgrp[data-e="geo"] [data-k="emas"]', 'Unir con otro elemento'); await p.waitForSelector('.dlg.on [data-dest]');
  ok(await p.$$eval('.dlg.on [data-dest]', x => x.length) === 2, 'unirElemento: el buscador ofrece los otros 2 elementos');
  const geoAntes = Object.fromEntries(Object.entries(await store(p)).filter(([k]) => /^(listas\/(tipos|elementos)|liberaciones\/)/.test(k)).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]));
  await p.click('.dlg.on [data-dest="mt"]');
  ok(await esperar(p, () => !window.__fakeStore()['listas/elementos'].items.some(e => e.id === 'geo')), 'al elegir «Movimiento de tierras», «Geosintéticos» sale de listas/elementos');
  ok(await esperar(p, () => ['filtro2', 'geotextil'].every(id => window.__fakeStore()['listas/tipos'].items.find(t => t.id === id).elementoId === 'mt') && ['r2', 'r3', 'r4', 'r5'].every(k => window.__fakeStore()['liberaciones/' + k].elementoId === 'mt')), 'sus tipos (filtro 2, geotextil) y sus 4 registros pasan a «mt»');
  st = await store(p);
  ok(lista(st, 'elementos').map(e => e.id).join() === 'mt,vac' && lista(st, 'tipos').find(t => t.id === 'filtro1').elementoId === 'vac' && st['liberaciones/r1'].elementoId === 'mt' && lista(st, 'tipos').length === 4, 'los demás elementos y tipos no cambian (quedan mt y vac)');
  ok(Object.values(st).some(v => v && /Elemento unido: «Geosintéticos» → «Movimiento de tierras»/.test(JSON.stringify(v))), 'los registros llevan la línea de historial «Elemento unido: «Geosintéticos» → «Movimiento de tierras»»');
  ok(await esperarAviso(p, /«Geosintéticos» unido con «Movimiento de tierras» · 4 registros\./), `aviso: «${(await textoAviso(p, /unido con/)).replace(/Deshacer$/, '').trim()}»`);
  await p.waitForSelector('#toast .toast-btn'); await p.click('#toast .toast-btn');
  ok(await esperar(p, () => window.__fakeStore()['listas/elementos'].items.some(e => e.id === 'geo') && ['r2', 'r3', 'r4', 'r5'].every(k => window.__fakeStore()['liberaciones/' + k].elementoId === 'geo')), '«Deshacer» devuelve «Geosintéticos» a la lista');
  await p.waitForTimeout(500); st = await store(p);
  // Los datos vuelven a como estaban antes de unir (elementos, elementoId de tipos y de registros)
  const igualA = k => JSON.stringify(st[k]) === JSON.stringify(geoAntes[k]);
  const campos = k => ({ el: st[k].elementoId, ti: st[k].tipoId });
  ok(lista(st, 'elementos').map(e => e.id).join() === lista({ 'listas/elementos': geoAntes['listas/elementos'] }, 'elementos').map(e => e.id).join(), 'tras «Deshacer» la lista de elementos queda en el mismo orden que antes');
  ok(['filtro2', 'geotextil'].every(id => lista(st, 'tipos').find(t => t.id === id).elementoId === lista({ 'listas/tipos': geoAntes['listas/tipos'] }, 'tipos').find(t => t.id === id).elementoId) && ['r2', 'r3', 'r4', 'r5'].every(k => campos('liberaciones/' + k).el === geoAntes['liberaciones/' + k].elementoId), 'tras «Deshacer» los tipos y los 4 registros vuelven a su elemento anterior');
  // Aviso de error nº 5: unir con el servidor rechazando
  await limpiarAvisos(p); await p.evaluate(() => { window.__fakeNegar = true; });
  await menu(p, '#tyList .elgrp[data-e="geo"] [data-k="emas"]', 'Unir con otro elemento'); await p.waitForSelector('.dlg.on [data-dest]'); await p.click('.dlg.on [data-dest="mt"]');
  ok(await esperarAviso(p, /No se pudo unir|No se guardó/), `aviso nº 5 (Ajustes → Tipos → unir elementos sin permiso): «${await textoAviso(p, /No se pudo unir|No se guardó/)}»`);
  await p.evaluate(() => { window.__fakeNegar = false; }); await p.waitForTimeout(400);
  st = await store(p);
  ok(PERM.test(await textoAviso(p, /No se pudo unir|No se guardó/)) && lista(st, 'elementos').some(e => e.id === 'geo') && ['r4', 'r5'].every(k => st['liberaciones/' + k].elementoId === 'geo'), 'el aviso está en español y «Geosintéticos» y sus registros siguen donde estaban');

  ok(errores.length === 0, 'sin errores de la página ni de la consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await b.close();
})().catch(e => { console.log('FALLA:', e.message); process.exitCode = 1; });
