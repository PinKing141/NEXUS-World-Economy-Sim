(function(global){
  var App = global.Nexus || (global.Nexus = {});
  var MAX_EVENT_HISTORY = 2000;
  var MAX_FEED_ITEMS = 100;
  var MAX_CAUSES = 6;
  var LOOKBACK_DAYS = 120;
  var WINDOW_DAYS = 30;
  var NOTABLE_LIMIT_PER_WINDOW = 3;

  var BASE_FLOOR_BY_TYPE = {
    "default":60,
    debtCrisis:60,
    bankruptcy:55,
    inheritance:50,
    death:45,
    ipo:50,
    scandal:48,
    tariff:45,
    deal:40,
    launch:38,
    market:35,
    retirement:32,
    birth:30,
    marriage:30,
    divorce:34,
    estrangement:36,
    hire:18
  };

  var CATEGORY_BY_TYPE = {
    bankruptcy:"structural",
    default:"structural",
    debtCrisis:"structural",
    tariff:"structural",
    market:"structural",
    ipo:"structural",
    scandal:"structural",
    deal:"structural",
    hire:"structural",
    launch:"human",
    marriage:"human",
    divorce:"human",
    estrangement:"human",
    birth:"human",
    retirement:"human",
    inheritance:"human",
    death:"human"
  };

  var DEFAULT_DIMENSIONS = {
    impact:0.35,
    rarity:0.35,
    legacy:0.25,
    crossGen:0.20
  };

  var DIMENSIONS_BY_TYPE = {
    "default":{ impact:0.88, rarity:0.62, legacy:0.78, crossGen:0.52 },
    debtCrisis:{ impact:0.88, rarity:0.62, legacy:0.78, crossGen:0.52 },
    bankruptcy:{ impact:0.70, rarity:0.58, legacy:0.62, crossGen:0.36 },
    inheritance:{ impact:0.62, rarity:0.50, legacy:0.76, crossGen:0.78 },
    death:{ impact:0.54, rarity:0.42, legacy:0.62, crossGen:0.70 },
    ipo:{ impact:0.66, rarity:0.64, legacy:0.56, crossGen:0.28 },
    scandal:{ impact:0.60, rarity:0.52, legacy:0.48, crossGen:0.24 },
    tariff:{ impact:0.62, rarity:0.55, legacy:0.44, crossGen:0.24 },
    deal:{ impact:0.44, rarity:0.36, legacy:0.26, crossGen:0.10 },
    launch:{ impact:0.40, rarity:0.33, legacy:0.30, crossGen:0.26 },
    market:{ impact:0.44, rarity:0.44, legacy:0.26, crossGen:0.12 },
    retirement:{ impact:0.32, rarity:0.28, legacy:0.44, crossGen:0.56 },
    birth:{ impact:0.30, rarity:0.26, legacy:0.52, crossGen:0.82 },
    marriage:{ impact:0.30, rarity:0.24, legacy:0.46, crossGen:0.58 },
    divorce:{ impact:0.38, rarity:0.30, legacy:0.50, crossGen:0.66 },
    estrangement:{ impact:0.42, rarity:0.34, legacy:0.56, crossGen:0.74 },
    hire:{ impact:0.20, rarity:0.16, legacy:0.08, crossGen:0.02 }
  };

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function toFinite(value, fallback){
    var numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function normalizeString(value, fallback){
    if (typeof value !== "string") return fallback;
    value = value.trim();
    return value ? value : fallback;
  }

  function uniqueStrings(values, limit){
    var seen = {};

    return (Array.isArray(values) ? values : []).map(function(value){
      return normalizeString(value, null);
    }).filter(function(value){
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    }).slice(0, limit || 8);
  }

  function normalizeEntities(entities){
    var source = entities && typeof entities === "object" ? entities : {};
    return {
      personIds:uniqueStrings(source.personIds || source.people, 8),
      businessIds:uniqueStrings(source.businessIds || source.businesses, 8),
      countryIsos:uniqueStrings(source.countryIsos || source.countries, 8),
      blocIds:uniqueStrings(source.blocIds || source.blocs, 8)
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

  function normalizeCauses(causes, limit){
    var seen = {};
    var list = Array.isArray(causes) ? causes : (causes ? [causes] : []);

    return list.map(normalizeCauseEntry).filter(function(entry){
      var key;
      if (!entry) return false;
      key = [entry.eventId || "", entry.kind || "", entry.text || ""].join("|");
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, limit || MAX_CAUSES);
  }

  function normalizeDimensions(dimensions, fallback){
    var source = dimensions && typeof dimensions === "object" ? dimensions : {};
    var seed = fallback || DEFAULT_DIMENSIONS;
    return {
      impact:clamp(toFinite(source.impact, seed.impact), 0, 1),
      rarity:clamp(toFinite(source.rarity, seed.rarity), 0, 1),
      legacy:clamp(toFinite(source.legacy, seed.legacy), 0, 1),
      crossGen:clamp(toFinite(source.crossGen, seed.crossGen), 0, 1)
    };
  }

  function inferCategory(type, meta){
    if (meta && meta.category) return normalizeString(meta.category, "structural");
    return CATEGORY_BY_TYPE[type] || "structural";
  }

  function inferScope(type, entities, meta){
    if (meta && meta.scope) return normalizeString(meta.scope, "global");
    if (entities.personIds.length && entities.businessIds.length) return "person";
    if (entities.personIds.length) return "person";
    if (entities.businessIds.length) return "business";
    if (entities.countryIsos.length === 1) return "country";
    if (entities.countryIsos.length > 1) return "global";
    if (entities.blocIds.length === 1) return "bloc";
    if (entities.blocIds.length > 1) return "global";
    if (type === "marriage" || type === "divorce" || type === "estrangement" || type === "birth" || type === "inheritance" || type === "death") return "family";
    return "global";
  }

  function inferDimensions(type, meta, entities){
    var fallback = DIMENSIONS_BY_TYPE[type] || DEFAULT_DIMENSIONS;
    var dimensions = normalizeDimensions(meta && meta.significanceDimensions, fallback);

    if (meta && meta.controlTransfer) {
      dimensions.legacy = Math.max(dimensions.legacy, 0.72);
      dimensions.crossGen = Math.max(dimensions.crossGen, 0.74);
    }

    if (type === "death" && ((meta && (meta.founderBusinessId || meta.ownerBusinessId)) || entities.businessIds.length)) {
      dimensions.impact = Math.max(dimensions.impact, 0.62);
      dimensions.legacy = Math.max(dimensions.legacy, 0.70);
    }

    return dimensions;
  }

  function getBaseFloor(type, meta, entities){
    var floor = BASE_FLOOR_BY_TYPE.hasOwnProperty(type) ? BASE_FLOOR_BY_TYPE[type] : BASE_FLOOR_BY_TYPE.default;

    if (type === "inheritance" && meta && meta.controlTransfer) {
      floor = Math.max(floor, 55);
    }

    if (type === "death" && ((meta && (meta.founderBusinessId || meta.ownerBusinessId)) || entities.businessIds.length)) {
      floor = Math.max(floor, 55);
    }

    return clamp(floor, 0, 100);
  }

  function computeRawScore(dimensions){
    return clamp(
      100 * (
        (0.45 * dimensions.impact) +
        (0.20 * dimensions.rarity) +
        (0.20 * dimensions.legacy) +
        (0.15 * dimensions.crossGen)
      ),
      0,
      100
    );
  }

  function getTier(score){
    if (score >= 75) return "critical";
    if (score >= 55) return "major";
    if (score >= 30) return "notable";
    return "routine";
  }

  function buildSignificance(type, meta, entities, options){
    var dimensions = inferDimensions(type, meta || {}, entities || normalizeEntities(null));
    var baseFloor = getBaseFloor(type, meta || {}, entities || normalizeEntities(null));
    var scoreRaw = computeRawScore(dimensions);
    var scoreBeforeBoost = Math.max(scoreRaw, baseFloor);
    var adaptiveBoost = clamp(toFinite(options && options.adaptiveBoost, 0), 0, 10);
    var score = clamp(scoreBeforeBoost + adaptiveBoost, 0, 100);

    return {
      score:Math.round(score * 10) / 10,
      tier:getTier(score),
      dimensions:dimensions,
      adaptiveBoost:adaptiveBoost,
      baseFloor:baseFloor
    };
  }

  function getCanonicalDefaults(type, meta){
    var safeType = normalizeString(type, "market");
    var safeMeta = meta && typeof meta === "object" ? meta : {};
    var entities = normalizeEntities(safeMeta.entities);

    return {
      type:safeType,
      category:inferCategory(safeType, safeMeta),
      scope:inferScope(safeType, entities, safeMeta),
      entities:entities,
      significance:buildSignificance(safeType, safeMeta, entities, {
        adaptiveBoost:toFinite(safeMeta.adaptiveBoost, 0)
      })
    };
  }

  function percentile(values, ratio){
    var sorted;
    var index;
    var lowerIndex;
    var upperIndex;
    var weight;

    if (!values || !values.length) return 0;
    sorted = values.slice().sort(function(first, second){
      return first - second;
    });
    if (sorted.length === 1) return sorted[0];
    index = clamp(ratio, 0, 1) * (sorted.length - 1);
    lowerIndex = Math.floor(index);
    upperIndex = Math.ceil(index);
    if (lowerIndex === upperIndex) return sorted[lowerIndex];
    weight = index - lowerIndex;
    return sorted[lowerIndex] + ((sorted[upperIndex] - sorted[lowerIndex]) * weight);
  }

  function getWindowStart(day){
    var safeDay = Math.max(0, Math.floor(toFinite(day, 0)));
    return safeDay - (safeDay % WINDOW_DAYS);
  }

  function makeEventId(store){
    store.eventSeq = Math.max(0, Math.floor(toFinite(store.eventSeq, 0))) + 1;
    return "evt-" + store.eventSeq;
  }

  function ensureStoreState(){
    if (!App.store) return null;
    if (!Array.isArray(App.store.newsItems)) App.store.newsItems = [];
    if (!Array.isArray(App.store.eventHistory)) App.store.eventHistory = [];
    if (!App.store.eventWindowStats || typeof App.store.eventWindowStats !== "object") App.store.eventWindowStats = {};
    if (!Number.isFinite(Number(App.store.eventSeq))) App.store.eventSeq = 0;
    if (App.store.pauseReasonEventId === undefined) App.store.pauseReasonEventId = null;
    return App.store;
  }

  function getRecentScores(store, day){
    var minDay = Math.max(0, day - LOOKBACK_DAYS);
    return store.eventHistory.filter(function(item){
      return item && Number(item.day) >= minDay && item.significance && Number.isFinite(Number(item.significance.score));
    }).map(function(item){
      return Number(item.significance.score);
    });
  }

  function getAdaptiveBoost(store, day, scoreBeforeBoost){
    var recentScores = getRecentScores(store, day);
    var p80;
    var p95;

    if (recentScores.length < 10) return 0;
    p80 = percentile(recentScores, 0.80);
    p95 = percentile(recentScores, 0.95);

    if (scoreBeforeBoost > p95) return 10;
    if (scoreBeforeBoost > p80) return 5;
    return 0;
  }

  function pruneWindowStats(store, day){
    var minWindowStart = getWindowStart(Math.max(0, day - 360));
    Object.keys(store.eventWindowStats || {}).forEach(function(key){
      if (Number(key) < minWindowStart) {
        delete store.eventWindowStats[key];
      }
    });
  }

  function getWindowStats(store, day){
    var windowStart = getWindowStart(day);
    var key = String(windowStart);

    pruneWindowStats(store, day);

    if (!store.eventWindowStats[key]) {
      store.eventWindowStats[key] = {
        notableShown:0,
        rollups:{}
      };
    }

    return {
      key:key,
      start:windowStart,
      stats:store.eventWindowStats[key]
    };
  }

  function inferEntityAnchor(entities, meta){
    if (meta && meta.rollupAnchor) return normalizeString(meta.rollupAnchor, "global");
    return entities.businessIds[0] || entities.personIds[0] || entities.countryIsos[0] || entities.blocIds[0] || "global";
  }

  function makeRollupKey(type, scope, entities, meta){
    if (meta && meta.rollupKey) return normalizeString(meta.rollupKey, type + "|" + scope + "|global");
    return [type, scope, inferEntityAnchor(entities, meta)].join("|");
  }

  function getRollupLabel(event){
    var entities = event.entities || {};
    var people = entities.personIds || [];
    var businesses = entities.businessIds || [];
    var countries = entities.countryIsos || [];
    var blocs = entities.blocIds || [];

    if (businesses.length) return businesses[0];
    if (people.length) return people[0];
    if (countries.length) return countries[0];
    if (blocs.length) return blocs[0];
    return event.scope || "global";
  }

  function extractRollupLabel(text){
    var match = String(text || "").match(/\(([^()]+)\)\.?\s*$/);
    return match ? normalizeString(match[1], null) : null;
  }

  function makeRollupId(windowKey, rollupKey){
    return "rollup-" + windowKey + "-" + rollupKey.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function buildRollupFeedItem(event, windowKey, bucket){
    var count = Math.max(1, bucket.count || 1);
    var label = bucket.label || getRollupLabel(event);
    var plural = count === 1 ? "update" : "updates";
    var text = count + " routine " + event.type.toUpperCase() + " " + plural + " (" + label + ").";

    return {
      id:makeRollupId(windowKey, event.pacing.rollupKey || event.type),
      day:event.day,
      time:event.time,
      type:event.type,
      text:text,
      tags:["rollup", "routine"],
      category:event.category,
      scope:event.scope,
      entities:event.entities,
      causes:[],
      significance:{
        score:Math.min(29, Math.round((event.significance && event.significance.score) || 20)),
        tier:"routine",
        dimensions:normalizeDimensions(event.significance && event.significance.dimensions, DEFAULT_DIMENSIONS),
        adaptiveBoost:0,
        baseFloor:0
      },
      pacing:{
        displayed:true,
        mode:"rollup",
        rollupKey:event.pacing.rollupKey || "",
        suppressedCount:count
      },
      synthetic:true
    };
  }

  function pushEventHistory(store, event){
    store.eventHistory.unshift(event);
    if (store.eventHistory.length > MAX_EVENT_HISTORY) {
      store.eventHistory.pop();
    }
  }

  function getFeedRank(item){
    var tier = item && item.significance ? item.significance.tier : null;
    var mode = item && item.pacing ? item.pacing.mode : "direct";

    if (mode === "rollup") return 3;
    if (tier === "critical") return 0;
    if (tier === "major") return 1;
    if (tier === "notable") return 2;
    return 3;
  }

  function findFeedInsertIndex(items, item){
    var rank = getFeedRank(item);
    var i;

    for (i = 0; i < items.length; i += 1) {
      if (rank <= getFeedRank(items[i])) {
        return i;
      }
    }

    return items.length;
  }

  function upsertFeedItem(store, item){
    var existingIndex;
    var insertIndex;

    if (!item) return;
    existingIndex = (store.newsItems || []).findIndex(function(existing){
      return existing && existing.id && item.id && existing.id === item.id;
    });

    if (existingIndex >= 0) {
      if (item.pacing && item.pacing.mode === "rollup") {
        store.newsItems.splice(existingIndex, 1, item);
      } else {
        store.newsItems.splice(existingIndex, 1);
        insertIndex = findFeedInsertIndex(store.newsItems, item);
        store.newsItems.splice(insertIndex, 0, item);
      }
    } else {
      insertIndex = findFeedInsertIndex(store.newsItems, item);
      store.newsItems.splice(insertIndex, 0, item);
    }

    if (store.newsItems.length > MAX_FEED_ITEMS) {
      store.newsItems.length = MAX_FEED_ITEMS;
    }
  }

  function emit(type, text, meta){
    var store = ensureStoreState();
    var day;
    var safeMeta;
    var defaults;
    var causes;
    var tags;
    var adaptiveBoost;
    var significance;
    var window;
    var pacing;
    var event;
    var rollupBucket;
    var rollupItem;

    if (!store) return null;
    day = Math.max(0, Math.floor(toFinite(store.simDay, 0)));
    safeMeta = meta && typeof meta === "object" ? meta : {};
    defaults = getCanonicalDefaults(type, safeMeta);
    text = normalizeString(text, "");
    if (!text) return null;

    causes = normalizeCauses(safeMeta.causes, MAX_CAUSES);
    tags = uniqueStrings(safeMeta.tags, 3);
    significance = defaults.significance;
    adaptiveBoost = getAdaptiveBoost(store, day, Math.max(computeRawScore(significance.dimensions), significance.baseFloor));
    significance = buildSignificance(defaults.type, safeMeta, defaults.entities, {
      adaptiveBoost:adaptiveBoost
    });
    window = getWindowStats(store, day);

    pacing = {
      displayed:false,
      mode:"suppressed",
      rollupKey:null,
      suppressedCount:0
    };

    if (significance.tier === "major" || significance.tier === "critical") {
      pacing.displayed = true;
      pacing.mode = "direct";
    } else if (significance.tier === "notable") {
      if ((window.stats.notableShown || 0) < NOTABLE_LIMIT_PER_WINDOW) {
        window.stats.notableShown = (window.stats.notableShown || 0) + 1;
        pacing.displayed = true;
        pacing.mode = "direct";
      } else {
        pacing.mode = "queued";
      }
    } else {
      pacing.mode = "rollup";
      pacing.rollupKey = makeRollupKey(defaults.type, defaults.scope, defaults.entities, safeMeta);
    }

    event = {
      id:makeEventId(store),
      day:day,
      time:App.utils && App.utils.fmtDay ? App.utils.fmtDay(day) : String(day),
      type:defaults.type,
      text:text,
      tags:tags,
      category:defaults.category,
      scope:defaults.scope,
      entities:defaults.entities,
      causes:causes,
      significance:significance,
      pacing:pacing
    };

    pushEventHistory(store, event);

    if (pacing.displayed && pacing.mode === "direct") {
      if (App.ui && App.ui.addNews) {
        App.ui.addNews(event);
      } else {
        upsertFeedItem(store, event);
      }
    } else if (pacing.mode === "rollup") {
      rollupBucket = window.stats.rollups[pacing.rollupKey] || {
        count:0,
        label:normalizeString(safeMeta.rollupLabel, null)
      };
      rollupBucket.count += 1;
      if (!rollupBucket.label) {
        rollupBucket.label = normalizeString(safeMeta.rollupLabel, null);
      }
      window.stats.rollups[pacing.rollupKey] = rollupBucket;
      rollupItem = buildRollupFeedItem(event, window.key, rollupBucket);
      if (App.ui && App.ui.addNews) {
        App.ui.addNews(rollupItem);
      } else {
        upsertFeedItem(store, rollupItem);
      }
    }

    if (significance.tier === "critical") {
      store.pauseReasonEventId = event.id;
      if (App.store.setSimSpeed) {
        App.store.setSimSpeed(0);
      } else {
        App.store.simSpeed = 0;
      }
    }

    return event;
  }

  function rehydrateFromStore(){
    var store = ensureStoreState();
    var previousWindowStats;
    var existingRollupCounts = {};

    if (!store) return;

    store.eventHistory = (Array.isArray(store.eventHistory) ? store.eventHistory : []).filter(function(item){
      return !!(item && item.id && item.type && item.text);
    }).slice(0, MAX_EVENT_HISTORY);

    previousWindowStats = store.eventWindowStats && typeof store.eventWindowStats === "object" ? store.eventWindowStats : {};

    (Array.isArray(store.newsItems) ? store.newsItems : []).forEach(function(item){
      var windowKey;
      var rollupKey;
      if (!item || !item.pacing || item.pacing.mode !== "rollup") return;
      windowKey = String(getWindowStart(item.day));
      rollupKey = item.pacing.rollupKey || (item.type + "|global|global");
      if (!existingRollupCounts[windowKey]) existingRollupCounts[windowKey] = {};
      existingRollupCounts[windowKey][rollupKey] = {
        count:Math.max(1, Math.floor(toFinite(item.pacing.suppressedCount, 1))),
        label:extractRollupLabel(item.text)
      };
    });

    store.eventWindowStats = {};
    store.eventHistory.forEach(function(item){
      var windowKey;
      var windowStats;
      var rollupKey;
      var previousBucket;
      var feedBucket;
      var bucket;

      if (!item || !item.significance || !item.pacing) return;
      windowKey = String(getWindowStart(item.day));
      if (!store.eventWindowStats[windowKey]) {
        store.eventWindowStats[windowKey] = { notableShown:0, rollups:{} };
      }
      windowStats = store.eventWindowStats[windowKey];

      if (item.significance.tier === "notable" && item.pacing.displayed) {
        windowStats.notableShown += 1;
      }

      if (item.pacing.mode !== "rollup") return;

      rollupKey = item.pacing.rollupKey || makeRollupKey(item.type, item.scope || "global", normalizeEntities(item.entities), {});
      previousBucket = previousWindowStats[windowKey] && previousWindowStats[windowKey].rollups ? previousWindowStats[windowKey].rollups[rollupKey] : null;
      feedBucket = existingRollupCounts[windowKey] ? existingRollupCounts[windowKey][rollupKey] : null;
      bucket = windowStats.rollups[rollupKey] || {
        count:0,
        label:normalizeString(previousBucket && previousBucket.label, normalizeString(feedBucket && feedBucket.label, null))
      };
      bucket.count += 1;
      windowStats.rollups[rollupKey] = bucket;
    });

    Object.keys(previousWindowStats).forEach(function(windowKey){
      var previous = previousWindowStats[windowKey] || {};
      if (!store.eventWindowStats[windowKey]) {
        store.eventWindowStats[windowKey] = { notableShown:0, rollups:{} };
      }

      store.eventWindowStats[windowKey].notableShown = Math.max(
        store.eventWindowStats[windowKey].notableShown || 0,
        Math.max(0, Math.floor(toFinite(previous.notableShown, 0)))
      );

      Object.keys(previous.rollups || {}).forEach(function(rollupKey){
        var previousBucket = previous.rollups[rollupKey] || {};
        var existing = store.eventWindowStats[windowKey].rollups[rollupKey] || {
          count:0,
          label:null
        };

        existing.count = Math.max(existing.count || 0, Math.max(0, Math.floor(toFinite(previousBucket.count, 0))));
        existing.label = existing.label || normalizeString(previousBucket.label, null);
        store.eventWindowStats[windowKey].rollups[rollupKey] = existing;
      });
    });

    Object.keys(existingRollupCounts).forEach(function(windowKey){
      if (!store.eventWindowStats[windowKey]) {
        store.eventWindowStats[windowKey] = { notableShown:0, rollups:{} };
      }

      Object.keys(existingRollupCounts[windowKey]).forEach(function(rollupKey){
        var feedBucket = existingRollupCounts[windowKey][rollupKey] || {};
        var existing = store.eventWindowStats[windowKey].rollups[rollupKey] || {
          count:0,
          label:null
        };

        existing.count = Math.max(existing.count || 0, Math.max(0, Math.floor(toFinite(feedBucket.count, 0))));
        existing.label = existing.label || normalizeString(feedBucket.label, null);
        store.eventWindowStats[windowKey].rollups[rollupKey] = existing;
      });
    });

    if (!Number.isFinite(Number(store.eventSeq)) || store.eventSeq <= 0) {
      store.eventSeq = store.eventHistory.reduce(function(max, item){
        var suffix = Number(String(item && item.id || "").replace("evt-", ""));
        return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
      }, 0);
    }
  }

  App.events = {
    emit:emit,
    rehydrateFromStore:rehydrateFromStore,
    buildSignificance:buildSignificance,
    getCanonicalDefaults:getCanonicalDefaults,
    getTier:getTier,
    normalizeCauses:normalizeCauses
  };
})(window);
