import MediaSoupClientStore from "./MediasoupClientStore";
import MediaDevicesStore from "./MediaDevicesStore";
import SocketStore from "./SocketStore";

export class RootStore {
  mediaSoupClient: MediaSoupClientStore;
  mediaDevices: MediaDevicesStore;
  network: SocketStore;

  constructor() {
    this.mediaSoupClient = new MediaSoupClientStore(this);
    this.mediaDevices = new MediaDevicesStore(this);
    this.network = new SocketStore(this);
  }
}

export const createRootStore = () => new RootStore();
