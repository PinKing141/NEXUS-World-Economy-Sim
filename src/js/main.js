(function(global){
  var App = global.Nexus || (global.Nexus = {});

  function boot(){
    App.store.reset();
    App.ui.initUI();
    App.sim.initSim();
    App.ui.renderAll();
    App.sim.start();

    App.map.init().then(function(){
      App.ui.renderAll();
    }, function(error){
      console.error(error);
      App.ui.addNews("market", "Map initialization fell back. The simulation is still running, but the interactive world layer could not fully load.");
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})(window);
