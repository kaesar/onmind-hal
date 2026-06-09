FROM node:20-alpine AS frontend-builder

WORKDIR /tmp
RUN apk add --no-cache git && npm install -g pnpm
RUN git clone https://github.com/pocket-id/pocket-id.git /app
WORKDIR /app
RUN pnpm install && pnpm run build

FROM golang:latest AS backend-builder
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
COPY --from=frontend-builder /app /app
WORKDIR /app/backend
RUN CGO_ENABLED=0 go build -o /pocket-id ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
COPY --from=backend-builder /pocket-id /usr/local/bin/pocket-id
COPY --from=frontend-builder /app/frontend/.svelte-kit /app/frontend/.svelte-kit
COPY --from=frontend-builder /app/frontend/static /app/frontend/static
COPY --from=frontend-builder /app/backend/resources /app/backend/resources
WORKDIR /app/backend
EXPOSE 80
CMD ["pocket-id"]
