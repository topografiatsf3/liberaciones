// Firestore simulado en memoria + localStorage (solo para pruebas)
const KEY = '__fakeDB';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
// Para pruebas con bases grandes: sessionStorage['__fakeDBGrande'] = '1' guarda la base solo en memoria de esta página
// (window.__fakeDBInicial, puesta con addInitScript) para no pasar el límite de localStorage
const grande = () => { try { return sessionStorage.getItem('__fakeDBGrande') === '1'; } catch (e) { return false; } };
let store = grande() && window.__fakeDBInicial ? JSON.parse(JSON.stringify(window.__fakeDBInicial)) : load();
const save = () => { if (grande()) return; localStorage.setItem(KEY, JSON.stringify(store)); };
const listeners = new Set();
const pending = new Set();
let commits = [];

export class Timestamp {
  constructor(ms) { this._ms = ms; }
  static fromDate(d) { return new Timestamp(d.getTime()); }
  static now() { return new Timestamp(Date.now()); }
  toDate() { return new Date(this._ms); }
  toMillis() { return this._ms; }
}
const ST = { __st: 1 };
const DEL = { __del: 1 };
export const deleteField = () => DEL;
export const serverTimestamp = () => ST;
const enc = v => {
  if (v === ST) return { __ts: Date.now() };
  if (v === DEL) return DEL;
  if (v instanceof Timestamp) return { __ts: v._ms };
  if (Array.isArray(v)) return v.map(enc);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = enc(v[k]); return o; }
  return v;
};
const dec = v => {
  if (v && typeof v === 'object' && '__ts' in v) return new Timestamp(v.__ts);
  if (Array.isArray(v)) return v.map(dec);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = dec(v[k]); return o; }
  return v;
};
export function initializeFirestore() { return { fake: true }; }
export const persistentLocalCache = () => ({});
export const persistentMultipleTabManager = () => ({});
const rid = () => Math.random().toString(36).slice(2, 12);
export function collection(db, ...segs) { return { type: 'col', path: segs.join('/') }; }
export function doc(a, ...segs) {
  if (a && a.type === 'col' && !segs.length) { const id = rid(); return { type: 'doc', path: a.path + '/' + id, id }; }
  const base = a && a.type === 'col' ? [a.path, ...segs] : segs;
  const path = base.join('/'); return { type: 'doc', path, id: path.split('/').pop() };
}
export const where = (f, op, v) => ({ t: 'where', f, op, v });
export const documentId = () => '__name__';
export const orderBy = (f, d = 'asc') => ({ t: 'order', f, d });
export const limit = n => ({ t: 'limit', n });
// startAfter con el documento (snapshot) en que terminó la página anterior
export const startAfter = d => ({ t: 'after', id: d && d.id });
export function query(col, ...c) { return { type: 'query', path: col.path, c }; }

const val = x => x && x.__ts ? x.__ts : x;
function snapDoc(path) {
  const raw = store[path];
  return { id: path.split('/').pop(), exists: () => !!raw, data: () => raw ? dec(raw) : undefined, metadata: { hasPendingWrites: pending.has(path), fromCache: false } };
}
function runQuery(q) {
  const col = q.path, c = q.c || [];
  let docs = Object.keys(store).filter(p => p.startsWith(col + '/') && p.split('/').length === col.split('/').length + 1);
  const wv = x => x instanceof Timestamp ? x._ms : x;
  for (const w of c.filter(x => x.t === 'where')) docs = docs.filter(p => { const v = w.f === '__name__' ? p.split('/').pop() : val(store[p][w.f]), t = wv(w.v); if (v == null) return false;
    return w.op === '==' ? v === t : w.op === 'in' ? t.includes(v) : w.op === '>=' ? v >= t : w.op === '<=' ? v <= t : w.op === '>' ? v > t : w.op === '<' ? v < t : true; });
  const o = c.find(x => x.t === 'order');
  if (o) { docs = docs.filter(p => store[p][o.f] != null); docs.sort((a, b) => { const x = val(store[a][o.f]), y = val(store[b][o.f]); return (x < y ? -1 : x > y ? 1 : 0) * (o.d === 'desc' ? -1 : 1); }); }
  const sa = c.find(x => x.t === 'after'); if (sa) { const i = docs.findIndex(p => p.split('/').pop() === sa.id); docs = i < 0 ? [] : docs.slice(i + 1); }
  const l = c.find(x => x.t === 'limit'); if (l) docs = docs.slice(0, l.n);
  return { docs: docs.map(snapDoc), size: docs.length, metadata: { fromCache: false, hasPendingWrites: docs.some(p => pending.has(p)) } };
}
let emitting=false, again=false;
function esObj(v) { return v && typeof v === 'object' && !Array.isArray(v) && !('__ts' in v); }
function fusion(a, b) { const o = { ...a }; for (const k in b) { if (b[k] && b[k].__del) delete o[k]; else if (esObj(b[k]) && esObj(o[k])) o[k] = fusion(o[k], b[k]); else o[k] = esObj(b[k]) ? limpiarDel(b[k]) : b[k]; } return o; }
function limpiarDel(v) { if (!esObj(v)) return v; const o = {}; for (const k in v) if (!(v[k] && v[k].__del)) o[k] = limpiarDel(v[k]); return o; }
function emit() { if (emitting) { again = true; return; } emitting = true; do { again = false; for (const l of [...listeners]) { try { l.fire(); } catch (e) { console.error(e); } } } while (again); emitting = false; }
export function onSnapshot(ref, a, b, c) {
  let next = a, err = b; if (typeof a === 'object' && a && typeof b === 'function') { next = b; err = c; }
  // Contador para pruebas (__fakeDocsEscucha): como cobra Firestore, la primera entrega cuenta todos los documentos y las
  // siguientes solo los nuevos o cambiados (__fakeDocsPorRuta: lo mismo por colección o documento)
  const vistos = new Map(), cuenta = docs => { let n = 0; const ahora = new Map(); for (const d of docs) { const j = JSON.stringify(store[colDe(ref, d)] || null); ahora.set(d.id, j); if (vistos.get(d.id) !== j) n++; } vistos.clear(); ahora.forEach((v, k) => vistos.set(k, v)); window.__fakeDocsEscucha = (window.__fakeDocsEscucha || 0) + n; (window.__fakeDocsPorRuta ||= {})[ref.path] = (window.__fakeDocsPorRuta[ref.path] || 0) + n; };
  const l = { path: ref.path, q: ref, err, fire: () => { const s = ref.type === 'doc' ? snapDoc(ref.path) : runQuery(ref); cuenta(ref.type === 'doc' ? (s.exists() ? [s] : []) : s.docs); next(s); } };
  listeners.add(l); setTimeout(() => { if (listeners.has(l)) l.fire(); }, 0);
  return () => listeners.delete(l);
}
export async function getDoc(ref) { (window.__fakeLecturas ||= []).push({ doc: ref.path }); if (window.__fakeLeerMal && window.__fakeLeerMal(ref.path)) { const e = new Error('Lectura rechazada.'); e.code = 'permission-denied'; throw e; } return snapDoc(ref.path); }
function apply(ops) {
  const paths = [];
  // Contador para pruebas: cada envío (lote o escritura suelta) con las rutas que toca; __fakeFallar(rutas) -> true rechaza solo ese envío
  (window.__fakeEnvios ||= []).push(ops.map(o => o.k + ':' + o.ref.path));
  if (window.__fakeFallar && window.__fakeFallar(ops.map(o => o.ref.path))) { const e = new Error('Fallo simulado del envío.'); e.code = 'internal'; return Promise.reject(e); }
  // Simula que el servidor rechaza la grabación por permisos (no se escribe nada)
  if (window.__fakeNegar) { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; return Promise.reject(e); }
  for (const o of ops) {
    if (o.k === 'set') store[o.ref.path] = o.merge ? fusion(store[o.ref.path] || {}, enc(o.data)) : limpiarDel(enc(o.data));
    else if (o.k === 'update') { if (!store[o.ref.path]) throw new Error('no existe'); const d = enc(o.data); const cur = { ...store[o.ref.path] }; for (const k in d) { if (d[k] === DEL || (d[k] && d[k].__del)) delete cur[k]; else cur[k] = d[k]; } store[o.ref.path] = cur; }
    else if (o.k === 'delete') delete store[o.ref.path];
    paths.push(o.ref.path);
  }
  save();
  if (window.__fakeOffline) { paths.forEach(p => pending.add(p)); emit(); return new Promise(ok => commits.push(ok)); }
  emit(); return Promise.resolve();
}
window.__fakeGoOnline = () => { window.__fakeOffline = false; pending.clear(); commits.forEach(f => f()); commits = []; emit(); };
window.__fakeStore = () => store;
const colDe = (ref, d) => ref.type === 'doc' ? ref.path : ref.path + '/' + d.id;
// Escuchas abiertas ahora: [{ path, w: filtros, lim }]
window.__fakeEscuchas = () => [...listeners].map(l => ({ path: l.path, w: ((l.q && l.q.c) || []).filter(x => x.t === 'where').map(x => x.f + x.op + (x.v instanceof Timestamp ? 'ts' : JSON.stringify(x.v))), lim: (((l.q && l.q.c) || []).find(x => x.t === 'limit') || {}).n }));
// Para pruebas: hace fallar la escucha de una ruta (colección o documento) con ese código de error
window.__fakeEscuchaFalla = (path, code) => { let n = 0; for (const l of [...listeners]) if (l.path === path && l.err) { const e = new Error('Escucha simulada: ' + code); e.code = code; l.err(e); n++; } return n; };
export const setDoc = (ref, data, opt) => apply([{ k: 'set', ref, data, merge: opt && opt.merge }]);
export const updateDoc = (ref, data) => apply([{ k: 'update', ref, data }]);
export const deleteDoc = ref => apply([{ k: 'delete', ref }]);
export function writeBatch() {
  const ops = [];
  return { set(ref, data, opt) { ops.push({ k: 'set', ref, data, merge: opt && opt.merge }); }, update(ref, data) { ops.push({ k: 'update', ref, data }); }, delete(ref) { ops.push({ k: 'delete', ref }); }, commit: () => apply(ops) };
}
const logQ = (q, n) => (window.__fakeLecturas ||= []).push({ col: q.path, w: (q.c || []).filter(x => x.t === 'where').map(x => x.f), n });
export async function getDocs(q) { const r = runQuery(q); logQ(q, r.size); return r; }
// Conteo del servidor: Firestore cobra 1 lectura por cada 1.000 que coinciden (mínimo 1)
export async function getCountFromServer(q) { const r = runQuery(q); (window.__fakeLecturas ||= []).push({ col: q.path, w: (q.c || []).filter(x => x.t === 'where').map(x => x.f), n: Math.max(1, Math.ceil(r.size / 1000)), conteo: true }); return { data: () => ({ count: r.size }) }; }
export async function getDocsFromServer(q) { const r = runQuery(q); logQ(q, r.size); return r; }
export async function getDocFromServer(ref) { return snapDoc(ref.path); }

export async function runTransaction(db, fn) {
  const ops = [];
  const tx = { get: async ref => snapDoc(ref.path), set(ref, data, opt) { ops.push({ k: 'set', ref, data, merge: opt && opt.merge }); }, update(ref, data) { ops.push({ k: 'update', ref, data }); }, delete(ref) { ops.push({ k: 'delete', ref }); } };
  const out = await fn(tx); await apply(ops); return out;
}
export function waitForPendingWrites() { return pending.size ? new Promise(ok => commits.push(ok)) : Promise.resolve(); }
