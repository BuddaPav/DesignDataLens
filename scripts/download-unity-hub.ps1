# Download Unity Hub
$url = "https://public-cdn.cloud.unity3d.com/hub/prod/3.9.1/UnityHubSetup.exe"
$output = "$env:TEMP\UnityHubSetup.exe"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$client = New-Object System.Net.WebClient
$client.DownloadFile($url, $output)

Write-Host "Downloaded to: $output"
Write-Host "File size: $((Get-Item $output).Length / 1MB) MB"