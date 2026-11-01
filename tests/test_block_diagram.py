import pytest
from fastapi.testclient import TestClient

from backend.block_diagram import solve_diagram
from backend.main import app


def graph(nodes, edges):
    return {"schemaVersion": 1, "nodes": nodes, "edges": edges}


def edge(i, source, target, port="in"):
    return {"id": f"e{i}", "sourceNodeId": source, "sourcePortId": "out", "targetNodeId": target, "targetPortId": port}


def test_series_transfer_is_independent_of_layout():
    nodes = [
        {"id":"r","type":"input","name":"R"},
        {"id":"g1","type":"transfer_function","expression":"1/(s+1)"},
        {"id":"g2","type":"transfer_function","expression":"2/(s+2)"},
        {"id":"y","type":"output","name":"Y"},
    ]
    result = solve_diagram(graph(nodes,[edge(1,"r","g1"),edge(2,"g1","g2"),edge(3,"g2","y")]))
    assert result["transferMatrix"][0]["expression"] == "2/((s + 1)*(s + 2))"


def test_two_input_signed_sum_and_feedback():
    nodes = [
        {"id":"r","type":"input","name":"R"},{"id":"n","type":"input","name":"N"},
        {"id":"g","type":"transfer_function","expression":"1/(s+1)"},
        {"id":"sum","type":"sum","inputs":["plus","minus"],"signs":{"plus":"+","minus":"-"}},
        {"id":"y","type":"output","name":"Y"},
    ]
    result=solve_diagram(graph(nodes,[edge(1,"r","g"),edge(2,"g","sum","plus"),edge(3,"n","sum","minus"),edge(4,"sum","y")]))
    assert {x["input"]:x["expression"] for x in result["transferMatrix"]} == {"R":"1/(s + 1)","N":"-1"}


def test_feedback_cycle_resolves_simultaneous_equations():
    nodes=[{"id":"r","type":"input","name":"R"},{"id":"sum","type":"sum","inputs":["forward","return"],"signs":{"forward":"+","return":"-"}},{"id":"g","type":"transfer_function","expression":"2/(s+1)"},{"id":"h","type":"gain","expression":"3"},{"id":"y","type":"output","name":"Y"}]
    edges=[edge(1,"r","sum","forward"),edge(2,"h","sum","return"),edge(3,"sum","g"),edge(4,"g","y"),edge(5,"g","h")]
    assert solve_diagram(graph(nodes,edges))["transferMatrix"][0]["expression"] == "2/(s + 7)"


def test_ambiguous_or_missing_sum_sign_is_rejected():
    nodes=[{"id":"r","type":"input","name":"R"},{"id":"sum","type":"sum","inputs":["a","b"],"signs":{"a":"+"}},{"id":"y","type":"output","name":"Y"}]
    with pytest.raises(ValueError,match="signo"):
        solve_diagram(graph(nodes,[edge(1,"r","sum","a"),edge(2,"r","sum","b"),edge(3,"sum","y")]))


def test_block_diagram_http_validate_and_solve_contract():
    client=TestClient(app)
    payload=graph([{"id":"r","type":"input","name":"R"},{"id":"g","type":"gain","expression":"4"},{"id":"y","type":"output","name":"Y"}],[edge(1,"r","g"),edge(2,"g","y")])
    assert client.post("/api/block-diagram/validate",json=payload).json()["valid"] is True
    result=client.post("/api/block-diagram/solve",json=payload)
    assert result.status_code==200
    assert result.json()["transferMatrix"][0]["model"]["num"]==[4.0]


def test_block_diagram_http_rejects_unknown_version():
    response=TestClient(app).post("/api/block-diagram/solve",json={"schemaVersion":2,"nodes":[],"edges":[]})
    assert response.status_code==422


def test_singular_algebraic_loop_is_rejected():
    nodes=[{"id":"r","type":"input","name":"R"},{"id":"sum","type":"sum","inputs":["reference","feedback"],"signs":{"reference":"+","feedback":"+"}},{"id":"g","type":"gain","expression":"1"},{"id":"y","type":"output","name":"Y"}]
    with pytest.raises(ValueError,match="singular"):
        solve_diagram(graph(nodes,[edge(1,"r","sum","reference"),edge(2,"g","sum","feedback"),edge(3,"sum","g"),edge(4,"g","y")]))
