import React, { useState } from 'react';
import { Database, Table, Shield, Terminal, CheckCircle2, ChevronRight, RefreshCw, X, Server } from 'lucide-react';

interface DatabaseExplorerProps {
  onClose?: () => void;
}

export function DatabaseExplorer({ onClose }: DatabaseExplorerProps) {
  const [activeTable, setActiveTable] = useState<string>('tenants');

  // Relational PostgreSQL table data representations
  const tableData: Record<string, { query: string; columns: string[]; rows: Record<string, any>[] }> = {
    tenants: {
      query: `SELECT id AS tenant_id, name AS company_name, site_id, floor_kw AS biding_plan FROM tenants JOIN entitlements ON tenants.id = entitlements.tenant_id;`,
      columns: ['tenant_id', 'company_name', 'site_id', 'biding_plan'],
      rows: [
        { tenant_id: '11111111-1111-1111-1111-111111111111', company_name: 'Logistics Fleet A', site_id: 'b0000000-0000...', biding_plan: '40.00 kW Guaranteed Floor' },
        { tenant_id: '22222222-2222-2222-2222-222222222222', company_name: 'Delivery Express B', site_id: 'b0000000-0000...', biding_plan: '30.00 kW Guaranteed Floor' },
        { tenant_id: '33333333-3333-3333-3333-333333333333', company_name: 'City Cabs C', site_id: 'b0000000-0000...', biding_plan: '20.00 kW Guaranteed Floor' },
      ],
    },
    chargers: {
      query: `SELECT id AS charger_id, site_id, ocpp_id AS ocpp_endpoint, max_kw AS max_power, status FROM chargers ORDER BY ocpp_id;`,
      columns: ['charger_id', 'site_id', 'ocpp_endpoint', 'max_power', 'status'],
      rows: [
        { charger_id: 'ch-001', site_id: 'b0000000-0000...', ocpp_endpoint: 'CP-001 (ws://gateway:9000)', max_power: '22.00 kW', status: 'Occupied' },
        { charger_id: 'ch-002', site_id: 'b0000000-0000...', ocpp_endpoint: 'CP-002 (ws://gateway:9000)', max_power: '22.00 kW', status: 'Occupied' },
        { charger_id: 'ch-003', site_id: 'b0000000-0000...', ocpp_endpoint: 'CP-003 (ws://gateway:9000)', max_power: '22.00 kW', status: 'Occupied' },
        { charger_id: 'ch-004', site_id: 'b0000000-0000...', ocpp_endpoint: 'CP-004 (ws://gateway:9000)', max_power: '22.00 kW', status: 'Occupied' },
        { charger_id: 'ch-005', site_id: 'b0000000-0000...', ocpp_endpoint: 'CP-005 (ws://gateway:9000)', max_power: '22.00 kW', status: 'Available' },
        { charger_id: 'ch-006', site_id: 'b0000000-0000...', ocpp_endpoint: 'CP-006 (ws://gateway:9000)', max_power: '22.00 kW', status: 'Available' },
        { charger_id: 'ch-007', site_id: 'b0000000-0000...', ocpp_endpoint: 'CP-007 (ws://gateway:9000)', max_power: '22.00 kW', status: 'Available' },
        { charger_id: 'ch-008', site_id: 'b0000000-0000...', ocpp_endpoint: 'CP-008 (ws://gateway:9000)', max_power: '22.00 kW', status: 'Available' },
      ],
    },
    sessions: {
      query: `SELECT id AS session_id, charger_id, vehicle_id, tenant_id, start_time || ' / ' || departure_time AS start_end, delivered_kwh AS kwh, allocated_kw AS allocated_power FROM sessions ORDER BY id;`,
      columns: ['session_id', 'charger_id', 'vehicle_id', 'tenant_id', 'start_end', 'kwh', 'allocated_power'],
      rows: [
        { session_id: 's1-111111', charger_id: 'CP-001', vehicle_id: 'v-1001 (Van A1)', tenant_id: '11111111-1111...', start_end: '13:00 / 06:00 AM', kwh: '42.5 kWh', allocated_power: '12.5 kW' },
        { session_id: 's2-111111', charger_id: 'CP-002', vehicle_id: 'v-1002 (Van A2)', tenant_id: '11111111-1111...', start_end: '13:05 / 06:30 AM', kwh: '38.0 kWh', allocated_power: '11.0 kW' },
        { session_id: 's3-111111', charger_id: 'CP-003', vehicle_id: 'v-1004 (Truck A4)', tenant_id: '11111111-1111...', start_end: '13:10 / 05:45 AM', kwh: '62.0 kWh', allocated_power: '18.2 kW' },
        { session_id: 's4-111111', charger_id: 'CP-004', vehicle_id: 'v-1003 (Van A3)', tenant_id: '11111111-1111...', start_end: '13:15 / 07:15 AM', kwh: '15.2 kWh', allocated_power: '0.0 kW (Paused)' },
        { session_id: 's5-222222', charger_id: 'CP-005', vehicle_id: 'v-2001 (Express B1)', tenant_id: '22222222-2222...', start_end: '13:20 / 06:15 AM', kwh: '31.4 kWh', allocated_power: '14.1 kW' },
        { session_id: 's6-222222', charger_id: 'CP-006', vehicle_id: 'v-2002 (Express B2)', tenant_id: '22222222-2222...', start_end: '13:25 / 06:45 AM', kwh: '28.9 kWh', allocated_power: '11.0 kW' },
      ],
    },
    vehicles: {
      query: `SELECT id AS vehicle_id, tenant_id, battery_capacity_kwh AS battery_capacity, driver_name AS driver, priority_tier FROM vehicles ORDER BY id;`,
      columns: ['vehicle_id', 'tenant_id', 'battery_capacity', 'driver', 'priority_tier'],
      rows: [
        { vehicle_id: 'v-1001', tenant_id: '11111111-1111...', battery_capacity: '80.00 kWh', driver: 'Driver Dave', priority_tier: 'Rank #2 (Normal)' },
        { vehicle_id: 'v-1002', tenant_id: '11111111-1111...', battery_capacity: '80.00 kWh', driver: 'Driver Alex', priority_tier: 'Rank #3 (Flexible)' },
        { vehicle_id: 'v-1004', tenant_id: '11111111-1111...', battery_capacity: '120.00 kWh', driver: 'Driver Sam', priority_tier: 'Rank #1 (Highest)' },
        { vehicle_id: 'v-2001', tenant_id: '22222222-2222...', battery_capacity: '90.00 kWh', driver: 'Driver Bob', priority_tier: 'Rank #1 (Urgent)' },
      ],
    },
    invoices: {
      query: `SELECT id AS invoice_id, tenant_id, period, total_kwh, amount FROM capacity_credits JOIN billing ON tenant_id;`,
      columns: ['invoice_id', 'tenant_id', 'period', 'total_kwh', 'amount'],
      rows: [
        { invoice_id: 'inv-2026-08A', tenant_id: '11111111-1111... (Fleet A)', period: 'Aug 2026', total_kwh: '142.50 kWh', amount: '₹2,285.50' },
        { invoice_id: 'inv-2026-08B', tenant_id: '22222222-2222... (Express B)', period: 'Aug 2026', total_kwh: '98.20 kWh', amount: '₹1,475.00' },
        { invoice_id: 'inv-2026-08C', tenant_id: '33333333-3333... (City Cabs)', period: 'Aug 2026', total_kwh: '75.40 kWh', amount: '₹1,130.00' },
      ],
    },
  };

  const current = tableData[activeTable] || tableData.tenants;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Database className="w-6 h-6 text-cyan-400" /> PostgreSQL Database Table Representation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official schema tables: Tenants, Chargers, Sessions, Vehicles, and Invoices.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <Server className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="font-bold text-white leading-none">PostgreSQL 15</div>
            <div className="text-[10px] text-emerald-400 font-semibold">RLS: FORCE ROW LEVEL SECURITY</div>
          </div>
        </div>
      </div>

      {/* Table Selector Pills */}
      <div className="flex flex-wrap gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-semibold">
        {Object.keys(tableData).map((tbl) => (
          <button
            key={tbl}
            onClick={() => setActiveTable(tbl)}
            className={`px-4 py-2 rounded-lg transition uppercase tracking-wider font-bold flex items-center gap-1.5 ${
              activeTable === tbl
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> {tbl}
          </button>
        ))}
      </div>

      {/* Live SQL Query Command Bar */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-3">
        <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <div className="text-slate-300 font-semibold overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className="text-cyan-400">psql&gt;</span> {current.query}
        </div>
      </div>

      {/* Database Table Representation Grid */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-cyan-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                {current.columns.map((col) => (
                  <th key={col} className="p-3.5 border-r border-slate-800/60 last:border-r-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {current.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/60 transition">
                  {current.columns.map((col) => (
                    <td key={col} className="p-3.5 border-r border-slate-800/40 last:border-r-0">
                      {col === 'status' || col === 'state' ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          row[col] === 'Occupied' || row[col] === 'Charging'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : row[col] === 'Paused' || row[col]?.includes('Paused')
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {row[col]}
                        </span>
                      ) : col === 'priority_tier' ? (
                        <span className="text-purple-400 font-bold">{row[col]}</span>
                      ) : col === 'amount' ? (
                        <span className="text-cyan-400 font-bold">{row[col]}</span>
                      ) : (
                        row[col]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between font-sans font-medium">
          <span>{current.rows.length} rows returned</span>
          <span>PostgreSQL 15 Schema: public</span>
        </div>
      </div>

    </div>
  );
}
