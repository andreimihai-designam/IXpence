import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMoney,summarize,inMonth,breakdown,dailyExpenses,csv,DEFAULT_CATEGORIES} from '../dist/finance.js';
import {initialState,loadState,saveState,demoTransactions} from '../dist/storage.js';
const rows=[{id:'1',name:'Salariu',type:'income',amount:900000,category:'cat-8',date:'2026-11-01'},{id:'2',name:'Market',type:'expense',amount:10025,category:'cat-0',date:'2026-11-02'},{id:'3',name:'Cafea',type:'expense',amount:1275,category:'cat-0',date:'2026-11-02'},{id:'4',name:'Anterior',type:'expense',amount:99999,category:'cat-2',date:'2026-10-30'}];
test('Romanian amounts are converted exactly to integer bani',()=>{assert.equal(parseMoney('1234,56'),123456);assert.equal(parseMoney('0.29'),29);assert.equal(parseMoney('100'),10000);for(const s of ['-1','NaN','1e5','1,001','','1.000,00'])assert.throws(()=>parseMoney(s));});
test('Monthly totals, budget overspending and zero budget',()=>{const current=inMonth(rows,'2026-11');assert.deepEqual(summarize(current,10000),{income:900000,expenses:11300,balance:888700,remaining:-1300,used:113});assert.equal(summarize([],0).used,0);});
test('Edits and deletions recompute totals rather than retaining stale values',()=>{const copy=structuredClone(rows);copy[1].amount=20000;assert.equal(summarize(inMonth(copy,'2026-11')).expenses,21275);copy.splice(1,1);assert.equal(summarize(inMonth(copy,'2026-11')).expenses,1275);});
test('Categories and daily chart agree with transaction totals',()=>{const current=inMonth(rows,'2026-11');assert.equal(breakdown(current,DEFAULT_CATEGORIES)[0].total,11300);const d=dailyExpenses(current,'2026-11');assert.equal(d.length,30);assert.equal(d[1].total,11300);assert.equal(d.reduce((s,x)=>s+x.total,0),11300);assert.equal(dailyExpenses([],'2024-02').length,29);});
test('CSV escapes quotes, Unicode, multiline descriptions and formulas',()=>{const out=csv([{...rows[1],name:'=SUM(A1)',description:'Cafea "bună"\nacasă'}],DEFAULT_CATEGORIES);assert.ok(out.startsWith('\uFEFF'));assert.ok(out.includes('"\'=SUM(A1)"'));assert.ok(out.includes('"100,25"'));assert.ok(out.includes('"Cafea ""bună""\nacasă"'));});
test('Local storage round trip persists edits, categories, monthly budgets and theme',()=>{let raw=null;globalThis.localStorage={getItem:()=>raw,setItem:(key,value)=>raw=value};const s=initialState({legacyCategories:true});s.transactions=structuredClone(rows);s.transactions[1].amount=31025;s.budgets['2026-11']=500000;s.theme='light';s.categories.push({id:'custom',name:'Vacanță',custom:true});saveState(s);assert.deepEqual(loadState(),s);raw='{invalid';assert.throws(()=>loadState());});
test('Demo data respects month and has unique IDs',()=>{const d=demoTransactions('2026-11');assert.ok(d.every(t=>t.date.startsWith('2026-11')));assert.equal(new Set(d.map(t=>t.id)).size,d.length);});

test('Category budgets isolate months, ignore income and update after edits',async()=>{
 const {categoryBudgetSummary}=await import('../dist/finance.js');
 const budgets={'2026-11':{'cat-0':20000},'2026-12':{'cat-0':50000}};
 const current=categoryBudgetSummary([...rows,{...rows[0],category:'cat-0'}],DEFAULT_CATEGORIES,budgets,'2026-11');
 assert.equal(current[0].allocated,20000);assert.equal(current[0].spent,11300);assert.equal(current[0].remaining,8700);
 assert.equal(current[1].remaining,null);
 const edited=rows.map(t=>t.id==='2'?{...t,amount:30000}:t);
 assert.equal(categoryBudgetSummary(edited,DEFAULT_CATEGORIES,budgets,'2026-11')[0].remaining,-11275);
 assert.equal(categoryBudgetSummary(rows,DEFAULT_CATEGORIES,budgets,'2026-12')[0].remaining,50000);
 assert.equal(categoryBudgetSummary(rows,DEFAULT_CATEGORIES,{},'2026-11')[0].allocated,0);
});
test('Existing saved data gains empty category budgets without changing transactions',()=>{
 const old=initialState({legacyCategories:true});delete old.categoryBudgets;old.transactions=structuredClone(rows);
 let raw=JSON.stringify(old);globalThis.localStorage={getItem:()=>raw,setItem:(k,v)=>raw=v};
 const loaded=loadState();assert.deepEqual(loaded.categoryBudgets,{});assert.deepEqual(loaded.transactions,rows);
 loaded.categoryBudgets['2026-11']={'cat-0':12345};saveState(loaded);assert.equal(loadState().categoryBudgets['2026-11']['cat-0'],12345);
 assert.deepEqual(initialState({legacyCategories:true}).categoryBudgets,{});
});

test('Monthly salary creates income and budget once, then updates in place',async()=>{
 const {setMonthlySalary}=await import('../dist/finance.js');const s=initialState({legacyCategories:true});s.categoryBudgets['2026-11']={'cat-0':10000};
 setMonthlySalary(s,{month:'2026-11',amount:500000,date:'2026-11-12'});
 const id=s.transactions[0].id;assert.equal(s.budgets['2026-11'],500000);assert.equal(s.transactions[0].type,'income');
 setMonthlySalary(s,{month:'2026-11',amount:650000,date:'2026-11-13'});
 assert.equal(s.transactions.length,1);assert.equal(s.transactions[0].id,id);assert.equal(s.transactions[0].amount,650000);
 assert.equal(s.categoryBudgets['2026-11']['cat-0'],10000);
 setMonthlySalary(s,{month:'2026-12',amount:600000,date:'2026-12-10'});
 assert.equal(s.transactions.length,2);assert.equal(s.budgets['2026-11'],650000);assert.equal(s.budgets['2026-12'],600000);
});
test('Monthly salary can reuse existing income without duplication',async()=>{
 const {setMonthlySalary}=await import('../dist/finance.js');const s=initialState({legacyCategories:true});s.transactions=structuredClone(rows);
 setMonthlySalary(s,{month:'2026-11',amount:700000,date:'2026-11-02',transactionId:'1'});
 assert.equal(s.transactions.length,rows.length);assert.equal(s.transactions[0].salaryMonth,'2026-11');assert.equal(s.transactions[0].amount,700000);
 assert.throws(()=>setMonthlySalary(s,{month:'2026-11',amount:0,date:'2026-11-02'}));
 assert.throws(()=>setMonthlySalary(s,{month:'2026-11',amount:100,date:'2026-12-02'}));
 assert.throws(()=>setMonthlySalary(s,{month:'2026-11',amount:100,date:'2026-11-02',transactionId:'2'}));
});

test('Car subcategory allocations count once and change the available planning balance',async()=>{
 const {allocationSummary,categoryBudgetSummary}=await import('../dist/finance.js');
 const budgets={'2026-11':{'cat-1':50000,'cat-car-0':20000,'cat-travel':30000}};
 assert.deepEqual(allocationSummary(DEFAULT_CATEGORIES,budgets,'2026-11',500000),{total:500000,allocated:100000,unallocated:400000});
 const summary=categoryBudgetSummary([{type:'expense',amount:12000,category:'cat-1',date:'2026-11-03'}],DEFAULT_CATEGORIES,budgets,'2026-11');
 const car=summary.find(c=>c.id==='cat-car');assert.equal(car.allocated,70000);assert.equal(car.spent,12000);
 budgets['2026-11']['cat-1']=10000;assert.equal(allocationSummary(DEFAULT_CATEGORIES,budgets,'2026-11',500000).unallocated,440000);
 delete budgets['2026-11']['cat-car-0'];assert.equal(allocationSummary(DEFAULT_CATEGORIES,budgets,'2026-11',500000).unallocated,460000);
 assert.equal(allocationSummary(DEFAULT_CATEGORIES,budgets,'2026-12',500000).allocated,0);
});
test('Existing fuel data migrates without losing budgets or duplicating defaults',()=>{
 const old=initialState({legacyCategories:true});old.categories=old.categories.filter(c=>!c.id.startsWith('cat-car')&&!['cat-travel','cat-events'].includes(c.id));
 old.categories.find(c=>c.id==='cat-1').name='Transport / Motorină';delete old.categories.find(c=>c.id==='cat-1').parentId;
 old.categoryBudgets={'2026-11':{'cat-1':23000}};old.transactions=[{...rows[1],category:'cat-1'}];
 let raw=JSON.stringify(old);globalThis.localStorage={getItem:()=>raw,setItem:(k,v)=>raw=v};const loaded=loadState();
 assert.equal(loaded.categories.find(c=>c.id==='cat-1').parentId,'cat-car');assert.equal(loaded.categoryBudgets['2026-11']['cat-1'],23000);
 assert.deepEqual(loaded.transactions,old.transactions);assert.equal(loaded.categories.filter(c=>c.parentId==='cat-car').length,6);
 saveState(loaded);assert.equal(loadState().categories.length,loaded.categories.length);assert.equal(new Set(loaded.categories.map(c=>c.id)).size,loaded.categories.length);
});
test('CSV identifies a subcategory using its parent path',async()=>{
 const {csv}=await import('../dist/finance.js');const output=csv([{...rows[1],category:'cat-1'}],DEFAULT_CATEGORIES);assert.ok(output.includes('Mașină / Motorină'));
});

test('Requested category groups have the exact subcategories and distinct Diverse paths',async()=>{
 const {categoryLabel}=await import('../dist/finance.js');
 const expected={'Divertisment':['Evenimente','Ieșiri'],'Economii':['Călătorii','Apartament'],'Facturi':[],'Cumpărături':['Alimentație','Diverse'],'Diverse':['Sănătate','Alte cheltuieli']};
 for(const [name,children] of Object.entries(expected)){const group=DEFAULT_CATEGORIES.find(c=>c.isGroup&&c.name===name);assert.ok(group);assert.deepEqual(DEFAULT_CATEGORIES.filter(c=>c.parentId===group.id).map(c=>c.name),children);}
 const child=DEFAULT_CATEGORIES.find(c=>c.id==='cat-shopping-misc');assert.equal(categoryLabel(child,DEFAULT_CATEGORIES),'Cumpărături / Diverse');
 assert.ok(!DEFAULT_CATEGORIES.find(c=>c.id==='cat-4').isGroup);
});
test('Regrouping preserves old direct group budgets and totals without double counting',async()=>{
 const {allocationSummary,categoryBudgetSummary}=await import('../dist/finance.js');
 const s=initialState({legacyCategories:true});s.categories=s.categories.filter(c=>!['cat-outings','cat-apartment','cat-subscriptions','cat-contracts','cat-shopping-misc','cat-misc'].includes(c.id));
 for(const c of s.categories)if(['cat-2','cat-3','cat-6','cat-7'].includes(c.id))delete c.isGroup;
 s.transactions=structuredClone(rows);s.categoryBudgets={'2026-11':{'cat-2':10000,'cat-3':20000,'cat-6':30000,'cat-7':40000,'cat-0':5000}};
 let raw=JSON.stringify(s);globalThis.localStorage={getItem:()=>raw,setItem:(k,v)=>raw=v};const loaded=loadState();
 assert.deepEqual(loaded.transactions,s.transactions);assert.deepEqual(loaded.categoryBudgets,s.categoryBudgets);
 assert.equal(allocationSummary(loaded.categories,loaded.categoryBudgets,'2026-11',200000).allocated,105000);
 const group=categoryBudgetSummary(loaded.transactions,loaded.categories,loaded.categoryBudgets,'2026-11').find(c=>c.id==='cat-3');assert.equal(group.allocated,25000);assert.equal(group.spent,11300);
 saveState(loaded);assert.equal(loadState().categories.length,loaded.categories.length);
});

test('Resetting a group clears monthly allocations only and preserves transactions and salary',async()=>{
 const {resetCategoryBudget}=await import('../dist/finance.js');const s=initialState({legacyCategories:true});s.transactions=structuredClone(rows);s.budgets['2026-11']=500000;
 s.categoryBudgets={'2026-11':{'cat-3':10000,'cat-0':20000,'cat-shopping-misc':5000,'cat-4':8000},'2026-12':{'cat-0':9000}};
 s.mealVouchers['2026-11']=40000;s.mealAllocations['2026-11']=40000;
 resetCategoryBudget(s,'2026-11','cat-3');assert.deepEqual(s.categoryBudgets['2026-11'],{'cat-4':8000});assert.equal(s.mealAllocations['2026-11'],0);
 assert.equal(s.mealVouchers['2026-11'],40000);assert.equal(s.categoryBudgets['2026-12']['cat-0'],9000);assert.deepEqual(s.transactions,rows);assert.equal(s.budgets['2026-11'],500000);
 resetCategoryBudget(s,'2026-11','cat-4');assert.equal(s.categoryBudgets['2026-11']['cat-4'],undefined);
});
test('Voucher credit is food-only and does not reduce cash allocation balance',async()=>{
 const {setMealVouchers,mealSummary,categoryBudgetSummary,allocationSummary}=await import('../dist/finance.js');const s=initialState({legacyCategories:true});
 s.categoryBudgets={'2026-11':{'cat-0':10000}};setMealVouchers(s,'2026-11',50000);
 assert.deepEqual(mealSummary(s,'2026-11'),{received:50000,allocated:50000,spent:0,remaining:50000,unallocated:0});
 const cats=categoryBudgetSummary(s.transactions,s.categories,s.categoryBudgets,'2026-11',50000);assert.equal(cats.find(c=>c.id==='cat-0').allocated,60000);assert.equal(cats.find(c=>c.id==='cat-3').allocated,60000);assert.equal(cats.find(c=>c.id==='cat-4').mealAllocation,0);
 assert.equal(allocationSummary(s.categories,s.categoryBudgets,'2026-11',100000).unallocated,90000);
 setMealVouchers(s,'2026-11',60000);assert.equal(s.mealAllocations['2026-11'],60000);assert.equal(s.transactions.length,0);
});
test('Voucher payments update their own balance and preserve salary balance',async()=>{
 const {validateMealPayment,mealSummary,setMealVouchers}=await import('../dist/finance.js');const s=initialState({legacyCategories:true});setMealVouchers(s,'2026-11',50000);
 const expense={id:'meal1',name:'Prânz',date:'2026-11-12',type:'expense',amount:15000,category:'cat-0',paymentSource:'meal'};validateMealPayment(s,expense);s.transactions=[rows[0],expense];
 const summary=summarize(s.transactions,900000);assert.equal(summary.expenses,15000);assert.equal(summary.balance,900000);assert.equal(summary.remaining,900000);assert.equal(mealSummary(s,'2026-11').remaining,35000);
 assert.throws(()=>validateMealPayment(s,{...expense,id:'new',category:'cat-4'}));assert.throws(()=>validateMealPayment(s,{...expense,id:'new',amount:40000}));assert.throws(()=>validateMealPayment(s,{...expense,type:'income'}));
 validateMealPayment(s,{...expense,amount:40000});assert.throws(()=>setMealVouchers(s,'2026-11',10000));
 const out=csv([expense],s.categories);assert.ok(out.includes('Bonuri de masă'));
});
test('Voucher state persists and resets do not silently allocate old credits again',async()=>{
 const {setMealVouchers,resetCategoryBudget}=await import('../dist/finance.js');const s=initialState({legacyCategories:true});setMealVouchers(s,'2026-11',50000);resetCategoryBudget(s,'2026-11','cat-0');setMealVouchers(s,'2026-11',50000);assert.equal(s.mealAllocations['2026-11'],0);
 setMealVouchers(s,'2026-11',60000);assert.equal(s.mealAllocations['2026-11'],10000);
 let raw;globalThis.localStorage={getItem:()=>raw,setItem:(k,v)=>raw=v};saveState(s);assert.deepEqual(loadState().mealVouchers,s.mealVouchers);assert.deepEqual(loadState().mealAllocations,s.mealAllocations);
});

test('Total monthly income includes received vouchers once, independently of spending',async()=>{
 const {monthlyIncome,setMealVouchers}=await import('../dist/finance.js');const s=initialState({legacyCategories:true});s.transactions=structuredClone(rows);
 setMealVouchers(s,'2026-11',60000);assert.deepEqual(monthlyIncome(s,'2026-11'),{cash:900000,vouchers:60000,total:960000});
 setMealVouchers(s,'2026-11',70000);assert.equal(monthlyIncome(s,'2026-11').total,970000);
 s.transactions.push({id:'meal',date:'2026-11-12',type:'expense',category:'cat-0',amount:20000,paymentSource:'meal'});
 assert.equal(monthlyIncome(s,'2026-11').total,970000);assert.equal(summarize(inMonth(s.transactions,'2026-11')).balance,888700);
 assert.equal(monthlyIncome(s,'2026-12').total,0);assert.equal(s.transactions.filter(t=>t.type==='income').length,1);
});

test('New browser starts without categories and saves only its own list',()=>{
 const stores=[new Map(),new Map()];
 const select=index=>{globalThis.localStorage={getItem:key=>stores[index].get(key)??null,setItem:(key,value)=>stores[index].set(key,value)};};
 select(0);
 const state=loadState();
 assert.deepEqual(state.categories,[]);
 state.categories.push({id:'local-category',name:'Categorie proprie',custom:true});
 saveState(state);
 assert.deepEqual(loadState().categories,state.categories);
 select(1);
 assert.deepEqual(loadState().categories,[]);
});

test('Dashboard shows root balances with grouped spending, vouchers and clamped available bars',async()=>{
 const {mainCategoryBalances}=await import('../dist/finance.js');
 const categories=[{id:'shopping',name:'Cumpărături',isGroup:true},{id:'cat-0',name:'Alimentație',parentId:'shopping'},{id:'other',name:'Diverse'}];
 const budgets={'2026-11':{shopping:10000,'cat-0':20000,other:5000}};
 const rows=[{type:'expense',category:'shopping',amount:1000,date:'2026-11-01'},{type:'expense',category:'cat-0',amount:6000,date:'2026-11-02'},{type:'expense',category:'other',amount:7000,date:'2026-11-03'},{type:'expense',category:'cat-0',amount:99999,date:'2026-10-03'}];
 const result=mainCategoryBalances(rows,categories,budgets,'2026-11',10000);assert.equal(result.length,2);assert.equal(result[0].allocated,40000);assert.equal(result[0].spent,7000);assert.equal(result[0].available,33000);assert.equal(result[0].percentAvailable,82.5);assert.equal(result[0].percentSpent,17.5);assert.equal(result[1].available,-2000);assert.equal(result[1].percentAvailable,0);assert.equal(result[1].percentSpent,100);
 assert.equal(mainCategoryBalances([],categories,{},'2026-11')[0].percentAvailable,0);
});

test('Focus indicators use exact order/colors with three distinct progress meanings',async()=>{
 const {dashboardFocusIndicators}=await import('../dist/finance.js');
 const state={categories:[{id:'car',name:'Masina',isGroup:true},{id:'fuel',name:'Motorina',parentId:'car'},{id:'s',name:'Economii'},{id:'d',name:'Datorii'},{id:'x',name:'Cumpărături'}],transactions:[{type:'expense',category:'fuel',amount:25000,date:'2026-11-01'},{type:'expense',category:'d',amount:10000,date:'2026-11-02'},{type:'expense',category:'d',amount:99999,date:'2026-10-02'}],categoryBudgets:{'2026-11':{fuel:100000,s:20000,d:45000,x:80000}},indicatorTargets:{'2026-11':{savings:100000,debt:60000}}};
 const before=structuredClone(state),rows=dashboardFocusIndicators(state,'2026-11');assert.deepEqual(rows.map(r=>r.name),['Economii','Mașină','Datorii']);assert.deepEqual(rows.map(r=>r.color),['#34d399','#a78bfa','#f59e0b']);assert.equal(rows[0].percent,20);assert.equal(rows[0].amount,20000);assert.equal(rows[1].amount,75000);assert.equal(rows[1].percent,75);assert.equal(rows[2].amount,50000);assert.deepEqual(state,before);
 state.categoryBudgets['2026-11'].s=50000;assert.equal(dashboardFocusIndicators(state,'2026-11')[0].percent,50);delete state.indicatorTargets['2026-11'].debt;assert.equal(dashboardFocusIndicators(state,'2026-11')[2].amount,35000);
});
test('Focus indicators handle unconfigured targets and complete repayment without NaN',async()=>{
 const {dashboardFocusIndicators}=await import('../dist/finance.js');const state={categories:[],transactions:[],categoryBudgets:{}};assert.deepEqual(dashboardFocusIndicators(state,'2026-11').map(r=>r.percent),[0,0,0]);state.categories=[{id:'cat-4',name:'Datorii'}];state.indicatorTargets={'2026-11':{debt:10000}};state.transactions=[{category:'cat-4',type:'expense',amount:15000,date:'2026-11-03'}];assert.equal(dashboardFocusIndicators(state,'2026-11')[2].amount,0);assert.equal(dashboardFocusIndicators(state,'2026-11')[2].percent,0);
});

test('Voucher balance correction preserves recorded spending, salary and other months',async()=>{
 const {setMealBalance,mealSummary}=await import('../dist/finance.js');const s={categories:[{id:'cat-0',name:'Alimentație'}],transactions:[{id:'meal',category:'cat-0',type:'expense',paymentSource:'meal',amount:10000,date:'2026-11-01'}],mealVouchers:{'2026-11':80000,'2026-10':60000},mealAllocations:{'2026-11':80000},budgets:{'2026-11':500000}};
 const transactions=structuredClone(s.transactions);setMealBalance(s,'2026-11',50000);assert.equal(mealSummary(s,'2026-11').remaining,50000);assert.equal(s.mealVouchers['2026-11'],60000);assert.deepEqual(s.transactions,transactions);assert.equal(s.budgets['2026-11'],500000);assert.equal(s.mealVouchers['2026-10'],60000);setMealBalance(s,'2026-11',0);assert.equal(s.mealVouchers['2026-11'],10000);assert.equal(mealSummary(s,'2026-11').remaining,0);assert.throws(()=>setMealBalance(s,'2026-11',-1));
});

test('Seven car slots have fixed order/colors and independent remaining-budget fills',async()=>{
 const {carBudgetSegments}=await import('../dist/finance.js');const s={categories:[{id:'car',name:'Mașină',isGroup:true},{id:'a',name:'Asigurare',parentId:'car'},{id:'i',name:'ITP',parentId:'car'},{id:'f',name:'Motorina',parentId:'car'}],categoryBudgets:{'2026-11':{a:10000,i:20000,f:30000}},transactions:[{category:'i',type:'expense',amount:5000,date:'2026-11-01'},{category:'f',type:'expense',amount:6000,date:'2026-11-02'},{category:'f',type:'expense',amount:99999,date:'2026-10-01'}]};const before=structuredClone(s),rows=carBudgetSegments(s,'2026-11').segments;assert.deepEqual(rows.map(r=>r.name),['Asigurare','ITP','Motorină','Revizie','Consumabile','Reparații','Parcări']);assert.deepEqual(rows.map(r=>r.color),['#33658a','#86bbd8','#758e4f','#f6ae2d','#f26419','#f26419','#F2C12E']);assert.equal(rows[0].percent,100);assert.equal(rows[1].percent,75);assert.equal(rows[2].percent,80);assert.equal(rows[3].percent,0);assert.deepEqual(s,before);s.transactions[0].amount=20000;assert.equal(carBudgetSegments(s,'2026-11').segments[1].percent,0);s.transactions[0].amount=25000;assert.equal(carBudgetSegments(s,'2026-11').segments[1].available,-5000);
});
test('Missing car subcategory is created on demand without duplicating existing data',async()=>{
 const {ensureCarSegment,carBudgetSegments}=await import('../dist/finance.js');const s={categories:[{id:'car',name:'Masina',custom:true},{id:'fuel',name:'Motorina',parentId:'car',custom:true}],transactions:[],categoryBudgets:{'2026-11':{fuel:20000}}};assert.equal(ensureCarSegment(s,'fuel'),'fuel');const id=ensureCarSegment(s,'service');assert.equal(ensureCarSegment(s,'service'),id);assert.equal(s.categories.length,3);assert.equal(s.categories.find(c=>c.id===id).name,'Revizie');assert.equal(s.categoryBudgets['2026-11'][id],undefined);assert.equal(carBudgetSegments(s,'2026-11').segments[3].percent,0);assert.equal(s.categoryBudgets['2026-11'].fuel,20000);
});
test('Direct car budget and unmapped subcategories stay separate from the seven slots',async()=>{
 const {carBudgetSegments}=await import('../dist/finance.js');const s={categories:[{id:'car',name:'Mașină',isGroup:true},{id:'extra',name:'Taxe',parentId:'car'}],categoryBudgets:{'2026-11':{car:10000,extra:20000}},transactions:[{category:'extra',type:'expense',amount:5000,date:'2026-11-01'}]};const result=carBudgetSegments(s,'2026-11');assert.equal(result.otherAllocated,30000);assert.equal(result.otherSpent,5000);assert.ok(result.segments.every(s=>s.allocated===0));
});
