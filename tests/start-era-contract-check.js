const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();
const REQUIRED_PRESET_IDS = ["1998", "2000", "2008", "2016", "2020", "present-day"];

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

async function main() {
  const App = bootApp();

  App.store.reset();
  await Promise.all([
    App.data.loadCountryData ? Promise.resolve(App.data.loadCountryData()) : Promise.resolve(null),
    App.data.loadWorldCitiesData ? Promise.resolve(App.data.loadWorldCitiesData()) : Promise.resolve(null)
  ]);

  assert.ok(App.sim && typeof App.sim.getStartPresetList === "function", "App.sim.getStartPresetList must exist");
  assert.ok(App.sim && typeof App.sim.getCurrentStartPreset === "function", "App.sim.getCurrentStartPreset must exist");
  assert.ok(App.sim && typeof App.sim.getDefaultStartPresetId === "function", "App.sim.getDefaultStartPresetId must exist");

  const presets = App.sim.getStartPresetList();
  const presetIds = presets.map(function(preset){ return preset.id; });
  const presentDayPreset = presets.find(function(preset){ return preset.id === "present-day"; });
  const deterministicPresentDayYear = Number(App.data && App.data.CALENDAR && App.data.CALENDAR.startYear) || 0;

  assert.equal(App.sim.getDefaultStartPresetId(), "1998", "Default start preset must remain 1998");
  assert.deepEqual(presetIds, REQUIRED_PRESET_IDS, "Start preset registry changed unexpectedly");
  assert.ok(presentDayPreset, "Present Day preset must exist");
  assert.equal(presentDayPreset.startYear, deterministicPresentDayYear, "Present Day preset must resolve from deterministic calendar state");
  assert.equal(App.sim.getStartPresetList().find(function(preset){ return preset.id === "present-day"; }).startYear, deterministicPresentDayYear, "Present Day preset must be stable across repeated reads");

  App.sim.initSim();
  assert.equal(App.store.startPresetId, "1998", "Fresh init must default to 1998");
  assert.equal(App.store.startYear, 1998, "Fresh init must default to year 1998");
  assert.equal(App.sim.getCurrentStartPreset().id, "1998", "Current preset after default init must be 1998");

  const defaultSnapshot = App.persistence.exportSnapshot();
  assert.equal(defaultSnapshot.schemaVersion, 12, "Snapshots must export at current schema");
  assert.equal(defaultSnapshot.state.startPresetId, "1998", "Snapshot must preserve start preset id");
  assert.equal(defaultSnapshot.state.startYear, 1998, "Snapshot must preserve start year");

  App.store.reset();
  App.sim.initSim({ startPresetId: "present-day" });
  assert.equal(App.store.startPresetId, "present-day", "Explicit init must honor requested preset");
  assert.equal(App.store.startYear, deterministicPresentDayYear, "Explicit init must honor deterministic Present Day year");

  const presentDaySnapshot = App.persistence.exportSnapshot();
  App.store.reset();
  const importResult = App.persistence.importSnapshot(presentDaySnapshot);
  assert.equal(!!(importResult && importResult.ok), true, "Current-schema snapshot import must succeed");
  assert.equal(App.store.startPresetId, "present-day", "Imported snapshot must preserve start preset id");
  assert.equal(App.store.startYear, deterministicPresentDayYear, "Imported snapshot must preserve start year");

  const migratedLegacySnapshot = {
    schemaVersion: 11,
    savedAtISO: new Date("2026-03-27T00:00:00.000Z").toISOString(),
    businessNamingMode: "legacy",
    state: Object.assign({}, presentDaySnapshot.state, {
      startPresetId: null,
      startYear: 1998
    })
  };

  App.store.reset();
  const migratedImportResult = App.persistence.importSnapshot(migratedLegacySnapshot);
  assert.equal(!!(migratedImportResult && migratedImportResult.ok), true, "Legacy snapshot migration must succeed");
  assert.equal(App.store.startPresetId, "1998", "Legacy snapshots with a 1998 start year must normalize to the 1998 preset");
  assert.equal(App.store.startYear, 1998, "Legacy snapshot migration must preserve start year meaning");

  assert.equal(App.sim.queuePendingStartPreset("2020"), true, "Pending preset queue should succeed when storage is available");
  assert.equal(App.sim.getPendingStartPresetId(), "2020", "Queued preset should be readable before consumption");
  assert.equal(App.sim.consumePendingStartPreset(), "2020", "Queued preset should survive round-trip through pending storage");
  assert.equal(App.sim.getPendingStartPresetId(), null, "Pending preset should clear after consumption");

  console.log("default preset:", App.sim.getDefaultStartPresetId());
  console.log("preset ids:", presetIds.join(", "));
  console.log("present-day year:", deterministicPresentDayYear);
  console.log("snapshot schema:", defaultSnapshot.schemaVersion);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});