from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date
from typing import Optional
import uuid

from app.models.quality import Criterion
from app.models.evidence import Evidence
from app.models.training import Task, Plan
from app.models.evaluation import EvaluationDetail
from app.models.system import AuditLog
from app.models.user import User

class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def _build_task_filters(self, department_id: Optional[uuid.UUID], start_date: Optional[date], end_date: Optional[date]):
        filters = []
        if department_id:
            filters.append(Task.department_id == department_id)
        if start_date:
            filters.append(Task.created_at >= start_date)
        if end_date:
            filters.append(Task.created_at <= end_date)
        return filters

    def _build_evidence_filters(self, department_id: Optional[uuid.UUID], start_date: Optional[date], end_date: Optional[date]):
        filters = []
        if department_id:
            filters.append(Evidence.department_id == department_id)
        if start_date:
            filters.append(Evidence.created_at >= start_date)
        if end_date:
            filters.append(Evidence.created_at <= end_date)
        return filters

    def get_overview_kpis(self, department_id: Optional[uuid.UUID], start_date: Optional[date], end_date: Optional[date]):
        task_filters = self._build_task_filters(department_id, start_date, end_date)
        evidence_filters = self._build_evidence_filters(department_id, start_date, end_date)

        total_criteria = self.db.query(Criterion).count()
        total_evidence = self.db.query(Evidence).filter(*evidence_filters).count()
        
        # Task Metrics
        total_tasks = self.db.query(Task).filter(*task_filters).count()
        completed_tasks = self.db.query(Task).filter(and_(*task_filters, Task.status == 'COMPLETED')).count()
        overdue_tasks = self.db.query(Task).filter(and_(*task_filters, Task.status == 'OVERDUE')).count()
        pending_tasks = total_tasks - completed_tasks - overdue_tasks

        task_completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
        
        # Overall completion (Giả định: Dựa trên số tiêu chí đã PASS / Tổng số tiêu chí)
        passed_criteria = self.db.query(EvaluationDetail).filter(EvaluationDetail.status == 'PASS').count()
        overall_completion_percentage = (passed_criteria / total_criteria * 100) if total_criteria > 0 else 0.0

        return {
            "total_criteria": total_criteria,
            "total_evidence": total_evidence,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "overdue_tasks": overdue_tasks,
            "overall_completion_percentage": round(overall_completion_percentage, 2),
            "task_completion_percentage": round(task_completion_percentage, 2)
        }

    def get_evidence_by_status_chart(self, department_id: Optional[uuid.UUID], start_date: Optional[date], end_date: Optional[date]):
        filters = self._build_evidence_filters(department_id, start_date, end_date)
        results = self.db.query(Evidence.status, func.count(Evidence.id)).filter(*filters).group_by(Evidence.status).all()
        return [{"label": r[0] or "UNKNOWN", "value": r[1]} for r in results]

    def get_criteria_by_eval_status_chart(self, academic_year_id: Optional[uuid.UUID] = None):
        # Có thể thêm join với Evaluation để lọc theo academic_year
        query = self.db.query(EvaluationDetail.status, func.count(EvaluationDetail.id)).group_by(EvaluationDetail.status)
        results = query.all()
        return [{"label": r[0] or "UNASSESSED", "value": r[1]} for r in results]

    def get_recent_activities(self, limit: int = 5):
        logs = self.db.query(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id)\
                      .order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": log.AuditLog.id,
                "action": log.AuditLog.action,
                "table_name": log.AuditLog.table_name,
                "user_name": log.User.full_name if log.User else "System",
                "timestamp": log.AuditLog.created_at
            }
            for log in logs
        ]