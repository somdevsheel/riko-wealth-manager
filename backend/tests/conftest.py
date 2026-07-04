"""Shared test fixtures.

Tests now hit Postgres/MongoDB-backed endpoints, so make sure the synthetic
data is seeded before anything runs. `seed.run()` is idempotent — a no-op if
already seeded.
"""
from __future__ import annotations

import pytest

from app.data import seed


@pytest.fixture(scope="session", autouse=True)
def _seed_database():
    seed.run()
