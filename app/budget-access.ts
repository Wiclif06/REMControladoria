import {BUDGET_STAGES} from './budget-catalog';
import type {BudgetAmounts} from './budget-types';
export async function allowedBudgetStages(_sector:string){return BUDGET_STAGES;}
export function limitAmounts(amounts:BudgetAmounts,ids:Set<string>){return Object.fromEntries(Object.entries(amounts).filter(([id])=>ids.has(id)));}
