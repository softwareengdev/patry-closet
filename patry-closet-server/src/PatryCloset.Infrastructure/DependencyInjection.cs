using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Domain.Interfaces;
using PatryCloset.Infrastructure.Caching;
using PatryCloset.Infrastructure.Configuration;
using PatryCloset.Infrastructure.Identity;
using PatryCloset.Infrastructure.Payments;
using PatryCloset.Infrastructure.Persistence;
using PatryCloset.Infrastructure.Persistence.Interceptors;
using PatryCloset.Infrastructure.Persistence.Repositories;
using PatryCloset.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using StackExchange.Redis;

namespace PatryCloset.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment? environment = null)
    {
        // Interceptors
        services.AddScoped<AuditableEntityInterceptor>();
        services.AddScoped<DomainEventDispatcherInterceptor>();

        // Database
        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            var auditInterceptor = sp.GetRequiredService<AuditableEntityInterceptor>();
            var domainEventInterceptor = sp.GetRequiredService<DomainEventDispatcherInterceptor>();

            options.UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    npgsql =>
                    {
                        npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                        npgsql.EnableRetryOnFailure(3);
                    })
                .AddInterceptors(auditInterceptor, domainEventInterceptor);
        });

        // Identity
        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.SignIn.RequireConfirmedEmail = false;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        // Repositories & UoW
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());

        // Auth & Token Services
        services.AddSingleton<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminUserService, AdminUserService>();

        // Services
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        // Caching — use in-memory distributed cache for dev, Redis for prod
        var redisConnection = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrEmpty(redisConnection))
        {
            var multiplexer = ConnectionMultiplexer.Connect(redisConnection);
            services.AddSingleton<IConnectionMultiplexer>(multiplexer);
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnection;
                options.InstanceName = "PatryCloset:";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }
        services.AddScoped<ICacheService, CacheService>();

        // Stripe Payments
        services.Configure<StripeSettings>(configuration.GetSection(StripeSettings.SectionName));
        services.AddScoped<IPaymentService, StripePaymentService>();
        services.AddScoped<StripeWebhookHandler>();

        // Email
        services.AddScoped<IEmailService, Email.SmtpEmailService>();

        // File Storage
        services.Configure<CloudinarySettings>(configuration.GetSection(CloudinarySettings.SectionName));
        if (environment?.IsDevelopment() == true)
        {
            services.AddScoped<IFileStorageService, LocalFileStorageService>();
        }
        else
        {
            services.AddScoped<IFileStorageService, CloudinaryStorageService>();
        }

        // Background Jobs (Hangfire)
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(opts => opts.UseNpgsqlConnection(connectionString)));
        services.AddHangfireServer(options =>
        {
            options.WorkerCount = Environment.ProcessorCount;
            options.Queues = new[] { "critical", "default", "low" };
        });
        services.AddScoped<IBackgroundJobService, BackgroundJobs.HangfireJobService>();

        // Register job workers for DI
        services.AddScoped<BackgroundJobs.Jobs.OrderCleanupJob>();
        services.AddScoped<BackgroundJobs.Jobs.StaleCartCleanupJob>();
        services.AddScoped<BackgroundJobs.Jobs.StockAlertJob>();
        services.AddScoped<BackgroundJobs.Jobs.CacheWarmupJob>();

        return services;
    }
}
