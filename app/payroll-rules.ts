import { db } from './auth';
export const COMPANIES=['ALPAN','REM Construtora','REM Vendas'] as const;
export const DEFAULT_RULE={inssRate:2000,fgtsRate:800,vacationFactor:13333,thirteenthFactor:10000};
export async function getRules(){const rows=(await db().prepare('SELECT * FROM payroll_rules').all()).results as any[];return COMPANIES.map(company=>{const r=rows.find(r=>r.company===company);return {company,inssRate:r?.inss_rate??DEFAULT_RULE.inssRate,fgtsRate:r?.fgts_rate??DEFAULT_RULE.fgtsRate,vacationFactor:r?.vacation_factor??DEFAULT_RULE.vacationFactor,thirteenthFactor:r?.thirteenth_factor??DEFAULT_RULE.thirteenthFactor};});}
