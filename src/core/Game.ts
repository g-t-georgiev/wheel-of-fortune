import ScenesManager from "./ScenesManager";
import { Client, RequestType } from "./client";
import { GameData } from "./GameData";
import type { StageContext } from "./types";
import Action from "../Actions";

// scene factories
import Main from "../scenes/Main";
import Preload from "../scenes/Preload";
// import gameConfig from "./configs/gameConfig";

interface GameProps {
  view: Readonly<HTMLCanvasElement>;
}

export class Game {
  // @ts-expect-error: boilerplate, will implement
  #context: CanvasRenderingContext2D;
  #sceneManager!: ScenesManager;
  #client!: Client;
  #gameData!: GameData;
  #stageContext?: StageContext;

  constructor({ view }: GameProps) {
    this.#client = new Client();
    this.#context = view.getContext("2d")!;
    this.#sceneManager = new ScenesManager({
      Preload: (ctx?: StageContext) => new Preload(ctx as any),
      Main: (ctx?: StageContext) => new Main(ctx as any),
    } as any);

    window.addEventListener("resize", this.resize);
  }

  async load() {
    const initResponse = await this.#client.request(RequestType.Default, {});

    this.#gameData = new GameData(initResponse);

    // build stage context for scenes
    this.#stageContext = {
      client: this.#client,
      gameData: this.#gameData,
    } as StageContext;

    return this.#sceneManager.switchScene("Preload", this.#stageContext, true);
  }

  /**
   * Start a scene by name. If no name provided, attempt to start `Preload`.
   * Falls back to `Main` when `Preload` is not available.
   */
  async start() {
    return this.#sceneManager.switchScene("Main", this.#stageContext, true);
  }

  /** Trigger an action on the current scene (for external inputs) */
  triggerAction(action: number) {
    // call the current scene's action handler with the string name of the enum
    const scene = this.#sceneManager.currentScene;
    if (!scene) return;

    try {
      scene.actionsHandler(Action[action]);
    } catch (err) {
      console.warn("Failed to dispatch action to scene:", err);
    }
  }

  resize = () => {
    // TODO: Calculate
  };
}
