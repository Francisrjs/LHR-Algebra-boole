import numpy as np
import pytest
from backend.core import parse_tf,asymptotic
from backend.bode_factors import decompose
@pytest.mark.parametrize('source',['10*s*(s+10)/((s+100)^2*(s+1000))','1/s^3','(s+1)^2/(s+10)','-2/(s+1)','1/(s^2+2*s+5)'])
def test_contributions_sum(source):
 w=np.geomspace(.001,1e5,100)
 tf=parse_tf(source);d=decompose(tf,w);mag,phase,_=asymptotic(tf,w)
 np.testing.assert_allclose(d['gainDb']+np.sum([f['magnitude'] for f in d['factors']],axis=0),mag,atol=1e-5)
 np.testing.assert_allclose(d['gainPhase']+np.sum([f['phase'] for f in d['factors']],axis=0),phase,atol=1e-5)
@pytest.mark.parametrize('source',['2','-2/(s-1)','1/(s-1)^2','(s-2)/(s+1)','(s+1)/((s+1)*(s+2))','1/(s+100)^3'])
def test_reconstruction_and_special_factors(source):
 w=np.geomspace(.001,1e5,100)
 d=decompose(parse_tf(source),w)
 assert d['reconstructionError']<=1e-6
 assert '\\frac' in d['latex']
 mag,phase,_=asymptotic(parse_tf(source),w)
 total=np.full(len(w),d['gainDb']);angles=np.full(len(w),d['gainPhase'])
 for f in d['factors']:total+=f['magnitude'];angles+=f['phase']
 np.testing.assert_allclose(total,mag,atol=1e-4)
 np.testing.assert_allclose(angles,phase,atol=1e-4)

def test_origin_and_zero():
 w=np.geomspace(.01,100,100)
 d=decompose(parse_tf('1/s^3'),w)
 assert d['factors'][0]['multiplicity']==3 and d['factors'][0]['slope']==-60
 assert d['factors'][0]['transition'] is None
 zero=decompose(parse_tf('0'),w)
 assert zero['gainDb'] is None and zero['factors']==[]

def test_imaginary_axis_singularity():
 w=np.geomspace(.01,100,100)
 d=decompose(parse_tf('1/(s^2+1)'),w)
 assert d['factors'][0]['marker'] is None
 assert not d['factors'][0]['phaseAvailable']

def test_cancellations_remain():
 d=decompose(parse_tf('(s+1)/(s+1)'),np.geomspace(.01,100,100))
 assert len(d['factors'])==2
 assert {f['kind'] for f in d['factors']}=={'pole','zero'}
def test_selected_transfer_gain_applied_once():
 from backend.core import analyze
 a=analyze({'mode':'direct','l':'K*(s+1)/(s+10)','k':3})
 b=analyze({'mode':'direct','l':'(s+1)/(s+10)','k':3})
 assert a['bode']['decomposition']['gain']==pytest.approx(.3)
 assert a['bode']['decomposition']['gain']==b['bode']['decomposition']['gain']

def test_project_defaults_and_persistence():
 from backend.schemas import ProjectInput
 import json
 from pathlib import Path
 p=json.loads(Path('docs/ejemplos/validate-project.json').read_text(encoding='utf-8'))
 model=ProjectInput.model_validate(p)
 assert not model.factorLines and not model.factorMarks
 model=ProjectInput.model_validate({**p,'factorLines':True,'factorMarks':True})
 assert model.model_dump()['factorLines'] is True
