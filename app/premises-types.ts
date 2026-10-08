export const PREMISE_QUESTIONS=[
 {id:'hiring',question:'Sua área precisa de novas contratações?',hint:'Informe os cargos, o motivo e quando pretende contratar.',unit:'Pessoas'},
 {id:'dismissals',question:'Há desligamentos previstos?',hint:'Informe os cargos e o período previsto.',unit:'Pessoas'},
 {id:'promotions',question:'Há promoções previstas?',hint:'Descreva os cargos, o reajuste esperado e o mês previsto.',unit:'Pessoas'},
 {id:'bonuses',question:'Há bonificações previstas?',hint:'Descreva os critérios, o valor estimado e quando serão pagas.',unit:'Pessoas'},
 {id:'training',question:'Quais treinamentos serão necessários?',hint:'Informe os treinamentos, participantes e período previsto.',unit:'Treinamentos'},
 {id:'currentSoftware',question:'Quais softwares a área utiliza hoje?',hint:'Liste os softwares e a quantidade de licenças de cada um.',unit:'Licenças'},
 {id:'newSoftware',question:'Quais novos softwares serão necessários?',hint:'Liste os softwares, licenças e quando começarão a ser utilizados.',unit:'Licenças'},
 {id:'equipment',question:'Quais equipamentos serão necessários?',hint:'Descreva os equipamentos e o período previsto para aquisição.',unit:'Unidades'},
 {id:'furniture',question:'Quais itens de mobiliário serão necessários?',hint:'Descreva os móveis e quando serão necessários.',unit:'Unidades'},
 {id:'consulting',question:'Quais assessorias e consultorias serão necessárias?',hint:'Descreva os serviços e o período de contratação.',unit:'Serviços'},
 {id:'administrative',question:'Quais despesas administrativas estão previstas?',hint:'Descreva as despesas, a frequência e os valores estimados, se souber.',unit:'Itens'}
] as const;
export type PremiseItem={text:string;quantity:number|null};
export type PremiseAnswer=PremiseItem & {items?:PremiseItem[]};
export type PremiseAnswers=Record<string,PremiseAnswer>;
export type PremisePlan={year:number;company:string;sector:string;answers:PremiseAnswers;version:number;updated_by:string;updated_at:string};
export const answerItems=(answer?:PremiseAnswer):PremiseItem[]=>answer?.items?.length?answer.items:[{text:answer?.text||'',quantity:answer?.quantity??null}];
export const hasAnswer=(answer?:PremiseAnswer)=>answerItems(answer).some(item=>item.text.trim()||item.quantity!==null);
export const makeAnswer=(items:PremiseItem[]):PremiseAnswer=>({...items[0],items});
export const emptyAnswers=():PremiseAnswers=>Object.fromEntries(PREMISE_QUESTIONS.map(q=>[q.id,{text:'',quantity:null}]));
export function validateAnswers(input:unknown):PremiseAnswers|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const source=input as Record<string,any>,allowed=new Set<string>(PREMISE_QUESTIONS.map(q=>q.id));
 if(Object.keys(source).some(id=>!allowed.has(id)))return null;
 const result=emptyAnswers();let totalText=0;
 for(const q of PREMISE_QUESTIONS){const a=source[q.id];if(a===undefined)continue;if(!a||typeof a!=='object')return null;
 const items=a.items===undefined?[a]:a.items;
 if(!Array.isArray(items)||items.length<1||items.length>50)return null;
 const clean:PremiseItem[]=[];for(const item of items){if(!item||typeof item.text!=='string'||item.text.length>4000||(item.quantity!==null&&(!Number.isSafeInteger(item.quantity)||item.quantity<0||item.quantity>100000)))return null;totalText+=item.text.length;if(totalText>100000)return null;clean.push({text:item.text.trim(),quantity:item.quantity});}
 result[q.id]=makeAnswer(clean);
 }return result;
}
