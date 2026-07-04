"""Riko FastAPI application entrypoint.

Run: uvicorn app.main:app --reload
Docs: http://localhost:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.api import router

app = FastAPI(
    title="Riko API",
    description="AI-powered avatar wealth advisor \u2014 IDBI Innovate 2026 prototype",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def health():
    return {"status": "ok", "service": "Riko", "docs": "/docs"}
