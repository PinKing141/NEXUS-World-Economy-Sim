(function (global) {
  var App = global.Nexus || (global.Nexus = {});
  var initialized = false;
  var countryGeometryCache = {};
  var cityDetailLookupCache = {};
  var COUNTRY_PLACEMENT_FALLBACKS = {
    AX:"FI",
    CC:"AU",
    CX:"AU",
    HK:"CN",
    MO:"CN",
    SJ:"NO",
    UM:"US"
  };

  function getMapRoot() {
    return App.store.mapSvg;
  }

  function getMapViewBox() {
    return App.data.MAP_VIEWBOX || { width: 1000, height: 507.209 };
  }

  function getCountryGroup(iso) {
    var mapRoot = getMapRoot();
    return mapRoot ? mapRoot.querySelector("[id='" + iso + "']") : null;
  }

  function getCountryPaths(iso) {
    var group = getCountryGroup(iso);
    return group ? Array.prototype.slice.call(group.querySelectorAll("path, circle")) : [];
  }

  function createSvgPoint(x, y) {
    var svg = App.store.mapSvg;
    if (!svg || typeof svg.createSVGPoint !== "function") return null;
    var point = svg.createSVGPoint();
    point.x = x;
    point.y = y;
    return point;
  }

  function getCountryGeometry(iso) {
    var cached = countryGeometryCache[iso];
    var paths;
    var geometry;

    if (cached !== undefined) {
      return cached;
    }

    paths = getCountryPaths(iso).map(function (path) {
      var bbox;
      var area;

      try {
        bbox = path.getBBox();
      } catch (error) {
        return null;
      }

      area = Math.max(0.0001, bbox.width * bbox.height);
      return {
        path: path,
        bbox: bbox,
        area: area
      };
    }).filter(Boolean);

    if (!paths.length) {
      countryGeometryCache[iso] = null;
      return null;
    }

    geometry = {
      paths: paths,
      totalArea: paths.reduce(function (sum, entry) {
        return sum + entry.area;
      }, 0)
    };

    countryGeometryCache[iso] = geometry;
    return geometry;
  }

  function isPointInsidePath(path, point) {
    if (!path || !point || typeof path.isPointInFill !== "function") {
      return false;
    }

    try {
      return path.isPointInFill(point);
    } catch (error) {
      return false;
    }
  }

  function chooseWeightedPath(geometry) {
    var roll = Math.random() * geometry.totalArea;
    var running = 0;

    for (var i = 0; i < geometry.paths.length; i += 1) {
      running += geometry.paths[i].area;
      if (running >= roll) {
        return geometry.paths[i];
      }
    }

    return geometry.paths[geometry.paths.length - 1];
  }

  function pointInCountryGeometry(geometry, x, y) {
    var point = createSvgPoint(x, y);

    if (!geometry || !point) return false;

    return geometry.paths.some(function (entry) {
      return isPointInsidePath(entry.path, point);
    });
  }

  function sampleCountryGeometryPoint(geometry, attempts) {
    var totalAttempts = attempts || 100;
    var entry;
    var x;
    var y;

    if (!geometry) return null;

    for (var i = 0; i < totalAttempts; i += 1) {
      entry = chooseWeightedPath(geometry);
      x = App.utils.rand(entry.bbox.x, entry.bbox.x + entry.bbox.width);
      y = App.utils.rand(entry.bbox.y, entry.bbox.y + entry.bbox.height);

      if (pointInCountryGeometry(geometry, x, y)) {
        return { x: x, y: y };
      }
    }

    return null;
  }

  function sampleNearPointInCountry(iso, center, xJitter, yJitter, attempts) {
    var geometry = getCountryGeometry(iso);
    var viewBox = getMapViewBox();
    var x;
    var y;

    if (!geometry || !center) return null;

    for (var i = 0; i < (attempts || 32); i += 1) {
      x = App.utils.clamp(center.x + App.utils.rand(-xJitter, xJitter), 0, viewBox.width);
      y = App.utils.clamp(center.y + App.utils.rand(-yJitter, yJitter), 0, viewBox.height);
      if (pointInCountryGeometry(geometry, x, y)) {
        return { x: x, y: y };
      }
    }

    return null;
  }

  function getFallbackSpawnPoint(iso, preferredState) {
    var geometry = getCountryGeometry(iso);
    var sampled;
    var viewBox;

    if (iso === "US") {
      var stateCode = preferredState || App.utils.pick(App.data.US_STATE_CODES);
      var centroid = App.data.US_STATE_CENTROIDS[stateCode];

      if (centroid) {
        var stateCenter = App.utils.latLngToSVG(centroid[0], centroid[1]);
        sampled = sampleNearPointInCountry("US", stateCenter, 16, 12, 42);
        if (!sampled && (!geometry || pointInCountryGeometry(geometry, stateCenter.x, stateCenter.y))) {
          sampled = stateCenter;
        }
      }

      if (!sampled && geometry) {
        sampled = sampleCountryGeometryPoint(geometry, 160);
      }

      return {
        pos: sampled || { x: 500, y: 253 },
        iso: "US",
        state: stateCode
      };
    }

    if (App.data.CENTROIDS[iso]) {
      var pair = App.data.CENTROIDS[iso];
      var center = App.utils.latLngToSVG(pair[0], pair[1]);

      sampled = sampleNearPointInCountry(iso, center, 12, 10, 38);
      if (!sampled && (!geometry || pointInCountryGeometry(geometry, center.x, center.y))) {
        sampled = center;
      }
      if (!sampled && geometry) {
        sampled = sampleCountryGeometryPoint(geometry, 180);
      }

      return {
        pos: sampled || center,
        iso: iso,
        state: null
      };
    }

    if (geometry) {
      sampled = sampleCountryGeometryPoint(geometry, 220);
      if (sampled) {
        return {
          pos: sampled,
          iso: iso,
          state: null
        };
      }
    }

    viewBox = getMapViewBox();

    return {
      pos: { x: viewBox.width * 0.5, y: viewBox.height * 0.5 },
      iso: iso,
      state: null
    };
  }

  function ensureNodeLayer(svgEl) {
    var owner = svgEl.querySelector(".svg-pan-zoom_viewport") || svgEl;
    var nodeLayer = owner.querySelector("#nexus-node-layer");

    if (!nodeLayer) {
      nodeLayer = svgEl.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeLayer.setAttribute("id", "nexus-node-layer");
      nodeLayer.setAttribute("class", "nexus-node-layer");
      owner.appendChild(nodeLayer);
    }

    return nodeLayer;
  }

  function getCountryColor(bloc) {
    var risk = bloc.geoPressure > 0.5;
    return risk ? App.utils.blendHex(bloc.color, "#e74c3c", Math.min(0.45, bloc.geoPressure * 0.09)) : bloc.color;
  }

  function injectMapStyles(svgEl) {
    var defs = svgEl.querySelector("defs");
    if (!defs) {
      defs = svgEl.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgEl.insertBefore(defs, svgEl.firstChild || null);
    }
    var styleNode = svgEl.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "style");
    styleNode.textContent = [
      "svg { background:#07101a; }",
      "g[id] > path, g[id] > g > path, g[id] > circle { transition: fill 0.35s ease, stroke 0.2s ease, opacity 0.2s ease; }",
      "text { user-select:none; fill:#48627d; font-family:'Share Tech Mono', monospace; font-size:6px; letter-spacing:0.08em; }",
      "#nexus-node-layer text { pointer-events:none; fill:#5a7a9a; }",
      "#nexus-node-layer .bnode circle, #nexus-node-layer .bnode text { transition: cx 0.22s ease, cy 0.22s ease, r 0.22s ease, opacity 0.22s ease, fill 0.22s ease, x 0.22s ease, y 0.22s ease, font-size 0.22s ease; }",
      "#nexus-node-layer .bnode { cursor:pointer; }",
      "#Ocean, #World { stroke:none !important; }"
    ].join(" ");
    defs.appendChild(styleNode);
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeIso(value) {
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

  function resolveMapCountryIso(iso, options) {
    var normalized = normalizeIso(iso);
    var fallback = COUNTRY_PLACEMENT_FALLBACKS[normalized];
    var allowBlocFallback = !(options && options.allowBlocFallback === false);
    var bloc;
    var mappedMember;

    if (!normalized) return "";
    if (getCountryGeometry(normalized)) return normalized;

    if (fallback && getCountryGeometry(fallback)) {
      return fallback;
    }

    bloc = allowBlocFallback && App.store && typeof App.store.getBlocByCountry === "function" ? App.store.getBlocByCountry(normalized) : null;
    if (allowBlocFallback && bloc && Array.isArray(bloc.members)) {
      mappedMember = bloc.members.find(function (memberIso) {
        var candidate = String(memberIso || "").trim().toUpperCase();
        return !!candidate && candidate !== normalized && !!getCountryGeometry(candidate);
      });
      if (mappedMember) {
        return mappedMember;
      }
    }

    return normalized;
  }

  function hashString(value) {
    var text = String(value || "");
    var hash = 2166136261;

    for (var index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function hashToUnit(value) {
    return (hashString(value) % 1000000) / 1000000;
  }

  function getBusinessNodeColor(stage) {
    var key = String(stage || "growing").toLowerCase();
    var map = {
      startup: "#00d4ff",
      growing: "#2ecc71",
      stable: "#5bc0eb",
      distress: "#f5a623",
      restructuring: "#ff8f5a",
      fire_sale: "#e67e22",
      bailout: "#9b59b6",
      liquidation: "#e74c3c",
      defunct: "#6b7d90"
    };

    return map[key] || "#5bc0eb";
  }

  function getCityDetailLookup(iso) {
    var code = String(iso || "").trim().toUpperCase();
    var lookup;

    if (!code) return { byCity: {}, byCityState: {} };
    if (cityDetailLookupCache[code]) return cityDetailLookupCache[code];

    lookup = { byCity: {}, byCityState: {} };

    if (App.data && typeof App.data.getWorldCityDetailsByCountry === "function") {
      App.data.getWorldCityDetailsByCountry(code).forEach(function (entry) {
        var cityKey = normalizeText(entry && entry.name);
        var stateKey = normalizeText(entry && entry.state);
        var compositeKey = cityKey + "|" + stateKey;
        var current = lookup.byCity[cityKey];
        var currentComposite = lookup.byCityState[compositeKey];
        var population = Number(entry && entry.population) || 0;

        if (!cityKey) return;
        if (!current || population > (Number(current.population) || 0)) {
          lookup.byCity[cityKey] = entry;
        }
        if (!currentComposite || population > (Number(currentComposite.population) || 0)) {
          lookup.byCityState[compositeKey] = entry;
        }
      });
    }

    cityDetailLookupCache[code] = lookup;
    return lookup;
  }

  function getBusinessAnchorPoint(business, mapIso) {
    var iso = resolveMapCountryIso(mapIso || (business && business.countryISO));
    var cityKey = normalizeText(business && business.hqCity);
    var stateKey = normalizeText(business && business.hqSubdivision);
    var lookup = getCityDetailLookup(iso);
    var detail = lookup.byCityState[cityKey + "|" + stateKey] || lookup.byCity[cityKey];
    var center;
    var sampled;
    var spawn;

    if (detail && Number.isFinite(Number(detail.lat)) && Number.isFinite(Number(detail.lng))) {
      center = App.utils.latLngToSVG(Number(detail.lat), Number(detail.lng));
      sampled = sampleNearPointInCountry(iso, center, 10, 8, 44);
      if (sampled) return { point:sampled, countryISO:iso };
      if (isPointInCountry(iso, center.x, center.y)) return { point:center, countryISO:iso };
    }

    spawn = getCountrySpawnPoint(iso, null);
    return {
      point:spawn && spawn.pos ? spawn.pos : { x: 500, y: 253 },
      countryISO:iso
    };
  }

  function spreadPointAroundAnchor(iso, anchor, locationKey, businessId) {
    var slotHash = hashString(String(locationKey || "") + "|" + String(businessId || ""));
    var angle = ((slotHash % 3600) / 3600) * Math.PI * 2;
    var ring = 1 + (((slotHash >>> 7) % 4));
    var radius = Math.min(18, 2.4 + (ring * 2.2) + (((slotHash >>> 12) % 1000) / 1000) * 1.4);
    var x = anchor.x + (Math.cos(angle) * radius);
    var y = anchor.y + (Math.sin(angle) * radius * 0.74);
    var point;

    if (isPointInCountry(iso, x, y)) {
      return { x: x, y: y };
    }

    point = sampleNearPointInCountry(iso, anchor, 12 + radius, 10 + radius * 0.7, 28);
    if (point) return point;
    return anchor;
  }

  function registerCountryNames() {
    var mapRoot = getMapRoot();
    if (!mapRoot) return;
    var labels = mapRoot.querySelectorAll("text[id$='-label']");
    Array.prototype.forEach.call(labels, function (label) {
      var iso = label.id.replace("-label", "");
      App.store.setCountryName(iso, label.textContent.trim());
    });
  }

  function applyBlocColors() {
    App.store.blocs.forEach(function (bloc) {
      bloc.members.forEach(function (iso) {
        getCountryPaths(iso).forEach(function (path) {
          path.setAttribute("fill", bloc.color);
          path.setAttribute("stroke", "#1e3550");
          path.setAttribute("stroke-width", "0.35");
        });
      });
    });

    var mapRoot = getMapRoot();
    var ocean = mapRoot ? mapRoot.querySelector("#Ocean") : null;
    var world = mapRoot ? mapRoot.querySelector("#World") : null;

    if (ocean) {
      ocean.setAttribute("fill", "#07101a");
      ocean.setAttribute("stroke", "none");
      ocean.setAttribute("stroke-width", "0");
    }

    if (world) {
      world.setAttribute("fill", "#07101a");
      world.setAttribute("stroke", "none");
    }
  }

  function updateCountryColors() {
    App.store.blocs.forEach(function (bloc) {
      var fill = getCountryColor(bloc);
      bloc.members.forEach(function (iso) {
        getCountryPaths(iso).forEach(function (path) {
          if (!path._hovered) {
            path.setAttribute("fill", fill);
          }
        });
      });
    });
  }

  function setCountryHover(iso, hovered) {
    var bloc = App.store.getBlocByCountry(iso);
    if (!bloc) return;

    getCountryPaths(iso).forEach(function (path) {
      path._hovered = hovered;
      path.setAttribute("fill", hovered ? App.utils.blendHex(bloc.color, "#ffffff", 0.28) : getCountryColor(bloc));
    });
  }

  function moveTip(event) {
    var tip = document.getElementById("map-tip");
    var panel = document.getElementById("map-panel");
    var bounds = panel.getBoundingClientRect();
    tip.style.left = Math.min(event.clientX - bounds.left + 14, bounds.width - 210) + "px";
    tip.style.top = Math.max(event.clientY - bounds.top - 75, 32) + "px";
  }

  function hideTip() {
    document.getElementById("map-tip").style.display = "none";
  }

  function renderCountryTip(event, iso) {
    var tip = document.getElementById("map-tip");
    var bloc = App.store.getBlocByCountry(iso);
    var currency = App.utils.getCurrency(iso);
    var countryFlag = App.utils.getCountryFlag(iso);
    var countryFlagMarkup = App.utils.renderCountryFlagIcon(iso, {
      alt:App.store.getCountryName(iso),
      className:"flag-icon-sm"
    });
    var blocFlagMarkup = bloc ? App.utils.renderFlagIcon(bloc.flag, {
      alt:bloc.name,
      className:"flag-icon-sm"
    }) : "";
    var people = App.store.getCountryPeople(iso);
    var businesses = App.store.getCountryBusinesses(iso);
    var fxChange = bloc && bloc.prevRate ? ((bloc.rate - bloc.prevRate) / bloc.prevRate) * 100 : 0;
    var countryLabel = countryFlag ? ((countryFlagMarkup || countryFlag) + " " + App.store.getCountryName(iso)) : App.store.getCountryName(iso);

    tip.style.display = "block";
    moveTip(event);
    tip.innerHTML = [
      "<strong>" + countryLabel + "</strong>",
      bloc ? ((blocFlagMarkup || bloc.flag) + " " + bloc.name) : "Unassigned bloc",
      "Currency: <span style='color:var(--cyan)'>" + currency.sym + " " + currency.code + "</span>",
      "Citizens: " + people.length + " | Firms: " + businesses.length,
      bloc ? ("FX Rate: " + (bloc.rate > 100 ? bloc.rate.toFixed(1) : bloc.rate.toFixed(4)) + "/GU") : "FX Rate: n/a",
      bloc ? ((fxChange >= 0 ? "<span style='color:#e74c3c'>▼ weakening</span>" : "<span style='color:#2ecc71'>▲ strengthening</span>")) : ""
    ].join("<br>");
  }

  function bindCountryTarget(target, iso) {
    if (!target) return;

    target.style.cursor = "pointer";
    target.addEventListener("mouseenter", function (event) {
      setCountryHover(iso, true);
      renderCountryTip(event, iso);
    });
    target.addEventListener("mousemove", moveTip);
    target.addEventListener("mouseleave", function () {
      setCountryHover(iso, false);
      hideTip();
    });
    target.addEventListener("click", function (event) {
      event.stopPropagation();
      App.store.selectCountry(iso);
      App.ui.renderSelection();
    });
  }

  function setupCountryInteractions() {
    var mapRoot = getMapRoot();
    if (!mapRoot) return;

    App.store.blocs.forEach(function (bloc) {
      bloc.members.forEach(function (iso) {
        bindCountryTarget(getCountryGroup(iso), iso);
        bindCountryTarget(mapRoot.querySelector("[id='" + iso + "-label']"), iso);
      });
    });

    mapRoot.addEventListener("click", function (event) {
      var targetId = event.target && event.target.id;
      if (targetId === "World" || targetId === "Ocean") {
        App.store.clearSelection();
        App.ui.renderSelection();
      }
    });
  }

  function isPointInCountry(iso, x, y) {
    return pointInCountryGeometry(getCountryGeometry(iso), x, y);
  }

  function getCountrySpawnPoint(iso, preferredState) {
    var geometry = getCountryGeometry(iso);
    var sampledPoint;
    var stateCode = iso === "US" ? (preferredState || App.utils.pick(App.data.US_STATE_CODES)) : null;
    var stateCentroid;

    if (iso === "US" && stateCode && App.data.US_STATE_CENTROIDS[stateCode]) {
      stateCentroid = App.utils.latLngToSVG(
        App.data.US_STATE_CENTROIDS[stateCode][0],
        App.data.US_STATE_CENTROIDS[stateCode][1]
      );
      sampledPoint = sampleNearPointInCountry("US", stateCentroid, 18, 13, 40);
      if (sampledPoint) {
        return {
          pos: sampledPoint,
          iso: "US",
          state: stateCode
        };
      }
    }

    sampledPoint = sampleCountryGeometryPoint(geometry, 120);
    if (sampledPoint) {
      return {
        pos: sampledPoint,
        iso: iso,
        state: stateCode
      };
    }

    return getFallbackSpawnPoint(iso, stateCode);
  }

  function syncNodeLayer() {
    return;
  }

  function fitMapToPanel(panZoom) {
    panZoom.resize();
    panZoom.fit();
    panZoom.center();
    panZoom.setMinZoom(panZoom.getZoom());
    panZoom.setMaxZoom(80);
    syncNodeLayer();
  }

  function initPanZoom(svgEl) {
    var panZoom = svgPanZoom(svgEl, {
      zoomEnabled: true,
      panEnabled: true,
      controlIconsEnabled: false,
      fit: true,
      center: true,
      minZoom: 1,
      maxZoom: 80,
      zoomScaleSensitivity: 0.35,
      dblClickZoomEnabled: true,
      mouseWheelZoomEnabled: true,
      onZoom: syncNodeLayer,
      onPan: syncNodeLayer,
      onUpdatedCTM: syncNodeLayer
    });

    document.getElementById("zin").onclick = function () { panZoom.zoomIn(); };
    document.getElementById("zout").onclick = function () { panZoom.zoomOut(); };
    document.getElementById("zreset").onclick = function () {
      fitMapToPanel(panZoom);
    };

    fitMapToPanel(panZoom);

    return panZoom;
  }

  function parseInlineMapSource() {
    var svgMarkup = global.NexusWorldMapInlineSvg;
    var parser;
    var parsedDoc;
    var svgEl;

    if (!svgMarkup) return null;

    parser = new DOMParser();
    parsedDoc = parser.parseFromString(svgMarkup, "image/svg+xml");
    if (!parsedDoc || !parsedDoc.documentElement) {
      return null;
    }

    if (parsedDoc.getElementsByTagName("parsererror").length) {
      return null;
    }

    svgEl = parsedDoc.documentElement;
    return svgEl && svgEl.nodeName && svgEl.nodeName.toLowerCase() === "svg" ? svgEl : null;
  }

  function mountInlineMap(host, sourceSvg) {
    var existingMap = document.getElementById("world-map-svg");
    var inlineSvg;

    if (!host || !sourceSvg) return null;

    if (existingMap && existingMap.parentNode) {
      existingMap.parentNode.removeChild(existingMap);
    }

    inlineSvg = document.importNode ? document.importNode(sourceSvg, true) : sourceSvg.cloneNode(true);
    inlineSvg.setAttribute("id", "world-map-svg");
    inlineSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    inlineSvg.style.position = "absolute";
    inlineSvg.style.inset = "0";
    inlineSvg.style.width = "100%";
    inlineSvg.style.height = "100%";
    inlineSvg.style.display = "block";
    inlineSvg.style.background = "#07101a";
    inlineSvg.style.overflow = "hidden";

    host.insertBefore(inlineSvg, host.firstChild || null);

    return inlineSvg;
  }

  function showNodeTip(event, id) {
    var business = App.store.getBusiness(id);
    if (!business) return;

    var bloc = App.store.getBloc(business.blocId);
    var countryFlag = App.utils.renderCountryFlagIcon(business.countryISO, {
      alt:App.store.getCountryName(business.countryISO),
      className:"flag-icon-sm"
    }) || App.utils.renderFlagIcon(bloc.flag, {
      alt:bloc.name,
      className:"flag-icon-sm"
    });
    var currency = App.utils.getCurrency(business.countryISO);
    var owner = App.store.getPerson(business.ownerId);
    var ceo = App.store.getBusinessLeader ? App.store.getBusinessLeader(business, "ceo") : null;
    var ceoPerson = ceo && ceo.person ? ceo.person : owner;
    var location = App.utils.businessLocationLabel(business, false);
    var tip = document.getElementById("map-tip");

    tip.style.display = "block";
    moveTip(event);
    tip.innerHTML = [
      countryFlag + " <strong>" + business.name + "</strong>",
      "CEO: " + (ceoPerson ? ceoPerson.name : "Unknown"),
      (business.industry || "Business") + " - " + location,
      "Stage: " + String(business.stage || "growing").toUpperCase() + " | " + currency.sym + " " + currency.code,
      "Owner: " + (owner ? owner.name : "Unknown") + " | Employees: " + (business.employees || 0),
      "Valuation: " + App.utils.fmtCountry(business.valuationGU || 0, business.countryISO),
      "Revenue: " + App.utils.fmtCountry(business.revenueGU || 0, business.countryISO)
    ].join("<br>");
  }

  function renderNodes() {
    var nodeSvg = App.store.mapSvg ? ensureNodeLayer(App.store.mapSvg) : null;
    var zoom = App.store.panZoom ? Math.max(1, App.store.panZoom.getZoom()) : 1;
    var nodeScale = App.utils.clamp(0.88 * Math.pow(zoom, -0.32), 0.4, 0.94);
    var haloPad = 0.8 * Math.pow(zoom, -0.34) + 0.35;
    var showLabels = zoom >= 3.6;
    var labelFontSize = 2.8 * Math.pow(zoom, -0.14);
    var ownerDocument;
    var seenIds = {};
    var activeBusinesses = App.store.businesses.filter(function (business) {
      return !!business && business.stage !== "defunct";
    });
    var locationKeys = {};

    if (!nodeSvg) return;
    ownerDocument = App.store.mapSvg.ownerDocument || document;

    activeBusinesses.forEach(function (business) {
      var mapIso = resolveMapCountryIso(business.countryISO);
      locationKeys[business.id] = [
        mapIso,
        normalizeText(business.hqCity) || "_country_",
        normalizeText(business.hqSubdivision) || ""
      ].join("|");
    });

    activeBusinesses.forEach(function (business) {
      var node;
      var halo;
      var selectedRing;
      var core;
      var label;
      var locationKey;
      var mapIso;
      var nodeAnchorKey;
      var anchorData;
      var anchor;
      var point;
      var hasStablePoint;
      var pointInCountry;
      var baseRadius;
      var radius;
      var color;
      var selected;
      var opacity;

      mapIso = resolveMapCountryIso(business.countryISO);
      locationKey = locationKeys[business.id] || [
        mapIso,
        normalizeText(business.hqCity) || "_country_",
        normalizeText(business.hqSubdivision) || ""
      ].join("|");
      nodeAnchorKey = locationKey;
      hasStablePoint = Number.isFinite(Number(business.mapSvgX)) && Number.isFinite(Number(business.mapSvgY));
      pointInCountry = hasStablePoint ? isPointInCountry(mapIso, Number(business.mapSvgX), Number(business.mapSvgY)) : false;

      if (!hasStablePoint || business.mapNodeAnchorKey !== nodeAnchorKey || business.mapNodeCountryISO !== mapIso || !pointInCountry) {
        anchorData = getBusinessAnchorPoint(business, mapIso);
        anchor = anchorData && anchorData.point ? anchorData.point : { x: 500, y: 253 };
        point = spreadPointAroundAnchor(mapIso, anchor, nodeAnchorKey, business.id || nodeAnchorKey);

        business.mapSvgX = point.x;
        business.mapSvgY = point.y;
        business.mapNodeAnchorKey = nodeAnchorKey;
        business.mapNodeCountryISO = mapIso;
      }

      baseRadius = App.utils.clamp(1.4 + (Math.log10(Math.max(1, Number(business.valuationGU) || 1)) - 3.8) * 0.8, 1.2, 3.9);
      radius = Math.max(0.7, baseRadius * nodeScale);
      color = getBusinessNodeColor(business.stage);
      selected = App.store.selection.type === "business" && App.store.selection.id === business.id;
      opacity = selected ? 1 : 0.9;

      seenIds[business.id] = true;
      node = nodeSvg.querySelector(".bnode[data-business-id='" + business.id + "']");

      if (!node) {
        node = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "g");
        node.setAttribute("class", "bnode");
        node.setAttribute("data-business-id", business.id);
      }

      halo = node.querySelector("circle[data-role='pulse']");
      selectedRing = node.querySelector("circle[data-role='selected']");
      core = node.querySelector("circle[data-role='core']");

      if (selected) {
        if (!halo) {
          halo = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "circle");
          halo.setAttribute("data-role", "pulse");
          node.appendChild(halo);
        }
        halo.setAttribute("cx", business.mapSvgX);
        halo.setAttribute("cy", business.mapSvgY);
        halo.setAttribute("r", radius + (haloPad * 2.6));
        halo.setAttribute("fill", "none");
        halo.setAttribute("stroke", color);
        halo.setAttribute("stroke-width", Math.max(0.18, 0.54 * nodeScale));
        halo.setAttribute("opacity", "0.42");
      } else if (halo) {
        halo.remove();
      }

      if (selected) {
        if (!selectedRing) {
          selectedRing = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "circle");
          selectedRing.setAttribute("data-role", "selected");
          node.appendChild(selectedRing);
        }
        selectedRing.setAttribute("cx", business.mapSvgX);
        selectedRing.setAttribute("cy", business.mapSvgY);
        selectedRing.setAttribute("r", radius + (haloPad * 1.8));
        selectedRing.setAttribute("fill", "none");
        selectedRing.setAttribute("stroke", color);
        selectedRing.setAttribute("stroke-width", Math.max(0.16, 0.7 * nodeScale));
      } else if (selectedRing) {
        selectedRing.remove();
      }

      if (!core) {
        core = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "circle");
        core.setAttribute("data-role", "core");
        node.appendChild(core);
      }
      core.setAttribute("cx", business.mapSvgX);
      core.setAttribute("cy", business.mapSvgY);
      core.setAttribute("r", radius);
      core.setAttribute("fill", color);
      core.setAttribute("opacity", opacity);

      label = node.querySelector("text[data-role='label']");
      if (selected || showLabels) {
        if (!label) {
          label = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "text");
          label.setAttribute("data-role", "label");
          node.appendChild(label);
        }
        label.setAttribute("x", business.mapSvgX + radius + (0.9 * Math.pow(zoom, -0.35)));
        label.setAttribute("y", business.mapSvgY + (labelFontSize * 0.45));
        label.setAttribute("font-family", "Share Tech Mono, monospace");
        label.setAttribute("font-size", labelFontSize);
        label.setAttribute("fill", "#5a7a9a");
        label.textContent = App.utils.getBusinessTicker ? App.utils.getBusinessTicker(business.name) : String(business.name || "").slice(0, 8);
      } else if (label) {
        label.remove();
      }

      if (!node.parentNode) {
        nodeSvg.appendChild(node);
      }
    });

    Array.prototype.forEach.call(nodeSvg.querySelectorAll(".bnode, .pnode"), function (node) {
      var id = node.getAttribute("data-business-id") || node.getAttribute("data-person-id");

      if (!seenIds[id]) {
        node.remove();
        return;
      }

      if (node.__nexusBound) return;

      node.addEventListener("click", function (event) {
        event.stopPropagation();
        App.store.selectBusiness(id);
        App.ui.renderSelection();
      });
      node.addEventListener("mouseenter", function (event) {
        showNodeTip(event, id);
      });
      node.addEventListener("mouseleave", hideTip);
      node.__nexusBound = true;
    });
  }

  function init() {
    return new Promise(function (resolve, reject) {
      var hostEl = document.getElementById("map-container");
      var sourceSvg;
      var svgEl;
      var panZoom;

      if (!hostEl) {
        reject(new Error("Map container not found."));
        return;
      }

      try {
        sourceSvg = parseInlineMapSource();
        if (!sourceSvg) {
          reject(new Error("Embedded world map source was not available."));
          return;
        }

        if (App.store.panZoom && typeof App.store.panZoom.destroy === "function") {
          App.store.panZoom.destroy();
        }

        svgEl = mountInlineMap(hostEl, sourceSvg);
        if (!svgEl) {
          reject(new Error("Inline world map could not be created."));
          return;
        }

        countryGeometryCache = {};
        injectMapStyles(svgEl);
        App.store.updateMapRefs(hostEl, svgEl, document, null);
        registerCountryNames();
        panZoom = initPanZoom(svgEl);
        App.store.updateMapRefs(hostEl, svgEl, document, panZoom);
        ensureNodeLayer(svgEl);
        applyBlocColors();
        setupCountryInteractions();
        syncNodeLayer();

        if (!initialized) {
          window.addEventListener("resize", function () {
            if (App.store.panZoom) {
              fitMapToPanel(App.store.panZoom);
            }
          });
          initialized = true;
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  App.map = {
    init: init,
    applyBlocColors: applyBlocColors,
    updateCountryColors: updateCountryColors,
    renderNodes: renderNodes,
    syncNodeLayer: syncNodeLayer,
    getCountrySpawnPoint: getCountrySpawnPoint,
    isPointInCountry: isPointInCountry,
    hideTip: hideTip,
    moveTip: moveTip
  };
})(window);
