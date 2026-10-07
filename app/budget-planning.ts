export function distributeBudget(current:number[],cents:number,start:number,end:number,annual:boolean){
 if(current.length!==12||!Number.isSafeInteger(cents)||cents<0||!Number.isInteger(start)||!Number.isInteger(end)||start<1||end>12||end<start)throw Error('Informe um valor e um período válidos.');
 const count=end-start+1,base=annual?Math.floor(cents/count):cents,remainder=annual?cents%count:0;
 if(base+(remainder?1:0)>100000000)throw Error('O limite é R$ 1.000.000,00 por mês.');
 return current.map((value,i)=>i+1>=start&&i+1<=end?base+(i-start+1<remainder?1:0):value);
}
