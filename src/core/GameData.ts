import type { RequestType, RoundResponseData } from "./client/types";

export class GameData {
  #response?: RoundResponseData<RequestType.Spin>;
  #initResponse: RoundResponseData<RequestType.Default>;

  // internal spin queue extracted from latest round response
  #spins: any[] = [];
  #currentIndex = -1;

  constructor(initResponse: RoundResponseData<RequestType.Default>) {
    this.#initResponse = initResponse;
  }

  get response() {
    return this.#response;
  }

  // previously `defaultResponse`
  get initResponse() {
    return this.#initResponse;
  }

  // set the latest round response and prepare internal spins queue
  setRoundResponse(data: RoundResponseData<RequestType.Spin>) {
    this.#response = data;
    const maybeSpins = (data as any)?.spins;
    this.#spins = Array.isArray(maybeSpins) ? maybeSpins : [];
    this.#currentIndex = -1;
  }

  inFreeSpins(): boolean {
    return this.#spins.length > 0;
  }

  hasNextSpins(): boolean {
    return this.#currentIndex + 1 < this.#spins.length;
  }

  nextSpin(): any | null {
    if (!this.hasNextSpins()) return null;
    this.#currentIndex += 1;
    return this.#spins[this.#currentIndex];
  }

  isFreeSpinFirst(): boolean {
    return this.#currentIndex === 0;
  }

  get currentSpinIndex(): number {
    return this.#currentIndex;
  }

  resetSpins() {
    this.#spins = [];
    this.#currentIndex = -1;
  }
}