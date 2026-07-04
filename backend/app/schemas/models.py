"""Pydantic request/response schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Lang = Literal["en", "hi"]


class AskRequest(BaseModel):
    question: str
    lang: Lang = "en"


class AffordabilityRequest(BaseModel):
    purchase_price: float
    down_payment_pct: float = 0.2
    loan_years: int = 5
    loan_rate: float = 0.095
    lang: Lang = "en"


class GoalItem(BaseModel):
    id: str
    name: str
    target: float
    months: int
    saved: float
