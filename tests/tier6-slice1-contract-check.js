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
  Math.random.getState = function getDeterministicRandomState() {
    return state >>> 0;
  };
  Math.random.setState = function setDeterministicRandomState(nextState) {
    state = normalizeSeed(nextState);
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

function countElectionSignalProfiles(profiles) {
  return profiles.filter(function(profile) {
    var evidence = profile && profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : null;
    if (!evidence) return false;
    return Math.abs(Number(evidence.electionTaxPolicyIndex) || 0) > 0.01
      || Math.abs(Number(evidence.electionTradePolicyIndex) || 0) > 0.01
      || Math.abs(Number(evidence.electionLaborPolicyIndex) || 0) > 0.01
      || Math.abs(Number(evidence.electionImmigrationPolicyIndex) || 0) > 0.01
      || Math.abs(Number(evidence.electionBusinessConfidenceIndex) || 0) > 0.01;
  }).length;
}

function countSanctionedProfiles(profiles) {
  return profiles.filter(function(profile) {
    return (Number(profile && profile.sanctionTradeBlockIndex) || 0) > 0.01
      || (Number(profile && profile.sanctionFinanceBlockIndex) || 0) > 0.01
      || (Number(profile && profile.sanctionDealBlockIndex) || 0) > 0.01;
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

  let profiles = Object.values(App.store.countryProfiles || {}).filter(Boolean);
  let electionEligibleCount = profiles.filter(function(profile) {
    return !!(profile && profile.policyEvidence && profile.policyEvidence.electionEligible);
  }).length;
  let electionTriggeredCount = profiles.filter(function(profile) {
    return !!(profile && profile.policyEvidence && profile.policyEvidence.electionTriggered);
  }).length;
  let electionSignalCount = countElectionSignalProfiles(profiles);

  assert.ok(electionEligibleCount > 0, "Tier 6 elections should mark at least one eligible country profile");
  assert.ok(electionTriggeredCount > 0, "Tier 6 elections should trigger in a bounded deterministic run");
  assert.ok(electionSignalCount > 0, "Tier 6 elections should produce visible policy channel signals");

  const blocs = (App.store.blocs || []).filter(Boolean);
  assert.ok(blocs.length >= 2, "Tier 6 sanctions test requires at least two blocs");

  App.store.simDay = Math.max(0, (Number(App.store.simDay) || 0) - 1);

  blocs.forEach(function(bloc, index) {
    if (!bloc) return;
    bloc.geoPressure = index === 0 ? 2.8 : 0.05;
    bloc.defaultRisk = index === 0 ? 1.35 : 0.05;
    bloc.topOneWealthShare = index === 0 ? 0.62 : 0.28;
  });

  App.sim.fastForwardDays(1, { render: false, checkpoint: false, includeRandom: false });

  profiles = Object.values(App.store.countryProfiles || {}).filter(Boolean);
  const activeSanctionLanes = Object.values(App.store.tier6SanctionLanes || {}).filter(function(lane) {
    return !!(lane && lane.active);
  });
  const sanctionedProfileCount = countSanctionedProfiles(profiles);
  const sanctionEvidenceCount = profiles.filter(function(profile) {
    var evidence = profile && profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : null;
    return !!(evidence && ((Number(evidence.sanctionTradeBlockIndex) || 0) > 0.01 || (Number(evidence.sanctionFinanceBlockIndex) || 0) > 0.01 || (Number(evidence.sanctionDealBlockIndex) || 0) > 0.01));
  }).length;
  const sanctionTargetedBlocCount = blocs.filter(function(bloc) {
    var evidence = bloc && bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : null;
    return !!(evidence && Number(evidence.sanctionOutgoingCount) > 0);
  }).length;

  assert.ok(activeSanctionLanes.length > 0, "Tier 6 sanctions should activate at least one lane under elevated geo pressure");
  assert.ok(sanctionedProfileCount > 0, "Tier 6 sanctions should propagate blockage signals into country profiles");
  assert.ok(sanctionEvidenceCount > 0, "Tier 6 sanctions should emit country-level explainability evidence");
  assert.ok(sanctionTargetedBlocCount > 0, "Tier 6 sanctions should emit bloc-level outgoing target evidence");

  const snapshot = App.persistence.exportSnapshot();
  const activeLaneCountBeforeImport = activeSanctionLanes.length;

  App.store.reset();
  const importResult = App.persistence.importSnapshot(snapshot);
  assert.equal(!!(importResult && importResult.ok), true, "Tier 6 slice snapshot import must succeed");

  const importedLaneCount = Object.values(App.store.tier6SanctionLanes || {}).filter(function(lane) {
    return !!(lane && lane.active);
  }).length;
  const importedSanctionedProfiles = countSanctionedProfiles(Object.values(App.store.countryProfiles || {}).filter(Boolean));

  assert.equal(importedLaneCount, activeLaneCountBeforeImport, "Tier 6 sanction lanes must survive snapshot round-trip");
  assert.ok(importedSanctionedProfiles > 0, "Tier 6 sanction profile state must survive snapshot round-trip");

  console.log("tier6 slice1 election triggered:", electionTriggeredCount);
  console.log("tier6 slice1 election signal profiles:", electionSignalCount);
  console.log("tier6 slice1 active sanction lanes:", activeSanctionLanes.length);
  console.log("tier6 slice1 sanctioned profiles:", sanctionedProfileCount);
  console.log("tier6 snapshot schema:", snapshot.schemaVersion);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});