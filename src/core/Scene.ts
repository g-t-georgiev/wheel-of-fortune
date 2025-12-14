import ActionsManager from "./ActionsManager";
import StatesManager from "./StatesManager";
import type { StageContext } from "./types";

export interface Scene {
  /** Play animations or some setup before starting state machine*/
  load(): Promise<unknown>;
  /** Play animation or some cleanup when removing scene */
  unload(): Promise<unknown>;
  /** Resize handler */
  resize(params: any): void;
  /** Ticker update handler */
  update(delta: number): void;
}

export abstract class Scene implements Scene {
  #actionsManager!: ActionsManager;

  protected stateMachine!: StatesManager;

  /** 
   * Initial setup and/or loading of resources.
   * 
   * Logic here is executed only once when scene is constructed.
   */
  constructor(protected ctx: StageContext) {
    this.stateMachine = new StatesManager();
    this.#actionsManager = new ActionsManager();
  }

  protected abstract initStates(): void;

  abstract actionsHandler(action: string): void;

  protected abstract skipHandler(): void;

  /** @readonly */
  start() {
    this.stateMachine.execute();
  }

  /** @readonly */
  setAction(action: number) {
    return this.#actionsManager.setAction(action);
  }

  /** @readonly */
  resolveAction(action: number) {
    return this.#actionsManager.resolveAction(action);
  }

  /** @readonly */
  destroy() { }
}

export default Scene;