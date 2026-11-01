"""Verified normalized factors and independent hand-drawing contributions."""
import numpy as np
from backend.core import roots, clean


def decompose(tf, w):
    n, d = tf.num[0][0], tf.den[0][0]
    if not np.any(n):
        return dict(latex='0', gain=0, gainDb=None, gainPhase=None, gainMagnitude=clean(np.full(len(w), np.nan)), gainPhases=clean(np.full(len(w), np.nan)), factors=[], segments=[], reconstructionError=0, warning='Ganancia cero: magnitud −∞ dB y fase indefinida; no hay aportes finitos para sumar.')
    gain = float(n[0]/d[0])
    gain_phase = 180. if gain < 0 else 0.
    factors, products = [], [[], []]
    reconstruction_error = 0.
    for side, coeff in enumerate([n, d]):
        sign = 1 if side == 0 else -1
        pending = list(roots(coeff))
        reconstructed = np.array([1.])
        while pending:
            r = pending.pop(0)
            same = [z for z in pending if abs(z-r) <= 1e-4*max(abs(r), 1e-8)]
            for z in same:
                pending.remove(z)
            m = 1+len(same)
            r = sum([r]+same)/m
            origin = abs(r) < 1e-12
            pair = abs(r.imag) > 1e-6*max(1, abs(r))
            if pair:
                partners = sorted(pending, key=lambda z: abs(z-r.conjugate()))[:m]
                if len(partners) != m or any(abs(z-r.conjugate()) > 1e-4*max(abs(r), 1e-8) for z in partners):
                    raise ValueError('No se pudo agrupar el par conjugado con confianza.')
                for z in partners:
                    pending.remove(z)
            elif not origin:
                r = complex(r.real, 0)
            f = 0. if origin else float(abs(r))
            order = 2 if pair else 1
            constant = 1. if origin else f*f if pair else -float(r.real)
            gain *= constant**(sign*m)
            if not origin and not pair and r.real > 0:
                gain_phase += sign*m*180
            root_poly = [1., -2*r.real, f*f] if pair else [1., 0. if origin else -r.real]
            for _ in range(m):
                reconstructed = np.polymul(reconstructed, root_poly)
            frequency = f'{f:.8g}'
            if origin:
                base, latex = 's', 's'
            elif pair:
                damping = -2*r.real/f
                base = f'(1+({damping:.8g})*s/{frequency}+(s/{frequency})^2)'
                latex = rf'\left(1+({damping:.8g})\frac{{s}}{{{frequency}}}+\left(\frac{{s}}{{{frequency}}}\right)^2\right)'
            else:
                direction = '+' if r.real < 0 else '-'
                base = f'(1{direction}s/{frequency})'
                latex = rf'\left(1{direction}\frac{{s}}{{{frequency}}}\right)'
            label = base+(f'^{m}' if m > 1 else '')
            latex += f'^{{{m}}}' if m > 1 else ''
            products[side].append(latex)
            mag = sign*m*order*20*np.log10(w if origin else np.maximum(w/f, 1))
            phase_final = sign*m*90. if origin else sign*m*order*90*(1 if r.real < 0 else -1)
            phase = np.full(len(w), phase_final) if origin else phase_final*np.clip((np.log10(w/f)+1)/2, 0, 1)
            phase_available = not (pair and abs(r.real) < 1e-8)
            if not phase_available:
                phase[:] = np.nan
            marker = marker_phase = None
            if f:
                z = 1j*f
                numerator, denominator = np.polyval(n, z), np.polyval(d, z)
                # Relative residual identifies zeros/poles on the imaginary axis.
                ns = np.polyval(np.abs(n), f)
                ds = np.polyval(np.abs(d), f)
                if abs(denominator) > 1e-10*max(ds, 1e-300) and abs(numerator) > 1e-10*max(ns, 1e-300):
                    value = numerator/denominator
                    if np.isfinite(value):
                        marker = float(20*np.log10(abs(value)))
                        unwrapped = np.unwrap(np.angle(np.polyval(n, 1j*w)/np.polyval(d, 1j*w)))*180/np.pi
                        principal = float(np.angle(value)*180/np.pi)
                        reference = float(np.interp(np.log10(f), np.log10(w), unwrapped))
                        marker_phase = principal+360*round((reference-principal)/360) if np.isfinite(reference) else principal
            factors.append(dict(id=f'f{len(factors)}', label=label, latex=latex, kind='zero' if sign > 0 else 'pole', multiplicity=m, frequency=f, order=order, slope=sign*m*order*20, phaseFinal=phase_final if phase_available else None, phaseAvailable=phase_available, transition=None if origin else [f/10, f*10], magnitude=clean(mag), phase=clean(phase), marker=marker, markerPhase=marker_phase, root=dict(re=float(r.real), im=float(r.imag))))
        original = coeff/coeff[0]
        error = float(np.max(np.abs(reconstructed-original)/np.maximum(1, np.abs(original))))
        reconstruction_error = max(reconstruction_error, error)
        if error > 1e-6:
            raise ValueError('La factorización no reconstruye los coeficientes con tolerancia 1e-6; se conserva la curva exacta.')
    if not np.isfinite(gain) or gain == 0:
        raise ValueError('Ganancia normalizada fuera del rango numérico; se conserva la curva exacta.')
    breaks = sorted(set(x['frequency'] for x in factors if x['frequency']))
    segments = [dict(start=lo, end=hi, slope=sum(x['slope'] for x in factors if x['frequency'] <= lo)) for lo, hi in zip([0]+breaks, breaks+[None])]
    gain_db = float(20*np.log10(abs(gain)))
    numerator = ' \\cdot '.join(products[0]) or '1'
    denominator = ' \\cdot '.join(products[1]) or '1'
    def number_latex(value):
        text = f'{value:.8g}'
        if 'e' in text:
            mantissa, exponent = text.split('e')
            return rf'{mantissa}\times 10^{{{int(exponent)}}}'
        return text
    latex = rf'{number_latex(gain)}\,\frac{{{numerator}}}{{{denominator}}}'
    warning = 'Factores conservados sin cancelaciones. K ya está incluida si la transferencia seleccionada la contiene.'
    if any(not f['phaseAvailable'] for f in factors):
        warning += ' Fase asintótica no disponible para pares sobre el eje imaginario.'
    return dict(latex=latex, gain=gain, gainDb=gain_db, gainPhase=gain_phase, gainMagnitude=[gain_db]*len(w), gainPhases=[gain_phase]*len(w), factors=factors, segments=segments, reconstructionError=reconstruction_error, warning=warning)
