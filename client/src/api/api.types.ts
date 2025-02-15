export type SocketSendType = <T>(type: string, data?: object) => Promise<T>;

export type ErrorSocketType = {
  error: boolean;
  message: string;
  code: 500;
};

export const isErrorSocketType = (a: any): a is ErrorSocketType => {
  return a?.error ? true : false;
};

export type KindType = "audio" | "video";
