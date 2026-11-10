// Archivos que Android no deja leer («The requested file could not be read…», 10/11/2026, CSV de Alex en campo):
// la app copia el archivo al elegirlo (antes de vaciar el selector), reintenta y, si aun así falla, avisa en español
// con «Elegir de nuevo». Aquí se simula el teléfono: niega la lectura si el selector ya se vació, o falla unas veces, o siempre.
const { chromium, devices } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'capturas', 'prueba27'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/';
const ADMIN = { uid: 'a1', email: 'brandonkluivertvillegasfranco@gmail.com', displayName: 'Brandon Villegas' };
const errores = [];
const ok = (c, m) => { if (!c) { console.log('FALLA:', m); process.exitCode = 1; } else console.log('ok  -', m); };
const csv = n => ({ name: n, mimeType: 'text/csv', buffer: Buffer.from('P,N,E,Z\n1,8300000,450000,780\n2,8300050,450050,781\n') });
const filas = p => p.$$eval('.archs .arch', a => a.length);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 5'] });
  await ctx.route(/gstatic\.com\/firebasejs\/.*\/(firebase-[a-z]+\.js)/, r => { const f = r.request().url().match(/(firebase-[a-z]+\.js)/)[1]; r.fulfill({ path: path.join(__dirname, 'fake', f), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\./, r => r.abort());
  // Teléfono simulado: los archivos recién elegidos se marcan; su lectura falla según el modo
  await ctx.addInitScript(() => {
    const orig = Blob.prototype.arrayBuffer, origTxt = Blob.prototype.text;
    window.__lect = { modo: 'normal', fallas: 0, intentos: 0 };
    document.addEventListener('change', e => { for (const f of (e.target.files || [])) f.__elegido = true; }, true);
    const negar = f => {
      const L = window.__lect; if (!f.__elegido) return false;
      L.intentos++;
      if (L.modo === 'siempre') return true;
      if (L.modo === 'android' && [...document.querySelectorAll('input[type=file]')].every(i => i.value === '')) return true;
      if (L.fallas > 0) { L.fallas--; return true; }
      return false;
    };
    const err = () => Promise.reject(new DOMException('The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.', 'NotReadableError'));
    Blob.prototype.arrayBuffer = function () { return negar(this) ? err() : orig.call(this); };
    Blob.prototype.text = function () { return negar(this) ? err() : origTxt.call(this); };
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => { errores.push(e.message); console.log('PAGEERROR', e.message); });
  await p.goto(URL);
  await p.evaluate(A => { localStorage.clear(); localStorage.setItem('__fakeDB', '{}'); localStorage.setItem('__fakeUser', JSON.stringify(A)); }, ADMIN);
  await p.reload(); await p.waitForSelector('#nav button'); await p.waitForTimeout(800);
  await p.click('#nav [data-v="nueva"]'); await p.waitForSelector('#fCsv', { state: 'attached' });
  const modo = (m, fallas = 0) => p.evaluate(([m, f]) => { Object.assign(window.__lect, { modo: m, fallas: f, intentos: 0 }); }, [m, fallas]);

  // 1. Android niega leer el archivo si el selector ya se vació: ahora se lee antes de vaciarlo
  await modo('android');
  await p.setInputFiles('#fCsv', csv('lev-campo.csv')); await p.waitForTimeout(600);
  ok(await filas(p) === 1, 'el CSV se carga aunque el teléfono niegue leerlo después de vaciar el selector');
  ok(await p.$eval('#fCsv', i => i.value === ''), 'el selector igual queda vacío (se puede volver a elegir el mismo archivo)');

  // 2. Falla dos veces (Drive o WhatsApp con poca señal) y a la tercera se lee
  await modo('normal', 2);
  await p.setInputFiles('#fCsv', csv('lev-drive.csv')); await p.waitForTimeout(2600);
  const L = await p.evaluate(() => window.__lect);
  ok(await filas(p) === 2 && L.intentos >= 3, `se reintenta y el CSV se carga a la tercera (${L.intentos} intentos)`);
  ok(!(await p.$eval('#toast', t => t.classList.contains('on') && t.classList.contains('bad'))), 'si el reintento sale bien no aparece ningún aviso de error');

  // 3. Nunca se puede leer: aviso en español, sin el mensaje en inglés, con «Elegir de nuevo»
  await modo('siempre');
  await p.setInputFiles('#fCsv', csv('091126UBICAC-EST.CSV')); await p.waitForTimeout(2600);
  const t = await p.textContent('#toast');
  ok(/El teléfono no dejó leer «091126UBICAC-EST\.CSV»/.test(t) && /Descargas/.test(t), 'aviso en español con qué hacer: ' + t.slice(0, 90) + '…');
  ok(!/could not be read|permission/i.test(t), 'ya no sale el mensaje del teléfono en inglés');
  ok(await filas(p) === 2, 'el archivo que no se pudo leer no se agrega');
  await p.screenshot({ path: path.join(OUT, '1-aviso.png') });
  await modo('normal');
  ok(/Elegir de nuevo/.test(await p.textContent('#toast .toast-btn')), 'el aviso trae el botón «Elegir de nuevo»');
  const [elegir] = await Promise.all([p.waitForEvent('filechooser', { timeout: 3000 }), p.click('#toast .toast-btn')]);
  ok(!!elegir, '«Elegir de nuevo» abre el selector de archivos');
  await elegir.setFiles(csv('091126UBICAC-EST.CSV')); await p.waitForTimeout(600);
  ok(await filas(p) === 3, 'tras «Elegir de nuevo» el CSV se carga');

  // 4. Fotos: mismo cuidado
  await modo('android');
  await p.setInputFiles('#fFoto', path.join(__dirname, 'datos', 'foto-prueba.png')); await p.waitForTimeout(1500);
  ok(await p.$$eval('.archs .arch img', i => i.length) === 1, 'la foto también se carga aunque el teléfono niegue leerla después de vaciar el selector');
  await p.screenshot({ path: path.join(OUT, '2-cargados.png'), fullPage: true });

  ok(errores.length === 0, 'sin errores de la página: ' + errores.join(' | '));
  await b.close();
})();
