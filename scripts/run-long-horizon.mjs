import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const YEAR_DAYS = Number(process.env.NEXUS_YEAR_DAYS || 360);
const HORIZON_YEARS = Math.max(1, Number(process.env.NEXUS_HORIZON_YEARS || 70));
const OUTPUT_FILE = process.env.NEXUS_HORIZON_OUTPUT || 'long-horizon-70y.json';
const DEFAULT_SEED = 20260325;
const HORIZON_SEED = normalizeSeed(process.env.NEXUS_TEST_SEED || process.env.CLOSURE_SEED || DEFAULT_SEED);
const START_PRESET_ID = String(process.env.NEXUS_START_PRESET_ID || '1998');
const SIM_DAYS_PER_TICK = Math.max(1, Math.floor(Number(process.env.NEXUS_SIM_DAYS_PER_TICK || 7)));
const PROGRESS_INTERVAL_YEARS = Math.max(1, Math.floor(Number(process.env.NEXUS_PROGRESS_INTERVAL_YEARS || 5)));
const WRITE_INTERVAL_YEARS = Math.max(1, Math.floor(Number(process.env.NEXUS_WRITE_INTERVAL_YEARS || PROGRESS_INTERVAL_YEARS)));

function normalizeSeed(value){
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return (numeric >>> 0) || DEFAULT_SEED;
  return DEFAULT_SEED;
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
    if (isIgnorableDomException(error)) return;
    console.error('jsdom error during long-horizon run:', error && error.stack ? error.stack : error);
    process.exitCode = 1;
  });

  window.__NEXUS_HEADLESS = true;
  window.__NEXUS_SIM_DAYS_PER_TICK = SIM_DAYS_PER_TICK;
  installDeterministicRandom(window, HORIZON_SEED);
  window.requestAnimationFrame = function(){ return 0; };
  window.cancelAnimationFrame = function(){};
  window.fetch = function(input, init){
    const resolved = new URL(typeof input === 'string' ? input : input.url, baseUrl);
    return loadFileResponse(resolved, init);
  };
  window.alert = function(){};
  Object.defineProperty(window, 'localStorage', { configurable:true, value:localStorageShim });
  Object.defineProperty(window, 'sessionStorage', { configurable:true, value:sessionStorageShim });
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
  App.sim.initSim({ startPresetId:START_PRESET_ID });
  App.store.simSpeed = 0;

  return dom;
}

function average(values){
  const list = (values || []).map(Number).filter(Number.isFinite);
  if (!list.length) return 0;
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function weightedAverage(entries){
  const valid = (entries || []).filter((entry) => Number.isFinite(Number(entry && entry.value)) && Number.isFinite(Number(entry && entry.weight)));
  const totalWeight = valid.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight)), 0);
  if (!totalWeight) return 0;
  return valid.reduce((sum, entry) => sum + (Number(entry.value) * Math.max(0, Number(entry.weight))), 0) / totalWeight;
}

function stddev(values){
  const list = (values || []).map(Number).filter(Number.isFinite);
  if (!list.length) return 0;
  const mean = average(list);
  const variance = average(list.map((value) => Math.pow(value - mean, 2)));
  return Math.sqrt(variance);
}

function countBy(items, mapper){
  return (items || []).reduce((acc, item) => {
    const key = mapper(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function getPortfolioExposureGU(App, person){
  const summary = App.store.getPersonPortfolioSummary ? App.store.getPersonPortfolioSummary(person.id) : null;
  return Math.max(0, Number(summary && summary.marketValueGU) || 0);
}

function collectSnapshot(window, yearIndex, previousSnapshot){
  const App = window.Nexus;
  const profiles = Object.values(App.store.countryProfiles || {}).filter(Boolean);
  const people = App.store.people || [];
  const livingPeople = App.store.getLivingPeople ? App.store.getLivingPeople() : people.filter((person) => person && person.alive);
  const activeBusinesses = (App.store.businesses || []).filter((business) => business && business.stage !== 'defunct');
  const allBusinesses = App.store.businesses || [];
  const households = App.store.households || [];
  const listings = App.store.getAllListings ? App.store.getAllListings() : [];
  const laborForceTotal = profiles.reduce((sum, profile) => sum + Math.max(0, Number(profile.laborForce) || 0), 0);
  const employedTotal = profiles.reduce((sum, profile) => sum + Math.max(0, Number(profile.employed) || 0), 0);
  const unemploymentRate = laborForceTotal > 0 ? Math.max(0, Math.min(1, (laborForceTotal - employedTotal) / laborForceTotal)) : 0;
  const demandTotal = profiles.reduce((sum, profile) => sum + Math.max(0, Number(profile.consumerDemandGU) || 0), 0);
  const demandPerWorker = employedTotal > 0 ? demandTotal / employedTotal : 0;
  const wagesWeighted = weightedAverage(profiles.map((profile) => ({ value:Number(profile.medianWageGU) || 0, weight:Math.max(1, Number(profile.population) || 0) })));
  const householdStressAvg = average(households.map((household) => Number(household && household.financialStress) || 0));
  const householdIncomeAvg = average(households.map((household) => Number(household && household.monthlyIncomeGU) || 0));
  const householdExpensesAvg = average(households.map((household) => Number(household && household.monthlyExpensesGU) || 0));
  const wealthShareAvg = average(profiles.map((profile) => Number(profile.topOneWealthShare) || 0));
  const mobilityAvg = average(profiles.map((profile) => Number(profile.intergenerationalMobilityIndex) || 0));
  const giniAvg = average(profiles.map((profile) => Number(profile.giniCoefficient) || 0));
  const longUnemploymentAvg = average(profiles.map((profile) => Number(profile.longUnemploymentShare) || 0));
  const laborScarcityAvg = average(profiles.map((profile) => Number(profile.laborScarcity) || 0));
  const businessStageCounts = countBy(allBusinesses, (business) => String((business && business.stage) || 'unknown'));
  const bankruptcyStageCounts = countBy(allBusinesses, (business) => String((business && business.bankruptcyStage) || 'stable'));
  const marketCapTotal = listings.reduce((sum, listing) => sum + Math.max(0, (Number(listing.sharePriceGU) || 0) * Math.max(0, Number(listing.totalShares) || 0)), 0);
  const blocRates = (App.store.blocs || []).map((bloc) => Number(bloc && bloc.rate) || 0).filter((value) => value > 0);
  const fxDispersion = stddev(blocRates.map((value, _index, list) => {
    const mean = average(list);
    return mean > 0 ? value / mean : 0;
  }));
  const workingAgeAdults = livingPeople.filter((person) => person && person.age >= 22 && person.age <= 64 && !person.retired);
  const employedAdults = workingAgeAdults.filter((person) => person && (person.businessId || person.employerBusinessId));
  const entrepreneurCount = livingPeople.filter((person) => person && person.businessId).length;
  const listedBusinessCount = listings.length;
  const peopleNetWorths = livingPeople.map((person) => Math.max(0, Number(person && person.netWorthGU) || 0)).sort((first, second) => second - first);
  const topDecileCount = Math.max(1, Math.floor(peopleNetWorths.length * 0.1));
  const totalNetWorth = peopleNetWorths.reduce((sum, value) => sum + value, 0);
  const topDecileShare = totalNetWorth > 0 ? peopleNetWorths.slice(0, topDecileCount).reduce((sum, value) => sum + value, 0) / totalNetWorth : 0;

  const snapshot = {
    yearIndex,
    calendarYear:App.sim && typeof App.sim.getCurrentCalendarYear === 'function' ? App.sim.getCurrentCalendarYear() : yearIndex,
    simDay:Number(App.store.simDay) || 0,
    livingPeople:livingPeople.length,
    deceasedPeople:Math.max(0, people.length - livingPeople.length),
    children:livingPeople.filter((person) => person && person.age < 18).length,
    retirees:livingPeople.filter((person) => person && person.retired).length,
    workingAgeAdults:workingAgeAdults.length,
    employedAdults:employedAdults.length,
    entrepreneurCount,
    businessCount:allBusinesses.length,
    activeBusinessCount:activeBusinesses.length,
    defunctBusinessCount:allBusinesses.filter((business) => business && business.stage === 'defunct').length,
    listedBusinessCount,
    householdCount:households.length,
    laborForceTotal,
    employedTotal,
    unemploymentRate,
    demandTotal,
    demandPerWorker,
    weightedMedianWageGU:wagesWeighted,
    avgHouseholdStress:householdStressAvg,
    avgHouseholdIncomeGU:householdIncomeAvg,
    avgHouseholdExpensesGU:householdExpensesAvg,
    avgTopOneWealthShare:wealthShareAvg,
    avgIntergenerationalMobility:mobilityAvg,
    avgGini:giniAvg,
    avgLongUnemploymentShare:longUnemploymentAvg,
    avgLaborScarcity:laborScarcityAvg,
    marketCapTotal,
    fxDispersion,
    topDecileNetWorthShare:topDecileShare,
    businessStageCounts,
    bankruptcyStageCounts,
    yearlyLaunches:0,
    yearlyFirmDeaths:0,
    yearlyListings:0,
    yearlyPopulationChange:previousSnapshot ? livingPeople.length - previousSnapshot.livingPeople : 0,
    yearlyDemandChangePct:previousSnapshot && previousSnapshot.demandTotal > 0 ? (demandTotal - previousSnapshot.demandTotal) / previousSnapshot.demandTotal : 0,
    yearlyWageChangePct:previousSnapshot && previousSnapshot.weightedMedianWageGU > 0 ? (wagesWeighted - previousSnapshot.weightedMedianWageGU) / previousSnapshot.weightedMedianWageGU : 0,
    sample:{
      topBusinesses:activeBusinesses.slice().sort((first, second) => (Number(second && second.valuationGU) || 0) - (Number(first && first.valuationGU) || 0)).slice(0, 5).map((business) => ({
        id:business.id,
        name:business.name,
        stage:business.stage,
        valuationGU:Number(business.valuationGU) || 0,
        revenueGU:Number(business.revenueGU) || 0,
        employees:Number(business.employees) || 0
      })),
      stressedHouseholds:households.slice().sort((first, second) => (Number(second && second.financialStress) || 0) - (Number(first && first.financialStress) || 0)).slice(0, 5).map((household) => ({
        id:household.id,
        countryISO:household.countryISO,
        stress:Number(household.financialStress) || 0,
        incomeGU:Number(household.monthlyIncomeGU) || 0,
        expensesGU:Number(household.monthlyExpensesGU) || 0,
        debtGU:Number(household.debtGU) || 0
      })),
      wealthiestPeople:livingPeople.slice().sort((first, second) => (Number(second && second.netWorthGU) || 0) - (Number(first && first.netWorthGU) || 0)).slice(0, 5).map((person) => ({
        id:person.id,
        name:person.name,
        countryISO:person.countryISO,
        netWorthGU:Number(person.netWorthGU) || 0,
        publicEquityGU:getPortfolioExposureGU(App, person)
      }))
    },
    _activeBusinessIds:new Set(activeBusinesses.map((business) => business.id)),
    _listedIds:new Set(listings.map((listing) => listing.businessId))
  };

  if (previousSnapshot) {
    snapshot.yearlyLaunches = Array.from(snapshot._activeBusinessIds).filter((id) => !previousSnapshot._activeBusinessIds.has(id)).length;
    snapshot.yearlyFirmDeaths = Array.from(previousSnapshot._activeBusinessIds).filter((id) => !snapshot._activeBusinessIds.has(id)).length;
    snapshot.yearlyListings = Array.from(snapshot._listedIds).filter((id) => !previousSnapshot._listedIds.has(id)).length;
  }

  return snapshot;
}

function stripInternals(snapshot){
  const { _activeBusinessIds, _listedIds, ...clean } = snapshot;
  return clean;
}

function deriveFindings(checkpoints){
  const baseline = checkpoints[0];
  const final = checkpoints[checkpoints.length - 1];
  const findings = [];
  const launchAverage = average(checkpoints.slice(1).map((checkpoint) => checkpoint.yearlyLaunches));
  const deathAverage = average(checkpoints.slice(1).map((checkpoint) => checkpoint.yearlyFirmDeaths));

  if (final.activeBusinessCount < baseline.activeBusinessCount * 0.65) {
    findings.push({ severity:'high', area:'business', message:'Active firms contract materially over the horizon, indicating ecosystem attrition.' });
  }
  if (deathAverage > (launchAverage * 1.25)) {
    findings.push({ severity:'high', area:'business', message:'Firm deaths outpace launches over time, suggesting business renewal is too weak.' });
  }
  if (final.unemploymentRate > 0.18 || final.avgLongUnemploymentShare > 0.16) {
    findings.push({ severity:'high', area:'labour', message:'Labour re-entry degrades over time, with unemployment or long-term unemployment staying too elevated.' });
  }
  if (final.weightedMedianWageGU < baseline.weightedMedianWageGU * 0.82) {
    findings.push({ severity:'medium', area:'labour', message:'Median wage levels compress too far over the horizon.' });
  }
  if (final.avgTopOneWealthShare > 0.5 || final.topDecileNetWorthShare > 0.78) {
    findings.push({ severity:'medium', area:'finance', message:'Wealth concentration becomes too dominant over the long run.' });
  }
  if (final.fxDispersion < 0.015) {
    findings.push({ severity:'medium', area:'finance', message:'Bloc FX rates over-converge, reducing macro differentiation.' });
  }
  if (final.avgHouseholdStress > 70) {
    findings.push({ severity:'medium', area:'society', message:'Household stress trends too high by the end of the horizon.' });
  }
  if (!findings.length) {
    findings.push({ severity:'low', area:'overall', message:'No single hard-collapse pattern detected; use yearly drift metrics to tune smaller imbalances.' });
  }

  return findings;
}

function buildSummary(checkpoints){
  const baseline = checkpoints[0];
  const final = checkpoints[checkpoints.length - 1];
  return {
    baselineYear:baseline.calendarYear,
    finalYear:final.calendarYear,
    activeBusinessChangePct:baseline.activeBusinessCount > 0 ? (final.activeBusinessCount - baseline.activeBusinessCount) / baseline.activeBusinessCount : 0,
    unemploymentChangePctPoints:final.unemploymentRate - baseline.unemploymentRate,
    weightedMedianWageChangePct:baseline.weightedMedianWageGU > 0 ? (final.weightedMedianWageGU - baseline.weightedMedianWageGU) / baseline.weightedMedianWageGU : 0,
    householdStressChange:final.avgHouseholdStress - baseline.avgHouseholdStress,
    topOneWealthShareChange:final.avgTopOneWealthShare - baseline.avgTopOneWealthShare,
    topDecileNetWorthShareChange:final.topDecileNetWorthShare - baseline.topDecileNetWorthShare,
    fxDispersionChange:final.fxDispersion - baseline.fxDispersion,
    averageYearlyLaunches:average(checkpoints.slice(1).map((checkpoint) => checkpoint.yearlyLaunches)),
    averageYearlyFirmDeaths:average(checkpoints.slice(1).map((checkpoint) => checkpoint.yearlyFirmDeaths)),
    averageYearlyListings:average(checkpoints.slice(1).map((checkpoint) => checkpoint.yearlyListings))
  };
}

function tickYear(window){
  window.Nexus.sim.fastForwardDays(YEAR_DAYS, {
    render:false,
    includeRandom:true
  });
}

function buildReport(cleanCheckpoints, options){
  const settings = options && typeof options === 'object' ? options : {};

  return {
    generatedAt:new Date().toISOString(),
    source:'scripts/run-long-horizon.mjs',
    harness:'jsdom',
    status:settings.complete ? 'complete' : 'in-progress',
    complete:!!settings.complete,
    completedYears:Math.max(0, Number(settings.completedYears) || 0),
    seed:HORIZON_SEED,
    startPresetId:START_PRESET_ID,
    simDaysPerTick:SIM_DAYS_PER_TICK,
    yearDays:YEAR_DAYS,
    horizonYears:HORIZON_YEARS,
    summary:buildSummary(cleanCheckpoints),
    findings:deriveFindings(cleanCheckpoints),
    checkpoints:cleanCheckpoints
  };
}

async function writeProgressReport(checkpoints, options){
  const cleanCheckpoints = checkpoints.map(stripInternals);
  const report = buildReport(cleanCheckpoints, options);

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return report;
}

async function main(){
  const repoRoot = process.cwd();
  const dom = await bootHeadlessWindow(repoRoot);

  try {
    const checkpoints = [];
    let previous = null;
    let report;

    checkpoints.push(collectSnapshot(dom.window, 0, null));
    previous = checkpoints[0];
    report = await writeProgressReport(checkpoints, {
      complete:false,
      completedYears:0
    });

    for (let year = 1; year <= HORIZON_YEARS; year += 1) {
      tickYear(dom.window);
      previous = collectSnapshot(dom.window, year, previous);
      checkpoints.push(previous);
      if ((year % PROGRESS_INTERVAL_YEARS) === 0 || year === HORIZON_YEARS) {
        console.log(
          `[horizon] year ${year}/${HORIZON_YEARS} ` +
          `active firms ${previous.activeBusinessCount} ` +
          `unemployment ${(previous.unemploymentRate * 100).toFixed(1)}% ` +
          `stress ${previous.avgHouseholdStress.toFixed(1)}`
        );
      }
      if ((year % WRITE_INTERVAL_YEARS) === 0 || year === HORIZON_YEARS) {
        report = await writeProgressReport(checkpoints, {
          complete:year === HORIZON_YEARS,
          completedYears:year
        });
        console.log(`[horizon] wrote ${report.status} report to ${OUTPUT_FILE} at year ${year}/${HORIZON_YEARS}`);
      }
    }
    console.log(`Long-horizon report written: ${OUTPUT_FILE}`);
    console.log(`Final year ${report.summary.finalYear}: active firms ${report.checkpoints[report.checkpoints.length - 1].activeBusinessCount}, unemployment ${(report.checkpoints[report.checkpoints.length - 1].unemploymentRate * 100).toFixed(1)}%, avg household stress ${report.checkpoints[report.checkpoints.length - 1].avgHouseholdStress.toFixed(1)}`);
  } finally {
    dom.window.close();
  }
}

main().then(() => {
  process.exit(process.exitCode || 0);
}).catch((error) => {
  console.error('Long-horizon run failed:', error && error.stack ? error.stack : error);
  process.exit(1);
});