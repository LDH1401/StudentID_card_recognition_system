import React from 'react';

const AttendanceHistory = ({
  sessions,
  selectedSessionId,
  historyRows,
  historySession,
  historyLoading,
  formatDateTime,
  onSessionChange,
  onExportHistory,
}) => {
  const renderStatusBadge = (student) => {
    if (student.attendance_status === 'late') {
      return <span className="badge-late">Đi muộn</span>;
    }

    if (student.is_present) {
      return <span className="badge-present">Có mặt</span>;
    }

    return <span className="badge-absent">Vắng</span>;
  };

  return (
    <section className="dashboard-section">
      <div className="dashboard-card history-card">
        <div className="history-header">
          <div>
            <h2 className="card-title">Lịch sử điểm danh</h2>
            {historySession && (
              <p className="history-subtitle">
                {historySession.name} · {formatDateTime(historySession.started_at)} - {formatDateTime(historySession.ended_at)}
              </p>
            )}
          </div>

          <div className="history-actions">
            <select
              className="history-select"
              value={selectedSessionId}
              onChange={(event) => onSessionChange(event.target.value)}
            >
              {sessions.length === 0 ? (
                <option value="">Chưa có buổi học</option>
              ) : (
                sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} ({session.present_count + (session.late_count || 0)}/{session.total_students})
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              className="btn-export"
              onClick={onExportHistory}
              disabled={!selectedSessionId || historyLoading}
            >
              Xuất Excel
            </button>
          </div>
        </div>

        {historyLoading ? (
          <div className="status-box status-loading">Đang tải lịch sử...</div>
        ) : historyRows.length === 0 ? (
          <div className="status-box status-success">Chưa có dữ liệu lịch sử.</div>
        ) : (
          <table className="student-table history-table">
            <thead>
              <tr className="table-head-row">
                <th>STT</th>
                <th>Sinh viên</th>
                <th>Trạng thái</th>
                <th>Thời gian điểm danh</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((student, index) => (
                <tr key={student.id || student.student_code} className="table-body-row">
                  <td>{index + 1}</td>
                  <td>
                    <div className="student-profile">
                      <div className="avatar">{student.name?.charAt(0)?.toUpperCase() || 'SV'}</div>
                      <div className="student-info">
                        <span className="student-name">{student.name}</span>
                        <span className="student-code-small">{student.student_code}</span>
                      </div>
                    </div>
                  </td>
                  <td>{renderStatusBadge(student)}</td>
                  <td>{student.checked_in_at ? formatDateTime(student.checked_in_at) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default AttendanceHistory;
