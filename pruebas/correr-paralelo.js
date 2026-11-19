// Corre las pruebas varias a la vez (cada una abre su propio navegador; el servidor solo sirve archivos).
// Uso, desde la raíz:  node pruebas/correr-paralelo.js            (todas, 5 a la vez)
//                      node pruebas/correr-paralelo.js 4 prueba5 prueba12   (4 a la vez, solo esas)
//                      PUERTO=8792 node pruebas/correr-paralelo.js 6        (sirve y prueba en otro puerto; por defecto 8765)
// La que falla se repite sola, sin compañía, para distinguir un fallo real de uno por carga de la máquina.
// Cada línea lleva lo que tardó la prueba, y al final salen las 8 más lentas.
const { spawn } = require('child_process'); const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2), N = /^\d+$/.test(args[0] || '') ? +args.shift() : 5;
const PUERTO = String(+process.env.PUERTO || 8765);
const todas = fs.readdirSync(__dirname).filter(f => /^prueba\d*\.js$/.test(f)).map(f => f.slice(0, -3)).sort((a, b) => (+a.slice(6) || 1) - (+b.slice(6) || 1));
const lista = args.length ? args : todas;
const vivo = () => new Promise(r => { const q = http.get('http://127.0.0.1:' + PUERTO + '/', x => { x.resume(); r(true); }); q.on('error', () => r(false)); q.setTimeout(1500, () => { q.destroy(); r(false); }); });
// Una prueba que todavía trae el puerto 8765 escrito a mano (si no lo lee de PUERTO) se corre en una copia temporal con el puerto cambiado.
const archivo = t => { const f = path.join(__dirname, t + '.js'); if (PUERTO === '8765') return { f }; const s = fs.readFileSync(f, 'utf8');
  if (!s.includes("'http://127.0.0.1:8765/'")) return { f }; const g = path.join(__dirname, `_tmp_${t}_${process.pid}.js`); fs.writeFileSync(g, s.split("'http://127.0.0.1:8765/'").join(`'http://127.0.0.1:${PUERTO}/'`)); return { f: g, tmp: g }; };
const correr = t => new Promise(r => { let s = ''; const t0 = Date.now(), a = archivo(t); const p = spawn(process.execPath, [a.f], { cwd: path.dirname(__dirname), env: { ...process.env, PUERTO } });
  p.stdout.on('data', d => s += d); p.stderr.on('data', d => s += d);
  p.on('close', code => { if (a.tmp) try { fs.unlinkSync(a.tmp); } catch (e) {} r({ t, code, seg: (Date.now() - t0) / 1000, ok: (s.match(/^ok/gm) || []).length + +((s.match(/^Comprobaciones: \d+ · bien (\d+)/m) || [])[1] || 0), /* la 52 solo imprime el total «Comprobaciones: N · bien X» */ malas: s.split(/\r?\n/).filter(l => /^FALLA|PAGEERROR|Error:/.test(l)) }); }); });
(async () => {
  let srv = null; if (!(await vivo())) { srv = spawn(process.execPath, [path.join(__dirname, 'servidor.js'), PUERTO], { cwd: path.dirname(__dirname), stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1000)); }
  const t0 = Date.now(), res = {}, cola = [...lista];
  await Promise.all(Array.from({ length: Math.min(N, cola.length) }, async () => { while (cola.length) { const t = cola.shift(); res[t] = await correr(t); } }));
  const dudosas = lista.filter(t => res[t].code !== 0);
  for (const t of dudosas) { const a = res[t]; res[t] = await correr(t); res[t].antes = a; }
  let total = 0, fallas = 0;
  for (const t of lista) { const x = res[t]; total += x.ok; if (x.code !== 0) fallas++;
    console.log(`${x.code === 0 ? 'ok   ' : 'FALLA'} ${t.padEnd(9)} ${String(x.ok).padStart(4)} revisiones ${(x.seg.toFixed(1) + ' s').padStart(8)}${x.antes ? (x.code === 0 ? `  (falló con las demás a la vez [${x.antes.seg.toFixed(1)} s] y pasó sola)` : '  (falló dos veces)') : ''}`);
    if (x.code !== 0) x.malas.forEach(l => console.log('      ' + l.trim())); }
  if (srv) srv.kill();
  console.log('\nLas más lentas: ' + [...lista].sort((a, b) => res[b].seg - res[a].seg).slice(0, 8).map(t => `${t} ${res[t].seg.toFixed(0)} s`).join(', '));
  console.log(`${lista.length} pruebas, ${total} revisiones, ${Math.round((Date.now() - t0) / 1000)} s, ${N} a la vez.`);
  console.log(fallas ? `${fallas} prueba(s) con fallas.` : 'Todas las pruebas pasaron.'); process.exit(fallas ? 1 : 0);
})();
