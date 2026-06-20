# Download Redis for Windows
$url = "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.msi"
$output = "$env:TEMP\Redis-x64-3.0.504.msi"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $client = New-Object System.Net.WebClient
    $client.DownloadFile($url, $output)
    Write-Host "Downloaded to: $output"
    Write-Host "File size: $((Get-Item $output).Length / 1MB) MB"
} catch {
    Write-Host "Error: $_"
    # Try alternative
    $url2 = "https://github.com/tporadowski/redis/releases/download/v6.2.14/Redis-x64-6.2.14.zip"
    $output2 = "$env:TEMP\Redis-x64-6.2.14.zip"
    try {
        $client.DownloadFile($url2, $output2)
        Write-Host "Downloaded to: $output2"
    } catch {
        Write-Host " alternative also failed"
    }
}