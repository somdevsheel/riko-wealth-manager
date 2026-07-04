"""Riko API routes."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Query

from app.core import service
from app.core.db import log_conversation
from app.engines import advisor, goals as goals_engine
from app.schemas.models import AffordabilityRequest, AskRequest

router = APIRouter(prefix="/api")

Lang = Literal["en", "hi"]


@router.get("/profile")
def profile():
    return service.get_profile()


@router.get("/dashboard")
def dashboard(lang: Lang = Query("en")):
    return service.get_dashboard(lang=lang)


@router.get("/spending")
def spending():
    return service.get_spending()


@router.get("/score")
def score(lang: Lang = Query("en")):
    return service.get_score(lang=lang)


@router.get("/recommendations")
def recommendations(lang: Lang = Query("en")):
    return service.get_recommendations(lang=lang)


@router.get("/goals")
def goals():
    return service.get_goals()


@router.post("/ask")
def ask(req: AskRequest):
    result = advisor.ask(
        req.question,
        service.get_profile(),
        service.get_spending(),
        service.get_score(lang=req.lang),
        service.get_goals(),
        service.get_recommendations(lang=req.lang),
        lang=req.lang,
    )
    try:
        log_conversation(result["question"], result["answer"], result["source"])
    except Exception as exc:  # noqa: BLE001 — conversation logging is best-effort
        print(f"[api] non-fatal conversation logging error: {exc}")
    return result


@router.post("/affordability")
def affordability(req: AffordabilityRequest):
    return goals_engine.affordability(
        service.get_profile(),
        service.get_spending(),
        req.purchase_price,
        req.down_payment_pct,
        req.loan_years,
        req.loan_rate,
        lang=req.lang,
    )
