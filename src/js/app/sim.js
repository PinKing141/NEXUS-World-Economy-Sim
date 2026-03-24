(function(global){
  var App = global.Nexus || (global.Nexus = {});
  var YEAR_DAYS = (App.data && App.data.CALENDAR && App.data.CALENDAR.daysPerYear) ? App.data.CALENDAR.daysPerYear : 360;
  var lastFrameTime = performance.now();
  var ENTREPRENEURIAL_TRAITS = {
    Ambitious:true,
    Visionary:true,
    "Risk-taker":true,
    Innovator:true
  };
  var SIM_DAYS_PER_TICK = 1;
  var LEGACY_SIM_DAYS_PER_TICK = 3;
  var TICKS_PER_YEAR = YEAR_DAYS / SIM_DAYS_PER_TICK;
  var DAYS_PER_MONTH = YEAR_DAYS / 12;
  var CORE_LEADERSHIP_ROLES = {
    ceo:{ roleKey:"ceo", title:"CEO", department:"Executive", tier:"executive", importance:5 },
    coo:{ roleKey:"coo", title:"COO", department:"Operations", tier:"executive", importance:4 },
    cfo:{ roleKey:"cfo", title:"CFO", department:"Finance", tier:"executive", importance:4 },
    hr_leader:{ roleKey:"hr_leader", title:"HR Leader", department:"People", tier:"leadership", importance:3 }
  };
  var INDUSTRY_LEADERSHIP_ROLES = {
    Technology:{ roleKey:"cto", title:"CTO", department:"Technology", tier:"leadership", importance:4 },
    Media:{ roleKey:"cto", title:"CTO", department:"Technology", tier:"leadership", importance:4 },
    Finance:{ roleKey:"head_of_trading", title:"Head of Trading", department:"Markets", tier:"leadership", importance:4 },
    Manufacturing:{ roleKey:"operations_director", title:"Operations Director", department:"Operations", tier:"leadership", importance:4 },
    Energy:{ roleKey:"operations_director", title:"Operations Director", department:"Operations", tier:"leadership", importance:4 },
    Logistics:{ roleKey:"network_director", title:"Network Director", department:"Logistics", tier:"leadership", importance:4 },
    Healthcare:{ roleKey:"medical_director", title:"Medical Director", department:"Medical", tier:"leadership", importance:4 },
    Retail:{ roleKey:"store_operations_director", title:"Store Operations Director", department:"Stores", tier:"leadership", importance:4 },
    "F&B":{ roleKey:"store_operations_director", title:"Store Operations Director", department:"Stores", tier:"leadership", importance:4 },
    "Real Estate":{ roleKey:"development_director", title:"Development Director", department:"Development", tier:"leadership", importance:4 }
  };
  var LOGO_RULES = {
    Technology:{
      palettes:[
        ["#4a9edd", "#00d4ff", "#f5a623"],
        ["#5b8cff", "#21c7b7", "#ffd166"],
        ["#3b82f6", "#8b5cf6", "#7ee7ff"]
      ],
      archetypes:["grid", "overlap", "ring"]
    },
    Finance:{
      palettes:[
        ["#123c69", "#355070", "#e5c674"],
        ["#1b4965", "#5fa8d3", "#ffd166"],
        ["#0f3d3e", "#2c666e", "#d9a441"]
      ],
      archetypes:["bars", "monogram", "fold"]
    },
    Retail:{
      palettes:[
        ["#b56576", "#6d597a", "#ffb4a2"],
        ["#d97706", "#b45309", "#fde68a"],
        ["#8d5a97", "#355070", "#ffd6a5"]
      ],
      archetypes:["overlap", "ring", "monogram"]
    },
    Manufacturing:{
      palettes:[
        ["#475569", "#334155", "#f97316"],
        ["#4b5563", "#0f172a", "#f59e0b"],
        ["#5b6770", "#1f2937", "#d97706"]
      ],
      archetypes:["bars", "fold", "grid"]
    },
    "Real Estate":{
      palettes:[
        ["#355070", "#6d597a", "#e9c46a"],
        ["#4f6d7a", "#3d405b", "#f2cc8f"],
        ["#3f5c73", "#6c757d", "#ffd6a5"]
      ],
      archetypes:["fold", "monogram", "bars"]
    },
    "F&B":{
      palettes:[
        ["#c44536", "#772e25", "#f6bd60"],
        ["#9c6644", "#7f5539", "#ffb703"],
        ["#bc6c25", "#6f1d1b", "#f4a261"]
      ],
      archetypes:["ring", "overlap", "monogram"]
    },
    Healthcare:{
      palettes:[
        ["#2a9d8f", "#457b9d", "#a8dadc"],
        ["#1d7874", "#679289", "#f4c095"],
        ["#0f766e", "#0284c7", "#99f6e4"]
      ],
      archetypes:["ring", "grid", "overlap"]
    },
    Media:{
      palettes:[
        ["#7c3aed", "#ef476f", "#ffd166"],
        ["#8338ec", "#3a86ff", "#ffbe0b"],
        ["#6d28d9", "#db2777", "#fde047"]
      ],
      archetypes:["overlap", "bars", "ring"]
    },
    Logistics:{
      palettes:[
        ["#1d4ed8", "#0f766e", "#f59e0b"],
        ["#2563eb", "#0891b2", "#fbbf24"],
        ["#0f4c81", "#2a9d8f", "#e9c46a"]
      ],
      archetypes:["bars", "grid", "fold"]
    },
    Energy:{
      palettes:[
        ["#ea580c", "#c2410c", "#fde047"],
        ["#f97316", "#b91c1c", "#facc15"],
        ["#d97706", "#92400e", "#fde68a"]
      ],
      archetypes:["ring", "fold", "bars"]
    }
  };
  var DECISION_PROFILE_KEYS = ["riskTolerance","greed","patience","discipline","loyalty","statusSeeking","familyAttachment","adaptability","ethics"];
  var TEMP_STATE_KEYS = ["confidence","stress","burnout","grief","resentment","ambitionSpike"];
  var TEMP_STATE_DEFAULTS = {
    confidence:50,
    stress:22,
    burnout:8,
    grief:0,
    resentment:0,
    ambitionSpike:34
  };
  var DECISION_ROLE_WEIGHTS = {
    ceo:{ expansion:1.0, staffing:1.0, cash:1.0, succession:1.0 },
    cfo:{ expansion:0.45, staffing:0.55, cash:0.7, succession:0.35 },
    coo:{ expansion:0.6, staffing:0.7, cash:0.35, succession:0.4 },
    hr_leader:{ expansion:0.2, staffing:0.6, cash:0.15, succession:0.3 },
    default:{ expansion:0.6, staffing:0.35, cash:0.25, succession:0.35 }
  };
  var TRAIT_PROFILE_OFFSETS = {
    Visionary:{ riskTolerance:12, statusSeeking:8, adaptability:10, patience:-4 },
    "Risk-taker":{ riskTolerance:16, greed:4, discipline:-4, patience:-8 },
    Conservative:{ riskTolerance:-16, discipline:10, patience:8, familyAttachment:4 },
    Networker:{ loyalty:8, statusSeeking:6, adaptability:5, ethics:2 },
    Workaholic:{ discipline:12, loyalty:3, familyAttachment:-6, adaptability:2 },
    Innovator:{ adaptability:10, riskTolerance:8, patience:-3, statusSeeking:4 },
    Strategist:{ discipline:8, patience:10, adaptability:5, riskTolerance:-3 },
    Charismatic:{ statusSeeking:10, loyalty:4, greed:3, ethics:-2 },
    Frugal:{ greed:-8, discipline:8, patience:8, riskTolerance:-6 },
    Ambitious:{ statusSeeking:14, greed:6, riskTolerance:6, familyAttachment:-4 }
  };
  var TRAIT_DECISION_SHIFTS = {
    Visionary:{ expansion:10, staffing:2, cash:-6, succession:-2 },
    "Risk-taker":{ expansion:12, staffing:0, cash:-10, succession:-4 },
    Conservative:{ expansion:-12, staffing:-3, cash:12, succession:2 },
    Networker:{ expansion:5, staffing:4, cash:0, succession:1 },
    Workaholic:{ expansion:6, staffing:2, cash:2, succession:-1 },
    Innovator:{ expansion:8, staffing:1, cash:-4, succession:-1 },
    Strategist:{ expansion:4, staffing:5, cash:8, succession:-3 },
    Charismatic:{ expansion:5, staffing:4, cash:0, succession:2 },
    Frugal:{ expansion:-6, staffing:-2, cash:12, succession:0 },
    Ambitious:{ expansion:9, staffing:3, cash:-4, succession:-1 }
  };
  var TRAIT_CHANNELS = ["business","mobility","deal","family"];
  var TRAIT_CHANNEL_LABELS = {
    business:"Business",
    mobility:"Mobility",
    deal:"Deals",
    family:"Family"
  };
  var TRAIT_MECHANICS = {
    Visionary:{ business:7, mobility:5, deal:2, family:-2 },
    "Risk-taker":{ business:8, mobility:6, deal:4, family:-4 },
    Conservative:{ business:5, mobility:-2, deal:-1, family:6 },
    Networker:{ business:4, mobility:3, deal:9, family:4 },
    Workaholic:{ business:7, mobility:5, deal:1, family:-8 },
    Innovator:{ business:8, mobility:6, deal:2, family:-1 },
    Strategist:{ business:9, mobility:4, deal:5, family:2 },
    Charismatic:{ business:4, mobility:4, deal:8, family:5 },
    Frugal:{ business:6, mobility:2, deal:-2, family:3 },
    Ambitious:{ business:7, mobility:8, deal:4, family:-3 }
  };
  var MARKET_SCOPE_LOCAL = { Retail:true, "F&B":true, Healthcare:true, "Real Estate":true };
  var MARKET_SCOPE_GLOBAL = { Technology:true, Finance:true, Media:true };
  var MARKET_SCOPE_MIXED = { Manufacturing:true, Logistics:true, Energy:true };
  var DEMAND_SCOPE_SHARE = { local:0.085, global:0.028, mixed:0.05 };
  var INDUSTRY_WAGE_MULTIPLIERS = {
    Technology:1.52,
    Finance:1.7,
    Manufacturing:0.98,
    Retail:0.82,
    "Real Estate":1.28,
    "F&B":0.78,
    Healthcare:1.18,
    Media:1.06,
    Logistics:0.92,
    Energy:1.38
  };
  var INDUSTRY_PRODUCTIVITY_MULTIPLIERS = {
    Technology:5.8,
    Finance:8.2,
    Manufacturing:3.1,
    Retail:1.85,
    "Real Estate":4.3,
    "F&B":1.55,
    Healthcare:3.2,
    Media:3.7,
    Logistics:2.6,
    Energy:6.4
  };
  var INDUSTRY_OPERATING_COST_RATES = {
    Technology:0.34,
    Finance:0.38,
    Manufacturing:0.46,
    Retail:0.52,
    "Real Estate":0.36,
    "F&B":0.58,
    Healthcare:0.43,
    Media:0.41,
    Logistics:0.49,
    Energy:0.47
  };
  var HOUSEHOLD_CLASS_RANKS = {
    strained:0,
    working:1,
    middle:2,
    affluent:3,
    elite:4
  };

  function randomId(){
    return Math.random().toString(36).slice(2);
  }

  function emitNews(type, text, meta){
    if (App.events && App.events.emit) {
      return App.events.emit(type, text, meta);
    }
    if (App.ui && App.ui.addNews) {
      return App.ui.addNews(type, text, meta);
    }
    return null;
  }

  function currentYear(){
    return Math.floor(App.store.simDay / YEAR_DAYS);
  }

  function chanceForDays(baseChance, baseDays){
    var chance = App.utils.clamp(Number(baseChance) || 0, 0, 0.999999);
    var days = Math.max(1, Number(baseDays) || 1);
    return 1 - Math.pow(1 - chance, SIM_DAYS_PER_TICK / days);
  }

  function dailyRateFromAnnualChange(annualChange){
    var factor = Math.max(0.15, 1 + (Number(annualChange) || 0));
    return Math.pow(factor, SIM_DAYS_PER_TICK / YEAR_DAYS) - 1;
  }

  function getIndustryValue(table, industry, fallback){
    return table && table[industry] != null ? table[industry] : fallback;
  }

  function householdClassRank(tier){
    return HOUSEHOLD_CLASS_RANKS[tier] != null ? HOUSEHOLD_CLASS_RANKS[tier] : HOUSEHOLD_CLASS_RANKS.working;
  }

  function uniqueTraits(traits){
    return traits.filter(function(trait, index, array){
      return trait && array.indexOf(trait) === index;
    });
  }

  function hashString(value){
    var hash = 2166136261;
    var i;

    value = String(value || "");
    for (i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function createSeededRandom(seed){
    var state = seed >>> 0;

    return function(){
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function seededPick(random, list){
    return list[Math.floor(random() * list.length)];
  }

  function createBusinessLogoConfig(business){
    var identity = [business.id, business.name, business.industry, business.countryISO, business.lineageId].join("|");
    var seed = hashString(identity);
    var random = createSeededRandom(seed);
    var rules = LOGO_RULES[business.industry] || LOGO_RULES.Technology;
    var palette = seededPick(random, rules.palettes);

    return {
      seed:seed,
      archetype:seededPick(random, rules.archetypes),
      palette:{
        primary:palette[0],
        secondary:palette[1],
        accent:palette[2]
      },
      rounded:random() > 0.45,
      variant:Math.floor(random() * 4),
      rotation:Math.floor(random() * 4) * 45,
      accentIndex:Math.floor(random() * 4),
      cutout:random() > 0.5,
      useGradient:random() > 0.38,
      frame:seededPick(random, ["circle", "square", "diamond"]),
      monogram:(business.name || "?").charAt(0).toUpperCase()
    };
  }

  function ensureBusinessLogo(business){
    if (!business) return;
    if (!business.logo) {
      business.logo = createBusinessLogoConfig(business);
    }
  }

  function clampScore(value){
    return Math.round(App.utils.clamp(value, 0, 100));
  }

  function clampTraitDelta(value, limit){
    return App.utils.clamp(value, -limit, limit);
  }

  function floorInt(value){
    return Math.floor(Number(value) || 0);
  }

  function getIndustryMarketScope(industry){
    if (MARKET_SCOPE_LOCAL[industry]) return "local";
    if (MARKET_SCOPE_GLOBAL[industry]) return "global";
    if (MARKET_SCOPE_MIXED[industry]) return "mixed";
    return "mixed";
  }

  function ensureCountryProfile(iso, blocId){
    var profile;
    var bloc = App.store.getBloc(blocId) || App.store.getBlocByCountry(iso);

    if (!iso) return null;

    profile = App.store.getCountryProfile(iso);
    if (profile) {
      if (!profile.blocId && bloc) profile.blocId = bloc.id;
      return profile;
    }

    if (!App.data || !App.data.createCountryProfile) return null;

    profile = App.data.createCountryProfile(iso, bloc ? bloc.id : "NA", null);
    App.store.setCountryProfile(iso, profile);
    return profile;
  }

  function refreshCountryProfileDerived(profile){
    var laborForce = Math.max(0, floorInt(profile.laborForce));
    var employed = App.utils.clamp(floorInt(profile.employed), 0, laborForce);
    var unemployed = Math.max(0, laborForce - employed);
    var medianWage = Math.max(1500, Number(profile.medianWageGU) || 0);
    var employmentRate = laborForce > 0 ? employed / laborForce : 0;
    var demandPerCapita = profile.population > 0 ? ((employed * medianWage * 0.72) / Math.max(1, profile.population)) : 0;
    var demandScore = App.utils.clamp(demandPerCapita / 28000, 0, 1);
    var institutionScore = App.utils.clamp(Number(profile.institutionScore) || 0, 0, 1);

    profile.laborForce = laborForce;
    profile.employed = employed;
    profile.unemployed = unemployed;
    profile.medianWageGU = medianWage;
    profile.consumerDemandGU = Math.max(0, Math.round(employed * medianWage * 0.72));
    profile.populationPressure = App.utils.clamp((employmentRate * 0.5) + (demandScore * 0.25) + (institutionScore * 0.25), 0, 1);

    return profile;
  }

  function bootstrapCountryProfiles(){
    var seededProfiles = App.data && App.data.createCountryProfiles ? App.data.createCountryProfiles(App.store.blocs, App.store.countryProfiles) : {};

    App.store.countryProfiles = App.store.countryProfiles || {};

    App.store.blocs.forEach(function(bloc){
      bloc.members.forEach(function(iso){
        var existing = App.store.countryProfiles[iso];
        var seeded = seededProfiles[iso];
        var profile = existing ? Object.assign({}, seeded || {}, existing) : (seeded || (App.data.createCountryProfile ? App.data.createCountryProfile(iso, bloc.id, null) : null));

        if (!profile) return;
        profile.iso = iso;
        profile.blocId = profile.blocId || bloc.id;
        App.store.countryProfiles[iso] = refreshCountryProfileDerived(profile);
      });
    });
  }

  function phase1UpdateLaborAndDemand(){
    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = App.store.countryProfiles[iso];
      var participation = App.utils.clamp(Number(profile.laborForceParticipation) || 0.55, 0.25, 0.9);
      var derivedLaborForce = Math.max(0, Math.round((Number(profile.population) || 0) * participation));

      profile.laborForceParticipation = participation;
      profile.laborForce = derivedLaborForce;
      profile.employed = Math.min(Math.max(0, floorInt(profile.employed)), derivedLaborForce);
      refreshCountryProfileDerived(profile);
    });
  }

  function phase2BirthDeathPressure(){
    return;
  }

  function phase3MigrationPressure(){
    return;
  }

  function phase4InequalityInstitutionFeedback(){
    return;
  }

  function updatePopulationProfilesYearly(){
    if (!App.store.countryProfiles) return;
    phase1UpdateLaborAndDemand();
    phase2BirthDeathPressure();
    phase3MigrationPressure();
    phase4InequalityInstitutionFeedback();
    validateCountryProfiles();
  }

  function validateCountryProfiles(){
    var issues = [];
    var devStrict = !!(global.location && (global.location.hostname === "localhost" || global.location.hostname === "127.0.0.1"));

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = App.store.countryProfiles[iso];
      if (!profile) return;
      if (!Number.isFinite(profile.population) || profile.population < 0) issues.push(iso + " population invalid");
      if (!Number.isFinite(profile.laborForce) || profile.laborForce < 0) issues.push(iso + " laborForce invalid");
      if (!Number.isFinite(profile.employed) || profile.employed < 0) issues.push(iso + " employed invalid");
      if (profile.employed > profile.laborForce + 1) issues.push(iso + " employed exceeds labor force");
      if (!Number.isFinite(profile.consumerDemandGU) || profile.consumerDemandGU < 0) issues.push(iso + " consumer demand invalid");
    });

    if (issues.length) {
      if (devStrict) {
        console.error("Country profile invariants:", issues.slice(0, 8).join(" | "));
      } else {
        console.warn("Country profile invariants:", issues.slice(0, 8).join(" | "));
      }
    }
  }

  function reserveLabor(iso, amount){
    var request = Math.max(0, floorInt(amount));
    var profile = ensureCountryProfile(iso);
    var available;
    var reserved;

    if (!profile || request <= 0) return 0;

    refreshCountryProfileDerived(profile);
    available = Math.max(0, profile.laborForce - profile.employed);
    reserved = Math.min(request, available);
    profile.employed += reserved;
    refreshCountryProfileDerived(profile);
    return reserved;
  }

  function releaseLabor(iso, amount){
    var request = Math.max(0, floorInt(amount));
    var profile = ensureCountryProfile(iso);
    var released;

    if (!profile || request <= 0) return 0;

    refreshCountryProfileDerived(profile);
    released = Math.min(request, profile.employed);
    profile.employed -= released;
    refreshCountryProfileDerived(profile);
    return released;
  }

  function getCountryDemandCapacityGU(iso){
    var profile = ensureCountryProfile(iso);
    if (!profile) return 0;
    return Math.max(0, Number(profile.consumerDemandGU) || 0);
  }

  function getBlocDemandCapacityGU(blocId){
    return (App.store.getBlocProfiles ? App.store.getBlocProfiles(blocId) : []).reduce(function(sum, profile){
      return sum + Math.max(0, Number(profile.consumerDemandGU) || 0);
    }, 0);
  }

  function getBusinessDemandCapacityGU(business){
    var scope = getIndustryMarketScope(business.industry);
    var countryDemand = getCountryDemandCapacityGU(business.countryISO);
    var blocDemand = getBlocDemandCapacityGU(business.blocId);
    var blended = (countryDemand * 0.5) + (blocDemand * 0.5);

    if (scope === "local") return countryDemand * DEMAND_SCOPE_SHARE.local;
    if (scope === "global") return blocDemand * DEMAND_SCOPE_SHARE.global;
    return blended * DEMAND_SCOPE_SHARE.mixed;
  }

  function getDemandCapPenalty(business){
    var capacity = Math.max(1, getBusinessDemandCapacityGU(business));
    var utilization = (business.revenueGU || 0) / capacity;

    if (utilization <= 1) return 0;
    return App.utils.clamp((utilization - 1) * 0.08, 0, 0.18);
  }

  function pickCountryByPopulationPressure(blocId){
    var profiles = (App.store.getBlocProfiles ? App.store.getBlocProfiles(blocId) : []).slice();
    var weighted = [];
    var total = 0;
    var roll = 0;
    var running = 0;

    if (!profiles.length) return null;

    profiles.forEach(function(profile){
      var weight = App.utils.clamp((profile.populationPressure || 0.5) * 3 + (profile.population > 0 ? Math.log10(profile.population + 1) / 7 : 0), 0.05, 4);
      weighted.push({ iso:profile.iso, weight:weight });
      total += weight;
    });

    if (total <= 0) return profiles[0].iso;

    roll = Math.random() * total;
    for (var i = 0; i < weighted.length; i += 1) {
      running += weighted[i].weight;
      if (running >= roll) return weighted[i].iso;
    }

    return weighted[weighted.length - 1].iso;
  }

  function formatTraitEffectLabel(trait, channel, impact){
    var rounded = Math.round(Math.abs(impact) * 10) / 10;
    var sign = impact >= 0 ? "+" : "-";
    return trait + " " + sign + rounded + " " + (TRAIT_CHANNEL_LABELS[channel] || channel);
  }

  function summarizeTraitEffects(effects, limit){
    var merged = {};
    var list;

    (effects || []).forEach(function(effect){
      var key;
      if (!effect || !effect.trait || !effect.channel || !effect.impact) return;
      key = effect.trait + "|" + effect.channel;
      if (!merged[key]) {
        merged[key] = {
          trait:effect.trait,
          channel:effect.channel,
          impact:0
        };
      }
      merged[key].impact += effect.impact;
    });

    list = Object.keys(merged).map(function(key){
      var entry = merged[key];
      entry.impact = Math.round(entry.impact * 10) / 10;
      entry.label = formatTraitEffectLabel(entry.trait, entry.channel, entry.impact);
      return entry;
    }).sort(function(first, second){
      return Math.abs(second.impact) - Math.abs(first.impact);
    });

    return list.slice(0, limit || 4);
  }

  function collectTraitEffects(person, channels){
    var activeChannels = channels && channels.length ? channels : TRAIT_CHANNELS;
    var traits = uniqueTraits(person && person.traits ? person.traits : []);
    var effects = [];

    traits.forEach(function(trait){
      var rule = TRAIT_MECHANICS[trait];
      if (!rule) return;

      activeChannels.forEach(function(channel){
        var impact = Number(rule[channel] || 0);
        if (!impact) return;
        effects.push({
          trait:trait,
          channel:channel,
          impact:impact,
          label:formatTraitEffectLabel(trait, channel, impact)
        });
      });
    });

    return effects;
  }

  function collectGroupTraitEffects(people, channels){
    return (people || []).filter(Boolean).reduce(function(all, person){
      return all.concat(collectTraitEffects(person, channels));
    }, []);
  }

  function getTraitChannelScore(person, channel){
    return collectTraitEffects(person, [channel]).reduce(function(sum, effect){
      return sum + effect.impact;
    }, 0);
  }

  function buildTraitEffectTags(effects, limit){
    return summarizeTraitEffects(effects, limit || 3).map(function(effect){
      return effect.label;
    });
  }

  function recordTraitEffects(effects){
    if (!App.store || !effects || !effects.length) return;
    App.store.traitEffectStats = App.store.traitEffectStats || {};

    effects.forEach(function(effect){
      var traitBucket;
      var channelBucket;

      if (!effect || !effect.trait || !effect.channel || !effect.impact) return;

      traitBucket = App.store.traitEffectStats[effect.trait] || (App.store.traitEffectStats[effect.trait] = {});
      channelBucket = traitBucket[effect.channel] || (traitBucket[effect.channel] = { hits:0, totalImpact:0 });
      channelBucket.hits += 1;
      channelBucket.totalImpact = Math.round((channelBucket.totalImpact + effect.impact) * 10) / 10;
    });
  }

  function setTraitSnapshot(target, effects){
    if (!target) return;
    target.lastTraitEffects = summarizeTraitEffects(effects, 4);
  }

  function validateTraitMechanicalCoverage(){
    var traits = (App.data && App.data.TRAITS && App.data.TRAITS.length ? App.data.TRAITS : Object.keys(TRAIT_MECHANICS)).slice();
    var errors = [];

    traits.forEach(function(trait){
      var mechanics = TRAIT_MECHANICS[trait];
      var activeCount;
      if (!mechanics) {
        errors.push("Missing trait mechanics config for " + trait + ".");
        return;
      }

      activeCount = TRAIT_CHANNELS.filter(function(channel){
        return Number(mechanics[channel] || 0) !== 0;
      }).length;

      if (activeCount < 2) {
        errors.push(trait + " has only " + activeCount + " active trait channels.");
      }
    });

    return {
      ok:errors.length === 0,
      errors:errors
    };
  }

  function normalizeScoreMap(map, keys, defaults){
    var next = {};
    map = map || {};

    keys.forEach(function(key){
      var fallback = typeof defaults === "number" ? defaults : defaults[key];
      next[key] = clampScore(map[key] != null ? map[key] : fallback);
    });

    return next;
  }

  function averageValues(values){
    if (!values.length) return 0;
    return values.reduce(function(sum, value){
      return sum + value;
    }, 0) / values.length;
  }

  function buildDecisionProfileBase(person){
    var parents = (person.parentIds || []).map(function(parentId){
      return App.store.getPerson(parentId);
    }).filter(Boolean);
    var base = {};

    DECISION_PROFILE_KEYS.forEach(function(key){
      var randomBase = App.utils.rand(32, 68);

      if (parents.length) {
        randomBase = averageValues(parents.map(function(parent){
          var source = parent.decisionProfileBase || parent.decisionProfile || {};
          return source[key] != null ? source[key] : 50;
        })) * 0.6 + randomBase * 0.4 + App.utils.rand(-6, 6);
      }

      base[key] = clampScore(randomBase);
    });

    return base;
  }

  function applyTraitProfileOffsets(profile, traits){
    traits.forEach(function(trait){
      var offsets = TRAIT_PROFILE_OFFSETS[trait];

      if (!offsets) return;

      Object.keys(offsets).forEach(function(key){
        profile[key] = clampScore((profile[key] != null ? profile[key] : 50) + offsets[key]);
      });
    });

    return profile;
  }

  function createTemporaryStates(){
    return {
      confidence:clampScore(App.utils.rand(44, 60)),
      stress:clampScore(App.utils.rand(14, 32)),
      burnout:clampScore(App.utils.rand(4, 18)),
      grief:0,
      resentment:0,
      ambitionSpike:clampScore(App.utils.rand(26, 54))
    };
  }

  function materializeDecisionProfile(person){
    if (!person) return;

    person.decisionProfileBase = normalizeScoreMap(person.decisionProfileBase || buildDecisionProfileBase(person), DECISION_PROFILE_KEYS, 50);
    person.decisionProfile = applyTraitProfileOffsets(normalizeScoreMap(person.decisionProfileBase, DECISION_PROFILE_KEYS, 50), person.traits || []);
    person.decisionProfile = normalizeScoreMap(person.decisionProfile, DECISION_PROFILE_KEYS, 50);
  }

  function ensureDecisionData(person){
    if (!person) return;

    person.decisionProfileBase = normalizeScoreMap(person.decisionProfileBase || buildDecisionProfileBase(person), DECISION_PROFILE_KEYS, 50);
    materializeDecisionProfile(person);
    person.temporaryStates = normalizeScoreMap(person.temporaryStates || createTemporaryStates(), TEMP_STATE_KEYS, TEMP_STATE_DEFAULTS);
  }

  function adjustTemporaryStates(person, changes){
    if (!person || !changes) return;

    ensureDecisionData(person);
    Object.keys(changes).forEach(function(key){
      if (TEMP_STATE_KEYS.indexOf(key) === -1) return;
      person.temporaryStates[key] = clampScore((person.temporaryStates[key] != null ? person.temporaryStates[key] : TEMP_STATE_DEFAULTS[key]) + changes[key]);
    });
  }

  function settleTemporaryStates(person){
    if (!person) return;

    ensureDecisionData(person);

    person.temporaryStates.confidence = clampScore(person.temporaryStates.confidence + (person.temporaryStates.confidence > 52 ? -1 : (person.temporaryStates.confidence < 48 ? 1 : 0)));
    person.temporaryStates.stress = clampScore(person.temporaryStates.stress + (person.temporaryStates.stress > 20 ? -1 : (person.temporaryStates.stress < 18 ? 1 : 0)));
    person.temporaryStates.burnout = clampScore(person.temporaryStates.burnout + (person.temporaryStates.burnout > 8 ? -1 : 0));
    person.temporaryStates.grief = clampScore(person.temporaryStates.grief + (person.temporaryStates.grief > 0 ? -1 : 0));
    person.temporaryStates.resentment = clampScore(person.temporaryStates.resentment + (person.temporaryStates.resentment > 0 ? -1 : 0));
    person.temporaryStates.ambitionSpike = clampScore(person.temporaryStates.ambitionSpike + (person.temporaryStates.ambitionSpike > 36 ? -1 : (person.temporaryStates.ambitionSpike < 28 ? 1 : 0)));
  }

  function getTraitDecisionShift(person, axis){
    return (person.traits || []).reduce(function(sum, trait){
      var shifts = TRAIT_DECISION_SHIFTS[trait];
      return sum + (shifts && shifts[axis] ? shifts[axis] : 0);
    }, 0);
  }

  function getStatus(person){
    var business = App.store.getBusiness(person.businessId) ||
      (App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null);

    if (!person.alive) return "deceased";
    if (person.retired) return "retired";
    if (!business) return "starting";
    if (business.profitGU > business.revenueGU * 0.2) return "thriving";
    if (business.profitGU > 0) return "growing";
    if (business.profitGU < -business.revenueGU * 0.1) return "struggling";
    return "growing";
  }

  function updateBlocGdp(){
    App.store.blocs.forEach(function(bloc){
      bloc.gdp = App.store.businesses.filter(function(business){
        return business.blocId === bloc.id;
      }).reduce(function(sum, business){
        return sum + business.revenueGU;
      }, 0);
    });
  }

  function updateForex(){
    var avg = App.store.blocs.reduce(function(sum, bloc){
      return sum + bloc.gdp;
    }, 0) / App.store.blocs.length || 1;

    App.store.blocs.forEach(function(bloc){
      var ratio;
      var pressure;
      var defaultRisk;
      var noise;
      var annualChange;

      bloc.prevRate = bloc.rate;
      ratio = bloc.gdp / avg;
      pressure = -(bloc.geoPressure * 0.06);
      defaultRisk = -(bloc.defaultRisk * 0.16);
      noise = 1 + App.utils.rand(-0.00065, 0.00065);
      annualChange = (ratio > 1 ? -0.05 * (ratio - 1) : 0.06 * (1 - ratio)) + pressure + defaultRisk;

      bloc.rate = bloc.rate * Math.max(0.97, 1 + dailyRateFromAnnualChange(annualChange)) * noise;
      bloc.rate = Math.max(bloc.baseRate * 0.55, Math.min(bloc.baseRate * 2.2, bloc.rate));
      bloc.rateHistory.push(bloc.rate);
      if (bloc.rateHistory.length > 60) {
        bloc.rateHistory.shift();
      }
      bloc.geoPressure = Math.max(0, bloc.geoPressure - (0.07 / LEGACY_SIM_DAYS_PER_TICK) * SIM_DAYS_PER_TICK);
      bloc.defaultRisk = Math.max(0, bloc.defaultRisk - (0.04 / LEGACY_SIM_DAYS_PER_TICK) * SIM_DAYS_PER_TICK);
    });
  }

  function getFallbackSpawnPos(iso, preferredState){
    if (iso === "US") {
      var stateCode = preferredState || App.utils.pick(App.data.US_STATE_CODES);
      var centroid = App.data.US_STATE_CENTROIDS[stateCode];
      return {
        pos: App.utils.latLngToSVG(centroid[0] + App.utils.rand(-0.8, 0.8), centroid[1] + App.utils.rand(-1, 1)),
        iso:"US",
        state:stateCode
      };
    }

    if (App.data.CENTROIDS[iso]) {
      var pair = App.data.CENTROIDS[iso];
      return {
        pos: App.utils.latLngToSVG(pair[0] + App.utils.rand(-2.5, 2.5), pair[1] + App.utils.rand(-2.5, 2.5)),
        iso:iso,
        state:null
      };
    }

    return {
      pos: App.utils.latLngToSVG(App.utils.rand(10, 60), App.utils.rand(-20, 120)),
      iso:iso,
      state:null
    };
  }

  function getSpawnPos(iso, preferredState){
    if (App.map && App.map.getCountrySpawnPoint) {
      return App.map.getCountrySpawnPoint(iso, preferredState) || getFallbackSpawnPos(iso, preferredState);
    }

    return getFallbackSpawnPos(iso, preferredState);
  }

  function getNearbySpawn(anchorPerson, iso, preferredState){
    var viewBox = App.data.MAP_VIEWBOX || { width:1000, height:507.209 };
    var x;
    var y;
    var attempt;

    if (!anchorPerson) {
      return getSpawnPos(iso, preferredState);
    }

    if (App.map && App.map.isPointInCountry) {
      for (attempt = 0; attempt < 18; attempt += 1) {
        x = App.utils.clamp(anchorPerson.svgX + App.utils.rand(-8, 8), 0, viewBox.width);
        y = App.utils.clamp(anchorPerson.svgY + App.utils.rand(-5, 5), 0, viewBox.height);
        if (App.map.isPointInCountry(iso, x, y)) {
          return {
            pos:{ x:x, y:y },
            iso:iso,
            state:preferredState || anchorPerson.state || null
          };
        }
      }
    }

    return {
      pos:getSpawnPos(iso, preferredState || anchorPerson.state).pos,
      iso:iso,
      state:preferredState || anchorPerson.state || null
    };
  }

  function pickCountryFromBloc(blocId){
    var bloc = App.store.getBloc(blocId);
    var weights = {
      US:8,CN:8,IN:8,BR:6,RU:5,AU:4,CA:4,DE:3,FR:3,GB:3,
      NG:3,ZA:3,MX:3,AR:3,EG:3,JP:4,KR:2,ID:3,SA:2
    };
    var pool = [];

    bloc.members.forEach(function(iso){
      var count = weights[iso] || 1;
      for (var i = 0; i < count; i += 1) {
        pool.push(iso);
      }
    });

    return App.utils.pick(pool);
  }

  function pickWeightedName(entries){
    var totalWeight = (entries || []).reduce(function(sum, entry){
      return sum + Number(entry[1] || 0);
    }, 0);
    var roll;
    var running = 0;

    if (!entries || !entries.length || totalWeight <= 0) {
      return null;
    }

    roll = Math.random() * totalWeight;
    for (var i = 0; i < entries.length; i += 1) {
      running += Number(entries[i][1] || 0);
      if (running >= roll) {
        return entries[i][0];
      }
    }

    return entries[entries.length - 1][0];
  }

  function pickFallbackFirstName(blocId, sex){
    var names = App.data.NAMES[blocId] || App.data.NAMES.NA;
    return App.utils.pick(sex === "female" ? names.female : names.male);
  }

  function pickFallbackLastName(blocId){
    var names = App.data.NAMES[blocId] || App.data.NAMES.NA;
    return App.utils.pick(names.last);
  }

  function pickFirstName(countryISO, blocId, sex){
    var exactPool = App.data.NAME_POOLS[countryISO];
    var blocPool = App.data.BLOC_NAME_POOLS[blocId];
    var entries = exactPool ? (sex === "female" ? exactPool.female : exactPool.male) : null;

    if (!entries || !entries.length) {
      entries = blocPool ? (sex === "female" ? blocPool.female : blocPool.male) : null;
    }

    return pickWeightedName(entries) || pickFallbackFirstName(blocId, sex);
  }

  function pickLastName(countryISO, blocId){
    var exactPool = App.data.NAME_POOLS[countryISO];
    var blocPool = App.data.BLOC_NAME_POOLS[blocId];
    var entries = exactPool ? exactPool.surnames : null;

    if (!entries || !entries.length) {
      entries = blocPool ? blocPool.surnames : null;
    }

    return pickWeightedName(entries) || pickFallbackLastName(blocId);
  }

  function countSharedTraits(first, second){
    return first.traits.filter(function(trait){
      return second.traits.indexOf(trait) !== -1;
    }).length;
  }

  function ageForPerson(person){
    var endDay = person.alive ? App.store.simDay : (person.deathDay != null ? person.deathDay : App.store.simDay);
    return Math.max(0, (endDay - person.birthDay) / YEAR_DAYS);
  }

  function lifeStageForAge(age, alive){
    if (!alive) return "deceased";
    if (age < 13) return "child";
    if (age < 18) return "teen";
    if (age < 65) return "adult";
    return "senior";
  }

  function syncPerson(person){
    person.name = App.utils.formatPersonName(person.firstName, person.lastName, person.countryISO, person.nameOrder);
    person.age = ageForPerson(person);
    person.lifeStage = lifeStageForAge(person.age, person.alive);
    person.status = getStatus(person);
  }

  function chooseInheritedTrait(person){
    var weightedPool = [];
    var parentPool = [];

    (person.parentIds || []).forEach(function(parentId){
      var parent = App.store.getPerson(parentId);
      if (parent) {
        parentPool = parentPool.concat(parent.traits);
      }
    });

    if (parentPool.length && Math.random() < 0.65) {
      weightedPool = parentPool.slice();
    } else {
      weightedPool = App.data.TRAITS.slice();
    }

    weightedPool = weightedPool.filter(function(trait){
      return person.traits.indexOf(trait) === -1;
    });

    if (!weightedPool.length) {
      weightedPool = App.data.TRAITS.filter(function(trait){
        return person.traits.indexOf(trait) === -1;
      });
    }

    return weightedPool.length ? App.utils.pick(weightedPool) : null;
  }

  function grantTraitMilestone(person, milestone){
    var trait;
    var key = milestone === 8 ? "age8" : "age16";

    if (!person.traitMilestones) {
      person.traitMilestones = { age8:false, age16:false };
    }

    if (person.traitMilestones[key]) {
      return;
    }

    trait = chooseInheritedTrait(person);
    if (trait) {
      person.traits = uniqueTraits(person.traits.concat([trait])).slice(0, 2);
    }
    person.traitMilestones[key] = true;
  }

  function initializeTraits(person){
    person.traits = uniqueTraits(person.traits || []).slice(0, 2);
    person.traitMilestones = person.traitMilestones || { age8:false, age16:false };

    if (person.age >= 8 && person.traits.length < 1) {
      grantTraitMilestone(person, 8);
    }
    if (person.age >= 16 && person.traits.length < 2) {
      grantTraitMilestone(person, 16);
    }
    if (person.age >= 22 && person.traits.length < 2) {
      while (person.traits.length < 2) {
        person.traits = uniqueTraits(person.traits.concat([App.utils.pick(App.data.TRAITS)])).slice(0, 2);
      }
      person.traitMilestones.age8 = true;
      person.traitMilestones.age16 = true;
    }
  }

  function createCitizen(options){
    var bloc = App.store.getBloc(options.blocId) || App.utils.pick(App.store.blocs);
    var iso = options.countryISO || pickCountryFromBloc(bloc.id);
    var sex = options.sex || (Math.random() < 0.5 ? "male" : "female");
    var state = iso === "US" ? (options.state || null) : null;
    var spawn = options.anchorPerson ? getNearbySpawn(options.anchorPerson, iso, state) : getSpawnPos(iso, state);
    var pool = App.data.NAME_POOLS[iso];
    var lastName = options.lastName || pickLastName(iso, bloc.id);
    var person = {
      id:randomId(),
      firstName:options.firstName || pickFirstName(iso, bloc.id, sex),
      lastName:lastName,
      name:"",
      sex:sex,
      blocId:bloc.id,
      countryISO:iso,
      state:spawn.state,
      birthDay:options.birthDay != null ? options.birthDay : (App.store.simDay - ((options.age != null ? options.age : App.utils.randInt(22, 55)) * YEAR_DAYS)),
      age:0,
      alive:options.alive !== false,
      deathDay:options.deathDay != null ? options.deathDay : null,
      retired:!!options.retired,
      lifeStage:"adult",
      traits:(options.traits || []).slice(),
      netWorthGU:options.netWorthGU != null ? options.netWorthGU : App.utils.rand(2000, 70000),
      businessId:options.businessId || null,
      employerBusinessId:options.employerBusinessId || null,
      jobTitle:options.jobTitle || null,
      jobTier:options.jobTier || null,
      jobDepartment:options.jobDepartment || null,
      salaryGU:options.salaryGU != null ? options.salaryGU : 0,
      status:options.status || "starting",
      svgX:spawn.pos.x,
      svgY:spawn.pos.y,
      pulse:0,
      spouseId:options.spouseId || null,
      householdId:options.householdId || null,
      parentIds:(options.parentIds || []).slice(),
      childrenIds:(options.childrenIds || []).slice(),
      lineageId:options.lineageId || (lastName.toLowerCase() + "-" + randomId().slice(0, 4)),
      nameOrder:options.nameOrder || (pool && pool.displayOrder) || App.utils.getNameOrder(iso),
      nativeDisplayName:options.nativeDisplayName || null,
      traitMilestones:options.traitMilestones || { age8:false, age16:false },
      lastLifeEventYear:options.lastLifeEventYear != null ? options.lastLifeEventYear : currentYear(),
      decisionProfileBase:options.decisionProfileBase || null,
      decisionProfile:options.decisionProfile || null,
      temporaryStates:options.temporaryStates || null
    };

    syncPerson(person);
    initializeTraits(person);
    ensureDecisionData(person);
    syncPerson(person);
    return person;
  }

  function createBusiness(owner){
    var countryProfile = ensureCountryProfile(owner.countryISO);
    var medianWage = Math.max(1500, Number(countryProfile && countryProfile.medianWageGU) || 12000);
    var industry = App.utils.pick(App.data.INDUSTRIES);
    var employees = App.utils.randInt(1, 10);
    var revenueSeed = employees * medianWage * getIndustryValue(INDUSTRY_PRODUCTIVITY_MULTIPLIERS, industry, 2.6) * App.utils.rand(0.72, 1.18);
    var business = {
      id:randomId(),
      name:owner.lastName + " " + App.utils.pick(App.data.BIZ_SFX),
      industry:industry,
      ownerId:owner.id,
      founderId:owner.id,
      blocId:owner.blocId,
      countryISO:owner.countryISO,
      lineageId:owner.lineageId,
      revenueGU:Math.max(12000, revenueSeed),
      profitGU:0,
      valuationGU:0,
      employees:employees,
      leadership:[],
      logo:null,
      reputation:App.utils.rand(45, 70),
      cashReservesGU:0,
      currentDecision:null,
      decisionHistory:[],
      stage:"startup",
      foundedDay:App.store.simDay,
      age:0,
      successionCount:0,
      inheritedAtDay:null,
      revenueHistory:[]
    };
    var reservedEmployees = reserveLabor(owner.countryISO, business.employees);

    business.employees = Math.max(1, reservedEmployees);

    ensureBusinessLogo(business);
    return business;
  }

  function seedBusiness(business){
    var countryProfile = ensureCountryProfile(business.countryISO);
    var medianWage = Math.max(1500, Number(countryProfile && countryProfile.medianWageGU) || 12000);
    var anonymousStaff = Math.max(0, (business.employees || 1) - 1);
    var basePayroll = anonymousStaff * medianWage * getIndustryValue(INDUSTRY_WAGE_MULTIPLIERS, business.industry, 1);

    ensureBusinessLogo(business);
    business.profitGU = business.revenueGU * App.utils.rand(-0.02, 0.12);
    business.valuationGU = business.revenueGU * App.utils.rand(1.3, 2.8);
    business.cashReservesGU = Math.max(5000, basePayroll * App.utils.rand(0.12, 0.22));
    business.reputation = clampScore(business.reputation != null ? business.reputation : App.utils.rand(45, 70));
    business.decisionHistory = business.decisionHistory || [];
    business.revenueHistory = Array.from({ length:8 }, function(){
      return business.revenueGU * App.utils.rand(0.94, 1.06);
    });
  }

  function cloneRole(role){
    return {
      roleKey:role.roleKey,
      title:role.title,
      department:role.department,
      tier:role.tier,
      importance:role.importance
    };
  }

  function getIndustryLeadershipRole(industry){
    return cloneRole(INDUSTRY_LEADERSHIP_ROLES[industry] || INDUSTRY_LEADERSHIP_ROLES.Technology);
  }

  function getLeadershipTemplate(business){
    var employees = Math.max(1, business && business.employees ? business.employees : 1);

    if (employees <= 4) {
      return [cloneRole(CORE_LEADERSHIP_ROLES.ceo)];
    }

    if (employees <= 7) {
      return [
        cloneRole(CORE_LEADERSHIP_ROLES.ceo),
        cloneRole(CORE_LEADERSHIP_ROLES.coo),
        cloneRole(CORE_LEADERSHIP_ROLES.hr_leader)
      ];
    }

    return [
      cloneRole(CORE_LEADERSHIP_ROLES.ceo),
      cloneRole(CORE_LEADERSHIP_ROLES.coo),
      cloneRole(CORE_LEADERSHIP_ROLES.cfo),
      cloneRole(CORE_LEADERSHIP_ROLES.hr_leader),
      getIndustryLeadershipRole(business.industry)
    ];
  }

  function getBusinessAgeYears(business){
    if (!business) return 0;
    return Math.max(0, (App.store.simDay - Math.max(0, Number(business.foundedDay) || 0)) / YEAR_DAYS);
  }

  function getBusinessStageFactor(stage){
    if (stage === "startup") return 0.84;
    if (stage === "growth") return 1.02;
    if (stage === "established") return 1.14;
    if (stage === "declining") return 0.78;
    return 1;
  }

  function getCountryMedianWage(iso){
    var profile = ensureCountryProfile(iso);
    return Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
  }

  function getRoleCompensationMultiplier(role){
    var importance = Math.max(1, Number(role && role.importance) || 1);
    return 1.35 + (importance * 0.7);
  }

  function getStaffMedianSalary(business){
    var medianWage = getCountryMedianWage(business.countryISO);
    var industry = getIndustryValue(INDUSTRY_WAGE_MULTIPLIERS, business.industry, 1);
    var stage = getBusinessStageFactor(business.stage);
    var reputation = 0.88 + ((business.reputation || 50) / 100) * 0.34;
    return Math.max(900, medianWage * industry * stage * reputation * 0.82);
  }

  function getRoleSalary(business, role){
    var medianWage = getCountryMedianWage(business.countryISO);
    var industry = getIndustryValue(INDUSTRY_WAGE_MULTIPLIERS, business.industry, 1);
    var stage = getBusinessStageFactor(business.stage);
    var reputation = 0.92 + ((business.reputation || 50) / 100) * 0.38;
    return Math.max(1200, Math.round(medianWage * industry * getRoleCompensationMultiplier(role) * stage * reputation));
  }

  function assignEmployment(person, business, role){
    if (!person || !business || !role) return;

    person.employerBusinessId = business.id;
    person.jobTitle = role.title;
    person.jobTier = role.tier;
    person.jobDepartment = role.department;
    person.salaryGU = getRoleSalary(business, role);
  }

  function clearEmployment(person, businessId){
    if (!person) return;
    if (businessId && person.employerBusinessId !== businessId) return;

    person.employerBusinessId = null;
    person.jobTitle = null;
    person.jobTier = null;
    person.jobDepartment = null;
    person.salaryGU = 0;
  }

  function buildLeadershipEntry(role, person){
    return {
      roleKey:role.roleKey,
      title:role.title,
      personId:person.id,
      department:role.department,
      tier:role.tier,
      importance:role.importance
    };
  }

  function leadershipCandidateScore(candidate, business){
    var score = 0;

    ensureDecisionData(candidate);
    if (candidate.lineageId === business.lineageId) score += 200;
    if (candidate.employerBusinessId === business.id) score += 120;
    score += Math.min(120, Math.floor((candidate.netWorthGU || 0) / 800));
    score += Math.max(0, 50 - Math.abs((candidate.age || 0) - 42));
    score += (candidate.decisionProfile.discipline - 50) * 0.9;
    score += (candidate.decisionProfile.adaptability - 50) * 0.7;
    score += (candidate.decisionProfile.ethics - 50) * 0.5;
    score += ((business.reputation || 50) - 50) * 0.4;
    return score;
  }

  function isLeadershipEligible(person, business, takenIds){
    if (!person || !business) return false;
    if (!person.alive || person.retired) return false;
    if (person.age < 22) return false;
    if (person.countryISO !== business.countryISO) return false;
    if (takenIds && takenIds.indexOf(person.id) !== -1) return false;
    if (person.businessId && person.businessId !== business.id) return false;
    if (person.employerBusinessId && person.employerBusinessId !== business.id) return false;
    return true;
  }

  function findExistingRoleHolder(business, roleKey, takenIds){
    var leadership = business.leadership || [];

    for (var i = 0; i < leadership.length; i += 1) {
      if (leadership[i].roleKey !== roleKey) continue;
      var person = App.store.getPerson(leadership[i].personId);
      if (isLeadershipEligible(person, business, takenIds)) {
        return person;
      }
    }

    return null;
  }

  function findLeadershipCandidate(business, takenIds){
    return App.store.getLivingPeople().filter(function(candidate){
      return isLeadershipEligible(candidate, business, takenIds);
    }).sort(function(first, second){
      return leadershipCandidateScore(second, business) - leadershipCandidateScore(first, business);
    })[0] || null;
  }

  function createLeadershipHire(business, role, anchorPerson){
    var hire = createCitizen({
      blocId:business.blocId,
      countryISO:business.countryISO,
      state:anchorPerson && anchorPerson.countryISO === "US" ? anchorPerson.state : null,
      age:App.utils.randInt(28, 58),
      netWorthGU:App.utils.rand(1800, 22000),
      anchorPerson:anchorPerson || null
    });

    App.store.people.push(hire);
    hire.pulse = 1;
    assignEmployment(hire, business, role);
    syncPerson(hire);
    return hire;
  }

  function syncBusinessLeadership(business){
    var template;
    var owner;
    var takenIds = [];
    var nextLeadership = [];

    if (!business) return;

    template = getLeadershipTemplate(business);
    owner = App.store.getPerson(business.ownerId) || App.store.getPerson(business.founderId);

    template.forEach(function(role){
      var person = null;

      if (role.roleKey === "ceo" && owner && owner.alive && !owner.retired) {
        person = owner;
      } else {
        person = findExistingRoleHolder(business, role.roleKey, takenIds);
        if (!person) {
          person = findLeadershipCandidate(business, takenIds);
        }
        if (!person) {
          person = createLeadershipHire(business, role, owner || App.store.getPerson(business.founderId));
        }
      }

      if (!person || takenIds.indexOf(person.id) !== -1) return;

      takenIds.push(person.id);
      nextLeadership.push(buildLeadershipEntry(role, person));
    });

    App.store.people.forEach(function(person){
      if (person.employerBusinessId === business.id && takenIds.indexOf(person.id) === -1) {
        clearEmployment(person, business.id);
        syncPerson(person);
      }
    });

    nextLeadership.forEach(function(entry){
      var person = App.store.getPerson(entry.personId);
      if (!person) return;
      ensureDecisionData(person);
      assignEmployment(person, business, entry);
      syncPerson(person);
    });

    business.leadership = nextLeadership;
    var minimumHeadcount = Math.max(nextLeadership.length || 1, 1);
    var currentHeadcount = Math.max(0, business.employees || 0);

    if (minimumHeadcount > currentHeadcount) {
      currentHeadcount += reserveLabor(business.countryISO, minimumHeadcount - currentHeadcount);
    }

    business.employees = Math.max(minimumHeadcount, currentHeadcount);
  }

  function syncCorporateLadders(){
    App.store.people.forEach(function(person){
      if (person.employerBusinessId && !App.store.getBusiness(person.employerBusinessId)) {
        clearEmployment(person, person.employerBusinessId);
      }
    });

    App.store.businesses.forEach(function(business){
      syncBusinessLeadership(business);
      ensureBusinessDecisionState(business);
      business.currentDecision = evaluateBusinessDecision(business);
    });
  }

  function getRoleDecisionWeights(roleKey){
    return DECISION_ROLE_WEIGHTS[roleKey] || DECISION_ROLE_WEIGHTS.default;
  }

  function roleDecisionInfluence(roleKey){
    var weights = getRoleDecisionWeights(roleKey);
    return (weights.expansion + weights.staffing + weights.cash + weights.succession) / 4;
  }

  function getRevenueTrend(business){
    var history = (business.revenueHistory || []).slice(-6);
    var recent;
    var previous;

    if (history.length < 4) return 0;

    recent = averageValues(history.slice(-3));
    previous = averageValues(history.slice(0, Math.max(1, history.length - 3)));
    return App.utils.clamp((recent - previous) / Math.max(1, previous), -0.35, 0.35);
  }

  function getProfitMargin(business){
    return App.utils.clamp((business.profitGU || 0) / Math.max(1, business.revenueGU || 1), -0.5, 0.5);
  }

  function getCashCoverageMonths(business){
    return App.utils.clamp((business.cashReservesGU || 0) / Math.max(1, (business.revenueGU || 1) / 12), 0, 12);
  }

  function getOperatingCostRate(business){
    var baseRate = getIndustryValue(INDUSTRY_OPERATING_COST_RATES, business.industry, 0.42);
    var stageAdjustment = business.stage === "startup" ? 0.03 : (business.stage === "declining" ? 0.04 : (business.stage === "established" ? -0.02 : 0));
    return App.utils.clamp(baseRate + stageAdjustment, 0.24, 0.68);
  }

  function getReserveShareRate(business, decision){
    var currentDecision = decision || business.currentDecision || { cashPolicy:"balanced" };
    if (currentDecision.cashPolicy === "preserve") return 0.68;
    if (currentDecision.cashPolicy === "reinvest") return 0.38;
    return 0.52;
  }

  function getLeadershipPayrollAnnual(business){
    return (business.leadership || []).reduce(function(sum, entry){
      var person = App.store.getPerson(entry.personId);
      return sum + Math.max(0, Number(person && person.salaryGU) || getRoleSalary(business, entry));
    }, 0);
  }

  function getAnonymousPayrollAnnual(business){
    var leadershipCount = Math.max(0, (business.leadership || []).length);
    var anonymousHeadcount = Math.max(0, (business.employees || leadershipCount) - leadershipCount);
    return anonymousHeadcount * getStaffMedianSalary(business);
  }

  function getBusinessAnnualGrowthBands(business){
    if (business.stage === "startup") return { min:-0.12, max:0.42 };
    if (business.stage === "growth") return { min:-0.10, max:0.28 };
    if (business.stage === "declining") return { min:-0.24, max:0.10 };
    return { min:-0.12, max:0.18 };
  }

  function computeBusinessAnnualRevenueTarget(business, decision, ownerBusinessTrait, ownerMobilityTrait){
    var medianWage = getCountryMedianWage(business.countryISO);
    var productivity = getIndustryValue(INDUSTRY_PRODUCTIVITY_MULTIPLIERS, business.industry, 2.6);
    var stageFactor = getBusinessStageFactor(business.stage);
    var reputationFactor = 0.74 + ((business.reputation || 50) / 100) * 0.78;
    var decisionFactor = decision.stance === "aggressive" ? 1.12 : (decision.stance === "balanced" ? 1.03 : (decision.stance === "defensive" ? 0.96 : 0.86));
    var cashFactor = decision.cashPolicy === "reinvest" ? 1.05 : (decision.cashPolicy === "preserve" ? 0.96 : 1);
    var traitFactor = 1 + App.utils.clamp((ownerBusinessTrait / 72) + (ownerMobilityTrait / 115), -0.10, 0.14);
    var workforceCapacity = Math.max(1, business.employees || 1) * medianWage * productivity * stageFactor * reputationFactor * traitFactor;
    var demandCapacity = Math.max(1, getBusinessDemandCapacityGU(business));
    var marketScope = getIndustryMarketScope(business.industry);
    var marketShare = 0.00003 * Math.pow(Math.max(1, business.employees || 1), 0.8) * reputationFactor;
    var demandBound;

    if (marketScope === "local") marketShare *= 1.28;
    else if (marketScope === "global") marketShare *= 0.88;
    marketShare = App.utils.clamp(marketShare, 0.00002, 0.014);

    demandBound = demandCapacity * marketShare;
    return Math.max(medianWage * 1.6, Math.min(workforceCapacity * decisionFactor * cashFactor, Math.max(workforceCapacity * 0.72, demandBound)));
  }

  function getStageExpansionBias(stage){
    if (stage === "startup") return 8;
    if (stage === "growth") return 4;
    if (stage === "declining") return -10;
    return 0;
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

  function primeBusinessDecisionState(business){
    if (!business) return;
    business.reputation = clampScore(business.reputation != null ? business.reputation : App.utils.rand(45, 70));
    business.cashReservesGU = Math.max(0, business.cashReservesGU != null ? business.cashReservesGU : business.revenueGU * App.utils.rand(0.05, 0.18));
    business.decisionHistory = (business.decisionHistory || []).slice(0, 12);
  }

  function evaluateBusinessDecision(business){
    var makers;
    var bloc;
    var trend;
    var profitMargin;
    var cashCoverage;
    var metrics;
    var scores;
    var stance;
    var staffingAction;
    var cashPolicy;
    var successionBias;
    var decisionTraitEffects = [];

    if (!business) return null;

    primeBusinessDecisionState(business);
    makers = getBusinessDecisionMakers(business);
    bloc = App.store.getBloc(business.blocId);
    trend = getRevenueTrend(business);
    profitMargin = getProfitMargin(business);
    cashCoverage = getCashCoverageMonths(business);
    metrics = {
      trend:trend,
      profitMargin:profitMargin,
      cashCoverage:cashCoverage,
      reputation:business.reputation || 50,
      geoPressure:bloc ? bloc.geoPressure : 0,
      stage:business.stage
    };
    scores = {
      expansion:trend * 70 + profitMargin * 60 + (cashCoverage - 3) * 8 + ((business.reputation || 50) - 50) * 0.4 - ((bloc ? bloc.geoPressure : 0) * 6) + getStageExpansionBias(business.stage),
      staffing:trend * 55 + profitMargin * 55 + (cashCoverage - 2.5) * 10 + ((business.reputation || 50) - 50) * 0.35 - ((bloc ? bloc.geoPressure : 0) * 4) - (business.stage === "declining" ? 8 : 0),
      cash:(-trend * 60) + (-profitMargin * 80) + (3 - cashCoverage) * 12 + ((50 - (business.reputation || 50)) * 0.18) + ((bloc ? bloc.geoPressure : 0) * 7) + (business.stage === "declining" ? 10 : 0),
      succession:(business.stage === "declining" ? -6 : 0) + (cashCoverage < 2 ? -5 : 0) + ((business.reputation || 50) < 40 ? -6 : 0)
    };

    makers.forEach(function(entry){
      var weights = getRoleDecisionWeights(entry.roleKey);
      var businessTrait = getTraitChannelScore(entry.person, "business");
      var mobilityTrait = getTraitChannelScore(entry.person, "mobility");
      var familyTrait = getTraitChannelScore(entry.person, "family");
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

      decisionTraitEffects = decisionTraitEffects.concat(weightedTraitEffects);
    });

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

  function applyLeadershipStateChange(business, changes){
    var seen = {};
    var owner = App.store.getPerson(business.ownerId);

    App.store.getBusinessLeadership(business).forEach(function(entry){
      if (!entry.person || seen[entry.person.id]) return;
      seen[entry.person.id] = true;
      adjustTemporaryStates(entry.person, changes);
      syncPerson(entry.person);
    });

    if (owner && !seen[owner.id]) {
      adjustTemporaryStates(owner, changes);
      syncPerson(owner);
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

  function linkSpouses(first, second){
    first.spouseId = second.id;
    second.spouseId = first.id;
  }

  function addChildToParents(child, parents){
    child.parentIds = parents.map(function(parent){
      return parent.id;
    });

    parents.forEach(function(parent){
      if (parent.childrenIds.indexOf(child.id) === -1) {
        parent.childrenIds.push(child.id);
      }
    });
  }

  function buildChildLastName(parents){
    var father = parents.find(function(parent){ return parent.sex === "male"; });
    return father ? father.lastName : parents[0].lastName;
  }

  function buildChildLineageId(parents){
    var father = parents.find(function(parent){ return parent.sex === "male"; });
    return father ? father.lineageId : parents[0].lineageId;
  }

  function householdIdsEqual(first, second){
    var a = (first || []).slice();
    var b = (second || []).slice();
    var i;

    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function cloneHouseholdRecord(household){
    return {
      id:household.id,
      blocId:household.blocId,
      countryISO:household.countryISO,
      state:household.state || null,
      adultIds:(household.adultIds || []).slice(),
      childIds:(household.childIds || []).slice(),
      cashOnHandGU:Math.max(0, Number(household.cashOnHandGU) || 0),
      debtGU:Math.max(0, Number(household.debtGU) || 0),
      annualIncomeGU:Math.max(0, Number(household.annualIncomeGU) || 0),
      monthlyIncomeGU:Math.max(0, Number(household.monthlyIncomeGU) || 0),
      monthlyExpensesGU:Math.max(0, Number(household.monthlyExpensesGU) || 0),
      housingCostGU:Math.max(0, Number(household.housingCostGU) || 0),
      childcareCostGU:Math.max(0, Number(household.childcareCostGU) || 0),
      essentialsCostGU:Math.max(0, Number(household.essentialsCostGU) || 0),
      debtServiceGU:Math.max(0, Number(household.debtServiceGU) || 0),
      inheritancePressureGU:Math.max(0, Number(household.inheritancePressureGU) || 0),
      financialStress:App.utils.clamp(Number(household.financialStress) || 0, 0, 100),
      classTier:household.classTier || "working",
      originClassTier:household.originClassTier || household.classTier || "working",
      mobilityScore:Number(household.mobilityScore) || 0
    };
  }

  function getHouseholdAdults(household){
    return (household && household.adultIds ? household.adultIds : []).map(function(id){
      return App.store.getPerson(id);
    }).filter(function(person){
      return !!(person && person.alive);
    });
  }

  function getHouseholdChildren(household){
    return (household && household.childIds ? household.childIds : []).map(function(id){
      return App.store.getPerson(id);
    }).filter(function(person){
      return !!(person && person.alive);
    });
  }

  function getHouseholdForPerson(person){
    return person && person.householdId && App.store.getHousehold ? App.store.getHousehold(person.householdId) : null;
  }

  function estimateAdultAnnualIncome(person){
    var business;
    var businessDecision;
    var household;
    var profile;
    var medianWage;
    var baseIncome;

    if (!person || !person.alive || person.age < 18) return 0;

    business = App.store.getBusiness(person.businessId);
    if (business) {
      businessDecision = business.currentDecision || evaluateBusinessDecision(business);
      return Math.max(0, (business.profitGU || 0) * (businessDecision.cashPolicy === "preserve" ? 0.28 : (businessDecision.cashPolicy === "balanced" ? 0.42 : 0.58)));
    }

    if (person.salaryGU > 0) {
      return Math.max(0, person.salaryGU);
    }

    profile = ensureCountryProfile(person.countryISO);
    medianWage = Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
    baseIncome = medianWage * (person.retired ? 0.34 : (0.38 + (Number(profile && profile.institutionScore) || 0.55) * 0.26));
    household = getHouseholdForPerson(person);
    if (household && household.financialStress > 70) {
      baseIncome *= 0.92;
    }
    return Math.max(0, baseIncome);
  }

  function classifyHouseholdTier(profile, annualIncome, cashOnHandGU, debtGU, adults, stress){
    var medianWage = Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
    var adultCount = Math.max(1, adults);
    var incomeRatio = annualIncome / Math.max(1, medianWage * adultCount);
    var liquidityRatio = cashOnHandGU / Math.max(1, (medianWage / 12) * adultCount * 3);
    var debtRatio = debtGU / Math.max(1, medianWage * adultCount);

    if (stress >= 78 || incomeRatio < 0.8 || debtRatio > 1.9) return "strained";
    if (incomeRatio < 1.35 || liquidityRatio < 0.45 || debtRatio > 1.1) return "working";
    if (incomeRatio < 2.6 || liquidityRatio < 1.35) return "middle";
    if (incomeRatio < 4.8 || liquidityRatio < 3.2) return "affluent";
    return "elite";
  }

  function deriveHouseholdSnapshot(household){
    var adults = getHouseholdAdults(household);
    var children = getHouseholdChildren(household);
    var anchor = adults[0] || children[0] || null;
    var profile = ensureCountryProfile(household.countryISO || (anchor ? anchor.countryISO : "US"));
    var monthlyMedianWage = Math.max(125, getCountryMedianWage(household.countryISO || (anchor ? anchor.countryISO : "US")) / 12);
    var adultsCount = adults.length;
    var childrenCount = children.length;
    var youngChildren = children.filter(function(child){ return child.age < 6; }).length;
    var schoolChildren = Math.max(0, childrenCount - youngChildren);
    var countryCostPressure = 0.88 + ((profile && profile.giniCoefficient) || 0.4) * 0.55 + ((profile && profile.populationPressure) || 0.5) * 0.28;
    var essentialsCost = monthlyMedianWage * (0.62 + (adultsCount * 0.42) + (childrenCount * 0.24)) * (1.08 - ((profile && profile.institutionScore) || 0.55) * 0.12);
    var housingCost = monthlyMedianWage * countryCostPressure * (0.76 + Math.max(0, adultsCount - 1) * 0.24 + childrenCount * 0.08);
    var childcareCost = monthlyMedianWage * ((youngChildren * 0.32) + (schoolChildren * 0.12)) * (1.15 - ((profile && profile.institutionScore) || 0.55) * 0.35);
    var debtService = Math.max(0, household.debtGU || 0) * (0.07 / 12);
    var annualIncome = adults.reduce(function(sum, adult){
      return sum + estimateAdultAnnualIncome(adult);
    }, 0);
    var monthlyIncome = annualIncome / 12;
    var monthlyExpenses = essentialsCost + housingCost + childcareCost + debtService;
    var cashCoverageMonths = (household.cashOnHandGU || 0) / Math.max(1, monthlyExpenses);
    var debtRatio = (household.debtGU || 0) / Math.max(1, monthlyMedianWage * 12 * Math.max(1, adultsCount));
    var inheritancePressure = monthlyMedianWage * ((childrenCount * 0.45) + adults.filter(function(adult){
      return adult.age >= 55 || !!adult.businessId;
    }).length * 0.62 + ((household.debtGU || 0) > (household.cashOnHandGU || 0) ? 0.45 : 0));
    var stress = 42 +
      (((monthlyExpenses - monthlyIncome) / Math.max(1, monthlyExpenses)) * 54) +
      (debtRatio * 18) -
      (cashCoverageMonths * 10) +
      ((((profile && profile.giniCoefficient) || 0.4) - 0.35) * 32) -
      ((((profile && profile.institutionScore) || 0.55) - 0.55) * 18) +
      (childrenCount * 3.5);
    var classTier;
    var originClassTier;
    var mobilityScore;

    stress = App.utils.clamp(stress, 0, 100);
    classTier = classifyHouseholdTier(profile, annualIncome, household.cashOnHandGU || 0, household.debtGU || 0, adultsCount, stress);
    originClassTier = household.originClassTier || classTier;
    mobilityScore = (householdClassRank(classTier) - householdClassRank(originClassTier)) * 25;
    mobilityScore *= (0.82 + (((profile && profile.institutionScore) || 0.55) * 0.34) - ((((profile && profile.giniCoefficient) || 0.4) - 0.35) * 0.28));

    return {
      annualIncomeGU:Math.max(0, annualIncome),
      monthlyIncomeGU:Math.max(0, monthlyIncome),
      monthlyExpensesGU:Math.max(0, monthlyExpenses),
      housingCostGU:Math.max(0, housingCost),
      childcareCostGU:Math.max(0, childcareCost),
      essentialsCostGU:Math.max(0, essentialsCost),
      debtServiceGU:Math.max(0, debtService),
      inheritancePressureGU:Math.max(0, inheritancePressure),
      financialStress:stress,
      classTier:classTier,
      originClassTier:originClassTier,
      mobilityScore:mobilityScore
    };
  }

  function refreshHouseholdSnapshot(household){
    var snapshot = deriveHouseholdSnapshot(household);
    Object.keys(snapshot).forEach(function(key){
      household[key] = snapshot[key];
    });
    return household;
  }

  function buildHouseholdBaseState(group, candidates){
    var anchor = group.anchor;
    var profile = ensureCountryProfile(anchor.countryISO);
    var annualMedian = Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
    var totalAdultNetWorth = group.adultIds.reduce(function(sum, id){
      var adult = App.store.getPerson(id);
      return sum + Math.max(0, Number(adult && adult.netWorthGU) || 0);
    }, 0);
    var cashOnHand = candidates.length ? candidates.reduce(function(sum, household){
      return sum + Math.max(0, Number(household.cashOnHandGU) || 0);
    }, 0) : Math.min(totalAdultNetWorth * 0.08, annualMedian * Math.max(1, group.adultIds.length) * 4);
    var debtGU = candidates.length ? candidates.reduce(function(sum, household){
      return sum + Math.max(0, Number(household.debtGU) || 0);
    }, 0) : 0;
    var firstOriginTier = candidates.map(function(household){
      return household.originClassTier || household.classTier || null;
    }).filter(Boolean)[0] || null;

    return {
      id:"hh-" + (group.adultIds[0] || group.childIds[0] || randomId()),
      blocId:anchor.blocId,
      countryISO:anchor.countryISO,
      state:anchor.state || null,
      adultIds:group.adultIds.slice(),
      childIds:group.childIds.slice(),
      cashOnHandGU:Math.max(0, cashOnHand),
      debtGU:Math.max(0, debtGU),
      annualIncomeGU:0,
      monthlyIncomeGU:0,
      monthlyExpensesGU:0,
      housingCostGU:0,
      childcareCostGU:0,
      essentialsCostGU:0,
      debtServiceGU:0,
      inheritancePressureGU:0,
      financialStress:0,
      classTier:firstOriginTier || "working",
      originClassTier:firstOriginTier || null,
      mobilityScore:0
    };
  }

  function applyHouseholdWealthDrift(household, dailyNet){
    var adults = getHouseholdAdults(household).filter(function(person){
      return !person.businessId;
    });
    var share;

    if (!adults.length || !Number.isFinite(dailyNet) || Math.abs(dailyNet) < 0.01) return;

    share = dailyNet > 0 ? (dailyNet * 0.18) / adults.length : (dailyNet * 0.08) / adults.length;
    adults.forEach(function(adult){
      adult.netWorthGU = Math.max(100, adult.netWorthGU + share);
    });
  }

  function syncHouseholds(){
    var priorHouseholds = (App.store.households || []).map(cloneHouseholdRecord);
    var priorByMember = {};
    var livingPeople = App.store.getLivingPeople().slice().sort(function(first, second){
      return first.id.localeCompare(second.id);
    });
    var adults = livingPeople.filter(function(person){
      return person.age >= 18;
    });
    var children = livingPeople.filter(function(person){
      return person.age < 18;
    }).sort(function(first, second){
      return first.id.localeCompare(second.id);
    });
    var visitedAdults = {};
    var groups = [];
    var groupByAdultId = {};
    var assignedHouseholdIds = {};

    priorHouseholds.forEach(function(household){
      (household.adultIds || []).concat(household.childIds || []).forEach(function(id){
        if (!priorByMember[id]) priorByMember[id] = [];
        priorByMember[id].push(household);
      });
    });

    adults.forEach(function(adult){
      var spouse;
      var group;

      if (visitedAdults[adult.id]) return;
      spouse = adult.spouseId ? App.store.getPerson(adult.spouseId) : null;
      group = {
        adultIds:[adult.id],
        childIds:[],
        anchor:adult
      };
      visitedAdults[adult.id] = true;

      if (spouse && spouse.alive && spouse.age >= 18) {
        group.adultIds.push(spouse.id);
        visitedAdults[spouse.id] = true;
      }

      group.adultIds = group.adultIds.slice().sort();
      groups.push(group);
      group.adultIds.forEach(function(id){
        groupByAdultId[id] = group;
      });
    });

    children.forEach(function(child){
      var parentGroup = (child.parentIds || []).map(function(id){
        return groupByAdultId[id];
      }).filter(Boolean).sort(function(first, second){
        return (first.adultIds[0] || "").localeCompare(second.adultIds[0] || "");
      })[0] || null;

      if (!parentGroup) {
        groups.push({
          adultIds:[],
          childIds:[child.id],
          anchor:child
        });
        return;
      }

      if (parentGroup.childIds.indexOf(child.id) === -1) {
        parentGroup.childIds.push(child.id);
      }
    });

    App.store.households = groups.filter(function(group){
      return group.anchor && (group.adultIds.length || group.childIds.length);
    }).sort(function(first, second){
      return first.anchor.id.localeCompare(second.anchor.id);
    }).map(function(group){
      var candidates = [];
      var candidateIds = {};
      var exactMatch = null;
      var base;

      group.childIds = group.childIds.slice().sort();
      group.adultIds.concat(group.childIds).forEach(function(id){
        (priorByMember[id] || []).forEach(function(household){
          if (!household || candidateIds[household.id]) return;
          candidateIds[household.id] = true;
          candidates.push(household);
        });
      });

      exactMatch = candidates.find(function(household){
        return householdIdsEqual((household.adultIds || []).slice().sort(), group.adultIds) &&
          householdIdsEqual((household.childIds || []).slice().sort(), group.childIds);
      }) || null;

      base = exactMatch ? cloneHouseholdRecord(exactMatch) : buildHouseholdBaseState(group, candidates);
      base.id = exactMatch ? exactMatch.id : base.id;
      base.blocId = group.anchor.blocId;
      base.countryISO = group.anchor.countryISO;
      base.state = group.anchor.state || null;
      base.adultIds = group.adultIds.slice();
      base.childIds = group.childIds.slice();

      refreshHouseholdSnapshot(base);
      if (!base.originClassTier) {
        base.originClassTier = base.classTier;
        base.mobilityScore = 0;
      }

      base.adultIds.concat(base.childIds).forEach(function(id){
        assignedHouseholdIds[id] = base.id;
      });
      return base;
    });

    App.store.people.forEach(function(person){
      person.householdId = person.alive ? (assignedHouseholdIds[person.id] || null) : null;
    });

    return App.store.households;
  }

  function processHouseholdTick(){
    syncHouseholds();
    (App.store.households || []).forEach(function(household){
      var dailyIncome;
      var dailyExpenses;
      var dailyNet;
      var debtPayment;
      var coveredByCash;

      refreshHouseholdSnapshot(household);
      dailyIncome = (household.monthlyIncomeGU || 0) / DAYS_PER_MONTH * SIM_DAYS_PER_TICK;
      dailyExpenses = (household.monthlyExpensesGU || 0) / DAYS_PER_MONTH * SIM_DAYS_PER_TICK;
      dailyNet = dailyIncome - dailyExpenses;

      if (dailyNet >= 0) {
        debtPayment = Math.min(household.debtGU || 0, dailyNet);
        household.debtGU = Math.max(0, (household.debtGU || 0) - debtPayment);
        household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) + (dailyNet - debtPayment));
      } else {
        coveredByCash = Math.min(household.cashOnHandGU || 0, Math.abs(dailyNet));
        household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) - coveredByCash);
        household.debtGU = Math.max(0, (household.debtGU || 0) + Math.max(0, Math.abs(dailyNet) - coveredByCash));
      }

      applyHouseholdWealthDrift(household, dailyNet);
      refreshHouseholdSnapshot(household);
    });
  }

  function getPersonFinancialStress(person){
    var household = getHouseholdForPerson(person);
    return household ? (household.financialStress || 0) / 100 : 0;
  }

  function getHouseholdLaunchReadiness(person){
    var household = getHouseholdForPerson(person);
    var debtPenalty;

    if (!household) return 0;
    debtPenalty = (household.debtGU || 0) / Math.max(1, household.monthlyIncomeGU || 1);
    return App.utils.clamp(((household.cashOnHandGU || 0) / Math.max(1, household.monthlyExpensesGU || 1)) - (debtPenalty * 0.22), -1.5, 3);
  }

  function relieveHouseholdDebt(household, availableEstate){
    var payment;
    if (!household || availableEstate <= 0) return 0;
    payment = Math.min(availableEstate, Math.max(0, household.debtGU || 0));
    household.debtGU = Math.max(0, (household.debtGU || 0) - payment);
    refreshHouseholdSnapshot(household);
    return payment;
  }

  function reserveDependentSupport(household, availableEstate){
    var minors;
    var support;

    if (!household || availableEstate <= 0) return 0;
    minors = getHouseholdChildren(household).length;
    if (!minors) return 0;
    support = Math.min(availableEstate, Math.max(0, (household.monthlyExpensesGU || 0) * 2.5 * minors));
    household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) + support);
    refreshHouseholdSnapshot(household);
    return support;
  }

  function createGeneratedSpouse(person, explicitAge){
    var spouse = createCitizen({
      blocId:person.blocId,
      countryISO:person.countryISO,
      state:person.state,
      sex:person.sex === "male" ? "female" : "male",
      age:explicitAge != null ? explicitAge : App.utils.clamp(person.age + App.utils.randInt(-6, 6), 22, 60),
      netWorthGU:App.utils.rand(1500, 18000),
      anchorPerson:person,
      householdId:person.householdId || null
    });

    App.store.people.push(spouse);
    linkSpouses(person, spouse);
    spouse.pulse = 1;
    person.pulse = 1;
    syncHouseholds();
    return spouse;
  }

  function createChild(parents, age){
    var householdAnchor = parents[0];
    var child = createCitizen({
      blocId:householdAnchor.blocId,
      countryISO:householdAnchor.countryISO,
      state:householdAnchor.state,
      sex:Math.random() < 0.5 ? "male" : "female",
      age:age,
      lastName:buildChildLastName(parents),
      lineageId:buildChildLineageId(parents),
      parentIds:parents.map(function(parent){ return parent.id; }),
      netWorthGU:App.utils.rand(100, 1200),
      anchorPerson:householdAnchor
    });

    App.store.people.push(child);
    addChildToParents(child, parents);
    child.pulse = 1;
    syncHouseholds();
    return child;
  }

  function seedHousehold(person){
    var spouseChance = 0;
    var childPattern = null;
    var familyRoll;
    var spouse;
    var childAge;
    var olderChildAge;
    var youngerChildAge;

    if (person.age < 30) {
      spouseChance = 0.15;
    } else if (person.age <= 40) {
      spouseChance = 0.45;
      if (Math.random() < 0.35) {
        childPattern = "single-young";
      }
    } else {
      spouseChance = 0.70;
      familyRoll = Math.random();
      if (familyRoll < 0.25) {
        childPattern = "two-older";
      } else if (familyRoll < 0.80) {
        childPattern = "single-older";
      }
    }

    if (!person.spouseId && Math.random() < spouseChance) {
      spouse = createGeneratedSpouse(person);
    } else {
      spouse = App.store.getSpouse(person);
    }

    if (!spouse || !childPattern) {
      return;
    }

    if (childPattern === "single-young") {
      childAge = App.utils.randInt(0, Math.min(10, Math.max(0, Math.floor(person.age - 22))));
      createChild([person, spouse], childAge);
      syncHouseholds();
      return;
    }

    if (childPattern === "single-older") {
      childAge = App.utils.randInt(5, Math.min(18, Math.max(5, Math.floor(person.age - 22))));
      createChild([person, spouse], childAge);
      syncHouseholds();
      return;
    }

    olderChildAge = App.utils.randInt(8, Math.min(18, Math.max(8, Math.floor(person.age - 22))));
    youngerChildAge = Math.max(0, olderChildAge - App.utils.randInt(2, 6));
    createChild([person, spouse], olderChildAge);
    createChild([person, spouse], youngerChildAge);
    syncHouseholds();
  }

  function isCloseRelative(first, second){
    var firstParents = first.parentIds || [];
    var secondParents = second.parentIds || [];

    if (firstParents.indexOf(second.id) !== -1 || secondParents.indexOf(first.id) !== -1) {
      return true;
    }

    return firstParents.some(function(parentId){
      return secondParents.indexOf(parentId) !== -1;
    });
  }

  function findMarriageCandidate(person){
    var candidates = App.store.getLivingPeople().filter(function(candidate){
      if (candidate.id === person.id) return false;
      if (candidate.spouseId) return false;
      if (candidate.sex === person.sex) return false;
      if (candidate.countryISO !== person.countryISO) return false;
      if (candidate.age < 22 || candidate.age > 50) return false;
      if (isCloseRelative(person, candidate)) return false;
      return true;
    }).sort(function(first, second){
      function score(candidate){
        var value = 0;
        var candidateFamily = getTraitChannelScore(candidate, "family");
        var personFamily = getTraitChannelScore(person, "family");
        var candidateMobility = getTraitChannelScore(candidate, "mobility");
        var sharedTraits = countSharedTraits(person, candidate);

        if (!candidate.businessId) value += 4;
        if (person.countryISO === "US" && person.state && candidate.state === person.state) value += 3;
        value += Math.max(0, 6 - Math.abs(person.age - candidate.age));
        value += sharedTraits * 2;
        value += candidateFamily * 0.5;
        value += candidateMobility * 0.25;
        value -= Math.abs(personFamily - candidateFamily) * 0.22;
        if (candidate.childrenIds && candidate.childrenIds.length) value -= 1;
        return value;
      }

      return score(second) - score(first);
    });

    return candidates[0] || null;
  }

  function tryMarriage(person){
    var chance = person.age <= 34 ? 0.10 : 0.06;
    var spouse;
    var marriageEffects;
    var householdStress = getPersonFinancialStress(person);

    chance += getTraitChannelScore(person, "family") * 0.0022;
    chance += getTraitChannelScore(person, "deal") * 0.0008;
    chance -= householdStress * 0.08;
    chance = App.utils.clamp(chance, 0.02, 0.22);

    if (Math.random() >= chance) {
      return;
    }

    spouse = findMarriageCandidate(person);
    if (!spouse) {
      spouse = createGeneratedSpouse(person);
    } else {
      linkSpouses(person, spouse);
      spouse.pulse = 1;
      person.pulse = 1;
    }

    syncHouseholds();

    marriageEffects = summarizeTraitEffects(collectGroupTraitEffects([person, spouse], ["family","deal"]), 4);
    recordTraitEffects(marriageEffects);
    setTraitSnapshot(person, marriageEffects);
    setTraitSnapshot(spouse, marriageEffects);
    emitNews("marriage", "<strong>" + person.name + "</strong> and <strong>" + spouse.name + "</strong> married in " + App.store.getCountryName(person.countryISO) + ".", {
      tags:buildTraitEffectTags(marriageEffects, 2),
      entities:{
        personIds:[person.id, spouse.id],
        countryIsos:[person.countryISO],
        blocIds:[person.blocId]
      },
      causes:marriageEffects.slice(0, 2).map(function(effect){ return effect.label; })
    });
  }

  function getSharedChildren(first, second){
    return (first.childrenIds || []).map(function(id){
      return App.store.getPerson(id);
    }).filter(function(child){
      return !!child && child.parentIds.indexOf(second.id) !== -1;
    });
  }

  function tryBirth(mother){
    var spouse = App.store.getSpouse(mother);
    var children;
    var birthChance;
    var lastBirthDay;
    var child;
    var familyPressure;
    var mobilityPressure;
    var birthEffects;
    var householdStress;
    var childcareBurden;
    var household;

    if (!spouse || !spouse.alive) return;
    if (mother.age < 24 || mother.age > 42) return;

    children = getSharedChildren(mother, spouse);
    if (children.length >= 3) return;

    lastBirthDay = children.reduce(function(latest, existingChild){
      return Math.max(latest, existingChild.birthDay);
    }, -Infinity);

    if (lastBirthDay > -Infinity && (App.store.simDay - lastBirthDay) < (YEAR_DAYS * 2)) {
      return;
    }

    birthChance = children.length === 0 ? 0.18 : (children.length === 1 ? 0.10 : 0.04);
    familyPressure = (getTraitChannelScore(mother, "family") + getTraitChannelScore(spouse, "family")) / 2;
    mobilityPressure = (getTraitChannelScore(mother, "mobility") + getTraitChannelScore(spouse, "mobility")) / 2;
    household = getHouseholdForPerson(mother);
    householdStress = household ? (household.financialStress || 0) / 100 : 0;
    childcareBurden = household && household.monthlyExpensesGU > 0 ? (household.childcareCostGU || 0) / household.monthlyExpensesGU : 0;
    birthChance += familyPressure * 0.0036;
    birthChance -= mobilityPressure * 0.0015;
    birthChance -= householdStress * 0.12;
    birthChance -= childcareBurden * 0.08;
    birthChance = App.utils.clamp(birthChance, 0.01, 0.26);
    if (Math.random() >= birthChance) {
      return;
    }

    child = createChild([mother, spouse], 0);
    syncHouseholds();
    birthEffects = summarizeTraitEffects(collectGroupTraitEffects([mother, spouse], ["family","mobility"]), 4);
    recordTraitEffects(birthEffects);
    setTraitSnapshot(mother, birthEffects);
    setTraitSnapshot(spouse, birthEffects);
    setTraitSnapshot(child, birthEffects);
    emitNews("birth", "<strong>" + mother.name + "</strong> and <strong>" + spouse.name + "</strong> welcomed <strong>" + child.name + "</strong>.", {
      tags:buildTraitEffectTags(birthEffects, 2),
      entities:{
        personIds:[mother.id, spouse.id, child.id],
        countryIsos:[mother.countryISO],
        blocIds:[mother.blocId]
      },
      causes:birthEffects.slice(0, 2).map(function(effect){ return effect.label; })
    });
  }

  function hasEntrepreneurialTraits(person){
    return person.traits.some(function(trait){
      return ENTREPRENEURIAL_TRAITS[trait];
    });
  }

  function tryLaunchBusiness(person){
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

    if (!person.alive || person.retired || person.businessId || person.age < 22) return;

    chance = hasEntrepreneurialTraits(person) ? 0.06 : 0.02;
    mobilityTrait = getTraitChannelScore(person, "mobility");
    businessTrait = getTraitChannelScore(person, "business");
    household = getHouseholdForPerson(person);
    launchReadiness = getHouseholdLaunchReadiness(person);
    chance += mobilityTrait * 0.0024;
    chance += businessTrait * 0.0016;
    chance += launchReadiness * 0.01;
    chance -= getPersonFinancialStress(person) * 0.08;
    chance = App.utils.clamp(chance, 0.006, 0.14);
    if (Math.random() >= chance) {
      return;
    }

    business = createBusiness(person);
    seedBusiness(business);
    capitalModifier = 1 + App.utils.clamp((mobilityTrait * 0.6 + businessTrait * 0.8) / 40, -0.22, 0.28);
    capitalModifier *= 1 + App.utils.clamp(launchReadiness * 0.08, -0.14, 0.24);
    business.revenueGU *= capitalModifier;
    business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) * capitalModifier);
    business.valuationGU = Math.max(1000, business.valuationGU * (0.95 + (capitalModifier - 1) * 0.9));
    launchCapital = Math.min(person.netWorthGU * 0.08, Math.max(1500, business.cashReservesGU * 0.22));
    if (household) {
      launchCapital = Math.min(launchCapital + Math.min(household.cashOnHandGU || 0, Math.max(1200, household.monthlyExpensesGU || 0)), person.netWorthGU * 0.14 + (household.cashOnHandGU || 0));
      household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) - Math.min(household.cashOnHandGU || 0, launchCapital * 0.45));
      refreshHouseholdSnapshot(household);
    }
    business.cashReservesGU += launchCapital;
    person.netWorthGU = Math.max(200, person.netWorthGU - Math.min(person.netWorthGU * 0.06, launchCapital * 0.3));
    App.store.businesses.push(business);
    person.businessId = business.id;
    person.pulse = 1;
    syncBusinessLeadership(business);
    launchEffects = summarizeTraitEffects(collectTraitEffects(person, ["mobility","business"]), 4);
    recordTraitEffects(launchEffects);
    setTraitSnapshot(person, launchEffects);
    setTraitSnapshot(business, launchEffects);
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

    ensureDecisionData(candidate);
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

  function transferBusiness(owner, heir, business){
    var successionEvaluation;

    if (!business || !heir) return;

    successionEvaluation = evaluateSuccessionCandidate(business, owner, heir);
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

  function liquidateBusiness(owner, business){
    var value = business ? business.valuationGU * 0.5 : 0;

    if (business) {
      releaseLabor(business.countryISO, business.employees || 0);
      pushBusinessEventHistory(business, "Liquidation at " + business.name, "The company could not continue independently.");
      App.store.people.forEach(function(person){
        if (person.employerBusinessId === business.id) {
          clearEmployment(person, business.id);
          syncPerson(person);
        }
      });
    }

    App.store.businesses = App.store.businesses.filter(function(item){
      return item.id !== business.id;
    });
    if (owner && owner.businessId === business.id) {
      owner.businessId = null;
      syncPerson(owner);
    }
    syncHouseholds();
    return value;
  }

  function applyDeathShock(person, business){
    var impacted = [];
    var seen = {};

    if (!person) return;

    if (person.spouseId) {
      impacted.push(App.store.getPerson(person.spouseId));
    }

    App.store.getChildren(person, false).forEach(function(child){
      impacted.push(child);
    });

    if (business) {
      App.store.getBusinessLeadership(business).forEach(function(entry){
        impacted.push(entry.person);
      });
    }

    impacted.filter(Boolean).forEach(function(relative){
      if (seen[relative.id]) return;
      seen[relative.id] = true;
      adjustTemporaryStates(relative, {
        grief:18,
        stress:8,
        confidence:-4
      });
      syncPerson(relative);
    });
  }

  function retirementOdds(age){
    if (age >= 85) return 0.25;
    if (age >= 75) return 0.20;
    if (age >= 65) return 0.12;
    return 0;
  }

  function deathOdds(age){
    if (age >= 85) return 0.10;
    if (age >= 75) return 0.05;
    if (age >= 65) return 0.02;
    return 0;
  }

  function retirePerson(person){
    var business = App.store.getBusiness(person.businessId);
    var employmentBusiness = App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var heir = business ? getPotentialHeir(person) : null;
    var wealthTransfer = person.netWorthGU * 0.25;
    var saleValue;
    var retirementEvent;
    var household;
    var debtHeavyHousehold = false;
    var keepBusinessInFamily = false;
    var debtRelief = 0;
    var supportReserve = 0;

    syncHouseholds();
    household = getHouseholdForPerson(person);
    debtHeavyHousehold = !!(household && (household.financialStress > 78 || (household.debtGU || 0) > ((household.cashOnHandGU || 0) * 1.4)));
    keepBusinessInFamily = !!(business && heir && !debtHeavyHousehold && ((business.cashReservesGU || 0) > (business.revenueGU || 0) * 0.03 || (business.reputation || 0) >= 46));

    person.retired = true;
    person.pulse = 1;

    if (keepBusinessInFamily) {
      transferBusiness(person, heir, business);
      if (household) {
        debtRelief = relieveHouseholdDebt(household, wealthTransfer * 0.35);
        supportReserve = reserveDependentSupport(household, wealthTransfer * 0.18);
      }
      person.netWorthGU -= wealthTransfer;
      heir.netWorthGU += Math.max(0, wealthTransfer - debtRelief - supportReserve);
      retirementEvent = emitNews("retirement", "<strong>" + person.name + "</strong> retired from <strong>" + business.name + "</strong>.", {
        entities:{
          personIds:[person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:["Planned retirement with eligible heir."]
      });
      emitNews("inheritance", "<strong>" + heir.name + "</strong> took over <strong>" + business.name + "</strong> as the next generation heir.", {
        entities:{
          personIds:[heir.id, person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[{
          text:"Succession transfer finalized.",
          eventId:retirementEvent ? retirementEvent.id : null,
          kind:"triggered-by"
        }],
        controlTransfer:true
      });
    } else if (business) {
      saleValue = liquidateBusiness(person, business);
      if (household) {
        debtRelief = relieveHouseholdDebt(household, saleValue * 0.4);
        supportReserve = reserveDependentSupport(household, Math.max(0, saleValue - debtRelief) * 0.15);
      }
      person.netWorthGU += Math.max(0, saleValue - debtRelief - supportReserve);
      emitNews("retirement", "<strong>" + person.name + "</strong> retired and liquidated <strong>" + business.name + "</strong>.", {
        entities:{
          personIds:[person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:["No viable successor at retirement."]
      });
    } else if (employmentBusiness) {
      clearEmployment(person, employmentBusiness.id);
      syncBusinessLeadership(employmentBusiness);
    }

    adjustTemporaryStates(person, {
      stress:-6,
      confidence:-2
    });
    syncHouseholds();
    syncPerson(person);
  }

  function diePerson(person){
    var business = App.store.getBusiness(person.businessId);
    var foundedBusiness = !business ? App.store.businesses.find(function(candidate){
      return candidate && candidate.founderId === person.id;
    }) : null;
    var employmentBusiness = App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var heir = business ? getPotentialHeir(person) : null;
    var survivors = [];
    var estate = person.netWorthGU;
    var successorShare;
    var splitShare;
    var spouse;
    var deathEvent;
    var businessContext = business || foundedBusiness;
    var household;
    var householdMap = {};
    var survivorHouseholds = [];
    var debtHeavyHousehold = false;
    var keepDynastyIntact = false;

    syncHouseholds();
    household = getHouseholdForPerson(person);
    debtHeavyHousehold = !!(household && (household.financialStress > 80 || (household.debtGU || 0) > ((household.cashOnHandGU || 0) * 1.5)));
    keepDynastyIntact = !!(business && heir && !debtHeavyHousehold && ((business.reputation || 0) >= 45 || (business.cashReservesGU || 0) > (business.revenueGU || 0) * 0.025));

    if (keepDynastyIntact) {
      transferBusiness(person, heir, business);
    } else if (business) {
      estate += liquidateBusiness(person, business);
    }

    if (person.spouseId) {
      spouse = App.store.getPerson(person.spouseId);
      if (spouse && spouse.alive) {
        survivors.push(spouse);
        spouse.spouseId = null;
        syncPerson(spouse);
      }
    }

    App.store.getChildren(person, false).forEach(function(child){
      if (child.alive && survivors.indexOf(child) === -1) {
        survivors.push(child);
      }
    });

    survivors.forEach(function(relative){
      var relativeHousehold = getHouseholdForPerson(relative);
      if (!relativeHousehold || householdMap[relativeHousehold.id]) return;
      householdMap[relativeHousehold.id] = true;
      survivorHouseholds.push(relativeHousehold);
    });

    survivorHouseholds.sort(function(first, second){
      return (second.debtGU || 0) - (first.debtGU || 0);
    }).forEach(function(relativeHousehold){
      estate -= relieveHouseholdDebt(relativeHousehold, estate);
    });

    survivorHouseholds.forEach(function(relativeHousehold){
      estate -= reserveDependentSupport(relativeHousehold, estate);
    });

    if (heir) {
      successorShare = estate * 0.5;
      heir.netWorthGU += successorShare;
      splitShare = estate * 0.5;
    } else {
      splitShare = estate;
    }

    if (survivors.length) {
      survivors.forEach(function(relative){
        relative.netWorthGU += splitShare / survivors.length;
      });
    }

    person.netWorthGU = 0;
    person.alive = false;
    person.deathDay = App.store.simDay;
    person.businessId = null;
    person.pulse = 0;
    clearEmployment(person);
    person.spouseId = null;
    if (!business && employmentBusiness) {
      syncBusinessLeadership(employmentBusiness);
    }
    applyDeathShock(person, businessContext || employmentBusiness);
    syncHouseholds();
    syncPerson(person);

    deathEvent = emitNews("death", "<strong>" + person.name + "</strong> died at age " + Math.floor(person.age) + ".", {
      entities:{
        personIds:[person.id],
        businessIds:businessContext ? [businessContext.id] : [],
        countryIsos:[person.countryISO],
        blocIds:[person.blocId]
      },
      causes:["Natural lifecycle event."],
      ownerBusinessId:business ? business.id : null,
      founderBusinessId:foundedBusiness ? foundedBusiness.id : null
    });
    if (heir && business) {
      emitNews("inheritance", "<strong>" + heir.name + "</strong> inherited the " + business.name + " dynasty.", {
        entities:{
          personIds:[heir.id, person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[{
          text:"Dynasty continuity after owner death.",
          eventId:deathEvent ? deathEvent.id : null,
          kind:"triggered-by"
        }],
        controlTransfer:true
      });
    }
  }

  function processSeniorTransitions(){
    App.store.getLivingPeople().slice().sort(function(first, second){
      return second.age - first.age;
    }).forEach(function(person){
      if (person.age < 65) return;
      if (Math.random() < deathOdds(person.age)) {
        diePerson(person);
        return;
      }
      if (!person.retired && Math.random() < retirementOdds(person.age)) {
        retirePerson(person);
      }
    });
  }

  function processYearlyAging(){
    App.store.getLivingPeople().forEach(function(person){
      syncPerson(person);
      if (person.age >= 8) grantTraitMilestone(person, 8);
      if (person.age >= 16) grantTraitMilestone(person, 16);
      ensureDecisionData(person);
      syncPerson(person);
    });
    syncHouseholds();
    (App.store.households || []).forEach(refreshHouseholdSnapshot);
  }

  function processYearlyMarriages(){
    App.store.getLivingPeople().slice().sort(function(first, second){
      return first.age - second.age;
    }).forEach(function(person){
      if (person.spouseId) return;
      if (person.age < 22 || person.age > 50) return;
      tryMarriage(person);
    });
  }

  function processYearlyBirths(){
    App.store.getLivingPeople().forEach(function(person){
      if (person.sex !== "female" || !person.spouseId) return;
      tryBirth(person);
    });
  }

  function processYearlyLaunches(){
    App.store.getLivingPeople().forEach(function(person){
      tryLaunchBusiness(person);
    });
  }

  function markYearlyEvents(){
    App.store.getLivingPeople().forEach(function(person){
      person.lastLifeEventYear = currentYear();
    });
  }

  function runYearlyLifecycle(){
    syncHouseholds();
    updatePopulationProfilesYearly();
    processYearlyAging();
    processYearlyMarriages();
    processYearlyBirths();
    processSeniorTransitions();
    processYearlyLaunches();
    markYearlyEvents();
    syncHouseholds();
    (App.store.households || []).forEach(refreshHouseholdSnapshot);
  }

  function rehydrateLoadedState(){
    var traitCoverage = validateTraitMechanicalCoverage();
    var strictCoverage = !!(global.location && (global.location.hostname === "localhost" || global.location.hostname === "127.0.0.1"));
    var peopleById = {};
    var businessesById = {};

    if (!traitCoverage.ok) {
      console.error("Trait mechanical coverage failed:", traitCoverage.errors.join(" | "));
      if (strictCoverage) {
        throw new Error("Trait mechanical coverage failed: " + traitCoverage.errors.join(" | "));
      }
    }

    App.store.people = (App.store.people || []).filter(function(person){
      return !!(person && person.id);
    }).filter(function(person, index, array){
      return array.findIndex(function(candidate){
        return candidate.id === person.id;
      }) === index;
    });

    App.store.businesses = (App.store.businesses || []).filter(function(business){
      return !!(business && business.id);
    }).filter(function(business, index, array){
      return array.findIndex(function(candidate){
        return candidate.id === business.id;
      }) === index;
    });

    App.store.traitEffectStats = App.store.traitEffectStats || {};
    App.store.newsItems = (App.store.newsItems || []).slice(0, 100);
    App.store.eventHistory = (App.store.eventHistory || []).slice(0, 2000);
    App.store.households = Array.isArray(App.store.households) ? App.store.households : [];
    bootstrapCountryProfiles();

    App.store.people.forEach(function(person){
      peopleById[person.id] = person;
    });

    App.store.businesses.forEach(function(business){
      businessesById[business.id] = business;
    });

    App.store.people.forEach(function(person){
      var estimatedAge;

      person.parentIds = (person.parentIds || []).filter(function(parentId, index, array){
        return parentId && parentId !== person.id && peopleById[parentId] && array.indexOf(parentId) === index;
      });
      person.childrenIds = (person.childrenIds || []).filter(function(childId, index, array){
        return childId && childId !== person.id && peopleById[childId] && array.indexOf(childId) === index;
      });
      if (person.spouseId && (!peopleById[person.spouseId] || person.spouseId === person.id)) {
        person.spouseId = null;
      }
      if (person.businessId && !businessesById[person.businessId]) {
        person.businessId = null;
      }
      if (person.employerBusinessId && !businessesById[person.employerBusinessId]) {
        clearEmployment(person, person.employerBusinessId);
      }
      if (person.birthDay == null) {
        estimatedAge = Number(person.age);
        if (!Number.isFinite(estimatedAge)) estimatedAge = 30;
        person.birthDay = App.store.simDay - Math.round(estimatedAge * YEAR_DAYS);
      }
      if (person.lastLifeEventYear == null) {
        person.lastLifeEventYear = currentYear();
      }
      initializeTraits(person);
      ensureDecisionData(person);
      syncPerson(person);
    });

    App.store.people.forEach(function(person){
      var spouse;
      if (!person.spouseId) return;
      spouse = peopleById[person.spouseId];
      if (!spouse) {
        person.spouseId = null;
        return;
      }
      if (!spouse.spouseId) {
        spouse.spouseId = person.id;
      } else if (spouse.spouseId !== person.id) {
        person.spouseId = null;
      }
    });

    App.store.businesses.forEach(function(business){
      var owner = peopleById[business.ownerId] || null;
      var founder = peopleById[business.founderId] || null;

      if (!owner && founder) {
        business.ownerId = founder.id;
        owner = founder;
      }

      if (!business.founderId && owner) {
        business.founderId = owner.id;
      }

      if (!owner) {
        owner = App.store.people.find(function(candidate){
          return candidate.alive && !candidate.retired && candidate.countryISO === business.countryISO;
        }) || App.store.people.find(function(candidate){
          return candidate.alive && !candidate.retired;
        }) || App.store.people[0] || null;

        if (owner) {
          business.ownerId = owner.id;
          if (!business.founderId) business.founderId = owner.id;
        }
      }

      if (owner && !owner.businessId) {
        owner.businessId = business.id;
      }

      business.decisionHistory = (business.decisionHistory || []).slice(0, 12);
      business.revenueHistory = (business.revenueHistory || []).slice(-20);
      if (business.foundedDay == null) {
        business.foundedDay = App.store.simDay - Math.round(Math.max(0, Number(business.age || 0)) * YEAR_DAYS);
      }
      if (business.foundedDay > App.store.simDay) {
        business.foundedDay = App.store.simDay;
      }
      business.age = Math.round(getBusinessAgeYears(business) * 10) / 10;
      ensureBusinessDecisionState(business);
    });

    App.store.econHist = App.store.econHist || {};
    App.store.blocs.forEach(function(bloc){
      if (!Array.isArray(App.store.econHist[bloc.id])) {
        App.store.econHist[bloc.id] = [];
      }
      App.store.econHist[bloc.id] = App.store.econHist[bloc.id].map(function(value){
        return Number(value);
      }).filter(function(value){
        return Number.isFinite(value);
      }).slice(-60);
    });

    syncCorporateLadders();
    syncHouseholds();
    (App.store.households || []).forEach(refreshHouseholdSnapshot);
    updateBlocGdp();
    validateCountryProfiles();

    App.store.blocs.forEach(function(bloc){
      if (!App.store.econHist[bloc.id].length) {
        App.store.econHist[bloc.id].push(bloc.gdp);
      }
    });

    if (App.events && App.events.rehydrateFromStore) {
      App.events.rehydrateFromStore();
    }
  }

  function initSim(){
    var traitCoverage = validateTraitMechanicalCoverage();
    var strictCoverage = !!(global.location && (global.location.hostname === "localhost" || global.location.hostname === "127.0.0.1"));

    if (!traitCoverage.ok) {
      console.error("Trait mechanical coverage failed:", traitCoverage.errors.join(" | "));
      if (strictCoverage) {
        throw new Error("Trait mechanical coverage failed: " + traitCoverage.errors.join(" | "));
      }
    }

    bootstrapCountryProfiles();

    App.store.blocs.forEach(function(bloc){
      for (var i = 0; i < App.utils.randInt(3, 5); i += 1) {
        var founder = createCitizen({
          blocId:bloc.id,
          age:App.utils.randInt(22, 55)
        });

        App.store.people.push(founder);
        seedHousehold(founder);

        if (Math.random() > 0.25) {
          var business = createBusiness(founder);
          seedBusiness(business);
          App.store.businesses.push(business);
          founder.businessId = business.id;
        }

        syncPerson(founder);
      }
    });

    syncCorporateLadders();
    syncHouseholds();
    (App.store.households || []).forEach(refreshHouseholdSnapshot);
    updateBlocGdp();
    validateCountryProfiles();
    emitNews("market", "NEXUS initialized with family dynasties, heirs, marriages, births, retirements, inheritance, and executive decision-making.", {
      causes:["Simulation bootstrap complete."]
    });
  }

  function randomEvent(){
    var type = App.utils.pick(["tradeWar","tariff","default","boom","ipo","scandal","hire"]);
    var bloc = App.utils.pick(App.store.blocs);
    var otherBloc = App.utils.pick(App.store.blocs.filter(function(item){ return item.id !== bloc.id; }));
    var ipoBusiness;
    var owner;
    var scandalBusiness;
    var hireBusiness;

    if (type === "tradeWar") {
      bloc.geoPressure += App.utils.rand(1, 3);
      otherBloc.geoPressure += App.utils.rand(0.5, 2);
      emitNews("tariff", "TRADE WAR: " + bloc.flag + bloc.name + " vs " + otherBloc.flag + otherBloc.name + ". Currency pressure is rising.", {
        entities:{ blocIds:[bloc.id, otherBloc.id] },
        scope:"global",
        causes:["Mutual tariff escalation."]
      });
      return;
    }

    if (type === "tariff") {
      bloc.geoPressure += App.utils.rand(0.5, 2);
      emitNews("tariff", "TARIFF: " + bloc.flag + " " + bloc.name + " imposed new import duties. " + bloc.currency + " is under pressure.", {
        entities:{ blocIds:[bloc.id] },
        scope:"bloc",
        causes:["Import duties increased trade friction."]
      });
      return;
    }

    if (type === "default") {
      bloc.defaultRisk += App.utils.rand(1, 3);
      bloc.geoPressure += 2;
      App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }).forEach(function(business){
        business.revenueGU *= App.utils.rand(0.82, 0.93);
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) * App.utils.rand(0.88, 0.97));
        business.currentDecision = evaluateBusinessDecision(business);
      });
      emitNews("default", "DEBT CRISIS: " + bloc.flag + " " + bloc.name + " is sliding. " + bloc.currency + " is falling fast.", {
        entities:{ blocIds:[bloc.id] },
        scope:"bloc",
        causes:["Debt stress and confidence erosion."]
      });
      return;
    }

    if (type === "boom") {
      App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }).forEach(function(business){
        business.revenueGU *= App.utils.rand(1.04, 1.12);
        business.cashReservesGU += business.revenueGU * App.utils.rand(0.006, 0.02);
        business.reputation = clampScore((business.reputation || 50) + App.utils.rand(0.6, 2.4));
        business.currentDecision = evaluateBusinessDecision(business);
      });
      emitNews("market", "BOOM: " + bloc.flag + " " + bloc.name + " posted record growth. " + bloc.currency + " is surging.", {
        entities:{ blocIds:[bloc.id] },
        scope:"bloc",
        causes:["Revenue expansion across bloc industries."]
      });
      return;
    }

    if (type === "ipo") {
      ipoBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
      if (ipoBusiness) {
        ipoBusiness.valuationGU *= App.utils.rand(1.35, 2.4);
        owner = App.store.getPerson(ipoBusiness.ownerId);
        if (owner && owner.alive) {
          owner.netWorthGU += ipoBusiness.valuationGU * App.utils.rand(0.05, 0.14);
          owner.pulse = 1;
        }
        emitNews("ipo", bloc.flag + " <strong>" + ipoBusiness.name + "</strong> IPO at " + App.utils.fmtL(ipoBusiness.valuationGU, bloc) + ".", {
          entities:{
            businessIds:[ipoBusiness.id],
            personIds:owner ? [owner.id] : [],
            countryIsos:[ipoBusiness.countryISO],
            blocIds:[ipoBusiness.blocId]
          },
          causes:["Valuation breakout triggered listing momentum."]
        });
      }
      return;
    }

    if (type === "scandal") {
      scandalBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
      if (scandalBusiness) {
        scandalBusiness.revenueGU *= App.utils.rand(0.78, 0.92);
        scandalBusiness.reputation = clampScore((scandalBusiness.reputation || 50) - App.utils.rand(6, 15));
        applyLeadershipStateChange(scandalBusiness, {
          confidence:-12,
          stress:16,
          burnout:4
        });
        scandalBusiness.currentDecision = evaluateBusinessDecision(scandalBusiness);
        pushBusinessEventHistory(scandalBusiness, "Scandal hit " + scandalBusiness.name, "Public trust collapsed and leadership came under pressure.");
        emitNews("scandal", bloc.flag + " <strong>" + scandalBusiness.name + "</strong> was hit by scandal. Revenue collapsed.", {
          entities:{
            businessIds:[scandalBusiness.id],
            countryIsos:[scandalBusiness.countryISO],
            blocIds:[scandalBusiness.blocId]
          },
          causes:["Public trust collapsed after scandal exposure."]
        });
      }
      return;
    }

    if (type === "hire") {
      hireBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
      if (hireBusiness) {
        var leadershipFloor = Math.max((hireBusiness.leadership || []).length, 1);
        var requestedHires = App.utils.randInt(2, 12);
        var headroom = Math.max(0, 2000 - Math.max(leadershipFloor, hireBusiness.employees || 0));
        var hires = reserveLabor(hireBusiness.countryISO, Math.min(requestedHires, headroom));
        hireBusiness.employees = Math.max(leadershipFloor, Math.min(2000, (hireBusiness.employees || leadershipFloor) + hires));
        hireBusiness.reputation = clampScore((hireBusiness.reputation || 50) + App.utils.rand(0.4, 1.6));
        applyLeadershipStateChange(hireBusiness, {
          confidence:4,
          stress:-2
        });
        hireBusiness.currentDecision = evaluateBusinessDecision(hireBusiness);
        pushBusinessEventHistory(hireBusiness, "Hiring surge at " + hireBusiness.name, "Leadership expanded headcount after a favorable run.");
        if (hires > 0) {
          emitNews("hire", bloc.flag + " <strong>" + hireBusiness.name + "</strong> added " + hires + " new hires.", {
            entities:{
              businessIds:[hireBusiness.id],
              countryIsos:[hireBusiness.countryISO],
              blocIds:[hireBusiness.blocId]
            },
            causes:["Leadership opened headcount for expansion."],
            rollupLabel:hireBusiness.name
          });
        } else {
          emitNews("hire", bloc.flag + " <strong>" + hireBusiness.name + "</strong> attempted a hiring surge but local labor supply was tight.", {
            entities:{
              businessIds:[hireBusiness.id],
              countryIsos:[hireBusiness.countryISO],
              blocIds:[hireBusiness.blocId]
            },
            causes:["Local labor pool could not satisfy requested hires."],
            rollupLabel:hireBusiness.name
          });
        }
      }
    }
  }

  function processBusinessTick(){
    App.store.getLivingPeople().forEach(function(person){
      var bloc = App.store.getBloc(person.blocId);
      var business = App.store.getBusiness(person.businessId);
      var employerBusiness = !business && App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
      var decision;
      var annualTargetRevenue;
      var annualGrowthBands;
      var annualGrowthTarget;
      var dailyRevenueRate;
      var dailyRevenueNoise;
      var margin;
      var reserveShareRate;
      var cashDelta = 0;
      var ownerShare = 0;
      var employeeDelta = 0;
      var requestedEmployeeDelta = 0;
      var leadershipFloor;
      var reputationDelta = 0;
      var bankruptcyPressure;
      var ownerBusinessTrait = 0;
      var ownerMobilityTrait = 0;
      var businessTickEffects;
      var demandPenalty;
      var headroom;
      var workforceDelta = 0;
      var currentHeadcount = 0;
      var payrollAnnual = 0;
      var operatingCostAnnual = 0;
      var dailyProfit = 0;
      var loss = 0;
      var coveredByCash = 0;
      var ageYears = 0;
      var cashCoverage = 0;
      var shouldRecordDecision = false;

      ensureDecisionData(person);
      if (!business) {
        if (!(employerBusiness && App.store.isBusinessLeader && App.store.isBusinessLeader(person))) {
          settleTemporaryStates(person);
        }
        person.netWorthGU = Math.max(100, person.netWorthGU);
        person.pulse = Math.random() < 0.04 ? 1 : 0;
        syncPerson(person);
        return;
      }

      ensureBusinessDecisionState(business);
      settleLeadershipStates(business);
      decision = evaluateBusinessDecision(business);
      ownerBusinessTrait = getTraitChannelScore(person, "business");
      ownerMobilityTrait = getTraitChannelScore(person, "mobility");
      businessTickEffects = summarizeTraitEffects(collectTraitEffects(person, ["business","mobility"]), 4);
      leadershipFloor = Math.max((business.leadership || []).length, 1);
      demandPenalty = getDemandCapPenalty(business);
      annualTargetRevenue = computeBusinessAnnualRevenueTarget(business, decision, ownerBusinessTrait, ownerMobilityTrait);
      annualGrowthBands = getBusinessAnnualGrowthBands(business);
      annualGrowthTarget =
        ((annualTargetRevenue / Math.max(1, business.revenueGU || 1)) - 1) +
        (getRevenueTrend(business) * 0.24) -
        (bloc.geoPressure * 0.02) -
        (demandPenalty * 0.5) +
        clampTraitDelta(ownerBusinessTrait / 180, 0.05) +
        clampTraitDelta(ownerMobilityTrait / 260, 0.03);
      annualGrowthTarget = App.utils.clamp(annualGrowthTarget, annualGrowthBands.min, annualGrowthBands.max);
      dailyRevenueRate = dailyRateFromAnnualChange(annualGrowthTarget);
      dailyRevenueNoise = App.utils.rand(-0.0016, 0.0019);
      business.revenueGU = Math.max(
        getCountryMedianWage(business.countryISO) * 1.2,
        (business.revenueGU || 0) * Math.max(0.975, 1 + dailyRevenueRate + dailyRevenueNoise)
      );

      payrollAnnual = getLeadershipPayrollAnnual(business) + getAnonymousPayrollAnnual(business);
      operatingCostAnnual = business.revenueGU * getOperatingCostRate(business) * (1 + App.utils.clamp(bloc.geoPressure * 0.05, 0, 0.16));
      business.profitGU = business.revenueGU - payrollAnnual - operatingCostAnnual;
      margin = App.utils.clamp((business.profitGU || 0) / Math.max(1, business.revenueGU || 1), -0.4, 0.4);
      business.currentDecision = decision;
      ageYears = getBusinessAgeYears(business);
      business.age = Math.round(ageYears * 10) / 10;
      if ((App.store.simDay % 18) < SIM_DAYS_PER_TICK) {
        business.revenueHistory.push(business.revenueGU);
        if (business.revenueHistory.length > 20) {
          business.revenueHistory.shift();
        }
      }

      dailyProfit = (business.profitGU || 0) / YEAR_DAYS * SIM_DAYS_PER_TICK;
      reserveShareRate = getReserveShareRate(business, decision);

      if (dailyProfit > 0) {
        cashDelta = dailyProfit * reserveShareRate;
        ownerShare = dailyProfit - cashDelta;
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + cashDelta);
        person.netWorthGU += ownerShare;
      } else {
        loss = Math.abs(dailyProfit);
        coveredByCash = Math.min(loss, business.cashReservesGU || 0);
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) - coveredByCash);
        cashDelta = -coveredByCash;
        person.netWorthGU -= (loss - coveredByCash);
      }

      if (decision.staffingAction === "hire" && Math.random() < chanceForDays(0.28, DAYS_PER_MONTH)) {
        requestedEmployeeDelta = App.utils.randInt(1, Math.max(1, Math.min(5, Math.ceil((business.employees || 1) * (decision.stance === "aggressive" ? 0.06 : 0.03)))));
      } else if (decision.staffingAction === "layoff" && Math.random() < chanceForDays(0.22, DAYS_PER_MONTH)) {
        requestedEmployeeDelta = -App.utils.randInt(1, Math.max(1, Math.min(6, Math.ceil((business.employees || 1) * (decision.stance === "retrenching" ? 0.08 : 0.04)))));
      }

      currentHeadcount = Math.max(leadershipFloor, business.employees || leadershipFloor);
      if (requestedEmployeeDelta > 0) {
        headroom = Math.max(0, 2000 - currentHeadcount);
        workforceDelta = reserveLabor(business.countryISO, Math.min(requestedEmployeeDelta, headroom));
      } else if (requestedEmployeeDelta < 0) {
        workforceDelta = -releaseLabor(business.countryISO, Math.abs(requestedEmployeeDelta));
      }
      employeeDelta = workforceDelta;
      business.employees = Math.max(leadershipFloor, Math.min(2000, currentHeadcount + employeeDelta));

      reputationDelta += business.profitGU > 0 ? App.utils.clamp(margin * 8, 0.05, 0.9) : App.utils.clamp(margin * 11, -1.9, -0.08);
      if (employeeDelta < 0) reputationDelta -= App.utils.rand(0.2, 0.7);
      if (employeeDelta > 0) reputationDelta += App.utils.rand(0.05, 0.25);
      if (decision.stance === "retrenching") reputationDelta -= 0.2;
      if (decision.cashPolicy === "reinvest" && business.profitGU > 0) reputationDelta += 0.12;
      if (demandPenalty > 0.001) reputationDelta -= App.utils.clamp(demandPenalty * 3.5, 0.08, 0.45);
      reputationDelta += clampTraitDelta(ownerBusinessTrait / 18, 0.35);
      business.reputation = clampScore((business.reputation || 50) + reputationDelta);
      cashCoverage = getCashCoverageMonths(business);
      business.valuationGU = business.revenueGU * App.utils.clamp(1.15 + ((business.reputation || 50) / 42) + (margin * 3.5) + (cashCoverage * 0.08), 1.05, 5.6);

      if (ageYears > 2 && business.stage === "startup") business.stage = "growth";
      if (ageYears > 8 && business.stage === "growth") business.stage = "established";
      if (business.profitGU < -business.revenueGU * 0.08 && business.stage === "established") business.stage = "declining";
      if (business.reputation < 28 && business.stage !== "startup") business.stage = "declining";
      if (business.stage === "declining" && business.profitGU > business.revenueGU * 0.12 && business.reputation > 60) {
        business.stage = "growth";
      }

      bankruptcyPressure =
        (cashCoverage < 1 ? 1 : 0) +
        (business.profitGU < -business.revenueGU * 0.12 ? 1 : 0) +
        (business.reputation < 28 ? 1 : 0) +
        (getPersonFinancialStress(person) > 0.75 ? 0.8 : 0) +
        (decision.stance === "aggressive" ? 0.35 : 0);
      bankruptcyPressure += ownerBusinessTrait < -6 ? 0.35 : 0;
      bankruptcyPressure += ownerBusinessTrait > 6 ? -0.2 : 0;

      if (bankruptcyPressure >= 3 && Math.random() < chanceForDays(App.utils.clamp((bankruptcyPressure - 2) * 0.24, 0.05, 0.38), YEAR_DAYS / 2)) {
        emitNews("bankruptcy", "<strong>" + person.name + "</strong> " + bloc.flag + " - <strong>" + business.name + "</strong> went bankrupt.", {
          tags:buildTraitEffectTags(businessTickEffects, 2),
          entities:{
            personIds:[person.id],
            businessIds:[business.id],
            countryIsos:[business.countryISO],
            blocIds:[business.blocId]
          },
          causes:["Sustained losses and reputation stress triggered insolvency."]
        });
        liquidateBusiness(person, business);
        person.netWorthGU = Math.max(600, person.netWorthGU * 0.32);
        person.pulse = 1;
        adjustTemporaryStates(person, {
          confidence:-16,
          stress:18,
          burnout:6
        });
        syncPerson(person);
        return;
      }

      shouldRecordDecision = (App.store.simDay % 15) < SIM_DAYS_PER_TICK || employeeDelta !== 0 || Math.abs(reputationDelta) > 0.8;
      if (shouldRecordDecision) {
        pushBusinessDecisionHistory(business, {
          id:randomId(),
          madeAtDay:decision.madeAtDay,
          stance:decision.stance,
          staffingAction:decision.staffingAction,
          cashPolicy:decision.cashPolicy,
          successionBias:decision.successionBias,
          reasons:decision.reasons.slice(0, 3),
          traitEffects:(decision.traitEffects || []).slice(0, 4),
          influencers:decision.influencers.slice(0, 3),
          summary:summarizeDecisionOutcome(decision, employeeDelta, cashDelta, reputationDelta)
        });

        applyLeadershipStateChange(business, {
          confidence:business.profitGU > 0 ? 2 : -3,
          stress:business.profitGU > 0 ? -1 : 3,
          burnout:decision.stance === "aggressive" ? 1 : (decision.stance === "retrenching" ? 1 : 0),
          ambitionSpike:decision.stance === "aggressive" ? 1 : 0
        });
      }

      person.netWorthGU = Math.max(100, person.netWorthGU);
      person.pulse = Math.random() < 0.08 ? 1 : 0;
      recordTraitEffects(decision.traitEffects || []);
      setTraitSnapshot(person, businessTickEffects.length ? businessTickEffects : (decision.traitEffects || []));
      setTraitSnapshot(business, decision.traitEffects || []);
      syncPerson(person);
    });
    processHouseholdTick();
  }

  function pickWeightedBy(candidates, weightFn){
    var weighted = [];
    var total = 0;
    var roll;
    var running = 0;

    (candidates || []).forEach(function(candidate){
      var weight = Math.max(0, Number(weightFn(candidate) || 0));
      if (weight <= 0) return;
      weighted.push({ candidate:candidate, weight:weight });
      total += weight;
    });

    if (!weighted.length || total <= 0) return null;

    roll = Math.random() * total;
    for (var i = 0; i < weighted.length; i += 1) {
      running += weighted[i].weight;
      if (running >= roll) {
        return weighted[i].candidate;
      }
    }

    return weighted[weighted.length - 1].candidate;
  }

  function maybeCreateDeal(){
    var dealPeople = App.store.getLivingPeople().filter(function(person){
      return !!person.businessId;
    });
    var first;
    var secondCandidates;
    var second;
    var firstBusiness;
    var secondBusiness;
    var firstBloc;
    var secondBloc;
    var compatibility;
    var dealTraitScore;
    var valueFloor;
    var valueCeiling;
    var value;
    var dealEffects;

    if (!dealPeople.length) return;

    first = pickWeightedBy(dealPeople, function(person){
      var business = App.store.getBusiness(person.businessId);
      var reputation = business ? (business.reputation || 50) : 50;
      var dealScore = getTraitChannelScore(person, "deal");
      var mobilityScore = getTraitChannelScore(person, "mobility");
      return App.utils.clamp(1 + reputation * 0.02 + dealScore * 0.65 + mobilityScore * 0.25, 0.2, 12);
    });

    if (!first) return;

    secondCandidates = dealPeople.filter(function(person){
      return person.id !== first.id && person.blocId !== first.blocId;
    });
    if (!secondCandidates.length) return;

    second = pickWeightedBy(secondCandidates, function(person){
      var business = App.store.getBusiness(person.businessId);
      var reputation = business ? (business.reputation || 50) : 50;
      var dealScore = getTraitChannelScore(person, "deal");
      var firstBlocRef = App.store.getBloc(first.blocId);
      var candidateBloc = App.store.getBloc(person.blocId);
      var pressure = (firstBlocRef ? firstBlocRef.geoPressure : 0) + (candidateBloc ? candidateBloc.geoPressure : 0);
      var localCompatibility = App.utils.clamp(1.85 - pressure * 0.22, 0.25, 1.85);
      return App.utils.clamp((1 + reputation * 0.018 + dealScore * 0.6) * localCompatibility, 0.15, 15);
    });

    if (!second) return;

    firstBusiness = App.store.getBusiness(first.businessId);
    secondBusiness = App.store.getBusiness(second.businessId);
    firstBloc = App.store.getBloc(first.blocId);
    secondBloc = App.store.getBloc(second.blocId);
    compatibility = App.utils.clamp(1.85 - (((firstBloc ? firstBloc.geoPressure : 0) + (secondBloc ? secondBloc.geoPressure : 0)) * 0.22), 0.25, 1.85);
    dealTraitScore = (getTraitChannelScore(first, "deal") + getTraitChannelScore(second, "deal")) / 2;
    valueFloor = 40000 * compatibility * (1 + App.utils.clamp(dealTraitScore / 45, -0.22, 0.35));
    valueCeiling = 600000 * compatibility * (1 + App.utils.clamp(dealTraitScore / 35, -0.24, 0.4));
    if (valueCeiling <= valueFloor) {
      valueCeiling = valueFloor + 25000;
    }
    value = App.utils.rand(valueFloor, valueCeiling);
    dealEffects = summarizeTraitEffects(collectGroupTraitEffects([first, second], ["deal","business"]), 4);

    if (firstBloc && secondBloc) {
      emitNews("deal", firstBloc.flag + "x" + secondBloc.flag + " <strong>" + first.name + "</strong> & <strong>" + second.name + "</strong> closed " + App.utils.fmtGU(value) + ".", {
        tags:buildTraitEffectTags(dealEffects, 2),
        entities:{
          personIds:[first.id, second.id],
          businessIds:[firstBusiness ? firstBusiness.id : null, secondBusiness ? secondBusiness.id : null].filter(Boolean),
          countryIsos:[first.countryISO, second.countryISO],
          blocIds:[firstBloc.id, secondBloc.id]
        },
        scope:"global",
        causes:dealEffects.slice(0, 2).map(function(effect){ return effect.label; })
      });
    }

    if (firstBusiness) {
      firstBusiness.reputation = clampScore((firstBusiness.reputation || 50) + App.utils.clamp(dealTraitScore * 0.2, -1.2, 2.2));
      firstBusiness.currentDecision = evaluateBusinessDecision(firstBusiness);
    }
    if (secondBusiness) {
      secondBusiness.reputation = clampScore((secondBusiness.reputation || 50) + App.utils.clamp(dealTraitScore * 0.2, -1.2, 2.2));
      secondBusiness.currentDecision = evaluateBusinessDecision(secondBusiness);
    }

    first.netWorthGU += value * 0.04;
    second.netWorthGU += value * 0.04;
    recordTraitEffects(dealEffects);
    setTraitSnapshot(first, dealEffects);
    setTraitSnapshot(second, dealEffects);
    if (firstBusiness) setTraitSnapshot(firstBusiness, dealEffects);
    if (secondBusiness) setTraitSnapshot(secondBusiness, dealEffects);
  }

  function maybeAddArrival(){
    var nextBloc;
    var arrival;

    if (App.store.getLivingCount() >= 120 || Math.random() >= chanceForDays(0.02, LEGACY_SIM_DAYS_PER_TICK)) {
      return;
    }

    nextBloc = App.utils.pick(App.store.blocs);
    arrival = createCitizen({
      blocId:nextBloc.id,
      countryISO:pickCountryByPopulationPressure(nextBloc.id) || undefined,
      age:App.utils.randInt(22, 45),
      netWorthGU:App.utils.rand(1500, 22000)
    });
    App.store.people.push(arrival);
    seedHousehold(arrival);
    syncPerson(arrival);
    emitNews("launch", nextBloc.flag + " <strong>" + arrival.name + "</strong> arrived with " + App.utils.fmtCountry(arrival.netWorthGU, arrival.countryISO) + ".", {
      entities:{
        personIds:[arrival.id],
        countryIsos:[arrival.countryISO],
        blocIds:[arrival.blocId]
      },
      causes:["Population pressure created a new arrival."],
      rollupLabel:arrival.countryISO
    });
  }

  function pushEconomicHistory(){
    App.store.blocs.forEach(function(bloc){
      App.store.econHist[bloc.id].push(bloc.gdp);
      if (App.store.econHist[bloc.id].length > 60) {
        App.store.econHist[bloc.id].shift();
      }
    });
  }

  function simTick(){
    var previousYear = currentYear();

    App.store.simDay += SIM_DAYS_PER_TICK;
    processBusinessTick();

    if (currentYear() > previousYear) {
      runYearlyLifecycle();
    }

    if (Math.random() < chanceForDays(0.11, LEGACY_SIM_DAYS_PER_TICK)) {
      randomEvent();
    }

    if (Math.random() < chanceForDays(0.06, LEGACY_SIM_DAYS_PER_TICK)) {
      maybeCreateDeal();
    }

    maybeAddArrival();
    syncCorporateLadders();

    App.store.people.forEach(function(person){
      syncPerson(person);
    });

    updateBlocGdp();
    pushEconomicHistory();
    updateForex();
    if (App.persistence && App.persistence.autoCheckpoint) {
      App.persistence.autoCheckpoint();
    }
    App.ui.renderAll();
    App.map.updateCountryColors();
  }

  function loop(now){
    var delta = now - lastFrameTime;
    lastFrameTime = now;
    App.store.accumulator += delta * App.store.simSpeed;

    if (App.store.accumulator >= App.data.TICK_MS) {
      App.store.accumulator = 0;
      simTick();
    }

    requestAnimationFrame(loop);
  }

  function start(){
    requestAnimationFrame(loop);
  }

  App.sim = {
    initSim:initSim,
    rehydrateLoadedState:rehydrateLoadedState,
    start:start,
    tickOnce:simTick,
    getPotentialHeir:getPotentialHeir,
    evaluateBusinessDecision:evaluateBusinessDecision,
    evaluateSuccessionCandidate:evaluateSuccessionCandidate,
    syncHouseholds:syncHouseholds,
    syncCorporateLadders:syncCorporateLadders,
    reserveLabor:reserveLabor,
    releaseLabor:releaseLabor,
    updatePopulationProfilesYearly:updatePopulationProfilesYearly
  };
})(window);
