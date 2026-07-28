$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -notmatch "^#" -and $_ -match "=" } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        $name = $name.Trim()
        $value = $value.Trim()
        Set-Item -Path "Env:\$name" -Value $value
    }
}

# Map env variables to ASP.NET Core format
$env:ConnectionStrings__DefaultConnection = $env:SUPABASE_CONNECTION_STRING
$env:RabbitMQ__Username = $env:RABBITMQ_DEFAULT_USER
$env:RabbitMQ__Password = $env:RABBITMQ_DEFAULT_PASS
$env:RabbitMQ__Host = "localhost"
$env:JwtSettings__SecretKey = $env:JWT_SECRET_KEY
$env:GoogleAuth__ClientSecret = $env:GOOGLE_CLIENT_SECRET

# Launch Identity Service in separate CMD
Start-Process cmd -ArgumentList "/k title Identity Service && dotnet run --no-build --project src/Identity/ProxiJob.Identity.API/ProxiJob.Identity.API.csproj"

# Launch Job Service in separate CMD
Start-Process cmd -ArgumentList "/k title Job Service && dotnet run --no-build --project src/Job/ProxiJob.Job.API/ProxiJob.Job.API.csproj"

# Launch Management Service in separate CMD
Start-Process cmd -ArgumentList "/k title Management Service && dotnet run --no-build --project src/Management/ProxiJob.Management.API/ProxiJob.Management.API.csproj"

# Launch Client (Vite) in separate CMD
Start-Process cmd -ArgumentList "/k title ProxiJob Client && cd src/ProxiJob_Client && npm run dev"

Write-Host "Da khoi chay ca 3 services va Client Frontend!" -ForegroundColor Green
