"""HTML-страницы (Jinja2)."""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.paths import WEB_ROOT

templates = Jinja2Templates(directory=str(WEB_ROOT / "app" / "templates"))

router = APIRouter(tags=["pages"])

NAV = [
    ("dashboard", "Дашборд", "◈"),
    ("orders", "Заявки", "◎"),
    ("repairs", "Ремонты", "⚙"),
    ("analytics", "Аналитика", "◐"),
    ("integrations", "Интеграции", "⇄"),
    ("reports", "Отчёты", "▤"),
]


def _ctx(request: Request, active: str, title: str) -> dict:
    return {
        "request": request,
        "nav_items": NAV,
        "active_page": active,
        "page_title": title,
    }


@router.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/dashboard", status_code=302)


@router.get("/dashboard", response_class=HTMLResponse)
def page_dashboard(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "dashboard.html",
        _ctx(request, "dashboard", "Пульт управления"),
    )


@router.get("/orders", response_class=HTMLResponse)
def page_orders(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "orders.html",
        _ctx(request, "orders", "Заявки"),
    )


@router.get("/repairs", response_class=HTMLResponse)
def page_repairs(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "repairs.html",
        _ctx(request, "repairs", "Ремонты"),
    )


@router.get("/analytics", response_class=HTMLResponse)
def page_analytics(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "analytics.html",
        _ctx(request, "analytics", "Аналитика и KPI"),
    )


@router.get("/integrations", response_class=HTMLResponse)
def page_integrations(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "integrations.html",
        _ctx(request, "integrations", "Интеграции"),
    )


@router.get("/reports", response_class=HTMLResponse)
def page_reports(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "reports.html",
        _ctx(request, "reports", "Отчёты"),
    )
