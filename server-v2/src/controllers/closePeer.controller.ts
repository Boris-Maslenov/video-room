import { Socket } from "socket.io";
import { deletePeer, findPeerBySocketId, getRoom } from "../models/room";
import { safeClose } from "../utils/mediaUtils";

/**
 * Неожиданный обрыв сокета
 */
export const closePeer: (socket: Socket) => boolean = (socket) => {
  try {
    const { id } = socket;
    const foundPeer = findPeerBySocketId(id);

    if (!foundPeer) {
      return false;
    }

    const room = getRoom(foundPeer.roomId);

    if (!room) {
      throw new Error("closePeerController error: room not found");
    }

    safeClose(
      foundPeer.audioProducer,
      foundPeer.videoProducer,
      foundPeer.screenProducer,
      foundPeer.sendTransport,
      foundPeer.recvTransport
    );

    room.consumers = room.consumers
      .map((c) => {
        c.appData.peerId === foundPeer.id && safeClose(c);
        return c;
      })
      .filter((c) => c.appData.peerId !== foundPeer.id);

    deletePeer(room.id, foundPeer.id);

    const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

    if (ids.length > 0) {
      socket.to(ids).emit("peer:closed", foundPeer.id);
      socket.to(ids).emit("room:updateCount", ids.length);
    }
  } catch (err) {
    console.log(err);
  }
};
