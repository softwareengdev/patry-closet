# ─── Build stage ───
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files first (layer cache)
COPY PatryCloset.sln .
COPY src/PatryCloset.Domain/PatryCloset.Domain.csproj src/PatryCloset.Domain/
COPY src/PatryCloset.Application/PatryCloset.Application.csproj src/PatryCloset.Application/
COPY src/PatryCloset.Infrastructure/PatryCloset.Infrastructure.csproj src/PatryCloset.Infrastructure/
COPY src/PatryCloset.API/PatryCloset.API.csproj src/PatryCloset.API/
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet publish src/PatryCloset.API/PatryCloset.API.csproj -c Release -o /app/publish --no-restore

# ─── Runtime stage ───
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Security: run as non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "PatryCloset.API.dll"]
