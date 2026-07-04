"""Wealth Score engine.

Composite 0-100 score from six weighted factors. Every factor returns a
sub-score plus a one-line improvement tip so the UI and avatar can explain it.
"""
from __future__ import annotations

from typing import Any

from app.core.i18n import pick

WEIGHTS = {
    "savings_rate": 0.25,
    "spending_discipline": 0.15,
    "investments": 0.20,
    "goal_progress": 0.15,
    "emergency_fund": 0.15,
    "debt_ratio": 0.10,
}


def _clamp(x: float) -> float:
    return max(0.0, min(100.0, x))


def compute(profile: dict[str, Any], spend_summary: dict[str, Any],
            goal_progress_pct: float = 0.0, lang: str = "en") -> dict[str, Any]:
    income = profile["monthly_income"]
    savings_rate = spend_summary.get("savings_rate_pct", 0.0)

    # 1. Savings rate: 30%+ is excellent
    f_savings = _clamp(savings_rate / 30 * 100)

    # 2. Spending discipline: fewer overspend alerts is better
    n_alerts = len(spend_summary.get("overspending", []))
    f_discipline = _clamp(100 - n_alerts * 20)

    # 3. Investments: months of income invested (24 months = full marks)
    inv_months = profile["existing_investments"] / income if income else 0
    f_invest = _clamp(inv_months / 24 * 100)

    # 4. Goal progress (0-100 passed in)
    f_goals = _clamp(goal_progress_pct)

    # 5. Emergency fund: 6 months of income = full marks
    ef_months = profile["emergency_fund"] / income if income else 0
    f_emergency = _clamp(ef_months / 6 * 100)

    # 6. Debt ratio: EMI/income; <=10% ideal, >=50% is 0
    debt_ratio = profile["monthly_debt_emi"] / income if income else 0
    f_debt = _clamp((0.5 - debt_ratio) / 0.4 * 100)

    factors = {
        "savings_rate": {
            "score": round(f_savings),
            "tip": pick(
                "Aim for a 30% savings rate to max this factor." if f_savings < 100 else "Excellent savings rate.",
                "इस फैक्टर को अधिकतम करने के लिए 30% बचत दर का लक्ष्य रखें।" if f_savings < 100 else "उत्कृष्ट बचत दर।",
                lang,
            ),
        },
        "spending_discipline": {
            "score": round(f_discipline),
            "tip": pick(
                f"You have {n_alerts} overspending alert(s) this month." if n_alerts else "No overspending detected.",
                f"इस महीने आपके पास {n_alerts} अधिक-खर्च चेतावनी(याँ) हैं।" if n_alerts else "कोई अधिक खर्च नहीं पाया गया।",
                lang,
            ),
        },
        "investments": {
            "score": round(f_invest),
            "tip": pick(
                "Build investments toward ~24 months of income." if f_invest < 100 else "Strong investment base.",
                "आय के ~24 महीनों के बराबर निवेश बढ़ाएं।" if f_invest < 100 else "मजबूत निवेश आधार।",
                lang,
            ),
        },
        "goal_progress": {
            "score": round(f_goals),
            "tip": pick(
                "Fund your goals consistently to lift this factor." if f_goals < 100 else "Goals well on track.",
                "इस फैक्टर को बढ़ाने के लिए अपने लक्ष्यों में नियमित रूप से पैसा डालें।" if f_goals < 100 else "लक्ष्य अच्छी तरह से ट्रैक पर हैं।",
                lang,
            ),
        },
        "emergency_fund": {
            "score": round(f_emergency),
            "tip": pick(
                f"Emergency fund covers {ef_months:.1f} months; target 6." if f_emergency < 100 else "Emergency fund fully funded.",
                f"आपातकालीन निधि {ef_months:.1f} महीनों को कवर करती है; लक्ष्य 6 महीने।" if f_emergency < 100 else "आपातकालीन निधि पूरी तरह से वित्तपोषित है।",
                lang,
            ),
        },
        "debt_ratio": {
            "score": round(f_debt),
            "tip": pick(
                f"Your EMI is {debt_ratio*100:.0f}% of income; keep it under 10%." if f_debt < 100 else "Debt well under control.",
                f"आपकी ईएमआई आय का {debt_ratio*100:.0f}% है; इसे 10% से कम रखें।" if f_debt < 100 else "ऋण अच्छी तरह से नियंत्रण में है।",
                lang,
            ),
        },
    }

    total = sum(factors[k]["score"] * w for k, w in WEIGHTS.items())
    return {
        "score": round(total),
        "factors": factors,
        "weights": WEIGHTS,
    }
