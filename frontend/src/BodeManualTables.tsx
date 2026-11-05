import type {BodeDecomposition} from './types';
import {manualRows} from './bodeManual';
import {Latex} from './BodeSummary';
const fmt=(n:number|null|undefined)=>n==null?'No definida':n.toLocaleString('es-AR',{maximumSignificantDigits:7});
export default function BodeManualTables({data}:{data:BodeDecomposition}){
 const rows=manualRows(data);
 return <div className="bode-manual-tables">
 {(['magnitude','phase'] as const).map(kind=>{const phase=kind==='phase',unit=phase?'°':'dB';return <div key={kind}><h3>Tabla de {phase?'fase':'magnitud'} por contribuciones ({unit})</h3><div className="bode-table-scroll" tabIndex={0} role="region" aria-label={`${phase?'Fase':'Magnitud'} por contribuciones`}><table><thead><tr><th>ω (rad/s)</th><th>Ganancia</th>{data.factors.map(f=><th key={f.id}><Latex value={f.latex}/></th>)}<th>Total ({unit})</th></tr></thead><tbody>{rows.map(r=><tr key={r.omega}><td>{fmt(r.omega)}</td><td>{fmt(phase?data.gainPhase:data.gainDb)}</td>{(phase?r.phases:r.magnitudes).map((v,i)=><td key={i}>{fmt(v)}</td>)}<td><b>{fmt(r[kind])}</b></td></tr>)}</tbody></table></div></div>})}
 <p>Cada columna es el aporte acumulado del factor, no el cambio en una década. Sumá cada fila para obtener el total. La ganancia positiva aporta 0°; los polos en el origen aportan −90° cada uno.</p>
 <h3>Puntos y pendientes para dibujar en la hoja</h3>
 <div className="bode-table-scroll" tabIndex={0} role="region" aria-label="Puntos para dibujar"><table><thead><tr><th>ω (rad/s)</th><th>Magnitud al llegar (dB)</th><th>Pendiente del tramo siguiente</th><th>Fase (°)</th></tr></thead><tbody>{rows.map(r=><tr key={r.omega}><td>{fmt(r.omega)}</td><td>{fmt(r.magnitude)}</td><td>{fmt(r.slope)} dB/década</td><td>{fmt(r.phase)}</td></tr>)}</tbody></table></div>
 <p>Marcá estos puntos y unilos con regla. El eje de frecuencia es logarítmico: cada década ocupa el mismo ancho. La pendiente de una fila se aplica después de llegar a esa frecuencia.</p>
 </div>;
}
