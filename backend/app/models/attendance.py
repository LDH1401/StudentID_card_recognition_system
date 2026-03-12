from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy import func
from sqlalchemy.orm import relationship
from app.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    
    # Khóa ngoại: Bắt buộc mã SV này phải tồn tại trong bảng students thì mới được điểm danh
    student_code = Column(String(20), ForeignKey("students.student_code")) 
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now()) 

    # Mối quan hệ ngược lại: Lượt điểm danh này thuộc về ai
    student = relationship("Student", back_populates="attendances")

    