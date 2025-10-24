import { RemotePeer } from "../stores/MediasoupClientStore";

export type SocketSendType = <T>(
  type: string,
  data?: object
) => Promise<ApiResult<T>>;

// export type ErrorSocketType = {
//   error: boolean;
//   message: string;
//   code: number;
// };

export type ErrorSocketType = {
  ok: boolean;
  error: { message: string };
};

export type ApiResult<T> = {
  ok: boolean;
  data: T;
};

export const isErrorSocketType = (a: any): a is ErrorSocketType => {
  return a?.error ? true : false;
};

export type KindType = "audio" | "video";
export type SourceType = KindType | "screen";

export type ServerEvents = {
  [K in keyof ParamsServerEvents]: (...args: ParamsServerEvents[K]) => void;
};

export type ParamsServerEvents = {
  "peer:ready": [RemotePeer];
  "peer:closed": [string];
  "peer:camOn": [string, string];
  "peer:camOf": [string, string];
  "peer:screenOn": [string, string];
  "peer:screenOf": [string, string];
  "peer:toogleMic": [string, boolean];
};

export type ClientEvents = {};
