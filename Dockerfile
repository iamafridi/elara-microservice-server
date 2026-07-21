# Base stage
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.18.3

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Dependencies stage
FROM base AS dependencies

# Copy all package.json files from workspace
COPY apps/*/package.json ./apps/
COPY libs/*/package.json ./libs/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder

# Install build dependencies for native modules (argon2, bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# Copy all package.json files
COPY apps/*/package.json ./apps/
COPY libs/*/package.json ./libs/

# Install ALL dependencies using npm (not pnpm) to avoid build script blocking
# npm will properly build native modules
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build argument for which service to build
ARG SERVICE_NAME

# Build the specific service
RUN pnpm exec nest build ${SERVICE_NAME}

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.18.3

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files
COPY apps/*/package.json ./apps/
COPY libs/*/package.json ./libs/

# Build argument for which service to run
ARG SERVICE_NAME

# Copy pre-built node_modules from builder (includes compiled native modules)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/libs ./libs

# Set environment variable
ENV NODE_ENV=production

# Expose port (will be overridden in docker-compose)
EXPOSE 3000

# Default CMD (will be overridden by docker-compose)
CMD ["node", "dist/apps/api-gateway/main.js"]
