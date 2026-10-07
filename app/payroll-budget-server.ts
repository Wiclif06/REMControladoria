import {db} from './auth';
import {payrollEmployee,withPayroll} from './payroll-budget';
import type {BudgetPlan} from './budget-types';
export async function payrollForScope(sector?:string,company?:string){const filters:string[]=[],values:string[]=[];if(sector){filters.push('sector=?');values.push(sector);}if(company){filters.push('company=?');values.push(company);}return (await db().prepare('SELECT * FROM employees'+(filters.length?' WHERE '+filters.join(' AND '):'')).bind(...values).all()).results.map(payrollEmployee);}
export async function enrichPayroll(plans:BudgetPlan[],year:number,sector?:string,company?:string){return withPayroll(plans,await payrollForScope(sector,company),year);}
