from fastapi import FastAPI, HTTPException
from .models import AllocateRequest, AllocateResponse, PlanRequest, PlanResponse, SimulateRequest, SimulateResponse
from .allocator import solve_stage_b
from .planner import solve_stage_a
from .simulator import run_acn_benchmark

app = FastAPI(
    title="Switchyard Optimizer Service",
    description="Stateless LP/MILP Solver Service for EV Fleet Charging Optimization",
    version="2.0.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "switchyard-optimizer"}

@app.post("/allocate", response_model=AllocateResponse)
def allocate_endpoint(req: AllocateRequest):
    try:
        return solve_stage_b(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/plan", response_model=PlanResponse)
def plan_endpoint(req: PlanRequest):
    try:
        return solve_stage_a(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate", response_model=SimulateResponse)
def simulate_endpoint(req: SimulateRequest):
    try:
        return run_acn_benchmark(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
