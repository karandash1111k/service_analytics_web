"""Инициализация БД через модули desktop-приложения."""

from __future__ import annotations

from app.paths import ensure_desktop_on_path


def init_infrastructure() -> None:
    ensure_desktop_on_path()

    from config.settings import get_settings
    from database.connection import create_engine_from_settings
    from database.schema import create_all_tables
    from database.session import configure_session_factory
    from utils.logger import setup_logging

    settings = get_settings()
    setup_logging(settings.app_log_level)
    engine = create_engine_from_settings(settings)
    create_all_tables(engine)
    configure_session_factory()
