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

    console.log(this.#states);
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

    console.log("HERE 1", nextStateId);
    if (nextStateId && this.#states.has(nextStateId)) {
      console.log("HERE 2");
      this.execute(nextStateId);
      return;
    }

    nextStateId = this.#currentState + 1;
    console.log("HERE 3", nextStateId, this.#states.has(nextStateId));

    if (this.#states.has(nextStateId)) {
      this.execute(nextStateId);
    }
  }
}
