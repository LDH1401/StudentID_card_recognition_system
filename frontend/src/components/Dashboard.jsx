import React, { useState, useEffect } from 'react';
import './Dashboard.css'; 

const Dashboard = () => {
  const [absentStudents, setAbsentStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newMssv, setNewMssv] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchStudents();

    // Mở kết nối WebSocket 
    const ws = new WebSocket('ws://127.0.0.1:8000/attendance/ws');

    ws.onopen = () => {
      console.log("Đã kết nối Real-time với Backend");
    };

    // Xử lý khi nhận được tín hiệu từ máy chủ
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'CHECKIN_SUCCESS') {
        const checkedInCode = data.student_code;
        // Tự động cập nhật lại danh sách vắng mặt
        setAbsentStudents((prevStudents) => 
          prevStudents.filter(stu => stu.student_code !== checkedInCode)
        );
      }
      else if (data.type === 'RESET_SUCCESS') {
        fetchStudents();
      }
    };

    // Ngắt kết nối khi chuyển trang
    return () => {
      ws.close();
    };
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/students/absent');
      if (!response.ok) throw new Error('Không thể kết nối với máy chủ');
      const data = await response.json();
      setAbsentStudents(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Lỗi tải dữ liệu...');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault(); 
    if (!newMssv || !newName) {
      alert("Vui lòng nhập đủ MSSV và Họ Tên!");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_code: newMssv.toUpperCase().trim(),
          name: newName.trim()
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Có lỗi xảy ra khi thêm sinh viên");

      setAbsentStudents([...absentStudents, data]);
      setNewMssv('');
      setNewName('');
      alert(`Đã thêm thành công: ${data.student_code}`);
    } catch (err) {
      console.error(err);
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleManualCheckin = async (studentCode) => {
    if (!window.confirm(`Xác nhận điểm danh có mặt cho sinh viên: ${studentCode}?`)) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_code: studentCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Có lỗi xảy ra khi điểm danh");

      // Đã xóa dòng lệnh setAbsentStudents ở đây vì WebSocket sẽ báo cho hệ thống tự xóa

    } catch (err) {
      console.error(err);
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleResetAttendance = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/attendance/reset', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Lỗi khi làm mới dữ liệu");
      
      alert("Đã làm mới danh sách thành công!");
      // Không cần gọi fetchStudents() ở đây nữa vì WebSocket đã báo hiệu
    } catch (err) {
      console.error(err);
      alert("Lỗi: Không thể làm mới dữ liệu.");
    }
  };

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-header">
        <h1 className="dashboard-title">Hệ Thống Quản Lý Lớp Học</h1>
        <p className="dashboard-subtitle">Theo dõi & thống kê điểm danh</p>
      </div>

      <div className="dashboard-content">
        
        <div className="dashboard-card card-left">
          <h2 className="card-title bordered">➕ Thêm Sinh Viên</h2>
          <form onSubmit={handleAddStudent} className="student-form">
            <div>
              <label className="form-label">Mã Sinh Viên (MSSV):</label>
              <input 
                type="text" 
                placeholder="VD: B23DCCN313" 
                value={newMssv}
                onChange={(e) => setNewMssv(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Họ và Tên:</label>
              <input 
                type="text" 
                placeholder="VD: Lê Duy Hùng" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="form-input"
              />
            </div>
            <button type="submit" className="btn-submit"> Lưu Thông Tin</button>
          </form>
        </div>

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
                  <th>Điểm danh  </th>
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
                        onClick={() => handleManualCheckin(stu.student_code)}
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
            <button className="btn-reset" onClick={handleResetAttendance}>
              Kết thúc buổi học
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;