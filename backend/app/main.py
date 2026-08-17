from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# 1. Gom toàn bộ import router vào một nơi
from app.api.routes import (
    health, auth, users, standards, criteria,
    evidences, plans, tasks, evaluations, 
    dashboard, notifications, audit_logs
)

# 2. Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs"
)

# 3. Cấu hình CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Khai báo các router với tiền tố API (vd: /api/v1/...)
app.include_router(health.router, prefix=f"{settings.API_V1_STR}", tags=["health"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(standards.router, prefix=f"{settings.API_V1_STR}/standards", tags=["standards"])
app.include_router(criteria.router, prefix=f"{settings.API_V1_STR}/criteria", tags=["criteria"])
app.include_router(evidences.router, prefix=f"{settings.API_V1_STR}/evidences", tags=["evidences"])
app.include_router(plans.router, prefix=f"{settings.API_V1_STR}/plans", tags=["plans"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["tasks"])
app.include_router(evaluations.router, prefix=f"{settings.API_V1_STR}/evaluations", tags=["evaluations"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["notifications"])
app.include_router(audit_logs.router, prefix=f"{settings.API_V1_STR}/audit-logs", tags=["audit_logs"])