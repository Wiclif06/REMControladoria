const {test}=require('node:test'),assert=require('node:assert/strict');
const load=require('./load.cjs')(),{costs,benefitCosts}=load('app/costs.ts'),{payrollAmounts,payrollEmployee,withPayroll}=load('app/payroll-budget.ts');
const base={name:'Pessoa de teste',position:'Engenheiro',company:'REM Construtora',sector:'Engenharia',contract:'CLT',salary:500000,meal:100000,transport:40000,chargeRate:2680,fgtsRate:800,vacationFactor:3333,thirteenthFactor:10000};
test('VR 5%, VT capped at cost and based only on salary',()=>{
 assert.equal(benefitCosts(base).mealDiscount,5000);
 assert.equal(benefitCosts(base).transportDiscount,30000);
 assert.equal(benefitCosts({...base,transport:20000}).transportNet,0);
 assert.equal(benefitCosts({...base,taskMonthly:500000}).transportDiscount,30000);
 assert.equal(benefitCosts({...base,meal:0,transport:0}).mealDiscount,0);
 assert.equal(benefitCosts({...base,meal:1}).mealDiscount,0);
});
test('health premium and copay use net company cost',()=>{
 const c=costs({...base,healthMonthly:80000,healthEmployeeMonthly:20000,healthCopayMonthly:15000,healthCopayEmployeeMonthly:10000});
 assert.equal(c.healthAnnual,780000);assert.equal(c.healthDiscountAnnual,360000);
});
test('CLT total includes FGTS exactly once and is editable; PJ has no CLT deductions',()=>{
 const c=costs(base);assert.equal(c.inss+c.fgts,134000);assert.equal(c.fgts,40000);
 assert.equal(costs({...base,chargeRate:3000}).inss+costs({...base,chargeRate:3000}).fgts,150000);
 const pj=costs({...base,contract:'PJ'});assert.equal(pj.inss+pj.fgts,0);assert.equal(pj.mealDiscountAnnual+pj.transportDiscountAnnual,0);
});
test('task increases cost only, without changing salary, deductions, provisions or raises',()=>{
 const a=costs({...base,adjustmentRate:500,adjustmentMonth:5}),b=costs({...base,adjustmentRate:500,adjustmentMonth:5,taskMonthly:50000});
 assert.equal(b.annual-a.annual,600000);
 for(const key of ['salaryAnnual','inss','fgts','vacation','thirteenth','transportDiscountAnnual','adjustmentImpact'])assert.equal(b[key],a[key],key);
});
test('VT follows salary raise and cannot exceed benefit in any month',()=>{
 const c=costs({...base,transport:31000,adjustmentRate:1000,adjustmentMonth:7});
 assert.equal(c.monthlyBreakdown[5].transportDiscount,30000);
 assert.equal(c.monthlyBreakdown[6].transportDiscount,31000);
 assert.equal(c.transportAnnual,6000);
});
test('personnel and budget reconcile exactly for 2400 varied employee-months',()=>{
 for(let i=0;i<200;i++){
  const e={...base,salary:1+i*7919,meal:i*83,transport:i*73,bonusAnnual:i*13,otherAnnual:i*11,taskMonthly:i*17,healthMonthly:i*199,healthEmployeeMonthly:i*13,healthCopayMonthly:i*17,healthCopayEmployeeMonthly:i*7,adjustmentRate:i%27*137,adjustmentMonth:i%12+1,contract:i%3?'CLT':'PJ'};
  const c=costs(e),p=payrollAmounts([e]);assert.equal(c.annual,c.monthlyValues.reduce((a,b)=>a+b,0));
  for(let m=0;m<12;m++){assert.equal(Object.values(p).reduce((sum,amounts)=>sum+amounts[m],0),c.monthlyValues[m]);for(const amounts of Object.values(p))assert(Number.isSafeInteger(amounts[m])&&amounts[m]>=0);}
  assert.equal(c.salaryAnnual+c.benefits+c.charges,c.annual);
 }
});
test('health and task map database fields and reach separate budget stages',()=>{
 const e=payrollEmployee({...base,health_monthly:10000,health_employee_monthly:2000,health_copay_monthly:1000,health_copay_employee_monthly:1000,task_monthly:3000,charge_rate:2680});
 const p=payrollAmounts([e]);assert.equal(p['25'][0],8000);assert.equal(p['175'][0],3000);
 assert.equal(withPayroll([], [e],2027)[0].amounts['25'][0],8000);
});
test('Excel includes net benefits, task, deductions and same total',()=>{
 const {personnelSheet}=load('app/report.ts');const e={...base,taskMonthly:3000,healthMonthly:80000};const s=personnelSheet([e],['Engenharia'],2027).xml;
 for(const text of ['SAÚDE LÍQUIDA / ANO','TAREFA / ANO','DESCONTO VT','COPARTICIPAÇÃO FUNCIONÁRIO'])assert(s.includes(text),text);
 assert(s.includes(String(costs(e).annual/100)));
});
