FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5021

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Job/ProxiJob.Job.API/ProxiJob.Job.API.csproj", "src/Job/ProxiJob.Job.API/"]
COPY ["src/Job/ProxiJob.Job.Infrastructure/ProxiJob.Job.Infrastructure.csproj", "src/Job/ProxiJob.Job.Infrastructure/"]
COPY ["src/Job/ProxiJob.Job.Application/ProxiJob.Job.Application.csproj", "src/Job/ProxiJob.Job.Application/"]
COPY ["src/Job/ProxiJob.Job.Domain/ProxiJob.Job.Domain.csproj", "src/Job/ProxiJob.Job.Domain/"]
COPY ["common/ProxiJob.Shared.Kernel/ProxiJob.Shared.Kernel.csproj", "common/ProxiJob.Shared.Kernel/"]
COPY ["common/ProxiJob.Shared.Contract/ProxiJob.Shared.Contract.csproj", "common/ProxiJob.Shared.Contract/"]

RUN dotnet restore "src/Job/ProxiJob.Job.API/ProxiJob.Job.API.csproj"
COPY . .
WORKDIR "/src/src/Job/ProxiJob.Job.API"
RUN dotnet build "ProxiJob.Job.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ProxiJob.Job.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProxiJob.Job.API.dll"]
