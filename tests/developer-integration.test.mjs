import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync(process.env.AP_INTEGRATION_SOURCE || new URL('../aeries-playground.user.js', import.meta.url), 'utf8');
const first = source.indexOf('  const trendPredictionEntries=new Map();');
const last = source.indexOf('  function restoreTitle(', first);
assert.ok(first >= 0 && last > first);

function fixture() {
  const settings = { enabled: true, trendPredictions: true };
  const icons = [];
  const context = vm.createContext({ db: { settings },
    document: { querySelectorAll: () => icons },
    el(tag, text, attrs) {
      return { textContent: text, attrs: { ...attrs }, parentElement: null, previousSibling: null,
        getAttribute(name) { return this.attrs[name] ?? null; },
        setAttribute(name, value) { this.attrs[name] = value; },
        remove() { this.parentElement = null; this.previousSibling = null; } };
    } });
  const helpersStart=source.indexOf('  function bonusCutoff('),helpersEnd=source.indexOf('  function cutoffs(',helpersStart);
  assert.ok(helpersStart>=0&&helpersEnd>helpersStart);
  vm.runInContext(source.slice(helpersStart,helpersEnd)+source.slice(first, last) + '\nglobalThis.api={parseTrendForecast,refreshTrendPredictions,clearTrendPredictions,trendPredictionEntries};', context);
  function icon(attributes = {}) {
    const parent = { querySelectorAll: () => [node] };
    const node = { attributes: { ...attributes }, parentElement: parent,
      getAttribute(name) { return this.attributes[name] ?? null; },
      closest(selector) { return selector === 'a.gradebook-trend-click-hint' ? parent : null; },
      after(badge) { badge.parentElement = parent; badge.previousSibling = this; } };
    icons.push(node);
    return node;
  }
  return { ...context.api, settings, icons, icon };
}

test('native forecasts retain exact displayed precision and ignore the comparison percentage', () => {
  const { parseTrendForecast } = fixture();
  const forecast = parseTrendForecast('Forecasted value of 97.123450% compared with 80.2%');
  assert.equal(forecast.label, '97.123450%');
  assert.equal(forecast.value, 97.12345);
  for (const input of ['', 'Average 85%', 'Forecasted value of NaN%', 'Forecasted value of Infinity%', 'Forecasted value of 1e3%', 'Forecasted value of 90%garbage', null]) {
    assert.equal(parseTrendForecast(input), null);
  }
});

test('forecast badges update, disappear on conflicting tooltips, and return after ambiguity clears', () => {
  const f = fixture();
  const icon = f.icon({ title: 'Forecasted value of 90.25% compared with 85%' });
  f.refreshTrendPredictions();
  const original = f.trendPredictionEntries.get(icon).badge;
  assert.equal(original.textContent, 'Predicted: 90.25%');
  icon.attributes.title = 'Forecasted value of 92.125%';
  f.refreshTrendPredictions();
  assert.equal(f.trendPredictionEntries.get(icon).badge, original);
  assert.equal(original.textContent, 'Predicted: 92.125%');
  icon.attributes['data-original-title'] = 'Forecasted value of 93%';
  f.refreshTrendPredictions();
  assert.equal(f.trendPredictionEntries.size, 0);
  assert.equal(original.parentElement, null);
  delete icon.attributes.title;
  f.refreshTrendPredictions();
  assert.equal(f.trendPredictionEntries.get(icon).badge.textContent, 'Predicted: 93%');
});

test('forecast decorations clean up on disabled settings, detached icons, and page departure', () => {
  const f = fixture();
  const icon = f.icon({ title: 'Forecasted value of 100%' });
  f.refreshTrendPredictions();
  f.settings.trendPredictions = false;
  f.refreshTrendPredictions();
  assert.equal(f.trendPredictionEntries.size, 0);
  f.settings.trendPredictions = true;
  f.refreshTrendPredictions();
  assert.equal(f.trendPredictionEntries.size, 1);
  f.icons.length = 0;
  f.refreshTrendPredictions();
  assert.equal(f.trendPredictionEntries.size, 0);
  f.icons.push(icon);
  f.refreshTrendPredictions();
  const badge = f.trendPredictionEntries.get(icon).badge;
  f.clearTrendPredictions();
  assert.equal(badge.parentElement, null);
  assert.equal(f.trendPredictionEntries.size, 0);
  f.settings.enabled = false;
  f.refreshTrendPredictions();
  assert.equal(f.trendPredictionEntries.size, 0);
});

test('forecast bonus color follows the strict percentage threshold and the dashboard color preference', () => {
  const f=fixture();
  Object.assign(f.settings,{dashboardColors:true,bonusPercentCutoff:100,bonusColor:'#7c3aed'});
  const icon=f.icon({title:'Forecasted value of 100%'});
  f.refreshTrendPredictions();
  const badge=f.trendPredictionEntries.get(icon).badge;
  assert.doesNotMatch(badge.getAttribute('style')||'',/#7c3aed/i);
  icon.attributes.title='Forecasted value of 100.001%';f.refreshTrendPredictions();
  assert.match(badge.getAttribute('style'),/#7c3aed/i);
  f.settings.bonusColor='#9234ab';f.refreshTrendPredictions();
  assert.match(badge.getAttribute('style'),/#9234ab/i);
  f.settings.bonusPercentCutoff=101;f.refreshTrendPredictions();
  assert.doesNotMatch(badge.getAttribute('style'),/#9234ab/i);
  f.settings.bonusPercentCutoff=100;f.settings.dashboardColors=false;f.refreshTrendPredictions();
  assert.doesNotMatch(badge.getAttribute('style'),/#9234ab|#7c3aed/i);
});

test('tooltip mutations schedule a refresh while unrelated title changes remain irrelevant', () => {
  const start = source.indexOf('  function pageMutationRelevant(');
  const end = source.indexOf('  const observer=new MutationObserver(', start);
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({ Node: { ELEMENT_NODE: 1 } });
  vm.runInContext(source.slice(start, end) + '\nglobalThis.relevant=pageMutationRelevant;', context);
  const ordinary = { nodeType: 1, closest: () => null, matches: () => false, querySelector: () => null };
  const icon = { ...ordinary, matches: selector => selector.includes('img[class*=') };
  assert.equal(context.relevant({ type: 'attributes', attributeName: 'title', target: icon }), true);
  assert.equal(context.relevant({ type: 'attributes', attributeName: 'title', target: ordinary }), false);
  const formerIcon = { ...ordinary, nextElementSibling: { matches: selector => selector === '[data-ap-owned="trend-prediction"]' } };
  assert.equal(context.relevant({ type: 'attributes', attributeName: 'class', target: formerIcon }), true);
});
