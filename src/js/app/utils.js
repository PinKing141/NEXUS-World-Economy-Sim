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

  function avg(values){
    var list = Array.isArray(values) ? values : [];
    var total = 0;
    var count = 0;

    list.forEach(function(value){
      var numeric = Number(value);
      if (!Number.isFinite(numeric)) return;
      total += numeric;
      count += 1;
    });

    return count ? (total / count) : 0;
  }

  function simDayToDate(day){
    var calendar = (App.data && App.data.CALENDAR) ? App.data.CALENDAR : null;
    if (!calendar) {
      return { year:0, monthIndex:0, day:1, monthName:"January" };
    }

    var daysPerYear = calendar.daysPerYear || 360;
    var daysPerMonth = calendar.daysPerMonth || 30;
    var monthNames = calendar.monthNames || [];
    var startYear = calendar.startYear || 0;
    var startMonth = calendar.startMonthIndex || 0;
    var startDay = calendar.startDay || 1;

    var totalDays = Math.floor(day || 0) + (startDay - 1) + (startMonth * daysPerMonth);
    var yearOffset = Math.floor(totalDays / daysPerYear);
    var year = startYear + yearOffset;
    var dayOfYear = totalDays - (yearOffset * daysPerYear);

    if (dayOfYear < 0) {
      dayOfYear += daysPerYear;
      year -= 1;
    }

    var monthIndex = Math.floor(dayOfYear / daysPerMonth);
    var dayOfMonth = (dayOfYear % daysPerMonth) + 1;
    var monthName = monthNames[monthIndex] || ("Month " + (monthIndex + 1));

    return {
      year:year,
      monthIndex:monthIndex,
      day:dayOfMonth,
      monthName:monthName
    };
  }

  function fmtDay(day){
    var date = simDayToDate(day);
    return date.day + " " + date.monthName + " " + date.year;
  }

  function fmtYear(day){
    var date = simDayToDate(day);
    return "Year " + date.year;
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

  function getCountryFlag(iso){
    if (!iso || typeof iso !== "string") return "";
    var code = iso.trim().toUpperCase();
    if (code === "UK") code = "GB";
    if (code.length !== 2) return "";
    var first = code.charCodeAt(0) - 65;
    var second = code.charCodeAt(1) - 65;
    if (first < 0 || first > 25 || second < 0 || second > 25) return "";
    return String.fromCodePoint(0x1F1E6 + first, 0x1F1E6 + second);
  }

  function compactMoney(value, prefix){
    var negative = value < 0;
    var abs = Math.abs(Number(value) || 0);
    var formatted;
    var suffixes = [
      { value:1e24, suffix:"Sp" },
      { value:1e21, suffix:"Sx" },
      { value:1e18, suffix:"Qi" },
      { value:1e15, suffix:"Qa" },
      { value:1e12, suffix:"T" },
      { value:1e9, suffix:"B" },
      { value:1e6, suffix:"M" },
      { value:1e3, suffix:"K" }
    ];
    var entry;

    if (!Number.isFinite(abs)) {
      return (negative ? "-" : "") + prefix + "0";
    }

    if (abs >= 1e27) {
      formatted = abs.toExponential(2).replace("e+", "e");
      return (negative ? "-" : "") + prefix + formatted;
    }

    for (var i = 0; i < suffixes.length; i += 1) {
      entry = suffixes[i];
      if (abs >= entry.value) {
        formatted = (abs / entry.value).toFixed(abs >= entry.value * 10 ? 1 : 2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1") + entry.suffix;
        return (negative ? "-" : "") + prefix + formatted;
      }
    }

    formatted = abs >= 100 ? abs.toFixed(0) : abs.toFixed(abs >= 10 ? 1 : 2);
    formatted = formatted.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
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
    var occupationLabels = {
      factory_worker:"Factory Worker",
      engineer:"Engineer",
      accountant:"Accountant",
      sales:"Sales",
      operator:"Operator",
      executive:"Executive",
      owner:"Owner",
      investor:"Investor",
      unemployed:"Unemployed",
      dependent:"Dependent"
    };

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
    } else if (person.occupationCategory && occupationLabels[person.occupationCategory]) {
      roles.push(occupationLabels[person.occupationCategory]);
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

  function getBusinessStopWords(){
    var naming = App.data && App.data.BUSINESS_NAMING;
    var words = naming && Array.isArray(naming.stopWords) ? naming.stopWords : [];
    var map = {};

    words.forEach(function(word){
      if (!word) return;
      map[String(word).toLowerCase()] = true;
    });

    return map;
  }

  function extractBusinessTokens(name, options){
    var settings = options || {};
    var stopWords = getBusinessStopWords();
    var rawTokens = String(name || "").replace(/&/g, " & ").split(/\s+/).map(function(token){
      return token.replace(/[^A-Za-z0-9]/g, "");
    }).filter(Boolean);

    if (settings.includeAll) {
      return rawTokens;
    }

    return rawTokens.filter(function(token){
      return !stopWords[token.toLowerCase()];
    });
  }

  function getBusinessMonogram(name){
    var tokens = extractBusinessTokens(name);
    var fallbackTokens;

    if (!tokens.length) {
      fallbackTokens = extractBusinessTokens(name, { includeAll:true });
      tokens = fallbackTokens.length ? fallbackTokens : [];
    }

    if (!tokens.length) return "?";
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0].charAt(0) + tokens[1].charAt(0)).toUpperCase();
  }

  function getBusinessTicker(name){
    var tokens = extractBusinessTokens(name);
    var fallbackTokens;
    var initials;

    if (!tokens.length) {
      fallbackTokens = extractBusinessTokens(name, { includeAll:true });
      tokens = fallbackTokens.length ? fallbackTokens : [];
    }

    if (!tokens.length) return "BIZ";
    if (tokens.length === 1) return tokens[0].slice(0, 4).toUpperCase();

    initials = tokens.slice(0, 4).map(function(token){
      return token.charAt(0);
    }).join("").toUpperCase();

    if (initials.length >= 3) return initials.slice(0, 4);
    return (tokens[0].slice(0, 2) + tokens[1].slice(0, 2)).slice(0, 4).toUpperCase();
  }

  App.utils = {
    rand:rand,
    randInt:randInt,
    pick:pick,
    clamp:clamp,
    avg:avg,
    fmtDay:fmtDay,
    fmtYear:fmtYear,
    simDayToDate:simDayToDate,
    blendHex:blendHex,
    latLngToSVG:latLngToSVG,
    getCurrency:getCurrency,
    getCountryFlag:getCountryFlag,
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
    familyCount:familyCount,
    getBusinessMonogram:getBusinessMonogram,
    getBusinessTicker:getBusinessTicker
  };
})(window);
