import { useEffect, useId, useState } from 'react';
import BlockFormula from './BlockFormula';
import { prepareFormula } from './formulaDraft';
import type { Project } from './types';

type Field = 'g' | 'h' | 'l';
const titles = { g: 'Trayectoria directa · G₀(s)', h: 'Realimentación · H(s)', l: 'Transferencia base · L₀(s)' };
export default function FormulaEditor({ project, busy, onSubmit }: {
  project: Project; busy: boolean; onSubmit: (patch: Partial<Project>) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState({ g: project.g, h: project.h, l: project.l });
  const [sent, setSent] = useState(false);
  useEffect(() => {
    setDraft({ g: project.g, h: project.h, l: project.l });
    setSent(false);
  }, [project.g, project.h, project.l, project.mode]);
  const fields: Field[] = project.mode === 'separate' ? ['g', 'h'] : ['l'];
  const previews = fields.map(key => {
    try {
      return { key, normalized: prepareFormula(draft[key], project.parameters.map(p => p.name), key !== 'h'), error: '' };
    } catch (e) {
      return { key, normalized: '', error: e instanceof Error ? e.message : String(e) };
    }
  });
  const changed = fields.some(key => draft[key] !== project[key]);
  const invalid = previews.some(x => x.error);
  return <form className="formula-editor" noValidate onSubmit={e => {
    e.preventDefault();
    setSent(true);
    if (invalid) {
      document.getElementById(`${id}-${previews.find(x => x.error)!.key}`)?.focus();
      return;
    }
    onSubmit(Object.fromEntries(fields.map(key => [key, draft[key]])));
  }}>
    {previews.map(({ key, normalized, error }) => <div className="formula-field" key={key}>
      <label htmlFor={`${id}-${key}`}>{titles[key]}</label>
      <textarea id={`${id}-${key}`} data-testid={key + '-input'}
        aria-label={key === 'g' ? 'G(s)' : key === 'h' ? 'H(s)' : 'L(s)'}
        aria-invalid={!!error} aria-describedby={`${id}-${key}-preview`}
        spellCheck={false} value={draft[key]} onChange={e => {
          setDraft({ ...draft, [key]: e.target.value }); setSent(false);
        }} />
      <div id={`${id}-${key}-preview`} className={`formula-preview ${error ? 'is-invalid' : ''}`}>
        <div className="formula-preview-heading"><span>Vista previa</span><span>{error ? 'Revisar expresión' : draft[key] !== project[key] ? 'Borrador' : 'Modelo enviado'}</span></div>
        {error ? <div role="alert" className="formula-preview-error"><strong>ERROR</strong><span>{error}</span></div>
          : <div className="formula-preview-math" tabIndex={0} role="region" aria-label={`Vista previa de ${key.toUpperCase()}(s)`}>
            <BlockFormula expression={normalized} display />
          </div>}
      </div>
    </div>)}
    <div className="formula-submit">
      <button className="primary" type="submit" disabled={busy}>{busy ? 'CALCULANDO…' : 'ENVIAR'}</button>
      <p role="status">{invalid ? (sent ? 'No se envió. Corregí la expresión indicada.' : 'Completá la expresión para enviarla.') : changed ? 'Borrador sin enviar. Los gráficos conservan el modelo anterior.' : 'Editá la fórmula y pulsá ENVIAR para actualizar los gráficos.'}</p>
    </div>
  </form>;
}
