#!/usr/bin/env bash
set -euo pipefail

echo "===================================================="
echo "  Building SALAH Neon Player Android APK"
echo "===================================================="

npm install
npm install --no-save @capacitor/core @capacitor/cli @capacitor/android
npm run build

if [ ! -d "android" ]; then
  npx cap add android
fi

npx cap sync android

cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon

echo ""
echo "Done! APK output:"
ls -lh app/build/outputs/apk/debug/*.apk
