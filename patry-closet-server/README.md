# PATRY♡CLOSET — Backend API

Production-grade e-commerce API built with ASP.NET Core 9, Clean Architecture, and enterprise patterns.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | ASP.NET Core 9 + Minimal APIs |
| Architecture | Clean Architecture + CQRS (MediatR) |
| Database | PostgreSQL 17 + Entity Framework Core 9 |
| Cache | Redis 7 + DistributedCache |
| Auth | ASP.NET Identity + JWT + Refresh Tokens |
| Payments | Stripe (Payment Intents + Webhooks) |
| Validation | FluentValidation Pipeline |
| Logging | Serilog (Console + File + Structured) |
| Docs | Swagger/OpenAPI 3.1 |
| Testing | xUnit + Moq + FluentAssertions (156 tests) |
| Container | Docker (multi-stage Alpine) + Nginx |

## Quick Start (Development)

```bash
# Prerequisites: .NET 9 SDK, Docker Desktop, PostgreSQL, Redis

# 1. Start infrastructure
docker compose up -d postgres redis mailhog

# 2. Run API
cd src/PatryCloset.API
dotnet run

# API: http://localhost:5200
# Swagger: http://localhost:5200/swagger
# MailHog: http://localhost:8025
```

## Quick Start (Docker)

```bash
# Development (all services)
docker compose up --build

# Production
cp .env.example .env   # Edit with real values
docker compose -f docker-compose.prod.yml up -d
```

## Project Structure

```
patry-closet-server/
├── src/
│   ├── PatryCloset.Domain/          # Entities, enums, value objects, interfaces
│   ├── PatryCloset.Application/     # CQRS handlers, validators, DTOs, behaviors
│   ├── PatryCloset.Infrastructure/  # EF Core, Identity, Stripe, Redis, email
│   └── PatryCloset.API/             # Controllers, middleware, Program.cs
├── tests/
│   ├── PatryCloset.UnitTests/       # 116 unit tests (domain + handlers)
│   └── PatryCloset.IntegrationTests/ # 40 integration tests (WebApplicationFactory)
├── nginx/                           # Nginx reverse proxy config
├── Dockerfile                       # Multi-stage production build
├── docker-compose.yml               # Development environment
└── docker-compose.prod.yml          # Production environment
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register new user |
| POST | `/api/v1/auth/login` | — | Login (returns JWT) |
| POST | `/api/v1/auth/refresh` | — | Refresh access token |
| GET | `/api/v1/auth/me` | ✅ | Current user profile |
| PUT | `/api/v1/auth/profile` | ✅ | Update profile |
| POST | `/api/v1/auth/change-password` | ✅ | Change password |
| GET | `/api/v1/products` | — | List products (filter/sort/page) |
| GET | `/api/v1/products/{slug}` | — | Product detail |
| GET | `/api/v1/products/featured` | — | Featured products |
| GET | `/api/v1/products/{id}/related` | — | Related products |
| GET | `/api/v1/categories` | — | Category tree |
| GET | `/api/v1/cart` | ✅ | Get cart |
| POST | `/api/v1/cart/items` | ✅ | Add to cart |
| PUT | `/api/v1/cart/items/{id}` | ✅ | Update cart item |
| DELETE | `/api/v1/cart/items/{id}` | ✅ | Remove from cart |
| GET | `/api/v1/wishlist` | ✅ | Get wishlist |
| POST | `/api/v1/wishlist` | ✅ | Add to wishlist |
| DELETE | `/api/v1/wishlist/{productId}` | ✅ | Remove from wishlist |
| POST | `/api/v1/orders` | ✅ | Create order |
| GET | `/api/v1/orders` | ✅ | List user orders |
| GET | `/api/v1/orders/{id}` | ✅ | Order detail |
| POST | `/api/v1/payments/create-intent` | ✅ | Stripe Payment Intent |
| POST | `/api/v1/payments/confirm` | ✅ | Confirm payment |
| POST | `/api/v1/webhooks/stripe` | — | Stripe webhooks |
| GET | `/api/v1/addresses` | ✅ | User addresses |
| POST | `/api/v1/addresses` | ✅ | Add address |
| GET | `/health` | — | Health check (JSON) |
| GET | `/health/ready` | — | Readiness probe |
| GET | `/health/live` | — | Liveness probe |

## Testing

```bash
# All tests
dotnet test PatryCloset.sln

# Unit tests only
dotnet test tests/PatryCloset.UnitTests

# Integration tests only
dotnet test tests/PatryCloset.IntegrationTests

# With coverage
dotnet test --collect:"XPlat Code Coverage"
```

## CI/CD

- **CI**: GitHub Actions runs on push/PR → build, test, Docker image → GHCR
- **CD**: Auto-deploys frontend to Cloudflare Pages on main merge
- **Docker image**: `ghcr.io/softwareengdev/patry-closet/api:latest`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ConnectionStrings__DefaultConnection` | ✅ | PostgreSQL connection string |
| `ConnectionStrings__Redis` | ✅ | Redis connection string |
| `Jwt__Secret` | ✅ | JWT signing key (≥32 chars) |
| `Stripe__SecretKey` | ✅ | Stripe secret key |
| `Stripe__WebhookSecret` | ✅ | Stripe webhook signing secret |
| `ASPNETCORE_ENVIRONMENT` | — | Production / Development |

## Security

- JWT authentication with refresh token rotation
- Rate limiting (5 policies: auth, catalog, write, admin, webhook)
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Correlation ID tracking across requests
- CORS restricted to allowed origins
- Non-root Docker container (UID 1654)
- Nginx reverse proxy with additional rate limiting
