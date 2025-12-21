import type { RequestType, RoundResponseData } from "./client/types";

export class GameData {
  #response: RoundResponseData<RequestType.Spin> | null = null;
  #initResponse: RoundResponseData<RequestType.Default>;

  /** Internal spin queue extracted from latest round response. */
  #spins: any[] = [];
  /** Internal property reference to the current spin index. */
  #spinIndex = -1;

  constructor(initResponse: RoundResponseData<RequestType.Default>) {
    this.#initResponse = initResponse;
  }

  get response() {
    return this.#response;
  }

  get initResponse() {
    return this.#initResponse;
  }

  get currentSpin() {
    return this.#spins[this.#spinIndex];
  }

  /** Set the latest round response and spin data. */
  setRoundResponse(response: RoundResponseData<RequestType.Spin>) {
    this.#response = response;
    const maybeSpins = (response as any)?.spins;
    this.#spins = Array.isArray(maybeSpins) ? maybeSpins : [];
    this.#spinIndex = 0;
  }

  inFreeSpins(): boolean {
    return this.#spins.length > 0;
  }

  hasNextSpins(): boolean {
    return this.#spinIndex + 1 < this.#spins.length;
  }

  nextSpin(): any | null {
    if (!this.hasNextSpins()) return null;
    this.#spinIndex += 1;
    return this.#spins[this.#spinIndex];
  }

  isFreeSpinFirst(): boolean {
    return this.#spinIndex === 0;
  }

  /** Resets round response and spins data. */
  reset() {
    this.#response = null;

    this.#spins = [];
    this.#spinIndex = -1;
  }
}