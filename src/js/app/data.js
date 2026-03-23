(function(global){
  var App = global.Nexus || (global.Nexus = {});
  var usMapData = App.usStateMapData || { state_specific:{} };
  var runtimeNameData = global.NexusNameData || {};

  var CURRENCY_MAP = {
    AF:{code:"AFN",name:"Afghani",sym:"؋"},AL:{code:"ALL",name:"Lek",sym:"L"},DZ:{code:"DZD",name:"Dinar",sym:"د.ج"},AO:{code:"AOA",name:"Kwanza",sym:"Kz"},
    AR:{code:"ARS",name:"Peso",sym:"$"},AM:{code:"AMD",name:"Dram",sym:"֏"},AU:{code:"AUD",name:"AUD",sym:"A$"},AT:{code:"EUR",name:"Euro",sym:"€"},
    AZ:{code:"AZN",name:"Manat",sym:"₼"},BS:{code:"BSD",name:"BSD",sym:"$"},BH:{code:"BHD",name:"Dinar",sym:"BD"},BD:{code:"BDT",name:"Taka",sym:"৳"},
    BB:{code:"BBD",name:"BBD",sym:"$"},BY:{code:"BYN",name:"Ruble",sym:"Br"},BE:{code:"EUR",name:"Euro",sym:"€"},BZ:{code:"BZD",name:"BZD",sym:"$"},
    BJ:{code:"XOF",name:"CFA",sym:"Fr"},BT:{code:"BTN",name:"Ngultrum",sym:"Nu"},BO:{code:"BOB",name:"Boliviano",sym:"Bs"},BA:{code:"BAM",name:"Mark",sym:"KM"},
    BW:{code:"BWP",name:"Pula",sym:"P"},BR:{code:"BRL",name:"Real",sym:"R$"},BN:{code:"BND",name:"BND",sym:"$"},BG:{code:"BGN",name:"Lev",sym:"лв"},
    BF:{code:"XOF",name:"CFA",sym:"Fr"},BI:{code:"BIF",name:"Franc",sym:"Fr"},CV:{code:"CVE",name:"Escudo",sym:"$"},KH:{code:"KHR",name:"Riel",sym:"៛"},
    CM:{code:"XAF",name:"CFA",sym:"Fr"},CA:{code:"CAD",name:"CAD",sym:"$"},CF:{code:"XAF",name:"CFA",sym:"Fr"},TD:{code:"XAF",name:"CFA",sym:"Fr"},
    CL:{code:"CLP",name:"Peso",sym:"$"},CN:{code:"CNY",name:"Yuan",sym:"¥"},CO:{code:"COP",name:"Peso",sym:"$"},KM:{code:"KMF",name:"Franc",sym:"Fr"},
    CG:{code:"XAF",name:"CFA",sym:"Fr"},CD:{code:"CDF",name:"Franc",sym:"Fr"},CR:{code:"CRC",name:"Colon",sym:"₡"},HR:{code:"EUR",name:"Euro",sym:"€"},
    CU:{code:"CUP",name:"Peso",sym:"$"},CY:{code:"EUR",name:"Euro",sym:"€"},CZ:{code:"CZK",name:"Koruna",sym:"Kč"},DK:{code:"DKK",name:"Krone",sym:"kr"},
    DJ:{code:"DJF",name:"Franc",sym:"Fr"},DO:{code:"DOP",name:"Peso",sym:"$"},EC:{code:"USD",name:"USD",sym:"$"},EG:{code:"EGP",name:"Pound",sym:"£"},
    SV:{code:"USD",name:"USD",sym:"$"},GQ:{code:"XAF",name:"CFA",sym:"Fr"},ER:{code:"ERN",name:"Nakfa",sym:"Nfk"},EE:{code:"EUR",name:"Euro",sym:"€"},
    ET:{code:"ETB",name:"Birr",sym:"Br"},FJ:{code:"FJD",name:"FJD",sym:"$"},FI:{code:"EUR",name:"Euro",sym:"€"},FR:{code:"EUR",name:"Euro",sym:"€"},
    GA:{code:"XAF",name:"CFA",sym:"Fr"},GM:{code:"GMD",name:"Dalasi",sym:"D"},GE:{code:"GEL",name:"Lari",sym:"₾"},DE:{code:"EUR",name:"Euro",sym:"€"},
    GH:{code:"GHS",name:"Cedi",sym:"₵"},GR:{code:"EUR",name:"Euro",sym:"€"},GL:{code:"DKK",name:"Krone",sym:"kr"},GT:{code:"GTQ",name:"Quetzal",sym:"Q"},
    GN:{code:"GNF",name:"Franc",sym:"Fr"},GW:{code:"XOF",name:"CFA",sym:"Fr"},GY:{code:"GYD",name:"GYD",sym:"$"},HT:{code:"HTG",name:"Gourde",sym:"G"},
    HN:{code:"HNL",name:"Lempira",sym:"L"},HU:{code:"HUF",name:"Forint",sym:"Ft"},IS:{code:"ISK",name:"Krona",sym:"kr"},IN:{code:"INR",name:"Rupee",sym:"₹"},
    ID:{code:"IDR",name:"Rupiah",sym:"Rp"},IR:{code:"IRR",name:"Rial",sym:"﷼"},IQ:{code:"IQD",name:"Dinar",sym:"ع.د"},IE:{code:"EUR",name:"Euro",sym:"€"},
    IL:{code:"ILS",name:"Shekel",sym:"₪"},IT:{code:"EUR",name:"Euro",sym:"€"},JM:{code:"JMD",name:"JMD",sym:"$"},JP:{code:"JPY",name:"Yen",sym:"¥"},
    JO:{code:"JOD",name:"Dinar",sym:"JD"},KZ:{code:"KZT",name:"Tenge",sym:"₸"},KE:{code:"KES",name:"Shilling",sym:"KSh"},KP:{code:"KPW",name:"Won",sym:"₩"},
    KR:{code:"KRW",name:"Won",sym:"₩"},KW:{code:"KWD",name:"Dinar",sym:"KD"},KG:{code:"KGS",name:"Som",sym:"с"},LA:{code:"LAK",name:"Kip",sym:"₭"},
    LV:{code:"EUR",name:"Euro",sym:"€"},LB:{code:"LBP",name:"Pound",sym:"ل.ل"},LS:{code:"LSL",name:"Loti",sym:"L"},LR:{code:"LRD",name:"LRD",sym:"$"},
    LY:{code:"LYD",name:"Dinar",sym:"LD"},LT:{code:"EUR",name:"Euro",sym:"€"},LU:{code:"EUR",name:"Euro",sym:"€"},MK:{code:"MKD",name:"Denar",sym:"ден"},
    MG:{code:"MGA",name:"Ariary",sym:"Ar"},MW:{code:"MWK",name:"Kwacha",sym:"MK"},MY:{code:"MYR",name:"Ringgit",sym:"RM"},MV:{code:"MVR",name:"Rufiyaa",sym:"Rf"},
    ML:{code:"XOF",name:"CFA",sym:"Fr"},MT:{code:"EUR",name:"Euro",sym:"€"},MR:{code:"MRO",name:"Ouguiya",sym:"UM"},MU:{code:"MUR",name:"Rupee",sym:"₨"},
    MX:{code:"MXN",name:"Peso",sym:"$"},MD:{code:"MDL",name:"Leu",sym:"L"},MN:{code:"MNT",name:"Tugrik",sym:"₮"},ME:{code:"EUR",name:"Euro",sym:"€"},
    MA:{code:"MAD",name:"Dirham",sym:"MAD"},MZ:{code:"MZN",name:"Metical",sym:"MT"},MM:{code:"MMK",name:"Kyat",sym:"K"},NA:{code:"NAD",name:"NAD",sym:"$"},
    NP:{code:"NPR",name:"Rupee",sym:"₨"},NL:{code:"EUR",name:"Euro",sym:"€"},NZ:{code:"NZD",name:"NZD",sym:"$"},NI:{code:"NIO",name:"Cordoba",sym:"C$"},
    NE:{code:"XOF",name:"CFA",sym:"Fr"},NG:{code:"NGN",name:"Naira",sym:"₦"},NO:{code:"NOK",name:"Krone",sym:"kr"},OM:{code:"OMR",name:"Rial",sym:"﷼"},
    PK:{code:"PKR",name:"Rupee",sym:"₨"},PA:{code:"PAB",name:"Balboa",sym:"B/."},PG:{code:"PGK",name:"Kina",sym:"K"},PY:{code:"PYG",name:"Guarani",sym:"₲"},
    PE:{code:"PEN",name:"Sol",sym:"S/"},PH:{code:"PHP",name:"Peso",sym:"₱"},PL:{code:"PLN",name:"Zloty",sym:"zł"},PT:{code:"EUR",name:"Euro",sym:"€"},
    QA:{code:"QAR",name:"Rial",sym:"﷼"},RO:{code:"RON",name:"Leu",sym:"lei"},RU:{code:"RUB",name:"Ruble",sym:"₽"},RW:{code:"RWF",name:"Franc",sym:"Fr"},
    SA:{code:"SAR",name:"Riyal",sym:"﷼"},SN:{code:"XOF",name:"CFA",sym:"Fr"},RS:{code:"RSD",name:"Dinar",sym:"din"},SL:{code:"SLL",name:"Leone",sym:"Le"},
    SG:{code:"SGD",name:"SGD",sym:"$"},SK:{code:"EUR",name:"Euro",sym:"€"},SI:{code:"EUR",name:"Euro",sym:"€"},SB:{code:"SBD",name:"SBD",sym:"$"},
    SO:{code:"SOS",name:"Shilling",sym:"Sh"},ZA:{code:"ZAR",name:"Rand",sym:"R"},SS:{code:"SSP",name:"Pound",sym:"£"},ES:{code:"EUR",name:"Euro",sym:"€"},
    LK:{code:"LKR",name:"Rupee",sym:"₨"},SD:{code:"SDG",name:"Pound",sym:"£"},SR:{code:"SRD",name:"SRD",sym:"$"},SE:{code:"SEK",name:"Krona",sym:"kr"},
    CH:{code:"CHF",name:"Franc",sym:"Fr"},SY:{code:"SYP",name:"Pound",sym:"£"},TJ:{code:"TJS",name:"Somoni",sym:"SM"},TZ:{code:"TZS",name:"Shilling",sym:"Sh"},
    TH:{code:"THB",name:"Baht",sym:"฿"},TG:{code:"XOF",name:"CFA",sym:"Fr"},TN:{code:"TND",name:"Dinar",sym:"DT"},TR:{code:"TRY",name:"Lira",sym:"₺"},
    TM:{code:"TMT",name:"Manat",sym:"T"},UG:{code:"UGX",name:"Shilling",sym:"Sh"},UA:{code:"UAH",name:"Hryvnia",sym:"₴"},AE:{code:"AED",name:"Dirham",sym:"د.إ"},
    GB:{code:"GBP",name:"Pound",sym:"£"},US:{code:"USD",name:"USD",sym:"$"},UY:{code:"UYU",name:"Peso",sym:"$"},UZ:{code:"UZS",name:"Sum",sym:"лв"},
    VU:{code:"VUV",name:"Vatu",sym:"Vt"},VE:{code:"VEF",name:"Bolivar",sym:"Bs.F"},VN:{code:"VND",name:"Dong",sym:"₫"},YE:{code:"YER",name:"Rial",sym:"﷼"},
    ZM:{code:"ZMW",name:"Kwacha",sym:"ZK"},ZW:{code:"ZWL",name:"ZWL",sym:"$"},TW:{code:"TWD",name:"TWD",sym:"$"},HK:{code:"HKD",name:"HKD",sym:"$"},
    CW:{code:"ANG",name:"Guilder",sym:"ƒ"},AW:{code:"AWG",name:"Florin",sym:"ƒ"},GF:{code:"EUR",name:"Euro",sym:"€"},GP:{code:"EUR",name:"Euro",sym:"€"},
    MQ:{code:"EUR",name:"Euro",sym:"€"},RE:{code:"EUR",name:"Euro",sym:"€"},NC:{code:"XPF",name:"CFP Franc",sym:"Fr"},PF:{code:"XPF",name:"CFP Franc",sym:"Fr"},
    EH:{code:"MAD",name:"Dirham",sym:"MAD"},KY:{code:"KYD",name:"KYD",sym:"$"},BM:{code:"BMD",name:"BMD",sym:"$"},TC:{code:"USD",name:"USD",sym:"$"},
    VG:{code:"USD",name:"USD",sym:"$"},VI:{code:"USD",name:"USD",sym:"$"},PR:{code:"USD",name:"USD",sym:"$"},GU:{code:"USD",name:"USD",sym:"$"},
    AS:{code:"USD",name:"USD",sym:"$"},MP:{code:"USD",name:"USD",sym:"$"},FK:{code:"FKP",name:"FKP",sym:"£"},SX:{code:"ANG",name:"Guilder",sym:"ƒ"},
    BQ:{code:"USD",name:"USD",sym:"$"},MO:{code:"MOP",name:"Pataca",sym:"P"},XK:{code:"EUR",name:"Euro",sym:"€"},AD:{code:"EUR",name:"Euro",sym:"€"},
    SM:{code:"EUR",name:"Euro",sym:"€"},VA:{code:"EUR",name:"Euro",sym:"€"},LI:{code:"CHF",name:"Franc",sym:"Fr"},MC:{code:"EUR",name:"Euro",sym:"€"},
    FO:{code:"DKK",name:"Krone",sym:"kr"},AX:{code:"EUR",name:"Euro",sym:"€"},SJ:{code:"NOK",name:"Krone",sym:"kr"},GI:{code:"GIP",name:"GIP",sym:"£"},
    IM:{code:"GBP",name:"Pound",sym:"£"},JE:{code:"GBP",name:"Pound",sym:"£"},GG:{code:"GBP",name:"Pound",sym:"£"},AI:{code:"XCD",name:"XCD",sym:"$"},
    MS:{code:"XCD",name:"XCD",sym:"$"},MF:{code:"EUR",name:"Euro",sym:"€"},BL:{code:"EUR",name:"Euro",sym:"€"},PM:{code:"EUR",name:"Euro",sym:"€"},
    DM:{code:"XCD",name:"XCD",sym:"$"},GD:{code:"XCD",name:"XCD",sym:"$"},LC:{code:"XCD",name:"XCD",sym:"$"},VC:{code:"XCD",name:"XCD",sym:"$"},
    AG:{code:"XCD",name:"XCD",sym:"$"},KN:{code:"XCD",name:"XCD",sym:"$"},TT:{code:"TTD",name:"TTD",sym:"$"}
  };

  var CENTROIDS = {
    AF:[33.9,67.7],AL:[41.2,20.2],DZ:[28.0,2.6],AO:[-11.2,17.9],AR:[-38.4,-63.6],AM:[40.1,45.0],AU:[-25.3,133.8],AT:[47.5,14.6],
    AZ:[40.1,47.6],BS:[25.0,-77.4],BH:[26.0,50.6],BD:[23.7,90.4],BB:[13.2,-59.6],BY:[53.7,28.0],BE:[50.5,4.5],BZ:[17.2,-88.5],
    BJ:[9.3,2.3],BT:[27.5,90.4],BO:[-16.3,-63.6],BA:[44.2,17.9],BW:[-22.3,24.7],BR:[-14.2,-51.9],BN:[4.5,114.7],BG:[42.7,25.5],
    BF:[12.4,-1.6],BI:[-3.4,29.9],CV:[16.5,-23.0],KH:[12.6,104.9],CM:[3.8,11.5],CA:[56.1,-106.3],CF:[7.0,21.0],TD:[15.5,18.7],
    CL:[-35.7,-71.5],CN:[35.9,104.2],CO:[4.6,-74.3],KM:[-11.9,43.9],CG:[-0.2,15.8],CD:[-4.0,21.8],CR:[9.7,-83.8],HR:[45.1,15.2],
    CU:[22.0,-79.5],CY:[35.1,33.4],CZ:[49.8,15.5],DK:[56.3,9.5],DJ:[11.8,42.6],DO:[18.7,-70.2],EC:[-1.8,-78.2],EG:[26.8,30.8],
    SV:[13.8,-88.9],GQ:[1.7,10.3],ER:[15.2,39.8],EE:[58.6,25.0],ET:[9.1,40.5],FJ:[-17.7,178.1],FI:[64.0,26.0],FR:[46.2,2.2],
    GA:[-0.8,11.6],GM:[13.4,-15.3],GE:[42.3,43.4],DE:[51.2,10.5],GH:[7.9,-1.0],GR:[39.1,22.0],GL:[71.7,-42.6],GT:[15.8,-90.2],
    GN:[9.9,-11.4],GW:[12.0,-15.2],GY:[4.9,-58.9],HT:[18.9,-72.7],HN:[15.2,-86.2],HU:[47.2,19.5],IS:[65.0,-18.1],IN:[20.6,78.9],
    ID:[-0.8,113.9],IR:[32.4,53.7],IQ:[33.2,43.7],IE:[53.4,-8.2],IL:[31.0,35.0],IT:[42.8,12.8],JM:[18.1,-77.3],JP:[36.2,138.3],
    JO:[30.6,36.2],KZ:[48.1,66.9],KE:[0.0,37.9],KP:[40.3,127.5],KR:[36.0,128.0],KW:[29.3,47.5],KG:[41.2,74.8],LA:[19.9,102.5],
    LV:[56.9,24.6],LB:[33.9,35.9],LS:[-29.6,28.2],LR:[6.4,-9.4],LY:[26.3,17.2],LT:[56.0,24.0],LU:[49.8,6.1],MK:[41.6,21.7],
    MG:[-18.8,46.9],MW:[-13.3,34.3],MY:[4.2,108.0],MV:[3.2,73.2],ML:[17.6,-2.0],MT:[35.9,14.4],MR:[21.0,-10.9],MU:[-20.3,57.6],
    MX:[23.6,-102.6],MD:[47.4,28.4],MN:[46.9,103.8],ME:[42.9,19.4],MA:[31.8,-7.1],MZ:[-18.7,35.5],MM:[17.1,96.9],NA:[-22.9,18.5],
    NP:[28.4,84.1],NL:[52.1,5.3],NZ:[-40.9,174.9],NI:[12.9,-85.2],NE:[17.6,8.1],NG:[9.1,8.7],NO:[64.6,17.4],OM:[21.5,55.9],
    PK:[30.4,69.3],PA:[8.5,-80.8],PG:[-6.3,143.9],PY:[-23.4,-58.4],PE:[-9.2,-75.0],PH:[12.9,121.8],PL:[52.0,19.1],PT:[39.4,-8.2],
    QA:[25.4,51.2],RO:[45.9,24.9],RU:[61.5,105.3],RW:[-1.9,29.9],SA:[23.9,45.1],SN:[14.5,-14.5],RS:[44.0,21.0],SL:[8.5,-11.8],
    SG:[1.3,103.8],SK:[48.7,19.7],SI:[46.2,14.8],SB:[-9.6,160.2],SO:[6.0,46.2],ZA:[-29.0,25.1],SS:[7.9,29.7],ES:[40.5,-3.7],
    LK:[7.9,80.8],SD:[15.8,30.2],SR:[3.9,-56.0],SE:[62.2,17.6],CH:[47.0,8.2],SY:[35.0,38.0],TJ:[38.9,71.3],TZ:[-6.4,34.9],
    TH:[15.9,101.0],TG:[8.6,0.8],TN:[34.0,9.0],TR:[39.1,35.2],TM:[38.9,59.6],UG:[1.4,32.3],UA:[48.4,31.2],AE:[23.4,53.8],
    GB:[55.4,-3.4],UY:[-32.5,-55.8],UZ:[41.4,64.6],VU:[-15.4,166.9],VE:[6.4,-66.6],VN:[14.1,108.3],YE:[15.6,48.5],ZM:[-13.1,27.8],
    ZW:[-20.0,30.0],TW:[23.7,121.0],HK:[22.4,114.1],EH:[24.2,-12.9],GF:[4.0,-53.0],NC:[-20.9,165.6],PF:[-17.7,-149.4],KY:[19.3,-81.3],
    PR:[18.2,-66.6],CW:[12.2,-69.0],AW:[12.5,-70.0],GI:[36.1,-5.4],AD:[42.5,1.5],SM:[43.9,12.5],VA:[41.9,12.5],LI:[47.2,9.5],
    MC:[43.7,7.4],XK:[42.6,21.0],FO:[62.0,-7.0],FK:[-51.8,-59.5],BM:[32.3,-64.8],DM:[15.4,-61.4],GD:[12.1,-61.7],LC:[13.9,-60.9],
    VC:[12.9,-61.2],AG:[17.1,-61.8],KN:[17.3,-62.7],TT:[10.7,-61.2],MO:[22.2,113.5]
  };

  var US_STATE_CENTROIDS = {
    AL:[32.7,-86.7],AK:[64.2,-153.4],AZ:[34.3,-111.1],AR:[34.9,-92.4],CA:[37.2,-119.4],CO:[39.0,-105.5],CT:[41.6,-72.7],DE:[39.0,-75.5],
    FL:[28.6,-82.4],GA:[32.6,-83.4],HI:[20.3,-156.4],ID:[44.4,-114.6],IL:[40.0,-89.2],IN:[39.9,-86.3],IA:[42.1,-93.5],KS:[38.5,-98.4],
    KY:[37.5,-85.3],LA:[31.1,-91.8],ME:[45.4,-69.0],MD:[39.0,-76.8],MA:[42.3,-71.8],MI:[44.4,-85.4],MN:[46.4,-93.1],MS:[32.7,-89.7],
    MO:[38.3,-92.4],MT:[47.0,-110.5],NE:[41.5,-99.9],NV:[39.3,-116.6],NH:[43.7,-71.6],NJ:[40.1,-74.5],NM:[34.5,-106.2],NY:[42.9,-75.6],
    NC:[35.5,-79.4],ND:[47.5,-100.5],OH:[40.4,-82.8],OK:[35.6,-97.5],OR:[43.9,-120.6],PA:[40.6,-77.2],RI:[41.7,-71.5],SC:[33.9,-80.9],
    SD:[44.4,-100.2],TN:[35.9,-86.7],TX:[31.5,-99.3],UT:[39.3,-111.1],VT:[44.1,-72.7],VA:[37.5,-78.5],WA:[47.4,-120.7],WV:[38.6,-80.6],
    WI:[44.3,-89.8],WY:[43.0,-107.6],DC:[38.9,-77.0]
  };

  var US_STATE_NAMES = {};
  Object.keys(usMapData.state_specific).forEach(function(code){
    US_STATE_NAMES[code] = usMapData.state_specific[code].name;
  });

  var US_STATE_CODES = Object.keys(US_STATE_CENTROIDS).filter(function(code){
    return usMapData.state_specific[code] && usMapData.state_specific[code].hide !== "yes";
  });
  var MAP_VIEWBOX = { width:1000, height:507.209 };
  var CALENDAR = {
    startYear:2026,
    startMonthIndex:0,
    startDay:1,
    daysPerMonth:30,
    daysPerYear:360,
    monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"]
  };

  var BLOCS_TEMPLATE = [
    {id:"NA",name:"North America",flag:"🇺🇸",currency:"USD",symbol:"$",baseRate:1.0,rate:1.0,prevRate:1.0,color:"#1e3a5f",label:"#4a9edd",
      members:["US","CA","MX","GL","GT","BZ","HN","SV","NI","CR","PA","CU","JM","HT","DO","PR","TT","BS","BB","LC","GD","AG","VC","KN","DM","AI","MS","TC","VG","VI","KY","BM","GP","MQ","SX","MF","PM","BL","BQ","CW","AW","GF","FK"]},
    {id:"SA",name:"South America",flag:"🇧🇷",currency:"BRL",symbol:"R$",baseRate:5.0,rate:5.0,prevRate:5.0,color:"#1f2a0f",label:"#8bc34a",
      members:["BR","AR","CO","VE","CL","PE","EC","BO","PY","UY","GY","SR"]},
    {id:"EU",name:"Europe",flag:"🇪🇺",currency:"EUR",symbol:"€",baseRate:0.92,rate:0.92,prevRate:0.92,color:"#0f2a1a",label:"#4caf50",
      members:["DE","FR","GB","IT","ES","PL","RO","NL","BE","CZ","GR","PT","SE","HU","AT","CH","BY","UA","RS","BG","TR","DK","FI","SK","NO","HR","MD","BA","AL","LT","SI","MK","LV","EE","LU","ME","IS","IE","CY","GE","AM","AD","MT","SM","VA","LI","MC","XK","FO","AX","SJ","GI","IM","JE","GG"]},
    {id:"AF",name:"Africa & M.East",flag:"🇳🇬",currency:"NGN",symbol:"₦",baseRate:1580,rate:1580,prevRate:1580,color:"#1a2208",label:"#cddc39",
      members:["NG","ZA","EG","ET","KE","GH","TZ","UG","RW","SN","CI","CM","ML","BF","NE","TD","SD","SS","SO","MZ","ZM","ZW","MW","MG","AO","GA","CG","CD","CF","GN","SL","LR","GM","GW","BJ","TG","GQ","ER","DJ","BW","NA","LS","SZ","MA","DZ","TN","LY","EH","MR","SA","AE","IQ","IR","SY","YE","OM","JO","IL","PS","LB","KW","QA","PK","AF","AZ","KM","MU","SC","RE","YT","SH","ST","CV"]},
    {id:"AS",name:"Asia-Pacific",flag:"🇨🇳",currency:"CNY",symbol:"¥",baseRate:7.1,rate:7.1,prevRate:7.1,color:"#2a0f0f",label:"#ef5350",
      members:["CN","JP","KR","IN","ID","PH","VN","TH","MY","BD","NP","LK","BT","MM","KH","LA","TW","KP","MN","AU","NZ","PG","FJ","SB","VU","WS","TO","KI","TV","NR","PW","FM","MH","GU","AS","CK","NU","TK","PN","WF","NC","PF","CX","CC","HK","MO","SG","BN","TL","MP","UM","MV"]},
    {id:"RU",name:"Russia & C.Asia",flag:"🇷🇺",currency:"RUB",symbol:"₽",baseRate:88,rate:88,prevRate:88,color:"#1a0f2a",label:"#ab47bc",
      members:["RU","KZ","MN","UZ","TM","TJ","KG"]}
  ];

  var INDUSTRIES = ["Technology","Finance","Retail","Manufacturing","Real Estate","F&B","Healthcare","Media","Logistics","Energy"];
  var TRAITS = ["Visionary","Risk-taker","Conservative","Networker","Workaholic","Innovator","Strategist","Charismatic","Frugal","Ambitious"];
  var BIZ_SFX = ["Corp","Industries","Group","Holdings","Ventures","Labs","Capital","Works","Co","Ltd"];
  var NAMES = {
    NA:{
      male:["James","Michael","Robert","Noah","William","Daniel","Elijah","Benjamin","Henry","Mason"],
      female:["Emily","Sarah","Jennifer","Olivia","Ava","Sophia","Chloe","Grace","Hannah","Lily"],
      last:["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Moore"]
    },
    SA:{
      male:["Gabriel","Lucas","Pedro","Mateus","Rafael","Thiago","Diego","Bruno","Felipe","Nicolas"],
      female:["Ana","Juliana","Camila","Fernanda","Larissa","Marina","Isabela","Valentina","Daniela","Bianca"],
      last:["Silva","Santos","Oliveira","Souza","Rodrigues","Ferreira","Alves","Pereira","Lima","Gomes"]
    },
    EU:{
      male:["Luca","Matteo","Bjorn","Pierre","Hendrik","Andre","Tomas","Erik","Niklas","Adrien"],
      female:["Sofia","Elena","Ingrid","Amelie","Anna","Mila","Clara","Nora","Elsa","Freya"],
      last:["Muller","Rossi","Dubois","Hansen","Kowalski","Andersen","Ferreira","Kovac","Larsen","Bianchi"]
    },
    AF:{
      male:["Emeka","Chidi","Kwame","Kofi","Yusuf","Tunde","Jabari","Omar","Amir","Sefu"],
      female:["Ngozi","Adaeze","Amara","Fatima","Aisha","Zahra","Nia","Imani","Layla","Safiya"],
      last:["Okafor","Adeyemi","Mensah","Diallo","Nwosu","Okonkwo","Eze","Ibrahim","Musa","Lawal"]
    },
    AS:{
      male:["Wei","Haruto","Rohan","Jun-seo","Rin","Arjun","Kenji","Min-jun","Yash","Daichi"],
      female:["Fang","Yui","Priya","Sakura","Aanya","Mei","Jia","Nari","Aiko","Anika"],
      last:["Wang","Li","Sato","Suzuki","Patel","Sharma","Kim","Park","Tanaka","Gupta"]
    },
    RU:{
      male:["Dmitri","Alexei","Ivan","Mikhail","Pavel","Nikolai","Sergei","Yuri","Anton","Viktor"],
      female:["Natasha","Olga","Anya","Katya","Irina","Elena","Svetlana","Alina","Marina","Daria"],
      last:["Ivanov","Petrov","Sidorov","Volkov","Sokolov","Fedorov","Morozov","Kozlov","Lebedev","Novikov"]
    }
  };
  var NAME_POOLS = runtimeNameData.NAME_POOLS || {};
  var NAME_ORDER_COUNTRIES = runtimeNameData.NAME_ORDER_COUNTRIES || ["CN","HK","JP","KP","KR","MN","TW","VN"];

  function mergeWeightedPool(bucket, entries){
    (entries || []).forEach(function(entry){
      var name = entry && entry[0];
      var weight = entry && Number(entry[1]);

      if (!name || !weight) return;
      bucket[name] = (bucket[name] || 0) + weight;
    });
  }

  function collapseWeightedPool(bucket, limit){
    return Object.keys(bucket).map(function(name){
      return [name, bucket[name]];
    }).sort(function(first, second){
      return second[1] - first[1];
    }).slice(0, limit);
  }

  function buildBlocNamePools(){
    var pools = {};

    BLOCS_TEMPLATE.forEach(function(bloc){
      var male = {};
      var female = {};
      var surnames = {};

      bloc.members.forEach(function(iso){
        var pool = NAME_POOLS[iso];
        if (!pool) return;
        mergeWeightedPool(male, pool.male);
        mergeWeightedPool(female, pool.female);
        mergeWeightedPool(surnames, pool.surnames);
      });

      pools[bloc.id] = {
        male:collapseWeightedPool(male, 140),
        female:collapseWeightedPool(female, 140),
        surnames:collapseWeightedPool(surnames, 180)
      };
    });

    return pools;
  }

  var BLOC_NAME_POOLS = buildBlocNamePools();

  var STATUS_COLOR = {
    thriving:"#2ecc71",
    growing:"#3498db",
    struggling:"#f5a623",
    bankrupt:"#e74c3c",
    starting:"#00d4ff",
    retired:"#9fb6c8",
    deceased:"#5b6b7d"
  };

  function createBlocs(){
    return BLOCS_TEMPLATE.map(function(bloc){
      return Object.assign({}, bloc, { rateHistory:[], geoPressure:0, defaultRisk:0, gdp:0 });
    });
  }

  App.data = {
    CURRENCY_MAP:CURRENCY_MAP,
    CENTROIDS:CENTROIDS,
    US_STATE_CENTROIDS:US_STATE_CENTROIDS,
    US_STATE_NAMES:US_STATE_NAMES,
    US_STATE_CODES:US_STATE_CODES,
    MAP_VIEWBOX:MAP_VIEWBOX,
    CALENDAR:CALENDAR,
    INDUSTRIES:INDUSTRIES,
    TRAITS:TRAITS,
    BIZ_SFX:BIZ_SFX,
    NAMES:NAMES,
    NAME_POOLS:NAME_POOLS,
    BLOC_NAME_POOLS:BLOC_NAME_POOLS,
    NAME_ORDER_COUNTRIES:NAME_ORDER_COUNTRIES,
    STATUS_COLOR:STATUS_COLOR,
    TICK_MS:3000,
    createBlocs:createBlocs,
    usMapData:usMapData
  };
})(window);
