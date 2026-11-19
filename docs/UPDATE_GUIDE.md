# دليل تحديث البرنامج وترحيل قاعدة البيانات المحلية — SALAH Neon Player

## 1. آلية التحديث الآمنة للبيانات المحلية
تعتمد قاعدة البيانات المحلية (`salah_neon_player_db` في `IndexedDB`) على رقم إصدار صريح (`DB_VERSION`) في الملف `src/core/database.ts`.
عند إصدار نسخة جديدة تتطلب تعديل بنية المخازن (Object Stores):
1. يتم رفع قيمة `DB_VERSION` تدريجياً (مثلاً من `1` إلى `2`).
2. داخل دالة `request.onupgradeneeded` يتم التحقق من وجود المخازن السابقة قبل الإنشاء (`!db.objectStoreNames.contains(...)`) مع ترحيل الحقول الجديدة دون حذف الأغاني أو قوائم التشغيل أو المفضلة أو سجل الاستماع.
3. يتم الاحتفاظ بجميع كائنات الصوت المستوردة (`audioBlobs`) وقوائم التشغيل (`playlists`) كما هي.

## 2. تحديث واجهة PWA / الويب
- يعتمد التطبيق على `registerType: 'autoUpdate'` في `vite.config.ts`.
- بمجرد نشر بناء جديد (`npm run build`)، يقوم Service Worker بتحديث الملفات المخزنة مؤقتاً تلقائياً دون التأثير على قاعدة بيانات `IndexedDB`.

## 3. تحديث نسخة Android (APK)
1. رفع `versionCode` و `versionName` في `android/app/build.gradle`.
2. تنفيذ:
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew assembleRelease
   ```
3. تثبيت ملف الـ APK الجديد فوق النسخة الحالية مع الحفاظ على بيانات المستخدم.

## 4. تحديث نسخة Windows (EXE)
1. تحديث رقم الإصدار `"version"` في `package.json`.
2. تنفيذ:
   ```bash
   npm run build
   npx electron-builder --config electron/electron-builder.yml --win
   ```
3. تشغيل المثبت الجديد لتحديث ملفات البرنامج مع بقاء مجلد بيانات المستخدم (`%APPDATA%/SALAH Neon Player`) سليماً.
