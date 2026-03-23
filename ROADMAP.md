# NEXUS Deep Systems Roadmap

This roadmap assumes NEXUS is not a player-driven strategy game.
The goal is an observational simulation of business, family life, personality, social mobility, and world conditions.
Everything below is aimed at making outcomes emerge from systems rather than player input.

## Core Direction

- [ ] Keep the simulation autonomous. No policy buttons, no direct player control, no god powers.
- [ ] Make outcomes explainable. Every major life, business, and geopolitical event should have visible reasons.
- [ ] Reduce "pure randomness" over time. More events should emerge from conditions, incentives, and relationships.
- [ ] Connect all major layers: people -> households -> firms -> industries -> countries -> blocs -> world events.
- [ ] Make history persistent. The world should feel like it remembers what happened.

## Start Here

These are the highest-impact additions because they connect systems that currently feel parallel.

- [x] Corporate ladders (v1 leadership roster shipped)
  - Named executives and key staff are now real citizens while the remaining workforce stays aggregated as headcount.
  - Each named leader now tracks employer, role, department, tier, and salary.
  - Businesses now seed and maintain leadership rosters through launches, succession, retirement, death, and liquidation.
  - Companies are now directly inspectable with leadership, owner, founder, CEO, and staffing detail.
  - A future pass can extend this from leadership-backed rosters to full workforce simulation.
- [x] Expanded decision model (business v1 shipped)
  - Add personality dimensions beyond traits: risk tolerance, greed, patience, discipline, loyalty, status-seeking, family attachment, adaptability, ethics.
  - Add temporary states: grief, burnout, confidence, stress, illness, resentment, ambition spikes.
  - Business v1 now uses those variables for succession, hiring, layoffs, expansion posture, cash preservation, and scandal response.
- [ ] Household economy
  - Track wages, spending, savings, debt, housing cost, childcare burden, and inheritance pressure.
  - Let household finances shape life outcomes, not just founder net worth.
  - Make class mobility possible but uneven across countries and families.
- [ ] Education and development
  - Add childhood development, education quality, attainment, and skill formation.
  - Let wealthy families and strong institutions improve access to education.
  - Let education influence employability, leadership potential, and founder odds.

## Tier 1 - Deepen Existing Systems

These extend what already exists in the sim and should feel natural immediately.

- [ ] Inheritance disputes
  - If multiple children are viable heirs and no clear successor exists, trigger disputes.
  - Model favoritism, eldest-child bias, competence bias, and sibling rivalry.
  - Give losing heirs resentment, distance from family, or rival-founder arcs.
- [ ] Company reputation
  - Add a 0-100 reputation score per business.
  - Reputation should affect hiring ease, deal flow, customer trust, pricing power, and resilience during scandal.
  - Build reputation slowly through stability and erode it quickly through scandal, layoffs, corruption, or poor succession.
- [ ] Real family formation
  - Expand marriage logic beyond age and proximity.
  - Include class, religion or culture proxy, ambition compatibility, shared traits, fertility preference, and status motives.
  - Add divorce, estrangement, second marriages, stepfamilies, and illegitimate inheritance complications.
- [ ] Better births and child outcomes
  - Make fertility depend on age, wealth, local norms, education, housing costs, health, and marital stability.
  - Let parental traits and household conditions influence children.
  - Add sibling effects: rivalry, inheritance dilution, shared privilege, family businesses grooming one child over others.
- [ ] Retirement paths
  - Differentiate graceful retirement, forced retirement, decline, illness retirement, and prestige-chairman style retirement.
  - Let retired founders remain influential through advice, board roles, patronage, or family pressure.
- [ ] Richer deaths and estates
  - Split estates between spouse, children, taxes, debt obligations, and businesses.
  - Allow debt-ridden dynasties to collapse after the founder dies.
  - Add contested wills, hidden heirs, and business fragmentation.
- [ ] Social influence networks
  - Add mentors, rivals, close friends, elite circles, school ties, and nepotism chains.
  - Let opportunities flow through social proximity as much as through merit.
- [ ] Personal reputation
  - Track trustworthiness, prestige, notoriety, and scandal memory for each person.
  - Let personal reputation shape hiring, marriage, investment access, and succession.

## Tier 2 - Jobs, Skills, and Class Structure

- [ ] Worker lifecycle
  - Child -> student -> worker -> manager -> executive -> founder -> retiree should all be possible paths.
  - Not every wealthy person should become a founder.
  - Most people should live as workers, managers, professionals, or dependents.
- [ ] Occupations
  - Add occupational categories: factory worker, engineer, accountant, sales, operator, executive, owner, investor, unemployed.
  - Let industries demand different occupation mixes.
- [ ] Skills
  - Track management skill, technical skill, social skill, financial discipline, and creativity.
  - Improve skills through education, work experience, and mentorship.
  - Allow skill decline from age, burnout, or long unemployment.
- [ ] Wages and labor markets
  - Set wages by occupation, country, industry demand, firm reputation, and labor scarcity.
  - Add unemployment duration, wage pressure, labor mobility, and talent shortages.
- [ ] Promotions and poaching
  - Firms should promote strong insiders and poach high-value staff from rivals.
  - High-reputation firms should attract better talent.
- [ ] Unionization and labor unrest
  - Add strike risk when wages lag, inequality spikes, or layoffs pile up.
  - Let labor unrest reduce output and damage reputation.
- [ ] Elite reproduction
  - Wealthy dynasties should reproduce privilege through education, networks, and asset ownership.
  - But leave room for outsider rises and elite decay.

## Tier 3 - Business and Corporate Depth

- [ ] Real firm structure
  - Track departments, management quality, wage bill, operating costs, and hiring needs.
  - Separate founder quality from firm quality so a great firm can outlive a mediocre heir.
- [ ] Industry-specific behavior
  - Make each industry operate differently.
  - Technology: high variance, talent-sensitive, scalable.
  - Finance: confidence-sensitive, crisis-prone, leverage-heavy.
  - Retail: margin-thin, labor-heavy, reputation-sensitive.
  - Manufacturing: supply chain and energy dependent.
  - Real estate: credit and rate sensitive.
  - Healthcare: labor and regulation heavy.
  - Media: reputation and narrative sensitive.
  - Logistics: trade and fuel sensitive.
  - Energy: geopolitical and commodity sensitive.
  - Food and beverage: household-demand and logistics sensitive.
- [ ] Supply chains
  - Give industries upstream dependencies and downstream customers.
  - Let tariffs, wars, sanctions, and shortages cascade through linked sectors.
- [ ] Debt and credit
  - Let firms borrow to expand.
  - Track leverage, interest expense, debt maturity, rollover risk, and founder guarantees.
  - Make downturns much deadlier for over-leveraged firms.
- [ ] Central banks
  - Give each bloc an interest rate and inflation pressure.
  - Let rate changes react to GDP trend, inflation, unemployment, and crises.
  - Make rates affect lending, hiring, valuation, housing, and startup formation.
- [ ] Stock market
  - Allow established firms to go public.
  - Let citizens own shares, collect dividends, speculate, and diversify.
  - Let retired or non-founder elites stay economically relevant through financial ownership.
- [ ] Mergers and acquisitions
  - Allow strong firms to acquire weak competitors or suppliers.
  - Let family dynasties consolidate sectors over generations.
- [ ] Board and governance systems
  - Add boards, family control, outside investors, founder control decay, and succession politics.
- [ ] Bankruptcy stages
  - Distinguish distress, restructuring, fire sale, bailout, and liquidation.
  - Let creditors take assets and employees scatter.
- [ ] Innovation and copying
  - Add R&D, imitation, technology diffusion, and first-mover advantage decay.
- [ ] Reputation and customer behavior
  - Demand should respond to quality, trust, scandal, price, and brand history.

## Tier 4 - Finance, Wealth, and Inequality

- [ ] Asset classes
  - Separate cash, equity, business ownership, property, debt obligations, and inherited trusts.
- [ ] Wealth transmission
  - Rich families should compound through ownership, not only founder income.
- [ ] Consumer spending
  - Households should consume by income class and local cost of living.
  - Demand shocks should hit sectors differently.
- [ ] Property and housing
  - Add rent, home ownership, commercial property, and housing bubbles.
  - Housing pressure should affect migration, fertility, and savings.
- [ ] Inequality metrics
  - Add Gini per bloc, top 1 percent share, median household wealth, and intergenerational mobility.
- [ ] Social unrest from inequality
  - High inequality should raise strike risk, populism, crime proxy, emigration, and institutional instability.
- [ ] Philanthropy and legacy
  - Old wealthy dynasties may fund schools, hospitals, or prestige projects, improving local conditions while boosting reputation.

## Tier 5 - Countries, Institutions, and Geography

- [ ] Use country population data for weighting
  - Replace hardcoded country importance where appropriate with population- and institution-aware weights.
- [ ] Add country development profiles
  - Track education quality, corruption, infrastructure, labor cost, social mobility, fertility norms, and business friendliness.
- [ ] Institutional quality
  - Strong institutions should improve contract reliability, investment confidence, and firm survival.
  - Weak institutions should increase corruption, volatility, and dynastic concentration.
- [ ] Internal regional detail
  - Expand beyond the current US state layer into provinces, states, or key subdivisions for other large countries.
  - Use existing subdivision data where available.
- [ ] Migration
  - Add internal and cross-border migration for jobs, safety, education, marriage, and status.
  - Brain drain and talent clustering should emerge naturally.
- [ ] Urban gravity
  - Major cities or economic centers should attract firms, skilled workers, and wealth.
- [ ] Infrastructure
  - Weak infrastructure should lower productivity, raise logistics cost, and reduce educational access.
- [ ] Natural resources
  - Resource-rich countries should have energy or commodities advantages, plus volatility and rent-seeking risks.
- [ ] Demographics
  - Track aging populations, youth bulges, labor force pressure, and fertility decline.

## Tier 6 - Politics, Geopolitics, and World History

- [ ] Elections
  - Hold elections in democratic blocs on a schedule.
  - Let outcomes influence tax, trade, labor, immigration, and business confidence.
- [ ] Sanctions
  - Block trade, finance, and deal flow between targeted blocs.
  - Force firms and countries to reroute supply chains over time.
- [ ] Expanded trade wars
  - Move beyond simple pressure spikes into targeted sector pain and retaliation loops.
- [ ] Wars and conflicts
  - Add full-scale wars, civil conflicts, insurgencies, and occupation or ceasefire phases.
  - Drafting, destruction, refugee flows, sanctions, and postwar debt should all matter.
- [ ] Treaty and peace outcomes
  - After wars, apply reparations, reconstruction, debt, demographic scars, and geopolitical realignment.
- [ ] Colonial history mode
  - Optional historical start with different GDP hierarchy, development paths, and scripted century-defining shocks.
- [ ] Commodity shocks
  - Oil shocks, food shocks, shipping disruptions, and financial crises should hit globally.
- [ ] Disaster systems
  - Pandemics, earthquakes, floods, droughts, and industrial disasters should reshape migration, productivity, and mortality.
- [ ] Institutional drift
  - Countries should improve or decay over time, not stay fixed forever.

## Tier 7 - Endogenous Event Engine

- [ ] Replace more random events with condition-driven ones.
- [ ] Add event prerequisites, buildup meters, and aftereffects.
- [ ] Make events remember history.
  - Repeated scandals should permanently weaken trust.
  - Repeated defaults should make capital flee.
  - Repeated wars should scar demographics and investment.
- [ ] Add cause chains
  - Example: energy shock -> inflation -> rate hikes -> layoffs -> populism -> tariffs -> recession.
- [ ] Add event rarity and signature
  - Some runs should develop differently because the world finds a distinct path, not because of arbitrary dice rolls.

## Tier 8 - Observational and Storytelling Tools

These are crucial because the user is watching, not controlling.

- [ ] Family tree viewer
  - Visual lineage browser for parents, spouses, children, grandchildren, heirs, and branch splits.
- [ ] Historical timeline
  - Full chronicle of births, marriages, deaths, firm launches, bankruptcies, IPOs, elections, wars, sanctions, and scandals.
- [ ] Follow this person
  - Pin one citizen and keep their story visible as the world updates.
- [ ] Follow this dynasty
  - Track one family over generations.
- [ ] Follow this company
  - Watch leadership, hiring, scandals, debt, and ownership change over time.
- [ ] Explainability panels
  - "Why did this happen?" for promotions, business launches, bankruptcies, marriages, births, and succession outcomes.
- [ ] Country and bloc diagnostics
  - Show top employers, biggest dynasties, unemployment, median wealth, reputation leaders, migration in or out, and inequality.
- [ ] Heatmap modes
  - GDP per capita
  - inequality
  - unemployment
  - population density
  - business concentration
  - conflict risk
  - migration flows
- [ ] Relationship overlays
  - Show family networks, business ownership webs, trade links, and rivalries.
- [ ] News categorization
  - Distinguish structural events from gossip-like human events.
  - Let the feed surface both macro history and intimate story beats.

## Tier 9 - Historical Memory and World Persistence

- [ ] Simulation save and load
  - Preserve long-running worlds.
- [ ] Deterministic seeds
  - Same seed should reproduce the same broad history for debugging and comparison.
- [ ] Scenario presets
  - Modern sandbox
  - historical century mode
  - post-crisis world
  - emerging-markets-heavy world
- [ ] Snapshot and replay
  - Save yearly snapshots and compare world states.
- [ ] Era summaries
  - Generate "The 2030s were defined by..." style summaries from event history.

## Tier 10 - Model Quality, Performance, and Developer Tools

- [ ] Simulation balancing tools
  - Inspect average firm lifespan, dynasty survival, mobility rates, inequality levels, and unemployment.
- [ ] Debug overlays
  - View hidden values like stress, education, reputation, leverage, and institutional quality.
- [ ] Profiling and scale testing
  - Make sure deeper systems still run well with much larger populations.
- [ ] Serialization format
  - Design a stable save schema before systems explode in complexity.
- [ ] Tests for simulation invariants
  - No duplicate family links.
  - No impossible ages.
  - No dead people staying employed unless intentionally modeled.
  - No orphaned business owners without ownership resolution.
- [ ] Event audit logging
  - Store event causes, not just event text.

## Concrete Backlog by Build Order

If you want a realistic implementation order, build in this sequence:

- [ ] Build 1: Corporate ladders + unemployment + wages + hiring
- [ ] Build 2: Education + skills + worker-to-founder pipeline
- [ ] Build 3: Household budgets + class mobility + fertility pressure
- [ ] Build 4: Inheritance disputes + family politics + personal reputation
- [ ] Build 5: Company reputation + industry-specific behavior
- [ ] Build 6: Supply chains + debt + credit + bankruptcy stages
- [ ] Build 7: Central banks + inflation + rates + housing sensitivity
- [ ] Build 8: Stock market + outside investors + M&A
- [ ] Build 9: Country institutions + migration + regional detail
- [ ] Build 10: Elections + sanctions + wars + treaty outcomes
- [ ] Build 11: Explainability layer + family tree + timeline + follow modes
- [ ] Build 12: Save/load + seeds + replay + scenario presets

## Most Important Single Addition

- [x] Corporate ladders (v1 leadership roster shipped)
  - This first pass closes the gap between people and firms by making named leaders part of the citizen simulation.
  - A later pass can deepen this further by converting the wider employee base into fully simulated workers.
