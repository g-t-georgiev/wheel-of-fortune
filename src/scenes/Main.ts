import Scene from '../core/Scene';
import Action from "../Actions";
import MainSceneStates from '../states/Main';

export default class Main extends Scene {
  playStart!: Promise<void>;

  /** 
   * Initialize states, load resources, etc.
   */
  constructor() {
    super();

    console.log(`Hello, from ${this.constructor.name}!`);
    // this.initStates();
  }

  async load() {
    this.playStart = this.setAction(Action.PLAY);
  }

  protected initStates() {
    this.stateMachine.setStates({
      [MainSceneStates.INTRO]: async () => {
        // TODO: Handle intro screen and animations here.
      },
      [MainSceneStates.IDLE]: async () => {
        await this.playStart;
      },
      [MainSceneStates.PLAY_START]: async () => {
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
        // TODO: Retrigger freespins.
      },
      [MainSceneStates.FREESPINS_ACTIVATE]: async () => {
        // TODO: Show freespins splash screen, init free spins.

        await this.setAction(Action.FEATURE_START);
      },
      [MainSceneStates.FREESPINS_END]: async () => {
        // TODO: Handle freespins end, show free spins reward, etc.
      },
      [MainSceneStates.PLAY_STOP]: async () => {
        // TODO: Handle freespins scenarios here.
        // if (next spin) return PLAY_START
      },
      [MainSceneStates.ROUND_FINISH]: async () => {
        this.playStart = this.setAction(Action.PLAY);

        return MainSceneStates.IDLE;
      },
    });
  }

  protected actionsHandler(action: string) {
    if (action === Action[Action.PLAY]) {
      if (this.stateMachine.currentState !== MainSceneStates.IDLE) {
        console.warn("Cannot spin, game is not IDLE.");

        return;
      }

      this.resolveAction(Action.PLAY);

      return;
    }

    if (action === Action[Action.FEATURE_START]) {
      this.resolveAction(Action.FEATURE_START);

      return;
    }

    if (action === Action[Action.SKIP]) {
      this.skipHandler();

      return;
    }
  }

  protected skipHandler() {
    // TODO: Handle skipping logic here
  }
}
