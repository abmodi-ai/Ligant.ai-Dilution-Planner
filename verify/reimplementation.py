#!/usr/bin/env python3
"""Independent reimplementation of the C3 determination in Python (acceptance 3).

Written from the URS (§5, C3-DT-03/04/06) and docs/operation-sequence.md, not
from the JavaScript. Compares UNROUNDED transfer, total and exact concentration
against the engine's reference set within the registered round-trip tolerance
(6 ULP of the target per step from stock), and the DISPLAYED values exactly,
using Python's decimal module on the exact binary expansion with ROUND_HALF_UP
(half away from zero).

Usage: node verify/dump-reference-set.mjs > verify/reference-set.json
       python3 verify/reimplementation.py verify/reference-set.json
"""
import json, math, sys
from decimal import Decimal, ROUND_HALF_UP, getcontext

getcontext().prec = 400

CONC_SCALE = {'mg/mL': 1e6, 'µg/mL': 1e3, 'ng/mL': 1, 'g/L': 1e6, 'mg/L': 1e3, 'M': 1e12, 'mM': 1e9, 'µM': 1e6, 'nM': 1e3, 'pM': 1}
VOL_SCALE = {'µL': 1, 'mL': 1e3, 'L': 1e6}


def internal_conc(q):
    return float(q['value']) * CONC_SCALE[q['unit']] if CONC_SCALE[q['unit']] != 1 else float(q['value'])


def dec_vol(q):
    return Decimal(q['value']).scaleb(int(round(math.log10(VOL_SCALE[q['unit']]))))


def round_sig(d, n):
    """Half away from zero on the exact value held (Decimal(float) is exact)."""
    d = Decimal(d) if not isinstance(d, Decimal) else d
    if d == 0:
        return Decimal(0)
    e = d.adjusted()
    q = Decimal(1).scaleb(e - n + 1)
    return d.quantize(q, rounding=ROUND_HALF_UP)


def fmt(d):
    s = format(d, 'f')
    return s


def transfer(basis, stated, c_src, c_b):
    if c_b == 0:
        return 0.0
    if basis == 'diluent':
        return (stated * c_b) / (c_src - c_b)
    return (stated * c_b) / c_src


def ulp(x):
    return math.ulp(x)


def build_final(Fdec, Fnum, T):
    Td = round_sig(Decimal(T), 3)
    D = Fdec - Td
    Dd = round_sig(D, 3)
    return dict(T=T, Td=Td, Dd=Dd, total=Td + Dd, V=Fnum, residual=Dd - D)


def build_diluent(Ddec, Dnum, T):
    Td = round_sig(Decimal(T), 3)
    return dict(T=T, Td=Td, Dd=Ddec, total=Ddec + Td, V=Dnum + T, residual=None)


def build_available(Adec, Anum, T, onward_dec, onward_num):
    Td = round_sig(Decimal(T), 3)
    closure = Adec + onward_dec
    D = closure - Td
    Dd = round_sig(D, 3)
    return dict(T=T, Td=Td, Dd=Dd, total=Td + Dd, V=Anum + onward_num, residual=Dd - D)


def intermediate(g, m_dec, onward_sum, c_src, basis_of_dest, stated_or_V, c_b):
    k = int(round(math.log10(g)))
    Fint = max(m_dec.scaleb(k), round_sig(Decimal(onward_sum), 3))
    Tint = Fint.scaleb(-k)
    vol = build_final(Fint, float(Fint), float(Tint))
    vol['Td'] = round_sig(Tint, 3)
    D = Fint - vol['Td']
    vol['Dd'] = round_sig(D, 3)
    vol['total'] = vol['Td'] + vol['Dd']
    vol['residual'] = vol['Dd'] - D
    return Fint, Tint, vol


def choose_g(basis, stated_or_V, c_src, c_b, m_num, m_dec, cap_dec, source_total_dec, serial):
    f = c_src / c_b
    g = 10
    while g < f and g <= 10 ** 18:
        c_int = c_src / g
        if c_int > c_b:
            Tb = transfer(basis, stated_or_V, c_int, c_b)
            Fint, Tint, vol = intermediate(g, m_dec, Tb, c_src, basis, stated_or_V, c_b)
            ok = Tb >= m_num
            if ok and cap_dec is not None and vol['total'] > cap_dec:
                ok = False
            if ok and serial and source_total_dec is not None and vol['Td'] > source_total_dec:
                ok = False
            if ok:
                return g, Tb, Fint, Tint, vol
        g *= 10
    return None


def plan(inp):
    c_S = internal_conc(inp['stock'])
    t = inp['target']
    if t['form'] == 'single':
        targets = [internal_conc({'value': t['value'], 'unit': t['unit']})]
    elif t['form'] == 'list':
        targets = [internal_conc({'value': v, 'unit': t['unit']}) for v in t['values']]
    else:
        targets = []
        c = internal_conc({'value': t['top'], 'unit': t['unit']})
        for _ in range(int(t['count'])):
            targets.append(c)
            c = c / float(t['factor'])
    basis = inp['basis']
    route = inp.get('route') if len(targets) > 1 else None
    stated_dec = dec_vol(inp['volume'])
    stated_num = float(stated_dec)
    m_dec = dec_vol(inp['minTransfer'])
    m_num = float(m_dec)
    vessels = []  # dicts with label, source, steps, T, V, cExact, Td, Dd, total, residual
    n_int = 0

    def add_vessel(label, kind, src, steps, vol, c_src_exact, g=None):
        cE = c_src_exact * (vol['T'] / vol['V'])
        v = dict(label=label, kind=kind, source=src, steps=steps, g=g, T=vol['T'], V=vol['V'], cExact=cE,
                 Td=vol['Td'], Dd=vol['Dd'], total=vol['total'], residual=vol['residual'])
        vessels.append(v)
        return v

    if route == 'independent' or route is None:
        for i, c_b in enumerate(targets):
            T = transfer(basis, stated_num, c_S, c_b)
            src_label, c_src_exact, steps, c_src_nom = 'S', c_S, 1, c_S
            if T < m_num:
                g, Tb, Fint, Tint, ivol = choose_g(basis, stated_num, c_S, c_b, m_num, m_dec, None, None, False)
                # sharing: reuse an existing intermediate with the same g (resize over all its destinations)
                existing = next((v for v in vessels if v['kind'] == 'intermediate' and v['g'] == g), None)
                if existing is None:
                    n_int += 1
                    iv = add_vessel(f'I{n_int}', 'intermediate', 'S', 1, ivol, c_S, g)
                    iv['_onward'] = [Tb]
                    existing = iv
                else:
                    existing['_onward'].append(Tb)
                    Fint, Tint, ivol = intermediate(g, m_dec, sum(existing['_onward']), c_S, basis, stated_num, c_b)
                    existing.update(T=ivol['T'], V=ivol['V'], Td=ivol['Td'], Dd=ivol['Dd'], total=ivol['total'], residual=ivol['residual'], cExact=c_S * (ivol['T'] / ivol['V']))
                src_label, c_src_exact, steps, c_src_nom = existing['label'], existing['cExact'], 2, c_S / g
                T = Tb
            vol = build_final(stated_dec, stated_num, T) if basis == 'final' else build_diluent(stated_dec, stated_num, T)
            add_vessel(f'P{i+1}', 'point', src_label, steps, vol, c_src_exact)
        return vessels

    if basis == 'available':
        # backward
        feeds = [None] * len(targets)
        onward_dec, onward_num = Decimal(0), 0.0
        for i in range(len(targets) - 1, -1, -1):
            c_src = c_S if i == 0 else targets[i - 1]
            V = stated_num + onward_num
            T = transfer(basis, V, c_src, targets[i])
            if T < m_num:
                g, Tb, Fint, Tint, ivol = choose_g(basis, V, c_src, targets[i], m_num, m_dec, None, None, False)
                feeds[i] = dict(g=g, T=Tb, ivol=ivol, onward_dec=onward_dec, onward_num=onward_num)
                onward_dec, onward_num = ivol['Td'], ivol['T']
            else:
                feeds[i] = dict(g=None, T=T, onward_dec=onward_dec, onward_num=onward_num)
                onward_dec, onward_num = round_sig(Decimal(T), 3), T
        src_label, c_src_exact, steps = 'S', c_S, 0
        for i, fd in enumerate(feeds):
            if fd['g']:
                n_int += 1
                iv = add_vessel(f'I{n_int}', 'intermediate', src_label, steps + 1, fd['ivol'], c_src_exact, fd['g'])
                src_label, c_src_exact, steps = iv['label'], iv['cExact'], steps + 1
            vol = build_available(stated_dec, stated_num, fd['T'], fd['onward_dec'], fd['onward_num'])
            pv = add_vessel(f'P{i+1}', 'point', src_label, steps + 1, vol, c_src_exact)
            src_label, c_src_exact, steps = pv['label'], pv['cExact'], steps + 1
        return vessels

    # serial forward, bases final and diluent
    src_label, c_src_exact, c_src_nom, steps, src_total = 'S', c_S, c_S, 0, None
    for i, c_b in enumerate(targets):
        T = transfer(basis, stated_num, c_src_nom, c_b)
        if T < m_num:
            g, Tb, Fint, Tint, ivol = choose_g(basis, stated_num, c_src_nom, c_b, m_num, m_dec, None, src_total, True)
            n_int += 1
            iv = add_vessel(f'I{n_int}', 'intermediate', src_label, steps + 1, ivol, c_src_exact, g)
            src_label, c_src_exact, c_src_nom, steps = iv['label'], iv['cExact'], c_src_nom / g, steps + 1
            T = Tb
        vol = build_final(stated_dec, stated_num, T) if basis == 'final' else build_diluent(stated_dec, stated_num, T)
        pv = add_vessel(f'P{i+1}', 'point', src_label, steps + 1, vol, c_src_exact)
        src_label, c_src_exact, c_src_nom, steps, src_total = pv['label'], pv['cExact'], c_b, steps + 1, vol['total']
    return vessels


def main(path):
    ref = json.load(open(path))
    failures = 0
    compared = 0
    # The result of the comparison is the observed difference; 6k ULP is the pass
    # criterion, not the finding (owner's item 2e, 21 September 2026).
    worst_ulp = 0.0
    worst_where = 'none'
    displayed_mismatches = 0
    unit_mismatches = 0
    for name, case in ref.items():
        mine = {v['label']: v for v in plan(case['input'])}
        tol = case['ulpPerStep']
        for rv in case['vessels']:
            compared += 1
            mv = mine.get(rv['label'])
            if mv is None or mv['source'] != rv['source'] or mv['steps'] != rv['steps'] or (mv['g'] or None) != (rv['g'] or None):
                failures += 1
                print(f'{name} {rv["label"]}: structure differs: {mv and (mv["source"], mv["steps"], mv["g"])} vs {(rv["source"], rv["steps"], rv["g"])}')
                continue
            # B1 (Agent Nadira, SS7 build review): the labels are compared, not only
            # the numbers. Both implementations emitted the same number when the
            # label was wrong, which is why 0-ULP agreement could not see it.
            # The display unit is the target's unit for concentrations and the
            # stated volume's unit for volumes; value must be the number in that
            # unit, and cExact the internal-unit number.
            expected_conc_unit = case['input']['target']['unit']
            expected_vol_unit = case['input']['volume']['unit']
            if rv.get('cUnit') != expected_conc_unit:
                failures += 1
                unit_mismatches += 1
                print(f'{name} {rv["label"]}: concentration labelled {rv.get("cUnit")}, expected {expected_conc_unit}')
            if rv.get('volumeUnit') != expected_vol_unit:
                failures += 1
                unit_mismatches += 1
                print(f'{name} {rv["label"]}: volume labelled {rv.get("volumeUnit")}, expected {expected_vol_unit}')
            # value x unit is the same quantity as the internal number
            scale = CONC_SCALE[expected_conc_unit]
            expected_display_value = rv['cExact'] / scale if scale != 1 else rv['cExact']
            got = rv.get('cDisplayValue')
            if got is None or abs(got - expected_display_value) > abs(expected_display_value) * 1e-12:
                failures += 1
                unit_mismatches += 1
                print(f'{name} {rv["label"]}: {got} {rv.get("cUnit")} is not {expected_display_value} {expected_conc_unit}')
            # unrounded values within the round-trip tolerance (ULP of the reference value)
            for key in ('T', 'V', 'cExact'):
                a, b = mv[key], rv[key]
                d = abs(a - b) / ulp(b) if b else abs(a - b)
                if d > worst_ulp:
                    worst_ulp, worst_where = d, f'{name} {rv["label"]} {key} at {rv["steps"]} step(s)'
                if d > tol * rv['steps']:
                    failures += 1
                    print(f'{name} {rv["label"]} {key}: {a} vs {b} = {d:.2f} ULP > {tol * rv["steps"]}')
            # displayed values exactly
            for key, ref_key in (('Td', 'Td'), ('Dd', 'Dd'), ('total', 'total')):
                if Decimal(fmt(mv[key])) != Decimal(rv[ref_key]):
                    displayed_mismatches += 1
                    failures += 1
                    print(f'{name} {rv["label"]} {key}: displayed {fmt(mv[key])} vs {rv[ref_key]}')
            if rv['residual'] is not None:
                if mv['residual'] is None or Decimal(rv['residual']) != mv['residual']:
                    failures += 1
                    print(f'{name} {rv["label"]} residual: {mv["residual"]} vs {rv["residual"]}')
    print(f'compared {compared} vessels in {len(ref)} cases; failures: {failures}')
    print(f'observed maximum difference on the unrounded values: {worst_ulp:.4g} ULP ({worst_where})')
    print(f'displayed values differing: {displayed_mismatches} of {compared * 3}')
    print(f'unit-label and value-in-unit mismatches: {unit_mismatches} of {compared * 3}')
    print(f'pass criterion: within {tol}k ULP at a point k steps from stock, and every displayed value equal')
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'verify/reference-set.json')
