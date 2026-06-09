FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
RUN yarn install --immutable

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY . .
COPY --from=deps /app/yarn.lock ./yarn.lock
COPY --from=deps /app/.yarnrc.yml ./.yarnrc.yml
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.medusa/server ./
COPY --from=builder /app/.yarn/releases ./.yarn/releases
COPY --from=builder /app/.yarnrc.yml ./.yarnrc.yml
RUN yarn install
EXPOSE 9000
CMD ["sh", "-c", "./node_modules/.bin/medusa db:migrate && yarn start"]
