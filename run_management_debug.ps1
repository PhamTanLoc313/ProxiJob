$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -notmatch "^#" -and $_ -match "=" } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        $name = $name.Trim()
        $value = $value.Trim()
        Set-Item -Path "Env:\$name" -Value $value
    }
}

$env:ConnectionStrings__DefaultConnection = $env:SUPABASE_CONNECTION_STRING
$env:RabbitMQ__Username = $env:RABBITMQ_DEFAULT_USER
$env:RabbitMQ__Password = $env:RABBITMQ_DEFAULT_PASS
$env:RabbitMQ__Host = "localhost"
$env:JwtSettings__SecretKey = $env:JWT_SECRET_KEY

dotnet run --project src/Management/ProxiJob.Management.API/ProxiJob.Management.API.csproj
