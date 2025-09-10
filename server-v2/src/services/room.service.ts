import { rooms } from "../data/rooms";
import { createRoom } from "../models/room";
import { RtpCapabilities } from "mediasoup/node/lib/rtpParametersTypes";
import { getRoom, updatePeer, getPeer } from "../models/room";

export const createRoomService = async () => {
  const room = await createRoom();
  if (rooms.has(room.id)) {
    throw new Error(`Комната с id ${room.id} уже существует!`);
  }
  rooms.set(room.id, room);
  return room;
};

export const joinRoomService = (
  roomId: string,
  peerId: string,
  rtpCapabilities: RtpCapabilities
) => {
  const peer = getPeer(roomId, peerId);
  const updatedPeer = { ...peer, isJoined: true, rtpCapabilities };
  updatePeer(roomId, updatedPeer);
  return { room: getRoom(roomId), peer: updatedPeer };
};
