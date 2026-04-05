# Contributing to PATRY♡CLOSET

## Welcome

Thank you for considering contributing to **PATRY♡CLOSET**! We appreciate your interest in helping improve this project. Whether you're fixing a bug, adding a feature, or improving documentation, every contribution matters.

This guide will help you get started and ensure a smooth collaboration experience.

---

## Development Setup

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) with npm
- [PostgreSQL 17](https://www.postgresql.org/) (or Docker)
- [Git](https://git-scm.com/)

### First Time Setup

```bash
# Clone the repository
git clone https://github.com/softwareengdev/patry-closet.git
cd patry-closet

# Backend setup
cd patry-closet-server
docker compose up -d postgres redis  # Start dependencies
dotnet restore
dotnet ef database update -p src/PatryCloset.Infrastructure -s src/PatryCloset.API
dotnet run --project src/PatryCloset.API

# Frontend setup (in another terminal)
cd patry-closet-web
npm install --legacy-peer-deps
npm run dev
```

---

## Project Architecture

PATRY♡CLOSET follows **Clean Architecture** combined with **CQRS** (via MediatR):

- **Backend:** `Domain` → `Application` → `Infrastructure` → `API`
- **Frontend:** React SPA with React Query for server state management
- **API Integration:** All frontend API calls have mock fallbacks, enabling independent frontend development

---

## Code Style & Conventions

### Backend (C#)

- Follow [Microsoft C# coding conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- Use nullable reference types
- All public API responses wrapped in `ApiResponse<T>`
- Use MediatR commands/queries for business logic
- FluentValidation for input validation
- Serilog for structured logging

### Frontend (JavaScript/React)

- Functional components with hooks
- React Query for server state, Context for client state
- Tailwind CSS for styling (warm color palette)
- i18next for translations (ES/EN)
- Framer Motion for animations
- Use the hybrid API pattern: real backend → mock fallback

---

## Branch Strategy

| Branch Pattern         | Purpose              |
| ---------------------- | -------------------- |
| `main`                 | Production-ready code |
| `feature/description`  | New features         |
| `fix/description`      | Bug fixes            |

All pull requests should target `main`.

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add product filtering by color
fix: correct cart quantity update
docs: update API documentation
refactor: extract product normalizer
test: add order creation tests
```

Always include the co-author trailer when working with Copilot:

```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## Testing

- **Backend:** `dotnet test` (xUnit + Moq, 157+ tests)
- **Frontend:** `npm run build` (build verification)

> **Important:** Always run tests before submitting a pull request.

---

## Pull Request Process

1. **Create** a feature branch from `main`
2. **Implement** your changes following the conventions above
3. **Run tests** locally to verify nothing is broken
4. **Submit** a pull request with a clear description of your changes
5. **Wait** for CI checks to pass
6. **Request** a review from a maintainer

Please keep pull requests focused — one feature or fix per PR makes the review process faster and smoother.

---

## Reporting Issues

Use [GitHub Issues](https://github.com/softwareengdev/patry-closet/issues) to report bugs or suggest improvements. When filing an issue, please include:

- A **clear description** of the problem or suggestion
- **Steps to reproduce** (for bugs)
- **Expected vs. actual behavior**
- **Screenshots** if applicable
- Your environment details (OS, browser, Node/SDK versions)

---

## Code of Conduct

We are committed to fostering a welcoming and inclusive community. All contributors are expected to:

- **Be respectful** — Treat everyone with kindness and empathy
- **Be inclusive** — Welcome people of all backgrounds and experience levels
- **Be constructive** — Offer helpful feedback and accept it graciously

We will not tolerate harassment, discrimination, or disrespectful behavior of any kind.

---

Thank you for helping make PATRY♡CLOSET better! 💖
