(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createFinanceEngine = function createFinanceEngine(handlers){
    var api = handlers || {};

    return {
      runFinanceTick:function(){
        if (typeof api.enforceFinancialBounds === "function") {
          api.enforceFinancialBounds();
        }
      },
      runMarketTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.includeRandom !== false && typeof api.runDealRoll === "function") {
          api.runDealRoll();
        }
      },
      runMetricsTick:function(){
        if (typeof api.updateBlocGdp === "function") {
          api.updateBlocGdp();
        }
        if (typeof api.pushEconomicHistory === "function") {
          api.pushEconomicHistory();
        }
        if (typeof api.updateForex === "function") {
          api.updateForex();
        }
      }
    };
  };
})(window);