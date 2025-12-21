import type { ClientWrapper } from "./client";
import type { GameData } from "./GameData";

/**
 * Shared stage context passed to scene factories.
 * Contains central services and the single source of truth `GameData`.
 */
export interface SceneProps {
  client: ClientWrapper;
  gameData: GameData;
}

export type { ClientWrapper } from "./client";
