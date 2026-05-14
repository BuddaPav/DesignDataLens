/// <reference types="vite/client" />

declare const __CHRONOS_VERSION__: string;

interface Window {
  chronosDesktop?: {
    preload: boolean;
    onOcclusionChanged?: (cb: (p: { occluded: boolean }) => void) => () => void;
    writeCrashLog?: (text: string) => Promise<boolean>;
  };
}
