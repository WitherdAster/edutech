import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'

import tempfile

from deepface import DeepFace
import numpy as np
from PIL import Image, ImageOps


def get_embedding(image_path, detector_backend="opencv"):

    try:

        # Normalisasi orientasi foto (potrait/landscape) via EXIF
        # supaya wajah selalu tegak saat diproses DeepFace
        img = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                img.save(tmp.name, "JPEG", quality=95)
                tmp_path = tmp.name

            embedding = DeepFace.represent(
                img_path=tmp_path,
                model_name="ArcFace",
                detector_backend=detector_backend,
                enforce_detection=True
            )
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

        emb = embedding[0]["embedding"]

        emb = np.array(emb, dtype=np.float32)

        emb = emb / np.linalg.norm(emb)

        return emb.tolist()

    except Exception as e:

        print("ERROR EMBEDDING:", e)

        return None