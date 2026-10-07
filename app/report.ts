import {costs,type CostInput} from './costs';
import {cell,excelRow,worksheet,excelFile,column} from './excel';
import {MONTHS} from './budget-catalog';
export type RecordRow=CostInput & {name:string,company?:string,position:string,sector:string,contract:string,salary:number,meal:number,transport:number,admission?:string,notes?:string};
export function makeReport(input:RecordRow[],areas:string[]){
 const rows:string[]=[],merges=['A1:Q1','A2:Q2','A3:Q3'];let n=1;
 rows.push(excelRow(n,cell(n++,0,'REM CONSTRUTORA | CONTROLADORIA',24),30));
 rows.push(excelRow(n,cell(n++,0,'Gasto por Funcionário',8),27));
 rows.push(excelRow(n,cell(n++,0,'Projeção mensal com reajustes a partir do mês informado, encargos, provisões e benefícios.',3),25));
 const heads=['EMPRESA / SETOR','FUNCIONÁRIO','CARGO','CONTRATO',...MONTHS.map(m=>m.toUpperCase()),'TOTAL ANUAL'];
 rows.push(excelRow(5,heads.map((h,i)=>cell(5,i,h,4)).join(''),28));n=6;const sectorTotals:number[]=[];
 const groups=[...new Set(input.map(e=>JSON.stringify([e.company||'—',e.sector])))].sort();
 for(const key of groups){const [company,sector]=JSON.parse(key),people=input.filter(e=>(e.company||'—')===company&&e.sector===sector).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 rows.push(excelRow(n,cell(n,0,`${company} • ${sector}`,24),26));merges.push(`A${n}:Q${n}`);n++;const start=n;
 for(const e of people){const k=costs(e),annual=k.annual,values=k.monthlyValues.map(v=>v/100);
 rows.push(excelRow(n,cell(n,0,sector)+cell(n,1,e.name)+cell(n,2,e.position)+cell(n,3,e.contract)+values.map((v,i)=>cell(n,i+4,v,30)).join('')+cell(n,16,annual/100,31,`SUM(E${n}:P${n})`)));n++;}
 const total=people.reduce((v,e)=>v+costs(e).annual,0)/100;
 rows.push(excelRow(n,cell(n,0,'TOTAL DO SETOR',8)+cell(n,1,people.length+' funcionários',8)+Array.from({length:12},(_,m)=>cell(n,m+4,people.reduce((v,e)=>{return v+costs(e).monthlyValues[m];},0)/100,30,`SUM(${column(m+4)}${start}:${column(m+4)}${n-1})`)).join('')+cell(n,16,total,31,`SUM(Q${start}:Q${n-1})`),27));sectorTotals.push(n);n+=2;}
 rows.push(excelRow(n,cell(n,0,'TOTAL GERAL',24)+Array.from({length:13},(_,i)=>cell(n,i+4,input.reduce((v,e)=>{const k=costs(e);return v+(i===12?k.annual:k.monthlyValues[i]);},0)/100,31,sectorTotals.length?sectorTotals.map(r=>`${column(i+4)}${r}`).join('+'):'0')).join(''),30));
 n+=3;rows.push(excelRow(n,cell(n,0,'COMPOSIÇÃO DOS CUSTOS • BASE ATUAL',24),28));merges.push(`A${n}:Q${n}`);n++;
 const detailHeaders=['EMPRESA / SETOR','FUNCIONÁRIO','CARGO','CONTRATO','SALÁRIOS / ANO','INSS / ANO','FGTS / ANO','FÉRIAS / ANO','13º / ANO','VR/VA / ANO','VT / ANO','BONIFICAÇÃO / ANO','SEGURO / ANO','OUTROS / ANO','ADMISSÃO','MÉDIA MENSAL','TOTAL ANUAL'];
 rows.push(excelRow(n,detailHeaders.map((h,i)=>cell(n,i,h,4)).join(''),35));n++;
 for(const e of input){const k=costs(e),values=[k.salaryAnnual,k.inss*12,k.fgts*12,k.vacation,k.thirteenth,e.meal*12,e.transport*12,e.bonusAnnual||0,(e.insuranceMonthly||0)*12,e.otherAnnual||0];rows.push(excelRow(n,cell(n,0,`${e.company||'—'} / ${e.sector}`)+cell(n,1,e.name)+cell(n,2,e.position)+cell(n,3,e.contract)+values.map((v,i)=>cell(n,i+4,v/100,30)).join('')+cell(n,14,e.admission||'—')+cell(n,15,k.monthly/100,30)+cell(n,16,k.annual/100,31)));n++;}
 n+=2;rows.push(excelRow(n,cell(n,0,'DISSÍDIO E REAJUSTES • PREVISÃO ANUAL',24),28));merges.push(`A${n}:Q${n}`);n++;
 rows.push(excelRow(n,['EMPRESA','SETOR','FUNCIONÁRIO','CONTRATO','SALÁRIO ATUAL','REAJUSTE %','A PARTIR DE','NOVO SALÁRIO','ACRÉSCIMO ANUAL DO CUSTO'].map((h,i)=>cell(n,i,h,4)).join(''),32));n++;
 for(const e of input.filter(e=>(e.adjustmentRate||0)>0)){const k=costs(e);rows.push(excelRow(n,cell(n,0,e.company||'—')+cell(n,1,e.sector)+cell(n,2,e.name)+cell(n,3,e.contract)+cell(n,4,e.salary/100,30)+cell(n,5,(e.adjustmentRate||0)/100)+cell(n,6,MONTHS[(e.adjustmentMonth||1)-1])+cell(n,7,k.adjustedSalary/100,30)+cell(n,8,k.adjustmentImpact/100,30)));n++;}
 rows.push(excelRow(n,cell(n,0,'Provisões projetadas conforme o salário de cada mês. Benefícios não recebem o reajuste salarial.',3)));merges.push(`A${n}:Q${n}`);
 rows.push(excelRow(n+2,cell(n+2,0,'Emitido em '+new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}))));
 return excelFile([{name:'Gasto por Funcionário',xml:worksheet(rows,[27,32,29,12,...Array(13).fill(17)],merges)}]);
}
