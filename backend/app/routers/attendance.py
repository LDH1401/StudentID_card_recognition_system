import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db
from app.services.pipeline_service import process_student_card
from pydantic import BaseModel

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# --- TRẠM QUẢN LÝ WEBSOCKET ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Mở đường ống WebSocket tại địa chỉ: ws://127.0.0.1:8000/attendance/ws
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- CÁC API XỬ LÝ ĐIỂM DANH ---

@router.post("/checkin")
async def checkin(file: UploadFile = File(...), db: Session = Depends(get_db)):
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        student_code = process_student_card(temp_file_path)
        
        if not student_code or student_code == "Không nhận diện được":
            return {"success": False, "message": "Không đọc được mã sinh viên, vui lòng thử lại!"}

        student = crud.get_student_by_code(db, student_code=student_code)
        if not student:
            return {
                "success": False, 
                "student_code": student_code,
                "message": "Bạn không có trong danh sách lớp!"
            }

        crud.record_attendance(db, student_code=student_code)


        await manager.broadcast(json.dumps({
            "type": "CHECKIN_SUCCESS",
            "student_code": student.student_code
        }))

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


class ManualCheckinRequest(BaseModel):
    student_code: str

@router.post("/manual")
async def manual_checkin(request: ManualCheckinRequest, db: Session = Depends(get_db)):
    try:
        student = crud.get_student_by_code(db, student_code=request.student_code)
        if not student:
            raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")

        crud.record_attendance(db, student_code=request.student_code)
        
        await manager.broadcast(json.dumps({
            "type": "CHECKIN_SUCCESS",
            "student_code": request.student_code
        }))
        
        return {
            "success": True, 
            "message": f"Điểm danh thành công cho {request.student_code}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/reset")
async def reset_all_attendance(db: Session = Depends(get_db)):
    try:
        crud.reset_attendance(db)
        
        await manager.broadcast(json.dumps({
            "type": "RESET_SUCCESS"
        }))

        return {"success": True, "message": "Đã làm mới danh sách điểm danh"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))