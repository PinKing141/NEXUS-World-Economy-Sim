(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createBusinessEngine = function createBusinessEngine(handlers){
    var api = handlers || {};
    var decisionRoleWeights = api.decisionRoleWeights || {};
    var bankruptcyStageOrder = api.bankruptcyStageOrder || [];
    var ensureDecisionData = typeof api.ensureDecisionData === "function" ? api.ensureDecisionData : function(){};
    var ensureBusinessLogo = typeof api.ensureBusinessLogo === "function" ? api.ensureBusinessLogo : function(){};
    var clampScore = typeof api.clampScore === "function" ? api.clampScore : function(value){
      return App.utils.clamp(Number(value) || 0, 0, 100);
    };
    var getIndustryTradeExposure = typeof api.getIndustryTradeExposure === "function" ? api.getIndustryTradeExposure : function(){
      return 0.5;
    };
    var getBusinessAgeYears = typeof api.getBusinessAgeYears === "function" ? api.getBusinessAgeYears : function(){
      return 0;
    };
    var getBusinessListing = typeof api.getBusinessListing === "function" ? api.getBusinessListing : function(){
      return null;
    };
    var setTraitSnapshot = typeof api.setTraitSnapshot === "function" ? api.setTraitSnapshot : function(){};
    var settleTemporaryStates = typeof api.settleTemporaryStates === "function" ? api.settleTemporaryStates : function(){};
    var randomId = typeof api.randomId === "function" ? api.randomId : function(){
      return "business-event";
    };
    var ensureCountryProfile = typeof api.ensureCountryProfile === "function" ? api.ensureCountryProfile : function(){
      return null;
    };
    var getRevenueTrend = typeof api.getRevenueTrend === "function" ? api.getRevenueTrend : function(){
      return 0;
    };
    var getProfitMargin = typeof api.getProfitMargin === "function" ? api.getProfitMargin : function(){
      return 0;
    };
    var getCashCoverageMonths = typeof api.getCashCoverageMonths === "function" ? api.getCashCoverageMonths : function(){
      return 0;
    };
    var getCountryLaborScarcity = typeof api.getCountryLaborScarcity === "function" ? api.getCountryLaborScarcity : function(){
      return 0;
    };
    var getCountryLongUnemploymentShare = typeof api.getCountryLongUnemploymentShare === "function" ? api.getCountryLongUnemploymentShare : function(){
      return 0;
    };
    var getCountryWagePressure = typeof api.getCountryWagePressure === "function" ? api.getCountryWagePressure : function(){
      return 0;
    };
    var getCountryMedianWage = typeof api.getCountryMedianWage === "function" ? api.getCountryMedianWage : function(){
      return 12000;
    };
    var getIndustryProductivityMultiplier = typeof api.getIndustryProductivityMultiplier === "function" ? api.getIndustryProductivityMultiplier : function(){
      return 2.6;
    };
    var getIndustrySupplyDependencies = typeof api.getIndustrySupplyDependencies === "function" ? api.getIndustrySupplyDependencies : function(){
      return [];
    };
    var getIndustryBehaviorProfile = typeof api.getIndustryBehaviorProfile === "function" ? api.getIndustryBehaviorProfile : function(){
      return { leverageAppetite:0.5 };
    };
    var getIndustryRerouteAdaptability = typeof api.getIndustryRerouteAdaptability === "function" ? api.getIndustryRerouteAdaptability : function(){
      return 0.5;
    };
    var getBlocPolicyRate = typeof api.getBlocPolicyRate === "function" ? api.getBlocPolicyRate : function(){
      return 0.06;
    };
    var refreshCountryPolicyStance = typeof api.refreshCountryPolicyStance === "function" ? api.refreshCountryPolicyStance : function(){
      return "neutral";
    };
    var refreshBlocPolicyStance = typeof api.refreshBlocPolicyStance === "function" ? api.refreshBlocPolicyStance : function(){
      return "neutral";
    };
    var getCountryPolicyEffects = typeof api.getCountryPolicyEffects === "function" ? api.getCountryPolicyEffects : function(){
      return {};
    };
    var getBlocPolicyEffects = typeof api.getBlocPolicyEffects === "function" ? api.getBlocPolicyEffects : function(){
      return {};
    };
    var getCountrySanctionExposure = typeof api.getCountrySanctionExposure === "function" ? api.getCountrySanctionExposure : function(){
      return { financeBlockIndex:0, dealBlockIndex:0 };
    };
    var getTier6ElectionChannelEffects = typeof api.getTier6ElectionChannelEffects === "function" ? api.getTier6ElectionChannelEffects : function(){
      return { creditConfidenceBias:0 };
    };
    var emitNews = typeof api.emitNews === "function" ? api.emitNews : function(){};
    var liquidateBusiness = typeof api.liquidateBusiness === "function" ? api.liquidateBusiness : function(){};
    var adjustTemporaryStates = typeof api.adjustTemporaryStates === "function" ? api.adjustTemporaryStates : function(){};
    var adjustPersonalReputation = typeof api.adjustPersonalReputation === "function" ? api.adjustPersonalReputation : function(){};
    var syncPerson = typeof api.syncPerson === "function" ? api.syncPerson : function(){};
    var releaseLabor = typeof api.releaseLabor === "function" ? api.releaseLabor : function(){
      return 0;
    };
    var reserveLabor = typeof api.reserveLabor === "function" ? api.reserveLabor : function(){
      return 0;
    };
    var syncBusinessLeadership = typeof api.syncBusinessLeadership === "function" ? api.syncBusinessLeadership : function(){};
    var buildTraitEffectTags = typeof api.buildTraitEffectTags === "function" ? api.buildTraitEffectTags : function(){
      return [];
    };
    var yearDays = Math.max(1, Number(api.yearDays) || 360);
    var simDaysPerTick = Math.max(1, Number(api.simDaysPerTick) || 1);
    var getBusinessDemandCapacityGU = typeof api.getBusinessDemandCapacityGU === "function" ? api.getBusinessDemandCapacityGU : function(){
      return 1;
    };
    var getBusinessProductionCapacityGU = typeof api.getBusinessProductionCapacityGU === "function" ? api.getBusinessProductionCapacityGU : function(){
      return 1;
    };
    var getBusinessMarketAllocationSignal = typeof api.getBusinessMarketAllocationSignal === "function" ? api.getBusinessMarketAllocationSignal : function(){
      return {
        allocationRatio:1,
        priceIndex:1
      };
    };
    var getIndustryMarketScope = typeof api.getIndustryMarketScope === "function" ? api.getIndustryMarketScope : function(){
      return "regional";
    };
    var getOperatingCostRate = typeof api.getOperatingCostRate === "function" ? api.getOperatingCostRate : function(){
      return 0.42;
    };
    var getCountryIndustryDemandMultiplier = typeof api.getCountryIndustryDemandMultiplier === "function" ? api.getCountryIndustryDemandMultiplier : function(){
      return 1;
    };
    var getBlocIndustryDemandMultiplier = typeof api.getBlocIndustryDemandMultiplier === "function" ? api.getBlocIndustryDemandMultiplier : function(){
      return 1;
    };
    var getLeadershipPayrollAnnual = typeof api.getLeadershipPayrollAnnual === "function" ? api.getLeadershipPayrollAnnual : function(){
      return 0;
    };
    var getAnonymousPayrollAnnual = typeof api.getAnonymousPayrollAnnual === "function" ? api.getAnonymousPayrollAnnual : function(){
      return 0;
    };
    var ensureSkillData = typeof api.ensureSkillData === "function" ? api.ensureSkillData : function(){};
    var getPersonSkillAverage = typeof api.getPersonSkillAverage === "function" ? api.getPersonSkillAverage : function(){
      return 0;
    };
    var assignEmployment = typeof api.assignEmployment === "function" ? api.assignEmployment : function(){};
    var upgradeJobTier = typeof api.upgradeJobTier === "function" ? api.upgradeJobTier : function(){
      return false;
    };
    var clearEmployment = typeof api.clearEmployment === "function" ? api.clearEmployment : function(){};
    var getLeadershipPerformanceScore = typeof api.getLeadershipPerformanceScore === "function" ? api.getLeadershipPerformanceScore : function(){
      return 0;
    };
    var findBestPoachCandidate = typeof api.findBestPoachCandidate === "function" ? api.findBestPoachCandidate : function(){
      return null;
    };
    var leadershipCandidateScore = typeof api.leadershipCandidateScore === "function" ? api.leadershipCandidateScore : function(){
      return 0;
    };
    var relocatePersonToCountry = typeof api.relocatePersonToCountry === "function" ? api.relocatePersonToCountry : function(){};
    var normalizeText = typeof api.normalizeText === "function" ? api.normalizeText : function(value){
      return value;
    };
    var ensureWorkerLifecycleData = typeof api.ensureWorkerLifecycleData === "function" ? api.ensureWorkerLifecycleData : function(){};
    var hasEntrepreneurialTraits = typeof api.hasEntrepreneurialTraits === "function" ? api.hasEntrepreneurialTraits : function(){
      return false;
    };
    var getPersonFinancialStress = typeof api.getPersonFinancialStress === "function" ? api.getPersonFinancialStress : function(){
      return 0;
    };
    var buildBlocBusinessPresenceMeta = typeof api.buildBlocBusinessPresenceMeta === "function" ? api.buildBlocBusinessPresenceMeta : function(){
      return {};
    };
    var getBlocBusinessDiversificationMultiplier = typeof api.getBlocBusinessDiversificationMultiplier === "function" ? api.getBlocBusinessDiversificationMultiplier : function(){
      return 1;
    };
    var createBusiness = typeof api.createBusiness === "function" ? api.createBusiness : function(){
      return null;
    };
    var seedBusiness = typeof api.seedBusiness === "function" ? api.seedBusiness : function(){};
    var currentYear = typeof api.currentYear === "function" ? api.currentYear : function(){
      return 0;
    };
    var recordLaunchWindow = typeof api.recordLaunchWindow === "function" ? api.recordLaunchWindow : function(){};
    var ensureSocialNetworkData = typeof api.ensureSocialNetworkData === "function" ? api.ensureSocialNetworkData : function(){};
    var getSocialProximityScore = typeof api.getSocialProximityScore === "function" ? api.getSocialProximityScore : function(){
      return 0;
    };
    var countSharedTraits = typeof api.countSharedTraits === "function" ? api.countSharedTraits : function(){
      return 0;
    };
    var getHouseholdForPerson = typeof api.getHouseholdForPerson === "function" ? api.getHouseholdForPerson : function(){
      return null;
    };
    var getTraitChannelScore = typeof api.getTraitChannelScore === "function" ? api.getTraitChannelScore : function(){
      return 0;
    };
    var collectTraitEffects = typeof api.collectTraitEffects === "function" ? api.collectTraitEffects : function(){
      return [];
    };
    var clampTraitDelta = typeof api.clampTraitDelta === "function" ? api.clampTraitDelta : function(value, maxAbs){
      return App.utils.clamp(Number(value) || 0, -Math.abs(Number(maxAbs) || 0), Math.abs(Number(maxAbs) || 0));
    };
    var summarizeTraitEffects = typeof api.summarizeTraitEffects === "function" ? api.summarizeTraitEffects : function(effects){
      return (effects || []).slice();
    };
    var recordTraitEffects = typeof api.recordTraitEffects === "function" ? api.recordTraitEffects : function(){};
    var getTraitDecisionShift = typeof api.getTraitDecisionShift === "function" ? api.getTraitDecisionShift : function(){
      return 0;
    };

    function getRoleDecisionWeights(roleKey){
      return decisionRoleWeights[roleKey] || decisionRoleWeights.default || {
        expansion:1,
        staffing:1,
        cash:1,
        succession:1
      };
    }

    function roleDecisionInfluence(roleKey){
      var weights = getRoleDecisionWeights(roleKey);
      return (weights.expansion + weights.staffing + weights.cash + weights.succession) / 4;
    }

    function primeBusinessDecisionState(business){
      if (!business) return;
      business.reputation = clampScore(business.reputation != null ? business.reputation : App.utils.rand(45, 70));
      business.cashReservesGU = Math.max(0, business.cashReservesGU != null ? business.cashReservesGU : business.revenueGU * App.utils.rand(0.05, 0.18));
      business.decisionHistory = (business.decisionHistory || []).slice(0, 12);
    }

    function getBusinessStageFactor(stage){
      if (stage === "startup") return 0.84;
      if (stage === "growth") return 1.02;
      if (stage === "established") return 1.14;
      if (stage === "declining") return 0.78;
      return 1;
    }

    function getBusinessAnnualGrowthBands(business){
      if (business.stage === "startup") return { min:-0.12, max:0.42 };
      if (business.stage === "growth") return { min:-0.10, max:0.28 };
      if (business.stage === "declining") return { min:-0.24, max:0.10 };
      return { min:-0.12, max:0.18 };
    }

    function getBusinessRevenueFloorGU(business){
      var medianWage = getCountryMedianWage(business.countryISO);
      var employees = Math.max(1, Number(business.employees) || 1);
      var stageFactor = App.utils.clamp(getBusinessStageFactor(business.stage), 0.78, 1.14);
      var productivity = getIndustryProductivityMultiplier(business.industry);
      var payrollAnnual = Math.max(0, getLeadershipPayrollAnnual(business) + getAnonymousPayrollAnnual(business));
      var workforceFloor = employees * medianWage * productivity * App.utils.clamp((stageFactor * 0.18) + 0.08, 0.22, 0.34);
      var payrollFloorRate = business.stage === "startup" ? 0.72 : (business.stage === "declining" ? 0.66 : 0.78);
      var payrollFloor = payrollAnnual * payrollFloorRate;

      return Math.max(medianWage * 1.2, workforceFloor, payrollFloor);
    }

    function getBusinessRealizedRevenueCap(business){
      var medianWage = getCountryMedianWage(business.countryISO);
      var employees = Math.max(1, Number(business.employees) || 1);
      var distress = Math.max(0, Number(business.distressScore) || 0);
      var revenueFloor = getBusinessRevenueFloorGU(business);
      var perEmployeeCap;

      if (business.stage === "startup") {
        perEmployeeCap = Math.max(medianWage * 3.2, 90000);
      } else if (business.stage === "growth") {
        perEmployeeCap = Math.max(medianWage * 4.4, 145000);
      } else if (business.stage === "declining") {
        perEmployeeCap = Math.max(medianWage * 3.1, 95000);
      } else {
        perEmployeeCap = Math.max(medianWage * 5.6, 220000);
      }

      if (distress > 1.1) {
        perEmployeeCap *= App.utils.clamp(1 - ((distress - 1.1) * 0.14), 0.72, 1);
      }

      return Math.max(revenueFloor, employees * perEmployeeCap);
    }

    function getBusinessHeadcountRealityCap(business, leadershipFloor){
      var minimumHeadcount = Math.max(1, Number(leadershipFloor) || 1);
      var annualTarget = Math.max(1, Number(business.annualRevenueTargetGU) || Number(business.revenueGU) || 1);
      var realizedRevenue = Math.max(1, Number(business.revenueGU) || 1);
      var revenuePerWorkerBaseline = Math.max(
        12000,
        getCountryMedianWage(business.countryISO) *
          getIndustryProductivityMultiplier(business.industry) *
          App.utils.clamp(getBusinessStageFactor(business.stage) * 0.9, 0.82, 1.35)
      );
      var productivityWindow = Math.max(realizedRevenue, Math.min(annualTarget, realizedRevenue * (business.stage === "declining" ? 1.08 : 1.3)));
      var sustainedHeadcount = Math.max(minimumHeadcount, Math.round(productivityWindow / Math.max(12000, revenuePerWorkerBaseline * 0.82)));

      if (business.stage === "startup") {
        return Math.max(minimumHeadcount, Math.min(96, sustainedHeadcount + 4));
      }
      if (business.stage === "growth") {
        return Math.max(minimumHeadcount, Math.min(180, sustainedHeadcount + 8));
      }
      if (business.stage === "declining") {
        return Math.max(minimumHeadcount, Math.min(120, sustainedHeadcount + 5));
      }

      return 2000;
    }

    function computeBusinessAnnualRevenueTarget(business, decision, ownerBusinessTrait, ownerMobilityTrait){
      var medianWage = getCountryMedianWage(business.countryISO);
      var productivity = getIndustryProductivityMultiplier(business.industry);
      var stageFactor = getBusinessStageFactor(business.stage);
      var reputationFactor = 0.74 + ((business.reputation || 50) / 100) * 0.78;
      var decisionFactor = decision.stance === "aggressive" ? 1.12 : (decision.stance === "balanced" ? 1.03 : (decision.stance === "defensive" ? 0.96 : 0.86));
      var cashFactor = decision.cashPolicy === "reinvest" ? 1.05 : (decision.cashPolicy === "preserve" ? 0.96 : 1);
      var traitFactor = 1 + App.utils.clamp((ownerBusinessTrait / 72) + (ownerMobilityTrait / 115), -0.10, 0.14);
      var marketSignal = getBusinessMarketAllocationSignal(business);
      var workforceCapacity = Math.max(1, business.employees || 1) * medianWage * productivity * stageFactor * reputationFactor * traitFactor;
      var demandCapacity = Math.max(1, getBusinessDemandCapacityGU(business));
      var allocatedDemand = Math.max(0, Number(business.allocatedDemandGU) || 0);
      var marketScope = getIndustryMarketScope(business.industry);
      var marketShare = 0.00003 * Math.pow(Math.max(1, business.employees || 1), 0.8) * reputationFactor;
      var demandBound;
      var pricedWorkforceCapacity;
      var targetRevenue;
      var stageRevenueCap;

      if (marketScope === "local") marketShare *= 1.28;
      else if (marketScope === "global") marketShare *= 0.88;
      marketShare = App.utils.clamp(marketShare, 0.00002, 0.014);

      demandBound = Math.max(allocatedDemand, demandCapacity * marketShare) * App.utils.clamp((marketSignal.allocationRatio * 0.7) + (marketSignal.priceIndex * 0.3), 0.64, 1.55);
      pricedWorkforceCapacity = workforceCapacity * App.utils.clamp((marketSignal.priceIndex * 0.74) + (marketSignal.allocationRatio * 0.26), 0.72, 1.45);
      targetRevenue = Math.max(medianWage * 1.6, Math.min(pricedWorkforceCapacity * decisionFactor * cashFactor, Math.max(pricedWorkforceCapacity * 0.72, demandBound)));

      if (business.stage === "startup" || business.stage === "growth" || business.stage === "declining") {
        stageRevenueCap = getBusinessRealizedRevenueCap(business);
        targetRevenue = Math.min(targetRevenue, stageRevenueCap);
      }

      return targetRevenue;
    }

    function getStageExpansionBias(stage){
      if (stage === "startup") return 8;
      if (stage === "growth") return 4;
      if (stage === "declining") return -10;
      return 0;
    }

    function evaluateBusinessLifecycleStage(business, metrics){
      var settings = metrics && typeof metrics === "object" ? metrics : {};
      var nextStage = String(business && business.stage || "startup");
      var ageYears = Number(settings.ageYears) || 0;
      var profitGU = Number(settings.profitGU) || 0;
      var revenueGU = Math.max(1, Number(settings.revenueGU) || 1);
      var reputation = Number(settings.reputation) || 0;
      var cashCoverage = Number(settings.cashCoverage) || 0;
      var countryDemandGrowth = Number(settings.countryDemandGrowth) || 0;

      if (ageYears > 2 && nextStage === "startup") nextStage = "growth";
      if (ageYears > 8 && nextStage === "growth") nextStage = "established";
      if (profitGU < (-revenueGU * 0.08) && nextStage === "established") nextStage = "declining";
      if (reputation < 28 && nextStage !== "startup") nextStage = "declining";
      if (nextStage === "declining" && profitGU > (revenueGU * 0.05) && reputation > 50 && cashCoverage > 1.15 && countryDemandGrowth > -0.02) {
        nextStage = "growth";
      }

      return nextStage;
    }

    function getBusinessRecoverySignal(metrics){
      var settings = metrics && typeof metrics === "object" ? metrics : {};
      var countryDemandGrowth = Number(settings.countryDemandGrowth) || 0;
      var margin = Number(settings.margin) || 0;
      var cashCoverage = Number(settings.cashCoverage) || 0;

      return App.utils.clamp(
        Math.max(0, countryDemandGrowth) * 1.8 +
        Math.max(0, margin) * 2 +
        Math.max(0, cashCoverage - 1.1) * 0.18,
        0,
        1.2
      );
    }

    function getIndustrySupplyPressure(business){
      var dependencies = getIndustrySupplyDependencies(business && business.industry);
      var blocBusinesses;

      if (!business || !dependencies.length) return 0;
      blocBusinesses = App.store.businesses.filter(function(candidate){
        return !!(candidate && candidate.blocId === business.blocId);
      });
      if (!blocBusinesses.length) return 0;

      return dependencies.reduce(function(sum, dependency){
        var peers = blocBusinesses.filter(function(candidate){
          return candidate.industry === dependency;
        });
        var strain;

        if (!peers.length) return sum + 0.18;
        strain = peers.reduce(function(inner, peer){
          var margin = (Number(peer.revenueGU) || 0) > 0 ? ((Number(peer.profitGU) || 0) / Math.max(1, Number(peer.revenueGU) || 1)) : -0.2;
          var bankruptcyPenalty = peer.bankruptcyStage && peer.bankruptcyStage !== "stable" ? 0.12 : 0;
          return inner + App.utils.clamp((0.1 - margin) * 0.85 + bankruptcyPenalty, 0, 0.65);
        }, 0) / peers.length;

        return sum + strain;
      }, 0) / dependencies.length;
    }

    function getCrossBlocDependencyPressure(bloc, dependencies){
      var otherBlocs;

      if (!bloc || !dependencies || !dependencies.length) return 0;

      otherBlocs = (App.store.blocs || []).filter(function(candidate){
        return !!(candidate && candidate.id !== bloc.id);
      });
      if (!otherBlocs.length) return 0;

      return dependencies.reduce(function(sum, dependencyIndustry){
        var dependencyPressure = otherBlocs.reduce(function(inner, candidateBloc){
          var sectorPresence = App.store.businesses.some(function(candidateBusiness){
            return !!(candidateBusiness && candidateBusiness.blocId === candidateBloc.id && candidateBusiness.industry === dependencyIndustry);
          });
          if (!sectorPresence) return inner + 0.12;
          return inner + App.utils.clamp((Number(candidateBloc.geoPressure) || 0) * 0.09, 0, 0.45);
        }, 0) / otherBlocs.length;

        return sum + dependencyPressure;
      }, 0) / dependencies.length;
    }

    function computeTradeShockTransmission(business, bloc, behaviorProfile, supplyPressure){
      var dependencies = getIndustrySupplyDependencies(business && business.industry);
      var tradeExposure = getIndustryTradeExposure(business && business.industry);
      var rerouteAdaptability = getIndustryRerouteAdaptability(business && business.industry);
      var crossBlocDependencyPressure = getCrossBlocDependencyPressure(bloc, dependencies);
      var baseTradeShock;
      var rerouteCapacity;
      var rerouteRelief;
      var netShock;

      if (!business || !bloc) {
        return {
          grossShock:0,
          netShock:0,
          rerouteRelief:0,
          rerouteCapacity:0,
          costMultiplier:1
        };
      }

      baseTradeShock =
        App.utils.clamp((Number(bloc.geoPressure) || 0) * 0.13, 0, 0.58) +
        (App.utils.clamp(Number(supplyPressure) || 0, 0, 1.8) * 0.24) +
        crossBlocDependencyPressure;
      baseTradeShock *= App.utils.clamp(tradeExposure * (Number(behaviorProfile && behaviorProfile.supplySensitivity) || 1), 0.2, 1.35);
      baseTradeShock = App.utils.clamp(baseTradeShock, 0, 1.6);

      rerouteCapacity = App.utils.clamp(
        ((Number(business.tradeRerouteCapacity) || 0) * 0.8) +
        ((Number(business.managementQuality) || 50) / 100) * 0.14 +
        ((Number(business.innovationIndex) || 50) / 100) * 0.08,
        0,
        1.15
      );
      rerouteCapacity = App.utils.clamp(rerouteCapacity * (0.72 + (rerouteAdaptability * 0.6)), 0, 1.2);
      rerouteRelief = App.utils.clamp(Math.min(baseTradeShock * App.utils.clamp(0.22 + (rerouteCapacity * 0.38), 0.22, 0.62), 0.8), 0, 0.8);
      netShock = App.utils.clamp(baseTradeShock - rerouteRelief, 0, 1.6);

      business.tradeRerouteCapacity = App.utils.clamp(rerouteCapacity - (netShock * 0.09), 0, 1.2);
      business.tradeShockExposure = tradeExposure;

      return {
        grossShock:baseTradeShock,
        netShock:netShock,
        rerouteRelief:rerouteRelief,
        rerouteCapacity:rerouteCapacity,
        costMultiplier:1 + App.utils.clamp((netShock * 0.07) - (rerouteRelief * 0.018), 0, 0.16)
      };
    }

    function updateCountryTradeShockSignals(){
      var countryBusinessStats = {};

      (App.store.businesses || []).forEach(function(business){
        var iso;
        var stats;

        if (!business || !business.countryISO) return;
        iso = business.countryISO;
        if (!countryBusinessStats[iso]) {
          countryBusinessStats[iso] = { count:0, tradeShockSum:0, rerouteSum:0, supplyStressSum:0 };
        }
        stats = countryBusinessStats[iso];
        stats.count += 1;
        stats.tradeShockSum += App.utils.clamp(Number(business.tradeShockPressure) || 0, 0, 1.8);
        stats.rerouteSum += App.utils.clamp(Number(business.tradeRerouteRelief) || 0, 0, 1.2);
        stats.supplyStressSum += App.utils.clamp(Number(business.supplyStress) || 0, 0, 1.8);
      });

      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);
        var stats = countryBusinessStats[iso];
        var tradeShockIndex = stats && stats.count ? (stats.tradeShockSum / stats.count) : 0;
        var rerouteRelief = stats && stats.count ? (stats.rerouteSum / stats.count) : 0;
        var avgSupplyStress = stats && stats.count ? (stats.supplyStressSum / stats.count) : 0;

        if (!profile) return;

        profile.tradeShockIndex = App.utils.clamp(((Number(profile.tradeShockIndex) || 0) * 0.72) + (tradeShockIndex * 0.28), 0, 1.8);
        profile.tradeRerouteRelief = App.utils.clamp(((Number(profile.tradeRerouteRelief) || 0) * 0.68) + (rerouteRelief * 0.32), 0, 1.2);
        profile.avgSupplyStress = App.utils.clamp(((Number(profile.avgSupplyStress) || 0) * 0.7) + (avgSupplyStress * 0.3), 0, 1.8);
        profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
        profile.policyEvidence.tradeShockIndex = Number(profile.tradeShockIndex.toFixed(4));
        profile.policyEvidence.tradeRerouteRelief = Number(profile.tradeRerouteRelief.toFixed(4));
        profile.policyEvidence.avgSupplyStress = Number(profile.avgSupplyStress.toFixed(4));
      });
    }

    function processYearlyCorporateGovernance(){
      (App.store.businesses || []).forEach(function(business){
        var listing = getBusinessListing(business && business.id);
        var owner = App.store.getPerson(business && business.ownerId);
        var governance;
        var ageYears;
        var founderAlive;
        var outsideDrift;
        var profile;
        var institutionScore;
        var corruptionIndex;
        var friendliness;
        var volatility;
        var concentrationBias;
        var confidenceBias;

        if (!business) return;
        ensureBusinessDecisionState(business);
        governance = business.governance;
        profile = ensureCountryProfile(business.countryISO, business.blocId);
        institutionScore = App.utils.clamp(Number(profile && profile.institutionScore) || 0.55, 0.1, 1);
        corruptionIndex = App.utils.clamp(Number(profile && profile.developmentCorruptionIndex) || (1 - institutionScore), 0, 1);
        friendliness = App.utils.clamp(Number(profile && profile.developmentBusinessFriendlinessIndex) || institutionScore, 0, 1);
        volatility = App.utils.clamp((Number(profile && profile.institutionalInstabilityIndex) || 0.2) / 1.6, 0, 1);
        concentrationBias = App.utils.clamp((0.55 - friendliness) * 0.26 + (corruptionIndex * 0.2), -0.08, 0.22);
        confidenceBias = App.utils.clamp((friendliness - 0.5) * 0.12 + ((1 - corruptionIndex) - 0.5) * 0.08 - (volatility * 0.08), -0.08, 0.12);
        ageYears = getBusinessAgeYears(business);
        founderAlive = !!(App.store.getPerson(business.founderId) && App.store.getPerson(business.founderId).alive);

        outsideDrift = (listing ? App.utils.rand(0.01, 0.05) : App.utils.rand(0, 0.02)) + confidenceBias - concentrationBias;
        governance.outsideInvestorShare = App.utils.clamp((Number(governance.outsideInvestorShare) || 0) + outsideDrift, 0, 0.95);
        governance.familyControlShare = App.utils.clamp((Number(governance.familyControlShare) || 0.6) - outsideDrift * 0.72, 0.05, 1);
        governance.founderControl = App.utils.clamp((Number(governance.founderControl) || 0.9) - (ageYears * 0.0045) - (listing ? 0.02 : 0) - (founderAlive ? 0 : 0.05), 0.02, 1);
        governance.boardPressure = App.utils.clamp((Number(governance.outsideInvestorShare) || 0) * 0.8 + ((business.bankruptcyStage && business.bankruptcyStage !== "stable") ? 0.28 : 0), 0, 1.4);
        governance.boardSeats = App.utils.clamp(Math.floor(Math.max(3, Math.min(13, 3 + Math.round((business.employees || 1) / 60) + (listing ? 1 : 0)))), 3, 13);
        governance.lastReviewDay = App.store.simDay;

        if (governance.boardPressure > 0.92 && owner && Math.random() < 0.12) {
          adjustTemporaryStates(owner, {
            stress:App.utils.rand(3, 8),
            confidence:App.utils.rand(-5, -1)
          });
          syncPerson(owner);
        }
      });
    }

    function processYearlyInnovationAndCopying(){
      (App.store.businesses || []).forEach(function(business){
        var behavior;
        var rAndDIntensity;
        var localPeers;
        var peerFrontier;
        var copyPressure;
        var innovationGain;

        if (!business) return;
        ensureBusinessDecisionState(business);

        behavior = getIndustryBehaviorProfile(business.industry);
        rAndDIntensity = Math.max(0, Number(business.departments && business.departments.rnd) || 0) / Math.max(1, Number(business.revenueGU) || 1);
        localPeers = (App.store.businesses || []).filter(function(candidate){
          return candidate && candidate.id !== business.id && candidate.industry === business.industry;
        });
        peerFrontier = localPeers.length ? localPeers.reduce(function(best, peer){
          return Math.max(best, Number(peer.innovationIndex) || 0);
        }, 0) : Number(business.innovationIndex) || 0;

        innovationGain = (rAndDIntensity * 120 * behavior.innovationBias) + App.utils.rand(-1.4, 2.6);
        business.innovationIndex = App.utils.clamp((Number(business.innovationIndex) || 40) * 0.86 + (Number(business.technologyEdge) || 40) * 0.08 + innovationGain, 0, 100);
        copyPressure = Math.max(0, (peerFrontier - (Number(business.innovationIndex) || 0)) / 100);
        business.copiedTechDebt = App.utils.clamp((Number(business.copiedTechDebt) || 0) * 0.72 + copyPressure * App.utils.rand(0.08, 0.28), 0, 1.6);

        if ((Number(business.innovationIndex) || 0) > peerFrontier + 5 && Math.random() < 0.08) {
          emitNews("market", "<strong>" + business.name + "</strong> pulled ahead with a sector-leading innovation cycle.", {
            entities:{
              businessIds:[business.id],
              countryIsos:[business.countryISO],
              blocIds:[business.blocId]
            },
            causes:[
              "R&D intensity outpaced industry peers.",
              "Innovation index rose to " + (Number(business.innovationIndex) || 0).toFixed(1) + "."
            ]
          });
        }
      });
    }

    function processYearlyFamilyBusinessGrooming(){
      (App.store.businesses || []).forEach(function(business){
        var owner = App.store.getPerson(business && business.ownerId);
        var children;
        var eligible;
        var sorted;
        var chosen;
        var others;
        var household;

        if (!owner || !owner.alive) return;
        children = App.store.getChildren(owner, false).filter(function(child){
          return !!child && child.alive;
        });
        if (children.length < 2) return;

        eligible = children.filter(function(child){
          return child.age >= 12 && child.age <= 32;
        });
        if (!eligible.length) return;

        sorted = eligible.slice().sort(function(first, second){
          var firstScore = (Number(first.educationIndex) || 0) * 0.45 + getPersonSkillAverage(first) * 0.55 + getTraitChannelScore(first, "business") * 2.2 + countSharedTraits(first, owner) * 4;
          var secondScore = (Number(second.educationIndex) || 0) * 0.45 + getPersonSkillAverage(second) * 0.55 + getTraitChannelScore(second, "business") * 2.2 + countSharedTraits(second, owner) * 4;
          return secondScore - firstScore;
        });

        chosen = sorted[0];
        others = sorted.slice(1);
        household = getHouseholdForPerson(owner);

        chosen.groomedForBusinessById = business.id;
        chosen.inheritanceDilution = Math.max(1, children.length);
        chosen.siblingRivalry = App.utils.clamp((Number(chosen.siblingRivalry) || 0) + App.utils.rand(1, 4), 0, 100);
        ensureSkillData(chosen);
        chosen.skills.management = App.utils.clamp((Number(chosen.skills.management) || 0) + App.utils.rand(1.4, 3.8), 0, 100);
        chosen.skills.social = App.utils.clamp((Number(chosen.skills.social) || 0) + App.utils.rand(0.8, 2.4), 0, 100);
        adjustTemporaryStates(chosen, {
          confidence:App.utils.rand(3, 8),
          ambitionSpike:App.utils.rand(2, 5)
        });

        if (others.length) {
          var rival = others[Math.floor(Math.random() * others.length)];
          rival.siblingRivalry = App.utils.clamp((Number(rival.siblingRivalry) || 0) + App.utils.rand(5, 12), 0, 100);
          rival.inheritanceDilution = Math.max(1, children.length);
          adjustTemporaryStates(rival, {
            resentment:App.utils.rand(3, 9),
            stress:App.utils.rand(1, 4),
            ambitionSpike:App.utils.rand(2, 6)
          });
        }

        if (Math.random() < 0.42) {
          emitNews("inheritance", "<strong>" + owner.name + "</strong> started grooming <strong>" + chosen.name + "</strong> for leadership at <strong>" + business.name + "</strong> while sibling rivalry rose.", {
            tags:["family", "succession", "grooming"],
            entities:{
              personIds:[owner.id, chosen.id].concat(others.slice(0, 2).map(function(child){ return child.id; })),
              businessIds:[business.id],
              countryIsos:[business.countryISO],
              blocIds:[business.blocId]
            },
            causes:[
              "Family business succession grooming favored one child over siblings.",
              "Inheritance dilution and rivalry effects intensified as household size grew" + (household ? " under current household pressure." : ".")
            ]
          });
        }
      });
    }

    function processYearlyPromotionsAndPoaching(){
      var movedPeople = {};

      App.store.businesses.slice().sort(function(first, second){
        return (second.reputation || 50) - (first.reputation || 50);
      }).forEach(function(business){
        var leadership;
        var sourceCandidates;
        var sourceBusiness;
        var poachCandidate;
        var poachRole;
        var replaced;

        if (!business) return;

        leadership = App.store.getBusinessLeadership(business).filter(function(entry){
          return !!entry.person;
        });

        leadership.forEach(function(entry){
          var person = entry.person;
          var score;

          if (!person || !person.alive || movedPeople[person.id]) return;
          score = getLeadershipPerformanceScore(person);
          if (score >= 56 && Math.random() < 0.24) {
            if (upgradeJobTier(person, entry)) {
              movedPeople[person.id] = true;
              emitNews("hire", "<strong>" + person.name + "</strong> earned an internal promotion at <strong>" + business.name + "</strong>.", {
                entities:{
                  personIds:[person.id],
                  businessIds:[business.id],
                  countryIsos:[business.countryISO],
                  blocIds:[business.blocId]
                },
                causes:[
                  "Strong insider performance lifted promotion odds.",
                  "Firm leadership favored internal advancement over external hiring."
                ]
              });
            }
          }
        });

        if ((business.reputation || 50) < 62 || Math.random() > 0.35) return;

        sourceCandidates = App.store.businesses.filter(function(candidate){
          return candidate &&
            candidate.id !== business.id &&
            candidate.industry === business.industry &&
            (candidate.reputation || 50) + 6 < (business.reputation || 50);
        }).sort(function(first, second){
          return (first.reputation || 50) - (second.reputation || 50);
        });

        sourceBusiness = sourceCandidates[0] || null;
        if (!sourceBusiness) return;

        poachCandidate = findBestPoachCandidate(sourceBusiness, business);
        if (!poachCandidate || movedPeople[poachCandidate.id]) return;
        if (Math.random() > App.utils.clamp(0.22 + (((business.reputation || 50) - (sourceBusiness.reputation || 50)) * 0.008), 0.16, 0.58)) return;

        poachRole = (business.leadership || []).filter(function(entry){
          return entry.roleKey !== "ceo";
        }).sort(function(first, second){
          var firstPerson = App.store.getPerson(first.personId);
          var secondPerson = App.store.getPerson(second.personId);
          var firstScore = firstPerson && firstPerson.alive ? leadershipCandidateScore(firstPerson, business, first) : -9999;
          var secondScore = secondPerson && secondPerson.alive ? leadershipCandidateScore(secondPerson, business, second) : -9999;
          return firstScore - secondScore;
        })[0] || null;

        if (!poachRole) return;

        replaced = App.store.getPerson(poachRole.personId);
        if (replaced && replaced.alive) {
          clearEmployment(replaced, business.id);
          syncPerson(replaced);
        }

        clearEmployment(poachCandidate, sourceBusiness.id);
        assignEmployment(poachCandidate, business, poachRole);
        relocatePersonToCountry(poachCandidate, business.countryISO, {
          city:normalizeText(business.hqCity)
        });
        poachRole.personId = poachCandidate.id;
        movedPeople[poachCandidate.id] = true;

        sourceBusiness.reputation = clampScore((sourceBusiness.reputation || 50) - App.utils.rand(0.6, 2.2));
        business.reputation = clampScore((business.reputation || 50) + App.utils.rand(0.4, 1.8));

        syncBusinessLeadership(sourceBusiness);
        syncBusinessLeadership(business);
        syncPerson(poachCandidate);

        emitNews("hire", "<strong>" + business.name + "</strong> poached <strong>" + poachCandidate.name + "</strong> from <strong>" + sourceBusiness.name + "</strong>.", {
          entities:{
            personIds:[poachCandidate.id],
            businessIds:[business.id, sourceBusiness.id],
            countryIsos:[business.countryISO, sourceBusiness.countryISO],
            blocIds:[business.blocId, sourceBusiness.blocId]
          },
          causes:[
            "High-reputation firms attracted stronger external talent.",
            "Rival industry competition intensified leadership poaching pressure."
          ]
        });
      });
    }

    function getHouseholdLaunchReadiness(person){
      var household = getHouseholdForPerson(person);
      var debtPenalty;

      if (!household) return 0;
      debtPenalty = (household.debtGU || 0) / Math.max(1, household.monthlyIncomeGU || 1);
      return App.utils.clamp(((household.cashOnHandGU || 0) / Math.max(1, household.monthlyExpensesGU || 1)) - (debtPenalty * 0.22), -1.5, 3);
    }

    function getFounderAptitude(person){
      var traitBias;
      var stage;
      var score = 0;

      ensureDecisionData(person);
      ensureSkillData(person);
      ensureWorkerLifecycleData(person);

      traitBias = hasEntrepreneurialTraits(person) ? 26 : 0;
      stage = String(person.workerLifecycleStage || "worker");

      score += traitBias;
      score += getTraitChannelScore(person, "business") * 2.4;
      score += getTraitChannelScore(person, "mobility") * 1.6;
      score += (Number(person.skills && person.skills.creativity) || 0) * 0.28;
      score += (Number(person.skills && person.skills.social) || 0) * 0.22;
      score += (Number(person.skills && person.skills.management) || 0) * 0.24;
      score += (Number(person.educationIndex) || 0) * 0.16;
      score += (person.decisionProfile.riskTolerance - 50) * 0.7;
      score += (person.decisionProfile.adaptability - 50) * 0.56;
      score += (person.decisionProfile.discipline - 50) * 0.42;
      score += (person.decisionProfile.statusSeeking - 50) * 0.28;

      if (stage === "executive") score += 14;
      else if (stage === "manager") score += 9;
      else if (stage === "professional") score += 5;
      else if (stage === "student") score -= 6;
      else if (stage === "dependent") score -= 12;

      return App.utils.clamp((score + 35) / 220, 0, 1);
    }

    function buildYearlyLaunchContext(){
      var context = {
        activeBusinessesByBloc:{},
        activeBusinessesByCountry:{},
        distressedBusinessesByBloc:{},
        distressedBusinessesByCountry:{},
        eligibleAdultsByBloc:{},
        eligibleAdultsByCountry:{}
      };

      (App.store.businesses || []).forEach(function(business){
        var isDistressed;

        if (!business || business.stage === "defunct" || !business.ownerId) return;
        context.activeBusinessesByBloc[business.blocId] = (context.activeBusinessesByBloc[business.blocId] || 0) + 1;
        context.activeBusinessesByCountry[business.countryISO] = (context.activeBusinessesByCountry[business.countryISO] || 0) + 1;
        isDistressed = business.stage === "declining" || (business.bankruptcyStage && business.bankruptcyStage !== "stable");
        if (isDistressed) {
          context.distressedBusinessesByBloc[business.blocId] = (context.distressedBusinessesByBloc[business.blocId] || 0) + 1;
          context.distressedBusinessesByCountry[business.countryISO] = (context.distressedBusinessesByCountry[business.countryISO] || 0) + 1;
        }
      });

      App.store.getLivingPeople().forEach(function(person){
        if (!person || person.retired || person.age < 22) return;
        context.eligibleAdultsByBloc[person.blocId] = (context.eligibleAdultsByBloc[person.blocId] || 0) + 1;
        context.eligibleAdultsByCountry[person.countryISO] = (context.eligibleAdultsByCountry[person.countryISO] || 0) + 1;
      });

      context.blocBusinessPresenceMeta = buildBlocBusinessPresenceMeta(context);

      return context;
    }

    function getLaunchDensityMultiplier(person, launchContext){
      var context = launchContext && typeof launchContext === "object" ? launchContext : null;
      var presenceMeta;
      var blocBusinessCount;
      var blocEligibleAdults;
      var countryBusinessCount;
      var countryEligibleAdults;
      var blocDistressedCount;
      var countryDistressedCount;
      var blocDensity;
      var countryDensity;
      var blocDiversificationMultiplier;
      var underDensityBoost;
      var distressBoost;

      if (!person || !context) return 1;

      presenceMeta = context.blocBusinessPresenceMeta || buildBlocBusinessPresenceMeta(context);
      blocBusinessCount = Math.max(0, Number(context.activeBusinessesByBloc[person.blocId]) || 0);
      blocEligibleAdults = Math.max(8, Number(context.eligibleAdultsByBloc[person.blocId]) || 0);
      countryBusinessCount = Math.max(0, Number(context.activeBusinessesByCountry[person.countryISO]) || 0);
      countryEligibleAdults = Math.max(6, Number(context.eligibleAdultsByCountry[person.countryISO]) || 0);
      blocDistressedCount = Math.max(0, Number(context.distressedBusinessesByBloc[person.blocId]) || 0);
      countryDistressedCount = Math.max(0, Number(context.distressedBusinessesByCountry[person.countryISO]) || 0);
      blocDensity = blocBusinessCount / blocEligibleAdults;
      countryDensity = countryBusinessCount / countryEligibleAdults;
      blocDiversificationMultiplier = getBlocBusinessDiversificationMultiplier(person.blocId, presenceMeta);
      underDensityBoost = Math.max(0, 0.085 - blocDensity) * 2.4 + Math.max(0, 0.1 - countryDensity) * 1.45;
      distressBoost = Math.min(0.16, (blocDistressedCount / Math.max(1, blocBusinessCount || 1)) * 0.1) + Math.min(0.1, (countryDistressedCount / Math.max(1, countryBusinessCount || 1)) * 0.06);

      return App.utils.clamp(
        (1 + underDensityBoost + distressBoost - (Math.max(0, blocDensity - 0.08) * 4.8) - (Math.max(0, countryDensity - 0.1) * 2.6)) * blocDiversificationMultiplier,
        0.12,
        1.55
      );
    }

    function tryLaunchBusiness(person, launchContext){
      var chance;
      var business;
      var bloc = App.store.getBloc(person.blocId);
      var mobilityTrait;
      var businessTrait;
      var launchEffects;
      var capitalModifier;
      var household;
      var launchReadiness;
      var launchCapital;
      var mentor;
      var socialCapital;
      var patronBoost = 0;
      var founderAptitude;
      var lifecycleStage;
      var countryProfile;
      var institutionScore;
      var corruptionIndex;
      var businessFriendliness;
      var institutionalConfidence;
      var dynasticBias;
      var unemploymentRate;
      var launchGapBoost;

      if (!person.alive || person.retired || person.businessId || person.age < 22) return;

      ensureSocialNetworkData(person);
      ensureWorkerLifecycleData(person);
      founderAptitude = getFounderAptitude(person);
      lifecycleStage = String(person.workerLifecycleStage || "worker");
      countryProfile = ensureCountryProfile(person.countryISO, person.blocId);
      institutionScore = App.utils.clamp(Number(countryProfile && countryProfile.institutionScore) || 0.55, 0.1, 1);
      corruptionIndex = App.utils.clamp(Number(countryProfile && countryProfile.developmentCorruptionIndex) || (1 - institutionScore), 0, 1);
      businessFriendliness = App.utils.clamp(Number(countryProfile && countryProfile.developmentBusinessFriendlinessIndex) || institutionScore, 0, 1);
      institutionalConfidence = App.utils.clamp((institutionScore * 0.44) + (businessFriendliness * 0.36) + ((1 - corruptionIndex) * 0.2), 0.08, 1);
      dynasticBias = App.utils.clamp((0.55 - institutionalConfidence) * 1.4 + (corruptionIndex * 0.6), 0, 1.2);
      unemploymentRate = Math.max(0, Number(countryProfile && countryProfile.unemploymentRate) || 0);
      launchGapBoost = App.utils.clamp((Math.max(0, 0.11 - unemploymentRate) * 0.06) + (Math.max(0, unemploymentRate - 0.16) * 0.018), 0, 0.005);

      chance = hasEntrepreneurialTraits(person) ? 0.012 : 0.0025;
      mobilityTrait = getTraitChannelScore(person, "mobility");
      businessTrait = getTraitChannelScore(person, "business");
      household = getHouseholdForPerson(person);
      launchReadiness = getHouseholdLaunchReadiness(person);
      chance += mobilityTrait * 0.0016;
      chance += businessTrait * 0.0011;
      chance += (Number(person.educationIndex) || 0) * 0.00022;
      chance += App.utils.clamp((Number(person.skills && person.skills.creativity) || 0) * 0.00012, 0, 0.008);
      chance += App.utils.clamp((Number(person.skills && person.skills.social) || 0) * 0.00009, 0, 0.006);
      socialCapital = (person.closeFriendIds.length * 0.5) + (person.schoolTieIds.length * 0.35) + (person.eliteCircleIds.length * 0.4) + (person.nepotismTieIds.length * (0.55 + dynasticBias * 0.35));
      chance += App.utils.clamp(socialCapital * 0.0011, 0, 0.018);
      chance += (institutionalConfidence - 0.5) * 0.018;
      chance += launchGapBoost;
      chance -= App.utils.clamp((corruptionIndex - 0.5) * 0.01, -0.005, 0.02);
      mentor = person.mentorId ? App.store.getPerson(person.mentorId) : null;
      if (mentor && mentor.alive && (mentor.netWorthGU || 0) > 12000) {
        patronBoost = Math.min((mentor.netWorthGU || 0) * 0.0012, Math.max(500, (person.netWorthGU || 0) * 0.08));
        chance += 0.006;
      }
      chance += launchReadiness * 0.006;
      if ((Number(person.rivalFounderArcUntilDay) || 0) > App.store.simDay) {
        chance += 0.012;
      }
      chance *= App.utils.clamp(0.45 + (founderAptitude * 1.35), 0.25, 1.8);
      if (lifecycleStage === "executive") chance += 0.008;
      else if (lifecycleStage === "manager") chance += 0.005;
      else if (lifecycleStage === "professional") chance += 0.003;
      else if (lifecycleStage === "student" || lifecycleStage === "dependent") chance *= 0.35;
      if ((person.netWorthGU || 0) > 90000 && founderAptitude < 0.45) {
        chance *= 0.32;
      }
      chance -= getPersonFinancialStress(person) * 0.08;
      chance *= getLaunchDensityMultiplier(person, launchContext);
      chance = App.utils.clamp(chance, 0.0006, 0.032);
      if (Math.random() >= chance) {
        return;
      }

      business = createBusiness(person);
      seedBusiness(business);
      capitalModifier = 1 + App.utils.clamp((mobilityTrait * 0.6 + businessTrait * 0.8) / 40, -0.22, 0.28);
      capitalModifier *= 1 + App.utils.clamp(launchReadiness * 0.08, -0.14, 0.24);
      capitalModifier *= 1 + App.utils.clamp((institutionalConfidence - 0.5) * 0.22 - (corruptionIndex - 0.5) * 0.12, -0.12, 0.16);
      business.revenueGU *= capitalModifier;
      business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) * capitalModifier);
      business.valuationGU = Math.max(1000, business.valuationGU * (0.95 + (capitalModifier - 1) * 0.9));
      launchCapital = Math.min(person.netWorthGU * 0.09, Math.max(1800, business.cashReservesGU * 0.26));
      if (household) {
        launchCapital = Math.min(launchCapital + Math.min(household.cashOnHandGU || 0, Math.max(1200, household.monthlyExpensesGU || 0)), person.netWorthGU * 0.14 + (household.cashOnHandGU || 0));
        household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) - Math.min(household.cashOnHandGU || 0, launchCapital * 0.45));
        refreshHouseholdSnapshot(household);
      }
      business.cashReservesGU += launchCapital;
      if (patronBoost > 0 && mentor && mentor.alive) {
        business.cashReservesGU += patronBoost;
        mentor.netWorthGU = Math.max(200, (mentor.netWorthGU || 0) - patronBoost);
        adjustPersonalReputation(mentor, { trust:1.4, prestige:1.8, notoriety:0.6 });
        syncPerson(mentor);
      }
      person.netWorthGU = Math.max(200, person.netWorthGU - Math.min(person.netWorthGU * 0.06, launchCapital * 0.3));
      App.store.businesses.push(business);
      person.businessId = business.id;
      person.rivalFounderArcUntilDay = null;
      person.pulse = 1;
      syncBusinessLeadership(business);
      launchEffects = summarizeTraitEffects(collectTraitEffects(person, ["mobility","business"]), 4);
      recordTraitEffects(launchEffects);
      setTraitSnapshot(person, launchEffects);
      setTraitSnapshot(business, launchEffects);
      adjustPersonalReputation(person, { trust:1.2, prestige:4.5, notoriety:2.2 });
      syncPerson(person);
      emitNews("launch", "<strong>" + person.name + "</strong> " + bloc.flag + " launched <strong>" + business.name + "</strong> in " + business.industry + ".", {
        tags:buildTraitEffectTags(launchEffects, 2),
        entities:{
          personIds:[person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:launchEffects.slice(0, 2).map(function(effect){ return effect.label; })
      });
    }

    function processYearlyLaunches(){
      var beforeCount = (App.store.businesses || []).length;
      var afterCount;
      var launchContext = buildYearlyLaunchContext();

      App.store.getLivingPeople().forEach(function(person){
        tryLaunchBusiness(person, launchContext);
      });

      afterCount = (App.store.businesses || []).length;
      recordLaunchWindow(currentYear(), Math.max(0, afterCount - beforeCount));
    }

    function getSuccessionCandidates(owner, business){
      var seen = {};
      var children = App.store.getChildren(owner, false).filter(function(child){
        return child.alive && !child.retired && child.age >= 18 && !child.businessId;
      });
      var spouse = App.store.getSpouse(owner);
      var leadership = App.store.getBusinessLeadership(business).map(function(entry){
        return entry.person;
      }).filter(function(person){
        return person && person.alive && !person.retired && !person.businessId;
      });
      var candidates = [];

      children.forEach(function(child){
        if (seen[child.id]) return;
        seen[child.id] = true;
        candidates.push(child);
      });

      if (spouse && spouse.alive && !spouse.retired && !spouse.businessId && !seen[spouse.id]) {
        seen[spouse.id] = true;
        candidates.push(spouse);
      }

      leadership.forEach(function(candidate){
        if (seen[candidate.id]) return;
        seen[candidate.id] = true;
        candidates.push(candidate);
      });

      return candidates;
    }

    function evaluateSuccessionCandidate(business, owner, candidate){
      var currentDecision = business.currentDecision || evaluateBusinessDecision(business);
      var isFamily = candidate.lineageId === owner.lineageId || candidate.id === owner.spouseId || owner.childrenIds.indexOf(candidate.id) !== -1;
      var isNonMaritalChild = !!(owner.nonMaritalChildIds && owner.nonMaritalChildIds.indexOf(candidate.id) !== -1);
      var leadershipEntry = (business.leadership || []).find(function(entry){
        return entry.personId === candidate.id;
      }) || null;
      var roleImportance = leadershipEntry ? leadershipEntry.importance || 0 : 0;
      var readiness = 0;
      var mobilityTrait;
      var familyTrait;
      var businessTrait;
      var successionTraitScore;
      var successionTraitEffects;
      var networkScore;

      ensureDecisionData(candidate);
      ensureSocialNetworkData(candidate);
      readiness += (candidate.decisionProfile.discipline - 50) * 1.1;
      readiness += (candidate.decisionProfile.adaptability - 50) * 0.9;
      readiness += (candidate.decisionProfile.ethics - 50) * 0.6;
      readiness += (candidate.temporaryStates.confidence - 50) * 0.55;
      readiness -= (candidate.temporaryStates.stress - 50) * 0.75;
      readiness -= (candidate.temporaryStates.burnout - 50) * 0.65;
      readiness += countSharedTraits(candidate, owner) * 8;
      readiness += Math.max(0, 40 - Math.abs((candidate.age || 0) - 42));
      readiness += roleImportance * 16;
      readiness += candidate.employerBusinessId === business.id ? 18 : 0;
      readiness += isFamily ? 14 : 0;
      readiness += isNonMaritalChild ? -12 : 0;
      readiness += candidate.groomedForBusinessById === business.id ? 26 : 0;
      networkScore = getSocialProximityScore(candidate, owner);
      readiness += networkScore * 1.8;
      readiness += App.utils.clamp((Number(candidate.personalReputation && candidate.personalReputation.trust) || 50) - 50, -14, 14) * 0.42;
      readiness += App.utils.clamp((Number(candidate.personalReputation && candidate.personalReputation.prestige) || 35) - 35, -12, 16) * 0.36;
      readiness -= App.utils.clamp(Number(candidate.personalReputation && candidate.personalReputation.scandalMemory) || 0, 0, 100) * 0.18;
      readiness -= App.utils.clamp((Number(candidate.inheritanceDilution) || 1) - 1, 0, 8) * 0.65;
      readiness -= App.utils.clamp(Number(candidate.siblingRivalry) || 0, 0, 100) * 0.05;

      mobilityTrait = getTraitChannelScore(candidate, "mobility");
      familyTrait = getTraitChannelScore(candidate, "family");
      businessTrait = getTraitChannelScore(candidate, "business");
      successionTraitScore = mobilityTrait * 1.15 + familyTrait * 1.4 + businessTrait * 0.85;
      readiness += successionTraitScore;
      successionTraitEffects = summarizeTraitEffects(collectTraitEffects(candidate, ["mobility","family","business"]), 4);

      if (currentDecision.successionBias === "family") {
        readiness += isFamily ? 38 : -28;
      } else if (currentDecision.successionBias === "merit") {
        readiness += isFamily ? -10 : 18;
      }

      return {
        candidate:candidate,
        score:Math.round(readiness),
        isFamily:isFamily,
        isNonMaritalChild:isNonMaritalChild,
        roleImportance:roleImportance,
        traitScore:Math.round(successionTraitScore),
        traitEffects:successionTraitEffects
      };
    }

    function getPotentialHeir(person){
      var business = App.store.getBusiness(person.businessId);
      var candidates;

      if (!business) return null;

      candidates = getSuccessionCandidates(person, business).map(function(candidate){
        return evaluateSuccessionCandidate(business, person, candidate);
      }).sort(function(first, second){
        return second.score - first.score;
      });

      return candidates.length ? candidates[0].candidate : null;
    }

    function getSuccessionEvaluations(owner, business){
      return getSuccessionCandidates(owner, business).map(function(candidate){
        return evaluateSuccessionCandidate(business, owner, candidate);
      }).sort(function(first, second){
        return second.score - first.score;
      });
    }

    function resolveInheritanceDispute(owner, business, evaluations, trigger){
      var childEvaluations = (evaluations || []).filter(function(entry){
        return entry && entry.candidate && owner.childrenIds && owner.childrenIds.indexOf(entry.candidate.id) !== -1 && entry.score >= 34;
      });
      var topGap;
      var ageRanks = {};
      var scored;
      var winner;
      var losers;
      var hasNonMaritalPressure;

      if (childEvaluations.length < 2) return null;

      childEvaluations.sort(function(first, second){
        return second.score - first.score;
      });
      topGap = (childEvaluations[0].score || 0) - (childEvaluations[1].score || 0);
      if (topGap > 7) return null;

      childEvaluations.slice().sort(function(first, second){
        return (Number(second.candidate.age) || 0) - (Number(first.candidate.age) || 0);
      }).forEach(function(entry, index){
        ageRanks[entry.candidate.id] = index;
      });

      scored = childEvaluations.map(function(entry){
        var eldestBias = Math.max(0, (childEvaluations.length - (ageRanks[entry.candidate.id] || 0) - 1)) * 2.4;
        var competenceBias = (entry.score || 0) * 0.95;
        var favoritismBias = (countSharedTraits(owner, entry.candidate) * 3.4) + (getTraitChannelScore(entry.candidate, "family") * 0.4);
        var rivalryNoise = App.utils.rand(-3.5, 3.5);

        return {
          evaluation:entry,
          disputedScore:competenceBias + eldestBias + favoritismBias + rivalryNoise
        };
      }).sort(function(first, second){
        return second.disputedScore - first.disputedScore;
      });

      winner = scored[0];
      losers = scored.slice(1);
      hasNonMaritalPressure = scored.some(function(item){
        return !!(item && item.evaluation && item.evaluation.isNonMaritalChild);
      });

      losers.forEach(function(entry){
        var candidate = entry.evaluation.candidate;
        adjustTemporaryStates(candidate, {
          resentment:18,
          stress:9,
          confidence:-7,
          ambitionSpike:8
        });
        candidate.rivalFounderArcUntilDay = Math.max(Number(candidate.rivalFounderArcUntilDay) || 0, App.store.simDay + (yearDays * 6));
        syncPerson(candidate);
      });

      adjustTemporaryStates(winner.evaluation.candidate, {
        confidence:10,
        stress:-2,
        ambitionSpike:6
      });
      syncPerson(winner.evaluation.candidate);

      emitNews("inheritance", "Inheritance dispute in <strong>" + business.name + "</strong>: competing heirs clashed before <strong>" + winner.evaluation.candidate.name + "</strong> emerged.", {
        tags:["dispute", "succession", trigger || "transfer"],
        entities:{
          personIds:[owner.id].concat(scored.map(function(item){ return item.evaluation.candidate.id; })),
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[
          "No clear successor among viable children triggered a family dispute.",
          "Outcome reflected competence, eldest-child bias, and favoritism pressure.",
          losers.length ? (losers.length + " losing heir(s) gained resentment and rival-founder pressure.") : "Dispute resolved without additional fallout.",
          hasNonMaritalPressure ? "Questions around non-marital heirs intensified inheritance legitimacy arguments." : ""
        ]
      });

      return {
        winnerEvaluation:winner.evaluation,
        loserIds:losers.map(function(item){ return item.evaluation.candidate.id; })
      };
    }

    function pickSuccessionOutcome(owner, business, trigger){
      var evaluations = getSuccessionEvaluations(owner, business);
      var dispute;

      if (!evaluations.length) return null;

      dispute = resolveInheritanceDispute(owner, business, evaluations, trigger);
      if (dispute && dispute.winnerEvaluation) {
        return {
          heir:dispute.winnerEvaluation.candidate,
          evaluation:dispute.winnerEvaluation,
          disputed:true
        };
      }

      return {
        heir:evaluations[0].candidate,
        evaluation:evaluations[0],
        disputed:false
      };
    }

    function applySuccessionOutcome(owner, heir, business, evaluated){
      var leadershipFloor = (business.leadership || []).length || 1;
      var reputationDelta;
      var employeeDelta = 0;
      var workforceDelta = 0;
      var traitReason = "";
      var traitTags = [];

      evaluated = evaluated || evaluateSuccessionCandidate(business, owner, heir);
      reputationDelta = evaluated.isFamily ? App.utils.rand(0.5, 3) : App.utils.rand(1, 4);
      if (evaluated.score < 32) {
        reputationDelta = -App.utils.rand(5, 12);
        employeeDelta = -App.utils.randInt(1, Math.max(1, Math.min(8, leadershipFloor + 2)));
      } else if (evaluated.score < 48) {
        reputationDelta = -App.utils.rand(1, 4);
        employeeDelta = -App.utils.randInt(0, 3);
      }

      business.reputation = clampScore((business.reputation || 50) + reputationDelta);
      if (employeeDelta < 0) {
        workforceDelta = -releaseLabor(business.countryISO, Math.abs(employeeDelta));
      } else if (employeeDelta > 0) {
        workforceDelta = reserveLabor(business.countryISO, employeeDelta);
      }
      business.employees = Math.max(leadershipFloor, business.employees + workforceDelta);

      adjustTemporaryStates(heir, {
        confidence:evaluated.score >= 48 ? 8 : 4,
        stress:evaluated.score >= 48 ? -2 : 5,
        ambitionSpike:6
      });
      adjustTemporaryStates(owner, {
        confidence:-3,
        stress:-4
      });

      if (evaluated.traitEffects && evaluated.traitEffects.length) {
        recordTraitEffects(evaluated.traitEffects);
        setTraitSnapshot(heir, evaluated.traitEffects);
        setTraitSnapshot(business, evaluated.traitEffects);
        traitReason = " Trait edge: " + evaluated.traitEffects[0].label + ".";
        traitTags = buildTraitEffectTags(evaluated.traitEffects, 2);
      }

      pushBusinessEventHistory(
        business,
        evaluated.isFamily ? "Family succession at " + business.name : "Internal succession at " + business.name,
        (evaluated.score >= 48 ? "Leadership transitioned cleanly." : "Leadership changed under visible strain.") +
        traitReason
      );

      if (traitTags.length) {
        emitNews("inheritance", "<strong>" + heir.name + "</strong> gained succession momentum at <strong>" + business.name + "</strong>.", {
          tags:traitTags,
          entities:{
            personIds:[heir.id, owner.id],
            businessIds:[business.id],
            countryIsos:[business.countryISO],
            blocIds:[business.blocId]
          },
          causes:evaluated.traitEffects.slice(0, 2).map(function(effect){ return effect.label; })
        });
      }
    }

    function transferBusiness(owner, heir, business, successionEvaluation){
      if (!business || !heir) return;

      successionEvaluation = successionEvaluation || evaluateSuccessionCandidate(business, owner, heir);
      owner.businessId = null;
      business.ownerId = heir.id;
      business.successionCount += 1;
      business.inheritedAtDay = App.store.simDay;
      heir.businessId = business.id;
      heir.pulse = 1;
      syncBusinessLeadership(business);
      applySuccessionOutcome(owner, heir, business, successionEvaluation);
      business.currentDecision = evaluateBusinessDecision(business);
      syncPerson(owner);
      syncPerson(heir);
    }

    function refreshBusinessFirmStructure(business, decision){
      var profile;
      var behavior;
      var departmentShares;
      var managementTilt;
      var leadershipCount;
      var boardPressure;

      if (!business) return;

      profile = ensureCountryProfile(business.countryISO);
      behavior = getIndustryBehaviorProfile(business.industry);
      leadershipCount = Math.max(1, (business.leadership || []).length);
      boardPressure = Number(business.governance && business.governance.boardPressure) || 0;

      departmentShares = {
        operations:App.utils.clamp(0.18 + (behavior.supplySensitivity * 0.16), 0.16, 0.42),
        people:App.utils.clamp(0.1 + (behavior.talentSensitivity * 0.08), 0.08, 0.22),
        finance:App.utils.clamp(0.1 + (behavior.leverageAppetite * 0.06), 0.08, 0.22),
        sales:App.utils.clamp(0.14 + (behavior.customerElasticity * 0.08), 0.12, 0.3),
        rnd:App.utils.clamp(0.06 + (behavior.innovationBias * 0.1), 0.04, 0.24)
      };

      managementTilt =
        ((Number(business.reputation) || 50) - 50) * 0.02 +
        (((Number(business.customerTrust) || 50) - 50) * 0.01) +
        ((decision && decision.stance === "aggressive") ? -0.08 : 0) +
        ((decision && decision.cashPolicy === "preserve") ? 0.06 : 0) -
        (boardPressure * 0.05);

      business.managementQuality = App.utils.clamp((Number(business.managementQuality) || 50) * 0.95 + (50 + managementTilt * 100) * 0.05, 10, 98);
      business.departments.operations = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.operations));
      business.departments.people = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.people));
      business.departments.finance = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.finance));
      business.departments.sales = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.sales));
      business.departments.rnd = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.rnd));

      business.wageBillAnnual = Math.max(0, getLeadershipPayrollAnnual(business) + getAnonymousPayrollAnnual(business));
      business.operatingCostAnnual = Math.max(0, (business.revenueGU || 0) * getOperatingCostRate(business));
      business.hiringNeed = App.utils.clamp(
        Math.round(((decision && decision.staffingAction === "hire") ? 1 : (decision && decision.staffingAction === "layoff" ? -1 : 0)) * Math.max(0, business.employees || 0) * 0.08 + ((Number(profile && profile.talentShortageIndex) || 0) * -8) + (leadershipCount * 0.4)),
        -600,
        600
      );
    }

    function applyCustomerDemandAndReputationDynamics(business, decision, margin){
      var behavior;
      var trust;
      var quality;
      var pricePower;
      var decisionSignal;
      var reputationDelta;
      var scope;
      var countryProfile;
      var countryIndustryDemand;
      var blocIndustryDemand;
      var marketDemandSignal;
      var marketDemandMultiplier;

      if (!business) {
        return { revenueMultiplier:1, reputationDelta:0 };
      }

      behavior = getIndustryBehaviorProfile(business.industry);
      trust = Number(business.customerTrust) || 50;
      quality = Number(business.productQuality) || 50;
      pricePower = Number(business.pricePower) || 1;
      scope = getIndustryMarketScope(business.industry);
      countryProfile = ensureCountryProfile(business.countryISO, business.blocId);
      countryIndustryDemand = getCountryIndustryDemandMultiplier(countryProfile, business.industry);
      blocIndustryDemand = getBlocIndustryDemandMultiplier(business.blocId, business.industry);
      marketDemandSignal = scope === "local" ? countryIndustryDemand : (scope === "global" ? blocIndustryDemand : ((countryIndustryDemand * 0.52) + (blocIndustryDemand * 0.48)));
      marketDemandMultiplier = App.utils.clamp(1 + ((marketDemandSignal - 1) * 0.22), 0.9, 1.12);
      decisionSignal = (decision && decision.stance === "aggressive" ? 0.6 : 0) + (decision && decision.cashPolicy === "preserve" ? -0.35 : 0);

      trust = App.utils.clamp(trust + ((Number(business.reputation) || 50) - 50) * 0.035 + (margin * 4.4) - (business.laborUnrestScore || 0) * 2.6 - decisionSignal, 0, 100);
      quality = App.utils.clamp(quality + ((Number(business.innovationIndex) || 0) - 50) * 0.035 + ((Number(business.managementQuality) || 50) - 50) * 0.02 - (business.supplyStress || 0) * 3.2, 0, 100);
      pricePower = App.utils.clamp(pricePower + ((trust - 50) * 0.0008) + ((quality - 50) * 0.0006) - (behavior.customerElasticity * 0.0024), 0.62, 1.55);

      business.customerTrust = trust;
      business.productQuality = quality;
      business.pricePower = pricePower;
      business.technologyEdge = App.utils.clamp((Number(business.technologyEdge) || 40) * 0.9 + (Number(business.innovationIndex) || 40) * 0.12 - (Number(business.copiedTechDebt) || 0) * 5.5, 0, 100);

      reputationDelta = App.utils.clamp(((trust - 50) * 0.03) + ((quality - 50) * 0.02) - ((business.supplyStress || 0) * 0.8), -1.2, 1.4);
      return {
        revenueMultiplier:App.utils.clamp((1 + ((trust - 50) * 0.0018) + ((quality - 50) * 0.0016) + ((pricePower - 1) * 0.08 * (1 - behavior.customerElasticity * 0.4))) * marketDemandMultiplier, 0.84, 1.22),
        reputationDelta:reputationDelta
      };
    }

    function getReserveShareRate(business, decision){
      var currentDecision = decision || business.currentDecision || { cashPolicy:"balanced" };
      if (currentDecision.cashPolicy === "preserve") return 0.68;
      if (currentDecision.cashPolicy === "reinvest") return 0.38;
      return 0.52;
    }

    function applyDebtCreditAndBankruptcyStages(business, owner, bloc, decision){
      var behavior;
      var policyRate;
      var countryProfile;
      var countryStance;
      var blocStance;
      var countryPolicyEffects;
      var blocPolicyEffects;
      var debtRateBias;
      var rolloverChanceBias;
      var distressBias;
      var bailoutBias;
      var debtCapacity;
      var desiredBorrow;
      var interestExpenseDaily;
      var maturityDue;
      var rolloverChance;
      var stageIndex;
      var distressBuild;
      var bailoutChance;
      var institutionScore;
      var instabilityIndex;
      var businessFriendliness;
      var corruptionIndex;
      var contractReliability;
      var investmentConfidence;
      var institutionVolatility;
      var sanctionExposure;
      var electionEffects;

      if (!business || !owner || !bloc) return { liquidated:false, creditStress:0 };

      behavior = getIndustryBehaviorProfile(business.industry);
      policyRate = getBlocPolicyRate(bloc);
      countryProfile = ensureCountryProfile(business.countryISO, business.blocId);
      countryStance = refreshCountryPolicyStance(countryProfile, {
        unemploymentRate:countryProfile && countryProfile.laborForce > 0 ? (Math.max(0, Number(countryProfile.unemployed) || 0) / Math.max(1, Number(countryProfile.laborForce) || 1)) : 0,
        laborScarcity:Number(countryProfile && countryProfile.laborScarcity) || 0,
        wagePressure:Number(countryProfile && countryProfile.wagePressure) || 0,
        longUnemploymentShare:Number(countryProfile && countryProfile.longUnemploymentShare) || 0,
        demandGrowth:Number(countryProfile && countryProfile.policyEvidence && countryProfile.policyEvidence.demandGrowth) || 0
      });
      blocStance = refreshBlocPolicyStance(bloc);
      countryPolicyEffects = getCountryPolicyEffects(countryStance);
      blocPolicyEffects = getBlocPolicyEffects(blocStance);
      institutionScore = App.utils.clamp(Number(countryProfile && countryProfile.institutionScore) || 0.55, 0.1, 1);
      instabilityIndex = App.utils.clamp(Number(countryProfile && countryProfile.institutionalInstabilityIndex) || 0.2, 0, 1.6);
      businessFriendliness = App.utils.clamp(Number(countryProfile && countryProfile.developmentBusinessFriendlinessIndex) || institutionScore, 0, 1);
      corruptionIndex = App.utils.clamp(Number(countryProfile && countryProfile.developmentCorruptionIndex) || (1 - institutionScore), 0, 1);
      contractReliability = App.utils.clamp((institutionScore * 0.42) + (businessFriendliness * 0.36) + ((1 - corruptionIndex) * 0.22), 0.08, 1);
      investmentConfidence = App.utils.clamp((businessFriendliness * 0.52) + (contractReliability * 0.3) + (Math.max(0, Number(countryProfile && countryProfile.demandGrowth) || 0) * 1.8) * 0.18, 0.06, 1);
      institutionVolatility = App.utils.clamp((instabilityIndex / 1.6) * 0.65 + (corruptionIndex * 0.35), 0, 1.2);
      sanctionExposure = getCountrySanctionExposure(countryProfile, business.blocId);
      electionEffects = getTier6ElectionChannelEffects(countryProfile);
      debtRateBias = (countryPolicyEffects.debtRateBias || 0) + (blocPolicyEffects.debtRateBias || 0);
      rolloverChanceBias = (countryPolicyEffects.rolloverChanceBias || 0) + (blocPolicyEffects.rolloverChanceBias || 0);
      distressBias = (countryPolicyEffects.distressBias || 0) + (blocPolicyEffects.distressBias || 0);
      bailoutBias = (countryPolicyEffects.bailoutBias || 0) + (blocPolicyEffects.bailoutBias || 0);
      investmentConfidence = App.utils.clamp(investmentConfidence - (sanctionExposure.financeBlockIndex * 0.24) - (sanctionExposure.dealBlockIndex * 0.08) + (electionEffects.creditConfidenceBias || 0), 0.06, 1);
      debtRateBias += App.utils.clamp((0.55 - contractReliability) * 0.022 + (institutionVolatility * 0.012), -0.012, 0.034);
      debtRateBias += App.utils.clamp(sanctionExposure.financeBlockIndex * 0.019, 0, 0.026);
      rolloverChanceBias += App.utils.clamp((contractReliability - 0.5) * 0.22 + (investmentConfidence - 0.5) * 0.12 - (institutionVolatility * 0.18), -0.16, 0.18);
      rolloverChanceBias -= App.utils.clamp(sanctionExposure.financeBlockIndex * 0.18, 0, 0.18);
      distressBias += App.utils.clamp((0.52 - investmentConfidence) * 0.22 + (institutionVolatility * 0.2), -0.12, 0.2);
      distressBias += App.utils.clamp(sanctionExposure.financeBlockIndex * 0.22, 0, 0.2);
      bailoutBias += App.utils.clamp((contractReliability - 0.5) * 0.12 + (institutionScore - 0.5) * 0.08 - (corruptionIndex - 0.4) * 0.08, -0.1, 0.14);
      debtCapacity = Math.max(0, (Number(business.valuationGU) || 0) * App.utils.clamp(0.2 + behavior.leverageAppetite * 0.32, 0.2, 0.82));

      if ((decision && decision.stance === "aggressive") && (business.hiringNeed || 0) > 0 && (business.cashReservesGU || 0) < (business.wageBillAnnual || 0) * 0.18) {
        desiredBorrow = Math.min(
          debtCapacity - (Number(business.debtGU) || 0),
          Math.max(0, (business.wageBillAnnual || 0) * 0.22 + (business.operatingCostAnnual || 0) * 0.08)
        );
        if (desiredBorrow > 1200) {
          business.debtGU = Math.max(0, (Number(business.debtGU) || 0) + desiredBorrow);
          business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + desiredBorrow * 0.92);
          business.debtInterestRate = App.utils.clamp((policyRate + 0.022 + debtRateBias + (business.rolloverRisk || 0) * 0.03 + (business.bankruptcyStage !== "stable" ? 0.02 : 0)), 0.01, 0.34);
          business.debtMaturityDay = App.store.simDay + App.utils.randInt(180, 520);
        }
      }

      if ((decision && decision.cashPolicy === "preserve") && (Number(business.debtGU) || 0) > 0 && (business.cashReservesGU || 0) > (business.wageBillAnnual || 0) * 0.12) {
        desiredBorrow = Math.min((Number(business.debtGU) || 0), (business.cashReservesGU || 0) * 0.08);
        business.debtGU = Math.max(0, (Number(business.debtGU) || 0) - desiredBorrow);
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) - desiredBorrow);
      }

      interestExpenseDaily = Math.max(0, (Number(business.debtGU) || 0) * Math.max(0.001, Number(business.debtInterestRate) || 0.08) / yearDays) * simDaysPerTick;
      if (interestExpenseDaily > 0) {
        if ((business.cashReservesGU || 0) >= interestExpenseDaily) {
          business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) - interestExpenseDaily);
        } else {
          owner.netWorthGU = Math.max(100, (owner.netWorthGU || 0) - Math.max(0, interestExpenseDaily - (business.cashReservesGU || 0)) * (business.founderGuaranteeShare || 0.5));
          business.cashReservesGU = 0;
        }
        business.profitGU -= interestExpenseDaily * yearDays;
      }

      maturityDue = (Number(business.debtGU) || 0) > 0 && (Number(business.debtMaturityDay) || 0) <= App.store.simDay;
      if (maturityDue) {
        rolloverChance = App.utils.clamp(0.78 + rolloverChanceBias + ((business.reputation || 50) - 50) * 0.005 - (business.rolloverRisk || 0) * 0.28 - ((policyRate - 0.03) * 1.8), 0.05, 0.94);
        if (Math.random() < rolloverChance) {
          business.debtInterestRate = App.utils.clamp((policyRate + 0.026 + debtRateBias + (business.rolloverRisk || 0) * 0.02), 0.01, 0.34);
          business.debtMaturityDay = App.store.simDay + App.utils.randInt(140, 420);
        } else {
          business.rolloverRisk = App.utils.clamp((Number(business.rolloverRisk) || 0) + 0.28, 0, 1.6);
          business.distressScore = App.utils.clamp((Number(business.distressScore) || 0) + 0.42, 0, 4.4);
        }
      }

      distressBuild =
        ((business.profitGU || 0) < -(business.revenueGU || 0) * 0.08 ? 0.28 : -0.08) +
        ((business.cashReservesGU || 0) < (business.wageBillAnnual || 0) * 0.06 ? 0.22 : -0.06) +
        (((business.debtGU || 0) / Math.max(1, business.valuationGU || 1)) > 0.62 ? 0.24 : -0.04) +
        (business.rolloverRisk || 0) * 0.18 +
        distressBias;
      business.distressScore = App.utils.clamp((Number(business.distressScore) || 0) * 0.74 + distressBuild, 0, 4.4);

      stageIndex = business.distressScore >= 3.8 ? 5 : (business.distressScore >= 3.05 ? 4 : (business.distressScore >= 2.35 ? 3 : (business.distressScore >= 1.55 ? 2 : (business.distressScore >= 0.95 ? 1 : 0))));
      business.bankruptcyStage = bankruptcyStageOrder[stageIndex] || "stable";

      if (business.bankruptcyStage === "restructuring") {
        business.restructuringUntilDay = Math.max(Number(business.restructuringUntilDay) || 0, App.store.simDay + App.utils.randInt(40, 120));
        business.reputation = clampScore((business.reputation || 50) - App.utils.rand(0.2, 0.7));
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + Math.max(0, (business.debtGU || 0) * 0.04));
      } else if (business.bankruptcyStage === "fire_sale") {
        var shed = Math.max(0, Math.floor((business.employees || 0) * App.utils.rand(0.04, 0.14)));
        if (shed > 0) {
          business.employees = Math.max((business.leadership || []).length || 1, (business.employees || 1) - releaseLabor(business.countryISO, shed));
        }
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + Math.max(0, (business.valuationGU || 0) * App.utils.rand(0.01, 0.04)));
        business.reputation = clampScore((business.reputation || 50) - App.utils.rand(0.8, 2.1));
      } else if (business.bankruptcyStage === "bailout") {
        bailoutChance = App.utils.clamp(0.14 + bailoutBias + Math.max(0, 0.11 - (getBlocPolicyRate(bloc) * 0.8)) + ((business.reputation || 50) > 58 ? 0.08 : 0), 0.05, 0.38);
        if (Math.random() < bailoutChance) {
          var bailout = Math.max(0, Math.min((business.valuationGU || 0) * 0.06, (business.wageBillAnnual || 0) * 0.26));
          business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + bailout);
          business.debtGU = Math.max(0, (business.debtGU || 0) - bailout * 0.2);
          business.distressScore = App.utils.clamp((business.distressScore || 0) - 0.55, 0, 4.4);
        }
      } else if (business.bankruptcyStage === "liquidation") {
        emitNews("bankruptcy", "<strong>" + owner.name + "</strong> " + bloc.flag + " - <strong>" + business.name + "</strong> entered liquidation after prolonged credit distress.", {
          entities:{
            personIds:[owner.id],
            businessIds:[business.id],
            countryIsos:[business.countryISO],
            blocIds:[business.blocId]
          },
          causes:[
            "Debt rollover failed and liquidity buffers were exhausted.",
            "Bankruptcy stage escalated from " + (business.bankruptcyStage || "stable") + " to liquidation."
          ]
        });
        liquidateBusiness(owner, business);
        owner.netWorthGU = Math.max(600, owner.netWorthGU * 0.42);
        adjustTemporaryStates(owner, {
          confidence:-14,
          stress:16,
          burnout:5
        });
        adjustPersonalReputation(owner, {
          trust:-6,
          prestige:-9,
          notoriety:6,
          scandalMemory:8
        });
        syncPerson(owner);
        return {
          liquidated:true,
          creditStress:1.2,
          countryPolicyStance:countryStance,
          blocPolicyStance:blocStance,
          policyCreditBias:Number((debtRateBias + distressBias).toFixed(4))
        };
      }

      business.policyCreditEvidence = {
        countryPolicyStance:countryStance,
        blocPolicyStance:blocStance,
        debtRateBias:Number(debtRateBias.toFixed(4)),
        rolloverChanceBias:Number(rolloverChanceBias.toFixed(4)),
        distressBias:Number(distressBias.toFixed(4)),
        bailoutBias:Number(bailoutBias.toFixed(4)),
        contractReliability:Number(contractReliability.toFixed(4)),
        investmentConfidence:Number(investmentConfidence.toFixed(4)),
        institutionVolatility:Number(institutionVolatility.toFixed(4)),
        corruptionIndex:Number(corruptionIndex.toFixed(4)),
        sanctionFinanceBlockIndex:Number(sanctionExposure.financeBlockIndex.toFixed(4)),
        sanctionDealBlockIndex:Number(sanctionExposure.dealBlockIndex.toFixed(4))
      };

      return {
        liquidated:false,
        creditStress:App.utils.clamp((business.debtGU || 0) / Math.max(1, business.valuationGU || 1) + (business.rolloverRisk || 0) * 0.4 + (business.bankruptcyStage !== "stable" ? 0.35 : 0), 0, 2),
        countryPolicyStance:countryStance,
        blocPolicyStance:blocStance,
        policyCreditBias:Number((debtRateBias + distressBias).toFixed(4))
      };
    }

    function getLeaderExpansionLean(person){
      ensureDecisionData(person);

      return (
        (person.decisionProfile.riskTolerance - 50) * 0.7 +
        (person.decisionProfile.statusSeeking - 50) * 0.45 +
        (person.decisionProfile.adaptability - 50) * 0.3 +
        (person.temporaryStates.confidence - 50) * 0.65 +
        (person.temporaryStates.ambitionSpike - 50) * 0.35 -
        (person.decisionProfile.discipline - 50) * 0.25 -
        (person.decisionProfile.patience - 50) * 0.15 -
        (person.temporaryStates.stress - 50) * 0.55 -
        (person.temporaryStates.burnout - 50) * 0.45 +
        getTraitDecisionShift(person, "expansion")
      );
    }

    function getLeaderStaffingLean(person){
      ensureDecisionData(person);

      return (
        (person.decisionProfile.loyalty - 50) * 0.4 +
        (person.decisionProfile.ethics - 50) * 0.45 +
        (person.decisionProfile.adaptability - 50) * 0.2 +
        (person.temporaryStates.confidence - 50) * 0.25 -
        (person.decisionProfile.greed - 50) * 0.25 -
        (person.temporaryStates.stress - 50) * 0.35 -
        (person.temporaryStates.burnout - 50) * 0.25 +
        getTraitDecisionShift(person, "staffing")
      );
    }

    function getLeaderInstitutionPrestigeLean(person, business){
      var quality = Number(person && person.educationInstitutionQuality);
      var education = Number(person && person.educationIndex) || 0;
      var ownPrestige = Number.isFinite(quality) ? App.utils.clamp(quality, 20, 100) : App.utils.clamp(35 + (education * 0.62), 20, 100);
      var profile = ensureCountryProfile((person && person.countryISO) || (business && business.countryISO));
      var countryBaseline = App.utils.clamp((Number(profile && profile.institutionScore) || 0.55) * 100, 20, 100);
      var delta = ownPrestige - countryBaseline;

      return App.utils.clamp((delta * 0.26) + ((ownPrestige - 50) * 0.18), -14, 18);
    }

    function getLeaderCashLean(person){
      ensureDecisionData(person);

      return (
        (person.decisionProfile.discipline - 50) * 0.7 +
        (person.decisionProfile.patience - 50) * 0.55 +
        (person.decisionProfile.ethics - 50) * 0.2 -
        (person.decisionProfile.riskTolerance - 50) * 0.55 -
        (person.decisionProfile.statusSeeking - 50) * 0.25 -
        (person.temporaryStates.confidence - 50) * 0.25 +
        (person.temporaryStates.stress - 50) * 0.45 +
        (person.temporaryStates.burnout - 50) * 0.2 +
        getTraitDecisionShift(person, "cash")
      );
    }

    function getLeaderSuccessionLean(person, business){
      ensureDecisionData(person);

      return (
        (person.decisionProfile.familyAttachment - 50) * 0.85 +
        (person.decisionProfile.loyalty - 50) * 0.4 -
        (person.decisionProfile.discipline - 50) * 0.35 -
        (person.decisionProfile.ethics - 50) * 0.25 -
        (person.decisionProfile.adaptability - 50) * 0.2 -
        (person.temporaryStates.stress - 50) * 0.45 -
        (((business.reputation || 50) < 40) ? 8 : 0) +
        getTraitDecisionShift(person, "succession")
      );
    }

    function getBusinessDecisionMakers(business){
      var leadership = App.store.getBusinessLeadership(business).filter(function(entry){
        return entry.person && entry.person.alive && !entry.person.retired;
      });
      var owner;

      if (leadership.length) {
        leadership.forEach(function(entry){
          ensureDecisionData(entry.person);
        });
        return leadership;
      }

      owner = App.store.getPerson(business.ownerId) || App.store.getPerson(business.founderId);
      if (!owner) return [];

      ensureDecisionData(owner);
      return [{
        roleKey:"ceo",
        title:owner.jobTitle || "CEO",
        person:owner
      }];
    }

    function buildDecisionInfluencers(makers){
      var weights = makers.map(function(entry){
        return Object.assign({}, entry, {
          influence:roleDecisionInfluence(entry.roleKey)
        });
      }).sort(function(first, second){
        return second.influence - first.influence;
      });
      var total = weights.reduce(function(sum, entry){
        return sum + entry.influence;
      }, 0) || 1;

      return weights.slice(0, 3).map(function(entry){
        return {
          personId:entry.person.id,
          roleKey:entry.roleKey,
          title:entry.title,
          weight:Math.round((entry.influence / total) * 100)
        };
      });
    }

    function buildDecisionReasons(business, metrics, makers, traitEffects){
      var reasons = [];
      var ceoEntry = makers.find(function(entry){
        return entry.roleKey === "ceo";
      }) || makers[0] || null;
      var ceo = ceoEntry ? ceoEntry.person : null;

      if (metrics.profitMargin > 0.16) reasons.push({ text:"Strong margins encouraged bolder expansion.", weight:metrics.profitMargin * 100 });
      if (metrics.profitMargin < -0.10) reasons.push({ text:"Weak margins pushed leadership into protection mode.", weight:Math.abs(metrics.profitMargin) * 120 });
      if (metrics.cashCoverage < 2) reasons.push({ text:"Thin cash reserves forced caution.", weight:(2 - metrics.cashCoverage) * 25 });
      if (metrics.cashCoverage > 5) reasons.push({ text:"Deep cash reserves supported growth plans.", weight:(metrics.cashCoverage - 5) * 18 });
      if (metrics.reputation > 68) reasons.push({ text:"Strong reputation made growth feel safer.", weight:(metrics.reputation - 68) * 1.6 });
      if (metrics.reputation < 38) reasons.push({ text:"Damaged reputation limited room to maneuver.", weight:(38 - metrics.reputation) * 1.8 });
      if (metrics.institutionPrestige > 70) reasons.push({ text:"Leadership education prestige supported hiring confidence and merit promotions.", weight:(metrics.institutionPrestige - 70) * 1.8 });
      if (metrics.institutionPrestige < 44) reasons.push({ text:"Low institutional prestige made leadership favor conservative staffing and slower promotions.", weight:(44 - metrics.institutionPrestige) * 2.2 });
      if (metrics.laborScarcity > 0.82) reasons.push({ text:"Local labor scarcity forced wage pressure and selective hiring.", weight:(metrics.laborScarcity - 0.82) * 28 });
      if (metrics.longUnemploymentShare > 0.08) reasons.push({ text:"A large long-unemployment pool weakened talent matching quality.", weight:metrics.longUnemploymentShare * 120 });
      if (metrics.wagePressure > 0.12) reasons.push({ text:"Country wage pressure raised expected compensation costs.", weight:metrics.wagePressure * 60 });
      if (metrics.geoPressure > 1.5) reasons.push({ text:"Geopolitical pressure made the firm more defensive.", weight:(metrics.geoPressure - 1.5) * 16 });
      if (metrics.trend > 0.07) reasons.push({ text:"Rising revenue momentum favored expansion.", weight:metrics.trend * 120 });
      if (metrics.trend < -0.07) reasons.push({ text:"Falling revenue momentum increased retrenchment pressure.", weight:Math.abs(metrics.trend) * 120 });
      if (business.stage === "declining") reasons.push({ text:"Declining status raised urgency around survival.", weight:18 });

      if (ceo) {
        if (ceo.temporaryStates.confidence > 62) reasons.push({ text:"A confident CEO pushed for sharper action.", weight:ceo.temporaryStates.confidence - 62 });
        if (ceo.temporaryStates.stress > 58) reasons.push({ text:"Leadership stress made the company more cautious.", weight:ceo.temporaryStates.stress - 58 });
        if (ceo.decisionProfile.familyAttachment > 64) reasons.push({ text:"Leadership culture still leans family-first.", weight:ceo.decisionProfile.familyAttachment - 64 });
        if (ceo.decisionProfile.ethics > 66) reasons.push({ text:"High ethics softened the harshest staffing moves.", weight:ceo.decisionProfile.ethics - 66 });
      }

      if (traitEffects && traitEffects.length) {
        reasons.push({
          text:"Trait pressure: " + traitEffects.slice(0, 2).map(function(effect){ return effect.label; }).join(", ") + ".",
          weight:14
        });
      }

      return reasons.sort(function(first, second){
        return second.weight - first.weight;
      }).slice(0, 3).map(function(reason){
        return reason.text;
      });
    }

    function evaluateBusinessDecision(business){
      var makers;
      var bloc;
      var profile;
      var trend;
      var demandGrowth;
      var profitMargin;
      var cashCoverage;
      var laborScarcity;
      var longUnemploymentShare;
      var wagePressure;
      var demandCapacity;
      var productionCapacity;
      var demandOpportunityRatio;
      var demandUtilization;
      var demandSlack;
      var metrics;
      var scores;
      var stance;
      var staffingAction;
      var cashPolicy;
      var successionBias;
      var leverageRatio;
      var employeeCount;
      var underUtilizedLayoffAllowed;
      var decisionTraitEffects = [];
      var institutionPrestige = 50;

      if (!business) return null;

      primeBusinessDecisionState(business);
      makers = getBusinessDecisionMakers(business);
      bloc = App.store.getBloc(business.blocId);
      profile = ensureCountryProfile(business.countryISO);
      trend = getRevenueTrend(business);
      demandGrowth = ((Math.max(0, Number(profile && profile.consumerDemandGU) || 0) - Math.max(1, Number(profile && profile.prevConsumerDemandGU) || Number(profile && profile.consumerDemandGU) || 1)) / Math.max(1, Number(profile && profile.prevConsumerDemandGU) || Number(profile && profile.consumerDemandGU) || 1));
      profitMargin = getProfitMargin(business);
      cashCoverage = getCashCoverageMonths(business);
      laborScarcity = getCountryLaborScarcity(business.countryISO);
      longUnemploymentShare = getCountryLongUnemploymentShare(business.countryISO);
      wagePressure = getCountryWagePressure(business.countryISO);
      demandCapacity = Math.max(1, getBusinessDemandCapacityGU(business));
      productionCapacity = Math.max(1, getBusinessProductionCapacityGU(business));
      demandOpportunityRatio = App.utils.clamp(demandCapacity / productionCapacity, 0.55, 1.85);
      demandUtilization = Math.max(0, (business.revenueGU || 0) / demandCapacity);
      demandSlack = App.utils.clamp(1 - demandUtilization, -0.8, 0.8);
      leverageRatio = Math.max(0, Number(business.debtGU) || 0) / Math.max(1, Number(business.valuationGU) || 1);
      employeeCount = Math.max(0, Number(business.employees) || 0);
      metrics = {
        trend:trend,
        demandGrowth:demandGrowth,
        profitMargin:profitMargin,
        cashCoverage:cashCoverage,
        reputation:business.reputation || 50,
        institutionPrestige:50,
        laborScarcity:laborScarcity,
        longUnemploymentShare:longUnemploymentShare,
        wagePressure:wagePressure,
        demandOpportunityRatio:demandOpportunityRatio,
        demandUtilization:demandUtilization,
        demandSlack:demandSlack,
        geoPressure:bloc ? bloc.geoPressure : 0,
        stage:business.stage
      };
      scores = {
        expansion:trend * 70 + profitMargin * 60 + (cashCoverage - 3) * 8 + ((business.reputation || 50) - 50) * 0.4 - ((bloc ? bloc.geoPressure : 0) * 6) + getStageExpansionBias(business.stage),
        staffing:trend * 55 + profitMargin * 55 + (cashCoverage - 2.5) * 10 + ((business.reputation || 50) - 50) * 0.35 - ((bloc ? bloc.geoPressure : 0) * 4) - (business.stage === "declining" ? 8 : 0),
        cash:(-trend * 60) + (-profitMargin * 80) + (3 - cashCoverage) * 12 + ((50 - (business.reputation || 50)) * 0.18) + ((bloc ? bloc.geoPressure : 0) * 7) + (business.stage === "declining" ? 10 : 0),
        succession:(business.stage === "declining" ? -6 : 0) + (cashCoverage < 2 ? -5 : 0) + ((business.reputation || 50) < 40 ? -6 : 0)
      };

      scores.expansion += App.utils.clamp((demandGrowth * 95) + ((demandOpportunityRatio - 1) * 34), -18, 28);
      scores.staffing += App.utils.clamp((demandGrowth * 132) + ((demandOpportunityRatio - 1) * 60) + (cashCoverage > 3.5 ? 5 : 0), -16, 40);
      scores.cash -= App.utils.clamp((Math.max(0, demandGrowth) * 48) + (Math.max(0, demandOpportunityRatio - 1) * 22), 0, 18);

      scores.staffing += App.utils.clamp((laborScarcity - 0.72) * 24, -7, 8);
      scores.staffing += App.utils.clamp(longUnemploymentShare * 22, 0, 8);
      scores.staffing -= App.utils.clamp(Math.max(0, longUnemploymentShare - 0.22) * 10, 0, 3);
      scores.cash += App.utils.clamp(wagePressure * 36, -9, 16);
      scores.expansion += App.utils.clamp((demandSlack * 24) - ((Math.max(0, demandUtilization - 1)) * 32), -28, 16);
      scores.staffing += App.utils.clamp((demandSlack * 40) - ((Math.max(0, demandUtilization - 1)) * 48), -30, 20);
      scores.cash += App.utils.clamp((Math.max(0, demandUtilization - 1)) * 28, 0, 18);

      if (profile && profile.talentShortageIndex != null) {
        scores.staffing -= App.utils.clamp(Number(profile.talentShortageIndex) * 9, 0, 6);
        scores.cash += App.utils.clamp(Number(profile.talentShortageIndex) * 8, 0, 6);
      }

      makers.forEach(function(entry){
        var weights = getRoleDecisionWeights(entry.roleKey);
        var businessTrait = getTraitChannelScore(entry.person, "business");
        var mobilityTrait = getTraitChannelScore(entry.person, "mobility");
        var familyTrait = getTraitChannelScore(entry.person, "family");
        var prestigeLean = getLeaderInstitutionPrestigeLean(entry.person, business);
        var weightedTraitEffects = collectTraitEffects(entry.person, ["business"]).map(function(effect){
          return {
            trait:effect.trait,
            channel:effect.channel,
            impact:clampTraitDelta(effect.impact * weights.expansion, 18)
          };
        });

        scores.expansion += getLeaderExpansionLean(entry.person) * weights.expansion;
        scores.staffing += getLeaderStaffingLean(entry.person) * weights.staffing;
        scores.cash += getLeaderCashLean(entry.person) * weights.cash;
        scores.succession += getLeaderSuccessionLean(entry.person, business) * weights.succession;

        scores.expansion += businessTrait * 0.95 * weights.expansion;
        scores.staffing += businessTrait * 0.38 * weights.staffing;
        scores.cash -= businessTrait * 0.32 * weights.cash;
        scores.succession += familyTrait * 0.5 * weights.succession;
        scores.expansion += mobilityTrait * 0.4 * weights.expansion;
        scores.expansion += prestigeLean * 0.24 * weights.expansion;
        scores.staffing += prestigeLean * 0.44 * weights.staffing;
        scores.succession -= prestigeLean * 0.18 * weights.succession;

        decisionTraitEffects = decisionTraitEffects.concat(weightedTraitEffects);
      });

      if (makers.length) {
        institutionPrestige = makers.reduce(function(sum, entry){
          var value = Number(entry.person && entry.person.educationInstitutionQuality);
          if (!Number.isFinite(value)) {
            value = App.utils.clamp(35 + ((Number(entry.person && entry.person.educationIndex) || 0) * 0.62), 20, 100);
          }
          return sum + App.utils.clamp(value, 20, 100);
        }, 0) / makers.length;
        metrics.institutionPrestige = institutionPrestige;
      }

      scores.expansion = clampTraitDelta(scores.expansion, 160);
      scores.staffing = clampTraitDelta(scores.staffing, 140);
      scores.cash = clampTraitDelta(scores.cash, 140);
      scores.succession = clampTraitDelta(scores.succession, 140);
      decisionTraitEffects = summarizeTraitEffects(decisionTraitEffects, 4);
      recordTraitEffects(decisionTraitEffects);

      stance = "balanced";
      if (scores.expansion > 18) {
        stance = "aggressive";
      } else if (scores.expansion < -20) {
        stance = "retrenching";
      } else if (scores.cash > 18 || scores.expansion < -6) {
        stance = "defensive";
      }

      staffingAction = scores.staffing > 14 ? "hire" : (scores.staffing < -14 ? "layoff" : "hold");
      underUtilizedLayoffAllowed =
        demandUtilization >= 0.9 ||
        cashCoverage < 0.95 ||
        profitMargin < -0.16 ||
        business.bankruptcyStage === "distressed" ||
        business.bankruptcyStage === "restructuring" ||
        (business.stage === "declining" && (trend < -0.08 || demandGrowth < -0.05)) ||
        (leverageRatio > 0.35 && (cashCoverage < 1.6 || demandGrowth < -0.06)) ||
        (Number(business.distressScore) || 0) > 1.35;
      if (business.stage === "startup" && employeeCount <= 4 && demandUtilization < 0.9) {
        underUtilizedLayoffAllowed = false;
      }
      if (staffingAction === "layoff" && !underUtilizedLayoffAllowed) {
        staffingAction = "hold";
      }
      cashPolicy = scores.cash > 18 ? "preserve" : (scores.cash < -10 ? "reinvest" : "balanced");
      successionBias = scores.succession > 12 ? "family" : (scores.succession < -12 ? "merit" : "balanced");

      return {
        stance:stance,
        staffingAction:staffingAction,
        cashPolicy:cashPolicy,
        successionBias:successionBias,
        reasons:buildDecisionReasons(business, metrics, makers, decisionTraitEffects),
        traitEffects:decisionTraitEffects,
        influencers:buildDecisionInfluencers(makers),
        scores:{
          expansion:Math.round(scores.expansion),
          staffing:Math.round(scores.staffing),
          cash:Math.round(scores.cash),
          succession:Math.round(scores.succession)
        },
        madeAtDay:App.store.simDay
      };
    }

    function ensureBusinessDecisionState(business){
      if (!business) return;
      ensureBusinessLogo(business);
      primeBusinessDecisionState(business);
      business.unionizationRate = App.utils.clamp(Number(business.unionizationRate) || App.utils.rand(0.05, 0.18), 0.02, 0.82);
      business.laborUnrestScore = App.utils.clamp(Number(business.laborUnrestScore) || 0, 0, 1.6);
      business.layoffPressure = App.utils.clamp(Number(business.layoffPressure) || 0, 0, 1.2);
      business.strikeUntilDay = Math.max(0, Math.floor(Number(business.strikeUntilDay) || 0));
      business.managementQuality = App.utils.clamp(Number(business.managementQuality) || App.utils.rand(42, 68), 10, 98);
      business.wageBillAnnual = Math.max(0, Number(business.wageBillAnnual) || 0);
      business.operatingCostAnnual = Math.max(0, Number(business.operatingCostAnnual) || 0);
      business.hiringNeed = App.utils.clamp(Number(business.hiringNeed) || 0, -600, 600);
      business.supplyStress = App.utils.clamp(Number(business.supplyStress) || 0, 0, 1.8);
      business.tradeShockPressure = App.utils.clamp(Number(business.tradeShockPressure) || 0, 0, 1.8);
      business.tradeRerouteRelief = App.utils.clamp(Number(business.tradeRerouteRelief) || 0, 0, 1.2);
      business.tradeRerouteCapacity = App.utils.clamp(Number(business.tradeRerouteCapacity) || App.utils.rand(0.25, 0.62), 0, 1.2);
      business.tradeShockExposure = App.utils.clamp(Number(business.tradeShockExposure) || getIndustryTradeExposure(business.industry), 0.2, 0.9);
      business.customerTrust = App.utils.clamp(Number(business.customerTrust) || App.utils.rand(42, 64), 0, 100);
      business.productQuality = App.utils.clamp(Number(business.productQuality) || App.utils.rand(45, 68), 0, 100);
      business.pricePower = App.utils.clamp(Number(business.pricePower) || App.utils.rand(0.9, 1.08), 0.62, 1.55);
      business.innovationIndex = App.utils.clamp(Number(business.innovationIndex) || App.utils.rand(28, 56), 0, 100);
      business.technologyEdge = App.utils.clamp(Number(business.technologyEdge) || App.utils.rand(20, 52), 0, 100);
      business.copiedTechDebt = App.utils.clamp(Number(business.copiedTechDebt) || 0, 0, 1.6);
      business.debtGU = Math.max(0, Number(business.debtGU) || 0);
      business.debtInterestRate = App.utils.clamp(Number(business.debtInterestRate) || 0.08, 0.01, 0.34);
      business.debtMaturityDay = Math.max(0, Math.floor(Number(business.debtMaturityDay) || (App.store.simDay + App.utils.randInt(200, 520))));
      business.rolloverRisk = App.utils.clamp(Number(business.rolloverRisk) || 0, 0, 1.6);
      business.founderGuaranteeShare = App.utils.clamp(Number(business.founderGuaranteeShare) || App.utils.rand(0.28, 0.72), 0, 1);
      business.bankruptcyStage = bankruptcyStageOrder.indexOf(String(business.bankruptcyStage || "stable")) === -1 ? "stable" : String(business.bankruptcyStage);
      business.distressScore = App.utils.clamp(Number(business.distressScore) || 0, 0, 4.4);
      business.restructuringUntilDay = Math.max(0, Math.floor(Number(business.restructuringUntilDay) || 0));
      if (!business.departments || typeof business.departments !== "object") {
        business.departments = {};
      }
      if (!business.governance || typeof business.governance !== "object") {
        business.governance = {};
      }
      business.governance.boardSeats = App.utils.clamp(Math.floor(Number(business.governance.boardSeats) || Math.max(3, Math.min(11, 3 + Math.round((business.employees || 1) / 60)))), 3, 13);
      business.governance.familyControlShare = App.utils.clamp(Number(business.governance.familyControlShare) || App.utils.rand(0.4, 0.85), 0.05, 1);
      business.governance.outsideInvestorShare = App.utils.clamp(Number(business.governance.outsideInvestorShare) || App.utils.rand(0.05, 0.26), 0, 0.95);
      business.governance.founderControl = App.utils.clamp(Number(business.governance.founderControl) || App.utils.rand(0.62, 0.94), 0.02, 1);
      business.governance.boardPressure = App.utils.clamp(Number(business.governance.boardPressure) || 0, 0, 1.4);
      business.governance.lastReviewDay = Math.max(0, Math.floor(Number(business.governance.lastReviewDay) || App.store.simDay));
      if (!business.currentDecision) {
        business.currentDecision = evaluateBusinessDecision(business);
      }
      setTraitSnapshot(business, business.currentDecision && business.currentDecision.traitEffects ? business.currentDecision.traitEffects : []);
    }

    function settleLeadershipStates(business){
      var seen = {};
      var owner = App.store.getPerson(business.ownerId);

      App.store.getBusinessLeadership(business).forEach(function(entry){
        if (!entry.person || seen[entry.person.id]) return;
        seen[entry.person.id] = true;
        settleTemporaryStates(entry.person);
      });

      if (owner && !seen[owner.id]) {
        settleTemporaryStates(owner);
      }
    }

    function summarizeDecisionOutcome(decision, employeeDelta, cashDelta, reputationDelta){
      var parts = [];

      if (employeeDelta > 0) parts.push("Hired " + employeeDelta);
      if (employeeDelta < 0) parts.push("Cut " + Math.abs(employeeDelta));
      if (!employeeDelta) parts.push("Held staffing");
      if (decision.cashPolicy === "preserve") parts.push("Preserved cash");
      if (decision.cashPolicy === "reinvest") parts.push("Reinvested aggressively");
      if (cashDelta > 0) parts.push("Cash +" + App.utils.fmtGU(cashDelta));
      if (cashDelta < 0) parts.push("Cash " + App.utils.fmtGU(cashDelta));
      if (reputationDelta > 0.5) parts.push("Reputation up");
      if (reputationDelta < -0.5) parts.push("Reputation down");

      return parts.join(" • ");
    }

    function pushBusinessDecisionHistory(business, entry){
      ensureBusinessDecisionState(business);
      business.decisionHistory.unshift(entry);
      if (business.decisionHistory.length > 12) {
        business.decisionHistory = business.decisionHistory.slice(0, 12);
      }
    }

    function pushBusinessEventHistory(business, summary, reason){
      if (!business) return;

      ensureBusinessDecisionState(business);
      pushBusinessDecisionHistory(business, {
        id:randomId(),
        madeAtDay:App.store.simDay,
        stance:business.currentDecision ? business.currentDecision.stance : "balanced",
        staffingAction:business.currentDecision ? business.currentDecision.staffingAction : "hold",
        cashPolicy:business.currentDecision ? business.currentDecision.cashPolicy : "balanced",
        successionBias:business.currentDecision ? business.currentDecision.successionBias : "balanced",
        summary:summary,
        reasons:[reason],
        traitEffects:(business.currentDecision && business.currentDecision.traitEffects ? business.currentDecision.traitEffects.slice(0, 4) : []),
        influencers:(business.currentDecision && business.currentDecision.influencers ? business.currentDecision.influencers.slice(0, 3) : [])
      });
    }

    return {
      runBusinessTick:function(){
        if (typeof api.processBusinessTick === "function") {
          api.processBusinessTick();
        }
      },
      runOrganizationTick:function(){
        if (typeof api.syncCorporateLadders === "function") {
          api.syncCorporateLadders();
        }
      },
      evaluateDecision:evaluateBusinessDecision,
      ensureDecisionState:ensureBusinessDecisionState,
      settleLeadershipStates:settleLeadershipStates,
      getBusinessStageFactor:getBusinessStageFactor,
      getBusinessAnnualGrowthBands:getBusinessAnnualGrowthBands,
      getBusinessRevenueFloor:getBusinessRevenueFloorGU,
      getBusinessRealizedRevenueCap:getBusinessRealizedRevenueCap,
      getBusinessHeadcountRealityCap:getBusinessHeadcountRealityCap,
      computeBusinessAnnualRevenueTarget:computeBusinessAnnualRevenueTarget,
      getStageExpansionBias:getStageExpansionBias,
      evaluateLifecycleStage:evaluateBusinessLifecycleStage,
      getRecoverySignal:getBusinessRecoverySignal,
      getIndustrySupplyPressure:getIndustrySupplyPressure,
      computeTradeShockTransmission:computeTradeShockTransmission,
      updateCountryTradeShockSignals:updateCountryTradeShockSignals,
      processYearlyCorporateGovernance:processYearlyCorporateGovernance,
      processYearlyInnovationAndCopying:processYearlyInnovationAndCopying,
      processYearlyFamilyBusinessGrooming:processYearlyFamilyBusinessGrooming,
      processYearlyPromotionsAndPoaching:processYearlyPromotionsAndPoaching,
      getHouseholdLaunchReadiness:getHouseholdLaunchReadiness,
      getFounderAptitude:getFounderAptitude,
      buildYearlyLaunchContext:buildYearlyLaunchContext,
      getLaunchDensityMultiplier:getLaunchDensityMultiplier,
      tryLaunchBusiness:tryLaunchBusiness,
      processYearlyLaunches:processYearlyLaunches,
      getSuccessionCandidates:getSuccessionCandidates,
      evaluateSuccessionCandidate:evaluateSuccessionCandidate,
      getPotentialHeir:getPotentialHeir,
      getSuccessionEvaluations:getSuccessionEvaluations,
      resolveInheritanceDispute:resolveInheritanceDispute,
      pickSuccessionOutcome:pickSuccessionOutcome,
      applySuccessionOutcome:applySuccessionOutcome,
      transferBusiness:transferBusiness,
      refreshFirmStructure:refreshBusinessFirmStructure,
      applyCustomerDemandAndReputationDynamics:applyCustomerDemandAndReputationDynamics,
      getReserveShareRate:getReserveShareRate,
      applyDebtCreditAndBankruptcyStages:applyDebtCreditAndBankruptcyStages,
      summarizeDecisionOutcome:summarizeDecisionOutcome,
      pushDecisionHistory:pushBusinessDecisionHistory,
      pushEventHistory:pushBusinessEventHistory
    };
  };
})(window);