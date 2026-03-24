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
      } else {
        App.sim.initSim();
        if (loadResult && loadResult.error) {
          console.warn("Snapshot restore failed:", loadResult.error);
        }
      }

      App.ui.renderAll();
      App.sim.start();

      App.map.init().then(function(){
        App.ui.renderAll();
      }, function(error){
        console.error(error);
        emitNews("market", "Map initialization fell back. The simulation is still running, but the interactive world layer could not fully load.", {
          causes:["Interactive world layer load failure."]
        });
      });
    }).catch(function(error){
      console.error(error);
      emitNews("market", "Country baseline data failed to load. Continuing with heuristic population defaults.", {
        causes:["Country baseline fetch failed."]
      });
      App.sim.initSim();
      App.ui.renderAll();
      App.sim.start();
      App.map.init().then(function(){
        App.ui.renderAll();
      }, function(mapError){
        console.error(mapError);
        emitNews("market", "Map initialization fell back. The simulation is still running, but the interactive world layer could not fully load.", {
          causes:["Interactive world layer load failure."]
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})(window);
