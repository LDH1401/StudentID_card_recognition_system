from sqlalchemy import inspect, text


def ensure_attendance_history_schema(engine):
    """
    create_all() tao bang moi nhung khong sua bang da ton tai.
    Ham nho nay bo sung cot session_id/status cho database cu.
    """
    inspector = inspect(engine)
    if "attendance" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("attendance")}
    if "session_id" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE attendance ADD COLUMN session_id INTEGER NULL"))

    if "status" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE attendance ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'present'")
            )

    with engine.begin() as conn:
        null_count = conn.execute(
            text("SELECT COUNT(*) FROM attendance WHERE session_id IS NULL")
        ).scalar() or 0

        if null_count == 0:
            return

        result = conn.execute(
            text(
                """
                INSERT INTO attendance_sessions (name, started_at, ended_at, is_active)
                VALUES (:name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, :is_active)
                """
            ),
            {
                "name": "Du lieu diem danh truoc khi luu lich su",
                "is_active": False,
            },
        )
        legacy_session_id = result.lastrowid

        if not legacy_session_id:
            legacy_session_id = conn.execute(
                text("SELECT MAX(id) FROM attendance_sessions")
            ).scalar()

        conn.execute(
            text("UPDATE attendance SET session_id = :session_id WHERE session_id IS NULL"),
            {"session_id": legacy_session_id},
        )


def ensure_student_soft_delete_schema(engine):
    """Bo sung cot is_active de xoa mem sinh vien ma van giu lich su diem danh."""
    inspector = inspect(engine)
    if "students" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("students")}
    if "is_active" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE students ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE")
            )
