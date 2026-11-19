// Ayudantes comunes de las pruebas (las más lentas lo usan; las demás siguen con su propio código).
// Dirección de la app: PUERTO (por defecto 8765), un solo sitio.
const PUERTO = +process.env.PUERTO || 8765;
const URL = 'http://127.0.0.1:' + PUERTO + '/';

// «La página quedó quieta»: pasan `ms` milisegundos seguidos sin que cambie nada del documento (nodos, atributos, texto).
// Sustituye a un waitForTimeout fijo cuando solo se quiere esperar a que la pantalla termine de dibujarse:
// con la máquina cargada espera lo que haga falta (hasta `max`), con la máquina libre casi no espera.
const quieto = (p, ms = 120, max = 8000) => p.evaluate(([ms, max]) => new Promise(res => {
  const t0 = performance.now(); let t = 0;
  const fin = () => { mo.disconnect(); clearTimeout(t); res(); };
  const mo = new MutationObserver(() => { clearTimeout(t); t = performance.now() - t0 > max ? setTimeout(fin, 0) : setTimeout(fin, ms); });
  mo.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  t = setTimeout(fin, ms);
}), [ms, max]);

// Lo mismo, pero para esperar a que algo concreto ocurra y nada más
const hasta = (p, fn, arg, ms = 8000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);

module.exports = { PUERTO, URL, quieto, hasta };
