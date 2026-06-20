# Chronos Second Brain Autostart Setup
# Run as: powershell -ExecutionPolicy Bypass -File setup-autostart.ps1

$taskName = "ChronosSecondBrain"
$scriptPath = "$PSScriptRoot\..\RUN_AUTONOMOUS.bat"

Write-Host "[Chronos] Setting up autostart task..." -ForegroundColor Cyan

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "[Chronos] Task already exists, removing..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create action
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$scriptPath`""

# Create trigger (on logon)
$trigger = New-ScheduledTaskTrigger -AtLogOn

# Create principal (current user, limited)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

# Create settings
$settings = New-ScheduledTaskSettings -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register task
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Chronos Second Brain autonomous agent" | Out-Null

Write-Host "[Chronos] Task created successfully!" -ForegroundColor Green
Write-Host "[Chronos] Task will run on next logon." -ForegroundColor Cyan

# Also setup Ollama autostart if not already running
$ollamaTask = "OllamaAutoStart"
$ollamaCheck = Get-ScheduledTask -TaskName $ollamaTask -ErrorAction SilentlyContinue
if (-not $ollamaCheck) {
    Write-Host "[Chronos] Creating Ollama autostart task..." -ForegroundColor Cyan
    $ollamaAction = New-ScheduledTaskAction -Execute "C:\Users\Local\Programs\Ollama\ollama.exe" -Argument "serve"
    $ollamaTrigger = New-ScheduledTaskTrigger -AtLogOn
    Register-ScheduledTask -TaskName $ollamaTask -Action $ollamaAction -Trigger $ollamaTrigger -Description "Ollama LLM server" | Out-Null
    Write-Host "[Chronos] Ollama autostart task created!" -ForegroundColor Green
}

Write-Host "[Chronos] Autostart setup complete!" -ForegroundColor Green