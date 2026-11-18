// Lote 5 · Grupo B (Campo, Ajustes, Modelo 2D): C8, C9, C10, C13, A5, A6, A7, A9, A11, A12, P9 y «Editar» con cambios.
// Uso: PUERTO=8782 node pruebas\prueba50.js
const { tipo } = require('./filtros');
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), os = require('os');
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const GAB = { uid: 'g1', email: 'gabinete@gmail.com', displayName: 'Gabinete Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); return !!c; };
const ahora = Date.now(), hora = 36e5;
const base = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', equipo: 'ET', estado: 'PT', descripcion: 'Registro', pkInicio: 100, pkFin: 140, fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, archivos: [], ...extra });
const DB = {
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'usuarios/gabinete@gmail.com': { nombre: 'Gabinete Prueba', rol: 'gabinete', topografoId: '', activo: true },
  'usuarios/ana@gmail.com': { nombre: 'Ana Torres', rol: 'operario', topografoId: '', activo: true },
  'listas/tipos': { items: [['filtro1', 'Relleno filtro 1'], ['filtro2', 'Relleno filtro 2'], ['masivo', 'Relleno masivo']].map(([id, nombre], i) => ({ id, nombre, elementoId: 'mt', orden: i + 1, enGrafico: true })) },
  'listas/topografos': { items: [{ id: 'GN', nombre: 'Gabriel Nuñez' }, { id: 'AB', nombre: 'Ana B.' }] },
  'listas/elementos': { items: [{ id: 'mt', nombre: 'Movimiento de tierras' }] },
  'listas/estructuras': { items: [
    { id: 'pp', nombre: 'Presa Principal', subs: [{ id: 'pp-oeste', nombre: 'Presa Principal Oeste', pkMin: 0, pkMax: 2700 }, { id: 'pp-este', nombre: 'Presa Principal Este', pkMin: 0, pkMax: 1200 }, { id: 'pp-sur', nombre: 'Presa Principal Sur', pkMin: 0, pkMax: 1800 }] },
    { id: 'pan', nombre: 'Presa Auxiliar Norte', subs: [{ id: 'pan', nombre: 'Presa Auxiliar Norte', pkMin: 0, pkMax: 400 }] }] },
  'capas/pp-oeste': { tipos: { filtro1: { capas: [{ nombre: 'Capa 12', cota: '' }, { nombre: 'Capa 2' }, { nombre: 'Capa 10' }, { nombre: 'Capa 11', oculta: true }], noAplica: [] } } },
  'liberaciones/otro1': base({ creadoPor: 'otra.persona@gmail.com', creadoNombre: 'Ana Torres Quispe', descripcion: 'Con nombre guardado' }),
  'liberaciones/otro2': base({ creadoPor: 'viejo.usuario@gmail.com', descripcion: 'Registro viejo sin nombre' }),
  'liberaciones/lv1': base({ actividad: 'LEV', estado: 'NA', descripcion: 'Levantamiento de prueba', tipoId: '', elementoId: '', capa: '' }),
  'liberaciones/as1': base({ actividad: 'ASP', estado: 'NA', descripcion: 'Aspas de prueba', tipoId: '', elementoId: '', capa: '' }),
  'liberaciones/mi1': base({ descripcion: 'Mi primera' }),
  'liberaciones/mi2': base({ descripcion: 'Mi segunda', pkInicio: 300, pkFin: 340 })
};
const rutas = async c => {
  await c.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await c.route(/fonts\./, r => r.abort());
};
async function abrir(b, u, hash) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 800 } }); await rutas(ctx); const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::|Failed to load resource/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [DB, u]);
  await p.goto(URL + (hash || '')); await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(700);
  return { ctx, p };
}
const ir = async (p, v) => { await p.evaluate(v => document.querySelector(`#nav [data-v="${v}"]`).click(), v); await p.waitForTimeout(400); };
const st = p => p.evaluate(() => window.__fakeStore());
const vistaActual = p => p.evaluate(() => (document.body.className.match(/\bv-(\S+)/) || [])[1]);
const hash = p => p.evaluate(() => location.hash);
const abrirReg = async (p, id) => { await p.evaluate(id => { [...document.querySelectorAll('#view [data-id], #view [data-rid]')].find(e => (e.dataset.id || e.dataset.rid) === id).click(); }, id); await p.waitForTimeout(500); };

(async () => {
  const b = await chromium.launch();

  // C8, C9, C10 y «Editar» (operario)
  {
    const { ctx, p } = await abrir(b, OPER, '#ajustes');
    ok(await vistaActual(p) !== 'ajustes' && await hash(p) === '#' + await vistaActual(p), 'C8: operario entra con #ajustes: la dirección dice la pantalla que ve (' + await hash(p) + ')');
    await p.evaluate(() => { location.hash = '#todos'; }); await p.waitForTimeout(400);
    ok(await hash(p) === '#' + await vistaActual(p) && await vistaActual(p) !== 'todos', 'C8: al escribir #todos a mano la dirección vuelve a la vista real (' + await hash(p) + ')');
    await p.evaluate(() => { location.hash = '#bandeja'; }); await p.waitForTimeout(400);
    ok(await hash(p) === '#' + await vistaActual(p), 'C8: #bandeja también (' + await hash(p) + ')');
    await p.evaluate(() => { location.hash = '#mis'; }); await p.waitForTimeout(400);
    ok(await vistaActual(p) === 'mis' && await hash(p) === '#mis', 'C8: una ruta permitida (#mis) sigue funcionando');

    // C9: etiqueta de la fecha según la actividad
    await ir(p, 'nueva'); await p.waitForSelector('#fLib:not([hidden])');
    const etq = async () => (await p.textContent('label[for="iFecha"]')).trim();
    const act = async a => { await p.click(`#pAct [data-act="${a}"]`); await p.waitForTimeout(250); return etq(); };
    ok(/liberación/.test(await act('LIB')), 'C9: liberación -> «' + await etq() + '»');
    const l = await act('LEV'); ok(/levantamiento/i.test(l) && !/liberación/.test(l), 'C9: levantamiento -> «' + l + '»');
    const d = await act('DRN'); ok(/vuelo/i.test(d) && !/liberación/.test(d), 'C9: dron -> «' + d + '»');
    const a = await act('ASP'); ok(/aspas/i.test(a) && !/liberación/.test(a), 'C9: aspas -> «' + a + '»');
    // Ficha
    await ir(p, 'mis'); await p.waitForTimeout(300);
    await abrirReg(p, 'lv1');
    const kv = await p.textContent('#sheet .kv');
    ok(/Fecha del levantamiento/.test(kv) && !/Fecha de liberación/.test(kv), 'C9: la ficha del levantamiento dice «Fecha del levantamiento»');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    await abrirReg(p, 'mi1');
    ok(/Fecha de liberación/.test(await p.textContent('#sheet .kv')), 'C9: la ficha de una liberación sigue diciendo «Fecha de liberación»');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);

    // C10: el chip NA
    const chips = await p.$$eval('#view .st', e => e.map(x => x.textContent.trim()));
    ok(chips.includes('No lleva código') && !chips.includes('Levantamiento'), 'C10: el estado NA se muestra «No lleva código» (' + [...new Set(chips)].join(', ') + ')');

    await ctx.close();
  }

  // Extra (administrador)
  {
    const { ctx, p } = await abrir(b, ADMIN);
    // Extra: «Editar» otro registro mientras se edita uno con cambios pregunta
    await ir(p, 'todos'); await p.waitForTimeout(400); await abrirReg(p, 'mi1'); await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])'); await p.waitForTimeout(400);
    await p.fill('#iDesc', 'Cambiada a mano antes de editar otro'); await p.waitForTimeout(200);
    await p.keyboard.press('Control+k'); await p.waitForTimeout(400); await p.keyboard.type('Mi segunda'); await p.waitForTimeout(600);
    await p.keyboard.press('Enter'); await p.waitForTimeout(700);
    const hayFicha = await p.evaluate(() => !document.querySelector('#sheet').hidden);
    ok(hayFicha, 'Extra: el buscador abre la ficha de otro registro mientras se edita');
    if (hayFicha) {
      await p.click('#fEditar'); await p.waitForTimeout(600);
      ok(!!(await p.$('.dlg.on')) && /editando/i.test(await p.textContent('.dlg.on')), 'Extra: «Editar» otro registro con cambios sin guardar pregunta');
      ok(await p.inputValue('#iDesc').catch(() => '') === 'Cambiada a mano antes de editar otro', 'Extra: lo escrito sigue ahí mientras se decide');
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    }
    await ctx.close();
  }

  // C13: el nombre en «Registrado por» (gabinete no tiene la lista de usuarios)
  {
    const { ctx, p } = await abrir(b, GAB);
    await ir(p, 'todos'); await p.waitForTimeout(500);
    const ver = async id => { await abrirReg(p, id); const t = await p.textContent('#sheet .kv'); await p.keyboard.press('Escape'); await p.waitForTimeout(400); return t.replace(/\s+/g, ' '); };
    const t1 = await ver('otro1'), t2 = await ver('otro2');
    ok(/Registrado por\s*Ana Torres Quispe/.test(t1) && !/otra\.persona@/.test(t1), 'C13: con creadoNombre muestra el nombre sin el correo');
    ok(/Registrado por\s*viejo\.usuario(?!@)/.test(t2) && !/viejo\.usuario@/.test(t2), 'C13: sin creadoNombre muestra solo lo de antes de la «@»');
    await ctx.close();
  }
  // C13: al crear se guarda el nombre
  {
    const { ctx, p } = await abrir(b, OPER);
    await ir(p, 'nueva'); await p.waitForSelector('#fLib:not([hidden])');
    await p.selectOption('#iTopo', 'GN'); await p.selectOption('#iEst', 'pp'); await p.selectOption('#iSub', 'pp-oeste'); await tipo(p, 'filtro1');
    await p.fill('#iPk1', '0+100'); await p.fill('#iPk2', '0+140'); await p.fill('#iDesc', 'Registro nuevo con nombre');
    await p.click('#bGuardar'); await p.waitForTimeout(700);
    const s = await st(p), nuevo = Object.entries(s).find(([k, v]) => k.startsWith('liberaciones/') && v.descripcion === 'Registro nuevo con nombre');
    ok(nuevo && nuevo[1].creadoNombre === 'Pedro Operario', 'C13: el registro nuevo guarda creadoNombre (' + (nuevo && nuevo[1].creadoNombre) + ')');
    // A6: la capa oculta no se sugiere en «Nueva» y las demás salen en orden
    await ir(p, 'nueva'); await p.waitForSelector('#fLib:not([hidden])');
    await p.click('#pAct [data-act="LIB"]'); await p.waitForTimeout(200);
    await p.selectOption('#iEst', 'pp'); await p.selectOption('#iSub', 'pp-oeste');
    await p.evaluate(() => { const t = document.querySelector('#tSel .tsel-chips .chip, #tSel .chip'); });
    const tipoBtn = await p.$('#tSel .tsel-chips .chip'); if (tipoBtn) { await p.evaluate(() => document.querySelector('#tSel .tsel-chips .chip').click()); await p.waitForTimeout(300); }
    const sug = await p.$$eval('#dlCapas option', o => o.map(x => x.value));
    ok(sug.length > 0 && !sug.includes('Capa 11'), 'A6: la capa oculta no se sugiere en «Nueva» (' + sug.join(', ') + ')');
    ok(sug.join() === 'Capa 2,Capa 10,Capa 12' || sug.length === 0 || sug.join() === [...sug].sort((x, y) => x.localeCompare(y, 'es', { numeric: true })).join(), 'A6: las sugeridas salen en orden natural (' + sug.join(', ') + ')');
    await ctx.close();
  }

  // Ajustes (administrador)
  {
    const { ctx, p } = await abrir(b, ADMIN);
    await ir(p, 'ajustes'); await p.waitForSelector('.ajgrid [data-tab]');
    const tab = async t => { await p.evaluate(t => document.querySelector(`.ajgrid [data-tab="${t}"]`).click(), t); await p.waitForTimeout(600); };
    // A5: lugares
    await tab('lugares');
    const nomFrente = async id => (await st(p))['listas/estructuras'].items.flatMap(e => e.subs).find(s => s.id === id).nombre;
    await p.fill('[data-s="pp-este"] [data-k="snom"]', 'PRESA principal oéste'); await p.press('[data-s="pp-este"] [data-k="snom"]', 'Tab'); await p.waitForTimeout(500);
    ok(await nomFrente('pp-este') === 'Presa Principal Este', 'A5: renombrar un frente a otro que ya existe (otras mayúsculas y tilde) se rechaza (' + await nomFrente('pp-este') + ')');
    ok(await p.inputValue('[data-s="pp-este"] [data-k="snom"]') === 'Presa Principal Este', 'A5: el campo vuelve al nombre anterior');
    await p.fill('[data-s="pp-este"] [data-k="snom"]', 'Presa Principal Este 2'); await p.press('[data-s="pp-este"] [data-k="snom"]', 'Tab'); await p.waitForTimeout(500);
    ok(await nomFrente('pp-este') === 'Presa Principal Este 2', 'A5: un nombre distinto sí se acepta');
    await p.evaluate(() => { const i = document.querySelector('[data-e="pan"] .est-h [data-k="enom"]'); i.value = 'presa principal'; i.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(500);
    ok((await st(p))['listas/estructuras'].items.find(e => e.id === 'pan').nombre === 'Presa Auxiliar Norte', 'A5: una estructura tampoco se renombra a una repetida');
    // tipos
    await tab('tipos');
    await p.fill('.tyrow[data-id="filtro2"] [data-k="nom"]', 'relleno  FILTRO 1'); await p.press('.tyrow[data-id="filtro2"] [data-k="nom"]', 'Tab'); await p.waitForTimeout(500);
    ok((await st(p))['listas/tipos'].items.find(t => t.id === 'filtro2').nombre === 'Relleno filtro 2', 'A5: un tipo no se renombra a uno que ya existe');
    await p.fill('.tyrow[data-id="filtro2"] [data-k="nom"]', 'Relleno filtro dos'); await p.press('.tyrow[data-id="filtro2"] [data-k="nom"]', 'Tab'); await p.waitForTimeout(500);
    ok((await st(p))['listas/tipos'].items.find(t => t.id === 'filtro2').nombre === 'Relleno filtro dos', 'A5: un tipo con nombre distinto sí se renombra');
    // capas
    await tab('capas'); await p.waitForSelector('#cCapas'); await p.selectOption('#cSub', 'pp-oeste'); await p.waitForTimeout(300); await p.selectOption('#cTipo', 'filtro1'); await p.waitForTimeout(400);
    const capas = async () => (await st(p))['capas/pp-oeste'].tipos.filtro1.capas.map(c => c.nombre);
    const fila = n => `#cCapas .ct-row:has(input[value="${n}"]) [data-k="nom"]`;
    await p.fill(fila('Capa 10'), 'Capa 02'); await p.press(fila('Capa 10'), 'Tab'); await p.waitForTimeout(500);
    ok((await capas()).includes('Capa 10') && (await capas()).filter(x => /^Capa 0?2$/.test(x)).length === 1, 'A5: «Capa 10» no se renombra a «Capa 02» (es «Capa 2»): ' + (await capas()).join(', '));
    // A6: orden natural al guardar
    await p.fill('#cNom', 'Capa 3'); await p.click('#cAdd'); await p.waitForTimeout(500);
    await p.fill('#cNom', 'Capa 1'); await p.click('#cAdd'); await p.waitForTimeout(500);
    const ord = await capas();
    ok(ord.join() === [...ord].sort((x, y) => x.localeCompare(y, 'es', { numeric: true })).join(), 'A6: las capas se guardan en orden natural: ' + ord.join(', '));
    // A7: «Cotas en serie» sin selección
    ok(await p.isVisible('[data-bulk="cotas"]'), 'A7: «Cotas en serie» se ve sin seleccionar nada');
    await p.click('[data-bulk="cotas"]'); await p.waitForSelector('#cSerie:not([hidden])');
    ok(/todas/.test(await p.textContent('#cSOk')), 'A7: sin selección el botón dice «Aplicar a todas»');
    await p.fill('#cS0', '758.00'); await p.fill('#cSd', '0.30'); await p.click('#cSOk'); await p.waitForTimeout(500);
    const cs = (await st(p))['capas/pp-oeste'].tipos.filtro1.capas;
    ok(cs.every(c => c.cota !== undefined && c.cota !== ''), 'A7: se aplicó a todas las capas (' + cs.map(c => c.nombre + '=' + c.cota).join(', ') + ')');
    ok(cs.find(c => c.nombre === 'Capa 1').cota === '758.00' && cs.find(c => c.nombre === 'Capa 2').cota === '758.30', 'A7: en orden natural (Capa 1 = 758.00, Capa 2 = 758.30)');
    // A11 y A12: usuarios
    await tab('usuarios'); await p.waitForSelector('#uMail');
    const intenta = async mail => { await p.fill('#uMail', mail); await p.fill('#uNom', 'Prueba Nueva'); await p.selectOption('#uRol', 'operario'); await p.click('#uAdd'); await p.waitForTimeout(500); return (await st(p))['usuarios/' + mail.toLowerCase()]; };
    ok(!(await intenta('a@b.c')), 'A11: «a@b.c» no se agrega');
    ok(!(await intenta('a@b.co')), 'A11: «a@b.co» (dominio de 1 letra) no se agrega');
    ok(!(await intenta('a@bb.c')), 'A11: «a@bb.c» (final de 1 letra) no se agrega');
    ok(!!(await intenta('nuevo.usuario@gmail.com')), 'A11: un correo normal sí se agrega');
    ok(!!(await intenta('otro@empresa.com.pe')), 'A11: un correo con dominio compuesto sí se agrega');
    // A12: topógrafo sin clave (agregar)
    await p.fill('#uMail', 'topo.sin.clave@gmail.com'); await p.fill('#uNom', 'Topo Sin Clave'); await p.selectOption('#uRol', 'topografo'); await p.selectOption('#uTopo', ''); await p.click('#uAdd'); await p.waitForTimeout(500);
    ok(!!(await p.$('.dlg.on')) && /clave de top/i.test(await p.textContent('.dlg.on')), 'A12: agregar un topógrafo sin clave avisa y pide confirmar');
    ok(!(await st(p))['usuarios/topo.sin.clave@gmail.com'], 'A12: mientras no se confirma no se agrega');
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    ok(!(await p.$('.dlg.on')) && !(await st(p))['usuarios/topo.sin.clave@gmail.com'], 'A12: al cancelar no se agrega');
    await p.click('#uAdd'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(600);
    ok(!!(await st(p))['usuarios/topo.sin.clave@gmail.com'], 'A12: al confirmar sí se agrega');
    // A12: cambiar el rol de alguien sin clave a topógrafo
    await p.waitForSelector('#usr [data-mail="ana@gmail.com"] [data-k="rol"]');
    await p.selectOption('#usr [data-mail="ana@gmail.com"] [data-k="rol"]', 'topografo'); await p.waitForTimeout(600);
    ok(!!(await p.$('.dlg.on')) && /clave de top/i.test(await p.textContent('.dlg.on')), 'A12: cambiar el rol a topógrafo sin clave también avisa');
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    ok((await st(p))['usuarios/ana@gmail.com'].rol === 'operario', 'A12: al cancelar el rol no cambia');
    await ctx.close();
  }

  // A9: recordar emparejamientos de una importación
  {
    const { ctx, p } = await abrir(b, ADMIN);
    const csv = path.join(os.tmpdir(), 'prueba50-imp.csv');
    fs.writeFileSync(csv, '﻿N° Registro;Key_Topografo;Descripcion;Km Inicio;Km Fin;Fecha Liberacion;Fecha de entrega;Estructura;Sub-Estructura;Elemento;Tipo de Liberacion\r\n'
      + 'SKT-TOP-02900;GN;Uno;0+100;0+140;05/01/2026;06/01/2026;Presa Principal;Frente raro del Excel;Movimiento de tierras;Tipo raro del Excel\r\n');
    await ir(p, 'ajustes'); await p.waitForSelector('.ajgrid [data-tab]');
    const abrirHist = async () => { await p.evaluate(() => document.querySelector('.ajgrid [data-tab="historico"]').click()); await p.waitForSelector('#hFile', { state: 'attached' }); };
    await abrirHist(); await p.setInputFiles('#hFile', csv);
    await p.waitForSelector('select[data-par="sub"]', { timeout: 15000 });
    ok(!!(await p.$('select[data-par="tipo"]')), 'A9: la primera vez pide elegir el frente y el tipo');
    await p.selectOption('select[data-par="sub"]', 'pp-sur'); await p.waitForTimeout(400);
    await p.selectOption('select[data-par="tipo"]', 'masivo'); await p.waitForTimeout(600);
    await p.waitForFunction(() => document.querySelector('#hCuenta'), null, { timeout: 15000 });
    // Se repite la importación (se vuelve a cargar el archivo)
    await abrirHist(); await p.setInputFiles('#hFile', csv);
    await p.waitForFunction(() => !document.querySelector('#hLeyendo') && (document.querySelector('#hCuenta') || document.querySelector('select[data-par]')), null, { timeout: 15000 });
    ok(!!(await p.$('#hCuenta')) && !(await p.$('#hRes .pinfo.aviso')), 'A9: al repetir el archivo ya no pide emparejar a mano');
    // Tras recargar la página también se recuerda (localStorage)
    await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(500);
    await ir(p, 'ajustes'); await p.waitForSelector('.ajgrid [data-tab]'); await abrirHist(); await p.setInputFiles('#hFile', csv);
    await p.waitForFunction(() => !document.querySelector('#hLeyendo') && (document.querySelector('#hCuenta') || document.querySelector('select[data-par]')), null, { timeout: 15000 });
    ok(!!(await p.$('#hCuenta')), 'A9: tras recargar la app, los emparejamientos siguen recordados');
    const vals = await p.$$eval('#hRes select[data-par]', s => s.map(x => x.dataset.par + '=' + x.value));
    ok(vals.includes('sub=pp-sur') && vals.includes('tipo=masivo'), 'A9: lo propuesto es lo elegido antes (' + vals.join(', ') + ')');
    await ctx.close();
  }

  // P9: eje LandXML con una curva sin <Center>
  {
    const { ctx, p } = await abrir(b, ADMIN);
    const xml = c => `<?xml version="1.0"?><LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2" version="1.2"><Alignments><Alignment name="Eje" length="100" staStart="0"><CoordGeom><Line length="50"><Start>8300000 500000</Start><End>8300050 500000</End></Line><Curve length="50" radius="100" rot="ccw"><Start>8300050 500000</Start><End>8300090 500040</End>${c}</Curve></CoordGeom></Alignment></Alignments></LandXML>`;
    const malo = path.join(os.tmpdir(), 'prueba50-malo.xml');
    fs.writeFileSync(malo, xml(''));
    await ir(p, 'ajustes'); await p.waitForSelector('.ajgrid [data-tab]');
    await p.evaluate(() => document.querySelector('.ajgrid [data-tab="lugares"]').click()); await p.waitForTimeout(600);
    const inp = await p.$('[data-s="pp-oeste"] input[type=file]'); ok(!!inp, 'P9: hay donde subir el eje');
    await inp.setInputFiles(malo); await p.waitForTimeout(1200);
    const t = await p.evaluate(() => document.body.innerText);
    ok(/centro|Center/i.test(t) && !(await p.$('.dlg.on')), 'P9: el XML con la curva sin centro se rechaza con un aviso claro');
    const s = await st(p); ok(!(s['ejes/pp-oeste'] || {}).puntos || !(s['ejes/pp-oeste'].puntos || []).some(Number.isNaN), 'P9: no se guardó ningún eje con coordenadas NaN');
    await ctx.close();
  }

  await b.close();
  ok(errores.length === 0, 'sin errores de página' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
})().catch(e => { console.log('ERROR', e); process.exit(1); });
