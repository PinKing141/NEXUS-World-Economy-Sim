(function(global){
  var App = global.Nexus || (global.Nexus = {});

  function describeLoadResult(loadResult){
    if (!loadResult || !loadResult.ok || !loadResult.snapshot) return "";
    return "Loaded snapshot schema v" + loadResult.toVersion + " (" + App.utils.fmtDay(App.store.simDay) + ").";
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
    App.sim.initSim();
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

    Promise.resolve(App.data && App.data.loadCountryData ? App.data.loadCountryData() : null).then(function(){
      var loadResult = null;

      if (App.persistence && App.persistence.restoreLatest) {
        loadResult = App.persistence.restoreLatest();
      }

      if (loadResult && loadResult.ok) {
        if (App.sim.rehydrateLoadedState) {
          App.sim.rehydrateLoadedState();
        }
        emitNews("market", describeLoadResult(loadResult), {
          causes:["Snapshot restore succeeded."]
        });
        runSimulationStart();
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
