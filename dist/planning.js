import {inMonth,summarize,monthlyIncome,mealSummary} from './finance.js?v=planning-20261113';
const validAmount=n=>Number.isSafeInteger(n)&&n>0&&n<=999999999999;
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='1900-01-01'&&s<='9999-12-31'&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function billPayment(state,bill){return state.transactions.find(t=>t.id===bill.transactionId&&t.type==='expense')||null;}
export function billStatus(state,bill,today){return billPayment(state,bill)?'paid':bill.dueDate<today?'overdue':bill.dueDate===today?'today':'upcoming';}
export function saveBill(state,bill){
 if(!bill.name?.trim()||bill.name.length>100||!validAmount(bill.amount)||!validDate(bill.dueDate))throw Error('Completează denumirea, suma și o dată scadentă validă.');
 state.bills??=[];const old=state.bills.find(b=>b.id===bill.id);if(old&&billPayment(state,old))throw Error('Factura este deja achitată. Modifică sau șterge plata în Tranzacții înainte de editarea facturii.');
 if(bill.category!=='uncategorized'&&!state.categories.some(c=>c.id===bill.category&&!c.isGroup))throw Error('Alege o categorie existentă.');
 const entry={id:old?.id||crypto.randomUUID(),name:bill.name.trim(),amount:bill.amount,dueDate:bill.dueDate,category:bill.category,transactionId:old?.transactionId||null};
 if(old)state.bills[state.bills.indexOf(old)]=entry;else state.bills.push(entry);return entry;
}
export function payBill(state,id,{date,transactionId=null}={}){
 const bill=state.bills?.find(b=>b.id===id);if(!bill)throw Error('Factura nu mai există.');if(billPayment(state,bill))throw Error('Factura este deja achitată.');
 let transaction;if(transactionId){transaction=state.transactions.find(t=>t.id===transactionId);if(!transaction||transaction.type!=='expense'||transaction.paymentSource==='meal'||transaction.billId||transaction.goalId||transaction.savingsContribution)throw Error('Alege o cheltuială din bani, neasociată altei facturi sau unui obiectiv.');}
 else{if(!validDate(date))throw Error('Alege o dată validă pentru plată.');transaction={id:crypto.randomUUID(),name:bill.name,amount:bill.amount,date,type:'expense',category:state.categories.some(c=>c.id===bill.category)?bill.category:'uncategorized',paymentSource:'cash',description:'Plată factură: '+bill.name};state.transactions.push(transaction);}
 transaction.billId=bill.id;bill.transactionId=transaction.id;return transaction;
}
export function removeBill(state,id){const bill=state.bills?.find(b=>b.id===id);if(!bill)throw Error('Factura nu mai există.');state.transactions.forEach(t=>{if(t.billId===id)delete t.billId;});state.bills=state.bills.filter(b=>b.id!==id);}
export function saveGoal(state,goal){
 if(!goal.name?.trim()||goal.name.length>100||!validAmount(goal.targetAmount)||(goal.deadline&&!validDate(goal.deadline)))throw Error('Completează numele, ținta și un termen valid, dacă îl folosești.');
 if(goal.category!=='uncategorized'&&!state.categories.some(c=>c.id===goal.category&&!c.isGroup))throw Error('Alege o categorie existentă.');
 state.goals??=[];const old=state.goals.find(g=>g.id===goal.id),entry={id:old?.id||crypto.randomUUID(),name:goal.name.trim(),targetAmount:goal.targetAmount,category:goal.category,deadline:goal.deadline||''};
 if(old)state.goals[state.goals.indexOf(old)]=entry;else state.goals.push(entry);return entry;
}
export function goalProgress(state,goal){const rows=state.transactions.filter(t=>t.goalId===goal.id&&t.type==='expense'&&t.paymentSource!=='meal');const saved=rows.reduce((s,t)=>s+t.amount,0);return {saved,remaining:Math.max(0,goal.targetAmount-saved),percent:saved*100/goal.targetAmount,rows:rows.toSorted((a,b)=>b.date.localeCompare(a.date))};}
export function contributeGoal(state,id,{amount,date,transactionId=null}={}){
 const goal=state.goals?.find(g=>g.id===id);if(!goal)throw Error('Obiectivul nu mai există.');let transaction;
 if(transactionId){transaction=state.transactions.find(t=>t.id===transactionId);if(!transaction||transaction.type!=='expense'||transaction.paymentSource==='meal'||transaction.billId||transaction.goalId)throw Error('Alege o cheltuială din bani care nu este asociată deja.');}
 else{if(!validAmount(amount)||!validDate(date))throw Error('Introdu suma și data contribuției.');transaction={id:crypto.randomUUID(),name:'Economii · '+goal.name,amount,date,type:'expense',category:state.categories.some(c=>c.id===goal.category)?goal.category:'uncategorized',paymentSource:'cash',description:'Contribuție la obiectiv: '+goal.name};state.transactions.push(transaction);}
 transaction.goalId=goal.id;transaction.savingsContribution=true;return transaction;
}
export function removeGoal(state,id){if(!state.goals?.some(g=>g.id===id))throw Error('Obiectivul nu mai există.');state.transactions.forEach(t=>{if(t.goalId===id)delete t.goalId;});state.goals=state.goals.filter(g=>g.id!==id);}
export function preservePlanningLink(previous,entry){if(previous?.savingsContribution&&entry.type==='expense'&&entry.paymentSource!=='meal')entry.savingsContribution=true;if(!previous?.billId&&!previous?.goalId)return;if(entry.type!=='expense'||entry.paymentSource==='meal')throw Error('Plățile asociate facturilor sau obiectivelor trebuie să rămână cheltuieli din bani.');if(previous.billId)entry.billId=previous.billId;if(previous.goalId)entry.goalId=previous.goalId;}
export function monthlyClosingSummary(state,month){
 const rows=inMonth(state.transactions,month),cash=summarize(rows,state.budgets[month]||0),income=monthlyIncome(state,month),meal=mealSummary(state,month);
 const roots=state.categories.filter(c=>c.id==='cat-7'||c.name.trim().toLocaleLowerCase('ro-RO')==='economii').map(c=>c.id);const savingsIds=new Set(state.categories.filter(c=>roots.includes(c.id)||roots.includes(c.parentId)).map(c=>c.id));
 const savings=rows.filter(t=>t.type==='expense'&&t.paymentSource!=='meal'&&(t.goalId||t.savingsContribution||savingsIds.has(t.category))).reduce((s,t)=>s+t.amount,0);
 return {cashIncome:income.cash,mealIncome:income.vouchers,income:income.total,expenses:cash.expenses,cashExpenses:income.cash-cash.balance,mealExpenses:meal.spent,cashBalance:cash.balance,mealBalance:meal.remaining,savings,transactions:rows.length,budget:state.budgets[month]||0,budgetRemaining:cash.remaining};
}
export function closeMonth(state,month){state.monthClosures??={};const closure={closedAt:new Date().toISOString(),totals:monthlyClosingSummary(state,month)};state.monthClosures[month]=closure;return closure;}
export function closureChanged(state,month){const saved=state.monthClosures?.[month];return !!saved&&JSON.stringify(saved.totals)!==JSON.stringify(monthlyClosingSummary(state,month));}
