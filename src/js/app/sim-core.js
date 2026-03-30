(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simCore = App.simCore || {};

  App.simCore.createCoordinator = function createCoordinator(dependencies){
    var domains = dependencies && dependencies.domains ? dependencies.domains : {};
    var config = dependencies && dependencies.config ? dependencies.config : {};

    function currentYear(){
      return typeof config.getCurrentYear === "function" ? config.getCurrentYear() : 0;
    }

    function advanceDay(){
      if (typeof config.advanceDay === "function") {
        config.advanceDay();
      }
    }

    function checkpoint(){
      if (typeof config.checkpoint === "function") {
        config.checkpoint();
      }
    }

    function render(){
      if (typeof config.render === "function") {
        config.render();
      }
    }

    function mainSequence(settings){
      var previousYear = currentYear();

      advanceDay();
      if (domains.business && typeof domains.business.runBusinessTick === "function") {
        domains.business.runBusinessTick();
      }
      if (domains.labour && typeof domains.labour.runLabourTick === "function") {
        domains.labour.runLabourTick({ applyLaborMarketAdjustments:false });
      }
      if (domains.finance && typeof domains.finance.runFinanceTick === "function") {
        domains.finance.runFinanceTick();
      }
      if (domains.demographics && typeof domains.demographics.runYearBoundary === "function") {
        domains.demographics.runYearBoundary(previousYear, currentYear());
      }
      if (domains.geopolitics && typeof domains.geopolitics.runEventTick === "function") {
        domains.geopolitics.runEventTick({ includeRandom:settings.includeRandom !== false });
      }
      if (domains.finance && typeof domains.finance.runMarketTick === "function") {
        domains.finance.runMarketTick({ includeRandom:settings.includeRandom !== false });
      }
      if (domains.demographics && typeof domains.demographics.runMigrationTick === "function") {
        domains.demographics.runMigrationTick();
      }
      if (domains.business && typeof domains.business.runOrganizationTick === "function") {
        domains.business.runOrganizationTick();
      }
      if (domains.labour && typeof domains.labour.runPeopleTick === "function") {
        domains.labour.runPeopleTick();
      }
      if (domains.society && typeof domains.society.runSocietyTick === "function") {
        domains.society.runSocietyTick();
      }
      if (domains.finance && typeof domains.finance.runMetricsTick === "function") {
        domains.finance.runMetricsTick();
      }
      if (domains.geopolitics && typeof domains.geopolitics.runGovernors === "function") {
        domains.geopolitics.runGovernors({ applyGovernors:settings.applyGovernors !== false });
      }
    }

    function validationSequence(settings){
      var previousYear = currentYear();

      advanceDay();
      if (domains.business && typeof domains.business.runBusinessTick === "function") {
        domains.business.runBusinessTick();
      }
      if (domains.labour && typeof domains.labour.runLabourTick === "function") {
        domains.labour.runLabourTick({ applyLaborMarketAdjustments:!!settings.applyLaborMarketAdjustments });
      }
      if (domains.finance && typeof domains.finance.runFinanceTick === "function") {
        domains.finance.runFinanceTick();
      }
      if (domains.demographics && typeof domains.demographics.runYearBoundary === "function") {
        domains.demographics.runYearBoundary(previousYear, currentYear());
      }
      if (domains.business && typeof domains.business.runOrganizationTick === "function") {
        domains.business.runOrganizationTick();
      }
      if (domains.labour && typeof domains.labour.runPeopleTick === "function") {
        domains.labour.runPeopleTick();
      }
      if (domains.society && typeof domains.society.runValidationTick === "function") {
        domains.society.runValidationTick();
      }
      if (domains.finance && typeof domains.finance.runMetricsTick === "function") {
        domains.finance.runMetricsTick();
      }
      if (domains.geopolitics && typeof domains.geopolitics.runGovernors === "function") {
        domains.geopolitics.runGovernors({ applyGovernors:settings.applyGovernors !== false });
      }
    }

    return {
      getPhaseOrder:function(){
        return [
          "business",
          "labour",
          "finance",
          "demographics",
          "geopolitics",
          "finance-markets",
          "demographics-migration",
          "business-organization",
          "labour-people",
          "society",
          "finance-metrics",
          "geopolitics-governors"
        ];
      },
      runMainTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        mainSequence(settings);
        if (settings.checkpoint !== false) {
          checkpoint();
        }
        if (settings.render !== false) {
          render();
        }
      },
      runValidationTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        validationSequence(settings);
      }
    };
  };
})(window);