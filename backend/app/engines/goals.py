"""Goal planning engine.

Computes required monthly contribution, feasibility against surplus, and
progress for financial goals (home, education, vacation, emergency, retirement).
"""
from __future__ import annotations

from typing import Any

# simple future-value-of-annuity feasibility using an assumed annual return
ASSUMED_ANNUAL_RETURN = 0.10

DEFAULT_GOALS = [
    {"id": "emergency", "name": "Emergency Fund", "target": 300000, "months": 18, "saved": 45000},
    {"id": "vacation", "name": "Vacation", "target": 200000, "months": 12, "saved": 30000},
    {"id": "home", "name": "Home Down Payment", "target": 2000000, "months": 60, "saved": 250000},
    {"id": "education", "name": "Education Fund", "target": 1500000, "months": 96, "saved": 100000},
    {"id": "retirement", "name": "Retirement", "target": 10000000, "months": 300, "saved": 240000},
]


def _required_monthly(target: float, saved: float, months: int) -> float:
    remaining = max(target - saved, 0)
    r = ASSUMED_ANNUAL_RETURN / 12
    n = months
    if n <= 0:
        return remaining
    # PMT for future value with monthly compounding
    factor = ((1 + r) ** n - 1) / r
    return round(remaining / factor, 2) if factor else remaining


def plan_goals(goals: list[dict[str, Any]] | None,
               monthly_surplus: float) -> dict[str, Any]:
    goals = goals or DEFAULT_GOALS
    planned = []
    total_required = 0.0
    for g in goals:
        required = _required_monthly(g["target"], g["saved"], g["months"])
        total_required += required
        progress = round(g["saved"] / g["target"] * 100, 1) if g["target"] else 0.0
        planned.append({
            **g,
            "progress_pct": progress,
            "required_monthly": required,
        })
    overall_progress = round(
        sum(p["progress_pct"] for p in planned) / len(planned), 1
    ) if planned else 0.0
    return {
        "goals": planned,
        "total_required_monthly": round(total_required, 2),
        "surplus_available": round(monthly_surplus, 2),
        "feasible": monthly_surplus >= total_required,
        "overall_progress_pct": overall_progress,
    }


def affordability(profile: dict[str, Any], spend_summary: dict[str, Any],
                  purchase_price: float, down_payment_pct: float = 0.2,
                  loan_years: int = 5, loan_rate: float = 0.095,
                  lang: str = "en") -> dict[str, Any]:
    """Answer 'Can I afford X?' with EMI impact on savings rate."""
    income = profile["monthly_income"]
    down = purchase_price * down_payment_pct
    principal = purchase_price - down
    r = loan_rate / 12
    n = loan_years * 12
    emi = round(principal * r * (1 + r) ** n / ((1 + r) ** n - 1), 2) if r else principal / n

    current_savings = spend_summary.get("savings", 0)
    current_rate = spend_summary.get("savings_rate_pct", 0)
    new_savings = current_savings - emi
    new_rate = round(new_savings / income * 100, 1) if income else 0

    verdict = "affordable" if new_rate >= 10 else "tight"
    if lang == "hi":
        verdict_hi = "\u0915\u093F\u092B\u093E\u092F\u0924\u0940" if verdict == "affordable" else "\u0925\u094B\u0921\u093C\u093E \u092E\u0941\u0936\u094D\u0915\u093F\u0932"
        explanation = (
            f"\u20B9{down:,.0f} \u0921\u093E\u0909\u0928 \u092A\u0947\u092E\u0947\u0902\u091F \u0914\u0930 {loan_years} \u0935\u0930\u094D\u0937\u094B\u0902 \u092E\u0947\u0902 \u20B9{emi:,.0f} \u0915\u0940 \u0908\u090F\u092E\u0906\u0908 \u0938\u0947 "
            f"\u0906\u092A\u0915\u0940 \u092C\u091A\u0924 \u0926\u0930 {current_rate}% \u0938\u0947 {new_rate}% \u0939\u094B \u091C\u093E\u090F\u0917\u0940\u0964 "
            f"\u092F\u0939 {verdict_hi} \u0932\u0917\u0924\u093E \u0939\u0948\u0964"
        )
    else:
        explanation = (
            f"A \u20B9{down:,.0f} down payment and \u20B9{emi:,.0f} EMI over {loan_years} years "
            f"would move your savings rate from {current_rate}% to {new_rate}%. "
            f"This looks {verdict}."
        )
    return {
        "purchase_price": purchase_price,
        "down_payment": round(down, 2),
        "loan_amount": round(principal, 2),
        "emi": emi,
        "loan_years": loan_years,
        "current_savings_rate_pct": current_rate,
        "new_savings_rate_pct": new_rate,
        "verdict": verdict,
        "explanation": explanation,
    }
