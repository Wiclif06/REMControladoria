const {test}=require('node:test'),assert=require('node:assert/strict'),fixture=require('./api-fixture.cjs');
const input={year:2027,company:'REM Construtora',sector:'Controladoria',version:0,answers:{hiring:{text:'Analista em janeiro',quantity:1}}};
test('Adriano creates independent premises for his two sectors and companies and edits with version protection',async()=>{
 const f=fixture();f.state.member={username:'adriano.bastos',role:'admin',sector:'Todos'};const api=f.load('app/api/premises/route.ts');
 for(const sector of ['Controladoria','Diretora'])for(const company of ['REM Construtora','ALPAN']){
  const r=await api.POST(f.request({...input,sector,company}));assert.equal(r.status,200);const {plan}=await r.json();assert.equal(plan.sector,sector);assert.equal(plan.company,company);assert.equal(plan.updated_by,'adriano.bastos');
 }
 assert.equal(f.state.premises.length,4);
 const req=new Request('http://localhost:3100/api/premises?year=2027&sector=Diretora&company=ALPAN');
 assert.equal((await(await api.GET(req)).json()).plans.length,1);
 const updated={...input,version:1,answers:{hiring:{text:'Dois analistas',quantity:2}}};
 assert.equal((await api.POST(f.request(updated))).status,200);
 assert.equal((await api.POST(f.request(updated))).status,409);
 assert.equal((await api.POST(f.request(input))).status,409);
 assert.equal(f.state.premises.find(p=>p.sector==='Controladoria'&&p.company==='REM Construtora').answers.hiring.quantity,2);
 assert.equal(f.state.premises.find(p=>p.sector==='Diretora').answers.hiring.quantity,1);
 assert.equal((await api.POST(f.request({...input,sector:'Engenharia'}))).status,403);
 assert.equal((await api.POST(f.request({...input,company:'Todas'}))).status,400);
 assert.equal((await api.POST(f.request({...input,answers:{hiring:{text:'X',quantity:-1}}}))).status,400);
});
test('other administrators remain read-only and managers keep their own premises scope',async()=>{
 const f=fixture(),api=f.load('app/api/premises/route.ts');
 for(const sector of ['Controladoria','Diretora'])assert.equal((await api.POST(f.request({...input,sector}))).status,403);
 f.state.member={username:'fernanda.vieira',role:'manager',sector:'Incorporação'};
 for(const sector of ['Controladoria','Diretora'])assert.equal((await api.POST(f.request({...input,sector}))).status,403);
 assert.equal((await api.POST(f.request({...input,sector:'Incorporação'}))).status,200);
 assert.equal((await api.GET(new Request('http://localhost:3100/api/premises?sector=Controladoria'))).status,403);
 const data=await(await api.GET(new Request('http://localhost:3100/api/premises'))).json();assert.equal(data.plans.length,1);assert.equal(data.plans[0].sector,'Incorporação');
});
