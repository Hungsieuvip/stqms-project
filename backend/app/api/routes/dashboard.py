from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Optional
import uuid

from app.api import deps
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardOverviewResponse, ChartResponse
from app.models.user import User
from app.models.training import Task

router = APIRouter()

def get_dashboard_service(db: Session = Depends(deps.get_db)) -> DashboardService:
    return DashboardService(db)

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    department_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    service: DashboardService = Depends(get_dashboard_service),
    # SỬA ĐÚNG TÊN HÀM Ở ĐÂY:
    current_user: User = Depends(deps.get_current_user)
):
    kpis = service.get_overview_kpis(department_id, start_date, end_date)
    recent_activities = service.get_recent_activities(limit=5)
    
    return {
        "kpis": kpis,
        "recent_activities": recent_activities
    }

@router.get("/criteria", response_model=ChartResponse)
def get_criteria_chart_data(
    academic_year_id: Optional[uuid.UUID] = None,
    service: DashboardService = Depends(get_dashboard_service),
    # SỬA ĐÚNG TÊN HÀM Ở ĐÂY:
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
    # SỬA ĐÚNG TÊN HÀM Ở ĐÂY:
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
    # SỬA ĐÚNG TÊN HÀM Ở ĐÂY:
    current_user: User = Depends(deps.get_current_user)
):
    filters = service._build_task_filters(department_id, start_date, end_date)
    results = service.db.query(service.db.query(Task).model.priority, func.count(service.db.query(Task).model.id))\
                        .filter(*filters).group_by(service.db.query(Task).model.priority).all()
    
    data = [{"label": r[0] or "UNKNOWN", "value": r[1]} for r in results]
    return {"data": data}

@router.get("/reports/export")
def export_report_placeholder(
    # SỬA ĐÚNG TÊN HÀM Ở ĐÂY:
    current_user: User = Depends(deps.get_current_user)
):
    return {"message": "Export function is under construction. Requires celery/background tasks for heavy processing."}