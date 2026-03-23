(function(global){
  var App = global.Nexus || (global.Nexus = {});

  var store = {
    blocs: [],
    isoToBloc: {},
    people: [],
    businesses: [],
    newsItems: [],
    econHist: {},
    tickerData: {},
    selectedBlocId: "NA",
    selection: { type:null, id:null },
    simSpeed: 1,
    simDay: 0,
    accumulator: 0,
    countryNames: {},
    mapObject: null,
    mapSvg: null,
    mapDocument: null,
    panZoom: null
  };

  function isLiving(person){
    return !!(person && person.alive);
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
    store.businesses = [];
    store.newsItems = [];
    store.econHist = {};
    store.tickerData = {};
    store.selectedBlocId = "NA";
    store.selection = { type:null, id:null };
    store.simSpeed = 1;
    store.simDay = 0;
    store.accumulator = 0;
    store.countryNames = {};
    store.mapObject = null;
    store.mapSvg = null;
    store.mapDocument = null;
    store.panZoom = null;

    store.blocs.forEach(function(bloc){
      store.econHist[bloc.id] = [];
      bloc.members.forEach(function(iso){
        store.isoToBloc[iso] = bloc.id;
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
    return store.getBloc(store.isoToBloc[iso] || "NA");
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
    if (iso && name) {
      store.countryNames[iso] = name;
    }
  };

  store.getCountryName = function(iso){
    return store.countryNames[iso] || iso;
  };

  store.selectPerson = function(id){
    var person = store.getPerson(id);
    if (!person) return;
    store.selection = { type:"person", id:id };
    store.selectedBlocId = person.blocId;
  };

  store.selectCountry = function(iso){
    var bloc = store.getBlocByCountry(iso);
    store.selection = { type:"country", id:iso };
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
    store.simSpeed = speed;
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
    return store.people.filter(function(person){
      return person.countryISO === iso && person.alive;
    });
  };

  store.getPublicCountryPeople = function(iso){
    return store.people.filter(function(person){
      return person.countryISO === iso && store.isPublicPerson(person);
    }).slice().sort(publicSort);
  };

  store.getCountryPeopleAll = function(iso){
    return store.people.filter(function(person){
      return person.countryISO === iso;
    });
  };

  store.getCountryBusinesses = function(iso){
    return store.businesses.filter(function(business){
      return business.countryISO === iso;
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
