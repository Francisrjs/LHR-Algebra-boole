import { useRef, useState } from "react";
import type { ReactNode } from "react";

export default function GraphicPanel({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="tutor-card tutor-visual" aria-label="Construcción gráfica">
      <header className="tutor-visual-header">
        <h2>Construcción gráfica</h2>
        <button ref={trigger} aria-haspopup="dialog" onClick={() => {
          setExpanded(true);
          dialog.current?.showModal();
        }}>Ampliar</button>
      </header>
      {!expanded && children}
      <dialog ref={dialog} className="tutor-dialog" aria-label="Construcción gráfica ampliada"
        onClose={() => {
          setExpanded(false);
          trigger.current?.focus();
        }}>
        <button type="button" autoFocus onClick={() => dialog.current?.close()}>Cerrar gráfico</button>
        {expanded && children}
      </dialog>
    </section>
  );
}
