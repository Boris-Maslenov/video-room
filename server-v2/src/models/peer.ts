import { Peer } from "../types";
import { randomUUID } from "crypto";

export const createPeer = (
  roomId: string,
  name: string,
  socketId: string,
  isOwner: boolean,
  micOn = false,
  camOn = false
): Peer => ({
  id: randomUUID(),
  roomId,
  name,
  socketId,
  isJoined: false,
  rtpCapabilities: null,
  sendTransport: null,
  recvTransport: null,
  videoProducer: null,
  audioProducer: null,
  screenProducer: null,
  micOn,
  camOn,
  ...(isOwner ? { ownerId: roomId } : {}),
});
