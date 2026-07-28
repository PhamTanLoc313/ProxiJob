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

dotnet run --project src/Identity/ProxiJob.Identity.API/ProxiJob.Identity.API.csproj
