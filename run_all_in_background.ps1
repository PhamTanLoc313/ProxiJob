# Stop any existing dotnet processes first
Stop-Process -Name dotnet -Force -ErrorAction SilentlyContinue

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

# Delete old logs if exist
Remove-Item -Path log_identity.txt, log_job.txt, log_management.txt, err_identity.txt, err_job.txt, err_management.txt -ErrorAction SilentlyContinue

# Launch Identity Service (with --no-build)
Start-Process dotnet -ArgumentList "run --no-build --project src/Identity/ProxiJob.Identity.API/ProxiJob.Identity.API.csproj" -NoNewWindow -RedirectStandardOutput log_identity.txt -RedirectStandardError err_identity.txt

# Launch Job Service (with --no-build)
Start-Process dotnet -ArgumentList "run --no-build --project src/Job/ProxiJob.Job.API/ProxiJob.Job.API.csproj" -NoNewWindow -RedirectStandardOutput log_job.txt -RedirectStandardError err_job.txt

# Launch Management Service (with --no-build)
Start-Process dotnet -ArgumentList "run --no-build --project src/Management/ProxiJob.Management.API/ProxiJob.Management.API.csproj" -NoNewWindow -RedirectStandardOutput log_management.txt -RedirectStandardError err_management.txt

Write-Host "Da khoi chay ca 3 services voi --no-build va redirect log!" -ForegroundColor Green
