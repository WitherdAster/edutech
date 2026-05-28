import cv2
import os
import uuid

UPLOAD_DIR = "uploads"

def augment_image(image_path):
    img = cv2.imread(image_path)

    if img is None:
        return []

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    augmented_paths = []

    h, w = img.shape[:2]

    augmented_images = []

    # flip
    augmented_images.append(cv2.flip(img, 1))

    # rotate +10
    matrix1 = cv2.getRotationMatrix2D((w//2, h//2), 10, 1)
    augmented_images.append(cv2.warpAffine(img, matrix1, (w, h)))

    # rotate -10
    matrix2 = cv2.getRotationMatrix2D((w//2, h//2), -10, 1)
    augmented_images.append(cv2.warpAffine(img, matrix2, (w, h)))

    # brightness +
    augmented_images.append(cv2.convertScaleAbs(img, alpha=1.1, beta=25))

    # brightness -
    augmented_images.append(cv2.convertScaleAbs(img, alpha=0.9, beta=-20))

    # blur
    augmented_images.append(cv2.GaussianBlur(img, (5, 5), 0))

    # contrast high
    augmented_images.append(cv2.convertScaleAbs(img, alpha=1.3, beta=0))

    # contrast low
    augmented_images.append(cv2.convertScaleAbs(img, alpha=0.7, beta=0))

    # resize zoom in
    zoom = cv2.resize(img, None, fx=1.1, fy=1.1)
    augmented_images.append(zoom[:h, :w])

    # sharpen
    kernel = [[0, -1, 0], [-1, 5,-1], [0, -1, 0]]
    import numpy as np
    kernel = np.array(kernel)
    sharpen = cv2.filter2D(img, -1, kernel)
    augmented_images.append(sharpen)

    for aug in augmented_images:
        filename = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}.jpg")
        cv2.imwrite(filename, aug)
        augmented_paths.append(filename)

    return augmented_paths