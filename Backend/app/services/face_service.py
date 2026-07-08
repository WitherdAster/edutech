import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'

from deepface import DeepFace
import numpy as np


def get_embedding(image_path, detector_backend="opencv"):

    try:

        embedding = DeepFace.represent(
            img_path=image_path,
            model_name="ArcFace",
            detector_backend=detector_backend,
            enforce_detection=True
        )

        emb = embedding[0]["embedding"]

        emb = np.array(emb, dtype=np.float32)

        emb = emb / np.linalg.norm(emb)

        return emb.tolist()

    except Exception as e:

        print("ERROR EMBEDDING:", e)

        return None