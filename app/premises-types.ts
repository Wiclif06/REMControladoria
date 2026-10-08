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
export type PremiseAnswer={text:string;quantity:number|null};
export type PremiseAnswers=Record<string,PremiseAnswer>;
export type PremisePlan={year:number;company:string;sector:string;answers:PremiseAnswers;version:number;updated_by:string;updated_at:string};
export const emptyAnswers=():PremiseAnswers=>Object.fromEntries(PREMISE_QUESTIONS.map(q=>[q.id,{text:'',quantity:null}]));
export function validateAnswers(input:unknown):PremiseAnswers|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const source=input as Record<string,any>,allowed=new Set<string>(PREMISE_QUESTIONS.map(q=>q.id));
 if(Object.keys(source).some(id=>!allowed.has(id)))return null;
 const result=emptyAnswers();for(const q of PREMISE_QUESTIONS){const a=source[q.id];if(a===undefined)continue;if(!a||typeof a.text!=='string'||a.text.length>4000||(a.quantity!==null&&(!Number.isSafeInteger(a.quantity)||a.quantity<0||a.quantity>100000)))return null;result[q.id]={text:a.text.trim(),quantity:a.quantity};}return result;
}
