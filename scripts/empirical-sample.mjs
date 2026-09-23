// §9 item 3 — empirical maxima over a large random sample, as EVIDENCE for the
// tolerance memo. Never the tolerance itself. Run: node scripts/empirical-sample.mjs [N]
import { planDilution } from '../src/engine/plan.js';

const N = Number(process.argv[2] || 100000);
let seed = 20260915;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; }
function ulp(x) { const a = Math.abs(x); const e = Math.floor(Math.log2(a)); return 2 ** (e - 52); }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function num(lo, hi, sf) { const x = lo * (hi / lo) ** rnd(); return Number(x.toPrecision(sf)); }

const maxRoundTrip = {}; // by steps from stock
const maxAchieved = {}; // by leading digit of T and chain length
let plans = 0;
for (let i = 0; i < N; i++) {
  const stock = num(0.01, 10000, 4);
  const n = 1 + Math.floor(rnd() * 5);
  const factor = num(1.5, 100, 3);
  const basis = pick(['final', 'diluent', 'available']);
  const route = n > 1 ? pick(['serial', 'independent']) : null;
  if (basis === 'available' && route !== 'serial') continue;
  const r = planDilution({
    stock: { value: String(stock), unit: 'µg/mL' }, stockProvenance: 'coa',
    target: { form: 'top-factor-count', top: String(num(stock / 1000, stock / 1.5, 4)), unit: 'µg/mL', factor, count: n },
    targetProvenance: 'user', volume: { value: String(num(5, 5000, 3)), unit: 'µL' }, basis, route,
    diluent: { name: 'x' }, minTransfer: { value: '2', unit: 'µL' },
  });
  if (r.status !== 'plan') continue;
  plans++;
  for (const v of r.vessels) {
    if (v.kind !== 'point' || v.isZero) continue;
    const target = r.declarations.target.values[v.pointIndex].internal;
    const u = Math.abs(v.concentration.exact.internalUnrounded - target) / ulp(target);
    const k = v.stepsFromStock;
    maxRoundTrip[k] = Math.max(maxRoundTrip[k] || 0, u);
    const lead = String(v.volumes.transferIn.display).replace(/[^1-9]/g, '')[0];
    const key = `${lead}/${k}`;
    const dep = Math.abs(v.concentration.achievedDeparture.relative);
    maxAchieved[key] = Math.max(maxAchieved[key] || 0, dep);
  }
}
console.log(`plans: ${plans} of ${N} samples (engine node ${process.versions.node})`);
console.log('max round-trip error (ULP of target) by steps from stock:');
for (const k of Object.keys(maxRoundTrip).sort((a, b) => a - b)) console.log(`  ${k} steps: ${maxRoundTrip[k].toFixed(2)} ULP`);
console.log('max |achieved/target − 1| by leading digit of the transfer / steps from stock:');
for (const k of Object.keys(maxAchieved).sort()) console.log(`  ${k}: ${maxAchieved[k].toExponential(3)}`);
