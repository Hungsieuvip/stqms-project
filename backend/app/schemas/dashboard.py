from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

# Base Chart Item for Reusability (Frontend friendly)
class ChartItem(BaseModel):
    label: str
    value: float

class KPIOverview(BaseModel):
    total_criteria: int
    total_evidence: int
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
    user_name: Optional[str]
    timestamp: datetime

class DashboardOverviewResponse(BaseModel):
    kpis: KPIOverview
    recent_activities: List[RecentActivity]
    
class ChartResponse(BaseModel):
    data: List[ChartItem]