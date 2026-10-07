import {costs,salaryMonths,type CostInput} from './costs';
import type {BudgetAmounts,BudgetPlan} from './budget-types';
export const PAYROLL_STAGE_IDS=['6','15','17','18','19','20','22','23','14','29'];
export type PayrollEmployee=CostInput & {company:string;sector:string};
export function payrollEmployee(row:any):PayrollEmployee{return {...row,adjustmentRate:row.adjustment_rate??row.adjustmentRate,adjustmentMonth:row.adjustment_month??row.adjustmentMonth,inssRate:row.inss_rate??row.inssRate,fgtsRate:row.fgts_rate??row.fgtsRate,vacationFactor:row.vacation_factor??row.vacationFactor,thirteenthFactor:row.thirteenth_factor??row.thirteenthFactor,bonusAnnual:row.bonus_annual??row.bonusAnnual,insuranceMonthly:row.insurance_monthly??row.insuranceMonthly,otherAnnual:row.other_annual??row.otherAnnual};}
const portion=(annual:number,m:number)=>Math.floor(annual/12)+(m<annual%12?1:0);
export function payrollAmounts(employees:PayrollEmployee[]):BudgetAmounts{
 const result:BudgetAmounts=Object.fromEntries(PAYROLL_STAGE_IDS.map(id=>[id,Array(12).fill(0)]));
 for(const e of employees){const salaries=salaryMonths(e),monthly=costs(e).monthlyValues;for(let m=0;m<12;m++){
  const base=costs({...e,salary:salaries[m],adjustmentRate:0});let allocated=0;const provision=(amount:number)=>{const before=portion(allocated,m);allocated+=amount;return portion(allocated,m)-before;};const values:Record<string,number>={
   '6':e.contract==='CLT'?salaries[m]:0,'15':e.contract==='PJ'?salaries[m]:0,
   '17':provision(base.vacation),'18':provision(base.thirteenth),'19':base.inss,'20':base.fgts,
   '22':e.transport,'14':provision(e.bonusAnnual||0),'23':e.meal+provision(e.otherAnnual||0),'29':e.insuranceMonthly||0};
  // Keep cent rounding identical to the employee cost report.
  if(monthly[m]!==Object.values(values).reduce((a,b)=>a+b,0))throw Error('Divergência nos custos de pessoal.');
  for(const id of PAYROLL_STAGE_IDS)result[id][m]+=values[id];
 }}return result;
}
export function withPayroll(plans:BudgetPlan[],employees:PayrollEmployee[],year:number):BudgetPlan[]{
 const byScope=new Map(plans.map(p=>[JSON.stringify([p.company,p.sector]),p]));
 for(const e of employees){const key=JSON.stringify([e.company,e.sector]);if(!byScope.has(key))byScope.set(key,{year,company:e.company,sector:e.sector,amounts:{},status:'draft',version:0,note:'',updated_by:'Cadastro de funcionários',updated_at:new Date().toISOString()});}
 return [...byScope.values()].map(p=>({...p,amounts:{...p.amounts,...payrollAmounts(employees.filter(e=>e.company===p.company&&e.sector===p.sector))}}));
}
