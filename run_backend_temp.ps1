$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -notmatch "^#" -and $_ -match "=" } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        $name = $name.Trim()
        $value = $value.Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Map env variables using GetEnvironmentVariable
$db = [System.Environment]::GetEnvironmentVariable("SUPABASE_CONNECTION_STRING", "Process")
$rmqUser = [System.Environment]::GetEnvironmentVariable("RABBITMQ_DEFAULT_USER", "Process")
$rmqPass = [System.Environment]::GetEnvironmentVariable("RABBITMQ_DEFAULT_PASS", "Process")
$jwtKey = [System.Environment]::GetEnvironmentVariable("JWT_SECRET_KEY", "Process")
$ggSecret = [System.Environment]::GetEnvironmentVariable("GOOGLE_CLIENT_SECRET", "Process")

[System.Environment]::SetEnvironmentVariable("ConnectionStrings__DefaultConnection", $db, "Process")
[System.Environment]::SetEnvironmentVariable("RabbitMQ__Username", $rmqUser, "Process")
[System.Environment]::SetEnvironmentVariable("RabbitMQ__Password", $rmqPass, "Process")
[System.Environment]::SetEnvironmentVariable("RabbitMQ__Host", "localhost", "Process")
[System.Environment]::SetEnvironmentVariable("JwtSettings__SecretKey", $jwtKey, "Process")
[System.Environment]::SetEnvironmentVariable("GoogleAuth__ClientSecret", $ggSecret, "Process")

# Launch Identity Service
Start-Process cmd -ArgumentList "/k title Identity Service && dotnet run --project src/Identity/ProxiJob.Identity.API/ProxiJob.Identity.API.csproj"

# Launch Job Service
Start-Process cmd -ArgumentList "/k title Job Service && dotnet run --project src/Job/ProxiJob.Job.API/ProxiJob.Job.API.csproj"

# Launch Management Service
Start-Process cmd -ArgumentList "/k title Management Service && dotnet run --project src/Management/ProxiJob.Management.API/ProxiJob.Management.API.csproj"

Write-Host "Da khoi chay ca 3 services voi bien moi truong tu .env!" -ForegroundColor Green
