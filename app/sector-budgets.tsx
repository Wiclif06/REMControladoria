'use client';
import {useState} from 'react';
import {Plus,Building2,ShieldCheck} from 'lucide-react';
import {BUDGET_GROUPS} from './budget-groups';
export default function SectorBudgets({areas,busy,onSave}:{areas:{name:string}[];busy:boolean;onSave:(b:any)=>Promise<boolean>}){
 const [name,setName]=useState('');
 return <section className="panel access sector-budgets"><div className="panel-heading"><div><h2>Setores da empresa</h2><p>Organize as equipes e vincule cada gestor à sua área.</p></div><Building2 size={22}/></div><div className="budget-assignments"><ShieldCheck size={18}/><span>Todos os setores podem preencher os 134 tipos de despesa. Cada gestor continua acessando somente os dados do próprio setor; a Controladoria acompanha todas as áreas.</span></div><form className="sector-create-simple" onSubmit={async e=>{e.preventDefault();if(await onSave({action:'createArea',name,groups:BUDGET_GROUPS.map(g=>g.id)}))setName('');}}><label>Nome do setor<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Suprimentos"/></label><button className="primary" disabled={busy||!name.trim()}><Plus size={16}/> Criar setor</button></form><div className="sector-directory">{areas.map(a=><article key={a.name}><Building2 size={18}/><div><strong>{a.name}</strong><small>Todos os tipos de orçamento liberados</small></div></article>)}</div></section>;
}
