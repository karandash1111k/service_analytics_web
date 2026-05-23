# Service Analytics — Web

Веб-интерфейс корпоративной аналитики выездного сервиса. Использует **тот же бэкенд и MySQL**, что и desktop-приложение в соседней папке `service_analytics_system`, **без изменений** в десктоп-проекте.

## Возможности

- Дашборд с KPI и интерактивными графиками (Chart.js)
- Заявки: фильтрация, назначение инженера, завершение
- Ремонты: просмотр и фильтр по статусу
- Аналитика: SLA, распределения, просрочки по приоритету
- Интеграции: Bitrix24, 1С, импорт Excel, журналы
- Отчёты: скачивание Excel и PDF

## Требования

- Python 3.12+
- MySQL с настроенной БД (как у desktop)
- Рабочий `.env` с параметрами `DB_*`

## Установка

```bash
cd service_analytics_web
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Скопируйте в `.env` те же `DB_HOST`, `DB_USER`, `DB_PASSWORD`, что в desktop, или укажите путь:

```env
DESKTOP_APP_ROOT=C:/Users/you/Music/service_analytics_system
```

## Запуск

```bash
python main.py
```

Откройте в браузере: [http://127.0.0.1:8080](http://127.0.0.1:8080)

Порт и хост: `WEB_PORT`, `WEB_HOST` в `.env`.

## Структура

```
service_analytics_web/
  main.py              # uvicorn
  app/
    factory.py         # FastAPI
    routes/            # HTML + JSON API
    templates/         # Jinja2
    static/            # CSS, JS
```

Десктоп-приложение по-прежнему запускается из `ervice_analytics_web` командой `python main.py`.
