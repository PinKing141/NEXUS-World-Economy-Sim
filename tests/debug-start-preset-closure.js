const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();
const TEST_SEED = 20260325;
const PRESET_ID = process.argv[2] || "1998";
const RUN_COUNT = Math.max(1, Number(process.argv[3]) || 1);

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

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function seededRandom() {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function installDeterministicRandom(seed) {
  let state = TEST_SEED;
  state = (Number.isFinite(Number(seed)) ? ((Number(seed) >>> 0) || TEST_SEED) : TEST_SEED);
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
    const numeric = Number(nextState);
    state = Number.isFinite(numeric) ? ((numeric >>> 0) || TEST_SEED) : TEST_SEED;
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

async function main() {
  installDeterministicRandom(TEST_SEED);
  const App = bootApp();

  App.store.reset();
  await Promise.all([
    App.data.loadCountryData ? Promise.resolve(App.data.loadCountryData()) : Promise.resolve(null),
    App.data.loadWorldCitiesData ? Promise.resolve(App.data.loadWorldCitiesData()) : Promise.resolve(null)
  ]);

  App.sim.initSim({ startPresetId: PRESET_ID });
  const storeAfterInit = {
    presetId: App.store.startPresetId,
    startYear: App.store.startYear,
    currentPreset: App.sim.getCurrentStartPreset ? App.sim.getCurrentStartPreset() : null
  };
  const snapshotAfterInit = App.persistence && App.persistence.exportSnapshot ? App.persistence.exportSnapshot() : null;
  const snapshotStateAfterInit = snapshotAfterInit && snapshotAfterInit.state ? {
    schemaVersion: snapshotAfterInit.schemaVersion,
    presetId: snapshotAfterInit.state.startPresetId,
    startYear: snapshotAfterInit.state.startYear
  } : null;
  const roundTripResult = App.persistence && App.persistence.importSnapshot ? App.persistence.importSnapshot(snapshotAfterInit) : null;
  const storeAfterRoundTrip = {
    presetId: App.store.startPresetId,
    startYear: App.store.startYear,
    importOk: !!(roundTripResult && roundTripResult.ok)
  };

  const runs = [];
  for (let index = 0; index <= RUN_COUNT; index += 1) {
    if (index > 0) {
      App.sim.fastForwardDays(360, { render: false, includeRandom: true });
    }

    const result = App.sim.runClosureGateSuite();
    const gates = gateMap(result);
    runs.push({
      run: index,
      day: Number(App.store.simDay) || 0,
      presetId: App.store.startPresetId,
      startYear: App.store.startYear,
      ok: !!result.ok,
      failedGateIds: gateList(result).filter((gate) => !gate.pass).map((gate) => gate.id),
      gates: {
        "1.1": gates["1.1"] || null,
        "1.2": gates["1.2"] || null,
        "1.3": gates["1.3"] || null,
        "1.4": gates["1.4"] || null,
        "1.5": gates["1.5"] || null
        ,"2.3": gates["2.3"] || null
      },
      keyMetrics: keyMetrics(result)
    });
  }

  console.log(JSON.stringify({ presetId: PRESET_ID, runCount: RUN_COUNT, storeAfterInit, snapshotStateAfterInit, storeAfterRoundTrip, runs }, null, 2));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
}).then(() => {
  process.exit(0);
});