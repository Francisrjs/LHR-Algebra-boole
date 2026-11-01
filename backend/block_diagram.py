"""Versioned semantic block diagrams and symbolic transfer-matrix solver."""
import ast
import re
import math

import sympy as sp
from pydantic import BaseModel, ConfigDict, Field
from backend.core import parse_tf, summary


class BlockDiagram(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schemaVersion: int = Field(ge=1, le=1)
    nodes: list[dict] = Field(max_length=128)
    edges: list[dict] = Field(max_length=512)


def _expression(source, symbols):
    if not isinstance(source, str) or len(source) > 2000:
        raise ValueError("La expresión debe ser texto de hasta 2000 caracteres.")
    text = source.replace("^", "**")
    tokens = re.findall(r"(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_]\w*|\*\*|[+*/()\-]", text)
    if "".join(tokens) != re.sub(r"\s+", "", text):
        raise ValueError("La expresión contiene caracteres no permitidos.")
    tree = ast.parse(text, mode="eval")
    def visit(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return sp.Rational(str(node.value))
        if isinstance(node, ast.Name):
            return symbols.setdefault(node.id, sp.Symbol(node.id))
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = visit(node.operand)
            return -value if isinstance(node.op, ast.USub) else value
        if isinstance(node, ast.BinOp):
            a, b = visit(node.left), visit(node.right)
            if isinstance(node.op, ast.Add): return a + b
            if isinstance(node.op, ast.Sub): return a - b
            if isinstance(node.op, ast.Mult): return a * b
            if isinstance(node.op, ast.Div): return a / b
            if isinstance(node.op, ast.Pow) and b.is_Integer and abs(int(b)) <= 32: return a ** int(b)
        raise ValueError("Usá expresiones racionales con +, -, *, / y potencias enteras hasta 32.")
    if sum(1 for _ in ast.walk(tree)) > 256:
        raise ValueError("La expresión supera el límite de complejidad.")
    value = visit(tree.body)
    if value.has(sp.zoo, sp.oo, -sp.oo, sp.nan):
        raise ValueError("La expresión contiene división por cero o valores no finitos.")
    return value


def validate_diagram(data):
    doc = BlockDiagram.model_validate(data)
    nodes = {n.get("id"): n for n in doc.nodes}
    if None in nodes or len(nodes) != len(doc.nodes):
        raise ValueError("Los IDs de nodo deben existir y ser únicos.")
    allowed = {"input", "output", "transfer_function", "gain", "sum", "junction"}
    incoming, edge_ids = {}, set()
    for n in doc.nodes:
        if not isinstance(n.get("id"), str) or not n["id"]:
            raise ValueError("Cada nodo requiere un ID de texto no vacío.")
        position = n.get("position", {})
        if not isinstance(position, dict) or any(type(v) not in (int, float) or not math.isfinite(v) for v in position.values()):
            raise ValueError(f"Nodo {n['id']}: coordenadas no finitas o inválidas.")
        if n.get("type") in ("gain", "transfer_function"):
            try:
                _expression(n.get("expression"), {"s": sp.Symbol("s")})
            except (ValueError, SyntaxError, TypeError, RecursionError) as exc:
                raise ValueError(f"Nodo {n['id']}: expresión inválida: {exc}") from exc
        if n.get("type") == "sum":
            for port in n.get("inputs", ["in1", "in2"]):
                if n.get("signs", {}).get(port) not in ("+", "-"):
                    raise ValueError(f"Definí el signo + o - del puerto {port} en {n['id']}.")
        if n.get("type") not in allowed:
            raise ValueError(f"Tipo de nodo no admitido: {n.get('type')}.")
        if n.get("type") == "sum":
            ports=n.get("inputs", ["in1", "in2"])
            if len(ports)<2 or len(set(ports))!=len(ports): raise ValueError(f"Los puertos del sumador {n['id']} deben ser únicos y al menos dos.")
        if n.get("type") in ("transfer_function","gain") and not isinstance(n.get("expression"),str): raise ValueError(f"El nodo {n['id']} requiere una expresión.")
    for edge in doc.edges:
        eid = edge.get("id")
        if not eid or eid in edge_ids: raise ValueError("Los IDs de conexión deben ser únicos.")
        edge_ids.add(eid)
        src, dst = nodes.get(edge.get("sourceNodeId")), nodes.get(edge.get("targetNodeId"))
        if not src or not dst: raise ValueError(f"Conexión {eid}: nodo de origen o destino inexistente.")
        if src["type"] == "output" or dst["type"] == "input": raise ValueError(f"Conexión {eid}: las entradas son fuentes y las salidas son terminales.")
        if edge.get("sourcePortId") not in src.get("outputs", ["out"]): raise ValueError(f"Conexión {eid}: puerto de salida inexistente.")
        port = edge.get("targetPortId")
        if port not in dst.get("inputs", ["in"]): raise ValueError(f"Conexión {eid}: puerto de entrada inexistente.")
        key = (dst["id"], port)
        incoming.setdefault(key, []).append(src["id"])
        if len(incoming[key]) > 1: raise ValueError(f"El puerto {port} de {dst['id']} recibe más de una conexión.")
    inputs = [n for n in doc.nodes if n["type"] == "input"]
    outputs = [n for n in doc.nodes if n["type"] == "output"]
    if not inputs or not outputs: raise ValueError("El diagrama requiere al menos una entrada y una salida observada.")
    names=[n.get("name",n["id"]) for n in inputs]
    if len(set(names))!=len(names): raise ValueError("Cada entrada independiente necesita un nombre único.")
    for n in doc.nodes:
        if n["type"] not in ("input",) and not any(k[0] == n["id"] for k in incoming):
            raise ValueError(f"El nodo {n['id']} no tiene conexión de entrada.")
    return doc.model_dump(), nodes, incoming


def solve_diagram(data):
    graph, nodes, incoming = validate_diagram(data)
    s = sp.Symbol("s")
    symbols = {"s": s}
    outvar = {n["id"]: sp.Dummy(n["id"]) for n in graph["nodes"] if n["type"] != "input"}
    unknowns = list(outvar.values())
    for n in graph["nodes"]:
        if n["type"] == "input":
            name = n.get("name", n["id"])
            outvar[n["id"]] = symbols.setdefault(name, sp.Symbol(name))
    equations = []
    def signal(node_id, port="in"):
        edges = [e for e in graph["edges"] if e["targetNodeId"] == node_id and e["targetPortId"] == port]
        if len(edges) != 1: raise ValueError(f"Falta una conexión única al puerto {port} de {node_id}.")
        return outvar[edges[0]["sourceNodeId"]]
    for node in graph["nodes"]:
        kind, nid = node["type"], node["id"]
        if kind == "input":
            name = node.get("name", nid)
            outvar[nid] = symbols.setdefault(name, sp.Symbol(name))
        elif kind == "output":
            equations.append(outvar[nid] - signal(nid))
        elif kind == "junction":
            equations.append(outvar[nid] - signal(nid))
        elif kind == "sum":
            ports = node.get("inputs", ["in1", "in2"])
            signs = node.get("signs", {})
            if len(ports) < 2: raise ValueError(f"El sumador {nid} requiere al menos dos puertos.")
            total = 0
            for port in ports:
                sign = signs.get(port)
                if sign not in ("+", "-"): raise ValueError(f"Definí el signo + o - del puerto {port} en {nid}.")
                total += (1 if sign == "+" else -1) * signal(nid, port)
            equations.append(outvar[nid] - total)
        else:
            expr = _expression(node.get("expression", "1"), symbols)
            equations.append(outvar[nid] - expr * signal(nid))
    variables = unknowns
    solution_set = sp.linsolve(equations, variables)
    if solution_set is sp.EmptySet or not solution_set:
        raise ValueError("El sistema de ecuaciones es singular o inconsistente.")
    solution = dict(zip(variables, next(iter(solution_set))))
    if any(value.subs(solution).free_symbols.intersection(variables) for value in solution.values()):
        raise ValueError("El lazo algebraico es singular o no determina una solución única.")
    input_nodes = [n for n in graph["nodes"] if n["type"] == "input"]
    outputs = [n for n in graph["nodes"] if n["type"] == "output"]
    matrix, relations = [], []
    for output in outputs:
        expression = sp.factor(solution[outvar[output["id"]]].subs(solution))
        terms = []
        for inp in input_nodes:
            source = symbols[inp.get("name", inp["id"])]
            transfer = sp.factor(sp.diff(expression, source))
            row={"output": output.get("name", output["id"]), "input": inp.get("name", inp["id"]), "expression": str(transfer)}
            if transfer.free_symbols <= {s}:
                try: row["model"]=summary(parse_tf(str(transfer)))
                except (ValueError,TypeError,ZeroDivisionError): pass
            matrix.append(row)
            terms.append(f"({transfer})*{source}")
        relations.append({"output": output.get("name", output["id"]), "expression": str(expression), "equation": f"{output.get('name', output['id'])} = " + " + ".join(terms)})
    return {"schemaVersion": graph["schemaVersion"], "transferMatrix": matrix, "relations": relations}
