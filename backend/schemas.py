"""Validated local API inputs; JSON schema is published through OpenAPI."""
from typing import Literal, Annotated
from pydantic import BaseModel, ConfigDict, Field, FiniteFloat, model_validator

Positive=Annotated[FiniteFloat,Field(gt=0)]
class Frequency(BaseModel):
    min:Positive=.01
    max:Positive=1000
    auto:bool=True
    @model_validator(mode='after')
    def increasing(self):
        if self.max<=self.min:raise ValueError('Máximo de frecuencia debe superar al mínimo.')
        return self
class Temporal(BaseModel):
    signal:Literal['step','ramp','impulse']='step'
    duration:Annotated[FiniteFloat,Field(gt=0,le=10000)]=10
    amplitude:FiniteFloat=1
class AnalyzeInput(BaseModel):
    model_config=ConfigDict(extra='allow')
    mode:Literal['separate','direct']='separate'
    g:str='1/(s+1)'
    h:str='1'
    l:str='1/(s+1)'
    k:Annotated[FiniteFloat,Field(ge=0)]=1
    parameters:dict[str,FiniteFloat]=Field(default_factory=dict)
    target:Literal['g','h','l','t']='l'
    temporalTarget:Literal['g','h','l','t']='t'
    frequency:Frequency=Field(default_factory=Frequency)
    temporal:Temporal=Field(default_factory=Temporal)
    revision:int=0
    assumeH1:bool=False
class AlgebraInput(BaseModel):
    operation:Literal['series','parallel','subtract','feedback']='series'
    functions:Annotated[list[str],Field(min_length=2,max_length=32)]
    parameters:dict[str,FiniteFloat]=Field(default_factory=dict)
class RootInput(BaseModel):
    expression:str
    kind:Literal['pole','zero']='pole'
    index:Annotated[int,Field(ge=0)]
    re:FiniteFloat
    im:FiniteFloat=0
    parameters:dict[str,FiniteFloat]=Field(default_factory=dict)
class Parameter(BaseModel):
    name:Annotated[str,Field(pattern=r'^[a-zA-Z][a-zA-Z0-9_]*$')]
    value:FiniteFloat
    min:FiniteFloat
    max:FiniteFloat
    step:Positive
    @model_validator(mode='after')
    def valid(self):
        if self.name in ('s','K') or self.max<=self.min or not self.min<=self.value<=self.max:raise ValueError('Parámetro o rango inválido.')
        return self
class ChartAxis(BaseModel):
    model_config=ConfigDict(extra='forbid')
    range:tuple[FiniteFloat,FiniteFloat]|None=None
    autorange:bool|None=None
    @model_validator(mode='after')
    def ordered(self):
        if self.range is not None and self.range[1]<=self.range[0]:raise ValueError('Rango del gráfico inválido.')
        return self
class ChartView(BaseModel):
    model_config=ConfigDict(extra='forbid')
    xaxis:ChartAxis|None=None
    yaxis:ChartAxis|None=None
    xaxis2:ChartAxis|None=None
    yaxis2:ChartAxis|None=None
class ProjectAlgebra(BaseModel):
    operation:Literal['series','parallel','subtract','feedback']='series'
    functions:Annotated[list[str],Field(min_length=2,max_length=32)]
class ProjectInput(AnalyzeInput):
    format:Literal['controllab']
    schemaVersion:Literal[1]
    parameters:list[Parameter]
    view:Literal['bode','lgr','plano','temporal','algebra']
    factorLines:bool=False
    factorMarks:bool=False
    asymptotic:bool
    history:list[str]
    algebra:ProjectAlgebra|None=None
    charts:dict[Literal['bode-chart','lgr-chart','plano-chart','temporal-chart'],ChartView]=Field(default_factory=dict)
    @model_validator(mode='after')
    def names(self):
        if len({p.name for p in self.parameters})!=len(self.parameters):raise ValueError('Nombres de parámetros repetidos.')
        return self
