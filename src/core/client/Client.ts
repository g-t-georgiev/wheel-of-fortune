import { type RequestType, type RequestData, type ResponseData } from "./ClientTypes.ts";

export default class Client<T extends RequestType> {
  async sendRequest(type: T, params: RequestData<T>): Promise<void> {
    return Promise.resolve();
  }

  async getResponse(type: T): Promise<ResponseData<T>> {
    return {} as ResponseData<T>;
  }

  setResponse(response: ResponseData<T>): void { }
}

