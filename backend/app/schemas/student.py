from typing import Optional

from pydantic import BaseModel, ConfigDict


class StudentBase(BaseModel):
    student_code: str
    name: Optional[str] = None


class StudentCreate(StudentBase):
    """Schema dùng khi nhận request tạo mới Sinh viên"""
    pass


class StudentUpdate(BaseModel):
    """Schema dùng khi sửa thông tin sinh viên"""
    student_code: Optional[str] = None
    name: Optional[str] = None


class StudentResponse(StudentBase):
    """Schema dùng khi trả dữ liệu Sinh viên về cho Client (có thêm ID)"""
    id: int

    model_config = ConfigDict(from_attributes=True)
