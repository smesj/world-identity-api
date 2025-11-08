# ===================================
# Development Stage
# ===================================
FROM --platform=linux/amd64 node:20-alpine AS dev

RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN addgroup --system --gid 1001 identity-api
RUN adduser --system --uid 1001 identity-api

COPY --chown=node:node . .

RUN yarn --frozen-lockfile

EXPOSE 3001

USER identity-api

CMD ["yarn", "start:dev"]

# ===================================
# Build Stage
# ===================================
FROM --platform=linux/amd64 node:20-alpine AS build

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --chown=node:node package*.json ./
COPY --chown=node:node yarn.lock* ./

RUN yarn --frozen-lockfile

COPY --chown=node:node . .

# Generate Prisma Client (use dummy DATABASE_URL for build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build application
RUN yarn build

# Prune dev dependencies
RUN yarn --production --frozen-lockfile && yarn cache clean

# ===================================
# Production Stage
# ===================================
FROM --platform=linux/amd64 node:20-alpine AS prod

RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN addgroup --system --gid 1001 identity-api
RUN adduser --system --uid 1001 identity-api

# Copy node_modules from build stage
COPY --from=build --chown=identity-api:identity-api /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=identity-api:identity-api /app/dist ./dist

# Copy Prisma files for migrations
COPY --from=build --chown=identity-api:identity-api /app/prisma ./prisma
COPY --from=build --chown=identity-api:identity-api /app/package*.json ./

EXPOSE 3001

USER identity-api

CMD ["node", "dist/src/main"]
