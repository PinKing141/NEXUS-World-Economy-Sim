# Legacy `sim.js` Function Inventory

This inventory supports ROADMAP Phase 1 architecture reset. It groups the legacy top-level functions in `src/js/app/sim.js` by likely domain ownership so future extractions can move one cohesive slice at a time while preserving behavior and save compatibility.

## Inventory Method

Generated from top-level `function` declarations in `src/js/app/sim.js` using:

```bash
python3 - <<'PY'
import re
from pathlib import Path
for i, line in enumerate(Path('src/js/app/sim.js').read_text().splitlines(), 1):
    m = re.match(r'  function ([A-Za-z0-9_]+)\(', line)
    if m:
        print(f'{i}:{m.group(1)}')
PY
```

The inventory is intentionally domain-oriented rather than alphabetical. Line numbers refer to the legacy file at the time this document was written and are a navigation aid, not a stable API contract.

## Core, Calendar, Configuration, RNG, and Orchestration

- `randomId` (614)
- `canUseStartPresetStorage` (628)
- `getStartPresetDefinitions` (640)
- `normalizeStartPresetId` (701)
- `getStartPreset` (708)
- `getCurrentStartPreset` (713)
- `getStartPresetList` (717)
- `setCalendarStartYear` (732)
- `getConfiguredStartYear` (738)
- `applyStartPresetToStore` (746)
- `getPendingStartPresetId` (755)
- `queuePendingStartPreset` (763)
- `clearPendingStartPreset` (771)
- `consumePendingStartPreset` (777)
- `currentSimYear` (786)
- `currentCalendarYear` (790)
- `currentYear` (794)
- `chanceForDays` (899)
- `pickWeightedValue` (905)
- `dailyRateFromAnnualChange` (1111)
- `hashString` (1130)
- `normalizeRandomSeed` (1143)
- `resolveProcessRandomSeed` (1154)
- `generateWorldSeed` (1164)
- `resolveConfiguredWorldSeed` (1175)
- `createSeededRandom` (1191)
- `installWorldRandom` (1215)
- `restoreWorldRandomFromStore` (1237)
- `syncStoredRandomState` (1252)
- `captureRandomState` (1268)
- `restoreRandomState` (1280)
- `seededPick` (1293)
- `floorInt` (1379)
- `getStatus` (5722)
- `rehydrateLoadedState` (13201)
- `prepareStoreForSnapshot` (13501)
- `initSim` (13520)
- `buildSimulationDomains` (15458)
- `createFallbackCoordinator` (15595)
- `buildSimulationCoordinator` (15659)
- `getSimulationCoordinator` (15689)
- `getEngineArchitecture` (15696)
- `runArchitectureSelfCheck` (15709)
- `runValidationTicks` (15740)
- `runAccurateMainTick` (17224)
- `fastForwardDays` (17228)
- `simTick` (17261)
- `loop` (17269)
- `start` (17282)

## Events, News, Telemetry, Validation, and Closure Gates

- `emitNews` (618)
- `recordTraitEffects` (5561)
- `setTraitSnapshot` (5578)
- `validateTraitMechanicalCoverage` (5583)
- `recordTradeTapeEntry` (7582)
- `emitGovernorIntervention` (5891)
- `recordLaunchWindow` (5903)
- `markYearlyEvents` (13164)
- `randomEvent` (13586)
- `pushEconomicHistory` (14682)
- `safeCorrelation` (14691)
- `median` (14716)
- `cloneJsonSafe` (14724)
- `createYearlyEventCountsBucket` (14732)
- `cloneYearlyEventCountsBucket` (14747)
- `ensureYearlyTuningTelemetryState` (14757)
- `isDebtStressWarningEvent` (14791)
- `getYearlyEventMetricKey` (14801)
- `getEventBlocIds` (14817)
- `buildYearlyEventCounts` (14830)
- `buildSubsetMacroSnapshot` (14858)
- `normalizeTelemetryValue` (14958)
- `buildYearlyTuningCsvRow` (14965)
- `captureYearlyTuningTelemetry` (15039)
- `getYearlyTuningTelemetry` (15107)
- `getYearlyTuningCsvExport` (15111)
- `getMacroSnapshot` (15150)
- `normalizeValidationProfilesForScenario` (15244)
- `makeGate` (15759)
- `evaluateTier1ClosureGates` (15768)
- `runScenarioGate` (15945)
- `getScenarioPresetDefinitions` (15987)
- `getScenarioPresetList` (16253)
- `runScenarioPreset` (16267)
- `runAllScenarioPresets` (16298)
- `getValidationCompensation` (16316)
- `evaluateTier2ClosureGates` (16335)
- `evaluateTier3ClosureGates` (16572)
- `evaluateTier4ClosureGates` (16869)
- `evaluateHardFailures` (17108)
- `runClosureGateSuite` (17125)

## Shared Country, Geography, Demand, and Profile Helpers

- `ensureCountryProfile` (1741)
- `normalizeUSStateCode` (1884)
- `normalizeSubdivisionForStorage` (1906)
- `normalizeSubdivisionForLookup` (1914)
- `getCountryCityPool` (1924)
- `getCountryCityDetailsPool` (1936)
- `getCitySelectionWeight` (1950)
- `pickCountryCity` (1965)
- `resolveSubdivisionForCity` (2029)
- `setPersonSubdivisionFields` (2037)
- `ensurePersonCityData` (2045)
- `refreshCountryProfileDerived` (2813)
- `getAllTrackedIndustries` (2988)
- `normalizeIndustryMetricMap` (2992)
- `ensureCountryIndustryMarketState` (3002)
- `getCountryIndustryPriceMultiplier` (3013)
- `getCountryIndustryAllocationRatio` (3018)
- `getBusinessMarketAllocationSignal` (3023)
- `normalizeConsumerIndustryDemandWeights` (3061)
- `getHouseholdConsumerSpendingSignals` (3084)
- `buildCountryConsumerSpendingSignals` (3134)
- `buildCountryHousingMarketSignals` (3170)
- `getCountryIndustryDemandMultiplier` (3219)
- `getBlocIndustryDemandMultiplier` (3233)
- `bootstrapCountryProfiles` (4256)
- `updateCountryLaborSupplyBaseline` (4278)
- `updateCountryConsumptionAndHousingSignals` (4294)
- `validateCountryProfiles` (5055)
- `normalizeIso` (5170)
- `isNonResidentialIso` (5185)
- `remapUnsupportedResidencyIso` (5189)
- `sanitizeUnsupportedResidencyState` (5226)
- `isResidencyEligibleCountry` (5325)
- `getCountrySelectionSignals` (5341)
- `buildCountryPresenceMeta` (5358)
- `getCountryDiversificationMultiplier` (5395)
- `pickWeightedCountryFromCandidates` (5418)
- `pickCountryByPopulationPressure` (5466)

## Business and Markets

- Business extraction should start with wrapper-backed functions already mirrored in `sim-business` before moving legacy implementations.
- Representative ownership includes naming/logo helpers, lifecycle, founders, listings, staffing, leadership, firm decisions, launches, succession, M&A, bankruptcy, trade shock transmission, and stock-market ticks.
- Key legacy ranges: naming and bootstrap (`1297`-`1734`), business creation and listing (`7371`-`8021`), leadership/staffing/decision systems (`8033`-`10285`), launch/succession/bankruptcy legacy systems (`12055`-`12599`), business ticks and deals (`13777`-`14511`).

## Labour

- `getLaborScarcityFromLaborPool` (3845)
- `getCountryLaborScarcity` (3851)
- `getSimCountryLaborSnapshot` (3866)
- `getCountryLongUnemploymentShare` (3886)
- `getCountryWagePressure` (3906)
- `getIndustryLaborDemandPressure` (3911)
- `pullMobileLaborIntoCountry` (3930)
- `applyInternalMigrationUrbanFlows` (4029)
- `applyLaborMarketYearlyAdjustments` (4104)
- `reserveLabor` (5078)
- `releaseLabor` (5109)
- `assignEmployment` (8198)
- `clearEmployment` (8285)
- `syncAllPeople` (15253)
- `createFallbackLabourEngine` (15379)

## Finance, Household Economy, and Assets

- `enforceFinancialBounds` (4187)
- `getCountryDemandCapacityGU` (5123)
- `getBlocDemandCapacityGU` (5129)
- `getBusinessDemandCapacityGU` (5135)
- `getDemandCapPenalty` (5150)
- `getNetWorthCarryRateAnnual` (5160)
- `updateBlocGdp` (5737)
- `updateForex` (5748)
- `ensureStockMarketState` (7498)
- `getListingMarketCapGU` (7578)
- `processListingPriceMarkToMarket` (7813)
- `processDividendCycle` (7864)
- `processTradingCycle` (7937)
- `processStockMarketTick` (8021)
- `ensureBlocCentralBankState` (9222)
- `getBlocPolicyRate` (9234)
- `processYearlyCentralBankPolicy` (9241)
- `normalizeHouseholdAssetClasses` (10407)
- `getHouseholdActualPublicEquityExposureGU` (10440)
- `getHouseholdActualPrivateBusinessExposureGU` (10450)
- `getHouseholdActualDividendIncomeAnnualGU` (10467)
- `processYearlyHouseholdAssetClasses` (10477)
- `processYearlyPhilanthropyAndLegacy` (10610)
- `estimateHouseholdLiquidityTargetGU` (11011)
- `calibrateInitialHouseholdLiquidity` (11026)
- `applyHouseholdWealthDrift` (11047)
- `processHouseholdTick` (11184)
- `getPersonFinancialStress` (11214)
- `relieveHouseholdDebt` (11228)
- `reserveDependentSupport` (11237)
- `drawHouseholdAssetTransfer` (11250)
- `allocateHouseholdAssetTransfer` (11292)
- `grantInheritanceTransfer` (11337)
- `createFallbackFinanceEngine` (15394)

## Demographics, Households, Family, Education, and Life Course

- Education functions: `getEducationAttainment` through `applySkillFormationYearly` (`1760`-`2714`).
- Household and family functions: `linkSpouses` through `seedHousehold` (`10289`-`11460`).
- Lifecycle functions: marriages, births, deaths, senior transitions, yearly aging, family transitions, and lifecycle runner (`11460`-`13170`).
- Migration pressure and population profile functions: `phase2BirthDeathPressure` (4651), `phase3MigrationPressure` (4781), `updatePopulationProfilesYearly` (5044), relocation and arrival helpers (`6156`-`6562`).
- `createFallbackDemographicsEngine` (15414)

## Society, Inequality, Traits, Reputation, and Social Networks

- `householdClassRank` (1120)
- `uniqueTraits` (1124)
- `updateInequalityMetricsYearly` (3598)
- `phase6SocialUnrestFromInequality` (3714)
- `phase4InequalityInstitutionFeedback` (4963)
- Trait and decision-profile helpers (`5483`-`5715`).
- Social/family-network helpers (`6650`-`7201`, `11615`-`11872`).
- `runSocietyRefresh` (15434)
- `runValidationRefresh` (15436)
- `createFallbackSocietyEngine` (15427)

## Geopolitics, Blocs, Governors, Sanctions, and Trade-War Pressure

- `normalizePolicyStance` (3248)
- `shiftPolicyStance` (3252)
- `isTier6Slice1Enabled` (3265)
- `getTier6Slice1Config` (3269)
- `getTier6ElectionChannelEffects` (3273)
- `getSanctionLaneKey` (3290)
- `ensureTier6SanctionLanes` (3294)
- `getSanctionLane` (3299)
- `getBilateralSanctionDealBlock` (3323)
- `getCountrySanctionExposure` (3333)
- `processTier6ConstrainedSliceYearly` (3369)
- `deriveCountryPolicyStance` (3373)
- `refreshCountryPolicyStance` (3399)
- `getBlocPolicySnapshot` (3450)
- `deriveBlocPolicyStance` (3492)
- `refreshBlocPolicyStance` (3543)
- Debt crisis and warning helpers (`928`-`1107`).
- Governor signal and intervention helpers (`5778`-`6380`).
- Trade exposure and shock helpers (`9057`-`9176`).
- `createFallbackGeopoliticsEngine` (15438)

## Immediate Extraction Notes

1. Keep `sim-core` as the only coordinator and continue routing through domain adapters until legacy implementations are extracted.
2. Prefer moving pure helpers first: seed utilities, demand-cap helpers, country normalization helpers, and telemetry bucket helpers.
3. Do not move legacy functions that mutate people, households, firms, listings, or country profiles without before/after regression coverage.
4. Update this inventory whenever a cohesive function group leaves `sim.js`.
