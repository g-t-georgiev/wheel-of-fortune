import ScenesManager from "./ScenesManager";
import { Client, RequestType } from "./client";
import { GameData } from "./GameData";
import type { SceneProps } from "./types";
import Action from "../Actions";

interface GameProps {
  view: Readonly<HTMLCanvasElement>;
}

export class Game {
  // @ts-expect-error: boilerplate, will implement
  #context: CanvasRenderingContext2D;
  #sceneManager!: ScenesManager;
  #client!: Client;
  #gameData!: GameData;
  #stageContext!: SceneProps;

  constructor({ view }: GameProps) {
    this.#client = new Client();
    this.#context = view.getContext("2d")!;

    this.#sceneManager = new ScenesManager();

    window.addEventListener("resize", this.resize);
  }

  async load() {
    const initResponse = await this.#client.request(RequestType.Default, {});

    this.#gameData = new GameData(initResponse);

    // build stage context for scenes
    this.#stageContext = {
      client: this.#client,
      gameData: this.#gameData,
    } as SceneProps;

    return this.#sceneManager.switchScene("Preload", this.#stageContext);
  }

  async start() {
    return this.#sceneManager.switchScene("Main", this.#stageContext, true);
  }

  /** Trigger an action on the current scene (for external inputs) */
  callActions(action: number) {
    const { currentScene } = this.#sceneManager;

    try {
      currentScene?.actionsHandler(Action[action]);
    } catch (err) {
      console.warn("Failed to dispatch action to scene:", err);
    }
  }

  /** Resizes stage relative to the current viewport dimensions. */
  resize = () => {
    // TODO: Implement resize logic here
  };
}
