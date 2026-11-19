# دليل التثبيت والتشغيل والبناء — SALAH Neon Player (مشغل الصوت المتطور)

## 1. نظرة عامة على البنية متعددة المنصات
يعتمد **SALAH Neon Player** على نواة برمجية موحدة (`React + TypeScript + Web Audio API + IndexedDB`) تضمن مشاركة:
- محرك تشغيل الصوت والمعادل الصوتي (10 نطاقات + Bass + Treble + Balance).
- محلل الترددات البصرية (`AnalyserNode FFT`).
- إدارة الملفات والمجلدات وقراءة وسوم `ID3v1 / ID3v2 / FLAC`.
- قاعدة البيانات المحلية (`IndexedDB`) لقوائم التشغيل والمفضلة وسجل الاستماع والإعدادات.
- العمل الكامل **دون إنترنت** عبر Service Worker (`vite-plugin-pwa`).

---

## 2. التشغيل المحلي وتطبيق الويب المستقل (PWA)
```bash
npm install
npm run build
npm run preview
```
- للتطوير: `npm run dev` (يعمل على المنفذ `3000`).
- يدعم التثبيت المباشر كتطبيق مستقل (PWA) على كل من **Android Chrome** و **Windows Edge / Chrome**.

---

## 3. بناء نسخة Android بصيغة APK (عبر Capacitor)
> **ملاحظة:** يتطلب بناء ملف `.apk` الفعلي وجود **Android Studio / Android SDK** و **Java JDK 17+** على جهاز البناء.

1. تثبيت حزم Capacitor وبناء الواجهة:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npm run build
   npx cap add android
   npx cap sync android
   ```
2. فتح المشروع في Android Studio أو البناء عبر Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   سيتم توليد ملف الـ APK في:
   `android/app/build/outputs/apk/release/app-release.apk`

---

## 4. بناء نسخة Windows بصيغة EXE (وحدود التوافق مع Windows 7)
> **تنبيه تقني مهم بخصوص Windows 7:**
> أسقطت إصدارات Electron الحديثة (الإصدار 23 وما بعده، المعتمدة على Chromium 109+) و Microsoft WebView2 Evergreen الدعم الرسمي لنظام **Windows 7 / 8 / 8.1**.
>
> **الحل الهندسي المعتمد:**
> - لنظام **Windows 7 / Windows 8 / Windows 8.1** (معمارية x64 أو x86 32-bit): يجب استخدام فرع **`electron@22.3.27`** (آخر فرع LTS يدعم Windows 7 رسمياً).
> - لنظام **Windows 10 / Windows 11**: يمكن استخدام أحدث إصدار من Electron (`electron@latest`).

### خطوات إنشاء ملف `.exe`:
1. بناء حزمة الإنتاج:
   ```bash
   npm run build
   ```
2. تثبيت Electron و `electron-builder` على نظام Windows (أو بيئة بناء تدعم NSIS):
   - **لبناء نسخة متوافقة مع Windows 7 وما بعده:**
     ```bash
     npm install -D electron@22.3.27 electron-builder
     npx electron-builder --config electron/electron-builder.yml --win
     ```
   - سيتم إنشاء:
     - مثبت Windows: `release/SALAH Neon Player Setup 1.0.0.exe`
     - نسخة محمولة: `release/SALAH Neon Player 1.0.0.exe`

---

## 5. الصيغ الصوتية المدعومة
`MP3`, `WAV`, `FLAC`, `AAC`, `M4A`, `OGG`, `OPUS`, `WEBM`
(مع استخراج عنوان الأغنية والفنان والألبوم وصورة الألبوم المدمجة تلقائياً وتجاوز أي ملف تالف بأمان).
