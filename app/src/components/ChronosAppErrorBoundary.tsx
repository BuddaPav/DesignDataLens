import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { getLanguage, t } from '@/i18n';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Граница для необработанных ошибок React у корня приложения (десктоп и веб).
 * Лог на диск в Electron через preload (`writeCrashLog`).
 */
export class ChronosAppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ChronosAppErrorBoundary]', error, info.componentStack);
    const line = `[root]\n${error?.stack ?? error.message}\n${info.componentStack ?? ''}\n`;
    void window.chronosDesktop?.writeCrashLog?.(line);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const lang = getLanguage();
    const err = this.state.error;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#05070d] px-6 py-12 text-center text-slate-100">
        <div className="max-w-lg space-y-4">
          <h1 className="font-display text-xl font-semibold tracking-tight text-red-300">
            {t('app.crash_title', lang)}
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">{t('app.crash_desc', lang)}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" onClick={() => window.location.reload()} className="bg-violet-600 hover:bg-violet-500">
              {t('app.crash_reload', lang)}
            </Button>
          </div>
          {import.meta.env.DEV && err?.message ? (
            <details className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3 text-left text-xs text-slate-500">
              <summary className="cursor-pointer text-slate-400">{t('app.crash_details', lang)}</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]">
                {err.message}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
    );
  }
}
