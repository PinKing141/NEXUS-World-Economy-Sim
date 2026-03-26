(function (global) {
  var App = global.Nexus || (global.Nexus = {});
  var initialized = false;
  var countryGeometryCache = {};

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
      "#nexus-node-layer .pnode circle, #nexus-node-layer .pnode text { transition: cx 0.22s ease, cy 0.22s ease, r 0.22s ease, opacity 0.22s ease, fill 0.22s ease, x 0.22s ease, y 0.22s ease, font-size 0.22s ease; }",
      "#nexus-node-layer .pnode { cursor:pointer; }",
      "#Ocean, #World { stroke:none !important; }"
    ].join(" ");
    defs.appendChild(styleNode);
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
    var people = App.store.getCountryPeople(iso);
    var businesses = App.store.getCountryBusinesses(iso);
    var fxChange = bloc && bloc.prevRate ? ((bloc.rate - bloc.prevRate) / bloc.prevRate) * 100 : 0;
    var countryLabel = countryFlag ? (countryFlag + " " + App.store.getCountryName(iso)) : App.store.getCountryName(iso);

    tip.style.display = "block";
    moveTip(event);
    tip.innerHTML = [
      "<strong>" + countryLabel + "</strong>",
      bloc ? (bloc.flag + " " + bloc.name) : "Unassigned bloc",
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
    var person = App.store.getPerson(id);
    if (!person) return;

    var bloc = App.store.getBloc(person.blocId);
    var countryFlag = App.utils.getCountryFlag(person.countryISO) || bloc.flag;
    var business = App.store.getAssociatedBusiness(person);
    var currency = App.utils.getCurrency(person.countryISO);
    var spouse = App.store.getSpouse(person);
    var children = App.store.getChildren(person, false);
    var heir = person.businessId && App.sim.getPotentialHeir ? App.sim.getPotentialHeir(person) : null;
    var roleLabel = person.jobTitle ? (person.jobTitle + " - ") : "";
    var tip = document.getElementById("map-tip");

    tip.style.display = "block";
    moveTip(event);
    tip.innerHTML = [
      countryFlag + " <strong>" + person.name + "</strong>",
      roleLabel + App.utils.getLifeStageLabel(person) + " - " + App.utils.locationLabel(person, false) + " - " + currency.sym + " " + currency.code,
      business ? business.name : "No business",
      spouse ? ((person.sex === "male" ? "Spouse: " : "Spouse: ") + spouse.name) : "Spouse: none",
      "Children: " + children.length + (heir ? (" | Heir: " + heir.name) : ""),
      App.utils.fmtCountry(person.netWorthGU, person.countryISO),
      "<span style='color:var(--text3)'>" + App.utils.fmtGU(person.netWorthGU) + "</span>"
    ].join("<br>");
  }

  function renderNodes() {
    var nodeSvg = App.store.mapSvg ? ensureNodeLayer(App.store.mapSvg) : null;
    var zoom = App.store.panZoom ? Math.max(1, App.store.panZoom.getZoom()) : 1;
    var nodeScale = App.utils.clamp(0.82 * Math.pow(zoom, -0.45), 0.24, 0.9);
    var haloPad = 0.95 * Math.pow(zoom, -0.42) + 0.25;
    var showAdultLabels = zoom >= 3.2;
    var labelFontSize = 2.5 * Math.pow(zoom, -0.2);
    var ownerDocument;
    var seenIds = {};

    if (!nodeSvg) return;
    ownerDocument = App.store.mapSvg.ownerDocument || document;

    App.store.getPublicPeople().forEach(function (person) {
      var node;
      var halo;
      var selectedRing;
      var core;
      var label;
      var business;
      var baseRadius;
      var radius;
      var color;
      var selected;
      var isMinor;
      var opacity;

      if (person && person.countryISO && !isPointInCountry(person.countryISO, person.svgX, person.svgY)) {
        var correctedSpawn = getCountrySpawnPoint(person.countryISO, person.state || null);
        if (correctedSpawn && correctedSpawn.pos && isPointInCountry(person.countryISO, correctedSpawn.pos.x, correctedSpawn.pos.y)) {
          person.svgX = correctedSpawn.pos.x;
          person.svgY = correctedSpawn.pos.y;
          if (person.countryISO === "US") {
            person.state = correctedSpawn.state || person.state || null;
            if (App.data && typeof App.data.getWorldCitiesByCountryState === "function") {
              var alignedCities = App.data.getWorldCitiesByCountryState("US", person.state, 48);
              if (alignedCities.length && alignedCities.indexOf(person.city) === -1) {
                person.city = App.utils.pick(alignedCities);
              }
            }
          }
        } else {
          return;
        }
      }

      business = App.store.getAssociatedBusiness(person);
      baseRadius = business ? Math.min(4.5, 1 + Math.log10(Math.max(1, business.valuationGU / 8000)) * 1.1) : 1;
      radius = Math.max(0.16, baseRadius * nodeScale);
      color = App.data.STATUS_COLOR[person.status] || "#00d4ff";
      selected = App.store.selection.type === "person" && App.store.selection.id === person.id;
      isMinor = person.age < 18;
      opacity = isMinor ? 0.55 : (selected ? 1 : 0.85);

      if (isMinor) {
        radius = Math.max(0.7, radius * 0.72);
      }

      seenIds[person.id] = true;
      node = nodeSvg.querySelector(".pnode[data-person-id='" + person.id + "']");

      if (!node) {
        node = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "g");
        node.setAttribute("class", "pnode");
        node.setAttribute("data-person-id", person.id);
      }

      halo = node.querySelector("circle[data-role='pulse']");
      selectedRing = node.querySelector("circle[data-role='selected']");
      core = node.querySelector("circle[data-role='core']");

      if (person.pulse) {
        if (!halo) {
          halo = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "circle");
          halo.setAttribute("data-role", "pulse");
          node.appendChild(halo);
        }
        halo.setAttribute("cx", person.svgX);
        halo.setAttribute("cy", person.svgY);
        halo.setAttribute("r", radius + (haloPad * 2.6));
        halo.setAttribute("fill", "none");
        halo.setAttribute("stroke", color);
        halo.setAttribute("stroke-width", Math.max(0.12, 0.48 * nodeScale));
        halo.setAttribute("opacity", "0.35");
      } else if (halo) {
        halo.remove();
      }

      if (selected) {
        if (!selectedRing) {
          selectedRing = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "circle");
          selectedRing.setAttribute("data-role", "selected");
          node.appendChild(selectedRing);
        }
        selectedRing.setAttribute("cx", person.svgX);
        selectedRing.setAttribute("cy", person.svgY);
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
      core.setAttribute("cx", person.svgX);
      core.setAttribute("cy", person.svgY);
      core.setAttribute("r", radius);
      core.setAttribute("fill", color);
      core.setAttribute("opacity", opacity);

      label = node.querySelector("text[data-role='label']");
      if (person.age >= 16 && (selected || showAdultLabels)) {
        if (!label) {
          label = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "text");
          label.setAttribute("data-role", "label");
          node.appendChild(label);
        }
        label.setAttribute("x", person.svgX + radius + (0.9 * Math.pow(zoom, -0.35)));
        label.setAttribute("y", person.svgY + (labelFontSize * 0.45));
        label.setAttribute("font-family", "Share Tech Mono, monospace");
        label.setAttribute("font-size", labelFontSize);
        label.setAttribute("fill", "#5a7a9a");
        label.textContent = person.name.split(" ")[0];
      } else if (label) {
        label.remove();
      }

      if (!node.parentNode) {
        nodeSvg.appendChild(node);
      }
    });

    Array.prototype.forEach.call(nodeSvg.querySelectorAll(".pnode"), function (node) {
      var id = node.getAttribute("data-person-id");

      if (!seenIds[id]) {
        node.remove();
        return;
      }

      if (node.__nexusBound) return;

      node.addEventListener("click", function (event) {
        event.stopPropagation();
        App.store.selectPerson(id);
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
