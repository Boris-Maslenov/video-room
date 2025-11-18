import { NetworkQuality } from "../types";

export const safeClose = (...objs: ({ close: () => void } | null)[]) => {
  objs.forEach((o) => {
    o?.close();
  });
};

export const calcNetworkQuality = (score: number): NetworkQuality => {
  if (score >= 8) return "good";
  if (score >= 5) return "medium";
  if (score >= 3) return "bad";
  return "very-bad";
};
