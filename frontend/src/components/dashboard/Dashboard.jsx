import React, { useEffect, useRef, useState } from 'react';
import AttendanceOverview from '../attendance/AttendanceOverview';
import AttendanceHistory from '../history/AttendanceHistory';
import DashboardLayout from '../layout/DashboardLayout';
import StudentManager from '../students/StudentManager';
import { useNotification } from '../notifications/NotificationContext';
import './Dashboard.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

const formatDateTime = (value) => {
  if (!value) return 'Chưa kết thúc';
  return new Date(value).toLocaleString('vi-VN');
};

const attendanceStatusLabels = {
  present: 'Có mặt',
  late: 'Đi muộn',
};

const viewMeta = {
  attendance: {
    title: 'Điểm danh',
    subtitle: 'Theo dõi buổi học hiện tại và ghi nhận sinh viên có mặt',
  },
  students: {
    title: 'Sinh viên',
    subtitle: 'Thêm, sửa, xóa và tìm kiếm sinh viên trong danh sách lớp',
  },
  history: {
    title: 'Lịch sử',
    subtitle: 'Xem lại từng buổi học và xuất kết quả điểm danh ra Excel',
  },
};

const Dashboard = () => {
  const [activeView, setActiveView] = useState('attendance');
  const [students, setStudents] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [historyRows, setHistoryRows] = useState([]);
  const [historySession, setHistorySession] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const selectedSessionIdRef = useRef('');
  const { notify, confirm } = useNotification();

  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId;
  }, [selectedSessionId]);

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchStudents();
      await fetchHistorySessions();
    };

    initializeDashboard();

    const ws = new WebSocket('ws://127.0.0.1:8000/attendance/ws');

    ws.onopen = () => {
      console.log('Đã kết nối Real-time với Backend');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'CHECKIN_SUCCESS') {
        const checkedInCode = data.student_code;
        const attendanceStatus = data.status || 'present';
        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.student_code === checkedInCode
              ? {
                  ...student,
                  is_present: true,
                  attendance_status: attendanceStatus,
                  status_label: attendanceStatusLabels[attendanceStatus] || 'Có mặt',
                }
              : student
          )
        );
        fetchHistorySessions();
        if (String(data.session_id) === selectedSessionIdRef.current) {
          fetchSessionHistory(data.session_id);
        }
      } else if (data.type === 'RESET_SUCCESS') {
        fetchStudents()
          .then(fetchHistorySessions)
          .then(() => {
            if (selectedSessionIdRef.current) {
              fetchSessionHistory(selectedSessionIdRef.current);
            }
          });
      } else if (data.type === 'SESSION_STARTED') {
        fetchStudents();
        fetchHistorySessions();
      }
    };

    return () => ws.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const searchTimer = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(searchTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentSearch]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionHistory(selectedSessionId);
    } else {
      setHistoryRows([]);
      setHistorySession(null);
    }
  }, [selectedSessionId]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const sessionResponse = await fetch(`${API_BASE_URL}/attendance/active-session`);
      if (!sessionResponse.ok) {
        throw new Error('Không thể kết nối với máy chủ');
      }

      const sessionData = await sessionResponse.json();
      const searchQuery = studentSearch.trim();
      const searchParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const studentsResponse = await fetch(`${API_BASE_URL}/students/status${searchParam}`);

      if (!studentsResponse.ok) {
        throw new Error('Không thể kết nối với máy chủ');
      }

      const studentsData = await studentsResponse.json();
      setStudents(studentsData);
      setActiveSession(sessionData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Lỗi tải dữ liệu...');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistorySessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/sessions`);
      if (!response.ok) throw new Error('Không thể tải lịch sử điểm danh');

      const data = await response.json();
      setSessions(data);

      if (data.length > 0) {
        setSelectedSessionId((currentSessionId) => currentSessionId || String(data[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessionHistory = async (sessionId) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/history/${sessionId}`);
      if (!response.ok) throw new Error('Không thể tải chi tiết buổi học');

      const data = await response.json();
      setHistorySession(data.session);
      setHistoryRows(data.students);
    } catch (err) {
      console.error(err);
      setHistorySession(null);
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddStudent = async (mssv, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_code: mssv.toUpperCase().trim(),
          name: name.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Có lỗi xảy ra khi thêm sinh viên');

      await fetchStudents();
      fetchHistorySessions();
      notify({
        type: 'success',
        title: 'Đã thêm sinh viên',
        message: `MSSV ${data.student_code} đã được thêm vào danh sách lớp.`,
      });
      return true;
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Không thể thêm sinh viên',
        message: err.message,
      });
      return false;
    }
  };

  const handleUpdateStudent = async (studentId, studentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_code: studentData.student_code.toUpperCase().trim(),
          name: studentData.name.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Có lỗi xảy ra khi sửa sinh viên');

      await fetchStudents();
      fetchHistorySessions();
      notify({
        type: 'success',
        title: 'Đã cập nhật sinh viên',
        message: `${data.student_code} đã được lưu thay đổi.`,
      });
      return true;
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Không thể sửa sinh viên',
        message: err.message,
      });
      return false;
    }
  };

  const handleDeleteStudent = async (student) => {
    const isConfirmed = await confirm({
      title: 'Xóa sinh viên',
      message: `Xóa sinh viên ${student.student_code} khỏi danh sách lớp? Lịch sử điểm danh cũ vẫn được giữ lại.`,
      confirmLabel: 'Xóa sinh viên',
      cancelLabel: 'Giữ lại',
      destructive: true,
    });
    if (!isConfirmed) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/students/${student.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Có lỗi xảy ra khi xóa sinh viên');

      setStudents((prevStudents) =>
        prevStudents.filter((currentStudent) => currentStudent.id !== student.id)
      );
      fetchHistorySessions();
      notify({
        type: 'success',
        title: 'Đã xóa sinh viên',
        message: `${student.student_code} đã được bỏ khỏi danh sách lớp.`,
      });
      return true;
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Không thể xóa sinh viên',
        message: err.message,
      });
      return false;
    }
  };

  const handleManualCheckin = async (studentCode, attendanceStatus = 'present') => {
    if (!activeSession) {
      notify({
        type: 'warning',
        title: 'Chưa có buổi học',
        message: 'Vui lòng khởi tạo buổi học trước khi điểm danh.',
      });
      return;
    }

    const statusLabel = attendanceStatusLabels[attendanceStatus] || 'Có mặt';
    const isConfirmed = await confirm({
      title: 'Điểm danh thủ công',
      message: `Xác nhận ghi nhận ${statusLabel.toLowerCase()} cho sinh viên ${studentCode}?`,
      confirmLabel: statusLabel,
      cancelLabel: 'Hủy',
    });
    if (!isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/attendance/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_code: studentCode,
          status: attendanceStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Có lỗi xảy ra khi điểm danh');
      const savedStatus = data.status || attendanceStatus;
      const savedStatusLabel = data.status_label || statusLabel;
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.student_code === studentCode
            ? {
                ...student,
                is_present: true,
                attendance_status: savedStatus,
                status_label: savedStatusLabel,
              }
            : student
        )
      );
      notify({
        type: 'success',
        title: 'Điểm danh thành công',
        message: `${studentCode} đã được ghi nhận ${savedStatusLabel.toLowerCase()}.`,
      });
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Không thể điểm danh',
        message: err.message,
      });
    }
  };

  const handleStartSession = async () => {
    const isConfirmed = await confirm({
      title: 'Khởi tạo buổi học',
      message: 'Tạo buổi học mới để bắt đầu điểm danh?',
      confirmLabel: 'Khởi tạo',
      cancelLabel: 'Hủy',
    });
    if (!isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/attendance/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Không thể khởi tạo buổi học');

      setActiveSession(data.session);
      setSelectedSessionId(String(data.session.id));
      await fetchStudents();
      await fetchHistorySessions();
      notify({
        type: 'success',
        title: 'Đã khởi tạo buổi học',
        message: `${data.session.name} đã sẵn sàng để điểm danh.`,
      });
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Không thể khởi tạo buổi học',
        message: err.message,
      });
    }
  };

  const handleResetAttendance = async () => {
    if (!activeSession) {
      notify({
        type: 'warning',
        title: 'Chưa có buổi học',
        message: 'Không có buổi học đang mở để kết thúc.',
      });
      return;
    }

    const isConfirmed = await confirm({
      title: 'Kết thúc buổi học',
      message: 'Kết thúc buổi học hiện tại và lưu lịch sử điểm danh?',
      confirmLabel: 'Kết thúc',
      cancelLabel: 'Hủy',
    });
    if (!isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/attendance/reset`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Lỗi khi kết thúc buổi học');

      setActiveSession(null);
      await fetchStudents();
      await fetchHistorySessions();
      notify({
        type: 'success',
        title: 'Đã lưu lịch sử',
        message: data.message || 'Đã kết thúc buổi học và lưu lịch sử.',
      });
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Không thể kết thúc buổi học',
        message: err.message,
      });
    }
  };

  const handleExportHistory = async () => {
    if (!selectedSessionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/attendance/history/${selectedSessionId}/export`);
      if (!response.ok) throw new Error('Không thể xuất file Excel');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `diem-danh-buoi-${selectedSessionId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Không thể xuất Excel',
        message: err.message,
      });
    }
  };

  const renderActiveView = () => {
    if (activeView === 'students') {
      return (
        <StudentManager
          students={students}
          searchTerm={studentSearch}
          isLoading={isLoading}
          error={error}
          onSearchChange={setStudentSearch}
          onAddStudent={handleAddStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      );
    }

    if (activeView === 'history') {
      return (
        <AttendanceHistory
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          historyRows={historyRows}
          historySession={historySession}
          historyLoading={historyLoading}
          formatDateTime={formatDateTime}
          onSessionChange={setSelectedSessionId}
          onExportHistory={handleExportHistory}
        />
      );
    }

    return (
      <AttendanceOverview
        students={students}
        activeSession={activeSession}
        searchTerm={studentSearch}
        isLoading={isLoading}
        error={error}
        onSearchChange={setStudentSearch}
        onManualCheckin={handleManualCheckin}
        onStartSession={handleStartSession}
        onResetAttendance={handleResetAttendance}
      />
    );
  };

  return (
    <DashboardLayout
      activeView={activeView}
      activeItem={viewMeta[activeView]}
      onViewChange={setActiveView}
    >
      {renderActiveView()}
    </DashboardLayout>
  );
};

export default Dashboard;
