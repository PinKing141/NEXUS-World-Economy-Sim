(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createLabourEngine = function createLabourEngine(handlers){
    var api = handlers || {};
    var missingRequiredHandlers = [];

    function requireHandler(name, fallback){
      if (typeof api[name] !== "function") {
        missingRequiredHandlers.push(name);
        return typeof fallback === "function" ? fallback : function(){};
      }
      return api[name];
    }

    var applyLaborMarketYearlyAdjustments = requireHandler("applyLaborMarketYearlyAdjustments", function(){});
    var syncPeople = requireHandler("syncPeople", function(){});

    if (missingRequiredHandlers.length) {
      throw new Error("Labour engine missing required handlers: " + missingRequiredHandlers.join(", "));
    }

    return {
      runLabourTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.applyLaborMarketAdjustments) {
          applyLaborMarketYearlyAdjustments();
        }
      },
      runPeopleTick:function(){
        syncPeople();
      }
    };
  };
})(window);