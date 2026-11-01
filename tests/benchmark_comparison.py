import json,time
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.integrate import solve_ivp
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from backend.core import analyze
cases=[('Escalón parcial','1/((s+1)*(s+2))','1',1),('H no unitaria','2/(s+1)','3/(s+2)',1),('Segundo orden','25/(s^2+2*s+25)','1',1),('Cerca de K crítico','1/(s*(s+1)*(s+3))','1',11.9)]
fig,axes=plt.subplots(2,2,figsize=(12,8)); rows=[]
for ax,(name,g,h,k) in zip(axes.flat,cases):
 a=analyze(dict(g=g,h=h,k=k,temporal=dict(signal='step',duration=20,amplitude=1)))
 t=np.array(a['temporal']['time']);y=np.array(a['temporal']['output']);m=a['models']['t'];A,B,C,D=signal.tf2ss(m['num'],m['den'])
 sol=solve_ivp(lambda t,x:A@x+B[:,0],(0,20),np.zeros(A.shape[0]),t_eval=t,rtol=1e-10,atol=1e-12)
 ref=(C@sol.y)[0]+D[0,0];err=float(np.max(abs(y-ref)))
 ts=[]
 for _ in range(20):
  start=time.perf_counter();analyze(dict(g=g,h=h,k=k));ts.append((time.perf_counter()-start)*1000)
 b=a['bode'];w=np.array(b['omega']);l=a['models']['l'];z=np.polyval(l['num'],1j*w)/np.polyval(l['den'],1j*w)
 db=20*np.log10(abs(z));de=float(np.nanmax(abs(db-np.array(b['magnitude'],dtype=float))))
 row=dict(case=name,max_step_error=err,max_bode_error_db=de,compute_median_ms=float(np.median(ts)),compute_max_ms=max(ts));rows.append(row)
 ax.plot(t,ref,color='#ec8f23',lw=2.5,label='Referencia solve_ivp');ax.plot(t,y,'--',color='#126baf',label='ControlLab');ax.set_title(f'{name} | error máximo {err:.2e}');ax.set_xlabel('Tiempo (s)');ax.set_ylabel('Salida');ax.grid(alpha=.25);ax.legend(fontsize=8)
fig.suptitle('ControlLab frente a integración independiente de las ecuaciones de estado');fig.tight_layout();out=Path('e2e/artifacts');fig.savefig(out/'comparacion-numerica.png',dpi=150);(out/'comparacion-numerica.json').write_text(json.dumps(rows,indent=2),encoding='utf8');print(json.dumps(rows,indent=2))
