/**
 * Заготовка behavior tree: узлы возвращают статус тика.
 * Расширять доменными действиями и условиями; не тащить тяжёлый ИИ в корень дерева без профилирования.
 */

export type BTStatus = 'success' | 'failure' | 'running';

export interface BTNode<Context> {
  tick(ctx: Context): BTStatus;
}

export class Sequence<Context> implements BTNode<Context> {
  private readonly children: readonly BTNode<Context>[];

  constructor(children: readonly BTNode<Context>[]) {
    this.children = children;
  }

  tick(ctx: Context): BTStatus {
    for (const child of this.children) {
      const s = child.tick(ctx);
      if (s === 'failure' || s === 'running') return s;
    }
    return 'success';
  }
}

export class Selector<Context> implements BTNode<Context> {
  private readonly children: readonly BTNode<Context>[];

  constructor(children: readonly BTNode<Context>[]) {
    this.children = children;
  }

  tick(ctx: Context): BTStatus {
    for (const child of this.children) {
      const s = child.tick(ctx);
      if (s === 'success' || s === 'running') return s;
    }
    return 'failure';
  }
}
