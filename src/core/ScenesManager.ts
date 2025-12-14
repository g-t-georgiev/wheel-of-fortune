import Scene from "./Scene";
import type { StageContext } from "./types";
import type { ConstructorType } from "../types";

type SceneFactory = (ctx?: StageContext) => Scene;

export default class ScenesManager<Factories extends Record<string, SceneFactory> = Record<string, SceneFactory>> {
  #currentScene?: Scene;
  #sceneFactories!: Factories;
  #sceneInstances!: Map<string, Scene>;

  constructor(factories?: Factories) {
    this.#sceneInstances = new Map();
    this.#sceneFactories = factories ?? (ScenesManager.importScenesAsFactories() as Factories);
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

      // create a factory that forwards the context to the constructor
      acc[fileName] = ((ctx?: StageContext) => new module.default(ctx as any)) as SceneFactory;

      return acc;
    }, {} as Record<string, SceneFactory>);
  }

  // overloaded signature: allow (name, ctx, deletePrevious) or (name, deletePrevious)
  async switchScene<K extends keyof Factories>(sceneName: K, ctxOrDeletePrevious?: StageContext | boolean, deletePrevious = false) {
    // maintain backward compatibility: if caller passed boolean as second arg
    let ctx: StageContext | undefined;

    if (typeof ctxOrDeletePrevious === "boolean") {
      deletePrevious = ctxOrDeletePrevious as boolean;
      ctx = undefined;
    } else {
      ctx = ctxOrDeletePrevious as StageContext | undefined;
    }

    await this.removeScene(deletePrevious);

    const nameStr = String(sceneName);
    const isSceneCached = this.#sceneInstances.has(nameStr);

    const scene = isSceneCached
      ? this.#sceneInstances.get(nameStr)
      : this.initScene(nameStr, ctx);

    if (!scene)
      throw new Error(`Failed to initialize scene: ${nameStr}`);

    this.#currentScene = scene;

    if (scene.load) await scene.load();

    scene.start();
  }

  private initScene(sceneName: string, ctx?: StageContext) {
    const factory = this.#sceneFactories[sceneName];

    if (!factory) return undefined;

    const scene = factory(ctx);

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
