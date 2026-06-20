# Find Docker CLI
$paths = @(
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
    "$env:PROGRAMFILES\Docker\Docker\resources\bin\docker.exe",
    "C:\Program Files\Docker\cli-plugins\docker-compose.exe"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Write-Host "Found: $p"
    }
}

# Check PATH
Write-Host "`nPATH entries with Docker:"
$env:PATH -split ';' | Where-Object { $_ -like '*docker*' }

# Try docker via wsl
Write-Host "`nTrying via wsl..."
& wsl docker --version 2>&1