import Scene from '../core/Scene';
import { Action } from "../core/ActionsManager";

enum MainSceneStates {
  INTRO,
  IDLE,
  SPIN_START,
  RECEIVED_DATA,
  SPIN_STOPPING,
  SPIN_STOP,
  SHOW_WINS,
  FREESPINS_RETRIGGER,
  FREESPINS_START,
  FREESPINS_END,
  ROUND_FINISH
}

export default class Main extends Scene {
  spinStart!: Promise<void>;

  /** 
   * Initial setup and/or loading of resources.
   * 
   * Logic here is executed only once when scene is constructed.
   */
  constructor() {
    super();

    console.log(`Hello, from ${this.constructor.name}!`);
    // this.initStates();
  }

  async load() {
    this.spinStart = this.setAction(Action.SPIN_START);
  }

  protected initStates() {
    this.stateMachine.setStates({
      [MainSceneStates.INTRO]: async () => { },
      [MainSceneStates.IDLE]: async () => {
        await this.spinStart;
      },
      [MainSceneStates.SPIN_START]: async () => { },
      [MainSceneStates.RECEIVED_DATA]: async () => { },
      [MainSceneStates.SPIN_STOPPING]: async () => { },
      [MainSceneStates.SPIN_STOP]: async () => { },
      [MainSceneStates.SHOW_WINS]: async () => { },
      [MainSceneStates.FREESPINS_RETRIGGER]: async () => { },
      [MainSceneStates.FREESPINS_START]: async () => { },
      [MainSceneStates.FREESPINS_END]: async () => { },
      [MainSceneStates.ROUND_FINISH]: async () => {
        this.spinStart = this.setAction(Action.SPIN_START);

        return MainSceneStates.IDLE;
      },
    });
  }

  protected actionsHandler(action: string) {
    switch (action) {
      case Action[Action.SPIN_START]: {
        this.resolveAction(Action.SPIN_START);

        break;
      }
      case Action[Action.FEATURE_START]: {
        this.resolveAction(Action.FEATURE_START);

        break;
      }
    }
  }
}
