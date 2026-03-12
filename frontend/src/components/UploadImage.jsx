import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import "./UploadImage.css";

const UploadImage = () => {
  const webcamRef = useRef(null);
  const [studentId, setStudentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hàm chuyển đổi ảnh Base64 từ Webcam thành dạng File (Blob) để gửi cho FastAPI
  const dataURLtoBlob = (dataurl) => {
    let arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Hàm xử lý chụp và gửi API
  const captureAndUpload = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsLoading(true);
    setError(null);
    setStudentId(null);

    // 1. Chụp ảnh từ Webcam
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      setError("Không thể chụp ảnh. Vui lòng kiểm tra lại Camera.");
      setIsLoading(false);
      return;
    }

    // 2. Chuyển đổi và đóng gói ảnh
    const blob = dataURLtoBlob(imageSrc);
    const formData = new FormData();
    formData.append("file", blob, "webcam_capture.jpg"); // Gửi dưới tên file 'webcam_capture.jpg'

    // 3. Gọi API FastAPI
    try {
      const response = await fetch("http://127.0.0.1:8000/attendance/checkin", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("API DATA:", data);

      // SỬA CHỖ NÀY: Dùng data.success để quyết định thành công hay thất bại
      if (data.success) {
        setStudentId(data.student_code);
        // (Tùy chọn) Phát tiếng "Tít" khi thành công ở đây
      } else {
        // Lấy thông báo lỗi từ Backend (ví dụ: "Bạn không có trong danh sách lớp!")
        setError(
          data.message || "Không tìm thấy mã sinh viên. Hãy thử đưa thẻ vào sát khung hơn!",
        );
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối đến máy chủ AI.");
    } finally {
      setIsLoading(false);
    }
  }, [webcamRef]);

  return (
    <div className="upload-wrapper">
      <div className="upload-container">
        <h2 className="upload-title">Điểm Danh Bằng Thẻ Sinh Viên PTIT</h2>

        {/* Khung Live Camera */}
        <div className="webcam-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{ facingMode: "environment" }} // Ưu tiên camera sau nếu dùng điện thoại
          />
          {/* Khung ngắm đứt nét */}
          <div className="webcam-guideline"></div>
        </div>

        {/* Nút Chụp ảnh */}
        <button
          className="btn-upload"
          onClick={captureAndUpload}
          disabled={isLoading}
        >
          {isLoading ? "Đang nhận diện..." : "Chụp & Nhận Diện"}
        </button>

        {/* Khu vực hiển thị kết quả */}
        <div>
          {error && <div className="result-box result-error">❌ {error}</div>}

          {!error && studentId && (
            <div className="result-box result-success">
              ✅ Điểm danh thành công! <br />
              <span>{studentId}</span>
            </div>
          )}
          {!error && !studentId && !isLoading && (
            <div className="result-box result-waiting">
              📌 Hãy đưa thẻ vào khung đứt nét và nhấn nút Chụp
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadImage;