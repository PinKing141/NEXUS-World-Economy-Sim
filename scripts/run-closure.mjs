import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const YEAR_DAYS = Number(process.env.CLOSURE_YEAR_DAYS || 360);
const OUTPUT_FILE = process.env.CLOSURE_OUTPUT || 'closure-latest-run.json';
const DEFAULT_CLOSURE_SEED = 20260325;
const CLOSURE_SEED = normalizeSeed(process.env.CLOSURE_SEED || process.env.NEXUS_TEST_SEED);
const INCLUDE_DEBUG_DETAILS = process.env.CLOSURE_DEBUG === '1';

function normalizeSeed(value){
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return (numeric >>> 0) || DEFAULT_CLOSURE_SEED;
  return DEFAULT_CLOSURE_SEED;
}

function createSeededRandom(seed){
  let state = seed >>> 0;
  return function seededRandom(){
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function installDeterministicRandom(target, seed){
  let state = normalizeSeed(seed);
  target.Math.random = function deterministicRandom(){
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  target.Math.random.getState = function getDeterministicRandomState(){
    return state >>> 0;
  };
  target.Math.random.setState = function setDeterministicRandomState(nextState){
    state = normalizeSeed(nextState);
  };
}

function isIgnorableDomException(error){
  if (!error) return false;
  if (error.name === 'DOMException') return true;
  return String(error).includes('DOMException');
}

process.on('unhandledRejection', (error) => {
  if (isIgnorableDomException(error)) {
    return;
  }
  console.error('Unhandled rejection during closure run:', error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

process.on('uncaughtException', (error) => {
  if (isIgnorableDomException(error)) {
    return;
  }
  console.error('Uncaught exception during closure run:', error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

function sleep(ms){
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createNoopCanvasContext(){
  const noop = function(){};
  return new Proxy({}, {
    get(_target, key){
      if (key === 'measureText') return () => ({ width:0 });
      if (key === 'createLinearGradient') return () => ({ addColorStop:noop });
      if (key === 'createPattern') return () => null;
      return noop;
    }
  });
}

function createStorageShim(){
  const backing = new Map();

  return {
    getItem(key){
      return backing.has(String(key)) ? backing.get(String(key)) : null;
    },
    setItem(key, value){
      backing.set(String(key), String(value));
    },
    removeItem(key){
      backing.delete(String(key));
    },
    clear(){
      backing.clear();
    },
    key(index){
      return Array.from(backing.keys())[index] || null;
    },
    get length(){
      return backing.size;
    }
  };
}

async function loadFileResponse(url){
  const filePath = url.protocol === 'file:' ? fileURLToPath(url) : null;
  if (!filePath) {
    return fetch(url);
  }
  const body = await fs.readFile(filePath);
  const lower = filePath.toLowerCase();
  const contentType = lower.endsWith('.json') ? 'application/json' : (lower.endsWith('.js') ? 'application/javascript' : 'text/plain');
  return new Response(body, {
    status:200,
    headers:{ 'content-type':contentType }
  });
}

async function loadScriptIntoWindow(window, scriptPath){
  const code = await fs.readFile(scriptPath, 'utf8');
  const sourceUrl = pathToFileURL(scriptPath).href;
  window.eval(`${code}\n//# sourceURL=${sourceUrl}`);
}

async function bootHeadlessWindow(repoRoot){
  const baseUrl = pathToFileURL(path.join(repoRoot, 'index.html'));
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    runScripts:'outside-only',
    url:baseUrl.href,
    pretendToBeVisual:true,
    virtualConsole
  });
  const { window } = dom;
  const localStorageShim = createStorageShim();
  const sessionStorageShim = createStorageShim();
  const scriptPaths = [
    'src/js/app/us-state-map-data.js',
    'src/js/app/name-data.js',
    'src/js/app/data.js',
    'src/js/app/utils.js',
    'src/js/app/state.js',
    'src/js/app/events.js',
    'src/js/app/persistence.js',
    'src/js/app/sim-core.js',
    'src/js/app/sim-business.js',
    'src/js/app/sim-labour.js',
    'src/js/app/sim-finance.js',
    'src/js/app/sim-demographics.js',
    'src/js/app/sim-society.js',
    'src/js/app/sim-geopolitics.js',
    'src/js/app/sim.js'
  ];

  virtualConsole.on('jsdomError', (error) => {
    if (isIgnorableDomException(error)) {
      return;
    }
    console.error('jsdom error during closure run:', error && error.stack ? error.stack : error);
    process.exitCode = 1;
  });
  virtualConsole.on('error', (...args) => {
    if (args.length === 1 && isIgnorableDomException(args[0])) {
      return;
    }
    if (args.length === 1 && typeof args[0] === 'string' && args[0].includes('DOMException')) {
      return;
    }
    console.error(...args);
  });

  window.__NEXUS_HEADLESS = true;
  installDeterministicRandom(window, CLOSURE_SEED);
  window.requestAnimationFrame = function(){ return 0; };
  window.cancelAnimationFrame = function(){};
  window.fetch = function(input, init){
    const resolved = new URL(typeof input === 'string' ? input : input.url, baseUrl);
    return loadFileResponse(resolved, init);
  };
  window.alert = function(){};
  Object.defineProperty(window, 'localStorage', {
    configurable:true,
    value:localStorageShim
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable:true,
    value:sessionStorageShim
  });
  if (window.HTMLCanvasElement && window.HTMLCanvasElement.prototype) {
    window.HTMLCanvasElement.prototype.getContext = function(){
      return createNoopCanvasContext();
    };
  }

  for (const relativePath of scriptPaths) {
    await loadScriptIntoWindow(window, path.join(repoRoot, relativePath));
  }

  const App = window.Nexus;
  App.store.reset();
  await Promise.all([
    App.data.loadCountryData ? Promise.resolve(App.data.loadCountryData()) : Promise.resolve(null),
    App.data.loadWorldCitiesData ? Promise.resolve(App.data.loadWorldCitiesData()) : Promise.resolve(null)
  ]);
  App.sim.initSim();
  App.store.simSpeed = 0;

  return dom;
}

function computeGateResults(snapshot){
  const overUtilHireShare = snapshot.overUtilizedCount > 0
    ? snapshot.overUtilizedHiringCount / snapshot.overUtilizedCount
    : 0;
  const underUtilLayoffShare = snapshot.underUtilizedCount > 0
    ? snapshot.underUtilizedLayoffCount / snapshot.underUtilizedCount
    : 0;
  const overUtilExpansionShare = snapshot.overUtilizedCount > 0
    ? snapshot.overUtilizedExpansionCount / snapshot.overUtilizedCount
    : 0;

  const gates = {
    '1.2': { pass:snapshot.invalidNumericCount === 0, value:snapshot.invalidNumericCount, note:'Numeric invariants (NaN/Infinity)' },
    '1.3': { pass:snapshot.employedExceedsLaborForceCount === 0, value:snapshot.employedExceedsLaborForceCount, note:'Labor bounds (employed <= labor force)' },
    '1.5': { pass:snapshot.globalUnemploymentRate >= 0.02 && snapshot.globalUnemploymentRate <= 0.35, value:snapshot.globalUnemploymentRate, note:'Global unemployment closure band' },
    '2.1': { pass:snapshot.demandPerWorker >= 500 && snapshot.demandPerWorker <= 60000, value:snapshot.demandPerWorker, note:'Demand intensity per employed worker' },
    '3.1': { pass:overUtilHireShare <= 0.2, value:overUtilHireShare, note:'Over-utilized firms rarely choose hiring' },
    '3.2': { pass:underUtilLayoffShare <= 0.45, value:underUtilLayoffShare, note:'Under-utilized firms avoid broad layoffs' },
    '3.4': { pass:overUtilExpansionShare <= 0.3, value:overUtilExpansionShare, note:'Over-utilized firms avoid aggressive expansion stance' }
  };

  return {
    gates,
    failedGates:Object.entries(gates).filter(([, details]) => !details.pass).map(([id]) => id)
  };
}

function collectSnapshot(window, label){
  const App = window.Nexus;
  const profiles = Object.values(App.store.countryProfiles || {});
  const businesses = App.store.businesses || [];

  let laborForceTotal = 0;
  let employedTotal = 0;
  let demandTotal = 0;
  let invalidNumericCount = 0;
  let employedExceedsLaborForceCount = 0;
  let overUtilizedCount = 0;
  let overUtilizedHiringCount = 0;
  let overUtilizedExpansionCount = 0;
  let underUtilizedCount = 0;
  let underUtilizedLayoffCount = 0;
  let underUtilizedLayoffDetails = [];

  profiles.forEach((profile) => {
    const laborForce = Number(profile.laborForce);
    const employed = Number(profile.employed);
    const demand = Number(profile.consumerDemandGU);

    if (!Number.isFinite(laborForce) || !Number.isFinite(employed) || !Number.isFinite(demand)) {
      invalidNumericCount += 1;
      return;
    }

    if (laborForce < 0 || employed < 0 || demand < 0) invalidNumericCount += 1;
    if (employed > laborForce + 1) employedExceedsLaborForceCount += 1;

    laborForceTotal += Math.max(0, laborForce);
    employedTotal += Math.max(0, employed);
    demandTotal += Math.max(0, demand);
  });

  businesses.forEach((business) => {
    const decision = App.sim.evaluateBusinessDecision(business);
    const metrics = decision && decision.metrics ? decision.metrics : null;
    const utilization = Number(metrics && metrics.demandUtilization);

    if (!Number.isFinite(utilization)) {
      invalidNumericCount += 1;
      return;
    }

    if (utilization > 1.1) {
      overUtilizedCount += 1;
      if (decision.staffingAction === 'hire') overUtilizedHiringCount += 1;
      if (decision.stance === 'aggressive') overUtilizedExpansionCount += 1;
    }

    if (utilization < 0.85) {
      underUtilizedCount += 1;
      if (decision.staffingAction === 'layoff') {
        underUtilizedLayoffCount += 1;
        if (INCLUDE_DEBUG_DETAILS) {
          underUtilizedLayoffDetails.push({
            businessId:business.id || null,
            name:business.name || null,
            countryISO:business.countryISO || null,
            stage:business.stage || null,
            bankruptcyStage:business.bankruptcyStage || null,
            employees:Math.round(Number(business.employees) || 0),
            distressScore:Number(business.distressScore) || 0,
            debtGU:Number(business.debtGU) || 0,
            valuationGU:Number(business.valuationGU) || 0,
            revenueGU:Number(business.revenueGU) || 0,
            staffingScore:Number(decision.scores && decision.scores.staffing) || 0,
            demandUtilization:utilization,
            demandGrowth:Number(metrics && metrics.demandGrowth) || 0,
            trend:Number(metrics && metrics.trend) || 0,
            profitMargin:Number(metrics && metrics.profitMargin) || 0,
            cashCoverage:Number(metrics && metrics.cashCoverage) || 0
          });
        }
      }
    }
  });

  const snapshot = {
    label,
    simDay:App.store.simDay,
    yearEstimate:Math.floor(App.store.simDay / YEAR_DAYS),
    profileCount:profiles.length,
    businessCount:businesses.length,
    laborForceTotal,
    employedTotal,
    demandTotal,
    globalUnemploymentRate:laborForceTotal > 0 ? Math.max(0, Math.min(1, (laborForceTotal - employedTotal) / laborForceTotal)) : 0,
    demandPerWorker:employedTotal > 0 ? demandTotal / employedTotal : 0,
    invalidNumericCount,
    employedExceedsLaborForceCount,
    overUtilizedCount,
    overUtilizedHiringCount,
    overUtilizedExpansionCount,
    underUtilizedCount,
    underUtilizedLayoffCount
  };

  if (INCLUDE_DEBUG_DETAILS) {
    snapshot.underUtilizedLayoffDetails = underUtilizedLayoffDetails
      .sort((left, right) => right.staffingScore - left.staffingScore)
      .slice(0, 12);
  }

  return snapshot;
}

function tickDays(window, targetDays){
  const App = window.Nexus;
  if (targetDays <= 0) return;
  App.sim.fastForwardDays(targetDays, {
    render:false,
    includeRandom:true
  });
}

async function main(){
  const repoRoot = process.cwd();
  const dom = await bootHeadlessWindow(repoRoot);

  try {
    const snapshots = [];
    snapshots.push(collectSnapshot(dom.window, 'baseline'));
    tickDays(dom.window, YEAR_DAYS);
    snapshots.push(collectSnapshot(dom.window, 'plus1Y_run1'));
    tickDays(dom.window, YEAR_DAYS);
    snapshots.push(collectSnapshot(dom.window, 'plus1Y_run2'));
    tickDays(dom.window, YEAR_DAYS);
    snapshots.push(collectSnapshot(dom.window, 'plus1Y_run3'));

    const runs = snapshots.map((snapshot) => {
      const closure = computeGateResults(snapshot);
      return {
        ...snapshot,
        gates:closure.gates,
        failedGates:closure.failedGates
      };
    });

    const report = {
      generatedAt:new Date().toISOString(),
      source:'scripts/run-closure.mjs',
      harness:'jsdom',
      seed:CLOSURE_SEED,
      yearDays:YEAR_DAYS,
      overallPassing:runs.every((run) => run.failedGates.length === 0),
      runs,
      latestFailedGates:runs[runs.length - 1].failedGates
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(report, null, 2) + '\n', 'utf8');
    console.log(`Closure report written: ${OUTPUT_FILE}`);
    console.log(`Latest failed gates: ${report.latestFailedGates.length ? report.latestFailedGates.join(', ') : 'none'}`);

    if (!report.overallPassing) {
      process.exitCode = 2;
    }
  } finally {
    dom.window.close();
  }
}

main().then(() => {
  process.exit(process.exitCode || 0);
}).catch((error) => {
  console.error('Closure run failed:', error && error.stack ? error.stack : error);
  process.exit(1);
});
