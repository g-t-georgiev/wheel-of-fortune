import StatesManager from "./StatesManager";

export default abstract class Scene {
  abstract name: string;

  protected stateMachine!: StatesManager;

  constructor() {
    this.stateMachine = new StatesManager();
  }

  init() {
    this.stateMachine.execute();
  }

  protected abstract initStates(): void;

  destroy() {
    //
  }
}
