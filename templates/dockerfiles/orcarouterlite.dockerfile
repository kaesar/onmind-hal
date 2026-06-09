FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends gcc libffi-dev libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml .
RUN mkdir -p app packages && pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir "."

FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY app/ app/
COPY packages/ packages/
COPY design/ design/
COPY scripts/ scripts/

RUN useradd -m orca && mkdir -p /data && chown -R orca:orca /app /data
USER orca

EXPOSE 8000

ENV PYTHONPATH=/app
CMD ["python", "scripts/start.py"]
