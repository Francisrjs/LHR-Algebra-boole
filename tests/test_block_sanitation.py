from copy import deepcopy
import pytest
from backend.block_diagram import validate_diagram, solve_diagram
from test_block_examples import EXAMPLES

@pytest.mark.parametrize('expression',['1/0','0/0','s+(','__import__("os")','1e999'])
def test_sv07_sv15_bad_expressions(expression):
 graph=deepcopy(EXAMPLES[0]['diagram']);graph['nodes'][1]['expression']=expression
 with pytest.raises(ValueError):validate_diagram(graph)

def test_sv05_sum_port_requires_one_driver():
 graph=deepcopy(next(e['diagram'] for e in EXAMPLES if e['id']=='parallel'))
 duplicate=deepcopy(graph['edges'][2]);duplicate['id']='duplicate';graph['edges'].append(duplicate)
 with pytest.raises(ValueError,match='más de una'):validate_diagram(graph)

def test_sv06_validate_rejects_missing_sign():
 graph=deepcopy(next(e['diagram'] for e in EXAMPLES if e['id']=='parallel'))
 del graph['nodes'][3]['signs']['a']
 with pytest.raises(ValueError,match='signo'):validate_diagram(graph)

def test_sv14_nonfinite_geometry():
 graph=deepcopy(EXAMPLES[0]['diagram']);graph['nodes'][0]['position']['x']=float('nan')
 with pytest.raises(ValueError,match='coordenadas'):validate_diagram(graph)

def test_distinct_ids_do_not_alias_internal_signals():
 graph=deepcopy(EXAMPLES[1]['diagram'])
 names={'G0':'a-b','G1':'a_b'}
 for n in graph['nodes']:n['id']=names.get(n['id'],n['id'])
 for e in graph['edges']:
  for key in ['sourceNodeId','targetNodeId']:e[key]=names.get(e[key],e[key])
 assert solve_diagram(graph)['transferMatrix'][0]['expression']=='1/((s + 1)*(s + 2))'
