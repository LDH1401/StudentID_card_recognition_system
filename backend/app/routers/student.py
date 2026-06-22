import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/students", tags=["Students"])


def normalize_student_code(student_code: str):
    return student_code.strip().upper()


def validate_student_payload(student_code: str | None = None, name: str | None = None):
    if student_code is not None:
        if not re.fullmatch(r"[A-Z]\d{2}[A-Z]{4}\d{3}", student_code):
            raise HTTPException(
                status_code=400,
                detail="Mã sinh viên phải đúng định dạng, ví dụ B23DCCN313",
            )

    if name is not None and len(name.strip()) < 3:
        raise HTTPException(status_code=400, detail="Họ và Tên phải có từ 3 ký tự trở lên")


@router.post("/", response_model=schemas.StudentResponse)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    student.student_code = normalize_student_code(student.student_code)
    student.name = student.name.strip() if student.name else None
    validate_student_payload(student_code=student.student_code, name=student.name)

    existing_student = crud.get_student_record_by_code(db, student_code=student.student_code)
    if existing_student and existing_student.is_active:
        raise HTTPException(status_code=400, detail="Mã sinh viên đã tồn tại")

    if existing_student and not existing_student.is_active:
        return crud.restore_student(db=db, db_student=existing_student, student=student)

    return crud.create_student(db=db, student=student)


@router.get("/", response_model=list[schemas.StudentResponse])
def read_students(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_all_students(db, skip=skip, limit=limit, search=search)


@router.put("/{student_id}", response_model=schemas.StudentResponse)
def update_student(
    student_id: int,
    student: schemas.StudentUpdate,
    db: Session = Depends(get_db),
):
    db_student = crud.get_student_by_id(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")

    if student.student_code is not None:
        student.student_code = normalize_student_code(student.student_code)

    if student.name is not None:
        student.name = student.name.strip()

    validate_student_payload(student_code=student.student_code, name=student.name)

    if student.student_code and student.student_code != db_student.student_code:
        existing_student = crud.get_student_record_by_code(db, student_code=student.student_code)
        if existing_student:
            raise HTTPException(status_code=400, detail="Mã sinh viên đã tồn tại")

    try:
        return crud.update_student(db=db, db_student=db_student, student=student)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = crud.get_student_by_id(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")

    crud.delete_student(db=db, db_student=db_student)
    return {"success": True, "message": "Đã xóa sinh viên khỏi danh sách lớp"}


@router.get("/absent", response_model=list[schemas.StudentResponse])
def read_absent_students(search: str | None = None, db: Session = Depends(get_db)):
    return crud.get_absent_students(db, search=search)


@router.get("/status")
def read_students_status(search: str | None = None, db: Session = Depends(get_db)):
    return crud.get_students_status(db, search=search)
