import Client from "./Client";
import { RequestType, type ResponseData } from "./ClientTypes.ts";

export default class ClientWrapper extends Client<RequestType.Spin> {
  override sendRequest() {
    return super.sendRequest(RequestType.Spin, {});
  }

  override getResponse() {
    return super.getResponse(RequestType.Spin);
  }

  setResponse(response: ResponseData<RequestType.Spin>): void {
    super.setResponse(response);
  }
}
