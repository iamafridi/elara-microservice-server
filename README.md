# Elara Super App — Backend Microservices Mesh

Enterprise-grade NestJS microservices platform powering the **Elara Bangladesh Super App** ecosystem.

The backend is structured as a scalable monorepo comprising a central **API Gateway**, **10 domain-driven microservices**, shared database and event bus libraries, and a containerized infrastructure stack (PostgreSQL, Redis, MinIO, and Typesense).

---

## System Architecture

```
backend/
├── apps/
│   ├── api-gateway/          # Ingress proxy (Port 3000), Swagger aggregator, CORS, rate limiting
│   ├── auth-service/         # User auth (Port 3050), Argon2 password hashing, SMS OTP, sessions
│   ├── ecommerce-service/    # Food & Dokan marketplace (Port 3002), product menus, order checkout
│   ├── logistics-service/    # Fleet dispatch (Port 3003), Dhaka telemetry, rider matching, GPS radar
│   ├── jobtap-service/       # On-demand services (Port 3004), tasker quotes, 30% milestone escrow
│   ├── payment-service/      # MFS engines (Port 3005), bKash, Nagad, COD cash logs, BEFTN settlements
│   ├── notification-service/ # Messaging (Port 3011), SMS gateway, push notifications, customer alerts
│   ├── media-service/        # Asset storage (Port 3007), MinIO/S3 signed uploads, NID KYC dockets
│   ├── search-service/       # Discovery (Port 3008), Typesense full-text and geo-radius indexing
│   ├── website-service/      # Marketing CMS (Port 3009), landing pages, categories, blog engine
│   └── admin-service/        # Operations (Port 3010), GMV analytics, dispute mediation, user controls
├── libs/
│   ├── database/             # PostgreSQL connection pool, TypeORM entities, and schema migrations
│   ├── events/               # Redis pub/sub and Bull queue event publisher abstraction
│   ├── interceptors/         # Centralized request logging, response transforms, and error masking
│   └── common/               # Shared DTOs, guards, decorators, and system constants
├── docs/                     # Microservice specifications, ER diagrams, and sequence flows
├── scripts/                  # Automated migration runners and environment validators
└── test/                     # Jest end-to-end integration test suites
```

---

## Service Inventory & Port Mapping

| Service Name | Port | Description |
| :--- | :--- | :--- |
| **API Gateway** | `3000` | Unified REST ingress (`/v1/*`), OpenAPI / Swagger UI at `/api-docs` |
| **Auth Service** | `3050` | Porichoy NID verification, JWT access/refresh lifecycle, phone verification |
| **E-Commerce Service** | `3002` | Restaurants, groceries, catalog taxonomy, real-time inventory decrement |
| **Logistics Service** | `3003` | Hyperlocal dispatch algorithms, zone clustering, courier turn-by-turn routing |
| **JobTap Service** | `3004` | Vocational service requests, bids, and DNCRP-compliant escrow retention |
| **Payment Service** | `3005` | bKash Checkout URL, Nagad API, Rider COD collections, merchant bank payouts |
| **Notification Service**| `3011` | Automated customer SMS notifications, transaction receipts, push events |
| **Media Service** | `3007` | S3 presigned URLs, merchant menus, courier proof-of-delivery photos |
| **Search Service** | `3008` | Typesense instant search across Dhaka food, services, and Dokan merchants |
| **Website Service** | `3009` | CMS backend for dynamic localized SEO landing pages |
| **Admin Service** | `3010` | Central command audit trails, fleet health monitoring, financial settlement |

---

## Infrastructure Stack (Docker Compose)

The backend utilizes high-performance open-source infrastructure configured in `docker-compose.yml`:

- **PostgreSQL 16**: Primary relational database with ACID guarantees, connection pooling (`max: 20`), and JSONB support.
- **Redis 7 (Alpine)**: Distributed cache, session token blacklist, and high-throughput inter-service event bus.
- **MinIO**: High-performance S3-compatible local object storage for media and NID document attachments.
- **Typesense**: Typo-tolerant, fast in-memory search engine for products and services.

---

## Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
- **Docker & Docker Compose**: Installed and running
- **npm** or **pnpm**: v10.x or higher

### Environment Setup

Copy the example configuration to create your local `.env`:

```bash
cp .env.example .env
```

Key environment configuration variables:

```ini
# Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres_dev_password@localhost:5432/elara_dev
DATABASE_POOL_SIZE=20

# Redis Event Bus
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_dev

# JWT Security
JWT_SECRET=elara_super_secret_jwt_key_dhaka_mesh
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Microservice Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3050
ECOMMERCE_SERVICE_PORT=3002
LOGISTICS_SERVICE_PORT=3003
JOBTAP_SERVICE_PORT=3004
PAYMENT_SERVICE_PORT=3005
NOTIFICATION_SERVICE_PORT=3011
MEDIA_SERVICE_PORT=3007
SEARCH_SERVICE_PORT=3008
WEBSITE_SERVICE_PORT=3009
ADMIN_SERVICE_PORT=3010
```

### Starting the Infrastructure

```bash
# Start all containerized dependencies in background
npm run docker:up

# Verify running containers
docker-compose ps
```

### Initializing Database Schema & Seeds

```bash
# Apply SQL initialization scripts or TypeORM migrations
npm run migration:run

# Populate seed data (merchants, test users, Dhaka delivery zones)
npm run seed
npm run seed:zones
```

### Running the Services

```bash
# Start the central API Gateway in watch mode
npm run start:dev

# Start specific microservices in watch mode
npm run start:auth:dev
npm run start:ecommerce
npm run start:logistics
npm run start:payment
```

Once running:
- **API Gateway**: `http://localhost:3000/v1`
- **Swagger Documentation**: `http://localhost:3000/api-docs`

---

## Security & Privacy Guidelines

1. **Authentication**: All endpoints outside of public marketing and health checks require an `Authorization: Bearer <JWT>` header.
2. **CORS Guarding**: Ingress is restricted to authorized Elara domains and local development ports (`http://localhost:3020`, `https://*.elara.com.bd`).
3. **Data Sanitization**: Internal SQL errors, stack traces, and database connection strings are intercepted by global filters and masked before transmission to clients.
4. **Argon2 Password Hashing**: Passwords undergo salted Argon2 hashing; plain-text credentials and password hashes are never returned in response DTOs.

<!-- v1.0.0-verified -->
