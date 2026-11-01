import numpy as np
import pytest
from backend.core import analyze

@pytest.mark.parametrize('g,critical,omega',[('1/(s*(s+1)*(s+2))',6,np.sqrt(2)),('1/(s*(s+2)*(s+3))',30,np.sqrt(6)),('1/(s*(s+1)*(s+3))',12,np.sqrt(3))])
def test_summary_critical_boundaries(g,critical,omega):
    a=analyze(dict(g=g,k=critical))
    assert a['stability']=='marginal'
    assert any(abs(c['k']-critical)<1e-6 and abs(c['omega']-omega)<1e-6 for c in a['locus']['crossings'])
    assert analyze(dict(g=g,k=critical*.99))['stability']=='stable'
    assert analyze(dict(g=g,k=critical*1.01))['stability']=='unstable'

@pytest.mark.parametrize('gain',[.001,1,12,1000,1000000])
def test_partial_3b_stability(gain):
    a=analyze(dict(g='(s+2)/(s*(s+1)*(s+3))',k=gain))
    assert a['stability']=='stable'
    assert abs(a['locus']['centroid']+1)<1e-6
    assert a['locus']['angles']==[90,270]

def test_partial_breakaway():
    a=analyze(dict(g='1/(s*(s+1)*(s+3))',k=1))
    assert abs(a['locus']['breakaways'][0]['re']-(-4+np.sqrt(7))/3)<1e-6
import numpy as np
from backend.core import margins,parse_tf

def test_dc_unit_gain_phase_margin_is_included():
    repeated=margins(parse_tf('1/(s^2+2*s+1)'),1)
    unstable=margins(parse_tf('1/(s-1)'),1)
    assert repeated['pmState']=='finite' and repeated['pm']==180 and repeated['wgc']==0
    assert unstable['pmState']=='finite' and unstable['pm']==0 and unstable['wgc']==0
    assert any(x['kind']=='phase' and x['omega']==0 for x in repeated['all'])
    assert any(x['kind']=='phase' and x['omega']==0 for x in unstable['all'])
