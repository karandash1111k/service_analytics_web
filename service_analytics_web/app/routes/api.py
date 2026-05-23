"""JSON API для SPA-фрагментов и действий."""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.deps import db_session

router = APIRouter(prefix="/api", tags=["api"])


class AssignBody(BaseModel):
    engineer_id: int


def _df_records(df, *, date_cols: tuple[str, ...] = ()) -> list[dict[str, Any]]:
    if df is None or df.empty:
        return []
    out = df.copy()
    for col in date_cols:
        if col in out.columns:
            out[col] = out[col].astype(str)
    return out.to_dict(orient="records")


@router.get("/dashboard/summary")
def dashboard_summary() -> dict[str, Any]:
    from services.analytics_service import AnalyticsService

    with db_session() as session:
        summary = AnalyticsService(session).executive_summary()
    return summary


@router.get("/dashboard/charts")
def dashboard_charts() -> dict[str, Any]:
    from services.analytics_service import AnalyticsService

    with db_session() as session:
        a = AnalyticsService(session)
        orders = a.orders_per_day_frame().tail(21)
        load = a.engineer_workload_frame().head(12)
    return {
        "orders_per_day": _df_records(orders, date_cols=("day",)),
        "engineer_load": _df_records(load),
    }


@router.get("/orders")
def list_orders(
    status: str | None = Query(None),
    search: str | None = Query(None),
) -> list[dict[str, Any]]:
    from services.order_service import OrderService

    with db_session() as session:
        orders = OrderService(session).list_orders(
            status=status or None,
            search=search or None,
        )
        return [
            {
                "id": o.id,
                "client": o.client.full_name if o.client else "",
                "engineer": o.engineer.full_name if o.engineer else "",
                "engineer_id": o.engineer_id,
                "title": o.title,
                "status": o.status,
                "priority": o.priority,
                "created_at": o.created_at.strftime("%Y-%m-%d %H:%M"),
                "completed_at": (
                    o.completed_at.strftime("%Y-%m-%d %H:%M") if o.completed_at else ""
                ),
            }
            for o in orders
        ]


@router.get("/engineers")
def list_engineers() -> list[dict[str, Any]]:
    from repositories.engineer_repository import EngineerRepository

    with db_session() as session:
        return [
            {"id": e.id, "full_name": e.full_name}
            for e in EngineerRepository(session).list_active()
        ]


@router.post("/orders/{order_id}/assign")
def assign_order(order_id: int, body: AssignBody) -> dict[str, str]:
    from services.order_service import OrderService

    try:
        with db_session() as session:
            OrderService(session).assign_engineer(order_id, body.engineer_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "ok"}


@router.post("/orders/{order_id}/complete")
def complete_order(order_id: int) -> dict[str, str]:
    from services.order_service import OrderService

    try:
        with db_session() as session:
            OrderService(session).mark_completed(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "ok"}


@router.get("/repairs")
def list_repairs(status: str | None = Query(None)) -> list[dict[str, Any]]:
    from services.repair_service import RepairService

    with db_session() as session:
        repairs = RepairService(session).list_repairs(status=status or None)
        return [
            {
                "id": r.id,
                "order_id": r.order_id,
                "device_type": r.device_type,
                "device_model": r.device_model,
                "repair_status": r.repair_status,
                "repair_cost": float(r.repair_cost),
                "started_at": r.started_at.strftime("%Y-%m-%d %H:%M") if r.started_at else "",
                "finished_at": (
                    r.finished_at.strftime("%Y-%m-%d %H:%M") if r.finished_at else ""
                ),
                "repair_result": (r.repair_result or "")[:120],
            }
            for r in repairs
        ]


@router.get("/analytics/summary")
def analytics_summary() -> dict[str, Any]:
    from services.analytics_service import AnalyticsService

    with db_session() as session:
        a = AnalyticsService(session)
        return {"sla": a.sla_dashboard(), "repairs": a.repair_dashboard()}


@router.get("/analytics/charts")
def analytics_charts() -> dict[str, Any]:
    from services.analytics_service import AnalyticsService

    with db_session() as session:
        a = AnalyticsService(session)
        outcomes = a.repairs_outcome_frame()
        duration = a.repair_duration_distribution()
        sla_pri = a.sla_breach_rate_by_priority_frame()
    dur_list = []
    if not duration.empty and "duration_hours" in duration.columns:
        dur_list = duration["duration_hours"].tolist()
    return {
        "outcomes": _df_records(outcomes),
        "duration_hours": dur_list,
        "sla_by_priority": _df_records(sla_pri),
    }


@router.get("/integrations/logs")
def integration_logs() -> dict[str, Any]:
    from repositories.integration_log_repository import IntegrationLogRepository
    from repositories.sync_history_repository import SyncHistoryRepository

    with db_session() as session:
        logs = IntegrationLogRepository(session).list_recent(limit=150)
        hist = SyncHistoryRepository(session).list_recent(limit=80)
    return {
        "logs": [
            {
                "id": log.id,
                "source_system": log.source_system,
                "operation_type": log.operation_type,
                "status": log.status,
                "message": (log.message or "")[:240],
            }
            for log in logs
        ],
        "sync_history": [
            {
                "id": h.id,
                "source_system": h.source_system,
                "records_processed": h.records_processed,
                "started_at": h.started_at.strftime("%Y-%m-%d %H:%M:%S"),
                "finished_at": (
                    h.finished_at.strftime("%Y-%m-%d %H:%M:%S") if h.finished_at else ""
                ),
                "sync_status": h.sync_status,
            }
            for h in hist
        ],
    }


@router.post("/integrations/bitrix")
def run_bitrix() -> dict[str, Any]:
    from integrations.bitrix24.bitrix_sync import BitrixSyncService

    try:
        with db_session() as session:
            loaded = BitrixSyncService(session).run()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"loaded": loaded}


@router.post("/integrations/onec")
def run_onec() -> dict[str, Any]:
    from integrations.onec.onec_sync import OneCSyncService

    try:
        with db_session() as session:
            loaded = OneCSyncService(session).run()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"loaded": loaded}


@router.post("/integrations/excel")
async def import_excel(file: UploadFile = File(...)) -> dict[str, Any]:
    from integrations.excel.excel_importer import ExcelImportService

    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Нужен файл Excel (.xlsx / .xls)")

    suffix = Path(file.filename).suffix or ".xlsx"
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        with db_session() as session:
            loaded = ExcelImportService(session).import_orders_workbook(tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)
    return {"loaded": loaded}


@router.get("/reports/excel")
def export_excel() -> FileResponse:
    from services.reporting_service import ReportingService

    out = Path(tempfile.gettempdir()) / "service_analytics_report.xlsx"
    try:
        with db_session() as session:
            ReportingService(session).export_excel(out)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return FileResponse(
        path=out,
        filename="service_analytics_report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/reports/pdf")
def export_pdf() -> FileResponse:
    from services.reporting_service import ReportingService

    out = Path(tempfile.gettempdir()) / "service_analytics_report.pdf"
    try:
        with db_session() as session:
            ReportingService(session).export_pdf(out)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return FileResponse(path=out, filename="service_analytics_report.pdf", media_type="application/pdf")
