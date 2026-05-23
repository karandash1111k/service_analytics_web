"""Пути и подключение кода десктоп-приложения без его изменения."""

from __future__ import annotations

import os
import sys
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parents[1]
_DEFAULT_DESKTOP = WEB_ROOT.parent / "service_analytics_system"
DESKTOP_ROOT = Path(os.getenv("DESKTOP_APP_ROOT", str(_DEFAULT_DESKTOP))).resolve()


def ensure_desktop_on_path() -> Path:
    """Добавляет корень desktop-проекта в sys.path для импорта сервисов."""
    if not DESKTOP_ROOT.is_dir():
        raise RuntimeError(
            f"Десктоп-приложение не найдено: {DESKTOP_ROOT}. "
            "Задайте DESKTOP_APP_ROOT в .env."
        )
    root = str(DESKTOP_ROOT)
    if root not in sys.path:
        sys.path.insert(0, root)
    return DESKTOP_ROOT
