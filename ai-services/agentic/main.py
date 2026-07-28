import logging

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel, field_validator

from src.orchestrator import AtelierOrchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agentic")

app = FastAPI(title="Agentic IA - Orchestrateur")

_running: set[str] = set()


class StepItem(BaseModel):
    label: str
    url: str
    method: str = "POST"
    payload: dict = {}

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str):
        v = v.upper()
        if v not in ("GET", "POST", "PUT", "DELETE"):
            raise ValueError("Method must be one of: GET, POST, PUT, DELETE")
        return v


class RunWorkshopRequest(BaseModel):
    atelierId: str
    steps: list[StepItem]


class RunWorkshopResponse(BaseModel):
    statut: str
    atelierId: str


class WorkshopStatusResponse(BaseModel):
    atelierId: str
    enCours: bool


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/agentic/run-workshop", response_model=RunWorkshopResponse)
async def run_workshop(req: RunWorkshopRequest, tasks: BackgroundTasks):
    if req.atelierId in _running:
        raise HTTPException(status_code=409, detail="Cet atelier est deja en cours.")

    _running.add(req.atelierId)
    steps_dict = [s.model_dump() for s in req.steps]
    orchestrator = AtelierOrchestrator(req.atelierId)

    async def _run():
        try:
            await orchestrator.run_workshop(steps_dict)
        finally:
            _running.discard(req.atelierId)

    tasks.add_task(_run)
    logger.info("Workshop %s launched with %d steps", req.atelierId, len(req.steps))
    return RunWorkshopResponse(statut="lance", atelierId=req.atelierId)


@app.get("/agentic/workshop-status/{atelier_id}", response_model=WorkshopStatusResponse)
async def workshop_status(atelier_id: str):
    return WorkshopStatusResponse(atelierId=atelier_id, enCours=atelier_id in _running)
