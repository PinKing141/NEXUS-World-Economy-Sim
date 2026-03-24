(function(global){
  var App = global.Nexus || (global.Nexus = {});
  var PROFILE_LABELS = {
    riskTolerance:{ high:"Risk-Seeking", low:"Cautious" },
    greed:{ high:"Greedy", low:"Restrained" },
    patience:{ high:"Patient", low:"Impulsive" },
    discipline:{ high:"Disciplined", low:"Erratic" },
    loyalty:{ high:"Loyal", low:"Detached" },
    statusSeeking:{ high:"Status-Driven", low:"Low-Status Drive" },
    familyAttachment:{ high:"Family-Driven", low:"Independent" },
    adaptability:{ high:"Adaptable", low:"Rigid" },
    ethics:{ high:"Ethical", low:"Ruthless" }
  };
  var DECISION_LABELS = {
    aggressive:"Aggressive",
    balanced:"Balanced",
    defensive:"Defensive",
    retrenching:"Retrenching",
    hire:"Hiring",
    hold:"Holding",
    layoff:"Layoffs",
    reinvest:"Reinvesting",
    preserve:"Preserving Cash",
    family:"Family-First",
    merit:"Merit-First"
  };
  var activePeopleTab = "citizens";
  var activeInspectorTab = "inspector";
  var lastNewsRenderSignature = "";
  var tickerRenderSlots = [];
  var tickerIdentitySignature = "";

  function setInspectorTab(tab){
    activeInspectorTab = tab === "governor" ? "governor" : "inspector";
  }

  function setPeopleTab(tab){
    activePeopleTab = tab === "companies" ? "companies" : "citizens";
  }

  function syncPeopleTabs(){
    Array.prototype.forEach.call(document.querySelectorAll("#plist-tabs .ptab"), function(button){
      button.classList.toggle("act", button.getAttribute("data-people-tab") === activePeopleTab);
    });
  }

  function syncInspectorTabs(){
    Array.prototype.forEach.call(document.querySelectorAll("#dpanel-tabs .dtab"), function(button){
      button.classList.toggle("act", button.getAttribute("data-inspector-tab") === activeInspectorTab);
    });
  }

  function formatGovernorKeyLabel(value){
    return String(value || "intervention").replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim().toUpperCase();
  }

  function summarizeGovernorImpact(entry){
    var entities = entry && entry.entities && typeof entry.entities === "object" ? entry.entities : {};
    var personCount = Array.isArray(entities.personIds) ? entities.personIds.length : 0;
    var businessCount = Array.isArray(entities.businessIds) ? entities.businessIds.length : 0;
    var countryCount = Array.isArray(entities.countryIsos) ? entities.countryIsos.length : 0;
    var blocCount = Array.isArray(entities.blocIds) ? entities.blocIds.length : 0;
    return "P" + personCount + " B" + businessCount + " C" + countryCount + " BL" + blocCount;
  }

  function renderGovernorLog(){
    var el = document.getElementById("dc");
    var governor = App.store.governor || {};
    var logs = Array.isArray(governor.interventionLog) ? governor.interventionLog.slice(0, 40) : [];

    if (!logs.length) {
      el.innerHTML = "<div class='empty'><div class='big'>LOG</div><div>No governor interventions recorded yet.</div></div>";
      return;
    }

    el.innerHTML = [
      "<div class='mc'>",
      "<div class='mcl'>Governor Interventions</div>",
      "<div class='country-note'>Recent corrective actions with cause and impact for balancing.</div>",
      "</div>",
      "<div class='gov-log-list'>",
      logs.map(function(entry){
        var causes = Array.isArray(entry.causes) ? entry.causes.slice(0, 2) : [];
        var dayText = App.utils.fmtDay(Number(entry.day) || 0);
        var scope = String(entry.scope || "global").toUpperCase();
        return [
          "<div class='gov-log-entry'>",
          "<div class='gov-log-head'>",
          "<span class='gov-log-key'>" + formatGovernorKeyLabel(entry.key) + " - " + scope + "</span>",
          "<span class='gov-log-day'>" + dayText + "</span>",
          "</div>",
          "<div class='country-note'>" + (entry.text || "Governor intervention applied.") + "</div>",
          causes.length ? ("<div class='country-note'>Cause: " + causes.join(" | ") + "</div>") : "",
          "<div class='country-note'>Impact: " + summarizeGovernorImpact(entry) + "</div>",
          "</div>"
        ].join("");
      }).join(""),
      "</div>"
    ].join("");
  }

  function ensureTickerSlot(container, index){
    var slot = tickerRenderSlots[index];
    var row;
    var flag;
    var name;
    var value;
    var change;

    if (slot) return slot;

    row = document.createElement("span");
    row.className = "ti";

    flag = document.createElement("span");
    flag.className = "tf";
    row.appendChild(flag);

    name = document.createElement("span");
    name.className = "tn";
    row.appendChild(name);

    value = document.createElement("span");
    value.className = "tv";
    row.appendChild(value);

    change = document.createElement("span");
    change.className = "tup";
    row.appendChild(change);

    container.appendChild(row);

    slot = {
      row:row,
      flag:flag,
      name:name,
      value:value,
      change:change
    };
    tickerRenderSlots[index] = slot;
    return slot;
  }

  function applyTickerSlot(slot, item){
    var isUp = item.chg >= 0;
    slot.flag.textContent = item.flag;
    slot.name.textContent = item.name;
    slot.value.textContent = item.local;
    slot.change.className = isUp ? "tup" : "tdn";
    slot.change.textContent = (isUp ? "▲" : "▼") + Math.abs(item.chg).toFixed(1) + "%";
  }

  function renderEmptyInspector(){
    document.getElementById("dc").innerHTML =
      "<div class='empty'><div class='big'>O</div><div>Click any citizen,<br>country, or business to inspect</div></div>";
  }

  function renderBadgeRow(labels, className){
    return labels.filter(Boolean).map(function(label){
      return "<span class='" + className + "'>" + label + "</span>";
    }).join("");
  }

  function renderTraitEffectTags(effects, className){
    return (effects || []).map(function(effect){
      if (!effect) return "";
      return "<span class='" + (className || "trait decision-trait") + "'>" + (effect.label || "") + "</span>";
    }).join("");
  }

  function renderTraitEffectBlock(title, effects, emptyText){
    return [
      "<div class='mc'>",
      "<div class='mcl'>" + title + "</div>",
      effects && effects.length ? ("<div class='traits decision-tags'>" + renderTraitEffectTags(effects, "trait decision-trait") + "</div>") : ("<div class='country-note'>" + emptyText + "</div>"),
      "</div>"
    ].join("");
  }

  function renderEntityLink(type, id, label){
    if (!id) return label || "Unknown";
    return "<span class='entity-link' data-" + type + "-id='" + id + "'>" + label + "</span>";
  }

  function escapeAttrText(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  var COUNTRY_CREDENTIAL_LABELS = {
    US:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"High School Diploma", primary:"Primary School Certificate", none:"No Formal Qualification" },
    UK:{ doctorate:"Doctorate", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"A-Level Qualification", primary:"GCSE Foundation", none:"No Formal Qualification" },
    IN:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Higher Secondary Certificate", primary:"Secondary School Certificate", none:"No Formal Qualification" },
    CA:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Secondary School Diploma", primary:"Elementary Certificate", none:"No Formal Qualification" },
    AU:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Senior Secondary Certificate", primary:"Primary Certificate", none:"No Formal Qualification" },
    DE:{ doctorate:"Doktorgrad", masters:"Masterabschluss", bachelor:"Bachelorabschluss", highschool:"Abitur", primary:"Grundschule Abschluss", none:"Keine formale Qualifikation" },
    FR:{ doctorate:"Doctorat", masters:"Master", bachelor:"Licence", highschool:"Baccalaureat", primary:"Certificat Primaire", none:"Aucune qualification formelle" },
    ES:{ doctorate:"Doctorado", masters:"Maestria", bachelor:"Grado Universitario", highschool:"Bachillerato", primary:"Certificado Primario", none:"Sin titulacion formal" },
    BR:{ doctorate:"Doutorado", masters:"Mestrado", bachelor:"Bacharelado", highschool:"Ensino Medio", primary:"Ensino Fundamental", none:"Sem qualificacao formal" },
    MX:{ doctorate:"Doctorado", masters:"Maestria", bachelor:"Licenciatura", highschool:"Preparatoria", primary:"Primaria", none:"Sin certificacion formal" },
    CN:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Senior Middle School Diploma", primary:"Compulsory Education Certificate", none:"No Formal Qualification" },
    JP:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Upper Secondary Diploma", primary:"Compulsory School Certificate", none:"No Formal Qualification" },
    KR:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"High School Diploma", primary:"Middle School Completion", none:"No Formal Qualification" },
    ID:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Sarjana Degree", highschool:"SMA Diploma", primary:"SMP Certificate", none:"No Formal Qualification" },
    NG:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Senior Secondary Certificate", primary:"Basic Education Certificate", none:"No Formal Qualification" },
    ZA:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"National Senior Certificate", primary:"General Education Certificate", none:"No Formal Qualification" },
    KE:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"KCSE Certificate", primary:"KCPE Certificate", none:"No Formal Qualification" },
    EG:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Thanaweya Diploma", primary:"Preparatory Certificate", none:"No Formal Qualification" },
    SA:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Secondary Education Certificate", primary:"Intermediate School Certificate", none:"No Formal Qualification" },
    AE:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Secondary School Certificate", primary:"Preparatory Certificate", none:"No Formal Qualification" },
    TR:{ doctorate:"Doktora", masters:"Yuksek Lisans", bachelor:"Lisans", highschool:"Lise Diplomasi", primary:"Ilkogretim Belgesi", none:"Resmi nitelik yok" },
    RU:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Secondary General Certificate", primary:"Basic School Certificate", none:"No Formal Qualification" },
    PH:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Senior High School Diploma", primary:"Junior High Certificate", none:"No Formal Qualification" },
    default:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"High School Diploma", primary:"Primary Certificate", none:"No Formal Qualification" }
  };

  function getFloatingRichTooltip(){
    var node = document.getElementById("floating-rich-tip");

    if (node) return node;

    node = document.createElement("div");
    node.id = "floating-rich-tip";
    node.className = "floating-rich-tip";
    node.innerHTML = "<div class='rt-head'>Details</div><div class='rt-body'>Hover highlighted cards for context.</div>";
    document.body.appendChild(node);
    return node;
  }

  function positionFloatingRichTooltip(node, clientX, clientY){
    var offset = 14;
    var width;
    var height;
    var left;
    var top;
    var maxLeft;
    var maxTop;

    if (!node) return;

    width = node.offsetWidth || 300;
    height = node.offsetHeight || 120;
    maxLeft = Math.max(8, window.innerWidth - width - 8);
    maxTop = Math.max(8, window.innerHeight - height - 8);

    left = clientX + offset;
    top = clientY + offset;

    if (left > maxLeft) {
      left = Math.max(8, clientX - width - offset);
    }
    if (top > maxTop) {
      top = Math.max(8, clientY - height - offset);
    }

    node.style.left = left + "px";
    node.style.top = top + "px";
  }

  function showFloatingRichTooltip(title, body, clientX, clientY){
    var node = getFloatingRichTooltip();
    var heading = node.querySelector(".rt-head");
    var text = node.querySelector(".rt-body");

    if (heading) heading.textContent = title || "Details";
    if (text) text.textContent = body || "No detail available.";
    node.classList.add("is-visible");
    positionFloatingRichTooltip(node, Number(clientX) || 0, Number(clientY) || 0);
  }

  function hideFloatingRichTooltip(){
    var node = document.getElementById("floating-rich-tip");
    if (!node) return;
    node.classList.remove("is-visible");
  }

  function buildRichTooltipAttrs(title, body){
    return " tabindex='0' data-rich-tip-title='" + escapeAttrText(title || "Details") + "' data-rich-tip-body='" + escapeAttrText(body || "No detail available.") + "'";
  }

  function bindInspectorRichTooltips(container){
    if (!container) return;

    Array.prototype.forEach.call(container.querySelectorAll(".sbox[data-rich-tip-body]"), function(node){
      var onEnter = function(event){
        var clientX = event && Number.isFinite(event.clientX) ? event.clientX : 0;
        var clientY = event && Number.isFinite(event.clientY) ? event.clientY : 0;

        node.classList.add("is-tip-active");
        showFloatingRichTooltip(node.getAttribute("data-rich-tip-title"), node.getAttribute("data-rich-tip-body"), clientX, clientY);
      };
      var onLeave = function(){
        node.classList.remove("is-tip-active");
        hideFloatingRichTooltip();
      };
      var onMove = function(event){
        var tip = document.getElementById("floating-rich-tip");
        if (!tip || !tip.classList.contains("is-visible")) return;
        positionFloatingRichTooltip(tip, event.clientX, event.clientY);
      };
      var onFocus = function(){
        var rect = node.getBoundingClientRect();

        node.classList.add("is-tip-active");
        showFloatingRichTooltip(node.getAttribute("data-rich-tip-title"), node.getAttribute("data-rich-tip-body"), rect.right, rect.top + (rect.height / 2));
      };
      var onBlur = function(){
        node.classList.remove("is-tip-active");
        hideFloatingRichTooltip();
      };

      node.addEventListener("mouseenter", onEnter);
      node.addEventListener("mouseleave", onLeave);
      node.addEventListener("mousemove", onMove);
      node.addEventListener("focus", onFocus);
      node.addEventListener("blur", onBlur);
    });
  }

  function getCountryCredentialLabels(iso){
    return COUNTRY_CREDENTIAL_LABELS[iso] || COUNTRY_CREDENTIAL_LABELS.default;
  }

  function getCountryEducationCredentialLabel(iso, educationScore){
    var value = Math.max(0, Math.min(100, Number(educationScore) || 0));
    var labels = getCountryCredentialLabels(iso);

    if (value >= 96) return labels.doctorate;
    if (value >= 88) return labels.masters;
    if (value >= 75) return labels.bachelor;
    if (value >= 55) return labels.highschool;
    if (value >= 35) return labels.primary;
    return labels.none;
  }

  function formatInstitutionTypeLabel(value){
    var key = String(value || "school");
    if (key === "specialist_school") return "SPECIALIST SCHOOL";
    return key.replace(/_/g, " ").toUpperCase();
  }

  function renderPersonLink(person, label){
    if (!person) return "Unknown";
    return renderEntityLink("person", person.id, label || person.name);
  }

  function renderBusinessLink(business, label){
    if (!business) return "Unknown";
    return renderEntityLink("business", business.id, label || business.name);
  }

  function renderLogoSymbol(logo, fillPrimary, fillSecondary, accent){
    var archetype = logo && logo.archetype ? logo.archetype : "monogram";
    var rounded = logo && logo.rounded;
    var variant = logo && logo.variant != null ? logo.variant : 0;
    var accentIndex = logo && logo.accentIndex != null ? logo.accentIndex : 0;
    var monogram = logo && logo.monogram ? logo.monogram : "?";

    if (archetype === "bars") {
      var heights = variant % 2 === 0 ? [14, 24, 34, 44] : [20, 44, 44, 20];
      return heights.map(function(height, index){
        var width = 8;
        var gap = 4;
        var x = index * (width + gap);
        var fill = index === (accentIndex % heights.length) ? accent : (index % 2 === 0 ? fillPrimary : fillSecondary);
        return "<rect x='" + x + "' y='" + (44 - height) + "' width='" + width + "' height='" + height + "' rx='" + (rounded ? 4 : 0) + "' fill='" + fill + "' opacity='" + (index === (accentIndex % heights.length) ? 1 : 0.9) + "'></rect>";
      }).join("");
    }

    if (archetype === "grid") {
      return [0, 1, 2, 3].map(function(index){
        var size = 17;
        var gap = 5;
        var x = (index % 2) * (size + gap);
        var y = Math.floor(index / 2) * (size + gap);
        var isAccent = index === (accentIndex % 4);

        if (isAccent && variant % 2 === 1) {
          return "<circle cx='" + (x + (size / 2)) + "' cy='" + (y + (size / 2)) + "' r='" + (size / 2) + "' fill='" + accent + "'></circle>";
        }

        return "<rect x='" + x + "' y='" + y + "' width='" + size + "' height='" + size + "' rx='" + (rounded ? 5 : 0) + "' fill='" + (isAccent ? accent : (index === 0 ? fillPrimary : fillSecondary)) + "' opacity='" + (isAccent ? 1 : 0.85) + "'></rect>";
      }).join("");
    }

    if (archetype === "ring") {
      if (variant % 2 === 0) {
        return [
          "<circle cx='22' cy='22' r='16' fill='none' stroke='" + fillPrimary + "' stroke-width='6'></circle>",
          "<circle cx='22' cy='22' r='16' fill='none' stroke='" + accent + "' stroke-width='6' stroke-dasharray='28 84' stroke-linecap='round' transform='rotate(" + ((accentIndex % 4) * 45) + " 22 22)'></circle>",
          "<circle cx='22' cy='22' r='7' fill='" + fillSecondary + "'></circle>"
        ].join("");
      }

      return [
        "<circle cx='22' cy='22' r='20' fill='" + fillPrimary + "'></circle>",
        "<path d='M 22 22 L 42 12 A 22 22 0 0 1 42 34 Z' fill='" + accent + "' transform='rotate(" + ((accentIndex % 4) * 45) + " 22 22)'></path>",
        "<circle cx='22' cy='22' r='9' fill='#0d1722'></circle>"
      ].join("");
    }

    if (archetype === "fold") {
      return [
        "<polygon points='2,18 18,2 36,2 20,18' fill='" + fillSecondary + "'></polygon>",
        "<polygon points='10,34 26,18 44,18 28,34' fill='" + fillPrimary + "' opacity='0.95'></polygon>",
        "<polygon points='18,18 26,18 17,27 9,27' fill='" + accent + "'></polygon>"
      ].join("");
    }

    if (archetype === "overlap") {
      if (variant % 2 === 0) {
        return [
          "<circle cx='15' cy='22' r='11' fill='" + fillPrimary + "' opacity='0.94'></circle>",
          "<circle cx='29' cy='22' r='11' fill='" + fillSecondary + "' opacity='0.92'></circle>",
          "<rect x='17' y='15' width='10' height='14' rx='5' fill='" + accent + "' opacity='0.95'></rect>"
        ].join("");
      }

      return [
        "<rect x='6' y='10' width='18' height='24' rx='" + (rounded ? 8 : 2) + "' fill='" + fillPrimary + "' opacity='0.94'></rect>",
        "<rect x='20' y='10' width='18' height='24' rx='" + (rounded ? 8 : 2) + "' fill='" + fillSecondary + "' opacity='0.92'></rect>",
        "<rect x='18' y='16' width='8' height='12' rx='4' fill='" + accent + "' opacity='0.95'></rect>"
      ].join("");
    }

    if (archetype === "chevron") {
      return [
        "<path d='M 4 12 L 16 12 L 22 22 L 10 22 Z' fill='" + fillPrimary + "' opacity='0.95'></path>",
        "<path d='M 14 12 L 26 12 L 32 22 L 20 22 Z' fill='" + fillSecondary + "' opacity='0.9'></path>",
        "<path d='M 24 12 L 36 12 L 42 22 L 30 22 Z' fill='" + accent + "' opacity='0.95'></path>",
        "<path d='M 8 25 L 20 25 L 26 35 L 14 35 Z' fill='" + fillSecondary + "' opacity='0.9'></path>",
        "<path d='M 18 25 L 30 25 L 36 35 L 24 35 Z' fill='" + fillPrimary + "' opacity='0.95'></path>"
      ].join("");
    }

    if (archetype === "wave") {
      return [
        "<path d='M 2 16 C 8 8, 16 8, 22 16 C 28 24, 36 24, 42 16' fill='none' stroke='" + fillPrimary + "' stroke-width='" + (3 + (variant % 2)) + "' stroke-linecap='round'></path>",
        "<path d='M 2 28 C 8 20, 16 20, 22 28 C 28 36, 36 36, 42 28' fill='none' stroke='" + fillSecondary + "' stroke-width='3' stroke-linecap='round' opacity='0.9'></path>",
        "<circle cx='" + (10 + (accentIndex % 4) * 8) + "' cy='22' r='3.2' fill='" + accent + "'></circle>"
      ].join("");
    }

    if (archetype === "orbit") {
      return [
        "<circle cx='22' cy='22' r='8' fill='" + fillPrimary + "'></circle>",
        "<ellipse cx='22' cy='22' rx='16' ry='7.5' fill='none' stroke='" + fillSecondary + "' stroke-width='2.8' opacity='0.92' transform='rotate(" + ((variant % 4) * 22) + " 22 22)'></ellipse>",
        "<ellipse cx='22' cy='22' rx='16' ry='7.5' fill='none' stroke='" + accent + "' stroke-width='2' stroke-dasharray='16 16' opacity='0.95' transform='rotate(" + (45 + (accentIndex % 4) * 22) + " 22 22)'></ellipse>",
        "<circle cx='35' cy='22' r='2.6' fill='" + accent + "'></circle>"
      ].join("");
    }

    if (archetype === "prism") {
      return [
        "<polygon points='6,32 20,8 34,32' fill='" + fillPrimary + "' opacity='0.92'></polygon>",
        "<polygon points='20,8 34,32 38,24 24,2' fill='" + fillSecondary + "' opacity='0.9'></polygon>",
        "<polygon points='14,20 20,10 26,20' fill='" + accent + "' opacity='0.96'></polygon>"
      ].join("");
    }

    return [
      (logo && logo.frame === "circle" ? "<circle cx='22' cy='22' r='18' fill='" + fillPrimary + "'></circle>" : ""),
      (logo && logo.frame === "square" ? "<rect x='5' y='5' width='34' height='34' rx='" + (rounded ? 8 : 0) + "' fill='" + fillPrimary + "'></rect>" : ""),
      (logo && logo.frame === "diamond" ? "<polygon points='22,4 40,22 22,40 4,22' fill='" + fillPrimary + "'></polygon>" : ""),
      "<text x='22' y='22' font-family='Barlow Condensed, sans-serif' font-size='21' font-weight='700' fill='#f7fafc' text-anchor='middle' dominant-baseline='middle'>" + monogram + "</text>",
      (variant % 2 === 0 ? "<circle cx='31.5' cy='31.5' r='3.2' fill='" + accent + "'></circle>" : "")
    ].join("");
  }

  function renderBusinessLogoSvg(business, size, contextKey){
    var logo = business && business.logo ? business.logo : {
      archetype:"monogram",
      palette:{ primary:"#4a9edd", secondary:"#00d4ff", accent:"#f5a623" },
      rounded:true,
      variant:0,
      rotation:0,
      accentIndex:0,
      useGradient:true,
      frame:"circle",
      halo:true,
      texture:"clean",
      strokeWeight:1,
      regionMark:(business && business.countryISO ? String(business.countryISO).slice(0, 2).toUpperCase() : "WW"),
      monogram:(business && business.name ? App.utils.getBusinessMonogram(business.name) : "?")
    };
    var palette = logo.palette || {};
    var suffix = (business && business.id ? business.id : "fallback") + "-" + (contextKey || "default") + "-" + size;
    var primaryId = "blogo-p-" + suffix;
    var secondaryId = "blogo-s-" + suffix;
    var fillPrimary = logo.useGradient ? "url(#" + primaryId + ")" : palette.primary;
    var fillSecondary = logo.useGradient ? "url(#" + secondaryId + ")" : palette.secondary;
    var rotation = (logo.archetype === "ring" || logo.archetype === "fold") ? (logo.rotation || 0) : 0;
    var texture = logo.texture || "clean";
    var frameRadius = logo.rounded ? 12 : 9;
    var edgeStroke = Math.max(1, Number(logo.strokeWeight) || 1);
    var badge = (logo.regionMark || "").slice(0, 2).toUpperCase();

    return [
      "<svg class='blogo-svg' viewBox='0 0 44 44' width='" + size + "' height='" + size + "' aria-hidden='true'>",
      "<defs>",
      "<radialGradient id='blogo-bg-" + suffix + "' cx='30%' cy='25%' r='85%'>",
      "<stop offset='0%' stop-color='rgba(255,255,255,0.12)'></stop>",
      "<stop offset='100%' stop-color='#0b131d'></stop>",
      "</radialGradient>",
      "<linearGradient id='" + primaryId + "' x1='0%' y1='0%' x2='100%' y2='100%'>",
      "<stop offset='0%' stop-color='" + palette.primary + "'></stop>",
      "<stop offset='100%' stop-color='" + palette.accent + "'></stop>",
      "</linearGradient>",
      "<linearGradient id='" + secondaryId + "' x1='100%' y1='0%' x2='0%' y2='100%'>",
      "<stop offset='0%' stop-color='" + palette.secondary + "'></stop>",
      "<stop offset='100%' stop-color='" + palette.primary + "'></stop>",
      "</linearGradient>",
      "</defs>",
      "<rect x='2' y='2' width='40' height='40' rx='" + frameRadius + "' fill='url(#blogo-bg-" + suffix + ")' stroke='rgba(190,210,225,0.18)' stroke-width='" + edgeStroke + "'></rect>",
      (logo.halo ? "<circle cx='22' cy='22' r='18' fill='none' stroke='" + palette.accent + "' stroke-opacity='0.18' stroke-width='1.2'></circle>" : ""),
      (texture === "scanline" ? "<g opacity='0.12'><path d='M 4 10 L 40 10 M 4 16 L 40 16 M 4 22 L 40 22 M 4 28 L 40 28 M 4 34 L 40 34' stroke='rgba(190,210,225,0.7)' stroke-width='0.8'></path></g>" : ""),
      (texture === "grain" ? "<g opacity='0.12'><circle cx='10' cy='11' r='0.8' fill='#fff'></circle><circle cx='17' cy='8' r='0.7' fill='#fff'></circle><circle cx='31' cy='13' r='0.9' fill='#fff'></circle><circle cx='14' cy='31' r='0.8' fill='#fff'></circle><circle cx='30' cy='30' r='0.7' fill='#fff'></circle></g>" : ""),
      "<g transform='translate(4 4) scale(0.82)'>",
      "<g transform='rotate(" + rotation + " 22 22)'>",
      renderLogoSymbol(logo, fillPrimary, fillSecondary, palette.accent),
      "</g>",
      "</g>",
      (badge ? "<rect x='27.8' y='28.2' width='12.2' height='9.8' rx='3' fill='rgba(8,18,30,0.86)' stroke='rgba(190,210,225,0.22)'></rect>" : ""),
      (badge ? "<text x='33.9' y='33.3' font-family='Share Tech Mono, monospace' font-size='4.3' font-weight='700' fill='#d8e7f7' text-anchor='middle' dominant-baseline='middle'>" + badge + "</text>" : ""),
      "</svg>"
    ].join("");
  }

  function renderBusinessLockup(business, titleHtml, subtitleHtml, size, contextKey, className){
    return [
      "<div class='brand-lockup " + (className || "") + "'>",
      "<div class='blogo-wrap'>" + renderBusinessLogoSvg(business, size, contextKey) + "</div>",
      "<div class='brand-copy'>",
      titleHtml,
      subtitleHtml,
      "</div>",
      "</div>"
    ].join("");
  }

  function formatDecisionValue(value){
    return DECISION_LABELS[value] || value || "Unknown";
  }

  function getGenderClass(person){
    return person && person.sex === "female" ? "female" : "male";
  }

  function getGenderSymbol(person){
    return person && person.sex === "female" ? "&#9792;" : "&#9794;";
  }

  function getGenderLabel(person){
    return person && person.sex === "female" ? "Female" : "Male";
  }

  function getDominantProfileTags(person){
    if (!person || !person.decisionProfile) return [];

    return Object.keys(PROFILE_LABELS).map(function(key){
      return {
        label:person.decisionProfile[key] >= 50 ? PROFILE_LABELS[key].high : PROFILE_LABELS[key].low,
        weight:Math.abs((person.decisionProfile[key] || 50) - 50)
      };
    }).sort(function(first, second){
      return second.weight - first.weight;
    }).slice(0, 3).map(function(entry){
      return entry.label;
    });
  }

  function getStateTags(person){
    var tags = [];

    if (!person || !person.temporaryStates) return tags;

    if (person.temporaryStates.confidence >= 62) tags.push("Confident");
    if (person.temporaryStates.stress >= 58) tags.push("Stressed");
    if (person.temporaryStates.burnout >= 55) tags.push("Burned Out");
    if (person.temporaryStates.grief >= 20) tags.push("Grieving");
    if (person.temporaryStates.resentment >= 25) tags.push("Resentful");
    if (person.temporaryStates.ambitionSpike >= 60) tags.push("Driven");

    return tags.slice(0, 3);
  }

  function isDecisionFigure(person){
    var associatedBusiness = App.store.getAssociatedBusiness(person);

    if (!person) return false;
    return !!(person.businessId || (App.store.isBusinessLeader && App.store.isBusinessLeader(person)) || (associatedBusiness && associatedBusiness.founderId === person.id));
  }

  function renderDecisionProfile(person){
    var profileTags = getDominantProfileTags(person);
    var stateTags = getStateTags(person);

    if (!isDecisionFigure(person)) return "";

    return [
      "<div class='mc'>",
      "<div class='mcl'>Decision Profile</div>",
      profileTags.length ? "<div class='traits decision-tags'>" + profileTags.map(function(tag){
        return "<span class='trait decision-trait'>" + tag + "</span>";
      }).join("") + "</div>" : "<div class='country-note'>No strong decision profile yet.</div>",
      stateTags.length ? "<div class='traits decision-tags'>" + stateTags.map(function(tag){
        return "<span class='trait state-trait'>" + tag + "</span>";
      }).join("") + "</div>" : "<div class='country-note'>No acute temporary states.</div>",
      "</div>"
    ].join("");
  }

  function renderDecisionCore(business){
    var decision = business.currentDecision;
    var repClass = (business.reputation || 0) >= 70 ? "g" : ((business.reputation || 0) >= 45 ? "a" : "r");

    if (!decision) return "";

    return [
      "<div class='mc'>",
      "<div class='mcl'>Decision Core</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Reputation</div><div class='sv " + repClass + "'>" + Math.round(business.reputation || 0) + "/100</div></div>",
      "<div class='sbox'><div class='sl'>Cash Reserves</div><div class='sv c'>" + App.utils.fmtGU(business.cashReservesGU || 0) + "</div></div>",
      "<div class='sbox'><div class='sl'>Stance</div><div class='sv b'>" + formatDecisionValue(decision.stance) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Staffing</div><div class='sv a'>" + formatDecisionValue(decision.staffingAction) + "</div></div>",
      "<div class='sbox'><div class='sl'>Cash Policy</div><div class='sv c'>" + formatDecisionValue(decision.cashPolicy) + "</div></div>",
      "<div class='sbox'><div class='sl'>Succession Bias</div><div class='sv b'>" + formatDecisionValue(decision.successionBias) + "</div></div>",
      "</div>",
      (decision.traitEffects && decision.traitEffects.length ? ("<div class='traits decision-tags'>" + renderTraitEffectTags(decision.traitEffects, "trait decision-trait") + "</div>") : ""),
      (decision.reasons && decision.reasons.length ? "<div class='decision-note'>" + decision.reasons.map(function(reason){
        return "<div class='decision-line'>" + reason + "</div>";
      }).join("") + "</div>" : ""),
      (decision.influencers && decision.influencers.length ? "<div class='decision-influencers'>" + decision.influencers.map(function(influencer){
        var person = App.store.getPerson(influencer.personId);
        return "<div class='decision-influencer'><span>" + renderPersonLink(person) + "</span><span>" + influencer.title + " • " + influencer.weight + "%</span></div>";
      }).join("") + "</div>" : ""),
      "</div>"
    ].join("");
  }

  function renderDecisionHistory(business){
    var history = (business.decisionHistory || []).slice(0, 6);

    return [
      "<div class='mc'>",
      "<div class='mcl'>Recent Decisions</div>",
      history.length ? history.map(function(entry){
        return [
          "<div class='rrow decision-row'>",
          "<div>",
          "<div class='rname'>" + (entry.summary || "Decision recorded") + "</div>",
          "<div class='rmeta'>" + formatDecisionValue(entry.stance) + " - " + formatDecisionValue(entry.staffingAction) + " - " + App.utils.fmtDay(entry.madeAtDay || App.store.simDay) + "</div>",
          (entry.reasons && entry.reasons.length ? "<div class='decision-line decision-line-compact'>" + entry.reasons[0] + "</div>" : ""),
          (entry.traitEffects && entry.traitEffects.length ? "<div class='traits decision-tags'>" + renderTraitEffectTags(entry.traitEffects.slice(0, 3), "trait state-trait") + "</div>" : ""),
          "</div>",
          "<div class='rwealth'>" + formatDecisionValue(entry.cashPolicy) + "</div>",
          "</div>"
        ].join("");
      }).join("") : "<div class='country-note'>No recent decisions yet.</div>",
      "</div>"
    ].join("");
  }

  function renderPeopleList(){
    var html;

    syncPeopleTabs();

    if (activePeopleTab === "companies") {
      html = App.store.businesses.slice().sort(function(first, second){
        return (Number(second.valuationGU) || 0) - (Number(first.valuationGU) || 0);
      }).map(function(business){
        var bloc = App.store.getBloc(business.blocId);
        var countryFlag = App.utils.getCountryFlag(business.countryISO) || (bloc ? bloc.flag : "");
        var owner = App.store.getPerson(business.ownerId);
        var selected = App.store.selection.type === "business" && App.store.selection.id === business.id;
        var valuationClass = (Number(business.profitGU) || 0) >= 0 ? "wp" : "wn";

        return [
          "<div class='pr " + (selected ? "sel" : "") + "' data-business-id='" + business.id + "'>",
          "<div class='prn'><span>" + countryFlag + " " + business.name + "</span><span class='st s-" + (business.stage || "growing") + "'>" + (business.stage || "growth") + "</span></div>",
          "<div class='prb'>" + (business.industry || "Business") + " - " + App.store.getCountryName(business.countryISO) + "</div>",
          "<div class='prm'>Owner: " + (owner ? owner.name : "Unknown") + " | Employees: " + (business.employees || 0) + "</div>",
          "<div class='prw " + valuationClass + "'>" + App.utils.fmtCountry(business.valuationGU, business.countryISO) + "</div>",
          "</div>"
        ].join("");
      }).join("");

      document.getElementById("plist").innerHTML = html || "<div class='empty'><div class='big'>BIZ</div><div>No companies yet.</div></div>";
      return;
    }

    html = App.store.getVisiblePeople().map(function(person){
      var bloc = App.store.getBloc(person.blocId);
      var countryFlag = App.utils.getCountryFlag(person.countryISO) || bloc.flag;
      var business = App.store.getAssociatedBusiness(person);
      var currency = App.utils.getCurrency(person.countryISO);
      var selected = App.store.selection.type === "person" && App.store.selection.id === person.id;
      var roles = App.utils.getPersonRoles(person);
      return [
        "<div class='pr " + (selected ? "sel" : "") + "' data-person-id='" + person.id + "'>",
        "<div class='prn'><span>" + countryFlag + " " + person.name + "</span><span class='st s-" + person.status + "'>" + person.status + "</span></div>",
        "<div class='prb'>" + App.utils.locationLabel(person, true) + " - " + currency.sym + " " + currency.code + (business ? " - " + business.name : " - independent") + "</div>",
        "<div class='prbadges'>" + renderBadgeRow([App.utils.getLifeStageLabel(person)], "lbadge") + renderBadgeRow(roles, "rbadge") + "</div>",
        "<div class='prw " + (person.netWorthGU >= 0 ? "wp" : "wn") + "'>" + App.utils.fmtCountry(person.netWorthGU, person.countryISO) + "</div>",
        "</div>"
      ].join("");
    }).join("");

    document.getElementById("plist").innerHTML = html;
  }

  function renderRelativeList(title, relatives, emptyText){
    return [
      "<div class='mc'>",
      "<div class='mcl'>" + title + "</div>",
      relatives.length ? relatives.map(function(relative){
        var summary = [
          "AGE " + App.utils.displayAge(relative),
          App.utils.getLifeStageLabel(relative).toUpperCase()
        ];

        if (!relative.alive) {
          summary.push("DECEASED");
        } else if (relative.retired) {
          summary.push("RETIRED");
        }

        return [
          "<div class='rrow' data-person-id='" + relative.id + "'>",
          "<div>",
          "<div class='rname'>" + relative.name + "</div>",
          "<div class='rmeta'>" + summary.join(" - ") + "</div>",
          "</div>",
          "<div class='rwealth'>" + App.utils.fmtCountry(relative.netWorthGU, relative.countryISO) + "</div>",
          "</div>"
        ].join("");
      }).join("") : "<div class='country-note'>" + emptyText + "</div>",
      "</div>"
    ].join("");
  }

  function renderLeadershipList(title, leadership, emptyText){
    return [
      "<div class='mc'>",
      "<div class='mcl'>" + title + "</div>",
      leadership.length ? leadership.map(function(entry){
        var person = entry.person;
        var states = getStateTags(person);
        var meta = [
          entry.title,
          "AGE " + App.utils.displayAge(person),
          App.utils.getLifeStageLabel(person).toUpperCase()
        ];

        if (person.retired) meta.push("RETIRED");

        return [
          "<div class='rrow' data-person-id='" + person.id + "'>",
          "<div>",
          "<div class='rname'>" + person.name + "</div>",
          "<div class='rmeta'>" + meta.join(" - ") + "</div>",
          (states.length ? "<div class='traits leadership-states'>" + states.map(function(tag){
            return "<span class='trait state-trait'>" + tag + "</span>";
          }).join("") + "</div>" : ""),
          "</div>",
          "<div class='rwealth'>" + App.utils.fmtCountry(person.netWorthGU, person.countryISO) + "</div>",
          "</div>"
        ].join("");
      }).join("") : "<div class='country-note'>" + emptyText + "</div>",
      "</div>"
    ].join("");
  }

  function renderCountryBusinessList(businesses){
    return [
      "<div class='mc'>",
      "<div class='mcl'>Business Directory</div>",
      businesses.length ? businesses.map(function(business){
        var ceo = App.store.getBusinessLeader(business, "ceo");
        var selected = App.store.selection.type === "business" && App.store.selection.id === business.id;
        var meta = [
          business.industry,
          business.stage.toUpperCase()
        ];

        if (ceo && ceo.person) {
          meta.push("CEO " + ceo.person.name);
        }

        return [
          "<div class='rrow " + (selected ? "sel" : "") + "' data-business-id='" + business.id + "'>",
          "<div>",
          "<div class='rname'>" + business.name + "</div>",
          "<div class='rmeta'>" + meta.join(" - ") + "</div>",
          "</div>",
          "<div class='rwealth'>" + App.utils.fmtCountry(business.valuationGU, business.countryISO) + "</div>",
          "</div>"
        ].join("");
      }).join("") : "<div class='country-note'>No businesses are currently operating from this country.</div>",
      "</div>"
    ].join("");
  }

  function renderBusinessCard(business, countryISO, currency, bloc){
    var founder = App.store.getPerson(business.founderId);
    var owner = App.store.getPerson(business.ownerId);
    var ceo = App.store.getBusinessLeader(business, "ceo");
    var leadership = App.store.getBusinessLeadership(business);
    var subtitle = "<div class='bci'>" + business.industry + " - " + business.stage.toUpperCase() + " - " + currency.sym + " " + currency.code + "</div>";

    return [
      "<div class='bc'>",
      renderBusinessLockup(
        business,
        "<div class='bcn'>" + renderBusinessLink(business, business.name) + "</div>",
        subtitle,
        42,
        "card",
        "brand-lockup-card"
      ),
      "<div class='brow'>Revenue<span>" + App.utils.fmtCountry(business.revenueGU, countryISO) + "/yr</span></div>",
      "<div class='brow'>Revenue (GU)<span>" + App.utils.fmtGU(business.revenueGU) + "</span></div>",
      "<div class='brow'>Profit<span style='color:" + (business.profitGU >= 0 ? "var(--green)" : "var(--red)") + "'>" + App.utils.fmtCountry(business.profitGU, countryISO) + "</span></div>",
      "<div class='brow'>Valuation<span>" + App.utils.fmtCountry(business.valuationGU, countryISO) + "</span></div>",
      "<div class='brow'>Employees<span>" + business.employees + "</span></div>",
      "<div class='brow'>Reputation<span>" + Math.round(business.reputation || 0) + "/100</span></div>",
      (business.currentDecision ? "<div class='brow'>Current Stance<span>" + formatDecisionValue(business.currentDecision.stance) + "</span></div>" : ""),
      "<div class='brow'>Leadership<span>" + leadership.length + "</span></div>",
      "<div class='brow'>Founder<span>" + renderPersonLink(founder) + "</span></div>",
      "<div class='brow'>Owner<span>" + renderPersonLink(owner) + "</span></div>",
      "<div class='brow'>CEO<span>" + renderPersonLink(ceo && ceo.person ? ceo.person : owner) + "</span></div>",
      "<div class='brow'>Founded<span>" + App.utils.fmtDay(business.foundedDay != null ? business.foundedDay : App.store.simDay) + "</span></div>",
      "<div class='brow'>Succession Count<span>" + business.successionCount + "</span></div>",
      "</div>",
      "<div class='mc'><div class='mcl'>Revenue History</div><canvas id='rch' height='50'></canvas></div>",
      "<div class='mc'><div class='mcl'>" + bloc.currency + " Strength</div><canvas id='fch' height='50'></canvas></div>"
    ].join("");
  }

  function renderHouseholdSummary(person){
    var household = App.store.getPersonHousehold ? App.store.getPersonHousehold(person) : null;
    var profile = App.store.getCountryProfile ? App.store.getCountryProfile(person.countryISO) : null;
    var members;
    var housingBurden;
    var childcareBurden;
    var mobilityLabel;
    var stressClass;
    var pressureLabel = "balanced";

    if (!household) {
      return "<div class='mc'><div class='mcl'>Household Economy</div><div class='country-note'>Household data is still being assembled.</div></div>";
    }

    members = (household.adultIds || []).length + (household.childIds || []).length;
    housingBurden = household.monthlyExpensesGU > 0 ? Math.round(((household.housingCostGU || 0) / household.monthlyExpensesGU) * 100) : 0;
    childcareBurden = household.monthlyExpensesGU > 0 ? Math.round(((household.childcareCostGU || 0) / household.monthlyExpensesGU) * 100) : 0;
    mobilityLabel = household.mobilityScore > 8 ? "upward" : (household.mobilityScore < -8 ? "downward" : "stable");
    stressClass = household.financialStress >= 72 ? "r" : (household.financialStress >= 48 ? "a" : "g");

    if (profile) {
      if ((profile.populationPressure || 0.5) >= 0.62) {
        pressureLabel = "high-cost pressure";
      } else if ((profile.populationPressure || 0.5) <= 0.42) {
        pressureLabel = "lighter pressure";
      }
    }

    return [
      "<div class='mc'>",
      "<div class='mcl'>Household Economy</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Members</div><div class='sv b'>" + members + "</div></div>",
      "<div class='sbox'><div class='sl'>Class Tier</div><div class='sv a'>" + String(household.classTier || "working").toUpperCase() + "</div></div>",
      "<div class='sbox'><div class='sl'>Mobility</div><div class='sv c'>" + mobilityLabel.toUpperCase() + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Monthly Income</div><div class='sv g'>" + App.utils.fmtCountry(household.monthlyIncomeGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Monthly Expenses</div><div class='sv " + ((household.monthlyExpensesGU || 0) > (household.monthlyIncomeGU || 0) ? "r" : "a") + "'>" + App.utils.fmtCountry(household.monthlyExpensesGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Stress</div><div class='sv " + stressClass + "'>" + Math.round(household.financialStress || 0) + "/100</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Cash</div><div class='sv c'>" + App.utils.fmtCountry(household.cashOnHandGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Debt</div><div class='sv " + ((household.debtGU || 0) > 0 ? "r" : "g") + "'>" + App.utils.fmtCountry(household.debtGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Inheritance Pressure</div><div class='sv a'>" + App.utils.fmtCountry(household.inheritancePressureGU || 0, person.countryISO) + "</div></div>",
      "</div>",
      "<div class='country-note'>Housing burden: <strong>" + housingBurden + "%</strong> of monthly costs. Childcare burden: <strong>" + childcareBurden + "%</strong>.</div>",
      (profile ? "<div class='country-note'>Median wage in " + App.store.getCountryName(person.countryISO) + ": <strong>" + App.utils.fmtCountry(profile.medianWageGU || 0, person.countryISO) + "</strong>. Household context currently reads as <strong>" + pressureLabel + "</strong>.</div>" : ""),
      "</div>"
    ].join("");
  }

  function renderPortfolioSummary(person){
    var summary = App.store.getPersonPortfolioSummary ? App.store.getPersonPortfolioSummary(person.id) : { holdings:0, totalShares:0, marketValueGU:0, annualDividendGU:0 };
    var holdings = App.store.getPersonPortfolio ? App.store.getPersonPortfolio(person.id).slice(0, 5) : [];

    return [
      "<div class='mc'>",
      "<div class='mcl'>Portfolio</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Holdings</div><div class='sv b'>" + (summary.holdings || 0) + "</div></div>",
      "<div class='sbox'><div class='sl'>Market Value</div><div class='sv c'>" + App.utils.fmtCountry(summary.marketValueGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Annual Dividends</div><div class='sv " + ((summary.annualDividendGU || 0) > 0 ? "g" : "a") + "'>" + App.utils.fmtCountry(summary.annualDividendGU || 0, person.countryISO) + "</div></div>",
      "</div>",
      (holdings.length ? ("<div class='rl'>" + holdings.map(function(holding){
        var yieldPct = holding.marketValueGU > 0 ? ((holding.annualDividendGU || 0) / holding.marketValueGU) * 100 : 0;
        return [
          "<button class='row rel' data-entity='business' data-id='" + holding.business.id + "'>",
          "<div class='ri'><div class='rname'>" + holding.business.name + " (" + (holding.listing && holding.listing.symbol ? holding.listing.symbol : "-") + ")</div>",
          "<div class='rmeta'>" + (holding.shares || 0).toLocaleString() + " shares | yield " + yieldPct.toFixed(1) + "%</div></div>",
          "<div class='rwealth'>" + App.utils.fmtCountry(holding.marketValueGU || 0, person.countryISO) + "</div>",
          "</button>"
        ].join("");
      }).join("") + "</div>") : "<div class='country-note'>No public equity holdings yet.</div>"),
      "</div>"
    ].join("");
  }

  function renderPersonDetail(person){
    var el = document.getElementById("dc");
    var bloc = App.store.getBloc(person.blocId);
    var countryFlag = App.utils.getCountryFlag(person.countryISO);
    var ownedBusiness = App.store.getBusiness(person.businessId);
    var business = App.store.getAssociatedBusiness(person);
    var employmentBusiness = App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var profile = App.store.getCountryProfile ? App.store.getCountryProfile(person.countryISO) : null;
    var currency = App.utils.getCurrency(person.countryISO);
    var location = App.utils.locationLabel(person, false);
    var birthDay = person.birthDay != null ? person.birthDay : App.store.simDay;
    var fxChange = bloc.prevRate ? ((bloc.rate - bloc.prevRate) / bloc.prevRate) * 100 : 0;
    var fxDir = fxChange >= 0 ? "d" : "u";
    var spouse = App.store.getSpouse(person);
    var mentor = person.mentorId ? App.store.getPerson(person.mentorId) : null;
    var parents = App.store.getParents(person);
    var children = App.store.getChildren(person, true).slice().sort(function(first, second){
      return second.age - first.age;
    });
    var formerSpouses = (person.formerSpouseIds || []).map(function(id){
      return App.store.getPerson(id);
    }).filter(Boolean);
    var estrangedChildren = (person.estrangedChildIds || []).map(function(id){
      return App.store.getPerson(id);
    }).filter(Boolean);
    var estrangedParents = (person.estrangedParentIds || []).map(function(id){
      return App.store.getPerson(id);
    }).filter(Boolean);
    var rivals = (person.rivalIds || []).map(function(id){ return App.store.getPerson(id); }).filter(Boolean).slice(0, 6);
    var closeFriends = (person.closeFriendIds || []).map(function(id){ return App.store.getPerson(id); }).filter(Boolean).slice(0, 8);
    var eliteCircle = (person.eliteCircleIds || []).map(function(id){ return App.store.getPerson(id); }).filter(Boolean).slice(0, 6);
    var schoolTies = (person.schoolTieIds || []).map(function(id){ return App.store.getPerson(id); }).filter(Boolean).slice(0, 8);
    var nepotismTies = (person.nepotismTieIds || []).map(function(id){ return App.store.getPerson(id); }).filter(Boolean).slice(0, 8);
    var personalRep = person.personalReputation || { trust:50, prestige:35, notoriety:12, scandalMemory:0 };
    var retirementTypeLabel = person.retirementType ? String(person.retirementType).replace(/_/g, " ").toUpperCase() : "UNSPECIFIED";
    var lifecycleStageLabel = String(person.workerLifecycleStage || "dependent").replace(/_/g, " ").toUpperCase();
    var occupationLabel = String(person.occupationCategory || "dependent").replace(/_/g, " ").toUpperCase();
    var heir = ownedBusiness && App.sim.getPotentialHeir ? App.sim.getPotentialHeir(person) : null;
    var traitSnapshot = (person.lastTraitEffects && person.lastTraitEffects.length) ? person.lastTraitEffects : ((business && business.currentDecision && business.currentDecision.traitEffects) ? business.currentDecision.traitEffects : []);
    var skills = person.skills || {};
    var skillAverage = Math.round(((Number(skills.management) || 0) + (Number(skills.technical) || 0) + (Number(skills.social) || 0) + (Number(skills.financialDiscipline) || 0) + (Number(skills.creativity) || 0)) / 5);
    var educationScore = Math.round(Number(person.educationIndex) || 0);
    var educationAttainment = String(person.educationAttainment || "none").toUpperCase();
    var credentialLabel = String(person.educationCredentialLabel || "No Formal Qualification");
    var institutionType = String(person.educationInstitutionType || (educationScore >= 75 ? "university" : "school"));
    var institutionSector = String(person.educationInstitutionSector || "public");
    var educationCourse = String(person.educationCourseLabel || "General Studies");
    var institutionName = String(person.educationInstitutionName || (institutionType === "university" ? "National University" : "Local Public School"));
    var institutionQuality = Math.round(Number(person.educationInstitutionQuality));
    var institutionContext = profile ? Math.round((Number(profile.institutionScore) || 0.55) * 100) : null;
    var educationTipTitle = credentialLabel + " - " + educationScore + "/100";
    var educationTipBody = [
      "Attainment: " + educationAttainment,
      "Course Completed: " + educationCourse,
      "Institution: " + institutionName,
      "Institution Type: " + formatInstitutionTypeLabel(institutionType),
      "Institution Sector: " + institutionSector.toUpperCase(),
      "Institution Quality: " + (Number.isFinite(institutionQuality) ? institutionQuality + "/100" : "--"),
      "Country Institution Context: " + (institutionContext != null ? institutionContext + "/100" : "--"),
      "Higher prestige raises leadership hiring and promotion odds."
    ].join(" | ");
    var notes = [
      "AGE " + App.utils.displayAge(person),
      App.utils.getLifeStageLabel(person).toUpperCase()
    ];
    var genderClass = getGenderClass(person);
    var genderSymbol = getGenderSymbol(person);
    var genderLabel = getGenderLabel(person);

    if (person.retired) notes.push("RETIRED");
    if (person.retired && person.retirementType) notes.push(retirementTypeLabel);
    if (!person.alive) notes.push("DIED " + App.utils.fmtDay(person.deathDay || App.store.simDay));

    el.innerHTML = [
      "<div class='cban' style='background:" + bloc.color + ";border:1px solid " + bloc.label + "40'>",
      "<div class='cflag'>" + countryFlag + "</div>",
      "<div class='cinfo'>",
      "<div class='cname2' style='color:" + bloc.label + "'>" + location + "</div>",
      "<div class='cfx'>" + currency.sym + " " + currency.code + " - " + currency.name +
      " <span class='fbadge fb" + fxDir + "'>" + (fxDir === "u" ? "&#9650; APPR." : "&#9660; DEPR.") + "</span></div>",
      "</div></div>",
      "<div>",
      "<div class='dname'>" + person.name + "</div>",
      "<div class='dtitle'>" + notes.join(" - ") + "</div>",
      "<div class='country-note'>Born: <strong>" + App.utils.fmtDay(birthDay) + "</strong></div>",
      (person.nativeDisplayName ? "<div class='country-note'>Other name: <strong>" + person.nativeDisplayName + "</strong></div>" : ""),
      (employmentBusiness && person.jobTitle ? "<div class='country-note'>Current role: <strong>" + person.jobTitle + "</strong> at " + renderBusinessLink(employmentBusiness) + ".</div>" : ""),
      "<div class='prbadges detail-badges'>" + renderBadgeRow(App.utils.getPersonRoles(person), "rbadge") + "</div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Net Worth (Home)</div><div class='sv " + (person.netWorthGU > 30000 ? "g" : person.netWorthGU > 0 ? "a" : "r") + "'>" + App.utils.fmtCountry(person.netWorthGU, person.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Net Worth (GU)</div><div class='sv c'>" + App.utils.fmtGU(person.netWorthGU) + "</div></div>",
      "<div class='sbox'><div class='sl'>Net Worth (USD)</div><div class='sv b'>" + App.utils.fmtUSD(person.netWorthGU) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Family Size</div><div class='sv b'>" + ((spouse ? 1 : 0) + children.length) + "</div></div>",
      "<div class='sbox'><div class='sl'>Lineage</div><div class='sv a'>" + person.lineageId.split("-")[0].toUpperCase() + "</div></div>",
      "<div class='sbox'><div class='sl'>Gender</div><div class='sv gender-" + genderClass + "'>" + genderSymbol + " " + genderLabel + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Trust</div><div class='sv " + (personalRep.trust >= 65 ? "g" : (personalRep.trust >= 45 ? "a" : "r")) + "'>" + Math.round(personalRep.trust) + "/100</div></div>",
      "<div class='sbox'><div class='sl'>Prestige</div><div class='sv " + (personalRep.prestige >= 62 ? "g" : (personalRep.prestige >= 40 ? "a" : "r")) + "'>" + Math.round(personalRep.prestige) + "/100</div></div>",
      "<div class='sbox'><div class='sl'>Notoriety</div><div class='sv " + (personalRep.notoriety >= 60 ? "r" : "a") + "'>" + Math.round(personalRep.notoriety) + "/100</div></div>",
      "</div>",
      "<div class='country-note'>Scandal memory: <strong>" + Math.round(personalRep.scandalMemory || 0) + "/100</strong>." + (person.retired ? (" Retirement path: <strong>" + retirementTypeLabel + "</strong> (influence " + Math.round(Number(person.retirementInfluence) || 0) + "/100).") : "") + "</div>",
      "<div class='country-note'>Lifecycle stage: <strong>" + lifecycleStageLabel + "</strong>. Occupation category: <strong>" + occupationLabel + "</strong>.</div>",
      "<div class='country-note'>Sibling rivalry: <strong>" + Math.round(Number(person.siblingRivalry) || 0) + "/100</strong>. Inheritance dilution factor: <strong>x" + Math.max(1, Number(person.inheritanceDilution) || 1) + "</strong>. Shared privilege: <strong>" + Math.round(Number(person.sharedPrivilege) || 0) + "/100</strong>.</div>",
      (person.groomedForBusinessById ? "<div class='country-note'>Family business grooming: <strong>Active</strong> for succession pathway.</div>" : ""),
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Education Index", "Raw education index: " + educationScore + "/100 | " + educationTipBody) + "><div class='sl'>Education</div><div class='sv a'>" + educationScore + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Credential", educationTipBody) + "><div class='sl'>Credential</div><div class='sv c'>" + credentialLabel.toUpperCase() + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs(educationTipTitle, educationTipBody) + "><div class='sl'>Institution</div><div class='sv b'>" + institutionName + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Skill Track</div><div class='sv c'>" + String(person.skillTrack || "general").toUpperCase() + "</div></div>",
      "<div class='sbox'><div class='sl'>Human Capital</div><div class='sv b'>" + skillAverage + "/100</div></div>",
      "</div>",
      "<div class='country-note'>Skills: Mgmt <strong>" + Math.round(Number(skills.management) || 0) + "</strong>, Tech <strong>" + Math.round(Number(skills.technical) || 0) + "</strong>, Social <strong>" + Math.round(Number(skills.social) || 0) + "</strong>, Finance <strong>" + Math.round(Number(skills.financialDiscipline) || 0) + "</strong>, Creativity <strong>" + Math.round(Number(skills.creativity) || 0) + "</strong>.</div>",
      "<div class='country-note'>Education currently affects baseline earnings, leadership candidacy, and founder launch odds.</div>",
      (employmentBusiness && person.jobTitle ? "<div class='sg'><div class='sbox'><div class='sl'>Employer</div><div class='sv a'>" + renderBusinessLink(employmentBusiness, employmentBusiness.name) + "</div></div><div class='sbox'><div class='sl'>Salary (GU)</div><div class='sv c'>" + App.utils.fmtGU(person.salaryGU || 0) + "</div></div></div>" : ""),
      renderHouseholdSummary(person),
      renderPortfolioSummary(person),
      "<div class='sg'>",
      "<div class='sbox'><div class='sl'>Bloc GDP</div><div class='sv b'>" + App.utils.fmtL(bloc.gdp, bloc) + "</div></div>",
      "<div class='sbox'><div class='sl'>Geo Pressure</div><div class='sv " + (bloc.geoPressure > 1 ? "r" : "g") + "'>" + bloc.geoPressure.toFixed(1) + "</div></div>",
      "</div>",
      renderDecisionProfile(person),
      "<div class='traits'>" + (person.traits.length ? person.traits.map(function(trait){ return "<span class='trait'>" + trait + "</span>"; }).join("") : "<span class='country-note'>No defining traits yet.</span>") + "</div>",
      renderTraitEffectBlock("Recent Trait Influence", traitSnapshot, "No recent trait influence recorded."),
      renderRelativeList("Spouse", spouse ? [spouse] : [], "No spouse recorded."),
      renderRelativeList("Former Spouses", formerSpouses, "No former spouses recorded."),
      renderRelativeList("Mentor", mentor ? [mentor] : [], "No mentor link recorded."),
      renderRelativeList("Close Friends", closeFriends, "No close friends tracked."),
      renderRelativeList("School Ties", schoolTies, "No school ties tracked."),
      renderRelativeList("Elite Circle", eliteCircle, "No elite circle ties tracked."),
      renderRelativeList("Nepotism Ties", nepotismTies, "No nepotism chain tracked."),
      renderRelativeList("Rivals", rivals, "No rivals tracked."),
      renderRelativeList("Parents", parents, "No parents recorded."),
      renderRelativeList("Estranged Parents", estrangedParents, "No estranged parent ties recorded."),
      renderRelativeList("Children", children, "No children recorded."),
      renderRelativeList("Estranged Children", estrangedChildren, "No estranged child ties recorded."),
      renderRelativeList("Likely Heir", heir ? [heir] : [], ownedBusiness ? "No eligible heir yet." : "No active business to inherit."),
      business ? renderBusinessCard(business, person.countryISO, currency, bloc) : "<div class='bc' style='text-align:center;color:var(--text3);font-family:var(--mono);font-size:9px;padding:14px;'>No business yet</div>"
    ].join("");

    if (business && business.revenueHistory.length > 1) {
      drawLine(document.getElementById("rch"), business.revenueHistory, "#f5a623");
    }
    if (bloc.rateHistory.length > 1) {
      drawLine(document.getElementById("fch"), bloc.rateHistory.map(function(rate){ return 1 / rate; }), bloc.label);
    }
    bindInspectorRichTooltips(el);
  }

  function renderBusinessDetail(business){
    var el = document.getElementById("dc");
    var bloc = App.store.getBloc(business.blocId);
    var countryFlag = App.utils.getCountryFlag(business.countryISO);
    var currency = App.utils.getCurrency(business.countryISO);
    var founder = App.store.getPerson(business.founderId);
    var owner = App.store.getPerson(business.ownerId);
    var listing = App.store.getListingForBusiness ? App.store.getListingForBusiness(business.id) : null;
    var ceo = App.store.getBusinessLeader(business, "ceo");
    var leadership = App.store.getBusinessLeadership(business);
    var otherEmployees = Math.max(0, business.employees - leadership.length);
    var businessTraitEffects = (business.lastTraitEffects && business.lastTraitEffects.length) ? business.lastTraitEffects : ((business.currentDecision && business.currentDecision.traitEffects) ? business.currentDecision.traitEffects : []);
    var dividendYield = listing && listing.sharePriceGU > 0 ? ((listing.annualDividendPerShareGU || 0) / listing.sharePriceGU) * 100 : 0;
    var floatShares = listing ? Math.max(0, (listing.totalShares || 0) - (listing.treasuryShares || 0) - ((listing.sharesByHolder && owner) ? (listing.sharesByHolder[owner.id] || 0) : 0)) : 0;
    var holderCount = listing && listing.sharesByHolder ? Object.keys(listing.sharesByHolder).length : 0;

    el.innerHTML = [
      "<div class='cban' style='background:" + bloc.color + ";border:1px solid " + bloc.label + "40'>",
      "<div class='cflag'>" + countryFlag + "</div>",
      "<div class='cinfo'>",
      "<div class='cname2' style='color:" + bloc.label + "'>" + App.store.getCountryName(business.countryISO) + "</div>",
      "<div class='cfx'>" + currency.sym + " " + currency.code + " - " + currency.name + " - " + business.industry + "</div>",
      "</div></div>",
      renderBusinessLockup(
        business,
        "<div class='dname'>" + business.name + "</div>",
        "<div class='dtitle'>" + business.stage.toUpperCase() + " - AGE " + (Number.isFinite(Number(business.age)) ? Number(business.age).toFixed(1) : "0.0") + " YRS</div>",
        58,
        "detail",
        "brand-lockup-hero"
      ),
      "<div class='country-note'>Founded: <strong>" + App.utils.fmtDay(business.foundedDay != null ? business.foundedDay : App.store.simDay) + "</strong></div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Revenue</div><div class='sv b'>" + App.utils.fmtCountry(business.revenueGU, business.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Profit</div><div class='sv " + (business.profitGU >= 0 ? "g" : "r") + "'>" + App.utils.fmtCountry(business.profitGU, business.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Valuation</div><div class='sv a'>" + App.utils.fmtCountry(business.valuationGU, business.countryISO) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Employees</div><div class='sv c'>" + business.employees + "</div></div>",
      "<div class='sbox'><div class='sl'>Leadership</div><div class='sv b'>" + leadership.length + "</div></div>",
      "<div class='sbox'><div class='sl'>Reputation</div><div class='sv " + ((business.reputation || 0) >= 70 ? "g" : ((business.reputation || 0) >= 45 ? "a" : "r")) + "'>" + Math.round(business.reputation || 0) + "/100</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Named Leaders</div><div class='sv b'>" + leadership.length + "</div></div>",
      "<div class='sbox'><div class='sl'>Other Staff</div><div class='sv a'>" + otherEmployees + "</div></div>",
      "<div class='sbox'><div class='sl'>Cash Reserves</div><div class='sv c'>" + App.utils.fmtCountry(business.cashReservesGU || 0, business.countryISO) + "</div></div>",
      "</div>",
      (listing ? [
        "<div class='sg sg3'>",
        "<div class='sbox'><div class='sl'>Listed</div><div class='sv g'>YES (" + listing.symbol + ")</div></div>",
        "<div class='sbox'><div class='sl'>Share Price</div><div class='sv b'>" + App.utils.fmtCountry(listing.sharePriceGU || 0, business.countryISO) + "</div></div>",
        "<div class='sbox'><div class='sl'>Dividend Yield</div><div class='sv c'>" + dividendYield.toFixed(1) + "%</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox'><div class='sl'>Shares</div><div class='sv a'>" + (listing.totalShares || 0).toLocaleString() + "</div></div>",
        "<div class='sbox'><div class='sl'>Public Float</div><div class='sv c'>" + floatShares.toLocaleString() + "</div></div>",
        "<div class='sbox'><div class='sl'>Holders</div><div class='sv b'>" + holderCount + "</div></div>",
        "</div>"
      ].join("") : "<div class='country-note'>Not listed yet. Eligible firms can list once scale and reputation stabilize.</div>"),
      "<div class='bc'>",
      "<div class='bcn'>" + business.name + "</div>",
      "<div class='bci'>" + business.industry + " - " + business.stage.toUpperCase() + " - " + bloc.flag + " " + bloc.name + "</div>",
      "<div class='brow'>Founder<span>" + renderPersonLink(founder) + "</span></div>",
      "<div class='brow'>Owner<span>" + renderPersonLink(owner) + "</span></div>",
      "<div class='brow'>Current CEO<span>" + renderPersonLink(ceo && ceo.person ? ceo.person : owner) + "</span></div>",
      "<div class='brow'>Country<span>" + App.store.getCountryName(business.countryISO) + "</span></div>",
      "<div class='brow'>Revenue (GU)<span>" + App.utils.fmtGU(business.revenueGU) + "</span></div>",
      "<div class='brow'>Valuation (GU)<span>" + App.utils.fmtGU(business.valuationGU) + "</span></div>",
      "<div class='brow'>Succession Count<span>" + business.successionCount + "</span></div>",
      "</div>",
      renderDecisionCore(business),
      renderTraitEffectBlock("Recent Trait Influence", businessTraitEffects, "No recent trait influence recorded."),
      renderLeadershipList("Leadership Roster", leadership, "No active named leaders yet."),
      renderDecisionHistory(business),
      "<div class='mc'><div class='mcl'>Revenue History</div><canvas id='rch' height='50'></canvas></div>",
      "<div class='mc'><div class='mcl'>" + bloc.currency + " Strength</div><canvas id='fch' height='50'></canvas></div>"
    ].join("");

    if (business.revenueHistory.length > 1) {
      drawLine(document.getElementById("rch"), business.revenueHistory, "#f5a623");
    }
    if (bloc.rateHistory.length > 1) {
      drawLine(document.getElementById("fch"), bloc.rateHistory.map(function(rate){ return 1 / rate; }), bloc.label);
    }
  }

  function renderCountryDetail(iso){
    var el = document.getElementById("dc");
    var bloc = App.store.getBlocByCountry(iso);
    var countryFlag = App.utils.getCountryFlag(iso);
    var currency = App.utils.getCurrency(iso);
    var profile = App.store.getCountryProfile ? App.store.getCountryProfile(iso) : null;
    var people = App.store.getCountryPeople(iso);
    var publicPeople = App.store.getPublicCountryPeople(iso);
    var allPeople = App.store.getCountryPeopleAll(iso);
    var businesses = App.store.getCountryBusinesses(iso).slice().sort(function(first, second){
      return second.valuationGU - first.valuationGU;
    });
    var richest = publicPeople.slice().sort(function(first, second){
      return second.netWorthGU - first.netWorthGU;
    })[0] || null;
    var topBusiness = businesses[0] || null;
    var minors = people.filter(function(person){ return person.age < 18; }).length;
    var dynasties = allPeople.reduce(function(map, person){
      map[person.lineageId] = (map[person.lineageId] || 0) + (person.alive ? 1 : 0);
      return map;
    }, {});
    var activeDynasties = Object.keys(dynasties).filter(function(lineageId){
      return dynasties[lineageId] > 1;
    }).length;
    var stateDirectory = "";
    var employmentRate = profile && profile.laborForce > 0 ? (profile.employed / profile.laborForce) : null;
    var pressureLabel = "stable pressure";
    var countryEducationScore = profile ? Math.round((Number(profile.educationIndex) || 0) * 100) : 0;
    var countryInstitutionScore = profile ? Math.round((Number(profile.institutionScore) || 0) * 100) : null;
    var countryCredentialLabel = getCountryEducationCredentialLabel(iso, countryEducationScore);
    var countryEducationTipBody = [
      "Education Index: " + countryEducationScore + "/100",
      "Typical Credential: " + countryCredentialLabel,
      "Institution Context: " + (countryInstitutionScore != null ? countryInstitutionScore + "/100" : "--"),
      "Country: " + App.store.getCountryName(iso)
    ].join(" | ");
    var populationPanel;

    function fmtCount(value){
      return Number.isFinite(value) ? new Intl.NumberFormat("en-US").format(Math.round(value)) : "--";
    }

    if (profile) {
      if (profile.populationPressure >= 0.62) {
        pressureLabel = "growing pressure";
      } else if (profile.populationPressure <= 0.42) {
        pressureLabel = "shrinking pressure";
      }

      populationPanel = [
        "<div class='sg sg3'>",
        "<div class='sbox'><div class='sl'>Real Population</div><div class='sv c'>" + fmtCount(profile.population) + "</div></div>",
        "<div class='sbox'><div class='sl'>Employment Rate</div><div class='sv " + ((employmentRate != null && employmentRate >= 0.55) ? "g" : "a") + "'>" + (employmentRate != null ? Math.round(employmentRate * 100) + "%" : "--") + "</div></div>",
        "<div class='sbox'><div class='sl'>Unemployed</div><div class='sv r'>" + fmtCount(profile.unemployed) + "</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox'><div class='sl'>Median Wage</div><div class='sv b'>" + App.utils.fmtCountry(profile.medianWageGU, iso) + "</div></div>",
        "<div class='sbox'><div class='sl'>Consumer Demand</div><div class='sv g'>" + App.utils.fmtCountry(profile.consumerDemandGU, iso) + "</div></div>",
        "<div class='sbox'><div class='sl'>Pressure Trend</div><div class='sv " + (pressureLabel.indexOf("growing") === 0 ? "g" : (pressureLabel.indexOf("shrinking") === 0 ? "r" : "a")) + "'>" + pressureLabel + "</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Country Education Index", countryEducationTipBody) + "><div class='sl'>Education Index</div><div class='sv a'>" + countryEducationScore + "/100</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Country Credential Band", countryEducationTipBody) + "><div class='sl'>Credential Band</div><div class='sv c'>" + countryCredentialLabel.toUpperCase() + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Country Institution Score", countryEducationTipBody) + "><div class='sl'>Institution Score</div><div class='sv b'>" + (countryInstitutionScore != null ? countryInstitutionScore + "/100" : "--") + "</div></div>",
        "<div class='sbox'><div class='sl'>Population Layer</div><div class='sv c'>Active</div></div>",
        "</div>"
      ].join("");
    } else {
      populationPanel = [
        "<div class='sg'>",
        "<div class='sbox'><div class='sl'>Population Layer</div><div class='sv a'>Profile unavailable</div></div>",
        "</div>"
      ].join("");
    }

    if (iso === "US") {
      stateDirectory = [
        "<div class='mc'>",
        "<div class='mcl'>United States State Directory</div>",
        "<div class='state-list'>",
        App.store.getUSStateActivity().map(function(entry){
          var active = entry.people > 0 || entry.businesses > 0;
          return "<div class='state-row " + (active ? "active" : "") + "'><span class='state-name'>" + entry.name + "</span><span class='state-meta'>" + entry.people + " people | " + entry.businesses + " firms</span></div>";
        }).join(""),
        "</div></div>"
      ].join("");
    }

    el.innerHTML = [
      "<div class='cban' style='background:" + bloc.color + ";border:1px solid " + bloc.label + "40'>",
      "<div class='cflag'>" + countryFlag + "</div>",
      "<div class='cinfo'>",
      "<div class='cname2' style='color:" + bloc.label + "'>" + App.store.getCountryName(iso) + "</div>",
      "<div class='cfx'>" + iso + " - " + currency.sym + " " + currency.code + " - " + currency.name + "</div>",
      "</div></div>",
      "<div class='sg'>",
      "<div class='sbox'><div class='sl'>Living Citizens</div><div class='sv c'>" + people.length + "</div></div>",
      "<div class='sbox'><div class='sl'>Businesses</div><div class='sv b'>" + businesses.length + "</div></div>",
      "</div>",
      "<div class='sg'>",
      "<div class='sbox'><div class='sl'>Minors</div><div class='sv a'>" + minors + "</div></div>",
      "<div class='sbox'><div class='sl'>Dynasties</div><div class='sv g'>" + activeDynasties + "</div></div>",
      "</div>",
      populationPanel,
      "<div class='sg'>",
      "<div class='sbox'><div class='sl'>Bloc GDP</div><div class='sv g'>" + App.utils.fmtL(bloc.gdp, bloc) + "</div></div>",
      "<div class='sbox'><div class='sl'>Geo Pressure</div><div class='sv " + (bloc.geoPressure > 1 ? "r" : "a") + "'>" + bloc.geoPressure.toFixed(1) + "</div></div>",
      "</div>",
      "<div class='bc'>",
      "<div class='bcn'>Country Snapshot</div>",
      "<div class='country-note'>" + (richest ? ("Richest public CEO: <strong>" + richest.name + "</strong> (" + App.utils.fmtCountry(richest.netWorthGU, iso) + ")") : "No public CEOs in this country yet.") + "</div>",
      "<div class='country-note'>" + (topBusiness ? ("Top business: " + renderBusinessLink(topBusiness, "<strong>" + topBusiness.name + "</strong>") + " (" + App.utils.fmtCountry(topBusiness.valuationGU, iso) + ")") : "No businesses are currently operating from this country.") + "</div>",
      "<div class='country-note'>Historical family members recorded: <strong>" + allPeople.length + "</strong></div>",
      "</div>",
      renderCountryBusinessList(businesses),
      stateDirectory
    ].join("");

    bindInspectorRichTooltips(el);
  }

  function renderInspector(){
    var business;
    var person;

    syncInspectorTabs();

    if (activeInspectorTab === "governor") {
      renderGovernorLog();
      return;
    }

    if (!App.store.selection.type) {
      renderEmptyInspector();
      return;
    }

    if (App.store.selection.type === "person") {
      person = App.store.getPerson(App.store.selection.id);
      if (!person) {
        App.store.clearSelection();
        renderEmptyInspector();
        return;
      }
      renderPersonDetail(person);
      return;
    }

    if (App.store.selection.type === "business") {
      business = App.store.getBusiness(App.store.selection.id);
      if (!business) {
        App.store.clearSelection();
        renderEmptyInspector();
        return;
      }
      renderBusinessDetail(business);
      return;
    }

    if (App.store.selection.type === "country") {
      renderCountryDetail(App.store.selection.id);
    }
  }

  function updateTopBar(){
    var totalGdp = App.store.blocs.reduce(function(sum, bloc){ return sum + bloc.gdp; }, 0);
    var pauseEvent;
    var pauseIndicator = document.getElementById("pause-indicator");
    var pauseTier = "";
    document.getElementById("gv").textContent = App.utils.fmtGU(totalGdp);
    document.getElementById("fv").textContent = App.store.businesses.length;
    document.getElementById("pv").textContent = App.store.getLivingCount();
    document.getElementById("ct").textContent = App.utils.fmtDay(App.store.simDay);
    pauseEvent = App.store.pauseReasonEventId && App.store.getEventById ? App.store.getEventById(App.store.pauseReasonEventId) : null;
    if (pauseEvent) {
      pauseTier = pauseEvent.significance && pauseEvent.significance.tier ? pauseEvent.significance.tier.toUpperCase() : "CRITICAL";
      if (pauseIndicator) {
        pauseIndicator.textContent = "PAUSED - " + pauseTier;
        pauseIndicator.title = "Simulation paused by " + pauseTier + " event";
        pauseIndicator.classList.add("show");
      }
    } else if (pauseIndicator) {
      pauseIndicator.textContent = "";
      pauseIndicator.title = "";
      pauseIndicator.classList.remove("show");
    }
    document.getElementById("cy").textContent = App.utils.fmtYear(App.store.simDay);
  }

  function syncSpeedButtons(){
    var activeSpeed = Number(App.store.simSpeed);
    var isPaused = activeSpeed <= 0;
    var pauseButton = document.getElementById("pause-sim-btn");
    var playButton = document.getElementById("play-sim-btn");

    Array.prototype.forEach.call(document.querySelectorAll(".sb"), function(node){
      var nodeSpeed = Number(node.getAttribute("data-speed"));
      if (Number.isFinite(nodeSpeed) && node.hasAttribute("data-speed")) {
        node.classList.toggle("act", nodeSpeed === activeSpeed);
      }
    });

    if (pauseButton) pauseButton.classList.toggle("act", isPaused);
    if (playButton) playButton.classList.toggle("act", !isPaused);
  }

  function updateFxBar(){
    var container = document.getElementById("fxbar");
    var existingRows = {};

    Array.prototype.forEach.call(container.querySelectorAll(".fx[data-bloc-id]"), function(row){
      existingRows[row.getAttribute("data-bloc-id")] = row;
    });

    App.store.blocs.forEach(function(bloc){
      var change = bloc.prevRate ? ((bloc.rate - bloc.prevRate) / bloc.prevRate) * 100 : 0;
      var className = change >= 0 ? "fxdn" : "fxup";
      var arrow = change >= 0 ? "▼" : "▲";
      var displayRate = bloc.rate > 100 ? bloc.rate.toFixed(1) : bloc.rate.toFixed(4);
      var row = existingRows[bloc.id];
      var labelEl;
      var rateEl;
      var changeEl;

      if (!row) {
        row = document.createElement("span");
        row.className = "fx";
        row.setAttribute("data-bloc-id", bloc.id);

        labelEl = document.createElement("span");
        labelEl.className = "fxl";
        row.appendChild(labelEl);

        rateEl = document.createElement("span");
        rateEl.className = "fxr";
        row.appendChild(rateEl);

        changeEl = document.createElement("span");
        changeEl.className = className;
        row.appendChild(changeEl);

        container.appendChild(row);
      } else {
        labelEl = row.children[0];
        rateEl = row.children[1];
        changeEl = row.children[2];
      }

      if (labelEl) labelEl.textContent = bloc.flag + " " + bloc.currency + "/GU";
      if (rateEl) rateEl.textContent = displayRate;
      if (changeEl) {
        changeEl.className = className;
        changeEl.textContent = arrow + Math.abs(change).toFixed(2) + "%";
      }

      container.appendChild(row);
      delete existingRows[bloc.id];
    });

    Object.keys(existingRows).forEach(function(blocId){
      var stale = existingRows[blocId];
      if (stale && stale.parentNode) {
        stale.parentNode.removeChild(stale);
      }
    });
  }

  function updateTicker(){
    var container;
    var items;
    var doubledItems;
    var identitySignature;
    var index;
    var previousData = App.store.tickerData;
    App.store.tickerData = {};
    App.store.businesses.forEach(function(business){
      var previous = previousData[business.id] ? previousData[business.id].val : business.valuationGU;
      var bloc = App.store.getBloc(business.blocId);
      App.store.tickerData[business.id] = {
        id:business.id,
        name:App.utils.getBusinessTicker ? App.utils.getBusinessTicker(business.name) : business.name.split(" ")[0].slice(0, 4).toUpperCase(),
        val:business.valuationGU,
        local:App.utils.fmtCountry(business.valuationGU, business.countryISO || "US"),
        chg:previous ? ((business.valuationGU - previous) / previous) * 100 : 0,
        flag:bloc.flag
      };
    });

    items = Object.keys(App.store.tickerData).map(function(id){
      return App.store.tickerData[id];
    }).slice(0, 18);
    container = document.getElementById("ticker-inner");

    if (!items.length) {
      container.innerHTML = "";
      tickerRenderSlots = [];
      tickerIdentitySignature = "";
      return;
    }

    identitySignature = items.map(function(item){
      return item.id;
    }).join("|");
    doubledItems = items.concat(items);

    if (identitySignature !== tickerIdentitySignature || tickerRenderSlots.length !== doubledItems.length) {
      container.innerHTML = "";
      tickerRenderSlots = [];
      tickerIdentitySignature = identitySignature;
      for (index = 0; index < doubledItems.length; index += 1) {
        applyTickerSlot(ensureTickerSlot(container, index), doubledItems[index]);
      }
      return;
    }

    for (index = 0; index < doubledItems.length; index += 1) {
      applyTickerSlot(ensureTickerSlot(container, index), doubledItems[index]);
    }
  }

  function renderNews(){
    var items = App.store.newsItems || [];
    var signature = items.map(function(item){
      var significance = item && item.significance ? item.significance.tier : "";
      var pacing = item && item.pacing ? item.pacing.mode : "";
      var suppressed = item && item.pacing ? (item.pacing.suppressedCount || 0) : 0;
      return [item.id, item.time, significance, pacing, suppressed, item.text].join("|");
    }).join("||");

    if (signature === lastNewsRenderSignature) {
      return;
    }

    lastNewsRenderSignature = signature;

    document.getElementById("ns").innerHTML = items.map(function(item){
      var tags = (item.tags || []).slice(0, 3);
      var tagHtml = tags.map(function(tag){
        return "<span class='ntag tag-default'>" + tag + "</span>";
      }).join("");
      var tier = item.significance && item.significance.tier ? item.significance.tier : null;
      var tierHtml = tier ? ("<span class='ntag tag-tier tag-tier-" + tier + "'>" + tier.toUpperCase() + "</span>") : "";
      var rollupCount = item.pacing && item.pacing.mode === "rollup" ? Math.max(1, Number(item.pacing.suppressedCount) || 1) : 0;
      var modeHtml = item.pacing && item.pacing.mode === "rollup" ? "<span class='ntag tag-rollup'>ROLLUP x" + rollupCount + "</span>" : "";
      var time = item.time || App.utils.fmtDay(item.day != null ? item.day : App.store.simDay);
      var itemType = item.type || "market";
      var itemClass = "ni" + (item.pacing && item.pacing.mode === "rollup" ? " ni-rollup" : "") + (tier ? (" ni-" + tier) : "");
      return "<div class='" + itemClass + "'><span class='nt'>" + time + "</span><span class='ntag tag-" + itemType + "'>" + itemType.toUpperCase() + "</span>" + tierHtml + modeHtml + tagHtml + "<span class='ntxt'>" + item.text + "</span></div>";
    }).join("");
  }

  function normalizeFeedItem(item){
    var source = item && typeof item === "object" ? item : {};
    var defaults = App.events && typeof App.events.getCanonicalDefaults === "function" ? App.events.getCanonicalDefaults(source.type, source) : null;
    var day = source.day != null ? Number(source.day) : App.store.simDay;
    var significance = source.significance || (defaults ? defaults.significance : {
      score:35,
      tier:"notable",
      dimensions:{ impact:0.35, rarity:0.35, legacy:0.25, crossGen:0.20 },
      adaptiveBoost:0,
      baseFloor:35
    });
    var pacing = source.pacing || {
      displayed:true,
      mode:"direct",
      rollupKey:null,
      suppressedCount:0
    };

    return {
      id:source.id || ("news-" + App.store.simDay + "-" + Math.floor(Math.random() * 1000000)),
      day:Number.isFinite(day) ? day : App.store.simDay,
      time:source.time || App.utils.fmtDay(Number.isFinite(day) ? day : App.store.simDay),
      type:source.type || "market",
      text:source.text || "",
      tags:Array.isArray(source.tags) ? source.tags.filter(Boolean).slice(0, 3) : [],
      category:source.category || (defaults ? defaults.category : "structural"),
      scope:source.scope || (defaults ? defaults.scope : "global"),
      entities:source.entities || (defaults ? defaults.entities : { personIds:[], businessIds:[], countryIsos:[], blocIds:[] }),
      causes:Array.isArray(source.causes) ? source.causes.slice(0, 6) : [],
      significance:significance,
      pacing:pacing,
      synthetic:!!source.synthetic
    };
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
    var index;

    for (index = 0; index < items.length; index += 1) {
      if (rank <= getFeedRank(items[index])) {
        return index;
      }
    }

    return items.length;
  }

  function addNews(typeOrItem, text, meta){
    var item;
    var existingIndex = -1;

    if (!(typeOrItem && typeof typeOrItem === "object" && !Array.isArray(typeOrItem))) {
      if (App.events && typeof App.events.emit === "function") {
        return App.events.emit(typeOrItem, text, meta);
      }
      return null;
    }

    item = normalizeFeedItem(typeOrItem);
    if (!item.text) return null;
    if (!Array.isArray(App.store.newsItems)) App.store.newsItems = [];
    existingIndex = App.store.newsItems.findIndex(function(existing){
      return existing && existing.id === item.id;
    });
    if (existingIndex >= 0) {
      if (item.pacing && item.pacing.mode === "rollup") {
        App.store.newsItems.splice(existingIndex, 1, item);
      } else {
        App.store.newsItems.splice(existingIndex, 1);
        App.store.newsItems.splice(findFeedInsertIndex(App.store.newsItems, item), 0, item);
      }
    } else {
      App.store.newsItems.splice(findFeedInsertIndex(App.store.newsItems, item), 0, item);
    }
    if (App.store.newsItems.length > 100) {
      App.store.newsItems.length = 100;
    }
    renderNews();
    return item;
  }

  function drawLine(canvas, data, color){
    if (!canvas || data.length < 2) return;

    var width = canvas.offsetWidth || 240;
    var height = 50;
    canvas.width = width;
    canvas.height = height;

    var context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);

    var min = Math.min.apply(null, data) * 0.95;
    var max = Math.max.apply(null, data) * 1.05;
    var scaleX = width / (data.length - 1);
    var scaleY = height / (max - min || 1);

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.shadowColor = color;
    context.shadowBlur = 4;

    data.forEach(function(value, index){
      var x = index * scaleX;
      var y = height - (value - min) * scaleY;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });

    context.stroke();
    context.shadowBlur = 0;
    context.lineTo((data.length - 1) * scaleX, height);
    context.lineTo(0, height);
    context.closePath();
    context.fillStyle = color + "18";
    context.fill();
  }

  function renderTabs(){
    document.getElementById("ctabs").innerHTML = App.store.blocs.map(function(bloc){
      return "<button class='ctab " + (App.store.selectedBlocId === bloc.id ? "act" : "") + "' data-bloc-id='" + bloc.id + "'>" + bloc.flag + " " + bloc.currency + "</button>";
    }).join("");
  }

  function renderEconChart(){
    var canvas = document.getElementById("econ-canvas");
    var width = canvas.offsetWidth || 275;
    var height = canvas.offsetHeight || 136;
    var bloc = App.store.getBloc(App.store.selectedBlocId);
    var data = bloc ? App.store.econHist[bloc.id] : null;

    canvas.width = width;
    canvas.height = height;

    var context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);
    if (!bloc || !data || data.length < 2) return;

    var padding = { t:14, b:8, l:4, r:4 };
    var chartWidth = width - padding.l - padding.r;
    var chartHeight = height - padding.t - padding.b;
    var min = Math.min.apply(null, data) * 0.9;
    var max = Math.max.apply(null, data) * 1.1;
    var scaleX = chartWidth / (data.length - 1);
    var scaleY = chartHeight / (max - min || 1);

    context.strokeStyle = "#0d1a27";
    context.lineWidth = 1;
    for (var i = 0; i <= 3; i += 1) {
      var gridY = padding.t + i * (chartHeight / 3);
      context.beginPath();
      context.moveTo(padding.l, gridY);
      context.lineTo(padding.l + chartWidth, gridY);
      context.stroke();
    }

    context.beginPath();
    context.strokeStyle = bloc.label;
    context.lineWidth = 2;
    context.shadowColor = bloc.label;
    context.shadowBlur = 5;

    data.forEach(function(value, index){
      var x = padding.l + index * scaleX;
      var y = padding.t + chartHeight - (value - min) * scaleY;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });

    context.stroke();
    context.shadowBlur = 0;
    context.lineTo(padding.l + (data.length - 1) * scaleX, padding.t + chartHeight);
    context.lineTo(padding.l, padding.t + chartHeight);
    context.closePath();
    context.fillStyle = bloc.label + "15";
    context.fill();
    context.fillStyle = bloc.label;
    context.font = "8px Share Tech Mono";
    context.fillText(bloc.flag + " " + bloc.name + " GDP (" + bloc.currency + ")", padding.l + 2, padding.t - 2);
  }

  function renderLegend(){
    document.getElementById("map-legend").innerHTML = [
      { c:"#2ecc71", l:"Thriving" },
      { c:"#3498db", l:"Growing" },
      { c:"#f5a623", l:"Struggling" },
      { c:"#00d4ff", l:"Starting" },
      { c:"#9fb6c8", l:"Retired" }
    ].map(function(item){
      return "<div class='leg'><div class='ld' style='background:" + item.c + "'></div>" + item.l + "</div>";
    }).join("");
  }

  function renderSelection(){
    renderPeopleList();
    renderInspector();
    renderTabs();
    renderEconChart();
    App.map.renderNodes();
  }

  function renderAll(){
    updateTopBar();
    syncSpeedButtons();
    updateFxBar();
    updateTicker();
    renderNews();
    renderLegend();
    renderSelection();
  }

  function resetWorldFromStart(){
    var approved = global.confirm("Reset world to day zero? This clears your saved snapshot and reloads the simulation.");

    if (!approved) return;

    if (App.persistence && typeof App.persistence.clearLatest === "function") {
      App.persistence.clearLatest();
    }

    global.location.reload();
  }

  function initUI(){
    document.getElementById("plist").addEventListener("click", function(event){
      var personRow = event.target.closest(".pr[data-person-id]");
      var businessRow = event.target.closest(".pr[data-business-id]");

      if (businessRow) {
        setInspectorTab("inspector");
        App.store.selectBusiness(businessRow.getAttribute("data-business-id"));
        renderSelection();
        return;
      }

      if (!personRow) return;
      setInspectorTab("inspector");
      App.store.selectPerson(personRow.getAttribute("data-person-id"));
      renderSelection();
    });

    document.getElementById("plist-tabs").addEventListener("click", function(event){
      var button = event.target.closest(".ptab[data-people-tab]");
      if (!button) return;
      setPeopleTab(button.getAttribute("data-people-tab"));
      renderPeopleList();
    });

    document.getElementById("dc").addEventListener("click", function(event){
      var businessTarget = event.target.closest(".rrow[data-business-id], .entity-link[data-business-id]");
      var personTarget;

      if (businessTarget) {
        setInspectorTab("inspector");
        App.store.selectBusiness(businessTarget.getAttribute("data-business-id"));
        renderSelection();
        return;
      }

      personTarget = event.target.closest(".rrow[data-person-id], .entity-link[data-person-id]");
      if (!personTarget) return;
      setInspectorTab("inspector");
      App.store.selectPerson(personTarget.getAttribute("data-person-id"));
      renderSelection();
    });

    document.getElementById("dpanel-tabs").addEventListener("click", function(event){
      var button = event.target.closest(".dtab[data-inspector-tab]");
      if (!button) return;
      setInspectorTab(button.getAttribute("data-inspector-tab"));
      renderInspector();
    });

    document.getElementById("ctabs").addEventListener("click", function(event){
      var button = event.target.closest(".ctab");
      if (!button) return;
      App.store.setSelectedBloc(button.getAttribute("data-bloc-id"));
      renderTabs();
      renderEconChart();
    });

    document.getElementById("spd-ctrl").addEventListener("click", function(event){
      var button = event.target.closest(".sb");
      if (!button) return;
      App.store.setSimSpeed(Number(button.getAttribute("data-speed")));
      syncSpeedButtons();
    });

    document.getElementById("sim-ctrl").addEventListener("click", function(event){
      var button = event.target.closest("button");
      var resumeSpeed;

      if (!button) return;

      if (button.id === "pause-sim-btn") {
        App.store.setSimSpeed(0);
      } else if (button.id === "play-sim-btn") {
        resumeSpeed = Number(App.store.lastNonZeroSimSpeed) > 0 ? Number(App.store.lastNonZeroSimSpeed) : 1;
        App.store.setSimSpeed(resumeSpeed);
      } else {
        return;
      }

      syncSpeedButtons();
    });

    document.getElementById("reset-world-btn").addEventListener("click", function(){
      resetWorldFromStart();
    });

    syncSpeedButtons();
    syncPeopleTabs();
    syncInspectorTabs();
    renderNews();
  }

  App.ui = {
    initUI:initUI,
    renderAll:renderAll,
    renderSelection:renderSelection,
    renderInspector:renderInspector,
    updateTopBar:updateTopBar,
    renderNews:renderNews,
    updateFxBar:updateFxBar,
    updateTicker:updateTicker,
    addNews:addNews,
    renderLegend:renderLegend,
    renderEconChart:renderEconChart
  };
})(window);
