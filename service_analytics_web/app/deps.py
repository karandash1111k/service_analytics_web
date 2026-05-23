"""Зависимости FastAPI — сессии БД."""

from __future__ import annotations

from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy.orm import Session


@contextmanager
def db_session() -> Generator[Session, None, None]:
    from database.session import session_scope

    with session_scope() as session:
        yield session
