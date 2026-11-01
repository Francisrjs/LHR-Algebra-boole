import BlockFormula from "./BlockFormula";
import examples from "./blockExamples.json";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  reconnectEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type Kind = "input" | "output" | "transfer_function" | "gain" | "sum" | "junction";
type SemanticNode = { id: string; type: Kind; name?: string; expression?: string; inputs?: string[]; signs?: Record<string, string>; position: {x:number;y:number}; outputs?:string[] };
type SemanticEdge = {id:string;sourceNodeId:string;sourcePortId:string;targetNodeId:string;targetPortId:string};
export type Diagram = {schemaVersion:1;nodes:SemanticNode[];edges:SemanticEdge[]};
type NodeData = {kind:Kind;label:string;expression:string;ports:string[];signs:Record<string,string>;onSign?:(port:string,sign:string)=>void};
const initial: Diagram = { schemaVersion:1, nodes:[{id:"R",type:"input",name:"R",position:{x:60,y:170},outputs:["out"]},{id:"G1",type:"transfer_function",name:"G1",expression:"1/(s+1)",position:{x:290,y:170},inputs:["in"],outputs:["out"]},{id:"Y",type:"output",name:"Y",position:{x:560,y:170},inputs:["in"]}],edges:[{id:"e-R-G1",sourceNodeId:"R",sourcePortId:"out",targetNodeId:"G1",targetPortId:"in"},{id:"e-G1-Y",sourceNodeId:"G1",sourcePortId:"out",targetNodeId:"Y",targetPortId:"in"}] };

function Block({data}: {data:NodeData}) {
  const source=data.kind==="input"||data.kind==="transfer_function"||data.kind==="gain"||data.kind==="sum"||data.kind==="junction";
  const target=data.kind!=="input";
  return <div className={`diagram-node ${data.kind}`}>
    {target&&data.ports.map((port,i)=><div className="diagram-port" key={port}><Handle type="target" position={Position.Left} id={port} style={{top:`${38+i*23}px`}} />{data.kind==="sum"&&<button className="sum-sign" title={`Signo de ${port}`} onClick={()=>data.onSign?.(port,data.signs[port]==="+"?"-":"+")}>{data.signs[port]||"?"}</button>}<span>{port}</span></div>)}
    <strong>{data.label}</strong>{data.expression&&<BlockFormula expression={data.expression} />}
    {source&&<Handle type="source" position={Position.Right} id="out" />}
  </div>;
}
const renderers={input:Block,output:Block,transfer_function:Block,gain:Block,sum:Block,junction:Block};
function toFlow(doc:Diagram,onSign:(id:string,port:string,sign:string)=>void):{nodes:Node<NodeData>[];edges:Edge[]} {
  return {nodes:doc.nodes.map(n=>({id:n.id,type:n.type,position:n.position||{x:80,y:80},data:{kind:n.type,label:n.name||n.id,expression:n.expression||"",ports:n.inputs||[],signs:n.signs||{},onSign:(p:string,s:string)=>onSign(n.id,p,s)}})),edges:doc.edges.map(e=>({id:e.id,source:e.sourceNodeId,target:e.targetNodeId,sourceHandle:e.sourcePortId,targetHandle:e.targetPortId,type:"smoothstep",animated:false}))};
}
function fromFlow(nodes:Node<NodeData>[],edges:Edge[]):Diagram {
  return {schemaVersion:1,nodes:nodes.map(n=>({id:n.id,type:n.type as Kind,name:n.data.label,expression:n.data.expression||undefined,inputs:n.data.ports,signs:n.data.signs,outputs:["out"],position:n.position})),edges:edges.map(e=>({id:e.id,sourceNodeId:e.source,sourcePortId:e.sourceHandle||"out",targetNodeId:e.target,targetPortId:e.targetHandle||"in"}))};
}
export default function BlockDiagramEditor({value,onChange,onSolve,onAnalyze}:{value?:Diagram;onChange:(diagram:Diagram)=>void;onSolve:(diagram:Diagram)=>Promise<unknown>;onAnalyze:(expression:string)=>void}) {
  const initialDoc=value||initial;
  const signsChanged=useCallback((id:string,port:string,sign:string)=>{const d=value||initial;onChange({...d,nodes:d.nodes.map(n=>n.id===id?{...n,signs:{...n.signs,[port]:sign}}:n)});setResult(null);},[value,onChange]);
  const converted=useMemo(()=>toFlow(initialDoc,signsChanged),[initialDoc,signsChanged]);
  const [nodes,setNodes,onNodesChange]=useNodesState(converted.nodes);
  const [edges,setEdges,onEdgesChange]=useEdgesState(converted.edges);
  useEffect(()=>{setNodes(converted.nodes);setEdges(converted.edges);},[value]);
  const [selected,setSelected]=useState<string>("");const [result,setResult]=useState<any>(null);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  const [exampleId,setExampleId]=useState("");
  const [transferKey,setTransferKey]=useState("");
  const sync=(ns:Node<NodeData>[],es:Edge[])=>{setNodes(ns);setEdges(es);onChange(fromFlow(ns,es));setResult(null);};
  const connect=useCallback((connection:Connection)=>{const d=fromFlow(nodes,edges);const target=d.nodes.find(n=>n.id===connection.target);if(target?.type!=="sum"&&edges.some(e=>e.target===connection.target&&e.targetHandle===connection.targetHandle))return;sync(nodes,addEdge({...connection,id:crypto.randomUUID(),type:"smoothstep"},edges));},[nodes,edges]);
  const add=(kind:Kind)=>{const id=`${kind}-${crypto.randomUUID().slice(0,5)}`;const inputs=kind==="sum"?["in1","in2"]:kind==="output"? ["in"]:kind==="input"?[]:["in"];const n:Node<NodeData>={id,type:kind,position:{x:180+nodes.length*35,y:100+nodes.length*28},data:{kind,label:kind==="input"?"R":kind==="output"?"Y":id,expression:kind==="gain"?"1":kind==="transfer_function"?"1/(s+1)":"",ports:inputs,signs:kind==="sum"?{in1:"+",in2:"-"}:{}}};sync([...nodes,n],edges);setSelected(id);};
  const updateSelected=(patch:Partial<NodeData>)=>sync(nodes.map(n=>n.id===selected?{...n,data:{...n.data,...patch}}:n),edges);
  const calculate=async()=>{setBusy(true);setError("");try{const d=fromFlow(nodes,edges);await fetch("/api/block-diagram/validate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(async r=>{if(!r.ok)throw Error((await r.json()).detail)});setResult(await onSolve(d));}catch(e){setResult(null);setError(e instanceof Error?e.message:String(e));}finally{setBusy(false)}};
  const active=nodes.find(n=>n.id===selected);
  return <section className="block-workspace" aria-label="Editor interactivo de Ã¡lgebra de bloques">
    <header className="block-workflow"><span><b>01</b> DiseÃ±ar</span><i>â†’</i><span><b>02</b> Conectar</span><i>â†’</i><span><b>03</b> Configurar</span><i>â†’</i><span><b>04</b> Validar y resolver</span><i>â†’</i><span><b>05</b> Analizar</span></header>
    <div className="block-toolbar"><label>Cargar ejemplo<select disabled={busy} value={exampleId} onChange={e=>{const item=examples.find(x=>x.id===e.target.value);if(!item)return;setExampleId(item.id);setError("");setResult(null);setTransferKey("");setSelected("");onChange(structuredClone(item.diagram) as Diagram);}}><option value="">Seleccionar ejemploâ€¦</option>{examples.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label><span>COMPONENTES</span>{(["input","transfer_function","gain","sum","junction","output"] as Kind[]).map(k=><button key={k} onClick={()=>add(k)}>+ {({input:"Entrada",transfer_function:"Transferencia",gain:"Ganancia",sum:"Sumador",junction:"Toma",output:"Salida"})[k]}</button>)}<button className="primary" onClick={calculate} disabled={busy}>{busy?"Calculandoâ€¦":"Validar y calcular"}</button></div>
    <div className="block-layout"><div className="block-canvas"><ReactFlow key={exampleId} nodes={nodes} edges={edges} nodeTypes={renderers} onNodesChange={changes=>{onNodesChange(changes);const removed=changes.filter(c=>c.type==="remove").map(c=>c.id);if(removed.length){setNodes(old=>old.filter(n=>!removed.includes(n.id)));setEdges(old=>old.filter(e=>!removed.includes(e.source)&&!removed.includes(e.target)));onChange(fromFlow(nodes.filter(n=>!removed.includes(n.id)),edges.filter(e=>!removed.includes(e.source)&&!removed.includes(e.target))));}const moved=changes.some(c=>c.type==="position");if(moved){const next=nodes.map(n=>{const change=changes.find(c=>c.type==="position"&&c.id===n.id);return change?.type==="position"&&change.position?{...n,position:change.position}:n});setNodes(next);onChange(fromFlow(next,edges));}}} onEdgesChange={changes=>{onEdgesChange(changes);const removed=changes.filter(c=>c.type==="remove").map(c=>c.id);if(removed.length)onChange(fromFlow(nodes,edges.filter(e=>!removed.includes(e.id))));}} onConnect={connect} onReconnect={(oldEdge,connection)=>sync(nodes,reconnectEdge(oldEdge,connection,edges))} onNodeClick={(_,node)=>setSelected(node.id)} colorMode="dark" defaultEdgeOptions={{style:{stroke:"#65b9b2",strokeWidth:1.6}}} fitView><Background color="#294054" gap={24} /><MiniMap style={{background:"#0b1924"}} nodeColor="#43c5bd" maskColor="#07111bcc" /><Controls /></ReactFlow></div>
    <aside className="block-inspector"><span className="eyebrow">INSPECTOR</span><h3>{active?active.data.label:"SeleccionÃ¡ un bloque"}</h3>{active&&<><label>Nombre<input value={active.data.label} onChange={e=>updateSelected({label:e.target.value})}/></label>{["transfer_function","gain"].includes(active.data.kind)&&<label>FunciÃ³n / ganancia<input value={active.data.expression} onChange={e=>updateSelected({expression:e.target.value})} placeholder="1/(s+1)"/></label>}{active.data.kind==="sum"&&<><p>ConfigurÃ¡ los signos desde cada puerto del sumador.</p><button onClick={()=>{const port=`in${active.data.ports.length+1}`;updateSelected({ports:[...active.data.ports,port],signs:{...active.data.signs,[port]:"+"}})}}>ï¼‹ Agregar puerto</button>{active.data.ports.length>2&&<button onClick={()=>{const port=active.data.ports.at(-1)!;sync(nodes.map(n=>n.id===selected?{...n,data:{...n.data,ports:n.data.ports.slice(0,-1)}}:n),edges.filter(e=>!(e.target===selected&&e.targetHandle===port)))}}>Quitar Ãºltimo puerto</button>}</>}<button onClick={()=>sync(nodes.filter(n=>n.id!==selected),edges.filter(e=>e.source!==selected&&e.target!==selected))}>Eliminar bloque</button></>}</aside></div>
    <section className="block-results"><div>{examples.filter(x=>x.id===exampleId).map(item=>{const ref=(item as any).reference;return ref&&<aside key={item.id}><h3>Referencia del libro · Figura {ref.figure} · página 38</h3><BlockFormula label="C/R" expression={ref.formula} display /><p>Referencia publicada; el cálculo del diagrama actual se muestra debajo.</p>{(item as any).substitutions&&<><p>Valores numéricos de prueba propios. El LGR usa el equivalente como G con realimentación unitaria.</p><pre>{JSON.stringify((item as any).substitutions,null,2)}</pre></>}</aside>})}<span className="eyebrow">RESULTADO</span><h3>Validar y resolver</h3>{error&&<div role="alert" className="error">{error}</div>}{result&&<>{(result as any).relations?.map((r:any)=><div className="block-equation" key={r.output}><BlockFormula label={r.output} expression={r.expression} display /></div>)}<label>Salida / Entrada<select value={transferKey||`${(result as any).transferMatrix?.[0]?.output}|${(result as any).transferMatrix?.[0]?.input}`} onChange={e=>setTransferKey(e.target.value)}>{(result as any).transferMatrix?.map((t:any)=><option key={`${t.output}|${t.input}`} value={`${t.output}|${t.input}`}>{t.output} / {t.input} Â· otras entradas = 0</option>)}</select></label>{(result as any).transferMatrix?.filter((t:any)=>`${t.output}|${t.input}`===(transferKey||`${(result as any).transferMatrix?.[0]?.output}|${(result as any).transferMatrix?.[0]?.input}`)).map((t:any)=><div className="block-equation" key={`${t.output}|${t.input}`}><BlockFormula label={`${t.output}/${t.input}`} expression={t.expression} display /></div>)}<details><summary>Ver datos del cÃ¡lculo</summary><pre>{JSON.stringify(result,null,2)}</pre></details><button className="primary" onClick={()=>{const [out,input]=(transferKey||`${(result as any).transferMatrix?.[0]?.output}|${(result as any).transferMatrix?.[0]?.input}`).split("|");const t=(result as any).transferMatrix?.find((x:any)=>x.output===out&&x.input===input);if(t?.model)onAnalyze(t.model.expression);else setError("Este equivalente simbÃ³lico todavÃ­a no tiene coeficientes numÃ©ricos para el analizador.")}}>Enviar equivalente al analizador</button></>}</div></section>
  </section>;
}
