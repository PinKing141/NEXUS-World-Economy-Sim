(function(global){
  var App = global.Nexus || (global.Nexus = {});

  function rand(min, max){
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(items){
    return items[Math.floor(Math.random() * items.length)];
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function fmtDay(day){
    return "Y" + (Math.floor(day / 360) + 1) + " Q" + (Math.floor((day % 360) / 90) + 1);
  }

  function blendHex(first, second, ratio){
    function parseColor(value){
      var raw = parseInt(value.replace("#", "").padStart(6, "0"), 16);
      return [(raw >> 16) & 255, (raw >> 8) & 255, raw & 255];
    }

    var a = parseColor(first);
    var b = parseColor(second);

    return "#" + [0, 1, 2].map(function(index){
      return Math.round(a[index] * (1 - ratio) + b[index] * ratio).toString(16).padStart(2, "0");
    }).join("");
  }

  function latLngToSVG(lat, lng){
    var viewBox = App.data.MAP_VIEWBOX || { width:1000, height:507.209 };
    var x = (lng + 180) / 360 * viewBox.width;
    var y = (90 - lat) / 180 * viewBox.height;
    return {
      x: Math.max(0, Math.min(viewBox.width, x)),
      y: Math.max(0, Math.min(viewBox.height, y))
    };
  }

  function getCurrency(iso){
    return App.data.CURRENCY_MAP[iso] || { code:"USD", name:"USD", sym:"$" };
  }

  function compactMoney(value, prefix){
    var negative = value < 0;
    var abs = Math.abs(value);
    var formatted;

    if (abs >= 1e12) formatted = (abs / 1e12).toFixed(1) + "T";
    else if (abs >= 1e9) formatted = (abs / 1e9).toFixed(1) + "B";
    else if (abs >= 1e6) formatted = (abs / 1e6).toFixed(1) + "M";
    else if (abs >= 1e3) formatted = (abs / 1e3).toFixed(0) + "K";
    else formatted = abs.toFixed(0);

    return (negative ? "-" : "") + prefix + formatted;
  }

  function fmtCountry(gu, iso){
    var currency = getCurrency(iso);
    var bloc = App.store ? App.store.getBlocByCountry(iso) : null;
    return compactMoney(gu * (bloc ? bloc.rate : 1), currency.sym);
  }

  function fmtUSD(gu){
    var currency = getCurrency("US");
    var bloc = App.store ? App.store.getBlocByCountry("US") : null;
    return compactMoney(gu * (bloc ? bloc.rate : 1), currency.sym);
  }

  function fmtL(gu, bloc){
    return compactMoney(gu * bloc.rate, bloc.symbol);
  }

  function fmtGU(gu){
    return compactMoney(gu, "GU ");
  }

  function locationLabel(person, compact){
    if (person.countryISO === "US" && person.state) {
      var stateName = App.data.US_STATE_NAMES[person.state] || person.state;
      return compact ? (stateName + ", US") : (stateName + ", United States");
    }
    return App.store.getCountryName(person.countryISO);
  }

  function displayAge(person){
    return Math.floor(person.age || 0);
  }

  function getNameOrder(countryISO, explicitOrder){
    if (explicitOrder) return explicitOrder;
    return App.data.NAME_ORDER_COUNTRIES.indexOf(countryISO) !== -1 ? "familyFirst" : "givenFirst";
  }

  function formatPersonName(firstName, lastName, countryISO, explicitOrder){
    if (!firstName) return lastName || "";
    if (!lastName) return firstName || "";
    return getNameOrder(countryISO, explicitOrder) === "familyFirst" ?
      (lastName + " " + firstName) :
      (firstName + " " + lastName);
  }

  function getLifeStageLabel(person){
    if (!person || !person.alive) return "Deceased";
    if (person.lifeStage === "child") return "Child";
    if (person.lifeStage === "teen") return "Teen";
    if (person.lifeStage === "adult") return "Adult";
    if (person.lifeStage === "senior") return "Senior";
    return "Citizen";
  }

  function getPersonRoles(person){
    var roles = [];
    var ownedBusiness;
    var associatedBusiness;

    if (!person) return roles;

    ownedBusiness = App.store ? App.store.getBusiness(person.businessId) : null;
    associatedBusiness = App.store ? App.store.getAssociatedBusiness(person) : null;

    if (ownedBusiness) {
      roles.push(ownedBusiness.founderId === person.id ? "Founder" : "Heir");
    } else if (associatedBusiness && associatedBusiness.founderId === person.id) {
      roles.push("Founder");
    }

    if (person.jobTitle) {
      roles.push(person.jobTitle);
    }

    if (person.parentIds && person.parentIds.length) {
      roles.push(person.sex === "male" ? "Son" : "Daughter");
    }

    if (person.spouseId) {
      roles.push(person.sex === "male" ? "Husband" : "Wife");
    }

    if (person.childrenIds && person.childrenIds.length) {
      roles.push("Parent");
    }

    if (person.retired) {
      roles.push("Retired");
    }

    return roles;
  }

  function familyCount(person){
    if (!person || !person.childrenIds) return 0;
    return person.childrenIds.filter(function(id){
      var child = App.store.getPerson(id);
      return !!child;
    }).length;
  }

  App.utils = {
    rand:rand,
    randInt:randInt,
    pick:pick,
    clamp:clamp,
    fmtDay:fmtDay,
    blendHex:blendHex,
    latLngToSVG:latLngToSVG,
    getCurrency:getCurrency,
    fmtCountry:fmtCountry,
    fmtUSD:fmtUSD,
    fmtL:fmtL,
    fmtGU:fmtGU,
    locationLabel:locationLabel,
    displayAge:displayAge,
    getNameOrder:getNameOrder,
    formatPersonName:formatPersonName,
    getLifeStageLabel:getLifeStageLabel,
    getPersonRoles:getPersonRoles,
    familyCount:familyCount
  };
})(window);
