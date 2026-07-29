FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libxcb1 libxcb-util1 libxcb-shm0 libxcb-render0 libxcb-randr0 \
    libxcb-xfixes0 libxcb-shape0 libxcb-xinerama0 libxcb-xkb1 libxcb-xtest0 \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
