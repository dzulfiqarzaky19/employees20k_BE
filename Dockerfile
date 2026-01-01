# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci 

COPY . .

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate
RUN npm run build

RUN npm prune --omit=dev

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:18-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --chown=node:node ./scripts/entrypoint.sh ./

RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

RUN chmod +x ./entrypoint.sh

USER node
ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/src/server.js"]