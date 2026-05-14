/**
 * Явные переходы состояний. Держать таблицу переходов компактной; сложную логику — в домене.
 */

export type Transition<S extends string, E extends string> = Readonly<{
  from: S;
  event: E;
  to: S;
}>;

export class StateMachine<S extends string, E extends string> {
  private state: S;
  private readonly transitions: readonly Transition<S, E>[];

  constructor(initial: S, transitions: readonly Transition<S, E>[]) {
    this.state = initial;
    this.transitions = transitions;
  }

  getState(): S {
    return this.state;
  }

  dispatch(event: E): boolean {
    const next = this.transitions.find((t) => t.from === this.state && t.event === event);
    if (!next) return false;
    this.state = next.to;
    return true;
  }

  reset(initial: S): void {
    this.state = initial;
  }
}
