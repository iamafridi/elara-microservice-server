# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install native build tools for compiling argon2 / bcrypt
RUN apk add --no-cache python3 make g++

# Copy package management files
COPY package*.json ./
COPY nest-cli.json tsconfig*.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy source code and library modules
COPY apps ./apps
COPY libs ./libs
COPY scripts ./scripts

# Build target microservice (defaults to api-gateway)
ARG SERVICE_NAME=api-gateway
ENV SERVICE_NAME=${SERVICE_NAME}

RUN npx nest build ${SERVICE_NAME}

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy runtime dependencies and compiled output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig*.json ./

EXPOSE 3000

CMD ["node", "-r", "tsconfig-paths/register", "dist/apps/api-gateway/apps/api-gateway/src/main.js"]
