import numpy as np
import pytest
from backend.core import parse_tf, analyze

EXERCISE='(s+1)^2(s+100)^2/(s^3(s+10)(s+100))'

def test_missing_parenthesis_is_actionable():
 with pytest.raises(ValueError,match='Falta cerrar 1'):
  parse_tf('K(s+1)^2(s+100)^2/(s^3(s+10)(s+100)',gain_placeholder=True)

@pytest.mark.parametrize('mode',['direct','separate'])
def test_exercise_external_gain_applied_once(mode):
 common={'mode':mode,'k':2,'target':'l','frequency':{'auto':False,'min':0.01,'max':10000}}
 field='l' if mode=='direct' else 'g'
 a=analyze({**common,field:'K'+EXERCISE})
 b=analyze({**common,field:EXERCISE})
 np.testing.assert_allclose(a['models']['l']['num'],b['models']['l']['num'])
 np.testing.assert_allclose(a['bode']['magnitude'],b['bode']['magnitude'])

@pytest.mark.parametrize('source',['K*K/(s+1)','1/(s+K)','K+1'])
def test_gain_not_allowed_as_internal_parameter(source):
 with pytest.raises(ValueError):parse_tf(source,gain_placeholder=True)
