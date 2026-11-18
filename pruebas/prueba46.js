// Lo que perdía o falseaba datos en el formulario y en Ajustes (revisión v39: C1–C5, A3, A4).
// C1 los archivos adjuntos del borrador de «Nueva» se guardan en IndexedDB y vuelven al recargar (y si no se puede, aviso con los nombres)
// · C2 «2,500» en el PK pide elegir entre 2+500 y 0+002.50 · C3 no se guarda una fecha de campo futura · C4 recargar mientras se edita
// vuelve a «Editar registro» con lo escrito · C5 «Nueva» mientras se edita pregunta · A3 lo escrito en «Agregar por correo» no se borra
// cuando llega una solicitud · A4 un guardado rechazado en Ajustes no queda a la vista.
// Para ver que la prueba falla con una versión anterior: ANTES=ruta\index.html node pruebas\prueba46.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba46'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const FS = 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const ahora = Date.now(), hora = 36e5;
const base = extra => ({ actividad: 'LIB', creadoPor: 'operario@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', numero: '', equipo: 'ET', estado: 'PT', fechaCampo: { __ts: ahora - hora }, creadoEn: { __ts: ahora - hora }, editadoEn: { __ts: ahora - hora }, archivos: [], ...extra });
const DB = {
  'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true },
  'liberaciones/pt1': base({ descripcion: 'Liberación pendiente uno', pkInicio: 100, pkFin: 140, cota: '770.10' }),
  'liberaciones/pt2': base({ descripcion: 'Liberación pendiente dos', pkInicio: 140, pkFin: 170, cota: '770.20' }),
  'liberaciones/ob1': base({ estado: 'OB', descripcion: 'Liberación observada', notaObservacion: 'Falta foto', pkInicio: 170, pkFin: 200, observaciones: '' }),
};
const FOTO = fs.readFileSync(path.join(__dirname, 'datos', 'foto-prueba.png'));
const foto = n => ({ name: n, mimeType: 'image/png', buffer: FOTO });
const esperar = (p, fn, arg, ms = 8000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
async function entrarComo(p, u) { await p.click('#btnSalir'); await p.waitForSelector('#gEntrar'); await p.evaluate(u => { window.__fakeLogin = u; }, u); await p.click('#gEntrar'); await p.waitForSelector('#nav button'); await p.waitForTimeout(500); }
// Lo guardado en IndexedDB para una clave («nueva|correo» o «edita|correo»)
const idb = (p, k) => p.evaluate(k => new Promise(ok => {
  let r; try { r = indexedDB.open('lib-adjuntos', 1); } catch (e) { ok('sin'); return; }
  r.onupgradeneeded = () => r.result.createObjectStore('b');
  r.onsuccess = () => { const db = r.result, g = db.transaction('b').objectStore('b').get(k); g.onsuccess = () => { const v = g.result; ok(v ? { n: v.archivos.length, nombres: v.archivos.map(a => a.nombre), chars: v.archivos.reduce((s, a) => s + (a.datos || '').length, 0) } : null); db.close(); }; };
  r.onerror = () => ok('error');
}), k);
const regs = (p, desc) => p.evaluate(d => Object.entries(window.__fakeStore()).filter(([k, v]) => k.startsWith('liberaciones/') && v.descripcion === d).map(([k, v]) => ({ id: k.split('/')[1], ...v })), desc);
const archDe = (p, id) => p.evaluate(id => Object.values(window.__fakeStore()).filter(v => v && v.liberacionId === id && v.datos).map(v => ({ nombre: v.nombre, foto: /^data:image\/jpeg;base64,/.test(v.datos) })), id);
const nombresArch = p => p.$$eval('#fLib .arch .an b', b => b.map(x => x.textContent.trim()));
// Texto de Ajustes con lo que hay dentro de los campos (los nombres están en inputs)
const textoAj = p => p.$eval('#ajBody', e => e.textContent + ' ' + [...e.querySelectorAll('input')].map(i => i.value).join(' | '));
const titulo = p => p.textContent('#view .view-title').then(t => t.trim()).catch(() => '');
const errDe = (p, name) => p.$eval(`#fLib [name="${name}"]`, el => el.closest('.f').querySelector('.err-msg')?.textContent || '').catch(() => '');
const recargar = async p => { await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(700); };
const confirmarDlg = async p => { await p.waitForSelector('.dlg.on [type=submit]'); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(300); };
async function tipo(p, id) {
  if (await p.$('#tCambiar')) { if (await p.inputValue('#fLib [name="tipoId"]') === id) return; await p.click('#tCambiar'); }
  if (!(await p.$(`#tRes [data-tipo="${id}"]`))) await p.click('#tRes [data-todos]');
  await p.click(`#tRes [data-tipo="${id}"]`); await p.waitForSelector('#tCambiar');
}
async function llenar(p, desc, pk1 = '1+000', pk2 = '1+020') {
  await p.selectOption('#iTopo', 'GN'); await p.selectOption('#iEst', 'pp'); await p.waitForTimeout(100); await p.selectOption('#iSub', 'pp-oeste');
  await tipo(p, 'filtro2');
  if (!(await p.$('#fEquipo [data-eq="ET"][aria-pressed="true"]'))) await p.click('#fEquipo [data-eq="ET"]');
  await p.fill('#iPk1', pk1); await p.fill('#iPk2', pk2); await p.fill('#iDesc', desc);
}
let b;
(async () => {
  // C2: la función compartida leerPk (buscador, importación, filtros) no cambia
  const src = fs.readFileSync(process.env.ANTES || path.join(__dirname, '..', 'index.html'), 'utf8');
  const leerPk = new Function(src.slice(src.indexOf('function leerPk(t) {'), src.indexOf('\nfunction fmtPk')) + ';return leerPk;')();
  const tabla = [['2,500', 2.5], ['2.500', 2.5], ['2+500', 2500], ['2500', 2500], ['2500.5', 2500.5], ['2+500.25', 2500.25], ['', null]];
  ok(tabla.every(([t, v]) => leerPk(t) === v), 'C2: leerPk (la que usan buscador, importación y filtros) sigue igual: ' + tabla.map(([t]) => `«${t}»→${leerPk(t)}`).join(' · '));

  b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 412, height: 900 } });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  if (process.env.ANTES) await ctx.route(u => /\/(index\.html)?$/.test(u.pathname), r => r.fulfill({ path: process.env.ANTES, contentType: 'text/html; charset=utf-8' }));
  // Para simular un navegador sin IndexedDB (modo privado, bloqueado): se activa con una marca en localStorage
  await ctx.addInitScript(() => { try { if (localStorage.getItem('__sinIDB')) Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); } catch (e) {} });
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts|net::/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  await p.evaluate(([d, u]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); }, [DB, ADMIN]);
  await recargar(p); await p.waitForTimeout(600);
  await entrarComo(p, OPER);
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])');

  // ===== C2: PK «2,500» =====
  await llenar(p, 'PK con coma', '2,500', '2.520');
  await p.click('#iCota'); await p.waitForTimeout(200);
  const lect = await p.$$eval('#fLib .pk-amb', c => c.map(x => [...x.querySelectorAll('[data-pkamb]')].map(b => b.textContent.trim())));
  ok(JSON.stringify(lect) === JSON.stringify([['2+500', '0+002.50'], ['2+520', '0+002.52']]), 'C2: bajo cada PK salen las dos lecturas como botones: ' + JSON.stringify(lect));
  ok(await p.inputValue('#iPk1') === '2,500' && await p.inputValue('#iPk2') === '2.520', 'C2: el campo no se convierte solo a 0+002.50');
  await p.click('#bGuardar'); await p.waitForTimeout(700);
  ok(!(await regs(p, 'PK con coma')).length, 'C2: sin elegir, no se guarda');
  ok(/Elige cómo se lee «2,500»: 2\+500 o 0\+002\.50/.test(await errDe(p, 'pkInicio')), 'C2: el error del campo lo dice: «' + await errDe(p, 'pkInicio') + '»');
  await p.screenshot({ path: OUT + '/01-pk-dos-lecturas.png' });
  await p.click('#fLib .pk-amb [data-pkamb="iPk1"][data-v="2+500"]'); await p.waitForTimeout(150);
  await p.click('#fLib .pk-amb [data-pkamb="iPk2"][data-v="2+520"]'); await p.waitForTimeout(150);
  ok(await p.inputValue('#iPk1') === '2+500' && await p.inputValue('#iPk2') === '2+520' && !(await p.$('#fLib .pk-amb')) && !(await errDe(p, 'pkInicio')), 'C2: al elegir «2+500» y «2+520» quedan esos valores y se van los botones y el error');
  // La otra lectura también se puede elegir
  await p.fill('#iPk2', '0,500'); await p.click('#iCota'); await p.waitForTimeout(150);
  await p.click('#fLib .pk-amb [data-pkamb="iPk2"][data-v="0+000.50"]'); await p.waitForTimeout(150);
  ok(await p.inputValue('#iPk2') === '0+000.50', 'C2: «0,500» → se puede elegir 0+000.50');
  // Los demás formatos siguen igual (se ordenan solos al salir del campo, sin preguntar)
  const formatos = [['2500', '2+500'], ['2500.5', '2+500.50'], ['2+500.25', '2+500.25'], ['2,50', '0+002.50'], ['2+500', '2+500'], ['2.5000', '0+002.50']];
  const malF = [];
  for (const [t, e] of formatos) { await p.fill('#iPk2', t); await p.click('#iCota'); await p.waitForTimeout(80); const v = await p.inputValue('#iPk2'), amb = !!(await p.$('#fLib .pk-amb')); if (v !== e || amb) malF.push(`«${t}» → «${v}»${amb ? ' (preguntó)' : ''}`); }
  ok(!malF.length, 'C2: 2500, 2500.5, 2+500.25, 2,50, 2+500 y 2.5000 siguen como antes, sin preguntar' + (malF.length ? ': ' + malF.join(' · ') : ''));
  await p.fill('#iPk2', '2+520'); await p.click('#iCota');
  await p.click('#bGuardar'); await p.waitForTimeout(900);
  let r = await regs(p, 'PK con coma');
  ok(r.length === 1 && r[0].pkInicio === 2500 && r[0].pkFin === 2520, 'C2: con lo elegido se guarda 2+500 – 2+520: ' + JSON.stringify(r.map(x => [x.pkInicio, x.pkFin])));

  // ===== C3: fecha futura =====
  await llenar(p, 'Fecha futura', '1+100', '1+120');
  const mx = await p.getAttribute('#iFecha', 'max'), dmx = new Date(mx) - Date.now();
  ok(mx && dmx > 8 * 60e3 && dmx < 11 * 60e3, `C3: el campo tiene max = ahora + 10 min (${mx})`);
  await p.fill('#iFecha', '2030-01-01T08:00'); await p.click('#bGuardar'); await p.waitForTimeout(600);
  ok(!(await regs(p, 'Fecha futura')).length && /posterior a ahora/.test(await errDe(p, 'fechaCampo')), 'C3: 2030 no se guarda y el campo lo dice: «' + await errDe(p, 'fechaCampo') + '»');
  const local = ms => { const d = new Date(ms), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
  await p.fill('#iFecha', local(Date.now() + 40 * 60e3)); await p.click('#bGuardar'); await p.waitForTimeout(600);
  ok(!(await regs(p, 'Fecha futura')).length, 'C3: dentro de 40 minutos tampoco');
  await p.fill('#iFecha', local(Date.now() + 5 * 60e3)); await p.click('#bGuardar'); await p.waitForTimeout(900);
  ok((await regs(p, 'Fecha futura')).length === 1, 'C3: 5 minutos adelante (reloj desajustado) sí se guarda');

  // ===== C1: fotos y CSV del borrador =====
  await llenar(p, 'Con fotos', '1+200', '1+220'); await p.fill('#iObs', 'obs del borrador');
  await p.setInputFiles('#fFoto', [foto('foto1.png'), foto('foto2.png'), foto('foto3.png')]); await p.waitForTimeout(1200);
  await p.setInputFiles('#fCsv', { name: 'lev.csv', mimeType: 'text/csv', buffer: Buffer.from('P1,8300000,450000,780\nP2,8300010,450010,781\n') }); await p.waitForTimeout(800);
  ok((await nombresArch(p)).length === 4, 'C1: 3 fotos y 1 CSV adjuntos: ' + (await nombresArch(p)).join(', '));
  const g0 = await idb(p, 'nueva|operario@gmail.com');
  ok(g0 && g0.n === 4, 'C1: ya están guardados en IndexedDB (sin esperar a cerrar): ' + JSON.stringify(g0));
  await recargar(p); await p.waitForSelector('#fLib:not([hidden])');
  await esperar(p, () => document.querySelectorAll('#fLib .arch').length === 4);
  ok(JSON.stringify(await nombresArch(p)) === JSON.stringify(['foto1.png', 'foto2.png', 'foto3.png', 'lev.csv']), 'C1: al recargar vuelven los 4 archivos, en orden: ' + (await nombresArch(p)).join(', '));
  ok(await p.inputValue('#iDesc') === 'Con fotos' && await p.inputValue('#iObs') === 'obs del borrador' && await p.inputValue('#iPk1') === '1+200', 'C1: y lo escrito (descripción, observaciones, PK)');
  ok(!(await p.$('#avAdj')), 'C1: sin aviso de archivos perdidos (no falta ninguno)');
  ok(await p.$$eval('#fLib .arch img', i => i.length) === 3, 'C1: las fotos recuperadas se ven en miniatura');
  await p.screenshot({ path: OUT + '/02-fotos-tras-recargar.png' });
  await p.click('#bGuardar'); await p.waitForTimeout(900);
  r = await regs(p, 'Con fotos'); const a1 = r[0] ? await archDe(p, r[0].id) : [];
  ok(r.length === 1 && r[0].archivos.length === 4 && a1.length === 4 && a1.filter(x => x.foto).length === 3, 'C1: se guardan con el registro (4 archivos, 3 fotos JPG con sus datos): ' + JSON.stringify(a1));
  ok(await idb(p, 'nueva|operario@gmail.com') === null && await p.evaluate(() => localStorage.getItem('lib.borrador.operario@gmail.com')) === 'null', 'C1: al guardar el registro se borran la copia de IndexedDB y el borrador');
  // «Limpiar» también los borra
  await p.fill('#iDesc', 'Para limpiar'); await p.setInputFiles('#fFoto', foto('limpiar.png')); await p.waitForTimeout(1000);
  ok((await idb(p, 'nueva|operario@gmail.com'))?.n === 1, 'C1: una foto nueva queda en IndexedDB');
  await p.click('#bLimpiar'); await confirmarDlg(p); await p.waitForTimeout(400);
  ok(await idb(p, 'nueva|operario@gmail.com') === null && !(await nombresArch(p)).length, 'C1: «Limpiar» (con confirmación) la borra');
  // El límite de 8 sigue y los 8 vuelven al recargar
  await llenar(p, 'Ocho fotos', '1+300', '1+320');
  await p.setInputFiles('#fFoto', Array.from({ length: 9 }, (_, i) => foto(`f${i + 1}.png`))); await p.waitForTimeout(2500);
  ok((await nombresArch(p)).length === 8 && /Máximo 8/.test(await p.textContent('#toast')), 'C1: con 9 fotos quedan 8 y avisa «Máximo 8»');
  await recargar(p); await esperar(p, () => document.querySelectorAll('#fLib .arch').length === 8);
  ok((await nombresArch(p)).length === 8, 'C1: los 8 vuelven al recargar');
  await p.click('#bLimpiar'); await confirmarDlg(p);

  // Tamaño en IndexedDB de un borrador con 8 fotos pesadas (ruido: lo peor para el JPEG)
  const ruido = await p.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 2400; c.height = 1800; const g = c.getContext('2d'), im = g.createImageData(c.width, c.height);
    for (let i = 0; i < im.data.length; i++) im.data[i] = (i % 4 === 3) ? 255 : (Math.random() * 255) | 0;
    g.putImageData(im, 0, 0);
    const bl = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)), u8 = new Uint8Array(await bl.arrayBuffer());
    let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192)); return btoa(s);
  });
  const est0 = await p.evaluate(() => navigator.storage.estimate().then(e => e.usage));
  await p.fill('#iDesc', 'Pesadas');
  await p.setInputFiles('#fFoto', Array.from({ length: 8 }, (_, i) => ({ name: `pesada${i + 1}.jpg`, mimeType: 'image/jpeg', buffer: Buffer.from(ruido, 'base64') })));
  await esperar(p, () => document.querySelectorAll('#fLib .arch').length === 8, null, 60000); await p.waitForTimeout(1500);
  const gP = await idb(p, 'nueva|operario@gmail.com'), est1 = await p.evaluate(() => navigator.storage.estimate().then(e => e.usage));
  console.log(`MEDIDA  - borrador con 8 fotos pesadas (${(Buffer.from(ruido, 'base64').length / 1048576).toFixed(1)} MB cada original): ${gP && (gP.chars / 1048576).toFixed(2)} millones de caracteres en IndexedDB; uso del sitio ${((est1 - est0) / 1048576).toFixed(1)} MB más`);
  ok(gP && gP.n === 8 && gP.chars <= 8 * 700000, `C1: 8 fotos pesadas caben (${gP && gP.chars} caracteres ≤ 8 × 700 000)`);
  await p.click('#bLimpiar'); await confirmarDlg(p);

  // ===== C1: el teléfono no deja guardar la copia (lleno) =====
  await p.evaluate(() => { window.__putOrig = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function () { throw new DOMException('lleno', 'QuotaExceededError'); }; });
  await llenar(p, 'Sin copia', '1+400', '1+420');
  await p.setInputFiles('#fFoto', [foto('fotoA.png'), foto('fotoB.png')]); await p.waitForTimeout(1200);
  ok(/no dejó guardar una copia de los archivos/.test(await p.textContent('#toast')), 'C1: si IndexedDB falla, avisa en el momento: «' + (await p.textContent('#toast')).trim().slice(0, 90) + '…»');
  await recargar(p); await p.waitForSelector('#avAdj', { timeout: 5000 }).catch(() => {});
  const av = await p.textContent('#avAdj').catch(() => '');
  ok(/Tenías 2 archivos adjuntos \(«fotoA\.png», «fotoB\.png»\): vuelve a adjuntarlos/.test(av), 'C1: al recargar, aviso visible con cuántos y cuáles: «' + av.trim() + '»');
  ok(await p.$eval('#avAdj', e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.top < 400 && getComputedStyle(e).display !== 'none'; }).catch(() => false), 'C1: el aviso está arriba, a la vista');
  ok(await p.inputValue('#iDesc') === 'Sin copia', 'C1: lo escrito sí vuelve');
  await p.screenshot({ path: OUT + '/03-aviso-archivos.png' });
  await recargar(p);
  ok(!!(await p.$('#avAdj')), 'C1: el aviso sigue tras otra recarga, hasta cerrarlo');
  await p.click('#bAvAdj'); await p.waitForTimeout(300);
  ok(!(await p.$('#avAdj')), 'C1: «Entendido» lo cierra');
  await recargar(p);
  ok(!(await p.$('#avAdj')), 'C1: y no vuelve a salir');
  await p.click('#bLimpiar'); await confirmarDlg(p);
  // Navegador sin IndexedDB: el aviso se va al adjuntar
  await p.evaluate(() => localStorage.setItem('__sinIDB', '1'));
  await recargar(p); await p.waitForSelector('#fLib:not([hidden])');
  ok(await p.evaluate(() => window.indexedDB === undefined), 'C1: (simulado) navegador sin IndexedDB');
  await llenar(p, 'Sin IndexedDB', '1+500', '1+520'); await p.setInputFiles('#fFoto', foto('sinidb.png')); await p.waitForTimeout(1200);
  await recargar(p); await p.waitForSelector('#avAdj', { timeout: 5000 }).catch(() => {});
  ok(/Tenías 1 archivo adjunto \(«sinidb\.png»\)/.test(await p.textContent('#avAdj').catch(() => '')), 'C1: sin IndexedDB también avisa: ' + (await p.textContent('#avAdj').catch(() => '—')).trim().slice(0, 60));
  await p.setInputFiles('#fFoto', foto('otra.png')); await p.waitForTimeout(1000);
  ok(!(await p.$('#avAdj')) && (await nombresArch(p)).includes('otra.png'), 'C1: al adjuntar de nuevo, el aviso se va');
  await p.click('#bGuardar'); await p.waitForTimeout(900);
  ok((await regs(p, 'Sin IndexedDB')).length === 1, 'C1: sin IndexedDB se sigue pudiendo guardar');
  await p.evaluate(() => localStorage.removeItem('__sinIDB')); await recargar(p);

  // ===== C4: recargar mientras se edita =====
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])');
  await llenar(p, 'Borrador de nueva', '1+600', '1+620'); await p.setInputFiles('#fFoto', foto('nueva.png')); await p.waitForTimeout(1200);
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(400);
  await p.click('.item:has-text("Liberación pendiente uno")'); await p.waitForSelector('#sheet.on #fEditar'); await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])');
  ok(await titulo(p) === 'Editar registro', 'C4: se abre «Editar registro»');
  await p.fill('#iCota', '780.50'); await p.fill('#iObs', 'Cambio sin guardar');
  await p.setInputFiles('#fFoto', foto('edicion.png')); await p.waitForTimeout(1200);
  ok((await idb(p, 'edita|operario@gmail.com'))?.n === 1, 'C4: la foto nueva de la edición va a IndexedDB aparte');
  await recargar(p); await p.waitForTimeout(500);
  await esperar(p, () => document.querySelector('#view .view-title')?.textContent.trim() === 'Editar registro');
  ok(await titulo(p) === 'Editar registro', 'C4: al recargar se vuelve a «Editar registro» (no a «Nueva»): ' + await titulo(p));
  await esperar(p, () => document.querySelectorAll('#fLib .arch').length >= 1);
  ok(await p.inputValue('#iCota') === '780.50' && await p.inputValue('#iObs') === 'Cambio sin guardar' && (await nombresArch(p)).includes('edicion.png'), 'C4: con lo cambiado y la foto nueva: ' + await p.inputValue('#iCota') + ' · ' + (await nombresArch(p)).join(', '));
  ok(/Se recuperó lo que estabas editando/.test(await p.textContent('#toast')), 'C4: avisa que se recuperó: «' + (await p.textContent('#toast')).trim() + '»');
  await p.screenshot({ path: OUT + '/04-edicion-recuperada.png' });
  // C3 también al editar
  const fOrig = await p.inputValue('#iFecha');
  await p.fill('#iFecha', '2030-05-05T10:00'); await p.click('#bGuardar'); await p.waitForTimeout(800);
  ok(/posterior a ahora/.test(await errDe(p, 'fechaCampo')) && (await p.evaluate(() => window.__fakeStore()['liberaciones/pt1'].cota)) === '770.10', 'C3: al editar tampoco se guarda una fecha futura');
  await p.fill('#iFecha', fOrig); await p.click('#bGuardar'); await p.waitForTimeout(1000);
  const pt1 = await p.evaluate(() => window.__fakeStore()['liberaciones/pt1']), ap1 = await archDe(p, 'pt1');
  ok(pt1.cota === '780.50' && pt1.observaciones === 'Cambio sin guardar' && ap1.some(x => x.nombre === 'edicion.png'), 'C4: «Guardar cambios» guarda lo recuperado con su foto');
  ok(await p.evaluate(() => localStorage.getItem('lib.edicion.operario@gmail.com')) === 'null' && await idb(p, 'edita|operario@gmail.com') === null, 'C4: y se borra el borrador de la edición');
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])'); await esperar(p, () => document.querySelectorAll('#fLib .arch').length === 1);
  ok(await titulo(p) !== 'Editar registro' && await p.inputValue('#iDesc') === 'Borrador de nueva' && (await nombresArch(p)).join() === 'nueva.png', 'C4: el borrador de «Nueva» (con su foto) sigue intacto');
  // Ya no se puede editar: cambió de estado mientras tanto
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(400);
  await p.click('.item:has-text("Liberación pendiente dos")'); await p.waitForSelector('#sheet.on #fEditar'); await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])');
  await p.fill('#iCota', '799.99'); await p.waitForTimeout(800);
  await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('__fakeDB')); d['liberaciones/pt2'].estado = 'EP'; d['liberaciones/pt2'].numero = 'SKT-TOP-02700'; localStorage.setItem('__fakeDB', JSON.stringify(d)); });
  await recargar(p); await p.waitForSelector('.dlg.on', { timeout: 6000 }).catch(() => {});
  const dl = await p.textContent('.dlg.on').catch(() => '');
  ok(/No se pudo recuperar la edición/.test(dl) && /En proceso/.test(dl) && /Cota:\s*799\.99/.test(dl), 'C4: si ya no se puede editar, se avisa por qué y qué se había cambiado: «' + dl.replace(/\s+/g, ' ').trim().slice(0, 160) + '»');
  await p.screenshot({ path: OUT + '/05-edicion-no-recuperable.png' });
  await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(400);
  await esperar(p, () => document.querySelectorAll('#fLib .arch').length === 1);
  ok(await titulo(p) !== 'Editar registro' && await p.inputValue('#iDesc') === 'Borrador de nueva' && (await nombresArch(p)).join() === 'nueva.png', 'C4: y queda «Nueva» con su borrador sin tocar');
  ok((await p.evaluate(() => window.__fakeStore()['liberaciones/pt2'].cota)) === '770.20' && await p.evaluate(() => localStorage.getItem('lib.edicion.operario@gmail.com')) === 'null', 'C4: el registro no se tocó y la edición vieja ya no se ofrece');

  // ===== C5: «Nueva» mientras se edita =====
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(400);
  await p.click('.item:has-text("Liberación observada")'); await p.waitForSelector('#sheet.on #fEditar'); await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])');
  await p.click('#nav [data-v="nueva"]'); await p.waitForTimeout(400);
  ok(!(await p.$('.dlg.on')) && await titulo(p) !== 'Editar registro', 'C5: sin cambios, «Nueva» abre uno nuevo directamente');
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(400);
  await p.click('.item:has-text("Liberación observada")'); await p.waitForSelector('#sheet.on #fEditar'); await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])');
  await p.fill('#iObs', 'Corregido en campo');
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('.dlg.on');
  const q = (await p.textContent('.dlg.on')).replace(/\s+/g, ' ');
  ok(/Estás editando el registro (de las \d\d:\d\d|del \d\d\/\d\d\/\d{4} \d\d:\d\d)\. ¿Seguir editando o descartar los cambios y abrir uno nuevo\?/.test(q), 'C5: pregunta: «' + q.trim().slice(0, 140) + '»');
  await p.screenshot({ path: OUT + '/06-nueva-editando.png' });
  await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(400);
  ok(await titulo(p) === 'Editar registro' && await p.inputValue('#iObs') === 'Corregido en campo', 'C5: «Seguir editando» deja todo como estaba');
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('.dlg.on'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok(await titulo(p) === 'Editar registro' && await p.inputValue('#iObs') === 'Corregido en campo', 'C5: Escape tampoco descarta');
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('.dlg.on [data-descartar]'); await p.click('.dlg.on [data-descartar]'); await p.waitForTimeout(500);
  ok(await titulo(p) !== 'Editar registro' && await p.inputValue('#iDesc') === 'Borrador de nueva', 'C5: «Descartar…» abre «Nueva» con su borrador: ' + await titulo(p));
  ok((await p.evaluate(() => window.__fakeStore()['liberaciones/ob1'].observaciones)) === '' && await p.evaluate(() => localStorage.getItem('lib.edicion.operario@gmail.com')) === 'null', 'C5: el observado no se tocó y no queda borrador de la edición');
  // Editar un observado sigue volviendo a pendiente y conserva la nota
  await p.click('#nav [data-v="mis"]'); await p.waitForTimeout(400);
  await p.click('.item:has-text("Liberación observada")'); await p.waitForSelector('#sheet.on #fEditar'); await p.click('#fEditar'); await p.waitForSelector('#fLib:not([hidden])');
  await p.fill('#iObs', 'Ya tiene foto'); await p.click('#bGuardar'); await p.waitForTimeout(1000);
  const ob1 = await p.evaluate(() => window.__fakeStore()['liberaciones/ob1']);
  ok(ob1.estado === 'PT' && ob1.notaObservacion === 'Falta foto' && ob1.observaciones === 'Ya tiene foto', 'editar un observado: vuelve a pendiente y conserva la nota');

  // ===== Salir de la sesión: los adjuntos del borrador no se quedan en el teléfono =====
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])'); await esperar(p, () => document.querySelectorAll('#fLib .arch').length === 1);
  ok((await idb(p, 'nueva|operario@gmail.com'))?.n === 1, 'antes de salir, la foto del borrador está en IndexedDB');
  await entrarComo(p, ADMIN);
  ok(await idb(p, 'nueva|operario@gmail.com') === null, 'al salir de la sesión se borran los adjuntos del borrador (celular compartido)');
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])'); await p.waitForTimeout(500);
  ok(!(await nombresArch(p)).length && await p.inputValue('#iDesc') !== 'Borrador de nueva', 'otra persona no ve el borrador ni las fotos del operario');

  // ===== A3: «Agregar por correo» no se borra =====
  const ajustes = async tab => { await p.click('#btnAjustes:not([hidden]), #nav [data-v="ajustes"]'); await p.waitForSelector('#ajBody'); await p.click(`.ajnav [data-tab="${tab}"]`); await p.waitForTimeout(300); };
  await ajustes('usuarios');
  await p.fill('#uMail', 'nuevo@gmail.com'); await p.selectOption('#uRol', 'gabinete'); await p.fill('#uNom', 'Nuevo Nombre');
  await p.evaluate(async FS => { const m = await import(FS); await m.setDoc(m.doc({}, 'solicitudes', 'sx1'), { email: 'pide@gmail.com', nombre: 'Pide Acceso' }); }, FS);
  await p.waitForTimeout(400);
  const vals = async () => [await p.inputValue('#uMail'), await p.inputValue('#uNom'), await p.inputValue('#uRol')].join(' | ');
  ok(await vals() === 'nuevo@gmail.com | Nuevo Nombre | gabinete', 'A3: llega una solicitud mientras se escribe: lo escrito sigue: ' + await vals());
  ok(await p.evaluate(() => document.activeElement?.id) === 'uNom', 'A3: y el cursor sigue en el campo');
  await p.click('#view .view-title'); await p.waitForTimeout(400);
  ok(/Pide Acceso/.test(await p.textContent('#sol')) && await vals() === 'nuevo@gmail.com | Nuevo Nombre | gabinete', 'A3: al salir del campo aparece la solicitud y lo escrito sigue');
  await p.evaluate(async FS => { const m = await import(FS); await m.setDoc(m.doc({}, 'usuarios', 'otro@gmail.com'), { nombre: 'Otro Usuario', rol: 'topografo', activo: true }); }, FS);
  await p.waitForTimeout(400);
  ok(/Otro Usuario/.test(await p.textContent('#usr')) && await vals() === 'nuevo@gmail.com | Nuevo Nombre | gabinete', 'A3: otro administrador cambia un usuario (sin foco en el campo): se repinta y lo escrito sigue');
  await p.click('#uAdd'); await p.waitForTimeout(600);
  const nu = await p.evaluate(() => window.__fakeStore()['usuarios/nuevo@gmail.com']);
  ok(nu && nu.rol === 'gabinete' && nu.nombre === 'Nuevo Nombre' && await vals() === ' |  | topografo', 'A3: «Agregar usuario» lo agrega como Gabinete y el recuadro queda vacío');

  // ===== A4: un guardado rechazado no queda a la vista =====
  await ajustes('topografos');
  await p.evaluate(() => { window.__fakeNegar = true; });
  await p.fill('#tpId', 'ZZ'); await p.fill('#tpNom', 'Rechazado Topo'); await p.click('#tpAdd'); await p.waitForTimeout(700);
  ok(/No se guardó/.test(await p.textContent('#toast')), 'A4 Topógrafos: sale «No se guardó…»');
  ok(!/Rechazado Topo/.test(await textoAj(p)), 'A4 Topógrafos: el topógrafo rechazado ya no está en la lista');
  await ajustes('lugares');
  await p.fill('#eNew', 'Estructura Rechazada'); await p.click('#eAdd'); await p.waitForTimeout(700);
  ok(!/Estructura Rechazada/.test(await textoAj(p)), 'A4 Lugares: la estructura rechazada no queda');
  await ajustes('capas');
  const nCap = await p.$$eval('#cCapas .ct-row:not(.head)', r => r.length);
  await p.fill('#cNom', 'Capa 977'); await p.click('#cAdd'); await p.waitForTimeout(700);
  ok(/No se guardó/.test(await p.textContent('#toast')) && !(await p.$$eval('#cCapas .ct-row:not(.head) [data-k="nom"]', i => i.map(x => x.value))).includes('Capa 977') && await p.$$eval('#cCapas .ct-row:not(.head)', r => r.length) === nCap, 'A4 Capas: la capa rechazada no queda');
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])');
  const opts = await p.$$eval('#iTopo option, #iEst option', o => o.map(x => x.textContent));
  ok(!opts.some(t => /Rechazado Topo|Estructura Rechazada/.test(t)), 'A4: tampoco aparecen como opción en «Nueva»');
  await p.evaluate(() => { window.__fakeNegar = false; });
  // Sin señal: queda por subir, como siempre (no se revierte)
  await ajustes('topografos');
  await ctx.setOffline(true); await p.evaluate(() => { window.__fakeOffline = true; });
  await p.fill('#tpId', 'YY'); await p.fill('#tpNom', 'Sin Senal Topo'); await p.click('#tpAdd'); await p.waitForTimeout(700);
  { const tt = await p.textContent('#toast'), vis = /Sin Senal Topo/.test(await textoAj(p)); ok(/se subirá cuando haya señal/.test(tt) && vis, 'A4: sin señal el cambio queda a la vista, «se subirá cuando haya señal»: «' + tt.trim() + '» · a la vista: ' + vis); }
  await ctx.setOffline(false); await p.evaluate(() => window.__fakeGoOnline()); await p.waitForTimeout(600);
  ok(/Sin Senal Topo/.test(await textoAj(p)) && (await p.evaluate(() => window.__fakeStore()['listas/topografos'].items.some(t => t.id === 'YY'))), 'A4: al volver la señal se sube y sigue');
  await p.screenshot({ path: OUT + '/07-ajustes.png' });

  // ===== De vuelta el operario: su borrador avisa qué fotos volver a adjuntar =====
  await entrarComo(p, OPER);
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fLib:not([hidden])'); await p.waitForSelector('#avAdj', { timeout: 5000 }).catch(() => {});
  ok(await p.inputValue('#iDesc') === 'Borrador de nueva' && /Tenías 1 archivo adjunto \(«nueva\.png»\)/.test(await p.textContent('#avAdj').catch(() => '')), 'al volver a entrar, el operario tiene su borrador y el aviso de la foto que había');

  await b.close();
  ok(errores.length === 0, 'sin errores en la consola' + (errores.length ? ': ' + errores.join(' | ') : ''));
})().catch(async e => { console.log('FALLA: la prueba se cortó:', e.message); process.exitCode = 1; try { await b.close(); } catch (_) {} });
