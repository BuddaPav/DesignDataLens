/**
 * Минимальный «ECS-лайт»: сущности и компоненты без полноценного ECS-движка.
 * Для тяжёлой симуляции рассмотреть вынос систем в отдельный модуль и batch-обновление.
 */

export type EntityId = number;

export type ComponentKey = string;

export type ComponentBag = Readonly<Record<ComponentKey, unknown>>;

export class EcsLite {
  private nextId = 1 as EntityId;
  private readonly entities = new Map<EntityId, Record<ComponentKey, unknown>>();

  spawn(components: Record<ComponentKey, unknown>): EntityId {
    const id = this.nextId;
    this.nextId = (id + 1) as EntityId;
    this.entities.set(id, { ...components });
    return id;
  }

  despawn(id: EntityId): void {
    this.entities.delete(id);
  }

  getComponent<K extends ComponentKey>(id: EntityId, key: K): unknown {
    return this.entities.get(id)?.[key];
  }

  setComponent<K extends ComponentKey>(id: EntityId, key: K, value: unknown): void {
    const e = this.entities.get(id);
    if (!e) return;
    e[key] = value;
  }
}
