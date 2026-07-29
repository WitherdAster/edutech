import json
import numpy as np

from app.models import FaceData, Student

THRESHOLD = 0.60


def cosine_similarity(a, b):

    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)

    dot = np.dot(a, b)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    similarity = dot / (
        norm_a * norm_b
    )
    return float(similarity)


def recognize_face(
    db,
    embedding_absen,
    pose,
    id_kelas=None
):

    query = db.query(FaceData).filter(
        FaceData.pose == pose
    )

    if id_kelas is not None:
        query = query.join(Student).filter(
            Student.id_kelas == id_kelas
        )

    face_data = query.all()

    best_id = None
    best_similarity = -1.0

    print("\n===== HASIL SIMILARITY =====")

    for face in face_data:

        try:

            registered_embedding = json.loads(
                face.embedding
            )

            similarity = cosine_similarity(
                embedding_absen,
                registered_embedding
            )

            siswa = db.query(Student).filter(
                Student.id_siswa == face.id_siswa
            ).first()

            nama = (
                siswa.nama_siswa
                if siswa
                else f"ID {face.id_siswa}"
            )

            print(
                f"{nama} => "
                f"{similarity}"
            )

            if similarity > best_similarity:

                best_similarity = similarity
                best_id = face.id_siswa

        except Exception as e:

            print("ERROR:", e)

    print("================================")

    if best_similarity >= THRESHOLD:

        return best_id, best_similarity

    return None, best_similarity
