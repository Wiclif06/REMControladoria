import {BUDGET_STAGES,MONTHS} from './budget-catalog';
import {cell,excelRow,worksheet,excelFile,column} from './excel';
import type {BudgetPlan} from './budget-types';

type Stage=(typeof BUDGET_STAGES)[number];
type Header={row:number;title:string;type:'category'|'group'};
/** Fixed template coordinates from "Template ORÇAMENTO 2027 - Despesas Administrativas".
 * Every regular stage ID is its original worksheet row number. */
const HEADERS:Header[]=[
 {row:4,title:'DESPESAS COM PESSOAL',type:'category'},
 {row:5,title:'Despesas com salários',type:'group'},
 {row:16,title:'Encargos Sociais',type:'group'},
 {row:21,title:'Benefícios',type:'group'},
 {row:31,title:'Sindicatos e Associações',type:'group'},
 {row:38,title:'Demais Despesas com Pessoal',type:'group'},
 {row:42,title:'DESPESA DE TI',type:'category'},
 {row:43,title:'Softwares e Licenças',type:'group'},
 {row:45,title:'Computadores e Periféricos',type:'group'},
 {row:51,title:'Sites',type:'group'},
 {row:53,title:'DESPESAS ADMINISTRATIVAS',type:'category'},
 {row:54,title:'Aluguel e Condomínio',type:'group'},
 {row:60,title:'Contas de Consumo',type:'group'},
 {row:67,title:'Reparos e Manutenção',type:'group'},
 {row:71,title:'Material de Escritorio / Consumo',type:'group'},
 {row:76,title:'Viagens e Estadias / Locomoção',type:'group'},
 {row:86,title:'Despesas de Manutenção de Veículos',type:'group'},
 {row:88,title:'Combustíveis, Estacionamento e Pedágios',type:'group'},
 {row:93,title:'Documentação',type:'group'},
 {row:97,title:'Seguros de Veículos',type:'group'},
 {row:99,title:'Locação de Veículos',type:'group'},
 {row:101,title:'Legais e Judiciais',type:'group'},
 {row:105,title:'Auditorias e Consultorias',type:'group'},
 {row:109,title:'Marketing e Divulgação',type:'group'},
 {row:113,title:'Outras Despesas Administrativas',type:'group'},
 {row:122,title:'PATRIMONIAIS - ATIVO FIXO',type:'category'},
 {row:123,title:'Manutenção Imóveis Próprios / Terceiros',type:'group'},
 {row:126,title:'TI',type:'group'},
 {row:133,title:'IMPOSTOS E CONTRIBUIÇÕES',type:'category'},
 {row:134,title:'Impostos',type:'group'},
 {row:143,title:'Taxas e Contribuições',type:'group'},
 {row:151,title:'FINANCEIRAS',type:'category'},
 {row:152,title:'Taxas e Tarifas',type:'group'},
 {row:164,title:'Multas e Juros',type:'group'},
 {row:167,title:'DEPÓSITOS JUDICIAIS',type:'category'},
 {row:168,title:'DEPÓSITOS JUDICIAIS',type:'group'}
];
const CENTS=(v:number)=>v/100;
const range=Array.from({length:12},(_,m)=>m);
const monthly=(plans:BudgetPlan[],id:string)=>range.map(m=>plans.reduce((a,p)=>a+(p.amounts[id]?.[m]||0),0));
const total=(v:number[])=>v.reduce((a,b)=>a+b,0);
const detailStages=(stages:readonly Stage[])=>stages.filter(s=>/^\d+$/.test(s.id)&&Number(s.id)>=6&&Number(s.id)<=173);
export function budgetSheet(plans:BudgetPlan[],year:number,stages:readonly Stage[]=BUDGET_STAGES,name='REM Construtora'){
 const details=new Map(detailStages(stages).map(s=>[Number(s.id),s]));
 const headers=new Map(HEADERS.map(h=>[h.row,h]));
 const rows:string[]=[];
 const company=plans.length&&new Set(plans.map(p=>p.company)).size===1?plans[0].company:name;
 const sector=plans.length&&new Set(plans.map(p=>p.sector)).size===1?plans[0].sector:'TODAS AS ÁREAS';
 rows.push(excelRow(1,cell(1,0,'Área:',19)+cell(1,1,sector,3)+cell(1,2,'Gestor:',20)+cell(1,3,'Controladoria',3)+cell(1,7,'Empresa:',20)+cell(1,8,company,3),27));
 rows.push(excelRow(2,cell(2,1,`ORÇAMENTO ${year} — DESPESAS ADMINISTRATIVAS`,24),26));
 rows.push(excelRow(3,['ETAPA','DESCRIÇÃO',...MONTHS.map(m=>`${m.slice(0,3).toLowerCase()}-${String(year).slice(-2)}`),'Total'].map((v,i)=>cell(3,i,v,4)).join(''),32));
 const valuesByRow=new Map<number,number[]>();
 for(let r=4;r<=173;r++){
  const h=headers.get(r),s=details.get(r);
  if(h){rows.push(excelRow(r,cell(r,1,h.title,h.type==='category'?24:8),h.type==='category'?29:25));}
  else if(s){const values=monthly(plans,s.id);valuesByRow.set(r,values);
   rows.push(excelRow(r,cell(r,0,s.code,9)+cell(r,1,s.name,3)+values.map((v,m)=>cell(r,m+2,CENTS(v),30)).join('')+cell(r,14,CENTS(total(values)),31,`SUM(C${r}:N${r})`),23));
  }else rows.push(excelRow(r,'',23));
 }
 const categoryRows=HEADERS.filter(h=>h.type==='category').map(h=>h.row);
 for(const h of HEADERS){
  const next=HEADERS.find(x=>x.row>h.row&&(h.type==='group'||x.type==='category'));
  const end=(next?.row||174)-1;
  // Category subtotals include all detail rows through the next category;
  // group subtotals end before the next category/group.
  const detailRows=[...valuesByRow.keys()].filter(r=>r>h.row&&r<=end);
  const sums=range.map(m=>detailRows.reduce((a,r)=>a+(valuesByRow.get(r)?.[m]||0),0));
  const index=rows.findIndex(x=>x.startsWith(`<row r="${h.row}"`));
  rows[index]=rows[index].replace('</row>',sums.map((v,m)=>cell(h.row,m+2,CENTS(v),h.type==='category'?54:30,detailRows.length?detailRows.map(r=>`${column(m+2)}${r}`).join('+'):'0')).join('')+cell(h.row,14,CENTS(total(sums)),h.type==='category'?54:31,`SUM(C${h.row}:N${h.row})`)+ '</row>');
 }
 let nextRow=174;
 const extras=stages.filter(s=>!/^\d+$/.test(s.id)&&plans.some(p=>p.amounts[s.id]?.some(v=>v!==0)));
 const extraRows:number[]=[];
 if(extras.length){
  rows.push(excelRow(nextRow,cell(nextRow,1,'OUTROS CUSTOS AUTOMÁTICOS',24),28));categoryRows.push(nextRow++);
  for(const s of extras){const vals=monthly(plans,s.id);extraRows.push(nextRow);
   rows.push(excelRow(nextRow,cell(nextRow,0,s.code,9)+cell(nextRow,1,s.name,3)+vals.map((v,m)=>cell(nextRow,m+2,CENTS(v),30)).join('')+cell(nextRow,14,CENTS(total(vals)),31,`SUM(C${nextRow}:N${nextRow})`)));nextRow++;}
  const cat=categoryRows.at(-1)!;
  const vals=range.map(m=>extras.reduce((a,s)=>a+monthly(plans,s.id)[m],0));
  const i=rows.findIndex(x=>x.startsWith(`<row r="${cat}"`));
  rows[i]=rows[i].replace('</row>',vals.map((v,m)=>cell(cat,m+2,CENTS(v),54,extraRows.map(r=>`${column(m+2)}${r}`).join('+'))).join('')+cell(cat,14,CENTS(total(vals)),54,`SUM(C${cat}:N${cat})`)+ '</row>');
 }
 const grand=range.map(m=>stages.reduce((a,s)=>a+monthly(plans,s.id)[m],0));
 rows.push(excelRow(nextRow,cell(nextRow,1,'TOTAL GERAL DO ORÇAMENTO',24)+grand.map((v,m)=>cell(nextRow,m+2,CENTS(v),53,categoryRows.map(r=>`${column(m+2)}${r}`).join('+'))).join('')+cell(nextRow,14,CENTS(total(grand)),53,`SUM(C${nextRow}:N${nextRow})`),34));
 return {name,xml:worksheet(rows,[22,63,...Array(12).fill(18),22],[],3)};
}
export function makeBudgetReport(plans:BudgetPlan[],year:number,stages:readonly Stage[]=BUDGET_STAGES){
 return excelFile(['REM Construtora','REM Vendas','ALPAN'].map(name=>budgetSheet(plans.filter(p=>p.company===name),year,stages,name)));
}
