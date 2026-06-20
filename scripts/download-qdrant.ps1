# Download Qdrant for Windows
$url = "https://github.com/qdrant/qdrant/releases/download/v1.7.4/qdrant-x86_64-pc-windows-msvc.zip"
$output = "$env:TEMP\qdrant-x86_64-pc-windows-msvc.zip"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$client = New-Object System.Net.WebClient
$client.DownloadFile($url, $output)

Write-Host "Downloaded to: $output"
Write-Host "File size: $((Get-Item $output).Length / 1MB) MB"