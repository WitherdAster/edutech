import json
import numpy as np

from app.models import FaceData, Student

THRESHOLD = 0.90


def cosine_similarity(a, b):

    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)

    dot = np.dot(a, b)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    similarity = dot / (norm_a * norm_b)

    # WAJIB float biasa python
    return float(similarity)


def recognize_multi_pose(db, embeddings_absen):

    poses = ["depan", "kanan", "kiri"]

    siswa_scores = {}

    for index, emb_absen in enumerate(embeddings_absen):

        current_pose = poses[index]

        pose_faces = db.query(FaceData).filter(
            FaceData.pose == current_pose
        ).all()

        for face in pose_faces:

            try:

                registered_embedding = json.loads(
                    face.embedding
                )

                similarity = cosine_similarity(
                    emb_absen,
                    registered_embedding
                )

                if face.id_siswa not in siswa_scores:
                    siswa_scores[face.id_siswa] = []

                siswa_scores[face.id_siswa].append(
                    float(similarity)
                )

            except Exception as e:
                print("ERROR COMPARE:", e)

    best_id = None
    best_similarity = -1.0

    print("\n===== HASIL SIMILARITY =====")

    for id_siswa, similarities in siswa_scores.items():

        avg_similarity = float(
            sum(similarities) / len(similarities)
        )

        siswa = db.query(Student).filter(
            Student.id_siswa == id_siswa
        ).first()

        nama = siswa.nama_siswa if siswa else f"ID {id_siswa}"

        print(
            f"{nama} => similarity: {avg_similarity}"
        )

        if avg_similarity > best_similarity:
            best_similarity = float(avg_similarity)
            best_id = id_siswa

    print("================================")

    if best_id is not None:

        siswa_final = db.query(Student).filter(
            Student.id_siswa == best_id
        ).first()

        if siswa_final:
            print(
                f"KEPUTUSAN AKHIR: "
                f"{siswa_final.nama_siswa} "
                f"dinyatakan hadir "
                f"dengan similarity {best_similarity}"
            )

    if best_similarity >= THRESHOLD:
        return best_id, float(best_similarity)

    return None, float(best_similarity)