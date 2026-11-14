import {inMonth,categoryLabel} from './finance.js?v=single-balance-20261114';

export function previousMonth(month){
 const [year,m]=month.split('-').map(Number);return `${m===1?year-1:year}-${String(m===1?12:m-1).padStart(2,'0')}`;
}
export function copyCategoryBudgets(state,target,{replace=false}={}){
 const source=previousMonth(target),valid=new Set(state.categories.map(c=>c.id));
 const from=Object.entries(state.categoryBudgets?.[source]||{}).filter(([id,n])=>valid.has(id)&&n>0);
 if(!from.length)throw Error('Luna trecută nu are bugete de copiat pentru categoriile existente.');
 state.categoryBudgets??={};state.categoryBudgets[target]??={};let copied=0;
 for(const [id,amount] of from){if(replace||!Object.hasOwn(state.categoryBudgets[target],id)){state.categoryBudgets[target][id]=amount;copied++;}}
 return copied;
}
export function budgetStatus(allocated,spent){
 if(!allocated)return {level:'none',label:'',percent:0};
 const percent=Math.round(spent*100/allocated);
 return spent>allocated?{level:'over',label:'Buget depășit',percent}:spent===allocated?{level:'full',label:'Buget utilizat integral',percent}:spent*100>=allocated*80?{level:'warning',label:'Ai folosit cel puțin 80%',percent}:{level:'ok',label:'',percent};
}
export function monthlyComparison(state,month){
 const previous=previousMonth(month),currentRows=inMonth(state.transactions,month),previousRows=inMonth(state.transactions,previous);
 const categories=[...state.categories];if([...currentRows,...previousRows].some(t=>t.type==='expense'&&!categories.some(c=>c.id===t.category)))categories.push({id:'uncategorized',name:'Fără categorie'});
 return categories.map(c=>{
  const ids=c.isGroup?[c.id,...state.categories.filter(child=>child.parentId===c.id).map(child=>child.id)]:[c.id];const sum=rows=>rows.filter(t=>t.type==='expense'&&(c.id==='uncategorized'?!state.categories.some(cat=>cat.id===t.category):ids.includes(t.category))).reduce((s,t)=>s+t.amount,0);
  const current=sum(currentRows),prior=sum(previousRows);return {id:c.id,name:categoryLabel(c,state.categories)+(c.isGroup?' (total grup)':''),current,previous:prior,delta:current-prior,percent:prior?(current-prior)*100/prior:null};
 }).filter(c=>c.current||c.previous).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
}
const templateFields=['name','amount','type','category','paymentSource','description'];
export function favoriteMatches(a,b){return templateFields.every(key=>(a[key]??(key==='paymentSource'?'cash':''))===(b[key]??(key==='paymentSource'?'cash':'')));}
export function toggleFavorite(state,transaction){
 state.favorites??=[];const i=state.favorites.findIndex(f=>favoriteMatches(f,transaction));
 if(i>=0){state.favorites.splice(i,1);return false;}
 const template={id:crypto.randomUUID()};for(const key of templateFields)template[key]=transaction[key]??(key==='paymentSource'?'cash':'');
 state.favorites.push(template);return true;
}
export function createBackup(state){return JSON.stringify({app:'IXpence',backupVersion:1,exportedAt:new Date().toISOString(),data:state},null,2);}
export function parseBackup(text){
 let envelope;try{envelope=JSON.parse(text);}catch{throw Error('Fișierul nu conține JSON valid.');}
 const fail=()=>{throw Error('Backup invalid sau incompatibil. Datele curente nu au fost modificate.');};
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
 const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
 const str=(v,max)=>typeof v==='string'&&v.length<=max;
 const amount=v=>Number.isSafeInteger(v)&&v>=0&&v<=999999999999;
 const month=v=>typeof v==='string'&&/^(?:19|[2-9]\d)\d{2}-(?:0[1-9]|1[0-2])$/.test(v);
 const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&month(v.slice(0,7))&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
 if(!object(envelope)||envelope.app!=='IXpence'||envelope.backupVersion!==1||!object(envelope.data))fail();
 const d=envelope.data;if(d.version!==1||!object(d.budgets)||!Array.isArray(d.categories)||!Array.isArray(d.transactions)||d.categories.length>5000||d.transactions.length>100000)fail();
 const categories=d.categories.map(c=>{if(!object(c)||!id(c.id)||!str(c.name,100)||!c.name.trim()||!/^#[0-9a-fA-F]{6}$/.test(c.color)||!str(c.icon,60)||!/^[a-z0-9-]+$/.test(c.icon)||(c.parentId!==undefined&&!id(c.parentId)))fail();return {id:c.id,name:c.name,color:c.color,icon:c.icon,custom:!!c.custom,...(c.isGroup?{isGroup:true}:{}),...(c.renamed?{renamed:true}:{}),...(c.parentId?{parentId:c.parentId}:{})};});
 const ids=new Set(categories.map(c=>c.id));if(ids.size!==categories.length)fail();
 for(const c of categories)if(c.parentId&&(!ids.has(c.parentId)||c.parentId===c.id||categories.find(p=>p.id===c.parentId)?.parentId||!categories.find(p=>p.id===c.parentId)?.isGroup))fail();
 const entry=(t,isTemplate=false)=>{if(!object(t)||!id(t.id)||!str(t.name,100)||!t.name.trim()||!amount(t.amount)||!t.amount||!['income','expense'].includes(t.type)||!id(t.category)||(t.description!==undefined&&!str(t.description,500))||!['cash','meal'].includes(t.paymentSource||'cash'))fail();if(!isTemplate&&!date(t.date))fail();if(t.salaryMonth&&(!month(t.salaryMonth)||t.type!=='income'||t.salaryMonth!==t.date?.slice(0,7)))fail();if(t.paymentSource==='meal'&&t.type!=='expense')fail();if((t.billId&&!id(t.billId))||(t.goalId&&!id(t.goalId))||(t.billId&&t.goalId)||((t.billId||t.goalId)&&(t.type!=='expense'||t.paymentSource==='meal')))fail();return {id:t.id,name:t.name,amount:t.amount,type:t.type,category:t.category,paymentSource:t.paymentSource||'cash',description:t.description||'',...(!isTemplate?{date:t.date}:{}),...(t.salaryMonth?{salaryMonth:t.salaryMonth}:{}),...(!isTemplate&&t.billId?{billId:t.billId}:{}),...(!isTemplate&&t.goalId?{goalId:t.goalId}:{}),...(!isTemplate&&t.savingsContribution?{savingsContribution:true}:{})};};
 const transactions=d.transactions.map(t=>entry(t));if(new Set(transactions.map(t=>t.id)).size!==transactions.length)fail();
 const budgets=(v,nested=false)=>{if(v===undefined)return {};if(!object(v))fail();const result={};for(const [m,values] of Object.entries(v)){if(!month(m))fail();if(nested){if(!object(values))fail();result[m]={};for(const [key,n] of Object.entries(values)){if(!id(key)||!amount(n))fail();result[m][key]=n;}}else{if(!amount(values))fail();result[m]=values;}}return result;};
 const favorites=d.favorites===undefined?[]:Array.isArray(d.favorites)&&d.favorites.length<=1000?d.favorites.map(t=>entry(t,true)):fail();
 if(new Set(favorites.map(t=>t.id)).size!==favorites.length)fail();
 const result={version:1,localCategories:true,categories,transactions,budgets:budgets(d.budgets),categoryBudgets:budgets(d.categoryBudgets,true),mealVouchers:budgets(d.mealVouchers),mealAllocations:budgets(d.mealAllocations),favorites,theme:d.theme==='light'?'light':'dark',collapsed:!!d.collapsed};
 if(d.deletedCategoryIds!==undefined){if(!Array.isArray(d.deletedCategoryIds)||!d.deletedCategoryIds.every(id))fail();result.deletedCategoryIds=[...new Set(d.deletedCategoryIds)];}
 for(const [m,n] of Object.entries(result.mealAllocations))if(n>(result.mealVouchers[m]||0))fail();
 const salaries=transactions.filter(t=>t.salaryMonth).map(t=>t.salaryMonth);if(new Set(salaries).size!==salaries.length)fail();
 const list=(value,validate)=>{if(value===undefined)return [];if(!Array.isArray(value)||value.length>10000)fail();const rows=value.map(validate);if(new Set(rows.map(x=>x.id)).size!==rows.length)fail();return rows;};
 result.bills=list(d.bills,b=>{if(!object(b)||!id(b.id)||!str(b.name,100)||!b.name.trim()||!amount(b.amount)||!b.amount||!date(b.dueDate)||!id(b.category)||(b.transactionId!==null&&b.transactionId!==undefined&&!id(b.transactionId)))fail();return {id:b.id,name:b.name,amount:b.amount,dueDate:b.dueDate,category:b.category,transactionId:b.transactionId||null};});
 result.goals=list(d.goals,g=>{if(!object(g)||!id(g.id)||!str(g.name,100)||!g.name.trim()||!amount(g.targetAmount)||!g.targetAmount||!id(g.category)||(g.deadline&&!date(g.deadline)))fail();return {id:g.id,name:g.name,targetAmount:g.targetAmount,category:g.category,deadline:g.deadline||''};});
 result.monthClosures={};if(d.monthClosures!==undefined){if(!object(d.monthClosures))fail();for(const [m,c] of Object.entries(d.monthClosures)){if(!month(m)||!object(c)||!str(c.closedAt,50)||!Number.isFinite(Date.parse(c.closedAt))||!object(c.totals))fail();const totals={};for(const key of ['cashIncome','mealIncome','income','expenses','cashExpenses','mealExpenses','cashBalance','mealBalance','savings','transactions','budget','budgetRemaining']){const n=c.totals[key];if(!Number.isSafeInteger(n)||(!['cashBalance','mealBalance','budgetRemaining'].includes(key)&&n<0))fail();totals[key]=n;}result.monthClosures[m]={closedAt:c.closedAt,totals};}}
 for(const t of transactions){if(t.goalId&&!result.goals.some(g=>g.id===t.goalId))fail();if(t.billId&&!result.bills.some(b=>b.id===t.billId&&b.transactionId===t.id))fail();}
 for(const b of result.bills){const t=transactions.find(t=>t.id===b.transactionId);if(t&&t.billId!==b.id)fail();}
 return result;
}
