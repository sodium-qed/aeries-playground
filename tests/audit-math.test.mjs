import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// Exercise the production calculation/adaptation modules without running the
// userscript's page, storage, or networking initialization. All data is fictional.
const source = readFileSync(process.env.AP_MATH_SOURCE || new URL('../aeries-playground.user.js', import.meta.url), 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Source boundaries exist: ${start}`);
  return source.slice(first, last);
}
const context = vm.createContext({ URL, CourseSchedule: { detect: () => '2' } });
vm.runInContext(section('const GradeMath = (() => {', '  // Period-to-course matching stays local;') +
  section('  function buildWeightEntries(', '  let weightMapState=') +
  '\nglobalThis.audit = { GradeMath, GradeDOM, buildWeightEntries, layoutWeightCircles };', context);
const { GradeMath: math, GradeDOM: dom, buildWeightEntries, layoutWeightCircles } = context.audit;
const plain = value => JSON.parse(JSON.stringify(value));
const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} should be within ${tolerance} of ${expected}`);
const assignment = (id, earned, possible = 100, category = 'Work', extra = {}) =>
  ({ id, name: `Assignment ${id}`, category, earned, possible, included: true, ...extra });
const postedRules = (earned = 130, possible = 150, officialText = '86.67%') => {
  const grade = dom.parseGrade(officialText);
  return { mode: 'points', weights: {}, categories: [{ name: 'Work', earned, possible }],
    official: grade.value, officialUnit: grade.unit, officialDecimals: grade.decimals };
};

// These small fixtures implement only the DOM operations used by each adapter.
// They intentionally contain no real account/student records or network access.
function node(text = '', extra = {}) {
  const base = { nodeType: 1, tagName: 'SPAN', textContent: text,
    closest: () => null, matches: () => false, querySelectorAll: () => [], querySelector: () => null,
    contains(other) { return this === other || this.children.some(child => child.contains?.(other)); },
    getAttribute: () => null, childNodes: [{ nodeType: 3, nodeValue: text, textContent: text }], children: [],
    cloneNode() { return node(this.textContent, { tagName: this.tagName }); } };
  return Object.assign(base, extra);
}
function precisionAssignment(score = '14.67 / 15', percent = '97.78%', extra = {}) {
  const date = node('Date Assigned:', { nextSibling: { nodeType: 3, textContent: ' 10/01/2026 ', nextSibling: null } });
  const row = node('', { querySelectorAll: selector => selector === '.details-title,.TextSubSection' ? [date] : [],
    querySelector: selector => selector === '[id$="_tdPerc"]' ? node(percent) : null });
  return assignment('aeries:1', 14.67, 15, 'Work', { name: 'Synthetic fractions', status: 'graded',
    dueDate: '2026-10-02', sourceRow: row, sourceRows: [row], sourceCell: node(score), ...extra });
}
function precisionScores(earned = 14.66666666666667, percentText = '97.8') {
  return new Map([[JSON.stringify(['1', 'Synthetic fractions', 'Work', '2026-10-01', '2026-10-02']),
    { number: '1', earned, percent: Number(percentText), percentText }]]);
}
function recentPage(records, extra = {}) {
  const course = node('', { value: '10_Fall_x_20', selectedOptions: [node('2 - Synthetic Algebra - Fall')] });
  const page = { querySelector: selector => selector === 'select[id$="_dlGN"]' ? course : null,
    querySelectorAll(selector) {
      const match = selector.match(/^input\[id="ctl00_(SC|SN|PID)"\]$/);
      if (match) return [{ value: { SC: '20', SN: '30', PID: '40' }[match[1]] }];
      return selector === 'script:not([src])' ? [node(`const RecentData = ${JSON.stringify(records)};`)] : [];
    } };
  return Object.assign(page, extra);
}
function genericTable(headers, data) {
  const table = node('', { tagName: 'TABLE' });
  const row = (values, tagName) => node(values.join(' '), { children: values.map(value => node(value, { tagName, colSpan: 1, rowSpan: 1 })),
    closest: selector => selector === 'table' ? table : null });
  const rows = [row(headers, 'TH'), ...data.map(values => row(values, 'TD'))];
  table.querySelectorAll = selector => selector === 'tr' ? rows : [];
  const root = { querySelectorAll: selector => selector === 'table' ? [table] : [] };
  return { root, table, rows };
}
const classRecord = () => ({ Section: 'Classes', STUSC: '20', STUSN: '30', Title: 'Synthetic Algebra', Details: '40^',
  PageURL: '/student/Redirect?SC=20&SN=30&ReturnPage=' + encodeURIComponent('/Widgets/ClassSummary/RedirectToGradebook?GradebookNumber=10&Term=Fall&SC=20') });
const scoreRecord = (extra = {}) => ({ Section: 'RecentAssignments', STUSC: '20', STUSN: '30', Title: '1 Synthetic fractions',
  Details: '40^10/01/2026^10/02/2026^Synthetic Algebra^Work^14.66666666666667^97.8', ...extra });

test('numeric parsing and formatting preserve blanks, zeros, finite decimals, and fractional scores', () => {
  for (const value of ['', ' ', '1e2', '1,000', 'Infinity', 'NaN', undefined, null, Infinity, NaN, {}, []]) {
    assert.equal(math.parseNumber(value), null, String(value));
  }
  for (const [text, expected] of [['0', 0], ['.5', .5], ['+2.5', 2.5], ['3.', 3], ['-2', -2], ['14.66666666666667', 14.66666666666667]]) {
    assert.equal(math.parseNumber(text), expected);
  }
  assert.equal(math.format(14.66666666666667, 12), '14.666666666667');
  assert.equal(math.format(-0.0001, 2), '0');
  assert.equal(math.format(null), '—');
  assert.equal(math.format(Infinity), '—');
});

test('raw conversion truncates exact decimal inputs only at the final hundredth', () => {
  for (const [earned, total, points, expected] of [[2, 3, 10, 6.66], ['0.58', '1', '50', 29], ['.5', '1.', 3, 1.5],
    [0, 10, 5, 0], [12, 10, 20, 24], [1e21, 1e21, 10, 10], [1e-7, 1e-7, 1, 1], [1, 1, 1e308, 1e308]]) {
    const result = math.convertRawScore(earned, total, points);
    assert.equal(result.error, null); assert.equal(result.earned, expected);
  }
  for (const args of [[-1, 3, 10], ['', 3, 10], [1, 0, 10], [1, 3, 0], [Infinity, 3, 10], [1e308, .01, 1e308]]) {
    assert.notEqual(math.convertRawScore(...args).error, null);
  }
});

test('counted zeros, blank scores, and excluded invalid rows remain distinct', () => {
  const base = assignment('a', 8, 10);
  near(math.calculate([base, assignment('b', null, 10)]).value, 80);
  near(math.calculate([base, assignment('b', 0, 10)]).value, 40);
  near(math.calculate([base, assignment('b', 'bad', null, 'Work', { included: false })]).value, 80);
  assert.equal(math.calculate([assignment('blank', null, 10)]).value, null);
  for (const bad of [assignment('b', -1, 10), assignment('b', '', 10), assignment('b', Infinity, 10),
    assignment('b', 1, 0), assignment('b', 1, NaN), assignment('b', 1, Infinity)]) {
    assert.ok(math.calculate([base, bad]).error);
  }
  assert.ok(math.calculate([base, { ...base, included: false }]).error);
  assert.ok(math.calculate([null]).error);
  assert.ok(math.calculate('invalid').error);
});

test('points and weighted math renormalize only scored categories and preserve zero-weight totals', () => {
  const rows = [assignment('h', 90, 100, 'Homework'), assignment('q', 40, 50, 'Quizzes'), assignment('f', null, 100, 'Final')];
  near(math.calculate(rows).value, 130 / 150 * 100);
  const rules = { mode: 'weighted', weights: { Homework: 20, Quizzes: 30, Final: 50 } };
  const result = math.calculate(rows, rules);
  near(result.value, 84); assert.equal(result.usedCount, 2); assert.equal(result.totalPossible, 150);
  near(math.calculate(rows, { ...rules, weights: { Homework: 0, Quizzes: 100 } }).value, 80);
  assert.equal(math.calculate(rows, { ...rules, weights: { Homework: 0, Quizzes: 0 } }).value, null);
  for (const weights of [{ Homework: 20 }, { Homework: -1, Quizzes: 30 }, { Homework: NaN, Quizzes: 30 },
    { Homework: Infinity, Quizzes: 30 }, { Homework: 1e308, Quizzes: 1e308 }]) {
    assert.ok(math.calculate(rows, { ...rules, weights }).error);
  }
  assert.ok(math.calculate(rows, { mode: 'unknown' }).error);
  assert.ok(math.calculate(rows, null).error);
  assert.ok(math.calculate([assignment('a', 1e308, 1), assignment('b', 1e308, 1)]).error);
  assert.ok(math.calculate([assignment('a', 1, 1e308), assignment('b', 1, 1e308)]).error);
  assert.ok(math.calculate([assignment('a', 1e308, 1e-308)]).error);
  assert.ok(math.calculate([assignment('a', 1, 100)], { scoreFloor: 1e308 }).error);
});

test('replacements use original sources, enforce caps/conflicts, and precede score limits', () => {
  const rows = [assignment('a', 100), assignment('b', 50), assignment('c', 0)];
  const rules = { replacements: [{ sourceId: 'a', targetId: 'b' }, { sourceId: 'b', targetId: 'c' }] };
  const result = math.calculate(rows, rules);
  assert.deepEqual(plain(result.effectiveAssignments.map(row => row.earned)), [100, 100, 50]);
  assert.deepEqual(plain(math.calculate(rows, { replacements: [...rules.replacements].reverse() }).effectiveAssignments.map(row => row.earned)), [100, 100, 50]);
  const capped = math.calculate([assignment('source', 100), assignment('target', 20, 50)], {
    replacements: [{ sourceId: 'source', targetId: 'target', capPercent: 70 }], scoreFloor: 80 });
  assert.equal(capped.appliedReplacements[0].newEarned, 35);
  assert.equal(capped.effectiveAssignments[1].earned, 40);
  near(math.calculate([assignment('a', 1, 10), assignment('b', 12, 10)], { scoreFloor: 50, scoreCeiling: 100 }).value, 75);
  assert.ok(math.calculate(rows, { scoreFloor: 80, scoreCeiling: 70 }).error);
  for (const replacements of [[{ sourceId: 'a', targetId: 'a' }], [{ sourceId: 'missing', targetId: 'b' }],
    [{ sourceId: 'a', targetId: 'b', capPercent: -1 }], [{ sourceId: 'a', targetId: 'b', onlyIfHigher: 'yes' }],
    [{ sourceId: 'a', targetId: 'c' }, { sourceId: 'b', targetId: 'c', onlyIfHigher: false }]]) {
    assert.ok(math.calculate(rows, { replacements }).error);
  }
});

test('rounding applies in the displayed unit with stable decimal boundaries', () => {
  assert.equal(math.roundPercent(89.5, { rounding: 'nearest', roundingDecimals: 0 }), 90);
  near(math.roundPercent(1.005, { rounding: 'nearest', roundingDecimals: 2 }), 1.01);
  near(math.roundPercent(87.499, { averageMaximum: 4, rounding: 'nearest', roundingDecimals: 1 }), 87.5);
  near(math.roundPercent(86.67, { rounding: 'down', roundingDecimals: 0 }), 86);
  near(math.roundPercent(86.01, { rounding: 'up', roundingDecimals: 0 }), 87);
  assert.equal(math.roundPercent(86.67, { rounding: 'none' }), 86.67);
  for (const rules of [{ rounding: '' }, { rounding: 'nearest', roundingDecimals: -1 },
    { rounding: 'up', roundingDecimals: .5 }, { rounding: 'down', roundingDecimals: 2, averageMaximum: 0 }]) {
    assert.equal(math.roundPercent(86.67, rules), null);
  }
});

test('target search and simultaneous ranges agree with exhaustive finite score grids', () => {
  const rows = [assignment('h', 90, 100, 'Homework'), assignment('q', 40, 50, 'Quizzes'), assignment('t', null, 100, 'Tests')];
  for (const rules of [{}, { replacements: [{ sourceId: 't', targetId: 'q' }] },
    { mode: 'weighted', weights: { Homework: 20, Quizzes: 30, Tests: 50 }, scoreFloor: 40, scoreCeiling: 100 },
    { rounding: 'nearest', roundingDecimals: 0 }]) {
    for (const target of [0, 80, 85, 90, 100, 120]) {
      const candidates = Array.from({ length: 101 }, (_, earned) => ({ earned,
        value: math.roundPercent(math.calculate(rows.map(row => row.id === 't' ? { ...row, earned } : row), rules).value, rules) }));
      const expected = candidates.find(candidate => candidate.value >= target - 1e-10);
      const result = math.solveTarget(rows, rules, { assignmentId: 't', target, maximumEarned: 100, step: 1 });
      assert.equal(result.status, expected ? 'solved' : 'unreachable');
      assert.equal(result.earned, expected?.earned ?? 100);
    }
    const ranges = math.calculateRanges(rows, rules, [{ assignmentId: 'q', lowEarned: 30, highEarned: 40 }, { assignmentId: 't', lowEarned: 80, highEarned: 90 }]);
    const values = [];
    for (let q = 30; q <= 40; q++) for (let t = 80; t <= 90; t++) {
      values.push(math.roundPercent(math.calculate(rows.map(row => row.id === 'q' ? { ...row, earned: q } : row.id === 't' ? { ...row, earned: t } : row), rules).value, rules));
    }
    near(ranges.lowValue, Math.min(...values)); near(ranges.highValue, Math.max(...values));
  }
  assert.equal(math.solveTarget([assignment('a', null, 10)], {}, { assignmentId: 'a', target: 100, maximumEarned: 10, step: 3 }).status, 'unreachable');
  assert.equal(math.solveTarget([assignment('a', null)], { rounding: 'nearest', roundingDecimals: 0 }, { assignmentId: 'a', target: 90, maximumEarned: 100, step: .1 }).earned, 89.5);
  assert.ok(math.calculateRange(rows, {}, { assignmentId: 't', lowEarned: 90, highEarned: 80 }).error);
  assert.ok(math.calculateRanges(rows, {}, [{ assignmentId: 't', lowEarned: 80, highEarned: 90 }, { assignmentId: 't', lowEarned: 80, highEarned: 90 }]).error);
  assert.ok(math.solveTarget(rows, {}, { assignmentId: 't', target: 90, maximumEarned: 100, step: 1e-20 }).error);
  for (const options of [null, [], {}, { assignmentId: 'missing', target: 90, maximumEarned: 100, step: 1 },
    { assignmentId: 't', target: NaN, maximumEarned: 100, step: 1 }, { assignmentId: 't', target: 90, maximumEarned: Infinity, step: 1 },
    { assignmentId: 't', target: 90, maximumEarned: 100, step: 0 }]) assert.ok(math.solveTarget(rows, {}, options).error);
  for (const options of [null, [], [null], [{ assignmentId: 'missing', lowEarned: 1, highEarned: 2 }],
    [{ assignmentId: 't', lowEarned: NaN, highEarned: 2 }], [{ assignmentId: 't', lowEarned: 1, highEarned: Infinity }]]) {
    assert.ok(math.calculateRanges(rows, {}, options).error);
  }
});

test('impacts retain unrounded leave-one-out semantics including replacements and weighted renormalization', () => {
  const rows = [assignment('a', 90), assignment('b', 40, 50), assignment('blank', null), assignment('excluded', 0, 100, 'Work', { included: false })];
  const result = math.impacts(rows, { rounding: 'nearest', roundingDecimals: 0 });
  near(result[0].delta, 130 / 150 * 100 - 80); near(result[1].delta, 130 / 150 * 100 - 90);
  assert.equal(result[2].delta, null); assert.equal(result[3].delta, null);
  assert.equal(math.impacts([rows[0]])[0].delta, null);
  const replacements = [{ sourceId: 'source', targetId: 'target' }];
  near(math.impacts([assignment('source', 100), assignment('target', 20)], { replacements })[0].delta, 80);
  near(math.impacts([assignment('a', 100, 100, 'A'), assignment('b', 0, 100, 'B')], { mode: 'weighted', weights: { A: 10, B: 90 } })[0].delta, 10);
});

test('posted percentage reconciliation respects visible decimals and rejects genuinely different totals', () => {
  const rows = [assignment('a', 90), assignment('b', 40, 50)];
  for (const label of ['86.67%', '86.7%', '87%']) {
    const result = math.fromAeries(rows, postedRules(130, 150, label));
    assert.equal(result.error, null, label);
    near(result.result.value, 130 / 150 * 100);
  }
  for (const label of ['86.6%', '86%', '88%', '90.00%']) {
    assert.ok(math.fromAeries(rows, postedRules(130, 150, label)).error, label);
  }
  assert.ok(math.fromAeries(rows, postedRules(129, 150, '87%')).error);
  assert.ok(math.fromAeries(rows, postedRules(130, 151, '87%')).error);
  assert.ok(math.fromAeries(rows, postedRules(), { partial: true }).error);
});

test('reconciliation honors explicit final rounding while retaining raw math for impacts', () => {
  const rows = [assignment('a', 86.1)];
  for (const [rounding, official] of [['up', '87%'], ['down', '86%'], ['nearest', '86%']]) {
    const rules = { ...postedRules(86.1, 100, official), rounding, roundingDecimals: 0 };
    const result = math.fromAeries(rows, rules);
    assert.equal(result.error, null, rounding);
    near(result.result.value, 86.1);
    assert.equal(result.model.rules.rounding, rounding);
    assert.equal(result.model.rules.roundingDecimals, 0);
  }
  assert.ok(math.fromAeries(rows, { ...postedRules(86.1, 100, '87%'), rounding: 'down', roundingDecimals: 0 }).error);
  assert.ok(math.fromAeries(rows, { ...postedRules(86.1, 100, '86%'), rounding: 'nearest', roundingDecimals: -1 }).error);
});

test('average reconciliation and empty previews reject nonfinite, missing, and extra category data', () => {
  const row = assignment('a', 3.5, 4);
  const rules = { mode: 'points', averageMaximum: 4, weights: {}, categories: [{ name: 'Work', grade: 3.5, unit: 'average', decimals: 1 }],
    official: 3.5, officialUnit: 'average', officialDecimals: 1 };
  assert.equal(math.fromAeries([row], rules).error, null);
  for (const grade of [undefined, null, NaN, Infinity, 3.4]) {
    assert.ok(math.fromAeries([row], { ...rules, categories: [{ ...rules.categories[0], grade }] }).error, String(grade));
  }
  assert.ok(math.fromAeries([row], { ...rules, categories: [{ ...rules.categories[0], decimals: NaN, grade: 2 }] }).error);
  assert.ok(math.fromAeries([row], { ...rules, official: 2, officialDecimals: NaN }).error);
  assert.ok(math.fromAeries([row], { ...rules, categories: [{ ...rules.categories[0], name: 'Other' }] }).error);
  const blank = assignment('blank', null, 10, 'Work', { included: false, status: 'ungraded' });
  assert.equal(math.fromAeries([blank], postedRules(0, 0, '0%'), { allowEmpty: true }).error, null);
  assert.ok(math.fromAeries([blank], postedRules(0, 0, '1%'), { allowEmpty: true }).error);
  assert.ok(math.fromAeries([blank], postedRules(0, 0, '0%')).error);
  assert.ok(math.fromAeries(null, rules).error);
  assert.ok(math.fromAeries([null], rules).error);
  assert.ok(math.fromAeries([row], rules, null).error);
  assert.ok(math.fromAeries([row], { ...rules, categories: [null] }).error);
  for (const averageMaximum of [0, -1, NaN, Infinity, 'invalid']) assert.ok(math.fromAeries([row], { ...rules, averageMaximum }).error);
});

test('generic table parsing retains numeric equivalents, blanks, excluded rows, and explicit zeroes', () => {
  const fixture = genericTable(['Assignment', 'Score / Possible', 'Category', 'Status', 'ID'], [
    ['Synthetic zero', '0 / 10', 'Work', 'yes', '1'], ['Synthetic blank', '— / 10', 'Work', '', '2'],
    ['Synthetic equivalent', 'A+ (10) / 10', 'Work', 'yes', '3'], ['Synthetic wrapped equivalent', 'A+ (10 / 10)', 'Work', 'yes', '4'],
    ['Synthetic excused', 'EX / 10', 'Work', 'excused', '5'], ['Missing Angles', '8 / 10', 'Work', 'yes', '6'],
    ['Synthetic grouped numbers', '1,000 / 1,200', 'Work', 'yes', '7'], ['Synthetic same ID', '2 / 10', 'Work', 'yes', '6']]);
  const tables = dom.listTables(fixture.root);
  assert.equal(tables.length, 1);
  assert.equal(tables[0].suggested.earned, tables[0].suggested.possible);
  const result = dom.readTable(tables[0]);
  assert.deepEqual(plain(result.assignments.map(row => [row.earned, row.possible, row.included, row.status])), [
    [0, 10, true, 'graded'], [null, 10, false, 'ungraded'], [10, 10, true, 'graded'], [10, 10, true, 'graded'],
    [null, 10, false, 'excluded'], [8, 10, true, 'graded'], [1000, 1200, true, 'graded'], [2, 10, true, 'graded']]);
  assert.equal(new Set(result.assignments.map(row => row.id)).size, 8);
  assert.ok(result.issues.some(issue => issue.includes('Repeated assignment IDs')));
  assert.ok(dom.readTable(tables[0], { name: -1, earned: 1, possible: 1 }).issues.length);
});

test('native category rules preserve literal property-like names as numeric weights', () => {
  const summary = (name, weight, earned, possible, grade) => node('', { querySelector: selector => {
    const fields = { '[id$="_tdDESC"]': name, '[id$="_tdPctOfGrade"]': weight, '[id$="_tdPTS"]': earned,
      '[id$="_tdMX"]': possible, '[id$="_tdPCT"]': grade };
    return selector in fields ? node(fields[selector]) : null;
  } });
  const root = { querySelector: () => null, querySelectorAll: () => [
    summary('__proto__', '50%', '10', '10', '100%'), summary('Work', '50%', '0', '10', '0%'), summary('Total', '', '10', '20', '50%')] };
  const rules = dom.readAeriesRules(root);
  assert.equal(Object.hasOwn(rules.weights, '__proto__'), true);
  assert.equal(rules.weights.__proto__, 50);
  assert.equal(rules.mode, 'weighted');
  assert.equal(math.fromAeries([assignment('a', 10, 10, '__proto__'), assignment('b', 0, 10)], rules).error, null);
});

test('native score parsing keeps excluded parentheses separate from explicit letter equivalents', () => {
  const doc = { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null };
  const rows = ['0 / 10', '— / 10', '(8 / 10)', 'A+ (10) / 10', 'A+ (10 / 10)', 'EX / 10', '8 / 10'].map((text, index) => {
    const score = node(text, { tagName: 'TD', id: `synthetic_${index}_tdScore` });
    const cells = [node(String(index + 1)), node(`Synthetic ${index + 1}`), node('Work'), score, node('10/02/2026'), node('No')];
    cells.forEach(cell => { cell.tagName = 'TD'; });
    return node('', { children: cells, querySelector: selector => selector === 'td[id$="_tdScore"]' ? score : null });
  });
  const table = node('', { ownerDocument: doc, querySelectorAll: selector => selector === 'tr.assignment-info' ? rows : [] });
  const result = dom.readTable({ element: table, nativeAeries: true, headers: ['#', 'Assignment', 'Category', 'Score', 'Due Date', 'Grading Complete'] });
  assert.deepEqual(plain(result.assignments.map(row => [row.earned, row.possible, row.included, row.status])), [
    [0, 10, true, 'graded'], [null, 10, false, 'ungraded'], [8, 10, false, 'excluded'],
    [10, 10, true, 'graded'], [10, 10, true, 'graded'], [null, 10, false, 'excluded'], [8, 10, true, 'graded']]);
  assert.ok(result.assignments.every(row => row.dueDate === '2026-10-02'));
});

test('dashboard cards read numeric spans while retaining original course names', () => {
  const gradeSpan = node('A- (86.7%)');
  const gradeElement = node('', { querySelectorAll: () => [gradeSpan] });
  const title = node('Visible nickname', { dataset: { apOriginalTitle: 'Synthetic Algebra' }, getAttribute: () => '/Grades?GradebookNumber=10&Term=Fall' });
  const card = node('', { querySelector: selector => ({ ':scope > a.TextHeading': title,
    ':scope > .RightSide > .Grade': gradeElement, ':scope > .Period': node('2') })[selector] ?? null });
  const result = dom.readCards({ querySelectorAll: () => [card] });
  assert.equal(result.length, 1); assert.equal(result[0].title, 'Synthetic Algebra');
  assert.equal(result[0].value, 86.7); assert.equal(result[0].decimals, 1); assert.equal(result[0].schedulePeriod, '2');
  assert.equal(dom.assignmentGrade(precisionAssignment()).value, 97.78);
  const average = precisionAssignment('', '', { scoreUnit: 'average', earned: 3.5, possible: 4 });
  assert.equal(dom.assignmentGrade(average).value, 3.5); assert.equal(dom.assignmentGrade(average).unit, 'average');
});

test('raw metadata requires a named count field and never interprets grading-complete or score columns as raw counts', () => {
  const cell = text => node(text, { tagName: 'TD', contains: other => other === rawCell });
  let rawCell = cell('2 / 3');
  const row = node('', { children: [cell('Synthetic task'), rawCell, cell('6.66 / 10'), cell('No')],
    querySelectorAll: () => [] });
  const result = dom.readRawScoreMetadata(row, ['Assignment', 'Complete', 'Score', 'Grading Complete']);
  assert.equal(result.rawEarned, 2); assert.equal(result.rawPossible, 3); assert.equal(result.rawScoreCells[0], rawCell);
  assert.equal(dom.readRawScoreMetadata(row, ['Assignment', 'Other', 'Score', 'Grading Complete']).rawPossible, null);
  rawCell = cell('— / 3'); row.children[1] = rawCell;
  assert.equal(dom.readRawScoreMetadata(row, ['Assignment', 'Complete', 'Score', 'Grading Complete']).rawEarned, null);
  assert.equal(dom.readRawScoreMetadata(row, ['Assignment', 'Complete', 'Score', 'Grading Complete']).rawPossible, 3);
});

test('grade labels, course identity, due dates, and safe JSON parsing use explicit evidence', () => {
  for (const [text, value, unit, decimals] of [['A- (86.70%)', 86.7, 'percent', 2], ['(3.5 Avg.)', 3.5, 'average', 1], ['0%', 0, 'percent', 0]]) {
    const parsed = dom.parseGrade(text); assert.equal(parsed.value, value); assert.equal(parsed.unit, unit); assert.equal(parsed.decimals, decimals);
  }
  for (const text of ['A', '', '97.8', 'NaN%', 'Infinity%', 'score 10 / 10']) assert.equal(dom.parseGrade(text).value, null);
  assert.equal(dom.parseCourseGrade('3.5', true).unit, 'average');
  assert.equal(dom.parseCourseGrade('3.5', false).value, null);
  assert.equal(dom.courseKey('Name', 'https://example.invalid/Grades?GradebookNumber=12&Term=Fall&_=' + Date.now()),
    dom.courseKey('Other', 'https://example.invalid/Grades?Term=Fall&GradebookNumber=12&random=2'));
  assert.notEqual(dom.courseKey('Name', '', '1'), dom.courseKey('Name', '', '2'));
  assert.equal(dom.parseDueDate('2/29/2024'), '2024-02-29');
  assert.equal(dom.parseDueDate('2026-10-02'), '2026-10-02');
  for (const text of ['2/29/2026', '13/1/2026', '2026-02-30', '10/2/26']) assert.equal(dom.parseDueDate(text), '');
  assert.deepEqual(plain(dom.parseRecentData('const RecentData = [{"nested":[1,"bracket ]"]}];')), [{ nested: [1, 'bracket ]'] }]);
  for (const text of ['const RecentData = fetch("https://example.invalid");', 'const RecentData = [];\nlet RecentData = [];', 'const RecentData = [] + sideEffect();', 'const RecentData = [{bad:1}];']) {
    assert.equal(dom.parseRecentData(text), null);
  }
});

test('matching embedded data restores 14.66666666666667/15 without changing visible denominator', () => {
  const rows = [precisionAssignment()];
  assert.equal(dom.restoreEmbeddedPrecision(rows, precisionScores(), {}), 1);
  assert.equal(rows[0].earned, 14.66666666666667); assert.equal(rows[0].possible, 15);
  near(math.calculate(rows).value, 97.7777777777778);
  for (const [rows, scores, rules] of [
    [[precisionAssignment()], precisionScores(14.64), {}],
    [[precisionAssignment('14.67 / 15', '98%')], precisionScores(14.66666666666667, '90'), {}],
    [[precisionAssignment('14.67 / 15', '96%')], precisionScores(), {}],
    [[precisionAssignment('14.67 / 15', '97.78%', { status: 'excluded', included: false })], precisionScores(), {}],
    [[precisionAssignment(), precisionAssignment()], precisionScores(), {}],
    [[precisionAssignment()], precisionScores(), { averageMaximum: 4 }],
    [[precisionAssignment('14.67 / 15', '97.78%', { dueDate: '2026-10-03' })], precisionScores(), {}],
  ]) assert.equal(dom.restoreEmbeddedPrecision(rows, scores, rules), 0);
});

test('embedded precision requires one exact course, account, and assignment match', () => {
  const records = [classRecord(), scoreRecord()];
  const accepted = dom.readEmbeddedScores(recentPage(records));
  assert.equal(accepted.size, 1); assert.equal([...accepted.values()][0].earned, 14.66666666666667);
  for (const bad of [[scoreRecord()], [classRecord(), classRecord(), scoreRecord()],
    [classRecord(), scoreRecord(), scoreRecord()], [classRecord(), scoreRecord({ STUSN: '31' })],
    [classRecord(), scoreRecord({ Details: '41^10/01/2026^10/02/2026^Synthetic Algebra^Work^14.66666666666667^97.8' })],
    [classRecord(), scoreRecord({ Details: '40^10/01/2026^10/02/2026^Different Algebra^Work^14.66666666666667^97.8' })],
    [{ ...classRecord(), PageURL: classRecord().PageURL.replace('SC=20', 'SC=21') }, scoreRecord()]]) {
    assert.equal(dom.readEmbeddedScores(recentPage(bad)).size, 0);
  }
});

test('weight shares and circle areas preserve points/weighted ratios, exclusions, blanks, and zero weights', () => {
  const rows = [assignment('a', 8, 10, 'A', { status: 'graded' }), assignment('b', 20, 40, 'A', { status: 'graded' }),
    assignment('blank', null, 50, 'B', { included: false, status: 'ungraded' }),
    assignment('excluded', null, 100, 'A', { included: false, status: 'excluded' })];
  const current = buildWeightEntries(rows);
  assert.equal(current.error, null); assert.equal(current.entries.length, 2);
  near(current.entries[0].share, .2); near(current.entries[1].share, .8);
  const preview = buildWeightEntries(rows, {}, true);
  assert.equal(preview.preview, true); assert.equal(preview.excludedCount, 1); assert.equal(preview.ungradedCount, 1);
  near(preview.entries.reduce((total, entry) => total + entry.share, 0), 1);
  assert.equal(preview.entries.find(row => row.id === 'blank').percent, null);
  near(preview.result.value, current.result.value);
  const weighted = buildWeightEntries(rows, { mode: 'weighted', weights: { A: 40, B: 60 } }, true);
  near(weighted.entries.find(row => row.id === 'a').share, .08);
  near(weighted.entries.find(row => row.id === 'blank').share, .6);
  const zero = buildWeightEntries(rows, { mode: 'weighted', weights: { A: 0, B: 100 } }, true);
  assert.equal(zero.entries.find(row => row.id === 'a').share, 0);
  const unknown = buildWeightEntries(rows, { mode: 'weighted', weights: { A: 100 } }, true);
  assert.match(unknown.entries.find(row => row.id === 'blank').weightUnavailable, /Category weight/);
  near(unknown.entries.filter(row => row.share !== null).reduce((total, row) => total + row.share, 0), 1);
  const layout = layoutWeightCircles(current.entries);
  near(Math.max(...layout.circles.map(row => row.radius)), 110);
  near(layout.circles[0].radius ** 2 / layout.circles[1].radius ** 2, .25);
  assert.equal(layoutWeightCircles(zero.entries).circles.find(row => row.id === 'a').radius, 0);
});
