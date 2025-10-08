import MediaSoupClientStore from "./MediasoupClientStore";
import MediaDevicesStore from "./MediaDevicesStore";
import SocketStore from "./SocketStore";
import ErrorStore from "./ErrorStore";

export class RootStore {
  mediaSoupClient: MediaSoupClientStore;
  mediaDevices: MediaDevicesStore;
  network: SocketStore;
  error: ErrorStore;

  constructor() {
    this.mediaSoupClient = new MediaSoupClientStore(this);
    this.mediaDevices = new MediaDevicesStore(this);
    this.network = new SocketStore(this);
    this.error = new ErrorStore(this);
  }
}

export const createRootStore = () => new RootStore();
