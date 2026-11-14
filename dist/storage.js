import {DEFAULT_CATEGORIES} from './finance.js?v=single-balance-20261114';
const KEY='jarvis-expencer-v1';
export function initialState({legacyCategories=false}={}){return {version:1,transactions:[],categories:legacyCategories?structuredClone(DEFAULT_CATEGORIES):[],...(legacyCategories?{}:{localCategories:true}),budgets:{},categoryBudgets:{},favorites:[],bills:[],goals:[],monthClosures:{},mealVouchers:{},mealAllocations:{},theme:'dark',collapsed:false};}
export function loadState(){const raw=localStorage.getItem(KEY);if(!raw)return initialState();const s=JSON.parse(raw);if(s.version!==1||!Array.isArray(s.transactions)||!Array.isArray(s.categories)||!s.budgets)throw Error('Datele salvate nu pot fi citite.');s.favorites ??= [];s.bills ??= [];s.goals ??= [];s.monthClosures ??= {};s.categoryBudgets ??= {};s.mealVouchers ??= {};s.mealAllocations ??= {};
const retiredIds=['cat-subscriptions','cat-contracts'];
const deletedIds=new Set(s.deletedCategoryIds||[]);
const invoiceId=deletedIds.has('cat-2')?'uncategorized':'cat-2';
for(const t of s.transactions)if(retiredIds.includes(t.category))t.category=invoiceId;
for(const allocations of Object.values(s.categoryBudgets)){
 for(const id of retiredIds){
  if(invoiceId==='cat-2'&&allocations[id])allocations[invoiceId]=(allocations[invoiceId]||0)+allocations[id];
  delete allocations[id];
 }
}
s.categories=s.categories.filter(c=>!retiredIds.includes(c.id)&&!deletedIds.has(c.id));
if(!s.localCategories)for(const category of DEFAULT_CATEGORIES){
 if(deletedIds.has(category.id))continue;
 const existing=s.categories.find(c=>c.id===category.id);
 const defaults=structuredClone(category);
 if(deletedIds.has(defaults.parentId))delete defaults.parentId;
 if(existing){
  if(existing.renamed)delete defaults.name;
  Object.assign(existing,defaults);
 }else s.categories.push(defaults);
}
const onlyStarterCategories=!s.localCategories&&deletedIds.size===0&&
 s.categories.length===DEFAULT_CATEGORIES.length&&DEFAULT_CATEGORIES.every(defaultCategory=>
  s.categories.some(category=>category.id===defaultCategory.id&&!category.custom&&!category.renamed&&
   category.name===defaultCategory.name&&category.parentId===defaultCategory.parentId&&
   Boolean(category.isGroup)===Boolean(defaultCategory.isGroup)));
const hasFinancialData=s.transactions.length||s.bills.length||s.goals.length||Object.keys(s.monthClosures).length||[s.budgets,s.categoryBudgets,s.mealVouchers,s.mealAllocations]
 .some(values=>Object.keys(values).length);
if(onlyStarterCategories&&!hasFinancialData){
 s.categories=[];
 s.localCategories=true;
}
return s;}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state));}
export function demoTransactions(month){return [['Salariu','income',850000,0,1],['Freelance · proiect web','income',180000,8,5],['Cumpărături săptămânale','expense',28650,0,2],['Abonament internet','expense',6500,2,3],['Motorină OMV','expense',32000,1,4],['Cafea & mic dejun','expense',4850,0,5],['Factură energie','expense',24800,2,6],['Cumpărături online','expense',45900,3,7],['Cinema cu prietenii','expense',8500,6,8],['Prânz în oraș','expense',7400,0,9],['Farmacie','expense',12750,5,10],['Economii lunare','expense',100000,7,10],['Supermarket','expense',35475,0,11]].map(([name,type,amount,cat,day])=>({id:crypto.randomUUID(),name,type,amount,category:'cat-'+cat,date:month+'-'+String(day).padStart(2,'0'),description:''}));}
