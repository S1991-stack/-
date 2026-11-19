@echo off
echo ====================================================
echo   Building SALAH Neon Player Windows Setup EXE (Win7+)
echo ====================================================
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm install
call npm run build:electron
call npm install --no-save -D electron@22.3.27 electron-builder@24.13.3
call npx electron-builder --config electron/electron-builder.yml --win
echo.
echo Done! Check the "release" folder for SALAH-Neon-Player-Setup-1.0.0-x64.exe / ia32.exe
pause
