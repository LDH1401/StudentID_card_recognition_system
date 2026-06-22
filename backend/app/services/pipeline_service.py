import cv2
import re
import os
from app.services.yolo_service import yolo_service 
from app.services.ocr_service import ocr_service

def preprocess_for_ocr(image_crop):
    """
    Tien xu ly vung MSSV truoc khi dua vao OCR.
    Pipeline: grayscale -> resize -> contrast -> denoise -> threshold -> sharpen.
    """
    if image_crop is None or image_crop.size == 0:
        return image_crop

    # 1. Grayscale
    if len(image_crop.shape) == 3:
        gray = cv2.cvtColor(image_crop, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_crop

    # 2. Resize de chu lon va ro hon cho OCR
    resized = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

    # 3. Tang contrast bang CLAHE de xu ly anh sang khong deu
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    contrasted = clahe.apply(resized)

    # 4. Denoise
    denoised = cv2.fastNlMeansDenoising(
        contrasted,
        None,
        h=10,
        templateWindowSize=7,
        searchWindowSize=21
    )

    # 5. Threshold
    thresholded = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11
    )

    # 6. Sharpen
    blurred = cv2.GaussianBlur(thresholded, (0, 0), 1.0)
    sharpened = cv2.addWeighted(thresholded, 1.5, blurred, -0.5, 0)

    # PaddleOCR nhan anh mau on dinh hon qua cac phien ban, nen doi lai BGR.
    return cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)

def process_student_card(image_path: str):
    # 1. Kiểm tra file và đọc ảnh
    if not os.path.exists(image_path):
        print(f"File không tồn tại: {image_path}")
        return None
        
    image = cv2.imread(image_path)
    if image is None:
        print("Lỗi: Không thể giải mã dữ liệu ảnh")
        return None

    # 2. Dùng YOLO để tìm khung chứa MSSV
    box = yolo_service.detect_student_card(image_path) 
    
    if box is not None:
        x1, y1, x2, y2 = map(int, box)
        h, w, _ = image.shape
        
        # --- TÍNH TOÁN CẮT 70% PHÍA DƯỚI ---
        box_height = y2 - y1
        
        # Dịch cạnh trên (y1) xuống 30% để loại bỏ hoàn toàn chữ "Mã SV"
        y_cut_top = y1 + int(box_height * 0.35)
        
        # Padding
        y_min = max(0, y_cut_top) 
        y_max = min(h, y2 + 10)
        x_min = max(0, x1 - 10)
        x_max = min(w, x2 + 10)
        
        cropped_img = image[y_min:y_max, x_min:x_max]
    else:
        # Nếu YOLO không tìm thấy vùng mssv, thoát hàm luôn để tránh truyền None cho PaddleOCR
        print("[PIPELINE] YOLO không phát hiện được vùng mã số sinh viên.")
        return None

   
    # 3. Tien xu ly anh roi su dung PaddleOCR doc chu
    preprocessed_img = preprocess_for_ocr(cropped_img)
    raw_text = ocr_service.extract_text(preprocessed_img)
    print(f"[DEBUG] OCR nhận diện: '{raw_text}'")

    # 4. Hậu xử lý
    if not raw_text:
        return None

    clean_text = raw_text.replace(" ", "").upper()

    pattern = r'[A-Z]\d{2}[A-Z]{4}\d{3}'  # Ví dụ B23DCAT073
    match = re.search(pattern, clean_text)

    if match:
        final_result = match.group()
        print(f"[INFO] Tìm thấy MSSV: {final_result}")
        return final_result
    
    return clean_text
