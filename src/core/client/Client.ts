import { RequestType, type RoundRequestData, type RoundResponseData } from "./types";

export interface ClientWrapper {
  requestRoundData(): Promise<RoundResponseData<RequestType.Spin>>;
  awaitRoundResponse(): Promise<RoundResponseData<RequestType.Spin> | undefined>;
}
export class Client implements ClientWrapper {
  async request<T extends RequestType>(
    // @ts-expect-error: boilerplate code, will implement
    type: T,
    // @ts-expect-error: boilerplate code, will implement
    params: RoundRequestData<T>
  ): Promise<RoundResponseData<T>> {
    // TODO: Implement HTTP request mechanism
    return Promise.resolve({} as RoundResponseData<T>);
  }

  private roundDataPromise?: Promise<RoundResponseData<RequestType.Spin>>;

  requestRoundData() {
    if (!this.roundDataPromise) {
      const requestParams = {} as RoundRequestData<RequestType.Spin>;
      this.roundDataPromise = this.request(RequestType.Spin, requestParams);
    }

    return this.roundDataPromise;
  }

  async awaitRoundResponse() {
    if (!this.roundDataPromise) return;

    const data = await this.roundDataPromise;
    this.roundDataPromise = undefined;

    return data;
  }
}
