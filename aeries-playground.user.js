// ==UserScript==
// @name         Aeries Playground
// @namespace    local.aeries-playground
// @version      2.0.0
// @description  Aeries grade tools, compact linked score testing with live grade impact, hypothetical ranges, letter-based GPA or a color-coded overall average, and the next class from mvhs.io with seconds cross-checked against bell.plus.
// @match        https://mvla.aeries.net/student/*
// @run-at       document-idle
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      mvhs-app-d04d2.firebaseio.com
// @connect      bell.plus
// @license      LicenseRef-Aeries-Playground-Open-Source-1.0
// @homepageURL  https://github.com/sodium-qed/aeries-playground
// @supportURL   https://github.com/sodium-qed/aeries-playground/issues
// @downloadURL  none
// ==/UserScript==

/*
 * PRIVACY, PERMISSIONS, AND SECURITY NOTES
 *
 * Aeries Playground changes the page you see and calculates hypothetical
 * grades in your browser. It does not change your official grades, submit
 * grade changes to Aeries, or change account settings.
 *
 * AT A GLANCE
 * - Grade tools work without this script making external requests. Public
 *   schedule access starts off, including when upgrading an older install,
 *   until you enable the explained next-class toggle in Settings.
 * - Schedule requests contain no grades, class names, or Aeries account data.
 * - Posted grades and hypothetical scores are not saved. Saved preferences
 *   and course policies can be cleared from Settings.
 * - Updates are manual on a fresh Tampermonkey install; see the update note
 *   below. No downloaded code, analytics, or advertising is included.
 * These statements describe this file, not a security certification. Like
 * any userscript, it relies on your browser, manager, and installed source.
 *
 * WHERE IT RUNS AND WHAT IT READS
 * - Runs on https://mvla.aeries.net/student/ pages, outside embedded frames.
 *   The userscript metadata and an additional hostname/path check limit it
 *   to those pages.
 * - Reads the course cards, assignments, grades, categories, and grading
 *   information already displayed on the page to build its local tools.
 * - Does not request your password, read login cookies, identify the signed-in
 *   account, or fetch hidden Aeries records.
 * - Hypothetical scores, added assignments, and calculated results stay in
 *   page memory. They reset when you exit grade testing, reload, switch
 *   gradebooks/settings scope, or a gradebook refresh is detected. Course
 *   grading settings and replacement rules are saved.
 *
 * WHAT IS SAVED
 * - GM_getValue and GM_setValue read and write this userscript's storage in
 *   your userscript manager. Saved data includes preferences, profile/year
 *   labels, course names and identifiers, nicknames, icons, period mappings,
 *   color thresholds, grading rules, and unfinished grading-rule forms.
 * - Saved replacement rules also include the referenced assignment names,
 *   identifiers, and categories, plus the replacement policy and score cap.
 *   The script does not save posted grades, hypothetical scores, calculated
 *   results, or a copy of the gradebook page.
 * - Course identifiers and assignment references are not anonymized; saved
 *   data can reveal school and course information. Do not share storage
 *   exports as if they contained only generic display preferences.
 * - Profiles and school years are selected manually. Choose a separate
 *   profile/year before using another student's account or starting a new
 *   school year; the script does not detect those changes automatically.
 *   Course settings/rules use the selected profile/year. Global display
 *   toggles, colors, and default thresholds remain shared across profiles.
 * - Grading-rule forms save automatically, including incomplete drafts;
 *   only complete, valid rules are applied. Replacement rules save when
 *   added or removed. Page exit flushes only a pending save; an idle tab does
 *   not rewrite its old settings on exit. Before saving, the script checks
 *   a reset marker so a tab opened before an in-app clear cannot normally
 *   restore that cleared copy. Ordinary simultaneous edits remain last-write
 *   wins; the manager does not provide an atomic multi-tab transaction here.
 * - Storage is controlled by your userscript manager. Its sync or backup
 *   settings may copy stored data elsewhere; review or disable those settings
 *   if you want it kept on this device.
 *
 * EVERY AUTOMATIC NETWORK REQUEST MADE BY THIS SCRIPT
 * These requests support the optional next-class widget. They are off by
 * default and require you to enable "What class is next (MVHS)" in Settings.
 * An enabled widget inherited from an older install does not grant consent:
 * - GET https://mvhs-app-d04d2.firebaseio.com/days.json
 * - GET https://mvhs-app-d04d2.firebaseio.com/weekday-map.json
 * - GET https://mvhs-app-d04d2.firebaseio.com/schedules.json
 *   These retrieve public bell-schedule data used by mvhs.io.
 * - GET https://bell.plus/api/data/mvhs
 *   Retrieves the public MVHS schedule to cross-check bell times.
 * - POST https://bell.plus/timesync
 *   Sends a JSON-RPC clock request with method "timesync" and an ID made from
 *   "aeries-clock-" plus the current timestamp. This POST is a clock check,
 *   not an Aeries grade or account update.
 * No grades, course names, assignment data, profile labels, or account details
 * are included in these requests. The network helper uses anonymous:true
 * to ask the userscript manager to omit cookies and specify public-site
 * Referer values. Anonymous requests do not hide your IP address or ordinary
 * connection information from those services. Requests have timeouts and
 * response-size checks; results are parsed as JSON and checked before use.
 * The final response URL must exactly match the requested endpoint. This
 * rejects unexpected responses; it does not stop a manager from following
 * an HTTP redirect before reporting the final URL. Cookie handling and
 * cancellation also depend on the userscript manager honoring its options.
 * Requests run after opt-in when the widget is enabled on a visible course
 * dashboard. Pausing Playground also stops schedule work.
 * Public schedules and the clock cross-check require same-date data less
 * than five minutes old. Course-to-period matching happens locally.
 * Turn off "What class is next (MVHS)" in Settings to revoke consent, stop
 * refreshes, cancel outstanding requests, and clear the schedule cache.
 * Late responses are ignored even if the manager cannot abort a transfer.
 * Cancellation cannot undo a request that already reached a service.
 * Opening a source link visits that service normally; installing or updating
 * a script may separately contact its host through your userscript manager.
 *
 * WHY EACH PERMISSION IS REQUESTED
 * - GM_getValue / GM_setValue: load and save the local settings described above.
 * - GM_registerMenuCommand: add the menu shortcut that opens Settings.
 * - GM_xmlhttpRequest: retrieve public schedules and check the clock across
 *   domains. @connect lists the two schedule hosts, without a wildcard.
 *   The manager still grants this capability while the widget is off; opt-in
 *   is enforced by this file's code, not by a separate permission sandbox.
 * No analytics, telemetry, advertising, or remote-code loader is included.
 * The script has no @require dependencies and does not evaluate downloaded
 * scripts. Public responses are treated as data, not executable code.
 *
 * BUILT-IN SAFEGUARDS AND HOW TO INSPECT THEM
 * - Playground controls are created with a separate, unbound form attribute;
 *   its buttons use type="button". Inline score editors also block their
 *   events from bubbling into Aeries and prevent Enter from submitting.
 * - Displayed names and labels use textContent, not HTML interpolation.
 * - A single request helper uses the five constant endpoints listed above.
 *   The clock payload is constructed inside it from a checked clock ID;
 *   callers cannot supply a URL or arbitrary request body. Each request
 *   checks opt-in, and schedule parsing checks data structures and times.
 * - Bell.plus seconds are shown only when its schedule and clock checks agree
 *   with the primary schedule; otherwise the widget falls back to minutes.
 * - To review the implementation, search for GradeDOM, el, persist,
 *   clearSavedSettings, serializePlanningRules, saveProfile,
 *   scheduleRequestsAllowed, requestScheduleJSON, abortScheduleRequests,
 *   requestBellPlusClock, and verifiedBellSeconds in this file.
 * The accompanying custom license explicitly permits giving the complete
 * source to AI tools, automated scanners, or human security auditors,
 * including paid services, without asking permission.
 * Send the script alone, without login details, copied Aeries pages, grades,
 * screenshots, or saved personal data. An AI review is not an independent
 * security audit and does not guarantee safety.
 *
 * UPDATES AND PAGE ACCESS
 * - @downloadURL none disables automatic updates for a fresh Tampermonkey
 *   install. Existing installs may retain their previous update preferences;
 *   turn off automatic updates for this script in the manager if needed.
 *   Other managers may handle this metadata differently. Review a replacement
 *   file, then install it manually from the official repository.
 * - Reading visible grades and modifying their display are essential to the
 *   features. Local controls avoid submitting Aeries forms, but a page change
 *   can still cause display or compatibility bugs. Disable the script and
 *   reload to return to the original page. A malicious replacement file
 *   could misuse granted access; these safeguards describe this code only.
 *
 * STOPPING THE SCRIPT AND REMOVING SAVED DATA
 * - Turning off "Enable Playground" pauses enhancements and keeps settings.
 *   Exiting grade testing clears its temporary scenario, not saved policies.
 * - To stop the script completely, disable or remove it in your userscript
 *   manager and reload Aeries. Disabling it does not erase stored data.
 * - "Clear saved settings and pause" in Settings removes saved profiles,
 *   course customizations, grading-rule drafts and replacement rules, resets
 *   preferences, and pauses Playground. It retains only blank paused defaults
 *   and a reset marker. Reload other Aeries tabs afterward; older script code
 *   without the reset-marker check can still save its own copy.
 * - Alternatively, close Aeries tabs and erase this script's storage in your
 *   userscript manager. Neither method removes manager sync or backup copies;
 *   manage those separately if enabled.
 *
 * SHARING EXAMPLES AND REPORTING A PROBLEM
 * Use fictional examples in issues, commits, pull requests, and logs. Do not
 * publish real gradebook page source, copied DOM, grades, student identifiers,
 * identifiable screenshots, cookies, session IDs, or passwords. Browser
 * exports can contain data not visible on screen. Repository ignore rules
 * do not sanitize uploads or remove tracked files or history.
 * For a vulnerability, use "Report a vulnerability" on the repository's
 * Security tab if that private option is available. Otherwise open an issue
 * asking for a private reporting channel, without sensitive details. This
 * file does not enable private reporting or promise a response deadline.
 * If account information was exposed, do not quote or repost it. Notify the
 * affected owner and maintainer privately. Exposed credentials or sessions
 * need to be reset/revoked through their provider; deleting a file alone
 * does not remove Git history, cached copies, or restore account security.
 */

/*
 * Aeries Playground Open Source License, Version 1.0
 *
 * Copyright (c) 2026 sodium-qed
 *
 * 1. Scope and grant
 *
 * This license applies to the code and accompanying material distributed with
 * this license, except material expressly covered by separate license terms
 * (the "Software"). Each copyright holder offering material under this license
 * (a "Licensor") grants everyone a nonexclusive, worldwide, royalty-free copyright
 * license to use, reproduce, modify, make derivative works of, display, perform,
 * and distribute that material, in source or other forms, for any purpose,
 * including commercial purposes, subject to the conditions below. This grant is
 * perpetual and cannot be revoked except for breach under section 6.
 *
 * These permissions apply to every person and organization, in every field of
 * activity, using any technology. They apply whether the Software is used alone,
 * extracted from this project, renamed, or included in another distribution.
 * No separate signature, registration, payment to a Licensor, or advance approval
 * is required. Copyright ownership remains with the respective copyright holders.
 *
 * 2. Use and private changes
 *
 * You may download, install, run, read, inspect, analyze, copy, and change the
 * Software. This includes personal, educational, business, and other uses,
 * backups, transfers between your devices, and private cloud storage. You need
 * not publish your private changes or provide them to a Licensor.
 *
 * Keep existing copyright, attribution, license, and third-party notices in
 * copies of the Software. Do not misrepresent the origin of the Software or
 * claim that a Licensor approved your modifications.
 *
 * 3. Explicit permission for AI tools and security review
 *
 * You may give the COMPLETE source code, including privately modified copies,
 * to ChatGPT, any other AI service or model, automated scanners, and human
 * reviewers for explanation, analysis, debugging, testing, or security auditing.
 * Uploading the entire source for these purposes is expressly permitted. You
 * may use paid reviewers and commercial services without asking a Licensor.
 *
 * Reviewers, service providers, and their processors receive permission directly
 * from each Licensor to receive, copy, store, process, and analyze the submitted
 * code, make working changes for the review, produce results, and retain review
 * records. They may return reviewed code, patches, and proposed changes to the
 * person requesting review. No separate signature or permission is required.
 *
 * You and reviewers may publish findings, explanations, and security reports,
 * including relevant code excerpts. Independently created findings, reports,
 * and AI outputs do not become subject to this license merely because the
 * Software was reviewed. Material copied or derived from the Software remains
 * covered to the extent copyright applies; the independent remainder does not.
 *
 * Private review does not require making submitted code, private changes, or
 * review records public. Preserve the notices when supplying code for review.
 * Distribution of the Software or modified copies remains subject to section 4;
 * that section requires source access for recipients, not publication to everyone.
 * This section clarifies permissions and does not limit the broader grant in
 * section 1. It grants rights in the Software, not in anyone's private account
 * data or other material that a Licensor does not own.
 *
 * 4. Redistribution, commercial use, and source sharing
 *
 * You may share, mirror, publish, sell, rent, or otherwise distribute unchanged
 * or modified copies, alone or as part of a bundle, and may charge for copies,
 * access, support, or services. No royalty or separate permission is required.
 * Public forks and releases of modified versions are expressly allowed.
 *
 * When you distribute the Software or a derivative work based on it:
 *
 * a. Include this complete license and preserve existing copyright, attribution,
 *    and third-party notices. You may add accurate notices for your contributions.
 *
 * b. Clearly identify modified versions as modified, with a brief description
 *    of the changes and their dates. Do not present them as an official release
 *    or imply a Licensor's endorsement.
 *
 * c. License the covered work, including your modifications, under this same
 *    license. Every recipient automatically receives the permissions in this
 *    license directly from the relevant copyright holders. Do not impose extra
 *    legal or contractual restrictions on exercising those permissions. Charging
 *    for a copy does not restrict the recipient's right to share it further.
 *
 * d. Provide the complete corresponding source for the covered work, including
 *    your modifications, to every recipient. Include it with the copy, or give
 *    clear instructions for obtaining it without an additional charge by a
 *    readily accessible means maintained for as long as you distribute that
 *    version. Source must be the preferred form for making changes, including
 *    any project-specific files or scripts needed to build, install, and run
 *    that version. Deliberately obfuscated code, minified code, and generated
 *    intermediate output do not substitute for that preferred form. General
 *    purpose tools and unchanged third-party dependencies need not be included
 *    if ordinarily available separately; their own license terms still apply.
 *
 * An unchanged source distribution already containing the complete corresponding
 * source and this license satisfies the source requirement. No public release of
 * private changes is required merely because you run the Software, including to
 * provide a service. Supplying a copy to someone is distribution even if private.
 *
 * The same-license requirement covers the Software and copyright-derived works
 * based on it. It does not require independent software or material to adopt
 * this license merely because it is bundled with, runs alongside, communicates
 * with, or is used to review the Software. Separately licensed third-party
 * material retains its own terms and notices.
 *
 * 5. Rights this license does not change
 *
 * This license does not restrict independently written implementations or ideas,
 * facts, and other material that copyright does not protect. It does not limit
 * fair use, fair dealing, or other rights and exceptions provided by law.
 *
 * This license does not revoke or replace valid permissions already received for
 * earlier copies, including MIT-licensed copies. It does not automatically apply
 * to earlier repository history. You may rely on another valid license for the
 * copy and material it covers. No trademark rights or permission to imply
 * endorsement are granted here.
 *
 * 6. Breach and correction
 *
 * If you breach these terms, a Licensor may notify you in writing. Your rights
 * in that Licensor's material under this license end if you do not correct the
 * breach within 30 days after receiving that notice. Correction includes ending
 * noncompliant distribution and taking reasonable steps to remedy the breach.
 * Recipients who comply retain their own directly granted rights; your breach
 * does not terminate theirs. Rights independently held under another license
 * or law are unaffected.
 *
 * 7. No warranty; limitation of liability
 *
 * To the extent permitted by applicable law, the Software is provided "as is,"
 * without warranties of any kind. To that same extent, no Licensor is liable
 * for loss or damage arising from use of the Software or this license. Nothing
 * here excludes liability or rights that applicable law does not allow to be
 * excluded.
 */

(() => {
  'use strict';
  if (location.hostname !== 'mvla.aeries.net' || !location.pathname.startsWith('/student/')) return;
  if (document.getElementById('ap-playground-host')) return;
  // See the security and privacy explanation above for data and network details.
/* Pure calculations for a local, explicitly configured grade simulation.
 * Values here are model results, never claims of hidden official precision.
 */
const GradeMath = (() => {
  'use strict';

  function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function format(value, decimals = 6) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
    const places = Number.isInteger(decimals) ? Math.max(0, Math.min(12, decimals)) : 6;
    const result = value.toFixed(places).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
    return /^-0(?:\.0*)?$/.test(result) ? '0' : result;
  }

  // Convert raw marks to gradebook points, truncating only this conversion to
  // hundredths. Exact decimal arithmetic avoids flooring 28.999999... to 28.99.
  function convertRawScore(correct, total, possible) {
    const c=parseNumber(correct),t=parseNumber(total),p=parseNumber(possible);
    if(c===null||c<0||t===null||t<=0||p===null||p<=0)
      return {earned:null,error:'Enter a nonnegative number correct, a positive raw total, and positive gradebook points.'};
    const decimal=value=>{
      const parts=String(value).trim().replace(/^\+/,'').toLowerCase().split('e');
      const [whole,fraction='']=parts[0].split('.');
      return {n:BigInt((whole||'0')+fraction),scale:fraction.length-Number(parts[1]||0)};
    };
    const a=decimal(correct),b=decimal(total),d=decimal(possible);
    const exponent=b.scale+2-a.scale-d.scale;
    const numerator=a.n*d.n*(exponent>0?10n**BigInt(exponent):1n);
    const denominator=b.n*(exponent<0?10n**BigInt(-exponent):1n);
    const cents=numerator/denominator;
    // Divide before converting to Number so finite, large point values do not
    // overflow merely because cents are 100 times larger.
    const earned=Number(cents/100n)+Number(cents%100n)/100;
    return Number.isFinite(earned)?{earned,error:null}:{earned:null,error:'This raw score is too large to convert.'};
  }

  const keyOf = value => (
    typeof value === 'string' && value.trim() ? value.trim() :
      typeof value === 'number' && Number.isFinite(value) ? String(value) : null
  );
  const emptyResult = error => ({
    value: null, error: error || null, usedCount: 0,
    totalEarned: 0, totalPossible: 0, categories: [], appliedReplacements: [], effectiveAssignments: []
  });

  function calculate(assignments, rules = {}) {
    if (!Array.isArray(assignments)) return emptyResult('Assignments must be a list.');
    if (!rules || typeof rules !== 'object' || Array.isArray(rules)) {
      return emptyResult('Grading rules must be an object.');
    }
    const mode = rules.mode === undefined ? 'points' : rules.mode;
    const scoreFloor=rules.scoreFloor==null?null:parseNumber(rules.scoreFloor);
    const scoreCeiling=rules.scoreCeiling==null?null:parseNumber(rules.scoreCeiling);
    if((rules.scoreFloor!=null && (scoreFloor===null || scoreFloor<0)) ||
       (rules.scoreCeiling!=null && (scoreCeiling===null || scoreCeiling<0)) ||
       (scoreFloor!==null && scoreCeiling!==null && scoreFloor>scoreCeiling))return emptyResult('Enter valid assignment score limits with minimum no greater than maximum.');
    if (mode !== 'points' && mode !== 'weighted') {
      return emptyResult('Choose points or weighted grading.');
    }
    const replacements = rules.replacements === undefined ? [] : rules.replacements;
    if (!Array.isArray(replacements)) return emptyResult('Replacement rules must be a list.');
    const weights = rules.weights === undefined ? {} : rules.weights;
    if (mode === 'weighted' && (!weights || typeof weights !== 'object' || Array.isArray(weights))) {
      return emptyResult('Category weights must be an object.');
    }

    // Keep original scores separate: a replacement source never inherits another replacement.
    const originals = new Map();
    for (const assignment of assignments) {
      if (!assignment || typeof assignment !== 'object' || Array.isArray(assignment)) {
        return emptyResult('Each assignment must be an object.');
      }
      const id = keyOf(assignment.id);
      if (id === null) return emptyResult('Every assignment needs a nonempty ID.');
      if (originals.has(id)) return emptyResult(`Assignment ID "${id}" is duplicated.`);
      const name = typeof assignment.name === 'string' && assignment.name.trim() ? assignment.name.trim() : id;
      const category = typeof assignment.category === 'string' && assignment.category.trim()
        ? assignment.category.trim() : 'Uncategorized';
      const included = assignment.included !== false;
      const possible = parseNumber(assignment.possible);
      const earned = assignment.earned === null ? null : parseNumber(assignment.earned);
      if (included && (possible === null || possible <= 0)) {
        return emptyResult(`"${name}" needs positive possible points. Zero-point extra credit requires a separate grading policy.`);
      }
      if (included && assignment.earned !== null && (earned === null || earned < 0)) {
        return emptyResult(`"${name}" needs nonnegative earned points, or an ungraded (blank) score.`);
      }
      originals.set(id, { id, name, category, included, earned, possible });
    }

    const normalizedRules = [];
    const targets = new Map();
    for (const rule of replacements) {
      if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
        return emptyResult('Each replacement rule must identify a source and target.');
      }
      const sourceId = keyOf(rule.sourceId), targetId = keyOf(rule.targetId);
      if (!originals.has(sourceId) || !originals.has(targetId)) {
        return emptyResult('A replacement rule refers to an assignment that does not exist.');
      }
      if (sourceId === targetId) return emptyResult('An assignment cannot replace itself.');
      if (rule.onlyIfHigher !== undefined && typeof rule.onlyIfHigher !== 'boolean') {
        return emptyResult('The only-if-higher setting must be true or false.');
      }
      const capPercent = rule.capPercent == null ? null : parseNumber(rule.capPercent);
      if (rule.capPercent != null && (capPercent === null || capPercent < 0)) {
        return emptyResult('A replacement cap must be a nonnegative percentage, or left blank for no cap.');
      }
      const onlyIfHigher = rule.onlyIfHigher !== false;
      if (targets.has(targetId) && (!onlyIfHigher || !targets.get(targetId))) {
        return emptyResult(`Assignment "${originals.get(targetId).name}" has conflicting replacement rules. Multiple sources must all use only-if-higher.`);
      }
      targets.set(targetId, onlyIfHigher);
      normalizedRules.push({ sourceId, targetId, onlyIfHigher, capPercent });
    }

    // The assessment counts normally and may also improve earlier scores.
    const effective = new Map([...originals].map(([id, row]) => [id,
      {...row,originalEarned:row.earned,replacementSourceId:null,counted:row.included&&row.earned!==null}]));
    const winningReplacements = new Map();
    for (const rule of normalizedRules) {
      const source = originals.get(rule.sourceId), target = originals.get(rule.targetId);
      if (!source.included || !target.included || source.earned === null || target.earned === null) continue;
      if (source.possible === null || source.possible <= 0 || source.earned < 0) {
        return emptyResult(`Replacement source "${source.name}" needs nonnegative earned points and positive possible points.`);
      }
      const sourceFraction = source.earned / source.possible;
      const targetFraction = target.earned / target.possible;
      if (![sourceFraction, targetFraction, sourceFraction * 100, targetFraction * 100].every(Number.isFinite)) {
        return emptyResult('These scores are too large to calculate reliably.');
      }
      // Cap only the proposed replacement. A higher original score is preserved
      // by only-if-higher, including when the original exceeds the revision cap.
      const candidateFraction = rule.capPercent === null ? sourceFraction
        : Math.min(sourceFraction, rule.capPercent / 100);
      const current = winningReplacements.get(target.id);
      if (rule.onlyIfHigher && (candidateFraction <= targetFraction || (current && candidateFraction * 100 <= current.newPercent))) continue;
      const newEarned = candidateFraction * target.possible;
      if (!Number.isFinite(newEarned)) return emptyResult('These scores are too large to calculate reliably.');
      effective.get(target.id).earned = newEarned;
      effective.get(target.id).replacementSourceId = source.id;
      winningReplacements.set(target.id, {
        sourceId: source.id, targetId: target.id,
        originalEarned: target.earned, newEarned, possible: target.possible,
        oldPercent: targetFraction * 100, newPercent: candidateFraction * 100,
        capPercent: rule.capPercent, sourcePercent: sourceFraction * 100
      });
    }

    const appliedReplacements = [...winningReplacements.values()];
    let totalEarned = 0, totalPossible = 0, usedCount = 0;
    const categoryMap = new Map();
    for (const row of effective.values()) {
      if (!row.counted) continue;
      row.scoreBeforeLimits = row.earned;
      if(scoreFloor!==null)row.earned=Math.max(row.earned,row.possible*scoreFloor/100);
      if(scoreCeiling!==null)row.earned=Math.min(row.earned,row.possible*scoreCeiling/100);
      const category = categoryMap.get(row.category) || {
        name: row.category, earned: 0, possible: 0, percent: null, weight: null
      };
      category.earned += row.earned;
      category.possible += row.possible;
      categoryMap.set(row.category, category);
      totalEarned += row.earned;
      totalPossible += row.possible;
      usedCount += 1;
    }
    if (![totalEarned, totalPossible].every(Number.isFinite)) {
      return emptyResult('These scores are too large to calculate reliably.');
    }
    const categories = [...categoryMap.values()];
    let weightTotal = 0;
    for (const category of categories) {
      category.percent = category.earned / category.possible * 100;
      if (mode === 'weighted') {
        category.weight = Object.prototype.hasOwnProperty.call(weights, category.name)
          ? parseNumber(weights[category.name]) : null;
        if (category.weight === null || category.weight < 0) {
          return emptyResult(`Set a nonnegative weight for active category "${category.name}".`);
        }
        weightTotal += category.weight;
      }
    }
    let value = null;
    if (usedCount > 0) {
      if (mode === 'points') value = totalEarned / totalPossible * 100;
      else if (Number.isFinite(weightTotal)) {
        // A zero-weight category still has point totals to reconcile with
        // Aeries, but it contributes nothing to the grade. If no counted
        // category has positive weight, there is no weighted grade yet.
        if (weightTotal > 0) value = categories.reduce((sum, category) => sum + category.percent * (category.weight / weightTotal), 0);
      } else return emptyResult('These category weights are too large to calculate reliably.');
    }
    if (categories.some(category => !Number.isFinite(category.percent)) ||
      (value !== null && !Number.isFinite(value))) {
      return emptyResult('These scores are too large to calculate reliably.');
    }
    return { value, error: null, usedCount, totalEarned, totalPossible, categories, appliedReplacements,
      effectiveAssignments: [...effective.values()] };
  }

  // Round in the course's display unit, then convert back to internal percent.
  // An omitted policy preserves existing calculations; the profile UI requires
  // an explicit choice before a new profile can be saved.
  function roundPercent(value, rules = {}) {
    const percent = parseNumber(value);
    if (percent === null || !rules || typeof rules !== 'object' || Array.isArray(rules)) return null;
    if (rules.rounding === undefined || rules.rounding === 'none') return percent;
    if (!['nearest', 'down', 'up'].includes(rules.rounding)) return null;
    const decimals = parseNumber(rules.roundingDecimals);
    const maximum = rules.averageMaximum == null ? 100 : parseNumber(rules.averageMaximum);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8 || maximum === null || maximum <= 0) return null;
    const factor = 10 ** decimals;
    let scaled = (percent / 100 * maximum) * factor;
    if (!Number.isFinite(scaled) || Math.abs(scaled) > Number.MAX_SAFE_INTEGER) return null;
    // Decimal fractions can land a few ulps below an exact rounding boundary.
    const boundary = rules.rounding === 'nearest' ? Math.round(scaled * 2) / 2 : Math.round(scaled);
    if (Math.abs(scaled - boundary) <= Number.EPSILON * Math.max(1, Math.abs(scaled)) * 2) scaled = boundary;
    const rounded = rules.rounding === 'nearest' ? Math.round(scaled)
      : rules.rounding === 'down' ? Math.floor(scaled) : Math.ceil(scaled);
    const result = rounded / factor / maximum * 100;
    return Number.isFinite(result) ? result : null;
  }

  function solveTarget(assignments, rules, options) {
    const fail = error => ({ status: 'invalid', error, earned: null, value: null, rawValue: null });
    if (!Array.isArray(assignments)) return fail('Assignments must be a list.');
    if (!rules || typeof rules !== 'object' || Array.isArray(rules)) return fail('Grading rules must be an object.');
    if (!options || typeof options !== 'object' || Array.isArray(options)) return fail('Choose an assignment, target grade, maximum score, and score increment.');
    const assignmentId = keyOf(options.assignmentId);
    const target = parseNumber(options.target), maximumEarned = parseNumber(options.maximumEarned), step = parseNumber(options.step);
    if (assignmentId === null || target === null || target < 0 || maximumEarned === null || maximumEarned < 0 || step === null || step <= 0) {
      return fail('Choose an assignment and enter a nonnegative target and maximum score, plus a positive score increment.');
    }
    const selected = assignments.find(row => row && keyOf(row.id) === assignmentId);
    if (!selected) return fail('Choose an assignment that exists in this hypothetical scenario.');
    const possible = parseNumber(selected.possible);
    if (possible === null || possible <= 0) return fail('The selected assignment needs positive possible points.');
    let quotient = maximumEarned / step;
    if (!Number.isFinite(quotient) || quotient > Number.MAX_SAFE_INTEGER) return fail('The score increment is too small for this maximum score.');
    const nearest = Math.round(quotient);
    if (Math.abs(quotient - nearest) <= Number.EPSILON * Math.max(1, Math.abs(quotient)) * 2) quotient = nearest;
    const lastIndex = Math.floor(quotient);
    const scoreAt = index => {
      const score = index * step;
      // This only corrects representation error at an on-step maximum; it
      // never adds an off-step maximum as another permitted score.
      return index === lastIndex && Math.abs(score - maximumEarned) <= Number.EPSILON * Math.max(Math.abs(score), Math.abs(maximumEarned)) * 2
        ? maximumEarned : score;
    };
    const evaluate = index => {
      const earned = scoreAt(index);
      const model = assignments.map(row => row && keyOf(row.id) === assignmentId ? { ...row, earned, included: true } : row);
      const result = calculate(model, rules);
      if (result.error) return fail(result.error);
      if (result.value === null) return fail('There is no counted grade after applying this score and its replacement rules. Check the target assignments and category weights.');
      const value = roundPercent(result.value, rules);
      if (value === null) return fail('Choose a valid rounding rule and its decimal places.');
      return { status: 'solved', error: null, earned, value, rawValue: result.value };
    };
    // Permit only a few floating-point ulps at the requested boundary; for
    // example, 1.4 / 10 * 100 can evaluate to 13.999999999999998. Scaling by
    // the actual values (without an absolute epsilon) also protects tiny goals.
    const meetsTarget = value => value >= target ||
      target - value <= Number.EPSILON * Math.max(Math.abs(value), Math.abs(target)) * 4;
    const highResult = evaluate(lastIndex);
    if (highResult.error) return highResult;
    if (!meetsTarget(highResult.value)) return { ...highResult, status: 'unreachable' };
    // Positive weights, original-score replacements, and score limits make
    // this grade nondecreasing in the selected score. Integer binary search
    // includes both 0 and the largest allowed multiple without scanning them.
    let low = 0, high = lastIndex;
    while (low < high) {
      const middle = low + Math.floor((high - low) / 2);
      const result = evaluate(middle);
      if (result.error) return result;
      if (meetsTarget(result.value)) high = middle;
      else low = middle + 1;
    }
    return evaluate(low);
  }

  function calculateRanges(assignments, rules, options) {
    const fail = error => ({ status: 'invalid', error, lowValue: null, highValue: null, rawLowValue: null, rawHighValue: null,
      lowResult: null, highResult: null, lowAssignments: null, highAssignments: null });
    if (!Array.isArray(assignments)) return fail('Assignments must be a list.');
    if (!rules || typeof rules !== 'object' || Array.isArray(rules)) return fail('Grading rules must be an object.');
    if (!Array.isArray(options) || !options.length) return fail('Enter a lower and upper bound for at least one assignment.');
    const ranges = [], selectedRanges = new Map();
    for (const option of options) {
      if (!option || typeof option !== 'object' || Array.isArray(option)) return fail('Each assignment range needs a lower and upper bound.');
      const assignmentId = keyOf(option.assignmentId);
      const lowEarned = parseNumber(option.lowEarned), highEarned = parseNumber(option.highEarned);
      const selected = assignments.find(row => row && keyOf(row.id) === assignmentId);
      if (assignmentId === null || !selected) return fail('Choose an assignment that exists in this hypothetical scenario.');
      const name = typeof selected.name === 'string' && selected.name.trim() ? selected.name.trim() : assignmentId;
      if (selectedRanges.has(assignmentId)) return fail(`\"${name}\" has more than one range.`);
      if (lowEarned === null || highEarned === null || lowEarned < 0 || highEarned < 0 || lowEarned > highEarned) {
        return fail(`\"${name}\" needs nonnegative lower and upper bounds, with lower no greater than upper.`);
      }
      const possible = parseNumber(selected.possible);
      if (possible === null || possible <= 0) return fail(`\"${name}\" needs positive possible points.`);
      const range = { assignmentId, lowEarned, highEarned };
      ranges.push(range);
      selectedRanges.set(assignmentId, range);
    }
    const endpointAssignments = endpoint => assignments.map(row => {
      const range = row && selectedRanges.get(keyOf(row.id));
      return range ? { ...row, earned: range[endpoint], included: true } : row;
    });
    const lowAssignments = endpointAssignments('lowEarned'), highAssignments = endpointAssignments('highEarned');
    // All selected assignments count at both endpoints, fixing the point and
    // category denominators. Nonnegative weights, original-score replacement
    // sources, caps, score limits, and display rounding are nondecreasing in
    // every score. An unconditional replacement ignores its target's original
    // score; it cannot reverse this ordering. Thus simultaneous all-low and
    // all-high scenarios attain the exact grade bounds, even when one ranged
    // assignment replaces another. No sampling or per-row delta sums needed.
    const lowResult = calculate(lowAssignments, rules), highResult = calculate(highAssignments, rules);
    if (lowResult.error || highResult.error) return fail(lowResult.error || highResult.error);
    if (lowResult.value === null || highResult.value === null) return fail('There is no counted grade after applying these ranges. Check the assignments and category weights.');
    const lowValue = roundPercent(lowResult.value, rules), highValue = roundPercent(highResult.value, rules);
    if (lowValue === null || highValue === null) return fail('Choose a valid rounding rule and its decimal places.');
    return { status: 'calculated', error: null, ranges, rangeCount: ranges.length, lowValue, highValue,
      rawLowValue: lowResult.value, rawHighValue: highResult.value, lowResult, highResult, lowAssignments, highAssignments };
  }

  function calculateRange(assignments, rules, options) {
    const result = calculateRanges(assignments, rules, [options]);
    return result.error ? result : { ...result, ...result.ranges[0] };
  }

  function impacts(assignments, rules = {}) {
    if (!Array.isArray(assignments)) return [];
    const baseline = calculate(assignments, rules);
    return assignments.map((assignment, index) => {
      const id = assignment && assignment.id;
      if (baseline.error) return { id, delta: null, error: baseline.error };
      if (assignment.included === false || assignment.earned === null || baseline.value === null) {
        return { id, delta: null, error: null };
      }
      const normalizedId = keyOf(id);
      // Leave-one-out effect, not a historical change. Removing a replacement
      // source also removes its benefit to targets; empty weighted categories
      // are renormalized. A lone assignment has no comparison grade.
      const remainingRules = {
        ...rules,
        replacements: (rules.replacements || []).filter(rule =>
          keyOf(rule.sourceId) !== normalizedId && keyOf(rule.targetId) !== normalizedId)
      };
      const remaining = calculate(assignments.filter((_, rowIndex) => rowIndex !== index), remainingRules);
      return { id, delta: remaining.value === null ? null : baseline.value - remaining.value, error: remaining.error };
    });
  }

  function fromAeries(assignments, rules, options = {}) {
    const fail=error=>({model:null,result:null,error});
    if(options.partial)return fail('Show all assignments to calculate impacts; the missing-only filter is on.');
    if(!rules || !Array.isArray(rules.categories) || !rules.categories.length)return fail('Impact estimates need the category totals shown by Aeries.');
    const model={assignments:assignments.map(a=>({id:a.id,name:a.name,category:a.category,earned:a.earned,possible:a.possible,included:a.included})),
      rules:{mode:rules.mode,weights:{...rules.weights},averageMaximum:rules.averageMaximum??null,scoreFloor:rules.scoreFloor??null,scoreCeiling:rules.scoreCeiling??null,replacements:rules.replacements===undefined?[]:rules.replacements},
      confirmed:true,source:'aeries',updatedAt:null};
    const result=calculate(model.assignments,model.rules);
    if(result.error)return fail(result.error);
    if(result.value===null)return fail(result.usedCount>0&&model.rules.mode==='weighted'
      ?'Only 0% categories have graded assignments. There is no counted grade yet.'
      :'No graded assignments yet; impacts appear when scores are posted.');
    const actual=new Map(result.categories.map(c=>[c.name,c]));
    const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=0.011;
    for(const reported of rules.categories){
      const seen=actual.get(reported.name);
      if(rules.averageMaximum && reported.unit==='average'){
        // Average gradebooks may publish 0 as the points denominator. Check
        // their displayed category averages in the same units instead.
        const average=seen?seen.percent*rules.averageMaximum/100:0;
        const tolerance=Math.max(0.011,0.5*10**-(reported.decimals??2)+1e-9);
        if(reported.grade===null || !Number.isFinite(average) || Math.abs(average-reported.grade)>tolerance)
          return fail('Assignment averages do not match Aeries yet. Show all assignments for this grading period.');
      }else if(!close(seen?.earned??0,reported.earned) || !close(seen?.possible??0,reported.possible))return fail('Assignment totals do not match Aeries yet. Show all assignments for this grading period; impacts will appear when the totals agree.');
      actual.delete(reported.name);
    }
    if(actual.size)return fail('Some assignment categories are missing from the Aeries totals.');
    const displayedValue=rules.averageMaximum && rules.officialUnit==='average'?result.value*rules.averageMaximum/100:result.value;
    const officialTolerance=rules.officialUnit==='average'?Math.max(0.011,0.5*10**-(rules.officialDecimals??2)+1e-9):0.011;
    if(!Number.isFinite(rules.official) || Math.abs(displayedValue-rules.official)>officialTolerance)return fail('The calculated grade does not match the displayed Aeries grade. This class may use additional grading rules.');
    return {model,result,error:null};
  }
  return { calculate, impacts, format, parseNumber, fromAeries, roundPercent, solveTarget, calculateRange, calculateRanges, convertRawScore };
})();

/* Read-only adapters. This module never requests data or submits a page form. */
const GradeDOM = (() => {
  'use strict';
  const OWNED = '[data-ap-owned]';
  const numberPattern = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
  const gradePattern = new RegExp(`^(${numberPattern})\\s*(%|Avg\\.?)$`, 'i');
  const scalarPattern = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+|\d{1,3}(?:,\d{3})+(?:\.\d+)?)$/;

  function cleanText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && value.nodeType) {
      if (value.nodeType === 1 && value.closest(OWNED)) return '';
      const clone = value.cloneNode(true);
      if (clone.querySelectorAll) clone.querySelectorAll(`${OWNED}, script, style`).forEach(el => el.remove());
      value = clone.textContent;
    }
    return String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function parseGrade(text) {
    const raw = cleanText(text);
    const equivalent=raw.match(/^[a-z][a-z +−-]*\s*\(([^()]*)\)$/i);
    const stripped = equivalent?equivalent[1].trim():raw.startsWith('(') && raw.endsWith(')') ? raw.slice(1, -1).trim() : raw;
    const match = stripped.match(gradePattern);
    if (!match) return { value: null, unit: null, raw, decimals: 0 };
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return { value: null, unit: null, raw, decimals: 0 };
    return { value, unit: match[2] === '%' ? 'percent' : 'average', raw,
      decimals: (match[1].split('.')[1] || '').length };
  }

  function courseKey(title, link, period = '') {
    // Cache busters and ephemeral navigation parameters must not reset history.
    const stable = new Set(['gradebooknumber', 'gradebookid', 'gb', 'gn', 'term', 'sc', 'schoolcode', 'section', 'sectionnumber', 'year']);
    try {
      const url = new URL(link || '', typeof document !== 'undefined' ? document.baseURI : 'https://example.invalid/');
      const params = [...url.searchParams].map(([key, value]) => [key.toLowerCase(), value])
        .filter(([key]) => stable.has(key)).sort(([a], [b]) => a.localeCompare(b));
      const courseId = params.some(([key]) => ['gradebooknumber', 'gradebookid', 'gb', 'gn', 'section', 'sectionnumber'].includes(key));
      if (courseId) return `url:${url.pathname.toLowerCase()}?${params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
    } catch { /* A non-URL link falls back to the visible course identity. */ }
    return `course:${cleanText(title).toLowerCase()}|period:${cleanText(period).toLowerCase()}`;
  }

  function readCards(root = document) {
    const elements = [...root.querySelectorAll('.classesSection > .Card')];
    if (root.matches?.('.classesSection > .Card')) elements.unshift(root);
    return elements.filter(element => !element.closest(OWNED)).map(element => {
      const titleElement = element.querySelector(':scope > a.TextHeading');
      const gradeElement = element.querySelector(':scope > .RightSide > .Grade');
      if (!titleElement || !gradeElement) return null;
      const title = titleElement.dataset.apOriginalTitle ?? cleanText(titleElement);
      const candidates = [...gradeElement.querySelectorAll(':scope > span')].filter(el => !el.closest(OWNED));
      const valueElement = candidates.find(el => parseGrade(cleanText(el)).value !== null) || null;
      const parsed = parseGrade(valueElement ? cleanText(valueElement) : '');
      const link = titleElement.getAttribute('href') || '';
      const period = cleanText(element.querySelector(':scope > .Period'));
      return { element, titleElement, gradeElement, valueElement, title, key: courseKey(title, link, period),
        ...parsed, link, period, schedulePeriod: CourseSchedule.detect(element) };
    }).filter(Boolean);
  }

  function ownRows(table) {
    return [...table.querySelectorAll('tr')].filter(row => row.closest('table') === table && !row.closest(OWNED));
  }

  function cellsOf(row) {
    return [...row.children].filter(el => /^(TD|TH)$/.test(el.tagName) && !el.matches(OWNED));
  }

  function suggest(headers) {
    const normalized = headers.map(header => cleanText(header).toLowerCase().replace(/[.():]/g, '').trim());
    const find = expression => normalized.findIndex(header => expression.test(header));
    const result = {
      name: find(/^(?:assignment(?: name| title| description)?|description|title|name|work)$/),
      earned: find(/^(?:score|points? earned|earned|marks? earned|points? received|pts? earned|points? achieved|grade)$/),
      possible: find(/^(?:points? possible|possible|maximum(?: points?)?|max(?: points?)?|out of|total points?|points? available|pts? possible)$/),
      category: find(/^(?:category|assignment category|assignment type|type)$/),
      id: find(/^(?:assignment\s*(?:#|number|id|no)|assn\s*(?:#|number|id|no)|#|id)$/),
      included: find(/^(?:included?|count(?:ed)?(?: in grade)?|status)$/),
    };
    const combined = find(/^(?:score\s*\/\s*(?:possible|points?|total)|earned\s*\/\s*possible|points?\s*\/\s*possible|score\s+out of\s+points?)$/);
    if (combined >= 0) result.earned = result.possible = combined;
    // Bare "Points" commonly means possible points; require mapper confirmation.
    if (result.possible < 0) result.possible = find(/^(?:points?|pts?)$/);
    return result;
  }

  function listTables(root = document) {
    const tables = [...root.querySelectorAll('table')];
    if (root.matches?.('table')) tables.unshift(root);
    return tables.flatMap((element, index) => {
      if (element.closest(OWNED)) return [];
      if (element.matches('.GradebookDetailsTable')) {
        const header = element.querySelector('thead tr');
        if (!header) return [];
        const headers = cellsOf(header).map(cleanText), suggested = suggest(headers);
        suggested.possible = suggested.earned;
        suggested.included = headers.findIndex(h => /^grading complete$/i.test(h));
        return [{element,index,label:'Aeries assignment details (card or table view)',headers,suggested,headerRowIndex:0,
          rows:element.querySelectorAll('tr.assignment-info').length,nativeAeries:true}];
      }
      const rows = ownRows(element);
      let best = null;
      rows.slice(0, 8).forEach((row, headerRowIndex) => {
        const cells = cellsOf(row);
        if (!cells.length || cells.some(cell => cell.querySelector('table'))) return;
        const headers = cells.map(cleanText);
        const suggested = suggest(headers);
        if (suggested.name < 0 || (suggested.earned < 0 && suggested.possible < 0)) return;
        let rank = Object.values(suggested).filter(value => value >= 0).length;
        if (cells.some(cell => cell.tagName === 'TH')) rank += 1;
        if (!best || rank > best.rank) best = { headers, suggested, headerRowIndex, rank };
      });
      if (!best) return [];
      const { headers, suggested, headerRowIndex } = best;
      // A single score column may contain literal "earned / possible" values.
      if (suggested.earned >= 0 && suggested.possible < 0) {
        const hasPair = rows.slice(headerRowIndex + 1).some(row => parsePair(cleanText(cellsOf(row)[suggested.earned])));
        if (hasPair) suggested.possible = suggested.earned;
      }
      const caption = cleanText(element.querySelector(':scope > caption'));
      const label = caption || cleanText(element.getAttribute('aria-label')) || `Assignment table ${index + 1}`;
      return [{ element, index, label, headers, suggested, headerRowIndex, rows: Math.max(0, rows.length - headerRowIndex - 1) }];
    });
  }

  function parseScalar(text) {
    const cleaned = cleanText(text);
    if (!scalarPattern.test(cleaned)) return null;
    const value = Number(cleaned.replace(/,/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  // Aeries can render a teacher's mark with its numeric equivalent, e.g.
  // A+ (10) / 10 or A+ (10 / 10). Never infer a score from the letter itself.
  function scoreNumber(text) {
    const raw=cleanText(text),direct=parseScalar(raw);
    if(direct!==null)return direct;
    const equivalent=raw.match(/^(?:[a-z][a-z +−-]*\s*)?\(([^()]*)\)$/i);
    return equivalent?parseScalar(equivalent[1]):null;
  }
  function wholeScoreWrapped(raw) {
    if(!raw.startsWith('(') || !raw.endsWith(')'))return false;
    let depth=0;
    for(let i=0;i<raw.length;i++){
      if(raw[i]==='(')depth++;
      if(raw[i]===')')depth--;
      if(depth===0 && i<raw.length-1)return false;
      if(depth<0)return false;
    }
    return depth===0;
  }
  function parsePair(text) {
    let raw=cleanText(text);
    const equivalent=raw.match(/^[a-z][a-z +−-]*\s*\(([^()]*\/[^()]*)\)$/i);
    if(equivalent)raw=equivalent[1];
    const parts = raw.split(/\s*\/\s*|\s+out of\s+/i);
    if (parts.length !== 2) return null;
    const earned = scoreNumber(parts[0]);
    const possible = parseScalar(parts[1]);
    // An ungraded pair still supplies real possible points, never a zero score.
    if (possible === null) return null;
    return { earned, possible };
  }

  function parseDueDate(text) {
    // Aeries uses US month/day/year. Validate calendar fields without UTC parsing,
    // which can shift a due date to the previous day in the student's time zone.
    const raw = cleanText(text);
    const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!us && !iso) return '';
    const year = Number(us ? us[3] : iso[1]), month = Number(us ? us[1] : iso[2]), day = Number(us ? us[2] : iso[3]);
    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return '';
    const date = new Date(year, month - 1, day, 12);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  function assignmentLinkId(row) {
    for (const anchor of row.querySelectorAll('a[href]')) {
      if (anchor.closest(OWNED)) continue;
      try {
        const url = new URL(anchor.getAttribute('href'), row.ownerDocument.baseURI);
        for (const [key, value] of url.searchParams) {
          if (/^(?:assignmentnumber|assignmentid|assignment|an|aid)$/i.test(key) && value) return value;
        }
      } catch { /* Ignore action links and malformed URLs. */ }
    }
    return '';
  }

  function readTable(tableInfo, mapping = tableInfo.suggested) {
    if (tableInfo.nativeAeries) return readAeriesTable(tableInfo);
    const assignments = [], issues = [];
    const table = tableInfo.element;
    const width = tableInfo.headers.length;
    const mapped = {};
    for (const name of ['name', 'earned', 'possible', 'category', 'id', 'included']) {
      const raw = mapping?.[name];
      mapped[name] = raw !== '' && raw !== null && raw !== undefined && Number.isInteger(Number(raw)) ? Number(raw) : -1;
      if (mapped[name] < -1 || mapped[name] >= width) mapped[name] = -1;
    }
    if (mapped.name < 0 || mapped.earned < 0 || mapped.possible < 0) {
      return { assignments, issues: ['Map an assignment name, earned points, and possible points before importing. A combined score column can serve as both point columns.'] };
    }
    const occurrences = new Map();
    let ungradedCount = 0, excludedCount = 0, shapeCount = 0, duplicateIdCount = 0;
    const rows = ownRows(table).slice(tableInfo.headerRowIndex + 1);
    for (const sourceRow of rows) {
      if (sourceRow.closest('tfoot')) continue;
      const cells = cellsOf(sourceRow);
      if (cells.length < width || cells.some(cell => cell.colSpan > 1 || cell.rowSpan > 1 || cell.querySelector('table'))) {
        if (cleanText(sourceRow)) shapeCount += 1;
        continue;
      }
      const text = key => mapped[key] >= 0 ? cleanText(cells[mapped[key]]) : '';
      const name = text('name');
      if (!name || /^(?:total|totals|subtotal|average|category total|overall grade|final grade)$/i.test(name)) continue;
      if (cells.every(cell => cell.tagName === 'TH')) continue;
      if (cells.map(cleanText).every((value, i) => value === tableInfo.headers[i])) continue;
      const category = text('category') || 'Uncategorized';
      const earnedRaw = text('earned');
      const possibleRaw = text('possible');
      let earned, possible;
      if (mapped.earned === mapped.possible) {
        const pair = parsePair(earnedRaw);
        earned = pair?.earned ?? null;
        possible = pair?.possible ?? null;
      } else {
        earned = parseScalar(earnedRaw);
        possible = parseScalar(possibleRaw);
      }
      // Only explicit status fields / score markers can exclude an assignment.
      // A title such as "Missing Angles" must not be interpreted as a status.
      const statusCell = mapped.included >= 0 ? cells[mapped.included] : null;
      const statusText = text('included');
      const checkbox = statusCell?.querySelector('input[type="checkbox"]');
      const marker = `${earnedRaw} ${possibleRaw} ${statusText}`;
      const excluded = checkbox ? !checkbox.checked : /\b(?:excluded|excused|exempt|not included|not counted|do not count|does not count|dropped)\b/i.test(marker)
        || /^(?:no|false|0|n)$/i.test(statusText) || /^(?:EX|EXC|NA|N\/A)$/i.test(earnedRaw);
      const ungraded = earned === null || possible === null || possible < 0
        || /\b(?:not graded|ungraded|not scored|pending grading)\b/i.test(statusText);
      if (possible !== null && possible < 0) possible = null;
      const included = !excluded && !ungraded;
      const status = excluded ? 'excluded' : ungraded ? 'ungraded' : 'graded';
      if (excluded) excludedCount += 1;
      else if (ungraded) ungradedCount += 1;
      const explicitId = text('id') || assignmentLinkId(sourceRow);
      const baseId = explicitId ? `id:${explicitId}` : `name:${name.toLowerCase()}|category:${category.toLowerCase()}`;
      const occurrence = (occurrences.get(baseId) || 0) + 1;
      occurrences.set(baseId, occurrence);
      if (explicitId && occurrence > 1) duplicateIdCount += 1;
      const id = `${baseId}|occurrence:${occurrence}`;
      assignments.push({ id, name, category, earned, possible, included, sourceRow,
        sourceCell: cells[mapped.earned], sourceNameCells: [cells[mapped.name]], status });
    }
    if (ungradedCount) issues.push(`${ungradedCount} row(s) lack a usable numeric score or possible points and will be excluded; no missing score was converted to zero.`);
    if (excludedCount) issues.push(`${excludedCount} explicitly excluded or excused row(s) will not count.`);
    if (shapeCount) issues.push(`${shapeCount} merged, nested, or incomplete row(s) were skipped. Check the table preview before confirming.`);
    if (duplicateIdCount) issues.push('Repeated assignment IDs were kept as separate rows. Verify they are distinct assignments before confirming.');
    if (!assignments.length) issues.push('No assignment rows could be read with this mapping.');
    return { assignments, issues };
  }

  function currentCourse(root = document) {
    const menu=root.querySelector('select[id$="_dlGN"]');
    if(!menu || !menu.value)return null;
    const parts=menu.value.split('_');
    if(parts.length<4)return null;
    const label=cleanText(menu.selectedOptions[0]);
    const title=label.replace(/^\d+\s*-\s*/, '').replace(/-\s*(?:Fall|Spring|Summer|Year|Semester|Quarter)\b.*$/i,'').trim();
    return {title,gradebook:parts[0],term:parts[1],school:parts[3],period:label.match(/^\d+/)?.[0]||'',
      link:`Widgets/ClassSummary/RedirectToGradebook?GradebookNumber=${encodeURIComponent(parts[0])}&Term=${encodeURIComponent(parts[1])}&SC=${encodeURIComponent(parts[3])}`};
  }
  function isFourPointCourse(title) {
    return /^surv(?:ey)?\s+comp(?:osition)?[\s/]+lit/i.test(cleanText(title));
  }
  function parseCourseGrade(text,fourPoint=false) {
    const raw=cleanText(text),grade=parseGrade(raw);
    if(fourPoint && grade.value===null && parseScalar(raw)!==null)
      return {value:parseScalar(raw),unit:'average',raw,decimals:(raw.split('.')[1]||'').length};
    return grade;
  }
  function readAeriesRules(root = document) {
    const weights={}, categories=[];
    let official=null,officialUnit=null,officialDecimals=2;
    const fourPoint=isFourPointCourse(currentCourse(root)?.title||'');
    for(const row of root.querySelectorAll('tr[id*="DataSummary"][id$="_trSummary"]')){
      const name=cleanText(row.querySelector('[id$="_tdDESC"]'));
      const pct=parseGrade(cleanText(row.querySelector('[id$="_tdPctOfGrade"]')));
      const gradeRaw=cleanText(row.querySelector('[id$="_tdPCT"]'));
      const grade=parseCourseGrade(gradeRaw,fourPoint);
      if(/^total$/i.test(name)){official=grade.value;officialUnit=grade.unit;officialDecimals=grade.decimals;continue;}
      if(!name)continue;
      if(pct.value!==null)weights[name]=pct.value;
      categories.push({name,earned:parseScalar(cleanText(row.querySelector('[id$="_tdPTS"]'))),possible:parseScalar(cleanText(row.querySelector('[id$="_tdMX"]'))),
        grade:grade.value,unit:grade.unit,decimals:grade.decimals});
    }
    const averageMaximum=fourPoint || officialUnit==='average'?4:null;
    const legend=cleanText(root.querySelector('[id$="_lblMinMaxLegend"]'));
    const floor=legend.match(/Min Score threshold is\s*([\d.]+)%/i),ceiling=legend.match(/Max Score threshold is\s*([\d.]+)%/i);
    return {mode:Object.keys(weights).length?'weighted':'points',weights,replacements:[],averageMaximum,
      scoreFloor:floor?Number(floor[1]):null,scoreCeiling:ceiling?Number(ceiling[1]):null,categories,official,officialUnit,officialDecimals};
  }
  function assignmentGrade(assignment) {
    const posted=parseGrade(cleanText(assignment.sourceRow?.querySelector('[id$="_tdPerc"]')));
    if(assignment.scoreUnit==='average')return {value:posted.unit==='average'?posted.value:assignment.earned,unit:'average'};
    return {value:posted.value??(assignment.earned/assignment.possible*100),unit:posted.unit||'percent'};
  }
  function readRawScoreMetadata(row, headers = [], cardRow = null) {
    // "Complete" is the raw count in Aeries. "Grading Complete" is a Boolean,
    // and the ordinary Score denominator is the assignment's gradebook weight.
    const labelPattern=/^(?:complete|raw score|number correct|#\s*correct)\s*:?[\s]*$/i;
    const labeledPattern=/^(?:complete|raw score|number correct|#\s*correct)\s*:?\s*(.*)$/i;
    const candidates=[],rawLocations=[];
    function fieldText(node) {
      if(!node)return '';
      if(node.nodeType===3)return node.nodeValue||'';
      if(node.nodeType!==1 || node.matches(`${OWNED},script,style`))return '';
      return cleanText([...node.childNodes].map(fieldText).join(' '));
    }
    function parseRawPair(text, allowPercentage = false) {
      // A separate percentage may follow the count, but dates and other fields
      // must never be interpreted as a raw-score pair.
      const pairText=allowPercentage?cleanText(text).replace(/\s+[+-]?[\d.,]+\s*%\s*$/,''):cleanText(text);
      const parts=pairText.split(/\s*\/\s*|\s+out of\s+/i);
      if(parts.length!==2)return;
      const earned=parseScalar(parts[0]),possible=parseScalar(parts[1]);
      if(possible===null || possible<=0 || (earned!==null && earned<0))return;
      if(earned===null && !/^(?:|[-—–])$/.test(parts[0]))return;
      return {earned,possible};
    }
    function addPair(text, fieldRoot) {
      const pair=parseRawPair(text,true);
      if(!pair)return;
      candidates.push(pair);
      // Only replace an element containing the numeric pair itself. The label,
      // percentage and card layout must stay in their native Aeries elements.
      if(!fieldRoot)return;
      for(let node of [fieldRoot,...fieldRoot.querySelectorAll('*')]){
        if(node.closest(`${OWNED},.TextHeading`))continue;
        // Reimports can see a hidden original plus an owned inline editor.
        // Keep reading the original, but mount back into its stable parent.
        const original=node.closest('.ap-lab-original');
        if(original)node=original.parentElement;
        if(!node || !fieldRoot.contains(node))continue;
        const exact=parseRawPair(fieldText(node));
        if(exact && exact.earned===pair.earned && exact.possible===pair.possible)rawLocations.push(node);
      }
    }
    const cells=cellsOf(row);
    const mapped=suggest(headers);
    const identityCells=[mapped.name,mapped.id,mapped.category].filter(index=>index>=0).map(index=>cells[index]).filter(Boolean);
    headers.forEach((header,index)=>{
      if(labelPattern.test(cleanText(header)))addPair(fieldText(cells[index]),cells[index]);
    });
    for(const root of [row,cardRow].filter(Boolean)){
      for(const node of [root,...root.querySelectorAll('span,div,td,dt,dd,label')]){
        if(node.closest(`${OWNED},.TextHeading`) || identityCells.some(cell=>cell.contains(node)))continue;
        const text=fieldText(node),labeled=text.match(labeledPattern);
        if(labeled && !labelPattern.test(text))addPair(labeled[1],node);
        if(!labelPattern.test(text))continue;
        // Support a label followed by its value, including a nested label
        // wrapper. Stop at the assignment container and never scan nearby
        // unlabeled scores merely because they contain a slash.
        let label=node;
        while(label.parentElement && label.parentElement!==root && labelPattern.test(fieldText(label.parentElement)))label=label.parentElement;
        const sibling=label.nextElementSibling;
        if(sibling && root.contains(sibling))addPair(fieldText(sibling),sibling);
        const parent=label.parentElement;
        if(parent && root.contains(parent)){
          const group=fieldText(parent).match(labeledPattern);
          if(group)addPair(group[1],parent);
        }
      }
    }
    const totals=new Set(candidates.map(pair=>pair.possible));
    if(totals.size!==1)return {rawEarned:null,rawPossible:null,rawScoreCells:[]};
    const earnedValues=new Set(candidates.map(pair=>pair.earned).filter(value=>value!==null));
    const uniqueLocations=[...new Set(rawLocations)];
    const rawScoreCells=uniqueLocations.filter(node=>!uniqueLocations.some(other=>other!==node && node.contains(other)));
    return {rawEarned:earnedValues.size===1?[...earnedValues][0]:null,rawPossible:[...totals][0],rawScoreCells};
  }
  function readAeriesTable(info) {
    const assignments=[],issues=[],doc=info.element.ownerDocument;
    const rules=readAeriesRules(doc);
    const dueIndex=info.headers.findIndex(h=>/^due date$/i.test(cleanText(h)));
    for(const row of info.element.querySelectorAll('tr.assignment-info')){
      const cells=cellsOf(row),score=row.querySelector('td[id$="_tdScore"]');
      if(cells.length<4 || !score)continue;
      const idCell=cells[0].cloneNode(true);idCell.querySelectorAll('.assignment-details,[data-ap-owned]').forEach(n=>n.remove());
      const number=cleanText(idCell),name=cleanText(cells[1]),category=cleanText(cells[2]);
      const raw=cleanText(score);
      const wholeWrapped=wholeScoreWrapped(raw);
      const scoreText=wholeWrapped?raw.slice(1,-1).trim():raw;
      const pair=parsePair(scoreText);
      const completedIndex=info.headers.findIndex(h=>/^grading complete$/i.test(h));
      const completed=completedIndex>=0?cleanText(cells[completedIndex]):'';
      const excluded=/\b(?:EX|EXC|excused|exempt|excluded|dropped)\b/i.test(raw) || wholeWrapped;
      const earned=pair?.earned??(rules.averageMaximum?scoreNumber(scoreText):null);
      const possible=rules.averageMaximum??pair?.possible??null;
      // "Grading Complete: No" is not an exclusion: the supplied Totals counts a numeric score on such a row.
      const included=!excluded && earned!==null && possible!==null;
      const cardScore=doc.getElementById(score.id.replace(/_tdScore$/,'_scoreData'))?.querySelector('.ScoreCard');
      const cardRow=cardScore?.closest('tr.CardView');
      const rawScore=readRawScoreMetadata(row,info.headers,cardRow);
      const dueRaw=dueIndex>=0?cleanText(cells[dueIndex]):'';
      assignments.push({id:`aeries:${number}`,name,category,dueDate:parseDueDate(dueRaw),dueRaw,earned,possible,...rawScore,included,scoreUnit:rules.averageMaximum?'average':'percent',status:excluded?'excluded':included?'graded':'ungraded',sourceRow:row,sourceCell:score,
        sourceCells:[score,cardScore].filter(Boolean),sourceRows:[row,cardRow].filter(Boolean),
        sourceNameCells:[cells[1],cardRow?.querySelector('.TextHeading')].filter(Boolean)});
    }
    if(assignments.some(a=>!a.included))issues.push('Blank or excluded scores do not count. A numeric score can count even when Grading Complete says No, as in Aeries Totals.');
    if(Object.keys(rules.weights).length)issues.push('Category weights were read from Aeries Totals and will be imported with these rows.');
    if(rules.scoreFloor!==null || rules.scoreCeiling!==null)issues.push(`Aeries assignment score limits detected: ${rules.scoreFloor??'no minimum'}% to ${rules.scoreCeiling??'no maximum'}%. These will apply to hypothetical scores.`);
    if(doc.querySelector('input[id$="_chkMissingAssignmentOnly"]')?.checked)issues.push('Show only missing assignments is enabled. Turn it off and reimport to calculate the full gradebook.');
    return {assignments,issues,rules};
  }
  return { readCards, listTables, readTable, parseGrade, courseKey, cleanText, currentCourse, readAeriesRules, parseDueDate, isFourPointCourse, assignmentGrade, parseCourseGrade, readRawScoreMetadata };
})();
  // Period-to-course matching stays local; no class names go to either schedule service.
  const CourseSchedule = (() => {
    function normalize(value) {
      const match = /^(?:(?:period|per\.?|pd\.?|p)\s*[:#-]?\s*)?(\d{1,2}[A-Z]?)$/i.exec(String(value ?? '').trim());
      if (!match || Number.parseInt(match[1], 10) > 20) return null;
      return match[1].toUpperCase().replace(/^0(?=\d)/, '');
    }
    function fromText(value, explicit = false) {
      const text = String(value ?? '').replace(/\s+/g, ' ').trim();
      const exact = normalize(text);
      if (exact !== null) return explicit || /^(?:period|per\.?|pd\.?|p)\s*[:#-]?\s*\d/i.test(text) ? exact : null;
      if (/\b(?:grading|marking|reporting)\s+period\b/i.test(text)) return null;
      // Require an explicit label, and do not turn "Period 1 / 3" into Period 1.
      const label = /^(?:period|per\.?|pd\.?|p)\s*[:#-]?\s*(\d{1,2}[A-Z]?)(?=$|[\s·|,;/(-])/i.exec(text);
      if (!label) return null;
      const remainder = text.slice(label[0].length).trim();
      if (/\b(?:period|per\.?|pd\.?|p)\s*[:#-]?\s*\d/i.test(remainder)) return null;
      if (remainder && !/^[·|,;/(-]*\s*(?:room|teacher|instructor)\b/i.test(remainder)) return null;
      return normalize(label[1]);
    }
    function detect(element) {
      const candidates = new Set();
      const add = (text, explicit) => {const period = fromText(text, explicit); if (period !== null) candidates.add(period);};
      const fields = '.Period,.period,.ClassPeriod,[data-period],[data-class-period],[data-period-number],[id$="_lblPeriod"],[id$="_tdPeriod"]';
      for (const node of [element, ...element.querySelectorAll(fields)]) {
        if (node.closest('[data-ap-owned]')) continue;
        for (const attr of ['data-period', 'data-class-period', 'data-period-number']) {
          const value = node.getAttribute(attr); if (value !== null) add(value, true);
        }
        if (node !== element) add(node.textContent, true);
        for (const attr of ['aria-label', 'title']) {
          const value = node.getAttribute(attr); if (value !== null) add(value, false);
        }
      }
      // Some Aeries versions put the label in ordinary nested spans.
      for (const node of element.querySelectorAll('span,div,td')) {
        if (node.closest('[data-ap-owned],.RightSide,.TextHeading')) continue;
        add(node.textContent, false);
      }
      return candidates.size === 1 ? [...candidates][0] : null;
    }
    function resolve(period, roster) {
      const wanted = normalize(period);
      if (wanted === null) return {course: null, ambiguous: false};
      const matches = new Map();
      for (const course of roster) if (normalize(course.period) === wanted) matches.set(course.key, course);
      return {course: matches.size === 1 ? [...matches.values()][0] : null, ambiguous: matches.size > 1};
    }
    function title(slot, roster, nicknames = true) {
      if (slot.period === null) return slot.label;
      const {course} = resolve(slot.period, roster);
      const name = course ? (nicknames && course.nickname ? course.nickname : course.title) : '';
      return name ? `${name} · Period ${slot.period}` : `Period ${slot.period}`;
    }
    return {normalize, fromText, detect, resolve, title};
  })();

  const AP_KEY = 'aeries-playground-v1';
  const clone = x => JSON.parse(JSON.stringify(x));
  const defaults = {
    enabled: true, nicknames: true, bars: true, impacts: true,
    categorySpotlight: true, weightMap: true, dashboardColors: true, numericGrades: false, overallGrade: true, nextClass: false,
    scheduleNetworkConsent: false,
    precise: true, detailsColors: true, profile: '', year: '',
    cutoffs: [95,85,75], averageCutoffs: [3.7,3.1,2.5], colors: ['#1f1f7f','#1f7f1f','#c05600','#7f1f1f']
  };
  let db = {version:1, settings:clone(defaults), profiles:{}};
  let storageError = '';
  try {
    const v = GM_getValue(AP_KEY, null);
    if (v && v.version === 1 && v.settings && typeof v.settings === 'object' && !Array.isArray(v.settings)
      && v.profiles && typeof v.profiles === 'object' && !Array.isArray(v.profiles)) {
      const savedSettings=v.settings;
      db = v; db.settings = {...clone(defaults), ...Object.fromEntries(Object.keys(defaults).filter(key=>Object.hasOwn(savedSettings,key)).map(key=>[key,savedSettings[key]]))};
      for (const key of Object.keys(defaults).filter(k=>typeof defaults[k]==='boolean')) if (typeof db.settings[key] !== 'boolean') db.settings[key] = defaults[key];
      for (const key of ['cutoffs','averageCutoffs']) if (!validCutoffs(db.settings[key])) db.settings[key] = clone(defaults[key]);
      if (!Array.isArray(db.settings.colors) || db.settings.colors.length !== 4 || db.settings.colors.some(c => !/^#[0-9a-f]{6}$/i.test(c))) db.settings.colors = clone(defaults.colors);
      if (typeof db.settings.profile !== 'string' || !db.settings.profile.trim()) db.settings.profile = defaults.profile;
      if (typeof db.settings.year !== 'string' || !db.settings.year.trim()) db.settings.year = defaults.year;
    }
  } catch { storageError = 'Could not load saved settings. This visit uses defaults.'; }
  // Older installs did not ask for schedule-network consent. An old enabled
  // widget is not consent; the user must enable it using the explained toggle.
  if(db.settings.scheduleNetworkConsent!==true)db.settings.nextClass=false;
  let observedResetMarker=typeof db.resetMarker==='string'?db.resetMarker:'';
  if(JSON.stringify(db.settings.colors)===JSON.stringify(['#1f1f7f','#1f7f1f','#7f7f1f','#7f1f1f']))db.settings.colors=clone(defaults.colors);
  // Migrate the former defaults once, including previously discovered courses.
  // Values customized away from those defaults remain intact.
  const defaultsMigrated=(db.defaultsRevision||0)<2;
  if(defaultsMigrated){
    if(JSON.stringify(db.settings.averageCutoffs)===JSON.stringify([3.8,3.4,3]))
      db.settings.averageCutoffs=clone(defaults.averageCutoffs);
    for(const p of Object.values(db.profiles)){
      if(!p?.courses || typeof p.courses!=='object')continue;
      for(const c of Object.values(p.courses)){
        if(!c || typeof c!=='object')continue;
        if(c.minimum===0){
          const average=c.scale==='average'||GradeDOM.isFourPointCourse(c.title||'');
          c.minimum=Math.min(average?1:50,(Number.isFinite(c.maximum)&&c.maximum>0?c.maximum:average?4:100)/2);
        }
      }
    }
    db.defaultsRevision=2;
  }
  function validCutoffs(v) { return Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(n) && n >= 0) && v[0] > v[1] && v[1] > v[2]; }
  let saveTimer,savePending=false;
  function persist() {
    clearTimeout(saveTimer);saveTimer=undefined;savePending=true;
    try {
      const stored=GM_getValue(AP_KEY,null);
      const marker=typeof stored?.resetMarker==='string'?stored.resetMarker:'';
      if(marker!==observedResetMarker){
        storageError='Saved settings were cleared in another tab. Reload this tab before saving.';
        savePending=false;return false;
      }
      GM_setValue(AP_KEY,clone(db));observedResetMarker=typeof db.resetMarker==='string'?db.resetMarker:'';
      storageError='';savePending=false;return true;
    } catch { storageError = 'Could not save to browser storage. Changes work for this visit only.'; return false; }
  }
  function queueSave() { clearTimeout(saveTimer);savePending=true;saveTimer=setTimeout(persist,700); }
  function clearSavedSettings(){
    const previous=db;
    db={version:1,settings:{...clone(defaults),enabled:false},profiles:{},defaultsRevision:2,blankIconsRevision:1,
      resetMarker:Date.now()+'-'+Math.random().toString(36).slice(2)};
    if(!persist()){db=previous;return false;}
    abortScheduleRequests();closeGradeLab();restoreTitles();selectedCourse='';detectedCourseKey='';
    annotationSources.clear();nativePageState=null;coursesFormDirty=false;
    scan();return true;
  }
  if(defaultsMigrated)queueSave();
  // Remove the former automatically generated course icons once. Distinct
  // custom icons stay intact; new courses never receive an inferred icon.
  if(!db.blankIconsRevision){
    for(const p of Object.values(db.profiles))for(const c of Object.values(p?.courses||{})){
      if(!c||typeof c!=='object')continue;
      const t=c.title||'';
      const former=/calc|math/i.test(t)?'∫':/biology/i.test(t)?'🧬':/comp.*sci|computer/i.test(t)?'⌨':/spanish/i.test(t)?'💬':/comp.*lit|english/i.test(t)?'📖':/\bpe\b|physical/i.test(t)?'🏃':'📚';
      if(c.icon===former)c.icon='';
    }
    db.blankIconsRevision=1;queueSave();
  }
  function profileKey() { return 'p:' + JSON.stringify([db.settings.profile.trim(),db.settings.year.trim()]); }
  function profile() {
    const k = profileKey();
    if (!db.profiles[k] || typeof db.profiles[k] !== 'object' || Array.isArray(db.profiles[k])) db.profiles[k] = {};
    const p = db.profiles[k];
    if (!p.courses || typeof p.courses !== 'object' || Array.isArray(p.courses)) p.courses = {};
    for(const [key,saved] of Object.entries(p.courses)){
      const old=saved && typeof saved==='object' && !Array.isArray(saved)?saved:{};
      const base=courseDefaults(typeof old.title==='string'&&old.title.trim()?old.title:'Saved course');
      const c={...base,...old};
      for(const field of ['title','nickname','icon'])if(typeof c[field]!=='string')c[field]=base[field];
      if(!['average','percent'].includes(c.scale))c.scale=base.scale;
      if(!Number.isFinite(c.maximum)||c.maximum<=0)c.maximum=c.scale==='average'?4:100;
      if(!Number.isFinite(c.minimum)||c.minimum>=c.maximum)c.minimum=Math.min(c.scale==='average'?1:50,c.maximum/2);
      if(c.customCutoffs!==null&&!validCutoffs(c.customCutoffs))c.customCutoffs=null;
      if(typeof c.overallIncluded!=='boolean')c.overallIncluded=true;
      c.schedulePeriod=CourseSchedule.normalize(c.schedulePeriod) || '';
      // Keep existing object identities: open course controls may reference them.
      if(old===saved)Object.assign(old,c);else p.courses[key]=c;
    }
    return p;
  }
  let cards = [], activeTab = 'courses', selectedCourse = '', detectedCourseKey = '';
  let renderedCourseKeys='',coursesFormDirty=false;
  const titleOriginals = new Map();
  const annotationSources = new Map();
  let nativeStatus = null;
  let nativePageState = null;
  let nativeBanner = null;
  const widgetHosts = new Map();
  const clean = x => GradeDOM.cleanText(String(x ?? ''));
  const fmt = (x, precision = db.settings.precise ? 8 : 2) => GradeMath.format(x, precision);
  function el(tag, text, attrs = {}) {
    const n = document.createElement(tag); if (text !== null && text !== undefined) n.textContent = text;
    // Local controls must not join Aeries' surrounding ASP.NET form or its
    // constraint validation. This ID deliberately has no associated form.
    if(['input','select','button','textarea'].includes(tag.toLowerCase()))n.setAttribute('form','ap-playground-local-controls');
    for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,String(v));
    return n;
  }
  function button(text,fn,cls='') { const b=el('button',text,{type:'button',class:cls}); b.addEventListener('click',fn); return b; }
  function field(label,input) { const l=el('label',null,{class:'ap-field'}); l.append(el('span',label),input); return l; }
  function input(value,type='text') { const n=el('input',null,{type}); n.value=String(value ?? ''); return n; }
  function note(text,cls='ap-muted') { return el('p',text,{class:cls}); }
  function courseDefaults(title) {
    const avg = GradeDOM.isFourPointCourse(title);
    const icon = '';
    return {title,nickname:'',icon,schedulePeriod:'',minimum:avg?1:50,maximum:avg?4:100,scale:avg?'average':'percent',customCutoffs:null,overallIncluded:true};
  }
  function courseFor(card) {
    const p=profile(); if (!Object.hasOwn(p.courses,card.key)) { p.courses[card.key]=courseDefaults(card.title); queueSave(); }
    const c=p.courses[card.key];
    if (c.title !== card.title) {c.title=card.title;queueSave();}
    if (card.unit==='average' && c.scale!=='average') {c.scale='average';c.minimum=1;c.maximum=4;queueSave();}
    return c;
  }
  function cutoffs(c) { return validCutoffs(c.customCutoffs)?c.customCutoffs:(c.scale==='average'?db.settings.averageCutoffs:db.settings.cutoffs); }
  function colorFor(value,c) { let n=cutoffs(c).findIndex(v=>value>=v);return db.settings.colors[n<0?3:n]; }
  const dashboardPainted=new Map(),dashboardMarks=new Map();
  function dashboardGradeNumber(value,c){
    if(!Number.isFinite(value))return null;
    const band=cutoffs(c).findIndex(threshold=>value>=threshold);
    return band<0?1:4-band;
  }
  function dashboardColor(node,color){
    if(!node || node.closest('[data-ap-owned]'))return;
    const value=node.style.getPropertyValue('color'),priority=node.style.getPropertyPriority('color');
    let saved=dashboardPainted.get(node);
    if(saved && value===saved.applied && priority==='important' && saved.desired===color)return;
    if(!saved || value!==saved.applied || priority!=='important')saved={value,priority};
    node.style.setProperty('color',color,'important');
    saved.applied=node.style.getPropertyValue('color');saved.desired=color;dashboardPainted.set(node,saved);
  }
  function dashboardMarkNode(card){
    // Aeries places the letter before its separate percentage/average span.
    // Find that text node without replacing the container or its children.
    const walker=document.createTreeWalker(card.gradeElement,NodeFilter.SHOW_TEXT),candidates=[];
    let node;
    while((node=walker.nextNode())){
      if(card.valueElement?.contains(node) || node.parentElement?.closest('[data-ap-owned]'))continue;
      if(/^(?:[A-F][+−–-]?|[PNSUI]|CR|NC|INC|[1-4])$/i.test(node.data.trim()))candidates.push(node);
    }
    return candidates.length===1?candidates[0]:null;
  }
  function dashboardOriginalMark(card){
    // Numeric display mode edits the native mark in place. Read the saved
    // Aeries mark only while our replacement is still present; a newer native
    // update must win. Never infer a letter from a percentage or thresholds.
    const node=dashboardMarkNode(card);
    if(node){
      const saved=dashboardMarks.get(node);
      return GradeDOM.cleanText(saved && node.data===saved.applied?saved.original:node.data);
    }
    // Also support a letter and its numeric equivalent sharing one element,
    // e.g. "A− (93%)". Reject ambiguous or non-grade text instead of guessing.
    const raw=GradeDOM.cleanText(card.valueElement || card.gradeElement);
    const match=raw.match(/^([ABCDF][+−–-]?)\s*\([^()]*\)$/i);
    return match && GradeDOM.parseGrade(raw).value!==null?match[1]:'';
  }
  function refreshDashboardGrades(){
    const colored=new Set(),numbered=new Set();
    if(db.settings.enabled)for(const card of cards){
      if(!Number.isFinite(card.value))continue;
      const c=courseFor(card),number=dashboardGradeNumber(card.value,c);
      if(db.settings.dashboardColors){
        const color=colorFor(card.value,c);
        for(const part of [card.titleElement,card.gradeElement].filter(Boolean)){
          for(const node of [part,...part.querySelectorAll('*')]){
            if(node.closest('[data-ap-owned]'))continue;
            dashboardColor(node,color);colored.add(node);
          }
        }
      }
      if(db.settings.numericGrades){
        const node=dashboardMarkNode(card);
        if(node){
          let saved=dashboardMarks.get(node);
          if(!saved || node.data!==saved.applied)saved={original:node.data};
          const applied=node.data.replace(/\S+/,String(number));
          if(node.data!==applied)node.data=applied;
          saved.applied=applied;dashboardMarks.set(node,saved);numbered.add(node);
        }
      }
    }
    for(const [node,saved]of dashboardPainted)if(!colored.has(node)){
      if(node.isConnected && node.style.getPropertyValue('color')===saved.applied && node.style.getPropertyPriority('color')==='important'){
        if(saved.value)node.style.setProperty('color',saved.value,saved.priority);else node.style.removeProperty('color');
      }
      dashboardPainted.delete(node);
    }
    for(const [node,saved]of dashboardMarks)if(!numbered.has(node)){
      if(node.isConnected && node.data===saved.applied)node.data=saved.original;
      dashboardMarks.delete(node);
    }
  }
  // Two independent, equal-weight summaries of the current visible courses.
  // Neither is an official transcript GPA; posted marks are never persisted.
  const OverallMath = (() => {
    function rating(value, limits) {
      if (!Number.isFinite(value) || !Array.isArray(limits) || limits.length !== 3 ||
          !limits.every(n => Number.isFinite(n) && n >= 0) || !(limits[0] > limits[1] && limits[1] > limits[2])) return null;
      const band = limits.findIndex(limit => value >= limit);
      return band < 0 ? 1 : 4 - band;
    }
    function letterPoints(mark) {
      // This GPA intentionally ignores +/- and all Playground thresholds.
      // F is a counted zero; blank, pass/fail and numeric marks are not A–F.
      const match = typeof mark === 'string' ? mark.trim().match(/^([ABCDF])[+−–-]?$/i) : null;
      return match ? {A: 4, B: 3, C: 2, D: 1, F: 0}[match[1].toUpperCase()] : null;
    }
    function summarize(courses, limits, numericGrades = false) {
      const seen = new Set(), rows = [];
      for (const course of courses) {
        if (seen.has(course.key)) continue;
        seen.add(course.key);
        const score = numericGrades ? rating(course.value, course.cutoffs) : letterPoints(course.mark);
        rows.push({...course, score, counted: course.included !== false && score !== null});
      }
      const counted = rows.filter(row => row.counted);
      const total = counted.reduce((sum, row) => sum + row.score, 0);
      const average = counted.length ? total / counted.length : null;
      // Keep the average as the displayed value in BOTH modes. The overall
      // threshold band is separate and controls only the numeric-mode color.
      return {rows, count: counted.length, total, average, band: numericGrades ? rating(average, limits) : null};
    }
    return {rating, letterPoints, summarize};
  })();
  // Keep summaries in normal document flow, outside constrained dashboard tiles.
  // Native Aeries section rules must not size or position Playground panels.
  let summaryHost = null, summaryRoot = null;
  function summaryAnchor(section) {
    const boundary = section.closest('main,[role="main"],form') || document.body;
    let anchor = section, escapedTile = false, child = section;
    for (let node = section; node && node !== boundary; child = node, node = node.parentElement) {
      const style = getComputedStyle(node);
      // Stay INSIDE the page scroller and app shell. Their viewport-sized heights
      // are not dashboard tiles, and inserting beside them can hide the dashboard.
      if (node !== section && (/^(auto|scroll)$/.test(style.overflowY) ||
          node.querySelector('nav,aside,[role="navigation"],[role="banner"]'))) {
        if (anchor === node) anchor = child;
        break;
      }
      const positioned = /^(absolute|fixed)$/.test(style.position) ||
        style.cssFloat !== 'none' || style.transform !== 'none';
      if (positioned) {
        anchor = node.parentElement === boundary ? node : node.parentElement;
        escapedTile = true;
      } else if (node.matches('.grid-stack,.gridster,.masonry,.k-tilelayout,[data-role="tilelayout"]') ||
          /^(?:inline-)?grid$/.test(style.display) ||
          (/^(?:inline-)?flex$/.test(style.display) && style.flexDirection.startsWith('row') &&
            (escapedTile || node === section || node === section.parentElement))) {
        anchor = node;
        // A grid of course cards can still be inside a constrained native tile.
        // Inspect its parent before accepting this as the dashboard boundary.
        if (node !== section) escapedTile = true;
      } else if (escapedTile) {
        return anchor;
      } else if (node === section || node === section.parentElement) {
        // Only the class container itself can be a fixed-height tile. Do not
        // promote arbitrary outer wrappers just because their height is definite.
        const height = node.computedStyleMap?.().get('height')?.toString() || node.style.height;
        if (/(hidden|clip)/.test(style.overflowY) || style.maxHeight !== 'none' ||
            (height && !['auto','fit-content','max-content','min-content'].includes(height))) {
          anchor = node; escapedTile = true;
        }
      }
    }
    return anchor;
  }
  function mountSummary(panel, section, first = false) {
    if (!summaryHost) {
      summaryHost = el('div', null, {id: 'ap-dashboard-summaries', 'data-ap-owned': 'summaries'});
      summaryHost.style.cssText = 'display:block!important;position:static!important;float:none!important;clear:both;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;max-height:none!important;margin:0 0 14px!important;padding:0!important;box-sizing:border-box!important;grid-column:1 / -1;flex:0 0 auto!important;align-self:stretch;';
      summaryRoot = summaryHost.attachShadow({mode: 'open'});
      const style = el('style');
      style.textContent = ':host{font-family:inherit} .panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:12px;align-items:start;min-width:0} @media print{:host{display:none!important}}';
      summaryRoot.append(style, el('div', null, {class: 'panels'}));
    }
    const anchor = summaryAnchor(section);
    if (summaryHost.nextElementSibling !== anchor) anchor.before(summaryHost);
    const panels = summaryRoot.querySelector('.panels');
    if (panel.parentNode !== panels || (first && panels.firstElementChild !== panel)) {
      if (first) panels.prepend(panel); else panels.append(panel);
    }
  }
  function removeEmptySummaries() {
    if (summaryRoot && !summaryRoot.querySelector('.panels').childElementCount) {
      summaryHost.remove(); summaryHost = null; summaryRoot = null;
    }
  }
  let overallHost = null, overallSignature = '';
  function refreshOverallGrade() {
    const visibleCards = cards.filter(card => card.element.getClientRects().length > 0);
    const section = visibleCards[0]?.element.parentElement;
    if (!db.settings.enabled || !db.settings.overallGrade || !section) {
      overallHost?.remove(); overallHost = null; overallSignature = ''; removeEmptySummaries(); return;
    }
    const overallIsRating = db.settings.numericGrades;
    const limits = overallIsRating ? db.settings.averageCutoffs : null;
    const result = OverallMath.summarize(visibleCards.map(card => {
      const c = courseFor(card);
      return {key: card.key, title: c.nickname || card.title, value: card.value,
        mark: dashboardOriginalMark(card), cutoffs: overallIsRating ? cutoffs(c) : null,
        included: c.overallIncluded !== false};
    }), limits, overallIsRating);
    if (!overallHost) {
      overallHost = el('div', null, {id: 'ap-overall-card', role: 'region', 'data-ap-owned': 'overall', 'aria-label': 'Playground overall score'});
      overallHost.attachShadow({mode: 'open'});
    }
    overallHost.setAttribute('aria-label', overallIsRating ? 'Playground overall score' : 'Current-year GPA');
    mountSummary(overallHost, section, true);
    const signature = JSON.stringify([profileKey(), result, limits, db.settings.colors, db.settings.numericGrades]);
    if (signature === overallSignature) return;
    overallSignature = signature;
    const root = overallHost.shadowRoot;
    const wasOpen = root.querySelector('details')?.open || false;
    const focusedKey = root.activeElement?.dataset.course;
    const style = el('style');
    style.textContent = `:host{display:block;position:static;min-width:0;max-width:100%;font-family:inherit;margin:0;color:#24354b;overflow-wrap:anywhere}*{box-sizing:border-box}.card{border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;padding:12px 14px}.heading{display:flex;align-items:center;justify-content:space-between;gap:20px}.title{font-size:15px;font-weight:700}.heading>div:first-child{min-width:0}.score{flex-shrink:0;font-size:30px;font-weight:750;line-height:1}.sub{font-size:12px;color:#536981;margin-top:5px}details{font-size:13px;margin-top:8px}.calculation{max-height:min(220px,35vh);overflow:auto;overscroll-behavior:contain;padding-right:4px}summary{cursor:pointer;width:fit-content}p{margin:10px 0;line-height:1.5}.row{display:flex;align-items:center;gap:9px;padding:7px 0;border-top:1px solid #e2e8f0}.row input{margin:0}.name{flex:1;min-width:0;overflow-wrap:anywhere}.rating{font-weight:700}.muted{color:#536981;font-size:12px}input:focus-visible,summary:focus-visible{outline:2px solid #2563eb;outline-offset:3px}`;
    const card = el('div', null, {class: 'card'}), heading = el('div', null, {class: 'heading'});
    const title = el('div');
    title.append(el('div', overallIsRating ? 'Playground overall score' : 'Current-year GPA', {class: 'title'}),
      el('div', `${result.count} class${result.count === 1 ? '' : 'es'} included · Equal weight`, {class: 'sub'}));
    const displayScore = result.average === null ? '—' : fmt(result.average, 2);
    const scoreDescription = result.average === null ? 'No overall score' : overallIsRating
      ? `Overall average ${displayScore} out of 4${result.band === null ? '' : `; color indicates band ${result.band}`}`
      : `Current-year unweighted GPA ${displayScore} out of 4`;
    const score = el('div', displayScore, {class: 'score', 'aria-label': scoreDescription, title: scoreDescription});
    if (overallIsRating && result.band !== null) score.style.color = db.settings.colors[4 - result.band];
    heading.append(title, score); card.append(heading);
    const details = el('details'); details.open = wasOpen;
    details.append(el('summary', 'Calculation & included classes'));
    const calculation = el('div', null, {class: 'calculation', tabindex: '0', role: 'region', 'aria-label': 'Overall calculation and included classes'});
    if (overallIsRating) {
      const thresholds = `4 ≥ ${fmt(limits[0])}; 3 ≥ ${fmt(limits[1])}; 2 ≥ ${fmt(limits[2])}; otherwise 1.`;
      calculation.append(el('p', result.count ? `Each class becomes a 1–4 rating using its own thresholds. Average: ${result.total} ÷ ${result.count} = ${fmt(result.average)}. The displayed number stays an average; only its color indicates the overall band, using these thresholds: ${thresholds}` : 'Include a class with a posted numeric grade to see an overall average.'));
      calculation.append(el('p', 'This is your custom Playground average, not an official GPA. Ungraded and excluded classes do not count. Change the overall color cutoffs under Settings → Average ≥.', {class: 'muted'}));
    } else {
      calculation.append(el('p', result.count ? `Posted letter grades are averaged equally: A = 4, B = 3, C = 2, D = 1, F = 0. Plus/minus signs are ignored. Current-year GPA: ${result.total} ÷ ${result.count} = ${fmt(result.average)}.` : 'Include a class with a posted A–F letter grade to see your current-year GPA.'));
      calculation.append(el('p', 'This is an unweighted estimate from the courses currently shown in Aeries, not an official transcript GPA. Playground thresholds do not affect it. Classes without an A–F letter and excluded classes do not count; F counts as 0.', {class: 'muted'}));
    }
    for (const row of result.rows) {
      const label = el('label', null, {class: 'row'}), include = input('', 'checkbox');
      include.checked = row.included !== false; include.dataset.course = row.key;
      include.setAttribute('aria-label', `Include ${row.title} in ${overallIsRating ? 'the overall average' : 'the current-year GPA'}`);
      include.addEventListener('change', () => {
        const c = profile().courses[row.key]; if (!c) return;
        c.overallIncluded = include.checked; persist(); refreshOverallGrade();
      });
      const rowText = row.score === null ? (overallIsRating ? 'No numeric grade' : 'No A–F grade')
        : overallIsRating ? String(row.score) : `${row.mark} → ${fmt(row.score, 2)}`;
      label.append(include, el('span', row.title, {class: 'name'}), el('span', rowText, {class: row.score === null ? 'muted' : 'rating'}));
      calculation.append(label);
    }
    details.append(calculation);
    card.append(details); root.replaceChildren(style, card);
    if (focusedKey) [...root.querySelectorAll('input')].find(n => n.dataset.course === focusedKey)?.focus({preventScroll: true});
  }

  const pageStyle=el('style',null,{'data-ap-owned':'style'});
  pageStyle.textContent=`
    .classesSection > .Card > a.TextHeading[data-ap-label] {font-size:0 !important;}
    .classesSection > .Card > a.TextHeading[data-ap-label]::after {content:attr(data-ap-label);font-size:var(--ap-title-size,20px);line-height:1.3;}
    .ap-page-impact {display:inline-block;font-family:inherit;font-size:11px;line-height:1.4;color:#234d78;background:#eff6ff;border:1px solid #bfdbfe;border-radius:5px;padding:2px 5px;margin-left:6px;}
    tr[data-ap-weight-jump] {outline:3px solid #2563eb !important;outline-offset:-3px !important;}
    @media print {[data-ap-owned="widget"],.ap-page-impact {display:none !important;} }
  `;
  document.head.append(pageStyle);
  function restoreTitles() {
    for (const [title,original] of titleOriginals) {
      title.removeAttribute('data-ap-label');title.style.removeProperty('--ap-title-size');
      for (const name of ['title','aria-label']) original[name]===null?title.removeAttribute(name):title.setAttribute(name,original[name]);
    }
    titleOriginals.clear();
  }
  function titleStyle(card,c) {
    const title=card.titleElement;
    if (!db.settings.nicknames || !(c.nickname || c.icon)) return;
    if (!titleOriginals.has(title)) {
      titleOriginals.set(title,{title:title.getAttribute('title'),'aria-label':title.getAttribute('aria-label')});
      title.style.setProperty('--ap-title-size',getComputedStyle(title).fontSize);
    }
    const label=[c.icon,c.nickname || card.title].filter(Boolean).join(' ');
    if (title.getAttribute('data-ap-label')!==label) title.setAttribute('data-ap-label',label);
    title.setAttribute('title',card.title+' · Open gradebook');
    title.setAttribute('aria-label',label+' ('+card.title+')');
  }
  function drawWidget(card,c) {
    const show=db.settings.bars;
    let w=widgetHosts.get(card.element);
    if (!show) {if(w){w.host.remove();widgetHosts.delete(card.element);}return;}
    if(w && w.host.parentElement!==card.element)card.element.append(w.host);
    if(!w){
      const host=el('div',null,{'data-ap-owned':'widget'});
      host.style.cssText='display:block;clear:both;padding:8px 0 11px;margin-right:6px;';
      const root=host.attachShadow({mode:'open'});card.element.append(host);w={host,root,signature:''};widgetHosts.set(card.element,w);
    }
    const signature=JSON.stringify([card.value,card.raw,c,db.settings]);
    if(w.signature===signature)return;w.signature=signature;
    w.root.replaceChildren();
    const style=el('style');style.textContent=`:host{font-family:inherit;font-size:11px;line-height:1.4;color:#4b5d75;}*{box-sizing:border-box}.rail{height:8px;border-radius:8px;background:#e2e8f0;position:relative;margin:5px 0 17px}.fill{height:100%;border-radius:8px}.marker{position:absolute;top:-3px;width:2px;height:14px;background:#5c6e83}.tick{position:absolute;top:12px;transform:translateX(-50%);font-size:9px}.line{display:flex;justify-content:space-between;gap:8px}button{background:#eff6ff;color:#234d78;border:1px solid #bfdbfe;padding:4px 7px;border-radius:6px;font:inherit;cursor:pointer}.zero{color:#6b7280;font-style:italic}@media print{:host{display:none}}`;
    w.root.append(style);
    if(db.settings.bars){
      if(card.value===null){w.root.append(el('div','No numeric grade posted',{class:'zero'}));}
      else {
        const max=Number.isFinite(c.maximum)&&c.maximum>0?c.maximum:(card.unit==='average'?4:100);
        const min=Number.isFinite(c.minimum)&&c.minimum<max?c.minimum:Math.min(c.scale==='average'?1:50,max/2);
        const position=value=>Math.max(0,Math.min(100,(value-min)/(max-min)*100));
        const gradeColor=colorFor(card.value,c),gradeLabel=el('span',card.raw,{class:'ap-widget-grade'});
        gradeLabel.style.setProperty('color',gradeColor,'important');
        const line=el('div',null,{class:'line'});line.append(gradeLabel,el('span',`Scale: ${fmt(min)}–${fmt(max)}${card.unit==='percent'?'%':''}`));
        const rail=el('div',null,{class:'rail',role:'meter','aria-label':card.title+' posted grade','aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':Math.min(max,Math.max(min,card.value)),'aria-valuetext':card.raw});
        const fill=el('div',null,{class:'fill'});fill.style.width=position(card.value)+'%';fill.style.background=gradeColor;rail.append(fill);
        for(const threshold of cutoffs(c))if(threshold>=min && threshold<=max){const mark=el('span',null,{class:'marker',title:'Threshold '+threshold});mark.style.left=position(threshold)+'%';rail.append(mark);const tick=el('span',String(threshold),{class:'tick'});tick.style.left=position(threshold)+'%';rail.append(tick);}
        rail.title='Based on the displayed grade. '+(card.value>max?'Above the bar maximum.':card.value<min?'Below the bar minimum.':'');w.root.append(line,rail);
      }
    }
  }
  function clearAnnotations(){clearImpactLabels();}
  function clearImpactLabels(){document.querySelectorAll('.ap-page-impact').forEach(n=>n.remove());}
  function gradeImpactBadge(impact,rules,hypothetical=false,assignment=null){
    const delta=Number.isFinite(impact.delta)?(rules.averageMaximum?impact.delta*rules.averageMaximum/100:impact.delta):null;
    const unit=rules.averageMaximum?'average points':'pp';
    const badge=el('span',delta===null?'Grade impact —':`Grade impact ${delta>0?'+':''}${fmt(delta)} ${unit}`,{class:'ap-page-impact','data-ap-owned':'impact'});
    const basis=hypothetical?'Current hypothetical grade':'Estimated grade';
    badge.title=`${basis} with this assignment minus the grade without it. `+
      (hypothetical?'Uses the current test scores, Count choices, and active grading and replacement rules. ':'Uses the grading rules shown by Aeries. ')+
      (rules.averageMaximum?'Shown in average points. ':'pp means percentage points. ')+
      'Removing a replacement source also removes its effect on other assignments. This is not the change since posting; effects do not add up.';
    if(delta===null)badge.title=(!assignment||assignment.included===false||assignment.earned===null
      ?'This assignment is not currently counted. '
      :'There is no comparison grade after removing this assignment. ')+badge.title;
    if(hypothetical)badge.setAttribute('data-ap-hypothetical','true');
    return badge;
  }
  function refreshGradeLabImpacts(model,rules,error){
    if(!gradeLab?.active)return 0;
    clearImpactLabels();gradeLab.impactCount=0;gradeLab.impactError='';
    if(!db.settings.enabled||!db.settings.impacts)return 0;
    model=model||labModel();rules=rules||planningRules(model.assignments);
    error=error||model.error||planningBaselineError()||gradeLab.rangeError;
    // A difference of two endpoint grades is not necessarily a bound on impact.
    // Avoid presenting the lower-score scenario as one exact grade impact.
    const ranged=gradeLab.rangeActive;
    const impacts=error?[]:ranged?model.assignments.map(a=>({id:a.id})):GradeMath.impacts(model.assignments,rules);
    gradeLab.impactError=error||impacts.find(impact=>impact.error)?.error||'';
    if(gradeLab.impactError)return 0;
    const nativeRows=new Map(gradeLab.parsed.assignments.map(a=>[a.id,a]));
    const addedRows=new Map([...(gradeLab.newBody?.querySelectorAll('[data-ap-owned="lab-assignment"]')||[])].map(row=>[row.dataset.assignmentId,row]));
    const assignments=new Map(model.assignments.map(a=>[a.id,a]));
    for(const impact of impacts){
      const native=nativeRows.get(impact.id),added=addedRows.get(impact.id),assignment=assignments.get(impact.id);
      const targets=native?.sourceNameCells||[added?.querySelector('.ap-lab-new-heading')];
      let attached=false;
      for(const target of targets)if(target?.isConnected){
        let badge;
        if(ranged){
          const counted=assignment?.included!==false&&assignment?.earned!==null;
          badge=el('span',counted?'Grade impact varies with ranges':'Grade impact —',{class:'ap-page-impact','data-ap-owned':'impact','data-ap-hypothetical':'true'});
          badge.title=counted?'Grade impact depends on all selected score ranges and replacement rules. Lower and upper course grades do not give lower and upper bounds for an individual assignment’s impact. Switch the ranged assignments to single scores to see exact impacts.':'This assignment is not currently counted.';
        }else badge=gradeImpactBadge(impact,rules,true,assignment);
        target.append(badge);attached=true;
      }
      if(attached)gradeLab.impactCount++;
    }
    return gradeLab.impactCount;
  }
  function setToggle(key,value){
    if(!Object.hasOwn(defaults,key)||typeof defaults[key]!=='boolean')return;
    db.settings[key]=Boolean(value);
    if(key==='nextClass')db.settings.scheduleNetworkConsent=Boolean(value);
    if(!db.settings.enabled || !db.settings.nextClass)abortScheduleRequests();
    if(key==='nicknames' || key==='enabled')restoreTitles();
    if(!db.settings.impacts)clearImpactLabels();
    persist();scan();
  }
  function annotate(impacts,model,key=selectedCourse) {
    document.querySelectorAll('.ap-page-impact').forEach(n=>n.remove());
    if(!db.settings.enabled || !db.settings.impacts || !model.confirmed)return 0;
    const rows=annotationSources.get(key);if(!rows)return 0;
    const byId=new Map(model.assignments.map(a=>[a.id,a]));
    // Every row must agree: an unchanged row's impact also depends on all other scores.
    if(rows.length!==model.assignments.length || rows.some(row=>{
      const a=byId.get(row.id);return !a || a.earned!==row.earned || a.possible!==row.possible || a.category!==row.category || (a.included!==false)!==(row.included!==false);
    }))return 0;
    let count=0;
    for(const i of impacts){const row=rows.find(a=>a.id===i.id);const modeled=byId.get(i.id);
      if(!row?.sourceCell?.isConnected || !modeled || i.delta===null || !Number.isFinite(i.delta))continue;
      // Do not attach an estimate for a hypothetical score to an official page row.
      if(row.earned!==modeled.earned || row.possible!==modeled.possible || (row.included!==false)!==(modeled.included!==false))continue;
      const nameCells=(row.sourceNameCells||[]).filter(cell=>cell?.isConnected);
      if(!nameCells.length)continue;
      for(const cell of nameCells){
        cell.append(gradeImpactBadge(i,model.rules));
      }count+=1;
    }
    return count;
  }
  function nativeCourseKey(current){
    for(const key of Object.keys(profile().courses)){
      if(!key.startsWith('url:'))continue;
      try{
        const params=new URL(key.slice(4),location.href).searchParams;
        if(params.get('gradebooknumber')===current.gradebook && params.get('term')===current.term && (!params.has('sc') || params.get('sc')===current.school))return key;
      }catch{/* Use the canonical native key below. */}
    }
    return GradeDOM.courseKey(current.title,current.link,current.period);
  }
  function showNativeStatus(info,text){
    nativeStatus={text};
    if(!nativeBanner?.isConnected){
      nativeBanner=el('div',null,{'data-ap-owned':'native-status',class:'ap-native-status',role:'status'});
      nativeBanner.style.cssText='font:inherit;font-size:12px;line-height:1.5;padding:9px 12px;margin:8px 0;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;color:#334155;';
      info.element.parentElement.insertBefore(nativeBanner,info.element);
    }
    if(nativeBanner.textContent!==text)nativeBanner.textContent=text;
  }
  function refreshNativeDetails(){
    if(!db.settings.enabled){closeGradeLab();nativeBanner?.remove();nativeBanner=null;nativeStatus=null;clearWeightMapPage();clearCategorySpotlight();return;}
    const current=GradeDOM.currentCourse();
    const tables=GradeDOM.listTables().filter(t=>t.nativeAeries);
    if(!current || tables.length!==1){closeGradeLab();nativeBanner?.remove();nativeBanner=null;nativeStatus=null;nativePageState=null;annotationSources.clear();clearAnnotations();clearWeightMapPage();clearCategorySpotlight();return;}
    const info=tables[0],key=nativeCourseKey(current);
    const partial=Boolean(document.querySelector('input[id$="_chkMissingAssignmentOnly"]')?.checked);
    const parsed=GradeDOM.readTable(info);
    const sourceRows=[...info.element.querySelectorAll('tr.assignment-info')];
    // Compare grading data, not expanded detail text or Playground's labels.
    const sourceText=JSON.stringify([
      parsed.assignments.map(a=>[a.id,a.name,a.category,GradeDOM.cleanText(a.sourceCell),a.rawEarned,a.rawPossible]),
      [...document.querySelectorAll('tr[id*="DataSummary"][id$="_trSummary"]')].map(GradeDOM.cleanText),
      GradeDOM.cleanText(document.querySelector('[id$="_lblMinMaxLegend"]'))
    ]);
    const sameSource=nativePageState?.table===info.element && nativePageState.sourceText===sourceText
      && sourceRows.length===nativePageState.sourceRows?.length
      && sourceRows.every((row,index)=>row===nativePageState.sourceRows[index]);
    // ASP.NET updates selectors/filters before replacing the old table. Never
    // attribute those old rows to a new course or treat a filtered list as full.
    if(sameSource && (nativePageState.key!==key || nativePageState.partial!==partial)){
      // Retain the last accepted identity while waiting. Aeries can replace
      // just the rows; returning to the original selection can cancel a load.
      nativePageState.waiting=true;closeGradeLab();clearAnnotations();
      clearWeightMapPage();clearCategorySpotlight();
      showNativeStatus(info,'Waiting for the selected gradebook or filter to finish loading…');return;
    }
    nativePageState={key,table:info.element,partial,sourceRows,sourceText,waiting:false};
    if(parsed.rules.averageMaximum)courseFor({key,title:current.title,unit:'average'});
    refreshWeightMap(key,current,parsed,{partial});
    refreshCategorySpotlight(key,info,parsed);
    annotationSources.set(key,parsed.assignments);
    const checked=GradeMath.fromAeries(parsed.assignments,parsed.rules,{partial});
    refreshGradeLab(info,key,current,parsed,checked,{partial});
    let impactText='Impact labels off',labelCount=0;
    if(gradeLab?.active){
      labelCount=refreshGradeLabImpacts();
      impactText=!db.settings.impacts?'Hypothetical grade testing is on · impact labels off':gradeLab.impactError
        ?'Hypothetical grade impact unavailable: '+gradeLab.impactError
        :`Hypothetical grade testing is on · ${labelCount} grade impact label${labelCount===1?'':'s'}`;
    }
    else if(db.settings.impacts){
      if(checked.error){clearImpactLabels();impactText=checked.error;}
      else{
        const count=annotate(GradeMath.impacts(checked.model.assignments,checked.model.rules),checked.model,key);
        labelCount=count;
        impactText=`${count} assignment impact label${count===1?'':'s'} · estimates match Aeries totals`;
      }
    }else clearImpactLabels();
    showNativeStatus(info,`${parsed.assignments.length} assignments read · ${impactText}`);
    return labelCount;
  }
  // Hypothetical scores live only in memory. Original Aeries nodes remain readable
  // by GradeDOM and are restored without recreating their event handlers.
  let gradeLab=null,gradeLabNextId=0;
  const labStyle=el('style',null,{'data-ap-owned':'lab-style'});
  labStyle.textContent=`
    .ap-lab-assignment-toggle{display:block!important;margin:5px 0 0;text-align:inherit;line-height:1.4}
    .ap-lab-assignment-toggle button{font-family:inherit!important;font-size:11px!important;font-weight:400!important;line-height:1.4!important;padding:3px 7px!important;white-space:nowrap;color:#53667e;background:#f8fafc;border:1px solid #cbd5e1;border-radius:4px;cursor:pointer}
    .ap-lab-assignment-toggle button[aria-pressed=true]{color:#57428a;background:#f5f1ff;border-color:#c9bde2}
    .ap-lab-assignment-toggle button:focus-visible{outline:2px solid #7c8de3;outline-offset:2px}
    @media print{.ap-lab-assignment-toggle{display:none!important}}
    #ap-grade-lab{font:inherit;color:#253858;font-size:12px;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:12px;margin:10px 0}
    #ap-grade-lab .ap-lab-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
    #ap-grade-lab button,.ap-lab-editor button,.ap-lab-new-row button{font:inherit;cursor:pointer;color:#43328b;background:#fff;border:1px solid #b8a7e5;border-radius:5px;padding:5px 8px}
    #ap-grade-lab button[aria-pressed=true]{background:#5742a2;color:#fff}
    #ap-grade-lab p{margin:7px 0 0}#ap-lab-result{font-size:16px;font-weight:600}
    #ap-grade-lab [hidden]{display:none!important}
    #ap-grade-lab .ap-plan-section{padding:14px;background:#fff;border:1px solid #d8cef0;border-radius:7px;margin-top:12px}
    #ap-grade-lab .ap-plan-section .ap-plan-section{padding:0;border:0;margin:0}
    #ap-grade-lab summary{cursor:pointer;font-weight:700;color:#382961}
    #ap-grade-lab summary:focus-visible{outline:3px solid #a78bfa;outline-offset:3px}
    #ap-grade-lab h3{font:inherit;font-size:14px;font-weight:700;color:#382961;margin:0 0 7px}
    #ap-grade-lab h4{font:inherit;font-weight:700;margin:12px 0 6px}
    #ap-grade-lab .ap-plan-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:12px;margin:12px 0}
    #ap-grade-lab .ap-plan-field{display:flex;flex-direction:column;gap:5px;color:#475569;font:inherit}
    #ap-grade-lab .ap-plan-field input,#ap-grade-lab .ap-plan-field select{box-sizing:border-box;width:100%;min-width:0;font:inherit;background:#fff;color:#253858;border:1px solid #aaa3bb;border-radius:5px;padding:7px}
    #ap-grade-lab .ap-plan-field [aria-invalid=true]{border-color:#b42318}
    #ap-grade-lab .ap-plan-message{color:#43328b;line-height:1.6}
    #ap-grade-lab button:disabled{opacity:.5;cursor:default}
    #ap-grade-lab .ap-plan-rule{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #e5e0ee}
    #ap-grade-lab .ap-plan-scroll{overflow-x:auto;margin-top:12px}
    #ap-grade-lab .ap-plan-table{border-collapse:collapse;width:100%;font:inherit;background:white}
    #ap-grade-lab .ap-plan-table th,#ap-grade-lab .ap-plan-table td{padding:8px;text-align:left;border:1px solid #e5e0ee}
    #ap-grade-lab .ap-plan-table th{background:#f5f3ff;font-weight:600}
    .ap-lab-original{display:none!important}
    .ap-lab-pair{display:inline-flex!important;align-items:baseline;flex-wrap:nowrap;gap:.12em;white-space:nowrap;vertical-align:baseline;font:inherit;color:inherit;line-height:inherit;max-width:100%}
    .ap-lab-pair input.ap-lab-number{display:inline-block!important;box-sizing:border-box!important;flex:0 0 auto!important;width:var(--ap-lab-input-width,calc(1ch + 3px))!important;min-width:calc(.7ch + 3px)!important;max-width:none!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;font:inherit!important;line-height:inherit!important;text-align:right!important;color:inherit;background:transparent!important;border:1px solid transparent!important;border-bottom-color:#a5b4c5!important;border-radius:2px!important;box-shadow:none!important}
    @supports (field-sizing:content){.ap-lab-pair input.ap-lab-number{field-sizing:content!important;width:auto!important;padding-inline:0 1px!important}}
    .ap-lab-pair input.ap-lab-number:focus{border-color:#7c8de3!important;outline:1px solid #7c8de3!important;background:#f5f7ff!important}
    .ap-lab-pair input.ap-lab-number[aria-invalid=true]{border-color:#b42318!important;background:#fff1f0!important}
    .ap-lab-pair input.ap-lab-number[readonly]{border-color:transparent!important}
    .ap-lab-pair input.ap-lab-number::placeholder{color:#9aa6b5;opacity:1}
    .ap-lab-pair[hidden]{display:none!important}
    .ap-lab-raw-fallback{display:flex;flex-basis:100%;align-items:baseline;justify-content:flex-end;gap:5px;font-size:12px;line-height:1.5}
    .ap-lab-pair.ap-lab-has-fallback{flex-wrap:wrap}
    .ap-lab-raw-fallback small{font-size:10px;color:#8a98ab}
    .ap-lab-row-actions{display:inline-flex;align-items:center;gap:6px;margin-left:8px;vertical-align:middle;font-family:inherit!important;font-size:12px!important;font-weight:400!important;font-style:normal!important;font-stretch:normal!important;line-height:1.4!important;letter-spacing:normal!important;color:#69778b;white-space:nowrap}
    .ap-lab-row-actions label{display:inline-flex;align-items:center;gap:3px;margin:0;font:inherit!important}
    .ap-lab-row-actions label span{font:inherit!important}
    .ap-lab-row-actions input[type=checkbox]{width:12px;height:12px;margin:0}
    .ap-lab-row-actions button{font:inherit!important;letter-spacing:inherit!important;text-transform:none!important;padding:1px 4px;color:#586980;background:transparent;border:1px solid #d2d9e3;border-radius:3px;cursor:pointer}
    .ap-lab-row-actions button:disabled{opacity:.45;cursor:default}
    .ap-lab-row-actions{flex-wrap:wrap;white-space:normal}
    .ap-lab-range-editor{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 8px;box-sizing:border-box;max-width:180px;margin:6px auto;font-family:inherit!important;font-size:11px!important;font-weight:400!important;line-height:1.4!important;white-space:normal;color:#53667e}
    .ap-lab-range-editor[hidden]{display:none!important}
    .ap-lab-range-editor label{display:flex;flex-direction:column;gap:2px;margin:0;text-align:left;font:inherit!important}
    .ap-lab-range-editor input{box-sizing:border-box!important;width:8ch!important;min-width:0!important;max-width:100%!important;height:auto!important;margin:0!important;padding:3px 4px!important;font:inherit!important;font-size:13px!important;line-height:1.4!important;background:#fff!important;color:#253858!important;border:1px solid #b7a7dc!important;border-radius:4px!important;box-shadow:none!important}
    .ap-lab-range-editor input[aria-invalid=true]{border-color:#b42318!important;background:#fff1f0!important}
    .ap-lab-range-editor input:focus{outline:2px solid #7c8de3;outline-offset:1px}
    .ap-lab-range-editor small{flex-basis:100%;font:inherit!important;font-size:10px!important;text-align:center}
    .ap-lab-range-editor .ap-lab-range-mode,.ap-lab-range-editor .ap-lab-range-total{flex-basis:100%;flex-direction:row;align-items:center;justify-content:center;gap:5px}
    .ap-lab-range-editor select{box-sizing:border-box;max-width:100%;margin:0;padding:2px 4px;font:inherit!important;background:#fff;color:#253858;border:1px solid #b7a7dc;border-radius:4px}
    .ap-lab-range-editor .ap-lab-range-total[hidden]{display:none!important}
    .ap-lab-range-editor[data-excluded=true]{opacity:.65}
    .ap-lab-pair input.ap-lab-number:disabled{opacity:.5;cursor:default}
    .ap-lab-inline-value{display:inline;font:inherit;line-height:inherit}
    .ap-lab-tag{display:inline-block;font-family:inherit!important;font-size:10px!important;font-weight:600!important;line-height:1.5!important;color:#5b3898!important;background:#ede9fe;border:1px solid #c4b5fd;border-radius:4px;padding:1px 4px;vertical-align:middle}
    .ap-lab-value{font-size:12px!important;line-height:1.5;display:inline-flex;gap:5px;align-items:center;flex-wrap:wrap}
    .ap-lab-value small{font-size:10px;color:#64748b}
    .ap-lab-bound-values{display:inline-flex;flex-direction:column;gap:1px;max-width:100%;font:inherit;line-height:1.4}
    .ap-lab-new-percent{max-width:180px;white-space:normal}
    .ap-lab-new-row>td{background:transparent!important;border:0!important;padding:var(--ap-card-cell-padding,10px 20px)!important;white-space:normal!important}
    .ap-lab-new-card{box-sizing:var(--ap-card-box-sizing,border-box);width:var(--ap-card-width,auto);max-width:100%;margin:var(--ap-card-margin,0);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 20px;min-width:0;padding:var(--ap-card-padding,10px);background:var(--ap-card-background,#fcfdff);border:var(--ap-card-border,1px solid #bcc8d9);border-radius:var(--ap-card-radius,6px);box-shadow:var(--ap-card-shadow,0 2px 3px #263d6226);font-family:var(--ap-card-font,inherit);color:var(--ap-card-text,#60728b);text-align:left;line-height:1.5}
    .ap-lab-new-main{min-width:0}
    .ap-lab-new-heading{display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;min-width:0}
    .ap-lab-new-card input.ap-lab-new-name{box-sizing:border-box;flex:0 1 30ch;width:30ch;min-width:0;max-width:100%;height:auto;margin:0;padding:0 2px;font-family:inherit!important;font-size:var(--ap-card-title-size,18px)!important;font-weight:var(--ap-card-title-weight,600)!important;line-height:1.4!important;color:#0752a3;background:transparent;border:1px solid transparent;border-bottom-color:#cbd5e1;border-radius:2px;box-shadow:none}
    .ap-lab-new-card input.ap-lab-new-name::placeholder{color:#60728b;opacity:1;font-weight:400}
    .ap-lab-new-heading .ap-lab-row-actions{margin:0;flex-wrap:wrap;white-space:normal}
    .ap-lab-new-heading .ap-page-impact{margin:0!important}
    .ap-lab-new-category{display:flex;align-items:center;gap:5px;max-width:100%;margin:4px 0 0;font-weight:400}
    .ap-lab-new-category>span{flex:none;color:#687b93}
    .ap-lab-new-card select.ap-lab-new-category-input{box-sizing:border-box;width:auto;min-width:0;max-width:100%;height:auto;margin:0;padding:1px 24px 1px 0;font:inherit!important;font-size:var(--ap-card-category-size,16px)!important;line-height:1.5!important;color:inherit;background-color:transparent;border:1px solid transparent;border-bottom-color:#d8e0ea;border-radius:2px;box-shadow:none}
    .ap-lab-new-card .ap-lab-new-help{margin:8px 0 0;font:inherit;font-size:12px;line-height:1.5;color:#7e8fa6}
    .ap-lab-new-scores{display:flex;flex-direction:column;align-items:center;justify-self:end;gap:4px;min-width:100px;max-width:100%;text-align:center}
    .ap-lab-new-card .ap-lab-new-score-field{display:flex;flex-direction:column;align-items:center;gap:0;margin:0;font:inherit;font-weight:400;color:inherit}
    .ap-lab-new-score-label{font-size:var(--ap-card-label-size,12px);color:var(--ap-card-label-color,#9aaac0)}
    .ap-lab-new-score-field>[data-score-kind=points]{font-size:var(--ap-card-score-size,20px);font-weight:var(--ap-card-score-weight,400);line-height:1.4}
    .ap-lab-new-score-field>[data-score-kind=raw]{font-size:var(--ap-card-raw-size,16px);line-height:1.4}
    .ap-lab-new-percent{font-size:12px;line-height:1.5}
    .ap-lab-new-scores .ap-lab-assignment-toggle{margin-top:4px}
    #ap-grade-lab button:focus-visible,.ap-lab-row-actions :focus-visible,.ap-lab-new-card :focus-visible{outline:2px solid #7c8de3;outline-offset:2px}
    @media(max-width:560px){.ap-lab-new-row>td{padding:8px!important}.ap-lab-new-card{column-gap:10px;width:auto;margin:0;box-sizing:border-box}.ap-lab-new-scores{min-width:85px}.ap-lab-new-card select.ap-lab-new-category-input{width:100%}}
    @media(max-width:360px){.ap-lab-new-card{grid-template-columns:minmax(0,1fr)}.ap-lab-new-scores{justify-self:end}}
    @media print{#ap-grade-lab button,.ap-lab-editor button,.ap-lab-new-row button,.ap-lab-row-actions{display:none!important}.ap-lab-tag{color:#000!important;border-color:#000!important}}
  `;
  document.head.append(labStyle);
  const labTag=()=>el('span','Hypothetical',{class:'ap-lab-tag'});
  // Course policies are opt-in. Posted data stays separate from simulations.
  function planningCourse(){return courseFor({key:gradeLab.key,title:gradeLab.current.title});}
  function planningSelect(id,placeholder,choices=[]){
    const n=el('select',null,{id});n.append(el('option',placeholder,{value:''}));
    for(const [value,label] of choices)n.append(el('option',label,{value}));
    n.value='';return n;
  }
  function planningField(label,n){const l=field(label,n);l.className='ap-plan-field';return l;}
  function planningNumber(id){const n=input('','text');n.id=id;n.setAttribute('inputmode','decimal');n.autocomplete='off';return n;}
  function planningRows(){return gradeLab.active?labModel().assignments:gradeLab.parsed.assignments.map(({id,name,category,earned,possible,included})=>({id,name,category,earned,possible,included}));}
  function planningRef(a){
    const ref={id:a.id,name:a.name,category:a.category,hypothetical:a.id.startsWith('hypothetical:')};
    if(ref.hypothetical)gradeLab.referenceBindings.set(ref,a.id);
    return ref;
  }
  function resolvePlanningRef(ref,assignments){
    if(!ref)return null;
    const bound=gradeLab.referenceBindings.get(ref);
    if(bound)return assignments.find(a=>a.id===bound)||null;
    const matches=assignments.filter(a=>ref.hypothetical?a.name===ref.name&&a.category===ref.category:a.id===ref.id&&a.name===ref.name);
    return matches.length===1?matches[0]:null;
  }
  function bindPlanningRename(id){
    const rows=planningRows();
    for(const rule of gradeLab.replacementDraft||[])for(const ref of [rule.source,rule.target]){
      if(ref?.hypothetical&&resolvePlanningRef(ref,rows)?.id===id)gradeLab.referenceBindings.set(ref,id);
    }
  }
  function serializePlanningRules(){
    const rows=planningRows();
    return gradeLab.replacementDraft.map(rule=>({
      onlyIfHigher:rule.onlyIfHigher,capPercent:rule.capPercent??null,...Object.fromEntries(['source','target'].map(key=>{
        const a=resolvePlanningRef(rule[key],rows);
        return [key,a?{id:a.id,name:a.name,category:a.category,hypothetical:a.id.startsWith('hypothetical:')}:{...rule[key]}];
      }))
    }));
  }
  function savePlanningReplacementRules(){
    if(!gradeLab)return false;
    planningCourse().replacementRules=serializePlanningRules();
    const stored=persist();
    if(gradeLab.planning)gradeLab.planning.message.textContent=stored?'Replacement rules saved automatically for this course.':storageError;
    return stored;
  }
  function resolvePlanningRules(assignments){
    const rules=[],pending=[];
    for(const saved of gradeLab.replacementDraft||[]){
      const source=resolvePlanningRef(saved.source,assignments),target=resolvePlanningRef(saved.target,assignments);
      if(!source||!target){pending.push(`${saved.source?.name||'Source'} → ${saved.target?.name||'Target'}: waiting for matching assignments.`);continue;}
      rules.push({sourceId:source.id,targetId:target.id,onlyIfHigher:saved.onlyIfHigher,capPercent:saved.capPercent??null});
    }
    return {rules,pending};
  }
  function planningRules(assignments=planningRows()){
    const saved=planningCourse().gradingRules;
    const rules={...gradeLab.parsed.rules,...(saved||{})};
    rules.replacements=resolvePlanningRules(assignments).rules;
    return rules;
  }
  function planningBaselineError(){
    if(!gradeLab.baselineError||gradeLab.partial)return gradeLab.baselineError;
    // Aeries may publish replacement-adjusted totals alongside original row
    // scores. Reconcile with configured rules using posted scores ONLY.
    const rows=gradeLab.parsed.assignments,rules=planningRules(rows);
    if(!rules.replacements.length&&!planningCourse().gradingRules)return gradeLab.baselineError;
    const checked=GradeMath.fromAeries(rows,rules,{partial:false});
    return checked.error?gradeLab.baselineError:'';
  }
  function planningTargetSignature(rows,rules){return JSON.stringify([rows,rules,planningBaselineError(),resolvePlanningRules(rows).pending]);}
  function planningFormat(value,rules,rounded=false){
    if(value===null||!Number.isFinite(value))return '—';
    const p=rounded?GradeMath.roundPercent(value,rules):value;
    if(p===null)return '—';
    return fmt(rules.averageMaximum?p*rules.averageMaximum/100:p)+(rules.averageMaximum?' / '+fmt(rules.averageMaximum):'%');
  }
  function initPlanningUI(){
    const toolbar=gradeLab.toolbar;
    gradeLab.referenceBindings=new WeakMap();
    gradeLab.replacementDraft=clone(planningCourse().replacementRules||[]);
    const profileBody=el('div',null,{id:'ap-profile-body',class:'ap-plan-section'});profileBody.hidden=true;
    const explainBody=el('div',null,{id:'ap-explain-body',class:'ap-plan-section'});explainBody.hidden=true;
    const profileButton=button('Course grading profile',()=>{profileBody.hidden=!profileBody.hidden;profileButton.setAttribute('aria-expanded',String(!profileBody.hidden));});
    profileButton.id='ap-profile-open';profileButton.setAttribute('aria-expanded','false');profileButton.setAttribute('aria-controls','ap-profile-body');
    const explainButton=button('Explain my grade',()=>{explainBody.hidden=!explainBody.hidden;explainButton.setAttribute('aria-expanded',String(!explainBody.hidden));renderGradeExplanation();});
    explainButton.id='ap-explain-open';explainButton.setAttribute('aria-expanded','false');explainButton.setAttribute('aria-controls','ap-explain-body');
    toolbar.querySelector('.ap-lab-actions').append(profileButton,explainButton);
    buildGradingProfileUI(profileBody,()=>{renderGradeLabResult();refreshPlanningUI();renderGradeExplanation();});
    const tools=el('div',null,{id:'ap-lab-tools'});tools.hidden=true;
    const target=el('section',null,{class:'ap-plan-section'});
    target.append(el('h3','What do I need? · Hypothetical score'),note('For every candidate score, this calculator counts the assessment itself, applies its replacement rules to earlier scores, and then checks whether your target course grade is reached.'));
    const grid=el('div',null,{class:'ap-plan-grid'});
    const assignment=planningSelect('ap-lab-target-assignment','Choose an assignment');
    const desired=planningNumber('ap-lab-target-value'),maximum=planningNumber('ap-lab-target-max'),step=planningNumber('ap-lab-target-step');
    const desiredLabel=planningField('Target course grade',desired);
    grid.append(planningField('Assignment to solve for',assignment),desiredLabel,planningField('Maximum earned points',maximum),planningField('Score increment in points',step));
    const ruleSummary=el('div',null,{id:'ap-lab-target-rules',class:'ap-plan-message'});
    const output=note('Enter all fields to calculate.','ap-plan-message');output.id='ap-lab-target-output';output.setAttribute('aria-live','polite');
    const breakdown=el('div',null,{id:'ap-lab-target-breakdown'});
    const solve=button('Calculate required score',solvePlanningTarget);solve.id='ap-lab-target-solve';
    const apply=button('Apply hypothetical score',applyPlanningTarget);apply.id='ap-lab-target-apply';apply.disabled=true;
    const actions=el('div',null,{class:'ap-lab-actions'});actions.append(solve,apply);
    target.append(grid,ruleSummary);
    const replacements=el('section',null,{class:'ap-plan-section'});
    replacements.append(el('h3','Replacement rules used in this calculation'),note('Choose which earlier scores the assessment can replace and when. You can add several rules for the same assessment. These rules also apply to the rest of the lab.'));
    const replacementGrid=el('div',null,{class:'ap-plan-grid'});
    const source=planningSelect('ap-lab-replace-source','Choose a source'),destination=planningSelect('ap-lab-replace-target','Choose a target');
    const policy=planningSelect('ap-lab-replace-policy','Choose a policy',[['higher','Only if higher'],['always','Always replace']]);
    const cap=planningNumber('ap-lab-replace-cap');
    replacementGrid.append(planningField('Assessment supplying the score',source),planningField('Earlier assignment it can replace',destination),planningField('Replacement policy',policy),planningField('Replacement cap (%) — optional',cap));
    const list=el('div',null,{id:'ap-lab-replacement-list'}),message=note('','ap-plan-message');message.id='ap-lab-replacement-message';message.setAttribute('aria-live','polite');
    const add=button('Add hypothetical replacement',addPlanningReplacement);add.id='ap-lab-replace-add';
    const save=button('Save replacement rules for this course',savePlanningReplacementRules);save.id='ap-lab-replace-save';
    const reset=button('Load saved replacement rules',()=>{gradeLab.replacementDraft=clone(planningCourse().replacementRules||[]);gradeLab.replacementListSignature='';renderGradeLabResult();});reset.id='ap-lab-replace-load';
    const replacementActions=el('div',null,{class:'ap-lab-actions'});replacementActions.append(add,save,reset);
    replacements.append(replacementGrid,replacementActions,list,message,note('Added and removed rules save automatically in this browser for this course.'),note('A replacement copies the source percentage while preserving the earlier assignment’s points possible. Rules use the source’s entered score; replacements do not cascade through other rules. A cap limits only the replacement score.'),note('Rules stay connected when you rename a hypothetical assignment during this session. After reload, recreated hypothetical assignments must match the saved name and category.'));
    target.append(replacements,actions,output,breakdown);tools.append(target);toolbar.append(profileBody,tools,explainBody);
    gradeLab.planning={tools,assignment,desired,maximum,step,desiredLabel,output,apply,source,destination,policy,cap,list,message,explainBody,ruleSummary,breakdown,solve};
    for(const n of [assignment,desired,maximum,step,source,destination,policy,cap])n.addEventListener(n.tagName==='SELECT'?'change':'input',()=>{gradeLab.targetSolution=null;apply.disabled=true;breakdown.replaceChildren();output.textContent='Inputs changed. Calculate the required score again.';if(gradeLab.active && [source,destination,policy,cap].includes(n))renderGradeLabResult();else refreshPlanningUI();});
    refreshPlanningUI();
  }
  function refreshPlanningUI(){
    const ui=gradeLab?.planning;if(!ui)return;
    ui.tools.hidden=!gradeLab.active;
    const rows=planningRows(),rules=planningRules(rows);
    const signature=JSON.stringify(rows.map(a=>[a.id,a.name,a.category]));
    if(signature!==gradeLab.planningRowsSignature){
      gradeLab.planningRowsSignature=signature;
      for(const select of [ui.assignment,ui.source,ui.destination]){
        const selected=select.value,placeholder=select.options[0].textContent;
        select.replaceChildren(el('option',placeholder,{value:''}));
        for(const [index,a] of rows.entries())select.append(el('option',`${a.name||'Unnamed hypothetical assignment'} · ${a.category||'Choose category'} · row ${index+1}`,{value:a.id}));
        select.value=rows.some(a=>a.id===selected)?selected:'';
      }
    }
    ui.desiredLabel.querySelector('span').textContent=rules.averageMaximum?`Target course grade (out of ${fmt(rules.averageMaximum)})`:'Target course grade (%)';
    const summarySignature=JSON.stringify([rules.replacements,resolvePlanningRules(rows).pending,ui.assignment.value,rows.map(a=>[a.id,a.name])]);
    if(gradeLab.targetRuleSummarySignature!==summarySignature){
      gradeLab.targetRuleSummarySignature=summarySignature;ui.ruleSummary.replaceChildren();
      const resolved=resolvePlanningRules(rows),selectedRules=resolved.rules.filter(r=>r.sourceId===ui.assignment.value);
      ui.ruleSummary.append(note(resolved.rules.length?`${resolved.rules.length} configured replacement rule(s) will be evaluated for every candidate score.`:'No replacement rules are configured. Add any that apply before calculating.'));
      const names=new Map(rows.map(a=>[a.id,a.name]));
      for(const r of selectedRules)ui.ruleSummary.append(note(`${names.get(r.sourceId)} can replace ${names.get(r.targetId)} · ${r.onlyIfHigher?'only if higher':'always'}${r.capPercent==null?'':` · capped at ${fmt(r.capPercent)}%`}.`));
      if(selectedRules.length)ui.ruleSummary.append(note('These rules apply during the search even if this assessment’s score is currently blank.'));
      for(const p of resolved.pending)ui.ruleSummary.append(note('Resolve before calculating: '+p));
    }
    const rangeActive=labHasCountedRanges();
    ui.solve.disabled=rangeActive;
    if(rangeActive){gradeLab.targetSolution=null;ui.apply.disabled=true;ui.breakdown.replaceChildren();ui.output.textContent='Turn off assignment ranges to calculate one required score.';}
    else if(ui.solve.dataset.ranges==='true')ui.output.textContent='Enter all fields to calculate.';
    ui.solve.dataset.ranges=String(rangeActive);
    const inputSignature=planningTargetSignature(rows,rules);
    if(gradeLab.targetSolution&&gradeLab.targetSolution.inputSignature!==inputSignature){gradeLab.targetSolution=null;ui.apply.disabled=true;ui.breakdown.replaceChildren();ui.output.textContent='The hypothetical gradebook changed. Calculate the required score again.';}
    const listSignature=JSON.stringify([gradeLab.replacementDraft,rows.map(a=>[a.id,a.name,a.category]),resolvePlanningRules(rows).pending,gradeLab.result?.appliedReplacements,gradeLab.rangeActive,gradeLab.rangeResult?.highResult.appliedReplacements]);
    if(gradeLab.replacementListSignature!==listSignature){
      gradeLab.replacementListSignature=listSignature;ui.list.replaceChildren();
      if(!gradeLab.replacementDraft.length)ui.list.append(note('No replacement rules selected.'));
      gradeLab.replacementDraft.forEach((r,i)=>{
        const row=el('div',null,{class:'ap-plan-rule'});
        const source=resolvePlanningRef(r.source,rows),target=resolvePlanningRef(r.target,rows);
        row.append(el('span',`Hypothetical: ${source?.name||r.source.name} → ${target?.name||r.target.name} · ${r.onlyIfHigher?'only if higher':'always replace'}${r.capPercent==null?'':` · cap ${fmt(r.capPercent)}%`}`),button('Remove',()=>{gradeLab.replacementDraft.splice(i,1);savePlanningReplacementRules();renderGradeLabResult();}));ui.list.append(row);
      });
      for(const p of resolvePlanningRules(rows).pending)ui.list.append(note('Inactive rule: '+p));
      const replacementEndpoints=gradeLab.rangeActive&&gradeLab.rangeResult?[['At lower scores',gradeLab.rangeResult.lowResult],['At upper scores',gradeLab.rangeResult.highResult]]:[['Hypothetical replacement applied',gradeLab.result]];
      for(const [label,endpoint]of replacementEndpoints)for(const r of endpoint?.appliedReplacements||[]){
        const source=rows.find(a=>a.id===r.sourceId),target=rows.find(a=>a.id===r.targetId);
        ui.list.append(note(`${label}: ${source.name} → ${target.name}: ${fmt(r.oldPercent)}% → ${fmt(r.newPercent)}%.`));
      }
    }
    renderGradeExplanation();
  }
  function addPlanningReplacement(){
    const ui=gradeLab.planning,rows=planningRows(),source=rows.find(a=>a.id===ui.source.value),target=rows.find(a=>a.id===ui.destination.value);
    if(!source||!target||!ui.policy.value){ui.message.textContent='Choose a source, target, and replacement policy.';return;}
    if(source.id===target.id){ui.message.textContent='An assignment cannot replace itself.';return;}
    if(!source.name.trim()||!target.name.trim()||!source.category||!target.category){ui.message.textContent='Give both assignments a name and category first.';return;}
    const onlyIfHigher=ui.policy.value==='higher';
    const capPercent=ui.cap.value.trim()===''?null:GradeMath.parseNumber(ui.cap.value);
    if(ui.cap.value.trim()!==''&&(capPercent===null||capPercent<0)){ui.message.textContent='Enter a nonnegative percentage cap or leave it blank.';return;}
    const prior=resolvePlanningRules(rows).rules;
    if(prior.some(r=>r.sourceId===source.id&&r.targetId===target.id)){ui.message.textContent='That replacement rule already exists.';return;}
    if(prior.some(r=>r.targetId===target.id&&(!r.onlyIfHigher||!onlyIfHigher))){ui.message.textContent='Multiple sources for one target must all use “only if higher.” Remove the conflicting rule first.';return;}
    gradeLab.replacementDraft.push({source:planningRef(source),target:planningRef(target),onlyIfHigher,capPercent});
    ui.source.value=ui.destination.value=ui.policy.value=ui.cap.value='';savePlanningReplacementRules();renderGradeLabResult();
  }
  function solvePlanningTarget(){
    if(labHasCountedRanges())return;
    const ui=gradeLab.planning,model=labModel(),rules=planningRules(model.assignments);
    gradeLab.targetSolution=null;ui.apply.disabled=true;ui.breakdown.replaceChildren();
    if([ui.source,ui.destination,ui.policy,ui.cap].some(n=>n.value.trim()!=='')){
      ui.output.textContent='A replacement rule is still being entered. Finish it and click “Add hypothetical replacement,” or clear its fields before calculating. It will then be included in the score search.';return;
    }
    const pending=resolvePlanningRules(model.assignments).pending;
    if(pending.length){ui.output.textContent='Some saved replacement rules cannot be matched. Resolve or remove those rules before calculating so the required score includes all configured replacements.';return;}
    const desired=GradeMath.parseNumber(ui.desired.value);
    const baselineError=planningBaselineError();
    if(model.error||baselineError){ui.output.textContent='Hypothetical target unavailable: '+(model.error||baselineError);return;}
    const chosen=model.assignments.find(a=>a.id===ui.assignment.value);
    if(chosen?.id.startsWith('hypothetical:')&&(!chosen.name.trim()||!chosen.category)){ui.output.textContent='Give the hypothetical assignment a name and category before solving for its score.';return;}
    const result=GradeMath.solveTarget(model.assignments,rules,{assignmentId:ui.assignment.value,target:desired===null?null:desired/(rules.averageMaximum||100)*100,maximumEarned:GradeMath.parseNumber(ui.maximum.value),step:GradeMath.parseNumber(ui.step.value)});
    if(result.status!=='solved'){
      ui.output.textContent=result.status==='unreachable'?'Hypothetical target is unreachable within the entered maximum and score increment.':'Hypothetical target unavailable: '+result.error;return;
    }
    const selected=model.assignments.find(a=>a.id===ui.assignment.value);
    const candidate=model.assignments.map(a=>a.id===selected.id?{...a,earned:result.earned,included:true}:a);
    const calculated=GradeMath.calculate(candidate,rules),names=new Map(model.assignments.map(a=>[a.id,a.name]));
    ui.output.textContent=`Hypothetical score needed: ${fmt(result.earned)} / ${fmt(selected.possible)} → course grade ${planningFormat(result.rawValue,rules,true)}. Includes the assessment itself and ${calculated.appliedReplacements.length} replacement${calculated.appliedReplacements.length===1?'':'s'} at this score.`;
    ui.breakdown.append(el('strong','Hypothetical replacements at the required score'));
    if(!calculated.appliedReplacements.length)ui.breakdown.append(note(rules.replacements.length?'No earlier score is changed at this candidate score under the configured rules.':'No replacement rules are configured.'));
    for(const r of calculated.appliedReplacements)ui.breakdown.append(note(`${names.get(r.sourceId)} → ${names.get(r.targetId)}: ${fmt(r.originalEarned)} / ${fmt(r.possible)} becomes ${fmt(r.newEarned)} / ${fmt(r.possible)} (${fmt(r.newPercent)}%).`));
    ui.breakdown.append(note('The minimum was found by applying the rules again for every candidate score; the current blank or entered score is not held fixed during the search.'));
    gradeLab.targetSolution={...result,assignmentId:selected.id,inputSignature:planningTargetSignature(model.assignments,rules)};ui.apply.disabled=false;
  }
  function applyPlanningTarget(){
    if(labHasCountedRanges())return;
    const solved=gradeLab.targetSolution;if(!solved)return;
    const rows=planningRows(),rules=planningRules(rows);
    if(solved.inputSignature!==planningTargetSignature(rows,rules)){refreshPlanningUI();return;}
    const added=gradeLab.added.find(a=>a.id===solved.assignmentId);
    if(added){
      Object.assign(added,labPointDraft(added,solved.earned));gradeLab.addedEditors.get(added.id)?.sync(added);
    }else{
      const a=gradeLab.parsed.assignments.find(a=>a.id===solved.assignmentId);
      const draft=gradeLab.edits.get(a.id)||labDraft(a);gradeLab.edits.set(a.id,labPointDraft(draft,solved.earned));syncLabEditors(a.id);
    }
    gradeLab.targetSolution=null;gradeLab.planning.apply.disabled=true;renderGradeLabResult();
    gradeLab.planning.output.textContent='Hypothetical score applied in gradebook points. You can keep editing or calculate another target.';
  }
  function clearPlanningRange(resetFields=false){
    if(!gradeLab)return;
    gradeLab.rangeResult=null;gradeLab.rangeActive=false;gradeLab.rangeError='';
    if(resetFields)gradeLab.ranges.clear();
  }
  function renderGradeExplanation(){
    const ui=gradeLab?.planning;if(!ui||ui.explainBody.hidden)return;
    const box=ui.explainBody,active=gradeLab.active;
    const model=active?labModel():{assignments:gradeLab.parsed.assignments,error:null};
    const configuredPosted=planningRules(model.assignments);
    const postedCheck=active?null:GradeMath.fromAeries(model.assignments,configuredPosted,{partial:gradeLab.partial});
    const rules=active?planningRules(model.assignments):postedCheck.error?gradeLab.parsed.rules:configuredPosted;
    const scenario=active?labRangeScenario(model,rules):{active:false,result:null,error:''};
    const range=scenario.result,ranged=scenario.active;
    const result=ranged&&range?range.lowResult:GradeMath.calculate(model.assignments,rules);
    const upper=ranged&&range?range.highResult:null;
    const blocked=model.error||(active?planningBaselineError():postedCheck.error?gradeLab.baselineError:'');
    const error=model.error||scenario.error||result.error||(ranged?blocked:'');
    const signature=JSON.stringify([active,model.assignments.map(({id,name,earned,possible,included,category})=>({id,name,earned,possible,included,category})),rules,result,upper,error,gradeLab.baselineError]);
    if(signature===gradeLab.explanationSignature)return;gradeLab.explanationSignature=signature;
    box.replaceChildren(el('h3',active?'Hypothetical grade explanation':'Posted grade explanation'));
    if(error){box.append(note('Hypothetical total unavailable: '+error,'ap-plan-message'));return;}
    if(blocked)box.append(note('A complete matching total is unavailable: '+blocked,'ap-plan-message'));
    else if(ranged)box.append(note(`Hypothetical overall grade — lower bound: ${planningFormat(result.value,rules,true)}; upper bound: ${planningFormat(upper.value,rules,true)}. All counted ranges vary together; single scores stay fixed.`));
    else box.append(note((active?'Hypothetical calculated grade: ':'Reconstructed from visible Aeries scores: ')+planningFormat(result.value,rules,true)));
    if(active&&planningCourse().gradingRules)box.append(note('Uses your saved course grading profile.'));
    else box.append(note('Uses category weights and score limits read from Aeries.'));
    if(!active&&!postedCheck.error&&result.appliedReplacements.length)box.append(note('Your configured replacement rules reconcile the visible scores with Aeries’ posted totals.'));
    const table=el('table',null,{class:'ap-plan-table'}),head=el('thead'),hr=el('tr');
    const headings=ranged?['Category','Lower earned / possible','Upper earned / possible','Lower category grade','Upper category grade','Effective weight','Lower contribution','Upper contribution']:['Category','Earned / possible','Category grade','Effective weight','Contribution'];
    for(const text of headings)hr.append(el('th',text,{scope:'col'}));head.append(hr);table.append(head);
    const body=el('tbody'),weightTotal=result.categories.reduce((sum,c)=>sum+(c.weight||0),0);
    const upperCategories=new Map((upper?.categories||[]).map(c=>[c.name,c]));
    for(const c of result.categories){
      const share=rules.mode==='weighted'?(weightTotal?c.weight/weightTotal:0):(result.totalPossible?c.possible/result.totalPossible:0),high=upperCategories.get(c.name);
      const contribution=percent=>`${fmt(percent*share*(rules.averageMaximum||100)/100)} ${rules.averageMaximum?'grade points':'percentage points'}`;
      const cells=ranged?[c.name,`${fmt(c.earned)} / ${fmt(c.possible)}`,`${fmt(high.earned)} / ${fmt(high.possible)}`,planningFormat(c.percent,rules),planningFormat(high.percent,rules),`${fmt(share*100)}%`,contribution(c.percent),contribution(high.percent)]:[c.name,`${fmt(c.earned)} / ${fmt(c.possible)}`,planningFormat(c.percent,rules),`${fmt(share*100)}%`,contribution(c.percent)];
      const row=el('tr');for(const text of cells)row.append(el('td',text));body.append(row);
    }
    table.append(body);const scroll=el('div',null,{class:'ap-plan-scroll'});scroll.append(table);box.append(scroll);
    box.append(note(rules.mode==='weighted'?'Each category grade × its share of active category weights; add the contributions. Empty categories are omitted and active weights are normalized. Zero-weight categories contribute 0.':ranged?`Points calculation — lower: ${fmt(result.totalEarned)} ÷ ${fmt(result.totalPossible)} × ${fmt(rules.averageMaximum||100)}; upper: ${fmt(upper.totalEarned)} ÷ ${fmt(upper.totalPossible)} × ${fmt(rules.averageMaximum||100)}.`:`Points calculation: ${fmt(result.totalEarned)} ÷ ${fmt(result.totalPossible)} × ${fmt(rules.averageMaximum||100)}.`));
    if(rules.scoreFloor!=null||rules.scoreCeiling!=null)box.append(note(`Assignment percentages are limited before totaling: minimum ${rules.scoreFloor==null?'unset':fmt(rules.scoreFloor)+'%'}, maximum ${rules.scoreCeiling==null?'unset':fmt(rules.scoreCeiling)+'%'}.`));
    const rawTotal=ranged?`Unrounded total — lower: ${planningFormat(result.value,rules)}; upper: ${planningFormat(upper.value,rules)}.`:`Unrounded total: ${planningFormat(result.value,rules)}.`;
    box.append(note(rules.rounding&&rules.rounding!=='none'?`${rawTotal} Final-grade rounding: ${rules.rounding}, ${rules.roundingDecimals} decimal places.`:rules.rounding==='none'?'Course profile specifies no final-grade rounding.':'No rounding policy has been supplied; reconstructed values are unrounded.'));
    const omitted=result.effectiveAssignments.filter(a=>a.counted===false||a.included===false||a.earned===null);
    if(omitted.length)box.append(note('Not counted: '+omitted.map(a=>`${a.name||'Unnamed assignment'} (${a.earned===null?'ungraded':'excluded'})`).join('; ')+'.'));
    if(active){
      const names=new Map(model.assignments.map(a=>[a.id,a.name]));
      const endpoints=ranged?[['At lower scores',result],['At upper scores',upper]]:[['Hypothetical replacement',result]];
      for(const [label,endpoint]of endpoints)for(const r of endpoint.appliedReplacements)box.append(note(`${label}: ${names.get(r.sourceId)} → ${names.get(r.targetId)}, ${fmt(r.originalEarned)} / ${fmt(r.possible)} becomes ${fmt(r.newEarned)} / ${fmt(r.possible)}.`));
      const pending=resolvePlanningRules(model.assignments).pending;for(const p of pending)box.append(note('Inactive rule: '+p));
      if(gradeLab.replacementDraft.length&&!result.appliedReplacements.length&&!upper?.appliedReplacements.length&&!pending.length)box.append(note('No rule currently changes a score. Both assignments must count and have scores; “only if higher” also requires an improvement after any cap. The target calculator supplies the candidate score before applying these rules.'));
    }
  }

  function buildGradingProfileUI(container, onSaved) {
    if (!gradeLab) return null;
    const context = gradeLab;
    const scope = profileKey();
    const isCurrent = () => gradeLab === context && profileKey() === scope;
    const course = courseFor({ key: context.key, title: context.current.title });
    const posted = context.parsed.rules || {};
    const saved = course.gradingRules && typeof course.gradingRules === 'object' ? course.gradingRules : null;
    const draft = course.gradingProfileDraft && typeof course.gradingProfileDraft === 'object' ? course.gradingProfileDraft : null;
    const section = el('section', null, { class: 'ap-plan-section', 'aria-labelledby': 'ap-profile-title' });
    section.append(el('h3', 'Course grading profile', { id: 'ap-profile-title' }),
      note(context.current.title, 'ap-plan-message'),
      note('Changes save automatically in this browser for this course. Complete, valid rules apply to local hypothetical simulations; incomplete edits are kept as a draft.', 'ap-plan-message'));
    const message = el('p', '', { class: 'ap-plan-message', role: 'status', 'aria-live': 'polite' });
    const grid = el('div', null, { class: 'ap-plan-grid' });
    const controls = [];
    function addField(label, control, parent = grid) {
      controls.push(control);
      control.addEventListener('change', () => saveProfile(false));
      if(control.tagName !== 'SELECT')control.addEventListener('input', () => saveProfile(false));
      const wrapper = el('label', null, { class: 'ap-plan-field', for: control.id });
      wrapper.append(el('span', label), control);
      parent.append(wrapper);
      return control;
    }
    function select(id, choices, label) {
      const control = el('select', null, { id });
      control.append(el('option', 'Choose…', { value: '' }));
      for (const [value, title] of choices) control.append(el('option', title, { value }));
      control.value = '';
      return addField(label, control);
    }
    function number(id, label, attrs = {}) {
      return addField(label, el('input', null, { id, type: 'text', inputmode: 'decimal', autocomplete: 'off', ...attrs }));
    }
    const mode = select('ap-profile-mode', [['points', 'Total points'], ['weighted', 'Weighted categories']], 'Calculation method');
    const scale = select('ap-profile-scale', [['percent', 'Percentage'], ['average', 'Average score']], 'Course grade scale');
    const maximum = number('ap-profile-maximum', 'Average scale maximum');
    const rounding = select('ap-profile-rounding', [['none', 'No rounding'], ['nearest', 'Round to nearest'], ['down', 'Round down'], ['up', 'Round up']], 'Final-grade rounding');
    const decimals = number('ap-profile-decimals', 'Decimal places', { min: '0', max: '8', step: '1' });
    const floor = number('ap-profile-floor', 'Minimum assignment score (%) — optional', { min: '0' });
    const ceiling = number('ap-profile-ceiling', 'Maximum assignment score (%) — optional', { min: '0' });
    section.append(grid);
    const weightsBox = el('section', null, { 'aria-label': 'Category weights' });
    weightsBox.append(el('h4', 'Category weights'),
      note('Enter a weight for each counted category, including 0 for a category that should not affect the grade. Active weights are normalized for the calculation.', 'ap-plan-message'));
    const weightGrid = el('div', null, { class: 'ap-plan-grid' });
    weightsBox.append(weightGrid);
    section.append(weightsBox);
    const weightControls = new Map();
    const normalizedCategory = value => typeof value === 'string' && value.trim() ? value.trim() : 'Uncategorized';
    const categories = new Set();
    for (const category of posted.categories || []) if (category.name) categories.add(normalizedCategory(category.name));
    for (const category of Object.keys(posted.weights || {})) categories.add(normalizedCategory(category));
    for (const assignment of [...(context.parsed.assignments || []), ...(context.added || [])]) categories.add(normalizedCategory(assignment.category));
    for (const category of Object.keys(saved?.weights || {})) categories.add(normalizedCategory(category));
    for (const category of Object.keys(draft?.weights || {})) categories.add(normalizedCategory(category));
    function ensureWeight(category) {
      if (weightControls.has(category)) return weightControls.get(category);
      const control = el('input', null, { type: 'text', inputmode: 'decimal', autocomplete: 'off', id: `ap-profile-weight-${weightControls.size}` });
      addField(`${category} weight`, control, weightGrid);
      weightControls.set(category, control);
      return control;
    }
    for (const category of categories) ensureWeight(category);
    const finiteValue = value => typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
    function applyValues(values) {
      mode.value = ['points', 'weighted'].includes(values?.mode) ? values.mode : '';
      scale.value = ['percent', 'average'].includes(values?.scale) ? values.scale : '';
      maximum.value = finiteValue(values?.averageMaximum);
      rounding.value = ['none', 'nearest', 'down', 'up'].includes(values?.rounding) ? values.rounding : '';
      decimals.value = finiteValue(values?.roundingDecimals);
      floor.value = finiteValue(values?.scoreFloor);
      ceiling.value = finiteValue(values?.scoreCeiling);
      for (const [category, control] of weightControls) control.value = finiteValue(values?.weights?.[category]);
      updateVisibility();
    }
    const draftControls = {mode,scale,maximum,rounding,decimals,floor,ceiling};
    function captureDraft() {
      return {fields:Object.fromEntries(Object.entries(draftControls).map(([name,control])=>[name,control.value])),
        weights:Object.fromEntries([...weightControls].map(([category,control])=>[category,control.value]))};
    }
    function applyDraft(values) {
      for(const [name,control] of Object.entries(draftControls))if(typeof values?.fields?.[name]==='string')control.value=values.fields[name];
      for(const [category,control] of weightControls)if(typeof values?.weights?.[category]==='string')control.value=values.weights[category];
      updateVisibility();
    }
    function updateVisibility() {
      maximum.parentElement.hidden = scale.value !== 'average';
      maximum.disabled = scale.value !== 'average';
      decimals.parentElement.hidden = !rounding.value || rounding.value === 'none';
      decimals.disabled = !rounding.value || rounding.value === 'none';
      weightsBox.hidden = mode.value !== 'weighted';
      for (const control of weightControls.values()) control.disabled = mode.value !== 'weighted';
    }
    mode.addEventListener('change', updateVisibility);
    scale.addEventListener('change', updateVisibility);
    rounding.addEventListener('change', updateVisibility);
    const actions = el('div', null, { class: 'ap-lab-actions' });
    const copy = button('Copy values shown by Aeries', () => {
      if (!isCurrent()) return;
      const copied = {
        mode: posted.mode,
        weights: posted.weights,
        scale: posted.scale || (Number.isFinite(posted.averageMaximum) && posted.averageMaximum > 0 ? 'average' : posted.officialUnit === 'percent' ? 'percent' : ''),
        averageMaximum: posted.averageMaximum,
        scoreFloor: posted.scoreFloor,
        scoreCeiling: posted.scoreCeiling
      };
      applyValues(copied);
      saveProfile(false);
      if(!storageError)message.textContent = 'Copied available values shown by Aeries and saved the draft. Choose the rounding rule and complete any missing fields to apply these rules automatically.';
    });
    copy.id = 'ap-profile-copy';
    function activeCategories() {
      const active = new Set();
      const count = (assignment, draft) => {
        const source = draft || assignment;
        const earned = source.earned === '' || source.earned === null || source.earned === undefined ? null : Number(source.earned);
        const possible = source.possible === '' || source.possible === null || source.possible === undefined ? null : Number(source.possible);
        if (source.included !== false && Number.isFinite(earned) && Number.isFinite(possible) && possible > 0) active.add(normalizedCategory(assignment.category));
      };
      for (const assignment of context.parsed.assignments || []) count(assignment, context.edits?.get(assignment.id));
      for (const assignment of context.added || []) count(assignment);
      return active;
    }
    function saveProfile(manual = false) {
      if (!isCurrent()) return;
      updateVisibility();
      controls.forEach(control => control.removeAttribute('aria-invalid'));
      const problems = [];
      const invalid = (control, text) => {
        control.setAttribute('aria-invalid', 'true');
        problems.push({ control, text });
      };
      const readNumber = (control, label, { required = false, positive = false, integer = false, upper = null } = {}) => {
        if (!control.value.trim()) {
          if (required || control.validity?.badInput) invalid(control, `Enter ${label}.`);
          return null;
        }
        const value = Number(control.value);
        if (!Number.isFinite(value) || value < 0 || (positive && value <= 0) || (integer && !Number.isInteger(value)) || (upper !== null && value > upper)) {
          invalid(control, `${label} must be ${integer ? 'a whole number from 0 to 8' : positive ? 'a positive number' : 'a nonnegative number'}.`);
          return null;
        }
        return value;
      };
      if (!mode.value) invalid(mode, 'Choose a calculation method.');
      if (!scale.value) invalid(scale, 'Choose a course grade scale.');
      if (!rounding.value) invalid(rounding, 'Choose a final-grade rounding rule.');
      const averageMaximum = scale.value === 'average' ? readNumber(maximum, 'the average scale maximum', { required: true, positive: true }) : null;
      const roundingDecimals = rounding.value && rounding.value !== 'none' ? readNumber(decimals, 'decimal places', { required: true, integer: true, upper: 8 }) : null;
      const scoreFloor = readNumber(floor, 'the minimum assignment score');
      const scoreCeiling = readNumber(ceiling, 'the maximum assignment score');
      if (scoreFloor !== null && scoreCeiling !== null && scoreFloor > scoreCeiling) invalid(ceiling, 'The maximum assignment score must be at least the minimum.');
      const weights = Object.create(null);
      if (mode.value === 'weighted') {
        const active = activeCategories();
        for (const category of active) ensureWeight(category);
        for (const [category, control] of weightControls) {
          const value = readNumber(control, `a weight for ${category}`, { required: active.has(category) });
          if (value !== null) weights[category] = value;
        }
        const used = active.size ? [...active].map(category => weights[category]) : Object.values(weights);
        if (!used.some(value => Number.isFinite(value) && value > 0)) {
          const first = active.size ? weightControls.get([...active][0]) : weightControls.values().next().value;
          invalid(first || mode, 'Enter at least one positive weight for a counted category.');
        }
      }
      // Persist only the small rule form; never the gradebook DOM, grades,
      // score edits, or calculated results. Invalid drafts do not replace rules.
      course.gradingProfileDraft = captureDraft();
      if (problems.length) {
        const stored = persist();
        message.textContent = stored ? 'Draft saved. ' + problems.map(problem => problem.text).join(' ') + (course.gradingRules ? ' The last valid grading profile remains in use.' : ' These incomplete rules are not applied yet.') : storageError;
        if(manual)problems[0].control.focus();
        return;
      }
      const previous = JSON.stringify(course.gradingRules);
      course.gradingRules = { mode: mode.value, weights: { ...weights }, scale: scale.value, averageMaximum,
        rounding: rounding.value, roundingDecimals, scoreFloor, scoreCeiling };
      const stored = persist();
      message.textContent = stored ? 'Course grading profile saved automatically. These rules now apply to this course’s local hypothetical simulations.' : storageError;
      if (previous !== JSON.stringify(course.gradingRules) && typeof onSaved === 'function') onSaved();
    }
    const save = button('Save course grading profile', () => saveProfile(true));
    save.id = 'ap-profile-save';
    const clear = button('Clear saved grading profile', () => {
      if (!isCurrent()) return;
      delete course.gradingRules;
      delete course.gradingProfileDraft;
      const stored = persist();
      applyValues(null);
      controls.forEach(control => control.removeAttribute('aria-invalid'));
      message.textContent = stored ? 'No saved grading profile. All rule fields are blank; no preset rules were applied.' : storageError;
      if (typeof onSaved === 'function') onSaved();
    });
    clear.id = 'ap-profile-clear';
    actions.append(copy, save, clear);
    section.append(actions, message);
    applyValues(saved);
    if(draft)applyDraft(draft);
    message.textContent = draft ? 'Saved form restored. Edits save automatically; only complete, valid rules are applied.' : saved ? 'Saved course grading profile loaded. Changes save automatically.' : 'No saved grading profile. Choose each rule explicitly or copy available values shown by Aeries.';
    container.append(section);
    return section;
  }

  function labContain(node){
    for(const type of ['click','dblclick','input','change','keyup','keypress','pointerdown'])node.addEventListener(type,e=>e.stopPropagation());
    node.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')e.preventDefault();});
  }
  function applyLabActionTypography(ui,source){
    // Buttons and labels can have their own Aeries/browser font declarations.
    // Use the adjacent native text's family without copying its heading size.
    const family=source.ownerDocument.defaultView.getComputedStyle(source).getPropertyValue('font-family');
    if(!family)return;
    for(const node of [ui,...ui.querySelectorAll('label,button,span')])node.style.setProperty('font-family',family,'important');
  }
  function labNativeTypography(cell){
    // The native number may be styled by a nested span rather than its cell.
    // Capture it before hiding/wrapping the original DOM, then reuse the snapshot.
    const numericParent=node=>{
      for(const child of node.childNodes||[]){
        if(child.nodeType===3 && /\d/.test(child.textContent||''))return child.parentElement;
        if(child.nodeType===1 && !child.hasAttribute('data-ap-owned')){
          const found=numericParent(child);if(found)return found;
        }
      }
      return null;
    };
    const source=numericParent(cell)||cell;
    const computed=cell.ownerDocument.defaultView.getComputedStyle(source);
    const properties=['font-family','font-size','font-weight','font-style','font-stretch',
      'font-variant','font-variant-numeric','font-feature-settings','font-kerning',
      'font-optical-sizing','line-height','letter-spacing','text-transform'];
    return Object.fromEntries(properties.map(property=>[property,computed.getPropertyValue(property)]));
  }
  function applyLabNativeTypography(ui,typography){
    if(!ui.matches('.ap-lab-pair,.ap-lab-inline-value'))return;
    // Explicit properties on the inputs beat native form-control font rules.
    for(const node of [ui,...ui.querySelectorAll('input.ap-lab-number,span')]){
      for(const [property,value] of Object.entries(typography))if(value)node.style.setProperty(property,value,'important');
    }
  }
  function labOverlay(cell,ui){
    if(!cell)return;
    let saved=gradeLab.overlays.get(cell);
    if(!saved){
      const typography=labNativeTypography(cell);
      const original=el('span',null,{class:'ap-lab-original','aria-hidden':'true'});
      original.append(...cell.childNodes);cell.append(original);
      saved={original,ui,typography};gradeLab.overlays.set(cell,saved);
    }else saved.ui.remove();
    applyLabNativeTypography(ui,saved.typography);
    saved.ui=ui;ui.setAttribute('data-ap-owned','lab-overlay');cell.append(ui);
  }
  function clearLabOverlays(){
    if(!gradeLab)return;
    if(gradeLab.active)clearImpactLabels();
    for(const [cell,saved]of gradeLab.overlays){
      saved.ui.remove();
      if(saved.original.parentNode===cell)saved.original.replaceWith(...saved.original.childNodes);
    }
    gradeLab.overlays.clear();gradeLab.editors.clear();gradeLab.addedEditors.clear();
    for(const actions of gradeLab.rowActions)actions.remove();gradeLab.rowActions=[];
    for(const badge of gradeLab.badges)badge.remove();gradeLab.badges=[];
    gradeLab.newBody?.remove();gradeLab.newBody=null;
  }
  function closeGradeLab(){
    if(!gradeLab)return;
    for(const entry of gradeLab.assignmentButtons?.values()||[])entry.host.remove();
    gradeLab.assignmentButtons?.clear();
    clearLabOverlays();gradeLab.toolbar.remove();gradeLab=null;
    if(weightMapButton)weightMapButton.textContent='Assignment weight map';
  }
  function labBaselineError(parsed,checked,partial){
    if(!checked.error)return '';
    // An entirely ungraded course can still test its first assignment.
    const result=GradeMath.calculate(parsed.assignments,parsed.rules);
    if(!partial && !result.error && result.usedCount===0 && parsed.rules.categories.length &&
      (parsed.rules.official===null || parsed.rules.official===0) &&
      parsed.rules.categories.every(c=>(c.earned===null||c.earned===0)&&(c.possible===null||c.possible===0)&&(c.grade===null||c.grade===0)))return '';
    return checked.error.replace(/Impact estimates need/g,'Grade testing needs').replace(/impacts will appear/g,'totals will appear').replace(/to calculate impacts/g,'to calculate hypothetical totals');
  }
  function refreshGradeLab(info,key,current,parsed,checked,options){
    const signature=JSON.stringify([profileKey(),key,options.partial,parsed.assignments.map(a=>[a.id,a.name,a.category,a.earned,a.possible,a.included,a.status,a.rawEarned,a.rawPossible]),parsed.rules]);
    const same=gradeLab && gradeLab.signature===signature && gradeLab.info.element===info.element &&
      [...gradeLab.overlays].every(([cell,saved])=>saved.original.parentNode===cell && saved.ui.parentNode===cell) &&
      parsed.assignments.every((a,i)=>a.sourceRow===gradeLab.parsed.assignments[i]?.sourceRow
        && (a.sourceCells||[]).every((cell,j)=>cell===gradeLab.parsed.assignments[i]?.sourceCells?.[j])
        && (a.rawScoreCells||[]).length===(gradeLab.parsed.assignments[i]?.rawScoreCells||[]).length
        && (a.rawScoreCells||[]).every((cell,j)=>cell===gradeLab.parsed.assignments[i]?.rawScoreCells?.[j]));
    const freshNotice=Boolean(gradeLab?.active && !same);
    if(!same){
      closeGradeLab();
      const toolbar=el('section',null,{id:'ap-grade-lab','data-ap-owned':'grade-lab','aria-label':'Hypothetical grade testing'});
      labContain(toolbar);
      gradeLab={signature,key,info,current,parsed,active:false,edits:new Map(),ranges:new Map(),added:[],overlays:new Map(),editors:new Map(),addedEditors:new Map(),assignmentButtons:new Map(),rowActions:[],badges:[],newBody:null,toolbar,
        baselineError:labBaselineError(parsed,checked,options.partial),partial:options.partial,result:null};
      const actions=el('div',null,{class:'ap-lab-actions'});
      const toggle=button('Start grade testing',()=>setGradeLabActive(!gradeLab.active));toggle.id='ap-lab-toggle';toggle.setAttribute('aria-pressed','false');
      const add=button('Add hypothetical assignment',()=>{if(!gradeLab.active)setGradeLabActive(true);addLabAssignment();});add.id='ap-lab-add';
      const reset=button('Reset hypothetical changes',()=>{clearLabOverlays();gradeLab.edits.clear();gradeLab.added=[];gradeLab.replacementDraft=clone(planningCourse().replacementRules||[]);clearPlanningRange(true);mountLabEditors();renderGradeLabResult();scan();});reset.id='ap-lab-reset';reset.hidden=true;
      actions.append(el('strong','Grade testing lab'),toggle,add,reset);
      toolbar.append(actions,el('p',freshNotice?'Gradebook changed. Hypothetical changes were reset.':'Edit scores in the gradebook or add an assignment to try a hypothetical grade.',{class:'ap-lab-help'}),
        el('p','',{id:'ap-lab-result','aria-live':'polite','aria-atomic':'true'}),
        el('p','Hypothetical scores reset when you exit, reload, or change gradebooks. Course grading settings and replacement rules save automatically in this browser. Nothing is submitted to Aeries.'),
        el('p','Turn on Range beside any assignment and choose # correct or Points for its bounds. Multiple ranges update the combined grade automatically. For a single score, edit Score or Complete; the other updates automatically. Blank means ungraded. Raw scores convert to points rounded down to 2 decimals; points entered directly stay exact. For unequal question values, use raw marks.'));
      info.element.before(toolbar);
      initPlanningUI();
    }else if(!gradeLab.toolbar.isConnected)info.element.before(gradeLab.toolbar);
    if(weightMapButton)weightMapButton.textContent=gradeLab.active?'Posted assignment weight map':'Assignment weight map';
    refreshAssignmentLabButtons();
  }
  function assignmentPercentCells(a){
    return [...new Set([a.sourceRow?.querySelector('[id$="_tdPerc"]'),
      ...(a.sourceRows||[]).filter(row=>row.matches('tr.CardView')).map(row=>row.querySelector('[id$="_spTransfer"]'))].filter(Boolean))];
  }
  function refreshAssignmentLabButtons(){
    if(!gradeLab)return;
    const context=gradeLab,buttons=context.assignmentButtons||(context.assignmentButtons=new Map()),present=new Set();
    for(const a of context.parsed.assignments)for(const anchor of assignmentPercentCells(a)){
      if(!anchor.isConnected)continue;
      present.add(anchor);
      let entry=buttons.get(anchor);
      if(!entry){
        const host=el('span',null,{class:'ap-lab-assignment-toggle','data-ap-owned':'lab-assignment-toggle'});
        const toggle=button('',()=>{
          if(gradeLab!==context)return;
          setGradeLabActive(!context.active);
          if(toggle.isConnected)toggle.focus({preventScroll:true});
        });
        for(const type of ['click','dblclick','pointerdown','keydown'])host.addEventListener(type,event=>event.stopPropagation());
        host.append(toggle);entry={host,toggle};buttons.set(anchor,entry);
      }
      // A percentage overlay may have wrapped the original button with its
      // hidden text. Move the same button below the live percentage again.
      if(entry.host.parentNode!==anchor)anchor.append(entry.host);
      const label=context.active?'Exit grade testing':'Start grade testing';
      if(entry.toggle.textContent!==label)entry.toggle.textContent=label;
      entry.toggle.setAttribute('aria-pressed',String(context.active));
      entry.toggle.setAttribute('aria-label',`${label} · ${a.name}`);
    }
    for(const [anchor,entry]of buttons)if(!present.has(anchor)){entry.host.remove();buttons.delete(anchor);}
  }
  function setGradeLabActive(active){
    if(!gradeLab)return;
    clearImpactLabels();
    clearLabOverlays();gradeLab.active=active;
    gradeLab.edits.clear();gradeLab.added=[];
    gradeLab.replacementDraft=clone(planningCourse().replacementRules||[]);
    gradeLab.targetSolution=null;
    clearPlanningRange(true);
    if(gradeLab.planning){
      const ui=gradeLab.planning;for(const n of [ui.assignment,ui.desired,ui.maximum,ui.step,ui.source,ui.destination,ui.policy,ui.cap])n.value='';
      ui.apply.disabled=true;ui.breakdown.replaceChildren();ui.output.textContent='Enter all fields to calculate.';
    }
    const toggle=gradeLab.toolbar.querySelector('#ap-lab-toggle');
    toggle.textContent=active?'Exit grade testing':'Start grade testing';toggle.setAttribute('aria-pressed',String(active));
    gradeLab.toolbar.querySelector('#ap-lab-reset').hidden=!active;
    gradeLab.toolbar.querySelector('.ap-lab-help').textContent=active?'Edit Score or Complete, or turn on Range for any assignments to enter lower and upper bounds. Count controls whether each assignment contributes.':'Edit scores in the gradebook or add an assignment to try a hypothetical grade.';
    if(active)mountLabEditors();
    else gradeLab.toolbar.querySelector('#ap-lab-result').textContent='';
    refreshPlanningUI();
    scan();
  }
  function labAssignmentDraft(id){
    const added=gradeLab.added.find(a=>a.id===id);
    if(added)return added;
    const source=gradeLab.parsed.assignments.find(a=>a.id===id);
    return source?(gradeLab.edits.get(id)||labDraft(source)):null;
  }
  function labHasCountedRanges(){
    return Boolean(gradeLab?.active && [...gradeLab.ranges.keys()].some(id=>labAssignmentDraft(id)?.included));
  }
  function labRangeState(bounds,draft){
    const possible=GradeMath.parseNumber(draft.possible),rawPossible=GradeMath.parseNumber(bounds.rawPossible);
    const mode=bounds.mode||'points';
    const endpoint=key=>{
      const basis=bounds[key+'Mode']||'points',text=String(bounds[key]??''),number=GradeMath.parseNumber(text);
      const converted=basis==='raw'?GradeMath.convertRawScore(text,bounds.rawPossible,draft.possible):null;
      const earned=basis==='raw'?converted.earned:number;
      const raw=basis==='raw'?number:possible>0&&rawPossible>0&&number!==null?number/possible*rawPossible:null;
      const display=mode===basis?text:mode==='points'?(earned===null?'':String(earned)):(Number.isFinite(raw)?fmt(raw):'');
      return {basis,text,number,earned,display,error:converted?.error||''};
    };
    const low=endpoint('low'),high=endpoint('high');
    const invalidPossible=!(possible>0),needsRaw=mode==='raw'||low.basis==='raw'||high.basis==='raw',invalidRawPossible=needsRaw&&!(rawPossible>0);
    // Two raw bounds are ordered before truncation. Mixed units compare actual
    // point scores, so a raw endpoint and its converted point value can be equal.
    const inverted=low.number!==null&&high.number!==null&&(low.basis===high.basis?low.number>high.number:low.earned>high.earned);
    const invalidLow=low.number===null||low.number<0||inverted,invalidHigh=high.number===null||high.number<0||inverted;
    const error=invalidPossible?'Enter a positive Score total.':invalidRawPossible?'Enter a positive number of questions or raw marks.':invalidLow||invalidHigh?'Enter nonnegative lower and upper bounds, with lower no greater than upper.':low.error||high.error;
    return {mode,low,high,possible,rawPossible,needsRaw,invalidPossible,invalidRawPossible,invalidLow,invalidHigh,error};
  }
  function labRangeScenario(model,rules){
    const ranges=[];
    for(const [id,bounds] of gradeLab.ranges){
      const draft=labAssignmentDraft(id);if(!draft?.included)continue;
      const state=labRangeState(bounds,draft);
      if(state.error){const name=model.assignments.find(a=>a.id===id)?.name||'Assignment';return {active:true,result:null,error:`“${name}”: ${state.error}`};}
      ranges.push({assignmentId:id,lowEarned:state.low.earned,highEarned:state.high.earned});
    }
    if(!ranges.length)return {active:false,result:null,error:''};
    const fail=error=>({active:true,result:null,error});
    const pending=resolvePlanningRules(model.assignments).pending;
    const ui=gradeLab.planning;
    if(pending.length)return fail('Resolve or remove unmatched replacement rules before using ranges.');
    if(ui && [ui.source,ui.destination,ui.policy,ui.cap].some(n=>n.value.trim()!==''))
      return fail('Finish adding the replacement rule, or clear its fields, before using ranges.');
    if(model.error)return fail(model.error);
    const result=GradeMath.calculateRanges(model.assignments,rules,ranges);
    return result.error?fail(result.error):{active:true,result,error:''};
  }
  function buildLabRangeControls(id,name,onChange){
    const enabled=input('','checkbox');enabled.setAttribute('aria-label',`Use score range for ${name}`);enabled.dataset.field='rangeEnabled';
    const toggle=el('label');toggle.append(enabled,el('span','Range'));
    const panel=el('span',null,{class:'ap-lab-range-editor','data-ap-owned':'lab-range','data-assignment-id':id,role:'group','aria-label':`Score range for ${name}`});
    const low=labField('','rangeLow',`Lower bound for ${name}`),high=labField('','rangeHigh',`Upper bound for ${name}`),hint=el('small');
    const mode=el('select',null,{'data-field':'rangeMode','aria-label':`Bounds entry units for ${name}`});
    const average=Boolean(gradeLab.parsed.rules.averageMaximum);
    if(!average)mode.append(el('option','# correct',{value:'raw'}));
    mode.append(el('option','Points',{value:'points'}));
    const modeLabel=el('label',null,{class:'ap-lab-range-mode'});modeLabel.append(el('span','Bounds in'),mode);panel.append(modeLabel);
    for(const [label,node] of [['Lower bound',low],['Upper bound',high]]){const group=el('label');group.append(el('span',label),node);panel.append(group);}
    const rawPossible=labField('','rangeRawPossible',`Total questions or raw marks for bounds on ${name}`);
    const rawTotalLabel=el('label',null,{class:'ap-lab-range-total'});rawTotalLabel.append(el('span','Out of'),rawPossible);
    panel.append(rawTotalLabel,hint);labContain(panel);
    const controls={enabled,toggle,panel,low,high,mode,rawPossible,sync:draft=>{
      const bounds=gradeLab.ranges.get(id);enabled.checked=Boolean(bounds);panel.hidden=!bounds;
      if(!bounds)return;
      const state=labRangeState(bounds,draft);mode.value=state.mode;
      if(low.value!==state.low.display)low.value=state.low.display;if(high.value!==state.high.display)high.value=state.high.display;
      if(rawPossible.value!==String(bounds.rawPossible??''))rawPossible.value=String(bounds.rawPossible??'');
      rawTotalLabel.hidden=average||!state.needsRaw;
      low.setAttribute('aria-invalid',String(state.invalidLow));high.setAttribute('aria-invalid',String(state.invalidHigh));
      rawPossible.setAttribute('aria-invalid',String(state.invalidRawPossible));
      low.setAttribute('aria-label',`Lower bound in ${state.mode==='raw'?'number correct':'points'} for ${name}`);
      high.setAttribute('aria-label',`Upper bound in ${state.mode==='raw'?'number correct':'points'} for ${name}`);
      low.disabled=high.disabled=mode.disabled=rawPossible.disabled=!draft.included;panel.dataset.excluded=String(!draft.included);
      hint.textContent=!draft.included?'Not counted':state.error?state.error:state.mode==='raw'
        ?`${fmt(state.low.earned)}–${fmt(state.high.earned)} points out of ${fmt(state.possible)}${state.low.basis==='points'||state.high.basis==='points'?' · Equivalent # correct; entered points stay exact.':''}`
        :`Score points out of ${fmt(state.possible)}${state.low.basis==='raw'||state.high.basis==='raw'?' · Linked to # correct.':''}`;
    }};
    enabled.addEventListener('change',()=>{
      if(enabled.checked){
        const draft=labAssignmentDraft(id),state=labScoreState(draft),score=state.error?null:state.earned;
        const entryMode=!average&&state.rawPossible>0?'raw':'points';
        const basis=score===null?entryMode:entryMode==='raw'&&draft.scoreMode==='raw'&&!draft.rawDerived?'raw':'points';
        const value=score===null?'0':basis==='raw'?String(draft.rawEarned):String(score),total=basis==='raw'?state.rawPossible:state.possible;
        gradeLab.ranges.set(id,{mode:entryMode,lowMode:basis,highMode:basis,low:value,high:score===null?(total>0?String(total):''):value,rawPossible:draft.rawPossible||''});
      }else gradeLab.ranges.delete(id);
      onChange();
    });
    mode.addEventListener('change',()=>{
      const bounds=gradeLab.ranges.get(id);if(!bounds||!['points','raw'].includes(mode.value)||average&&mode.value==='raw')return;
      // Unit switches only change the display. Each endpoint retains its entered
      // units and precision until that particular endpoint is edited again.
      gradeLab.ranges.set(id,{...bounds,mode:mode.value});onChange();
    });
    rawPossible.addEventListener('input',()=>{
      const bounds=gradeLab.ranges.get(id);if(!bounds)return;
      gradeLab.ranges.set(id,{...bounds,rawPossible:rawPossible.value});onChange();
    });
    for(const [key,node] of [['low',low],['high',high]])node.addEventListener('input',()=>{
      const bounds=gradeLab.ranges.get(id);if(!bounds)return;
      gradeLab.ranges.set(id,{...bounds,[key]:node.value,[key+'Mode']:bounds.mode||'points'});onChange();
    });
    return controls;
  }
  function connectLabRangeControls(scoreControls,range){
    const syncScore=scoreControls.sync;
    scoreControls.range=range;
    scoreControls.sync=draft=>{
      syncScore(draft);range.sync(draft);
      const active=range.enabled.checked;
      if(active && draft.included)scoreControls.possible.setAttribute('aria-invalid',String(!(GradeMath.parseNumber(draft.possible)>0)));
      for(const node of [scoreControls.earned,scoreControls.rawEarned,scoreControls.rawPossible]){
        node.disabled=active;
        if(active)node.setAttribute('aria-invalid','false');
      }
    };
  }
  function labDraft(a){
    const average=Boolean(gradeLab?.parsed?.rules?.averageMaximum);
    const rawPossible=!average&&Number.isFinite(a.rawPossible)&&a.rawPossible>0?String(a.rawPossible):'';
    const rawEarned=!average&&a.earned!==null&&Number.isFinite(a.rawEarned)?String(a.rawEarned):'';
    const converted=rawPossible&&rawEarned!==''?GradeMath.convertRawScore(rawEarned,rawPossible,a.possible):null;
    // Complete 0 / total does not make an ungraded assignment a counted zero.
    // Posted point overrides remain authoritative; their raw equivalent is an estimate.
    const matches=a.earned===null||(converted&&!converted.error&&Math.abs(converted.earned-a.earned)<1e-9);
    const draft={earned:a.earned===null?'':String(a.earned),possible:a.possible===null?'':String(a.possible),included:a.status!=='excluded',
      scoreMode:rawPossible&&matches?'raw':'points',rawEarned,rawPossible,rawDerived:false};
    if(!average&&rawPossible&&!matches){
      const points=GradeMath.parseNumber(draft.earned),possible=GradeMath.parseNumber(draft.possible);
      const equivalent=points!==null&&points>=0&&possible>0?points/possible*Number(rawPossible):NaN;
      draft.rawEarned=Number.isFinite(equivalent)?String(equivalent):'';draft.rawDerived=draft.rawEarned!=='';
    }
    return draft;
  }
  function labField(value,name,label){
    const n=input(value);n.dataset.field=name;n.setAttribute('aria-label',label);n.autocomplete='off';
    n.setAttribute('inputmode','decimal');return n;
  }
  function labScoreState(draft){
    const raw=draft.scoreMode==='raw',text=raw?draft.rawEarned:draft.earned;
    const blank=String(text??'').trim()==='',possible=GradeMath.parseNumber(draft.possible);
    const rawTotal=GradeMath.parseNumber(draft.rawPossible),number=GradeMath.parseNumber(text);
    const invalidEarned=!blank&&(number===null||number<0);
    const invalidPossible=!blank&&(possible===null||possible<=0);
    const invalidRawPossible=raw&&!blank&&(rawTotal===null||rawTotal<=0);
    const converted=raw&&!blank?GradeMath.convertRawScore(draft.rawEarned,draft.rawPossible,draft.possible):null;
    const earned=blank?null:raw?converted.earned:invalidEarned?null:number;
    const error=invalidEarned||invalidRawPossible||(draft.included&&invalidPossible)||converted?.error;
    return {earned,possible,blank,invalidEarned,invalidPossible,invalidRawPossible,
      rawEarned:GradeMath.parseNumber(draft.rawEarned),rawPossible:rawTotal,rawDerived:Boolean(draft.rawDerived),
      error:error?(raw?'Enter a nonnegative number correct and positive totals.':'Enter a nonnegative score and a positive total.'):''};
  }
  function updateLabScoreDraft(draft,field,value){
    const next={...draft};
    if(!['earned','possible','rawEarned','rawPossible'].includes(field))return next;
    next[field]=String(value??'');
    const previous=GradeMath.parseNumber(draft[field]),entered=GradeMath.parseNumber(next[field]);
    // Merely re-entering an equivalent value must not round-trip inferred raw marks.
    if(previous!==null&&entered!==null&&previous===entered)return next;
    const raw=field==='rawEarned'||field==='rawPossible';
    next.scoreMode=raw?'raw':'points';
    if(raw){
      // When no raw total was available, entering it first links the existing points.
      const points=GradeMath.parseNumber(draft.earned),possible=GradeMath.parseNumber(next.possible);
      if(field==='rawPossible'&&String(draft.rawEarned??'').trim()===''&&draft.scoreMode!=='raw'&&points!==null&&points>=0&&possible>0&&entered>0){
        const equivalent=points/possible*entered;
        next.rawEarned=Number.isFinite(equivalent)?String(equivalent):'';
        next.scoreMode='points';next.rawDerived=next.rawEarned!=='';return next;
      }
      if(field==='rawEarned')next.rawDerived=false;
      if(String(next.rawEarned??'').trim()===''){
        next.earned='';next.rawDerived=false;return next;
      }
      const converted=GradeMath.convertRawScore(next.rawEarned,next.rawPossible,next.possible);
      next.earned=converted.error?'':String(converted.earned);
    }else{
      const points=GradeMath.parseNumber(next.earned),possible=GradeMath.parseNumber(next.possible),total=GradeMath.parseNumber(next.rawPossible);
      const equivalent=points!==null&&points>=0&&possible>0&&total>0?points/possible*total:NaN;
      next.rawEarned=Number.isFinite(equivalent)?String(equivalent):'';
      next.rawDerived=next.rawEarned!=='';
    }
    return next;
  }
  function labPointDraft(draft,earned){return {...updateLabScoreDraft(draft,'earned',earned),included:true};}
  function sizeLabNumberInput(node){
    // Native field-sizing uses the actual font glyphs. This fallback also grows
    // with partial decimals and shrinks after deletion on older browsers.
    const text=node.value||node.placeholder||'0';
    const width=Array.from(text).reduce((sum,char)=>sum+(/[.,]/.test(char)?.5:1),0);
    node.style.setProperty('--ap-lab-input-width',`calc(${Math.max(.8,width)}ch + 3px)`);
  }
  function buildLabScoreControls(draft,name,onChange,average=false){
    const pair=(kind)=>el('span',null,{class:'ap-lab-editor ap-lab-pair','data-score-kind':kind});
    const score=pair('points'),raw=pair('raw');
    const earned=labField(draft.earned,'earned',`Hypothetical score for ${name}`);
    const possible=labField(draft.possible,'possible',`Score total for ${name}`);
    const rawEarned=labField(draft.rawEarned||'','rawEarned',`Number correct or raw score for ${name}`);
    const rawPossible=labField(draft.rawPossible||'','rawPossible',`Total questions or raw marks for ${name}`);
    const controls={earned,possible,rawEarned,rawPossible};
    for(const [key,node] of Object.entries(controls)){
      node.className='ap-lab-number'+(/Possible$|^possible$/.test(key)?' ap-lab-denominator':'');
      node.spellcheck=false;node.setAttribute('title',node.getAttribute('aria-label'));
    }
    rawPossible.placeholder='?';
    score.append(earned,el('span','/',{'aria-hidden':'true'}),possible);
    raw.append(rawEarned,el('span','/',{'aria-hidden':'true'}),rawPossible);
    labContain(score);labContain(raw);
    if(average){possible.readOnly=true;raw.hidden=true;}
    const c={score,raw,...controls};
    let current={...draft},editingField='';
    c.sync=next=>{
      current={...next};
      const rawNumber=GradeMath.parseNumber(next.rawEarned);
      const values={earned:next.earned,possible:next.possible,rawPossible:next.rawPossible||'',
        rawEarned:next.rawDerived&&rawNumber!==null&&editingField!=='rawEarned'&&document.activeElement!==rawEarned?fmt(rawNumber):next.rawEarned||''};
      // Keep the active input node and typed string intact, including partial
      // decimals. Changing a partner never feeds its display rounding back.
      for(const [key,node] of Object.entries(controls)){
        if(node.value!==String(values[key]??''))node.value=String(values[key]??'');
        sizeLabNumberInput(node);
      }
      const state=labScoreState(next),fromRaw=next.scoreMode==='raw';
      earned.setAttribute('aria-invalid',String(!fromRaw&&state.invalidEarned));
      rawEarned.setAttribute('aria-invalid',String(fromRaw&&state.invalidEarned));
      possible.setAttribute('aria-invalid',String(state.invalidPossible));
      rawPossible.setAttribute('aria-invalid',String(state.invalidRawPossible));
      rawEarned.title=next.rawDerived?'Equivalent raw score (approximate). Your entered points are kept exactly.':`Number correct or raw score for ${name}`;
    };
    for(const [key,node] of Object.entries(controls))node.addEventListener('input',()=>{
      editingField=key;
      try{const next=updateLabScoreDraft(current,key,node.value);c.sync(next);onChange(next);}
      finally{editingField='';}
    });
    c.sync(draft);return c;
  }
  function mountLabEditors(){
    if(!gradeLab?.active)return;
    for(const a of gradeLab.parsed.assignments){
      const controls=[],sources=a.sourceCells||[a.sourceCell];
      const rawTargets=(a.rawScoreCells||[]).filter(cell=>cell?.isConnected);
      for(const [index,cell] of sources.entries()){
        if(!cell?.isConnected)continue;
        const draft=gradeLab.edits.get(a.id)||labDraft(a);
        const included=input('','checkbox');included.checked=draft.included;included.dataset.field='included';included.setAttribute('aria-label',`Count hypothetical score for ${a.name}`);
        const count=el('label');count.append(included,el('span','Count'));
        const undo=button('Reset',()=>{gradeLab.edits.delete(a.id);gradeLab.ranges.delete(a.id);syncLabEditors(a.id);renderGradeLabResult();},'ap-lab-undo');undo.setAttribute('aria-label',`Reset hypothetical score for ${a.name}`);
        const actions=el('span',null,{class:'ap-lab-row-actions','data-ap-owned':'lab-actions'});actions.append(count,undo);labContain(actions);
        const update=next=>{
          next={...next,included:included.checked};
          if(JSON.stringify(next)===JSON.stringify(labDraft(a)))gradeLab.edits.delete(a.id);else gradeLab.edits.set(a.id,next);
          syncLabEditors(a.id);renderGradeLabResult();
        };
        const c=buildLabScoreControls(draft,a.name,update,Boolean(gradeLab.parsed.rules.averageMaximum));
        const range=buildLabRangeControls(a.id,a.name,()=>{syncLabEditors(a.id);renderGradeLabResult();});
        connectLabRangeControls(c,range);actions.append(range.toggle);
        c.score.dataset.assignmentId=a.id;c.raw.dataset.assignmentId=a.id;
        const view=cell.closest('tr.assignment-info,tr.CardView');
        const rawCell=rawTargets.find(target=>view?.contains(target)&&target!==cell&&!target.contains(cell)&&!cell.contains(target));
        labOverlay(cell,c.score);
        if(!gradeLab.parsed.rules.averageMaximum){
          if(rawCell)labOverlay(rawCell,c.raw);
          else{
            // Some table layouts omit Complete even when the card exposes it.
            // Keep both linked pairs available in a compact second line.
            const fallback=el('span',null,{class:'ap-lab-raw-fallback'});
            c.score.className+=' ap-lab-has-fallback';
            fallback.append(el('small','Complete'),c.raw);c.score.append(fallback);
          }
        }
        const actionHost=a.sourceNameCells?.[index];
        const actionSource=actionHost?.isConnected?actionHost:cell;
        actionSource.append(actions);applyLabActionTypography(actions,actionSource);gradeLab.rowActions.push(actions);
        (cell.closest('.RightSide')||cell).append(range.panel);gradeLab.rowActions.push(range.panel);
        included.addEventListener('change',()=>update(gradeLab.edits.get(a.id)||labDraft(a)));
        controls.push({...c,ui:c.score,included,undo});
      }
      gradeLab.editors.set(a.id,controls);
    }
    renderGradeLabResult();
  }
  function syncLabEditors(id,except){
    const source=gradeLab.parsed.assignments.find(a=>a.id===id),draft=gradeLab.edits.get(id)||labDraft(source);
    for(const c of gradeLab.editors.get(id)||[]){
      if(c.ui!==except){c.sync(draft);c.included.checked=draft.included;}
      c.undo.disabled=!gradeLab.edits.has(id)&&!gradeLab.ranges.has(id);
    }
  }
  function labCategories(){return [...new Set([...gradeLab.parsed.rules.categories.map(c=>c.name),...gradeLab.parsed.assignments.map(a=>a.category)])].filter(Boolean);}
  function styleLabAssignmentCard(card){
    // Sample the native card's appearance without cloning its IDs, controls,
    // or event handlers. Fall back to the standard Aeries card when it is absent.
    const native=gradeLab.parsed.assignments.flatMap(a=>a.sourceRows||[]).find(row=>row.matches('tr.CardView'));
    if(!native)return;
    const heading=native.querySelector('.TextHeading'),score=native.querySelector('.ScoreCard');
    const copy=(node,properties)=>{
      if(!node)return;
      const style=getComputedStyle(node);
      for(const [property,variable] of Object.entries(properties)){
        const value=style.getPropertyValue(property);if(value)card.style.setProperty(variable,value);
      }
    };
    copy(heading,{'font-family':'--ap-card-font','font-size':'--ap-card-title-size','font-weight':'--ap-card-title-weight'});
    copy(score,{'font-size':'--ap-card-score-size','font-weight':'--ap-card-score-weight'});
    copy(native.querySelector('.TextSubSectionCategory'),{'font-size':'--ap-card-category-size'});
    copy(native.querySelector('.RightSide .TextSubSection'),{'font-size':'--ap-card-label-size','color':'--ap-card-label-color'});
    copy(native.querySelector('[id$="_completeData"] .FullWidth'),{'font-size':'--ap-card-raw-size'});
    const surface=native.querySelector('.Card');
    if(surface){
      copy(surface,{'border-top':'--ap-card-border','border-radius':'--ap-card-radius','box-shadow':'--ap-card-shadow',
        'padding':'--ap-card-padding','margin':'--ap-card-margin','box-sizing':'--ap-card-box-sizing','color':'--ap-card-text'});
      const style=getComputedStyle(surface);
      if(style.backgroundColor!=='transparent'&&style.backgroundColor!=='rgba(0, 0, 0, 0)')card.style.setProperty('--ap-card-background',style.backgroundColor);
      // Reuse percentage width instead of freezing the current pixel width.
      if(surface.style.width.endsWith('%'))card.style.setProperty('--ap-card-width',surface.style.width);
      const cell=surface.closest('td');
      if(cell)card.parentElement.style.setProperty('--ap-card-cell-padding',getComputedStyle(cell).padding);
    }
  }
  function addLabAssignment(){
    const categories=labCategories(),average=gradeLab.parsed.rules.averageMaximum;
    const a={id:'hypothetical:'+ ++gradeLabNextId,name:'',category:'',earned:'',possible:average?String(average):'',included:true,scoreMode:'points',rawEarned:'',rawPossible:''};
    gradeLab.added.push(a);
    if(!gradeLab.newBody){gradeLab.newBody=el('tbody',null,{'data-ap-owned':'lab-assignments'});gradeLab.info.element.append(gradeLab.newBody);}
    const row=el('tr',null,{class:'ap-lab-new-row','data-assignment-id':a.id,'data-ap-owned':'lab-assignment'});
    const cell=el('td',null,{colspan:Math.max(1,gradeLab.info.headers.length)});labContain(cell);
    const card=el('div',null,{class:'ap-lab-new-card'}),main=el('div',null,{class:'ap-lab-new-main'});
    const heading=el('div',null,{class:'ap-lab-new-heading'}),scores=el('div',null,{class:'ap-lab-new-scores'});
    cell.append(card);styleLabAssignmentCard(card);
    const name=input(a.name);name.className='ap-lab-new-name';name.dataset.field='name';name.maxLength=120;name.placeholder='Assignment name';name.setAttribute('aria-label','Hypothetical assignment name');
    const category=el('select',null,{class:'ap-lab-new-category-input','aria-label':'Hypothetical assignment category','data-field':'category'});
    category.append(el('option','Choose a category',{value:''}));
    for(const c of categories.length?categories:['Uncategorized'])category.append(el('option',c,{value:c}));category.value=a.category;
    const categoryLine=el('div',null,{class:'ap-lab-new-category'});
    categoryLine.append(el('i',null,{class:'fa fa-file-text','aria-hidden':'true'}),category);
    const scoreControls=buildLabScoreControls(a,'new hypothetical assignment',next=>{Object.assign(a,next);renderGradeLabResult();},Boolean(average));
    const range=buildLabRangeControls(a.id,'new hypothetical assignment',()=>renderGradeLabResult());
    connectLabRangeControls(scoreControls,range);
    const included=input('','checkbox');included.checked=a.included;included.dataset.field='included';included.setAttribute('aria-label','Count hypothetical assignment');
    included.addEventListener('change',()=>{a.included=included.checked;renderGradeLabResult();});
    const count=el('label');count.append(included,el('span','Count'));
    const remove=button('Remove',()=>{gradeLab.added=gradeLab.added.filter(item=>item!==a);gradeLab.ranges.delete(a.id);gradeLab.addedEditors.delete(a.id);row.remove();renderGradeLabResult();},'ap-lab-remove');remove.setAttribute('aria-label','Remove hypothetical assignment');
    const actions=el('span',null,{class:'ap-lab-row-actions'});actions.append(count,remove,range.toggle);
    heading.append(name,labTag(),actions);
    main.append(heading,categoryLine,el('p','Enter a score or turn on Range to include this assignment.',{class:'ap-lab-new-help'}));
    const scoreField=(label,pair)=>{
      const group=el('div',null,{class:'ap-lab-new-score-field',role:'group','aria-label':label});
      group.append(el('span',label,{class:'ap-lab-new-score-label'}),pair);return group;
    };
    scores.append(scoreField('Score',scoreControls.score));
    if(!average)scores.append(scoreField('Complete',scoreControls.raw));
    const percent=el('span','—',{class:'ap-lab-new-percent','aria-label':'Hypothetical assignment grade'});
    const toggleHost=el('span',null,{class:'ap-lab-assignment-toggle'});
    toggleHost.append(button('Exit grade testing',()=>setGradeLabActive(false)));
    toggleHost.firstElementChild.setAttribute('aria-pressed','true');
    scores.append(percent,range.panel,toggleHost);card.append(main,scores);cell.append(card);row.append(cell);gradeLab.newBody.append(row);
    gradeLab.addedEditors.set(a.id,{...scoreControls,name,included,percent});
    const update=()=>{if(a.name!==name.value.trim()||a.category!==category.value)bindPlanningRename(a.id);Object.assign(a,{name:name.value.trim(),category:category.value});scoreControls.sync(a);renderGradeLabResult();};
    name.addEventListener('input',update);category.addEventListener('change',update);
    renderGradeLabResult();row.scrollIntoView({block:'nearest'});name.focus();name.select();
  }
  function labModel(){
    const assignments=[],errors=[];
    const convert=(a,draft)=>{
      const range=gradeLab.ranges.get(a.id);
      if(range && draft.included){
        const state=labRangeState(range,draft),earned=state.low.earned,possible=state.possible;
        if(state.error)errors.push(`“${a.name||'New assignment'}”: ${state.error}`);
        if(a.id.startsWith('hypothetical:')&&(!a.name.trim()||!a.category))errors.push('Give each ranged hypothetical assignment a name and category.');
        return {id:a.id,name:a.name,category:a.category,earned,possible,included:true};
      }
      const state=labScoreState(draft),{earned,possible}=state;
      if(a.id.startsWith('hypothetical:')&&earned!==null&&(!a.name.trim()||!a.category))errors.push('Give each scored hypothetical assignment a name and category.');
      if(state.error)errors.push(`“${a.name||'New assignment'}”: ${state.error}`);
      // Blank scores do not create an active category or an invalid denominator.
      return {id:a.id,name:a.name,category:a.category,earned,possible,included:draft.included&&earned!==null};
    };
    for(const a of gradeLab.parsed.assignments){
      const draft=gradeLab.edits.get(a.id)||(gradeLab.ranges.has(a.id)?labDraft(a):null);
      assignments.push(draft?convert(a,draft):{id:a.id,name:a.name,category:a.category,earned:a.earned,possible:a.possible,included:a.included});
    }
    for(const a of gradeLab.added)assignments.push(convert(a,a));
    return {assignments,error:errors[0]||''};
  }
  function labGrade(value){
    if(value===null || !Number.isFinite(value))return '—';
    const average=planningRules().averageMaximum;
    return fmt(average?value*average/100:value)+(average?' / '+fmt(average):'%');
  }
  function labValue(cell,text,color,posted,compact=false){
    if(!cell)return;
    let ui=gradeLab.overlays.get(cell)?.ui;
    if(!ui){ui=el('span',null,{class:compact?'ap-lab-inline-value':'ap-lab-value'});labOverlay(cell,ui);}
    const signature=JSON.stringify([text,color,posted]);
    if(ui.dataset.signature===signature)return;
    ui.dataset.signature=signature;
    const value=el('span');
    if(text.startsWith('Lower: ')&&text.includes(' · Upper: ')){
      value.className='ap-lab-bound-values';const [low,high]=text.split(' · Upper: ');value.append(el('span',low),el('span','Upper: '+high));
    }else value.textContent=text;
    if(color)value.style.color=color;
    ui.replaceChildren(...(compact?[value]:[labTag(),value]));
    if(posted)ui.append(el('small','Posted: '+posted));
  }
  function renderGradeLabResult(){
    if(!gradeLab)return;
    if(!gradeLab.active){refreshAssignmentLabButtons();return;}
    applyDetailsColors();
    for(const a of gradeLab.parsed.assignments)syncLabEditors(a.id);
    for(const a of gradeLab.added)gradeLab.addedEditors.get(a.id)?.sync(a);
    const model=labModel(),rules=planningRules(model.assignments),scenario=labRangeScenario(model,rules);
    const calculated=scenario.active&&scenario.result?scenario.result.lowResult:GradeMath.calculate(model.assignments,rules);
    const error=model.error||planningBaselineError()||scenario.error||calculated.error;
    gradeLab.rangeActive=scenario.active;gradeLab.rangeError=scenario.active?error||'':'';
    gradeLab.rangeResult=error?null:scenario.result;
    gradeLab.result=error?null:calculated;
    const result=gradeLab.result,range=gradeLab.rangeResult,ranged=gradeLab.rangeActive,upper=range?.highResult;
    // The interval has no single grade band. Remove colors inherited from the
    // posted grade before drawing neutral hypothetical endpoint values.
    if(ranged)restoreDetailsColors();
    const neutral='#42566f',bounds=(low,high)=>`Lower: ${low} · Upper: ${high}`;
    const assignmentPercent=a=>a?.included&&a.earned!==null&&a.possible>0?a.earned/a.possible*100:null;
    const lowAssignments=new Map((result?.effectiveAssignments||model.assignments).map(a=>[a.id,a]));
    const highAssignments=new Map((upper?.effectiveAssignments||[]).map(a=>[a.id,a]));
    const count=gradeLab.edits.size+gradeLab.added.length;
    const posted=gradeLab.parsed.rules.official;
    const postedText=posted===null?'—':fmt(posted)+(gradeLab.parsed.rules.officialUnit==='average'?' / '+fmt(gradeLab.parsed.rules.averageMaximum||4):'%');
    gradeLab.toolbar.querySelector('#ap-lab-result').textContent=error?'Hypothetical total unavailable: '+error:ranged?
      `Hypothetical overall grade — lower bound: ${planningFormat(result.value,rules,true)} · upper bound: ${planningFormat(upper.value,rules,true)} · Posted: ${postedText} · ${range.rangeCount} assignment range${range.rangeCount===1?'':'s'}`:
      `Hypothetical overall grade: ${planningFormat(result.value,rules,true)} · Posted: ${postedText} · ${count} hypothetical score change${count===1?'':'s'} · ${result.appliedReplacements.length} replacement${result.appliedReplacements.length===1?'':'s'}`;
    for(const badge of gradeLab.badges)badge.remove();gradeLab.badges=[];
    for(const a of gradeLab.parsed.assignments){
      const modeled=lowAssignments.get(a.id),high=highAssignments.get(a.id),edited=gradeLab.edits.has(a.id)||gradeLab.ranges?.has(a.id);
      const percent=ranged&&error?null:assignmentPercent(modeled),highPercent=assignmentPercent(high);
      const unit=rules.averageMaximum?'average':'percent';
      const color=ranged?neutral:percent===null?null:detailsColor(unit==='average'?percent*rules.averageMaximum/100:percent,unit);
      for(const c of gradeLab.editors.get(a.id)||[]){c.undo.disabled=!edited;c.earned.style.color=c.rawEarned.style.color=color||'';}
      const percentCells=assignmentPercentCells(a),percentText=ranged&&!error?bounds(labGrade(percent),labGrade(highPercent)):labGrade(percent);
      for(const cell of percentCells)labValue(cell,percentText,color,undefined,true);
      if(edited)for(const cell of a.sourceNameCells||[]){const badge=labTag();badge.setAttribute('data-ap-owned','lab-badge');cell.append(badge);gradeLab.badges.push(badge);if(color)detailPaint(cell,color);}
      if(!error&&(modeled?.replacementSourceId||high?.replacementSourceId))for(const cell of a.sourceNameCells||[]){
        let text;
        if(ranged){
          const describe=(label,item)=>{const source=model.assignments.find(row=>row.id===item?.replacementSourceId);return `${label}: ${source?'replacement from '+source.name:'entered score'}, ${fmt(item.earned)} / ${fmt(item.possible)}`;};
          text=describe('Lower',modeled)+' · '+describe('Upper',high);
        }else{const source=model.assignments.find(item=>item.id===modeled.replacementSourceId);text=`Hypothetical replacement from ${source?.name}: ${fmt(modeled.earned)} / ${fmt(modeled.possible)}`;}
        const badge=el('span',text,{class:'ap-lab-tag','data-ap-owned':'lab-badge'});cell.append(badge);gradeLab.badges.push(badge);
      }
    }
    for(const a of gradeLab.added){
      const controls=gradeLab.addedEditors.get(a.id);if(!controls)continue;
      const modeled=lowAssignments.get(a.id),high=highAssignments.get(a.id);
      const percent=ranged&&error?null:assignmentPercent(modeled),highPercent=assignmentPercent(high);
      const color=ranged?neutral:db.settings.detailsColors&&percent!==null?detailsColor(rules.averageMaximum?percent*rules.averageMaximum/100:percent,rules.averageMaximum?'average':'percent'):'';
      controls.included.checked=a.included;controls.percent.textContent=ranged&&!error?bounds(labGrade(percent),labGrade(highPercent)):labGrade(percent);
      for(const node of [controls.name,controls.earned,controls.rawEarned,controls.percent])node.style.color=color;
    }
    const categories=new Map((result?.categories||[]).map(c=>[c.name,c]));
    const highCategories=new Map((upper?.categories||[]).map(c=>[c.name,c]));
    for(const row of document.querySelectorAll('tr[id*="DataSummary"][id$="_trSummary"]')){
      const name=GradeDOM.cleanText(row.querySelector('[id$="_tdDESC"]')),total=/^total$/i.test(name),c=categories.get(name),high=highCategories.get(name);
      const value=total?result?.value??null:c?.percent??null,highValue=total?upper?.value??null:high?.percent??null;
      const pct=row.querySelector('[id$="_tdPCT"]');
      const old=GradeDOM.cleanText(pct);
      const unit=rules.averageMaximum?'average':'percent';
      const color=ranged?neutral:value===null?null:detailsColor(unit==='average'?value*rules.averageMaximum/100:value,unit);
      const format=value=>total?planningFormat(value,rules,true):labGrade(value);
      labValue(pct,ranged&&!error?bounds(format(value),format(highValue)):format(value),color,old);
      labValue(row.querySelector('[id$="_tdMK"]'),'—',null);
      // Four-point books can use average totals rather than summed points.
      if(!gradeLab.parsed.rules.averageMaximum){
        const points=result?fmt(total?result.totalEarned:c?.earned??0):'—';
        const highPoints=upper?fmt(total?upper.totalEarned:high?.earned??0):'—';
        labValue(row.querySelector('[id$="_tdPTS"]'),ranged&&!error?bounds(points,highPoints):points,ranged?neutral:null);
        labValue(row.querySelector('[id$="_tdMX"]'),result?fmt(total?result.totalPossible:c?.possible??0):'—',ranged?neutral:null);
      }
    }
    refreshGradeLabImpacts(model,rules,error);
    refreshPlanningUI();
    refreshAssignmentLabButtons();
  }

  function syncAeriesFont() {
    const page = document.querySelector('#AeriesFullPageBody') || document.body;
    const family = getComputedStyle(page).fontFamily;
    if (family && host.style.getPropertyValue('--ap-aeries-font') !== family) {
      host.style.setProperty('--ap-aeries-font', family);
    }
  }
  const detailsPainted=new Map();
  function detailPaint(node,color){
    if(!node || node.closest('[data-ap-owned]'))return;
    if(!detailsPainted.has(node))detailsPainted.set(node,{value:node.style.getPropertyValue('color'),priority:node.style.getPropertyPriority('color')});
    node.style.setProperty('color',color,'important');
    detailsPainted.get(node).applied=node.style.getPropertyValue('color');
  }
  function restoreDetailsColors(){
    for(const [node,old]of detailsPainted){
      if(node.style.getPropertyValue('color')!==old.applied || node.style.getPropertyPriority('color')!=='important')continue;
      if(old.value)node.style.setProperty('color',old.value,old.priority);else node.style.removeProperty('color');
    }
    detailsPainted.clear();
  }
  function detailsColor(value,unit){
    const c=profile().courses[detectedCourseKey];
    const limits=c && c.scale===unit?cutoffs(c):(unit==='average'?db.settings.averageCutoffs:db.settings.cutoffs);
    const band=limits.findIndex(n=>value>=n);return db.settings.colors[band<0?3:band];
  }
  function applyDetailsColors(){
    restoreDetailsColors();
    if(!db.settings.enabled || !db.settings.detailsColors || nativePageState?.waiting)return;
    for(const info of GradeDOM.listTables().filter(t=>t.nativeAeries)){
      for(const a of GradeDOM.readTable(info).assignments){
        if(!a.included || a.earned===null || !(a.possible>0))continue;
        const percentCell=a.sourceRow.querySelector('[id$="_tdPerc"]');
        const {value,unit}=GradeDOM.assignmentGrade(a);
        const color=detailsColor(value,unit);
        detailPaint(a.sourceRow.children[1],color);detailPaint(percentCell,color);
        for(const cell of a.sourceCells||[a.sourceCell]){
          detailPaint(cell,color);
          for(const n of cell.querySelectorAll('td,span'))detailPaint(n,color);
        }
        const cardRow=a.sourceRows?.find(r=>r.matches('tr.CardView'));
        if(cardRow){detailPaint(cardRow.querySelector('.TextHeading'),color);detailPaint(cardRow.querySelector('[id$="_spTransfer"]'),color);}
      }
    }
    for(const row of document.querySelectorAll('tr[id*="DataSummary"][id$="_trSummary"]')){
      const pct=row.querySelector('[id$="_tdPCT"]'),parsed=GradeDOM.parseCourseGrade(GradeDOM.cleanText(pct),GradeDOM.isFourPointCourse(GradeDOM.currentCourse()?.title||''));
      if(parsed.value===null)continue;
      const max=GradeMath.parseNumber(GradeDOM.cleanText(row.querySelector('[id$="_tdMX"]')));
      const title=row.querySelector('[id$="_tdDESC"]'),isTotal=/^total$/i.test(GradeDOM.cleanText(title));
      if(!isTotal && !(max>0) && parsed.unit!=='average')continue;
      const color=detailsColor(parsed.value,parsed.unit);
      for(const n of [title,pct,row.querySelector('[id$="_tdMK"]')])detailPaint(n,color);
      if(isTotal)detailPaint(document.querySelector('select[id$="_dlGN"]'),color);
    }
  }
// Public MVHS bell schedules. Extracts JSON from the same Firebase paths used by
// mvhs.io's bell-schedule bundle; never evaluates remote scripts.
const MVHSSchedule = (() => {
  const timezone = 'America/Los_Angeles';
  const clockFormat = new Intl.DateTimeFormat('en-CA', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  function dateValue(key) {
    if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error('Invalid schedule date.');
    const date = new Date(key + 'T12:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== key) throw new Error('Invalid schedule date.');
    return date;
  }
  function schoolClock(now = new Date()) {
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('Invalid clock.');
    const p = Object.fromEntries(clockFormat.formatToParts(now).map(part => [part.type,part.value]));
    const dateKey = `${p.year}-${p.month}-${p.day}`;
    return {dateKey,weekday:dateValue(dateKey).getUTCDay(),minutes:Number(p.hour)*60+Number(p.minute)+Number(p.second)/60};
  }
  function publicName(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > 100 || /[\x00-\x1f]/.test(value)) throw new Error('Unrecognized schedule name.');
    return value.trim();
  }
  function objectData(value) { return value && typeof value === 'object' && !Array.isArray(value); }
  function parseCalendar(days, weekdayMap) {
    if (!objectData(days) || !weekdayMap || typeof weekdayMap !== 'object') throw new Error('MVHS calendar data is unavailable.');
    const weekdays = Array.from({length:7},(_,day) => publicName(weekdayMap[day]));
    const overrides = Object.entries(days).map(([range,value]) => {
      const m = /^(\d{2})(\d{2})(\d{4})-(\d{2})(\d{2})(\d{4})$/.exec(range);
      if (!m) throw new Error('Unrecognized calendar date range.');
      const start = `${m[3]}-${m[1]}-${m[2]}`, end = `${m[6]}-${m[4]}-${m[5]}`;
      dateValue(start);dateValue(end);
      if (end < start) throw new Error('Invalid calendar date range.');
      return {start,end,name:publicName(value)};
    });
    return {overrides,weekdays};
  }
  function chooseSchedule(calendar,dateKey) {
    const date = dateValue(dateKey), matches = calendar.overrides.filter(item => item.start <= dateKey && dateKey <= item.end);
    const names = [...new Set(matches.map(item => item.name))];
    if (names.length > 1) throw new Error('MVHS has conflicting schedules for this date. Check mvhs.io.');
    const name = names[0] || calendar.weekdays[date.getUTCDay()];
    return {name,special:matches.length > 0,noSchool:name === 'none'};
  }
  function periodNumber(value) {
    const match = /^(?:(?:period|per\.?|p)\s*:?\s*)?(\d{1,2}[A-Z]?)$/i.exec(String(value ?? '').trim());
    if (!match || Number.parseInt(match[1],10) > 20) return null;
    return match[1].toUpperCase().replace(/^0(?=\d)/,'');
  }
  function parsePeriods(raw) {
    if (!objectData(raw) || !Object.keys(raw).length || Object.keys(raw).length > 60) throw new Error('MVHS bell times are unavailable.');
    const periods = Object.entries(raw).map(([range,value]) => {
      const m = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(range);
      if (!m || Number(m[1]) > 23 || Number(m[3]) > 23 || Number(m[2]) > 59 || Number(m[4]) > 59) throw new Error('Unrecognized MVHS bell times.');
      const start = Number(m[1])*60+Number(m[2]), end = Number(m[3])*60+Number(m[4]);
      if (end <= start || (typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'number' && (!Number.isInteger(value) || value < 0 || value > 20))) throw new Error('Invalid MVHS bell period.');
      const label = publicName(String(value)), period = periodNumber(label);
      return {start,end,label,period};
    }).sort((a,b) => a.start-b.start);
    if (periods.some((slot,i) => i && slot.start < periods[i-1].end)) throw new Error('MVHS bell periods overlap. Check mvhs.io.');
    return periods;
  }
  const isStudentSlot = slot => slot.period !== null || /tutorial|testing|\btest\b|psat|sat\b|assembly|rally|advisory/i.test(slot.label);
  function stateFor(periods,minutes) {
    const current = periods.find(slot => slot.start <= minutes && minutes < slot.end) || null;
    const next = periods.find(slot => slot.start > minutes) || null;
    const nextClass = periods.find(slot => slot.start > minutes && isStudentSlot(slot)) || null;
    return {phase:!periods.length?'none':current?'current':next?(minutes < periods[0].start?'before':'gap'):'ended',current,next,nextClass,
      remainingMinutes:current?Math.ceil(current.end-minutes):null,untilNextMinutes:nextClass?Math.ceil(nextClass.start-minutes):null};
  }
  function snapshot(days,weekdayMap,schedules) {
    const calendar = parseCalendar(days,weekdayMap);
    if (!objectData(schedules)) throw new Error('MVHS schedules are unavailable.');
    const parsed = Object.create(null);
    for (const name of new Set([...calendar.weekdays,...calendar.overrides.map(item => item.name)])) {
      if (name !== 'none') parsed[name] = parsePeriods(schedules[name]);
    }
    return {calendar,schedules:parsed};
  }
  function dayFor(data,dateKey) {
    const selected = chooseSchedule(data.calendar,dateKey);
    const periods = selected.noSchool?[]:data.schedules[selected.name];
    if (!Array.isArray(periods)) throw new Error('MVHS has not supplied this schedule.');
    return {...selected,dateKey,periods};
  }
  function nextSchoolDay(data,dateKey) {
    const date = dateValue(dateKey);
    for (let offset=1;offset<=14;offset++) {
      date.setUTCDate(date.getUTCDate()+1);
      const day = dayFor(data,date.toISOString().slice(0,10)), first = day.periods.find(isStudentSlot);
      if (first) return {...day,first};
    }
    return null;
  }
  function formatTime(minutes) {
    const hour = Math.floor(minutes/60), minute = Math.floor(minutes%60);
    return `${hour%12 || 12}:${String(minute).padStart(2,'0')} ${hour<12?'AM':'PM'}`;
  }
  return {timezone,schoolClock,parseCalendar,chooseSchedule,parsePeriods,periodNumber,stateFor,snapshot,dayFor,nextSchoolDay,formatTime};
})();

// END MVHSSchedule

// Bell.plus is only a cross-check. MVHSSchedule remains the schedule authority.
// Public source: github.com/nicolaschan/bell (CalendarParser, ScheduleParser,
// Calendar, Period and CorrectedDate); API: https://bell.plus/api/data/mvhs.
const BellPlusSchedule = (() => {
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
  function fail() { throw new Error('Bell.plus schedule could not be verified.'); }
  function lines(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > 500000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) fail();
    return value.replace(/\r/g,'').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  }
  function dateValue(key) {
    if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) fail();
    const date = new Date(key+'T12:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== key) fail();
    return date;
  }
  function calendarDate(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) fail();
    const key = `${match[3]}-${match[1]}-${match[2]}`;
    dateValue(key);
    return key;
  }
  function parseCalendar(raw) {
    const week = Object.create(null), overrides = [];
    let section = null;
    for (const line of lines(raw)) {
      if (line.startsWith('*')) {
        section = line.slice(1).trim();
        if (!['Default Week','Special Days'].includes(section)) fail();
        continue;
      }
      const match = /^(\S+)\s+([a-z0-9_-]+)(?:\s*#.*)?$/i.exec(line);
      if (!match) fail();
      const [,key,name] = match;
      if (section === 'Default Week') {
        if (!weekdays.includes(key) || own(week,key)) fail();
        week[key] = name;
      } else if (section === 'Special Days') {
        const range = key.split('-');
        if (range.length > 2) fail();
        const start = calendarDate(range[0]), end = calendarDate(range[1] || range[0]);
        if (end < start) fail();
        overrides.push({start,end,name});
      } else fail();
    }
    if (weekdays.some(day => !own(week,day))) fail();
    return {week,overrides};
  }
  function labelInfo(value) {
    // The braces in Bell.plus are customizable period-name placeholders. Read
    // their original period identities rather than any personal display names.
    const raw = value.trim();
    if (!raw || raw.length > 150) fail();
    const match = /^\{Period\s+(\d{1,2})\}(?:\/(?:Assembly\s+)?([A-Z]))?$/i.exec(raw);
    const period = match ? MVHSSchedule.periodNumber(match[1]+(match[2] || '')) : MVHSSchedule.periodNumber(raw);
    return {label:match ? `Period ${period}` : raw,period};
  }
  function parseSchedules(raw) {
    const schedules = Object.create(null);
    let name = null;
    for (const line of lines(raw)) {
      if (line.startsWith('*')) {
        const header = /^\*\s+([a-z0-9_-]+)(?:\s*#.*)?$/i.exec(line);
        if (!header || own(schedules,header[1])) fail();
        name = header[1];
        schedules[name] = [];
        continue;
      }
      const match = /^(\d{1,2}):(\d{2})\s+(.+)$/.exec(line);
      if (!name || !match || Number(match[1]) > 23 || Number(match[2]) > 59) fail();
      const start = Number(match[1])*60+Number(match[2]), entries = schedules[name];
      if (entries.length >= 100 || (entries.length && start <= entries[entries.length-1].start)) fail();
      entries.push({start,...labelInfo(match[3])});
    }
    if (!Object.keys(schedules).length) fail();
    return schedules;
  }
  function snapshot(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !raw.meta || raw.meta.name !== 'Mountain View High School') fail();
    const correction = typeof raw.correction === 'number' ? String(raw.correction) : raw.correction;
    if (typeof correction !== 'string' || !/^[+-]?\d+$/.test(correction.trim())) fail();
    const correctionMs = Number(correction.trim());
    if (!Number.isSafeInteger(correctionMs) || Math.abs(correctionMs) > 60000) fail();
    return {calendar:parseCalendar(raw.calendar),schedules:parseSchedules(raw.schedules),correctionMs};
  }
  function dayFor(data,dateKey) {
    const date = dateValue(dateKey);
    const matches = data.calendar.overrides.filter(item => item.start <= dateKey && dateKey <= item.end);
    const names = [...new Set(matches.map(item => item.name))];
    // Ambiguous calendar edits must never enable seconds.
    if (names.length > 1) fail();
    const name = names[0] || data.calendar.week[weekdays[date.getUTCDay()]];
    if (!own(data.schedules,name)) fail();
    const entries = data.schedules[name], periods = [];
    for (let i=0;i<entries.length;i++) {
      const entry = entries[i];
      // Bell.plus expresses gaps and dismissal as events; mvhs.io omits them.
      if (/^Passing to\b/i.test(entry.label) || /^Free$/i.test(entry.label)) continue;
      const next = entries[i+1];
      if (!next || next.start <= entry.start) fail();
      periods.push({...entry,end:next.start});
    }
    return {name,dateKey,special:matches.length>0,noSchool:periods.length===0,periods};
  }
  function identity(slot) {
    if (!slot || typeof slot.label !== 'string') return null;
    const period = slot.period == null ? MVHSSchedule.periodNumber(slot.label) : MVHSSchedule.periodNumber(slot.period);
    if (period !== null) return `period:${period}`;
    const label = slot.label.trim().toLowerCase().replace(/\s+/g,' ');
    // Same MVHS tutorial block; Bell.plus retains its older public name.
    return label === 'academic collaboration time' ? 'tutorial' : label;
  }
  function agrees(day,mvhsDay) {
    if (!day || !mvhsDay || day.dateKey !== mvhsDay.dateKey || !Array.isArray(day.periods) || !Array.isArray(mvhsDay.periods) ||
        !day.periods.length || day.periods.length !== mvhsDay.periods.length) return false;
    return day.periods.every((slot,i) => {
      const primary = mvhsDay.periods[i], key = identity(slot);
      return primary && Number.isFinite(slot.start) && Number.isFinite(slot.end) && slot.end > slot.start &&
        slot.start === primary.start && slot.end === primary.end && key !== null && key === identity(primary);
    });
  }
  return {snapshot,dayFor,agrees};
})();
// END BellPlusSchedule

// UI adapter: only current rendered course cards are used to match a public period to a
// class name. The short-lived public schedule cache stays in memory.
let scheduleHost = null, scheduleRoot = null, scheduleTimer = null, scheduleSignature = '';
let scheduleData = null, scheduleFetchedAt = 0, schedulePending = false, scheduleError = '', scheduleRetryAt = 0;
let bellPlusData = null, bellPlusClock = null, bellPlusFetchedAt = 0, bellPlusFetchedDate = '', bellPlusPending = false, bellPlusError = '', bellPlusRetryAt = 0;
let scheduleFetchedDate = '';
const scheduleTTL = 5*60*1000;
let scheduleRequestGeneration = 0;
const activeScheduleRequests = new Set();
const scheduleEndpoints = Object.freeze({
  days: 'https://mvhs-app-d04d2.firebaseio.com/days.json',
  'weekday-map': 'https://mvhs-app-d04d2.firebaseio.com/weekday-map.json',
  schedules: 'https://mvhs-app-d04d2.firebaseio.com/schedules.json',
  bellSchedule: 'https://bell.plus/api/data/mvhs',
  bellClock: 'https://bell.plus/timesync'
});
function scheduleRequestsAllowed() {
  return Boolean(db.settings.enabled && db.settings.nextClass && db.settings.scheduleNetworkConsent === true);
}
function abortScheduleRequests() {
  // Invalidating the generation also covers responses already queued as promise callbacks.
  scheduleRequestGeneration++;
  clearTimeout(scheduleTimer);scheduleTimer=null;
  for (const request of [...activeScheduleRequests]) request.abort();
  schedulePending=false;bellPlusPending=false;
  scheduleData=null;scheduleFetchedAt=0;scheduleFetchedDate='';scheduleError='';scheduleRetryAt=0;
  bellPlusData=null;bellPlusClock=null;bellPlusFetchedAt=0;bellPlusFetchedDate='';bellPlusError='';bellPlusRetryAt=0;
  scheduleSignature='';
}
function requestScheduleJSON(kind, clockId) {
  if (!scheduleRequestsAllowed()) return Promise.reject(new Error('Public schedule access is off.'));
  if (typeof kind !== 'string' || !Object.hasOwn(scheduleEndpoints,kind)) return Promise.reject(new Error('Unrecognized public schedule request.'));
  const isClock=kind==='bellClock',isBell=kind==='bellSchedule' || isClock;
  if (isClock ? typeof clockId!=='string' || !/^aeries-clock-\d{1,16}$/.test(clockId) : clockId!==undefined)
    return Promise.reject(new Error('Invalid public clock request.'));
  const url=scheduleEndpoints[kind],source=isBell?'bell.plus':'MVHS';
  const generation=scheduleRequestGeneration;
  return new Promise((resolve,reject) => {
    if (typeof GM_xmlhttpRequest !== 'function') {reject(new Error('Public schedule access needs userscript network permission.'));return;}
    let handle=null,settled=false;
    const finish=(error,value)=>{
      if (settled) return;
      settled=true;activeScheduleRequests.delete(request);
      if (generation!==scheduleRequestGeneration || !scheduleRequestsAllowed()) reject(new Error('Public schedule request canceled.'));
      else if (error) reject(error);
      else resolve(value);
    };
    const request={abort(){
      if (settled) return;
      finish(new Error('Public schedule request canceled.'));
      try {handle?.abort();} catch {/* The response remains invalidated even if cancellation fails. */}
    }};
    activeScheduleRequests.add(request);
    try {
      handle=GM_xmlhttpRequest({method:isClock?'POST':'GET',url,anonymous:true,
        headers:{Accept:'application/json',Referer:isBell?'https://bell.plus/mvhs':'https://mvhs.io/',...(isClock?{'Content-Type':'application/json'}:{})},
        ...(isClock?{data:JSON.stringify({jsonrpc:'2.0',id:clockId,method:'timesync'})}:{}),timeout:isBell?10000:15000,
        onload:response=>{
          if (settled) return;
          if (generation!==scheduleRequestGeneration || !scheduleRequestsAllowed()) {finish(new Error('Public schedule request canceled.'));return;}
          try {
            if (response.status!==200 || typeof response.responseText!=='string' || response.responseText.length>200000
              || typeof response.finalUrl!=='string' || response.finalUrl!==url) throw new Error();
            finish(null,JSON.parse(response.responseText));
          } catch {finish(new Error(source+' returned unreadable or unexpected schedule data.'));}
        },onerror:()=>finish(new Error('Could not reach '+source+'.')),
        ontimeout:()=>finish(new Error(source+' schedule request timed out.')),
        onabort:()=>finish(new Error(source+' schedule request interrupted.'))});
    } catch {finish(new Error('Could not start the '+source+' schedule request.'));}
  });
}
function requestBellPlus(kind, clockId) {
  if (!scheduleRequestsAllowed()) return Promise.reject(new Error('Public schedule access is off.'));
  if (kind!=='schedule' && kind!=='clock') return Promise.reject(new Error('Unrecognized bell.plus request.'));
  return requestScheduleJSON(kind==='clock'?'bellClock':'bellSchedule',clockId);
}
async function requestBellPlusClock() {
  // Use the same JSON-RPC time endpoint and correction as bell.plus. The midpoint
  // estimate is accepted only for a short round trip and a consistent local clock.
  const wallStart=Date.now(),monoStart=performance.now(),id='aeries-clock-'+wallStart;
  const response=await requestBellPlus('clock',id);
  const wallAt=Date.now(),monoAt=performance.now(),elapsed=monoAt-monoStart;
  if (!response || response.id!==id || response.error || !Number.isSafeInteger(response.result) || elapsed<0 || elapsed>2000 || Math.abs(wallAt-wallStart-elapsed)>250)
    throw new Error('bell.plus clock could not be verified.');
  const offsetMs=response.result-(wallStart+elapsed/2);
  if (Math.abs(offsetMs)>60000) throw new Error('The clocks disagree; using mvhs.io minutes.');
  return {offsetMs,wallAt,monoAt};
}
function loadBellPlusSchedule() {
  if (!scheduleRequestsAllowed() || bellPlusPending) return;
  const generation=scheduleRequestGeneration,requestedDate=MVHSSchedule.schoolClock().dateKey;
  bellPlusPending=true;bellPlusError='';
  Promise.all([requestBellPlus('schedule'),requestBellPlusClock()]).then(([raw,clock])=>{
    if (generation!==scheduleRequestGeneration || !scheduleRequestsAllowed()) return;
    const data=BellPlusSchedule.snapshot(raw);
    bellPlusData=data;bellPlusClock=clock;bellPlusFetchedAt=Date.now();bellPlusFetchedDate=requestedDate;bellPlusRetryAt=0;
  }).catch(error=>{
    if (generation!==scheduleRequestGeneration || !scheduleRequestsAllowed()) return;
    bellPlusData=null;bellPlusClock=null;bellPlusError=error.message || 'bell.plus is unavailable.';bellPlusRetryAt=Date.now()+60000;
  }).finally(()=>{
    if (generation!==scheduleRequestGeneration) return;
    bellPlusPending=false;scheduleSignature='';refreshSchedule();
  });
}
function bellPlusIsFresh(now,dateKey) {
  return Boolean(bellPlusData && bellPlusClock && bellPlusFetchedDate===dateKey && now>=bellPlusFetchedAt && now-bellPlusFetchedAt<scheduleTTL
    && now>=bellPlusClock.wallAt && now-bellPlusClock.wallAt<scheduleTTL
    && Math.abs((now-bellPlusClock.wallAt)-(performance.now()-bellPlusClock.monoAt))<1000);
}
function verifiedBellSeconds(day,state,now) {
  const unavailable={verified:false,status:bellPlusPending?'Checking bell.plus for seconds…':bellPlusError?'Seconds unavailable; using mvhs.io minutes.':'Seconds awaiting bell.plus verification.'};
  if (!bellPlusIsFresh(now,day.dateKey)) return unavailable;
  try {
    const bellDay=BellPlusSchedule.dayFor(bellPlusData,day.dateKey);
    if (day.noSchool && bellDay.noSchool) return {verified:false,status:'Schedule: mvhs.io. No school today.'};
    if (!BellPlusSchedule.agrees(bellDay,day)) return {verified:false,status:'Schedules differ; using mvhs.io minutes.'};
    if (!day.periods.length) return {verified:false,status:'Schedule: mvhs.io. No school today.'};
    const correctedNow=new Date(now+bellPlusClock.offsetMs+bellPlusData.correctionMs),clock=MVHSSchedule.schoolClock(correctedNow);
    const bellState=MVHSSchedule.stateFor(day.periods,clock.minutes);
    // Even a small clock correction must never switch the authoritative current
    // period or next class. Fall back to minutes across a disputed bell boundary.
    if (clock.dateKey!==day.dateKey || state.phase!==bellState.phase || state.current!==bellState.current || state.nextClass!==bellState.nextClass)
      return {verified:false,status:'Bell timing differs; using mvhs.io minutes.'};
    return {verified:true,minutes:clock.minutes+correctedNow.getUTCMilliseconds()/60000,status:'Schedule: mvhs.io · Seconds verified with bell.plus.'};
  } catch {return {verified:false,status:'bell.plus could not be checked; using mvhs.io minutes.'};}
}
function updateBellCountdowns(state,verification) {
  const duration=(target,minutes)=>{
    if (!verification.verified) return `${minutes} min`;
    const seconds=Math.max(0,Math.ceil(target*60-verification.minutes*60-1e-7));
    return `${Math.floor(seconds/60)} min ${String(seconds%60).padStart(2,'0')} sec`;
  };
  const current=scheduleRoot?.querySelector('[data-ap-countdown="current"]'),next=scheduleRoot?.querySelector('[data-ap-countdown="next"]');
  if (current && state.current) {const value=duration(state.current.end,state.remainingMinutes)+' remaining';if(current.textContent!==value)current.textContent=value;}
  if (next && state.nextClass) {const value='in '+duration(state.nextClass.start,state.untilNextMinutes);if(next.textContent!==value)next.textContent=value;}
}
function requestMVHSPublic(path) {
  if (!scheduleRequestsAllowed()) return Promise.reject(new Error('Public schedule access is off.'));
  if (!['days','weekday-map','schedules'].includes(path)) return Promise.reject(new Error('Unrecognized MVHS schedule request.'));
  return requestScheduleJSON(path);
}
function loadMVHSSchedule() {
  if (!scheduleRequestsAllowed() || schedulePending) return;
  const generation=scheduleRequestGeneration,requestedDate=MVHSSchedule.schoolClock().dateKey;
  schedulePending=true;scheduleError='';
  Promise.all(['days','weekday-map','schedules'].map(requestMVHSPublic)).then(([days,map,schedules]) => {
    if (generation!==scheduleRequestGeneration || !scheduleRequestsAllowed()) return;
    scheduleData=MVHSSchedule.snapshot(days,map,schedules);scheduleFetchedAt=Date.now();scheduleFetchedDate=requestedDate;scheduleRetryAt=0;
  }).catch(error => {
    if (generation!==scheduleRequestGeneration || !scheduleRequestsAllowed()) return;
    scheduleError=error.message || 'The MVHS schedule is unavailable.';scheduleRetryAt=Date.now()+60*1000;
  }).finally(() => {
    if (generation!==scheduleRequestGeneration) return;
    schedulePending=false;scheduleSignature='';refreshSchedule();
  });
}
function removeSchedule() {
  clearTimeout(scheduleTimer);scheduleTimer=null;
  scheduleHost?.remove();scheduleHost=null;scheduleRoot=null;scheduleSignature='';
  removeEmptySummaries();
}
function refreshSchedule() {
  clearTimeout(scheduleTimer);scheduleTimer=null;
  const visibleCards=cards.filter(card => card.element.isConnected && card.element.getClientRects().length);
  const section=visibleCards[0]?.element.closest('.classesSection');
  if (!scheduleRequestsAllowed()) {abortScheduleRequests();removeSchedule();return;}
  if (!section) {removeSchedule();return;}
  if (document.hidden) return;
  const now=Date.now(),dateKey=MVHSSchedule.schoolClock(new Date(now)).dateKey;
  // Recompute from wall time on every tick; background throttling cannot accumulate
  // drift. Data requests are cached separately and never run once per second.
  const tickOffset=bellPlusClock && bellPlusData?bellPlusClock.offsetMs+bellPlusData.correctionMs:0;
  scheduleTimer=setTimeout(refreshSchedule,1000-((now+tickOffset)%1000)+10);
  const fresh=scheduleData && scheduleFetchedDate===dateKey && now-scheduleFetchedAt<scheduleTTL && now>=scheduleFetchedAt;
  if (!fresh && !schedulePending && now>=scheduleRetryAt) loadMVHSSchedule();
  if (!bellPlusIsFresh(now,dateKey) && !bellPlusPending && now>=bellPlusRetryAt) loadBellPlusSchedule();
  if (!scheduleHost) {
    scheduleHost=el('div',null,{id:'ap-next-class',role:'region','data-ap-owned':'next-class','aria-label':'What class is next'});
    scheduleHost.style.cssText='display:block;min-width:0;max-width:100%;margin:0;';
    scheduleRoot=scheduleHost.attachShadow({mode:'open'});scheduleSignature='';
  }
  mountSummary(scheduleHost, section);
  let clock=null,day=null,state=null,upcoming=null,problem='';
  if (fresh) {
    try {
      clock=MVHSSchedule.schoolClock(new Date(now));day=MVHSSchedule.dayFor(scheduleData,clock.dateKey);
      state=MVHSSchedule.stateFor(day.periods,clock.minutes);
      if (!state.nextClass) upcoming=MVHSSchedule.nextSchoolDay(scheduleData,clock.dateKey);
    } catch(error) {problem=error.message;}
  }
  const verification=day && state && !problem?verifiedBellSeconds(day,state,now):{verified:false,status:''};
  const roster=visibleCards.map(card=>{const c=courseFor(card);return {key:card.key,title:card.title,nickname:c.nickname,period:c.schedulePeriod || card.schedulePeriod};});
  const signature=JSON.stringify([profileKey(),clock?.dateKey,day,state && [state.phase,state.current,state.next,state.nextClass],upcoming,problem,Boolean(fresh),schedulePending,scheduleError,verification.verified,verification.status,db.settings.nicknames,
    roster]);
  if (signature===scheduleSignature) {if(state)updateBellCountdowns(state,verification);return;}scheduleSignature=signature;
  const wasOpen=Boolean(scheduleRoot.querySelector('details')?.open);
  scheduleRoot.replaceChildren();
  const style=el('style');style.textContent=`:host{font:inherit;color:#243449;overflow-wrap:anywhere}*{box-sizing:border-box}.box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:12px 14px}details{max-height:min(220px,35vh);overflow:auto;overscroll-behavior:contain}.top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px}.title{font-size:15px;font-weight:700}.meta{font-size:11px;color:#64748b}.current{font-size:19px;font-weight:700;margin:10px 0 4px}.next{font-size:13px;line-height:1.5}.status{font-size:12px;color:#64748b;line-height:1.5;margin-top:6px}a{color:#2454a0}button{font:inherit;font-size:12px;padding:5px 9px;cursor:pointer;background:white;border:1px solid #94a3b8;border-radius:6px;color:#243449}button:disabled{opacity:.6;cursor:default}summary{font-size:12px;cursor:pointer;margin-top:10px}table{font-size:12px;width:100%;border-collapse:collapse;margin-top:8px}td{padding:5px 6px;border-top:1px solid #e2e8f0}td:first-child{white-space:nowrap;width:1%}tr.active{background:#dbeafe} @media print{:host{display:none}}`;
  const box=el('div',null,{class:'box'}),top=el('div',null,{class:'top'}),source=el('a','mvhs.io',{href:'https://mvhs.io/',target:'_blank',rel:'noopener noreferrer',referrerpolicy:'no-referrer'});
  top.append(el('span','What class is next?',{class:'title'}),source);box.append(top);scheduleRoot.append(style,box);
  const retry=() => {scheduleRetryAt=0;scheduleFetchedAt=0;bellPlusRetryAt=0;bellPlusFetchedAt=0;scheduleSignature='';refreshSchedule();};
  if (!fresh || problem) {
    box.append(el('div',schedulePending?'Loading MVHS schedule…':'Schedule unavailable',{class:'current'}));
    box.append(el('div',problem || scheduleError || 'Fetching today’s public bell schedule from mvhs.io.',{class:'status'}));
    if (!schedulePending)box.append(button('Retry schedule',retry));
    return;
  }
  const titleFor=slot => CourseSchedule.title(slot,roster,db.settings.nicknames);
  box.append(el('div',`${clock.dateKey} · ${day.noSchool?'No school':day.name}${day.special?' · Special schedule':''} · Pacific time`,{class:'meta'}));
  let currentText=day.noSchool?'No school today':state.current?`Now: ${titleFor(state.current)}`:state.phase==='before'?'Before school':state.phase==='gap'?'Between periods':'School day finished';
  box.append(el('div',currentText,{class:'current'}));
  if (state.current) {
    const line=el('div',`${MVHSSchedule.formatTime(state.current.start)}–${MVHSSchedule.formatTime(state.current.end)} · `,{class:'next'});
    line.append(el('span',null,{'data-ap-countdown':'current',style:'font-variant-numeric:tabular-nums'}));box.append(line);
  }
  if (state.nextClass) {
    const line=el('div',`Next: ${titleFor(state.nextClass)} · ${MVHSSchedule.formatTime(state.nextClass.start)} · `,{class:'next'});
    line.append(el('span',null,{'data-ap-countdown':'next',style:'font-variant-numeric:tabular-nums'}));box.append(line);
  }
  else if (upcoming) {
    const dateLabel=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'short',month:'short',day:'numeric'}).format(new Date(upcoming.dateKey+'T12:00:00Z'));
    box.append(el('div',`Next school day: ${dateLabel} · ${titleFor(upcoming.first)} · ${MVHSSchedule.formatTime(upcoming.first.start)}`,{class:'next'}));
  } else if (!state.current)box.append(el('div','No upcoming class listed in the next two weeks.',{class:'next'}));
  else box.append(el('div','No later class listed today.',{class:'next'}));
  if (day.periods.length) {
    const details=el('details'),summary=el('summary','Today’s full bell schedule'),table=el('table',null,{'aria-label':'Today’s MVHS bell schedule'}),tbody=el('tbody');details.open=wasOpen;
    for(const slot of day.periods){const row=el('tr',null,{class:slot===state.current?'active':''});row.append(el('td',`${MVHSSchedule.formatTime(slot.start)}–${MVHSSchedule.formatTime(slot.end)}`),el('td',titleFor(slot)));tbody.append(row);}
    table.append(tbody);details.append(summary,table);box.append(details);
  }
  const nextSlot=state.nextClass || upcoming?.first;
  if (nextSlot?.period != null && !CourseSchedule.resolve(nextSlot.period,roster).course) {
    const ambiguous=CourseSchedule.resolve(nextSlot.period,roster).ambiguous;
    box.append(el('div',ambiguous?`More than one class matches Period ${nextSlot.period}. Check your class periods.`:`Set your class periods to show the name of your next class.`,{class:'status'}));
  }
  box.append(button('Match classes to periods',()=>openPanel('courses')));
  const status=el('div',verification.verified?'Schedule: mvhs.io · Seconds verified with ':verification.status,{class:'status'});
  if (verification.verified) status.append(el('a','bell.plus',{href:'https://bell.plus/mvhs',target:'_blank',rel:'noopener noreferrer',referrerpolicy:'no-referrer'}));
  box.append(status);
  updateBellCountdowns(state,verification);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSchedule();});
window.addEventListener('pageshow',refreshSchedule);
window.addEventListener('pagehide',abortScheduleRequests);

  function scan() {
    syncAeriesFont();
    const current=db.settings.enabled?GradeDOM.currentCourse():null;
    if(current){
      const p=profile();
      const key=nativeCourseKey(current);
      if(!p.courses[key]){p.courses[key]=courseDefaults(current.title);queueSave();}
      if(!selectedCourse || detectedCourseKey!==key)selectedCourse=key;
      detectedCourseKey=key;
    }else detectedCourseKey='';
    refreshNativeDetails();
    applyDetailsColors();
    renderGradeLabResult();
    cards=db.settings.enabled?GradeDOM.readCards():[];
    refreshDashboardGrades();
    refreshSchedule();
    refreshOverallGrade();
    for(const [card,w] of widgetHosts)if(!card.isConnected){w.host.remove();widgetHosts.delete(card);}
    if(!db.settings.enabled){restoreTitles();for(const w of widgetHosts.values())w.host.remove();widgetHosts.clear();clearAnnotations();return;}
    for(const card of cards){const c=courseFor(card);titleStyle(card,c);drawWidget(card,c);}
    if(status)status.textContent=nativeStatus ? nativeStatus.text : [`${cards.length} course cards detected`,db.settings.profile,db.settings.year?`${db.settings.year}–${Number(db.settings.year)+1}`:''].filter(Boolean).join(' · ');
    if(dialog.open && activeTab==='courses' && !coursesFormDirty
      && renderedCourseKeys!==JSON.stringify(Object.keys(profile().courses)))renderTab('courses');
  }
  // Filter both native Aeries views without changing rows used by the grade model.
  const categorySelections=new Map(),categoryHidden=new Map();
  let categoryToolbar=null,categorySignature='',categoryContext=null;
  const categoryStyle=el('style',null,{'data-ap-owned':'categories-style'});
  categoryStyle.textContent=`.ap-category-toolbar{font:inherit;font-size:12px;margin:8px 0;padding:10px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc}.ap-category-toolbar button{font:inherit;cursor:pointer;border:1px solid #cbd5e1;border-radius:5px;background:white;color:#234d78;padding:5px 8px;margin:3px}.ap-category-toolbar button[aria-pressed=true]{background:#e6eef9;border-color:#7f9fc8}.ap-category-toolbar p{margin:5px 0 0;color:#536981}.ap-category-status{font-weight:600}`;
  document.head.append(categoryStyle);
  const categoryName=a=>String(a.category||'').trim()||'Uncategorized';
  const categoryDisplay=node=>({value:node.style.getPropertyValue('display'),priority:node.style.getPropertyPriority('display')});
  const categoryHasHiddenDisplay=node=>node.style.getPropertyValue('display')==='none' && node.style.getPropertyPriority('display')==='important';
  function restoreCategoryRow(node,saved){
    // If Aeries has changed display since the last pass, its newer value wins.
    if(categoryHasHiddenDisplay(node)){
      if(saved.value)node.style.setProperty('display',saved.value,saved.priority);
      else node.style.removeProperty('display');
    }
    node.removeAttribute('data-ap-category-hidden');
  }
  function hideCategoryRow(node){
    if(!categoryHidden.has(node))categoryHidden.set(node,categoryDisplay(node));
    else if(!categoryHasHiddenDisplay(node))categoryHidden.set(node,categoryDisplay(node));
    // Inline important beats the forceShow classes Aeries swaps on view changes.
    if(!categoryHasHiddenDisplay(node))node.style.setProperty('display','none','important');
    if(!node.hasAttribute('data-ap-category-hidden'))node.setAttribute('data-ap-category-hidden','true');
  }
  const categoryObserver=new MutationObserver(mutations=>{
    if(!categoryContext?.element.isConnected || !categoryHidden.size)return;
    if(mutations.some(m=>categoryHidden.has(m.target)))applyCategorySelection();
  });
  function clearCategorySpotlight(){
    categoryObserver.disconnect();
    for(const [node,saved] of categoryHidden)restoreCategoryRow(node,saved);
    categoryHidden.clear();categoryToolbar?.remove();categoryToolbar=null;categorySignature='';categoryContext=null;
  }
  function applyCategorySelection(){
    if(!categoryContext || !db.settings.enabled || !db.settings.categorySpotlight){clearCategorySpotlight();return;}
    const {scope,element,assignments,counts}=categoryContext;
    let selected=categorySelections.get(scope)||'';
    if(selected && !counts.has(selected)){selected='';categorySelections.delete(scope);}
    // Disconnect while applying our own styles, so this observer cannot feed itself.
    categoryObserver.disconnect();
    const nextHidden=new Set();
    for(const a of assignments)for(const row of a.sourceRows||[a.sourceRow]){
      if(row && selected && categoryName(a)!==selected)nextHidden.add(row);
    }
    for(const [row,saved] of categoryHidden)if(!nextHidden.has(row)){
      restoreCategoryRow(row,saved);categoryHidden.delete(row);
    }
    for(const row of nextHidden)hideCategoryRow(row);
    for(const b of categoryToolbar?.querySelectorAll('button')||[]){
      const value=b.dataset.category===selected?'true':'false';
      if(b.getAttribute('aria-pressed')!==value)b.setAttribute('aria-pressed',value);
    }
    const status=categoryToolbar?.querySelector('.ap-category-status');
    const text=selected?`Showing ${counts.get(selected)} of ${assignments.length} assignments: ${selected}.`:`Showing all ${assignments.length} assignments.`;
    if(status && status.textContent!==text)status.textContent=text;
    if(categoryHidden.size && element.isConnected)categoryObserver.observe(element,{subtree:true,attributes:true,attributeFilter:['style','class']});
  }
  function refreshCategorySpotlight(key,info,parsed){
    if(!db.settings.enabled || !db.settings.categorySpotlight || !info?.element?.isConnected){clearCategorySpotlight();return;}
    const scope=profileKey()+'|'+key,assignments=parsed.assignments,counts=new Map();
    for(const a of assignments){const name=categoryName(a);counts.set(name,(counts.get(name)||0)+1);}
    if(categoryContext && (categoryContext.scope!==scope || categoryContext.element!==info.element))clearCategorySpotlight();
    categoryContext={scope,element:info.element,assignments,counts};
    const signature=JSON.stringify([scope,[...counts]]);
    if(!categoryToolbar?.isConnected || categoryToolbar.parentElement!==info.element.parentElement || categorySignature!==signature){
      categoryToolbar?.remove();categoryToolbar=el('div',null,{'data-ap-owned':'categories',class:'ap-category-toolbar',role:'group','aria-label':'Filter assignments by category'});
      categoryToolbar.append(el('strong','Category: '));
      for(const [category,count] of [['',assignments.length],...counts]){
        const b=button(`${category||'All'} (${count})`,event=>{
          event.preventDefault();event.stopPropagation();
          if(categoryContext?.scope!==scope || !categoryContext.element.isConnected)return;
          categorySelections.set(scope,category);applyCategorySelection();
        });
        b.dataset.category=category;categoryToolbar.append(b);
      }
      categoryToolbar.append(el('p','',{class:'ap-category-status',role:'status','aria-live':'polite'}),
        el('p','Filters assignment rows in both views. Grades, impacts, and the weight map still use all assignments.'));
      info.element.parentElement.insertBefore(categoryToolbar,info.element);categorySignature=signature;
    }
    applyCategorySelection();
  }
  // Assignment circle areas share one scale across all active categories.
  // This describes the currently counted points, not leave-one-out grade impact.
  function buildWeightEntries(assignments,rules={}){
    const fail=error=>({entries:[],error,result:null,ungradedCount:0,excludedCount:0});
    const result=GradeMath.calculate(assignments,rules);
    if(result.error)return fail(result.error);
    if(result.value===null)return fail(result.usedCount>0&&rules.mode==='weighted'
      ?'Only 0% categories have graded assignments. There is no counted grade yet.'
      :'No graded assignments yet. Circles appear when scores are posted.');
    const categories=new Map(result.categories.map(c=>[c.name,c]));
    const activeWeight=result.categories.reduce((sum,c)=>sum+(c.weight||0),0);
    const entries=[];let ungradedCount=0,excludedCount=0;
    for(const a of assignments){
      if(a.earned===null){ungradedCount++;continue;}
      if(a.included===false){excludedCount++;continue;}
      const category=typeof a.category==='string'&&a.category.trim()?a.category.trim():'Uncategorized';
      const subtotal=categories.get(category),possible=GradeMath.parseNumber(a.possible),earned=GradeMath.parseNumber(a.earned);
      const categoryShare=rules.mode==='weighted'?subtotal.weight/activeWeight:subtotal.possible/result.totalPossible;
      const share=categoryShare*possible/subtotal.possible;
      if(share<0||!Number.isFinite(share))return fail('The counted assignment weights could not be determined.');
      const percent=earned/possible*100;
      if(!Number.isFinite(percent))return fail('An assignment score is too large to display reliably in the weight map.');
      const id=String(a.id).trim();
      entries.push({id,name:typeof a.name==='string'&&a.name.trim()?a.name.trim():id,
        number:id.replace(/^aeries:/,''),category,earned,possible,share,weight:share*100,
        percent,categoryShare,categoryPossible:subtotal.possible});
    }
    entries.sort((a,b)=>a.number.localeCompare(b.number,undefined,{numeric:true}));
    return {entries,error:null,result,ungradedCount,excludedCount};
  }
  function layoutWeightCircles(entries){
    const maximum=entries.reduce((largest,e)=>Number.isFinite(e.share)&&e.share>largest?e.share:largest,0);
    const scale=maximum>0?110/Math.sqrt(maximum):0;
    return {scale,circles:entries.map(e=>({...e,radius:Number.isFinite(e.share)&&e.share>0?scale*Math.sqrt(e.share):0}))};
  }
  let weightMapState=null,weightMapButton=null,weightMapSelection='';
  let weightMapJump=null,weightMapHighlight=null,weightMapHighlightTimer=null;
  function clearWeightMapHighlight(){
    clearTimeout(weightMapHighlightTimer);weightMapHighlightTimer=null;
    if(weightMapHighlight){
      const {row,addedTabIndex}=weightMapHighlight;
      row.removeAttribute('data-ap-weight-jump');
      if(addedTabIndex&&row.getAttribute('tabindex')==='-1')row.removeAttribute('tabindex');
      weightMapHighlight=null;
    }
  }
  function showWeightAssignment(scope,id){
    // Re-read live rows: Aeries can replace them while the map is open.
    scan();
    const state=weightMapState;
    if(!state||state.scope!==scope||scope!==profileKey()+'|'+detectedCourseKey||nativePageState?.waiting||state.error)
      return 'The gradebook changed. Open its weight map again and select the assignment.';
    const source=annotationSources.get(state.key)?.find(a=>String(a.id)===id);
    const rows=(source?.sourceRows||[source?.sourceRow]).filter(row=>row?.isConnected&&nativePageState?.table?.contains(row));
    if(!rows.length)return 'This assignment is no longer on the page. Refresh the gradebook and try again.';
    if(categoryContext?.scope===scope){
      const selected=categorySelections.get(scope);
      if(selected&&selected!==categoryName(source)){categorySelections.delete(scope);applyCategorySelection();}
    }
    // Respect Aeries' active table/card view instead of forcing hidden rows open.
    const row=rows.find(row=>row.getClientRects().length&&!['hidden','collapse'].includes(getComputedStyle(row).visibility));
    if(!row)return 'This assignment is hidden in the current Aeries view. Show all assignments and try again.';
    weightMapJump={row,scope,key:state.key};
    dialog.close();
    return '';
  }
  function finishWeightMapJump(){
    const jump=weightMapJump;weightMapJump=null;
    if(!jump)return false;
    const current=GradeDOM.currentCourse(),row=jump.row;
    if(!current||nativeCourseKey(current)!==jump.key||jump.scope!==profileKey()+'|'+detectedCourseKey
      ||nativePageState?.waiting||!row.isConnected||!nativePageState?.table?.contains(row)||!row.getClientRects().length)return false;
    clearWeightMapHighlight();
    const addedTabIndex=!row.hasAttribute('tabindex');
    if(addedTabIndex)row.setAttribute('tabindex','-1');
    weightMapHighlight={row,addedTabIndex};
    row.setAttribute('data-ap-weight-jump','true');
    row.focus({preventScroll:true});
    row.scrollIntoView({block:'center',inline:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    weightMapHighlightTimer=setTimeout(clearWeightMapHighlight,2600);
    return true;
  }
  window.addEventListener('pagehide',()=>{weightMapJump=null;clearWeightMapHighlight();});
  function weightPercent(value){return value>0&&value<0.01?'<0.01%':GradeMath.format(value,2)+'%';}
  function weightMapError(error){
    return String(error||'').replace(/to calculate impacts/g,'to show the weight map')
      .replace(/Impact estimates need/g,'The weight map needs').replace(/impacts appear/g,'circles appear')
      .replace(/impacts will appear/g,'circles will appear');
  }
  function clearWeightMapPage(){
    const hadState=Boolean(weightMapState);
    weightMapButton?.remove();weightMapButton=null;weightMapState=null;weightMapSelection='';
    weightMapJump=null;clearWeightMapHighlight();
    if(hadState&&dialog.open&&activeTab==='weights')renderTab('weights');
  }
  function refreshWeightMap(key,current,parsed,options={}){
    if(!db.settings.enabled||!db.settings.weightMap){clearWeightMapPage();return;}
    const checked=GradeMath.fromAeries(parsed.assignments,parsed.rules,options);
    const built=checked.error?{entries:[],error:weightMapError(checked.error),result:null,ungradedCount:0,excludedCount:0}:
      buildWeightEntries(parsed.assignments,checked.model.rules);
    const c=profile().courses[key];
    for(const entry of built.entries){
      const source=parsed.assignments.find(a=>String(a.id)===entry.id);
      const posted=GradeDOM.assignmentGrade(source);
      entry.scoreValue=posted.value;entry.scoreUnit=posted.unit;
      const limits=c&&c.scale===entry.scoreUnit?cutoffs(c):entry.scoreUnit==='average'?db.settings.averageCutoffs:db.settings.cutoffs;
      const band=limits.findIndex(n=>entry.scoreValue>=n);entry.color=db.settings.colors[band<0?3:band];
    }
    const scope=profileKey()+'|'+key;
    const state={scope,key,title:current.title,...built,rules:checked.model?.rules||parsed.rules};
    const signature=JSON.stringify([scope,state.title,state.error,state.entries,state.ungradedCount,state.excludedCount,state.rules]);
    const changed=signature!==weightMapState?.signature;
    if(scope!==weightMapState?.scope){weightMapSelection='';weightMapJump=null;clearWeightMapHighlight();}
    weightMapState={...state,signature};
    const table=GradeDOM.listTables().find(t=>t.nativeAeries)?.element;
    if(table&&(!weightMapButton?.isConnected||weightMapButton.parentElement!==table.parentElement)){
      weightMapButton?.remove();
      weightMapButton=button('Assignment weight map',()=>openPanel('weights'));
      weightMapButton.className='ap-weight-map-open';weightMapButton.setAttribute('data-ap-owned','weight-map-open');
      weightMapButton.style.cssText='font:inherit;font-size:12px;cursor:pointer;color:#234d78;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:8px 12px;margin:8px 0;';
      table.parentElement.insertBefore(weightMapButton,table);
    }
    if(changed&&dialog.open&&activeTab==='weights')renderTab('weights');
  }
  function renderWeightMap(){
    content.append(el('h2','Assignment weight map'));
    if(!weightMapState||weightMapState.scope!==profileKey()+'|'+detectedCourseKey){
      content.append(note('Open a course’s gradebook details to see its assignment circles.','ap-empty'));return;
    }
    const state=weightMapState;
    content.append(el('h3',state.title));
    if(state.error){content.append(note(state.error,'ap-banner'));return;}
    content.append(note('Circle area shows each assignment’s share of the current counted grade. All categories use the same size scale. Colors follow your grade thresholds. Hover, click, or focus an assignment for details.'));
    const style=el('style');style.textContent=`
      .ap-weight-circles{display:flex;flex-wrap:wrap;align-items:center;gap:22px;padding:20px 8px;margin:10px 0;border:1px solid #dbe4ef;border-radius:12px;background:#fafcfe}
      .ap-weight-circle{flex:0 0 auto;min-width:0;min-height:0;padding:0;border:0;border-radius:50%;box-sizing:border-box;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;cursor:pointer;line-height:1}
      .ap-weight-circle:hover{filter:brightness(1.13)}.ap-weight-circle[aria-pressed=true]{outline:3px solid #8b9cb1;outline-offset:4px}
      .ap-weight-circle:focus-visible{outline:3px solid #2563eb;outline-offset:5px}
      .ap-weight-detail{padding:14px 16px;border:1px solid #c7d8ee;border-radius:10px;background:#f3f7fd;margin:12px 0;min-height:110px}
      .ap-weight-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:8px}
      .ap-weight-item{display:flex;align-items:center;gap:9px;text-align:left;font-weight:400;min-width:0}.ap-weight-item[aria-pressed=true]{border-color:#678bb9;background:#eff6ff}
      .ap-weight-number{display:inline-flex;align-items:center;justify-content:center;flex:0 0 27px;height:27px;border-radius:50%;color:white;font-weight:700;font-size:12px}
      .ap-weight-number-zero{border-radius:4px;background:#e2e8f0;color:#334155}
      .ap-weight-label{min-width:0;overflow-wrap:anywhere}.ap-weight-label strong{display:block}.ap-weight-label small{display:block;color:#536981}
    `;
    content.append(style);
    const circleBox=el('div',null,{class:'ap-weight-circles',role:'group','aria-label':'Assignments sized by current counted weight'});
    const detail=el('div',null,{class:'ap-weight-detail','aria-live':'polite','aria-atomic':'true'});
    const list=el('div',null,{class:'ap-weight-list',role:'group','aria-label':'Assignment names and weights'});
    const items=[],detailText=el('div');
    let shownAssignment=null;
    const jumpButton=button('Show in gradebook',()=>{
      if(!shownAssignment)return;
      const error=showWeightAssignment(state.scope,shownAssignment.id);
      if(error){
        // scan() may have rebuilt the panel; show the message in its current view.
        content.querySelector('.ap-weight-jump-error')?.remove();
        const message=note(error,'ap-error ap-weight-jump-error');message.setAttribute('role','status');
        (content.querySelector('.ap-weight-detail')||content).append(message);
      }
    });
    detail.append(detailText,jumpButton);
    const scoreText=e=>GradeMath.format(e.earned,4)+' / '+GradeMath.format(e.possible,4)+' · '+GradeMath.format(e.scoreValue,2)+(e.scoreUnit==='percent'?'%':' average points');
    const show=e=>{
      shownAssignment=e;
      jumpButton.setAttribute('aria-label','Show assignment '+e.number+': '+e.name+' in gradebook');
      detail.querySelector('.ap-weight-jump-error')?.remove();
      detailText.replaceChildren(el('strong',e.name),el('div',e.category+' · '+scoreText(e)));
      detailText.append(el('p',e.share===0?'0% — category does not count':weightPercent(e.weight)+' of the current counted grade'));
      if(state.rules.mode==='weighted')detailText.append(note(weightPercent(e.categoryShare*100)+' active category share × '+GradeMath.format(e.possible,4)+' / '+GradeMath.format(e.categoryPossible,4)+' counted category points'));
      else detailText.append(note(GradeMath.format(e.possible,4)+' / '+GradeMath.format(state.result.totalPossible,4)+' counted points'));
    };
    const select=e=>{
      weightMapSelection=e.id;show(e);
      for(const item of items){const chosen=item.entry.id===e.id;item.circle?.setAttribute('aria-pressed',String(chosen));item.label.setAttribute('aria-pressed',String(chosen));}
    };
    for(const e of layoutWeightCircles(state.entries).circles){
      const diameter=e.radius*2,number=e.number,weightText=e.share===0?'0% — category does not count':weightPercent(e.weight)+' of grade';
      const description=e.name+'; '+e.category+'; '+scoreText(e)+'; '+weightText;
      // Zero-area assignments remain reachable by their list button. A
      // minimum-sized circle would incorrectly imply a positive weight.
      let circle=null;
      if(e.share>0){
        circle=button(diameter>=34?number:'',()=>select(e),'ap-weight-circle');
        circle.style.width=diameter+'px';circle.style.height=diameter+'px';circle.style.backgroundColor=e.color;
        circle.style.fontSize=Math.min(26,Math.max(12,diameter/5))+'px';circle.title=description;
        circle.setAttribute('aria-label',description);circle.setAttribute('data-assignment-id',e.id);circle.setAttribute('data-radius',String(e.radius));
      }
      const label=button('',()=>select(e),'ap-weight-item');label.setAttribute('data-assignment-id',e.id);
      label.setAttribute('aria-label',description);
      const swatch=el('span',number,{class:'ap-weight-number'+(e.share===0?' ap-weight-number-zero':''),'aria-hidden':'true'});if(e.share>0)swatch.style.backgroundColor=e.color;
      const labelText=el('span',null,{class:'ap-weight-label'});labelText.append(el('strong',e.name),el('small',e.category+' · '+weightText));
      label.append(swatch,labelText);
      for(const node of [circle,label].filter(Boolean)){
        node.addEventListener('focus',()=>select(e));
        node.addEventListener('pointerenter',()=>show(e));
        node.addEventListener('pointerleave',()=>{const chosen=state.entries.find(a=>a.id===weightMapSelection);if(chosen)show(chosen);});
      }
      items.push({entry:e,circle,label});if(circle)circleBox.append(circle);list.append(label);
    }
    content.append(circleBox,detail,list);
    select(state.entries.find(e=>e.id===weightMapSelection)||state.entries[0]);
    const omitted=state.ungradedCount+state.excludedCount;
    const explanation=state.rules.mode==='weighted'?'Positive category weights are shared among categories with counted scores. Assignments in 0% categories stay in the list and have no circle. As more work is graded, these shares can change.':'Shares use each assignment’s possible points divided by all counted possible points.';
    content.append(note(explanation+(omitted?' '+omitted+' ungraded or excluded assignment'+(omitted===1?' has':'s have')+' no circle.':'')));
    if(state.rules.scoreFloor!==null&&state.rules.scoreFloor!==undefined||state.rules.scoreCeiling!==null&&state.rules.scoreCeiling!==undefined){
      content.append(note('Aeries score limits are included when checking the totals. Circle colors use posted scores; circle sizes use counted possible points.'));
    }
    content.append(note(state.rules.averageMaximum?'Weights are checked against the displayed Aeries category averages and overall grade. Each assignment uses a four-point scale.':'Weights are checked against the displayed Aeries totals. They describe the current grade, not historical changes or future replacement rules.'));
  }
  const host=el('div',null,{id:'ap-playground-host','data-ap-owned':'panel'});
  const root=host.attachShadow({mode:'open'});
  const uiStyle=el('style');
  uiStyle.textContent=`
  :host {all:initial;font-family:var(--ap-aeries-font,sans-serif);color-scheme:light;color:#1e293b;}
  *,*::before,*::after{box-sizing:border-box} [hidden]{display:none!important}
  button,input,select,textarea{font:inherit}button{cursor:pointer;border:1px solid #cbd5e1;border-radius:9px;padding:9px 13px;background:white;color:#284361;font-size:13px;font-weight:600}button:hover{background:#f1f5f9}button:disabled{opacity:.45;cursor:not-allowed}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
  input:not([type=checkbox]):not([type=range]):not([type=color]),select,textarea{border:1px solid #bdcbdc;border-radius:7px;padding:8px;min-width:0;max-width:100%;background:#fff;color:#18314b;font-size:13px}input[type=number]{width:90px}input[type=color]{height:34px;width:42px;border:1px solid #bdcbdc;border-radius:7px;background:white;padding:3px}input[type=checkbox]{accent-color:#2563eb;width:17px;height:17px}input[type=range]{accent-color:#2563eb;max-width:100%}
  dialog{margin:auto;padding:0;border:1px solid #d6e1ec;border-radius:20px;background:#fff;color:#1e293b;width:min(1050px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:auto;box-shadow:0 22px 100px #102a4b45;font-family:inherit;font-size:14px;line-height:1.5}dialog::backdrop{background:#122a466b}
  .ap-top{padding:22px 26px 14px;display:flex;justify-content:space-between;align-items:start;gap:18px;border-bottom:1px solid #e2e8f0}.ap-eyebrow{text-transform:uppercase;letter-spacing:1.8px;font-size:10px;font-weight:700;color:#3d6590;margin:0 0 5px}h1{font-size:25px;margin:0;letter-spacing:-.6px}h2{font-size:20px;margin:0 0 8px}h3{font-size:15px;margin:0 0 9px}p{margin:8px 0} .ap-close{font-size:23px;border:0;background:#eef3f9;border-radius:50%;padding:0;width:34px;height:34px;flex-shrink:0}
  .ap-tabs{display:flex;gap:5px;padding:12px 26px 0;background:#fafcfe;flex-wrap:wrap}.ap-tabs button{border-color:transparent;background:transparent;padding:9px 13px}.ap-tabs button[aria-selected=true]{background:#e8f0fc;color:#1d4ed8;border-color:#c7dafb}.ap-content{padding:24px 26px;min-height:200px}.ap-footer{padding:11px 26px;background:#f7f9fc;border-top:1px solid #e2e8f0;font-size:11px;color:#55708d}
  .ap-muted{color:#536981;font-size:12px}.ap-error{color:#b42318;font-size:12px;white-space:pre-wrap}.ap-primary{background:#245de8;color:#fff;border-color:#245de8}.ap-primary:hover{background:#1d4ed8}.ap-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.ap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}.ap-box{border:1px solid #dbe4ef;border-radius:12px;padding:16px;margin-bottom:15px;background:#fff}.ap-pill{display:inline-block;border:1px solid #bdd4f6;border-radius:99px;background:#eff6ff;padding:3px 8px;font-size:11px;color:#234d78}.ap-field{display:flex;flex-direction:column;gap:5px;font-size:12px;color:#475d75}.ap-toggle{display:flex;align-items:center;gap:9px;font-size:13px;padding:7px 0}.ap-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:#50657c;font-size:11px;background:#f6f9fc}th,td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}td input{max-width:100%}.ap-course-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}.ap-course-title{font-size:15px;font-weight:700;margin:0 0 5px}.ap-result{font-size:30px;font-weight:700;color:#234c7d;font-variant-numeric:tabular-nums}.ap-empty{padding:28px;border:1px dashed #bdcbdc;border-radius:12px;text-align:center;color:#536981}.ap-banner{padding:12px 15px;border-radius:10px;background:#eff6ff;border:1px solid #c9dcf8;margin-bottom:16px;font-size:12px}.ap-saving{min-height:18px}
  @media(max-width:600px){.ap-top{padding:18px}.ap-content{padding:18px}.ap-tabs{padding:9px 12px 0}.ap-footer{padding:12px 18px}.ap-course-grid{grid-template-columns:1fr}dialog{width:calc(100vw - 12px);max-height:calc(100dvh - 12px)}.ap-grid{grid-template-columns:1fr}}
  @media print{:host{display:none!important}}
  `;
  const dialog=el('dialog',null,{'aria-labelledby':'ap-title'});
  const top=el('div',null,{class:'ap-top'}),heading=el('div');heading.append(el('p','Your local dashboard toolkit',{class:'ap-eyebrow'}),el('h1','Aeries Playground',{id:'ap-title'}),note('Make your courses yours. Explore the numbers.'));
  const close=button('×',()=>dialog.close(),'ap-close');close.setAttribute('aria-label','Close Playground');top.append(heading,close);
  const tabs=el('div',null,{class:'ap-tabs',role:'tablist','aria-label':'Playground sections'});
  const content=el('div',null,{class:'ap-content',role:'tabpanel',id:'ap-content'});
  for(const event of ['input','change'])content.addEventListener(event,()=>{if(activeTab==='courses')coursesFormDirty=true;});
  const footer=el('div',null,{class:'ap-footer'}),status=el('span');footer.append(status);
  const tabsByName={courses:'Courses',weights:'Weight map',settings:'Settings'};
  for(const [name,label] of Object.entries(tabsByName)){const b=button(label,()=>renderTab(name));b.setAttribute('role','tab');b.id='ap-tab-'+name;b.setAttribute('aria-controls','ap-content');b.dataset.tab=name;tabs.append(b);}
  tabs.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const buttons=[...tabs.children],i=buttons.indexOf(root.activeElement);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;renderTab(buttons[next].dataset.tab);buttons[next].focus();});
  dialog.append(top,tabs,content,footer);root.append(uiStyle,dialog);document.body.append(host);
  function focusedElement(){let node=document.activeElement;while(node?.shadowRoot?.activeElement)node=node.shadowRoot.activeElement;return node;}
  let panelReturnFocus=null;
  function handlePanelClose(){
    const previous=panelReturnFocus;panelReturnFocus=null;
    // Finish a requested gradebook jump before restoring ordinary panel focus.
    if(finishWeightMapJump())return;
    if(previous?.isConnected)previous.focus?.({preventScroll:true});
  }
  dialog.addEventListener('close',handlePanelClose);
  function openPanel(tab='courses',courseKeyValue=''){
    if(!dialog.open)panelReturnFocus=focusedElement();
    if(courseKeyValue)selectedCourse=courseKeyValue;scan();renderTab(tab);
    if(!dialog.open)dialog.showModal();
  }
  function settingsShortcut(event){
    if(event.defaultPrevented || event.isComposing || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.key?.toLowerCase()!=='s')return;
    const path=event.composedPath?.() || [event.target];
    // Events crossing a shadow root are retargeted to its host. Inspect both
    // the composed path and deepest focused element before treating S as a shortcut.
    if([...path,focusedElement()].some(node=>node?.matches?.('input,textarea,select,[role="textbox"],[role="combobox"]') || node?.isContentEditable))return;
    event.preventDefault();openPanel('settings');
  }
  document.addEventListener('keydown',settingsShortcut);
  function renderTab(name){
    if(!Object.hasOwn(tabsByName,name))name='courses';
    activeTab=name;content.replaceChildren();
    content.dataset.tab=name;
    for(const b of tabs.children){const chosen=b.dataset.tab===name;b.setAttribute('aria-selected',chosen?'true':'false');b.tabIndex=chosen?0:-1;}
    content.setAttribute('aria-labelledby','ap-tab-'+name);
    if(storageError)content.append(note(storageError,'ap-error'));
    if(!db.settings.enabled)content.append(note('Playground is paused. Enable it in Settings to show page enhancements.','ap-banner'));
    const features={weights:'weightMap'};
    const feature=features[name];
    if(feature && (!db.settings.enabled || !db.settings[feature])){
      content.append(note(`${tabsByName[name]} is turned off. Your saved data is kept.`, 'ap-empty'),button('Enable '+tabsByName[name],()=>{if(!db.settings.enabled)setToggle('enabled',true);setToggle(feature,true);renderTab(name);},'ap-primary'));
    }else if(name==='courses')renderCourses();
    else if(name==='weights')renderWeightMap();else renderSettings();
  }
  function renderCourses(){
    content.append(el('h2','Courses & class periods'),note('Your display names appear on the dashboard. Hover over a name to see the original. Dashboard grade colors and number grades are controlled in Settings. Class periods connect your courses to the MVHS next-class widget.'));
    const p=profile(),entries=Object.entries(p.courses);
    renderedCourseKeys=JSON.stringify(Object.keys(p.courses));coursesFormDirty=false;
    if(!entries.length){content.append(note('Open your Aeries dashboard once to discover your courses.','ap-empty'));return;}
    const grid=el('div',null,{class:'ap-course-grid'});content.append(grid);const controls=[];
    for(const [key,c] of entries){
      const box=el('div',null,{class:'ap-box'});box.append(el('p',c.title,{class:'ap-course-title'}));
      const live=cards.find(a=>a.key===key);
      const total=key===detectedCourseKey && !nativePageState?.waiting?[...document.querySelectorAll('tr[id*="DataSummary"][id$="_trSummary"]')].find(row=>/^total$/i.test(GradeDOM.cleanText(row.querySelector('[id$="_tdDESC"]')))):null;
      box.append(note(live?.raw || GradeDOM.cleanText(total?.querySelector('[id$="_tdPCT"]')) || 'No current grade on this page'));
      const nick=input(c.nickname),icon=input(c.icon),min=input(c.minimum??(c.scale==='average'?1:50),'number'),max=input(c.maximum,'number');nick.maxLength=70;icon.maxLength=12;icon.style.width='64px';min.step='any';max.min='0.01';max.step='any';
      const row=el('div',null,{class:'ap-row'});row.append(field('Icon',icon),field('Display name',nick));box.append(row);
      const detected=live?.schedulePeriod;
      const schedulePeriod=input(c.schedulePeriod);schedulePeriod.maxLength=12;schedulePeriod.placeholder=detected?`Automatic: Period ${detected}`:'Not detected — enter period';
      schedulePeriod.setAttribute('aria-label',`${c.title} class period`);
      box.append(field('Class period (optional override)',schedulePeriod),note(detected?`Aeries shows Period ${detected}. Leave blank to use it.`:'Enter the period from your class schedule, for example 1 or 7.'));
      const scale=el('select');for(const [value,label] of [['percent','Percentage'],['average','Average points']])scale.append(el('option',label,{value}));scale.value=c.scale;
      const row2=el('div',null,{class:'ap-row'});row2.append(field('Bar scale',scale),field('Bar minimum',min),field('Bar maximum',max));box.append(row2);
      const custom=input(Boolean(c.customCutoffs),'checkbox');custom.checked=Boolean(c.customCutoffs);const toggle=el('label',null,{class:'ap-toggle'});toggle.append(custom,el('span','Custom thresholds for this course'));box.append(toggle);
      const cutrow=el('div',null,{class:'ap-row'});const values=cutoffs(c);const nums=values.map((n,i)=>{const v=input(n,'number');v.step='any';v.min='0';v.style.width='70px';cutrow.append(field(['4 ≥','3 ≥','2 ≥'][i],v));return v;});cutrow.hidden=!custom.checked;custom.addEventListener('change',()=>cutrow.hidden=!custom.checked);box.append(cutrow);
      controls.push({key,nick,icon,schedulePeriod,min,max,scale,custom,nums});grid.append(box);
    }
    const message=note('','ap-saving');const save=button('Save course settings',()=>{
      const draft={};for(const c of controls){const period=CourseSchedule.normalize(c.schedulePeriod.value);if(c.schedulePeriod.value.trim() && period===null){message.className='ap-error';message.textContent='Enter a valid class period (for example 1 or 7), or leave it blank for automatic detection.';return;}const min=GradeMath.parseNumber(c.min.value),max=GradeMath.parseNumber(c.max.value),limits=c.nums.map(n=>GradeMath.parseNumber(n.value));if(min===null||max===null||max<=0||min>=max||(c.custom.checked&&!validCutoffs(limits))){message.className='ap-error';message.textContent='Enter a bar minimum below its positive maximum, and descending nonnegative thresholds.';return;}draft[c.key]={...p.courses[c.key],nickname:c.nick.value.trim(),icon:c.icon.value.trim(),schedulePeriod:period || '',minimum:min,maximum:max,scale:c.scale.value,customCutoffs:c.custom.checked?limits:null};}
      Object.assign(p.courses,draft);coursesFormDirty=false;const ok=persist();restoreTitles();scan();message.className=ok?'ap-muted':'ap-error';message.textContent=ok?'Saved. Your dashboard has been updated.':storageError;
    },'ap-primary');content.append(save,message);
  }
  function renderSettings(){
    content.append(el('h2','Make it yours'));
    const draft=clone(db.settings),toggles={},grid=el('div',null,{class:'ap-grid'}),box=el('div',null,{class:'ap-box'});
    for(const [key,label] of Object.entries({enabled:'Enable Playground',dashboardColors:'Dashboard grade colors',numericGrades:'Show 4/3/2/1 on dashboard',overallGrade:'Overall grade / GPA above classes',nextClass:'What class is next (MVHS)',nicknames:'Course nicknames & icons',bars:'Grade progress bars',detailsColors:'Grade colors on details page',impacts:'Assignment impact labels on the page',precise:'Ridiculously precise mode',categorySpotlight:'Category filter on gradebook pages',weightMap:'Assignment weight map'})){
      const n=input('', 'checkbox');n.checked=draft[key];toggles[key]=n;n.addEventListener('change',()=>setToggle(key,n.checked));const l=el('label',null,{class:'ap-toggle'});l.append(n,el('span',label));box.append(l);
      if(key==='nextClass'){
        const explanation=note('Off by default. Turning this on allows public schedule and clock requests to mvhs.io’s Firebase service and bell.plus. No grades or course data are sent; these services can see your IP address. Turning it off cancels pending requests.');
        explanation.id='ap-schedule-consent';n.setAttribute('aria-describedby',explanation.id);box.append(explanation);
      }
    }
    box.append(note('Toggles apply and save immediately. Impact estimates and the weight map use the open gradebook’s scores and grading rules.'));
    box.append(note('Number grades replace only the dashboard letter: 4, 3, 2, or 1 from your thresholds. The posted percentage or average stays visible. Turn this off to show the original letters.'));
    box.append(note('With 4/3/2/1 enabled, the overall summary displays the average of your threshold-based class ratings; its color indicates the overall band. With it disabled, Current-year GPA averages posted A/B/C/D/F letters as 4/3/2/1/0, ignoring plus/minus signs and thresholds.'));
    box.append(note('Precise mode shows up to 8 decimals for calculated percentages and impact estimates, and keeps the precision Aeries actually displays. Raw-score conversion always rounds gradebook points down to 2 decimals.'));
    const scopeBox=el('div',null,{class:'ap-box'});scopeBox.append(el('h3','Separate course settings'));
    const scopeInput=input(draft.profile),yearInput=input(draft.year);scopeInput.maxLength=60;yearInput.maxLength=4;scopeBox.append(field('Settings profile',scopeInput),field('School-year starting year',yearInput),note('Use a separate profile for each student or account. Change this before switching students; the script does not read account identity. Use a new year to start fresh.'));
    grid.append(box,scopeBox);content.append(grid);
    const colorBox=el('div',null,{class:'ap-box'});colorBox.append(el('h3','Grade colors & thresholds'),note('These settings control dashboard colors and number grades, progress bars, and grade-details colors. Course-specific thresholds override these defaults.'));
    const colorRows=[];for(let i=0;i<4;i++){const r=el('div',null,{class:'ap-row'});const color=input(draft.colors[i],'color');color.setAttribute('aria-label','Band '+(i+1)+' color');r.append(field(['4 · top band','3 · second band','2 · third band','1 · below all cutoffs'][i],color));let percent=null,avg=null;if(i<3){percent=input(draft.cutoffs[i],'number');avg=input(draft.averageCutoffs[i],'number');percent.step=avg.step='any';r.append(field('Percentage ≥',percent),field('Average ≥',avg));}colorRows.push({color,percent,avg});colorBox.append(r);}content.append(colorBox);
    const message=note('','ap-saving');content.append(button('Save settings',()=>{
      const cut=colorRows.slice(0,3).map(r=>GradeMath.parseNumber(r.percent.value)),avg=colorRows.slice(0,3).map(r=>GradeMath.parseNumber(r.avg.value));
      if(!validCutoffs(cut)||!validCutoffs(avg)||(yearInput.value.trim()&&!/^\d{4}$/.test(yearInput.value.trim()))){message.textContent='Use descending nonnegative thresholds and a four-digit year if supplied.';message.className='ap-error';return;}
      const scopeChanged=draft.profile!==scopeInput.value.trim() || draft.year!==yearInput.value.trim();
      db.settings={...draft,...Object.fromEntries(Object.entries(toggles).map(([k,n])=>[k,n.checked])),scheduleNetworkConsent:db.settings.scheduleNetworkConsent,cutoffs:cut,averageCutoffs:avg,colors:colorRows.map(r=>r.color.value),profile:scopeInput.value.trim(),year:yearInput.value.trim()};
      if(scopeChanged){closeGradeLab();selectedCourse='';detectedCourseKey='';annotationSources.clear();nativePageState=null;clearAnnotations();clearWeightMapPage();clearCategorySpotlight();}
      if(!db.settings.impacts)clearImpactLabels();

      const ok=persist();restoreTitles();scan();message.className=ok?'ap-muted':'ap-error';message.textContent=ok?'Saved.':storageError;
    },'ap-primary'),message);
    const local=el('div',null,{class:'ap-box'});local.append(el('h3','Saved settings'),note('Your userscript manager stores preferences, course names and aliases, and grading-rule references. Posted grades and hypothetical scores are not saved. Disable manager sync if you want settings kept on one device.'),note('Clear saved settings removes profiles, course customizations, and grading rules, then pauses Playground. Reload other Aeries tabs afterward. This does not remove copies held in manager sync or backups.'));
    const clearMessage=note('','ap-saving');local.append(button('Clear saved settings and pause',()=>{
      if(!window.confirm('Clear all Aeries Playground settings, profiles, course customizations, and grading rules? Playground will be paused.'))return;
      if(clearSavedSettings()){renderTab('settings');content.append(note('Saved settings cleared. Playground is paused. Reload other Aeries tabs.'));}
      else {clearMessage.className='ap-error';clearMessage.textContent=storageError;}
    }),clearMessage);content.append(local);
  }
  let scanTimer;
  const observer=new MutationObserver(mutations=>{
    const useful=mutations.some(m=>{
      const target=m.target.nodeType===Node.ELEMENT_NODE?m.target:m.target.parentElement;
      if(target?.closest('[data-ap-owned]'))return false;
      if(m.type==='childList'&&[...m.addedNodes,...m.removedNodes].length&&[...m.addedNodes,...m.removedNodes].every(n=>n.nodeType===Node.ELEMENT_NODE&&n.matches?.('[data-ap-owned]')))return false;
      if(m.type==='attributes')return target?.matches('.classesSection') || Boolean(target?.querySelector('.classesSection'));
      const tracked='.classesSection,table,select[id$="_dlGN"],input[id$="_chkMissingAssignmentOnly"]';
      return target?.closest(tracked) || [...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===Node.ELEMENT_NODE&&(n.matches?.(tracked)||n.querySelector?.(tracked)));
    });
    if(useful){clearTimeout(scanTimer);scanTimer=setTimeout(scan,160);}
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','aria-expanded']});
  window.addEventListener('resize',()=>{clearTimeout(scanTimer);scanTimer=setTimeout(scan,160);});
  document.addEventListener('change',()=>{clearTimeout(scanTimer);scanTimer=setTimeout(scan,160);});
  window.addEventListener('pagehide',()=>{clearTimeout(saveTimer);if(savePending)persist();});
  try{GM_registerMenuCommand('Aeries Playground — open settings (S)',()=>openPanel('settings'));}catch{/* The S keyboard shortcut remains available. */}
  scan();
})();
