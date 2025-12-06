import Game from "./core/Game";
import gameConfig from "./configs/gameConfig";

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

    window.addEventListener("resize", this.resize);
  }

  get container() {
    return this.#container;
  }

  resize = () => {
    // TODO: Calculate
  };
}