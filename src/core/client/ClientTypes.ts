export enum RequestType {
  Init,
  Spin
}

interface InitRequestData { };
interface InitResponseData { };

interface SpinRequestData { };
interface SpinResponseData { };

interface Protocol {
  [RequestType.Init]: {
    req: InitRequestData;
    res: InitResponseData;
  };
  [RequestType.Spin]: {
    req: SpinRequestData;
    res: SpinResponseData;
  };
}

export type RequestData<T extends RequestType> = Protocol[T]["req"];
export type ResponseData<T extends RequestType> = Protocol[T]["res"];