from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class SessionInput(BaseModel):
    session_id: str
    tenant_id: str
    charger_id: str
    connector_index: int = 1
    current_soc: float
    target_soc: float
    battery_capacity_kwh: float
    max_charge_rate_kw: float = 22.0
    min_charge_rate_kw: float = 4.14
    departure_time_iso: str
    phase_assignment: str = "L1,L2,L3" # "L1", "L2", "L3" or "L1,L2,L3"
    circuit_id: Optional[str] = None
    previous_kw: float = 0.0
    debt_kwh: float = 0.0

class TenantEntitlementInput(BaseModel):
    tenant_id: str
    floor_kw: float
    tier_weight: float = 1.0

class PhaseCapacities(BaseModel):
    L1: float = 33.33
    L2: float = 33.33
    L3: float = 33.34

class CircuitCapacities(BaseModel):
    circuit_id: str
    cap_kw: float

class AllocateRequest(BaseModel):
    site_cap_kw: float
    base_load_kw: float = 0.0
    phases: PhaseCapacities = Field(default_factory=PhaseCapacities)
    circuits: List[CircuitCapacities] = Field(default_factory=list)
    entitlements: List[TenantEntitlementInput] = Field(default_factory=list)
    sessions: List[SessionInput] = Field(default_factory=list)
    tariff_price_now: float = 0.15
    carbon_gco2_per_kwh: float = 250.0

class SimulateSessionInput(BaseModel):
    session_id: str
    tenant_id: str
    arrival_min: int
    departure_min: int
    energy_needed_kwh: float
    max_rate_kw: float = 22.0

class SimulateRequest(BaseModel):
    site_cap_kw: float = 100.0
    sessions: List[SimulateSessionInput]

class BaselineSeriesPoint(BaseModel):
    minute: int
    uncontrolled_kw: float
    naive_equal_kw: float
    switchyard_kw: float

class SimulateResponse(BaseModel):
    uncontrolled_peak_kw: float
    naive_peak_kw: float
    switchyard_peak_kw: float
    peak_reduction_percent: float
    deadline_compliance_percent: float
    time_series: List[BaselineSeriesPoint]

class AllocationResultItem(BaseModel):
    session_id: str
    tenant_id: str
    allocated_kw: float
    is_charging: bool
    is_paused: bool
    tier: int = 2
    binding_constraint: str
    shadow_price: float
    reason_text: str

class AllocateResponse(BaseModel):
    timestamp: str
    status: str
    site_total_allocated_kw: float
    allocations: List[AllocationResultItem]

class PlanBucketInput(BaseModel):
    bucket_index: int
    tariff_price: float
    carbon_gco2_per_kwh: float = 250.0

class PlanRequest(BaseModel):
    site_cap_kw: float
    demand_charge_per_kw: float = 15.0
    buckets: List[PlanBucketInput]
    sessions: List[SessionInput]

class PlanSessionResult(BaseModel):
    session_id: str
    planned_kw_per_bucket: List[float]
    target_soc_met: bool

class PlanResponse(BaseModel):
    status: str
    peak_draw_kw: float
    sessions: List[PlanSessionResult]
