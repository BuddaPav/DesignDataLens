# Check Docker installation
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    Write-Host "Docker found: $($docker.Source)"
    & docker --version
} else {
    Write-Host "Docker CLI not found in PATH"
}

# Check Docker Desktop process
$process = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "Docker Desktop is running"
} else {
    Write-Host "Docker Desktop is NOT running"
}

# Check docker-compose
$compose = Get-Command docker-compose -ErrorAction SilentlyContinue
if ($compose) {
    Write-Host "docker-compose found"
}

# Check WSL
$wsl = Get-Command wsl -ErrorAction SilentlyContinue
if ($wsl) {
    Write-Host "WSL available"
}