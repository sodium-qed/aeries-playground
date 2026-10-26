import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';

// Isolated functions from the release source, with fictional records and a small
// DOM/event model. These tests do not claim browser layout or BFCache coverage.
const source = readFileSync(process.env.AERIES_AUDIT_SOURCE || fileURLToPath(new URL('../aeries-playground.user.js', import.meta.url)), 'utf8');
function slice(from, to) {
  const start = source.indexOf(from), end = source.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end > start, `Source boundaries: ${from} → ${to}`);
  return source.slice(start, end);
}
function load(code, names, bindings = {}) {
  const context = vm.createContext({ ...bindings });
  vm.runInContext(`${code}\nglobalThis.subject = { ${names.join(', ')} };`, context);
  return { context, ...context.subject };
}
class Style {
  values = new Map();
  getPropertyValue(key) { return this.values.get(key)?.[0] || ''; }
  getPropertyPriority(key) { return this.values.get(key)?.[1] || ''; }
  setProperty(key, value, priority = '') { this.values.set(key, [String(value), priority]); }
  removeProperty(key) { this.values.delete(key); }
  set cssText(text) {
    this.values.clear();
    for (const part of text.split(';')) {
      const i = part.indexOf(':');
      if (i < 0) continue;
      const key = part.slice(0, i).trim(), raw = part.slice(i + 1).trim();
      this.setProperty(key, raw.replace(/\s*!important$/, ''), /!important$/.test(raw) ? 'important' : '');
    }
  }
}
class Element {
  constructor(tag = 'span', attributes = {}) {
    this.tagName = tag.toUpperCase(); this.nodeType = 1; this.attributes = new Map(Object.entries(attributes));
    this.style = new Style(); this.dataset = {}; this.children = []; this.events = new Map(); this.isConnected = true;
    this.textContent = ''; this.parentElement = null; this.parentNode = null;
  }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  removeAttribute(key) { this.attributes.delete(key); }
  hasAttribute(key) { return this.attributes.has(key); }
  addEventListener(type, listener) { this.events.set(type, listener); }
  append(...nodes) { for (const node of nodes) { node.parentElement = node.parentNode = this; this.children.push(node); } }
  remove() { this.removed = true; this.isConnected = false; }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  attachShadow() { this.shadowRoot = new Element('shadow-root'); return this.shadowRoot; }
  showModal() { this.open = true; }
  close() { this.open = false; this.events.get('close')?.(); }
  focus() { this.focused = true; }
  querySelectorAll(selector) { return this.children.flatMap(child => [ ...(child.matches?.(selector) ? [child] : []), ...(child.querySelectorAll?.(selector) || []) ]); }
  matches(selector) {
    if (selector.includes(',')) return selector.split(',').some(part => this.matches(part));
    if (selector === '[data-ap-owned]') return this.hasAttribute('data-ap-owned');
    if (selector === '.classesSection') return this.getAttribute('class')?.split(/\s+/).includes('classesSection') || false;
    if (selector.startsWith('input:not(')) return this.tagName === 'INPUT' && !['button', 'submit', 'reset'].includes(this.getAttribute('type'));
    if (selector.startsWith('select[')) return this.tagName === 'SELECT' && this.getAttribute('id')?.endsWith('_dlGN');
    if (selector.startsWith('input[')) return this.tagName === 'INPUT' && this.getAttribute('id')?.endsWith('_chkMissingAssignmentOnly');
    return this.tagName.toLowerCase() === selector;
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelector(selector) { for (const child of this.children) { if (child.matches(selector)) return child; const nested = child.querySelector(selector); if (nested) return nested; } return null; }
}
const element = (tag, attrs) => new Element(tag, attrs);

test('lab event containment preserves native Enter activation for buttons and selects', () => {
  const { labContain } = load(slice('  function labContain(', '  function applyLabActionTypography('), ['labContain']);
  const host = element('section'); labContain(host);
  for (const tag of ['button', 'select', 'textarea']) {
    let stopped = false, prevented = false;
    host.events.get('keydown')({ key: 'Enter', target: element(tag), stopPropagation() { stopped = true; }, preventDefault() { prevented = true; } });
    assert.equal(stopped, true); assert.equal(prevented, false, tag);
  }
  for (const type of ['text', 'number', 'checkbox']) {
    let prevented = false;
    host.events.get('keydown')({ key: 'Enter', target: element('input', { type }), stopPropagation() {}, preventDefault() { prevented = true; } });
    assert.equal(prevented, true, type);
  }
  for (const type of ['button', 'submit', 'reset']) {
    let prevented = false;
    host.events.get('keydown')({ key: 'Enter', target: element('input', { type }), stopPropagation() {}, preventDefault() { prevented = true; } });
    assert.equal(prevented, false, type);
  }
});

function labRenderFixture({ colors, ranged = false, average = false }) {
  const assignment = { id: 'posted:1', name: 'Fictional practice', category: 'Practice', earned: 80, possible: 100, included: true, sourceNameCells: [element('td')] };
  const added = { id: 'hypothetical:1', name: 'Fictional future', category: 'Practice', earned: 90, possible: 100, included: true };
  const calculated = { value: 85, totalEarned: 170, totalPossible: 200, appliedReplacements: [], effectiveAssignments: [assignment, added], categories: [{ name: 'Practice', percent: 85, earned: 170, possible: 200 }] };
  const summary = Object.fromEntries(['DESC', 'PCT', 'MK', 'PTS', 'MX'].map(key => [key, { id: key, textContent: key === 'DESC' ? 'Total' : '85%' }]));
  const row = { querySelector(selector) { return summary[selector.match(/_td(\w+)/)[1]]; } };
  const editor = { earned: { style: {} }, rawEarned: { style: {} }, undo: {} };
  const addedControls = Object.fromEntries(['name', 'earned', 'rawEarned', 'percent'].map(key => [key, { style: {} }]));
  Object.assign(addedControls, { included: {}, sync() {} });
  const lab = { active: true, parsed: { assignments: [assignment], rules: { official: 85, officialUnit: 'percent', averageMaximum: average ? 4 : null } },
    edits: new Map([[assignment.id, {}]]), ranges: new Map(), added: [added], editors: new Map([[assignment.id, [editor]]]), addedEditors: new Map([[added.id, addedControls]]), badges: [], toolbar: { querySelector() { return {}; } } };
  const colorsUsed = [], values = [];
  const bindings = { gradeLab: lab, db: { settings: { detailsColors: colors } }, applyDetailsColors() {}, restoreDetailsColors() {}, syncLabEditors() {},
    labModel: () => ({ assignments: [assignment, added], error: '' }), planningRules: () => ({ averageMaximum: average ? 4 : null }),
    labRangeScenario: () => ({ active: ranged, error: '', result: ranged ? { lowResult: calculated, highResult: calculated, rangeCount: 1 } : null }),
    GradeMath: { calculate: () => calculated }, planningBaselineError: () => '', fmt: String,
    planningFormat: String, detailsColor(value, unit) { colorsUsed.push({ value, unit }); return '#123456'; },
    labGrade: String, assignmentPercentCells: () => [{ id: 'assignment-percent' }], labValue: (cell, text, color) => values.push({ id: cell?.id, color }),
    labTag: () => element('span'), detailPaint: (cell, color) => values.push({ id: 'name', color }),
    document: { querySelectorAll: () => [row] }, GradeDOM: { cleanText: node => node.textContent },
    refreshGradeLabImpacts() {}, refreshPlanningUI() {}, refreshAssignmentLabButtons() {} };
  const { renderGradeLabResult } = load(slice('  function renderGradeLabResult(', '\n  function syncAeriesFont('), ['renderGradeLabResult'], bindings);
  renderGradeLabResult();
  return { colorsUsed, values, editor, addedControls };
}

test('detailsColors off removes grade-band colors consistently from edited, added, and total grades', () => {
  for (const average of [false, true]) {
    const result = labRenderFixture({ colors: false, average });
    assert.deepEqual(result.colorsUsed, []);
    assert.equal(result.editor.earned.style.color, '');
    assert.equal(result.editor.rawEarned.style.color, '');
    assert.equal(result.addedControls.name.style.color, '');
    assert.ok(result.values.every(value => !value.color));
  }
});
test('enabled grade colors still follow numeric values and ranges remain neutral', () => {
  for (const average of [false, true]) {
    const colored = labRenderFixture({ colors: true, average });
    assert.equal(colored.colorsUsed.length, 3);
    assert.ok(colored.colorsUsed.every(entry => entry.unit === (average ? 'average' : 'percent')));
    assert.equal(colored.editor.earned.style.color, '#123456');
    assert.equal(colored.addedControls.percent.style.color, '#123456');
    for (const colors of [false, true]) {
      const neutral = labRenderFixture({ colors, average, ranged: true });
      assert.deepEqual(neutral.colorsUsed, []);
      assert.equal(neutral.editor.earned.style.color, '#42566f');
      assert.equal(neutral.addedControls.percent.style.color, '#42566f');
    }
  }
});

test('nickname removal restores native title attributes without waiting for a settings-wide reset', () => {
  const title = element('a', { title: 'Native tooltip', 'aria-label': 'Native accessible name' });
  const bindings = { titleOriginals: new Map(), db: { settings: { nicknames: true } }, getComputedStyle: () => ({ fontSize: '20px' }) };
  const { titleStyle } = load(slice('  function restoreTitle(', '  function drawWidget('), ['titleStyle'], bindings);
  titleStyle({ titleElement: title, title: 'Fictional course' }, { nickname: 'Custom', icon: '' });
  assert.equal(title.getAttribute('data-ap-label'), 'Custom');
  titleStyle({ titleElement: title, title: 'Fictional course' }, { nickname: '', icon: '' });
  assert.equal(title.getAttribute('data-ap-label'), null);
  assert.equal(title.getAttribute('title'), 'Native tooltip');
  assert.equal(title.getAttribute('aria-label'), 'Native accessible name');
  assert.equal(bindings.titleOriginals.size, 0);
});
test('page decoration cleanup releases removed and still-connected obsolete cards', () => {
  const currentCard = element('div'), oldCard = element('div'), oldTitle = element('a'), currentTitle = element('a');
  const currentWidget = element('div'), oldWidget = element('div'), restored = [];
  const bindings = { cards: [{ element: currentCard, titleElement: currentTitle }], widgetHosts: new Map([[oldCard, { host: oldWidget }], [currentCard, { host: currentWidget }]]),
    titleOriginals: new Map([[oldTitle, {}], [currentTitle, {}]]), restoreTitle: title => restored.push(title) };
  const { prunePageDecorations } = load(slice('  function prunePageDecorations(', '  function scan('), ['prunePageDecorations'], bindings);
  prunePageDecorations();
  assert.equal(oldCard.isConnected, true); assert.equal(oldWidget.removed, true); assert.equal(currentWidget.removed, undefined);
  assert.equal(bindings.widgetHosts.size, 1); assert.equal(bindings.titleOriginals.size, 1); assert.deepEqual(restored, [oldTitle]);
});

function nativeDetailsFixture() {
  let course = { title: 'Fictional class', key: 'first' }, table = { querySelectorAll: () => [] };
  const assignment = { id: 'posted:1', name: 'Practice', category: 'Practice', sourceCell: { textContent: '80/100' } };
  const parsed = { assignments: [assignment], rules: {} }, removed = [];
  const bindings = { db: { settings: { enabled: true, impacts: false } }, GradeDOM: { currentCourse: () => course, listTables: () => [{ element: table, nativeAeries: true }], readTable: () => parsed, cleanText: value => value?.textContent || '' },
    document: { querySelector: () => null, querySelectorAll: () => [] }, GradeMath: { fromAeries: () => ({ error: 'Synthetic unchecked totals' }) },
    nativeCourseKey: current => current.key, nativePageState: null, nativeStatus: null, nativeBanner: null, annotationSources: new Map(), gradeLab: null,
    closeGradeLab() { removed.push('lab'); }, clearWeightMapPage() { removed.push('weights'); }, clearCategorySpotlight() { removed.push('categories'); }, clearAnnotations() {}, clearImpactLabels() {},
    refreshWeightMap() {}, refreshCategorySpotlight() {}, refreshGradeLab() {}, showNativeStatus() {}, courseFor() {} };
  const loaded = load(slice('  function refreshNativeDetails(', '  // Hypothetical scores live only in memory.'), ['refreshNativeDetails'], bindings);
  return { ...loaded, bindings, removed, changeCourse(key, replaceTable = true) { course = { ...course, key }; if (replaceTable) table = { querySelectorAll: () => [] }; } };
}
test('native detail refresh retains only current annotation sources and clears them while awaiting new rows', () => {
  const fixture = nativeDetailsFixture();
  fixture.refreshNativeDetails();
  assert.deepEqual([...fixture.bindings.annotationSources.keys()], ['first']);
  fixture.changeCourse('second'); fixture.refreshNativeDetails();
  assert.deepEqual([...fixture.bindings.annotationSources.keys()], ['second']);
  fixture.changeCourse('third', false); fixture.refreshNativeDetails();
  assert.equal(fixture.context.nativePageState.waiting, true);
  assert.equal(fixture.bindings.annotationSources.size, 0);
  assert.deepEqual(fixture.removed, ['lab', 'weights', 'categories']);
});
test('native status banner follows a replacement table parent', () => {
  const previousParent = element('div'), nextParent = element('div'), banner = element('div'); previousParent.append(banner);
  const table = { parentElement: nextParent, before(node) { nextParent.append(node); } };
  const { showNativeStatus } = load(slice('  function showNativeStatus(', '  function refreshNativeDetails('), ['showNativeStatus'], { nativeBanner: banner, nativeStatus: null });
  showNativeStatus({ element: table }, 'Fictional totals loaded');
  assert.equal(banner.parentElement, nextParent); assert.equal(banner.textContent, 'Fictional totals loaded');
});

test('lab refresh rebuilds when alternate view rows or score-cell sets change', () => {
  const mainRow = {}, cardRow = {}, newCardRow = {}, score = {}, cardScore = {}, table = {};
  const oldAssignment = { id: 'a', name: 'Fictional work', category: 'Practice', earned: 80, possible: 100, included: true, sourceRow: mainRow, sourceRows: [mainRow, cardRow], sourceCells: [score, cardScore], sourceNameCells: [score], rawScoreCells: [] };
  const oldParsed = { assignments: [oldAssignment], rules: {} }, info = { element: table }, options = { partial: false };
  const signature = JSON.stringify(['profile', 'course', false, [[oldAssignment.id, oldAssignment.name, oldAssignment.category, oldAssignment.earned, oldAssignment.possible, oldAssignment.included, undefined, undefined, undefined]], {}]);
  for (const replacement of [{ sourceRows: [mainRow, newCardRow] }, { sourceRows: [mainRow] }, { sourceCells: [score] }, { sourceNameCells: [cardScore] }]) {
    const gradeLab = { signature, info, parsed: oldParsed, overlays: new Map(), active: true, toolbar: { isConnected: true } };
    const { refreshGradeLab } = load(slice('  function refreshGradeLab(', '  function assignmentPercentCells('), ['refreshGradeLab'], { gradeLab, profileKey: () => 'profile', weightMapButton: null, refreshAssignmentLabButtons() {}, closeGradeLab() { throw new Error('Rebuild detected'); } });
    assert.throws(() => refreshGradeLab(info, 'course', {}, { assignments: [{ ...oldAssignment, ...replacement }], rules: {} }, {}, options), /Rebuild detected/);
  }
  for (const connected of [true, false]) {
    const overlayCell = { isConnected: connected };
    const gradeLab = { signature, info, parsed: oldParsed, overlays: new Map([[overlayCell, { original: { parentNode: overlayCell }, ui: { parentNode: overlayCell } }]]), active: true, toolbar: { isConnected: true } };
    const { refreshGradeLab } = load(slice('  function refreshGradeLab(', '  function assignmentPercentCells('), ['refreshGradeLab'], { gradeLab, profileKey: () => 'profile', weightMapButton: null, refreshAssignmentLabButtons() {}, closeGradeLab() { throw new Error('Rebuild detected'); } });
    const refresh = () => refreshGradeLab(info, 'course', {}, oldParsed, {}, options);
    if (connected) assert.doesNotThrow(refresh, 'unchanged native nodes must preserve the active scenario');
    else assert.throws(refresh, /Rebuild detected/, 'detached native total/percentage overlays must reset the scenario');
  }
});

function lifecycleFixture() {
  const handlers = new Map(), documentHandlers = new Map(), timers = new Map(), calls = [];
  let timerId = 0;
  class Observer {
    constructor(callback) { this.callback = callback; this.observations = []; }
    observe(target, options) { this.observations.push({ target, options }); calls.push('observe'); }
    disconnect() { calls.push('disconnect'); }
  }
  const bindings = { MutationObserver: Observer, Node: { ELEMENT_NODE: 1 }, document: { body: element('body'), createElement: tag => element(tag), addEventListener: (name, fn) => documentHandlers.set(name, fn) },
    window: { addEventListener: (name, fn) => handlers.set(name, fn) }, setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
    scan() { calls.push('scan'); }, panelReturnFocus: {}, dialog: { open: true, close() { this.open = false; calls.push('close-dialog'); } },
    closeGradeLab() { calls.push('close-lab'); }, clearAnnotations() { calls.push('clear-annotations'); }, restoreDetailsColors() { calls.push('restore-colors'); },
    clearCategorySpotlight() { calls.push('clear-categories'); }, clearWeightMapPage() { calls.push('clear-weights'); },
    nativePageState: {}, nativeStatus: {}, nativeBanner: { remove() { calls.push('remove-banner'); } }, annotationSources: new Map([['fictional', []]]),
    saveTimer: 999, savePending: true, persist() { calls.push('persist'); } };
  const loaded = load(slice('  let scanTimer', "  try{GM_registerMenuCommand('Aeries Playground"), ['scheduleScan', 'pageMutationRelevant', 'observer', 'observerOptions'], bindings);
  return { ...loaded, handlers, documentHandlers, timers, calls, bindings };
}
test('pagehide discards transient UI, cancels queued scans, and pageshow reconstructs once', () => {
  const fixture = lifecycleFixture();
  fixture.handlers.get('resize')(); assert.equal(fixture.timers.size, 1);
  fixture.handlers.get('pagehide')();
  assert.equal(fixture.timers.size, 0);
  assert.equal(fixture.bindings.dialog.open, false);
  assert.equal(fixture.context.panelReturnFocus, null);
  assert.equal(fixture.context.nativePageState, null); assert.equal(fixture.context.nativeStatus, null); assert.equal(fixture.context.nativeBanner, null);
  assert.equal(fixture.bindings.annotationSources.size, 0);
  assert.deepEqual(fixture.calls, ['observe', 'disconnect', 'close-dialog', 'close-lab', 'clear-annotations', 'restore-colors', 'clear-categories', 'clear-weights', 'remove-banner', 'persist']);
  fixture.handlers.get('resize')(); fixture.documentHandlers.get('change')(); assert.equal(fixture.timers.size, 0);
  fixture.handlers.get('pageshow')(); fixture.handlers.get('pageshow')();
  assert.deepEqual(fixture.calls.slice(-2), ['observe', 'scan']);
  fixture.handlers.get('resize')(); assert.equal(fixture.timers.size, 1);
});
test('dashboard observer detects card visibility changes without looping on grade colors', () => {
  const { pageMutationRelevant, observerOptions } = lifecycleFixture();
  const section = element('div', { class: 'classesSection' }), card = element('div'); section.append(card);
  assert.equal(observerOptions.attributeOldValue, true);
  for (const attributeName of ['class', 'hidden', 'aria-expanded']) assert.equal(pageMutationRelevant({ type: 'attributes', target: card, attributeName }), true);
  card.style.cssText = 'color: blue !important;';
  assert.equal(pageMutationRelevant({ type: 'attributes', target: card, attributeName: 'style', oldValue: 'color: red !important;' }), false);
  for (const property of ['display', 'visibility', 'content-visibility']) {
    card.style.cssText = `${property}: hidden; color: blue;`;
    assert.equal(pageMutationRelevant({ type: 'attributes', target: card, attributeName: 'style', oldValue: 'color: red;' }), true, property);
  }
  const owned = element('span', { 'data-ap-owned': 'widget' }); card.append(owned);
  assert.equal(pageMutationRelevant({ type: 'childList', target: card, addedNodes: [owned], removedNodes: [] }), false);
  assert.equal(pageMutationRelevant({ type: 'characterData', target: { nodeType: 3, parentElement: owned }, addedNodes: [], removedNodes: [] }), false);
  assert.equal(pageMutationRelevant({ type: 'characterData', target: { nodeType: 3, parentElement: card }, addedNodes: [], removedNodes: [] }), true);
  assert.equal(pageMutationRelevant({ type: 'childList', target: element('div'), addedNodes: [element('table')], removedNodes: [] }), true);
});

test('paused weight-map action explicitly identifies enabling both Playground and the map', () => {
  for (const enabled of [false, true]) {
    const labels = [], settings = { enabled, weightMap: false };
    const bindings = { tabsByName: { courses: 'Courses', weights: 'Weight map', settings: 'Settings' }, activeTab: '', content: { replaceChildren() {}, dataset: {}, setAttribute() {}, append() {} },
      tabs: { children: [] }, storageError: '', db: { settings }, storageStatusNote: () => ({}), note: () => ({}), button(label) { labels.push(label); return {}; } };
    const { renderTab } = load(slice('  function renderTab(', '  function renderCourses('), ['renderTab'], bindings);
    renderTab('weights');
    assert.deepEqual(labels, [enabled ? 'Enable Weight map' : 'Enable Playground and weight map']);
  }
});


test('full userscript initializes and resumes on a fictional empty page without public requests', () => {
  const windowEvents = new Map(), menus = new Map(), timers = new Map();
  let timerId = 0, networkRequests = 0;
  const addWindowEvent = (name, callback) => windowEvents.set(name, [...(windowEvents.get(name) || []), callback]);
  const fire = name => { for (const callback of windowEvents.get(name) || []) callback({ persisted: true }); };
  const body = element('body'), head = element('head'), previousFocus = element('button');
  const document = { body, head, activeElement: previousFocus, hidden: false, baseURI: 'https://mvla.aeries.net/student/fictional-audit',
    createElement: tag => element(tag), createTextNode: text => ({ nodeType: 3, textContent: text }),
    getElementById(id) { return [...head.children, ...body.children].find(node => node.getAttribute?.('id') === id) || null; },
    querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
  const timer = callback => { timers.set(++timerId, callback); return timerId; };
  const context = vm.createContext({ document, location: { hostname: 'mvla.aeries.net', pathname: '/student/fictional-audit', href: document.baseURI },
    window: { addEventListener: addWindowEvent, removeEventListener(name, callback) { windowEvents.set(name, (windowEvents.get(name) || []).filter(listener => listener !== callback)); } }, MutationObserver: class { observe() {} disconnect() {} },
    Node: { ELEMENT_NODE: 1 }, NodeFilter: { SHOW_TEXT: 4 }, getComputedStyle: () => ({ fontFamily: 'sans-serif' }),
    setTimeout: timer, clearTimeout: id => timers.delete(id), setInterval: timer, clearInterval: id => timers.delete(id),
    GM_getValue: () => null, GM_setValue() {}, GM_registerMenuCommand: (name, action) => menus.set(name, action),
    GM_xmlhttpRequest() { networkRequests++; throw new Error('Unexpected network request in fictional fixture'); } });
  assert.doesNotThrow(() => vm.runInContext(source, context, { timeout: 1000 }));
  assert.ok(document.getElementById('ap-playground-host'));
  assert.equal(menus.size, 2);
  assert.doesNotThrow(() => menus.get('Aeries Playground — open settings (S)')());
  const dialog = document.getElementById('ap-playground-host').shadowRoot.children.find(node => node.tagName === 'DIALOG');
  assert.equal(dialog.open, true);
  assert.doesNotThrow(() => fire('pagehide'));
  assert.equal(dialog.open, false);
  assert.doesNotThrow(() => fire('pageshow'));
  assert.equal(networkRequests, 0);
  assert.equal(previousFocus.focused, undefined, 'pagehide must not restore focus into the departing page');
});
