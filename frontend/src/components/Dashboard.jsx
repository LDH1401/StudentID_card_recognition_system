import React, { useState, useEffect } from 'react';
import AddStudent from './AddStudent';
import StudentList from './StudentList';
import './Dashboard.css'; 

const Dashboard = () => {
  const [absentStudents, setAbsentStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents();

    const ws = new WebSocket('ws://127.0.0.1:8000/attendance/ws');

    ws.onopen = () => {
      console.log("Đã kết nối Real-time với Backend");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'CHECKIN_SUCCESS') {
        const checkedInCode = data.student_code;
        setAbsentStudents((prevStudents) => 
          prevStudents.filter(stu => stu.student_code !== checkedInCode)
        );
      } else if (data.type === 'RESET_SUCCESS') {
        fetchStudents();
      }
    };

    return () => ws.close();
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

  // Trả về true nếu thành công để AddStudent biết mà xóa form
  const handleAddStudent = async (mssv, name) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_code: mssv.toUpperCase().trim(),
          name: name.trim()
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Có lỗi xảy ra khi thêm sinh viên");

      setAbsentStudents([...absentStudents, data]);
      alert(`Đã thêm thành công: ${data.student_code}`);
      return true; 
    } catch (err) {
      console.error(err);
      alert(`Lỗi: ${err.message}`);
      return false;
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
        {/* Render Component AddStudent và truyền props xuống */}
        <AddStudent onAddStudent={handleAddStudent} />

        {/* Render Component StudentList và truyền props xuống */}
        <StudentList 
          absentStudents={absentStudents}
          isLoading={isLoading}
          error={error}
          onManualCheckin={handleManualCheckin}
          onResetAttendance={handleResetAttendance}
        />
      </div>
    </div>
  );
};

export default Dashboard;