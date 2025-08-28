import MediaSoupClientStore from "./MediasoupClientStore";

export class RootStore {
  mediaSoupClient = new MediaSoupClientStore(this);
}

export const createRootStore = () => new RootStore();
