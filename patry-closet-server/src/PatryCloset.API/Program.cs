using System.Reflection;
using System.Text;
using Hangfire;
using Serilog;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PatryCloset.Application;
using PatryCloset.Infrastructure;
using PatryCloset.Infrastructure.Identity;
using PatryCloset.Infrastructure.Persistence;
using PatryCloset.Infrastructure.Persistence.Seeding;
using PatryCloset.API.Middleware;
using PatryCloset.API.Services;
using PatryCloset.Domain.Interfaces;
using Asp.Versioning;

var builder = WebApplication.CreateBuilder(args);

// ─── Serilog ───
builder.Host.UseSerilog((context, loggerConfig) =>
{
    loggerConfig
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithEnvironmentName()
        .WriteTo.Console(
            outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {CorrelationId:l} {Message:lj}{NewLine}{Exception}")
        .WriteTo.File(
            path: "logs/patrycloset-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{CorrelationId}] [{UserId}] {Message:lj}{NewLine}{Exception}");
});

// ─── Application & Infrastructure layers ───
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

// ─── Current User Service ───
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// ─── JWT Authentication ───
var jwtSection = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSection["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSection["Issuer"],
        ValidAudience = jwtSection["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero,
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            if (context.Exception is SecurityTokenExpiredException)
            {
                context.Response.Headers.Append("X-Token-Expired", "true");
            }
            return Task.CompletedTask;
        },
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("Admin", "Manager"));
    options.AddPolicy("CustomerOrAbove", policy => policy.RequireRole("Admin", "Manager", "Customer"));
});

// ─── API Versioning ───
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version"));
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// ─── Controllers ───
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// ─── Swagger / OpenAPI ───
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Patry Closet API",
        Version = "v1",
        Description = """
            ## PATRY♡CLOSET — E-Commerce Backend API

            Premium fashion e-commerce REST API powering the Patry Closet online store.
            Built with ASP.NET Core 9, Clean Architecture, CQRS/MediatR, and Stripe payments.

            ### Authentication
            Most endpoints require a Bearer JWT token obtained via `/api/v1/auth/login`.
            Include it in the `Authorization` header as `Bearer <token>`.

            ### Rate Limiting
            - **Auth endpoints**: 10 req/min (brute-force protection)
            - **Catalog endpoints**: 120 req/min (sliding window)
            - **Write operations**: 30 burst, 30/min sustained (token bucket)
            - **Global**: 200 req/min per IP

            ### Error Format
            ```json
            { "success": false, "message": "description", "errors": ["detail1"] }
            ```
            """,
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Patricia García — PATRY♡CLOSET",
            Email = "contact@patrycloset.com",
            Url = new Uri("https://www.instagram.com/patriiiii93/"),
        },
        License = new Microsoft.OpenApi.Models.OpenApiLicense
        {
            Name = "Proprietary",
        },
        TermsOfService = new Uri("https://patrycloset.com/terms"),
    });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT access token (obtained from POST /api/v1/auth/login)",
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer",
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML documentation comments from all assemblies
    var xmlFiles = Directory.GetFiles(AppContext.BaseDirectory, "PatryCloset.*.xml", SearchOption.TopDirectoryOnly);
    foreach (var xmlFile in xmlFiles)
    {
        options.IncludeXmlComments(xmlFile, includeControllerXmlComments: true);
    }

    // Custom operation filters for cleaner docs
    options.EnableAnnotations();
    options.OrderActionsBy(apiDesc => $"{apiDesc.ActionDescriptor.RouteValues["controller"]}_{apiDesc.HttpMethod}");

    // Prevent schema ID conflicts when same class name exists in different namespaces
    options.CustomSchemaIds(type => type.FullName!.Replace('+', '.'));
});

// ─── CORS ───
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:3000", "http://localhost:5173", "https://patrycloset.pages.dev", "https://patrycloset.com"];

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithExposedHeaders("X-Correlation-Id", "X-Token-Expired", "Retry-After", "Server-Timing")
            .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

// ─── Rate Limiting (built-in .NET 7+) ───
builder.Services.AddRateLimitingPolicies();

// ─── Response Caching & Output Caching ───
builder.Services.AddResponseCaching();
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(builder => builder.Expire(TimeSpan.FromSeconds(30)));
    options.AddPolicy("CatalogCache", builder =>
        builder.Expire(TimeSpan.FromMinutes(5)).Tag("catalog"));
    options.AddPolicy("StaticCache", builder =>
        builder.Expire(TimeSpan.FromMinutes(30)).Tag("static"));
});

// ─── HSTS (production only) ───
if (!builder.Environment.IsDevelopment())
{
    builder.Services.AddHsts(options =>
    {
        options.Preload = true;
        options.IncludeSubDomains = true;
        options.MaxAge = TimeSpan.FromDays(365);
    });
}

// ─── Health Checks ───
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgresql",
        tags: ["db", "ready"])
    .AddRedis(
        builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379",
        name: "redis",
        tags: ["cache", "ready"])
    .AddDbContextCheck<ApplicationDbContext>(
        name: "ef-core",
        tags: ["db", "ready"]);

// ─── Forwarded Headers (for Nginx/reverse proxy) ───
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// ─── Database Migration & Seeding ───
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        await context.Database.MigrateAsync();
        Log.Information("✅ Database migrated successfully");

        await ApplicationDbContextSeeder.SeedAsync(context, userManager, roleManager, logger);
        Log.Information("✅ Database seeded successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Error during database migration/seeding");
        // Don't crash the app — allow it to start even if DB isn't ready (e.g., Docker startup order)
    }
}

// ─── Middleware Pipeline (order matters!) ───

// 0. Forwarded headers — must be first for correct IP/scheme detection behind proxy
app.UseForwardedHeaders();

// 1. Correlation ID — so all logs have trace ID
app.UseMiddleware<CorrelationIdMiddleware>();

// 2. Request timing — wraps everything for perf metrics
app.UseMiddleware<RequestTimingMiddleware>();

// 3. Security headers — applied to every response
app.UseMiddleware<SecurityHeadersMiddleware>();

// 4. Serilog request logging — enriched with correlation ID from above
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString());
        if (httpContext.Items.TryGetValue("CorrelationId", out var cid))
            diagnosticContext.Set("CorrelationId", cid);
    };
});

// 5. Exception handling — catches all downstream exceptions
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger available in all environments (production is read-only for API consumers)
app.UseStaticFiles(); // Serve wwwroot assets (custom Swagger CSS)
app.UseSwagger();
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Patry Closet API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "PATRY♡CLOSET — API Documentation";
        c.DefaultModelsExpandDepth(1);
        c.DisplayRequestDuration();
        c.InjectStylesheet("/swagger/patrycloset-swagger.css");
        c.HeadContent =
            "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">" +
            "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>" +
            "<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap\">" +
            "<link rel=\"stylesheet\" type=\"text/css\" href=\"/swagger/patrycloset-swagger.css\">";
    });
}
else
{
    app.UseHsts();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Patry Closet API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "PATRY♡CLOSET — API";
        c.DefaultModelsExpandDepth(0);
        c.SupportedSubmitMethods(); // Disable Try It Out in production
        c.InjectStylesheet("/swagger/patrycloset-swagger.css");
        c.HeadContent =
            "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">" +
            "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>" +
            "<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap\">" +
            "<link rel=\"stylesheet\" type=\"text/css\" href=\"/swagger/patrycloset-swagger.css\">";
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();
app.UseCors("AllowFrontend");

// 6. Rate limiting — after CORS (so preflight isn't throttled)
app.UseRateLimiter();

// 7. Response caching & output caching
app.UseResponseCaching();
app.UseOutputCache();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Hangfire Dashboard (admin only)
app.MapHangfireDashboard("/hangfire", new Hangfire.DashboardOptions
{
    Authorization = new[] { new PatryCloset.API.Middleware.HangfireDashboardAuthFilter() },
    DashboardTitle = "PATRY♡CLOSET — Background Jobs",
    StatsPollingInterval = 5000
});

// Health check endpoints
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            duration = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds,
                description = e.Value.Description,
                exception = e.Value.Exception?.Message
            })
        });
        await context.Response.WriteAsync(result);
    }
});

app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});

// ─── Register Recurring Background Jobs ───
RecurringJob.AddOrUpdate<PatryCloset.Infrastructure.BackgroundJobs.Jobs.OrderCleanupJob>(
    "order-cleanup",
    job => job.CleanupAbandonedOrdersAsync(),
    Cron.Hourly);

RecurringJob.AddOrUpdate<PatryCloset.Infrastructure.BackgroundJobs.Jobs.StaleCartCleanupJob>(
    "stale-cart-cleanup",
    job => job.CleanupStaleCartsAsync(),
    Cron.Daily(3)); // 3 AM UTC

RecurringJob.AddOrUpdate<PatryCloset.Infrastructure.BackgroundJobs.Jobs.StockAlertJob>(
    "stock-alert",
    job => job.CheckLowStockAsync(),
    "0 */4 * * *"); // Every 4 hours

RecurringJob.AddOrUpdate<PatryCloset.Infrastructure.BackgroundJobs.Jobs.CacheWarmupJob>(
    "cache-warmup",
    job => job.WarmupCacheAsync(),
    Cron.Daily(5)); // 5 AM UTC

// ─── Startup log ───
Log.Information("🚀 Patry Closet API starting on {Environment}", app.Environment.EnvironmentName);

app.Run();

// Required for WebApplicationFactory<Program> in integration tests
public partial class Program { }
