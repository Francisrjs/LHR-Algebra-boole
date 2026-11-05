"""Safe rational parser and reusable continuous SISO calculation core."""

import ast

import re

import warnings

from functools import lru_cache

import numpy as np

import control as ct





def parse_tf(source, parameters=None, gain_placeholder=False):

    parameters = parameters or {}

    if isinstance(source, dict):

        return checked(ct.tf(source['num'], source['den']))

    text=str(source).replace('²','^2').replace('³','^3').replace('−','-').replace('·','*')

    def coefficients(match):

        values=ast.literal_eval(match.group(0))

        if not isinstance(values,list) or not values or not all(type(x) in (int,float) for x in values):raise ValueError('Coeficientes inválidos.')

        return '('+'+'.join(f'({float(v)})*s^{len(values)-i-1}' for i,v in enumerate(values))+')'

    text=re.sub(r'\[[^\[\]]*\]',coefficients,text)

    if len(text)>2000: raise ValueError('Expresión demasiado larga.')

    tokens=re.findall(r'(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_]\w*|\*\*|[+*/()^\-]',text)

    if ''.join(tokens) != re.sub(r'\s+','',text): raise ValueError('La expresión contiene caracteres no admitidos.')

    out=[]

    for token in tokens:

        if out and (out[-1]==')' or re.match(r'[\w.]',out[-1])) and (token=='(' or re.match(r'[\w.]',token)):

            out.append('*')

        out.append(token)

    normalized = ''.join(out).replace('^','**')
    try:
        tree=ast.parse(normalized,mode='eval')
    except SyntaxError as exc:
        balance = normalized.count('(') - normalized.count(')')
        if balance > 0:
            raise ValueError(f"Falta cerrar {balance} paréntesis con ')'. Revisá el denominador y los productos.") from exc
        if balance < 0:
            raise ValueError("Hay paréntesis de cierre ')' de más.") from exc
        raise ValueError("Expresión incompleta o mal formada. Revisá operadores y paréntesis.") from exc
    if gain_placeholder and re.search(r'\bK\b', normalized):
        message = "Usá K una sola vez como factor multiplicativo externo: K*G(s) o G(s)*K."
        if sum(isinstance(node, ast.Name) and node.id == 'K' for node in ast.walk(tree)) != 1:
            raise ValueError(message)
        def contains_gain(node):
            return any(isinstance(child, ast.Name) and child.id == 'K' for child in ast.walk(node))
        def remove_gain(node):
            if not contains_gain(node): return node
            if isinstance(node, ast.Name): return ast.Constant(value=1)
            if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
                node.operand = remove_gain(node.operand); return node
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mult):
                node.left = remove_gain(node.left); node.right = remove_gain(node.right); return node
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div) and not contains_gain(node.right):
                node.left = remove_gain(node.left); return node
            raise ValueError(message)
        tree.body = remove_gain(tree.body)

    def visit(n,depth=0):

        if depth>40: raise ValueError('Expresión demasiado compleja.')

        if isinstance(n,ast.Constant) and type(n.value) in (int,float): return float(n.value)

        if isinstance(n,ast.Name):

            if n.id=='s': return ct.tf([1,0],[1])

            if n.id=='K': raise ValueError('K se modifica con el control de ganancia, fuera de la expresión.')

            if n.id in parameters: return float(parameters[n.id])

            raise ValueError('Parámetro desconocido: '+n.id)

        if isinstance(n,ast.UnaryOp) and isinstance(n.op,(ast.UAdd,ast.USub)):

            v=visit(n.operand,depth+1); return -v if isinstance(n.op,ast.USub) else v

        if isinstance(n,ast.BinOp):

            a,b=visit(n.left,depth+1),visit(n.right,depth+1)

            def bounded(v):return checked(v) if isinstance(v,ct.TransferFunction) else v

            if isinstance(n.op,ast.Add): return bounded(a+b)

            if isinstance(n.op,ast.Sub): return bounded(a-b)

            if isinstance(n.op,ast.Mult): return bounded(a*b)

            if isinstance(n.op,ast.Div): return bounded(a/b)

            if isinstance(n.op,ast.Pow) and isinstance(b,(int,float)) and b==int(b) and abs(b)<=32: return bounded(a**int(b))

        raise ValueError('Usá números, parámetros, s, +, -, *, / y potencias enteras hasta 32.')

    value=visit(tree.body)

    return checked(value if isinstance(value,ct.TransferFunction) else ct.tf([value],[1]))





def checked(tf):

    n,d=tf.num[0][0],tf.den[0][0]

    if not np.all(np.isfinite(n)) or not np.all(np.isfinite(d)) or not np.any(d): raise ValueError('Coeficientes no finitos o denominador nulo.')

    if max(len(n),len(d))>65: raise ValueError('El modelo supera el límite de seguridad de orden 64.')

    return tf





def roots(values): return np.roots(np.trim_zeros(values,'f')) if np.any(values) else np.array([],complex)

def pairs(values): return [dict(re=float(z.real),im=float(z.imag)) for z in values]

def clean(values): return [float(v) if np.isfinite(v) else None for v in values]

def expression(tf):

    def poly(a):

        degree=len(a)-1; terms=[]

        for i,c in enumerate(a):

            if c==0: continue

            p=degree-i; terms.append(f'({float(c):.15g})'+(f'*s^{p}' if p>1 else '*s' if p else ''))

        return '+'.join(terms) or '0'

    return '('+poly(tf.num[0][0])+')/('+poly(tf.den[0][0])+')'

def summary(tf):

    if tf is None:return None

    return dict(num=tf.num[0][0].tolist(),den=tf.den[0][0].tolist(),poles=pairs(roots(tf.den[0][0])),zeros=pairs(roots(tf.num[0][0])),expression=expression(tf))



def stability(p):

    if np.any(p.real>1e-7):return 'unstable'

    boundary=p[np.abs(p.real)<=1e-7]

    if any(sum(abs(z-boundary)<1e-5)>1 for z in boundary):return 'unstable'

    return 'marginal' if len(boundary) else 'stable'





def asymptotic(tf,w):

    num,den=tf.num[0][0],tf.den[0][0]

    if not np.any(num):return np.full(len(w),-np.inf),np.full(len(w),np.nan),[]

    gain=float(num[0]/den[0]); mag=np.full(len(w),20*np.log10(abs(gain))); phase=np.full(len(w),180. if gain<0 else 0.)

    breaks=[]; phase_ok=True

    for coeff,sign in [(num,1),(den,-1)]:

        rr=list(roots(coeff)); consumed=set()

        for i,r in enumerate(rr):

            if i in consumed:continue

            if abs(r)<1e-10:

                mag+=sign*20*np.log10(w);phase+=sign*90;continue

            f=abs(r); breaks.append(float(f))

            if abs(r.imag)<1e-8:

                mag+=sign*20*np.log10(np.maximum(w,f))

                direction=1 if r.real<0 else -1

                # factor (s-r) contributes DC sign when r is positive

                if r.real>0:phase+=sign*180

                phase+=sign*direction*90*np.clip((np.log10(w/f)+1)/2,0,1)

            else:

                j=min((j for j in range(len(rr)) if j!=i and j not in consumed),key=lambda j:abs(rr[j]-r.conjugate()),default=None)

                if j is not None:consumed.add(j)

                mag+=sign*40*np.log10(np.maximum(w,f))

                if abs(r.real)<1e-8: phase_ok=False

                phase+=sign*(1 if r.real<0 else -1)*180*np.clip((np.log10(w/f)+1)/2,0,1)

    if not phase_ok:phase[:]=np.nan

    return mag,phase,sorted(set(breaks))





def margins(tf,k):

    if k==0:return dict(gm=None,pm=None,wgc=None,wpc=None,gmState='undefined',pmState='undefined',all=[])

    with warnings.catch_warnings():

        warnings.simplefilter('ignore'); gm,pm,_,wpc,wgc,_=ct.stability_margins(tf,returnall=True)

    # MATLAB reports a gain crossover at DC when |L(0)| == 1. The
    # polynomial crossover solver in python-control omits this static point.
    # Include it explicitly so the phase margin at zero frequency is retained.
    num,den=tf.num[0][0],tf.den[0][0]
    if den[-1] != 0:
        dc=complex(num[-1]/den[-1])
        if np.isfinite(dc.real) and np.isfinite(dc.imag) and np.isclose(abs(dc),1.,rtol=1e-10,atol=1e-12):
            dc_pm=float(np.mod(180.+np.angle(dc,deg=True),360.))
            if np.isclose(dc_pm,360.,atol=1e-10):dc_pm=0.
            pm=np.append(pm,dc_pm)
            wgc=np.append(wgc,0.)

    finite=lambda x:float(x) if np.isfinite(x) else None

    gi=int(np.argmin(abs(np.log(gm)))) if len(gm) else None

    pi=int(np.argmin(abs(pm))) if len(pm) else None

    return dict(gm=finite(20*np.log10(gm[gi])) if gi is not None else None,pm=finite(pm[pi]) if pi is not None else None,wgc=finite(wgc[pi]) if pi is not None else None,wpc=finite(wpc[gi]) if gi is not None else None,gmState='finite' if gi is not None and np.isfinite(gm[gi]) else 'infinite',pmState='finite' if pi is not None else 'undefined',all=[dict(kind='gain',omega=float(w),margin=finite(20*np.log10(m))) for w,m in zip(wpc,gm)]+[dict(kind='phase',omega=float(w),margin=finite(m)) for w,m in zip(wgc,pm)])





@lru_cache(maxsize=32)

def locus_base(num,den):

    tf=ct.tf(list(num),list(den)); p=roots(den);z=roots(num);count=len(p)-len(z)

    center=float((sum(p).real-sum(z).real)/count) if count>0 else None

    angles=[(180*(2*i+(1 if num[0]/den[0]>0 else 0))/count) for i in range(count)] if count>0 else []

    derivative=np.polysub(np.polymul(num,np.polyder(den)),np.polymul(den,np.polyder(num)))

    breaks=[]

    for r in roots(derivative):

        if abs(r.imag)<1e-7 and abs(np.polyval(num,r))>1e-12:

            k=-np.polyval(den,r)/np.polyval(num,r)

            if k.real>=0 and abs(k.imag)<1e-7:breaks.append(dict(re=float(r.real),im=0.,k=float(k.real)))

    # D(jw)/N(jw) real: imaginary part of D(jw) N(-jw) vanishes.

    poly=np.polymul(np.asarray(den,dtype=complex)*(1j**np.arange(len(den)-1,-1,-1)),np.asarray(num,dtype=complex)*((-1j)**np.arange(len(num)-1,-1,-1)))

    crossings=[]

    for w in roots(np.imag(poly)):

        if abs(w.imag)<1e-6 and w.real>1e-8:

            val=-np.polyval(den,1j*w.real)/np.polyval(num,1j*w.real)

            if val.real>0 and abs(val.imag)<1e-5:crossings.append(dict(omega=float(w.real),k=float(val.real)))

    branches=[];locus_error=None

    if len(num)>len(den):locus_error='El LGR requiere una transferencia base propia; Bode continúa disponible.'

    if np.any(num) and len(num)<=len(den):

        try:

            with warnings.catch_warnings():

                warnings.simplefilter('ignore'); result=ct.root_locus_map(tf)

            branches=[dict(x=clean(col.real),y=clean(col.imag)) for col in result.loci.T]

        except (ArithmeticError, ValueError, IndexError, np.linalg.LinAlgError) as exc:

            locus_error='No se pudo calcular el LGR: '+str(exc)

    real_roots=sorted([r.real for r in np.concatenate((p,z)) if abs(r.imag)<1e-7])

    bounds=[-np.inf]+real_roots+[np.inf]; segments=[]

    gain=np.sign(num[0]/den[0])

    for left,right in zip(bounds,bounds[1:]):

        probe=(left+right)/2 if np.isfinite(left+right) else right-1 if np.isneginf(left) else left+1

        if ((sum(r>probe for r in real_roots)%2)==(1 if gain>0 else 0)):segments.append(dict(min=float(left) if np.isfinite(left) else None,max=float(right) if np.isfinite(right) else None))

    span=max(1.,max((abs(r) for r in np.concatenate((p,z))),default=1.))

    xmin=min(-span*2.5,min((r.real for r in p),default=0)-span*.5)

    xmax=max(span*.8,max((r.real for r in p),default=0)+span*.5)

    yrange=[-span*1.8,span*1.8]

    asy=[dict(x=[center,center+span*4*np.cos(np.deg2rad(a))],y=[0.,span*4*np.sin(np.deg2rad(a))]) for a in angles]

    for segment in segments:

        if segment['min'] is None:segment['min']=float(xmin)

        if segment['max'] is None:segment['max']=float(xmax)

    result=dict(range=dict(x=[float(xmin),float(xmax)],y=yrange),asymptotes=asy,branches=branches,openPoles=pairs(p),zeros=pairs(z),centroid=center,angles=angles,breakaways=breaks,crossings=crossings,segments=segments)

    if locus_error:result['error']=locus_error

    return result





def time_response(tf,options):

    if tf is None:return dict(error='Para calcular C/R ingresá G y H o aceptá explícitamente H=1.')

    n,d=tf.num[0][0],tf.den[0][0]

    if len(n)>len(d):return dict(error='La respuesta temporal requiere una transferencia propia.')

    duration=float(options.get('duration',10));amplitude=float(options.get('amplitude',1));signal=options.get('signal','step')

    if not np.isfinite(duration) or not 0<duration<=10000 or not np.isfinite(amplitude):raise ValueError('Duración o amplitud inválida.')

    poles=roots(d)

    frequency=max((abs(p.imag) for p in poles),default=0.)

    rate=max((abs(p.real) for p in poles),default=0.)

    # Resolve oscillations and the fastest exponential; do not silently alias.

    samples=max(1001,int(np.ceil(duration*frequency*32/(2*np.pi)))+1,int(np.ceil(duration*rate*16))+1)

    if samples>50000:return dict(error='La duración solicitada necesita más de 50.000 muestras para resolver la dinámica. Reducí la duración para obtener una curva precisa.')

    t=np.linspace(0,duration,samples);u=np.ones(len(t))*amplitude;weight=0.

    with warnings.catch_warnings():

        warnings.simplefilter('ignore')

        if signal=='impulse':

            weight=float(n[0]/d[0])*amplitude if len(n)==len(d) else 0.

            regular=tf-weight/amplitude if amplitude!=0 else tf

            y=ct.impulse_response(regular,t).outputs*amplitude;u=np.zeros(len(t))

        else:

            if signal=='ramp':u=t*amplitude

            elif signal!='step':raise ValueError('Señal desconocida.')

            y=ct.forced_response(tf,t,u).outputs

    if not np.all(np.isfinite(y)):return dict(error='La simulación diverge o supera el rango numérico; reducí la duración.')
    metrics={}

    if signal=='step' and np.any(n) and stability(roots(d))=='stable':

        try:

            info=ct.step_info(tf*amplitude,T=t)

            metrics={name:(float(value) if np.isfinite(value) else None) for name,value in info.items()}

        except Exception:pass

    return dict(time=t.tolist(),input=clean(u),output=clean(y),metrics=metrics,impulseWeight=weight)





def analyze(data):

    pars=data.get('parameters') or {};k=float(data.get('k',1))

    if not np.isfinite(k) or k<0:raise ValueError('K debe ser un número finito no negativo.')

    direct=data.get('mode','separate')=='direct'

    g=None if direct else parse_tf(data.get('g','1/(s+1)'),pars,gain_placeholder=True)

    h=None if direct else parse_tf(data.get('h','1'),pars)

    base=parse_tf(data.get('l','1/(s+1)'),pars,gain_placeholder=True) if direct else g*h

    loop=base*k

    if direct and data.get('assumeH1'):g=base;h=ct.tf([1],[1])

    feedback_error=None
    try:t=ct.feedback(g*k,h) if g is not None else None
    except (ArithmeticError, ValueError, np.linalg.LinAlgError) as exc:
        t=None;feedback_error='La transferencia C/R no está definida para esta realimentación: '+str(exc)

    checked(loop)

    characteristic=np.polyadd(base.den[0][0],k*base.num[0][0]); closed=roots(characteristic)

    selected={'g':g,'h':h,'l':loop,'t':t}.get(data.get('target','l'))

    if selected is None:selected=loop

    freq=data.get('frequency') or {}; rr=np.concatenate((roots(selected.den[0][0]),roots(selected.num[0][0])))

    scales=np.abs(rr);scales=scales[scales>1e-8]

    notes=[]
    if feedback_error:notes.append(feedback_error)

    try:lm=margins(loop,k)

    except (ArithmeticError, ValueError, IndexError, np.linalg.LinAlgError) as exc:

        lm=dict(gm=None,pm=None,wgc=None,wpc=None,gmState='undefined',pmState='undefined',all=[],error='No se pudieron calcular los márgenes: '+str(exc))

        notes.append(lm['error'])

    if freq.get('auto',True):

        scales=np.concatenate((scales,[m['omega'] for m in lm['all'] if m['omega']>0]))

    if freq.get('auto',True):lo=min(scales)/100 if len(scales) else .01;hi=max(scales)*100 if len(scales) else 100

    else:lo=float(freq.get('min',.01));hi=float(freq.get('max',1000))

    if not np.isfinite(lo+hi) or not 0<lo<hi or hi/lo>1e16:raise ValueError('El rango de frecuencia debe ser positivo y creciente.')

    w=np.geomspace(lo,hi,900)

    # Include axis singularities explicitly so renderer breaks traces.

    singular=[abs(r.imag) for r in rr if abs(r.real)<1e-9 and r.imag>0 and lo<=abs(r.imag)<=hi]

    w=np.unique(np.concatenate((w,singular)))

    with np.errstate(all='ignore'):

        response=np.polyval(selected.num[0][0],1j*w)/np.polyval(selected.den[0][0],1j*w)

        mag=20*np.log10(abs(response));phase=np.angle(response)*180/np.pi

        bad=~np.isfinite(mag)

        for s in singular:bad|=np.isclose(w,s,rtol=1e-12,atol=0)

        mag[bad]=np.nan;phase[bad]=np.nan

        good=np.flatnonzero(~bad)

        for segment in np.split(good,np.where(np.diff(good)>1)[0]+1):

            if len(segment):phase[segment]=np.unwrap(phase[segment]*np.pi/180)*180/np.pi

        if not np.any(selected.num[0][0]):phase[:]=np.nan

        am,ap,breaks=asymptotic(selected,w)

    from backend.bode_factors import decompose
    try: decomposition=decompose(selected,w)
    except (ValueError,ArithmeticError) as exc: decomposition={'warning':str(exc),'factors':[],'segments':[]}

    locus=dict(locus_base(tuple(base.num[0][0]),tuple(base.den[0][0])));locus['closedPoles']=pairs(closed)

    if locus.get('error'):notes.append(locus['error'])

    temporal_model={'g':g,'h':h,'l':loop,'t':t}.get(data.get('temporalTarget','t'))

    try:temporal=time_response(temporal_model,data.get('temporal') or {})

    except (ArithmeticError, ValueError, IndexError, np.linalg.LinAlgError) as exc:temporal=dict(error='No se pudo simular la respuesta temporal: '+str(exc))

    if feedback_error:temporal=dict(error=feedback_error)
    if direct and t is None:notes.append('GH no determina la salida C/R original. Podés declarar explícitamente H=1.')

    if np.any(np.isnan(ap)) and k>0 and np.any(selected.num[0][0]):notes.append('Aproximación de fase no disponible para factores sobre el eje imaginario.')

    for pole in roots(base.den[0][0]):

        if any(abs(pole-zero)<1e-6 for zero in roots(base.num[0][0])):notes.append('Hay una cancelación polo-cero: se conservan los factores y los modos característicos.');break

    return dict(revision=data.get('revision',0),models=dict(g=summary(g),h=summary(h),l=summary(loop),l0=summary(base),t=summary(t)),bode=dict(decomposition=decomposition,omega=w.tolist(),magnitude=clean(mag),phase=clean(phase),asymMagnitude=clean(am),asymPhase=clean(ap),breaks=breaks,margins=lm),locus=locus,temporal=temporal,stability=stability(closed) if np.any(characteristic) else 'undefined',selectedStability=stability(roots(selected.den[0][0])),baseStability=stability(roots(base.den[0][0])),warnings=notes)





def algebra(data):

    fs=[parse_tf(f,data.get('parameters')) for f in data.get('functions',[])]

    if len(fs)<2:raise ValueError('Ingresá al menos dos funciones.')

    op=data.get('operation','series');result=fs[0]

    for f in fs[1:]:

        if op=='series':result=result*f

        elif op=='parallel':result=result+f

        elif op=='subtract':result=result-f

        elif op=='feedback':result=ct.feedback(result,f)

        else:raise ValueError('Operación desconocida.')

    return dict(result=summary(checked(result)))





def edit_roots(data):

    tf=parse_tf(data['expression'],data.get('parameters'));kind=data.get('kind','pole');coeff=tf.den[0][0] if kind=='pole' else tf.num[0][0]

    rr=roots(coeff);i=int(data['index'])

    if i<0 or i>=len(rr):raise ValueError('Raíz inexistente.')

    old=rr[i];new=complex(float(data['re']),float(data.get('im',0)))

    if not np.isfinite(new):raise ValueError('Coordenadas no finitas.')

    if abs(old.imag)<1e-8:new=complex(new.real,0)

    else:

        j=int(np.argmin(abs(rr-old.conjugate())));rr[j]=new.conjugate()

    rr[i]=new;rebuilt=np.real_if_close(np.poly(rr)*coeff[0],tol=1000)

    if np.iscomplexobj(rebuilt):raise ValueError('No se preservaron los conjugados.')

    result=ct.tf(tf.num[0][0] if kind=='pole' else rebuilt,rebuilt if kind=='pole' else tf.den[0][0])

    return dict(result=summary(result))

