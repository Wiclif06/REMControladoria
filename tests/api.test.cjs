const {test}=require('node:test'),assert=require('node:assert/strict'),fixture=require('./api-fixture.cjs');
const employee={name:'Teste',constructionSite:'Bom Retiro',company:'REM Construtora',position:'Engenheiro',sector:'Engenharia',contract:'CLT',salary:500000,meal:100000,transport:40000,healthMonthly:80000,healthEmployeeMonthly:20000,healthCopayMonthly:15000,healthCopayEmployeeMonthly:10000,taskMonthly:50000};
test('individual health prices and fixed insurance reach the budget; health selection requires a price',async()=>{
 const f=fixture(),base={...employee,healthEnabled:true,insuranceEnabled:true,insuranceMonthly:99999,healthEmployeeMonthly:0,healthCopayMonthly:0,healthCopayEmployeeMonthly:0};
 assert.equal((await f.api.POST(f.request({employee:{...base,healthMonthly:0}}))).status,400);
 for(const healthMonthly of [10000,30000])assert.equal((await f.api.POST(f.request({employee:{...base,healthMonthly}}))).status,200);
 const data=await(await f.api.GET()).json();assert.deepEqual(data.employees.map(e=>e.healthMonthly),[10000,30000]);assert(data.employees.every(e=>e.insuranceMonthly===777));
 const budget=await(await f.load('app/api/budget/route.ts').GET(new Request('http://localhost:3100/api/budget?year=2027'))).json();
 assert(budget.plans[0].amounts['29'].every(v=>v===1554));assert(budget.plans[0].amounts['25'].every(v=>v===40000));
});
test('health price and fixed insurance survive edits and can be unchecked',async()=>{
 const f=fixture('manager'),input={...employee,healthEnabled:true,insuranceEnabled:true,healthMonthly:80000,healthEmployeeMonthly:0,healthCopayMonthly:0,healthCopayEmployeeMonthly:0};
 const saved=await f.api.POST(f.request({employee:input}));assert.equal(saved.status,200);const id=(await saved.json()).id;
 let e=(await(await f.api.GET()).json()).employees[0];assert.equal(e.healthEnabled,true);assert.equal(e.insuranceEnabled,true);assert.equal(e.healthMonthly,80000);assert.equal(e.insuranceMonthly,777);
 assert.equal((await f.api.POST(f.request({employee:{...input,id,name:'Novo nome',healthEnabled:undefined,insuranceEnabled:undefined}}))).status,200);
 e=(await(await f.api.GET()).json()).employees[0];assert.equal(e.healthEnabled,true);assert.equal(e.insuranceEnabled,true);
 assert.equal((await f.api.POST(f.request({employee:{...input,id,healthEnabled:false,insuranceEnabled:false}}))).status,200);
 e=(await(await f.api.GET()).json()).employees[0];assert.equal(e.healthEnabled,false);assert.equal(e.insuranceEnabled,false);
});
test('health costs remain and insurance is fixed server-side; deselecting clears costs and invalid flags are rejected',async()=>{
 const f=fixture('manager');const saved=await f.api.POST(f.request({employee:{...employee,insuranceMonthly:5000}}));const id=(await saved.json()).id;
 assert.equal((await f.api.POST(f.request({employee:{...employee,id,healthEnabled:true,insuranceEnabled:true}}))).status,200);
 assert.equal(f.state.employees[0].health_monthly,80000);assert.equal(f.state.employees[0].insurance_monthly,777);
 for(const flag of [null,1,'true'])assert.equal((await f.api.POST(f.request({employee:{...employee,id,healthEnabled:flag}}))).status,400);
 assert.equal((await f.api.POST(f.request({employee:{...employee,id,healthEnabled:false,insuranceEnabled:false}}))).status,200);
 for(const field of ['health_monthly','health_employee_monthly','health_copay_monthly','health_copay_employee_monthly','insurance_monthly'])assert.equal(f.state.employees[0][field],0);
});
test('both engineering managers can register and move employees among the five works',async()=>{
 for(const username of ['diego.martins','renato.filho']){
  const f=fixture('manager');f.state.member.username=username;
  assert.deepEqual((await(await f.api.GET()).json()).constructionSites,f.state.sites);
  for(const constructionSite of f.state.sites)assert.equal((await f.api.POST(f.request({employee:{...employee,constructionSite}}))).status,200);
  const data=await(await f.api.GET()).json();assert.deepEqual(data.employees.map(e=>e.constructionSite),f.state.sites);
  const id=data.employees[0].id;
  assert.equal((await f.api.POST(f.request({employee:{...employee,id,constructionSite:'Altitude Jardins'}}))).status,200);
  assert.equal(f.state.employees[0].construction_site,'Altitude Jardins');
 }
});
test('engineering requires a registered work and other sectors cannot submit a work',async()=>{
 for(const constructionSite of [undefined,null,'','Obra inexistente']){
  const f=fixture('manager');assert.equal((await f.api.POST(f.request({employee:{...employee,constructionSite}}))).status,400);assert.equal(f.state.writes.length,0);
 }
 const f=fixture('manager','Financeiro');assert.deepEqual((await(await f.api.GET()).json()).constructionSites,[]);
 assert.equal((await f.api.POST(f.request({employee:{...employee,sector:'Financeiro',taskMonthly:0}}))).status,400);
 assert.equal((await f.api.POST(f.request({employee:{...employee,sector:'Financeiro',taskMonthly:0,constructionSite:null}}))).status,200);
});
test('work filter exports only its personnel while sector budget still sums all works once',async()=>{
 const f=fixture();
 for(const [name,constructionSite] of [['Pessoa Bom','Bom Retiro'],['Pessoa Altitude','Altitude Jardins']])assert.equal((await f.api.POST(f.request({employee:{...employee,name,constructionSite}}))).status,200);
 const budget=await(await f.load('app/api/budget/route.ts').GET(new Request('http://localhost:3100/api/budget?year=2027'))).json();
 assert.equal(budget.plans[0].amounts['25'][0],130000);assert.equal(budget.plans[0].amounts['175'][0],100000);
 const api=f.load('app/api/export/route.ts'),{unzipSync,strFromU8}=require('fflate');
 const res=await api.GET(new Request('http://localhost:3100/api/export?constructionSite=Bom%20Retiro'));
 assert.equal(res.status,200);const files=unzipSync(new Uint8Array(await res.arrayBuffer())),xml=strFromU8(files['xl/worksheets/sheet1.xml']);
 assert(xml.includes('Pessoa Bom'));assert(!xml.includes('Pessoa Altitude'));assert(!files['xl/worksheets/sheet2.xml']);
 assert.equal((await api.GET(new Request('http://localhost:3100/api/export?constructionSite=Unknown'))).status,400);
 const full=unzipSync(new Uint8Array(await(await api.GET(new Request('http://localhost:3100/api/export'))).arrayBuffer()));
 const personnel=strFromU8(full['xl/worksheets/sheet2.xml']);assert(personnel.includes('Obra: Bom Retiro'));assert(personnel.includes('Obra: Altitude Jardins'));
});
test('save/reopen keeps health and task, server overrides submitted charges, old vacation dates remain untouched',async()=>{
 const f=fixture('manager');let res=await f.api.POST(f.request({employee:{...employee,chargeRate:0,inssRate:0}}));assert.equal(res.status,200);
 const id=(await res.json()).id;assert.equal(f.state.employees[0].charge_rate,2680);f.state.employees[0].vacation_start='2027-01-01';
 const data=await (await f.api.GET()).json(),e=data.employees[0];assert.equal(e.healthMonthly,80000);assert.equal(e.taskMonthly,50000);assert(!('vacation_start' in e));assert(!('vacationStart' in e));
 res=await f.api.POST(f.request({employee:{...employee,id,healthMonthly:undefined,healthEmployeeMonthly:undefined,healthCopayMonthly:undefined,healthCopayEmployeeMonthly:undefined,taskMonthly:undefined,vacationStart:'invalid'}}));assert.equal(res.status,200);
 assert.equal(f.state.employees[0].task_monthly,50000);assert.equal(f.state.employees[0].vacation_start,'2027-01-01');
});
test('managers cannot edit another sector, rules, budget or exports',async()=>{
 const f=fixture('manager','Financeiro');
 assert.equal((await f.api.POST(f.request({employee}))).status,403);
 assert.equal((await f.api.POST(f.request({action:'saveRules',rule:{}}))).status,403);
 for(const file of ['app/api/budget/route.ts','app/api/export/route.ts','app/api/budget/export/route.ts'])assert.equal((await f.load(file).GET(new Request('http://localhost:3100/api/test'))).status,403,file);
 f.state.employees.push({...employee,id:'foreign'});
 assert.equal((await f.api.POST(f.request({employee:{...employee,id:'foreign',sector:'Financeiro',taskMonthly:0}}))).status,403);
 assert.equal((await f.api.GET()).status,200);assert.deepEqual((await(await f.api.GET()).json()).employees,[]);
});
test('unauthenticated requests and cross-origin mutations are denied',async()=>{
 const f=fixture();assert.equal((await f.api.POST(f.request({employee},'https://other.invalid'))).status,403);
 f.state.member=null;assert.equal((await f.api.GET()).status,401);assert.equal((await f.api.POST(f.request({employee}))).status,403);
});
test('negative, fractional, oversized and overallocated benefits rejected, task restricted to engineering',async()=>{
 for(const change of [{healthMonthly:-1},{healthMonthly:1.5},{healthMonthly:100000001},{healthEmployeeMonthly:80001},{healthCopayEmployeeMonthly:15001},{taskMonthly:-1},{sector:'Financeiro'}]){
  const f=fixture();assert.equal((await f.api.POST(f.request({employee:{...employee,...change}}))).status,400,JSON.stringify(change));assert.equal(f.state.writes.length,0);
 }
});
test('admin updates rate and vacation parameter across employees; invalid component rejected',async()=>{
 const f=fixture();await f.api.POST(f.request({employee}));
 const rule={contract:'CLT',chargeRate:3000,inssRate:2000,fgtsRate:800,vacationFactor:4000,thirteenthFactor:10000,adjustmentRate:500,adjustmentMonth:5,bonusAnnual:0};
 assert.equal((await f.api.POST(f.request({action:'saveRules',rule}))).status,200);
 assert.equal(f.state.employees[0].charge_rate,3000);assert.equal(f.state.employees[0].vacation_factor,4000);assert.equal(f.state.employees[0].inss_rate,2200);
 assert.equal((await f.api.POST(f.request({action:'saveRules',rule:{...rule,chargeRate:700}}))).status,400);
 const data=await(await f.api.GET()).json();assert.equal(data.rules[0].chargeRate,3000);assert.equal(data.rules[0].vacationFactor,4000);
});
test('admin budget and Excel use the same saved payroll components',async()=>{
 const f=fixture();await f.api.POST(f.request({employee}));
 const budget=await(await f.load('app/api/budget/route.ts').GET(new Request('http://localhost:3100/api/budget?year=2027'))).json();
 assert.equal(budget.plans[0].amounts['25'][0],65000);assert.equal(budget.plans[0].amounts['175'][0],50000);
 const exportResponse=await f.load('app/api/export/route.ts').GET(new Request('http://localhost:3100/api/export?year=2027'));
 assert.equal(exportResponse.status,200);const {unzipSync,strFromU8}=require('fflate'),files=unzipSync(new Uint8Array(await exportResponse.arrayBuffer()));
 assert(strFromU8(files['xl/worksheets/sheet1.xml']).includes('TAREFA'));
 assert(strFromU8(files['xl/worksheets/sheet2.xml']).includes('SAÚDE LÍQUIDA'));
});
