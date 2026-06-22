from sqlalchemy import Boolean, Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy import func
from sqlalchemy.orm import relationship
from app.database import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    attendances = relationship("Attendance", back_populates="session")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("student_code", "session_id", name="uq_attendance_student_session"),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Khóa ngoại: Bắt buộc mã SV này phải tồn tại trong bảng students thì mới được điểm danh
    student_code = Column(String(20), ForeignKey("students.student_code")) 

    # Mỗi lượt điểm danh thuộc về một buổi học cụ thể để lưu được lịch sử
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"), nullable=True, index=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now()) 
    status = Column(String(20), nullable=False, default="present")

    # Mối quan hệ ngược lại: Lượt điểm danh này thuộc về ai
    student = relationship("Student", back_populates="attendances")
    session = relationship("AttendanceSession", back_populates="attendances")

    
