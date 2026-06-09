FROM python:3.12-slim-bookworm AS base
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*
RUN git clone --depth=1 https://github.com/lfnovo/open-notebook.git /app
WORKDIR /app

FROM ghcr.io/astral-sh/uv:latest AS uv

FROM node:20-slim AS frontend
COPY --from=base /app/frontend /app/frontend
WORKDIR /app/frontend
RUN npm ci && npm run build

FROM base AS backend
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN uv sync --frozen --no-dev
ENV TIKTOKEN_CACHE_DIR=/app/tiktoken-cache
RUN mkdir -p /app/tiktoken-cache && .venv/bin/python -c "import tiktoken; tiktoken.get_encoding('o200k_base')"

FROM python:3.12-slim-bookworm AS runtime
RUN apt-get update && apt-get upgrade -y && apt-get install -y ffmpeg supervisor curl && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY --from=backend /app /app
COPY --from=frontend /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend /app/frontend/public /app/frontend/public
COPY --from=frontend /app/frontend/start-server.js /app/frontend/start-server.js
ENV UV_NO_SYNC=1 VIRTUAL_ENV=/app/.venv TIKTOKEN_CACHE_DIR=/app/tiktoken-cache HOSTNAME=0.0.0.0
RUN mkdir -p /app/data /var/log/supervisor
EXPOSE 8502 5055
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
