// D2 — rounding primitive measurement record. Run: node scripts/measure-rounding.mjs
import * as D from '../src/engine/decimal.js';
import { MEASUREMENT_CASES } from '../test/rounding-measurement.test.js';

console.log(`runtime: node ${process.versions.node}, v8 ${process.versions.v8}, ${process.platform}/${process.arch}`);
console.log('| value | n | exact binary expansion (first 30 digits) | engine roundSig | toPrecision | agree |');
console.log('|---|---|---|---|---|---|');
for (const [x, n, expected] of MEASUREMENT_CASES) {
  const exact = D.toString(D.fromNumberExact(x));
  const ours = D.toString(D.roundSig(D.fromNumberExact(x), n));
  const tp = x.toPrecision(n);
  console.log(`| ${x} | ${n} | ${exact.slice(0, 30)}${exact.length > 30 ? '…' : ''} | ${ours} | ${tp} | ${Number(tp) === Number(ours) ? 'yes' : 'NO'} |`);
  if (ours !== expected) console.log(`!! expected ${expected}`);
}
