import cv2
import re
import os
from app.services.yolo_service import yolo_service 
from app.services.ocr_service import ocr_service

def process_student_card(image_path: str):
    # 1. Kiểm tra file và đọc ảnh
    if not os.path.exists(image_path):
        print(f"File không tồn tại: {image_path}")
        return None
        
    image = cv2.imread(image_path)
    if image is None:
        return None

    # 2. Dùng YOLO để tìm khung chứa MSSV
    box = yolo_service.detect_student_card(image_path) 
    
    if box is not None:
        x1, y1, x2, y2 = map(int, box)
        # Thêm padding 15px để tránh mất nét chữ ở rìa
        h, w, _ = image.shape
        y_min, y_max = max(0, y1-15), min(h, y2+15)
        x_min, x_max = max(0, x1-15), min(w, x2+15)
        cropped_img = image[y_min:y_max, x_min:x_max]
    else:
        # YOLO không tìm thấy vùng mssv
        cropped_img = None

    # 3. Sử dụng PaddleOCR đọc chữ
    raw_text = ocr_service.extract_text(cropped_img)
    print(f"[DEBUG] OCR nhận diện: '{raw_text}'")

    # 4. Hậu xử lý
    clean_text = raw_text.replace(" ", "").upper()

    # 1 chữ cái + 2 số + 4 chữ cái + 3 số (Ví dụ: B23DCAT073)
    pattern = r'[A-Z]\d{2}[A-Z]{4}\d{3}'
    match = re.search(pattern, clean_text)

    if match:
        final_result = match.group()
        print(f"[INFO] Tìm thấy MSSV: {final_result}")
        return final_result
    
    return clean_text if clean_text else "Không nhận diện được"