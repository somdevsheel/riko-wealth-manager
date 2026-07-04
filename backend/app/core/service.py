"""Service layer: loads data from Postgres and assembles engine outputs.

Single synthetic user for this prototype (seeded via `python -m app.data.seed`);
swap the query filters for a real `user_id` once auth exists. Score computations
and dashboard insights are best-effort logged to MongoDB for history/audit —
logging failures never block the actual API response.
"""
from __future__ import annotations

from typing import Any

from app.core import i18n
from app.core.db import Goal, Profile, Transaction, get_session, log_insights, log_score
from app.engines import goals as goals_engine
from app.engines import recommend as recommend_engine
from app.engines import spending as spending_engine
from app.engines import wealth_score as score_engine


def get_profile() -> dict[str, Any]:
    with get_session() as session:
        profile = session.query(Profile).first()
        if profile is None:
            raise RuntimeError(
                "No profile found in Postgres — run `python -m app.data.seed` first."
            )
        return {
            "user_id": profile.id,
            "name": profile.name,
            "age": profile.age,
            "monthly_income": profile.monthly_income,
            "risk_profile": profile.risk_profile,
            "existing_investments": profile.existing_investments,
            "emergency_fund": profile.emergency_fund,
            "monthly_debt_emi": profile.monthly_debt_emi,
        }


def get_transactions() -> list[dict[str, Any]]:
    profile_id = get_profile()["user_id"]
    with get_session() as session:
        rows = session.query(Transaction).filter_by(profile_id=profile_id).all()
        return [
            {
                "date": t.date,
                "category": t.category,
                "merchant": t.merchant,
                "amount": t.amount,
                "type": t.type,
            }
            for t in rows
        ]


def get_spending() -> dict[str, Any]:
    return spending_engine.summary(get_transactions())


def get_goals() -> dict[str, Any]:
    profile_id = get_profile()["user_id"]
    surplus = max(get_spending()["savings"], 0)
    with get_session() as session:
        rows = session.query(Goal).filter_by(profile_id=profile_id).all()
        goals_list = [
            {"id": g.id, "name": g.name, "target": g.target, "months": g.months, "saved": g.saved}
            for g in rows
        ]
    return goals_engine.plan_goals(goals_list, surplus)


def get_score(lang: str = "en") -> dict[str, Any]:
    score = score_engine.compute(
        get_profile(), get_spending(), get_goals()["overall_progress_pct"], lang=lang
    )
    _try(lambda: log_score(get_profile()["user_id"], score["score"], score["factors"]))
    return score


def get_recommendations(lang: str = "en") -> dict[str, Any]:
    surplus = max(get_spending()["savings"], 0)
    return recommend_engine.recommend(get_profile(), surplus, lang=lang)


def get_dashboard(lang: str = "en") -> dict[str, Any]:
    profile = get_profile()
    spend = get_spending()
    score = get_score(lang=lang)
    goals = get_goals()
    insights = _insights(spend, score, lang=lang)
    _try(lambda: log_insights(profile["user_id"], insights))
    return {
        "profile": profile,
        "wealth_score": score["score"],
        "month": spend["month"],
        "income": spend["income"],
        "spending": spend["spending"],
        "savings": spend["savings"],
        "savings_rate_pct": spend["savings_rate_pct"],
        "investment_summary": {
            "existing": profile["existing_investments"],
            "recommended_monthly": get_recommendations(lang=lang)["investable"],
        },
        "goal_progress_pct": goals["overall_progress_pct"],
        "insights": insights,
    }


def _insights(spend: dict, score: dict, lang: str = "en") -> list[str]:
    out = []
    if spend["overspending"]:
        top = spend["overspending"][0]
        out.append(
            i18n.pick(
                f"Your {top['category']} spend is up {top['delta_pct']}% this month.",
                f"इस महीने आपका {i18n.category(top['category'], lang)} खर्च {top['delta_pct']}% बढ़ा है।",
                lang,
            )
        )
    if spend["savings_rate_pct"] >= 20:
        out.append(
            i18n.pick(
                f"You saved ₹{spend['savings']:,.0f} this month "
                f"({spend['savings_rate_pct']}%). Consider investing the surplus.",
                f"आपने इस महीने ₹{spend['savings']:,.0f} ({spend['savings_rate_pct']}%) बचाए। "
                f"अतिरिक्त राशि निवेश करने पर विचार करें।",
                lang,
            )
        )
    weakest = min(score["factors"].items(), key=lambda kv: kv[1]["score"])
    out.append(weakest[1]["tip"])
    return out


def _try(fn) -> None:
    """Run a best-effort side effect (Mongo logging) without failing the request."""
    try:
        fn()
    except Exception as exc:  # noqa: BLE001 — logging must never break the API
        print(f"[service] non-fatal logging error: {exc}")
