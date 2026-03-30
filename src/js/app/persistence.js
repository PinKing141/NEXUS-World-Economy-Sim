(function(global){
  var App = global.Nexus || (global.Nexus = {});
  var SAVE_KEY = "nexus.world.snapshot";
  var SAVE_SLOT_KEY_PREFIX = "nexus.world.slot.v1.";
  var SAVE_SLOT_COUNT = 5;
  var SCHEMA_VERSION = 12;
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
  var LEGACY_WORLD_START_YEAR = (App.data && App.data.CALENDAR && Number(App.data.CALENDAR.startYear)) ? Number(App.data.CALENDAR.startYear) : 2026;
  var DEFAULT_WORLD_START_PRESET_ID = "present-day";

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

  function normalizeWorldStartPresetId(value, fallback){
    return normalizeString(value, fallback || DEFAULT_WORLD_START_PRESET_ID);
  }

  function normalizeIso(value){
    var text = String(value || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
    var aliases = {
      USA:"US",
      USO:"US",
      UK:"GB",
      GBR:"GB",
      UAE:"AE",
      KSA:"SA"
    };

    if (!text) return "";
    return aliases[text] || text;
  }

  function hashString(value){
    var text = String(value || "");
    var hash = 2166136261;
    var index;

    for (index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function isNonResidentialIso(iso){
    return ["AQ", "AX", "BV", "HM", "SJ", "TF", "UM"].indexOf(normalizeIso(iso)) !== -1;
  }

  function remapUnsupportedIso(iso, options){
    var normalized = normalizeIso(iso);
    var blocId = normalizeString(options && options.blocId, null);
    var key = normalizeString(options && options.stableKey, null) || normalized;
    var blocs = Array.isArray(options && options.blocs) ? options.blocs : [];
    var members = [];
    var bloc;
    var index;
    var fallbackMap = {
      AQ:"CL",
      AX:"FI",
      BV:"NO",
      HM:"AU",
      SJ:"NO",
      TF:"FR",
      UM:"US"
    };

    if (!normalized) return "";
    if (!isNonResidentialIso(normalized)) return normalized;

    if (blocId) {
      bloc = blocs.find(function(item){ return item && item.id === blocId; }) || null;
      if (bloc && Array.isArray(bloc.members)) {
        members = bloc.members.filter(function(memberIso){
          var candidate = normalizeIso(memberIso);
          return !!candidate && !isNonResidentialIso(candidate);
        });
      }
      if (members.length) {
        index = hashString(key + "|" + normalized + "|" + blocId) % members.length;
        return members[index];
      }
    }

    return fallbackMap[normalized] || "US";
  }

  function sanitizeResidencyUnsupportedCountries(state){
    var blocs = Array.isArray(state && state.blocs) ? state.blocs : [];
    var templateMap = getBlocTemplateMap();
    var isoToBloc;

    blocs.forEach(function(bloc){
      var seen = {};
      var members = Array.isArray(bloc && bloc.members) ? bloc.members : [];
      var templateBloc = templateMap[bloc && bloc.id] || null;
      var allowed = null;

      if (templateBloc && Array.isArray(templateBloc.members)) {
        allowed = {};
        templateBloc.members.forEach(function(iso){
          var normalized = normalizeIso(iso);
          if (normalized) allowed[normalized] = true;
        });
      }

      bloc.members = members.map(function(iso){
        return normalizeIso(iso);
      }).filter(function(iso){
        if (!iso || isNonResidentialIso(iso) || seen[iso]) return false;
        if (allowed && !allowed[iso]) return false;
        seen[iso] = true;
        return true;
      });
    });

    isoToBloc = createIsoToBloc(blocs);

    (Array.isArray(state && state.people) ? state.people : []).forEach(function(person){
      var fromIso = normalizeIso(person && person.countryISO);
      var toIso = remapUnsupportedIso(fromIso, {
        blocId:person && person.blocId,
        stableKey:person && person.id,
        blocs:blocs
      });
      var mappedBlocId;

      if (!person || !fromIso) return;

      if (fromIso !== toIso) {
        person.countryISO = toIso;
      }

      mappedBlocId = isoToBloc[toIso || fromIso];
      if (mappedBlocId) {
        person.blocId = mappedBlocId;
      }

      if (fromIso !== toIso) {
        if (toIso !== "US") {
          person.state = null;
          person.subdivision = null;
        } else if (person.subdivision == null) {
          person.subdivision = person.state || null;
        }
      }
    });

    (Array.isArray(state && state.businesses) ? state.businesses : []).forEach(function(business){
      var fromIso = normalizeIso(business && business.countryISO);
      var toIso = remapUnsupportedIso(fromIso, {
        blocId:business && business.blocId,
        stableKey:business && business.id,
        blocs:blocs
      });
      var mappedBlocId;

      if (!business || !fromIso) return;

      if (fromIso !== toIso) {
        business.countryISO = toIso;
      }

      mappedBlocId = isoToBloc[toIso || fromIso];
      if (mappedBlocId) {
        business.blocId = mappedBlocId;
      }

      if (fromIso !== toIso && toIso !== "US") {
        business.hqSubdivision = null;
      }
    });

    if (state && state.countryProfiles && typeof state.countryProfiles === "object") {
      Object.keys(state.countryProfiles).forEach(function(iso){
        if (!isNonResidentialIso(iso)) return;
        delete state.countryProfiles[iso];
      });
    }

    if (state && state.countryData && typeof state.countryData === "object") {
      Object.keys(state.countryData).forEach(function(iso){
        if (!isNonResidentialIso(iso)) return;
        delete state.countryData[iso];
      });
    }

    if (state && state.countryNames && typeof state.countryNames === "object") {
      Object.keys(state.countryNames).forEach(function(iso){
        if (!isNonResidentialIso(iso)) return;
        delete state.countryNames[iso];
      });
    }
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
    var interventionLog = Array.isArray(source.interventionLog) ? source.interventionLog : [];
    var nowDay = Math.max(0, toInteger((App.store && App.store.simDay) || 0, 0));
    var filteredCounts = {};
    var normalizedLog;

    Object.keys(interventionCounts).forEach(function(key){
      var numericDay = toInteger(key, NaN);
      var count;
      if (!Number.isFinite(numericDay)) return;
      if (Math.abs(nowDay - numericDay) > 10) return;
      count = Math.max(0, toInteger(interventionCounts[key], 0));
      if (!count) return;
      filteredCounts[String(numericDay)] = count;
    });

    normalizedLog = interventionLog.map(function(item){
      var entry = item && typeof item === "object" ? item : {};
      return {
        id:normalizeString(entry.id, "gov-log-" + nowDay + "-" + Math.floor(Math.random() * 1000000)),
        day:Math.max(0, toInteger(entry.day, nowDay)),
        key:normalizeString(entry.key, "intervention"),
        text:normalizeString(entry.text, "Governor intervention applied."),
        scope:normalizeString(entry.scope, "global"),
        entities:entry.entities && typeof entry.entities === "object" ? deepClone(entry.entities) : {},
        causes:Array.isArray(entry.causes) ? entry.causes.map(function(cause){ return normalizeString(cause, null); }).filter(Boolean).slice(0, 4) : []
      };
    }).filter(function(entry){
      return Math.abs(nowDay - entry.day) <= 720;
    }).slice(-200);

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
      interventionLog:normalizedLog,
      signalSnapshot:deepClone(signalSnapshot),
      runCount:Math.max(0, toInteger(source.runCount, 0)),
      lastRunDay:Math.max(0, toInteger(source.lastRunDay, 0))
    };
  }

  function parseTier6SanctionLaneKey(key){
    var parts = String(key || "").split("->");
    if (parts.length !== 2) {
      return { sourceBlocId:null, targetBlocId:null };
    }
    return {
      sourceBlocId:normalizeString(parts[0], null),
      targetBlocId:normalizeString(parts[1], null)
    };
  }

  function normalizeTier6SanctionLanes(value, blocs){
    var source = value && typeof value === "object" ? value : {};
    var validBlocIds = {};
    var next = {};

    (Array.isArray(blocs) ? blocs : []).forEach(function(bloc){
      var blocId = normalizeString(bloc && bloc.id, null);
      if (blocId) {
        validBlocIds[blocId] = true;
      }
    });

    Object.keys(source).forEach(function(key){
      var lane = source[key] && typeof source[key] === "object" ? source[key] : {};
      var parsedKey = parseTier6SanctionLaneKey(key);
      var sourceBlocId = normalizeString(lane.sourceBlocId, parsedKey.sourceBlocId);
      var targetBlocId = normalizeString(lane.targetBlocId, parsedKey.targetBlocId);
      var normalizedKey;
      var normalizedLane;

      if (!sourceBlocId || !targetBlocId || sourceBlocId === targetBlocId) return;
      if (Object.keys(validBlocIds).length && (!validBlocIds[sourceBlocId] || !validBlocIds[targetBlocId])) return;

      normalizedLane = {
        sourceBlocId:sourceBlocId,
        targetBlocId:targetBlocId,
        sanctionPressure:clamp(toFiniteNumber(lane.sanctionPressure, 0), 0, 1),
        tradeBlockIndex:clamp(toFiniteNumber(lane.tradeBlockIndex, 0), 0, 1),
        financeBlockIndex:clamp(toFiniteNumber(lane.financeBlockIndex, 0), 0, 1),
        dealBlockIndex:clamp(toFiniteNumber(lane.dealBlockIndex, 0), 0, 1),
        rerouteProgressIndex:clamp(toFiniteNumber(lane.rerouteProgressIndex, 0), 0, 1),
        lastUpdatedYear:Math.max(-1, toInteger(lane.lastUpdatedYear, -1)),
        lastNewsYear:Math.max(-1, toInteger(lane.lastNewsYear, -1)),
        active:lane.active === true
      };
      normalizedLane.active = normalizedLane.active ||
        normalizedLane.tradeBlockIndex >= 0.09 ||
        normalizedLane.financeBlockIndex >= 0.09 ||
        normalizedLane.dealBlockIndex >= 0.09;
      normalizedKey = normalizedLane.sourceBlocId + "->" + normalizedLane.targetBlocId;
      next[normalizedKey] = normalizedLane;
    });

    return next;
  }

  function normalizeStockMarketState(value, businesses, people, simDay){
    var source = value && typeof value === "object" ? value : {};
    var rawListings = source.listingsByBusinessId && typeof source.listingsByBusinessId === "object"
      ? source.listingsByBusinessId
      : (source.listings && typeof source.listings === "object" ? source.listings : {});
    var businessesById = indexById(Array.isArray(businesses) ? businesses : []);
    var peopleById = indexById(Array.isArray(people) ? people : []);
    var listingsByBusinessId = {};
    var nowDay = Math.max(0, toInteger(simDay, 0));
    var tape = Array.isArray(source.tradeTape) ? source.tradeTape : [];

    Object.keys(rawListings).forEach(function(key){
      var sourceListing = rawListings[key] && typeof rawListings[key] === "object" ? rawListings[key] : {};
      var businessId = normalizeString(sourceListing.businessId, normalizeString(key, null));
      var business = businessId ? businessesById[businessId] : null;
      var totalShares;
      var price;
      var treasuryShares;
      var sharesByHolder = {};
      var assigned = 0;

      if (!businessId || !business) return;

      totalShares = Math.max(1000, toInteger(sourceListing.totalShares, 1000000));
      price = Math.max(0.05, toFiniteNumber(sourceListing.sharePriceGU, Math.max(0.05, toFiniteNumber(business.valuationGU, 0) / totalShares)));
      treasuryShares = clamp(toInteger(sourceListing.treasuryShares, Math.floor(totalShares * 0.25)), 0, totalShares);
      assigned += treasuryShares;

      Object.keys(sourceListing.sharesByHolder && typeof sourceListing.sharesByHolder === "object" ? sourceListing.sharesByHolder : {}).forEach(function(holderId){
        var cleanedHolderId = normalizeString(holderId, null);
        var shares = Math.max(0, toInteger(sourceListing.sharesByHolder[holderId], 0));
        var headroom;

        if (!cleanedHolderId || !peopleById[cleanedHolderId] || !shares) return;
        headroom = Math.max(0, totalShares - assigned);
        if (!headroom) return;
        shares = Math.min(shares, headroom);
        sharesByHolder[cleanedHolderId] = shares;
        assigned += shares;
      });

      if (assigned < totalShares) {
        if (business.ownerId && peopleById[business.ownerId]) {
          sharesByHolder[business.ownerId] = (sharesByHolder[business.ownerId] || 0) + (totalShares - assigned);
        } else {
          treasuryShares += totalShares - assigned;
        }
      }

      listingsByBusinessId[businessId] = {
        businessId:businessId,
        symbol:normalizeString(sourceListing.symbol, business.name.slice(0, 4).toUpperCase()),
        listedDay:Math.max(0, toInteger(sourceListing.listedDay, nowDay)),
        totalShares:totalShares,
        treasuryShares:Math.max(0, Math.min(totalShares, treasuryShares)),
        sharesByHolder:sharesByHolder,
        sharePriceGU:price,
        annualDividendPerShareGU:Math.max(0, toFiniteNumber(sourceListing.annualDividendPerShareGU, 0)),
        lastDividendPerShareGU:Math.max(0, toFiniteNumber(sourceListing.lastDividendPerShareGU, 0)),
        lastDividendDay:Math.max(0, toInteger(sourceListing.lastDividendDay, 0)),
        lastVolumeShares:Math.max(0, toInteger(sourceListing.lastVolumeShares, 0)),
        rollingVolumeShares:Math.max(0, toInteger(sourceListing.rollingVolumeShares, 0)),
        lastSessionNetDemand:toFiniteNumber(sourceListing.lastSessionNetDemand, 0)
      };
    });

    return {
      listingsByBusinessId:listingsByBusinessId,
      lastDividendDay:Math.max(0, toInteger(source.lastDividendDay, 0)),
      lastTradeDay:Math.max(0, toInteger(source.lastTradeDay, 0)),
      lastIpoDay:Math.max(0, toInteger(source.lastIpoDay, 0)),
      tradeTape:tape.map(function(entry){
        var item = entry && typeof entry === "object" ? entry : {};
        var close = Math.max(0, toFiniteNumber(item.closePriceGU != null ? item.closePriceGU : item.priceGU, 0));
        var open = Math.max(0, toFiniteNumber(item.openPriceGU, close));
        var high = Math.max(close, open, Math.max(0, toFiniteNumber(item.highPriceGU, Math.max(open, close))));
        var low = Math.max(0, Math.min(open, close, toFiniteNumber(item.lowPriceGU, Math.min(open, close))));
        return {
          day:Math.max(0, toInteger(item.day, nowDay)),
          businessId:normalizeString(item.businessId, null),
          priceGU:close,
          openPriceGU:open,
          closePriceGU:close,
          highPriceGU:high,
          lowPriceGU:low,
          volumeShares:Math.max(0, toInteger(item.volumeShares, 0)),
          movePct:toFiniteNumber(item.movePct, 0)
        };
      }).filter(function(entry){
        return !!entry.businessId;
      }).slice(-120)
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

  function normalizeConsumerIndustryDemandWeights(weights){
    var baseline = {
      Technology:0.11,
      Finance:0.09,
      Retail:0.18,
      Manufacturing:0.1,
      "Real Estate":0.08,
      "F&B":0.16,
      Healthcare:0.12,
      Media:0.06,
      Logistics:0.06,
      Energy:0.04
    };
    var industries = (App.data && Array.isArray(App.data.INDUSTRIES)) ? App.data.INDUSTRIES : Object.keys(baseline);
    var normalized = {};
    var total = 0;

    industries.forEach(function(industry){
      var value = Math.max(0.001, toFiniteNumber(weights && weights[industry], baseline[industry] || 0.01));
      normalized[industry] = value;
      total += value;
    });

    if (total <= 0) {
      return baseline;
    }

    industries.forEach(function(industry){
      normalized[industry] = normalized[industry] / total;
    });

    return normalized;
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
      populationPressure:0.5,
      consumerSpendMultiplier:clamp(toFiniteNumber(source.consumerSpendMultiplier, 0.94), 0.55, 1.25),
      consumerCostOfLivingPressure:clamp(toFiniteNumber(source.consumerCostOfLivingPressure, 1.02), 0.65, 1.85),
      consumerStressIndex:clamp(toFiniteNumber(source.consumerStressIndex, 0.4), 0, 1),
      consumerIndustryDemandWeights:normalizeConsumerIndustryDemandWeights(source.consumerIndustryDemandWeights),
      housingCostPressure:clamp(toFiniteNumber(source.housingCostPressure, 1.02), 0.65, 2.2),
      housingRentBurden:clamp(toFiniteNumber(source.housingRentBurden, 0.34), 0.08, 0.9),
      housingHomeownershipRate:clamp(toFiniteNumber(source.housingHomeownershipRate, 0.52), 0.05, 0.95),
      housingAffordabilityIndex:clamp(toFiniteNumber(source.housingAffordabilityIndex, 0.52), 0.05, 1),
      housingPriceGrowth:clamp(toFiniteNumber(source.housingPriceGrowth, 0.02), -0.18, 0.26),
      housingMarketStress:clamp(toFiniteNumber(source.housingMarketStress, 0.35), 0, 1.5),
      medianHouseholdWealthGU:Math.max(0, toFiniteNumber(source.medianHouseholdWealthGU, 0)),
      topOneWealthShare:clamp(toFiniteNumber(source.topOneWealthShare, 0.3), 0.12, 0.95),
      intergenerationalMobilityIndex:clamp(toFiniteNumber(source.intergenerationalMobilityIndex, 0.5), 0, 1),
      socialUnrestIndex:clamp(toFiniteNumber(source.socialUnrestIndex, 0.28), 0, 1.8),
      strikeRiskIndex:clamp(toFiniteNumber(source.strikeRiskIndex, 0.22), 0, 1.4),
      populismIndex:clamp(toFiniteNumber(source.populismIndex, 0.24), 0, 1.6),
      crimeProxyIndex:clamp(toFiniteNumber(source.crimeProxyIndex, 0.22), 0, 1.6),
      emigrationPressureIndex:clamp(toFiniteNumber(source.emigrationPressureIndex, 0.24), 0, 1.6),
      institutionalInstabilityIndex:clamp(toFiniteNumber(source.institutionalInstabilityIndex, 0.2), 0, 1.6),
      philanthropicCapitalAnnualGU:Math.max(0, toFiniteNumber(source.philanthropicCapitalAnnualGU, 0)),
      philanthropyImpactIndex:clamp(toFiniteNumber(source.philanthropyImpactIndex, 0), 0, 1.6),
      legacyProjectsIndex:clamp(toFiniteNumber(source.legacyProjectsIndex, 0), 0, 1.4),
      worldStartPresetId:normalizeWorldStartPresetId(source.worldStartPresetId, DEFAULT_WORLD_START_PRESET_ID),
      worldStartYear:Math.max(0, toInteger(source.worldStartYear, LEGACY_WORLD_START_YEAR)),
      prehistoryWealthPressureIndex:clamp(toFiniteNumber(source.prehistoryWealthPressureIndex, 0.32), 0, 1),
      prehistoryMobilityTrendIndex:clamp(toFiniteNumber(source.prehistoryMobilityTrendIndex, 0.5), 0, 1),
      prehistoryConflictScarIndex:clamp(toFiniteNumber(source.prehistoryConflictScarIndex, 0.14), 0, 1)
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

    seed.worldStartPresetId = normalizeWorldStartPresetId(source.worldStartPresetId, normalizeWorldStartPresetId(seed.worldStartPresetId, DEFAULT_WORLD_START_PRESET_ID));
    seed.worldStartYear = Math.max(0, toInteger(source.worldStartYear, Math.max(0, toInteger(seed.worldStartYear, LEGACY_WORLD_START_YEAR))));
    seed.prehistoryWealthPressureIndex = clamp(toFiniteNumber(source.prehistoryWealthPressureIndex, toFiniteNumber(seed.prehistoryWealthPressureIndex, 0.32)), 0, 1);
    seed.prehistoryMobilityTrendIndex = clamp(toFiniteNumber(source.prehistoryMobilityTrendIndex, toFiniteNumber(seed.prehistoryMobilityTrendIndex, 0.5)), 0, 1);
    seed.prehistoryConflictScarIndex = clamp(toFiniteNumber(source.prehistoryConflictScarIndex, toFiniteNumber(seed.prehistoryConflictScarIndex, 0.14)), 0, 1);

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
      wagePressure:clamp(toFiniteNumber(source.wagePressure, toFiniteNumber(seed.wagePressure, 0)), -0.45, 0.45),
      laborScarcity:clamp(toFiniteNumber(source.laborScarcity, toFiniteNumber(seed.laborScarcity, 0)), 0, 1),
      longUnemploymentShare:clamp(toFiniteNumber(source.longUnemploymentShare, toFiniteNumber(seed.longUnemploymentShare, 0)), 0, 1),
      talentShortageIndex:clamp(toFiniteNumber(source.talentShortageIndex, toFiniteNumber(seed.talentShortageIndex, 0)), 0, 1),
      mobilityInflowAnnual:Math.max(0, toInteger(source.mobilityInflowAnnual, toInteger(seed.mobilityInflowAnnual, 0))),
      mobilityOutflowAnnual:Math.max(0, toInteger(source.mobilityOutflowAnnual, toInteger(seed.mobilityOutflowAnnual, 0))),
      prevConsumerDemandGU:Math.max(0, toFiniteNumber(source.prevConsumerDemandGU, toFiniteNumber(source.consumerDemandGU, consumerDemand))),
      consumerSpendMultiplier:clamp(toFiniteNumber(source.consumerSpendMultiplier, toFiniteNumber(seed.consumerSpendMultiplier, 0.94)), 0.55, 1.25),
      consumerCostOfLivingPressure:clamp(toFiniteNumber(source.consumerCostOfLivingPressure, toFiniteNumber(seed.consumerCostOfLivingPressure, 1.02)), 0.65, 1.85),
      consumerStressIndex:clamp(toFiniteNumber(source.consumerStressIndex, toFiniteNumber(seed.consumerStressIndex, 0.4)), 0, 1),
      consumerIndustryDemandWeights:normalizeConsumerIndustryDemandWeights(source.consumerIndustryDemandWeights || seed.consumerIndustryDemandWeights),
      housingCostPressure:clamp(toFiniteNumber(source.housingCostPressure, toFiniteNumber(seed.housingCostPressure, 1.02)), 0.65, 2.2),
      housingRentBurden:clamp(toFiniteNumber(source.housingRentBurden, toFiniteNumber(seed.housingRentBurden, 0.34)), 0.08, 0.9),
      housingHomeownershipRate:clamp(toFiniteNumber(source.housingHomeownershipRate, toFiniteNumber(seed.housingHomeownershipRate, 0.52)), 0.05, 0.95),
      housingAffordabilityIndex:clamp(toFiniteNumber(source.housingAffordabilityIndex, toFiniteNumber(seed.housingAffordabilityIndex, 0.52)), 0.05, 1),
      housingPriceGrowth:clamp(toFiniteNumber(source.housingPriceGrowth, toFiniteNumber(seed.housingPriceGrowth, 0.02)), -0.18, 0.26),
      housingMarketStress:clamp(toFiniteNumber(source.housingMarketStress, toFiniteNumber(seed.housingMarketStress, 0.35)), 0, 1.5),
      medianHouseholdWealthGU:Math.max(0, toFiniteNumber(source.medianHouseholdWealthGU, toFiniteNumber(seed.medianHouseholdWealthGU, 0))),
      topOneWealthShare:clamp(toFiniteNumber(source.topOneWealthShare, toFiniteNumber(seed.topOneWealthShare, 0.3)), 0.12, 0.95),
      intergenerationalMobilityIndex:clamp(toFiniteNumber(source.intergenerationalMobilityIndex, toFiniteNumber(seed.intergenerationalMobilityIndex, 0.5)), 0, 1),
      socialUnrestIndex:clamp(toFiniteNumber(source.socialUnrestIndex, toFiniteNumber(seed.socialUnrestIndex, 0.28)), 0, 1.8),
      strikeRiskIndex:clamp(toFiniteNumber(source.strikeRiskIndex, toFiniteNumber(seed.strikeRiskIndex, 0.22)), 0, 1.4),
      populismIndex:clamp(toFiniteNumber(source.populismIndex, toFiniteNumber(seed.populismIndex, 0.24)), 0, 1.6),
      crimeProxyIndex:clamp(toFiniteNumber(source.crimeProxyIndex, toFiniteNumber(seed.crimeProxyIndex, 0.22)), 0, 1.6),
      emigrationPressureIndex:clamp(toFiniteNumber(source.emigrationPressureIndex, toFiniteNumber(seed.emigrationPressureIndex, 0.24)), 0, 1.6),
      institutionalInstabilityIndex:clamp(toFiniteNumber(source.institutionalInstabilityIndex, toFiniteNumber(seed.institutionalInstabilityIndex, 0.2)), 0, 1.6),
      philanthropicCapitalAnnualGU:Math.max(0, toFiniteNumber(source.philanthropicCapitalAnnualGU, toFiniteNumber(seed.philanthropicCapitalAnnualGU, 0))),
      philanthropyImpactIndex:clamp(toFiniteNumber(source.philanthropyImpactIndex, toFiniteNumber(seed.philanthropyImpactIndex, 0)), 0, 1.6),
      legacyProjectsIndex:clamp(toFiniteNumber(source.legacyProjectsIndex, toFiniteNumber(seed.legacyProjectsIndex, 0)), 0, 1.4),
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
      countryISO:normalizeIso(normalizeString(source.countryISO, firstResident ? firstResident.countryISO : "US")),
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
      housingBurdenRatio:clamp(toFiniteNumber(source.housingBurdenRatio, 0.34), 0.08, 1.9),
      housingSavingsPressure:clamp(toFiniteNumber(source.housingSavingsPressure, 0.42), 0.08, 2.2),
      housingOwnershipScore:clamp(toFiniteNumber(source.housingOwnershipScore, 0), 0, 1),
      housingAffordabilityScore:clamp(toFiniteNumber(source.housingAffordabilityScore, 0.52), 0.05, 1),
      inheritancePressureGU:Math.max(0, toFiniteNumber(source.inheritancePressureGU, 0)),
      financialStress:clamp(toFiniteNumber(source.financialStress, 0), 0, 100),
      classTier:normalizeHouseholdTier(source.classTier),
      originClassTier:normalizeHouseholdTier(source.originClassTier || source.classTier),
      mobilityScore:toFiniteNumber(source.mobilityScore, 0),
      assetCashGU:Math.max(0, toFiniteNumber(source.assetCashGU, toFiniteNumber(source.cashOnHandGU, 0))),
      assetEquityGU:Math.max(0, toFiniteNumber(source.assetEquityGU, 0)),
      assetBusinessOwnershipGU:Math.max(0, toFiniteNumber(source.assetBusinessOwnershipGU, 0)),
      assetPropertyGU:Math.max(0, toFiniteNumber(source.assetPropertyGU, 0)),
      assetTrustGU:Math.max(0, toFiniteNumber(source.assetTrustGU, 0)),
      assetDebtObligationsGU:Math.max(0, toFiniteNumber(source.assetDebtObligationsGU, toFiniteNumber(source.debtGU, 0))),
      assetTotalGU:Math.max(0, toFiniteNumber(source.assetTotalGU, 0)),
      assetNetWorthGU:toFiniteNumber(source.assetNetWorthGU, 0),
      assetYieldAnnualGU:toFiniteNumber(source.assetYieldAnnualGU, 0),
      assetReturnRateAnnual:toFiniteNumber(source.assetReturnRateAnnual, 0)
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
    var normalizedType = type === "default" ? "debtCrisis" : type;

    if (App.events && typeof App.events.getCanonicalDefaults === "function") {
      return App.events.getCanonicalDefaults(normalizedType, source || {});
    }

    return {
      category:normalizeString(source && source.category, "structural"),
      scope:normalizeString(source && source.scope, "global"),
      entities:normalizeEventEntities(source && source.entities),
      significance:{
        score:clamp(toFiniteNumber(normalizedType === "debtCrisis" ? 60 : (normalizedType === "bankruptcy" ? 55 : (normalizedType === "hire" ? 18 : 35)), 35), 0, 100),
        tier:inferTierFromScore(normalizedType === "debtCrisis" ? 60 : (normalizedType === "bankruptcy" ? 55 : (normalizedType === "hire" ? 18 : 35))),
        dimensions:normalizeSignificanceDimensions(null, null),
        adaptiveBoost:0,
        baseFloor:clamp(toFiniteNumber(normalizedType === "debtCrisis" ? 60 : (normalizedType === "bankruptcy" ? 55 : (normalizedType === "hire" ? 18 : 35)), 35), 0, 100)
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
        isoToBloc[normalizeIso(iso)] = bloc.id;
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
    person.countryISO = normalizeIso(normalizeString(person.countryISO, "US"));
    person.state = normalizeString(person.state, null);
    person.subdivision = normalizeString(person.subdivision, person.state);
    person.city = normalizeString(person.city, null);
    person.birthCity = normalizeString(person.birthCity, person.city);
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
    person.formerSpouseIds = normalizeStringArray(person.formerSpouseIds).filter(function(id){
      return id !== person.id;
    });
    person.parentIds = normalizeStringArray(person.parentIds).filter(function(id){
      return id !== person.id;
    });
    person.childrenIds = normalizeStringArray(person.childrenIds).filter(function(id){
      return id !== person.id;
    });
    person.estrangedChildIds = normalizeStringArray(person.estrangedChildIds).filter(function(id){
      return id !== person.id;
    });
    person.estrangedParentIds = normalizeStringArray(person.estrangedParentIds).filter(function(id){
      return id !== person.id;
    });
    person.nonMaritalChildIds = normalizeStringArray(person.nonMaritalChildIds).filter(function(id){
      return id !== person.id;
    });
    person.birthUnionType = normalizeString(person.birthUnionType, "marital");
    if (person.birthUnionType !== "non_marital") {
      person.birthUnionType = "marital";
    }
    person.groomedForBusinessById = normalizeString(person.groomedForBusinessById, null);
    person.inheritanceDilution = Math.max(1, toInteger(person.inheritanceDilution, 1));
    person.lifetimeInheritedGU = Math.max(0, toFiniteNumber(person.lifetimeInheritedGU, 0));
    person.inheritanceTransferCount = Math.max(0, toInteger(person.inheritanceTransferCount, 0));
    person.lastInheritanceDay = person.lastInheritanceDay == null ? null : Math.max(0, toInteger(person.lastInheritanceDay, null));
    person.sharedPrivilege = clamp(toFiniteNumber(person.sharedPrivilege, 0), 0, 100);
    person.siblingRivalry = clamp(toFiniteNumber(person.siblingRivalry, 0), 0, 100);
    person.mentorId = normalizeString(person.mentorId, null);
    if (person.mentorId === person.id) person.mentorId = null;
    person.rivalIds = normalizeStringArray(person.rivalIds).filter(function(id){ return id !== person.id; });
    person.closeFriendIds = normalizeStringArray(person.closeFriendIds).filter(function(id){ return id !== person.id; });
    person.eliteCircleIds = normalizeStringArray(person.eliteCircleIds).filter(function(id){ return id !== person.id; });
    person.schoolTieIds = normalizeStringArray(person.schoolTieIds).filter(function(id){ return id !== person.id; });
    person.nepotismTieIds = normalizeStringArray(person.nepotismTieIds).filter(function(id){ return id !== person.id; });
    person.advisorBusinessIds = normalizeStringArray(person.advisorBusinessIds).slice(0, 4);
    person.boardBusinessIds = normalizeStringArray(person.boardBusinessIds).slice(0, 4);
    person.retirementType = normalizeString(person.retirementType, null);
    person.retirementInfluence = clamp(toFiniteNumber(person.retirementInfluence, 0), 0, 100);
    person.workerLifecycleStage = normalizeString(person.workerLifecycleStage, null);
    if (["child","student","worker","manager","executive","founder","professional","dependent","retiree","deceased"].indexOf(person.workerLifecycleStage) === -1) {
      person.workerLifecycleStage = null;
    }
    person.occupationCategory = normalizeString(person.occupationCategory, null);
    if (["factory_worker","engineer","accountant","sales","operator","executive","owner","investor","unemployed","dependent","deceased"].indexOf(person.occupationCategory) === -1) {
      person.occupationCategory = null;
    }
    person.personalReputation = person.personalReputation && typeof person.personalReputation === "object" ? {
      trust:clamp(toFiniteNumber(person.personalReputation.trust, 50), 0, 100),
      prestige:clamp(toFiniteNumber(person.personalReputation.prestige, 35), 0, 100),
      notoriety:clamp(toFiniteNumber(person.personalReputation.notoriety, 12), 0, 100),
      scandalMemory:clamp(toFiniteNumber(person.personalReputation.scandalMemory, 0), 0, 100)
    } : {
      trust:50,
      prestige:35,
      notoriety:12,
      scandalMemory:0
    };
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
    person.workExperienceYears = clamp(toFiniteNumber(person.workExperienceYears, 0), 0, 60);
    person.unemploymentStreakDays = Math.max(0, toInteger(person.unemploymentStreakDays, 0));
    person.lastEmployedDay = person.lastEmployedDay == null ? null : Math.max(0, toInteger(person.lastEmployedDay, 0));
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
    business.countryISO = normalizeIso(normalizeString(business.countryISO, "US"));
    business.hqCity = normalizeString(business.hqCity, null);
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
    merged.members = normalizeStringArray(
      (merged.members && merged.members.length ? merged.members : []).concat(template ? template.members : [])
    );
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
    migratedState.stockMarket = normalizeStockMarketState(previousState.stockMarket, migratedState.businesses, migratedState.people, migratedState.simDay);
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

    migratedState.stockMarket = normalizeStockMarketState(previousState.stockMarket, migratedState.businesses, migratedState.people, migratedState.simDay);
    migratedState.tier6SanctionLanes = normalizeTier6SanctionLanes(previousState.tier6SanctionLanes, migratedState.blocs);
    sanitizeResidencyUnsupportedCountries(migratedState);

    return buildSnapshotEnvelope(snapshot, 11, migratedState, resolveSnapshotBusinessNamingMode(snapshot, "legacy") || "legacy");
  }

  function migrateSnapshotToV12(snapshot){
    var previousState = snapshot.state || {};
    var migratedState = deepClone(previousState);
    var startYear = Math.max(0, toInteger(previousState.startYear, LEGACY_WORLD_START_YEAR));
    var yearDays = getYearDays();

    migratedState.startPresetId = normalizeWorldStartPresetId(previousState.startPresetId, startYear === 1998 ? "1998" : DEFAULT_WORLD_START_PRESET_ID);
    migratedState.startYear = startYear;
    migratedState.people = (Array.isArray(migratedState.people) ? migratedState.people : []).map(function(person){
      var next = deepClone(person || {});
      var relativeYear = toInteger(next.lastLifeEventYear, Math.floor(Math.max(0, toInteger(migratedState.simDay, 0)) / Math.max(1, yearDays)));

      next.lastLifeEventYear = relativeYear + startYear;
      return next;
    });
    migratedState.countryProfiles = normalizeCountryProfiles(previousState.countryProfiles, migratedState.blocs, migratedState.businesses, {
      injectBusinessHeadcount:false
    });
    Object.keys(migratedState.countryProfiles || {}).forEach(function(iso){
      var profile = migratedState.countryProfiles[iso];

      if (!profile) return;
      profile.worldStartPresetId = normalizeWorldStartPresetId(profile.worldStartPresetId, migratedState.startPresetId);
      profile.worldStartYear = Math.max(0, toInteger(profile.worldStartYear, migratedState.startYear));
    });

    return buildSnapshotEnvelope(snapshot, 12, migratedState, resolveSnapshotBusinessNamingMode(snapshot, "legacy") || "legacy");
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
    App.store.startPresetId = normalizeWorldStartPresetId(state.startPresetId, DEFAULT_WORLD_START_PRESET_ID);
    App.store.startYear = Math.max(0, toInteger(state.startYear, LEGACY_WORLD_START_YEAR));
    if (App.data && App.data.CALENDAR) {
      App.data.CALENDAR.startYear = App.store.startYear;
    }
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
    App.store.tier6SanctionLanes = normalizeTier6SanctionLanes(state.tier6SanctionLanes, App.store.blocs);
    App.store.governor = normalizeGovernorState(state.governor);
    App.store.stockMarket = normalizeStockMarketState(state.stockMarket, App.store.businesses, App.store.people, simDay);
    App.store.yearlyTuningTelemetry = deepClone(state.yearlyTuningTelemetry || []);
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
      startPresetId:normalizeWorldStartPresetId(App.store.startPresetId, DEFAULT_WORLD_START_PRESET_ID),
      startYear:Math.max(0, toInteger(App.store.startYear, LEGACY_WORLD_START_YEAR)),
      selectedBlocId:App.store.selectedBlocId,
      selection:deepClone(App.store.selection || { type:null, id:null }),
      simSpeed:App.store.simSpeed,
      simDay:App.store.simDay,
      accumulator:App.store.accumulator,
      countryNames:deepClone(App.store.countryNames || {}),
      countryData:deepClone(App.store.countryData || {}),
      countryProfiles:deepClone(App.store.countryProfiles || {}),
      tier6SanctionLanes:normalizeTier6SanctionLanes(App.store.tier6SanctionLanes, App.store.blocs),
      governor:normalizeGovernorState(App.store.governor),
      stockMarket:deepClone(App.store.stockMarket || {}),
      yearlyTuningTelemetry:deepClone(App.store.yearlyTuningTelemetry || [])
    };
    var migrated = migrateSnapshot({
      schemaVersion:SCHEMA_VERSION,
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

  function isValidSlotIndex(slotIndex){
    var normalized = toInteger(slotIndex, 0);
    return normalized >= 1 && normalized <= SAVE_SLOT_COUNT;
  }

  function getSlotKey(slotIndex){
    return SAVE_SLOT_KEY_PREFIX + String(toInteger(slotIndex, 0));
  }

  function sanitizeSlotName(name, fallback){
    var clean = normalizeString(name, null);
    if (!clean) return fallback;
    return clean.slice(0, 64);
  }

  function saveToSlot(slotIndex, name){
    var snapshot;
    var normalizedSlot = toInteger(slotIndex, 0);

    if (!canUseStorage()) {
      return { ok:false, error:"localStorage is unavailable in this environment." };
    }
    if (!isValidSlotIndex(normalizedSlot)) {
      return { ok:false, error:"Invalid slot index. Expected 1-" + SAVE_SLOT_COUNT + "." };
    }

    try {
      snapshot = exportSnapshot();
      snapshot.saveSlot = normalizedSlot;
      snapshot.saveName = sanitizeSlotName(name, "Slot " + normalizedSlot);
      snapshot.savedAtISO = new Date().toISOString();
      global.localStorage.setItem(getSlotKey(normalizedSlot), JSON.stringify(snapshot));
      return { ok:true, slotIndex:normalizedSlot, snapshot:snapshot };
    } catch (error) {
      return { ok:false, error:error && error.message ? error.message : "Failed to save slot snapshot." };
    }
  }

  function loadFromSlot(slotIndex){
    var normalizedSlot = toInteger(slotIndex, 0);
    var raw;
    var parsed;
    var imported;

    if (!canUseStorage()) {
      return { ok:false, error:"localStorage is unavailable in this environment." };
    }
    if (!isValidSlotIndex(normalizedSlot)) {
      return { ok:false, error:"Invalid slot index. Expected 1-" + SAVE_SLOT_COUNT + "." };
    }

    raw = global.localStorage.getItem(getSlotKey(normalizedSlot));
    if (!raw) {
      return { ok:false, reason:"empty" };
    }

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return { ok:false, error:"Saved slot JSON is corrupted." };
    }

    imported = importSnapshot(parsed);
    if (!imported.ok) {
      return imported;
    }

    return {
      ok:true,
      slotIndex:normalizedSlot,
      fromVersion:imported.fromVersion,
      toVersion:imported.toVersion,
      snapshot:imported.snapshot
    };
  }

  function deleteSlot(slotIndex){
    var normalizedSlot = toInteger(slotIndex, 0);

    if (!canUseStorage()) {
      return { ok:false, error:"localStorage is unavailable in this environment." };
    }
    if (!isValidSlotIndex(normalizedSlot)) {
      return { ok:false, error:"Invalid slot index. Expected 1-" + SAVE_SLOT_COUNT + "." };
    }

    global.localStorage.removeItem(getSlotKey(normalizedSlot));
    return { ok:true, slotIndex:normalizedSlot };
  }

  function listSlots(){
    var slots = [];
    var i;

    for (i = 1; i <= SAVE_SLOT_COUNT; i += 1) {
      var raw;
      var parsed;
      var savedAt;
      var day;
      var name;

      if (!canUseStorage()) {
        return [];
      }

      raw = global.localStorage.getItem(getSlotKey(i));
      if (!raw) {
        slots.push({ slotIndex:i, exists:false, name:"", savedAtISO:null, day:null });
        continue;
      }

      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        slots.push({ slotIndex:i, exists:true, name:"Corrupted Slot", savedAtISO:null, day:null, corrupted:true });
        continue;
      }

      savedAt = normalizeString(parsed && parsed.savedAtISO, null);
      day = toInteger(parsed && parsed.state && parsed.state.simDay, null);
      name = sanitizeSlotName(parsed && parsed.saveName, "Slot " + i);
      slots.push({
        slotIndex:i,
        exists:true,
        name:name,
        savedAtISO:savedAt,
        day:day,
        schemaVersion:toInteger(parsed && parsed.schemaVersion, null),
        corrupted:false
      });
    }

    return slots;
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
  registerSnapshotMigration(12, migrateSnapshotToV12);

  App.persistence = {
    SAVE_KEY:SAVE_KEY,
    SAVE_SLOT_KEY_PREFIX:SAVE_SLOT_KEY_PREFIX,
    SAVE_SLOT_COUNT:SAVE_SLOT_COUNT,
    SCHEMA_VERSION:SCHEMA_VERSION,
    AUTOSAVE_INTERVAL_DAYS:AUTOSAVE_INTERVAL_DAYS,
    exportSnapshot:exportSnapshot,
    importSnapshot:importSnapshot,
    saveNow:saveNow,
    saveToSlot:saveToSlot,
    restoreLatest:restoreLatest,
    loadFromSlot:loadFromSlot,
    clearLatest:clearLatest,
    deleteSlot:deleteSlot,
    listSlots:listSlots,
    hasSnapshot:hasSnapshot,
    autoCheckpoint:autoCheckpoint,
    migrateSnapshot:migrateSnapshot,
    registerSnapshotMigration:registerSnapshotMigration,
    registerEntityMigration:registerEntityMigration
  };
})(window);
