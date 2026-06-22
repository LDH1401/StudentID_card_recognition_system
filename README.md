# Hệ thống đọc và nhận diện thẻ sinh viên PTIT

Hệ thống điểm danh tự động bằng cách **nhận diện mã sinh viên (MSSV) trên thẻ sinh viên PTIT** từ ảnh/webcam. Ứng dụng dùng **YOLO** để phát hiện vùng chứa MSSV trên thẻ, **PaddleOCR** để đọc ký tự, sau đó đối chiếu với danh sách lớp để ghi nhận điểm danh theo từng buổi học. Kết quả được cập nhật **realtime** lên dashboard và có thể **xuất file Excel**.

## Tính năng chính

- 📷 **Quét thẻ điểm danh**: chụp ảnh/tải ảnh thẻ sinh viên, hệ thống tự nhận diện MSSV và ghi nhận điểm danh.
- 🧠 **Pipeline AI**: YOLO (`best.pt`) khoanh vùng MSSV → tiền xử lý ảnh (OpenCV: grayscale, CLAHE, denoise, threshold, sharpen) → PaddleOCR đọc text → regex chuẩn hóa mã (ví dụ `B23DCCN313`).
- 👥 **Quản lý sinh viên**: thêm / sửa / xóa (xóa mềm) sinh viên trong lớp, kèm validate định dạng mã và họ tên.
- 🕒 **Quản lý buổi học**: mở buổi điểm danh, theo dõi sĩ số, có mặt / đi muộn / vắng; điểm danh thủ công khi cần.
- 📊 **Dashboard realtime**: cập nhật trạng thái điểm danh tức thì qua **WebSocket**.
- 🗂️ **Lịch sử & xuất Excel**: lưu lịch sử từng buổi học và xuất kết quả điểm danh ra file `.xlsx`.

## Kiến trúc

```
┌──────────────┐        HTTP / WebSocket        ┌──────────────────────┐
│   Frontend   │  ───────────────────────────►  │       Backend        │
│ React + Vite │                                │       FastAPI        │
│  (webcam UI) │  ◄───────────────────────────  │                      │
└──────────────┘        JSON / realtime         │  ┌────────────────┐  │
                                                 │  │  AI Pipeline   │  │
                                                 │  │ YOLO + Paddle  │  │
                                                 │  │     OCR        │  │
                                                 │  └────────────────┘  │
                                                 │          │           │
                                                 │     SQLAlchemy        │
                                                 └──────────┼───────────┘
                                                            ▼
                                                      MySQL Database
```

## Công nghệ sử dụng

**Backend**
- FastAPI + Uvicorn
- SQLAlchemy + PyMySQL (MySQL)
- Ultralytics YOLO (phát hiện vùng MSSV)
- PaddleOCR (nhận diện ký tự)
- OpenCV (tiền xử lý ảnh)
- openpyxl (xuất Excel)

**Frontend**
- React 19 + Vite
- React Router DOM
- react-webcam

## Cấu trúc thư mục

```
.
├── backend/
│   ├── AI_service/
│   │   └── weights/best.pt          # Model YOLO đã huấn luyện
│   ├── app/
│   │   ├── main.py                  # Khởi tạo FastAPI, CORS, router
│   │   ├── database.py              # Kết nối DB (SQLAlchemy)
│   │   ├── migrations.py            # Bổ sung schema khi khởi động
│   │   ├── crud.py                  # Truy vấn / nghiệp vụ DB
│   │   ├── models/                  # ORM models (Student, Attendance, Session)
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── routers/                 # API routes (students, attendance)
│   │   └── services/
│   │       ├── yolo_service.py      # Phát hiện vùng MSSV
│   │       ├── ocr_service.py       # Đọc text bằng PaddleOCR
│   │       └── pipeline_service.py  # Pipeline xử lý ảnh thẻ
│   ├── requirements.txt
│   └── .env                         # DATABASE_URL
└── frontend/
    ├── src/
    │   ├── pages/                   # ScanPage, DashboardPage
    │   └── components/              # scan, dashboard, students, history...
    ├── package.json
    └── vite.config.js
```

## Yêu cầu hệ thống

- Python 3.11
- Node.js 18+ và npm
- MySQL Server

## Cài đặt & chạy

### 1. Chuẩn bị cơ sở dữ liệu

Tạo database và user trong MySQL khớp với `backend/.env`:

```sql
CREATE DATABASE attendance_system;
CREATE USER 'attendance_user'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON attendance_system.* TO 'attendance_user'@'localhost';
FLUSH PRIVILEGES;
```

Cấu hình kết nối tại `backend/.env`:

```
DATABASE_URL=mysql+pymysql://attendance_user:123456@localhost:3306/attendance_system
```

> Các bảng được tạo tự động khi khởi động backend (`Base.metadata.create_all` + migrations).

### 2. Chạy Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Cần thêm PaddleOCR (không có trong requirements.txt)
pip install paddleocr paddlepaddle

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend chạy tại `http://127.0.0.1:8000` — tài liệu API tự động tại `http://127.0.0.1:8000/docs`.

### 3. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại địa chỉ Vite hiển thị (mặc định `http://localhost:5173`).

> Frontend gọi API trực tiếp tới `http://127.0.0.1:8000`. Nếu đổi host/port backend, cập nhật `API_BASE_URL` trong `frontend/src/components/dashboard/Dashboard.jsx` và các fetch tương ứng.

## API chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/students/` | Thêm sinh viên vào lớp |
| `GET` | `/students/` | Danh sách sinh viên (hỗ trợ tìm kiếm) |
| `PUT` | `/students/{id}` | Cập nhật thông tin sinh viên |
| `DELETE` | `/students/{id}` | Xóa (mềm) sinh viên |
| `GET` | `/students/status` | Trạng thái điểm danh của sinh viên |
| `POST` | `/attendance/sessions` | Mở buổi học mới |
| `GET` | `/attendance/active-session` | Buổi học đang mở |
| `POST` | `/attendance/checkin` | Điểm danh bằng ảnh thẻ (AI) |
| `POST` | `/attendance/manual` | Điểm danh thủ công (present/late) |
| `DELETE` | `/attendance/reset` | Kết thúc buổi học, lưu lịch sử |
| `GET` | `/attendance/sessions` | Danh sách các buổi học |
| `GET` | `/attendance/history/{id}` | Lịch sử điểm danh một buổi |
| `GET` | `/attendance/history/{id}/export` | Xuất kết quả ra Excel |
| `WS` | `/attendance/ws` | Kênh realtime cập nhật điểm danh |

## Định dạng mã sinh viên

Hệ thống kiểm tra MSSV theo mẫu `[A-Z]\d{2}[A-Z]{4}\d{3}`, ví dụ: **B23DCCN313**.

## Quy trình điểm danh

1. Mở một **buổi học** trên Dashboard.
2. Tại trang quét, **chụp / tải ảnh** thẻ sinh viên.
3. Backend chạy **YOLO → tiền xử lý → PaddleOCR** để lấy MSSV.
4. Đối chiếu MSSV với danh sách lớp → ghi nhận điểm danh (chống điểm danh trùng).
5. Kết quả hiển thị **realtime** trên Dashboard; khi kết thúc có thể **xuất Excel**.

## Tác giả

**Lê Duy Hùng** — Đồ án Hệ thống đọc và nhận diện thẻ sinh viên PTIT.
</content>
