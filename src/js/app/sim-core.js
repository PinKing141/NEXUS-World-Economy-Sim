(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simCore = App.simCore || {};

  var MAIN_TICK_PHASES = [
    { id:"business", domain:"business", method:"runBusinessTick", note:"Firms read existing demand, finance, and labour conditions before households react." },
    { id:"labour", domain:"labour", method:"runLabourTick", args:function(){ return { applyLaborMarketAdjustments:false }; }, note:"Labour demand and wages absorb firm decisions without validation-only interventions." },
    { id:"finance", domain:"finance", method:"runFinanceTick", note:"Credit, liquidity, and balance-sheet pressure settle after business/labour movement." },
    { id:"demographics", domain:"demographics", method:"runYearBoundary", args:function(context){ return [context.previousYear, context.currentYear()]; }, note:"Aging and yearly demographic transitions run after the simulated date advances." },
    { id:"geopolitics", domain:"geopolitics", method:"runEventTick", args:function(context){ return { includeRandom:context.settings.includeRandom !== false }; }, note:"Autonomous world events read current material pressures; no player control is introduced." },
    { id:"finance-markets", domain:"finance", method:"runMarketTick", args:function(context){ return { includeRandom:context.settings.includeRandom !== false }; }, note:"Markets reprice after geopolitical shocks and macro finance updates." },
    { id:"demographics-migration", domain:"demographics", method:"runMigrationTick", note:"Migration reacts to updated country, labour, price, and geopolitics pressure." },
    { id:"business-organization", domain:"business", method:"runOrganizationTick", note:"Leadership, succession, and organization state settle after market and migration pressure." },
    { id:"labour-people", domain:"labour", method:"runPeopleTick", note:"People and households absorb firm, wage, migration, and organization outcomes." },
    { id:"society", domain:"society", method:"runSocietyTick", note:"Inequality, institutions, and social pressure update from household and country evidence." },
    { id:"finance-metrics", domain:"finance", method:"runMetricsTick", note:"Published indicators roll up after all real-economy changes for the tick." },
    { id:"geopolitics-governors", domain:"geopolitics", method:"runGovernors", args:function(context){ return { applyGovernors:context.settings.applyGovernors !== false }; }, note:"Health governors apply final bounded corrections without changing the causal order." }
  ];

  var VALIDATION_TICK_PHASES = [
    { id:"business", domain:"business", method:"runBusinessTick", note:"Validation ticks preserve the production opening business phase." },
    { id:"labour", domain:"labour", method:"runLabourTick", args:function(context){ return { applyLaborMarketAdjustments:!!context.settings.applyLaborMarketAdjustments }; }, note:"Harnesses may opt into labour adjustments explicitly for constraint checks." },
    { id:"finance", domain:"finance", method:"runFinanceTick", note:"Finance pressure settles before demographic boundaries." },
    { id:"demographics", domain:"demographics", method:"runYearBoundary", args:function(context){ return [context.previousYear, context.currentYear()]; }, note:"Year-boundary demographics remain aligned with production ticks." },
    { id:"business-organization", domain:"business", method:"runOrganizationTick", note:"Organization state is validated without random event or market phases." },
    { id:"labour-people", domain:"labour", method:"runPeopleTick", note:"People and household state update after organization changes." },
    { id:"society", domain:"society", method:"runValidationTick", note:"Society validation uses deterministic repair/constraint paths only." },
    { id:"finance-metrics", domain:"finance", method:"runMetricsTick", note:"Metrics roll up validation outcomes." },
    { id:"geopolitics-governors", domain:"geopolitics", method:"runGovernors", args:function(context){ return { applyGovernors:context.settings.applyGovernors !== false }; }, note:"Governors close validation ticks with bounded stability checks." }
  ];

  function phaseIds(phases){
    return phases.map(function(phase){ return phase.id; });
  }

  function describePhases(phases){
    return phases.map(function(phase, index){
      return {
        order:index + 1,
        id:phase.id,
        domain:phase.domain,
        method:phase.method,
        note:phase.note
      };
    });
  }

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

    function resolvePhaseArgs(phase, context){
      var args = typeof phase.args === "function" ? phase.args(context) : undefined;

      if (Array.isArray(args)) return args;
      if (args !== undefined) return [args];
      return [];
    }

    function runPhase(phase, context){
      var domain = domains[phase.domain];
      var method = domain && domain[phase.method];

      if (typeof method === "function") {
        method.apply(domain, resolvePhaseArgs(phase, context));
      }
    }

    function runSequence(phases, settings){
      var context = {
        settings:settings,
        previousYear:currentYear(),
        currentYear:currentYear
      };

      advanceDay();
      phases.forEach(function(phase){
        runPhase(phase, context);
      });
    }

    function mainSequence(settings){
      runSequence(MAIN_TICK_PHASES, settings);
    }

    function validationSequence(settings){
      runSequence(VALIDATION_TICK_PHASES, settings);
    }

    return {
      getPhaseOrder:function(){
        return phaseIds(MAIN_TICK_PHASES);
      },
      getPhasePlan:function(){
        return describePhases(MAIN_TICK_PHASES);
      },
      getValidationPhaseOrder:function(){
        return phaseIds(VALIDATION_TICK_PHASES);
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