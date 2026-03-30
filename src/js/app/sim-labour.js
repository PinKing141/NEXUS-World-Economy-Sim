(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createLabourEngine = function createLabourEngine(handlers){
    var api = handlers || {};

    return {
      runLabourTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.applyLaborMarketAdjustments && typeof api.applyLaborMarketYearlyAdjustments === "function") {
          api.applyLaborMarketYearlyAdjustments();
        }
      },
      runPeopleTick:function(){
        if (typeof api.syncPeople === "function") {
          api.syncPeople();
        }
      }
    };
  };
})(window);