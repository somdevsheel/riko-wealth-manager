"""Hindi translations for backend-generated text.

English is the default and always the fallback (`lang="en"` preserves every
existing response byte-for-byte, so nothing that already depends on the
English strings — including the test suite — breaks). Category, instrument,
goal, and factor NAMES stay in English as the underlying data identifiers
(the frontend has its own display-label translation for those); only the
free-text sentences generated here (tips, insights, explanations, Artha's
answers) switch language.
"""
from __future__ import annotations

Lang = str  # "en" | "hi"

CATEGORY_HI: dict[str, str] = {
    "Rent": "किराया",
    "Groceries": "किराना",
    "Dining": "बाहर खाना",
    "Transport": "परिवहन",
    "Utilities": "उपयोगिताएँ",
    "Shopping": "खरीदारी",
    "Entertainment": "मनोरंजन",
    "Health": "स्वास्थ्य",
    "Investment": "निवेश",
}

INSTRUMENT_HI: dict[str, str] = {
    "SIP": "एसआईपी",
    "FD": "एफडी",
    "ETF": "ईटीएफ",
    "Gold": "सोना",
}

RISK_PROFILE_HI: dict[str, str] = {
    "Conservative": "सतर्क",
    "Moderate": "मध्यम",
    "Aggressive": "आक्रामक",
}

FACTOR_LABEL_HI: dict[str, str] = {
    "savings_rate": "बचत दर",
    "spending_discipline": "खर्च अनुशासन",
    "investments": "निवेश",
    "goal_progress": "लक्ष्य प्रगति",
    "emergency_fund": "आपातकालीन निधि",
    "debt_ratio": "ऋण अनुपात",
}


def category(name: str, lang: Lang) -> str:
    return CATEGORY_HI.get(name, name) if lang == "hi" else name


def instrument(name: str, lang: Lang) -> str:
    return INSTRUMENT_HI.get(name, name) if lang == "hi" else name


def risk_profile(name: str, lang: Lang) -> str:
    return RISK_PROFILE_HI.get(name, name) if lang == "hi" else name


def factor_label(key: str, lang: Lang) -> str:
    return FACTOR_LABEL_HI.get(key, key) if lang == "hi" else key.replace("_", " ")


def pick(en: str, hi: str, lang: Lang) -> str:
    """Pick the English or Hindi variant of a static string."""
    return hi if lang == "hi" else en
