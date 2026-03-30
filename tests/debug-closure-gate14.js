const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();
const DEFAULT_TEST_SEED = 20260325;
const PRESET_ID = process.argv[2] || "1998";
const RUN_COUNT = Math.max(0, Number(process.argv[3]) || 0);
const OUTPUT_PATH = path.join(ROOT, "tests", "closure_test_notes", "debug-closure-gate14.json");

function normalizeLocalAssetPath(resource) {
  var relativePath = String(resource || "").trim();
  if (!relativePath) return null;
  relativePath = relativePath.replace(/^\/+/, "").replace(/^\.\//, "");
  return path.resolve(ROOT, relativePath);
}

function createLocalFetch() {
  return function fetchLocalAsset(resource) {
    const assetPath = normalizeLocalAssetPath(resource);

    return new Promise((resolve, reject) => {
      if (!assetPath) {
        reject(new Error("Unsupported fetch resource: " + resource));
        return;
      }

      fs.readFile(assetPath, "utf8", (error, content) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          ok: true,
          status: 200,
          text() {
            return Promise.resolve(content);
          },
          json() {
            return Promise.resolve(JSON.parse(content));
          }
        });
      });
    });
  };
}

function normalizeSeed(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return (numeric >>> 0) || DEFAULT_TEST_SEED;
  return DEFAULT_TEST_SEED;
}

function installDeterministicRandom(seed) {
  let state = normalizeSeed(seed);
  Math.random = function deterministicRandom() {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  Math.random.getState = function getDeterministicRandomState() {
    return state >>> 0;
  };
  Math.random.setState = function setDeterministicRandomState(nextState) {
    state = normalizeSeed(nextState);
  };
}

function installBrowserShims() {
  global.window = global;
  global.self = global;
  global.globalThis = global;
  global.navigator = { userAgent: "node" };
  global.document = {
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { return []; },
    getElementById() { return null; }
  };
  global.requestAnimationFrame = () => 0;
  global.cancelAnimationFrame = () => {};
  global.location = { hostname: "ci-node" };
  global.fetch = createLocalFetch();
  global.__NEXUS_HEADLESS = true;
}

function bootApp() {
  installBrowserShims();
  [
    "src/js/app/us-state-map-data.js",
    "src/js/app/name-data.js",
    "src/js/app/data.js",
    "src/js/app/utils.js",
    "src/js/app/state.js",
    "src/js/app/events.js",
    "src/js/app/persistence.js",
    "src/js/app/sim-core.js",
    "src/js/app/sim-business.js",
    "src/js/app/sim-labour.js",
    "src/js/app/sim-finance.js",
    "src/js/app/sim-demographics.js",
    "src/js/app/sim-society.js",
    "src/js/app/sim-geopolitics.js",
    "src/js/app/sim.js"
  ].forEach((rel) => {
    const code = fs.readFileSync(path.join(ROOT, rel), "utf8");
    vm.runInThisContext(code, { filename: rel });
  });
  return global.Nexus;
}

function gateList(result) {
  const tiers = (result && result.tiers) || {};
  return []
    .concat(Array.isArray(tiers.tier1) ? tiers.tier1 : [])
    .concat(Array.isArray(tiers.tier2) ? tiers.tier2 : [])
    .concat(Array.isArray(tiers.tier3) ? tiers.tier3 : [])
    .concat(Array.isArray(tiers.tier4) ? tiers.tier4 : []);
}

function gateMap(result) {
  return gateList(result).reduce((map, gate) => {
    if (gate && gate.id) {
      map[String(gate.id)] = gate;
    }
    return map;
  }, {});
}

function keyMetrics(result) {
  const metrics = result && result.interactionMap && result.interactionMap.keyMetrics;
  return {
    unemploymentRate: Number(metrics && metrics.unemploymentRate) || 0,
    tradeShockIndexAvg: Number(metrics && metrics.tradeShockIndexAvg) || 0,
    householdStressAvg: Number(metrics && metrics.householdStressAvg) || 0,
    demandTotal: Number(metrics && metrics.demandTotal) || 0,
    firmRevenueTotal: Number(metrics && metrics.firmRevenueTotal) || 0
  };
}

function summarizeRun(App, result, index) {
  const gates = gateMap(result);
  const gate14 = gates["1.4"] || null;
  const evidence = gate14 && gate14.evidence ? gate14.evidence : {};

  return {
    run: index,
    simDay: Number(App.store.simDay) || 0,
    ok: !!(result && result.ok),
    failedGateIds: gateList(result).filter((gate) => gate && !gate.pass).map((gate) => String(gate.id)),
    gate14: gate14 ? {
      pass: !!gate14.pass,
      evidence: {
        highDisciplineCount: Number(evidence.highDisciplineCount) || 0,
        lowDisciplineCount: Number(evidence.lowDisciplineCount) || 0,
        highDisciplineMedianSalary: Number(evidence.highDisciplineMedianSalary) || 0,
        lowDisciplineMedianSalary: Number(evidence.lowDisciplineMedianSalary) || 0,
        highDisciplineEmploymentRate: Number(evidence.highDisciplineEmploymentRate) || 0,
        lowDisciplineEmploymentRate: Number(evidence.lowDisciplineEmploymentRate) || 0,
        highDisciplineMedianNetWorth: Number(evidence.highDisciplineMedianNetWorth) || 0,
        lowDisciplineMedianNetWorth: Number(evidence.lowDisciplineMedianNetWorth) || 0,
        highDisciplineMedianUnemploymentDays: Number(evidence.highDisciplineMedianUnemploymentDays) || 0,
        lowDisciplineMedianUnemploymentDays: Number(evidence.lowDisciplineMedianUnemploymentDays) || 0,
        traitSignals: Number(evidence.traitSignals) || 0,
        lowSampleFallback: !!evidence.lowSampleFallback
      }
    } : null,
    referenceGates: {
      gate11Pass: !!(gates["1.1"] && gates["1.1"].pass),
      gate15Pass: !!(gates["1.5"] && gates["1.5"].pass),
      gate23Pass: !!(gates["2.3"] && gates["2.3"].pass)
    },
    keyMetrics: keyMetrics(result)
  };
}

async function main() {
  const App = bootApp();
  const testSeed = normalizeSeed(process.env.NEXUS_TEST_SEED);
  const daysPerYear = Number(App.data && App.data.CALENDAR && App.data.CALENDAR.daysPerYear) || 360;
  const runs = [];

  App.store.reset();
  await Promise.all([
    App.data.loadCountryData ? Promise.resolve(App.data.loadCountryData()) : Promise.resolve(null),
    App.data.loadWorldCitiesData ? Promise.resolve(App.data.loadWorldCitiesData()) : Promise.resolve(null)
  ]);
  App.sim.initSim({ startPresetId: PRESET_ID });

  for (let index = 0; index <= RUN_COUNT; index += 1) {
    if (index > 0) {
      App.sim.fastForwardDays(daysPerYear, { render: false, includeRandom: true });
    }
    runs.push(summarizeRun(App, App.sim.runClosureGateSuite(), index));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    seed: testSeed,
    presetId: PRESET_ID,
    runCount: RUN_COUNT,
    outputPath: OUTPUT_PATH,
    runs
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log("wrote " + OUTPUT_PATH);
  runs.forEach((run) => {
    const gate14 = run.gate14;
    console.log(
      "run " + run.run +
      " day " + run.simDay +
      " gate 1.4 " + (gate14 && gate14.pass ? "PASS" : "FAIL") +
      " high salary " + (gate14 ? gate14.evidence.highDisciplineMedianSalary : 0) +
      " low salary " + (gate14 ? gate14.evidence.lowDisciplineMedianSalary : 0) +
      " trait signals " + (gate14 ? gate14.evidence.traitSignals : 0)
    );
  });
}

installDeterministicRandom(normalizeSeed(process.env.NEXUS_TEST_SEED));

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});