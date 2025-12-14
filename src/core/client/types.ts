export enum RequestType {
  Default,
  Spin
}

interface InitRequestData { };
interface InitResponseData { };

interface SpinRequestData { };
interface SpinResponseData { };

interface Protocol {
  [RequestType.Default]: {
    req: InitRequestData;
    res: InitResponseData;
  };
  [RequestType.Spin]: {
    req: SpinRequestData;
    res: SpinResponseData;
  };
}

export type RoundRequestData<T extends RequestType> = Protocol[T]["req"];
export type RoundResponseData<T extends RequestType> = Protocol[T]["res"];