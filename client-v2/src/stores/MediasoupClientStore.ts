import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";
import { Device } from "mediasoup-client";
import type {
  RtpCapabilities,
  TransportOptions,
  ConsumerOptions,
  Transport,
  Producer,
} from "mediasoup-client/types";

export type MediaDevice = {
  deviceId: string;
  label: string;
  groupId: string;
};

class MediasoupClientStore {
  root: RootStore;
  peerState: "offline" | "connecting" | "joined" | "leaving" | "leav" =
    "offline";
  localMediaStream: MediaStream | null = null;
  device: Device | null = null;
  sendTransport: Transport | null = null;
  recvTransport: Transport | null = null;
  videoProducer: Producer | null = null;
  audioProducer: Producer | null = null;

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this);
  }
}
export default MediasoupClientStore;
