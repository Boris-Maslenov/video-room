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
import { socketPromise, WS_URL } from "../api/api";
import { NetworkPeerStatus } from "./MediasoupClientStore";

class SocketStore {
  root: RootStore;
  private initial: boolean;
  private socket: Socket<ServerEvents, ClientEvents>;
  eventBus: { [K in keyof ServerEvents]+?: ServerEvents[K][] } = {};
  networkStatus: NetworkPeerStatus = "offline";

  constructor(root: RootStore) {
    this.root = root;
    this.socket = io(WS_URL);
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
    this.socket.on("peer:camOf", this.handleCamOf);
    this.socket.on("peer:camOn", this.handleCamOn);
    this.socket.on("peer:screenOf", this.handleScreenOf);
    this.socket.on("peer:screenOn", this.handleScreenOn);
    this.socket.on("peer:toogleMic", this.handleToogleMic);

    this.socket.on("connect", () => {
      this.setNetStatus("online");
    });
    this.socket.on("connect_error", () => {
      console.log("connect_error");
      this.setNetStatus("offline");
      this.root.mediaSoupClient.cleanupSession();
    });
    this.socket.on("disconnect", () => {
      console.log("disconnect");
      this.setNetStatus("offline");
      this.root.mediaSoupClient.cleanupSession();
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

  private handleCamOf(...args: ParamsServerEvents["peer:camOf"]) {
    this.emit("peer:camOf", ...args);
  }

  private handleCamOn(...args: ParamsServerEvents["peer:camOn"]) {
    this.emit("peer:camOn", ...args);
  }

  private handleScreenOn(...args: ParamsServerEvents["peer:screenOn"]) {
    this.emit("peer:screenOn", ...args);
  }

  private handleScreenOf(...args: ParamsServerEvents["peer:screenOf"]) {
    this.emit("peer:screenOf", ...args);
  }

  private handleToogleMic(...args: ParamsServerEvents["peer:toogleMic"]) {
    this.emit("peer:toogleMic", ...args);
  }

  dispose() {
    if (!this.initial) return;
    this.initial = false;
    this.socket.off("peer:closed", this.handlePeerClosed);
    this.socket.off("peer:ready", this.handlePeerReady);
    // защита от утечек при HMR
    this.socket.disconnect();
    this.eventBus = {};
    this.root.mediaSoupClient.cleanupSession();
  }

  addListener<K extends keyof ServerEvents>(event: K, cb: ServerEvents[K]) {
    if (this.eventBus[event]) {
      this.eventBus[event].push(cb);
    } else {
      this.eventBus[event] = [];
      this.eventBus[event].push(cb);
    }
  }

  /**
   * TODO: сделать нормальную типизацию, слиентских событий
   */
  apiSend(): SocketSendType {
    return socketPromise(this.socket);
  }
}

export default SocketStore;
