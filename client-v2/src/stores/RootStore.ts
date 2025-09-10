import MediaSoupClientStore from "./MediasoupClientStore";
import MediaDevicesStore from "./MediaDevicesStore";

export class RootStore {
  mediaSoupClient: MediaSoupClientStore;
  mediaDevices: MediaDevicesStore;

  constructor() {
    this.mediaSoupClient = new MediaSoupClientStore(this);
    this.mediaDevices = new MediaDevicesStore(this);
  }
}

export const createRootStore = () => new RootStore();
