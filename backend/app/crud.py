from sqlalchemy.orm import Session
from app.models import student as student_model
from app.models import attendance as attendance_model
from app import schemas


# các hàm cho sinh viên
def get_student_by_code(db: Session, student_code: str):
    """Tìm sinh viên theo Mã SV"""
    return db.query(student_model.Student).filter(student_model.Student.student_code == student_code).first()

def create_student(db: Session, student: schemas.StudentCreate):
    """Thêm sinh viên mới vào CSDL"""
    db_student = student_model.Student(
        student_code=student.student_code, 
        name=student.name, 
        class_name=student.class_name
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def get_all_students(db: Session, skip: int = 0, limit: int = 100):
    """Lấy danh sách toàn bộ sinh viên"""
    return db.query(student_model.Student).offset(skip).limit(limit).all()



# các hàm cho điểm danh
def record_attendance(db: Session, student_code: str, image_path: str = None):
    """Ghi nhận 1 lượt điểm danh mới"""
    db_attendance = attendance_model.Attendance(
        student_id=student_code, 
        image_path=image_path
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance