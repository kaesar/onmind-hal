FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/node_modules ./node_modules
COPY server.js ./
USER app
EXPOSE 4201
ENV NODE_ENV=production
CMD ["node", "server.js"]
