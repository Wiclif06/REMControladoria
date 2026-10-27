import {BUDGET_STAGES,MONTHS} from './budget-catalog';
import {cell,excelRow,worksheet,excelFile,column} from './excel';
import {type BudgetPlan} from './budget-types';

/** All values in BudgetPlan are integer cents. The expense catalog preserves the
 * original template row ids (6..173); internal automatic categories are appended. */
type Stage = (typeof BUDGET_STAGES)[number];
const money = (amount:number) => amount/100;
const isDetail = (stage:Stage) => /^\d+$/.test(stage.id);
const ordered = (stages:readonly Stage[]) =>
 [...stages].filter(isDetail).sort((a,b)=>Number(a.id)-Number(b.id));
const annual = (v:number[]) => v.reduce((a,b)=>a+b,0);
const months = Array.from({length:12},(_,i)=>i);
const amountsFor = (plans:BudgetPlan[],id:string) =>
 months.map(m=>plans.reduce((sum,p)=>sum+(p.amounts[id]?.[m]||0),0));

export function budgetSheet(plans:BudgetPlan[],year:number,stages:readonly Stage[]=BUDGET_STAGES,name='Despesas Administrativas'){
 const rows:string[] = [], merges:string[] = [];
 const detailRowsById=new Map<string,number>(),specialRows=new Map<string,number>();
 const byId = ordered(stages);
 const scopeLabel=new Set(plans.map(p=>p.sector)).size===1?(plans[0]?.sector||'CONSOLIDADO'):'TODAS AS ÁREAS';
 const companyLabel=new Set(plans.map(p=>p.company)).size===1?(plans[0]?.company||'TODAS AS EMPRESAS'):'TODAS AS EMPRESAS';
 rows.push(excelRow(1,cell(1,0,'REM  /  CONTROLADORIA',45),38));merges.push('A1:O1');
 rows.push(excelRow(2,cell(2,0,`PLANEJAMENTO ORÇAMENTÁRIO  •  ${year}`,45),31));merges.push('A2:O2');
 rows.push(excelRow(3,cell(3,0,'EMPRESA',46)+cell(3,1,companyLabel,46)+cell(3,7,'ÁREA',46)+cell(3,8,scopeLabel,46),29));
 rows.push(excelRow(4,cell(4,0,'DESPESAS ADMINISTRATIVAS  |  VALORES EM R,category='',group='';
 type Subtotal={row:number;detailRows:number[]};
 const categories:Subtotal[]=[],groups:Subtotal[]=[];
 let currentCategory:Subtotal|null=null,currentGroup:Subtotal|null=null;
 const append=(r:number,values:string,height=23)=>rows.push(excelRow(r,values,height));
 const finishGroup=()=>{if(currentGroup)groups.push(currentGroup);currentGroup=null};
 const finishCategory=()=>{finishGroup();if(currentCategory)categories.push(currentCategory);currentCategory=null};
 for(const s of byId){
   if(s.category!==category){finishCategory();category=s.category;group='';currentCategory={row:n,detailRows:[]};append(n,cell(n,1,category,48),30);n++;}
   if(s.group!==group){finishGroup();group=s.group;currentGroup={row:n,detailRows:[]};append(n,cell(n,1,group,49),26);n++;}
   const values=amountsFor(plans,s.id);
   detailRowsById.set(s.id,n);currentCategory!.detailRows.push(n);currentGroup!.detailRows.push(n);
   append(n,cell(n,0,s.code,n%2?50:51)+cell(n,1,s.name,n%2?50:51)+values.map((v,m)=>cell(n,m+2,money(v),n%2?38:52)).join('')+cell(n,14,money(annual(values)),n%2?39:52,`SUM(C${n}:N${n})`),n%2?23:24);
   n++;
 }
 finishCategory();
 // Automatic bookkeeping items without an accounting code are explicitly listed,
 // rather than silently disappearing from the consolidated export.
 const special=stages.filter(s=>!isDetail(s)&&plans.some(p=>p.amounts[s.id]?.some(v=>v!==0)));
 if(special.length){
  const title=n++;append(title,cell(title,1,'OUTROS LANÇAMENTOS AUTOMÁTICOS',48),30);
  const st:Subtotal={row:title,detailRows:[]};categories.push(st);
  for(const s of special){const values=amountsFor(plans,s.id);st.detailRows.push(n);specialRows.set(s.id,n);
   append(n,cell(n,0,s.code)+cell(n,1,s.name)+values.map((v,m)=>cell(n,m+2,money(v),30)).join('')+cell(n,14,money(annual(values)),31,`SUM(C${n}:N${n})`));n++;}
 }
 for(const subtotal of [...groups,...categories]){
  const r=subtotal.row, refs=subtotal.detailRows;
  const values=months.map(m=>refs.reduce((sum,detailRow)=>{const stage=stages.find(s=>detailRowsById.get(s.id)===detailRow||specialRows.get(s.id)===detailRow);return sum+(stage?amountsFor(plans,stage.id)[m]:0);},0));
  const idx=rows.findIndex(row=>row.startsWith(`<row r="${r}"`));
  if(idx>=0)rows[idx]=rows[idx].replace('</row>',values.map((v,m)=>cell(r,m+2,money(v),54,refs.length?refs.map(rr=>`${column(m+2)}${rr}`).join('+'):'0')).join('')+cell(r,14,money(annual(values)),54,`SUM(C${r}:N${r})`)+ '</row>');
 }
 const totalRows=categories.map(c=>c.row);
 const total=months.map(m=>stages.reduce((sum,s)=>sum+amountsFor(plans,s.id)[m],0));
 append(n,cell(n,0,'TOTAL GERAL',45)+cell(n,1,'ORÇAMENTO CONSOLIDADO',45)+total.map((v,m)=>cell(n,m+2,money(v),53,totalRows.map(rr=>`${column(m+2)}${rr}`).join('+')||'0')).join('')+cell(n,14,money(annual(total)),53,`SUM(C${n}:N${n})`),36);
 return {name,xml:worksheet(rows,[22,63,...Array(12).fill(18),22],merges,5)};
}
export function makeBudgetReport(plans:BudgetPlan[],year:number,stages:readonly Stage[]=BUDGET_STAGES){
 const sheets=[budgetSheet(plans,year,stages,'Consolidado')];
 const companies=[...new Set(plans.map(p=>p.company))];
 for(const company of companies) sheets.push(budgetSheet(plans.filter(p=>p.company===company),year,stages,company.slice(0,31)));
 return excelFile(sheets);
}
,46),29));merges.push('A4:O4');
 rows.push(excelRow(5,['CONTA CONTÁBIL','DESCRIÇÃO',...MONTHS.map(m=>m.toUpperCase()),'TOTAL ANUAL'].map((label,i)=>cell(5,i,label,47)).join(''),34));
 let n=6,category='',group='';
 type Subtotal={row:number;detailRows:number[]};
 const categories:Subtotal[]=[],groups:Subtotal[]=[];
 let currentCategory:Subtotal|null=null,currentGroup:Subtotal|null=null;
 const append=(r:number,values:string,height=23)=>rows.push(excelRow(r,values,height));
 const finishGroup=()=>{if(currentGroup)groups.push(currentGroup);currentGroup=null};
 const finishCategory=()=>{finishGroup();if(currentCategory)categories.push(currentCategory);currentCategory=null};
 for(const s of byId){
   if(s.category!==category){finishCategory();category=s.category;group='';currentCategory={row:n,detailRows:[]};append(n,cell(n,1,category,24),28);n++;}
   if(s.group!==group){finishGroup();group=s.group;currentGroup={row:n,detailRows:[]};append(n,cell(n,1,group,8),25);n++;}
   const values=amountsFor(plans,s.id);
   detailRowsById.set(s.id,n);currentCategory!.detailRows.push(n);currentGroup!.detailRows.push(n);
   append(n,cell(n,0,s.code)+cell(n,1,s.name)+values.map((v,m)=>cell(n,m+2,money(v),30)).join('')+cell(n,14,money(annual(values)),31,`SUM(C${n}:N${n})`));
   n++;
 }
 finishCategory();
 // Automatic bookkeeping items without an accounting code are explicitly listed,
 // rather than silently disappearing from the consolidated export.
 const special=stages.filter(s=>!isDetail(s)&&plans.some(p=>p.amounts[s.id]?.some(v=>v!==0)));
 if(special.length){
  const title=n++;append(title,cell(title,1,'OUTROS LANÇAMENTOS AUTOMÁTICOS',24),28);
  const st:Subtotal={row:title,detailRows:[]};categories.push(st);
  for(const s of special){const values=amountsFor(plans,s.id);st.detailRows.push(n);specialRows.set(s.id,n);
   append(n,cell(n,0,s.code)+cell(n,1,s.name)+values.map((v,m)=>cell(n,m+2,money(v),30)).join('')+cell(n,14,money(annual(values)),31,`SUM(C${n}:N${n})`));n++;}
 }
 for(const subtotal of [...groups,...categories]){
  const r=subtotal.row, refs=subtotal.detailRows;
  const values=months.map(m=>refs.reduce((sum,detailRow)=>{const stage=stages.find(s=>detailRowsById.get(s.id)===detailRow||specialRows.get(s.id)===detailRow);return sum+(stage?amountsFor(plans,stage.id)[m]:0);},0));
  const idx=rows.findIndex(row=>row.startsWith(`<row r="${r}"`));
  if(idx>=0)rows[idx]=rows[idx].replace('</row>',values.map((v,m)=>cell(r,m+2,money(v),30,refs.length?refs.map(rr=>`${column(m+2)}${rr}`).join('+'):'0')).join('')+cell(r,14,money(annual(values)),31,`SUM(C${r}:N${r})`)+ '</row>');
 }
 const totalRows=categories.map(c=>c.row);
 const total=months.map(m=>stages.reduce((sum,s)=>sum+amountsFor(plans,s.id)[m],0));
 append(n,cell(n,1,'TOTAL GERAL',24)+total.map((v,m)=>cell(n,m+2,money(v),30,totalRows.map(rr=>`${column(m+2)}${rr}`).join('+')||'0')).join('')+cell(n,14,money(annual(total)),31,`SUM(C${n}:N${n})`),30);
 return {name,xml:worksheet(rows,[21,63,...Array(13).fill(18)],merges,3)};
}
export function makeBudgetReport(plans:BudgetPlan[],year:number,stages:readonly Stage[]=BUDGET_STAGES){
 const sheets=[budgetSheet(plans,year,stages,'Consolidado')];
 const companies=[...new Set(plans.map(p=>p.company))];
 for(const company of companies) sheets.push(budgetSheet(plans.filter(p=>p.company===company),year,stages,company.slice(0,31)));
 return excelFile(sheets);
}
