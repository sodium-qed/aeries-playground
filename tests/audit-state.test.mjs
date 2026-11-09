import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Execute the actual userscript's modules/functions with synthetic settings and
// small DOM controls. No Aeries account, page capture, or network is involved.
const source = readFileSync(process.env.AERIES_STATE_SOURCE || new URL('../aeries-playground.user.js', import.meta.url), 'utf8');
const section = (start, end) => {
  const left = source.indexOf(start);
  const right = source.indexOf(end, left + start.length);
  assert.ok(left >= 0 && right > left, `Source section found: ${start}`);
  return source.slice(left, right);
};
const plain = value => JSON.parse(JSON.stringify(value));

class Control {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.attributes = new Map();
    this.listeners = new Map(); this.value = ''; this.textContent = ''; this.hidden = false;
    this.dataset = {}; this.style = {}; this.parentElement = null; this.connected = false;
  }
  get isConnected() { return this.connected || Boolean(this.parentElement?.isConnected); }
  append(...nodes) { for (const node of nodes) { node.parentElement = this; this.children.push(node); } }
  setAttribute(key, value) { this.attributes.set(key, String(value)); if (key === 'id') this.id = String(value); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  removeAttribute(key) { this.attributes.delete(key); }
  addEventListener(event, listener) { const list = this.listeners.get(event) || []; list.push(listener); this.listeners.set(event, list); }
  dispatch(event) { for (const listener of this.listeners.get(event) || []) listener({ target: this }); }
  focus() { this.focused = true; }
}
const findControl = (root, predicate) => predicate(root) ? root : root.children.map(child => findControl(child, predicate)).find(Boolean);

function fixture(initial = null, options = {}) {
  let stored = initial === null ? null : plain(initial);
  let failRead = options.failRead || false, failWrite = false, writes = 0;
  const timers = new Map(); let timerId = 0;
  const body = new Control('body'); body.connected = true;
  const context = vm.createContext({
    URL, console, document: { baseURI: 'https://mvla.aeries.net/student/', createElement: tag => new Control(tag), createTextNode: text => Object.assign(new Control('#text'),{textContent:text}), body },
    location: { href: 'https://mvla.aeries.net/student/Grades.aspx' },
    GM_getValue: () => { if (failRead) throw new Error('Synthetic read failure'); return stored === null ? null : plain(stored); },
    GM_setValue: (_key, value) => { if (failWrite) throw new Error('Synthetic write failure'); stored = plain(value); writes += 1; },
    clearTimeout: id => timers.delete(id),
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    abortScheduleRequests() {}, closeGradeLab() {}, restoreTitles() {}, scan() {},
    clearAnnotations() {}, clearImpactLabels() {}, clearWeightMapPage() {}, clearCategorySpotlight() {},
    annotationSources: { clear() {} }, selectedCourse: '', detectedCourseKey: '', nativePageState: null, coursesFormDirty: false,
  });
  const modules = [
    section('const GradeMath = (() => {', '\nconst GradeDOM = (() => {'),
    section('const GradeDOM = (() => {', '  // Period-to-course matching stays local;'),
    section('  const CourseSchedule = (() => {', '  const AP_KEY ='),
    section('  const AP_KEY =', '  let cards ='),
    section('  function el(tag,', '  const dashboardPainted='),
    section('  const OverallMath = (() => {', '  // Keep summaries in normal document flow,'),
    section('  function setToggle(', '  function annotate('),
    section('  function nativeCourseKey(current){', '  function showNativeStatus('),
    'let gradeLab = null;',
    section('  function planningCourse(){', '  function initPlanningUI(){'),
    section('  function buildGradingProfileUI(', '  function labContain('),
    section('  function labAssignmentDraft(', '  function buildLabRangeControls('),
    section('  function labDraft(', '  function sizeLabNumberInput('),
    section('  function labModel(){', '  function labGrade('),
    `const content=document.createElement('div');document.body.append(content);const kbar={toggle(){},destroy(){},attachControls(){}};`,
    section('  function renderSettings(){', '  let scanTimer'),
    `globalThis.api = {
      GradeMath, GradeDOM, CourseSchedule, OverallMath, defaults, courseDefaults, courseFor, profile, profileKey, nativeCourseKey,
      storageStatusNote:typeof storageStatusNote==='function'?storageStatusNote:undefined,
      refreshStorageStatus:typeof refreshStorageStatus==='function'?refreshStorageStatus:undefined,
      persist, queueSave, clearSavedSettings, cutoffs, planningRef, resolvePlanningRef, bindPlanningRename,
      planningRows, planningRules, serializePlanningRules, savePlanningReplacementRules,
      labDraft, labScoreState, updateLabScoreDraft, labPointDraft, labModel, labRangeState, labRangeScenario,
      labHasCountedRanges, buildGradingProfileUI, setToggle, renderSettings, content,
      get db() { return db; }, get error() { return storageError; }, get recovery() { return typeof storageRecovery==='string'?storageRecovery:''; },
      get pending() { return savePending; }, get blocked() { return typeof storageLoadBlocked==='boolean'?storageLoadBlocked:false; },
      get lab() { return gradeLab; }, setLab(value) { gradeLab = value; },
    };`,
  ];
  vm.runInContext(modules.join('\n'), context, { timeout: 1000 });
  return {
    api: context.api, body, timers, get stored() { return stored; }, get writes() { return writes; },
    writeElsewhere(value) { stored = plain(value); }, failRead(value) { failRead = value; }, failWrite(value) { failWrite = value; },
  };
}
const rules = { mode: 'points', scale: 'percent', averageMaximum: null, rounding: 'none', roundingDecimals: null,
  scoreFloor: null, scoreCeiling: null, weights: {}, categories: [], official: null, officialUnit: 'percent' };
const assignment = (overrides = {}) => ({ id: 'posted:1', name: 'Synthetic quiz', category: 'Tests', earned: 8, possible: 10,
  included: true, status: 'graded', ...overrides });
const draft = (overrides = {}) => ({ earned: '8', possible: '10', included: true, scoreMode: 'points', rawEarned: '', rawPossible: '', ...overrides });
function lab(api, assignments = [assignment()], added = []) {
  const state = { key: 'course:synthetic|period:1', current: { title: 'Synthetic course' },
    parsed: { assignments, rules: plain(rules) }, active: true, edits: new Map(), ranges: new Map(), added,
    referenceBindings: new WeakMap(), replacementDraft: [], planning: null };
  api.setLab(state); return state;
}
function config(api, extra = {}) { return { version: 1, settings: plain(api.defaults), profiles: {}, defaultsRevision: 2, blankIconsRevision: 1, ...extra }; }

// GPA derives strictly from posted letters; thresholds only affect numeric mode.
test('GPA honors/AP bonuses apply only to A/B/C, with plus/minus ignored', () => {
  const { api } = fixture();
  for (const [mark, basic, weighted] of [['A',4,5],['B',3,4],['C',2,3],['D',1,1],['F',0,0]]) {
    for (const suffix of ['', '+', '-', '−', '–']) {
      assert.equal(api.OverallMath.letterPoints(mark + suffix), basic);
      assert.equal(api.OverallMath.letterPoints(mark.toLowerCase() + suffix, true), weighted);
    }
  }
  for (const mark of ['', 'P', 'CR', 'INC', '4', 'A/B', null]) assert.equal(api.OverallMath.letterPoints(mark, true), null);
  assert.equal(api.OverallMath.letterPoints('A', 'true'), 4);
});

test('duplicate course cards use the first usable grade and count the course once', () => {
  const { api } = fixture();
  const result = api.OverallMath.summarize([
    { key:'same', mark:'', included:true }, { key:'same', mark:'A', included:true, gpaWeighted:true },
    { key:'same', mark:'B', included:true }, { key:'fail', mark:'F', included:true, gpaWeighted:true },
    { key:'excluded', mark:'A', included:false, gpaWeighted:true },
  ], null);
  assert.equal(result.rows.length, 3); assert.equal(result.count, 2);
  assert.equal(result.average, 2); assert.equal(result.weightedAverage, 2.5);
  assert.equal(result.rows[0].mark, 'A');
  const numeric = api.OverallMath.summarize([
    {key:'same', value:null, cutoffs:[95,85,75]}, {key:'same', value:95, cutoffs:[95,85,75]},
  ], [3.7,3.1,2.5], true);
  assert.equal(numeric.count, 1); assert.equal(numeric.average, 4); assert.equal(numeric.band, 4);
});

test('numeric rating thresholds have exact inclusive boundaries and reject invalid limits', () => {
  const { api } = fixture();
  for (const [value, expected] of [[95,4],[94.999,3],[85,3],[84.999,2],[75,2],[74.999,1]])
    assert.equal(api.OverallMath.rating(value, [95,85,75]), expected);
  for (const limits of [[95,95,75],[-1,-2,-3],[95,85],null]) assert.equal(api.OverallMath.rating(90,limits),null);
  assert.equal(api.OverallMath.summarize([], [3.7,3.1,2.5], true).average, null);
});

test('Count off suppresses malformed score and raw-total validation without losing the draft', () => {
  const { api } = fixture();
  for (const value of [draft({earned:'oops',possible:'0'}), draft({scoreMode:'raw',rawEarned:'oops',rawPossible:'0',possible:'no'})]) {
    const before = plain(value);
    const excluded = api.labScoreState({...value,included:false});
    assert.equal(excluded.error, ''); assert.equal(excluded.invalidEarned, false);
    assert.equal(excluded.invalidPossible, false); assert.equal(excluded.invalidRawPossible, false);
    assert.ok(api.labScoreState(value).error); assert.deepEqual(plain(value), before);
  }
});

test('Count off ignores missing hypothetical name/category and malformed ranges; re-enabling validates', () => {
  const { api } = fixture();
  const added = {id:'hypothetical:1',name:'',category:'',...draft({earned:'7',included:false})};
  const state = lab(api, [assignment()], [added]);
  state.ranges.set(added.id,{low:'bad',high:'',mode:'raw',rawPossible:'0'});
  let model = api.labModel();
  assert.equal(model.error,''); assert.equal(model.assignments[1].included,false);
  assert.equal(api.labHasCountedRanges(),false);
  assert.equal(api.GradeMath.calculate(model.assignments,rules).value,80);
  added.included = true;
  assert.ok(api.labModel().error); assert.equal(api.labHasCountedRanges(),true);
  state.ranges.clear(); assert.match(api.labModel().error,/name and category/);
});

test('range rows replace blank single scores and preserve posted assignments', () => {
  const { api } = fixture(); const original = assignment({earned:null,status:'ungraded'});
  const state = lab(api,[original]); const before = plain(original);
  state.ranges.set(original.id,{low:'3',high:'9',mode:'points',rawPossible:''});
  const model = api.labModel(); assert.equal(model.error,'');
  assert.equal(model.assignments[0].earned,3); assert.equal(model.assignments[0].included,true);
  const scenario = api.labRangeScenario(model,rules);
  assert.equal(scenario.error,''); assert.equal(scenario.result.lowResult.value,30); assert.equal(scenario.result.highResult.value,90);
  assert.deepEqual(plain(original),before);
});

test('raw/point linking preserves entered point precision and raw bounds ordering', () => {
  const { api } = fixture(); lab(api);
  const base = draft({earned:'14.66666666666667',possible:'15',rawPossible:'30'});
  const linked = api.updateLabScoreDraft(base,'rawPossible','30');
  assert.equal(linked.earned,base.earned);
  const equivalent = api.updateLabScoreDraft(base,'earned','14.666666666666670');
  assert.equal(equivalent.scoreMode,'points'); assert.equal(equivalent.earned,'14.666666666666670');
  const raw = api.updateLabScoreDraft(draft({possible:'15',rawPossible:'30'}),'rawEarned','29');
  assert.equal(raw.earned,'14.5'); assert.equal(raw.scoreMode,'raw');
  const inverted = api.labRangeState({mode:'raw',lowMode:'raw',highMode:'raw',low:'1.001',high:'1',rawPossible:'1000'},draft({possible:'1'}));
  assert.ok(inverted.error); assert.equal(inverted.invalidLow,true);
});

test('weighted profile validates categories activated only by a counted range', () => {
  const { api, body } = fixture();
  const state = lab(api,[assignment(),assignment({id:'posted:2',name:'Future project',category:'Projects',earned:null,status:'ungraded'})]);
  state.parsed.rules.categories = [{name:'Tests'},{name:'Projects'}];
  state.ranges.set('posted:2',{mode:'points',low:'0',high:'10',rawPossible:''});
  const course = api.courseFor({key:state.key,title:state.current.title});
  const previous = { ...plain(rules), mode:'weighted', weights:{Tests:1} }; course.gradingRules = previous;
  const container = new Control('div'); body.append(container); api.buildGradingProfileUI(container,()=>{});
  const control = id => findControl(container,node=>node.id===id);
  control('ap-profile-save').dispatch('click');
  const projectWeight = control('ap-profile-weight-1');
  assert.equal(projectWeight.getAttribute('aria-invalid'),'true');
  assert.equal(course.gradingRules,previous);
  projectWeight.value='2';control('ap-profile-save').dispatch('click');
  assert.equal(course.gradingRules.weights.Projects,2); assert.equal(projectWeight.getAttribute('aria-invalid'),null);
  projectWeight.value='';state.edits.set('posted:2',api.labDraft({...state.parsed.assignments[1],status:'excluded'}));
  control('ap-profile-save').dispatch('click'); assert.equal(projectWeight.getAttribute('aria-invalid'),null);
});

test('replacement references follow session renames and storage omits hypothetical scores/ranges', () => {
  const { api } = fixture();
  const added = {id:'hypothetical:1',name:'Final',category:'Tests',...draft({earned:'9'})};
  const state = lab(api,[assignment()],[added]);
  state.replacementDraft.push({source:api.planningRef(added),target:api.planningRef(state.parsed.assignments[0]),onlyIfHigher:true,capPercent:100});
  added.name='Renamed final';
  assert.equal(api.resolvePlanningRef(state.replacementDraft[0].source,api.planningRows()).id,added.id);
  state.ranges.set(added.id,{mode:'points',low:'8',high:'10',rawPossible:''});
  assert.equal(api.savePlanningReplacementRules(),true);
  const saved = api.db.profiles[api.profileKey()].courses[state.key].replacementRules[0];
  assert.equal(saved.source.name,'Renamed final');
  assert.deepEqual(Object.keys(saved.source).sort(),['category','hypothetical','id','name']);
  const serialized = JSON.stringify(api.db);
  for (const forbidden of ['"earned":','"possible":','"ranges":','"low":','"high":']) assert.equal(serialized.includes(forbidden),false);
});

test('profile/year pairs isolate course settings and avoid delimiter collisions', () => {
  const { api } = fixture();
  api.db.settings.profile='A,B'; api.db.settings.year='2026';
  const first = api.profileKey(); const course = api.courseFor({key:'course:synthetic|period:1',title:'Synthetic'});course.nickname='One';
  assert.equal(api.courseFor({key:'course:synthetic|period:1',title:'Synthetic'}),course);
  api.db.settings.profile='A';api.db.settings.year='B,2026';assert.notEqual(api.profileKey(),first);
  assert.equal(Object.keys(api.profile().courses).length,0);
  api.db.settings.profile=' A,B ';api.db.settings.year=' 2026 ';assert.equal(api.profileKey(),first);
  assert.equal(api.profile().courses['course:synthetic|period:1'].nickname,'One');
});

test('corrupt known course policies are isolated while valid rules and unrelated fields survive', () => {
  const { api: seed } = fixture();
  const reference = {id:'posted:1',name:'Synthetic',category:'Tests',hypothetical:false};
  const validRule = {source:reference,target:{...reference,id:'posted:2'},onlyIfHigher:true,capPercent:null};
  const saved = config(seed,{profiles:{'p:["",""]':{courses:{
    broken:{title:'Synthetic',gradingRules:{mode:'unknown',weights:{Tests:1}},replacementRules:[null,validRule,{source:null}],gradingProfileDraft:[]},
    valid:{title:'Valid',gradingRules:plain(rules),replacementRules:[validRule],extraLegacy:{preserved:true}},
    badList:{title:'Bad list',replacementRules:{broken:true}},
  }}}});
  const { api } = fixture(saved); const courses = api.profile().courses;
  assert.equal(courses.broken.gradingRules,undefined); assert.equal(courses.broken.gradingProfileDraft,undefined);
  assert.equal(courses.broken.replacementRules.length,1); assert.equal(courses.badList.replacementRules.length,0);
  assert.equal(courses.valid.gradingRules.mode,'points');assert.equal(courses.valid.extraLegacy.preserved,true);
  assert.match(api.recovery,/invalid saved settings/); assert.equal(api.persist(),true);
  assert.equal(api.profile().courses.broken.gradingRules,undefined);
});

test('legacy partial grading policies keep omitted defaults and cannot replace posted evidence', () => {
  const { api }=fixture();const state=lab(api);
  state.parsed.rules.categories=[{name:'Tests',earned:8,possible:10}];state.parsed.rules.official=80;
  const course=api.courseFor({key:state.key,title:state.current.title});
  for(const [legacy,normalized] of [
    [{mode:'points'},{mode:'points'}],
    [{mode:'weighted',weights:{Tests:'1'}},{mode:'weighted',weights:{Tests:1}}],
    [{scoreFloor:'60'},{scoreFloor:60}],
    [{rounding:'nearest',roundingDecimals:'0'},{rounding:'nearest',roundingDecimals:0}],
    [{},{}],
  ]) {
    course.gradingRules=plain(legacy);
    const applied=api.planningRules();assert.deepEqual(plain(course.gradingRules),normalized);
    assert.equal(applied.official,80);assert.equal(applied.categories[0].earned,8);
    assert.equal(api.GradeMath.calculate(api.planningRows(),applied).error,null);
    if(legacy.rounding===undefined)assert.equal(api.GradeMath.roundPercent(80,applied),80);
  }
  course.gradingRules={mode:'points',categories:[{name:'Tests',earned:100,possible:10}],official:1000,extraLegacy:'kept'};
  const applied=api.planningRules();assert.equal(applied.official,80);assert.equal(applied.categories[0].earned,8);
  assert.equal(course.gradingRules.extraLegacy,'kept');assert.equal(api.recovery,'');
});

test('saving profile/year keeps a preference changed since the Settings form opened', () => {
  const { api }=fixture();api.renderSettings();
  const formField=label=>findControl(api.content,node=>node.tagName==='LABEL'&&node.children[0]?.textContent===label)?.children[1];
  formField('Settings profile').value='Synthetic second profile';formField('School-year starting year').value='2026';
  api.setToggle('weightMapUngraded',true);
  findControl(api.content,node=>node.tagName==='BUTTON'&&node.textContent==='Save settings').dispatch('click');
  assert.equal(api.db.settings.profile,'Synthetic second profile');assert.equal(api.db.settings.year,'2026');
  assert.equal(api.db.settings.weightMapUngraded,true);
});

test('older four-band preferences gain bonus defaults without changing their palette or thresholds', () => {
  const { api: seed } = fixture();
  const saved = config(seed);
  delete saved.settings.bonusColor;
  delete saved.settings.bonusPercentCutoff;
  delete saved.settings.bonusAverageCutoff;
  const colors = ['#123456','#234567','#345678','#456789'];
  Object.assign(saved.settings, {colors, cutoffs:[96,86,76], averageCutoffs:[3.9,3.2,2.6]});
  const f = fixture(saved);
  assert.deepEqual(plain(f.api.db.settings.colors), colors);
  assert.deepEqual(plain(f.api.db.settings.cutoffs), [96,86,76]);
  assert.deepEqual(plain(f.api.db.settings.averageCutoffs), [3.9,3.2,2.6]);
  assert.equal(f.api.db.settings.bonusPercentCutoff, 100);
  assert.equal(f.api.db.settings.bonusAverageCutoff, 4);
  assert.equal(f.api.db.settings.bonusColor, f.api.defaults.bonusColor);
  assert.equal(f.api.recovery, '');
  assert.equal(f.api.persist(), true);
  const reloaded = fixture(f.stored);
  assert.deepEqual(plain(reloaded.api.db.settings), plain(f.api.db.settings));
});

test('the bonus settings row saves its color and strict percentage/average thresholds independently', () => {
  const f = fixture(), { api } = f;
  const original = plain(api.db.settings);
  api.renderSettings();
  const formField = label => findControl(api.content,node=>node.tagName==='LABEL'&&node.children[0]?.textContent===label)?.children[1];
  const color = formField('5 · bonus band'), percent = formField('Percentage >'), average = formField('Average >');
  assert.ok(color && percent && average, 'The bonus band has its own three controls');
  assert.equal(color.value, api.defaults.bonusColor);
  assert.equal(percent.value, '100'); assert.equal(average.value, '4');
  color.value = '#9234ab'; percent.value = '102.5'; average.value = '4.25';
  findControl(api.content,node=>node.tagName==='BUTTON'&&node.textContent==='Save settings').dispatch('click');
  assert.equal(api.db.settings.bonusColor, '#9234ab');
  assert.equal(api.db.settings.bonusPercentCutoff, 102.5);
  assert.equal(api.db.settings.bonusAverageCutoff, 4.25);
  assert.deepEqual(plain(api.db.settings.colors), original.colors);
  assert.deepEqual(plain(api.db.settings.cutoffs), original.cutoffs);
  assert.deepEqual(plain(api.db.settings.averageCutoffs), original.averageCutoffs);
  const loaded = fixture(f.stored);
  assert.equal(loaded.api.db.settings.bonusColor, '#9234ab');
  assert.equal(loaded.api.db.settings.bonusPercentCutoff, 102.5);
  assert.equal(loaded.api.db.settings.bonusAverageCutoff, 4.25);
});

test('invalid bonus thresholds cannot overwrite the saved settings', () => {
  for (const [label, value] of [['Percentage >',''],['Percentage >','-1'],['Percentage >','Infinity'],['Average >','oops']]) {
    const f = fixture(), { api } = f;
    api.renderSettings();
    const control = findControl(api.content,node=>node.tagName==='LABEL'&&node.children[0]?.textContent===label)?.children[1];
    assert.ok(control); control.value = value;
    const before = plain(api.db.settings), writes = f.writes;
    findControl(api.content,node=>node.tagName==='BUTTON'&&node.textContent==='Save settings').dispatch('click');
    assert.deepEqual(plain(api.db.settings), before, `${label}: ${value}`);
    assert.equal(f.writes, writes);
  }
});

test('malformed saved bonus settings recover without discarding valid existing bands', () => {
  const { api: seed } = fixture();
  const saved = config(seed);
  Object.assign(saved.settings, {bonusColor:'purple', bonusPercentCutoff:-1, bonusAverageCutoff:'bad', colors:['#123456','#234567','#345678','#456789']});
  const { api } = fixture(saved);
  assert.equal(api.db.settings.bonusColor, api.defaults.bonusColor);
  assert.equal(api.db.settings.bonusPercentCutoff, 100);
  assert.equal(api.db.settings.bonusAverageCutoff, 4);
  assert.deepEqual(plain(api.db.settings.colors), saved.settings.colors);
  assert.match(api.recovery, /invalid saved settings/);
});

test('profile labels and persisted own property names do not modify object prototypes', () => {
  const { api:seed }=fixture();const saved=config(seed);
  saved.settings.profile='__proto__';saved.profiles['p:["__proto__",""]']=JSON.parse('{"courses":{"__proto__":{"title":"Synthetic","nickname":"Owned key"},"constructor":{"title":"Other"}}}');
  const { api }=fixture(saved);const courses=api.profile().courses;
  assert.equal(Object.hasOwn(courses,'__proto__'),true);assert.equal(courses.__proto__.nickname,'Owned key');
  assert.equal(Object.hasOwn(courses,'constructor'),true);assert.equal({}.nickname,undefined);
  assert.equal(api.persist(),true);
});

test('invalid saved settings use safe values and never enable schedule consent implicitly', () => {
  const { api: seed } = fixture(); const saved=config(seed);
  Object.assign(saved.settings,{enabled:'yes',scheduleNetworkConsent:false,nextClass:true,cutoffs:[1,2,3],colors:['red'],year:'nonsense',detailsColors:false});
  const { api } = fixture(saved);
  assert.equal(api.db.settings.enabled,true); assert.equal(api.db.settings.nextClass,false);
  assert.deepEqual(plain(api.db.settings.cutoffs),[95,85,75]);assert.equal(api.db.settings.year,'');
  assert.equal(api.db.settings.detailsColors,false);assert.match(api.recovery,/invalid saved settings/);
});

test('unsupported or malformed root storage is preserved until an explicit successful clear', () => {
  for (const saved of [{version:99,settings:{secret:'fixture'},profiles:{}},['invalid'],{version:1,settings:{},profiles:null}]) {
    const f = fixture(saved);const before=plain(f.stored);
    assert.equal(f.api.blocked,true);assert.equal(f.api.persist(),false);assert.equal(f.writes,0);assert.deepEqual(f.stored,before);
    assert.equal(f.api.clearSavedSettings(),true);assert.equal(f.writes,1);assert.equal(f.api.blocked,false);
    assert.equal(f.stored.settings.enabled,false);assert.equal(f.stored.settings.nextClass,false);assert.deepEqual(f.stored.profiles,{});
    assert.equal(typeof f.stored.resetMarker,'string');
  }
});

test('storage read failure does not overwrite data when a later ordinary save could succeed', () => {
  const saved = {version:99,settings:{label:'Preserve fixture'},profiles:{}};
  const f=fixture(saved,{failRead:true});assert.equal(f.api.blocked,true);
  f.failRead(false);assert.equal(f.api.persist(),false);assert.deepEqual(f.stored,saved);assert.equal(f.writes,0);
  f.failRead(true);assert.equal(f.api.clearSavedSettings(),false);assert.equal(f.api.db.settings.enabled,true);
  assert.equal(f.writes,0);f.failRead(false);assert.equal(f.api.clearSavedSettings(),true);
});

test('save failures update an already visible status immediately and allow a retry', () => {
  const f=fixture();const status=f.api.storageStatusNote();f.body.append(status);
  assert.equal(status.hidden,true);f.failWrite(true);assert.equal(f.api.persist(),false);
  assert.equal(status.hidden,false);assert.match(status.textContent,/Could not save/);assert.equal(f.api.pending,true);
  f.failWrite(false);assert.equal(f.api.persist(),true);assert.equal(status.hidden,true);assert.equal(status.textContent,'');assert.equal(f.api.pending,false);
});

test('reset markers reject stale ordinary saves while explicit clear remains available', () => {
  const f=fixture();assert.equal(f.api.persist(),true);
  const cleared={...f.stored,resetMarker:'other-tab-reset',settings:{...f.stored.settings,enabled:false},profiles:{}};
  f.writeElsewhere(cleared);f.api.db.settings.profile='Stale change';
  const status=f.api.storageStatusNote();f.body.append(status);
  assert.equal(f.api.persist(),false);assert.equal(f.api.pending,false);assert.deepEqual(f.stored,cleared);
  assert.match(status.textContent,/cleared in another tab/);
  assert.equal(f.api.clearSavedSettings(),true);assert.notEqual(f.stored.resetMarker,'other-tab-reset');assert.equal(f.stored.settings.profile,'');
});

test('legacy defaults and generated icons migrate once while custom values survive', () => {
  const { api: seed }=fixture();const saved=config(seed,{defaultsRevision:0,blankIconsRevision:0});
  saved.settings.averageCutoffs=[3.8,3.4,3];
  saved.profiles['p:["",""]']={courses:{math:{title:'Math',minimum:0,maximum:100,icon:'∫'},custom:{title:'Math custom',minimum:20,maximum:100,icon:'★'}}};
  const f=fixture(saved);const courses=f.api.profile().courses;
  assert.deepEqual(plain(f.api.db.settings.averageCutoffs),[3.7,3.1,2.5]);assert.equal(courses.math.minimum,50);assert.equal(courses.math.icon,'');
  assert.equal(courses.custom.minimum,20);assert.equal(courses.custom.icon,'★');assert.equal(f.api.persist(),true);
  courses.math.minimum=0;courses.math.icon='∫';f.api.persist();
  const reloaded=fixture(f.stored);assert.equal(reloaded.api.profile().courses.math.minimum,0);assert.equal(reloaded.api.profile().courses.math.icon,'∫');
});

test('native course matching prefers exact keys and refuses ambiguous or unverifiable aliases', () => {
  const { api }=fixture();const current={title:'Synthetic',gradebook:'42',term:'F',school:'7',period:'1',link:'Widgets/ClassSummary/RedirectToGradebook?GradebookNumber=42&Term=F&SC=7'};
  const canonical=api.GradeDOM.courseKey(current.title,current.link,current.period);
  const courses=api.profile().courses;const add=key=>{courses[key]=api.courseDefaults('Synthetic');};
  const legacy='url:/student/old?gradebooknumber=42&sc=7&term=F';add(legacy);assert.equal(api.nativeCourseKey(current),legacy);
  const second='url:/student/another?gradebooknumber=42&sc=7&term=F';add(second);assert.equal(api.nativeCourseKey(current),canonical);
  add(canonical);assert.equal(api.nativeCourseKey(current),canonical);
  for(const key of Object.keys(courses))delete courses[key];
  for(const key of ['url:/old?gradebooknumber=42&sc=7&term=F&year=2025','url:/old?gradebooknumber=42&sc=8&term=F','url:/old?gradebooknumber=42&term=F'])add(key);
  assert.equal(api.nativeCourseKey(current),canonical);
});
