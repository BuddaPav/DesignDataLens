# Download Docker Desktop
$url = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$output = "$env:TEMP\DockerDesktopInstaller.exe"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$client = New-Object System.Net.WebClient
$client.DownloadFile($url, $output)

Write-Host "Downloaded to: $output"
Write-Host "File size: $((Get-Item $output).Length / 1MB) MB"