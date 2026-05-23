"""
Точка входа веб-версии.

Запуск из каталога `service_analytics_web`:

    python main.py

Или:

    uvicorn main:app --reload --host 127.0.0.1 --port 8080
"""

from __future__ import annotations

import os

import uvicorn
from dotenv import load_dotenv

from app.factory import create_app

load_dotenv()
app = create_app()


def main() -> None:
    host = os.getenv("WEB_HOST", "127.0.0.1")
    port = int(os.getenv("WEB_PORT", "8080"))
    # Объект app напрямую: desktop/main.py тоже в sys.path и перехватывает "main:app"
    uvicorn.run(app, host=host, port=port, reload=False)


if __name__ == "__main__":
    main()
