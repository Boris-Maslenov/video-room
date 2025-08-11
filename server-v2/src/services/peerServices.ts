import { Peer } from "../types";
import { randomUUID } from "crypto";

export const createPeer = (
  name: string,
  roomId: string,
  socketId: string
): Peer => {
  return {
    id: randomUUID(),
    roomId,
    name,
    socketId,
    isJoined: false,
    mediaState: null,
    videoProducer: null,
    audioProducer: null,
    sendTransport: null,
    recvTransport: null,
  };
};
