const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();

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

async function main() {
  const App = bootApp();

  App.store.reset();
  await Promise.all([
    App.data.loadCountryData ? Promise.resolve(App.data.loadCountryData()) : Promise.resolve(null),
    App.data.loadWorldCitiesData ? Promise.resolve(App.data.loadWorldCitiesData()) : Promise.resolve(null)
  ]);

  App.sim.initSim();

  assert.ok(App._simCoordinator, "initSim should construct the simulation coordinator");
  assert.ok(App._simDomains && App._simDomains.business, "business domain should be constructed during initSim");
  assert.equal(typeof App._simDomains.business.processYearlyLaunches, "function", "business domain should expose yearly launch processing");

  const selfCheck = App.sim.runArchitectureSelfCheck();
  assert.equal(selfCheck.ok, true, "Domain construction self-check failed");

  console.log("domain coordinator constructed during initSim");
  console.log("domains:", selfCheck.availableDomains.join(", "));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});