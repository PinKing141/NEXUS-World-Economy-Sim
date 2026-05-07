const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();
const DEFAULT_TEST_SEED = 20260325;

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
}

function createStorageShim() {
  const backing = new Map();

  return {
    getItem(key) {
      return backing.has(String(key)) ? backing.get(String(key)) : null;
    },
    setItem(key, value) {
      backing.set(String(key), String(value));
    },
    removeItem(key) {
      backing.delete(String(key));
    },
    clear() {
      backing.clear();
    }
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
  global.localStorage = createStorageShim();
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

function countRetaliationProfiles(profiles) {
  return profiles.filter(function(profile) {
    return (Number(profile && profile.retaliationPressureIndex) || 0) > 0.01
      || (Number(profile && profile.sectorTradeBlockIndex) || 0) > 0.01
      || (Number(profile && profile.rerouteCounterPressureIndex) || 0) > 0.01
      || (Number(profile && profile.sectorEmploymentDrag) || 0) > 0.01;
  }).length;
}

async function main() {
  const App = bootApp();

  installDeterministicRandom(normalizeSeed(process.env.NEXUS_TEST_SEED));
  App.store.reset();
  await Promise.all([
    App.data.loadCountryData ? Promise.resolve(App.data.loadCountryData()) : Promise.resolve(null),
    App.data.loadWorldCitiesData ? Promise.resolve(App.data.loadWorldCitiesData()) : Promise.resolve(null)
  ]);

  App.sim.initSim({ startPresetId: "1998" });
  App.sim.fastForwardDays(360 * 8, { render: false, checkpoint: false, includeRandom: false });

  const blocs = (App.store.blocs || []).filter(Boolean);
  assert.ok(blocs.length >= 2, "Tier 6 slice2 test requires at least two blocs");

  const sourceBloc = blocs[0];
  const targetBloc = blocs[1];

  blocs.forEach(function(bloc) {
    bloc.geoPressure = 0.05;
    bloc.defaultRisk = 0.04;
    bloc.topOneWealthShare = 0.28;
  });

  App.store.tier6SanctionLanes = {};
  App.store.simDay = Math.max(0, (Number(App.store.simDay) || 0) - 1);
  App.sim.fastForwardDays(1, { render: false, checkpoint: false, includeRandom: false });

  const retaliationBefore = Object.values(App.store.tier6SanctionLanes || {}).filter(function(lane) {
    return !!(lane && lane.retaliationActive);
  });
  assert.equal(retaliationBefore.length, 0, "Slice 2 retaliation must not activate without an existing sanction lane or escalation state");

  App.store.tier6SanctionLanes = {};
  App.store.tier6SanctionLanes[sourceBloc.id + "->" + targetBloc.id] = {
    sourceBlocId: sourceBloc.id,
    targetBlocId: targetBloc.id,
    sanctionPressure: 0.36,
    tradeBlockIndex: 0.48,
    financeBlockIndex: 0.22,
    dealBlockIndex: 0.18,
    rerouteProgressIndex: 0.1,
    retaliationPressureIndex: 0,
    retaliationTradeBlockIndex: 0,
    rerouteCounterPressureIndex: 0,
    sectorEmploymentDrag: 0,
    sectorRetaliationWeights: {},
    retaliationSourceLaneKey: null,
    lastRetaliationYear: -1,
    retaliationCooldownUntilYear: -1,
    active: true,
    retaliationActive: false,
    lastUpdatedYear: -1,
    lastNewsYear: -1
  };

  targetBloc.geoPressure = 0.8;
  targetBloc.defaultRisk = 0.22;
  App.store.simDay = Math.max(0, (Number(App.store.simDay) || 0) - 1);
  App.sim.fastForwardDays(1, { render: false, checkpoint: false, includeRandom: false });

  const reverseLaneKey = targetBloc.id + "->" + sourceBloc.id;
  const retaliationLane = App.store.tier6SanctionLanes[reverseLaneKey];
  const profiles = Object.values(App.store.countryProfiles || {}).filter(Boolean);
  const retaliationProfiles = countRetaliationProfiles(profiles);

  assert.ok(retaliationLane, "Slice 2 retaliation should materialize on the reverse bilateral lane");
  assert.ok(retaliationLane.retaliationActive, "Slice 2 retaliation should activate from an existing sanction lane");
  assert.ok((Number(retaliationLane.retaliationTradeBlockIndex) || 0) > 0.01, "Slice 2 retaliation should produce a sector-weighted trade block signal");
  assert.ok(Object.keys(retaliationLane.sectorRetaliationWeights || {}).length > 0, "Slice 2 retaliation should record sector weights on the lane");
  assert.ok(retaliationProfiles > 0, "Slice 2 retaliation should propagate retaliation evidence into country profiles");

  const snapshot = App.persistence.exportSnapshot();

  App.store.reset();
  const importResult = App.persistence.importSnapshot(snapshot);
  assert.equal(!!(importResult && importResult.ok), true, "Slice 2 retaliation snapshot import must succeed");

  const importedLane = App.store.tier6SanctionLanes[reverseLaneKey];
  const importedProfiles = Object.values(App.store.countryProfiles || {}).filter(Boolean);
  const importedRetaliationProfiles = countRetaliationProfiles(importedProfiles);

  assert.ok(importedLane && importedLane.retaliationActive, "Slice 2 retaliation lane state must survive snapshot round-trip");
  assert.ok((Number(importedLane.retaliationPressureIndex) || 0) > 0.01, "Slice 2 retaliation pressure must survive snapshot round-trip");
  assert.ok(Object.keys(importedLane.sectorRetaliationWeights || {}).length > 0, "Slice 2 retaliation sector weights must survive snapshot round-trip");
  assert.ok(importedRetaliationProfiles > 0, "Slice 2 retaliation profile evidence must survive snapshot round-trip");

  console.log("tier6 slice2 retaliation lane:", reverseLaneKey);
  console.log("tier6 slice2 retaliation trade block:", Number(importedLane.retaliationTradeBlockIndex || 0).toFixed(4));
  console.log("tier6 slice2 retaliation profiles:", importedRetaliationProfiles);
  console.log("tier6 snapshot schema:", snapshot.schemaVersion);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});