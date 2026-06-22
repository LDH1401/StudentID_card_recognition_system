from sqlalchemy import Boolean, Column, Integer, String
from app.database import Base
from sqlalchemy.orm import relationship

class Student(Base):
    
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    student_code = Column(String(20), unique=True, nullable=False)

    name = Column(String(100))

    is_active = Column(Boolean, default=True, nullable=False)

    attendances = relationship("Attendance", back_populates="student")



