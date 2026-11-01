import numpy as np
from backend.core import parse_tf, analyze

def test_parser():
    g=parse_tf('1/((s+1)(s+2))',{})
    assert np.allclose(g.den[0][0],[1,3,2])

def test_nonunit_feedback():
    a=analyze(dict(g='2/(s+1)',h='3/(s+2)',k=1))
    assert np.allclose(a['models']['t']['num'],[2,4])
    assert np.allclose(a['models']['t']['den'],[1,3,8])

def test_temporal_target_can_analyze_open_loop_equivalent():
    a=analyze(dict(g='1/(s+1)',h='1',k=1,target='g',temporalTarget='g'))
    assert a['temporal'].get('error') is None
    assert np.allclose(a['temporal']['output'][-1],1,atol=.02)

def test_bode_firstorder():
    a=analyze(dict(g='1/(s+1)',h='1',k=1,frequency=dict(min=1,max=10,auto=False)))
    assert abs(a['bode']['magnitude'][0]+3.01029995664)<1e-6
    assert abs(a['bode']['phase'][0]+45)<1e-6
import pytest
import control as ct
from fastapi.testclient import TestClient
from backend.main import app
from backend.core import algebra,edit_roots

@pytest.mark.parametrize('bad',["__import__(s)",'1/(s+', '1/0','K/(s+1)','1/(s-s)'])
def test_bad_parser(bad):
    with pytest.raises(Exception):parse_tf(bad,{})

def test_parameter_implicit_product():
    assert np.allclose(parse_tf('a/((s+1)(s+2))',{'a':2}).num[0][0],[2])

def test_direct_gh_and_equivalent():
    a=analyze({'mode':'direct','l':'1/(s+1)'})
    assert a['models']['t'] is None
    assert 'error' in a['temporal']
    assert analyze({'mode':'direct','l':'1/(s+1)','assumeH1':True})['models']['t'] is not None

def test_critical_gain():
    a=analyze({'g':'1/(s(s+1)(s+3))','k':12})
    m=a['bode']['margins']
    assert abs(m['gm'])<1e-6 and abs(m['pm'])<1e-6
    assert abs(m['wpc']-np.sqrt(3))<1e-6
    assert a['stability']=='marginal'
    assert abs(a['locus']['centroid']+4/3)<1e-6
    assert abs(a['locus']['crossings'][0]['k']-12)<1e-6

def test_step_analytic():
    a=analyze({'g':'1/((s+1)(s+2))'})
    t=np.array(a['temporal']['time']);y=np.array(a['temporal']['output'])
    expected=1/3-np.exp(-1.5*t)*np.cos(np.sqrt(3)*t/2)/3-np.exp(-1.5*t)*np.sin(np.sqrt(3)*t/2)/np.sqrt(3)
    assert np.max(abs(y-expected))<1e-4

def test_zero_gain():
    a=analyze({'g':'1/(s+1)','k':0})
    assert all(x is None for x in a['bode']['phase'])
    assert a['bode']['margins']['gmState']=='undefined'

def test_algebra():
    a=algebra({'functions':['1/(s+1)','1/(s+2)'],'operation':'parallel'})['result']
    assert np.allclose(a['num'],[2,3])
    assert np.allclose(a['den'],[1,3,2])

def test_conjugate_edit():
    a=edit_roots({'expression':'1/(s^2+2s+2)','kind':'pole','index':0,'re':-2,'im':3})['result']
    assert np.allclose(a['den'],[1,4,13])

def test_api_and_health():
    c=TestClient(app)
    assert c.get('/api/health').status_code==200
    assert c.post('/api/analyze',json={'g':'1/(s+1)','k':1}).status_code==200
    assert c.post('/api/analyze',json={'g':'1/(s+'}).status_code==422

def test_singular_axis_and_no_cancel():
    a=analyze({'g':'1/(s^2+1)','frequency':{'min':.1,'max':10,'auto':False}})
    i=a['bode']['omega'].index(1.)
    assert a['bode']['magnitude'][i] is None
    b=analyze({'g':'(s-1)/((s-1)(s+2))'})
    assert b['stability']=='unstable' and b['warnings']

def test_finite_impulse_component():
    a=analyze({'g':'(s+2)/(s+1)','temporal':{'signal':'impulse','duration':5,'amplitude':2}})
    assert abs(a['temporal']['impulseWeight']-1)<1e-6

def test_frequency_independent_polynomial_eval():
    a=analyze({'g':'(s+2)/(s^2+3s+5)','h':'(s+3)/(s+4)','k':2})
    b=a['bode'];m=a['models']['l'];w=np.array(b['omega'])
    exact=np.polyval(m['num'],1j*w)/np.polyval(m['den'],1j*w)
    assert np.max(abs(np.array(b['magnitude'])-20*np.log10(abs(exact))))<1e-6

def test_margin_outside_visible_range():
    a=analyze({'g':'1/(s(s+1)(s+3))','k':12,'frequency':{'min':100,'max':1000,'auto':False}})
    assert abs(a['bode']['margins']['gm'])<1e-6

def test_coefficients_and_phase_recovery():
    assert np.allclose(parse_tf('[1]/[1,3,2]').den[0][0],[1,3,2])
    a=analyze({'g':'1/(s^2+1)','frequency':{'min':.1,'max':10,'auto':False}})
    i=a['bode']['omega'].index(1.)
    assert a['bode']['phase'][i] is None
    assert a['bode']['phase'][i+1] is not None

def test_project_validation_and_schemas():
    c=TestClient(app)
    p=dict(format='controllab',schemaVersion=1,mode='separate',g='1/(s+1)',h='1',l='1/(s+1)',k=1,parameters=[],view='bode',target='l',frequency=dict(min=.01,max=1000,auto=True),temporal=dict(signal='step',duration=10,amplitude=1),asymptotic=False,history=[])
    assert c.post('/api/validate-project',json=p).status_code==200
    p['frequency']['max']=-1
    assert c.post('/api/validate-project',json=p).status_code==422
    assert c.post('/api/analyze',json={'mode':'arbitrary'}).status_code==422
    assert c.post('/api/analyze',json={'k':-1}).status_code==422

def test_zero_model_and_repeated_axis_poles():
    a=analyze({'g':'0'})
    assert a['models']['l']['num']==[0.0]
    assert a['locus']['branches']==[]
    from backend.core import stability
    assert stability(np.array([0j,0j]))=='unstable'

def test_base_gain_and_zero_gain_characteristic_modes():
    a=analyze({'mode':'direct','l':'2/(s+1)','k':4})
    assert a['models']['l']['num']==[8.]
    assert a['models']['l0']['num']==[2.]
    b=analyze({'g':'1/(s*(s+1))','k':0})
    assert len(b['locus']['closedPoles'])==2
    assert b['models']['t']['num']==[0.]
    assert b['stability']=='marginal'

def test_negative_fixed_gain_asymptotes():
    a=analyze({'g':'-1/(s*(s+1)*(s+3))'})
    assert a['locus']['angles']==[0.,120.,240.]

def test_locus_failure_does_not_destroy_bode(monkeypatch):
    from backend import core
    core.locus_base.cache_clear()
    def fail(*args,**kwargs):raise ArithmeticError('fallo numérico simulado')
    monkeypatch.setattr(core.ct,'root_locus_map',fail)
    a=analyze({'g':'1/(s+7)'})
    assert len(a['bode']['omega'])>0
    assert 'error' in a['locus']
    core.locus_base.cache_clear()

def test_temporal_failure_does_not_destroy_bode(monkeypatch):
    from backend import core
    def fail(*args,**kwargs):raise ArithmeticError('fallo temporal simulado')
    monkeypatch.setattr(core.ct,'forced_response',fail)
    a=analyze({'g':'1/(s+1)'})
    assert len(a['bode']['omega'])>0
    assert 'error' in a['temporal']

def test_temporal_fast_oscillation_sampling():
    from backend.core import time_response
    t=time_response(ct.tf([1000000],[1,.2,1000000]),{'duration':2,'signal':'step'})
    assert len(t['time'])>=10000
    assert max(np.diff(t['time']))<=2*np.pi/1000/32

def test_temporal_sampling_budget_is_explicit():
    from backend.core import time_response
    t=time_response(ct.tf([1e16],[1,1,1e16]),{'duration':100,'signal':'step'})
    assert 'error' in t

def test_static_models_and_improper_are_explicit():
    a=analyze({'g':'2'})
    assert a['locus']['branches']==[]
    b=analyze({'g':'s+1'})
    assert 'error' in b['locus']
    assert len(b['bode']['omega'])>0

def test_feedback_singularity_is_not_stable_or_global_failure():
    a=analyze({'g':'-1','h':'1','k':1})
    assert a['stability']=='undefined'
    assert a['models']['t'] is None
    assert 'error' in a['temporal']
    assert len(a['bode']['omega'])>0

def test_margins_failure_does_not_destroy_curves(monkeypatch):
    from backend import core
    def fail(*args,**kwargs):raise ArithmeticError('simulated margin failure')
    monkeypatch.setattr(core.ct,'stability_margins',fail)
    a=analyze({'g':'1/(s+1)'})
    assert len(a['bode']['omega'])>0
    assert 'error' in a['bode']['margins']

def test_project_nested_charts_and_algebra_validation():
    from backend.schemas import ProjectInput
    from pydantic import ValidationError
    p=dict(format='controllab',schemaVersion=1,parameters=[],view='bode',asymptotic=False,history=[])
    with pytest.raises(ValidationError):ProjectInput(**p,charts={'bode-chart':{'x':[1]}})
    with pytest.raises(ValidationError):ProjectInput(**p,charts={'bode-chart':{'x':[2,1]}})
    with pytest.raises(ValidationError):ProjectInput(**p,algebra={'functions':['1'],'operation':'series'})
    c=TestClient(app)
    assert c.post('/api/validate-project',json={**p,'algebra':{'functions':['1','s+('],'operation':'series'}}).status_code==422

def test_project_actual_plotly_chart_shape():
    c=TestClient(app)
    p=dict(format='controllab',schemaVersion=1,mode='separate',g='1/(s+1)',h='1',l='1/(s+1)',k=1,parameters=[],view='bode',target='l',frequency=dict(min=.01,max=1000,auto=True),temporal=dict(signal='step',duration=10,amplitude=1),asymptotic=False,history=[],charts={'bode-chart':{'xaxis':{'range':[-2,2],'autorange':False},'xaxis2':{'range':[-2,2],'autorange':False},'yaxis':{'autorange':True}}},algebra={'operation':'series','functions':['1/(s+1)','1/(s+2)']})
    assert c.post('/api/validate-project',json=p).status_code==200
    p['charts']['bode-chart']['xaxis']['range']=[2,1]
    assert c.post('/api/validate-project',json=p).status_code==422
