(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createSocietyEngine = function createSocietyEngine(handlers){
    var api = handlers || {};
    var missingRequiredHandlers = [];

    function requireHandler(name, fallback){
      if (typeof api[name] !== "function") {
        missingRequiredHandlers.push(name);
        return typeof fallback === "function" ? fallback : function(){};
      }
      return api[name];
    }

    var runSocietyRefresh = requireHandler("runSocietyRefresh", function(){});
    var runValidationRefresh = requireHandler("runValidationRefresh", function(){});

    if (missingRequiredHandlers.length) {
      throw new Error("Society engine missing required handlers: " + missingRequiredHandlers.join(", "));
    }

    return {
      runSocietyTick:function(){
        runSocietyRefresh();
      },
      runValidationTick:function(){
        runValidationRefresh();
      }
    };
  };
})(window);