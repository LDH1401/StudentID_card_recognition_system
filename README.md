# Hệ thống điểm danh \_ nhận diện MSSV

<figure align="center">
  <img src="./images/test1.jpg" alt="Trang điểm danh" />
  <figcaption><i>Giao diện điểm danh</i></figcaption>
</figure>

<figure align="center">
  <img src="./images/test2.jpg" alt="Trang điểm danh" />
  <figcaption><i>Giao diện quản lí</i></figcaption>
</figure>

## 💻 Công nghệ sử dụng

### AI

- **YOLO (You Only Look Once):** Nhận diện và khoanh vùng (Object Detection) chính xác vị trí thẻ sinh viên trong khung hình.
- **OpenCV:** Tiền xử lý ảnh
- **PaddleOCR:** Trích xuất văn bản quang học (OCR)
- **Regex (Biểu thức chính quy):** Hậu xử lý dữ liệu

### Backend

- **FastAPI:** Xây dựng hệ thống RESTful API
- **SQLAlchemy:** ORM (Object-Relational Mapping) để tương tác an toàn và tiện lợi với cơ sở dữ liệu.
- **Pydantic:** Validation dữ liệu đầu vào/đầu ra chuẩn xác.

### Database

- **MySQL:** Lưu trữ thông tin sinh viên và lịch sử điểm danh với cấu trúc quan hệ

### Frontend

- **ReactJS:** Xây dựng giao diện Single-Page Application (SPA)
