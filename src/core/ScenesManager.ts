import Scene from "./Scene";
import type { ConstructorType } from "../types";

export default class ScenesManager {
  #currentScene?: Scene;
  #sceneConstructors!: Record<string, ConstructorType<typeof Scene>>;
  #sceneInstances!: Map<string, Scene>;

  constructor() {
    this.#sceneInstances = new Map();
    this.#sceneConstructors = ScenesManager.importScenes();
  }

  get currentScene() {
    return this.#currentScene;
  }

  private static importScenes() {
    const sceneModules = import.meta.glob(
      "/src/scenes/*.ts",
      { eager: true }
    ) as Record<string, { default: ConstructorType<typeof Scene> }>;

    return Object.entries(sceneModules).reduce((acc, [path, module]) => {
      const fileName = path.split("/").pop()?.split(".")[0];

      if (!fileName)
        throw new Error("Error while parsing filename");

      acc[fileName] = module.default;

      return acc;
    }, {} as Record<string, ConstructorType<typeof Scene>>);
  }

  async switchScene(sceneName: string, deletePrevious = true) {
    await this.removeScene(deletePrevious);

    const isSceneCached = this.#sceneInstances.has(sceneName);

    const scene = isSceneCached
      ? this.#sceneInstances.get(sceneName)
      : this.initScene(sceneName);

    if (!scene)
      throw new Error(`Failed to initialize scene: ${sceneName}`);

    this.#currentScene = scene;

    if (scene.load) await scene.load();

    scene.start();
  }

  private initScene(sceneName: string) {
    // const sceneUtils = {};

    const scene = new this.#sceneConstructors[sceneName]();

    if (!(scene instanceof Scene))
      throw new TypeError(`Invalid type value for scene ${sceneName}`);

    this.#sceneInstances.set(sceneName, scene);

    return scene;
  }

  private async removeScene(destroy: boolean) {
    if (!this.#currentScene) return;

    if (this.#currentScene.unload) await this.#currentScene?.unload();

    if (destroy) {
      this.#currentScene.destroy();
      this.#sceneInstances.delete(this.#currentScene.constructor.name);
    }

    this.#currentScene = undefined;
  }
}
