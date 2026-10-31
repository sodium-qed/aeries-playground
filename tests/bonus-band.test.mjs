import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// Use production display/math functions with synthetic grades and minimal DOM
// nodes. These tests do not assert live Aeries or userscript-manager behavior.
const source = readFileSync(new URL('../aeries-playground.user.js', import.meta.url), 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first + start.length);
  assert.ok(first >= 0 && last > first, `Source section: ${start}`);
  return source.slice(first, last);
}
const settings = () => ({enabled:true, numericGrades:true, dashboardColors:true,
  colors:['#1f1f7f','#1f7f1f','#c05600','#7f1f1f'], cutoffs:[95,85,75], averageCutoffs:[3.7,3.1,2.5],
  bonusColor:'#7c3aed', bonusPercentCutoff:100, bonusAverageCutoff:4, weightMap:true, weightMapUngraded:true});
class Style {
  values = new Map();
  getPropertyValue(key) { return this.values.get(key)?.[0] || ''; }
  getPropertyPriority(key) { return this.values.get(key)?.[1] || ''; }
  setProperty(key, value, priority = '') { this.values.set(key, [String(value), priority]); }
  removeProperty(key) { this.values.delete(key); }
}
function node() {
  return {style:new Style(), isConnected:true, closest:()=>null, querySelectorAll:()=>[], contains:()=>false};
}
function fixture(overrides = {}) {
  const config = {...settings(), ...overrides}, cards = [], courses = {};
  const context = vm.createContext({db:{settings:config}, cards,
    document:{createTreeWalker(element) { let index=0; return {nextNode:()=>element.textNodes[index++] || null}; }},
    NodeFilter:{SHOW_TEXT:4}, courseFor:card=>courses[card.key], profile:()=>({courses}), detectedCourseKey:'course',
    GradeDOM:{cleanText:value=>String(value?.textContent ?? value ?? '').trim(), listTables:()=>[], assignmentGrade:a=>({value:a.value,unit:a.unit})},
    profileKey:()=> 'fixture', clearWeightMapHighlight(){}, dialog:{open:false}, activeTab:'',
    GradeMath:{fromAeries:assignments=>({model:{rules:{}},error:null})},
    buildWeightEntries:assignments=>({entries:assignments.map(a=>({id:a.id,ungraded:a.ungraded})),error:null}),
    weightMapState:null, weightMapSelection:'', weightMapJump:null, weightMapButton:null,
  });
  vm.runInContext([
    section('  function validCutoffs(', '  let saveTimer'),
    section('  function bonusCutoff(', '  const dashboardPainted='),
    section('  const dashboardPainted=', '  // Threshold-based ratings'),
    section('  const OverallMath = (() => {', '  // Keep summaries in normal document flow,'),
    section('  function detailsColor(', '  function applyDetailsColors('),
    section('  function refreshWeightMap(', '  function renderWeightMap('),
    'globalThis.api={bonusCutoff,bonusBandColor,colorFor,dashboardGradeNumber,dashboardOriginalMark,refreshDashboardGrades,OverallMath,detailsColor,refreshWeightMap};',
  ].join('\n'), context);
  return {...context.api, config, cards, courses, context};
}

test('bonus band uses strict 100% and 4-average boundaries without changing ordinary bands', () => {
  const f = fixture();
  for (const [scale, boundary] of [['percent',100],['average',4]]) {
    const course = {scale,customCutoffs:null};
    assert.equal(f.dashboardGradeNumber(boundary, course), 4);
    assert.equal(f.colorFor(boundary, course), '#1f1f7f');
    assert.equal(f.dashboardGradeNumber(boundary + 0.000001, course), 5);
    assert.equal(f.colorFor(boundary + 0.000001, course), '#7c3aed');
    for (const value of [null, undefined, NaN, Infinity]) assert.equal(f.dashboardGradeNumber(value, course), null);
  }
  for (const [value, expected] of [[95,4],[94.999,3],[85,3],[75,2],[74.999,1]])
    assert.equal(f.dashboardGradeNumber(value, {scale:'percent'}), expected);
});

test('custom bonus thresholds and color apply above the boundary while course cutoffs still select 1–4', () => {
  const f = fixture({bonusColor:'#9234ab',bonusPercentCutoff:105,bonusAverageCutoff:4.5});
  const percent = {scale:'percent',customCutoffs:[97,87,77]}, average={scale:'average',customCutoffs:[3.9,3.3,2.7]};
  assert.equal(f.dashboardGradeNumber(100.5,percent),4);
  assert.equal(f.dashboardGradeNumber(105,percent),4);
  assert.equal(f.dashboardGradeNumber(105.001,percent),5);
  assert.equal(f.colorFor(105.001,percent),'#9234ab');
  assert.equal(f.dashboardGradeNumber(96,percent),3);
  assert.equal(f.dashboardGradeNumber(4.5,average),4);
  assert.equal(f.dashboardGradeNumber(4.5001,average),5);
  assert.equal(f.colorFor(4.5001,average),'#9234ab');
});

test('native detail and map colors use the score unit and keep ungraded work neutral', () => {
  const f = fixture();
  f.courses.course={scale:'percent',customCutoffs:[98,88,78]};
  assert.equal(f.detailsColor(100,'percent'),'#1f1f7f');
  assert.equal(f.detailsColor(100.001,'percent'),'#7c3aed');
  assert.equal(f.detailsColor(4.001,'average'),'#7c3aed');
  assert.equal(f.detailsColor(4,'average'),'#1f1f7f');
  const assignments=[{id:'above',value:100.001,unit:'percent'},{id:'equal',value:100,unit:'percent'},
    {id:'average',value:4.01,unit:'average'},{id:'ungraded',ungraded:true,value:null,unit:'percent'}];
  f.refreshWeightMap('course',{title:'Synthetic class'},{assignments,rules:{}});
  assert.deepEqual(Array.from(f.context.weightMapState.entries,e=>e.color),['#7c3aed','#1f1f7f','#7c3aed','#64748b']);
});

test('bonus class ratings contribute 5 to the actual numeric mean without changing letter GPA', () => {
  const {OverallMath:math} = fixture();
  const courses = [
    {key:'bonus',value:101,cutoffs:[95,85,75],bonusCutoff:100,mark:'A',gpaWeighted:false},
    {key:'boundary',value:100,cutoffs:[95,85,75],bonusCutoff:100,mark:'B',gpaWeighted:true},
    {key:'excluded',value:110,cutoffs:[95,85,75],bonusCutoff:100,mark:'A',included:false},
  ];
  const numeric=math.summarize(courses,[3.7,3.1,2.5],true,4);
  assert.equal(numeric.rows[0].score,5);assert.equal(numeric.rows[1].score,4);
  assert.equal(numeric.count,2);assert.equal(numeric.total,9);assert.equal(numeric.average,4.5);assert.equal(numeric.band,5);
  const ordinary=math.summarize([courses[1]],[3.7,3.1,2.5],true,4);
  assert.equal(ordinary.average,4);assert.equal(ordinary.band,4);
  assert.equal(math.summarize(courses,[3.7,3.1,2.5],true,4.5).band,4);
  const gpa=math.summarize(courses,null,false,0);
  assert.equal(gpa.average,3.5);assert.equal(gpa.weightedAverage,4);assert.equal(gpa.band,null);
});

test('a rendered 5 survives repeated dashboard refreshes and restores the original native mark', () => {
  const f=fixture(), grade=node(), title=node(), value=node();
  grade.style.setProperty('color','#112233');
  const mark={data:' A ',parentElement:grade,isConnected:true}, valueText={data:'101%',parentElement:value,isConnected:true};
  grade.textNodes=[mark,valueText];value.contains=n=>n===valueText;
  const card={key:'course',value:101,gradeElement:grade,valueElement:value,titleElement:title};
  f.courses.course={scale:'percent'};f.cards.push(card);
  f.refreshDashboardGrades();assert.equal(mark.data,' 5 ');assert.equal(grade.style.getPropertyValue('color'),'#7c3aed');
  f.refreshDashboardGrades();assert.equal(mark.data,' 5 ');assert.equal(f.dashboardOriginalMark(card),'A');
  f.config.numericGrades=false;f.refreshDashboardGrades();assert.equal(mark.data,' A ');
  f.config.numericGrades=true;f.refreshDashboardGrades();assert.equal(mark.data,' 5 ');
  // A new native mark supersedes the saved A even while numeric mode is on.
  mark.data=' B ';card.value=85;f.refreshDashboardGrades();assert.equal(mark.data,' 3 ');
  f.config.enabled=false;f.refreshDashboardGrades();assert.equal(mark.data,' B ');
  assert.equal(grade.style.getPropertyValue('color'),'#112233');
});
