import postgres from 'postgres';
let client:ReturnType<typeof postgres>|undefined;
function connection(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL não configurada');
 return client??=postgres(process.env.DATABASE_URL,{max:1,prepare:false,ssl:'require',idle_timeout:20,connect_timeout:10});
}
function translate(query:string){
 const ignore=/INSERT OR IGNORE/i.test(query);
 let sql=query.replace(/INSERT OR IGNORE/gi,'INSERT').replace(/\b(employees|app_users|areas|auth_attempts|sessions|payroll_rules|budget_plans|budget_history|area_budget_access)\b/g, 'rem_controladoria.$1');
 if(ignore)sql+=' ON CONFLICT DO NOTHING';
 let index=0;return sql.replace(/\?/g,()=>`$${++index}`);
}
class Statement{
 constructor(readonly query:string,readonly values:any[]=[],readonly execute:(sql:string,values:any[])=>Promise<any>=(sql,values)=>connection().unsafe(sql,values)){ }
 bind(...values:any[]){return new Statement(this.query,values,this.execute);}
 async all(){return {results:Array.from(await this.execute(translate(this.query),this.values))};}
 async first<T=Record<string,unknown>>():Promise<T|null>{return (await this.all()).results[0] as T??null;}
 async run(){await this.execute(translate(this.query),this.values);return {success:true};}
}
export function database(){return {
 prepare:(query:string)=>new Statement(query),
 transaction:async <T>(fn:(tx:{prepare:(query:string)=>Statement})=>Promise<T>)=>connection().begin(async transaction=>fn({prepare:(query:string)=>new Statement(query,[],(sql,values)=>transaction.unsafe(sql,values))})),
 batch:async (statements:Statement[])=>connection().begin(async transaction=>{
  const results=[];for(const statement of statements){await transaction.unsafe(translate(statement.query),statement.values);results.push({success:true});}return results;
 })
};}
