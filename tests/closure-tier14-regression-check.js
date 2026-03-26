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
  const random = createSeededRandom(seed);
  Math.random = function deterministicRandom() {
    return random();
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

function snapshot(result) {
  return {
    ok: !!(result && result.ok),
    loops: {
      growth: !!(result && result.feedbackLoops && result.feedbackLoops.growthLoopPass),
      recession: !!(result && result.feedbackLoops && result.feedbackLoops.recessionLoopPass),
      labour: !!(result && result.feedbackLoops && result.feedbackLoops.laborPressureLoopPass)
    },
    gates: gateList(result).map((gate) => ({ id: String(gate && gate.id || ""), pass: !!(gate && gate.pass) })).filter((gate) => gate.id),
    hardFailures: (Array.isArray(result && result.hardFailures) ? result.hardFailures : []).map((item) => ({
      code: String(item && item.code || ""),
      failed: !!(item && item.failed)
    })).filter((item) => item.code),
    keyMetrics: keyMetrics(result)
  };
}

function compareToBaseline(result, baselineSnapshot) {
  const messages = [];
  const gateById = {};
  const hardFailureByCode = {};
  const loops = (result && result.feedbackLoops) || {};
  const now = keyMetrics(result);
  const base = baselineSnapshot.keyMetrics;

  gateList(result).forEach((gate) => {
    if (!gate || !gate.id) return;
    gateById[String(gate.id)] = !!gate.pass;
  });

  (Array.isArray(result && result.hardFailures) ? result.hardFailures : []).forEach((item) => {
    if (!item || !item.code) return;
    hardFailureByCode[String(item.code)] = !!item.failed;
  });

  if (!!result.ok !== baselineSnapshot.ok) messages.push("system status changed");
  if (!!loops.growthLoopPass !== baselineSnapshot.loops.growth) messages.push("growth loop changed");
  if (!!loops.recessionLoopPass !== baselineSnapshot.loops.recession) messages.push("recession loop changed");
  if (!!loops.laborPressureLoopPass !== baselineSnapshot.loops.labour) messages.push("labour pressure loop changed");

  baselineSnapshot.gates.forEach((gate) => {
    if (gateById[gate.id] !== gate.pass) {
      messages.push(`gate ${gate.id} changed`);
    }
  });

  baselineSnapshot.hardFailures.forEach((item) => {
    if (hardFailureByCode[item.code] !== item.failed) {
      messages.push(`${item.code} changed`);
    }
  });

  if (Math.abs(now.unemploymentRate - base.unemploymentRate) > 0.012) messages.push("unemployment drift exceeded tolerance");
  if (Math.abs(now.tradeShockIndexAvg - base.tradeShockIndexAvg) > 0.1) messages.push("trade shock drift exceeded tolerance");
  if (Math.abs(now.householdStressAvg - base.householdStressAvg) > 25) messages.push("household stress drift exceeded tolerance");
  if (Math.abs(now.demandTotal - base.demandTotal) > Math.max(1, base.demandTotal * 0.12)) messages.push("demand drift exceeded tolerance");
  if (Math.abs(now.firmRevenueTotal - base.firmRevenueTotal) > Math.max(1, base.firmRevenueTotal * 0.14)) messages.push("firm revenue drift exceeded tolerance");

  return messages;
}

async function main() {
  const App = bootApp();
  const testSeed = normalizeSeed(process.env.NEXUS_TEST_SEED);
  const daysPerYear = Number(App.data && App.data.CALENDAR && App.data.CALENDAR.daysPerYear) || 360;
  const reportPath = path.join(ROOT, "tests/closure_test_notes/closure-latest-run.json");

  App.store.reset();
  await Promise.all([
    App.data.loadCountryData ? Promise.resolve(App.data.loadCountryData()) : Promise.resolve(null),
    App.data.loadWorldCitiesData ? Promise.resolve(App.data.loadWorldCitiesData()) : Promise.resolve(null)
  ]);
  App.sim.initSim();

  const baselineResult = App.sim.runClosureGateSuite();
  const baselineSnapshot = snapshot(baselineResult);
  const baselineFailed = gateList(baselineResult).filter((gate) => !gate.pass).map((gate) => gate.id);

  const sequential = [];
  for (let index = 1; index <= 3; index += 1) {
    App.sim.fastForwardDays(daysPerYear, { render: false, includeRandom: true });
    const result = App.sim.runClosureGateSuite();
    const failed = gateList(result).filter((gate) => !gate.pass).map((gate) => gate.id);
    const deltas = compareToBaseline(result, baselineSnapshot);
    sequential.push({
      run: index,
      day: Number(App.store.simDay) || 0,
      ok: !!result.ok,
      passed: Number(result && result.summary && result.summary.passed) || 0,
      failed: Number(result && result.summary && result.summary.failed) || 0,
      failedGateIds: failed,
      baselineDeltaCount: deltas.length,
      baselineDeltas: deltas.slice(0, 8)
    });
  }

  const report = {
    generatedAt: (new Date()).toISOString(),
    seed: testSeed,
    daysPerYear,
    baseline: {
      day: 0,
      ok: !!baselineResult.ok,
      passed: Number(baselineResult && baselineResult.summary && baselineResult.summary.passed) || 0,
      failed: Number(baselineResult && baselineResult.summary && baselineResult.summary.failed) || 0,
      failedGateIds: baselineFailed
    },
    sequential,
    pass: !!baselineResult.ok && sequential.every((item) => item.ok)
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log("wrote " + reportPath);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.pass ? 0 : 1);
}

installDeterministicRandom(normalizeSeed(process.env.NEXUS_TEST_SEED));

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
