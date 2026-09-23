import { planDilution } from '../src/engine/plan.js';
import * as Dec from '../src/engine/decimal.js';

/** A clean single-step plan; override fields as needed. */
export function base(overrides = {}) {
  return {
    stock: { value: '1000', unit: 'µg/mL' },
    stockProvenance: 'coa',
    target: { form: 'single', value: '100', unit: 'µg/mL' },
    targetProvenance: 'user',
    volume: { value: '100', unit: 'µL' },
    basis: 'final',
    diluent: { name: 'PBS' },
    minTransfer: { value: '2', unit: 'µL' },
    ...overrides,
  };
}

export function plan(overrides = {}, options) {
  return planDilution(base(overrides), options);
}

export function vessel(r, label) {
  const v = r.vessels.find((x) => x.label === label);
  if (!v) throw new Error(`no vessel ${label} in plan (${r.status}: ${JSON.stringify(r.rejections.map((x) => x.code))}${JSON.stringify(r.incomplete)})`);
  return v;
}

export function codes(r) {
  return r.flags.map((f) => f.code);
}

export function rejectCodes(r) {
  return r.rejections.map((f) => f.code);
}

/** Map label -> unrounded internal values, for bit-for-bit comparison (C3-IV-08). */
export function unroundedSnapshot(r) {
  const out = {};
  for (const v of r.vessels) {
    if (v.kind === 'stock') continue;
    out[v.label] = {
      T: v.volumes.transferIn.internalUnrounded,
      D: v.volumes.diluent.internalUnrounded,
      V: v.volumes.total.internalUnrounded,
      c: v.concentration.exact.internalUnrounded,
      source: v.sourceLabel,
    };
  }
  return out;
}

/** Bit-identical unrounded volumes and the same source vessel. */
export function sameBits(a, b) {
  return Object.is(a.T, b.T) && Object.is(a.D, b.D) && Object.is(a.V, b.V) && a.source === b.source;
}

/** sameBits plus the exact concentration — for clauses under which nothing at all may change. */
export function sameBitsAndConcentration(a, b) {
  return sameBits(a, b) && Object.is(a.c, b.c);
}

/** Half a unit in the last place of a value displayed to 3 significant figures. */
export function halfUlp3sf(display) {
  const x = Math.abs(Number(display));
  if (x === 0) return Dec.fromString('0');
  const e = Math.floor(Math.log10(x)) - 2;
  return Dec.shift(Dec.fromString('0.5'), e);
}

/** ULP of a double. */
export function ulp(x) {
  const a = Math.abs(x);
  if (a === 0) return Number.MIN_VALUE;
  const e = Math.floor(Math.log2(a));
  return 2 ** (e - 52);
}

export function ulpDistance(a, b) {
  return Math.abs(a - b) / ulp(b);
}

export const D = Dec;
