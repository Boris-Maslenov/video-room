import { createContext, ReactNode, useMemo, useContext } from "react";
import { RootStore, createRootStore } from "../stores/RootStore";

const Ctx = createContext<RootStore | null>(null);

export const StoresProvider = ({ children }: { children: ReactNode }) => {
  const root = useMemo(createRootStore, []);
  return <Ctx.Provider value={root}>{children}</Ctx.Provider>;
};

export const useMediaSoupStore = () => {
  const root = useContext(Ctx);
  if (!root) {
    throw new Error("Root store not found!");
  }
  return root.mediaSoupClient;
};

export const useDevicesStore = () => {
  const root = useContext(Ctx);
  if (!root) {
    throw new Error("Root store not found!");
  }
  return root.mediaDevices;
};
