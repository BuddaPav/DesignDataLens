import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RemoteUpdateManifest } from '@/hooks/useUpdateCheck';
import { useLanguage } from '@/i18n/LanguageProvider';
import { t } from '@/i18n';

interface UpdateBannerProps {
  currentVersion: string;
  remote: RemoteUpdateManifest;
  onDismiss: () => void;
}

export function UpdateBanner({ currentVersion, remote, onDismiss }: UpdateBannerProps) {
  const lang = useLanguage();

  const resolveSafeDownloadUrl = (raw: string): string | null => {
    try {
      const parsed = new URL(raw, window.location.origin);
      if (parsed.protocol === 'https:') return parsed.toString();
      if (parsed.protocol === 'http:' && parsed.hostname === 'localhost') return parsed.toString();
      return null;
    } catch {
      return null;
    }
  };

  const openUpdate = () => {
    const u = remote.downloadUrl?.trim();
    if (u) {
      const safeUrl = resolveSafeDownloadUrl(u);
      if (!safeUrl) return;
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.reload();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] min-h-10 border-t border-[var(--chronos-primary-hex)]/35 bg-[var(--chronos-primary-hex)] text-[var(--chronos-bg)] backdrop-blur-md px-4 py-2 shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between sm:min-h-10">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {t('update.banner_available', lang).replace('{{remote}}', remote.version)}
            <span className="opacity-70 font-normal text-[13px]">
              {t('update.banner_yours', lang).replace('{{current}}', currentVersion)}
            </span>
          </p>
          {remote.releaseNotesRu && (
            <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{remote.releaseNotesRu}</p>
          )}
          {!remote.downloadUrl && (
            <p className="text-[11px] opacity-70 mt-0.5">
              {t('update.manual_install_hint', lang)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--chronos-bg)]/80 hover:text-[var(--chronos-bg)] hover:bg-black/10 h-7 px-2"
            onClick={onDismiss}
            aria-label={t('update.later_aria', lang)}
          >
            <X className="w-4 h-4 mr-1" />
            {t('update.later', lang)}
          </Button>
          <Button
            size="sm"
            className="h-7 bg-[var(--chronos-bg)] text-[var(--chronos-primary-hex)] hover:bg-black/90"
            onClick={openUpdate}
          >
            <Download className="w-4 h-4 mr-1" />
            {remote.downloadUrl ? t('update.download_open', lang) : t('update.reload_page', lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
