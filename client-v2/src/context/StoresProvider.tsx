import {
  createContext,
  ReactNode,
  useMemo,
  useContext,
  useEffect,
} from "react";
import { RootStore, createRootStore } from "../stores/RootStore";
import { RemotePeer } from "../stores/MediasoupClientStore";

const errorMesage = "Root store not found!";

const Ctx = createContext<RootStore | null>(null);

export const StoresProvider = ({ children }: { children: ReactNode }) => {
  const root = useMemo(createRootStore, []);

  useEffect(() => {
    root.network.init();
    const onPeerClosed = (a: string) =>
      root.mediaSoupClient.deleteRemotePeer(a);
    const onPeerReady = (a: RemotePeer) => {
      root.mediaSoupClient.addRemotePeer(a);
    };
    const onCamOff = (a: string, b: string) =>
      root.mediaSoupClient.deleteConsumerFromRemotePeer(a, b);
    const onCamOn = (a: string, b: string) =>
      root.mediaSoupClient.addConsumerToRemotePeer(a, b);
    const onScreenOn = (remotePeerId: string, producerId: string) =>
      root.mediaSoupClient.startRemoteScreenShare(remotePeerId, producerId);
    const onScreenOff = (remotePeerId: string, producerId: string) =>
      root.mediaSoupClient.stopRemoteScreenShare(remotePeerId, producerId);
    const onToggleMic = (remotePeerId: string, micOn: boolean) =>
      root.mediaSoupClient.toogleRemoteMic(remotePeerId, micOn);

    root.network.addListener("peer:closed", onPeerClosed);
    root.network.addListener("peer:ready", onPeerReady);
    root.network.addListener("peer:camOf", onCamOff);
    root.network.addListener("peer:camOn", onCamOn);
    root.network.addListener("peer:screenOn", onScreenOn);
    root.network.addListener("peer:screenOf", onScreenOff);
    root.network.addListener("peer:toogleMic", onToggleMic);

    return () => root.network.cleanupNetworkSession();
  }, [root]);

  return <Ctx.Provider value={root}>{children}</Ctx.Provider>;
};

export const useMediaSoupStore = () => {
  const root = useContext(Ctx);
  if (!root) {
    throw new Error(errorMesage);
  }
  return root.mediaSoupClient;
};

export const useDevicesStore = () => {
  const root = useContext(Ctx);
  if (!root) {
    throw new Error(errorMesage);
  }
  return root.mediaDevices;
};

export const useSocketStore = () => {
  const root = useContext(Ctx);
  if (!root) {
    throw new Error(errorMesage);
  }
  return root.network;
};

export const useErrorStore = () => {
  const root = useContext(Ctx);
  if (!root) {
    throw new Error(errorMesage);
  }
  return root.error;
};
