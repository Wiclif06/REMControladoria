import {BUDGET_STAGES,MONTHS} from './budget-catalog';
import {cell,excelRow,worksheet,excelFile,column} from './excel';
import type {BudgetPlan} from './budget-types';

type Stage=(typeof BUDGET_STAGES)[number];
const money=(cents:number)=>cents/100;
const months=Array.from({length:12},(_,i)=>i);
const isCatalogStage=(s:Stage)=>/^\d+$/.test(s.id);
const amountsFor=(plans:BudgetPlan[],id:string)=>months.map(m=>plans.reduce((sum,p)=>sum+(p.amounts[id]?.[m]||0),0));
const annual=(values:number[])=>values.reduce((a,b)=>a+b,0);

export function budgetSheet(plans:BudgetPlan[],year:number,stages:readonly Stage[]=BUDGET_STAGES,name='Despesas Administrativas'){
 const rows:string[]=[],merges=['A1:O1','A2:O2','A4:O4'];
 const detailRows=new Map<number,string>();
 const categories:{row:number;details:number[]}[]=[];
 const groups:{row:number;details:number[]}[]=[];
 const company=new Set(plans.map(p=>p.company)).size===1?(plans[0]?.company||'TODAS AS EMPRESAS'):'TODAS AS EMPRESAS';
 const sector=new Set(plans.map(p=>p.sector)).size===1?(plans[0]?.sector||'TODAS AS ÁREAS'):'TODAS AS ÁREAS';
 rows.push(excelRow(1,cell(1,0,'REM  /  CONTROLADORIA',45),38));
 rows.push(excelRow(2,cell(2,0,`ORÇAMENTO ${year} — DESPESAS ADMINISTRATIVAS`,45),32));
 rows.push(excelRow(3,cell(3,0,'ÁREA:',46)+cell(3,1,sector,46)+cell(3,2,'GESTOR:',46)+cell(3,3,'CONTROLADORIA',46)+cell(3,7,'EMPRESA:',46)+cell(3,8,company,46),29));
 rows.push(excelRow(4,cell(4,0,'MODELO REM  •  PREVISÃO ANUAL  •  VALORES EM R$',46),29));
 rows.push(excelRow(5,['ETAPA','DESCRIÇÃO',...MONTHS.map(m=>`${m.slice(0,3).toLowerCase()}-${String(year).slice(-2)}`),'TOTAL'].map((v,c)=>cell(5,c,v,47)).join(''),34));
 let n=6,category='',group='',currentCategory:{row:number;details:number[]}|null=null,currentGroup:{row:number;details:number[]}|null=null;
 const push=(r:number,data:string,height=23)=>rows.push(excelRow(r,data,height));
 const finishGroup=()=>{if(currentGroup)groups.push(currentGroup);currentGroup=null;};
 const finishCategory=()=>{finishGroup();if(currentCategory)categories.push(currentCategory);currentCategory=null;};
 const detailed=stages.filter(isCatalogStage).sort((a,b)=>Number(a.id)-Number(b.id));
 for(const stage of detailed){
  if(stage.category!==category){finishCategory();category=stage.category;group='';currentCategory={row:n,details:[]};push(n,cell(n,1,category,48),30);n++;}
  if(stage.group!==group){finishGroup();group=stage.group;currentGroup={row:n,details:[]};push(n,cell(n,1,group,49),26);n++;}
  const values=amountsFor(plans,stage.id);
  detailRows.set(n,stage.id);currentCategory!.details.push(n);currentGroup!.details.push(n);
  push(n,cell(n,0,stage.code,n%2?50:51)+cell(n,1,stage.name,n%2?50:51)+values.map((v,m)=>cell(n,m+2,money(v),n%2?38:52)).join('')+cell(n,14,money(annual(values)),n%2?39:52,`SUM(C${n}:N${n})`),n%2?23:24);
  n++;
 }
 finishCategory();
 const extras=stages.filter(s=>!isCatalogStage(s)&&plans.some(p=>p.amounts[s.id]?.some(v=>v!==0)));
 if(extras.length){
  const title=n++;push(title,cell(title,1,'OUTROS LANÇAMENTOS AUTOMÁTICOS',48),30);
  const cat={row:title,details:[] as number[]};categories.push(cat);
  for(const stage of extras){const values=amountsFor(plans,stage.id);detailRows.set(n,stage.id);cat.details.push(n);
   push(n,cell(n,0,stage.code,n%2?50:51)+cell(n,1,stage.name,n%2?50:51)+values.map((v,m)=>cell(n,m+2,money(v),n%2?38:52)).join('')+cell(n,14,money(annual(values)),n%2?39:52,`SUM(C${n}:N${n})`));n++;}
 }
 for(const subtotal of [...groups,...categories]){
  const r=subtotal.row,refs=subtotal.details;
  const values=months.map(m=>refs.reduce((sum,row)=>sum+plans.reduce((acc,p)=>acc+(p.amounts[detailRows.get(row)!]?.[m]||0),0),0));
  const idx=rows.findIndex(line=>line.startsWith(`<row r="${r}"`));
  if(idx>=0)rows[idx]=rows[idx].replace('</row>',values.map((v,m)=>cell(r,m+2,money(v),54,refs.length?refs.map(rr=>`${column(m+2)}${rr}`).join('+'):'0')).join('')+cell(r,14,money(annual(values)),54,`SUM(C${r}:N${r})`)+ '</row>');
 }
 const total=months.map(m=>stages.reduce((sum,s)=>sum+plans.reduce((acc,p)=>acc+(p.amounts[s.id]?.[m]||0),0),0));
 push(n,cell(n,0,'TOTAL GERAL',45)+cell(n,1,'ORÇAMENTO CONSOLIDADO',45)+total.map((v,m)=>cell(n,m+2,money(v),53,categories.map(c=>`${column(m+2)}${c.row}`).join('+')||'0')).join('')+cell(n,14,money(annual(total)),53,`SUM(C${n}:N${n})`),36);
 return {name,xml:worksheet(rows,[22,63,...Array(12).fill(18),22],merges,5)};
}
export function makeBudgetReport(plans:BudgetPlan[],year:number,stages:readonly Stage[]=BUDGET_STAGES){
 const sheets=[budgetSheet(plans,year,stages,'Consolidado')];
 for(const company of [...new Set(plans.map(p=>p.company))])sheets.push(budgetSheet(plans.filter(p=>p.company===company),year,stages,company.slice(0,31)));
 return excelFile(sheets);
}
