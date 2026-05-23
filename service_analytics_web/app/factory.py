"""Сборка FastAPI-приложения."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.bootstrap import init_infrastructure
from app.paths import DESKTOP_ROOT, WEB_ROOT, ensure_desktop_on_path
from app.routes import api, pages

load_dotenv(WEB_ROOT / ".env")
ensure_desktop_on_path()
load_dotenv(DESKTOP_ROOT / ".env")
load_dotenv()


def create_app() -> FastAPI:
    ensure_desktop_on_path()

    app = FastAPI(
        title="Service Analytics Web",
        description="Веб-интерфейс корпоративной аналитики выездного сервиса",
        version="1.0.0",
    )

    static_dir = WEB_ROOT / "app" / "static"
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    app.include_router(pages.router)
    app.include_router(api.router)

    @app.on_event("startup")
    def _startup() -> None:
        init_infrastructure()

    return app
