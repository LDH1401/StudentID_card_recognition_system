from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import student as student_router
from app.routers import attendance as attendance_router

from app.models import student as student_model
from app.models import attendance as attendance_model
from app.database import engine, Base
from app.migrations import ensure_attendance_history_schema, ensure_student_soft_delete_schema


Base.metadata.create_all(bind=engine)
ensure_attendance_history_schema(engine)
ensure_student_soft_delete_schema(engine)

app = FastAPI(title="Hệ thống Điểm danh PTIT")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(student_router.router)
app.include_router(attendance_router.router)

