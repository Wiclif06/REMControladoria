const {test}=require('node:test'),assert=require('node:assert/strict'),fixture=require('./api-fixture.cjs');
const employee={name:'Teste',constructionSite:'Bom Retiro',company:'REM Construtora',position:'Engenheiro',sector:'Engenharia',contract:'CLT',salary:500000,meal:100000,transport:40000,healthMonthly:80000,healthEmployeeMonthly:20000,healthCopayMonthly:15000,healthCopayEmployeeMonthly:10000,taskMonthly:50000};
test('Fernanda can read, create and edit shared Maintenance without access to other Engineering works',async()=>{
 const f=fixture();f.state.sites.push('Manutenção');f.state.siteGrants['fernanda.vieira']=['Manutenção'];
 const ids=[];
 for(const e of [{...employee,name:'Obra privada'},{...employee,name:'Equipe Manutenção',constructionSite:'Manutenção'},{...employee,name:'Equipe Incorporação',sector:'Incorporação',constructionSite:null,taskMonthly:0}])ids.push((await(await f.api.POST(f.request({employee:e}))).json()).id);
 f.state.member={username:'fernanda.vieira',role:'manager',sector:'Incorporação'};
 let data=await(await f.api.GET()).json();assert.deepEqual(data.employees.map(e=>e.name),['Equipe Manutenção','Equipe Incorporação']);assert.deepEqual(data.constructionSites,['Manutenção']);assert.deepEqual(data.areas.map(a=>a.name),['Incorporação']);
 const shared={...employee,constructionSite:'Manutenção'};
 assert.equal((await f.api.POST(f.request({employee:{...shared,name:'Novo funcionário'}}))).status,200);
 assert.equal((await f.api.POST(f.request({employee:{...shared,id:ids[1],salary:600000}}))).status,200);assert.equal(f.state.employees.find(e=>e.id===ids[1]).salary,600000);
 for(const e of [employee,{...shared,id:ids[0]},{...shared,id:ids[1],sector:'Incorporação',constructionSite:null,taskMonthly:0},{...shared,id:ids[1],constructionSite:'Bom Retiro'}])assert.equal((await f.api.POST(f.request({employee:e}))).status,403);
 assert.equal((await f.api.POST(f.request({action:'delete',id:ids[1]}))).status,403);
 assert.equal((await f.api.POST(f.request({action:'saveRules',rule:{}}))).status,403);
 assert.equal((await f.load('app/api/budget/route.ts').GET(new Request('http://localhost:3100/api/budget'))).status,403);
 f.state.member.role='admin';data=await(await f.api.GET()).json();assert.equal(data.employees.length,4);assert.equal(new Set(data.employees.map(e=>e.id)).size,4);
 f.state.member.role='manager';f.state.member.username='outra.pessoa';data=await(await f.api.GET()).json();assert.deepEqual(data.employees.map(e=>e.name),['Equipe Incorporação']);assert.deepEqual(data.constructionSites,[]);
 assert.equal((await f.api.POST(f.request({employee:shared}))).status,403);
});
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
 assert(full['xl/worksheets/sheet1.xml']);assert(full['xl/worksheets/sheet2.xml']);assert(full['xl/worksheets/sheet3.xml']);assert(!full['xl/worksheets/sheet4.xml']);
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
 assert(strFromU8(files['xl/worksheets/sheet1.xml']).includes('PLANO DE SAUDE'));
});

test('budget Excel reconciles monthly and annual totals after manual amount changes',async()=>{
 const f=fixture();
 const {budgetSheet}=f.load('app/budget-report.ts');
 const plan=(value)=>({year:2027,company:'REM Construtora',sector:'Engenharia',amounts:{'7':[value,...Array(11).fill(0)],'39':Array(12).fill(2200)},status:'draft',version:1,note:'',updated_by:'test.user'});
 const {unzipSync,strFromU8}=require('fflate'),{excelFile}=f.load('app/excel.ts');
 for(const amount of [15000,45000]){
  const xml=budgetSheet([plan(amount)],2027).xml;
  const total=(amount+12*2200)/100;
  assert(xml.includes('ORÇAMENTO 2027'));
  assert(xml.includes('ADIANTAMENTO DE SALÁRIOS'));
  assert(xml.includes('TREINAMENTO'));
  assert(xml.includes('<v>'+total+'</v>'),'annual total must match all monthly saved amounts');
  const book=unzipSync(excelFile([budgetSheet([plan(amount)],2027)]));
  assert(strFromU8(book['xl/worksheets/sheet1.xml']).includes('TOTAL GERAL'));
 }
});
test('approved payroll snapshot is not recalculated after employee changes',async()=>{
 const f=fixture(),{withPayroll}=f.load('app/payroll-budget.ts');
 const snapshot={year:2027,company:'REM Construtora',sector:'Engenharia',status:'approved',amounts:{'6':Array(12).fill(125000)},version:2};
 const output=withPayroll([snapshot],[{...employee,salary:900000}],2027);
 assert.deepEqual(output[0].amounts['6'],snapshot.amounts['6']);
});

test('exported budget uses template rows and three company tabs',async()=>{
 const f=fixture(),{unzipSync,strFromU8}=require('fflate');
 const response=await f.load('app/api/export/route.ts').GET(new Request('http://localhost:3100/api/export?year=2027'));
 assert.equal(response.status,200);
 const files=unzipSync(new Uint8Array(await response.arrayBuffer()));
 const workbook=strFromU8(files['xl/workbook.xml']);
 for(const company of ['REM Construtora','REM Vendas','ALPAN'])assert(workbook.includes(company));
 assert.equal(Object.keys(files).filter(x=>/^xl\/worksheets\/sheet\d+\.xml$/.test(x)).length,3);
 const first=strFromU8(files['xl/worksheets/sheet1.xml']);
 assert(first.includes('r="A6"'));assert(first.includes('SALÁRIOS E ORDENADOS'));
 assert(first.includes('r="A173"'));assert(first.includes('CÍVEL'));
 assert(first.includes('jan-27'));assert(first.includes('dez-27'));
});
