# Tier 6 Core-Loop Attachment Matrix

## Rule

Every Tier 6 mechanic must explicitly map to core loop channels.

| Mechanic | Labor | Production | Income | Consumption/Demand | Prices/Allocation | Firm Decisions | Employment Feedback | Evidence Fields |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elections | policy stance changes labor demand bias | indirect via staffing/capacity | wage/profit pressure via stance | demand confidence shifts | policy-induced allocation pressure | expansion vs preserve cash posture | hiring/layoff bias changes | countryPolicyStance, blocPolicyStance, laborScarcityIndex |
| Sanctions | labor demand falls in constrained sectors | supply access and throughput reduced | wage and profit compression | household purchasing power weakens | import/supply cost pressure rises | reroute, defer capex, staffing cuts | unemployment and mobility pressure rises | tradeShockIndex, supplyStressIndex, migrationPressure |
| Trade-war expansion (later slice) | sector labor reallocation | sector bottlenecks | sector income divergence | sector demand substitution | retaliation price pressure | sector pivot decisions | sector hiring divergence | sectorDemandWeights, rerouteRelief, strikeRiskIndex |

## Validation Questions

- Does this mechanic change at least two loop channels directly?
- Is there at least one upward and one downward feedback path?
- Are evidence fields available for inspector and closure diagnostics?
- Can the mechanic be disabled without breaking baseline behavior?
