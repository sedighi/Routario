# ── Stage 1: Builder ──────────────────────────────────────────────
FROM python:3.14-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    libgeos-dev \
    libproj-dev \
    proj-bin \
    proj-data \
    && rm -rf /var/lib/apt/lists/*

ENV PROJ_DIR=/usr

COPY requirements.txt .

ARG PIP_INDEX_URL="https://pypi.org/simple"
ARG PIP_EXTRA_INDEX_URL=""

RUN pip install --prefix=/install \
    --default-timeout=120 \
    --retries=10 \
    --no-cache-dir \
    -i ${PIP_INDEX_URL} \
    ${PIP_EXTRA_INDEX_URL:+--extra-index-url $PIP_EXTRA_INDEX_URL} \
    -r requirements.txt


# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM python:3.14-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    espeak \
    ffmpeg \
    gosu \
    libpq5 \
    proj-bin \
    proj-data \
    && rm -rf /var/lib/apt/lists/*

ENV PROJ_DATA=/usr/share/proj

COPY --from=builder /install /usr/local
COPY app/  ./app/
COPY web/  ./web/
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

RUN addgroup --system routario && adduser --system --ingroup routario routario
RUN mkdir -p /app/web/uploads && chown -R routario:routario /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

EXPOSE 8000 5050

ENTRYPOINT ["/entrypoint.sh"]
