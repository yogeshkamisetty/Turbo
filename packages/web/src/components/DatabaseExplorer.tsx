import React, { useState } from 'react';
import { Database, Table, Shield, Terminal, CheckCircle2, ChevronRight, RefreshCw, X, Server, Lock, EyeOff, Layers } from 'lucide-react';

interface DatabaseExplorerProps {
  userRole?: 'ADMIN' | 'TENANT_MGR' | 'DRIVER';
  onClose?: () => void;
  registeredChargersCount?: number;
  companyFloors?: Record<string, number>;
  sessions?: any[];
}

export function DatabaseExplorer({
  userRole = 'ADMIN',
  onClose,
  registeredChargersCount = 8,
  companyFloors = { 'Logistics Fleet A': 40, 'Delivery Express B': 30, 'Green Transport C': 20 },
  sessions = []
}: DatabaseExplorerProps) {
  const [sqlEngine, setSqlEngine] = useState<'POSTGRESQL' | 'MYSQL'>('MYSQL');
  const [activeTable, setActiveTable] = useState<string>(
    userRole === 'DRIVER' ? 'sessions' : userRole === 'TENANT_MGR' ? 'sessions' : 'tenants'
  );

  // Dynamic chargers row generation matching live registered chargers count
  const dynamicChargerRows = Array.from({ length: Math.max(6, registeredChargersCount) }, (_, i) => {
    const cpId = `CP-00${i + 1}`;
    const activeSess = sessions.find(s => s.charger === cpId);
    return {
      charger_id: `ch-00${i + 1}`,
      site_id: 'b0000000-0000-4000-8000-000000000001',
      ocpp_endpoint: `${cpId} (ws://gateway:9000)`,
      max_power: '22.00 kW',
      status: activeSess ? 'Occupied' : 'Available',
    };
  });

  // Dynamic sessions row generation matching live active sessions
  const dynamicSessionRows = (sessions && sessions.length > 0)
    ? sessions.map(s => ({
        session_id: `s-${s.id}`,
        charger_id: s.charger || 'CP-001',
        vehicle_id: s.vehicle || 'v-1001',
        tenant_id: s.tenant === 'Delivery Express B' ? '22222222-2222...' : '11111111-1111...',
        start_end: `13:00 / ${s.departureTime}`,
        kwh: `${(s.allocatedKw ? s.allocatedKw * 3.4 : 35.0).toFixed(1)} kWh`,
        allocated_power: `${s.allocatedKw || 0} kW ${s.state ? `(${s.state})` : ''}`,
      }))
    : [
        { session_id: 's1-111111', charger_id: 'CP-001', vehicle_id: 'v-1001 (Van A1)', tenant_id: '11111111-1111...', start_end: '13:00 / 06:00 AM', kwh: '42.5 kWh', allocated_power: '12.5 kW' },
        { session_id: 's2-111111', charger_id: 'CP-002', vehicle_id: 'v-1002 (Van A2)', tenant_id: '11111111-1111...', start_end: '13:05 / 06:30 AM', kwh: '38.0 kWh', allocated_power: '11.0 kW' },
        { session_id: 's3-111111', charger_id: 'CP-003', vehicle_id: 'v-1004 (Truck A4)', tenant_id: '11111111-1111...', start_end: '13:10 / 05:45 AM', kwh: '62.0 kWh', allocated_power: '18.2 kW' },
        { session_id: 's4-111111', charger_id: 'CP-004', vehicle_id: 'v-1003 (Van A3)', tenant_id: '11111111-1111...', start_end: '13:15 / 07:15 AM', kwh: '15.2 kWh', allocated_power: '0.0 kW (Paused)' },
        { session_id: 's5-222222', charger_id: 'CP-005', vehicle_id: 'v-2001 (Express B1)', tenant_id: '22222222-2222...', start_end: '13:20 / 06:15 AM', kwh: '31.4 kWh', allocated_power: '14.1 kW' },
        { session_id: 's6-222222', charger_id: 'CP-006', vehicle_id: 'v-2002 (Express B2)', tenant_id: '22222222-2222...', start_end: '13:25 / 06:45 AM', kwh: '28.9 kWh', allocated_power: '11.0 kW' },
      ];

  // Full raw table data dictionary for PostgreSQL & MySQL Dialects
  const rawTableData: Record<string, { pgQuery: string; mysqlQuery: string; columns: string[]; rows: Record<string, any>[] }> = {
    tenants: {
      pgQuery: `SELECT id AS tenant_id, name AS company_name, site_id, floor_kw AS biding_plan FROM tenants JOIN entitlements ON tenants.id = entitlements.tenant_id;`,
      mysqlQuery: `SELECT id AS tenant_id, name AS company_name, site_id, floor_kw AS biding_plan FROM switchyard_db.tenants INNER JOIN entitlements ON tenants.id = entitlements.tenant_id ENGINE=InnoDB;`,
      columns: ['tenant_id', 'company_name', 'site_id', 'biding_plan'],
      rows: [
        { tenant_id: '11111111-1111-1111-1111-111111111111', company_name: 'Logistics Fleet A', site_id: 'b0000000-0000-4000-8000-000000000001', biding_plan: `${companyFloors['Logistics Fleet A'] || 40.00} kW Guaranteed Floor` },
        { tenant_id: '22222222-2222-2222-2222-222222222222', company_name: 'Delivery Express B', site_id: 'b0000000-0000-4000-8000-000000000001', biding_plan: `${companyFloors['Delivery Express B'] || 30.00} kW Guaranteed Floor` },
        { tenant_id: '33333333-3333-3333-3333-333333333333', company_name: 'Green Transport C', site_id: 'b0000000-0000-4000-8000-000000000001', biding_plan: `${companyFloors['Green Transport C'] || 20.00} kW Guaranteed Floor` },
      ],
    },
    chargers: {
      pgQuery: `SELECT id AS charger_id, site_id, ocpp_id AS ocpp_endpoint, max_kw AS max_power, status FROM chargers ORDER BY ocpp_id;`,
      mysqlQuery: `SELECT id AS charger_id, site_id, ocpp_id AS ocpp_endpoint, max_kw AS max_power, status FROM switchyard_db.chargers ORDER BY ocpp_id ASC;`,
      columns: ['charger_id', 'site_id', 'ocpp_endpoint', 'max_power', 'status'],
      rows: dynamicChargerRows,
    },
    sessions: {
      pgQuery: `SELECT id AS session_id, charger_id, vehicle_id, tenant_id, start_time || ' / ' || departure_time AS start_end, delivered_kwh AS kwh, allocated_kw AS allocated_power FROM sessions ORDER BY id;`,
      mysqlQuery: `SELECT id AS session_id, charger_id, vehicle_id, tenant_id, CONCAT(start_time, ' / ', departure_time) AS start_end, delivered_kwh AS kwh, allocated_kw AS allocated_power FROM switchyard_db.sessions ORDER BY id ASC;`,
      columns: ['session_id', 'charger_id', 'vehicle_id', 'tenant_id', 'start_end', 'kwh', 'allocated_power'],
      rows: dynamicSessionRows,
    },
    vehicles: {
      pgQuery: `SELECT id AS vehicle_id, tenant_id, battery_capacity_kwh AS battery_capacity, driver_name AS driver, priority_tier FROM vehicles ORDER BY id;`,
      mysqlQuery: `SELECT id AS vehicle_id, tenant_id, battery_capacity_kwh AS battery_capacity, driver_name AS driver, priority_tier FROM switchyard_db.vehicles ORDER BY id ASC;`,
      columns: ['vehicle_id', 'tenant_id', 'battery_capacity', 'driver', 'priority_tier'],
      rows: [
        { vehicle_id: 'v-1001', tenant_id: '11111111-1111...', battery_capacity: '80.00 kWh', driver: 'Driver Dave', priority_tier: 'Rank #2 (Normal)' },
        { vehicle_id: 'v-1002', tenant_id: '11111111-1111...', battery_capacity: '80.00 kWh', driver: 'Driver Alex', priority_tier: 'Rank #3 (Flexible)' },
        { vehicle_id: 'v-1004', tenant_id: '11111111-1111...', battery_capacity: '120.00 kWh', driver: 'Driver Sam', priority_tier: 'Rank #1 (Highest)' },
        { vehicle_id: 'v-2001', tenant_id: '22222222-2222...', battery_capacity: '90.00 kWh', driver: 'Driver Michael', priority_tier: 'Rank #1 (Urgent)' },
      ],
    },
    invoices: {
      pgQuery: `SELECT id AS invoice_id, tenant_id, period, total_kwh, amount FROM capacity_credits JOIN billing ON tenant_id;`,
      mysqlQuery: `SELECT id AS invoice_id, tenant_id, period, total_kwh, amount FROM switchyard_db.capacity_credits INNER JOIN billing ON tenant_id;`,
      columns: ['invoice_id', 'tenant_id', 'period', 'total_kwh', 'amount'],
      rows: [
        { invoice_id: 'inv-2026-08A', tenant_id: '11111111-1111... (Fleet A)', period: 'Aug 2026', total_kwh: '142.50 kWh', amount: '₹2,285.50' },
        { invoice_id: 'inv-2026-08B', tenant_id: '22222222-2222... (Express B)', period: 'Aug 2026', total_kwh: '98.20 kWh', amount: '₹1,475.00' },
        { invoice_id: 'inv-2026-08C', tenant_id: '33333333-3333... (Green Transport C)', period: 'Aug 2026', total_kwh: '75.40 kWh', amount: '₹1,130.00' },
      ],
    },
    users: {
      pgQuery: `SELECT id, email, role, password_hash, tenant_id FROM users ORDER BY role;`,
      mysqlQuery: `SELECT id, email, role, password_hash, tenant_id FROM switchyard_db.users ORDER BY role ASC;`,
      columns: ['id', 'email', 'role', 'password_hash', 'tenant_id'],
      rows: [
        { id: 'usr-001', email: 'admin@switchyard.io', role: 'ADMIN', password_hash: '$2b$10$e8Z... [REDACTED BY RLS]', tenant_id: 'SYSTEM_GLOBAL' },
        { id: 'usr-002', email: 'fleet_mgr@logistics.com', role: 'TENANT_MGR', password_hash: '$2b$10$w9L... [REDACTED BY RLS]', tenant_id: '11111111-1111...' },
        { id: 'usr-003', email: 'delivery_mgr@express.com', role: 'TENANT_MGR', password_hash: '$2b$10$x4P... [REDACTED BY RLS]', tenant_id: '22222222-2222...' },
        { id: 'usr-004', email: 'driver1@logistics.com', role: 'DRIVER', password_hash: '$2b$10$k1M... [REDACTED BY RLS]', tenant_id: '11111111-1111...' },
        { id: 'usr-005', email: 'driver2@logistics.com', role: 'DRIVER', password_hash: '$2b$10$j8N... [REDACTED BY RLS]', tenant_id: '11111111-1111...' },
      ],
    },
  };

  // Apply Role-Based Data Isolation & Restrictions
  const getFilteredTableData = () => {
    const currentData = rawTableData[activeTable] || { pgQuery: '', mysqlQuery: '', columns: [], rows: [] };
    const selectedQuery = sqlEngine === 'MYSQL' ? currentData.mysqlQuery : currentData.pgQuery;

    // DRIVER ROLE RESTRICTION: Forbidden for tenants, invoices, users
    if (userRole === 'DRIVER') {
      if (['tenants', 'invoices', 'users'].includes(activeTable)) {
        return {
          query: sqlEngine === 'MYSQL' ? `SELECT * FROM switchyard_db.${activeTable}; -- MySQL Access Denied` : `SET RLS POLICY FOR DRIVER ROLE; -- ACCESS DENIED`,
          columns: ['STATUS_CODE', 'MESSAGE'],
          rows: [
            {
              STATUS_CODE: '403 FORBIDDEN',
              MESSAGE: `Table access restricted by ${sqlEngine} Security Policy for DRIVER role.`,
            },
          ],
          isForbidden: true,
        };
      }

      // DRIVER ROLE RESTRICTION: Row-level filter strictly for own vehicle
      if (activeTable === 'sessions') {
        return {
          query: selectedQuery,
          columns: currentData.columns,
          rows: currentData.rows.filter(r => r.session_id.includes('s1') || r.vehicle_id.includes('v-1001')),
        };
      }
      if (activeTable === 'chargers') {
        return {
          query: selectedQuery,
          columns: currentData.columns,
          rows: currentData.rows.filter(r => r.charger_id === 'ch-001'),
        };
      }
      if (activeTable === 'vehicles') {
        return {
          query: selectedQuery,
          columns: currentData.columns,
          rows: currentData.rows.filter(r => r.vehicle_id === 'v-1001'),
        };
      }
    }

    // TENANT_MGR ROLE RESTRICTION: Isolates sibling competitor fleets
    if (userRole === 'TENANT_MGR') {
      if (activeTable === 'tenants') {
        return {
          query: selectedQuery,
          columns: currentData.columns,
          rows: currentData.rows.filter(r => r.tenant_id === '11111111-1111-1111-1111-111111111111'),
        };
      }
      if (activeTable === 'sessions') {
        return {
          query: selectedQuery,
          columns: currentData.columns,
          rows: currentData.rows.filter(r => r.tenant_id.includes('11111111')),
        };
      }
      if (activeTable === 'invoices') {
        return {
          query: selectedQuery,
          columns: currentData.columns,
          rows: currentData.rows.filter(r => r.tenant_id.includes('Fleet A')),
        };
      }
      if (activeTable === 'vehicles') {
        return {
          query: selectedQuery,
          columns: currentData.columns,
          rows: currentData.rows.filter(r => r.tenant_id.includes('11111111')),
        };
      }
    }

    // ADMIN ROLE: Returns full site-wide table representation
    return {
      query: selectedQuery,
      columns: currentData.columns,
      rows: currentData.rows,
      isForbidden: false,
    };
  };

  const currentView = getFilteredTableData();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {sqlEngine === 'MYSQL' ? 'MySQL 8.0 Database Table Representation' : 'PostgreSQL Database Table Representation'}
            </h2>
            <p className="text-xs text-slate-400">
              Showcasing relational database tables under <strong className="text-cyan-300">{sqlEngine}</strong> Engine with <strong className="text-cyan-300">{userRole}</strong> security policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* SQL Engine / Dialect Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setSqlEngine('MYSQL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                sqlEngine === 'MYSQL' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              MySQL (v8.0)
            </button>
            <button
              onClick={() => setSqlEngine('POSTGRESQL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                sqlEngine === 'POSTGRESQL' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              PostgreSQL (v15)
            </button>
          </div>

          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2 font-mono">
            <Shield className="w-3.5 h-3.5 text-cyan-400" /> RLS: {userRole}
          </span>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Engine Description Banner */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 flex items-start gap-3">
        <Server className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-amber-300">
            {sqlEngine === 'MYSQL'
              ? 'MySQL 8.0 InnoDB Relational Engine Active: Showing MySQL database tables (`switchyard_db`), auto-increment IDs, and InnoDB storage engine views.'
              : 'PostgreSQL 15 Relational Engine Active: Enforcing PostgreSQL Row-Level Security (RLS) views and TypeORM entity mappings.'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {sqlEngine === 'MYSQL'
              ? 'MySQL Query: SHOW TABLES FROM switchyard_db; -- ENGINE=InnoDB CHARSET=utf8mb4'
              : 'PostgreSQL Query: SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';'}
          </div>
        </div>
      </div>

      {/* Table Selector Tabs */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-2 overflow-x-auto">
        {['tenants', 'chargers', 'sessions', 'vehicles', 'invoices', 'users'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTable(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTable === t
                ? sqlEngine === 'MYSQL'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> {t}
          </button>
        ))}
      </div>

      {/* SQL Query Preview Terminal */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 font-mono text-xs">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Executing {sqlEngine} Query under {userRole} Context:
        </div>
        <div className="text-cyan-300 font-medium overflow-x-auto whitespace-nowrap bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-500">&gt;_ {sqlEngine === 'MYSQL' ? 'mysql>' : 'psql>'} </span>
          {currentView.query}
        </div>
      </div>

      {/* Database Table Output */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                {currentView.columns.map((col) => (
                  <th key={col} className="p-3 text-slate-300 font-bold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {currentView.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition">
                  {currentView.columns.map((col) => (
                    <td key={col} className="p-3 whitespace-nowrap">
                      {String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{currentView.rows.length} rows returned</span>
          <span>{sqlEngine} 8.0 Engine Active for {userRole}</span>
        </div>
      </div>
    </div>
  );
}
