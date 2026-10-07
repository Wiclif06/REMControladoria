import {db} from './auth';
export const COMPANIES=['ALPAN','REM Construtora','REM Vendas'] as const;
export const DEFAULT_RULE={inssRate:2000,fgtsRate:800,vacationFactor:3333,thirteenthFactor:10000,adjustmentRate:0,adjustmentMonth:1};
export async function getRules(){const rows=(await db().prepare("SELECT * FROM payroll_rules WHERE company IN ('CLT','PJ')").all()).results as any[];return ['CLT','PJ'].map(contract=>{const r=rows.find(r=>r.company===contract),clt=contract==='CLT';return {contract,inssRate:clt?(r?.inss_rate??2000):0,fgtsRate:clt?(r?.fgts_rate??800):0,vacationFactor:clt?3333:0,thirteenthFactor:clt?10000:0,adjustmentRate:r?.adjustment_rate??0,adjustmentMonth:r?.adjustment_month??1};});}
