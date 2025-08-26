import { Peer } from "../types";
import { rooms } from "../data/rooms";
import { peers } from "../data/peers";
import { createPeer as create } from "../models/peer";

export const createPeer = (
  roomId: string,
  name: string,
  socketId: string,
  isOwner: boolean
): Peer => {
  const peer = create(roomId, name, socketId, isOwner);

  if (!peers.find((val) => val.id === peer.id)) {
    peers.push(peer);
  } else {
    throw new Error(`Пир ${peer.name} уже существует`);
  }

  if (isOwner && rooms.has(roomId)) {
    rooms.set(roomId, { ...rooms.get(roomId), ownerId: peer.id });
  }

  return peer;
};
