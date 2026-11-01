% Generate frozen MATLAB references for the ControlLab HTTP/API suite.
% The catalog contains numeric polynomial coefficients; no input is eval'd.
root = fileparts(mfilename('fullpath'));
catalog = jsondecode(fileread(fullfile(root, 'cases.json')));
reference = struct();
reference.schemaVersion = catalog.schemaVersion;
reference.generatedAt = char(datetime('now', 'TimeZone', 'UTC', 'Format', 'yyyy-MM-dd''T''HH:mm:ss''Z'''));
reference.matlabVersion = version;
reference.matlabRelease = version('-release');
reference.toolboxes = ver;
reference.cases = struct('id', {}, 'runs', {});

for caseIndex = 1:numel(catalog.cases)
    testCase = catalog.cases(caseIndex);
    reference.cases(caseIndex).id = testCase.id;
    reference.cases(caseIndex).runs = cell(1, numel(testCase.runs));
    for runIndex = 1:numel(testCase.runs)
        run = testCase.runs(runIndex);
        item = struct('name', run.name, 'error', '');
        try
            model = testCase.model;
            G = tf(model.gNum(:)', model.gDen(:)');
            H = tf(model.hNum(:)', model.hDen(:)');
            gain = run.payload.k;
            if strcmp(run.payload.mode, 'direct')
                L0 = G * H;
                L = gain * L0;
                T = [];
            else
                L0 = G * H;
                L = gain * L0;
                T = feedback(gain * G, H);
            end

            item.models = struct();
            if strcmp(run.payload.mode, 'direct')
                item.models.g = [];
                item.models.h = [];
            else
                item.models.g = modelData(G);
                item.models.h = modelData(H);
            end
            item.models.l0 = modelData(L0);
            item.models.l = modelData(L);
            item.models.t = modelData(T);
            item.openPoles = rootPairs(pole(L0));
            item.openZeros = rootPairs(zero(L0));
            item.closedPoles = rootPairs(roots(polySum(L0.den{1}, L.num{1})));
            item.baseStability = classify(item.openPoles);
            item.stability = classify(item.closedPoles);
            [item.centroid, item.angles] = locusGeometry(L0);
            item.breakaways = locusBreakaways(L0);
            item.crossings = locusCrossings(L0);

            [gm, pm, wgc, wpc] = margin(L);
            item.margins = struct('gmDb', finiteOrEmpty(20 * log10(gm)), ...
                'gmState', marginState(gm), 'pmDeg', finiteOrEmpty(pm), ...
                'pmState', phaseMarginState(pm), 'wgc', finiteOrEmpty(wpc), ...
                'wpc', finiteOrEmpty(wgc));

            item.temporal = struct('signal', run.payload.temporal.signal, ...
                'time', [], 'output', [], 'impulseWeight', 0);
            if ~isempty(T)
                duration = run.payload.temporal.duration;
                amplitude = run.payload.temporal.amplitude;
                closedRoots = pole(T);
                oscillationSamples = ceil(duration * max(abs(imag(closedRoots)), [], 'all') * 32 / (2*pi)) + 1;
                decaySamples = ceil(duration * max(abs(real(closedRoots)), [], 'all') * 16) + 1;
                sampleCount = max([1001, catalog.time.samples, oscillationSamples, decaySamples]);
                t = linspace(0, duration, sampleCount);
                switch run.payload.temporal.signal
                    case 'step'
                        [y, tOut] = step(T * amplitude, t);
                    case 'ramp'
                        y = lsim(T, amplitude * t, t);
                        tOut = t;
                    case 'impulse'
                        [y, tOut] = impulse(T, t);
                        y = y * amplitude;
                        if numel(T.num{1}) == numel(T.den{1})
                            item.temporal.impulseWeight = finiteOrEmpty(T.num{1}(1) / T.den{1}(1) * amplitude);
                        end
                    otherwise
                        error('Unsupported temporal signal: %s', run.payload.temporal.signal);
                end
                item.temporal.time = tOut(:)';
                item.temporal.output = squeeze(y(:))';
            end
        catch err
            item.error = sprintf('%s: %s', err.identifier, err.message);
        end
        reference.cases(caseIndex).runs{runIndex} = item;
    end
end

edge = catalog.edgeCases.multipleMargins;
edgeModel = tf(edge.model.num(:)', edge.model.den(:)');
edgeMargins = allmargin(edgeModel);
reference.edgeCases.multipleMargins = struct( ...
    'description', edge.description, ...
    'gainMarginsDb', finiteArray(20 * log10(edgeMargins.GainMargin)), ...
    'gainMarginFrequencies', finiteArray(edgeMargins.GMFrequency), ...
    'phaseMarginsDeg', finiteArray(edgeMargins.PhaseMargin), ...
    'phaseMarginFrequencies', finiteArray(edgeMargins.PMFrequency));

outPath = fullfile(root, 'references.json');
fid = fopen(outPath, 'w');
if fid < 0
    error('Could not write reference file: %s', outPath);
end
cleanup = onCleanup(@() fclose(fid));
fwrite(fid, jsonencode(reference, 'PrettyPrint', true), 'char');
fprintf('MATLAB reference file written: %s\n', outPath);
fprintf('Cases: %d; runs: %d\n', numel(reference.cases), sum(arrayfun(@(x) numel(x.runs), catalog.cases)));

function model = modelData(sys)
    if isempty(sys)
        model = [];
        return;
    end
    [num, den] = tfdata(sys, 'v');
    model = struct('num', num, 'den', den, 'poles', rootPairs(pole(sys)), 'zeros', rootPairs(zero(sys)));
end

function rootsOut = rootPairs(values)
    values = values(:);
    rootsOut = [real(values), imag(values)];
end

function result = polySum(a, b)
    a = a(:)';
    b = b(:)';
    if numel(a) < numel(b)
        a = [zeros(1, numel(b) - numel(a)), a];
    elseif numel(b) < numel(a)
        b = [zeros(1, numel(a) - numel(b)), b];
    end
    result = a + b;
end

function [centroid, angles] = locusGeometry(sys)
    p = pole(sys);
    z = zero(sys);
    count = numel(p) - numel(z);
    if count <= 0
        centroid = [];
        angles = [];
        return;
    end
    centroid = (sum(p) - sum(z)) / count;
    [num, den] = tfdata(sys, 'v');
    num = num(:)';
    den = den(:)';
    num = num(find(abs(num) > 0, 1, 'first'):end);
    den = den(find(abs(den) > 0, 1, 'first'):end);
    if isempty(num) || isempty(den) || sign(num(1) / den(1)) >= 0
        offset = 1;
    else
        offset = 0;
    end
    angles = 180 * (2 * (0:count-1) + offset) / count;
end

function values = locusBreakaways(sys)
    [num, den] = tfdata(sys, 'v');
    num = trimLeading(num);
    den = trimLeading(den);
    derivative = polySum(conv(num, polyder(den)), -conv(den, polyder(num)));
    candidates = roots(derivative);
    values = struct('re', {}, 'im', {}, 'k', {});
    for index = 1:numel(candidates)
        candidate = candidates(index);
        if abs(imag(candidate)) > 1e-7
            continue;
        end
        denominator = polyval(num, candidate);
        if abs(denominator) <= 1e-12
            continue;
        end
        gain = -polyval(den, candidate) / denominator;
        if real(gain) >= 0 && abs(imag(gain)) <= 1e-7
            values(end+1) = struct('re', real(candidate), 'im', imag(candidate), 'k', real(gain)); %#ok<AGROW>
        end
    end
end

function values = locusCrossings(sys)
    [num, den] = tfdata(sys, 'v');
    num = trimLeading(num);
    den = trimLeading(den);
    dPower = numel(den)-1:-1:0;
    nPower = numel(num)-1:-1:0;
    product = conv(den .* (1i .^ dPower), num .* ((-1i) .^ nPower));
    condition = imag(product);
    first = find(abs(condition) > 1e-12, 1, 'first');
    if isempty(first)
        values = struct('omega', {}, 'k', {});
        return;
    end
    candidates = roots(condition(first:end));
    values = struct('omega', {}, 'k', {});
    for index = 1:numel(candidates)
        omega = candidates(index);
        if abs(imag(omega)) > 1e-7 || real(omega) <= 1e-8
            continue;
        end
        response = -polyval(den, 1i * real(omega)) / polyval(num, 1i * real(omega));
        if real(response) >= 0 && abs(imag(response)) <= 1e-5
            values(end+1) = struct('omega', real(omega), 'k', real(response)); %#ok<AGROW>
        end
    end
end

function values = trimLeading(values)
    values = values(:)';
    first = find(abs(values) > 0, 1, 'first');
    if isempty(first)
        values = 0;
    else
        values = values(first:end);
    end
end

function state = marginState(value)
    if isempty(value) || isnan(value)
        state = 'undefined';
    elseif isinf(value)
        state = 'infinite';
    else
        state = 'finite';
    end
end

function state = phaseMarginState(value)
    if isempty(value) || ~isfinite(value)
        state = 'undefined';
    else
        state = 'finite';
    end
end

function value = finiteOrEmpty(value)
    if isempty(value) || ~isfinite(value)
        value = [];
    end
end

function values = finiteArray(values)
    values = values(:)';
    values(~isfinite(values)) = NaN;
end

function status = classify(pairs)
    if isempty(pairs)
        status = 'stable';
        return;
    end
    realParts = pairs(:, 1);
    if any(realParts > 1e-7)
        status = 'unstable';
    elseif any(abs(realParts) <= 1e-7)
        status = 'marginal';
    else
        status = 'stable';
    end
end
