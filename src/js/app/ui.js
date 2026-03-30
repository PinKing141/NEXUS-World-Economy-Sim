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
  var activePersonDetailTab = "overview";
  var lastNewsRenderSignature = "";
  var tickerRenderSlots = [];
  var tickerIdentitySignature = "";
  var tickerDisplayOrder = [];
  var lastTickerCompositionDay = null;
  var tickerAnimationSyncFrame = null;
  var closureGateResult = null;
  var closureGateRunning = false;
  var closureGateFastForwardRunning = false;
  var closureGateLastRunDay = null;
  var closureScenarioRunning = false;
  var closureScenarioSelectedId = "";
  var closureScenarioResult = null;
  var closureScenarioSuiteResult = null;
  var STOCK_CHART_VIEW_MODE_STORAGE_KEY = "nexus.stockChartViewMode.v1";
  var ECON_CHART_VIEW_MODE_STORAGE_KEY = "nexus.econChartViewMode.v1";
  var INSPECTOR_TOOLTIP_TOGGLE_STORAGE_KEY = "nexus.inspectorTooltipsEnabled.v1";
  var CLOSURE_BASELINE_STORAGE_KEY = "nexus.closureBaseline.v1";
  var CLOSURE_TELEMETRY_STORAGE_KEY = "nexus.closureTelemetry.v1";
  var CLOSURE_FAST_FORWARD_YEARS_STORAGE_KEY = "nexus.closureFastForwardYears.v1";
  var CLOSURE_TELEMETRY_MAX_ITEMS = 12;
  var CLOSURE_FAST_FORWARD_YEARS_DEFAULT = 1;
  var CLOSURE_FAST_FORWARD_YEARS_MAX = 50;
  var TICKER_SCROLL_PIXELS_PER_SECOND = 40;
  var TICKER_SCROLL_MIN_SECONDS = 45;
  var TICKER_SCROLL_MAX_SECONDS = 180;
  var closureGateBaseline = null;
  var closureGateBaselineDiff = null;
  var closureTelemetryHistory = [];
  var closureFastForwardYears = CLOSURE_FAST_FORWARD_YEARS_DEFAULT;
  var stockChartViewMode = "line";
  var econChartViewMode = "absolute";
  var econChartHoverIndex = null;
  var inspectorTooltipsEnabled = true;
  var lastSelectionRenderDay = null;
  var settingsMenuOpen = false;
  var slotsMenuOpen = false;
  var slotsModalMode = "save";

  function normalizeStockChartViewMode(value){
    var mode = String(value || "").toLowerCase();
    return mode === "candles" ? "candles" : "line";
  }

  function normalizeEconChartViewMode(value){
    var mode = String(value || "").toLowerCase();
    if (mode === "relative") return "relative";
    if (mode === "log") return "log";
    return "absolute";
  }

  function normalizeTooltipToggle(value){
    var text = String(value == null ? "" : value).toLowerCase();
    return !(text === "false" || text === "0" || text === "off");
  }

  function normalizeClosureFastForwardYears(value){
    var numeric = Math.floor(Number(value) || 0);

    if (!Number.isFinite(numeric) || numeric <= 0) {
      return CLOSURE_FAST_FORWARD_YEARS_DEFAULT;
    }

    return Math.max(1, Math.min(CLOSURE_FAST_FORWARD_YEARS_MAX, numeric));
  }

  function getClosureFastForwardConfig(){
    var daysPerYear = (App.data && App.data.CALENDAR && App.data.CALENDAR.daysPerYear) ? Number(App.data.CALENDAR.daysPerYear) : 360;
    var years = normalizeClosureFastForwardYears(closureFastForwardYears);

    return {
      years:years,
      daysPerYear:daysPerYear,
      totalDays:years * daysPerYear
    };
  }

  function formatClosureFastForwardLabel(years){
    return "Sim +" + years + "Y";
  }

  function buildClosureFastForwardNote(){
    var config = getClosureFastForwardConfig();

    return formatClosureFastForwardLabel(config.years) + " uses the real live simulation tick path for " + config.totalDays + " days (" + config.years + " year" + (config.years === 1 ? "" : "s") + "), not the closure scenario harness.";
  }

  function syncClosureFastForwardControls(){
    var input = document.getElementById("closure-fast-forward-years-input");
    var button = document.getElementById("sim-forward-year-btn");
    var note = document.getElementById("closure-fast-forward-note");
    var config = getClosureFastForwardConfig();

    closureFastForwardYears = config.years;

    if (input) {
      input.value = String(config.years);
    }
    if (button) {
      button.textContent = closureGateFastForwardRunning ? "Simulating..." : formatClosureFastForwardLabel(config.years);
    }
    if (note) {
      note.textContent = buildClosureFastForwardNote();
    }
  }

  function safeLocalStorageGet(key){
    try {
      if (!global.localStorage) return null;
      return global.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeLocalStorageSet(key, value){
    try {
      if (!global.localStorage) return false;
      global.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeLocalStorageRemove(key){
    try {
      if (!global.localStorage) return false;
      global.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function downloadTextFile(filename, content, mimeType){
    var BlobCtor = global.Blob;
    var URLCtor = global.URL || global.webkitURL;
    var blob;
    var url;
    var link;

    if (typeof BlobCtor !== "function" || !URLCtor || typeof URLCtor.createObjectURL !== "function") {
      return false;
    }

    try {
      blob = new BlobCtor([String(content || "")], { type:mimeType || "text/plain;charset=utf-8" });
      url = URLCtor.createObjectURL(blob);
      link = document.createElement("a");
      link.href = url;
      link.download = String(filename || "download.txt");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      global.setTimeout(function(){
        URLCtor.revokeObjectURL(url);
      }, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  function escapeCsvValue(value){
    var text = value == null ? "" : String(value);

    if (/[",\r\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function serializeRowsToCsv(rows){
    var safeRows = Array.isArray(rows) ? rows : [];
    var headers;

    if (!safeRows.length) return "";

    headers = Object.keys(safeRows[0]);
    return [headers.join(",")].concat(safeRows.map(function(row){
      return headers.map(function(header){
        return escapeCsvValue(row[header]);
      }).join(",");
    })).join("\r\n");
  }

  function getYearlyExportSummary(){
    var payload;

    if (!App.sim || typeof App.sim.getYearlyTuningCsvExport !== "function") {
      return {
        yearCount:0,
        rowCount:0,
        firstCalendarYear:null,
        lastCalendarYear:null
      };
    }

    payload = App.sim.getYearlyTuningCsvExport();
    return {
      yearCount:Math.max(0, Number(payload && payload.yearCount) || 0),
      rowCount:Math.max(0, Number(payload && payload.rowCount) || 0),
      firstCalendarYear:payload && payload.firstCalendarYear != null ? payload.firstCalendarYear : null,
      lastCalendarYear:payload && payload.lastCalendarYear != null ? payload.lastCalendarYear : null
    };
  }

  function renderYearlyExportNote(){
    var noteNode = document.getElementById("settings-yearly-export-note");
    var exportButton = document.getElementById("settings-export-yearly-btn");
    var summary = getYearlyExportSummary();
    var message;

    if (summary.yearCount > 0) {
      message = "Yearly tuning CSV has " + summary.yearCount + " completed year" + (summary.yearCount === 1 ? "" : "s") + " cached";
      if (summary.firstCalendarYear != null && summary.lastCalendarYear != null) {
        message += " (" + summary.firstCalendarYear + " to " + summary.lastCalendarYear + ")";
      }
      message += ". Export includes world and bloc rows (" + summary.rowCount + " total rows).";
    } else {
      message = "Yearly tuning CSV captures completed years only. Let at least one full year pass before exporting.";
    }

    if (noteNode) {
      noteNode.textContent = message;
    }
    if (exportButton) {
      exportButton.disabled = summary.yearCount === 0;
    }
  }

  function exportYearlyTuningCsv(){
    var payload;
    var csvText;
    var downloaded;

    if (!App.sim || typeof App.sim.getYearlyTuningCsvExport !== "function") {
      setSettingsStatus("Yearly CSV export is unavailable.", "err");
      return;
    }

    payload = App.sim.getYearlyTuningCsvExport();
    if (!payload || !Array.isArray(payload.rows) || !payload.rows.length) {
      setSettingsStatus("No completed yearly data is available yet.", "err");
      renderYearlyExportNote();
      return;
    }

    csvText = serializeRowsToCsv(payload.rows);
    downloaded = downloadTextFile(payload.filename, csvText, "text/csv;charset=utf-8");
    if (!downloaded) {
      setSettingsStatus("CSV download failed in this browser context.", "err");
      return;
    }

    setSettingsStatus("Exported yearly tuning CSV for " + payload.yearCount + " completed year" + (payload.yearCount === 1 ? "" : "s") + ".", "ok");
    renderYearlyExportNote();
  }

  function gateListFromResult(result){
    var tiers = result && result.tiers ? result.tiers : {};
    return []
      .concat(Array.isArray(tiers.tier1) ? tiers.tier1 : [])
      .concat(Array.isArray(tiers.tier2) ? tiers.tier2 : [])
      .concat(Array.isArray(tiers.tier3) ? tiers.tier3 : [])
      .concat(Array.isArray(tiers.tier4) ? tiers.tier4 : []);
  }

  function pickClosureKeyMetrics(result){
    var metrics = result && result.interactionMap && result.interactionMap.keyMetrics ? result.interactionMap.keyMetrics : null;
    if (!metrics || typeof metrics !== "object") return null;

    return {
      unemploymentRate:Number(metrics.unemploymentRate) || 0,
      medianWageAvg:Number(metrics.medianWageAvg) || 0,
      demandTotal:Number(metrics.demandTotal) || 0,
      firmRevenueTotal:Number(metrics.firmRevenueTotal) || 0,
      firmProfitTotal:Number(metrics.firmProfitTotal) || 0,
      householdStressAvg:Number(metrics.householdStressAvg) || 0,
      laborScarcityAvg:Number(metrics.laborScarcityAvg) || 0,
      tradeShockIndexAvg:Number(metrics.tradeShockIndexAvg) || 0
    };
  }

  function createClosureTelemetryEntry(result){
    var summary = result && result.summary ? result.summary : {};
    var loops = result && result.feedbackLoops ? result.feedbackLoops : {};
    var hardFailures = Array.isArray(result && result.hardFailures) ? result.hardFailures : [];

    return {
      day:Number(App.store.simDay) || 0,
      savedAtIso:(new Date()).toISOString(),
      ok:!!(result && result.ok),
      summary:{
        passed:Number(summary.passed) || 0,
        failed:Number(summary.failed) || 0,
        total:Number(summary.total) || 0
      },
      hardFailureCount:hardFailures.filter(function(item){ return !!(item && item.failed); }).length,
      loops:{
        growth:!!loops.growthLoopPass,
        recession:!!loops.recessionLoopPass,
        labour:!!loops.laborPressureLoopPass
      },
      keyMetrics:pickClosureKeyMetrics(result)
    };
  }

  function loadClosureTelemetryHistory(){
    var raw = safeLocalStorageGet(CLOSURE_TELEMETRY_STORAGE_KEY);
    var parsed;

    if (!raw) return [];

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return [];
    }

    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function(entry){
      return !!(entry && entry.keyMetrics && typeof entry.keyMetrics === "object");
    }).slice(0, CLOSURE_TELEMETRY_MAX_ITEMS);
  }

  function persistClosureTelemetryHistory(){
    return safeLocalStorageSet(CLOSURE_TELEMETRY_STORAGE_KEY, JSON.stringify(closureTelemetryHistory.slice(0, CLOSURE_TELEMETRY_MAX_ITEMS)));
  }

  function appendClosureTelemetryEntry(result){
    if (!result) return;
    closureTelemetryHistory.unshift(createClosureTelemetryEntry(result));
    closureTelemetryHistory = closureTelemetryHistory.slice(0, CLOSURE_TELEMETRY_MAX_ITEMS);
    persistClosureTelemetryHistory();
  }

  function formatTelemetryWholeNumber(value){
    var num = Number(value);

    if (!Number.isFinite(num)) return "0";
    return Math.round(num).toLocaleString("en-US");
  }

  function formatTelemetryMetricValue(key, value){
    var num = Number(value) || 0;

    if (key === "unemploymentRate" || key === "laborScarcityAvg" || key === "tradeShockIndexAvg") {
      return (num * 100).toFixed(2) + "%";
    }
    if (key === "householdStressAvg") {
      return num.toFixed(1);
    }
    return formatTelemetryWholeNumber(num);
  }

  function formatTelemetryDelta(key, currentValue, referenceValue){
    var current = Number(currentValue);
    var reference = Number(referenceValue);
    var delta;

    if (!Number.isFinite(current) || !Number.isFinite(reference)) {
      return { text:"n/a", className:"neutral" };
    }

    delta = current - reference;
    if (Math.abs(delta) < 0.0000001) {
      return { text:"0", className:"neutral" };
    }

    if (key === "unemploymentRate" || key === "laborScarcityAvg" || key === "tradeShockIndexAvg") {
      return {
        text:(delta >= 0 ? "+" : "") + (delta * 100).toFixed(2) + "pp",
        className:delta > 0 ? "up" : "down"
      };
    }

    if (key === "householdStressAvg") {
      return {
        text:(delta >= 0 ? "+" : "") + delta.toFixed(1),
        className:delta > 0 ? "up" : "down"
      };
    }

    return {
      text:(delta >= 0 ? "+" : "") + formatTelemetryWholeNumber(delta),
      className:delta > 0 ? "up" : "down"
    };
  }

  function renderClosureTelemetryDashboard(result, baseline, history){
    var currentMetrics = pickClosureKeyMetrics(result);
    var baselineMetrics = baseline && baseline.keyMetrics ? baseline.keyMetrics : null;
    var previousMetrics = history && history.length > 1 && history[1] && history[1].keyMetrics ? history[1].keyMetrics : null;
    var metricRows = [
      { key:"unemploymentRate", label:"Unemployment" },
      { key:"laborScarcityAvg", label:"Labour Scarcity" },
      { key:"householdStressAvg", label:"Household Stress" },
      { key:"tradeShockIndexAvg", label:"Trade Shock Index" },
      { key:"medianWageAvg", label:"Median Wage" },
      { key:"demandTotal", label:"Consumer Demand" },
      { key:"firmRevenueTotal", label:"Firm Revenue" },
      { key:"firmProfitTotal", label:"Firm Profit" }
    ];

    if (!currentMetrics) {
      return "<div class='mc'><div class='mcl'>Balancing Telemetry</div><div class='country-note'>Run closure gates to generate macro telemetry.</div></div>";
    }

    return [
      "<div class='mc'>",
      "<div class='mcl'>Balancing Telemetry</div>",
      "<div class='country-note'>Current macro state with drift from previous closure run and saved baseline.</div>",
      "<div class='closure-telemetry-head'><span>Metric</span><span>Current</span><span>Prev Drift</span><span>Baseline Drift</span></div>",
      "<div class='closure-telemetry-list'>",
      metricRows.map(function(row){
        var key = row.key;
        var previousDelta = formatTelemetryDelta(key, currentMetrics[key], previousMetrics ? previousMetrics[key] : NaN);
        var baselineDelta = formatTelemetryDelta(key, currentMetrics[key], baselineMetrics ? baselineMetrics[key] : NaN);
        return [
          "<div class='closure-telemetry-row'>",
          "<span>" + row.label + "</span>",
          "<span>" + formatTelemetryMetricValue(key, currentMetrics[key]) + "</span>",
          "<span class='delta-" + previousDelta.className + "'>" + previousDelta.text + "</span>",
          "<span class='delta-" + baselineDelta.className + "'>" + baselineDelta.text + "</span>",
          "</div>"
        ].join("");
      }).join(""),
      "</div>",
      "</div>"
    ].join("");
  }

  function renderClosureRunHistory(history){
    var items = Array.isArray(history) ? history.slice(0, 6) : [];

    if (!items.length) return "";

    return [
      "<div class='mc'>",
      "<div class='mcl'>Run History</div>",
      "<div class='closure-history-list'>",
      items.map(function(item){
        var summary = item && item.summary ? item.summary : {};
        var loopText = (item && item.loops && item.loops.growth ? "G" : "g") + "/" + (item && item.loops && item.loops.recession ? "R" : "r") + "/" + (item && item.loops && item.loops.labour ? "L" : "l");
        return [
          "<div class='closure-history-row'>",
          "<span>Day " + (Number(item && item.day) || 0) + "</span>",
          "<span class='" + (item && item.ok ? "delta-down" : "delta-up") + "'>" + (item && item.ok ? "PASS" : "FAIL") + "</span>",
          "<span>P" + (Number(summary.passed) || 0) + "/F" + (Number(summary.failed) || 0) + "</span>",
          "<span>HF " + (Number(item && item.hardFailureCount) || 0) + "</span>",
          "<span>" + loopText + "</span>",
          "</div>"
        ].join("");
      }).join(""),
      "</div>",
      "</div>"
    ].join("");
  }

  function createClosureBaselineSnapshot(result){
    var gates = gateListFromResult(result).map(function(gate){
      return {
        id:String(gate && gate.id || ""),
        pass:!!(gate && gate.pass)
      };
    }).filter(function(gate){ return !!gate.id; });
    var hardFailures = (result && Array.isArray(result.hardFailures) ? result.hardFailures : []).map(function(item){
      return {
        code:String(item && item.code || ""),
        failed:!!(item && item.failed)
      };
    }).filter(function(item){ return !!item.code; });
    var loops = result && result.feedbackLoops ? result.feedbackLoops : {};

    return {
      version:1,
      savedAtDay:App.store.simDay,
      savedAtIso:(new Date()).toISOString(),
      ok:!!(result && result.ok),
      summary:{
        total:Number(result && result.summary && result.summary.total) || gates.length,
        passed:Number(result && result.summary && result.summary.passed) || gates.filter(function(g){ return g.pass; }).length,
        failed:Number(result && result.summary && result.summary.failed) || gates.filter(function(g){ return !g.pass; }).length
      },
      loops:{
        growth:!!loops.growthLoopPass,
        recession:!!loops.recessionLoopPass,
        labour:!!loops.laborPressureLoopPass
      },
      keyMetrics:pickClosureKeyMetrics(result),
      gates:gates,
      hardFailures:hardFailures
    };
  }

  function loadClosureBaselineSnapshot(){
    var raw = safeLocalStorageGet(CLOSURE_BASELINE_STORAGE_KEY);
    var parsed;

    if (!raw) return null;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return null;
    }

    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.gates)) return null;
    return parsed;
  }

  function compareClosureResultToBaseline(result, baseline){
    var messages = [];
    var gateById = {};
    var hardFailureByCode = {};
    var loops = result && result.feedbackLoops ? result.feedbackLoops : {};
    var currentMetrics = pickClosureKeyMetrics(result);
    var baselineMetrics = baseline && baseline.keyMetrics ? baseline.keyMetrics : null;
    var daysPerYear = (App.data && App.data.CALENDAR && App.data.CALENDAR.daysPerYear) ? Number(App.data.CALENDAR.daysPerYear) : 360;
    var baselineDay = Number(baseline && baseline.savedAtDay);
    var currentDay = Number(App.store && App.store.simDay);
    var yearsSinceBaseline = 0;
    var staleMetricBaseline;
    var resetDetected;

    if (!result || !baseline) {
      return { hasBaseline:!!baseline, hasResult:!!result, match:false, changedCount:0, messages:[] };
    }

    if (Number.isFinite(baselineDay) && Number.isFinite(currentDay) && currentDay > baselineDay) {
      yearsSinceBaseline = (currentDay - baselineDay) / Math.max(1, daysPerYear);
    }
    resetDetected = Number.isFinite(baselineDay) && Number.isFinite(currentDay) && baselineDay > (currentDay + Math.max(10, Math.floor(daysPerYear * 0.25)));
    if (resetDetected) {
      return {
        hasBaseline:true,
        hasResult:true,
        match:false,
        changedCount:1,
        messages:["Baseline belongs to an older run state than the current world (reset detected). Save a new baseline to compare accurately."],
        staleMetricBaseline:false,
        resetDetected:true,
        yearsSinceBaseline:0
      };
    }
    staleMetricBaseline = yearsSinceBaseline >= 3;

    gateListFromResult(result).forEach(function(gate){
      if (!gate || !gate.id) return;
      gateById[String(gate.id)] = !!gate.pass;
    });

    (Array.isArray(result.hardFailures) ? result.hardFailures : []).forEach(function(item){
      if (!item || !item.code) return;
      hardFailureByCode[String(item.code)] = !!item.failed;
    });

    if (!!result.ok !== !!baseline.ok) {
      messages.push("System status changed (baseline: " + (baseline.ok ? "PASS" : "FAIL") + ", current: " + (result.ok ? "PASS" : "FAIL") + ").");
    }

    if (!!loops.growthLoopPass !== !!(baseline.loops && baseline.loops.growth)) {
      messages.push("Growth loop changed.");
    }
    if (!!loops.recessionLoopPass !== !!(baseline.loops && baseline.loops.recession)) {
      messages.push("Recession loop changed.");
    }
    if (!!loops.laborPressureLoopPass !== !!(baseline.loops && baseline.loops.labour)) {
      messages.push("Labour pressure loop changed.");
    }

    (baseline.gates || []).forEach(function(gate){
      var id = String(gate && gate.id || "");
      if (!id) return;
      if (gateById[id] !== !!gate.pass) {
        messages.push("Gate " + id + " changed from " + (gate.pass ? "PASS" : "FAIL") + " to " + (gateById[id] ? "PASS" : "FAIL") + ".");
      }
    });

    (baseline.hardFailures || []).forEach(function(item){
      var code = String(item && item.code || "");
      if (!code) return;
      if (hardFailureByCode[code] !== !!item.failed) {
        messages.push(code + " changed from " + (item.failed ? "TRIGGERED" : "CLEAR") + " to " + (hardFailureByCode[code] ? "TRIGGERED" : "CLEAR") + ".");
      }
    });

    if (baselineMetrics && currentMetrics && !staleMetricBaseline) {
      if (Math.abs((Number(currentMetrics.unemploymentRate) || 0) - (Number(baselineMetrics.unemploymentRate) || 0)) > 0.012) {
        messages.push("Unemployment drift exceeded tolerance.");
      }
      if (Math.abs((Number(currentMetrics.tradeShockIndexAvg) || 0) - (Number(baselineMetrics.tradeShockIndexAvg) || 0)) > 0.1) {
        messages.push("Trade shock index drift exceeded tolerance.");
      }
      if (Math.abs((Number(currentMetrics.householdStressAvg) || 0) - (Number(baselineMetrics.householdStressAvg) || 0)) > 25) {
        messages.push("Household stress drift exceeded tolerance.");
      }
      if (Math.abs((Number(currentMetrics.demandTotal) || 0) - (Number(baselineMetrics.demandTotal) || 0)) > Math.max(1, (Number(baselineMetrics.demandTotal) || 0) * 0.12)) {
        messages.push("Consumer demand drift exceeded tolerance.");
      }
      if (Math.abs((Number(currentMetrics.firmRevenueTotal) || 0) - (Number(baselineMetrics.firmRevenueTotal) || 0)) > Math.max(1, (Number(baselineMetrics.firmRevenueTotal) || 0) * 0.14)) {
        messages.push("Firm revenue drift exceeded tolerance.");
      }
    }

    return {
      hasBaseline:true,
      hasResult:true,
      match:messages.length === 0,
      changedCount:messages.length,
      messages:messages,
      staleMetricBaseline:staleMetricBaseline,
      resetDetected:false,
      yearsSinceBaseline:Number(yearsSinceBaseline.toFixed(2))
    };
  }

  closureGateBaseline = loadClosureBaselineSnapshot();
  closureTelemetryHistory = loadClosureTelemetryHistory();
  closureFastForwardYears = normalizeClosureFastForwardYears(safeLocalStorageGet(CLOSURE_FAST_FORWARD_YEARS_STORAGE_KEY));

  function setInspectorTab(tab){
    activeInspectorTab = tab === "governor" || tab === "closure" ? tab : "inspector";
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

  function formatGateStatusBadge(pass){
    return "<span class='closure-pill " + (pass ? "ok" : "fail") + "'>" + (pass ? "PASS" : "FAIL") + "</span>";
  }

  function renderGateRows(gates){
    if (!gates || !gates.length) {
      return "<div class='country-note'>No gate results yet.</div>";
    }

    return "<div class='closure-gate-list'>" + gates.map(function(gate){
      var evidence = gate && gate.evidence && typeof gate.evidence === "object" ? gate.evidence : {};
      var evidenceText = Object.keys(evidence).slice(0, 4).map(function(key){
        return key + ": " + evidence[key];
      }).join(" | ");

      return [
        "<div class='closure-gate-row " + (gate.pass ? "ok" : "fail") + "'>",
        "<div class='closure-gate-head'><span class='closure-gate-id'>" + (gate.id || "?") + "</span><span class='closure-gate-title'>" + (gate.title || "Gate") + "</span>" + formatGateStatusBadge(!!gate.pass) + "</div>",
        evidenceText ? ("<div class='country-note'>" + evidenceText + "</div>") : "",
        "</div>"
      ].join("");
    }).join("") + "</div>";
  }

  function renderHardFailureRows(items){
    if (!items || !items.length) return "";

    return "<div class='closure-failure-list'>" + items.map(function(item){
      return "<div class='closure-failure-row " + (item.failed ? "failed" : "ok") + "'><span>" + (item.code || "HF") + "</span><span>" + (item.label || "Failure check") + "</span><span>" + (item.failed ? "TRIGGERED" : "CLEAR") + "</span></div>";
    }).join("") + "</div>";
  }

  function renderScenarioResultCard(result){
    var evidence;
    var evidenceText;

    if (!result) return "";

    evidence = result && result.evidence && typeof result.evidence === "object" ? result.evidence : {};
    evidenceText = Object.keys(evidence).slice(0, 6).map(function(key){
      return key + ": " + evidence[key];
    }).join(" | ");

    return [
      "<div class='mc'>",
      "<div class='mcl'>Scenario Pack Result</div>",
      "<div class='closure-gate-row " + (result.pass ? "ok" : "fail") + "'>",
      "<div class='closure-gate-head'><span class='closure-gate-id'>SP</span><span class='closure-gate-title'>" + (result.title || result.label || "Scenario") + "</span>" + formatGateStatusBadge(!!result.pass) + "</div>",
      "<div class='country-note'>Duration: " + (result.days || 0) + " days.</div>",
      evidenceText ? ("<div class='country-note'>" + evidenceText + "</div>") : "",
      "</div>",
      "</div>"
    ].join("");
  }

  function renderScenarioSuiteResultCard(suite){
    var items;

    if (!suite || !Array.isArray(suite.results)) return "";

    items = suite.results.map(function(item){
      return "<div class='closure-failure-row " + (item && item.pass ? "ok" : "failed") + "'><span>" + ((item && item.label) || "Scenario") + "</span><span>" + (item && item.pass ? "PASS" : "FAIL") + "</span><span>" + ((item && item.days) || 0) + "d</span></div>";
    }).join("");

    return [
      "<div class='mc'>",
      "<div class='mcl'>Scenario Suite Summary</div>",
      "<div class='country-note'>Passed " + (suite.summary && suite.summary.passed || 0) + " / " + (suite.summary && suite.summary.total || 0) + " scenario presets.</div>",
      "<div class='closure-failure-list'>" + items + "</div>",
      "</div>"
    ].join("");
  }

  function renderClosureGates(){
    var el = document.getElementById("dc");
    var result = closureGateResult;
    var summary = result && result.summary ? result.summary : null;
    var tier1 = result && result.tiers ? result.tiers.tier1 : null;
    var tier2 = result && result.tiers ? result.tiers.tier2 : null;
    var tier3 = result && result.tiers ? result.tiers.tier3 : null;
    var tier4 = result && result.tiers ? result.tiers.tier4 : null;
    var failures = result && Array.isArray(result.hardFailures) ? result.hardFailures : [];
    var scenarioPresets = (App.sim && typeof App.sim.getScenarioPresetList === "function") ? (App.sim.getScenarioPresetList() || []) : [];
    var scenarioSelected = scenarioPresets.find(function(item){ return item.id === closureScenarioSelectedId; }) || null;
    var scenarioRunLabel = closureScenarioRunning ? "Running Scenario..." : "Run Scenario";
    var scenarioSuiteLabel = closureScenarioRunning ? "Running All..." : "Run All Scenarios";
    var actionsBusy = closureGateRunning || closureGateFastForwardRunning || closureScenarioRunning;
    var scenarioOptions = "";
    var triggeredFailures = failures.filter(function(item){ return !!item.failed; }).length;
    var runLabel = closureGateRunning ? "Running..." : "Run Closure Gates";
    var saveBaselineDisabled = actionsBusy || !result;
    var compareBaselineDisabled = actionsBusy || !result || !closureGateBaseline;
    var clearBaselineDisabled = !closureGateBaseline;
    var baselineText = closureGateBaseline ? ("Baseline saved at day " + (closureGateBaseline.savedAtDay || 0) + ".") : "No baseline saved.";
    var baselineAgeYears = 0;
    var baselineDiffText = "";
    var daysPerYear = (App.data && App.data.CALENDAR && App.data.CALENDAR.daysPerYear) ? Number(App.data.CALENDAR.daysPerYear) : 360;
    var fastForwardConfig = getClosureFastForwardConfig();
    var statusBadge = result ? (result.ok ? "<span class='closure-pill ok'>SYSTEM PASS</span>" : "<span class='closure-pill fail'>SYSTEM FAIL</span>") : "<span class='closure-pill'>Not Run</span>";

    if (!closureScenarioSelectedId && scenarioPresets.length) {
      closureScenarioSelectedId = scenarioPresets[0].id;
      scenarioSelected = scenarioPresets[0];
    }

    scenarioOptions = scenarioPresets.map(function(preset){
      var selected = preset.id === closureScenarioSelectedId ? " selected" : "";
      return "<option value='" + escapeAttrText(preset.id) + "'" + selected + ">" + preset.label + "</option>";
    }).join("");

    if (closureGateBaseline) {
      baselineAgeYears = Math.max(0, ((Number(App.store.simDay) || 0) - (Number(closureGateBaseline.savedAtDay) || 0)) / Math.max(1, daysPerYear));
      baselineText += " Baseline age: " + baselineAgeYears.toFixed(1) + " years.";
      if ((Number(closureGateBaseline.savedAtDay) || 0) > ((Number(App.store.simDay) || 0) + Math.max(10, Math.floor(daysPerYear * 0.25)))) {
        baselineText += " Current world appears newer-reset than this baseline.";
      }
    }

    if (closureGateBaselineDiff) {
      if (closureGateBaselineDiff.hasBaseline && closureGateBaselineDiff.hasResult) {
        if (closureGateBaselineDiff.resetDetected) {
          baselineDiffText = "<div class='country-note'><strong>BASELINE INVALID FOR CURRENT WORLD:</strong> reset detected. Save a new baseline and compare again.</div>";
        } else if (closureGateBaselineDiff.match) {
          if (closureGateBaselineDiff.staleMetricBaseline) {
            baselineDiffText = "<div class='country-note'><strong>BASELINE MATCH (STRUCTURAL):</strong> no gate/loop/hard-failure deltas. Metric drift checks were skipped because baseline age is " + (Number(closureGateBaselineDiff.yearsSinceBaseline) || 0).toFixed(1) + " years. Save a new baseline for strict metric compare.</div>";
          } else {
            baselineDiffText = "<div class='country-note'><strong>BASELINE MATCH CONFIRMED:</strong> current closure output matches saved baseline with zero deltas.</div>";
          }
        } else {
          baselineDiffText = "<div class='country-note'><strong>BASELINE MISMATCH:</strong> " + closureGateBaselineDiff.changedCount + " delta(s). " + closureGateBaselineDiff.messages.slice(0, 3).join(" | ") + "</div>";
        }
      } else if (closureGateBaselineDiff.messages && closureGateBaselineDiff.messages.length) {
        baselineDiffText = "<div class='country-note'><strong>BASELINE COMPARE:</strong> " + closureGateBaselineDiff.messages[0] + "</div>";
      }
    }

    el.innerHTML = [
      "<div class='mc'>",
      "<div class='mcl'>Tier 1-4 Closure Validation</div>",
      "<div class='country-note'>Runs causal gate checks + scenario shocks with rollback. Use this as hard completion criteria for foundations.</div>",
      "<div class='closure-actions'>",
      "<button id='run-closure-gates-btn' class='sb" + (closureGateRunning ? " act" : "") + "' type='button'" + (actionsBusy ? " disabled" : "") + ">" + runLabel + "</button>",
      "<label class='closure-years-field' for='closure-fast-forward-years-input'><span>Years</span><input id='closure-fast-forward-years-input' class='sb closure-years-input' type='number' min='1' max='" + CLOSURE_FAST_FORWARD_YEARS_MAX + "' step='1' value='" + fastForwardConfig.years + "'" + (actionsBusy ? " disabled" : "") + " aria-label='Years to simulate'></label>",
      "<button id='sim-forward-year-btn' class='sb" + (closureGateFastForwardRunning ? " act" : "") + "' type='button'" + (actionsBusy ? " disabled" : "") + ">" + (closureGateFastForwardRunning ? "Simulating..." : formatClosureFastForwardLabel(fastForwardConfig.years)) + "</button>",
      "<select id='closure-scenario-select' class='sb'" + (actionsBusy || !scenarioPresets.length ? " disabled" : "") + ">" + scenarioOptions + "</select>",
      "<button id='run-closure-scenario-btn' class='sb" + (closureScenarioRunning ? " act" : "") + "' type='button'" + (actionsBusy || !scenarioSelected ? " disabled" : "") + ">" + scenarioRunLabel + "</button>",
      "<button id='run-closure-scenario-suite-btn' class='sb" + (closureScenarioRunning ? " act" : "") + "' type='button'" + (actionsBusy || !scenarioPresets.length ? " disabled" : "") + ">" + scenarioSuiteLabel + "</button>",
      "<button id='save-closure-baseline-btn' class='sb' type='button'" + (saveBaselineDisabled ? " disabled" : "") + ">Save Baseline</button>",
      "<button id='compare-closure-baseline-btn' class='sb' type='button'" + (compareBaselineDisabled ? " disabled" : "") + ">Compare Baseline</button>",
      "<button id='clear-closure-baseline-btn' class='sb' type='button'" + (clearBaselineDisabled ? " disabled" : "") + ">Clear Baseline</button>",
      statusBadge,
      "</div>",
      "<div id='closure-fast-forward-note' class='country-note'>" + buildClosureFastForwardNote() + "</div>",
      (scenarioSelected ? ("<div class='country-note'>Selected scenario: " + scenarioSelected.label + " (" + scenarioSelected.days + " days). " + (scenarioSelected.description || "") + "</div>") : ""),
      "<div class='country-note'>" + baselineText + "</div>",
      baselineDiffText,
      "</div>",
      summary ? ("<div class='sg sg3'><div class='sbox'><div class='sl'>Passed</div><div class='sv g'>" + summary.passed + "</div></div><div class='sbox'><div class='sl'>Failed</div><div class='sv r'>" + summary.failed + "</div></div><div class='sbox'><div class='sl'>Triggered Hard Failures</div><div class='sv " + (triggeredFailures ? "r" : "g") + "'>" + triggeredFailures + "</div></div></div>") : "",
      renderClosureTelemetryDashboard(result, closureGateBaseline, closureTelemetryHistory),
      renderClosureRunHistory(closureTelemetryHistory),
      renderScenarioResultCard(closureScenarioResult),
      renderScenarioSuiteResultCard(closureScenarioSuiteResult),
      result && result.feedbackLoops ? ("<div class='sg sg3'><div class='sbox'><div class='sl'>Growth Loop</div><div class='sv " + (result.feedbackLoops.growthLoopPass ? "g" : "r") + "'>" + (result.feedbackLoops.growthLoopPass ? "Pass" : "Fail") + "</div></div><div class='sbox'><div class='sl'>Recession Loop</div><div class='sv " + (result.feedbackLoops.recessionLoopPass ? "g" : "r") + "'>" + (result.feedbackLoops.recessionLoopPass ? "Pass" : "Fail") + "</div></div><div class='sbox'><div class='sl'>Labour Pressure Loop</div><div class='sv " + (result.feedbackLoops.laborPressureLoopPass ? "g" : "r") + "'>" + (result.feedbackLoops.laborPressureLoopPass ? "Pass" : "Fail") + "</div></div></div>") : "",
      "<div class='mc'><div class='mcl'>Tier 1 Gates</div>" + renderGateRows(tier1) + "</div>",
      "<div class='mc'><div class='mcl'>Tier 2 Gates</div>" + renderGateRows(tier2) + "</div>",
      "<div class='mc'><div class='mcl'>Tier 3 Gates</div>" + renderGateRows(tier3) + "</div>",
      "<div class='mc'><div class='mcl'>Tier 4 Gates</div>" + renderGateRows(tier4) + "</div>",
      "<div class='mc'><div class='mcl'>Hard Failure Conditions</div>" + renderHardFailureRows(failures) + "</div>",
      (closureGateLastRunDay != null ? ("<div class='country-note'>Last run: " + App.utils.fmtDay(closureGateLastRunDay) + "</div>") : "")
    ].join("");
  }

  function ensureTickerSlot(container, index){
    var slot = tickerRenderSlots[index];
    var row;
    var flag;
    var name;
    var value;
    var change;

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
    var changeValue = Number(item.chg);
    var hasChange = Number.isFinite(changeValue);
    var roundedChange = hasChange ? Number(changeValue.toFixed(1)) : 0;
    var isUp = roundedChange > 0;
    var isDown = roundedChange < 0;
    var changeClass = isUp ? "tup" : (isDown ? "tdn" : "tflat");
    var changeLabel = hasChange ? ((isUp ? "▲" : (isDown ? "▼" : "•")) + Math.abs(roundedChange).toFixed(1) + "%") : "--";
    var itemClass = String(item && item.id || "").indexOf("listing:") === 0 ? "ti ti-listing" : "ti ti-index";

    slot.row.className = itemClass;

    slot.flag.innerHTML = item.countryISO
      ? (App.utils.renderCountryFlagIcon(item.countryISO, {
          alt:item.flagLabel || item.name,
          className:"flag-icon-xs"
        }) || "")
      : App.utils.renderFlagIcon(item.flag, {
          alt:item.flagLabel || item.name,
          className:"flag-icon-xs"
        });
    slot.name.textContent = item.name;
    slot.value.textContent = item.local;
    slot.change.className = changeClass;
    slot.change.textContent = changeLabel;
  }

  function syncTickerAnimationDuration(){
    var container = document.getElementById("ticker-inner");
    var wrap = document.getElementById("ticker-wrap");
    var totalWidth;
    var singleLoopWidth;
    var durationSeconds;

    if (!container) return;

    totalWidth = Number(container.scrollWidth) || 0;
    singleLoopWidth = totalWidth > 0 ? totalWidth / 2 : 0;

    if (!singleLoopWidth && wrap) {
      singleLoopWidth = Number(wrap.clientWidth) || 0;
    }

    if (!singleLoopWidth) {
      container.style.animationDuration = "";
      return;
    }

    durationSeconds = singleLoopWidth / TICKER_SCROLL_PIXELS_PER_SECOND;
    if (wrap && singleLoopWidth <= ((Number(wrap.clientWidth) || 0) + 40)) {
      durationSeconds = Math.max(durationSeconds, TICKER_SCROLL_MIN_SECONDS * 1.2);
    }

    durationSeconds = Math.max(TICKER_SCROLL_MIN_SECONDS, Math.min(TICKER_SCROLL_MAX_SECONDS, durationSeconds));
    container.style.animationDuration = durationSeconds.toFixed(1) + "s";
  }

  function scheduleTickerAnimationSync(){
    if (tickerAnimationSyncFrame != null && typeof global.cancelAnimationFrame === "function") {
      global.cancelAnimationFrame(tickerAnimationSyncFrame);
    }

    if (typeof global.requestAnimationFrame === "function") {
      tickerAnimationSyncFrame = global.requestAnimationFrame(function(){
        tickerAnimationSyncFrame = null;
        syncTickerAnimationDuration();
      });
      return;
    }

    syncTickerAnimationDuration();
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

  function escapeHtmlText(value){
    return escapeAttrText(value);
  }

  function renderPlaceStack(lines){
    var parts = (Array.isArray(lines) ? lines : []).map(function(part){
      return escapeHtmlText(part);
    }).filter(Boolean);

    if (!parts.length) return "<span class='place-inline'>Unknown</span>";
    if (parts.length === 1) return "<span class='place-inline'>" + parts[0] + "</span>";

    return [
      "<span class='place-stack'>",
      "<span class='place-primary'>" + parts[0] + "</span>",
      "<span class='place-secondary'>" + parts.slice(1).join(", ") + "</span>",
      "</span>"
    ].join("");
  }

  function renderPlaceInline(label){
    return "<span class='place-inline'>" + escapeHtmlText(label || "Unknown") + "</span>";
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

    if (!inspectorTooltipsEnabled) {
      container.classList.add("tooltips-disabled");
      hideFloatingRichTooltip();
      return;
    }

    container.classList.remove("tooltips-disabled");

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
        var countryFlag = App.utils.renderCountryFlagIcon(business.countryISO, {
          alt:App.store.getCountryName(business.countryISO),
          className:"flag-icon-sm"
        }) || App.utils.renderFlagIcon(bloc ? bloc.flag : "", {
          alt:bloc ? bloc.name : "",
          className:"flag-icon-sm"
        });
        var owner = App.store.getPerson(business.ownerId);
        var hqLabel = App.utils.businessLocationLabel(business, false);
        var selected = App.store.selection.type === "business" && App.store.selection.id === business.id;
        var valuationClass = (Number(business.profitGU) || 0) >= 0 ? "wp" : "wn";

        return [
          "<div class='pr " + (selected ? "sel" : "") + "' data-business-id='" + business.id + "'>",
          "<div class='prn'><span>" + countryFlag + " " + business.name + "</span><span class='st s-" + (business.stage || "growing") + "'>" + (business.stage || "growth") + "</span></div>",
          "<div class='prplace'>" + renderPlaceInline(hqLabel) + "</div>",
          "<div class='prm'>Industry: " + escapeHtmlText(business.industry || "Business") + "</div>",
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
      var countryFlag = App.utils.renderCountryFlagIcon(person.countryISO, {
        alt:App.store.getCountryName(person.countryISO),
        className:"flag-icon-sm"
      }) || App.utils.renderFlagIcon(bloc ? bloc.flag : "", {
        alt:bloc ? bloc.name : "",
        className:"flag-icon-sm"
      });
      var business = App.store.getAssociatedBusiness(person);
      var currency = App.utils.getCurrency(person.countryISO);
      var selected = App.store.selection.type === "person" && App.store.selection.id === person.id;
      var roles = App.utils.getPersonRoles(person);
      var currentLocation = App.utils.locationLabel(person, false);
      var birthplace = App.utils.birthplaceLabel(person, false);
      return [
        "<div class='pr " + (selected ? "sel" : "") + "' data-person-id='" + person.id + "'>",
        "<div class='prn'><span>" + countryFlag + " " + person.name + "</span><span class='st s-" + person.status + "'>" + person.status + "</span></div>",
        "<div class='prplace'>" + renderPlaceInline(currentLocation) + "</div>",
        "<div class='prm'>Currency: " + currency.sym + " " + currency.code + (business ? " | Affiliation: " + escapeHtmlText(business.name) : " | Independent") + "</div>",
        "<div class='prm'>Birthplace: " + escapeHtmlText(birthplace) + "</div>",
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
    var listing = App.store.getListingForBusiness ? App.store.getListingForBusiness(business.id) : null;
    var dividendYield = listing && listing.sharePriceGU > 0 ? ((listing.annualDividendPerShareGU || 0) / listing.sharePriceGU) * 100 : 0;
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
      (listing ? "<div class='brow'>Listing<span>" + listing.symbol + "</span></div>" : ""),
      (listing ? "<div class='brow'>Share Price<span>" + App.utils.fmtCountry(listing.sharePriceGU || 0, business.countryISO) + "</span></div>" : ""),
      (listing ? "<div class='brow'>Dividend Yield<span>" + dividendYield.toFixed(1) + "%</span></div>" : ""),
      "<div class='brow'>Succession Count<span>" + business.successionCount + "</span></div>",
      "</div>",
      (listing ? [
        "<div class='mc'>",
        "<div class='mcl mcl-row'><span>Share Price History</span><div class='chart-mode-toggle' role='group' aria-label='Stock chart mode'>" +
          "<button type='button' class='chart-mode-btn " + (stockChartViewMode === "line" ? "act" : "") + "' data-stock-chart-mode='line'>Line</button>" +
          "<button type='button' class='chart-mode-btn " + (stockChartViewMode === "candles" ? "act" : "") + "' data-stock-chart-mode='candles'>Candles</button>" +
        "</div></div>",
        "<canvas id='sch' class='stock-chart-canvas' height='64'></canvas>",
        "</div>"
      ].join("") : "<div class='country-note'>Business is not publicly listed yet.</div>"),
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
    var assetTotal;
    var assetNetWorth;
    var assetReturnPct;
    var membersTip = "Total household members across adults and children.";
    var classTip = "Household class position based on income, assets, and resilience.";
    var mobilityTip = "Recent upward, stable, or downward movement in household economic trajectory.";
    var incomeTip = "Average monthly household inflow from wages, business income, and transfers.";
    var expensesTip = "Average monthly household outflow for living costs and obligations.";
    var stressTip = "Household financial strain. Higher values indicate tighter budgets and higher risk.";
    var cashTip = "Liquid cash available for immediate use.";
    var debtTip = "Total household liabilities currently owed.";
    var inheritanceLoadTip = "Estimated economic load tied to family wealth transfer expectations.";
    var assetCashTip = "Cash component of household asset holdings.";
    var equityTip = "Value held in shares and other equity-like positions.";
    var propertyTip = "Estimated value of owned property assets.";
    var ownershipTip = "Estimated value of private business ownership stakes.";
    var trustsTip = "Value held in trust-like inherited asset pools.";
    var assetDebtTip = "Debt linked specifically to asset-backed obligations.";
    var totalAssetsTip = "Combined value of all household assets before liabilities.";
    var netAssetsTip = "Total assets minus all debt obligations.";
    var annualCarryTip = "Estimated annual net return from household assets after baseline effects.";

    if (!household) {
      return "<div class='mc'><div class='mcl'>Household Economy</div><div class='country-note'>Household data is still being assembled.</div></div>";
    }

    members = (household.adultIds || []).length + (household.childIds || []).length;
    housingBurden = household.monthlyExpensesGU > 0 ? Math.round(((household.housingCostGU || 0) / household.monthlyExpensesGU) * 100) : 0;
    childcareBurden = household.monthlyExpensesGU > 0 ? Math.round(((household.childcareCostGU || 0) / household.monthlyExpensesGU) * 100) : 0;
    mobilityLabel = household.mobilityScore > 8 ? "upward" : (household.mobilityScore < -8 ? "downward" : "stable");
    stressClass = household.financialStress >= 72 ? "r" : (household.financialStress >= 48 ? "a" : "g");
    assetTotal = Math.max(0,
      (Number(household.assetCashGU) || Number(household.cashOnHandGU) || 0) +
      (Number(household.assetEquityGU) || 0) +
      (Number(household.assetBusinessOwnershipGU) || 0) +
      (Number(household.assetPropertyGU) || 0) +
      (Number(household.assetTrustGU) || 0)
    );
    assetNetWorth = assetTotal - (Number(household.assetDebtObligationsGU) || Number(household.debtGU) || 0);
    assetReturnPct = (Number(household.assetReturnRateAnnual) || 0) * 100;

    if (profile) {
      if ((profile.populationPressure || 0.5) >= 0.62) {
        pressureLabel = "high-cost strain";
      } else if ((profile.populationPressure || 0.5) <= 0.42) {
        pressureLabel = "lighter strain";
      }
    }

    return [
      "<div class='mc'>",
      "<div class='mcl'>Household Economy</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Members", membersTip) + "><div class='sl'>Members</div><div class='sv b'>" + members + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Class", classTip) + "><div class='sl'>Class</div><div class='sv a'>" + String(household.classTier || "working").toUpperCase() + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Mobility", mobilityTip) + "><div class='sl'>Mobility</div><div class='sv c'>" + mobilityLabel.toUpperCase() + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Income / Month", incomeTip) + "><div class='sl'>Income / Month</div><div class='sv g'>" + App.utils.fmtCountry(household.monthlyIncomeGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Expenses / Month", expensesTip) + "><div class='sl'>Expenses / Month</div><div class='sv " + ((household.monthlyExpensesGU || 0) > (household.monthlyIncomeGU || 0) ? "r" : "a") + "'>" + App.utils.fmtCountry(household.monthlyExpensesGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Stress", stressTip) + "><div class='sl'>Stress</div><div class='sv " + stressClass + "'>" + Math.round(household.financialStress || 0) + "/100</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Cash", cashTip) + "><div class='sl'>Cash</div><div class='sv c'>" + App.utils.fmtCountry(household.cashOnHandGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Debt", debtTip) + "><div class='sl'>Debt</div><div class='sv " + ((household.debtGU || 0) > 0 ? "r" : "g") + "'>" + App.utils.fmtCountry(household.debtGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Inheritance Load", inheritanceLoadTip) + "><div class='sl'>Inheritance Load</div><div class='sv a'>" + App.utils.fmtCountry(household.inheritancePressureGU || 0, person.countryISO) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Asset Cash", assetCashTip) + "><div class='sl'>Asset Cash</div><div class='sv c'>" + App.utils.fmtCountry(household.assetCashGU || household.cashOnHandGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Equity", equityTip) + "><div class='sl'>Equity</div><div class='sv b'>" + App.utils.fmtCountry(household.assetEquityGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Property", propertyTip) + "><div class='sl'>Property</div><div class='sv a'>" + App.utils.fmtCountry(household.assetPropertyGU || 0, person.countryISO) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Business Ownership", ownershipTip) + "><div class='sl'>Business Ownership</div><div class='sv g'>" + App.utils.fmtCountry(household.assetBusinessOwnershipGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Inherited Trusts", trustsTip) + "><div class='sl'>Inherited Trusts</div><div class='sv a'>" + App.utils.fmtCountry(household.assetTrustGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Asset Debt", assetDebtTip) + "><div class='sl'>Asset Debt</div><div class='sv " + ((household.assetDebtObligationsGU || household.debtGU || 0) > 0 ? "r" : "g") + "'>" + App.utils.fmtCountry(household.assetDebtObligationsGU || household.debtGU || 0, person.countryISO) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Total Assets", totalAssetsTip) + "><div class='sl'>Total Assets</div><div class='sv c'>" + App.utils.fmtCountry(assetTotal, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Net Assets", netAssetsTip) + "><div class='sl'>Net Assets</div><div class='sv " + (assetNetWorth >= 0 ? "g" : "r") + "'>" + App.utils.fmtCountry(assetNetWorth, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Annual Carry", annualCarryTip) + "><div class='sl'>Annual Carry</div><div class='sv " + ((household.assetYieldAnnualGU || 0) >= 0 ? "g" : "r") + "'>" + App.utils.fmtCountry(household.assetYieldAnnualGU || 0, person.countryISO) + " (" + assetReturnPct.toFixed(1) + "%)</div></div>",
      "</div>",
      "<div class='country-note'>Housing burden: <strong>" + housingBurden + "%</strong> of monthly costs. Childcare burden: <strong>" + childcareBurden + "%</strong>.</div>",
      (profile ? "<div class='country-note'>Median wage in " + App.store.getCountryName(person.countryISO) + ": <strong>" + App.utils.fmtCountry(profile.medianWageGU || 0, person.countryISO) + "</strong>. Household context currently reads as <strong>" + pressureLabel + "</strong>.</div>" : ""),
      "</div>"
    ].join("");
  }

  function renderPortfolioSummary(person){
    var summary = App.store.getPersonPortfolioSummary ? App.store.getPersonPortfolioSummary(person.id) : { holdings:0, totalShares:0, marketValueGU:0, annualDividendGU:0 };
    var holdings = App.store.getPersonPortfolio ? App.store.getPersonPortfolio(person.id).slice(0, 5) : [];
    var holdingsTip = "Number of public-company positions currently held in this portfolio.";
    var marketValueTip = "Current combined market value of all public holdings in this portfolio.";
    var dividendsTip = "Estimated annual dividend income from current portfolio positions.";

    return [
      "<div class='mc'>",
      "<div class='mcl'>Portfolio</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Holdings", holdingsTip) + "><div class='sl'>Holdings</div><div class='sv b'>" + (summary.holdings || 0) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Market Value", marketValueTip) + "><div class='sl'>Market Value</div><div class='sv c'>" + App.utils.fmtCountry(summary.marketValueGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Annual Dividends", dividendsTip) + "><div class='sl'>Annual Dividends</div><div class='sv " + ((summary.annualDividendGU || 0) > 0 ? "g" : "a") + "'>" + App.utils.fmtCountry(summary.annualDividendGU || 0, person.countryISO) + "</div></div>",
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
    var countryFlag = App.utils.renderCountryFlagIcon(person.countryISO, {
      alt:App.store.getCountryName(person.countryISO),
      className:"flag-icon-lg"
    }) || App.utils.renderFlagIcon(bloc ? bloc.flag : "", {
      alt:bloc ? bloc.name : "",
      className:"flag-icon-lg"
    });
    var ownedBusiness = App.store.getBusiness(person.businessId);
    var business = App.store.getAssociatedBusiness(person);
    var employmentBusiness = App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var profile = App.store.getCountryProfile ? App.store.getCountryProfile(person.countryISO) : null;
    var currency = App.utils.getCurrency(person.countryISO);
    var location = App.utils.locationLabel(person, false);
    var locationLines = App.utils.locationLines(person, false);
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
    var birthplaceLabel = App.utils.birthplaceLabel(person, false);
    var birthplaceLines = App.utils.birthplaceLines(person, false);
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
      "Education Level: " + educationAttainment,
      "Program: " + educationCourse,
      "Institution: " + institutionName,
      "Institution Type: " + formatInstitutionTypeLabel(institutionType),
      "Institution Sector: " + institutionSector.toUpperCase(),
      "Institution Score: " + (Number.isFinite(institutionQuality) ? institutionQuality + "/100" : "--"),
      "Country Education Context: " + (institutionContext != null ? institutionContext + "/100" : "--"),
      "Stronger institutional prestige improves leadership hiring and promotion prospects."
    ].join(" | ");
    var notes = [
      "AGE " + App.utils.displayAge(person),
      App.utils.getLifeStageLabel(person).toUpperCase()
    ];
    var genderClass = getGenderClass(person);
    var genderSymbol = getGenderSymbol(person);
    var genderLabel = getGenderLabel(person);
    var household = App.store.getPersonHousehold ? App.store.getPersonHousehold(person) : null;
    var householdMembers = household ? ((household.adultIds || []).length + (household.childIds || []).length) : (1 + children.length + (spouse ? 1 : 0));
    var householdClass = household ? String(household.classTier || "working").toUpperCase() : "UNTRACKED";
    var householdStress = household ? Math.round(Number(household.financialStress) || 0) : 0;
    var householdIncomeGU = household ? (Number(household.monthlyIncomeGU) || 0) : 0;
    var householdExpensesGU = household ? (Number(household.monthlyExpensesGU) || 0) : 0;
    var householdCashGU = household ? (Number(household.cashOnHandGU) || 0) : 0;
    var householdDebtGU = household ? (Number(household.debtGU) || 0) : 0;
    var personRoleLine = employmentBusiness && person.jobTitle
      ? ("Current role: <strong>" + person.jobTitle + "</strong> at " + renderBusinessLink(employmentBusiness) + ".")
      : "Current role: <strong>No active role recorded.</strong>";
    var companySummary = business ? [
      "<div class='mc'>",
      "<div class='mcl'>Main Company</div>",
      "<div class='country-note'><strong>" + renderBusinessLink(business, business.name) + "</strong> - " + business.industry + "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox'><div class='sl'>Revenue</div><div class='sv b'>" + App.utils.fmtCountry(business.revenueGU || 0, person.countryISO) + "/yr</div></div>",
      "<div class='sbox'><div class='sl'>Profit</div><div class='sv " + ((business.profitGU || 0) >= 0 ? "g" : "r") + "'>" + App.utils.fmtCountry(business.profitGU || 0, person.countryISO) + "</div></div>",
      "<div class='sbox'><div class='sl'>Employees</div><div class='sv c'>" + (business.employees || 0) + "</div></div>",
      "</div>",
      "</div>"
    ].join("") : "<div class='mc'><div class='mcl'>Main Company</div><div class='country-note'>No active business leadership yet.</div></div>";
    var overviewSections;
    var moreInfoSections;
    var showingMoreInfo = activePersonDetailTab === "more";
    var statusLabel = !person.alive ? "Deceased" : (person.retired ? "Retired" : "Alive");
    var statusClass = !person.alive ? "status-deceased" : (person.retired ? "status-retired" : "status-alive");
    var netWorthTip = "Estimated total value of this person's assets minus liabilities at current market conditions.";
    var cashTip = "Liquid cash currently available for daily spending and short-term decisions.";
    var incomeTip = "Average household income expected each month from salaries, business payouts, and other inflows.";
    var expensesTip = "Average household spending each month for housing, living costs, and obligations.";
    var debtTip = "Outstanding household debt that must be repaid over time.";
    var stressTip = "Financial strain score. Higher values mean tighter budgets and greater instability risk.";
    var trustTip = "How dependable and credible this person is perceived by others.";
    var prestigeTip = "Social status and influence. Higher prestige improves access to top roles and networks.";
    var notorietyTip = "Public controversy exposure. Higher notoriety can raise risk and reputational drag.";
    var livingStatusTip = "Current household class status based on income, wealth, and financial resilience.";
    var locationTip = "Current city and country where this person lives and participates in the local economy.";
    var householdTip = "Total people in the household, including adults and children.";
    var spouseTip = "Current spouse link, if one is recorded in the simulation.";
    var childrenTip = "Number of children currently linked to this person.";
    var lineageTip = "Family line identifier used for dynasty tracking across generations.";
    var skillTrackTip = "Primary development path shaping how this person builds capabilities over time.";
    var humanCapitalTip = "Composite capability score built from management, technical, social, finance, and creativity skills.";
    var employerTip = "Current employing organization where this person works.";
    var salaryTip = "Current annual compensation shown in Global Units for cross-country comparison.";
    var blocGdpTip = "Total output of this person's bloc economy, based on current business activity.";
    var geoRiskTip = "External geopolitical risk affecting this bloc. Higher values increase macro uncertainty.";
    var managementTip = "Ability to lead teams, coordinate operations, and execute plans.";
    var technicalTip = "Problem-solving and technical competence for specialized work.";
    var socialTip = "Relationship-building, communication, and influence capability.";
    var financeTip = "Financial discipline for budgeting, risk control, and capital decisions.";
    var creativityTip = "Capacity for innovation, experimentation, and new idea generation.";

    if (person.retired) notes.push("RETIRED");
    if (person.retired && person.retirementType) notes.push(retirementTypeLabel);
    if (!person.alive) notes.push("DIED " + App.utils.fmtDay(person.deathDay || App.store.simDay));

    overviewSections = [
      "<div class='person-head'>",
      "<div class='person-head-main'><div class='dname'>" + person.name + "</div><div class='dtitle'>" + notes.join(" - ") + "</div></div>",
      "<div class='person-status-pill " + statusClass + "'>" + statusLabel + "</div>",
      "</div>",
      "<div>",
      "<div class='country-note'><strong>" + genderSymbol + " " + genderLabel + "</strong></div>",
      "<div class='country-note'>" + personRoleLine + "</div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Net Worth", netWorthTip) + "><div class='sl'>Net Worth</div><div class='sv " + (person.netWorthGU > 30000 ? "g" : person.netWorthGU > 0 ? "a" : "r") + "'>" + App.utils.fmtCountry(person.netWorthGU, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Cash on Hand", cashTip) + "><div class='sl'>Cash</div><div class='sv c'>" + App.utils.fmtCountry(householdCashGU, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Income per Month", incomeTip) + "><div class='sl'>Income / Month</div><div class='sv g'>" + App.utils.fmtCountry(householdIncomeGU, person.countryISO) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Expenses per Month", expensesTip) + "><div class='sl'>Expenses / Month</div><div class='sv " + (householdExpensesGU > householdIncomeGU ? "r" : "a") + "'>" + App.utils.fmtCountry(householdExpensesGU, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Debt", debtTip) + "><div class='sl'>Debt</div><div class='sv " + (householdDebtGU > 0 ? "r" : "g") + "'>" + App.utils.fmtCountry(householdDebtGU, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Financial Stress", stressTip) + "><div class='sl'>Stress</div><div class='sv " + (householdStress >= 72 ? "r" : (householdStress >= 48 ? "a" : "g")) + "'>" + householdStress + "/100</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Trust", trustTip) + "><div class='sl'>Trust</div><div class='sv " + (personalRep.trust >= 65 ? "g" : (personalRep.trust >= 45 ? "a" : "r")) + "'>" + Math.round(personalRep.trust) + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Prestige", prestigeTip) + "><div class='sl'>Prestige</div><div class='sv " + (personalRep.prestige >= 62 ? "g" : (personalRep.prestige >= 40 ? "a" : "r")) + "'>" + Math.round(personalRep.prestige) + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Notoriety", notorietyTip) + "><div class='sl'>Notoriety</div><div class='sv " + (personalRep.notoriety >= 60 ? "r" : "a") + "'>" + Math.round(personalRep.notoriety) + "/100</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Living Status", livingStatusTip) + "><div class='sl'>Living Status</div><div class='sv c'>" + householdClass + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Location", locationTip) + "><div class='sl'>Location</div><div class='sv place-value'>" + renderPlaceStack(locationLines) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Household", householdTip) + "><div class='sl'>Household</div><div class='sv b'>" + householdMembers + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Spouse", spouseTip) + "><div class='sl'>Spouse</div><div class='sv a'>" + (spouse ? renderPersonLink(spouse, spouse.name) : "None") + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Children", childrenTip) + "><div class='sl'>Children</div><div class='sv c'>" + children.length + "</div></div>",
      "</div>",
      companySummary
    ];

    moreInfoSections = [
      "<div class='person-head'>",
      "<div class='person-head-main'><div class='dname'>" + person.name + "</div><div class='dtitle'>" + notes.join(" - ") + "</div></div>",
      "<div class='person-status-pill " + statusClass + "'>" + statusLabel + "</div>",
      "</div>",
      "<div>",
      "<div class='country-note'><strong>" + genderSymbol + " " + genderLabel + "</strong></div>",
      "<div class='country-note'>" + personRoleLine + "</div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Net Worth", netWorthTip) + "><div class='sl'>Net Worth</div><div class='sv " + (person.netWorthGU > 30000 ? "g" : person.netWorthGU > 0 ? "a" : "r") + "'>" + App.utils.fmtCountry(person.netWorthGU, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Cash on Hand", cashTip) + "><div class='sl'>Cash</div><div class='sv c'>" + App.utils.fmtCountry(householdCashGU, person.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Debt", debtTip) + "><div class='sl'>Debt</div><div class='sv " + (householdDebtGU > 0 ? "r" : "g") + "'>" + App.utils.fmtCountry(householdDebtGU, person.countryISO) + "</div></div>",
      "</div>",
      "<div class='country-note'>Born: <strong>" + App.utils.fmtDay(birthDay) + "</strong></div>",
      "<div class='country-note'><span class='country-note-label'>Birthplace</span>" + renderPlaceStack(birthplaceLines) + "</div>",
      (person.nativeDisplayName ? "<div class='country-note'>Other name: <strong>" + person.nativeDisplayName + "</strong></div>" : ""),
      "<div class='prbadges detail-badges'>" + renderBadgeRow(App.utils.getPersonRoles(person), "rbadge") + "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Net Worth (GU)", "Same total net worth displayed in Global Units for cross-country comparison.") + "><div class='sl'>Net Worth (GU)</div><div class='sv c'>" + App.utils.fmtGU(person.netWorthGU) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Net Worth (USD)", "Same total net worth converted to US Dollars for global reference.") + "><div class='sl'>Net Worth (USD)</div><div class='sv b'>" + App.utils.fmtUSD(person.netWorthGU) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Inherited Wealth", "Total value received through inheritance events over this person's lifetime.") + "><div class='sl'>Inherited Wealth</div><div class='sv a'>" + App.utils.fmtCountry(person.lifetimeInheritedGU || 0, person.countryISO) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Inheritance Count", "Number of inheritance transfers this person has received so far.") + "><div class='sl'>Inheritance Count</div><div class='sv c'>" + Math.max(0, Number(person.inheritanceTransferCount) || 0) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Last Inheritance", "Most recent day this person received an inheritance transfer.") + "><div class='sl'>Last Inheritance</div><div class='sv b'>" + (person.lastInheritanceDay == null ? "N/A" : App.utils.fmtDay(person.lastInheritanceDay)) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Lineage", lineageTip) + "><div class='sl'>Lineage</div><div class='sv a'>" + person.lineageId.split("-")[0].toUpperCase() + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Trust", trustTip) + "><div class='sl'>Trust</div><div class='sv " + (personalRep.trust >= 65 ? "g" : (personalRep.trust >= 45 ? "a" : "r")) + "'>" + Math.round(personalRep.trust) + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Prestige", prestigeTip) + "><div class='sl'>Prestige</div><div class='sv " + (personalRep.prestige >= 62 ? "g" : (personalRep.prestige >= 40 ? "a" : "r")) + "'>" + Math.round(personalRep.prestige) + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Notoriety", notorietyTip) + "><div class='sl'>Notoriety</div><div class='sv " + (personalRep.notoriety >= 60 ? "r" : "a") + "'>" + Math.round(personalRep.notoriety) + "/100</div></div>",
      "</div>",
      (person.groomedForBusinessById ? "<div class='country-note'>Family business grooming: <strong>Active</strong> for succession pathway.</div>" : ""),
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Education Index", "Education score: " + educationScore + "/100 | " + educationTipBody) + "><div class='sl'>Education</div><div class='sv a'>" + educationScore + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Credential", educationTipBody) + "><div class='sl'>Credential</div><div class='sv c'>" + credentialLabel.toUpperCase() + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs(educationTipTitle, educationTipBody) + "><div class='sl'>Institution</div><div class='sv b'>" + institutionName + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Skill Track", skillTrackTip) + "><div class='sl'>Skill Track</div><div class='sv c'>" + String(person.skillTrack || "general").toUpperCase() + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Human Capital", humanCapitalTip) + "><div class='sl'>Human Capital</div><div class='sv b'>" + skillAverage + "/100</div></div>",
      "</div>",
      "<div class='mc'>",
      "<div class='mcl'>Skill Profile</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Management", managementTip) + "><div class='sl'>Management</div><div class='sv c'>" + Math.round(Number(skills.management) || 0) + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Technical", technicalTip) + "><div class='sl'>Technical</div><div class='sv c'>" + Math.round(Number(skills.technical) || 0) + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Social", socialTip) + "><div class='sl'>Social</div><div class='sv c'>" + Math.round(Number(skills.social) || 0) + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Finance", financeTip) + "><div class='sl'>Finance</div><div class='sv c'>" + Math.round(Number(skills.financialDiscipline) || 0) + "/100</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Creativity", creativityTip) + "><div class='sl'>Creativity</div><div class='sv c'>" + Math.round(Number(skills.creativity) || 0) + "/100</div></div>",
      "</div>",
      "</div>",
      "<div class='country-note'>Education currently boosts earning baseline, leadership eligibility, and founder launch potential.</div>",
      (employmentBusiness && person.jobTitle ? "<div class='sg'><div class='sbox sbox-tip'" + buildRichTooltipAttrs("Employer", employerTip) + "><div class='sl'>Employer</div><div class='sv a'>" + renderBusinessLink(employmentBusiness, employmentBusiness.name) + "</div></div><div class='sbox sbox-tip'" + buildRichTooltipAttrs("Salary (GU)", salaryTip) + "><div class='sl'>Salary (GU)</div><div class='sv c'>" + App.utils.fmtGU(person.salaryGU || 0) + "</div></div></div>" : ""),
      renderHouseholdSummary(person),
      renderPortfolioSummary(person),
      "<div class='sg'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Bloc GDP", blocGdpTip) + "><div class='sl'>Bloc GDP</div><div class='sv b'>" + App.utils.fmtL(bloc.gdp, bloc) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Geopolitical Risk", geoRiskTip) + "><div class='sl'>Geopolitical Risk</div><div class='sv " + (bloc.geoPressure > 1 ? "r" : "g") + "'>" + bloc.geoPressure.toFixed(1) + "</div></div>",
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
    ];

    el.innerHTML = [
      "<div class='cban cban-nav' data-country-iso='" + person.countryISO + "' style='background:" + bloc.color + ";border:1px solid " + bloc.label + "40'>",
      "<div class='cflag cflag-nav' data-country-iso='" + person.countryISO + "' title='Open country inspector'>" + countryFlag + "</div>",
      "<div class='cinfo'>",
      "<div class='cname2' style='color:" + bloc.label + "'>" + location + "</div>",
      "<div class='cfx'>" + currency.sym + " " + currency.code + " - " + currency.name +
      " <span class='fbadge fb" + fxDir + "'>" + (fxDir === "u" ? "&#9650; APPR." : "&#9660; DEPR.") + "</span></div>",
      "</div></div>",
      "<div class='person-detail-controls inspector-controls-row'>",
      "<div class='person-detail-tabs' role='tablist' aria-label='Person detail tabs'>",
      "<button class='person-detail-tab " + (showingMoreInfo ? "" : "act") + "' data-person-tab='overview' role='tab' aria-selected='" + (!showingMoreInfo) + "'>Overview</button>",
      "<button class='person-detail-tab " + (showingMoreInfo ? "act" : "") + "' data-person-tab='more' role='tab' aria-selected='" + (showingMoreInfo) + "'>More Info</button>",
      "</div>",
      "<button type='button' class='person-tooltip-toggle " + (inspectorTooltipsEnabled ? "act" : "") + "' data-toggle-rich-tooltips='1' aria-pressed='" + inspectorTooltipsEnabled + "'>Tooltips: " + (inspectorTooltipsEnabled ? "On" : "Off") + "</button>",
      "</div>",
      (showingMoreInfo ? moreInfoSections.join("") : overviewSections.join(""))
    ].join("");

    if (business && business.revenueHistory.length > 1) {
      drawLine(document.getElementById("rch"), business.revenueHistory, "#f5a623");
    }
    if (bloc.rateHistory.length > 1) {
      drawLine(document.getElementById("fch"), bloc.rateHistory.map(function(rate){ return 1 / rate; }), bloc.label);
    }
    if (business) {
      var listing = App.store.getListingForBusiness ? App.store.getListingForBusiness(business.id) : null;
      if (listing) {
        drawStockPriceChart(document.getElementById("sch"), getBusinessStockCandles(business.id, listing), stockChartViewMode);
      }
    }
    bindInspectorRichTooltips(el);
  }

  function renderBusinessDetail(business){
    var el = document.getElementById("dc");
    var bloc = App.store.getBloc(business.blocId);
    var countryFlag = App.utils.renderCountryFlagIcon(business.countryISO, {
      alt:App.store.getCountryName(business.countryISO),
      className:"flag-icon-lg"
    }) || App.utils.renderFlagIcon(bloc ? bloc.flag : "", {
      alt:bloc ? bloc.name : "",
      className:"flag-icon-lg"
    });
    var currency = App.utils.getCurrency(business.countryISO);
    var founder = App.store.getPerson(business.founderId);
    var owner = App.store.getPerson(business.ownerId);
    var listing = App.store.getListingForBusiness ? App.store.getListingForBusiness(business.id) : null;
    var locationLabel = App.utils.businessLocationLabel(business, false);
    var locationLines = App.utils.businessLocationLines(business, false);
    var ceo = App.store.getBusinessLeader(business, "ceo");
    var ceoPerson = ceo && ceo.person ? ceo.person : owner;
    var founderBirthplaceLines = founder ? App.utils.birthplaceLines(founder, false) : ["Unknown"];
    var ownerBirthplace = owner ? App.utils.birthplaceLabel(owner, false) : "Unknown";
    var ceoBirthplace = ceoPerson ? App.utils.birthplaceLabel(ceoPerson, false) : "Unknown";
    var leadership = App.store.getBusinessLeadership(business);
    var otherEmployees = Math.max(0, business.employees - leadership.length);
    var businessTraitEffects = (business.lastTraitEffects && business.lastTraitEffects.length) ? business.lastTraitEffects : ((business.currentDecision && business.currentDecision.traitEffects) ? business.currentDecision.traitEffects : []);
    var dividendYield = listing && listing.sharePriceGU > 0 ? ((listing.annualDividendPerShareGU || 0) / listing.sharePriceGU) * 100 : 0;
    var floatShares = listing ? Math.max(0, (listing.totalShares || 0) - (listing.treasuryShares || 0) - ((listing.sharesByHolder && owner) ? (listing.sharesByHolder[owner.id] || 0) : 0)) : 0;
    var holderCount = listing && listing.sharesByHolder ? Object.keys(listing.sharesByHolder).length : 0;
    var revenueTip = "Total annual sales generated by the business before costs.";
    var profitTip = "Net result after costs. Negative values mean the firm is running at a loss.";
    var valuationTip = "Estimated current market value of the business based on simulation conditions.";
    var employeesTip = "Total people currently employed by the business.";
    var leadershipTip = "Count of currently assigned leadership roles.";
    var reputationTip = "Public and market confidence in this business.";
    var namedLeadersTip = "Number of explicit leadership seats currently filled.";
    var otherStaffTip = "Employees outside the named leadership team.";
    var cashReservesTip = "Liquid funds available for payroll, expansion, and shocks.";
    var listedTip = "Whether the company is publicly listed on the market.";
    var sharePriceTip = "Current price per share in the home currency.";
    var dividendYieldTip = "Annual dividend return relative to current share price.";
    var sharesTip = "Total shares issued by the company.";
    var floatTip = "Shares available to the public after treasury and control blocks.";
    var holdersTip = "Number of distinct shareholders currently on record.";
    var founderTip = "Original creator of the company.";
    var ownerTip = "Current controlling owner of the company.";
    var ceoTip = "Current executive leader responsible for operations and strategy.";
    var founderOriginTip = "Founder birthplace metadata used for social and lineage context.";
    var hqTip = "Primary headquarters location for this company.";
    var successionTip = "Number of leadership succession events recorded for this business.";

    el.innerHTML = [
      "<div class='cban cban-nav' data-country-iso='" + business.countryISO + "' style='background:" + bloc.color + ";border:1px solid " + bloc.label + "40'>",
      "<div class='cflag cflag-nav' data-country-iso='" + business.countryISO + "' title='Open country inspector'>" + countryFlag + "</div>",
      "<div class='cinfo'>",
      "<div class='cname2' style='color:" + bloc.label + "'>" + renderPlaceStack(locationLines) + "</div>",
      "<div class='cfx'>" + currency.sym + " " + currency.code + " - " + currency.name + " - " + business.industry + "</div>",
      "</div></div>",
      "<div class='inspector-top-controls inspector-controls-row'>",
      "<button type='button' class='person-tooltip-toggle " + (inspectorTooltipsEnabled ? "act" : "") + "' data-toggle-rich-tooltips='1' aria-pressed='" + inspectorTooltipsEnabled + "'>Tooltips: " + (inspectorTooltipsEnabled ? "On" : "Off") + "</button>",
      "</div>",
      renderBusinessLockup(
        business,
        "<div class='dname'>" + business.name + "</div>",
        "<div class='dtitle'>" + business.stage.toUpperCase() + " - AGE " + (Number.isFinite(Number(business.age)) ? Number(business.age).toFixed(1) : "0.0") + " YRS</div>",
        58,
        "detail",
        "brand-lockup-hero"
      ),
      "<div class='country-note sbox-tip'" + buildRichTooltipAttrs("Founded", "Day this business was created in the simulation timeline.") + ">Founded: <strong>" + App.utils.fmtDay(business.foundedDay != null ? business.foundedDay : App.store.simDay) + "</strong></div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Revenue", revenueTip) + "><div class='sl'>Revenue</div><div class='sv b'>" + App.utils.fmtCountry(business.revenueGU, business.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Profit", profitTip) + "><div class='sl'>Profit</div><div class='sv " + (business.profitGU >= 0 ? "g" : "r") + "'>" + App.utils.fmtCountry(business.profitGU, business.countryISO) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Valuation", valuationTip) + "><div class='sl'>Valuation</div><div class='sv a'>" + App.utils.fmtCountry(business.valuationGU, business.countryISO) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Employees", employeesTip) + "><div class='sl'>Employees</div><div class='sv c'>" + business.employees + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Leadership", leadershipTip) + "><div class='sl'>Leadership</div><div class='sv b'>" + leadership.length + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Reputation", reputationTip) + "><div class='sl'>Reputation</div><div class='sv " + ((business.reputation || 0) >= 70 ? "g" : ((business.reputation || 0) >= 45 ? "a" : "r")) + "'>" + Math.round(business.reputation || 0) + "/100</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Named Leaders", namedLeadersTip) + "><div class='sl'>Named Leaders</div><div class='sv b'>" + leadership.length + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Other Staff", otherStaffTip) + "><div class='sl'>Other Staff</div><div class='sv a'>" + otherEmployees + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Cash Reserves", cashReservesTip) + "><div class='sl'>Cash Reserves</div><div class='sv c'>" + App.utils.fmtCountry(business.cashReservesGU || 0, business.countryISO) + "</div></div>",
      "</div>",
      (listing ? [
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Listed", listedTip) + "><div class='sl'>Listed</div><div class='sv g'>YES (" + listing.symbol + ")</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Share Price", sharePriceTip) + "><div class='sl'>Share Price</div><div class='sv b'>" + App.utils.fmtCountry(listing.sharePriceGU || 0, business.countryISO) + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Dividend Yield", dividendYieldTip) + "><div class='sl'>Dividend Yield</div><div class='sv c'>" + dividendYield.toFixed(1) + "%</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Shares", sharesTip) + "><div class='sl'>Shares</div><div class='sv a'>" + (listing.totalShares || 0).toLocaleString() + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Public Float", floatTip) + "><div class='sl'>Public Float</div><div class='sv c'>" + floatShares.toLocaleString() + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Holders", holdersTip) + "><div class='sl'>Holders</div><div class='sv b'>" + holderCount + "</div></div>",
        "</div>",
        "<div class='mc'>",
        "<div class='mcl mcl-row'><span>Share Price History</span><div class='chart-mode-toggle' role='group' aria-label='Stock chart mode'>" +
          "<button type='button' class='chart-mode-btn " + (stockChartViewMode === "line" ? "act" : "") + "' data-stock-chart-mode='line'>Line</button>" +
          "<button type='button' class='chart-mode-btn " + (stockChartViewMode === "candles" ? "act" : "") + "' data-stock-chart-mode='candles'>Candles</button>" +
        "</div></div>",
        "<canvas id='sch' class='stock-chart-canvas' height='64'></canvas>",
        "</div>"
      ].join("") : "<div class='country-note'>Public listing is not active yet. The firm can list once scale and stability improve.</div>"),
      "<div class='mc'>",
      "<div class='mcl'>Ownership & Leadership</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Founder", founderTip) + "><div class='sl'>Founder</div><div class='sv a'>" + renderPersonLink(founder) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Owner", ownerTip) + "><div class='sl'>Owner</div><div class='sv a'>" + renderPersonLink(owner) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("CEO", ceoTip) + "><div class='sl'>CEO</div><div class='sv a'>" + renderPersonLink(ceo && ceo.person ? ceo.person : owner) + "</div></div>",
      "</div>",
      "<div class='sg sg3'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Founder Origin", founderOriginTip) + "><div class='sl'>Founder Origin</div><div class='sv place-value'>" + renderPlaceStack(founderBirthplaceLines) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("HQ", hqTip) + "><div class='sl'>HQ</div><div class='sv place-value'>" + renderPlaceStack(locationLines) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Succession Count", successionTip) + "><div class='sl'>Succession Count</div><div class='sv a'>" + business.successionCount + "</div></div>",
      "</div>",
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
    if (listing) {
      drawStockPriceChart(document.getElementById("sch"), getBusinessStockCandles(business.id, listing), stockChartViewMode);
    }

    bindInspectorRichTooltips(el);
  }

  function renderCountryDetail(iso){
    var el = document.getElementById("dc");
    var bloc = App.store.getBlocByCountry(iso);
    var countryFlag = App.utils.renderCountryFlagIcon(iso, {
      alt:App.store.getCountryName(iso),
      className:"flag-icon-lg"
    }) || App.utils.renderFlagIcon(bloc ? bloc.flag : "", {
      alt:bloc ? bloc.name : "",
      className:"flag-icon-lg"
    });
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
    var cityDirectory = "";
    var employmentRate = profile && profile.laborForce > 0 ? (profile.employed / profile.laborForce) : null;
    var pressureLabel = "stable trend";
    var businessesTip = "Number of active businesses currently headquartered in this country.";
    var dynastiesTip = "Active family lines with more than one living member.";
    var populationTip = "Estimated real-world population reference used by the simulation. Sim Citizens: " + people.length + ". Sim Minors: " + minors + ".";
    var employmentTip = "Share of the labor force currently employed.";
    var unemployedTip = "People in the labor force who are currently unemployed.";
    var medianWageTip = "Median annual wage benchmark used for household and labor balancing.";
    var demandTip = "Estimated total consumer demand generated in this country.";
    var trendTip = "Current direction of population pressure dynamics in this country.";
    var layerTip = "Population profile availability for this country in the simulation layer.";
    var blocGdpTip = "Current GDP total for the bloc this country belongs to.";
    var geoRiskTip = "Geopolitical risk level affecting trade and macro stability.";
    var countryEducationScore = profile ? Math.round((Number(profile.educationIndex) || 0) * 100) : 0;
    var countryInstitutionScore = profile ? Math.round((Number(profile.institutionScore) || 0) * 100) : null;
    var countryCredentialLabel = getCountryEducationCredentialLabel(iso, countryEducationScore);
    var policyEvidence = profile && profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
    var blocPolicyEvidence = bloc && bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : {};
    var electionTriggered = !!policyEvidence.electionTriggered;
    var electionDirection = Number(policyEvidence.electionDirection) || 0;
    var electionDirectionLabel = electionDirection > 0 ? "TIGHTENING MANDATE" : (electionDirection < 0 ? "SUPPORTIVE MANDATE" : "NEUTRAL");
    var electionCycleYears = Math.max(0, Number(policyEvidence.electionCycleYears) || 0);
    var sanctionTradeBlock = App.utils.clamp(Number(policyEvidence.sanctionTradeBlockIndex) || 0, 0, 1);
    var sanctionFinanceBlock = App.utils.clamp(Number(policyEvidence.sanctionFinanceBlockIndex) || 0, 0, 1);
    var sanctionDealBlock = App.utils.clamp(Number(policyEvidence.sanctionDealBlockIndex) || 0, 0, 1);
    var sanctionIncomingTradeBlock = App.utils.clamp(Number(blocPolicyEvidence.sanctionIncomingTradeBlockIndex) || 0, 0, 1);
    var sanctionIncomingFinanceBlock = App.utils.clamp(Number(blocPolicyEvidence.sanctionIncomingFinanceBlockIndex) || 0, 0, 1);
    var sanctionIncomingDealBlock = App.utils.clamp(Number(blocPolicyEvidence.sanctionIncomingDealBlockIndex) || 0, 0, 1);
    var sanctionRerouteProgress = App.utils.clamp(Number(policyEvidence.sanctionRerouteProgressIndex) || Number(blocPolicyEvidence.sanctionRerouteProgressIndex) || 0, 0, 1);
    var sanctionTargets = Array.isArray(blocPolicyEvidence.sanctionTargets) ? blocPolicyEvidence.sanctionTargets : [];
    var sanctionTargetLabels = sanctionTargets.map(function(targetId){
      var targetBloc = App.store.getBloc(targetId);
      return targetBloc ? targetBloc.name : String(targetId || "");
    }).filter(Boolean);
    var tier6Panel = "";
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
        pressureLabel = "Rising";
      } else if (profile.populationPressure <= 0.42) {
        pressureLabel = "Easing";
      } else {
        pressureLabel = "Stable";
      }

      populationPanel = [
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Population", populationTip) + "><div class='sl'>Population</div><div class='sv c'>" + fmtCount(profile.population) + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Employment Rate", employmentTip) + "><div class='sl'>Employment Rate</div><div class='sv " + ((employmentRate != null && employmentRate >= 0.55) ? "g" : "a") + "'>" + (employmentRate != null ? Math.round(employmentRate * 100) + "%" : "--") + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Unemployed", unemployedTip) + "><div class='sl'>Unemployed</div><div class='sv r'>" + fmtCount(profile.unemployed) + "</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Median Wage", medianWageTip) + "><div class='sl'>Median Wage</div><div class='sv b'>" + App.utils.fmtCountry(profile.medianWageGU, iso) + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Consumer Demand", demandTip) + "><div class='sl'>Consumer Demand</div><div class='sv g'>" + App.utils.fmtCountry(profile.consumerDemandGU, iso) + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Population Trend", trendTip) + "><div class='sl'>Population Trend</div><div class='sv " + (pressureLabel === "Rising" ? "g" : (pressureLabel === "Easing" ? "r" : "a")) + "'>" + pressureLabel + "</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Country Education Index", countryEducationTipBody) + "><div class='sl'>Education Index</div><div class='sv a'>" + countryEducationScore + "/100</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Country Credential Band", countryEducationTipBody) + "><div class='sl'>Credential Band</div><div class='sv c'>" + countryCredentialLabel.toUpperCase() + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Country Institution Score", countryEducationTipBody) + "><div class='sl'>Institution Score</div><div class='sv b'>" + (countryInstitutionScore != null ? countryInstitutionScore + "/100" : "--") + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Population Layer", layerTip) + "><div class='sl'>Population Layer</div><div class='sv c'>Active</div></div>",
        "</div>"
      ].join("");

      tier6Panel = [
        "<div class='mc'>",
        "<div class='mcl'>Tier 6 Slice 1 Signals</div>",
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Election Trigger", "Whether elections fired this cycle for this country profile.") + "><div class='sl'>Election Trigger</div><div class='sv " + (electionTriggered ? "g" : "a") + "'>" + (electionTriggered ? "YES" : "NO") + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Election Direction", "Current election mandate direction from Tier 6 slice logic.") + "><div class='sl'>Direction</div><div class='sv " + (electionDirection > 0 ? "r" : (electionDirection < 0 ? "g" : "a")) + "'>" + electionDirectionLabel + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Election Cycle", "Deterministic election cycle length in years for this country.") + "><div class='sl'>Cycle</div><div class='sv b'>" + (electionCycleYears > 0 ? electionCycleYears + " years" : "--") + "</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Tax Channel", "Election tax policy channel index affecting demand and policy stance pressure.") + "><div class='sl'>Tax Channel</div><div class='sv c'>" + (Number(policyEvidence.electionTaxPolicyIndex || 0)).toFixed(2) + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Trade Channel", "Election trade policy channel index affecting cross-border demand and stance pressure.") + "><div class='sl'>Trade Channel</div><div class='sv c'>" + (Number(policyEvidence.electionTradePolicyIndex || 0)).toFixed(2) + "</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Immigration Channel", "Election immigration policy channel bias applied to migration pressure.") + "><div class='sl'>Immigration</div><div class='sv c'>" + (Number(policyEvidence.electionImmigrationPolicyIndex || 0)).toFixed(2) + "</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Sanction Trade Block", "Country-level sanction trade blockage intensity.") + "><div class='sl'>Trade Block</div><div class='sv " + (sanctionTradeBlock >= 0.35 ? "r" : (sanctionTradeBlock >= 0.15 ? "a" : "g")) + "'>" + Math.round(sanctionTradeBlock * 100) + "%</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Sanction Finance Block", "Country-level sanction finance blockage intensity.") + "><div class='sl'>Finance Block</div><div class='sv " + (sanctionFinanceBlock >= 0.35 ? "r" : (sanctionFinanceBlock >= 0.15 ? "a" : "g")) + "'>" + Math.round(sanctionFinanceBlock * 100) + "%</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Sanction Deal Block", "Country-level sanction deal-flow blockage intensity.") + "><div class='sl'>Deal Block</div><div class='sv " + (sanctionDealBlock >= 0.35 ? "r" : (sanctionDealBlock >= 0.15 ? "a" : "g")) + "'>" + Math.round(sanctionDealBlock * 100) + "%</div></div>",
        "</div>",
        "<div class='sg sg3'>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Incoming Trade Block", "Bloc-level incoming sanction trade pressure affecting members.") + "><div class='sl'>Incoming Trade</div><div class='sv " + (sanctionIncomingTradeBlock >= 0.35 ? "r" : (sanctionIncomingTradeBlock >= 0.15 ? "a" : "g")) + "'>" + Math.round(sanctionIncomingTradeBlock * 100) + "%</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Incoming Finance Block", "Bloc-level incoming sanction finance pressure affecting members.") + "><div class='sl'>Incoming Finance</div><div class='sv " + (sanctionIncomingFinanceBlock >= 0.35 ? "r" : (sanctionIncomingFinanceBlock >= 0.15 ? "a" : "g")) + "'>" + Math.round(sanctionIncomingFinanceBlock * 100) + "%</div></div>",
        "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Incoming Deal Block", "Bloc-level incoming sanction deal pressure affecting members.") + "><div class='sl'>Incoming Deals</div><div class='sv " + (sanctionIncomingDealBlock >= 0.35 ? "r" : (sanctionIncomingDealBlock >= 0.15 ? "a" : "g")) + "'>" + Math.round(sanctionIncomingDealBlock * 100) + "%</div></div>",
        "</div>",
        "<div class='country-note'>Sanction reroute progress: <strong>" + Math.round(sanctionRerouteProgress * 100) + "%</strong>." +
          (sanctionTargetLabels.length ? (" Active outgoing targets: <strong>" + sanctionTargetLabels.join(", ") + "</strong>.") : " No active outgoing sanction targets this cycle.") +
        "</div>",
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

    if (App.data && typeof App.data.getWorldCityDetailsByCountry === "function") {
      var cityDetails = App.data.getWorldCityDetailsByCountry(iso);
      var subdivisionGroups = App.data.getWorldCitySubdivisionsByCountry ? App.data.getWorldCitySubdivisionsByCountry(iso, 8) : [];

      if (cityDetails.length) {
        if (iso === "US") {
          var groupedByState = {};

          cityDetails.forEach(function(city){
            var stateName = city.state || "Unknown State";
            if (!Array.isArray(groupedByState[stateName])) groupedByState[stateName] = [];
            groupedByState[stateName].push(city.name);
          });

          cityDirectory = [
            "<div class='mc'>",
            "<div class='mcl'>City Coverage (" + cityDetails.length + " loaded)</div>",
            "<div class='country-note'>Cities grouped by state from worldcities.csv.</div>",
            "<div class='city-directory-list'>",
            Object.keys(groupedByState).sort(function(first, second){
              return first.localeCompare(second);
            }).map(function(stateName){
              var names = groupedByState[stateName];
              return [
                "<div class='city-directory-row'>",
                "<div class='city-directory-head'><span class='state-name'>" + stateName + "</span><span class='city-count'>" + names.length.toLocaleString("en-US") + " cities</span></div>",
                "<div class='city-directory-samples'>" + names.slice(0, 8).join(", ") + (names.length > 8 ? " ..." : "") + "</div>",
                "</div>"
              ].join("");
            }).join(""),
            "</div>",
            "</div>"
          ].join("");
        } else if (subdivisionGroups.length >= 2) {
          cityDirectory = [
            "<div class='mc'>",
            "<div class='mcl'>City Coverage (" + cityDetails.length + " loaded)</div>",
            "<div class='country-note'>Cities grouped by subdivision from worldcities.csv.</div>",
            "<div class='city-directory-list'>",
            subdivisionGroups.map(function(group){
              var names = group.sampleCities || [];
              return [
                "<div class='city-directory-row'>",
                "<div class='city-directory-head'><span class='state-name'>" + group.name + "</span><span class='city-count'>" + Number(group.count || 0).toLocaleString("en-US") + " cities</span></div>",
                "<div class='city-directory-samples'>" + names.join(", ") + (group.count > names.length ? " ..." : "") + "</div>",
                "</div>"
              ].join("");
            }).join(""),
            "</div>",
            "</div>"
          ].join("");
        } else {
          cityDirectory = [
            "<div class='mc'>",
            "<div class='mcl'>City Coverage (" + cityDetails.length + " loaded)</div>",
            "<div class='country-note'>" + cityDetails.map(function(city){ return city.name; }).join(", ") + "</div>",
            "</div>"
          ].join("");
        }
      } else if (App.data && typeof App.data.getWorldCitiesByCountry === "function") {
        var fallbackCities = App.data.getWorldCitiesByCountry(iso) || [];
        if (fallbackCities.length) {
          cityDirectory = [
            "<div class='mc'>",
            "<div class='mcl'>City Coverage (" + fallbackCities.length + " loaded)</div>",
            "<div class='country-note'>" + fallbackCities.join(", ") + "</div>",
            "</div>"
          ].join("");
        }
      }
    }

    el.innerHTML = [
      "<div class='cban' style='background:" + bloc.color + ";border:1px solid " + bloc.label + "40'>",
      "<div class='cflag'>" + countryFlag + "</div>",
      "<div class='cinfo'>",
      "<div class='cname2' style='color:" + bloc.label + "'>" + App.store.getCountryName(iso) + "</div>",
      "<div class='cfx'>" + iso + " - " + currency.sym + " " + currency.code + " - " + currency.name + "</div>",
      "</div></div>",
      "<div class='inspector-top-controls inspector-controls-row'>",
      "<button type='button' class='person-tooltip-toggle " + (inspectorTooltipsEnabled ? "act" : "") + "' data-toggle-rich-tooltips='1' aria-pressed='" + inspectorTooltipsEnabled + "'>Tooltips: " + (inspectorTooltipsEnabled ? "On" : "Off") + "</button>",
      "</div>",
      "<div class='sg'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Businesses", businessesTip) + "><div class='sl'>Businesses</div><div class='sv b'>" + businesses.length + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Dynasties", dynastiesTip) + "><div class='sl'>Dynasties</div><div class='sv g'>" + activeDynasties + "</div></div>",
      "</div>",
      populationPanel,
      tier6Panel,
      "<div class='sg'>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Bloc GDP", blocGdpTip) + "><div class='sl'>Bloc GDP</div><div class='sv g'>" + App.utils.fmtL(bloc.gdp, bloc) + "</div></div>",
      "<div class='sbox sbox-tip'" + buildRichTooltipAttrs("Geopolitical Risk", geoRiskTip) + "><div class='sl'>Geopolitical Risk</div><div class='sv " + (bloc.geoPressure > 1 ? "r" : "a") + "'>" + bloc.geoPressure.toFixed(1) + "</div></div>",
      "</div>",
      "<div class='bc'>",
      "<div class='bcn'>National Snapshot</div>",
      "<div class='country-note'>" + (richest ? ("Top public executive: <strong>" + richest.name + "</strong> (" + App.utils.fmtCountry(richest.netWorthGU, iso) + ")") : "No public executives tracked in this country yet.") + "</div>",
      "<div class='country-note'>" + (topBusiness ? ("Leading business: " + renderBusinessLink(topBusiness, "<strong>" + topBusiness.name + "</strong>") + " (" + App.utils.fmtCountry(topBusiness.valuationGU, iso) + ")") : "No active businesses are currently headquartered in this country.") + "</div>",
      "<div class='country-note'>Historical residents recorded: <strong>" + allPeople.length + "</strong></div>",
      "</div>",
      cityDirectory,
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

    if (activeInspectorTab === "closure") {
      renderClosureGates();
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

  function renderInspectorSafe(){
    try {
      renderInspector();
    } catch (error) {
      var panel = document.getElementById("dc");
      if (panel) {
        panel.innerHTML = [
          "<div class='mc'>",
          "<div class='mcl'>Inspector Render Error</div>",
          "<div class='country-note'>" + escapeAttrText(error && error.message ? error.message : "Unknown UI error.") + "</div>",
          "</div>"
        ].join("");
      }
    }
  }

  function updateTopBar(){
    var totalGdp = App.store.blocs.reduce(function(sum, bloc){ return sum + bloc.gdp; }, 0);
    var pauseEvent;
    var pauseIndicator = document.getElementById("pause-indicator");
    var pauseTier = "";
    var gdpNode = document.getElementById("gv");
    var firmsNode = document.getElementById("fv");
    var peopleNode = document.getElementById("pv");
    var dayNode = document.getElementById("ct");
    var yearNode = document.getElementById("cy");
    var gdpText = App.utils.fmtGU(totalGdp);
    var firmsText = String(App.store.businesses.length);
    var peopleText = String(App.store.getLivingCount());
    var dayText = App.utils.fmtDay(App.store.simDay);
    var yearText = App.utils.fmtYear(App.store.simDay);

    if (gdpNode && gdpNode.textContent !== gdpText) gdpNode.textContent = gdpText;
    if (firmsNode && firmsNode.textContent !== firmsText) firmsNode.textContent = firmsText;
    if (peopleNode && peopleNode.textContent !== peopleText) peopleNode.textContent = peopleText;
    if (dayNode && dayNode.textContent !== dayText) dayNode.textContent = dayText;
    pauseEvent = App.store.pauseReasonEventId && App.store.getEventById ? App.store.getEventById(App.store.pauseReasonEventId) : null;
    if (pauseEvent) {
      pauseTier = pauseEvent.significance && pauseEvent.significance.tier ? pauseEvent.significance.tier.toUpperCase() : "CRITICAL";
      if (pauseIndicator) {
        var pauseText = "PAUSED - " + pauseTier;
        var pauseTitle = "Simulation paused by " + pauseTier + " event";
        if (pauseIndicator.textContent !== pauseText) pauseIndicator.textContent = pauseText;
        if (pauseIndicator.title !== pauseTitle) pauseIndicator.title = pauseTitle;
        pauseIndicator.classList.add("show");
      }
    } else if (pauseIndicator) {
      if (pauseIndicator.textContent) pauseIndicator.textContent = "";
      if (pauseIndicator.title) pauseIndicator.title = "";
      pauseIndicator.classList.remove("show");
    }
    if (yearNode && yearNode.textContent !== yearText) yearNode.textContent = yearText;
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

    if (!container) return;

    Array.prototype.forEach.call(container.querySelectorAll(".fx[data-bloc-id]"), function(row){
      existingRows[row.getAttribute("data-bloc-id")] = row;
    });

    App.store.blocs.forEach(function(bloc, blocIndex){
      var change = bloc.prevRate ? ((bloc.rate - bloc.prevRate) / bloc.prevRate) * 100 : 0;
      var className = change >= 0 ? "fxdn" : "fxup";
      var arrow = change >= 0 ? "▼" : "▲";
      var displayRate = bloc.rate > 100 ? bloc.rate.toFixed(1) : bloc.rate.toFixed(4);
      var row = existingRows[bloc.id];
      var labelEl;
      var rateEl;
      var changeEl;
      var labelMarkup = App.utils.renderFlagIcon(bloc.flag, {
        alt:bloc.name,
        className:"flag-icon-sm"
      }) + " " + bloc.currency + "/GU";
      var changeText = arrow + Math.abs(change).toFixed(2) + "%";
      var expectedRowAtIndex;

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

      if (labelEl && labelEl.innerHTML !== labelMarkup) labelEl.innerHTML = labelMarkup;
      if (rateEl && rateEl.textContent !== displayRate) rateEl.textContent = displayRate;
      if (changeEl) {
        if (changeEl.className !== className) changeEl.className = className;
        if (changeEl.textContent !== changeText) changeEl.textContent = changeText;
      }

      expectedRowAtIndex = container.children[blocIndex] || null;
      if (!row.parentNode) {
        container.appendChild(row);
      } else if (expectedRowAtIndex !== row) {
        container.insertBefore(row, expectedRowAtIndex);
      }

      delete existingRows[bloc.id];
    });

    Object.keys(existingRows).forEach(function(blocId){
      var stale = existingRows[blocId];
      if (stale && stale.parentNode) {
        stale.parentNode.removeChild(stale);
      }
    });
  }

  function formatTickerIndexValue(value){
    var numeric = Math.max(0, Number(value) || 0);
    var text = numeric >= 1000 ? numeric.toFixed(0) : numeric.toFixed(1);

    return text.replace(/\.0$/, "");
  }

  function buildSyntheticTickerSeries(id, anchor, previousData, baseValue){
    var previous = previousData && previousData[id] ? previousData[id] : null;
    var currentAnchor = Math.max(0, Number(anchor) || 0);
    var previousAnchor = previous ? Math.max(0, Number(previous.anchor) || 0) : 0;
    var priorValue = previous ? Math.max(1, Number(previous.val) || Number(baseValue) || 100) : Math.max(1, Number(baseValue) || 100);
    var changePct = previousAnchor > 0 ? ((currentAnchor - previousAnchor) / previousAnchor) * 100 : 0;
    var currentValue = previous ? Math.max(25, priorValue * (1 + (changePct / 100))) : priorValue;

    return {
      val:currentValue,
      chg:changePct,
      anchor:currentAnchor
    };
  }

  function getTickerListedItems(previousData){
    var listings = App.store.getAllListings ? App.store.getAllListings() : [];

    return listings.map(function(listing){
      var business = App.store.getBusiness(listing && listing.businessId);
      var key;
      var previous;

      if (!listing || !business) return null;

      key = "listing:" + business.id;
      previous = previousData[key] ? previousData[key].val : listing.sharePriceGU;

      return {
        id:key,
        name:String(listing.symbol || (App.utils.getBusinessTicker ? App.utils.getBusinessTicker(business.name) : business.name)).slice(0, 5),
        val:Math.max(0.05, Number(listing.sharePriceGU) || 0.05),
        anchor:Math.max(0.05, Number(listing.sharePriceGU) || 0.05),
        local:App.utils.fmtCountry(listing.sharePriceGU || 0, business.countryISO || "US"),
        chg:previous ? (((listing.sharePriceGU || 0) - previous) / previous) * 100 : 0,
        countryISO:business.countryISO || "",
        flagLabel:business.countryISO ? App.store.getCountryName(business.countryISO) : business.name,
        flag:"",
        sortValue:Math.max(0, (Number(listing.sharePriceGU) || 0) * Math.max(1, Number(listing.totalShares) || 1))
      };
    }).filter(Boolean).sort(function(first, second){
      return second.sortValue - first.sortValue;
    });
  }

  function getTickerBlocIndexItems(previousData){
    return App.store.blocs.map(function(bloc){
      var listedMarketCap = (App.store.getAllListings ? App.store.getAllListings() : []).reduce(function(sum, listing){
        var business = App.store.getBusiness(listing && listing.businessId);

        if (!business || business.blocId !== bloc.id) return sum;
        return sum + Math.max(0, (Number(listing.sharePriceGU) || 0) * Math.max(1, Number(listing.totalShares) || 1));
      }, 0);
      var anchor = Math.max(1, Number(bloc.gdp) || 0) + (listedMarketCap * 0.35);
      var series = buildSyntheticTickerSeries("index:bloc:" + bloc.id, anchor, previousData, 100);

      return {
        id:"index:bloc:" + bloc.id,
        name:(String(bloc.id || "IDX") + "X").slice(0, 5),
        val:series.val,
        anchor:series.anchor,
        local:formatTickerIndexValue(series.val),
        chg:series.chg,
        countryISO:"",
        flagLabel:(bloc.name || bloc.id || "Bloc") + " Index",
        flag:bloc.flag,
        sortValue:anchor
      };
    }).sort(function(first, second){
      return second.sortValue - first.sortValue;
    });
  }

  function getTickerCountryIndexItems(previousData){
    return Object.keys(App.store.countryProfiles || {}).map(function(iso){
      var profile = App.store.countryProfiles[iso] || {};
      var anchor = Math.max(1, Number(profile.consumerDemandGU) || 0);
      var series;

      if (!anchor) return null;
      series = buildSyntheticTickerSeries("index:country:" + iso, anchor, previousData, 100);

      return {
        id:"index:country:" + iso,
        name:(String(iso || "XX") + "X").slice(0, 5),
        val:series.val,
        anchor:series.anchor,
        local:formatTickerIndexValue(series.val),
        chg:series.chg,
        countryISO:iso,
        flagLabel:App.store.getCountryName ? ((App.store.getCountryName(iso) || iso) + " Index") : (iso + " Index"),
        flag:"",
        sortValue:anchor
      };
    }).filter(Boolean).sort(function(first, second){
      return second.sortValue - first.sortValue;
    });
  }

  function updateTicker(){
    var currentDay = Number(App.store.simDay) || 0;
    var container;
    var items;
    var doubledItems;
    var identitySignature;
    var index;
    var previousData = App.store.tickerData;
    var itemsById = {};
    var listedItems;
    var blocItems;
    var countryItems;
    var selectedItems;
    var preserveExistingOrder;

    previousData = previousData && typeof previousData === "object" ? previousData : {};
    App.store.tickerData = {};

    listedItems = getTickerListedItems(previousData);
    blocItems = getTickerBlocIndexItems(previousData);
    countryItems = getTickerCountryIndexItems(previousData);

    selectedItems = listedItems.slice(0, 18);
    if (selectedItems.length < 18) {
      selectedItems = selectedItems.concat(blocItems.slice(0, 18 - selectedItems.length));
    }
    if (selectedItems.length < 18) {
      selectedItems = selectedItems.concat(countryItems.slice(0, 18 - selectedItems.length));
    }

    selectedItems.slice(0, 18).forEach(function(item){
      itemsById[item.id] = item;
    });

    preserveExistingOrder = tickerDisplayOrder.length && lastTickerCompositionDay != null && Math.abs(currentDay - lastTickerCompositionDay) < 30;

    if (!preserveExistingOrder) {
      tickerDisplayOrder = selectedItems.slice(0, 18).map(function(item){ return item.id; });
      lastTickerCompositionDay = currentDay;
    } else {
      tickerDisplayOrder = tickerDisplayOrder.filter(function(id){
        return !!itemsById[id];
      });
      selectedItems.forEach(function(item){
        if (tickerDisplayOrder.length >= 18) return;
        if (tickerDisplayOrder.indexOf(item.id) === -1) {
          tickerDisplayOrder.push(item.id);
        }
      });
    }

    items = tickerDisplayOrder.map(function(id){
      return itemsById[id];
    }).filter(Boolean).slice(0, 18);

    if (items.length < 18) {
      items = selectedItems.slice(0, 18);
      tickerDisplayOrder = items.map(function(item){ return item.id; });
      lastTickerCompositionDay = currentDay;
    }

    items.forEach(function(item){
      App.store.tickerData[item.id] = item;
    });
    container = document.getElementById("ticker-inner");

    if (!items.length) {
      container.innerHTML = "";
      container.style.animationDuration = "";
      tickerRenderSlots = [];
      tickerIdentitySignature = "";
      tickerDisplayOrder = [];
      lastTickerCompositionDay = null;
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
      scheduleTickerAnimationSync();
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
        return "<div class='" + itemClass + "'><div class='nmeta'><span class='nt'>" + time + "</span><div class='ntags'><span class='ntag tag-" + itemType + "'>" + itemType.toUpperCase() + "</span>" + tierHtml + modeHtml + tagHtml + "</div></div><div class='ntxt'>" + item.text + "</div></div>";
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

  function getBusinessStockCandles(businessId, listing){
    var stockMarket = App.store.stockMarket || {};
    var tape = Array.isArray(stockMarket.tradeTape) ? stockMarket.tradeTape : [];
    var groupedByDay = {};
    var WINDOW_DAYS = 40;
    var latestDay = Math.max(0, Number(App.store.simDay) || 0);
    var startDay = Math.max(0, latestDay - (WINDOW_DAYS - 1));
    var fallbackPrice = Math.max(0.05, Number(listing && listing.sharePriceGU) || 0.05);
    var prevClose = null;
    var candles = [];

    tape.forEach(function(entry){
      var item = entry && typeof entry === "object" ? entry : null;
      var day;
      var close;
      var movePct;
      var open;
      var high;
      var low;
      var volume;
      var bucket;

      if (!item || item.businessId !== businessId) return;

      day = Math.max(0, Number(item.day) || 0);
      if (day < startDay || day > latestDay) return;

      close = Math.max(0.05, Number(item.closePriceGU != null ? item.closePriceGU : item.priceGU) || 0.05);
      movePct = Number(item.movePct) || 0;
      open = Number(item.openPriceGU);
      if (!Number.isFinite(open) || open <= 0) {
        open = close / Math.max(0.05, 1 + movePct / 100);
      }
      open = Math.max(0.05, Number.isFinite(open) ? open : close);
      high = Math.max(open, close, Math.max(0.05, Number(item.highPriceGU) || 0));
      low = Math.min(open, close, Math.max(0.05, Number(item.lowPriceGU) || Math.min(open, close)));
      volume = Math.max(0, Math.floor(Number(item.volumeShares) || 0));
      bucket = groupedByDay[day];

      if (!bucket) {
        groupedByDay[day] = {
          day:day,
          open:open,
          high:high,
          low:low,
          close:close,
          volume:volume
        };
        return;
      }

      bucket.high = Math.max(bucket.high, high);
      bucket.low = Math.min(bucket.low, low);
      bucket.close = close;
      bucket.volume += volume;
    });

    for (var dayCursor = startDay; dayCursor <= latestDay; dayCursor += 1) {
      var bucket = groupedByDay[dayCursor];
      var basePrice;

      if (bucket) {
        candles.push(bucket);
        prevClose = Math.max(0.05, Number(bucket.close) || fallbackPrice);
        continue;
      }

      basePrice = prevClose != null ? prevClose : fallbackPrice;
      candles.push({
        day:dayCursor,
        open:basePrice,
        high:basePrice,
        low:basePrice,
        close:basePrice,
        volume:0
      });
      prevClose = basePrice;
    }

    return candles;
  }

  function drawStockPriceChart(canvas, candles, mode){
    var width;
    var height;
    var context;
    var padding;
    var chartWidth;
    var chartHeight;
    var lows;
    var highs;
    var min;
    var max;
    var valueRange;
    var slotWidth;
    var yFor;

    if (!canvas || !Array.isArray(candles) || !candles.length) return;

    width = canvas.offsetWidth || 240;
    height = canvas.offsetHeight || 64;
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);

    padding = { t:6, b:8, l:4, r:4 };
    chartWidth = width - padding.l - padding.r;
    chartHeight = height - padding.t - padding.b;
    lows = candles.map(function(candle){ return Math.max(0.05, Number(candle.low) || 0.05); });
    highs = candles.map(function(candle){ return Math.max(0.05, Number(candle.high) || 0.05); });
    min = Math.min.apply(null, lows);
    max = Math.max.apply(null, highs);
    valueRange = max - min;

    if (valueRange < 0.0001) {
      min *= 0.98;
      max *= 1.02;
      valueRange = max - min;
    }

    slotWidth = chartWidth / Math.max(1, candles.length);
    yFor = function(value){
      return padding.t + chartHeight - ((value - min) / (valueRange || 1)) * chartHeight;
    };

    context.strokeStyle = "rgba(120, 160, 192, 0.18)";
    context.lineWidth = 1;
    [0.5].forEach(function(tick){
      var y = padding.t + chartHeight * tick;
      context.beginPath();
      context.moveTo(padding.l, y);
      context.lineTo(padding.l + chartWidth, y);
      context.stroke();
    });

    if (normalizeStockChartViewMode(mode) === "candles") {
      var bodyWidth = Math.max(2, Math.min(10, Math.floor(slotWidth * 0.64)));

      candles.forEach(function(candle, index){
        var x = padding.l + index * slotWidth + slotWidth / 2;
        var openY = yFor(candle.open);
        var closeY = yFor(candle.close);
        var highY = yFor(candle.high);
        var lowY = yFor(candle.low);
        var up = candle.close >= candle.open;
        var color = up ? "#5ad8b1" : "#f18c8c";
        var topY = Math.min(openY, closeY);
        var bodyHeight = Math.max(2, Math.abs(closeY - openY));
        var isFlat = Math.abs((Number(candle.close) || 0) - (Number(candle.open) || 0)) < 0.000001;
        var wickTop = isFlat ? topY - 1 : highY;
        var wickBottom = isFlat ? topY + bodyHeight + 1 : lowY;

        context.strokeStyle = color;
        context.lineWidth = 1.6;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(x, wickTop);
        context.lineTo(x, wickBottom);
        context.stroke();

        context.fillStyle = up ? "rgba(90, 216, 177, 0.55)" : "rgba(241, 140, 140, 0.55)";
        context.strokeStyle = color;
        context.lineWidth = 1.1;
        context.fillRect(x - bodyWidth / 2, topY, bodyWidth, bodyHeight);
        context.strokeRect(x - bodyWidth / 2, topY, bodyWidth, bodyHeight);
      });
      return;
    }

    context.beginPath();
    context.strokeStyle = "#7fc9df";
    context.lineWidth = 2;
    context.shadowColor = "rgba(127, 201, 223, 0.35)";
    context.shadowBlur = 3;

    candles.forEach(function(candle, index){
      var x = padding.l + index * slotWidth + slotWidth / 2;
      var y = yFor(candle.close);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();
    context.shadowBlur = 0;
  }

  function renderTabs(){
    document.getElementById("ctabs").innerHTML = [
      "<div class='econ-tabs' style='grid-template-columns:repeat(" + App.store.blocs.length + ", minmax(0, 1fr));'>",
      App.store.blocs.map(function(bloc){
        return "<button class='ctab " + (App.store.selectedBlocId === bloc.id ? "act" : "") + "' data-bloc-id='" + bloc.id + "'><span class='ctab-flag'>" + App.utils.renderFlagIcon(bloc.flag, { alt:bloc.name, className:"flag-icon-sm" }) + "</span><span class='ctab-code'>" + bloc.currency + "</span></button>";
      }).join(""),
      "</div>",
      "<div class='chart-mode-toggle econ-chart-mode-toggle' role='group' aria-label='GDP chart mode'>",
      "<button type='button' class='chart-mode-btn " + (econChartViewMode === "absolute" ? "act" : "") + "' data-econ-chart-mode='absolute'>Abs</button>",
      "<button type='button' class='chart-mode-btn " + (econChartViewMode === "relative" ? "act" : "") + "' data-econ-chart-mode='relative'>Rel</button>",
      "<button type='button' class='chart-mode-btn " + (econChartViewMode === "log" ? "act" : "") + "' data-econ-chart-mode='log'>Log</button>",
      "</div>"
    ].join("");
  }

  function formatEconChartAxisValue(mode, plottedValue, rawValue){
    if (mode === "relative") {
      return (plottedValue >= 0 ? "+" : "") + plottedValue.toFixed(Math.abs(plottedValue) >= 10 ? 0 : 1) + "%";
    }
    if (mode === "log") {
      return App.utils.fmtGU(Math.max(1, rawValue));
    }
    return App.utils.fmtGU(Math.max(0, rawValue));
  }

  function updateEconChartHoverState(event){
    var canvas = document.getElementById("econ-canvas");
    var bloc = App.store.getBloc(App.store.selectedBlocId);
    var data = bloc ? App.store.econHist[bloc.id] : null;
    var rect;
    var width;
    var padding;
    var chartWidth;
    var relativeX;
    var nextIndex;

    if (!canvas || !data || data.length < 2) return;

    rect = canvas.getBoundingClientRect();
    width = canvas.offsetWidth || rect.width || 275;
    padding = { l:42, r:8 };
    chartWidth = Math.max(1, width - padding.l - padding.r);
    relativeX = event.clientX - rect.left;
    nextIndex = Math.round(((relativeX - padding.l) / chartWidth) * (data.length - 1));
    nextIndex = Math.max(0, Math.min(data.length - 1, nextIndex));

    if (econChartHoverIndex !== nextIndex) {
      econChartHoverIndex = nextIndex;
      renderEconChart();
    }
  }

  function renderEconChart(){
    var canvas = document.getElementById("econ-canvas");
    var width = canvas.offsetWidth || 275;
    var height = canvas.offsetHeight || 136;
    var bloc = App.store.getBloc(App.store.selectedBlocId);
    var data = bloc ? App.store.econHist[bloc.id] : null;
    var plotData;
    var baseValue;
    var modeLabel;
    var titleSuffix = "";
    var valueRange;
    var hoverIndex;
    var hoverRawValue;
    var hoverPlotValue;
    var hoverX;
    var hoverY;
    var hoverDay;
    var hoverLines;
    var tooltipWidth;
    var tooltipHeight;
    var tooltipX;
    var tooltipY;
    var titleText;

    canvas.width = width;
    canvas.height = height;

    var context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);
    if (!bloc || !data || data.length < 2) return;

    plotData = data.slice();
    baseValue = Math.max(1, Number(plotData[0]) || 1);
    if (econChartViewMode === "relative") {
      plotData = plotData.map(function(value){
        return ((Math.max(0, Number(value) || 0) / baseValue) - 1) * 100;
      });
      titleSuffix = " - Relative";
    } else if (econChartViewMode === "log") {
      plotData = plotData.map(function(value){
        return Math.log10(Math.max(1, Number(value) || 1));
      });
      titleSuffix = " - Log";
    }

    var padding = { t:24, b:20, l:46, r:10 };
    var chartWidth = width - padding.l - padding.r;
    var chartHeight = height - padding.t - padding.b;
    var rawMin = Math.min.apply(null, plotData);
    var rawMax = Math.max.apply(null, plotData);
    var min;
    var max;
    var scaleX = chartWidth / (data.length - 1);

    if (econChartViewMode === "relative") {
      valueRange = Math.max(1, rawMax - rawMin, Math.abs(rawMax), Math.abs(rawMin));
      min = rawMin - valueRange * 0.12;
      max = rawMax + valueRange * 0.12;
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    } else {
      valueRange = Math.max(1, rawMax - rawMin);
      min = rawMin - valueRange * 0.1;
      max = rawMax + valueRange * 0.1;
    }
    if ((max - min) < 0.0001) {
      min -= 1;
      max += 1;
    }

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

    context.fillStyle = "#6e879b";
    context.font = "8px Share Tech Mono";
    context.textAlign = "right";
    [max, (max + min) / 2, min].forEach(function(labelValue){
      var y = padding.t + chartHeight - ((labelValue - min) * scaleY);
      var displayValue = econChartViewMode === "log" ? Math.pow(10, labelValue) : labelValue;
      context.fillText(formatEconChartAxisValue(econChartViewMode, labelValue, displayValue), padding.l - 6, y + 3);
    });
    context.textAlign = "left";

    if (econChartViewMode === "relative" && min < 0 && max > 0) {
      var zeroY = padding.t + chartHeight - ((0 - min) * scaleY);
      context.strokeStyle = "rgba(245,166,35,0.28)";
      context.beginPath();
      context.moveTo(padding.l, zeroY);
      context.lineTo(padding.l + chartWidth, zeroY);
      context.stroke();
    }

    context.beginPath();
    context.strokeStyle = bloc.label;
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.shadowColor = bloc.label;
    context.shadowBlur = 5;

    plotData.forEach(function(value, index){
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
    titleText = width >= 340 ? (bloc.flag + " " + bloc.name + " GDP") : (bloc.flag + " " + bloc.currency + " GDP");
    context.fillStyle = bloc.label;
    context.font = "8px Share Tech Mono";
    context.fillText(titleText, padding.l + 2, 10);
    modeLabel = econChartViewMode === "relative" ? "vs start" : (econChartViewMode === "log" ? "log10 scale" : "absolute");
    context.textAlign = "right";
    context.fillStyle = "#88a7bf";
    context.fillText(modeLabel, padding.l + chartWidth - 2, 10);
    context.fillStyle = "#6e879b";
    context.fillText("Now", padding.l + chartWidth, height - 4);
    context.textAlign = "left";
    context.fillText("Earlier", padding.l, height - 4);
    context.textAlign = "left";

    context.fillStyle = bloc.label;
    context.beginPath();
    context.arc(padding.l + (data.length - 1) * scaleX, padding.t + chartHeight - (plotData[plotData.length - 1] - min) * scaleY, 2.5, 0, Math.PI * 2);
    context.fill();

    hoverIndex = econChartHoverIndex == null ? null : Math.max(0, Math.min(plotData.length - 1, econChartHoverIndex));
    if (hoverIndex != null) {
      hoverRawValue = Math.max(0, Number(data[hoverIndex]) || 0);
      hoverPlotValue = Number(plotData[hoverIndex]) || 0;
      hoverX = padding.l + hoverIndex * scaleX;
      hoverY = padding.t + chartHeight - (hoverPlotValue - min) * scaleY;
      hoverDay = Math.max(0, (Number(App.store.simDay) || 0) - ((data.length - 1) - hoverIndex));
      hoverLines = [
        App.utils.fmtDay(hoverDay),
        "GDP " + App.utils.fmtGU(hoverRawValue)
      ];

      if (econChartViewMode === "relative") {
        hoverLines.push((hoverPlotValue >= 0 ? "+" : "") + hoverPlotValue.toFixed(2) + "% vs start");
      } else if (econChartViewMode === "log") {
        hoverLines.push("Log " + hoverPlotValue.toFixed(2));
      }

      if (typeof context.setLineDash === "function") context.setLineDash([3, 3]);
      context.strokeStyle = "rgba(149,235,255,0.5)";
      context.beginPath();
      context.moveTo(hoverX, padding.t);
      context.lineTo(hoverX, padding.t + chartHeight);
      context.stroke();
      if (typeof context.setLineDash === "function") context.setLineDash([]);

      context.fillStyle = bloc.label;
      context.beginPath();
      context.arc(hoverX, hoverY, 3, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#d9f7ff";
      context.lineWidth = 1;
      context.stroke();

      tooltipWidth = hoverLines.reduce(function(maxWidth, line){
        return Math.max(maxWidth, context.measureText(line).width);
      }, 0) + 14;
      tooltipHeight = 8 + (hoverLines.length * 10);
      tooltipX = Math.min(width - tooltipWidth - 6, Math.max(6, hoverX + 8));
      if ((tooltipX + tooltipWidth) > (width - 6)) {
        tooltipX = Math.max(6, hoverX - tooltipWidth - 8);
      }
      tooltipY = Math.max(6, hoverY - tooltipHeight - 8);

      context.fillStyle = "rgba(8,14,21,0.92)";
      context.strokeStyle = "rgba(83,135,168,0.52)";
      context.lineWidth = 1;
      context.beginPath();
      context.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
      context.fill();
      context.stroke();

      context.fillStyle = "#d6e7f3";
      context.textAlign = "left";
      hoverLines.forEach(function(line, lineIndex){
        context.fillText(line, tooltipX + 7, tooltipY + 10 + (lineIndex * 10));
      });
    }
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
    lastSelectionRenderDay = Number(App.store.simDay) || 0;
  }

  function renderTickFrame(options){
    var settings = options && typeof options === "object" ? options : {};
    var currentDay = Number(App.store.simDay) || 0;
    var shouldRefreshSelection = !!settings.full || lastSelectionRenderDay == null || Math.abs(currentDay - lastSelectionRenderDay) >= 10;

    updateTopBar();
    syncSpeedButtons();
    updateFxBar();
    updateTicker();
    renderNews();

    if (settings.full) {
      renderLegend();
      renderSelection();
      return;
    }

    renderEconChart();

    if (shouldRefreshSelection) {
      renderSelection();
    }
  }

  function renderAll(){
    renderTickFrame({ full:true });
  }

  function setSettingsStatus(message, status){
    var statusNode = document.getElementById("settings-status");

    if (!statusNode) return;
    statusNode.textContent = message || "";
    statusNode.classList.remove("ok", "err");
    if (status === "ok" || status === "err") {
      statusNode.classList.add(status);
    }
  }

  function setSlotsStatus(message, status){
    var statusNode = document.getElementById("slots-status");

    if (!statusNode) return;
    statusNode.textContent = message || "";
    statusNode.classList.remove("ok", "err");
    if (status === "ok" || status === "err") {
      statusNode.classList.add(status);
    }
  }

  function renderStartPresetSelect(){
    var selectNode = document.getElementById("settings-start-preset-select");
    var presets = (App.sim && typeof App.sim.getStartPresetList === "function") ? (App.sim.getStartPresetList() || []) : [];
    var selectedId = (App.sim && typeof App.sim.getPendingStartPresetId === "function" ? App.sim.getPendingStartPresetId() : null) || (App.store && App.store.startPresetId) || (App.sim && typeof App.sim.getDefaultStartPresetId === "function" ? App.sim.getDefaultStartPresetId() : "1998");

    if (!selectNode) return;

    selectNode.innerHTML = presets.map(function(preset){
      var selected = preset.id === selectedId ? " selected" : "";
      return "<option value='" + escapeAttrText(preset.id) + "'" + selected + ">" + escapeHtmlText(preset.label + " - " + preset.title) + "</option>";
    }).join("");
    selectNode.disabled = !presets.length;

    if (presets.length && !presets.some(function(preset){ return preset.id === selectedId; })) {
      selectNode.value = presets[0].id;
    }
  }

  function setSettingsMenuOpen(open){
    var modal = document.getElementById("settings-modal");

    if (!modal) return;
    settingsMenuOpen = !!open;
    modal.classList.toggle("open", settingsMenuOpen);
    modal.setAttribute("aria-hidden", settingsMenuOpen ? "false" : "true");
    if (settingsMenuOpen) {
      renderStartPresetSelect();
      renderYearlyExportNote();
    }
    if (!settingsMenuOpen) {
      setSettingsStatus("", null);
    }
  }

  function formatSlotSavedAt(savedAtISO){
    var date;

    if (!savedAtISO) return "Unknown time";
    date = new Date(savedAtISO);
    if (Number.isNaN(date.getTime())) return "Unknown time";
    return date.toLocaleString();
  }

  function renderSlotsModal(){
    var titleNode = document.getElementById("slots-title");
    var noteNode = document.getElementById("slots-note");
    var listNode = document.getElementById("slots-list");
    var slots = (App.persistence && typeof App.persistence.listSlots === "function") ? App.persistence.listSlots() : [];
    var saveMode = slotsModalMode === "save";

    if (!titleNode || !noteNode || !listNode) return;

    titleNode.textContent = saveMode ? "Save World Slots" : "Load World Slots";
    noteNode.textContent = saveMode
      ? "Choose one of 5 persistent slots, set a name, and save. Slots are not deleted on reset."
      : "Load any existing slot or delete it permanently. Empty slots cannot be loaded.";

    listNode.innerHTML = slots.map(function(slot){
      var slotIndex = Number(slot && slot.slotIndex) || 0;
      var exists = !!(slot && slot.exists);
      var name = String(slot && slot.name || ("Slot " + slotIndex));
      var dayText = slot && Number.isFinite(slot.day) ? ("Day " + slot.day) : "No day";
      var savedAtText = exists ? formatSlotSavedAt(slot.savedAtISO) : "Empty slot";
      var inputId = "save-slot-name-" + slotIndex;
      var input = saveMode
        ? ("<input id='" + inputId + "' class='save-slot-name' type='text' maxlength='64' value='" + escapeAttrText(name) + "' placeholder='Enter slot name'>")
        : "";
      var saveButton = saveMode
        ? ("<button class='sb' type='button' data-slot-save='" + slotIndex + "'>" + (exists ? "Overwrite Slot" : "Save To Slot") + "</button>")
        : "";
      var loadButton = !saveMode
        ? ("<button class='sb' type='button' data-slot-load='" + slotIndex + "'" + (exists ? "" : " disabled") + ">Load Slot</button>")
        : "";
      var deleteButton = !saveMode
        ? ("<button class='sb settings-danger' type='button' data-slot-delete='" + slotIndex + "'" + (exists ? "" : " disabled") + ">Delete Slot</button>")
        : "";

      return [
        "<div class='save-slot-row'>",
        "<div class='save-slot-head'><div class='save-slot-title'>Slot " + slotIndex + "</div><div class='save-slot-meta'>" + dayText + " | " + escapeAttrText(savedAtText) + "</div></div>",
        "<div class='save-slot-meta'>Name: " + escapeAttrText(name) + "</div>",
        "<div class='save-slot-controls'>",
        input,
        saveButton,
        loadButton,
        deleteButton,
        "</div>",
        (!exists && !saveMode ? "<div class='save-slot-empty'>This slot is empty.</div>" : ""),
        "</div>"
      ].join("");
    }).join("");
  }

  function setSlotsMenuOpen(open, mode){
    var modal = document.getElementById("slots-modal");

    if (!modal) return;
    if (mode === "save" || mode === "load") {
      slotsModalMode = mode;
    }
    slotsMenuOpen = !!open;
    modal.classList.toggle("open", slotsMenuOpen);
    modal.setAttribute("aria-hidden", slotsMenuOpen ? "false" : "true");
    if (slotsMenuOpen) {
      renderSlotsModal();
      setSlotsStatus("", null);
    } else {
      setSlotsStatus("", null);
    }
  }

  function saveWorldFromSettings(){
    if (!App.persistence || typeof App.persistence.saveToSlot !== "function") {
      setSettingsStatus("Save slots are unavailable.", "err");
      return;
    }
    setSlotsMenuOpen(true, "save");
  }

  function loadWorldFromSettings(){
    if (!App.persistence || typeof App.persistence.loadFromSlot !== "function") {
      setSettingsStatus("Load slots are unavailable.", "err");
      return;
    }
    setSlotsMenuOpen(true, "load");
  }

  function resetWorldFromStart(){
    var startPresetSelect = document.getElementById("settings-start-preset-select");
    var startPresetId = startPresetSelect ? startPresetSelect.value : null;
    var startPresetLabel = startPresetSelect && startPresetSelect.selectedOptions && startPresetSelect.selectedOptions[0]
      ? startPresetSelect.selectedOptions[0].textContent
      : "1998 - 1998 Default Sandbox";
    var approved = global.confirm("Reset world to a fresh " + startPresetLabel + " start? This clears auto-restore state and reloads the simulation. Named save slots are kept.");

    if (!approved) return;

    if (App.sim && typeof App.sim.queuePendingStartPreset === "function" && !App.sim.queuePendingStartPreset(startPresetId)) {
      setSettingsStatus("Could not queue the selected start preset.", "err");
      return;
    }

    if (App.persistence && typeof App.persistence.clearLatest === "function") {
      App.persistence.clearLatest();
    }

    global.location.reload();
  }

  function shouldIgnoreSpaceToggle(event){
    var target = event && event.target ? event.target : null;
    var tagName = target && target.tagName ? String(target.tagName).toUpperCase() : "";

    if (event.altKey || event.ctrlKey || event.metaKey) return true;
    if (event.repeat) return true;
    if (!target) return false;
    if (target.isContentEditable) return true;
    if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || tagName === "BUTTON") return true;
    if (typeof target.closest === "function" && target.closest("input, textarea, select, button, [contenteditable='true']")) return true;

    return false;
  }

  function initUI(){
    stockChartViewMode = normalizeStockChartViewMode(safeLocalStorageGet(STOCK_CHART_VIEW_MODE_STORAGE_KEY));
    econChartViewMode = normalizeEconChartViewMode(safeLocalStorageGet(ECON_CHART_VIEW_MODE_STORAGE_KEY));
    inspectorTooltipsEnabled = normalizeTooltipToggle(safeLocalStorageGet(INSPECTOR_TOOLTIP_TOGGLE_STORAGE_KEY));
    renderStartPresetSelect();

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
      activePersonDetailTab = "overview";
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
      var personDetailTabTarget = event.target.closest(".person-detail-tab[data-person-tab]");
      var toggleRichTips = event.target.closest("[data-toggle-rich-tooltips]");
      var countryNavTarget = event.target.closest(".cflag[data-country-iso], .cban[data-country-iso]");
      var runClosure = event.target.closest("#run-closure-gates-btn");
      var runFastForwardYear = event.target.closest("#sim-forward-year-btn");
      var runClosureScenario = event.target.closest("#run-closure-scenario-btn");
      var runClosureScenarioSuite = event.target.closest("#run-closure-scenario-suite-btn");
      var saveClosureBaseline = event.target.closest("#save-closure-baseline-btn");
      var compareClosureBaseline = event.target.closest("#compare-closure-baseline-btn");
      var clearClosureBaseline = event.target.closest("#clear-closure-baseline-btn");
      var stockChartModeTarget = event.target.closest("[data-stock-chart-mode]");
      var businessTarget = event.target.closest(".rrow[data-business-id], .entity-link[data-business-id]");
      var personTarget;

      if (countryNavTarget) {
        setInspectorTab("inspector");
        App.store.selectCountry(countryNavTarget.getAttribute("data-country-iso"));
        renderSelection();
        return;
      }

      if (toggleRichTips) {
        inspectorTooltipsEnabled = !inspectorTooltipsEnabled;
        safeLocalStorageSet(INSPECTOR_TOOLTIP_TOGGLE_STORAGE_KEY, String(inspectorTooltipsEnabled));
        hideFloatingRichTooltip();
        renderInspector();
        return;
      }

      if (personDetailTabTarget) {
        activePersonDetailTab = personDetailTabTarget.getAttribute("data-person-tab") === "more" ? "more" : "overview";
        renderInspector();
        return;
      }

      if (runClosure) {
        if (!closureGateRunning && App.sim && typeof App.sim.runClosureGateSuite === "function") {
          closureGateRunning = true;
          renderInspectorSafe();
          global.setTimeout(function(){
            try {
              closureGateResult = App.sim.runClosureGateSuite();
              closureGateLastRunDay = App.store.simDay;
              appendClosureTelemetryEntry(closureGateResult);
              if (closureGateBaseline) {
                closureGateBaselineDiff = compareClosureResultToBaseline(closureGateResult, closureGateBaseline);
              }
            } catch (error) {
              closureGateResult = {
                ok:false,
                summary:{ passed:0, failed:0, total:0 },
                tiers:{ tier1:[], tier2:[], tier3:[], tier4:[] },
                feedbackLoops:{ growthLoopPass:false, recessionLoopPass:false, laborPressureLoopPass:false },
                hardFailures:[{ code:"ERR", label:error && error.message ? error.message : "Closure gate execution error.", failed:true }]
              };
              closureGateLastRunDay = App.store.simDay;
              closureGateBaselineDiff = null;
            } finally {
              closureGateRunning = false;
              renderInspectorSafe();
            }
          }, 20);
        }
        return;
      }

      if (runClosureScenario) {
        if (!closureScenarioRunning && App.sim && typeof App.sim.runScenarioPreset === "function" && closureScenarioSelectedId) {
          closureScenarioRunning = true;
          renderInspectorSafe();
          global.setTimeout(function(){
            try {
              closureScenarioResult = App.sim.runScenarioPreset(closureScenarioSelectedId);
              closureGateLastRunDay = App.store.simDay;
            } catch (error) {
              closureScenarioResult = {
                id:closureScenarioSelectedId,
                label:"Scenario",
                title:"Scenario Pack",
                pass:false,
                evidence:{ error:error && error.message ? error.message : "Scenario execution error." }
              };
            } finally {
              closureScenarioRunning = false;
              renderInspectorSafe();
            }
          }, 20);
        }
        return;
      }

      if (runClosureScenarioSuite) {
        if (!closureScenarioRunning && App.sim && typeof App.sim.runAllScenarioPresets === "function") {
          closureScenarioRunning = true;
          renderInspectorSafe();
          global.setTimeout(function(){
            try {
              closureScenarioSuiteResult = App.sim.runAllScenarioPresets();
              closureGateLastRunDay = App.store.simDay;
            } catch (error) {
              closureScenarioSuiteResult = {
                ok:false,
                summary:{ total:0, passed:0, failed:0 },
                results:[{ label:"Scenario Suite", pass:false, days:0, evidence:{ error:error && error.message ? error.message : "Scenario suite execution error." } }]
              };
            } finally {
              closureScenarioRunning = false;
              renderInspectorSafe();
            }
          }, 20);
        }
        return;
      }

      if (runFastForwardYear) {
        if (!closureGateFastForwardRunning && App.sim && typeof App.sim.fastForwardDays === "function") {
          var fastForwardInput = document.getElementById("closure-fast-forward-years-input");
          var fastForwardConfig;

          if (fastForwardInput) {
            closureFastForwardYears = normalizeClosureFastForwardYears(fastForwardInput.value);
            safeLocalStorageSet(CLOSURE_FAST_FORWARD_YEARS_STORAGE_KEY, String(closureFastForwardYears));
          }

          fastForwardConfig = getClosureFastForwardConfig();

          closureGateFastForwardRunning = true;
          renderInspectorSafe();
          global.setTimeout(function(){
            try {
              App.sim.fastForwardDays(fastForwardConfig.totalDays, { render:true, includeRandom:true });
              closureGateLastRunDay = App.store.simDay;
            } catch (error) {
              closureGateResult = {
                ok:false,
                summary:{ passed:0, failed:0, total:0 },
                tiers:{ tier1:[], tier2:[], tier3:[], tier4:[] },
                feedbackLoops:{ growthLoopPass:false, recessionLoopPass:false, laborPressureLoopPass:false },
                hardFailures:[{ code:"ERR", label:error && error.message ? error.message : "Fast-forward simulation error.", failed:true }]
              };
              closureGateLastRunDay = App.store.simDay;
            } finally {
              closureGateFastForwardRunning = false;
              renderInspectorSafe();
            }
          }, 20);
        }
        return;
      }

      if (saveClosureBaseline) {
        if (closureGateResult) {
          var snapshot = createClosureBaselineSnapshot(closureGateResult);
          var saved = safeLocalStorageSet(CLOSURE_BASELINE_STORAGE_KEY, JSON.stringify(snapshot));
          if (saved) {
            closureGateBaseline = snapshot;
            closureGateBaselineDiff = compareClosureResultToBaseline(closureGateResult, closureGateBaseline);
          } else {
            closureGateBaselineDiff = {
              hasBaseline:false,
              hasResult:true,
              match:false,
              changedCount:1,
              messages:["Failed to persist baseline snapshot in local storage."]
            };
          }
          renderInspector();
        }
        return;
      }

      if (compareClosureBaseline) {
        if (closureGateResult && closureGateBaseline) {
          closureGateBaselineDiff = compareClosureResultToBaseline(closureGateResult, closureGateBaseline);
        } else if (!closureGateBaseline) {
          closureGateBaselineDiff = {
            hasBaseline:false,
            hasResult:!!closureGateResult,
            match:false,
            changedCount:0,
            messages:["No saved baseline found. Run gates and click Save Baseline first."]
          };
        } else {
          closureGateBaselineDiff = {
            hasBaseline:true,
            hasResult:false,
            match:false,
            changedCount:0,
            messages:["No closure result available. Run Closure Gates first."]
          };
        }
        renderInspector();
        return;
      }

      if (clearClosureBaseline) {
        safeLocalStorageRemove(CLOSURE_BASELINE_STORAGE_KEY);
        closureGateBaseline = null;
        closureGateBaselineDiff = null;
        renderInspector();
        return;
      }

      if (stockChartModeTarget) {
        stockChartViewMode = normalizeStockChartViewMode(stockChartModeTarget.getAttribute("data-stock-chart-mode"));
        safeLocalStorageSet(STOCK_CHART_VIEW_MODE_STORAGE_KEY, stockChartViewMode);
        renderInspector();
        return;
      }

      if (businessTarget) {
        setInspectorTab("inspector");
        App.store.selectBusiness(businessTarget.getAttribute("data-business-id"));
        renderSelection();
        return;
      }

      personTarget = event.target.closest(".rrow[data-person-id], .entity-link[data-person-id]");
      if (!personTarget) return;
      setInspectorTab("inspector");
      activePersonDetailTab = "overview";
      App.store.selectPerson(personTarget.getAttribute("data-person-id"));
      renderSelection();
    });

    document.getElementById("dpanel-tabs").addEventListener("click", function(event){
      var button = event.target.closest(".dtab[data-inspector-tab]");
      if (!button) return;
      setInspectorTab(button.getAttribute("data-inspector-tab"));
      renderInspector();
    });

    document.getElementById("dc").addEventListener("change", function(event){
      var fastForwardInput = event.target.closest("#closure-fast-forward-years-input");
      var scenarioSelect = event.target.closest("#closure-scenario-select");

      if (fastForwardInput) {
        closureFastForwardYears = normalizeClosureFastForwardYears(fastForwardInput.value);
        safeLocalStorageSet(CLOSURE_FAST_FORWARD_YEARS_STORAGE_KEY, String(closureFastForwardYears));
        syncClosureFastForwardControls();
        return;
      }

      if (!scenarioSelect) return;
      closureScenarioSelectedId = String(scenarioSelect.value || "");
      renderInspector();
    });

    document.getElementById("ctabs").addEventListener("click", function(event){
      var chartModeButton = event.target.closest("[data-econ-chart-mode]");
      var button = event.target.closest(".ctab");

      if (chartModeButton) {
        econChartViewMode = normalizeEconChartViewMode(chartModeButton.getAttribute("data-econ-chart-mode"));
        safeLocalStorageSet(ECON_CHART_VIEW_MODE_STORAGE_KEY, econChartViewMode);
        renderTabs();
        renderEconChart();
        return;
      }

      if (!button) return;
      App.store.setSelectedBloc(button.getAttribute("data-bloc-id"));
      renderTabs();
      renderEconChart();
    });

    document.getElementById("econ-canvas").addEventListener("mousemove", function(event){
      updateEconChartHoverState(event);
    });

    document.getElementById("econ-canvas").addEventListener("mouseleave", function(){
      if (econChartHoverIndex != null) {
        econChartHoverIndex = null;
        renderEconChart();
      }
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

    document.getElementById("settings-btn").addEventListener("click", function(){
      setSettingsMenuOpen(true);
    });

    document.getElementById("settings-close-btn").addEventListener("click", function(){
      setSettingsMenuOpen(false);
    });

    document.getElementById("settings-modal").addEventListener("click", function(event){
      var closeTarget = event.target.closest("[data-settings-close]");

      if (!closeTarget) return;
      setSettingsMenuOpen(false);
    });

    document.getElementById("slots-close-btn").addEventListener("click", function(){
      setSlotsMenuOpen(false);
    });

    document.getElementById("slots-modal").addEventListener("click", function(event){
      var closeTarget = event.target.closest("[data-slots-close]");
      var saveTarget = event.target.closest("[data-slot-save]");
      var loadTarget = event.target.closest("[data-slot-load]");
      var deleteTarget = event.target.closest("[data-slot-delete]");
      var slotIndex;
      var result;
      var input;
      var slotName;
      var approved;

      if (closeTarget) {
        setSlotsMenuOpen(false);
        return;
      }

      if (saveTarget) {
        slotIndex = Number(saveTarget.getAttribute("data-slot-save")) || 0;
        input = document.getElementById("save-slot-name-" + slotIndex);
        slotName = input ? String(input.value || "") : ("Slot " + slotIndex);

        if (!App.persistence || typeof App.persistence.saveToSlot !== "function") {
          setSlotsStatus("Save slots are unavailable.", "err");
          return;
        }

        result = App.persistence.saveToSlot(slotIndex, slotName);
        if (result && result.ok) {
          setSlotsStatus("Saved to slot " + slotIndex + ".", "ok");
          setSettingsStatus("Saved to slot " + slotIndex + ".", "ok");
          renderSlotsModal();
        } else {
          setSlotsStatus("Save failed: " + ((result && result.error) || "Unknown error."), "err");
        }
        return;
      }

      if (loadTarget) {
        slotIndex = Number(loadTarget.getAttribute("data-slot-load")) || 0;

        if (!App.persistence || typeof App.persistence.loadFromSlot !== "function") {
          setSlotsStatus("Load slots are unavailable.", "err");
          return;
        }

        result = App.persistence.loadFromSlot(slotIndex);
        if (result && result.ok) {
          if (App.sim && typeof App.sim.rehydrateLoadedState === "function") {
            App.sim.rehydrateLoadedState();
          }
          setSettingsStatus("Loaded slot " + slotIndex + ".", "ok");
          setSlotsStatus("Loaded slot " + slotIndex + ".", "ok");
          setSlotsMenuOpen(false);
          setSettingsMenuOpen(false);
          renderAll();
          if (App.map && typeof App.map.updateCountryColors === "function") {
            App.map.updateCountryColors();
          }
          return;
        }

        if (result && result.reason === "empty") {
          setSlotsStatus("Slot " + slotIndex + " is empty.", "err");
          return;
        }

        setSlotsStatus("Load failed: " + ((result && result.error) || "Unknown error."), "err");
        return;
      }

      if (deleteTarget) {
        slotIndex = Number(deleteTarget.getAttribute("data-slot-delete")) || 0;
        approved = global.confirm("Delete slot " + slotIndex + "? This cannot be undone.");
        if (!approved) return;

        if (!App.persistence || typeof App.persistence.deleteSlot !== "function") {
          setSlotsStatus("Delete action is unavailable.", "err");
          return;
        }

        result = App.persistence.deleteSlot(slotIndex);
        if (result && result.ok) {
          setSlotsStatus("Deleted slot " + slotIndex + ".", "ok");
          setSettingsStatus("Deleted slot " + slotIndex + ".", "ok");
          renderSlotsModal();
        } else {
          setSlotsStatus("Delete failed: " + ((result && result.error) || "Unknown error."), "err");
        }
      }
    });

    document.getElementById("settings-save-btn").addEventListener("click", function(){
      saveWorldFromSettings();
    });

    document.getElementById("settings-load-btn").addEventListener("click", function(){
      loadWorldFromSettings();
    });

    document.getElementById("settings-export-yearly-btn").addEventListener("click", function(){
      exportYearlyTuningCsv();
    });

    document.getElementById("settings-reset-btn").addEventListener("click", function(){
      resetWorldFromStart();
    });
    document.getElementById("settings-start-preset-select").addEventListener("change", function(event){
      var option = event.target && event.target.selectedOptions && event.target.selectedOptions[0] ? event.target.selectedOptions[0].textContent : "selected preset";
      setSettingsStatus("Next fresh-world reset will use " + option + ".", "ok");
    });

    document.addEventListener("keydown", function(event){
      var isSpace = event.code === "Space" || event.key === " ";

      if (isSpace) {
        var resumeSpeed;

        if (shouldIgnoreSpaceToggle(event)) return;

        event.preventDefault();
        if (Number(App.store.simSpeed) > 0) {
          App.store.setSimSpeed(0);
        } else {
          resumeSpeed = Number(App.store.lastNonZeroSimSpeed) > 0 ? Number(App.store.lastNonZeroSimSpeed) : 1;
          App.store.setSimSpeed(resumeSpeed);
        }
        syncSpeedButtons();
        return;
      }

      if (event.key !== "Escape") return;
      if (slotsMenuOpen) {
        setSlotsMenuOpen(false);
        return;
      }
      if (!settingsMenuOpen) return;
      setSettingsMenuOpen(false);
    });

    syncSpeedButtons();
    syncPeopleTabs();
    syncInspectorTabs();
    renderNews();
  }

  App.ui = {
    initUI:initUI,
    renderAll:renderAll,
    renderTickFrame:renderTickFrame,
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
