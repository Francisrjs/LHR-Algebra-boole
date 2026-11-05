import json
from pathlib import Path
import pytest
from backend.routh import calculate
from fastapi.testclient import TestClient
from backend.main import app
CASES=json.loads(Path('frontend/src/routhExamples.json').read_text())
@pytest.mark.parametrize('case',CASES,ids=lambda c:c['id'])
def test_routh_cases(case):
 result=calculate(case)
 assert result['status']==case['status']
 assert result['changes']==case['rhp']
 if case['group']=='degree-change': assert result['critical']==[float(case['k'])]
 if case['group']=='gain': assert result['intervals']=='(0 < K) & (K < 6)'
@pytest.mark.parametrize('expression',['0','s/(s+1)','x+s','s**21+1','s**-1','1/0','sin(s)','s+@','s**0.5',''])
def test_invalid(expression):
 assert TestClient(app).post('/api/routh',json={'expression':expression}).status_code==422

@pytest.mark.parametrize('case',CASES,ids=lambda c:c['id'])
def test_routh_api_cases(case):
 response=TestClient(app).post('/api/routh',json=case)
 assert response.status_code==200,response.text
 assert response.json()['status']==case['status']
 assert response.json()['changes']==case['rhp']

def test_routh_math_presentation():
 r=calculate({'expression':'s^3+2*s^2+3*s+K','k':10})
 assert r['characteristicLatex']
 assert r['intervalLatex']
 cell=r['rows'][2][0]
 assert cell['latex']=='-2'
 assert any('\\frac' in step for step in cell['stepsLatex'])
 assert not any('Ã' in step for row in r['rows'] for c in row for step in c['steps'])

@pytest.mark.parametrize('expression',['1/(s*(s+1)*(s+2))','K/(s*(s+1)*(s+2))','(1/(s*(s+1)*(s+2)))*K'])
def test_book_locus_gain_once(expression):
 import sympy as sp
 r=calculate({'source':'locus','expression':expression,'k':1})
 assert r['critical']==[0.,6.]
 assert r['intervals']=='(0 < K) & (K < 6)'
 assert r['symbolicRows'][1][1]['value']=='K'
 assert sp.simplify(sp.sympify(r['symbolicRows'][2][0]['value'])-(6-sp.Symbol('K'))/3)==0
