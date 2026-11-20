// Prueba de firestore.rules en el emulador de Firebase (no toca la base real).
// Uso, desde la raíz del repositorio (hace falta Java 21 y, una vez: npm i --no-save firebase-tools@14 @firebase/rules-unit-testing@4 firebase@11):
//   node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --only firestore --project demo-lib --config pruebas/reglas/firebase.json "node pruebas/reglas/reglas.test.js"
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
//   Otro puerto o las reglas de otra versión (para ver qué pasaba antes):
//   REGLAS=ruta/a/otras.rules (por defecto firestore.rules) · el puerto lo toma de FIRESTORE_EMULATOR_HOST (lo pone emulators:exec)
const { doc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction, deleteField, serverTimestamp, collection, getDoc, getDocs, query, where, Timestamp } = require('firebase/firestore');

let ok = 0, mal = 0;
async function caso(nombre, fn) { try { await fn(); ok++; console.log('OK   ', nombre); } catch (e) { mal++; console.log('FAIL ', nombre, '·', (e && e.message || e).toString().slice(0, 200)); } }

(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
  const env = await initializeTestEnvironment({ projectId: 'demo-lib', firestore: { rules: fs.readFileSync(process.env.REGLAS || path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8'), host, port: +port } });
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
  await caso('gabinete entrega con XML y SIN carpeta', () => assertSucceeds(updateDoc(doc(gab, 'liberaciones', 'L2'), { estado: 'EC', numeroCargo: 'C-1', xmlEntrega: [{ archivo: 'SKT-TOP-02500.xml', superficie: 'SKT-TOP-02500', codigo: 'SKT-TOP-02500', supId: 's2', subId: 'f1', grupo: 't1|Capa 3' }] })));
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
  // D1 paso 1 (lote H): la app de campo manda también «u» (id del registro cuya fila toca). Se admite, sin exigirla todavía
  await env.withSecurityRulesDisabled(async c => { const d = c.firestore(), base = { actividad: 'LIB', creadoPor: U.topo, origen: 'app', descripcion: 'x', subestructuraId: 'f1', estructuraId: 'e1', capa: 'Capa 3', notaObservacion: '' }; await setDoc(doc(d, 'liberaciones', 'U1'), { ...base, estado: 'PT', numero: '' }); await setDoc(doc(d, 'liberaciones', 'U2'), { ...base, estado: 'OB', numero: '' }); await setDoc(doc(d, 'resumen', 'f1~2'), { r: { U1: ['t'], U2: ['t'] } }); });
  await caso('(u) topógrafo edita su pendiente y su fila con «u»', async () => { const b = writeBatch(topo); b.update(doc(topo, 'liberaciones', 'U1'), { descripcion: 'con u', estado: 'PT' }); b.set(doc(topo, 'resumen', 'f1~2'), { r: { U1: ['t', '', 0, 1, 'PT'] }, u: 'U1' }, { merge: true }); await assertSucceeds(b.commit()); });
  await caso('(u) topógrafo crea un registro y el resumen de un frente nuevo con «u»', async () => { const b = writeBatch(topo); const r = doc(collection(topo, 'liberaciones')); b.set(r, { actividad: 'LIB', creadoPor: U.topo, origen: 'app', estado: 'PT', numero: '', subestructuraId: 'f3' }); b.set(doc(topo, 'resumen', 'f3~1'), { r: { [r.id]: ['n'] }, u: r.id }, { merge: true }); b.set(doc(collection(topo, 'historial')), { liberacionId: r.id, usuario: U.topo, accion: 'creado' }); await assertSucceeds(b.commit()); });
  await caso('(u) topógrafo corrige su observado (OB→PT) con «u»', async () => { const b = writeBatch(topo); b.update(doc(topo, 'liberaciones', 'U2'), { descripcion: 'corregido', estado: 'PT' }); b.set(doc(topo, 'resumen', 'f1~2'), { r: { U2: ['t', '', 0, 1, 'PT'] }, u: 'U2' }, { merge: true }); await assertSucceeds(b.commit()); });
  await caso('(u) topógrafo manda 1 suyo a la papelera y quita su fila con «u»', async () => { const b = writeBatch(topo); b.update(doc(topo, 'liberaciones', 'U1'), { borrado: true, borradoPor: U.topo, borradoNombre: '', borradoEn: serverTimestamp() }); b.set(doc(topo, 'resumen', 'f1~2'), { r: { U1: deleteField() }, u: 'U1' }, { merge: true }); await assertSucceeds(b.commit()); });
  await caso('(u) topógrafo mueve su registro de frente con «u» en los dos resúmenes', async () => { const b = writeBatch(topo); b.update(doc(topo, 'liberaciones', 'U2'), { subestructuraId: 'f2', estado: 'PT' }); b.set(doc(topo, 'resumen', 'f1~2'), { r: { U2: deleteField() }, u: 'U2' }, { merge: true }); b.set(doc(topo, 'resumen', 'f2'), { r: { U2: ['t', '', 0, 1, 'PT'] }, u: 'U2' }, { merge: true }); await assertSucceeds(b.commit()); });
  await caso('(u) topógrafo sigue sin poder vaciar el resumen (aunque mande «u»)', () => assertFails(setDoc(doc(topo, 'resumen', 'f1'), { r: {}, u: 'L1' })));
  await caso('(u) topógrafo sigue sin poder quitar 2 filas de una vez (aunque mande «u»)', () => assertFails(setDoc(doc(topo, 'resumen', 'f1'), { r: { L1: deleteField(), L3: deleteField() }, u: 'L1' }, { merge: true })));
  await caso('(u) topógrafo NO puede mandar otra clave que no sea «r» ni «u»', () => assertFails(setDoc(doc(topo, 'resumen', 'f1'), { r: { T1: ['t'] }, v: 1 }, { merge: true })));
  await caso('(u) topógrafo NO puede crear un resumen con otra clave', () => assertFails(setDoc(doc(topo, 'resumen', 'f8'), { r: { T1: ['t'] }, x: 1 })));
  await caso('(u) gabinete escribe el resumen sin «u», como siempre', () => assertSucceeds(setDoc(doc(gab, 'resumen', 'f1~2'), { r: { G9: ['t'] } }, { merge: true })));
  await caso('topógrafo sube una foto', () => assertSucceeds(setDoc(doc(topo, 'archivos', 'a1'), { tipo: 'foto', datos: 'data:image/jpeg;base64,AAAA', creadoPor: U.topo, liberacionId: 'T1' })));
  await caso('topógrafo NO puede subir un archivo de otro tipo', () => assertFails(setDoc(doc(topo, 'archivos', 'a3'), { tipo: 'html', datos: '<script>', creadoPor: U.topo, liberacionId: 'T1' })));
  await caso('jefe NO puede subirse a administrador', () => assertFails(updateDoc(doc(jefe, 'usuarios', U.jefe), { rol: 'admin' })));
  await caso('jefe NO puede crear un administrador', () => assertFails(setDoc(doc(jefe, 'usuarios', 'nuevo@x.com'), { rol: 'admin', activo: true })));
  await caso('jefe agrega un topógrafo', () => assertSucceeds(setDoc(doc(jefe, 'usuarios', 'nuevo@x.com'), { rol: 'topografo', activo: true })));
  await caso('gabinete NO toca usuarios', () => assertFails(setDoc(doc(gab, 'usuarios', 'otro2@x.com'), { rol: 'topografo', activo: true })));

  /* ===================== Fase 1 de la auditoría (D5, D6, D20, D21 solicitudes, D22) =====================
     Los casos «(hueco Dn)» pasaban con las reglas de antes y ahora se rechazan; el resto son flujos reales
     de la app (escritos como los hace index.html 1.44.0, igual que la 43) que deben seguir pasando. */
  const sinReglas = (col, id, data) => env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), col, id), data); });
  U.gab2 = 'gab2@x.com'; U.inac = 'inac@x.com'; U.nuevo = 'sinperfil@x.com';
  await sinReglas('usuarios', U.gab2, { rol: 'gabinete', activo: true, nombre: 'Gabinete 2' });
  await sinReglas('usuarios', U.inac, { rol: 'topografo', activo: false, nombre: 'Inactivo' });
  const gab2 = ctx('gab2'), inac = ctx('inac');
  const bF = { actividad: 'LIB', creadoPor: U.topo, origen: 'app', descripcion: 'x', subestructuraId: 'f1', estructuraId: 'e1', capa: 'Capa 3', notaObservacion: '', tipoId: 't1', creadoNombre: 'Topo', fechaCampo: Timestamp.now() };
  const X = n => ({ archivo: n + '.xml', superficie: n, codigo: n, supId: 'f1~' + n, subId: 'f1', grupo: 't1|Capa 3' });
  const lib = id => doc(gab, 'liberaciones', id);
  // Como cambiarEstado: registro + su fila del resumen + historial, en un lote (también sirve para varios a la vez)
  const paso = (db, quien, ids, datos, a, de) => { const b = writeBatch(db);
    for (const id of [].concat(ids)) {
      const dat = typeof datos === 'function' ? datos(id) : datos;
      b.update(doc(db, 'liberaciones', id), { ...dat, estado: a, editadoEn: serverTimestamp(), editadoPor: U[quien] });
      b.set(doc(db, 'resumen', 'f1'), { r: { [id]: ['t1', 'Capa 3', 0, 10, a] } }, { merge: true });
      b.set(doc(collection(db, 'historial')), { liberacionId: id, accion: 'estado', de, a, usuario: U[quien], nombre: '', fecha: serverTimestamp(), nota: '' });
    }
    return b.commit(); };
  // Como generarCodigo: lee el correlativo y el registro; si ya tiene código lo re-acepta con el mismo
  const aceptarApp = (db, quien, id, extra = {}) => runTransaction(db, async tx => {
    const cRef = doc(db, 'contadores', 'skt'), lRef = doc(db, 'liberaciones', id);
    const c = await tx.get(cRef), l = await tx.get(lRef), d = l.data();
    if (d.numero) { tx.update(lRef, { estado: 'EP', nombreLiberacion: d.nombreLiberacion || 'x', notaObservacion: '', editadoEn: serverTimestamp(), editadoPor: U[quien] }); return d.numero; }
    const n = c.data().ultimo + 1, numero = 'SKT-TOP-' + String(n).padStart(5, '0');
    tx.set(cRef, { ultimo: n }, { merge: true });
    tx.update(lRef, { numero, estado: 'EP', nombreLiberacion: 'x', generadoPor: 'Gab', fechaLiberacion: serverTimestamp(), notaObservacion: '', editadoEn: serverTimestamp(), editadoPor: U[quien], ...extra });
    tx.set(doc(db, 'resumen', 'f1'), { r: { [id]: ['t1', 'Capa 3', 0, 10, 'EP', 0, numero] } }, { merge: true });
    tx.set(doc(collection(db, 'historial')), { liberacionId: id, accion: 'estado', de: d.estado, a: 'EP', usuario: U[quien], nombre: '', fecha: serverTimestamp(), nota: 'Código ' + numero });
    return numero; });
  const entrega = (ids, xml) => paso(gab, 'gab', ids, id => ({ fechaEntrega: Timestamp.now(), numeroCargo: '', xmlEntrega: typeof xml === 'function' ? xml(id) : xml }), 'EC', 'EP');
  for (const id of ['D5a', 'D5b', 'D5c', 'D5d', 'D5e', 'G1', 'G2', 'G3', 'G4']) await sinReglas('liberaciones', id, { ...bF, estado: 'EP', numero: 'SKT-TOP-0' + (1000 + ['D5a', 'D5b', 'D5c', 'D5d', 'D5e', 'G1', 'G2', 'G3', 'G4'].indexOf(id)) });
  await sinReglas('liberaciones', 'SF', { ...bF, subestructuraId: '', estado: 'EP', numero: 'SKT-TOP-01100' });
  await sinReglas('liberaciones', 'DR', { ...bF, actividad: 'DRN', estado: 'EP', numero: 'SKT-TOP-01101', protocolos: [{ id: 'p1', numero: 'SKT-TOP-01101' }, { id: 'p2', numero: 'SKT-TOP-01102' }] });
  await sinReglas('liberaciones', 'RE1', { ...bF, estado: 'PT', numero: '' });
  await sinReglas('liberaciones', 'FR', { ...bF, estado: 'EP', numero: 'SKT-TOP-01103' });

  console.log('— D5 · Entregar a Calidad con un XML de verdad');
  await caso('(hueco D5) gabinete NO entrega con xmlEntrega inventado [{}]', () => assertFails(updateDoc(lib('D5a'), { estado: 'EC', xmlEntrega: [{}] })));
  await caso('(hueco D5) gabinete NO entrega con xmlEntrega ["x"]', () => assertFails(updateDoc(lib('D5b'), { estado: 'EC', xmlEntrega: ['x'] })));
  await caso('(hueco D5) gabinete NO entrega con un XML sin código', () => assertFails(updateDoc(lib('D5c'), { estado: 'EC', xmlEntrega: [{ archivo: 'a.xml', codigo: '' , supId: 's' }] })));
  await caso('(hueco D5) gabinete NO entrega con un XML sin nombre de archivo', () => assertFails(updateDoc(lib('D5d'), { estado: 'EC', xmlEntrega: [{ codigo: 'SKT-TOP-01003', supId: 's' }] })));
  await caso('(hueco D5) gabinete NO entrega un registro con frente sin la superficie (supId vacío)', () => assertFails(updateDoc(lib('D5e'), { estado: 'EC', xmlEntrega: [{ ...X('SKT-TOP-01004'), supId: '' }] })));
  await caso('flujo: gabinete entrega UNA como la app (registro + resumen + historial)', () => assertSucceeds(entrega('G1', [X('SKT-TOP-01005')])));
  await caso('flujo: gabinete entrega EN GRUPO (2 en un lote, cada una con su XML)', () => assertSucceeds(entrega(['G2', 'G3'], id => [X(id === 'G2' ? 'SKT-TOP-01006' : 'SKT-TOP-01007')])));
  await caso('flujo: gabinete entrega un dron con varios protocolos (un XML por código)', () => assertSucceeds(entrega('DR', [X('SKT-TOP-01101'), X('SKT-TOP-01102')])));
  await caso('flujo: gabinete entrega un registro SIN frente (la app deja supId vacío)', () => assertSucceeds(entrega('SF', [{ archivo: 'a.xml', superficie: 'SKT-TOP-01100', codigo: 'SKT-TOP-01100', supId: '', subId: '', grupo: '' }])));
  await caso('flujo: gabinete entrega desde una fila resumida (misma escritura, con carpeta y cargo)', () => assertSucceeds(paso(gab, 'gab', 'FR', { fechaEntrega: Timestamp.now(), numeroCargo: 'C-9', carpeta: 'https://x/y', xmlEntrega: [X('SKT-TOP-01103')] }, 'EC', 'EP')));
  await caso('flujo: gabinete pone carpeta en un entregado de antes (xmlEntrega viejo [{supId}])', () => assertSucceeds(updateDoc(lib('E1'), { carpeta: 'Nueva', editadoEn: serverTimestamp(), editadoPor: U.gab })));
  await caso('flujo: re-entrega: observar el en proceso, campo corrige, re-acepta con su código y entrega', async () => {
    await assertSucceeds(paso(gab, 'gab', 'G4', { notaObservacion: 'corrige' }, 'OB', 'EP'));
    const b = writeBatch(topo); b.update(doc(topo, 'liberaciones', 'G4'), { descripcion: 'corregida', estado: 'PT', editadoEn: serverTimestamp(), editadoPor: U.topo }); b.set(doc(topo, 'resumen', 'f1'), { r: { G4: ['t1', 'Capa 3', 0, 10, 'PT'] } }, { merge: true }); await assertSucceeds(b.commit());
    await assertSucceeds(aceptarApp(gab, 'gab', 'G4'));
    await assertSucceeds(entrega('G4', [X('SKT-TOP-01008')])); });
  await caso('administrador sigue pudiendo entregar con lo que sea (lo corrige él)', async () => { await sinReglas('liberaciones', 'AD1', { ...bF, estado: 'EP', numero: 'SKT-TOP-01200' }); await assertSucceeds(updateDoc(doc(adm, 'liberaciones', 'AD1'), { estado: 'EC', xmlEntrega: [{}] })); });

  console.log('— D6 · Gabinete: solo los pasos de estado de la app');
  for (const [id, est, num] of [['S1', 'PT', ''], ['S2', 'PT', ''], ['S3', 'PT', ''], ['S4', 'OB', ''], ['S5', 'OB', 'SKT-TOP-01300'], ['S6', 'EP', 'SKT-TOP-01301'], ['S7', 'EP', 'SKT-TOP-01302'],
    ['S8', 'RE', ''], ['S9', 'OB', 'SKT-TOP-01303'], ['S10', 'EP', 'SKT-TOP-01304'], ['S11', 'RE', 'SKT-TOP-01305'], ['S12', 'PT', ''], ['S13', 'PT', ''], ['S14', 'OB', ''], ['S15', 'PT', ''],
    ['Z1', 'EP', 'SKT-TOP-01310'], ['Z2', 'PT', ''], ['Z3', 'PT', ''], ['Z4', 'EC', 'SKT-TOP-01311'], ['Z5', 'EC', 'SKT-TOP-01312'], ['Z6', 'RE', ''], ['Z7', 'RE', 'SKT-TOP-01313'], ['Z8', 'NA', ''], ['Z9', 'PT', ''], ['Z10', 'PT', ''], ['Z11', 'PT', '']])
    await sinReglas('liberaciones', id, { ...bF, estado: est, numero: num });
  await sinReglas('liberaciones', 'NA1', { ...bF, actividad: 'LEV', estado: 'NA', numero: '' });
  await sinReglas('liberaciones', 'ASP1', { ...bF, actividad: 'ASP', estado: 'NA', numero: '' });
  await sinReglas('liberaciones', 'IMP1', { ...bF, origen: 'excel', creadoPor: 'importado', estado: 'EP', numero: 'SKT-TOP-00500', lote: 'imp-1', importadoEn: Timestamp.now() });
  await sinReglas('liberaciones', 'IMP2', { ...bF, origen: 'excel', creadoPor: 'importado', estado: 'EP', numero: 'SKT-TOP-00501', lote: 'imp-1' });
  await sinReglas('liberaciones', 'IMP3', { ...bF, origen: 'excel', creadoPor: 'importado', estado: 'EC', numero: 'SKT-TOP-00502', lote: 'imp-1' });
  await caso('(hueco D6) gabinete NO rechaza un en proceso con código (copia vieja en pantalla)', () => assertFails(paso(gab, 'gab', 'Z1', { notaRechazo: 'x', notaObservacion: '' }, 'RE', 'PT')));
  await caso('(hueco D6) gabinete NO pone un estado que no existe ("ZZ")', () => assertFails(updateDoc(lib('Z2'), { estado: 'ZZ' })));
  await caso('(hueco D6) gabinete NO pasa a en proceso un pendiente sin código', () => assertFails(updateDoc(lib('Z3'), { estado: 'EP' })));
  await caso('(hueco D6) gabinete NO observa un entregado (copia vieja: lo ve en proceso)', () => assertFails(paso(gab, 'gab', 'Z4', { notaObservacion: 'x' }, 'OB', 'EP')));
  await caso('(hueco D6) gabinete NO devuelve a pendiente un entregado', () => assertFails(paso(gab, 'gab', 'Z5', { notaObservacion: '', notaRechazo: '' }, 'PT', 'EP')));
  await caso('(hueco D6) gabinete NO pasa de rechazado a entregado', () => assertFails(updateDoc(lib('Z6'), { estado: 'EC', xmlEntrega: [X('SKT-TOP-01314')] })));
  await caso('(hueco D6) gabinete NO pasa de rechazado a en proceso (aunque tenga código)', () => assertFails(updateDoc(lib('Z7'), { estado: 'EP' })));
  await caso('(hueco D6) gabinete NO acepta un rechazado (código nuevo sobre un RE)', () => assertFails(aceptarApp(gab, 'gab', 'Z6')));
  await caso('(hueco D6) gabinete NO pasa un levantamiento «sin código» a pendiente', () => assertFails(updateDoc(lib('Z8'), { estado: 'PT' })));
  await caso('(hueco D6) gabinete NO marca «procesado» (en la app solo jefe y administrador)', () => assertFails(updateDoc(lib('ASP1'), { procesado: true, procesadoPor: U.gab, procesadoNombre: '', procesadoEn: serverTimestamp() })));
  await caso('(hueco D6) gabinete NO cambia creadoNombre («Registrado por»)', () => assertFails(updateDoc(lib('Z9'), { creadoNombre: 'Otro' })));
  await caso('(hueco D6) gabinete NO cambia el lote de una importación', () => assertFails(updateDoc(lib('IMP1'), { lote: 'imp-2' })));
  await caso('(hueco D6) gabinete NO cambia importadoEn', () => assertFails(updateDoc(lib('IMP1'), { importadoEn: deleteField() })));
  await caso('(hueco D6) gabinete NO pone un pendiente como «no lleva código»', () => assertFails(updateDoc(lib('Z10'), { estado: 'NA' })));
  await caso('(hueco D6) gabinete NO pone «Eliminado» (X)', () => assertFails(updateDoc(lib('Z11'), { estado: 'X' })));
  await caso('flujo: aceptar uno (código nuevo, correlativo +1, resumen e historial)', () => assertSucceeds(aceptarApp(gab, 'gab', 'S1', { capa: 'Capa 4', solapaCon: [] })));
  await caso('flujo: aceptar varios (uno tras otro, como aceptarVarios)', async () => { await assertSucceeds(aceptarApp(gab, 'gab', 'S2')); await assertSucceeds(aceptarApp(gab, 'gab', 'S3')); });
  await caso('flujo: aceptar un observado sin código (código nuevo)', () => assertSucceeds(aceptarApp(gab, 'gab', 'S4')));
  await caso('flujo: re-aceptar un observado con su código', () => assertSucceeds(aceptarApp(gab, 'gab', 'S5')));
  await caso('flujo: aceptar un dron con 2 protocolos', async () => { await sinReglas('liberaciones', 'DR2', { ...bF, actividad: 'DRN', estado: 'PT', numero: '' }); await assertSucceeds(runTransaction(gab, async tx => {
    const cRef = doc(gab, 'contadores', 'skt'), c = await tx.get(cRef); await tx.get(doc(gab, 'liberaciones', 'DR2')); await tx.get(doc(gab, 'config', 'general'));
    let u = c.data().ultimo; const protocolos = [{ id: 'p1', nombre: 'A', numero: 'SKT-TOP-0' + (++u) }, { id: 'p2', nombre: 'B', numero: 'SKT-TOP-0' + (++u) }];
    tx.set(cRef, { ultimo: u }, { merge: true }); tx.update(doc(gab, 'liberaciones', 'DR2'), { numero: protocolos[0].numero, protocolos, estado: 'EP', nombreLiberacion: 'x', generadoPor: 'Gab', fechaLiberacion: serverTimestamp(), notaObservacion: '', editadoEn: serverTimestamp(), editadoPor: U.gab }); })); });
  await caso('flujo: observar un pendiente', () => assertSucceeds(paso(gab, 'gab', 'S12', { notaObservacion: 'x' }, 'OB', 'PT')));
  await caso('flujo: observar un en proceso', () => assertSucceeds(paso(gab, 'gab', 'S6', { notaObservacion: 'x' }, 'OB', 'EP')));
  await caso('flujo: observar de nuevo un observado (cambia la nota)', () => assertSucceeds(paso(gab, 'gab', 'S12', { notaObservacion: 'otra' }, 'OB', 'OB')));
  await caso('flujo: observar 3 en un lote (grupo)', () => assertSucceeds(paso(gab, 'gab', ['S13', 'S7', 'S14'], { notaObservacion: 'grupo' }, 'OB', 'PT')));
  await caso('flujo: rechazar un pendiente', () => assertSucceeds(paso(gab, 'gab', 'S15', { notaRechazo: 'mal', notaObservacion: '' }, 'RE', 'PT')));
  await caso('flujo: rechazar un observado', () => assertSucceeds(paso(gab, 'gab', 'S9', { notaRechazo: 'mal', notaObservacion: '' }, 'RE', 'OB')));
  await caso('flujo: devolver a pendientes un rechazado y «Deshacer» (vuelve a rechazado)', async () => {
    await assertSucceeds(paso(gab, 'gab', 'S8', { notaObservacion: '', notaRechazo: '' }, 'PT', 'RE'));
    await assertSucceeds(paso(gab, 'gab', 'S8', { notaObservacion: '', notaRechazo: 'mal' }, 'RE', 'PT')); });
  await caso('flujo: devolver a pendientes un en proceso y «Deshacer» (vuelve a en proceso con su código)', async () => {
    await assertSucceeds(paso(gab, 'gab', 'S10', { notaObservacion: '', notaRechazo: '' }, 'PT', 'EP'));
    await assertSucceeds(paso(gab, 'gab', 'S10', { notaObservacion: '', notaRechazo: '' }, 'EP', 'PT')); });
  await caso('flujo: devolver a pendientes un observado y «Deshacer» (vuelve a observado)', async () => {
    await assertSucceeds(paso(gab, 'gab', 'S6', { notaObservacion: '', notaRechazo: '' }, 'PT', 'OB'));
    await assertSucceeds(paso(gab, 'gab', 'S6', { notaObservacion: 'x', notaRechazo: '' }, 'OB', 'PT')); });
  await caso('flujo: devolver en grupo (observado, rechazado con código) en un lote', () => assertSucceeds(paso(gab, 'gab', ['S12', 'S11'], { notaObservacion: '', notaRechazo: '' }, 'PT', 'OB')));
  await caso('flujo: gabinete pone la capa de un en proceso (sin cambiar estado)', () => assertSucceeds(updateDoc(lib('S1'), { capa: 'Capa 5', solapaCon: [], editadoEn: serverTimestamp(), editadoPor: U.gab })));
  await caso('flujo: gabinete pone la carpeta de varios en proceso', () => assertSucceeds(paso(gab, 'gab', ['S2', 'S3'], { carpeta: 'C' }, 'EP', 'EP')));
  await caso('flujo: gabinete marca «Enterado» un levantamiento y lo quita', async () => {
    await assertSucceeds(updateDoc(lib('NA1'), { visto: true, vistoPor: U.gab, vistoNombre: 'Gab', vistoEn: serverTimestamp() }));
    await assertSucceeds(updateDoc(lib('NA1'), { visto: false, vistoPor: '', vistoNombre: '', vistoEn: null })); });
  await caso('flujo: gabinete manda a la papelera un pendiente sin código y lo restaura', async () => {
    const b = writeBatch(gab); b.update(lib('Z2'), { borrado: true, borradoPor: U.gab, borradoNombre: 'Gab', borradoEn: serverTimestamp() }); b.set(doc(gab, 'resumen', 'f1'), { r: { Z2: deleteField() } }, { merge: true }); await assertSucceeds(b.commit());
    await assertSucceeds(updateDoc(lib('Z2'), { borrado: deleteField(), borradoPor: deleteField(), borradoNombre: deleteField(), borradoEn: deleteField() })); });
  await caso('flujo: gabinete observa y entrega registros importados del Excel', async () => {
    await assertSucceeds(paso(gab, 'gab', 'IMP2', { notaObservacion: 'x' }, 'OB', 'EP'));
    await assertSucceeds(paso(gab, 'gab', 'IMP2', { notaObservacion: '', notaRechazo: '' }, 'PT', 'OB'));
    await assertSucceeds(aceptarApp(gab, 'gab', 'IMP2')); await assertSucceeds(entrega('IMP2', [X('SKT-TOP-00501')])); });
  await caso('flujo: gabinete pone carpeta a un entregado importado', () => assertSucceeds(updateDoc(lib('IMP3'), { carpeta: 'K', editadoEn: serverTimestamp(), editadoPor: U.gab })));
  await caso('jefe sigue marcando procesadas las aspas', () => assertSucceeds(updateDoc(doc(jefe, 'liberaciones', 'ASP1'), { procesado: true, procesadoPor: U.jefe, procesadoNombre: 'Jefe', procesadoEn: serverTimestamp() })));
  await caso('administrador sigue pudiendo cambiar cualquier estado (EC → PT)', () => assertSucceeds(updateDoc(doc(adm, 'liberaciones', 'Z5'), { estado: 'PT' })));

  console.log('— D20 · Gabinete edita lo que registró él mismo');
  await sinReglas('liberaciones', 'GO', { ...bF, creadoPor: U.gab, estado: 'OB', numero: '', notaObservacion: 'corrige' });
  await sinReglas('liberaciones', 'GP', { ...bF, creadoPor: U.gab, estado: 'PT', numero: '' });
  await sinReglas('liberaciones', 'TO', { ...bF, estado: 'OB', numero: '', notaObservacion: 'corrige' });
  await sinReglas('liberaciones', 'TO2', { ...bF, estado: 'OB', numero: '', notaObservacion: 'corrige' });
  const edicion = { descripcion: 'editada', pkInicio: 1, pkFin: 9, observaciones: 'o', archivos: [], linksCsv: [], linksFotos: [], solapaCon: [], editadoEn: serverTimestamp() };
  const editarApp = (db, quien, id, a, extra = {}) => { const b = writeBatch(db); b.update(doc(db, 'liberaciones', id), { ...edicion, ...extra, editadoPor: U[quien], estado: a }); b.set(doc(db, 'resumen', 'f1'), { r: { [id]: ['t1', 'Capa 3', 1, 9, a] } }, { merge: true });
    b.set(doc(collection(db, 'historial')), { liberacionId: id, accion: 'editado', de: 'OB', a, usuario: U[quien], nombre: '', fecha: serverTimestamp(), nota: '' }); return b.commit(); };
  await caso('flujo (antes fallaba, D20): gabinete guarda la edición de su observado (queda observado)', () => assertSucceeds(editarApp(gab, 'gab', 'GO', 'OB')));
  await caso('flujo: gabinete edita su pendiente', () => assertSucceeds(editarApp(gab, 'gab', 'GP', 'PT')));
  await caso('flujo: topógrafo corrige su observado (pasa a pendiente)', () => assertSucceeds(editarApp(topo, 'topo', 'TO', 'PT')));
  await caso('topógrafo NO deja su observado como observado (la app lo pasa a pendiente)', () => assertFails(editarApp(topo, 'topo', 'TO2', 'OB')));
  await caso('gabinete NO edita el observado de otro (aunque lo deje observado)', () => assertFails(editarApp(gab2, 'gab2', 'GO', 'OB', { descripcion: 'de otro' })));
  await caso('(hueco) topógrafo NO cambia creadoNombre al editar lo suyo', () => assertFails(updateDoc(doc(topo, 'liberaciones', 'TO'), { creadoNombre: 'Jefe de área', estado: 'PT' })));

  console.log('— D21 · Pedir acceso (solicitudes)');
  const nuevo = env.authenticatedContext('uidN', { email: U.nuevo, email_verified: true }).firestore();
  const otro = env.authenticatedContext('uidO', { email: 'otra@x.com', email_verified: true }).firestore();
  await caso('flujo: cuenta nueva deja su solicitud como la app (merge)', () => assertSucceeds(setDoc(doc(nuevo, 'solicitudes', 'uidN'), { email: U.nuevo, nombre: 'Ana Pérez', fecha: serverTimestamp() }, { merge: true })));
  await caso('flujo: vuelve a entrar y la reescribe (merge sobre la que había)', () => assertSucceeds(setDoc(doc(nuevo, 'solicitudes', 'uidN'), { email: U.nuevo, nombre: 'Ana Pérez', fecha: serverTimestamp() }, { merge: true })));
  await caso('flujo: cuenta de Google sin nombre (nombre vacío)', () => assertSucceeds(setDoc(doc(otro, 'solicitudes', 'uidO'), { email: 'otra@x.com', nombre: '', fecha: serverTimestamp() }, { merge: true })));
  await caso('flujo: la cuenta nueva lee su propio perfil (aún no existe)', () => assertSucceeds(getDoc(doc(nuevo, 'usuarios', U.nuevo))));
  await caso('(hueco D21) solicitud con un nombre de 900 KB', () => assertFails(setDoc(doc(nuevo, 'solicitudes', 'uidN'), { email: U.nuevo, nombre: 'x'.repeat(900000) }, { merge: true })));
  await caso('(hueco D21) solicitud con campos de más (rol: admin)', () => assertFails(setDoc(doc(nuevo, 'solicitudes', 'uidN'), { email: U.nuevo, nombre: 'A', rol: 'admin' }, { merge: true })));
  await caso('(hueco D21) solicitud nueva con campos de más', () => assertFails(setDoc(doc(env.authenticatedContext('uidM', { email: 'm@x.com', email_verified: true }).firestore(), 'solicitudes', 'uidM'), { email: 'm@x.com', nombre: 'A', fecha: serverTimestamp(), extra: 'x'.repeat(1000) })));
  await caso('solicitud con el correo de otra persona: rechazada (como antes)', () => assertFails(setDoc(doc(otro, 'solicitudes', 'uidO'), { email: U.nuevo, nombre: 'A' }, { merge: true })));
  await caso('solicitud en el id de otra cuenta: rechazada (como antes)', () => assertFails(setDoc(doc(otro, 'solicitudes', 'uidN'), { email: 'otra@x.com', nombre: 'A' }, { merge: true })));
  await caso('flujo: jefe ve las solicitudes', () => assertSucceeds(getDocs(collection(jefe, 'solicitudes'))));
  await caso('flujo: jefe aprueba (crea la cuenta y borra la solicitud en un lote)', async () => { const b = writeBatch(jefe); b.set(doc(jefe, 'usuarios', U.nuevo), { nombre: 'Ana Pérez', rol: 'operario', topografoId: '', activo: true, creadoEn: serverTimestamp() }); b.delete(doc(jefe, 'solicitudes', 'uidN')); await assertSucceeds(b.commit()); });
  await caso('flujo: jefe rechaza una solicitud (la borra)', () => assertSucceeds(deleteDoc(doc(jefe, 'solicitudes', 'uidO'))));

  console.log('— D22 · Leer perfiles');
  await caso('(hueco D22) topógrafo NO lee la lista de usuarios', () => assertFails(getDocs(collection(topo, 'usuarios'))));
  await caso('(hueco D22) gabinete NO lee la lista de usuarios', () => assertFails(getDocs(collection(gab, 'usuarios'))));
  await caso('(hueco D22) topógrafo NO lee el perfil de otra persona', () => assertFails(getDoc(doc(topo, 'usuarios', U.gab))));
  await caso('flujo: topógrafo lee (y escucha) su propio perfil', () => assertSucceeds(getDoc(doc(topo, 'usuarios', U.topo))));
  await caso('flujo: gabinete lee su propio perfil', () => assertSucceeds(getDoc(doc(gab, 'usuarios', U.gab))));
  await caso('flujo: cuenta desactivada lee su perfil (ve «acceso desactivado»)', () => assertSucceeds(getDoc(doc(inac, 'usuarios', U.inac))));
  await caso('flujo: jefe lee la lista de usuarios (Ajustes → Usuarios)', () => assertSucceeds(getDocs(collection(jefe, 'usuarios'))));
  await caso('flujo: administrador lee la lista de usuarios', () => assertSucceeds(getDocs(collection(adm, 'usuarios'))));
  await caso('flujo: jefe busca las cuentas de una clave de topógrafo (cambiar clave)', () => assertSucceeds(getDocs(query(collection(jefe, 'usuarios'), where('topografoId', '==', 'BV')))));
  await caso('flujo: el dueño lee su perfil y la lista', async () => { const own = env.authenticatedContext('own', { email: 'brandonkluivertvillegasfranco@gmail.com', email_verified: true }).firestore(); await assertSucceeds(getDoc(doc(own, 'usuarios', 'brandonkluivertvillegasfranco@gmail.com'))); await assertSucceeds(getDocs(collection(own, 'usuarios'))); });

  await env.cleanup();
  console.log(`\n${ok} OK · ${mal} FAIL`); process.exit(mal ? 1 : 0);
})().catch(e => { console.log('FAIL  excepción', e); process.exit(1); });
