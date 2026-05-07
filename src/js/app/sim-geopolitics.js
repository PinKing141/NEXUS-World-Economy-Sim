(function(global){
  var App = global.Nexus || (global.Nexus = {});

  App.simDomains = App.simDomains || {};

  App.simDomains.createGeopoliticsEngine = function createGeopoliticsEngine(handlers){
    var api = handlers || {};
    var missingRequiredHandlers = [];

    function requireHandler(name, fallback){
      if (typeof api[name] !== "function") {
        missingRequiredHandlers.push(name);
        return typeof fallback === "function" ? fallback : function(){};
      }
      return api[name];
    }

    var runRandomEventRoll = requireHandler("runRandomEventRoll", function(){});
    var runSimulationHealthGovernors = requireHandler("runSimulationHealthGovernors", function(){});
    var currentYear = requireHandler("currentYear", function(){ return 0; });
    var isTier6Slice1Enabled = requireHandler("isTier6Slice1Enabled", function(){ return false; });
    var getTier6Slice1Config = requireHandler("getTier6Slice1Config", function(){ return {}; });
    var ensureCountryProfile = requireHandler("ensureCountryProfile", function(){ return null; });
    var ensureTier6SanctionLanes = requireHandler("ensureTier6SanctionLanes", function(){ return {}; });
    var getSanctionLane = requireHandler("getSanctionLane", function(){ return null; });
    var emitNews = requireHandler("emitNews", function(){});
    var hashString = requireHandler("hashString", function(){ return 0; });
    var pickWeightedBy = requireHandler("pickWeightedBy", function(){ return null; });

    function getBlocDemocracyScore(bloc){
      var profiles;
      var institutionAvg = 0;
      var corruptionAvg = 0;

      if (!bloc) return 0;

      profiles = (App.store.getBlocProfiles ? App.store.getBlocProfiles(bloc.id) : []).filter(Boolean);
      if (!profiles.length) return 0;

      institutionAvg = profiles.reduce(function(sum, profile){
        return sum + App.utils.clamp(Number(profile && profile.institutionScore) || 0.55, 0, 1);
      }, 0) / profiles.length;
      corruptionAvg = profiles.reduce(function(sum, profile){
        return sum + App.utils.clamp(Number(profile && profile.developmentCorruptionIndex) || 0.42, 0, 1);
      }, 0) / profiles.length;

      return App.utils.clamp((institutionAvg * 0.62) + ((1 - corruptionAvg) * 0.38), 0, 1);
    }

    function isBlocElectionEligible(bloc){
      return getBlocDemocracyScore(bloc) >= 0.52;
    }

    function toFiniteNumber(value, fallback){
      var numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallback;
    }

    function normalizeSectorWeights(weights){
      var source = weights && typeof weights === "object" ? weights : {};
      var next = {};
      var keys = Object.keys(source).filter(function(key){
        return !!key;
      });
      var total = 0;

      keys.forEach(function(key){
        var weight = Math.max(0, toFiniteNumber(source[key], 0));
        if (weight <= 0) return;
        next[key] = weight;
        total += weight;
      });

      if (total <= 0) return {};

      Object.keys(next).forEach(function(key){
        next[key] = Number((next[key] / total).toFixed(4));
      });

      return next;
    }

    function getDominantSectorWeight(weights){
      return Object.keys(weights || {}).reduce(function(maxWeight, key){
        return Math.max(maxWeight, App.utils.clamp(Number(weights[key]) || 0, 0, 1));
      }, 0);
    }

    function getTradeWarRetaliationConfig(config){
      var source = config && typeof config === "object" ? config : {};

      return {
        retaliationPressureThreshold:App.utils.clamp(toFiniteNumber(source.retaliationPressureThreshold, 0.18), 0.05, 1),
        retaliationActivationThreshold:App.utils.clamp(toFiniteNumber(source.retaliationActivationThreshold, 0.12), 0.05, 1),
        retaliationBilateralEscalationThreshold:App.utils.clamp(toFiniteNumber(source.retaliationBilateralEscalationThreshold, 0.22), 0.08, 1),
        retaliationDecay:App.utils.clamp(toFiniteNumber(source.retaliationDecay, 0.76), 0.4, 0.95),
        retaliationCooldownYears:Math.max(1, Math.round(toFiniteNumber(source.retaliationCooldownYears, 2))),
        retaliationTradeBlockCap:App.utils.clamp(toFiniteNumber(source.retaliationTradeBlockCap, 0.48), 0.08, 1),
        retaliationRerouteCap:App.utils.clamp(toFiniteNumber(source.retaliationRerouteCap, 0.7), 0.08, 1.2),
        retaliationEmploymentDragCap:App.utils.clamp(toFiniteNumber(source.retaliationEmploymentDragCap, 0.34), 0.05, 1)
      };
    }

    function collectBlocIndustryWeights(blocId){
      var totals = {};
      var totalWeight = 0;

      (App.store.businesses || []).forEach(function(business){
        var industry;
        var weight;

        if (!business || String(business.blocId || "") !== String(blocId || "")) return;
        industry = String(business.industry || "general").trim().toLowerCase();
        if (!industry) industry = "general";
        weight =
          Math.max(1, toFiniteNumber(business.employees, 0)) +
          (Math.max(0, toFiniteNumber(business.revenueGU, 0)) * 0.00006) +
          (Math.max(0, toFiniteNumber(business.valuationGU, 0)) * 0.000015);
        totals[industry] = (totals[industry] || 0) + weight;
        totalWeight += weight;
      });

      if (totalWeight <= 0) return { general:1 };

      Object.keys(totals).forEach(function(industry){
        totals[industry] = totals[industry] / totalWeight;
      });

      return totals;
    }

    function buildRetaliationSectorWeights(sourceBlocId, targetBlocId){
      var sourceWeights = collectBlocIndustryWeights(sourceBlocId);
      var targetWeights = collectBlocIndustryWeights(targetBlocId);
      var combined = {};
      var ranked;
      var next = {};

      Object.keys(sourceWeights).concat(Object.keys(targetWeights)).forEach(function(industry){
        var sourceWeight = App.utils.clamp(Number(sourceWeights[industry]) || 0, 0, 1);
        var targetWeight = App.utils.clamp(Number(targetWeights[industry]) || 0, 0, 1);
        var overlap;
        var asymmetry;
        var score;

        if (combined[industry] != null) return;
        overlap = Math.min(sourceWeight, targetWeight);
        asymmetry = Math.max(targetWeight - (sourceWeight * 0.32), 0);
        score = (overlap * 0.58) + (asymmetry * 0.42);
        if (score > 0) {
          combined[industry] = score;
        }
      });

      ranked = Object.keys(combined).sort(function(first, second){
        return combined[second] - combined[first];
      }).slice(0, 4);
      ranked.forEach(function(industry){
        next[industry] = combined[industry];
      });

      if (!ranked.length) {
        next.general = 1;
      }

      return normalizeSectorWeights(next);
    }

    function processTier6Slice1ElectionsYearly(){
      var year = currentYear();
      var config = getTier6Slice1Config();

      if (!isTier6Slice1Enabled() || !config.elections) return;

      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);
        var cycle;
        var offset;
        var electionYear;
        var laborForce;
        var unemploymentRate;
        var populism;
        var socialUnrest;
        var gini;
        var laborScarcity;
        var pressure;
        var biasBefore;
        var biasAfter;
        var bloc;
        var electionEligible;
        var taxIndex;
        var tradeIndex;
        var laborIndex;
        var immigrationIndex;
        var confidenceIndex;
        var electionSignal;
        var direction = 0;

        if (!profile) return;

        bloc = App.store.getBloc(profile.blocId) || App.store.getBlocByCountry(iso);
        electionEligible = isBlocElectionEligible(bloc);
        cycle = Math.max(2, config.electionCycleMinYears + (hashString(iso + "-cycle") % Math.max(1, config.electionCycleSpanYears)));
        offset = hashString(iso + "-offset") % cycle;
        electionYear = electionEligible && ((year + offset) % cycle) === 0;
        laborForce = Math.max(1, Number(profile.laborForce) || 1);
        unemploymentRate = App.utils.clamp(Math.max(0, Number(profile.unemployed) || 0) / laborForce, 0, 1);
        populism = App.utils.clamp(Number(profile.populismIndex) || 0, 0, 1.6);
        socialUnrest = App.utils.clamp(Number(profile.socialUnrestIndex) || 0, 0, 1.8);
        gini = App.utils.clamp(Number(profile.giniCoefficient) || 0.4, 0.2, 0.8);
        laborScarcity = App.utils.clamp(Number(profile.laborScarcity) || 0, 0, 1);
        pressure = App.utils.clamp((populism * 0.42) + (socialUnrest * 0.2) + (unemploymentRate * 0.75) + ((gini - 0.35) * 0.55), 0, 1.8);
        biasBefore = App.utils.clamp(Number(profile.tier6ElectionBias) || 0, -0.9, 0.9);
        taxIndex = App.utils.clamp(Number(profile.electionTaxPolicyIndex) || 0, -0.55, 0.55);
        tradeIndex = App.utils.clamp(Number(profile.electionTradePolicyIndex) || 0, -0.55, 0.55);
        laborIndex = App.utils.clamp(Number(profile.electionLaborPolicyIndex) || 0, -0.55, 0.55);
        immigrationIndex = App.utils.clamp(Number(profile.electionImmigrationPolicyIndex) || 0, -0.55, 0.55);
        confidenceIndex = App.utils.clamp(Number(profile.electionBusinessConfidenceIndex) || 0, -0.6, 0.6);

        if (electionYear) {
          if (pressure >= 0.62) {
            direction = 1;
          } else if (laborScarcity >= 0.78 && unemploymentRate <= 0.08) {
            direction = -1;
          }

          biasAfter = App.utils.clamp((biasBefore * 0.38) + (direction * 0.32), -0.9, 0.9);
          electionSignal = App.utils.clamp((pressure * 0.62) + (Math.abs(direction) * 0.38), 0, 1.5);
          taxIndex = App.utils.clamp((taxIndex * 0.35) + (direction * electionSignal * 0.26), -0.55, 0.55);
          tradeIndex = App.utils.clamp((tradeIndex * 0.35) + ((-direction) * electionSignal * 0.24), -0.55, 0.55);
          laborIndex = App.utils.clamp((laborIndex * 0.35) + (direction * electionSignal * 0.22), -0.55, 0.55);
          immigrationIndex = App.utils.clamp((immigrationIndex * 0.35) + ((-direction) * electionSignal * 0.29), -0.55, 0.55);
          confidenceIndex = App.utils.clamp((confidenceIndex * 0.32) + (((-direction) * 0.22) + ((0.5 - Math.abs(direction)) * 0.08)), -0.6, 0.6);

          if (direction !== 0 && (hashString(iso + "-election-news-" + year) % 100) < config.electionNewsHashGate) {
            emitNews("policy", "<strong>" + App.store.getCountryName(iso) + "</strong> completed elections with a " + (direction > 0 ? "tightening" : "supportive") + " mandate.", {
              entities:{
                countryIsos:[iso],
                blocIds:[profile.blocId].filter(Boolean)
              },
              causes:[
                "Election pressure index: " + pressure.toFixed(2),
                "Policy channels adjusted for tax, trade, labor, immigration, and business confidence."
              ],
              scope:"regional",
              rollupLabel:iso
            });
          }
        } else {
          biasAfter = App.utils.clamp(biasBefore * config.electionChannelDecay, -0.9, 0.9);
          taxIndex = App.utils.clamp(taxIndex * config.electionChannelDecay, -0.55, 0.55);
          tradeIndex = App.utils.clamp(tradeIndex * config.electionChannelDecay, -0.55, 0.55);
          laborIndex = App.utils.clamp(laborIndex * config.electionChannelDecay, -0.55, 0.55);
          immigrationIndex = App.utils.clamp(immigrationIndex * config.electionChannelDecay, -0.55, 0.55);
          confidenceIndex = App.utils.clamp(confidenceIndex * config.electionChannelDecay, -0.6, 0.6);
        }

        profile.tier6ElectionBias = biasAfter;
        profile.electionTaxPolicyIndex = taxIndex;
        profile.electionTradePolicyIndex = tradeIndex;
        profile.electionLaborPolicyIndex = laborIndex;
        profile.electionImmigrationPolicyIndex = immigrationIndex;
        profile.electionBusinessConfidenceIndex = confidenceIndex;
        profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
        profile.policyEvidence.tier6Slice = "slice1";
        profile.policyEvidence.electionCycleYears = cycle;
        profile.policyEvidence.electionTriggered = !!electionYear;
        profile.policyEvidence.electionEligible = !!electionEligible;
        profile.policyEvidence.electionDirection = direction;
        profile.policyEvidence.electionPressureIndex = Number(pressure.toFixed(4));
        profile.policyEvidence.electionBias = Number(biasAfter.toFixed(4));
        profile.policyEvidence.electionTaxPolicyIndex = Number(taxIndex.toFixed(4));
        profile.policyEvidence.electionTradePolicyIndex = Number(tradeIndex.toFixed(4));
        profile.policyEvidence.electionLaborPolicyIndex = Number(laborIndex.toFixed(4));
        profile.policyEvidence.electionImmigrationPolicyIndex = Number(immigrationIndex.toFixed(4));
        profile.policyEvidence.electionBusinessConfidenceIndex = Number(confidenceIndex.toFixed(4));
        profile.policyEvidence.conflictPhaseEnabled = !!config.conflictPhaseEnabled;
      });
    }

    function processTier6Slice1SanctionsYearly(){
      var year = currentYear();
      var lanes;
      var sanctionNewsBudget = 4;
      var conflictScale;
      var sanctionGeoThreshold;
      var sanctionActivationThreshold;
      var config = getTier6Slice1Config();
      var tradeWarConfig = getTradeWarRetaliationConfig(config);

      if (!isTier6Slice1Enabled() || !config.sanctions) return;

      lanes = ensureTier6SanctionLanes();
      conflictScale = config.conflictPhaseEnabled ? 1 : 0.62;
      sanctionGeoThreshold = config.sanctionGeoPressureThreshold + (config.conflictPhaseEnabled ? 0 : 0.3);
      sanctionActivationThreshold = config.conflictPhaseEnabled ? 0.08 : 0.18;

      Object.keys(lanes).forEach(function(key){
        var lane = lanes[key];

        if (!lane || lane.lastUpdatedYear === year) return;
        lane.sanctionPressure = App.utils.clamp((Number(lane.sanctionPressure) || 0) * config.sanctionLaneDecay, 0, 1);
        lane.tradeBlockIndex = App.utils.clamp((Number(lane.tradeBlockIndex) || 0) * config.sanctionLaneDecay, 0, 1);
        lane.financeBlockIndex = App.utils.clamp((Number(lane.financeBlockIndex) || 0) * config.sanctionLaneDecay, 0, 1);
        lane.dealBlockIndex = App.utils.clamp((Number(lane.dealBlockIndex) || 0) * config.sanctionLaneDecay, 0, 1);
        lane.rerouteProgressIndex = App.utils.clamp((Number(lane.rerouteProgressIndex) || 0) * 0.9, 0, 1);
        lane.retaliationPressureIndex = App.utils.clamp((Number(lane.retaliationPressureIndex) || 0) * tradeWarConfig.retaliationDecay, 0, 1);
        lane.retaliationTradeBlockIndex = App.utils.clamp((Number(lane.retaliationTradeBlockIndex) || 0) * tradeWarConfig.retaliationDecay, 0, tradeWarConfig.retaliationTradeBlockCap);
        lane.rerouteCounterPressureIndex = App.utils.clamp((Number(lane.rerouteCounterPressureIndex) || 0) * 0.88, 0, tradeWarConfig.retaliationRerouteCap);
        lane.sectorEmploymentDrag = App.utils.clamp((Number(lane.sectorEmploymentDrag) || 0) * tradeWarConfig.retaliationDecay, 0, tradeWarConfig.retaliationEmploymentDragCap);
        lane.sectorRetaliationWeights = normalizeSectorWeights(lane.sectorRetaliationWeights);
        lane.lastRetaliationYear = Math.max(-1, Math.round(toFiniteNumber(lane.lastRetaliationYear, -1)));
        lane.retaliationCooldownUntilYear = Math.max(-1, Math.round(toFiniteNumber(lane.retaliationCooldownUntilYear, -1)));
        lane.retaliationActive = (Number(lane.retaliationTradeBlockIndex) || 0) >= 0.08 || (Number(lane.retaliationPressureIndex) || 0) >= tradeWarConfig.retaliationActivationThreshold;
        lane.active = lane.tradeBlockIndex >= 0.09 || lane.financeBlockIndex >= 0.09 || lane.dealBlockIndex >= 0.09;
      });

      (App.store.blocs || []).forEach(function(bloc){
        var geoPressure;
        var defaultRisk;
        var inequality;
        var sanctionPressure;
        var target;
        var lane;
        var rerouteDrag;
        var outgoingTargets = [];

        if (!bloc) return;

        geoPressure = App.utils.clamp(Number(bloc.geoPressure) || 0, 0, 3);
        defaultRisk = App.utils.clamp(Number(bloc.defaultRisk) || 0, 0, 2.5);
        inequality = App.utils.clamp(Number(bloc.topOneWealthShare) || 0.3, 0.12, 0.95);
        sanctionPressure = App.utils.clamp(((geoPressure - sanctionGeoThreshold) + (defaultRisk * 0.16) + (Math.max(0, inequality - 0.45) * 0.18)) * conflictScale, 0, config.sanctionPressureMax);

        target = pickWeightedBy((App.store.blocs || []).filter(function(candidate){
          return candidate && candidate.id !== bloc.id;
        }), function(candidate){
          var bilateralNoise = ((hashString(bloc.id + ":" + candidate.id + ":" + year) % 1000) / 1000) * 0.18;
          var pressureGap = Math.abs((Number(candidate.geoPressure) || 0) - geoPressure);
          var risk = App.utils.clamp(Number(candidate.defaultRisk) || 0, 0, 2.5);
          return App.utils.clamp((Number(candidate.geoPressure) || 0) * 0.42 + pressureGap * 0.28 + risk * 0.22 + bilateralNoise, 0.01, 4.8);
        });

        if (target && sanctionPressure > sanctionActivationThreshold) {
          lane = getSanctionLane(bloc.id, target.id);
          lane.sanctionPressure = App.utils.clamp((Number(lane.sanctionPressure) || 0) * 0.46 + sanctionPressure * (0.68 * conflictScale), 0, 1);
          lane.tradeBlockIndex = App.utils.clamp((Number(lane.tradeBlockIndex) || 0) * 0.5 + lane.sanctionPressure * (0.74 * conflictScale), 0, 1);
          lane.financeBlockIndex = App.utils.clamp((Number(lane.financeBlockIndex) || 0) * 0.48 + lane.sanctionPressure * (0.66 * conflictScale), 0, config.sanctionFinanceBlockCap);
          lane.dealBlockIndex = App.utils.clamp((Number(lane.dealBlockIndex) || 0) * 0.44 + lane.sanctionPressure * (0.62 * conflictScale), 0, config.sanctionDealBlockCap);
          lane.rerouteProgressIndex = App.utils.clamp((Number(lane.rerouteProgressIndex) || 0) * 0.72 + lane.tradeBlockIndex * 0.16, 0, 1);
          lane.lastUpdatedYear = year;
          lane.active = true;
          outgoingTargets.push(target.id);

          if (sanctionNewsBudget > 0 && lane.tradeBlockIndex >= (config.conflictPhaseEnabled ? 0.22 : 0.34) && lane.lastNewsYear !== year) {
            emitNews("trade", "<strong>" + bloc.name + "</strong> imposed sanctions on <strong>" + target.name + "</strong>, restricting trade, finance, and deal flow.", {
              entities:{
                blocIds:[bloc.id, target.id]
              },
              causes:[
                "Sanction pressure index: " + sanctionPressure.toFixed(2),
                "Affected channels: trade block " + lane.tradeBlockIndex.toFixed(2) + ", finance block " + lane.financeBlockIndex.toFixed(2) + ", deal block " + lane.dealBlockIndex.toFixed(2) + "."
              ],
              scope:"global",
              rollupLabel:bloc.id + "-" + target.id
            });
            lane.lastNewsYear = year;
            sanctionNewsBudget -= 1;
          }
        }

        (bloc.members || []).forEach(function(iso){
          var profile = ensureCountryProfile(iso, bloc.id);
          var outgoingTrade = 0;
          var outgoingFinance = 0;
          var outgoingDeal = 0;

          if (!profile) return;

          Object.keys(lanes).forEach(function(key){
            var item = lanes[key];
            if (!item || item.sourceBlocId !== bloc.id) return;
            outgoingTrade = Math.max(outgoingTrade, App.utils.clamp(Number(item.tradeBlockIndex) || 0, 0, 1));
            outgoingFinance = Math.max(outgoingFinance, App.utils.clamp(Number(item.financeBlockIndex) || 0, 0, 1));
            outgoingDeal = Math.max(outgoingDeal, App.utils.clamp(Number(item.dealBlockIndex) || 0, 0, 1));
          });

          rerouteDrag = App.utils.clamp(outgoingTrade * (1 - App.utils.clamp(Number(profile.tradeRerouteRelief) || 0, 0, 1.2) * 0.62), 0, 1);
          profile.sanctionTradeBlockIndex = App.utils.clamp((Number(profile.sanctionTradeBlockIndex) || 0) * 0.72 + outgoingTrade * 0.62, 0, 1);
          profile.sanctionFinanceBlockIndex = App.utils.clamp((Number(profile.sanctionFinanceBlockIndex) || 0) * 0.72 + outgoingFinance * 0.62, 0, 1);
          profile.sanctionDealBlockIndex = App.utils.clamp((Number(profile.sanctionDealBlockIndex) || 0) * 0.72 + outgoingDeal * 0.62, 0, 1);
          profile.tradeShockIndex = App.utils.clamp((App.utils.clamp(Number(profile.tradeShockIndex) || 0, 0, 1.8) * 0.72) + (sanctionPressure * 0.2) + (rerouteDrag * 0.22), 0, 1.8);
          profile.tradeRerouteRelief = App.utils.clamp((App.utils.clamp(Number(profile.tradeRerouteRelief) || 0, 0, 1.2) * 0.82) + (sanctionPressure * 0.16) + (profile.sanctionTradeBlockIndex * 0.1), 0, 1.2);
          profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
          profile.policyEvidence.tier6Slice = "slice1";
          profile.policyEvidence.sanctionPressureIndex = Number(sanctionPressure.toFixed(4));
          profile.policyEvidence.sanctionTradeBlockIndex = Number((Number(profile.sanctionTradeBlockIndex) || 0).toFixed(4));
          profile.policyEvidence.sanctionFinanceBlockIndex = Number((Number(profile.sanctionFinanceBlockIndex) || 0).toFixed(4));
          profile.policyEvidence.sanctionDealBlockIndex = Number((Number(profile.sanctionDealBlockIndex) || 0).toFixed(4));
          profile.policyEvidence.conflictPhaseEnabled = !!config.conflictPhaseEnabled;
        });

        bloc.policyEvidence = bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : {};
        bloc.policyEvidence.tier6Slice = "slice1";
        bloc.policyEvidence.sanctionPressureIndex = Number(sanctionPressure.toFixed(4));
        bloc.policyEvidence.sanctionTargets = outgoingTargets.slice(0, 4);
        bloc.policyEvidence.sanctionOutgoingCount = outgoingTargets.length;
        bloc.policyEvidence.conflictPhaseEnabled = !!config.conflictPhaseEnabled;
        bloc.tier6ConflictPhaseEnabled = !!config.conflictPhaseEnabled;
      });

      Object.keys(lanes).forEach(function(key){
        var incomingLane = lanes[key];
        var respondingBloc;
        var reverseLane;
        var responseGeoPressure;
        var responseDefaultRisk;
        var responsePressure;
        var bilateralEscalation;
        var sectorWeights;
        var dominantSectorWeight;
        var cooldownSatisfied;
        var tradeBlockIndex;

        if (!incomingLane) return;

        respondingBloc = App.store.getBloc(incomingLane.targetBlocId);
        if (!respondingBloc) return;

        reverseLane = getSanctionLane(incomingLane.targetBlocId, incomingLane.sourceBlocId);
        responseGeoPressure = App.utils.clamp(Number(respondingBloc.geoPressure) || 0, 0, 3);
        responseDefaultRisk = App.utils.clamp(Number(respondingBloc.defaultRisk) || 0, 0, 2.5);
        responsePressure = App.utils.clamp(
          (App.utils.clamp(Number(incomingLane.tradeBlockIndex) || 0, 0, 1) * 0.46) +
          (App.utils.clamp(Number(incomingLane.financeBlockIndex) || 0, 0, 1) * 0.24) +
          (App.utils.clamp(Number(incomingLane.dealBlockIndex) || 0, 0, 1) * 0.18) +
          (Math.max(0, responseGeoPressure - sanctionGeoThreshold) * 0.14) +
          (responseDefaultRisk * 0.08),
          0,
          1
        );
        bilateralEscalation =
          App.utils.clamp(Number(incomingLane.sanctionPressure) || 0, 0, 1) >= tradeWarConfig.retaliationBilateralEscalationThreshold &&
          App.utils.clamp(Number(reverseLane.sanctionPressure) || 0, 0, 1) >= tradeWarConfig.retaliationBilateralEscalationThreshold;
        cooldownSatisfied = reverseLane.retaliationActive || year >= Math.max(-1, Number(reverseLane.retaliationCooldownUntilYear) || -1);

        if (responsePressure < tradeWarConfig.retaliationPressureThreshold) return;
        if (!cooldownSatisfied) return;
        if (!incomingLane.active && !bilateralEscalation) return;

        sectorWeights = buildRetaliationSectorWeights(reverseLane.sourceBlocId, reverseLane.targetBlocId);
        dominantSectorWeight = getDominantSectorWeight(sectorWeights);
        reverseLane.retaliationPressureIndex = App.utils.clamp(((Number(reverseLane.retaliationPressureIndex) || 0) * 0.42) + (responsePressure * 0.74), 0, 1);
        tradeBlockIndex = App.utils.clamp(((Number(reverseLane.retaliationTradeBlockIndex) || 0) * 0.34) + (reverseLane.retaliationPressureIndex * 0.58), 0, tradeWarConfig.retaliationTradeBlockCap);
        reverseLane.retaliationTradeBlockIndex = tradeBlockIndex;
        reverseLane.rerouteCounterPressureIndex = App.utils.clamp(((Number(reverseLane.rerouteCounterPressureIndex) || 0) * 0.44) + (tradeBlockIndex * 0.64), 0, tradeWarConfig.retaliationRerouteCap);
        reverseLane.sectorEmploymentDrag = App.utils.clamp(((Number(reverseLane.sectorEmploymentDrag) || 0) * 0.4) + (tradeBlockIndex * Math.max(0.12, dominantSectorWeight) * 0.68), 0, tradeWarConfig.retaliationEmploymentDragCap);
        reverseLane.sectorRetaliationWeights = sectorWeights;
        reverseLane.retaliationSourceLaneKey = key;
        reverseLane.lastRetaliationYear = year;
        reverseLane.retaliationCooldownUntilYear = reverseLane.retaliationActive ? year : (year + tradeWarConfig.retaliationCooldownYears);
        reverseLane.retaliationActive = reverseLane.retaliationTradeBlockIndex >= 0.08 || reverseLane.retaliationPressureIndex >= tradeWarConfig.retaliationActivationThreshold;
      });

      (App.store.blocs || []).forEach(function(bloc){
        var targetExposure = {
          trade:0,
          finance:0,
          deal:0,
          reroute:0,
          retaliationPressure:0,
          retaliationTrade:0,
          rerouteCounter:0,
          employmentDrag:0,
          sectorWeights:{}
        };

        if (!bloc) return;

        Object.keys(lanes).forEach(function(key){
          var lane = lanes[key];
          var retaliationTrade;
          if (!lane || lane.targetBlocId !== bloc.id) return;
          targetExposure.trade = Math.max(targetExposure.trade, App.utils.clamp(Number(lane.tradeBlockIndex) || 0, 0, 1));
          targetExposure.finance = Math.max(targetExposure.finance, App.utils.clamp(Number(lane.financeBlockIndex) || 0, 0, 1));
          targetExposure.deal = Math.max(targetExposure.deal, App.utils.clamp(Number(lane.dealBlockIndex) || 0, 0, 1));
          targetExposure.reroute = Math.max(targetExposure.reroute, App.utils.clamp(Number(lane.rerouteProgressIndex) || 0, 0, 1));
          targetExposure.retaliationPressure = Math.max(targetExposure.retaliationPressure, App.utils.clamp(Number(lane.retaliationPressureIndex) || 0, 0, 1));
          retaliationTrade = App.utils.clamp(Number(lane.retaliationTradeBlockIndex) || 0, 0, tradeWarConfig.retaliationTradeBlockCap);
          if (retaliationTrade >= targetExposure.retaliationTrade) {
            targetExposure.retaliationTrade = retaliationTrade;
            targetExposure.sectorWeights = normalizeSectorWeights(lane.sectorRetaliationWeights);
          }
          targetExposure.rerouteCounter = Math.max(targetExposure.rerouteCounter, App.utils.clamp(Number(lane.rerouteCounterPressureIndex) || 0, 0, tradeWarConfig.retaliationRerouteCap));
          targetExposure.employmentDrag = Math.max(targetExposure.employmentDrag, App.utils.clamp(Number(lane.sectorEmploymentDrag) || 0, 0, tradeWarConfig.retaliationEmploymentDragCap));
        });

        (bloc.members || []).forEach(function(iso){
          var profile = ensureCountryProfile(iso, bloc.id);
          var rerouteHeadroom;

          if (!profile) return;

          rerouteHeadroom = Math.max(0, 1 - targetExposure.reroute);
          profile.sanctionTradeBlockIndex = App.utils.clamp((Number(profile.sanctionTradeBlockIndex) || 0) * 0.66 + targetExposure.trade * 0.76, 0, 1);
          profile.sanctionFinanceBlockIndex = App.utils.clamp((Number(profile.sanctionFinanceBlockIndex) || 0) * 0.66 + targetExposure.finance * 0.76, 0, 1);
          profile.sanctionDealBlockIndex = App.utils.clamp((Number(profile.sanctionDealBlockIndex) || 0) * 0.66 + targetExposure.deal * 0.76, 0, 1);
          profile.tradeShockIndex = App.utils.clamp((Number(profile.tradeShockIndex) || 0) + targetExposure.trade * 0.18 * rerouteHeadroom, 0, 1.8);
          profile.tradeRerouteRelief = App.utils.clamp((Number(profile.tradeRerouteRelief) || 0) + targetExposure.trade * 0.18 * targetExposure.reroute, 0, 1.2);
          profile.retaliationPressureIndex = App.utils.clamp(((Number(profile.retaliationPressureIndex) || 0) * 0.62) + (targetExposure.retaliationPressure * 0.68), 0, 1);
          profile.sectorTradeBlockIndex = App.utils.clamp(((Number(profile.sectorTradeBlockIndex) || 0) * 0.62) + (targetExposure.retaliationTrade * 0.74), 0, tradeWarConfig.retaliationTradeBlockCap);
          profile.rerouteCounterPressureIndex = App.utils.clamp(((Number(profile.rerouteCounterPressureIndex) || 0) * 0.62) + (targetExposure.rerouteCounter * 0.74), 0, tradeWarConfig.retaliationRerouteCap);
          profile.sectorEmploymentDrag = App.utils.clamp(((Number(profile.sectorEmploymentDrag) || 0) * 0.58) + (targetExposure.employmentDrag * 0.8), 0, tradeWarConfig.retaliationEmploymentDragCap);
          profile.sectorRetaliationWeights = normalizeSectorWeights(targetExposure.sectorWeights);
          profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
          profile.policyEvidence.sanctionTargetTradeBlockIndex = Number(targetExposure.trade.toFixed(4));
          profile.policyEvidence.sanctionTargetFinanceBlockIndex = Number(targetExposure.finance.toFixed(4));
          profile.policyEvidence.sanctionTargetDealBlockIndex = Number(targetExposure.deal.toFixed(4));
          profile.policyEvidence.sanctionRerouteProgressIndex = Number(targetExposure.reroute.toFixed(4));
          profile.policyEvidence.retaliationSlice = "slice2";
          profile.policyEvidence.retaliationPressureIndex = Number(targetExposure.retaliationPressure.toFixed(4));
          profile.policyEvidence.sectorTradeBlockIndex = Number(targetExposure.retaliationTrade.toFixed(4));
          profile.policyEvidence.rerouteCounterPressureIndex = Number(targetExposure.rerouteCounter.toFixed(4));
          profile.policyEvidence.sectorEmploymentDrag = Number(targetExposure.employmentDrag.toFixed(4));
          profile.policyEvidence.sectorRetaliationWeights = normalizeSectorWeights(targetExposure.sectorWeights);
        });

        bloc.policyEvidence = bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : {};
        bloc.policyEvidence.sanctionIncomingTradeBlockIndex = Number(targetExposure.trade.toFixed(4));
        bloc.policyEvidence.sanctionIncomingFinanceBlockIndex = Number(targetExposure.finance.toFixed(4));
        bloc.policyEvidence.sanctionIncomingDealBlockIndex = Number(targetExposure.deal.toFixed(4));
        bloc.policyEvidence.sanctionRerouteProgressIndex = Number(targetExposure.reroute.toFixed(4));
        bloc.policyEvidence.retaliationSlice = "slice2";
        bloc.policyEvidence.retaliationPressureIndex = Number(targetExposure.retaliationPressure.toFixed(4));
        bloc.policyEvidence.sectorTradeBlockIndex = Number(targetExposure.retaliationTrade.toFixed(4));
        bloc.policyEvidence.rerouteCounterPressureIndex = Number(targetExposure.rerouteCounter.toFixed(4));
        bloc.policyEvidence.sectorEmploymentDrag = Number(targetExposure.employmentDrag.toFixed(4));
        bloc.policyEvidence.sectorRetaliationWeights = normalizeSectorWeights(targetExposure.sectorWeights);
      });
    }

    if (missingRequiredHandlers.length) {
      throw new Error("Geopolitics engine missing required handlers: " + missingRequiredHandlers.join(", "));
    }

    return {
      runEventTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.includeRandom !== false) {
          runRandomEventRoll();
        }
      },
      runGovernors:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.applyGovernors !== false) {
          runSimulationHealthGovernors();
        }
      },
      runYearlySlice:function(){
        if (!isTier6Slice1Enabled()) return;
        processTier6Slice1ElectionsYearly();
        processTier6Slice1SanctionsYearly();
      }
    };
  };
})(window);