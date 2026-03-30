(function(global){
  var App = global.Nexus || (global.Nexus = {});

  function isHeadlessRuntime(){
    return !!global.__NEXUS_HEADLESS;
  }

  function describeLoadResult(loadResult){
    if (!loadResult || !loadResult.ok || !loadResult.snapshot) return "";
    return "Loaded snapshot schema v" + loadResult.toVersion + " (" + App.utils.fmtDay(App.store.simDay) + ").";
  }

  function hasViableWorldState(){
    var blocCount = Array.isArray(App.store && App.store.blocs) ? App.store.blocs.length : 0;
    var peopleCount = Array.isArray(App.store && App.store.people) ? App.store.people.length : 0;
    var businessCount = Array.isArray(App.store && App.store.businesses) ? App.store.businesses.length : 0;
    var householdCount = Array.isArray(App.store && App.store.households) ? App.store.households.length : 0;
    var countryProfileCount = App.store && App.store.countryProfiles ? Object.keys(App.store.countryProfiles).length : 0;

    return blocCount > 0 && countryProfileCount > 0 && (peopleCount > 0 || businessCount > 0 || householdCount > 0);
  }

  function emitNews(type, text, meta){
    if (App.events && App.events.emit) {
      return App.events.emit(type, text, meta);
    }
    if (App.ui && App.ui.addNews) {
      return App.ui.addNews(type, text, meta);
    }
    return null;
  }

  function runMapInit(){
    if (isHeadlessRuntime()) {
      return Promise.resolve(null);
    }
    App.map.init().then(function(){
      App.ui.renderAll();
    }, function(error){
      console.error(error);
      emitNews("market", "Map initialization fell back. The simulation is still running, but the interactive world layer could not fully load.", {
        causes:["Interactive world layer load failure."]
      });
    });
  }

  function runSimulationStart(){
    App.ui.renderAll();
    App.sim.start();
    runMapInit();
  }

  function runFreshWorld(reason){
    var startPresetId = App.sim && typeof App.sim.consumePendingStartPreset === "function" ? App.sim.consumePendingStartPreset() : null;

    App.sim.initSim({ startPresetId:startPresetId });
    if (reason) {
      emitNews("market", reason, {
        causes:["Boot fallback path used."]
      });
    }
    runSimulationStart();
  }

  function boot(){
    App.store.reset();
    App.ui.initUI();

    Promise.all([
      Promise.resolve(App.data && App.data.loadCountryData ? App.data.loadCountryData() : null),
      Promise.resolve(App.data && App.data.loadWorldCitiesData ? App.data.loadWorldCitiesData() : null)
    ]).then(function(){
      var loadResult = null;
      var pendingStartPresetId = App.sim && typeof App.sim.getPendingStartPresetId === "function"
        ? App.sim.getPendingStartPresetId()
        : null;

      if (pendingStartPresetId) {
        if (App.persistence && typeof App.persistence.clearLatest === "function") {
          App.persistence.clearLatest();
        }
        runFreshWorld("Fresh world reset applied from the selected start preset.");
        return;
      }

      if (App.persistence && App.persistence.restoreLatest) {
        loadResult = App.persistence.restoreLatest();
      }

      if (loadResult && loadResult.ok) {
        if (App.sim && typeof App.sim.clearPendingStartPreset === "function") {
          App.sim.clearPendingStartPreset();
        }
        if (App.sim.rehydrateLoadedState) {
          App.sim.rehydrateLoadedState();
        }
        if (hasViableWorldState()) {
          emitNews("market", describeLoadResult(loadResult), {
            causes:["Snapshot restore succeeded."]
          });
          runSimulationStart();
        } else {
          console.warn("Snapshot restore produced an empty or invalid world; clearing latest snapshot and regenerating.");
          if (App.persistence && typeof App.persistence.clearLatest === "function") {
            App.persistence.clearLatest();
          }
          App.store.reset();
          App.ui.initUI();
          runFreshWorld("Stored snapshot was empty or invalid. A fresh world was generated automatically.");
        }
      } else {
        runFreshWorld();
        if (loadResult && loadResult.error) {
          console.warn("Snapshot restore failed:", loadResult.error);
        }
      }
    }).catch(function(error){
      console.error(error);
      try {
        runFreshWorld("Startup hit a recoverable error. A fresh world was generated with default baselines.");
      } catch (startupError) {
        console.error(startupError);
        emitNews("default", "Startup failed before simulation could begin. Open console for details and reload.", {
          causes:["Startup exception: " + (startupError && startupError.message ? startupError.message : "Unknown")]
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})(window);
