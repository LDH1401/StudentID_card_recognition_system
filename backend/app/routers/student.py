from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas

from app.database import get_db 

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("/", response_model=schemas.StudentResponse)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    # Kiểm tra xem mã SV đã tồn tại chưa
    db_student = crud.get_student_by_code(db, student_code=student.student_code)
    if db_student:
        raise HTTPException(status_code=400, detail="Mã sinh viên đã tồn tại")
    
    return crud.create_student(db=db, student=student)


@router.get("/", response_model=list[schemas.StudentResponse])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_students(db, skip=skip, limit=limit)