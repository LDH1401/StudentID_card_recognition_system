from pathlib import Path
from ultralytics import YOLO

class YOLOService:
    def __init__(self):
        model_path = "AI_service/weights/best.pt"
        print(f"Loading YOLO model từ: {model_path}")
        self.model = YOLO(str(model_path))

    def detect_student_card(self, image_path):
        try:
            results = self.model(image_path, conf=0.4)
            
            for result in results:
                if len(result.boxes) > 0:
                    # Tìm kiếm box có label là 'mssv'
                    for box in result.boxes:
                        class_id = int(box.cls[0].item())
                        class_name = result.names[class_id]
                        
                        if class_name == 'mssv':
                            bbox = box.xyxy[0].cpu().numpy()
                            print(f"Found 'mssv' bbox: {bbox}")
                            return bbox
                    
                    # Nếu không tìm thấy 'mssv', trả về None
                    print(f"Available classes: {[result.names[int(b.cls[0].item())] for b in result.boxes]}")
                    return None
                else:
                    print("No boxes detected")
                    return None
        
        except Exception as e:
            print(f"Error in detect_student_card: {e}")
            return None

yolo_service = YOLOService()