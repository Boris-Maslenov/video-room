import { Peer } from "../types";
import { peers } from "../data/peers";
import { randomUUID } from "crypto";

export const createPeer = (
  name: string,
  roomId: string,
  socketId: string,
  isOwner: boolean
): Peer => ({
  id: randomUUID(),
  roomId,
  name,
  socketId,
  isJoined: false,
  mediaState: null,
  sendTransport: null,
  recvTransport: null,
  videoProducer: null,
  audioProducer: null,
  ...(isOwner ? { ownerId: roomId } : {}),
});

export const getPeer = (id: string) => {
  const foundPeer = peers.find((peer) => peer.id === id);

  if (!foundPeer) {
    throw new Error(`Пир ${id} не найден`);
  }

  return foundPeer;
};

export const updatePeer = (newPeer: Peer) => {
  let foundPeer = getPeer(newPeer.id);
  foundPeer = newPeer;
};
