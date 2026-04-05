# ═══════════════════════════════════════════════════════════════
# Patry Closet API — Multi-stage Dockerfile
# ═══════════════════════════════════════════════════════════════

# ─── Stage 1: Base runtime image ───
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS base

RUN addgroup -g 1654 appgroup && \
    adduser -u 1654 -G appgroup -D appuser && \
    apk add --no-cache curl

EXPOSE 8080

# ─── Stage 2: Restore dependencies (layer cache) ───
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS restore
WORKDIR /src

COPY PatryCloset.sln .
COPY src/PatryCloset.Domain/PatryCloset.Domain.csproj              src/PatryCloset.Domain/
COPY src/PatryCloset.Application/PatryCloset.Application.csproj    src/PatryCloset.Application/
COPY src/PatryCloset.Infrastructure/PatryCloset.Infrastructure.csproj src/PatryCloset.Infrastructure/
COPY src/PatryCloset.API/PatryCloset.API.csproj                    src/PatryCloset.API/
COPY tests/PatryCloset.UnitTests/PatryCloset.UnitTests.csproj          tests/PatryCloset.UnitTests/
COPY tests/PatryCloset.IntegrationTests/PatryCloset.IntegrationTests.csproj tests/PatryCloset.IntegrationTests/

RUN dotnet restore PatryCloset.sln

# ─── Stage 3: Build ───
FROM restore AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY . .
RUN dotnet build PatryCloset.sln -c $BUILD_CONFIGURATION --no-restore

# ─── Stage 4: Test (skippable) ───
FROM build AS test
ARG SKIP_TESTS=false

RUN if [ "$SKIP_TESTS" != "true" ]; then \
        dotnet test tests/PatryCloset.UnitTests \
            --no-build -c Release \
            --logger "trx;LogFileName=test-results.trx" || true; \
    fi

# ─── Stage 5: Publish ───
FROM build AS publish
ARG BUILD_CONFIGURATION=Release

RUN dotnet publish src/PatryCloset.API/PatryCloset.API.csproj \
    -c $BUILD_CONFIGURATION \
    -o /app/publish \
    --no-build \
    /p:UseAppHost=false

# ─── Stage 6: Runtime (final) ───
FROM base AS runtime

ARG VERSION=1.0.0
LABEL maintainer="Patry Closet Team" \
      version="${VERSION}" \
      description="Patry Closet E-Commerce API"

WORKDIR /app
COPY --from=publish /app/publish .

USER appuser

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_gcServer=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "PatryCloset.API.dll"]
