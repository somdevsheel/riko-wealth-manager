"""Synthetic banking data generator for the Riko prototype.

Produces a deterministic-ish user profile plus a few months of transactions.
No real banking data is used. Swap this module for an IDBI sandbox / core-banking
adapter later without touching the engines that consume it.
"""
from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Any

CATEGORIES = {
    "Income": [("Salary Credit", 0.0)],  # handled separately
    "Rent": [("Monthly Rent", 1.0)],
    "Groceries": [("BigBasket", 0.4), ("DMart", 0.3), ("Local Kirana", 0.3)],
    "Dining": [("Swiggy", 0.4), ("Zomato", 0.35), ("Restaurant", 0.25)],
    "Transport": [("Uber", 0.4), ("Ola", 0.3), ("Fuel", 0.3)],
    "Utilities": [("Electricity", 0.4), ("Mobile Recharge", 0.3), ("Broadband", 0.3)],
    "Shopping": [("Amazon", 0.5), ("Myntra", 0.3), ("Flipkart", 0.2)],
    "Entertainment": [("Netflix", 0.3), ("BookMyShow", 0.3), ("Spotify", 0.4)],
    "Health": [("Pharmacy", 0.5), ("Clinic", 0.5)],
    "Investment": [("SIP Debit", 0.6), ("FD Booking", 0.4)],
}

# monthly budget baselines (INR) for a mid-income salaried persona
BASE = {
    "Rent": 22000,
    "Groceries": 9000,
    "Dining": 6000,
    "Transport": 4500,
    "Utilities": 3500,
    "Shopping": 7000,
    "Entertainment": 1500,
    "Health": 2000,
    "Investment": 10000,
}


def _pick(merchants: list[tuple[str, float]]) -> str:
    r = random.random()
    cum = 0.0
    for name, w in merchants:
        cum += w
        if r <= cum:
            return name
    return merchants[-1][0]


def generate_user_profile(seed: int = 42) -> dict[str, Any]:
    random.seed(seed)
    return {
        "user_id": "IDBI-DEMO-001",
        "name": "Rahul Sharma",
        "age": 31,
        "monthly_income": 85000,
        "risk_profile": "Moderate",  # Conservative | Moderate | Aggressive
        "existing_investments": 240000,
        "emergency_fund": 45000,
        "monthly_debt_emi": 12000,  # e.g. an existing loan EMI
    }


def generate_transactions(months: int = 4, seed: int = 42) -> list[dict[str, Any]]:
    random.seed(seed)
    profile = generate_user_profile(seed)
    income = profile["monthly_income"]
    txns: list[dict[str, Any]] = []
    today = date.today()

    for m in range(months):
        month_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
        # step back m months
        year = today.year
        month = today.month - m
        while month <= 0:
            month += 12
            year -= 1
        first = date(year, month, 1)

        # salary credit
        txns.append({
            "date": first.replace(day=1).isoformat(),
            "category": "Income",
            "merchant": "Salary Credit",
            "amount": income,
            "type": "credit",
        })

        # variable spend per category, with a deliberate dining spike in the latest month
        for cat, base in BASE.items():
            spike = 1.32 if (cat == "Dining" and m == 0) else 1.0
            monthly = base * spike * random.uniform(0.9, 1.1)
            n_txns = random.randint(2, 6)
            per = monthly / n_txns
            for _ in range(n_txns):
                day = random.randint(2, 27)
                amt = round(per * random.uniform(0.7, 1.3), 2)
                txns.append({
                    "date": first.replace(day=day).isoformat(),
                    "category": cat,
                    "merchant": _pick(CATEGORIES[cat]),
                    "amount": amt,
                    "type": "debit",
                })

    txns.sort(key=lambda t: t["date"])
    return txns


if __name__ == "__main__":
    p = generate_user_profile()
    t = generate_transactions()
    print(f"Profile: {p['name']}, income {p['monthly_income']}, {len(t)} transactions")
