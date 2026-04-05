<div align="center">

# ✨ PATRY♡CLOSET

### Premium Fashion E-Commerce Platform

[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F5C542?style=for-the-badge)](LICENSE)

**A full-stack, production-ready fashion e-commerce platform built with ASP.NET Core 9 and React 18.**
**Designed for elegance — inside and out.**

---

</div>

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 🛍️ | **Product Catalog** | Advanced filtering, full-text search, and server-side pagination |
| 🔐 | **Authentication** | JWT + refresh tokens with ASP.NET Identity — social login ready |
| 💳 | **Stripe Payments** | Payment Intents + 3D Secure + webhook event processing |
| 🛒 | **Cart & Wishlist** | Persistent cart and wishlist with real-time server sync |
| 📦 | **Order Management** | Full order lifecycle with status tracking and history |
| 🌐 | **Internationalization** | Multi-language support (ES / EN) with dynamic switching |
| 📱 | **Progressive Web App** | Installable PWA with offline support via Workbox |
| 🔍 | **SEO Optimized** | JSON-LD structured data, Open Graph tags, and dynamic sitemap |
| 📊 | **Analytics** | Google Analytics 4 integration with GDPR-compliant consent |
| 🛡️ | **Security** | Rate limiting, CORS policies, and hardened security headers |
| ⚡ | **Caching** | Redis distributed cache + ASP.NET output caching |
| 🔄 | **Background Jobs** | Hangfire for scheduled and fire-and-forget tasks |
| 📧 | **Transactional Email** | Branded HTML email templates for orders and notifications |
| 🐳 | **Containerized** | Docker Compose for local dev; GitHub Actions CI/CD pipelines |
| 📖 | **API Documentation** | Interactive Swagger UI with OpenAPI 3.1 specification |

---

## 🏗️ Architecture

```
┌─────────────┐         HTTPS          ┌─────────────────────┐              ┌──────────────┐
│             │ ◄─────────────────────► │                     │ ◄──────────► │              │
│  React SPA  │                         │  ASP.NET Core API   │              │  PostgreSQL  │
│             │                         │                     │              │              │
└──────┬──────┘                         └──────────┬──────────┘              └──────┬───────┘
       │                                           │                                │
  ┌────┴─────┐                              ┌──────┴───────┐               ┌────────┴───────┐
  │ Vite/CDN │                              │ Redis Cache  │               │   Hangfire     │
  └────┬─────┘                              └──────┬───────┘               │  (Background)  │
       │                                           │                       └────────────────┘
  ┌────┴─────┐                              ┌──────┴───────┐
  │ Stripe.js│                              │  Stripe API  │
  └──────────┘                              └──────────────┘
```

> **Design Principles:** Clean Architecture · CQRS with MediatR · Vertical Slice organization · Domain-Driven Design

The backend follows **Clean Architecture** with clearly separated layers — Domain, Application, Infrastructure, and API — ensuring testability, maintainability, and independence from external frameworks. **CQRS** via **MediatR** keeps read and write paths cleanly separated, while **FluentValidation** enforces business rules at the application boundary.

---

## 🧰 Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 18 + Vite 5 + Tailwind CSS 3.4 |
| **Backend** | ASP.NET Core 9 + MediatR + FluentValidation |
| **Database** | PostgreSQL 17 + Entity Framework Core 9 |
| **Cache** | Redis 7 (StackExchange.Redis) |
| **Payments** | Stripe (Payment Intents + Webhooks) |
| **Auth** | ASP.NET Identity + JWT + Refresh Tokens |
| **Background** | Hangfire |
| **Email** | SMTP + Branded HTML Templates |
| **Logging** | Serilog (Console + File sinks) |
| **API Docs** | Swagger / OpenAPI 3.1 |
| **CI/CD** | GitHub Actions + Docker + Cloudflare Pages |
| **PWA** | Workbox + vite-plugin-pwa |

---

## 📁 Project Structure

```
patry-closet/
├── patry-closet-web/                  # React SPA frontend
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   ├── context/                   # React contexts (Auth, Cart, Wishlist)
│   │   ├── hooks/                     # React Query hooks
│   │   ├── lib/                       # API services (productsApi, authService, …)
│   │   ├── data/                      # Mock data (offline fallback)
│   │   ├── pages/                     # Route pages
│   │   └── i18n/                      # Translations (es.json, en.json)
│   └── public/                        # Static assets, manifest, robots.txt
│
├── patry-closet-server/               # ASP.NET Core backend
│   ├── src/
│   │   ├── PatryCloset.API/           # REST API, controllers, middleware
│   │   ├── PatryCloset.Application/   # CQRS commands/queries, DTOs, validators
│   │   ├── PatryCloset.Domain/        # Entities, enums, domain contracts
│   │   └── PatryCloset.Infrastructure/# EF Core, Identity, Stripe, email, caching
│   ├── tests/                         # Unit + Integration tests
│   └── docker-compose.yml             # PostgreSQL + Redis + MailHog
│
├── deploy-local.ps1                   # Interactive local deployment script
├── logs/                              # Application log files
└── .github/workflows/                 # CI/CD pipelines
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|:------------|:--------|
| .NET SDK | 9.0+ |
| Node.js | 20+ |
| PostgreSQL | 17 (or use Docker) |
| Redis | 7+ *(optional, for caching)* |

### Quick Start — Docker (Backend + Database)

```bash
# 1. Start infrastructure (PostgreSQL, Redis, MailHog)
cd patry-closet-server
docker compose up -d

# 2. Apply database migrations
dotnet ef database update \
  -p src/PatryCloset.Infrastructure \
  -s src/PatryCloset.API

# 3. Run the API
dotnet run --project src/PatryCloset.API
```

### Quick Start — Frontend

```bash
cd patry-closet-web
npm install --legacy-peer-deps
npm run dev
```

The app will be available at **http://localhost:5173** and the API at **http://localhost:5200**.

### Quick Start — All-in-One Script

```powershell
.\deploy-local.ps1

# Default credentials: Admin / Admin
# Follow the interactive menu to start all services
```

---

## 🔧 Environment Variables

### Backend (`appsettings.json` / Environment)

| Variable | Description | Default |
|:---------|:------------|:--------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=localhost;Port=5432;Database=patrycloset;...` |
| `Jwt__SecretKey` | JWT signing key (min 32 chars) | *(required)* |
| `Jwt__Issuer` | JWT token issuer | `PatryCloset.API` |
| `Jwt__Audience` | JWT token audience | `PatryCloset.Client` |
| `Stripe__SecretKey` | Stripe secret key | *(test key in dev)* |
| `Stripe__WebhookSecret` | Stripe webhook signing secret | *(required for webhooks)* |
| `Email__SmtpHost` | SMTP server host | `localhost` |
| `Email__SmtpPort` | SMTP server port | `1025` |
| `Redis__ConnectionString` | Redis connection string | `localhost:6379` |

### Frontend (`.env` / `.env.local`)

| Variable | Description | Default |
|:---------|:------------|:--------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5200/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | *(test key in dev)* |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 ID | — |

> ⚠️ **Never commit real secrets.** Use `appsettings.Development.json` or environment variables for local development.

---

## 📖 API Documentation

### Interactive Docs

| Resource | URL |
|:---------|:----|
| **Swagger UI** | [`http://localhost:5200/swagger`](http://localhost:5200/swagger) |
| **Health Check** | [`/health`](http://localhost:5200/health) |
| **Readiness Probe** | [`/health/ready`](http://localhost:5200/health/ready) |
| **Liveness Probe** | [`/health/live`](http://localhost:5200/health/live) |
| **Hangfire Dashboard** | [`/hangfire`](http://localhost:5200/hangfire) *(admin only)* |

### Key Endpoints

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Authenticate and receive JWT |
| `GET` | `/api/v1/products` | List products (filtered, paginated) |
| `GET` | `/api/v1/products/{slug}` | Get product by slug |
| `GET` | `/api/v1/cart` | Retrieve current cart |
| `POST` | `/api/v1/cart` | Add item to cart |
| `GET` | `/api/v1/wishlist` | Retrieve wishlist |
| `POST` | `/api/v1/wishlist` | Add item to wishlist |
| `POST` | `/api/v1/orders` | Place a new order |
| `POST` | `/api/v1/payments/checkout` | Create Stripe checkout session |

---

## 🧪 Testing

```bash
# Run backend tests
cd patry-closet-server
dotnet test

# Frontend build verification
cd patry-closet-web
npm run build
```

---

## 🌍 Deployment

| Component | Platform | Notes |
|:----------|:---------|:------|
| **Frontend** | Cloudflare Pages | Auto-deploy via GitHub Actions CD pipeline |
| **Backend** | Docker Container | Deploy to Azure App Service, Railway, Fly.io, or any container host |
| **Database** | Managed PostgreSQL | Azure Database, Neon, Supabase, or self-hosted |
| **Cache** | Managed Redis | Azure Cache for Redis, Upstash, or self-hosted |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**PATRY♡CLOSET** — Where code meets couture.

Made with ♡ in Spain

</div>
