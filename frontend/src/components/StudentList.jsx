import React from 'react';

const StudentList = ({ 
  absentStudents, 
  isLoading, 
  error, 
  onManualCheckin, 
  onResetAttendance 
}) => {
  return (
    <div className="dashboard-card card-right">
      <div className="card-title-wrapper">
        <h2 className="card-title">
          Danh sách vắng mặt 
          <span className="badge-count">{absentStudents.length}</span>
        </h2>
      </div>
      
      {isLoading ? (
        <div className="status-box status-loading">⏳ Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="status-box status-error">❌ {error}</div>
      ) : absentStudents.length === 0 ? (
        <div className="status-box status-success">Tất cả sinh viên đã có mặt.</div>
      ) : (
        <table className="student-table">
          <thead>
            <tr className="table-head-row">
              <th>STT</th>
              <th>Sinh Viên</th>
              <th>Trạng thái</th>
              <th>Điểm danh</th>
            </tr>
          </thead>
          <tbody>
            {absentStudents.map((stu, index) => (
              <tr key={stu.id || index} className="table-body-row">
                <td>{index + 1}</td>
                <td>
                  <div className="student-profile">
                    <div className="avatar">👤</div>
                    <div className="student-info">
                      <span className="student-name">{stu.name}</span>
                      <span className="student-code-small">{stu.student_code}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge-absent">Chưa điểm danh</span>
                </td>
                <td>
                  <button 
                    className="btn-action btn-present"
                    onClick={() => onManualCheckin(stu.student_code)}
                  >
                    Có mặt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="card-footer">
        <button className="btn-reset" onClick={onResetAttendance}>
          Kết thúc buổi học
        </button>
      </div>
    </div>
  );
};

export default StudentList;