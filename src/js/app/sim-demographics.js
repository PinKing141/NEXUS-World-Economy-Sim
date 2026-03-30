(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createDemographicsEngine = function createDemographicsEngine(handlers){
    var api = handlers || {};

    return {
      runYearBoundary:function(previousYear, nextYear){
        if (nextYear > previousYear && typeof api.runYearlyLifecycle === "function") {
          api.runYearlyLifecycle();
        }
      },
      runMigrationTick:function(){
        if (typeof api.maybeAddArrival === "function") {
          api.maybeAddArrival();
        }
      }
    };
  };
})(window);