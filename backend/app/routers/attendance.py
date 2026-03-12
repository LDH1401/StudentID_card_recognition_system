import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

from app.services.pipeline_service import process_student_card

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post("/checkin")
async def checkin(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Đặt tên file tạm thời (ví dụ: temp_webcam_capture.jpg)
    temp_file_path = f"temp_{file.filename}"
    
    try:
        # 1. Lưu file ảnh từ React xuống ổ cứng
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        student_code = process_student_card(temp_file_path)
        
        # 3. Kiểm tra kết quả AI (Khớp với logic trả về trong pipeline_service)
        if not student_code or student_code == "Không nhận diện được":
            return {"success": False, "message": "Không đọc được mã sinh viên, vui lòng thử lại!"}

        # 4. Kiểm tra Database xem sinh viên có tồn tại không
        student = crud.get_student_by_code(db, student_code=student_code)
        if not student:
            return {
                "success": False, 
                "student_code": student_code,
                "message": "Bạn không có trong danh sách lớp!"
            }


        crud.record_attendance(db, student_code=student_code)


        return {
            "success": True,
            "message": "Điểm danh thành công",
            "student_code": student.student_code,
            "name": student.name
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)