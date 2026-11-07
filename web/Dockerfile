# Multi-stage Dockerfile para o Frontend Next.js
FROM node:22-alpine AS builder

WORKDIR /app

ENV API_INTERNAL_URL=http://api:3001

COPY package.json package-lock.json ./
COPY web/package.json ./web/

RUN npm ci --workspace=web --include-workspace-root

COPY web ./web

RUN npm --workspace=web run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV API_INTERNAL_URL=http://api:3001

COPY package.json package-lock.json ./
COPY web/package.json ./web/

RUN npm ci --workspace=web --omit=dev --include-workspace-root

COPY --from=builder /app/web/next.config.mjs ./web/next.config.mjs
COPY --from=builder /app/web/.next ./web/.next
COPY --from=builder /app/web/public ./web/public

EXPOSE 3000

CMD ["npm", "--workspace=web", "run", "start"]
