using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MyJobBoard.Api.Services;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Infrastructure.Data;
using MyJobBoard.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database & EF Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=myjobboard.db";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<ApplicationDbContext>());

// 2. ASP.NET Core Identity
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 4;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// 3. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_jwt_key_myjobboard_2024_secure_key_123456789";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MyJobBoard";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MyJobBoardApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 4. Application Services
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddSingleton<IFileStorageService>(new FileStorageService());

builder.Services.Configure<AiSettings>(builder.Configuration.GetSection("AiSettings"));
builder.Services.AddHttpClient<GeminiAiService>();
builder.Services.AddHttpClient<GroqAiService>();
builder.Services.AddScoped<ResilientAiService>();
builder.Services.AddScoped<IAiService, CachedAiService>();
builder.Services.AddHttpClient<IFranceTravailService, FranceTravailService>();
builder.Services.AddHostedService<NotificationWorker>();

// 5. CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 6. Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// 7. Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MyJobBoard API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Ensure Database is created and initialized
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.EnsureCreatedAsync();

    // Migrate missing columns if table already existed
    var sqlCommands = new[]
    {
        "ALTER TABLE \"Opportunities\" ADD COLUMN \"ArchiveReason\" TEXT NULL;",
        "ALTER TABLE \"Opportunities\" ADD COLUMN \"ArchiveFeedback\" TEXT NULL;",
        "ALTER TABLE \"Opportunities\" ADD COLUMN \"ArchivedDate\" TEXT NULL;",
        "ALTER TABLE \"Opportunities\" ADD COLUMN \"LastFollowUpDate\" TEXT NULL;",
        "ALTER TABLE \"Companies\" ADD COLUMN \"Siret\" TEXT NULL;",
        "ALTER TABLE \"Companies\" ADD COLUMN \"Address\" TEXT NULL;",
        "ALTER TABLE \"Companies\" ADD COLUMN \"EmployeeCount\" TEXT NULL;",
        "ALTER TABLE \"Companies\" ADD COLUMN \"Industry\" TEXT NULL;",
        "ALTER TABLE \"Companies\" ADD COLUMN \"Pitch\" TEXT NULL;",
        "ALTER TABLE \"Companies\" ADD COLUMN \"Competitors\" TEXT NULL;",
        "ALTER TABLE \"Companies\" ADD COLUMN \"Culture\" TEXT NULL;",
        "ALTER TABLE \"Companies\" ADD COLUMN \"InterviewTips\" TEXT NULL;",
        @"CREATE TABLE IF NOT EXISTS ""AiUsages"" (
            ""Id"" TEXT NOT NULL CONSTRAINT ""PK_AiUsages"" PRIMARY KEY,
            ""UserId"" TEXT NOT NULL,
            ""Date"" TEXT NOT NULL,
            ""RequestsCount"" INTEGER NOT NULL
        );",
        @"CREATE TABLE IF NOT EXISTS ""UserNotifications"" (
            ""Id"" TEXT NOT NULL CONSTRAINT ""PK_UserNotifications"" PRIMARY KEY,
            ""UserId"" TEXT NOT NULL,
            ""Message"" TEXT NOT NULL,
            ""Type"" TEXT NOT NULL,
            ""LinkUrl"" TEXT NULL,
            ""RelatedEntityId"" TEXT NULL,
            ""IsRead"" INTEGER NOT NULL,
            ""CreatedDate"" TEXT NOT NULL
        );",
        @"CREATE TABLE IF NOT EXISTS ""UserProfiles"" (
            ""Id"" TEXT NOT NULL CONSTRAINT ""PK_UserProfiles"" PRIMARY KEY,
            ""UserId"" TEXT NOT NULL,
            ""FirstName"" TEXT NULL,
            ""LastName"" TEXT NULL,
            ""JobTitle"" TEXT NULL,
            ""ExperienceYears"" REAL NULL,
            ""SalaryExpectationMin"" REAL NULL,
            ""SalaryExpectationMax"" REAL NULL,
            ""RemotePreference"" TEXT NULL,
            ""LinkedInUrl"" TEXT NULL,
            ""PortfolioUrl"" TEXT NULL,
            ""FreeNotes"" TEXT NULL
        );",
        @"CREATE TABLE IF NOT EXISTS ""UserSettings"" (
            ""Id"" TEXT NOT NULL CONSTRAINT ""PK_UserSettings"" PRIMARY KEY,
            ""UserId"" TEXT NOT NULL,
            ""AiApiKey"" TEXT NULL,
            ""FranceTravailClientId"" TEXT NULL,
            ""FranceTravailClientSecret"" TEXT NULL,
            ""Theme"" TEXT NULL,
            ""NotificationsEnabled"" INTEGER NOT NULL
        );"
    };

    foreach (var sql in sqlCommands)
    {
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }
        catch
        {
            // Column already exists, ignore
        }
    }
}

// HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
