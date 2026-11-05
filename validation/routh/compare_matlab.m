% Independent symbolic MATLAB Routh construction and root classification.
base=fileparts(mfilename('fullpath'));
cases=jsondecode(fileread(fullfile(base,'inputs.json')));
syms s; assume(s,'clear'); syms K real; syms epsilon positive;
records=struct([]);
for q=1:numel(cases)
 c=cases(q); rec=struct('id',c.id,'status','FAIL','tableExact',false,'classificationExact',false,'rhpExact',false,'intervalExact',true,'detail','');
 try
  P=expand(subs(str2sym(c.expression),K,sym(c.k)));
  a=coeffs(P,s,'All');n=numel(a)-1;w=ceil((n+1)/2);T=sym(zeros(n+1,w));
  for j=1:numel(a),T(1+mod(j-1,2),ceil(j/2))=a(j);end
  for r=1:n+1
   if r>=3
    for col=1:w-1
     T(r,col)=simplify((T(r-1,1)*T(r-2,col+1)-T(r-2,1)*T(r-1,col+1))/T(r-1,1));
    end
   end
   if all(arrayfun(@(x)isequal(simplify(x),sym(0)),T(r,:))) && r>1
    power=n-r+2;A=sym(0);
    for col=1:w
     pw=power-2*(col-1);if pw>=0,A=A+T(r-1,col)*s^pw;end
    end
    D=diff(A,s);
    for col=1:w
     pw=n-r+1-2*(col-1);if pw>=0,T(r,col)=subs(diff(D,s,pw),s,0)/factorial(pw);end
    end
   end
   if isequal(simplify(T(r,1)),sym(0)),T(r,1)=epsilon;end
  end
  exact=true;
  for r=1:n+1
   for col=1:w
    raw=c.actual.rows;
    if iscell(raw),if iscell(raw{r}),text=raw{r}{col};else,text=raw{r}(col);end;else,text=raw(r,col);end
    expected=str2sym(text);
    exact=exact && isequal(simplify(T(r,col)-expected),sym(0));
   end
  end
  z=solve(P==0,s);right=0;axis=false;repeatedAxis=false;common=gcd(P,diff(P,s));
  for j=1:numel(z)
   if isAlways(real(z(j))>0,'Unknown','false'),right=right+1;end
   if isAlways(real(z(j))==0,'Unknown','false')
    axis=true;
    if isAlways(subs(common,s,z(j))==0,'Unknown','false'),repeatedAxis=true;end
   end
  end
  expectedStatus='stable';if right>0 || repeatedAxis,expectedStatus='unstable';elseif axis,expectedStatus='boundary';end
  rec.tableExact=exact;rec.classificationExact=strcmp(c.actual.status,expectedStatus);rec.rhpExact=c.actual.changes==right;
  if strcmp(c.group,'gain')
   interval=solve([K>0,3-K/2>0],K,'ReturnConditions',true);
   rec.intervalExact=strcmp(c.actual.intervals,'(0 < K) & (K < 6)') && ~isempty(interval.conditions);
  end
  if exact && rec.classificationExact && rec.rhpExact && rec.intervalExact,rec.status='PASS';end
  rec.detail=char(string(expectedStatus));
 catch err
  rec.detail=err.message;
 end
 if q==1,records=rec;else,records(q)=rec;end
end
report=struct('matlab',version,'records',records,'passed',sum(strcmp({records.status},'PASS')),'failed',sum(strcmp({records.status},'FAIL')));
fid=fopen(fullfile(base,'matlab_results.json'),'w');cleanup=onCleanup(@()fclose(fid));fprintf(fid,'%s',jsonencode(report));
fprintf('MATLAB Routh: %d PASS, %d FAIL\n',report.passed,report.failed);
for q=find(strcmp({records.status},'FAIL')),disp(records(q));end


