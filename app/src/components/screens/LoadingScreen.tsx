// Loading Screen

import { Sparkles, BookOpen, Brain } from 'lucide-react';
import { getLanguage, t } from '@/i18n';

const LOADING_KEYS = [
  'loading.msg0',
  'loading.msg1',
  'loading.msg2',
  'loading.msg3',
  'loading.msg4',
  'loading.msg5',
  'loading.msg6',
  'loading.msg7'
] as const;

export function LoadingScreen() {
  const lang = getLanguage();
  const key = LOADING_KEYS[Math.floor(Math.random() * LOADING_KEYS.length)];
  const message = t(key, lang);

  return (
    <div
      data-testid="chronos-loading-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(102, 252, 241, 0.08), transparent 55%), rgba(11, 12, 16, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div className="relative mb-10">
        <div
          className="w-28 h-28 rounded-full border border-[var(--chronos-primary-hex)]/25"
          style={{ animation: 'spin 10s linear infinite' }}
        />
        <div
          className="absolute inset-3 rounded-full border border-fuchsia-500/25"
          style={{ animation: 'spin 14s linear infinite reverse' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-9 h-9 text-[var(--chronos-primary-hex)] animate-pulse drop-shadow-[0_0_12px_rgba(102,252,241,0.35)]" />
        </div>
      </div>

      <p className="text-center text-lg font-medium text-[var(--chronos-text)] tracking-tight max-w-sm animate-fade-in">
        {message}
      </p>

      <div className="flex gap-2.5 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[var(--chronos-primary-hex)]/80 animate-pulse shadow-[0_0_8px_rgba(102,252,241,0.4)]"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>

      <div className="absolute bottom-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-wider text-[var(--chronos-text-secondary)]">
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-violet-400/90" />
          <span>Chronos engine</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-fuchsia-400/90" />
          <span>{lang === 'ru' ? 'Процедурный текст' : 'Procedural text'}</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
