/**
 * Пул объектов: снижает GC-пиков в горячих циклах (частицы, временные векторы-обёртки и т.д.).
 * reset вызывается при возврате в пул; factory — при исчерпании свободных слотов (до maxSize).
 */

export class ObjectPool<T> {
  private readonly free: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (item: T) => void;
  private readonly maxSize: number;

  constructor(factory: () => T, reset: (item: T) => void, maxSize: number) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    const item = this.free.pop() ?? this.factory();
    return item;
  }

  release(item: T): void {
    if (this.free.length >= this.maxSize) return;
    this.reset(item);
    this.free.push(item);
  }
}
