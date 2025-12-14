import { Scene } from '../core';
import type { StageContext } from '../core/types';
import emitter from '../core/EventEmitter';
import PreloadStates from '../states/Preload';
import Action from '../Actions';

export default class Preload extends Scene {
  constructor(ctx: StageContext) {
    super(ctx);

    this.initStates();
  }

  async load() {
    // nothing to attach here — GameApi will trigger actions on document clicks
  }

  async unload() {
    // nothing to cleanup in minimal preload
  }

  protected initStates() {
    this.stateMachine.setStates({
      [PreloadStates.SPLASH]: async () => {
        // splash state placeholder
        console.log("SPLASH");
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
    // not used
  }
}
