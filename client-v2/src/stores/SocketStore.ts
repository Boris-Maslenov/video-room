import { RootStore } from "./RootStore";
import { makeAutoObservable } from "mobx";
import { io } from "socket.io-client";
import {
  SocketSendType,
  ServerEvents,
  ClientEvents,
  ParamsServerEvents,
} from "../api/api.types";
import { Socket } from "socket.io-client";
import { socketPromise } from "../api/api";
import { NetworkPeerStatus } from "./MediasoupClientStore";
import { WS_IP } from "../config";

class SocketStore {
  root: RootStore;
  private initial: boolean;
  socket: Socket<ServerEvents, ClientEvents>;
  apiSend: SocketSendType;
  eventBus: { [K in keyof ServerEvents]+?: ServerEvents[K][] } = {};
  networkStatus: NetworkPeerStatus = "offline";

  constructor(root: RootStore) {
    this.root = root;
    this.socket = io(WS_IP);
    this.apiSend = socketPromise(this.socket);
    this.initial = false;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setNetStatus(status: NetworkPeerStatus) {
    this.networkStatus = status;
  }

  init() {
    if (this.initial) {
      return;
    }

    this.initial = true;
    this.socket.on("peer:closed", this.handlePeerClosed);
    this.socket.on("peer:ready", this.handlePeerReady);
    this.socket.on("peer:camOff", this.handleCamOff);
    this.socket.on("peer:camOn", this.handleCamOn);
    this.socket.on("peer:screenOff", this.handleScreenOff);
    this.socket.on("peer:screenOn", this.handleScreenOn);
    this.socket.on("peer:toggleMic", this.handleToggleMic);
    this.socket.on(
      "peer:updateNetworkQuality",
      this.handleUpdateNetworkQuality
    );
    this.socket.on("room:updateCount", this.handleUpdateCount);
    this.socket.on("room:activeSpeaker", this.handleActiveSpeaker);

    this.socket.on("connect", () => {
      this.setNetStatus("online");
    });

    this.socket.on("connect_error", () => {
      this.setNetStatus("offline");
      this.root.mediaSoupClient.cleanupMediaSession();
    });

    this.socket.on("disconnect", () => {
      this.setNetStatus("offline");
      this.root.mediaSoupClient.cleanupMediaSession();
    });
  }

  private emit<K extends keyof ParamsServerEvents>(
    event: K,
    ...payloadParams: ParamsServerEvents[K]
  ) {
    this.eventBus[event]?.forEach((cb) => cb(...payloadParams));
  }

  private handlePeerClosed(...args: ParamsServerEvents["peer:closed"]) {
    this.emit("peer:closed", ...args);
  }

  private handlePeerReady(...args: ParamsServerEvents["peer:ready"]) {
    this.emit("peer:ready", ...args);
  }

  private handleCamOff(...args: ParamsServerEvents["peer:camOff"]) {
    this.emit("peer:camOff", ...args);
  }

  private handleCamOn(...args: ParamsServerEvents["peer:camOn"]) {
    this.emit("peer:camOn", ...args);
  }

  private handleScreenOn(...args: ParamsServerEvents["peer:screenOn"]) {
    this.emit("peer:screenOn", ...args);
  }

  private handleScreenOff(...args: ParamsServerEvents["peer:screenOff"]) {
    this.emit("peer:screenOff", ...args);
  }

  private handleToggleMic(...args: ParamsServerEvents["peer:toggleMic"]) {
    this.emit("peer:toggleMic", ...args);
  }

  private handleUpdateCount(...args: ParamsServerEvents["room:updateCount"]) {
    this.emit("room:updateCount", ...args);
  }

  private handleActiveSpeaker(
    ...args: ParamsServerEvents["room:activeSpeaker"]
  ) {
    this.emit("room:activeSpeaker", ...args);
  }

  private handleUpdateNetworkQuality(
    ...args: ParamsServerEvents["peer:updateNetworkQuality"]
  ) {
    this.emit("peer:updateNetworkQuality", ...args);
  }

  cleanupNetworkSession() {
    if (!this.initial) return;
    this.initial = false;
    this.socket.off("peer:closed", this.handlePeerClosed);
    this.socket.off("peer:ready", this.handlePeerReady);
    this.socket.off("peer:camOff", this.handleCamOff);
    this.socket.off("peer:camOn", this.handleCamOn);
    this.socket.off("peer:screenOff", this.handleScreenOff);
    this.socket.off("peer:screenOn", this.handleScreenOn);
    this.socket.off("peer:toggleMic", this.handleToggleMic);
    this.socket.off(
      "peer:updateNetworkQuality",
      this.handleUpdateNetworkQuality
    );
    this.socket.off("room:updateCount", this.handleUpdateCount);
    this.socket.off("room:activeSpeaker", this.handleActiveSpeaker);
    // защита от утечек при HMR
    this.socket.disconnect();
    this.eventBus = {};
    this.root.mediaSoupClient.cleanupMediaSession();
  }

  addListener<K extends keyof ServerEvents>(event: K, cb: ServerEvents[K]) {
    if (this.eventBus[event]) {
      this.eventBus[event].push(cb);
    } else {
      this.eventBus[event] = [];
      this.eventBus[event].push(cb);
    }
  }
}

export default SocketStore;
