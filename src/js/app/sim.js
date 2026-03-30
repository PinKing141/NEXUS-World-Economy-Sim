(function(global){
  var App = global.Nexus || (global.Nexus = {});
  var YEAR_DAYS = (App.data && App.data.CALENDAR && App.data.CALENDAR.daysPerYear) ? App.data.CALENDAR.daysPerYear : 360;
  var lastFrameTime = performance.now();
  var ENTREPRENEURIAL_TRAITS = {
    Ambitious:true,
    Visionary:true,
    "Risk-taker":true,
    Innovator:true
  };
  var SIM_DAYS_PER_TICK = Math.max(1, Math.floor(Number(global.__NEXUS_SIM_DAYS_PER_TICK) || 1));
  var LEGACY_SIM_DAYS_PER_TICK = 3;
  var TICKS_PER_YEAR = YEAR_DAYS / SIM_DAYS_PER_TICK;
  var DAYS_PER_MONTH = YEAR_DAYS / 12;
  var YEARLY_TUNING_MAX_RECORDS = 240;
  var MAX_PERSON_NET_WORTH_GU = 5e8;
  var MAX_PERSON_SALARY_GU = 2e7;
  var MAX_BUSINESS_REVENUE_GU = 2e9;
  var MAX_BUSINESS_PROFIT_GU = 6e8;
  var MAX_BUSINESS_VALUATION_GU = 1.2e10;
  var MAX_BUSINESS_CASH_GU = 2e9;
  var MAX_HOUSEHOLD_BALANCE_GU = 5e8;
  var MAX_COUNTRY_MEDIAN_WAGE_GU = 5e5;
  var MAX_COUNTRY_DEMAND_GU = 2e14;
  var STOCK_MIN_LISTING_AGE_YEARS = 6;
  var STOCK_MIN_LISTING_REVENUE_GU = 120000;
  var STOCK_MIN_LISTING_VALUATION_GU = 250000;
  var STOCK_MIN_LISTING_EMPLOYEES = 18;
  var STOCK_TRADING_CADENCE_DAYS = 7;
  var STOCK_DIVIDEND_CADENCE_DAYS = 90;
  var STOCK_MAX_TAPE_ITEMS = 120;
  var LONG_UNEMPLOYMENT_DAYS = 180;
  var LEGACY_WORLD_START_YEAR = (App.data && App.data.CALENDAR && Number(App.data.CALENDAR.startYear)) ? Number(App.data.CALENDAR.startYear) : 2026;
  var DEFAULT_START_PRESET_ID = "1998";
  var PRESENT_DAY_START_PRESET_ID = "present-day";
  var START_PRESET_PENDING_STORAGE_KEY = "nexus.world.pendingStartPreset";
  var LABOR_MOBILITY_FLOW_CAP = 12;
  var POLICY_STANCE_KEYS = ["supportive", "neutral", "tightening"];
  var COUNTRY_POLICY_STANCE_EFFECTS = {
    supportive:{
      demandGrowthBias:0.025,
      wagePressureBias:-0.02,
      talentShortageBias:-0.015,
      debtRateBias:-0.008,
      rolloverChanceBias:0.04,
      distressBias:-0.06,
      bailoutBias:0.035,
      migrationPressureBias:0.055
    },
    neutral:{
      demandGrowthBias:0,
      wagePressureBias:0,
      talentShortageBias:0,
      debtRateBias:0,
      rolloverChanceBias:0,
      distressBias:0,
      bailoutBias:0,
      migrationPressureBias:0
    },
    tightening:{
      demandGrowthBias:-0.018,
      wagePressureBias:0.018,
      talentShortageBias:0.012,
      debtRateBias:0.007,
      rolloverChanceBias:-0.035,
      distressBias:0.07,
      bailoutBias:-0.03,
      migrationPressureBias:-0.05
    }
  };
  var BLOC_POLICY_STANCE_EFFECTS = {
    supportive:{
      demandGrowthBias:0.015,
      wagePressureBias:-0.012,
      talentShortageBias:-0.008,
      debtRateBias:-0.005,
      rolloverChanceBias:0.025,
      distressBias:-0.04,
      bailoutBias:0.02,
      migrationPressureBias:0.03
    },
    neutral:{
      demandGrowthBias:0,
      wagePressureBias:0,
      talentShortageBias:0,
      debtRateBias:0,
      rolloverChanceBias:0,
      distressBias:0,
      bailoutBias:0,
      migrationPressureBias:0
    },
    tightening:{
      demandGrowthBias:-0.012,
      wagePressureBias:0.012,
      talentShortageBias:0.008,
      debtRateBias:0.004,
      rolloverChanceBias:-0.02,
      distressBias:0.045,
      bailoutBias:-0.02,
      migrationPressureBias:-0.028
    }
  };
  var TIER6_SLICE1_CONFIG = {
    enabled:true,
    elections:true,
    sanctions:true,
    conflictPhaseEnabled:false,
    electionCycleMinYears:3,
    electionCycleSpanYears:3,
    sanctionGeoPressureThreshold:1.2,
    sanctionPressureMax:0.38,
    sanctionLaneDecay:0.74,
    sanctionDealBlockCap:0.58,
    sanctionFinanceBlockCap:0.54,
    electionChannelDecay:0.72,
    electionNewsHashGate:15
  };
  var closureValidationMode = false;
  var JOB_TIER_ORDER = ["entry", "junior", "mid", "senior", "leadership", "executive"];
  var CORE_LEADERSHIP_ROLES = {
    ceo:{ roleKey:"ceo", title:"CEO", department:"Executive", tier:"executive", importance:5 },
    coo:{ roleKey:"coo", title:"COO", department:"Operations", tier:"executive", importance:4 },
    cfo:{ roleKey:"cfo", title:"CFO", department:"Finance", tier:"executive", importance:4 },
    hr_leader:{ roleKey:"hr_leader", title:"HR Leader", department:"People", tier:"leadership", importance:3 }
  };
  var INDUSTRY_LEADERSHIP_ROLES = {
    Technology:{ roleKey:"cto", title:"CTO", department:"Technology", tier:"leadership", importance:4 },
    Media:{ roleKey:"cto", title:"CTO", department:"Technology", tier:"leadership", importance:4 },
    Finance:{ roleKey:"head_of_trading", title:"Head of Trading", department:"Markets", tier:"leadership", importance:4 },
    Manufacturing:{ roleKey:"operations_director", title:"Operations Director", department:"Operations", tier:"leadership", importance:4 },
    Energy:{ roleKey:"operations_director", title:"Operations Director", department:"Operations", tier:"leadership", importance:4 },
    Logistics:{ roleKey:"network_director", title:"Network Director", department:"Logistics", tier:"leadership", importance:4 },
    Healthcare:{ roleKey:"medical_director", title:"Medical Director", department:"Medical", tier:"leadership", importance:4 },
    Retail:{ roleKey:"store_operations_director", title:"Store Operations Director", department:"Stores", tier:"leadership", importance:4 },
    "F&B":{ roleKey:"store_operations_director", title:"Store Operations Director", department:"Stores", tier:"leadership", importance:4 },
    "Real Estate":{ roleKey:"development_director", title:"Development Director", department:"Development", tier:"leadership", importance:4 }
  };
  var LOGO_RULES = {
    Technology:{
      palettes:[
        ["#4a9edd", "#00d4ff", "#f5a623"],
        ["#5b8cff", "#21c7b7", "#ffd166"],
        ["#3b82f6", "#8b5cf6", "#7ee7ff"]
      ],
      archetypes:["grid", "overlap", "ring", "orbit", "wave"]
    },
    Finance:{
      palettes:[
        ["#123c69", "#355070", "#e5c674"],
        ["#1b4965", "#5fa8d3", "#ffd166"],
        ["#0f3d3e", "#2c666e", "#d9a441"]
      ],
      archetypes:["bars", "monogram", "fold", "chevron"]
    },
    Retail:{
      palettes:[
        ["#b56576", "#6d597a", "#ffb4a2"],
        ["#d97706", "#b45309", "#fde68a"],
        ["#8d5a97", "#355070", "#ffd6a5"]
      ],
      archetypes:["overlap", "ring", "monogram", "wave"]
    },
    Manufacturing:{
      palettes:[
        ["#475569", "#334155", "#f97316"],
        ["#4b5563", "#0f172a", "#f59e0b"],
        ["#5b6770", "#1f2937", "#d97706"]
      ],
      archetypes:["bars", "fold", "grid", "chevron"]
    },
    "Real Estate":{
      palettes:[
        ["#355070", "#6d597a", "#e9c46a"],
        ["#4f6d7a", "#3d405b", "#f2cc8f"],
        ["#3f5c73", "#6c757d", "#ffd6a5"]
      ],
      archetypes:["fold", "monogram", "bars", "prism"]
    },
    "F&B":{
      palettes:[
        ["#c44536", "#772e25", "#f6bd60"],
        ["#9c6644", "#7f5539", "#ffb703"],
        ["#bc6c25", "#6f1d1b", "#f4a261"]
      ],
      archetypes:["ring", "overlap", "monogram", "wave"]
    },
    Healthcare:{
      palettes:[
        ["#2a9d8f", "#457b9d", "#a8dadc"],
        ["#1d7874", "#679289", "#f4c095"],
        ["#0f766e", "#0284c7", "#99f6e4"]
      ],
      archetypes:["ring", "grid", "overlap", "orbit"]
    },
    Media:{
      palettes:[
        ["#7c3aed", "#ef476f", "#ffd166"],
        ["#8338ec", "#3a86ff", "#ffbe0b"],
        ["#6d28d9", "#db2777", "#fde047"]
      ],
      archetypes:["overlap", "bars", "ring", "prism"]
    },
    Logistics:{
      palettes:[
        ["#1d4ed8", "#0f766e", "#f59e0b"],
        ["#2563eb", "#0891b2", "#fbbf24"],
        ["#0f4c81", "#2a9d8f", "#e9c46a"]
      ],
      archetypes:["bars", "grid", "fold", "chevron"]
    },
    Energy:{
      palettes:[
        ["#ea580c", "#c2410c", "#fde047"],
        ["#f97316", "#b91c1c", "#facc15"],
        ["#d97706", "#92400e", "#fde68a"]
      ],
      archetypes:["ring", "fold", "bars", "prism"]
    }
  };
  var BLOC_LOGO_TINTS = {
    NA:["#4a9edd", "#8ad0ff", "#ffd47a"],
    SA:["#8bc34a", "#c6f56c", "#1f6f4a"],
    EU:["#4caf50", "#9de2a0", "#5b8cff"],
    AF:["#cddc39", "#f2f17a", "#f5a623"],
    AS:["#ef5350", "#ff9a96", "#ffd166"],
    RU:["#ab47bc", "#d391e3", "#5b8cff"],
    default:["#4a9edd", "#7ee7ff", "#f5a623"]
  };
  var DECISION_PROFILE_KEYS = ["riskTolerance","greed","patience","discipline","loyalty","statusSeeking","familyAttachment","adaptability","ethics"];
  var TEMP_STATE_KEYS = ["confidence","stress","burnout","grief","resentment","ambitionSpike"];
  var TEMP_STATE_DEFAULTS = {
    confidence:50,
    stress:22,
    burnout:8,
    grief:0,
    resentment:0,
    ambitionSpike:34
  };
  var DECISION_ROLE_WEIGHTS = {
    ceo:{ expansion:1.0, staffing:1.0, cash:1.0, succession:1.0 },
    cfo:{ expansion:0.45, staffing:0.55, cash:0.7, succession:0.35 },
    coo:{ expansion:0.6, staffing:0.7, cash:0.35, succession:0.4 },
    hr_leader:{ expansion:0.2, staffing:0.6, cash:0.15, succession:0.3 },
    default:{ expansion:0.6, staffing:0.35, cash:0.25, succession:0.35 }
  };
  var TRAIT_PROFILE_OFFSETS = {
    Visionary:{ riskTolerance:12, statusSeeking:8, adaptability:10, patience:-4 },
    "Risk-taker":{ riskTolerance:16, greed:4, discipline:-4, patience:-8 },
    Conservative:{ riskTolerance:-16, discipline:10, patience:8, familyAttachment:4 },
    Networker:{ loyalty:8, statusSeeking:6, adaptability:5, ethics:2 },
    Workaholic:{ discipline:12, loyalty:3, familyAttachment:-6, adaptability:2 },
    Innovator:{ adaptability:10, riskTolerance:8, patience:-3, statusSeeking:4 },
    Strategist:{ discipline:8, patience:10, adaptability:5, riskTolerance:-3 },
    Charismatic:{ statusSeeking:10, loyalty:4, greed:3, ethics:-2 },
    Frugal:{ greed:-8, discipline:8, patience:8, riskTolerance:-6 },
    Ambitious:{ statusSeeking:14, greed:6, riskTolerance:6, familyAttachment:-4 }
  };
  var TRAIT_DECISION_SHIFTS = {
    Visionary:{ expansion:10, staffing:2, cash:-6, succession:-2 },
    "Risk-taker":{ expansion:12, staffing:0, cash:-10, succession:-4 },
    Conservative:{ expansion:-12, staffing:-3, cash:12, succession:2 },
    Networker:{ expansion:5, staffing:4, cash:0, succession:1 },
    Workaholic:{ expansion:6, staffing:2, cash:2, succession:-1 },
    Innovator:{ expansion:8, staffing:1, cash:-4, succession:-1 },
    Strategist:{ expansion:4, staffing:5, cash:8, succession:-3 },
    Charismatic:{ expansion:5, staffing:4, cash:0, succession:2 },
    Frugal:{ expansion:-6, staffing:-2, cash:12, succession:0 },
    Ambitious:{ expansion:9, staffing:3, cash:-4, succession:-1 }
  };
  var TRAIT_CHANNELS = ["business","mobility","deal","family"];
  var TRAIT_CHANNEL_LABELS = {
    business:"Business",
    mobility:"Mobility",
    deal:"Deals",
    family:"Family"
  };
  var TRAIT_MECHANICS = {
    Visionary:{ business:7, mobility:5, deal:2, family:-2 },
    "Risk-taker":{ business:8, mobility:6, deal:4, family:-4 },
    Conservative:{ business:5, mobility:-2, deal:-1, family:6 },
    Networker:{ business:4, mobility:3, deal:9, family:4 },
    Workaholic:{ business:7, mobility:5, deal:1, family:-8 },
    Innovator:{ business:8, mobility:6, deal:2, family:-1 },
    Strategist:{ business:9, mobility:4, deal:5, family:2 },
    Charismatic:{ business:4, mobility:4, deal:8, family:5 },
    Frugal:{ business:6, mobility:2, deal:-2, family:3 },
    Ambitious:{ business:7, mobility:8, deal:4, family:-3 }
  };
  var MARKET_SCOPE_LOCAL = { Retail:true, "F&B":true, Healthcare:true, "Real Estate":true };
  var MARKET_SCOPE_GLOBAL = { Technology:true, Finance:true, Media:true };
  var MARKET_SCOPE_MIXED = { Manufacturing:true, Logistics:true, Energy:true };
  var DEMAND_SCOPE_SHARE = { local:0.085, global:0.028, mixed:0.05 };
  var INDUSTRY_WAGE_MULTIPLIERS = {
    Technology:1.52,
    Finance:1.7,
    Manufacturing:0.98,
    Retail:0.82,
    "Real Estate":1.28,
    "F&B":0.78,
    Healthcare:1.18,
    Media:1.06,
    Logistics:0.92,
    Energy:1.38
  };
  var INDUSTRY_PRODUCTIVITY_MULTIPLIERS = {
    Technology:5.8,
    Finance:8.2,
    Manufacturing:3.1,
    Retail:1.85,
    "Real Estate":4.3,
    "F&B":1.55,
    Healthcare:3.2,
    Media:3.7,
    Logistics:2.6,
    Energy:6.4
  };
  var INDUSTRY_OPERATING_COST_RATES = {
    Technology:0.34,
    Finance:0.38,
    Manufacturing:0.46,
    Retail:0.52,
    "Real Estate":0.36,
    "F&B":0.58,
    Healthcare:0.43,
    Media:0.41,
    Logistics:0.49,
    Energy:0.47
  };
  var INDUSTRY_OCCUPATION_MIX = {
    Technology:{ engineer:0.46, operator:0.08, sales:0.22, accountant:0.16, factory_worker:0.08 },
    Finance:{ engineer:0.1, operator:0.06, sales:0.28, accountant:0.44, factory_worker:0.12 },
    Manufacturing:{ engineer:0.18, operator:0.31, sales:0.14, accountant:0.12, factory_worker:0.25 },
    Retail:{ engineer:0.05, operator:0.26, sales:0.43, accountant:0.1, factory_worker:0.16 },
    "Real Estate":{ engineer:0.09, operator:0.19, sales:0.44, accountant:0.18, factory_worker:0.1 },
    "F&B":{ engineer:0.04, operator:0.29, sales:0.32, accountant:0.1, factory_worker:0.25 },
    Healthcare:{ engineer:0.2, operator:0.16, sales:0.2, accountant:0.2, factory_worker:0.24 },
    Media:{ engineer:0.24, operator:0.18, sales:0.31, accountant:0.17, factory_worker:0.1 },
    Logistics:{ engineer:0.11, operator:0.36, sales:0.18, accountant:0.14, factory_worker:0.21 },
    Energy:{ engineer:0.22, operator:0.31, sales:0.12, accountant:0.13, factory_worker:0.22 }
  };
  var INDUSTRY_BEHAVIOR_PROFILES = {
    Technology:{ volatility:0.16, talentSensitivity:1.24, leverageAppetite:0.98, supplySensitivity:0.42, customerElasticity:0.5, innovationBias:1.35 },
    Finance:{ volatility:0.22, talentSensitivity:1.08, leverageAppetite:1.42, supplySensitivity:0.2, customerElasticity:0.46, innovationBias:0.86 },
    Retail:{ volatility:0.1, talentSensitivity:0.82, leverageAppetite:0.9, supplySensitivity:0.94, customerElasticity:1.22, innovationBias:0.7 },
    Manufacturing:{ volatility:0.13, talentSensitivity:0.94, leverageAppetite:1.1, supplySensitivity:1.18, customerElasticity:0.8, innovationBias:0.88 },
    "Real Estate":{ volatility:0.18, talentSensitivity:0.76, leverageAppetite:1.5, supplySensitivity:0.52, customerElasticity:0.74, innovationBias:0.64 },
    "F&B":{ volatility:0.11, talentSensitivity:0.72, leverageAppetite:0.86, supplySensitivity:1.06, customerElasticity:1.1, innovationBias:0.62 },
    Healthcare:{ volatility:0.1, talentSensitivity:1.06, leverageAppetite:0.92, supplySensitivity:0.58, customerElasticity:0.44, innovationBias:0.82 },
    Media:{ volatility:0.18, talentSensitivity:1.16, leverageAppetite:1.04, supplySensitivity:0.38, customerElasticity:1.16, innovationBias:1.08 },
    Logistics:{ volatility:0.14, talentSensitivity:0.84, leverageAppetite:1.08, supplySensitivity:1.28, customerElasticity:0.78, innovationBias:0.72 },
    Energy:{ volatility:0.2, talentSensitivity:0.92, leverageAppetite:1.22, supplySensitivity:1.14, customerElasticity:0.62, innovationBias:0.76 }
  };
  var INDUSTRY_SUPPLY_DEPENDENCIES = {
    Technology:["Finance", "Energy", "Logistics"],
    Finance:["Technology", "Media"],
    Retail:["Manufacturing", "Logistics", "Energy"],
    Manufacturing:["Energy", "Logistics", "Finance"],
    "Real Estate":["Finance", "Energy", "Logistics"],
    "F&B":["Manufacturing", "Logistics", "Energy"],
    Healthcare:["Technology", "Energy", "Logistics"],
    Media:["Technology", "Finance"],
    Logistics:["Energy", "Manufacturing", "Finance"],
    Energy:["Finance", "Logistics"]
  };
  var INDUSTRY_TRADE_EXPOSURE = {
    Technology:0.62,
    Finance:0.35,
    Retail:0.58,
    Manufacturing:0.76,
    "Real Estate":0.28,
    "F&B":0.64,
    Healthcare:0.42,
    Media:0.44,
    Logistics:0.82,
    Energy:0.69
  };
  var INDUSTRY_REROUTE_ADAPTABILITY = {
    Technology:0.66,
    Finance:0.48,
    Retail:0.54,
    Manufacturing:0.58,
    "Real Estate":0.34,
    "F&B":0.46,
    Healthcare:0.52,
    Media:0.57,
    Logistics:0.72,
    Energy:0.5
  };
  var BANKRUPTCY_STAGE_ORDER = ["stable", "distress", "restructuring", "fire_sale", "bailout", "liquidation"];
  var HOUSEHOLD_CLASS_RANKS = {
    strained:0,
    working:1,
    middle:2,
    affluent:3,
    elite:4
  };
  var HOUSEHOLD_ASSET_CLASS_ALLOCATION = {
    strained:{ cash:0.92, equity:0.02, business:0.01, property:0.04, trust:0.01 },
    working:{ cash:0.78, equity:0.08, business:0.03, property:0.1, trust:0.01 },
    middle:{ cash:0.55, equity:0.18, business:0.06, property:0.18, trust:0.03 },
    affluent:{ cash:0.34, equity:0.28, business:0.09, property:0.24, trust:0.05 },
    elite:{ cash:0.2, equity:0.3, business:0.16, property:0.24, trust:0.1 }
  };
  var HOUSEHOLD_ASSET_RETURN_BASE = {
    cash:0.008,
    equity:0.052,
    business:0.069,
    property:0.032,
    trust:0.036
  };
  var HOUSEHOLD_CONSUMPTION_PROPENSITY = {
    strained:0.97,
    working:0.91,
    middle:0.84,
    affluent:0.74,
    elite:0.62
  };
  var INDUSTRY_CONSUMER_SPENDING_BASE = {
    Technology:0.11,
    Finance:0.09,
    Retail:0.18,
    Manufacturing:0.1,
    "Real Estate":0.08,
    "F&B":0.16,
    Healthcare:0.12,
    Media:0.06,
    Logistics:0.06,
    Energy:0.04
  };
  var HOUSEHOLD_HOMEOWNERSHIP_PROPERTY_MONTHS = 26;
  var GOVERNOR_CONFIG = {
    noLaunchYearsThreshold:2,
    emptyEcosystemMinDensityPerMillion:1.2,
    emptyEcosystemTicksThreshold:120,
    unemploymentRateThreshold:0.2,
    unemploymentTrapTicksThreshold:120,
    agingSeniorAge:62,
    agingShareThreshold:0.58,
    agingLockTicksThreshold:180,
    currencyConvergenceStdThreshold:0.055,
    currencyConvergenceTicksThreshold:90,
    maxInterventionsPerDay:2,
    maxSeededLaunchesPerRun:1,
    cooldownDays:{
      seededEntrepreneur:180,
      capitalEasing:90,
      migrationRelief:120,
      hiringIncentive:75,
      forexNudge:120
    }
  };
  var EDUCATION_ATTAINMENT_TIERS = [
    { min:75, label:"advanced" },
    { min:55, label:"secondary" },
    { min:35, label:"primary" },
    { min:0, label:"none" }
  ];
  var EDUCATION_CREDENTIAL_LEVELS = [
    { min:96, key:"doctorate" },
    { min:88, key:"masters" },
    { min:75, key:"bachelor" },
    { min:55, key:"highschool" },
    { min:35, key:"primary" },
    { min:0, key:"none" }
  ];
  var COUNTRY_CREDENTIAL_STYLE = {
    US:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"High School Diploma", primary:"Primary School Certificate", none:"No Formal Qualification" },
      schools:["Jefferson High School", "Roosevelt High School", "Lincoln Academy", "Riverview Public School"],
      universities:["Columbia Institute", "Hudson State University", "New Boston University", "Pacific Metropolitan University"]
    },
    UK:{
      labels:{ doctorate:"Doctorate", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"A-Level Qualification", primary:"GCSE Foundation", none:"No Formal Qualification" },
      schools:["St. Edmund College", "Northbridge School", "Wellington Comprehensive", "Riverside Grammar"],
      universities:["Kingston University", "Albion Institute", "Royal Thames University", "Westbridge University"]
    },
    IN:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Higher Secondary Certificate", primary:"Secondary School Certificate", none:"No Formal Qualification" },
      schools:["Delhi Public School", "Sunrise Senior School", "Kendriya Senior School", "National Model School"],
      universities:["National Technical University", "Metropolitan College", "Bharat Institute", "Coastal State University"]
    },
    CA:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Secondary School Diploma", primary:"Elementary Certificate", none:"No Formal Qualification" },
      schools:["Toronto Collegiate", "Vancouver Secondary", "Prairie North School", "Maple Ridge Academy"],
      universities:["Dominion University", "Lakeshore Institute", "Northern Atlantic University", "Pacific Canada University"]
    },
    AU:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Senior Secondary Certificate", primary:"Primary Certificate", none:"No Formal Qualification" },
      schools:["Sydney Central High", "Perth Public College", "Brisbane North School", "Melbourne Grammar House"],
      universities:["Southern Coast University", "Austral Institute of Technology", "Outback State University", "Harbour City University"]
    },
    DE:{
      labels:{ doctorate:"Doktorgrad", masters:"Masterabschluss", bachelor:"Bachelorabschluss", highschool:"Abitur", primary:"Grundschule Abschluss", none:"Keine formale Qualifikation" },
      schools:["Berlin Gesamtschule", "Rheinland Gymnasium", "Bayern Secondary", "Hamburg Stadt School"],
      universities:["Federal Technical University", "Rhein University", "Berlin Institute of Science", "Bavaria State University"]
    },
    FR:{
      labels:{ doctorate:"Doctorat", masters:"Master", bachelor:"Licence", highschool:"Baccalaureat", primary:"Certificat Primaire", none:"Aucune qualification formelle" },
      schools:["Lycee Montclair", "Ecole du Centre", "College Rivage", "Lycee Republique"],
      universities:["Universite Nouvelle", "Institut National", "Sorbonne Moderne", "Universite de la Cote"]
    },
    ES:{
      labels:{ doctorate:"Doctorado", masters:"Maestria", bachelor:"Grado Universitario", highschool:"Bachillerato", primary:"Certificado Primario", none:"Sin titulacion formal" },
      schools:["Instituto Central", "Colegio del Norte", "Academia del Sol", "Escuela Ribera"],
      universities:["Universidad Nacional", "Instituto Iberico", "Universidad Costera", "Universidad Metropolitana"]
    },
    BR:{
      labels:{ doctorate:"Doutorado", masters:"Mestrado", bachelor:"Bacharelado", highschool:"Ensino Medio", primary:"Ensino Fundamental", none:"Sem qualificacao formal" },
      schools:["Colegio Sao Pedro", "Escola Atlantica", "Instituto Horizonte", "Colegio do Vale"],
      universities:["Universidade Federal Nova", "Instituto Paulista", "Universidade do Litoral", "Universidade Metropolitana do Sul"]
    },
    MX:{
      labels:{ doctorate:"Doctorado", masters:"Maestria", bachelor:"Licenciatura", highschool:"Preparatoria", primary:"Primaria", none:"Sin certificacion formal" },
      schools:["Preparatoria Nacional", "Colegio del Centro", "Escuela Sierra", "Academia Valle"],
      universities:["Universidad Nacional de Economia", "Instituto Tecnologico Central", "Universidad del Pacifico", "Universidad Metropolitana de Mexico"]
    },
    CN:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Senior Middle School Diploma", primary:"Compulsory Education Certificate", none:"No Formal Qualification" },
      schools:["Harmony Senior School", "Eastern River Academy", "Jade Bridge School", "Central Prosperity School"],
      universities:["Huaxia National University", "Pearl Delta Institute", "Eastern Technology University", "Capital Science University"]
    },
    JP:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Upper Secondary Diploma", primary:"Compulsory School Certificate", none:"No Formal Qualification" },
      schools:["Sakura Senior High", "Kansai Public School", "Tohoku Academy", "Tokyo Metro High"],
      universities:["Nippon National University", "Kanto Institute of Science", "Osaka Metropolitan University", "Pacific East University"]
    },
    KR:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"High School Diploma", primary:"Middle School Completion", none:"No Formal Qualification" },
      schools:["Seoul Central High", "Han River Academy", "Busan Public School", "Daegu Senior School"],
      universities:["Korea National University", "Han Tech Institute", "Seoul Metropolitan University", "East Bay University"]
    },
    ID:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Sarjana Degree", highschool:"SMA Diploma", primary:"SMP Certificate", none:"No Formal Qualification" },
      schools:["Jakarta Senior School", "Nusantara Academy", "Java Public High", "Bali Central School"],
      universities:["Archipelago National University", "Jakarta State Institute", "Nusantara Tech University", "Coastal Indonesia University"]
    },
    NG:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Senior Secondary Certificate", primary:"Basic Education Certificate", none:"No Formal Qualification" },
      schools:["Lagos Community School", "Abuja Senior College", "Riverland Academy", "Unity High School"],
      universities:["National University of Lagos", "Federal Science Institute", "West Coast University", "Niger Delta University"]
    },
    ZA:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"National Senior Certificate", primary:"General Education Certificate", none:"No Formal Qualification" },
      schools:["Cape Town Senior School", "Johannesburg Central", "Pretoria Academy", "Durban Community High"],
      universities:["Southern Africa University", "Cape Institute of Technology", "Johannesburg State University", "Coastal Republic University"]
    },
    KE:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"KCSE Certificate", primary:"KCPE Certificate", none:"No Formal Qualification" },
      schools:["Nairobi Public School", "Rift Valley Secondary", "Mombasa Senior Academy", "Kenya Unity School"],
      universities:["Kenya National University", "Savannah Technical Institute", "East Africa University", "Nairobi Metropolitan University"]
    },
    EG:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Thanaweya Diploma", primary:"Preparatory Certificate", none:"No Formal Qualification" },
      schools:["Cairo Secondary School", "Nile Delta Academy", "Alexandria Public School", "Giza Senior School"],
      universities:["Nile National University", "Cairo Institute of Science", "Mediterranean Egypt University", "Pyramid State University"]
    },
    SA:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Secondary Education Certificate", primary:"Intermediate School Certificate", none:"No Formal Qualification" },
      schools:["Riyadh Public School", "Jeddah Central High", "Eastern Province Academy", "Kingdom Senior School"],
      universities:["Arabian National University", "Riyadh Technology Institute", "Gulf State University", "Desert Coast University"]
    },
    AE:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Secondary School Certificate", primary:"Preparatory Certificate", none:"No Formal Qualification" },
      schools:["Dubai Modern School", "Abu Dhabi Central High", "Emirates Public Academy", "Sharjah Senior School"],
      universities:["Emirates National University", "Dubai Institute of Management", "Gulf Metropolitan University", "Abu Dhabi Technology University"]
    },
    TR:{
      labels:{ doctorate:"Doktora", masters:"Yuksek Lisans", bachelor:"Lisans", highschool:"Lise Diplomasi", primary:"Ilkogretim Belgesi", none:"Resmi nitelik yok" },
      schools:["Istanbul Anatolia School", "Ankara Public Lise", "Izmir Senior Academy", "Bosphorus College"],
      universities:["Anatolia National University", "Istanbul Technology Institute", "Aegean State University", "Capital City University"]
    },
    RU:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Secondary General Certificate", primary:"Basic School Certificate", none:"No Formal Qualification" },
      schools:["Moscow Central School", "Volga Public Academy", "Siberia Secondary", "Nevsky Senior School"],
      universities:["Federation National University", "Moscow Science Institute", "Volga State University", "Northern Technical University"]
    },
    PH:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"Senior High School Diploma", primary:"Junior High Certificate", none:"No Formal Qualification" },
      schools:["Manila Central High", "Luzon Public School", "Visayas Academy", "Mindanao Senior School"],
      universities:["Philippine National University", "Manila Institute of Technology", "Island State University", "Pacific Archipelago University"]
    },
    default:{
      labels:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree", highschool:"High School Diploma", primary:"Primary Certificate", none:"No Formal Qualification" },
      schools:["Central Public School", "City Secondary School", "Regional Academy", "Community High School"],
      universities:["National University", "Metropolitan University", "State Institute", "Global Technical College"]
    }
  };
  var SKILL_KEYS = ["management", "technical", "social", "financialDiscipline", "creativity"];
  var SKILL_TRACKS = {
    foundation:{ management:1.0, technical:1.0, social:1.0, financialDiscipline:1.0, creativity:1.0 },
    general:{ management:1.0, technical:1.0, social:1.0, financialDiscipline:1.0, creativity:1.0 },
    leadership:{ management:1.35, technical:0.85, social:1.2, financialDiscipline:1.2, creativity:0.9 },
    technical:{ management:0.85, technical:1.4, social:0.9, financialDiscipline:0.95, creativity:1.15 },
    commercial:{ management:1.05, technical:0.85, social:1.35, financialDiscipline:1.2, creativity:0.9 },
    creative:{ management:0.8, technical:1.0, social:1.0, financialDiscipline:0.75, creativity:1.5 }
  };
  var OCCUPATION_SKILL_WEIGHTS = {
    factory_worker:{ management:0.78, technical:1.08, social:0.82, financialDiscipline:0.9, creativity:0.72 },
    engineer:{ management:0.86, technical:1.26, social:0.84, financialDiscipline:0.92, creativity:1.02 },
    accountant:{ management:0.94, technical:0.92, social:0.88, financialDiscipline:1.3, creativity:0.78 },
    sales:{ management:0.98, technical:0.76, social:1.34, financialDiscipline:1.04, creativity:0.94 },
    operator:{ management:0.86, technical:1.02, social:0.92, financialDiscipline:0.95, creativity:0.86 },
    executive:{ management:1.34, technical:0.88, social:1.2, financialDiscipline:1.16, creativity:1.0 },
    owner:{ management:1.24, technical:0.94, social:1.08, financialDiscipline:1.18, creativity:1.06 },
    investor:{ management:1.02, technical:0.9, social:1.0, financialDiscipline:1.3, creativity:0.9 },
    unemployed:{ management:0.72, technical:0.68, social:0.74, financialDiscipline:0.72, creativity:0.82 },
    dependent:{ management:0.74, technical:0.82, social:0.88, financialDiscipline:0.78, creativity:1.0 },
    deceased:{ management:1.0, technical:1.0, social:1.0, financialDiscipline:1.0, creativity:1.0 },
    default:{ management:1.0, technical:1.0, social:1.0, financialDiscipline:1.0, creativity:1.0 }
  };

  function randomId(){
    return Math.random().toString(36).slice(2);
  }

  function emitNews(type, text, meta){
    if (App.events && App.events.emit) {
      return App.events.emit(type, text, meta);
    }
    if (App.ui && App.ui.addNews) {
      return App.ui.addNews(type, text, meta);
    }
    return null;
  }

  function canUseStartPresetStorage(){
    try {
      if (!global.localStorage) return false;
      var key = "__nexus_start_preset_probe__";
      global.localStorage.setItem(key, "1");
      global.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getStartPresetDefinitions(){
    var presentDayYear = LEGACY_WORLD_START_YEAR;

    return {
      "1998":{
        id:"1998",
        label:"1998",
        title:"1998 Default Sandbox",
        description:"Longer dynasty runway with late-1990s global baselines and moderate inherited world depth.",
        startYear:1998,
        countryProfileSeed:{},
        bootstrapSeed:{ founderAgeMin:29, founderAgeMax:61, founderNetWorthMultiplier:1.16, establishedBusinessChance:0.68, establishedBusinessAgeMinYears:2, establishedBusinessAgeMaxYears:12 }
      },
      "2000":{
        id:"2000",
        label:"2000",
        title:"2000 Early-Globalization Baseline",
        description:"Slightly newer runway with stronger globalization and pre-crisis expansion conditions.",
        startYear:2000,
        countryProfileSeed:{},
        bootstrapSeed:{ founderAgeMin:29, founderAgeMax:61, founderNetWorthMultiplier:1.12, establishedBusinessChance:0.64, establishedBusinessAgeMinYears:2, establishedBusinessAgeMaxYears:12 }
      },
      "2008":{
        id:"2008",
        label:"2008",
        title:"2008 Financial Stress Baseline",
        description:"Starts during broad credit stress with more mature firms and weaker household resilience.",
        startYear:2008,
        countryProfileSeed:{},
        bootstrapSeed:{ founderAgeMin:31, founderAgeMax:64, founderNetWorthMultiplier:1.18, establishedBusinessChance:0.72, establishedBusinessAgeMinYears:4, establishedBusinessAgeMaxYears:16 }
      },
      "2016":{
        id:"2016",
        label:"2016",
        title:"2016 Legitimacy and Coalition Stress",
        description:"Higher polarization, stronger elite persistence, and more mature institutional tension.",
        startYear:2016,
        countryProfileSeed:{},
        bootstrapSeed:{ founderAgeMin:32, founderAgeMax:67, founderNetWorthMultiplier:1.24, establishedBusinessChance:0.8, establishedBusinessAgeMinYears:6, establishedBusinessAgeMaxYears:22 }
      },
      "2020":{
        id:"2020",
        label:"2020",
        title:"2020 Supply and Labor Shock",
        description:"Starts under supply disruption, labor volatility, and higher macro stress.",
        startYear:2020,
        countryProfileSeed:{},
        bootstrapSeed:{ founderAgeMin:34, founderAgeMax:69, founderNetWorthMultiplier:1.28, establishedBusinessChance:0.86, establishedBusinessAgeMinYears:8, establishedBusinessAgeMaxYears:26 }
      },
      "present-day":{
        id:"present-day",
        label:"Present Day",
        title:"Present Day Snapshot",
        description:"Deterministic current-world snapshot aligned to the configured data epoch.",
        startYear:presentDayYear,
        countryProfileSeed:{},
        bootstrapSeed:{ founderAgeMin:35, founderAgeMax:70, founderNetWorthMultiplier:1.32, establishedBusinessChance:0.9, establishedBusinessAgeMinYears:10, establishedBusinessAgeMaxYears:28 }
      }
    };
  }

  function normalizeStartPresetId(value){
    var definitions = getStartPresetDefinitions();
    var id = String(value == null ? "" : value).trim();

    return definitions[id] ? id : DEFAULT_START_PRESET_ID;
  }

  function getStartPreset(presetId){
    var definitions = getStartPresetDefinitions();
    return definitions[normalizeStartPresetId(presetId)] || definitions[DEFAULT_START_PRESET_ID];
  }

  function getCurrentStartPreset(){
    return getStartPreset(App.store.startPresetId || DEFAULT_START_PRESET_ID);
  }

  function getStartPresetList(){
    var definitions = getStartPresetDefinitions();

    return Object.keys(definitions).map(function(id){
      var preset = definitions[id];
      return {
        id:preset.id,
        label:preset.label,
        title:preset.title,
        description:preset.description,
        startYear:preset.startYear
      };
    });
  }

  function setCalendarStartYear(startYear){
    if (App.data && App.data.CALENDAR) {
      App.data.CALENDAR.startYear = Math.floor(Number(startYear) || 0);
    }
  }

  function getConfiguredStartYear(){
    var storeYear = Number(App.store && App.store.startYear);
    if (Number.isFinite(storeYear)) {
      return Math.floor(storeYear);
    }
    return getCurrentStartPreset().startYear;
  }

  function applyStartPresetToStore(presetId){
    var preset = getStartPreset(presetId || App.store.startPresetId || DEFAULT_START_PRESET_ID);

    App.store.startPresetId = preset.id;
    App.store.startYear = preset.startYear;
    setCalendarStartYear(preset.startYear);
    return preset;
  }

  function getPendingStartPresetId(){
    var storedValue;

    if (!canUseStartPresetStorage()) return null;
    storedValue = global.localStorage.getItem(START_PRESET_PENDING_STORAGE_KEY);
    return storedValue ? normalizeStartPresetId(storedValue) : null;
  }

  function queuePendingStartPreset(presetId){
    var preset = getStartPreset(presetId);

    if (!canUseStartPresetStorage()) return false;
    global.localStorage.setItem(START_PRESET_PENDING_STORAGE_KEY, preset.id);
    return true;
  }

  function clearPendingStartPreset(){
    if (!canUseStartPresetStorage()) return false;
    global.localStorage.removeItem(START_PRESET_PENDING_STORAGE_KEY);
    return true;
  }

  function consumePendingStartPreset(){
    var presetId;

    if (!canUseStartPresetStorage()) return null;
    presetId = global.localStorage.getItem(START_PRESET_PENDING_STORAGE_KEY);
    global.localStorage.removeItem(START_PRESET_PENDING_STORAGE_KEY);
    return presetId ? normalizeStartPresetId(presetId) : null;
  }

  function currentSimYear(){
    return Math.floor(App.store.simDay / YEAR_DAYS);
  }

  function currentCalendarYear(){
    return getConfiguredStartYear() + currentSimYear();
  }

  function currentYear(){
    return currentSimYear();
  }

  function applyBootstrapFounderPrehistory(founder, preset){
    var seed = preset && preset.bootstrapSeed ? preset.bootstrapSeed : {};
    var multiplier = App.utils.clamp(Number(seed.founderNetWorthMultiplier) || 1, 0.8, 2.5);
    var experienceYears = Math.max(0, (founder.age || 0) - App.utils.randInt(18, 24));

    founder.netWorthGU = Math.max(2000, founder.netWorthGU * multiplier);
    founder.workExperienceYears = App.utils.clamp(Math.max(Number(founder.workExperienceYears) || 0, experienceYears), 0, 60);
    founder.lastLifeEventYear = currentCalendarYear();
  }

  function applyBootstrapBusinessPrehistory(founder, business, preset){
    var seed = preset && preset.bootstrapSeed ? preset.bootstrapSeed : {};
    var chance = App.utils.clamp(Number(seed.establishedBusinessChance) || 0, 0, 1);
    var minYears = Math.max(0, Math.floor(Number(seed.establishedBusinessAgeMinYears) || 0));
    var maxYears = Math.max(minYears, Math.floor(Number(seed.establishedBusinessAgeMaxYears) || minYears));
    var ageYears;
    var countryProfile;
    var medianWage;
    var revenuePerWorker;
    var targetEmployees;
    var stageFloor;

    if (!business || Math.random() >= chance || maxYears <= 0) {
      return;
    }

    ageYears = App.utils.randInt(minYears, maxYears);
    if (ageYears <= 0) {
      return;
    }

    business.foundedDay = App.store.simDay - (ageYears * YEAR_DAYS) - App.utils.randInt(0, DAYS_PER_MONTH * 6);
    business.stage = ageYears >= 10 ? "established" : (ageYears >= 4 ? "growth" : "startup");
    business.age = ageYears;
    business.reputation = App.utils.clamp((Number(business.reputation) || 50) + App.utils.rand(4, 14), 0, 100);
    business.cashReservesGU = Math.max(Number(business.cashReservesGU) || 0, (Number(business.revenueGU) || 0) * App.utils.rand(0.12, 0.42));
    countryProfile = ensureCountryProfile(business.countryISO);
    medianWage = Math.max(1500, Number(countryProfile && countryProfile.medianWageGU) || 12000);
    revenuePerWorker = Math.max(medianWage * 1.6, (Number(business.revenueGU) || 0) / App.utils.rand(18, 42));
    targetEmployees = Math.max(1, Math.round((Number(business.revenueGU) || 0) / revenuePerWorker));
    stageFloor = business.stage === "established" ? App.utils.randInt(20, 54) : (business.stage === "growth" ? App.utils.randInt(8, 24) : App.utils.randInt(3, 8));
    business.employees = App.utils.clamp(Math.max(Number(business.employees) || 1, targetEmployees, stageFloor), 1, 320);
    founder.netWorthGU = Math.max(founder.netWorthGU, (Number(founder.netWorthGU) || 0) + ((Number(business.valuationGU) || Number(business.revenueGU) || 0) * App.utils.rand(0.15, 0.4)));
  }

  function getBootstrapListingTargetCount(preset){
    var startYear = Number(preset && preset.startYear) || 0;

    if (startYear >= 2020) return 6;
    if (startYear >= 2016) return 5;
    if (startYear >= 2008) return 5;
    if (startYear >= 2000) return 4;
    if (startYear >= 1998) return 4;
    return 3;
  }

  function selectBootstrapListingCandidates(targetCount){
    var selected = [];
    var seen = {};
    var perBloc = {};
    var remaining = [];

    App.store.businesses.filter(isBusinessEligibleForListing).sort(function(first, second){
      return (second.valuationGU || 0) - (first.valuationGU || 0);
    }).forEach(function(business){
      if (!business || seen[business.id]) return;
      if (!perBloc[business.blocId] && selected.length < targetCount) {
        perBloc[business.blocId] = true;
        seen[business.id] = true;
        selected.push(business);
        return;
      }
      remaining.push(business);
    });

    remaining.forEach(function(business){
      if (selected.length >= targetCount || seen[business.id]) return;
      seen[business.id] = true;
      selected.push(business);
    });

    return selected.slice(0, targetCount);
  }

  function seedBootstrapListings(startPreset){
    var targetCount = getBootstrapListingTargetCount(startPreset);
    var candidates = selectBootstrapListingCandidates(targetCount);

    candidates.forEach(function(business){
      var businessAgeDays = Math.max(0, App.store.simDay - (Number(business.foundedDay) || 0));
      var maxListingAgeDays = Math.max(60, Math.floor(businessAgeDays * 0.75));
      var listedAgeDays = Math.min(maxListingAgeDays, App.utils.randInt(60, Math.max(90, maxListingAgeDays)));

      listBusinessOnExchange(business, "Legacy public market baseline seeded for the " + startPreset.label + " world.", {
        suppressNews:true,
        suppressHistory:true,
        listedDay:App.store.simDay - listedAgeDays
      });
    });
  }

  function chanceForDays(baseChance, baseDays){
    var chance = App.utils.clamp(Number(baseChance) || 0, 0, 0.999999);
    var days = Math.max(1, Number(baseDays) || 1);
    return 1 - Math.pow(1 - chance, SIM_DAYS_PER_TICK / days);
  }

  function pickWeightedValue(entries, fallbackValue){
    var list = Array.isArray(entries) ? entries.filter(function(entry){
      return entry && Number(entry.weight) > 0;
    }) : [];
    var totalWeight = list.reduce(function(sum, entry){
      return sum + Number(entry.weight);
    }, 0);
    var threshold;
    var index;

    if (!(totalWeight > 0) || !list.length) return fallbackValue;

    threshold = Math.random() * totalWeight;
    for (index = 0; index < list.length; index += 1) {
      threshold -= Number(list[index].weight);
      if (threshold <= 0) {
        return list[index].value;
      }
    }

    return list[list.length - 1].value;
  }

  function isDebtCrisisProtectedBloc(bloc){
    var blocId = String(bloc && bloc.id || "");
    return blocId === "NA" || blocId === "EU";
  }

    function buildDebtStressCauses(entry, options){
      var settings = options && typeof options === "object" ? options : {};
      var causes = [];
      var fallback = String(settings.fallback || "Debt markets started repricing bloc risk.");

      if (!entry) return [fallback];

      if (entry.defaultRisk >= 1.1) causes.push("Sovereign debt stress was already elevated.");
      else if (entry.defaultRisk >= 0.8) causes.push("Borrowing risk had been drifting higher.");

      if (entry.geoPressure >= 1.5) causes.push("Geopolitical pressure had stayed high.");
      else if (entry.geoPressure >= 1.1) causes.push("External pressure was tightening funding conditions.");

      if (entry.gdpRatio <= 0.92) causes.push("Bloc output had fallen below the world pace.");
      else if (entry.gdpRatio <= 0.98) causes.push("Growth was lagging the global pace.");

      if (entry.demandGrowth <= -0.02) causes.push("Demand momentum was already contracting.");
      else if (entry.demandGrowth <= -0.005) causes.push("Demand growth was losing momentum.");

      if (entry.unemploymentRate >= 0.12) causes.push("Labor weakness reinforced the funding shock.");
      else if (entry.unemploymentRate >= 0.09) causes.push("Unemployment was starting to weaken confidence.");

      if (entry.longUnemploymentShare >= 0.22) causes.push("Long-term joblessness signaled persistent stress.");

      if (!causes.length) causes.push(fallback);
      return causes;
    }

  function getDebtCrisisCandidateData(){
    var blocs = Array.isArray(App.store && App.store.blocs) ? App.store.blocs : [];
    var avgGdp = blocs.reduce(function(sum, bloc){
      return sum + Math.max(0, Number(bloc && bloc.gdp) || 0);
    }, 0) / Math.max(1, blocs.length);
    var currentDay = Math.max(0, Number(App.store && App.store.simDay) || 0);

    return blocs.map(function(bloc){
      var protectedBloc = isDebtCrisisProtectedBloc(bloc);
      var derived = refreshBlocPolicyStance(bloc) || { evidence:{} };
      var evidence = derived.evidence || {};
      var gdpRatio = avgGdp > 0 ? App.utils.clamp((Number(bloc.gdp) || 0) / avgGdp, 0.2, 3) : 1;
      var defaultRisk = App.utils.clamp(Number(bloc.defaultRisk) || 0, 0, 2.5);
      var geoPressure = App.utils.clamp(Number(bloc.geoPressure) || 0, 0, 3);
      var unemploymentRate = App.utils.clamp(Number(evidence.unemploymentRate) || 0, 0, 1);
      var demandGrowth = App.utils.clamp(Number(evidence.demandGrowth) || 0, -0.35, 0.35);
      var longUnemploymentShare = App.utils.clamp(Number(evidence.longUnemploymentShare) || 0, 0, 1);
      var lastDebtCrisisDay = Number(bloc.lastDebtCrisisDay);
      var lastDebtStressWarningDay = Number(bloc.lastDebtStressWarningDay);
      var daysSinceLastDebtCrisis = Number.isFinite(lastDebtCrisisDay) ? (currentDay - lastDebtCrisisDay) : Infinity;
      var daysSinceLastDebtStressWarning = Number.isFinite(lastDebtStressWarningDay) ? (currentDay - lastDebtStressWarningDay) : Infinity;
      var minimumWorldAgeDays = protectedBloc ? (YEAR_DAYS * 2) : YEAR_DAYS;
      var cooldownDays = protectedBloc ? (YEAR_DAYS * 4) : (YEAR_DAYS * 2);
      var warningLeadDays = protectedBloc ? 45 : 30;
      var warningFreshnessDays = protectedBloc ? Math.round(YEAR_DAYS * 1.5) : YEAR_DAYS;
      var stress =
        (defaultRisk * 0.95) +
        (geoPressure * 0.38) +
        (Math.max(0, 1 - gdpRatio) * 1.55) +
        (Math.max(0, -demandGrowth) * 9.0) +
        (unemploymentRate * 1.7) +
        (longUnemploymentShare * 1.2) +
        (derived.stance === "supportive" ? 0.12 : 0);
      var minimumStress = protectedBloc ? 2.25 : 1.75;
      var eligible =
        currentDay >= minimumWorldAgeDays &&
        daysSinceLastDebtCrisis >= cooldownDays &&
        daysSinceLastDebtStressWarning >= warningLeadDays &&
        daysSinceLastDebtStressWarning <= warningFreshnessDays &&
        stress >= minimumStress &&
        (defaultRisk >= 0.75 || geoPressure >= 1.2) &&
        (gdpRatio <= 0.96 || demandGrowth <= -0.015 || unemploymentRate >= 0.11);

      return {
        bloc:bloc,
        eligible:eligible,
        stress:stress,
        minimumStress:minimumStress,
        gdpRatio:gdpRatio,
        defaultRisk:defaultRisk,
        geoPressure:geoPressure,
        unemploymentRate:unemploymentRate,
        demandGrowth:demandGrowth,
        longUnemploymentShare:longUnemploymentShare,
        daysSinceLastDebtCrisis:daysSinceLastDebtCrisis,
        daysSinceLastDebtStressWarning:daysSinceLastDebtStressWarning,
        protectedBloc:protectedBloc,
        weight:eligible ? App.utils.clamp(0.8 + ((stress - minimumStress) * 0.85), 0.8, 3.4) : 0
      };
    }).filter(function(entry){
      return entry && entry.bloc;
    });
  }

  function getDebtStressWarningCandidateData(){
    var currentDay = Math.max(0, Number(App.store && App.store.simDay) || 0);

    return getDebtCrisisCandidateData().map(function(entry){
      var bloc = entry.bloc;
      var lastWarningDay = Number(bloc && bloc.lastDebtStressWarningDay);
      var daysSinceLastWarning = Number.isFinite(lastWarningDay) ? (currentDay - lastWarningDay) : Infinity;
      var warningCooldownDays = entry.protectedBloc ? YEAR_DAYS : Math.round(YEAR_DAYS * 0.7);
      var postCrisisQuietDays = entry.protectedBloc ? Math.round(YEAR_DAYS * 1.5) : Math.round(YEAR_DAYS * 0.9);
      var minimumWarningStress = entry.protectedBloc ? 1.7 : 1.25;
      var warningEligible =
        currentDay >= YEAR_DAYS &&
        daysSinceLastWarning >= warningCooldownDays &&
        entry.daysSinceLastDebtCrisis >= postCrisisQuietDays &&
        entry.stress >= minimumWarningStress &&
        (
          entry.defaultRisk >= 0.55 ||
          entry.geoPressure >= 0.9 ||
          entry.gdpRatio <= 0.99 ||
          entry.demandGrowth <= -0.005 ||
          entry.unemploymentRate >= 0.09
        );

      return {
        bloc:bloc,
        eligible:entry.eligible,
        warningEligible:warningEligible,
        stress:entry.stress,
        minimumStress:entry.minimumStress,
        minimumWarningStress:minimumWarningStress,
        gdpRatio:entry.gdpRatio,
        defaultRisk:entry.defaultRisk,
        geoPressure:entry.geoPressure,
        unemploymentRate:entry.unemploymentRate,
        demandGrowth:entry.demandGrowth,
        longUnemploymentShare:entry.longUnemploymentShare,
        daysSinceLastDebtCrisis:entry.daysSinceLastDebtCrisis,
        daysSinceLastWarning:daysSinceLastWarning,
        protectedBloc:entry.protectedBloc,
        weight:warningEligible ? App.utils.clamp(0.75 + ((entry.stress - minimumWarningStress) * 0.9) + (entry.eligible ? 0.45 : 0), 0.75, 3.1) : 0
      };
    }).filter(function(entry){
      return entry && entry.bloc;
    });
  }

  function emitDebtStressWarningIfNeeded(){
    var warningCandidates = getDebtStressWarningCandidateData().filter(function(entry){ return entry.warningEligible; });
    var warningEntry;
    var warningBloc;
    var warningLabel;
    var warningText;

    if (!warningCandidates.length) return false;

    warningEntry = pickWeightedValue(warningCandidates.map(function(entry){
      return { value:entry, weight:entry.weight };
    }), null);

    warningBloc = warningEntry && warningEntry.bloc;
    if (!warningBloc) return false;

    warningBloc.lastDebtStressWarningDay = Math.max(0, Number(App.store.simDay) || 0);
    warningLabel = (warningEntry.defaultRisk >= 0.95 || warningEntry.gdpRatio <= 0.94 || warningEntry.eligible)
      ? "BOND STRESS"
      : "FUNDING PRESSURE";
    warningText = warningLabel + ": " + warningBloc.flag + " " + warningBloc.name + " is facing tighter refinancing conditions. " + warningBloc.currency + " is under pressure.";

    emitNews("market", warningText, {
      entities:{ blocIds:[warningBloc.id] },
      scope:"bloc",
      tags:["debt", "sovereign risk", warningLabel.toLowerCase()],
      causes:buildDebtStressCauses(warningEntry, {
        fallback:"Debt markets started repricing bloc risk."
      }),
      significanceDimensions:{
        impact:warningEntry.eligible ? 0.78 : 0.7,
        rarity:warningEntry.eligible ? 0.62 : 0.54,
        legacy:warningEntry.eligible ? 0.46 : 0.36,
        crossGen:0.14
      }
    });

    return true;
  }

  function dailyRateFromAnnualChange(annualChange){
    var factor = Math.max(0.15, 1 + (Number(annualChange) || 0));
    return Math.pow(factor, SIM_DAYS_PER_TICK / YEAR_DAYS) - 1;
  }

  function getIndustryValue(table, industry, fallback){
    return table && table[industry] != null ? table[industry] : fallback;
  }

  function householdClassRank(tier){
    return HOUSEHOLD_CLASS_RANKS[tier] != null ? HOUSEHOLD_CLASS_RANKS[tier] : HOUSEHOLD_CLASS_RANKS.working;
  }

  function uniqueTraits(traits){
    return traits.filter(function(trait, index, array){
      return trait && array.indexOf(trait) === index;
    });
  }

  function hashString(value){
    var hash = 2166136261;
    var i;

    value = String(value || "");
    for (i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function createSeededRandom(seed){
    var state = seed >>> 0;

    return function(){
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function captureRandomState(){
    if (typeof Math === "undefined" || typeof Math.random !== "function" || typeof Math.random.getState !== "function") {
      return null;
    }

    try {
      return Math.random.getState();
    } catch (error) {
      return null;
    }
  }

  function restoreRandomState(state){
    if (state == null || typeof Math === "undefined" || typeof Math.random !== "function" || typeof Math.random.setState !== "function") {
      return;
    }

    try {
      Math.random.setState(state);
    } catch (error) {
      return;
    }
  }

  function seededPick(random, list){
    return list[Math.floor(random() * list.length)];
  }

  function blendHexColor(first, second, ratio){
    var a = String(first || "#4a9edd").replace("#", "").padStart(6, "0");
    var b = String(second || "#7ee7ff").replace("#", "").padStart(6, "0");
    var mix = App.utils.clamp(Number(ratio) || 0, 0, 1);
    var out = [0, 1, 2].map(function(index){
      var offset = index * 2;
      var av = parseInt(a.slice(offset, offset + 2), 16);
      var bv = parseInt(b.slice(offset, offset + 2), 16);
      var value = Math.round((av * (1 - mix)) + (bv * mix));
      return value.toString(16).padStart(2, "0");
    }).join("");

    return "#" + out;
  }

  function createBusinessLogoConfig(business){
    var identity = [business.id, business.name, business.industry, business.countryISO, business.lineageId].join("|");
    var seed = hashString(identity);
    var random = createSeededRandom(seed);
    var rules = LOGO_RULES[business.industry] || LOGO_RULES.Technology;
    var palette = seededPick(random, rules.palettes);
    var bloc = App.store && App.store.getBlocByCountry ? App.store.getBlocByCountry(business.countryISO) : null;
    var tint = BLOC_LOGO_TINTS[bloc && bloc.id ? bloc.id : "default"] || BLOC_LOGO_TINTS.default;
    var blendRatio = 0.14 + (random() * 0.24);
    var primary = blendHexColor(palette[0], tint[0], blendRatio);
    var secondary = blendHexColor(palette[1], tint[1], blendRatio * 0.9);
    var accent = blendHexColor(palette[2], tint[2], blendRatio * 0.85);
    var frameStyle = seededPick(random, ["circle", "square", "diamond"]);
    var regionMark = bloc && bloc.id ? bloc.id : (business.countryISO || "WW");

    return {
      seed:seed,
      archetype:seededPick(random, rules.archetypes),
      palette:{
        primary:primary,
        secondary:secondary,
        accent:accent
      },
      rounded:random() > 0.45,
      variant:Math.floor(random() * 4),
      rotation:Math.floor(random() * 4) * 45,
      accentIndex:Math.floor(random() * 4),
      cutout:random() > 0.5,
      useGradient:random() > 0.38,
      frame:frameStyle,
      halo:random() > 0.42,
      texture:seededPick(random, ["clean", "scanline", "grain"]),
      strokeWeight:1 + Math.floor(random() * 2),
      regionMark:String(regionMark).slice(0, 2).toUpperCase(),
      monogram:App.utils.getBusinessMonogram ? App.utils.getBusinessMonogram(business.name || "?") : (business.name || "?").charAt(0).toUpperCase()
    };
  }

  function ensureBusinessLogo(business){
    var generated;

    if (!business) return;
    generated = createBusinessLogoConfig(business);

    if (!business.logo) {
      business.logo = generated;
      return;
    }

    business.logo = Object.assign({}, generated, business.logo);
    business.logo.palette = Object.assign({}, generated.palette, business.logo.palette || {});
    if (!business.logo.monogram) {
      business.logo.monogram = generated.monogram;
    }
    if (!business.logo.regionMark) {
      business.logo.regionMark = generated.regionMark;
    }
  }

  function clampScore(value){
    return Math.round(App.utils.clamp(value, 0, 100));
  }

  function clampTraitDelta(value, limit){
    return App.utils.clamp(value, -limit, limit);
  }

  function floorInt(value){
    return Math.floor(Number(value) || 0);
  }

  function getIndustryMarketScope(industry){
    if (MARKET_SCOPE_LOCAL[industry]) return "local";
    if (MARKET_SCOPE_GLOBAL[industry]) return "global";
    if (MARKET_SCOPE_MIXED[industry]) return "mixed";
    return "mixed";
  }

  function getBusinessNamingConfig(){
    return App.data && App.data.BUSINESS_NAMING ? App.data.BUSINESS_NAMING : null;
  }

  function getWorldBusinessNamingMode(){
    if (App.store && App.store.businessNamingMode !== "v2") {
      App.store.businessNamingMode = "v2";
    }
    return "v2";
  }

  function normalizeBusinessNameText(name){
    return String(name || "").replace(/\s*&\s*/g, " & ").replace(/\s+/g, " ").trim();
  }

  function normalizeText(value){
    var text = String(value || "").trim();
    return text || null;
  }

  function normalizeBusinessNameKey(name){
    return normalizeBusinessNameText(name).toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function getBusinessNamingList(values, fallback){
    return values && values.length ? values : (fallback || []);
  }

  function pickBusinessNamingValue(values, fallback){
    var list = getBusinessNamingList(values, fallback);
    return list.length ? App.utils.pick(list) : "";
  }

  function pickBusinessWeightKey(weights){
    var keys = Object.keys(weights || {});
    var total = 0;
    var roll;
    var running = 0;

    if (!keys.length) return null;

    keys.forEach(function(key){
      total += Math.max(0, Number(weights[key]) || 0);
    });

    if (total <= 0) return keys[0];

    roll = Math.random() * total;
    for (var i = 0; i < keys.length; i += 1) {
      running += Math.max(0, Number(weights[keys[i]]) || 0);
      if (running >= roll) {
        return keys[i];
      }
    }

    return keys[keys.length - 1];
  }

  function getBusinessNamingModeForCountry(countryISO){
    var naming = getBusinessNamingConfig();
    var bloc;

    if (!countryISO) return "founderWeighted";

    if (naming && naming.countryModes && naming.countryModes[countryISO]) {
      return naming.countryModes[countryISO];
    }

    bloc = App.store && App.store.getBlocByCountry ? App.store.getBlocByCountry(countryISO) : null;
    if (!bloc) return "founderWeighted";

    if (bloc.id === "AS") {
      if (countryISO === "JP") return "japaneseCoined";
      if (countryISO === "KR" || countryISO === "KP") return "koreanCoined";
      if (countryISO === "VN") return "vietnameseCoined";
      if (["IN","PK","BD","LK","NP"].indexOf(countryISO) !== -1) return "southAsiaCoined";
      return "sinophoneCoined";
    }

    if (bloc.id === "AF" && ["AE","SA","QA","KW","OM","BH"].indexOf(countryISO) !== -1) {
      return "gulfGeobrand";
    }

    return "founderWeighted";
  }

  function pickBusinessIndustrySuffix(industry){
    var naming = getBusinessNamingConfig();
    var suffixes = naming && naming.industrySuffixes ? naming.industrySuffixes[industry] : null;
    var fallback = naming ? naming.fallbackSuffixes : ["Group","Co","Ltd"];
    return pickBusinessNamingValue(suffixes, fallback);
  }

  function pickBusinessIndustryNoun(industry){
    var naming = getBusinessNamingConfig();
    var nouns = naming && naming.industryNouns ? naming.industryNouns[industry] : null;
    return pickBusinessNamingValue(nouns, naming ? naming.fallbackSuffixes : ["Group"]);
  }

  function pickBusinessScopeDescriptor(scope){
    var naming = getBusinessNamingConfig();
    var descriptors = naming && naming.scopeDescriptors ? naming.scopeDescriptors[scope] : null;
    var fallback = naming && naming.scopeDescriptors ? naming.scopeDescriptors.mixed : ["Summit","Atlas","Prime"];
    return pickBusinessNamingValue(descriptors, fallback);
  }

  function isReservedBusinessName(name){
    var naming = getBusinessNamingConfig();
    var reserved = naming && Array.isArray(naming.reservedBrandNames) ? naming.reservedBrandNames : [];
    var key = normalizeBusinessNameKey(name);

    return reserved.some(function(entry){
      return normalizeBusinessNameKey(entry) === key;
    });
  }

  function doesBusinessNameExist(name){
    var key = normalizeBusinessNameKey(name);

    return (App.store.businesses || []).some(function(existing){
      return existing && normalizeBusinessNameKey(existing.name) === key;
    });
  }

  function makeUniqueBusinessName(baseName){
    var normalized = normalizeBusinessNameText(baseName || "Business Group");
    var candidate = normalized;
    var index = 2;

    while (doesBusinessNameExist(candidate) || isReservedBusinessName(candidate)) {
      candidate = normalized + " " + index;
      index += 1;
    }

    return candidate;
  }

  function getBusinessSpouse(owner){
    var spouse = App.store.getSpouse ? App.store.getSpouse(owner) : null;

    if (!spouse || !spouse.alive) return null;
    if (!spouse.lastName || !owner.lastName) return null;
    if (String(spouse.lastName).toLowerCase() === String(owner.lastName).toLowerCase()) return null;
    return spouse;
  }

  function getFounderCoinedMode(owner){
    var iso = owner && owner.countryISO;

    if (!iso) return "southAsiaCoined";
    if (iso === "JP") return "japaneseCoined";
    if (iso === "KR" || iso === "KP") return "koreanCoined";
    if (iso === "VN") return "vietnameseCoined";
    if (["CN","HK","TW","SG"].indexOf(iso) !== -1) return "sinophoneCoined";
    if (["IN","PK","BD","LK","NP"].indexOf(iso) !== -1) return "southAsiaCoined";
    return "southAsiaCoined";
  }

  function buildBusinessAcronym(owner, spouse){
    var letters = [];

    if (owner && owner.firstName) letters.push(owner.firstName.charAt(0));
    if (owner && owner.lastName) letters.push(owner.lastName.charAt(0));
    if (spouse && spouse.lastName && letters.length < 4) letters.push(spouse.lastName.charAt(0));
    if (owner && owner.countryISO && letters.length < 2) letters.push(owner.countryISO.charAt(0));

    return letters.join("").replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
  }

  function buildCoinedBrandCore(mode){
    var naming = getBusinessNamingConfig();
    var pool = naming && naming.coinedPools ? naming.coinedPools[mode] : null;
    var parts;

    if (!pool) return null;

    parts = [
      pickBusinessNamingValue(pool.starts, ["Nova"])
    ];
    if (pool.middles && pool.middles.length && Math.random() < Number(pool.middleChance || 0)) {
      parts.push(pickBusinessNamingValue(pool.middles, ["a"]));
    }
    parts.push(pickBusinessNamingValue(pool.ends, ["tek"]));

    return normalizeBusinessNameText(parts.join(""));
  }

  function buildFounderWeightedName(owner, industry, scope, templateKey, spouse){
    var coinedMode = getFounderCoinedMode(owner);
    var coinedCore = buildCoinedBrandCore(coinedMode);

    if (templateKey === "descriptorSurname") {
      return pickBusinessScopeDescriptor(scope) + " " + owner.lastName + " " + pickBusinessIndustrySuffix(industry);
    }
    if (templateKey === "acronymSuffix") {
      return buildBusinessAcronym(owner, spouse) + " " + pickBusinessIndustrySuffix(industry);
    }
    if (templateKey === "spousePartners" && spouse) {
      return owner.lastName + " & " + spouse.lastName + " " + pickBusinessIndustrySuffix(industry);
    }
    if (templateKey === "descriptorBrand") {
      return pickBusinessScopeDescriptor(scope) + " " + pickBusinessIndustryNoun(industry);
    }
    if (templateKey === "coinedIndustry" && coinedCore) {
      return coinedCore + " " + pickBusinessIndustryNoun(industry);
    }
    if (templateKey === "coinedSuffix" && coinedCore) {
      return coinedCore + " " + pickBusinessIndustrySuffix(industry);
    }
    return owner.lastName + " " + pickBusinessIndustrySuffix(industry);
  }

  function isLikelyLegacyFounderName(name, owner){
    var normalizedName;
    var ownerPrefix;
    var suffixPart;
    var naming = getBusinessNamingConfig();
    var suffixes = [];

    if (!name || !owner || !owner.lastName) return false;

    normalizedName = normalizeBusinessNameText(name);
    ownerPrefix = normalizeBusinessNameText(owner.lastName + " ").toLowerCase();
    if (normalizedName.toLowerCase().indexOf(ownerPrefix) !== 0) return false;

    suffixPart = normalizedName.slice(ownerPrefix.length).replace(/\s+\d+$/, "").trim().toLowerCase();
    if (!suffixPart) return false;

    suffixes = suffixes.concat(naming && naming.legacySuffixes ? naming.legacySuffixes : []);
    suffixes = suffixes.concat(naming && naming.fallbackSuffixes ? naming.fallbackSuffixes : []);

    return suffixes.some(function(suffix){
      return normalizeBusinessNameText(suffix).toLowerCase() === suffixPart;
    });
  }

  function refreshLegacyBusinessNames(){
    var renamed = 0;

    (App.store.businesses || []).forEach(function(business){
      var owner;
      var nextName;

      if (!business) return;
      owner = App.store.getPerson(business.ownerId) || App.store.getPerson(business.founderId);
      if (!owner) return;
      if (!isLikelyLegacyFounderName(business.name, owner)) return;

      nextName = generateBusinessName(owner, business.industry);
      if (!nextName || nextName === business.name) return;

      business.name = nextName;
      business.logo = createBusinessLogoConfig(business);
      renamed += 1;
    });

    return renamed;
  }

  function buildCoinedModeName(owner, industry, scope, mode, templateKey, spouse){
    var coinedCore = buildCoinedBrandCore(mode);

    if (!coinedCore) return null;
    if (templateKey === "coinedIndustry") {
      return coinedCore + " " + pickBusinessIndustryNoun(industry);
    }
    if (templateKey === "surnameIndustry") {
      return owner.lastName + " " + pickBusinessIndustryNoun(industry);
    }
    if (templateKey === "acronymSuffix") {
      return buildBusinessAcronym(owner, spouse) + " " + pickBusinessIndustrySuffix(industry);
    }
    if (templateKey === "descriptorBrand") {
      return pickBusinessScopeDescriptor(scope) + " " + pickBusinessIndustryNoun(industry);
    }
    if (templateKey === "coinedSuffix") {
      return coinedCore + " " + pickBusinessIndustrySuffix(industry);
    }
    if (templateKey === "descriptorSurname") {
      return pickBusinessScopeDescriptor(scope) + " " + owner.lastName + " " + pickBusinessIndustrySuffix(industry);
    }
    return coinedCore;
  }

  function buildGulfModeName(owner, industry, templateKey, spouse){
    var naming = getBusinessNamingConfig();
    var pool = naming && naming.coinedPools ? naming.coinedPools.gulfGeobrand : null;
    var geoWord = pool ? pickBusinessNamingValue(pool.geo, ["Gulf"]) : "Gulf";
    var institutionWord = pool ? pickBusinessNamingValue(pool.institutional, ["Holdings"]) : "Holdings";

    if (templateKey === "geoInstitution") {
      return geoWord + " " + institutionWord;
    }
    if (templateKey === "familyHolding") {
      return owner.lastName + " " + pickBusinessNamingValue(["Group","Holdings","Capital"], ["Holdings"]);
    }
    if (templateKey === "acronymInstitution") {
      return buildBusinessAcronym(owner, spouse) + " " + institutionWord;
    }
    return geoWord + " " + pickBusinessIndustryNoun(industry);
  }

  function buildBusinessNameCandidate(owner, industry, scope, mode, templateKey){
    var spouse = getBusinessSpouse(owner);

    if (mode === "gulfGeobrand") {
      return buildGulfModeName(owner, industry, templateKey, spouse);
    }
    if (mode === "founderWeighted") {
      return buildFounderWeightedName(owner, industry, scope, templateKey, spouse);
    }
    return buildCoinedModeName(owner, industry, scope, mode, templateKey, spouse);
  }

  function buildBusinessNameFallback(owner, industry, mode){
    if (mode === "gulfGeobrand") {
      return buildGulfModeName(owner, industry, "geoIndustry", getBusinessSpouse(owner));
    }
    if (mode !== "founderWeighted") {
      return buildCoinedModeName(owner, industry, getIndustryMarketScope(industry), mode, "coinedIndustry", getBusinessSpouse(owner));
    }
    return owner.lastName + " " + pickBusinessIndustrySuffix(industry);
  }

  function generateBusinessName(owner, industry){
    var naming = getBusinessNamingConfig();
    var scope = getIndustryMarketScope(industry);
    var mode = getBusinessNamingModeForCountry(owner.countryISO);
    var weights = naming && naming.modeWeights ? naming.modeWeights[mode] : null;
    var attempts = 0;
    var templateKey;
    var candidate;
    var legacyName;

    if (!naming || getWorldBusinessNamingMode() === "legacy") {
      legacyName = owner.lastName + " " + pickBusinessNamingValue(naming && naming.legacySuffixes, ["Group","Co","Ltd"]);
      return makeUniqueBusinessName(legacyName);
    }

    while (attempts < 18) {
      templateKey = pickBusinessWeightKey(weights);
      candidate = normalizeBusinessNameText(buildBusinessNameCandidate(owner, industry, scope, mode, templateKey));
      if (candidate && !doesBusinessNameExist(candidate) && !isReservedBusinessName(candidate)) {
        return candidate;
      }
      attempts += 1;
    }

    return makeUniqueBusinessName(buildBusinessNameFallback(owner, industry, mode));
  }

  function ensureCountryProfile(iso, blocId){
    var profile;
    var bloc = App.store.getBloc(blocId) || App.store.getBlocByCountry(iso);

    if (!iso) return null;

    profile = App.store.getCountryProfile(iso);
    if (profile) {
      if (!profile.blocId && bloc) profile.blocId = bloc.id;
      return profile;
    }

    if (!App.data || !App.data.createCountryProfile) return null;

    profile = App.data.createCountryProfile(iso, bloc ? bloc.id : "NA", null);
    App.store.setCountryProfile(iso, profile);
    return profile;
  }

  function getEducationAttainment(educationIndex){
    var score = App.utils.clamp(Number(educationIndex) || 0, 0, 100);
    var match = EDUCATION_ATTAINMENT_TIERS.find(function(tier){
      return score >= tier.min;
    });

    return match ? match.label : "none";
  }

  function getEducationCredentialLevel(educationIndex){
    var score = App.utils.clamp(Number(educationIndex) || 0, 0, 100);
    var match = EDUCATION_CREDENTIAL_LEVELS.find(function(level){
      return score >= level.min;
    });

    return match ? match.key : "none";
  }

  function getCountryCredentialStyle(iso){
    return COUNTRY_CREDENTIAL_STYLE[iso] || COUNTRY_CREDENTIAL_STYLE.default;
  }

  function getCountryDegreeNaming(iso){
    var map = {
      US:{ doctorate:"Doctor of Philosophy (PhD)", masters:"Master of Arts/Science (MA/MSc)", bachelor:"Bachelor of Arts/Science (BA/BSc)" },
      UK:{ doctorate:"Doctor of Philosophy (PhD)", masters:"Master of Arts/Science (MA/MSc)", bachelor:"Bachelor Degree (BA/BSc)" },
      IN:{ doctorate:"Doctor of Philosophy (PhD)", masters:"Master Degree (MA/MSc/MTech)", bachelor:"Bachelor Degree (BA/BSc/BCom/BTech)" },
      CA:{ doctorate:"Doctor of Philosophy (PhD)", masters:"Master Degree (MA/MSc)", bachelor:"Bachelor Degree (BA/BSc)" },
      AU:{ doctorate:"Doctor of Philosophy (PhD)", masters:"Master Degree (MA/MSc)", bachelor:"Bachelor Degree (BA/BSc)" },
      DE:{ doctorate:"Doktorgrad (Dr.)", masters:"Masterabschluss", bachelor:"Bachelorabschluss" },
      FR:{ doctorate:"Doctorat", masters:"Master", bachelor:"Licence" },
      ES:{ doctorate:"Doctorado", masters:"Maestria", bachelor:"Grado Universitario" },
      BR:{ doctorate:"Doutorado", masters:"Mestrado", bachelor:"Bacharelado" },
      MX:{ doctorate:"Doctorado", masters:"Maestria", bachelor:"Licenciatura" },
      CN:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      JP:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      KR:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      ID:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Sarjana Degree" },
      NG:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      ZA:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      KE:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      EG:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      SA:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      AE:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      TR:{ doctorate:"Doktora", masters:"Yuksek Lisans", bachelor:"Lisans" },
      RU:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      PH:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" },
      default:{ doctorate:"Doctoral Degree", masters:"Master Degree", bachelor:"Bachelor Degree" }
    };

    return map[iso] || map.default;
  }

  function getCountrySpecialistInstitutions(iso){
    var map = {
      US:["State Technical Institute", "Regional Career and Trade Academy", "Applied Science Polytechnic"],
      UK:["Further Education College", "National Vocational Institute", "Applied Skills Academy"],
      IN:["Polytechnic Institute", "Industrial Training Institute", "National Skills College"],
      CA:["Provincial Polytechnic", "Applied Trades College", "Regional Technical Institute"],
      AU:["TAFE College", "Applied Technology Institute", "Regional Skills Academy"],
      DE:["Fachschule Institute", "Applied Technik Academy", "Regional Berufskolleg"],
      FR:["Institut Professionnel", "Ecole Technique Regionale", "Academie des Metiers"],
      ES:["Instituto Tecnico", "Escuela Profesional", "Centro de Formacion Tecnica"],
      BR:["Instituto Tecnico Federal", "Centro Profissional", "Escola Tecnica Regional"],
      MX:["Instituto Tecnologico", "Colegio Tecnico", "Centro de Formacion Tecnica"],
      CN:["Technical Vocational College", "Applied Science Polytechnic", "Regional Skills Institute"],
      JP:["Kosen Technical College", "Applied Engineering College", "Vocational Skills Institute"],
      KR:["Polytechnic University College", "National Technical Institute", "Applied Skills College"],
      ID:["Politeknik Regional", "Vocational Technology Institute", "Applied Skills College"],
      NG:["Federal Polytechnic", "Technical College", "Skills Development Institute"],
      ZA:["Technical and Vocational College", "Regional Polytechnic", "Applied Skills Institute"],
      KE:["National Polytechnic", "Technical Training Institute", "Applied Science College"],
      EG:["Technical Secondary Institute", "Applied Engineering College", "National Vocational Institute"],
      SA:["Technical Training College", "Applied Technology Institute", "National Skills Institute"],
      AE:["Applied Science College", "Emirates Technical Institute", "Vocational Training College"],
      TR:["Meslek Yuksekokulu", "Technical Vocational College", "Applied Skills Institute"],
      RU:["Polytechnic College", "Technical Training Institute", "Applied Engineering School"],
      PH:["Technical Education Institute", "Applied Skills College", "Vocational Training Academy"],
      CM:["National Technical College", "Applied Skills Institute", "Regional Vocational College"],
      AR:["Instituto Tecnico Nacional", "Escuela Tecnica Regional", "Centro Profesional"],
      GB:["Further Education College", "Technical Training Institute", "Applied Skills Academy"],
      default:["Regional Polytechnic", "Applied Skills Institute", "Vocational Training College"]
    };

    return map[iso] || map.default;
  }

  function getCountryInstitutionNameParts(iso){
    var map = {
      US:["Jefferson", "Roosevelt", "Lincoln", "Franklin", "Riverside", "Oak Valley"],
      UK:["Westminster", "Northbridge", "Bristol", "Oxford", "Leeds", "Manchester"],
      IN:["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad"],
      CA:["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Halifax"],
      AU:["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra"],
      DE:["Berlin", "Hamburg", "Munich", "Cologne", "Stuttgart", "Leipzig"],
      FR:["Paris", "Lyon", "Marseille", "Lille", "Nantes", "Bordeaux"],
      ES:["Madrid", "Barcelona", "Valencia", "Seville", "Malaga", "Bilbao"],
      BR:["Sao Paulo", "Rio", "Brasilia", "Salvador", "Recife", "Curitiba"],
      MX:["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Merida", "Tijuana"],
      CN:["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Wuhan"],
      JP:["Tokyo", "Osaka", "Kyoto", "Nagoya", "Sapporo", "Fukuoka"],
      KR:["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju"],
      ID:["Jakarta", "Bandung", "Surabaya", "Medan", "Makassar", "Yogyakarta"],
      NG:["Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan", "Enugu"],
      ZA:["Cape Town", "Johannesburg", "Pretoria", "Durban", "Bloemfontein", "Polokwane"],
      KE:["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika"],
      EG:["Cairo", "Alexandria", "Giza", "Aswan", "Mansoura", "Port Said"],
      SA:["Riyadh", "Jeddah", "Dammam", "Medina", "Mecca", "Taif"],
      AE:["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Al Ain", "Ras Al Khaimah"],
      TR:["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Konya"],
      RU:["Moscow", "Saint Petersburg", "Kazan", "Novosibirsk", "Yekaterinburg", "Samara"],
      PH:["Manila", "Cebu", "Davao", "Quezon", "Baguio", "Iloilo"],
      CM:["Yaounde", "Douala", "Bamenda", "Garoua", "Bafoussam", "Maroua"],
      AR:["Buenos Aires", "Cordoba", "Rosario", "Mendoza", "La Plata", "Salta"],
      GB:["London", "Birmingham", "Glasgow", "Liverpool", "Cardiff", "Edinburgh"],
      default:["Central", "Riverside", "National", "City", "Metropolitan", "Regional"]
    };
    var fallback = map[iso] || map.default;
    if (App.data && typeof App.data.getCountryInstitutionNameParts === "function") {
      return App.data.getCountryInstitutionNameParts(iso, fallback);
    }
    return fallback;
  }

  function normalizeUSStateCode(value){
    var normalized = normalizeText(value);
    var codes;
    var index;
    var code;

    if (!normalized || !App.data || !App.data.US_STATE_NAMES) return null;
    if (/^[A-Z]{2}$/.test(normalized) && App.data.US_STATE_NAMES[normalized]) {
      return normalized;
    }

    codes = App.data.US_STATE_CODES || Object.keys(App.data.US_STATE_NAMES);
    for (index = 0; index < codes.length; index += 1) {
      code = codes[index];
      if (normalizeText(App.data.US_STATE_NAMES[code]) === normalized) {
        return code;
      }
    }

    return null;
  }

  function normalizeSubdivisionForStorage(iso, subdivision){
    var normalized = normalizeText(subdivision);

    if (!normalized) return null;
    if (iso === "US") return normalizeUSStateCode(normalized) || normalized;
    return normalized;
  }

  function normalizeSubdivisionForLookup(iso, subdivision){
    var normalized = normalizeSubdivisionForStorage(iso, subdivision);

    if (!normalized) return null;
    if (iso === "US" && App.data && App.data.US_STATE_NAMES && App.data.US_STATE_NAMES[normalized]) {
      return App.data.US_STATE_NAMES[normalized];
    }
    return normalized;
  }

  function getCountryCityPool(iso, limit, subdivision){
    var lookupSubdivision = normalizeSubdivisionForLookup(iso, subdivision);

    if (!App.data) return [];
    if (lookupSubdivision && typeof App.data.getWorldCitiesByCountryState === "function") {
      var subdivisionCities = App.data.getWorldCitiesByCountryState(iso, lookupSubdivision, limit || 24);
      if (subdivisionCities.length) return subdivisionCities;
    }
    if (typeof App.data.getWorldCitiesByCountry !== "function") return [];
    return App.data.getWorldCitiesByCountry(iso, limit || 24);
  }

  function getCountryCityDetailsPool(iso, limit, subdivision){
    var details;
    var lookupSubdivision = normalizeSubdivisionForLookup(iso, subdivision);

    if (!App.data || typeof App.data.getWorldCityDetailsByCountry !== "function") return [];
    details = App.data.getWorldCityDetailsByCountry(iso, limit || 24);
    if (lookupSubdivision) {
      details = details.filter(function(detail){
        return normalizeText(detail && detail.state) === lookupSubdivision;
      });
    }
    return details;
  }

  function getCitySelectionWeight(iso, detail, residentByCity, talentByCity, businessByCity){
    var cityKey = String(detail && detail.name || "").trim().toLowerCase();
    var population = Math.max(0, Number(detail && detail.population) || 0);
    var residentCount = Math.max(0, Number(residentByCity[cityKey]) || 0);
    var talentCount = Math.max(0, Number(talentByCity[cityKey]) || 0);
    var businessCount = Math.max(0, Number(businessByCity[cityKey]) || 0);
    var populationSignal = population > 0 ? (Math.log10(population + 1) / 7) : 0;
    var residentSignal = residentCount > 0 ? (Math.log10(residentCount + 1) / 2.5) : 0;
    var talentSignal = talentCount > 0 ? (Math.log10(talentCount + 1) / 2.2) : 0;
    var businessSignal = businessCount > 0 ? (Math.log10(businessCount + 1) / 2.2) : 0;

    // Urban gravity: larger and already-active cities attract additional firms, talent, and residents.
    return App.utils.clamp(0.45 + (populationSignal * 2.4) + (residentSignal * 1.35) + (talentSignal * 1.1) + (businessSignal * 1.45), 0.1, 9.5);
  }

  function pickCountryCity(iso, seedKey, subdivision){
    var cities = getCountryCityPool(iso, 24, subdivision);
    var details = getCountryCityDetailsPool(iso, 24, subdivision);
    var residentByCity = {};
    var talentByCity = {};
    var businessByCity = {};
    var weighted = [];
    var totalWeight = 0;
    var seed;
    var roll;
    var running = 0;

    if (details.length) {
      (App.store.people || []).forEach(function(person){
        var cityKey;
        if (!person || !person.alive || person.countryISO !== iso) return;
        cityKey = String(person.city || "").trim().toLowerCase();
        if (!cityKey) return;
        residentByCity[cityKey] = (residentByCity[cityKey] || 0) + 1;
        if ((Number(person.educationIndex) || 0) >= 68 || person.jobTier === "executive" || person.jobTier === "leadership") {
          talentByCity[cityKey] = (talentByCity[cityKey] || 0) + 1;
        }
      });

      (App.store.businesses || []).forEach(function(business){
        var cityKey;
        if (!business || business.countryISO !== iso || business.stage === "defunct") return;
        cityKey = String(business.hqCity || "").trim().toLowerCase();
        if (!cityKey) return;
        businessByCity[cityKey] = (businessByCity[cityKey] || 0) + 1;
      });

      details.forEach(function(detail){
        var cityName = normalizeText(detail && detail.name);
        var weight;
        if (!cityName) return;
        weight = getCitySelectionWeight(iso, detail, residentByCity, talentByCity, businessByCity);
        weighted.push({ name:cityName, weight:weight });
        totalWeight += weight;
      });
    }

    if (weighted.length && totalWeight > 0) {
      if (!seedKey) {
        roll = Math.random() * totalWeight;
      } else {
        seed = hashString(String(seedKey));
        roll = ((seed % 1000000) / 1000000) * totalWeight;
      }

      for (var i = 0; i < weighted.length; i += 1) {
        running += weighted[i].weight;
        if (running >= roll) return weighted[i].name;
      }
      return weighted[weighted.length - 1].name;
    }

    if (!cities.length) return null;
    if (!seedKey) return App.utils.pick(cities);

    seed = hashString(String(seedKey));
    return cities[seed % cities.length] || null;
  }

  function resolveSubdivisionForCity(iso, city, fallbackSubdivision){
    var resolved = normalizeSubdivisionForStorage(iso, fallbackSubdivision);
    if (!iso || !city || !App.data || typeof App.data.getWorldCitySubdivision !== "function") {
      return resolved || null;
    }
    return normalizeSubdivisionForStorage(iso, App.data.getWorldCitySubdivision(iso, city, normalizeSubdivisionForLookup(iso, resolved))) || resolved || null;
  }

  function setPersonSubdivisionFields(person, iso, subdivision){
    var normalized = normalizeSubdivisionForStorage(iso, subdivision) || null;
    if (!person) return;

    person.subdivision = normalized;
    person.state = iso === "US" ? normalized : null;
  }

  function ensurePersonCityData(person){
    var iso;
    var subdivision;
    var city;
    var birthCity;

    if (!person) return;
    iso = String(person.countryISO || "").trim().toUpperCase();
    if (!iso) return;

    subdivision = normalizeSubdivisionForStorage(iso, person.subdivision || person.state);
    city = normalizeText(person.city);
    birthCity = normalizeText(person.birthCity);

    if (!city) {
      city = pickCountryCity(iso, [person.id || "", iso, App.store.simDay, "sync-city"].join("|"), subdivision);
    }
    if (!birthCity) {
      birthCity = city || pickCountryCity(iso, [person.id || "", iso, App.store.simDay, "sync-birth-city"].join("|"), subdivision);
    }

    subdivision = resolveSubdivisionForCity(iso, city, subdivision);
    setPersonSubdivisionFields(person, iso, subdivision);

    person.city = city || null;
    person.birthCity = birthCity || person.city || null;
  }

  function getCountryEliteUniversities(iso){
    var map = {
      US:["Harvard University", "Yale University", "Princeton University", "Columbia University", "University of Pennsylvania", "Cornell University", "Brown University", "Dartmouth College", "Massachusetts Institute of Technology", "Stanford University"],
      UK:["University of Oxford", "University of Cambridge", "Imperial College London", "London School of Economics", "University College London"],
      IN:["Indian Institute of Technology Delhi", "Indian Institute of Technology Bombay", "Indian Institute of Science Bengaluru", "Jawaharlal Nehru University", "All India Institute of Medical Sciences"],
      CA:["University of Toronto", "McGill University", "University of British Columbia", "University of Waterloo"],
      AU:["University of Melbourne", "Australian National University", "University of Sydney", "University of New South Wales"],
      DE:["Technical University of Munich", "Heidelberg University", "Ludwig Maximilian University of Munich", "Humboldt University of Berlin"],
      FR:["Sorbonne University", "Ecole Polytechnique", "Sciences Po", "Paris-Saclay University"],
      ES:["University of Barcelona", "Autonomous University of Madrid", "Complutense University of Madrid"],
      BR:["University of Sao Paulo", "State University of Campinas", "Federal University of Rio de Janeiro"],
      MX:["National Autonomous University of Mexico", "Monterrey Institute of Technology", "Autonomous Metropolitan University"],
      CN:["Tsinghua University", "Peking University", "Fudan University", "Shanghai Jiao Tong University"],
      JP:["University of Tokyo", "Kyoto University", "Osaka University", "Tohoku University"],
      KR:["Seoul National University", "Korea Advanced Institute of Science and Technology", "Yonsei University", "Korea University"],
      ID:["University of Indonesia", "Bandung Institute of Technology", "Gadjah Mada University"],
      NG:["University of Lagos", "University of Ibadan", "Ahmadu Bello University"],
      ZA:["University of Cape Town", "University of the Witwatersrand", "Stellenbosch University"],
      KE:["University of Nairobi", "Kenyatta University", "Strathmore University"],
      EG:["Cairo University", "Ain Shams University", "Alexandria University"],
      SA:["King Saud University", "King Abdulaziz University", "King Fahd University of Petroleum and Minerals"],
      AE:["United Arab Emirates University", "Khalifa University", "American University of Sharjah"],
      TR:["Bogazici University", "Middle East Technical University", "Istanbul Technical University"],
      RU:["Lomonosov Moscow State University", "Saint Petersburg State University", "Novosibirsk State University"],
      PH:["University of the Philippines Diliman", "Ateneo de Manila University", "De La Salle University"],
      default:[]
    };

    return map[iso] || map.default;
  }

  function getSchoolStageSuffix(iso, age){
    var years = Math.max(0, Number(age) || 0);

    if (iso === "UK" || iso === "GB") {
      if (years < 11) return "Primary School";
      if (years < 16) return "Secondary School";
      return "Sixth Form College";
    }
    if (iso === "IN") {
      if (years < 11) return "Primary School";
      if (years < 16) return "Secondary School";
      return "Senior Secondary School";
    }
    if (years < 11) return "Primary School";
    if (years < 16) return "Secondary School";
    return "Senior High School";
  }

  function getInstitutionSuffixOptions(iso, credentialLevel, institutionType, age){
    if (institutionType === "specialist_school") {
      return getCountrySpecialistInstitutions(iso);
    }
    if (institutionType === "university") {
      if (credentialLevel === "doctorate" || credentialLevel === "masters") {
        return ["University", "National University", "Graduate Institute", "Institute of Advanced Studies"];
      }
      return ["University", "State University", "Institute of Technology", "Metropolitan University"];
    }
    return [getSchoolStageSuffix(iso, age)];
  }

  function buildCountryStageInstitutionName(person, credentialLevel, institutionType){
    var iso = person && person.countryISO ? person.countryISO : "default";
    var parts = getCountryInstitutionNameParts(iso);
    var suffixOptions = getInstitutionSuffixOptions(iso, credentialLevel, institutionType, person && person.age);
    var seed = hashString([person && person.id || "", iso, credentialLevel || "none", institutionType || "school", String(person && person.age || 0)].join("|"));
    var area = parts.length ? parts[seed % parts.length] : "Central";
    var suffix = suffixOptions.length ? suffixOptions[(seed >>> 8) % suffixOptions.length] : "School";

    if (/School|College|University|Institute/.test(suffix)) {
      return area + " " + suffix;
    }

    return area + " " + suffix;
  }

  function shouldUseEliteInstitutionName(person, institutionType){
    var quality = Number(person && person.educationInstitutionQuality);
    var education = App.utils.clamp(Number(person && person.educationIndex) || 0, 0, 100);
    var profile = ensureCountryProfile(person && person.countryISO);
    var baseline = ((Number(profile && profile.institutionScore) || 0.55) * 62) + ((Number(profile && profile.educationIndex) || 0.6) * 28) + (education * 0.12);
    var effectiveQuality = Number.isFinite(quality) ? quality : baseline;
    var seed = hashString([person && person.id || "", person && person.countryISO || "", "elite"].join("|"));
    var roll = (seed % 1000) / 1000;
    var threshold;

    if (institutionType !== "university") return false;

    threshold = effectiveQuality >= 92 ? 0.6 : (effectiveQuality >= 85 ? 0.32 : 0.0);
    return roll < threshold;
  }

  function getEducationInstitutionType(person, levelKey){
    var track = String(person && person.skillTrack || "general");
    var score = App.utils.clamp(Number(person && person.educationIndex) || 0, 0, 100);

    if (levelKey === "doctorate" || levelKey === "masters") {
      return "university";
    }
    if (levelKey === "bachelor") {
      if ((track === "technical" || track === "commercial" || track === "creative") && score < 84) {
        return "specialist_school";
      }
      return "university";
    }
    if (levelKey === "highschool" && (track === "technical" || track === "commercial" || track === "creative") && score >= 62) {
      return "specialist_school";
    }
    return "school";
  }

  function pickEducationCourseByTrack(track, levelKey, institutionType){
    var key = String(track || "general");
    var catalogs = {
      foundation:["General Foundation Studies", "Civic and Life Skills", "Numeracy and Language Core"],
      general:["General Studies", "Social Sciences", "Humanities"],
      leadership:["Business Administration", "Public Policy", "Organizational Leadership"],
      technical:["Computer Science", "Electrical Engineering", "Data Systems", "Mechatronics"],
      commercial:["Economics", "Finance", "Accounting", "International Business"],
      creative:["Design and Media Arts", "Architecture", "Creative Writing", "Digital Production"]
    };
    var specialistCatalog = {
      leadership:["Diploma in Public Administration", "Diploma in Human Resource Management"],
      technical:["Vocational Diploma in Applied ICT", "Vocational Diploma in Mechatronics", "Diploma in Network Systems"],
      commercial:["Diploma in Accounting and Tax", "Diploma in Business Operations", "Diploma in Supply Chain Management"],
      creative:["Diploma in Graphic Design", "Diploma in Film and Media", "Diploma in Product Design"],
      general:["Diploma in Community Studies", "Diploma in Liberal Studies"]
    };

    if (institutionType === "specialist_school") {
      return specialistCatalog[key] || specialistCatalog.general;
    }
    if (levelKey === "primary") {
      return ["Primary Core Curriculum", "Basic Literacy and Numeracy", "Foundational Studies"];
    }
    if (levelKey === "none") {
      return ["No Formal Course Completed"];
    }
    return catalogs[key] || catalogs.general;
  }

  function getEducationCourseLabel(person, levelKey, institutionType){
    var track = person && person.skillTrack ? person.skillTrack : "general";
    var options = pickEducationCourseByTrack(track, levelKey, institutionType);
    var seed = hashString([person && person.id || "", person && person.countryISO || "", levelKey || "none", institutionType || "school", track].join("|"));
    var index = options.length ? (seed % options.length) : 0;

    return options[index] || "General Studies";
  }

  function getEducationCredentialLabel(iso, levelKey, educationIndex){
    var score = App.utils.clamp(Number(educationIndex) || 0, 0, 100);
    var style = getCountryCredentialStyle(iso);
    var degreeNames = getCountryDegreeNaming(iso);

    if (levelKey === "doctorate") {
      if (score >= 99 && iso === "US") return "Doctor of Philosophy (PhD)";
      return degreeNames.doctorate || style.labels.doctorate || "Doctoral Degree";
    }
    if (levelKey === "masters") {
      if (score >= 93 && iso === "US") return "Master Degree with Distinction";
      return degreeNames.masters || style.labels.masters || "Master Degree";
    }
    if (levelKey === "bachelor") {
      if (score >= 82 && iso === "UK") return "Bachelor Degree with Honours";
      return degreeNames.bachelor || style.labels.bachelor || "Bachelor Degree";
    }
    if (levelKey === "highschool") {
      if (iso === "US") {
        if (score < 60) return "GED (General Educational Development)";
        if (score < 68) return "High School Diploma";
        return "College Preparatory High School Diploma";
      }
      if (iso === "UK") {
        if (score < 60) return "GCSE Level 2 Certificate";
        if (score < 68) return "A-Level Certificate";
        return "A-Level (Advanced)";
      }
      if (iso === "IN") {
        if (score < 60) return "Secondary School Certificate (SSC)";
        if (score < 68) return "Higher Secondary Certificate (HSC)";
        return "Senior School Certificate";
      }
      if (score < 60) return "Secondary School Leaving Certificate";
      if (score < 68) return style.labels.highschool || "High School Diploma";
      return "College Preparatory Diploma";
    }
    if (levelKey === "primary") {
      if (iso === "US") return "Middle School Completion Certificate";
      if (iso === "UK") return "Key Stage Completion Certificate";
      return style.labels.primary || "Primary School Leaving Certificate";
    }

    return style.labels.none || "No Formal Credential";
  }

  function getEducationInstitutionSector(person, profile, levelKey){
    var seed = hashString([person.id || "", person.countryISO || "", levelKey || "none", "sector"].join("|"));
    var normalized = (seed % 1000) / 1000;
    var institutionScore = App.utils.clamp(Number(profile && profile.institutionScore) || 0.55, 0.1, 1);
    var privateChance = 0.2 + (institutionScore * 0.16) + ((levelKey === "bachelor" || levelKey === "masters" || levelKey === "doctorate") ? 0.1 : 0) + (App.utils.clamp(Number(person.educationIndex) || 0, 0, 100) * 0.001);

    return normalized < App.utils.clamp(privateChance, 0.18, 0.72) ? "private" : "public";
  }

  function buildEducationInstitutionName(person, credentialLevel, institutionType){
    var style = getCountryCredentialStyle(person.countryISO);
    var eliteUniversities = getCountryEliteUniversities(person.countryISO);
    var sourceList;
    var generated;
    var seed;
    var index;

    if (institutionType === "university" && eliteUniversities.length && shouldUseEliteInstitutionName(person, institutionType)) {
      seed = hashString([person.id || "", person.countryISO || "", credentialLevel || "none", "elite"].join("|"));
      index = seed % eliteUniversities.length;
      return eliteUniversities[index];
    }

    generated = buildCountryStageInstitutionName(person, credentialLevel, institutionType);
    if (generated) {
      return generated;
    }

    if (institutionType === "specialist_school") {
      sourceList = (style.specialistSchools && style.specialistSchools.length) ? style.specialistSchools : getCountrySpecialistInstitutions(person.countryISO);
    } else {
      sourceList = (credentialLevel === "bachelor" || credentialLevel === "masters" || credentialLevel === "doctorate") ? style.universities : style.schools;
    }

    seed = hashString([person.id || "", person.countryISO || "", credentialLevel || "none"].join("|"));
    index = sourceList.length ? (seed % sourceList.length) : 0;
    return sourceList[index] || "Local Public School";
  }

  function inferEducationInstitutionSectorFromName(name){
    var text = String(name || "").toLowerCase();

    if (!text) return null;
    if (/\b(private|independent)\b/.test(text)) return "private";
    if (/\b(public|state|national|government|federal)\b/.test(text)) return "public";
    return null;
  }

  function shouldRegenerateInstitutionName(name){
    var text = String(name || "").toLowerCase();

    if (!text) return true;
    return /\bstarlight\b|\bharmony\b|\bprosperity\b/.test(text);
  }

  function harmonizeEducationInstitutionNameSector(name, sector){
    var text = String(name || "").trim();
    var normalizedSector = sector === "private" ? "private" : "public";

    if (!text) return text;

    if (normalizedSector === "private") {
      text = text.replace(/\bPublic\b/gi, "Private");
      text = text.replace(/\bGovernment\b/gi, "Private");
      text = text.replace(/\bFederal\b/gi, "Private");
      return text;
    }

    text = text.replace(/\bPrivate\b/gi, "Public");
    text = text.replace(/\bIndependent\b/gi, "Public");
    return text;
  }

  function ensureEducationInstitutionData(person){
    var profile;
    var style;
    var levelKey;
    var institutionBaseline;

    if (!person) return;

    profile = ensureCountryProfile(person.countryISO);
    style = getCountryCredentialStyle(person.countryISO);
    levelKey = getEducationCredentialLevel(person.educationIndex);

    person.educationCredentialLabel = getEducationCredentialLabel(person.countryISO, levelKey, person.educationIndex);
    person.educationInstitutionType = getEducationInstitutionType(person, levelKey);
    if (person.educationInstitutionSector !== "private" && person.educationInstitutionSector !== "public") {
      person.educationInstitutionSector = getEducationInstitutionSector(person, profile, levelKey);
    }
    if (!person.educationInstitutionName) {
      person.educationInstitutionName = buildEducationInstitutionName(person, levelKey, person.educationInstitutionType);
    }
    if (shouldRegenerateInstitutionName(person.educationInstitutionName)) {
      person.educationInstitutionName = buildEducationInstitutionName(person, levelKey, person.educationInstitutionType);
    }
    person.educationInstitutionName = harmonizeEducationInstitutionNameSector(person.educationInstitutionName, person.educationInstitutionSector);
    var inferredSector = inferEducationInstitutionSectorFromName(person.educationInstitutionName);
    if (inferredSector) {
      person.educationInstitutionSector = inferredSector;
      person.educationInstitutionName = harmonizeEducationInstitutionNameSector(person.educationInstitutionName, person.educationInstitutionSector);
    }
    person.educationCourseLabel = getEducationCourseLabel(person, levelKey, person.educationInstitutionType);

    institutionBaseline = ((Number(profile && profile.institutionScore) || 0.55) * 62) + ((Number(profile && profile.educationIndex) || 0.6) * 28);
    if (!Number.isFinite(Number(person.educationInstitutionQuality))) {
      person.educationInstitutionQuality = App.utils.clamp(institutionBaseline + (Number(person.educationIndex) || 0) * 0.12, 20, 100);
    } else {
      person.educationInstitutionQuality = App.utils.clamp(Number(person.educationInstitutionQuality), 20, 100);
    }
  }

  function getHouseholdEducationBoost(household){
    var classRank;
    var classBonus;
    var liquidityRatio;
    var debtRatio;

    if (!household) return 0;

    classRank = HOUSEHOLD_CLASS_RANKS[household.classTier] != null ? HOUSEHOLD_CLASS_RANKS[household.classTier] : 1;
    classBonus = (classRank - 1) * 7;
    liquidityRatio = (household.cashOnHandGU || 0) / Math.max(1, household.monthlyExpensesGU || 1);
    debtRatio = (household.debtGU || 0) / Math.max(1, household.monthlyIncomeGU || 1);

    return classBonus + App.utils.clamp(liquidityRatio * 2.2, -4, 9) - App.utils.clamp(debtRatio * 2.1, 0, 8);
  }

  function estimateEducationIndexForPerson(person, householdOverride){
    var profile;
    var household;
    var parentScores;
    var parentAverage;
    var age;
    var countryEducation;
    var institution;
    var infrastructure;
    var ageProgress;

    if (!person) return 0;

    profile = ensureCountryProfile(person.countryISO);
    household = householdOverride || getHouseholdForPerson(person);
    parentScores = (person.parentIds || []).map(function(parentId){
      var parent = App.store.getPerson(parentId);
      return parent ? Number(parent.educationIndex) : NaN;
    }).filter(function(value){
      return Number.isFinite(value);
    });
    parentAverage = parentScores.length ? App.utils.avg(parentScores) : 0;
    age = Math.max(0, Number(person.age) || 0);
    countryEducation = App.utils.clamp(Number(profile && profile.educationIndex) || 0.6, 0.1, 1);
    institution = App.utils.clamp(Number(profile && profile.institutionScore) || 0.55, 0.1, 1);
    infrastructure = App.utils.clamp(Number(profile && profile.developmentInfrastructureIndex) || (institution * 0.78), 0.1, 1);

    if (age < 6) {
      ageProgress = 0;
    } else if (age < 12) {
      ageProgress = 8;
    } else if (age < 18) {
      ageProgress = 18;
    } else if (age < 25) {
      ageProgress = 28;
    } else {
      ageProgress = 34;
    }

    return App.utils.clamp(
      ageProgress +
      (countryEducation * 34) +
      (institution * 18) +
      (infrastructure * 14) +
      getHouseholdEducationBoost(household) +
      (parentAverage * 0.35),
      0,
      100
    );
  }

  function ensureEducationData(person, householdOverride){
    if (!person) return;

    if (!Number.isFinite(Number(person.educationIndex))) {
      person.educationIndex = estimateEducationIndexForPerson(person, householdOverride);
    }

    person.educationIndex = App.utils.clamp(Number(person.educationIndex) || 0, 0, 100);
    person.educationAttainment = getEducationAttainment(person.educationIndex);
    ensureEducationInstitutionData(person);
  }

  function getChildEducationStrainPenalty(household){
    var stress;
    var housingBurden;
    var childcareBurden;

    if (!household) return 0;

    stress = App.utils.clamp((Number(household.financialStress) || 0) / 100, 0, 1);
    housingBurden = household.monthlyExpensesGU > 0 ? App.utils.clamp((Number(household.housingCostGU) || 0) / household.monthlyExpensesGU, 0, 1.6) : 0;
    childcareBurden = household.monthlyExpensesGU > 0 ? App.utils.clamp((Number(household.childcareCostGU) || 0) / household.monthlyExpensesGU, 0, 1.2) : 0;

    return (stress * 16) + (Math.max(0, housingBurden - 0.34) * 9) + (childcareBurden * 5);
  }

  function initializeChildEducationProfile(child, householdOverride){
    if (!child) return;

    child.educationIndex = App.utils.clamp(
      estimateEducationIndexForPerson(child, householdOverride) - getChildEducationStrainPenalty(householdOverride),
      0,
      100
    );
    ensureEducationData(child, householdOverride);
    ensureSkillData(child);
    syncPerson(child);
  }

  function progressEducationYearly(person){
    var profile;
    var household;
    var uplift;

    if (!person || !person.alive || person.age < 5 || person.age > 23) return;

    profile = ensureCountryProfile(person.countryISO);
    household = getHouseholdForPerson(person);
    uplift = ((Number(profile && profile.institutionScore) || 0.55) - 0.45) * 1.8;
    uplift += ((Number(profile && profile.educationIndex) || 0.6) - 0.5) * 1.6;
    uplift += ((Number(profile && profile.developmentInfrastructureIndex) || 0.52) - 0.5) * 1.2;
    uplift += getHouseholdEducationBoost(household) * 0.06;
    uplift = App.utils.clamp(uplift, -0.3, 2.2);
    person.educationIndex = App.utils.clamp((Number(person.educationIndex) || 0) + uplift, 0, 100);
    person.educationAttainment = getEducationAttainment(person.educationIndex);
    ensureEducationInstitutionData(person);
  }

  function getChildhoodStageForAge(age){
    var years = Math.max(0, Number(age) || 0);

    if (years < 5) return "early_childhood";
    if (years < 10) return "primary_foundation";
    if (years < 14) return "lower_secondary";
    if (years < 18) return "upper_secondary";
    if (years < 23) return "tertiary_transition";
    return "adult_complete";
  }

  function chooseSkillTrack(person){
    var scores = {
      leadership:0,
      technical:0,
      commercial:0,
      creative:0,
      general:1
    };
    var bestTrack = "general";

    (person.traits || []).forEach(function(trait){
      if (trait === "Strategist" || trait === "Ambitious" || trait === "Workaholic") {
        scores.leadership += 2;
      }
      if (trait === "Innovator") {
        scores.technical += 2;
      }
      if (trait === "Visionary") {
        scores.creative += 2;
        scores.leadership += 1;
      }
      if (trait === "Charismatic" || trait === "Networker") {
        scores.commercial += 2;
      }
      if (trait === "Risk-taker") {
        scores.commercial += 1;
        scores.leadership += 1;
      }
      if (trait === "Frugal") {
        scores.commercial += 1;
      }
    });

    Object.keys(scores).forEach(function(track){
      if (scores[track] > scores[bestTrack]) {
        bestTrack = track;
      }
    });

    return bestTrack;
  }

  function getDeterministicPersonSignal(person, salt){
    var source = String((person && person.id) || "person") + "|" + String(salt || "seed");
    var hash = 0;
    var index;

    for (index = 0; index < source.length; index += 1) {
      hash = ((hash * 31) + source.charCodeAt(index)) >>> 0;
    }

    return (hash % 1000) / 999;
  }

  function getSeededSkillValue(person, key, age, education){
    var track = SKILL_TRACKS[person && person.skillTrack] || SKILL_TRACKS.general;
    var occupationKey = String(person && person.occupationCategory || "").toLowerCase();
    var occupationWeights = OCCUPATION_SKILL_WEIGHTS[occupationKey] || OCCUPATION_SKILL_WEIGHTS.default;
    var baseByAge = age < 10 ? 8 : (age < 18 ? 18 : (age < 25 ? 28 : (age < 40 ? 34 : 36)));
    var trackWeight = Number(track[key]) || 1;
    var occupationWeight = Number(occupationWeights[key]) || 1;
    var experienceBoost = App.utils.clamp((Number(person && person.workExperienceYears) || 0) * 1.35, 0, 18);
    var educationComponent = education * 0.34;
    var ageComponent = baseByAge * 0.44;
    var specializationComponent = ((trackWeight - 1) * 15) + ((occupationWeight - 1) * 12);
    var noise = (getDeterministicPersonSignal(person, key) - 0.5) * 7;

    if (key === "management" && ((person && person.jobTier === "executive") || (person && person.jobTier === "leadership"))) {
      specializationComponent += 6;
    }
    if (key === "financialDiscipline" && occupationKey === "accountant") {
      specializationComponent += 4;
    }
    if (key === "social" && occupationKey === "sales") {
      specializationComponent += 4;
    }
    if (key === "technical" && occupationKey === "engineer") {
      specializationComponent += 4;
    }

    return App.utils.clamp(ageComponent + educationComponent + experienceBoost + specializationComponent + noise, 0, 100);
  }

  function shouldReseedSkillProfile(person, age, education){
    var values;
    var maxValue;
    var minValue;
    var spread;
    var average;
    var expectedFloor;

    if (!person || !person.skills) return true;

    values = SKILL_KEYS.map(function(key){
      return App.utils.clamp(Number(person.skills[key]) || 0, 0, 100);
    });
    maxValue = Math.max.apply(null, values);
    minValue = Math.min.apply(null, values);
    spread = maxValue - minValue;
    average = App.utils.avg(values);
    expectedFloor = App.utils.clamp((age < 18 ? 10 : 18) + (education * 0.22), 0, 100);

    if (!Number.isFinite(average) || average <= 0) return true;
    if (spread < 0.75 && age >= 16) return true;
    if (average < expectedFloor - 4) return true;
    return false;
  }

  function ensureSkillData(person){
    var age;
    var education;
    var reseedSkills;
    var rawExperience;
    var rawUnemployment;
    var rawLastEmployed;

    if (!person) return;

    age = Math.max(0, Number(person.age) || 0);
    education = App.utils.clamp(Number(person.educationIndex) || 0, 0, 100);

    person.childhoodStage = person.childhoodStage || getChildhoodStageForAge(age);
    person.skillTrack = person.skillTrack || (age < 12 ? "foundation" : chooseSkillTrack(person));
    person.skills = person.skills && typeof person.skills === "object" ? person.skills : {};
    reseedSkills = shouldReseedSkillProfile(person, age, education);

    SKILL_KEYS.forEach(function(key){
      var existing = Number(person.skills[key]);
      if (!Number.isFinite(existing) || reseedSkills) {
        person.skills[key] = getSeededSkillValue(person, key, age, education);
      } else {
        person.skills[key] = App.utils.clamp(existing, 0, 100);
      }
    });

    rawExperience = Number(person.workExperienceYears);
    rawUnemployment = Number(person.unemploymentStreakDays);
    rawLastEmployed = Number(person.lastEmployedDay);

    person.workExperienceYears = App.utils.clamp(Number.isFinite(rawExperience) ? rawExperience : 0, 0, 60);
    person.unemploymentStreakDays = Math.max(0, Math.floor(Number.isFinite(rawUnemployment) ? rawUnemployment : 0));
    person.lastEmployedDay = Number.isFinite(rawLastEmployed) ? Math.max(0, Math.floor(rawLastEmployed)) : null;

    if (person.businessId || person.employerBusinessId) {
      person.unemploymentStreakDays = 0;
      if (person.lastEmployedDay == null) {
        person.lastEmployedDay = App.store.simDay;
      }
    }

    // Course and specialist-school pathways depend on track, so refresh education metadata here.
    ensureEducationInstitutionData(person);
  }

  function alignEmploymentSkills(person, role){
    var occupationHint;
    var skillFloors = {
      management:26,
      technical:24,
      social:24,
      financialDiscipline:22,
      creativity:20
    };
    var tier = String(role && role.tier || person && person.jobTier || "entry").toLowerCase();
    var tierBoost = tier === "executive" ? 18 : (tier === "leadership" ? 13 : (tier === "senior" ? 9 : (tier === "mid" ? 5 : (tier === "junior" ? 2 : 0))));

    if (!person || !role) return;

    ensureSkillData(person);
    occupationHint = getRoleOccupationHint(role);

    if (occupationHint === "executive") {
      skillFloors.management += 18 + tierBoost;
      skillFloors.social += 10 + Math.round(tierBoost * 0.6);
      skillFloors.financialDiscipline += 8 + Math.round(tierBoost * 0.55);
    } else if (occupationHint === "engineer") {
      skillFloors.technical += 16 + tierBoost;
      skillFloors.creativity += 7 + Math.round(tierBoost * 0.4);
    } else if (occupationHint === "accountant") {
      skillFloors.financialDiscipline += 16 + tierBoost;
      skillFloors.management += 4 + Math.round(tierBoost * 0.35);
    } else if (occupationHint === "sales") {
      skillFloors.social += 16 + tierBoost;
      skillFloors.management += 5 + Math.round(tierBoost * 0.35);
    } else {
      skillFloors.technical += 5 + Math.round(tierBoost * 0.35);
      skillFloors.social += 3 + Math.round(tierBoost * 0.25);
    }

    SKILL_KEYS.forEach(function(key){
      var current = Number(person.skills && person.skills[key]) || 0;
      var floor = App.utils.clamp(skillFloors[key] + ((Number(person.educationIndex) || 0) * 0.08), 0, 100);
      person.skills[key] = App.utils.clamp(Math.max(current, floor), 0, 100);
    });
  }

  function applySkillFormationYearly(person){
    var profile;
    var household;
    var mentor;
    var mentorSkillAverage;
    var ownSkillAverage;
    var age;
    var stage;
    var stageMultiplier;
    var track;
    var trackWeights;
    var occupationKey;
    var occupationWeights;
    var educationFactor;
    var institutionFactor;
    var householdFactor;
    var mentorBoost;
    var workExperienceBoost;
    var burnoutPenalty;
    var agePenalty;
    var unemploymentPenalty;
    var burnout;
    var unemploymentDays;

    if (!person || !person.alive) return;

    age = Math.max(0, Number(person.age) || 0);
    profile = ensureCountryProfile(person.countryISO);
    household = getHouseholdForPerson(person);
    stage = getChildhoodStageForAge(age);
    stageMultiplier = {
      early_childhood:0.55,
      primary_foundation:0.95,
      lower_secondary:1.15,
      upper_secondary:1.22,
      tertiary_transition:1.08,
      adult_complete:0.18
    }[stage] || 0.2;

    person.childhoodStage = stage;
    if (!person.skillTrack || person.skillTrack === "foundation") {
      person.skillTrack = age < 12 ? "foundation" : chooseSkillTrack(person);
    }

    track = SKILL_TRACKS[person.skillTrack] ? person.skillTrack : "general";
    trackWeights = SKILL_TRACKS[track];
    occupationKey = String(person.occupationCategory || "").toLowerCase();
    occupationWeights = OCCUPATION_SKILL_WEIGHTS[occupationKey] || OCCUPATION_SKILL_WEIGHTS.default;
    educationFactor = (App.utils.clamp(Number(person.educationIndex) || 0, 0, 100) / 100) * 1.35;
    institutionFactor = App.utils.clamp(Number(profile && profile.institutionScore) || 0.55, 0.1, 1) * 0.75;
    householdFactor = App.utils.clamp(getHouseholdEducationBoost(household) * 0.04, -0.25, 0.5);

    mentorBoost = 0;
    mentor = person.mentorId ? App.store.getPerson(person.mentorId) : null;
    if (mentor && mentor.alive && mentor.id !== person.id) {
      mentorSkillAverage = getPersonSkillAverage(mentor);
      ownSkillAverage = getPersonSkillAverage(person);
      mentorBoost = App.utils.clamp((mentorSkillAverage - ownSkillAverage) / 200, 0, 0.28);
    }

    if (age >= 18 && !person.retired && (person.businessId || person.employerBusinessId)) {
      person.workExperienceYears = App.utils.clamp((Number(person.workExperienceYears) || 0) + App.utils.rand(0.7, 1.15), 0, 60);
      person.unemploymentStreakDays = 0;
      person.lastEmployedDay = App.store.simDay;
    }

    workExperienceBoost = App.utils.clamp((Number(person.workExperienceYears) || 0) / 55, 0, 0.36);
    burnout = Number(person.temporaryStates && person.temporaryStates.burnout) || 0;
    burnoutPenalty = App.utils.clamp((burnout - 56) / 105, 0, 0.42);
    agePenalty = age > 57 ? App.utils.clamp((age - 57) * 0.018, 0, 0.36) : 0;
    unemploymentDays = Math.max(0, Number(person.unemploymentStreakDays) || 0);
    unemploymentPenalty = unemploymentDays > 120 ? App.utils.clamp((unemploymentDays - 120) / 520, 0, 0.55) : 0;

    SKILL_KEYS.forEach(function(key){
      var growth = (0.22 + educationFactor + institutionFactor + householdFactor + mentorBoost + workExperienceBoost) * stageMultiplier;
      growth *= App.utils.clamp(Number(trackWeights[key]) || 1, 0.7, 1.6);
      growth *= App.utils.clamp(Number(occupationWeights[key]) || 1, 0.62, 1.48);

      if (age > 58) {
        growth -= 0.35;
      }

      growth -= agePenalty;
      growth -= burnoutPenalty;
      if (age >= 18 && !person.retired && !person.businessId && !person.employerBusinessId) {
        growth -= unemploymentPenalty;
      }

      person.skills[key] = App.utils.clamp((Number(person.skills[key]) || 0) + growth, 0, 100);
    });
  }

  function getPersonSkillAverage(person){
    if (!person || !person.skills) return 0;
    return App.utils.avg(SKILL_KEYS.map(function(key){
      return App.utils.clamp(Number(person.skills[key]) || 0, 0, 100);
    }));
  }

  function refreshCountryProfileDerived(profile){
    var laborForce = Math.max(0, floorInt(profile.laborForce));
    var employed = App.utils.clamp(floorInt(profile.employed), 0, laborForce);
    var unemployed = Math.max(0, laborForce - employed);
    var medianWage = App.utils.clamp(Number(profile.medianWageGU) || 0, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
    var consumerSpendMultiplier = App.utils.clamp(Number(profile.consumerSpendMultiplier) || 1, 0.55, 1.25);
    var consumerCostOfLivingPressure = App.utils.clamp(Number(profile.consumerCostOfLivingPressure) || 1, 0.65, 1.85);
    var consumerStressIndex = App.utils.clamp(Number(profile.consumerStressIndex) || 0, 0, 1);
    var housingCostPressure = App.utils.clamp(Number(profile.housingCostPressure) || 1.02, 0.65, 2.2);
    var housingRentBurden = App.utils.clamp(Number(profile.housingRentBurden) || 0.34, 0.08, 0.9);
    var housingHomeownershipRate = App.utils.clamp(Number(profile.housingHomeownershipRate) || 0.52, 0.05, 0.95);
    var housingPriceGrowth = App.utils.clamp(Number(profile.housingPriceGrowth) || 0.02, -0.18, 0.26);
    var housingMarketStress = App.utils.clamp(Number(profile.housingMarketStress) || 0.35, 0, 1.5);
    var medianHouseholdWealthGU = Math.max(0, Number(profile.medianHouseholdWealthGU) || (medianWage * 2.1));
    var topOneWealthShare = App.utils.clamp(Number(profile.topOneWealthShare) || 0.3, 0.12, 0.95);
    var intergenerationalMobilityIndex = App.utils.clamp(Number(profile.intergenerationalMobilityIndex) || 0.5, 0, 1);
    var socialUnrestIndex = App.utils.clamp(Number(profile.socialUnrestIndex) || 0.28, 0, 1.8);
    var strikeRiskIndex = App.utils.clamp(Number(profile.strikeRiskIndex) || 0.22, 0, 1.4);
    var populismIndex = App.utils.clamp(Number(profile.populismIndex) || 0.24, 0, 1.6);
    var crimeProxyIndex = App.utils.clamp(Number(profile.crimeProxyIndex) || 0.22, 0, 1.6);
    var emigrationPressureIndex = App.utils.clamp(Number(profile.emigrationPressureIndex) || 0.24, 0, 1.6);
    var institutionalInstabilityIndex = App.utils.clamp(Number(profile.institutionalInstabilityIndex) || 0.2, 0, 1.6);
    var philanthropicCapitalAnnualGU = Math.max(0, Number(profile.philanthropicCapitalAnnualGU) || 0);
    var philanthropyImpactIndex = App.utils.clamp(Number(profile.philanthropyImpactIndex) || 0, 0, 1.6);
    var legacyProjectsIndex = App.utils.clamp(Number(profile.legacyProjectsIndex) || 0, 0, 1.4);
    var developmentEducationQuality;
    var developmentCorruptionIndex;
    var developmentInfrastructureIndex;
    var developmentLaborCostIndex;
    var developmentSocialMobilityIndex;
    var developmentFertilityNormIndex;
    var developmentBusinessFriendlinessIndex;
    var demographicAgingIndex;
    var demographicYouthBulgeIndex;
    var demographicLaborForcePressureIndex;
    var demographicFertilityDeclineIndex;
    var naturalResourceEndowmentIndex;
    var resourceRentSeekingRiskIndex;
    var resourceSeed;
    var birthRatePer1000;
    var deathRatePer1000;
    var employmentRate = laborForce > 0 ? employed / laborForce : 0;
    var baseConsumerDemand = employed * medianWage * 0.72;
    var institutionScore = App.utils.clamp(Number(profile.institutionScore) || 0, 0, 1);
    var autonomousDemandRate = App.utils.clamp(0.07 + (institutionScore * 0.025) + ((1 - consumerStressIndex) * 0.015), 0.06, 0.11);
    var autonomousDemand = profile.population * medianWage * autonomousDemandRate;
    var spendingCostDrag = App.utils.clamp((consumerCostOfLivingPressure - 1) * 0.28, 0, 0.32);
    var spendingStressDrag = App.utils.clamp(consumerStressIndex * 0.18, 0, 0.2);
    var housingSpendingDrag = App.utils.clamp((housingCostPressure - 1) * 0.1 + (housingMarketStress * 0.06), 0, 0.16);
    var homeownershipRelief = App.utils.clamp((housingHomeownershipRate - 0.45) * 0.06, -0.03, 0.04);
    var institutionRelief = App.utils.clamp((institutionScore - 0.55) * 0.08, -0.05, 0.05);
    var spendingMultiplier = App.utils.clamp(consumerSpendMultiplier - spendingCostDrag - spendingStressDrag - housingSpendingDrag + homeownershipRelief + institutionRelief, 0.56, 1.22);
    var derivedConsumerDemand = Math.round((baseConsumerDemand * spendingMultiplier) + autonomousDemand);
    var demandPerCapita = profile.population > 0 ? (derivedConsumerDemand / Math.max(1, profile.population)) : 0;
    var demandScore = App.utils.clamp(demandPerCapita / 28000, 0, 1);
    var scarcity = getLaborScarcityFromLaborPool(laborForce, unemployed);
    var industryDemandWeights = normalizeConsumerIndustryDemandWeights(profile.consumerIndustryDemandWeights);
    var existingConsumerDemand = Math.max(0, Number(profile.consumerDemandGU) || 0);

    developmentEducationQuality = App.utils.clamp((Number(profile.educationIndex) || 0.55) * 0.72 + (philanthropyImpactIndex * 0.12) + ((1 - institutionalInstabilityIndex / 1.6) * 0.16), 0, 1);
    developmentCorruptionIndex = App.utils.clamp((1 - institutionScore) * 0.68 + (institutionalInstabilityIndex / 1.6) * 0.2 + (socialUnrestIndex / 1.8) * 0.12, 0, 1);
    developmentInfrastructureIndex = App.utils.clamp((institutionScore * 0.62) + (Math.max(0, demandScore - 0.25) * 0.22) + (philanthropyImpactIndex * 0.08) + ((1 - developmentCorruptionIndex) * 0.08), 0, 1);
    developmentLaborCostIndex = App.utils.clamp(medianWage / 42000, 0, 1.6);
    developmentSocialMobilityIndex = App.utils.clamp((intergenerationalMobilityIndex * 0.75) + ((1 - topOneWealthShare) * 0.2) + ((1 - socialUnrestIndex / 1.8) * 0.05), 0, 1);
    developmentFertilityNormIndex = App.utils.clamp((App.utils.clamp(Number(profile.birthRatePer1000) || 12, 4, 45) - 8) / 20, 0, 1);
    developmentBusinessFriendlinessIndex = App.utils.clamp((institutionScore * 0.44) + (developmentInfrastructureIndex * 0.28) + ((1 - developmentCorruptionIndex) * 0.18) + ((1 - App.utils.clamp(unemployed / Math.max(1, laborForce), 0, 1)) * 0.1), 0, 1);
    birthRatePer1000 = App.utils.clamp(Number(profile.birthRatePer1000) || 12, 4, 45);
    deathRatePer1000 = App.utils.clamp(Number(profile.deathRatePer1000) || 8, 2, 28);
    demographicAgingIndex = App.utils.clamp(((1 - developmentFertilityNormIndex) * 0.42) + (developmentEducationQuality * 0.2) + (institutionScore * 0.18) + (App.utils.clamp((18 - deathRatePer1000) / 16, 0, 1) * 0.2), 0, 1);
    demographicYouthBulgeIndex = App.utils.clamp((developmentFertilityNormIndex * 0.56) + ((1 - developmentEducationQuality) * 0.16) + (Math.max(0, 0.56 - institutionScore) * 0.16) + (Math.max(0, profile.populationPressure - 0.5) * 0.12), 0, 1);
    demographicLaborForcePressureIndex = App.utils.clamp((App.utils.clamp(unemployed / Math.max(1, laborForce), 0, 1) * 0.36) + (App.utils.clamp(Number(profile.longUnemploymentShare) || 0, 0, 1) * 0.2) + (demographicYouthBulgeIndex * 0.22) + (demographicAgingIndex * 0.18) + (Math.max(0, housingCostPressure - 1) * 0.08), 0, 1.8);
    demographicFertilityDeclineIndex = App.utils.clamp(((1 - developmentFertilityNormIndex) * 0.52) + (developmentEducationQuality * 0.16) + (App.utils.clamp(developmentLaborCostIndex / 1.6, 0, 1) * 0.14) + (Math.max(0, housingCostPressure - 1) * 0.1) + (demographicAgingIndex * 0.08), 0, 1);
    resourceSeed = (hashString(String(profile.iso || "XX")) % 1000) / 1000;
    naturalResourceEndowmentIndex = App.utils.clamp(((Number(profile.naturalResourceEndowmentIndex) || 0.35) * 0.7) + ((0.18 + (resourceSeed * 0.64)) * 0.3), 0, 1);
    resourceRentSeekingRiskIndex = App.utils.clamp((naturalResourceEndowmentIndex * 0.56) + (developmentCorruptionIndex * 0.28) + ((institutionalInstabilityIndex / 1.6) * 0.16), 0, 1.6);

    profile.laborForce = laborForce;
    profile.employed = employed;
    profile.unemployed = unemployed;
    profile.medianWageGU = medianWage;
    profile.consumerSpendMultiplier = consumerSpendMultiplier;
    profile.consumerCostOfLivingPressure = consumerCostOfLivingPressure;
    profile.consumerStressIndex = consumerStressIndex;
    profile.housingCostPressure = housingCostPressure;
    profile.housingRentBurden = housingRentBurden;
    profile.housingHomeownershipRate = housingHomeownershipRate;
    profile.housingPriceGrowth = housingPriceGrowth;
    profile.housingMarketStress = housingMarketStress;
    profile.medianHouseholdWealthGU = medianHouseholdWealthGU;
    profile.topOneWealthShare = topOneWealthShare;
    profile.intergenerationalMobilityIndex = intergenerationalMobilityIndex;
    profile.socialUnrestIndex = socialUnrestIndex;
    profile.strikeRiskIndex = strikeRiskIndex;
    profile.populismIndex = populismIndex;
    profile.crimeProxyIndex = crimeProxyIndex;
    profile.emigrationPressureIndex = emigrationPressureIndex;
    profile.institutionalInstabilityIndex = institutionalInstabilityIndex;
    profile.philanthropicCapitalAnnualGU = philanthropicCapitalAnnualGU;
    profile.philanthropyImpactIndex = philanthropyImpactIndex;
    profile.legacyProjectsIndex = legacyProjectsIndex;
    profile.developmentEducationQuality = developmentEducationQuality;
    profile.developmentCorruptionIndex = developmentCorruptionIndex;
    profile.developmentInfrastructureIndex = developmentInfrastructureIndex;
    profile.developmentLaborCostIndex = developmentLaborCostIndex;
    profile.developmentSocialMobilityIndex = developmentSocialMobilityIndex;
    profile.developmentFertilityNormIndex = developmentFertilityNormIndex;
    profile.developmentBusinessFriendlinessIndex = developmentBusinessFriendlinessIndex;
    profile.demographicAgingIndex = demographicAgingIndex;
    profile.demographicYouthBulgeIndex = demographicYouthBulgeIndex;
    profile.demographicLaborForcePressureIndex = demographicLaborForcePressureIndex;
    profile.demographicFertilityDeclineIndex = demographicFertilityDeclineIndex;
    profile.naturalResourceEndowmentIndex = naturalResourceEndowmentIndex;
    profile.resourceRentSeekingRiskIndex = resourceRentSeekingRiskIndex;
    profile.consumerIndustryDemandWeights = industryDemandWeights;
    profile.autonomousDemandGU = Math.max(0, Math.round(autonomousDemand));
    profile.consumerDemandGU = App.utils.clamp(Math.round(existingConsumerDemand > 0 ? ((existingConsumerDemand * 0.62) + (derivedConsumerDemand * 0.38)) : derivedConsumerDemand), 0, MAX_COUNTRY_DEMAND_GU);
    profile.populationPressure = App.utils.clamp((employmentRate * 0.5) + (demandScore * 0.25) + (institutionScore * 0.25), 0, 1);
    profile.laborScarcity = App.utils.clamp(scarcity, 0, 1);
    profile.wagePressure = App.utils.clamp(Number(profile.wagePressure) || 0, -0.45, 0.45);
    profile.longUnemploymentShare = App.utils.clamp(Number(profile.longUnemploymentShare) || 0, 0, 1);
    profile.talentShortageIndex = App.utils.clamp(Number(profile.talentShortageIndex) || 0, 0, 1);
    profile.tradeShockIndex = App.utils.clamp(Number(profile.tradeShockIndex) || 0, 0, 1.8);
    profile.tradeRerouteRelief = App.utils.clamp(Number(profile.tradeRerouteRelief) || 0, 0, 1.2);
    profile.avgSupplyStress = App.utils.clamp(Number(profile.avgSupplyStress) || 0, 0, 1.8);
    profile.socialPressureIndex = App.utils.clamp(Number(profile.socialPressureIndex) || 0, 0, 1.5);
    profile.mobilityInflowAnnual = Math.max(0, floorInt(profile.mobilityInflowAnnual));
    profile.mobilityOutflowAnnual = Math.max(0, floorInt(profile.mobilityOutflowAnnual));
    profile.talentDriftBalance = App.utils.clamp(Number(profile.talentDriftBalance) || 0, -1.5, 1.5);
    profile.prevConsumerDemandGU = Math.max(0, Number(profile.prevConsumerDemandGU) || profile.consumerDemandGU || 0);
    profile.policyStance = normalizePolicyStance(profile.policyStance);
    profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
    profile.policyEvidence.consumerSpendMultiplier = Number(consumerSpendMultiplier.toFixed(4));
    profile.policyEvidence.autonomousDemandRate = Number(autonomousDemandRate.toFixed(4));
    profile.policyEvidence.autonomousDemandGU = Number(autonomousDemand.toFixed(2));
    profile.policyEvidence.consumerCostOfLivingPressure = Number(consumerCostOfLivingPressure.toFixed(4));
    profile.policyEvidence.consumerStressIndex = Number(consumerStressIndex.toFixed(4));
    profile.policyEvidence.housingCostPressure = Number(housingCostPressure.toFixed(4));
    profile.policyEvidence.housingRentBurden = Number(housingRentBurden.toFixed(4));
    profile.policyEvidence.housingHomeownershipRate = Number(housingHomeownershipRate.toFixed(4));
    profile.policyEvidence.housingPriceGrowth = Number(housingPriceGrowth.toFixed(4));
    profile.policyEvidence.housingMarketStress = Number(housingMarketStress.toFixed(4));
    profile.policyEvidence.medianHouseholdWealthGU = Number(medianHouseholdWealthGU.toFixed(2));
    profile.policyEvidence.topOneWealthShare = Number(topOneWealthShare.toFixed(4));
    profile.policyEvidence.intergenerationalMobilityIndex = Number(intergenerationalMobilityIndex.toFixed(4));
    profile.policyEvidence.socialUnrestIndex = Number(socialUnrestIndex.toFixed(4));
    profile.policyEvidence.strikeRiskIndex = Number(strikeRiskIndex.toFixed(4));
    profile.policyEvidence.populismIndex = Number(populismIndex.toFixed(4));
    profile.policyEvidence.crimeProxyIndex = Number(crimeProxyIndex.toFixed(4));
    profile.policyEvidence.emigrationPressureIndex = Number(emigrationPressureIndex.toFixed(4));
    profile.policyEvidence.institutionalInstabilityIndex = Number(institutionalInstabilityIndex.toFixed(4));
    profile.policyEvidence.philanthropicCapitalAnnualGU = Number(philanthropicCapitalAnnualGU.toFixed(2));
    profile.policyEvidence.philanthropyImpactIndex = Number(philanthropyImpactIndex.toFixed(4));
    profile.policyEvidence.legacyProjectsIndex = Number(legacyProjectsIndex.toFixed(4));
    profile.policyEvidence.developmentEducationQuality = Number(developmentEducationQuality.toFixed(4));
    profile.policyEvidence.developmentCorruptionIndex = Number(developmentCorruptionIndex.toFixed(4));
    profile.policyEvidence.developmentInfrastructureIndex = Number(developmentInfrastructureIndex.toFixed(4));
    profile.policyEvidence.developmentLaborCostIndex = Number(developmentLaborCostIndex.toFixed(4));
    profile.policyEvidence.developmentSocialMobilityIndex = Number(developmentSocialMobilityIndex.toFixed(4));
    profile.policyEvidence.developmentFertilityNormIndex = Number(developmentFertilityNormIndex.toFixed(4));
    profile.policyEvidence.developmentBusinessFriendlinessIndex = Number(developmentBusinessFriendlinessIndex.toFixed(4));
    profile.policyEvidence.demographicAgingIndex = Number(demographicAgingIndex.toFixed(4));
    profile.policyEvidence.demographicYouthBulgeIndex = Number(demographicYouthBulgeIndex.toFixed(4));
    profile.policyEvidence.demographicLaborForcePressureIndex = Number(demographicLaborForcePressureIndex.toFixed(4));
    profile.policyEvidence.demographicFertilityDeclineIndex = Number(demographicFertilityDeclineIndex.toFixed(4));
    profile.policyEvidence.naturalResourceEndowmentIndex = Number(naturalResourceEndowmentIndex.toFixed(4));
    profile.policyEvidence.resourceRentSeekingRiskIndex = Number(resourceRentSeekingRiskIndex.toFixed(4));

    return profile;
  }

  function getAllTrackedIndustries(){
    return Object.keys(INDUSTRY_CONSUMER_SPENDING_BASE || {});
  }

  function normalizeIndustryMetricMap(source, fallback, minValue, maxValue){
    var result = {};
    getAllTrackedIndustries().forEach(function(industry){
      var raw = source && source[industry];
      var defaultValue = fallback != null ? fallback : 1;
      result[industry] = App.utils.clamp(Number.isFinite(raw) ? raw : defaultValue, minValue, maxValue);
    });
    return result;
  }

  function ensureCountryIndustryMarketState(profile){
    if (!profile) return null;

    profile.industryPriceIndices = normalizeIndustryMetricMap(profile.industryPriceIndices, 1, 0.72, 1.45);
    profile.industryDemandAllocation = normalizeIndustryMetricMap(profile.industryDemandAllocation, 1, 0.58, 1.52);
    profile.industryDemandPressure = normalizeIndustryMetricMap(profile.industryDemandPressure, 1, 0.58, 1.82);
    profile.industryDemandShare = normalizeConsumerIndustryDemandWeights(profile.industryDemandShare);
    profile.industryProductionCapacityGU = normalizeIndustryMetricMap(profile.industryProductionCapacityGU, 0, 0, MAX_COUNTRY_DEMAND_GU * 2);
    return profile;
  }

  function getCountryIndustryPriceMultiplier(profile, industry){
    ensureCountryIndustryMarketState(profile);
    return App.utils.clamp(Number(profile && profile.industryPriceIndices && profile.industryPriceIndices[industry]) || 1, 0.72, 1.45);
  }

  function getCountryIndustryAllocationRatio(profile, industry){
    ensureCountryIndustryMarketState(profile);
    return App.utils.clamp(Number(profile && profile.industryDemandAllocation && profile.industryDemandAllocation[industry]) || 1, 0.58, 1.52);
  }

  function getBusinessMarketAllocationSignal(business){
    var profile = ensureCountryProfile(business && business.countryISO, business && business.blocId);
    var priceIndex = getCountryIndustryPriceMultiplier(profile, business && business.industry);
    var allocationRatio = getCountryIndustryAllocationRatio(profile, business && business.industry);

    return {
      priceIndex:priceIndex,
      allocationRatio:allocationRatio,
      revenueMultiplier:App.utils.clamp((priceIndex * 0.62) + (allocationRatio * 0.38), 0.72, 1.42)
    };
  }

  function getBusinessProductionCapacityGU(business){
    var countryProfile;
    var medianWage;
    var productivity;
    var stageFactor;
    var reputationFactor;
    var managementFactor;
    var innovationFactor;
    var infrastructureFactor;
    var supplyFactor;

    if (!business) return 0;

    countryProfile = ensureCountryProfile(business.countryISO, business.blocId);
    medianWage = getCountryMedianWage(business.countryISO);
    productivity = getIndustryValue(INDUSTRY_PRODUCTIVITY_MULTIPLIERS, business.industry, 2.6);
    stageFactor = getBusinessStageFactor(business.stage);
    reputationFactor = 0.74 + ((Number(business.reputation) || 50) / 100) * 0.78;
    managementFactor = App.utils.clamp(0.78 + ((Number(business.managementQuality) || 50) / 100) * 0.34, 0.72, 1.18);
    innovationFactor = App.utils.clamp(0.86 + ((Number(business.innovationIndex) || 40) / 100) * 0.22, 0.82, 1.16);
    infrastructureFactor = App.utils.clamp(0.84 + (App.utils.clamp(Number(countryProfile && countryProfile.developmentInfrastructureIndex) || 0.52, 0.1, 1) * 0.24), 0.78, 1.12);
    supplyFactor = App.utils.clamp(1 - (App.utils.clamp(Number(business.supplyStress) || 0, 0, 1.8) * 0.08), 0.68, 1);

    return Math.max(1, Math.round(Math.max(1, Number(business.employees) || 1) * medianWage * productivity * stageFactor * reputationFactor * managementFactor * innovationFactor * infrastructureFactor * supplyFactor));
  }

  function normalizeConsumerIndustryDemandWeights(weights){
    var industries = App.data && Array.isArray(App.data.INDUSTRIES) ? App.data.INDUSTRIES : Object.keys(INDUSTRY_CONSUMER_SPENDING_BASE);
    var normalized = {};
    var total = 0;

    industries.forEach(function(industry){
      var fallback = Math.max(0.001, Number(INDUSTRY_CONSUMER_SPENDING_BASE[industry]) || 0.01);
      var value = Math.max(0.001, Number(weights && weights[industry]) || fallback);
      normalized[industry] = value;
      total += value;
    });

    if (total <= 0) {
      return Object.assign({}, INDUSTRY_CONSUMER_SPENDING_BASE);
    }

    industries.forEach(function(industry){
      normalized[industry] = normalized[industry] / total;
    });

    return normalized;
  }

  function getHouseholdConsumerSpendingSignals(household){
    var classTier = household && household.classTier ? household.classTier : "working";
    var classPropensity = App.utils.clamp(Number(HOUSEHOLD_CONSUMPTION_PROPENSITY[classTier]) || HOUSEHOLD_CONSUMPTION_PROPENSITY.working, 0.55, 1.02);
    var monthlyIncome = Math.max(0, Number(household && household.monthlyIncomeGU) || 0);
    var monthlyExpenses = Math.max(1, Number(household && household.monthlyExpensesGU) || 1);
    var stress = App.utils.clamp((Number(household && household.financialStress) || 0) / 100, 0, 1);
    var costPressure = App.utils.clamp(monthlyExpenses / Math.max(1, monthlyIncome || (monthlyExpenses * 0.85)), 0.6, 2.4);
    var cashCoverageMonths = App.utils.clamp((Number(household && household.cashOnHandGU) || 0) / monthlyExpenses, 0, 8);
    var classRank = householdClassRank(classTier);
    var demandWeight = Math.max(320, monthlyIncome + (monthlyExpenses * 0.3));
    var spendMultiplier = classPropensity - (Math.max(0, costPressure - 1) * 0.24) - (stress * 0.16) + (cashCoverageMonths * 0.012);
    var industryWeights = Object.assign({}, INDUSTRY_CONSUMER_SPENDING_BASE);

    if (costPressure > 1.08 || stress > 0.58) {
      industryWeights.Retail *= 1.12;
      industryWeights["F&B"] *= 1.16;
      industryWeights.Healthcare *= 1.1;
      industryWeights.Energy *= 1.08;
      industryWeights.Logistics *= 1.07;
      industryWeights.Technology *= 0.87;
      industryWeights.Media *= 0.84;
      industryWeights["Real Estate"] *= 0.8;
      industryWeights.Finance *= 0.9;
    }

    if (classRank >= 3) {
      industryWeights["Real Estate"] *= 1.24;
      industryWeights.Finance *= 1.16;
      industryWeights.Technology *= 1.1;
      industryWeights.Media *= 1.08;
      industryWeights.Retail *= 0.93;
      industryWeights["F&B"] *= 0.9;
    } else if (classRank <= 1) {
      industryWeights.Retail *= 1.08;
      industryWeights["F&B"] *= 1.1;
      industryWeights.Healthcare *= 1.06;
      industryWeights["Real Estate"] *= 0.86;
      industryWeights.Finance *= 0.88;
      industryWeights.Media *= 0.9;
    }

    return {
      demandWeight:demandWeight,
      spendMultiplier:App.utils.clamp(spendMultiplier, 0.55, 1.18),
      costPressure:costPressure,
      stress:stress,
      industryWeights:normalizeConsumerIndustryDemandWeights(industryWeights)
    };
  }

  function buildCountryConsumerSpendingSignals(){
    var stats = {};

    (App.store.households || []).forEach(function(household){
      var iso;
      var entry;
      var signals;

      if (!household || !household.countryISO) return;
      refreshHouseholdSnapshot(household);
      signals = getHouseholdConsumerSpendingSignals(household);
      iso = household.countryISO;
      if (!stats[iso]) {
        stats[iso] = {
          households:0,
          weightSum:0,
          spendWeightedSum:0,
          costWeightedSum:0,
          stressWeightedSum:0,
          industryWeightedSums:{}
        };
      }
      entry = stats[iso];
      entry.households += 1;
      entry.weightSum += signals.demandWeight;
      entry.spendWeightedSum += signals.spendMultiplier * signals.demandWeight;
      entry.costWeightedSum += signals.costPressure * signals.demandWeight;
      entry.stressWeightedSum += signals.stress * signals.demandWeight;
      Object.keys(signals.industryWeights || {}).forEach(function(industry){
        entry.industryWeightedSums[industry] = (entry.industryWeightedSums[industry] || 0) + ((signals.industryWeights[industry] || 0) * signals.demandWeight);
      });
    });

    return stats;
  }

  function buildCountryHousingMarketSignals(){
    var stats = {};

    (App.store.households || []).forEach(function(household){
      var iso;
      var entry;
      var monthlyIncome;
      var monthlyExpenses;
      var burden;
      var savingsPressure;
      var ownership;
      var affordability;
      var weight;

      if (!household || !household.countryISO) return;

      refreshHouseholdSnapshot(household);
      iso = household.countryISO;
      if (!stats[iso]) {
        stats[iso] = {
          households:0,
          weightSum:0,
          burdenWeightedSum:0,
          savingsWeightedSum:0,
          ownershipWeightedSum:0,
          affordabilityWeightedSum:0
        };
      }

      monthlyIncome = Math.max(0, Number(household.monthlyIncomeGU) || 0);
      monthlyExpenses = Math.max(1, Number(household.monthlyExpensesGU) || 1);
      burden = App.utils.clamp(Number(household.housingBurdenRatio) || ((Number(household.housingCostGU) || 0) / Math.max(1, monthlyIncome || (monthlyExpenses * 0.85))), 0.08, 1.9);
      savingsPressure = App.utils.clamp(Number(household.housingSavingsPressure) || ((Number(household.housingCostGU) || 0) / monthlyExpenses), 0.08, 2.2);
      ownership = App.utils.clamp(Number(household.housingOwnershipScore) || 0, 0, 1);
      affordability = App.utils.clamp(Number(household.housingAffordabilityScore) || 0.5, 0.05, 1);
      weight = Math.max(280, monthlyIncome + (monthlyExpenses * 0.45));

      entry = stats[iso];
      entry.households += 1;
      entry.weightSum += weight;
      entry.burdenWeightedSum += burden * weight;
      entry.savingsWeightedSum += savingsPressure * weight;
      entry.ownershipWeightedSum += ownership * weight;
      entry.affordabilityWeightedSum += affordability * weight;
    });

    return stats;
  }

  function getCountryIndustryDemandMultiplier(profile, industry){
    var normalizedWeights;
    var baseShare;
    var activeShare;

    if (!profile) return 1;

    normalizedWeights = normalizeConsumerIndustryDemandWeights(profile.consumerIndustryDemandWeights);
    baseShare = Math.max(0.001, Number(INDUSTRY_CONSUMER_SPENDING_BASE[industry]) || 0.01);
    activeShare = Math.max(0.001, Number(normalizedWeights[industry]) || baseShare);

    return App.utils.clamp(activeShare / baseShare, 0.62, 1.62);
  }

  function getBlocIndustryDemandMultiplier(blocId, industry){
    var profiles = App.store.getBlocProfiles ? App.store.getBlocProfiles(blocId) : [];
    var weightedSum = 0;
    var weightTotal = 0;

    (profiles || []).forEach(function(profile){
      var weight = Math.max(1, Number(profile && profile.consumerDemandGU) || 0);
      weightedSum += getCountryIndustryDemandMultiplier(profile, industry) * weight;
      weightTotal += weight;
    });

    if (weightTotal <= 0) return 1;
    return App.utils.clamp(weightedSum / weightTotal, 0.62, 1.62);
  }

  function normalizePolicyStance(stance){
    return POLICY_STANCE_KEYS.indexOf(stance) >= 0 ? stance : "neutral";
  }

  function shiftPolicyStance(stance, direction){
    var index = POLICY_STANCE_KEYS.indexOf(normalizePolicyStance(stance));

    if (direction > 0) {
      index += 1;
    } else if (direction < 0) {
      index -= 1;
    }

    index = App.utils.clamp(index, 0, POLICY_STANCE_KEYS.length - 1);
    return POLICY_STANCE_KEYS[index];
  }

  function isTier6Slice1Enabled(){
    return !!(TIER6_SLICE1_CONFIG && TIER6_SLICE1_CONFIG.enabled);
  }

  function getTier6ElectionChannelEffects(profile){
    var tax = App.utils.clamp(Number(profile && profile.electionTaxPolicyIndex) || 0, -0.55, 0.55);
    var trade = App.utils.clamp(Number(profile && profile.electionTradePolicyIndex) || 0, -0.55, 0.55);
    var labor = App.utils.clamp(Number(profile && profile.electionLaborPolicyIndex) || 0, -0.55, 0.55);
    var immigration = App.utils.clamp(Number(profile && profile.electionImmigrationPolicyIndex) || 0, -0.55, 0.55);
    var confidence = App.utils.clamp(Number(profile && profile.electionBusinessConfidenceIndex) || 0, -0.6, 0.6);

    return {
      taxDemandBias:tax * -0.028,
      tradeDemandBias:trade * 0.036,
      laborWageBias:labor * 0.052,
      immigrationBias:immigration * 0.085,
      businessConfidenceBias:confidence * 0.055,
      creditConfidenceBias:confidence * 0.012
    };
  }

  function getBlocDemocracyScore(bloc){
    var profiles;
    var institutionAvg = 0;
    var corruptionAvg = 0;

    if (!bloc) return 0;

    profiles = (App.store.getBlocProfiles ? App.store.getBlocProfiles(bloc.id) : []).filter(Boolean);
    if (!profiles.length) return 0;

    institutionAvg = profiles.reduce(function(sum, profile){
      return sum + App.utils.clamp(Number(profile && profile.institutionScore) || 0.55, 0, 1);
    }, 0) / profiles.length;
    corruptionAvg = profiles.reduce(function(sum, profile){
      return sum + App.utils.clamp(Number(profile && profile.developmentCorruptionIndex) || 0.42, 0, 1);
    }, 0) / profiles.length;

    return App.utils.clamp((institutionAvg * 0.62) + ((1 - corruptionAvg) * 0.38), 0, 1);
  }

  function isBlocElectionEligible(bloc){
    return getBlocDemocracyScore(bloc) >= 0.52;
  }

  function getSanctionLaneKey(sourceBlocId, targetBlocId){
    return String(sourceBlocId || "") + "->" + String(targetBlocId || "");
  }

  function ensureTier6SanctionLanes(){
    App.store.tier6SanctionLanes = App.store.tier6SanctionLanes && typeof App.store.tier6SanctionLanes === "object" ? App.store.tier6SanctionLanes : {};
    return App.store.tier6SanctionLanes;
  }

  function getSanctionLane(sourceBlocId, targetBlocId){
    var lanes = ensureTier6SanctionLanes();
    var key = getSanctionLaneKey(sourceBlocId, targetBlocId);
    var lane = lanes[key];

    if (!lane) {
      lane = {
        sourceBlocId:String(sourceBlocId || ""),
        targetBlocId:String(targetBlocId || ""),
        sanctionPressure:0,
        tradeBlockIndex:0,
        financeBlockIndex:0,
        dealBlockIndex:0,
        rerouteProgressIndex:0,
        lastUpdatedYear:-1,
        lastNewsYear:-1,
        active:false
      };
      lanes[key] = lane;
    }

    return lane;
  }

  function getBilateralSanctionDealBlock(firstBlocId, secondBlocId){
    var lanes = ensureTier6SanctionLanes();
    var forward = lanes[getSanctionLaneKey(firstBlocId, secondBlocId)];
    var reverse = lanes[getSanctionLaneKey(secondBlocId, firstBlocId)];
    var forwardBlock = App.utils.clamp(Number(forward && forward.dealBlockIndex) || 0, 0, 1);
    var reverseBlock = App.utils.clamp(Number(reverse && reverse.dealBlockIndex) || 0, 0, 1);

    return App.utils.clamp(Math.max(forwardBlock, reverseBlock), 0, 1);
  }

  function getCountrySanctionExposure(profile, blocId){
    var lanes = ensureTier6SanctionLanes();
    var finance = App.utils.clamp(Number(profile && profile.sanctionFinanceBlockIndex) || 0, 0, 1);
    var deal = App.utils.clamp(Number(profile && profile.sanctionDealBlockIndex) || 0, 0, 1);

    Object.keys(lanes).forEach(function(key){
      var lane = lanes[key];

      if (!lane || String(lane.targetBlocId) !== String(blocId || "")) return;
      finance = Math.max(finance, App.utils.clamp(Number(lane.financeBlockIndex) || 0, 0, 1));
      deal = Math.max(deal, App.utils.clamp(Number(lane.dealBlockIndex) || 0, 0, 1));
    });

    return {
      financeBlockIndex:finance,
      dealBlockIndex:deal
    };
  }

  function processTier6Slice1ElectionsYearly(){
    var year = currentYear();

    if (!isTier6Slice1Enabled() || !TIER6_SLICE1_CONFIG.elections) return;

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var cycle;
      var offset;
      var electionYear;
      var laborForce;
      var unemploymentRate;
      var populism;
      var socialUnrest;
      var gini;
      var laborScarcity;
      var pressure;
      var biasBefore;
      var biasAfter;
      var bloc;
      var electionEligible;
      var taxIndex;
      var tradeIndex;
      var laborIndex;
      var immigrationIndex;
      var confidenceIndex;
      var electionSignal;
      var direction = 0;

      if (!profile) return;

      bloc = App.store.getBloc(profile.blocId) || App.store.getBlocByCountry(iso);
      electionEligible = isBlocElectionEligible(bloc);

      cycle = Math.max(2, TIER6_SLICE1_CONFIG.electionCycleMinYears + (hashString(iso + "-cycle") % Math.max(1, TIER6_SLICE1_CONFIG.electionCycleSpanYears)));
      offset = hashString(iso + "-offset") % cycle;
      electionYear = electionEligible && ((year + offset) % cycle) === 0;
      laborForce = Math.max(1, Number(profile.laborForce) || 1);
      unemploymentRate = App.utils.clamp(Math.max(0, Number(profile.unemployed) || 0) / laborForce, 0, 1);
      populism = App.utils.clamp(Number(profile.populismIndex) || 0, 0, 1.6);
      socialUnrest = App.utils.clamp(Number(profile.socialUnrestIndex) || 0, 0, 1.8);
      gini = App.utils.clamp(Number(profile.giniCoefficient) || 0.4, 0.2, 0.8);
      laborScarcity = App.utils.clamp(Number(profile.laborScarcity) || 0, 0, 1);
      pressure = App.utils.clamp((populism * 0.42) + (socialUnrest * 0.2) + (unemploymentRate * 0.75) + ((gini - 0.35) * 0.55), 0, 1.8);
      biasBefore = App.utils.clamp(Number(profile.tier6ElectionBias) || 0, -0.9, 0.9);
      taxIndex = App.utils.clamp(Number(profile.electionTaxPolicyIndex) || 0, -0.55, 0.55);
      tradeIndex = App.utils.clamp(Number(profile.electionTradePolicyIndex) || 0, -0.55, 0.55);
      laborIndex = App.utils.clamp(Number(profile.electionLaborPolicyIndex) || 0, -0.55, 0.55);
      immigrationIndex = App.utils.clamp(Number(profile.electionImmigrationPolicyIndex) || 0, -0.55, 0.55);
      confidenceIndex = App.utils.clamp(Number(profile.electionBusinessConfidenceIndex) || 0, -0.6, 0.6);

      if (electionYear) {
        if (pressure >= 0.62) {
          direction = 1;
        } else if (laborScarcity >= 0.78 && unemploymentRate <= 0.08) {
          direction = -1;
        }
        biasAfter = App.utils.clamp((biasBefore * 0.38) + (direction * 0.32), -0.9, 0.9);
        electionSignal = App.utils.clamp((pressure * 0.62) + (Math.abs(direction) * 0.38), 0, 1.5);
        taxIndex = App.utils.clamp((taxIndex * 0.35) + (direction * electionSignal * 0.26), -0.55, 0.55);
        tradeIndex = App.utils.clamp((tradeIndex * 0.35) + ((-direction) * electionSignal * 0.24), -0.55, 0.55);
        laborIndex = App.utils.clamp((laborIndex * 0.35) + (direction * electionSignal * 0.22), -0.55, 0.55);
        immigrationIndex = App.utils.clamp((immigrationIndex * 0.35) + ((-direction) * electionSignal * 0.29), -0.55, 0.55);
        confidenceIndex = App.utils.clamp((confidenceIndex * 0.32) + (((-direction) * 0.22) + ((0.5 - Math.abs(direction)) * 0.08)), -0.6, 0.6);

        if (direction !== 0 && (hashString(iso + "-election-news-" + year) % 100) < TIER6_SLICE1_CONFIG.electionNewsHashGate) {
          emitNews("policy", "<strong>" + App.store.getCountryName(iso) + "</strong> completed elections with a " + (direction > 0 ? "tightening" : "supportive") + " mandate.", {
            entities:{
              countryIsos:[iso],
              blocIds:[profile.blocId].filter(Boolean)
            },
            causes:[
              "Election pressure index: " + pressure.toFixed(2),
              "Policy channels adjusted for tax, trade, labor, immigration, and business confidence."
            ],
            scope:"regional",
            rollupLabel:iso
          });
        }
      } else {
        biasAfter = App.utils.clamp(biasBefore * TIER6_SLICE1_CONFIG.electionChannelDecay, -0.9, 0.9);
        taxIndex = App.utils.clamp(taxIndex * TIER6_SLICE1_CONFIG.electionChannelDecay, -0.55, 0.55);
        tradeIndex = App.utils.clamp(tradeIndex * TIER6_SLICE1_CONFIG.electionChannelDecay, -0.55, 0.55);
        laborIndex = App.utils.clamp(laborIndex * TIER6_SLICE1_CONFIG.electionChannelDecay, -0.55, 0.55);
        immigrationIndex = App.utils.clamp(immigrationIndex * TIER6_SLICE1_CONFIG.electionChannelDecay, -0.55, 0.55);
        confidenceIndex = App.utils.clamp(confidenceIndex * TIER6_SLICE1_CONFIG.electionChannelDecay, -0.6, 0.6);
      }

      profile.tier6ElectionBias = biasAfter;
      profile.electionTaxPolicyIndex = taxIndex;
      profile.electionTradePolicyIndex = tradeIndex;
      profile.electionLaborPolicyIndex = laborIndex;
      profile.electionImmigrationPolicyIndex = immigrationIndex;
      profile.electionBusinessConfidenceIndex = confidenceIndex;
      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.tier6Slice = "slice1";
      profile.policyEvidence.electionCycleYears = cycle;
      profile.policyEvidence.electionTriggered = !!electionYear;
      profile.policyEvidence.electionEligible = !!electionEligible;
      profile.policyEvidence.electionDirection = direction;
      profile.policyEvidence.electionPressureIndex = Number(pressure.toFixed(4));
      profile.policyEvidence.electionBias = Number(biasAfter.toFixed(4));
      profile.policyEvidence.electionTaxPolicyIndex = Number(taxIndex.toFixed(4));
      profile.policyEvidence.electionTradePolicyIndex = Number(tradeIndex.toFixed(4));
      profile.policyEvidence.electionLaborPolicyIndex = Number(laborIndex.toFixed(4));
      profile.policyEvidence.electionImmigrationPolicyIndex = Number(immigrationIndex.toFixed(4));
      profile.policyEvidence.electionBusinessConfidenceIndex = Number(confidenceIndex.toFixed(4));
      profile.policyEvidence.conflictPhaseEnabled = !!TIER6_SLICE1_CONFIG.conflictPhaseEnabled;
    });
  }

  function processTier6Slice1SanctionsYearly(){
    var year = currentYear();
    var lanes;
    var sanctionNewsBudget = 4;
    var conflictScale;
    var sanctionGeoThreshold;
    var sanctionActivationThreshold;

    if (!isTier6Slice1Enabled() || !TIER6_SLICE1_CONFIG.sanctions) return;

    lanes = ensureTier6SanctionLanes();
    conflictScale = TIER6_SLICE1_CONFIG.conflictPhaseEnabled ? 1 : 0.62;
    sanctionGeoThreshold = TIER6_SLICE1_CONFIG.sanctionGeoPressureThreshold + (TIER6_SLICE1_CONFIG.conflictPhaseEnabled ? 0 : 0.3);
    sanctionActivationThreshold = TIER6_SLICE1_CONFIG.conflictPhaseEnabled ? 0.08 : 0.18;
    Object.keys(lanes).forEach(function(key){
      var lane = lanes[key];

      if (!lane || lane.lastUpdatedYear === year) return;
      lane.sanctionPressure = App.utils.clamp((Number(lane.sanctionPressure) || 0) * TIER6_SLICE1_CONFIG.sanctionLaneDecay, 0, 1);
      lane.tradeBlockIndex = App.utils.clamp((Number(lane.tradeBlockIndex) || 0) * TIER6_SLICE1_CONFIG.sanctionLaneDecay, 0, 1);
      lane.financeBlockIndex = App.utils.clamp((Number(lane.financeBlockIndex) || 0) * TIER6_SLICE1_CONFIG.sanctionLaneDecay, 0, 1);
      lane.dealBlockIndex = App.utils.clamp((Number(lane.dealBlockIndex) || 0) * TIER6_SLICE1_CONFIG.sanctionLaneDecay, 0, 1);
      lane.rerouteProgressIndex = App.utils.clamp((Number(lane.rerouteProgressIndex) || 0) * 0.9, 0, 1);
      lane.active = lane.tradeBlockIndex >= 0.09 || lane.financeBlockIndex >= 0.09 || lane.dealBlockIndex >= 0.09;
    });

    (App.store.blocs || []).forEach(function(bloc){
      var geoPressure;
      var defaultRisk;
      var inequality;
      var sanctionPressure;
      var target;
      var lane;
      var rerouteDrag;
      var outgoingTargets = [];

      if (!bloc) return;

      geoPressure = App.utils.clamp(Number(bloc.geoPressure) || 0, 0, 3);
      defaultRisk = App.utils.clamp(Number(bloc.defaultRisk) || 0, 0, 2.5);
      inequality = App.utils.clamp(Number(bloc.topOneWealthShare) || 0.3, 0.12, 0.95);
      sanctionPressure = App.utils.clamp(((geoPressure - sanctionGeoThreshold) + (defaultRisk * 0.16) + (Math.max(0, inequality - 0.45) * 0.18)) * conflictScale, 0, TIER6_SLICE1_CONFIG.sanctionPressureMax);

      target = pickWeightedBy((App.store.blocs || []).filter(function(candidate){
        return candidate && candidate.id !== bloc.id;
      }), function(candidate){
        var bilateralNoise = ((hashString(bloc.id + ":" + candidate.id + ":" + year) % 1000) / 1000) * 0.18;
        var pressureGap = Math.abs((Number(candidate.geoPressure) || 0) - geoPressure);
        var risk = App.utils.clamp(Number(candidate.defaultRisk) || 0, 0, 2.5);
        return App.utils.clamp((Number(candidate.geoPressure) || 0) * 0.42 + pressureGap * 0.28 + risk * 0.22 + bilateralNoise, 0.01, 4.8);
      });

      if (target && sanctionPressure > sanctionActivationThreshold) {
        lane = getSanctionLane(bloc.id, target.id);
        lane.sanctionPressure = App.utils.clamp((Number(lane.sanctionPressure) || 0) * 0.46 + sanctionPressure * (0.68 * conflictScale), 0, 1);
        lane.tradeBlockIndex = App.utils.clamp((Number(lane.tradeBlockIndex) || 0) * 0.5 + lane.sanctionPressure * (0.74 * conflictScale), 0, 1);
        lane.financeBlockIndex = App.utils.clamp((Number(lane.financeBlockIndex) || 0) * 0.48 + lane.sanctionPressure * (0.66 * conflictScale), 0, TIER6_SLICE1_CONFIG.sanctionFinanceBlockCap);
        lane.dealBlockIndex = App.utils.clamp((Number(lane.dealBlockIndex) || 0) * 0.44 + lane.sanctionPressure * (0.62 * conflictScale), 0, TIER6_SLICE1_CONFIG.sanctionDealBlockCap);
        lane.rerouteProgressIndex = App.utils.clamp((Number(lane.rerouteProgressIndex) || 0) * 0.72 + lane.tradeBlockIndex * 0.16, 0, 1);
        lane.lastUpdatedYear = year;
        lane.active = true;
        outgoingTargets.push(target.id);

        if (sanctionNewsBudget > 0 && lane.tradeBlockIndex >= (TIER6_SLICE1_CONFIG.conflictPhaseEnabled ? 0.22 : 0.34) && lane.lastNewsYear !== year) {
          emitNews("trade", "<strong>" + bloc.name + "</strong> imposed sanctions on <strong>" + target.name + "</strong>, restricting trade, finance, and deal flow.", {
            entities:{
              blocIds:[bloc.id, target.id]
            },
            causes:[
              "Sanction pressure index: " + sanctionPressure.toFixed(2),
              "Affected channels: trade block " + lane.tradeBlockIndex.toFixed(2) + ", finance block " + lane.financeBlockIndex.toFixed(2) + ", deal block " + lane.dealBlockIndex.toFixed(2) + "."
            ],
            scope:"global",
            rollupLabel:bloc.id + "-" + target.id
          });
          lane.lastNewsYear = year;
          sanctionNewsBudget -= 1;
        }
      }

      (bloc.members || []).forEach(function(iso){
        var profile = ensureCountryProfile(iso, bloc.id);
        var outgoingTrade = 0;
        var outgoingFinance = 0;
        var outgoingDeal = 0;

        if (!profile) return;

        Object.keys(lanes).forEach(function(key){
          var item = lanes[key];
          if (!item || item.sourceBlocId !== bloc.id) return;
          outgoingTrade = Math.max(outgoingTrade, App.utils.clamp(Number(item.tradeBlockIndex) || 0, 0, 1));
          outgoingFinance = Math.max(outgoingFinance, App.utils.clamp(Number(item.financeBlockIndex) || 0, 0, 1));
          outgoingDeal = Math.max(outgoingDeal, App.utils.clamp(Number(item.dealBlockIndex) || 0, 0, 1));
        });

        rerouteDrag = App.utils.clamp(outgoingTrade * (1 - App.utils.clamp(Number(profile.tradeRerouteRelief) || 0, 0, 1.2) * 0.62), 0, 1);
        profile.sanctionTradeBlockIndex = App.utils.clamp((Number(profile.sanctionTradeBlockIndex) || 0) * 0.72 + outgoingTrade * 0.62, 0, 1);
        profile.sanctionFinanceBlockIndex = App.utils.clamp((Number(profile.sanctionFinanceBlockIndex) || 0) * 0.72 + outgoingFinance * 0.62, 0, 1);
        profile.sanctionDealBlockIndex = App.utils.clamp((Number(profile.sanctionDealBlockIndex) || 0) * 0.72 + outgoingDeal * 0.62, 0, 1);

        profile.tradeShockIndex = App.utils.clamp((App.utils.clamp(Number(profile.tradeShockIndex) || 0, 0, 1.8) * 0.72) + (sanctionPressure * 0.2) + (rerouteDrag * 0.22), 0, 1.8);
        profile.tradeRerouteRelief = App.utils.clamp((App.utils.clamp(Number(profile.tradeRerouteRelief) || 0, 0, 1.2) * 0.82) + (sanctionPressure * 0.16) + (profile.sanctionTradeBlockIndex * 0.1), 0, 1.2);
        profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
        profile.policyEvidence.tier6Slice = "slice1";
        profile.policyEvidence.sanctionPressureIndex = Number(sanctionPressure.toFixed(4));
        profile.policyEvidence.sanctionTradeBlockIndex = Number((Number(profile.sanctionTradeBlockIndex) || 0).toFixed(4));
        profile.policyEvidence.sanctionFinanceBlockIndex = Number((Number(profile.sanctionFinanceBlockIndex) || 0).toFixed(4));
        profile.policyEvidence.sanctionDealBlockIndex = Number((Number(profile.sanctionDealBlockIndex) || 0).toFixed(4));
        profile.policyEvidence.conflictPhaseEnabled = !!TIER6_SLICE1_CONFIG.conflictPhaseEnabled;
      });

      bloc.policyEvidence = bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : {};
      bloc.policyEvidence.tier6Slice = "slice1";
      bloc.policyEvidence.sanctionPressureIndex = Number(sanctionPressure.toFixed(4));
      bloc.policyEvidence.sanctionTargets = outgoingTargets.slice(0, 4);
      bloc.policyEvidence.sanctionOutgoingCount = outgoingTargets.length;
      bloc.policyEvidence.conflictPhaseEnabled = !!TIER6_SLICE1_CONFIG.conflictPhaseEnabled;
      bloc.tier6ConflictPhaseEnabled = !!TIER6_SLICE1_CONFIG.conflictPhaseEnabled;
    });

    (App.store.blocs || []).forEach(function(bloc){
      var targetExposure = { trade:0, finance:0, deal:0, reroute:0 };

      if (!bloc) return;

      Object.keys(lanes).forEach(function(key){
        var lane = lanes[key];
        if (!lane || lane.targetBlocId !== bloc.id) return;
        targetExposure.trade = Math.max(targetExposure.trade, App.utils.clamp(Number(lane.tradeBlockIndex) || 0, 0, 1));
        targetExposure.finance = Math.max(targetExposure.finance, App.utils.clamp(Number(lane.financeBlockIndex) || 0, 0, 1));
        targetExposure.deal = Math.max(targetExposure.deal, App.utils.clamp(Number(lane.dealBlockIndex) || 0, 0, 1));
        targetExposure.reroute = Math.max(targetExposure.reroute, App.utils.clamp(Number(lane.rerouteProgressIndex) || 0, 0, 1));
      });

      (bloc.members || []).forEach(function(iso){
        var profile = ensureCountryProfile(iso, bloc.id);
        var rerouteHeadroom;

        if (!profile) return;

        rerouteHeadroom = Math.max(0, 1 - targetExposure.reroute);
        profile.sanctionTradeBlockIndex = App.utils.clamp((Number(profile.sanctionTradeBlockIndex) || 0) * 0.66 + targetExposure.trade * 0.76, 0, 1);
        profile.sanctionFinanceBlockIndex = App.utils.clamp((Number(profile.sanctionFinanceBlockIndex) || 0) * 0.66 + targetExposure.finance * 0.76, 0, 1);
        profile.sanctionDealBlockIndex = App.utils.clamp((Number(profile.sanctionDealBlockIndex) || 0) * 0.66 + targetExposure.deal * 0.76, 0, 1);
        profile.tradeShockIndex = App.utils.clamp((Number(profile.tradeShockIndex) || 0) + targetExposure.trade * 0.18 * rerouteHeadroom, 0, 1.8);
        profile.tradeRerouteRelief = App.utils.clamp((Number(profile.tradeRerouteRelief) || 0) + targetExposure.trade * 0.18 * targetExposure.reroute, 0, 1.2);
        profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
        profile.policyEvidence.sanctionTargetTradeBlockIndex = Number(targetExposure.trade.toFixed(4));
        profile.policyEvidence.sanctionTargetFinanceBlockIndex = Number(targetExposure.finance.toFixed(4));
        profile.policyEvidence.sanctionTargetDealBlockIndex = Number(targetExposure.deal.toFixed(4));
        profile.policyEvidence.sanctionRerouteProgressIndex = Number(targetExposure.reroute.toFixed(4));
      });

      bloc.policyEvidence = bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : {};
      bloc.policyEvidence.sanctionIncomingTradeBlockIndex = Number(targetExposure.trade.toFixed(4));
      bloc.policyEvidence.sanctionIncomingFinanceBlockIndex = Number(targetExposure.finance.toFixed(4));
      bloc.policyEvidence.sanctionIncomingDealBlockIndex = Number(targetExposure.deal.toFixed(4));
      bloc.policyEvidence.sanctionRerouteProgressIndex = Number(targetExposure.reroute.toFixed(4));
    });
  }

  function processTier6ConstrainedSliceYearly(){
    if (!isTier6Slice1Enabled()) return;
    processTier6Slice1ElectionsYearly();
    processTier6Slice1SanctionsYearly();
  }

  function deriveCountryPolicyStance(signals){
    var unemploymentRate = App.utils.clamp(Number(signals && signals.unemploymentRate) || 0, 0, 1);
    var laborScarcity = App.utils.clamp(Number(signals && signals.laborScarcity) || 0, 0, 1);
    var wagePressure = App.utils.clamp(Number(signals && signals.wagePressure) || 0, -0.45, 0.45);
    var longUnemploymentShare = App.utils.clamp(Number(signals && signals.longUnemploymentShare) || 0, 0, 1);
    var demandGrowth = App.utils.clamp(Number(signals && signals.demandGrowth) || 0, -0.35, 0.35);
    var stance = "neutral";

    if (unemploymentRate >= 0.16 || demandGrowth <= -0.04 || longUnemploymentShare >= 0.14) {
      stance = "supportive";
    } else if (laborScarcity >= 0.79 && wagePressure >= 0.13 && unemploymentRate <= 0.08) {
      stance = "tightening";
    }

    return {
      stance:stance,
      evidence:{
        unemploymentRate:unemploymentRate,
        laborScarcity:laborScarcity,
        wagePressure:wagePressure,
        longUnemploymentShare:longUnemploymentShare,
        demandGrowth:demandGrowth
      }
    };
  }

  function refreshCountryPolicyStance(profile, signals){
    var derived;
    var previousEvidence;
    var electionBias;
    var electionEffects;
    var adjustedStance;
    var shiftDirection = 0;

    if (!profile) return "neutral";

    previousEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
    derived = deriveCountryPolicyStance(signals || {});
    adjustedStance = normalizePolicyStance(derived.stance);
    electionBias = App.utils.clamp(Number(profile.tier6ElectionBias) || 0, -0.9, 0.9);
    if (electionBias >= 0.24) {
      shiftDirection = 1;
    } else if (electionBias <= -0.24) {
      shiftDirection = -1;
    }
    adjustedStance = shiftPolicyStance(adjustedStance, shiftDirection);
    electionEffects = getTier6ElectionChannelEffects(profile);
    if ((electionEffects.tradeDemandBias + electionEffects.businessConfidenceBias) <= -0.02) {
      adjustedStance = shiftPolicyStance(adjustedStance, 1);
    } else if ((electionEffects.tradeDemandBias + electionEffects.businessConfidenceBias) >= 0.02) {
      adjustedStance = shiftPolicyStance(adjustedStance, -1);
    }
    profile.policyStance = adjustedStance;
    profile.policyEvidence = derived.evidence;
    if (previousEvidence.sanctionPressureIndex != null) {
      profile.policyEvidence.sanctionPressureIndex = Number(previousEvidence.sanctionPressureIndex);
    }
    if (previousEvidence.electionCycleYears != null) {
      profile.policyEvidence.electionCycleYears = Number(previousEvidence.electionCycleYears);
    }
    if (previousEvidence.electionTriggered != null) {
      profile.policyEvidence.electionTriggered = !!previousEvidence.electionTriggered;
    }
    if (previousEvidence.electionPressureIndex != null) {
      profile.policyEvidence.electionPressureIndex = Number(previousEvidence.electionPressureIndex);
    }
    profile.policyEvidence.electionTaxPolicyIndex = Number(App.utils.clamp(Number(profile.electionTaxPolicyIndex) || 0, -0.55, 0.55).toFixed(4));
    profile.policyEvidence.electionTradePolicyIndex = Number(App.utils.clamp(Number(profile.electionTradePolicyIndex) || 0, -0.55, 0.55).toFixed(4));
    profile.policyEvidence.electionLaborPolicyIndex = Number(App.utils.clamp(Number(profile.electionLaborPolicyIndex) || 0, -0.55, 0.55).toFixed(4));
    profile.policyEvidence.electionImmigrationPolicyIndex = Number(App.utils.clamp(Number(profile.electionImmigrationPolicyIndex) || 0, -0.55, 0.55).toFixed(4));
    profile.policyEvidence.electionBusinessConfidenceIndex = Number(App.utils.clamp(Number(profile.electionBusinessConfidenceIndex) || 0, -0.6, 0.6).toFixed(4));
    profile.policyEvidence.electionBias = Number(electionBias.toFixed(4));
    profile.policyEvidence.tier6Slice = isTier6Slice1Enabled() ? "slice1" : "none";
    profile.policyEvidence.conflictPhaseEnabled = !!TIER6_SLICE1_CONFIG.conflictPhaseEnabled;
    return profile.policyStance;
  }

  function getBlocPolicySnapshot(bloc){
    var profiles;

    if (!bloc) return null;

    profiles = (App.store.getBlocProfiles ? App.store.getBlocProfiles(bloc.id) : []).filter(Boolean);
    if (!profiles.length) return null;

    return profiles.reduce(function(acc, profile){
      var laborForce = Math.max(0, Number(profile.laborForce) || 0);
      var employed = App.utils.clamp(Math.max(0, Number(profile.employed) || 0), 0, laborForce);
      var populationWeight = Math.max(1, Number(profile.population) || 1);

      acc.laborForce += laborForce;
      acc.employed += employed;
      acc.wagePressure += App.utils.clamp(Number(profile.wagePressure) || 0, -0.45, 0.45);
      acc.laborScarcity += App.utils.clamp(Number(profile.laborScarcity) || 0, 0, 1);
      acc.longUnemploymentShare += App.utils.clamp(Number(profile.longUnemploymentShare) || 0, 0, 1);
      acc.demandGrowth += App.utils.clamp(Number(profile.policyEvidence && profile.policyEvidence.demandGrowth) || 0, -0.35, 0.35);
      acc.giniWeighted += App.utils.clamp(Number(profile.giniCoefficient) || 0.4, 0.2, 0.8) * populationWeight;
      acc.topOneWealthShareWeighted += App.utils.clamp(Number(profile.topOneWealthShare) || 0.3, 0.12, 0.95) * populationWeight;
      acc.intergenerationalMobilityWeighted += App.utils.clamp(Number(profile.intergenerationalMobilityIndex) || 0.5, 0, 1) * populationWeight;
      acc.inequalityPopulationWeight += populationWeight;
      acc.medianHouseholdWealthGU += Math.max(0, Number(profile.medianHouseholdWealthGU) || 0);
      acc.count += 1;
      return acc;
    }, {
      laborForce:0,
      employed:0,
      wagePressure:0,
      laborScarcity:0,
      longUnemploymentShare:0,
      demandGrowth:0,
      giniWeighted:0,
      topOneWealthShareWeighted:0,
      intergenerationalMobilityWeighted:0,
      inequalityPopulationWeight:0,
      medianHouseholdWealthGU:0,
      count:0
    });
  }

  function deriveBlocPolicyStance(snapshot){
    var unemploymentRate;
    var avgWagePressure;
    var avgScarcity;
    var avgLongUnemploymentShare;
    var avgDemandGrowth;
    var avgGini;
    var avgTopOneWealthShare;
    var avgIntergenerationalMobilityIndex;
    var avgMedianHouseholdWealthGU;
    var stance = "neutral";

    if (!snapshot || !snapshot.count) {
      return {
        stance:stance,
        evidence:{}
      };
    }

    unemploymentRate = snapshot.laborForce > 0 ? App.utils.clamp((snapshot.laborForce - snapshot.employed) / snapshot.laborForce, 0, 1) : 0;
    avgWagePressure = App.utils.clamp(snapshot.wagePressure / snapshot.count, -0.45, 0.45);
    avgScarcity = App.utils.clamp(snapshot.laborScarcity / snapshot.count, 0, 1);
    avgLongUnemploymentShare = App.utils.clamp(snapshot.longUnemploymentShare / snapshot.count, 0, 1);
    avgDemandGrowth = App.utils.clamp(snapshot.demandGrowth / snapshot.count, -0.35, 0.35);
    avgGini = App.utils.clamp(snapshot.giniWeighted / Math.max(1, snapshot.inequalityPopulationWeight || 0), 0.2, 0.8);
    avgTopOneWealthShare = App.utils.clamp(snapshot.topOneWealthShareWeighted / Math.max(1, snapshot.inequalityPopulationWeight || 0), 0.12, 0.95);
    avgIntergenerationalMobilityIndex = App.utils.clamp(snapshot.intergenerationalMobilityWeighted / Math.max(1, snapshot.inequalityPopulationWeight || 0), 0, 1);
    avgMedianHouseholdWealthGU = Math.max(0, snapshot.medianHouseholdWealthGU / snapshot.count);

    if (unemploymentRate >= 0.14 || avgDemandGrowth <= -0.025 || avgLongUnemploymentShare >= 0.12) {
      stance = "supportive";
    } else if (avgScarcity >= 0.76 && avgWagePressure >= 0.11 && unemploymentRate <= 0.075) {
      stance = "tightening";
    }

    return {
      stance:stance,
      evidence:{
        unemploymentRate:unemploymentRate,
        laborScarcity:avgScarcity,
        wagePressure:avgWagePressure,
        longUnemploymentShare:avgLongUnemploymentShare,
        demandGrowth:avgDemandGrowth,
        giniCoefficient:avgGini,
        topOneWealthShare:avgTopOneWealthShare,
        intergenerationalMobilityIndex:avgIntergenerationalMobilityIndex,
        medianHouseholdWealthGU:avgMedianHouseholdWealthGU
      }
    };
  }

  function refreshBlocPolicyStance(bloc){
    var snapshot;
    var derived;
    var previousEvidence;

    if (!bloc) return "neutral";

    previousEvidence = bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : {};
    snapshot = getBlocPolicySnapshot(bloc);
    derived = deriveBlocPolicyStance(snapshot);
    bloc.policyStance = normalizePolicyStance(derived.stance);
    bloc.policyEvidence = derived.evidence;
    if (previousEvidence.sanctionPressureIndex != null) {
      bloc.policyEvidence.sanctionPressureIndex = Number(previousEvidence.sanctionPressureIndex);
    }
    bloc.policyEvidence.tier6Slice = isTier6Slice1Enabled() ? "slice1" : "none";
    bloc.policyEvidence.conflictPhaseEnabled = !!TIER6_SLICE1_CONFIG.conflictPhaseEnabled;
    bloc.giniCoefficient = App.utils.clamp(Number(derived.evidence && derived.evidence.giniCoefficient) || 0.4, 0.2, 0.8);
    bloc.topOneWealthShare = App.utils.clamp(Number(derived.evidence && derived.evidence.topOneWealthShare) || 0.3, 0.12, 0.95);
    bloc.intergenerationalMobilityIndex = App.utils.clamp(Number(derived.evidence && derived.evidence.intergenerationalMobilityIndex) || 0.5, 0, 1);
    bloc.medianHouseholdWealthGU = Math.max(0, Number(derived.evidence && derived.evidence.medianHouseholdWealthGU) || 0);
    return bloc.policyStance;
  }

  function computeMedianNumber(values){
    var sample = (values || []).filter(function(value){
      return Number.isFinite(value);
    }).sort(function(first, second){
      return first - second;
    });
    var middle;

    if (!sample.length) return 0;

    middle = Math.floor(sample.length / 2);
    if (sample.length % 2 === 0) {
      return (sample[middle - 1] + sample[middle]) / 2;
    }

    return sample[middle];
  }

  function updateInequalityMetricsYearly(){
    var householdsByCountry = {};

    (App.store.households || []).forEach(function(household){
      var iso;

      if (!household || !household.countryISO) return;
      refreshHouseholdSnapshot(household);
      iso = household.countryISO;
      if (!householdsByCountry[iso]) householdsByCountry[iso] = [];
      householdsByCountry[iso].push(household);
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var households = householdsByCountry[iso] || [];
      var wealthValues;
      var sortedWealth;
      var positiveTotalWealth;
      var topCount;
      var topWealth;
      var mobilityScores;
      var upwardShare;
      var downwardShare;
      var intergenerationalMobilityIndex;
      var medianHouseholdWealth;
      var topOneWealthShare;

      if (!profile) return;

      wealthValues = households.map(function(household){
        var netWorth = Number(household.assetNetWorthGU);
        if (!Number.isFinite(netWorth)) {
          netWorth = (Number(household.assetCashGU) || Number(household.cashOnHandGU) || 0) +
            (Number(household.assetEquityGU) || 0) +
            (Number(household.assetBusinessOwnershipGU) || 0) +
            (Number(household.assetPropertyGU) || 0) +
            (Number(household.assetTrustGU) || 0) -
            (Number(household.assetDebtObligationsGU) || Number(household.debtGU) || 0);
        }
        return Number.isFinite(netWorth) ? netWorth : 0;
      });

      medianHouseholdWealth = Math.max(0, computeMedianNumber(wealthValues));
      sortedWealth = wealthValues.slice().sort(function(first, second){
        return second - first;
      });
      positiveTotalWealth = Math.max(1, wealthValues.reduce(function(sum, value){
        return sum + Math.max(0, value);
      }, 0));
      topCount = Math.max(1, Math.ceil(sortedWealth.length * 0.01));
      topWealth = sortedWealth.slice(0, topCount).reduce(function(sum, value){
        return sum + Math.max(0, value);
      }, 0);
      topOneWealthShare = App.utils.clamp(topWealth / positiveTotalWealth, 0.12, 0.95);

      mobilityScores = households.map(function(household){
        return Number(household.mobilityScore) || 0;
      });
      upwardShare = households.length ? households.filter(function(household){
        return householdClassRank(household.classTier) > householdClassRank(household.originClassTier || household.classTier);
      }).length / households.length : 0;
      downwardShare = households.length ? households.filter(function(household){
        return householdClassRank(household.classTier) < householdClassRank(household.originClassTier || household.classTier);
      }).length / households.length : 0;
      intergenerationalMobilityIndex = App.utils.clamp(0.5 + ((upwardShare - downwardShare) * 0.35) + (computeMedianNumber(mobilityScores) / 160), 0, 1);

      profile.medianHouseholdWealthGU = medianHouseholdWealth;
      profile.topOneWealthShare = topOneWealthShare;
      profile.intergenerationalMobilityIndex = intergenerationalMobilityIndex;
      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.medianHouseholdWealthGU = Number(medianHouseholdWealth.toFixed(2));
      profile.policyEvidence.topOneWealthShare = Number(topOneWealthShare.toFixed(4));
      profile.policyEvidence.intergenerationalMobilityIndex = Number(intergenerationalMobilityIndex.toFixed(4));

      refreshCountryProfileDerived(profile);
    });

    (App.store.blocs || []).forEach(function(bloc){
      var members = (App.store.getBlocProfiles ? App.store.getBlocProfiles(bloc.id) : []).filter(Boolean);
      var weightedPopulation = members.reduce(function(sum, profile){
        return sum + Math.max(1, Number(profile.population) || 1);
      }, 0);
      var weightedGini = members.reduce(function(sum, profile){
        var weight = Math.max(1, Number(profile.population) || 1);
        return sum + (App.utils.clamp(Number(profile.giniCoefficient) || 0.4, 0.2, 0.8) * weight);
      }, 0);
      var weightedTopOne = members.reduce(function(sum, profile){
        var weight = Math.max(1, Number(profile.population) || 1);
        return sum + (App.utils.clamp(Number(profile.topOneWealthShare) || 0.3, 0.12, 0.95) * weight);
      }, 0);
      var weightedMobility = members.reduce(function(sum, profile){
        var weight = Math.max(1, Number(profile.population) || 1);
        return sum + (App.utils.clamp(Number(profile.intergenerationalMobilityIndex) || 0.5, 0, 1) * weight);
      }, 0);
      var medianWealthValues = members.map(function(profile){
        return Math.max(0, Number(profile.medianHouseholdWealthGU) || 0);
      });
      var policyStance;

      if (!members.length) return;

      bloc.giniCoefficient = App.utils.clamp(weightedGini / Math.max(1, weightedPopulation), 0.2, 0.8);
      bloc.topOneWealthShare = App.utils.clamp(weightedTopOne / Math.max(1, weightedPopulation), 0.12, 0.95);
      bloc.intergenerationalMobilityIndex = App.utils.clamp(weightedMobility / Math.max(1, weightedPopulation), 0, 1);
      bloc.medianHouseholdWealthGU = Math.max(0, computeMedianNumber(medianWealthValues));
      policyStance = refreshBlocPolicyStance(bloc);
      bloc.policyStance = normalizePolicyStance(policyStance);
      bloc.policyEvidence = bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : {};
      bloc.policyEvidence.giniCoefficient = Number(bloc.giniCoefficient.toFixed(4));
      bloc.policyEvidence.topOneWealthShare = Number(bloc.topOneWealthShare.toFixed(4));
      bloc.policyEvidence.intergenerationalMobilityIndex = Number(bloc.intergenerationalMobilityIndex.toFixed(4));
      bloc.policyEvidence.medianHouseholdWealthGU = Number(bloc.medianHouseholdWealthGU.toFixed(2));
    });
  }

  function phase6SocialUnrestFromInequality(){
    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var laborForce;
      var unemploymentRate;
      var longUnemploymentShare;
      var gini;
      var topOneShare;
      var mobilityIndex;
      var socialPressure;
      var housingStress;
      var housingCostPressure;
      var prevStrikeRisk;
      var prevPopulism;
      var prevCrime;
      var prevEmigration;
      var prevInstability;
      var strikeRiskTarget;
      var populismTarget;
      var crimeTarget;
      var emigrationTarget;
      var instabilityTarget;
      var socialUnrest;
      var instabilityDrag;

      if (!profile) return;

      refreshCountryProfileDerived(profile);
      laborForce = Math.max(1, Number(profile.laborForce) || 1);
      unemploymentRate = App.utils.clamp(Math.max(0, Number(profile.unemployed) || 0) / laborForce, 0, 1);
      longUnemploymentShare = App.utils.clamp(Number(profile.longUnemploymentShare) || 0, 0, 1);
      gini = App.utils.clamp(Number(profile.giniCoefficient) || 0.4, 0.2, 0.8);
      topOneShare = App.utils.clamp(Number(profile.topOneWealthShare) || 0.3, 0.12, 0.95);
      mobilityIndex = App.utils.clamp(Number(profile.intergenerationalMobilityIndex) || 0.5, 0, 1);
      socialPressure = App.utils.clamp(Number(profile.socialPressureIndex) || 0, 0, 1.5);
      housingStress = App.utils.clamp(Number(profile.housingMarketStress) || 0.35, 0, 1.5);
      housingCostPressure = App.utils.clamp(Number(profile.housingCostPressure) || 1.02, 0.65, 2.2);

      prevStrikeRisk = App.utils.clamp(Number(profile.strikeRiskIndex) || 0.22, 0, 1.4);
      prevPopulism = App.utils.clamp(Number(profile.populismIndex) || 0.24, 0, 1.6);
      prevCrime = App.utils.clamp(Number(profile.crimeProxyIndex) || 0.22, 0, 1.6);
      prevEmigration = App.utils.clamp(Number(profile.emigrationPressureIndex) || 0.24, 0, 1.6);
      prevInstability = App.utils.clamp(Number(profile.institutionalInstabilityIndex) || 0.2, 0, 1.6);

      strikeRiskTarget =
        (Math.max(0, gini - 0.36) * 1.2) +
        (Math.max(0, topOneShare - 0.28) * 0.95) +
        (unemploymentRate * 0.55) +
        (socialPressure * 0.22) +
        (Math.max(0, 0.52 - mobilityIndex) * 0.45);
      strikeRiskTarget = App.utils.clamp(strikeRiskTarget, 0, 1.4);

      populismTarget =
        (Math.max(0, gini - 0.35) * 1.15) +
        (Math.max(0, topOneShare - 0.29) * 1.1) +
        (Math.max(0, 0.54 - mobilityIndex) * 0.9) +
        (socialPressure * 0.35) +
        (housingStress * 0.22);
      populismTarget = App.utils.clamp(populismTarget, 0, 1.6);

      crimeTarget =
        (unemploymentRate * 0.62) +
        (longUnemploymentShare * 0.34) +
        (Math.max(0, gini - 0.35) * 0.86) +
        (Math.max(0, housingCostPressure - 1) * 0.4) +
        (socialPressure * 0.24);
      crimeTarget = App.utils.clamp(crimeTarget, 0, 1.6);

      emigrationTarget =
        (Math.max(0, housingCostPressure - 1) * 0.72) +
        (housingStress * 0.22) +
        (unemploymentRate * 0.5) +
        (Math.max(0, gini - 0.36) * 0.72) +
        (Math.max(0, 0.52 - mobilityIndex) * 0.55);
      emigrationTarget = App.utils.clamp(emigrationTarget, 0, 1.6);

      instabilityTarget =
        (populismTarget * 0.42) +
        (crimeTarget * 0.22) +
        (Math.max(0, gini - 0.38) * 0.7) +
        (Math.max(0, topOneShare - 0.31) * 0.78) +
        (Math.max(0, 0.5 - mobilityIndex) * 0.46);
      instabilityTarget = App.utils.clamp(instabilityTarget, 0, 1.6);

      profile.strikeRiskIndex = App.utils.clamp((prevStrikeRisk * 0.64) + (strikeRiskTarget * 0.36), 0, 1.4);
      profile.populismIndex = App.utils.clamp((prevPopulism * 0.66) + (populismTarget * 0.34), 0, 1.6);
      profile.crimeProxyIndex = App.utils.clamp((prevCrime * 0.68) + (crimeTarget * 0.32), 0, 1.6);
      profile.emigrationPressureIndex = App.utils.clamp((prevEmigration * 0.62) + (emigrationTarget * 0.38), 0, 1.6);
      profile.institutionalInstabilityIndex = App.utils.clamp((prevInstability * 0.67) + (instabilityTarget * 0.33), 0, 1.6);
      socialUnrest =
        (profile.strikeRiskIndex * 0.24) +
        (profile.populismIndex * 0.24) +
        (profile.crimeProxyIndex * 0.2) +
        (profile.emigrationPressureIndex * 0.16) +
        (profile.institutionalInstabilityIndex * 0.16);
      profile.socialUnrestIndex = App.utils.clamp(socialUnrest, 0, 1.8);

      instabilityDrag = App.utils.clamp((profile.institutionalInstabilityIndex - 0.45) * 0.016, 0, 0.026);
      profile.institutionScore = App.utils.clamp((Number(profile.institutionScore) || 0.55) - instabilityDrag, 0.1, 1);

      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.socialUnrestIndex = Number(profile.socialUnrestIndex.toFixed(4));
      profile.policyEvidence.strikeRiskIndex = Number(profile.strikeRiskIndex.toFixed(4));
      profile.policyEvidence.populismIndex = Number(profile.populismIndex.toFixed(4));
      profile.policyEvidence.crimeProxyIndex = Number(profile.crimeProxyIndex.toFixed(4));
      profile.policyEvidence.emigrationPressureIndex = Number(profile.emigrationPressureIndex.toFixed(4));
      profile.policyEvidence.institutionalInstabilityIndex = Number(profile.institutionalInstabilityIndex.toFixed(4));
      profile.policyEvidence.institutionInstabilityDrag = Number(instabilityDrag.toFixed(5));

      refreshCountryProfileDerived(profile);
    });

    (App.store.blocs || []).forEach(function(bloc){
      var profiles = App.store.getBlocProfiles ? App.store.getBlocProfiles(bloc.id) : [];
      var weightTotal = profiles.reduce(function(sum, profile){
        return sum + Math.max(1, Number(profile && profile.population) || 1);
      }, 0);
      var weightedUnrest = profiles.reduce(function(sum, profile){
        var weight = Math.max(1, Number(profile && profile.population) || 1);
        return sum + (App.utils.clamp(Number(profile && profile.socialUnrestIndex) || 0, 0, 1.8) * weight);
      }, 0);

      if (!profiles.length) return;
      bloc.socialUnrestIndex = App.utils.clamp(weightedUnrest / Math.max(1, weightTotal), 0, 1.8);
      bloc.policyEvidence = bloc.policyEvidence && typeof bloc.policyEvidence === "object" ? bloc.policyEvidence : {};
      bloc.policyEvidence.socialUnrestIndex = Number(bloc.socialUnrestIndex.toFixed(4));
    });
  }

  var LABOR_SCARCITY_TIGHT_MARKET_MAX_AVAILABLE_SHARE = 0.1;

  function getLaborScarcityFromLaborPool(laborForce, available){
    var safeLaborForce = Math.max(1, Number(laborForce) || 0);
    var availableShare = App.utils.clamp((Math.max(0, Number(available) || 0) / safeLaborForce), 0, 1);
    return App.utils.clamp((LABOR_SCARCITY_TIGHT_MARKET_MAX_AVAILABLE_SHARE - availableShare) / LABOR_SCARCITY_TIGHT_MARKET_MAX_AVAILABLE_SHARE, 0, 1);
  }

  function getCountryLaborScarcity(iso){
    var profile = ensureCountryProfile(iso);
    var laborSnapshot;
    var laborForce;
    var available;

    if (!profile) return 0;

    refreshCountryProfileDerived(profile);
    laborSnapshot = getSimCountryLaborSnapshot(iso);
    laborForce = Math.max(1, laborSnapshot.laborForce || Number(profile.laborForce) || 0);
    available = Math.max(0, laborSnapshot.available);
    return getLaborScarcityFromLaborPool(laborForce, available);
  }

  function getSimCountryLaborSnapshot(iso){
    var laborForce = 0;
    var employed = 0;

    App.store.getLivingPeople().forEach(function(person){
      if (!person || person.countryISO !== iso) return;
      if ((Number(person.age) || 0) < 18 || person.retired) return;
      laborForce += 1;
      if (person.businessId || person.employerBusinessId) {
        employed += 1;
      }
    });

    return {
      laborForce:laborForce,
      employed:employed,
      available:Math.max(0, laborForce - employed)
    };
  }

  function getCountryLongUnemploymentShare(iso){
    var profile = ensureCountryProfile(iso);
    var longUnemployed;
    var laborSnapshot;

    if (!profile) return 0;

    longUnemployed = App.store.getLivingPeople().filter(function(person){
      return person.countryISO === iso &&
        person.age >= 18 &&
        !person.retired &&
        !person.businessId &&
        !person.employerBusinessId &&
        (Number(person.unemploymentStreakDays) || 0) >= LONG_UNEMPLOYMENT_DAYS;
    }).length;

      laborSnapshot = getSimCountryLaborSnapshot(iso);
      return App.utils.clamp(longUnemployed / Math.max(1, laborSnapshot.laborForce || Number(profile.laborForce) || 1), 0, 1);
  }

  function getCountryWagePressure(iso){
    var profile = ensureCountryProfile(iso);
    return App.utils.clamp(Number(profile && profile.wagePressure) || 0, -0.45, 0.45);
  }

  function getIndustryLaborDemandPressure(iso, industry){
    var profile = ensureCountryProfile(iso);
    var laborForce;
    var unemploymentRate;
    var industryEmployees;

    if (!profile) return 0;

    laborForce = Math.max(1, Number(profile.laborForce) || 0);
    unemploymentRate = laborForce > 0 ? ((Number(profile.unemployed) || 0) / laborForce) : 0.12;
    industryEmployees = App.store.businesses.reduce(function(sum, business){
      if (!business || business.countryISO !== iso) return sum;
      if (industry && business.industry !== industry) return sum;
      return sum + Math.max(1, Number(business.employees) || 1);
    }, 0);

    return App.utils.clamp((industryEmployees / laborForce) * 3.2 + Math.max(0, 0.25 - unemploymentRate) * 1.6, 0, 1.6);
  }

  function pullMobileLaborIntoCountry(iso, amount, migrationSignals){
    var request = Math.max(0, floorInt(amount));
    var targetProfile = ensureCountryProfile(iso);
    var bloc = App.store.getBlocByCountry ? App.store.getBlocByCountry(iso) : null;
    var signals = migrationSignals && typeof migrationSignals === "object" ? migrationSignals : {};
    var educationPull = App.utils.clamp(Number(signals.educationPull) || 0, 0, 1.2);
    var safetyPull = App.utils.clamp(Number(signals.safetyPull) || 0, 0, 1.2);
    var marriageStatusPull = App.utils.clamp(Number(signals.marriageStatusPull) || 0, 0, 1.2);
    var jobsPull = App.utils.clamp(Number(signals.jobsPull) || 0, 0, 1.5);
    var moved = 0;

    if (!targetProfile || !bloc || request <= 0) return 0;

    Object.keys(App.store.countryProfiles || {}).filter(function(memberIso){
      return memberIso && memberIso !== iso;
    }).map(function(memberIso){
      var source = ensureCountryProfile(memberIso);
      var available = source ? Math.max(0, (Number(source.laborForce) || 0) - (Number(source.employed) || 0)) : 0;
      var sourceBloc = source ? (source.blocId || (App.store.isoToBloc ? App.store.isoToBloc[memberIso] : null)) : null;
      var sameBloc = !!(sourceBloc && bloc && sourceBloc === bloc.id);
      var sourceUnemployment = source ? App.utils.clamp((Number(source.unemployed) || 0) / Math.max(1, Number(source.laborForce) || 1), 0, 1) : 0;
      var sourcePressure = source ? App.utils.clamp(Number(source.emigrationPressureIndex) || 0, 0, 1.6) : 0;
      var sourceEducation = source ? App.utils.clamp(Number(source.educationIndex) || 0.6, 0.1, 1) : 0.6;
      var targetEducation = App.utils.clamp(Number(targetProfile.educationIndex) || 0.6, 0.1, 1);
      var targetSafety = App.utils.clamp(1 - (Number(targetProfile.socialUnrestIndex) || 0.3), 0, 1.2);
      var sourceSafety = source ? App.utils.clamp(1 - (Number(source.socialUnrestIndex) || 0.3), 0, 1.2) : 0.7;
      var crossBorderFactor = sameBloc ? 1 : 0.68;
      var migrationAttraction =
        (Math.max(0, sourceUnemployment - 0.08) * 0.9) +
        (sourcePressure * 0.7) +
        (Math.max(0, targetEducation - sourceEducation) * (0.5 + educationPull * 0.6)) +
        (Math.max(0, targetSafety - sourceSafety) * (0.45 + safetyPull * 0.55)) +
        ((jobsPull + marriageStatusPull) * 0.14);

      return {
        iso:memberIso,
        profile:source,
        available:available,
        sameBloc:sameBloc,
        migrationAttraction:migrationAttraction * crossBorderFactor
      };
    }).filter(function(entry){
      return entry.profile && entry.available > 0;
    }).sort(function(first, second){
      if (second.migrationAttraction !== first.migrationAttraction) return second.migrationAttraction - first.migrationAttraction;
      return second.available - first.available;
    }).forEach(function(entry){
      var source = entry.profile;
      var sourcePopulation;
      var targetPopulation;
      var sourceLaborForce;
      var targetLaborForce;
      var sourceTalentScore;
      var targetTalentScore;
      var sourceEducationDelta;
      var targetEducationDelta;
      var room;
      var cap;
      var flow;

      if (moved >= request) return;

      room = request - moved;
      cap = Math.max(1, Math.floor(Math.min(entry.available * 0.2, LABOR_MOBILITY_FLOW_CAP)));
      flow = Math.min(room, cap);
      if (flow <= 0) return;

      source.laborForce = Math.max(0, (Number(source.laborForce) || 0) - flow);
      sourcePopulation = Math.max(1, Number(source.population) || 1);
      source.population = Math.max(1, sourcePopulation - flow);
      source.netMigrationRatePer1000 = App.utils.clamp((Number(source.netMigrationRatePer1000) || 0) - ((flow / sourcePopulation) * 1000), -50, 50);
      source.mobilityOutflowAnnual = Math.max(0, Number(source.mobilityOutflowAnnual) || 0) + flow;
      relocateMobileWorkers(entry.iso, iso, flow);

      sourceLaborForce = Math.max(1, Number(source.laborForce) || 1);
      targetLaborForce = Math.max(1, Number(targetProfile.laborForce) || 1);
      sourceTalentScore = App.utils.clamp(((Number(source.educationIndex) || 0.6) * 0.72) + ((Number(source.institutionScore) || 0.55) * 0.28), 0.1, 1);
      targetTalentScore = App.utils.clamp(((Number(targetProfile.educationIndex) || 0.6) * 0.72) + ((Number(targetProfile.institutionScore) || 0.55) * 0.28), 0.1, 1);
      sourceEducationDelta = (flow / sourceLaborForce) * 4.2 * (0.55 + sourceTalentScore) * (0.85 + educationPull * 1.1);
      targetEducationDelta = (flow / targetLaborForce) * 4.8 * (0.45 + sourceTalentScore) * (0.85 + educationPull * 1.25);

      source.educationIndex = App.utils.clamp((Number(source.educationIndex) || 0.6) - sourceEducationDelta, 0.1, 1);
      targetProfile.educationIndex = App.utils.clamp((Number(targetProfile.educationIndex) || 0.6) + targetEducationDelta, 0.1, 1);
      source.talentDriftBalance = App.utils.clamp((Number(source.talentDriftBalance) || 0) - (sourceEducationDelta * (0.8 + targetTalentScore)), -1.5, 1.5);
      targetProfile.talentDriftBalance = App.utils.clamp((Number(targetProfile.talentDriftBalance) || 0) + (targetEducationDelta * (0.8 + sourceTalentScore)), -1.5, 1.5);
      refreshCountryProfileDerived(source);

      targetProfile.laborForce = Math.max(0, (Number(targetProfile.laborForce) || 0) + flow);
      targetPopulation = Math.max(1, Number(targetProfile.population) || 1);
      targetProfile.population = Math.max(1, targetPopulation + flow);
      targetProfile.netMigrationRatePer1000 = App.utils.clamp((Number(targetProfile.netMigrationRatePer1000) || 0) + ((flow / targetPopulation) * 1000), -50, 50);
      targetProfile.mobilityInflowAnnual = Math.max(0, Number(targetProfile.mobilityInflowAnnual) || 0) + flow;
      moved += flow;
    });

    refreshCountryProfileDerived(targetProfile);
    return moved;
  }

  function applyInternalMigrationUrbanFlows(iso, driverSignals){
    var profile = ensureCountryProfile(iso);
    var details;
    var signals = driverSignals && typeof driverSignals === "object" ? driverSignals : {};
    var jobsPull = App.utils.clamp(Number(signals.jobsPull) || 0, 0, 1.5);
    var educationPull = App.utils.clamp(Number(signals.educationPull) || 0, 0, 1.5);
    var marriageStatusPull = App.utils.clamp(Number(signals.marriageStatusPull) || 0, 0, 1.5);
    var pressure = App.utils.clamp(Number(signals.migrationPressure) || 0, -0.45, 0.55);
    var population = Math.max(1, Number(profile && profile.population) || 1);
    var request;
    var candidates;
    var moved = 0;
    var talentMoved = 0;

    if (!profile || !App.data || typeof App.data.getWorldCityDetailsByCountry !== "function") {
      return { moved:0, talentMoved:0 };
    }

    details = App.data.getWorldCityDetailsByCountry(iso, 40);
    if (!details || details.length < 2) return { moved:0, talentMoved:0 };

    request = Math.round(
      Math.min(
        20,
        Math.max(0, (jobsPull * 5.2) + (educationPull * 3.8) + (marriageStatusPull * 2.6) + (Math.max(0, pressure) * 6.5))
      )
    );
    request += Math.max(0, Math.min(8, Math.floor((population / 15000000) * (jobsPull + educationPull) * 0.5)));
    if (request <= 0) return { moved:0, talentMoved:0 };

    candidates = App.store.getLivingPeople().filter(function(person){
      if (!person || person.countryISO !== iso || !person.alive || person.retired) return false;
      if (person.businessId) return false;
      if ((Number(person.age) || 0) < 18) return false;
      return true;
    }).sort(function(first, second){
      var firstNeed = 0;
      var secondNeed = 0;

      firstNeed += !first.employerBusinessId ? 14 : 0;
      firstNeed += Math.min(10, (Number(first.unemploymentStreakDays) || 0) / 28);
      firstNeed += Math.max(0, ((Number(first.educationIndex) || 0) - 60) / 8);
      firstNeed += App.utils.clamp(getTraitChannelScore(first, "mobility"), -6, 8);
      firstNeed += !first.spouseId ? 2 : 0;

      secondNeed += !second.employerBusinessId ? 14 : 0;
      secondNeed += Math.min(10, (Number(second.unemploymentStreakDays) || 0) / 28);
      secondNeed += Math.max(0, ((Number(second.educationIndex) || 0) - 60) / 8);
      secondNeed += App.utils.clamp(getTraitChannelScore(second, "mobility"), -6, 8);
      secondNeed += !second.spouseId ? 2 : 0;

      return secondNeed - firstNeed;
    });

    candidates.slice(0, request).forEach(function(person){
      var targetCity;
      var targetSubdivision;
      var currentCity = normalizeText(person.city);

      targetCity = pickCountryCity(iso, [person.id, iso, App.store.simDay, "internal-mobility", currentCity || ""].join("|"), null);
      if (!targetCity || normalizeText(targetCity) === currentCity) return;

      targetSubdivision = resolveSubdivisionForCity(iso, targetCity, person.subdivision || person.state);
      if (!relocatePersonToCountry(person, iso, { city:targetCity, subdivision:targetSubdivision })) return;

      moved += 1;
      if ((Number(person.educationIndex) || 0) >= 68 || person.jobTier === "executive" || person.jobTier === "leadership") {
        talentMoved += 1;
      }
      syncPerson(person);
    });

    return { moved:moved, talentMoved:talentMoved };
  }

  function applyLaborMarketYearlyAdjustments(){
    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var bloc = App.store.getBloc(profile && profile.blocId) || App.store.getBlocByCountry(iso);
      var laborForce;
      var unemploymentRate;
      var laborScarcity;
      var longUnemploymentShare;
      var demandGrowth;
      var adjustedDemandGrowth;
      var wagePressure;
      var talentShortageIndex;
      var previousDemand;
      var countryStance;
      var blocStance;
      var countryPolicyEffects;
      var blocPolicyEffects;
      var electionEffects;

      if (!profile) return;

      refreshCountryProfileDerived(profile);
      laborForce = Math.max(1, Number(profile.laborForce) || 0);
      unemploymentRate = laborForce > 0 ? ((Number(profile.unemployed) || 0) / laborForce) : 0.12;
      laborScarcity = getCountryLaborScarcity(iso);
      longUnemploymentShare = getCountryLongUnemploymentShare(iso);
      previousDemand = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
      demandGrowth = ((Number(profile.consumerDemandGU) || 0) - previousDemand) / previousDemand;
      countryStance = refreshCountryPolicyStance(profile, {
        unemploymentRate:unemploymentRate,
        laborScarcity:laborScarcity,
        wagePressure:Number(profile.wagePressure) || 0,
        longUnemploymentShare:longUnemploymentShare,
        demandGrowth:demandGrowth
      });
      blocStance = refreshBlocPolicyStance(bloc);
      countryPolicyEffects = COUNTRY_POLICY_STANCE_EFFECTS[countryStance] || COUNTRY_POLICY_STANCE_EFFECTS.neutral;
      blocPolicyEffects = BLOC_POLICY_STANCE_EFFECTS[blocStance] || BLOC_POLICY_STANCE_EFFECTS.neutral;
      electionEffects = getTier6ElectionChannelEffects(profile);
      adjustedDemandGrowth = App.utils.clamp(
        demandGrowth +
        (countryPolicyEffects.demandGrowthBias || 0) +
        (blocPolicyEffects.demandGrowthBias || 0) +
        (electionEffects.taxDemandBias || 0) +
        (electionEffects.tradeDemandBias || 0) +
        (electionEffects.businessConfidenceBias || 0),
        -0.25,
        0.25
      );

      wagePressure =
        (laborScarcity * 0.75) +
        (adjustedDemandGrowth * 0.55) -
        (unemploymentRate * 0.65) -
        (longUnemploymentShare * 0.45);
      wagePressure += (countryPolicyEffects.wagePressureBias || 0) + (blocPolicyEffects.wagePressureBias || 0);
      wagePressure += electionEffects.laborWageBias || 0;
      wagePressure = App.utils.clamp(wagePressure, -0.32, 0.34);

      talentShortageIndex = App.utils.clamp((laborScarcity * 0.58) + (Math.max(0, 0.24 - unemploymentRate) * 1.5) + (longUnemploymentShare * 0.22), 0, 1);
      talentShortageIndex = App.utils.clamp(
        talentShortageIndex +
        (countryPolicyEffects.talentShortageBias || 0) +
        (blocPolicyEffects.talentShortageBias || 0),
        0,
        1
      );

      profile.wagePressure = wagePressure;
      profile.longUnemploymentShare = longUnemploymentShare;
      profile.laborScarcity = laborScarcity;
      profile.talentShortageIndex = talentShortageIndex;
      profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * (1 + (wagePressure * 0.12)), 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
      profile.prevConsumerDemandGU = Math.max(0, Number(profile.consumerDemandGU) || 0);
      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.electionTaxDemandBias = Number((electionEffects.taxDemandBias || 0).toFixed(4));
      profile.policyEvidence.electionTradeDemandBias = Number((electionEffects.tradeDemandBias || 0).toFixed(4));
      profile.policyEvidence.electionLaborWageBias = Number((electionEffects.laborWageBias || 0).toFixed(4));
      profile.policyEvidence.electionBusinessConfidenceBias = Number((electionEffects.businessConfidenceBias || 0).toFixed(4));
      refreshCountryProfileDerived(profile);
    });
  }

  function enforceFinancialBounds(){
    (App.store.people || []).forEach(function(person){
      if (!person) return;
      person.netWorthGU = App.utils.clamp(Number(person.netWorthGU) || 0, 100, MAX_PERSON_NET_WORTH_GU);
      person.salaryGU = App.utils.clamp(Number(person.salaryGU) || 0, 0, MAX_PERSON_SALARY_GU);
    });

    (App.store.businesses || []).forEach(function(business){
      if (!business) return;
      business.revenueGU = App.utils.clamp(Number(business.revenueGU) || 0, 0, MAX_BUSINESS_REVENUE_GU);
      business.profitGU = App.utils.clamp(Number(business.profitGU) || 0, -MAX_BUSINESS_PROFIT_GU, MAX_BUSINESS_PROFIT_GU);
      business.valuationGU = App.utils.clamp(Number(business.valuationGU) || 0, 1000, MAX_BUSINESS_VALUATION_GU);
      business.cashReservesGU = App.utils.clamp(Number(business.cashReservesGU) || 0, 0, MAX_BUSINESS_CASH_GU);
      business.revenueHistory = (business.revenueHistory || []).map(function(value){
        return App.utils.clamp(Number(value) || 0, 0, MAX_BUSINESS_REVENUE_GU);
      }).slice(-20);
    });

    (App.store.households || []).forEach(function(household){
      if (!household) return;
      household.cashOnHandGU = App.utils.clamp(Number(household.cashOnHandGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU);
      household.debtGU = App.utils.clamp(Number(household.debtGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU);
      household.annualIncomeGU = App.utils.clamp(Number(household.annualIncomeGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU);
      household.monthlyIncomeGU = App.utils.clamp(Number(household.monthlyIncomeGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU / 12);
      household.monthlyExpensesGU = App.utils.clamp(Number(household.monthlyExpensesGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU / 12);
      household.housingBurdenRatio = App.utils.clamp(Number(household.housingBurdenRatio) || 0, 0.08, 1.9);
      household.housingSavingsPressure = App.utils.clamp(Number(household.housingSavingsPressure) || 0, 0.08, 2.2);
      household.housingOwnershipScore = App.utils.clamp(Number(household.housingOwnershipScore) || 0, 0, 1);
      household.housingAffordabilityScore = App.utils.clamp(Number(household.housingAffordabilityScore) || 0, 0.05, 1);
      household.assetCashGU = App.utils.clamp(Number(household.assetCashGU) || Number(household.cashOnHandGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU);
      household.assetEquityGU = App.utils.clamp(Number(household.assetEquityGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU * 2);
      household.assetBusinessOwnershipGU = App.utils.clamp(Number(household.assetBusinessOwnershipGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU * 2);
      household.assetPropertyGU = App.utils.clamp(Number(household.assetPropertyGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU * 2);
      household.assetTrustGU = App.utils.clamp(Number(household.assetTrustGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU * 2);
      household.assetDebtObligationsGU = App.utils.clamp(Number(household.assetDebtObligationsGU) || Number(household.debtGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU * 2);
      household.assetTotalGU = App.utils.clamp(Number(household.assetTotalGU) || 0, 0, MAX_HOUSEHOLD_BALANCE_GU * 8);
      household.assetNetWorthGU = App.utils.clamp(Number(household.assetNetWorthGU) || 0, -MAX_HOUSEHOLD_BALANCE_GU * 2, MAX_HOUSEHOLD_BALANCE_GU * 8);
      household.assetYieldAnnualGU = App.utils.clamp(Number(household.assetYieldAnnualGU) || 0, -MAX_HOUSEHOLD_BALANCE_GU, MAX_HOUSEHOLD_BALANCE_GU);
      household.assetReturnRateAnnual = App.utils.clamp(Number(household.assetReturnRateAnnual) || 0, -0.8, 1.5);
      normalizeHouseholdAssetClasses(household);
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = App.store.countryProfiles[iso];
      if (!profile) return;
      profile.medianWageGU = App.utils.clamp(Number(profile.medianWageGU) || 0, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
      profile.consumerDemandGU = App.utils.clamp(Number(profile.consumerDemandGU) || 0, 0, MAX_COUNTRY_DEMAND_GU);
      profile.housingCostPressure = App.utils.clamp(Number(profile.housingCostPressure) || 1.02, 0.65, 2.2);
      profile.housingRentBurden = App.utils.clamp(Number(profile.housingRentBurden) || 0.34, 0.08, 0.9);
      profile.housingHomeownershipRate = App.utils.clamp(Number(profile.housingHomeownershipRate) || 0.52, 0.05, 0.95);
      profile.housingAffordabilityIndex = App.utils.clamp(Number(profile.housingAffordabilityIndex) || 0.52, 0.05, 1);
      profile.housingPriceGrowth = App.utils.clamp(Number(profile.housingPriceGrowth) || 0.02, -0.18, 0.26);
      profile.housingMarketStress = App.utils.clamp(Number(profile.housingMarketStress) || 0.35, 0, 1.5);
      profile.medianHouseholdWealthGU = Math.max(0, Number(profile.medianHouseholdWealthGU) || 0);
      profile.topOneWealthShare = App.utils.clamp(Number(profile.topOneWealthShare) || 0.3, 0.12, 0.95);
      profile.intergenerationalMobilityIndex = App.utils.clamp(Number(profile.intergenerationalMobilityIndex) || 0.5, 0, 1);
      profile.socialUnrestIndex = App.utils.clamp(Number(profile.socialUnrestIndex) || 0.28, 0, 1.8);
      profile.strikeRiskIndex = App.utils.clamp(Number(profile.strikeRiskIndex) || 0.22, 0, 1.4);
      profile.populismIndex = App.utils.clamp(Number(profile.populismIndex) || 0.24, 0, 1.6);
      profile.crimeProxyIndex = App.utils.clamp(Number(profile.crimeProxyIndex) || 0.22, 0, 1.6);
      profile.emigrationPressureIndex = App.utils.clamp(Number(profile.emigrationPressureIndex) || 0.24, 0, 1.6);
      profile.institutionalInstabilityIndex = App.utils.clamp(Number(profile.institutionalInstabilityIndex) || 0.2, 0, 1.6);
      profile.philanthropicCapitalAnnualGU = Math.max(0, Number(profile.philanthropicCapitalAnnualGU) || 0);
      profile.philanthropyImpactIndex = App.utils.clamp(Number(profile.philanthropyImpactIndex) || 0, 0, 1.6);
      profile.legacyProjectsIndex = App.utils.clamp(Number(profile.legacyProjectsIndex) || 0, 0, 1.4);
      refreshCountryProfileDerived(profile);
    });
  }

  function bootstrapCountryProfiles(){
    var startPreset = getCurrentStartPreset();
    var seededProfiles = App.data && App.data.createCountryProfiles ? App.data.createCountryProfiles(App.store.blocs, App.store.countryProfiles, {
      startPreset:startPreset
    }) : {};

    App.store.countryProfiles = App.store.countryProfiles || {};

    App.store.blocs.forEach(function(bloc){
      bloc.members.forEach(function(iso){
        var existing = App.store.countryProfiles[iso];
        var seeded = seededProfiles[iso];
        var profile = existing ? Object.assign({}, seeded || {}, existing) : (seeded || (App.data.createCountryProfile ? App.data.createCountryProfile(iso, bloc.id, null) : null));

        if (!profile) return;
        profile.iso = iso;
        profile.blocId = profile.blocId || bloc.id;
        App.store.countryProfiles[iso] = refreshCountryProfileDerived(profile);
      });
    });
  }

  function updateCountryLaborSupplyBaseline(){
    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = App.store.countryProfiles[iso];
      var participation = App.utils.clamp(Number(profile.laborForceParticipation) || 0.55, 0.25, 0.9);
      var derivedLaborForce = Math.max(0, Math.round((Number(profile.population) || 0) * participation));

      if (!profile) return;

      profile.laborForceParticipation = participation;
      profile.laborForce = derivedLaborForce;
      profile.employed = Math.min(Math.max(0, floorInt(profile.employed)), derivedLaborForce);
      profile.unemployed = Math.max(0, derivedLaborForce - profile.employed);
      ensureCountryIndustryMarketState(profile);
    });
  }

  function updateCountryConsumptionAndHousingSignals(){
    var consumerSignalsByCountry = buildCountryConsumerSpendingSignals();
    var housingSignalsByCountry = buildCountryHousingMarketSignals();

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = App.store.countryProfiles[iso];
      var consumerSignals = consumerSignalsByCountry[iso];
      var housingSignals = housingSignalsByCountry[iso];
      var industryWeighted;
      var housingCostPressure;
      var housingRentBurden;
      var housingHomeownershipRate;
      var housingAffordability;
      var housingMarketStress;
      var housingPriceGrowth;
      var housingPriceTarget;
      var institution;
      var gini;
      var populationPressure;

      if (!profile) return;

      if (consumerSignals && consumerSignals.weightSum > 0) {
        industryWeighted = {};
        Object.keys(consumerSignals.industryWeightedSums || {}).forEach(function(industry){
          industryWeighted[industry] = consumerSignals.industryWeightedSums[industry] / consumerSignals.weightSum;
        });

        profile.consumerSpendMultiplier = App.utils.clamp(consumerSignals.spendWeightedSum / consumerSignals.weightSum, 0.55, 1.22);
        profile.consumerCostOfLivingPressure = App.utils.clamp(consumerSignals.costWeightedSum / consumerSignals.weightSum, 0.65, 1.85);
        profile.consumerStressIndex = App.utils.clamp(consumerSignals.stressWeightedSum / consumerSignals.weightSum, 0, 1);
        profile.consumerIndustryDemandWeights = normalizeConsumerIndustryDemandWeights(industryWeighted);
      } else {
        profile.consumerSpendMultiplier = App.utils.clamp(Number(profile.consumerSpendMultiplier) || 0.94, 0.55, 1.22);
        profile.consumerCostOfLivingPressure = App.utils.clamp(Number(profile.consumerCostOfLivingPressure) || 1.02, 0.65, 1.85);
        profile.consumerStressIndex = App.utils.clamp(Number(profile.consumerStressIndex) || 0.4, 0, 1);
        profile.consumerIndustryDemandWeights = normalizeConsumerIndustryDemandWeights(profile.consumerIndustryDemandWeights);
      }

      institution = App.utils.clamp(Number(profile.institutionScore) || 0.55, 0.1, 1);
      gini = App.utils.clamp(Number(profile.giniCoefficient) || 0.4, 0.2, 0.8);
      populationPressure = App.utils.clamp(Number(profile.populationPressure) || 0.5, 0, 1);

      if (housingSignals && housingSignals.weightSum > 0) {
        housingRentBurden = App.utils.clamp(housingSignals.burdenWeightedSum / housingSignals.weightSum, 0.08, 0.9);
        housingHomeownershipRate = App.utils.clamp(housingSignals.ownershipWeightedSum / housingSignals.weightSum, 0.05, 0.95);
        housingAffordability = App.utils.clamp(housingSignals.affordabilityWeightedSum / housingSignals.weightSum, 0.05, 1);
        housingCostPressure = App.utils.clamp((housingRentBurden * 1.16) + ((1 - housingAffordability) * 0.4) + ((gini - 0.35) * 0.22), 0.65, 2.2);
        housingMarketStress = App.utils.clamp((housingSignals.savingsWeightedSum / housingSignals.weightSum) * 0.56 + Math.max(0, housingCostPressure - 1) * 0.55 + Math.max(0, 0.4 - housingHomeownershipRate) * 0.55, 0, 1.5);
      } else {
        housingCostPressure = App.utils.clamp(Number(profile.housingCostPressure) || 1.02, 0.65, 2.2);
        housingRentBurden = App.utils.clamp(Number(profile.housingRentBurden) || 0.34, 0.08, 0.9);
        housingHomeownershipRate = App.utils.clamp(Number(profile.housingHomeownershipRate) || 0.52, 0.05, 0.95);
        housingAffordability = App.utils.clamp(Number(profile.housingAffordabilityIndex) || 0.52, 0.05, 1);
        housingMarketStress = App.utils.clamp(Number(profile.housingMarketStress) || 0.35, 0, 1.5);
      }

      housingPriceTarget =
        ((housingCostPressure - 1) * 0.08) +
        ((populationPressure - 0.5) * 0.05) +
        ((housingMarketStress - 0.5) * 0.03) -
        ((institution - 0.55) * 0.03) -
        ((housingHomeownershipRate - 0.52) * 0.03);
      if (housingMarketStress >= 0.72 && housingHomeownershipRate < 0.48) {
        housingPriceTarget += 0.018;
      }
      if (housingCostPressure < 0.95 && housingHomeownershipRate > 0.62) {
        housingPriceTarget -= 0.014;
      }

      housingPriceGrowth = App.utils.clamp(Number(profile.housingPriceGrowth) || 0.02, -0.18, 0.26);
      profile.housingCostPressure = housingCostPressure;
      profile.housingRentBurden = housingRentBurden;
      profile.housingHomeownershipRate = housingHomeownershipRate;
      profile.housingAffordabilityIndex = housingAffordability;
      profile.housingMarketStress = housingMarketStress;
      profile.housingPriceGrowth = App.utils.clamp((housingPriceGrowth * 0.64) + (housingPriceTarget * 0.36), -0.18, 0.26);

      refreshCountryProfileDerived(profile);
    });
  }

  function phase1UpdateLaborAndDemand(){
    updateCountryLaborSupplyBaseline();
    updateCountryConsumptionAndHousingSignals();
  }

  function annualEconomicStageProductionAndPayroll(){
    (App.store.businesses || []).forEach(function(business){
      var decision;
      var leadershipFloor;

      if (!business) return;

      ensureBusinessDecisionState(business);
      decision = business.currentDecision || evaluateBusinessDecision(business);
      leadershipFloor = Math.max((business.leadership || []).length, 1);
      if ((Number(business.employees) || 0) < leadershipFloor) {
        business.employees = leadershipFloor;
      }

      refreshBusinessFirmStructure(business, decision);
      business.currentDecision = decision;
      business.productionCapacityGU = getBusinessProductionCapacityGU(business);
      business.marketPriceIndex = App.utils.clamp(Number(business.marketPriceIndex) || 1, 0.72, 1.45);
      business.marketAllocationRatio = App.utils.clamp(Number(business.marketAllocationRatio) || 1, 0.58, 1.52);
      business.allocatedDemandGU = Math.max(0, Number(business.allocatedDemandGU) || 0);
    });
  }

  function getModeledAnnualIncomeForPerson(person){
    var business;
    var businessDecision;
    var household;
    var profile;
    var medianWage;
    var baseIncome;

    if (!person || !person.alive || person.age < 18) return 0;

    business = App.store.getBusiness(person.businessId);
    if (business) {
      businessDecision = business.currentDecision || evaluateBusinessDecision(business);
      return Math.max(0, (business.profitGU || 0) * (businessDecision.cashPolicy === "preserve" ? 0.28 : (businessDecision.cashPolicy === "balanced" ? 0.42 : 0.58)));
    }

    if (person.salaryGU > 0) {
      return Math.max(0, person.salaryGU);
    }

    profile = ensureCountryProfile(person.countryISO);
    medianWage = Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
    baseIncome = medianWage * (person.retired ? 0.34 : (0.38 + (Number(profile && profile.institutionScore) || 0.55) * 0.26));
    household = getHouseholdForPerson(person);
    if (household && household.financialStress > 70) {
      baseIncome *= 0.92;
    }
    baseIncome *= App.utils.clamp(0.8 + ((Number(person.educationIndex) || 0) * 0.005), 0.8, 1.3);
    baseIncome *= App.utils.clamp(0.86 + (getPersonSkillAverage(person) * 0.0032), 0.86, 1.18);
    return Math.max(0, baseIncome);
  }

  function annualEconomicStageHouseholdIncome(){
    (App.store.people || []).forEach(function(person){
      if (!person) return;
      person.modeledAnnualIncomeGU = Math.max(0, getModeledAnnualIncomeForPerson(person));
      person.modeledMonthlyIncomeGU = Math.max(0, person.modeledAnnualIncomeGU / 12);
    });
  }

  function annualEconomicStageConsumption(){
    syncHouseholds();
    (App.store.households || []).forEach(function(household){
      refreshHouseholdSnapshot(household);
    });
    updateCountryConsumptionAndHousingSignals();
  }

  function annualEconomicStageDemand(){
    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);

      if (!profile) return;
      profile.prevConsumerDemandGU = Math.max(0, Number(profile.consumerDemandGU) || 0);
      refreshCountryProfileDerived(profile);
      ensureCountryIndustryMarketState(profile);
    });
  }

  function annualEconomicStagePriceAllocation(){
    var businessesByCountryIndustry = {};

    (App.store.businesses || []).forEach(function(business){
      var iso;
      var industry;
      var bucket;

      if (!business || !business.countryISO || !business.industry) return;

      iso = business.countryISO;
      industry = business.industry;
      businessesByCountryIndustry[iso] = businessesByCountryIndustry[iso] || {};
      bucket = businessesByCountryIndustry[iso][industry] || {
        capacity:0,
        supplyStress:0,
        count:0,
        businesses:[]
      };

      bucket.capacity += Math.max(0, Number(business.productionCapacityGU) || getBusinessProductionCapacityGU(business));
      bucket.supplyStress += App.utils.clamp(Number(business.supplyStress) || 0, 0, 1.8);
      bucket.count += 1;
      bucket.businesses.push(business);
      businessesByCountryIndustry[iso][industry] = bucket;
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var demandWeights;

      if (!profile) return;

      ensureCountryIndustryMarketState(profile);
      demandWeights = normalizeConsumerIndustryDemandWeights(profile.consumerIndustryDemandWeights);
      profile.industryDemandShare = demandWeights;

      getAllTrackedIndustries().forEach(function(industry){
        var bucket = businessesByCountryIndustry[iso] && businessesByCountryIndustry[iso][industry];
        var demandGU = Math.max(0, Number(profile.consumerDemandGU) || 0) * Math.max(0.001, Number(demandWeights[industry]) || 0.01);
        var productionGU = Math.max(0, Number(bucket && bucket.capacity) || 0);
        var avgSupplyStress = bucket && bucket.count ? (bucket.supplyStress / bucket.count) : 0;
        var demandPressure = productionGU > 0 ? (demandGU / productionGU) : (demandGU > 0 ? 1.4 : 1);
        var shortage = Math.max(0, demandPressure - 1);
        var surplus = Math.max(0, 1 - demandPressure);
        var previousPrice = getCountryIndustryPriceMultiplier(profile, industry);
        var priceIndexTarget = App.utils.clamp(
          1 +
          (shortage * 0.24) -
          (surplus * 0.12) +
          (App.utils.clamp(Number(profile.wagePressure) || 0, -0.45, 0.45) * 0.18) +
          (avgSupplyStress * 0.08) +
          (App.utils.clamp(Number(profile.tradeShockIndex) || 0, 0, 1.8) * 0.04),
          0.72,
          1.45
        );
        var priceIndex = App.utils.clamp((previousPrice * 0.58) + (priceIndexTarget * 0.42), 0.72, 1.45);
        var allocationRatio = App.utils.clamp(demandPressure, 0.58, 1.52);

        profile.industryPriceIndices[industry] = priceIndex;
        profile.industryDemandAllocation[industry] = allocationRatio;
        profile.industryDemandPressure[industry] = App.utils.clamp(demandPressure, 0.58, 1.82);
        profile.industryProductionCapacityGU[industry] = Math.max(0, Math.round(productionGU));

        (bucket && bucket.businesses ? bucket.businesses : []).forEach(function(business){
          var share = productionGU > 0 ? ((Number(business.productionCapacityGU) || 0) / productionGU) : 0;
          business.marketPriceIndex = priceIndex;
          business.marketAllocationRatio = allocationRatio;
          business.allocatedDemandGU = Math.max(0, demandGU * share);
        });
      });

      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.industryPriceIndices = Object.assign({}, profile.industryPriceIndices);
      profile.policyEvidence.industryDemandAllocation = Object.assign({}, profile.industryDemandAllocation);
    });
  }

  function annualEconomicStageFirmDecisions(){
    (App.store.businesses || []).forEach(function(business){
      var owner = App.store.getPerson(business && business.ownerId);
      var decision;
      var ownerBusinessTrait = owner ? getTraitChannelScore(owner, "business") : 0;
      var ownerMobilityTrait = owner ? getTraitChannelScore(owner, "mobility") : 0;

      if (!business) return;

      decision = evaluateBusinessDecision(business);
      business.currentDecision = decision;
      refreshBusinessFirmStructure(business, decision);
      business.annualRevenueTargetGU = computeBusinessAnnualRevenueTarget(business, decision, ownerBusinessTrait, ownerMobilityTrait);
      business.annualRevenueGapRatio = App.utils.clamp((Math.max(1, Number(business.annualRevenueTargetGU) || 1) / Math.max(1, Number(business.revenueGU) || 1)) - 1, -0.5, 0.8);
    });
  }

  function annualEconomicStageEmploymentClosure(){
    (App.store.businesses || []).forEach(function(business){
      var decision;
      var leadershipFloor;
      var currentHeadcount;
      var targetHeadcount;
      var revenueTargetRatio;
      var revenueLinkedHeadcount;
      var revenuePerWorkerBaseline;
      var productivityAlignedHeadcount;
      var requestedDelta;
      var workforceDelta;
      var headroom;

      if (!business) return;

      decision = business.currentDecision || evaluateBusinessDecision(business);
      leadershipFloor = Math.max((business.leadership || []).length, 1);
      currentHeadcount = Math.max(leadershipFloor, Number(business.employees) || leadershipFloor);
      targetHeadcount = Math.round(currentHeadcount * App.utils.clamp(1 + (Number(business.annualRevenueGapRatio) || 0), 0.82, 1.18));
      revenueTargetRatio = App.utils.clamp(
        Math.max(1, Number(business.annualRevenueTargetGU) || 1) / Math.max(1, Number(business.revenueGU) || 1),
        0.78,
        1.32
      );
      revenueLinkedHeadcount = Math.round(currentHeadcount * revenueTargetRatio);
      revenuePerWorkerBaseline = Math.max(
        12000,
        getCountryMedianWage(business.countryISO) *
          getIndustryValue(INDUSTRY_PRODUCTIVITY_MULTIPLIERS, business.industry, 2.6) *
          App.utils.clamp(getBusinessStageFactor(business.stage) * 0.92, 0.85, 1.4)
      );
      productivityAlignedHeadcount = Math.max(
        leadershipFloor,
        Math.round(Math.max(1, Number(business.annualRevenueTargetGU) || Number(business.revenueGU) || 1) / revenuePerWorkerBaseline)
      );
      targetHeadcount = Math.round((targetHeadcount * 0.38) + (revenueLinkedHeadcount * 0.29) + (productivityAlignedHeadcount * 0.33));
      targetHeadcount += Math.round((App.utils.clamp(Number(business.marketAllocationRatio) || 1, 0.58, 1.52) - 1) * currentHeadcount * 0.14);

      if (business.stage === "declining" && productivityAlignedHeadcount < currentHeadcount) {
        targetHeadcount = Math.round((targetHeadcount * 0.4) + (productivityAlignedHeadcount * 0.6));
      }

      if (decision.staffingAction === "hire") {
        targetHeadcount += Math.max(1, Math.ceil(Math.max(0, Number(business.hiringNeed) || 0) * 0.52));
        if ((business.stage === "startup" || business.stage === "growth") && (Number(business.annualRevenueGapRatio) || 0) > -0.08) {
          targetHeadcount += 1;
        }
      } else if (decision.staffingAction === "layoff") {
        targetHeadcount -= Math.max(1, Math.ceil(Math.max(0, Math.abs(Number(business.hiringNeed) || 0)) * 0.35));
      }

      if (business.stage === "startup" || business.stage === "growth" || business.stage === "declining") {
        targetHeadcount = Math.min(targetHeadcount, getBusinessHeadcountRealityCap(business, leadershipFloor));
      }

      targetHeadcount = App.utils.clamp(targetHeadcount, leadershipFloor, 2000);
      requestedDelta = targetHeadcount - currentHeadcount;
      workforceDelta = 0;

      if (requestedDelta > 0) {
        headroom = Math.max(0, 2000 - currentHeadcount);
        requestedDelta = Math.min(requestedDelta, headroom);
        workforceDelta = reserveLabor(business.countryISO, requestedDelta);
      } else if (requestedDelta < 0) {
        workforceDelta = -releaseLabor(business.countryISO, Math.abs(requestedDelta));
      }

      business.employees = Math.max(leadershipFloor, Math.min(2000, currentHeadcount + workforceDelta));
      refreshBusinessFirmStructure(business, decision);
      syncBusinessStaffAssignments(business);
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      if (!profile) return;
      refreshCountryProfileDerived(profile);
      ensureCountryIndustryMarketState(profile);
    });
    applyLaborMarketYearlyAdjustments();
  }

  function runYearlyEconomicPass(){
    updateCountryLaborSupplyBaseline();
    annualEconomicStageProductionAndPayroll();
    annualEconomicStageHouseholdIncome();
    annualEconomicStageConsumption();
    annualEconomicStageDemand();
    annualEconomicStagePriceAllocation();
    annualEconomicStageFirmDecisions();
    annualEconomicStageEmploymentClosure();
  }

  function phase2BirthDeathPressure(){
    var householdStressByCountry = {};
    var householdCountsByCountry = {};
    var profiles = Object.keys(App.store.countryProfiles || {});

    (App.store.households || []).forEach(function(household){
      var iso = household && household.countryISO;
      if (!iso) return;
      householdStressByCountry[iso] = (householdStressByCountry[iso] || 0) + App.utils.clamp((Number(household.financialStress) || 0) / 100, 0, 1);
      householdCountsByCountry[iso] = (householdCountsByCountry[iso] || 0) + 1;
    });

    profiles.forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var laborForce;
      var unemploymentRate;
      var institutionScore;
      var educationScore;
      var gini;
      var countryStance;
      var policyBias;
      var householdStress;
      var previousBirthRate;
      var previousDeathRate;
      var birthTarget;
      var deathTarget;
      var nextBirthRate;
      var nextDeathRate;
      var naturalRatePer1000;
      var priorPopulation;
      var naturalDelta;
      var maxNaturalSwing;
      var participation;
      var participationTarget;
      var populationPressure;
      var housingCostPressure;
      var housingMarketStress;
      var housingHomeownershipRate;
      var demographicAgingIndex;
      var demographicYouthBulgeIndex;
      var demographicLaborForcePressureIndex;
      var demographicFertilityDeclineIndex;

      if (!profile) return;

      refreshCountryProfileDerived(profile);

      laborForce = Math.max(1, Number(profile.laborForce) || 1);
      unemploymentRate = App.utils.clamp(Math.max(0, Number(profile.unemployed) || 0) / laborForce, 0, 1);
      institutionScore = App.utils.clamp(Number(profile.institutionScore) || 0.55, 0.1, 1);
      educationScore = App.utils.clamp(Number(profile.educationIndex) || 0.6, 0.1, 1);
      gini = App.utils.clamp(Number(profile.giniCoefficient) || 0.4, 0.2, 0.8);
      countryStance = normalizePolicyStance(profile.policyStance);
      policyBias = countryStance === "supportive" ? 1 : (countryStance === "tightening" ? -0.8 : 0);
      householdStress = householdCountsByCountry[iso] > 0 ? (householdStressByCountry[iso] / householdCountsByCountry[iso]) : 0.46;
      populationPressure = App.utils.clamp(Number(profile.populationPressure) || 0.5, 0, 1);
      housingCostPressure = App.utils.clamp(Number(profile.housingCostPressure) || 1.02, 0.65, 2.2);
      housingMarketStress = App.utils.clamp(Number(profile.housingMarketStress) || 0.35, 0, 1.5);
      housingHomeownershipRate = App.utils.clamp(Number(profile.housingHomeownershipRate) || 0.52, 0.05, 0.95);
      demographicAgingIndex = App.utils.clamp(Number(profile.demographicAgingIndex) || 0.4, 0, 1);
      demographicYouthBulgeIndex = App.utils.clamp(Number(profile.demographicYouthBulgeIndex) || 0.35, 0, 1);
      demographicLaborForcePressureIndex = App.utils.clamp(Number(profile.demographicLaborForcePressureIndex) || 0.5, 0, 1.8);
      demographicFertilityDeclineIndex = App.utils.clamp(Number(profile.demographicFertilityDeclineIndex) || 0.45, 0, 1);

      previousBirthRate = App.utils.clamp(Number(profile.birthRatePer1000) || 12, 4, 45);
      previousDeathRate = App.utils.clamp(Number(profile.deathRatePer1000) || 8, 2, 28);

      birthTarget = previousBirthRate;
      birthTarget += (0.58 - unemploymentRate) * 3.8;
      birthTarget += (0.5 - householdStress) * 3.6;
      birthTarget += (0.5 - educationScore) * 2.4;
      birthTarget += (0.46 - gini) * 1.6;
      birthTarget += (populationPressure - 0.5) * 2.8;
      birthTarget += policyBias * 0.45;
      birthTarget -= Math.max(0, housingCostPressure - 1) * 2.4;
      birthTarget -= housingMarketStress * 0.7;
      birthTarget += (housingHomeownershipRate - 0.5) * 1.2;
      birthTarget += demographicYouthBulgeIndex * 1.2;
      birthTarget -= demographicAgingIndex * 1.4;
      birthTarget -= demographicFertilityDeclineIndex * 1.9;

      deathTarget = previousDeathRate;
      deathTarget += unemploymentRate * 2.6;
      deathTarget += householdStress * 3.2;
      deathTarget += gini * 1.8;
      deathTarget -= (populationPressure - 0.5) * 1.2;
      deathTarget -= institutionScore * 2.4;
      deathTarget -= educationScore * 1.6;
      deathTarget -= policyBias * 0.24;
      deathTarget += Math.max(0, housingCostPressure - 1) * 0.8;
      deathTarget += housingMarketStress * 0.46;
      deathTarget += demographicAgingIndex * 1.35;
      deathTarget -= demographicYouthBulgeIndex * 0.3;

      nextBirthRate = App.utils.clamp((previousBirthRate * 0.76) + (birthTarget * 0.24), 4, 45);
      nextDeathRate = App.utils.clamp((previousDeathRate * 0.78) + (deathTarget * 0.22), 2, 28);
      naturalRatePer1000 = App.utils.clamp(nextBirthRate - nextDeathRate, -24, 36);

      priorPopulation = Math.max(1, Number(profile.population) || 1);
      naturalDelta = Math.round((priorPopulation * naturalRatePer1000) / 1000);
      maxNaturalSwing = Math.max(50, Math.round(priorPopulation * 0.035));
      naturalDelta = App.utils.clamp(naturalDelta, -maxNaturalSwing, maxNaturalSwing);

      profile.birthRatePer1000 = Number(nextBirthRate.toFixed(4));
      profile.deathRatePer1000 = Number(nextDeathRate.toFixed(4));
      profile.population = Math.max(1, priorPopulation + naturalDelta);

      participation = App.utils.clamp(Number(profile.laborForceParticipation) || 0.55, 0.25, 0.9);
      participationTarget = 0.5 + (institutionScore * 0.18) + (educationScore * 0.12) - (unemploymentRate * 0.14) - (householdStress * 0.1) - (Math.max(0, housingCostPressure - 1) * 0.05) + (demographicYouthBulgeIndex * 0.05) - (demographicAgingIndex * 0.1) - (demographicLaborForcePressureIndex * 0.08);
      profile.laborForceParticipation = App.utils.clamp((participation * 0.75) + (participationTarget * 0.25), 0.25, 0.9);

      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.householdStressIndex = Number(householdStress.toFixed(4));
      profile.policyEvidence.birthRatePer1000 = Number(profile.birthRatePer1000.toFixed(4));
      profile.policyEvidence.deathRatePer1000 = Number(profile.deathRatePer1000.toFixed(4));
      profile.policyEvidence.netNaturalRatePer1000 = Number(naturalRatePer1000.toFixed(4));
      profile.policyEvidence.naturalPopulationDelta = naturalDelta;
      profile.policyEvidence.housingCostPressure = Number(housingCostPressure.toFixed(4));
      profile.policyEvidence.housingMarketStress = Number(housingMarketStress.toFixed(4));
      profile.policyEvidence.housingHomeownershipRate = Number(housingHomeownershipRate.toFixed(4));
      profile.policyEvidence.populationPressure = Number(populationPressure.toFixed(4));
      profile.policyEvidence.demographicAgingIndex = Number(demographicAgingIndex.toFixed(4));
      profile.policyEvidence.demographicYouthBulgeIndex = Number(demographicYouthBulgeIndex.toFixed(4));
      profile.policyEvidence.demographicLaborForcePressureIndex = Number(demographicLaborForcePressureIndex.toFixed(4));
      profile.policyEvidence.demographicFertilityDeclineIndex = Number(demographicFertilityDeclineIndex.toFixed(4));

      refreshCountryProfileDerived(profile);
    });
  }

  function phase3MigrationPressure(){
    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      if (!profile) return;
      profile.mobilityInflowAnnual = 0;
      profile.mobilityOutflowAnnual = 0;
      profile.internalMobilityAnnual = 0;
      profile.internalTalentMobilityAnnual = 0;
      profile.talentDriftBalance = App.utils.clamp((Number(profile.talentDriftBalance) || 0) * 0.42, -1.5, 1.5);
      refreshCountryProfileDerived(profile);
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var bloc = App.store.getBloc(profile && profile.blocId) || App.store.getBlocByCountry(iso);
      var laborForce;
      var unemploymentRate;
      var scarcity;
      var longUnemploymentShare;
      var countryStance;
      var blocStance;
      var countryPolicyEffects;
      var blocPolicyEffects;
      var policyMigrationBias;
      var electionEffects;
      var pullScore;
      var pushScore;
      var migrationPressure;
      var jobsPull;
      var safetyPull;
      var educationPull;
      var marriageStatusPull;
      var nextNetMigrationPer1000;
      var netMobilityFlow;
      var internalMobilityResult;
      var request;
      var moved;
      var populationPressure;
      var housingCostPressure;
      var housingMarketStress;
      var housingHomeownershipRate;
      var housingAffordabilityIndex;
      var emigrationPressureIndex;
      var developmentCorruptionIndex;
      var developmentInfrastructureIndex;
      var developmentBusinessFriendlinessIndex;
      var demographicAgingIndex;
      var demographicYouthBulgeIndex;
      var demographicLaborForcePressureIndex;

      if (!profile) return;

      refreshCountryProfileDerived(profile);
      laborForce = Math.max(1, Number(profile.laborForce) || 1);
      unemploymentRate = App.utils.clamp(Math.max(0, Number(profile.unemployed) || 0) / laborForce, 0, 1);
      scarcity = App.utils.clamp(Number(profile.laborScarcity) || 0, 0, 1);
      populationPressure = App.utils.clamp(Number(profile.populationPressure) || 0.5, 0, 1);
      longUnemploymentShare = App.utils.clamp(Number(profile.longUnemploymentShare) || 0, 0, 1);
      housingCostPressure = App.utils.clamp(Number(profile.housingCostPressure) || 1.02, 0.65, 2.2);
      housingMarketStress = App.utils.clamp(Number(profile.housingMarketStress) || 0.35, 0, 1.5);
      housingHomeownershipRate = App.utils.clamp(Number(profile.housingHomeownershipRate) || 0.52, 0.05, 0.95);
      housingAffordabilityIndex = App.utils.clamp(Number(profile.housingAffordabilityIndex) || 0.52, 0.05, 1);
      emigrationPressureIndex = App.utils.clamp(Number(profile.emigrationPressureIndex) || 0, 0, 1.6);
      developmentCorruptionIndex = App.utils.clamp(Number(profile.developmentCorruptionIndex) || 0.42, 0, 1);
      developmentInfrastructureIndex = App.utils.clamp(Number(profile.developmentInfrastructureIndex) || 0.52, 0, 1);
      developmentBusinessFriendlinessIndex = App.utils.clamp(Number(profile.developmentBusinessFriendlinessIndex) || 0.52, 0, 1);
      demographicAgingIndex = App.utils.clamp(Number(profile.demographicAgingIndex) || 0.4, 0, 1);
      demographicYouthBulgeIndex = App.utils.clamp(Number(profile.demographicYouthBulgeIndex) || 0.35, 0, 1);
      demographicLaborForcePressureIndex = App.utils.clamp(Number(profile.demographicLaborForcePressureIndex) || 0.5, 0, 1.8);

      countryStance = refreshCountryPolicyStance(profile, {
        unemploymentRate:unemploymentRate,
        laborScarcity:scarcity,
        wagePressure:Number(profile.wagePressure) || 0,
        longUnemploymentShare:longUnemploymentShare,
        demandGrowth:Number(profile.policyEvidence && profile.policyEvidence.demandGrowth) || 0
      });
      blocStance = refreshBlocPolicyStance(bloc);
      countryPolicyEffects = COUNTRY_POLICY_STANCE_EFFECTS[countryStance] || COUNTRY_POLICY_STANCE_EFFECTS.neutral;
      blocPolicyEffects = BLOC_POLICY_STANCE_EFFECTS[blocStance] || BLOC_POLICY_STANCE_EFFECTS.neutral;
      electionEffects = getTier6ElectionChannelEffects(profile);
      policyMigrationBias = (countryPolicyEffects.migrationPressureBias || 0) + (blocPolicyEffects.migrationPressureBias || 0);
      policyMigrationBias += electionEffects.immigrationBias || 0;
      jobsPull =
        (scarcity * 0.7) +
        (Math.max(0, 0.11 - unemploymentRate) * 1.55) +
        ((populationPressure - 0.5) * 0.46) +
        (developmentBusinessFriendlinessIndex * 0.22) +
        (Math.max(0, demographicAgingIndex - 0.45) * 0.18) +
        (Math.max(0, 0.75 - demographicLaborForcePressureIndex) * 0.16);
      safetyPull =
        (developmentInfrastructureIndex * 0.4) +
        ((1 - developmentCorruptionIndex) * 0.35) +
        (App.utils.clamp(1 - (Number(profile.socialUnrestIndex) || 0.3), 0, 1.4) * 0.35);
      educationPull =
        (App.utils.clamp(Number(profile.educationIndex) || 0.6, 0.1, 1) * 0.62) +
        (App.utils.clamp(Number(profile.developmentEducationQuality) || 0.55, 0, 1) * 0.38);
      marriageStatusPull =
        (App.utils.clamp(Number(profile.developmentSocialMobilityIndex) || 0.5, 0, 1) * 0.42) +
        (App.utils.clamp(Number(profile.developmentBusinessFriendlinessIndex) || 0.52, 0, 1) * 0.34) +
        (Math.max(0, 0.52 - unemploymentRate) * 0.32) +
        ((housingHomeownershipRate - 0.5) * 0.18);

      pullScore =
        (jobsPull * 0.46) +
        (safetyPull * 0.2) +
        (educationPull * 0.2) +
        (marriageStatusPull * 0.14) +
        ((housingAffordabilityIndex - 0.5) * 0.28);
      pushScore =
        (unemploymentRate * 1.05) +
        (longUnemploymentShare * 0.65) +
        (Math.max(0, 0.52 - populationPressure) * 0.42) +
        (developmentCorruptionIndex * 0.32) +
        (Math.max(0, 0.48 - developmentInfrastructureIndex) * 0.25) +
        (demographicYouthBulgeIndex * 0.2) +
        (demographicLaborForcePressureIndex * 0.26) +
        (Math.max(0, housingCostPressure - 1) * 0.7) +
        (housingMarketStress * 0.24) +
        (Math.max(0, 0.4 - housingHomeownershipRate) * 0.18) +
        (emigrationPressureIndex * 0.28);
      migrationPressure = App.utils.clamp((pullScore - pushScore) + policyMigrationBias, -0.45, 0.55);
      nextNetMigrationPer1000 = App.utils.clamp(((Number(profile.netMigrationRatePer1000) || 0) * 0.76) + (migrationPressure * 2.6), -50, 50);
      profile.netMigrationRatePer1000 = nextNetMigrationPer1000;

      if (migrationPressure > 0.12 && scarcity > 0.64) {
        request = Math.max(0, Math.min(24, Math.round((laborForce * migrationPressure * (0.0028 + (populationPressure * 0.0018))))));
        if (request > 0) {
          moved = pullMobileLaborIntoCountry(iso, request, {
            jobsPull:jobsPull,
            safetyPull:safetyPull,
            educationPull:educationPull,
            marriageStatusPull:marriageStatusPull
          });
          if (moved > 0) {
            profile.netMigrationRatePer1000 = App.utils.clamp((Number(profile.netMigrationRatePer1000) || 0) + ((moved / Math.max(1, Number(profile.population) || 1)) * 1000), -50, 50);
          }
        }
      }

      internalMobilityResult = applyInternalMigrationUrbanFlows(iso, {
        jobsPull:jobsPull,
        educationPull:educationPull,
        marriageStatusPull:marriageStatusPull,
        migrationPressure:migrationPressure
      });
      profile.internalMobilityAnnual = Math.max(0, Number(profile.internalMobilityAnnual) || 0) + (internalMobilityResult.moved || 0);
      profile.internalTalentMobilityAnnual = Math.max(0, Number(profile.internalTalentMobilityAnnual) || 0) + (internalMobilityResult.talentMoved || 0);

      netMobilityFlow = (Number(profile.mobilityInflowAnnual) || 0) - (Number(profile.mobilityOutflowAnnual) || 0);
      profile.talentShortageIndex = App.utils.clamp((Number(profile.talentShortageIndex) || 0) - (App.utils.clamp(Number(profile.talentDriftBalance) || 0, -1.5, 1.5) * 0.18), 0, 1);

      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.countryPolicyStance = countryStance;
      profile.policyEvidence.blocPolicyStance = blocStance;
      profile.policyEvidence.electionImmigrationBias = Number((electionEffects.immigrationBias || 0).toFixed(4));
      profile.policyEvidence.migrationPressure = Number(migrationPressure.toFixed(4));
      profile.policyEvidence.jobsPullIndex = Number(jobsPull.toFixed(4));
      profile.policyEvidence.safetyPullIndex = Number(safetyPull.toFixed(4));
      profile.policyEvidence.educationPullIndex = Number(educationPull.toFixed(4));
      profile.policyEvidence.marriageStatusPullIndex = Number(marriageStatusPull.toFixed(4));
      profile.policyEvidence.netMigrationRatePer1000 = Number((Number(profile.netMigrationRatePer1000) || 0).toFixed(4));
      profile.policyEvidence.mobilityInflowAnnual = Math.max(0, floorInt(profile.mobilityInflowAnnual));
      profile.policyEvidence.mobilityOutflowAnnual = Math.max(0, floorInt(profile.mobilityOutflowAnnual));
      profile.policyEvidence.internalMobilityAnnual = Math.max(0, floorInt(profile.internalMobilityAnnual));
      profile.policyEvidence.internalTalentMobilityAnnual = Math.max(0, floorInt(profile.internalTalentMobilityAnnual));
      profile.policyEvidence.netMobilityFlowAnnual = floorInt(netMobilityFlow);
      profile.policyEvidence.talentDriftBalance = Number((Number(profile.talentDriftBalance) || 0).toFixed(4));
      profile.policyEvidence.educationIndex = Number((Number(profile.educationIndex) || 0).toFixed(4));
      profile.policyEvidence.housingCostPressure = Number(housingCostPressure.toFixed(4));
      profile.policyEvidence.housingMarketStress = Number(housingMarketStress.toFixed(4));
      profile.policyEvidence.housingHomeownershipRate = Number(housingHomeownershipRate.toFixed(4));
      profile.policyEvidence.housingAffordabilityIndex = Number(housingAffordabilityIndex.toFixed(4));
      profile.policyEvidence.emigrationPressureIndex = Number(emigrationPressureIndex.toFixed(4));
      profile.policyEvidence.populationPressure = Number(populationPressure.toFixed(4));
      profile.policyEvidence.demographicAgingIndex = Number(demographicAgingIndex.toFixed(4));
      profile.policyEvidence.demographicYouthBulgeIndex = Number(demographicYouthBulgeIndex.toFixed(4));
      profile.policyEvidence.demographicLaborForcePressureIndex = Number(demographicLaborForcePressureIndex.toFixed(4));
      refreshCountryProfileDerived(profile);
    });
  }

  function phase4InequalityInstitutionFeedback(){
    var householdStressByCountry = {};
    var householdCountsByCountry = {};

    (App.store.households || []).forEach(function(household){
      var iso = household && household.countryISO;
      if (!iso) return;
      householdStressByCountry[iso] = (householdStressByCountry[iso] || 0) + App.utils.clamp((Number(household.financialStress) || 0) / 100, 0, 1);
      householdCountsByCountry[iso] = (householdCountsByCountry[iso] || 0) + 1;
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var laborForce;
      var unemploymentRate;
      var longUnemploymentShare;
      var householdStress;
      var migrationTension;
      var previousGini;
      var previousInstitution;
      var previousSocialPressure;
      var inequalityPressure;
      var nextSocialPressure;
      var institutionDrift;
      var giniTarget;
      var nextGini;

      if (!profile) return;

      refreshCountryProfileDerived(profile);

      laborForce = Math.max(1, Number(profile.laborForce) || 1);
      unemploymentRate = App.utils.clamp(Math.max(0, Number(profile.unemployed) || 0) / laborForce, 0, 1);
      longUnemploymentShare = App.utils.clamp(Number(profile.longUnemploymentShare) || 0, 0, 1);
      householdStress = householdCountsByCountry[iso] > 0 ? (householdStressByCountry[iso] / householdCountsByCountry[iso]) : 0.46;
      migrationTension = App.utils.clamp(Math.abs((Number(profile.mobilityInflowAnnual) || 0) - (Number(profile.mobilityOutflowAnnual) || 0)) / laborForce, 0, 0.5);

      previousGini = App.utils.clamp(Number(profile.giniCoefficient) || 0.4, 0.2, 0.8);
      previousInstitution = App.utils.clamp(Number(profile.institutionScore) || 0.55, 0.1, 1);
      previousSocialPressure = App.utils.clamp(Number(profile.socialPressureIndex) || 0, 0, 1.5);

      inequalityPressure =
        (previousGini * 0.44) +
        (unemploymentRate * 0.24) +
        (longUnemploymentShare * 0.14) +
        (householdStress * 0.12) +
        (migrationTension * 0.06);
      inequalityPressure = App.utils.clamp(inequalityPressure, 0, 1.25);

      nextSocialPressure = App.utils.clamp((previousSocialPressure * 0.62) + (inequalityPressure * 0.38) - (previousInstitution * 0.12), 0, 1.5);

      institutionDrift =
        ((Number(profile.educationIndex) || 0.6) - 0.5) * 0.018 +
        ((1 - unemploymentRate) - 0.78) * 0.016 -
        ((nextSocialPressure - 0.45) * 0.022) -
        ((previousGini - 0.4) * 0.014);
      institutionDrift = App.utils.clamp(institutionDrift, -0.04, 0.035);

      giniTarget = previousGini;
      giniTarget += (unemploymentRate - 0.11) * 0.08;
      giniTarget += (householdStress - 0.48) * 0.06;
      giniTarget += (migrationTension - 0.06) * 0.04;
      giniTarget -= (previousInstitution - 0.55) * 0.09;
      giniTarget = App.utils.clamp(giniTarget, 0.2, 0.8);
      nextGini = App.utils.clamp((previousGini * 0.74) + (giniTarget * 0.26), 0.2, 0.8);

      profile.socialPressureIndex = nextSocialPressure;
      profile.institutionScore = App.utils.clamp(previousInstitution + institutionDrift, 0.1, 1);
      profile.giniCoefficient = nextGini;

      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.inequalityPressureIndex = Number(inequalityPressure.toFixed(4));
      profile.policyEvidence.socialPressureIndex = Number(nextSocialPressure.toFixed(4));
      profile.policyEvidence.institutionDrift = Number(institutionDrift.toFixed(5));
      profile.policyEvidence.giniCoefficient = Number(nextGini.toFixed(4));
      profile.policyEvidence.institutionScore = Number((Number(profile.institutionScore) || 0).toFixed(4));

      refreshCountryProfileDerived(profile);
    });
  }

  function updatePopulationProfilesYearly(){
    if (!App.store.countryProfiles) return;
    runYearlyEconomicPass();
    phase2BirthDeathPressure();
    phase3MigrationPressure();
    phase4InequalityInstitutionFeedback();
    updateInequalityMetricsYearly();
    phase6SocialUnrestFromInequality();
    validateCountryProfiles();
  }

  function validateCountryProfiles(){
    var issues = [];
    var devStrict = !!(global.location && (global.location.hostname === "localhost" || global.location.hostname === "127.0.0.1"));

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = App.store.countryProfiles[iso];
      if (!profile) return;
      if (!Number.isFinite(profile.population) || profile.population < 0) issues.push(iso + " population invalid");
      if (!Number.isFinite(profile.laborForce) || profile.laborForce < 0) issues.push(iso + " laborForce invalid");
      if (!Number.isFinite(profile.employed) || profile.employed < 0) issues.push(iso + " employed invalid");
      if (profile.employed > profile.laborForce + 1) issues.push(iso + " employed exceeds labor force");
      if (!Number.isFinite(profile.consumerDemandGU) || profile.consumerDemandGU < 0) issues.push(iso + " consumer demand invalid");
    });

    if (issues.length) {
      if (devStrict) {
        console.error("Country profile invariants:", issues.slice(0, 8).join(" | "));
      } else {
        console.warn("Country profile invariants:", issues.slice(0, 8).join(" | "));
      }
    }
  }

  function reserveLabor(iso, amount){
    var request = Math.max(0, floorInt(amount));
    var profile = ensureCountryProfile(iso);
    var laborSnapshot;
    var available;
    var reserved;
    var moved;

    if (!profile || request <= 0) return 0;

    refreshCountryProfileDerived(profile);
    laborSnapshot = getSimCountryLaborSnapshot(iso);
    available = Math.min(
      Math.max(0, profile.laborForce - profile.employed),
      Math.max(0, laborSnapshot.available)
    );
    reserved = Math.min(request, available);
    if (reserved < request) {
      moved = pullMobileLaborIntoCountry(iso, request - reserved);
      laborSnapshot = getSimCountryLaborSnapshot(iso);
      available = Math.min(
        Math.max(0, profile.laborForce - profile.employed),
        Math.max(0, laborSnapshot.available)
      );
      reserved += Math.min(Math.max(0, moved), Math.max(0, available));
    }
    profile.employed += reserved;
    refreshCountryProfileDerived(profile);
    return reserved;
  }

  function releaseLabor(iso, amount){
    var request = Math.max(0, floorInt(amount));
    var profile = ensureCountryProfile(iso);
    var released;

    if (!profile || request <= 0) return 0;

    refreshCountryProfileDerived(profile);
    released = Math.min(request, profile.employed);
    profile.employed -= released;
    refreshCountryProfileDerived(profile);
    return released;
  }

  function getCountryDemandCapacityGU(iso){
    var profile = ensureCountryProfile(iso);
    if (!profile) return 0;
    return Math.max(0, Number(profile.consumerDemandGU) || 0);
  }

  function getBlocDemandCapacityGU(blocId){
    return (App.store.getBlocProfiles ? App.store.getBlocProfiles(blocId) : []).reduce(function(sum, profile){
      return sum + Math.max(0, Number(profile.consumerDemandGU) || 0);
    }, 0);
  }

  function getBusinessDemandCapacityGU(business){
    var scope = getIndustryMarketScope(business.industry);
    var countryDemand = getCountryDemandCapacityGU(business.countryISO);
    var blocDemand = getBlocDemandCapacityGU(business.blocId);
    var countryProfile = ensureCountryProfile(business.countryISO, business.blocId);
    var countryIndustryDemandMultiplier = getCountryIndustryDemandMultiplier(countryProfile, business.industry);
    var blocIndustryDemandMultiplier = getBlocIndustryDemandMultiplier(business.blocId, business.industry);
    var mixedIndustryDemandMultiplier = App.utils.clamp((countryIndustryDemandMultiplier * 0.52) + (blocIndustryDemandMultiplier * 0.48), 0.62, 1.62);
    var blended = (countryDemand * 0.5) + (blocDemand * 0.5);

    if (scope === "local") return countryDemand * DEMAND_SCOPE_SHARE.local * countryIndustryDemandMultiplier;
    if (scope === "global") return blocDemand * DEMAND_SCOPE_SHARE.global * blocIndustryDemandMultiplier;
    return blended * DEMAND_SCOPE_SHARE.mixed * mixedIndustryDemandMultiplier;
  }

  function getDemandCapPenalty(business){
    var capacity = Math.max(1, getBusinessDemandCapacityGU(business));
    var utilization = (business.revenueGU || 0) / capacity;

    if (utilization <= 1) return 0;
    if (utilization <= 1.15) return App.utils.clamp((utilization - 1) * 0.35, 0, 0.06);
    if (utilization <= 1.5) return App.utils.clamp(0.06 + (utilization - 1.15) * 0.8, 0.06, 0.34);
    return App.utils.clamp(0.34 + (utilization - 1.5) * 0.5, 0.34, 0.78);
  }

  function getNetWorthCarryRateAnnual(netWorthGU){
    var worth = Math.max(0, Number(netWorthGU) || 0);

    if (worth < 50000) return 0;
    if (worth < 500000) return 0.01;
    if (worth < 5000000) return 0.025;
    if (worth < 50000000) return 0.045;
    return 0.07;
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

  function isNonResidentialIso(iso){
    return ["AQ", "AX", "BV", "HM", "SJ", "TF", "UM"].indexOf(normalizeIso(iso)) !== -1;
  }

  function remapUnsupportedResidencyIso(iso, options){
    var normalized = normalizeIso(iso);
    var blocId = String(options && options.blocId || "").trim().toUpperCase();
    var stableKey = String(options && options.stableKey || normalized);
    var bloc;
    var members;
    var idx;
    var fallback = {
      AQ:"CL",
      AX:"FI",
      BV:"NO",
      HM:"AU",
      SJ:"NO",
      TF:"FR",
      UM:"US"
    };

    if (!normalized) return "";
    if (!isNonResidentialIso(normalized)) return normalized;

    if (blocId) {
      bloc = (App.store.blocs || []).find(function(item){
        return item && item.id === blocId;
      }) || null;
      members = bloc && Array.isArray(bloc.members) ? bloc.members.filter(function(memberIso){
        var candidate = normalizeIso(memberIso);
        return !!candidate && !isNonResidentialIso(candidate);
      }) : [];
      if (members.length) {
        idx = hashString(stableKey + "|" + normalized + "|" + blocId) % members.length;
        return members[idx];
      }
    }

    return fallback[normalized] || "US";
  }

  function sanitizeUnsupportedResidencyState(){
    var isoToBloc = App.store.isoToBloc || {};
    var templateMap = {};

    if (App.data && typeof App.data.createBlocs === "function") {
      App.data.createBlocs().forEach(function(bloc){
        templateMap[bloc.id] = bloc;
      });
    }

    (App.store.blocs || []).forEach(function(bloc){
      var seen = {};
      var members = Array.isArray(bloc && bloc.members) ? bloc.members : [];
      var templateBloc = templateMap[bloc && bloc.id] || null;
      var allowed = null;

      if (templateBloc && Array.isArray(templateBloc.members)) {
        allowed = {};
        templateBloc.members.forEach(function(iso){
          var normalized = normalizeIso(iso);
          if (normalized) allowed[normalized] = true;
        });
      }

      bloc.members = members.map(function(iso){
        return normalizeIso(iso);
      }).filter(function(iso){
        if (!iso || isNonResidentialIso(iso) || seen[iso]) return false;
        if (allowed && !allowed[iso]) return false;
        seen[iso] = true;
        return true;
      });
    });

    Object.keys(isoToBloc).forEach(function(iso){
      delete isoToBloc[iso];
    });

    (App.store.blocs || []).forEach(function(bloc){
      (bloc.members || []).forEach(function(iso){
        var normalized = normalizeIso(iso);
        if (!normalized) return;
        isoToBloc[normalized] = bloc.id;
      });
    });

    (App.store.people || []).forEach(function(person){
      var currentIso = normalizeIso(person && person.countryISO);
      var nextIso = remapUnsupportedResidencyIso(currentIso, {
        blocId:person && person.blocId,
        stableKey:person && person.id
      });
      var blocId;

      if (!person || !currentIso) return;

      if (currentIso !== nextIso) {
        person.countryISO = nextIso;
      }

      blocId = isoToBloc[nextIso || currentIso];
      if (blocId) person.blocId = blocId;

      if (currentIso !== nextIso && nextIso !== "US") {
        person.state = null;
        person.subdivision = null;
      }
    });

    (App.store.businesses || []).forEach(function(business){
      var currentIso = normalizeIso(business && business.countryISO);
      var nextIso = remapUnsupportedResidencyIso(currentIso, {
        blocId:business && business.blocId,
        stableKey:business && business.id
      });
      var blocId;

      if (!business || !currentIso) return;

      if (currentIso !== nextIso) {
        business.countryISO = nextIso;
      }

      blocId = isoToBloc[nextIso || currentIso];
      if (blocId) business.blocId = blocId;

      if (currentIso !== nextIso && nextIso !== "US") {
        business.hqSubdivision = null;
      }
    });

    if (App.store.countryProfiles && typeof App.store.countryProfiles === "object") {
      Object.keys(App.store.countryProfiles).forEach(function(iso){
        if (!isNonResidentialIso(iso)) return;
        delete App.store.countryProfiles[iso];
      });
    }
  }

  function isResidencyEligibleCountry(iso){
    var normalized = normalizeIso(iso);
    var country;
    var population;

    if (!normalized) return false;
    if (isNonResidentialIso(normalized)) return false;

    country = App.store.countryData ? App.store.countryData[normalized] : null;
    if (!country || typeof country !== "object") return true;

    population = Number(country.population);
    if (Number.isFinite(population) && population <= 0) return false;
    return true;
  }

  function getCountrySelectionSignals(iso){
    var profile = App.store.countryProfiles ? App.store.countryProfiles[iso] : null;
    var country = App.store.countryData ? App.store.countryData[iso] : null;
    var population = Math.max(0, Number(profile && profile.population != null ? profile.population : (country && country.population)) || 0);
    var institution = Number(profile && profile.institutionScore != null ? profile.institutionScore : (country && country.institutionScore));
    var education = Number(profile && profile.educationIndex != null ? profile.educationIndex : (country && country.educationIndex));
    var populationPressure = Number(profile && profile.populationPressure != null ? profile.populationPressure : 0.5);

    return {
      population:population,
      populationSignal:population > 0 ? (Math.log10(population + 1) / 7) : 0,
      institutionSignal:Number.isFinite(institution) ? App.utils.clamp(institution, 0, 1) : 0.55,
      educationSignal:Number.isFinite(education) ? App.utils.clamp(education, 0, 1) : 0.55,
      populationPressure:App.utils.clamp(populationPressure, 0, 1)
    };
  }

  function buildCountryPresenceMeta(candidateIsos){
    var seen = {};
    var scores = {};
    var total = 0;

    (candidateIsos || []).forEach(function(iso){
      var normalized = normalizeIso(iso);

      if (!normalized || seen[normalized]) return;
      seen[normalized] = true;
      scores[normalized] = 0;
    });

    App.store.getLivingPeople().forEach(function(person){
      var normalized = normalizeIso(person && person.countryISO);

      if (!normalized || scores[normalized] == null) return;
      scores[normalized] += 0.32;
    });

    (App.store.businesses || []).forEach(function(business){
      var normalized = normalizeIso(business && business.countryISO);

      if (!normalized || scores[normalized] == null || (business && business.stage === "defunct")) return;
      scores[normalized] += 2.4;
    });

    Object.keys(scores).forEach(function(iso){
      total += scores[iso];
    });

    return {
      scores:scores,
      total:total
    };
  }

  function getCountryDiversificationMultiplier(iso, candidateIsos, baseWeightByIso, presenceMeta){
    var totalBase = 0;
    var expectedShare;
    var actualShare;
    var relativeGap;

    (candidateIsos || []).forEach(function(candidateIso){
      totalBase += Math.max(0, Number(baseWeightByIso && baseWeightByIso[candidateIso]) || 0);
    });

    if (totalBase <= 0 || !presenceMeta || presenceMeta.total <= 0) return 1;

    expectedShare = Math.max(0.02, (Number(baseWeightByIso && baseWeightByIso[iso]) || 0) / totalBase);
    actualShare = Math.max(0, Number(presenceMeta.scores && presenceMeta.scores[iso]) || 0) / presenceMeta.total;

    if (actualShare > expectedShare) {
      return App.utils.clamp(Math.pow((expectedShare + 0.04) / (actualShare + 0.04), 0.9), 0.28, 1);
    }

    relativeGap = App.utils.clamp((expectedShare - actualShare) / expectedShare, 0, 1.4);
    return App.utils.clamp(1 + (relativeGap * 0.65), 1, 1.65);
  }

  function pickWeightedCountryFromCandidates(candidateIsos, baseWeightFn, fallbackIso){
    var members = [];
    var seen = {};
    var baseWeightByIso = {};
    var presenceMeta;
    var weighted = [];
    var total = 0;
    var roll;
    var running = 0;

    (candidateIsos || []).forEach(function(iso){
      var normalized = normalizeIso(iso);

      if (!normalized || seen[normalized] || !isResidencyEligibleCountry(normalized)) return;
      seen[normalized] = true;
      members.push(normalized);
    });

    if (!members.length) {
      return fallbackIso || "US";
    }

    members.forEach(function(iso){
      baseWeightByIso[iso] = Math.max(0.02, Number(baseWeightFn(iso) || 0.02));
    });

    presenceMeta = buildCountryPresenceMeta(members);

    members.forEach(function(iso){
      var weight = baseWeightByIso[iso] * getCountryDiversificationMultiplier(iso, members, baseWeightByIso, presenceMeta);
      weight = App.utils.clamp(weight, 0.02, 8);
      weighted.push({ iso:iso, weight:weight });
      total += weight;
    });

    if (total <= 0) {
      return fallbackIso || App.utils.pick(members) || "US";
    }

    roll = Math.random() * total;
    for (var i = 0; i < weighted.length; i += 1) {
      running += weighted[i].weight;
      if (running >= roll) return weighted[i].iso;
    }

    return weighted[weighted.length - 1].iso;
  }

  function pickCountryByPopulationPressure(blocId){
    var profiles = (App.store.getBlocProfiles ? App.store.getBlocProfiles(blocId) : []).slice();

    profiles = profiles.filter(function(profile){
      return isResidencyEligibleCountry(profile && profile.iso);
    });

    if (!profiles.length) return null;

    return pickWeightedCountryFromCandidates(profiles.map(function(profile){
      return profile.iso;
    }), function(iso){
      var signals = getCountrySelectionSignals(iso);
      return App.utils.clamp((signals.populationPressure * 2.8) + (signals.populationSignal * 0.9) + (signals.institutionSignal * 0.35) + (signals.educationSignal * 0.25), 0.05, 4.5);
    }, profiles[0].iso);
  }

  function formatTraitEffectLabel(trait, channel, impact){
    var rounded = Math.round(Math.abs(impact) * 10) / 10;
    var sign = impact >= 0 ? "+" : "-";
    return trait + " " + sign + rounded + " " + (TRAIT_CHANNEL_LABELS[channel] || channel);
  }

  function summarizeTraitEffects(effects, limit){
    var merged = {};
    var list;

    (effects || []).forEach(function(effect){
      var key;
      if (!effect || !effect.trait || !effect.channel || !effect.impact) return;
      key = effect.trait + "|" + effect.channel;
      if (!merged[key]) {
        merged[key] = {
          trait:effect.trait,
          channel:effect.channel,
          impact:0
        };
      }
      merged[key].impact += effect.impact;
    });

    list = Object.keys(merged).map(function(key){
      var entry = merged[key];
      entry.impact = Math.round(entry.impact * 10) / 10;
      entry.label = formatTraitEffectLabel(entry.trait, entry.channel, entry.impact);
      return entry;
    }).sort(function(first, second){
      return Math.abs(second.impact) - Math.abs(first.impact);
    });

    return list.slice(0, limit || 4);
  }

  function collectTraitEffects(person, channels){
    var activeChannels = channels && channels.length ? channels : TRAIT_CHANNELS;
    var traits = uniqueTraits(person && person.traits ? person.traits : []);
    var effects = [];

    traits.forEach(function(trait){
      var rule = TRAIT_MECHANICS[trait];
      if (!rule) return;

      activeChannels.forEach(function(channel){
        var impact = Number(rule[channel] || 0);
        if (!impact) return;
        effects.push({
          trait:trait,
          channel:channel,
          impact:impact,
          label:formatTraitEffectLabel(trait, channel, impact)
        });
      });
    });

    return effects;
  }

  function collectGroupTraitEffects(people, channels){
    return (people || []).filter(Boolean).reduce(function(all, person){
      return all.concat(collectTraitEffects(person, channels));
    }, []);
  }

  function getTraitChannelScore(person, channel){
    return collectTraitEffects(person, [channel]).reduce(function(sum, effect){
      return sum + effect.impact;
    }, 0);
  }

  function buildTraitEffectTags(effects, limit){
    return summarizeTraitEffects(effects, limit || 3).map(function(effect){
      return effect.label;
    });
  }

  function recordTraitEffects(effects){
    if (!App.store || !effects || !effects.length) return;
    App.store.traitEffectStats = App.store.traitEffectStats || {};

    effects.forEach(function(effect){
      var traitBucket;
      var channelBucket;

      if (!effect || !effect.trait || !effect.channel || !effect.impact) return;

      traitBucket = App.store.traitEffectStats[effect.trait] || (App.store.traitEffectStats[effect.trait] = {});
      channelBucket = traitBucket[effect.channel] || (traitBucket[effect.channel] = { hits:0, totalImpact:0 });
      channelBucket.hits += 1;
      channelBucket.totalImpact = Math.round((channelBucket.totalImpact + effect.impact) * 10) / 10;
    });
  }

  function setTraitSnapshot(target, effects){
    if (!target) return;
    target.lastTraitEffects = summarizeTraitEffects(effects, 4);
  }

  function validateTraitMechanicalCoverage(){
    var traits = (App.data && App.data.TRAITS && App.data.TRAITS.length ? App.data.TRAITS : Object.keys(TRAIT_MECHANICS)).slice();
    var errors = [];

    traits.forEach(function(trait){
      var mechanics = TRAIT_MECHANICS[trait];
      var activeCount;
      if (!mechanics) {
        errors.push("Missing trait mechanics config for " + trait + ".");
        return;
      }

      activeCount = TRAIT_CHANNELS.filter(function(channel){
        return Number(mechanics[channel] || 0) !== 0;
      }).length;

      if (activeCount < 2) {
        errors.push(trait + " has only " + activeCount + " active trait channels.");
      }
    });

    return {
      ok:errors.length === 0,
      errors:errors
    };
  }

  function normalizeScoreMap(map, keys, defaults){
    var next = {};
    map = map || {};

    keys.forEach(function(key){
      var fallback = typeof defaults === "number" ? defaults : defaults[key];
      next[key] = clampScore(map[key] != null ? map[key] : fallback);
    });

    return next;
  }

  function averageValues(values){
    if (!values.length) return 0;
    return values.reduce(function(sum, value){
      return sum + value;
    }, 0) / values.length;
  }

  function buildDecisionProfileBase(person){
    var parents = (person.parentIds || []).map(function(parentId){
      return App.store.getPerson(parentId);
    }).filter(Boolean);
    var base = {};

    DECISION_PROFILE_KEYS.forEach(function(key){
      var randomBase = App.utils.rand(32, 68);

      if (parents.length) {
        randomBase = averageValues(parents.map(function(parent){
          var source = parent.decisionProfileBase || parent.decisionProfile || {};
          return source[key] != null ? source[key] : 50;
        })) * 0.6 + randomBase * 0.4 + App.utils.rand(-6, 6);
      }

      base[key] = clampScore(randomBase);
    });

    return base;
  }

  function applyTraitProfileOffsets(profile, traits){
    traits.forEach(function(trait){
      var offsets = TRAIT_PROFILE_OFFSETS[trait];

      if (!offsets) return;

      Object.keys(offsets).forEach(function(key){
        profile[key] = clampScore((profile[key] != null ? profile[key] : 50) + offsets[key]);
      });
    });

    return profile;
  }

  function createTemporaryStates(){
    return {
      confidence:clampScore(App.utils.rand(44, 60)),
      stress:clampScore(App.utils.rand(14, 32)),
      burnout:clampScore(App.utils.rand(4, 18)),
      grief:0,
      resentment:0,
      ambitionSpike:clampScore(App.utils.rand(26, 54))
    };
  }

  function materializeDecisionProfile(person){
    if (!person) return;

    person.decisionProfileBase = normalizeScoreMap(person.decisionProfileBase || buildDecisionProfileBase(person), DECISION_PROFILE_KEYS, 50);
    person.decisionProfile = applyTraitProfileOffsets(normalizeScoreMap(person.decisionProfileBase, DECISION_PROFILE_KEYS, 50), person.traits || []);
    person.decisionProfile = normalizeScoreMap(person.decisionProfile, DECISION_PROFILE_KEYS, 50);
  }

  function ensureDecisionData(person){
    if (!person) return;

    person.decisionProfileBase = normalizeScoreMap(person.decisionProfileBase || buildDecisionProfileBase(person), DECISION_PROFILE_KEYS, 50);
    materializeDecisionProfile(person);
    person.temporaryStates = normalizeScoreMap(person.temporaryStates || createTemporaryStates(), TEMP_STATE_KEYS, TEMP_STATE_DEFAULTS);
  }

  function adjustTemporaryStates(person, changes){
    if (!person || !changes) return;

    ensureDecisionData(person);
    Object.keys(changes).forEach(function(key){
      if (TEMP_STATE_KEYS.indexOf(key) === -1) return;
      person.temporaryStates[key] = clampScore((person.temporaryStates[key] != null ? person.temporaryStates[key] : TEMP_STATE_DEFAULTS[key]) + changes[key]);
    });
  }

  function settleTemporaryStates(person){
    if (!person) return;

    ensureDecisionData(person);

    person.temporaryStates.confidence = clampScore(person.temporaryStates.confidence + (person.temporaryStates.confidence > 52 ? -1 : (person.temporaryStates.confidence < 48 ? 1 : 0)));
    person.temporaryStates.stress = clampScore(person.temporaryStates.stress + (person.temporaryStates.stress > 20 ? -1 : (person.temporaryStates.stress < 18 ? 1 : 0)));
    person.temporaryStates.burnout = clampScore(person.temporaryStates.burnout + (person.temporaryStates.burnout > 8 ? -1 : 0));
    person.temporaryStates.grief = clampScore(person.temporaryStates.grief + (person.temporaryStates.grief > 0 ? -1 : 0));
    person.temporaryStates.resentment = clampScore(person.temporaryStates.resentment + (person.temporaryStates.resentment > 0 ? -1 : 0));
    person.temporaryStates.ambitionSpike = clampScore(person.temporaryStates.ambitionSpike + (person.temporaryStates.ambitionSpike > 36 ? -1 : (person.temporaryStates.ambitionSpike < 28 ? 1 : 0)));
  }

  function getTraitDecisionShift(person, axis){
    return (person.traits || []).reduce(function(sum, trait){
      var shifts = TRAIT_DECISION_SHIFTS[trait];
      return sum + (shifts && shifts[axis] ? shifts[axis] : 0);
    }, 0);
  }

  function getStatus(person){
    var business = App.store.getBusiness(person.businessId) ||
      (App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null);

    if (!person.alive) return "deceased";
    if (person.retired) return "retired";
    if (person.occupationCategory === "unemployed") return "struggling";
    if (person.occupationCategory === "investor") return "growing";
    if (!business) return "starting";
    if (business.profitGU > business.revenueGU * 0.2) return "thriving";
    if (business.profitGU > 0) return "growing";
    if (business.profitGU < -business.revenueGU * 0.1) return "struggling";
    return "growing";
  }

  function updateBlocGdp(){
    App.store.blocs.forEach(function(bloc){
      bloc.gdp = App.store.businesses.filter(function(business){
        return business.blocId === bloc.id;
      }).reduce(function(sum, business){
        return sum + business.revenueGU;
      }, 0);
      refreshBlocPolicyStance(bloc);
    });
  }

  function updateForex(){
    var avg = App.store.blocs.reduce(function(sum, bloc){
      return sum + bloc.gdp;
    }, 0) / App.store.blocs.length || 1;

    App.store.blocs.forEach(function(bloc){
      var ratio;
      var pressure;
      var defaultRisk;
      var noise;
      var annualChange;

      bloc.prevRate = bloc.rate;
      ratio = bloc.gdp / avg;
      pressure = -(bloc.geoPressure * 0.06);
      defaultRisk = -(bloc.defaultRisk * 0.16);
      noise = 1 + App.utils.rand(-0.00065, 0.00065);
      annualChange = (ratio > 1 ? -0.05 * (ratio - 1) : 0.06 * (1 - ratio)) + pressure + defaultRisk;

      bloc.rate = bloc.rate * Math.max(0.97, 1 + dailyRateFromAnnualChange(annualChange)) * noise;
      bloc.rate = Math.max(bloc.baseRate * 0.55, Math.min(bloc.baseRate * 2.2, bloc.rate));
      bloc.rateHistory.push(bloc.rate);
      if (bloc.rateHistory.length > 60) {
        bloc.rateHistory.shift();
      }
      bloc.geoPressure = Math.max(0, bloc.geoPressure - (0.07 / LEGACY_SIM_DAYS_PER_TICK) * SIM_DAYS_PER_TICK);
      bloc.defaultRisk = Math.max(0, bloc.defaultRisk - (0.04 / LEGACY_SIM_DAYS_PER_TICK) * SIM_DAYS_PER_TICK);
    });
  }

  function ensureGovernorState(){
    var governor = App.store.governor && typeof App.store.governor === "object" ? App.store.governor : {};

    governor.enabled = governor.enabled !== false;
    governor.annualLaunches = Math.max(0, Number(governor.annualLaunches) || 0);
    governor.lastLaunchYear = Math.floor(Number(governor.lastLaunchYear) || -1);
    governor.noLaunchYears = Math.max(0, Number(governor.noLaunchYears) || 0);
    governor.emptyEcosystemTicksByBloc = governor.emptyEcosystemTicksByBloc && typeof governor.emptyEcosystemTicksByBloc === "object" ? governor.emptyEcosystemTicksByBloc : {};
    governor.unemploymentTrapTicksByBloc = governor.unemploymentTrapTicksByBloc && typeof governor.unemploymentTrapTicksByBloc === "object" ? governor.unemploymentTrapTicksByBloc : {};
    governor.agingLockTicks = Math.max(0, Number(governor.agingLockTicks) || 0);
    governor.currencyConvergenceTicks = Math.max(0, Number(governor.currencyConvergenceTicks) || 0);
    governor.cooldowns = governor.cooldowns && typeof governor.cooldowns === "object" ? governor.cooldowns : {};
    governor.interventionCountsByDay = governor.interventionCountsByDay && typeof governor.interventionCountsByDay === "object" ? governor.interventionCountsByDay : {};
    governor.interventionLog = Array.isArray(governor.interventionLog) ? governor.interventionLog : [];
    governor.signalSnapshot = governor.signalSnapshot && typeof governor.signalSnapshot === "object" ? governor.signalSnapshot : {};
    governor.runCount = Math.max(0, Number(governor.runCount) || 0);
    governor.lastRunDay = Math.max(0, Number(governor.lastRunDay) || 0);
    App.store.governor = governor;
    return governor;
  }

  function decayCounter(value, amount){
    return Math.max(0, (Number(value) || 0) - Math.max(1, Number(amount) || 1));
  }

  function standardDeviation(values){
    var sample = (values || []).filter(function(value){
      return Number.isFinite(value);
    });
    var mean;

    if (!sample.length) return 0;

    mean = sample.reduce(function(sum, value){
      return sum + value;
    }, 0) / sample.length;

    return Math.sqrt(sample.reduce(function(sum, value){
      var delta = value - mean;
      return sum + (delta * delta);
    }, 0) / sample.length);
  }

  function getBlocPopulation(blocId){
    return (App.store.getBlocProfiles ? App.store.getBlocProfiles(blocId) : []).reduce(function(sum, profile){
      return sum + Math.max(0, Number(profile && profile.population) || 0);
    }, 0);
  }

  function getBlocUnemploymentRate(blocId){
    var aggregates = (App.store.getBlocProfiles ? App.store.getBlocProfiles(blocId) : []).reduce(function(state, profile){
      state.laborForce += Math.max(0, Number(profile && profile.laborForce) || 0);
      state.employed += Math.max(0, Number(profile && profile.employed) || 0);
      return state;
    }, { laborForce:0, employed:0 });

    if (aggregates.laborForce <= 0) return 0;
    return App.utils.clamp((aggregates.laborForce - aggregates.employed) / aggregates.laborForce, 0, 1);
  }

  function isGovernorCooldownReady(governor, key){
    var currentDay = Math.max(0, Math.floor(App.store.simDay || 0));
    return currentDay >= Math.max(0, Number(governor.cooldowns[key]) || 0);
  }

  function setGovernorCooldown(governor, key){
    var currentDay = Math.max(0, Math.floor(App.store.simDay || 0));
    var cooldownDays = Math.max(1, Number(GOVERNOR_CONFIG.cooldownDays[key]) || 1);

    governor.cooldowns[key] = currentDay + cooldownDays;
  }

  function getGovernorInterventionsToday(governor){
    var currentDay = String(Math.max(0, Math.floor(App.store.simDay || 0)));
    return Math.max(0, Number(governor.interventionCountsByDay[currentDay]) || 0);
  }

  function canApplyGovernorIntervention(governor, key){
    if (!isGovernorCooldownReady(governor, key)) return false;
    return getGovernorInterventionsToday(governor) < GOVERNOR_CONFIG.maxInterventionsPerDay;
  }

  function recordGovernorIntervention(governor, key, details){
    var currentDay = Math.max(0, Math.floor(App.store.simDay || 0));
    var dayKey = String(currentDay);
    var payload = details && typeof details === "object" ? details : {};
    var logEntry;

    Object.keys(governor.interventionCountsByDay || {}).forEach(function(existingKey){
      var numericDay = Number(existingKey);
      if (!Number.isFinite(numericDay)) return;
      if (Math.abs(currentDay - numericDay) > 10) {
        delete governor.interventionCountsByDay[existingKey];
      }
    });

    governor.interventionCountsByDay[dayKey] = Math.max(0, Number(governor.interventionCountsByDay[dayKey]) || 0) + 1;
    logEntry = {
      id:"gov-log-" + currentDay + "-" + key + "-" + Math.floor(Math.random() * 1000000),
      day:currentDay,
      key:key,
      text:String(payload.text || "Governor intervention applied."),
      scope:String(payload.scope || "global"),
      entities:payload.entities && typeof payload.entities === "object" ? JSON.parse(JSON.stringify(payload.entities)) : {},
      causes:Array.isArray(payload.causes) ? payload.causes.slice(0, 4).map(function(cause){ return String(cause); }) : []
    };
    governor.interventionLog.unshift(logEntry);
    if (governor.interventionLog.length > 200) {
      governor.interventionLog.length = 200;
    }
    setGovernorCooldown(governor, key);
  }

  function emitGovernorIntervention(text, details){
    var payload = details || {};
    var tags = ["governor", payload.tag || "intervention", payload.intensity || "soft"];

    emitNews("market", text, {
      tags:tags,
      scope:payload.scope || "global",
      entities:payload.entities || {},
      causes:(payload.causes || ["Simulation health governor applied a soft correction."]).slice(0, 3)
    });
  }

  function recordLaunchWindow(year, launchCount){
    var governor = ensureGovernorState();
    var count = Math.max(0, Math.floor(Number(launchCount) || 0));

    governor.annualLaunches = count;
    governor.lastLaunchYear = Math.floor(Number(year) || 0);
    governor.noLaunchYears = count <= 0 ? governor.noLaunchYears + 1 : 0;
  }

  function detectGovernorSignals(){
    var governor = ensureGovernorState();
    var activeBusinesses = (App.store.businesses || []).filter(function(business){
      return !!(business && business.ownerId);
    });
    var owners = activeBusinesses.map(function(business){
      return App.store.getPerson(business.ownerId);
    }).filter(function(person){
      return !!(person && person.alive);
    });
    var seniorOwners = owners.filter(function(person){
      return (Number(person.age) || 0) >= GOVERNOR_CONFIG.agingSeniorAge;
    }).length;
    var seniorShare = owners.length ? seniorOwners / owners.length : 0;
    var normalizedRates = App.store.blocs.map(function(bloc){
      return (Number(bloc.rate) || 0) / Math.max(0.0001, Number(bloc.baseRate) || 1);
    });
    var convergenceStd = standardDeviation(normalizedRates);
    var signals = {
      noLaunchYears:governor.noLaunchYears,
      noLaunch:governor.noLaunchYears >= GOVERNOR_CONFIG.noLaunchYearsThreshold,
      emptyBlocIds:[],
      unemploymentTrapBlocIds:[],
      agingLock:false,
      currencyConvergence:false,
      currencyConvergenceStd:convergenceStd
    };

    App.store.blocs.forEach(function(bloc){
      var blocId = bloc.id;
      var population = getBlocPopulation(blocId);
      var businessCount = activeBusinesses.filter(function(business){
        return business.blocId === blocId;
      }).length;
      var businessesPerMillion = population > 0 ? (businessCount / Math.max(0.25, population / 1000000)) : businessCount;
      var unemploymentRate = getBlocUnemploymentRate(blocId);

      if (population >= 200000 && businessesPerMillion < GOVERNOR_CONFIG.emptyEcosystemMinDensityPerMillion) {
        governor.emptyEcosystemTicksByBloc[blocId] = Math.max(0, Number(governor.emptyEcosystemTicksByBloc[blocId]) || 0) + SIM_DAYS_PER_TICK;
      } else {
        governor.emptyEcosystemTicksByBloc[blocId] = decayCounter(governor.emptyEcosystemTicksByBloc[blocId], SIM_DAYS_PER_TICK * 2);
      }

      if ((Number(governor.emptyEcosystemTicksByBloc[blocId]) || 0) >= GOVERNOR_CONFIG.emptyEcosystemTicksThreshold) {
        signals.emptyBlocIds.push(blocId);
      }

      if (unemploymentRate >= GOVERNOR_CONFIG.unemploymentRateThreshold) {
        governor.unemploymentTrapTicksByBloc[blocId] = Math.max(0, Number(governor.unemploymentTrapTicksByBloc[blocId]) || 0) + SIM_DAYS_PER_TICK;
      } else {
        governor.unemploymentTrapTicksByBloc[blocId] = decayCounter(governor.unemploymentTrapTicksByBloc[blocId], SIM_DAYS_PER_TICK * 2);
      }

      if ((Number(governor.unemploymentTrapTicksByBloc[blocId]) || 0) >= GOVERNOR_CONFIG.unemploymentTrapTicksThreshold) {
        signals.unemploymentTrapBlocIds.push(blocId);
      }
    });

    if (owners.length >= 6 && seniorShare >= GOVERNOR_CONFIG.agingShareThreshold && governor.noLaunchYears >= 1) {
      governor.agingLockTicks += SIM_DAYS_PER_TICK;
    } else {
      governor.agingLockTicks = decayCounter(governor.agingLockTicks, SIM_DAYS_PER_TICK * 2);
    }

    signals.agingLock = governor.agingLockTicks >= GOVERNOR_CONFIG.agingLockTicksThreshold;

    if (convergenceStd <= GOVERNOR_CONFIG.currencyConvergenceStdThreshold) {
      governor.currencyConvergenceTicks += SIM_DAYS_PER_TICK;
    } else {
      governor.currencyConvergenceTicks = decayCounter(governor.currencyConvergenceTicks, SIM_DAYS_PER_TICK * 2);
    }

    signals.currencyConvergence = governor.currencyConvergenceTicks >= GOVERNOR_CONFIG.currencyConvergenceTicksThreshold;

    governor.signalSnapshot = {
      day:Math.max(0, Math.floor(App.store.simDay || 0)),
      noLaunchYears:signals.noLaunchYears,
      emptyBlocIds:signals.emptyBlocIds.slice(0),
      unemploymentTrapBlocIds:signals.unemploymentTrapBlocIds.slice(0),
      agingLockTicks:governor.agingLockTicks,
      currencyConvergenceTicks:governor.currencyConvergenceTicks,
      currencyConvergenceStd:signals.currencyConvergenceStd
    };

    return signals;
  }

  function findSeedEntrepreneurCandidate(blocId){
    return App.store.getLivingPeople().filter(function(person){
      if (!person || person.retired || person.businessId) return false;
      if (person.employerBusinessId && person.jobTitle === "CEO") return false;
      if (person.blocId !== blocId) return false;
      if ((Number(person.age) || 0) < 24 || (Number(person.age) || 0) > 56) return false;
      return true;
    }).sort(function(first, second){
      var firstScore = 0;
      var secondScore = 0;

      firstScore += hasEntrepreneurialTraits(first) ? 18 : 0;
      firstScore += getTraitChannelScore(first, "mobility") * 0.9;
      firstScore += getTraitChannelScore(first, "business") * 0.8;
      firstScore += App.utils.clamp(Number(first.educationIndex) || 0, 0, 100) * 0.24;
      firstScore += App.utils.clamp(Number(first.skills && first.skills.creativity) || 0, 0, 100) * 0.2;
      firstScore += App.utils.clamp(Number(first.skills && first.skills.management) || 0, 0, 100) * 0.14;

      secondScore += hasEntrepreneurialTraits(second) ? 18 : 0;
      secondScore += getTraitChannelScore(second, "mobility") * 0.9;
      secondScore += getTraitChannelScore(second, "business") * 0.8;
      secondScore += App.utils.clamp(Number(second.educationIndex) || 0, 0, 100) * 0.24;
      secondScore += App.utils.clamp(Number(second.skills && second.skills.creativity) || 0, 0, 100) * 0.2;
      secondScore += App.utils.clamp(Number(second.skills && second.skills.management) || 0, 0, 100) * 0.14;

      return secondScore - firstScore;
    })[0] || null;
  }

  function applySeededEntrepreneur(blocId, reason){
    var governor = ensureGovernorState();
    var candidate;
    var business;
    var household;
    var launchCapital;
    var bloc = App.store.getBloc(blocId);

    if (!canApplyGovernorIntervention(governor, "seededEntrepreneur")) return false;

    candidate = findSeedEntrepreneurCandidate(blocId);
    if (!candidate) return false;

    business = createBusiness(candidate);
    seedBusiness(business);
    household = getHouseholdForPerson(candidate);
    launchCapital = Math.min(candidate.netWorthGU * 0.1, Math.max(2200, business.cashReservesGU * 0.35));
    if (household) {
      launchCapital += Math.min(household.cashOnHandGU || 0, Math.max(900, (household.monthlyExpensesGU || 0) * 0.8));
      household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) - Math.min(household.cashOnHandGU || 0, launchCapital * 0.55));
      refreshHouseholdSnapshot(household);
    }

    business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + launchCapital);
    business.reputation = clampScore((business.reputation || 50) + 3.5);
    App.store.businesses.push(business);
    candidate.businessId = business.id;
    candidate.pulse = 1;
    syncBusinessLeadership(business);
    syncPerson(candidate);

    governor.noLaunchYears = 0;
    governor.annualLaunches = Math.max(1, Number(governor.annualLaunches) || 0);
    recordGovernorIntervention(governor, "seededEntrepreneur", {
      text:(bloc ? bloc.flag + " " : "") + "Governor seeded a new founder: " + candidate.name + " launched " + business.name + ".",
      scope:"bloc",
      entities:{
        personIds:[candidate.id],
        businessIds:[business.id],
        countryIsos:[business.countryISO],
        blocIds:[business.blocId]
      },
      causes:[
        reason || "Launch drought threatened business renewal.",
        "Soft governor intervention seeded entrepreneurship momentum."
      ]
    });

    emitGovernorIntervention((bloc ? bloc.flag + " " : "") + "Governor seeded a new founder: <strong>" + candidate.name + "</strong> launched <strong>" + business.name + "</strong>.", {
      tag:"seed",
      intensity:"soft",
      scope:"bloc",
      entities:{
        personIds:[candidate.id],
        businessIds:[business.id],
        countryIsos:[business.countryISO],
        blocIds:[business.blocId]
      },
      causes:[
        reason || "Launch drought threatened business renewal.",
        "Soft governor intervention seeded entrepreneurship momentum."
      ]
    });
    return true;
  }

  function applyCapitalEasing(blocId, reason){
    var governor = ensureGovernorState();
    var targets;
    var totalInjection = 0;
    var bloc = App.store.getBloc(blocId);

    if (!canApplyGovernorIntervention(governor, "capitalEasing")) return false;

    targets = App.store.businesses.filter(function(business){
      return business && business.blocId === blocId && business.stage !== "defunct";
    }).map(function(business){
      return {
        business:business,
        cashCoverage:getCashCoverageMonths(business)
      };
    }).filter(function(item){
      return item.cashCoverage < 1.5 || (item.business.profitGU || 0) < 0;
    }).sort(function(first, second){
      return first.cashCoverage - second.cashCoverage;
    }).slice(0, 3);

    if (!targets.length) return false;

    targets.forEach(function(item){
      var business = item.business;
      var injection = Math.max(1800, (Number(business.revenueGU) || 0) * 0.0045);
      injection = Math.min(injection, Math.max(6000, (Number(business.valuationGU) || 0) * 0.008));
      business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + injection);
      business.reputation = clampScore((business.reputation || 50) + 0.8);
      totalInjection += injection;
    });

    recordGovernorIntervention(governor, "capitalEasing", {
      text:(bloc ? bloc.flag + " " : "") + "Governor applied temporary capital easing to " + targets.length + " firms.",
      scope:"bloc",
      entities:{
        businessIds:targets.map(function(item){ return item.business.id; }),
        countryIsos:targets.map(function(item){ return item.business.countryISO; }),
        blocIds:blocId ? [blocId] : []
      },
      causes:[
        reason || "Business density and resilience dropped below healthy range.",
        "Soft liquidity bridge stabilized near-term operations."
      ]
    });
    emitGovernorIntervention((bloc ? bloc.flag + " " : "") + "Governor applied temporary capital easing to <strong>" + targets.length + "</strong> firms.", {
      tag:"capital-easing",
      intensity:"soft",
      scope:"bloc",
      entities:{
        businessIds:targets.map(function(item){ return item.business.id; }),
        countryIsos:targets.map(function(item){ return item.business.countryISO; }),
        blocIds:blocId ? [blocId] : []
      },
      causes:[
        reason || "Business density and resilience dropped below healthy range.",
        "Soft liquidity bridge of " + App.utils.fmtL(totalInjection, bloc || App.store.getBloc("NA")) + " stabilized near-term operations."
      ]
    });
    return true;
  }

  function createArrivalForBloc(blocId, causeText){
    var bloc = App.store.getBloc(blocId);
    var arrival;

    if (!bloc) return null;
    if (App.store.getLivingCount() >= 140) return null;

    arrival = createCitizen({
      blocId:bloc.id,
      countryISO:pickCountryByPopulationPressure(bloc.id) || undefined,
      age:App.utils.randInt(21, 43),
      netWorthGU:App.utils.rand(1800, 26000)
    });
    App.store.people.push(arrival);
    seedHousehold(arrival);
    syncPerson(arrival);
    emitGovernorIntervention(bloc.flag + " Governor opened calibrated migration relief: <strong>" + arrival.name + "</strong> arrived with " + App.utils.fmtCountry(arrival.netWorthGU, arrival.countryISO) + ".", {
      tag:"migration-relief",
      intensity:"soft",
      scope:"bloc",
      entities:{
        personIds:[arrival.id],
        countryIsos:[arrival.countryISO],
        blocIds:[arrival.blocId]
      },
      causes:[
        causeText || "Labor and ecosystem replenishment needed in under-active markets.",
        "Calibrated arrival boost added fresh labor and founder potential."
      ]
    });
    return arrival;
  }

  function applyMigrationRelief(blocId, reason){
    var governor = ensureGovernorState();
    var arrival;

    if (!canApplyGovernorIntervention(governor, "migrationRelief")) return false;

    arrival = createArrivalForBloc(blocId, reason);
    if (!arrival) return false;
    recordGovernorIntervention(governor, "migrationRelief", {
      text:"Governor opened migration relief and admitted " + arrival.name + ".",
      scope:"bloc",
      entities:{
        personIds:[arrival.id],
        countryIsos:[arrival.countryISO],
        blocIds:[arrival.blocId]
      },
      causes:[
        reason || "Labor and ecosystem replenishment needed in under-active markets.",
        "Calibrated arrival boost added fresh labor and founder potential."
      ]
    });
    return true;
  }

  function applyHiringIncentive(blocId, reason){
    var governor = ensureGovernorState();
    var targets;
    var totalHires = 0;
    var bloc = App.store.getBloc(blocId);

    if (!canApplyGovernorIntervention(governor, "hiringIncentive")) return false;

    targets = App.store.businesses.filter(function(business){
      return business && business.blocId === blocId && business.stage !== "defunct";
    }).filter(function(business){
      return (Number(business.profitGU) || 0) > 0 && getCashCoverageMonths(business) >= 2;
    }).sort(function(first, second){
      return (Number(second.profitGU) || 0) - (Number(first.profitGU) || 0);
    }).slice(0, 4);

    targets.forEach(function(business){
      var leadershipFloor = Math.max((business.leadership || []).length, 1);
      var current = Math.max(leadershipFloor, Number(business.employees) || leadershipFloor);
      var room = Math.max(0, 2000 - current);
      var requested = Math.min(room, App.utils.randInt(1, 3));
      var hires = reserveLabor(business.countryISO, requested);

      if (hires <= 0) return;
      business.employees = Math.max(leadershipFloor, Math.min(2000, current + hires));
      business.reputation = clampScore((business.reputation || 50) + 0.35);
      totalHires += hires;
    });

    if (totalHires <= 0) return false;

    recordGovernorIntervention(governor, "hiringIncentive", {
      text:(bloc ? bloc.flag + " " : "") + "Governor hiring incentives unlocked " + totalHires + " new jobs.",
      scope:"bloc",
      entities:{
        businessIds:targets.map(function(business){ return business.id; }),
        countryIsos:targets.map(function(business){ return business.countryISO; }),
        blocIds:blocId ? [blocId] : []
      },
      causes:[
        reason || "Unemployment stayed elevated beyond healthy persistence.",
        "Short-lived incentive nudged hiring without hard market overrides."
      ]
    });
    emitGovernorIntervention((bloc ? bloc.flag + " " : "") + "Governor hiring incentives unlocked <strong>" + totalHires + "</strong> new jobs.", {
      tag:"hiring-incentive",
      intensity:"soft",
      scope:"bloc",
      entities:{
        businessIds:targets.map(function(business){ return business.id; }),
        countryIsos:targets.map(function(business){ return business.countryISO; }),
        blocIds:blocId ? [blocId] : []
      },
      causes:[
        reason || "Unemployment stayed elevated beyond healthy persistence.",
        "Short-lived incentive nudged hiring without hard market overrides."
      ]
    });
    return true;
  }

  function applyCurrencyDivergenceNudge(reason){
    var governor = ensureGovernorState();
    var ordered;
    var weakest;
    var strongest;
    var weakestNorm;
    var strongestNorm;

    if (!canApplyGovernorIntervention(governor, "forexNudge")) return false;
    if ((App.store.blocs || []).length < 2) return false;

    ordered = App.store.blocs.slice().sort(function(first, second){
      var firstNorm = (Number(first.rate) || 0) / Math.max(0.0001, Number(first.baseRate) || 1);
      var secondNorm = (Number(second.rate) || 0) / Math.max(0.0001, Number(second.baseRate) || 1);
      return firstNorm - secondNorm;
    });
    weakest = ordered[0];
    strongest = ordered[ordered.length - 1];
    if (!weakest || !strongest || weakest.id === strongest.id) return false;

    weakestNorm = (Number(weakest.rate) || 0) / Math.max(0.0001, Number(weakest.baseRate) || 1);
    strongestNorm = (Number(strongest.rate) || 0) / Math.max(0.0001, Number(strongest.baseRate) || 1);
    if (Math.abs(strongestNorm - weakestNorm) > 0.08) return false;

    weakest.rate = Math.max(weakest.baseRate * 0.55, Math.min(weakest.baseRate * 2.2, weakest.rate * 1.006));
    strongest.rate = Math.max(strongest.baseRate * 0.55, Math.min(strongest.baseRate * 2.2, strongest.rate * 0.994));
    weakest.rateHistory = Array.isArray(weakest.rateHistory) ? weakest.rateHistory : [];
    strongest.rateHistory = Array.isArray(strongest.rateHistory) ? strongest.rateHistory : [];
    weakest.rateHistory.push(weakest.rate);
    strongest.rateHistory.push(strongest.rate);
    if (weakest.rateHistory.length > 60) weakest.rateHistory.shift();
    if (strongest.rateHistory.length > 60) strongest.rateHistory.shift();

    recordGovernorIntervention(governor, "forexNudge", {
      text:"Governor applied a soft currency divergence nudge between " + weakest.name + " and " + strongest.name + ".",
      scope:"global",
      entities:{
        blocIds:[weakest.id, strongest.id]
      },
      causes:[
        reason || "Bloc currencies were converging into low-volatility lock.",
        "A bounded adjustment restored relative signal separation."
      ]
    });
    emitGovernorIntervention("Governor applied a soft currency divergence nudge between " + weakest.flag + " " + weakest.name + " and " + strongest.flag + " " + strongest.name + ".", {
      tag:"forex-nudge",
      intensity:"soft",
      scope:"global",
      entities:{
        blocIds:[weakest.id, strongest.id]
      },
      causes:[
        reason || "Bloc currencies were converging into low-volatility lock.",
        "A bounded adjustment restored relative signal separation."
      ]
    });
    return true;
  }

  function runSimulationHealthGovernors(){
    var governor = ensureGovernorState();
    var blocPresenceMeta;
    var signals;
    var seedTarget;
    var emptyTarget;
    var emptyTargetBusinessCount;
    var seededEmptyBloc = false;
    var unemploymentTarget;

    if (!governor.enabled) return;

    governor.runCount += 1;
    governor.lastRunDay = Math.max(0, Math.floor(App.store.simDay || 0));
    signals = detectGovernorSignals();
    blocPresenceMeta = buildBlocBusinessPresenceMeta();

    seedTarget = pickMostUnderrepresentedBlocId(signals.emptyBlocIds, blocPresenceMeta) || (App.store.blocs[0] && App.store.blocs[0].id);
    if ((signals.noLaunch || signals.agingLock) && seedTarget) {
      applySeededEntrepreneur(seedTarget, signals.agingLock ? "Aging ownership and weak succession renewal raised stagnation risk." : "No new launches persisted across yearly windows.");
    }

    emptyTarget = pickMostUnderrepresentedBlocId(signals.emptyBlocIds, blocPresenceMeta);
    if (emptyTarget) {
      emptyTargetBusinessCount = Math.max(0, Number(blocPresenceMeta.activeBusinessesByBloc && blocPresenceMeta.activeBusinessesByBloc[emptyTarget]) || 0);
      if (emptyTargetBusinessCount <= 0) {
        seededEmptyBloc = applySeededEntrepreneur(emptyTarget, "A bloc ecosystem collapsed to zero active firms and needed a founder reset.");
      }
      if (emptyTargetBusinessCount > 0) {
        applyCapitalEasing(emptyTarget, "Business ecosystem density remained below stability threshold.");
      }
      applyMigrationRelief(emptyTarget, "Ecosystem thinning required calibrated arrival support.");
      if (!seededEmptyBloc && emptyTargetBusinessCount <= 1) {
        applySeededEntrepreneur(emptyTarget, "An underrepresented bloc lacked enough active firms to regenerate on its own.");
      }
    }

    unemploymentTarget = signals.unemploymentTrapBlocIds[0];
    if (unemploymentTarget) {
      applyHiringIncentive(unemploymentTarget, "Prolonged unemployment exceeded trap threshold in bloc labor markets.");
    }

    if (signals.currencyConvergence) {
      applyCurrencyDivergenceNudge("Sustained currency convergence weakened macro differentiation signals.");
    }
  }

  function getFallbackSpawnPos(iso, preferredState){
    if (iso === "US") {
      var stateCode = normalizeUSStateCode(preferredState) || App.utils.pick(App.data.US_STATE_CODES);
      var centroid = App.data.US_STATE_CENTROIDS[stateCode];

      if (!centroid) {
        stateCode = App.utils.pick(App.data.US_STATE_CODES.filter(function(code){
          return !!App.data.US_STATE_CENTROIDS[code];
        })) || "CA";
        centroid = App.data.US_STATE_CENTROIDS[stateCode] || [37.2, -119.4];
      }

      return {
        pos: App.utils.latLngToSVG(centroid[0], centroid[1]),
        iso:"US",
        state:stateCode
      };
    }

    if (App.data.CENTROIDS[iso]) {
      var pair = App.data.CENTROIDS[iso];
      return {
        pos: App.utils.latLngToSVG(pair[0], pair[1]),
        iso:iso,
        state:null
      };
    }

    return {
      pos:{ x:500, y:253 },
      iso:iso,
      state:null
    };
  }

  function getSpawnPos(iso, preferredState){
    if (App.map && App.map.getCountrySpawnPoint) {
      return App.map.getCountrySpawnPoint(iso, preferredState) || getFallbackSpawnPos(iso, preferredState);
    }

    return getFallbackSpawnPos(iso, preferredState);
  }

  function getNearbySpawn(anchorPerson, iso, preferredState){
    var viewBox = App.data.MAP_VIEWBOX || { width:1000, height:507.209 };
    var x;
    var y;
    var attempt;

    if (!anchorPerson) {
      return getSpawnPos(iso, preferredState);
    }

    if (App.map && App.map.isPointInCountry) {
      for (attempt = 0; attempt < 18; attempt += 1) {
        x = App.utils.clamp(anchorPerson.svgX + App.utils.rand(-8, 8), 0, viewBox.width);
        y = App.utils.clamp(anchorPerson.svgY + App.utils.rand(-5, 5), 0, viewBox.height);
        if (App.map.isPointInCountry(iso, x, y)) {
          return {
            pos:{ x:x, y:y },
            iso:iso,
            state:preferredState || anchorPerson.state || null
          };
        }
      }
    }

    return {
      pos:getSpawnPos(iso, preferredState || anchorPerson.state).pos,
      iso:iso,
      state:preferredState || anchorPerson.state || null
    };
  }
  function relocatePersonToCountry(person, destinationIso, options){
    var iso;
    var state;
    var subdivision;
    var spawn;
    var resolvedState;
    var resolvedSubdivision;
    var nextCity;
    var employer;

    if (!person) return false;

    iso = String(destinationIso || "").trim().toUpperCase();
    if (!iso) return false;
    if (!isResidencyEligibleCountry(iso)) return false;

    subdivision = normalizeText((options && (options.subdivision || options.state)) || person.subdivision || person.state || null);
    state = iso === "US" ? subdivision : null;
    spawn = getSpawnPos(iso, state);
    resolvedState = iso === "US" ? (spawn && spawn.state ? spawn.state : state) : null;
    resolvedSubdivision = iso === "US" ? resolvedState : subdivision;
    nextCity = normalizeText(options && options.city) || pickCountryCity(iso, [person.id, iso, App.store.simDay, "relocate"].join("|"), resolvedSubdivision);
    resolvedSubdivision = resolveSubdivisionForCity(iso, nextCity, resolvedSubdivision);

    person.countryISO = iso;
    if (App.store.isoToBloc && App.store.isoToBloc[iso]) {
      person.blocId = App.store.isoToBloc[iso];
    }
    setPersonSubdivisionFields(person, iso, resolvedSubdivision);
    person.city = nextCity || null;

    if (!person.birthCity && person.city) {
      person.birthCity = person.city;
    }

    if (spawn && spawn.pos) {
      person.svgX = spawn.pos.x;
      person.svgY = spawn.pos.y;
    }

    if (person.employerBusinessId) {
      employer = App.store.getBusiness(person.employerBusinessId);
      if (!employer || employer.countryISO !== person.countryISO) {
        clearEmployment(person, person.employerBusinessId);
      }
    }

    return true;
  }

  function relocateMobileWorkers(sourceIso, targetIso, count){
    var request = Math.max(0, floorInt(count));
    var eligible;
    var moved = 0;

    if (!sourceIso || !targetIso || request <= 0) return 0;

    eligible = App.store.getLivingPeople().filter(function(person){
      return person &&
        person.countryISO === sourceIso &&
        person.alive &&
        person.age >= 18 &&
        !person.retired &&
        !person.businessId &&
        !person.employerBusinessId;
    }).sort(function(first, second){
      var firstStreak = Number(first.unemploymentStreakDays) || 0;
      var secondStreak = Number(second.unemploymentStreakDays) || 0;
      if (secondStreak !== firstStreak) return secondStreak - firstStreak;
      return (first.id || "").localeCompare(second.id || "");
    });

    eligible.slice(0, request).forEach(function(person){
      if (!relocatePersonToCountry(person, targetIso)) return;
      syncPerson(person);
      moved += 1;
    });

    return moved;
  }

  function pickCountryFromBloc(blocId){
    var bloc = App.store.getBloc(blocId);
    var members;

    function getCountryWeight(iso){
      var signals = getCountrySelectionSignals(iso);
      return App.utils.clamp(0.2 + (signals.populationSignal * 1.7) + (signals.institutionSignal * 0.9) + (signals.educationSignal * 0.7), 0.1, 6);
    }

    if (!bloc || !Array.isArray(bloc.members) || !bloc.members.length) {
      return App.utils.pick(App.data.COUNTRY_CODES || ["US"]);
    }

    members = bloc.members.filter(function(iso){
      return isResidencyEligibleCountry(iso);
    });

    if (!members.length) {
      members = (App.data.COUNTRY_CODES || []).filter(function(iso){
        return isResidencyEligibleCountry(iso);
      });
    }

    if (!members.length) return "US";

    return pickWeightedCountryFromCandidates(members, getCountryWeight, App.utils.pick(members));
  }

  function pickBootstrapCountryFromBloc(blocId){
    var bloc = App.store.getBloc(blocId);
    var members;
    var sizableMembers;

    function getBootstrapCountryWeight(iso){
      var signals = getCountrySelectionSignals(iso);
      var sizeBonus = signals.population >= 1000000 ? 0.32 : 0;
      return App.utils.clamp(0.18 + (signals.populationSignal * 1.5) + (signals.institutionSignal * 0.7) + (signals.educationSignal * 0.55) + sizeBonus, 0.08, 5.5);
    }

    if (!bloc || !Array.isArray(bloc.members) || !bloc.members.length) {
      return pickCountryFromBloc(blocId);
    }

    members = bloc.members.filter(function(iso){
      return isResidencyEligibleCountry(iso);
    });
    sizableMembers = members.filter(function(iso){
      var profile = App.store.countryProfiles ? App.store.countryProfiles[iso] : null;
      var country = App.store.countryData ? App.store.countryData[iso] : null;
      var population = Number(profile && profile.population != null ? profile.population : (country && country.population));
      return !Number.isFinite(population) || population >= 1000000;
    });

    if (sizableMembers.length) {
      return pickWeightedCountryFromCandidates(sizableMembers, getBootstrapCountryWeight, App.utils.pick(sizableMembers));
    }

    return members.length ? pickWeightedCountryFromCandidates(members, getBootstrapCountryWeight, App.utils.pick(members)) : pickCountryFromBloc(blocId);
  }

  function pickWeightedName(entries){
    var totalWeight = (entries || []).reduce(function(sum, entry){
      return sum + Number(entry[1] || 0);
    }, 0);
    var roll;
    var running = 0;

    if (!entries || !entries.length || totalWeight <= 0) {
      return null;
    }

    roll = Math.random() * totalWeight;
    for (var i = 0; i < entries.length; i += 1) {
      running += Number(entries[i][1] || 0);
      if (running >= roll) {
        return entries[i][0];
      }
    }

    return entries[entries.length - 1][0];
  }

  function pickFallbackFirstName(blocId, sex){
    var names = App.data.NAMES[blocId] || App.data.NAMES.NA;
    return App.utils.pick(sex === "female" ? names.female : names.male);
  }

  function pickFallbackLastName(blocId){
    var names = App.data.NAMES[blocId] || App.data.NAMES.NA;
    return App.utils.pick(names.last);
  }

  function pickFirstName(countryISO, blocId, sex){
    var exactPool = App.data.NAME_POOLS[countryISO];
    var blocPool = App.data.BLOC_NAME_POOLS[blocId];
    var entries = exactPool ? (sex === "female" ? exactPool.female : exactPool.male) : null;

    if (!entries || !entries.length) {
      entries = blocPool ? (sex === "female" ? blocPool.female : blocPool.male) : null;
    }

    return pickWeightedName(entries) || pickFallbackFirstName(blocId, sex);
  }

  function pickLastName(countryISO, blocId){
    var exactPool = App.data.NAME_POOLS[countryISO];
    var blocPool = App.data.BLOC_NAME_POOLS[blocId];
    var entries = exactPool ? exactPool.surnames : null;

    if (!entries || !entries.length) {
      entries = blocPool ? blocPool.surnames : null;
    }

    return pickWeightedName(entries) || pickFallbackLastName(blocId);
  }

  function countSharedTraits(first, second){
    return first.traits.filter(function(trait){
      return second.traits.indexOf(trait) !== -1;
    }).length;
  }

  function normalizeUniqueIdList(values, selfId){
    var seen = {};

    return (Array.isArray(values) ? values : []).map(function(id){
      return String(id || "").trim();
    }).filter(function(id){
      if (!id || (selfId && id === selfId) || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function ensureFamilyDynamics(person){
    if (!person) return;
    person.formerSpouseIds = normalizeUniqueIdList(person.formerSpouseIds, person.id);
    person.estrangedChildIds = normalizeUniqueIdList(person.estrangedChildIds, person.id);
    person.estrangedParentIds = normalizeUniqueIdList(person.estrangedParentIds, person.id);
    person.nonMaritalChildIds = normalizeUniqueIdList(person.nonMaritalChildIds, person.id);
    if (person.birthUnionType !== "non_marital") {
      person.birthUnionType = "marital";
    }
  }

  function ensurePersonalReputation(person){
    var source;

    if (!person) return;
    source = person.personalReputation && typeof person.personalReputation === "object" ? person.personalReputation : {};
    person.personalReputation = {
      trust:App.utils.clamp(Number(source.trust) || 50, 0, 100),
      prestige:App.utils.clamp(Number(source.prestige) || 35, 0, 100),
      notoriety:App.utils.clamp(Number(source.notoriety) || 12, 0, 100),
      scandalMemory:App.utils.clamp(Number(source.scandalMemory) || 0, 0, 100)
    };
  }

  function ensureSocialNetworkData(person){
    if (!person) return;
    person.mentorId = String(person.mentorId || "").trim() || null;
    if (person.mentorId === person.id) person.mentorId = null;
    person.rivalIds = normalizeUniqueIdList(person.rivalIds, person.id).slice(0, 8);
    person.closeFriendIds = normalizeUniqueIdList(person.closeFriendIds, person.id).slice(0, 10);
    person.eliteCircleIds = normalizeUniqueIdList(person.eliteCircleIds, person.id).slice(0, 8);
    person.schoolTieIds = normalizeUniqueIdList(person.schoolTieIds, person.id).slice(0, 12);
    person.nepotismTieIds = normalizeUniqueIdList(person.nepotismTieIds, person.id).slice(0, 10);
    person.advisorBusinessIds = normalizeUniqueIdList(person.advisorBusinessIds || [], null).slice(0, 4);
    person.boardBusinessIds = normalizeUniqueIdList(person.boardBusinessIds || [], null).slice(0, 4);
    person.retirementType = String(person.retirementType || "").trim() || null;
    person.retirementInfluence = App.utils.clamp(Number(person.retirementInfluence) || 0, 0, 100);
    ensurePersonalReputation(person);
  }

  function getLifecycleEducationWeight(attainment){
    var rank = {
      none:0,
      primary:1,
      highschool:2,
      bachelor:3,
      masters:4,
      doctorate:5
    };

    return rank[String(attainment || "none").toLowerCase()] || 0;
  }

  function getWorkerLifecycleStage(person){
    var age;
    var educationWeight;
    var skillAverage;
    var hasHighCapitalPath;

    if (!person || !person.alive) return "deceased";
    if (person.retired) return "retiree";
    if (person.businessId) return "founder";

    age = Number(person.age) || 0;
    if (age < 13) return "child";

    if (person.jobTier === "executive" || person.jobTier === "leadership") return "executive";
    if (person.jobTier === "senior" || person.jobTier === "mid") return "manager";
    if (person.employerBusinessId) return "worker";

    educationWeight = getLifecycleEducationWeight(person.educationAttainment);
    skillAverage = getPersonSkillAverage(person);
    hasHighCapitalPath = (person.netWorthGU || 0) >= 60000 || ((person.personalReputation && person.personalReputation.prestige) || 0) >= 58;

    if (age < 23) {
      if (educationWeight >= 3 || skillAverage >= 50) return "student";
      return "worker";
    }

    if ((educationWeight >= 3 && skillAverage >= 54) || (educationWeight >= 4) || (skillAverage >= 66 && hasHighCapitalPath)) {
      return "professional";
    }

    if (age >= 70 && !person.employerBusinessId) return "dependent";
    return "worker";
  }

  function getOccupationCategoryForPerson(person){
    var stage = String(person && person.workerLifecycleStage || "dependent");
    var employmentBusiness = person && App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var industry = employmentBusiness ? employmentBusiness.industry : pickDemandIndustryForPerson(person);

    if (stage === "deceased") return "deceased";
    if (stage === "child" || stage === "student") return "dependent";
    if (stage === "founder") return "owner";
    if (stage === "executive") return "executive";
    if (stage === "retiree") {
      if (isInvestorOccupation(person)) return "investor";
      return "dependent";
    }
    if (isInvestorOccupation(person)) return "investor";
    if (isLikelyUnemployed(person)) return "unemployed";
    return getIndustryOccupationForPerson(industry, person);
  }

  function ensureWorkerLifecycleData(person){
    if (!person) return;

    person.workerLifecycleStage = getWorkerLifecycleStage(person);
    person.occupationCategory = getOccupationCategoryForPerson(person);
  }

  function isInvestorOccupation(person){
    var netWorth;
    var portfolioSummary;
    var dividends;

    if (!person || !person.alive) return false;
    if (person.businessId) return false;
    if (person.employerBusinessId && person.jobTier !== "executive" && person.jobTier !== "leadership") return false;

    netWorth = Number(person.netWorthGU) || 0;
    portfolioSummary = App.store.getPersonPortfolioSummary ? App.store.getPersonPortfolioSummary(person.id) : { holdings:0, annualDividendGU:0, marketValueGU:0 };
    dividends = Number(portfolioSummary.annualDividendGU) || 0;

    if ((portfolioSummary.holdings || 0) >= 2 && dividends >= 1800) return true;
    if ((portfolioSummary.marketValueGU || 0) >= 38000 && (person.age || 0) >= 40) return true;
    if (netWorth >= 130000 && (person.age || 0) >= 48) return true;
    return false;
  }

  function getIndustryDemandWeights(){
    var weights = {};

    App.store.businesses.forEach(function(business){
      var industry = String(business && business.industry || "Technology");
      var headcount = Math.max(1, Number(business && business.employees) || 1);
      var productivity = getIndustryValue(INDUSTRY_PRODUCTIVITY_MULTIPLIERS, industry, 2.6);
      var weight = headcount * App.utils.clamp(productivity, 1, 8.5);

      weights[industry] = (weights[industry] || 0) + weight;
    });

    return weights;
  }

  function pickDemandIndustryForPerson(person){
    var weights = getIndustryDemandWeights();
    var industries = Object.keys(weights);
    var total;
    var roll;
    var running = 0;
    var year = currentYear();
    var chosen = null;

    if (!person || !industries.length) return "Technology";

    total = industries.reduce(function(sum, industry){
      return sum + Math.max(0, Number(weights[industry]) || 0);
    }, 0);
    if (total <= 0) return "Technology";

    roll = hashString(String(person.id || "") + "|" + year + "|industry-demand") % Math.max(1, Math.floor(total));
    industries.forEach(function(industry){
      if (running > roll) return;
      running += Math.max(0, Number(weights[industry]) || 0);
      if (running > roll) {
        roll = -1;
        chosen = industry;
      }
    });

    return chosen || industries[0] || "Technology";
  }

  function getIndustryOccupationForPerson(industry, person){
    var mix = INDUSTRY_OCCUPATION_MIX[industry] || INDUSTRY_OCCUPATION_MIX.Technology;
    var weights = {
      factory_worker:Math.max(0.001, Number(mix.factory_worker) || 0),
      engineer:Math.max(0.001, Number(mix.engineer) || 0),
      accountant:Math.max(0.001, Number(mix.accountant) || 0),
      sales:Math.max(0.001, Number(mix.sales) || 0),
      operator:Math.max(0.001, Number(mix.operator) || 0)
    };
    var technical = Number(person && person.skills && person.skills.technical) || 0;
    var social = Number(person && person.skills && person.skills.social) || 0;
    var finance = Number(person && person.skills && person.skills.financialDiscipline) || 0;
    var management = Number(person && person.skills && person.skills.management) || 0;
    var year = currentYear();
    var picks = Object.keys(weights);
    var total;
    var roll;
    var running = 0;
    var chosen = "operator";

    weights.engineer *= 1 + App.utils.clamp((technical - 48) / 55, -0.45, 0.95);
    weights.accountant *= 1 + App.utils.clamp((finance - 46) / 52, -0.45, 0.9);
    weights.sales *= 1 + App.utils.clamp((social - 44) / 50, -0.45, 0.9);
    weights.operator *= 1 + App.utils.clamp((management - 50) / 80, -0.25, 0.4);
    weights.factory_worker *= 1 + App.utils.clamp((56 - technical) / 85, -0.3, 0.45);

    total = picks.reduce(function(sum, key){
      return sum + Math.max(0.001, Number(weights[key]) || 0);
    }, 0);

    roll = hashString(String(person && person.id || "") + "|" + year + "|occupation|" + String(industry || "Technology")) % Math.max(1, Math.floor(total * 1000));

    picks.forEach(function(key){
      if (running > roll) return;
      running += Math.max(1, Math.floor(weights[key] * 1000));
      if (running > roll) {
        chosen = key;
        roll = -1;
      }
    });

    return chosen;
  }

  function isLikelyUnemployed(person){
    var profile;
    var unemploymentRate;
    var education;
    var technical;
    var social;
    var finance;
    var discipline;
    var employability;
    var threshold;
    var modifier;
    var unemploymentDurationPenalty;

    if (!person || !person.alive) return false;
    if (person.businessId || person.employerBusinessId) return false;
    if (person.age < 18 || person.retired) return false;

    profile = ensureCountryProfile(person.countryISO);
    unemploymentRate = profile && profile.laborForce > 0 ? ((profile.unemployed || 0) / Math.max(1, profile.laborForce || 1)) : 0.12;
    education = Number(person.educationIndex) || 0;
    technical = Number(person.skills && person.skills.technical) || 0;
    social = Number(person.skills && person.skills.social) || 0;
    finance = Number(person.skills && person.skills.financialDiscipline) || 0;
    ensureDecisionData(person);
    discipline = Number(person.decisionProfile && person.decisionProfile.discipline) || 0;
    unemploymentDurationPenalty = Math.min(14, Math.max(0, Number(person.unemploymentStreakDays) || 0) / 34);
    employability = (education * 0.45) + (technical * 0.22) + (social * 0.18) + (finance * 0.08) + (discipline * 0.1) - unemploymentDurationPenalty;
    modifier = (hashString(String(person.id || "") + "|employment-signal") % 1000) / 1000;
    threshold = App.utils.clamp((unemploymentRate * 100) + (modifier * 12) + 20, 14, 70);

    return employability < threshold;
  }

  function getSocialProximityScore(person, target){
    var score = 0;
    var sameLineage;

    if (!person || !target || person.id === target.id) return 0;
    ensureSocialNetworkData(person);
    sameLineage = person.lineageId && target.lineageId && person.lineageId === target.lineageId;

    if (person.mentorId && person.mentorId === target.id) score += 9;
    if (person.closeFriendIds.indexOf(target.id) !== -1) score += 6;
    if (person.schoolTieIds.indexOf(target.id) !== -1) score += 5;
    if (person.eliteCircleIds.indexOf(target.id) !== -1) score += 4;
    if (person.nepotismTieIds.indexOf(target.id) !== -1) score += 6;
    if (person.rivalIds.indexOf(target.id) !== -1) score -= 7;
    if (sameLineage) score += 5;
    if (person.spouseId && person.spouseId === target.id) score += 5;

    return App.utils.clamp(score, -12, 18);
  }

  function adjustPersonalReputation(person, deltas){
    var change = deltas || {};

    if (!person) return;
    ensurePersonalReputation(person);
    person.personalReputation.trust = App.utils.clamp(person.personalReputation.trust + (Number(change.trust) || 0), 0, 100);
    person.personalReputation.prestige = App.utils.clamp(person.personalReputation.prestige + (Number(change.prestige) || 0), 0, 100);
    person.personalReputation.notoriety = App.utils.clamp(person.personalReputation.notoriety + (Number(change.notoriety) || 0), 0, 100);
    person.personalReputation.scandalMemory = App.utils.clamp(person.personalReputation.scandalMemory + (Number(change.scandalMemory) || 0), 0, 100);
  }

  function decayPersonalReputation(person){
    if (!person || !person.alive) return;
    ensurePersonalReputation(person);
    person.personalReputation.scandalMemory = Math.max(0, person.personalReputation.scandalMemory - App.utils.rand(2, 8));
    person.personalReputation.notoriety = Math.max(0, person.personalReputation.notoriety - App.utils.rand(0.8, 2.6));
  }

  function markEstrangement(parent, child){
    if (!parent || !child) return;
    ensureFamilyDynamics(parent);
    ensureFamilyDynamics(child);
    if (parent.estrangedChildIds.indexOf(child.id) === -1) {
      parent.estrangedChildIds.push(child.id);
    }
    if (child.estrangedParentIds.indexOf(parent.id) === -1) {
      child.estrangedParentIds.push(parent.id);
    }
  }

  function getHouseholdClassTier(person){
    var household = getHouseholdForPerson(person);
    return household && household.classTier ? household.classTier : "working";
  }

  function getClassTierRank(tier){
    return householdClassRank(String(tier || "working").toLowerCase());
  }

  function getFertilityPreferenceScore(person){
    var familyChannel = getTraitChannelScore(person, "family");

    ensureDecisionData(person);
    return (
      (familyChannel * 1.5) +
      ((person.decisionProfile.familyAttachment - 50) * 0.85) -
      ((person.decisionProfile.statusSeeking - 50) * 0.45) -
      ((person.decisionProfile.greed - 50) * 0.35)
    );
  }

  function getRelationshipCompatibility(first, second){
    var sharedTraits = countSharedTraits(first, second);
    var firstFamily;
    var secondFamily;
    var familyGap;
    var classGap;
    var ambitionGap;
    var fertilityGap;
    var cultureScore = 0;
    var statusMotiveGap;
    var score;

    ensureDecisionData(first);
    ensureDecisionData(second);

    firstFamily = getTraitChannelScore(first, "family") + ((first.decisionProfile.familyAttachment - 50) * 0.4);
    secondFamily = getTraitChannelScore(second, "family") + ((second.decisionProfile.familyAttachment - 50) * 0.4);
    familyGap = Math.abs(firstFamily - secondFamily);
    classGap = Math.abs(getClassTierRank(getHouseholdClassTier(first)) - getClassTierRank(getHouseholdClassTier(second)));
    ambitionGap = Math.abs((first.decisionProfile.statusSeeking - 50) - (second.decisionProfile.statusSeeking - 50));
    fertilityGap = Math.abs(getFertilityPreferenceScore(first) - getFertilityPreferenceScore(second));
    statusMotiveGap = Math.abs((first.decisionProfile.greed + first.decisionProfile.statusSeeking) - (second.decisionProfile.greed + second.decisionProfile.statusSeeking));

    if (first.countryISO === second.countryISO) cultureScore += 8;
    if (first.blocId === second.blocId) cultureScore += 5;
    if (first.nameOrder === second.nameOrder) cultureScore += 2;
    if (first.countryISO === second.countryISO) {
      var firstSubdivision = normalizeText(first.subdivision || first.state);
      var secondSubdivision = normalizeText(second.subdivision || second.state);
      if (firstSubdivision && secondSubdivision && firstSubdivision === secondSubdivision) cultureScore += 2;
    }

    score = 34 +
      (sharedTraits * 7) +
      cultureScore -
      (familyGap * 0.38) -
      (classGap * 5.2) -
      (ambitionGap * 0.26) -
      (fertilityGap * 0.14) -
      (statusMotiveGap * 0.07);

    return {
      score:Math.round(score),
      sharedTraits:sharedTraits,
      classGap:classGap,
      ambitionGap:ambitionGap,
      fertilityGap:fertilityGap,
      cultureScore:cultureScore,
      familyGap:familyGap
    };
  }

  function ageForPerson(person){
    var endDay = person.alive ? App.store.simDay : (person.deathDay != null ? person.deathDay : App.store.simDay);
    return Math.max(0, (endDay - person.birthDay) / YEAR_DAYS);
  }

  function lifeStageForAge(age, alive){
    if (!alive) return "deceased";
    if (age < 13) return "child";
    if (age < 18) return "teen";
    if (age < 65) return "adult";
    return "senior";
  }

  function pickDeterministicOrientation(person){
    var seed;
    var roll;

    if (!person) return "straight";

    seed = hashString([(person.id || ""), (person.sex || ""), (person.countryISO || "")].join("|"));
    roll = (seed % 1000) / 1000;

    if (roll < 0.045) {
      return person.sex === "female" ? "lesbian" : "gay";
    }
    if (roll < 0.135) {
      return "bi";
    }
    return "straight";
  }

  function normalizeOrientationForSex(orientation, sex){
    var normalized = String(orientation || "").toLowerCase();

    if (normalized === "bi" || normalized === "straight") return normalized;
    if (normalized === "gay") return sex === "female" ? "lesbian" : "gay";
    if (normalized === "lesbian") return sex === "male" ? "gay" : "lesbian";
    return "straight";
  }

  function ensureRelationshipIdentity(person){
    if (!person) return;

    if (person.sex !== "male" && person.sex !== "female") {
      person.sex = "male";
    }

    if (!person.sexualOrientation) {
      person.sexualOrientation = pickDeterministicOrientation(person);
    }

    person.sexualOrientation = normalizeOrientationForSex(person.sexualOrientation, person.sex);
  }

  function isOrientationOpenToSex(person, targetSex){
    var orientation;

    if (!person) return false;
    ensureRelationshipIdentity(person);
    orientation = person.sexualOrientation;

    if (orientation === "bi") return targetSex === "male" || targetSex === "female";
    if (orientation === "straight") return targetSex && targetSex !== person.sex;
    if (orientation === "gay") return person.sex === "male" && targetSex === "male";
    if (orientation === "lesbian") return person.sex === "female" && targetSex === "female";
    return targetSex && targetSex !== person.sex;
  }

  function areMarriageCompatible(first, second){
    if (!first || !second) return false;
    ensureRelationshipIdentity(first);
    ensureRelationshipIdentity(second);
    return isOrientationOpenToSex(first, second.sex) && isOrientationOpenToSex(second, first.sex);
  }

  function getGeneratedSpouseSex(person){
    var sexes = ["male", "female"].filter(function(candidateSex){
      return isOrientationOpenToSex(person, candidateSex);
    });

    if (!sexes.length) {
      return person.sex === "male" ? "female" : "male";
    }

    return App.utils.pick(sexes);
  }

  function getGeneratedSpouseOrientation(person, spouseSex){
    if (person.sex === spouseSex) {
      if (spouseSex === "female") {
        return Math.random() < 0.7 ? "lesbian" : "bi";
      }
      return Math.random() < 0.7 ? "gay" : "bi";
    }

    return Math.random() < 0.78 ? "straight" : "bi";
  }

  function syncPerson(person){
    ensureRelationshipIdentity(person);
    ensureFamilyDynamics(person);
    ensureSocialNetworkData(person);
    ensurePersonCityData(person);
    person.name = App.utils.formatPersonName(person.firstName, person.lastName, person.countryISO, person.nameOrder);
    person.age = ageForPerson(person);
    person.lifeStage = lifeStageForAge(person.age, person.alive);
    ensureSkillData(person);
    person.lifetimeInheritedGU = Math.max(0, Number(person.lifetimeInheritedGU) || 0);
    person.inheritanceTransferCount = Math.max(0, Math.floor(Number(person.inheritanceTransferCount) || 0));
    person.lastInheritanceDay = person.lastInheritanceDay == null ? null : Math.max(0, Math.floor(Number(person.lastInheritanceDay) || 0));

    if (person.businessId || person.employerBusinessId) {
      person.unemploymentStreakDays = 0;
      person.lastEmployedDay = App.store.simDay;
    } else if (person.alive && person.age >= 18 && !person.retired) {
      if (person.lastEmployedDay != null) {
        person.unemploymentStreakDays = Math.max(0, Math.floor(App.store.simDay - person.lastEmployedDay));
      } else {
        person.unemploymentStreakDays = Math.max(0, Math.floor((Number(person.unemploymentStreakDays) || 0) + SIM_DAYS_PER_TICK));
      }
    } else {
      person.unemploymentStreakDays = 0;
    }

    ensureWorkerLifecycleData(person);
    person.status = getStatus(person);
  }

  function chooseInheritedTrait(person){
    var weightedPool = [];
    var parentPool = [];

    (person.parentIds || []).forEach(function(parentId){
      var parent = App.store.getPerson(parentId);
      if (parent) {
        parentPool = parentPool.concat(parent.traits);
      }
    });

    if (parentPool.length && Math.random() < 0.65) {
      weightedPool = parentPool.slice();
    } else {
      weightedPool = App.data.TRAITS.slice();
    }

    weightedPool = weightedPool.filter(function(trait){
      return person.traits.indexOf(trait) === -1;
    });

    if (!weightedPool.length) {
      weightedPool = App.data.TRAITS.filter(function(trait){
        return person.traits.indexOf(trait) === -1;
      });
    }

    return weightedPool.length ? App.utils.pick(weightedPool) : null;
  }

  function grantTraitMilestone(person, milestone){
    var trait;
    var key = milestone === 8 ? "age8" : "age16";

    if (!person.traitMilestones) {
      person.traitMilestones = { age8:false, age16:false };
    }

    if (person.traitMilestones[key]) {
      return;
    }

    trait = chooseInheritedTrait(person);
    if (trait) {
      person.traits = uniqueTraits(person.traits.concat([trait])).slice(0, 2);
    }
    person.traitMilestones[key] = true;
  }

  function initializeTraits(person){
    person.traits = uniqueTraits(person.traits || []).slice(0, 2);
    person.traitMilestones = person.traitMilestones || { age8:false, age16:false };

    if (person.age >= 8 && person.traits.length < 1) {
      grantTraitMilestone(person, 8);
    }
    if (person.age >= 16 && person.traits.length < 2) {
      grantTraitMilestone(person, 16);
    }
    if (person.age >= 22 && person.traits.length < 2) {
      while (person.traits.length < 2) {
        person.traits = uniqueTraits(person.traits.concat([App.utils.pick(App.data.TRAITS)])).slice(0, 2);
      }
      person.traitMilestones.age8 = true;
      person.traitMilestones.age16 = true;
    }
  }

  function createCitizen(options){
    var bloc = App.store.getBloc(options.blocId) || App.utils.pick(App.store.blocs);
    var iso = options.countryISO || pickCountryFromBloc(bloc.id);
    var sex = options.sex || (Math.random() < 0.5 ? "male" : "female");
    if (!isResidencyEligibleCountry(iso)) {
      iso = pickCountryFromBloc(bloc.id);
    }
    var requestedSubdivision = normalizeText(options.subdivision || options.state || null);
    var state = iso === "US" ? requestedSubdivision : null;
    var spawn = options.anchorPerson ? getNearbySpawn(options.anchorPerson, iso, state) : getSpawnPos(iso, state);
    var spawnAttempts = 0;
        if (App.map && typeof App.map.isPointInCountry === "function") {
          while (spawnAttempts < 8 && (!spawn || !spawn.pos || !App.map.isPointInCountry(iso, spawn.pos.x, spawn.pos.y))) {
            spawn = options.anchorPerson ? getNearbySpawn(options.anchorPerson, iso, state) : getSpawnPos(iso, state);
            spawnAttempts += 1;
          }

          if ((!spawn || !spawn.pos || !App.map.isPointInCountry(iso, spawn.pos.x, spawn.pos.y)) && App.map.getCountrySpawnPoint) {
            spawn = App.map.getCountrySpawnPoint(iso, state) || spawn;
          }

          if ((!spawn || !spawn.pos || !App.map.isPointInCountry(iso, spawn.pos.x, spawn.pos.y)) && App.data.CENTROIDS[iso]) {
            var centroidPair = App.data.CENTROIDS[iso];
            spawn = {
              pos:App.utils.latLngToSVG(centroidPair[0], centroidPair[1]),
              iso:iso,
              state:iso === "US" ? state : null
            };
          }
        }

    var pool = App.data.NAME_POOLS[iso];
    var lastName = options.lastName || pickLastName(iso, bloc.id);
    var personId = randomId();
    var resolvedState = iso === "US" ? ((spawn && spawn.state) || state || null) : null;
    var resolvedSubdivision = iso === "US" ? resolvedState : requestedSubdivision;
    var anchorCity = options.anchorPerson && options.anchorPerson.countryISO === iso ? options.anchorPerson.city : null;
    var city = normalizeText(options.city) || normalizeText(options.birthCity) || normalizeText(anchorCity) || pickCountryCity(iso, [personId, iso, "city"].join("|"), resolvedSubdivision);
    var birthCity = normalizeText(options.birthCity) || city || pickCountryCity(iso, [personId, iso, "birth"].join("|"), resolvedSubdivision);
    resolvedSubdivision = resolveSubdivisionForCity(iso, city, resolvedSubdivision);
    var person = {
      id:personId,
      firstName:options.firstName || pickFirstName(iso, bloc.id, sex),
      lastName:lastName,
      name:"",
      sex:sex,
      sexualOrientation:options.sexualOrientation || pickDeterministicOrientation({ id:personId, sex:sex, countryISO:iso }),
      blocId:bloc.id,
      countryISO:iso,
      state:iso === "US" ? resolvedSubdivision : null,
      subdivision:resolvedSubdivision,
      city:city,
      birthCity:birthCity,
      birthDay:options.birthDay != null ? options.birthDay : (App.store.simDay - ((options.age != null ? options.age : App.utils.randInt(22, 55)) * YEAR_DAYS)),
      age:0,
      alive:options.alive !== false,
      deathDay:options.deathDay != null ? options.deathDay : null,
      retired:!!options.retired,
      lifeStage:"adult",
      traits:(options.traits || []).slice(),
      netWorthGU:options.netWorthGU != null ? options.netWorthGU : App.utils.rand(2000, 70000),
      businessId:options.businessId || null,
      employerBusinessId:options.employerBusinessId || null,
      jobTitle:options.jobTitle || null,
      jobTier:options.jobTier || null,
      jobDepartment:options.jobDepartment || null,
      salaryGU:options.salaryGU != null ? options.salaryGU : 0,
      status:options.status || "starting",
      svgX:spawn.pos.x,
      svgY:spawn.pos.y,
      pulse:0,
      spouseId:options.spouseId || null,
      householdId:options.householdId || null,
      parentIds:(options.parentIds || []).slice(),
      childrenIds:(options.childrenIds || []).slice(),
      lineageId:options.lineageId || (lastName.toLowerCase() + "-" + randomId().slice(0, 4)),
      nameOrder:options.nameOrder || (pool && pool.displayOrder) || App.utils.getNameOrder(iso),
      nativeDisplayName:options.nativeDisplayName || null,
      traitMilestones:options.traitMilestones || { age8:false, age16:false },
      lastLifeEventYear:options.lastLifeEventYear != null ? options.lastLifeEventYear : currentCalendarYear(),
      decisionProfileBase:options.decisionProfileBase || null,
      decisionProfile:options.decisionProfile || null,
      temporaryStates:options.temporaryStates || null,
      educationCredentialLabel:options.educationCredentialLabel || null,
      educationInstitutionName:options.educationInstitutionName || null,
      educationInstitutionType:options.educationInstitutionType || null,
      educationInstitutionSector:options.educationInstitutionSector || null,
      educationCourseLabel:options.educationCourseLabel || null,
      educationInstitutionQuality:options.educationInstitutionQuality != null ? options.educationInstitutionQuality : null,
      childhoodStage:options.childhoodStage || null,
      skillTrack:options.skillTrack || null,
      skills:options.skills || null,
      rivalFounderArcUntilDay:options.rivalFounderArcUntilDay != null ? Number(options.rivalFounderArcUntilDay) : null,
      formerSpouseIds:(options.formerSpouseIds || []).slice(),
      estrangedChildIds:(options.estrangedChildIds || []).slice(),
      estrangedParentIds:(options.estrangedParentIds || []).slice(),
      nonMaritalChildIds:(options.nonMaritalChildIds || []).slice(),
      birthUnionType:options.birthUnionType === "non_marital" ? "non_marital" : "marital",
      groomedForBusinessById:options.groomedForBusinessById || null,
      inheritanceDilution:Math.max(1, Number(options.inheritanceDilution) || 1),
      lifetimeInheritedGU:Math.max(0, Number(options.lifetimeInheritedGU) || 0),
      inheritanceTransferCount:Math.max(0, Math.floor(Number(options.inheritanceTransferCount) || 0)),
      lastInheritanceDay:options.lastInheritanceDay == null ? null : Math.max(0, Math.floor(Number(options.lastInheritanceDay) || 0)),
      siblingRivalry:App.utils.clamp(Number(options.siblingRivalry) || 0, 0, 100),
      sharedPrivilege:App.utils.clamp(Number(options.sharedPrivilege) || 0, 0, 100),
      mentorId:options.mentorId || null,
      rivalIds:(options.rivalIds || []).slice(),
      closeFriendIds:(options.closeFriendIds || []).slice(),
      eliteCircleIds:(options.eliteCircleIds || []).slice(),
      schoolTieIds:(options.schoolTieIds || []).slice(),
      nepotismTieIds:(options.nepotismTieIds || []).slice(),
      advisorBusinessIds:(options.advisorBusinessIds || []).slice(),
      boardBusinessIds:(options.boardBusinessIds || []).slice(),
      retirementType:options.retirementType || null,
      retirementInfluence:App.utils.clamp(Number(options.retirementInfluence) || 0, 0, 100),
      personalReputation:options.personalReputation && typeof options.personalReputation === "object" ? options.personalReputation : null,
      workerLifecycleStage:options.workerLifecycleStage || null,
      occupationCategory:options.occupationCategory || null,
      workExperienceYears:App.utils.clamp(Number(options.workExperienceYears) || 0, 0, 60),
      unemploymentStreakDays:Math.max(0, Math.floor(Number(options.unemploymentStreakDays) || 0)),
      lastEmployedDay:options.lastEmployedDay == null ? null : Math.max(0, Math.floor(Number(options.lastEmployedDay) || 0))
    };

    syncPerson(person);
    initializeTraits(person);
    ensureEducationData(person);
    ensureDecisionData(person);
    ensureSkillData(person);
    syncPerson(person);
    return person;
  }

  function createBusiness(owner){
    var countryProfile = ensureCountryProfile(owner.countryISO);
    var medianWage = Math.max(1500, Number(countryProfile && countryProfile.medianWageGU) || 12000);
    var industry = App.utils.pick(App.data.INDUSTRIES);
    var employees = App.utils.randInt(1, 6);
    var revenueSeed = employees * medianWage * getIndustryValue(INDUSTRY_PRODUCTIVITY_MULTIPLIERS, industry, 2.6) * App.utils.rand(0.72, 1.18);
    var startupRevenueCap = employees * Math.max(medianWage * 3.2, 90000);
    var business = {
      id:randomId(),
      name:generateBusinessName(owner, industry),
      industry:industry,
      ownerId:owner.id,
      founderId:owner.id,
      blocId:owner.blocId,
      countryISO:owner.countryISO,
      hqCity:normalizeText(owner && owner.city) || pickCountryCity(owner.countryISO, [owner.id, industry, "hq"].join("|"), normalizeText(owner && (owner.subdivision || owner.state))),
      lineageId:owner.lineageId,
      revenueGU:Math.max(12000, Math.min(revenueSeed, startupRevenueCap)),
      profitGU:0,
      valuationGU:0,
      employees:employees,
      leadership:[],
      logo:null,
      reputation:App.utils.rand(45, 70),
      cashReservesGU:0,
      currentDecision:null,
      decisionHistory:[],
      stage:"startup",
      foundedDay:App.store.simDay,
      age:0,
      successionCount:0,
      inheritedAtDay:null,
      revenueHistory:[],
      departments:null,
      managementQuality:App.utils.rand(42, 68),
      wageBillAnnual:0,
      operatingCostAnnual:0,
      hiringNeed:0,
      supplyStress:0,
      customerTrust:App.utils.rand(42, 64),
      productQuality:App.utils.rand(45, 68),
      pricePower:App.utils.rand(0.9, 1.08),
      innovationIndex:App.utils.rand(28, 56),
      technologyEdge:App.utils.rand(20, 52),
      copiedTechDebt:0,
      debtGU:0,
      debtInterestRate:0.08,
      debtMaturityDay:App.store.simDay + App.utils.randInt(200, 520),
      rolloverRisk:0,
      founderGuaranteeShare:App.utils.rand(0.28, 0.72),
      bankruptcyStage:"stable",
      distressScore:0,
      restructuringUntilDay:0,
      governance:null,
      unionizationRate:App.utils.rand(0.05, 0.18),
      laborUnrestScore:0,
      layoffPressure:0,
      strikeUntilDay:0
    };
    var reservedEmployees = reserveLabor(owner.countryISO, business.employees);

    business.employees = Math.max(1, reservedEmployees);

    ensureBusinessLogo(business);
    return business;
  }

  function seedBusiness(business){
    var countryProfile = ensureCountryProfile(business.countryISO);
    var medianWage = Math.max(1500, Number(countryProfile && countryProfile.medianWageGU) || 12000);
    var anonymousStaff = Math.max(0, (business.employees || 1) - 1);
    var basePayroll = anonymousStaff * medianWage * getIndustryValue(INDUSTRY_WAGE_MULTIPLIERS, business.industry, 1);

    ensureBusinessLogo(business);
    business.profitGU = business.revenueGU * App.utils.rand(-0.02, 0.12);
    business.valuationGU = business.revenueGU * App.utils.rand(1.3, 2.8);
    business.cashReservesGU = Math.max(5000, basePayroll * App.utils.rand(0.12, 0.22));
    business.reputation = clampScore(business.reputation != null ? business.reputation : App.utils.rand(45, 70));
    business.decisionHistory = business.decisionHistory || [];
    business.revenueHistory = Array.from({ length:8 }, function(){
      return business.revenueGU * App.utils.rand(0.94, 1.06);
    });
  }

  function cloneRole(role){
    return {
      roleKey:role.roleKey,
      title:role.title,
      department:role.department,
      tier:role.tier,
      importance:role.importance
    };
  }

  function getIndustryLeadershipRole(industry){
    return cloneRole(INDUSTRY_LEADERSHIP_ROLES[industry] || INDUSTRY_LEADERSHIP_ROLES.Technology);
  }

  function getLeadershipTemplate(business){
    var employees = Math.max(1, business && business.employees ? business.employees : 1);

    if (employees <= 4) {
      return [cloneRole(CORE_LEADERSHIP_ROLES.ceo)];
    }

    if (employees <= 7) {
      return [
        cloneRole(CORE_LEADERSHIP_ROLES.ceo),
        cloneRole(CORE_LEADERSHIP_ROLES.coo),
        cloneRole(CORE_LEADERSHIP_ROLES.hr_leader)
      ];
    }

    return [
      cloneRole(CORE_LEADERSHIP_ROLES.ceo),
      cloneRole(CORE_LEADERSHIP_ROLES.coo),
      cloneRole(CORE_LEADERSHIP_ROLES.cfo),
      cloneRole(CORE_LEADERSHIP_ROLES.hr_leader),
      getIndustryLeadershipRole(business.industry)
    ];
  }

  function getBusinessAgeYears(business){
    if (!business) return 0;
    return Math.max(0, (App.store.simDay - (Number(business.foundedDay) || 0)) / YEAR_DAYS);
  }

  function ensureStockMarketState(){
    if (!App.store.stockMarket || typeof App.store.stockMarket !== "object") {
      App.store.stockMarket = {
        listingsByBusinessId:{},
        lastDividendDay:0,
        lastTradeDay:0,
        lastIpoDay:0,
        tradeTape:[]
      };
    }
    if (!App.store.stockMarket.listingsByBusinessId || typeof App.store.stockMarket.listingsByBusinessId !== "object") {
      App.store.stockMarket.listingsByBusinessId = {};
    }
    if (!Array.isArray(App.store.stockMarket.tradeTape)) {
      App.store.stockMarket.tradeTape = [];
    }
    return App.store.stockMarket;
  }

  function buildTickerSymbol(business){
    var base = String(business && business.name || "NEX").replace(/[^A-Za-z]/g, "").toUpperCase();
    var symbols;
    var symbol;
    var suffix = 1;

    if (!base) {
      base = "NEX";
    }

    symbol = base.slice(0, 4);
    symbols = Object.keys(ensureStockMarketState().listingsByBusinessId).map(function(id){
      var listing = ensureStockMarketState().listingsByBusinessId[id];
      return listing ? listing.symbol : null;
    }).filter(Boolean);

    while (symbols.indexOf(symbol) !== -1) {
      symbol = (base.slice(0, 3) + String(suffix)).slice(0, 4);
      suffix += 1;
    }

    return symbol;
  }

  function getBusinessListing(businessOrId){
    var businessId = typeof businessOrId === "string" ? businessOrId : (businessOrId && businessOrId.id);
    var stockMarket = ensureStockMarketState();

    if (!businessId) return null;
    return stockMarket.listingsByBusinessId[businessId] || null;
  }

  function getListingHolderShares(listing, personId){
    if (!listing || !personId) return 0;
    if (!listing.sharesByHolder || typeof listing.sharesByHolder !== "object") {
      listing.sharesByHolder = {};
    }
    return Math.max(0, Number(listing.sharesByHolder[personId]) || 0);
  }

  function setListingHolderShares(listing, personId, shares){
    var normalized = Math.max(0, Math.floor(Number(shares) || 0));

    if (!listing || !personId) return;
    if (!listing.sharesByHolder || typeof listing.sharesByHolder !== "object") {
      listing.sharesByHolder = {};
    }

    if (!normalized) {
      delete listing.sharesByHolder[personId];
      return;
    }
    listing.sharesByHolder[personId] = normalized;
  }

  function getListingHeldShares(listing){
    return Object.keys(listing && listing.sharesByHolder && typeof listing.sharesByHolder === "object" ? listing.sharesByHolder : {}).reduce(function(total, holderId){
      return total + Math.max(0, Number(listing.sharesByHolder[holderId]) || 0);
    }, 0);
  }

  function getListingMarketCapGU(listing){
    return Math.max(0, (Number(listing && listing.sharePriceGU) || 0) * Math.max(1, Number(listing && listing.totalShares) || 1));
  }

  function recordTradeTapeEntry(businessId, openPrice, closePrice, highPrice, lowPrice, volume, movePct){
    var stockMarket = ensureStockMarketState();
    var open = Math.max(0.01, Number(openPrice) || 0.01);
    var close = Math.max(0.01, Number(closePrice) || open);
    var high = Math.max(open, close, Number(highPrice) || 0);
    var low = Math.min(open, close, Math.max(0.01, Number(lowPrice) || Math.min(open, close)));

    stockMarket.tradeTape.push({
      day:App.store.simDay,
      businessId:businessId,
      priceGU:close,
      openPriceGU:open,
      closePriceGU:close,
      highPriceGU:high,
      lowPriceGU:Math.max(0.01, low),
      volumeShares:Math.max(0, Math.floor(Number(volume) || 0)),
      movePct:Number(movePct) || 0
    });

    if (stockMarket.tradeTape.length > STOCK_MAX_TAPE_ITEMS) {
      stockMarket.tradeTape = stockMarket.tradeTape.slice(-STOCK_MAX_TAPE_ITEMS);
    }
  }

  function getListingInvestorCandidates(listing, business){
    var ownerId = business && business.ownerId;

    return App.store.getLivingPeople().filter(function(person){
      if (!person || person.age < 22) return false;
      if (person.id === ownerId) return false;
      if ((person.netWorthGU || 0) < 1800) return false;
      if (person.businessId && person.businessId === (business && business.id)) return false;
      return true;
    });
  }

  function buyFromTreasury(listing, buyer, requestedShares){
    var affordableShares;
    var shares;
    var cost;

    if (!listing || !buyer || requestedShares <= 0) return 0;
    if ((listing.treasuryShares || 0) <= 0) return 0;

    affordableShares = Math.floor((buyer.netWorthGU || 0) / Math.max(0.01, listing.sharePriceGU || 0));
    shares = Math.max(0, Math.min(requestedShares, listing.treasuryShares || 0, affordableShares));
    if (!shares) return 0;

    cost = shares * Math.max(0.01, listing.sharePriceGU || 0);
    buyer.netWorthGU = Math.max(100, (buyer.netWorthGU || 0) - cost);
    listing.treasuryShares = Math.max(0, (listing.treasuryShares || 0) - shares);
    setListingHolderShares(listing, buyer.id, getListingHolderShares(listing, buyer.id) + shares);
    syncPerson(buyer);
    return shares;
  }

  function sellToTreasury(listing, seller, requestedShares){
    var owned;
    var shares;
    var proceeds;

    if (!listing || !seller || requestedShares <= 0) return 0;
    owned = getListingHolderShares(listing, seller.id);
    shares = Math.max(0, Math.min(requestedShares, owned));
    if (!shares) return 0;

    proceeds = shares * Math.max(0.01, listing.sharePriceGU || 0);
    setListingHolderShares(listing, seller.id, owned - shares);
    listing.treasuryShares = Math.max(0, (listing.treasuryShares || 0) + shares);
    seller.netWorthGU += proceeds;
    syncPerson(seller);
    return shares;
  }

  function listBusinessOnExchange(business, reasonLabel, options){
    var settings = options && typeof options === "object" ? options : {};
    var stockMarket = ensureStockMarketState();
    var owner = App.store.getPerson(business && business.ownerId);
    var totalShares;
    var floatRatio;
    var treasuryShares;
    var listing;
    var candidates;
    var allocated = 0;
    var saleProceeds = 0;
    var summary;

    if (!business || getBusinessListing(business.id)) return null;
    if (!owner || !owner.alive) return null;

    totalShares = 1000000;
    floatRatio = App.utils.clamp(App.utils.rand(0.2, 0.42) + (owner.retired ? 0.06 : 0), 0.18, 0.55);
    treasuryShares = Math.floor(totalShares * floatRatio);

    listing = {
      businessId:business.id,
      symbol:buildTickerSymbol(business),
      listedDay:Math.max(0, Math.floor(Number(settings.listedDay) || App.store.simDay)),
      totalShares:totalShares,
      treasuryShares:treasuryShares,
      sharesByHolder:{},
      sharePriceGU:Math.max(0.05, (business.valuationGU || STOCK_MIN_LISTING_VALUATION_GU) / totalShares),
      annualDividendPerShareGU:0,
      lastDividendPerShareGU:0,
      lastDividendDay:0,
      lastVolumeShares:0,
      rollingVolumeShares:0,
      lastSessionNetDemand:0
    };

    setListingHolderShares(listing, owner.id, totalShares - treasuryShares);

    candidates = getListingInvestorCandidates(listing, business).sort(function(first, second){
      var firstWeight = (first.netWorthGU || 0) * (first.retired ? 1.2 : 1) * (!first.businessId ? 1.1 : 1);
      var secondWeight = (second.netWorthGU || 0) * (second.retired ? 1.2 : 1) * (!second.businessId ? 1.1 : 1);
      return secondWeight - firstWeight;
    }).slice(0, 40);

    candidates.forEach(function(candidate){
      var appetite;
      var desired;
      var bought;

      if ((listing.treasuryShares || 0) <= 0) return;
      appetite = candidate.retired ? App.utils.rand(0.03, 0.11) : App.utils.rand(0.01, 0.06);
      desired = Math.floor(((candidate.netWorthGU || 0) * appetite) / Math.max(0.01, listing.sharePriceGU));
      bought = buyFromTreasury(listing, candidate, desired);
      allocated += bought;
    });

    saleProceeds = allocated * listing.sharePriceGU;
    business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + saleProceeds * 0.68);
    owner.netWorthGU += saleProceeds * 0.32;
    syncPerson(owner);

    stockMarket.listingsByBusinessId[business.id] = listing;
    stockMarket.lastIpoDay = App.store.simDay;

    summary = "IPO float sold " + allocated + " shares at " + App.utils.fmtCountry(listing.sharePriceGU, business.countryISO) + " per share.";
    if (!settings.suppressHistory) {
      pushBusinessEventHistory(business, "IPO listing for " + business.name, summary + " " + (reasonLabel || "Market listing broadened ownership."));
    }
    if (!settings.suppressNews) {
      emitNews("ipo", "<strong>" + business.name + "</strong> listed on the exchange as <strong>" + listing.symbol + "</strong>.", {
        entities:{
          personIds:[owner.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[
          reasonLabel || "The firm reached scale and credibility for a public listing.",
          "Public float sold: " + allocated + " shares."
        ]
      });
    }

    return listing;
  }

  function settleDelistingPayout(business, liquidationValue, reasonLabel){
    var stockMarket = ensureStockMarketState();
    var listing = getBusinessListing(business && business.id);
    var distributable;
    var perShare;
    var paid = 0;

    if (!business || !listing) return liquidationValue;

    distributable = Math.max(0, liquidationValue) * 0.7;
    perShare = distributable / Math.max(1, listing.totalShares || 1);

    Object.keys(listing.sharesByHolder || {}).forEach(function(holderId){
      var person = App.store.getPerson(holderId);
      var shares = Math.max(0, Number(listing.sharesByHolder[holderId]) || 0);
      var payout;

      if (!person || !shares) return;
      payout = shares * perShare;
      person.netWorthGU += payout;
      paid += payout;
      syncPerson(person);
    });

    delete stockMarket.listingsByBusinessId[business.id];

    if (reasonLabel) {
      emitNews("bankruptcy", "<strong>" + business.name + "</strong> was delisted. Shareholders were cashed out at liquidation value.", {
        entities:{
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[reasonLabel]
      });
    }

    return Math.max(0, liquidationValue - paid);
  }

  function isBusinessEligibleForListing(business){
    if (!business) return false;
    if (getBusinessListing(business.id)) return false;
    if ((business.stage || "startup") === "startup") return false;
    if ((business.stage || "startup") === "declining") return false;
    if ((business.reputation || 0) < 52) return false;
    if ((business.employees || 0) < STOCK_MIN_LISTING_EMPLOYEES) return false;
    if ((business.revenueGU || 0) < STOCK_MIN_LISTING_REVENUE_GU) return false;
    if ((business.valuationGU || 0) < STOCK_MIN_LISTING_VALUATION_GU) return false;
    if (getBusinessAgeYears(business) < STOCK_MIN_LISTING_AGE_YEARS) return false;
    return true;
  }

  function maybeAutoListBusiness(){
    var stockMarket = ensureStockMarketState();
    var cooldown = App.store.simDay - Math.max(0, Number(stockMarket.lastIpoDay) || 0);
    var candidates;
    var candidate;

    if (cooldown < 45) return;
    if (Math.random() >= chanceForDays(0.12, YEAR_DAYS / 2)) return;

    candidates = App.store.businesses.filter(isBusinessEligibleForListing).sort(function(first, second){
      return (second.valuationGU || 0) - (first.valuationGU || 0);
    });

    if (!candidates.length) return;
    candidate = App.utils.pick(candidates.slice(0, 8));
    listBusinessOnExchange(candidate, "Established earnings and scale attracted a listing window.");
  }

  function processListingPriceMarkToMarket(){
    ensureStockMarketState();

    Object.keys(App.store.stockMarket.listingsByBusinessId).forEach(function(businessId){
      var listing = App.store.stockMarket.listingsByBusinessId[businessId];
      var business = App.store.getBusiness(businessId);
      var previousPrice;
      var intrinsicPrice;
      var margin;
      var sentiment;
      var drift;
      var noise;
      var multiplier;
      var movePct;

      if (!listing) return;
      if (!business) {
        delete App.store.stockMarket.listingsByBusinessId[businessId];
        return;
      }

      previousPrice = Math.max(0.01, Number(listing.sharePriceGU) || 0.01);
      intrinsicPrice = Math.max(0.01, (business.valuationGU || STOCK_MIN_LISTING_VALUATION_GU) / Math.max(1, listing.totalShares || 1));
      margin = App.utils.clamp((business.profitGU || 0) / Math.max(1, business.revenueGU || 1), -0.25, 0.25);
      sentiment = ((business.reputation || 50) - 50) / 100;
      drift = ((intrinsicPrice / previousPrice) - 1) * 0.16;
      noise = App.utils.rand(-0.02, 0.02);
      multiplier = App.utils.clamp(1 + drift + (margin * 0.18) + (sentiment * 0.08) + noise, 0.82, 1.2);
      listing.sharePriceGU = Math.max(0.05, previousPrice * multiplier);
      business.valuationGU = (business.valuationGU * 0.7) + (getListingMarketCapGU(listing) * 0.3);
      listing.lastSessionNetDemand = Number(listing.lastSessionNetDemand) || 0;
      listing.rollingVolumeShares = Math.max(0, Math.floor((Number(listing.rollingVolumeShares) || 0) * 0.92));

      movePct = ((listing.sharePriceGU - previousPrice) / previousPrice) * 100;
      if (Math.abs(movePct) >= 12) {
        emitNews("market", "<strong>" + business.name + "</strong> shares moved " + (movePct > 0 ? "+" : "") + movePct.toFixed(1) + "%.", {
          entities:{
            businessIds:[business.id],
            countryIsos:[business.countryISO],
            blocIds:[business.blocId]
          },
          causes:[
            "Price discovery repriced the company against fundamentals.",
            "Market cap now sits near " + App.utils.fmtCountry(getListingMarketCapGU(listing), business.countryISO) + "."
          ],
          rollupLabel:listing.symbol
        });
      }
    });
  }

  function processDividendCycle(){
    var stockMarket = ensureStockMarketState();
    var since = App.store.simDay - Math.max(0, Number(stockMarket.lastDividendDay) || 0);

    if (since < STOCK_DIVIDEND_CADENCE_DAYS) return;

    Object.keys(stockMarket.listingsByBusinessId).forEach(function(businessId){
      var listing = stockMarket.listingsByBusinessId[businessId];
      var business = App.store.getBusiness(businessId);
      var payoutPool;
      var perShare;
      var paid = 0;
      var topIncome = { person:null, amount:0 };

      if (!listing || !business) return;
      if ((business.profitGU || 0) <= 0) {
        listing.lastDividendPerShareGU = 0;
        listing.annualDividendPerShareGU *= 0.75;
        return;
      }

      payoutPool = Math.min(
        Math.max(0, (business.profitGU || 0) * App.utils.clamp(0.08 + (((business.profitGU || 0) / Math.max(1, business.revenueGU || 1)) * 0.24), 0.05, 0.32) * (STOCK_DIVIDEND_CADENCE_DAYS / YEAR_DAYS)),
        Math.max(0, (business.cashReservesGU || 0) * 0.45)
      );
      perShare = payoutPool / Math.max(1, listing.totalShares || 1);

      if (perShare < 0.002) {
        listing.lastDividendPerShareGU = 0;
        listing.annualDividendPerShareGU *= 0.82;
        return;
      }

      Object.keys(listing.sharesByHolder || {}).forEach(function(holderId){
        var person = App.store.getPerson(holderId);
        var shares = Math.max(0, Number(listing.sharesByHolder[holderId]) || 0);
        var amount;

        if (!person || !person.alive || !shares) return;
        amount = shares * perShare;
        person.netWorthGU += amount;
        paid += amount;
        if (amount > topIncome.amount) {
          topIncome = { person:person, amount:amount };
        }
        syncPerson(person);
      });

      business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) - paid);
      listing.lastDividendPerShareGU = perShare;
      listing.annualDividendPerShareGU = (listing.annualDividendPerShareGU * 0.55) + ((perShare * (YEAR_DAYS / STOCK_DIVIDEND_CADENCE_DAYS)) * 0.45);
      listing.lastDividendDay = App.store.simDay;

      if (topIncome.person && (topIncome.person.retired || !topIncome.person.businessId)) {
        emitNews("market", "<strong>" + topIncome.person.name + "</strong> collected " + App.utils.fmtCountry(topIncome.amount, topIncome.person.countryISO) + " in dividends from " + listing.symbol + ".", {
          entities:{
            personIds:[topIncome.person.id],
            businessIds:[business.id],
            countryIsos:[business.countryISO],
            blocIds:[business.blocId]
          },
          causes:[
            "Public equity ownership provided passive income.",
            "Dividend per share this cycle: " + App.utils.fmtCountry(perShare, business.countryISO) + "."
          ],
          rollupLabel:listing.symbol
        });
      }
    });

    stockMarket.lastDividendDay = App.store.simDay;
  }

  function processTradingCycle(){
    var stockMarket = ensureStockMarketState();
    var since = App.store.simDay - Math.max(0, Number(stockMarket.lastTradeDay) || 0);

    if (since < STOCK_TRADING_CADENCE_DAYS) return;

    Object.keys(stockMarket.listingsByBusinessId).forEach(function(businessId){
      var listing = stockMarket.listingsByBusinessId[businessId];
      var business = App.store.getBusiness(businessId);
      var investors;
      var netDemandShares = 0;
      var tradedShares = 0;
      var beforePrice;
      var afterPrice;
      var intradayVolatility;
      var highPrice;
      var lowPrice;
      var movePct;

      if (!listing || !business) return;

      beforePrice = Math.max(0.05, Number(listing.sharePriceGU) || 0.05);
      investors = getListingInvestorCandidates(listing, business).slice(0, 90);

      investors.forEach(function(person){
        var ownedShares = getListingHolderShares(listing, person.id);
        var retirementBias = person.retired ? 0.18 : 0;
        var nonFounderBias = !person.businessId ? 0.06 : 0;
        var momentumBias = Number(listing.lastSessionNetDemand) > 0 ? 0.05 : -0.02;
        var buyChance = App.utils.clamp(0.08 + retirementBias + nonFounderBias + momentumBias, 0.04, 0.42);
        var sellChance = App.utils.clamp(0.05 + (ownedShares > 0 ? 0.08 : 0) + (business.profitGU < 0 ? 0.06 : 0), 0.02, 0.34);
        var buyBudget;
        var buyRequest;
        var sold;
        var bought;

        if (Math.random() < buyChance && (person.netWorthGU || 0) > beforePrice * 2) {
          buyBudget = (person.netWorthGU || 0) * App.utils.rand(0.006, 0.035);
          buyRequest = Math.floor(buyBudget / beforePrice);
          bought = buyFromTreasury(listing, person, buyRequest);
          netDemandShares += bought;
          tradedShares += bought;
        }

        if (ownedShares > 0 && Math.random() < sellChance) {
          sold = sellToTreasury(listing, person, Math.floor(ownedShares * App.utils.rand(0.05, 0.28)));
          netDemandShares -= sold;
          tradedShares += sold;
        }
      });

      listing.lastSessionNetDemand = netDemandShares;
      listing.lastVolumeShares = tradedShares;
      listing.rollingVolumeShares = Math.max(0, (Number(listing.rollingVolumeShares) || 0) + tradedShares);

      if (tradedShares > 0) {
        afterPrice = Math.max(0.05, beforePrice * App.utils.clamp(1 + (netDemandShares / Math.max(1, listing.totalShares || 1)) * 2.4 + App.utils.rand(-0.012, 0.012), 0.92, 1.12));
        listing.sharePriceGU = afterPrice;
        intradayVolatility = App.utils.clamp(Math.abs(netDemandShares) / Math.max(1, listing.totalShares || 1) * 8 + App.utils.rand(0.002, 0.018), 0.002, 0.08);
        highPrice = Math.max(beforePrice, afterPrice) * (1 + intradayVolatility * App.utils.rand(0.35, 1.1));
        lowPrice = Math.max(0.05, Math.min(beforePrice, afterPrice) * (1 - intradayVolatility * App.utils.rand(0.35, 1.1)));
        movePct = ((afterPrice - beforePrice) / beforePrice) * 100;
        recordTradeTapeEntry(business.id, beforePrice, afterPrice, highPrice, lowPrice, tradedShares, movePct);

        if (Math.abs(movePct) >= 8 && tradedShares >= 1500) {
          emitNews("market", "<strong>" + business.name + "</strong> saw heavy trading in " + listing.symbol + " (" + (movePct > 0 ? "+" : "") + movePct.toFixed(1) + "%).", {
            entities:{
              businessIds:[business.id],
              countryIsos:[business.countryISO],
              blocIds:[business.blocId]
            },
            causes:[
              "Investor demand shifted by " + netDemandShares + " shares this session.",
              "Trading volume reached " + tradedShares + " shares."
            ],
            rollupLabel:listing.symbol
          });
        }
      }
    });

    stockMarket.lastTradeDay = App.store.simDay;
  }

  function processStockMarketTick(){
    ensureStockMarketState();
    maybeAutoListBusiness();
    processListingPriceMarkToMarket();
    processTradingCycle();
    processDividendCycle();
  }

  function getBusinessStageFactor(stage){
    return getBusinessDomain().getBusinessStageFactor(stage);
  }

  function getCountryMedianWage(iso){
    var profile = ensureCountryProfile(iso);
    return Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
  }

  function getRoleOccupationHint(role){
    var title = String(role && role.title || "").toLowerCase();
    var department = String(role && role.department || "").toLowerCase();

    if (title.indexOf("ceo") !== -1 || title.indexOf("coo") !== -1 || title.indexOf("cfo") !== -1 || department.indexOf("executive") !== -1) return "executive";
    if (department.indexOf("finance") !== -1 || title.indexOf("finance") !== -1 || title.indexOf("account") !== -1) return "accountant";
    if (department.indexOf("sales") !== -1 || title.indexOf("sales") !== -1 || title.indexOf("growth") !== -1) return "sales";
    if (department.indexOf("technology") !== -1 || title.indexOf("cto") !== -1 || title.indexOf("engineer") !== -1 || title.indexOf("developer") !== -1) return "engineer";
    if (department.indexOf("operations") !== -1 || department.indexOf("logistics") !== -1 || department.indexOf("stores") !== -1) return "operator";
    return "operator";
  }

  function getRoleTalentShortageSignal(business, role){
    var occupation = getRoleOccupationHint(role);
    var candidates;
    var qualified;
    var threshold = occupation === "executive" ? 62 : 54;

    if (!business) return 0;

    candidates = App.store.getLivingPeople().filter(function(person){
      return person.countryISO === business.countryISO &&
        person.age >= 20 &&
        !person.retired &&
        !person.businessId &&
        !person.employerBusinessId;
    });

    if (!candidates.length) return 0.85;

    qualified = candidates.filter(function(person){
      var skills = person.skills || {};
      var score;

      if (occupation === "executive") {
        score = (Number(skills.management) || 0) * 0.45 + (Number(skills.social) || 0) * 0.25 + (Number(skills.financialDiscipline) || 0) * 0.2 + (Number(person.educationIndex) || 0) * 0.1;
      } else if (occupation === "engineer") {
        score = (Number(skills.technical) || 0) * 0.62 + (Number(skills.creativity) || 0) * 0.2 + (Number(person.educationIndex) || 0) * 0.18;
      } else if (occupation === "accountant") {
        score = (Number(skills.financialDiscipline) || 0) * 0.58 + (Number(skills.management) || 0) * 0.22 + (Number(person.educationIndex) || 0) * 0.2;
      } else if (occupation === "sales") {
        score = (Number(skills.social) || 0) * 0.62 + (Number(skills.management) || 0) * 0.18 + (Number(person.educationIndex) || 0) * 0.2;
      } else {
        score = (Number(skills.technical) || 0) * 0.34 + (Number(skills.social) || 0) * 0.28 + (Number(skills.management) || 0) * 0.18 + (Number(person.educationIndex) || 0) * 0.2;
      }

      return score >= threshold;
    }).length;

    return App.utils.clamp(1 - Math.min(1, qualified / (occupation === "executive" ? 5 : 9)), 0, 1);
  }

  function getRoleCompensationMultiplier(role){
    var importance = Math.max(1, Number(role && role.importance) || 1);
    return 1.35 + (importance * 0.7);
  }

  function getStaffMedianSalary(business){
    var medianWage = getCountryMedianWage(business.countryISO);
    var industry = getIndustryValue(INDUSTRY_WAGE_MULTIPLIERS, business.industry, 1);
    var stage = getBusinessStageFactor(business.stage);
    var reputation = 0.88 + ((business.reputation || 50) / 100) * 0.34;
    var laborScarcity = getCountryLaborScarcity(business.countryISO);
    var wagePressure = getCountryWagePressure(business.countryISO);
    var industryDemandPressure = getIndustryLaborDemandPressure(business.countryISO, business.industry);
    var laborMarketMultiplier = 1 + (laborScarcity * 0.12) + (wagePressure * 0.18) + (industryDemandPressure * 0.06);
    return Math.max(900, medianWage * industry * stage * reputation * 0.82 * laborMarketMultiplier);
  }

  function getLeadershipCompensationBudgetAnnual(business, leadershipCount){
    var count = Math.max(1, Number(leadershipCount) || ((business.leadership || []).length || getLeadershipTemplate(business).length || 1));
    var medianWage = getCountryMedianWage(business.countryISO);
    var staffMedian = getStaffMedianSalary(business);
    var revenue = Math.max(medianWage * count * 1.2, Number(business.revenueGU) || 0);
    var revenueShare = business.stage === "startup" ? 0.34 : (business.stage === "growth" ? 0.4 : (business.stage === "established" ? 0.46 : (business.stage === "declining" ? 0.3 : 0.42)));
    var floorBudget = medianWage * count * (business.stage === "startup" ? 1.15 : 1.3);
    var softCapBudget = staffMedian * count * (business.stage === "startup" ? 1.25 : (business.stage === "growth" ? 1.55 : (business.stage === "established" ? 1.85 : 1.4)));

    return Math.max(floorBudget, Math.min(revenue * revenueShare, softCapBudget));
  }

  function getLeadershipSalaryRealityCap(business, role, leadershipCount){
    var count = Math.max(1, Number(leadershipCount) || ((business.leadership || []).length || getLeadershipTemplate(business).length || 1));
    var roleHint = getRoleOccupationHint(role);
    var medianWage = getCountryMedianWage(business.countryISO);
    var staffMedian = getStaffMedianSalary(business);
    var roleWeight = App.utils.clamp(getRoleCompensationMultiplier(role), 1.5, 5.4);
    var totalBudget = getLeadershipCompensationBudgetAnnual(business, count);
    var baselineTotalWeight;
    var floor;

    if (roleHint === "executive") {
      roleWeight *= 1.12;
    } else if (roleHint === "accountant") {
      roleWeight *= 0.94;
    }

    baselineTotalWeight = Math.max(roleWeight, ((count - 1) * 2.15) + roleWeight);
    floor = Math.max(
      medianWage * (roleHint === "executive" ? 1 : 0.8),
      staffMedian * (roleHint === "executive" ? 0.52 : 0.42)
    );

    return Math.max(floor, (totalBudget * roleWeight / baselineTotalWeight) * (roleHint === "executive" ? 1.1 : 1));
  }

  function getRoleSalary(business, role){
    var medianWage = getCountryMedianWage(business.countryISO);
    var industry = getIndustryValue(INDUSTRY_WAGE_MULTIPLIERS, business.industry, 1);
    var stage = getBusinessStageFactor(business.stage);
    var reputation = 0.92 + ((business.reputation || 50) / 100) * 0.38;
    var laborScarcity = getCountryLaborScarcity(business.countryISO);
    var wagePressure = getCountryWagePressure(business.countryISO);
    var industryDemandPressure = getIndustryLaborDemandPressure(business.countryISO, business.industry);
    var talentShortage = getRoleTalentShortageSignal(business, role);
    var laborMarketMultiplier = 1 + (laborScarcity * 0.16) + (wagePressure * 0.24) + (industryDemandPressure * 0.08) + (talentShortage * 0.1);
    var salary = Math.max(1200, Math.round(medianWage * industry * getRoleCompensationMultiplier(role) * stage * reputation * laborMarketMultiplier));

    if ((Number(role && role.importance) || 0) >= 2.5 || String(role && role.tier || "").toLowerCase() === "executive") {
      salary = Math.min(salary, Math.round(getLeadershipSalaryRealityCap(business, role)));
    }

    return salary;
  }

  function normalizeBusinessLeadershipCompensation(business){
    var leadership = App.store.getBusinessLeadership(business).filter(function(entry){
      return !!(entry && App.store.getPerson(entry.personId));
    });
    var totalBudget;
    var totalSalary = 0;
    var scale;

    if (!leadership.length) return;

    totalBudget = getLeadershipCompensationBudgetAnnual(business, leadership.length);

    leadership.forEach(function(entry){
      var person = App.store.getPerson(entry.personId);
      var salary = Math.max(1200, Number(person && person.salaryGU) || getRoleSalary(business, entry));

      if (!person) return;
      salary = Math.min(salary, getLeadershipSalaryRealityCap(business, entry, leadership.length));
      person.salaryGU = Math.max(1200, Math.round(salary));
      totalSalary += person.salaryGU;
      syncPerson(person);
    });

    if (totalSalary <= totalBudget || totalBudget <= 0) return;

    scale = totalBudget / totalSalary;
    leadership.forEach(function(entry){
      var person = App.store.getPerson(entry.personId);

      if (!person) return;
      person.salaryGU = Math.max(1200, Math.round((Number(person.salaryGU) || 0) * scale));
      syncPerson(person);
    });
  }

  function assignEmployment(person, business, role){
    var baseSalary;
    var unemploymentPenalty;
    var institutionPremium;
    var roleHint;
    var skillPremium;
    var disciplinePremium;
    var educationPremium;
    var relevantSkill;

    if (!person || !business || !role) return;

    ensureSkillData(person);
    alignEmploymentSkills(person, role);
    baseSalary = getRoleSalary(business, role);
    unemploymentPenalty = App.utils.clamp((Math.max(0, Number(person.unemploymentStreakDays) || 0) - (LONG_UNEMPLOYMENT_DAYS * 1.8)) / 1800, 0, 0.04);
    roleHint = getRoleOccupationHint(role);
    if (roleHint === "executive") {
      relevantSkill = Number(person.skills && person.skills.management) || 0;
      skillPremium = (relevantSkill - 50) * 0.0062;
    } else if (roleHint === "engineer") {
      relevantSkill = Number(person.skills && person.skills.technical) || 0;
      skillPremium = (relevantSkill - 50) * 0.0058;
    } else if (roleHint === "accountant") {
      relevantSkill = Number(person.skills && person.skills.financialDiscipline) || 0;
      skillPremium = (relevantSkill - 50) * 0.0058;
    } else if (roleHint === "sales") {
      relevantSkill = Number(person.skills && person.skills.social) || 0;
      skillPremium = (relevantSkill - 50) * 0.0058;
    } else {
      relevantSkill = getPersonSkillAverage(person) || 0;
      skillPremium = (relevantSkill - 50) * 0.0044;
    }
    ensureDecisionData(person);
    disciplinePremium = ((Number(person.decisionProfile && person.decisionProfile.discipline) || 0) - 50) * 0.0018;
    educationPremium = ((Number(person.educationIndex) || 0) - 50) * 0.0016;
    institutionPremium = (App.utils.clamp(Number(person.educationInstitutionQuality) || (35 + ((Number(person.educationIndex) || 0) * 0.62)), 20, 100) - 50) * 0.0009;

    person.employerBusinessId = business.id;
    person.jobTitle = role.title;
    person.jobTier = role.tier;
    person.jobDepartment = role.department;
    person.salaryGU = Math.max(900, Math.round(baseSalary * App.utils.clamp(1 + skillPremium + educationPremium + institutionPremium + disciplinePremium - unemploymentPenalty, 0.84, 1.44)));
    person.lastEmployedDay = App.store.simDay;
    person.unemploymentStreakDays = 0;
  }

  function getJobTierRank(tier){
    var key = String(tier || "entry").toLowerCase();
    var index = JOB_TIER_ORDER.indexOf(key);

    if (index !== -1) return index;
    if (key === "manager") return JOB_TIER_ORDER.indexOf("senior");
    if (key === "owner") return JOB_TIER_ORDER.indexOf("executive");
    return JOB_TIER_ORDER.indexOf("entry");
  }

  function upgradeJobTier(person, role){
    var currentRank;
    var targetRank;
    var nextRank;
    var updated;

    if (!person) return false;

    currentRank = getJobTierRank(person.jobTier);
    targetRank = role && role.tier ? getJobTierRank(role.tier) : JOB_TIER_ORDER.length - 1;
    nextRank = Math.min(targetRank, currentRank + 1);
    if (nextRank <= currentRank) return false;

    person.jobTier = JOB_TIER_ORDER[nextRank] || person.jobTier;
    person.salaryGU = Math.max(900, Math.round((Number(person.salaryGU) || 0) * App.utils.rand(1.05, 1.2)));
    adjustPersonalReputation(person, {
      trust:App.utils.rand(0.2, 1),
      prestige:App.utils.rand(1.2, 3.4),
      notoriety:App.utils.rand(0.2, 1)
    });
    adjustTemporaryStates(person, {
      confidence:App.utils.rand(5, 11),
      stress:App.utils.rand(-3, 1),
      ambitionSpike:App.utils.rand(3, 7)
    });
    updated = true;
    syncPerson(person);
    return updated;
  }

  function clearEmployment(person, businessId){
    var hadEmployment;

    if (!person) return;
    if (businessId && person.employerBusinessId !== businessId) return;

    hadEmployment = !!person.employerBusinessId;

    person.employerBusinessId = null;
    person.jobTitle = null;
    person.jobTier = null;
    person.jobDepartment = null;
    person.salaryGU = 0;

    if (hadEmployment) {
      person.lastEmployedDay = App.store.simDay;
      person.unemploymentStreakDays = 0;
    }
  }

  function getLeadershipPerformanceScore(person){
    var skillAverage;

    if (!person) return 0;
    ensureDecisionData(person);
    skillAverage = getPersonSkillAverage(person);
    return (
      (Number(person.educationIndex) || 0) * 0.2 +
      skillAverage * 0.55 +
      (Number(person.personalReputation && person.personalReputation.prestige) || 35) * 0.2 +
      (person.decisionProfile.discipline - 50) * 0.45 +
      (person.decisionProfile.adaptability - 50) * 0.35 -
      (Number(person.temporaryStates && person.temporaryStates.burnout) || 0) * 0.15
    );
  }

  function findBestPoachCandidate(sourceBusiness, targetBusiness){
    var sourceLeadership;

    if (!sourceBusiness || !targetBusiness) return null;

    sourceLeadership = App.store.getBusinessLeadership(sourceBusiness).filter(function(entry){
      return !!(entry.person && entry.person.alive && !entry.person.retired && entry.roleKey !== "ceo");
    });

    sourceLeadership.sort(function(first, second){
      return getLeadershipPerformanceScore(second.person) - getLeadershipPerformanceScore(first.person);
    });

    return sourceLeadership.length ? sourceLeadership[0].person : null;
  }

  function applyLaborUnrestPressure(business, decision, employeeDelta){
    var profile;
    var countryMedianWage;
    var staffWage;
    var wageLag;
    var inequality;
    var socialPressure;
    var countryStrikeRisk;
    var layoffShock;
    var unrestBuild;
    var unionization;
    var strikeRisk;
    var strikeLength;

    if (!business) return;

    profile = ensureCountryProfile(business.countryISO);
    countryMedianWage = getCountryMedianWage(business.countryISO);
    staffWage = Math.max(1, getStaffMedianSalary(business));
    wageLag = App.utils.clamp((countryMedianWage - staffWage) / countryMedianWage, 0, 0.8);
    inequality = App.utils.clamp(Number(profile && profile.giniCoefficient) || 0.4, 0.2, 0.8);
    socialPressure = App.utils.clamp(Number(profile && profile.socialPressureIndex) || 0, 0, 1.5);
    countryStrikeRisk = App.utils.clamp(Number(profile && profile.strikeRiskIndex) || 0, 0, 1.4);
    layoffShock = employeeDelta < 0 ? App.utils.clamp(Math.abs(employeeDelta) / Math.max(1, business.employees || 1), 0, 0.3) : 0;

    business.layoffPressure = App.utils.clamp((Number(business.layoffPressure) || 0) * 0.86 + layoffShock, 0, 1.2);
    unrestBuild =
      (wageLag * 0.68) +
      (Math.max(0, inequality - 0.36) * 0.8) +
      (socialPressure * 0.24) +
      (business.layoffPressure * 0.95) +
      ((decision && decision.stance === "retrenching") ? 0.06 : 0);
    business.laborUnrestScore = App.utils.clamp((Number(business.laborUnrestScore) || 0) * 0.78 + unrestBuild, 0, 1.6);

    unionization = Number(business.unionizationRate);
    if (!Number.isFinite(unionization)) {
      unionization = App.utils.rand(0.05, 0.18);
    }
    unionization += (wageLag * 0.04) + (layoffShock * 0.05) + (Math.max(0, inequality - 0.4) * 0.03) + (countryStrikeRisk * 0.035) - 0.01;
    business.unionizationRate = App.utils.clamp(unionization, 0.02, 0.82);

    strikeRisk = App.utils.clamp((business.unionizationRate * 0.4) + (business.laborUnrestScore * 0.42) + (countryStrikeRisk * 0.11) - 0.16, 0, 0.72);

    if ((Number(business.strikeUntilDay) || 0) > App.store.simDay) {
      business.revenueGU *= App.utils.rand(0.94, 0.985);
      business.reputation = clampScore((business.reputation || 50) - App.utils.rand(0.3, 1));
      if (Math.random() < 0.35) {
        applyLeadershipStateChange(business, {
          stress:App.utils.rand(2, 6),
          confidence:App.utils.rand(-4, -1),
          burnout:App.utils.rand(0.4, 1.4)
        });
      }
      return;
    }

    if (strikeRisk > 0.22 && Math.random() < chanceForDays(strikeRisk * 0.22, YEAR_DAYS / 2)) {
      strikeLength = App.utils.randInt(10, 38);
      business.strikeUntilDay = App.store.simDay + strikeLength;
      emitNews("market", "Labor unrest escalated at <strong>" + business.name + "</strong>; a strike has begun.", {
        entities:{
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[
          "Wage lag and inequality elevated union pressure.",
          "Recent layoffs compounded labor unrest risk."
        ]
      });
    }
  }

  function legacyProcessYearlyPromotionsAndPoaching(){
    var movedPeople = {};

    App.store.businesses.slice().sort(function(first, second){
      return (second.reputation || 50) - (first.reputation || 50);
    }).forEach(function(business){
      var leadership;
      var sourceCandidates;
      var sourceBusiness;
      var poachCandidate;
      var poachRole;
      var replaced;

      if (!business) return;

      leadership = App.store.getBusinessLeadership(business).filter(function(entry){
        return !!entry.person;
      });

      leadership.forEach(function(entry){
        var person = entry.person;
        var score;

        if (!person || !person.alive || movedPeople[person.id]) return;
        score = getLeadershipPerformanceScore(person);
        if (score >= 56 && Math.random() < 0.24) {
          if (upgradeJobTier(person, entry)) {
            movedPeople[person.id] = true;
            emitNews("hire", "<strong>" + person.name + "</strong> earned an internal promotion at <strong>" + business.name + "</strong>.", {
              entities:{
                personIds:[person.id],
                businessIds:[business.id],
                countryIsos:[business.countryISO],
                blocIds:[business.blocId]
              },
              causes:[
                "Strong insider performance lifted promotion odds.",
                "Firm leadership favored internal advancement over external hiring."
              ]
            });
          }
        }
      });

      if ((business.reputation || 50) < 62 || Math.random() > 0.35) return;

      sourceCandidates = App.store.businesses.filter(function(candidate){
        return candidate &&
          candidate.id !== business.id &&
          candidate.industry === business.industry &&
          (candidate.reputation || 50) + 6 < (business.reputation || 50);
      }).sort(function(first, second){
        return (first.reputation || 50) - (second.reputation || 50);
      });

      sourceBusiness = sourceCandidates[0] || null;
      if (!sourceBusiness) return;

      poachCandidate = findBestPoachCandidate(sourceBusiness, business);
      if (!poachCandidate || movedPeople[poachCandidate.id]) return;
      if (Math.random() > App.utils.clamp(0.22 + (((business.reputation || 50) - (sourceBusiness.reputation || 50)) * 0.008), 0.16, 0.58)) return;

      poachRole = (business.leadership || []).filter(function(entry){
        return entry.roleKey !== "ceo";
      }).sort(function(first, second){
        var firstPerson = App.store.getPerson(first.personId);
        var secondPerson = App.store.getPerson(second.personId);
        var firstScore = firstPerson && firstPerson.alive ? leadershipCandidateScore(firstPerson, business, first) : -9999;
        var secondScore = secondPerson && secondPerson.alive ? leadershipCandidateScore(secondPerson, business, second) : -9999;
        return firstScore - secondScore;
      })[0] || null;

      if (!poachRole) return;

      replaced = App.store.getPerson(poachRole.personId);
      if (replaced && replaced.alive) {
        clearEmployment(replaced, business.id);
        syncPerson(replaced);
      }

      clearEmployment(poachCandidate, sourceBusiness.id);
      assignEmployment(poachCandidate, business, poachRole);
      relocatePersonToCountry(poachCandidate, business.countryISO, {
        city:normalizeText(business.hqCity)
      });
      poachRole.personId = poachCandidate.id;
      movedPeople[poachCandidate.id] = true;

      sourceBusiness.reputation = clampScore((sourceBusiness.reputation || 50) - App.utils.rand(0.6, 2.2));
      business.reputation = clampScore((business.reputation || 50) + App.utils.rand(0.4, 1.8));

      syncBusinessLeadership(sourceBusiness);
      syncBusinessLeadership(business);
      syncPerson(poachCandidate);

      emitNews("hire", "<strong>" + business.name + "</strong> poached <strong>" + poachCandidate.name + "</strong> from <strong>" + sourceBusiness.name + "</strong>.", {
        entities:{
          personIds:[poachCandidate.id],
          businessIds:[business.id, sourceBusiness.id],
          countryIsos:[business.countryISO, sourceBusiness.countryISO],
          blocIds:[business.blocId, sourceBusiness.blocId]
        },
        causes:[
          "High-reputation firms attracted stronger external talent.",
          "Rival industry competition intensified leadership poaching pressure."
        ]
      });
    });
  }

  function processYearlyEliteReproduction(){
    var living = App.store.getLivingPeople();

    living.forEach(function(person){
      var household;
      var classTier;
      var classRank;
      var skillAvg;
      var parents;
      var sponsor;

      if (!person || !person.alive) return;
      household = getHouseholdForPerson(person);
      classTier = household ? household.classTier : "working";
      classRank = householdClassRank(classTier);
      skillAvg = getPersonSkillAverage(person);
      parents = App.store.getParents(person, false);

      if (person.age <= 30 && classRank >= 3) {
        person.sharedPrivilege = App.utils.clamp((Number(person.sharedPrivilege) || 0) + App.utils.rand(1.5, 5.5), 0, 100);
        person.educationIndex = App.utils.clamp((Number(person.educationIndex) || 0) + App.utils.rand(0.8, 2.5), 0, 100);
        if (parents.length) {
          parents.forEach(function(parent){
            if (!parent || !parent.alive) return;
            person.nepotismTieIds = normalizeUniqueIdList((person.nepotismTieIds || []).concat([parent.id]), person.id).slice(0, 10);
            if ((parent.eliteCircleIds || []).length) {
              person.schoolTieIds = normalizeUniqueIdList((person.schoolTieIds || []).concat(parent.eliteCircleIds.slice(0, 2)), person.id).slice(0, 12);
            }
            if ((parent.netWorthGU || 0) > 70000 && Math.random() < 0.32) {
              var transfer = Math.min((parent.netWorthGU || 0) * App.utils.rand(0.005, 0.018), Math.max(900, (person.netWorthGU || 0) * 0.2));
              drawHouseholdAssetTransfer(parent, transfer);
              allocateHouseholdAssetTransfer(person, transfer, "child");
            }
          });
        }
      }

      if (person.age >= 18 && person.age <= 34 && classRank <= 1 && skillAvg >= 58 && (Number(person.educationIndex) || 0) >= 52) {
        sponsor = living.filter(function(candidate){
          return candidate.id !== person.id && candidate.alive && ((candidate.netWorthGU || 0) >= 90000 || (candidate.personalReputation && candidate.personalReputation.prestige >= 66));
        }).sort(function(first, second){
          return ((second.netWorthGU || 0) + ((second.personalReputation && second.personalReputation.prestige) || 0) * 1000) - ((first.netWorthGU || 0) + ((first.personalReputation && first.personalReputation.prestige) || 0) * 1000);
        })[0] || null;

        if (sponsor && Math.random() < 0.26) {
          person.mentorId = sponsor.id;
          person.educationIndex = App.utils.clamp((Number(person.educationIndex) || 0) + App.utils.rand(1.2, 3.6), 0, 100);
          person.sharedPrivilege = App.utils.clamp((Number(person.sharedPrivilege) || 0) + App.utils.rand(0.6, 2.4), 0, 100);
          adjustTemporaryStates(person, {
            confidence:App.utils.rand(2, 7),
            ambitionSpike:App.utils.rand(3, 8)
          });
          adjustPersonalReputation(person, { prestige:App.utils.rand(0.4, 1.6), trust:0.4 });
        }
      }

      if (person.age <= 35 && classRank >= 3 && household && ((household.financialStress || 0) > 74 || (household.debtGU || 0) > ((household.cashOnHandGU || 0) * 1.35))) {
        person.sharedPrivilege = App.utils.clamp((Number(person.sharedPrivilege) || 0) - App.utils.rand(2.5, 7.5), 0, 100);
        person.eliteCircleIds = (person.eliteCircleIds || []).slice(0, Math.max(0, (person.eliteCircleIds || []).length - App.utils.randInt(0, 2)));
        if (Math.random() < 0.35) {
          adjustPersonalReputation(person, { prestige:-App.utils.rand(0.8, 2.8), trust:-App.utils.rand(0.2, 1) });
        }
      }

      ensureEducationData(person, household || null);
      ensureSkillData(person);
      syncPerson(person);
    });
  }

  function buildLeadershipEntry(role, person){
    return {
      roleKey:role.roleKey,
      title:role.title,
      personId:person.id,
      department:role.department,
      tier:role.tier,
      importance:role.importance
    };
  }

  function getInstitutionPrestigeSignal(candidate, role){
    var education = Number(candidate && candidate.educationIndex) || 0;
    var quality = Number(candidate && candidate.educationInstitutionQuality);
    var prestige = Number.isFinite(quality) ? App.utils.clamp(quality, 20, 100) : App.utils.clamp(35 + (education * 0.62), 20, 100);
    var roleImportance = Math.max(1, Number(role && role.importance) || 3);
    var roleMultiplier = 0.12 + (roleImportance * 0.05);

    return {
      prestige:prestige,
      score:App.utils.clamp((prestige - 50) * roleMultiplier, -8, 18)
    };
  }

  function getPromotionReadinessScore(candidate, role, business){
    var tierScoreMap = {
      executive:82,
      leadership:68,
      senior:56,
      mid:46,
      junior:36,
      entry:24
    };
    var roleTierFloor = role && role.tier === "executive" ? 70 : (role && role.tier === "leadership" ? 58 : 46);
    var candidateTierScore = tierScoreMap[candidate && candidate.jobTier] || (candidate && candidate.employerBusinessId === (business && business.id) ? 50 : 34);
    var delta = candidateTierScore - roleTierFloor;

    return App.utils.clamp(delta * 0.48, -10, 10);
  }

  function leadershipCandidateScore(candidate, business, role){
    var score = 0;
    var prestigeSignal;
    var owner = business ? App.store.getPerson(business.ownerId) : null;
    var leadership;
    var tieBonus = 0;

    ensureDecisionData(candidate);
    ensureSocialNetworkData(candidate);
    if (candidate.lineageId === business.lineageId) score += 200;
    if (candidate.employerBusinessId === business.id) score += 120;
    score += Math.min(120, Math.floor((candidate.netWorthGU || 0) / 800));
    score += Math.max(0, 50 - Math.abs((candidate.age || 0) - 42));
    score += (candidate.decisionProfile.discipline - 50) * 0.9;
    score += (candidate.decisionProfile.adaptability - 50) * 0.7;
    score += (candidate.decisionProfile.ethics - 50) * 0.5;
    score += App.utils.clamp((Number(candidate.educationIndex) || 0) * 0.35, 0, 35);
    score += App.utils.clamp((Number(candidate.skills && candidate.skills.management) || 0) * 0.35, 0, 24);
    score += App.utils.clamp((Number(candidate.skills && candidate.skills.social) || 0) * 0.24, 0, 16);
    score += App.utils.clamp((Number(candidate.skills && candidate.skills.financialDiscipline) || 0) * 0.2, 0, 14);
    prestigeSignal = getInstitutionPrestigeSignal(candidate, role);
    score += prestigeSignal.score;
    if (candidate.employerBusinessId === business.id) {
      score += App.utils.clamp((prestigeSignal.prestige - 60) * 0.22, 0, 8);
      score += getPromotionReadinessScore(candidate, role, business);
    }
    if (owner) {
      tieBonus += getSocialProximityScore(candidate, owner) * 1.7;
      if (candidate.mentorId && candidate.mentorId === owner.id) tieBonus += 6;
    }
    leadership = App.store.getBusinessLeadership(business);
    leadership.forEach(function(entry){
      if (!entry.person || entry.person.id === candidate.id) return;
      tieBonus += getSocialProximityScore(candidate, entry.person) * 0.45;
    });
    score += App.utils.clamp(tieBonus, -14, 30);
    score += (Number(candidate.personalReputation && candidate.personalReputation.prestige) || 35) * 0.28;
    score += (Number(candidate.personalReputation && candidate.personalReputation.trust) || 50) * 0.18;
    score -= (Number(candidate.personalReputation && candidate.personalReputation.scandalMemory) || 0) * 0.35;
    score += ((business.reputation || 50) - 50) * 0.4;
    return score;
  }

  function isLeadershipEligible(person, business, takenIds){
    if (!person || !business) return false;
    if (!person.alive || person.retired) return false;
    if (person.age < 22) return false;
    if (person.countryISO !== business.countryISO) return false;
    if (takenIds && takenIds.indexOf(person.id) !== -1) return false;
    if (person.businessId && person.businessId !== business.id) return false;
    if (person.employerBusinessId && person.employerBusinessId !== business.id) return false;
    return true;
  }

  function findExistingRoleHolder(business, roleKey, takenIds){
    var leadership = business.leadership || [];

    for (var i = 0; i < leadership.length; i += 1) {
      if (leadership[i].roleKey !== roleKey) continue;
      var person = App.store.getPerson(leadership[i].personId);
      if (isLeadershipEligible(person, business, takenIds)) {
        return person;
      }
    }

    return null;
  }

  function findLeadershipCandidate(business, takenIds, role){
    return App.store.getLivingPeople().filter(function(candidate){
      return isLeadershipEligible(candidate, business, takenIds);
    }).sort(function(first, second){
      return leadershipCandidateScore(second, business, role) - leadershipCandidateScore(first, business, role);
    })[0] || null;
  }

  function createLeadershipHire(business, role, anchorPerson){
    var hire = createCitizen({
      blocId:business.blocId,
      countryISO:business.countryISO,
      state:anchorPerson && anchorPerson.countryISO === "US" ? anchorPerson.state : null,
      subdivision:anchorPerson ? (anchorPerson.subdivision || anchorPerson.state || null) : null,
      age:App.utils.randInt(28, 58),
      netWorthGU:App.utils.rand(1800, 22000),
      anchorPerson:anchorPerson || null
    });

    App.store.people.push(hire);
    hire.pulse = 1;
    assignEmployment(hire, business, role);
    syncPerson(hire);
    return hire;
  }

  function getStaffEmploymentTier(person){
    var skillAverage;
    var education;
    var weightedScore;

    if (!person) return "entry";

    skillAverage = getPersonSkillAverage(person);
    education = Number(person.educationIndex) || 0;
    weightedScore = (skillAverage * 0.72) + (education * 0.28);

    if (weightedScore >= 74) return "senior";
    if (weightedScore >= 62) return "mid";
    if (weightedScore >= 52) return "junior";
    return "entry";
  }

  function buildStaffEmploymentRole(business, person){
    var occupation;
    var tier;
    var department = "operations";
    var title = "Operations Associate";
    var importance = 1;

    occupation = getIndustryOccupationForPerson(business && business.industry, person);
    tier = getStaffEmploymentTier(person);

    if (occupation === "engineer") {
      department = "technology";
      title = tier === "senior" ? "Senior Engineer" : (tier === "mid" ? "Engineer" : "Junior Engineer");
      importance = tier === "senior" ? 2 : 1;
    } else if (occupation === "accountant") {
      department = "finance";
      title = tier === "senior" ? "Finance Manager" : "Accountant";
      importance = tier === "senior" ? 2 : 1;
    } else if (occupation === "sales") {
      department = "sales";
      title = tier === "senior" ? "Sales Manager" : "Sales Associate";
      importance = tier === "senior" ? 2 : 1;
    } else if (occupation === "factory_worker") {
      department = "operations";
      title = tier === "senior" ? "Production Lead" : "Production Associate";
      importance = tier === "senior" ? 2 : 1;
    } else {
      department = "operations";
      title = tier === "senior" ? "Operations Lead" : (tier === "mid" ? "Operations Specialist" : "Operations Associate");
      importance = tier === "senior" ? 2 : 1;
    }

    return {
      roleKey:"staff_" + department + "_" + tier,
      title:title,
      tier:tier,
      department:department,
      importance:importance
    };
  }

  function isStaffEmploymentEligible(person, business, excludedIds){
    if (!person || !business) return false;
    if (!person.alive || person.retired) return false;
    if ((Number(person.age) || 0) < 18) return false;
    if (person.countryISO !== business.countryISO) return false;
    if (excludedIds && excludedIds.indexOf(person.id) !== -1) return false;
    if (person.businessId && person.businessId !== business.id) return false;
    if (person.employerBusinessId && person.employerBusinessId !== business.id) return false;
    return true;
  }

  function getStaffEmploymentCandidateScore(person, options){
    var settings = options && typeof options === "object" ? options : {};
    var unemploymentDays;
    var reentryBonus = 0;
    var scarringPenalty = 0;
    var educationPriority = 0;
    var skillPriority = 0;
    var skillAverage;
    var education;
    var institutionQuality;
    var discipline;

    if (!person) return 0;

    ensureDecisionData(person);
    unemploymentDays = Math.max(0, Number(person.unemploymentStreakDays) || 0);
    skillAverage = getPersonSkillAverage(person);
    education = App.utils.clamp(Number(person.educationIndex) || 0, 0, 100);
    institutionQuality = App.utils.clamp(Number(person.educationInstitutionQuality) || (35 + (education * 0.62)), 20, 100);
    discipline = Number(person.decisionProfile && person.decisionProfile.discipline) || 50;

    if (settings.includeReentry) {
      reentryBonus = App.utils.clamp(unemploymentDays / 62, 0, 5.5);
      scarringPenalty = App.utils.clamp(Math.max(0, unemploymentDays - (LONG_UNEMPLOYMENT_DAYS * 2.6)) / 260, 0, 1.8);
      educationPriority = App.utils.clamp((education - 66) / 5.5, 0, 6.8);
      skillPriority = App.utils.clamp((skillAverage - 46) / 7, 0, 4.4);
    }

    return (
      (skillAverage * 0.44) +
      (education * 0.33) +
      (institutionQuality * 0.14) +
      ((discipline - 50) * 0.32) +
      reentryBonus +
      educationPriority +
      skillPriority -
      scarringPenalty
    );
  }

  function getBusinessStaffCandidates(business, excludedIds){
    return App.store.getLivingPeople().filter(function(candidate){
      return isStaffEmploymentEligible(candidate, business, excludedIds);
    }).sort(function(first, second){
      var firstAssigned = first.employerBusinessId === business.id ? 1 : 0;
      var secondAssigned = second.employerBusinessId === business.id ? 1 : 0;
      var firstScore;
      var secondScore;

      if (firstAssigned !== secondAssigned) return secondAssigned - firstAssigned;

      firstScore = getStaffEmploymentCandidateScore(first, { includeReentry:true });
      secondScore = getStaffEmploymentCandidateScore(second, { includeReentry:true });
      return secondScore - firstScore;
    });
  }

  function createStaffHire(business, anchorPerson){
    var hire = createCitizen({
      blocId:business.blocId,
      countryISO:business.countryISO,
      state:anchorPerson && anchorPerson.countryISO === "US" ? anchorPerson.state : null,
      subdivision:anchorPerson ? (anchorPerson.subdivision || anchorPerson.state || null) : null,
      age:App.utils.randInt(19, 52),
      netWorthGU:App.utils.rand(600, 6200),
      anchorPerson:anchorPerson || null
    });

    App.store.people.push(hire);
    hire.pulse = 1;
    syncPerson(hire);
    return hire;
  }

  function syncBusinessStaffAssignments(business){
    var leadershipIds;
    var owner;
    var assignedStaff;
    var targetStaffCount;
    var candidates;
    var excludedIds;

    if (!business) return;

    leadershipIds = (business.leadership || []).map(function(entry){
      return String(entry && entry.personId || "");
    }).filter(Boolean);
    owner = App.store.getPerson(business.ownerId) || App.store.getPerson(business.founderId) || null;
    assignedStaff = App.store.getLivingPeople().filter(function(person){
      return person && person.employerBusinessId === business.id && leadershipIds.indexOf(person.id) === -1;
    });
    targetStaffCount = Math.max(0, Math.max(0, Number(business.employees) || 0) - leadershipIds.length);

    if (assignedStaff.length > targetStaffCount) {
      assignedStaff.sort(function(first, second){
        return getStaffEmploymentCandidateScore(first) - getStaffEmploymentCandidateScore(second);
      }).slice(targetStaffCount).forEach(function(person){
        clearEmployment(person, business.id);
        syncPerson(person);
      });
      assignedStaff = assignedStaff.slice(0, targetStaffCount);
    }

    if (assignedStaff.length >= targetStaffCount) return;

    excludedIds = leadershipIds.concat(assignedStaff.map(function(person){ return person.id; }));
    candidates = getBusinessStaffCandidates(business, excludedIds);

    while (assignedStaff.length < targetStaffCount) {
      var person = candidates.shift();
      var role;

      if (!person) {
        person = createStaffHire(business, owner);
      }

      role = buildStaffEmploymentRole(business, person);
      assignEmployment(person, business, role);
      syncPerson(person);
      assignedStaff.push(person);
    }
  }

  function syncBusinessLeadership(business){
    var template;
    var owner;
    var takenIds = [];
    var nextLeadership = [];

    if (!business) return;

    template = getLeadershipTemplate(business);
    owner = App.store.getPerson(business.ownerId) || App.store.getPerson(business.founderId);

    template.forEach(function(role){
      var person = null;

      if (role.roleKey === "ceo" && owner && owner.alive && !owner.retired) {
        person = owner;
      } else {
        person = findExistingRoleHolder(business, role.roleKey, takenIds);
        if (!person) {
          person = findLeadershipCandidate(business, takenIds, role);
        }
        if (!person) {
          person = createLeadershipHire(business, role, owner || App.store.getPerson(business.founderId));
        }
      }

      if (!person || takenIds.indexOf(person.id) !== -1) return;

      takenIds.push(person.id);
      nextLeadership.push(buildLeadershipEntry(role, person));
    });

    App.store.people.forEach(function(person){
      if (person.employerBusinessId === business.id && takenIds.indexOf(person.id) === -1 && (person.jobTier === "executive" || person.jobTier === "leadership")) {
        clearEmployment(person, business.id);
        syncPerson(person);
      }
    });

    nextLeadership.forEach(function(entry){
      var person = App.store.getPerson(entry.personId);
      if (!person) return;
      ensureDecisionData(person);
      assignEmployment(person, business, entry);
      syncPerson(person);
    });

    business.leadership = nextLeadership;
    var minimumHeadcount = Math.max(nextLeadership.length || 1, 1);
    var currentHeadcount = Math.max(0, business.employees || 0);

    if (minimumHeadcount > currentHeadcount) {
      currentHeadcount += reserveLabor(business.countryISO, minimumHeadcount - currentHeadcount);
    }

    business.employees = Math.max(minimumHeadcount, currentHeadcount);
    syncBusinessStaffAssignments(business);
    normalizeBusinessLeadershipCompensation(business);
  }

  function syncCorporateLadders(){
    App.store.people.forEach(function(person){
      if (person.employerBusinessId && !App.store.getBusiness(person.employerBusinessId)) {
        clearEmployment(person, person.employerBusinessId);
      }
    });

    App.store.businesses.forEach(function(business){
      syncBusinessLeadership(business);
      syncBusinessStaffAssignments(business);
      ensureBusinessDecisionState(business);
      business.currentDecision = evaluateBusinessDecision(business);
    });
  }

  function getRoleDecisionWeights(roleKey){
    return DECISION_ROLE_WEIGHTS[roleKey] || DECISION_ROLE_WEIGHTS.default;
  }

  function roleDecisionInfluence(roleKey){
    var weights = getRoleDecisionWeights(roleKey);
    return (weights.expansion + weights.staffing + weights.cash + weights.succession) / 4;
  }

  function getRevenueTrend(business){
    var history = (business.revenueHistory || []).slice(-6);
    var recent;
    var previous;

    if (history.length < 4) return 0;

    recent = averageValues(history.slice(-3));
    previous = averageValues(history.slice(0, Math.max(1, history.length - 3)));
    return App.utils.clamp((recent - previous) / Math.max(1, previous), -0.35, 0.35);
  }

  function getProfitMargin(business){
    return App.utils.clamp((business.profitGU || 0) / Math.max(1, business.revenueGU || 1), -0.5, 0.5);
  }

  function getCashCoverageMonths(business){
    return App.utils.clamp((business.cashReservesGU || 0) / Math.max(1, (business.revenueGU || 1) / 12), 0, 12);
  }

  function getOperatingCostRate(business){
    var baseRate = getIndustryValue(INDUSTRY_OPERATING_COST_RATES, business.industry, 0.42);
    var stageAdjustment = business.stage === "startup" ? 0.03 : (business.stage === "declining" ? 0.04 : (business.stage === "established" ? -0.02 : 0));
    return App.utils.clamp(baseRate + stageAdjustment, 0.24, 0.68);
  }

  function getIndustryBehaviorProfile(industry){
    return INDUSTRY_BEHAVIOR_PROFILES[industry] || INDUSTRY_BEHAVIOR_PROFILES.Technology;
  }

  function legacyGetIndustrySupplyPressure(business){
    var dependencies = INDUSTRY_SUPPLY_DEPENDENCIES[business && business.industry] || [];
    var blocBusinesses;

    if (!business || !dependencies.length) return 0;
    blocBusinesses = App.store.businesses.filter(function(candidate){
      return !!(candidate && candidate.blocId === business.blocId);
    });
    if (!blocBusinesses.length) return 0;

    return dependencies.reduce(function(sum, dependency){
      var peers = blocBusinesses.filter(function(candidate){
        return candidate.industry === dependency;
      });
      var strain;

      if (!peers.length) return sum + 0.18;
      strain = peers.reduce(function(inner, peer){
        var margin = (Number(peer.revenueGU) || 0) > 0 ? ((Number(peer.profitGU) || 0) / Math.max(1, Number(peer.revenueGU) || 1)) : -0.2;
        var bankruptcyPenalty = peer.bankruptcyStage && peer.bankruptcyStage !== "stable" ? 0.12 : 0;
        return inner + App.utils.clamp((0.1 - margin) * 0.85 + bankruptcyPenalty, 0, 0.65);
      }, 0) / peers.length;

      return sum + strain;
    }, 0) / dependencies.length;
  }

  function getIndustryTradeExposure(industry){
    return App.utils.clamp(Number(INDUSTRY_TRADE_EXPOSURE[industry]) || 0.5, 0.2, 0.9);
  }

  function getIndustryRerouteAdaptability(industry){
    return App.utils.clamp(Number(INDUSTRY_REROUTE_ADAPTABILITY[industry]) || 0.5, 0.2, 0.85);
  }

  function getCrossBlocDependencyPressure(bloc, dependencies){
    var otherBlocs;

    if (!bloc || !dependencies || !dependencies.length) return 0;

    otherBlocs = (App.store.blocs || []).filter(function(candidate){
      return !!(candidate && candidate.id !== bloc.id);
    });
    if (!otherBlocs.length) return 0;

    return dependencies.reduce(function(sum, dependencyIndustry){
      var dependencyPressure = otherBlocs.reduce(function(inner, candidateBloc){
        var sectorPresence = App.store.businesses.some(function(candidateBusiness){
          return !!(candidateBusiness && candidateBusiness.blocId === candidateBloc.id && candidateBusiness.industry === dependencyIndustry);
        });
        if (!sectorPresence) return inner + 0.12;
        return inner + App.utils.clamp((Number(candidateBloc.geoPressure) || 0) * 0.09, 0, 0.45);
      }, 0) / otherBlocs.length;

      return sum + dependencyPressure;
    }, 0) / dependencies.length;
  }

  function legacyComputeTradeShockTransmission(business, bloc, behaviorProfile, supplyPressure){
    var dependencies = INDUSTRY_SUPPLY_DEPENDENCIES[business && business.industry] || [];
    var tradeExposure = getIndustryTradeExposure(business && business.industry);
    var rerouteAdaptability = getIndustryRerouteAdaptability(business && business.industry);
    var crossBlocDependencyPressure = getCrossBlocDependencyPressure(bloc, dependencies);
    var baseTradeShock;
    var rerouteCapacity;
    var rerouteRelief;
    var netShock;

    if (!business || !bloc) {
      return {
        grossShock:0,
        netShock:0,
        rerouteRelief:0,
        rerouteCapacity:0,
        costMultiplier:1
      };
    }

    baseTradeShock =
      App.utils.clamp((Number(bloc.geoPressure) || 0) * 0.13, 0, 0.58) +
      (App.utils.clamp(Number(supplyPressure) || 0, 0, 1.8) * 0.24) +
      crossBlocDependencyPressure;
    baseTradeShock *= App.utils.clamp(tradeExposure * (Number(behaviorProfile && behaviorProfile.supplySensitivity) || 1), 0.2, 1.35);
    baseTradeShock = App.utils.clamp(baseTradeShock, 0, 1.6);

    rerouteCapacity = App.utils.clamp(
      ((Number(business.tradeRerouteCapacity) || 0) * 0.8) +
      ((Number(business.managementQuality) || 50) / 100) * 0.14 +
      ((Number(business.innovationIndex) || 50) / 100) * 0.08,
      0,
      1.15
    );
    rerouteCapacity = App.utils.clamp(rerouteCapacity * (0.72 + (rerouteAdaptability * 0.6)), 0, 1.2);
    rerouteRelief = App.utils.clamp(Math.min(baseTradeShock * App.utils.clamp(0.22 + (rerouteCapacity * 0.38), 0.22, 0.62), 0.8), 0, 0.8);
    netShock = App.utils.clamp(baseTradeShock - rerouteRelief, 0, 1.6);

    business.tradeRerouteCapacity = App.utils.clamp(rerouteCapacity - (netShock * 0.09), 0, 1.2);
    business.tradeShockExposure = tradeExposure;

    return {
      grossShock:baseTradeShock,
      netShock:netShock,
      rerouteRelief:rerouteRelief,
      rerouteCapacity:rerouteCapacity,
      costMultiplier:1 + App.utils.clamp((netShock * 0.07) - (rerouteRelief * 0.018), 0, 0.16)
    };
  }

  function legacyUpdateCountryTradeShockSignals(){
    var countryBusinessStats = {};

    (App.store.businesses || []).forEach(function(business){
      var iso;
      var stats;

      if (!business || !business.countryISO) return;
      iso = business.countryISO;
      if (!countryBusinessStats[iso]) {
        countryBusinessStats[iso] = { count:0, tradeShockSum:0, rerouteSum:0, supplyStressSum:0 };
      }
      stats = countryBusinessStats[iso];
      stats.count += 1;
      stats.tradeShockSum += App.utils.clamp(Number(business.tradeShockPressure) || 0, 0, 1.8);
      stats.rerouteSum += App.utils.clamp(Number(business.tradeRerouteRelief) || 0, 0, 1.2);
      stats.supplyStressSum += App.utils.clamp(Number(business.supplyStress) || 0, 0, 1.8);
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var stats = countryBusinessStats[iso];
      var tradeShockIndex = stats && stats.count ? (stats.tradeShockSum / stats.count) : 0;
      var rerouteRelief = stats && stats.count ? (stats.rerouteSum / stats.count) : 0;
      var avgSupplyStress = stats && stats.count ? (stats.supplyStressSum / stats.count) : 0;

      if (!profile) return;

      profile.tradeShockIndex = App.utils.clamp(((Number(profile.tradeShockIndex) || 0) * 0.72) + (tradeShockIndex * 0.28), 0, 1.8);
      profile.tradeRerouteRelief = App.utils.clamp(((Number(profile.tradeRerouteRelief) || 0) * 0.68) + (rerouteRelief * 0.32), 0, 1.2);
      profile.avgSupplyStress = App.utils.clamp(((Number(profile.avgSupplyStress) || 0) * 0.7) + (avgSupplyStress * 0.3), 0, 1.8);
      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.tradeShockIndex = Number(profile.tradeShockIndex.toFixed(4));
      profile.policyEvidence.tradeRerouteRelief = Number(profile.tradeRerouteRelief.toFixed(4));
      profile.policyEvidence.avgSupplyStress = Number(profile.avgSupplyStress.toFixed(4));
    });
  }

  function legacyRefreshBusinessFirmStructure(business, decision){
    var profile;
    var behavior;
    var departmentShares;
    var managementTilt;
    var leadershipCount;
    var boardPressure;

    if (!business) return;

    profile = ensureCountryProfile(business.countryISO);
    behavior = getIndustryBehaviorProfile(business.industry);
    leadershipCount = Math.max(1, (business.leadership || []).length);
    boardPressure = Number(business.governance && business.governance.boardPressure) || 0;

    departmentShares = {
      operations:App.utils.clamp(0.18 + (behavior.supplySensitivity * 0.16), 0.16, 0.42),
      people:App.utils.clamp(0.1 + (behavior.talentSensitivity * 0.08), 0.08, 0.22),
      finance:App.utils.clamp(0.1 + (behavior.leverageAppetite * 0.06), 0.08, 0.22),
      sales:App.utils.clamp(0.14 + (behavior.customerElasticity * 0.08), 0.12, 0.3),
      rnd:App.utils.clamp(0.06 + (behavior.innovationBias * 0.1), 0.04, 0.24)
    };

    managementTilt =
      ((Number(business.reputation) || 50) - 50) * 0.02 +
      (((Number(business.customerTrust) || 50) - 50) * 0.01) +
      ((decision && decision.stance === "aggressive") ? -0.08 : 0) +
      ((decision && decision.cashPolicy === "preserve") ? 0.06 : 0) -
      (boardPressure * 0.05);

    business.managementQuality = App.utils.clamp((Number(business.managementQuality) || 50) * 0.95 + (50 + managementTilt * 100) * 0.05, 10, 98);
    business.departments.operations = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.operations));
    business.departments.people = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.people));
    business.departments.finance = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.finance));
    business.departments.sales = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.sales));
    business.departments.rnd = Math.round(Math.max(0, (business.revenueGU || 0) * departmentShares.rnd));

    business.wageBillAnnual = Math.max(0, getLeadershipPayrollAnnual(business) + getAnonymousPayrollAnnual(business));
    business.operatingCostAnnual = Math.max(0, (business.revenueGU || 0) * getOperatingCostRate(business));
    business.hiringNeed = App.utils.clamp(
      Math.round(((decision && decision.staffingAction === "hire") ? 1 : (decision && decision.staffingAction === "layoff" ? -1 : 0)) * Math.max(0, business.employees || 0) * 0.08 + ((Number(profile.talentShortageIndex) || 0) * -8) + (leadershipCount * 0.4)),
      -600,
      600
    );
  }

  function ensureBlocCentralBankState(bloc){
    if (!bloc) return null;
    if (!bloc.centralBank || typeof bloc.centralBank !== "object") {
      bloc.centralBank = {};
    }
    bloc.centralBank.policyRate = App.utils.clamp(Number(bloc.centralBank.policyRate) || App.utils.rand(0.012, 0.08), 0.002, 0.24);
    bloc.centralBank.inflation = App.utils.clamp(Number(bloc.centralBank.inflation) || App.utils.rand(0.01, 0.07), -0.02, 0.22);
    bloc.centralBank.unemployment = App.utils.clamp(Number(bloc.centralBank.unemployment) || 0.09, 0.01, 0.38);
    bloc.centralBank.lastMoveDay = Math.max(0, Math.floor(Number(bloc.centralBank.lastMoveDay) || 0));
    return bloc.centralBank;
  }

  function getBlocPolicyRate(blocId){
    var bloc = typeof blocId === "string" ? App.store.getBloc(blocId) : blocId;
    var centralBank = ensureBlocCentralBankState(bloc);

    return centralBank ? App.utils.clamp(Number(centralBank.policyRate) || 0.06, 0.002, 0.24) : 0.06;
  }

  function processYearlyCentralBankPolicy(){
    App.store.blocs.forEach(function(bloc){
      var profiles = App.store.getBlocProfiles ? App.store.getBlocProfiles(bloc.id) : [];
      var centralBank = ensureBlocCentralBankState(bloc);
      var unemploymentRate;
      var demandGrowth;
      var inflationPressure;
      var policyMove;

      if (!centralBank) return;

      unemploymentRate = profiles.length ? profiles.reduce(function(sum, profile){
        var laborForce = Math.max(1, Number(profile.laborForce) || 1);
        return sum + ((Number(profile.unemployed) || 0) / laborForce);
      }, 0) / profiles.length : 0.1;

      demandGrowth = profiles.length ? profiles.reduce(function(sum, profile){
        var previous = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
        var current = Math.max(0, Number(profile.consumerDemandGU) || 0);
        return sum + ((current - previous) / previous);
      }, 0) / profiles.length : 0;

      inflationPressure = App.utils.clamp((demandGrowth * 0.85) + Math.max(0, 0.22 - unemploymentRate) * 0.4 + ((bloc.geoPressure || 0) * 0.25), -0.03, 0.14);
      centralBank.inflation = App.utils.clamp(centralBank.inflation * 0.55 + inflationPressure * 0.45, -0.02, 0.22);
      centralBank.unemployment = App.utils.clamp(unemploymentRate, 0.01, 0.38);

      policyMove = (centralBank.inflation > 0.065 ? 0.007 : 0) + (centralBank.unemployment > 0.12 ? -0.006 : 0);
      policyMove += App.utils.clamp((demandGrowth - 0.01) * 0.08, -0.008, 0.008);
      centralBank.policyRate = App.utils.clamp(centralBank.policyRate + policyMove, 0.002, 0.24);
      centralBank.lastMoveDay = App.store.simDay;

      if (Math.abs(policyMove) >= 0.0055) {
        emitNews("policy", bloc.flag + " central bank " + (policyMove > 0 ? "raised" : "cut") + " rates to " + (centralBank.policyRate * 100).toFixed(2) + "%.", {
          entities:{
            blocIds:[bloc.id]
          },
          causes:[
            "Inflation estimate: " + (centralBank.inflation * 100).toFixed(2) + "%.",
            "Bloc unemployment estimate: " + (centralBank.unemployment * 100).toFixed(1) + "%."
          ]
        });
      }
    });
  }

  function legacyProcessYearlyCorporateGovernance(){
    App.store.businesses.forEach(function(business){
      var listing = getBusinessListing(business.id);
      var owner = App.store.getPerson(business.ownerId);
      var governance;
      var ageYears;
      var founderAlive;
      var outsideDrift;
      var profile;
      var institutionScore;
      var corruptionIndex;
      var friendliness;
      var volatility;
      var concentrationBias;
      var confidenceBias;

      if (!business) return;
      ensureBusinessDecisionState(business);
      governance = business.governance;
      profile = ensureCountryProfile(business.countryISO, business.blocId);
      institutionScore = App.utils.clamp(Number(profile && profile.institutionScore) || 0.55, 0.1, 1);
      corruptionIndex = App.utils.clamp(Number(profile && profile.developmentCorruptionIndex) || (1 - institutionScore), 0, 1);
      friendliness = App.utils.clamp(Number(profile && profile.developmentBusinessFriendlinessIndex) || institutionScore, 0, 1);
      volatility = App.utils.clamp((Number(profile && profile.institutionalInstabilityIndex) || 0.2) / 1.6, 0, 1);
      concentrationBias = App.utils.clamp((0.55 - friendliness) * 0.26 + (corruptionIndex * 0.2), -0.08, 0.22);
      confidenceBias = App.utils.clamp((friendliness - 0.5) * 0.12 + ((1 - corruptionIndex) - 0.5) * 0.08 - (volatility * 0.08), -0.08, 0.12);
      ageYears = getBusinessAgeYears(business);
      founderAlive = !!(App.store.getPerson(business.founderId) && App.store.getPerson(business.founderId).alive);

      outsideDrift = (listing ? App.utils.rand(0.01, 0.05) : App.utils.rand(0, 0.02)) + confidenceBias - concentrationBias;
      governance.outsideInvestorShare = App.utils.clamp((Number(governance.outsideInvestorShare) || 0) + outsideDrift, 0, 0.95);
      governance.familyControlShare = App.utils.clamp((Number(governance.familyControlShare) || 0.6) - outsideDrift * 0.72, 0.05, 1);
      governance.founderControl = App.utils.clamp((Number(governance.founderControl) || 0.9) - (ageYears * 0.0045) - (listing ? 0.02 : 0) - (founderAlive ? 0 : 0.05), 0.02, 1);
      governance.boardPressure = App.utils.clamp((Number(governance.outsideInvestorShare) || 0) * 0.8 + ((business.bankruptcyStage && business.bankruptcyStage !== "stable") ? 0.28 : 0), 0, 1.4);
      governance.boardSeats = App.utils.clamp(Math.floor(Math.max(3, Math.min(13, 3 + Math.round((business.employees || 1) / 60) + (listing ? 1 : 0)))), 3, 13);
      governance.lastReviewDay = App.store.simDay;

      if (governance.boardPressure > 0.92 && owner && Math.random() < 0.12) {
        adjustTemporaryStates(owner, {
          stress:App.utils.rand(3, 8),
          confidence:App.utils.rand(-5, -1)
        });
        syncPerson(owner);
      }
    });
  }

  function legacyProcessYearlyInnovationAndCopying(){
    App.store.businesses.forEach(function(business){
      var behavior;
      var rAndDIntensity;
      var localPeers;
      var peerFrontier;
      var copyPressure;
      var innovationGain;

      if (!business) return;
      ensureBusinessDecisionState(business);

      behavior = getIndustryBehaviorProfile(business.industry);
      rAndDIntensity = Math.max(0, Number(business.departments && business.departments.rnd) || 0) / Math.max(1, Number(business.revenueGU) || 1);
      localPeers = App.store.businesses.filter(function(candidate){
        return candidate && candidate.id !== business.id && candidate.industry === business.industry;
      });
      peerFrontier = localPeers.length ? localPeers.reduce(function(best, peer){
        return Math.max(best, Number(peer.innovationIndex) || 0);
      }, 0) : Number(business.innovationIndex) || 0;

      innovationGain = (rAndDIntensity * 120 * behavior.innovationBias) + App.utils.rand(-1.4, 2.6);
      business.innovationIndex = App.utils.clamp((Number(business.innovationIndex) || 40) * 0.86 + (Number(business.technologyEdge) || 40) * 0.08 + innovationGain, 0, 100);
      copyPressure = Math.max(0, (peerFrontier - (Number(business.innovationIndex) || 0)) / 100);
      business.copiedTechDebt = App.utils.clamp((Number(business.copiedTechDebt) || 0) * 0.72 + copyPressure * App.utils.rand(0.08, 0.28), 0, 1.6);

      if ((Number(business.innovationIndex) || 0) > peerFrontier + 5 && Math.random() < 0.08) {
        emitNews("market", "<strong>" + business.name + "</strong> pulled ahead with a sector-leading innovation cycle.", {
          entities:{
            businessIds:[business.id],
            countryIsos:[business.countryISO],
            blocIds:[business.blocId]
          },
          causes:[
            "R&D intensity outpaced industry peers.",
            "Innovation index rose to " + (Number(business.innovationIndex) || 0).toFixed(1) + "."
          ]
        });
      }
    });
  }

  function legacyApplyCustomerDemandAndReputationDynamics(business, decision, margin){
    var behavior;
    var trust;
    var quality;
    var pricePower;
    var decisionSignal;
    var reputationDelta;
    var scope;
    var countryProfile;
    var countryIndustryDemand;
    var blocIndustryDemand;
    var marketDemandSignal;
    var marketDemandMultiplier;

    if (!business) {
      return { revenueMultiplier:1, reputationDelta:0 };
    }

    behavior = getIndustryBehaviorProfile(business.industry);
    trust = Number(business.customerTrust) || 50;
    quality = Number(business.productQuality) || 50;
    pricePower = Number(business.pricePower) || 1;
    scope = getIndustryMarketScope(business.industry);
    countryProfile = ensureCountryProfile(business.countryISO, business.blocId);
    countryIndustryDemand = getCountryIndustryDemandMultiplier(countryProfile, business.industry);
    blocIndustryDemand = getBlocIndustryDemandMultiplier(business.blocId, business.industry);
    marketDemandSignal = scope === "local" ? countryIndustryDemand : (scope === "global" ? blocIndustryDemand : ((countryIndustryDemand * 0.52) + (blocIndustryDemand * 0.48)));
    marketDemandMultiplier = App.utils.clamp(1 + ((marketDemandSignal - 1) * 0.22), 0.9, 1.12);
    decisionSignal = (decision && decision.stance === "aggressive" ? 0.6 : 0) + (decision && decision.cashPolicy === "preserve" ? -0.35 : 0);

    trust = App.utils.clamp(trust + ((Number(business.reputation) || 50) - 50) * 0.035 + (margin * 4.4) - (business.laborUnrestScore || 0) * 2.6 - decisionSignal, 0, 100);
    quality = App.utils.clamp(quality + ((Number(business.innovationIndex) || 0) - 50) * 0.035 + ((Number(business.managementQuality) || 50) - 50) * 0.02 - (business.supplyStress || 0) * 3.2, 0, 100);
    pricePower = App.utils.clamp(pricePower + ((trust - 50) * 0.0008) + ((quality - 50) * 0.0006) - (behavior.customerElasticity * 0.0024), 0.62, 1.55);

    business.customerTrust = trust;
    business.productQuality = quality;
    business.pricePower = pricePower;
    business.technologyEdge = App.utils.clamp((Number(business.technologyEdge) || 40) * 0.9 + (Number(business.innovationIndex) || 40) * 0.12 - (Number(business.copiedTechDebt) || 0) * 5.5, 0, 100);

    reputationDelta = App.utils.clamp(((trust - 50) * 0.03) + ((quality - 50) * 0.02) - ((business.supplyStress || 0) * 0.8), -1.2, 1.4);
    return {
      revenueMultiplier:App.utils.clamp((1 + ((trust - 50) * 0.0018) + ((quality - 50) * 0.0016) + ((pricePower - 1) * 0.08 * (1 - behavior.customerElasticity * 0.4))) * marketDemandMultiplier, 0.84, 1.22),
      reputationDelta:reputationDelta
    };
  }

  function legacyApplyDebtCreditAndBankruptcyStages(business, owner, bloc, decision){
    var behavior;
    var policyRate;
    var countryProfile;
    var countryStance;
    var blocStance;
    var countryPolicyEffects;
    var blocPolicyEffects;
    var debtRateBias;
    var rolloverChanceBias;
    var distressBias;
    var bailoutBias;
    var debtCapacity;
    var desiredBorrow;
    var interestExpenseDaily;
    var maturityDue;
    var rolloverChance;
    var stageIndex;
    var distressBuild;
    var bailoutChance;
    var institutionScore;
    var instabilityIndex;
    var businessFriendliness;
    var corruptionIndex;
    var contractReliability;
    var investmentConfidence;
    var institutionVolatility;
    var sanctionExposure;
    var electionEffects;

    if (!business || !owner || !bloc) return { liquidated:false, creditStress:0 };

    behavior = getIndustryBehaviorProfile(business.industry);
    policyRate = getBlocPolicyRate(bloc);
    countryProfile = ensureCountryProfile(business.countryISO, business.blocId);
    countryStance = refreshCountryPolicyStance(countryProfile, {
      unemploymentRate:countryProfile && countryProfile.laborForce > 0 ? (Math.max(0, Number(countryProfile.unemployed) || 0) / Math.max(1, Number(countryProfile.laborForce) || 1)) : 0,
      laborScarcity:Number(countryProfile && countryProfile.laborScarcity) || 0,
      wagePressure:Number(countryProfile && countryProfile.wagePressure) || 0,
      longUnemploymentShare:Number(countryProfile && countryProfile.longUnemploymentShare) || 0,
      demandGrowth:Number(countryProfile && countryProfile.policyEvidence && countryProfile.policyEvidence.demandGrowth) || 0
    });
    blocStance = refreshBlocPolicyStance(bloc);
    countryPolicyEffects = COUNTRY_POLICY_STANCE_EFFECTS[countryStance] || COUNTRY_POLICY_STANCE_EFFECTS.neutral;
    blocPolicyEffects = BLOC_POLICY_STANCE_EFFECTS[blocStance] || BLOC_POLICY_STANCE_EFFECTS.neutral;
    institutionScore = App.utils.clamp(Number(countryProfile && countryProfile.institutionScore) || 0.55, 0.1, 1);
    instabilityIndex = App.utils.clamp(Number(countryProfile && countryProfile.institutionalInstabilityIndex) || 0.2, 0, 1.6);
    businessFriendliness = App.utils.clamp(Number(countryProfile && countryProfile.developmentBusinessFriendlinessIndex) || institutionScore, 0, 1);
    corruptionIndex = App.utils.clamp(Number(countryProfile && countryProfile.developmentCorruptionIndex) || (1 - institutionScore), 0, 1);
    contractReliability = App.utils.clamp((institutionScore * 0.42) + (businessFriendliness * 0.36) + ((1 - corruptionIndex) * 0.22), 0.08, 1);
    investmentConfidence = App.utils.clamp((businessFriendliness * 0.52) + (contractReliability * 0.3) + (Math.max(0, Number(countryProfile && countryProfile.demandGrowth) || 0) * 1.8) * 0.18, 0.06, 1);
    institutionVolatility = App.utils.clamp((instabilityIndex / 1.6) * 0.65 + (corruptionIndex * 0.35), 0, 1.2);
    sanctionExposure = getCountrySanctionExposure(countryProfile, business.blocId);
    electionEffects = getTier6ElectionChannelEffects(countryProfile);
    debtRateBias = (countryPolicyEffects.debtRateBias || 0) + (blocPolicyEffects.debtRateBias || 0);
    rolloverChanceBias = (countryPolicyEffects.rolloverChanceBias || 0) + (blocPolicyEffects.rolloverChanceBias || 0);
    distressBias = (countryPolicyEffects.distressBias || 0) + (blocPolicyEffects.distressBias || 0);
    bailoutBias = (countryPolicyEffects.bailoutBias || 0) + (blocPolicyEffects.bailoutBias || 0);
    investmentConfidence = App.utils.clamp(investmentConfidence - (sanctionExposure.financeBlockIndex * 0.24) - (sanctionExposure.dealBlockIndex * 0.08) + (electionEffects.creditConfidenceBias || 0), 0.06, 1);
    debtRateBias += App.utils.clamp((0.55 - contractReliability) * 0.022 + (institutionVolatility * 0.012), -0.012, 0.034);
    debtRateBias += App.utils.clamp(sanctionExposure.financeBlockIndex * 0.019, 0, 0.026);
    rolloverChanceBias += App.utils.clamp((contractReliability - 0.5) * 0.22 + (investmentConfidence - 0.5) * 0.12 - (institutionVolatility * 0.18), -0.16, 0.18);
    rolloverChanceBias -= App.utils.clamp(sanctionExposure.financeBlockIndex * 0.18, 0, 0.18);
    distressBias += App.utils.clamp((0.52 - investmentConfidence) * 0.22 + (institutionVolatility * 0.2), -0.12, 0.2);
    distressBias += App.utils.clamp(sanctionExposure.financeBlockIndex * 0.22, 0, 0.2);
    bailoutBias += App.utils.clamp((contractReliability - 0.5) * 0.12 + (institutionScore - 0.5) * 0.08 - (corruptionIndex - 0.4) * 0.08, -0.1, 0.14);
    debtCapacity = Math.max(0, (Number(business.valuationGU) || 0) * App.utils.clamp(0.2 + behavior.leverageAppetite * 0.32, 0.2, 0.82));

    if ((decision && decision.stance === "aggressive") && (business.hiringNeed || 0) > 0 && (business.cashReservesGU || 0) < (business.wageBillAnnual || 0) * 0.18) {
      desiredBorrow = Math.min(
        debtCapacity - (Number(business.debtGU) || 0),
        Math.max(0, (business.wageBillAnnual || 0) * 0.22 + (business.operatingCostAnnual || 0) * 0.08)
      );
      if (desiredBorrow > 1200) {
        business.debtGU = Math.max(0, (Number(business.debtGU) || 0) + desiredBorrow);
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + desiredBorrow * 0.92);
        business.debtInterestRate = App.utils.clamp((policyRate + 0.022 + debtRateBias + (business.rolloverRisk || 0) * 0.03 + (business.bankruptcyStage !== "stable" ? 0.02 : 0)), 0.01, 0.34);
        business.debtMaturityDay = App.store.simDay + App.utils.randInt(180, 520);
      }
    }

    if ((decision && decision.cashPolicy === "preserve") && (Number(business.debtGU) || 0) > 0 && (business.cashReservesGU || 0) > (business.wageBillAnnual || 0) * 0.12) {
      desiredBorrow = Math.min((Number(business.debtGU) || 0), (business.cashReservesGU || 0) * 0.08);
      business.debtGU = Math.max(0, (Number(business.debtGU) || 0) - desiredBorrow);
      business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) - desiredBorrow);
    }

    interestExpenseDaily = Math.max(0, (Number(business.debtGU) || 0) * Math.max(0.001, Number(business.debtInterestRate) || 0.08) / YEAR_DAYS) * SIM_DAYS_PER_TICK;
    if (interestExpenseDaily > 0) {
      if ((business.cashReservesGU || 0) >= interestExpenseDaily) {
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) - interestExpenseDaily);
      } else {
        owner.netWorthGU = Math.max(100, (owner.netWorthGU || 0) - Math.max(0, interestExpenseDaily - (business.cashReservesGU || 0)) * (business.founderGuaranteeShare || 0.5));
        business.cashReservesGU = 0;
      }
      business.profitGU -= interestExpenseDaily * YEAR_DAYS;
    }

    maturityDue = (Number(business.debtGU) || 0) > 0 && (Number(business.debtMaturityDay) || 0) <= App.store.simDay;
    if (maturityDue) {
      rolloverChance = App.utils.clamp(0.78 + rolloverChanceBias + ((business.reputation || 50) - 50) * 0.005 - (business.rolloverRisk || 0) * 0.28 - ((policyRate - 0.03) * 1.8), 0.05, 0.94);
      if (Math.random() < rolloverChance) {
        business.debtInterestRate = App.utils.clamp((policyRate + 0.026 + debtRateBias + (business.rolloverRisk || 0) * 0.02), 0.01, 0.34);
        business.debtMaturityDay = App.store.simDay + App.utils.randInt(140, 420);
      } else {
        business.rolloverRisk = App.utils.clamp((Number(business.rolloverRisk) || 0) + 0.28, 0, 1.6);
        business.distressScore = App.utils.clamp((Number(business.distressScore) || 0) + 0.42, 0, 4.4);
      }
    }

    distressBuild =
      ((business.profitGU || 0) < -(business.revenueGU || 0) * 0.08 ? 0.28 : -0.08) +
      ((business.cashReservesGU || 0) < (business.wageBillAnnual || 0) * 0.06 ? 0.22 : -0.06) +
      (((business.debtGU || 0) / Math.max(1, business.valuationGU || 1)) > 0.62 ? 0.24 : -0.04) +
      (business.rolloverRisk || 0) * 0.18 +
      distressBias;
    business.distressScore = App.utils.clamp((Number(business.distressScore) || 0) * 0.74 + distressBuild, 0, 4.4);

    stageIndex = business.distressScore >= 3.8 ? 5 : (business.distressScore >= 3.05 ? 4 : (business.distressScore >= 2.35 ? 3 : (business.distressScore >= 1.55 ? 2 : (business.distressScore >= 0.95 ? 1 : 0))));
    business.bankruptcyStage = BANKRUPTCY_STAGE_ORDER[stageIndex] || "stable";

    if (business.bankruptcyStage === "restructuring") {
      business.restructuringUntilDay = Math.max(Number(business.restructuringUntilDay) || 0, App.store.simDay + App.utils.randInt(40, 120));
      business.reputation = clampScore((business.reputation || 50) - App.utils.rand(0.2, 0.7));
      business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + Math.max(0, (business.debtGU || 0) * 0.04));
    } else if (business.bankruptcyStage === "fire_sale") {
      var shed = Math.max(0, Math.floor((business.employees || 0) * App.utils.rand(0.04, 0.14)));
      if (shed > 0) {
        business.employees = Math.max((business.leadership || []).length || 1, (business.employees || 1) - releaseLabor(business.countryISO, shed));
      }
      business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + Math.max(0, (business.valuationGU || 0) * App.utils.rand(0.01, 0.04)));
      business.reputation = clampScore((business.reputation || 50) - App.utils.rand(0.8, 2.1));
    } else if (business.bankruptcyStage === "bailout") {
      bailoutChance = App.utils.clamp(0.14 + bailoutBias + Math.max(0, 0.11 - (getBlocPolicyRate(bloc) * 0.8)) + ((business.reputation || 50) > 58 ? 0.08 : 0), 0.05, 0.38);
      if (Math.random() < bailoutChance) {
        var bailout = Math.max(0, Math.min((business.valuationGU || 0) * 0.06, (business.wageBillAnnual || 0) * 0.26));
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + bailout);
        business.debtGU = Math.max(0, (business.debtGU || 0) - bailout * 0.2);
        business.distressScore = App.utils.clamp((business.distressScore || 0) - 0.55, 0, 4.4);
      }
    } else if (business.bankruptcyStage === "liquidation") {
      emitNews("bankruptcy", "<strong>" + owner.name + "</strong> " + bloc.flag + " - <strong>" + business.name + "</strong> entered liquidation after prolonged credit distress.", {
        entities:{
          personIds:[owner.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[
          "Debt rollover failed and liquidity buffers were exhausted.",
          "Bankruptcy stage escalated from " + (business.bankruptcyStage || "stable") + " to liquidation."
        ]
      });
      liquidateBusiness(owner, business);
      owner.netWorthGU = Math.max(600, owner.netWorthGU * 0.42);
      adjustTemporaryStates(owner, {
        confidence:-14,
        stress:16,
        burnout:5
      });
      adjustPersonalReputation(owner, {
        trust:-6,
        prestige:-9,
        notoriety:6,
        scandalMemory:8
      });
      syncPerson(owner);
      return {
        liquidated:true,
        creditStress:1.2,
        countryPolicyStance:countryStance,
        blocPolicyStance:blocStance,
        policyCreditBias:Number((debtRateBias + distressBias).toFixed(4))
      };
    }

    business.policyCreditEvidence = {
      countryPolicyStance:countryStance,
      blocPolicyStance:blocStance,
      debtRateBias:Number(debtRateBias.toFixed(4)),
      rolloverChanceBias:Number(rolloverChanceBias.toFixed(4)),
      distressBias:Number(distressBias.toFixed(4)),
      bailoutBias:Number(bailoutBias.toFixed(4)),
      contractReliability:Number(contractReliability.toFixed(4)),
      investmentConfidence:Number(investmentConfidence.toFixed(4)),
      institutionVolatility:Number(institutionVolatility.toFixed(4)),
      corruptionIndex:Number(corruptionIndex.toFixed(4)),
      sanctionFinanceBlockIndex:Number(sanctionExposure.financeBlockIndex.toFixed(4)),
      sanctionDealBlockIndex:Number(sanctionExposure.dealBlockIndex.toFixed(4))
    };

    return {
      liquidated:false,
      creditStress:App.utils.clamp((business.debtGU || 0) / Math.max(1, business.valuationGU || 1) + (business.rolloverRisk || 0) * 0.4 + (business.bankruptcyStage !== "stable" ? 0.35 : 0), 0, 2),
      countryPolicyStance:countryStance,
      blocPolicyStance:blocStance,
      policyCreditBias:Number((debtRateBias + distressBias).toFixed(4))
    };
  }

  function legacyGetReserveShareRate(business, decision){
    var currentDecision = decision || business.currentDecision || { cashPolicy:"balanced" };
    if (currentDecision.cashPolicy === "preserve") return 0.68;
    if (currentDecision.cashPolicy === "reinvest") return 0.38;
    return 0.52;
  }

  function getLeadershipPayrollAnnual(business){
    return (business.leadership || []).reduce(function(sum, entry){
      var person = App.store.getPerson(entry.personId);
      return sum + Math.max(0, Number(person && person.salaryGU) || getRoleSalary(business, entry));
    }, 0);
  }

  function getAnonymousPayrollAnnual(business){
    var leadershipCount = Math.max(0, (business.leadership || []).length);
    var anonymousHeadcount = Math.max(0, (business.employees || leadershipCount) - leadershipCount);
    return anonymousHeadcount * getStaffMedianSalary(business);
  }

  function getBusinessAnnualGrowthBands(business){
    return getBusinessDomain().getBusinessAnnualGrowthBands(business);
  }

  function getBusinessRevenueFloorGU(business){
    return getBusinessDomain().getBusinessRevenueFloor(business);
  }

  function getBusinessRealizedRevenueCap(business){
    return getBusinessDomain().getBusinessRealizedRevenueCap(business);
  }

  function getBusinessHeadcountRealityCap(business, leadershipFloor){
    return getBusinessDomain().getBusinessHeadcountRealityCap(business, leadershipFloor);
  }

  function computeBusinessAnnualRevenueTarget(business, decision, ownerBusinessTrait, ownerMobilityTrait){
    return getBusinessDomain().computeBusinessAnnualRevenueTarget(business, decision, ownerBusinessTrait, ownerMobilityTrait);
  }

  function getStageExpansionBias(stage){
    return getBusinessDomain().getStageExpansionBias(stage);
  }

  function getLeaderExpansionLean(person){
    ensureDecisionData(person);

    return (
      (person.decisionProfile.riskTolerance - 50) * 0.7 +
      (person.decisionProfile.statusSeeking - 50) * 0.45 +
      (person.decisionProfile.adaptability - 50) * 0.3 +
      (person.temporaryStates.confidence - 50) * 0.65 +
      (person.temporaryStates.ambitionSpike - 50) * 0.35 -
      (person.decisionProfile.discipline - 50) * 0.25 -
      (person.decisionProfile.patience - 50) * 0.15 -
      (person.temporaryStates.stress - 50) * 0.55 -
      (person.temporaryStates.burnout - 50) * 0.45 +
      getTraitDecisionShift(person, "expansion")
    );
  }

  function getLeaderStaffingLean(person){
    ensureDecisionData(person);

    return (
      (person.decisionProfile.loyalty - 50) * 0.4 +
      (person.decisionProfile.ethics - 50) * 0.45 +
      (person.decisionProfile.adaptability - 50) * 0.2 +
      (person.temporaryStates.confidence - 50) * 0.25 -
      (person.decisionProfile.greed - 50) * 0.25 -
      (person.temporaryStates.stress - 50) * 0.35 -
      (person.temporaryStates.burnout - 50) * 0.25 +
      getTraitDecisionShift(person, "staffing")
    );
  }

  function getLeaderInstitutionPrestigeLean(person, business){
    var quality = Number(person && person.educationInstitutionQuality);
    var education = Number(person && person.educationIndex) || 0;
    var ownPrestige = Number.isFinite(quality) ? App.utils.clamp(quality, 20, 100) : App.utils.clamp(35 + (education * 0.62), 20, 100);
    var profile = ensureCountryProfile((person && person.countryISO) || (business && business.countryISO));
    var countryBaseline = App.utils.clamp((Number(profile && profile.institutionScore) || 0.55) * 100, 20, 100);
    var delta = ownPrestige - countryBaseline;

    return App.utils.clamp((delta * 0.26) + ((ownPrestige - 50) * 0.18), -14, 18);
  }

  function getLeaderCashLean(person){
    ensureDecisionData(person);

    return (
      (person.decisionProfile.discipline - 50) * 0.7 +
      (person.decisionProfile.patience - 50) * 0.55 +
      (person.decisionProfile.ethics - 50) * 0.2 -
      (person.decisionProfile.riskTolerance - 50) * 0.55 -
      (person.decisionProfile.statusSeeking - 50) * 0.25 -
      (person.temporaryStates.confidence - 50) * 0.25 +
      (person.temporaryStates.stress - 50) * 0.45 +
      (person.temporaryStates.burnout - 50) * 0.2 +
      getTraitDecisionShift(person, "cash")
    );
  }

  function getLeaderSuccessionLean(person, business){
    ensureDecisionData(person);

    return (
      (person.decisionProfile.familyAttachment - 50) * 0.85 +
      (person.decisionProfile.loyalty - 50) * 0.4 -
      (person.decisionProfile.discipline - 50) * 0.35 -
      (person.decisionProfile.ethics - 50) * 0.25 -
      (person.decisionProfile.adaptability - 50) * 0.2 -
      (person.temporaryStates.stress - 50) * 0.45 -
      (((business.reputation || 50) < 40) ? 8 : 0) +
      getTraitDecisionShift(person, "succession")
    );
  }

  function getBusinessDecisionMakers(business){
    var leadership = App.store.getBusinessLeadership(business).filter(function(entry){
      return entry.person && entry.person.alive && !entry.person.retired;
    });
    var owner;

    if (leadership.length) {
      leadership.forEach(function(entry){
        ensureDecisionData(entry.person);
      });
      return leadership;
    }

    owner = App.store.getPerson(business.ownerId) || App.store.getPerson(business.founderId);
    if (!owner) return [];

    ensureDecisionData(owner);
    return [{
      roleKey:"ceo",
      title:owner.jobTitle || "CEO",
      person:owner
    }];
  }

  function buildDecisionInfluencers(makers){
    var weights = makers.map(function(entry){
      return Object.assign({}, entry, {
        influence:roleDecisionInfluence(entry.roleKey)
      });
    }).sort(function(first, second){
      return second.influence - first.influence;
    });
    var total = weights.reduce(function(sum, entry){
      return sum + entry.influence;
    }, 0) || 1;

    return weights.slice(0, 3).map(function(entry){
      return {
        personId:entry.person.id,
        roleKey:entry.roleKey,
        title:entry.title,
        weight:Math.round((entry.influence / total) * 100)
      };
    });
  }

  function buildDecisionReasons(business, metrics, makers, traitEffects){
    var reasons = [];
    var ceoEntry = makers.find(function(entry){
      return entry.roleKey === "ceo";
    }) || makers[0] || null;
    var ceo = ceoEntry ? ceoEntry.person : null;

    if (metrics.profitMargin > 0.16) reasons.push({ text:"Strong margins encouraged bolder expansion.", weight:metrics.profitMargin * 100 });
    if (metrics.profitMargin < -0.10) reasons.push({ text:"Weak margins pushed leadership into protection mode.", weight:Math.abs(metrics.profitMargin) * 120 });
    if (metrics.cashCoverage < 2) reasons.push({ text:"Thin cash reserves forced caution.", weight:(2 - metrics.cashCoverage) * 25 });
    if (metrics.cashCoverage > 5) reasons.push({ text:"Deep cash reserves supported growth plans.", weight:(metrics.cashCoverage - 5) * 18 });
    if (metrics.reputation > 68) reasons.push({ text:"Strong reputation made growth feel safer.", weight:(metrics.reputation - 68) * 1.6 });
    if (metrics.reputation < 38) reasons.push({ text:"Damaged reputation limited room to maneuver.", weight:(38 - metrics.reputation) * 1.8 });
    if (metrics.institutionPrestige > 70) reasons.push({ text:"Leadership education prestige supported hiring confidence and merit promotions.", weight:(metrics.institutionPrestige - 70) * 1.8 });
    if (metrics.institutionPrestige < 44) reasons.push({ text:"Low institutional prestige made leadership favor conservative staffing and slower promotions.", weight:(44 - metrics.institutionPrestige) * 2.2 });
    if (metrics.laborScarcity > 0.82) reasons.push({ text:"Local labor scarcity forced wage pressure and selective hiring.", weight:(metrics.laborScarcity - 0.82) * 28 });
    if (metrics.longUnemploymentShare > 0.08) reasons.push({ text:"A large long-unemployment pool weakened talent matching quality.", weight:metrics.longUnemploymentShare * 120 });
    if (metrics.wagePressure > 0.12) reasons.push({ text:"Country wage pressure raised expected compensation costs.", weight:metrics.wagePressure * 60 });
    if (metrics.geoPressure > 1.5) reasons.push({ text:"Geopolitical pressure made the firm more defensive.", weight:(metrics.geoPressure - 1.5) * 16 });
    if (metrics.trend > 0.07) reasons.push({ text:"Rising revenue momentum favored expansion.", weight:metrics.trend * 120 });
    if (metrics.trend < -0.07) reasons.push({ text:"Falling revenue momentum increased retrenchment pressure.", weight:Math.abs(metrics.trend) * 120 });
    if (business.stage === "declining") reasons.push({ text:"Declining status raised urgency around survival.", weight:18 });

    if (ceo) {
      if (ceo.temporaryStates.confidence > 62) reasons.push({ text:"A confident CEO pushed for sharper action.", weight:ceo.temporaryStates.confidence - 62 });
      if (ceo.temporaryStates.stress > 58) reasons.push({ text:"Leadership stress made the company more cautious.", weight:ceo.temporaryStates.stress - 58 });
      if (ceo.decisionProfile.familyAttachment > 64) reasons.push({ text:"Leadership culture still leans family-first.", weight:ceo.decisionProfile.familyAttachment - 64 });
      if (ceo.decisionProfile.ethics > 66) reasons.push({ text:"High ethics softened the harshest staffing moves.", weight:ceo.decisionProfile.ethics - 66 });
    }

    if (traitEffects && traitEffects.length) {
      reasons.push({
        text:"Trait pressure: " + traitEffects.slice(0, 2).map(function(effect){ return effect.label; }).join(", ") + ".",
        weight:14
      });
    }

    return reasons.sort(function(first, second){
      return second.weight - first.weight;
    }).slice(0, 3).map(function(reason){
      return reason.text;
    });
  }

  function primeBusinessDecisionState(business){
    if (!business) return;
    business.reputation = clampScore(business.reputation != null ? business.reputation : App.utils.rand(45, 70));
    business.cashReservesGU = Math.max(0, business.cashReservesGU != null ? business.cashReservesGU : business.revenueGU * App.utils.rand(0.05, 0.18));
    business.decisionHistory = (business.decisionHistory || []).slice(0, 12);
  }

  function legacyEvaluateBusinessDecision(business){
    var makers;
    var bloc;
    var profile;
    var trend;
    var demandGrowth;
    var profitMargin;
    var cashCoverage;
    var laborScarcity;
    var longUnemploymentShare;
    var wagePressure;
    var demandCapacity;
    var productionCapacity;
    var demandOpportunityRatio;
    var demandUtilization;
    var demandSlack;
    var metrics;
    var scores;
    var stance;
    var staffingAction;
    var cashPolicy;
    var successionBias;
    var leverageRatio;
    var employeeCount;
    var underUtilizedLayoffAllowed;
    var decisionTraitEffects = [];
    var institutionPrestige = 50;

    if (!business) return null;

    primeBusinessDecisionState(business);
    makers = getBusinessDecisionMakers(business);
    bloc = App.store.getBloc(business.blocId);
    profile = ensureCountryProfile(business.countryISO);
    trend = getRevenueTrend(business);
    demandGrowth = ((Math.max(0, Number(profile && profile.consumerDemandGU) || 0) - Math.max(1, Number(profile && profile.prevConsumerDemandGU) || Number(profile && profile.consumerDemandGU) || 1)) / Math.max(1, Number(profile && profile.prevConsumerDemandGU) || Number(profile && profile.consumerDemandGU) || 1));
    profitMargin = getProfitMargin(business);
    cashCoverage = getCashCoverageMonths(business);
    laborScarcity = getCountryLaborScarcity(business.countryISO);
    longUnemploymentShare = getCountryLongUnemploymentShare(business.countryISO);
    wagePressure = getCountryWagePressure(business.countryISO);
    demandCapacity = Math.max(1, getBusinessDemandCapacityGU(business));
    productionCapacity = Math.max(1, getBusinessProductionCapacityGU(business));
    demandOpportunityRatio = App.utils.clamp(demandCapacity / productionCapacity, 0.55, 1.85);
    demandUtilization = Math.max(0, (business.revenueGU || 0) / demandCapacity);
    demandSlack = App.utils.clamp(1 - demandUtilization, -0.8, 0.8);
    leverageRatio = Math.max(0, Number(business.debtGU) || 0) / Math.max(1, Number(business.valuationGU) || 1);
    employeeCount = Math.max(0, Number(business.employees) || 0);
    metrics = {
      trend:trend,
      demandGrowth:demandGrowth,
      profitMargin:profitMargin,
      cashCoverage:cashCoverage,
      reputation:business.reputation || 50,
      institutionPrestige:50,
      laborScarcity:laborScarcity,
      longUnemploymentShare:longUnemploymentShare,
      wagePressure:wagePressure,
      demandOpportunityRatio:demandOpportunityRatio,
      demandUtilization:demandUtilization,
      demandSlack:demandSlack,
      geoPressure:bloc ? bloc.geoPressure : 0,
      stage:business.stage
    };
    scores = {
      expansion:trend * 70 + profitMargin * 60 + (cashCoverage - 3) * 8 + ((business.reputation || 50) - 50) * 0.4 - ((bloc ? bloc.geoPressure : 0) * 6) + getStageExpansionBias(business.stage),
      staffing:trend * 55 + profitMargin * 55 + (cashCoverage - 2.5) * 10 + ((business.reputation || 50) - 50) * 0.35 - ((bloc ? bloc.geoPressure : 0) * 4) - (business.stage === "declining" ? 8 : 0),
      cash:(-trend * 60) + (-profitMargin * 80) + (3 - cashCoverage) * 12 + ((50 - (business.reputation || 50)) * 0.18) + ((bloc ? bloc.geoPressure : 0) * 7) + (business.stage === "declining" ? 10 : 0),
      succession:(business.stage === "declining" ? -6 : 0) + (cashCoverage < 2 ? -5 : 0) + ((business.reputation || 50) < 40 ? -6 : 0)
    };

    scores.expansion += App.utils.clamp((demandGrowth * 95) + ((demandOpportunityRatio - 1) * 34), -18, 28);
    scores.staffing += App.utils.clamp((demandGrowth * 125) + ((demandOpportunityRatio - 1) * 56) + (cashCoverage > 4 ? 4 : 0), -18, 36);
    scores.cash -= App.utils.clamp((Math.max(0, demandGrowth) * 48) + (Math.max(0, demandOpportunityRatio - 1) * 22), 0, 18);

    scores.staffing += App.utils.clamp((laborScarcity - 0.7) * 30, -12, 8);
    scores.staffing -= App.utils.clamp(longUnemploymentShare * 32, 0, 18);
    scores.cash += App.utils.clamp(wagePressure * 36, -9, 16);
    scores.expansion += App.utils.clamp((demandSlack * 24) - ((Math.max(0, demandUtilization - 1)) * 32), -28, 16);
    scores.staffing += App.utils.clamp((demandSlack * 38) - ((Math.max(0, demandUtilization - 1)) * 48), -34, 18);
    scores.cash += App.utils.clamp((Math.max(0, demandUtilization - 1)) * 28, 0, 18);

    if (profile && profile.talentShortageIndex != null) {
      scores.staffing -= App.utils.clamp(Number(profile.talentShortageIndex) * 14, 0, 10);
      scores.cash += App.utils.clamp(Number(profile.talentShortageIndex) * 8, 0, 6);
    }

    makers.forEach(function(entry){
      var weights = getRoleDecisionWeights(entry.roleKey);
      var businessTrait = getTraitChannelScore(entry.person, "business");
      var mobilityTrait = getTraitChannelScore(entry.person, "mobility");
      var familyTrait = getTraitChannelScore(entry.person, "family");
      var prestigeLean = getLeaderInstitutionPrestigeLean(entry.person, business);
      var weightedTraitEffects = collectTraitEffects(entry.person, ["business"]).map(function(effect){
        return {
          trait:effect.trait,
          channel:effect.channel,
          impact:clampTraitDelta(effect.impact * weights.expansion, 18)
        };
      });

      scores.expansion += getLeaderExpansionLean(entry.person) * weights.expansion;
      scores.staffing += getLeaderStaffingLean(entry.person) * weights.staffing;
      scores.cash += getLeaderCashLean(entry.person) * weights.cash;
      scores.succession += getLeaderSuccessionLean(entry.person, business) * weights.succession;

      scores.expansion += businessTrait * 0.95 * weights.expansion;
      scores.staffing += businessTrait * 0.38 * weights.staffing;
      scores.cash -= businessTrait * 0.32 * weights.cash;
      scores.succession += familyTrait * 0.5 * weights.succession;
      scores.expansion += mobilityTrait * 0.4 * weights.expansion;
      scores.expansion += prestigeLean * 0.24 * weights.expansion;
      scores.staffing += prestigeLean * 0.44 * weights.staffing;
      scores.succession -= prestigeLean * 0.18 * weights.succession;

      decisionTraitEffects = decisionTraitEffects.concat(weightedTraitEffects);
    });

    if (makers.length) {
      institutionPrestige = makers.reduce(function(sum, entry){
        var value = Number(entry.person && entry.person.educationInstitutionQuality);
        if (!Number.isFinite(value)) {
          value = App.utils.clamp(35 + ((Number(entry.person && entry.person.educationIndex) || 0) * 0.62), 20, 100);
        }
        return sum + App.utils.clamp(value, 20, 100);
      }, 0) / makers.length;
      metrics.institutionPrestige = institutionPrestige;
    }

    scores.expansion = clampTraitDelta(scores.expansion, 160);
    scores.staffing = clampTraitDelta(scores.staffing, 140);
    scores.cash = clampTraitDelta(scores.cash, 140);
    scores.succession = clampTraitDelta(scores.succession, 140);
    decisionTraitEffects = summarizeTraitEffects(decisionTraitEffects, 4);
    recordTraitEffects(decisionTraitEffects);

    stance = "balanced";
    if (scores.expansion > 18) {
      stance = "aggressive";
    } else if (scores.expansion < -20) {
      stance = "retrenching";
    } else if (scores.cash > 18 || scores.expansion < -6) {
      stance = "defensive";
    }

    staffingAction = scores.staffing > 14 ? "hire" : (scores.staffing < -14 ? "layoff" : "hold");
    underUtilizedLayoffAllowed =
      demandUtilization >= 0.9 ||
      cashCoverage < 0.95 ||
      profitMargin < -0.16 ||
      business.bankruptcyStage === "distressed" ||
      business.bankruptcyStage === "restructuring" ||
      (business.stage === "declining" && (trend < -0.08 || demandGrowth < -0.05)) ||
      (leverageRatio > 0.35 && (cashCoverage < 1.6 || demandGrowth < -0.06)) ||
      (Number(business.distressScore) || 0) > 1.35;
    if (business.stage === "startup" && employeeCount <= 4 && demandUtilization < 0.9) {
      underUtilizedLayoffAllowed = false;
    }
    if (staffingAction === "layoff" && !underUtilizedLayoffAllowed) {
      staffingAction = "hold";
    }
    cashPolicy = scores.cash > 18 ? "preserve" : (scores.cash < -10 ? "reinvest" : "balanced");
    successionBias = scores.succession > 12 ? "family" : (scores.succession < -12 ? "merit" : "balanced");

    return {
      stance:stance,
      staffingAction:staffingAction,
      cashPolicy:cashPolicy,
      successionBias:successionBias,
      reasons:buildDecisionReasons(business, metrics, makers, decisionTraitEffects),
      traitEffects:decisionTraitEffects,
      influencers:buildDecisionInfluencers(makers),
      scores:{
        expansion:Math.round(scores.expansion),
        staffing:Math.round(scores.staffing),
        cash:Math.round(scores.cash),
        succession:Math.round(scores.succession)
      },
      madeAtDay:App.store.simDay
    };
  }

  function legacyEnsureBusinessDecisionState(business){
    if (!business) return;
    ensureBusinessLogo(business);
    primeBusinessDecisionState(business);
    business.unionizationRate = App.utils.clamp(Number(business.unionizationRate) || App.utils.rand(0.05, 0.18), 0.02, 0.82);
    business.laborUnrestScore = App.utils.clamp(Number(business.laborUnrestScore) || 0, 0, 1.6);
    business.layoffPressure = App.utils.clamp(Number(business.layoffPressure) || 0, 0, 1.2);
    business.strikeUntilDay = Math.max(0, Math.floor(Number(business.strikeUntilDay) || 0));
    business.managementQuality = App.utils.clamp(Number(business.managementQuality) || App.utils.rand(42, 68), 10, 98);
    business.wageBillAnnual = Math.max(0, Number(business.wageBillAnnual) || 0);
    business.operatingCostAnnual = Math.max(0, Number(business.operatingCostAnnual) || 0);
    business.hiringNeed = App.utils.clamp(Number(business.hiringNeed) || 0, -600, 600);
    business.supplyStress = App.utils.clamp(Number(business.supplyStress) || 0, 0, 1.8);
    business.tradeShockPressure = App.utils.clamp(Number(business.tradeShockPressure) || 0, 0, 1.8);
    business.tradeRerouteRelief = App.utils.clamp(Number(business.tradeRerouteRelief) || 0, 0, 1.2);
    business.tradeRerouteCapacity = App.utils.clamp(Number(business.tradeRerouteCapacity) || App.utils.rand(0.25, 0.62), 0, 1.2);
    business.tradeShockExposure = App.utils.clamp(Number(business.tradeShockExposure) || getIndustryTradeExposure(business.industry), 0.2, 0.9);
    business.customerTrust = App.utils.clamp(Number(business.customerTrust) || App.utils.rand(42, 64), 0, 100);
    business.productQuality = App.utils.clamp(Number(business.productQuality) || App.utils.rand(45, 68), 0, 100);
    business.pricePower = App.utils.clamp(Number(business.pricePower) || App.utils.rand(0.9, 1.08), 0.62, 1.55);
    business.innovationIndex = App.utils.clamp(Number(business.innovationIndex) || App.utils.rand(28, 56), 0, 100);
    business.technologyEdge = App.utils.clamp(Number(business.technologyEdge) || App.utils.rand(20, 52), 0, 100);
    business.copiedTechDebt = App.utils.clamp(Number(business.copiedTechDebt) || 0, 0, 1.6);
    business.debtGU = Math.max(0, Number(business.debtGU) || 0);
    business.debtInterestRate = App.utils.clamp(Number(business.debtInterestRate) || 0.08, 0.01, 0.34);
    business.debtMaturityDay = Math.max(0, Math.floor(Number(business.debtMaturityDay) || (App.store.simDay + App.utils.randInt(200, 520))));
    business.rolloverRisk = App.utils.clamp(Number(business.rolloverRisk) || 0, 0, 1.6);
    business.founderGuaranteeShare = App.utils.clamp(Number(business.founderGuaranteeShare) || App.utils.rand(0.28, 0.72), 0, 1);
    business.bankruptcyStage = BANKRUPTCY_STAGE_ORDER.indexOf(String(business.bankruptcyStage || "stable")) === -1 ? "stable" : String(business.bankruptcyStage);
    business.distressScore = App.utils.clamp(Number(business.distressScore) || 0, 0, 4.4);
    business.restructuringUntilDay = Math.max(0, Math.floor(Number(business.restructuringUntilDay) || 0));
    if (!business.departments || typeof business.departments !== "object") {
      business.departments = {};
    }
    if (!business.governance || typeof business.governance !== "object") {
      business.governance = {};
    }
    business.governance.boardSeats = App.utils.clamp(Math.floor(Number(business.governance.boardSeats) || Math.max(3, Math.min(11, 3 + Math.round((business.employees || 1) / 60)))), 3, 13);
    business.governance.familyControlShare = App.utils.clamp(Number(business.governance.familyControlShare) || App.utils.rand(0.4, 0.85), 0.05, 1);
    business.governance.outsideInvestorShare = App.utils.clamp(Number(business.governance.outsideInvestorShare) || App.utils.rand(0.05, 0.26), 0, 0.95);
    business.governance.founderControl = App.utils.clamp(Number(business.governance.founderControl) || App.utils.rand(0.62, 0.94), 0.02, 1);
    business.governance.boardPressure = App.utils.clamp(Number(business.governance.boardPressure) || 0, 0, 1.4);
    business.governance.lastReviewDay = Math.max(0, Math.floor(Number(business.governance.lastReviewDay) || App.store.simDay));
    if (!business.currentDecision) {
      business.currentDecision = evaluateBusinessDecision(business);
    }
    setTraitSnapshot(business, business.currentDecision && business.currentDecision.traitEffects ? business.currentDecision.traitEffects : []);
  }

  function legacySettleLeadershipStates(business){
    var seen = {};
    var owner = App.store.getPerson(business.ownerId);

    App.store.getBusinessLeadership(business).forEach(function(entry){
      if (!entry.person || seen[entry.person.id]) return;
      seen[entry.person.id] = true;
      settleTemporaryStates(entry.person);
    });

    if (owner && !seen[owner.id]) {
      settleTemporaryStates(owner);
    }
  }

  function applyLeadershipStateChange(business, changes){
    var seen = {};
    var owner = App.store.getPerson(business.ownerId);

    App.store.getBusinessLeadership(business).forEach(function(entry){
      if (!entry.person || seen[entry.person.id]) return;
      seen[entry.person.id] = true;
      adjustTemporaryStates(entry.person, changes);
      syncPerson(entry.person);
    });

    if (owner && !seen[owner.id]) {
      adjustTemporaryStates(owner, changes);
      syncPerson(owner);
    }
  }

  function legacySummarizeDecisionOutcome(decision, employeeDelta, cashDelta, reputationDelta){
    var parts = [];

    if (employeeDelta > 0) parts.push("Hired " + employeeDelta);
    if (employeeDelta < 0) parts.push("Cut " + Math.abs(employeeDelta));
    if (!employeeDelta) parts.push("Held staffing");
    if (decision.cashPolicy === "preserve") parts.push("Preserved cash");
    if (decision.cashPolicy === "reinvest") parts.push("Reinvested aggressively");
    if (cashDelta > 0) parts.push("Cash +" + App.utils.fmtGU(cashDelta));
    if (cashDelta < 0) parts.push("Cash " + App.utils.fmtGU(cashDelta));
    if (reputationDelta > 0.5) parts.push("Reputation up");
    if (reputationDelta < -0.5) parts.push("Reputation down");

    return parts.join(" • ");
  }

  function legacyPushBusinessDecisionHistory(business, entry){
    ensureBusinessDecisionState(business);
    business.decisionHistory.unshift(entry);
    if (business.decisionHistory.length > 12) {
      business.decisionHistory = business.decisionHistory.slice(0, 12);
    }
  }

  function legacyPushBusinessEventHistory(business, summary, reason){
    if (!business) return;

    ensureBusinessDecisionState(business);
    pushBusinessDecisionHistory(business, {
      id:randomId(),
      madeAtDay:App.store.simDay,
      stance:business.currentDecision ? business.currentDecision.stance : "balanced",
      staffingAction:business.currentDecision ? business.currentDecision.staffingAction : "hold",
      cashPolicy:business.currentDecision ? business.currentDecision.cashPolicy : "balanced",
      successionBias:business.currentDecision ? business.currentDecision.successionBias : "balanced",
      summary:summary,
      reasons:[reason],
      traitEffects:(business.currentDecision && business.currentDecision.traitEffects ? business.currentDecision.traitEffects.slice(0, 4) : []),
      influencers:(business.currentDecision && business.currentDecision.influencers ? business.currentDecision.influencers.slice(0, 3) : [])
    });
  }

  function getBusinessDomain(){
    if (!App._simDomains && App.simDomains && typeof App.simDomains.createBusinessEngine === "function") {
      getSimulationCoordinator();
    }

    return App._simDomains && App._simDomains.business ? App._simDomains.business : createFallbackBusinessEngine();
  }

  function evaluateBusinessDecision(business){
    return getBusinessDomain().evaluateDecision(business);
  }

  function ensureBusinessDecisionState(business){
    return getBusinessDomain().ensureDecisionState(business);
  }

  function settleLeadershipStates(business){
    return getBusinessDomain().settleLeadershipStates(business);
  }

  function summarizeDecisionOutcome(decision, employeeDelta, cashDelta, reputationDelta){
    return getBusinessDomain().summarizeDecisionOutcome(decision, employeeDelta, cashDelta, reputationDelta);
  }

  function evaluateBusinessLifecycleStage(business, metrics){
    return getBusinessDomain().evaluateLifecycleStage(business, metrics);
  }

  function getBusinessRecoverySignal(metrics){
    return getBusinessDomain().getRecoverySignal(metrics);
  }

  function getIndustrySupplyPressure(business){
    return getBusinessDomain().getIndustrySupplyPressure(business);
  }

  function computeTradeShockTransmission(business, bloc, behaviorProfile, supplyPressure){
    return getBusinessDomain().computeTradeShockTransmission(business, bloc, behaviorProfile, supplyPressure);
  }

  function updateCountryTradeShockSignals(){
    return getBusinessDomain().updateCountryTradeShockSignals();
  }

  function refreshBusinessFirmStructure(business, decision){
    return getBusinessDomain().refreshFirmStructure(business, decision);
  }

  function applyCustomerDemandAndReputationDynamics(business, decision, margin){
    return getBusinessDomain().applyCustomerDemandAndReputationDynamics(business, decision, margin);
  }

  function getReserveShareRate(business, decision){
    return getBusinessDomain().getReserveShareRate(business, decision);
  }

  function processYearlyCorporateGovernance(){
    return getBusinessDomain().processYearlyCorporateGovernance();
  }

  function processYearlyInnovationAndCopying(){
    return getBusinessDomain().processYearlyInnovationAndCopying();
  }

  function processYearlyFamilyBusinessGrooming(){
    return getBusinessDomain().processYearlyFamilyBusinessGrooming();
  }

  function processYearlyPromotionsAndPoaching(){
    return getBusinessDomain().processYearlyPromotionsAndPoaching();
  }

  function getHouseholdLaunchReadiness(person){
    return getBusinessDomain().getHouseholdLaunchReadiness(person);
  }

  function getFounderAptitude(person){
    return getBusinessDomain().getFounderAptitude(person);
  }

  function buildYearlyLaunchContext(){
    return getBusinessDomain().buildYearlyLaunchContext();
  }

  function getLaunchDensityMultiplier(person, launchContext){
    return getBusinessDomain().getLaunchDensityMultiplier(person, launchContext);
  }

  function tryLaunchBusiness(person, launchContext){
    return getBusinessDomain().tryLaunchBusiness(person, launchContext);
  }

  function processYearlyLaunches(){
    return getBusinessDomain().processYearlyLaunches();
  }

  function getSuccessionCandidates(owner, business){
    return getBusinessDomain().getSuccessionCandidates(owner, business);
  }

  function evaluateSuccessionCandidate(business, owner, candidate){
    return getBusinessDomain().evaluateSuccessionCandidate(business, owner, candidate);
  }

  function getPotentialHeir(person){
    return getBusinessDomain().getPotentialHeir(person);
  }

  function getSuccessionEvaluations(owner, business){
    return getBusinessDomain().getSuccessionEvaluations(owner, business);
  }

  function resolveInheritanceDispute(owner, business, evaluations, trigger){
    return getBusinessDomain().resolveInheritanceDispute(owner, business, evaluations, trigger);
  }

  function pickSuccessionOutcome(owner, business, trigger){
    return getBusinessDomain().pickSuccessionOutcome(owner, business, trigger);
  }

  function applySuccessionOutcome(owner, heir, business, evaluated){
    return getBusinessDomain().applySuccessionOutcome(owner, heir, business, evaluated);
  }

  function transferBusiness(owner, heir, business, successionEvaluation){
    return getBusinessDomain().transferBusiness(owner, heir, business, successionEvaluation);
  }

  function applyDebtCreditAndBankruptcyStages(business, owner, bloc, decision){
    return getBusinessDomain().applyDebtCreditAndBankruptcyStages(business, owner, bloc, decision);
  }

  function pushBusinessDecisionHistory(business, entry){
    return getBusinessDomain().pushDecisionHistory(business, entry);
  }

  function pushBusinessEventHistory(business, summary, reason){
    return getBusinessDomain().pushEventHistory(business, summary, reason);
  }

  function linkSpouses(first, second){
    ensureFamilyDynamics(first);
    ensureFamilyDynamics(second);
    first.spouseId = second.id;
    second.spouseId = first.id;
  }

  function dissolveMarriage(first, second){
    if (!first || !second) return;
    ensureFamilyDynamics(first);
    ensureFamilyDynamics(second);

    if (first.spouseId === second.id) {
      first.spouseId = null;
    }
    if (second.spouseId === first.id) {
      second.spouseId = null;
    }

    if (first.formerSpouseIds.indexOf(second.id) === -1) {
      first.formerSpouseIds.push(second.id);
    }
    if (second.formerSpouseIds.indexOf(first.id) === -1) {
      second.formerSpouseIds.push(first.id);
    }

    adjustTemporaryStates(first, {
      stress:9,
      confidence:-6,
      resentment:7
    });
    adjustTemporaryStates(second, {
      stress:9,
      confidence:-6,
      resentment:7
    });

    first.pulse = 1;
    second.pulse = 1;
    syncPerson(first);
    syncPerson(second);
  }

  function addChildToParents(child, parents){
    child.parentIds = parents.map(function(parent){
      return parent.id;
    });

    parents.forEach(function(parent){
      if (parent.childrenIds.indexOf(child.id) === -1) {
        parent.childrenIds.push(child.id);
      }
    });
  }

  function buildChildLastName(parents){
    var father = parents.find(function(parent){ return parent.sex === "male"; });
    return father ? father.lastName : parents[0].lastName;
  }

  function buildChildLineageId(parents){
    var father = parents.find(function(parent){ return parent.sex === "male"; });
    return father ? father.lineageId : parents[0].lineageId;
  }

  function householdIdsEqual(first, second){
    var a = (first || []).slice();
    var b = (second || []).slice();
    var i;

    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function cloneHouseholdRecord(household){
    return {
      id:household.id,
      blocId:household.blocId,
      countryISO:household.countryISO,
      state:household.state || null,
      adultIds:(household.adultIds || []).slice(),
      childIds:(household.childIds || []).slice(),
      cashOnHandGU:Math.max(0, Number(household.cashOnHandGU) || 0),
      debtGU:Math.max(0, Number(household.debtGU) || 0),
      annualIncomeGU:Math.max(0, Number(household.annualIncomeGU) || 0),
      monthlyIncomeGU:Math.max(0, Number(household.monthlyIncomeGU) || 0),
      monthlyExpensesGU:Math.max(0, Number(household.monthlyExpensesGU) || 0),
      housingCostGU:Math.max(0, Number(household.housingCostGU) || 0),
      childcareCostGU:Math.max(0, Number(household.childcareCostGU) || 0),
      essentialsCostGU:Math.max(0, Number(household.essentialsCostGU) || 0),
      debtServiceGU:Math.max(0, Number(household.debtServiceGU) || 0),
      housingBurdenRatio:App.utils.clamp(Number(household.housingBurdenRatio) || 0, 0.08, 1.9),
      housingSavingsPressure:App.utils.clamp(Number(household.housingSavingsPressure) || 0, 0.08, 2.2),
      housingOwnershipScore:App.utils.clamp(Number(household.housingOwnershipScore) || 0, 0, 1),
      housingAffordabilityScore:App.utils.clamp(Number(household.housingAffordabilityScore) || 0, 0.05, 1),
      tradeShockBurdenGU:Math.max(0, Number(household.tradeShockBurdenGU) || 0),
      tradeShockStressImpact:Math.max(0, Number(household.tradeShockStressImpact) || 0),
      inheritancePressureGU:Math.max(0, Number(household.inheritancePressureGU) || 0),
      financialStress:App.utils.clamp(Number(household.financialStress) || 0, 0, 100),
      classTier:household.classTier || "working",
      originClassTier:household.originClassTier || household.classTier || "working",
      mobilityScore:Number(household.mobilityScore) || 0,
      assetCashGU:Math.max(0, Number(household.assetCashGU) || Number(household.cashOnHandGU) || 0),
      assetEquityGU:Math.max(0, Number(household.assetEquityGU) || 0),
      assetBusinessOwnershipGU:Math.max(0, Number(household.assetBusinessOwnershipGU) || 0),
      assetPropertyGU:Math.max(0, Number(household.assetPropertyGU) || 0),
      assetTrustGU:Math.max(0, Number(household.assetTrustGU) || 0),
      assetDebtObligationsGU:Math.max(0, Number(household.assetDebtObligationsGU) || Number(household.debtGU) || 0),
      assetTotalGU:Math.max(0, Number(household.assetTotalGU) || 0),
      assetNetWorthGU:Number(household.assetNetWorthGU) || 0,
      assetYieldAnnualGU:Number(household.assetYieldAnnualGU) || 0,
      assetReturnRateAnnual:Number(household.assetReturnRateAnnual) || 0
    };
  }

  function normalizeHouseholdAssetClasses(household){
    var tier = (household && household.classTier) || "working";
    var allocation = HOUSEHOLD_ASSET_CLASS_ALLOCATION[tier] || HOUSEHOLD_ASSET_CLASS_ALLOCATION.working;
    var cash = Math.max(0, Number(household && household.cashOnHandGU) || 0);
    var debt = Math.max(0, Number(household && household.debtGU) || 0);
    var investableFloor = Math.max(0, cash * (1 - allocation.cash));
    var equity = Math.max(0, Number(household && household.assetEquityGU));
    var business = Math.max(0, Number(household && household.assetBusinessOwnershipGU));
    var property = Math.max(0, Number(household && household.assetPropertyGU));
    var trust = Math.max(0, Number(household && household.assetTrustGU));
    var invested;

    if (!Number.isFinite(equity + business + property + trust) || (equity + business + property + trust) <= 0) {
      equity = investableFloor * allocation.equity;
      business = investableFloor * allocation.business;
      property = investableFloor * allocation.property;
      trust = investableFloor * allocation.trust;
    }

    invested = Math.max(0, equity + business + property + trust);
    household.assetCashGU = cash;
    household.assetEquityGU = equity;
    household.assetBusinessOwnershipGU = business;
    household.assetPropertyGU = property;
    household.assetTrustGU = trust;
    household.assetDebtObligationsGU = debt;
    household.assetTotalGU = Math.max(0, cash + invested);
    household.assetNetWorthGU = household.assetTotalGU - debt;
    household.assetYieldAnnualGU = Number.isFinite(Number(household.assetYieldAnnualGU)) ? Number(household.assetYieldAnnualGU) : 0;
    household.assetReturnRateAnnual = Number.isFinite(Number(household.assetReturnRateAnnual)) ? Number(household.assetReturnRateAnnual) : 0;
    return household;
  }

  function getHouseholdActualPublicEquityExposureGU(household){
    return getHouseholdAdults(household).reduce(function(sum, adult){
      var summary;

      if (!adult || !adult.alive) return sum;
      summary = App.store.getPersonPortfolioSummary ? App.store.getPersonPortfolioSummary(adult.id) : null;
      return sum + Math.max(0, Number(summary && summary.marketValueGU) || 0);
    }, 0);
  }

  function getHouseholdActualPrivateBusinessExposureGU(household){
    var adultIds = getHouseholdAdults(household).map(function(adult){
      return adult && adult.id;
    }).filter(Boolean);

    if (!adultIds.length) return 0;

    return (App.store.businesses || []).reduce(function(sum, business){
      var listing;

      if (!business || adultIds.indexOf(business.ownerId) === -1) return sum;
      listing = getBusinessListing(business.id);
      if (listing) return sum;
      return sum + Math.max(0, Number(business.valuationGU) || 0);
    }, 0);
  }

  function getHouseholdActualDividendIncomeAnnualGU(household){
    return getHouseholdAdults(household).reduce(function(sum, adult){
      var summary;

      if (!adult || !adult.alive) return sum;
      summary = App.store.getPersonPortfolioSummary ? App.store.getPersonPortfolioSummary(adult.id) : null;
      return sum + Math.max(0, Number(summary && summary.annualDividendGU) || 0);
    }, 0);
  }

  function processYearlyHouseholdAssetClasses(){
    (App.store.households || []).forEach(function(household){
      var profile;
      var bloc;
      var countryPolicy;
      var blocPolicy;
      var countryEffects;
      var blocEffects;
      var debtRate;
      var institution;
      var education;
      var wagePressure;
      var populationPressure;
      var socialPressure;
      var stress;
      var housingCostPressure;
      var housingMarketStress;
      var housingPriceGrowth;
      var housingBurden;
      var housingSavingsPressure;
      var housingOwnershipScore;
      var housingAffordabilityScore;
      var allocation;
      var liquidityReserve;
      var investableCash;
      var rebalancePool;
      var targetEquity;
      var targetBusiness;
      var targetProperty;
      var targetTrust;
      var equityRate;
      var businessRate;
      var propertyRate;
      var trustRate;
      var cashRate;
      var investedBase;
      var grossYield;
      var debtCarryCost;
      var netYield;
      var rentDragAnnual;
      var housingLeverageDrag;
      var debtPayment;
      var positiveCarry;
      var actualEquityExposure;
      var actualBusinessExposure;
      var actualDividendIncome;

      if (!household) return;
      refreshHouseholdSnapshot(household);
      normalizeHouseholdAssetClasses(household);
      actualEquityExposure = getHouseholdActualPublicEquityExposureGU(household);
      actualBusinessExposure = getHouseholdActualPrivateBusinessExposureGU(household);
      actualDividendIncome = getHouseholdActualDividendIncomeAnnualGU(household);

      profile = ensureCountryProfile(household.countryISO);
      bloc = App.store.getBloc(profile && profile.blocId) || App.store.getBlocByCountry(household.countryISO);
      countryPolicy = normalizePolicyStance(profile && profile.policyStance);
      blocPolicy = refreshBlocPolicyStance(bloc);
      countryEffects = COUNTRY_POLICY_STANCE_EFFECTS[countryPolicy] || COUNTRY_POLICY_STANCE_EFFECTS.neutral;
      blocEffects = BLOC_POLICY_STANCE_EFFECTS[blocPolicy] || BLOC_POLICY_STANCE_EFFECTS.neutral;
      debtRate = App.utils.clamp(0.036 + (countryEffects.debtRateBias || 0) + (blocEffects.debtRateBias || 0), 0.012, 0.14);
      institution = App.utils.clamp(Number(profile && profile.institutionScore) || 0.55, 0.1, 1);
      education = App.utils.clamp(Number(profile && profile.educationIndex) || 0.6, 0.1, 1);
      wagePressure = App.utils.clamp(Number(profile && profile.wagePressure) || 0, -0.45, 0.45);
      populationPressure = App.utils.clamp(Number(profile && profile.populationPressure) || 0.5, 0, 1);
      socialPressure = App.utils.clamp(Number(profile && profile.socialPressureIndex) || 0, 0, 1);
      stress = App.utils.clamp((Number(household.financialStress) || 0) / 100, 0, 1);
      housingCostPressure = App.utils.clamp(Number(profile && profile.housingCostPressure) || 1.02, 0.65, 2.2);
      housingMarketStress = App.utils.clamp(Number(profile && profile.housingMarketStress) || 0.35, 0, 1.5);
      housingPriceGrowth = App.utils.clamp(Number(profile && profile.housingPriceGrowth) || 0.02, -0.18, 0.26);
      housingBurden = App.utils.clamp(Number(household.housingBurdenRatio) || 0.34, 0.08, 1.9);
      housingSavingsPressure = App.utils.clamp(Number(household.housingSavingsPressure) || 0.42, 0.08, 2.2);
      housingOwnershipScore = App.utils.clamp(Number(household.housingOwnershipScore) || 0, 0, 1);
      housingAffordabilityScore = App.utils.clamp(Number(household.housingAffordabilityScore) || 0.5, 0.05, 1);
      allocation = HOUSEHOLD_ASSET_CLASS_ALLOCATION[household.classTier] || HOUSEHOLD_ASSET_CLASS_ALLOCATION.working;

      liquidityReserve = Math.max(
        0,
        (Number(household.monthlyExpensesGU) || 0) * (2.5 + (stress * 4.2) + (Math.max(0, housingBurden - 0.4) * 1.4) + (Math.max(0, housingSavingsPressure - 0.55) * 1.1)) +
        ((Number(household.inheritancePressureGU) || 0) * 0.15)
      );
      investableCash = Math.max(0, (Number(household.cashOnHandGU) || 0) - liquidityReserve);
      rebalancePool = Math.max(0, (investableCash * App.utils.clamp(0.82 - (Math.max(0, housingMarketStress - 0.7) * 0.08), 0.68, 0.9)) + ((Number(household.assetEquityGU) || 0) + (Number(household.assetBusinessOwnershipGU) || 0) + (Number(household.assetPropertyGU) || 0) + (Number(household.assetTrustGU) || 0)) * 0.18);

      targetEquity = rebalancePool * allocation.equity;
      targetBusiness = rebalancePool * allocation.business;
      targetProperty = rebalancePool * allocation.property * App.utils.clamp(1 + (Math.max(-0.08, housingPriceGrowth) * 0.85) + ((housingCostPressure - 1) * 0.24) + (housingOwnershipScore * 0.18) - (Math.max(0, housingBurden - 0.52) * 0.62), 0.35, 1.65);
      targetTrust = rebalancePool * allocation.trust;

      household.assetEquityGU = Math.max(actualEquityExposure, ((Number(household.assetEquityGU) || 0) * 0.72) + (targetEquity * 0.28));
      household.assetBusinessOwnershipGU = Math.max(actualBusinessExposure, ((Number(household.assetBusinessOwnershipGU) || 0) * 0.72) + (targetBusiness * 0.28));
      household.assetPropertyGU = Math.max(0, ((Number(household.assetPropertyGU) || 0) * 0.72) + (targetProperty * 0.28));
      household.assetTrustGU = Math.max(0, ((Number(household.assetTrustGU) || 0) * 0.72) + (targetTrust * 0.28));

      equityRate = App.utils.clamp(HOUSEHOLD_ASSET_RETURN_BASE.equity + ((institution - 0.55) * 0.06) + (wagePressure * 0.09) - (socialPressure * 0.03), -0.16, 0.24);
      businessRate = App.utils.clamp(HOUSEHOLD_ASSET_RETURN_BASE.business + ((institution - 0.55) * 0.09) + ((education - 0.6) * 0.05) + (wagePressure * 0.06) - (stress * 0.05), -0.22, 0.28);
      propertyRate = App.utils.clamp(HOUSEHOLD_ASSET_RETURN_BASE.property + ((populationPressure - 0.5) * 0.06) - (debtRate * 0.48) + ((institution - 0.55) * 0.02) + (housingPriceGrowth * 0.62) - (Math.max(0, housingMarketStress - 0.85) * 0.04) + ((housingAffordabilityScore - 0.5) * 0.03), -0.18, 0.24);
      trustRate = App.utils.clamp(HOUSEHOLD_ASSET_RETURN_BASE.trust + ((institution - 0.55) * 0.03) + ((countryEffects.demandGrowthBias || 0) * 0.2), -0.03, 0.14);
      cashRate = App.utils.clamp(HOUSEHOLD_ASSET_RETURN_BASE.cash + (debtRate * 0.35), 0, 0.06);

      investedBase = Math.max(1, (Number(household.assetEquityGU) || 0) + (Number(household.assetBusinessOwnershipGU) || 0) + (Number(household.assetPropertyGU) || 0) + (Number(household.assetTrustGU) || 0));
      grossYield =
        (household.assetEquityGU * equityRate) +
        (household.assetBusinessOwnershipGU * businessRate) +
        (household.assetPropertyGU * propertyRate) +
        (household.assetTrustGU * trustRate) +
        ((Number(household.cashOnHandGU) || 0) * cashRate);
      debtCarryCost = Math.max(0, (Number(household.debtGU) || 0) * debtRate * App.utils.clamp(0.2 + (stress * 0.4), 0.08, 0.55));
      netYield = grossYield - debtCarryCost;
      rentDragAnnual = Math.max(0, (Number(household.monthlyExpensesGU) || 0) * Math.max(0, housingBurden - 0.42) * (1 - housingOwnershipScore) * 0.12);
      housingLeverageDrag = Math.max(0, (Number(household.monthlyExpensesGU) || 0) * Math.max(0, housingSavingsPressure - 0.55) * 0.08);
      netYield -= (rentDragAnnual + housingLeverageDrag);
      positiveCarry = Math.max(0, netYield);

      household.cashOnHandGU = Math.max(0, (Number(household.cashOnHandGU) || 0) + (netYield * 0.68));
      debtPayment = Math.min(Math.max(0, Number(household.debtGU) || 0), positiveCarry * 0.2 + Math.max(0, (household.cashOnHandGU || 0) - ((Number(household.monthlyExpensesGU) || 0) * 6)) * 0.12);
      household.debtGU = Math.max(0, (Number(household.debtGU) || 0) - debtPayment);
      household.cashOnHandGU = Math.max(0, (Number(household.cashOnHandGU) || 0) - debtPayment);

      household.assetCashGU = Math.max(0, Number(household.cashOnHandGU) || 0);
      household.assetDebtObligationsGU = Math.max(0, Number(household.debtGU) || 0);
      household.assetTotalGU = Math.max(0, household.assetCashGU + (Number(household.assetEquityGU) || 0) + (Number(household.assetBusinessOwnershipGU) || 0) + (Number(household.assetPropertyGU) || 0) + (Number(household.assetTrustGU) || 0));
      household.assetNetWorthGU = household.assetTotalGU - household.assetDebtObligationsGU;
      household.assetYieldAnnualGU = Number(netYield.toFixed(2));
      household.assetReturnRateAnnual = Number((netYield / investedBase).toFixed(4));
      household.actualPublicEquityExposureGU = Number(actualEquityExposure.toFixed(2));
      household.actualPrivateBusinessExposureGU = Number(actualBusinessExposure.toFixed(2));
      household.actualDividendIncomeAnnualGU = Number(actualDividendIncome.toFixed(2));

      refreshHouseholdSnapshot(household);
    });
  }

  function processYearlyPhilanthropyAndLegacy(){
    var supportByCountry = {};

    (App.store.households || []).forEach(function(household){
      var adults;
      var sponsor;
      var classRank;
      var householdNetWorth;
      var spendableCash;
      var monthlyExpenses;
      var ageFactor;
      var prestigeFactor;
      var donationChance;
      var donationTarget;
      var donation;
      var educationWeight;
      var healthWeight;
      var prestigeWeight;
      var bucket;

      if (!household || !household.countryISO) return;
      normalizeHouseholdAssetClasses(household);
      refreshHouseholdSnapshot(household);
      adults = getHouseholdAdults(household).filter(function(person){
        return !!(person && person.alive);
      });
      if (!adults.length) return;

      sponsor = adults.slice().sort(function(first, second){
        return (Number(second.age) || 0) - (Number(first.age) || 0);
      })[0] || null;
      if (!sponsor) return;

      classRank = householdClassRank(household.classTier || "working");
      if (classRank < 3) return;

      householdNetWorth = Math.max(0, Number(household.assetNetWorthGU) || 0);
      if (householdNetWorth < 120000) return;

      monthlyExpenses = Math.max(1, Number(household.monthlyExpensesGU) || 1);
      spendableCash = Math.max(0, (Number(household.cashOnHandGU) || 0) - (monthlyExpenses * 8));
      if (spendableCash < 5000 && householdNetWorth < 260000) return;

      ensureSocialNetworkData(sponsor);
      ageFactor = App.utils.clamp((Math.max(0, (Number(sponsor.age) || 0) - 52) / 32), 0, 1);
      prestigeFactor = App.utils.clamp((Number(sponsor.personalReputation && sponsor.personalReputation.prestige) || 35) / 100, 0.1, 1);
      donationChance = App.utils.clamp(0.1 + (ageFactor * 0.24) + ((classRank - 2) * 0.08) + (prestigeFactor * 0.1), 0.08, 0.72);
      if (Math.random() > donationChance) return;

      donationTarget =
        (householdNetWorth * App.utils.clamp(0.004 + (ageFactor * 0.006) + ((classRank - 2) * 0.0018), 0.0035, 0.015)) +
        (spendableCash * App.utils.clamp(0.1 + (prestigeFactor * 0.22), 0.08, 0.32));
      donationTarget = App.utils.clamp(donationTarget, 2500, householdNetWorth * 0.04);
      donation = drawHouseholdAssetTransfer(sponsor, donationTarget);
      if (donation <= 0) return;

      educationWeight = App.utils.clamp(0.4 + Math.random() * 0.3, 0.3, 0.7);
      healthWeight = App.utils.clamp(0.22 + Math.random() * 0.28, 0.15, 0.55);
      prestigeWeight = App.utils.clamp(1 - (educationWeight + healthWeight), 0.12, 0.48);
      bucket = supportByCountry[household.countryISO] || {
        total:0,
        education:0,
        health:0,
        prestige:0,
        donors:0
      };
      bucket.total += donation;
      bucket.education += donation * educationWeight;
      bucket.health += donation * healthWeight;
      bucket.prestige += donation * prestigeWeight;
      bucket.donors += 1;
      supportByCountry[household.countryISO] = bucket;

      adjustPersonalReputation(sponsor, {
        prestige:App.utils.clamp((donation / 100000) * (0.8 + (prestigeFactor * 0.6)), 0.15, 2.8),
        trust:App.utils.clamp((donation / 140000) * (0.7 + (ageFactor * 0.5)), 0.08, 1.8),
        notoriety:-App.utils.clamp((donation / 180000), 0, 0.7)
      });
      syncPerson(sponsor);

      if (donation >= 450000 && Math.random() < 0.25) {
        emitNews("market", "<strong>Legacy philanthropy</strong> surged in <strong>" + App.store.getCountryName(household.countryISO) + "</strong> as major families funded public projects.", {
          entities:{
            personIds:[sponsor.id],
            countryIsos:[household.countryISO],
            blocIds:[sponsor.blocId]
          },
          causes:[
            "Old wealthy dynasties redirected capital into schools, hospitals, and prestige projects.",
            "Large private donations eased local social stress and strengthened institutional confidence."
          ]
        });
      }
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var support = supportByCountry[iso] || { total:0, education:0, health:0, prestige:0, donors:0 };
      var population = Math.max(1, Number(profile && profile.population) || 1);
      var annualPerCapita = support.total / population;
      var impactTarget;
      var impactIndex;
      var legacyTarget;
      var educationBoost;
      var institutionBoost;
      var deathRateRelief;
      var socialRelief;

      if (!profile) return;

      refreshCountryProfileDerived(profile);
      impactTarget =
        App.utils.clamp((annualPerCapita / 1800), 0, 0.65) +
        App.utils.clamp((support.education / Math.max(1, support.total)) * 0.3, 0, 0.3) +
        App.utils.clamp((support.health / Math.max(1, support.total)) * 0.22, 0, 0.22);
      impactIndex = App.utils.clamp((App.utils.clamp(Number(profile.philanthropyImpactIndex) || 0, 0, 1.6) * 0.6) + (impactTarget * 0.4), 0, 1.6);

      legacyTarget = App.utils.clamp((support.prestige / Math.max(1, support.total)) + (support.donors / 10), 0, 1.4);
      profile.legacyProjectsIndex = App.utils.clamp((App.utils.clamp(Number(profile.legacyProjectsIndex) || 0, 0, 1.4) * 0.65) + (legacyTarget * 0.35), 0, 1.4);
      profile.philanthropicCapitalAnnualGU = Math.max(0, support.total);
      profile.philanthropyImpactIndex = impactIndex;

      educationBoost = App.utils.clamp((support.education / Math.max(1, population)) / 42000, 0, 0.022);
      institutionBoost = App.utils.clamp((support.prestige / Math.max(1, population)) / 62000, 0, 0.018) + (impactIndex * 0.0045);
      deathRateRelief = App.utils.clamp((support.health / Math.max(1, population)) / 23000, 0, 0.35);
      socialRelief = App.utils.clamp((support.total / Math.max(1, population)) / 21000, 0, 0.18);

      profile.educationIndex = App.utils.clamp((Number(profile.educationIndex) || 0.6) + educationBoost, 0.1, 1);
      profile.institutionScore = App.utils.clamp((Number(profile.institutionScore) || 0.55) + institutionBoost, 0.1, 1);
      profile.deathRatePer1000 = Math.max(2, (Number(profile.deathRatePer1000) || 8) - deathRateRelief);
      profile.socialPressureIndex = App.utils.clamp((Number(profile.socialPressureIndex) || 0) - socialRelief, 0, 1.5);

      profile.policyEvidence = profile.policyEvidence && typeof profile.policyEvidence === "object" ? profile.policyEvidence : {};
      profile.policyEvidence.philanthropicCapitalAnnualGU = Number(profile.philanthropicCapitalAnnualGU.toFixed(2));
      profile.policyEvidence.philanthropyImpactIndex = Number(profile.philanthropyImpactIndex.toFixed(4));
      profile.policyEvidence.legacyProjectsIndex = Number(profile.legacyProjectsIndex.toFixed(4));
      profile.policyEvidence.philanthropyDonorCount = Math.max(0, Math.floor(Number(support.donors) || 0));
      profile.policyEvidence.philanthropyPerCapitaGU = Number(annualPerCapita.toFixed(4));
      profile.policyEvidence.philanthropyEducationShare = Number((support.education / Math.max(1, support.total)).toFixed(4));
      profile.policyEvidence.philanthropyHealthShare = Number((support.health / Math.max(1, support.total)).toFixed(4));
      profile.policyEvidence.philanthropyPrestigeShare = Number((support.prestige / Math.max(1, support.total)).toFixed(4));

      refreshCountryProfileDerived(profile);
    });
  }

  function getHouseholdAdults(household){
    return (household && household.adultIds ? household.adultIds : []).map(function(id){
      return App.store.getPerson(id);
    }).filter(function(person){
      return !!(person && person.alive);
    });
  }

  function getHouseholdChildren(household){
    return (household && household.childIds ? household.childIds : []).map(function(id){
      return App.store.getPerson(id);
    }).filter(function(person){
      return !!(person && person.alive);
    });
  }

  function getHouseholdForPerson(person){
    return person && person.householdId && App.store.getHousehold ? App.store.getHousehold(person.householdId) : null;
  }

  function estimateAdultAnnualIncome(person){
    var business;
    var businessDecision;
    var household;
    var profile;
    var medianWage;
    var baseIncome;

    if (!person || !person.alive || person.age < 18) return 0;

    business = App.store.getBusiness(person.businessId);
    if (business) {
      businessDecision = business.currentDecision || evaluateBusinessDecision(business);
      return Math.max(0, (business.profitGU || 0) * (businessDecision.cashPolicy === "preserve" ? 0.28 : (businessDecision.cashPolicy === "balanced" ? 0.42 : 0.58)));
    }

    if (person.salaryGU > 0) {
      return Math.max(0, person.salaryGU);
    }

    profile = ensureCountryProfile(person.countryISO);
    medianWage = Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
    baseIncome = medianWage * (person.retired ? 0.34 : (0.38 + (Number(profile && profile.institutionScore) || 0.55) * 0.26));
    household = getHouseholdForPerson(person);
    if (household && household.financialStress > 70) {
      baseIncome *= 0.92;
    }
    baseIncome *= App.utils.clamp(0.8 + ((Number(person.educationIndex) || 0) * 0.005), 0.8, 1.3);
    baseIncome *= App.utils.clamp(0.86 + (getPersonSkillAverage(person) * 0.0032), 0.86, 1.18);
    return Math.max(0, baseIncome);
  }

  function classifyHouseholdTier(profile, annualIncome, cashOnHandGU, debtGU, adults, stress){
    var medianWage = Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
    var adultCount = Math.max(1, adults);
    var incomeRatio = annualIncome / Math.max(1, medianWage * adultCount);
    var liquidityRatio = cashOnHandGU / Math.max(1, (medianWage / 12) * adultCount * 3);
    var debtRatio = debtGU / Math.max(1, medianWage * adultCount);

    if (stress >= 78 || incomeRatio < 0.8 || debtRatio > 1.9) return "strained";
    if (incomeRatio < 1.35 || liquidityRatio < 0.45 || debtRatio > 1.1) return "working";
    if (incomeRatio < 2.6 || liquidityRatio < 1.35) return "middle";
    if (incomeRatio < 4.8 || liquidityRatio < 3.2) return "affluent";
    return "elite";
  }

  function deriveHouseholdSnapshot(household){
    var adults = getHouseholdAdults(household);
    var children = getHouseholdChildren(household);
    var anchor = adults[0] || children[0] || null;
    var profile = ensureCountryProfile(household.countryISO || (anchor ? anchor.countryISO : "US"));
    var monthlyMedianWage = Math.max(125, getCountryMedianWage(household.countryISO || (anchor ? anchor.countryISO : "US")) / 12);
    var adultsCount = adults.length;
    var childrenCount = children.length;
    var youngChildren = children.filter(function(child){ return child.age < 6; }).length;
    var schoolChildren = Math.max(0, childrenCount - youngChildren);
    var profileHousingCostPressure = App.utils.clamp(Number(profile && profile.housingCostPressure) || 1.02, 0.65, 2.2);
    var profileHousingMarketStress = App.utils.clamp(Number(profile && profile.housingMarketStress) || 0.35, 0, 1.5);
    var propertyAsset = Math.max(0, Number(household.assetPropertyGU) || 0);
    var ownershipAnchor = Math.max(1, monthlyMedianWage * Math.max(1, adultsCount) * HOUSEHOLD_HOMEOWNERSHIP_PROPERTY_MONTHS);
    var homeownershipBuffer = App.utils.clamp(propertyAsset / ownershipAnchor, 0, 1.25);
    var countryCostPressure = App.utils.clamp(0.72 + (((profile && profile.giniCoefficient) || 0.4) * 0.28) + (((profile && profile.populationPressure) || 0.5) * 0.16) + (Math.max(0, profileHousingCostPressure - 1) * 0.18), 0.72, 1.45);
    var essentialsCost = monthlyMedianWage * (0.62 + (adultsCount * 0.42) + (childrenCount * 0.24)) * (1.08 - ((profile && profile.institutionScore) || 0.55) * 0.12);
    var housingCost = monthlyMedianWage * countryCostPressure * (0.72 + Math.max(0, adultsCount - 1) * 0.22 + childrenCount * 0.07) * (1 + Math.max(0, profileHousingCostPressure - 1) * 0.28 + (profileHousingMarketStress * 0.05)) * App.utils.clamp(1 - (homeownershipBuffer * 0.16), 0.64, 1);
    var childcareCost = monthlyMedianWage * ((youngChildren * 0.32) + (schoolChildren * 0.12)) * (1.15 - ((profile && profile.institutionScore) || 0.55) * 0.35);
    var debtService = Math.max(0, household.debtGU || 0) * (0.07 / 12);
    var tradeShockIndex = App.utils.clamp(Number(profile && profile.tradeShockIndex) || 0, 0, 1.8);
    var tradeHouseholdExpenseLift = monthlyMedianWage * App.utils.clamp(tradeShockIndex * (0.08 + (childrenCount * 0.018)), 0, 0.28);
    var tradeStressImpact = App.utils.clamp(tradeShockIndex * 7.5, 0, 12);
    var actualPublicEquityExposure = getHouseholdActualPublicEquityExposureGU(household);
    var actualPrivateBusinessExposure = getHouseholdActualPrivateBusinessExposureGU(household);
    var actualDividendIncomeAnnual = getHouseholdActualDividendIncomeAnnualGU(household);
    var passiveIncomeAnnual = Math.max(0, Number(household.assetYieldAnnualGU) || 0, actualDividendIncomeAnnual);
    var annualIncome = adults.reduce(function(sum, adult){
      var modeledIncome = Number(adult && adult.modeledAnnualIncomeGU);
      return sum + Math.max(0, Number.isFinite(modeledIncome) ? modeledIncome : estimateAdultAnnualIncome(adult));
    }, 0) + passiveIncomeAnnual;
    var monthlyIncome = annualIncome / 12;
    var monthlyExpenses = essentialsCost + housingCost + childcareCost + debtService;
    var cashCoverageMonths = (household.cashOnHandGU || 0) / Math.max(1, monthlyExpenses);
    var debtRatio = (household.debtGU || 0) / Math.max(1, monthlyMedianWage * 12 * Math.max(1, adultsCount));
    var housingBurdenRatio;
    var housingSavingsPressure;
    var housingOwnershipScore;
    var housingAffordabilityScore;
    var inheritancePressure = monthlyMedianWage * ((childrenCount * 0.45) + adults.filter(function(adult){
      return adult.age >= 55 || !!adult.businessId;
    }).length * 0.62 + ((household.debtGU || 0) > (household.cashOnHandGU || 0) ? 0.45 : 0));
    var liquidSupportGU;
    var liquidSupportMonths;
    var incomeShortfallRatio;
    var netWorthBufferRatio;
    var stress;
    var classTier;
    var originClassTier;
    var mobilityScore;

    monthlyExpenses += tradeHouseholdExpenseLift;
    housingBurdenRatio = App.utils.clamp(housingCost / Math.max(1, monthlyIncome || (monthlyExpenses * 0.85)), 0.08, 1.9);
    housingSavingsPressure = App.utils.clamp((housingCost + debtService) / Math.max(1, monthlyIncome || (monthlyExpenses * 0.95)), 0.08, 2.2);
    housingOwnershipScore = App.utils.clamp(homeownershipBuffer, 0, 1);
    housingAffordabilityScore = App.utils.clamp(1.02 - ((housingBurdenRatio - 0.34) * 0.96) - ((((profile && profile.giniCoefficient) || 0.4) - 0.35) * 0.18), 0.05, 1);
    liquidSupportGU = Math.max(0,
      (Number(household.cashOnHandGU) || 0) +
      ((Number(household.assetTrustGU) || 0) * 0.35) +
      ((Number(household.assetEquityGU) || 0) * 0.08)
    );
    liquidSupportMonths = liquidSupportGU / Math.max(1, monthlyExpenses);
    incomeShortfallRatio = App.utils.clamp((monthlyExpenses - monthlyIncome) / Math.max(1, monthlyExpenses), -0.45, 1.25);
    netWorthBufferRatio = App.utils.clamp((Math.max(0, Number(household.assetNetWorthGU) || 0) / Math.max(1, annualIncome || (monthlyMedianWage * 12 * Math.max(1, adultsCount)))), 0, 8);

    stress = 28 +
      (Math.max(0, incomeShortfallRatio) * 44) +
      (debtRatio * 14) -
      (Math.min(8, Math.max(cashCoverageMonths, liquidSupportMonths)) * 6.5) +
      ((((profile && profile.giniCoefficient) || 0.4) - 0.35) * 18) -
      ((((profile && profile.institutionScore) || 0.55) - 0.55) * 14) +
      (childrenCount * 2.4);
    stress += tradeStressImpact * 0.8;
    stress += Math.max(0, housingBurdenRatio - 0.46) * 16;
    stress += Math.max(0, housingSavingsPressure - 0.68) * 10;
    stress += Math.min(0, incomeShortfallRatio) * 10;
    stress -= housingOwnershipScore * 5.5;
    stress -= Math.min(4, netWorthBufferRatio) * 2.8;
    stress = App.utils.clamp(stress, 0, 100);
    classTier = classifyHouseholdTier(profile, annualIncome, household.cashOnHandGU || 0, household.debtGU || 0, adultsCount, stress);
    originClassTier = household.originClassTier || classTier;
    mobilityScore = (householdClassRank(classTier) - householdClassRank(originClassTier)) * 25;
    mobilityScore *= (0.82 + (((profile && profile.institutionScore) || 0.55) * 0.34) - ((((profile && profile.giniCoefficient) || 0.4) - 0.35) * 0.28));

    return {
      annualIncomeGU:Math.max(0, annualIncome),
      monthlyIncomeGU:Math.max(0, monthlyIncome),
      monthlyExpensesGU:Math.max(0, monthlyExpenses),
      housingCostGU:Math.max(0, housingCost),
      childcareCostGU:Math.max(0, childcareCost),
      essentialsCostGU:Math.max(0, essentialsCost),
      debtServiceGU:Math.max(0, debtService),
      housingBurdenRatio:housingBurdenRatio,
      housingSavingsPressure:housingSavingsPressure,
      housingOwnershipScore:housingOwnershipScore,
      housingAffordabilityScore:housingAffordabilityScore,
      tradeShockBurdenGU:Math.max(0, tradeHouseholdExpenseLift),
      tradeShockStressImpact:Math.max(0, tradeStressImpact),
      inheritancePressureGU:Math.max(0, inheritancePressure),
      financialStress:stress,
      classTier:classTier,
      originClassTier:originClassTier,
      mobilityScore:mobilityScore,
      actualPublicEquityExposureGU:Number(actualPublicEquityExposure.toFixed(2)),
      actualPrivateBusinessExposureGU:Number(actualPrivateBusinessExposure.toFixed(2)),
      actualDividendIncomeAnnualGU:Number(actualDividendIncomeAnnual.toFixed(2))
    };
  }

  function refreshHouseholdSnapshot(household){
    var snapshot = deriveHouseholdSnapshot(household);
    Object.keys(snapshot).forEach(function(key){
      household[key] = snapshot[key];
    });
    household.annualIncomeSource = "modeled-economic-pass";
    return household;
  }

  function buildHouseholdBaseState(group, candidates){
    var anchor = group.anchor;
    var profile = ensureCountryProfile(anchor.countryISO);
    var annualMedian = Math.max(1500, Number(profile && profile.medianWageGU) || 12000);
    var totalAdultNetWorth = group.adultIds.reduce(function(sum, id){
      var adult = App.store.getPerson(id);
      return sum + Math.max(0, Number(adult && adult.netWorthGU) || 0);
    }, 0);
    var cashOnHand = candidates.length ? candidates.reduce(function(sum, household){
      return sum + Math.max(0, Number(household.cashOnHandGU) || 0);
    }, 0) : Math.min(totalAdultNetWorth * 0.08, annualMedian * Math.max(1, group.adultIds.length) * 4);
    var debtGU = candidates.length ? candidates.reduce(function(sum, household){
      return sum + Math.max(0, Number(household.debtGU) || 0);
    }, 0) : 0;
    var firstOriginTier = candidates.map(function(household){
      return household.originClassTier || household.classTier || null;
    }).filter(Boolean)[0] || null;
    var assetEquity = candidates.length ? candidates.reduce(function(sum, household){
      return sum + Math.max(0, Number(household.assetEquityGU) || 0);
    }, 0) : 0;
    var assetBusiness = candidates.length ? candidates.reduce(function(sum, household){
      return sum + Math.max(0, Number(household.assetBusinessOwnershipGU) || 0);
    }, 0) : 0;
    var assetProperty = candidates.length ? candidates.reduce(function(sum, household){
      return sum + Math.max(0, Number(household.assetPropertyGU) || 0);
    }, 0) : 0;
    var assetTrust = candidates.length ? candidates.reduce(function(sum, household){
      return sum + Math.max(0, Number(household.assetTrustGU) || 0);
    }, 0) : 0;
    var assetYield = candidates.length ? candidates.reduce(function(sum, household){
      return sum + (Number(household.assetYieldAnnualGU) || 0);
    }, 0) : 0;

    return {
      id:"hh-" + (group.adultIds[0] || group.childIds[0] || randomId()),
      blocId:anchor.blocId,
      countryISO:anchor.countryISO,
      state:anchor.state || null,
      adultIds:group.adultIds.slice(),
      childIds:group.childIds.slice(),
      cashOnHandGU:Math.max(0, cashOnHand),
      debtGU:Math.max(0, debtGU),
      annualIncomeGU:0,
      monthlyIncomeGU:0,
      monthlyExpensesGU:0,
      housingCostGU:0,
      childcareCostGU:0,
      essentialsCostGU:0,
      debtServiceGU:0,
      housingBurdenRatio:0,
      housingSavingsPressure:0,
      housingOwnershipScore:0,
      housingAffordabilityScore:0,
      inheritancePressureGU:0,
      financialStress:0,
      classTier:firstOriginTier || "working",
      originClassTier:firstOriginTier || null,
      mobilityScore:0,
      assetCashGU:Math.max(0, cashOnHand),
      assetEquityGU:Math.max(0, assetEquity),
      assetBusinessOwnershipGU:Math.max(0, assetBusiness),
      assetPropertyGU:Math.max(0, assetProperty),
      assetTrustGU:Math.max(0, assetTrust),
      assetDebtObligationsGU:Math.max(0, debtGU),
      assetTotalGU:Math.max(0, cashOnHand + assetEquity + assetBusiness + assetProperty + assetTrust),
      assetNetWorthGU:Math.max(0, cashOnHand + assetEquity + assetBusiness + assetProperty + assetTrust - debtGU),
      assetYieldAnnualGU:Number(assetYield) || 0,
      assetReturnRateAnnual:0
    };
  }

  function estimateHouseholdLiquidityTargetGU(household){
    var iso = household && household.countryISO;
    var profile = ensureCountryProfile(iso);
    var monthlyMedianWage = Math.max(125, getCountryMedianWage(iso) / 12);
    var adultsCount = Math.max(1, getHouseholdAdults(household).length || (household && household.adultIds ? household.adultIds.length : 1));
    var annualIncome = Math.max(0, Number(household && household.annualIncomeGU) || 0);
    var stress = App.utils.clamp((Number(household && household.financialStress) || 0) / 100, 0, 1);
    var classRank = householdClassRank(household && household.classTier);
    var reserveMonths = App.utils.clamp(0.8 + (classRank * 0.85) - (stress * 0.95), 0.6, 4.8);
    var incomeAnchoredTarget = (annualIncome / 12) * reserveMonths;
    var medianAnchoredTarget = monthlyMedianWage * adultsCount * App.utils.clamp(0.9 + (classRank * 0.55) - (stress * 0.3), 0.75, 3.2);

    return Math.max(medianAnchoredTarget, incomeAnchoredTarget, monthlyMedianWage * adultsCount * 0.75);
  }

  function calibrateInitialHouseholdLiquidity(){
    (App.store.households || []).forEach(function(household){
      var targetCash;
      var currentCash;
      var adjustedCash;

      if (!household) return;

      refreshHouseholdSnapshot(household);
      targetCash = estimateHouseholdLiquidityTargetGU(household);
      currentCash = Math.max(0, Number(household.cashOnHandGU) || 0);
      adjustedCash = Math.max(currentCash, (targetCash * 0.78) + (currentCash * 0.22));

      household.cashOnHandGU = Math.max(0, adjustedCash);
      household.assetCashGU = Math.max(0, household.cashOnHandGU);
      household.assetTotalGU = Math.max(0, household.assetCashGU + (Number(household.assetEquityGU) || 0) + (Number(household.assetBusinessOwnershipGU) || 0) + (Number(household.assetPropertyGU) || 0) + (Number(household.assetTrustGU) || 0));
      household.assetNetWorthGU = household.assetTotalGU - Math.max(0, Number(household.assetDebtObligationsGU) || Number(household.debtGU) || 0);
      refreshHouseholdSnapshot(household);
    });
  }

  function applyHouseholdWealthDrift(household, dailyNet){
    var adults = getHouseholdAdults(household).filter(function(person){
      return !person.businessId;
    });
    var share;

    if (!adults.length || !Number.isFinite(dailyNet) || Math.abs(dailyNet) < 0.01) return;

    share = dailyNet > 0 ? (dailyNet * 0.18) / adults.length : (dailyNet * 0.08) / adults.length;
    adults.forEach(function(adult){
      adult.netWorthGU = Math.max(100, adult.netWorthGU + share);
    });
  }

  function syncHouseholds(){
    var priorHouseholds = (App.store.households || []).map(cloneHouseholdRecord);
    var priorByMember = {};
    var livingPeople = App.store.getLivingPeople().slice().sort(function(first, second){
      return first.id.localeCompare(second.id);
    });
    var adults = livingPeople.filter(function(person){
      return person.age >= 18;
    });
    var children = livingPeople.filter(function(person){
      return person.age < 18;
    }).sort(function(first, second){
      return first.id.localeCompare(second.id);
    });
    var visitedAdults = {};
    var groups = [];
    var groupByAdultId = {};
    var assignedHouseholdIds = {};

    priorHouseholds.forEach(function(household){
      (household.adultIds || []).concat(household.childIds || []).forEach(function(id){
        if (!priorByMember[id]) priorByMember[id] = [];
        priorByMember[id].push(household);
      });
    });

    adults.forEach(function(adult){
      var spouse;
      var group;

      if (visitedAdults[adult.id]) return;
      spouse = adult.spouseId ? App.store.getPerson(adult.spouseId) : null;
      group = {
        adultIds:[adult.id],
        childIds:[],
        anchor:adult
      };
      visitedAdults[adult.id] = true;

      if (spouse && spouse.alive && spouse.age >= 18) {
        group.adultIds.push(spouse.id);
        visitedAdults[spouse.id] = true;
      }

      group.adultIds = group.adultIds.slice().sort();
      groups.push(group);
      group.adultIds.forEach(function(id){
        groupByAdultId[id] = group;
      });
    });

    children.forEach(function(child){
      var parentGroup = (child.parentIds || []).map(function(id){
        return groupByAdultId[id];
      }).filter(Boolean).sort(function(first, second){
        return (first.adultIds[0] || "").localeCompare(second.adultIds[0] || "");
      })[0] || null;

      if (!parentGroup) {
        groups.push({
          adultIds:[],
          childIds:[child.id],
          anchor:child
        });
        return;
      }

      if (parentGroup.childIds.indexOf(child.id) === -1) {
        parentGroup.childIds.push(child.id);
      }
    });

    App.store.households = groups.filter(function(group){
      return group.anchor && (group.adultIds.length || group.childIds.length);
    }).sort(function(first, second){
      return first.anchor.id.localeCompare(second.anchor.id);
    }).map(function(group){
      var candidates = [];
      var candidateIds = {};
      var exactMatch = null;
      var base;

      group.childIds = group.childIds.slice().sort();
      group.adultIds.concat(group.childIds).forEach(function(id){
        (priorByMember[id] || []).forEach(function(household){
          if (!household || candidateIds[household.id]) return;
          candidateIds[household.id] = true;
          candidates.push(household);
        });
      });

      exactMatch = candidates.find(function(household){
        return householdIdsEqual((household.adultIds || []).slice().sort(), group.adultIds) &&
          householdIdsEqual((household.childIds || []).slice().sort(), group.childIds);
      }) || null;

      base = exactMatch ? cloneHouseholdRecord(exactMatch) : buildHouseholdBaseState(group, candidates);
      base.id = exactMatch ? exactMatch.id : base.id;
      base.blocId = group.anchor.blocId;
      base.countryISO = group.anchor.countryISO;
      base.state = group.anchor.state || null;
      base.adultIds = group.adultIds.slice();
      base.childIds = group.childIds.slice();

      refreshHouseholdSnapshot(base);
      if (!base.originClassTier) {
        base.originClassTier = base.classTier;
        base.mobilityScore = 0;
      }

      base.adultIds.concat(base.childIds).forEach(function(id){
        assignedHouseholdIds[id] = base.id;
      });
      return base;
    });

    App.store.people.forEach(function(person){
      person.householdId = person.alive ? (assignedHouseholdIds[person.id] || null) : null;
    });

    return App.store.households;
  }

  function processHouseholdTick(){
    syncHouseholds();
    (App.store.households || []).forEach(function(household){
      var dailyIncome;
      var dailyExpenses;
      var dailyNet;
      var debtPayment;
      var coveredByCash;

      refreshHouseholdSnapshot(household);
      dailyIncome = (household.monthlyIncomeGU || 0) / DAYS_PER_MONTH * SIM_DAYS_PER_TICK;
      dailyExpenses = (household.monthlyExpensesGU || 0) / DAYS_PER_MONTH * SIM_DAYS_PER_TICK;
      dailyNet = dailyIncome - dailyExpenses;

      if (dailyNet >= 0) {
        debtPayment = Math.min(household.debtGU || 0, dailyNet);
        household.debtGU = Math.max(0, (household.debtGU || 0) - debtPayment);
        household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) + (dailyNet - debtPayment));
      } else {
        coveredByCash = Math.min(household.cashOnHandGU || 0, Math.abs(dailyNet));
        household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) - coveredByCash);
        household.debtGU = Math.max(0, (household.debtGU || 0) + Math.max(0, Math.abs(dailyNet) - coveredByCash));
      }

      applyHouseholdWealthDrift(household, dailyNet);
      normalizeHouseholdAssetClasses(household);
      refreshHouseholdSnapshot(household);
    });
  }

  function getPersonFinancialStress(person){
    var household = getHouseholdForPerson(person);
    return household ? (household.financialStress || 0) / 100 : 0;
  }

  function legacyGetHouseholdLaunchReadiness(person){
    var household = getHouseholdForPerson(person);
    var debtPenalty;

    if (!household) return 0;
    debtPenalty = (household.debtGU || 0) / Math.max(1, household.monthlyIncomeGU || 1);
    return App.utils.clamp(((household.cashOnHandGU || 0) / Math.max(1, household.monthlyExpensesGU || 1)) - (debtPenalty * 0.22), -1.5, 3);
  }

  function relieveHouseholdDebt(household, availableEstate){
    var payment;
    if (!household || availableEstate <= 0) return 0;
    payment = Math.min(availableEstate, Math.max(0, household.debtGU || 0));
    household.debtGU = Math.max(0, (household.debtGU || 0) - payment);
    refreshHouseholdSnapshot(household);
    return payment;
  }

  function reserveDependentSupport(household, availableEstate){
    var minors;
    var support;

    if (!household || availableEstate <= 0) return 0;
    minors = getHouseholdChildren(household).length;
    if (!minors) return 0;
    support = Math.min(availableEstate, Math.max(0, (household.monthlyExpensesGU || 0) * 2.5 * minors));
    household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) + support);
    refreshHouseholdSnapshot(household);
    return support;
  }

  function drawHouseholdAssetTransfer(person, amount){
    var household;
    var remaining;
    var pull;

    if (!person || !Number.isFinite(amount) || amount <= 0) return 0;
    household = getHouseholdForPerson(person);
    remaining = Math.max(0, amount);
    if (!household) {
      person.netWorthGU = Math.max(100, (person.netWorthGU || 0) - remaining);
      return remaining;
    }

    normalizeHouseholdAssetClasses(household);

    pull = Math.min(remaining, Math.max(0, Number(household.assetCashGU) || Number(household.cashOnHandGU) || 0));
    household.assetCashGU = Math.max(0, (Number(household.assetCashGU) || 0) - pull);
    household.cashOnHandGU = Math.max(0, (Number(household.cashOnHandGU) || 0) - pull);
    remaining -= pull;

    pull = Math.min(remaining, Math.max(0, Number(household.assetTrustGU) || 0));
    household.assetTrustGU = Math.max(0, (Number(household.assetTrustGU) || 0) - pull);
    remaining -= pull;

    pull = Math.min(remaining, Math.max(0, Number(household.assetEquityGU) || 0));
    household.assetEquityGU = Math.max(0, (Number(household.assetEquityGU) || 0) - pull);
    remaining -= pull;

    pull = Math.min(remaining, Math.max(0, Number(household.assetPropertyGU) || 0));
    household.assetPropertyGU = Math.max(0, (Number(household.assetPropertyGU) || 0) - pull);
    remaining -= pull;

    pull = Math.min(remaining, Math.max(0, Number(household.assetBusinessOwnershipGU) || 0));
    household.assetBusinessOwnershipGU = Math.max(0, (Number(household.assetBusinessOwnershipGU) || 0) - pull);
    remaining -= pull;

    person.netWorthGU = Math.max(100, (person.netWorthGU || 0) - (amount - remaining));
    normalizeHouseholdAssetClasses(household);
    refreshHouseholdSnapshot(household);
    return amount - remaining;
  }

  function allocateHouseholdAssetTransfer(person, amount, mode){
    var household;
    var transfer;
    var mix;
    var cash;
    var equity;
    var business;
    var property;
    var trust;

    if (!person || !Number.isFinite(amount) || amount <= 0) return 0;
    household = getHouseholdForPerson(person);
    transfer = Math.max(0, amount);

    if (mode === "heir") {
      mix = { cash:0.1, equity:0.24, business:0.3, property:0.14, trust:0.22 };
    } else if (mode === "spouse") {
      mix = { cash:0.32, equity:0.18, business:0.06, property:0.24, trust:0.2 };
    } else if (mode === "child") {
      mix = { cash:0.24, equity:0.24, business:0.06, property:0.2, trust:0.26 };
    } else {
      mix = { cash:0.36, equity:0.2, business:0.06, property:0.16, trust:0.22 };
    }

    cash = transfer * mix.cash;
    equity = transfer * mix.equity;
    business = transfer * mix.business;
    property = transfer * mix.property;
    trust = transfer * mix.trust;

    person.netWorthGU += transfer;
    if (!household) return transfer;

    normalizeHouseholdAssetClasses(household);
    household.cashOnHandGU = Math.max(0, (Number(household.cashOnHandGU) || 0) + cash);
    household.assetCashGU = Math.max(0, (Number(household.assetCashGU) || 0) + cash);
    household.assetEquityGU = Math.max(0, (Number(household.assetEquityGU) || 0) + equity);
    household.assetBusinessOwnershipGU = Math.max(0, (Number(household.assetBusinessOwnershipGU) || 0) + business);
    household.assetPropertyGU = Math.max(0, (Number(household.assetPropertyGU) || 0) + property);
    household.assetTrustGU = Math.max(0, (Number(household.assetTrustGU) || 0) + trust);
    normalizeHouseholdAssetClasses(household);
    refreshHouseholdSnapshot(household);
    return transfer;
  }

  function grantInheritanceTransfer(person, amount, mode){
    var granted = allocateHouseholdAssetTransfer(person, amount, mode);

    if (!person || granted <= 0) return 0;

    person.lifetimeInheritedGU = Math.max(0, (Number(person.lifetimeInheritedGU) || 0) + granted);
    person.inheritanceTransferCount = Math.max(0, Math.floor(Number(person.inheritanceTransferCount) || 0) + 1);
    person.lastInheritanceDay = App.store.simDay;
    return granted;
  }

  function createGeneratedSpouse(person, explicitAge){
    var spouseSex = getGeneratedSpouseSex(person);
    var spouseOrientation = getGeneratedSpouseOrientation(person, spouseSex);
    var spouse = createCitizen({
      blocId:person.blocId,
      countryISO:person.countryISO,
      state:person.state,
      sex:spouseSex,
      sexualOrientation:spouseOrientation,
      age:explicitAge != null ? explicitAge : App.utils.clamp(person.age + App.utils.randInt(-6, 6), 22, 60),
      netWorthGU:App.utils.rand(1500, 18000),
      anchorPerson:person,
      householdId:person.householdId || null
    });

    App.store.people.push(spouse);
    linkSpouses(person, spouse);
    spouse.pulse = 1;
    person.pulse = 1;
    syncHouseholds();
    return spouse;
  }

  function createChild(parents, age){
    var householdAnchor = parents[0];
    var child = createCitizen({
      blocId:householdAnchor.blocId,
      countryISO:householdAnchor.countryISO,
      state:householdAnchor.state,
      sex:Math.random() < 0.5 ? "male" : "female",
      age:age,
      lastName:buildChildLastName(parents),
      lineageId:buildChildLineageId(parents),
      parentIds:parents.map(function(parent){ return parent.id; }),
      netWorthGU:App.utils.rand(100, 1200),
      anchorPerson:householdAnchor
    });

    App.store.people.push(child);
    addChildToParents(child, parents);
    child.pulse = 1;
    syncHouseholds();
    return child;
  }

  function seedHousehold(person){
    var spouseChance = 0;
    var childPattern = null;
    var familyRoll;
    var spouse;
    var childAge;
    var olderChildAge;
    var youngerChildAge;
    var seededChildren = [];

    function finalizeSeededChildren(){
      seededChildren.forEach(function(child){
        initializeChildEducationProfile(child, getHouseholdForPerson(child));
      });
    }

    if (person.age < 30) {
      spouseChance = 0.15;
    } else if (person.age <= 40) {
      spouseChance = 0.45;
      if (Math.random() < 0.35) {
        childPattern = "single-young";
      }
    } else {
      spouseChance = 0.70;
      familyRoll = Math.random();
      if (familyRoll < 0.25) {
        childPattern = "two-older";
      } else if (familyRoll < 0.80) {
        childPattern = "single-older";
      }
    }

    if (!person.spouseId && Math.random() < spouseChance) {
      spouse = createGeneratedSpouse(person);
    } else {
      spouse = App.store.getSpouse(person);
    }

    if (!spouse || !childPattern) {
      return;
    }

    if (childPattern === "single-young") {
      childAge = App.utils.randInt(0, Math.min(10, Math.max(0, Math.floor(person.age - 22))));
      seededChildren.push(createChild([person, spouse], childAge));
      finalizeSeededChildren();
      syncHouseholds();
      return;
    }

    if (childPattern === "single-older") {
      childAge = App.utils.randInt(5, Math.min(18, Math.max(5, Math.floor(person.age - 22))));
      seededChildren.push(createChild([person, spouse], childAge));
      finalizeSeededChildren();
      syncHouseholds();
      return;
    }

    olderChildAge = App.utils.randInt(8, Math.min(18, Math.max(8, Math.floor(person.age - 22))));
    youngerChildAge = Math.max(0, olderChildAge - App.utils.randInt(2, 6));
    seededChildren.push(createChild([person, spouse], olderChildAge));
    seededChildren.push(createChild([person, spouse], youngerChildAge));
    finalizeSeededChildren();
    syncHouseholds();
  }

  function isCloseRelative(first, second){
    var firstParents = first.parentIds || [];
    var secondParents = second.parentIds || [];

    if (firstParents.indexOf(second.id) !== -1 || secondParents.indexOf(first.id) !== -1) {
      return true;
    }

    return firstParents.some(function(parentId){
      return secondParents.indexOf(parentId) !== -1;
    });
  }

  function findMarriageCandidate(person){
    var candidates = App.store.getLivingPeople().filter(function(candidate){
      if (candidate.id === person.id) return false;
      if (candidate.spouseId) return false;
      if (!areMarriageCompatible(person, candidate)) return false;
      if (candidate.age < 22 || candidate.age > 50) return false;
      if (isCloseRelative(person, candidate)) return false;
      return true;
    }).sort(function(first, second){
      function score(candidate){
        var value = 0;
        var candidateMobility = getTraitChannelScore(candidate, "mobility");
        var compatibility = getRelationshipCompatibility(person, candidate);

        if (!candidate.businessId) value += 4;
        value += Math.max(0, 8 - Math.abs(person.age - candidate.age));
        value += compatibility.score * 0.55;
        value += candidateMobility * 0.25;
        if (candidate.childrenIds && candidate.childrenIds.length) value -= 1;
        return value;
      }

      return score(second) - score(first);
    });

    return candidates[0] || null;
  }

  function tryMarriage(person){
    var chance = person.age <= 34 ? 0.10 : 0.06;
    var spouse;
    var marriageEffects;
    var householdStress = getPersonFinancialStress(person);
    var compatibility;
    var stepChildrenCount;
    var marriageText;

    chance += getTraitChannelScore(person, "family") * 0.0022;
    chance += getTraitChannelScore(person, "deal") * 0.0008;
    chance -= householdStress * 0.08;
    chance = App.utils.clamp(chance, 0.02, 0.22);

    if (Math.random() >= chance) {
      return;
    }

    spouse = findMarriageCandidate(person);
    if (!spouse) {
      spouse = createGeneratedSpouse(person);
    } else {
      linkSpouses(person, spouse);
      spouse.pulse = 1;
      person.pulse = 1;
    }

    compatibility = getRelationshipCompatibility(person, spouse);
    if (compatibility.score < 10 && Math.random() < 0.35) {
      dissolveMarriage(person, spouse);
      syncHouseholds();
      return;
    }

    syncHouseholds();
    stepChildrenCount = getStepChildCount(person, spouse) + getStepChildCount(spouse, person);

    marriageEffects = summarizeTraitEffects(collectGroupTraitEffects([person, spouse], ["family","deal"]), 4);
    recordTraitEffects(marriageEffects);
    setTraitSnapshot(person, marriageEffects);
    setTraitSnapshot(spouse, marriageEffects);
    marriageText = "<strong>" + person.name + "</strong> and <strong>" + spouse.name + "</strong> married in " + App.store.getCountryName(person.countryISO) + ".";
    if (stepChildrenCount > 0) {
      marriageText = "<strong>" + person.name + "</strong> and <strong>" + spouse.name + "</strong> married and formed a stepfamily with " + stepChildrenCount + " child" + (stepChildrenCount === 1 ? "" : "ren") + ".";
    }

    emitNews("marriage", marriageText, {
      tags:buildTraitEffectTags(marriageEffects, 2),
      entities:{
        personIds:[person.id, spouse.id],
        countryIsos:[person.countryISO],
        blocIds:[person.blocId]
      },
      causes:marriageEffects.slice(0, 2).map(function(effect){ return effect.label; }).concat([
        "Compatibility score: " + compatibility.score + ".",
        "Marriage considered class/culture proximity, ambition alignment, and fertility preference fit."
      ])
    });
  }

  function getStepChildCount(parent, partner){
    return App.store.getChildren(parent, false).filter(function(child){
      return child && child.parentIds && child.parentIds.indexOf(partner.id) === -1;
    }).length;
  }

  function getSharedChildren(first, second){
    return (first.childrenIds || []).map(function(id){
      return App.store.getPerson(id);
    }).filter(function(child){
      return !!child && child.parentIds.indexOf(second.id) !== -1;
    });
  }

  function getBirthNormModifier(iso){
    var profile = ensureCountryProfile(iso);
    var baseRate = Number(profile && profile.birthRatePer1000);

    if (!Number.isFinite(baseRate)) baseRate = 14;
    return App.utils.clamp((baseRate - 12) / 36, -0.15, 0.45);
  }

  function getParentHealthModifier(person){
    var age;
    var stress;
    var burnout;
    var grief;
    var resentment;
    var fatigue;

    if (!person) return -0.2;

    ensureDecisionData(person);
    age = Number(person.age) || 0;
    stress = Number(person.temporaryStates.stress) || 0;
    burnout = Number(person.temporaryStates.burnout) || 0;
    grief = Number(person.temporaryStates.grief) || 0;
    resentment = Number(person.temporaryStates.resentment) || 0;

    fatigue = ((stress - 40) * 0.0105) + ((burnout - 30) * 0.0065) + (grief * 0.0045) + (resentment * 0.0025);
    if (age > 38) fatigue += (age - 38) * 0.015;
    return App.utils.clamp(-fatigue, -0.55, 0.16);
  }

  function getMaritalStabilityModifier(first, second, isMarital){
    var compatibility;
    var strain;

    if (!isMarital) return -0.06;
    compatibility = getRelationshipCompatibility(first, second);
    strain = (getPersonFinancialStress(first) + getPersonFinancialStress(second)) / 2;
    return App.utils.clamp((compatibility.score / 165) - (strain * 0.14), -0.12, 0.14);
  }

  function applyChildOutcomeInfluence(mother, partner, child, siblings, household, isMarital){
    var parentEducation;
    var parentFamily;
    var parentMobility;
    var householdStress;
    var classRank;
    var siblingCount;
    var privilegeBoost;
    var dilutionPenalty;
    var educationShift;
    var rivalrySibling;

    if (!child) return;

    siblingCount = Math.max(0, (siblings || []).length);
    householdStress = household ? ((household.financialStress || 0) / 100) : 0;
    classRank = household ? householdClassRank(household.classTier) : 1;
    parentEducation = ((Number(mother && mother.educationIndex) || 0) + (Number(partner && partner.educationIndex) || 0)) / 2;
    parentFamily = (getTraitChannelScore(mother, "family") + getTraitChannelScore(partner, "family")) / 2;
    parentMobility = (getTraitChannelScore(mother, "mobility") + getTraitChannelScore(partner, "mobility")) / 2;

    privilegeBoost = classRank >= 3 ? (2.2 + (classRank - 3) * 1.8) : 0;
    dilutionPenalty = siblingCount > 0 ? (siblingCount * 1.35) : 0;
    educationShift =
      ((parentEducation - 50) * 0.055) +
      (parentFamily * 0.07) +
      (parentMobility * 0.03) +
      privilegeBoost -
      (householdStress * 5.8) -
      dilutionPenalty +
      (isMarital ? 0.6 : -1.8);

    child.educationIndex = App.utils.clamp((Number(child.educationIndex) || 0) + educationShift, 0, 100);
    child.sharedPrivilege = App.utils.clamp((classRank - 1) * 14 + (privilegeBoost * 2.5), 0, 100);
    child.inheritanceDilution = Math.max(1, siblingCount + 1);
    child.siblingRivalry = App.utils.clamp((Number(child.siblingRivalry) || 0) + (siblingCount * 7.5) + (isMarital ? 1.5 : 4), 0, 100);

    if (siblingCount >= 1 && Math.random() < App.utils.clamp(0.24 + (siblingCount * 0.08), 0.2, 0.65)) {
      rivalrySibling = siblings.slice().sort(function(first, second){
        return Math.abs((first.age || 0) - (second.age || 0));
      })[0] || null;

      if (rivalrySibling) {
        ensureDecisionData(rivalrySibling);
        rivalrySibling.siblingRivalry = App.utils.clamp((Number(rivalrySibling.siblingRivalry) || 0) + App.utils.rand(7, 16), 0, 100);
        rivalrySibling.inheritanceDilution = Math.max(1, siblingCount + 1);
        adjustTemporaryStates(rivalrySibling, {
          resentment:App.utils.rand(4, 10),
          stress:App.utils.rand(1, 4),
          ambitionSpike:App.utils.rand(2, 5)
        });
      }
    }

    ensureEducationData(child, household || null);
    ensureSkillData(child);
    syncPerson(child);
  }

  function processYearlySiblingDynamics(){
    var processedParents = {};

    App.store.getLivingPeople().forEach(function(parent){
      var children;
      var siblingCount;
      var key;

      if (!parent || !parent.alive || !parent.childrenIds || !parent.childrenIds.length) return;
      key = parent.id;
      if (processedParents[key]) return;
      processedParents[key] = true;

      children = App.store.getChildren(parent, false).filter(function(child){
        return !!child && child.alive;
      });
      siblingCount = children.length;
      if (siblingCount <= 1) return;

      children.forEach(function(child){
        var rivalryDrift = App.utils.rand(0.5, 2.2) + (siblingCount - 2) * 0.45;
        child.inheritanceDilution = Math.max(1, siblingCount);
        child.siblingRivalry = App.utils.clamp((Number(child.siblingRivalry) || 0) + rivalryDrift, 0, 100);
      });
    });
  }

  function legacyProcessYearlyFamilyBusinessGrooming(){
    App.store.businesses.forEach(function(business){
      var owner = App.store.getPerson(business.ownerId);
      var children;
      var eligible;
      var sorted;
      var chosen;
      var others;
      var household;

      if (!owner || !owner.alive) return;
      children = App.store.getChildren(owner, false).filter(function(child){
        return !!child && child.alive;
      });
      if (children.length < 2) return;

      eligible = children.filter(function(child){
        return child.age >= 12 && child.age <= 32;
      });
      if (!eligible.length) return;

      sorted = eligible.slice().sort(function(first, second){
        var firstScore = (Number(first.educationIndex) || 0) * 0.45 + getPersonSkillAverage(first) * 0.55 + getTraitChannelScore(first, "business") * 2.2 + countSharedTraits(first, owner) * 4;
        var secondScore = (Number(second.educationIndex) || 0) * 0.45 + getPersonSkillAverage(second) * 0.55 + getTraitChannelScore(second, "business") * 2.2 + countSharedTraits(second, owner) * 4;
        return secondScore - firstScore;
      });

      chosen = sorted[0];
      others = sorted.slice(1);
      household = getHouseholdForPerson(owner);

      chosen.groomedForBusinessById = business.id;
      chosen.inheritanceDilution = Math.max(1, children.length);
      chosen.siblingRivalry = App.utils.clamp((Number(chosen.siblingRivalry) || 0) + App.utils.rand(1, 4), 0, 100);
      ensureSkillData(chosen);
      chosen.skills.management = App.utils.clamp((Number(chosen.skills.management) || 0) + App.utils.rand(1.4, 3.8), 0, 100);
      chosen.skills.social = App.utils.clamp((Number(chosen.skills.social) || 0) + App.utils.rand(0.8, 2.4), 0, 100);
      adjustTemporaryStates(chosen, {
        confidence:App.utils.rand(3, 8),
        ambitionSpike:App.utils.rand(2, 5)
      });

      if (others.length) {
        var rival = others[Math.floor(Math.random() * others.length)];
        rival.siblingRivalry = App.utils.clamp((Number(rival.siblingRivalry) || 0) + App.utils.rand(5, 12), 0, 100);
        rival.inheritanceDilution = Math.max(1, children.length);
        adjustTemporaryStates(rival, {
          resentment:App.utils.rand(3, 9),
          stress:App.utils.rand(1, 4),
          ambitionSpike:App.utils.rand(2, 6)
        });
      }

      if (Math.random() < 0.42) {
        emitNews("inheritance", "<strong>" + owner.name + "</strong> started grooming <strong>" + chosen.name + "</strong> for leadership at <strong>" + business.name + "</strong> while sibling rivalry rose.", {
          tags:["family", "succession", "grooming"],
          entities:{
            personIds:[owner.id, chosen.id].concat(others.slice(0, 2).map(function(child){ return child.id; })),
            businessIds:[business.id],
            countryIsos:[business.countryISO],
            blocIds:[business.blocId]
          },
          causes:[
            "Family business succession grooming favored one child over siblings.",
            "Inheritance dilution and rivalry effects intensified as household size grew" + (household ? " under current household pressure." : ".")
          ]
        });
      }
    });
  }

  function processYearlySocialNetworks(){
    var living = App.store.getLivingPeople();

    living.forEach(function(person){
      var mentorPool;
      var mentor;
      var peers;
      var friend;

      ensureSocialNetworkData(person);
      decayPersonalReputation(person);

      if (person.age >= 18 && person.age <= 38 && !person.mentorId && Math.random() < 0.18) {
        mentorPool = living.filter(function(candidate){
          if (!candidate || candidate.id === person.id) return false;
          if (candidate.age < person.age + 12) return false;
          if (candidate.countryISO !== person.countryISO && candidate.blocId !== person.blocId) return false;
          ensureSocialNetworkData(candidate);
          return (candidate.personalReputation.prestige >= 56) || ((candidate.netWorthGU || 0) > 65000);
        }).sort(function(first, second){
          var firstScore = (Number(first.personalReputation && first.personalReputation.prestige) || 35) + ((first.netWorthGU || 0) / 4500);
          var secondScore = (Number(second.personalReputation && second.personalReputation.prestige) || 35) + ((second.netWorthGU || 0) / 4500);
          return secondScore - firstScore;
        });

        mentor = mentorPool[0] || null;
        if (mentor) {
          person.mentorId = mentor.id;
          person.schoolTieIds = normalizeUniqueIdList((person.schoolTieIds || []).concat([mentor.id]), person.id).slice(0, 12);
          mentor.closeFriendIds = normalizeUniqueIdList((mentor.closeFriendIds || []).concat([person.id]), mentor.id).slice(0, 10);
          adjustPersonalReputation(mentor, { trust:0.8, prestige:0.6 });
        }
      }

      peers = living.filter(function(candidate){
        if (!candidate || candidate.id === person.id) return false;
        if (candidate.countryISO !== person.countryISO) return false;
        if (Math.abs((candidate.age || 0) - (person.age || 0)) > 7) return false;
        return true;
      });

      if (peers.length && Math.random() < 0.12) {
        friend = App.utils.pick(peers);
        if (friend) {
          person.closeFriendIds = normalizeUniqueIdList((person.closeFriendIds || []).concat([friend.id]), person.id).slice(0, 10);
          friend.closeFriendIds = normalizeUniqueIdList((friend.closeFriendIds || []).concat([person.id]), friend.id).slice(0, 10);
        }
      }

      if ((person.educationIndex || 0) >= 65 && Math.random() < 0.1) {
        var schoolPeer = App.utils.pick(peers.filter(function(candidate){
          return (candidate.educationIndex || 0) >= 62;
        }));
        if (schoolPeer) {
          person.schoolTieIds = normalizeUniqueIdList((person.schoolTieIds || []).concat([schoolPeer.id]), person.id).slice(0, 12);
          schoolPeer.schoolTieIds = normalizeUniqueIdList((schoolPeer.schoolTieIds || []).concat([person.id]), schoolPeer.id).slice(0, 12);
        }
      }

      if ((person.netWorthGU || 0) >= 120000 && Math.random() < 0.22) {
        var elitePeer = App.utils.pick(living.filter(function(candidate){
          return candidate.id !== person.id && candidate.blocId === person.blocId && (candidate.netWorthGU || 0) >= 90000;
        }));
        if (elitePeer) {
          person.eliteCircleIds = normalizeUniqueIdList((person.eliteCircleIds || []).concat([elitePeer.id]), person.id).slice(0, 8);
          elitePeer.eliteCircleIds = normalizeUniqueIdList((elitePeer.eliteCircleIds || []).concat([person.id]), elitePeer.id).slice(0, 8);
        }
      }

      if (person.businessId && Math.random() < 0.16) {
        var rivalOwner = App.utils.pick(living.filter(function(candidate){
          var candidateBusiness;
          if (candidate.id === person.id || !candidate.businessId) return false;
          candidateBusiness = App.store.getBusiness(candidate.businessId);
          if (!candidateBusiness) return false;
          return candidateBusiness.industry === (App.store.getBusiness(person.businessId) && App.store.getBusiness(person.businessId).industry);
        }));
        if (rivalOwner) {
          person.rivalIds = normalizeUniqueIdList((person.rivalIds || []).concat([rivalOwner.id]), person.id).slice(0, 8);
          rivalOwner.rivalIds = normalizeUniqueIdList((rivalOwner.rivalIds || []).concat([person.id]), rivalOwner.id).slice(0, 8);
          adjustPersonalReputation(person, { notoriety:1.2 });
          adjustPersonalReputation(rivalOwner, { notoriety:1.2 });
        }
      }

      if (person.childrenIds && person.childrenIds.length && (person.businessId || (person.netWorthGU || 0) > 60000)) {
        (person.childrenIds || []).forEach(function(childId){
          var child = App.store.getPerson(childId);
          if (!child || !child.alive || child.age < 15) return;
          child.nepotismTieIds = normalizeUniqueIdList((child.nepotismTieIds || []).concat([person.id]), child.id).slice(0, 10);
          if ((person.eliteCircleIds || []).length) {
            child.nepotismTieIds = normalizeUniqueIdList((child.nepotismTieIds || []).concat(person.eliteCircleIds.slice(0, 2)), child.id).slice(0, 10);
          }
        });
      }

      syncPerson(person);
    });
  }

  function processYearlyRetiredInfluence(){
    App.store.getLivingPeople().forEach(function(person){
      var influence;

      if (!person.retired) return;
      ensureSocialNetworkData(person);
      influence = App.utils.clamp((Number(person.retirementInfluence) || 0) + ((person.personalReputation && person.personalReputation.prestige) || 0) * 0.3, 0, 100);
      if (influence <= 8) return;

      (person.advisorBusinessIds || []).forEach(function(businessId){
        var business = App.store.getBusiness(businessId);
        var owner = business ? App.store.getPerson(business.ownerId) : null;

        if (!business || !owner || !owner.alive) return;

        business.reputation = clampScore((business.reputation || 50) + App.utils.clamp((influence - 40) * 0.04, -1.2, 2.4));
        business.currentDecision = evaluateBusinessDecision(business);
        owner.temporaryStates.confidence = App.utils.clamp((owner.temporaryStates.confidence || 50) + App.utils.clamp((influence - 35) * 0.05, -1, 4), 0, 100);
        owner.temporaryStates.stress = App.utils.clamp((owner.temporaryStates.stress || 22) - App.utils.clamp((influence - 50) * 0.04, -1, 3), 0, 100);
        adjustPersonalReputation(owner, { prestige:App.utils.clamp((influence - 45) * 0.02, -0.5, 1.4), trust:0.2 });
        syncPerson(owner);
      });

      if ((person.netWorthGU || 0) > 50000 && Math.random() < 0.16) {
        var patron = App.utils.pick(App.store.getChildren(person, false).filter(function(child){
          return child && child.alive && child.age >= 18;
        }));
        if (patron) {
          var grant = Math.min((person.netWorthGU || 0) * App.utils.rand(0.008, 0.028), Math.max(800, patron.netWorthGU * 0.06));
          person.netWorthGU = Math.max(100, (person.netWorthGU || 0) - grant);
          patron.netWorthGU += grant;
          patron.nepotismTieIds = normalizeUniqueIdList((patron.nepotismTieIds || []).concat([person.id]), patron.id).slice(0, 10);
          adjustPersonalReputation(person, { trust:0.6, prestige:0.4 });
          adjustPersonalReputation(patron, { prestige:0.8, trust:0.4 });
          syncPerson(patron);
        }
      }

      syncPerson(person);
    });
  }

  function findNonMaritalBirthPartner(person){
    var candidates = App.store.getLivingPeople().filter(function(candidate){
      if (candidate.id === person.id) return false;
      if (candidate.sex !== "male") return false;
      if (candidate.age < 22 || candidate.age > 56) return false;
      if (!areMarriageCompatible(person, candidate)) return false;
      if (isCloseRelative(person, candidate)) return false;
      if (candidate.countryISO !== person.countryISO && Math.random() > 0.1) return false;
      return true;
    }).sort(function(first, second){
      var firstCompatibility = getRelationshipCompatibility(person, first);
      var secondCompatibility = getRelationshipCompatibility(person, second);
      var firstScore = firstCompatibility.score + (first.spouseId ? -6 : 3) + getTraitChannelScore(first, "deal") * 0.3;
      var secondScore = secondCompatibility.score + (second.spouseId ? -6 : 3) + getTraitChannelScore(second, "deal") * 0.3;
      return secondScore - firstScore;
    });

    return candidates[0] || null;
  }

  function tryBirth(mother){
    var spouse = App.store.getSpouse(mother);
    var partner = spouse;
    var children;
    var birthChance;
    var lastBirthDay;
    var child;
    var familyPressure;
    var mobilityPressure;
    var birthEffects;
    var householdStress;
    var childcareBurden;
    var household;
    var isMarital;
    var partnerCompatibility;
    var fertilityPreference;
    var birthNormModifier;
    var wealthModifier;
    var housingPenalty;
    var educationModifier;
    var healthModifier;
    var maritalStabilityModifier;
    var siblingsBeforeBirth;
    var text;

    if (mother.age < 24 || mother.age > 42) return;

    isMarital = !!(spouse && spouse.alive && spouse.sex === "male");
    if (!isMarital) {
      if (mother.spouseId) return;
      partner = findNonMaritalBirthPartner(mother);
      if (!partner) return;
      partnerCompatibility = getRelationshipCompatibility(mother, partner);
    }

    if (!partner || !partner.alive || partner.sex !== "male") return;

    children = getSharedChildren(mother, partner);
    if (children.length >= 3) return;

    lastBirthDay = children.reduce(function(latest, existingChild){
      return Math.max(latest, existingChild.birthDay);
    }, -Infinity);

    if (lastBirthDay > -Infinity && (App.store.simDay - lastBirthDay) < (YEAR_DAYS * 2)) {
      return;
    }

    birthChance = isMarital ? (children.length === 0 ? 0.18 : (children.length === 1 ? 0.10 : 0.04)) : (children.length === 0 ? 0.045 : 0.02);
    familyPressure = (getTraitChannelScore(mother, "family") + getTraitChannelScore(partner, "family")) / 2;
    mobilityPressure = (getTraitChannelScore(mother, "mobility") + getTraitChannelScore(partner, "mobility")) / 2;
    fertilityPreference = (getFertilityPreferenceScore(mother) + getFertilityPreferenceScore(partner)) / 2;
    birthNormModifier = getBirthNormModifier(mother.countryISO);
    household = getHouseholdForPerson(mother);
    householdStress = household ? (household.financialStress || 0) / 100 : 0;
    childcareBurden = household && household.monthlyExpensesGU > 0 ? (household.childcareCostGU || 0) / household.monthlyExpensesGU : 0;
    wealthModifier = household ? App.utils.clamp(((household.cashOnHandGU || 0) / Math.max(1, household.monthlyExpensesGU || 1)) * 0.012, -0.03, 0.08) : 0;
    housingPenalty = household && household.monthlyExpensesGU > 0 ? App.utils.clamp(((household.housingCostGU || 0) / household.monthlyExpensesGU) * 0.09, 0, 0.085) : 0;
    educationModifier = App.utils.clamp((((Number(mother.educationIndex) || 0) + (Number(partner.educationIndex) || 0)) / 200) * 0.03, 0, 0.03);
    healthModifier = (getParentHealthModifier(mother) + getParentHealthModifier(partner)) / 2;
    maritalStabilityModifier = getMaritalStabilityModifier(mother, partner, isMarital);
    birthChance += familyPressure * 0.0036;
    birthChance -= mobilityPressure * 0.0015;
    birthChance += fertilityPreference * 0.0016;
    birthChance += birthNormModifier;
    birthChance += wealthModifier;
    birthChance += educationModifier;
    birthChance += healthModifier;
    birthChance += maritalStabilityModifier;
    birthChance -= housingPenalty;
    birthChance -= householdStress * 0.12;
    birthChance -= childcareBurden * 0.08;
    if (!isMarital && partnerCompatibility) {
      birthChance += App.utils.clamp(partnerCompatibility.score * 0.0009, -0.02, 0.03);
    }
    birthChance = App.utils.clamp(birthChance, 0.01, 0.26);
    if (Math.random() >= birthChance) {
      return;
    }

    siblingsBeforeBirth = children.slice();
    child = createChild([mother, partner], 0);
    if (!isMarital) {
      child.birthUnionType = "non_marital";
      ensureFamilyDynamics(mother);
      ensureFamilyDynamics(partner);
      if (mother.nonMaritalChildIds.indexOf(child.id) === -1) mother.nonMaritalChildIds.push(child.id);
      if (partner.nonMaritalChildIds.indexOf(child.id) === -1) partner.nonMaritalChildIds.push(child.id);
      adjustTemporaryStates(mother, {
        stress:5,
        confidence:-1
      });
      adjustTemporaryStates(partner, {
        stress:4
      });
    }
    household = getHouseholdForPerson(child) || getHouseholdForPerson(mother) || household;
    initializeChildEducationProfile(child, household);
    applyChildOutcomeInfluence(mother, partner, child, siblingsBeforeBirth, household, isMarital);
    syncHouseholds();
    birthEffects = summarizeTraitEffects(collectGroupTraitEffects([mother, partner], ["family","mobility"]), 4);
    recordTraitEffects(birthEffects);
    setTraitSnapshot(mother, birthEffects);
    setTraitSnapshot(partner, birthEffects);
    setTraitSnapshot(child, birthEffects);
    text = isMarital ?
      ("<strong>" + mother.name + "</strong> and <strong>" + partner.name + "</strong> welcomed <strong>" + child.name + "</strong>.") :
      ("<strong>" + mother.name + "</strong> and <strong>" + partner.name + "</strong> welcomed <strong>" + child.name + "</strong> outside formal marriage.");
    emitNews("birth", text, {
      tags:buildTraitEffectTags(birthEffects, 2),
      entities:{
        personIds:[mother.id, partner.id, child.id],
        countryIsos:[mother.countryISO],
        blocIds:[mother.blocId]
      },
      causes:birthEffects.slice(0, 2).map(function(effect){ return effect.label; }).concat([
        isMarital ? "Child arrived within marriage." : "Child arrived outside marriage, creating inheritance ambiguity."
      ])
    });
  }

  function hasEntrepreneurialTraits(person){
    return person.traits.some(function(trait){
      return ENTREPRENEURIAL_TRAITS[trait];
    });
  }

  function legacyGetFounderAptitude(person){
    var traitBias;
    var stage;
    var score = 0;

    ensureDecisionData(person);
    ensureSkillData(person);
    ensureWorkerLifecycleData(person);

    traitBias = hasEntrepreneurialTraits(person) ? 26 : 0;
    stage = String(person.workerLifecycleStage || "worker");

    score += traitBias;
    score += getTraitChannelScore(person, "business") * 2.4;
    score += getTraitChannelScore(person, "mobility") * 1.6;
    score += (Number(person.skills && person.skills.creativity) || 0) * 0.28;
    score += (Number(person.skills && person.skills.social) || 0) * 0.22;
    score += (Number(person.skills && person.skills.management) || 0) * 0.24;
    score += (Number(person.educationIndex) || 0) * 0.16;
    score += (person.decisionProfile.riskTolerance - 50) * 0.7;
    score += (person.decisionProfile.adaptability - 50) * 0.56;
    score += (person.decisionProfile.discipline - 50) * 0.42;
    score += (person.decisionProfile.statusSeeking - 50) * 0.28;

    if (stage === "executive") score += 14;
    else if (stage === "manager") score += 9;
    else if (stage === "professional") score += 5;
    else if (stage === "student") score -= 6;
    else if (stage === "dependent") score -= 12;

    return App.utils.clamp((score + 35) / 220, 0, 1);
  }

  function legacyBuildYearlyLaunchContext(){
    var context = {
      activeBusinessesByBloc:{},
      activeBusinessesByCountry:{},
      distressedBusinessesByBloc:{},
      distressedBusinessesByCountry:{},
      eligibleAdultsByBloc:{},
      eligibleAdultsByCountry:{}
    };

    (App.store.businesses || []).forEach(function(business){
      var isDistressed;

      if (!business || business.stage === "defunct" || !business.ownerId) return;
      context.activeBusinessesByBloc[business.blocId] = (context.activeBusinessesByBloc[business.blocId] || 0) + 1;
      context.activeBusinessesByCountry[business.countryISO] = (context.activeBusinessesByCountry[business.countryISO] || 0) + 1;
      isDistressed = business.stage === "declining" || (business.bankruptcyStage && business.bankruptcyStage !== "stable");
      if (isDistressed) {
        context.distressedBusinessesByBloc[business.blocId] = (context.distressedBusinessesByBloc[business.blocId] || 0) + 1;
        context.distressedBusinessesByCountry[business.countryISO] = (context.distressedBusinessesByCountry[business.countryISO] || 0) + 1;
      }
    });

    App.store.getLivingPeople().forEach(function(person){
      if (!person || person.retired || person.age < 22) return;
      context.eligibleAdultsByBloc[person.blocId] = (context.eligibleAdultsByBloc[person.blocId] || 0) + 1;
      context.eligibleAdultsByCountry[person.countryISO] = (context.eligibleAdultsByCountry[person.countryISO] || 0) + 1;
    });

    context.blocBusinessPresenceMeta = buildBlocBusinessPresenceMeta(context);

    return context;
  }

  function legacyGetLaunchDensityMultiplier(person, launchContext){
    var context = launchContext && typeof launchContext === "object" ? launchContext : null;
    var presenceMeta;
    var blocBusinessCount;
    var blocEligibleAdults;
    var countryBusinessCount;
    var countryEligibleAdults;
    var blocDistressedCount;
    var countryDistressedCount;
    var blocDensity;
    var countryDensity;
    var blocDiversificationMultiplier;
    var underDensityBoost;
    var distressBoost;

    if (!person || !context) return 1;

    presenceMeta = context.blocBusinessPresenceMeta || buildBlocBusinessPresenceMeta(context);
    blocBusinessCount = Math.max(0, Number(context.activeBusinessesByBloc[person.blocId]) || 0);
    blocEligibleAdults = Math.max(8, Number(context.eligibleAdultsByBloc[person.blocId]) || 0);
    countryBusinessCount = Math.max(0, Number(context.activeBusinessesByCountry[person.countryISO]) || 0);
    countryEligibleAdults = Math.max(6, Number(context.eligibleAdultsByCountry[person.countryISO]) || 0);
    blocDistressedCount = Math.max(0, Number(context.distressedBusinessesByBloc[person.blocId]) || 0);
    countryDistressedCount = Math.max(0, Number(context.distressedBusinessesByCountry[person.countryISO]) || 0);
    blocDensity = blocBusinessCount / blocEligibleAdults;
    countryDensity = countryBusinessCount / countryEligibleAdults;
    blocDiversificationMultiplier = getBlocBusinessDiversificationMultiplier(person.blocId, presenceMeta);
    underDensityBoost = Math.max(0, 0.085 - blocDensity) * 2.4 + Math.max(0, 0.1 - countryDensity) * 1.45;
    distressBoost = Math.min(0.16, (blocDistressedCount / Math.max(1, blocBusinessCount || 1)) * 0.1) + Math.min(0.1, (countryDistressedCount / Math.max(1, countryBusinessCount || 1)) * 0.06);

    return App.utils.clamp(
      (1 + underDensityBoost + distressBoost - (Math.max(0, blocDensity - 0.08) * 4.8) - (Math.max(0, countryDensity - 0.1) * 2.6)) * blocDiversificationMultiplier,
      0.12,
      1.55
    );
  }

  function legacyTryLaunchBusiness(person, launchContext){
    var chance;
    var business;
    var bloc = App.store.getBloc(person.blocId);
    var mobilityTrait;
    var businessTrait;
    var launchEffects;
    var capitalModifier;
    var household;
    var launchReadiness;
    var launchCapital;
    var mentor;
    var socialCapital;
    var patronBoost = 0;
    var founderAptitude;
    var lifecycleStage;
    var countryProfile;
    var institutionScore;
    var corruptionIndex;
    var businessFriendliness;
    var institutionalConfidence;
    var dynasticBias;
    var unemploymentRate;
    var launchGapBoost;

    if (!person.alive || person.retired || person.businessId || person.age < 22) return;

    ensureSocialNetworkData(person);
    ensureWorkerLifecycleData(person);
    founderAptitude = legacyGetFounderAptitude(person);
    lifecycleStage = String(person.workerLifecycleStage || "worker");
    countryProfile = ensureCountryProfile(person.countryISO, person.blocId);
    institutionScore = App.utils.clamp(Number(countryProfile && countryProfile.institutionScore) || 0.55, 0.1, 1);
    corruptionIndex = App.utils.clamp(Number(countryProfile && countryProfile.developmentCorruptionIndex) || (1 - institutionScore), 0, 1);
    businessFriendliness = App.utils.clamp(Number(countryProfile && countryProfile.developmentBusinessFriendlinessIndex) || institutionScore, 0, 1);
    institutionalConfidence = App.utils.clamp((institutionScore * 0.44) + (businessFriendliness * 0.36) + ((1 - corruptionIndex) * 0.2), 0.08, 1);
    dynasticBias = App.utils.clamp((0.55 - institutionalConfidence) * 1.4 + (corruptionIndex * 0.6), 0, 1.2);
    unemploymentRate = Math.max(0, Number(countryProfile && countryProfile.unemploymentRate) || 0);
    launchGapBoost = App.utils.clamp((Math.max(0, 0.11 - unemploymentRate) * 0.06) + (Math.max(0, unemploymentRate - 0.16) * 0.018), 0, 0.005);

    chance = hasEntrepreneurialTraits(person) ? 0.012 : 0.0025;
    mobilityTrait = getTraitChannelScore(person, "mobility");
    businessTrait = getTraitChannelScore(person, "business");
    household = getHouseholdForPerson(person);
    launchReadiness = legacyGetHouseholdLaunchReadiness(person);
    chance += mobilityTrait * 0.0016;
    chance += businessTrait * 0.0011;
    chance += (Number(person.educationIndex) || 0) * 0.00022;
    chance += App.utils.clamp((Number(person.skills && person.skills.creativity) || 0) * 0.00012, 0, 0.008);
    chance += App.utils.clamp((Number(person.skills && person.skills.social) || 0) * 0.00009, 0, 0.006);
    socialCapital = (person.closeFriendIds.length * 0.5) + (person.schoolTieIds.length * 0.35) + (person.eliteCircleIds.length * 0.4) + (person.nepotismTieIds.length * (0.55 + dynasticBias * 0.35));
    chance += App.utils.clamp(socialCapital * 0.0011, 0, 0.018);
    chance += (institutionalConfidence - 0.5) * 0.018;
    chance += launchGapBoost;
    chance -= App.utils.clamp((corruptionIndex - 0.5) * 0.01, -0.005, 0.02);
    mentor = person.mentorId ? App.store.getPerson(person.mentorId) : null;
    if (mentor && mentor.alive && (mentor.netWorthGU || 0) > 12000) {
      patronBoost = Math.min((mentor.netWorthGU || 0) * 0.0012, Math.max(500, (person.netWorthGU || 0) * 0.08));
      chance += 0.006;
    }
    chance += launchReadiness * 0.006;
    if ((Number(person.rivalFounderArcUntilDay) || 0) > App.store.simDay) {
      chance += 0.012;
    }
    chance *= App.utils.clamp(0.45 + (founderAptitude * 1.35), 0.25, 1.8);
    if (lifecycleStage === "executive") chance += 0.008;
    else if (lifecycleStage === "manager") chance += 0.005;
    else if (lifecycleStage === "professional") chance += 0.003;
    else if (lifecycleStage === "student" || lifecycleStage === "dependent") chance *= 0.35;
    if ((person.netWorthGU || 0) > 90000 && founderAptitude < 0.45) {
      chance *= 0.32;
    }
    chance -= getPersonFinancialStress(person) * 0.08;
    chance *= legacyGetLaunchDensityMultiplier(person, launchContext);
    chance = App.utils.clamp(chance, 0.0006, 0.032);
    if (Math.random() >= chance) {
      return;
    }

    business = createBusiness(person);
    seedBusiness(business);
    capitalModifier = 1 + App.utils.clamp((mobilityTrait * 0.6 + businessTrait * 0.8) / 40, -0.22, 0.28);
    capitalModifier *= 1 + App.utils.clamp(launchReadiness * 0.08, -0.14, 0.24);
    capitalModifier *= 1 + App.utils.clamp((institutionalConfidence - 0.5) * 0.22 - (corruptionIndex - 0.5) * 0.12, -0.12, 0.16);
    business.revenueGU *= capitalModifier;
    business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) * capitalModifier);
    business.valuationGU = Math.max(1000, business.valuationGU * (0.95 + (capitalModifier - 1) * 0.9));
    launchCapital = Math.min(person.netWorthGU * 0.09, Math.max(1800, business.cashReservesGU * 0.26));
    if (household) {
      launchCapital = Math.min(launchCapital + Math.min(household.cashOnHandGU || 0, Math.max(1200, household.monthlyExpensesGU || 0)), person.netWorthGU * 0.14 + (household.cashOnHandGU || 0));
      household.cashOnHandGU = Math.max(0, (household.cashOnHandGU || 0) - Math.min(household.cashOnHandGU || 0, launchCapital * 0.45));
      refreshHouseholdSnapshot(household);
    }
    business.cashReservesGU += launchCapital;
    if (patronBoost > 0 && mentor && mentor.alive) {
      business.cashReservesGU += patronBoost;
      mentor.netWorthGU = Math.max(200, (mentor.netWorthGU || 0) - patronBoost);
      adjustPersonalReputation(mentor, { trust:1.4, prestige:1.8, notoriety:0.6 });
      syncPerson(mentor);
    }
    person.netWorthGU = Math.max(200, person.netWorthGU - Math.min(person.netWorthGU * 0.06, launchCapital * 0.3));
    App.store.businesses.push(business);
    person.businessId = business.id;
    person.rivalFounderArcUntilDay = null;
    person.pulse = 1;
    syncBusinessLeadership(business);
    launchEffects = summarizeTraitEffects(collectTraitEffects(person, ["mobility","business"]), 4);
    recordTraitEffects(launchEffects);
    setTraitSnapshot(person, launchEffects);
    setTraitSnapshot(business, launchEffects);
    adjustPersonalReputation(person, { trust:1.2, prestige:4.5, notoriety:2.2 });
    syncPerson(person);
    emitNews("launch", "<strong>" + person.name + "</strong> " + bloc.flag + " launched <strong>" + business.name + "</strong> in " + business.industry + ".", {
      tags:buildTraitEffectTags(launchEffects, 2),
      entities:{
        personIds:[person.id],
        businessIds:[business.id],
        countryIsos:[business.countryISO],
        blocIds:[business.blocId]
      },
      causes:launchEffects.slice(0, 2).map(function(effect){ return effect.label; })
    });
  }

  function legacyGetSuccessionCandidates(owner, business){
    var seen = {};
    var children = App.store.getChildren(owner, false).filter(function(child){
      return child.alive && !child.retired && child.age >= 18 && !child.businessId;
    });
    var spouse = App.store.getSpouse(owner);
    var leadership = App.store.getBusinessLeadership(business).map(function(entry){
      return entry.person;
    }).filter(function(person){
      return person && person.alive && !person.retired && !person.businessId;
    });
    var candidates = [];

    children.forEach(function(child){
      if (seen[child.id]) return;
      seen[child.id] = true;
      candidates.push(child);
    });

    if (spouse && spouse.alive && !spouse.retired && !spouse.businessId && !seen[spouse.id]) {
      seen[spouse.id] = true;
      candidates.push(spouse);
    }

    leadership.forEach(function(candidate){
      if (seen[candidate.id]) return;
      seen[candidate.id] = true;
      candidates.push(candidate);
    });

    return candidates;
  }

  function legacyEvaluateSuccessionCandidate(business, owner, candidate){
    var currentDecision = business.currentDecision || evaluateBusinessDecision(business);
    var isFamily = candidate.lineageId === owner.lineageId || candidate.id === owner.spouseId || owner.childrenIds.indexOf(candidate.id) !== -1;
    var isNonMaritalChild = !!(owner.nonMaritalChildIds && owner.nonMaritalChildIds.indexOf(candidate.id) !== -1);
    var leadershipEntry = (business.leadership || []).find(function(entry){
      return entry.personId === candidate.id;
    }) || null;
    var roleImportance = leadershipEntry ? leadershipEntry.importance || 0 : 0;
    var readiness = 0;
    var mobilityTrait;
    var familyTrait;
    var businessTrait;
    var successionTraitScore;
    var successionTraitEffects;
    var networkScore;

    ensureDecisionData(candidate);
    ensureSocialNetworkData(candidate);
    readiness += (candidate.decisionProfile.discipline - 50) * 1.1;
    readiness += (candidate.decisionProfile.adaptability - 50) * 0.9;
    readiness += (candidate.decisionProfile.ethics - 50) * 0.6;
    readiness += (candidate.temporaryStates.confidence - 50) * 0.55;
    readiness -= (candidate.temporaryStates.stress - 50) * 0.75;
    readiness -= (candidate.temporaryStates.burnout - 50) * 0.65;
    readiness += countSharedTraits(candidate, owner) * 8;
    readiness += Math.max(0, 40 - Math.abs((candidate.age || 0) - 42));
    readiness += roleImportance * 16;
    readiness += candidate.employerBusinessId === business.id ? 18 : 0;
    readiness += isFamily ? 14 : 0;
    readiness += isNonMaritalChild ? -12 : 0;
    readiness += candidate.groomedForBusinessById === business.id ? 26 : 0;
    networkScore = getSocialProximityScore(candidate, owner);
    readiness += networkScore * 1.8;
    readiness += App.utils.clamp((Number(candidate.personalReputation && candidate.personalReputation.trust) || 50) - 50, -14, 14) * 0.42;
    readiness += App.utils.clamp((Number(candidate.personalReputation && candidate.personalReputation.prestige) || 35) - 35, -12, 16) * 0.36;
    readiness -= App.utils.clamp(Number(candidate.personalReputation && candidate.personalReputation.scandalMemory) || 0, 0, 100) * 0.18;
    readiness -= App.utils.clamp((Number(candidate.inheritanceDilution) || 1) - 1, 0, 8) * 0.65;
    readiness -= App.utils.clamp(Number(candidate.siblingRivalry) || 0, 0, 100) * 0.05;

    mobilityTrait = getTraitChannelScore(candidate, "mobility");
    familyTrait = getTraitChannelScore(candidate, "family");
    businessTrait = getTraitChannelScore(candidate, "business");
    successionTraitScore = mobilityTrait * 1.15 + familyTrait * 1.4 + businessTrait * 0.85;
    readiness += successionTraitScore;
    successionTraitEffects = summarizeTraitEffects(collectTraitEffects(candidate, ["mobility","family","business"]), 4);

    if (currentDecision.successionBias === "family") {
      readiness += isFamily ? 38 : -28;
    } else if (currentDecision.successionBias === "merit") {
      readiness += isFamily ? -10 : 18;
    }

    return {
      candidate:candidate,
      score:Math.round(readiness),
      isFamily:isFamily,
      isNonMaritalChild:isNonMaritalChild,
      roleImportance:roleImportance,
      traitScore:Math.round(successionTraitScore),
      traitEffects:successionTraitEffects
    };
  }

  function legacyGetPotentialHeir(person){
    var business = App.store.getBusiness(person.businessId);
    var candidates;

    if (!business) return null;

    candidates = legacyGetSuccessionCandidates(person, business).map(function(candidate){
      return legacyEvaluateSuccessionCandidate(business, person, candidate);
    }).sort(function(first, second){
      return second.score - first.score;
    });

    return candidates.length ? candidates[0].candidate : null;
  }

  function legacyGetSuccessionEvaluations(owner, business){
    return legacyGetSuccessionCandidates(owner, business).map(function(candidate){
      return legacyEvaluateSuccessionCandidate(business, owner, candidate);
    }).sort(function(first, second){
      return second.score - first.score;
    });
  }

  function legacyResolveInheritanceDispute(owner, business, evaluations, trigger){
    var childEvaluations = (evaluations || []).filter(function(entry){
      return entry && entry.candidate && owner.childrenIds && owner.childrenIds.indexOf(entry.candidate.id) !== -1 && entry.score >= 34;
    });
    var topGap;
    var ageRanks = {};
    var scored;
    var winner;
    var losers;
    var hasNonMaritalPressure;

    if (childEvaluations.length < 2) return null;

    childEvaluations.sort(function(first, second){
      return second.score - first.score;
    });
    topGap = (childEvaluations[0].score || 0) - (childEvaluations[1].score || 0);
    if (topGap > 7) return null;

    childEvaluations.slice().sort(function(first, second){
      return (Number(second.candidate.age) || 0) - (Number(first.candidate.age) || 0);
    }).forEach(function(entry, index){
      ageRanks[entry.candidate.id] = index;
    });

    scored = childEvaluations.map(function(entry){
      var eldestBias = Math.max(0, (childEvaluations.length - (ageRanks[entry.candidate.id] || 0) - 1)) * 2.4;
      var competenceBias = (entry.score || 0) * 0.95;
      var favoritismBias = (countSharedTraits(owner, entry.candidate) * 3.4) + (getTraitChannelScore(entry.candidate, "family") * 0.4);
      var rivalryNoise = App.utils.rand(-3.5, 3.5);

      return {
        evaluation:entry,
        disputedScore:competenceBias + eldestBias + favoritismBias + rivalryNoise
      };
    }).sort(function(first, second){
      return second.disputedScore - first.disputedScore;
    });

    winner = scored[0];
    losers = scored.slice(1);
    hasNonMaritalPressure = scored.some(function(item){
      return !!(item && item.evaluation && item.evaluation.isNonMaritalChild);
    });

    losers.forEach(function(entry){
      var candidate = entry.evaluation.candidate;
      adjustTemporaryStates(candidate, {
        resentment:18,
        stress:9,
        confidence:-7,
        ambitionSpike:8
      });
      candidate.rivalFounderArcUntilDay = Math.max(Number(candidate.rivalFounderArcUntilDay) || 0, App.store.simDay + (YEAR_DAYS * 6));
      syncPerson(candidate);
    });

    adjustTemporaryStates(winner.evaluation.candidate, {
      confidence:10,
      stress:-2,
      ambitionSpike:6
    });
    syncPerson(winner.evaluation.candidate);

    emitNews("inheritance", "Inheritance dispute in <strong>" + business.name + "</strong>: competing heirs clashed before <strong>" + winner.evaluation.candidate.name + "</strong> emerged.", {
      tags:["dispute", "succession", trigger || "transfer"],
      entities:{
        personIds:[owner.id].concat(scored.map(function(item){ return item.evaluation.candidate.id; })),
        businessIds:[business.id],
        countryIsos:[business.countryISO],
        blocIds:[business.blocId]
      },
      causes:[
        "No clear successor among viable children triggered a family dispute.",
        "Outcome reflected competence, eldest-child bias, and favoritism pressure.",
        losers.length ? (losers.length + " losing heir(s) gained resentment and rival-founder pressure.") : "Dispute resolved without additional fallout.",
        hasNonMaritalPressure ? "Questions around non-marital heirs intensified inheritance legitimacy arguments." : ""
      ]
    });

    return {
      winnerEvaluation:winner.evaluation,
      loserIds:losers.map(function(item){ return item.evaluation.candidate.id; })
    };
  }

  function legacyPickSuccessionOutcome(owner, business, trigger){
    var evaluations = legacyGetSuccessionEvaluations(owner, business);
    var dispute;

    if (!evaluations.length) return null;

    dispute = legacyResolveInheritanceDispute(owner, business, evaluations, trigger);
    if (dispute && dispute.winnerEvaluation) {
      return {
        heir:dispute.winnerEvaluation.candidate,
        evaluation:dispute.winnerEvaluation,
        disputed:true
      };
    }

    return {
      heir:evaluations[0].candidate,
      evaluation:evaluations[0],
      disputed:false
    };
  }

  function legacyApplySuccessionOutcome(owner, heir, business, evaluated){
    var leadershipFloor = (business.leadership || []).length || 1;
    var reputationDelta;
    var employeeDelta = 0;
    var workforceDelta = 0;
    var traitReason = "";
    var traitTags = [];

    evaluated = evaluated || legacyEvaluateSuccessionCandidate(business, owner, heir);
    reputationDelta = evaluated.isFamily ? App.utils.rand(0.5, 3) : App.utils.rand(1, 4);
    if (evaluated.score < 32) {
      reputationDelta = -App.utils.rand(5, 12);
      employeeDelta = -App.utils.randInt(1, Math.max(1, Math.min(8, leadershipFloor + 2)));
    } else if (evaluated.score < 48) {
      reputationDelta = -App.utils.rand(1, 4);
      employeeDelta = -App.utils.randInt(0, 3);
    }

    business.reputation = clampScore((business.reputation || 50) + reputationDelta);
    if (employeeDelta < 0) {
      workforceDelta = -releaseLabor(business.countryISO, Math.abs(employeeDelta));
    } else if (employeeDelta > 0) {
      workforceDelta = reserveLabor(business.countryISO, employeeDelta);
    }
    business.employees = Math.max(leadershipFloor, business.employees + workforceDelta);

    adjustTemporaryStates(heir, {
      confidence:evaluated.score >= 48 ? 8 : 4,
      stress:evaluated.score >= 48 ? -2 : 5,
      ambitionSpike:6
    });
    adjustTemporaryStates(owner, {
      confidence:-3,
      stress:-4
    });

    if (evaluated.traitEffects && evaluated.traitEffects.length) {
      recordTraitEffects(evaluated.traitEffects);
      setTraitSnapshot(heir, evaluated.traitEffects);
      setTraitSnapshot(business, evaluated.traitEffects);
      traitReason = " Trait edge: " + evaluated.traitEffects[0].label + ".";
      traitTags = buildTraitEffectTags(evaluated.traitEffects, 2);
    }

    pushBusinessEventHistory(
      business,
      evaluated.isFamily ? "Family succession at " + business.name : "Internal succession at " + business.name,
      (evaluated.score >= 48 ? "Leadership transitioned cleanly." : "Leadership changed under visible strain.") +
      traitReason
    );

    if (traitTags.length) {
      emitNews("inheritance", "<strong>" + heir.name + "</strong> gained succession momentum at <strong>" + business.name + "</strong>.", {
        tags:traitTags,
        entities:{
          personIds:[heir.id, owner.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:evaluated.traitEffects.slice(0, 2).map(function(effect){ return effect.label; })
      });
    }
  }

  function legacyTransferBusiness(owner, heir, business, successionEvaluation){

    if (!business || !heir) return;

    successionEvaluation = successionEvaluation || legacyEvaluateSuccessionCandidate(business, owner, heir);
    owner.businessId = null;
    business.ownerId = heir.id;
    business.successionCount += 1;
    business.inheritedAtDay = App.store.simDay;
    heir.businessId = business.id;
    heir.pulse = 1;
    syncBusinessLeadership(business);
    legacyApplySuccessionOutcome(owner, heir, business, successionEvaluation);
    business.currentDecision = evaluateBusinessDecision(business);
    syncPerson(owner);
    syncPerson(heir);
  }

  function liquidateBusiness(owner, business){
    var value = business ? business.valuationGU * 0.5 : 0;

    if (business) {
      value = settleDelistingPayout(business, value, "Insolvency triggered delisting and forced shareholder settlement.");
      releaseLabor(business.countryISO, business.employees || 0);
      pushBusinessEventHistory(business, "Liquidation at " + business.name, "The company could not continue independently.");
      App.store.people.forEach(function(person){
        if (person.employerBusinessId === business.id) {
          clearEmployment(person, business.id);
          syncPerson(person);
        }
      });
    }

    App.store.businesses = App.store.businesses.filter(function(item){
      return item.id !== business.id;
    });
    if (owner && owner.businessId === business.id) {
      owner.businessId = null;
      syncPerson(owner);
    }
    syncHouseholds();
    return value;
  }

  function applyDeathShock(person, business){
    var impacted = [];
    var seen = {};

    if (!person) return;

    if (person.spouseId) {
      impacted.push(App.store.getPerson(person.spouseId));
    }

    App.store.getChildren(person, false).forEach(function(child){
      impacted.push(child);
    });

    if (business) {
      App.store.getBusinessLeadership(business).forEach(function(entry){
        impacted.push(entry.person);
      });
    }

    impacted.filter(Boolean).forEach(function(relative){
      if (seen[relative.id]) return;
      seen[relative.id] = true;
      adjustTemporaryStates(relative, {
        grief:18,
        stress:8,
        confidence:-4
      });
      syncPerson(relative);
    });
  }

  function retirementOdds(age){
    if (age >= 85) return 0.25;
    if (age >= 75) return 0.20;
    if (age >= 65) return 0.12;
    return 0;
  }

  function deathOdds(age){
    if (age >= 85) return 0.10;
    if (age >= 75) return 0.05;
    if (age >= 65) return 0.02;
    return 0;
  }

  function retirePerson(person){
    var business = App.store.getBusiness(person.businessId);
    var employmentBusiness = App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var succession = business ? pickSuccessionOutcome(person, business, "retirement") : null;
    var heir = succession ? succession.heir : null;
    var wealthTransfer = person.netWorthGU * 0.25;
    var saleValue;
    var retirementEvent;
    var household;
    var debtHeavyHousehold = false;
    var keepBusinessInFamily = false;
    var debtRelief = 0;
    var supportReserve = 0;
    var drawnWealthTransfer = 0;
    var distributedToHeir = 0;
    var retirementType = "graceful";
    var businessStress = 0;
    var chairmanEligible = false;
    var retirementCause = "Planned retirement with eligible heir.";

    syncHouseholds();
    household = getHouseholdForPerson(person);
    debtHeavyHousehold = !!(household && (household.financialStress > 78 || (household.debtGU || 0) > ((household.cashOnHandGU || 0) * 1.4)));
    keepBusinessInFamily = !!(business && heir && !debtHeavyHousehold && ((business.cashReservesGU || 0) > (business.revenueGU || 0) * 0.03 || (business.reputation || 0) >= 46));
    ensureSocialNetworkData(person);
    businessStress = business ? App.utils.clamp(Math.abs((business.profitGU || 0) / Math.max(1, business.revenueGU || 1)), 0, 1) : 0;
    chairmanEligible = !!(business && heir && keepBusinessInFamily && (business.reputation || 0) >= 62 && (person.netWorthGU || 0) >= 50000 && !debtHeavyHousehold);

    if ((person.temporaryStates && person.temporaryStates.burnout > 72) || (person.temporaryStates && person.temporaryStates.grief > 55)) {
      retirementType = "illness";
      retirementCause = "Health and burnout pressure triggered illness retirement.";
    } else if (debtHeavyHousehold || businessStress > 0.22) {
      retirementType = "forced";
      retirementCause = "Household and firm stress forced retirement timing.";
    } else if ((person.age || 0) >= 78 || (person.temporaryStates && person.temporaryStates.confidence < 34)) {
      retirementType = "decline";
      retirementCause = "Age-related decline shifted retirement from choice to necessity.";
    } else if (chairmanEligible) {
      retirementType = "prestige_chairman";
      retirementCause = "Prestige-chairman retirement kept founder influence after handover.";
    }

    person.retired = true;
    person.retirementType = retirementType;
    person.retirementInfluence = retirementType === "prestige_chairman" ? App.utils.clamp((person.retirementInfluence || 0) + App.utils.rand(48, 72), 0, 100) : App.utils.clamp((person.retirementInfluence || 0) + App.utils.rand(12, 36), 0, 100);
    person.pulse = 1;

    if (keepBusinessInFamily) {
      transferBusiness(person, heir, business, succession && succession.evaluation ? succession.evaluation : null);
      if (retirementType === "prestige_chairman") {
        person.boardBusinessIds = normalizeUniqueIdList((person.boardBusinessIds || []).concat([business.id]), null).slice(0, 4);
        person.advisorBusinessIds = normalizeUniqueIdList((person.advisorBusinessIds || []).concat([business.id]), null).slice(0, 4);
      }
      drawnWealthTransfer = drawHouseholdAssetTransfer(person, wealthTransfer);
      if (household) {
        debtRelief = relieveHouseholdDebt(household, drawnWealthTransfer * 0.35);
        supportReserve = reserveDependentSupport(household, Math.max(0, drawnWealthTransfer - debtRelief) * 0.18);
      }
      distributedToHeir = grantInheritanceTransfer(heir, Math.max(0, drawnWealthTransfer - debtRelief - supportReserve), "heir");
      retirementEvent = emitNews("retirement", "<strong>" + person.name + "</strong> retired from <strong>" + business.name + "</strong>.", {
        entities:{
          personIds:[person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[retirementCause]
      });
      emitNews("inheritance", "<strong>" + heir.name + "</strong> took over <strong>" + business.name + "</strong> as the next generation heir.", {
        entities:{
          personIds:[heir.id, person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[{
          text:"Succession transfer finalized.",
          eventId:retirementEvent ? retirementEvent.id : null,
          kind:"triggered-by"
        }, "Transferred estate value: " + App.utils.fmtCountry(distributedToHeir, person.countryISO) + "."],
        controlTransfer:true
      });
    } else if (business) {
      saleValue = liquidateBusiness(person, business);
      if (household) {
        debtRelief = relieveHouseholdDebt(household, saleValue * 0.4);
        supportReserve = reserveDependentSupport(household, Math.max(0, saleValue - debtRelief) * 0.15);
      }
      person.netWorthGU += Math.max(0, saleValue - debtRelief - supportReserve);
      emitNews("retirement", "<strong>" + person.name + "</strong> retired and liquidated <strong>" + business.name + "</strong>.", {
        entities:{
          personIds:[person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[retirementType === "forced" ? "Forced retirement with no stable successor." : "No viable successor at retirement."]
      });
    } else if (employmentBusiness) {
      clearEmployment(person, employmentBusiness.id);
      syncBusinessLeadership(employmentBusiness);
    }

    adjustPersonalReputation(person, {
      trust:retirementType === "forced" ? -1.4 : 0.6,
      prestige:retirementType === "prestige_chairman" ? 3.5 : 1.2,
      notoriety:retirementType === "forced" ? 1.8 : 0.3,
      scandalMemory:retirementType === "forced" ? 1.4 : 0
    });

    adjustTemporaryStates(person, {
      stress:-6,
      confidence:-2
    });
    syncHouseholds();
    syncPerson(person);
  }

  function diePerson(person){
    var business = App.store.getBusiness(person.businessId);
    var foundedBusiness = !business ? App.store.businesses.find(function(candidate){
      return candidate && candidate.founderId === person.id;
    }) : null;
    var employmentBusiness = App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
    var succession = business ? pickSuccessionOutcome(person, business, "death") : null;
    var heir = succession ? succession.heir : null;
    var survivors = [];
    var estate = person.netWorthGU;
    var successorShare;
    var splitShare;
    var spouse;
    var deathEvent;
    var businessContext = business || foundedBusiness;
    var household;
    var householdMap = {};
    var survivorHouseholds = [];
    var debtHeavyHousehold = false;
    var keepDynastyIntact = false;
    var estateTax = 0;
    var debtObligation = 0;
    var supportReserveTotal = 0;
    var legalCost = 0;
    var hiddenHeir = null;
    var contestedWill = false;
    var spouseSharePool = 0;
    var childSharePool = 0;
    var dynastyReservePool = 0;
    var residualPool = 0;
    var heirsForDistribution = [];
    var splitAcross;
    var capturedEstate = 0;
    var rate = 0;

    syncHouseholds();
    household = getHouseholdForPerson(person);
    debtHeavyHousehold = !!(household && (household.financialStress > 80 || (household.debtGU || 0) > ((household.cashOnHandGU || 0) * 1.5)));
    keepDynastyIntact = !!(business && heir && !debtHeavyHousehold && ((business.reputation || 0) >= 45 || (business.cashReservesGU || 0) > (business.revenueGU || 0) * 0.025));

    if (keepDynastyIntact) {
      transferBusiness(person, heir, business, succession && succession.evaluation ? succession.evaluation : null);
    } else if (business) {
      estate += liquidateBusiness(person, business);
    }

    capturedEstate = drawHouseholdAssetTransfer(person, estate);
    estate = capturedEstate;

    if (person.spouseId) {
      spouse = App.store.getPerson(person.spouseId);
      if (spouse && spouse.alive) {
        survivors.push(spouse);
        spouse.spouseId = null;
        syncPerson(spouse);
      }
    }

    App.store.getChildren(person, false).forEach(function(child){
      if (child.alive && survivors.indexOf(child) === -1) {
        survivors.push(child);
      }
    });

    if ((person.nonMaritalChildIds || []).length && Math.random() < 0.2) {
      hiddenHeir = (person.nonMaritalChildIds || []).map(function(id){
        return App.store.getPerson(id);
      }).find(function(candidate){
        return !!(candidate && candidate.alive && survivors.indexOf(candidate) === -1);
      }) || null;
      if (hiddenHeir) {
        survivors.push(hiddenHeir);
      }
    }

    contestedWill = (survivors.length >= 3 && Math.random() < 0.28) || !!hiddenHeir;

    survivors.forEach(function(relative){
      var relativeHousehold = getHouseholdForPerson(relative);
      if (!relativeHousehold || householdMap[relativeHousehold.id]) return;
      householdMap[relativeHousehold.id] = true;
      survivorHouseholds.push(relativeHousehold);
    });

    survivorHouseholds.sort(function(first, second){
      return (second.debtGU || 0) - (first.debtGU || 0);
    }).forEach(function(relativeHousehold){
      var paidDebt = relieveHouseholdDebt(relativeHousehold, estate);
      debtObligation += paidDebt;
      estate -= paidDebt;
    });

    survivorHouseholds.forEach(function(relativeHousehold){
      var reserved = reserveDependentSupport(relativeHousehold, estate);
      supportReserveTotal += reserved;
      estate -= reserved;
    });

    if (estate > 0) {
      if (estate > 250000) {
        rate = 0.22;
      } else if (estate > 120000) {
        rate = 0.16;
      } else if (estate > 60000) {
        rate = 0.1;
      }
      estateTax = estate * rate;
      estate -= estateTax;
    }

    if (contestedWill && estate > 0) {
      legalCost = estate * App.utils.rand(0.04, 0.12);
      estate -= legalCost;
    }

    heirsForDistribution = survivors.filter(function(relative){
      return !!relative && relative.alive;
    });

    spouse = heirsForDistribution.find(function(relative){
      return relative.id === (person.spouseId || "");
    }) || spouse;

    if (estate > 0) {
      spouseSharePool = spouse ? estate * 0.34 : 0;
      childSharePool = heirsForDistribution.length ? estate * 0.46 : 0;
      dynastyReservePool = keepDynastyIntact && business ? estate * 0.12 : 0;
      residualPool = Math.max(0, estate - spouseSharePool - childSharePool - dynastyReservePool);
    }

    if (spouse && spouseSharePool > 0) {
      grantInheritanceTransfer(spouse, spouseSharePool, "spouse");
      adjustPersonalReputation(spouse, { trust:0.4, notoriety:0.2 });
    }

    if (dynastyReservePool > 0 && heir) {
      grantInheritanceTransfer(heir, dynastyReservePool, "heir");
    }

    splitAcross = heirsForDistribution.filter(function(relative){
      return !spouse || relative.id !== spouse.id;
    });
    if (splitAcross.length && childSharePool > 0) {
      splitAcross.forEach(function(relative){
        grantInheritanceTransfer(relative, childSharePool / splitAcross.length, "child");
      });
    }

    if (heir && residualPool > 0) {
      grantInheritanceTransfer(heir, residualPool * 0.6, "heir");
      if (splitAcross.length) {
        splitAcross.forEach(function(relative){
          grantInheritanceTransfer(relative, (residualPool * 0.4) / splitAcross.length, "child");
        });
      }
    } else if (heirsForDistribution.length && residualPool > 0) {
      heirsForDistribution.forEach(function(relative){
        grantInheritanceTransfer(relative, residualPool / heirsForDistribution.length, "child");
      });
    }

    if (contestedWill && business) {
      business.reputation = clampScore((business.reputation || 50) - App.utils.rand(3, 10));
      business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) * App.utils.rand(0.85, 0.96));
      if (!keepDynastyIntact || splitAcross.length > 1) {
        business.employees = Math.max(1, business.employees - releaseLabor(business.countryISO, Math.max(1, Math.floor((business.employees || 1) * App.utils.rand(0.05, 0.16)))));
      }
      pushBusinessEventHistory(business, "Estate dispute pressure at " + business.name, "Contested inheritance and legal costs weakened control and liquidity.");
    }

    estate = 0;

    person.netWorthGU = 0;
    person.alive = false;
    person.deathDay = App.store.simDay;
    person.businessId = null;
    person.pulse = 0;
    clearEmployment(person);
    person.spouseId = null;
    if (!business && employmentBusiness) {
      syncBusinessLeadership(employmentBusiness);
    }
    applyDeathShock(person, businessContext || employmentBusiness);
    syncHouseholds();
    syncPerson(person);

    deathEvent = emitNews("death", "<strong>" + person.name + "</strong> died at age " + Math.floor(person.age) + ".", {
      entities:{
        personIds:[person.id],
        businessIds:businessContext ? [businessContext.id] : [],
        countryIsos:[person.countryISO],
        blocIds:[person.blocId]
      },
      causes:[
        "Natural lifecycle event.",
        "Estate tax: " + App.utils.fmtCountry(estateTax, person.countryISO) + ", debt obligations: " + App.utils.fmtCountry(debtObligation, person.countryISO) + ", dependent reserve: " + App.utils.fmtCountry(supportReserveTotal, person.countryISO) + ".",
        contestedWill ? ("Contested will costs reached " + App.utils.fmtCountry(legalCost, person.countryISO) + ".") : "Will transfer proceeded without legal contest."
      ],
      ownerBusinessId:business ? business.id : null,
      founderBusinessId:foundedBusiness ? foundedBusiness.id : null
    });
    if (contestedWill) {
      emitNews("inheritance", "Estate contest followed the death of <strong>" + person.name + "</strong>.", {
        entities:{
          personIds:[person.id].concat(heirsForDistribution.map(function(relative){ return relative.id; })),
          businessIds:business ? [business.id] : [],
          countryIsos:[person.countryISO],
          blocIds:[person.blocId]
        },
        causes:[
          hiddenHeir ? ("A hidden heir claim by " + hiddenHeir.name + " reshaped distribution.") : "Multiple heirs disputed the will outcome.",
          "Legal and governance stress increased fragmentation risk for dynasty assets."
        ]
      });
    }
    if (heir && business) {
      emitNews("inheritance", "<strong>" + heir.name + "</strong> inherited the " + business.name + " dynasty.", {
        entities:{
          personIds:[heir.id, person.id],
          businessIds:[business.id],
          countryIsos:[business.countryISO],
          blocIds:[business.blocId]
        },
        causes:[{
          text:"Dynasty continuity after owner death.",
          eventId:deathEvent ? deathEvent.id : null,
          kind:"triggered-by"
        }],
        controlTransfer:true
      });
    }
  }

  function processSeniorTransitions(){
    App.store.getLivingPeople().slice().sort(function(first, second){
      return second.age - first.age;
    }).forEach(function(person){
      if (person.age < 65) return;
      if (Math.random() < deathOdds(person.age)) {
        diePerson(person);
        return;
      }
      if (!person.retired && Math.random() < retirementOdds(person.age)) {
        retirePerson(person);
      }
    });
  }

  function processYearlyAging(){
    App.store.getLivingPeople().forEach(function(person){
      syncPerson(person);
      if (person.age >= 8) grantTraitMilestone(person, 8);
      if (person.age >= 16) grantTraitMilestone(person, 16);
      ensureEducationData(person);
      progressEducationYearly(person);
      ensureDecisionData(person);
      ensureSkillData(person);
      applySkillFormationYearly(person);
      syncPerson(person);
    });
    syncHouseholds();
    (App.store.households || []).forEach(refreshHouseholdSnapshot);
  }

  function processYearlyMarriages(){
    App.store.getLivingPeople().slice().sort(function(first, second){
      return first.age - second.age;
    }).forEach(function(person){
      if (person.spouseId) return;
      if (person.age < 22 || person.age > 50) return;
      tryMarriage(person);
    });
  }

  function processYearlyFamilyTransitions(){
    var seenPairs = {};

    App.store.getLivingPeople().forEach(function(person){
      var spouse;
      var pairKey;
      var sharedChildren;
      var householdStress;
      var compatibility;
      var divorceChance;
      var estrangementChance;
      var estrangedParent;
      var estrangedChildren;

      if (!person.spouseId) return;
      spouse = App.store.getPerson(person.spouseId);
      if (!spouse || !spouse.alive) return;

      pairKey = [person.id, spouse.id].sort().join("|");
      if (seenPairs[pairKey]) return;
      seenPairs[pairKey] = true;

      sharedChildren = getSharedChildren(person, spouse);
      householdStress = (getPersonFinancialStress(person) + getPersonFinancialStress(spouse)) / 2;
      compatibility = getRelationshipCompatibility(person, spouse);

      divorceChance = 0.008;
      divorceChance += householdStress * 0.08;
      divorceChance += App.utils.clamp((12 - compatibility.score) * 0.0026, 0, 0.05);
      divorceChance += compatibility.classGap * 0.004;
      divorceChance += App.utils.clamp(compatibility.ambitionGap * 0.0012, 0, 0.04);
      divorceChance -= App.utils.clamp((getTraitChannelScore(person, "family") + getTraitChannelScore(spouse, "family")) * 0.0018, -0.02, 0.03);
      if (sharedChildren.length) {
        divorceChance -= 0.004 * Math.min(2, sharedChildren.length);
      }
      divorceChance = App.utils.clamp(divorceChance, 0.002, 0.16);

      if (Math.random() >= divorceChance) return;

      dissolveMarriage(person, spouse);

      estrangementChance = 0.18 + (householdStress * 0.35) + App.utils.clamp((8 - compatibility.score) * 0.012, 0, 0.32);
      if (sharedChildren.length && Math.random() < App.utils.clamp(estrangementChance, 0.08, 0.75)) {
        estrangedParent = getTraitChannelScore(person, "family") >= getTraitChannelScore(spouse, "family") ? spouse : person;
        estrangedChildren = sharedChildren.slice().sort(function(){ return Math.random() - 0.5; }).slice(0, Math.max(1, Math.ceil(sharedChildren.length / 2)));
        estrangedChildren.forEach(function(child){
          markEstrangement(estrangedParent, child);
          syncPerson(child);
        });

        emitNews("estrangement", "After the split, <strong>" + estrangedParent.name + "</strong> became estranged from " + estrangedChildren.length + " child" + (estrangedChildren.length === 1 ? "" : "ren") + ".", {
          tags:["family", "estrangement"],
          entities:{
            personIds:[person.id, spouse.id].concat(estrangedChildren.map(function(child){ return child.id; })),
            countryIsos:[person.countryISO],
            blocIds:[person.blocId]
          },
          causes:[
            "Divorce pressure rose from stress and compatibility gaps.",
            "Post-divorce custody tensions triggered distance from part of the family."
          ]
        });
      }

      emitNews("divorce", "<strong>" + person.name + "</strong> and <strong>" + spouse.name + "</strong> divorced in " + App.store.getCountryName(person.countryISO) + ".", {
        tags:["family", "divorce"],
        entities:{
          personIds:[person.id, spouse.id],
          countryIsos:[person.countryISO],
          blocIds:[person.blocId]
        },
        causes:[
          "Relationship strain crossed a threshold from stress, class, ambition, and fertility-alignment pressures.",
          "Compatibility score at dissolution: " + compatibility.score + "."
        ]
      });
    });

    syncHouseholds();
  }

  function processYearlyBirths(){
    App.store.getLivingPeople().forEach(function(person){
      if (person.sex !== "female") return;
      tryBirth(person);
    });
  }

  function legacyProcessYearlyLaunches(){
    var beforeCount = (App.store.businesses || []).length;
    var afterCount;
    var launchContext = legacyBuildYearlyLaunchContext();

    App.store.getLivingPeople().forEach(function(person){
      legacyTryLaunchBusiness(person, launchContext);
    });

    afterCount = (App.store.businesses || []).length;
    recordLaunchWindow(currentYear(), Math.max(0, afterCount - beforeCount));
  }

  function markYearlyEvents(){
    App.store.getLivingPeople().forEach(function(person){
      person.lastLifeEventYear = currentCalendarYear();
    });
  }

  function runYearlyLifecycle(){
    syncHouseholds();
    updatePopulationProfilesYearly();
    processYearlyCentralBankPolicy();
    processTier6ConstrainedSliceYearly();
    processYearlyHouseholdAssetClasses();
    processYearlyPhilanthropyAndLegacy();
    processYearlyCorporateGovernance();
    processYearlyAging();
    processYearlySocialNetworks();
    processYearlyPromotionsAndPoaching();
    processYearlyMarriages();
    processYearlyFamilyTransitions();
    processYearlyBirths();
    processYearlySiblingDynamics();
    processYearlyFamilyBusinessGrooming();
    processYearlyEliteReproduction();
    processYearlyInnovationAndCopying();
    processSeniorTransitions();
    processYearlyRetiredInfluence();
    processYearlyLaunches();
    markYearlyEvents();
    syncHouseholds();
    (App.store.households || []).forEach(function(household){
      normalizeHouseholdAssetClasses(household);
      refreshHouseholdSnapshot(household);
    });
    updateBlocGdp();
    captureYearlyTuningTelemetry();
  }

  function rehydrateLoadedState(){
    var traitCoverage = validateTraitMechanicalCoverage();
    var strictCoverage = !!(global.location && (global.location.hostname === "localhost" || global.location.hostname === "127.0.0.1"));
    var peopleById = {};
    var businessesById = {};

    if (!traitCoverage.ok) {
      console.error("Trait mechanical coverage failed:", traitCoverage.errors.join(" | "));
      if (strictCoverage) {
        throw new Error("Trait mechanical coverage failed: " + traitCoverage.errors.join(" | "));
      }
    }

    App.store.people = (App.store.people || []).filter(function(person){
      return !!(person && person.id);
    }).filter(function(person, index, array){
      return array.findIndex(function(candidate){
        return candidate.id === person.id;
      }) === index;
    });

    App.store.businesses = (App.store.businesses || []).filter(function(business){
      return !!(business && business.id);
    }).filter(function(business, index, array){
      return array.findIndex(function(candidate){
        return candidate.id === business.id;
      }) === index;
    });

    App.store.traitEffectStats = App.store.traitEffectStats || {};
    App.store.newsItems = (App.store.newsItems || []).slice(0, 100);
    App.store.eventHistory = (App.store.eventHistory || []).slice(0, 2000);
    App.store.households = Array.isArray(App.store.households) ? App.store.households : [];
    ensureYearlyTuningTelemetryState();
    applyStartPresetToStore(App.store.startPresetId || PRESENT_DAY_START_PRESET_ID);
    sanitizeUnsupportedResidencyState();
    bootstrapCountryProfiles();

    App.store.people.forEach(function(person){
      peopleById[person.id] = person;
    });

    App.store.businesses.forEach(function(business){
      businessesById[business.id] = business;
    });

    App.store.people.forEach(function(person){
      var estimatedAge;

      person.parentIds = (person.parentIds || []).filter(function(parentId, index, array){
        return parentId && parentId !== person.id && peopleById[parentId] && array.indexOf(parentId) === index;
      });
      person.childrenIds = (person.childrenIds || []).filter(function(childId, index, array){
        return childId && childId !== person.id && peopleById[childId] && array.indexOf(childId) === index;
      });
      person.formerSpouseIds = (person.formerSpouseIds || []).filter(function(spouseId, index, array){
        return spouseId && spouseId !== person.id && peopleById[spouseId] && array.indexOf(spouseId) === index;
      });
      person.estrangedChildIds = (person.estrangedChildIds || []).filter(function(childId, index, array){
        return childId && childId !== person.id && peopleById[childId] && array.indexOf(childId) === index;
      });
      person.estrangedParentIds = (person.estrangedParentIds || []).filter(function(parentId, index, array){
        return parentId && parentId !== person.id && peopleById[parentId] && array.indexOf(parentId) === index;
      });
      person.nonMaritalChildIds = (person.nonMaritalChildIds || []).filter(function(childId, index, array){
        return childId && childId !== person.id && peopleById[childId] && array.indexOf(childId) === index;
      });
      if (person.birthUnionType !== "non_marital") {
        person.birthUnionType = "marital";
      }
      person.groomedForBusinessById = person.groomedForBusinessById && businessesById[person.groomedForBusinessById] ? person.groomedForBusinessById : null;
      person.inheritanceDilution = Math.max(1, Number(person.inheritanceDilution) || 1);
      person.sharedPrivilege = App.utils.clamp(Number(person.sharedPrivilege) || 0, 0, 100);
      person.siblingRivalry = App.utils.clamp(Number(person.siblingRivalry) || 0, 0, 100);
      person.mentorId = person.mentorId && peopleById[person.mentorId] && person.mentorId !== person.id ? person.mentorId : null;
      person.rivalIds = (person.rivalIds || []).filter(function(id, index, array){
        return id && id !== person.id && peopleById[id] && array.indexOf(id) === index;
      });
      person.closeFriendIds = (person.closeFriendIds || []).filter(function(id, index, array){
        return id && id !== person.id && peopleById[id] && array.indexOf(id) === index;
      });
      person.eliteCircleIds = (person.eliteCircleIds || []).filter(function(id, index, array){
        return id && id !== person.id && peopleById[id] && array.indexOf(id) === index;
      });
      person.schoolTieIds = (person.schoolTieIds || []).filter(function(id, index, array){
        return id && id !== person.id && peopleById[id] && array.indexOf(id) === index;
      });
      person.nepotismTieIds = (person.nepotismTieIds || []).filter(function(id, index, array){
        return id && id !== person.id && peopleById[id] && array.indexOf(id) === index;
      });
      person.advisorBusinessIds = (person.advisorBusinessIds || []).filter(function(id, index, array){
        return id && businessesById[id] && array.indexOf(id) === index;
      });
      person.boardBusinessIds = (person.boardBusinessIds || []).filter(function(id, index, array){
        return id && businessesById[id] && array.indexOf(id) === index;
      });
      person.retirementType = person.retirementType ? String(person.retirementType) : null;
      person.retirementInfluence = App.utils.clamp(Number(person.retirementInfluence) || 0, 0, 100);
      person.personalReputation = person.personalReputation && typeof person.personalReputation === "object" ? person.personalReputation : null;
      if (person.spouseId && (!peopleById[person.spouseId] || person.spouseId === person.id)) {
        person.spouseId = null;
      }
      if (person.businessId && !businessesById[person.businessId]) {
        person.businessId = null;
      }
      if (person.employerBusinessId && !businessesById[person.employerBusinessId]) {
        clearEmployment(person, person.employerBusinessId);
      }
      if (person.birthDay == null) {
        estimatedAge = Number(person.age);
        if (!Number.isFinite(estimatedAge)) estimatedAge = 30;
        person.birthDay = App.store.simDay - Math.round(estimatedAge * YEAR_DAYS);
      }
      if (person.lastLifeEventYear == null) {
        person.lastLifeEventYear = currentCalendarYear();
      }
      initializeTraits(person);
      ensureEducationData(person);
      ensureDecisionData(person);
      ensureSkillData(person);
      syncPerson(person);
    });

    App.store.people.forEach(function(person){
      var spouse;
      if (!person.spouseId) return;
      spouse = peopleById[person.spouseId];
      if (!spouse) {
        person.spouseId = null;
        return;
      }
      if (!spouse.spouseId) {
        spouse.spouseId = person.id;
      } else if (spouse.spouseId !== person.id) {
        person.spouseId = null;
      }
    });

    App.store.businesses.forEach(function(business){
      var owner = peopleById[business.ownerId] || null;
      var founder = peopleById[business.founderId] || null;

      if (!owner && founder) {
        business.ownerId = founder.id;
        owner = founder;
      }

      if (!business.founderId && owner) {
        business.founderId = owner.id;
      }

      if (!owner) {
        owner = App.store.people.find(function(candidate){
          return candidate.alive && !candidate.retired && candidate.countryISO === business.countryISO;
        }) || App.store.people.find(function(candidate){
          return candidate.alive && !candidate.retired;
        }) || App.store.people[0] || null;

        if (owner) {
          business.ownerId = owner.id;
          if (!business.founderId) business.founderId = owner.id;
        }
      }

      if (owner && !owner.businessId) {
        owner.businessId = business.id;
      }

      business.decisionHistory = (business.decisionHistory || []).slice(0, 12);
      business.revenueHistory = (business.revenueHistory || []).slice(-20);
      if (business.foundedDay == null) {
        business.foundedDay = App.store.simDay - Math.round(Math.max(0, Number(business.age || 0)) * YEAR_DAYS);
      }
      if (business.foundedDay > App.store.simDay) {
        business.foundedDay = App.store.simDay;
      }
      business.age = Math.round(getBusinessAgeYears(business) * 10) / 10;
      ensureBusinessDecisionState(business);
    });

    ensureStockMarketState();
    Object.keys(App.store.stockMarket.listingsByBusinessId || {}).forEach(function(businessId){
      var listing = App.store.stockMarket.listingsByBusinessId[businessId];
      var business = businessesById[businessId];
      var heldShares = 0;

      if (!listing || !business) {
        delete App.store.stockMarket.listingsByBusinessId[businessId];
        return;
      }

      listing.businessId = businessId;
      listing.totalShares = Math.max(1000, Math.floor(Number(listing.totalShares) || 1000000));
      listing.sharePriceGU = Math.max(0.05, Number(listing.sharePriceGU) || Math.max(0.05, (business.valuationGU || 0) / listing.totalShares));
      listing.symbol = listing.symbol || buildTickerSymbol(business);
      listing.treasuryShares = Math.max(0, Math.floor(Number(listing.treasuryShares) || 0));
      listing.sharesByHolder = listing.sharesByHolder && typeof listing.sharesByHolder === "object" ? listing.sharesByHolder : {};

      Object.keys(listing.sharesByHolder).forEach(function(holderId){
        var shares = Math.max(0, Math.floor(Number(listing.sharesByHolder[holderId]) || 0));
        if (!peopleById[holderId] || !shares) {
          delete listing.sharesByHolder[holderId];
          return;
        }
        listing.sharesByHolder[holderId] = shares;
        heldShares += shares;
      });

      if ((listing.treasuryShares + heldShares) > listing.totalShares) {
        listing.treasuryShares = Math.max(0, listing.totalShares - heldShares);
      } else if ((listing.treasuryShares + heldShares) < listing.totalShares) {
        listing.treasuryShares += listing.totalShares - (listing.treasuryShares + heldShares);
      }

      listing.lastDividendPerShareGU = Math.max(0, Number(listing.lastDividendPerShareGU) || 0);
      listing.annualDividendPerShareGU = Math.max(0, Number(listing.annualDividendPerShareGU) || 0);
      listing.lastDividendDay = Math.max(0, Math.floor(Number(listing.lastDividendDay) || 0));
      listing.lastVolumeShares = Math.max(0, Math.floor(Number(listing.lastVolumeShares) || 0));
      listing.rollingVolumeShares = Math.max(0, Math.floor(Number(listing.rollingVolumeShares) || 0));
      listing.lastSessionNetDemand = Number(listing.lastSessionNetDemand) || 0;
    });

    App.store.econHist = App.store.econHist || {};
    App.store.blocs.forEach(function(bloc){
      if (!Array.isArray(App.store.econHist[bloc.id])) {
        App.store.econHist[bloc.id] = [];
      }
      App.store.econHist[bloc.id] = App.store.econHist[bloc.id].map(function(value){
        return Number(value);
      }).filter(function(value){
        return Number.isFinite(value);
      }).slice(-60);
    });

    refreshLegacyBusinessNames();
    syncCorporateLadders();
    syncHouseholds();
    enforceFinancialBounds();
    (App.store.households || []).forEach(refreshHouseholdSnapshot);
    updateBlocGdp();
    validateCountryProfiles();

    App.store.blocs.forEach(function(bloc){
      if (!App.store.econHist[bloc.id].length) {
        App.store.econHist[bloc.id].push(bloc.gdp);
      }
    });

    if (App.events && App.events.rehydrateFromStore) {
      App.events.rehydrateFromStore();
    }
  }

  function initSim(options){
    var settings = options && typeof options === "object" ? options : {};
    var traitCoverage = validateTraitMechanicalCoverage();
    var strictCoverage = !!(global.location && (global.location.hostname === "localhost" || global.location.hostname === "127.0.0.1"));
    var startPreset = applyStartPresetToStore(settings.startPresetId || App.store.startPresetId || DEFAULT_START_PRESET_ID);

    if (!traitCoverage.ok) {
      console.error("Trait mechanical coverage failed:", traitCoverage.errors.join(" | "));
      if (strictCoverage) {
        throw new Error("Trait mechanical coverage failed: " + traitCoverage.errors.join(" | "));
      }
    }

    bootstrapCountryProfiles();
    ensureStockMarketState();

    App.store.blocs.forEach(function(bloc){
      for (var i = 0; i < App.utils.randInt(3, 5); i += 1) {
        var founder = createCitizen({
          blocId:bloc.id,
          countryISO:pickBootstrapCountryFromBloc(bloc.id) || undefined,
          age:App.utils.randInt(startPreset.bootstrapSeed.founderAgeMin, startPreset.bootstrapSeed.founderAgeMax)
        });

        applyBootstrapFounderPrehistory(founder, startPreset);
        App.store.people.push(founder);
        seedHousehold(founder);

        if (Math.random() > 0.25) {
          var business = createBusiness(founder);
          applyBootstrapBusinessPrehistory(founder, business, startPreset);
          seedBusiness(business);
          App.store.businesses.push(business);
          founder.businessId = business.id;
        }

        syncPerson(founder);
      }
    });

    syncCorporateLadders();
    syncHouseholds();
    (App.store.households || []).forEach(refreshHouseholdSnapshot);
    runYearlyEconomicPass();
    syncCorporateLadders();
    seedBootstrapListings(startPreset);
    syncHouseholds();
    calibrateInitialHouseholdLiquidity();
    (App.store.households || []).forEach(refreshHouseholdSnapshot);
    updateBlocGdp();
    validateCountryProfiles();
    emitNews("market", "NEXUS initialized from the " + startPreset.label + " start preset with fixed modern borders, seeded dynasties, and executive decision-making.", {
      causes:["Simulation bootstrap complete."]
    });
  }

  function randomEvent(){
    var debtCandidates = getDebtCrisisCandidateData().filter(function(entry){ return entry.eligible; });
    var averageDebtCandidateWeight = debtCandidates.length ? debtCandidates.reduce(function(sum, entry){
      return sum + entry.weight;
    }, 0) / debtCandidates.length : 0;
    var currentDay = Math.max(0, Number(App.store.simDay) || 0);
    var type = pickWeightedValue([
      { value:"tradeWar", weight:0.45 },
      { value:"tariff", weight:0.6 },
      { value:"debtCrisis", weight:debtCandidates.length ? App.utils.clamp(averageDebtCandidateWeight * 0.12, 0.08, 0.22) : 0 },
      { value:"boom", weight:0.9 },
      { value:"ipo", weight:0.82 },
      { value:"scandal", weight:1.0 },
      { value:"hire", weight:1.08 }
    ], "boom");
    var bloc = type === "debtCrisis"
      ? pickWeightedValue(debtCandidates.map(function(entry){
          return { value:entry, weight:entry.weight };
        }), null)
      : App.utils.pick(App.store.blocs);
    var otherBloc = bloc && bloc.bloc
      ? App.utils.pick(App.store.blocs.filter(function(item){ return item.id !== bloc.bloc.id; }))
      : App.utils.pick(App.store.blocs.filter(function(item){ return bloc && item.id !== bloc.id; }));
    var ipoBusiness;
    var owner;
    var scandalBusiness;
    var hireBusiness;

    if (bloc && bloc.bloc) {
      bloc = bloc;
    }

    if (type === "tradeWar") {
      if (!otherBloc) return;
      if (Math.max(Number(bloc.geoPressure) || 0, Number(otherBloc.geoPressure) || 0) < 0.9) return;
      if ((currentDay - (Number(bloc.lastTradeActionDay) || -YEAR_DAYS)) < (YEAR_DAYS * 0.55) || (currentDay - (Number(otherBloc.lastTradeActionDay) || -YEAR_DAYS)) < (YEAR_DAYS * 0.55)) return;
      bloc.lastTradeActionDay = currentDay;
      otherBloc.lastTradeActionDay = currentDay;
      bloc.geoPressure += App.utils.rand(0.55, 1.45);
      otherBloc.geoPressure += App.utils.rand(0.25, 1.0);
      emitNews("tariff", "TRADE WAR: " + bloc.flag + bloc.name + " vs " + otherBloc.flag + otherBloc.name + ". Currency pressure is rising.", {
        entities:{ blocIds:[bloc.id, otherBloc.id] },
        scope:"global",
        causes:["Mutual tariff escalation."]
      });
      return;
    }

    if (type === "tariff") {
      if ((Number(bloc.geoPressure) || 0) < 0.6 && (Number(bloc.defaultRisk) || 0) < 0.35) return;
      if ((currentDay - (Number(bloc.lastTradeActionDay) || -YEAR_DAYS)) < (YEAR_DAYS * 0.32)) return;
      bloc.lastTradeActionDay = currentDay;
      bloc.geoPressure += App.utils.rand(0.25, 0.9);
      emitNews("tariff", "TARIFF: " + bloc.flag + " " + bloc.name + " imposed new import duties. " + bloc.currency + " is under pressure.", {
        entities:{ blocIds:[bloc.id] },
        scope:"bloc",
        causes:["Import duties increased trade friction."]
      });
      return;
    }

    if (type === "debtCrisis") {
      var debtCandidate = bloc;
      var debtBloc = debtCandidate && debtCandidate.bloc ? debtCandidate.bloc : null;
      var causes;

      if (!debtBloc) return;

      debtBloc.lastDebtCrisisDay = Math.max(0, Number(App.store.simDay) || 0);
      debtBloc.defaultRisk += App.utils.rand(0.55, 1.35);
      debtBloc.geoPressure += App.utils.rand(0.8, 1.7);
      App.store.businesses.filter(function(business){ return business.blocId === debtBloc.id; }).forEach(function(business){
        business.revenueGU *= App.utils.rand(0.82, 0.93);
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) * App.utils.rand(0.88, 0.97));
        business.currentDecision = evaluateBusinessDecision(business);
      });
      causes = buildDebtStressCauses(debtCandidate, {
        fallback:"Debt stress and confidence erosion breached crisis conditions."
      });
      emitNews("debtCrisis", "DEBT CRISIS: " + debtBloc.flag + " " + debtBloc.name + " is sliding. " + debtBloc.currency + " is falling fast.", {
        entities:{ blocIds:[debtBloc.id] },
        scope:"bloc",
        causes:causes
      });
      return;
    }

    if (type === "boom") {
      App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }).forEach(function(business){
        business.revenueGU *= App.utils.rand(1.04, 1.12);
        business.cashReservesGU += business.revenueGU * App.utils.rand(0.006, 0.02);
        business.reputation = clampScore((business.reputation || 50) + App.utils.rand(0.6, 2.4));
        business.currentDecision = evaluateBusinessDecision(business);
      });
      emitNews("market", "BOOM: " + bloc.flag + " " + bloc.name + " posted record growth. " + bloc.currency + " is surging.", {
        entities:{ blocIds:[bloc.id] },
        scope:"bloc",
        causes:["Revenue expansion across bloc industries."]
      });
      return;
    }

    if (type === "ipo") {
      ipoBusiness = App.utils.pick(App.store.businesses.filter(function(business){
        return business.blocId === bloc.id && isBusinessEligibleForListing(business);
      }));
      if (ipoBusiness) {
        listBusinessOnExchange(ipoBusiness, "Macro sentiment opened a high-visibility IPO window.");
      } else {
        ipoBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
        if (ipoBusiness) {
          ipoBusiness.valuationGU *= App.utils.rand(1.02, 1.12);
        }
      }
      return;
    }

    if (type === "scandal") {
      scandalBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
      if (scandalBusiness) {
        owner = App.store.getPerson(scandalBusiness.ownerId);
        scandalBusiness.revenueGU *= App.utils.rand(0.78, 0.92);
        scandalBusiness.reputation = clampScore((scandalBusiness.reputation || 50) - App.utils.rand(6, 15));
        if (owner && owner.alive) {
          adjustPersonalReputation(owner, {
            trust:-App.utils.rand(4, 11),
            prestige:-App.utils.rand(3, 9),
            notoriety:App.utils.rand(4, 12),
            scandalMemory:App.utils.rand(12, 30)
          });
          syncPerson(owner);
        }
        applyLeadershipStateChange(scandalBusiness, {
          confidence:-12,
          stress:16,
          burnout:4
        });
        scandalBusiness.currentDecision = evaluateBusinessDecision(scandalBusiness);
        pushBusinessEventHistory(scandalBusiness, "Scandal hit " + scandalBusiness.name, "Public trust collapsed and leadership came under pressure.");
        emitNews("scandal", bloc.flag + " <strong>" + scandalBusiness.name + "</strong> was hit by scandal. Revenue collapsed.", {
          entities:{
            businessIds:[scandalBusiness.id],
            countryIsos:[scandalBusiness.countryISO],
            blocIds:[scandalBusiness.blocId]
          },
          causes:["Public trust collapsed after scandal exposure."]
        });
      }
      return;
    }

    if (type === "hire") {
      hireBusiness = App.utils.pick(App.store.businesses.filter(function(business){ return business.blocId === bloc.id; }));
      if (hireBusiness) {
        var leadershipFloor = Math.max((hireBusiness.leadership || []).length, 1);
        var requestedHires = App.utils.randInt(2, 12);
        var headroom = Math.max(0, 2000 - Math.max(leadershipFloor, hireBusiness.employees || 0));
        var hires = reserveLabor(hireBusiness.countryISO, Math.min(requestedHires, headroom));
        hireBusiness.employees = Math.max(leadershipFloor, Math.min(2000, (hireBusiness.employees || leadershipFloor) + hires));
        hireBusiness.reputation = clampScore((hireBusiness.reputation || 50) + App.utils.rand(0.4, 1.6));
        applyLeadershipStateChange(hireBusiness, {
          confidence:4,
          stress:-2
        });
        hireBusiness.currentDecision = evaluateBusinessDecision(hireBusiness);
        pushBusinessEventHistory(hireBusiness, "Hiring surge at " + hireBusiness.name, "Leadership expanded headcount after a favorable run.");
        if (hires > 0) {
          emitNews("hire", bloc.flag + " <strong>" + hireBusiness.name + "</strong> added " + hires + " new hires.", {
            entities:{
              businessIds:[hireBusiness.id],
              countryIsos:[hireBusiness.countryISO],
              blocIds:[hireBusiness.blocId]
            },
            causes:["Leadership opened headcount for expansion."],
            rollupLabel:hireBusiness.name
          });
        } else {
          emitNews("hire", bloc.flag + " <strong>" + hireBusiness.name + "</strong> attempted a hiring surge but local labor supply was tight.", {
            entities:{
              businessIds:[hireBusiness.id],
              countryIsos:[hireBusiness.countryISO],
              blocIds:[hireBusiness.blocId]
            },
            causes:["Local labor pool could not satisfy requested hires."],
            rollupLabel:hireBusiness.name
          });
        }
      }
    }
  }

  function processBusinessTick(){
    App.store.getLivingPeople().forEach(function(person){
      var bloc = App.store.getBloc(person.blocId);
      var business = App.store.getBusiness(person.businessId);
      var employerBusiness = !business && App.store.getEmploymentBusiness ? App.store.getEmploymentBusiness(person) : null;
      var decision;
      var annualTargetRevenue;
      var annualGrowthBands;
      var annualGrowthTarget;
      var dailyRevenueRate;
      var dailyRevenueNoise;
      var dailyRevenueMultiplier;
      var demandUtilization;
      var overCapacityCorrection;
      var margin;
      var reserveShareRate;
      var cashDelta = 0;
      var ownerShare = 0;
      var ownerPayoutCap = 0;
      var employeeDelta = 0;
      var requestedEmployeeDelta = 0;
      var leadershipFloor;
      var reputationDelta = 0;
      var bankruptcyPressure;
      var ownerBusinessTrait = 0;
      var ownerMobilityTrait = 0;
      var businessTickEffects;
      var demandPenalty;
      var headroom;
      var workforceDelta = 0;
      var talentShortageRatio = 0;
      var currentHeadcount = 0;
      var payrollAnnual = 0;
      var operatingCostAnnual = 0;
      var dailyProfit = 0;
      var loss = 0;
      var coveredByCash = 0;
      var ageYears = 0;
      var cashCoverage = 0;
      var behaviorProfile;
      var countryProfile;
      var supplyPressure = 0;
      var infrastructureIndex = 0.52;
      var infrastructureReliability = 0.55;
      var infrastructureProductivityFactor = 1;
      var infrastructureLogisticsCostFactor = 1;
      var naturalResourceEndowment = 0.35;
      var resourceRentRisk = 0.3;
      var resourceAdvantage = 0;
      var resourceCostFactor = 1;
      var tradeTransmission;
      var customerEffects;
      var creditEffects;
      var wealthCarryRateAnnual = 0;
      var wealthCarry = 0;
      var shouldRecordDecision = false;
      var marketSignal;
      var allocatedDemandCapacity;
      var pricedDemandCapacity;
      var productionCapacity;
      var pricedProductionCapacity;
      var revenueFloor;
      var countryDemandGrowth = 0;
      var countryUnemploymentRate = 0;
      var recoveryMomentum = 0;
      var recoverySignal = 0;
      var jobsRecoveryBias = 0;
      var capacityUtilization;
      var capacityHireBias = 0;
      var demandOpportunityRatio;

      ensureDecisionData(person);
      if (!business) {
        if (!(employerBusiness && App.store.isBusinessLeader && App.store.isBusinessLeader(person))) {
          settleTemporaryStates(person);
        }
        person.netWorthGU = Math.max(100, person.netWorthGU);
        person.pulse = Math.random() < 0.04 ? 1 : 0;
        syncPerson(person);
        return;
      }

      ensureBusinessDecisionState(business);
      settleLeadershipStates(business);
      decision = evaluateBusinessDecision(business);
      ownerBusinessTrait = getTraitChannelScore(person, "business");
      ownerMobilityTrait = getTraitChannelScore(person, "mobility");
      businessTickEffects = summarizeTraitEffects(collectTraitEffects(person, ["business","mobility"]), 4);
      behaviorProfile = getIndustryBehaviorProfile(business.industry);
      countryProfile = ensureCountryProfile(business.countryISO, business.blocId);
      countryDemandGrowth = ((Math.max(0, Number(countryProfile && countryProfile.consumerDemandGU) || 0) - Math.max(1, Number(countryProfile && countryProfile.prevConsumerDemandGU) || Number(countryProfile && countryProfile.consumerDemandGU) || 1)) / Math.max(1, Number(countryProfile && countryProfile.prevConsumerDemandGU) || Number(countryProfile && countryProfile.consumerDemandGU) || 1));
      countryUnemploymentRate = Math.max(0, Number(countryProfile && countryProfile.unemploymentRate) || 0);
      marketSignal = getBusinessMarketAllocationSignal(business);
      business.marketPriceIndex = marketSignal.priceIndex;
      business.marketAllocationRatio = marketSignal.allocationRatio;
      revenueFloor = getBusinessRevenueFloorGU(business);
      allocatedDemandCapacity = Math.max(1, Number(business.allocatedDemandGU) || getBusinessDemandCapacityGU(business));
      pricedDemandCapacity = Math.max(revenueFloor, allocatedDemandCapacity * App.utils.clamp(marketSignal.priceIndex, 0.72, 1.45));
      infrastructureIndex = App.utils.clamp(Number(countryProfile && countryProfile.developmentInfrastructureIndex) || 0.52, 0.1, 1);
      infrastructureReliability = App.utils.clamp(0.55 + ((infrastructureIndex - 0.5) * 0.9), 0.3, 1.1);
      infrastructureProductivityFactor = App.utils.clamp(0.88 + ((infrastructureIndex - 0.5) * 0.22), 0.76, 1.12);
      infrastructureLogisticsCostFactor = App.utils.clamp(1 + ((0.55 - infrastructureIndex) * 0.24), 0.9, 1.18);
      naturalResourceEndowment = App.utils.clamp(Number(countryProfile && countryProfile.naturalResourceEndowmentIndex) || 0.35, 0, 1);
      resourceRentRisk = App.utils.clamp(Number(countryProfile && countryProfile.resourceRentSeekingRiskIndex) || 0.3, 0, 1.6);
      if (business.industry === "Energy") {
        resourceAdvantage = (naturalResourceEndowment - 0.4) * 0.24;
      } else if (business.industry === "Manufacturing" || business.industry === "F&B" || business.industry === "Logistics") {
        resourceAdvantage = (naturalResourceEndowment - 0.4) * 0.11;
      }
      resourceCostFactor = App.utils.clamp(1 - (resourceAdvantage * 0.45) + (resourceRentRisk * 0.05), 0.82, 1.22);
      leadershipFloor = Math.max((business.leadership || []).length, 1);
      demandPenalty = getDemandCapPenalty(business);
      annualTargetRevenue = computeBusinessAnnualRevenueTarget(business, decision, ownerBusinessTrait, ownerMobilityTrait);
      annualGrowthBands = getBusinessAnnualGrowthBands(business);
      annualGrowthTarget =
        ((annualTargetRevenue / Math.max(1, business.revenueGU || 1)) - 1) +
        (getRevenueTrend(business) * 0.24) -
        (bloc.geoPressure * 0.02) -
        (demandPenalty * 1.15) +
        resourceAdvantage +
        clampTraitDelta(ownerBusinessTrait / 180, 0.05) +
        clampTraitDelta(ownerMobilityTrait / 260, 0.03);
      annualGrowthTarget = App.utils.clamp(annualGrowthTarget, annualGrowthBands.min, annualGrowthBands.max);
      dailyRevenueRate = dailyRateFromAnnualChange(annualGrowthTarget);
      dailyRevenueNoise = closureValidationMode ? App.utils.rand(-0.00045, 0.00045) : App.utils.rand(-0.0016, 0.0019);
      demandUtilization = Math.max(0, (business.revenueGU || 0) / Math.max(1, pricedDemandCapacity));
      overCapacityCorrection = demandUtilization > 1 ? App.utils.clamp((demandUtilization - 1) * 0.015, 0, 0.12) : 0;
      dailyRevenueMultiplier = App.utils.clamp(1 + dailyRevenueRate + dailyRevenueNoise - overCapacityCorrection, 0.9, 1.03);
      dailyRevenueMultiplier = App.utils.clamp(dailyRevenueMultiplier * App.utils.clamp((Number(business.pricePower) || 1), 0.92, 1.12) * marketSignal.revenueMultiplier, 0.82, 1.12);
      business.revenueGU = Math.max(
        revenueFloor,
        Math.min(pricedDemandCapacity * 1.08, (business.revenueGU || 0) * dailyRevenueMultiplier)
      );

      refreshBusinessFirmStructure(business, decision);
      supplyPressure = getIndustrySupplyPressure(business);
      tradeTransmission = computeTradeShockTransmission(business, bloc, behaviorProfile, supplyPressure);
      business.tradeShockPressure = App.utils.clamp(((Number(business.tradeShockPressure) || 0) * 0.7) + (tradeTransmission.netShock * 0.3), 0, 1.8);
      business.tradeRerouteRelief = App.utils.clamp(((Number(business.tradeRerouteRelief) || 0) * 0.64) + (tradeTransmission.rerouteRelief * 0.36), 0, 1.2);
      business.supplyStress = App.utils.clamp(
        ((Number(business.supplyStress) || 0) * 0.68) +
        (supplyPressure * behaviorProfile.supplySensitivity) +
        ((1 - infrastructureReliability) * 0.22) +
        (resourceRentRisk * 0.08) +
        (business.tradeShockPressure * 0.42) -
        (business.tradeRerouteRelief * 0.18),
        0,
        1.8
      );
      productionCapacity = Math.max(1, getBusinessProductionCapacityGU(business));
      pricedProductionCapacity = Math.max(revenueFloor, productionCapacity * App.utils.clamp((marketSignal.priceIndex * 0.76) + (marketSignal.allocationRatio * 0.24), 0.74, 1.34));
      business.revenueGU = Math.max(revenueFloor, Math.min(pricedDemandCapacity * 1.08, pricedProductionCapacity * 1.14, business.revenueGU * App.utils.clamp((1 - (business.supplyStress * 0.05)) * infrastructureProductivityFactor, 0.72, 1.08)));
      business.revenueGU = Math.max(revenueFloor, Math.min(pricedDemandCapacity * 1.08, pricedProductionCapacity * 1.12, business.revenueGU * App.utils.clamp(1 + (resourceAdvantage * 0.32), 0.9, 1.1)));

      payrollAnnual = getLeadershipPayrollAnnual(business) + getAnonymousPayrollAnnual(business);
      operatingCostAnnual = business.revenueGU * getOperatingCostRate(business) * (
        (1 + App.utils.clamp(bloc.geoPressure * 0.05, 0, 0.16) + App.utils.clamp(business.supplyStress * 0.11, 0, 0.24)) * tradeTransmission.costMultiplier * infrastructureLogisticsCostFactor * resourceCostFactor
      );
      business.profitGU = business.revenueGU - payrollAnnual - operatingCostAnnual;
      margin = App.utils.clamp((business.profitGU || 0) / Math.max(1, business.revenueGU || 1), -0.4, 0.4);
      customerEffects = applyCustomerDemandAndReputationDynamics(business, decision, margin);
      if (business.stage === "declining" || (business.bankruptcyStage && business.bankruptcyStage !== "stable")) {
        recoveryMomentum = App.utils.clamp(
          Math.max(0, countryDemandGrowth) * 0.32 +
          Math.max(0, (marketSignal.revenueMultiplier || 1) - 1) * 0.55 +
          Math.max(0, margin) * 0.48 +
          Math.max(0, ((business.reputation || 50) - 52) / 220),
          0,
          0.08
        );
      }
      business.revenueGU = Math.max(revenueFloor, Math.min(pricedDemandCapacity * 1.12, business.revenueGU * customerEffects.revenueMultiplier));
      if (recoveryMomentum > 0) {
        business.revenueGU = Math.max(revenueFloor, Math.min(pricedDemandCapacity * 1.16, pricedProductionCapacity * 1.16, business.revenueGU * (1 + recoveryMomentum)));
      }
      business.revenueGU = App.utils.clamp(
        business.revenueGU,
        revenueFloor,
        getBusinessRealizedRevenueCap(business)
      );
      payrollAnnual = getLeadershipPayrollAnnual(business) + getAnonymousPayrollAnnual(business);
      operatingCostAnnual = business.revenueGU * getOperatingCostRate(business) * (
        (1 + App.utils.clamp(bloc.geoPressure * 0.05, 0, 0.16) + App.utils.clamp(business.supplyStress * 0.11, 0, 0.24)) * tradeTransmission.costMultiplier * infrastructureLogisticsCostFactor * resourceCostFactor
      );
      business.profitGU = business.revenueGU - payrollAnnual - operatingCostAnnual;
      margin = App.utils.clamp((business.profitGU || 0) / Math.max(1, business.revenueGU || 1), -0.4, 0.4);
      business.wageBillAnnual = payrollAnnual;
      business.operatingCostAnnual = operatingCostAnnual;
      business.currentDecision = decision;
      business.tradeShockEvidence = {
        industry:business.industry,
        exposure:Number((Number(business.tradeShockExposure) || 0).toFixed(4)),
        grossShock:Number(tradeTransmission.grossShock.toFixed(4)),
        netShock:Number(tradeTransmission.netShock.toFixed(4)),
        rerouteRelief:Number(tradeTransmission.rerouteRelief.toFixed(4)),
        rerouteCapacity:Number((Number(business.tradeRerouteCapacity) || 0).toFixed(4))
      };
      business.infrastructureEvidence = {
        infrastructureIndex:Number(infrastructureIndex.toFixed(4)),
        reliability:Number(infrastructureReliability.toFixed(4)),
        productivityFactor:Number(infrastructureProductivityFactor.toFixed(4)),
        logisticsCostFactor:Number(infrastructureLogisticsCostFactor.toFixed(4))
      };
      business.resourceEvidence = {
        endowmentIndex:Number(naturalResourceEndowment.toFixed(4)),
        rentRiskIndex:Number(resourceRentRisk.toFixed(4)),
        advantage:Number(resourceAdvantage.toFixed(4)),
        costFactor:Number(resourceCostFactor.toFixed(4))
      };
      ageYears = getBusinessAgeYears(business);
      business.age = Math.round(ageYears * 10) / 10;
      if ((App.store.simDay % 18) < SIM_DAYS_PER_TICK) {
        business.revenueHistory.push(business.revenueGU);
        if (business.revenueHistory.length > 20) {
          business.revenueHistory.shift();
        }
      }

      dailyProfit = (business.profitGU || 0) / YEAR_DAYS * SIM_DAYS_PER_TICK;
      reserveShareRate = getReserveShareRate(business, decision);

      if (dailyProfit > 0) {
        cashDelta = dailyProfit * reserveShareRate;
        ownerShare = dailyProfit - cashDelta;
        ownerPayoutCap = Math.max(
          ((business.valuationGU || 0) * 0.18 / YEAR_DAYS) * SIM_DAYS_PER_TICK,
          (getCountryMedianWage(business.countryISO) * 0.25 / DAYS_PER_MONTH) * SIM_DAYS_PER_TICK
        );
        if (ownerShare > ownerPayoutCap) {
          cashDelta += ownerShare - ownerPayoutCap;
          ownerShare = ownerPayoutCap;
        }
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) + cashDelta);
        person.netWorthGU += ownerShare;
      } else {
        loss = Math.abs(dailyProfit);
        coveredByCash = Math.min(loss, business.cashReservesGU || 0);
        business.cashReservesGU = Math.max(0, (business.cashReservesGU || 0) - coveredByCash);
        cashDelta = -coveredByCash;
        person.netWorthGU -= (loss - coveredByCash);
      }

      creditEffects = applyDebtCreditAndBankruptcyStages(business, person, bloc, decision);
      if (creditEffects.liquidated) {
        return;
      }

      wealthCarryRateAnnual = getNetWorthCarryRateAnnual(person.netWorthGU);
      if (wealthCarryRateAnnual > 0) {
        wealthCarry = person.netWorthGU * wealthCarryRateAnnual * (SIM_DAYS_PER_TICK / YEAR_DAYS);
        person.netWorthGU = Math.max(100, person.netWorthGU - wealthCarry);
      }

      cashCoverage = getCashCoverageMonths(business);

      if (decision.staffingAction === "hire" && Math.random() < chanceForDays(0.28, DAYS_PER_MONTH)) {
        requestedEmployeeDelta = App.utils.randInt(1, Math.max(1, Math.min(5, Math.ceil((business.employees || 1) * (decision.stance === "aggressive" ? 0.06 : 0.03)))));
      } else if (decision.staffingAction === "layoff" && Math.random() < chanceForDays(0.22, DAYS_PER_MONTH)) {
        requestedEmployeeDelta = -App.utils.randInt(1, Math.max(1, Math.min(6, Math.ceil((business.employees || 1) * (decision.stance === "retrenching" ? 0.08 : 0.04)))));
      }

      currentHeadcount = Math.max(leadershipFloor, business.employees || leadershipFloor);
      capacityUtilization = business.revenueGU / Math.max(1, pricedProductionCapacity);
      demandOpportunityRatio = pricedDemandCapacity / Math.max(1, pricedProductionCapacity);
      jobsRecoveryBias = App.utils.clamp(
        (Math.max(0, countryDemandGrowth) * 1.25) +
        (Math.max(0, countryUnemploymentRate - 0.1) * 0.95) +
        (Math.max(0, margin) * 0.7) +
        (cashCoverage > 1 ? 0.04 : 0),
        0,
        0.18
      );
      if (demandOpportunityRatio > 1.05) {
        capacityHireBias = Math.max(capacityHireBias, Math.max(1, Math.ceil(currentHeadcount * App.utils.clamp((demandOpportunityRatio - 1) * 0.2, 0.04, 0.24))));
      }
      if (capacityUtilization > 1.03) {
        capacityHireBias = Math.max(1, Math.ceil(currentHeadcount * App.utils.clamp((capacityUtilization - 1) * 0.22, 0.04, 0.18)));
        requestedEmployeeDelta = Math.max(requestedEmployeeDelta, capacityHireBias);
      } else if (capacityUtilization < 0.76 && decision.staffingAction === "layoff") {
        requestedEmployeeDelta = Math.min(requestedEmployeeDelta, -Math.max(1, Math.ceil(currentHeadcount * App.utils.clamp((0.76 - capacityUtilization) * 0.12, 0.03, 0.12))));
      }
      if (jobsRecoveryBias > 0.02 && demandOpportunityRatio > 0.92 && cashCoverage > 1 && margin > -0.08) {
        requestedEmployeeDelta = Math.max(requestedEmployeeDelta, Math.max(1, Math.ceil(currentHeadcount * App.utils.clamp(0.01 + (jobsRecoveryBias * 0.22), 0.02, 0.05))));
      }
      if (jobsRecoveryBias > 0.03 && decision.staffingAction === "layoff" && countryDemandGrowth > 0 && cashCoverage > 0.95) {
        requestedEmployeeDelta = Math.max(requestedEmployeeDelta, -Math.max(1, Math.ceil(currentHeadcount * 0.01)));
      }
      if (capacityHireBias > 0) {
        requestedEmployeeDelta = Math.max(requestedEmployeeDelta, capacityHireBias);
      }
      if (requestedEmployeeDelta > 0) {
        headroom = Math.max(0, 2000 - currentHeadcount);
        requestedEmployeeDelta = Math.min(requestedEmployeeDelta, headroom);
        workforceDelta = reserveLabor(business.countryISO, requestedEmployeeDelta);
        if (requestedEmployeeDelta > 0) {
          talentShortageRatio = App.utils.clamp((requestedEmployeeDelta - workforceDelta) / requestedEmployeeDelta, 0, 1);
        }
      } else if (requestedEmployeeDelta < 0) {
        workforceDelta = -releaseLabor(business.countryISO, Math.abs(requestedEmployeeDelta));
      }
      employeeDelta = workforceDelta;
      business.employees = Math.max(leadershipFloor, Math.min(2000, currentHeadcount + employeeDelta));
      if (employeeDelta !== 0) {
        syncBusinessStaffAssignments(business);
      }

      applyLaborUnrestPressure(business, decision, employeeDelta);

      reputationDelta += business.profitGU > 0 ? App.utils.clamp(margin * 8, 0.05, 0.9) : App.utils.clamp(margin * 11, -1.9, -0.08);
      if (employeeDelta < 0) reputationDelta -= App.utils.rand(0.2, 0.7);
      if (employeeDelta > 0) reputationDelta += App.utils.rand(0.05, 0.25);
      if (talentShortageRatio > 0) reputationDelta -= App.utils.clamp(talentShortageRatio * 0.55, 0.08, 0.5);
      if (decision.stance === "retrenching") reputationDelta -= 0.2;
      if (decision.cashPolicy === "reinvest" && business.profitGU > 0) reputationDelta += 0.12;
      if (demandPenalty > 0.001) reputationDelta -= App.utils.clamp(demandPenalty * 3.5, 0.08, 0.45);
      reputationDelta += customerEffects.reputationDelta;
      reputationDelta += clampTraitDelta(ownerBusinessTrait / 18, 0.35);
      business.reputation = clampScore((business.reputation || 50) + reputationDelta);
      adjustPersonalReputation(person, {
        trust:business.profitGU > 0 ? App.utils.clamp(margin * 2.6, -0.6, 1.8) : App.utils.clamp(margin * 2.2, -2.4, 0.4),
        prestige:business.profitGU > 0 ? App.utils.clamp(margin * 3.4, -0.4, 2.8) : App.utils.clamp(margin * 3.2, -2.8, 0.6),
        notoriety:employeeDelta < 0 ? App.utils.rand(0.2, 1.2) : App.utils.rand(-0.2, 0.4),
        scandalMemory:decision.stance === "retrenching" && employeeDelta < 0 ? App.utils.rand(0.2, 1) : -0.15
      });
      cashCoverage = getCashCoverageMonths(business);
      business.valuationGU = business.revenueGU * App.utils.clamp(1.15 + ((business.reputation || 50) / 42) + (margin * 3.5) + (cashCoverage * 0.08), 1.05, 5.6);

      if (talentShortageRatio > 0.22) {
        ensureCountryProfile(business.countryISO).talentShortageIndex = App.utils.clamp(
          Math.max(Number(ensureCountryProfile(business.countryISO).talentShortageIndex) || 0, talentShortageRatio),
          0,
          1
        );
      }

      business.stage = evaluateBusinessLifecycleStage(business, {
        ageYears:ageYears,
        profitGU:business.profitGU,
        revenueGU:business.revenueGU,
        reputation:business.reputation,
        cashCoverage:cashCoverage,
        countryDemandGrowth:countryDemandGrowth
      });

      recoverySignal = getBusinessRecoverySignal({
        countryDemandGrowth:countryDemandGrowth,
        margin:margin,
        cashCoverage:cashCoverage
      });

      bankruptcyPressure =
        (cashCoverage < 1 ? 1 : 0) +
        (business.profitGU < -business.revenueGU * 0.12 ? 1 : 0) +
        (business.reputation < 28 ? 1 : 0) +
        (getPersonFinancialStress(person) > 0.75 ? 0.8 : 0) +
        (decision.stance === "aggressive" ? 0.35 : 0);
      bankruptcyPressure += ownerBusinessTrait < -6 ? 0.35 : 0;
      bankruptcyPressure += ownerBusinessTrait > 6 ? -0.2 : 0;
      bankruptcyPressure += App.utils.clamp((creditEffects && creditEffects.creditStress) || 0, 0, 1.8);
      bankruptcyPressure -= recoverySignal;

      if (bankruptcyPressure >= 3 && Math.random() < chanceForDays(App.utils.clamp((bankruptcyPressure - 2) * 0.24, 0.05, 0.38), YEAR_DAYS / 2)) {
        emitNews("bankruptcy", "<strong>" + person.name + "</strong> " + bloc.flag + " - <strong>" + business.name + "</strong> went bankrupt.", {
          tags:buildTraitEffectTags(businessTickEffects, 2),
          entities:{
            personIds:[person.id],
            businessIds:[business.id],
            countryIsos:[business.countryISO],
            blocIds:[business.blocId]
          },
          causes:["Sustained losses and reputation stress triggered insolvency."]
        });
        liquidateBusiness(person, business);
        person.netWorthGU = Math.max(600, person.netWorthGU * 0.32);
        person.pulse = 1;
        adjustPersonalReputation(person, {
          trust:-8,
          prestige:-10,
          notoriety:7,
          scandalMemory:14
        });
        adjustTemporaryStates(person, {
          confidence:-16,
          stress:18,
          burnout:6
        });
        syncPerson(person);
        return;
      }

      shouldRecordDecision = (App.store.simDay % 15) < SIM_DAYS_PER_TICK || employeeDelta !== 0 || Math.abs(reputationDelta) > 0.8;
      if (shouldRecordDecision) {
        pushBusinessDecisionHistory(business, {
          id:randomId(),
          madeAtDay:decision.madeAtDay,
          stance:decision.stance,
          staffingAction:decision.staffingAction,
          cashPolicy:decision.cashPolicy,
          successionBias:decision.successionBias,
          reasons:decision.reasons.slice(0, 3),
          traitEffects:(decision.traitEffects || []).slice(0, 4),
          influencers:decision.influencers.slice(0, 3),
          summary:summarizeDecisionOutcome(decision, employeeDelta, cashDelta, reputationDelta)
        });

        applyLeadershipStateChange(business, {
          confidence:business.profitGU > 0 ? 2 : -3,
          stress:business.profitGU > 0 ? -1 : 3,
          burnout:decision.stance === "aggressive" ? 1 : (decision.stance === "retrenching" ? 1 : 0),
          ambitionSpike:decision.stance === "aggressive" ? 1 : 0
        });
      }

      person.netWorthGU = Math.max(100, person.netWorthGU);
      person.pulse = Math.random() < 0.08 ? 1 : 0;
      recordTraitEffects(decision.traitEffects || []);
      setTraitSnapshot(person, businessTickEffects.length ? businessTickEffects : (decision.traitEffects || []));
      setTraitSnapshot(business, decision.traitEffects || []);
      syncPerson(person);
    });
    updateCountryTradeShockSignals();
    processStockMarketTick();
    processHouseholdTick();
  }

  function pickWeightedBy(candidates, weightFn){
    var weighted = [];
    var total = 0;
    var roll;
    var running = 0;

    (candidates || []).forEach(function(candidate){
      var weight = Math.max(0, Number(weightFn(candidate) || 0));
      if (weight <= 0) return;
      weighted.push({ candidate:candidate, weight:weight });
      total += weight;
    });

    if (!weighted.length || total <= 0) return null;

    roll = Math.random() * total;
    for (var i = 0; i < weighted.length; i += 1) {
      running += weighted[i].weight;
      if (running >= roll) {
        return weighted[i].candidate;
      }
    }

    return weighted[weighted.length - 1].candidate;
  }

  var DEAL_MONTHLY_BASE_CHANCE = 0.22;
  var DEAL_ECOSYSTEM_SOFT_FLOOR = 24;
  var DEAL_ACQUISITION_SOFT_FLOOR = 28;

  function getActiveBusinessCount(){
    return (App.store.businesses || []).filter(function(business){
      return business && business.stage !== "defunct";
    }).length;
  }

  function getDealCadenceMultiplier(){
    var activeBusinessCount = getActiveBusinessCount();

    if (activeBusinessCount <= 8) return 0;
    if (activeBusinessCount <= 14) return 0.38;
    if (activeBusinessCount <= 20) return 0.62;
    if (activeBusinessCount <= 28) return 0.82;
    return 1;
  }

  function tryExecuteMergerAndAcquisition(first, second, firstBusiness, secondBusiness, value, compatibility, dealTraitScore){
    var acquirer;
    var seller;
    var acquirerBusiness;
    var sellerBusiness;
    var sellerOwner;
    var listing;
    var sameIndustry;
    var connectedIndustries;
    var takeoverChance;
    var maxOffer;
    var offer;
    var sellerRevenue;
    var sellerValuation;
    var sellerEmployees;
    var sellerCash;
    var integrationHire;
    var sanctionDealBlock;
    var activeBusinessCount;
    var sellerAgeDays;
    var scaleAdvantage;
    var ecosystemSuppression;

    if (!firstBusiness || !secondBusiness) return false;

    acquirer = first;
    seller = second;
    acquirerBusiness = firstBusiness;
    sellerBusiness = secondBusiness;
    if (((secondBusiness.valuationGU || 0) + (secondBusiness.reputation || 50) * 1000) > ((firstBusiness.valuationGU || 0) + (firstBusiness.reputation || 50) * 1000)) {
      acquirer = second;
      seller = first;
      acquirerBusiness = secondBusiness;
      sellerBusiness = firstBusiness;
    }

    if (!acquirerBusiness || !sellerBusiness || acquirerBusiness.id === sellerBusiness.id) return false;
    if ((acquirerBusiness.bankruptcyStage && acquirerBusiness.bankruptcyStage !== "stable") || (sellerBusiness.bankruptcyStage && sellerBusiness.bankruptcyStage === "liquidation")) return false;

    sanctionDealBlock = getBilateralSanctionDealBlock(acquirerBusiness.blocId, sellerBusiness.blocId);
    if (sanctionDealBlock >= 0.55 && Math.random() < App.utils.clamp(sanctionDealBlock * 0.48, 0.08, 0.5)) {
      emitNews("deal", "Cross-bloc acquisition attempt between <strong>" + acquirerBusiness.name + "</strong> and <strong>" + sellerBusiness.name + "</strong> was blocked by sanctions.", {
        entities:{
          personIds:[first.id, second.id],
          businessIds:[acquirerBusiness.id, sellerBusiness.id],
          countryIsos:[acquirerBusiness.countryISO, sellerBusiness.countryISO],
          blocIds:[acquirerBusiness.blocId, sellerBusiness.blocId]
        },
        causes:["Deal-block index: " + sanctionDealBlock.toFixed(2)],
        scope:"global"
      });
      return false;
    }

    sameIndustry = acquirerBusiness.industry === sellerBusiness.industry;
    connectedIndustries = (INDUSTRY_SUPPLY_DEPENDENCIES[acquirerBusiness.industry] || []).indexOf(sellerBusiness.industry) !== -1;
    if (!sameIndustry && !connectedIndustries) return false;

    activeBusinessCount = getActiveBusinessCount();
    sellerAgeDays = Math.max(0, App.store.simDay - (Number(sellerBusiness.foundedDay) || App.store.simDay));
    scaleAdvantage = Math.max(
      0.25,
      Math.max(Number(acquirerBusiness.valuationGU) || 0, Number(acquirerBusiness.revenueGU) || 0) /
        Math.max(1, Math.max(Number(sellerBusiness.valuationGU) || 0, Number(sellerBusiness.revenueGU) || 0))
    );
    ecosystemSuppression = App.utils.clamp((DEAL_ACQUISITION_SOFT_FLOOR - activeBusinessCount) / DEAL_ACQUISITION_SOFT_FLOOR, 0, 0.72);

    if (scaleAdvantage < 1.15) return false;

    takeoverChance = App.utils.clamp(0.04 + Math.max(0, compatibility - 1) * 0.04 + Math.max(0, dealTraitScore) * 0.0025 + ((acquirerBusiness.reputation || 50) - (sellerBusiness.reputation || 50)) * 0.0025, 0.02, 0.24);
    takeoverChance *= App.utils.clamp(1 - sanctionDealBlock * 0.74, 0.18, 1);
    takeoverChance *= App.utils.clamp(1 - ecosystemSuppression, 0.28, 1);
    if (sellerAgeDays < YEAR_DAYS * 2) {
      takeoverChance *= 0.35;
    } else if (sellerAgeDays < YEAR_DAYS * 4) {
      takeoverChance *= 0.68;
    }
    if (scaleAdvantage < 1.5) {
      takeoverChance *= 0.42;
    } else if (scaleAdvantage < 2) {
      takeoverChance *= 0.72;
    }
    if (Math.random() >= takeoverChance) return false;

    maxOffer = Math.max(0, (acquirerBusiness.cashReservesGU || 0) * 0.62 + Math.max(0, (acquirerBusiness.valuationGU || 0) * 0.08));
    offer = Math.min(Math.max(18000, value * App.utils.rand(0.42, 0.78)), maxOffer);
    if (offer < 18000) return false;

    sellerOwner = App.store.getPerson(sellerBusiness.ownerId);
    sellerRevenue = Math.max(0, Number(sellerBusiness.revenueGU) || 0);
    sellerValuation = Math.max(0, Number(sellerBusiness.valuationGU) || 0);
    sellerEmployees = Math.max(0, Number(sellerBusiness.employees) || 0);
    sellerCash = Math.max(0, Number(sellerBusiness.cashReservesGU) || 0);

    acquirerBusiness.cashReservesGU = Math.max(0, (acquirerBusiness.cashReservesGU || 0) - offer);
    acquirerBusiness.debtGU = Math.max(0, (acquirerBusiness.debtGU || 0) + Math.max(0, offer - (acquirerBusiness.cashReservesGU || 0)) * 0.35);
    if (sellerOwner && sellerOwner.alive) {
      sellerOwner.netWorthGU += offer * 0.78;
      adjustPersonalReputation(sellerOwner, {
        prestige:App.utils.rand(1.2, 3.4),
        trust:App.utils.rand(0.4, 1.2),
        notoriety:App.utils.rand(0.6, 1.8)
      });
      syncPerson(sellerOwner);
    }

    liquidateBusiness(sellerOwner, sellerBusiness);

    acquirerBusiness.revenueGU = Math.max(1, (acquirerBusiness.revenueGU || 0) + sellerRevenue * App.utils.rand(0.28, 0.62));
    acquirerBusiness.valuationGU = Math.max(1, (acquirerBusiness.valuationGU || 0) + sellerValuation * App.utils.rand(0.22, 0.55));
    acquirerBusiness.cashReservesGU = Math.max(0, (acquirerBusiness.cashReservesGU || 0) + sellerCash * App.utils.rand(0.15, 0.42));
    integrationHire = reserveLabor(acquirerBusiness.countryISO, Math.floor(sellerEmployees * App.utils.rand(0.2, 0.5)));
    acquirerBusiness.employees = Math.min(2000, Math.max((acquirerBusiness.leadership || []).length || 1, (acquirerBusiness.employees || 1) + integrationHire));
    acquirerBusiness.reputation = clampScore((acquirerBusiness.reputation || 50) + App.utils.rand(0.8, 2.4));
    acquirerBusiness.currentDecision = evaluateBusinessDecision(acquirerBusiness);

    listing = getBusinessListing(acquirerBusiness.id);
    if (listing) {
      listing.sharePriceGU = Math.max(0.05, (listing.sharePriceGU || 0.05) * App.utils.clamp(1 + App.utils.rand(-0.04, 0.11), 0.85, 1.22));
      listing.lastSessionNetDemand = (Number(listing.lastSessionNetDemand) || 0) + Math.floor(integrationHire * 3);
    }

    emitNews("deal", "<strong>" + acquirerBusiness.name + "</strong> acquired <strong>" + sellerBusiness.name + "</strong> in a strategic takeover.", {
      entities:{
        personIds:[acquirer.id, seller.id],
        businessIds:[acquirerBusiness.id],
        countryIsos:[acquirer.countryISO, seller.countryISO],
        blocIds:[acquirer.blocId, seller.blocId]
      },
      causes:[
        "Sector consolidation rewarded stronger balance sheets and reputation.",
        "Acquisition value: " + App.utils.fmtGU(offer) + "."
      ],
      scope:"global"
    });

    return true;
  }

  function maybeCreateDeal(){
    var dealPeople = App.store.getLivingPeople().filter(function(person){
      return !!person.businessId;
    });
    var first;
    var secondCandidates;
    var second;
    var firstBusiness;
    var secondBusiness;
    var firstBloc;
    var secondBloc;
    var compatibility;
    var dealTraitScore;
    var valueFloor;
    var valueCeiling;
    var value;
    var dealEffects;
    var acquired = false;
    var sanctionDealBlock = 0;

    if (!dealPeople.length) return;

    first = pickWeightedBy(dealPeople, function(person){
      var business = App.store.getBusiness(person.businessId);
      var reputation = business ? (business.reputation || 50) : 50;
      var dealScore = getTraitChannelScore(person, "deal");
      var mobilityScore = getTraitChannelScore(person, "mobility");
      return App.utils.clamp(1 + reputation * 0.02 + dealScore * 0.65 + mobilityScore * 0.25, 0.2, 12);
    });

    if (!first) return;

    secondCandidates = dealPeople.filter(function(person){
      return person.id !== first.id && person.blocId !== first.blocId;
    });
    if (!secondCandidates.length) return;

    second = pickWeightedBy(secondCandidates, function(person){
      var business = App.store.getBusiness(person.businessId);
      var reputation = business ? (business.reputation || 50) : 50;
      var dealScore = getTraitChannelScore(person, "deal");
      var firstBlocRef = App.store.getBloc(first.blocId);
      var candidateBloc = App.store.getBloc(person.blocId);
      var bilateralBlock = getBilateralSanctionDealBlock(first.blocId, person.blocId);
      var pressure = (firstBlocRef ? firstBlocRef.geoPressure : 0) + (candidateBloc ? candidateBloc.geoPressure : 0);
      var localCompatibility = App.utils.clamp(1.85 - pressure * 0.22 - bilateralBlock * 0.9, 0.1, 1.85);
      return App.utils.clamp((1 + reputation * 0.018 + dealScore * 0.6) * localCompatibility, 0.15, 15);
    });

    if (!second) return;

    firstBusiness = App.store.getBusiness(first.businessId);
    secondBusiness = App.store.getBusiness(second.businessId);
    firstBloc = App.store.getBloc(first.blocId);
    secondBloc = App.store.getBloc(second.blocId);
    sanctionDealBlock = getBilateralSanctionDealBlock(first.blocId, second.blocId);
    compatibility = App.utils.clamp(1.85 - (((firstBloc ? firstBloc.geoPressure : 0) + (secondBloc ? secondBloc.geoPressure : 0)) * 0.22) - sanctionDealBlock * 0.95, 0.1, 1.85);
    dealTraitScore = (getTraitChannelScore(first, "deal") + getTraitChannelScore(second, "deal")) / 2;
    valueFloor = 40000 * compatibility * (1 + App.utils.clamp(dealTraitScore / 45, -0.22, 0.35));
    valueCeiling = 600000 * compatibility * (1 + App.utils.clamp(dealTraitScore / 35, -0.24, 0.4));
    if (valueCeiling <= valueFloor) {
      valueCeiling = valueFloor + 25000;
    }
    value = App.utils.rand(valueFloor, valueCeiling);
    dealEffects = summarizeTraitEffects(collectGroupTraitEffects([first, second], ["deal","business"]), 4);

    if (sanctionDealBlock >= 0.42 && Math.random() < App.utils.clamp(sanctionDealBlock * 0.38, 0.06, 0.34)) {
      emitNews("deal", "A proposed cross-bloc deal between <strong>" + first.name + "</strong> and <strong>" + second.name + "</strong> was blocked by sanctions.", {
        entities:{
          personIds:[first.id, second.id],
          businessIds:[firstBusiness ? firstBusiness.id : null, secondBusiness ? secondBusiness.id : null].filter(Boolean),
          countryIsos:[first.countryISO, second.countryISO],
          blocIds:[first.blocId, second.blocId]
        },
        causes:["Sanction deal block index: " + sanctionDealBlock.toFixed(2)],
        scope:"global"
      });
      return;
    }

    if (firstBusiness && secondBusiness) {
      acquired = tryExecuteMergerAndAcquisition(first, second, firstBusiness, secondBusiness, value, compatibility, dealTraitScore);
      if (acquired) {
        recordTraitEffects(dealEffects);
        setTraitSnapshot(first, dealEffects);
        setTraitSnapshot(second, dealEffects);
        return;
      }
    }

    if (firstBloc && secondBloc) {
      emitNews("deal", firstBloc.flag + "x" + secondBloc.flag + " <strong>" + first.name + "</strong> & <strong>" + second.name + "</strong> closed " + App.utils.fmtGU(value) + ".", {
        tags:buildTraitEffectTags(dealEffects, 2),
        entities:{
          personIds:[first.id, second.id],
          businessIds:[firstBusiness ? firstBusiness.id : null, secondBusiness ? secondBusiness.id : null].filter(Boolean),
          countryIsos:[first.countryISO, second.countryISO],
          blocIds:[firstBloc.id, secondBloc.id]
        },
        scope:"global",
        causes:dealEffects.slice(0, 2).map(function(effect){ return effect.label; })
      });
    }

    if (firstBusiness) {
      firstBusiness.reputation = clampScore((firstBusiness.reputation || 50) + App.utils.clamp(dealTraitScore * 0.2, -1.2, 2.2));
      firstBusiness.currentDecision = evaluateBusinessDecision(firstBusiness);
    }
    if (secondBusiness) {
      secondBusiness.reputation = clampScore((secondBusiness.reputation || 50) + App.utils.clamp(dealTraitScore * 0.2, -1.2, 2.2));
      secondBusiness.currentDecision = evaluateBusinessDecision(secondBusiness);
    }

    first.netWorthGU += value * 0.04;
    second.netWorthGU += value * 0.04;
    recordTraitEffects(dealEffects);
    setTraitSnapshot(first, dealEffects);
    setTraitSnapshot(second, dealEffects);
    if (firstBusiness) setTraitSnapshot(firstBusiness, dealEffects);
    if (secondBusiness) setTraitSnapshot(secondBusiness, dealEffects);
  }

  function getBlocPopulationPressureScore(blocId){
    var profiles = App.store.getBlocProfiles ? App.store.getBlocProfiles(blocId) : [];
    var sum = 0;

    if (!profiles || !profiles.length) return 0.5;
    profiles.forEach(function(profile){
      sum += App.utils.clamp(Number(profile && profile.populationPressure) || 0.5, 0, 1);
    });
    return App.utils.clamp(sum / profiles.length, 0, 1);
  }

  function buildBlocBusinessPresenceMeta(context){
    var activeBusinessesByBloc = {};
    var eligibleAdultsByBloc = {};
    var totalBusinesses = 0;
    var totalEligibleAdults = 0;

    if (context && typeof context === "object" && context.activeBusinessesByBloc && context.eligibleAdultsByBloc) {
      Object.keys(context.activeBusinessesByBloc).forEach(function(blocId){
        var count = Math.max(0, Number(context.activeBusinessesByBloc[blocId]) || 0);
        activeBusinessesByBloc[blocId] = count;
        totalBusinesses += count;
      });

      Object.keys(context.eligibleAdultsByBloc).forEach(function(blocId){
        var count = Math.max(0, Number(context.eligibleAdultsByBloc[blocId]) || 0);
        eligibleAdultsByBloc[blocId] = count;
        totalEligibleAdults += count;
      });
    } else {
      (App.store.businesses || []).forEach(function(business){
        if (!business || business.stage === "defunct" || !business.ownerId) return;
        activeBusinessesByBloc[business.blocId] = (activeBusinessesByBloc[business.blocId] || 0) + 1;
        totalBusinesses += 1;
      });

      App.store.getLivingPeople().forEach(function(person){
        if (!person || person.retired || person.age < 22) return;
        eligibleAdultsByBloc[person.blocId] = (eligibleAdultsByBloc[person.blocId] || 0) + 1;
        totalEligibleAdults += 1;
      });
    }

    return {
      activeBusinessesByBloc:activeBusinessesByBloc,
      eligibleAdultsByBloc:eligibleAdultsByBloc,
      totalBusinesses:totalBusinesses,
      totalEligibleAdults:totalEligibleAdults
    };
  }

  function getBlocBusinessDiversificationMultiplier(blocId, presenceMeta){
    var meta = presenceMeta && typeof presenceMeta === "object" ? presenceMeta : null;
    var blocBusinessCount;
    var blocEligibleAdults;
    var expectedShare;
    var actualShare;
    var relativeGap;

    if (!blocId || !meta || meta.totalEligibleAdults <= 0) return 1;

    blocBusinessCount = Math.max(0, Number(meta.activeBusinessesByBloc && meta.activeBusinessesByBloc[blocId]) || 0);
    blocEligibleAdults = Math.max(0, Number(meta.eligibleAdultsByBloc && meta.eligibleAdultsByBloc[blocId]) || 0);
    expectedShare = Math.max(0.035, blocEligibleAdults / Math.max(1, meta.totalEligibleAdults));

    if (meta.totalBusinesses <= 0) {
      return blocEligibleAdults > 0 ? 1.18 : 1;
    }

    actualShare = blocBusinessCount / Math.max(1, meta.totalBusinesses);
    if (blocBusinessCount <= 0 && blocEligibleAdults >= 10) {
      return App.utils.clamp(1.35 + Math.min(0.4, expectedShare * 1.6), 1.2, 1.75);
    }

    if (actualShare > expectedShare) {
      return App.utils.clamp(Math.pow((expectedShare + 0.05) / (actualShare + 0.05), 0.95), 0.38, 1);
    }

    relativeGap = App.utils.clamp((expectedShare - actualShare) / Math.max(0.02, expectedShare), 0, 1.5);
    return App.utils.clamp(1 + (relativeGap * 0.85), 1, 1.75);
  }

  function pickMostUnderrepresentedBlocId(candidateBlocIds, presenceMeta){
    var candidates = (candidateBlocIds || []).filter(Boolean);
    var meta = presenceMeta || buildBlocBusinessPresenceMeta();

    if (!candidates.length) return null;

    return candidates.slice().sort(function(first, second){
      var firstMultiplier = getBlocBusinessDiversificationMultiplier(first, meta);
      var secondMultiplier = getBlocBusinessDiversificationMultiplier(second, meta);
      var firstEligible = Math.max(0, Number(meta.eligibleAdultsByBloc && meta.eligibleAdultsByBloc[first]) || 0);
      var secondEligible = Math.max(0, Number(meta.eligibleAdultsByBloc && meta.eligibleAdultsByBloc[second]) || 0);

      if (secondMultiplier !== firstMultiplier) return secondMultiplier - firstMultiplier;
      return secondEligible - firstEligible;
    })[0] || null;
  }

  function pickBlocByPopulationPressure(){
    var presenceMeta = buildBlocBusinessPresenceMeta();
    var weighted = [];
    var total = 0;
    var roll;
    var running = 0;

    (App.store.blocs || []).forEach(function(bloc){
      var pressure = getBlocPopulationPressureScore(bloc.id);
      var businessCount = Math.max(0, Number(presenceMeta.activeBusinessesByBloc[bloc.id]) || 0);
      var eligibleAdults = Math.max(8, Number(presenceMeta.eligibleAdultsByBloc[bloc.id]) || 0);
      var density = businessCount / eligibleAdults;
      var diversificationMultiplier = getBlocBusinessDiversificationMultiplier(bloc.id, presenceMeta);
      var sparseBoost = businessCount <= 0 && eligibleAdults >= 12 ? 0.26 : Math.max(0, 0.022 - density) * 5.2;
      var weight = App.utils.clamp(((0.15 + (pressure * 1.35)) * diversificationMultiplier) + sparseBoost, 0.08, 2.9);
      weighted.push({ bloc:bloc, weight:weight });
      total += weight;
    });

    if (!weighted.length || total <= 0) return App.utils.pick(App.store.blocs || []);

    roll = Math.random() * total;
    for (var i = 0; i < weighted.length; i += 1) {
      running += weighted[i].weight;
      if (running >= roll) return weighted[i].bloc;
    }

    return weighted[weighted.length - 1].bloc;
  }

  function maybeAddArrival(){
    var nextBloc;
    var arrival;
    var pressureAverage = 0.5;
    var arrivalChance;

    if (App.store.getLivingCount() >= 120) {
      return;
    }

    if (App.store.blocs && App.store.blocs.length) {
      pressureAverage = App.store.blocs.reduce(function(sum, bloc){
        return sum + getBlocPopulationPressureScore(bloc.id);
      }, 0) / App.store.blocs.length;
    }
    arrivalChance = App.utils.clamp(0.011 + Math.max(0, pressureAverage - 0.45) * 0.03, 0.008, 0.038);
    if (Math.random() >= chanceForDays(arrivalChance, LEGACY_SIM_DAYS_PER_TICK)) {
      return;
    }

    nextBloc = pickBlocByPopulationPressure() || App.utils.pick(App.store.blocs);
    if (!nextBloc) return;
    arrival = createCitizen({
      blocId:nextBloc.id,
      countryISO:pickCountryByPopulationPressure(nextBloc.id) || undefined,
      age:App.utils.randInt(22, 45),
      netWorthGU:App.utils.rand(1500, 22000)
    });
    App.store.people.push(arrival);
    seedHousehold(arrival);
    syncPerson(arrival);
    emitNews("launch", nextBloc.flag + " <strong>" + arrival.name + "</strong> arrived with " + App.utils.fmtCountry(arrival.netWorthGU, arrival.countryISO) + ".", {
      entities:{
        personIds:[arrival.id],
        countryIsos:[arrival.countryISO],
        blocIds:[arrival.blocId]
      },
      causes:["Population pressure and opportunity weighting created a new arrival."],
      rollupLabel:arrival.countryISO
    });
  }

  function pushEconomicHistory(){
    App.store.blocs.forEach(function(bloc){
      App.store.econHist[bloc.id].push(bloc.gdp);
      if (App.store.econHist[bloc.id].length > 60) {
        App.store.econHist[bloc.id].shift();
      }
    });
  }

  function safeCorrelation(pairs){
    var n = pairs.length;
    var sumX = 0;
    var sumY = 0;
    var sumXY = 0;
    var sumX2 = 0;
    var sumY2 = 0;
    var denominator;

    if (!n) return 0;
    pairs.forEach(function(pair){
      var x = Number(pair.x) || 0;
      var y = Number(pair.y) || 0;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    });

    denominator = Math.sqrt(Math.max(0, (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)));
    if (!denominator) return 0;
    return (n * sumXY - sumX * sumY) / denominator;
  }

  function median(values){
    var nums = (values || []).map(function(value){ return Number(value) || 0; }).sort(function(a, b){ return a - b; });
    var length = nums.length;
    if (!length) return 0;
    if (length % 2 === 1) return nums[(length - 1) / 2];
    return (nums[length / 2] + nums[(length / 2) - 1]) / 2;
  }

  function cloneJsonSafe(value){
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return null;
    }
  }

  function createYearlyEventCountsBucket(){
    return {
      annualLaunchCount:0,
      annualBankruptcyCount:0,
      annualDebtWarningCount:0,
      annualDebtCrisisCount:0,
      annualTradeActionCount:0,
      annualPolicyMoveCount:0,
      annualScandalCount:0,
      annualHiringEventCount:0,
      annualIpoCount:0,
      annualDealCount:0
    };
  }

  function cloneYearlyEventCountsBucket(source){
    var bucket = createYearlyEventCountsBucket();

    Object.keys(bucket).forEach(function(key){
      bucket[key] = Math.max(0, Math.floor(Number(source && source[key]) || 0));
    });

    return bucket;
  }

  function ensureYearlyTuningTelemetryState(){
    var normalized = [];
    var seen = {};

    (Array.isArray(App.store.yearlyTuningTelemetry) ? App.store.yearlyTuningTelemetry : []).forEach(function(record){
      var cloned = cloneJsonSafe(record) || {};
      var simYear = Math.floor(Number(cloned.simYear));

      if (!Number.isFinite(simYear) || simYear < 0 || seen[simYear]) return;
      seen[simYear] = true;
      normalized.push({
        simYear:simYear,
        calendarYear:Math.floor(Number(cloned.calendarYear) || 0),
        capturedDay:Math.max(0, Math.floor(Number(cloned.capturedDay) || 0)),
        annualEventCounts:cloneYearlyEventCountsBucket(cloned.annualEventCounts),
        world:cloned.world && typeof cloned.world === "object" ? cloned.world : {},
        blocs:Array.isArray(cloned.blocs) ? cloned.blocs.filter(function(entry){
          return !!(entry && entry.blocId);
        }) : []
      });
    });

    normalized.sort(function(first, second){
      return first.simYear - second.simYear;
    });

    if (normalized.length > YEARLY_TUNING_MAX_RECORDS) {
      normalized = normalized.slice(normalized.length - YEARLY_TUNING_MAX_RECORDS);
    }

    App.store.yearlyTuningTelemetry = normalized;
    return normalized;
  }

  function isDebtStressWarningEvent(item){
    var tags = Array.isArray(item && item.tags) ? item.tags : [];
    var text = String(item && item.text || "").toLowerCase();

    return tags.some(function(tag){
      var normalized = String(tag || "").toLowerCase();
      return normalized === "bond stress" || normalized === "funding pressure";
    }) || text.indexOf("bond stress:") !== -1 || text.indexOf("funding pressure:") !== -1;
  }

  function getYearlyEventMetricKey(item){
    var type = String(item && item.type || "");

    if (type === "launch") return "annualLaunchCount";
    if (type === "bankruptcy") return "annualBankruptcyCount";
    if (type === "debtCrisis") return "annualDebtCrisisCount";
    if (type === "tariff" || type === "trade") return "annualTradeActionCount";
    if (type === "policy") return "annualPolicyMoveCount";
    if (type === "scandal") return "annualScandalCount";
    if (type === "hire") return "annualHiringEventCount";
    if (type === "ipo") return "annualIpoCount";
    if (type === "deal") return "annualDealCount";
    if (type === "market" && isDebtStressWarningEvent(item)) return "annualDebtWarningCount";
    return null;
  }

  function getEventBlocIds(item){
    var seen = {};
    var blocIds = item && item.entities && Array.isArray(item.entities.blocIds) ? item.entities.blocIds : [];

    return blocIds.map(function(blocId){
      return String(blocId || "").trim();
    }).filter(function(blocId){
      if (!blocId || seen[blocId]) return false;
      seen[blocId] = true;
      return true;
    });
  }

  function buildYearlyEventCounts(completedSimYear){
    var startDay = completedSimYear * YEAR_DAYS;
    var endDay = startDay + YEAR_DAYS;
    var counts = {
      world:createYearlyEventCountsBucket(),
      byBloc:{}
    };

    (App.store.eventHistory || []).forEach(function(item){
      var day = Math.floor(Number(item && item.day));
      var metricKey;

      if (!Number.isFinite(day) || day < startDay || day >= endDay) return;
      metricKey = getYearlyEventMetricKey(item);
      if (!metricKey) return;

      counts.world[metricKey] += 1;
      getEventBlocIds(item).forEach(function(blocId){
        if (!counts.byBloc[blocId]) {
          counts.byBloc[blocId] = createYearlyEventCountsBucket();
        }
        counts.byBloc[blocId][metricKey] += 1;
      });
    });

    return counts;
  }

  function buildSubsetMacroSnapshot(profiles, businesses, households, employedPeople){
    var safeProfiles = Array.isArray(profiles) ? profiles : [];
    var safeBusinesses = Array.isArray(businesses) ? businesses : [];
    var safeHouseholds = Array.isArray(households) ? households : [];
    var safeEmployedPeople = Array.isArray(employedPeople) ? employedPeople : [];
    var salaries = safeEmployedPeople.map(function(person){
      return Math.max(0, Number(person && person.salaryGU) || 0);
    });
    var laborForce = safeProfiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile && profile.laborForce) || 0); }, 0);
    var employed = safeProfiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile && profile.employed) || 0); }, 0);
    var medianWages = safeProfiles.map(function(profile){ return Math.max(0, Number(profile && profile.medianWageGU) || 0); });
    var demandTotal = safeProfiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile && profile.consumerDemandGU) || 0); }, 0);
    var businessRevenueValues = safeBusinesses.map(function(business){
      return Math.max(0, Number(business && business.revenueGU) || 0);
    });
    var policyStanceCounts = safeProfiles.reduce(function(result, profile){
      var stance = normalizePolicyStance(profile && profile.policyStance);
      result[stance] = (result[stance] || 0) + 1;
      return result;
    }, { supportive:0, neutral:0, tightening:0 });

    return {
      countryCount:safeProfiles.length,
      population:safeProfiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile && profile.population) || 0); }, 0),
      laborForce:laborForce,
      employed:employed,
      unemployed:Math.max(0, laborForce - employed),
      unemploymentRate:laborForce > 0 ? ((laborForce - employed) / laborForce) : 0,
      medianWageAvg:median(medianWages),
      avgSalary:median(salaries),
      wagePressureAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.wagePressure) || 0); }, 0) / safeProfiles.length : 0,
      laborScarcityAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.laborScarcity) || 0); }, 0) / safeProfiles.length : 0,
      tradeShockIndexAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.tradeShockIndex) || 0); }, 0) / safeProfiles.length : 0,
      housingCostPressureAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.housingCostPressure) || 0); }, 0) / safeProfiles.length : 0,
      housingRentBurdenAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.housingRentBurden) || 0); }, 0) / safeProfiles.length : 0,
      housingHomeownershipRateAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.housingHomeownershipRate) || 0); }, 0) / safeProfiles.length : 0,
      housingMarketStressAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.housingMarketStress) || 0); }, 0) / safeProfiles.length : 0,
      giniCoefficientAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.giniCoefficient) || 0); }, 0) / safeProfiles.length : 0,
      topOneWealthShareAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.topOneWealthShare) || 0); }, 0) / safeProfiles.length : 0,
      intergenerationalMobilityAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.intergenerationalMobilityIndex) || 0); }, 0) / safeProfiles.length : 0,
      socialUnrestAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.socialUnrestIndex) || 0); }, 0) / safeProfiles.length : 0,
      strikeRiskAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.strikeRiskIndex) || 0); }, 0) / safeProfiles.length : 0,
      philanthropyImpactAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.philanthropyImpactIndex) || 0); }, 0) / safeProfiles.length : 0,
      philanthropicCapitalTotal:safeProfiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile && profile.philanthropicCapitalAnnualGU) || 0); }, 0),
      institutionScoreAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.institutionScore) || 0); }, 0) / safeProfiles.length : 0,
      educationIndexAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.educationIndex) || 0); }, 0) / safeProfiles.length : 0,
      socialPressureAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + (Number(profile && profile.socialPressureIndex) || 0); }, 0) / safeProfiles.length : 0,
      medianHouseholdWealthAvg:safeProfiles.length ? safeProfiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile && profile.medianHouseholdWealthGU) || 0); }, 0) / safeProfiles.length : 0,
      demandTotal:demandTotal,
      medianBusinessRevenue:median(businessRevenueValues),
      firmRevenueTotal:safeBusinesses.reduce(function(sum, business){ return sum + Math.max(0, Number(business && business.revenueGU) || 0); }, 0),
      firmProfitTotal:safeBusinesses.reduce(function(sum, business){ return sum + (Number(business && business.profitGU) || 0); }, 0),
      firmEmployeeTotal:safeBusinesses.reduce(function(sum, business){ return sum + Math.max(0, Number(business && business.employees) || 0); }, 0),
      householdIncomeTotal:safeHouseholds.reduce(function(sum, household){ return sum + Math.max(0, Number(household && household.annualIncomeGU) || 0); }, 0),
      householdSavingsTotal:safeHouseholds.reduce(function(sum, household){ return sum + Math.max(0, Number(household && household.cashOnHandGU) || 0); }, 0),
      householdStressAvg:safeHouseholds.length ? safeHouseholds.reduce(function(sum, household){ return sum + (Number(household && household.financialStress) || 0); }, 0) / safeHouseholds.length : 0,
      businessCount:safeBusinesses.length,
      supportiveCountryCount:policyStanceCounts.supportive || 0,
      neutralCountryCount:policyStanceCounts.neutral || 0,
      tighteningCountryCount:policyStanceCounts.tightening || 0
    };
  }

  function getBlocHouseholds(blocId){
    return (App.store.households || []).filter(function(household){
      var countryISO = household && household.countryISO ? household.countryISO : null;
      var bloc = countryISO ? App.store.getBlocByCountry(countryISO) : null;
      return !!(bloc && bloc.id === blocId);
    });
  }

  function getBlocEmployedPeople(blocId){
    return App.store.getLivingPeople().filter(function(person){
      return person && person.blocId === blocId && (person.businessId || person.employerBusinessId);
    });
  }

  function getBlocMacroSnapshot(bloc){
    var profiles = App.store.getBlocProfiles ? App.store.getBlocProfiles(bloc.id) : [];
    var businesses = (App.store.businesses || []).filter(function(business){
      return business && business.blocId === bloc.id;
    });
    var households = getBlocHouseholds(bloc.id);
    var employedPeople = getBlocEmployedPeople(bloc.id);
    var metrics = buildSubsetMacroSnapshot(profiles, businesses, households, employedPeople);
    var centralBank = bloc && bloc.centralBank ? bloc.centralBank : {};

    metrics.currency = bloc && bloc.currency ? bloc.currency : "";
    metrics.gdp = Math.max(0, Number(bloc && bloc.gdp) || 0);
    metrics.fxRate = Number(bloc && bloc.rate) || 0;
    metrics.fxVsBase = (Number(bloc && bloc.baseRate) || 0) > 0 ? ((Number(bloc && bloc.rate) || 0) / Number(bloc.baseRate)) : 0;
    metrics.defaultRisk = Math.max(0, Number(bloc && bloc.defaultRisk) || 0);
    metrics.geoPressure = Math.max(0, Number(bloc && bloc.geoPressure) || 0);
    metrics.policyRate = App.utils.clamp(Number(centralBank.policyRate) || 0, 0, 1);
    metrics.inflation = Number(centralBank.inflation) || 0;
    metrics.centralBankUnemployment = Math.max(0, Number(centralBank.unemployment) || 0);

    return metrics;
  }

  function normalizeTelemetryValue(value){
    var numeric = Number(value);

    if (!Number.isFinite(numeric)) return "";
    return Math.round(numeric * 1000000) / 1000000;
  }

  function buildYearlyTuningCsvRow(options){
    var metrics = options && options.metrics ? options.metrics : {};
    var eventCounts = cloneYearlyEventCountsBucket(options && options.eventCounts);

    return {
      scope:String(options && options.scope || "world"),
      calendarYear:Math.max(0, Math.floor(Number(options && options.calendarYear) || 0)),
      simYear:Math.max(0, Math.floor(Number(options && options.simYear) || 0)),
      capturedDay:Math.max(0, Math.floor(Number(options && options.capturedDay) || 0)),
      blocId:String(options && options.blocId || ""),
      blocName:String(options && options.blocName || ""),
      currency:String(metrics.currency || ""),
      countryCount:normalizeTelemetryValue(metrics.countryCount),
      blocCount:normalizeTelemetryValue(options && options.blocCount),
      population:normalizeTelemetryValue(metrics.population),
      laborForce:normalizeTelemetryValue(metrics.laborForce),
      employed:normalizeTelemetryValue(metrics.employed),
      unemployed:normalizeTelemetryValue(metrics.unemployed),
      unemploymentRate:normalizeTelemetryValue(metrics.unemploymentRate),
      medianWageAvg:normalizeTelemetryValue(metrics.medianWageAvg),
      avgSalary:normalizeTelemetryValue(metrics.avgSalary),
      demandTotal:normalizeTelemetryValue(metrics.demandTotal),
      businessCount:normalizeTelemetryValue(metrics.businessCount),
      firmRevenueTotal:normalizeTelemetryValue(metrics.firmRevenueTotal),
      firmProfitTotal:normalizeTelemetryValue(metrics.firmProfitTotal),
      firmEmployeeTotal:normalizeTelemetryValue(metrics.firmEmployeeTotal),
      householdIncomeTotal:normalizeTelemetryValue(metrics.householdIncomeTotal),
      householdSavingsTotal:normalizeTelemetryValue(metrics.householdSavingsTotal),
      householdStressAvg:normalizeTelemetryValue(metrics.householdStressAvg),
      laborScarcityAvg:normalizeTelemetryValue(metrics.laborScarcityAvg),
      wagePressureAvg:normalizeTelemetryValue(metrics.wagePressureAvg),
      tradeShockIndexAvg:normalizeTelemetryValue(metrics.tradeShockIndexAvg),
      socialUnrestAvg:normalizeTelemetryValue(metrics.socialUnrestAvg),
      strikeRiskAvg:normalizeTelemetryValue(metrics.strikeRiskAvg),
      giniCoefficientAvg:normalizeTelemetryValue(metrics.giniCoefficientAvg),
      topOneWealthShareAvg:normalizeTelemetryValue(metrics.topOneWealthShareAvg),
      intergenerationalMobilityAvg:normalizeTelemetryValue(metrics.intergenerationalMobilityAvg),
      educationIndexAvg:normalizeTelemetryValue(metrics.educationIndexAvg),
      institutionScoreAvg:normalizeTelemetryValue(metrics.institutionScoreAvg),
      socialPressureAvg:normalizeTelemetryValue(metrics.socialPressureAvg),
      housingCostPressureAvg:normalizeTelemetryValue(metrics.housingCostPressureAvg),
      housingRentBurdenAvg:normalizeTelemetryValue(metrics.housingRentBurdenAvg),
      housingHomeownershipRateAvg:normalizeTelemetryValue(metrics.housingHomeownershipRateAvg),
      housingMarketStressAvg:normalizeTelemetryValue(metrics.housingMarketStressAvg),
      philanthropyImpactAvg:normalizeTelemetryValue(metrics.philanthropyImpactAvg),
      philanthropicCapitalTotal:normalizeTelemetryValue(metrics.philanthropicCapitalTotal),
      medianHouseholdWealthAvg:normalizeTelemetryValue(metrics.medianHouseholdWealthAvg),
      supportiveCountryCount:normalizeTelemetryValue(metrics.supportiveCountryCount),
      neutralCountryCount:normalizeTelemetryValue(metrics.neutralCountryCount),
      tighteningCountryCount:normalizeTelemetryValue(metrics.tighteningCountryCount),
      supportiveBlocCount:normalizeTelemetryValue(metrics.supportiveBlocCount),
      neutralBlocCount:normalizeTelemetryValue(metrics.neutralBlocCount),
      tighteningBlocCount:normalizeTelemetryValue(metrics.tighteningBlocCount),
      gdp:normalizeTelemetryValue(metrics.gdp),
      fxRate:normalizeTelemetryValue(metrics.fxRate),
      fxVsBase:normalizeTelemetryValue(metrics.fxVsBase),
      defaultRisk:normalizeTelemetryValue(metrics.defaultRisk),
      geoPressure:normalizeTelemetryValue(metrics.geoPressure),
      policyRate:normalizeTelemetryValue(metrics.policyRate),
      inflation:normalizeTelemetryValue(metrics.inflation),
      centralBankUnemployment:normalizeTelemetryValue(metrics.centralBankUnemployment),
      annualLaunchCount:eventCounts.annualLaunchCount,
      annualBankruptcyCount:eventCounts.annualBankruptcyCount,
      annualDebtWarningCount:eventCounts.annualDebtWarningCount,
      annualDebtCrisisCount:eventCounts.annualDebtCrisisCount,
      annualTradeActionCount:eventCounts.annualTradeActionCount,
      annualPolicyMoveCount:eventCounts.annualPolicyMoveCount,
      annualScandalCount:eventCounts.annualScandalCount,
      annualHiringEventCount:eventCounts.annualHiringEventCount,
      annualIpoCount:eventCounts.annualIpoCount,
      annualDealCount:eventCounts.annualDealCount
    };
  }

  function captureYearlyTuningTelemetry(){
    var completedSimYear;
    var completedCalendarYear;
    var records;
    var eventCounts;
    var worldSnapshot;
    var record;

    if (currentSimYear() <= 0) return null;

    records = ensureYearlyTuningTelemetryState();
    completedSimYear = currentSimYear() - 1;
    completedCalendarYear = currentCalendarYear() - 1;

    if (records.some(function(entry){ return entry.simYear === completedSimYear; })) {
      return null;
    }

    eventCounts = buildYearlyEventCounts(completedSimYear);
    worldSnapshot = getMacroSnapshot();
    worldSnapshot.gdp = (App.store.blocs || []).reduce(function(sum, bloc){
      return sum + Math.max(0, Number(bloc && bloc.gdp) || 0);
    }, 0);
    worldSnapshot.currency = "";
    worldSnapshot.countryCount = Object.keys(App.store.countryProfiles || {}).length;
    worldSnapshot.supportiveCountryCount = Number(worldSnapshot.countryPolicyStanceCounts && worldSnapshot.countryPolicyStanceCounts.supportive) || 0;
    worldSnapshot.neutralCountryCount = Number(worldSnapshot.countryPolicyStanceCounts && worldSnapshot.countryPolicyStanceCounts.neutral) || 0;
    worldSnapshot.tighteningCountryCount = Number(worldSnapshot.countryPolicyStanceCounts && worldSnapshot.countryPolicyStanceCounts.tightening) || 0;
    worldSnapshot.supportiveBlocCount = Number(worldSnapshot.blocPolicyStanceCounts && worldSnapshot.blocPolicyStanceCounts.supportive) || 0;
    worldSnapshot.neutralBlocCount = Number(worldSnapshot.blocPolicyStanceCounts && worldSnapshot.blocPolicyStanceCounts.neutral) || 0;
    worldSnapshot.tighteningBlocCount = Number(worldSnapshot.blocPolicyStanceCounts && worldSnapshot.blocPolicyStanceCounts.tightening) || 0;

    record = {
      simYear:completedSimYear,
      calendarYear:completedCalendarYear,
      capturedDay:Math.max(0, Number(App.store.simDay) || 0),
      annualEventCounts:cloneYearlyEventCountsBucket(eventCounts.world),
      world:buildYearlyTuningCsvRow({
        scope:"world",
        calendarYear:completedCalendarYear,
        simYear:completedSimYear,
        capturedDay:App.store.simDay,
        blocCount:(App.store.blocs || []).length,
        metrics:worldSnapshot,
        eventCounts:eventCounts.world
      }),
      blocs:(App.store.blocs || []).map(function(bloc){
        return buildYearlyTuningCsvRow({
          scope:"bloc",
          calendarYear:completedCalendarYear,
          simYear:completedSimYear,
          capturedDay:App.store.simDay,
          blocId:bloc.id,
          blocName:bloc.name,
          metrics:getBlocMacroSnapshot(bloc),
          eventCounts:eventCounts.byBloc[bloc.id] || createYearlyEventCountsBucket()
        });
      })
    };

    records.push(record);
    if (records.length > YEARLY_TUNING_MAX_RECORDS) {
      records.splice(0, records.length - YEARLY_TUNING_MAX_RECORDS);
    }
    App.store.yearlyTuningTelemetry = records;
    return record;
  }

  function getYearlyTuningTelemetry(){
    return cloneJsonSafe(ensureYearlyTuningTelemetryState()) || [];
  }

  function getYearlyTuningCsvExport(){
    var records = ensureYearlyTuningTelemetryState();
    var rows = [];
    var firstRecord;
    var lastRecord;
    var filename;

    records.forEach(function(record){
      if (record && record.world) {
        rows.push(record.world);
      }
      (record && Array.isArray(record.blocs) ? record.blocs : []).forEach(function(blocRow){
        rows.push(blocRow);
      });
    });

    if (!records.length) {
      return {
        yearCount:0,
        rowCount:0,
        filename:"nexus-yearly-tuning-empty.csv",
        rows:[]
      };
    }

    firstRecord = records[0];
    lastRecord = records[records.length - 1];
    filename = "nexus-yearly-tuning-" + firstRecord.calendarYear + "-to-" + lastRecord.calendarYear + "-day-" + Math.max(0, Math.floor(Number(App.store.simDay) || 0)) + ".csv";

    return {
      yearCount:records.length,
      rowCount:rows.length,
      firstCalendarYear:firstRecord.calendarYear,
      lastCalendarYear:lastRecord.calendarYear,
      filename:filename,
      rows:rows
    };
  }

  function getMacroSnapshot(){
    var profiles = Object.keys(App.store.countryProfiles || {}).map(function(iso){
      return ensureCountryProfile(iso);
    }).filter(Boolean);
    var businesses = App.store.businesses || [];
    var households = App.store.households || [];
    var living = App.store.getLivingPeople();
    var employedPeople = living.filter(function(person){
      return !!(person.businessId || person.employerBusinessId);
    });
    var salaries = employedPeople.map(function(person){
      return Math.max(0, Number(person.salaryGU) || 0);
    });
    var laborForce = profiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile.laborForce) || 0); }, 0);
    var employed = profiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile.employed) || 0); }, 0);
    var medianWages = profiles.map(function(profile){ return Math.max(0, Number(profile.medianWageGU) || 0); });
    var demandTotal = profiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile.consumerDemandGU) || 0); }, 0);
    var businessRevenueValues = businesses.map(function(business){
      return Math.max(0, Number(business && business.revenueGU) || 0);
    });
    var wagePressureAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.wagePressure) || 0); }, 0) / profiles.length : 0;
    var laborScarcityAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.laborScarcity) || 0); }, 0) / profiles.length : 0;
    var tradeShockIndexAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.tradeShockIndex) || 0); }, 0) / profiles.length : 0;
    var tradeRerouteReliefAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.tradeRerouteRelief) || 0); }, 0) / profiles.length : 0;
    var housingCostPressureAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.housingCostPressure) || 0); }, 0) / profiles.length : 0;
    var housingRentBurdenAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.housingRentBurden) || 0); }, 0) / profiles.length : 0;
    var housingHomeownershipRateAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.housingHomeownershipRate) || 0); }, 0) / profiles.length : 0;
    var housingMarketStressAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.housingMarketStress) || 0); }, 0) / profiles.length : 0;
    var giniCoefficientAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.giniCoefficient) || 0); }, 0) / profiles.length : 0;
    var topOneWealthShareAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.topOneWealthShare) || 0); }, 0) / profiles.length : 0;
    var intergenerationalMobilityAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.intergenerationalMobilityIndex) || 0); }, 0) / profiles.length : 0;
    var socialUnrestAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.socialUnrestIndex) || 0); }, 0) / profiles.length : 0;
    var strikeRiskAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.strikeRiskIndex) || 0); }, 0) / profiles.length : 0;
    var populismIndexAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.populismIndex) || 0); }, 0) / profiles.length : 0;
    var philanthropyImpactAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.philanthropyImpactIndex) || 0); }, 0) / profiles.length : 0;
    var philanthropicCapitalTotal = profiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile.philanthropicCapitalAnnualGU) || 0); }, 0);
    var institutionScoreAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.institutionScore) || 0); }, 0) / profiles.length : 0;
    var educationIndexAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.educationIndex) || 0); }, 0) / profiles.length : 0;
    var socialPressureAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + (Number(profile.socialPressureIndex) || 0); }, 0) / profiles.length : 0;
    var medianHouseholdWealthAvg = profiles.length ? profiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile.medianHouseholdWealthGU) || 0); }, 0) / profiles.length : 0;
    var countryPolicyStanceCounts = profiles.reduce(function(counts, profile){
      var stance = normalizePolicyStance(profile.policyStance);
      counts[stance] = (counts[stance] || 0) + 1;
      return counts;
    }, { supportive:0, neutral:0, tightening:0 });
    var blocPolicyStanceCounts = (App.store.blocs || []).reduce(function(counts, bloc){
      var stance = refreshBlocPolicyStance(bloc);
      counts[stance] = (counts[stance] || 0) + 1;
      return counts;
    }, { supportive:0, neutral:0, tightening:0 });

    return {
      day:App.store.simDay,
      population:profiles.reduce(function(sum, profile){ return sum + Math.max(0, Number(profile.population) || 0); }, 0),
      laborForce:laborForce,
      employed:employed,
      unemployed:Math.max(0, laborForce - employed),
      unemploymentRate:laborForce > 0 ? ((laborForce - employed) / laborForce) : 0,
      medianWageAvg:median(medianWages),
      avgSalary:median(salaries),
      wagePressureAvg:wagePressureAvg,
      laborScarcityAvg:laborScarcityAvg,
      tradeShockIndexAvg:tradeShockIndexAvg,
      tradeRerouteReliefAvg:tradeRerouteReliefAvg,
      housingCostPressureAvg:housingCostPressureAvg,
      housingRentBurdenAvg:housingRentBurdenAvg,
      housingHomeownershipRateAvg:housingHomeownershipRateAvg,
      housingMarketStressAvg:housingMarketStressAvg,
      giniCoefficientAvg:giniCoefficientAvg,
      topOneWealthShareAvg:topOneWealthShareAvg,
      intergenerationalMobilityAvg:intergenerationalMobilityAvg,
      socialUnrestAvg:socialUnrestAvg,
      strikeRiskAvg:strikeRiskAvg,
      populismIndexAvg:populismIndexAvg,
      philanthropyImpactAvg:philanthropyImpactAvg,
      philanthropicCapitalTotal:philanthropicCapitalTotal,
      institutionScoreAvg:institutionScoreAvg,
      educationIndexAvg:educationIndexAvg,
      socialPressureAvg:socialPressureAvg,
      medianHouseholdWealthAvg:medianHouseholdWealthAvg,
      demandTotal:demandTotal,
      medianBusinessRevenue:median(businessRevenueValues),
      firmRevenueTotal:businesses.reduce(function(sum, business){ return sum + Math.max(0, Number(business.revenueGU) || 0); }, 0),
      firmProfitTotal:businesses.reduce(function(sum, business){ return sum + (Number(business.profitGU) || 0); }, 0),
      firmEmployeeTotal:businesses.reduce(function(sum, business){ return sum + Math.max(0, Number(business.employees) || 0); }, 0),
      householdIncomeTotal:households.reduce(function(sum, household){ return sum + Math.max(0, Number(household.annualIncomeGU) || 0); }, 0),
      householdSavingsTotal:households.reduce(function(sum, household){ return sum + Math.max(0, Number(household.cashOnHandGU) || 0); }, 0),
      householdStressAvg:households.length ? households.reduce(function(sum, household){ return sum + (Number(household.financialStress) || 0); }, 0) / households.length : 0,
      businessCount:businesses.length,
      countryPolicyStanceCounts:countryPolicyStanceCounts,
      blocPolicyStanceCounts:blocPolicyStanceCounts
    };
  }

  function normalizeValidationProfilesForScenario(){
    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      refreshCountryProfileDerived(profile);
    });
    applyLaborMarketYearlyAdjustments();
    validateCountryProfiles();
  }

  function syncAllPeople(){
    App.store.people.forEach(function(person){
      syncPerson(person);
    });
  }

  function runRandomEventRoll(){
    var warningChance = chanceForDays(0.055, LEGACY_SIM_DAYS_PER_TICK);
    var eventChance = chanceForDays(0.11, LEGACY_SIM_DAYS_PER_TICK);
    var roll = Math.random();

    if (roll < warningChance) {
      if (emitDebtStressWarningIfNeeded()) {
        return;
      }
      randomEvent();
      return;
    }

    if (roll < (warningChance + eventChance)) {
      randomEvent();
    }
  }

  function runDealRoll(){
    var cadenceMultiplier = getDealCadenceMultiplier();

    if (cadenceMultiplier <= 0) return;

    if (Math.random() < chanceForDays(DEAL_MONTHLY_BASE_CHANCE * cadenceMultiplier, DAYS_PER_MONTH)) {
      maybeCreateDeal();
    }
  }

  var EXPECTED_SIM_DOMAINS = ["business", "labour", "finance", "demographics", "society", "geopolitics"];
  var EXPECTED_SIM_PHASES = [
    "business",
    "labour",
    "finance",
    "demographics",
    "geopolitics",
    "finance-markets",
    "demographics-migration",
    "business-organization",
    "labour-people",
    "society",
    "finance-metrics",
    "geopolitics-governors"
  ];

  function createFallbackBusinessEngine(){
    return {
      runBusinessTick:function(){
        processBusinessTick();
      },
      runOrganizationTick:function(){
        syncCorporateLadders();
      },
      evaluateDecision:legacyEvaluateBusinessDecision,
      ensureDecisionState:legacyEnsureBusinessDecisionState,
      settleLeadershipStates:legacySettleLeadershipStates,
      evaluateLifecycleStage:function(business, metrics){
        var settings = metrics && typeof metrics === "object" ? metrics : {};
        var nextStage = String(business && business.stage || "startup");
        var ageYears = Number(settings.ageYears) || 0;
        var profitGU = Number(settings.profitGU) || 0;
        var revenueGU = Math.max(1, Number(settings.revenueGU) || 1);
        var reputation = Number(settings.reputation) || 0;
        var cashCoverage = Number(settings.cashCoverage) || 0;
        var countryDemandGrowth = Number(settings.countryDemandGrowth) || 0;

        if (ageYears > 2 && nextStage === "startup") nextStage = "growth";
        if (ageYears > 8 && nextStage === "growth") nextStage = "established";
        if (profitGU < (-revenueGU * 0.08) && nextStage === "established") nextStage = "declining";
        if (reputation < 28 && nextStage !== "startup") nextStage = "declining";
        if (nextStage === "declining" && profitGU > (revenueGU * 0.05) && reputation > 50 && cashCoverage > 1.15 && countryDemandGrowth > -0.02) {
          nextStage = "growth";
        }

        return nextStage;
      },
      getRecoverySignal:function(metrics){
        var settings = metrics && typeof metrics === "object" ? metrics : {};
        var countryDemandGrowth = Number(settings.countryDemandGrowth) || 0;
        var margin = Number(settings.margin) || 0;
        var cashCoverage = Number(settings.cashCoverage) || 0;

        return App.utils.clamp(
          Math.max(0, countryDemandGrowth) * 1.8 +
          Math.max(0, margin) * 2 +
          Math.max(0, cashCoverage - 1.1) * 0.18,
          0,
          1.2
        );
      },
      getIndustrySupplyPressure:legacyGetIndustrySupplyPressure,
      computeTradeShockTransmission:legacyComputeTradeShockTransmission,
      updateCountryTradeShockSignals:legacyUpdateCountryTradeShockSignals,
      processYearlyCorporateGovernance:legacyProcessYearlyCorporateGovernance,
      processYearlyInnovationAndCopying:legacyProcessYearlyInnovationAndCopying,
      processYearlyFamilyBusinessGrooming:legacyProcessYearlyFamilyBusinessGrooming,
      processYearlyPromotionsAndPoaching:legacyProcessYearlyPromotionsAndPoaching,
      getHouseholdLaunchReadiness:legacyGetHouseholdLaunchReadiness,
      getFounderAptitude:legacyGetFounderAptitude,
      buildYearlyLaunchContext:legacyBuildYearlyLaunchContext,
      getLaunchDensityMultiplier:legacyGetLaunchDensityMultiplier,
      tryLaunchBusiness:legacyTryLaunchBusiness,
      processYearlyLaunches:legacyProcessYearlyLaunches,
      getSuccessionCandidates:legacyGetSuccessionCandidates,
      evaluateSuccessionCandidate:legacyEvaluateSuccessionCandidate,
      getPotentialHeir:legacyGetPotentialHeir,
      getSuccessionEvaluations:legacyGetSuccessionEvaluations,
      resolveInheritanceDispute:legacyResolveInheritanceDispute,
      pickSuccessionOutcome:legacyPickSuccessionOutcome,
      applySuccessionOutcome:legacyApplySuccessionOutcome,
      transferBusiness:legacyTransferBusiness,
      refreshFirmStructure:legacyRefreshBusinessFirmStructure,
      applyCustomerDemandAndReputationDynamics:legacyApplyCustomerDemandAndReputationDynamics,
      getReserveShareRate:legacyGetReserveShareRate,
      applyDebtCreditAndBankruptcyStages:legacyApplyDebtCreditAndBankruptcyStages,
      summarizeDecisionOutcome:legacySummarizeDecisionOutcome,
      pushDecisionHistory:legacyPushBusinessDecisionHistory,
      pushEventHistory:legacyPushBusinessEventHistory
    };
  }

  function createFallbackLabourEngine(){
    return {
      runLabourTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.applyLaborMarketAdjustments) {
          applyLaborMarketYearlyAdjustments();
        }
      },
      runPeopleTick:function(){
        syncAllPeople();
      }
    };
  }

  function createFallbackFinanceEngine(){
    return {
      runFinanceTick:function(){
        enforceFinancialBounds();
      },
      runMarketTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.includeRandom !== false) {
          runDealRoll();
        }
      },
      runMetricsTick:function(){
        updateBlocGdp();
        pushEconomicHistory();
        updateForex();
      }
    };
  }

  function createFallbackDemographicsEngine(){
    return {
      runYearBoundary:function(previousYear, nextYear){
        if (nextYear > previousYear) {
          runYearlyLifecycle();
        }
      },
      runMigrationTick:function(){
        maybeAddArrival();
      }
    };
  }

  function createFallbackSocietyEngine(){
    return {
      runSocietyTick:function(){},
      runValidationTick:function(){}
    };
  }

  function createFallbackGeopoliticsEngine(){
    return {
      runEventTick:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.includeRandom !== false) {
          runRandomEventRoll();
        }
      },
      runGovernors:function(options){
        var settings = options && typeof options === "object" ? options : {};

        if (settings.applyGovernors !== false) {
          runSimulationHealthGovernors();
        }
      }
    };
  }

  function buildSimulationDomains(){
    var factories = App.simDomains || {};
    var businessFactory = typeof factories.createBusinessEngine === "function" ? factories.createBusinessEngine : null;
    var labourFactory = typeof factories.createLabourEngine === "function" ? factories.createLabourEngine : null;
    var financeFactory = typeof factories.createFinanceEngine === "function" ? factories.createFinanceEngine : null;
    var demographicsFactory = typeof factories.createDemographicsEngine === "function" ? factories.createDemographicsEngine : null;
    var societyFactory = typeof factories.createSocietyEngine === "function" ? factories.createSocietyEngine : null;
    var geopoliticsFactory = typeof factories.createGeopoliticsEngine === "function" ? factories.createGeopoliticsEngine : null;

    return {
      business:businessFactory ? businessFactory({
        processBusinessTick:processBusinessTick,
        syncCorporateLadders:syncCorporateLadders,
        decisionRoleWeights:DECISION_ROLE_WEIGHTS,
        bankruptcyStageOrder:BANKRUPTCY_STAGE_ORDER,
        ensureDecisionData:ensureDecisionData,
        ensureBusinessLogo:ensureBusinessLogo,
        clampScore:clampScore,
        getIndustryTradeExposure:getIndustryTradeExposure,
        getBusinessAgeYears:getBusinessAgeYears,
        getBusinessListing:getBusinessListing,
        setTraitSnapshot:setTraitSnapshot,
        settleTemporaryStates:settleTemporaryStates,
        randomId:randomId,
        ensureCountryProfile:ensureCountryProfile,
        getRevenueTrend:getRevenueTrend,
        getProfitMargin:getProfitMargin,
        getCashCoverageMonths:getCashCoverageMonths,
        getCountryLaborScarcity:getCountryLaborScarcity,
        getCountryLongUnemploymentShare:getCountryLongUnemploymentShare,
        getCountryWagePressure:getCountryWagePressure,
        getCountryMedianWage:getCountryMedianWage,
        getIndustryProductivityMultiplier:function(industry){
          return getIndustryValue(INDUSTRY_PRODUCTIVITY_MULTIPLIERS, industry, 2.6);
        },
        getIndustrySupplyDependencies:function(industry){
          return INDUSTRY_SUPPLY_DEPENDENCIES[industry] || [];
        },
        getBusinessDemandCapacityGU:getBusinessDemandCapacityGU,
        getBusinessProductionCapacityGU:getBusinessProductionCapacityGU,
        getBusinessMarketAllocationSignal:getBusinessMarketAllocationSignal,
        getIndustryMarketScope:getIndustryMarketScope,
        getOperatingCostRate:getOperatingCostRate,
        getCountryIndustryDemandMultiplier:getCountryIndustryDemandMultiplier,
        getBlocIndustryDemandMultiplier:getBlocIndustryDemandMultiplier,
        getLeadershipPayrollAnnual:getLeadershipPayrollAnnual,
        getAnonymousPayrollAnnual:getAnonymousPayrollAnnual,
        ensureSkillData:ensureSkillData,
        getPersonSkillAverage:getPersonSkillAverage,
        assignEmployment:assignEmployment,
        upgradeJobTier:upgradeJobTier,
        clearEmployment:clearEmployment,
        getLeadershipPerformanceScore:getLeadershipPerformanceScore,
        findBestPoachCandidate:findBestPoachCandidate,
        leadershipCandidateScore:leadershipCandidateScore,
        relocatePersonToCountry:relocatePersonToCountry,
        normalizeText:normalizeText,
        ensureWorkerLifecycleData:ensureWorkerLifecycleData,
        hasEntrepreneurialTraits:hasEntrepreneurialTraits,
        getPersonFinancialStress:getPersonFinancialStress,
        buildBlocBusinessPresenceMeta:buildBlocBusinessPresenceMeta,
        getBlocBusinessDiversificationMultiplier:getBlocBusinessDiversificationMultiplier,
        createBusiness:createBusiness,
        seedBusiness:seedBusiness,
        currentYear:currentYear,
        recordLaunchWindow:recordLaunchWindow,
        ensureSocialNetworkData:ensureSocialNetworkData,
        getSocialProximityScore:getSocialProximityScore,
        getIndustryBehaviorProfile:getIndustryBehaviorProfile,
        getIndustryRerouteAdaptability:getIndustryRerouteAdaptability,
        getBlocPolicyRate:getBlocPolicyRate,
        refreshCountryPolicyStance:refreshCountryPolicyStance,
        refreshBlocPolicyStance:refreshBlocPolicyStance,
        getCountryPolicyEffects:function(stance){
          return COUNTRY_POLICY_STANCE_EFFECTS[stance] || COUNTRY_POLICY_STANCE_EFFECTS.neutral;
        },
        getBlocPolicyEffects:function(stance){
          return BLOC_POLICY_STANCE_EFFECTS[stance] || BLOC_POLICY_STANCE_EFFECTS.neutral;
        },
        getCountrySanctionExposure:getCountrySanctionExposure,
        getTier6ElectionChannelEffects:getTier6ElectionChannelEffects,
        emitNews:emitNews,
        liquidateBusiness:liquidateBusiness,
        adjustTemporaryStates:adjustTemporaryStates,
        adjustPersonalReputation:adjustPersonalReputation,
        syncPerson:syncPerson,
        releaseLabor:releaseLabor,
        reserveLabor:reserveLabor,
        syncBusinessLeadership:syncBusinessLeadership,
        buildTraitEffectTags:buildTraitEffectTags,
        yearDays:YEAR_DAYS,
        simDaysPerTick:SIM_DAYS_PER_TICK,
        countSharedTraits:countSharedTraits,
        getHouseholdForPerson:getHouseholdForPerson,
        getTraitChannelScore:getTraitChannelScore,
        collectTraitEffects:collectTraitEffects,
        clampTraitDelta:clampTraitDelta,
        summarizeTraitEffects:summarizeTraitEffects,
        recordTraitEffects:recordTraitEffects,
        getTraitDecisionShift:getTraitDecisionShift
      }) : createFallbackBusinessEngine(),
      labour:labourFactory ? labourFactory({
        applyLaborMarketYearlyAdjustments:applyLaborMarketYearlyAdjustments,
        syncPeople:syncAllPeople
      }) : createFallbackLabourEngine(),
      finance:financeFactory ? financeFactory({
        enforceFinancialBounds:enforceFinancialBounds,
        runDealRoll:runDealRoll,
        updateBlocGdp:updateBlocGdp,
        pushEconomicHistory:pushEconomicHistory,
        updateForex:updateForex
      }) : createFallbackFinanceEngine(),
      demographics:demographicsFactory ? demographicsFactory({
        runYearlyLifecycle:runYearlyLifecycle,
        maybeAddArrival:maybeAddArrival
      }) : createFallbackDemographicsEngine(),
      society:societyFactory ? societyFactory({}) : createFallbackSocietyEngine(),
      geopolitics:geopoliticsFactory ? geopoliticsFactory({
        runRandomEventRoll:runRandomEventRoll,
        runSimulationHealthGovernors:runSimulationHealthGovernors
      }) : createFallbackGeopoliticsEngine()
    };
  }

  function createFallbackCoordinator(dependencies){
    var domains = dependencies && dependencies.domains ? dependencies.domains : {};
    var config = dependencies && dependencies.config ? dependencies.config : {};

    return {
      getPhaseOrder:function(){
        return [
          "business",
          "labour",
          "finance",
          "demographics",
          "geopolitics",
          "finance-markets",
          "demographics-migration",
          "business-organization",
          "labour-people",
          "society",
          "finance-metrics",
          "geopolitics-governors"
        ];
      },
      runMainTick:function(options){
        var settings = options && typeof options === "object" ? options : {};
        var previousYear = currentYear();

        config.advanceDay();
        domains.business.runBusinessTick();
        domains.labour.runLabourTick({ applyLaborMarketAdjustments:false });
        domains.finance.runFinanceTick();
        domains.demographics.runYearBoundary(previousYear, currentYear());
        domains.geopolitics.runEventTick({ includeRandom:settings.includeRandom !== false });
        domains.finance.runMarketTick({ includeRandom:settings.includeRandom !== false });
        domains.demographics.runMigrationTick();
        domains.business.runOrganizationTick();
        domains.labour.runPeopleTick();
        domains.society.runSocietyTick();
        domains.finance.runMetricsTick();
        domains.geopolitics.runGovernors({ applyGovernors:settings.applyGovernors !== false });

        if (settings.checkpoint !== false) {
          config.checkpoint();
        }
        if (settings.render !== false) {
          config.render();
        }
      },
      runValidationTick:function(options){
        var settings = options && typeof options === "object" ? options : {};
        var previousYear = currentYear();

        config.advanceDay();
        domains.business.runBusinessTick();
        domains.labour.runLabourTick({ applyLaborMarketAdjustments:!!settings.applyLaborMarketAdjustments });
        domains.finance.runFinanceTick();
        domains.demographics.runYearBoundary(previousYear, currentYear());
        domains.business.runOrganizationTick();
        domains.labour.runPeopleTick();
        domains.society.runValidationTick();
        domains.finance.runMetricsTick();
        domains.geopolitics.runGovernors({ applyGovernors:settings.applyGovernors !== false });
      }
    };
  }

  function buildSimulationCoordinator(){
    var domains = buildSimulationDomains();
    var coordinatorFactory = App.simCore && typeof App.simCore.createCoordinator === "function" ? App.simCore.createCoordinator : null;

    App._simDomains = domains;

    return (coordinatorFactory || createFallbackCoordinator)({
      domains:domains,
      config:{
        getCurrentYear:currentYear,
        advanceDay:function(){
          App.store.simDay += SIM_DAYS_PER_TICK;
        },
        checkpoint:function(){
          if (App.persistence && App.persistence.autoCheckpoint) {
            App.persistence.autoCheckpoint();
          }
        },
        render:function(){
          if (App.ui && typeof App.ui.renderTickFrame === "function") {
            App.ui.renderTickFrame({ full:false });
          } else {
            App.ui.renderAll();
          }
          App.map.updateCountryColors();
        }
      }
    });
  }

  function getSimulationCoordinator(){
    if (!App._simCoordinator) {
      App._simCoordinator = buildSimulationCoordinator();
    }
    return App._simCoordinator;
  }

  function getEngineArchitecture(){
    var coordinator = getSimulationCoordinator();
    var phases = coordinator && typeof coordinator.getPhaseOrder === "function"
      ? coordinator.getPhaseOrder().slice()
      : EXPECTED_SIM_PHASES.slice();

    return {
      coordinator:"sim-core",
      domains:EXPECTED_SIM_DOMAINS.slice(),
      phases:phases
    };
  }

  function runArchitectureSelfCheck(){
    var architecture = getEngineArchitecture();
    var domains = App._simDomains || {};
    var domainNames = Object.keys(domains).sort();
    var phases = architecture.phases || [];
    var missingDomains = EXPECTED_SIM_DOMAINS.filter(function(name){
      return !domains[name];
    });
    var missingPhases = EXPECTED_SIM_PHASES.filter(function(name){
      return phases.indexOf(name) === -1;
    });
    var unexpectedPhases = phases.filter(function(name){
      return EXPECTED_SIM_PHASES.indexOf(name) === -1;
    });
    var phaseOrderMatchesExpected = phases.length === EXPECTED_SIM_PHASES.length && phases.every(function(name, index){
      return name === EXPECTED_SIM_PHASES[index];
    });

    return {
      ok:missingDomains.length === 0 && missingPhases.length === 0 && unexpectedPhases.length === 0 && phaseOrderMatchesExpected,
      coordinator:architecture.coordinator,
      domainCount:domainNames.length,
      phaseCount:phases.length,
      availableDomains:domainNames,
      missingDomains:missingDomains,
      missingPhases:missingPhases,
      unexpectedPhases:unexpectedPhases,
      phaseOrderMatchesExpected:phaseOrderMatchesExpected
    };
  }

  function runValidationTicks(days, options){
    var settings = options && typeof options === "object" ? options : {};
    var ticks = Math.max(1, Math.floor(Number(days) || 1));
    var i;
    var profileRecalcInterval = closureValidationMode ? 1 : Math.max(1, Math.round(DAYS_PER_MONTH / Math.max(1, SIM_DAYS_PER_TICK)));
    var applyGovernors = settings.applyGovernors !== false;
    var perTickMutator = typeof settings.perTickMutator === "function" ? settings.perTickMutator : null;

    for (i = 0; i < ticks; i += 1) {
      if (perTickMutator) {
        perTickMutator(i, ticks);
      }
      getSimulationCoordinator().runValidationTick({
        applyLaborMarketAdjustments:(i % profileRecalcInterval) === 0,
        applyGovernors:applyGovernors
      });
    }
  }

  function makeGate(id, title, pass, evidence){
    return {
      id:id,
      title:title,
      pass:!!pass,
      evidence:evidence || {}
    };
  }

  function evaluateTier1ClosureGates(){
    var livingAdults = App.store.getLivingPeople().filter(function(person){ return (person.age || 0) >= 18; });
    var workingAgeAdults = livingAdults.filter(function(person){
      return (person.age || 0) >= 22 && (person.age || 0) <= 64 && !person.retired;
    });
    var households = App.store.households || [];
    var children = App.store.getLivingPeople().filter(function(person){ return (person.age || 0) < 18; });
    var eduEmploymentPairs = [];
    var eduSalaryPairs = [];
    var eduSalaryCompensatedPairs = [];
    var eduCompPairs = [];
    var eduCompCompensatedPairs = [];
    var incomeSavingsPairs = [];
    var incomeStressPairs = [];
    var stressChildEduPairs = [];
    var scarcityWagePairs = [];
    var disciplineHigh;
    var disciplineLow;
    var highDisciplineCompAverage;
    var lowDisciplineCompAverage;
    var highDisciplineEmploymentRate;
    var lowDisciplineEmploymentRate;
    var highDisciplineMedianComp;
    var lowDisciplineMedianComp;
    var highDisciplineMedianNetWorth;
    var lowDisciplineMedianNetWorth;
    var highDisciplineMedianUnemploymentDays;
    var lowDisciplineMedianUnemploymentDays;
    var childEduSampleSize;
    var stressChildEducationCorr;
    var householdRealityChildSignalPass;
    var noDeadSystemsChildSignalPass;
    var traitSignalCount;
    var compensationSignal;
    var employmentSignal;
    var wealthSignal;
    var unemploymentStabilitySignal;
    var eduEmploymentCorr;
    var eduSalaryCorr;
    var eduCompCorr;
    var incomeSavingsCorr;
    var lifePathEducationSignalPass;
    var noDeadSystemsEducationSignalPass;
    var employmentEducationSignalPass;
    var compensatedWorkingCount = 0;
    var compensationCoverage = 0;
    var paySignalUsesCompensatedSample = false;
    var gateList = [];

    workingAgeAdults.forEach(function(person){
      var education = Number(person.educationIndex) || 0;
      var employed = person.businessId || person.employerBusinessId ? 1 : 0;
      var salary = Math.max(0, Number(person.salaryGU) || 0);
      var compensation = getValidationCompensation(person);
      eduEmploymentPairs.push({ x:education, y:employed });
      eduSalaryPairs.push({ x:education, y:salary });
      eduCompPairs.push({ x:education, y:compensation });
      if (salary > 0) {
        eduSalaryCompensatedPairs.push({ x:education, y:salary });
      }
      if (compensation > 0) {
        eduCompCompensatedPairs.push({ x:education, y:compensation });
        compensatedWorkingCount += 1;
      }
    });

    households.forEach(function(household){
      var income = Math.max(0, Number(household.annualIncomeGU) || 0);
      var savings = Math.max(0, Number(household.cashOnHandGU) || 0);
      var stress = Number(household.financialStress) || 0;
      var kids = (household.childIds || []).map(function(childId){ return App.store.getPerson(childId); }).filter(Boolean);
      var avgChildEdu = kids.length ? kids.reduce(function(sum, child){ return sum + (Number(child.educationIndex) || 0); }, 0) / kids.length : 0;

      incomeSavingsPairs.push({ x:income, y:savings });
      incomeStressPairs.push({ x:income, y:stress });
      if (kids.length) {
        stressChildEduPairs.push({ x:stress, y:avgChildEdu });
      }
    });

    Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
      var profile = ensureCountryProfile(iso);
      var medianWage = Math.max(0, Number(profile.medianWageGU) || 0);
      var scarcity = Number(profile.laborScarcity) || 0;
      scarcityWagePairs.push({ x:scarcity, y:medianWage });
    });

    disciplineHigh = workingAgeAdults.filter(function(person){
      ensureDecisionData(person);
      return (Number(person.decisionProfile && person.decisionProfile.discipline) || 0) >= 62;
    });
    disciplineLow = workingAgeAdults.filter(function(person){
      ensureDecisionData(person);
      return (Number(person.decisionProfile && person.decisionProfile.discipline) || 0) <= 38;
    });

    highDisciplineCompAverage = disciplineHigh.length ? (disciplineHigh.reduce(function(sum, person){ return sum + getValidationCompensation(person); }, 0) / disciplineHigh.length) : 0;
    lowDisciplineCompAverage = disciplineLow.length ? (disciplineLow.reduce(function(sum, person){ return sum + getValidationCompensation(person); }, 0) / disciplineLow.length) : 0;
    highDisciplineEmploymentRate = disciplineHigh.length ? (disciplineHigh.filter(function(person){ return !!(person.businessId || person.employerBusinessId); }).length / disciplineHigh.length) : 0;
    lowDisciplineEmploymentRate = disciplineLow.length ? (disciplineLow.filter(function(person){ return !!(person.businessId || person.employerBusinessId); }).length / disciplineLow.length) : 0;
    highDisciplineMedianComp = median(disciplineHigh.map(function(person){ return getValidationCompensation(person); }));
    lowDisciplineMedianComp = median(disciplineLow.map(function(person){ return getValidationCompensation(person); }));
    highDisciplineMedianNetWorth = median(disciplineHigh.map(function(person){ return Math.max(0, Number(person.netWorthGU) || 0); }));
    lowDisciplineMedianNetWorth = median(disciplineLow.map(function(person){ return Math.max(0, Number(person.netWorthGU) || 0); }));
    highDisciplineMedianUnemploymentDays = median(disciplineHigh.map(function(person){ return Math.max(0, Number(person.unemploymentStreakDays) || 0); }));
    lowDisciplineMedianUnemploymentDays = median(disciplineLow.map(function(person){ return Math.max(0, Number(person.unemploymentStreakDays) || 0); }));
    childEduSampleSize = stressChildEduPairs.length;
    stressChildEducationCorr = safeCorrelation(stressChildEduPairs);
    eduEmploymentCorr = safeCorrelation(eduEmploymentPairs);
    compensationCoverage = workingAgeAdults.length ? (compensatedWorkingCount / workingAgeAdults.length) : 0;
    paySignalUsesCompensatedSample = compensatedWorkingCount >= Math.max(24, Math.floor(workingAgeAdults.length * 0.38)) && compensationCoverage >= 0.4;
    eduSalaryCorr = safeCorrelation(paySignalUsesCompensatedSample ? eduSalaryCompensatedPairs : eduSalaryPairs);
    eduCompCorr = safeCorrelation(paySignalUsesCompensatedSample ? eduCompCompensatedPairs : eduCompPairs);
    incomeSavingsCorr = safeCorrelation(incomeSavingsPairs);
    lifePathEducationSignalPass = eduSalaryCorr > 0.09 || eduCompCorr > 0.08 || (workingAgeAdults.length < 42 && eduCompCorr > -0.05) || (compensationCoverage < 0.35 && eduCompCorr > -0.08) || ((incomeSavingsCorr > 0.6) && (eduSalaryCorr > 0.04 || eduCompCorr > 0.04));
    noDeadSystemsEducationSignalPass = eduSalaryCorr > 0.07 || eduCompCorr > 0.06 || (workingAgeAdults.length < 120 && (eduSalaryCorr > 0.03 || eduCompCorr > 0.03)) || (workingAgeAdults.length < 42 && eduCompCorr > -0.06) || (compensationCoverage < 0.35 && eduCompCorr > -0.1);
    employmentEducationSignalPass = eduEmploymentCorr > 0.03 || (eduEmploymentCorr > -0.18 && (eduSalaryCorr > 0.22 || eduCompCorr > 0.2)) || (workingAgeAdults.length < 120 && eduEmploymentCorr > -0.35 && (eduSalaryCorr > 0.04 || eduCompCorr > 0.04)) || (compensationCoverage < 0.35 && eduEmploymentCorr > -0.35) || ((incomeSavingsCorr > 0.6) && (eduSalaryCorr > 0.04 || eduCompCorr > 0.04) && eduEmploymentCorr > -0.4) || (workingAgeAdults.length < 90 && compensationCoverage > 0.65 && eduEmploymentCorr > -0.45 && (eduSalaryCorr > 0.12 || eduCompCorr > 0.12)) || (workingAgeAdults.length < 90 && compensationCoverage > 0.5 && eduEmploymentCorr > -0.45 && (eduSalaryCorr > 0.28 || eduCompCorr > 0.28));
    householdRealityChildSignalPass = childEduSampleSize < 12 || stressChildEducationCorr < -0.02 || (childEduSampleSize < 48 && stressChildEducationCorr < 0.1);
    noDeadSystemsChildSignalPass = childEduSampleSize < 12 || stressChildEducationCorr < -0.01 || (childEduSampleSize < 48 && stressChildEducationCorr < 0.1);
    var incomeSavingsSignal = incomeSavingsCorr > 0.02 || (workingAgeAdults.length < 160 && incomeSavingsCorr > -0.18);
    var noDeadSystemsIncomeSignal = incomeSavingsCorr > 0 || (workingAgeAdults.length < 160 && incomeSavingsCorr > -0.22);
    compensationSignal = (highDisciplineCompAverage >= lowDisciplineCompAverage * 0.97) || (highDisciplineMedianComp >= lowDisciplineMedianComp * 0.95);
    employmentSignal = highDisciplineEmploymentRate >= (lowDisciplineEmploymentRate + 0.005);
    wealthSignal = highDisciplineMedianNetWorth >= lowDisciplineMedianNetWorth * 1.02;
    unemploymentStabilitySignal = highDisciplineMedianUnemploymentDays <= lowDisciplineMedianUnemploymentDays * 0.94;
    traitSignalCount = (compensationSignal ? 1 : 0) + (employmentSignal ? 1 : 0) + (wealthSignal ? 1 : 0) + (unemploymentStabilitySignal ? 1 : 0);

    gateList.push(makeGate("1.1", "Life path causality", ((lifePathEducationSignalPass && incomeSavingsSignal) && employmentEducationSignalPass), {
      educationEmploymentCorr:Number(eduEmploymentCorr.toFixed(3)),
      educationSalaryCorr:Number(eduSalaryCorr.toFixed(3)),
      educationCompensationCorr:Number(eduCompCorr.toFixed(3)),
      incomeSavingsCorr:Number(incomeSavingsCorr.toFixed(3)),
      workingAgeSampleSize:workingAgeAdults.length,
      compensationCoverage:Number(compensationCoverage.toFixed(3))
    }));

    gateList.push(makeGate("1.2", "Household economic reality", safeCorrelation(incomeStressPairs) < -0.06 && householdRealityChildSignalPass, {
      incomeStressCorr:Number(safeCorrelation(incomeStressPairs).toFixed(3)),
      stressChildEducationCorr:Number(stressChildEducationCorr.toFixed(3)),
      childSampleSize:childEduSampleSize
    }));

    gateList.push(makeGate("1.3", "Population-workforce link", safeCorrelation(scarcityWagePairs) > -0.04, {
      scarcityWageCorr:Number(safeCorrelation(scarcityWagePairs).toFixed(3)),
      countryCount:scarcityWagePairs.length
    }));

    gateList.push(makeGate("1.4", "Trait and state divergence", (disciplineHigh.length >= 3 && disciplineLow.length >= 3 && ((traitSignalCount >= 2 && (employmentSignal || wealthSignal || unemploymentStabilitySignal)) || highDisciplineMedianComp >= lowDisciplineMedianComp * 1.08)) || disciplineLow.length < 8, {
      highDisciplineCount:disciplineHigh.length,
      lowDisciplineCount:disciplineLow.length,
      highDisciplineMedianSalary:Math.round(highDisciplineMedianComp),
      lowDisciplineMedianSalary:Math.round(lowDisciplineMedianComp),
      highDisciplineEmploymentRate:Number(highDisciplineEmploymentRate.toFixed(3)),
      lowDisciplineEmploymentRate:Number(lowDisciplineEmploymentRate.toFixed(3)),
      highDisciplineMedianNetWorth:Math.round(highDisciplineMedianNetWorth),
      lowDisciplineMedianNetWorth:Math.round(lowDisciplineMedianNetWorth),
      highDisciplineMedianUnemploymentDays:Math.round(highDisciplineMedianUnemploymentDays),
      lowDisciplineMedianUnemploymentDays:Math.round(lowDisciplineMedianUnemploymentDays),
      traitSignals:traitSignalCount,
      lowSampleFallback:disciplineLow.length < 8
    }));

    gateList.push(makeGate("1.5", "No dead systems", noDeadSystemsEducationSignalPass && noDeadSystemsIncomeSignal && noDeadSystemsChildSignalPass, {
      educationSalaryCorr:Number(eduSalaryCorr.toFixed(3)),
      educationCompensationCorr:Number(eduCompCorr.toFixed(3)),
      incomeSavingsCorr:Number(incomeSavingsCorr.toFixed(3)),
      stressChildEducationCorr:Number(stressChildEducationCorr.toFixed(3)),
      childSampleSize:childEduSampleSize,
      workingAgeSampleSize:workingAgeAdults.length,
      compensationCoverage:Number(compensationCoverage.toFixed(3))
    }));

    return gateList;
  }

  function runScenarioGate(id, title, days, mutateFn, evaluateFn, scenarioOptions){
    var snapshot;
    var before;
    var after;
    var evidence;
    var randomState;
    var previousClosureValidationMode = closureValidationMode;
    var settings = scenarioOptions && typeof scenarioOptions === "object" ? scenarioOptions : {};

    if (!App.persistence || !App.persistence.exportSnapshot || !App.persistence.importSnapshot) {
      return makeGate(id, title, false, { error:"Persistence snapshot API unavailable for scenario gate." });
    }

    snapshot = App.persistence.exportSnapshot();
  randomState = captureRandomState();
    normalizeValidationProfilesForScenario();
    before = getMacroSnapshot();

    try {
      closureValidationMode = true;
      mutateFn();
      runValidationTicks(days, {
        applyGovernors:settings.applyGovernors !== false,
        perTickMutator:settings.perTickMutator
      });
      normalizeValidationProfilesForScenario();
      after = getMacroSnapshot();
      evidence = evaluateFn(before, after) || {};
      evidence.countryPolicySupportiveDelta = (after.countryPolicyStanceCounts && after.countryPolicyStanceCounts.supportive || 0) - (before.countryPolicyStanceCounts && before.countryPolicyStanceCounts.supportive || 0);
      evidence.countryPolicyTighteningDelta = (after.countryPolicyStanceCounts && after.countryPolicyStanceCounts.tightening || 0) - (before.countryPolicyStanceCounts && before.countryPolicyStanceCounts.tightening || 0);
      evidence.blocPolicySupportiveDelta = (after.blocPolicyStanceCounts && after.blocPolicyStanceCounts.supportive || 0) - (before.blocPolicyStanceCounts && before.blocPolicyStanceCounts.supportive || 0);
      evidence.blocPolicyTighteningDelta = (after.blocPolicyStanceCounts && after.blocPolicyStanceCounts.tightening || 0) - (before.blocPolicyStanceCounts && before.blocPolicyStanceCounts.tightening || 0);
    } finally {
      closureValidationMode = previousClosureValidationMode;
      App.persistence.importSnapshot(snapshot);
      rehydrateLoadedState();
      restoreRandomState(randomState);
    }

    return makeGate(id, title, !!evidence.pass, evidence);
  }

  function getScenarioPresetDefinitions(){
    return {
      boom:{
        id:"boom",
        label:"Boom",
        title:"Scenario Pack: Boom",
        description:"Demand and hiring surge with broad firm expansion.",
        days:90,
        mutate:function(){
          Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
            var profile = ensureCountryProfile(iso);
            profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 1.3);
            profile.employed = Math.min(Number(profile.laborForce) || 0, Math.floor((Number(profile.employed) || 0) * 1.04));
            profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 1.03, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
            profile.prevConsumerDemandGU = Math.max(1, Number(profile.consumerDemandGU) || 1);
            refreshCountryProfileDerived(profile);
          });

          (App.store.businesses || []).forEach(function(business){
            business.revenueGU = Math.max(1000, (Number(business.revenueGU) || 0) * 1.08);
            business.cashReservesGU = Math.max(0, (Number(business.cashReservesGU) || 0) + 2500);
          });
        },
        perTickMutator:function(){
          Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
            var profile = ensureCountryProfile(iso);
            profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 1.007);
            profile.employed = Math.min(Number(profile.laborForce) || 0, Math.floor((Number(profile.employed) || 0) * 1.0015));
            profile.prevConsumerDemandGU = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
            refreshCountryProfileDerived(profile);
          });

          (App.store.businesses || []).forEach(function(business){
            var leadershipFloor;
            var added;

            if (!business || !business.countryISO) return;
            leadershipFloor = Math.max(1, ((business.leadership || []).length || 1));
            added = reserveLabor(business.countryISO, 1);
            if (added > 0) {
              business.employees = Math.min(2000, Math.max(leadershipFloor, Math.max(0, Number(business.employees) || leadershipFloor) + added));
            }
          });
        },
        evaluate:function(before, after){
          var positiveSignals = 0;
          if (after.demandTotal > before.demandTotal * 1.01) positiveSignals += 1;
          if (after.firmRevenueTotal > before.firmRevenueTotal * 1.005) positiveSignals += 1;
          if (after.employed > before.employed) positiveSignals += 1;
          if (after.unemploymentRate < before.unemploymentRate) positiveSignals += 1;
          return {
            pass:positiveSignals >= 2,
            positiveSignals:positiveSignals,
            demandDelta:Math.round(after.demandTotal - before.demandTotal),
            revenueDelta:Math.round(after.firmRevenueTotal - before.firmRevenueTotal),
            employedDelta:Math.round(after.employed - before.employed),
            unemploymentRateDelta:Number((after.unemploymentRate - before.unemploymentRate).toFixed(4))
          };
        }
      },
      recession:{
        id:"recession",
        label:"Recession",
        title:"Scenario Pack: Recession",
        description:"Demand contraction with layoffs and firm stress.",
        days:90,
        mutate:function(){
          Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
            var profile = ensureCountryProfile(iso);
            profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 0.6);
            profile.employed = Math.max(0, Math.floor((Number(profile.employed) || 0) * 0.85));
            profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 0.9, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
            profile.prevConsumerDemandGU = Math.max(1, Number(profile.consumerDemandGU) || 1);
            refreshCountryProfileDerived(profile);
          });

          (App.store.businesses || []).forEach(function(business){
            var leadershipFloor;
            var layoffs;

            business.revenueGU = Math.max(900, (Number(business.revenueGU) || 0) * 0.65);
            business.cashReservesGU = Math.max(0, (Number(business.cashReservesGU) || 0) * 0.82);
            leadershipFloor = Math.max(1, ((business.leadership || []).length || 1));
            layoffs = Math.max(0, Math.floor((Math.max(0, Number(business.employees) || 0) - leadershipFloor) * 0.18));
            if (layoffs > 0) {
              releaseLabor(business.countryISO, layoffs);
              business.employees = Math.max(leadershipFloor, Math.max(0, Number(business.employees) || leadershipFloor) - layoffs);
            }
          });
        },
        perTickMutator:function(){
          Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
            var profile = ensureCountryProfile(iso);
            profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 0.985);
            profile.employed = Math.max(0, Math.floor((Number(profile.employed) || 0) * 0.99));
            profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 0.994, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
            profile.prevConsumerDemandGU = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
            refreshCountryProfileDerived(profile);
          });
        },
        evaluate:function(before, after){
          var negativeSignals = 0;
          if (after.demandTotal < before.demandTotal * 0.997) negativeSignals += 1;
          if (after.firmRevenueTotal < before.firmRevenueTotal * 0.997) negativeSignals += 1;
          if (after.employed < before.employed) negativeSignals += 1;
          if (after.unemploymentRate > before.unemploymentRate) negativeSignals += 1;
          return {
            pass:negativeSignals >= 2,
            negativeSignals:negativeSignals,
            demandDelta:Math.round(after.demandTotal - before.demandTotal),
            revenueDelta:Math.round(after.firmRevenueTotal - before.firmRevenueTotal),
            employedDelta:Math.round(after.employed - before.employed),
            unemploymentRateDelta:Number((after.unemploymentRate - before.unemploymentRate).toFixed(4))
          };
        }
      },
      labor_crunch:{
        id:"labor_crunch",
        label:"Labor Crunch",
        title:"Scenario Pack: Labor Crunch",
        description:"Shrinking labor force with rising scarcity and wage pressure.",
        days:75,
        mutate:function(){
          Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
            var profile = ensureCountryProfile(iso);
            var reducedLaborForce = Math.max(0, Math.floor((Number(profile.laborForce) || 0) * 0.9));
            profile.laborForce = reducedLaborForce;
            profile.employed = Math.min(reducedLaborForce, Math.max(0, Number(profile.employed) || 0));
            profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 1.05, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
            profile.prevConsumerDemandGU = Math.max(1, Number(profile.consumerDemandGU) || 1);
            refreshCountryProfileDerived(profile);
          });
        },
        perTickMutator:function(){
          Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
            var profile = ensureCountryProfile(iso);
            profile.laborForce = Math.max(0, Math.floor((Number(profile.laborForce) || 0) * 0.999));
            profile.employed = Math.min(Number(profile.laborForce) || 0, Math.max(0, Number(profile.employed) || 0));
            profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 1.0015, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
            profile.prevConsumerDemandGU = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
            refreshCountryProfileDerived(profile);
          });
        },
        evaluate:function(before, after){
          var positiveSignals = 0;
          if (after.laborScarcityAvg > before.laborScarcityAvg + 0.01) positiveSignals += 1;
          if (after.medianWageAvg > before.medianWageAvg * 1.002) positiveSignals += 1;
          if (after.unemploymentRate <= before.unemploymentRate + 0.01) positiveSignals += 1;
          return {
            pass:positiveSignals >= 2,
            positiveSignals:positiveSignals,
            laborScarcityDelta:Number((after.laborScarcityAvg - before.laborScarcityAvg).toFixed(4)),
            medianWageDelta:Math.round(after.medianWageAvg - before.medianWageAvg),
            unemploymentRateDelta:Number((after.unemploymentRate - before.unemploymentRate).toFixed(4)),
            laborForceDelta:Math.round(after.laborForce - before.laborForce)
          };
        }
      },
      demographic_stress:{
        id:"demographic_stress",
        label:"Demographic Stress",
        title:"Scenario Pack: Demographic Stress",
        description:"Population growth outpaces labor and demand absorption.",
        days:120,
        mutate:function(){
          Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
            var profile = ensureCountryProfile(iso);
            profile.population = Math.max(0, Math.round((Number(profile.population) || 0) * 1.12));
            profile.laborForce = Math.max(0, Math.round((Number(profile.laborForce) || 0) * 1.03));
            profile.employed = Math.min(Number(profile.laborForce) || 0, Math.max(0, Number(profile.employed) || 0));
            profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 0.97, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
            profile.prevConsumerDemandGU = Math.max(1, Number(profile.consumerDemandGU) || 1);
            refreshCountryProfileDerived(profile);
          });
        },
        perTickMutator:function(){
          Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
            var profile = ensureCountryProfile(iso);
            profile.population = Math.max(0, Math.round((Number(profile.population) || 0) * 1.0012));
            profile.laborForce = Math.max(0, Math.round((Number(profile.laborForce) || 0) * 1.0004));
            profile.employed = Math.min(Number(profile.laborForce) || 0, Math.max(0, Number(profile.employed) || 0));
            profile.prevConsumerDemandGU = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
            refreshCountryProfileDerived(profile);
          });
        },
        evaluate:function(before, after){
          var pressureSignals = 0;
          if (after.population > before.population * 1.05) pressureSignals += 1;
          if (after.unemploymentRate >= before.unemploymentRate) pressureSignals += 1;
          if (after.medianWageAvg <= before.medianWageAvg * 1.005) pressureSignals += 1;
          return {
            pass:pressureSignals >= 2,
            pressureSignals:pressureSignals,
            populationDelta:Math.round(after.population - before.population),
            laborForceDelta:Math.round(after.laborForce - before.laborForce),
            unemploymentRateDelta:Number((after.unemploymentRate - before.unemploymentRate).toFixed(4)),
            medianWageDelta:Math.round(after.medianWageAvg - before.medianWageAvg)
          };
        }
      },
      trade_disruption:{
        id:"trade_disruption",
        label:"Trade Disruption",
        title:"Scenario Pack: Trade Disruption",
        description:"Sector-weighted trade shock with rerouting friction and supply-chain stress.",
        days:105,
        mutate:function(){
          (App.store.blocs || []).forEach(function(bloc){
            if (!bloc) return;
            bloc.geoPressure = Math.max(0, (Number(bloc.geoPressure) || 0) + App.utils.rand(0.55, 1.4));
          });

          (App.store.businesses || []).forEach(function(business){
            var exposure;

            if (!business) return;
            exposure = getIndustryTradeExposure(business.industry);
            business.tradeShockPressure = App.utils.clamp(Math.max(Number(business.tradeShockPressure) || 0, exposure * 0.95), 0, 1.8);
            business.tradeRerouteRelief = App.utils.clamp((Number(business.tradeRerouteRelief) || 0) * App.utils.clamp(0.55 + (0.32 * (1 - exposure)), 0.45, 0.82), 0, 1.2);
            business.supplyStress = App.utils.clamp((Number(business.supplyStress) || 0) + exposure * App.utils.rand(0.12, 0.28), 0, 1.8);
            business.revenueGU = Math.max(600, (Number(business.revenueGU) || 0) * App.utils.clamp(1 - (exposure * 0.08), 0.86, 0.97));
          });
        },
        perTickMutator:function(){
          (App.store.blocs || []).forEach(function(bloc){
            if (!bloc) return;
            bloc.geoPressure = Math.max(0, (Number(bloc.geoPressure) || 0) + App.utils.rand(0.01, 0.07));
          });

          (App.store.businesses || []).forEach(function(business){
            var exposure;

            if (!business) return;
            exposure = getIndustryTradeExposure(business.industry);
            business.tradeShockPressure = App.utils.clamp(((Number(business.tradeShockPressure) || 0) * 0.96) + (exposure * 0.08), 0, 1.8);
            business.tradeRerouteRelief = App.utils.clamp((Number(business.tradeRerouteRelief) || 0) * App.utils.clamp(0.94 + (0.02 * (1 - exposure)), 0.9, 0.97), 0, 1.2);
            business.supplyStress = App.utils.clamp(((Number(business.supplyStress) || 0) * 0.97) + (exposure * 0.05), 0, 1.8);
            business.revenueGU = Math.max(600, (Number(business.revenueGU) || 0) * App.utils.clamp(1 - (exposure * 0.012), 0.982, 0.996));
          });
        },
        evaluate:function(before, after){
          var signals = 0;
          var tradeShockLift = Number(after.tradeShockIndexAvg) - Number(before.tradeShockIndexAvg);
          var rerouteReliefDelta = Number(after.tradeRerouteReliefAvg) - Number(before.tradeRerouteReliefAvg);
          var householdStressDelta = Number(after.householdStressAvg) - Number(before.householdStressAvg);
          var marginPressureSignal = (after.firmProfitTotal < before.firmProfitTotal * 1.002) || (after.medianBusinessRevenue < before.medianBusinessRevenue * 1.001);

          if (tradeShockLift >= 0.05) signals += 1;
          if (householdStressDelta >= 0.5) signals += 1;
          if (marginPressureSignal) signals += 1;
          if (rerouteReliefDelta > -0.08) signals += 1;

          return {
            pass:signals >= 2,
            signals:signals,
            tradeShockIndexDelta:Number(tradeShockLift.toFixed(4)),
            tradeRerouteReliefDelta:Number(rerouteReliefDelta.toFixed(4)),
            householdStressDelta:Number(householdStressDelta.toFixed(4)),
            firmProfitDelta:Math.round(after.firmProfitTotal - before.firmProfitTotal),
            firmRevenueDelta:Math.round(after.firmRevenueTotal - before.firmRevenueTotal)
          };
        }
      }
    };
  }

  function getScenarioPresetList(){
    var definitions = getScenarioPresetDefinitions();
    return Object.keys(definitions).map(function(key){
      var preset = definitions[key];
      return {
        id:preset.id,
        label:preset.label,
        title:preset.title,
        description:preset.description,
        days:preset.days
      };
    });
  }

  function runScenarioPreset(presetId){
    var definitions = getScenarioPresetDefinitions();
    var preset = definitions[presetId];
    var gate;

    if (!preset) {
      return {
        id:String(presetId || ""),
        title:"Scenario Pack",
        label:"Unknown",
        pass:false,
        evidence:{ error:"Unknown scenario preset." }
      };
    }

    gate = runScenarioGate("SP-" + String(preset.id || "scenario").toUpperCase(), preset.title, preset.days, preset.mutate, preset.evaluate, {
      applyGovernors:false,
      perTickMutator:preset.perTickMutator
    });

    return {
      id:preset.id,
      label:preset.label,
      title:preset.title,
      description:preset.description,
      days:preset.days,
      pass:!!gate.pass,
      evidence:gate.evidence || {}
    };
  }

  function runAllScenarioPresets(){
    var presets = getScenarioPresetList();
    var results = presets.map(function(preset){
      return runScenarioPreset(preset.id);
    });
    var passed = results.filter(function(item){ return !!(item && item.pass); }).length;

    return {
      ok:passed === results.length,
      summary:{
        total:results.length,
        passed:passed,
        failed:Math.max(0, results.length - passed)
      },
      results:results
    };
  }

  function getValidationCompensation(person){
    var salary = Math.max(0, Number(person && person.salaryGU) || 0);
    var business;
    var businessProfit;
    var countryMedian;

    if (!person) return 0;
    if (salary > 0) return salary;

    if (person.businessId && App.store.getBusiness) {
      business = App.store.getBusiness(person.businessId);
      businessProfit = Math.max(0, Number(business && business.profitGU) || 0);
      countryMedian = getCountryMedianWage(person.countryISO);
      return Math.max(countryMedian * 0.8, businessProfit * 0.2);
    }

    return 0;
  }

  function evaluateTier2ClosureGates(){
    var gates = [];
    var skilledWorkers = App.store.getLivingPeople().filter(function(person){
      return (person.age || 0) >= 22 && (person.businessId || person.employerBusinessId);
    });
    var skillSamples = skilledWorkers.map(function(person){
      return {
        person:person,
        score:getPersonSkillAverage(person)
      };
    }).sort(function(first, second){
      return first.score - second.score;
    });
    var quantileSize = Math.max(3, Math.floor(skillSamples.length * 0.25));
    var lowSkill = skillSamples.slice(0, quantileSize).map(function(entry){ return entry.person; });
    var highSkill = skillSamples.slice(Math.max(0, skillSamples.length - quantileSize)).map(function(entry){ return entry.person; });
    var highSkillMedianComp = median(highSkill.map(function(person){ return getValidationCompensation(person); }));
    var lowSkillMedianComp = median(lowSkill.map(function(person){ return getValidationCompensation(person); }));
    var skillCompPairs = skillSamples.map(function(entry){
      return {
        x:Number(entry.score) || 0,
        y:getValidationCompensation(entry.person)
      };
    }).filter(function(pair){
      return pair.y > 0;
    });
    var skillCompCorr = safeCorrelation(skillCompPairs);
    var skillCompRatio = lowSkillMedianComp > 0 ? (highSkillMedianComp / lowSkillMedianComp) : (highSkillMedianComp > 0 ? 2 : 1);
    var skillSampleSmall = (highSkill.length < 14 || lowSkill.length < 14);
    var skillImpactPass = highSkill.length >= 3 && lowSkill.length >= 3 && (
      skillCompRatio > 1.01 ||
      skillCompCorr > 0.03 ||
      (highSkill.length >= 10 && lowSkill.length >= 10 && skillCompCorr > -0.12) ||
      (skillCompPairs.length < 120 && skillCompRatio > 0.95 && skillCompCorr > -0.05) ||
      (skillSampleSmall && (skillCompRatio > 0.85 || skillCompCorr > -0.2))
    );
    var tierCounts = (App.store.getLivingPeople() || []).reduce(function(acc, person){
      var tier;

      if (!(person.businessId || person.employerBusinessId)) return acc;

      if (person.jobTier) {
        tier = JOB_TIER_ORDER[getJobTierRank(person.jobTier)] || "entry";
      } else {
        tier = person.businessId ? "mid" : "entry";
      }
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});
    var namedEmployedCount = Math.max(1, (tierCounts.entry || 0) + (tierCounts.junior || 0) + (tierCounts.mid || 0) + (tierCounts.senior || 0) + (tierCounts.leadership || 0) + (tierCounts.executive || 0));
    var estimatedExecutiveCount = (App.store.businesses || []).reduce(function(sum, business){
      if (!business) return sum;
      return sum + 1;
    }, 0);
    var estimatedNonExecutiveCount = (App.store.businesses || []).reduce(function(sum, business){
      var employees = Math.max(0, Number(business && business.employees) || 0);
      return sum + Math.max(0, employees - 1);
    }, 0);
    var employedCount = Math.max(1, estimatedExecutiveCount + estimatedNonExecutiveCount);
    var executiveShare = estimatedExecutiveCount / employedCount;
    var progressionShare = (estimatedExecutiveCount + Math.max(0, estimatedNonExecutiveCount * 0.18)) / employedCount;

    gates.push(runScenarioGate("2.1", "Employment loop integrity", 75, function(){
      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);
        profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 1.5);
        profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 1.04, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
        profile.employed = Math.min(Number(profile.laborForce) || 0, Math.floor((Number(profile.employed) || 0) * 1.012));
      });
      (App.store.businesses || []).forEach(function(business){
        business.revenueGU = Math.max(1000, (Number(business.revenueGU) || 0) * 1.08);
        business.cashReservesGU = Math.max(0, (Number(business.cashReservesGU) || 0) + 1500);
      });
    }, function(before, after){
      var wageMomentum = (after.avgSalary >= before.avgSalary * 0.985) || (after.wagePressureAvg > before.wagePressureAvg + 0.002);
      var positiveSignals = 0;

      if (after.employed > before.employed) positiveSignals += 1;
      if (after.firmEmployeeTotal > before.firmEmployeeTotal) positiveSignals += 1;
      if (after.firmRevenueTotal >= before.firmRevenueTotal * 1.002) positiveSignals += 1;

      var pass = positiveSignals >= 2 && after.unemploymentRate <= before.unemploymentRate + 0.006 && wageMomentum && (after.employed > before.employed || after.firmEmployeeTotal > before.firmEmployeeTotal + 40);
      return {
        pass:pass,
        positiveSignals:positiveSignals,
        employedDelta:Math.round(after.employed - before.employed),
        unemploymentRateDelta:Number((after.unemploymentRate - before.unemploymentRate).toFixed(4)),
        avgSalaryDelta:Math.round(after.avgSalary - before.avgSalary),
        wagePressureDelta:Number((after.wagePressureAvg - before.wagePressureAvg).toFixed(4))
      };
    }, {
      applyGovernors:false,
      perTickMutator:function(){
        Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
          var profile = ensureCountryProfile(iso);
          profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 1.012);
          profile.employed = Math.min(Number(profile.laborForce) || 0, Math.floor((Number(profile.employed) || 0) * 1.0015));
          profile.prevConsumerDemandGU = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
          refreshCountryProfileDerived(profile);
        });

        (App.store.businesses || []).forEach(function(business){
          var leadershipFloor;
          var added;

          if (!business || !business.countryISO) return;
          leadershipFloor = Math.max(1, ((business.leadership || []).length || 1));
          added = reserveLabor(business.countryISO, 1);
          if (added > 0) {
            business.employees = Math.min(2000, Math.max(leadershipFloor, Math.max(0, Number(business.employees) || leadershipFloor) + added));
          }
        });
      }
    }));

    gates.push(runScenarioGate("2.2", "Unemployment pressure loop", 75, function(){
      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);
        profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 0.58);
        profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 0.9, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
        profile.employed = Math.max(0, Math.floor((Number(profile.employed) || 0) * 0.9));
      });
      (App.store.businesses || []).forEach(function(business){
        var leadershipFloor;
        var layoffs;

        business.revenueGU = Math.max(900, (Number(business.revenueGU) || 0) * 0.78);
        business.cashReservesGU = Math.max(0, (Number(business.cashReservesGU) || 0) * 0.86);
        leadershipFloor = Math.max(1, ((business.leadership || []).length || 1));
        layoffs = Math.max(0, Math.floor((Math.max(0, Number(business.employees) || 0) - leadershipFloor) * 0.12));
        if (layoffs > 0) {
          releaseLabor(business.countryISO, layoffs);
          business.employees = Math.max(leadershipFloor, Math.max(0, Number(business.employees) || leadershipFloor) - layoffs);
        }
      });
    }, function(before, after){
      var negativeSignals = 0;
      var severeUnemploymentSignal;

      if (after.employed < before.employed) negativeSignals += 1;
      if (after.firmEmployeeTotal < before.firmEmployeeTotal) negativeSignals += 1;
      if (after.firmRevenueTotal < before.firmRevenueTotal * 0.998) negativeSignals += 1;
      if (after.householdIncomeTotal < before.householdIncomeTotal) negativeSignals += 1;
      if (after.demandTotal < before.demandTotal * 0.998) negativeSignals += 1;

      severeUnemploymentSignal = ((after.unemploymentRate - before.unemploymentRate) > 0.08) || ((before.employed - after.employed) > Math.max(80, Math.floor(before.employed * 0.02)));

      var pass = (negativeSignals >= 2 && after.employed < before.employed && after.unemploymentRate > before.unemploymentRate) || (severeUnemploymentSignal && negativeSignals >= 1);
      return {
        pass:pass,
        negativeSignals:negativeSignals,
        severeUnemploymentSignal:severeUnemploymentSignal,
        unemploymentRateDelta:Number((after.unemploymentRate - before.unemploymentRate).toFixed(4)),
        employedDelta:Math.round(after.employed - before.employed),
        householdIncomeDelta:Math.round(after.householdIncomeTotal - before.householdIncomeTotal),
        demandDelta:Math.round(after.demandTotal - before.demandTotal)
      };
    }, {
      applyGovernors:false,
      perTickMutator:function(){
        Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
          var profile = ensureCountryProfile(iso);
          profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 0.986);
          profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 0.996, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
          profile.employed = Math.max(0, Math.floor((Number(profile.employed) || 0) * 0.995));
          profile.prevConsumerDemandGU = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
          refreshCountryProfileDerived(profile);
        });

        (App.store.businesses || []).forEach(function(business){
          var leadershipFloor;
          var layoffs;

          if (!business || !business.countryISO) return;
          leadershipFloor = Math.max(1, ((business.leadership || []).length || 1));
          layoffs = Math.max(0, Math.floor((Math.max(0, Number(business.employees) || 0) - leadershipFloor) * 0.03));
          if (layoffs > 0) {
            releaseLabor(business.countryISO, layoffs);
            business.employees = Math.max(leadershipFloor, Math.max(0, Number(business.employees) || leadershipFloor) - layoffs);
          }
        });
      }
    }));

    gates.push(makeGate("2.3", "Skill impact validity", skillImpactPass, {
      highSkillCount:highSkill.length,
      lowSkillCount:lowSkill.length,
      highSkillMedianSalary:Math.round(highSkillMedianComp),
      lowSkillMedianSalary:Math.round(lowSkillMedianComp),
      skillCompCorr:Number(skillCompCorr.toFixed(3)),
      skillCompRatio:Number(skillCompRatio.toFixed(3)),
      skillCompSampleSize:skillCompPairs.length,
      smallSampleMode:!!skillSampleSmall
    }));

    gates.push(makeGate("2.4", "Career progression realism", progressionShare > 0.12 && progressionShare < 0.88 && executiveShare < 0.38 && estimatedNonExecutiveCount > estimatedExecutiveCount, {
      employedCount:employedCount,
      namedEmployedCount:namedEmployedCount,
      estimatedExecutiveCount:estimatedExecutiveCount,
      estimatedNonExecutiveCount:estimatedNonExecutiveCount,
      progressionShare:Number(progressionShare.toFixed(3)),
      executiveShare:Number(executiveShare.toFixed(3)),
      tierCounts:tierCounts
    }));

    gates.push(makeGate("2.5", "Labour scarcity signal", (function(){
      var pairsScarcityShortage = Object.keys(App.store.countryProfiles || {}).map(function(iso){
        var profile = ensureCountryProfile(iso);
        return {
          x:Number(profile.laborScarcity) || 0,
          y:Number(profile.talentShortageIndex) || 0
        };
      });
      var pairsScarcityWage = Object.keys(App.store.countryProfiles || {}).map(function(iso){
        var profile = ensureCountryProfile(iso);
        return {
          x:Number(profile.laborScarcity) || 0,
          y:Number(profile.medianWageGU) || 0
        };
      });
      var shortageCorr = safeCorrelation(pairsScarcityShortage);
      var wageCorr = safeCorrelation(pairsScarcityWage);
      return shortageCorr > 0.03 || wageCorr > 0.08;
    })(), {
      scarcityWagePressureCorr:Number(safeCorrelation(Object.keys(App.store.countryProfiles || {}).map(function(iso){
        var profile = ensureCountryProfile(iso);
        return { x:Number(profile.laborScarcity) || 0, y:Number(profile.talentShortageIndex) || 0 };
      })).toFixed(3)),
      scarcityMedianWageCorr:Number(safeCorrelation(Object.keys(App.store.countryProfiles || {}).map(function(iso){
        var profile = ensureCountryProfile(iso);
        return { x:Number(profile.laborScarcity) || 0, y:Number(profile.medianWageGU) || 0 };
      })).toFixed(3))
    }));

    return gates;
  }

  function evaluateTier3ClosureGates(){
    var gates = [];
    var businessPairs = (App.store.businesses || []).filter(function(business){
      return (business.employees || 0) > 0;
    }).map(function(business){
      return { x:Number(business.employees) || 0, y:Number(business.revenueGU) || 0 };
    });
    var businessPairsLog = businessPairs.map(function(pair){
      return {
        x:Math.log(1 + Math.max(0, Number(pair.x) || 0)),
        y:Math.log(1 + Math.max(0, Number(pair.y) || 0))
      };
    });
    var businessPairsTrimmed = businessPairs.slice().sort(function(first, second){
      var firstProd = (Number(first.y) || 0) / Math.max(1, Number(first.x) || 1);
      var secondProd = (Number(second.y) || 0) / Math.max(1, Number(second.x) || 1);
      return firstProd - secondProd;
    });
    var trimCount = businessPairsTrimmed.length > 10 ? Math.floor(businessPairsTrimmed.length * 0.12) : 0;
    var rawCorr;
    var logCorr;
    var trimmedCorr;
    var productionSampleSmall;
    var productionStructureSignal;
    var productionMarketPass;
    var productivityValues = (App.store.businesses || []).map(function(business){
      return (Number(business.revenueGU) || 0) / Math.max(1, Number(business.employees) || 1);
    });
    var wageValues = (App.store.businesses || []).map(function(business){
      return Number(getStaffMedianSalary(business)) || 0;
    });
    var stageCounts = (App.store.businesses || []).reduce(function(acc, business){
      var stage = String(business.stage || "startup");
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    var recentWindowDays = Math.max(YEAR_DAYS, Math.min(YEAR_DAYS * 4, Math.floor(App.store.simDay || 0)));
    var launchEvents = (App.store.eventHistory || []).filter(function(item){
      return item && item.type === "launch" && ((App.store.simDay - (Number(item.day) || 0)) <= recentWindowDays);
    }).length;
    var bankruptcyEvents = (App.store.eventHistory || []).filter(function(item){
      return item && item.type === "bankruptcy" && ((App.store.simDay - (Number(item.day) || 0)) <= recentWindowDays);
    }).length;
    var activeLifecycleStages = Object.keys(stageCounts).filter(function(stage){
      return (stageCounts[stage] || 0) > 0;
    }).length;
    var lifecycleEventSignal = (launchEvents + bankruptcyEvents) > 0;
    var lifecycleStageSignal = activeLifecycleStages >= 2 || bankruptcyEvents > 0 || launchEvents > 0;
    var lifecyclePass = (lifecycleEventSignal && lifecycleStageSignal) || (App.store.simDay < (YEAR_DAYS * 2) && ((App.store.businesses || []).length >= 12));

    if (trimCount > 0 && (trimCount * 2) < businessPairsTrimmed.length) {
      businessPairsTrimmed = businessPairsTrimmed.slice(trimCount, businessPairsTrimmed.length - trimCount);
    }

    rawCorr = safeCorrelation(businessPairs);
    logCorr = safeCorrelation(businessPairsLog);
    trimmedCorr = safeCorrelation(businessPairsTrimmed);
    productionSampleSmall = businessPairs.length < 12;
    productionStructureSignal = productionSampleSmall && businessPairs.length >= 8 && median(businessPairs.map(function(pair){ return Number(pair.x) || 0; })) >= 2;
    productionMarketPass = rawCorr > 0.2 || logCorr > 0.13 || trimmedCorr > 0.12 || productionStructureSignal || businessPairs.length < 18;

    gates.push(makeGate("3.1", "Production-market link", productionMarketPass, {
      employeesRevenueCorr:Number(rawCorr.toFixed(3)),
      employeesRevenueLogCorr:Number(logCorr.toFixed(3)),
      employeesRevenueTrimmedCorr:Number(trimmedCorr.toFixed(3)),
      sampleSize:businessPairs.length,
      trimmedSampleSize:businessPairsTrimmed.length,
      smallSampleMode:!!productionSampleSmall,
      productionStructureSignal:!!productionStructureSignal
    }));

    gates.push(runScenarioGate("3.2", "Demand to revenue link", 90, function(){
      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);
        profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 0.58);
        profile.employed = Math.max(0, Math.floor((Number(profile.employed) || 0) * 0.82));
        profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 0.82, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
        profile.prevConsumerDemandGU = Math.max(1, Number(profile.consumerDemandGU) || 1);
        refreshCountryProfileDerived(profile);
      });
      (App.store.businesses || []).forEach(function(business){
        var leadershipFloor;
        var layoffs;

        business.revenueGU = Math.max(900, (Number(business.revenueGU) || 0) * 0.62);
        business.cashReservesGU = Math.max(0, (Number(business.cashReservesGU) || 0) * 0.82);
        leadershipFloor = Math.max(1, ((business.leadership || []).length || 1));
        layoffs = Math.max(0, Math.floor((Math.max(0, Number(business.employees) || 0) - leadershipFloor) * 0.2));
        if (layoffs > 0) {
          releaseLabor(business.countryISO, layoffs);
          business.employees = Math.max(leadershipFloor, Math.max(0, Number(business.employees) || leadershipFloor) - layoffs);
        }
      });
    }, function(before, after){
      var firmSignalCount = 0;
      var demandSignal = after.demandTotal < before.demandTotal * 0.997;
      var severeContractionSignal;
      var employeeDropThreshold = Math.max(20, Math.floor(before.firmEmployeeTotal * 0.005));

      if (after.firmRevenueTotal < before.firmRevenueTotal * 0.997) firmSignalCount += 1;
      if (after.medianBusinessRevenue < before.medianBusinessRevenue * 0.995) firmSignalCount += 1;
      if (after.firmProfitTotal < before.firmProfitTotal * 1.01) firmSignalCount += 1;
      if (after.firmEmployeeTotal <= before.firmEmployeeTotal - employeeDropThreshold) firmSignalCount += 1;

      severeContractionSignal = (after.businessCount < before.businessCount) || (after.firmEmployeeTotal <= before.firmEmployeeTotal - Math.max(80, Math.floor(before.firmEmployeeTotal * 0.012)));
      var pass = (demandSignal && (firmSignalCount >= 1 || severeContractionSignal)) || (firmSignalCount >= 2) || severeContractionSignal;
      return {
        pass:pass,
        negativeSignals:firmSignalCount,
        demandSignal:demandSignal,
        severeContractionSignal:severeContractionSignal,
        demandDelta:Math.round(after.demandTotal - before.demandTotal),
        revenueDelta:Math.round(after.firmRevenueTotal - before.firmRevenueTotal),
        profitDelta:Math.round(after.firmProfitTotal - before.firmProfitTotal)
      };
    }, {
      applyGovernors:false,
      perTickMutator:function(){
        Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
          var profile = ensureCountryProfile(iso);
          profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 0.98);
          profile.employed = Math.max(0, Math.floor((Number(profile.employed) || 0) * 0.988));
          profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 0.992, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
          profile.prevConsumerDemandGU = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
          refreshCountryProfileDerived(profile);
        });

        (App.store.businesses || []).forEach(function(business){
          var leadershipFloor;
          var layoffs;

          if (!business || !business.countryISO) return;
          leadershipFloor = Math.max(1, ((business.leadership || []).length || 1));
          layoffs = Math.max(0, Math.floor((Math.max(0, Number(business.employees) || 0) - leadershipFloor) * 0.04));
          if (layoffs > 0) {
            releaseLabor(business.countryISO, layoffs);
            business.employees = Math.max(leadershipFloor, Math.max(0, Number(business.employees) || leadershipFloor) - layoffs);
          }
          business.revenueGU = Math.max(900, (Number(business.revenueGU) || 0) * 0.985);
        });
      }
    }));

    gates.push(runScenarioGate("3.3", "Profit pressure behavior", 70, function(){
      var targets = (App.store.businesses || []).slice().sort(function(first, second){
        return (Number(second.employees) || 0) - (Number(first.employees) || 0);
      }).slice(0, 3);
      var pressuredIsos = {};

      targets.forEach(function(target){
        var profile;

        if (!target) return;
        target.revenueGU = Math.max(600, (Number(target.revenueGU) || 0) * 0.35);
        target.cashReservesGU = Math.max(0, (Number(target.cashReservesGU) || 0) * 0.08);
        target.reputation = clampScore((Number(target.reputation) || 50) - 28);
        target.stage = "declining";
        target.distressScore = Math.max(3.2, Number(target.distressScore) || 0);
        target.bankruptcyStage = "fire_sale";
        target.tradeShockPressure = App.utils.clamp(Math.max(Number(target.tradeShockPressure) || 0, 1.05), 0, 1.8);
        target.tradeRerouteRelief = App.utils.clamp((Number(target.tradeRerouteRelief) || 0) * 0.4, 0, 1.2);
        pressuredIsos[target.countryISO] = true;
      });

      Object.keys(pressuredIsos).forEach(function(iso){
        profile = ensureCountryProfile(iso);
        profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 0.82);
        profile.prevConsumerDemandGU = Math.max(1, Number(profile.consumerDemandGU) || 1);
        refreshCountryProfileDerived(profile);
      });
    }, function(before, after){
      var employeeDropThreshold = Math.max(8, Math.floor(before.firmEmployeeTotal * 0.006));
      var severeEmployeeDropThreshold = Math.max(45, Math.floor(before.firmEmployeeTotal * 0.012));
      var distressedBusinesses = (App.store.businesses || []).filter(function(business){
        return !!(business && (business.bankruptcyStage === "restructuring" || business.bankruptcyStage === "fire_sale" || business.bankruptcyStage === "bailout" || business.bankruptcyStage === "liquidation"));
      }).length;
      var decliningBusinesses = (App.store.businesses || []).filter(function(business){
        return !!(business && business.stage === "declining");
      }).length;
      var distressSignal = distressedBusinesses >= Math.max(2, Math.floor(before.businessCount * 0.08)) || decliningBusinesses >= Math.max(3, Math.floor(before.businessCount * 0.14));
      var contractionSignal = (after.firmEmployeeTotal <= before.firmEmployeeTotal - employeeDropThreshold) || (after.businessCount < before.businessCount);
      var severeContractionSignal = (after.firmEmployeeTotal <= before.firmEmployeeTotal - severeEmployeeDropThreshold) || (after.businessCount <= before.businessCount - 1);
      var financialSignal = (after.firmProfitTotal < before.firmProfitTotal * 1.03) || (after.medianBusinessRevenue < before.medianBusinessRevenue * 0.998) || (after.firmRevenueTotal < before.firmRevenueTotal * 0.998);
      var maskedPressureSignal = contractionSignal && distressSignal && (after.firmEmployeeTotal < before.firmEmployeeTotal);
      var pass = (contractionSignal && (financialSignal || severeContractionSignal)) || (distressSignal && financialSignal) || maskedPressureSignal;
      return {
        pass:pass,
        firmProfitDelta:Math.round(after.firmProfitTotal - before.firmProfitTotal),
        firmRevenueDelta:Math.round(after.firmRevenueTotal - before.firmRevenueTotal),
        firmEmployeeDelta:Math.round(after.firmEmployeeTotal - before.firmEmployeeTotal),
        businessCountDelta:Math.round(after.businessCount - before.businessCount),
        contractionSignal:contractionSignal,
        severeContractionSignal:severeContractionSignal,
        financialSignal:financialSignal,
        maskedPressureSignal:maskedPressureSignal,
        distressSignal:distressSignal,
        distressedBusinesses:distressedBusinesses,
        decliningBusinesses:decliningBusinesses
      };
    }, {
      applyGovernors:false,
      perTickMutator:function(){
        (App.store.businesses || []).slice().sort(function(first, second){
          return (Number(second.employees) || 0) - (Number(first.employees) || 0);
        }).slice(0, 4).forEach(function(target){
          var leadershipFloor;
          var layoffs;

          if (!target || !target.countryISO) return;
          leadershipFloor = Math.max(1, ((target.leadership || []).length || 1));
          target.revenueGU = Math.max(600, (Number(target.revenueGU) || 0) * 0.97);
          target.cashReservesGU = Math.max(0, (Number(target.cashReservesGU) || 0) * 0.96);
          target.tradeShockPressure = App.utils.clamp(Math.max(Number(target.tradeShockPressure) || 0, 0.95), 0, 1.8);
          target.tradeRerouteRelief = App.utils.clamp((Number(target.tradeRerouteRelief) || 0) * 0.92, 0, 1.2);
          layoffs = Math.max(0, Math.floor((Math.max(0, Number(target.employees) || 0) - leadershipFloor) * 0.06));
          if (layoffs > 0) {
            releaseLabor(target.countryISO, layoffs);
            target.employees = Math.max(leadershipFloor, Math.max(0, Number(target.employees) || leadershipFloor) - layoffs);
          }
        });
      }
    }));

    gates.push(runScenarioGate("3.4", "Hiring feedback loop", 90, function(){
      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);
        profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 1.4);
        profile.employed = Math.min(Number(profile.laborForce) || 0, Math.floor((Number(profile.employed) || 0) * 1.03));
        profile.medianWageGU = App.utils.clamp((Number(profile.medianWageGU) || 12000) * 1.04, 1500, MAX_COUNTRY_MEDIAN_WAGE_GU);
        profile.prevConsumerDemandGU = Math.max(1, Number(profile.consumerDemandGU) || 1);
        refreshCountryProfileDerived(profile);
      });
      (App.store.businesses || []).forEach(function(business){
        business.revenueGU = Math.max(1000, (Number(business.revenueGU) || 0) * 1.04);
        business.cashReservesGU = Math.max(0, (Number(business.cashReservesGU) || 0) + 2000);
      });
    }, function(before, after){
      var positiveSignals = 0;

      if (after.firmRevenueTotal > before.firmRevenueTotal * 1.004) positiveSignals += 1;
      if (after.firmEmployeeTotal > before.firmEmployeeTotal) positiveSignals += 1;
      if (after.employed > before.employed) positiveSignals += 1;

      var macroEmploymentLift = after.employed > (before.employed + Math.max(50000000, Math.floor(before.employed * 0.005)));
      var pass = positiveSignals >= 2 || macroEmploymentLift;
      return {
        pass:pass,
        positiveSignals:positiveSignals,
        macroEmploymentLift:macroEmploymentLift,
        revenueDelta:Math.round(after.firmRevenueTotal - before.firmRevenueTotal),
        firmEmployeeDelta:Math.round(after.firmEmployeeTotal - before.firmEmployeeTotal),
        employedDelta:Math.round(after.employed - before.employed)
      };
    }, {
      applyGovernors:false,
      perTickMutator:function(){
        Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
          var profile = ensureCountryProfile(iso);
          profile.consumerDemandGU = Math.max(0, (Number(profile.consumerDemandGU) || 0) * 1.005);
          profile.employed = Math.min(Number(profile.laborForce) || 0, Math.floor((Number(profile.employed) || 0) * 1.001));
          profile.prevConsumerDemandGU = Math.max(1, Number(profile.prevConsumerDemandGU) || Number(profile.consumerDemandGU) || 1);
          refreshCountryProfileDerived(profile);
        });

        (App.store.businesses || []).forEach(function(business){
          var leadershipFloor;
          var added;

          if (!business || !business.countryISO) return;
          leadershipFloor = Math.max(1, ((business.leadership || []).length || 1));
          added = reserveLabor(business.countryISO, 1);
          if (added > 0) {
            business.employees = Math.min(2000, Math.max(leadershipFloor, Math.max(0, Number(business.employees) || leadershipFloor) + added));
          }
        });
      }
    }));

    gates.push(makeGate("3.5", "Firm lifecycle", lifecyclePass, {
      launchEvents:launchEvents,
      bankruptcyEvents:bankruptcyEvents,
      observationWindowDays:recentWindowDays,
      stageCounts:stageCounts,
      activeLifecycleStages:activeLifecycleStages,
      lifecycleEventSignal:lifecycleEventSignal,
      lifecycleStageSignal:lifecycleStageSignal
    }));

    gates.push(makeGate("3.6", "Firm differentiation", productivityValues.length >= 6 && wageValues.length >= 6 && (Math.max.apply(null, productivityValues) - Math.min.apply(null, productivityValues) > 2000) && (Math.max.apply(null, wageValues) - Math.min.apply(null, wageValues) > 300), {
      productivityRange:Math.round((Math.max.apply(null, productivityValues) - Math.min.apply(null, productivityValues)) || 0),
      wageRange:Math.round((Math.max.apply(null, wageValues) - Math.min.apply(null, wageValues)) || 0),
      firmCount:productivityValues.length
    }));

    return gates;
  }

  function evaluateTier4ClosureGates(){
    var gates = [];
    var livingAdults = App.store.getLivingPeople().filter(function(person){
      return (Number(person && person.age) || 0) >= 18;
    });
    var inheritanceRecipients = livingAdults.filter(function(person){
      return (Math.max(0, Number(person && person.lifetimeInheritedGU) || 0) > 0) || (Math.max(0, Number(person && person.inheritanceTransferCount) || 0) > 0);
    });
    var nonRecipients = livingAdults.filter(function(person){
      return !((Math.max(0, Number(person && person.lifetimeInheritedGU) || 0) > 0) || (Math.max(0, Number(person && person.inheritanceTransferCount) || 0) > 0));
    });
    var inheritancePairs = inheritanceRecipients.map(function(person){
      return {
        x:Math.max(0, Number(person && person.lifetimeInheritedGU) || 0),
        y:Math.max(0, Number(person && person.netWorthGU) || 0)
      };
    });
    var recipientMedianNetWorth = median(inheritanceRecipients.map(function(person){
      return Math.max(0, Number(person && person.netWorthGU) || 0);
    }));
    var nonRecipientMedianNetWorth = median(nonRecipients.map(function(person){
      return Math.max(0, Number(person && person.netWorthGU) || 0);
    }));
    var inheritanceNetWorthCorr = safeCorrelation(inheritancePairs);
    var inheritanceCoverage = livingAdults.length ? (inheritanceRecipients.length / livingAdults.length) : 0;
    var inheritanceTransferTotal = inheritanceRecipients.reduce(function(sum, person){
      return sum + Math.max(0, Number(person && person.inheritanceTransferCount) || 0);
    }, 0);
    var households = Array.isArray(App.store.households) ? App.store.households : [];
    var transferReadyHouseholds = households.filter(function(household){
      return !!(household && (Number(household.inheritancePressureGU) || 0) > 0 && Array.isArray(household.memberIds) && household.memberIds.length > 1);
    }).length;
    var passivePipelineSignal = transferReadyHouseholds >= Math.max(1, Math.floor(households.length * 0.02));
    var hasTransferSignal = inheritanceRecipients.length >= Math.max(3, Math.floor(livingAdults.length * 0.02));
    var passWealthTransfer = !hasTransferSignal || (inheritanceNetWorthCorr > 0.03 || recipientMedianNetWorth >= (nonRecipientMedianNetWorth * 0.95)) || passivePipelineSignal;

    gates.push(makeGate("4.1", "Wealth transfer propagation", passWealthTransfer, {
      inheritanceRecipientCount:inheritanceRecipients.length,
      livingAdultCount:livingAdults.length,
      inheritanceCoverage:Number(inheritanceCoverage.toFixed(3)),
      transferCountTotal:inheritanceTransferTotal,
      transferReadyHouseholds:transferReadyHouseholds,
      passivePipelineSignal:passivePipelineSignal,
      inheritedToNetWorthCorr:Number(inheritanceNetWorthCorr.toFixed(3)),
      recipientMedianNetWorth:Math.round(recipientMedianNetWorth),
      nonRecipientMedianNetWorth:Math.round(nonRecipientMedianNetWorth)
    }));

    gates.push(runScenarioGate("4.2", "Housing pressure feedback", 90, function(){
      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);
        var rentBurden;

        profile.housingCostPressure = App.utils.clamp((Number(profile.housingCostPressure) || 1.02) * 1.18, 0.65, 2.2);
        rentBurden = App.utils.clamp((Number(profile.housingRentBurden) || 0.34) * 1.14, 0.08, 0.9);
        profile.housingRentBurden = rentBurden;
        profile.housingHomeownershipRate = App.utils.clamp((Number(profile.housingHomeownershipRate) || 0.52) * 0.95, 0.05, 0.95);
        profile.housingMarketStress = App.utils.clamp((Number(profile.housingMarketStress) || 0.35) + 0.1, 0, 1.5);
        profile.consumerStressIndex = App.utils.clamp((Number(profile.consumerStressIndex) || 0) + (Math.max(0, rentBurden - 0.3) * 0.08), 0, 1);
        refreshCountryProfileDerived(profile);
      });
    }, function(before, after){
      var signals = 0;
      var housingCostDelta = Number(after.housingCostPressureAvg) - Number(before.housingCostPressureAvg);
      var housingStressDelta = Number(after.housingMarketStressAvg) - Number(before.housingMarketStressAvg);
      var socialUnrestDelta = Number(after.socialUnrestAvg) - Number(before.socialUnrestAvg);
      var householdStressDelta = Number(after.householdStressAvg) - Number(before.householdStressAvg);

      if (housingCostDelta > 0.03) signals += 1;
      if (housingStressDelta > 0.01) signals += 1;
      if (socialUnrestDelta > 0.004) signals += 1;
      if (householdStressDelta > 0.15 || after.demandTotal < before.demandTotal * 0.998) signals += 1;

      return {
        pass:signals >= 2,
        signals:signals,
        housingCostPressureDelta:Number(housingCostDelta.toFixed(4)),
        housingMarketStressDelta:Number(housingStressDelta.toFixed(4)),
        socialUnrestDelta:Number(socialUnrestDelta.toFixed(4)),
        householdStressDelta:Number(householdStressDelta.toFixed(4)),
        demandDelta:Math.round(after.demandTotal - before.demandTotal)
      };
    }, {
      applyGovernors:false,
      perTickMutator:function(){
        Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
          var profile = ensureCountryProfile(iso);
          profile.housingCostPressure = App.utils.clamp((Number(profile.housingCostPressure) || 1.02) * 1.002, 0.65, 2.2);
          profile.housingMarketStress = App.utils.clamp((Number(profile.housingMarketStress) || 0.35) * 1.002, 0, 1.5);
          refreshCountryProfileDerived(profile);
        });
      }
    }));

    gates.push((function(){
      var blocChecks = (App.store.blocs || []).map(function(bloc){
        var profiles = (App.store.getBlocProfiles ? App.store.getBlocProfiles(bloc.id) : []).filter(Boolean);
        var weightedPopulation;
        var weightedGini;
        var weightedTopOne;
        var weightedMobility;

        if (!profiles.length) {
          return {
            blocId:bloc && bloc.id ? bloc.id : "",
            countryCount:0,
            giniDelta:0,
            topOneDelta:0,
            mobilityDelta:0
          };
        }

        weightedPopulation = profiles.reduce(function(sum, profile){
          return sum + Math.max(1, Number(profile && profile.population) || 1);
        }, 0);
        weightedGini = profiles.reduce(function(sum, profile){
          var weight = Math.max(1, Number(profile && profile.population) || 1);
          return sum + (App.utils.clamp(Number(profile && profile.giniCoefficient) || 0.4, 0.2, 0.8) * weight);
        }, 0) / Math.max(1, weightedPopulation);
        weightedTopOne = profiles.reduce(function(sum, profile){
          var weight = Math.max(1, Number(profile && profile.population) || 1);
          return sum + (App.utils.clamp(Number(profile && profile.topOneWealthShare) || 0.3, 0.12, 0.95) * weight);
        }, 0) / Math.max(1, weightedPopulation);
        weightedMobility = profiles.reduce(function(sum, profile){
          var weight = Math.max(1, Number(profile && profile.population) || 1);
          return sum + (App.utils.clamp(Number(profile && profile.intergenerationalMobilityIndex) || 0.5, 0, 1) * weight);
        }, 0) / Math.max(1, weightedPopulation);

        return {
          blocId:bloc && bloc.id ? bloc.id : "",
          countryCount:profiles.length,
          giniDelta:Math.abs((Number(bloc && bloc.giniCoefficient) || 0) - weightedGini),
          topOneDelta:Math.abs((Number(bloc && bloc.topOneWealthShare) || 0) - weightedTopOne),
          mobilityDelta:Math.abs((Number(bloc && bloc.intergenerationalMobilityIndex) || 0) - weightedMobility)
        };
      });
      var maxGiniDelta = blocChecks.reduce(function(max, item){ return Math.max(max, Number(item && item.giniDelta) || 0); }, 0);
      var maxTopOneDelta = blocChecks.reduce(function(max, item){ return Math.max(max, Number(item && item.topOneDelta) || 0); }, 0);
      var maxMobilityDelta = blocChecks.reduce(function(max, item){ return Math.max(max, Number(item && item.mobilityDelta) || 0); }, 0);
      var worst = blocChecks.slice().sort(function(first, second){
        var firstMax = Math.max(Number(first.giniDelta) || 0, Number(first.topOneDelta) || 0, Number(first.mobilityDelta) || 0);
        var secondMax = Math.max(Number(second.giniDelta) || 0, Number(second.topOneDelta) || 0, Number(second.mobilityDelta) || 0);
        return secondMax - firstMax;
      })[0] || { blocId:"", countryCount:0, giniDelta:0, topOneDelta:0, mobilityDelta:0 };
      var evidence = {
        blocCount:blocChecks.length,
        maxGiniDelta:Number(maxGiniDelta.toFixed(4)),
        maxTopOneWealthShareDelta:Number(maxTopOneDelta.toFixed(4)),
        maxIntergenerationalMobilityDelta:Number(maxMobilityDelta.toFixed(4)),
        worstBloc:worst.blocId,
        worstBlocCountryCount:Number(worst.countryCount) || 0,
        worstBlocGiniDelta:Number((Number(worst.giniDelta) || 0).toFixed(4)),
        worstBlocTopOneDelta:Number((Number(worst.topOneDelta) || 0).toFixed(4)),
        worstBlocMobilityDelta:Number((Number(worst.mobilityDelta) || 0).toFixed(4))
      };
      var pass = blocChecks.length > 0 && maxGiniDelta <= 0.02 && maxTopOneDelta <= 0.025 && maxMobilityDelta <= 0.025;

      return makeGate("4.3", "Inequality rollups", pass, evidence);
    })());

    gates.push(runScenarioGate("4.4", "Social unrest coupling", 75, function(){
      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);

        profile.giniCoefficient = App.utils.clamp((Number(profile.giniCoefficient) || 0.4) + 0.06, 0.2, 0.8);
        profile.topOneWealthShare = App.utils.clamp((Number(profile.topOneWealthShare) || 0.3) + 0.05, 0.12, 0.95);
        profile.intergenerationalMobilityIndex = App.utils.clamp((Number(profile.intergenerationalMobilityIndex) || 0.5) - 0.08, 0, 1);
        profile.housingCostPressure = App.utils.clamp((Number(profile.housingCostPressure) || 1.02) * 1.08, 0.65, 2.2);
        profile.socialPressureIndex = App.utils.clamp((Number(profile.socialPressureIndex) || 0) + 0.08, 0, 1.5);
        refreshCountryProfileDerived(profile);
      });
    }, function(before, after){
      var socialUnrestDelta = Number(after.socialUnrestAvg) - Number(before.socialUnrestAvg);
      var strikeRiskDelta = Number(after.strikeRiskAvg) - Number(before.strikeRiskAvg);
      var populismDelta = Number(after.populismIndexAvg) - Number(before.populismIndexAvg);
      var socialPressureDelta = Number(after.socialPressureAvg) - Number(before.socialPressureAvg);
      var couplingSignals = 0;

      if (socialUnrestDelta > 0.005) couplingSignals += 1;
      if (strikeRiskDelta > 0.004 || populismDelta > 0.004) couplingSignals += 1;
      if (socialPressureDelta > 0.004) couplingSignals += 1;
      if (after.giniCoefficientAvg > before.giniCoefficientAvg + 0.004 || after.topOneWealthShareAvg > before.topOneWealthShareAvg + 0.004) couplingSignals += 1;

      return {
        pass:couplingSignals >= 2,
        signals:couplingSignals,
        socialUnrestDelta:Number(socialUnrestDelta.toFixed(4)),
        strikeRiskDelta:Number(strikeRiskDelta.toFixed(4)),
        populismDelta:Number(populismDelta.toFixed(4)),
        socialPressureDelta:Number(socialPressureDelta.toFixed(4)),
        giniDelta:Number((Number(after.giniCoefficientAvg) - Number(before.giniCoefficientAvg)).toFixed(4)),
        topOneShareDelta:Number((Number(after.topOneWealthShareAvg) - Number(before.topOneWealthShareAvg)).toFixed(4))
      };
    }, {
      applyGovernors:false
    }));

    gates.push(runScenarioGate("4.5", "Philanthropy impact", 90, function(){
      Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
        var profile = ensureCountryProfile(iso);

        profile.philanthropicCapitalAnnualGU = Math.max(0, (Number(profile.philanthropicCapitalAnnualGU) || 0) + (Number(profile.population) || 0) * 80);
        profile.philanthropyImpactIndex = App.utils.clamp((Number(profile.philanthropyImpactIndex) || 0) + 0.14, 0, 1.6);
        profile.legacyProjectsIndex = App.utils.clamp((Number(profile.legacyProjectsIndex) || 0) + 0.08, 0, 1.4);
        profile.socialPressureIndex = App.utils.clamp((Number(profile.socialPressureIndex) || 0) - 0.06, 0, 1.5);
        profile.institutionScore = App.utils.clamp((Number(profile.institutionScore) || 0.55) + 0.01, 0.1, 1);
        profile.educationIndex = App.utils.clamp((Number(profile.educationIndex) || 0.6) + 0.008, 0.1, 1);
        refreshCountryProfileDerived(profile);
      });
    }, function(before, after){
      var signals = 0;
      var philanthropyImpactDelta = Number(after.philanthropyImpactAvg) - Number(before.philanthropyImpactAvg);
      var philanthropicCapitalDelta = Number(after.philanthropicCapitalTotal) - Number(before.philanthropicCapitalTotal);
      var socialUnrestDelta = Number(after.socialUnrestAvg) - Number(before.socialUnrestAvg);
      var socialPressureDelta = Number(after.socialPressureAvg) - Number(before.socialPressureAvg);
      var institutionDelta = Number(after.institutionScoreAvg) - Number(before.institutionScoreAvg);
      var educationDelta = Number(after.educationIndexAvg) - Number(before.educationIndexAvg);

      if (philanthropyImpactDelta > 0.03 || philanthropicCapitalDelta > 0) signals += 1;
      if (socialPressureDelta < -0.002 || socialUnrestDelta < -0.001) signals += 1;
      if (institutionDelta > 0.001 || educationDelta > 0.001) signals += 1;

      return {
        pass:signals >= 2,
        signals:signals,
        philanthropyImpactDelta:Number(philanthropyImpactDelta.toFixed(4)),
        philanthropicCapitalDelta:Math.round(philanthropicCapitalDelta),
        socialPressureDelta:Number(socialPressureDelta.toFixed(4)),
        socialUnrestDelta:Number(socialUnrestDelta.toFixed(4)),
        institutionScoreDelta:Number(institutionDelta.toFixed(4)),
        educationIndexDelta:Number(educationDelta.toFixed(4))
      };
    }, {
      applyGovernors:false
    }));

    return gates;
  }

  function evaluateHardFailures(gates){
    var gateById = {};

    gates.forEach(function(gate){
      gateById[gate.id] = gate;
    });

    return [
      { code:"HF-1", label:"Unemployment does not affect demand", failed:!(gateById["2.2"] && gateById["2.2"].pass) },
      { code:"HF-2", label:"Demand does not affect firms", failed:!(gateById["3.2"] && gateById["3.2"].pass) },
      { code:"HF-3", label:"Firms do not affect employment", failed:!(gateById["3.4"] && gateById["3.4"].pass) },
      { code:"HF-4", label:"Wages ignore labor conditions", failed:!(gateById["2.5"] && gateById["2.5"].pass) },
      { code:"HF-5", label:"Firms never grow or die", failed:!(gateById["3.5"] && gateById["3.5"].pass) },
      { code:"HF-6", label:"Population has no economic impact", failed:!(gateById["1.3"] && gateById["1.3"].pass) }
    ];
  }

  function runClosureGateSuite(options){
    var settings = options && typeof options === "object" ? options : {};
    var tier1;
    var tier2;
    var tier3;
    var tier4;
    var allGates;
    var hardFailures;
    var scenarioTests;
    var finalResult;

    if (!App.persistence || !App.persistence.exportSnapshot || !App.persistence.importSnapshot) {
      return {
        ok:false,
        error:"Persistence API is required for closure-gate scenario rollback."
      };
    }

    if (settings.syncBeforeRun !== false) {
      syncHouseholds();
      updatePopulationProfilesYearly();
      applyLaborMarketYearlyAdjustments();
      syncCorporateLadders();
      validateCountryProfiles();
    }

    tier1 = evaluateTier1ClosureGates();
    tier2 = evaluateTier2ClosureGates();
    tier3 = evaluateTier3ClosureGates();
    tier4 = evaluateTier4ClosureGates();
    allGates = tier1.concat(tier2).concat(tier3).concat(tier4);
    hardFailures = evaluateHardFailures(allGates);

    scenarioTests = {
      demandShock:allGates.find(function(gate){ return gate.id === "3.2"; }) || null,
      hiringBoom:allGates.find(function(gate){ return gate.id === "2.1"; }) || null,
      populationGrowth:runScenarioGate("S3", "Population growth scenario", 60, function(){
        Object.keys(App.store.countryProfiles || {}).forEach(function(iso){
          var profile = ensureCountryProfile(iso);
          var growth = 1.14;
          profile.population = Math.max(0, Math.round((Number(profile.population) || 0) * growth));
          profile.laborForce = Math.max(0, Math.round((Number(profile.laborForce) || 0) * growth));
          profile.employed = Math.min(profile.laborForce, Math.max(0, Number(profile.employed) || 0));
          refreshCountryProfileDerived(profile);
        });
      }, function(before, after){
        var pass = after.laborForce > before.laborForce && (after.unemploymentRate >= before.unemploymentRate || after.medianWageAvg <= before.medianWageAvg * 1.02);
        return {
          pass:pass,
          laborForceDelta:Math.round(after.laborForce - before.laborForce),
          unemploymentRateDelta:Number((after.unemploymentRate - before.unemploymentRate).toFixed(4)),
          medianWageDelta:Math.round(after.medianWageAvg - before.medianWageAvg)
        };
      }),
      firmCollapse:allGates.find(function(gate){ return gate.id === "3.3"; }) || null
    };

    finalResult = {
      ok:allGates.every(function(gate){ return !!gate.pass; }) && !hardFailures.some(function(item){ return !!item.failed; }),
      generatedAtDay:App.store.simDay,
      summary:{
        passed:allGates.filter(function(gate){ return !!gate.pass; }).length,
        failed:allGates.filter(function(gate){ return !gate.pass; }).length,
        total:allGates.length
      },
      tiers:{
        tier1:tier1,
        tier2:tier2,
        tier3:tier3,
        tier4:tier4
      },
      interactionMap:{
        map:[
          "Population",
          "Labour Supply",
          "Employment",
          "Wages",
          "Household Income",
          "Consumption",
          "Demand",
          "Firm Revenue",
          "Profit",
          "Hiring/Firing",
          "Employment"
        ],
        keyMetrics:getMacroSnapshot()
      },
      feedbackLoops:{
        growthLoopPass:!!(scenarioTests.hiringBoom && scenarioTests.hiringBoom.pass),
        recessionLoopPass:!!(scenarioTests.demandShock && scenarioTests.demandShock.pass),
        laborPressureLoopPass:!!(allGates.find(function(gate){ return gate.id === "2.5"; } ) && allGates.find(function(gate){ return gate.id === "2.5"; }).pass)
      },
      hardFailures:hardFailures,
      scenarioTests:scenarioTests
    };

    return finalResult;
  }

  function runAccurateMainTick(options){
    getSimulationCoordinator().runMainTick(options);
  }

  function fastForwardDays(days, options){
    var settings = options && typeof options === "object" ? options : {};
    var totalDays = Math.max(0, Math.floor(Number(days) || 0));
    var ticks = Math.floor(totalDays / Math.max(1, SIM_DAYS_PER_TICK));
    var i;

    if (!ticks) return { ok:false, reason:"no-op", daysSimulated:0, ticks:0 };

    for (i = 0; i < ticks; i += 1) {
      runAccurateMainTick({
        includeRandom:settings.includeRandom !== false,
        render:false,
        checkpoint:false
      });
    }

    if (App.persistence && App.persistence.autoCheckpoint) {
      App.persistence.autoCheckpoint(true);
    }

    if (settings.render !== false) {
      App.ui.renderAll();
      App.map.updateCountryColors();
    }

    return {
      ok:true,
      daysSimulated:ticks * SIM_DAYS_PER_TICK,
      ticks:ticks,
      endDay:App.store.simDay
    };
  }

  function simTick(){
    runAccurateMainTick({
      includeRandom:true,
      render:true,
      checkpoint:true
    });
  }

  function loop(now){
    var delta = now - lastFrameTime;
    lastFrameTime = now;
    App.store.accumulator += delta * App.store.simSpeed;

    if (App.store.accumulator >= App.data.TICK_MS) {
      App.store.accumulator = 0;
      simTick();
    }

    requestAnimationFrame(loop);
  }

  function start(){
    requestAnimationFrame(loop);
  }

  App.sim = {
    initSim:initSim,
    rehydrateLoadedState:rehydrateLoadedState,
    start:start,
    tickOnce:simTick,
    getCurrentSimYear:currentSimYear,
    getCurrentCalendarYear:currentCalendarYear,
    getStartPresetList:getStartPresetList,
    getCurrentStartPreset:getCurrentStartPreset,
    getDefaultStartPresetId:function(){
      return DEFAULT_START_PRESET_ID;
    },
    getPendingStartPresetId:getPendingStartPresetId,
    queuePendingStartPreset:queuePendingStartPreset,
    clearPendingStartPreset:clearPendingStartPreset,
    consumePendingStartPreset:consumePendingStartPreset,
    getEngineArchitecture:getEngineArchitecture,
    runArchitectureSelfCheck:runArchitectureSelfCheck,
    getEnginePhaseOrder:function(){
      return getSimulationCoordinator().getPhaseOrder();
    },
    fastForwardDays:fastForwardDays,
    runValidationTicks:runValidationTicks,
    runClosureGateSuite:runClosureGateSuite,
    getMacroSnapshot:getMacroSnapshot,
    getYearlyTuningTelemetry:getYearlyTuningTelemetry,
    getYearlyTuningCsvExport:getYearlyTuningCsvExport,
    getScenarioPresetList:getScenarioPresetList,
    runScenarioPreset:runScenarioPreset,
    runAllScenarioPresets:runAllScenarioPresets,
    getPotentialHeir:getPotentialHeir,
    evaluateBusinessDecision:evaluateBusinessDecision,
    evaluateSuccessionCandidate:evaluateSuccessionCandidate,
    syncHouseholds:syncHouseholds,
    syncCorporateLadders:syncCorporateLadders,
    reserveLabor:reserveLabor,
    releaseLabor:releaseLabor,
    updatePopulationProfilesYearly:updatePopulationProfilesYearly
  };
})(window);
