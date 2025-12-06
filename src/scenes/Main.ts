import Scene from '../core/Scene';
import actions, { Action } from "../Actions";
import MainSceneStates from '../states/Main';

export default class Main extends Scene {
  spinStart!: Promise<void>;

  /** 
   * Initialize states, load resources, etc.
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
      [MainSceneStates.SPIN_START]: async () => {
        // TODO: Request client data.
        // TODO: Start wheel spin.
      },
      [MainSceneStates.RECEIVED_DATA]: async () => {
        // TODO: Await response and cache response data.
      },
      [MainSceneStates.SPIN_STOPPING]: async () => {
        // TODO: Trigger spin settle.
      },
      [MainSceneStates.SPIN_STOP]: async () => {
        // TODO: Await spin stop.
      },
      [MainSceneStates.SHOW_WINS]: async () => {
        // TODO: Display wins.
      },
      [MainSceneStates.FREESPINS_RETRIGGER]: async () => {
        // TODO: Retrigger free spins.
      },
      [MainSceneStates.FREESPINS_START]: async () => {
        // TODO: Show free spins splash screen, init free spins.
      },
      [MainSceneStates.FREESPINS_END]: async () => {
        // TODO: Handle free spins end, show free spins reward, etc.
      },
      [MainSceneStates.ROUND_FINISH]: async () => {
        this.spinStart = this.setAction(Action.SPIN_START);

        return MainSceneStates.IDLE;
      },
    });
  }

  protected actionsHandler(action: string) {
    switch (action) {
      case actions.SPIN_START: {
        if (this.stateMachine.currentState !== MainSceneStates.IDLE) {
          console.warn("Cannot spin, game is not IDLE.");

          return;
        }

        this.resolveAction(Action.SPIN_START);

        break;
      }
      case actions.FEATURE_START: {
        this.resolveAction(Action.FEATURE_START);

        break;
      }
    }
  }
}
