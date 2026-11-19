import React from 'react';
import { CheckCircle2, Cpu, Download, HardDrive, Music2, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const AboutPanel: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <div className="h-full overflow-y-auto neon-scroll space-y-5 pr-1">
      <div className="rounded-3xl bg-gradient-to-br from-cyan-500/15 via-blue-600/15 to-purple-600/20 border border-cyan-400/35 p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-400/70 shadow-[0_0_24px_rgba(0,229,255,0.45)] shrink-0">
          <img src="/icon.svg" alt="SALAH Neon Player" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-1.5 text-center sm:text-start">
          <h2 className="text-xl font-extrabold text-white">SALAH Neon Player</h2>
          <p className="text-sm font-semibold text-cyan-300">مشغل الصوت المتطور · الإصدار 1.0.0</p>
          <p className="text-xs text-white/75 leading-relaxed max-w-xl">
            مشغل صوت احترافي متعدد المنصات يعمل بالكامل دون اتصال بالإنترنت، مع محرك Web Audio DSP،
            معادل صوتي بعشرة نطاقات، وتحليل فوري للترددات الصوتية.
          </p>
        </div>
      </div>

      {isInstallable && !isInstalled && (
        <div className="rounded-2xl bg-cyan-500/15 border border-cyan-400/40 p-4 flex items-center justify-between gap-4">
          <div className="text-xs text-cyan-100">
            يمكنك تثبيت البرنامج مباشرة على جهازك للعمل كتطبيق مستقل دون متصفح.
          </div>
          <button
            type="button"
            onClick={() => void install()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>تثبيت الآن</span>
          </button>
        </div>
      )}

      {isIOS && !isInstalled && (
        <div className="rounded-2xl bg-purple-500/15 border border-purple-400/35 p-4 text-xs text-purple-100">
          لتثبيت التطبيق على iOS: اضغط على زر المشاركة في Safari ثم اختر "إضافة إلى الشاشة الرئيسية".
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
            <Music2 className="w-4 h-4" />
            <span>الصيغ الصوتية المدعومة</span>
          </div>
          <p className="text-xs text-white/75">
            MP3 · WAV · FLAC · AAC · M4A · OGG · OPUS مع قراءة وسوم ID3v1 / ID3v2 / FLAC وصور الألبوم المدمجة.
          </p>
        </div>

        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
            <ShieldCheck className="w-4 h-4" />
            <span>العمل دون إنترنت وخصوصية تامة</span>
          </div>
          <p className="text-xs text-white/75">
            لا يعتمد على أي خوادم خارجية أو خدمات بث سحابية. جميع الملفات وقوائم التشغيل تُخزن محلياً على جهازك.
          </p>
        </div>

        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
            <Cpu className="w-4 h-4" />
            <span>توافق Android و Windows 7+</span>
          </div>
          <p className="text-xs text-white/75">
            بنية مشتركة عبر Capacitor لحزمة Android APK، و Electron 22 LTS (آخر فرع يدعم Windows 7/8/8.1 رسمياً) و Electron الحديث لنظام Windows 10/11.
          </p>
        </div>

        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-pink-300">
            <HardDrive className="w-4 h-4" />
            <span>أداء واستقرار عالي</span>
          </div>
          <ul className="text-xs text-white/75 space-y-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>فحص مكتبة غير متزامن دون تجميد الواجهة</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>تجاوز الملفات التالفة تلقائياً دون انهيار</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
