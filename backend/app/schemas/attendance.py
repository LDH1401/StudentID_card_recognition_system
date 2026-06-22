from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.student import StudentResponse


class AttendanceBase(BaseModel):
    student_code: str
    session_id: Optional[int] = None
    status: str = "present"


class AttendanceCreate(AttendanceBase):
    """Schema dùng khi tạo 1 lượt điểm danh mới"""
    pass


class AttendanceResponse(AttendanceBase):
    """Schema trả về thông tin điểm danh, kèm thời gian và ID"""
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceSessionResponse(BaseModel):
    id: int
    name: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_active: bool
    total_students: int = 0
    present_count: int = 0
    late_count: int = 0
    absent_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AttendanceHistoryStudent(StudentResponse):
    is_present: bool
    attendance_status: str = "absent"
    status_label: str = "Vắng"
    checked_in_at: Optional[datetime] = None
