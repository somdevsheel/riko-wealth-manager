"""Postgres (SQLAlchemy) + MongoDB connections and ORM models.

Postgres holds the structured, queryable state: profiles, transactions, goals,
and a wealth-score history log. MongoDB holds the loosely-structured Artha
conversation log and generated insight snapshots.
"""
from __future__ import annotations

from collections.abc import Generator
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any

from pymongo import MongoClient
from pymongo.database import Database
from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    age: Mapped[int] = mapped_column(Integer)
    monthly_income: Mapped[float] = mapped_column(Float)
    risk_profile: Mapped[str] = mapped_column(String)
    existing_investments: Mapped[float] = mapped_column(Float)
    emergency_fund: Mapped[float] = mapped_column(Float)
    monthly_debt_emi: Mapped[float] = mapped_column(Float)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    date: Mapped[str] = mapped_column(String)  # ISO date, e.g. "2026-07-04"
    category: Mapped[str] = mapped_column(String)
    merchant: Mapped[str] = mapped_column(String)
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String)  # "credit" | "debit"


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    target: Mapped[float] = mapped_column(Float)
    months: Mapped[int] = mapped_column(Integer)
    saved: Mapped[float] = mapped_column(Float)


class WealthScoreLog(Base):
    """Append-only history of computed scores — an audit trail, not a read path.

    The score itself is always recomputed fresh from current transactions/goals;
    this table just logs each computation so score-over-time can be charted later.
    """

    __tablename__ = "wealth_score_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    score: Mapped[int] = mapped_column(Integer)
    factors: Mapped[dict] = mapped_column(JSON)


@contextmanager
def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


_mongo_client: MongoClient | None = None


def get_mongo_db() -> Database:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(settings.mongodb_url)
    return _mongo_client[settings.mongodb_db]


def log_conversation(question: str, answer: str, source: str) -> None:
    get_mongo_db().conversations.insert_one({
        "question": question,
        "answer": answer,
        "source": source,
        "timestamp": datetime.now(timezone.utc),
    })


def log_insights(profile_id: str, insights: list[str]) -> None:
    get_mongo_db().insights.insert_one({
        "profile_id": profile_id,
        "insights": insights,
        "timestamp": datetime.now(timezone.utc),
    })


def log_score(profile_id: str, score: int, factors: dict[str, Any]) -> None:
    with get_session() as session:
        session.add(
            WealthScoreLog(
                profile_id=profile_id,
                computed_at=datetime.now(timezone.utc),
                score=score,
                factors=factors,
            )
        )
