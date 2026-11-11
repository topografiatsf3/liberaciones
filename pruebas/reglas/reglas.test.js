// Prueba de firestore.rules en el emulador de Firebase (no toca la base real).
// Uso, desde la raíz del repositorio (hace falta Java 21 y, una vez: npm i --no-save firebase-tools@14 @firebase/rules-unit-testing@4 firebase@11):
//   node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --only firestore --project demo-lib --config pruebas/reglas/firebase.json "node pruebas/reglas/reglas.test.js"
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction, deleteField, serverTimestamp, collection } = require('firebase/firestore');

let ok = 0, mal = 0;
async function caso(nombre, fn) { try { await fn(); ok++; console.log('OK   ', nombre); } catch (e) { mal++; console.log('FAIL ', nombre, '·', (e && e.message || e).toString().slice(0, 200)); } }

(async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-lib', firestore: { rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } });
  const U = { gab: 'gab@x.com', topo: 'topo@x.com', jefe: 'jefe@x.com', adm: 'adm@x.com' };
  await env.withSecurityRulesDisabled(async c => {
    const db = c.firestore();
    await setDoc(doc(db, 'usuarios', U.gab), { rol: 'gabinete', activo: true });
    await setDoc(doc(db, 'usuarios', U.topo), { rol: 'topografo', activo: true });
    await setDoc(doc(db, 'usuarios', U.jefe), { rol: 'jefe', activo: true });
    await setDoc(doc(db, 'usuarios', U.adm), { rol: 'admin', activo: true });
    await setDoc(doc(db, 'contadores', 'skt'), { ultimo: 2689 });
    const base = { actividad: 'LIB', creadoPor: U.topo, origen: 'app', descripcion: 'x', subestructuraId: 'f1', estructuraId: 'e1', capa: 'Capa 3', notaObservacion: '' };
    await setDoc(doc(db, 'liberaciones', 'L1'), { ...base, estado: 'PT', numero: '' });
    await setDoc(doc(db, 'liberaciones', 'L3'), { ...base, estado: 'PT', numero: '' });
    await setDoc(doc(db, 'liberaciones', 'L4'), { ...base, estado: 'PT', numero: '', actividad: 'DRN' });
    await setDoc(doc(db, 'liberaciones', 'L2'), { ...base, estado: 'OB', numero: 'SKT-TOP-02500', notaObservacion: 'corregir' });
    await setDoc(doc(db, 'liberaciones', 'T1'), { ...base, estado: 'PT', numero: '' });
    await setDoc(doc(db, 'liberaciones', 'E1'), { ...base, estado: 'EC', numero: 'SKT-TOP-02400', carpeta: 'OneDrive\\Cargo 1', xmlEntrega: [{ supId: 's1' }] });
    await setDoc(doc(db, 'liberaciones', 'X1'), { ...base, estado: 'EC', numero: 'SKT-TOP-00010', origen: 'excel' });
    await setDoc(doc(db, 'resumen', 'f1'), { r: { L1: ['a'], L2: ['b'], L3: ['c'] } });
    await setDoc(doc(db, 'resumen', 'f9~1'), { r: {} });
    await setDoc(doc(db, 'ejes', 'f9'), { puntos: [] });
    await setDoc(doc(db, 'capas', 'f9'), { tipos: {} });
    await setDoc(doc(db, 'secciones', 'f9'), { cs: [], partes: 1 });
    await setDoc(doc(db, 'superficiesRes', 'f9'), { r: {} });
    await setDoc(doc(db, 'superficies', 's1'), { subId: 'f1', tipoId: 't1', capa: 'Capa 3', grupo: 't1|Capa 3', v: 1 });
    await setDoc(doc(db, 'bases', 'b1'), { subId: 'f1', tipoId: 't1', capa: 'Capa 3', grupo: 't1|Capa 3' });
    await setDoc(doc(db, 'listas', 'tipos'), { items: [{ id: 't1', nombre: 'Relleno' }] });
    await setDoc(doc(db, 'listas', 'estructuras'), { items: [{ id: 'e1', nombre: 'Presa', subs: [{ id: 'f1', nombre: 'Frente 1' }] }] });
  });
  const ctx = k => env.authenticatedContext(k, { email: U[k], email_verified: true }).firestore();
  const gab = ctx('gab'), topo = ctx('topo'), jefe = ctx('jefe'), adm = ctx('adm');
  const generar = (db, id, n, ultimo, extra = {}) => runTransaction(db, async tx => {
    const c = doc(db, 'contadores', 'skt'); await tx.get(c); tx.set(c, { ultimo }, { merge: true });
    tx.update(doc(db, 'liberaciones', id), { numero: n, estado: 'EP', notaObservacion: '', ...extra });
  });

  console.log('— Código SKT-TOP');
  await caso('gabinete acepta: correlativo 2689→2690 y código SKT-TOP-02690', () => assertSucceeds(generar(gab, 'L1', 'SKT-TOP-02690', 2690)));
  await caso('gabinete NO puede cambiar un código ya puesto', () => assertFails(updateDoc(doc(gab, 'liberaciones', 'L1'), { numero: 'SKT-TOP-02000' })));
  await caso('gabinete NO puede borrar un código ya puesto', () => assertFails(updateDoc(doc(gab, 'liberaciones', 'L1'), { numero: '' })));
  await caso('gabinete NO puede poner a mano un código sin subir el correlativo', () => assertFails(updateDoc(doc(gab, 'liberaciones', 'L3'), { numero: 'SKT-TOP-02500', estado: 'EP' })));
  await caso('gabinete NO puede poner un código viejo aunque suba el correlativo', () => assertFails(generar(gab, 'L3', 'SKT-TOP-00005', 2691)));
  await caso('gabinete NO puede repetir el último código (2690)', () => assertFails(generar(gab, 'L3', 'SKT-TOP-02690', 2691)));
  await caso('gabinete re-acepta un observado con su mismo código', () => assertSucceeds(updateDoc(doc(gab, 'liberaciones', 'L2'), { estado: 'EP', notaObservacion: '' })));
  await caso('gabinete acepta dron con 3 protocolos (2690→2693)', () => assertSucceeds(generar(gab, 'L4', 'SKT-TOP-02691', 2693, { protocolos: [{ id: 'p1', numero: 'SKT-TOP-02691' }, { id: 'p2', numero: 'SKT-TOP-02692' }, { id: 'p3', numero: 'SKT-TOP-02693' }] })));
  await caso('gabinete NO puede cambiar los protocolos ya numerados', () => assertFails(updateDoc(doc(gab, 'liberaciones', 'L4'), { protocolos: [{ id: 'p1', numero: 'SKT-TOP-00001' }] })));
  await caso('gabinete pone la capa (sin tocar el código)', () => assertSucceeds(updateDoc(doc(gab, 'liberaciones', 'L4'), { capa: 'Capa 3' })));
  await caso('administrador sí puede corregir un código', () => assertSucceeds(updateDoc(doc(adm, 'liberaciones', 'L1'), { numero: 'SKT-TOP-02695' })));

  console.log('— Entregar a Calidad: XML obligatorio, carpeta opcional (versión 26)');
  await caso('gabinete NO entrega sin el XML de la superficie', () => assertFails(updateDoc(doc(gab, 'liberaciones', 'L2'), { estado: 'EC' })));
  await caso('gabinete entrega con XML y SIN carpeta', () => assertSucceeds(updateDoc(doc(gab, 'liberaciones', 'L2'), { estado: 'EC', numeroCargo: 'C-1', xmlEntrega: [{ supId: 's2' }] })));
  await caso('gabinete pone una carpeta de texto libre', () => assertSucceeds(updateDoc(doc(gab, 'liberaciones', 'L2'), { carpeta: 'Pendiente: la sube Juan' })));
  await caso('gabinete quita la carpeta (campo vacío)', () => assertSucceeds(updateDoc(doc(gab, 'liberaciones', 'E1'), { carpeta: deleteField() })));
  await caso('topógrafo NO puede poner la carpeta', () => assertFails(updateDoc(doc(topo, 'liberaciones', 'T1'), { carpeta: 'C:/x' })));

  console.log('— Jefe: renombrar capa y mover frente (versión 26)');
  await caso('jefe renombra la capa de un registro (soloCapa)', () => assertSucceeds(updateDoc(doc(jefe, 'liberaciones', 'E1'), { capa: 'Capa 3A', editadoEn: serverTimestamp(), editadoPor: U.jefe })));
  await caso('jefe NO puede poner una capa que no es texto', () => assertFails(updateDoc(doc(jefe, 'liberaciones', 'E1'), { capa: 33 })));
  await caso('jefe NO puede poner una capa enorme', () => assertFails(updateDoc(doc(jefe, 'liberaciones', 'E1'), { capa: 'x'.repeat(200) })));
  await caso('jefe NO puede cambiar capa y estado a la vez', () => assertFails(updateDoc(doc(jefe, 'liberaciones', 'E1'), { capa: 'Capa 4', estado: 'PT' })));
  await caso('jefe cambia la estructura de un registro (soloEstructura)', () => assertSucceeds(updateDoc(doc(jefe, 'liberaciones', 'E1'), { estructuraId: 'e2', editadoEn: serverTimestamp(), editadoPor: U.jefe })));
  await caso('jefe NO puede cambiar estructura y número a la vez', () => assertFails(updateDoc(doc(jefe, 'liberaciones', 'E1'), { estructuraId: 'e3', numero: 'SKT-TOP-09999' })));
  await caso('jefe separa el detalle del tipo (soloTipo con detalle)', () => assertSucceeds(updateDoc(doc(jefe, 'liberaciones', 'E1'), { detalle: 'PZ3-7', editadoEn: serverTimestamp(), editadoPor: U.jefe })));
  await caso('jefe une tipo y pone detalle a la vez', () => assertSucceeds(updateDoc(doc(jefe, 'liberaciones', 'E1'), { tipoId: 't2', elementoId: 'e9', detalle: 'BH-1', editadoEn: serverTimestamp(), editadoPor: U.jefe })));
  await caso('jefe NO puede poner un detalle enorme', () => assertFails(updateDoc(doc(jefe, 'liberaciones', 'E1'), { detalle: 'x'.repeat(60) })));
  await caso('jefe NO puede cambiar detalle y estado a la vez', () => assertFails(updateDoc(doc(jefe, 'liberaciones', 'E1'), { detalle: 'P-1', estado: 'PT' })));
  await caso('gabinete NO puede cambiar el detalle de campo', () => assertFails(updateDoc(doc(gab, 'liberaciones', 'L4'), { detalle: 'X-1' })));
  await caso('topógrafo pone detalle en su pendiente', () => assertSucceeds(updateDoc(doc(topo, 'liberaciones', 'T1'), { detalle: 'PZ3-8', estado: 'PT' })));
  await caso('topógrafo NO puede cambiar la estructura de un entregado',() => assertFails(updateDoc(doc(topo, 'liberaciones', 'E1'), { estructuraId: 'e3' })));

  console.log('— Jefe: el atajo «excel» ya no abre todo');
  await caso('jefe NO puede editar un registro de la app marcándolo como excel', () => assertFails(updateDoc(doc(jefe, 'liberaciones', 'T1'), { origen: 'excel', estado: 'EC', numero: 'SKT-TOP-09998' })));
  await caso('jefe sí reimporta un registro que ya venía del Excel', () => assertSucceeds(setDoc(doc(jefe, 'liberaciones', 'X1'), { actividad: 'LIB', estado: 'EC', numero: 'SKT-TOP-00010', origen: 'excel', descripcion: 'reimportado', subestructuraId: 'f1' })));
  await caso('jefe crea un registro del histórico', () => assertSucceeds(setDoc(doc(jefe, 'liberaciones', 'X2'), { actividad: 'LIB', estado: 'EC', numero: 'SKT-TOP-00011', origen: 'excel', subestructuraId: 'f1' })));

  console.log('— Modelo 2D: superficies y bases al renombrar o unir (versión 26)');
  await caso('gabinete cambia la capa de una superficie y su resumen', async () => { const b = writeBatch(gab); b.update(doc(gab, 'superficies', 's1'), { capa: 'Capa 3A', grupo: 't1|Capa 3A', v: 2 }); b.set(doc(gab, 'superficiesRes', 'f1'), { r: { s1: ['n', '', 't1', 'Capa 3A'] } }, { merge: true }); await assertSucceeds(b.commit()); });
  await caso('jefe mueve una base a la capa nueva (crea y borra)', async () => { const b = writeBatch(jefe); b.set(doc(jefe, 'bases', 'b2'), { subId: 'f1', tipoId: 't1', capa: 'Capa 3A', grupo: 't1|Capa 3A' }); b.delete(doc(jefe, 'bases', 'b1')); await assertSucceeds(b.commit()); });
  await caso('topógrafo NO toca superficies', () => assertFails(updateDoc(doc(topo, 'superficies', 's1'), { capa: 'x' })));
  await caso('topógrafo NO toca bases', () => assertFails(deleteDoc(doc(topo, 'bases', 'b2'))));

  console.log('— Quitar un frente: se borra lo que cuelga de él (versión 26)');
  for (const [col, id] of [['ejes', 'f9'], ['capas', 'f9'], ['secciones', 'f9'], ['superficiesRes', 'f9'], ['resumen', 'f9~1']])
    await caso(`jefe borra ${col}/${id}`, () => assertSucceeds(deleteDoc(doc(jefe, col, id))));
  await caso('topógrafo NO borra el eje de un frente', () => assertFails(deleteDoc(doc(topo, 'ejes', 'f1'))));
  await caso('gabinete NO borra la configuración de capas', () => assertFails(deleteDoc(doc(gab, 'capas', 'f1'))));

  console.log('— Listas: quitar y reordenar en Ajustes');
  await caso('jefe guarda la lista de estructuras (quitar o mover un frente)', () => assertSucceeds(setDoc(doc(jefe, 'listas', 'estructuras'), { items: [{ id: 'e1', nombre: 'Presa', subs: [] }], editadoEn: serverTimestamp(), editadoPor: U.jefe })));
  await caso('jefe quita un tipo de la lista', () => assertSucceeds(setDoc(doc(jefe, 'listas', 'tipos'), { items: [], editadoEn: serverTimestamp(), editadoPor: U.jefe })));
  await caso('topógrafo agrega un tipo al final', () => assertSucceeds(setDoc(doc(topo, 'listas', 'tipos'), { items: [{ id: 't9', nombre: 'Nuevo', creadoPor: U.topo }], editadoEn: serverTimestamp(), editadoPor: U.topo })));
  await caso('topógrafo NO puede quitar tipos', () => assertFails(setDoc(doc(topo, 'listas', 'tipos'), { items: [], editadoEn: serverTimestamp(), editadoPor: U.topo })));
  await caso('topógrafo NO puede tocar estructuras', () => assertFails(setDoc(doc(topo, 'listas', 'estructuras'), { items: [] })));

  console.log('— Correlativo, resumen, archivos y usuarios');
  await caso('gabinete NO puede bajar el correlativo', () => assertFails(setDoc(doc(gab, 'contadores', 'skt'), { ultimo: 100 }, { merge: true })));
  await caso('jefe NO puede bajar el correlativo', () => assertFails(setDoc(doc(jefe, 'contadores', 'skt'), { ultimo: 100 })));
  await caso('topógrafo NO toca el correlativo', () => assertFails(setDoc(doc(topo, 'contadores', 'skt'), { ultimo: 9999 }, { merge: true })));
  await caso('topógrafo edita su pendiente y el resumen de su frente', async () => { const b = writeBatch(topo); b.update(doc(topo, 'liberaciones', 'T1'), { descripcion: 'nueva', estado: 'PT' }); b.set(doc(topo, 'resumen', 'f1'), { r: { T1: ['t'] } }, { merge: true }); await assertSucceeds(b.commit()); });
  await caso('topógrafo crea un registro con su resumen e historial', async () => { const b = writeBatch(topo); const r = doc(collection(topo, 'liberaciones')); b.set(r, { actividad: 'LIB', creadoPor: U.topo, origen: 'app', estado: 'PT', numero: '', subestructuraId: 'f2' }); b.set(doc(topo, 'resumen', 'f2'), { r: { [r.id]: ['n'] } }, { merge: true }); b.set(doc(collection(topo, 'historial')), { liberacionId: r.id, usuario: U.topo, accion: 'creado' }); await assertSucceeds(b.commit()); });
  await caso('topógrafo NO puede vaciar el resumen de un frente', () => assertFails(setDoc(doc(topo, 'resumen', 'f1'), { r: {} })));
  await caso('topógrafo NO puede borrar el resumen', () => assertFails(deleteDoc(doc(topo, 'resumen', 'f1'))));
  await caso('topógrafo sube una foto', () => assertSucceeds(setDoc(doc(topo, 'archivos', 'a1'), { tipo: 'foto', datos: 'data:image/jpeg;base64,AAAA', creadoPor: U.topo, liberacionId: 'T1' })));
  await caso('topógrafo NO puede subir un archivo de otro tipo', () => assertFails(setDoc(doc(topo, 'archivos', 'a3'), { tipo: 'html', datos: '<script>', creadoPor: U.topo, liberacionId: 'T1' })));
  await caso('jefe NO puede subirse a administrador', () => assertFails(updateDoc(doc(jefe, 'usuarios', U.jefe), { rol: 'admin' })));
  await caso('jefe NO puede crear un administrador', () => assertFails(setDoc(doc(jefe, 'usuarios', 'nuevo@x.com'), { rol: 'admin', activo: true })));
  await caso('jefe agrega un topógrafo', () => assertSucceeds(setDoc(doc(jefe, 'usuarios', 'nuevo@x.com'), { rol: 'topografo', activo: true })));
  await caso('gabinete NO toca usuarios', () => assertFails(setDoc(doc(gab, 'usuarios', 'otro2@x.com'), { rol: 'topografo', activo: true })));

  await env.cleanup();
  console.log(`\n${ok} OK · ${mal} FAIL`); process.exit(mal ? 1 : 0);
})().catch(e => { console.log('FAIL  excepción', e); process.exit(1); });
