"""AI advisor layer.

Wraps the LLM + RAG call. If no LLM is configured, falls back to a deterministic
rule-based responder so the prototype runs end-to-end with zero external
dependencies.

Real LLM+RAG path (`_llm_answer`): the user's financial state is embedded into a
local ChromaDB collection as a handful of short documents (profile, spending,
score, goals, recommendations); each question retrieves the most relevant few
and a local Ollama model (Llama/Qwen, via LangChain) answers grounded only in
that retrieved text. All financial *numbers* still come from the deterministic
engines — the LLM only explains and converses, so it can't hallucinate figures.

Gated behind LLM_ENABLED=1. If the LLM path raises or returns nothing, `ask()`
falls back to the rule-based responder, so the demo never breaks.

`lang` ("en" | "hi") selects Artha's response language on both paths: the
rule-based responder matches English or Hindi keywords and returns pre-written
Hindi strings, and the LLM path swaps in a Hindi system prompt instructing the
model to answer in Hindi (English is the default either way).
"""
from __future__ import annotations

import os
import re
from functools import lru_cache
from typing import Any

from app.core import i18n
from app.engines import goals as goals_engine

LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:7b-instruct")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
CHROMA_DIR = os.getenv("CHROMA_DIR", "chroma_store")

SYSTEM_PROMPT_EN = (
    "You are Artha, Riko's AI wealth advisor embedded in a bank's app. Answer "
    "the user's question using ONLY the CONTEXT below, which holds their real "
    "financial numbers for this month. Never invent or recompute a figure — "
    "quote the ones given. If the context doesn't cover the question, say so "
    "briefly and suggest which screen to check. Keep answers to 2-4 sentences, "
    "warm but professional, no markdown."
)

SYSTEM_PROMPT_HI = (
    "आप अर्थ (Artha) हैं, रीको (Riko) का AI वेल्थ एडवाइजर, जो एक बैंक के ऐप में एकीकृत है। "
    "नीचे दिए गए CONTEXT का उपयोग करके ही उपयोगकर्ता के प्रश्न का उत्तर दें, जिसमें उनके इस महीने "
    "के वास्तविक वित्तीय आंकड़े हैं। कभी भी कोई आंकड़ा न बनाएं या दोबारा गणना न करें — दिए गए आंकड़ों "
    "को ही उद्धृत करें। यदि CONTEXT प्रश्न को कवर नहीं करता है, तो संक्षेप में बताएं और सुझाव दें कि "
    "कौन सी स्क्रीन देखें। उत्तर 2-4 वाक्यों में रखें, गर्मजोशी भरे लेकिन पेशेवर, बिना मार्कडाउन के। "
    "हमेशा हिंदी में उत्तर दें।"
)


def _rule_based_answer(question: str, profile: dict[str, Any],
                       spend_summary: dict[str, Any], score: dict[str, Any],
                       lang: str = "en") -> str:
    q = question.lower()

    # affordability: "can i afford a 12 lakh car" / "क्या मैं 12 लाख की कार खरीद सकता हूं"
    m = re.search(r"(\d+(?:\.\d+)?)\s*(lakh|lac|l\b|crore|cr|लाख|करोड़)", q)
    if ("afford" in q or "खरीद" in q) and m:
        val = float(m.group(1))
        unit = m.group(2)
        price = val * (1e7 if unit in ("cr", "crore", "करोड़") else 1e5)
        aff = goals_engine.affordability(profile, spend_summary, price, lang=lang)
        return aff["explanation"]

    if ("sip" in q and "fd" in q) or ("एसआईपी" in q and "एफडी" in q):
        return i18n.pick(
            "SIPs suit long-term goals (higher growth, market-linked); FDs suit "
            "short-term needs and capital safety. With your moderate risk profile, "
            "a blend — more SIP, some FD — balances growth and stability.",
            "एसआईपी दीर्घकालिक लक्ष्यों के लिए उपयुक्त है (अधिक वृद्धि, बाजार से जुड़ा हुआ); "
            "एफडी अल्पकालिक जरूरतों और पूंजी सुरक्षा के लिए उपयुक्त है। आपकी मध्यम जोखिम "
            "प्रोफ़ाइल के साथ, एक मिश्रण — अधिक एसआईपी, कुछ एफडी — विकास और स्थिरता को संतुलित करता है।",
            lang,
        )

    if ("wealth score" in q or ("score" in q and "low" in q)) or (
        "स्कोर" in q and ("कम" in q or "क्यों" in q)
    ):
        weakest = min(score["factors"].items(), key=lambda kv: kv[1]["score"])
        if lang == "hi":
            return (
                f"आपका वेल्थ स्कोर {score['score']}/100 है। अभी सबसे बड़ा सुधार क्षेत्र है "
                f"'{i18n.factor_label(weakest[0], lang)}': {weakest[1]['tip']}"
            )
        return (
            f"Your wealth score is {score['score']}/100. The biggest lever right now "
            f"is '{weakest[0].replace('_', ' ')}': {weakest[1]['tip']}"
        )

    if ("invest" in q and ("how much" in q or "monthly" in q)) or (
        "निवेश" in q and ("कितना" in q or "मासिक" in q)
    ):
        surplus = max(spend_summary["savings"], 0)
        return i18n.pick(
            f"Based on your ₹{surplus:,.0f} monthly surplus, investing around "
            f"₹{surplus*0.9:,.0f}/month (keeping ~10% liquid) is a reasonable target. "
            "See your Investment Recommendations for the split.",
            f"आपके ₹{surplus:,.0f} मासिक अधिशेष के आधार पर, लगभग ₹{surplus*0.9:,.0f}/माह "
            "निवेश करना एक उचित लक्ष्य है (लगभग 10% तरल रखते हुए)। विभाजन के लिए अपनी "
            "निवेश सिफारिशें देखें।",
            lang,
        )

    return i18n.pick(
        "I can help with affordability, SIP vs FD, improving your wealth score, or "
        "how much to invest monthly. Ask me something like 'Can I afford a ₹12 lakh car?'",
        "मैं किफायत, एसआईपी बनाम एफडी, अपना वेल्थ स्कोर सुधारने, या मासिक कितना निवेश करना है "
        "में मदद कर सकता हूं। मुझसे कुछ ऐसा पूछें जैसे 'क्या मैं ₹12 लाख की कार खरीद सकता हूं?'",
        lang,
    )


def _context_documents(profile: dict[str, Any], spend_summary: dict[str, Any],
                       score: dict[str, Any], goals: dict[str, Any] | None,
                       recommendations: dict[str, Any] | None,
                       lang: str = "en") -> list[dict[str, str]]:
    """Break the user's financial state into small, independently retrievable docs."""
    docs = [
        {
            "id": "profile",
            "text": (
                f"Profile: {profile['name']}, age {profile['age']}, monthly income "
                f"₹{profile['monthly_income']:,}, risk profile {profile['risk_profile']}, "
                f"existing investments ₹{profile['existing_investments']:,}, emergency "
                f"fund ₹{profile['emergency_fund']:,}, monthly debt EMI "
                f"₹{profile['monthly_debt_emi']:,}."
            ),
        },
        {
            "id": "spending",
            "text": (
                f"This month ({spend_summary['month']}): income "
                f"₹{spend_summary['income']:,.0f}, spending "
                f"₹{spend_summary['spending']:,.0f}, savings "
                f"₹{spend_summary['savings']:,.0f} "
                f"({spend_summary['savings_rate_pct']}% savings rate). Top categories: "
                + ", ".join(
                    f"{i18n.category(cat, lang)} ₹{amt:,.0f}"
                    for cat, amt in list(spend_summary["by_category"].items())[:5]
                )
                + "."
            ),
        },
        {
            "id": "score",
            "text": (
                f"Wealth score {score['score']}/100. Factors: "
                + "; ".join(
                    f"{i18n.factor_label(key, lang)} {val['score']}/100 ({val['tip']})"
                    for key, val in score["factors"].items()
                )
            ),
        },
    ]

    if spend_summary.get("overspending"):
        docs.append({
            "id": "overspending",
            "text": "Overspending alerts: " + "; ".join(
                f"{i18n.category(a['category'], lang)} up {a['delta_pct']}% "
                f"(₹{a['current']:,.0f} vs average ₹{a['average']:,.0f})"
                for a in spend_summary["overspending"]
            ) + ".",
        })

    if spend_summary.get("recurring"):
        docs.append({
            "id": "recurring",
            "text": "Recurring expenses: " + "; ".join(
                f"{r['merchant']} ~₹{r['avg_amount']:,.0f}/month"
                for r in spend_summary["recurring"]
            ) + ".",
        })

    if goals and goals.get("goals"):
        docs.append({
            "id": "goals",
            "text": (
                f"Goals ({goals['overall_progress_pct']}% overall progress, "
                f"{'feasible' if goals['feasible'] else 'not fully feasible'} at current surplus): "
                + "; ".join(
                    f"{g['name']} — ₹{g['saved']:,.0f} of ₹{g['target']:,.0f} saved, "
                    f"needs ₹{g['required_monthly']:,.0f}/month"
                    for g in goals["goals"]
                )
            ),
        })

    if recommendations and recommendations.get("recommendations"):
        docs.append({
            "id": "recommendations",
            "text": (
                f"Recommended monthly investments (risk profile "
                f"{i18n.risk_profile(recommendations['risk_profile'], lang)}, "
                f"₹{recommendations['investable']:,.0f} investable): "
                + "; ".join(
                    f"{i18n.instrument(r['instrument'], lang)} ₹{r['monthly_amount']:,.0f}/month "
                    f"({r['expected_return']} p.a.)"
                    for r in recommendations["recommendations"]
                )
            ),
        })

    return docs


@lru_cache(maxsize=1)
def _get_collection():
    import chromadb

    client = chromadb.PersistentClient(path=CHROMA_DIR)
    return client.get_or_create_collection("riko_context")


def _index_context(profile: dict[str, Any], spend_summary: dict[str, Any],
                   score: dict[str, Any], goals: dict[str, Any] | None,
                   recommendations: dict[str, Any] | None, lang: str = "en") -> None:
    docs = _context_documents(profile, spend_summary, score, goals, recommendations, lang)
    _get_collection().upsert(
        ids=[d["id"] for d in docs],
        documents=[d["text"] for d in docs],
    )


def _retrieve(question: str, n_results: int = 4) -> list[str]:
    collection = _get_collection()
    if collection.count() == 0:
        return []
    results = collection.query(
        query_texts=[question], n_results=min(n_results, collection.count())
    )
    return results["documents"][0] if results["documents"] else []


def _llm_answer(question: str, profile: dict[str, Any], spend_summary: dict[str, Any],
                score: dict[str, Any], goals: dict[str, Any] | None = None,
                recommendations: dict[str, Any] | None = None,
                lang: str = "en") -> str | None:
    """Retrieve grounded context from Chroma and call a local Ollama model via LangChain.

    Returns None (falling back to the rule-based responder) if LLM_ENABLED isn't
    set, or if anything in the pipeline fails — the demo never breaks.
    """
    if os.getenv("LLM_ENABLED") != "1":
        return None

    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_ollama import ChatOllama

        _index_context(profile, spend_summary, score, goals, recommendations, lang)
        retrieved = _retrieve(question)
        context_block = "\n".join(f"- {doc}" for doc in retrieved) or "No specific context retrieved."

        system_prompt = SYSTEM_PROMPT_HI if lang == "hi" else SYSTEM_PROMPT_EN
        llm = ChatOllama(model=LLM_MODEL, base_url=OLLAMA_BASE_URL, temperature=0.3)
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"CONTEXT:\n{context_block}\n\nQUESTION: {question}"),
        ])
        answer = (response.content or "").strip()
        return answer or None
    except Exception:
        return None


def ask(question: str, profile: dict[str, Any], spend_summary: dict[str, Any],
        score: dict[str, Any], goals: dict[str, Any] | None = None,
        recommendations: dict[str, Any] | None = None, lang: str = "en") -> dict[str, Any]:
    answer = _llm_answer(question, profile, spend_summary, score, goals, recommendations, lang)
    source = "llm"
    if answer is None:
        answer = _rule_based_answer(question, profile, spend_summary, score, lang)
        source = "rule_based"
    return {"question": question, "answer": answer, "source": source}
