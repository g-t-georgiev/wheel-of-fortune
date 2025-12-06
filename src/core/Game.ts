import ScenesManager from "./ScenesManager";

interface GameProps {
  view: Readonly<HTMLCanvasElement>;
}

export default class Game {
  #context: CanvasRenderingContext2D;
  #sceneManager!: ScenesManager;

  constructor({ view }: GameProps) {
    this.#context = view.getContext("2d")!;
    this.#sceneManager = new ScenesManager();
  }

  start() {
    this.#sceneManager.switchScene("Main", false);
  }
}
