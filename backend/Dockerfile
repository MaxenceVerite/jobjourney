FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copie des fichiers csproj et restauration des dépendances
COPY ["src/MyJobBoard.Api/MyJobBoard.Api.csproj", "src/MyJobBoard.Api/"]
COPY ["src/MyJobBoard.Application/MyJobBoard.Application.csproj", "src/MyJobBoard.Application/"]
COPY ["src/MyJobBoard.Domain/MyJobBoard.Domain.csproj", "src/MyJobBoard.Domain/"]
COPY ["src/MyJobBoard.Infrastructure/MyJobBoard.Infrastructure.csproj", "src/MyJobBoard.Infrastructure/"]
RUN dotnet restore "src/MyJobBoard.Api/MyJobBoard.Api.csproj"

# Copie du reste du code et build
COPY src/ src/
WORKDIR "/src/src/MyJobBoard.Api"
RUN dotnet build "MyJobBoard.Api.csproj" -c Release -o /app/build

# Publication
FROM build AS publish
RUN dotnet publish "MyJobBoard.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Image finale allégée pour l'exécution
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=publish /app/publish .

# Définition du port dynamique pour Render.com
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "MyJobBoard.Api.dll"]
