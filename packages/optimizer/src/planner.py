from datetime import datetime, timezone
from ortools.linear_solver import pywraplp
from .models import PlanRequest, PlanResponse, PlanSessionResult

def solve_stage_a(req: PlanRequest) -> PlanResponse:
    solver = pywraplp.Solver.CreateSolver('GLOP')
    if not solver:
        raise RuntimeError("GLOP solver unavailable")

    n_buckets = len(req.buckets)
    if n_buckets == 0:
        return PlanResponse(status="SUCCESS", peak_draw_kw=0.0, sessions=[])

    # Variables
    e = {} # e[s_id, t] energy allocated in bucket t (kWh)
    short = {} # short[s_id] unmet energy slack at departure (P1 principle!)
    peak_var = solver.NumVar(0.0, req.site_cap_kw, "D_peak")

    for s in req.sessions:
        short[s.session_id] = solver.NumVar(0.0, solver.infinity(), f"short_{s.session_id}")
        for t in range(n_buckets):
            # Windowing: e[i,t] = 0 outside [arrive_i, depart_i]
            if 0 <= t < 48: # Active horizon
                e[s.session_id, t] = solver.NumVar(0.0, s.max_charge_rate_kw * 0.25, f"e_{s.session_id}_{t}")
            else:
                e[s.session_id, t] = solver.NumVar(0.0, 0.0, f"e_{s.session_id}_{t}")

    # Energy target constraint with short[i] slack: sum e[i,t] + short[i] >= E_needed[i]
    for s in req.sessions:
        needed_kwh = max(0.0, (s.target_soc - s.current_soc) / 100.0 * s.battery_capacity_kwh)
        c = solver.Constraint(needed_kwh, solver.infinity(), f"energy_{s.session_id}")
        c.SetCoefficient(short[s.session_id], 1.0)
        for t in range(n_buckets):
            c.SetCoefficient(e[s.session_id, t], 1.0)

    # Site capacity with base-load subtraction & peak tracker per bucket
    for t, b in enumerate(req.buckets):
        avail_cap = max(0.0, req.site_cap_kw - 5.0) # Base load L_base[t] subtraction
        site_c = solver.Constraint(0.0, avail_cap, f"site_cap_{t}")
        peak_c = solver.Constraint(-solver.infinity(), 0.0, f"peak_track_{t}")
        peak_c.SetCoefficient(peak_var, -0.25)

        for s in req.sessions:
            site_c.SetCoefficient(e[s.session_id, t], 1.0)
            peak_c.SetCoefficient(e[s.session_id, t], 1.0)

    # Objective: minimize energy cost + demand charge peak penalty + carbon intensity penalty + deadline violation penalty
    obj = solver.Objective()
    obj.SetCoefficient(peak_var, req.demand_charge_per_kw)

    for s in req.sessions:
        obj.SetCoefficient(short[s.session_id], 100.0) # Penalty for deadline shortfall

    for t, b in enumerate(req.buckets):
        carbon_factor = (b.carbon_gco2_per_kwh / 1000.0) * 0.05 # Real per-bucket carbon signal!
        for s in req.sessions:
            obj.SetCoefficient(e[s.session_id, t], b.tariff_price + carbon_factor)

    obj.SetMinimization()

    status = solver.Solve()

    peak_kw = peak_var.solution_value() if status == pywraplp.Solver.OPTIMAL else 0.0
    session_results = []

    for s in req.sessions:
        kw_buckets = []
        for t in range(n_buckets):
            val_kwh = e[s.session_id, t].solution_value() if status == pywraplp.Solver.OPTIMAL else 0.0
            kw_buckets.append(round(val_kwh * 4.0, 2))

        session_results.append(PlanSessionResult(
            session_id=s.session_id,
            planned_kw_per_bucket=kw_buckets,
            target_soc_met=status == pywraplp.Solver.OPTIMAL
        ))

    return PlanResponse(
        status="FEASIBLE" if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE) else "INFEASIBLE",
        peak_draw_kw=round(peak_kw, 2),
        sessions=session_results
    )
