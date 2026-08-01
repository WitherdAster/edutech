FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libxcb1 libxcb-util1 libxcb-shm0 libxcb-render0 libxcb-randr0 \
    libxcb-xfixes0 libxcb-shape0 libxcb-xinerama0 libxcb-xkb1 libxcb-xtest0 \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    python - <<'PY'
import os
import cv2
import urllib.request

data_dir = os.path.join(os.path.dirname(cv2.__file__), "data")
base = "https://raw.githubusercontent.com/opencv/opencv/4.x/data/haarcascades/"
for name in ["haarcascade_frontalface_default.xml", "haarcascade_eye.xml"]:
    target = os.path.join(data_dir, name)
    if not os.path.isfile(target):
        os.makedirs(data_dir, exist_ok=True)
        urllib.request.urlretrieve(base + name, target)
        print("Downloaded", name, "->", target)
    else:
        print("Already exists:", target)
PY

COPY . .

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
