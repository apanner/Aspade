# Backend Dockerfile for A-Spade Game - Optimized for Fly.io
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --only=production

# Production image, copy all the files and run node
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for volume mount and set proper permissions
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"] 