export enum Action {
  SPIN_START,
  FEATURE_START,
}

export default class ActionsManager {
  #actions!: Map<Action, { (): void }>;

  constructor() {
    this.#actions = new Map();
  }

  setAction(action: Action): Promise<void> {
    this.resolveAction(action);

    return new Promise<void>((r) => {
      this.#actions.set(action, r);
    });
  }

  resolveAction(action: Action) {
    this.#actions.get(action)?.();
    this.#actions.delete(action);
  }
}
