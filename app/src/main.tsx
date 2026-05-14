import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/* Локальные шрифты (офлайн-first); см. docs/orchestrate/GRAPHICS_INVENTORY.md */
import '@fontsource/inter/cyrillic-300.css'
import '@fontsource/inter/cyrillic-400.css'
import '@fontsource/inter/cyrillic-500.css'
import '@fontsource/inter/cyrillic-600.css'
import '@fontsource/inter/cyrillic-700.css'
import '@fontsource/inter/cyrillic-400-italic.css'
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-400-italic.css'
import '@fontsource/exo-2/cyrillic-500.css'
import '@fontsource/exo-2/cyrillic-600.css'
import '@fontsource/exo-2/cyrillic-700.css'
import '@fontsource/exo-2/cyrillic-600-italic.css'
import '@fontsource/exo-2/latin-500.css'
import '@fontsource/exo-2/latin-600.css'
import '@fontsource/exo-2/latin-700.css'
import '@fontsource/exo-2/latin-600-italic.css'
import './index.css'
import App from './App.tsx'
import { ChronosAppErrorBoundary } from '@/components/ChronosAppErrorBoundary'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { sanitizeForLog } from '@/lib/sanitizeForLog'

function logUnhandledToDesktop(kind: string, err: unknown): void {
  const raw =
    typeof err === 'object' && err !== null && 'stack' in err && typeof (err as Error).stack === 'string'
      ? (err as Error).stack!
      : String(err);
  console.error(`[Chronos] ${kind}`, err);
  const text = sanitizeForLog(`[${kind}]\n${raw}\n`);
  void window.chronosDesktop?.writeCrashLog?.(text);
}

window.addEventListener('unhandledrejection', (event) => {
  logUnhandledToDesktop('unhandledrejection', event.reason);
});

window.addEventListener('error', (event) => {
  if (event.error) {
    logUnhandledToDesktop('window.error', event.error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ChronosAppErrorBoundary>
        <App />
      </ChronosAppErrorBoundary>
    </LanguageProvider>
  </StrictMode>,
)
