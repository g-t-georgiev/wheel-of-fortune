export default class ActionsManager {
  #actions!: Map<number, { (): void }>;

  constructor() {
    this.#actions = new Map();
  }

  setAction(action: number): Promise<void> {
    this.resolveAction(action);

    return new Promise<void>((r) => {
      this.#actions.set(action, r);
    });
  }

  resolveAction(action: number) {
    this.#actions.get(action)?.();
    this.#actions.delete(action);
  }
}
