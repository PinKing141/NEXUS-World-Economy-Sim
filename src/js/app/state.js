(function(global){
  var App = global.Nexus || (global.Nexus = {});

  function createGovernorState(){
    return {
      enabled:true,
      annualLaunches:0,
      lastLaunchYear:-1,
      noLaunchYears:0,
      emptyEcosystemTicksByBloc:{},
      unemploymentTrapTicksByBloc:{},
      agingLockTicks:0,
      currencyConvergenceTicks:0,
      cooldowns:{},
      interventionCountsByDay:{},
      interventionLog:[],
      signalSnapshot:{},
      runCount:0,
      lastRunDay:0
    };
  }

  function createStockMarketState(){
    return {
      listingsByBusinessId:{},
      lastDividendDay:0,
      lastTradeDay:0,
      lastIpoDay:0,
      tradeTape:[]
    };
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

  var store = {
    blocs: [],
    isoToBloc: {},
    people: [],
    households: [],
    businesses: [],
    newsItems: [],
    eventHistory: [],
    eventWindowStats: {},
    eventSeq: 0,
    pauseReasonEventId: null,
    traitEffectStats: {},
    econHist: {},
    tickerData: {},
    businessNamingMode: "v2",
    startPresetId: "1998",
    startYear: 1998,
    selectedBlocId: "NA",
    selection: { type:null, id:null },
    simSpeed: 1,
    lastNonZeroSimSpeed: 1,
    simDay: 0,
    accumulator: 0,
    countryNames: {},
    countryData: {},
    countryProfiles: {},
    tier6SanctionLanes: {},
    governor: createGovernorState(),
    stockMarket: createStockMarketState(),
    yearlyTuningTelemetry: [],
    mapObject: null,
    mapSvg: null,
    mapDocument: null,
    panZoom: null
  };

  function isLiving(person){
    return !!(person && person.alive);
  }

  function normalizeCountryDisplayName(name){
    var normalized = String(name || "");

    if (!normalized) return normalized;

    // Heal known mojibake names that may persist in older saves.
    normalized = normalized
      .replace(/CÃ´te d['’]Ivoire/g, "Côte d'Ivoire")
      .replace(/Cote d['’]Ivoire/g, "Côte d'Ivoire");

    return normalized;
  }

  function isBusinessLeader(person){
    return !!(person && person.employerBusinessId && person.jobTitle);
  }

  function isPublicCEO(person){
    var business;
    var leadership;

    if (!isLiving(person)) return false;
    if (!person.employerBusinessId || person.jobTitle !== "CEO") return false;

    business = store.getBusiness(person.employerBusinessId);
    if (!business) return false;

    leadership = business.leadership || [];
    return leadership.some(function(entry){
      return entry.roleKey === "ceo" && entry.personId === person.id;
    });
  }

  function hasActiveFoundedBusiness(person){
    if (!person) return false;
    return store.businesses.some(function(business){
      return business && business.founderId === person.id;
    });
  }

  function publicSort(first, second){
    function weight(person){
      if (isPublicCEO(person)) return 0;
      if (person.businessId) return 0;
      if (hasActiveFoundedBusiness(person)) return 1;
      if (isBusinessLeader(person)) return 2;
      return 3;
    }

    var byWeight = weight(first) - weight(second);
    if (byWeight !== 0) return byWeight;
    if (second.netWorthGU !== first.netWorthGU) return second.netWorthGU - first.netWorthGU;
    if ((second.age || 0) !== (first.age || 0)) return (second.age || 0) - (first.age || 0);
    return first.name.localeCompare(second.name);
  }

  store.reset = function(){
    store.blocs = App.data.createBlocs();
    store.isoToBloc = {};
    store.people = [];
    store.households = [];
    store.businesses = [];
    store.newsItems = [];
    store.eventHistory = [];
    store.eventWindowStats = {};
    store.eventSeq = 0;
    store.pauseReasonEventId = null;
    store.traitEffectStats = {};
    store.econHist = {};
    store.tickerData = {};
    store.businessNamingMode = "v2";
    store.startPresetId = "1998";
    store.startYear = 1998;
    store.selectedBlocId = "NA";
    store.selection = { type:null, id:null };
    store.simSpeed = 1;
    store.lastNonZeroSimSpeed = 1;
    store.simDay = 0;
    store.accumulator = 0;
    store.countryNames = {};
    store.countryData = {};
    store.countryProfiles = {};
    store.tier6SanctionLanes = {};
    store.governor = createGovernorState();
    store.stockMarket = createStockMarketState();
    store.yearlyTuningTelemetry = [];
    store.mapObject = null;
    store.mapSvg = null;
    store.mapDocument = null;
    store.panZoom = null;

    store.blocs.forEach(function(bloc){
      store.econHist[bloc.id] = [];
      bloc.members.forEach(function(iso){
        store.isoToBloc[normalizeIso(iso)] = bloc.id;
      });
    });
  };

  store.updateMapRefs = function(objectEl, svgEl, docEl, panZoom){
    store.mapObject = objectEl;
    store.mapSvg = svgEl;
    store.mapDocument = docEl;
    store.panZoom = panZoom || null;
  };

  store.getBloc = function(id){
    return store.blocs.find(function(bloc){ return bloc.id === id; }) || null;
  };

  store.getBlocByCountry = function(iso){
    var normalized = normalizeIso(iso);
    return store.getBloc(store.isoToBloc[normalized] || "NA");
  };

  store.getPerson = function(id){
    return store.people.find(function(person){ return person.id === id; }) || null;
  };

  store.getLivingPeople = function(){
    return store.people.filter(isLiving);
  };

  store.getEmploymentBusiness = function(person){
    if (!person || !person.employerBusinessId) return null;
    return store.getBusiness(person.employerBusinessId);
  };

  store.isBusinessLeader = function(person){
    return isBusinessLeader(person);
  };

  store.isPublicCEO = function(person){
    return isPublicCEO(person);
  };

  store.isPublicPerson = function(person){
    return isPublicCEO(person);
  };

  store.getPublicPeople = function(){
    return store.getLivingPeople().filter(store.isPublicPerson).slice().sort(publicSort);
  };

  store.getBusiness = function(id){
    return store.businesses.find(function(business){ return business.id === id; }) || null;
  };

  store.getListingForBusiness = function(businessOrId){
    var businessId = typeof businessOrId === "string" ? businessOrId : (businessOrId && businessOrId.id);
    var stockMarket = store.stockMarket || {};
    var listings = stockMarket.listingsByBusinessId || {};

    if (!businessId) return null;
    return listings[businessId] || null;
  };

  store.getAllListings = function(){
    var stockMarket = store.stockMarket || {};
    var listings = stockMarket.listingsByBusinessId || {};

    return Object.keys(listings).map(function(id){
      return listings[id];
    }).filter(Boolean);
  };

  store.getPersonPortfolio = function(personOrId){
    var personId = typeof personOrId === "string" ? personOrId : (personOrId && personOrId.id);

    if (!personId) return [];

    return store.getAllListings().map(function(listing){
      var business = store.getBusiness(listing.businessId);
      var holderMap = listing && listing.sharesByHolder && typeof listing.sharesByHolder === "object" ? listing.sharesByHolder : {};
      var shares = Math.max(0, Number(holderMap[personId]) || 0);
      var price = Math.max(0, Number(listing.sharePriceGU) || 0);
      var annualDividendPerShare = Math.max(0, Number(listing.annualDividendPerShareGU) || 0);

      if (!shares || !business) return null;
      return {
        listing:listing,
        business:business,
        shares:shares,
        marketValueGU:shares * price,
        annualDividendGU:shares * annualDividendPerShare
      };
    }).filter(Boolean).sort(function(first, second){
      return second.marketValueGU - first.marketValueGU;
    });
  };

  store.getPersonPortfolioSummary = function(personOrId){
    var holdings = store.getPersonPortfolio(personOrId);

    return holdings.reduce(function(summary, holding){
      summary.holdings += 1;
      summary.totalShares += holding.shares;
      summary.marketValueGU += holding.marketValueGU;
      summary.annualDividendGU += holding.annualDividendGU;
      return summary;
    }, {
      holdings:0,
      totalShares:0,
      marketValueGU:0,
      annualDividendGU:0
    });
  };

  store.getHousehold = function(id){
    return store.households.find(function(household){
      return household && household.id === id;
    }) || null;
  };

  store.getPersonHousehold = function(personOrId){
    var person = typeof personOrId === "string" ? store.getPerson(personOrId) : personOrId;
    if (!person || !person.householdId) return null;
    return store.getHousehold(person.householdId);
  };

  store.getHouseholdAdults = function(household){
    var target = typeof household === "string" ? store.getHousehold(household) : household;
    if (!target || !Array.isArray(target.adultIds)) return [];
    return target.adultIds.map(function(id){
      return store.getPerson(id);
    }).filter(Boolean);
  };

  store.getHouseholdChildren = function(household){
    var target = typeof household === "string" ? store.getHousehold(household) : household;
    if (!target || !Array.isArray(target.childIds)) return [];
    return target.childIds.map(function(id){
      return store.getPerson(id);
    }).filter(Boolean);
  };

  store.syncHouseholds = function(){
    if (App.sim && typeof App.sim.syncHouseholds === "function") {
      return App.sim.syncHouseholds();
    }
    return store.households || [];
  };

  store.getBusinessLeadership = function(business){
    var target = typeof business === "string" ? store.getBusiness(business) : business;

    if (!target || !target.leadership) return [];

    return target.leadership.map(function(entry){
      return Object.assign({}, entry, {
        person: store.getPerson(entry.personId)
      });
    }).filter(function(entry){
      return !!entry.person;
    }).sort(function(first, second){
      if ((second.importance || 0) !== (first.importance || 0)) {
        return (second.importance || 0) - (first.importance || 0);
      }
      return (first.title || "").localeCompare(second.title || "");
    });
  };

  store.getBusinessLeader = function(business, roleKey){
    return store.getBusinessLeadership(business).find(function(entry){
      return entry.roleKey === roleKey;
    }) || null;
  };

  store.getAssociatedBusiness = function(person){
    if (!person) return null;
    return store.getBusiness(person.businessId) ||
      store.getEmploymentBusiness(person) ||
      store.businesses.find(function(business){
        return business && business.founderId === person.id;
      }) ||
      null;
  };

  store.getLivingCount = function(){
    return store.getLivingPeople().length;
  };

  store.setCountryName = function(iso, name){
    iso = normalizeIso(iso);
    if (iso && name) {
      store.countryNames[iso] = normalizeCountryDisplayName(name);
    }
  };

  store.getCountryName = function(iso){
    var normalized = normalizeIso(iso);
    var name = store.countryNames[normalized];
    if (!name) return normalized || iso;
    name = normalizeCountryDisplayName(name);
    store.countryNames[normalized] = name;
    return name;
  };

  store.setCountryData = function(iso, data){
    iso = normalizeIso(iso);
    if (!iso) return;
    store.countryData[iso] = Object.assign({ iso:iso }, data || {});
  };

  store.getCountryData = function(iso){
    return store.countryData[normalizeIso(iso)] || null;
  };

  store.setCountryProfile = function(iso, profile){
    iso = normalizeIso(iso);
    if (!iso) return;
    store.countryProfiles[iso] = Object.assign({ iso:iso }, profile || {});
  };

  store.getCountryProfile = function(iso){
    return store.countryProfiles[normalizeIso(iso)] || null;
  };

  store.getBlocProfiles = function(blocId){
    return Object.keys(store.countryProfiles).map(function(iso){
      return store.countryProfiles[iso];
    }).filter(function(profile){
      return profile && profile.blocId === blocId;
    });
  };

  store.selectPerson = function(id){
    var person = store.getPerson(id);
    if (!person) return;
    store.selection = { type:"person", id:id };
    store.selectedBlocId = person.blocId;
  };

  store.selectCountry = function(iso){
    var normalized = normalizeIso(iso);
    var bloc = store.getBlocByCountry(normalized);
    store.selection = { type:"country", id:normalized || iso };
    if (bloc) {
      store.selectedBlocId = bloc.id;
    }
  };

  store.selectBusiness = function(id){
    var business = store.getBusiness(id);
    if (!business) return;
    store.selection = { type:"business", id:id };
    store.selectedBlocId = business.blocId;
  };

  store.clearSelection = function(){
    store.selection = { type:null, id:null };
  };

  store.setSelectedBloc = function(id){
    store.selectedBlocId = id;
  };

  store.setSimSpeed = function(speed){
    var normalized = Math.max(0, Math.min(8, Number(speed) || 0));
    store.simSpeed = normalized;
    if (normalized > 0) {
      store.lastNonZeroSimSpeed = normalized;
      store.pauseReasonEventId = null;
    }
  };

  store.getEventById = function(id){
    if (!id) return null;
    return store.eventHistory.find(function(item){
      return item && item.id === id;
    }) || store.newsItems.find(function(item){
      return item && item.id === id;
    }) || null;
  };

  store.getFeedItems = function(limit){
    var items = (store.newsItems || []).filter(Boolean);
    return limit == null ? items.slice() : items.slice(0, Math.max(0, Number(limit) || 0));
  };

  store.getEventHistory = function(limit){
    var items = (store.eventHistory || []).filter(Boolean);
    return limit == null ? items.slice() : items.slice(0, Math.max(0, Number(limit) || 0));
  };

  store.getEventsForEntity = function(entityType, id, limit){
    var keyMap = {
      person:"personIds",
      business:"businessIds",
      country:"countryIsos",
      bloc:"blocIds"
    };
    var entityKey = keyMap[entityType];
    var items;

    if (!entityKey || !id) return [];

    items = (store.eventHistory || []).filter(function(item){
      var entities = item && item.entities ? item.entities : {};
      return Array.isArray(entities[entityKey]) && entities[entityKey].indexOf(id) !== -1;
    });

    return limit == null ? items.slice() : items.slice(0, Math.max(0, Number(limit) || 0));
  };

  store.getPersonEventHistory = function(id, limit){
    return store.getEventsForEntity("person", id, limit);
  };

  store.getBusinessEventHistory = function(id, limit){
    return store.getEventsForEntity("business", id, limit);
  };

  store.getCountryEventHistory = function(id, limit){
    return store.getEventsForEntity("country", id, limit);
  };

  store.getBlocEventHistory = function(id, limit){
    return store.getEventsForEntity("bloc", id, limit);
  };

  store.getSpouse = function(person){
    return person && person.spouseId ? store.getPerson(person.spouseId) : null;
  };

  store.getParents = function(person){
    if (!person || !person.parentIds) return [];
    return person.parentIds.map(function(id){
      return store.getPerson(id);
    }).filter(Boolean);
  };

  store.getChildren = function(person, includeDead){
    if (!person || !person.childrenIds) return [];
    return person.childrenIds.map(function(id){
      return store.getPerson(id);
    }).filter(function(child){
      return !!child && (includeDead || child.alive);
    });
  };

  store.getCountryPeople = function(iso){
    iso = normalizeIso(iso);
    return store.people.filter(function(person){
      return normalizeIso(person.countryISO) === iso && person.alive;
    });
  };

  store.getPublicCountryPeople = function(iso){
    iso = normalizeIso(iso);
    return store.people.filter(function(person){
      return normalizeIso(person.countryISO) === iso && store.isPublicPerson(person);
    }).slice().sort(publicSort);
  };

  store.getCountryPeopleAll = function(iso){
    iso = normalizeIso(iso);
    return store.people.filter(function(person){
      return normalizeIso(person.countryISO) === iso;
    });
  };

  store.getCountryBusinesses = function(iso){
    iso = normalizeIso(iso);
    return store.businesses.filter(function(business){
      return normalizeIso(business.countryISO) === iso;
    });
  };

  store.getCountryRichestPerson = function(iso){
    return store.getCountryPeople(iso).slice().sort(function(a, b){
      return b.netWorthGU - a.netWorthGU;
    })[0] || null;
  };

  store.getCountryTopBusiness = function(iso){
    return store.getCountryBusinesses(iso).slice().sort(function(a, b){
      return b.valuationGU - a.valuationGU;
    })[0] || null;
  };

  store.getUSStateActivity = function(){
    return App.data.US_STATE_CODES.map(function(code){
      var people = store.people.filter(function(person){
        return person.alive && person.countryISO === "US" && person.state === code;
      });
      var businesses = store.businesses.filter(function(business){
        var owner = store.getPerson(business.ownerId);
        return owner && owner.alive && owner.countryISO === "US" && owner.state === code;
      });
      return {
        code: code,
        name: App.data.US_STATE_NAMES[code] || code,
        people: people.length,
        businesses: businesses.length
      };
    }).sort(function(a, b){
      if (b.people !== a.people) return b.people - a.people;
      return a.name.localeCompare(b.name);
    });
  };

  store.getVisiblePeople = function(){
    return store.getPublicPeople();
  };

  App.store = store;
})(window);
