$ErrorActionPreference = "Stop"

# Create target directories
$cp2102Dir = "resources/drivers/cp2102"
$ch340Dir = "resources/drivers/ch340"

if (-not (Test-Path $cp2102Dir)) { New-Item -ItemType Directory -Path $cp2102Dir -Force }
if (-not (Test-Path $ch340Dir)) { New-Item -ItemType Directory -Path $ch340Dir -Force }

# Download and extract CP2102
Write-Host "Downloading CP2102 driver from Silicon Labs..."
$cp2102Zip = "resources/drivers/cp2102.zip"
Invoke-WebRequest -Uri "https://www.silabs.com/documents/public/software/CP210x_Universal_Windows_Driver.zip" -OutFile $cp2102Zip -UserAgent "Mozilla/5.0"
Write-Host "Extracting CP2102 driver..."
Expand-Archive -Path $cp2102Zip -DestinationPath $cp2102Dir -Force
Remove-Item $cp2102Zip -Force

# Download and extract CH340
Write-Host "Downloading CH340 driver from FYSETC GitHub repository..."
$ch340Zip = "resources/drivers/ch340.zip"
Invoke-WebRequest -Uri "https://github.com/FYSETC/CH340-Driver/raw/master/CH341SER.ZIP" -OutFile $ch340Zip -UserAgent "Mozilla/5.0"
Write-Host "Extracting CH340 driver..."
Expand-Archive -Path $ch340Zip -DestinationPath $ch340Dir -Force
Remove-Item $ch340Zip -Force

Write-Host "Drivers downloaded and extracted successfully."
