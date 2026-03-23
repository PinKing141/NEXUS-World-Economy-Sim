(function(global){
  var App = global.Nexus || (global.Nexus = {});
  var YEAR_DAYS = 360;
  var lastFrameTime = performance.now();
  var ENTREPRENEURIAL_TRAITS = {
    Ambitious:true,
    Visionary:true,
    "Risk-taker":true,
    Innovator:true
  };
  var TICKS_PER_YEAR = YEAR_DAYS / 3;
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

  function randomId(){
    return Math.random().toString(36).slice(2);
  }

  function currentYear(){
    return Math.floor(App.store.simDay / YEAR_DAYS);
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
      var appreciation;

      bloc.prevRate = bloc.rate;
      ratio = bloc.gdp / avg;
      pressure = 1 - bloc.geoPressure * 0.04;
      defaultRisk = 1 - bloc.defaultRisk * 0.15;
      noise = 1 + (Math.random() - 0.5) * 0.007;
      appreciation = ratio > 1 ? -0.0015 * (ratio - 1) : 0.002 * (1 - ratio);

      bloc.rate = bloc.rate * (1 + appreciation) * pressure * defaultRisk * noise;
      bloc.rate = Math.max(bloc.baseRate * 0.4, Math.min(bloc.baseRate * 2.8, bloc.rate));
      bloc.rateHistory.push(bloc.rate);
      if (bloc.rateHistory.length > 60) {
        bloc.rateHistory.shift();
      }
      bloc.geoPressure = Math.max(0, bloc.geoPressure - 0.07);
      bloc.defaultRisk = Math.max(0, bloc.defaultRisk - 0.04);
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
    var business = {
      id:randomId(),
      name:owner.lastName + " " + App.utils.pick(App.data.BIZ_SFX),
      industry:App.utils.pick(App.data.INDUSTRIES),
      ownerId:owner.id,
      founderId:owner.id,
      blocId:owner.blocId,
      countryISO:owner.countryISO,
      lineageId:owner.lineageId,
      revenueGU:App.utils.rand(20000, 200000),
      profitGU:0,
      valuationGU:0,
      employees:App.utils.randInt(1, 12),
      leadership:[],
      logo:null,
      reputation:App.utils.rand(45, 70),
      cashReservesGU:0,
      currentDecision:null,
      decisionHistory:[],
      stage:"startup",
      age:0,
      successionCount:0,
      inheritedAtDay:null,
      revenueHistory:[]
    };

    ensureBusinessLogo(business);
    return business;
  }

  function seedBusiness(business){
    ensureBusinessLogo(business);
    business.profitGU = business.revenueGU * App.utils.rand(-0.05, 0.25);
    business.valuationGU = business.revenueGU * App.utils.rand(1.5, 4);
    business.cashReservesGU = Math.max(6000, business.revenueGU * App.utils.rand(0.05, 0.18));
    business.reputation = clampScore(business.reputation != null ? business.reputation : App.utils.rand(45, 70));
    business.decisionHistory = business.decisionHistory || [];
    business.revenueHistory = Array.from({ length:8 }, function(){
      return business.revenueGU * App.utils.rand(0.8, 1.2);
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

  function getRoleSalary(business, role){
    var factor = 0.002 + ((role.importance || 1) * 0.0012);
    return Math.max(120, Math.round((business.revenueGU || 0) * factor));
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
    business.employees = Math.max(nextLeadership.length || 1, business.employees || 0);
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

  function buildDecisionReasons(business, metrics, makers){
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
      scores.expansion += getLeaderExpansionLean(entry.person) * weights.expansion;
      scores.staffing += getLeaderStaffingLean(entry.person) * weights.staffing;
      scores.cash += getLeaderCashLean(entry.person) * weights.cash;
      scores.succession += getLeaderSuccessionLean(entry.person, business) * weights.succession;
    });

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
      reasons:buildDecisionReasons(business, metrics, makers),
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

  function createGeneratedSpouse(person, explicitAge){
    var spouse = createCitizen({
      blocId:person.blocId,
      countryISO:person.countryISO,
      state:person.state,
      sex:person.sex === "male" ? "female" : "male",
      age:explicitAge != null ? explicitAge : App.utils.clamp(person.age + App.utils.randInt(-6, 6), 22, 60),
      netWorthGU:App.utils.rand(1500, 18000),
      anchorPerson:person
    });

    App.store.people.push(spouse);
    linkSpouses(person, spouse);
    spouse.pulse = 1;
    person.pulse = 1;
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
      return;
    }

    if (childPattern === "single-older") {
      childAge = App.utils.randInt(5, Math.min(18, Math.max(5, Math.floor(person.age - 22))));
      createChild([person, spouse], childAge);
      return;
    }

    olderChildAge = App.utils.randInt(8, Math.min(18, Math.max(8, Math.floor(person.age - 22))));
    youngerChildAge = Math.max(0, olderChildAge - App.utils.randInt(2, 6));
    createChild([person, spouse], olderChildAge);
    createChild([person, spouse], youngerChildAge);
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
        if (!candidate.businessId) value += 4;
        if (person.countryISO === "US" && person.state && candidate.state === person.state) value += 3;
        value += Math.max(0, 6 - Math.abs(person.age - candidate.age));
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

    App.ui.addNews("marriage", "<strong>" + person.name + "</strong> and <strong>" + spouse.name + "</strong> married in " + App.store.getCountryName(person.countryISO) + ".");
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
    if (Math.random() >= birthChance) {
      return;
    }

    child = createChild([mother, spouse], 0);
    App.ui.addNews("birth", "<strong>" + mother.name + "</strong> and <strong>" + spouse.name + "</strong> welcomed <strong>" + child.name + "</strong>.");
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

    if (!person.alive || person.retired || person.businessId || person.age < 22) return;

    chance = hasEntrepreneurialTraits(person) ? 0.06 : 0.02;
    if (Math.random() >= chance) {
      return;
    }

    business = createBusiness(person);
    seedBusiness(business);
    App.store.businesses.push(business);
    person.businessId = business.id;
    person.pulse = 1;
    syncBusinessLeadership(business);
    syncPerson(person);
    App.ui.addNews("launch", "<strong>" + person.name + "</strong> " + bloc.flag + " launched <strong>" + business.name + "</strong> in " + business.industry + ".");
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

    if (currentDecision.successionBias === "family") {
      readiness += isFamily ? 38 : -28;
    } else if (currentDecision.successionBias === "merit") {
      readiness += isFamily ? -10 : 18;
    }

    return {
      candidate:candidate,
      score:Math.round(readiness),
      isFamily:isFamily,
      roleImportance:roleImportance
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
    business.employees = Math.max(leadershipFloor, business.employees + employeeDelta);

    adjustTemporaryStates(heir, {
      confidence:evaluated.score >= 48 ? 8 : 4,
      stress:evaluated.score >= 48 ? -2 : 5,
      ambitionSpike:6
    });
    adjustTemporaryStates(owner, {
      confidence:-3,
      stress:-4
    });

    pushBusinessEventHistory(
      business,
      evaluated.isFamily ? "Family succession at " + business.name : "Internal succession at " + business.name,
      evaluated.score >= 48 ? "Leadership transitioned cleanly." : "Leadership changed under visible strain."
    );
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

    person.retired = true;
    person.pulse = 1;

    if (business && heir) {
      transferBusiness(person, heir, business);
      person.netWorthGU -= wealthTransfer;
      heir.netWorthGU += wealthTransfer;
      App.ui.addNews("retirement", "<strong>" + person.name + "</strong> retired from <strong>" + business.name + "</strong>.");
      App.ui.addNews("inheritance", "<strong>" + heir.name + "</strong> took over <strong>" + business.name + "</strong> as the next generation heir.");
    } else if (business) {
      saleValue = liquidateBusiness(person, business);
      person.netWorthGU += saleValue;
      App.ui.addNews("retirement", "<strong>" + person.name + "</strong> retired and liquidated <strong>" + business.name + "</strong>.");
    } else if (employmentBusiness) {
      clearEmployment(person, employmentBusiness.id);
      syncBusinessLeadership(employmentBusiness);
    }

    adjustTemporaryStates(person, {
      stress:-6,
      confidence:-2
    });
    syncPerson(person);
  }

  function diePerson(person){
    var business = App.store.getBusiness(person.businessId);
    var employmentBusiness = App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var heir = business ? getPotentialHeir(person) : null;
    var survivors = [];
    var estate = person.netWorthGU;
    var successorShare;
    var splitShare;
    var spouse;

    if (business && heir) {
      transferBusiness(person, heir, business);
    } else if (business) {
      estate += liquidateBusiness(person, business);
    }

    if (person.spouseId) {
      spouse = App.store.getPerson(person.spouseId);
      if (spouse && spouse.alive) {
        survivors.push(spouse);
      }
    }

    App.store.getChildren(person, false).forEach(function(child){
      if (child.alive && survivors.indexOf(child) === -1) {
        survivors.push(child);
      }
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
    if (!business && employmentBusiness) {
      syncBusinessLeadership(employmentBusiness);
    }
    applyDeathShock(person, business || employmentBusiness);
    syncPerson(person);

    App.ui.addNews("death", "<strong>" + person.name + "</strong> died at age " + Math.floor(person.age) + ".");
    if (heir && business) {
      App.ui.addNews("inheritance", "<strong>" + heir.name + "</strong> inherited the " + business.name + " dynasty.");
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
    processYearlyAging();
    processYearlyMarriages();
    processYearlyBirths();
    processSeniorTransitions();
    processYearlyLaunches();
    markYearlyEvents();
  }

  function initSim(){
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
    updateBlocGdp();
    App.ui.addNews("market", "NEXUS initialized with family dynasties, heirs, marriages, births, retirements, inheritance, and executive decision-making.");
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
      App.ui.addNews("tariff", "TRADE WAR: " + bloc.flag + bloc.name + " vs " + otherBloc.flag + otherBloc.name + ". Currency pressure is rising.");
      return;
    }

    if (type === "tariff") {
      bloc.geoPressure += App.utils.rand(0.5, 2);
      App.ui.addNews("tariff", "TARIFF: " + bloc.flag + " " + bloc.name + " imposed new import duties. " + bloc.currency + " is under pressure.");
      return;
    }

    if (type === "default") {
      bloc.defaultRisk += App.utils.rand(1, 3);
      bloc.geoPressure += 2;
      App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }).forEach(function(business){
        business.revenueGU *= App.utils.rand(0.7, 0.85);
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) * App.utils.rand(0.8, 0.95));
        business.currentDecision = evaluateBusinessDecision(business);
      });
      App.ui.addNews("default", "DEBT CRISIS: " + bloc.flag + " " + bloc.name + " is sliding. " + bloc.currency + " is falling fast.");
      return;
    }

    if (type === "boom") {
      App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }).forEach(function(business){
        business.revenueGU *= App.utils.rand(1.1, 1.3);
        business.cashReservesGU += business.revenueGU * App.utils.rand(0.01, 0.04);
        business.reputation = clampScore((business.reputation || 50) + App.utils.rand(1, 4));
        business.currentDecision = evaluateBusinessDecision(business);
      });
      App.ui.addNews("market", "BOOM: " + bloc.flag + " " + bloc.name + " posted record growth. " + bloc.currency + " is surging.");
      return;
    }

    if (type === "ipo") {
      ipoBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
      if (ipoBusiness) {
        ipoBusiness.valuationGU *= App.utils.rand(2, 5);
        owner = App.store.getPerson(ipoBusiness.ownerId);
        if (owner && owner.alive) {
          owner.netWorthGU += ipoBusiness.valuationGU * App.utils.rand(0.1, 0.3);
          owner.pulse = 1;
        }
        App.ui.addNews("ipo", bloc.flag + " <strong>" + ipoBusiness.name + "</strong> IPO at " + App.utils.fmtL(ipoBusiness.valuationGU, bloc) + ".");
      }
      return;
    }

    if (type === "scandal") {
      scandalBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
      if (scandalBusiness) {
        scandalBusiness.revenueGU *= App.utils.rand(0.65, 0.85);
        scandalBusiness.reputation = clampScore((scandalBusiness.reputation || 50) - App.utils.rand(10, 22));
        applyLeadershipStateChange(scandalBusiness, {
          confidence:-12,
          stress:16,
          burnout:4
        });
        scandalBusiness.currentDecision = evaluateBusinessDecision(scandalBusiness);
        pushBusinessEventHistory(scandalBusiness, "Scandal hit " + scandalBusiness.name, "Public trust collapsed and leadership came under pressure.");
        App.ui.addNews("scandal", bloc.flag + " <strong>" + scandalBusiness.name + "</strong> was hit by scandal. Revenue collapsed.");
      }
      return;
    }

    if (type === "hire") {
      hireBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
      if (hireBusiness) {
        var hires = App.utils.randInt(5, 25);
        hireBusiness.employees += hires;
        hireBusiness.reputation = clampScore((hireBusiness.reputation || 50) + App.utils.rand(1, 3));
        applyLeadershipStateChange(hireBusiness, {
          confidence:4,
          stress:-2
        });
        hireBusiness.currentDecision = evaluateBusinessDecision(hireBusiness);
        pushBusinessEventHistory(hireBusiness, "Hiring surge at " + hireBusiness.name, "Leadership expanded headcount after a favorable run.");
        App.ui.addNews("hire", bloc.flag + " <strong>" + hireBusiness.name + "</strong> added " + hires + " new hires.");
      }
    }
  }

  function processBusinessTick(){
    App.store.getLivingPeople().forEach(function(person){
      var bloc = App.store.getBloc(person.blocId);
      var business = App.store.getBusiness(person.businessId);
      var employerBusiness = !business && App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
      var salaryTick;
      var decision;
      var revenueGrowth;
      var margin;
      var reserveShareRate;
      var cashDelta = 0;
      var ownerShare = 0;
      var employeeDelta = 0;
      var leadershipFloor;
      var reputationDelta = 0;
      var bankruptcyPressure;

      ensureDecisionData(person);
      if (!business) {
        if (!(employerBusiness && App.store.isBusinessLeader && App.store.isBusinessLeader(person))) {
          settleTemporaryStates(person);
        }
        if (person.retired) {
          person.netWorthGU += App.utils.rand(-30, 60);
        } else if (employerBusiness && person.jobTitle) {
          salaryTick = (person.salaryGU || 0) / TICKS_PER_YEAR;
          person.netWorthGU += salaryTick + App.utils.rand(-8, 16);
        } else if (person.age >= 18) {
          person.netWorthGU += App.utils.rand(-20, 90);
        }
        person.netWorthGU = Math.max(100, person.netWorthGU);
        person.pulse = Math.random() < 0.04 ? 1 : 0;
        syncPerson(person);
        return;
      }

      ensureBusinessDecisionState(business);
      settleLeadershipStates(business);
      decision = evaluateBusinessDecision(business);
      leadershipFloor = Math.max((business.leadership || []).length, 1);

      revenueGrowth =
        App.utils.rand(-0.08, 0.14) +
        (getRevenueTrend(business) * 0.35) +
        (((business.reputation || 50) - 50) / 320) -
        (bloc.geoPressure * 0.018) +
        (decision.stance === "aggressive" ? 0.08 : (decision.stance === "balanced" ? 0.02 : (decision.stance === "defensive" ? -0.02 : -0.08))) +
        (decision.cashPolicy === "reinvest" ? 0.03 : (decision.cashPolicy === "preserve" ? -0.02 : 0)) +
        (getStageExpansionBias(business.stage) / 100) +
        (getCashCoverageMonths(business) < 1.5 ? -0.05 : 0);
      revenueGrowth = App.utils.clamp(revenueGrowth, -0.32, 0.28);

      business.revenueGU *= (1 + revenueGrowth);
      margin =
        0.07 +
        App.utils.rand(-0.08, 0.12) +
        (((business.reputation || 50) - 50) / 500) -
        (bloc.geoPressure * 0.01) +
        (decision.cashPolicy === "preserve" ? 0.03 : (decision.cashPolicy === "reinvest" ? -0.02 : 0)) +
        (decision.stance === "aggressive" ? -0.015 : (decision.stance === "defensive" ? 0.015 : (decision.stance === "retrenching" ? 0.01 : 0)));
      margin = App.utils.clamp(margin, -0.30, 0.34);
      business.profitGU = business.revenueGU * margin;
      business.currentDecision = decision;
      business.age += 1;
      business.revenueHistory.push(business.revenueGU);
      if (business.revenueHistory.length > 20) {
        business.revenueHistory.shift();
      }

      if (business.profitGU > 0) {
        reserveShareRate = decision.cashPolicy === "preserve" ? 0.72 : (decision.cashPolicy === "balanced" ? 0.52 : 0.34);
        cashDelta = business.profitGU * reserveShareRate;
        ownerShare = business.profitGU - cashDelta;
        business.cashReservesGU += cashDelta;
        person.netWorthGU += ownerShare;
      } else {
        var loss = Math.abs(business.profitGU);
        var coveredByCash = Math.min(loss, business.cashReservesGU || 0);
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) - coveredByCash);
        cashDelta = -coveredByCash;
        person.netWorthGU -= (loss - coveredByCash);
      }

      if (decision.staffingAction === "hire") {
        employeeDelta = App.utils.randInt(1, Math.max(1, Math.min(12, Math.ceil((business.employees || 1) * (decision.stance === "aggressive" ? 0.18 : 0.10)))));
      } else if (decision.staffingAction === "layoff") {
        employeeDelta = -App.utils.randInt(1, Math.max(1, Math.min(16, Math.ceil((business.employees || 1) * (decision.stance === "retrenching" ? 0.22 : 0.10)))));
      }

      business.employees = Math.max(leadershipFloor, Math.min(2000, (business.employees || leadershipFloor) + employeeDelta));

      reputationDelta += business.profitGU > 0 ? App.utils.clamp(margin * 18, 0.2, 2.2) : App.utils.clamp(margin * 14, -4, -0.2);
      if (decision.staffingAction === "layoff") reputationDelta -= App.utils.rand(1.2, 3.6);
      if (decision.staffingAction === "hire") reputationDelta += App.utils.rand(0.2, 1.1);
      if (decision.stance === "retrenching") reputationDelta -= 0.8;
      if (decision.cashPolicy === "reinvest" && business.profitGU > 0) reputationDelta += 0.3;
      business.reputation = clampScore((business.reputation || 50) + reputationDelta);
      business.valuationGU = business.revenueGU * App.utils.clamp(1.8 + ((business.reputation || 50) / 35) + (margin * 6), 1.3, 7.2);

      if (business.age > 4 && business.stage === "startup") business.stage = "growth";
      if (business.age > 12 && business.stage === "growth") business.stage = "established";
      if (business.profitGU < -business.revenueGU * 0.2 && business.stage === "established") business.stage = "declining";
      if (business.reputation < 28 && business.stage !== "startup") business.stage = "declining";

      bankruptcyPressure =
        ((business.cashReservesGU || 0) <= business.revenueGU * 0.02 ? 1 : 0) +
        (business.profitGU < -business.revenueGU * 0.18 ? 1 : 0) +
        (business.reputation < 28 ? 1 : 0) +
        (person.netWorthGU < -2000 ? 1 : 0) +
        (decision.stance === "aggressive" ? 0.5 : 0);

      if (bankruptcyPressure >= 3 && Math.random() < 0.24) {
        App.ui.addNews("bankruptcy", "<strong>" + person.name + "</strong> " + bloc.flag + " - <strong>" + business.name + "</strong> went bankrupt.");
        liquidateBusiness(person, business);
        person.netWorthGU = App.utils.rand(800, 4000);
        person.pulse = 1;
        adjustTemporaryStates(person, {
          confidence:-16,
          stress:18,
          burnout:6
        });
        syncPerson(person);
        return;
      }

      pushBusinessDecisionHistory(business, {
        id:randomId(),
        madeAtDay:decision.madeAtDay,
        stance:decision.stance,
        staffingAction:decision.staffingAction,
        cashPolicy:decision.cashPolicy,
        successionBias:decision.successionBias,
        reasons:decision.reasons.slice(0, 3),
        influencers:decision.influencers.slice(0, 3),
        summary:summarizeDecisionOutcome(decision, employeeDelta, cashDelta, reputationDelta)
      });

      applyLeadershipStateChange(business, {
        confidence:business.profitGU > 0 ? 3 : -4,
        stress:business.profitGU > 0 ? -2 : 4,
        burnout:decision.stance === "aggressive" ? 1 : (decision.stance === "retrenching" ? 2 : 0),
        ambitionSpike:decision.stance === "aggressive" ? 2 : 0
      });

      person.netWorthGU = Math.max(100, person.netWorthGU);
      person.pulse = Math.random() < 0.08 ? 1 : 0;
      syncPerson(person);
    });
  }

  function maybeCreateDeal(){
    var first = App.utils.pick(App.store.getLivingPeople().filter(function(person){ return person.businessId; }));
    var second = App.utils.pick(App.store.getLivingPeople().filter(function(person){
      return person.businessId && first && person.blocId !== first.blocId;
    }));

    if (first && second) {
      var value = App.utils.rand(40000, 600000);
      var firstBloc = App.store.getBloc(first.blocId);
      var secondBloc = App.store.getBloc(second.blocId);
      App.ui.addNews("deal", firstBloc.flag + "x" + secondBloc.flag + " <strong>" + first.name + "</strong> & <strong>" + second.name + "</strong> closed " + App.utils.fmtGU(value) + ".");
      first.netWorthGU += value * 0.04;
      second.netWorthGU += value * 0.04;
    }
  }

  function maybeAddArrival(){
    var nextBloc;
    var arrival;

    if (App.store.getLivingCount() >= 120 || Math.random() >= 0.02) {
      return;
    }

    nextBloc = App.utils.pick(App.store.blocs);
    arrival = createCitizen({
      blocId:nextBloc.id,
      age:App.utils.randInt(22, 45),
      netWorthGU:App.utils.rand(1500, 22000)
    });
    App.store.people.push(arrival);
    seedHousehold(arrival);
    syncPerson(arrival);
    App.ui.addNews("launch", nextBloc.flag + " <strong>" + arrival.name + "</strong> arrived with " + App.utils.fmtCountry(arrival.netWorthGU, arrival.countryISO) + ".");
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

    App.store.simDay += 3;
    processBusinessTick();

    if (currentYear() > previousYear) {
      runYearlyLifecycle();
    }

    if (Math.random() < 0.11) {
      randomEvent();
    }

    if (Math.random() < 0.06) {
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
    start:start,
    getPotentialHeir:getPotentialHeir,
    evaluateBusinessDecision:evaluateBusinessDecision,
    evaluateSuccessionCandidate:evaluateSuccessionCandidate,
    syncCorporateLadders:syncCorporateLadders
  };
})(window);
