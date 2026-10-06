import {db} from './auth';
import {BUDGET_STAGES} from './budget-catalog';
import type {BudgetAmounts} from './budget-types';
import {groupKey} from './budget-groups';
export async function allowedBudgetStages(sector:string){const row=await db().prepare('SELECT groups FROM area_budget_access WHERE sector=?').bind(sector).first<{groups:string[]}>();const keys=new Set(row?.groups||[]);return BUDGET_STAGES.filter(s=>keys.has(groupKey(s)));}
export function limitAmounts(amounts:BudgetAmounts,ids:Set<string>){return Object.fromEntries(Object.entries(amounts).filter(([id])=>ids.has(id)));}
