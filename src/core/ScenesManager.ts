import type Scene from "./Scene";

export default class ScenesManager {
  #currentScene!: Scene;

  async switchScene(name: string) {
    try {
      const sceneConstructor = (await import(`../scenes/${name}.ts`))
        .default as ({ new(...args: any[]): any });

      if (this.#currentScene) {
        this.#currentScene.destroy();
      }

      this.#currentScene = new sceneConstructor();

      this.#currentScene.init();
    } catch (err) {

    }
  }
}
