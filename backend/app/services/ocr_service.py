import os
import logging
import numpy as np
from paddleocr import PaddleOCR

# --- KHẮC PHỤC LỖI HỆ THỐNG ---
# 1. Tắt oneDNN để tránh lỗi NotImplementedError trên Windows
os.environ['FLAGS_use_onednn'] = '0'
# 2. Cho phép trùng lặp thư viện libiomp5md.dll
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
# 3. Tắt log check kết nối model của Paddle
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'

# Tắt các log thừa của thư viện ppocr
logging.getLogger('ppocr').setLevel(logging.ERROR)

class OCRService:
    def __init__(self):
        # Khởi tạo PaddleOCR
        self.reader = PaddleOCR(use_angle_cls=True, lang='en')

    def extract_text(self, image_crop):
        """
        Nhận diện chữ từ vùng ảnh đã cắt.
        image_crop: mảng numpy (OpenCV)
        """
        # BẢO VỆ: Chặn lỗi "Not supported input data type" do biến None
        if image_crop is None or image_crop.size == 0:
            print("[OCR] Bỏ qua vì ảnh cắt bị rỗng.")
            return ""

        try:
            # Gọi hàm ocr (đã bỏ cls=True để tránh lỗi TypeError ở bản mới)
            result = self.reader.ocr(image_crop)
            
            full_text = []
            if result and result[0]:
                for line in result[0]:
                    # line[1][0] là chuỗi văn bản nhận diện được
                    text = line[1][0]
                    full_text.append(str(text))
            
            return " ".join(full_text).strip().upper()
        except Exception as e:
            print(f"Lỗi trong quá trình OCR: {e}")
            return ""

ocr_service = OCRService()