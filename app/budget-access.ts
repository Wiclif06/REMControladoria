import {BUDGET_STAGES} from './budget-catalog';
import {groupKey} from './budget-groups';
import {db} from './auth';
import type {BudgetAmounts} from './budget-types';
export function stagesFromAssignments(groups:string[]){const ids=new Set(groups);return BUDGET_STAGES.filter(s=>ids.has(groupKey(s))||ids.has(`stage:${s.id}`));}
export async function allowedBudgetStages(sector:string){const row=await db().prepare('SELECT groups FROM area_budget_access WHERE sector=?').bind(sector).first<{groups:string[]}>();return stagesFromAssignments(row?.groups||[]);}
export function limitAmounts(amounts:BudgetAmounts,ids:Set<string>){return Object.fromEntries(Object.entries(amounts).filter(([id])=>ids.has(id)));}
