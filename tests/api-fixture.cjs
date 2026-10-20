const path=require('node:path'),assert=require('node:assert/strict');
module.exports=function fixture(role='admin',sector='Engenharia'){
 const state={member:{username:'test.user',display_name:'Usuário de teste',role,sector},sites:['Bom Retiro','Pç. Mário Fontana','Altitude Jardins','Doppio Jundiai','Caiubi Maranello'],employees:[],writes:[],rules:[{company:'CLT',charge_rate:2680,inss_rate:1880,fgts_rate:800,vacation_factor:3333,thirteenth_factor:10000,adjustment_rate:500,adjustment_month:5,bonus_annual:0},{company:'PJ',charge_rate:0,inss_rate:0,fgts_rate:0,vacation_factor:0,thirteenth_factor:0,adjustment_rate:0,adjustment_month:1,bonus_annual:0}]};
 const database={prepare(query){let values=[];const stmt={bind(...v){values=v;return stmt;},async all(){
  if(query.startsWith('SELECT * FROM payroll_rules'))return {results:structuredClone(state.rules)};
  if(query.startsWith('SELECT name FROM construction_sites'))return {results:state.sites.map(name=>({name}))};
  if(query.startsWith('SELECT * FROM employees')){const filters=[...query.matchAll(/(sector|company|construction_site)=\?/g)].map(m=>m[1]);return {results:structuredClone(state.employees.filter(e=>filters.every((field,i)=>e[field]===values[i])))};}
  if(query.includes('FROM areas a'))return {results:['Engenharia','Financeiro'].filter(s=>state.member.role==='admin'||s===state.member.sector).map(name=>({name,budget_groups:[]}))};
  return {results:[]};
 },async first(){
  if(query.startsWith('SELECT name FROM construction_sites'))return state.sites.includes(values[0])?{name:values[0]}:null;
  if(query.startsWith('SELECT name FROM areas'))return ['Engenharia','Financeiro'].includes(values[0])?{name:values[0]}:null;
  if(query.startsWith('SELECT * FROM employees')||query.startsWith('SELECT sector FROM employees'))return state.employees.find(e=>e.id===values[0])||null;
  return null;
 },async run(){
  assert.equal((query.match(/\?/g)||[]).length,values.length,'SQL placeholder count');state.writes.push({query,values:structuredClone(values)});
  if(query.startsWith('INSERT INTO employees')){const columns=query.match(/employees\(([^)]+)\)/)[1].split(','),row=Object.fromEntries(columns.map((c,i)=>[c,values[i]])),old=state.employees.find(e=>e.id===row.id);if(old)Object.assign(old,row);else state.employees.push(row);}
  if(query.startsWith('INSERT INTO payroll_rules')){const columns=query.match(/payroll_rules\(([^)]+)\)/)[1].split(','),row=Object.fromEntries(columns.map((c,i)=>[c,values[i]])),old=state.rules.find(r=>r.company===row.company);if(old)Object.assign(old,row);else state.rules.push(row);}
  if(query.startsWith('UPDATE employees SET charge_rate')){const columns=query.slice(query.indexOf('SET ')+4,query.indexOf(' WHERE')).split(',').map(x=>x.split('=')[0]);for(const e of state.employees.filter(e=>e.contract===values.at(-1)))columns.forEach((c,i)=>e[c]=values[i]);}
  return {success:true};
 }};return stmt;},async batch(statements){for(const s of statements)await s.run();}};
 const load=require('./load.cjs')({[path.resolve(__dirname,'../app/auth.ts')]:{db:()=>database,getMember:async()=>state.member,validOrigin:req=>req.headers.get('origin')===new URL(req.url).origin}});
 return {state,load,api:load('app/api/data/route.ts'),request:(body,origin='http://localhost:3100')=>new Request('http://localhost:3100/api/data',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})};
};
