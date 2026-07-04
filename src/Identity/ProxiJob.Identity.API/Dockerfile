FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5231
EXPOSE 5232

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Identity/ProxiJob.Identity.API/ProxiJob.Identity.API.csproj", "src/Identity/ProxiJob.Identity.API/"]
COPY ["src/Identity/ProxiJob.Identity.Infrastructure/ProxiJob.Identity.Infrastructure.csproj", "src/Identity/ProxiJob.Identity.Infrastructure/"]
COPY ["src/Identity/ProxiJob.Identity.Application/ProxiJob.Identity.Application.csproj", "src/Identity/ProxiJob.Identity.Application/"]
COPY ["src/Identity/ProxiJob.Identity.Domain/ProxiJob.Identity.Domain.csproj", "src/Identity/ProxiJob.Identity.Domain/"]
COPY ["common/ProxiJob.Shared.Kernel/ProxiJob.Shared.Kernel.csproj", "common/ProxiJob.Shared.Kernel/"]
COPY ["common/ProxiJob.Shared.Contract/ProxiJob.Shared.Contract.csproj", "common/ProxiJob.Shared.Contract/"]

RUN dotnet restore "src/Identity/ProxiJob.Identity.API/ProxiJob.Identity.API.csproj"
COPY . .
WORKDIR "/src/src/Identity/ProxiJob.Identity.API"
RUN dotnet build "ProxiJob.Identity.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ProxiJob.Identity.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProxiJob.Identity.API.dll"]
