# Switchyard — Grid-Aware Multi-Tenant EV Fleet Charging

Switchyard is a Grid-Aware Multi-Tenant EV Fleet Charging Optimization Platform where shared electrical capacity is a contract, not a scramble.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Optimizer Endpoints](#optimizer-endpoints)
- [Demo Accounts](#demo-accounts)
- [Development](#development)
- [Testing](#testing)
- [License](#license)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)

## Overview

Switchyard is the first EV charging platform where shared electrical capacity is a contract, not a scramble. Every tenant gets a guaranteed floor, competes fairly for the surplus, and gets paid for headroom they release. Every charger can explain why it is at the power it is at. And when the cloud dies, the chargers keep charging safely.

## Key Features

- Multi-tenant entitlement-based power allocation with guaranteed floors
- Two-stage LP/MILP optimization (OR-Tools CBC/GLOP)
- OCPP 1.6-J protocol (9 message types)
- Three-tier fail-safe (Cloud MILP -> Gateway Greedy -> Charger Cached)
- Explainable allocation with shadow prices and reason codes
- Charge promises with automatic renegotiation
- Real-time WebSocket dashboard with live site load graph
- ACN-Data benchmark harness (Caltech real-session comparison)
- Row-Level Security for tenant isolation
- AI Copilot for allocation analysis queries
- Database Explorer (MySQL/PostgreSQL)
- Role-based access: Admin, Fleet Manager, Driver

## Architecture

The project is built as a 6-service Docker Compose monorepo.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Lucide Icons, Socket.IO Client |
| Backend API | NestJS, TypeORM, Socket.IO, JWT, bcrypt |
| OCPP Gateway | Node.js, ws (WebSocket), Redis Pub/Sub |
| Optimizer | Python 3.11, FastAPI, Google OR-Tools (CBC/GLOP) |
| Database | PostgreSQL 15 (Row-Level Security) |
| Cache | Redis 7 |
| Infra | Docker Compose |

### Architecture Diagram

```text
+-----------+        +-------------------+        +-------+
| Simulator | <----> | OCPP Gateway (ws) | <----> | Redis |
+-----------+        +-------------------+        +-------+
                               |                      |
                               v                      v
        +-----+        +-------------------+        +-----------+
        | Web | <----> |       API         | <----> | Optimizer |
        +-----+        +-------------------+        +-----------+
                               |
                               v
                       +-------------------+
                       | Postgres Database |
                       +-------------------+
```

- Simulator <-> OCPP Gateway (OCPP 1.6-J WS)
- OCPP Gateway <-> Redis
- API <-> Postgres, Redis, Optimizer
- Web <-> API (REST + WS)

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local dev)
- Python 3.11+ (for optimizer local dev)
- Git

## Quick Start

```bash
git clone https://github.com/yogeshkamisetty/Turbo.git
cd Turbo
cp .env.example .env
docker compose up --build
```

Then open http://localhost:5173 for the dashboard.

## Environment Variables

From `.env.example`:

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `REDIS_HOST`, `REDIS_PORT`
- `JWT_SECRET`
- `GATEWAY_WS_PORT`
- `OPTIMIZER_URL`
- `API_URL`

## Project Structure

```text
switchyard/
|-- docker-compose.yml
|-- .env.example
|-- db/
|   |-- init.sql          # Schema + RLS policies
|   |-- seed.sql          # Demo data (3 tenants, 8 chargers, 12 vehicles)
|-- packages/
|   |-- web/              # React dashboard (Vite)
|   |-- api/              # NestJS REST + WebSocket API
|   |-- ocpp-gateway/     # OCPP 1.6-J gateway
|   |-- optimizer/        # FastAPI + OR-Tools solver
|   |-- simulator/        # Charger simulator
|-- scripts/
|-- PLAN.md               # Detailed architecture plan
```

## Database Schema

- `tenants`: Multi-tenant organization records
- `users`: User authentication and role-based access
- `sites`: Physical site locations containing circuits
- `circuits`: Electrical infrastructure with capacity limits
- `tariffs`: Pricing schedules and models
- `arrival_patterns`: Historical and predicted vehicle arrivals
- `charger_health`: Diagnostic and health logs for chargers
- `entitlements`: Capacity guarantees per tenant
- `chargers`: Physical EV supply equipment (EVSE)
- `connectors`: Individual connection points on chargers
- `vehicles`: Fleet vehicles and battery specifications
- `sessions`: Active and historical charging sessions
- `allocations`: Power allocation records and shadow prices
- `charge_promises`: Renegotiable target deadlines and energies
- `fairness_ledger`: Historical tracking of surplus power distribution
- `capacity_credits`: Accounting for relinquished headroom capacity

## API Endpoints

### Auth
- `POST /auth/login`

### Sessions
- `GET /sessions`
- `GET /sessions/:id/receipt`
- `POST /sessions/copilot/analyze`
- `POST /sessions/benchmark`

### Billing
- `GET /billing/invoice`

### Infrastructure
- `GET /sites`
- `GET /chargers`
- `GET /tenants`

## Optimizer Endpoints

- `GET /health`
- `POST /allocate` (Stage B MILP)
- `POST /plan` (Stage A LP)
- `POST /simulate` (ACN benchmark)

## Demo Accounts

- admin@switchyard.io — System Admin (ADMIN)
- fleet_mgr@logistics.com — Alice Manager (TENANT_MGR)
- delivery_mgr@express.com — Bob Manager (TENANT_MGR)
- driver1@logistics.com — Driver Dave (DRIVER)
- driver2@logistics.com — Driver Alex (DRIVER)

## Development

Local development instructions for each package:

```bash
# Web (Frontend)
cd packages/web && npm install && npm run dev

# API
cd packages/api && npm install && npm run start:dev

# Optimizer
cd packages/optimizer && pip install -r requirements.txt && uvicorn src.main:app --reload
```

## Testing

Row-Level Security (RLS) isolation tests are enforced per table. CI checks include validation assertions, such as ensuring that `sum(measured) <= cap`.

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Acknowledgments

- ACN-Data (Caltech Adaptive Charging Network)
- Google OR-Tools
- OCPP 1.6-J specification
