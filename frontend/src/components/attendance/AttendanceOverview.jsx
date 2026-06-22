import React from 'react';

const AttendanceOverview = ({
  students,
  activeSession,
  searchTerm,
  isLoading,
  error,
  onSearchChange,
  onManualCheckin,
  onStartSession,
  onResetAttendance,
}) => {
  const getAttendanceStatus = (student) => {
    if (!student.is_present) return 'absent';
    return student.attendance_status || 'present';
  };

  const totalStudents = students.length;
  const presentCount = students.filter((student) => getAttendanceStatus(student) === 'present').length;
  const lateCount = students.filter((student) => getAttendanceStatus(student) === 'late').length;
  const absentCount = totalStudents - presentCount - lateCount;

  const renderStatusBadge = (student) => {
    if (!activeSession) {
      return <span className="badge-neutral">Chưa mở buổi</span>;
    }

    const attendanceStatus = getAttendanceStatus(student);

    if (attendanceStatus === 'late') {
      return <span className="badge-late">Đi muộn</span>;
    }

    if (attendanceStatus === 'present') {
      return <span className="badge-present">Có mặt</span>;
    }

    return <span className="badge-absent">Chưa điểm danh</span>;
  };

  return (
    <section className="dashboard-section">
      <div className="overview-grid">
        <div className="metric-panel">
          <span className="metric-label">Sĩ số</span>
          <strong className="metric-value">{totalStudents}</strong>
        </div>
        <div className="metric-panel metric-present">
          <span className="metric-label">Đã có mặt</span>
          <strong className="metric-value">{presentCount}</strong>
        </div>
        <div className="metric-panel metric-late">
          <span className="metric-label">Đi muộn</span>
          <strong className="metric-value">{lateCount}</strong>
        </div>
        <div className="metric-panel metric-absent">
          <span className="metric-label">Vắng</span>
          <strong className="metric-value">{absentCount}</strong>
        </div>
      </div>

      <div className="dashboard-card attendance-card">
        <div className="card-title-wrapper" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <h2 className="card-title">Điểm danh buổi hiện tại</h2>
          {activeSession ? (
            <div className="active-session-label">
              Buổi hiện tại: <strong>{activeSession.name}</strong>
            </div>
          ) : (
            <div className="active-session-label session-empty-label">
              Chưa có buổi học đang mở. Hãy khởi tạo buổi học trước khi điểm danh.
            </div>
          )}
          <div className="student-toolbar">
            <input
              type="search"
              className="student-search-input"
              placeholder="Tìm sinh viên để điểm danh"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="status-box status-loading">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="status-box status-error">{error}</div>
        ) : totalStudents === 0 ? (
          <div className="status-box status-success">Không tìm thấy sinh viên phù hợp.</div>
        ) : (
          <table className="student-table">
            <thead>
              <tr className="table-head-row">
                <th>STT</th>
                <th>Sinh viên</th>
                <th>Trạng thái</th>
                <th>Điểm danh</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id || student.student_code} className="table-body-row">
                  <td>{index + 1}</td>
                  <td>
                    <div className="student-profile">
                      <div className="avatar">SV</div>
                      <div className="student-info">
                        <span className="student-name">{student.name}</span>
                        <span className="student-code-small">{student.student_code}</span>
                      </div>
                    </div>
                  </td>
                  <td>{renderStatusBadge(student)}</td>
                  <td>
                    {activeSession && !student.is_present ? (
                      <div className="row-actions">
                        <button
                          className="btn-action btn-present"
                          onClick={() => onManualCheckin(student.student_code, 'present')}
                        >
                          Có mặt
                        </button>
                        <button
                          className="btn-action btn-late"
                          onClick={() => onManualCheckin(student.student_code, 'late')}
                        >
                          Đi muộn
                        </button>
                      </div>
                    ) : !activeSession ? (
                      <span className="muted-cell">Chưa mở buổi</span>
                    ) : (
                      <span className="muted-cell">Đã ghi nhận</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="card-footer">
          {activeSession ? (
            <button className="btn-reset" onClick={onResetAttendance}>
              Kết thúc buổi học
            </button>
          ) : (
            <button className="btn-start-session" onClick={onStartSession}>
              Khởi tạo buổi học
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default AttendanceOverview;
