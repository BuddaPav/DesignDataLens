/** Типизация кастомных событий на window (без `as any` в слушателях). */
export {};

declare global {
  interface WindowEventMap {
    'chronos:settings_updated': Event;
    'chronos:navigation_updated': Event;
  }
}
