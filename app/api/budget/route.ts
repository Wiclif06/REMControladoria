import {allowedBudgetStages,limitAmounts} from '../../budget-access';
import {db,getMember,validOrigin} from '../../auth';
import {COMPANIES} from '../../payroll-rules';
import {BUDGET_STAGES} from '../../budget-catalog';
import type {BudgetPlan,BudgetAmounts} from '../../budget-types';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status});
const validYear=(y:number)=>Number.isInteger(y)&&y>=2020&&y<=2100;
export async function GET(req:Request){try{
 const m=await getMember(req);if(!m)return fail('Faça login para continuar.',401);
 const params=new URL(req.url).searchParams;const requestedSector=params.get('sector');if(m.role!=='admin'&&requestedSector&&requestedSector!==m.sector)return fail('Este orçamento pertence a outro setor.',403);
 const year=Number(params.get('year')||2027);if(!validYear(year))return fail('Ano inválido.');
 const allowedStages=m.role==='admin'?BUDGET_STAGES:await allowedBudgetStages(m.sector);const allowedIds=new Set<string>(allowedStages.map(s=>s.id));
 const plans=(await (m.role==='admin'?db().prepare('SELECT * FROM budget_plans WHERE year=? ORDER BY company,sector').bind(year):db().prepare('SELECT * FROM budget_plans WHERE year=? AND sector=? ORDER BY company').bind(year,m.sector)).all()).results;
 const history=(await (m.role==='admin'?db().prepare('SELECT id,year,company,sector,actor,action,version,created_at FROM budget_history WHERE year=? ORDER BY created_at DESC LIMIT 100').bind(year):db().prepare('SELECT id,year,company,sector,actor,action,version,created_at FROM budget_history WHERE year=? AND sector=? ORDER BY created_at DESC LIMIT 100').bind(year,m.sector)).all()).results;
 return Response.json({plans:m.role==='admin'?plans:plans.map((p:any)=>({...p,amounts:limitAmounts(p.amounts,allowedIds)})),history,allowedStageIds:allowedStages.map(s=>s.id)},{headers:{'Cache-Control':'no-store'}});
}catch(e){console.error(e);return fail('Não foi possível carregar o orçamento. Tente novamente.',503);}}
export async function POST(req:Request){try{
 if(!validOrigin(req))return fail('Origem inválida.',403);const m=await getMember(req);if(!m)return fail('Faça login para continuar.',401);
 const b=await req.json();if(!validYear(b.year)||!COMPANIES.includes(b.company)||typeof b.sector!=='string'||!['save','submit','approve','return'].includes(b.action)||!Number.isSafeInteger(b.version)||b.version<0||typeof b.note!=='string'||b.note.length>2000)return fail('Revise os dados do orçamento.');
 if(m.role!=='admin'&&(b.sector!==m.sector||['approve','return'].includes(b.action)))return fail('Você só pode editar o orçamento do seu setor.',403);
 if(!await db().prepare('SELECT name FROM areas WHERE name=?').bind(b.sector).first())return fail('Selecione uma área cadastrada.');
 const old=await db().prepare('SELECT * FROM budget_plans WHERE year=? AND company=? AND sector=?').bind(b.year,b.company,b.sector).first<BudgetPlan>();
 if((old?.version||0)!==b.version)return fail('O orçamento foi alterado por outro usuário. Recarregue antes de salvar.',409);
 if(m.role!=='admin'&&old&&['submitted','approved'].includes(old.status))return fail('Este orçamento está em revisão ou aprovado. Solicite a reabertura ao Adriano.',403);
 if(b.action==='approve'&&old?.status!=='submitted')return fail('Envie o orçamento para revisão antes de aprovar.');
 if(b.action==='return'&&(!old||!['submitted','approved'].includes(old.status)||!b.note.trim()))return fail('Informe o motivo da solicitação de ajustes.');
 if(!b.amounts||typeof b.amounts!=='object'||Array.isArray(b.amounts))return fail('Valores inválidos.');
 const allowedStages=m.role==='admin'?BUDGET_STAGES:await allowedBudgetStages(m.sector);const ids=new Set<string>(allowedStages.map(s=>s.id)),amounts:BudgetAmounts={};if(!ids.size)return fail('A Controladoria ainda não liberou orçamentos para este setor.',403);
 for(const [id,v] of Object.entries(b.amounts)){if(!ids.has(id))return fail('Seu setor não tem permissão para preencher esta despesa.',403);if(!Array.isArray(v)||v.length!==12||!v.every(x=>Number.isSafeInteger(x)&&x>=0&&x<=100000000))return fail('Informe valores entre zero e R$ 1.000.000,00 por etapa e mês.');if(v.some(x=>x>0))amounts[id]=v;}
 if(b.action==='submit'&&!Object.keys(amounts).length)return fail('Preencha ao menos uma despesa antes de enviar.');
 if(m.role!=='admin'&&old)Object.assign(amounts,Object.fromEntries(Object.entries(old.amounts).filter(([id])=>!ids.has(id))));
 const status=b.action==='submit'?'submitted':b.action==='approve'?'approved':b.action==='return'?'changes':old?.status==='changes'?'changes':'draft';
 // Optimistic version and audit snapshot are committed in the same SQL statement.
 const result=await db().prepare(`WITH saved AS (
 INSERT INTO budget_plans(year,company,sector,amounts,status,note,updated_by) VALUES (?,?,?,?::jsonb,?,?,?)
 ON CONFLICT(year,company,sector) DO UPDATE SET amounts=excluded.amounts,status=excluded.status,note=excluded.note,updated_by=excluded.updated_by,updated_at=now(),version=budget_plans.version+1 WHERE budget_plans.version=?
 RETURNING *), audited AS (INSERT INTO budget_history(id,year,company,sector,actor,action,version,snapshot) SELECT ?::uuid,year,company,sector,?,?,version,to_jsonb(saved) FROM saved RETURNING id) SELECT saved.* FROM saved JOIN audited ON true`).bind(b.year,b.company,b.sector,amounts,status,b.note.trim(),m.username,b.version,crypto.randomUUID(),m.username,b.action).first();
 if(!result)return fail('O orçamento foi alterado por outro usuário. Recarregue antes de salvar.',409);
 return Response.json({ok:true,plan:m.role==='admin'?result:{...result,amounts:limitAmounts((result as unknown as BudgetPlan).amounts,ids)}});
}catch(e){console.error(e);return fail('Não foi possível salvar. Seu preenchimento foi preservado.',503);}}
