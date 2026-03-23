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

  function renderEmptyInspector(){
    document.getElementById("dc").innerHTML =
      "<div class='empty'><div class='big'>O</div><div>Click any citizen,<br>country, or business to inspect</div></div>";
  }

  function renderBadgeRow(labels, className){
    return labels.filter(Boolean).map(function(label){
      return "<span class='" + className + "'>" + label + "</span>";
    }).join("");
  }

  function renderEntityLink(type, id, label){
    if (!id) return label || "Unknown";
    return "<span class='entity-link' data-" + type + "-id='" + id + "'>" + label + "</span>";
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
      monogram:(business && business.name ? business.name.charAt(0).toUpperCase() : "?")
    };
    var palette = logo.palette || {};
    var suffix = (business && business.id ? business.id : "fallback") + "-" + (contextKey || "default") + "-" + size;
    var primaryId = "blogo-p-" + suffix;
    var secondaryId = "blogo-s-" + suffix;
    var fillPrimary = logo.useGradient ? "url(#" + primaryId + ")" : palette.primary;
    var fillSecondary = logo.useGradient ? "url(#" + secondaryId + ")" : palette.secondary;
    var rotation = (logo.archetype === "ring" || logo.archetype === "fold") ? (logo.rotation || 0) : 0;

    return [
      "<svg class='blogo-svg' viewBox='0 0 44 44' width='" + size + "' height='" + size + "' aria-hidden='true'>",
      "<defs>",
      "<linearGradient id='" + primaryId + "' x1='0%' y1='0%' x2='100%' y2='100%'>",
      "<stop offset='0%' stop-color='" + palette.primary + "'></stop>",
      "<stop offset='100%' stop-color='" + palette.accent + "'></stop>",
      "</linearGradient>",
      "<linearGradient id='" + secondaryId + "' x1='100%' y1='0%' x2='0%' y2='100%'>",
      "<stop offset='0%' stop-color='" + palette.secondary + "'></stop>",
      "<stop offset='100%' stop-color='" + palette.primary + "'></stop>",
      "</linearGradient>",
      "</defs>",
      "<rect x='2' y='2' width='40' height='40' rx='12' fill='#0d1722' stroke='rgba(190,210,225,0.12)'></rect>",
      "<g transform='translate(4 4) scale(0.82)'>",
      "<g transform='rotate(" + rotation + " 22 22)'>",
      renderLogoSymbol(logo, fillPrimary, fillSecondary, palette.accent),
      "</g>",
      "</g>",
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
          "</div>",
          "<div class='rwealth'>" + formatDecisionValue(entry.cashPolicy) + "</div>",
          "</div>"
        ].join("");
      }).join("") : "<div class='country-note'>No recent decisions yet.</div>",
      "</div>"
    ].join("");
  }

  function renderPeopleList(){
    var html = App.store.getVisiblePeople().map(function(person){
      var bloc = App.store.getBloc(person.blocId);
      var business = App.store.getAssociatedBusiness(person);
      var currency = App.utils.getCurrency(person.countryISO);
      var selected = App.store.selection.type === "person" && App.store.selection.id === person.id;
      var roles = App.utils.getPersonRoles(person);

      return [
        "<div class='pr " + (selected ? "sel" : "") + "' data-person-id='" + person.id + "'>",
        "<div class='prn'><span>" + bloc.flag + " " + person.name + "</span><span class='st s-" + person.status + "'>" + person.status + "</span></div>",
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

  function renderPersonDetail(person){
    var el = document.getElementById("dc");
    var bloc = App.store.getBloc(person.blocId);
    var countryFlag = App.utils.getCountryFlag(person.countryISO);
    var ownedBusiness = App.store.getBusiness(person.businessId);
    var business = App.store.getAssociatedBusiness(person);
    var employmentBusiness = App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var currency = App.utils.getCurrency(person.countryISO);
    var location = App.utils.locationLabel(person, false);
    var birthDay = person.birthDay != null ? person.birthDay : App.store.simDay;
    var fxChange = bloc.prevRate ? ((bloc.rate - bloc.prevRate) / bloc.prevRate) * 100 : 0;
    var fxDir = fxChange >= 0 ? "d" : "u";
    var spouse = App.store.getSpouse(person);
    var parents = App.store.getParents(person);
    var children = App.store.getChildren(person, true).slice().sort(function(first, second){
      return second.age - first.age;
    });
    var heir = ownedBusiness && App.sim.getPotentialHeir ? App.sim.getPotentialHeir(person) : null;
    var notes = [
      "AGE " + App.utils.displayAge(person),
      App.utils.getLifeStageLabel(person).toUpperCase()
    ];

    if (person.retired) notes.push("RETIRED");
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
      "<div class='sbox'><div class='sl'>Net Worth (" + currency.code + ")</div><div class='sv " + (person.netWorthGU > 30000 ? "g" : person.netWorthGU > 0 ? "a" : "r") + "'>" + App.utils.fmtCountry(person.netWorthGU, person.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Net Worth (GU)</div><div class='sv c'>" + App.utils.fmtGU(person.netWorthGU) + "</div></div>",
      "<div class='sbox'><div class='sl'>Net Worth (USD)</div><div class='sv b'>" + App.utils.fmtUSD(person.netWorthGU) + "</div></div>",
      "</div>",
      "<div class='sg'>",
      "<div class='sbox'><div class='sl'>Family Size</div><div class='sv b'>" + ((spouse ? 1 : 0) + children.length) + "</div></div>",
      "<div class='sbox'><div class='sl'>Lineage</div><div class='sv a'>" + person.lineageId.split("-")[0].toUpperCase() + "</div></div>",
      "</div>",
      (employmentBusiness && person.jobTitle ? "<div class='sg'><div class='sbox'><div class='sl'>Employer</div><div class='sv a'>" + renderBusinessLink(employmentBusiness, employmentBusiness.name) + "</div></div><div class='sbox'><div class='sl'>Salary (GU)</div><div class='sv c'>" + App.utils.fmtGU(person.salaryGU || 0) + "</div></div></div>" : ""),
      "<div class='sg'>",
      "<div class='sbox'><div class='sl'>Bloc GDP</div><div class='sv b'>" + App.utils.fmtL(bloc.gdp, bloc) + "</div></div>",
      "<div class='sbox'><div class='sl'>Geo Pressure</div><div class='sv " + (bloc.geoPressure > 1 ? "r" : "g") + "'>" + bloc.geoPressure.toFixed(1) + "</div></div>",
      "</div>",
      renderDecisionProfile(person),
      "<div class='traits'>" + (person.traits.length ? person.traits.map(function(trait){ return "<span class='trait'>" + trait + "</span>"; }).join("") : "<span class='country-note'>No defining traits yet.</span>") + "</div>",
      renderRelativeList("Spouse", spouse ? [spouse] : [], "No spouse recorded."),
      renderRelativeList("Parents", parents, "No parents recorded."),
      renderRelativeList("Children", children, "No children recorded."),
      renderRelativeList("Likely Heir", heir ? [heir] : [], ownedBusiness ? "No eligible heir yet." : "No active business to inherit."),
      business ? renderBusinessCard(business, person.countryISO, currency, bloc) : "<div class='bc' style='text-align:center;color:var(--text3);font-family:var(--mono);font-size:9px;padding:14px;'>No business yet</div>"
    ].join("");

    if (business && business.revenueHistory.length > 1) {
      drawLine(document.getElementById("rch"), business.revenueHistory, "#f5a623");
    }
    if (bloc.rateHistory.length > 1) {
      drawLine(document.getElementById("fch"), bloc.rateHistory.map(function(rate){ return 1 / rate; }), bloc.label);
    }
  }

  function renderBusinessDetail(business){
    var el = document.getElementById("dc");
    var bloc = App.store.getBloc(business.blocId);
    var countryFlag = App.utils.getCountryFlag(business.countryISO);
    var currency = App.utils.getCurrency(business.countryISO);
    var founder = App.store.getPerson(business.founderId);
    var owner = App.store.getPerson(business.ownerId);
    var ceo = App.store.getBusinessLeader(business, "ceo");
    var leadership = App.store.getBusinessLeadership(business);
    var otherEmployees = Math.max(0, business.employees - leadership.length);

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
        "<div class='dtitle'>" + business.stage.toUpperCase() + " - AGE " + business.age + " TICKS</div>",
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
  }

  function renderInspector(){
    var business;
    var person;

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
    document.getElementById("gv").textContent = App.utils.fmtGU(totalGdp);
    document.getElementById("fv").textContent = App.store.businesses.length;
    document.getElementById("pv").textContent = App.store.getLivingCount();
    document.getElementById("ct").textContent = App.utils.fmtDay(App.store.simDay);
    document.getElementById("cy").textContent = App.utils.fmtYear(App.store.simDay);
  }

  function updateFxBar(){
    document.getElementById("fxbar").innerHTML = App.store.blocs.map(function(bloc){
      var change = bloc.prevRate ? ((bloc.rate - bloc.prevRate) / bloc.prevRate) * 100 : 0;
      var className = change >= 0 ? "fxdn" : "fxup";
      var arrow = change >= 0 ? "&#9660;" : "&#9650;";
      var displayRate = bloc.rate > 100 ? bloc.rate.toFixed(1) : bloc.rate.toFixed(4);
      return "<span class='fx'><span class='fxl'>" + bloc.flag + " " + bloc.currency + "/GU</span><span class='fxr'>" + displayRate + "</span><span class='" + className + "'>" + arrow + Math.abs(change).toFixed(2) + "%</span></span>";
    }).join("");
  }

  function updateTicker(){
    var previousData = App.store.tickerData;
    App.store.tickerData = {};
    App.store.businesses.forEach(function(business){
      var previous = previousData[business.id] ? previousData[business.id].val : business.valuationGU;
      var bloc = App.store.getBloc(business.blocId);
      App.store.tickerData[business.id] = {
        name:business.name.split(" ")[0].slice(0, 4).toUpperCase(),
        val:business.valuationGU,
        local:App.utils.fmtCountry(business.valuationGU, business.countryISO || "US"),
        chg:previous ? ((business.valuationGU - previous) / previous) * 100 : 0,
        flag:bloc.flag
      };
    });

    var items = Object.keys(App.store.tickerData).map(function(id){
      return App.store.tickerData[id];
    }).slice(0, 18);

    document.getElementById("ticker-inner").innerHTML = items.length ? items.concat(items).map(function(item){
      return "<span class='ti'><span class='tf'>" + item.flag + "</span><span class='tn'>" + item.name + "</span><span class='tv'>" + item.local + "</span><span class='" + (item.chg >= 0 ? "tup" : "tdn") + "'>" + (item.chg >= 0 ? "&#9650;" : "&#9660;") + Math.abs(item.chg).toFixed(1) + "%</span></span>";
    }).join("") : "";
  }

  function addNews(type, text){
    App.store.newsItems.unshift({ type:type, text:text, time:App.utils.fmtDay(App.store.simDay) });
    if (App.store.newsItems.length > 100) {
      App.store.newsItems.pop();
    }

    document.getElementById("ns").innerHTML = App.store.newsItems.map(function(item){
      return "<div class='ni'><span class='nt'>" + item.time + "</span><span class='ntag tag-" + item.type + "'>" + item.type.toUpperCase() + "</span><span class='ntxt'>" + item.text + "</span></div>";
    }).join("");
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
    updateFxBar();
    updateTicker();
    renderLegend();
    renderSelection();
  }

  function initUI(){
    document.getElementById("plist").addEventListener("click", function(event){
      var row = event.target.closest(".pr");
      if (!row) return;
      App.store.selectPerson(row.getAttribute("data-person-id"));
      renderSelection();
    });

    document.getElementById("dc").addEventListener("click", function(event){
      var businessTarget = event.target.closest(".rrow[data-business-id], .entity-link[data-business-id]");
      var personTarget;

      if (businessTarget) {
        App.store.selectBusiness(businessTarget.getAttribute("data-business-id"));
        renderSelection();
        return;
      }

      personTarget = event.target.closest(".rrow[data-person-id], .entity-link[data-person-id]");
      if (!personTarget) return;
      App.store.selectPerson(personTarget.getAttribute("data-person-id"));
      renderSelection();
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
      Array.prototype.forEach.call(document.querySelectorAll(".sb"), function(node){
        node.classList.remove("act");
      });
      button.classList.add("act");
    });
  }

  App.ui = {
    initUI:initUI,
    renderAll:renderAll,
    renderSelection:renderSelection,
    renderInspector:renderInspector,
    updateTopBar:updateTopBar,
    updateFxBar:updateFxBar,
    updateTicker:updateTicker,
    addNews:addNews,
    renderLegend:renderLegend,
    renderEconChart:renderEconChart
  };
})(window);
