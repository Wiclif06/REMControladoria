export const LIFE_INSURANCE_MONTHLY=777;
export type CostInput = {
 contract:string; salary:number; meal:number; transport:number;
 chargeRate?:number; inssRate?:number; fgtsRate?:number;
 vacationFactor?:number; thirteenthFactor?:number; bonusAnnual?:number;
 insuranceMonthly?:number; otherAnnual?:number; adjustmentRate?:number; adjustmentMonth?:number;
 healthEnabled?:boolean; insuranceEnabled?:boolean; healthMonthly?:number; healthEmployeeMonthly?:number;
 healthCopayMonthly?:number; healthCopayEmployeeMonthly?:number; taskMonthly?:number;
};
export const isEngineering=(sector:string)=>sector.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()==='engenharia';
export function salaryMonths(e:CostInput){return Array.from({length:12},(_,m)=>m+1>=(e.adjustmentMonth??1)?Math.round(e.salary*(10000+(e.adjustmentRate||0))/10000):e.salary);}
export function benefitCosts(e:CostInput){
 const mealDiscount=e.contract==='CLT'?Math.round(e.meal*0.05):0;
 const transportDiscount=e.contract==='CLT'?Math.min(e.transport,Math.round(e.salary*0.06)):0;
 const healthGross=(e.healthMonthly||0)+(e.healthCopayMonthly||0);
 const healthDiscount=(e.healthEmployeeMonthly||0)+(e.healthCopayEmployeeMonthly||0);
 return {mealDiscount,transportDiscount,mealNet:e.meal-mealDiscount,transportNet:e.transport-transportDiscount,healthGross,healthDiscount,healthNet:healthGross-healthDiscount};
}
// Integer-cent provisions and one shared monthly ledger for all screens and reports.
const portion=(annual:number,m:number)=>Math.floor(annual/12)+(m<annual%12?1:0);
function ledger(e:CostInput){return salaryMonths(e).map((salary,m)=>{
 const b=benefitCosts({...e,salary}),clt=e.contract==='CLT';
 const chargeRate=e.chargeRate??2680,totalCharges=clt?Math.round(salary*chargeRate/10000):0;
 const fgts=clt?Math.min(totalCharges,Math.round(salary*(e.fgtsRate??800)/10000)):0,inss=totalCharges-fgts;
 const factor=e.vacationFactor??(clt?3333:0);
 const vacation=portion(Math.round(salary*(factor===3333?1/3:factor===13333?4/3:factor/10000)),m);
 const thirteenth=portion(Math.round(salary*(e.thirteenthFactor??(clt?10000:0))/10000),m);
 const bonus=portion(e.bonusAnnual||0,m),other=portion(e.otherAnnual||0,m),insurance=e.insuranceMonthly||0,task=e.taskMonthly||0;
 const benefits=b.mealNet+b.transportNet+b.healthNet+insurance+bonus+other+task,charges=inss+fgts+vacation+thirteenth;
 return {...b,salary,inss,fgts,vacation,thirteenth,bonus,other,insurance,task,benefits,charges,total:salary+benefits+charges};
});}
export function costs(e:CostInput){
 const monthlyBreakdown=ledger(e),sum=(key:keyof typeof monthlyBreakdown[number])=>monthlyBreakdown.reduce((v,m)=>v+m[key],0);
 const monthlyValues=monthlyBreakdown.map(m=>m.total),annual=sum('total');
 return {inss:sum('inss')/12,fgts:sum('fgts')/12,vacation:sum('vacation'),thirteenth:sum('thirteenth'),extras:sum('bonus')+sum('other'),benefits:sum('benefits'),charges:sum('charges'),annual,monthly:annual/12,
 baseMonthly:(sum('salary')+sum('benefits')-sum('bonus')-sum('other')+sum('inss')+sum('fgts'))/12,
 monthlyValues,monthlyBreakdown,salaryAnnual:sum('salary'),adjustedSalary:monthlyBreakdown[11].salary,
 mealAnnual:sum('mealNet'),transportAnnual:sum('transportNet'),healthAnnual:sum('healthNet'),taskAnnual:sum('task'),
 mealDiscountAnnual:sum('mealDiscount'),transportDiscountAnnual:sum('transportDiscount'),healthDiscountAnnual:sum('healthDiscount'),
 adjustmentImpact:annual-ledger({...e,adjustmentRate:0}).reduce((v,m)=>v+m.total,0)};
}
export function monthlyCosts(e:CostInput){return costs(e).monthlyValues;}
