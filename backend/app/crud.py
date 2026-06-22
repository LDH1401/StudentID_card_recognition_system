from datetime import datetime

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app import schemas
from app.models import attendance as attendance_model
from app.models import student as student_model


ATTENDANCE_STATUS_PRESENT = "present"
ATTENDANCE_STATUS_LATE = "late"
ATTENDANCE_STATUS_ABSENT = "absent"

ATTENDANCE_STATUS_LABELS = {
    ATTENDANCE_STATUS_PRESENT: "Có mặt",
    ATTENDANCE_STATUS_LATE: "Đi muộn",
    ATTENDANCE_STATUS_ABSENT: "Vắng",
}


def normalize_attendance_status(status: str | None):
    if not status:
        return ATTENDANCE_STATUS_PRESENT

    normalized_status = status.strip().lower()
    if normalized_status not in {ATTENDANCE_STATUS_PRESENT, ATTENDANCE_STATUS_LATE}:
        raise ValueError("Trạng thái điểm danh không hợp lệ")

    return normalized_status


def get_student_by_code(db: Session, student_code: str):
    """Tìm sinh viên theo Mã SV"""
    return db.query(student_model.Student).filter(
        student_model.Student.student_code == student_code,
        student_model.Student.is_active.is_(True),
    ).first()


def get_student_record_by_code(db: Session, student_code: str):
    """Tìm sinh viên theo mã, bao gồm cả sinh viên đã xóa mềm."""
    return db.query(student_model.Student).filter(
        student_model.Student.student_code == student_code
    ).first()


def get_student_by_id(db: Session, student_id: int):
    return db.query(student_model.Student).filter(
        student_model.Student.id == student_id,
        student_model.Student.is_active.is_(True),
    ).first()


def create_student(db: Session, student: schemas.StudentCreate):
    """Thêm sinh viên mới"""
    db_student = student_model.Student(
        student_code=student.student_code,
        name=student.name,
        is_active=True,
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


def restore_student(db: Session, db_student, student: schemas.StudentCreate):
    """Khôi phục sinh viên đã xóa mềm khi thêm lại cùng MSSV."""
    db_student.name = student.name
    db_student.is_active = True
    db.commit()
    db.refresh(db_student)
    return db_student


def update_student(db: Session, db_student, student: schemas.StudentUpdate):
    new_student_code = student.student_code
    if new_student_code and new_student_code != db_student.student_code:
        has_attendance_history = db.query(attendance_model.Attendance).filter(
            attendance_model.Attendance.student_code == db_student.student_code
        ).first() is not None

        if has_attendance_history:
            raise ValueError("Không thể đổi MSSV vì sinh viên đã có lịch sử điểm danh")

        db_student.student_code = new_student_code

    if student.name is not None:
        db_student.name = student.name

    db.commit()
    db.refresh(db_student)
    return db_student


def delete_student(db: Session, db_student):
    """Xóa mềm sinh viên khỏi lớp, không xóa lịch sử điểm danh."""
    db_student.is_active = False
    db.commit()
    db.refresh(db_student)
    return db_student


def get_all_students(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    active_only: bool = True,
):
    """Lấy danh sách toàn bộ sinh viên"""
    query = db.query(student_model.Student)

    if active_only:
        query = query.filter(student_model.Student.is_active.is_(True))

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                student_model.Student.student_code.ilike(keyword),
                student_model.Student.name.ilike(keyword),
            )
        )

    return query.order_by(student_model.Student.id.asc()).offset(skip).limit(limit).all()


def get_attendance_session(db: Session, session_id: int):
    return db.query(attendance_model.AttendanceSession).filter(
        attendance_model.AttendanceSession.id == session_id
    ).first()


def get_active_session(db: Session):
    active_sessions = db.query(attendance_model.AttendanceSession).filter(
        attendance_model.AttendanceSession.is_active.is_(True)
    ).order_by(attendance_model.AttendanceSession.id.desc()).all()

    if not active_sessions:
        return None

    current_session = active_sessions[0]
    stale_sessions = active_sessions[1:]

    if stale_sessions:
        for stale_session in stale_sessions:
            stale_session.is_active = False
            stale_session.ended_at = stale_session.ended_at or datetime.now()
        db.commit()
        db.refresh(current_session)

    return current_session


def create_attendance_session(db: Session, name: str | None = None):
    """Tạo một buổi học mới để các lượt điểm danh được gắn lịch sử."""
    session_name = name or f"Buổi học {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    db_session = attendance_model.AttendanceSession(
        name=session_name,
        is_active=True,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def start_attendance_session(db: Session, name: str | None = None):
    """Khởi tạo buổi học mới, không cho tạo chồng khi còn buổi đang mở."""
    active_session = get_active_session(db)
    if active_session:
        raise ValueError("Đang có buổi học được mở")

    return create_attendance_session(db, name=name)


def finish_current_session(db: Session):
    """Kết thúc buổi học hiện tại, không tự mở buổi mới."""
    active_session = get_active_session(db)
    if not active_session:
        return None

    active_session.is_active = False
    active_session.ended_at = datetime.now()
    db.commit()
    db.refresh(active_session)

    return active_session


def record_attendance(
    db: Session,
    student_code: str,
    session_id: int | None = None,
    status: str = ATTENDANCE_STATUS_PRESENT,
):
    """Ghi nhận 1 lượt điểm danh mới trong buổi học hiện tại."""
    if session_id is None:
        active_session = get_active_session(db)
        if not active_session:
            raise ValueError("Chưa khởi tạo buổi học")
        session_id = active_session.id

    attendance_status = normalize_attendance_status(status)
    db_attendance = attendance_model.Attendance(
        student_code=student_code,
        session_id=session_id,
        status=attendance_status,
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance


def has_attended(db: Session, student_code: str, session_id: int | None = None):
    """Kiểm tra sinh viên đã điểm danh trong buổi hiện tại chưa."""
    if session_id is None:
        active_session = get_active_session(db)
        if not active_session:
            return False
        session_id = active_session.id

    return db.query(attendance_model.Attendance).filter(
        attendance_model.Attendance.student_code == student_code,
        attendance_model.Attendance.session_id == session_id,
    ).first() is not None


def get_absent_students(db: Session, session_id: int | None = None, search: str | None = None):
    if session_id is None:
        active_session = get_active_session(db)
        if not active_session:
            return get_all_students(db, search=search, active_only=True)
        session_id = active_session.id

    attended_subquery = db.query(attendance_model.Attendance.student_code).filter(
        attendance_model.Attendance.session_id == session_id
    ).subquery()

    query = db.query(student_model.Student).filter(
        student_model.Student.is_active.is_(True),
        student_model.Student.student_code.not_in(attended_subquery),
    )

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                student_model.Student.student_code.ilike(keyword),
                student_model.Student.name.ilike(keyword),
            )
        )

    return query.order_by(student_model.Student.id.asc()).all()


def get_students_status(
    db: Session,
    session_id: int | None = None,
    search: str | None = None,
    active_only: bool = True,
):
    if session_id is None:
        active_session = get_active_session(db)
        session_id = active_session.id if active_session else None

    attendance_rows = []
    if session_id is not None:
        attendance_rows = db.query(
            attendance_model.Attendance.student_code,
            attendance_model.Attendance.timestamp,
            attendance_model.Attendance.status,
        ).filter(
            attendance_model.Attendance.session_id == session_id
        ).all()
    attendance_by_student_code = {
        row.student_code: {
            "timestamp": row.timestamp,
            "status": normalize_attendance_status(row.status),
        }
        for row in attendance_rows
    }

    result = []
    for student in get_all_students(db, search=search, active_only=active_only):
        attendance_info = attendance_by_student_code.get(student.student_code)
        checked_in_at = attendance_info["timestamp"] if attendance_info else None
        attendance_status = (
            attendance_info["status"] if attendance_info else ATTENDANCE_STATUS_ABSENT
        )
        result.append({
            "id": getattr(student, "id", None),
            "student_code": student.student_code,
            "name": student.name,
            "is_present": checked_in_at is not None,
            "attendance_status": attendance_status,
            "status_label": ATTENDANCE_STATUS_LABELS[attendance_status],
            "checked_in_at": checked_in_at,
        })

    return result


def get_session_summary(db: Session, attendance_session, active_only: bool = True):
    total_students_query = db.query(student_model.Student)
    if active_only:
        total_students_query = total_students_query.filter(
            student_model.Student.is_active.is_(True)
        )

    total_students = total_students_query.count()
    present_count = db.query(
        func.count(func.distinct(attendance_model.Attendance.student_code))
    ).filter(
        attendance_model.Attendance.session_id == attendance_session.id,
        or_(
            attendance_model.Attendance.status == ATTENDANCE_STATUS_PRESENT,
            attendance_model.Attendance.status.is_(None),
        ),
    ).scalar() or 0
    late_count = db.query(
        func.count(func.distinct(attendance_model.Attendance.student_code))
    ).filter(
        attendance_model.Attendance.session_id == attendance_session.id,
        attendance_model.Attendance.status == ATTENDANCE_STATUS_LATE,
    ).scalar() or 0
    checked_in_count = present_count + late_count

    return {
        "id": attendance_session.id,
        "name": attendance_session.name,
        "started_at": attendance_session.started_at,
        "ended_at": attendance_session.ended_at,
        "is_active": attendance_session.is_active,
        "total_students": total_students,
        "present_count": present_count,
        "late_count": late_count,
        "absent_count": max(total_students - checked_in_count, 0),
    }


def get_all_session_summaries(db: Session):
    get_active_session(db)

    sessions = db.query(attendance_model.AttendanceSession).order_by(
        attendance_model.AttendanceSession.started_at.desc(),
        attendance_model.AttendanceSession.id.desc(),
    ).all()

    return [get_session_summary(db, session, active_only=False) for session in sessions]


def reset_attendance(db: Session):
    """
    Giữ tên hàm cũ để router/frontend không phải đổi nhiều.
    Thực tế hàm này không xóa attendance nữa, mà đóng session hiện tại.
    """
    return finish_current_session(db)
