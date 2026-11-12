import {DEFAULT_CATEGORIES} from './finance.js';
const KEY='jarvis-expencer-v1';
export function initialState(){return {version:1,transactions:[],categories:structuredClone(DEFAULT_CATEGORIES),budgets:{},categoryBudgets:{},theme:'dark',collapsed:false};}
export function loadState(){const raw=localStorage.getItem(KEY);if(!raw)return initialState();const s=JSON.parse(raw);if(s.version!==1||!Array.isArray(s.transactions)||!Array.isArray(s.categories)||!s.budgets)throw Error('Datele salvate nu pot fi citite.');s.categoryBudgets ??= {};
for(const category of DEFAULT_CATEGORIES){if(!s.categories.some(c=>c.id===category.id))s.categories.push(structuredClone(category));}
const fuel=s.categories.find(c=>c.id==='cat-1');if(fuel){fuel.name='Motorină';fuel.parentId='cat-car';}
return s;}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state));}
export function demoTransactions(month){return [['Salariu','income',850000,0,1],['Freelance · proiect web','income',180000,8,5],['Cumpărături săptămânale','expense',28650,0,2],['Abonament internet','expense',6500,2,3],['Motorină OMV','expense',32000,1,4],['Cafea & mic dejun','expense',4850,0,5],['Factură energie','expense',24800,2,6],['Cumpărături online','expense',45900,3,7],['Cinema cu prietenii','expense',8500,6,8],['Prânz în oraș','expense',7400,0,9],['Farmacie','expense',12750,5,10],['Economii lunare','expense',100000,7,10],['Supermarket','expense',35475,0,11]].map(([name,type,amount,cat,day])=>({id:crypto.randomUUID(),name,type,amount,category:'cat-'+cat,date:month+'-'+String(day).padStart(2,'0'),description:''}));}
