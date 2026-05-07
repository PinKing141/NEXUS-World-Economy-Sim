(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createDemographicsEngine = function createDemographicsEngine(handlers){
    var api = handlers || {};
    var missingRequiredHandlers = [];

    function requireHandler(name, fallback){
      if (typeof api[name] !== "function") {
        missingRequiredHandlers.push(name);
        return typeof fallback === "function" ? fallback : function(){};
      }
      return api[name];
    }

    var runYearlyLifecycle = requireHandler("runYearlyLifecycle", function(){});
    var maybeAddArrival = requireHandler("maybeAddArrival", function(){});

    if (missingRequiredHandlers.length) {
      throw new Error("Demographics engine missing required handlers: " + missingRequiredHandlers.join(", "));
    }

    return {
      runYearBoundary:function(previousYear, nextYear){
        if (nextYear > previousYear) {
          runYearlyLifecycle();
        }
      },
      runMigrationTick:function(){
        maybeAddArrival();
      }
    };
  };
})(window);