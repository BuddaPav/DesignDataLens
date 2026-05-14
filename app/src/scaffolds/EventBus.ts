/**
 * Лёгкий типизированный шина событий для развязки подсистем.
 * В проде держать подписчиков ограниченным числом; в горячем цикле — не аллоцировать новые лямбды.
 */

export type EventHandler<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private readonly listeners = new Map<string, Set<EventHandler<unknown>>>();

  on<K extends keyof Events & string>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): () => void {
    const set = this.listeners.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.listeners.set(event, set);
    return () => {
      set.delete(handler as EventHandler<unknown>);
      if (set.size === 0) this.listeners.delete(event);
    };
  }

  emit<K extends keyof Events & string>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const h of set) (h as EventHandler<Events[K]>)(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}
