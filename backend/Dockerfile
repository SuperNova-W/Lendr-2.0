# ── Stage 1: build ───────────────────────────────────────────
# We compile TypeScript → JavaScript here.
# This stage is thrown away after; only the compiled output survives.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci                  # install ALL deps (including devDeps for tsc)

COPY tsconfig.json ./
COPY src ./src
RUN npm run build           # outputs to /app/dist

# ── Stage 2: run ─────────────────────────────────────────────
# Lean production image — no TypeScript compiler, no source files.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev       # production deps only (~70% smaller node_modules)

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run as non-root for security
USER node

CMD ["node", "dist/index.js"]
