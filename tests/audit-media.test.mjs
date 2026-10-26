import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// Source-extracted synthetic fixtures. No Aeries account, real roster, external
// request, or YouTube playback is used by these deterministic regressions.
const source = readFileSync(process.env.AP_TEST_SOURCE || new URL('../aeries-playground.user.js', import.meta.url), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `source markers: ${start}`);
  return source.slice(a, b);
}
const courseSource = section('  const CourseSchedule = (() => {', '\n  const AP_KEY');
const mvhsSource = section('const MVHSSchedule = (() => {', '// END MVHSSchedule');
const bellSource = section('const BellPlusSchedule = (() => {', '// END BellPlusSchedule');
const adapterSource = section('let scheduleHost = null', '\n  function scan() {');
const mediaSource = section('  const kbar = (() => {', '\n  function renderTab(name){');
const plain = value => JSON.parse(JSON.stringify(value));
const week = ['none', 'regular', 'regular', 'regular', 'regular', 'regular', 'none'];
const periods = { '0800-0900': 1, '0910-1010': 2, '1010-1020': 'Break', '1020-1040': 'Tutorial' };
function core() {
  const context = vm.createContext({ Date, Intl });
  vm.runInContext(courseSource + mvhsSource + bellSource + '\nglobalThis.api={CourseSchedule,MVHSSchedule,BellPlusSchedule};', context);
  return context.api;
}
function snapshot(api, days = {}, map = week, schedules = { regular: periods }) {
  return api.MVHSSchedule.snapshot(days, map, schedules);
}
function bellRaw(overrides = '') {
  return {
    meta: { name: 'Mountain View High School' }, correction: '0',
    calendar: '* Default Week\nSun none\nMon regular\nTue regular\nWed regular\nThu regular\nFri regular\nSat none\n* Special Days\n' + overrides,
    schedules: '* regular\n08:00 {Period 1}\n09:00 Passing to 2\n09:10 {Period 2}\n10:10 Break\n10:20 Academic Collaboration Time\n10:40 Free\n* none',
  };
}

class EventTarget {
  listeners = new Map();
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
  }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  emit(type, event = {}) { for (const fn of [...(this.listeners.get(type) || [])]) fn(event); }
}
class Element extends EventTarget {
  constructor(tag, text, attributes = {}) {
    super(); this.tagName = tag; this.attributes = { ...attributes }; this.children = [];
    this._text = text ?? ''; this.style = {}; this.parent = null; this.open = false;
    if (tag === 'iframe') this.contentWindow = { messages: [], postMessage(data, origin) { this.messages.push({ data: JSON.parse(data), origin }); } };
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  get isConnected() { return this.connected === true || Boolean(this.parent?.isConnected); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
  replaceChildren(...children) { for (const child of this.children) child.parent = null; this.children = []; this._text = ''; this.append(...children); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
  attachShadow() { this.shadowRoot = new Element('#shadow'); this.shadowRoot.parent = this; return this.shadowRoot; }
  matches(selector) {
    return selector.split(',').some(part => {
      const attr = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(part.trim());
      return attr ? this.getAttribute(attr[1]) !== null && (attr[2] === undefined || this.getAttribute(attr[1]) === attr[2]) : part.trim() === this.tagName;
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) || null; }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [ ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector) ]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
function browserHarness(includeSchedule = false) {
  const window = new EventTarget(), document = new EventTarget(), timers = new Map();
  let nextTimer = 0, now = Date.parse('2026-10-26T15:30:00Z'), focused = null;
  class ClockDate extends Date { constructor(value) { super(arguments.length ? value : now); } static now() { return now; } }
  const body = new Element('body'); body.connected = true;
  Object.assign(document, { body, hidden: false, activeElement: null });
  const el = (tag, text = null, attrs = {}) => new Element(tag, text, attrs);
  const button = (text, handler) => { const node = el('button', text); node.addEventListener('click', handler); return node; };
  const context = vm.createContext({
    Date: ClockDate, Intl, URL, URLSearchParams, window, document, el, button,
    location: { origin: 'https://mvla.aeries.net', href: 'https://mvla.aeries.net/student/synthetic' },
    performance: { now: () => now }, db: { settings: { enabled: true, nextClass: true, scheduleNetworkConsent: true, nicknames: true } },
    dialog: { open: false }, focusedElement: () => focused,
    setTimeout: (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; },
    setInterval: (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms, interval: true }); return id; },
    clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id),
    cards: [], profileKey: () => 'synthetic', courseFor: card => ({ nickname: '', schedulePeriod: card.schedulePeriod }),
    mountSummary: (host, container) => { if (!host.isConnected) container.append(host); }, removeEmptySummaries() {}, openPanel() {},
  });
  if (includeSchedule) vm.runInContext(courseSource + mvhsSource + bellSource + adapterSource, context);
  else vm.runInContext(mediaSource + '\nglobalThis.media=kbar;', context);
  return {
    context, body, window, document, timers,
    run: code => vm.runInContext(code, context), setTime: value => { now = value; }, setFocus: value => { focused = value; },
    fireTimer(ms) { for (const [id, timer] of [...timers]) if (timer.ms === ms) { if (!timer.interval) timers.delete(id); timer.fn(); } },
    frame() { return body.children.find(child => child.attributes.id === 'ap-kbar-footer')?.shadowRoot.querySelector('iframe'); },
    status() { return body.children.find(child => child.attributes.id === 'ap-kbar-footer')?.shadowRoot.querySelector('p')?.textContent || ''; },
    receive(data, extra = {}) { const frame = this.frame(); window.emit('message', { source: frame?.contentWindow, origin: 'https://www.youtube-nocookie.com', data: typeof data === 'string' ? data : JSON.stringify(data), ...extra }); },
    commands() { return this.frame()?.contentWindow.messages.filter(message => message.data.event === 'command').map(message => message.data.func) || []; },
  };
}
function visibleControls(h) {
  const control = new Element('button'), status = new Element('p'); h.body.append(control, status);
  h.context.media.attachControls(control, status);
  return { control, status };
}
function keyEvent(target = new Element('div'), extra = {}) {
  return { key: 'p', target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, composedPath: () => [target], ...extra };
}

// Schedule parsing and period matching cover their complete exported API.
test('course periods normalize exact identities and avoid grading-period or mixed-period guesses', () => {
  const { CourseSchedule: c } = core();
  for (const [value, expected] of [['01', '1'], ['Period: 02a', '2A'], ['pd. # 7', '7'], [0, '0'], ['20Z', '20Z'], ['21', null], ['2/3', null], ['', null]]) assert.equal(c.normalize(value), expected);
  for (const [value, explicit, expected] of [['2', false, null], ['2', true, '2'], ['Period 2 / 3', false, null], ['Grading Period 2', false, null], ['Period 2A · Teacher Example', false, '2A'], ['Period 1 / Period 3', false, null], ['Period 1 / Room 100', false, '1']]) assert.equal(c.fromText(value, explicit), expected);
  const roster = [{ key: 'a', period: '2A', title: 'Example A', nickname: 'Custom' }, { key: 'a', period: '2A', title: 'Example A' }];
  assert.equal(c.resolve('2A', roster).course.title, 'Example A');
  assert.equal(c.resolve('2', roster).course, null);
  assert.equal(c.resolve('21', roster).ambiguous, false);
  assert.equal(c.resolve('2A', [...roster, { key: 'b', period: '2A' }]).ambiguous, true);
  assert.equal(c.title({ period: '2A' }, [roster[0]], true), 'Custom · Period 2A');
  assert.equal(c.title({ period: '2A' }, [roster[0]], false), 'Example A · Period 2A');
  assert.equal(c.title({ period: '3' }, roster), 'Period 3');
  assert.equal(c.title({ period: null, label: 'Tutorial' }, roster), 'Tutorial');
});

test('course detection uses one unambiguous explicit native period and excludes owned markup', () => {
  const { CourseSchedule: c } = core();
  const root = new Element('article', null, { 'data-period': '02A' });
  root.querySelectorAll = () => [];
  assert.equal(c.detect(root), '2A');
  const explicit = new Element('span', 'Period 3'); root.querySelectorAll = () => [explicit];
  assert.equal(c.detect(root), null);
  explicit.attributes['data-ap-owned'] = 'fixture';
  assert.equal(c.detect(root), '2A');
  delete root.attributes['data-period'];
  assert.equal(c.detect(root), null);
});

test('Pacific dates and clocks preserve spring-forward, fall-back, and UTC date boundaries', () => {
  const { MVHSSchedule: m } = core();
  const cases = [
    ['2026-03-08T09:59:59Z', '2026-03-08', 119 + 59 / 60], ['2026-03-08T10:00:00Z', '2026-03-08', 180],
    ['2026-11-01T08:59:59Z', '2026-11-01', 119 + 59 / 60], ['2026-11-01T09:00:00Z', '2026-11-01', 60],
    ['2026-01-01T00:30:00Z', '2025-12-31', 990], ['2026-07-01T07:00:00Z', '2026-07-01', 0],
  ];
  for (const [instant, dateKey, minutes] of cases) { const result = m.schoolClock(new Date(instant)); assert.equal(result.dateKey, dateKey); assert.equal(result.minutes, minutes); }
  assert.throws(() => m.schoolClock(new Date('bad')), /Invalid clock/);
  assert.throws(() => m.schoolClock('2026-01-01'), /Invalid clock/);
  assert.equal(m.timezone, 'America/Los_Angeles');
});

test('primary calendar validates real dates, reversals, names, and conflicting overrides', () => {
  const { MVHSSchedule: m } = core();
  for (const days of [{ invalid: 'regular' }, { '02302026-03012026': 'none' }, { '02292025-03012025': 'none' }, { '03022026-03012026': 'none' }]) assert.throws(() => m.parseCalendar(days, week));
  for (const map of [null, [], [...week.slice(0, 6), ''], [...week.slice(0, 6), 'bad\u0000']]) assert.throws(() => m.parseCalendar({}, map));
  const calendar = m.parseCalendar({ '02292024-02292024': 'none', '10262026-10262026': 'regular', '10262026-10272026': 'special' }, week);
  assert.equal(m.chooseSchedule(calendar, '2024-02-29').noSchool, true);
  assert.throws(() => m.chooseSchedule(calendar, '2026-10-26'), /conflicting/);
  assert.throws(() => m.chooseSchedule(calendar, '2026-02-30'), /Invalid schedule date/);
  const same = m.parseCalendar({ '10262026-10262026': 'regular', '10262026-10272026': 'regular' }, week);
  assert.equal(m.chooseSchedule(same, '2026-10-26').special, true);
});

test('primary bell periods reject malformed ranges, invalid labels, overlaps, and empty data', () => {
  const { MVHSSchedule: m } = core();
  for (const raw of [null, [], {}, { '2400-2500': 1 }, { '0860-0900': 1 }, { '0900-0800': 1 }, { '0800-0800': 1 }, { '0800-0900': 21 }, { '0800-0900': -1 }, { '0800-0900': 1.5 }, { '0800-0900': {} }, { '0800-0900': '' }, { '0800-0900': 1, '0859-1000': 2 }]) assert.throws(() => m.parsePeriods(raw));
  const actual = m.parsePeriods({ '0910-1010': 'Period 02A', '0800-0900': 1 });
  assert.deepEqual(plain(actual.map(slot => [slot.start, slot.end, slot.period])), [[480, 540, '1'], [550, 610, '2A']]);
  assert.equal(m.periodNumber('p: 00'), '0'); assert.equal(m.periodNumber('Period 21'), null);
  assert.equal(m.formatTime(0), '12:00 AM'); assert.equal(m.formatTime(720), '12:00 PM'); assert.equal(m.formatTime(1439), '11:59 PM');
});

test('bell boundary state distinguishes before, current, gap, break, ended, and no school', () => {
  const { MVHSSchedule: m } = core(), slots = m.parsePeriods(periods);
  const checks = [[479, 'before', null, '1'], [480, 'current', '1', '2'], [539.99, 'current', '1', '2'], [540, 'gap', null, '2'], [550, 'current', '2', null], [610, 'current', null, null], [620, 'current', null, null], [640, 'ended', null, null]];
  for (const [minute, phase, current, nextPeriod] of checks) { const state = m.stateFor(slots, minute); assert.equal(state.phase, phase); assert.equal(state.current?.period ?? null, current); assert.equal(state.nextClass?.period ?? null, nextPeriod); }
  assert.equal(m.stateFor(slots, 610).nextClass.label, 'Tutorial');
  assert.equal(m.stateFor(slots, 539.99).remainingMinutes, 1);
  assert.equal(m.stateFor(slots, 540).untilNextMinutes, 10);
  assert.equal(m.stateFor([], 480).phase, 'none');
  for (const label of ['PSAT', 'SAT testing', 'Assembly', 'Rally', 'Advisory']) assert.equal(m.stateFor(m.parsePeriods({ '0800-0900': label }), 470).nextClass.label, label);
  assert.equal(m.stateFor(m.parsePeriods({ '0800-0900': 'Lunch' }), 470).nextClass, null);
});

test('next school day skips known closures and weekends, includes day fourteen, and respects DST', () => {
  const api = core(), m = api.MVHSSchedule;
  const data = snapshot(api);
  assert.equal(m.nextSchoolDay(data, '2026-03-06').startsAt, Date.parse('2026-03-09T15:00:00Z'));
  assert.equal(m.nextSchoolDay(data, '2026-10-30').startsAt, Date.parse('2026-11-02T16:00:00Z'));
  const holiday = snapshot(api, { '11022026-11022026': 'none' });
  assert.equal(m.nextSchoolDay(holiday, '2026-10-30').dateKey, '2026-11-03');
  const allClosed = snapshot(api, {}, Array(7).fill('none'), {});
  assert.equal(m.nextSchoolDay(allClosed, '2026-01-05'), null);
  const fourteenth = snapshot(api, { '01192026-01192026': 'regular' }, Array(7).fill('none'));
  assert.equal(m.nextSchoolDay(fourteenth, '2026-01-05').dateKey, '2026-01-19');
  const fifteenth = snapshot(api, { '01202026-01202026': 'regular' }, Array(7).fill('none'));
  assert.equal(m.nextSchoolDay(fifteenth, '2026-01-05'), null);
  assert.equal(m.dayFor(allClosed, '2026-01-05').periods.length, 0);
});

test('unavailable unrelated schedules preserve today; an uncertain future day stops prediction', () => {
  const api = core(), m = api.MVHSSchedule;
  const data = snapshot(api, { '01012025-01012025': 'missing', '10272026-10272026': 'broken' }, week, { regular: periods, broken: { '0900-0800': 1 } });
  assert.equal(m.dayFor(data, '2026-10-26').periods.length, 4);
  assert.throws(() => m.dayFor(data, '2025-01-01'), /unavailable|supplied/);
  assert.throws(() => m.dayFor(data, '2026-10-27'), /Invalid MVHS bell period/);
  assert.throws(() => m.nextSchoolDay(data, '2026-10-26'), /Invalid MVHS bell period/);
  const conflict = snapshot(api, { '10272026-10272026': 'none', '10272026-10282026': 'regular' });
  assert.throws(() => m.nextSchoolDay(conflict, '2026-10-26'), /conflicting/);
  assert.throws(() => m.snapshot({}, week, null), /unavailable/);
});

test('Bell.plus snapshots enforce identity, calendar grammar, bounded correction, and sorted events', () => {
  const { BellPlusSchedule: b } = core();
  for (const change of [{ meta: null }, { meta: { name: 'Other School' } }, { correction: '60001' }, { correction: '-60001' }, { correction: '1.5' }, { correction: Infinity }, { correction: null }, { calendar: '* Default Week\nMon regular' }, { calendar: '* Other\nMon regular' }, { schedules: '* regular\n25:00 Free' }, { schedules: '* regular\n8:00 A\n8:00 B' }, { schedules: '* regular\n8:00 A\n* regular\n9:00 B' }, { schedules: '* regular\n8:00 A\u0000' }]) assert.throws(() => b.snapshot({ ...bellRaw(), ...change }));
  assert.equal(b.snapshot({ ...bellRaw(), correction: -60000 }).correctionMs, -60000);
  assert.equal(b.snapshot({ ...bellRaw(), correction: '+60000' }).correctionMs, 60000);
  assert.throws(() => b.snapshot(bellRaw('02/30/2026 none')), /verified/);
  assert.throws(() => b.snapshot(bellRaw('10/27/2026-10/26/2026 none')), /verified/);
});

test('Bell.plus converts event gaps, keeps period suffixes, and requires complete primary agreement', () => {
  const api = core(), b = api.BellPlusSchedule;
  const data = b.snapshot(bellRaw()), day = b.dayFor(data, '2026-10-26'), primary = api.MVHSSchedule.dayFor(snapshot(api), '2026-10-26');
  assert.equal(b.agrees(day, primary), true);
  assert.equal(b.dayFor(data, '2026-10-25').noSchool, true);
  assert.equal(b.agrees({ ...day, dateKey: '2026-10-27' }, primary), false);
  assert.equal(b.agrees({ ...day, periods: day.periods.slice(1) }, primary), false);
  assert.equal(b.agrees({ ...day, periods: day.periods.map((slot, i) => i ? slot : { ...slot, end: 539 }) }, primary), false);
  assert.equal(b.agrees({ ...day, periods: day.periods.map((slot, i) => i ? slot : { ...slot, period: '1A' }) }, primary), false);
  const suffix = b.snapshot({ ...bellRaw(), schedules: '* regular\n08:00 {Period 2}/Assembly A\n09:00 Free\n* none' });
  assert.equal(b.dayFor(suffix, '2026-10-26').periods[0].period, '2A');
  assert.throws(() => b.dayFor(b.snapshot(bellRaw('10/27/2026 none\n10/27/2026-10/28/2026 regular')), '2026-10-27'), /verified/);
  assert.throws(() => b.dayFor(b.snapshot({ ...bellRaw(), schedules: '* regular\n08:00 {Period 1}\n* none' }), '2026-10-26'), /verified/);
});

function setupSchedule(h, date = '2026-10-26T15:30:00Z') {
  h.setTime(Date.parse(date));
  h.context.primaryFixture = { days: {}, map: week, schedules: { regular: periods } };
  h.context.bellFixture = bellRaw();
  h.run(`scheduleData=MVHSSchedule.snapshot(primaryFixture.days,primaryFixture.map,primaryFixture.schedules);
    scheduleFetchedAt=Date.now();scheduleFetchedDate=MVHSSchedule.schoolClock().dateKey;
    bellPlusData=BellPlusSchedule.snapshot(bellFixture);bellPlusClock={offsetMs:0,wallAt:Date.now(),monoAt:performance.now()};
    bellPlusFetchedAt=Date.now();bellPlusFetchedDate=scheduleFetchedDate;`);
}
test('seconds require fresh same-date data, stable clocks, matching today and future schedules', () => {
  const h = browserHarness(true); setupSchedule(h);
  const verify = () => plain(h.run(`(()=>{const day=MVHSSchedule.dayFor(scheduleData,scheduleFetchedDate),state=MVHSSchedule.stateFor(day.periods,MVHSSchedule.schoolClock().minutes);return verifiedBellSeconds(day,state,Date.now(),null);})()`));
  assert.equal(verify().verified, true);
  setupSchedule(h, '2026-10-26T15:59:30Z'); h.run('bellPlusClock.offsetMs=31000;');
  assert.match(verify().status, /Bell timing differs/);
  setupSchedule(h); h.run("bellPlusFetchedDate='2026-10-25';"); assert.equal(verify().verified, false);
  setupSchedule(h); h.run('bellPlusFetchedAt-=300000;'); assert.equal(verify().verified, false);
  setupSchedule(h); h.run('bellPlusClock.monoAt+=1500;'); assert.equal(verify().verified, false);
  setupSchedule(h); h.run('bellPlusFetchedAt+=1;'); assert.equal(verify().verified, false);
  setupSchedule(h); h.run('bellPlusData.schedules.regular[0].start+=1;'); assert.match(verify().status, /Schedules differ/);
  setupSchedule(h, '2026-10-26T22:00:00Z');
  h.run(`bellPlusData.calendar.overrides.push({start:'2026-10-27',end:'2026-10-27',name:'none'});`);
  assert.match(h.run(`(()=>{const day=MVHSSchedule.dayFor(scheduleData,scheduleFetchedDate);return verifiedBellSeconds(day,MVHSSchedule.stateFor(day.periods,MVHSSchedule.schoolClock().minutes),Date.now(),MVHSSchedule.nextSchoolDay(scheduleData,scheduleFetchedDate)).status;})()`), /Next-day schedules differ/);
  setupSchedule(h, '2026-10-25T19:00:00Z');
  assert.equal(h.run(`(()=>{const day=MVHSSchedule.dayFor(scheduleData,scheduleFetchedDate);return verifiedBellSeconds(day,MVHSSchedule.stateFor(day.periods,720),Date.now(),MVHSSchedule.nextSchoolDay(scheduleData,scheduleFetchedDate)).verified;})()`), true);
});

test('countdowns round minutes safely, include seconds only when verified, and handle multi-day targets', () => {
  const h = browserHarness(true), root = new Element('div');
  for (const key of ['current', 'next', 'upcoming']) root.append(new Element('span', null, { 'data-ap-countdown': key }));
  h.context.countdownRoot = root; h.run('scheduleRoot=countdownRoot;');
  h.context.testState = { current: { end: 540 }, nextClass: { start: 550 }, remainingMinutes: 1, untilNextMinutes: 11 };
  h.context.testNow = Date.parse('2026-10-26T16:59:59.900Z');
  h.run('updateBellCountdowns(testState,{verified:false}, {startsAt:testNow+90061000},testNow);');
  assert.equal(root.children[0].textContent, '1 min remaining');
  assert.equal(root.children[1].textContent, 'in 11 min');
  assert.equal(root.children[2].textContent, 'in 1 day 1 hr 2 min');
  h.run('updateBellCountdowns(testState,{verified:true,minutes:539+59.9/60,nowMs:testNow},{startsAt:testNow+90061000},testNow);');
  assert.equal(root.children[0].textContent, '0 min 01 sec remaining');
  assert.equal(root.children[1].textContent, 'in 10 min 01 sec');
  assert.equal(root.children[2].textContent, 'in 1 day 1 hr 1 min 01 sec');
  h.run('updateBellCountdowns(testState,{verified:true,minutes:550,nowMs:testNow},{startsAt:testNow-1},testNow);');
  assert.equal(root.children[0].textContent, '0 min 00 sec remaining');
  assert.equal(root.children[2].textContent, 'in 0 min 00 sec');
});

test('valid current-day UI survives a future schedule error without inventing a later class', () => {
  const h = browserHarness(true); setupSchedule(h, '2026-10-26T22:00:00Z');
  const container = new Element('section'), card = new Element('article'); h.body.append(container); container.append(card);
  card.getClientRects = () => [1]; card.closest = selector => selector === '.classesSection' ? container : null;
  h.context.cards.push({ element: card, key: 'synthetic', title: 'Example course', schedulePeriod: '1' });
  h.run("scheduleData.calendar.overrides.push({start:'2026-10-27',end:'2026-10-27',name:'missing'});refreshSchedule();");
  const host = container.children.find(child => child.attributes.id === 'ap-next-class');
  assert.match(host.shadowRoot.textContent, /School day finished/);
  assert.match(host.shadowRoot.textContent, /Next school day unavailable/);
  assert.equal(host.shadowRoot.querySelector('[data-ap-countdown="upcoming"]'), null);
  assert.match(host.shadowRoot.textContent, /Today’s full bell schedule/);
  assert.doesNotMatch(host.shadowRoot.textContent, /No upcoming class listed/);
  h.document.hidden = true; h.run('refreshSchedule();'); assert.equal(h.timers.size, 0);
  h.document.hidden = false; h.document.emit('visibilitychange'); assert.equal(h.timers.size, 1);
  h.context.db.settings.nextClass = false; h.run('refreshSchedule();'); assert.equal(host.isConnected, false); assert.equal(h.timers.size, 0);
});

// Player tests drive the actual closure through its browser-facing events.
test('KBAR remains unloaded until interaction, uses fixed privacy-enhanced embed, and close tears down', () => {
  const h = browserHarness(); assert.equal(h.frame(), undefined); assert.equal(h.timers.size, 0);
  h.context.db.settings.enabled = false; h.context.media.toggle(); assert.equal(h.frame(), undefined);
  h.context.db.settings.enabled = true; h.context.media.toggle();
  const frame = h.frame(), url = new URL(frame.src);
  assert.equal(url.origin, 'https://www.youtube-nocookie.com'); assert.equal(url.pathname, '/embed/sasjlpt7zWM');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['autoplay', 'controls', 'enablejsapi', 'loop', 'origin', 'playlist', 'playsinline', 'rel']);
  assert.equal(url.searchParams.get('origin'), 'https://mvla.aeries.net'); assert.equal(url.searchParams.get('autoplay'), '0');
  assert.equal(url.searchParams.get('loop'), '1'); assert.equal(url.searchParams.get('playlist'), 'sasjlpt7zWM');
  assert.match(h.body.children[0].style.cssText, /position:fixed;left:-10000px/);
  assert.equal(h.body.children[0].inert, true); assert.equal(h.body.children[0].attributes['aria-hidden'], 'true');
  const fallback = h.body.children[0].shadowRoot.querySelector('a');
  assert.equal(fallback.attributes.href, 'https://www.youtube.com/watch?v=sasjlpt7zWM');
  assert.equal(fallback.attributes.rel, 'noopener noreferrer'); assert.equal(fallback.attributes.referrerpolicy, 'no-referrer');
  h.context.media.destroy(); assert.equal(frame.isConnected, false); assert.equal(h.timers.size, 0); assert.equal(h.window.listeners.get('message').size, 0);
});

test('KBAR handshake and rapid toggles keep the latest user intent and acknowledge paused states', () => {
  const h = browserHarness(); h.context.media.toggle();
  h.context.media.toggle(); // Pause before ready.
  h.receive({ event: 'onReady' }); assert.equal(h.commands().at(-1), 'pauseVideo');
  h.receive({ event: 'onStateChange', info: -1 }); assert.match(h.status(), /Paused/);
  h.context.media.toggle(); assert.equal(h.commands().at(-1), 'playVideo');
  h.receive({ event: 'onStateChange', info: 2 }); assert.match(h.status(), /Starting/); // Stale pause.
  h.receive({ event: 'onStateChange', info: 1 }); assert.match(h.status(), /Playing/);
  h.context.media.toggle(); h.receive({ event: 'onStateChange', info: 1 }); assert.equal(h.commands().at(-1), 'pauseVideo');
  h.receive({ event: 'onStateChange', info: 2 }); assert.match(h.status(), /Paused/);
  assert.ok(h.frame().isConnected); assert.equal(h.timers.size, 0);
  h.context.media.toggle(); h.receive({ event: 'onStateChange', info: 3 }); assert.match(h.status(), /Buffering/);
  h.receive({ event: 'onStateChange', info: 1 }); h.receive({ event: 'onStateChange', info: 0 }); assert.match(h.status(), /Looping/);
});

test('KBAR rejects wrong-window, wrong-origin, oversized, malformed, non-string, and non-object messages', () => {
  const h = browserHarness(); h.context.media.toggle();
  for (const extra of [{ source: {} }, { origin: 'https://www.youtube.com' }, { origin: 'https://www.youtube-nocookie.com.invalid' }, { data: { event: 'onReady' } }, { data: ' '.repeat(65537) }, { data: '{bad' }, { data: '[]' }, { data: 'null' }]) h.receive({ event: 'onReady' }, extra);
  assert.deepEqual(h.commands(), []); assert.equal(h.timers.size, 2);
  h.receive({ event: 'initialDelivery' }); assert.equal(h.commands().at(-1), 'playVideo');
  for (const message of h.frame().contentWindow.messages) assert.equal(message.origin, 'https://www.youtube-nocookie.com');
  h.receive({ event: 'onStateChange', info: '1' }); assert.match(h.status(), /Starting/);
});

test('late playing events cannot reverse a playback timeout, autoplay block, or user pause', () => {
  for (const cause of ['timeout', 'autoplay', 'pause']) {
    const h = browserHarness(); h.context.media.toggle(); h.receive({ event: 'onReady' });
    if (cause === 'timeout') h.fireTimer(10000);
    else if (cause === 'autoplay') h.receive({ event: 'onAutoplayBlocked' });
    else { h.receive({ event: 'onStateChange', info: 1 }); h.context.media.toggle(); h.receive({ event: 'onStateChange', info: 2 }); }
    const status = h.status(); h.receive({ event: 'onStateChange', info: 1 });
    assert.equal(h.commands().at(-1), 'pauseVideo', cause); assert.equal(h.status(), status, cause);
    h.context.media.toggle(); assert.equal(h.commands().at(-1), 'playVideo', cause);
  }
});

test('KBAR errors retain useful status, cancel pending playback deadlines, and recreate on retry', () => {
  for (const code of [2, 5, 100, 101, 150, 153, 999, 'toString']) {
    const h = browserHarness(); h.context.media.toggle(); h.receive({ event: 'onReady' });
    const old = h.frame(); h.receive({ event: 'onError', info: code });
    assert.match(h.status(), /Try again or open it on YouTube/); assert.doesNotMatch(h.status(), /function/); assert.equal(h.timers.size, 0);
    h.receive({ event: 'onStateChange', info: 1 }); assert.equal(h.commands().at(-1), 'pauseVideo');
    h.context.media.toggle(); assert.notEqual(h.frame(), old); assert.equal(old.isConnected, false);
    h.context.media.destroy();
  }
  const h = browserHarness(); h.context.media.toggle(); h.receive({ event: 'onReady' });
  h.frame().emit('error'); const status = h.status();
  assert.equal(h.timers.size, 0); h.fireTimer(10000); assert.equal(h.status(), status);
});

test('loading/offline failure is bounded, late readiness remains paused, and destroyed instances are ignored', () => {
  const h = browserHarness(); h.context.media.toggle(); h.fireTimer(500);
  assert.equal(h.frame().contentWindow.messages.at(-1).data.event, 'listening');
  h.fireTimer(15000); assert.match(h.status(), /taking too long/); assert.equal(h.timers.size, 0);
  h.receive({ event: 'onStateChange', info: 1 }); assert.equal(h.commands().at(-1), 'pauseVideo');
  h.receive({ event: 'onReady' }); assert.equal(h.commands().at(-1), 'pauseVideo');
  h.receive({ event: 'onStateChange', info: 5 }); assert.match(h.status(), /Paused/);
  const oldWindow = h.frame().contentWindow; h.context.media.destroy();
  h.context.media.toggle(); h.receive({ event: 'onReady' }, { source: oldWindow }); assert.deepEqual(h.commands(), []);
  h.window.emit('offline'); h.window.emit('online'); assert.deepEqual(h.commands(), []); // No automatic retry/play on connectivity events.
  h.window.emit('pagehide'); assert.equal(h.frame(), undefined); assert.equal(h.timers.size, 0);
});

test('visible Settings controls expose loading, play, pause, failure, retry and stopped states', () => {
  const h = browserHarness(), { control, status } = visibleControls(h);
  assert.equal(control.textContent, 'Play KBAR (P)'); assert.equal(status.textContent, 'KBAR is stopped.');
  h.context.media.toggle(); assert.equal(control.textContent, 'Pause KBAR (P)'); assert.match(status.textContent, /Loading/);
  h.receive({ event: 'onReady' }); assert.match(status.textContent, /Starting/);
  h.receive({ event: 'onStateChange', info: 1 }); assert.match(status.textContent, /Playing/);
  h.context.media.toggle(); assert.match(status.textContent, /Pausing/); h.receive({ event: 'onStateChange', info: 2 }); assert.match(status.textContent, /Paused/);
  h.receive({ event: 'onError', info: 100 }); assert.equal(control.textContent, 'Retry KBAR (P)'); assert.match(status.textContent, /unavailable/);
  h.context.media.destroy(); assert.equal(control.attributes['aria-pressed'], 'false'); assert.equal(status.textContent, 'KBAR is stopped.');
  h.context.db.settings.enabled = false; h.context.media.reconcile(); assert.equal(control.disabled, true);
  assert.match(source, /musicStatus\.setAttribute\('role','status'\)/);
  assert.match(source, /musicStatus\.setAttribute\('aria-live','polite'\)/);
});

test('master pause and externally removed frames unload KBAR and clear all timers', () => {
  const h = browserHarness(); h.context.media.toggle(); h.context.db.settings.enabled = false; h.context.media.reconcile();
  assert.equal(h.frame(), undefined); assert.equal(h.timers.size, 0);
  h.context.db.settings.enabled = true; h.context.media.toggle(); const old = h.frame(); old.parent.parent.parent.remove(); h.context.media.reconcile();
  assert.equal(h.frame(), undefined); assert.equal(h.timers.size, 0);
  h.context.media.toggle(); assert.notEqual(h.frame(), old);
});

test('P shortcuts ignore editable/shadow controls, composition, modifiers, repeats and open dialog', () => {
  const h = browserHarness();
  for (const extra of [{ defaultPrevented: true }, { isComposing: true }, { repeat: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { key: 's' }]) h.document.emit('keydown', keyEvent(undefined, extra));
  for (const tag of ['input', 'textarea', 'select']) h.document.emit('keydown', keyEvent(new Element(tag)));
  for (const role of ['textbox', 'combobox', 'searchbox', 'spinbutton', 'slider']) h.document.emit('keydown', keyEvent(new Element('div', null, { role })));
  const editable = new Element('div'); editable.isContentEditable = true; h.document.emit('keydown', keyEvent(editable));
  h.setFocus(new Element('input')); h.document.emit('keydown', keyEvent()); h.setFocus(null);
  h.document.emit('keydown', keyEvent(undefined, { composedPath: () => [new Element('input'), new Element('div')] }));
  h.context.dialog.open = true; h.document.emit('keydown', keyEvent()); h.context.dialog.open = false;
  h.context.db.settings.enabled = false; h.document.emit('keydown', keyEvent()); h.context.db.settings.enabled = true;
  assert.equal(h.frame(), undefined);
  const play = keyEvent(undefined, { key: 'P', shiftKey: true }); h.document.emit('keydown', play);
  assert.equal(play.defaultPrevented, true); assert.ok(h.frame());
});

test('schedule loaders suppress duplicates, record success, back off errors, and ignore invalidated work', async () => {
  const h = browserHarness(true), calls = [];
  let resolvePrimary;
  h.context.primaryRequest = path => { calls.push(path); return new Promise(resolve => { if (path === 'days') resolvePrimary = resolve; else resolve(path === 'weekday-map' ? week : { regular: periods }); }); };
  h.run('requestMVHSPublic=primaryRequest;loadMVHSSchedule();loadMVHSSchedule();');
  assert.deepEqual(calls, ['days', 'weekday-map', 'schedules']); assert.equal(h.run('schedulePending'), true);
  resolvePrimary({ '01012025-01012025': 'missing' }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.run('schedulePending'), false); assert.equal(h.run('scheduleFetchedDate'), '2026-10-26');
  assert.equal(h.run('scheduleData.schedules.regular.length'), 4); assert.equal(h.run('scheduleRetryAt'), 0);
  h.context.primaryRequest = path => Promise.resolve(path === 'days' ? {} : path === 'weekday-map' ? week : { regular: {} });
  h.run('requestMVHSPublic=primaryRequest;loadMVHSSchedule();'); await new Promise(resolve => setImmediate(resolve));
  assert.match(h.run('scheduleError'), /unavailable/); assert.equal(h.run('scheduleRetryAt-Date.now()'), 60000);
  h.context.primaryRequest = () => Promise.reject(new Error('Synthetic offline failure'));
  h.run('requestMVHSPublic=primaryRequest;loadMVHSSchedule();'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.run('schedulePending'), false); assert.equal(h.run('scheduleError'), 'Synthetic offline failure');
  assert.equal(h.run('scheduleRetryAt-Date.now()'), 60000);
  h.context.primaryRequest = path => new Promise(resolve => { if (path === 'days') resolvePrimary = resolve; else resolve(path === 'weekday-map' ? week : { regular: periods }); });
  h.run('requestMVHSPublic=primaryRequest;loadMVHSSchedule();abortScheduleRequests();');
  resolvePrimary({}); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.run('scheduleData'), null); assert.equal(h.run('schedulePending'), false); assert.equal(h.run('scheduleError'), '');
  h.context.db.settings.scheduleNetworkConsent = false; h.run('loadMVHSSchedule();'); assert.equal(h.run('schedulePending'), false);
});

test('secondary loader pairs clock and schedule, rejects malformed feeds, and drops late results', async () => {
  const h = browserHarness(true), calls = [];
  h.context.secondaryRequest = kind => { calls.push(kind); return Promise.resolve(bellRaw()); };
  h.context.clockRequest = () => { calls.push('clock'); return Promise.resolve({ offsetMs: 0, wallAt: h.run('Date.now()'), monoAt: h.run('performance.now()') }); };
  h.run('requestBellPlus=secondaryRequest;requestBellPlusClock=clockRequest;loadBellPlusSchedule();loadBellPlusSchedule();');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, ['schedule', 'clock']); assert.equal(h.run('bellPlusPending'), false);
  assert.equal(h.run('bellPlusFetchedDate'), '2026-10-26'); assert.equal(h.run('bellPlusIsFresh(Date.now(),bellPlusFetchedDate)'), true);
  h.context.secondaryRequest = () => Promise.resolve({ ...bellRaw(), meta: null });
  h.run('requestBellPlus=secondaryRequest;loadBellPlusSchedule();'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.run('bellPlusData'), null); assert.equal(h.run('bellPlusClock'), null); assert.match(h.run('bellPlusError'), /could not be verified/);
  assert.equal(h.run('bellPlusRetryAt-Date.now()'), 60000);
  let resolveSecondary;
  h.context.secondaryRequest = () => new Promise(resolve => { resolveSecondary = resolve; });
  h.run('requestBellPlus=secondaryRequest;loadBellPlusSchedule();abortScheduleRequests();');
  resolveSecondary(bellRaw()); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.run('bellPlusData'), null); assert.equal(h.run('bellPlusPending'), false);
  h.context.db.settings.enabled = false; h.run('loadBellPlusSchedule();'); assert.equal(h.run('bellPlusPending'), false);
});

test('missing or stale primary data displays loading or retry instead of a countdown', () => {
  const h = browserHarness(true), container = new Element('section'), card = new Element('article');
  h.body.append(container); container.append(card); card.getClientRects = () => [1]; card.closest = () => container;
  h.context.cards.push({ element: card, key: 'synthetic', title: 'Example course', schedulePeriod: '1' });
  h.run('schedulePending=true;bellPlusPending=true;refreshSchedule();');
  let root = container.children.find(child => child.attributes.id === 'ap-next-class').shadowRoot;
  assert.match(root.textContent, /Loading MVHS schedule/); assert.equal(root.querySelector('[data-ap-countdown="next"]'), null);
  h.run("schedulePending=false;scheduleError='Synthetic offline failure';scheduleRetryAt=Date.now()+60000;refreshSchedule();");
  assert.match(root.textContent, /Schedule unavailable/); assert.match(root.textContent, /Synthetic offline failure/);
  const retry = root.querySelector('button'); assert.equal(retry.textContent, 'Retry schedule');
  let attempts = 0; h.context.startPrimary = () => { attempts++; }; h.context.startSecondary = () => {};
  h.run('loadMVHSSchedule=startPrimary;loadBellPlusSchedule=startSecondary;'); retry.emit('click');
  assert.equal(attempts, 1); assert.equal(h.run('scheduleRetryAt'), 0);
  setupSchedule(h); h.run('scheduleFetchedAt-=300000;scheduleRetryAt=Date.now()+60000;refreshSchedule();');
  root = container.children.find(child => child.attributes.id === 'ap-next-class').shadowRoot;
  assert.match(root.textContent, /Schedule unavailable/); assert.equal(root.querySelector('[data-ap-countdown="current"]'), null);
});
