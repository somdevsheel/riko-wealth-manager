"""Spending analysis engine.

Deterministic, auditable analytics over transaction data:
category breakdown, monthly trends, overspending detection, recurring expenses.
"""
from __future__ import annotations

from collections import defaultdict
from statistics import mean
from typing import Any


def _month_key(iso_date: str) -> str:
    return iso_date[:7]  # YYYY-MM


def category_breakdown(txns: list[dict[str, Any]], month: str | None = None) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    for t in txns:
        if t["type"] != "debit":
            continue
        if month and _month_key(t["date"]) != month:
            continue
        totals[t["category"]] += t["amount"]
    return {k: round(v, 2) for k, v in sorted(totals.items(), key=lambda x: -x[1])}


def monthly_trend(txns: list[dict[str, Any]]) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    for t in txns:
        if t["type"] == "debit":
            totals[_month_key(t["date"])] += t["amount"]
    return {k: round(v, 2) for k, v in sorted(totals.items())}


def latest_month(txns: list[dict[str, Any]]) -> str:
    return max(_month_key(t["date"]) for t in txns)


def overspending(txns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Flag categories where the latest month exceeds the prior-month average by >15%."""
    months = sorted({_month_key(t["date"]) for t in txns})
    if len(months) < 2:
        return []
    latest = months[-1]
    prior = months[:-1]

    latest_cat = category_breakdown(txns, latest)
    prior_avgs: dict[str, float] = {}
    for cat in latest_cat:
        vals = [category_breakdown(txns, m).get(cat, 0.0) for m in prior]
        vals = [v for v in vals if v > 0]
        if vals:
            prior_avgs[cat] = mean(vals)

    alerts = []
    for cat, cur in latest_cat.items():
        avg = prior_avgs.get(cat)
        if avg and cur > avg * 1.15:
            alerts.append({
                "category": cat,
                "current": round(cur, 2),
                "average": round(avg, 2),
                "delta_pct": round((cur - avg) / avg * 100, 1),
            })
    return sorted(alerts, key=lambda a: -a["delta_pct"])


def recurring_expenses(txns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Merchants appearing in every month are treated as recurring."""
    months = sorted({_month_key(t["date"]) for t in txns})
    seen: dict[str, set[str]] = defaultdict(set)
    amounts: dict[str, list[float]] = defaultdict(list)
    for t in txns:
        if t["type"] != "debit":
            continue
        seen[t["merchant"]].add(_month_key(t["date"]))
        amounts[t["merchant"]].append(t["amount"])
    recurring = []
    for merchant, mset in seen.items():
        if len(mset) == len(months) and len(months) >= 2:
            recurring.append({
                "merchant": merchant,
                "avg_amount": round(mean(amounts[merchant]), 2),
                "months_seen": len(mset),
            })
    return sorted(recurring, key=lambda r: -r["avg_amount"])


def summary(txns: list[dict[str, Any]]) -> dict[str, Any]:
    latest = latest_month(txns)
    latest_spend = sum(v for v in category_breakdown(txns, latest).values())
    latest_income = sum(
        t["amount"] for t in txns
        if t["type"] == "credit" and _month_key(t["date"]) == latest
    )
    savings = latest_income - latest_spend
    return {
        "month": latest,
        "income": round(latest_income, 2),
        "spending": round(latest_spend, 2),
        "savings": round(savings, 2),
        "savings_rate_pct": round(savings / latest_income * 100, 1) if latest_income else 0.0,
        "by_category": category_breakdown(txns, latest),
        "trend": monthly_trend(txns),
        "overspending": overspending(txns),
        "recurring": recurring_expenses(txns),
    }
