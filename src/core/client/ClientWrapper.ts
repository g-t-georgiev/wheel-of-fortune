import Client from "./Client";
import { type RequestData, type ResponseData } from "./ClientTypes.ts";

export default class ClientWrapper extends Client<"spin"> {
  override sendRequest() {
    return super.sendRequest("spin", {} as RequestData<"spin">);
  }

  override getResponse() {
    return super.getResponse("spin");
  }

  setResponse(response: ResponseData<"spin">): void {
    super.setResponse(response);
  }
}
