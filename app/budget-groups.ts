import {BUDGET_STAGES} from './budget-catalog';
export const groupKey=(s:{category:string;group:string})=>`${s.category}::${s.group}`;
export const BUDGET_GROUPS=[...new Map(BUDGET_STAGES.map(s=>[groupKey(s),{id:groupKey(s),category:s.category,name:s.group}])).values()];
