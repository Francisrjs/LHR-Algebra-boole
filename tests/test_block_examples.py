import json
from pathlib import Path
import pytest
import sympy as sp
from fastapi.testclient import TestClient
from backend.main import app

EXAMPLES=json.loads(Path('frontend/src/blockExamples.json').read_text(encoding='utf-8'))
@pytest.mark.parametrize('example',EXAMPLES,ids=lambda x:x['id'])
def test_frontend_examples(example):
 client=TestClient(app)
 graph=example['diagram']
 for nodes in [graph['nodes'],list(reversed(graph['nodes']))]:
  payload={**graph,'nodes':nodes}
  assert client.post('/api/block-diagram/validate',json=payload).status_code==200
  response=client.post('/api/block-diagram/solve',json=payload)
  assert response.status_code==200,response.text
  for row in response.json()['transferMatrix']:
   assert sp.cancel(sp.sympify(row['expression'])-sp.sympify(example['expected'][row['input']]))==0
