// Lee las filas de la primera hoja de un .xlsx exportado por la app (zip sin comprimir): [[celda, …], …]
const fs = require('fs');
const des = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const col = l => [...l].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
module.exports = function filasXlsx(ruta, hoja = 1) {
  const txt = fs.readFileSync(ruta).toString('utf8');
  const ini = txt.indexOf(`xl/worksheets/sheet${hoja}.xml`), xml = txt.slice(txt.indexOf('<sheetData>', ini), txt.indexOf('</sheetData>', ini));
  const filas = [];
  for (const [, r, cuerpo] of xml.matchAll(/<row r="(\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const f = []; for (const [, l, c] of (cuerpo || '').matchAll(/<c r="([A-Z]+)\d+"[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)) { const m = (c || '').match(/<t[^>]*>([\s\S]*?)<\/t>|<v>([\s\S]*?)<\/v>/); f[col(l)] = m ? des(m[1] ?? m[2]) : ''; }
    filas[+r - 1] = f;
  }
  return filas;
};
