from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from backend.core import analyze, algebra, edit_roots
from backend.schemas import AnalyzeInput, AlgebraInput, RootInput, ProjectInput
from backend.block_diagram import BlockDiagram, solve_diagram, validate_diagram

app=FastAPI(title='ControlLab',version='1.0.0')
@app.get('/api/health')
def health():return {'status':'ok'}

def call(fn,data):
    try:return fn(data)
    except Exception as exc:raise HTTPException(status_code=422,detail=str(exc)) from exc
@app.post('/api/analyze')
def analyze_api(data:AnalyzeInput):return call(analyze,data.model_dump())
@app.post('/api/algebra')
def algebra_api(data:AlgebraInput):return call(algebra,data.model_dump())
@app.post('/api/block-diagram/validate')
def validate_block_diagram(data:BlockDiagram):
    return call(lambda payload: {'valid':True,'diagnostics':[],'schemaVersion':validate_diagram(payload)[0]['schemaVersion']},data.model_dump())
@app.post('/api/block-diagram/solve')
def solve_block_diagram(data:BlockDiagram):return call(solve_diagram,data.model_dump())
@app.post('/api/edit-roots')
def edit_api(data:RootInput):return call(edit_roots,data.model_dump())
@app.post('/api/validate-project')
def validate_project(data:ProjectInput):
    model=data.model_dump();model['parameters']={p.name:p.value for p in data.parameters}
    # Both editing modes must be valid before accepting a portable project.
    for source in ('g','h','l'):
        from backend.core import parse_tf
        call(lambda _:parse_tf(model[source],model['parameters'],gain_placeholder=source in ('g','l')),{})
    if data.algebra:
        for expression in data.algebra.functions:
            call(lambda _:parse_tf(expression,model['parameters']),{})
    call(analyze,model)
    return {'valid':True}

DIST=Path(__file__).resolve().parent.parent/'frontend'/'dist'
if (DIST/'assets').exists():app.mount('/assets',StaticFiles(directory=DIST/'assets'),name='assets')
@app.get('/')
def index():
    if not (DIST/'index.html').exists():raise HTTPException(503,'Falta compilar frontend: ejecutá setup.cmd.')
    return FileResponse(DIST/'index.html')
