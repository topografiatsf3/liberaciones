# Corre las pruebas en Windows (igual que correr.sh). Requisitos: Node.js y Playwright con Chromium (el servidor es pruebas\servidor.js).
# Uso, desde la raíz del repositorio:  powershell -File pruebas\correr.ps1            (todas)
#                                      powershell -File pruebas\correr.ps1 prueba5    (una o varias)
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Pruebas)
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:Path = "C:\Program Files\nodejs;" + $env:Path
if (-not $Pruebas) { $Pruebas = @("prueba") + (2..30 | ForEach-Object { "prueba$_" }) | Where-Object { Test-Path "pruebas\$_.js" } }
$srv = Start-Process node -ArgumentList "pruebas\servidor.js","8765" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 1
$fallas = 0
try {
  foreach ($t in $Pruebas) {
    Write-Output "=== $t"
    $salida = & node "pruebas\$t.js" 2>&1 | Out-String
    $code = $LASTEXITCODE
    $salida -split "`n" | Where-Object { $_ -match "^FALLA|Errores|Error|PAGEERROR" } | ForEach-Object { Write-Output $_.TrimEnd() }
    $ok = ($salida -split "`n" | Where-Object { $_ -match "^ok" }).Count
    Write-Output "$ok revisiones correctas"
    if ($code -ne 0) { $fallas++ }
  }
} finally { Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue }
Write-Output ""
if ($fallas -eq 0) { Write-Output "Todas las pruebas pasaron." } else { Write-Output "$fallas prueba(s) con fallas."; exit 1 }
