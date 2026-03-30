(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createSocietyEngine = function createSocietyEngine(handlers){
    var api = handlers || {};

    return {
      runSocietyTick:function(){
        if (typeof api.runSocietyRefresh === "function") {
          api.runSocietyRefresh();
        }
      },
      runValidationTick:function(){
        if (typeof api.runValidationRefresh === "function") {
          api.runValidationRefresh();
        }
      }
    };
  };
})(window);