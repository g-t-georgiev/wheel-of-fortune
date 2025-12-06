export type RequestType =
  | "init"
  | "spin";

interface InitRequestData {
  id: number;
};
interface InitResponseData {
  sessionToken: string;
};

interface SpinRequestData {
  sessionToken: string;
  bet: number;
};
interface SpinResponseData {
  spins: any[];
};

interface Protocol {
  "init": {
    req: InitRequestData;
    res: InitResponseData;
  };
  "spin": {
    req: SpinRequestData;
    res: SpinResponseData;
  };
}

export type RequestData<T extends RequestType> = Protocol[T]["req"];
export type ResponseData<T extends RequestType> = Protocol[T]["res"];