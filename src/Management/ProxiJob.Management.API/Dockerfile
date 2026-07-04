FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5057

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Management/ProxiJob.Management.API/ProxiJob.Management.API.csproj", "src/Management/ProxiJob.Management.API/"]
COPY ["src/Management/ProxiJob.Management.Infrastructure/ProxiJob.Management.Infrastructure.csproj", "src/Management/ProxiJob.Management.Infrastructure/"]
COPY ["src/Management/ProxiJob.Management.Application/ProxiJob.Management.Application.csproj", "src/Management/ProxiJob.Management.Application/"]
COPY ["src/Management/ProxiJob.Management.Domain/ProxiJob.Management.Domain.csproj", "src/Management/ProxiJob.Management.Domain/"]
COPY ["common/ProxiJob.Shared.Kernel/ProxiJob.Shared.Kernel.csproj", "common/ProxiJob.Shared.Kernel/"]
COPY ["common/ProxiJob.Shared.Contract/ProxiJob.Shared.Contract.csproj", "common/ProxiJob.Shared.Contract/"]

RUN dotnet restore "src/Management/ProxiJob.Management.API/ProxiJob.Management.API.csproj"
COPY . .
WORKDIR "/src/src/Management/ProxiJob.Management.API"
RUN dotnet build "ProxiJob.Management.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ProxiJob.Management.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProxiJob.Management.API.dll"]
