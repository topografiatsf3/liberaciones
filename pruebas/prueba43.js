// Versión 39: el buscador de Registros busca en todo el historial (no solo en los últimos 100) sin pedirlo.
// Con texto: «N coincidencias en todo el historial», foco y cursor intactos, sin «Nada coincide» mientras llega el resumen,
// aviso «con los filtros puestos» + «Buscar sin filtros», y un PK dentro de un tramo (Registros, Ctrl+K). «Mis registros» no cambia.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba43'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:' + (process.env.PUERTO || 8765) + '/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const OPER = { uid: 'o1', email: 'operario@gmail.com', displayName: 'Pedro Operario' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const ahora = Date.now(), hora = 36e5, N = 150;
const cod = i => 'SKT-TOP-' + String(10000 + i);
const DB = { 'usuarios/operario@gmail.com': { nombre: 'Pedro Operario', rol: 'operario', topografoId: 'GN', activo: true } };
for (let i = 0; i < N; i++) {
  const t = ahora - (i + 1) * hora, propio = [0, 1, 149].includes(i);
  DB['liberaciones/r' + String(i).padStart(3, '0')] = { actividad: 'LIB', creadoPor: propio ? 'operario@gmail.com' : 'otro@gmail.com', origen: 'app', estructuraId: 'pp', subestructuraId: 'pp-oeste', elementoId: 'mt', tipoId: 'filtro1', capa: 'Capa 11', topografoId: 'GN', estado: 'EP', numero: cod(i), descripcion: 'Registro ' + i, pkInicio: i * 100, pkFin: i * 100 + 40, fechaCampo: { __ts: t }, creadoEn: { __ts: t }, fechaLiberacion: { __ts: t }, archivos: [] };
}
const VIEJO = cod(149), NUEVO = cod(0), PK_DENTRO = '14+920', PK_FUERA = '14+941';
const lead = p => p.$eval('#view .lead', e => e.textContent.trim());
const texto = p => p.evaluate(() => document.querySelector('#lista')?.textContent || '');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto(URL);
  const preparar = async (u, extra) => { await p.evaluate(([d, u, extra]) => { localStorage.clear(); localStorage.setItem('__fakeDB', JSON.stringify(d)); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); if (extra) Object.entries(extra).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, [DB, u, extra]); await p.reload(); await p.waitForSelector('#nav button'); };
  await preparar(ADMIN);
  await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('resumen/')), null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  await p.click('#nav [data-v="todos"]'); await p.waitForSelector('#q'); await p.waitForTimeout(600);

  // Sin texto: solo los últimos 100
  ok(/últimos 100 registros/.test(await lead(p)), 'sin texto: «Los últimos 100 registros…»: ' + await lead(p));
  ok((await texto(p)).includes(NUEVO) && !(await texto(p)).includes(VIEJO), 'sin texto: sale el reciente y no el antiguo (fuera de los 100)');

  // Un código antiguo: aparece solo, con foco y texto intactos
  await p.click('#q'); await p.keyboard.type(VIEJO, { delay: 20 });
  await p.waitForFunction(c => document.querySelector('#lista')?.textContent.includes(c), VIEJO, { timeout: 15000 });
  await p.waitForTimeout(600);
  ok((await lead(p)).includes('en todo el historial'), 'con texto: el encabezado dice «en todo el historial»: ' + await lead(p));
  ok(/^1 coincidencia /.test(await lead(p)), 'una sola coincidencia para el código');
  ok(await p.evaluate(() => document.activeElement?.id === 'q'), 'el foco sigue en el buscador');
  ok(await p.$eval('#q', e => e.value) === VIEJO, 'el texto del buscador queda intacto');
  ok(await p.$eval('#q', e => e.selectionStart === e.value.length), 'el cursor sigue al final del texto');
  ok(!(await p.$('#rParcial')) && !!(await p.$('#rHistNota')), 'no sale «solo los últimos 100» (#rParcial) y sí la nota del historial');
  await p.screenshot({ path: OUT + '/01-codigo-antiguo.png' });

  // PK dentro de un tramo del registro antiguo
  const escribir = async t => { await p.fill('#q', ''); await p.waitForTimeout(300); await p.click('#q'); await p.keyboard.type(t, { delay: 20 }); await p.waitForTimeout(900); };
  await escribir(PK_DENTRO);
  ok((await texto(p)).includes(VIEJO) && /^1 coincidencia /.test(await lead(p)), `PK ${PK_DENTRO} (dentro de 14+900 a 14+940): encuentra el tramo que lo contiene: ` + await lead(p));
  await escribir(PK_FUERA);
  ok(!(await texto(p)).includes(VIEJO), `PK ${PK_FUERA} (justo fuera del tramo): no lo encuentra`);
  await escribir('14+940');
  ok((await texto(p)).includes(VIEJO), 'PK del borde final (14+940) sí entra (inclusive)');
  await escribir('14+900');
  ok((await texto(p)).includes(VIEJO), 'PK del borde inicial (14+900) sí entra (inclusive)');

  // Mientras llega el resumen no se dice «Nada coincide»
  await p.fill('#q', ''); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__vistos = []; new MutationObserver(() => { const t = document.querySelector('#view')?.textContent || ''; if (/Nada coincide con el filtro/.test(t)) window.__vistos.push(1); }).observe(document.body, { childList: true, subtree: true, characterData: true }); });
  await p.click('#q'); await p.keyboard.type(VIEJO, { delay: 20 }); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => window.__vistos.length) === 0, 'nunca sale «Nada coincide con el filtro» al escribir un código antiguo');

  // Borrar el texto vuelve a los últimos 100
  await p.fill('#q', ''); await p.waitForTimeout(700);
  ok(/últimos 100 registros/.test(await lead(p)) && !(await texto(p)).includes(VIEJO), 'borrar el texto vuelve a «los últimos 100» sin el antiguo');

  // Ctrl+K: PK dentro del tramo
  await p.click('body', { position: { x: 5, y: 5 } }); await p.keyboard.press('Control+k'); await p.waitForSelector('#cmdk input');
  await p.keyboard.type(PK_DENTRO, { delay: 20 });
  await p.waitForFunction(c => document.querySelector('#cmdk')?.textContent.includes(c), VIEJO, { timeout: 15000 });
  ok(true, `Ctrl+K encuentra por PK ${PK_DENTRO} dentro del tramo (${VIEJO})`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // Filtro recordado que no coincide
  await preparar(ADMIN, { ['lib.filtros.' + ADMIN.email]: { mis: {}, todos: { tipo: 'masivo' } } });
  await p.waitForFunction(() => Object.keys(window.__fakeStore()).some(k => k.startsWith('resumen/')), null, { timeout: 30000 });
  await p.click('#nav [data-v="todos"]'); await p.waitForSelector('#q'); await p.waitForTimeout(600);
  await p.click('#q'); await p.keyboard.type(VIEJO, { delay: 20 });
  await p.waitForSelector('#rSinFil', { timeout: 15000 });
  ok(/con los filtros puestos/.test(await p.$eval('#view', e => e.textContent)), 'con filtro que no coincide: «Nada coincide con «…» con los filtros puestos»');
  await p.screenshot({ path: OUT + '/02-con-filtros.png' });
  await p.click('#rSinFil'); await p.waitForTimeout(800);
  ok((await texto(p)).includes(VIEJO) && !(await p.$('#rSinFil')), '«Buscar sin filtros» encuentra el registro');
  ok(await p.$eval('#q', e => e.value) === VIEJO, 'y conserva el texto escrito');

  // Mis registros (operario): sigue como antes
  await preparar(OPER);
  await p.waitForTimeout(800);
  await p.click('#nav [data-v="mis"]'); await p.waitForSelector('#q'); await p.waitForTimeout(600);
  ok(!/todo el historial/.test(await lead(p)), '«Mis registros»: sin texto no habla de historial');
  await p.click('#q'); await p.keyboard.type(VIEJO, { delay: 20 }); await p.waitForTimeout(800);
  ok((await texto(p)).includes(VIEJO) && !(await texto(p)).includes(NUEVO) && !/todo el historial/.test(await lead(p)) && !(await p.$('#rHistNota')), '«Mis registros»: busca entre los suyos, sin «todo el historial»: ' + await lead(p));
  await p.fill('#q', ''); await p.waitForTimeout(500); await p.click('#q'); await p.keyboard.type(PK_DENTRO, { delay: 20 }); await p.waitForTimeout(800);
  ok((await texto(p)).includes(VIEJO), '«Mis registros»: el PK dentro del tramo también encuentra');

  ok(errores.length === 0, 'sin errores de página');
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
