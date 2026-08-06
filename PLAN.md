# Switchyard — Grid-Aware Multi-Tenant EV Fleet Charging

**Solution plan v2** — merged from the original plan plus two external reviews.
Codename is a placeholder; rename freely.

Changelog vs v1: added ACN-Data benchmark harness, carbon objective term, fault detection,
analytics, arrival-pattern prior. Corrected the fallback design to be protocol-native at
Tier 0. Clarified duals-vs-reason-codes as two layers, not two options. Everything else
survived review.

---

## 0. Thesis

> Every competitor treats site power as a **budget to divide**.
> We treat it as a **contracted, auditable entitlement** — every tenant gets a guaranteed
> floor, competes fairly for the surplus, and can ask any charger *why* it's at the power
> it's at and get a true answer.

Ampcontrol and ChargePoint already do dynamic load management well — for a **single**
operator. What nobody ships is multi-tenant fairness with per-tenant guarantees and
explainable allocation. That is the wedge.

---

## 1. Design principles

Four rules that decide every ambiguous call downstream.

### P1 — Only physical constraints are hard

The single most important structural rule. An infeasible solve is the failure mode that
kills demos and, in production, drops the site to a dumb fallback at exactly the moment
optimization matters most.

| Hard (violating these breaks something physical) | Soft (penalized in the objective) |
|---|---|
| `Σ p ≤ C_site − L_base` | tenant entitlement floors → slack `s[k]` |
| per-phase caps `C_φ` | departure deadlines → shortfall `short[i]` |
| `p_min·y ≤ p ≤ p_max·y` | carbon target |
| circuit/panel caps | fairness floor |

The model must be feasible by construction: with all `y[i] = 0` every hard constraint holds,
so a solution always exists. Degrade visibly, never fail.

### P2 — Compute in math, communicate in sentences

The optimizer computes shadow prices. The UI renders reason codes. These are two layers,
not two competing options — hand-written reason codes are `if/else` that will eventually
disagree with what the solver actually did, i.e. an explanation that is occasionally a lie.
Derive the sentence from the binding constraint.

Role-dependent exposure:
- **Driver:** sentences only. Never a number, never the word "constraint."
- **Fleet manager:** sentences + which of their vehicles yielded to which.
- **Site admin:** the actual `λ_site` in ₹/kW — that number *is* the business case for a
  transformer upgrade.

### P3 — Safety lives in the protocol, not the application

Where OCPP already guarantees something, use it rather than re-implementing it. The
charger enforcing its own cached limit is a stronger and more verifiable claim than any
application-level watchdog.

### P4 — Allocate against measurement, not nameplate

A van at 85% SoC tapers to 6 kW against a 22 kW allocation. Allocating from ratings strands
capacity — on a busy site, a quarter of it. Every allocation reads `MeterValues`, and
allocation is a **ceiling**, not a target.

---

## 2. The four differentiators

### D1 — Entitlement + spillover

Each tenant holds a contracted floor `F_k`, with `Σ F_k ≤ C_site`. The remainder is a
surplus pool distributed by urgency-weighted bidding.

```
Site 100 kW
├─ Tenant A guaranteed   30 kW      ← never dropped below this without visible slack
├─ Tenant B guaranteed   25 kW
├─ Tenant C guaranteed   20 kW
└─ Surplus pool          25 kW      ← contested, allocated by urgency
```

Per-**tenant** floors, deliberately, not per-session equal split. `capacity / active_sessions`
sounds fair and isn't: it lets a tenant with 20 vans crowd out a tenant with 3 who pays the
same retainer. The floor is a commercial contract, which is the thing tenants actually buy.

Unused entitlement flows to the pool and earns a **release credit** at billing. That makes
the Future-Scope "marketplace for trading unused allocation" a v1 side-effect rather than a
v2 feature, and it makes billing `energy + peak − credits` instead of `kWh × rate`.

### D2 — Explainable allocation

The LP relaxation yields duals for free, and those duals *are* the explanation:

| Dual | Internal meaning | Driver sees | Admin sees |
|---|---|---|---|
| `λ_site` | marginal value of +1 kW site capacity | "The site is at its electrical limit" | `₹18/kW` |
| `λ_phase[φ]` | per-phase congestion | *(hidden)* | "Phase L2 saturated — chargers 3, 7" |
| `λ_entitlement[k]` | tenant floor binding | "Another tenant's guaranteed power is protected" | which tenant, how much |
| reduced cost on `p[i]` | urgency gap to the margin | "Three vehicles leave sooner than you" | ranked queue |

Store `binding_constraint`, `shadow_price`, and `reason_text` on every allocation row, so
"why?" is answerable for any session at any past timestamp. Audit trail for billing
disputes; ~40 lines once the solver runs.

### D3 — Charge promises

At plug-in, run feasibility and **issue a promise**: *"82% by 06:00, confidence high."*
Re-validate every cycle. When one breaks, don't warn — **renegotiate**:

1. Push departure to 06:40 → promise restored
2. Accept 71% → range check says the route still works
3. Spend 12 release-credits to buy surplus priority

And before notifying anyone, the optimizer first tries **borrowing from an idle
low-priority session in the same tenant** — silent recovery beats a notification. Only
escalate to the driver if borrowing isn't enough.

### D4 — Three-tier fail-safe

Three tiers because there are three distinct failures, and Tier 0 alone doesn't cover the
common one (solver down, gateway healthy).

```
Tier 2  cloud MILP        full objective                              ~200ms   [normal]
   ↓ solver >500ms, unhealthy, or DB unreachable
Tier 1  gateway greedy    water-filling by weight, in-process, no DB  ~1ms     [degraded]
   ↓ gateway process or network to site lost
Tier 0  charger-resident  cached TxDefaultProfile                     offline  [safe]
```

**Tier 0 must be conservative and static.** Writing the live optimized allocation through
as `TxDefaultProfile` is *unsafe*: that value was computed for one site state, so if the
backend dies and three more vans plug in, each inherits its charger's cached default and
the sum breaches the cap. Correct construction uses stack levels:

```
stackLevel 0   TxDefaultProfile   C_site / n_chargers   written once at BootNotification, never updated
stackLevel 1   TxProfile          live allocation       duration = 2 × cycle  → expires down to level 0
```

The trap that makes this work: **never omit `duration` on the highest stack level.** Per
the spec, a profile without one means the charge point *never* falls back — a missed cycle
would leave the last allocation in force indefinitely instead of failing safe.

With this, the claim is true and verifiable: *"there is no single point of failure for safe
charging, because the last-known-safe limit is enforced by the charger itself."*

---

## 3. The allocation engine

Two stages. A controller that sees only the present instant **cannot** minimize a monthly
15-minute peak — it has no horizon to shift load into. Since demand charges are the
headline business benefit (68–81% of DCFC operating cost), the planner is not optional.

### Stage A — Planner (LP, every 5–15 min, 12 h horizon in 15-min buckets)

```
variables   e[i,t] ≥ 0        energy (kWh) to session i in bucket t
            D_peak ≥ 0        highest site draw over the horizon
            short[i] ≥ 0      unmet energy at departure

minimize    Σ_t π[t] · Σ_i e[i,t]                     energy cost, time-of-use
          + β · D_peak                                 demand charge      ← the money
          + λ_carbon · Σ_t c[t] · Σ_i e[i,t]           carbon intensity
          + Σ_i γ_i · short[i]                         deadline shortfall

s.t.        Σ_t e[i,t] + short[i] ≥ E_needed[i]
            e[i,t] = 0                    for t ∉ [arrive_i, depart_i]
            e[i,t] ≤ p_max[i] · Δt
            Σ_i e[i,t]/Δt ≤ C_site − L_base[t]
            Σ_i e[i,t]/Δt ≤ D_peak        ∀t                              peak tracker
```

Pure LP, no binaries — min-current is relaxed here and enforced by Stage B. Output is a
per-session energy budget `E_target[i]` for the next control window.

`L_base[t]` is forecast from **historical arrival patterns** — a per-site, per-weekday
rolling average of measured base load and plug-in times. Honest and genuinely useful as a
planner prior; do not call it AI.

`c[t]` is a **pre-fetched static carbon curve** written into the tariff table, not a live
Electricity Maps / WattTime call. Same objective term, same demo toggle, zero network
dependency on stage. Swapping in the live API later is a one-function change.

### Stage B — Controller (MILP, every 30–60 s, single timestep)

```
variables   p[i] ≥ 0          kW allocated
            y[i] ∈ {0,1}      charging on/off
            z[i] ≥ 0          switch indicator, linearised |y[i] − y_prev[i]|
            s[k] ≥ 0          entitlement shortfall slack

maximize    Σ_i u[i] · p[i]                urgency-weighted throughput
          − π_now · Σ_i p[i]               energy cost now
          − λ_carbon · c_now · Σ_i p[i]    carbon now
          − M · Σ_k s[k]                   protect tenant floors (M large, but finite)
          − σ · Σ_i z[i]                   anti-flapping

s.t.  ┌ p_min[i]·y[i] ≤ p[i] ≤ p_max[i]·y[i]              ← MIN-CURRENT DISJUNCTION
 hard │ Σ_i p[i]                     ≤ C_site − L_measured
      │ Σ_{i∈φ} p[i]/ph[i]           ≤ C_phase[φ]      ∀φ ∈ {L1,L2,L3}
      └ Σ_{i∈c} p[i]                 ≤ C_circuit[c]
 soft   Σ_{i∈k} p[i] + s[k]          ≥ min(F[k], demand[k])
```

**`p_min[i]·y[i] ≤ p[i]` is the crux of the entire project.** IEC 61851's control-pilot
floor is 6 A; below it an EV stops charging and usually needs a full re-handshake. So
allocation is `0 OR ≥ p_min`, never continuous.

This is why the problem is genuinely MILP rather than LP — and why the naive constraint
`p_min ≤ p ≤ p_max` (no binary) is a **correctness bug**, not a simplification: 30 vans at
a 4.1 kW three-phase minimum is 123 kW of mandatory draw against a 100 kW cap, and the
model is infeasible. With the binary, the solver instead **pauses some vehicles so others
charge properly**, which is also the best visual in the demo.

### Urgency weight + fairness ledger

```
u[i] = tier_weight[k]
     × ( E_needed[i] / max(ε, T_remaining[i] · p_max[i]) )      laxity; 1.0 = must charge flat out
     + δ · debt[i]                                              anti-starvation
```

`debt[i] += (fair_share[i] − p[i])` each cycle, exponentially decayed. Guarantees paused
vehicles rotate back in, and drives the UI copy **"paused — rotating back in ~4 min"**,
which is what makes throttling read as a system rather than a fault.

### Solver notes

- OR-Tools CBC. ~40 sessions with binaries solves in tens of ms. Hard 500 ms wall clock.
- Solve LP relaxation first → **keep the duals for D2** → then solve the MILP.
- Warm-start from the previous solution.
- **Hysteresis:** don't re-issue a profile unless the change exceeds ~1 A or 5%. EVs take
  seconds to tens of seconds to respond to a pilot change; chasing noise oscillates.

---

## 4. Architecture

```
 ┌──────────────┐   OCPP 1.6-J / WS    ┌───────────────┐
 │ sim × N      │─────────────────────▶│  ocpp-gw      │  holds charger sockets
 │ battery +    │◀── SetChargingProfile│  Node + ws    │  Tier-1 greedy lives HERE
 │ taper model  │                      └───────┬───────┘  (no DB dependency)
 └──────────────┘                              │ Redis
                                               ▼
                                       ┌───────────────┐      ┌──────────────────┐
                                       │  api (NestJS) │─────▶│ optimizer        │
                                       │  auth/tenants │ HTTP │ FastAPI+OR-Tools │
                                       │  sessions     │◀─────│ /plan /allocate  │
                                       │  billing      │ 500ms│ /simulate  ←ACN  │
                                       │  ws gateway   │      └──────────────────┘
                                       └───┬───────┬───┘        stateless
                                  Postgres │       │ WS (tenant-scoped rooms)
                                    + RLS  ▼       ▼
                                       ┌───────┐  ┌──────────────────────────┐
                                       │  pg   │  │ web (React+Vite+Tailwind)│
                                       └───────┘  │ RBAC-switched: admin /   │
                                                  │ fleet manager / driver   │
                                                  └──────────────────────────┘
```

Six services, one `docker compose up`. The optimizer's `/simulate` endpoint is the same
solver in batch mode — it serves both the ACN-Data benchmark and the what-if digital twin
(§5), which are the same harness with different inputs.

### Multi-tenancy enforcement

```sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sessions
  USING      (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

Four rules, all documented failure modes:

1. **`SET LOCAL`, inside a transaction, always.** Plain `SET` persists on the pooled
   connection → the next request inherits the previous tenant. Silent cross-tenant leak,
   no error raised.
2. **`tenant_id` leading in every composite index.** Without it, policy evaluation is
   reported as two orders of magnitude slower.
3. **App connects as a non-owner role** — table owners bypass RLS by default.
4. **The optimizer is the exception.** It needs a site-wide view: separate `BYPASSRLS`
   role, and no user request ever routes through that connection.

WebSocket rooms are `tenant:{id}`, joined server-side from the verified JWT — never from a
client-supplied name. One integration test per table: authenticate as tenant A, assert zero
rows of tenant B. In CI.

---

## 5. ACN-Data benchmark — the judge-facing artifact

The strongest single addition from review, and cheap because `/simulate` already exists.

Caltech publishes **ACN-Data**, real session traces from their deployed Adaptive Charging
Network. Run the solver against it in batch and produce a quantified claim:

> *"On N real charging sessions from Caltech's ACN deployment, our optimizer reduced peak
> site demand by X% versus an uncontrolled baseline — avoiding ₹Y/month in demand charges —
> while meeting Z% of departure deadlines."*

Three baselines on one chart:

| Baseline | What it shows |
|---|---|
| Uncontrolled (charge at max on plug-in) | the spike you're eliminating |
| Naive equal-split under cap | the obvious solution, and why it misses deadlines |
| Switchyard (planner + controller) | flat top **and** deadlines met |

A number computed from real-world data beats a live dashboard as a judging artifact,
because it's falsifiable. Same harness serves the **what-if tool**: an admin asks "what if
we add 10 more vans on this duty cycle?" and sees the allocation curve before committing.

---

## 6. Schema

Beyond the original spec's five tables, which cannot express the problem:

```
sites             id, name, cap_kw, cap_phase_a/b/c, base_load_kw, tariff_plan_id
circuits          id, site_id, cap_kw, parent_circuit_id
tariffs           site_id, dow, start_min, end_min, price_per_kwh,
                  demand_charge_per_kw, carbon_gco2_per_kwh          -- carbon rides here
entitlements      tenant_id, site_id, floor_kw, tier_weight, valid_from/to
allocations       session_id, ts, allocated_kw, measured_kw, tier(0|1|2),
                  binding_constraint, shadow_price, reason_text       -- D2, time-series
charge_promises   session_id, promised_soc, promised_by, confidence,
                  state, renegotiated_from
fairness_ledger   session_id, debt_kwh, updated_at
capacity_credits  tenant_id, period, released_kwh, credit_amount
charger_health    charger_id, ts, event(offline|failed_tx|meter_stall), detail
arrival_patterns  site_id, dow, bucket, avg_base_kw, avg_plugins     -- planner prior
```

On `sessions`, which the spec left unusable: `current_soc`, `target_soc`, `departure_time`,
`allocated_kw`, `measured_kw`, `delivered_kwh`, `state`, `phase_assignment`.

`tenant_id` on **every** tenant-scoped table even where a join could derive it — RLS
policies get ugly and slow otherwise.

---

## 7. OCPP gateway scope

Nine messages. That's the whole surface.

| Dir | Message | Purpose |
|---|---|---|
| CP→CS | `BootNotification` | register + **install Tier-0 `TxDefaultProfile`** |
| CP→CS | `Heartbeat`, `StatusNotification` | liveness, connector state machine, fault detection |
| CP→CS | `Authorize`, `StartTransaction`, `StopTransaction` | session lifecycle |
| CP→CS | `MeterValues` | ground truth: SoC + **measured** draw (P4) |
| CS→CP | `SetChargingProfile` | the throttle |
| CS→CP | `RemoteStart/StopTransaction` | admin control |

Confirmed traps:

- **Always set `duration`** (see §2 D4). Non-negotiable.
- Effective limit = `min(ChargePointMaxProfile, TxProfile | TxDefaultProfile)`. `TxProfile`
  requires an active transaction and a matching `transactionId`, else rejected.
- **`Accepted` ≠ applied.** The CallResult means "stored." Verify against `MeterValues`.
- **Units diverge by vendor** — check `ChargingScheduleAllowedChargingRateUnit`. Keep
  `P = √3·V·I·pf` in exactly one place and **round amps down**; rounding up trips breakers.
- **`numberPhases` defaults to 3** if omitted. Get it wrong and the phase model is wrong.

**Build the simulator before the gateway.** A Node script that opens a WS, boots, and emits
`MeterValues` every 5 s from a battery model — integrates allocated power into SoC, tapers
above 80%, honours received profiles, configurable fault injection. Twenty instances is the
dev environment, the load test, and the demo. No hardware, ever.

Reference **CitrineOS** (TypeScript, OCPP 1.6 + 2.0.1) for message-handling structure —
read it, don't depend on it; you need nine messages, not a CSMS.

---

## 8. Build order

Sequenced so something demo-able exists from hour 11 and every later phase is additive.
Hours assume ~4 people in parallel.

| # | Phase | H | Gate |
|---|---|---|---|
| 0 | compose, schema, RLS + isolation test, seed (3 tenants / 8 chargers / 12 vehicles) | 2 | — |
| 1 | **simulator + OCPP gateway** | 5 | sessions land in Postgres, raw board renders ← *critical path* |
| 2 | **Tier-0 boot profile + Tier-1 greedy + `TxProfile` round-trip** | 4 | site total provably ≤ cap; **kill-the-backend demo already works** |
| 3 | optimizer service, Stage B MILP: binaries, phases, entitlement slack, duals → reason codes | 5 | pause-and-rotate visible; "why?" answerable |
| 4 | WS broadcast, live board, site power graph, reason cards | 5 | the dashboard |
| 5 | Stage A planner + demand charge + carbon term + billing with credits | 5 | overnight cost story |
| 6 | **ACN-Data benchmark harness** (`/simulate` + 3-baseline chart) | 3 | the quantified claim |
| 7 | charge promises + renegotiation + fault detection + analytics panel | 4 | the UX story |
| 8 | chaos switch, seed scenario, rehearsal | 3 | demo on rails |

**Parallelism:** frontend starts at phase 1 against seeded rows and a mocked WS feed. The
optimizer is stateless — develop it from hour 0 against JSON fixtures, no stack required.

**Critical path is phase 1.** If the gateway isn't talking to simulators by end of day 1,
cut phases 5 and 7 rather than compressing phase 2.

**Stretch, in priority order:** (1) AI copilot — a thin LLM layer over the `allocations`
reason table answering *"why was my fleet delayed last night?"*, cheap because D2 already
produced the data; (2) explicit intraday capacity micro-market as a second clearing pass;
(3) V2G-capable flag with modeled revenue estimate.

---

## 9. Cut list

Naming these in the pitch is a strength.

| Cut | Substitute | Why |
|---|---|---|
| OAuth2 / OIDC provider | JWT with tenant claims, seeded users | zero points for Auth0 config |
| Stripe | invoice aggregation + CSV/PDF export | payments aren't the problem |
| Prometheus / Grafana / ECS / K8s | `docker compose up` | one command beats a cloud diagram |
| SMS / push | in-app notification centre over the existing WS | same UX, no Twilio |
| Live carbon API | pre-fetched static curve in `tariffs` | same objective term, no stage dependency |
| Predictive maintenance | **fault detection** (offline, failed tx, meter stall) | "predictive" on synthetic data is theater |
| OCPP 2.0.1 | 1.6-J only | 1.6 is in ~80% of deployed chargers |
| Separate Next.js driver app | RBAC-switched routes in one Vite app | two frontends is a trap |
| Explicit capacity market | release credits (falls out of D1 free) | v2 |
| V2G, solar, microgrid | one slide extending the entitlement model | model already supports it — say so, don't build it |

---

## 10. Demo — 4 minutes, 6 beats

| # | Beat | Shows |
|---|---|---|
| 1 | **Fill the site.** Plug in vehicles one by one; bars at max, total climbs to the red 100 kW line. Plug in #5 → every bar drops at once, states flip to `Throttled (Grid Limit)`. | the problem, in 20 s, no narration needed |
| 2 | **The pause.** Three more plug in. Rather than shaving everyone below 6 A, the solver **pauses two** — *"paused, rotating back in ~4 min"* — then actually rotates them. | domain depth nobody else's demo has |
| 3 | **"Why am I at 7 kW?"** Click a session: *"The site is at its electrical limit. Another tenant's guaranteed power is protected. Three vehicles leave sooner than you. Your promise — 82% by 06:00 — is still on track."* Switch to admin view: same event, `λ_site = ₹18/kW`. | D2, both audiences, one click apart |
| 4 | **Deadline conflict.** Set a departure 20 min out. That bar climbs, others yield, SoC forecast confirms. A *different* promise breaks → the system silently borrows from an idle low-priority van first → only then shows the renegotiation card. | D3 + urgency weighting in one motion |
| 5 | **Chaos.** `docker kill optimizer` live → *"Fallback allocator active — Tier 1."* Then kill the gateway → Tier 0 holds, chargers keep their cached limit. Cap never breached, charging never stops. | D4, the strongest 40 seconds |
| 6 | **The number.** Cut to the ACN-Data chart: uncontrolled vs. naive vs. Switchyard, with peak reduction % and ₹/month avoided on real Caltech session data. | falsifiable evidence, not a demo |

---

## 11. Risks

| Risk | P | Mitigation |
|---|---|---|
| OCPP gateway overruns phase 1 | **High** | Timebox 5 h. Fallback: drive the simulator over plain HTTP POST with identical message shapes. Costs the "real protocol" claim, saves the project. |
| MILP slow or infeasible | Med | P1 makes infeasibility structurally impossible (`y = 0` is always feasible). Warm-start; 500 ms hard timeout → Tier 1, which exists from phase 2. Never fatal. |
| Profile flapping looks broken on stage | Med | Hysteresis + `σ` switch penalty, tuned in phase 8, rehearsed against a fixed seed. |
| ACN-Data ingestion eats phase 6 | Med | It's CSV. Write the loader in phase 0 as a background task; if the schema fights you, fall back to a synthetic 200-session trace and label the chart honestly. |
| Simulator diverges from spec | Med | Write it against the JSON schemas, not prose. CI asserts `Σ measured ≤ cap` on every commit — that assertion **is** the product claim. |
| RLS misconfig → cross-tenant leak on stage | Low/severe | Per-table isolation test in CI from phase 0. |

---

## 12. Pitch

> Switchyard is the first EV charging platform where **shared electrical capacity is a
> contract, not a scramble.** Every tenant gets a guaranteed floor, competes fairly for the
> surplus, and gets paid for headroom they release. Every charger can explain, in one
> sentence, why it's at the power it's at. And when our cloud dies mid-demo, the chargers
> keep charging safely — because the last-known-safe limit lives on the hardware, not in
> our backend.
>
> On real Caltech charging data, it cuts peak site demand by X% against an uncontrolled
> baseline while still meeting Z% of departure deadlines.
