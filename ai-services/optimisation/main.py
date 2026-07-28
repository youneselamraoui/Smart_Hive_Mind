from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Optimisation IA - Repartition de taches")

POURCENTAGE_RESERVE_BASSE_REPUTATION = 0.20
SEUIL_REPUTATION_BASSE = 0.4


class Contributeur(BaseModel):
    id: str
    nom: str
    reputation: float


class RepartirTachesRequest(BaseModel):
    contributeurs: list[Contributeur]
    nombreDeLots: int


class LotAttribue(BaseModel):
    contributeurId: str
    nom: str
    lotsAttribues: int
    reputation: float


class Metriques(BaseModel):
    totalLots: int
    lotsHauteReputation: int
    lotsBasseReputation: int
    lotsReservesBasseReputation: int


class RepartirTachesResponse(BaseModel):
    repartition: list[LotAttribue]
    metriques: Metriques


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/optimisation/repartir-taches", response_model=RepartirTachesResponse)
async def repartir_taches(req: RepartirTachesRequest):
    if not req.contributeurs:
        raise HTTPException(status_code=400, detail="Aucun contributeur fourni.")
    if req.nombreDeLots < 1:
        raise HTTPException(status_code=400, detail="Le nombre de lots doit etre >= 1.")

    lots_restants = req.nombreDeLots

    basse_rep = [c for c in req.contributeurs if c.reputation < SEUIL_REPUTATION_BASSE]
    haute_rep = [c for c in req.contributeurs if c.reputation >= SEUIL_REPUTATION_BASSE]

    lots_reserves = max(1, round(lots_restants * POURCENTAGE_RESERVE_BASSE_REPUTATION))

    attribution: dict[str, int] = {c.id: 0 for c in req.contributeurs}

    if basse_rep:
        lots_br = lots_reserves // len(basse_rep)
        reste_br = lots_reserves % len(basse_rep)
        for i, c in enumerate(basse_rep):
            attribution[c.id] = lots_br + (1 if i < reste_br else 0)
        lots_restants -= sum(attribution[c.id] for c in basse_rep)
    else:
        lots_restants -= lots_reserves

    if haute_rep and lots_restants > 0:
        total_rep = sum(c.reputation for c in haute_rep)
        if total_rep > 0:
            for c in haute_rep:
                part = int((c.reputation / total_rep) * lots_restants)
                attribution[c.id] += part
                lots_restants -= part

        while lots_restants > 0:
            haute_rep.sort(key=lambda c: c.reputation, reverse=True)
            attribution[haute_rep[0].id] += 1
            lots_restants -= 1

    repartition = [
        LotAttribue(
            contributeurId=c.id,
            nom=c.nom,
            lotsAttribues=attribution.get(c.id, 0),
            reputation=c.reputation,
        )
        for c in req.contributeurs
    ]

    lots_haute = sum(a.lotsAttribues for a in repartition if a.reputation >= SEUIL_REPUTATION_BASSE)
    lots_basse = sum(a.lotsAttribues for a in repartition if a.reputation < SEUIL_REPUTATION_BASSE)

    return RepartirTachesResponse(
        repartition=repartition,
        metriques=Metriques(
            totalLots=req.nombreDeLots,
            lotsHauteReputation=lots_haute,
            lotsBasseReputation=lots_basse,
            lotsReservesBasseReputation=lots_reserves,
        ),
    )
