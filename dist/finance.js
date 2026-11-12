export const DEFAULT_CATEGORIES = ['Alimentație','Motorină','Facturi','Cumpărături','Datorii','Sănătate','Divertisment','Economii','Alte cheltuieli'].map((name,i)=>({id:'cat-'+i,name,custom:false,color:['#818cf8','#38bdf8','#fbbf24','#f472b6','#fb923c','#2dd4bf','#a78bfa','#4ade80','#94a3b8'][i],icon:['shopping-basket','fuel','receipt-text','shopping-bag','hand-coins','heart-pulse','clapperboard','piggy-bank','ellipsis'][i],...(i===1?{parentId:'cat-car'}:{})}));
DEFAULT_CATEGORIES.push(
{id:'cat-car',name:'Mașină',custom:false,color:'#38bdf8',icon:'car',isGroup:true},
...['Asigurare','ITP','Consumabile','Parcare','Reparații'].map((name,i)=>({id:'cat-car-'+i,name,custom:false,color:'#38bdf8',icon:['shield-check','clipboard-check','wrench','square-parking','settings-2'][i],parentId:'cat-car'})),
{id:'cat-travel',name:'Călătorii',custom:false,color:'#2dd4bf',icon:'plane'},
{id:'cat-events',name:'Evenimente',custom:false,color:'#f472b6',icon:'calendar-heart'}
);
export const money = n => new Intl.NumberFormat('ro-RO',{style:'currency',currency:'RON',minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100);
export const number = n => new Intl.NumberFormat('ro-RO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100);
export function parseMoney(raw){ const s=String(raw).trim(); if(!/^\d+(?:[.,]\d{1,2})?$/.test(s))throw Error('Introdu o sumă validă, cu cel mult două zecimale.'); const n=Math.round(Number(s.replace(',','.'))*100); if(!Number.isSafeInteger(n)||n>999999999999)throw Error('Suma este prea mare.');return n; }
export function summarize(transactions,budget=0){const income=transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),expenses=transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);return {income,expenses,balance:income-expenses,remaining:budget-expenses,used:budget?expenses*100/budget:0};}
export function inMonth(transactions,month){return transactions.filter(t=>t.date.startsWith(month));}
export function breakdown(transactions,categories){return categories.map(c=>({...c,total:transactions.filter(t=>t.type==='expense'&&t.category===c.id).reduce((s,t)=>s+t.amount,0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);}
export function dailyExpenses(transactions,month){const days=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();return Array.from({length:days},(_,i)=>({day:i+1,total:transactions.filter(t=>t.type==='expense'&&Number(t.date.slice(8))===i+1).reduce((s,t)=>s+t.amount,0)}));}
export function csv(transactions,categories){const cell=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return '\uFEFF'+[['Denumire','Categorie','Dată','Tip','Sumă (RON)','Descriere'],...transactions.map(t=>[t.name,categoryLabel(categories.find(c=>c.id===t.category),categories),t.date,t.type==='income'?'Venit':'Cheltuială',(t.amount/100).toFixed(2).replace('.',','),t.description])].map(r=>r.map(cell).join(';')).join('\r\n');}

export function categoryBudgetSummary(transactions,categories,categoryBudgets,month){
  const rows=inMonth(transactions,month);
  return categories.map(c=>{
    const ids=c.isGroup?categories.filter(child=>child.parentId===c.id).map(child=>child.id):[c.id];
    const allocated=ids.reduce((sum,id)=>sum+(categoryBudgets?.[month]?.[id]||0),0);
    const spent=rows.filter(t=>t.type==='expense'&&ids.includes(t.category)).reduce((sum,t)=>sum+t.amount,0);
    return {...c,allocated,spent,remaining:allocated?allocated-spent:null,used:allocated?spent*100/allocated:0};
  });
}

export function setMonthlySalary(state,{month,amount,date,transactionId=null}){
  if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Salariul trebuie să fie mai mare decât zero.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!date.startsWith(month+'-')||new Date(date+'T12:00:00').toISOString().slice(0,10)!==date)throw Error('Data salariului trebuie să fie în luna selectată.');
  const linked=state.transactions.find(t=>t.salaryMonth===month);
  const existing=transactionId?state.transactions.find(t=>t.id===transactionId):linked;
  if(transactionId&&(!existing||existing.type!=='income'||!existing.date.startsWith(month+'-')))throw Error('Selectează un venit din luna curentă.');
  if(linked&&existing&&linked.id!==existing.id)throw Error('Salariul acestei luni este deja asociat altei tranzacții.');
  if(existing){existing.amount=amount;existing.date=date;existing.salaryMonth=month;}
  else state.transactions.push({id:crypto.randomUUID(),name:'Salariu',amount,date,type:'income',category:'cat-8',description:'Salariu alocat bugetului lunar.',salaryMonth:month});
  state.budgets[month]=amount;
}

export function allocationSummary(categories,categoryBudgets,month,total){
 const allocated=categories.filter(c=>!c.isGroup).reduce((sum,c)=>sum+(categoryBudgets?.[month]?.[c.id]||0),0);
 return {total,allocated,unallocated:total-allocated};
}
export function categoryLabel(category,categories){const parent=categories.find(c=>c.id===category?.parentId);return parent?parent.name+' / '+category.name:category?.name||'Fără categorie';}
