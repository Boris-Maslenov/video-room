import { Peer } from "../types";
import { createPeer } from "../models/peer";
import { addPeer, getRoom } from "../models/room";

export const createPeerService = (
  roomId: string,
  name: string,
  socketId: string,
  isOwner: boolean,
  micOn: boolean,
  camOn: boolean
): Peer => {
  const peer = createPeer(roomId, name, socketId, isOwner, micOn, camOn);
  const peers = getRoom(roomId).peers;

  if (peers.find((val) => val.id === peer.id)) {
    throw new Error(`Пир ${peer.name} уже существует`);
  }

  addPeer(roomId, peer);

  return peer;
};
