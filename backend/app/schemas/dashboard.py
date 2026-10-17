from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

# Base Chart Item for Reusability (Frontend friendly)
class ChartItem(BaseModel):
    label: str
    value: float

class StandardProgressItem(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    total_criteria: int
    passed_criteria: int
    completion_rate: float
    evidence_count: int

class KPIOverview(BaseModel):
    total_standards: Optional[int] = 0
    total_criteria: int
    total_evidence: int
    approved_evidence: Optional[int] = 0
    passed_criteria: Optional[int] = 0
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    overall_completion_percentage: float
    task_completion_percentage: float

class RecentActivity(BaseModel):
    id: uuid.UUID
    action: str
    table_name: str
    user_name: Optional[str] = None
    timestamp: datetime

class DashboardOverviewResponse(BaseModel):
    kpis: KPIOverview
    standards_progress: Optional[List[StandardProgressItem]] = []
    recent_activities: List[RecentActivity]
    
class ChartResponse(BaseModel):
    data: List[ChartItem]
