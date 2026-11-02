import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source=readFileSync(process.env.AP_PRECISION_SOURCE || new URL('../aeries-playground.user.js',import.meta.url),'utf8');
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a,b);}
const context=vm.createContext({URL,CourseSchedule:{detect:()=>null}});
vm.runInContext(section('const GradeMath = (() => {','  // Period-to-course matching stays local;')+'\nglobalThis.api={GradeMath,GradeDOM};',context);
const {GradeMath:math,GradeDOM:dom}=context.api;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const node=text=>({nodeType:1,textContent:text,closest:()=>null,cloneNode(){return node(text);},querySelectorAll:()=>[],querySelector:()=>null});
function row(id='a',earned=14.67,score='14.67 / 15',percent='97.78%'){
  const cell=node(score),sourceRow={querySelector:s=>s==='[id$="_tdPerc"]'?node(percent):null};
  return {id,name:'Synthetic '+id,category:'Work',earned,possible:15,included:true,status:'graded',sourceCell:cell,sourceCells:[cell],sourceRow};
}
function rules(earned=44,possible=45,official=97.78,extra={}){
  return {mode:'points',weights:{},categories:[{name:'Work',earned,possible,earnedDecimals:2}],official,officialUnit:'percent',officialDecimals:2,...extra};
}
const roundRows=()=>Array.from({length:4},(_,i)=>row(String(i)));

test('card precision requires matching score, denominator, percent and unique assignment identity',()=>{
  const a=row();a.sourceCells.push(node('14.66666666666667 / 15'));
  assert.equal(dom.restoreRowPrecision([a],rules(14.66666666666667,15)),1);
  near(a.earned,44/3);assert.equal(a.precisionSource,'card');
  for(const [score,percent] of [['14.66666666666667 / 16','97.78%'],['14.66666666666667 / 15','90%'],['10 / 15','97.78%']]){
    const b=row('b',14.67,'14.67 / 15',percent);b.sourceCells.push(node(score));
    assert.equal(dom.restoreRowPrecision([b],rules(14.66666666666667,15)),0);assert.equal(b.earned,14.67);
  }
  const b=row();b.sourceCells.push(node('14.66666666666667 / 15'));
  assert.equal(dom.restoreRowPrecision([b,{...b}],rules()),0);
});

test('ambiguous card values, four-point courses and validated embedded scores skip the row fallback',()=>{
  const a=row();a.sourceCells.push(node('14.66666666666667 / 15'),node('14.667 / 15'));
  assert.equal(dom.restoreRowPrecision([a],rules(44/3,15)),0);
  const b=row();b.sourceCells.push(node('14.66666666666667 / 15'));
  assert.equal(dom.restoreRowPrecision([b],rules(44/3,15,97.78,{averageMaximum:4})),0);
  b.precisionSource='embedded';assert.equal(dom.restoreRowPrecision([b],rules(44/3,15)),0);
});

test('raw count precision is validated against the native display and never destroys a matched baseline',()=>{
  const a=row();a.rawEarned=44;a.rawPossible=45;
  assert.equal(dom.restoreRowPrecision([a],rules(44/3,15)),1);near(a.earned,44/3);
  const b=row('b',14.67,'14.67 / 15','97.8%');b.rawEarned=44;b.rawPossible=45;
  // Four rounded assignments match the posted baseline; replacing their raw
  // ratios would contradict its category total, so all replacements roll back.
  const rows=Array.from({length:4},(_,i)=>({...b,id:String(i)}));
  assert.equal(dom.restoreRowPrecision(rows,rules(58.68,60,97.8,{officialDecimals:1})),0);
  assert.ok(rows.every(a=>a.earned===14.67&&!a.precisionSource));
});

test('display bounds intersect points and percentage evidence without guessing a hidden score',()=>{
  const a=row();dom.attachDisplayBounds([a],rules());
  near(a.pointBounds[0],14.66625);near(a.pointBounds[1],14.66775);assert.equal(a.earned,14.67);
  const b=row('b',14.67,'14.67 / 15','20%');dom.attachDisplayBounds([b],rules());assert.equal(b.pointBounds,undefined);
  const c=row();c.precisionSource='card';dom.attachDisplayBounds([c],rules());assert.equal(c.pointBounds,undefined);
  const d=row();d.included=false;dom.attachDisplayBounds([d],rules());assert.equal(d.pointBounds,undefined);
});

test('bounded reconciliation checks all category totals, denominators, partial pages and overall display',()=>{
  const rows=roundRows(),r=rules(58.67,60);dom.attachDisplayBounds(rows,r);
  const check=math.fromAeries(rows,r);assert.equal(check.error,null);assert.equal(check.rounding.count,4);
  for(const bad of [rules(58.67,61),rules(55,60),rules(58.67,60,80),rules(58.67,60,97.78,{officialDecimals:NaN}),
    rules(58.67,60,97.78,{categories:[{name:'Work',earned:58.67,possible:60,earnedDecimals:NaN}]}),
    rules(58.67,60,97.78,{categories:[{name:'Other',earned:58.67,possible:60}]})])assert.ok(math.fromAeries(rows,bad).error);
  assert.ok(math.fromAeries(rows,r,{partial:true}).error);
  assert.ok(math.fromAeries(rows.map(a=>({...a,pointBounds:[1,NaN]})),r).error);
  assert.ok(math.fromAeries(rows.map(a=>({...a,pointBounds:[15,14]})),r).error);
});

test('rounding fallback respects public final-grade rounding and coarse displayed precision',()=>{
  const rows=roundRows();const r=rules(58.67,60,98,{rounding:'nearest',roundingDecimals:0,officialDecimals:0});dom.attachDisplayBounds(rows,r);
  assert.equal(math.fromAeries(rows,r).error,null);
  const down={...r,official:97,rounding:'down'};assert.equal(math.fromAeries(rows,down).error,null);
  const bad={...r,official:96};assert.ok(math.fromAeries(rows,bad).error);
  const invalid={...r,roundingDecimals:-1};assert.ok(math.fromAeries(rows,invalid).error);
});

test('conservative targets satisfy the target at all permitted lower endpoints and preserve edited scores',()=>{
  const rows=roundRows(),r=rules(58.67,60);dom.attachDisplayBounds(rows,r);
  const edited={...rows[0],earned:10,pointBounds:undefined};const scenario=[edited,...rows.slice(1),{id:'target',name:'Target',category:'Work',earned:null,possible:20,included:true}];
  const lower=math.roundingEndpoint(scenario);assert.equal(lower[0].earned,10);
  const options={assignmentId:'target',target:90,maximumEarned:20,step:.01};
  const solved=math.solveTarget(lower,{mode:'points',weights:{}},options);assert.equal(solved.status,'solved');
  for(let mask=0;mask<8;mask++){
    const actual=scenario.map((a,i)=>a.id==='target'?{...a,earned:solved.earned}:a.pointBounds?{...a,earned:a.pointBounds[(mask>>(i-1))&1]}:a);
    assert.ok(math.calculate(actual,{mode:'points',weights:{}}).value>=90-1e-9);
  }
  const below=lower.map(a=>a.id==='target'?{...a,earned:solved.earned-.01}:a);
  assert.ok(math.calculate(below,{mode:'points',weights:{}}).value<90);
});

test('category display totals constrain the overall uncertainty envelope',()=>{
  const rows=['A','B'].map(id=>({id,name:id,category:id,earned:10,possible:10,included:true,pointBounds:[9,11]}));
  const categories=rows.map(a=>({name:a.category,earned:10,possible:10,earnedDecimals:2}));
  for(const mode of ['points','weighted']){
    const r={mode,weights:{A:50,B:50},categories,official:95,officialUnit:'percent',officialDecimals:2};
    assert.ok(math.fromAeries(rows,r).error,'95% contradicts displayed category totals near 100%');
  }
});
