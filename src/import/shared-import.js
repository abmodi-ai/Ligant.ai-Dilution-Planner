// Import boundary (handoff D4; URS §12) — decided under owner delegation, 15 September 2026.
//
// Transport: the user pastes the source tool's result object (JSON) into the
// Import field. Nothing is fetched; nothing leaves the browser (C3-NF-01). The
// object is mapped to C3 input here and nowhere else. A C4 series fixes the
// volume basis to "final volume" at the staining volume (C3-ST-02); a C1 value
// fixes the stock concentration with its provenance (C3-ST-03). Every flag on
// the imported object is carried and restated (C3-ST-01, C3-FL-07). A series
// stripped of its flags is not accepted.
//
// Expected shapes (the C3 reading of the shared format):
//   C4: { schema: 'ligant.bench-tools.result', tool: 'C4', resultId?, engineVersion?,
//         series: { points: [{ target: { value, unit } }, …] | [{ value, unit }, …] },
//         stainingVolume: { value, unit }, cellNumber?: number|string,
//         vendorBasis?: string, flags: [{ code, message, scope? }] }
//   C1: { schema, tool: 'C1', resultId?, concentration: { value, unit },
//         molecularWeight?: { value, unit, source }, massBasis?: string,
//         provenance?: string, flags: [{ code, message }] }

function q(x) {
  return x && x.value !== undefined && x.unit ? { value: String(x.value), unit: String(x.unit) } : null;
}

/**
 * What the object actually carried, in words. `tool` is a string here; the
 * deployed C1 emits an object ({ id, name, engineVersion }), and template
 * coercion turned that into `tool "[object Object]"` — a description of
 * JavaScript, not of the paste in front of the user. Naming what was found is
 * the same requirement the rejection messages carry: say the quantity.
 */
function describeTool(tool) {
  if (tool === undefined) return 'the object states no "tool"';
  if (tool === null) return 'the object\'s "tool" is null';
  if (typeof tool === 'string') return `the object\'s "tool" is the string "${tool}"`;
  if (Array.isArray(tool)) return `the object\'s "tool" is a list of ${tool.length}`;
  if (typeof tool === 'object') {
    const id = tool.id ?? tool.name ?? tool.tool;
    const keys = Object.keys(tool).slice(0, 4).join(', ') || 'none';
    return id !== undefined
      ? `the object\'s "tool" is an object naming "${String(id)}", with keys ${keys}`
      : `the object\'s "tool" is an object with keys ${keys}`;
  }
  return `the object\'s "tool" is a ${typeof tool}, ${String(tool)}`;
}

export function parseSharedObject(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    return { error: `not valid JSON: ${e.message}` };
  }
  if (!obj || typeof obj !== 'object') return { error: 'not an object' };
  if (obj.tool !== 'C4' && obj.tool !== 'C1') {
    return { error: `${describeTool(obj.tool)}. This tool reads an object whose "tool" is the string "C4" or "C1".` };
  }
  if (!Array.isArray(obj.flags)) return { error: 'the object carries no flags array; a series or value stripped of its flags is not accepted (C3-ST-01, C3-ST-03)' };
  return obj.tool === 'C4' ? mapC4(obj) : mapC1(obj);
}

function mapC4(obj) {
  const series = obj.series || {};
  const pts = Array.isArray(series.points) ? series.points : Array.isArray(obj.points) ? obj.points : null;
  if (!pts || pts.length === 0) return { error: 'the C4 object carries no series points' };
  const targets = pts.map((p) => q(p.target || p));
  if (targets.some((t) => !t)) return { error: 'every C4 point must carry a target concentration with a unit' };
  const units = new Set(targets.map((t) => t.unit));
  if (units.size !== 1) return { error: 'C4 points carry mixed units' };
  const sv = q(obj.stainingVolume || series.stainingVolume);
  if (!sv) return { error: 'the C4 object carries no staining volume' };
  if (obj.cellNumber === undefined && series.cellNumber === undefined) return { error: 'the C4 object carries no cell number' };
  if (!obj.vendorBasis && !series.vendorBasis) return { error: 'the C4 object carries no vendor recommendation basis' };
  return {
    tool: 'C4',
    fields: {
      target: targets.length === 1 ? { form: 'single', value: targets[0].value, unit: targets[0].unit } : { form: 'list', values: targets.map((t) => t.value), unit: targets[0].unit },
      targetProvenance: 'c4',
      targetOrigin: { tool: 'C4', resultId: obj.resultId ? String(obj.resultId) : '' },
      volume: sv,
      basis: 'final',
    },
    fixed: ['target', 'volume', 'basis'],
    imported: {
      tool: 'C4', resultId: obj.resultId ? String(obj.resultId) : null, fixed: ['target', 'volume', 'basis'],
      flags: obj.flags.map((f) => ({ code: f.code || null, message: f.message || f.text || '', scope: f.scope || null })),
      stainingVolume: sv, cellNumber: String(obj.cellNumber ?? series.cellNumber), vendorBasis: String(obj.vendorBasis || series.vendorBasis),
    },
  };
}

function mapC1(obj) {
  const c = q(obj.concentration || obj.result);
  if (!c) return { error: 'the C1 object carries no concentration with a unit' };
  return {
    tool: 'C1',
    fields: { stock: c, stockProvenance: 'c1' },
    fixed: ['stock', 'stockProvenance'],
    imported: {
      tool: 'C1', resultId: obj.resultId ? String(obj.resultId) : null, fixed: ['stock', 'stockProvenance'],
      flags: obj.flags.map((f) => ({ code: f.code || null, message: f.message || f.text || '', scope: f.scope || null })),
      molecularWeight: obj.molecularWeight || null, massBasis: obj.massBasis || null, provenance: obj.provenance || null,
    },
  };
}
