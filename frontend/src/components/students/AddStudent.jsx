import React, { useState } from 'react';
import { useNotification } from '../notifications/NotificationContext';

const AddStudent = ({ onAddStudent }) => {
  const [newMssv, setNewMssv] = useState('');
  const [newName, setNewName] = useState('');
  const { notify } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Loại bỏ khoảng trắng ở đầu và cuối chuỗi trước khi kiểm tra
    const trimmedMssv = newMssv.trim();
    const trimmedName = newName.trim();

    // 1. Kiểm tra không được để trống
    if (!trimmedMssv || !trimmedName) {
      notify({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đủ MSSV và Họ Tên.',
      });
      return;
    }

    // 2. Kiểm tra độ dài mã sinh viên (chính xác 10 ký tự)
    if (trimmedMssv.length !== 10) {
      notify({
        type: 'warning',
        title: 'MSSV chưa hợp lệ',
        message: 'Mã sinh viên phải có đúng 10 ký tự.',
      });
      return;
    }

    // 3. Kiểm tra độ dài tên (lớn hơn hoặc bằng 3 ký tự)
    if (trimmedName.length < 3) {
      notify({
        type: 'warning',
        title: 'Tên chưa hợp lệ',
        message: 'Họ và Tên phải có từ 3 ký tự trở lên.',
      });
      return;
    }
    
    // Gọi hàm từ component cha truyền xuống
    const isSuccess = await onAddStudent(trimmedMssv, trimmedName);
    
    // Nếu API thành công thì mới xóa trắng ô nhập liệu
    if (isSuccess) {
      setNewMssv('');
      setNewName('');
    }
  };

  return (
    <div className="dashboard-card card-left">
      <h2 className="card-title bordered">➕ Thêm Sinh Viên</h2>
      <form onSubmit={handleSubmit} className="student-form">
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
        <button type="submit" className="btn-submit">Lưu Thông Tin</button>
      </form>
    </div>
  );
};

export default AddStudent;
