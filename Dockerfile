# ── Stage 1: Builder ──────────────────────────────────────────────
FROM python:3.15-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

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
FROM python:3.15-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    espeak \
    ffmpeg \
    gosu \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

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

ENTRYPOINT ["/entrypoint.sh"]
