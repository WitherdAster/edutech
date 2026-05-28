from deepface import DeepFace
import numpy as np


def get_embedding(image_path):

    try:

        embedding = DeepFace.represent(
            img_path=image_path,
            model_name="ArcFace",
            detector_backend="retinaface",
            enforce_detection=True
        )

        emb = embedding[0]["embedding"]

        emb = np.array(emb, dtype=np.float32)

        emb = emb / np.linalg.norm(emb)

        return emb.tolist()

    except Exception as e:

        print("ERROR EMBEDDING:", e)

        return None