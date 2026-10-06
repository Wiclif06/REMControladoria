export type BudgetAmounts=Record<string,number[]>;
export type BudgetPlan={year:number;company:string;sector:string;amounts:BudgetAmounts;status:'draft'|'submitted'|'approved'|'changes';version:number;note:string;updated_by:string;updated_at:string};
export const STATUS_LABELS={draft:'Rascunho',submitted:'Em revisão',approved:'Aprovado',changes:'Ajustes solicitados'};
export const sumMonths=(amounts:BudgetAmounts)=>Array.from({length:12},(_,m)=>Object.values(amounts).reduce((sum,v)=>sum+(v[m]||0),0));
