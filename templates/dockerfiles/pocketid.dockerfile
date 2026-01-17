FROM node:20-alpine

WORKDIR /tmp

RUN apk add --no-cache git && npm install -g pnpm

RUN git clone https://github.com/pocket-id/pocket-id.git /app

WORKDIR /app

RUN pnpm install && pnpm run build

EXPOSE 80

CMD ["pnpm", "start"]
