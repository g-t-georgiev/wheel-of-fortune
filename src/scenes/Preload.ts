import { Scene } from '../core';
import emitter from '../core/EventEmitter';
import PreloadStates from '../states/Preload';
import Action from '../Actions';

export default class Preload extends Scene {
  async load() {
    // 
  }

  async unload() {
    // 
  }

  protected initStates() {
    this.stateMachine.setStates({
      [PreloadStates.SPLASH]: async () => {
        // Game splash
        console.log("GameSplash");
      },
    });
  }

  actionsHandler(action: string) {
    if (action === Action[Action.CONTAINER_INTERACTION]) {
      // signal that preload finished, so GameApi can start Main
      emitter.emit("preload:finished");
    }
  }

  protected skipHandler() {
    // Nothing to skip here
  }
}
