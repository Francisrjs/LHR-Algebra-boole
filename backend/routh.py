import sympy as sp
from backend.block_diagram import _expression

def _build_table(polynomial):
 s=polynomial.gens[0];degree=polynomial.degree()
 coeff=polynomial.all_coeffs();width=(degree+2)//2
 table=[[sp.S(0)]*width for _ in range(degree+1)]; cells={}; events=[];eps=sp.Symbol('epsilon',positive=True)
 for r in range(degree+1):
  for c in range(width):
   refs=[]; steps=[]; math_steps=[];kind='coefficient'
   if r<2:
    index=2*c+r;v=coeff[index] if index<len(coeff) else sp.S(0)
    steps=[f'Coeficiente de s^{degree-index}: {v}' if index<len(coeff) else 'Cero de relleno'];kind='coefficient' if index<len(coeff) else 'padding'
   elif c+1<width:
    a,b,u,v=table[r-1][0],table[r-2][0],table[r-2][c+1],table[r-1][c+1]
    refs=[f'{r-1}:0',f'{r-2}:{c+1}',f'{r-2}:0',f'{r-1}:{c+1}'];kind='recurrence'
    steps=['(a*u - b*v) / a',f'(({a})*({u})-({b})*({v}))/({a})',f'{sp.expand(a*u-b*v)}/({a})']
    math_steps=[r"\frac{\left("+sp.latex(a)+r"\right)\left("+sp.latex(u)+r"\right)-\left("+sp.latex(b)+r"\right)\left("+sp.latex(v)+r"\right)}{"+sp.latex(a)+"}",r"\frac{"+sp.latex(sp.expand(a*u-b*v))+"}{"+sp.latex(a)+"}"]
    v=sp.cancel((a*u-b*v)/a)
   else:v=sp.S(0);kind='padding';steps=['Cero de relleno']
   table[r][c]=v;cells[f'{r}:{c}']={'id':f'{r}:{c}','value':str(v),'kind':kind,'refs':refs,'steps':steps+[str(v)],'latex':sp.latex(v),'stepsLatex':math_steps+[sp.latex(v)]}
  if all(v==0 for v in table[r]) and r>0:
   power=degree-r+1;aux=sum(table[r-1][c]*s**(power-2*c) for c in range(width) if power-2*c>=0)
   derivative=sp.Poly(sp.diff(aux,s),s)
   for c in range(width):
    p=degree-r-2*c;table[r][c]=derivative.nth(p) if p>=0 else sp.S(0)
    cells[f'{r}:{c}'].update(value=str(table[r][c]),kind='auxiliary',latex=sp.latex(table[r][c]),stepsLatex=['A(s) = '+sp.latex(aux),r"A'(s) = "+sp.latex(derivative.as_expr()),sp.latex(table[r][c])],steps=[f'Fila original de ceros. Auxiliar: {aux}',f'Derivada: {derivative.as_expr()}',str(table[r][c])])
   events.append('Fila de ceros: derivada del polinomio auxiliar.')
  if table[r][0]==0:
   table[r][0]=eps;cells[f'{r}:0'].update(value=str(eps),kind='epsilon',latex=sp.latex(eps),stepsLatex=[r'\varepsilon > 0',r'\varepsilon \to 0^{+}'],steps=['Primer elemento cero: usar epsilon positivo y tomar el límite.']);events.append('Pivote cero: epsilon positivo.')
 return table,cells,events,eps

def calculate(data):
 s,K=sp.symbols('s K', real=True)
 symbols={'s':s,'K':K}
 expression=_expression(data.get('expression','s**3+2*s**2+3*s+K'),symbols)
 expression=expression.subs({symbols.get(k,sp.Symbol(k)):sp.Rational(str(v)) for k,v in data.get('parameters',{}).items()})
 if expression.free_symbols-{s,K}: raise ValueError('Solo se admiten s y K libres.')
 source=data.get('source','polynomial')
 if source=='locus' and K in expression.free_symbols:
  from backend.core import parse_tf
  parse_tf(data['expression'],data.get('parameters'),gain_placeholder=True)
  expression=expression/K
 n,d=sp.fraction(expression)
 expression=d+K*n if source=='locus' else d if source=='transfer' else expression
 poly=sp.Poly(expression,s)
 value=sp.Rational(str(data.get('k',10)))
 if value<0: raise ValueError('K debe ser no negativo.')
 evaluated=sp.Poly(expression.subs(K,value),s)
 if evaluated.is_zero: raise ValueError("Polinomio idénticamente nulo.")
 degree=evaluated.degree()
 if degree>20: raise ValueError("Grado máximo: 20.")
 table,cells,events,eps=_build_table(evaluated)
 coeff=evaluated.all_coeffs();width=(degree+2)//2
 # Exact sign for epsilon -> 0+, including poles and vanishing terms.
 signs=[int(sp.sign(row[0].as_leading_term(eps).subs(eps,1))) for row in table]
 changes=sum(a*b<0 for a,b in zip(signs,signs[1:]))
 # Imaginary roots are real zeros of Re(P(i*w)) and Im(P(i*w)).
 # Counting them in the exact gcd avoids tolerances and root solver failures.
 w=sp.Symbol('w',real=True)
 def axis_count(polynomial):
  if polynomial.degree()<=0: return 0
  real,imag=sp.expand(polynomial.as_expr().subs(s,sp.I*w)).as_real_imag()
  common=sp.Poly(sp.gcd(real,imag),w)
  return int(common.count_roots(-sp.oo,sp.oo)) if common.degree()>0 else 0
 axis_roots=axis_count(evaluated)
 repeated_axis=axis_count(sp.gcd(evaluated,evaluated.diff()))>0
 status='unstable' if changes or repeated_axis else 'boundary' if axis_roots else 'stable'
 intervals='Intervalos no determinados';interval_latex=None;critical=[]
 try:
  co=poly.all_coeffs();order=poly.degree();conditions=[]
  for size in range(1,order+1):
   matrix=sp.Matrix(size,size,lambda i,j:co[2*j-i+1] if 0<=2*j-i+1<len(co) else 0)
   conditions.append(matrix.det()/co[0]**size>0)
  solution=sp.reduce_inequalities([K>=0]+conditions,K)
  # A vanishing leading coefficient changes degree: test that point separately.
  for point in sp.solve(co[0],K):
   if point.is_real and point>=0:
    critical.append(float(point))
    reduced=sp.Poly(expression.subs(K,point),s)
    if not reduced.is_zero:
     lower=reduced.all_coeffs();checks=[]
     for size in range(1,reduced.degree()+1):
      h=sp.Matrix(size,size,lambda i,j:lower[2*j-i+1] if 0<=2*j-i+1<len(lower) else 0)
      checks.append(h.det()/lower[0]**size>0)
     if all(checks):solution=sp.Or(solution,sp.Eq(K,point))
  intervals=str(solution);interval_latex=sp.latex(sp.simplify(solution))
  for condition in conditions:
   for point in sp.solve(condition.lhs,K) if hasattr(condition,"lhs") else []:
    if point.is_real and point>=0:critical.append(float(point))
 except (NotImplementedError,ValueError,TypeError):pass
 symbolic_rows=None
 if K in poly.as_expr().free_symbols:
  _,symbolic_cells,_,_=_build_table(poly)
  symbolic_rows=[[symbolic_cells[f'{r}:{c}'] for c in range((poly.degree()+2)//2)] for r in range(poly.degree()+1)]
 return dict(symbolicRows=symbolic_rows,symbolicDegree=poly.degree(),characteristicLatex=sp.latex(expression),evaluatedLatex=sp.latex(evaluated.as_expr()),intervalLatex=interval_latex,characteristic=str(expression),evaluated=str(evaluated.as_expr()),coefficients=list(map(str,coeff)),rows=[[cells[f'{r}:{c}'] for c in range(width)] for r in range(degree+1)],signs=signs,changes=changes,status=status,events=events,axisRoots=axis_roots,repeatedAxis=repeated_axis,intervals=intervals,critical=sorted(set(critical)),degree=degree)
