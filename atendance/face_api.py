# face_api.py - Face Recognition API Server for React Frontend
# ============================================================

import cv2
import numpy as np
import faiss
import base64
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from insightface.app import FaceAnalysis
from pathlib import Path
import time

app = FastAPI(title="Face Recognition API - School Attendance")
from fastapi.middleware.cors import CORSMiddleware

# أضف ده بعد app = FastAPI(...)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # بورت React بتاعك
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Settings ───────────────────────────────────────────────
REGISTER_FOLDER  = r"D:\1 ssooo improtant\iotprogect\register_faces"
THRESHOLD_COSINE = 0.45
MIN_FACE_SIZE    = 50
BLUR_THRESHOLD   = 50

# Global system (lazy load)
system = None

class ImageData(BaseModel):
    image: str  # base64 encoded jpeg image

def load_system():
    global system
    if system is None:
        print("Loading buffalo_l model...")
        system = FaceRecognitionSystem()
        auto_register(system)
        print("Face recognition system ready")
    return system

class FaceRecognitionSystem:
    def __init__(self):
        self.app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        self.app.prepare(ctx_id=0, det_size=(416, 416))
        self.quality = FaceQualityChecker()
        self.index = faiss.IndexFlatIP(512)
        self.labels = []

    def add_person(self, name, image_paths):
        embs = []
        for path in image_paths:
            if not os.path.exists(path):
                continue
            img = cv2.imread(path)
            if img is None:
                continue
            faces = self.app.get(img)
            for f in faces:
                if f.embedding is not None:
                    emb = f.embedding / np.linalg.norm(f.embedding)
                    embs.append(emb)

        if not embs:
            return False

        avg_emb = np.mean(embs, axis=0)
        avg_emb /= np.linalg.norm(avg_emb)

        self.labels.append(name)
        self.index.add(np.array([avg_emb], dtype=np.float32))
        return True

    def recognize_frame(self, frame):
        faces = self.app.get(frame)
        results = []

        for face in faces:
            if not self.quality.evaluate(face, frame):
                continue

            if face.embedding is None:
                continue

            query = face.embedding / np.linalg.norm(face.embedding)
            query = np.array([query], dtype=np.float32)

            distances, indices = self.index.search(query, 1)
            sim = distances[0][0]

            name = self.labels[indices[0][0]] if sim >= THRESHOLD_COSINE else "Unknown"
            conf = float(sim)

            results.append({
                "name": name,
                "confidence": conf,
                "bbox": face.bbox.astype(int).tolist() if face.bbox is not None else None
            })

        return results

# Quality Checker (من الكود القديم)
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

# Auto-register from folder
def auto_register(system):
    if not os.path.exists(REGISTER_FOLDER):
        print(f"Register folder not found: {REGISTER_FOLDER}")
        return

    print("\nAuto-registering persons...")
    added = 0

    for person in os.listdir(REGISTER_FOLDER):
        pdir = os.path.join(REGISTER_FOLDER, person)
        if not os.path.isdir(pdir):
            continue

        images = [os.path.join(pdir, f) for f in os.listdir(pdir)
                  if f.lower().endswith(('.png','.jpg','.jpeg'))]

        if images and system.add_person(person, images):
            added += 1

    print(f"→ Registered {added} person(s)")

# ─── API Endpoints ──────────────────────────────────────────

@app.post("/recognize")
async def recognize_face(data: ImageData):
    try:
        img_data = base64.b64decode(data.image)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        system = load_system()
        results = system.recognize_frame(img)

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)