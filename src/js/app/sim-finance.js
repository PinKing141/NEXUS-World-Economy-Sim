(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createFinanceEngine = function createFinanceEngine(handlers){
    var api = handlers || {};
    var missingRequiredHandlers = [];

    function requireHandler(name, fallback){
      if (typeof api[name] !== "function") {
        missingRequiredHandlers.push(name);
        return typeof fallback === "function" ? fallback : function(){};
      }
      return api[name];
    }

    var enforceFinancialBounds = requireHandler("enforceFinancialBounds", function(){});
    var runDealRoll = requireHandler("runDealRoll", function(){});
    var updateBlocGdp = requireHandler("updateBlocGdp", function(){});
    var pushEconomicHistory = requireHandler("pushEconomicHistory", function(){});
    var updateForex = requireHandler("updateForex", function(){});

    if (missingRequiredHandlers.length) {
      throw new Error("Finance engine missing required handlers: " + missingRequiredHandlers.join(", "));
    }

    return {
      runFinanceTick:function(){
        enforceFinancialBounds();
      },
      runMarketTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.includeRandom !== false) {
          runDealRoll();
        }
      },
      runMetricsTick:function(){
        updateBlocGdp();
        pushEconomicHistory();
        updateForex();
      }
    };
  };
})(window);