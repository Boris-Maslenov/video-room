import {
  createContext,
  ReactNode,
  useMemo,
  useContext,
  useEffect,
} from "react";
import { RootStore, createRootStore } from "../stores/RootStore";

const Ctx = createContext<RootStore | null>(null);

export const StoresProvider = ({ children }: { children: ReactNode }) => {
  const root = useMemo(createRootStore, []);

  useEffect(() => {
    root.network.init();
    return () => root.network.dispose();
  }, [root]);

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

export const useSocketStore = () => {
  const root = useContext(Ctx);
  if (!root) {
    throw new Error("Root store not found!");
  }
  return root.network;
};

export const useErrorStore = () => {
  const root = useContext(Ctx);
  if (!root) {
    throw new Error("Root store not found!");
  }
  return root.error;
};
