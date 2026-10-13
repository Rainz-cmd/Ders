@echo off
title GitHub'a Yukleniyor...
echo ========================================================
echo   ESP32 IoT Lamba Projesi GitHub'a Yukleniyor...
echo ========================================================
cd /d "%~dp0"
git branch -M main
git push -u origin main --force
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo [BASARILI] Kodlar GitHub'a yuklendi!
    echo Vercel otomatik olarak yayina aliyor: https://ders-taupe.vercel.app
    echo ========================================================
) else (
    echo [HATA] Yukleme sirasinda hata olustu.
)
pause
