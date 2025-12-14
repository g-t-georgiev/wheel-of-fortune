import { Game } from "./core";
import emitter from "./core/EventEmitter";
import Action from "./Actions";

/** Main entry point for game setup and functionalities. */
export default class GameApi {
  #app!: Game;

  #view!: HTMLCanvasElement;
  #container!: HTMLElement;

  constructor() {
    this.#container = document.createElement("div");
    this.#container.setAttribute("id", "app");

    this.#view = document.createElement("canvas");

    this.#container.append(this.#view);

    this.#app = new Game({
      view: this.#view,
    });

    this.bootstrap();
  }

  get container() {
    return this.#container;
  }

  async bootstrap() {
    await this.#app.load();

    // listen for preload completion to start the Main scene
    emitter.once("preload:finished", () => this.#app.start());

    // forward document clicks as container interactions to the current scene
    document.addEventListener("click", () => this.#app.triggerAction(Action.CONTAINER_INTERACTION));
  }
}