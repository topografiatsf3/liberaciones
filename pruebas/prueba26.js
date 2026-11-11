// Panel (avance con «no se libera», eje en formato español, bases con islas, resumen repartido),
// carpeta de OneDrive al entregar, Ajustes → Tipos (catálogo, orden, unir, desactivar), Usuarios del jefe y «Depurar fotos»
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba26'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const JEFE = { uid: 'j1', email: 'jefe@gmail.com', displayName: 'Jefe Prueba' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };

// ---------- 1. Funciones de cálculo, sacadas tal cual de index.html ----------
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function fuente(nombre) {
  let i = html.indexOf(`function ${nombre}(`); if (i < 0) { i = html.indexOf(`const ${nombre} =`); return html.slice(i, html.indexOf('\n', i)); }
  let j = html.indexOf('{', i), n = 0;
  for (let k = j; k < html.length; k++) { if (html[k] === '{') n++; else if (html[k] === '}' && --n === 0) return html.slice(i, k + 1); }
}
const F = new Function(['leerPk', 'unir', 'unionLen', 'huecos', 'ivDe', 'avance', 'leerEje', 'areaAnillo', 'dentroDe', 'ordenarAnillos', 'profAnillo', 'areaBase', 'islasHuecos', 'buclesTin', 'bordeTin', 'parteRes'].map(fuente).join('\n') + '\nconst PARTES_RES = 4;\nreturn { avance, leerEje, ordenarAnillos, areaBase, islasHuecos, bordeTin, parteRes };')();

ok(F.avance([[0, 700]], [[0, 500]], 0, 1000).pct === 40, 'avance: lo liberado sobre un tramo «no se libera» no se cuenta dos veces (40 %, no 100 %)');
ok(F.avance([[0, 999.9]], [], 0, 1000).pct === 99, 'avance: no marca 100 % mientras quede un hueco');
ok(F.avance([[0, 500], [500, 1000]], [], 0, 1000).pct === 100, 'avance: completo es 100 %');
let e = F.leerEje('PK;Este;Norte\n0+000;345678,12;8765432,10\n0+010;345688,12;8765432,10\n0+020;345698,12;8765432,10');
ok(e.length === 3 && e[1][0] === 10 && Math.abs(e[1][1] - 345688.12) < 1e-6, 'eje en CSV español («;» y coma decimal) se lee bien');
e = F.leerEje('1,345678.0,8765432.0\n2,345698.0,8765432.0\n3,345718.0,8765432.0', 0);
ok(e.map(q => q[0]).join() === '0,20,40', 'una columna «Punto» (1, 2, 3) no se toma como PK: se mide por distancia');
e = F.leerEje('40,345678,8765432\n20,345698,8765432\n0,345718,8765432');
ok(e[0][0] === 0 && e[0][1] === 345718, 'un PK de mayor a menor se ordena y el eje no queda al revés');
const cuad = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
let an = F.ordenarAnillos([cuad(0, 0, 100, 60), cuad(500, 0, 80, 50)]);
ok(Math.round(F.areaBase(an)) === 10000 && F.islasHuecos(an).islas === 2, 'una base con dos islas cuenta las dos (10 000 m²)');
an = F.ordenarAnillos([cuad(0, 0, 100, 60), cuad(500, 0, 80, 50), cuad(10, 10, 10, 10)]);
ok(Math.round(F.areaBase(an)) === 9900 && F.islasHuecos(an).huecos === 1, 'y descuenta el hueco de una de ellas (9 900 m²)');
// TIN en anillo: 8 puntos (cuadrado 100×100 con hueco 40×40), el borde debe ser el de afuera
const Q = [[0, 0], [100, 0], [100, 100], [0, 100], [30, 30], [70, 30], [70, 70], [30, 70]];
const Fc = [[0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]];
ok(Math.round(Math.abs(F.areaBase([F.bordeTin(Q, Fc)]))) === 10000, 'el borde de una TIN con hueco es el exterior');
const partes = [0, 0, 0, 0]; for (let i = 0; i < 2000; i++) partes[F.parteRes('id' + i.toString(36) + 'x')]++;
ok(partes.every(n => n > 350), 'el resumen se reparte parejo en 4 partes: ' + partes.join(' / '));

// ---------- 2. En el navegador ----------
async function preparar(ctx) {
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
}
const escuchar = (p, n) => { p.on('pageerror', e => { errores.push(n + ': ' + e.message); console.log('PAGEERROR', n, e.message); }); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(n + ': ' + m.text()); console.log('CONSOLE', n, m.text()); } }); };
const ahora = Date.now();
const lib = (extra) => ({ actividad: 'LIB', estado: 'EP', numero: 'SKT-TOP-02700', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'masivo', capa: 'Capa 3', topografoId: 'GN', descripcion: 'Relleno masivo capa 3', pkInicio: 100, pkFin: 140, fechaCampo: { __ts: ahora - 864e5 }, creadoEn: { __ts: ahora - 864e5 }, archivos: [], ...extra });
const DB = {
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'usuarios/jefe@gmail.com': { nombre: 'Jefe Prueba', rol: 'jefe', activo: true },
  'listas/elementos': { items: [{ id: 'mt', nombre: 'Movimiento de tierras' }, { id: 'dr', nombre: 'Drenaje' }] },
  'listas/tipos': { items: [
    { id: 'masivo', nombre: 'Relleno masivo', elementoId: 'mt', orden: 1, enGrafico: true },
    { id: 'transicion', nombre: 'Relleno de transición', elementoId: 'mt', orden: 2, enGrafico: true },
    { id: 'filtro1', nombre: 'Relleno filtro 1', elementoId: 'mt', orden: 3, enGrafico: true },
    { id: 'tuberia', nombre: 'Tubería de drenaje', elementoId: 'dr', orden: 4, enGrafico: false },
    { id: 'masivoo', nombre: 'Relleno masivoo', elementoId: 'mt', orden: 5, enGrafico: true, nuevo: true, creadoPor: 'operario@gmail.com', creadoNombre: 'Pedro Operario' }] },
  'liberaciones/e1': lib({ archivos: [{ id: 'f1', tipo: 'foto', nombre: 'foto1.jpg', tam: 120000 }] }),
  'liberaciones/e2': lib({ estado: 'EC', numero: 'SKT-TOP-02701', pkInicio: 140, pkFin: 180, carpeta: 'https://contoso-my.sharepoint.com/:f:/g/cargo12', fechaEntrega: { __ts: ahora } }),
  'liberaciones/e3': lib({ estado: 'PT', numero: '', tipoId: 'masivoo', pkInicio: 180, pkFin: 200 }),
};
let b;
(async () => {
  b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); await preparar(ctx);
  const p = await ctx.newPage(); escuchar(p, 'admin');
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [DB, ADMIN]);
  await p.reload(); await p.waitForSelector('#nav button');
  await p.waitForFunction(() => window.__fakeStore()['config/general']?.resumenV === 2, null, { timeout: 20000 });
  const st = await p.evaluate(() => window.__fakeStore());
  const partes = Object.keys(st).filter(k => k.startsWith('resumen/pp-oeste'));
  ok(partes.length >= 1 && partes.every(k => /^resumen\/pp-oeste(~[123])?$/.test(k)), 'el resumen del frente queda en sus partes: ' + partes.join(', '));

  // Ficha de un entregado: carpeta de OneDrive con enlace y «Cambiar carpeta»
  await p.click('[data-v="todos"]'); await p.waitForSelector('.rtab tr[data-id="e2"]');
  await p.click('.rtab tr[data-id="e2"] td:nth-child(4)'); await p.waitForSelector('#sheet.on');
  ok(await p.$eval('#sheet a[href^="https://contoso-my.sharepoint.com"]', a => a.textContent === 'Abrir carpeta' && a.rel.includes('noopener')), 'la ficha muestra «Abrir carpeta» con el enlace de OneDrive');
  ok(!!(await p.$('#sheet #fCarpeta')), 'y gabinete puede cambiarla');
  await p.click('#fCarpeta'); await p.waitForSelector('.dlg.on #dCarpeta');
  await p.fill('#dCarpeta', ''); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(500);
  ok((await p.evaluate(() => window.__fakeStore()['liberaciones/e2'].carpeta)) === undefined, 'dejar la carpeta vacía la quita (es opcional)');
  await p.click('#fCarpeta'); await p.waitForSelector('.dlg.on #dCarpeta');
  await p.fill('#dCarpeta', 'OneDrive\\Liberaciones\\Cargo 13'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(500);
  ok((await p.evaluate(() => window.__fakeStore()['liberaciones/e2'].carpeta)) === 'OneDrive\\Liberaciones\\Cargo 13', 'la ruta de la carpeta se guarda');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // Ajustes → Tipos
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="tipos"]'); await p.waitForSelector('#tyList');
  ok(await p.$$eval('#tyList .elgrp [data-k="enom"]', x => x.map(i => i.value).join()) === 'Movimiento de tierras,Drenaje', 'catálogo agrupado por elemento');
  ok(/Unir con «Relleno masivo»/.test(await p.textContent('#nvBox [data-nt="masivoo"] [data-k="unirP"]')), '«Agregados desde campo» ofrece unir con el parecido en un toque');
  await p.waitForFunction(() => /1 registro/.test(document.querySelector('#nvBox [data-nt="masivoo"]')?.textContent || ''), null, { timeout: 8000 }).catch(() => {});
  ok(/1 registro/.test(await p.textContent('#nvBox [data-nt="masivoo"]')), 'y dice cuántos registros tiene');
  await p.screenshot({ path: OUT + '/01-tipos-catalogo.png', fullPage: true });
  await p.fill('#tyQ', 'filtro'); await p.waitForTimeout(400);
  ok(await p.$$eval('#tyList .tyrow', r => r.length === 1 && r[0].dataset.id === 'filtro1'), 'el buscador filtra los tipos');
  ok(await p.evaluate(() => document.activeElement?.id === 'tyQ'), 'y no pierde el foco al escribir');
  await p.fill('#tyQ', ''); await p.waitForTimeout(400);
  // Unir el repetido
  await p.click('#nvBox [data-nt="masivoo"] [data-k="unirP"]'); await p.waitForSelector('.dlg.on'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(900);
  const st2 = await p.evaluate(() => window.__fakeStore());
  ok(!st2['listas/tipos'].items.some(t => t.id === 'masivoo') && st2['liberaciones/e3'].tipoId === 'masivo', 'unir pasa el registro a «Relleno masivo» y quita el repetido');
  // Desactivar desde «⋯» con «Deshacer»
  await p.waitForSelector('#tyList [data-id="transicion"] [data-k="mas"]');
  await p.click('#tyList [data-id="transicion"] [data-k="mas"]'); await p.waitForSelector('#ctx .ctx-i');
  await p.click('#ctx .ctx-i:has-text("Desactivar")'); await p.waitForTimeout(500);
  ok((await p.evaluate(() => window.__fakeStore()['listas/tipos'].items.find(t => t.id === 'transicion').activo)) === false, '«⋯ → Desactivar» desactiva un tipo ya revisado');
  ok(!!(await p.$('#toast .toast-btn')), 'y el aviso trae «Deshacer»');
  await p.click('#toast .toast-btn'); await p.waitForTimeout(500);
  ok((await p.evaluate(() => window.__fakeStore()['listas/tipos'].items.find(t => t.id === 'transicion').activo)) !== false, '«Deshacer» lo vuelve a activar');
  // Orden en el perfil: mover el 3.º a la posición 1 de una vez
  await p.click('[data-tyv="ord"]'); await p.waitForSelector('#tyOrd');
  ok(await p.$$eval('#tyOrd .tyord', r => r.length) === 3, '«Orden en el perfil» lista solo los que se dibujan');
  await p.fill('#tyOrd [data-id="filtro1"] [data-k="pos"]', '1'); await p.press('#tyOrd [data-id="filtro1"] [data-k="pos"]', 'Enter'); await p.waitForTimeout(500);
  const ord = await p.evaluate(() => window.__fakeStore()['listas/tipos'].items.slice().sort((a, b) => a.orden - b.orden).map(t => t.id).join());
  ok(ord.startsWith('filtro1,masivo,transicion'), 'escribir la posición mueve el tipo de una vez: ' + ord);
  await p.screenshot({ path: OUT + '/02-tipos-orden.png', fullPage: true });

  // Archivos: explica por qué no hay fotos para depurar
  await p.click('[data-tab="archivos"]'); await p.waitForSelector('#arCalc'); await p.click('#arCalc'); await p.waitForSelector('#arBorrar');
  const txt = await p.textContent('#ajBody');
  ok(/No hay fotos para depurar/.test(txt) && /aún no se entregan a Calidad \(1 en proceso\)/.test(txt), '«Depurar fotos» explica que la foto es de un registro aún no entregado');
  await p.screenshot({ path: OUT + '/03-archivos.png' });

  // CSV con la carpeta
  await p.click('[data-v="todos"]'); await p.waitForSelector('#rExp');
  const dl = p.waitForEvent('download'); await p.click('#rExp'); const f = await dl; const csv = fs.readFileSync(await f.path(), 'utf8');
  ok(csv.split('\n')[0].includes('Carpeta OneDrive') && csv.includes('Cargo 13'), 'el CSV exportado trae la carpeta de OneDrive');

  // Jefe: no se cambia a sí mismo ni crea administradores; un correo existente pide confirmar
  await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, JEFE); await p.click('#gEntrar'); await p.waitForSelector('#nav button');
  await p.click('[data-v="ajustes"]:not([hidden])'); await p.click('[data-tab="usuarios"]'); await p.waitForSelector('#usr');
  ok(!(await p.$('#usr [data-mail="jefe@gmail.com"] select')) && /tú/.test(await p.textContent('#usr [data-mail="jefe@gmail.com"]')), 'el jefe no puede cambiar su propio rol ni desactivarse');
  ok(!(await p.$$eval('#uRol option', o => o.map(x => x.value))).includes('admin'), 'el jefe no puede crear administradores');
  await p.fill('#uMail', 'operario@gmail.com'); await p.selectOption('#uRol', 'gabinete'); await p.click('#uAdd'); await p.waitForTimeout(300);
  ok(/Ya tiene acceso/.test(await p.textContent('.dlg.on')), 'agregar un correo que ya tiene acceso pide confirmar el cambio de rol');
  await p.click('.dlg.on [data-x]').catch(() => p.keyboard.press('Escape')); await p.waitForTimeout(300);
  ok((await p.evaluate(() => window.__fakeStore()['usuarios/operario@gmail.com'].rol)) === 'operario', 'al cancelar no cambia nada');

  ok(!errores.length, 'sin errores en la consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
  console.log('Errores:', errores.length ? errores.join(' | ') : 'ninguno');
  await b.close();
})().catch(async e => { console.log('FALLA: excepción', e); process.exitCode = 1; await b?.close(); });
