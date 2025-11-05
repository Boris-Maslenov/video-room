import { makeAutoObservable, computed } from "mobx";
import { RootStore } from "./RootStore";

import { getGroupShema } from "../utils/mediaUtils";
import { MAX_PEERS_IN_SLIDE } from "../config";

class PeerCarouselStore {
  root: RootStore;
  private _peersCount: number = 0;
  private _activePeerGroup: number = 0;

  constructor(root: RootStore) {
    this.root = root;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get getViewShema() {
    const selfPeer = this.root.mediaSoupClient.selfPeer;
    const remotePeers = this.root.mediaSoupClient.remotePeers;

    return getGroupShema(
      selfPeer ? [selfPeer].concat(remotePeers) : remotePeers,
      MAX_PEERS_IN_SLIDE
    );
  }

  get activePeerGroup() {
    return this._activePeerGroup;
  }
  set activePeerGroup(num: number) {
    this._activePeerGroup = num;
  }

  get peersCount() {
    return this._peersCount;
  }
  set peersCount(count: number) {
    this._peersCount = count;
  }

  getVisiblePeerIds() {
    return this.getViewShema[this.activePeerGroup]?.map((p) => p.id) ?? [];
  }
}
export default PeerCarouselStore;
