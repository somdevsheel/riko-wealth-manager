"""Investment recommendation engine.

Rule-based, explainable allocation of monthly surplus across SIP / FD / ETF / Gold
based on the user's risk profile. Each recommendation carries a plain-language
"why" so the avatar and UI can justify it.
"""
from __future__ import annotations

from typing import Any

from app.core import i18n

# allocation weights by risk profile
ALLOCATIONS = {
    "Conservative": {"FD": 0.45, "SIP": 0.25, "Gold": 0.20, "ETF": 0.10},
    "Moderate":     {"SIP": 0.45, "FD": 0.25, "ETF": 0.20, "Gold": 0.10},
    "Aggressive":   {"SIP": 0.50, "ETF": 0.30, "Gold": 0.10, "FD": 0.10},
}

EXPECTED_RETURN = {  # indicative annual ranges, for explanation only
    "SIP": "10-12%", "ETF": "9-11%", "FD": "6.5-7.5%", "Gold": "7-9%",
}

RATIONALE = {
    "SIP": "equity mutual funds for long-term growth via rupee-cost averaging",
    "ETF": "low-cost index exposure for diversified market growth",
    "FD": "capital protection and guaranteed returns for stability",
    "Gold": "an inflation hedge and portfolio diversifier",
}

RATIONALE_HI = {
    "SIP": "रुपी-कॉस्ट एवरेजिंग के जरिए दीर्घकालिक वृद्धि के लिए इक्विटी म्यूचुअल फंड",
    "ETF": "विविध बाजार वृद्धि के लिए कम लागत वाला इंडेक्स एक्सपोजर",
    "FD": "स्थिरता के लिए पूंजी सुरक्षा और गारंटीड रिटर्न",
    "Gold": "मुद्रास्फीति से बचाव और पोर्टफोलियो विविधीकरण",
}


def recommend(profile: dict[str, Any], monthly_surplus: float, lang: str = "en") -> dict[str, Any]:
    risk = profile.get("risk_profile", "Moderate")
    alloc = ALLOCATIONS.get(risk, ALLOCATIONS["Moderate"])

    # keep at least 10% of surplus liquid
    investable = round(monthly_surplus * 0.9, 2)

    recs = []
    for instrument, weight in sorted(alloc.items(), key=lambda x: -x[1]):
        amount = round(investable * weight, 2)
        if amount < 100:
            continue
        if lang == "hi":
            why = (
                f"{i18n.risk_profile(risk, lang)} जोखिम प्रोफ़ाइल के साथ, "
                f"₹{amount:,.0f}/माह {i18n.instrument(instrument, lang)} में निवेश "
                f"{RATIONALE_HI[instrument]} प्रदान करता है "
                f"(सांकेतिक {EXPECTED_RETURN[instrument]} प्रति वर्ष)।"
            )
        else:
            why = (
                f"With a {risk.lower()} risk profile, "
                f"₹{amount:,.0f}/month into {instrument} provides "
                f"{RATIONALE[instrument]} (indicative {EXPECTED_RETURN[instrument]} p.a.)."
            )
        recs.append({
            "instrument": instrument,
            "monthly_amount": amount,
            "expected_return": EXPECTED_RETURN[instrument],
            "why": why,
        })

    return {
        "risk_profile": risk,
        "monthly_surplus": round(monthly_surplus, 2),
        "investable": investable,
        "recommendations": recs,
    }
