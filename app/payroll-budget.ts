import {costs,type CostInput} from './costs';
import type {BudgetAmounts,BudgetPlan} from './budget-types';
export const PAYROLL_STAGE_IDS=['6','15','17','18','19','20','22','23','14','29','174','25','175'];
export type PayrollEmployee=CostInput & {company:string;sector:string;constructionSite?:string|null};
export function payrollEmployee(row:any):PayrollEmployee{return {...row,healthEnabled:row.health_enabled??row.healthEnabled??!!(row.health_monthly||row.healthMonthly||row.health_copay_monthly||row.healthCopayMonthly),insuranceEnabled:row.insurance_enabled??row.insuranceEnabled??!!(row.insurance_monthly||row.insuranceMonthly),constructionSite:row.construction_site??row.constructionSite??null,chargeRate:row.charge_rate??row.chargeRate,healthMonthly:row.health_monthly??row.healthMonthly,healthEmployeeMonthly:row.health_employee_monthly??row.healthEmployeeMonthly,healthCopayMonthly:row.health_copay_monthly??row.healthCopayMonthly,healthCopayEmployeeMonthly:row.health_copay_employee_monthly??row.healthCopayEmployeeMonthly,taskMonthly:row.task_monthly??row.taskMonthly,adjustmentRate:row.adjustment_rate??row.adjustmentRate,adjustmentMonth:row.adjustment_month??row.adjustmentMonth,inssRate:row.inss_rate??row.inssRate,fgtsRate:row.fgts_rate??row.fgtsRate,vacationFactor:row.vacation_factor??row.vacationFactor,thirteenthFactor:row.thirteenth_factor??row.thirteenthFactor,bonusAnnual:row.bonus_annual??row.bonusAnnual,insuranceMonthly:row.insurance_monthly??row.insuranceMonthly,otherAnnual:row.other_annual??row.otherAnnual};}
export function payrollAmounts(employees:PayrollEmployee[]):BudgetAmounts{
 const result:BudgetAmounts=Object.fromEntries(PAYROLL_STAGE_IDS.map(id=>[id,Array(12).fill(0)]));
 for(const e of employees)costs(e).monthlyBreakdown.forEach((c,m)=>{
  const values:Record<string,number>={'6':e.contract==='CLT'?c.salary:0,'15':e.contract==='PJ'?c.salary:0,
   '17':c.vacation,'18':c.thirteenth,'19':c.inss,'20':c.fgts,'22':c.transportNet,'23':c.mealNet,
   '14':c.bonus,'174':c.other,'29':c.insurance,'25':c.healthNet,'175':c.task};
  for(const id of PAYROLL_STAGE_IDS)result[id][m]+=values[id];
 });return result;
}
export function withPayroll(plans:BudgetPlan[],employees:PayrollEmployee[],year:number):BudgetPlan[]{
 const byScope=new Map(plans.map(p=>[JSON.stringify([p.company,p.sector]),p]));
 for(const e of employees){const key=JSON.stringify([e.company,e.sector]);if(!byScope.has(key))byScope.set(key,{year,company:e.company,sector:e.sector,amounts:{},status:'draft',version:0,note:'',updated_by:'Cadastro de funcionários',updated_at:new Date().toISOString()});}
 return [...byScope.values()].map(p=>({...p,amounts:p.status==='approved'?p.amounts:{...p.amounts,...payrollAmounts(employees.filter(e=>e.company===p.company&&e.sector===p.sector))}}));
}
