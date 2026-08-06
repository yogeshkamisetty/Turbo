# Switchyard: Grid-Aware Multi-Tenant EV Fleet Charging Optimization Platform

## 1. Project Identity
- **Name**: Switchyard
- **Full Title**: Grid-Aware Multi-Tenant EV Fleet Charging Optimization Platform
- **Type**: Full-Stack Monorepo (TypeScript + Python)
- **Repository**: https://github.com/yogeshkamisetty/Turbo.git

## 2. Problem Statement
- Multiple fleet operators share a single charging site with limited electrical capacity.
- Uncontrolled charging causes demand spikes that breach site caps and trigger massive demand charges.
- No existing solution provides multi-tenant fairness with per-tenant guarantees and explainable allocation.
- IEC 61851 mandates a minimum of 6A -- allocation must be 0 OR >= 6A (min-current disjunction), not continuous.

## 3. Four Core Differentiators (D1-D4)

### D1 -- Entitlement + Spillover
Each tenant holds a contracted floor (F_k), unused entitlement flows to surplus pool distributed by urgency-weighted bidding. Unused capacity earns release credits at billing.

*Site 100 kW example:*
- Tenant A guaranteed 40 kW
- Tenant B guaranteed 30 kW
- Tenant C guaranteed 20 kW
- Surplus pool 10 kW (contested by urgency)

### D2 -- Explainable Allocation
LP relaxation yields dual values (shadow prices) for free. These duals ARE the explanation. Stored per allocation row: `binding_constraint`, `shadow_price`, `reason_text`.
- **Driver sees**: 'The site is at its electrical limit'
- **Admin sees**: 'lambda_site = Rs.18/kW'

### D3 -- Charge Promises
At plug-in, system issues a promise: '82% by 06:00, confidence high.' Re-validates every cycle. When broken, renegotiates silently by first borrowing from idle low-priority sessions.

### D4 -- Three-Tier Fail-Safe
- **Tier 2**: Cloud MILP solver (OR-Tools CBC), ~200ms, full objective
- **Tier 1**: Gateway-resident greedy water-filling, ~1ms, no DB dependency
- **Tier 0**: Charger-resident cached TxDefaultProfile (offline safe)

StackLevel 0 (TxDefaultProfile) = C_site / n_chargers, written once at boot. StackLevel 1 (TxProfile) has duration = 2x cycle, so it expires down to safe level 0.

## 4. Architecture (6 Services)

**1. packages/web** -- React + Vite + Recharts dashboard
- RBAC-switched views: Admin / Fleet Manager / Driver
- Live Site Load Graph (real-time sine wave + stochastic surges, 3s ticks)
- Session cards with explainable reason receipts
- ACN-Data benchmark comparison chart
- AI Copilot query panel
- Database Explorer (MySQL/PostgreSQL dialect switching)
- Admin Control Modal (chaos switch, tier override)
- User Management Panel (sign up / account creation)
- Authentication: strict email directory + password verification

**2. packages/api** -- NestJS + TypeORM
- Modules: auth, billing, chargers, sessions, sites, tenants, ws, grid-services, optimizer-client, scheduler
- Row-Level Security (RLS) enforcement via SET LOCAL app.tenant_id
- JWT authentication
- WebSocket gateway for real-time tenant-scoped broadcasts
- Entities: Tenant, User, Site, Circuit, Tariff, Entitlement, Charger, Connector, Vehicle, Session, Allocation, ChargePromise, FairnessLedger, CapacityCredit

**3. packages/ocpp-gateway** -- Node.js + ws
- OCPP 1.6-J WebSocket server (9 message types)
- Handles: BootNotification, Heartbeat, Authorize, StatusNotification, StartTransaction, StopTransaction, MeterValues
- Sends: SetChargingProfile, RemoteStart/StopTransaction
- Redis pub/sub for allocation dispatch from API
- Gateway-resident watchdog: detects API failure (90s timeout) and triggers Tier-1 fallback
- Tier-1 greedy water-filling allocator (in-memory, no DB)

**4. packages/optimizer** -- FastAPI + OR-Tools (Python)
- Stage A Planner (LP/GLOP): 12h horizon, 15-min buckets, minimizes energy cost + demand charge + carbon + deadline shortfall
- Stage B Controller (MILP/CBC): Single timestep, 30-60s cycle, binary on/off variables for min-current disjunction
- ACN-Data benchmark simulator (/simulate endpoint)
- Urgency weights: tier_weight x laxity + debt (anti-starvation)
- Hard 500ms wall clock limit

**5. packages/simulator** -- Node.js charger simulator
- Simulates N chargers with OCPP 1.6-J WebSocket connections
- Battery model with CC/CV taper curve above 80% SoC
- Emits MeterValues every 5s
- Respects received SetChargingProfile limits
- Auto-reconnect on disconnect

**6. db/** -- PostgreSQL schema + seed data
- 14 tables with RLS policies on 8 tenant-scoped tables
- Roles: app_user (RLS enforced), optimizer_role (BYPASSRLS)
- Seed: 3 tenants, 4 users, 1 site, 2 circuits, 8 chargers, 12 vehicles, TOU tariffs, entitlements

## 5. Database Schema (14 Tables)

| Table | Purpose |
|---|---|
| `tenants` | Multi-tenant logical isolation |
| `users` | RBAC and identity |
| `sites` | Physical locations with capacity limits |
| `circuits` | Electrical topology and panel limits |
| `tariffs` | Time-of-use energy pricing |
| `arrival_patterns` | Statistical models for site load |
| `charger_health` | Diagnostic monitoring |
| `entitlements` | Guaranteed power per tenant |
| `chargers` | Physical charging hardware (EVSE) |
| `connectors` | Specific plug interfaces |
| `vehicles` | Fleet assets |
| `sessions` | Active and historical charging events |
| `allocations` | Power assignments |
| `charge_promises` | User-facing completion guarantees |
| `fairness_ledger` | Tracking tenant surplus bidding |
| `capacity_credits` | Monetized unused capacity |

## 6. Technology Stack
- **Frontend**: React 18, Vite, Recharts, Lucide Icons, Axios, Socket.IO Client
- **Backend API**: NestJS, TypeORM, Socket.IO, JWT/bcrypt
- **OCPP Gateway**: Node.js, ws (WebSocket), Redis
- **Optimizer**: Python, FastAPI, Google OR-Tools (CBC/GLOP)
- **Database**: PostgreSQL 15 with RLS
- **Cache/PubSub**: Redis 7
- **Infrastructure**: Docker Compose (6 services)
- **Simulator**: Node.js with battery physics model

## 7. Optimization Mathematics

### Two-Stage Solver

**Stage A Planner (LP/GLOP)**
- Horizon: 12h, 15-min buckets
- Variables: `e[i,t]` (energy), `D_peak` (demand), `short[i]` (shortfall)
- Objective: Minimizes energy cost + demand charge + carbon + deadline penalty

**Stage B Controller (MILP/CBC)**
- Cycle: Single timestep, 30-60s
- Variables: `p[i]` (power), `y[i]` (binary on/off), `z[i]` (switch)
- Objective: Maximizes urgency-weighted throughput
- Key Constraint: `p_min*y <= p <= p_max*y` (min-current disjunction)

**Urgency Formula**
```text
u[i] = tier_weight[k] * (E_needed / max(eps, T_remaining * p_max)) + delta * debt[i]
```

## 8. User Roles & Access
- **ADMIN**: Full site view, all tenants, chaos controls, benchmark, DB explorer, pricing conditions
- **TENANT_MGR**: Fleet-scoped view, session management, billing, notifications
- **DRIVER**: Personal session view, charge promise status, notifications

## 9. OCPP 1.6-J Protocol Implementation
**9 Core Messages Handled:**
- BootNotification
- Heartbeat
- Authorize
- StatusNotification
- StartTransaction
- StopTransaction
- MeterValues (CP->CS)
- SetChargingProfile
- RemoteStart/StopTransaction (CS->CP)

## 10. Demo Accounts

| Role | Email |
|---|---|
| ADMIN | admin@switchyard.io |
| TENANT_MGR | fleet_mgr@logistics.com |
| TENANT_MGR | delivery_mgr@express.com |
| DRIVER | driver1@logistics.com |
| DRIVER | driver2@logistics.com |

## 11. Key Features Summary

| Feature | Description |
|---|---|
| Multi-Tenant Support | Secure RLS isolating tenant data and billing. |
| Grid-Aware Optimization | Real-time LP/MILP balancing site load limits and time-of-use costs. |
| Explainable Allocations | Shadow prices mapped to human-readable constraints. |
| Charge Promises | Commitment guarantees for drivers to ensure confidence. |
| Fallback Mechanisms | Three-tier fail-safe architecture (Cloud MILP -> Gateway Greedy -> Local Offline). |
| Simulation | Built-in ACN-data benchmark and local Node.js EV simulation. |

## 12. Seed Data Summary
- **3 Tenants**: Logistics Fleet A, Delivery Express B, City Cabs C
- **1 Site**: Metro Logistics Hub (100 kW, 3-phase balanced)
- **2 Circuits**: Panel North (60 kW), Panel South (60 kW)
- **8 Chargers**: CP-001 to CP-008 (22 kW each)
- **12 Vehicles**: Across 3 tenants
- **Tariffs & Limits**: Time-of-Use tariffs configured
