const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = process.cwd();
const DEFAULT_TEST_SEED = 20260325;
const RUN_DAYS = 360 * 30;

function normalizeSeed(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return (numeric >>> 0) || DEFAULT_TEST_SEED;
  return DEFAULT_TEST_SEED;
}

function createStorageShim() {
  const backing = new Map();
  return {
    getItem(key) { return backing.has(String(key)) ? backing.get(String(key)) : null; },
    setItem(key, value) { backing.set(String(key), String(value)); },
    removeItem(key) { backing.delete(String(key)); },
    clear() { backing.clear(); }
  };
}

function createLocalFetch() {
  return function fetchLocalAsset(resource) {
    const relative = String(resource || '').trim().replace(/^\/+/, '').replace(/^\.\//, '');
    const assetPath = path.resolve(ROOT, relative);
    return fs.promises.readFile(assetPath, 'utf8').then((content) => ({
      ok: true,
      status: 200,
      text() { return Promise.resolve(content); },
      json() { return Promise.resolve(JSON.parse(content)); }
    }));
  };
}

function installBrowserShims() {
  global.window = global;
  global.self = global;
  global.globalThis = global;
  global.navigator = { userAgent: 'node' };
  global.document = { addEventListener() {}, removeEventListener() {}, querySelectorAll() { return []; }, getElementById() { return null; } };
  global.requestAnimationFrame = () => 0;
  global.cancelAnimationFrame = () => {};
  global.location = { hostname: 'ci-node' };
  global.fetch = createLocalFetch();
  global.localStorage = createStorageShim();
  global.__NEXUS_HEADLESS = true;
}

function bootApp() {
  installBrowserShims();
  [
    'src/js/app/us-state-map-data.js','src/js/app/name-data.js','src/js/app/data.js','src/js/app/utils.js','src/js/app/state.js','src/js/app/events.js','src/js/app/persistence.js','src/js/app/sim-core.js','src/js/app/sim-business.js','src/js/app/sim-labour.js','src/js/app/sim-finance.js','src/js/app/sim-demographics.js','src/js/app/sim-society.js','src/js/app/sim-geopolitics.js','src/js/app/sim.js'
  ].forEach((rel) => vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }));
  return global.Nexus;
}

function stableSerialize(value) {
  if (Array.isArray(value)) return '[' + value.map(stableSerialize).join(',') + ']';
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableSerialize(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function hash(value) {
  return crypto.createHash('sha256').update(stableSerialize(value)).digest('hex');
}

async function run(seed) {
  const App = bootApp();
  App.store.reset();
  await Promise.all([App.data.loadCountryData(), App.data.loadWorldCitiesData()]);
  App.sim.initSim({ startPresetId: '1998', seed });
  App.sim.fastForwardDays(RUN_DAYS, { render: false, checkpoint: false, includeRandom: true });
  return {
    simDay: App.store.simDay,
    randomState: App.store.randomState,
    worldSeed: App.store.worldSeed,
    snapshotHash: hash(App.store.createSnapshot())
  };
}

(async function main() {
  const seed = normalizeSeed(process.env.NEXUS_TEST_SEED);
  const first = await run(seed);
  const second = await run(seed);

  assert.equal(first.simDay, RUN_DAYS, 'golden run should land exactly on year 30');
  assert.equal(first.worldSeed, seed, 'world seed must match requested seed');
  assert.equal(first.snapshotHash, second.snapshotHash, 'year-30 snapshot hash must be deterministic for same seed');
  assert.equal(first.randomState, second.randomState, 'random state must be deterministic for same seed');

  console.log('[golden-run-year30] seed=%s day=%d hash=%s', seed, first.simDay, first.snapshotHash);
})();
