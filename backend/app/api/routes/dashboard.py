from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Optional
import uuid
import io
import csv

from app.api import deps
from app.services.dashboard_service import DashboardService
from app.services.report_service import ReportService
from app.schemas.dashboard import DashboardOverviewResponse, ChartResponse
from app.models.user import User
from app.models.training import Task

router = APIRouter()

def get_dashboard_service(db: Session = Depends(deps.get_db)) -> DashboardService:
    return DashboardService(db)

def get_report_service(db: Session = Depends(deps.get_db)) -> ReportService:
    return ReportService(db)

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    department_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(deps.get_current_user)
):
    kpis = service.get_overview_kpis(department_id, start_date, end_date)
    standards_progress = service.get_standards_progress()
    recent_activities = service.get_recent_activities(limit=5)
    
    return {
        "kpis": kpis,
        "standards_progress": standards_progress,
        "recent_activities": recent_activities
    }

@router.get("/criteria", response_model=ChartResponse)
def get_criteria_chart_data(
    academic_year_id: Optional[uuid.UUID] = None,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(deps.get_current_user)
):
    data = service.get_criteria_by_eval_status_chart(academic_year_id)
    return {"data": data}

@router.get("/evidence", response_model=ChartResponse)
def get_evidence_chart_data(
    department_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(deps.get_current_user)
):
    data = service.get_evidence_by_status_chart(department_id, start_date, end_date)
    return {"data": data}

@router.get("/tasks", response_model=ChartResponse)
def get_tasks_chart_data(
    department_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(deps.get_current_user)
):
    filters = service._build_task_filters(department_id, start_date, end_date)
    results = service.db.query(service.db.query(Task).model.priority, func.count(service.db.query(Task).model.id))\
                        .filter(*filters).group_by(service.db.query(Task).model.priority).all()
    
    data = [{"label": r[0] or "UNKNOWN", "value": r[1]} for r in results]
    return {"data": data}

@router.get("/reports/summary")
def get_report_summary(
    report_service: ReportService = Depends(get_report_service),
    current_user: User = Depends(deps.get_current_user)
):
    """Lấy dữ liệu tổng hợp Báo cáo tự đánh giá Trường Tiểu học Hợp Minh"""
    return report_service.generate_accreditation_summary()

@router.get("/reports/export")
def export_report(
    format: str = Query("html", description="Định dạng xuất báo cáo: 'html', 'csv', hoặc 'json'"),
    report_service: ReportService = Depends(get_report_service),
    current_user: User = Depends(deps.get_current_user)
):
    """Xuất báo cáo tự đánh giá chất lượng trường học (Thông tư 17/2018/TT-BGDĐT)"""
    if format.lower() == "html":
        html_content = report_service.generate_html_report()
        return HTMLResponse(content=html_content, status_code=200)

    elif format.lower() == "csv":
        summary = report_service.generate_accreditation_summary()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Mã Tiêu chuẩn", "Tên Tiêu chuẩn", "Mã Tiêu chí", "Tên Tiêu chí", "Kết quả", "Mức đạt", "Ghi chú"])

        for std in summary["standards"]:
            for crit in std["criteria"]:
                writer.writerow([
                    std["code"],
                    std["name"],
                    crit["code"],
                    crit["name"],
                    crit["status"],
                    crit["level"] or "",
                    crit["comment"] or ""
                ])

        response = Response(content=output.getvalue().encode('utf-8-sig'), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=Bao_cao_tu_danh_gia_Hop_Minh.csv"
        return response

    else:
        # Mặc định json
        return report_service.generate_accreditation_summary()
