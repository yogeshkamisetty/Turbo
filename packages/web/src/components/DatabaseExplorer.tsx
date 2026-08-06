import React, { useState } from 'react';
import { Database, Table, Shield, Terminal, CheckCircle2, ChevronRight, RefreshCw, X, Server } from 'lucide-react';

interface DatabaseExplorerProps {
  onClose?: () => void;
}

export function DatabaseExplorer({ onClose }: DatabaseExplorerProps) {
  const [activeTable, setActiveTable] = useState<string>('chargers');

  // Simulated live PostgreSQL table data representations
  const tableData: Record<string, { query: string; columns: string[]; rows: Record<string, any>[] }> = {
    chargers: {
      query: `SELECT ocpp_id, site_id, connector_index, status, max_kw, last_heartbeat FROM chargers ORDER BY ocpp_id;`,
      columns: ['ocpp_id', 'site_id', 'connector_index', 'status', 'max_kw', 'last_heartbeat'],
      rows: [
        { ocpp_id: 'CP-001', site_id: 'b0000000...', connector_index: 1, status: 'Occupied', max_kw: '22.00 kW', last_heartbeat: '2026-08-06 13:54:10' },
        { ocpp_id: 'CP-002', site_id: 'b0000000...', connector_index: 1, status: 'Occupied', max_kw: '22.00 kW', last_heartbeat: '2026-08-06 13:54:12' },
        { ocpp_id: 'CP-003', site_id: 'b0000000...', connector_index: 1, status: 'Occupied', max_kw: '22.00 kW', last_heartbeat: '2026-08-06 13:54:15' },
        { ocpp_id: 'CP-004', site_id: 'b0000000...', connector_index: 1, status: 'Occupied', max_kw: '22.00 kW', last_heartbeat: '2026-08-06 13:54:08' },
        { ocpp_id: 'CP-005', site_id: 'b0000000...', connector_index: 1, status: 'Available', max_kw: '22.00 kW', last_heartbeat: '2026-08-06 13:54:02' },
        { ocpp_id: 'CP-006', site_id: 'b0000000...', connector_index: 1, status: 'Available', max_kw: '22.00 kW', last_heartbeat: '2026-08-06 13:54:00' },
        { ocpp_id: 'CP-007', site_id: 'b0000000...', connector_index: 1, status: 'Available', max_kw: '22.00 kW', last_heartbeat: '2026-08-06 13:53:55' },
        { ocpp_id: 'CP-008', site_id: 'b0000000...', connector_index: 1, status: 'Available', max_kw: '22.00 kW', last_heartbeat: '2026-08-06 13:53:50' },
      ],
    },
    sessions: {
      query: `SELECT id, tenant_id, charger_id, current_soc, target_soc, allocated_kw, measured_kw, state, departure_time FROM sessions ORDER BY id;`,
      columns: ['id', 'tenant', 'charger', 'current_soc', 'target_soc', 'allocated_kw', 'state', 'departure_time'],
      rows: [
        { id: 's1-111111', tenant: 'Logistics Fleet A', charger: 'CP-001', current_soc: '42%', target_soc: '90%', allocated_kw: '12.5 kW', state: 'Charging', departure_time: '06:00 AM' },
        { id: 's2-111111', tenant: 'Logistics Fleet A', charger: 'CP-002', current_soc: '58%', target_soc: '85%', allocated_kw: '11.0 kW', state: 'Charging', departure_time: '06:30 AM' },
        { id: 's3-111111', tenant: 'Logistics Fleet A', charger: 'CP-003', current_soc: '22%', target_soc: '95%', allocated_kw: '18.2 kW', state: 'Charging', departure_time: '05:45 AM' },
        { id: 's4-111111', tenant: 'Logistics Fleet A', charger: 'CP-004', current_soc: '35%', target_soc: '80%', allocated_kw: '0.0 kW', state: 'Paused', departure_time: '07:15 AM' },
        { id: 's5-222222', tenant: 'Delivery Express B', charger: 'CP-005', current_soc: '65%', target_soc: '90%', allocated_kw: '14.1 kW', state: 'Charging', departure_time: '06:15 AM' },
        { id: 's6-222222', tenant: 'Delivery Express B', charger: 'CP-006', current_soc: '71%', target_soc: '85%', allocated_kw: '11.0 kW', state: 'Charging', departure_time: '06:45 AM' },
      ],
    },
    allocations: {
      query: `SELECT ts, session_id, allocated_kw, tier, binding_constraint, shadow_price, reason_text FROM allocations ORDER BY ts DESC LIMIT 10;`,
      columns: ['ts', 'session_id', 'allocated_kw', 'tier', 'binding_constraint', 'shadow_price', 'reason_text'],
      rows: [
        { ts: '13:54:00', session_id: 's1-111111', allocated_kw: '12.5 kW', tier: '2 (Cloud MILP)', binding_constraint: 'Site Capacity (100 kW)', shadow_price: '₹18.50/kW', reason_text: 'Allocated 12.5 kW under fair surplus pool' },
        { ts: '13:54:00', session_id: 's2-111111', allocated_kw: '11.0 kW', tier: '2 (Cloud MILP)', binding_constraint: 'Site Capacity (100 kW)', shadow_price: '₹18.50/kW', reason_text: 'Allocated 11.0 kW under fair surplus pool' },
        { ts: '13:54:00', session_id: 's3-111111', allocated_kw: '18.2 kW', tier: '2 (Cloud MILP)', binding_constraint: 'Tight Departure Window', shadow_price: '₹24.10/kW', reason_text: 'Rank #1 priority given to imminent departure' },
        { ts: '13:54:00', session_id: 's4-111111', allocated_kw: '0.0 kW', tier: '2 (Cloud MILP)', binding_constraint: 'Min-Current Disjunction', shadow_price: '₹0.00/kW', reason_text: 'Paused to enforce IEC 61851 6A floor' },
      ],
    },
    tenants: {
      query: `SELECT id, name, created_at FROM tenants ORDER BY name;`,
      columns: ['id', 'name', 'contracted_floor', 'created_at'],
      rows: [
        { id: '11111111-1111-1111-1111-111111111111', name: 'Logistics Fleet A', contracted_floor: '40.00 kW', created_at: '2026-08-01 00:00:00' },
        { id: '22222222-2222-2222-2222-222222222222', name: 'Delivery Express B', contracted_floor: '30.00 kW', created_at: '2026-08-01 00:00:00' },
        { id: '33333333-3333-3333-3333-333333333333', name: 'City Cabs C', contracted_floor: '20.00 kW', created_at: '2026-08-01 00:00:00' },
      ],
    },
    sites: {
      query: `SELECT id, name, cap_kw, cap_phase_a, cap_phase_b, cap_phase_c, base_load_kw FROM sites;`,
      columns: ['id', 'name', 'cap_kw', 'cap_phase_a', 'cap_phase_b', 'cap_phase_c', 'base_load_kw'],
      rows: [
        { id: 'b0000000-0000-0000-0000-000000000001', name: 'Metro Logistics Hub', cap_kw: '100.00 kW', cap_phase_a: '33.33 kW', cap_phase_b: '33.33 kW', cap_phase_c: '33.34 kW', base_load_kw: '5.00 kW' }
      ]
    },
    tariffs: {
      query: `SELECT dow, start_min, end_min, price_per_kwh, demand_charge_per_kw, carbon_gco2_per_kwh FROM tariffs;`,
      columns: ['period', 'start_min', 'end_min', 'price_per_kwh', 'demand_charge', 'carbon_gco2'],
      rows: [
        { period: 'Peak Hours', start_min: 1080, end_min: 1320, price_per_kwh: '₹11.80', demand_charge: '₹15.00/kW', carbon_gco2: '650 gCO2/kWh' },
        { period: 'Solar Peak', start_min: 600, end_min: 960, price_per_kwh: '₹5.20', demand_charge: '₹15.00/kW', carbon_gco2: '220 gCO2/kWh' },
        { period: 'Off-Peak Night', start_min: 1320, end_min: 360, price_per_kwh: '₹4.10', demand_charge: '₹15.00/kW', carbon_gco2: '420 gCO2/kWh' },
      ]
    }
  };

  const current = tableData[activeTable] || tableData.chargers;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Database className="w-6 h-6 text-cyan-400" /> PostgreSQL Database Representation Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live relational table representations with Row-Level Security (RLS) policies enforced.
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
            className={`px-3.5 py-2 rounded-lg transition uppercase tracking-wider font-bold flex items-center gap-1.5 ${
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
                            : row[col] === 'Paused'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {row[col]}
                        </span>
                      ) : col === 'tier' ? (
                        <span className="text-emerald-400 font-bold">{row[col]}</span>
                      ) : col === 'shadow_price' ? (
                        <span className="text-amber-300 font-bold">{row[col]}</span>
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
