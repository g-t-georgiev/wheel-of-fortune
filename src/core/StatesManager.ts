type State = { (): Promise<void | number> };
export interface States {
  [key: number]: State
}

export default class StatesManager {
  #states!: Map<number, State>;
  #currentState: number = 0;
  #hasUnresolvedState: boolean = false;

  constructor() {
    this.#states = new Map();
  }

  get currentState() {
    return this.#currentState;
  }

  setStates(states: Record<number, State>) {
    Object.entries(states)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .forEach(([id, state]) => {
        this.#states.set(Number(id), state);
      });

    return this.#states;
  }

  async execute(stateId: number = 0) {
    if (this.#hasUnresolvedState) return;

    const state = this.#states.get(stateId);

    if (!state) return;

    this.#currentState = stateId;

    this.#hasUnresolvedState = true;
    let nextStateId = await state();
    this.#hasUnresolvedState = false;

    if (nextStateId && nextStateId in this.#states) {
      this.execute(nextStateId);
      return;
    }

    nextStateId = this.#currentState + 1;

    if (nextStateId in this.#states) {
      this.execute(nextStateId);
    }
  }
}
