@echo off
echo ====================================================
echo   Building SALAH Neon Player Windows EXE (Win7+ LTS)
echo ====================================================
call npm install
call npm run build
call npm install -D electron@22.3.27 electron-builder
call npx electron-builder --config electron/electron-builder.yml --win
echo.
echo Done! Check the "release" folder for the .exe installer and portable executable.
pause
