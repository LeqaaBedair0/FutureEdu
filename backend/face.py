# =========================================================
#   Face Recognition API Server (FastAPI) - Attendance Ready
#   Accepts base64 image → returns recognized faces + match flag
#   Auto-register from folder + dynamic single/student registration
#   Updated Feb 2026 – Fully dynamic, reliable attendance detection
# =========================================================

import sys
import io
import json
import base64
import cv2
import numpy as np
import faiss
import os
import traceback
import time
from pathlib import Path
import uvicorn

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from insightface.app import FaceAnalysis

# Force UTF-8 encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ─── Settings ───────────────────────────────────────────────
REGISTER_FOLDER      = r"D:\1 ssooo improtant\iotprogect\register_faces"
THRESHOLD_COSINE     = 0.45        # عام للتعرف
ATTENDANCE_THRESHOLD = 0.68        # أعلى لتسجيل الحضور بثقة
MIN_FACE_SIZE        = 50
BLUR_THRESHOLD       = 50
FACE_MODEL_NAME      = "buffalo_l"
DET_SIZE             = (416, 416)

# ─── Create FastAPI app ─────────────────────────────────────
app = FastAPI(
    title="Face Recognition & Attendance API",
    description="يقبل صورة base64 ويعيد الأشخاص المكتشفين + علم نجاح المطابقة + تسجيل وجوه ديناميكي",
    version="1.3-dynamic",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS Middleware ────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# ─── Quality Checker ────────────────────────────────────────
class FaceQualityChecker:
    def __init__(self, min_size=MIN_FACE_SIZE, blur_th=BLUR_THRESHOLD):
        self.min_size = min_size
        self.blur_th = blur_th

    def check_size(self, bbox):
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        return w >= self.min_size and h >= self.min_size

    def check_blur(self, crop):
        if crop.size == 0:
            return False
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        return cv2.Laplacian(gray, cv2.CV_64F).var() > self.blur_th

    def evaluate(self, face, img):
        score = 0
        bbox = face.bbox.astype(int)
        if self.check_size(bbox):
            score += 1
        crop = img[bbox[1]:bbox[3], bbox[0]:bbox[2]]
        if self.check_blur(crop):
            score += 1
        return score >= 1


# ─── Recognition System ─────────────────────────────────────
class FaceRecognitionSystem:
    def __init__(self):
        print("جاري تحميل موديل insightface buffalo_l ...")
        try:
            self.app = FaceAnalysis(name=FACE_MODEL_NAME, providers=['CPUExecutionProvider'])
            self.app.prepare(ctx_id=0, det_size=DET_SIZE)
        except Exception as e:
            print(f"خطأ في تحميل الموديل: {e}")
            traceback.print_exc()
            sys.exit(1)

        self.quality = FaceQualityChecker()
        self.index = faiss.IndexFlatIP(512)
        self.labels = []

        print("→ نظام التعرف جاهز")

    def add_person(self, name, image_paths):
        embs = []
        valid_images = 0

        for path in image_paths:
            if not os.path.exists(path):
                print(f"الملف غير موجود: {path}")
                continue

            img = cv2.imread(path)
            if img is None:
                print(f"تعذر قراءة الصورة: {path}")
                continue

            faces = self.app.get(img)
            for f in faces:
                if f.embedding is not None:
                    emb = f.embedding / np.linalg.norm(f.embedding)
                    embs.append(emb)
                    valid_images += 1

        if not embs:
            print(f"ما فيش وجوه صالحة لـ {name}")
            return False

        avg_emb = np.mean(embs, axis=0)
        avg_emb /= np.linalg.norm(avg_emb)

        self.labels.append(name)
        self.index.add(np.array([avg_emb], dtype=np.float32))

        print(f"تم إضافة {name} ({valid_images} صور صالحة)")
        return True

    def recognize_frame(self, frame):
        try:
            start_time = time.time()
            faces = self.app.get(frame)
            total_detected = len(faces)
            valid_faces = 0
            final_results = []
            best_match = None
            highest_conf = -1.0

            print(f"تم الكشف عن {total_detected} وجه  ({time.time()-start_time:.3f}s)")

            for face in faces:
                if not self.quality.evaluate(face, frame):
                    continue

                valid_faces += 1

                if face.embedding is None:
                    continue

                query = face.embedding / np.linalg.norm(face.embedding)
                query = np.array([query], dtype=np.float32)

                distances, indices = self.index.search(query, 1)
                sim = distances[0][0]

                name = self.labels[indices[0][0]] if sim >= THRESHOLD_COSINE else "Unknown"
                if sim < 0.30:
                    name = "Unknown"

                conf = float(sim)

                print(f" → {conf:.4f} | {name}")

                result = {
                    "bbox": face.bbox.astype(int).tolist() if face.bbox is not None else None,
                    "name": name,
                    "confidence": conf,
                    "similarity": conf,
                }
                final_results.append(result)

                # Track best match for attendance
                if name != "Unknown" and conf > highest_conf:
                    highest_conf = conf
                    best_match = {"name": name, "confidence": conf}

            print(f" | وجوه صالحة: {valid_faces} | نتايج: {len(final_results)}")

            match_success = highest_conf >= ATTENDANCE_THRESHOLD

            return {
                "results": final_results,
                "match_success": match_success,
                "best_match": best_match if match_success else None
            }

        except Exception as e:
            print(f"خطأ أثناء التعرف: {str(e)}")
            traceback.print_exc()
            return {"results": [], "match_success": False, "best_match": None}

    def register_new_face(self, student_code):
        folder_path = os.path.join(REGISTER_FOLDER, student_code)
        if not os.path.exists(folder_path):
            print(f"مجلد الطالب غير موجود: {folder_path}")
            return False, f"مجلد {student_code} غير موجود"

        images = [os.path.join(folder_path, f) for f in os.listdir(folder_path) 
                  if f.lower().endswith((".jpg", ".jpeg", ".png"))]

        if not images:
            print(f"لا توجد صور في مجلد {student_code}")
            return False, "لا توجد صور صالحة"

        success = self.add_person(student_code, images)
        if success:
            return True, f"تم تسجيل وجه {student_code} بنجاح ({len(images)} صور)"
        else:
            return False, f"فشل تسجيل وجه {student_code} (لا يوجد وجوه صالحة)"


# ─── Auto Register from Folder at Startup ───────────────────
def auto_register(system):
    folder = Path(REGISTER_FOLDER)
    if not folder.exists():
        print(f"مجلد التسجيل غير موجود: {folder}")
        return

    print("\nجاري التسجيل التلقائي من المجلد...")
    added = 0

    for person_dir in folder.iterdir():
        if not person_dir.is_dir():
            continue

        name = person_dir.name
        images = [str(p) for p in person_dir.glob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]

        if images and system.add_person(name, images):
            added += 1

    print(f"→ تم تسجيل {added} شخص بنجاح من المجلد")


# ─── Initialize ─────────────────────────────────────────────
system = FaceRecognitionSystem()
auto_register(system)

if not system.labels:
    print("⚠️  تحذير: لا يوجد أشخاص مسجلين → كل النتائج ستكون Unknown")


# ─── Models ─────────────────────────────────────────────────
class ImageData(BaseModel):
    image: str  # base64 string (with or without data:image prefix)


class RegisterRequest(BaseModel):
    student_code: str


# ─── Endpoints ──────────────────────────────────────────────
@app.post("/recognize", response_class=JSONResponse)
async def recognize_face(data: ImageData):
    try:
        # Remove data URL prefix if present
        if data.image.startswith("data:image"):
            base64_str = data.image.split(",", 1)[1]
        else:
            base64_str = data.image

        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise ValueError("تعذر فك تشفير الصورة")

        result_data = system.recognize_frame(frame)

        return {
            "status": "success",
            "faces_detected": len(result_data["results"]),
            "results": result_data["results"],
            "match_success": result_data["match_success"],
            "best_match": result_data["best_match"]
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"خطأ في معالجة الصورة: {str(e)}")


@app.post("/register_new_face")
async def register_new_face(req: RegisterRequest):
    try:
        success, message = system.register_new_face(req.student_code)
        if success:
            return {"status": "success", "message": message}
        else:
            raise HTTPException(status_code=400, detail=message)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"فشل تسجيل وجه جديد: {str(e)}")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "registered_persons": len(system.labels),
        "model": FACE_MODEL_NAME,
        "threshold_attendance": ATTENDANCE_THRESHOLD,
        "threshold_cosine": THRESHOLD_COSINE
    }


if __name__ == "__main__":
    print("\n" + "="*80)
    print("   Face Recognition & Attendance API جاهزة - ديناميكية كاملة")
    print("   →  http://localhost:8000")
    print("   • POST /recognize          ← { \"image\": \"base64...\" }")
    print("   • POST /register_new_face  ← { \"student_code\": \"112233\" }")
    print("   • GET  /health             ← حالة النظام")
    print("   • GET  /docs               ← Swagger UI للتجربة")
    print("="*80 + "\n")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False,          # غيّر إلى True أثناء التطوير
        log_level="info"
    )