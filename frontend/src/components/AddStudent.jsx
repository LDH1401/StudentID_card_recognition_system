import React, { useState } from 'react';

const AddStudent = ({ onAddStudent }) => {
  const [newMssv, setNewMssv] = useState('');
  const [newName, setNewName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMssv || !newName) {
      alert("Vui lòng nhập đủ MSSV và Họ Tên!");
      return;
    }
    
    // Gọi hàm từ component cha truyền xuống
    const isSuccess = await onAddStudent(newMssv, newName);
    
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