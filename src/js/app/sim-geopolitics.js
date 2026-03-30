(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createGeopoliticsEngine = function createGeopoliticsEngine(handlers){
    var api = handlers || {};

    return {
      runEventTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.includeRandom !== false && typeof api.runRandomEventRoll === "function") {
          api.runRandomEventRoll();
        }
      },
      runGovernors:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.applyGovernors !== false && typeof api.runSimulationHealthGovernors === "function") {
          api.runSimulationHealthGovernors();
        }
      }
    };
  };
})(window);