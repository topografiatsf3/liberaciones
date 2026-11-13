// Versión 32: mesa de trabajo del Modelo 2D en computadora. Rueda del ratón para acercar (planta real, desarrollada y sección)
// sin deformar, lectura de coordenadas, medir en la sección, mostrar/ocultar y renombrar superficies de diseño,
// pantalla completa con divisor y teclado.
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba38'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const D = f => path.join(__dirname, 'datos', f);
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
async function preparar(ctx) {
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
}
const store = p => p.evaluate(() => window.__fakeStore());
const escuchar = (p, n) => { p.on('pageerror', e => { errores.push(n + ': ' + e.message); console.log('PAGEERROR', n, e.message); }); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) { errores.push(n + ': ' + m.text()); console.log('CONSOLE', n, m.text()); } }); };
const aceptar = async p => { await p.waitForSelector('.dlg.on [type=submit]'); await p.waitForTimeout(250); await p.click('.dlg.on [type=submit]'); await p.waitForTimeout(400); };
const vbDe = p => p.$eval('#mReal', s => s.getAttribute('viewBox').split(' ').map(Number));
const rotulos = (p, sel) => p.$$eval(sel, x => x.map(t => t.textContent));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } }); await preparar(ctx);
  const p = await ctx.newPage(); escuchar(p, 'pc');
  await p.goto(URL);
  await p.evaluate(u => {
    localStorage.clear();
    const capas = { tipos: { filtro1: { capas: [{ nombre: 'Capa 11' }], noAplica: [] } } };
    localStorage.setItem('__fakeDB', JSON.stringify({ 'capas/pp-oeste': capas }));
    localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('modelo'));
  }, ADMIN);
  await p.reload(); await p.waitForSelector('#nav button'); await p.click('[data-v="panel"]'); await p.waitForSelector('#mBody');
  await p.setInputFiles('#mFile', D('eje-prueba.xml')); await aceptar(p);
  await p.waitForFunction(() => window.__fakeStore()['secciones/pp-oeste']);
  await p.selectOption('#mGrupo', 'filtro1|Capa 11'); await p.waitForSelector('[data-base]');
  await p.setInputFiles('#mBaseFile', D('base-capa-tin.xml')); await aceptar(p);
  await p.setInputFiles('#mFile', D('liberacion-prueba.xml')); await p.waitForSelector('.dlg.on .mprev-c'); await aceptar(p);
  await p.waitForSelector('#mReal .rlib'); await p.waitForTimeout(400);

  // --- Ancho completo y escala real
  const anchoMain = await p.$eval('.pmain', e => e.getBoundingClientRect().width);
  ok(anchoMain > 1000, `en computadora el modelo usa todo el ancho (${Math.round(anchoMain)} px de 1600)`);
  ok(!(await p.textContent('#mPlanBox')).includes('Ancho ×'), 'la planta real va a escala, sin estirar el ancho');

  // --- Planta real: rueda
  const sv = await (await p.$('#mReal')).boundingBox(), vb0 = await vbDe(p);
  const cx = Math.round(sv.x + sv.width * 0.7), cy = Math.round(sv.y + sv.height * 0.4);
  const mundo = async () => p.evaluate(([x, y]) => { const s = document.querySelector('#mReal'), r = s.getBoundingClientRect(), v = s.getAttribute('viewBox').split(' ').map(Number); return [v[0] + (x - r.left) / r.width * v[2], v[1] + (y - r.top) / r.height * v[3]]; }, [cx, cy]);
  await p.mouse.move(cx, cy); const antes = await mundo();
  const pk0 = (await rotulos(p, '#mReal .rlab.pk')).length;
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(40); }
  await p.waitForTimeout(150);
  const vb1 = await vbDe(p), despues = await mundo();
  ok(vb1[2] < vb0[2] / 5, `la rueda acerca la planta real (${(vb0[2] / vb1[2]).toFixed(1)}×)`);
  ok(Math.abs(vb1[2] / vb1[3] - vb0[2] / vb0[3]) < 0.01, 'sin deformar: el ancho y el alto se acercan igual');
  ok(Math.hypot(antes[0] - despues[0], antes[1] - despues[1]) < 0.5, 'el punto bajo el cursor se queda en su sitio');
  const tam = await p.$eval('#mReal .rlab', t => { const r = t.ownerSVGElement.getBoundingClientRect(), v = t.ownerSVGElement.getAttribute('viewBox').split(' ').map(Number); return parseFloat(getComputedStyle(t).fontSize) * r.width / v[2]; });
  ok(Math.abs(tam - 11) < 0.6, `los rótulos siguen de 11 px al acercar (${tam.toFixed(1)} px)`);
  ok((await rotulos(p, '#mReal .rlab.pk')).length > pk0, 'al acercar aparecen más progresivas sobre el eje');
  ok(/E \d+\.\d\d · N \d+\.\d\d · PK \d\+\d{3}/.test(await p.textContent('#mCoord')), 'lectura de Este, Norte, progresiva y desfase bajo el cursor: ' + await p.textContent('#mCoord'));
  await p.screenshot({ path: OUT + '/01-planta-acercada.png' });
  await p.click('[data-rz="0"]'); await p.mouse.move(sv.x + 12, sv.y + 12);
  for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(40); }
  ok((await vbDe(p))[2] < vb0[2] / 2, 'se acerca también en una esquina vacía');
  await p.mouse.dblclick(sv.x + 12, sv.y + 12); await p.waitForTimeout(200);
  ok((await vbDe(p))[2] === vb0[2], 'doble clic fuera de las liberaciones vuelve a ver todo');

  // --- Sección: rueda, arrastre y escala vertical
  await p.$eval('#mSec', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(150);
  const sb = await (await p.$('#sSvg')).boundingBox(), sx = sb.x + sb.width * 0.5, sy = sb.y + sb.height * 0.45;
  const cotas0 = await rotulos(p, '#sSvg text.mlab[text-anchor=end]');
  await p.mouse.move(sx, sy); await p.waitForTimeout(80);
  ok(/[ID] \d+\.\d\d · cota \d+\.\d\d/.test(await p.textContent('#sCoord')), 'sección: lectura de desfase y cota bajo el cursor: ' + (await p.textContent('#sCoord')).slice(0, 60));
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(40); }
  await p.waitForTimeout(200);
  const cotas1 = await rotulos(p, '#sSvg text.mlab[text-anchor=end]');
  const pasoDe = c => Math.abs(parseFloat(c[1]) - parseFloat(c[0]));
  ok(pasoDe(cotas1) < pasoDe(cotas0), `la rueda acerca la sección y la rejilla se afina (cada ${pasoDe(cotas0)} → cada ${pasoDe(cotas1)} m)`);
  ok(await p.$('#sClip') !== null && await p.$$eval('#sSvg g[clip-path] .dis', x => x.length) >= 1, 'las líneas no se salen del recuadro al acercar');
  const des0 = await rotulos(p, '#sSvg text.mlab[text-anchor=middle]');
  await p.mouse.move(sx, sy); await p.mouse.down(); await p.mouse.move(sx + 160, sy + 20, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(200);
  ok((await rotulos(p, '#sSvg text.mlab[text-anchor=middle]')).join() !== des0.join(), 'arrastrar mueve la sección');
  const tit0 = await p.textContent('#mSecT'); await p.click('[data-mst="+"]'); await p.waitForTimeout(150);
  ok(await p.textContent('#mSecT') !== tit0 && pasoDe(await rotulos(p, '#sSvg text.mlab[text-anchor=end]')) === pasoDe(cotas1), 'al pasar de sección se mantiene el acercamiento (mismo sitio)');
  await p.mouse.dblclick(sb.x + sb.width - 60, sb.y + 30); await p.waitForTimeout(200);
  ok(pasoDe(await rotulos(p, '#sSvg text.mlab[text-anchor=end]')) === pasoDe(cotas0), 'doble clic vuelve al encuadre completo de la sección');
  await p.click('#mSec [data-sz="+"]'); await p.waitForTimeout(150); await p.click('#mSec [data-sz="0"]'); await p.waitForTimeout(150);
  ok(pasoDe(await rotulos(p, '#sSvg text.mlab[text-anchor=end]')) === pasoDe(cotas0), 'botones + y «Todo» de la sección');
  await p.selectOption('#sEx', '1'); await p.waitForTimeout(150);
  ok((await p.textContent('#mSec .mex')).includes('Escala real 1:1'), 'escala real 1:1 en la sección (sin exagerar la vertical)');
  await p.selectOption('#sEx', '5'); await p.waitForTimeout(150);
  ok((await p.textContent('#mSec .mex')).includes('×5.0'), 'vertical ×5 a elección');
  await p.selectOption('#sEx', 'auto'); await p.waitForTimeout(150);

  // --- Medir
  await p.click('[data-medir]'); await p.waitForTimeout(100);
  ok(await p.$eval('[data-medir]', x => x.getAttribute('aria-pressed') === 'true') && (await p.textContent('#mMed')).includes('dos puntos'), '«Medir» se activa y explica qué hacer');
  const s2 = await (await p.$('#sSvg')).boundingBox();
  await p.mouse.click(s2.x + s2.width * 0.35, s2.y + s2.height * 0.5); await p.waitForTimeout(120);
  ok(await p.$('#sGoma') !== null && !(await p.$('.dlg.on')), 'primer punto puesto (y no abre la liberación de debajo)');
  await p.mouse.move(s2.x + s2.width * 0.6, s2.y + s2.height * 0.4); await p.mouse.click(s2.x + s2.width * 0.6, s2.y + s2.height * 0.4); await p.waitForTimeout(150);
  const med = await p.textContent('#mMed');
  ok(/Horizontal\s*[\d.]+ m/.test(med) && /Distancia\s*[\d.]+ m/.test(med) && /Pendiente/.test(med), 'medición con horizontal, vertical, distancia y pendiente: ' + med.replace(/\s+/g, ' ').slice(0, 150));
  await p.screenshot({ path: OUT + '/02-seccion-medir.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok(await p.$eval('[data-medir]', x => x.getAttribute('aria-pressed') === 'false') && (await p.textContent('#mMed')).trim() === '', 'Esc sale de «Medir» y borra la medición');

  // --- Superficies de diseño: ocultar, renombrar y color
  const nDis = await p.$$eval('#sSvg .dis', x => x.length), chips = await p.$$eval('#mLeg .lchip', x => x.length);
  ok(chips >= 1 && nDis >= chips, `la leyenda es una lista de botones (${chips} superficies de diseño)`);
  const nomSup = (await p.textContent('#mLeg .lchip >> nth=0')).trim();
  await p.click('#mLeg .lchip >> nth=0'); await p.waitForTimeout(900);
  ok(await p.$$eval('#sSvg .dis', x => x.length) < nDis && await p.$eval('#mLeg .lchip', c => c.classList.contains('off')), 'tocar una superficie en la leyenda la oculta');
  ok((await store(p))['secciones/pp-oeste'].cfg?.[nomSup]?.o === 1, 'y queda guardado en el modelo del frente');
  await p.click('[data-supcfg]'); await p.waitForSelector('.dlg.on .supf');
  ok(await p.$$eval('.dlg.on .supf', x => x.length) === (await store(p))['secciones/pp-oeste'].sups.length && await p.$eval('.dlg.on [name=v0]', x => !x.checked), '«Editar» lista todas las superficies de diseño, con la oculta sin marcar');
  await p.click('.dlg.on [data-todas="1"]'); await p.fill('.dlg.on [name=a0]', 'Diseño etapa 3'); await p.$eval('.dlg.on [name=c0]', x => { x.value = '#c0392b'; });
  await aceptar(p); await p.waitForTimeout(700);
  const cfg = (await store(p))['secciones/pp-oeste'].cfg[nomSup];
  ok(cfg.a === 'Diseño etapa 3' && cfg.c === '#c0392b' && !cfg.o, 'nombre a mostrar y color guardados; vuelve a verse');
  ok((await p.textContent('#mLeg .lchip >> nth=0')).trim() === 'Diseño etapa 3' && await p.$eval('#sSvg .dis[data-i="0"]', x => x.getAttribute('stroke')) === '#c0392b', 'la sección la dibuja con el nombre y el color nuevos');
  ok((await store(p))['secciones/pp-oeste'].sups[0] === nomSup, 'el nombre original del XML no cambia');
  await p.reload(); await p.waitForSelector('#mLeg .lchip', { timeout: 20000 });
  ok((await p.textContent('#mLeg .lchip >> nth=0')).trim() === 'Diseño etapa 3', 'tras recargar se conserva');

  // --- Pantalla completa, divisor y teclado
  await p.click('[data-full]'); await p.waitForTimeout(300);
  ok(await p.$eval('.nav', n => getComputedStyle(n).display === 'none') && (await p.textContent('[data-full]')).includes('Salir'), 'pantalla completa: se quita el menú lateral');
  ok(await p.$eval('.mgrid', g => getComputedStyle(g).display === 'grid') && await p.$eval('#mLeg', e => e.closest('.mlat') !== null), 'en pantalla completa la leyenda y la tabla van al costado de la sección');
  const caben = await p.evaluate(() => document.querySelector('#mSec').getBoundingClientRect().bottom <= innerHeight + 1 && document.querySelector('#mPlanBox').getBoundingClientRect().top >= 0);
  ok(caben, 'la planta y la sección caben juntas en la ventana, sin desplazarse');
  const hPl0 = await p.$eval('#mReal', s => s.getBoundingClientRect().height), dv = await (await p.$('#mDiv')).boundingBox();
  await p.mouse.move(dv.x + dv.width / 2, dv.y + dv.height / 2); await p.mouse.down(); await p.mouse.move(dv.x + dv.width / 2, dv.y + 90, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(250);
  const hPl1 = await p.$eval('#mReal', s => s.getBoundingClientRect().height);
  ok(hPl1 > hPl0 + 50, `el divisor reparte el alto entre planta y sección (${Math.round(hPl0)} → ${Math.round(hPl1)} px)`);
  await p.screenshot({ path: OUT + '/03-pantalla-completa.png' });
  const t1 = await p.textContent('#mSecT'); await p.mouse.move(400, 300); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(120);
  ok(await p.textContent('#mSecT') !== t1, 'flecha derecha pasa a la sección siguiente');
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120);
  ok(await p.textContent('#mSecT') === t1, 'flecha izquierda vuelve');
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  ok(await p.$eval('.nav', n => getComputedStyle(n).display !== 'none'), 'Esc sale de pantalla completa');
  await p.keyboard.press('f'); await p.waitForTimeout(250);
  ok(await p.$eval('body', x => x.classList.contains('m-full')), 'la tecla F la activa');
  await p.click('[data-vista="perfil"]'); await p.waitForTimeout(250);
  ok(await p.$eval('.nav', n => getComputedStyle(n).display !== 'none'), 'al salir del Modelo 2D el menú lateral vuelve');
  await p.click('[data-vista="modelo"]'); await p.waitForSelector('#mReal'); await p.keyboard.press('f'); await p.waitForTimeout(250);

  // --- Planta desarrollada: rueda y arrastre
  await p.click('[data-modo="des"]'); await p.waitForSelector('#mPlan svg .msup');
  const pb = await (await p.$('#mPlanBox')).boundingBox(), w0 = await p.$eval('#mPlan svg', s => +s.getAttribute('width'));
  await p.mouse.move(pb.x + pb.width * 0.8, pb.y + 100);
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -200); await p.waitForTimeout(40); }
  const w1 = await p.$eval('#mPlan svg', s => +s.getAttribute('width')), sl1 = await p.$eval('#mPlanBox', c => c.scrollLeft);
  ok(w1 > w0 * 3 && sl1 > 0, `desarrollada: la rueda acerca a lo largo del eje, hacia donde está el cursor (${(w1 / w0).toFixed(1)}×)`);
  await p.mouse.down(); await p.mouse.move(pb.x + pb.width * 0.8 - 200, pb.y + 100, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(100);
  ok(await p.$eval('#mPlanBox', c => c.scrollLeft) > sl1 + 150, 'y se arrastra con el ratón para moverse');
  await p.screenshot({ path: OUT + '/04-desarrollada.png' });

  // --- Celular: sigue igual, sin desbordes
  const cm = await b.newContext({ ...devices['Pixel 7'] }); await preparar(cm);
  const m = await cm.newPage(); escuchar(m, 'movil');
  await m.goto(URL); await m.evaluate(([u, db]) => { localStorage.clear(); localStorage.setItem('__fakeDB', db); localStorage.setItem('__fakeUser', JSON.stringify(u)); localStorage.setItem('lib.panelSub', JSON.stringify('pp-oeste')); localStorage.setItem('lib.panelVista', JSON.stringify('modelo')); }, [ADMIN, await p.evaluate(() => localStorage.getItem('__fakeDB'))]);
  await m.reload(); await m.waitForSelector('#nav button'); await m.click('[data-v="panel"]'); await m.waitForSelector('#sSvg', { timeout: 20000 }); await m.waitForTimeout(400);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'celular: sin desplazamiento horizontal');
  ok(await m.$('[data-full]') === null && await m.$eval('#mDiv', d => getComputedStyle(d).display === 'none'), 'celular: sin pantalla completa ni divisor');
  await m.screenshot({ path: OUT + '/05-movil.png', fullPage: true });
  console.log('Errores:', errores.length ? errores : 'ninguno');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
