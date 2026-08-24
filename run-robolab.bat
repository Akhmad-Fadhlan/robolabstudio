@echo off
echo ===================================================
echo   RoboLab Studio - Rebuild and Package Script
echo ===================================================
echo.

echo Step 1: Terminating all background RoboLab and Electron processes...
taskkill /f /im "RoboLab Studio.exe" >nul 2>&1
taskkill /f /im "electron.exe" >nul 2>&1
echo Done.
echo.

echo Step 2: Compiling React frontend assets...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] React compilation failed. Please check the errors above.
    pause
    exit /b %errorlevel%
)
echo Done.
echo.

echo Step 3: Packaging desktop application...
call npm run dist
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Electron packaging failed. Please check the errors above.
    pause
    exit /b %errorlevel%
)
echo Done.
echo.

echo Step 4: Opening build output directory...
start "" "dist-electron"
echo.
echo ===================================================
echo [SUCCESS] Rebuild and packaging complete!
echo Please double-click "RoboLab Studio Setup 0.0.1.exe" 
echo in the opened folder to install the updated version.
echo ===================================================
pause
