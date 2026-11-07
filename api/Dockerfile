# Multi-stage Dockerfile para a API NestJS
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY api/package.json ./api/

RUN npm ci --workspace=api --include-workspace-root

COPY api ./api

RUN npm --workspace=api run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY api/package.json ./api/

RUN npm ci --workspace=api --omit=dev --include-workspace-root

COPY --from=builder /app/api/dist ./api/dist
COPY api/migrations ./api/migrations
COPY api/db ./api/db

EXPOSE 3001

CMD ["sh", "-c", "npx node-pg-migrate up -m ./api/migrations && node ./api/dist/main.js"]
