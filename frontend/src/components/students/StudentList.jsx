import React, { useState } from 'react';
import { useNotification } from '../notifications/NotificationContext';

const StudentList = ({
  students,
  searchTerm,
  isLoading,
  error,
  onSearchChange,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingCode, setEditingCode] = useState('');
  const [editingName, setEditingName] = useState('');
  const { notify } = useNotification();

  const totalStudents = students.length;

  const startEdit = (student) => {
    setEditingStudentId(student.id);
    setEditingCode(student.student_code);
    setEditingName(student.name || '');
  };

  const cancelEdit = () => {
    setEditingStudentId(null);
    setEditingCode('');
    setEditingName('');
  };

  const saveEdit = async (student) => {
    const trimmedCode = editingCode.trim().toUpperCase();
    const trimmedName = editingName.trim();

    if (!trimmedCode || !trimmedName) {
      notify({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đủ MSSV và Họ Tên.',
      });
      return;
    }

    if (trimmedCode.length !== 10) {
      notify({
        type: 'warning',
        title: 'MSSV chưa hợp lệ',
        message: 'Mã sinh viên phải có đúng 10 ký tự.',
      });
      return;
    }

    if (trimmedName.length < 3) {
      notify({
        type: 'warning',
        title: 'Tên chưa hợp lệ',
        message: 'Họ và Tên phải có từ 3 ký tự trở lên.',
      });
      return;
    }

    const isSuccess = await onUpdateStudent(student.id, {
      student_code: trimmedCode,
      name: trimmedName,
    });

    if (isSuccess) {
      cancelEdit();
    }
  };

  return (
    <div className="dashboard-card card-right">
      <div className="card-title-wrapper" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h2 className="card-title" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
          Danh sách lớp học
          <span className="badge-count">Sĩ số: {totalStudents}</span>
        </h2>

        <div className="student-toolbar">
          <input
            type="search"
            className="student-search-input"
            placeholder="Tìm theo MSSV hoặc họ tên"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

      </div>

      {isLoading ? (
        <div className="status-box status-loading">⏳ Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="status-box status-error">❌ {error}</div>
      ) : totalStudents === 0 ? (
        <div className="status-box status-success">Không tìm thấy sinh viên phù hợp.</div>
      ) : (
        <table className="student-table">
          <thead>
            <tr className="table-head-row">
              <th>STT</th>
              <th>Sinh Viên</th>
              <th>Quản lý</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const isEditing = editingStudentId === student.id;

              return (
                <tr key={student.id || index} className="table-body-row">
                  <td>{index + 1}</td>
                  <td>
                    {isEditing ? (
                      <div className="student-edit-fields">
                        <input
                          type="text"
                          className="table-input"
                          value={editingCode}
                          onChange={(event) => setEditingCode(event.target.value)}
                        />
                        <input
                          type="text"
                          className="table-input"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="student-profile">
                        <div className="avatar">👤</div>
                        <div className="student-info">
                          <span className="student-name">{student.name}</span>
                          <span className="student-code-small">{student.student_code}</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="row-actions">
                        <button className="btn-table btn-save" onClick={() => saveEdit(student)}>
                          Lưu
                        </button>
                        <button className="btn-table btn-cancel" onClick={cancelEdit}>
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="row-actions">
                        <button className="btn-table btn-edit" onClick={() => startEdit(student)}>
                          Sửa
                        </button>
                        <button className="btn-table btn-delete" onClick={() => onDeleteStudent(student)}>
                          Xóa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

    </div>
  );
};

export default StudentList;
