import {db,getMember,validOrigin} from '../../auth';
import {COMPANIES} from '../../payroll-rules';
import {validateAnswers} from '../../premises-types';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status});
const validYear=(year:number)=>Number.isInteger(year)&&year>=2020&&year<=2100;
export async function GET(req:Request){try{
 const member=await getMember(req);if(!member)return fail('Faça login para continuar.',401);
 const u=new URL(req.url),year=Number(u.searchParams.get('year')||2027),company=u.searchParams.get('company'),sector=u.searchParams.get('sector');
 if(!validYear(year)||company&&!(COMPANIES as readonly string[]).includes(company))return fail('Revise o ano e a empresa.');
 if(member.role!=='admin'&&sector&&sector!==member.sector)return fail('Você só pode consultar as premissas da sua área.',403);
 const filters=['year=?'],values:any[]=[year];if(company){filters.push('company=?');values.push(company);}const ownSector=member.role==='admin'?sector:member.sector;if(ownSector){filters.push('sector=?');values.push(ownSector);}
 const plans=(await db().prepare('SELECT * FROM premise_plans WHERE '+filters.join(' AND ')+' ORDER BY company,sector').bind(...values).all()).results;
 return Response.json({plans},{headers:{'Cache-Control':'no-store'}});
}catch(e){console.error(e);return fail('Não foi possível carregar as premissas.',503);}}
export async function POST(req:Request){try{
 if(!validOrigin(req))return fail('Origem inválida.',403);const member=await getMember(req);if(!member)return fail('Faça login para continuar.',401);
 if(member.role!=='manager')return fail('As premissas são preenchidas pelos gestores. A Controladoria pode consultá-las.',403);
 const b=await req.json();if(b.sector!==member.sector)return fail('Você só pode preencher as premissas da sua área.',403);
 if(!validYear(b.year)||!COMPANIES.includes(b.company)||!Number.isSafeInteger(b.version)||b.version<0)return fail('Revise a empresa e o ano.');
 const answers=validateAnswers(b.answers);if(!answers)return fail('Revise as respostas e as quantidades.');
 if(!await db().prepare('SELECT name FROM areas WHERE name=?').bind(member.sector).first())return fail('Seu setor não está disponível.',403);
 const saved=await db().prepare(`INSERT INTO premise_plans(year,company,sector,answers,version,updated_by) SELECT ?,?,?,?::jsonb,1,? WHERE ?=0
 ON CONFLICT(year,company,sector) DO UPDATE SET answers=excluded.answers,version=premise_plans.version+1,updated_by=excluded.updated_by,updated_at=now() WHERE premise_plans.version=? RETURNING *`).bind(b.year,b.company,member.sector,JSON.stringify(answers),member.username,b.version,b.version).first();
 // Existing rows require UPDATE separately: the INSERT SELECT guard deliberately prevents recreation of deleted versions.
 if(saved)return Response.json({plan:saved});
 if(b.version>0){const updated=await db().prepare('UPDATE premise_plans SET answers=?::jsonb,version=version+1,updated_by=?,updated_at=now() WHERE year=? AND company=? AND sector=? AND version=? RETURNING *').bind(JSON.stringify(answers),member.username,b.year,b.company,member.sector,b.version).first();if(updated)return Response.json({plan:updated});}
 return fail('As premissas foram alteradas por outro gestor. Recarregue a página antes de salvar.',409);
}catch(e){console.error(e);return fail('Não foi possível salvar. Suas respostas foram mantidas.',503);}}
