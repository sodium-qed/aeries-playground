import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { setImmediate as nextTurn } from 'node:timers/promises';
import test from 'node:test';

// Every fixture is invented. Execute the repository's actual transport and
// local-control helpers with a fake manager; never contact a public service.
const source = readFileSync(process.env.AERIES_AUDIT_SOURCE || new URL('../aeries-playground.user.js', import.meta.url), 'utf8');

function between(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Source markers remain available: ${start}`);
  return source.slice(first, last);
}

const transportSource = between('let scheduleHost = null', 'function bellPlusIsFresh(')
  + between('function requestMVHSPublic(path)', 'function removeSchedule()');
// Loader integration uses the actual primary parser, including its required-day
// validation. Keep only the wall date fixed so tests never depend on today's feed.
const primarySchedule = runInNewContext(between('const MVHSSchedule = (() => {', '// END MVHSSchedule') + '\nMVHSSchedule');

function transport(options = {}) {
  let timerId = 0;
  const timers = new Map(), requests = [], clock = { wall: 100000, mono: 1000 };
  let refreshes = 0;
  const db = { settings: { enabled: true, nextClass: true, scheduleNetworkConsent: true, ...options.settings } };
  let api;
  const context = {
    db,
    Date: class extends Date { static now() { return clock.wall; } },
    performance: { now: () => clock.mono },
    MVHSSchedule: { ...primarySchedule, schoolClock: () => ({ dateKey: '2026-10-26' }) },
    BellPlusSchedule: { snapshot: (raw) => ({ raw }) },
    refreshSchedule() { refreshes++; },
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  if (!options.missingManager) context.GM_xmlhttpRequest = (details) => {
    const request = { details, aborts: 0 };
    requests.push(request);
    if (options.startError) throw new Error('Invented manager startup error');
    options.onStart?.(details, () => api);
    return { abort() {
      request.aborts++;
      if (options.abortError) throw new Error('Invented manager abort error');
      if (options.abortCallback) details.onabort();
    } };
  };
  api = runInNewContext(`${transportSource}\n({
    requestScheduleJSON, requestBellPlus, requestMVHSPublic, abortScheduleRequests,
    requestBellPlusClock, loadBellPlusSchedule, loadMVHSSchedule,
    state: () => ({ active: activeScheduleRequests.size, generation: scheduleRequestGeneration,
      scheduleData, schedulePending, bellPlusData, bellPlusClock, bellPlusPending,
      scheduleFetchedAt, bellPlusFetchedAt, scheduleFetchedDate, bellPlusFetchedDate,
      scheduleRetryAt, bellPlusRetryAt, scheduleError, bellPlusError }),
    prime: () => { scheduleData={invented:true}; schedulePending=true; scheduleFetchedAt=10; scheduleFetchedDate='2026-10-26';
      bellPlusData={invented:true}; bellPlusClock={invented:true}; bellPlusPending=true; bellPlusFetchedAt=10; bellPlusFetchedDate='2026-10-26'; }
  })`, context);
  return { ...api, db, requests, timers, clock, refreshCount: () => refreshes, fireTimer(id) {
    const timer = timers.get(id);
    assert.ok(timer, 'Expected a live watchdog');
    timers.delete(id); timer.fn();
  } };
}

function complete(request, overrides = {}) {
  request.details.onload({ status: 200, finalUrl: request.details.url, responseText: '{"invented":true}', ...overrides });
}

function completeLoader(request, overrides = {}) {
  let data = { invented: true };
  if (request.details.url.endsWith('/days.json')) data = {};
  else if (request.details.url.endsWith('/weekday-map.json')) data = ['none', 'regular', 'regular', 'regular', 'regular', 'regular', 'none'];
  else if (request.details.url.endsWith('/schedules.json')) data = { regular: { '0800-0900': 1 } };
  else if (request.details.data) data = { id: JSON.parse(request.details.data).id, result: 100000 };
  complete(request, { responseText: JSON.stringify(data), ...overrides });
}

test('metadata keeps the limited page, explicit grants/hosts, and manual updates', () => {
  const header = between('// ==UserScript==', '// ==/UserScript==');
  const values = (name) => [...header.matchAll(new RegExp(`^// @${name}[ \\t]+(.+)$`, 'gm'))].map((match) => match[1].trim());
  assert.deepEqual(values('match'), ['https://mvla.aeries.net/student/*']);
  assert.match(header, /^\/\/ @noframes\s*$/m);
  assert.deepEqual(values('grant').sort(), ['GM_getValue', 'GM_registerMenuCommand', 'GM_setValue', 'GM_xmlhttpRequest']);
  assert.deepEqual(values('connect').sort(), ['bell.plus', 'mvhs-app-d04d2.firebaseio.com']);
  assert.deepEqual(values('downloadURL'), ['none']);
  assert.deepEqual(values('require'), []);
  assert.deepEqual(values('updateURL'), []);
});

test('schedule transport requires enabled feature and explicit consent for every start', async () => {
  for (const settings of [{ enabled: false }, { nextClass: false }, { scheduleNetworkConsent: false }, { scheduleNetworkConsent: undefined }]) {
    const h = transport({ settings });
    await assert.rejects(h.requestScheduleJSON('days'), /access is off/);
    await assert.rejects(h.requestBellPlus('schedule'), /access is off/);
    await assert.rejects(h.requestMVHSPublic('days'), /access is off/);
    assert.equal(h.requests.length, 0);
    assert.equal(h.timers.size, 0);
  }
});

test('only named endpoints and a bounded public clock ID can reach the manager', async () => {
  const h = transport();
  for (const kind of ['https://example.invalid/', '__proto__', 'constructor', 'toString', '', null, {}]) {
    await assert.rejects(h.requestScheduleJSON(kind), /Unrecognized public schedule request/);
  }
  for (const id of [undefined, null, 'invented-student', 'aeries-clock-1\n', 'aeries-clock-12345678901234567', 123]) {
    await assert.rejects(h.requestScheduleJSON('bellClock', id), /Invalid public clock request/);
  }
  await assert.rejects(h.requestScheduleJSON('days', 'aeries-clock-1'), /Invalid public clock request/);
  await assert.rejects(h.requestBellPlus('__proto__'), /Unrecognized bell.plus request/);
  await assert.rejects(h.requestMVHSPublic('bellClock'), /Unrecognized MVHS schedule request/);
  assert.equal(h.requests.length, 0);
  assert.equal(h.timers.size, 0);
});

test('all five requests contain only fixed public destinations and public payloads', async () => {
  const h = transport();
  const expected = [
    ['days', 'https://mvhs-app-d04d2.firebaseio.com/days.json', 15000],
    ['weekday-map', 'https://mvhs-app-d04d2.firebaseio.com/weekday-map.json', 15000],
    ['schedules', 'https://mvhs-app-d04d2.firebaseio.com/schedules.json', 15000],
    ['bellSchedule', 'https://bell.plus/api/data/mvhs', 10000],
    ['bellClock', 'https://bell.plus/timesync', 10000],
  ];
  for (const [kind, url, timeout] of expected) {
    const clock = kind === 'bellClock', bell = kind.startsWith('bell');
    const pending = h.requestScheduleJSON(kind, clock ? 'aeries-clock-12345' : undefined);
    const request = h.requests.at(-1), details = request.details;
    assert.equal(details.url, url);
    assert.equal(details.method, clock ? 'POST' : 'GET');
    assert.equal(details.anonymous, true);
    assert.equal(details.redirect, 'error');
    assert.equal(details.timeout, timeout);
    assert.equal(details.headers.Accept, 'application/json');
    assert.equal(details.headers.Referer, bell ? 'https://bell.plus/mvhs' : 'https://mvhs.io/');
    assert.equal(details.headers['Content-Type'], clock ? 'application/json' : undefined);
    if (clock) assert.deepEqual(JSON.parse(details.data), { jsonrpc: '2.0', id: 'aeries-clock-12345', method: 'timesync' });
    else assert.equal(details.data, undefined);
    for (const key of ['user', 'password', 'cookie', 'context']) assert.equal(details[key], undefined);
    complete(request);
    assert.equal((await pending).invented, true);
    assert.equal(h.state().active, 0);
    assert.equal(h.timers.size, 0);
  }
});

test('response validation rejects unexpected status, redirects, malformed JSON and oversized data', async () => {
  const invalid = [
    { status: 201 }, { status: '200' }, { finalUrl: undefined },
    { finalUrl: 'https://example.invalid/' },
    { finalUrl: 'https://mvhs-app-d04d2.firebaseio.com/days.json?extra=1' },
    { responseText: {} }, { responseText: 'not JSON' },
    { responseText: '"' + 'x'.repeat(199999) + '"' },
  ];
  for (const response of invalid) {
    const h = transport();
    const rejected = assert.rejects(h.requestScheduleJSON('days'), /unreadable or unexpected/);
    complete(h.requests[0], response);
    await rejected;
    assert.equal(h.state().active, 0);
    assert.equal(h.timers.size, 0);
  }
  const h = transport();
  const pending = h.requestScheduleJSON('days');
  complete(h.requests[0], { responseText: '"' + 'x'.repeat(199998) + '"' });
  assert.equal((await pending).length, 199998);
});

test('local watchdog rejects stalled Firebase and bell.plus requests and attempts abort', async () => {
  for (const [kind, timeout] of [['days', 15000], ['bellSchedule', 10000]]) {
    const h = transport({ abortCallback: true });
    const rejected = assert.rejects(h.requestScheduleJSON(kind), /timed out/);
    assert.equal(h.timers.size, 1, 'A manager timeout option alone does not settle a stalled request');
    const [id, timer] = [...h.timers][0];
    assert.equal(timer.ms, timeout);
    h.fireTimer(id);
    await rejected;
    assert.equal(h.requests[0].aborts, 1);
    assert.equal(h.state().active, 0);
    assert.equal(h.timers.size, 0);
    complete(h.requests[0]);
    h.requests[0].details.onerror();
    assert.equal(h.state().active, 0);
  }
});

test('abort failure cannot prevent timeout settlement or make a late callback usable', async () => {
  const h = transport({ abortError: true });
  const rejected = assert.rejects(h.requestScheduleJSON('days'), /timed out/);
  assert.equal(h.timers.size, 1);
  h.fireTimer([...h.timers.keys()][0]);
  await rejected;
  complete(h.requests[0]);
  assert.equal(h.requests[0].aborts, 1);
  assert.equal(h.state().active, 0);
});

test('revoke clears caches and all requests; restoring consent cannot revive old responses', async () => {
  const h = transport({ abortError: true });
  h.prime();
  const first = assert.rejects(h.requestScheduleJSON('days'), /canceled/);
  const second = assert.rejects(h.requestBellPlus('schedule'), /canceled/);
  h.db.settings.scheduleNetworkConsent = false;
  h.abortScheduleRequests();
  await Promise.all([first, second]);
  assert.equal(h.timers.size, 0);
  assert.equal(h.state().active, 0);
  assert.equal(h.state().generation, 1);
  for (const key of ['scheduleData', 'bellPlusData', 'bellPlusClock']) assert.equal(h.state()[key], null);
  for (const key of ['schedulePending', 'bellPlusPending']) assert.equal(h.state()[key], false);
  for (const request of h.requests) assert.equal(request.aborts, 1);
  h.db.settings.scheduleNetworkConsent = true;
  const next = h.requestScheduleJSON('days');
  complete(h.requests[0]); complete(h.requests[1]);
  assert.equal(h.state().active, 1);
  complete(h.requests[2]);
  assert.equal((await next).invented, true);
  assert.equal(h.state().active, 0);
  assert.equal(h.timers.size, 0);
});

test('a response checks consent again even when explicit cancellation was missed', async () => {
  const h = transport();
  const rejected = assert.rejects(h.requestScheduleJSON('days'), /canceled/);
  h.db.settings.nextClass = false;
  complete(h.requests[0]);
  await rejected;
  assert.equal(h.state().active, 0);
  assert.equal(h.timers.size, 0);
});

test('manager failures and synchronous completion clean up watchdogs', async () => {
  for (const options of [{ missingManager: true }, { startError: true }]) {
    const h = transport(options);
    await assert.rejects(h.requestScheduleJSON('days'), /permission|Could not start/);
    assert.equal(h.state().active, 0);
    assert.equal(h.timers.size, 0);
  }
  for (const callback of ['onerror', 'ontimeout', 'onabort']) {
    const h = transport();
    const rejected = assert.rejects(h.requestScheduleJSON('days'), /reach|timed out|interrupted/);
    h.requests[0].details[callback]();
    await rejected;
    assert.equal(h.state().active, 0);
    assert.equal(h.timers.size, 0);
  }
  const h = transport({ onStart(details) { details.onload({ status: 200, finalUrl: details.url, responseText: '{"invented":true}' }); } });
  assert.equal((await h.requestScheduleJSON('days')).invented, true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.requests[0].aborts, 0);
});

test('cancellation before a manager returns still aborts the eventual handle', async () => {
  const h = transport({ onStart(_details, getApi) { getApi().abortScheduleRequests(); } });
  await assert.rejects(h.requestScheduleJSON('days'), /canceled/);
  assert.equal(h.requests[0].aborts, 1);
  assert.equal(h.state().active, 0);
  assert.equal(h.timers.size, 0);
});

test('clock verification binds the response ID and accepts a short stable round trip', async () => {
  const h = transport();
  const pending = h.requestBellPlusClock();
  const id = JSON.parse(h.requests[0].details.data).id;
  h.clock.wall += 500; h.clock.mono += 500;
  complete(h.requests[0], { responseText: JSON.stringify({ id, result: 100250 }) });
  const result = await pending;
  assert.equal(result.offsetMs, 0);
  assert.equal(result.wallAt, 100500);
  assert.equal(result.monoAt, 1500);
});

test('clock verification rejects unmatched IDs, errors, invalid results, slow trips and clock jumps', async () => {
  const cases = [
    { response: { id: 'another-invented-request' } },
    { response: { error: { code: -1 } } },
    { response: { result: 100000.5 } },
    { response: { result: '100000' } },
    { response: { result: Number.MAX_SAFE_INTEGER + 1 } },
    { mono: -1 }, { wall: 2001, mono: 2001 },
    { wall: 1000, mono: 500 },
    { response: { result: 160001 } },
  ];
  for (const c of cases) {
    const h = transport();
    const rejected = assert.rejects(h.requestBellPlusClock(), /could not be verified|clocks disagree/);
    const id = JSON.parse(h.requests[0].details.data).id;
    h.clock.wall += c.wall ?? 0; h.clock.mono += c.mono ?? 0;
    complete(h.requests[0], { responseText: JSON.stringify({ id, result: 100000, ...c.response }) });
    await rejected;
    assert.equal(h.timers.size, 0);
  }
});

test('revocation after responses resolve still discards queued schedule-cache updates', async () => {
  for (const load of ['loadMVHSSchedule', 'loadBellPlusSchedule']) {
    const h = transport();
    h[load]();
    for (const request of h.requests) completeLoader(request);
    h.db.settings.scheduleNetworkConsent = false;
    h.abortScheduleRequests();
    await nextTurn();
    for (const key of ['scheduleData', 'bellPlusData', 'bellPlusClock']) assert.equal(h.state()[key], null);
    assert.equal(h.state().schedulePending, false);
    assert.equal(h.state().bellPlusPending, false);
    assert.equal(h.refreshCount(), 0);
    assert.equal(h.timers.size, 0);
  }
});

test('older request completion cannot clear a new generation pending state', async () => {
  for (const load of ['loadMVHSSchedule', 'loadBellPlusSchedule']) {
    const h = transport();
    h[load]();
    const old = [...h.requests];
    h.abortScheduleRequests();
    h[load]();
    for (const request of old) complete(request);
    await nextTurn();
    assert.equal(h.state()[load === 'loadMVHSSchedule' ? 'schedulePending' : 'bellPlusPending'], true);
    assert.equal(h.refreshCount(), 0);
    for (const request of h.requests.slice(old.length)) completeLoader(request);
    await nextTurn();
    assert.equal(h.state()[load === 'loadMVHSSchedule' ? 'schedulePending' : 'bellPlusPending'], false);
    assert.ok(h.state()[load === 'loadMVHSSchedule' ? 'scheduleData' : 'bellPlusData']);
    assert.equal(h.refreshCount(), 1);
    assert.equal(h.timers.size, 0);
  }
});

test('a parsed response with an unavailable requested day is not cached as successful', async () => {
  const h = transport();
  h.loadMVHSSchedule();
  for (const request of h.requests) {
    completeLoader(request, request.details.url.endsWith('/days.json')
      ? { responseText: JSON.stringify({ '10262026-10262026': 'missing' }) } : {});
  }
  await nextTurn();
  assert.equal(h.state().scheduleData, null);
  assert.equal(h.state().schedulePending, false);
  assert.equal(h.state().scheduleRetryAt, h.clock.wall + 60000);
  assert.ok(h.state().scheduleError);
  assert.equal(h.refreshCount(), 1);
  assert.equal(h.timers.size, 0);
});

test('watchdog failure releases loader pending state and imposes the retry delay', async () => {
  for (const load of ['loadMVHSSchedule', 'loadBellPlusSchedule']) {
    const h = transport();
    h[load]();
    assert.ok(h.timers.size > 0);
    for (const id of [...h.timers.keys()]) h.fireTimer(id);
    await nextTurn();
    const prefix = load === 'loadMVHSSchedule' ? 'schedule' : 'bellPlus';
    assert.equal(h.state()[prefix + 'Pending'], false);
    assert.equal(h.state()[prefix + 'RetryAt'], h.clock.wall + 60000);
    assert.match(h.state()[prefix + 'Error'], /timed out/);
    assert.equal(h.refreshCount(), 1);
    assert.equal(h.state().active, 0);
  }
});

test('local controls use text nodes, detached form ownership and non-submit buttons', () => {
  const elements = [];
  const document = { createElement(tag) {
    const node = { tag, attributes: {}, events: {}, setAttribute(key, value) { this.attributes[key] = value; }, addEventListener(type, fn) { this.events[type] = fn; } };
    Object.defineProperty(node, 'innerHTML', { set() { throw new Error('HTML interpolation is forbidden'); } });
    elements.push(node); return node;
  } };
  const api = runInNewContext(between('  function el(tag, text, attrs = {})', '  function courseDefaults(title)') + '\n({el,button,input})', { document });
  const invented = '<img src=x onerror="throw 1"> & <script>throw 2</script>';
  const display = api.el('span', invented, { title: invented });
  assert.equal(display.textContent, invented);
  assert.equal(display.attributes.title, invented);
  for (const tag of ['input', 'select', 'button', 'textarea']) assert.equal(api.el(tag).attributes.form, 'ap-playground-local-controls');
  const control = api.button(invented, () => {});
  assert.equal(control.attributes.type, 'button');
  assert.equal(control.textContent, invented);
  assert.equal(api.input(invented).value, invented);
});

test('inline hypothetical inputs stop page handlers and Enter form submission', () => {
  const listeners = new Map();
  const api = runInNewContext(between('  function labContain(node)', '  function applyLabActionTypography') + '\nlabContain', {});
  api({ addEventListener(type, fn) { listeners.set(type, fn); } });
  for (const type of ['click', 'dblclick', 'input', 'change', 'keyup', 'keypress', 'pointerdown', 'keydown']) {
    let stopped = 0, prevented = 0;
    listeners.get(type)({ key: 'Enter', target: { matches: () => true }, stopPropagation() { stopped++; }, preventDefault() { prevented++; } });
    assert.equal(stopped, 1, type);
    assert.equal(prevented, type === 'keydown' ? 1 : 0, type);
  }
});
