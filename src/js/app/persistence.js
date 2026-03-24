(function(global){
  var App = global.Nexus || (global.Nexus = {});
  var SAVE_KEY = "nexus.world.snapshot";
  var SCHEMA_VERSION = 11;
  var AUTOSAVE_INTERVAL_DAYS = 30;
  var MAX_NEWS_ITEMS = 100;
  var MAX_EVENT_HISTORY = 2000;
  var MAX_RATE_HISTORY = 60;
  var MAX_DECISION_HISTORY = 12;
  var MAX_REVENUE_HISTORY = 20;
  var lastAutoSaveDay = null;
  var snapshotMigrations = {};
  var entityMigrations = {
    person:{},
    business:{},
    bloc:{},
    country:{}
  };

  function deepClone(value){
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function toFiniteNumber(value, fallback){
    var numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function toInteger(value, fallback){
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.floor(numeric);
  }

  function normalizeString(value, fallback){
    if (typeof value !== "string") return fallback;
    value = value.trim();
    return value ? value : fallback;
  }

  function normalizeStringArray(values){
    var seen = {};

    return (Array.isArray(values) ? values : []).map(function(value){
      return normalizeString(value, null);
    }).filter(function(value){
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function normalizeNumberArray(values){
    return (Array.isArray(values) ? values : []).map(function(value){
      return Number(value);
    }).filter(function(value){
      return Number.isFinite(value);
    });
  }

  function normalizeGovernorState(value){
    var source = value && typeof value === "object" ? value : {};
    var signalSnapshot = source.signalSnapshot && typeof source.signalSnapshot === "object" ? source.signalSnapshot : {};
    var interventionCounts = source.interventionCountsByDay && typeof source.interventionCountsByDay === "object" ? source.interventionCountsByDay : {};
    var nowDay = Math.max(0, toInteger((App.store && App.store.simDay) || 0, 0));
    var filteredCounts = {};

    Object.keys(interventionCounts).forEach(function(key){
      var numericDay = toInteger(key, NaN);
      var count;
      if (!Number.isFinite(numericDay)) return;
      if (Math.abs(nowDay - numericDay) > 10) return;
      count = Math.max(0, toInteger(interventionCounts[key], 0));
      if (!count) return;
      filteredCounts[String(numericDay)] = count;
    });

    return {
      enabled:source.enabled !== false,
      annualLaunches:Math.max(0, toInteger(source.annualLaunches, 0)),
      lastLaunchYear:toInteger(source.lastLaunchYear, -1),
      noLaunchYears:Math.max(0, toInteger(source.noLaunchYears, 0)),
      emptyEcosystemTicksByBloc:deepClone(source.emptyEcosystemTicksByBloc || {}),
      unemploymentTrapTicksByBloc:deepClone(source.unemploymentTrapTicksByBloc || {}),
      agingLockTicks:Math.max(0, toInteger(source.agingLockTicks, 0)),
      currencyConvergenceTicks:Math.max(0, toInteger(source.currencyConvergenceTicks, 0)),
      cooldowns:deepClone(source.cooldowns || {}),
      interventionCountsByDay:filteredCounts,
      signalSnapshot:deepClone(signalSnapshot),
      runCount:Math.max(0, toInteger(source.runCount, 0)),
      lastRunDay:Math.max(0, toInteger(source.lastRunDay, 0))
    };
  }

  function normalizeHouseholdTier(value){
    var tier = normalizeString(value, "working");
    var valid = {
      strained:true,
      working:true,
      middle:true,
      affluent:true,
      elite:true
    };
    return valid[tier] ? tier : "working";
  }

  function normalizeEducationAttainment(value, educationIndex){
    var normalized = normalizeString(value, null);
    var tierMap = {
      none:true,
      primary:true,
      secondary:true,
      advanced:true
    };
    var score = clamp(toFiniteNumber(educationIndex, 0), 0, 100);

    if (normalized && tierMap[normalized]) {
      return normalized;
    }
    if (score >= 75) return "advanced";
    if (score >= 55) return "secondary";
    if (score >= 35) return "primary";
    return "none";
  }

  function normalizeEducationCredentialLabel(value, attainment){
    var label = normalizeString(value, null);
    var fallbackByAttainment = {
      advanced:"Bachelor Degree",
      secondary:"High School Diploma",
      primary:"Primary School Certificate",
      none:"No Formal Qualification"
    };

    if (label) return label;
    return fallbackByAttainment[normalizeString(attainment, "none")] || "No Formal Qualification";
  }

  function normalizeEducationInstitutionType(value, educationIndex){
    var normalized = normalizeString(value, null);
    var score = clamp(toFiniteNumber(educationIndex, 0), 0, 100);

    if (normalized === "school" || normalized === "university" || normalized === "specialist_school") {
      return normalized;
    }
    return score >= 75 ? "university" : "school";
  }

  function inferEducationInstitutionSectorFromName(name){
    var text = String(name || "").toLowerCase();

    if (!text) return null;
    if (/\b(private|independent)\b/.test(text)) return "private";
    if (/\b(public|state|national|government|federal)\b/.test(text)) return "public";
    return null;
  }

  function harmonizeEducationInstitutionNameSector(name, sector){
    var text = String(name || "").trim();
    var normalizedSector = sector === "private" ? "private" : "public";

    if (!text) return text;

    if (normalizedSector === "private") {
      text = text.replace(/\bPublic\b/gi, "Private");
      text = text.replace(/\bGovernment\b/gi, "Private");
      text = text.replace(/\bFederal\b/gi, "Private");
      return text;
    }

    text = text.replace(/\bPrivate\b/gi, "Public");
    text = text.replace(/\bIndependent\b/gi, "Public");
    return text;
  }

  function sanitizeInstitutionNameRealism(name, countryISO){
    var text = String(name || "");

    text = text.replace(/\bStarlight\b/gi, "Central");
    text = text.replace(/\bHarmony\b/gi, "Regional");
    text = text.replace(/\bProsperity\b/gi, "Metropolitan");

    if (String(countryISO || "") === "IN") {
      text = text.replace(/\bAcademy\b/gi, "School");
    }

    return text;
  }

  function normalizeEducationInstitutionName(value, institutionType, institutionSector, countryISO){
    var name = normalizeString(value, null);

    if (!name) {
      name = institutionType === "university" ? "National University" : "Local Public School";
    }

    name = sanitizeInstitutionNameRealism(name, countryISO);
    return harmonizeEducationInstitutionNameSector(name, institutionSector);
  }

  function normalizeEducationInstitutionSector(value, institutionType, institutionName){
    var normalized = normalizeString(value, null);
    var inferred = inferEducationInstitutionSectorFromName(institutionName);

    if (inferred) {
      return inferred;
    }

    if (normalized === "private" || normalized === "public") {
      return normalized;
    }
    return institutionType === "university" ? "public" : "public";
  }

  function normalizeEducationCourseLabel(value, institutionType){
    var label = normalizeString(value, null);

    if (label) return label;
    if (institutionType === "specialist_school") return "Vocational and Applied Studies";
    if (institutionType === "university") return "General Degree Program";
    return "General Studies";
  }

  function normalizeEducationInstitutionQuality(value, fallbackEducationIndex){
    var score = toFiniteNumber(value, NaN);

    if (!Number.isFinite(score)) {
      score = 40 + clamp(toFiniteNumber(fallbackEducationIndex, 0), 0, 100) * 0.4;
    }
    return clamp(score, 20, 100);
  }

  function normalizeChildhoodStage(value, age){
    var stage = normalizeString(value, null);
    var years = Math.max(0, toFiniteNumber(age, 0));
    var valid = {
      early_childhood:true,
      primary_foundation:true,
      lower_secondary:true,
      upper_secondary:true,
      tertiary_transition:true,
      adult_complete:true
    };

    if (stage && valid[stage]) {
      return stage;
    }
    if (years < 5) return "early_childhood";
    if (years < 10) return "primary_foundation";
    if (years < 14) return "lower_secondary";
    if (years < 18) return "upper_secondary";
    if (years < 23) return "tertiary_transition";
    return "adult_complete";
  }

  function normalizeSkillTrack(value, age){
    var track = normalizeString(value, null);
    var years = Math.max(0, toFiniteNumber(age, 0));
    var valid = {
      foundation:true,
      general:true,
      leadership:true,
      technical:true,
      commercial:true,
      creative:true
    };

    if (track && valid[track]) {
      return track;
    }
    return years < 12 ? "foundation" : "general";
  }

  function normalizePersonSkills(skills, educationIndex, age){
    var source = skills && typeof skills === "object" ? skills : {};
    var education = clamp(toFiniteNumber(educationIndex, 0), 0, 100);
    var years = Math.max(0, toFiniteNumber(age, 0));
    var base = years < 10 ? 8 : (years < 18 ? 18 : (years < 25 ? 28 : 34));
    var fallback = clamp((base * 0.45) + (education * 0.32), 0, 100);

    return {
      management:clamp(toFiniteNumber(source.management, fallback), 0, 100),
      technical:clamp(toFiniteNumber(source.technical, fallback), 0, 100),
      social:clamp(toFiniteNumber(source.social, fallback), 0, 100),
      financialDiscipline:clamp(toFiniteNumber(source.financialDiscipline, fallback), 0, 100),
      creativity:clamp(toFiniteNumber(source.creativity, fallback), 0, 100)
    };
  }

  function normalizeBusinessNamingMode(value, fallback){
    var mode = normalizeString(value, fallback || null);
    return mode === "legacy" ? "legacy" : (mode === "v2" ? "v2" : (fallback || null));
  }

  function resolveSnapshotBusinessNamingMode(snapshot, fallback){
    var stateMode = snapshot && snapshot.state ? snapshot.state.businessNamingMode : null;
    return normalizeBusinessNamingMode(snapshot && snapshot.businessNamingMode, normalizeBusinessNamingMode(stateMode, fallback || null));
  }

  function buildSnapshotEnvelope(snapshot, schemaVersion, state, fallbackMode){
    var next = {
      schemaVersion:schemaVersion,
      savedAtISO:normalizeString(snapshot && snapshot.savedAtISO, new Date().toISOString()),
      state:state
    };
    var mode = resolveSnapshotBusinessNamingMode(snapshot, fallbackMode);

    if (mode) {
      next.businessNamingMode = mode;
    }

    return next;
  }

  function getYearDays(){
    var calendar = App.data && App.data.CALENDAR ? App.data.CALENDAR : null;
    return calendar && Number(calendar.daysPerYear) ? Number(calendar.daysPerYear) : 360;
  }

  function normalizeTraits(values){
    var allowed = (App.data && Array.isArray(App.data.TRAITS)) ? App.data.TRAITS : [];
    var seen = {};

    return (Array.isArray(values) ? values : []).map(function(value){
      return normalizeString(value, null);
    }).filter(function(value){
      if (!value) return false;
      if (allowed.length && allowed.indexOf(value) === -1) return false;
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    }).slice(0, 2);
  }

  function normalizeTags(values){
    return normalizeStringArray(values).slice(0, 3);
  }

  function normalizeSelection(selection){
    var validTypes = { person:true, business:true, country:true };
    var type = selection && validTypes[selection.type] ? selection.type : null;
    var id = normalizeString(selection && selection.id, null);

    if (!type || !id) {
      return { type:null, id:null };
    }
    return { type:type, id:id };
  }

  function normalizeCountryNames(countryNames){
    var next = {};

    Object.keys(countryNames || {}).forEach(function(iso){
      var cleanedISO = normalizeString(iso, null);
      var cleanedName = normalizeString(countryNames[iso], null);
      if (!cleanedISO || !cleanedName) return;
      next[cleanedISO] = cleanedName;
    });

    return next;
  }

  function calculatePopulationPressure(profile){
    var laborForce = Math.max(1, toFiniteNumber(profile.laborForce, 0));
    var employed = clamp(toFiniteNumber(profile.employed, 0), 0, laborForce);
    var population = Math.max(1, toFiniteNumber(profile.population, 0));
    var consumerDemand = Math.max(0, toFiniteNumber(profile.consumerDemandGU, employed * Math.max(1500, toFiniteNumber(profile.medianWageGU, 1500)) * 0.72));
    var institutionScore = clamp(toFiniteNumber(profile.institutionScore, 0.5), 0, 1);
    var employmentRate = employed / laborForce;
    var demandPerCapita = consumerDemand / population;
    var demandScore = clamp(demandPerCapita / 28000, 0, 1);

    return clamp((employmentRate * 0.5) + (demandScore * 0.25) + (institutionScore * 0.25), 0, 1);
  }

  function normalizeCountryProfileRecord(iso, blocId, rawProfile){
    var source = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
    var seed = (App.data && typeof App.data.createCountryProfile === "function") ? App.data.createCountryProfile(iso, blocId, source) : {
      iso:iso,
      blocId:blocId,
      population:Math.max(1, toInteger(source.population, 1000000)),
      laborForceParticipation:clamp(toFiniteNumber(source.laborForceParticipation, 0.55), 0.2, 0.9),
      laborForce:Math.max(0, toInteger(source.laborForce, 0)),
      employed:Math.max(0, toInteger(source.employed, 0)),
      unemployed:Math.max(0, toInteger(source.unemployed, 0)),
      medianWageGU:Math.max(1500, toFiniteNumber(source.medianWageGU, 12000)),
      consumerDemandGU:Math.max(0, toFiniteNumber(source.consumerDemandGU, 0)),
      birthRatePer1000:toFiniteNumber(source.birthRatePer1000, 14),
      deathRatePer1000:toFiniteNumber(source.deathRatePer1000, 8),
      netMigrationRatePer1000:toFiniteNumber(source.netMigrationRatePer1000, 0),
      giniCoefficient:clamp(toFiniteNumber(source.giniCoefficient, 0.4), 0.2, 0.7),
      educationIndex:clamp(toFiniteNumber(source.educationIndex, 0.6), 0.1, 1),
      institutionScore:clamp(toFiniteNumber(source.institutionScore, 0.55), 0.1, 1),
      populationPressure:0.5
    };
    var laborForce;
    var employed;
    var unemployed;
    var medianWage;
    var consumerDemand;

    laborForce = Math.max(0, toInteger(source.laborForce, toInteger(seed.laborForce, 0)));
    employed = clamp(toInteger(source.employed, toInteger(seed.employed, 0)), 0, laborForce);
    unemployed = Math.max(0, laborForce - employed);
    if (source.unemployed != null && source.employed == null) {
      unemployed = clamp(toInteger(source.unemployed, unemployed), 0, laborForce);
      employed = Math.max(0, laborForce - unemployed);
    }

    medianWage = Math.max(1500, toFiniteNumber(source.medianWageGU, toFiniteNumber(seed.medianWageGU, 12000)));
    consumerDemand = Math.max(0, toFiniteNumber(source.consumerDemandGU, employed * medianWage * 0.72));

    return {
      iso:iso,
      blocId:blocId,
      population:Math.max(1, toInteger(source.population, toInteger(seed.population, 1))),
      laborForceParticipation:clamp(toFiniteNumber(source.laborForceParticipation, toFiniteNumber(seed.laborForceParticipation, 0.55)), 0.2, 0.9),
      laborForce:laborForce,
      employed:employed,
      unemployed:unemployed,
      medianWageGU:medianWage,
      consumerDemandGU:consumerDemand,
      birthRatePer1000:toFiniteNumber(source.birthRatePer1000, toFiniteNumber(seed.birthRatePer1000, 14)),
      deathRatePer1000:toFiniteNumber(source.deathRatePer1000, toFiniteNumber(seed.deathRatePer1000, 8)),
      netMigrationRatePer1000:toFiniteNumber(source.netMigrationRatePer1000, toFiniteNumber(seed.netMigrationRatePer1000, 0)),
      giniCoefficient:clamp(toFiniteNumber(source.giniCoefficient, toFiniteNumber(seed.giniCoefficient, 0.4)), 0.2, 0.7),
      educationIndex:clamp(toFiniteNumber(source.educationIndex, toFiniteNumber(seed.educationIndex, 0.6)), 0.1, 1),
      institutionScore:clamp(toFiniteNumber(source.institutionScore, toFiniteNumber(seed.institutionScore, 0.55)), 0.1, 1),
      populationPressure:0
    };
  }

  function applyBusinessHeadcountToProfiles(profiles, businesses){
    (Array.isArray(businesses) ? businesses : []).forEach(function(business){
      var profile = profiles[business && business.countryISO];
      var headcount;

      if (!profile) return;
      headcount = Math.max(1, toInteger(business && business.employees, 1));
      profile.employed = clamp(profile.employed + headcount, 0, profile.laborForce);
      profile.unemployed = Math.max(0, profile.laborForce - profile.employed);
      profile.consumerDemandGU = Math.max(0, Math.round(profile.employed * profile.medianWageGU * 0.72));
    });
  }

  function normalizeCountryProfiles(countryProfiles, blocs, businesses, options){
    var rawProfiles = countryProfiles && typeof countryProfiles === "object" ? countryProfiles : {};
    var normalized = {};
    var settings = options || {};
    var hasExistingProfiles = Object.keys(rawProfiles).length > 0;

    (Array.isArray(blocs) ? blocs : []).forEach(function(bloc){
      var blocId = normalizeString(bloc && bloc.id, "NA");
      (Array.isArray(bloc && bloc.members) ? bloc.members : []).forEach(function(iso){
        var cleanedISO = normalizeString(iso, null);
        if (!cleanedISO) return;
        normalized[cleanedISO] = normalizeCountryProfileRecord(cleanedISO, blocId, rawProfiles[cleanedISO]);
      });
    });

    if (settings.injectBusinessHeadcount && !hasExistingProfiles) {
      applyBusinessHeadcountToProfiles(normalized, businesses);
    }

    Object.keys(normalized).forEach(function(iso){
      var profile = normalized[iso];
      profile.populationPressure = calculatePopulationPressure(profile);
    });

    return normalized;
  }

  function normalizeHouseholdRecord(item, peopleById, countryProfiles, fallbackId){
    var source = item && typeof item === "object" ? item : {};
    var adultIds = normalizeStringArray(source.adultIds);
    var childIds = normalizeStringArray(source.childIds);
    var firstResident = null;
    var firstResidentProfile = null;

    adultIds = adultIds.filter(function(id, index, array){
      return peopleById[id] && peopleById[id].alive !== false && array.indexOf(id) === index;
    });
    childIds = childIds.filter(function(id, index, array){
      return peopleById[id] && peopleById[id].alive !== false && array.indexOf(id) === index && adultIds.indexOf(id) === -1;
    });

    if (!adultIds.length && !childIds.length) return null;

    firstResident = peopleById[adultIds[0] || childIds[0]] || null;
    firstResidentProfile = firstResident ? countryProfiles[firstResident.countryISO] : null;

    return {
      id:normalizeString(source.id, fallbackId),
      blocId:normalizeString(source.blocId, firstResident ? firstResident.blocId : (firstResidentProfile ? firstResidentProfile.blocId : "NA")),
      countryISO:normalizeString(source.countryISO, firstResident ? firstResident.countryISO : "US"),
      state:normalizeString(source.state, firstResident ? firstResident.state : null),
      adultIds:adultIds,
      childIds:childIds,
      cashOnHandGU:Math.max(0, toFiniteNumber(source.cashOnHandGU, 0)),
      debtGU:Math.max(0, toFiniteNumber(source.debtGU, 0)),
      annualIncomeGU:Math.max(0, toFiniteNumber(source.annualIncomeGU, 0)),
      monthlyIncomeGU:Math.max(0, toFiniteNumber(source.monthlyIncomeGU, 0)),
      monthlyExpensesGU:Math.max(0, toFiniteNumber(source.monthlyExpensesGU, 0)),
      housingCostGU:Math.max(0, toFiniteNumber(source.housingCostGU, 0)),
      childcareCostGU:Math.max(0, toFiniteNumber(source.childcareCostGU, 0)),
      essentialsCostGU:Math.max(0, toFiniteNumber(source.essentialsCostGU, 0)),
      debtServiceGU:Math.max(0, toFiniteNumber(source.debtServiceGU, 0)),
      inheritancePressureGU:Math.max(0, toFiniteNumber(source.inheritancePressureGU, 0)),
      financialStress:clamp(toFiniteNumber(source.financialStress, 0), 0, 100),
      classTier:normalizeHouseholdTier(source.classTier),
      originClassTier:normalizeHouseholdTier(source.originClassTier || source.classTier),
      mobilityScore:toFiniteNumber(source.mobilityScore, 0)
    };
  }

  function normalizeHouseholds(households, people, countryProfiles){
    var peopleById = indexById(people);

    return dedupeById((Array.isArray(households) ? households : []).map(function(item, index){
      return normalizeHouseholdRecord(item, peopleById, countryProfiles || {}, "legacy-household-" + index);
    }).filter(Boolean));
  }

  function normalizeEventEntities(entities){
    var source = entities && typeof entities === "object" ? entities : {};
    return {
      personIds:normalizeStringArray(source.personIds || source.people).slice(0, 8),
      businessIds:normalizeStringArray(source.businessIds || source.businesses).slice(0, 8),
      countryIsos:normalizeStringArray(source.countryIsos || source.countries).slice(0, 8),
      blocIds:normalizeStringArray(source.blocIds || source.blocs).slice(0, 8)
    };
  }

  function normalizeCauseEntry(cause){
    var source;
    var text;
    var eventId;
    var kind;

    if (!cause) return null;

    if (typeof cause === "string") {
      text = normalizeString(cause, null);
      return text ? {
        text:text,
        eventId:null,
        kind:null
      } : null;
    }

    if (typeof cause !== "object") return null;

    source = cause;
    text = normalizeString(source.text || source.label || source.reason || source.summary, null);
    eventId = normalizeString(source.eventId || source.refEventId || source.id, null);
    kind = normalizeString(source.kind || source.relation || source.type, null);

    if (!text && !eventId) return null;

    return {
      text:text || ("Linked event " + eventId),
      eventId:eventId,
      kind:kind
    };
  }

  function normalizeCauses(values){
    var seen = {};
    var list = Array.isArray(values) ? values : (values ? [values] : []);

    return list.map(normalizeCauseEntry).filter(function(entry){
      var key;
      if (!entry) return false;
      key = [entry.eventId || "", entry.kind || "", entry.text || ""].join("|");
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, 6);
  }

  function normalizeSignificanceDimensions(dimensions, fallback){
    var source = dimensions && typeof dimensions === "object" ? dimensions : {};
    var seed = fallback && typeof fallback === "object" ? fallback : {};
    return {
      impact:clamp(toFiniteNumber(source.impact, toFiniteNumber(seed.impact, 0.35)), 0, 1),
      rarity:clamp(toFiniteNumber(source.rarity, toFiniteNumber(seed.rarity, 0.35)), 0, 1),
      legacy:clamp(toFiniteNumber(source.legacy, toFiniteNumber(seed.legacy, 0.25)), 0, 1),
      crossGen:clamp(toFiniteNumber(source.crossGen, toFiniteNumber(seed.crossGen, 0.20)), 0, 1)
    };
  }

  function inferTierFromScore(score){
    if (score >= 75) return "critical";
    if (score >= 55) return "major";
    if (score >= 30) return "notable";
    return "routine";
  }

  function getCanonicalEventDefaults(type, source){
    if (App.events && typeof App.events.getCanonicalDefaults === "function") {
      return App.events.getCanonicalDefaults(type, source || {});
    }

    return {
      category:normalizeString(source && source.category, "structural"),
      scope:normalizeString(source && source.scope, "global"),
      entities:normalizeEventEntities(source && source.entities),
      significance:{
        score:clamp(toFiniteNumber(type === "default" ? 60 : (type === "bankruptcy" ? 55 : (type === "hire" ? 18 : 35)), 35), 0, 100),
        tier:inferTierFromScore(type === "default" ? 60 : (type === "bankruptcy" ? 55 : (type === "hire" ? 18 : 35))),
        dimensions:normalizeSignificanceDimensions(null, null),
        adaptiveBoost:0,
        baseFloor:clamp(toFiniteNumber(type === "default" ? 60 : (type === "bankruptcy" ? 55 : (type === "hire" ? 18 : 35)), 35), 0, 100)
      }
    };
  }

  function normalizeSignificance(significance, fallback){
    var source = significance && typeof significance === "object" ? significance : {};
    var fallbackSignificance = fallback && typeof fallback === "object" ? fallback : {};
    var score = clamp(toFiniteNumber(source.score, toFiniteNumber(fallbackSignificance.score, 35)), 0, 100);
    var tier = normalizeString(source.tier, inferTierFromScore(score));

    if (["routine", "notable", "major", "critical"].indexOf(tier) === -1) {
      tier = inferTierFromScore(score);
    }

    return {
      score:Math.round(score * 10) / 10,
      tier:tier,
      dimensions:normalizeSignificanceDimensions(source.dimensions, fallbackSignificance.dimensions),
      adaptiveBoost:clamp(toFiniteNumber(source.adaptiveBoost, toFiniteNumber(fallbackSignificance.adaptiveBoost, 0)), 0, 10),
      baseFloor:clamp(toFiniteNumber(source.baseFloor, toFiniteNumber(fallbackSignificance.baseFloor, 0)), 0, 100)
    };
  }

  function normalizePacing(pacing){
    var source = pacing && typeof pacing === "object" ? pacing : {};
    var mode = normalizeString(source.mode, "direct");
    var validModes = { direct:true, queued:true, rollup:true, suppressed:true };

    if (!validModes[mode]) mode = "direct";
    return {
      displayed:source.displayed == null ? (mode === "direct" || mode === "rollup") : !!source.displayed,
      mode:mode,
      rollupKey:normalizeString(source.rollupKey, null),
      suppressedCount:Math.max(0, toInteger(source.suppressedCount, 0))
    };
  }

  function normalizeEventRecord(item, fallbackId, fallbackDay){
    var source = item && typeof item === "object" ? item : {};
    var day = Math.max(0, toInteger(source.day, toInteger(fallbackDay, 0)));
    var type = normalizeString(source.type, "market");
    var text = normalizeString(source.text, "");
    var defaults = getCanonicalEventDefaults(type, source);
    var tags = normalizeTags(source.tags);
    var entities = defaults.entities || normalizeEventEntities(source.entities);
    var significance = normalizeSignificance(source.significance, defaults.significance);
    var pacing = normalizePacing(source.pacing);

    if (!text) return null;

    if (!source.significance) {
      significance = normalizeSignificance(null, defaults.significance);
    }

    if (!source.pacing) {
      pacing = {
        displayed:true,
        mode:"direct",
        rollupKey:null,
        suppressedCount:0
      };
    }

    return {
      id:normalizeString(source.id, fallbackId),
      day:day,
      time:normalizeString(source.time, null),
      type:type,
      text:text,
      tags:tags,
      category:normalizeString(source.category, defaults.category || "structural"),
      scope:normalizeString(source.scope, defaults.scope || "global"),
      entities:entities,
      causes:normalizeCauses(source.causes),
      significance:significance,
      pacing:pacing,
      synthetic:!!source.synthetic
    };
  }

  function normalizeNewsItems(newsItems, fallbackDay){
    return (Array.isArray(newsItems) ? newsItems : []).map(function(item, index){
      return normalizeEventRecord(item, "legacy-news-" + index, fallbackDay);
    }).filter(function(item){
      return !!item;
    }).slice(0, MAX_NEWS_ITEMS);
  }

  function normalizeEventHistory(eventHistory, fallbackNewsItems, fallbackDay){
    var history = (Array.isArray(eventHistory) ? eventHistory : []).map(function(item, index){
      return normalizeEventRecord(item, "legacy-event-" + index, fallbackDay);
    }).filter(Boolean);

    if (!history.length) {
      history = (Array.isArray(fallbackNewsItems) ? fallbackNewsItems : []).map(function(item, index){
        var normalized = normalizeEventRecord(item, "legacy-news-event-" + index, fallbackDay);
        if (!normalized) return null;
        if (!normalized.pacing) {
          normalized.pacing = { displayed:true, mode:"direct", rollupKey:null, suppressedCount:0 };
        }
        normalized.pacing.displayed = true;
        normalized.pacing.mode = normalized.pacing.mode || "direct";
        return normalized;
      }).filter(Boolean);
    }

    return history.slice(0, MAX_EVENT_HISTORY);
  }

  function normalizeEventWindowStats(eventWindowStats){
    var source = eventWindowStats && typeof eventWindowStats === "object" ? eventWindowStats : {};
    var next = {};

    Object.keys(source).forEach(function(key){
      var windowKey = normalizeString(key, null);
      var value = source[key] && typeof source[key] === "object" ? source[key] : {};
      if (!windowKey) return;
      next[windowKey] = {
        notableShown:Math.max(0, toInteger(value.notableShown, 0)),
        rollups:{}
      };

      Object.keys(value.rollups && typeof value.rollups === "object" ? value.rollups : {}).forEach(function(rollupKey){
        var bucket = value.rollups[rollupKey] && typeof value.rollups[rollupKey] === "object" ? value.rollups[rollupKey] : {};
        var cleanedKey = normalizeString(rollupKey, null);
        if (!cleanedKey) return;
        next[windowKey].rollups[cleanedKey] = {
          count:Math.max(0, toInteger(bucket.count, 0)),
          label:normalizeString(bucket.label, null)
        };
      });
    });

    return next;
  }

  function normalizeTraitEffects(effects){
    return (Array.isArray(effects) ? effects : []).map(function(effect){
      var trait = normalizeString(effect && effect.trait, null);
      var channel = normalizeString(effect && effect.channel, null);
      var impact = toFiniteNumber(effect && effect.impact, null);
      var label;

      if (!trait || !channel || impact == null || !Number.isFinite(impact)) return null;
      label = normalizeString(effect && effect.label, trait + " " + (impact >= 0 ? "+" : "-") + Math.abs(impact));
      return {
        trait:trait,
        channel:channel,
        impact:Math.round(impact * 10) / 10,
        label:label
      };
    }).filter(Boolean).slice(0, 4);
  }

  function normalizeDecisionHistory(entries){
    return (Array.isArray(entries) ? entries : []).map(function(entry){
      return {
        id:normalizeString(entry && entry.id, null),
        madeAtDay:toInteger(entry && entry.madeAtDay, 0),
        stance:normalizeString(entry && entry.stance, "balanced"),
        staffingAction:normalizeString(entry && entry.staffingAction, "hold"),
        cashPolicy:normalizeString(entry && entry.cashPolicy, "balanced"),
        successionBias:normalizeString(entry && entry.successionBias, "balanced"),
        reasons:(Array.isArray(entry && entry.reasons) ? entry.reasons : []).map(function(reason){
          return normalizeString(reason, null);
        }).filter(Boolean).slice(0, 3),
        summary:normalizeString(entry && entry.summary, "Decision recorded"),
        traitEffects:normalizeTraitEffects(entry && entry.traitEffects),
        influencers:(Array.isArray(entry && entry.influencers) ? entry.influencers : []).map(function(influencer){
          return {
            personId:normalizeString(influencer && influencer.personId, null),
            roleKey:normalizeString(influencer && influencer.roleKey, "default"),
            title:normalizeString(influencer && influencer.title, "Unknown"),
            weight:toInteger(influencer && influencer.weight, 0)
          };
        }).slice(0, 3)
      };
    }).slice(0, MAX_DECISION_HISTORY);
  }

  function dedupeById(items){
    var seen = {};
    var next = [];

    (Array.isArray(items) ? items : []).forEach(function(item){
      if (!item || !item.id || seen[item.id]) return;
      seen[item.id] = true;
      next.push(item);
    });

    return next;
  }

  function indexById(items){
    var index = {};

    (Array.isArray(items) ? items : []).forEach(function(item){
      if (!item || !item.id) return;
      index[item.id] = item;
    });

    return index;
  }

  function createIsoToBloc(blocs){
    var isoToBloc = {};

    (Array.isArray(blocs) ? blocs : []).forEach(function(bloc){
      (Array.isArray(bloc.members) ? bloc.members : []).forEach(function(iso){
        isoToBloc[iso] = bloc.id;
      });
    });

    return isoToBloc;
  }

  function getBlocTemplateMap(){
    var map = {};

    if (!App.data || typeof App.data.createBlocs !== "function") return map;
    App.data.createBlocs().forEach(function(bloc){
      map[bloc.id] = bloc;
    });

    return map;
  }

  function migrateEntityRecord(kind, record, fromVersion, toVersion, context){
    var working = deepClone(record || {});
    var version = fromVersion;
    var table = entityMigrations[kind] || {};

    while (version < toVersion) {
      version += 1;
      if (typeof table[version] === "function") {
        working = table[version](working, context) || working;
      }
    }

    return working;
  }

  function migratePersonToV1(person, context){
    var simDay = context.simDay;
    var yearDays = context.yearDays;
    var estimatedAge = toFiniteNumber(person.age, 30);

    person.id = normalizeString(person.id, "legacy-person-" + context.index);
    person.firstName = normalizeString(person.firstName, "Unknown");
    person.lastName = normalizeString(person.lastName, "Citizen");
    person.name = normalizeString(person.name, person.firstName + " " + person.lastName);
    person.sex = normalizeString(person.sex, "male");
    if (person.sex !== "male" && person.sex !== "female") {
      person.sex = "male";
    }
    person.sexualOrientation = normalizeString(person.sexualOrientation, "straight");
    if (["straight","bi","gay","lesbian"].indexOf(person.sexualOrientation) === -1) {
      person.sexualOrientation = "straight";
    }
    if (person.sexualOrientation === "gay" && person.sex === "female") {
      person.sexualOrientation = "lesbian";
    }
    if (person.sexualOrientation === "lesbian" && person.sex === "male") {
      person.sexualOrientation = "gay";
    }
    person.blocId = normalizeString(person.blocId, "NA");
    person.countryISO = normalizeString(person.countryISO, "US");
    person.state = normalizeString(person.state, null);
    person.birthDay = toInteger(person.birthDay, simDay - Math.round(estimatedAge * yearDays));
    person.age = toFiniteNumber(person.age, Math.max(0, (simDay - person.birthDay) / yearDays));
    person.alive = person.alive !== false;
    person.deathDay = person.deathDay == null ? null : toInteger(person.deathDay, null);
    person.retired = !!person.retired;
    person.lifeStage = normalizeString(person.lifeStage, person.alive ? "adult" : "deceased");
    person.traits = normalizeTraits(person.traits);
    person.netWorthGU = toFiniteNumber(person.netWorthGU, 0);
    person.businessId = normalizeString(person.businessId, null);
    person.employerBusinessId = normalizeString(person.employerBusinessId, null);
    person.jobTitle = normalizeString(person.jobTitle, null);
    person.jobTier = normalizeString(person.jobTier, null);
    person.jobDepartment = normalizeString(person.jobDepartment, null);
    person.salaryGU = Math.max(0, toFiniteNumber(person.salaryGU, 0));
    person.status = normalizeString(person.status, person.alive ? "starting" : "deceased");
    person.svgX = toFiniteNumber(person.svgX, 0);
    person.svgY = toFiniteNumber(person.svgY, 0);
    person.pulse = toFiniteNumber(person.pulse, 0);
    person.spouseId = normalizeString(person.spouseId, null);
    person.householdId = normalizeString(person.householdId, null);
    person.parentIds = normalizeStringArray(person.parentIds).filter(function(id){
      return id !== person.id;
    });
    person.childrenIds = normalizeStringArray(person.childrenIds).filter(function(id){
      return id !== person.id;
    });
    person.lineageId = normalizeString(person.lineageId, "lineage-" + person.id.slice(0, 6));
    person.nameOrder = normalizeString(person.nameOrder, App.utils.getNameOrder(person.countryISO));
    person.nativeDisplayName = normalizeString(person.nativeDisplayName, null);
    person.traitMilestones = {
      age8:!!(person.traitMilestones && person.traitMilestones.age8),
      age16:!!(person.traitMilestones && person.traitMilestones.age16)
    };
    person.lastLifeEventYear = toInteger(person.lastLifeEventYear, Math.floor(simDay / yearDays));
    person.decisionProfileBase = person.decisionProfileBase && typeof person.decisionProfileBase === "object" ? person.decisionProfileBase : null;
    person.decisionProfile = person.decisionProfile && typeof person.decisionProfile === "object" ? person.decisionProfile : null;
    person.temporaryStates = person.temporaryStates && typeof person.temporaryStates === "object" ? person.temporaryStates : null;
    person.educationIndex = clamp(toFiniteNumber(person.educationIndex, 0), 0, 100);
    person.educationAttainment = normalizeEducationAttainment(person.educationAttainment, person.educationIndex);
    person.educationCredentialLabel = normalizeEducationCredentialLabel(person.educationCredentialLabel, person.educationAttainment);
    person.educationInstitutionType = normalizeEducationInstitutionType(person.educationInstitutionType, person.educationIndex);
    person.educationInstitutionName = normalizeEducationInstitutionName(person.educationInstitutionName, person.educationInstitutionType, person.educationInstitutionSector, person.countryISO);
    person.educationInstitutionSector = normalizeEducationInstitutionSector(person.educationInstitutionSector, person.educationInstitutionType, person.educationInstitutionName);
    person.educationInstitutionName = normalizeEducationInstitutionName(person.educationInstitutionName, person.educationInstitutionType, person.educationInstitutionSector, person.countryISO);
    person.educationCourseLabel = normalizeEducationCourseLabel(person.educationCourseLabel, person.educationInstitutionType);
    person.educationInstitutionQuality = normalizeEducationInstitutionQuality(person.educationInstitutionQuality, person.educationIndex);
    person.childhoodStage = normalizeChildhoodStage(person.childhoodStage, person.age);
    person.skillTrack = normalizeSkillTrack(person.skillTrack, person.age);
    person.skills = normalizePersonSkills(person.skills, person.educationIndex, person.age);
    person.lastTraitEffects = normalizeTraitEffects(person.lastTraitEffects);

    return person;
  }

  function migrateBusinessToV1(business, context){
    var simDay = context.simDay;
    var estimatedAge = Math.max(0, toInteger(business.age, 0));

    business.id = normalizeString(business.id, "legacy-business-" + context.index);
    business.name = normalizeString(business.name, "Legacy Holdings");
    business.industry = normalizeString(business.industry, "Technology");
    business.ownerId = normalizeString(business.ownerId, null);
    business.founderId = normalizeString(business.founderId, business.ownerId);
    business.blocId = normalizeString(business.blocId, "NA");
    business.countryISO = normalizeString(business.countryISO, "US");
    business.lineageId = normalizeString(business.lineageId, null);
    business.revenueGU = Math.max(0, toFiniteNumber(business.revenueGU, 0));
    business.profitGU = toFiniteNumber(business.profitGU, 0);
    business.valuationGU = Math.max(0, toFiniteNumber(business.valuationGU, 0));
    business.employees = Math.max(1, toInteger(business.employees, 1));
    business.leadership = Array.isArray(business.leadership) ? business.leadership : [];
    business.logo = business.logo && typeof business.logo === "object" ? business.logo : null;
    business.reputation = clamp(toFiniteNumber(business.reputation, 50), 0, 100);
    business.cashReservesGU = Math.max(0, toFiniteNumber(business.cashReservesGU, 0));
    business.currentDecision = business.currentDecision && typeof business.currentDecision === "object" ? business.currentDecision : null;
    business.decisionHistory = normalizeDecisionHistory(business.decisionHistory);
    business.stage = normalizeString(business.stage, "startup");
    business.foundedDay = toInteger(business.foundedDay, simDay - estimatedAge);
    business.age = Math.max(0, toInteger(business.age, Math.max(0, simDay - business.foundedDay)));
    business.successionCount = Math.max(0, toInteger(business.successionCount, 0));
    business.inheritedAtDay = business.inheritedAtDay == null ? null : toInteger(business.inheritedAtDay, null);
    business.revenueHistory = normalizeNumberArray(business.revenueHistory).slice(-MAX_REVENUE_HISTORY);
    business.lastTraitEffects = normalizeTraitEffects(business.lastTraitEffects);

    if (!business.revenueHistory.length && business.revenueGU > 0) {
      business.revenueHistory = [business.revenueGU];
    }

    return business;
  }

  function migrateBlocToV1(bloc, context){
    var templates = context.blocTemplates;
    var template = templates[bloc.id] || null;
    var merged = template ? Object.assign({}, template, bloc) : Object.assign({}, bloc);

    merged.id = normalizeString(merged.id, "NA");
    merged.name = normalizeString(merged.name, template ? template.name : "Unknown Bloc");
    merged.flag = normalizeString(merged.flag, template ? template.flag : "🌐");
    merged.currency = normalizeString(merged.currency, template ? template.currency : "USD");
    merged.symbol = normalizeString(merged.symbol, template ? template.symbol : "$");
    merged.color = normalizeString(merged.color, template ? template.color : "#1e3a5f");
    merged.label = normalizeString(merged.label, template ? template.label : "#4a9edd");
    merged.members = normalizeStringArray(merged.members && merged.members.length ? merged.members : (template ? template.members : []));
    merged.baseRate = Math.max(0.0001, toFiniteNumber(merged.baseRate, template ? template.baseRate : 1));
    merged.rate = Math.max(0.0001, toFiniteNumber(merged.rate, merged.baseRate));
    merged.prevRate = Math.max(0.0001, toFiniteNumber(merged.prevRate, merged.rate));
    merged.rateHistory = normalizeNumberArray(merged.rateHistory).slice(-MAX_RATE_HISTORY);
    merged.geoPressure = Math.max(0, toFiniteNumber(merged.geoPressure, 0));
    merged.defaultRisk = Math.max(0, toFiniteNumber(merged.defaultRisk, 0));
    merged.gdp = Math.max(0, toFiniteNumber(merged.gdp, 0));

    return merged;
  }

  function migrateCountryToV1(country, context){
    var iso = normalizeString(country.iso, context.iso);

    return {
      iso:iso,
      name:normalizeString(country.name, context.countryNames[iso] || iso),
      population:country.population == null ? null : toInteger(country.population, null),
      educationIndex:country.educationIndex == null ? null : toFiniteNumber(country.educationIndex, null),
      institutionScore:country.institutionScore == null ? null : toFiniteNumber(country.institutionScore, null),
      updatedAtDay:country.updatedAtDay == null ? null : toInteger(country.updatedAtDay, null)
    };
  }

  function migrateCountryDataToV1(countryData, countryNames, fromVersion){
    var next = {};

    Object.keys(countryData || {}).forEach(function(iso){
      var migrated = migrateEntityRecord("country", countryData[iso], fromVersion, 1, {
        iso:iso,
        countryNames:countryNames
      });
      if (migrated && migrated.iso) {
        next[migrated.iso] = migrated;
      }
    });

    Object.keys(countryNames || {}).forEach(function(iso){
      if (!next[iso]) {
        next[iso] = migrateEntityRecord("country", { iso:iso, name:countryNames[iso] }, fromVersion, 1, {
          iso:iso,
          countryNames:countryNames
        });
      }
    });

    return next;
  }

  function normalizeTraitEffectStats(stats){
    var next = {};

    Object.keys(stats || {}).forEach(function(trait){
      var traitKey = normalizeString(trait, null);
      if (!traitKey) return;
      next[traitKey] = {};

      Object.keys(stats[trait] || {}).forEach(function(channel){
        var channelKey = normalizeString(channel, null);
        var entry = stats[trait][channel] || {};
        if (!channelKey) return;
        next[traitKey][channelKey] = {
          hits:Math.max(0, toInteger(entry.hits, 0)),
          totalImpact:toFiniteNumber(entry.totalImpact, 0)
        };
      });
    });

    return next;
  }

  function normalizeEconHistory(econHist, blocs){
    var next = {};

    (Array.isArray(blocs) ? blocs : []).forEach(function(bloc){
      var values = normalizeNumberArray(econHist && econHist[bloc.id]).slice(-MAX_RATE_HISTORY);
      next[bloc.id] = values;
    });

    return next;
  }

  function reconcileCrossReferences(state){
    var peopleById = indexById(state.people);
    var businessesById = indexById(state.businesses);

    state.people.forEach(function(person){
      if (person.businessId && !businessesById[person.businessId]) {
        person.businessId = null;
      }
      if (person.employerBusinessId && !businessesById[person.employerBusinessId]) {
        person.employerBusinessId = null;
        person.jobTitle = null;
        person.jobTier = null;
        person.jobDepartment = null;
        person.salaryGU = 0;
      }
      if (person.spouseId && !peopleById[person.spouseId]) {
        person.spouseId = null;
      }
      person.parentIds = person.parentIds.filter(function(id){
        return !!peopleById[id];
      });
      person.childrenIds = person.childrenIds.filter(function(id){
        return !!peopleById[id];
      });
    });

    state.businesses.forEach(function(business){
      if (business.ownerId && !peopleById[business.ownerId]) {
        business.ownerId = null;
      }
      if (business.founderId && !peopleById[business.founderId]) {
        business.founderId = business.ownerId;
      }
    });
  }

  function addMissingBlocTemplates(state){
    var templates = getBlocTemplateMap();
    var existing = {};

    state.blocs.forEach(function(bloc){
      existing[bloc.id] = true;
    });

    Object.keys(templates).forEach(function(blocId){
      if (existing[blocId]) return;
      state.blocs.push(migrateEntityRecord("bloc", templates[blocId], 0, 1, { blocTemplates:templates }));
    });
  }

  function migrateSnapshotToV1(snapshot, context){
    var previousState = snapshot.state || {};
    var yearDays = getYearDays();
    var fromVersion = context.fromVersion;
    var blocTemplates = getBlocTemplateMap();
    var migratedState = {};

    migratedState.simDay = Math.max(0, toInteger(previousState.simDay, 0));
    migratedState.simSpeed = clamp(toFiniteNumber(previousState.simSpeed, 1), 0, 8);
    migratedState.accumulator = Math.max(0, toFiniteNumber(previousState.accumulator, 0));
    migratedState.selectedBlocId = normalizeString(previousState.selectedBlocId, "NA");
    migratedState.selection = normalizeSelection(previousState.selection);
    migratedState.countryNames = normalizeCountryNames(previousState.countryNames);

    migratedState.people = dedupeById((Array.isArray(previousState.people) ? previousState.people : []).map(function(person, index){
      return migrateEntityRecord("person", person, fromVersion, 1, {
        index:index,
        simDay:migratedState.simDay,
        yearDays:yearDays
      });
    }));

    migratedState.businesses = dedupeById((Array.isArray(previousState.businesses) ? previousState.businesses : []).map(function(business, index){
      return migrateEntityRecord("business", business, fromVersion, 1, {
        index:index,
        simDay:migratedState.simDay
      });
    }));

    migratedState.blocs = dedupeById((Array.isArray(previousState.blocs) ? previousState.blocs : []).map(function(bloc){
      return migrateEntityRecord("bloc", bloc, fromVersion, 1, { blocTemplates:blocTemplates });
    }));
    addMissingBlocTemplates({ blocs:migratedState.blocs });

    migratedState.newsItems = normalizeNewsItems(previousState.newsItems, migratedState.simDay);
    migratedState.eventHistory = normalizeEventHistory(previousState.eventHistory, migratedState.newsItems, migratedState.simDay);
    migratedState.eventWindowStats = normalizeEventWindowStats(previousState.eventWindowStats);
    migratedState.eventSeq = Math.max(0, toInteger(previousState.eventSeq, 0));
    migratedState.pauseReasonEventId = normalizeString(previousState.pauseReasonEventId, null);
    migratedState.traitEffectStats = normalizeTraitEffectStats(previousState.traitEffectStats);
    migratedState.econHist = normalizeEconHistory(previousState.econHist, migratedState.blocs);
    migratedState.tickerData = previousState.tickerData && typeof previousState.tickerData === "object" ? previousState.tickerData : {};
    migratedState.countryData = migrateCountryDataToV1(previousState.countryData, migratedState.countryNames, fromVersion);
    migratedState.isoToBloc = createIsoToBloc(migratedState.blocs);

    reconcileCrossReferences(migratedState);

    return buildSnapshotEnvelope(snapshot, 1, migratedState, null);
  }

  function migrateSnapshotToV2(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);

    migratedState.countryProfiles = normalizeCountryProfiles(
      previousState.countryProfiles,
      migratedState.blocs,
      migratedState.businesses,
      {
        injectBusinessHeadcount:true
      }
    );
    migratedState.newsItems = normalizeNewsItems(previousState.newsItems, migratedState.simDay);
    migratedState.eventHistory = normalizeEventHistory(previousState.eventHistory, migratedState.newsItems, migratedState.simDay);
    migratedState.eventWindowStats = normalizeEventWindowStats(previousState.eventWindowStats);
    migratedState.eventSeq = Math.max(0, toInteger(previousState.eventSeq, 0));
    migratedState.pauseReasonEventId = normalizeString(previousState.pauseReasonEventId, null);

    return buildSnapshotEnvelope(snapshot, 2, migratedState, null);
  }

  function migrateSnapshotToV3(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);

    migratedState.newsItems = normalizeNewsItems(previousState.newsItems, migratedState.simDay);
    migratedState.eventHistory = normalizeEventHistory(previousState.eventHistory, migratedState.newsItems, migratedState.simDay);
    migratedState.eventWindowStats = normalizeEventWindowStats(previousState.eventWindowStats);
    migratedState.eventSeq = Math.max(0, toInteger(previousState.eventSeq, 0));
    migratedState.pauseReasonEventId = normalizeString(previousState.pauseReasonEventId, null);

    if (!migratedState.eventSeq) {
      migratedState.eventSeq = migratedState.eventHistory.reduce(function(max, item){
        var suffix = Number(String(item && item.id || "").replace("evt-", ""));
        return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
      }, 0);
    }

    if (migratedState.pauseReasonEventId) {
      var hasPauseEvent = migratedState.eventHistory.some(function(item){
        return item && item.id === migratedState.pauseReasonEventId;
      });
      if (!hasPauseEvent) {
        migratedState.pauseReasonEventId = null;
      }
    }

    return buildSnapshotEnvelope(snapshot, 3, migratedState, null);
  }

  function migrateSnapshotToV4(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);

    migratedState.newsItems = normalizeNewsItems(previousState.newsItems, migratedState.simDay);
    migratedState.eventHistory = normalizeEventHistory(previousState.eventHistory, migratedState.newsItems, migratedState.simDay);
    migratedState.eventWindowStats = normalizeEventWindowStats(previousState.eventWindowStats);
    migratedState.eventSeq = Math.max(0, toInteger(previousState.eventSeq, 0));
    migratedState.pauseReasonEventId = normalizeString(previousState.pauseReasonEventId, null);

    if (!migratedState.eventSeq) {
      migratedState.eventSeq = migratedState.eventHistory.reduce(function(max, item){
        var suffix = Number(String(item && item.id || "").replace("evt-", ""));
        return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
      }, 0);
    }

    if (migratedState.pauseReasonEventId) {
      var hasPauseEvent = migratedState.eventHistory.some(function(item){
        return item && item.id === migratedState.pauseReasonEventId;
      });
      if (!hasPauseEvent) {
        migratedState.pauseReasonEventId = null;
      }
    }

    return buildSnapshotEnvelope(snapshot, 4, migratedState, null);
  }

  function migrateSnapshotToV5(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);
    var householdMembers = {};

    migratedState.people = (Array.isArray(previousState.people) ? previousState.people : []).map(function(person){
      var next = deepClone(person || {});
      next.householdId = normalizeString(next.householdId, null);
      return next;
    });
    migratedState.households = normalizeHouseholds(previousState.households, migratedState.people, previousState.countryProfiles || {});

    migratedState.households.forEach(function(household){
      (household.adultIds || []).concat(household.childIds || []).forEach(function(id){
        householdMembers[id] = household.id;
      });
    });

    migratedState.people.forEach(function(person){
      person.householdId = householdMembers[person.id] || person.householdId || null;
    });

    return buildSnapshotEnvelope(snapshot, 5, migratedState, null);
  }

  function migrateSnapshotToV6(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);
    var namingMode = resolveSnapshotBusinessNamingMode(snapshot, "legacy");

    return buildSnapshotEnvelope(snapshot, 6, migratedState, namingMode || "legacy");
  }

  function migrateSnapshotToV7(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);
    var householdsById = {};
    var people = Array.isArray(migratedState.people) ? migratedState.people : [];
    var profiles = migratedState.countryProfiles || {};

    function estimateEducationIndex(person){
      var profile = profiles[person.countryISO] || null;
      var household = person.householdId ? householdsById[person.householdId] : null;
      var classTier = normalizeHouseholdTier(household && household.classTier);
      var classRank = { strained:0, working:1, middle:2, affluent:3, elite:4 }[classTier];
      var age = Math.max(0, toFiniteNumber(person.age, 0));
      var base;

      if (age < 6) {
        base = 0;
      } else if (age < 12) {
        base = 8;
      } else if (age < 18) {
        base = 18;
      } else if (age < 25) {
        base = 28;
      } else {
        base = 34;
      }

      base += clamp(toFiniteNumber(profile && profile.educationIndex, 0.6), 0.1, 1) * 34;
      base += clamp(toFiniteNumber(profile && profile.institutionScore, 0.55), 0.1, 1) * 18;
      base += (classRank - 1) * 7;
      return clamp(base, 0, 100);
    }

    (Array.isArray(migratedState.households) ? migratedState.households : []).forEach(function(household){
      var id = normalizeString(household && household.id, null);
      if (!id) return;
      householdsById[id] = household;
    });

    migratedState.people = people.map(function(person){
      var next = deepClone(person || {});
      var education = toFiniteNumber(next.educationIndex, NaN);

      if (!Number.isFinite(education)) {
        education = estimateEducationIndex(next);
      }
      next.educationIndex = clamp(education, 0, 100);
      next.educationAttainment = normalizeEducationAttainment(next.educationAttainment, next.educationIndex);
      return next;
    });

    return buildSnapshotEnvelope(snapshot, 7, migratedState, resolveSnapshotBusinessNamingMode(snapshot, "legacy") || "legacy");
  }

  function migrateSnapshotToV8(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);

    migratedState.people = (Array.isArray(migratedState.people) ? migratedState.people : []).map(function(person){
      var next = deepClone(person || {});
      var education = clamp(toFiniteNumber(next.educationIndex, 0), 0, 100);

      next.educationIndex = education;
      next.educationAttainment = normalizeEducationAttainment(next.educationAttainment, education);
      next.childhoodStage = normalizeChildhoodStage(next.childhoodStage, next.age);
      next.skillTrack = normalizeSkillTrack(next.skillTrack, next.age);
      next.skills = normalizePersonSkills(next.skills, education, next.age);
      return next;
    });

    return buildSnapshotEnvelope(snapshot, 8, migratedState, resolveSnapshotBusinessNamingMode(snapshot, "legacy") || "legacy");
  }

  function migrateSnapshotToV9(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);

    migratedState.people = (Array.isArray(migratedState.people) ? migratedState.people : []).map(function(person){
      var next = deepClone(person || {});
      var education = clamp(toFiniteNumber(next.educationIndex, 0), 0, 100);

      next.educationIndex = education;
      next.educationAttainment = normalizeEducationAttainment(next.educationAttainment, education);
      next.educationCredentialLabel = normalizeEducationCredentialLabel(next.educationCredentialLabel, next.educationAttainment);
      next.educationInstitutionType = normalizeEducationInstitutionType(next.educationInstitutionType, education);
      next.educationInstitutionName = normalizeEducationInstitutionName(next.educationInstitutionName, next.educationInstitutionType);
      next.educationInstitutionQuality = normalizeEducationInstitutionQuality(next.educationInstitutionQuality, education);
      return next;
    });

    return buildSnapshotEnvelope(snapshot, 9, migratedState, resolveSnapshotBusinessNamingMode(snapshot, "legacy") || "legacy");
  }

  function migrateSnapshotToV10(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);

    migratedState.people = (Array.isArray(migratedState.people) ? migratedState.people : []).map(function(person){
      var next = deepClone(person || {});
      var education = clamp(toFiniteNumber(next.educationIndex, 0), 0, 100);

      next.educationIndex = education;
      next.educationAttainment = normalizeEducationAttainment(next.educationAttainment, education);
      next.educationCredentialLabel = normalizeEducationCredentialLabel(next.educationCredentialLabel, next.educationAttainment);
      next.educationInstitutionType = normalizeEducationInstitutionType(next.educationInstitutionType, education);
      next.educationInstitutionSector = normalizeEducationInstitutionSector(next.educationInstitutionSector, next.educationInstitutionType);
      next.educationInstitutionName = normalizeEducationInstitutionName(next.educationInstitutionName, next.educationInstitutionType);
      next.educationInstitutionQuality = normalizeEducationInstitutionQuality(next.educationInstitutionQuality, education);
      return next;
    });

    return buildSnapshotEnvelope(snapshot, 10, migratedState, resolveSnapshotBusinessNamingMode(snapshot, "legacy") || "legacy");
  }

  function migrateSnapshotToV11(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);

    migratedState.people = (Array.isArray(migratedState.people) ? migratedState.people : []).map(function(person){
      var next = deepClone(person || {});
      var education = clamp(toFiniteNumber(next.educationIndex, 0), 0, 100);

      next.educationIndex = education;
      next.educationAttainment = normalizeEducationAttainment(next.educationAttainment, education);
      next.educationCredentialLabel = normalizeEducationCredentialLabel(next.educationCredentialLabel, next.educationAttainment);
      next.educationInstitutionType = normalizeEducationInstitutionType(next.educationInstitutionType, education);
      next.educationInstitutionName = normalizeEducationInstitutionName(next.educationInstitutionName, next.educationInstitutionType, next.educationInstitutionSector, next.countryISO);
      next.educationInstitutionSector = normalizeEducationInstitutionSector(next.educationInstitutionSector, next.educationInstitutionType, next.educationInstitutionName);
      next.educationInstitutionName = normalizeEducationInstitutionName(next.educationInstitutionName, next.educationInstitutionType, next.educationInstitutionSector, next.countryISO);
      next.educationCourseLabel = normalizeEducationCourseLabel(next.educationCourseLabel, next.educationInstitutionType);
      next.educationInstitutionQuality = normalizeEducationInstitutionQuality(next.educationInstitutionQuality, education);
      return next;
    });

    return buildSnapshotEnvelope(snapshot, 11, migratedState, resolveSnapshotBusinessNamingMode(snapshot, "legacy") || "legacy");
  }

  function migrateSnapshot(rawSnapshot){
    var normalizedSnapshot;
    var working;
    var fromVersion;
    var version;

    if (!rawSnapshot || typeof rawSnapshot !== "object") {
      return { ok:false, error:"Snapshot payload must be an object." };
    }

    normalizedSnapshot = rawSnapshot.state ? rawSnapshot : {
      schemaVersion:rawSnapshot.schemaVersion,
      savedAtISO:rawSnapshot.savedAtISO || null,
      state:rawSnapshot
    };
    working = deepClone(normalizedSnapshot);
    fromVersion = toInteger(working.schemaVersion, 0);

    if (fromVersion > SCHEMA_VERSION) {
      return {
        ok:false,
        error:"Snapshot schema v" + fromVersion + " is newer than supported v" + SCHEMA_VERSION + "."
      };
    }

    version = fromVersion;
    while (version < SCHEMA_VERSION) {
      var nextVersion = version + 1;
      var migrator = snapshotMigrations[nextVersion];

      if (typeof migrator !== "function") {
        return {
          ok:false,
          error:"Missing snapshot migration for target schema v" + nextVersion + "."
        };
      }

      working = migrator(working, { fromVersion:version, toVersion:nextVersion }) || working;
      working.schemaVersion = nextVersion;
      version = nextVersion;
    }

    if (fromVersion === SCHEMA_VERSION && typeof snapshotMigrations[SCHEMA_VERSION] === "function") {
      working = snapshotMigrations[SCHEMA_VERSION](working, { fromVersion:0, toVersion:SCHEMA_VERSION }) || working;
      working.schemaVersion = SCHEMA_VERSION;
    }

    return {
      ok:true,
      fromVersion:fromVersion,
      toVersion:version,
      snapshot:working
    };
  }

  function applySnapshotToStore(snapshot){
    var state = snapshot.state || {};
    var simDay = Math.max(0, toInteger(state.simDay, 0));
    var householdMembers = {};

    App.store.blocs = deepClone(state.blocs || []);
    App.store.isoToBloc = createIsoToBloc(App.store.blocs);
    App.store.people = deepClone(state.people || []);
    App.store.businesses = deepClone(state.businesses || []);
    App.store.newsItems = normalizeNewsItems(state.newsItems, simDay);
    App.store.eventHistory = normalizeEventHistory(state.eventHistory, App.store.newsItems, simDay);
    App.store.eventWindowStats = normalizeEventWindowStats(state.eventWindowStats);
    App.store.eventSeq = Math.max(0, toInteger(state.eventSeq, 0));
    App.store.pauseReasonEventId = normalizeString(state.pauseReasonEventId, null);
    App.store.traitEffectStats = deepClone(state.traitEffectStats || {});
    App.store.econHist = deepClone(state.econHist || {});
    App.store.tickerData = deepClone(state.tickerData || {});
    App.store.businessNamingMode = normalizeBusinessNamingMode(resolveSnapshotBusinessNamingMode(snapshot, "legacy"), "legacy");
    App.store.selectedBlocId = normalizeString(state.selectedBlocId, "NA");
    App.store.selection = normalizeSelection(state.selection);
    App.store.simSpeed = clamp(toFiniteNumber(state.simSpeed, 1), 0, 8);
    App.store.simDay = simDay;
    App.store.accumulator = Math.max(0, toFiniteNumber(state.accumulator, 0));
    App.store.countryNames = normalizeCountryNames(state.countryNames);
    App.store.countryData = deepClone(state.countryData || {});
    App.store.countryProfiles = normalizeCountryProfiles(state.countryProfiles, App.store.blocs, App.store.businesses, {
      injectBusinessHeadcount:false
    });
    App.store.governor = normalizeGovernorState(state.governor);
    App.store.households = normalizeHouseholds(state.households, App.store.people, App.store.countryProfiles);

    App.store.households.forEach(function(household){
      (household.adultIds || []).concat(household.childIds || []).forEach(function(id){
        householdMembers[id] = household.id;
      });
    });
    App.store.people.forEach(function(person){
      person.householdId = householdMembers[person.id] || normalizeString(person.householdId, null);
    });

    if (!App.store.eventSeq) {
      App.store.eventSeq = App.store.eventHistory.reduce(function(max, item){
        var suffix = Number(String(item && item.id || "").replace("evt-", ""));
        return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
      }, 0);
    }

    if (App.store.pauseReasonEventId) {
      var hasPauseEvent = App.store.eventHistory.some(function(item){
        return item && item.id === App.store.pauseReasonEventId;
      });
      if (!hasPauseEvent) {
        App.store.pauseReasonEventId = null;
      }
    }
  }

  function canUseStorage(){
    try {
      if (!global.localStorage) return false;
      var key = "__nexus_save_probe__";
      global.localStorage.setItem(key, "1");
      global.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function exportSnapshot(){
    var rawState = {
      blocs:deepClone(App.store.blocs || []),
      people:deepClone(App.store.people || []),
      households:deepClone(App.store.households || []),
      businesses:deepClone(App.store.businesses || []),
      newsItems:deepClone(App.store.newsItems || []),
      eventHistory:deepClone(App.store.eventHistory || []),
      eventWindowStats:deepClone(App.store.eventWindowStats || {}),
      eventSeq:Math.max(0, toInteger(App.store.eventSeq, 0)),
      pauseReasonEventId:normalizeString(App.store.pauseReasonEventId, null),
      traitEffectStats:deepClone(App.store.traitEffectStats || {}),
      econHist:deepClone(App.store.econHist || {}),
      tickerData:deepClone(App.store.tickerData || {}),
      selectedBlocId:App.store.selectedBlocId,
      selection:deepClone(App.store.selection || { type:null, id:null }),
      simSpeed:App.store.simSpeed,
      simDay:App.store.simDay,
      accumulator:App.store.accumulator,
      countryNames:deepClone(App.store.countryNames || {}),
      countryData:deepClone(App.store.countryData || {}),
      countryProfiles:deepClone(App.store.countryProfiles || {}),
      governor:normalizeGovernorState(App.store.governor)
    };
    var migrated = migrateSnapshot({
      schemaVersion:0,
      savedAtISO:new Date().toISOString(),
      businessNamingMode:normalizeBusinessNamingMode(App.store.businessNamingMode, "v2"),
      state:rawState
    });

    if (!migrated.ok) {
      throw new Error(migrated.error || "Snapshot export failed.");
    }

    return migrated.snapshot;
  }

  function importSnapshot(snapshot){
    var migrated = migrateSnapshot(snapshot);

    if (!migrated.ok) {
      return migrated;
    }

    applySnapshotToStore(migrated.snapshot);
    lastAutoSaveDay = App.store.simDay;
    return {
      ok:true,
      fromVersion:migrated.fromVersion,
      toVersion:migrated.toVersion,
      snapshot:migrated.snapshot
    };
  }

  function saveNow(){
    var snapshot;

    if (!canUseStorage()) {
      return { ok:false, error:"localStorage is unavailable in this environment." };
    }

    try {
      snapshot = exportSnapshot();
      global.localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
      lastAutoSaveDay = App.store.simDay;
      return { ok:true, snapshot:snapshot };
    } catch (error) {
      return { ok:false, error:error && error.message ? error.message : "Failed to save snapshot." };
    }
  }

  function restoreLatest(){
    var raw;
    var parsed;
    var imported;

    if (!canUseStorage()) {
      return { ok:false, error:"localStorage is unavailable in this environment." };
    }

    raw = global.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return { ok:false, reason:"empty" };
    }

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return { ok:false, error:"Saved snapshot JSON is corrupted." };
    }

    imported = importSnapshot(parsed);
    if (!imported.ok) {
      return imported;
    }

    return {
      ok:true,
      fromVersion:imported.fromVersion,
      toVersion:imported.toVersion,
      snapshot:imported.snapshot
    };
  }

  function clearLatest(){
    if (!canUseStorage()) return;
    global.localStorage.removeItem(SAVE_KEY);
    lastAutoSaveDay = null;
  }

  function hasSnapshot(){
    if (!canUseStorage()) return false;
    return !!global.localStorage.getItem(SAVE_KEY);
  }

  function autoCheckpoint(force){
    var needsSave = !!force;

    if (!needsSave) {
      needsSave = lastAutoSaveDay == null || Math.abs(App.store.simDay - lastAutoSaveDay) >= AUTOSAVE_INTERVAL_DAYS;
    }

    if (!needsSave) {
      return { ok:false, reason:"throttled" };
    }

    return saveNow();
  }

  function registerSnapshotMigration(targetVersion, migrationFn){
    if (!Number.isInteger(targetVersion) || targetVersion < 1) return false;
    if (typeof migrationFn !== "function") return false;
    snapshotMigrations[targetVersion] = migrationFn;
    return true;
  }

  function registerEntityMigration(entityType, targetVersion, migrationFn){
    if (!entityMigrations[entityType]) return false;
    if (!Number.isInteger(targetVersion) || targetVersion < 1) return false;
    if (typeof migrationFn !== "function") return false;
    entityMigrations[entityType][targetVersion] = migrationFn;
    return true;
  }

  registerEntityMigration("person", 1, migratePersonToV1);
  registerEntityMigration("business", 1, migrateBusinessToV1);
  registerEntityMigration("bloc", 1, migrateBlocToV1);
  registerEntityMigration("country", 1, migrateCountryToV1);
  registerSnapshotMigration(1, migrateSnapshotToV1);
  registerSnapshotMigration(2, migrateSnapshotToV2);
  registerSnapshotMigration(3, migrateSnapshotToV3);
  registerSnapshotMigration(4, migrateSnapshotToV4);
  registerSnapshotMigration(5, migrateSnapshotToV5);
  registerSnapshotMigration(6, migrateSnapshotToV6);
  registerSnapshotMigration(7, migrateSnapshotToV7);
  registerSnapshotMigration(8, migrateSnapshotToV8);
  registerSnapshotMigration(9, migrateSnapshotToV9);
  registerSnapshotMigration(10, migrateSnapshotToV10);
  registerSnapshotMigration(11, migrateSnapshotToV11);

  App.persistence = {
    SAVE_KEY:SAVE_KEY,
    SCHEMA_VERSION:SCHEMA_VERSION,
    AUTOSAVE_INTERVAL_DAYS:AUTOSAVE_INTERVAL_DAYS,
    exportSnapshot:exportSnapshot,
    importSnapshot:importSnapshot,
    saveNow:saveNow,
    restoreLatest:restoreLatest,
    clearLatest:clearLatest,
    hasSnapshot:hasSnapshot,
    autoCheckpoint:autoCheckpoint,
    migrateSnapshot:migrateSnapshot,
    registerSnapshotMigration:registerSnapshotMigration,
    registerEntityMigration:registerEntityMigration
  };
})(window);
