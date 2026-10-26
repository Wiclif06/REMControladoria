type PremiseMember={username:string;role:string;sector:string};

export function isPremisesAuthor(member:PremiseMember){
 return member.role==='admin'&&member.username==='adriano.bastos';
}

export function canWritePremises(member:PremiseMember,sector:string){
 if(member.role==='manager')return sector===member.sector;
 return isPremisesAuthor(member)&&['Controladoria','Diretora','Diretoria'].includes(sector);
}
