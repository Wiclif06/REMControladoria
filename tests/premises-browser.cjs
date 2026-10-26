const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),fixture=require('./api-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),f=fixture(),errors=[];
  f.state.member={username:'adriano.bastos',display_name:'Adriano Bastos',role:'admin',sector:'Todos'};
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',async route=>{
   const r=route.request(),url=new URL(r.url());
   if(!['/api/data','/api/premises'].includes(url.pathname))return route.fulfill({status:200,contentType:'application/json',body:'{}'});
   const api=url.pathname==='/api/data'?f.api:f.load('app/api/premises/route.ts');
   const response=await api[r.method()](new Request(r.url(),{method:r.method(),headers:{...r.headers(),origin:url.origin},...(r.method()==='POST'?{body:r.postData()}:{})}));
   await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
  });
  await page.goto(process.env.TEST_BASE_URL||'http://localhost:3106');
  await page.getByRole('button',{name:'Premissas',exact:true}).click();
  await page.getByRole('button',{name:'Adicionar premissas',exact:true}).click();
  await page.locator('#premise-hiring-0').waitFor();
  assert.deepEqual(await page.getByRole('combobox',{name:'Área',exact:true}).locator('option').allTextContents(),['Controladoria','Diretora']);
  const save=async()=>{await page.getByText('Há respostas ainda não salvas.',{exact:true}).waitFor();const [response]=await Promise.all([page.waitForResponse(r=>r.url().includes('/api/premises')&&r.request().method()==='POST'),page.getByRole('button',{name:'Salvar premissas',exact:true}).first().click()]);assert.equal(response.status(),200);};
  const done=()=>page.getByRole('status').filter({hasText:'Premissas salvas.'}).waitFor();
  await page.locator('#premise-hiring-0').fill('Analista para Controladoria');
  await page.locator('#quantity-hiring-0').fill('1');await save();await done();assert.equal(f.state.premises[0].answers.hiring.text,'Analista para Controladoria');
  await page.getByRole('combobox',{name:'Área',exact:true}).selectOption('Diretora');
  await page.locator('#premise-hiring-0').waitFor();assert.equal(await page.locator('#premise-hiring-0').inputValue(),'');
  await page.locator('#premise-hiring-0').fill('Assistente para Diretoria');await save();await done();
  await page.getByRole('button',{name:'Consultar premissas',exact:true}).click();
  await page.getByRole('row').filter({hasText:'Diretora'}).getByRole('button',{name:'Ver premissas'}).click();
  await page.getByText('Assistente para Diretoria',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Adicionar premissas',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#premise-hiring-0')?.value==='Analista para Controladoria',null,{timeout:10000}).catch(async e=>{console.log(await page.locator('h1,textarea,select').evaluateAll(es=>es.map(e=>({tag:e.tagName,id:e.id,text:e.tagName==='H1'?e.textContent:e.value}))));throw e;});
  await page.locator('#premise-hiring-0').fill('Analista revisado');await page.getByText('Há respostas ainda não salvas.',{exact:true}).waitFor();
  page.once('dialog',d=>d.dismiss());await page.getByRole('combobox',{name:'Área',exact:true}).selectOption('Diretora');
  await page.waitForFunction(()=>document.querySelector('#premise-hiring-0')?.value==='Analista revisado',null,{timeout:10000}).catch(async e=>{console.log(await page.locator('h1,textarea,select').evaluateAll(es=>es.map(e=>({tag:e.tagName,id:e.id,text:e.tagName==='H1'?e.textContent:e.value}))));throw e;});assert.equal(await page.getByRole('combobox',{name:'Área',exact:true}).inputValue(),'Controladoria');
  await save();await done();
  await page.getByRole('combobox',{name:'Empresa',exact:true}).selectOption('ALPAN');
  await page.locator('#premise-hiring-0').waitFor();assert.equal(await page.locator('#premise-hiring-0').inputValue(),'');
  await page.locator('#premise-hiring-0').fill('Premissa ALPAN');await save();await done();
  fs.mkdirSync(path.resolve(__dirname,'../../qa'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../../qa/premissas-adriano.png')});
  assert.equal(f.state.premises.length,3);assert.equal(f.state.premises[0].answers.hiring.text,'Analista revisado');
  f.state.member={username:'outro.admin',display_name:'Outro',role:'admin',sector:'Todos'};await page.reload();await page.getByRole('button',{name:'Premissas',exact:true}).click();await page.getByRole('heading',{name:'Respostas dos gestores'}).waitFor();assert.equal(await page.getByRole('button',{name:'Adicionar premissas'}).count(),0);
  f.state.member={username:'fernanda.vieira',display_name:'Fernanda',role:'manager',sector:'Incorporação'};await page.reload();await page.getByRole('button',{name:'Premissas',exact:true}).click();await page.locator('#premise-hiring-0').fill('Premissa Incorporação');await save();await done();assert.equal(f.state.premises.at(-1).sector,'Incorporação');
  assert.deepEqual(errors,[]);console.log('PASS: Adriano saves, reads and edits both sectors; company isolation; unsaved changes protected; other admin read-only; manager flow preserved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
