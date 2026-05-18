# syntax=docker/dockerfile:1.7
#
# Aureus TalosFacilitator — production container.
# Built from the monorepo root (so we can resolve workspace deps).
#
# Build:
#   docker build -f facilitator/Dockerfile -t aureus-facilitator .
#
# Run:
#   docker compose up -d
#

FROM node:20-alpine AS base
WORKDIR /app

# Bring in only manifests first so npm install layer can be cached.
COPY package.json package-lock.json ./
COPY packages/x402-arc/package.json ./packages/x402-arc/
COPY facilitator/package.json ./facilitator/

# Install all workspaces (creates @hidayahhtaufik/x402-arc symlink).
RUN npm ci --no-audit --no-fund

# Copy source (separate layer so source edits don't bust npm cache).
COPY packages/x402-arc ./packages/x402-arc
COPY facilitator ./facilitator

# Build the @hidayahhtaufik/x402-arc workspace so dist/ exists for the symlinked dep.
RUN cd packages/x402-arc && npm run build

ENV NODE_ENV=production
ENV PORT=8402
EXPOSE 8402

WORKDIR /app/facilitator
CMD ["npx", "tsx", "src/index.ts"]
