const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();
const DEFAULT_TEST_SEED = 20260325;

function normalizeLocalAssetPath(resource) {
  let relativePath = String(resource || "").trim();
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

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return "[" + value.map(stableSerialize).join(",") + "]";
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map((key) => JSON.stringify(key) + ":" + stableSerialize(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

function hashSnapshotState(state) {
  return crypto.createHash("sha256").update(stableSerialize(state)).digest("hex");
}

function findFirstDifference(left, right, pathParts) {
  const currentPath = Array.isArray(pathParts) ? pathParts : [];

  if (left === right) {
    return null;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) {
      return currentPath.join(".") || "<root>";
    }
    if (left.length !== right.length) {
      return (currentPath.join(".") || "<root>") + ".length";
    }
    for (let index = 0; index < left.length; index += 1) {
      const difference = findFirstDifference(left[index], right[index], currentPath.concat(String(index)));
      if (difference) {
        return difference;
      }
    }
    return null;
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const keys = Array.from(new Set(Object.keys(left).concat(Object.keys(right)))).sort();
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(left, key) || !Object.prototype.hasOwnProperty.call(right, key)) {
        return currentPath.concat(key).join(".");
      }
      const difference = findFirstDifference(left[key], right[key], currentPath.concat(key));
      if (difference) {
        return difference;
      }
    }
    return null;
  }
  return currentPath.join(".") || "<root>";
}

function getValueAtPath(value, path) {
  if (!path || path === "<root>") {
    return value;
  }

  return String(path).split(".").reduce((current, key) => {
    if (current == null) {
      return undefined;
    }
    return current[key];
  }, value);
}

async function main() {
  const App = bootApp();
  const testSeed = normalizeSeed(process.env.NEXUS_TEST_SEED);
  const branchDays = 360 * 2;
  const continuationDays = 360;

  installDeterministicRandom(testSeed);
  App.store.reset();
  await Promise.all([
    App.data.loadCountryData ? Promise.resolve(App.data.loadCountryData()) : Promise.resolve(null),
    App.data.loadWorldCitiesData ? Promise.resolve(App.data.loadWorldCitiesData()) : Promise.resolve(null)
  ]);

  App.sim.initSim({ startPresetId: "1998", seed: testSeed });
  App.sim.fastForwardDays(branchDays, { render: false, checkpoint: false, includeRandom: true });

  App.store.governor = App.store.governor || {};
  App.store.governor.interventionLog = Array.isArray(App.store.governor.interventionLog)
    ? App.store.governor.interventionLog.slice()
    : [];
  App.store.governor.interventionLog.push({
    day: App.store.simDay,
    key: "replay_probe",
    text: "Determinism replay probe"
  });

  const branchSnapshot = App.persistence.exportSnapshot();
  const expectedRandomState = branchSnapshot.state.randomState;

  App.sim.fastForwardDays(continuationDays, { render: false, checkpoint: false, includeRandom: true });
  const uninterruptedSnapshot = App.persistence.exportSnapshot();
  const uninterruptedHash = hashSnapshotState(uninterruptedSnapshot.state);

  const importResult = App.persistence.importSnapshot(branchSnapshot);
  assert.equal(!!(importResult && importResult.ok), true, "Determinism replay snapshot import must succeed");
  App.sim.rehydrateLoadedState();
  const restoredSnapshot = App.persistence.exportSnapshot();
  const restoredHash = hashSnapshotState(restoredSnapshot.state);
  const branchHash = hashSnapshotState(branchSnapshot.state);
  const restoredStateDiff = restoredHash === branchHash ? null : findFirstDifference(restoredSnapshot.state, branchSnapshot.state);
  const restoredExpectedValue = restoredStateDiff ? getValueAtPath(branchSnapshot.state, restoredStateDiff) : undefined;
  const restoredActualValue = restoredStateDiff ? getValueAtPath(restoredSnapshot.state, restoredStateDiff) : undefined;

  assert.equal(App.store.worldSeed, branchSnapshot.state.worldSeed, "Replay resume must restore the saved world seed");
  assert.equal(App.store.randomState, expectedRandomState, "Replay resume must restore the saved RNG state exactly");

  App.sim.fastForwardDays(continuationDays, { render: false, checkpoint: false, includeRandom: true });
  const resumedSnapshot = App.persistence.exportSnapshot();
  const resumedHash = hashSnapshotState(resumedSnapshot.state);
  const finalDiff = findFirstDifference(resumedSnapshot.state, uninterruptedSnapshot.state);
  const finalExpectedValue = finalDiff ? getValueAtPath(uninterruptedSnapshot.state, finalDiff) : undefined;
  const finalActualValue = finalDiff ? getValueAtPath(resumedSnapshot.state, finalDiff) : undefined;

  assert.equal(
    resumedHash,
    uninterruptedHash,
    "Save/load replay must match the uninterrupted seeded trajectory; pre-continue diff=" + (restoredStateDiff || "none") +
      (restoredStateDiff ? " expected=" + JSON.stringify(restoredExpectedValue) + " actual=" + JSON.stringify(restoredActualValue) : "") +
      "; first final diff at " + finalDiff +
      (finalDiff ? " expected=" + JSON.stringify(finalExpectedValue) + " actual=" + JSON.stringify(finalActualValue) : "")
  );

  console.log("deterministic replay hash:", resumedHash);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});