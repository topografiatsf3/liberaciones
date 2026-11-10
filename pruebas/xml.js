// XML de superficie (LandXML de Civil 3D) para las pruebas: la liberación de prueba con otro código en el nombre
const fs = require('fs'), path = require('path');
const base = fs.readFileSync(path.join(__dirname, 'datos', 'liberacion-prueba.xml'), 'utf8');
// codigo: «SKT-TOP-02690» (o null para una superficie sin código)
function supXml(codigo, archivo) {
  const nombre = codigo ? `2+220_2+260_STN F1_${codigo}` : '2+220_2+260_STN F1';
  const txt = base.replace(/2\+220_2\+260_STN F1_SKT-TOP-02686/g, nombre);
  return { name: archivo || (codigo || 'superficie') + '.xml', mimeType: 'application/xml', buffer: Buffer.from(txt) };
}
module.exports = { supXml };
