import { Scene, GameData, type ClientWrapper } from '../core';
import Action from "../Actions";
import MainSceneStates from '../states/Main';

export default class Main extends Scene {
  client!: ClientWrapper;
  gameData!: GameData;

  private playStart!: Promise<void>;

  async load() {
    this.client = this.props!.client;
    this.gameData = this.props!.gameData;

    this.playStart = this.setAction(Action.PLAY);
  }

  protected initStates() {
    this.stateMachine.setStates({
      [MainSceneStates.INTRO]: async () => {
        // TODO: Handle intro screen and animations here.
        console.log("INTRO");
      },
      [MainSceneStates.IDLE]: async () => {
        console.log("IDLE");
        await this.playStart;
      },
      [MainSceneStates.PLAY_START]: async () => {
        if (!this.gameData.response) {
          this.client.requestRoundData();
        }

        console.log("PLAY_START");
        // TODO: Start wheel spin.
      },
      [MainSceneStates.RECEIVED_DATA]: async () => {
        if (this.gameData.response) return;

        const response = await this.client.awaitRoundResponse();

        if (!response) {
          console.warn("Something went wrong while fetching response.");

          return;
        }

        this.gameData.setRoundResponse(response);
      },
      [MainSceneStates.SPIN_STOPPING]: async () => {
        // TODO: Trigger spin settle.
        console.log("SPIN_STOPPING", this.gameData.response);
      },
      [MainSceneStates.SPIN_STOP]: async () => {
        // TODO: Await spin stop.
        console.log("SPIN_STOP");
      },
      [MainSceneStates.SHOW_WINS]: async () => {
        // TODO: Display wins.
        console.log("SHOW_WINS");
      },
      [MainSceneStates.FREESPINS_RETRIGGER]: async () => {
        // TODO: Retrigger freespins.
        console.log("FREESPINS_RETRIGGER");
      },
      [MainSceneStates.FREESPINS_ACTIVATE]: async () => {
        // TODO: Show freespins splash screen, init free spins.
        console.log("FEATURE_START");

        await this.setAction(Action.FEATURE_START);
      },
      [MainSceneStates.FREESPINS_END]: async () => {
        // TODO: Handle freespins end, show free spins reward, etc.
      },
      [MainSceneStates.PLAY_FINISH]: async () => {
        if (this.gameData.nextSpin()) {
          return MainSceneStates.PLAY_START;
        }
      },
      [MainSceneStates.ROUND_FINISH]: async () => {
        this.playStart = this.setAction(Action.PLAY);

        return MainSceneStates.IDLE;
      },
    });
  }

  actionsHandler(action: string) {
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
