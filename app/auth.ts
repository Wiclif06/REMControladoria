import { database } from './database';
import { cookies } from 'next/headers';
export type Member={username:string,display_name:string,role:'admin'|'manager',sector:string};
export function db(){return database();}
const encoder=new TextEncoder();
export const hex=(b:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(b instanceof Uint8Array?b.buffer:b)).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function digest(v:string){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(v)));}
export async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256));}
export function constantEqual(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
export function randomToken(){return hex(crypto.getRandomValues(new Uint8Array(32)));}
export async function initialize(){if(!await db().prepare('SELECT username FROM app_users WHERE username=?').bind('adriano.bastos').first()){const password=process.env.INITIAL_ADMIN_PASSWORD;if(!password||password.length<8)throw Error('INITIAL_ADMIN_PASSWORD não configurada');const salt=randomToken();await db().prepare("INSERT OR IGNORE INTO app_users(username,display_name,role,sector,salt,password_hash,active) VALUES ('adriano.bastos','Adriano Bastos','admin','Todos',?, ?,1)").bind(salt,await passwordHash(password,salt)).run();}await db().prepare('INSERT OR IGNORE INTO areas(name) SELECT DISTINCT sector FROM employees').run();}
export async function getMember(request?:Request):Promise<Member|null>{const jar=request?null:await cookies();const token=request?request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('rem_session='))?.slice('rem_session='.length):jar?.get('rem_session')?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;return db().prepare('SELECT u.username,u.display_name,u.role,u.sector FROM sessions s JOIN app_users u ON u.username=s.username WHERE s.token_hash=? AND s.expires>? AND u.active=1').bind(await digest(token),Date.now()).first<Member>();}
export function validOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}

