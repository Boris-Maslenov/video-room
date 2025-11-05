import MediaSoupClientStore from "./MediasoupClientStore";
import MediaDevicesStore from "./MediaDevicesStore";
import SocketStore from "./SocketStore";
import ErrorStore from "./ErrorStore";
import PeerCarouselStore from "./PeerCarouselStore";

export class RootStore {
  mediaSoupClient: MediaSoupClientStore;
  mediaDevices: MediaDevicesStore;
  network: SocketStore;
  error: ErrorStore;
  viewPeer: PeerCarouselStore;

  constructor() {
    this.mediaSoupClient = new MediaSoupClientStore(this);
    this.mediaDevices = new MediaDevicesStore(this);
    this.network = new SocketStore(this);
    this.error = new ErrorStore(this);
    this.viewPeer = new PeerCarouselStore(this);
  }
}

export const createRootStore = () => new RootStore();
