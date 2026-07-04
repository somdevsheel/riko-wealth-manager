"""Seeds the synthetic profile, transactions, and goals into Postgres.

Idempotent — if a profile already exists, seeding is skipped. Run directly:

    python -m app.data.seed
"""
from __future__ import annotations

from app.core.db import Base, Goal, Profile, Transaction, engine, get_session
from app.data import synthetic
from app.engines.goals import DEFAULT_GOALS


def run() -> None:
    Base.metadata.create_all(engine)

    with get_session() as session:
        if session.query(Profile).count() > 0:
            print("Already seeded — skipping. Delete the tables to reseed.")
            return

        profile_data = synthetic.generate_user_profile()
        profile = Profile(
            id=profile_data["user_id"],
            name=profile_data["name"],
            age=profile_data["age"],
            monthly_income=profile_data["monthly_income"],
            risk_profile=profile_data["risk_profile"],
            existing_investments=profile_data["existing_investments"],
            emergency_fund=profile_data["emergency_fund"],
            monthly_debt_emi=profile_data["monthly_debt_emi"],
        )
        session.add(profile)
        session.flush()  # insert the profile row now — transactions/goals below FK to it,
        # and without an ORM relationship() linking them, the unit-of-work has no way to
        # know to order those inserts after this one otherwise.

        transactions = synthetic.generate_transactions()
        for t in transactions:
            session.add(
                Transaction(
                    profile_id=profile.id,
                    date=t["date"],
                    category=t["category"],
                    merchant=t["merchant"],
                    amount=t["amount"],
                    type=t["type"],
                )
            )

        for g in DEFAULT_GOALS:
            session.add(
                Goal(
                    id=g["id"],
                    profile_id=profile.id,
                    name=g["name"],
                    target=g["target"],
                    months=g["months"],
                    saved=g["saved"],
                )
            )

        print(
            f"Seeded profile {profile.id} with {len(transactions)} transactions "
            f"and {len(DEFAULT_GOALS)} goals."
        )


if __name__ == "__main__":
    run()
