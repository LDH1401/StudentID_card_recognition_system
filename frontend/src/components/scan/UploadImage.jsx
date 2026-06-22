import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import "./UploadImage.css";

const UploadImage = () => {
  const webcamRef = useRef(null);
  const [studentId, setStudentId] = useState(null);
  const [error, setError] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const isProcessingRef = useRef(false);
  const cooldownRef = useRef(false);    

  const playSuccessSound = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
    oscillator.stop(audioCtx.currentTime + 0.2);
  };

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

  const autoCaptureAndUpload = useCallback(async () => {
    if (isProcessingRef.current || cooldownRef.current || !webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    isProcessingRef.current = true;
    setError(null);
    setMessageType(null);

    const blob = dataURLtoBlob(imageSrc);
    const formData = new FormData();
    formData.append("file", blob, "webcam_capture.jpg");

    try {
      const response = await fetch("http://127.0.0.1:8000/attendance/checkin", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStudentId(data.student_code);
        playSuccessSound();

        cooldownRef.current = true;
        setTimeout(() => {
          cooldownRef.current = false;
          setStudentId(null);
        }, 3000);

      } else {
        setStudentId(null);

        if (data.code === "ALREADY_CHECKED_IN" || data.code === "NO_ACTIVE_SESSION") {
          setError(data.message || "Bạn đã điểm danh rồi!");
          setMessageType("warning");
          cooldownRef.current = true;
          setTimeout(() => {
            cooldownRef.current = false;
            setError(null);
            setMessageType(null);
          }, 3000);
        } else {
          // Loi OCR hoac sinh vien khong co trong lop se tiep tuc hien trang thai dang quet.
          setError(null);
          setMessageType(null);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối đến máy chủ");
      setMessageType("error");
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  useEffect(() => {
    console.log("🚀 Bắt đầu luồng quét thẻ tự động...");
    
    const intervalId = setInterval(() => {
      autoCaptureAndUpload();
    }, 1500);

    return () => clearInterval(intervalId);
  }, [autoCaptureAndUpload]);

  return (
    <main className="upload-wrapper">
      <section className="upload-container" aria-label="Điểm danh bằng thẻ sinh viên">
        <div className="upload-header">
          <span className="upload-kicker">PTIT</span>
          <h2 className="upload-title">Quét thẻ sinh viên</h2>
        </div>

        <div className="webcam-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            className="webcam-video"
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{ facingMode: "environment" }} 
          />
          <div className="webcam-guideline">
            <span className="corner corner-top-left"></span>
            <span className="corner corner-top-right"></span>
            <span className="corner corner-bottom-left"></span>
            <span className="corner corner-bottom-right"></span>
          </div>
          <div className="scan-line"></div>
        </div>

        <div className="scan-status">
          {studentId ? (
            <div className="result-box result-success">
              <span>Điểm danh thành công</span>
              <strong>{studentId}</strong>
            </div>
          ) : error ? (
             <div className={`result-box ${messageType === "warning" ? "result-warning" : "result-error"}`}>{error}</div>
          ) : (
            <div className="result-box result-waiting">
              <span className="blinking-dot"></span> Đang quét thẻ...
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default UploadImage;
