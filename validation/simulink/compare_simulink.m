% Ejecutar desde MATLAB con Simulink. No requiere Control System Toolbox.
root = fileparts(mfilename('fullpath'));
data = jsondecode(fileread(fullfile(root,'fixtures.json')));
out = fullfile(root,'results'); if ~exist(out,'dir'), mkdir(out); end
results = struct([]);
figure('Color','w','Position',[100 100 1200 800]);
for i = 1:numel(data.cases)
    c = data.cases(i); mdl = sprintf('ControlLab_validation_%d',i);
    if bdIsLoaded(mdl), close_system(mdl,0); end
    new_system(mdl);
    add_block('simulink/Sources/Step',[mdl '/Reference'],'Time','0','Before','0','After','1');
    add_block('simulink/Math Operations/Sum',[mdl '/Error'],'Inputs','+-');
    add_block('simulink/Math Operations/Gain',[mdl '/K'],'Gain',num2str(c.k,17));
    add_block('simulink/Continuous/Transfer Fcn',[mdl '/G'],'Numerator',mat2str(c.gNum(:).',17),'Denominator',mat2str(c.gDen(:).',17));
    add_block('simulink/Continuous/Transfer Fcn',[mdl '/H'],'Numerator',mat2str(c.hNum(:).',17),'Denominator',mat2str(c.hDen(:).',17));
    add_block('simulink/Sinks/To Workspace',[mdl '/Output'],'VariableName','y','SaveFormat','Timeseries');
    add_line(mdl,'Reference/1','Error/1'); add_line(mdl,'Error/1','K/1');
    add_line(mdl,'K/1','G/1'); add_line(mdl,'G/1','H/1');
    add_line(mdl,'H/1','Error/2'); add_line(mdl,'G/1','Output/1');
    set_param(mdl,'Solver','ode45','StopTime','20','RelTol','1e-10','AbsTol','1e-12', ...
        'OutputOption','SpecifiedOutputTimes','OutputTimes',mat2str(c.time(:).',17),'ReturnWorkspaceOutputs','on');
    save_system(mdl,fullfile(out,[mdl '.slx']));
    sim(mdl); % calentamiento y compilacion excluidos de medicion
    timings=zeros(1,5);
    for trial=1:5
        clock=tic; run=sim(mdl); timings(trial)=toc(clock)*1000;
    end
    ts=run.get('y'); y=interp1(ts.Time,squeeze(ts.Data),c.time,'linear');
    err=max(abs(y(:)-c.output(:)));
    subplot(2,2,i); plot(c.time,c.output,'b--',c.time,y,'r:','LineWidth',1.6);
    grid on; title(sprintf('%s | error %.3g',c.name,err));
    xlabel('Tiempo (s)'); ylabel('Salida'); legend('ControlLab','Simulink');
    s=1j*c.omega(:); loop=c.k*polyval(c.gNum,s).*polyval(c.hNum,s)./(polyval(c.gDen,s).*polyval(c.hDen,s));
    magnitude=20*log10(abs(loop));
    results(i).name=c.name;
    results(i).maxStepError=err;
    results(i).passedStepTolerance=err<1e-6;
    results(i).simulinkMedianWallMs=median(timings);
    results(i).simulinkWallMs=timings;
    results(i).polynomialBodeMaxErrorDb=max(abs(magnitude(:)-c.magnitude(:)));
    results(i).time=c.time; results(i).simulinkOutput=y;
    close_system(mdl,0);
end
exportgraphics(gcf,fullfile(out,'comparacion-simulink.png'),'Resolution',160);
fid=fopen(fullfile(out,'comparacion-simulink.json'),'w');
if fid<0, error('No se pudo escribir el informe'); end
cleanup=onCleanup(@()fclose(fid)); fprintf(fid,'%s',jsonencode(results));
disp(struct2table(rmfield(results,{'time','simulinkOutput','simulinkWallMs'})));
fprintf('Resultados guardados en: %s\n',out);
