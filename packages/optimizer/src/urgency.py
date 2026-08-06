from datetime import datetime, timezone
import math

def calculate_urgency(
    current_soc: float,
    target_soc: float,
    battery_capacity_kwh: float,
    max_charge_rate_kw: float,
    departure_time_iso: str,
    tier_weight: float = 1.0,
    debt_kwh: float = 0.0
) -> float:
    """
    u[i] = tier_weight * (E_needed / max(eps, T_remaining * p_max)) + delta * debt
    Laxity ratio = 1.0 means vehicle must charge flat out until departure to hit target.
    """
    needed_soc = max(0.0, target_soc - current_soc)
    needed_kwh = (needed_soc / 100.0) * battery_capacity_kwh

    if needed_kwh <= 0.001:
        return 0.1 # fully charged / minimal urgency

    now = datetime.now(timezone.utc)
    try:
        dep_time = datetime.fromisoformat(departure_time_iso.replace("Z", "+00:00"))
        remaining_hours = max(0.01, (dep_time - now).total_seconds() / 3600.0)
    except Exception:
        remaining_hours = 2.0 # fallback 2h

    max_possible_kwh = remaining_hours * max_charge_rate_kw
    laxity_ratio = needed_kwh / max(0.01, max_possible_kwh)

    # Base urgency derived from laxity & tenant tier weight + fairness debt bonus
    delta_debt = 0.1 * max(0.0, debt_kwh)
    urgency = (tier_weight * laxity_ratio) + delta_debt

    return float(max(0.1, urgency))
