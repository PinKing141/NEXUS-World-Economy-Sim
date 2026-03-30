const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();
const EXPECTED_DOMAINS = ["business", "labour", "finance", "demographics", "society", "geopolitics"];
const EXPECTED_PHASES = [
  "business",
  "labour",
  "finance",
  "demographics",
  "geopolitics",
  "finance-markets",
  "demographics-migration",
  "business-organization",
  "labour-people",
  "society",
  "finance-metrics",
  "geopolitics-governors"
];

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

  assert.ok(App.sim && typeof App.sim.getEngineArchitecture === "function", "App.sim.getEngineArchitecture must exist");
  assert.ok(App.sim && typeof App.sim.runArchitectureSelfCheck === "function", "App.sim.runArchitectureSelfCheck must exist");

  const architecture = App.sim.getEngineArchitecture();
  const selfCheck = App.sim.runArchitectureSelfCheck();

  assert.equal(architecture.coordinator, "sim-core", "Coordinator contract must remain sim-core");
  assert.deepEqual(architecture.domains, EXPECTED_DOMAINS, "Domain list changed unexpectedly");
  assert.deepEqual(architecture.phases, EXPECTED_PHASES, "Phase order changed unexpectedly");
  assert.equal(selfCheck.ok, true, "Architecture self-check failed");
  assert.deepEqual(selfCheck.availableDomains, EXPECTED_DOMAINS.slice().sort(), "Available domain set is incomplete");
  assert.deepEqual(selfCheck.missingDomains, [], "No domains should be missing");
  assert.deepEqual(selfCheck.missingPhases, [], "No phases should be missing");
  assert.deepEqual(selfCheck.unexpectedPhases, [], "No unexpected phases should be present");
  assert.equal(selfCheck.phaseOrderMatchesExpected, true, "Phase order must match expected coordinator order");

  console.log("architecture coordinator:", architecture.coordinator);
  console.log("domains:", architecture.domains.join(", "));
  console.log("phases:", architecture.phases.join(" -> "));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});