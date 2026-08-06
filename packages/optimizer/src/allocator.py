from datetime import datetime, timezone
from ortools.linear_solver import pywraplp
from .models import AllocateRequest, AllocateResponse, AllocationResultItem
from .urgency import calculate_urgency

def solve_stage_b(req: AllocateRequest) -> AllocateResponse:
    if not req.sessions:
        return AllocateResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            status="SUCCESS",
            site_total_allocated_kw=0.0,
            allocations=[]
        )

    # 1. First solve LP relaxation using GLOP to extract dual values (D2 Differentiator)
    lp_solver = pywraplp.Solver.CreateSolver('GLOP')
    if not lp_solver:
        raise RuntimeError("GLOP solver unavailable")

    p_lp = {}
    urgencies = {}
    entitlement_weights = {e.tenant_id: e.tier_weight for e in req.entitlements}

    for s in req.sessions:
        weight = entitlement_weights.get(s.tenant_id, 1.0)
        u = calculate_urgency(
            s.current_soc, s.target_soc, s.battery_capacity_kwh,
            s.max_charge_rate_kw, s.departure_time_iso, weight, s.debt_kwh
        )
        urgencies[s.session_id] = u
    # Site capacity constraint
    site_avail = max(0.0, req.site_cap_kw - req.base_load_kw)
    site_constraint_lp = lp_solver.Constraint(0.0, site_avail, "site_capacity")
    for s in req.sessions:
        site_constraint_lp.SetCoefficient(p_lp[s.session_id], 1.0)

    # Per-circuit capacity constraints
    circuit_constraints_lp = {}
    for circ in req.circuits:
        c_circ = lp_solver.Constraint(0.0, circ.cap_kw, f"circuit_capacity_{circ.circuit_id}")
        for s in req.sessions:
            if s.circuit_id == circ.circuit_id:
                c_circ.SetCoefficient(p_lp[s.session_id], 1.0)
        circuit_constraints_lp[circ.circuit_id] = c_circ
    phase_constraints_lp = {}

    for ph, cap_kw in phase_caps.items():
        c_ph = lp_solver.Constraint(0.0, cap_kw, f"phase_capacity_{ph}")
        for s in req.sessions:
            if ph in s.phase_assignment:
                num_phases = len([p for p in s.phase_assignment.split(',') if p])
                c_ph.SetCoefficient(p_lp[s.session_id], 1.0 / max(1, num_phases))
        phase_constraints_lp[ph] = c_ph

    # Tenant floor constraints using min(F_k, demand_k) per PLAN.md specification
    tenant_floors = {}
    for e in req.entitlements:
        tenant_demand = sum(s.max_charge_rate_kw for s in req.sessions if s.tenant_id == e.tenant_id)
        tenant_floors[e.tenant_id] = min(e.floor_kw, tenant_demand)

    tenant_constraints_lp = {}
    for tenant_id, target_floor in tenant_floors.items():
        c = lp_solver.Constraint(target_floor, lp_solver.infinity(), f"entitlement_{tenant_id}")
        for s in req.sessions:
            if s.tenant_id == tenant_id:
                c.SetCoefficient(p_lp[s.session_id], 1.0)
        tenant_constraints_lp[tenant_id] = c

    # LP Objective
    objective_lp = lp_solver.Objective()
    for s in req.sessions:
        objective_lp.SetCoefficient(p_lp[s.session_id], urgencies[s.session_id])
    objective_lp.SetMaximization()

    lp_status = lp_solver.Solve()

    # Extract Dual values from LP relaxation
    dual_site = site_constraint_lp.dual_value() if lp_status == pywraplp.Solver.OPTIMAL else 0.0
    tenant_duals = {}
    for t_id, c_lp in tenant_constraints_lp.items():
        tenant_duals[t_id] = c_lp.dual_value() if lp_status == pywraplp.Solver.OPTIMAL else 0.0

    # Carbon intensity penalty factor
    carbon_penalty_factor = (req.carbon_gco2_per_kwh / 1000.0) * 0.02

    # 2. Now solve true MILP with CBC solver (enforcing min-current disjunction 0 OR >= p_min)
    milp_solver = pywraplp.Solver.CreateSolver('CBC')
    if not milp_solver:
        milp_solver = pywraplp.Solver.CreateSolver('SCIP')

    milp_solver.set_time_limit(500) # Hard 500ms wall clock constraint per spec

    p = {}
    y = {}
    z = {}

    for s in req.sessions:
        p[s.session_id] = milp_solver.NumVar(0.0, s.max_charge_rate_kw, f"p_{s.session_id}")
        y[s.session_id] = milp_solver.BoolVar(f"y_{s.session_id}")
        z[s.session_id] = milp_solver.NumVar(0.0, 1.0, f"z_{s.session_id}")

        # Warm-starting hint based on previous allocation state
        prev_y = 1.0 if s.previous_kw > 0.5 else 0.0
        y[s.session_id].SetInitialSolveData(prev_y)

        # Min-current disjunction: p_min * y <= p <= p_max * y
        milp_solver.Add(p[s.session_id] >= s.min_charge_rate_kw * y[s.session_id])
        milp_solver.Add(p[s.session_id] <= s.max_charge_rate_kw * y[s.session_id])

        # Hysteresis anti-flapping linearisation: z >= |y - y_prev|
        milp_solver.Add(z[s.session_id] >= y[s.session_id] - prev_y)
        milp_solver.Add(z[s.session_id] >= prev_y - y[s.session_id])

    # Site cap constraint
    site_c = milp_solver.Constraint(0.0, site_avail, "milp_site_capacity")
    for s in req.sessions:
        site_c.SetCoefficient(p[s.session_id], 1.0)

    # Per-phase capacity constraints in CBC MILP solver (L1, L2, L3)
    milp_phase_constraints = {}
    for ph, cap_kw in phase_caps.items():
        c_ph_milp = milp_solver.Constraint(0.0, cap_kw, f"milp_phase_capacity_{ph}")
        for s in req.sessions:
            if ph in s.phase_assignment:
                num_phases = len([p_name for p_name in s.phase_assignment.split(',') if p_name])
                c_ph_milp.SetCoefficient(p[s.session_id], 1.0 / max(1, num_phases))
        milp_phase_constraints[ph] = c_ph_milp

    # Per-circuit capacity constraints in CBC MILP solver
    milp_circuit_constraints = {}
    for circ in req.circuits:
        c_circ_milp = milp_solver.Constraint(0.0, circ.cap_kw, f"milp_circuit_capacity_{circ.circuit_id}")
        for s in req.sessions:
            if s.circuit_id == circ.circuit_id:
                c_circ_milp.SetCoefficient(p[s.session_id], 1.0)
        milp_circuit_constraints[circ.circuit_id] = c_circ_milp

    # Tenant floor slack constraints: sum p_i + s_k >= min(F_k, demand_k)
    slack_vars = {}
    for tenant_id, floor_kw in tenant_floors.items():
        s_var = milp_solver.NumVar(0.0, milp_solver.infinity(), f"slack_{tenant_id}")
        slack_vars[tenant_id] = s_var

        c_t = milp_solver.Constraint(floor_kw, milp_solver.infinity(), f"milp_entitlement_{tenant_id}")
        c_t.SetCoefficient(s_var, 1.0)
        for s in req.sessions:
            if s.tenant_id == tenant_id:
                c_t.SetCoefficient(p[s.session_id], 1.0)

    # Objective: maximize urgency-weighted throughput - tariff cost - carbon penalty - tenant floor penalty - anti-flapping
    obj = milp_solver.Objective()
    for s in req.sessions:
        net_coeff = urgencies[s.session_id] - req.tariff_price_now - carbon_penalty_factor
        obj.SetCoefficient(p[s.session_id], net_coeff)
        obj.SetCoefficient(z[s.session_id], -0.05) # anti-flapping penalty

    for s_var in slack_vars.values():
        obj.SetCoefficient(s_var, -100.0) # Large penalty for breaching floor

    obj.SetMaximization()

    status = milp_solver.Solve()

    results = []
    total_alloc = 0.0

    for s in req.sessions:
        alloc_kw = p[s.session_id].solution_value() if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE) else 0.0
        is_on = y[s.session_id].solution_value() > 0.5
        total_alloc += alloc_kw

        # Construct D2 Explainability Receipt
        binding_constr = "None"
        shadow_price = 0.0
        reason = ""

        if alloc_kw < s.max_charge_rate_kw:
            if abs(dual_site) > 0.001:
                binding_constr = "Site Capacity"
                shadow_price = round(dual_site * 100, 2)
                reason = f"Site capacity is binding ({shadow_price} ₹/kW). High-urgency departures outrank this session."
            elif tenant_duals.get(s.tenant_id, 0.0) > 0.001:
                binding_constr = "Tenant Floor Floor Protection"
                shadow_price = round(tenant_duals[s.tenant_id] * 100, 2)
                reason = f"Protected tenant floor guarantee of {tenant_floors.get(s.tenant_id, 0)} kW is currently active."
            elif not is_on:
                binding_constr = "Min-Current Disjunction Floor"
                shadow_price = 0.0
                reason = f"Paused — rotating back in ~4 min to satisfy 6A IEC floor without exceeding site limit."
            else:
                reason = "Allocation optimized by laxity urgency score."
        else:
            reason = "Charging at maximum vehicle rate (22 kW)."

        results.append(AllocationResultItem(
            session_id=s.session_id,
            tenant_id=s.tenant_id,
            allocated_kw=round(alloc_kw, 2),
            is_charging=is_on and alloc_kw > 0.1,
            is_paused=not is_on,
            tier=2,
            binding_constraint=binding_constr,
            shadow_price=shadow_price,
            reason_text=reason
        ))

    return AllocateResponse(
        timestamp=datetime.now(timezone.utc).isoformat(),
        status="FEASIBLE" if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE) else "INFEASIBLE",
        site_total_allocated_kw=round(total_alloc, 2),
        allocations=results
    )
