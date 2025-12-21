import Scene from "./Scene";
import type { SceneProps } from "./types";
import type { ConstructorType } from "../types";


type SceneFactoryMap = Record<string, ConstructorType<typeof Scene>>;

export default class ScenesManager {
  #currentScene?: Scene;
  #sceneFactories!: SceneFactoryMap;
  #sceneInstances!: Map<string, Scene>;

  constructor() {
    this.#sceneInstances = new Map();
    this.#sceneFactories = ScenesManager.importScenesAsFactories();
  }

  get currentScene() {
    return this.#currentScene;
  }

  private static importScenesAsFactories() {
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
    }, {} as SceneFactoryMap);
  }

  /** Switch scenes. */
  async switchScene<K extends keyof SceneFactoryMap>(sceneName: K, props: SceneProps, deletePrevious: boolean = false): Promise<void> {
    await this.removeScene(deletePrevious);

    const nameStr = String(sceneName);
    const isSceneCached = this.#sceneInstances.has(nameStr);

    const scene = isSceneCached
      ? this.#sceneInstances.get(nameStr)
      : this.initScene(nameStr, props);

    if (!scene)
      throw new Error(`Failed to initialize scene: ${nameStr}`);

    this.#currentScene = scene;

    if (scene.load) await scene.load();

    scene.start();
  }

  private initScene(sceneName: string, props: SceneProps) {
    const sceneConstructor = this.#sceneFactories[sceneName];

    if (!sceneConstructor) return undefined;

    const scene = new sceneConstructor(props);

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
