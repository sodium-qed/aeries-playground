import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source=readFileSync(process.env.AP_WEIGHTS_SOURCE||new URL('../aeries-playground.user.js',import.meta.url),'utf8');
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
const plain=x=>JSON.parse(JSON.stringify(x));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} versus ${b}`);
const a=(id,earned=3,multiplier=1,extra={})=>({id,name:`Synthetic ${id}`,category:'Work',earned,possible:4,included:true,status:'graded',multiplier,dueDate:'2026-10-01',...extra});
const rules={mode:'points',weights:{},averageMaximum:4};
class Node{
  constructor(tag,text=''){this.tagName=tag;this.textContent=text;this.children=[];this.attributes={};this.listeners={};this.style={};this.dataset={};this.value='';this.scrollTop=0;}
  append(...nodes){this.children.push(...nodes);}
  setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')this.id=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  addEventListener(k,fn){this.listeners[k]=fn;}
  fire(k){this.listeners[k]?.({target:this});}
}
function fixture(){
  const course={},courses={synthetic:course};let saved=null,writes=0,fail=false,resets=0;
  const c=vm.createContext({URL,console,document:{getElementById:()=>null},
    course,profile:()=>({courses}),planningCourse:()=>course,storageError:'Synthetic storage failure',
    el:(tag,text)=>new Node(tag,text??''),note:text=>new Node('p',text),
    input:(value,type='text')=>Object.assign(new Node('input'),{value:String(value),type}),
    button:(text,fn)=>{const n=new Node('button',text);n.addEventListener('click',fn);return n;},
    persist:()=>{if(fail)return false;saved=plain(course);writes++;return true;},
    closeGradeLab:()=>{resets++;},scan:()=>{},
    gradeLab:{parsed:{assignments:[],rules},active:true,edits:new Map(),ranges:new Map(),added:[]},
  });
  vm.runInContext(section('const GradeMath = (() => {','  // Period-to-course matching stays local;')+
    section('  function buildWeightEntries(','  let weightMapState=')+
    section('  function savedAssignmentWeightMatches(','  function refreshNativeDetails(){')+
    section('  function labAssignmentDraft(','  function buildLabRangeControls(')+
    section('  function labDraft(','  function sizeLabNumberInput(')+
    section('  function labModel(){','  function labGrade(')+
    '\nglobalThis.api={GradeMath,buildWeightEntries,applySavedAssignmentWeights,buildSavedAssignmentWeightsUI,labDraft,labModel,updateLabScoreDraft};',c);
  return {c,api:c.api,course,get saved(){return saved;},get writes(){return writes;},get resets(){return resets;},fail(value){fail=value;}};
}
const find=(root,predicate)=>predicate(root)?root:root.children.map(n=>find(n,predicate)).find(Boolean);

test('assignment multipliers preserve scores while weighting earned and possible points',()=>{
  const {api}=fixture();
  const rows=[a('one',3,2),a('two',4,.5)];const result=api.GradeMath.calculate(rows,rules);
  assert.equal(result.error,null);near(result.value,80);near(result.totalEarned,8);near(result.totalPossible,10);
  assert.equal(result.effectiveAssignments[0].earned,3);assert.equal(result.effectiveAssignments[0].possible,4);
  assert.equal(result.effectiveAssignments[0].countedEarned,6);assert.equal(result.effectiveAssignments[0].countedPossible,8);
  assert.deepEqual(rows,[a('one',3,2),a('two',4,.5)]);
  const weighted=api.GradeMath.calculate([...rows,a('test',2,3,{category:'Tests'})],{...rules,mode:'weighted',weights:{Work:1,Tests:3}});
  near(weighted.value,57.5);
});

test('invalid counted multipliers fail; count-off drafts remain harmless and overflow fails explicitly',()=>{
  const {api}=fixture();
  for(const multiplier of [0,-1,'',null,'oops',Infinity,NaN]){
    assert.ok(api.GradeMath.calculate([a('invalid',3,multiplier)],rules).error,String(multiplier));
    const result=api.GradeMath.calculate([a('counted'),a('ignored',3,multiplier,{included:false})],rules);
    assert.equal(result.error,null);near(result.value,75);
  }
  assert.ok(api.GradeMath.calculate([a('overflow',3,1e308)],rules).error);
  assert.ok(api.GradeMath.calculate([a('underflow',3,Number.MIN_VALUE,{possible:Number.MIN_VALUE})],rules).error);
});

test('replacement source weight never transfers and caps precede target contribution weights',()=>{
  const {api}=fixture();
  const rows=[a('source',4,.5),a('target',1,3)];
  const result=api.GradeMath.calculate(rows,{...rules,scoreCeiling:75,replacements:[{sourceId:'source',targetId:'target',onlyIfHigher:true,capPercent:50}]});
  assert.equal(result.error,null);near(result.totalEarned,7.5);near(result.totalPossible,14);
  const target=result.effectiveAssignments.find(x=>x.id==='target');
  assert.equal(target.multiplier,3);assert.equal(target.earned,2);assert.equal(target.countedEarned,6);
});

test('weighted target search and simultaneous ranges match exhaustive score grids',()=>{
  const {api}=fixture(),math=api.GradeMath;
  const rows=[a('variable',0,2),a('fixed',3,.5),a('target',1,3)];
  const settings={...rules,replacements:[{sourceId:'variable',targetId:'target',onlyIfHigher:true}]};
  for(const target of [20,50,75,90,100]){
    const found=math.solveTarget(rows,settings,{assignmentId:'variable',target,maximumEarned:4,step:.5});
    const expected=Array.from({length:9},(_,i)=>i/2).find(earned=>math.calculate(rows.map(x=>x.id==='variable'?{...x,earned}:x),settings).value>=target-1e-9);
    if(expected===undefined)assert.equal(found.status,'unreachable');else{assert.equal(found.status,'solved');near(found.earned,expected);}
  }
  const range=math.calculateRanges(rows,settings,[{assignmentId:'variable',lowEarned:1,highEarned:3},{assignmentId:'fixed',lowEarned:2,highEarned:4}]);
  assert.equal(range.error,null);
  const totals=[];for(const x of [1,2,3])for(const y of [2,3,4])totals.push(math.calculate(rows.map(r=>r.id==='variable'?{...r,earned:x}:r.id==='fixed'?{...r,earned:y}:r),settings).value);
  near(range.lowResult.value,Math.min(...totals));near(range.highResult.value,Math.max(...totals));
});

test('posted reconstruction and impact math retain multipliers with displayed rounding policy',()=>{
  const {api}=fixture(),rows=[a('one',3,2),a('two',4,.5)];
  const checked=api.GradeMath.fromAeries(rows,{...rules,rounding:'nearest',roundingDecimals:1,
    categories:[{name:'Work',unit:'average',grade:3.2,decimals:1}],official:3.2,officialUnit:'average',officialDecimals:1});
  assert.equal(checked.error,null);assert.equal(checked.model.assignments[0].multiplier,2);near(checked.result.value,80);
  const impacts=api.GradeMath.impacts(rows,rules);
  assert.ok(Array.isArray(impacts));
  const first=impacts.find(x=>x.id==='one');assert.ok(first);near(first.delta,-20);
});

test('weight-map shares use weighted possible points and ungraded preview never creates a zero score',()=>{
  const {api}=fixture(),rows=[a('one',3,2),a('two',4,.5),a('blank',null,1,{status:'ungraded',included:false})];
  const current=api.buildWeightEntries(rows,rules,false);
  assert.equal(current.error,null);near(current.entries.find(x=>x.id==='one').share,.8);
  const preview=api.buildWeightEntries(rows,rules,true);
  assert.equal(preview.error,null);near(preview.entries.find(x=>x.id==='one').share,8/14);
  const blank=preview.entries.find(x=>x.id==='blank');assert.equal(blank.earned,null);assert.equal(blank.ungraded,true);
});

test('saved assignment weights require one exact course-local reference; duplicates stay inactive',()=>{
  const {api,course}=fixture(),rows=[a('one'),a('two')];
  const ref=(row,multiplier)=>({id:row.id,name:row.name,category:row.category,dueDate:row.dueDate,multiplier});
  course.assignmentWeights=[ref(rows[0],2),ref(rows[1],3),{...ref(rows[1],4),dueDate:'2026-10-02'}];
  const parsed={assignments:rows,rules};api.applySavedAssignmentWeights(parsed,'synthetic');
  assert.deepEqual(rows.map(x=>x.multiplier),[2,3]);assert.deepEqual(plain(parsed.assignmentWeightStatus),{matched:2,pending:1,invalid:0});
  course.assignmentWeights.push(ref(rows[0],2));api.applySavedAssignmentWeights(parsed,'synthetic');
  assert.equal(rows[0].multiplier,1);assert.equal(parsed.assignmentWeightStatus.invalid,2);
  course.assignmentWeights=[ref(rows[0],0),null];api.applySavedAssignmentWeights(parsed,'synthetic');assert.equal(parsed.assignmentWeightStatus.invalid,2);
  course.assignmentWeights='corrupt';api.applySavedAssignmentWeights(parsed,'synthetic');assert.equal(parsed.assignmentWeightStatus.invalid,1);
  const percentage={assignments:[a('percent',3,1)],rules:{mode:'points'}};api.applySavedAssignmentWeights(percentage,'synthetic');assert.equal(percentage.assignments[0].multiplier,1);
});

test('saved-weight editor rolls back failed writes and saves only references and multipliers',()=>{
  const f=fixture(),rows=[a('one')];f.c.gradeLab.parsed={assignments:rows,rules};
  const toolbar=new Node('section');f.api.buildSavedAssignmentWeightsUI(toolbar);
  const control=find(toolbar,n=>n.attributes['data-weight-assignment']==='one');assert.ok(control);
  f.fail(true);control.value='2';control.fire('change');assert.equal(f.course.assignmentWeights,undefined);assert.equal(f.resets,0);
  f.fail(false);control.fire('change');assert.equal(f.writes,1);assert.equal(f.resets,1);
  assert.deepEqual(f.saved.assignmentWeights,[{id:'one',name:'Synthetic one',category:'Work',dueDate:'2026-10-01',multiplier:2}]);
  assert.ok(!('earned' in f.saved.assignmentWeights[0]));assert.ok(!('possible' in f.saved.assignmentWeights[0]));
});

test('temporary multiplier drafts preserve original scores and validate again after Count is restored',()=>{
  const f=fixture(),row=a('one',3,2);f.c.gradeLab.parsed={assignments:[row],rules};
  const draft=f.api.labDraft(row);assert.equal(draft.multiplier,'2');
  const changed=f.api.updateLabScoreDraft(draft,'multiplier','3');assert.equal(changed.earned,'3');assert.equal(changed.possible,'4');
  f.c.gradeLab.edits.set(row.id,changed);let model=f.api.labModel();assert.equal(model.error,'');assert.equal(model.assignments[0].multiplier,3);
  f.c.gradeLab.edits.set(row.id,{...changed,multiplier:'invalid',included:false});model=f.api.labModel();assert.equal(model.error,'');assert.equal(f.api.GradeMath.calculate(model.assignments,rules).error,null);
  f.c.gradeLab.edits.set(row.id,{...changed,multiplier:'invalid',included:true});assert.match(f.api.labModel().error,/positive assignment weight/);
  f.c.gradeLab.edits.clear();assert.equal(f.api.labModel().assignments[0].multiplier,2);
});

test('Reset saved weights replaces malformed falsy storage instead of mistaking it for an empty list',()=>{
  for(const malformed of [null,false,0,'']){
    const f=fixture();f.course.assignmentWeights=malformed;f.c.gradeLab.parsed={assignments:[a('one')],rules};
    const toolbar=new Node('section');f.api.buildSavedAssignmentWeightsUI(toolbar);
    const reset=find(toolbar,n=>n.tagName==='button'&&n.textContent==='Reset saved weights to 1×');assert.ok(reset);
    reset.fire('click');assert.equal(f.writes,1);assert.deepEqual(f.saved.assignmentWeights,[]);assert.equal(f.resets,1);
  }
});

test('actual scenario conversion drops posted bounds only for edited or ranged assignments',()=>{
  const f=fixture(),first=a('one',3,1,{pointBounds:[2.99,3.01]}),second=a('two',2,1,{pointBounds:[1.99,2.01]});
  f.c.gradeLab.parsed={assignments:[first,second],rules:{mode:'points',weights:{}}};
  f.c.gradeLab.edits.set(first.id,{...f.api.labDraft(first),earned:'2.5'});
  const model=f.api.labModel();assert.equal(model.error,'');assert.equal(model.assignments[0].pointBounds,undefined);
  assert.deepEqual(plain(model.assignments[1].pointBounds),[1.99,2.01]);
  const lower=f.api.GradeMath.roundingEndpoint(model.assignments);assert.equal(lower[0].earned,2.5);assert.equal(lower[1].earned,1.99);
  f.c.gradeLab.edits.clear();assert.deepEqual(plain(f.api.labModel().assignments[0].pointBounds),[2.99,3.01]);
  f.c.gradeLab.ranges.set(first.id,{mode:'points',low:'1',high:'4',rawPossible:''});
  const ranged=f.api.labModel();assert.equal(ranged.error,'');assert.equal(ranged.assignments[0].earned,1);
  assert.equal(ranged.assignments[0].pointBounds,undefined);assert.deepEqual(plain(ranged.assignments[1].pointBounds),[1.99,2.01]);
});
