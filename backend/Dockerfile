# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Compile the seed script to dist/prisma/seed.js so it can run without tsx in prod.
RUN npx tsc prisma/seed.ts \
      --outDir dist/prisma \
      --module commonjs --target ES2022 --moduleResolution node \
      --esModuleInterop --skipLibCheck --resolveJsonModule

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000
# Runs migrations, seeds (idempotent), then starts the server.
CMD ["./docker-entrypoint.sh"]
