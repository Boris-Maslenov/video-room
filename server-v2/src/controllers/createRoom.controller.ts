import { HandleParameters, Peer } from "../types";
import { createRoomService } from "../services/room.service";
import { log, pick } from "../utils/dataUtils";
import { findProducer, getRoom } from "../models/room";
import { Socket } from "socket.io";

/**
 * Создает новую комнату.
 */
export const createRoom: (
  ...args: HandleParameters<"createRoom">
) => Promise<void> = async function (this: Socket, _, callback) {
  try {
    const socket = this;
    const io = socket.nsp.server;
    const room = await createRoomService();

    room.audioObserver.on("volumes", (volumes) => {
      const r = getRoom(room.id);
      const volumeData = volumes;
      const volumeProducerIds = volumeData.map((v) => v.producer.id);
      const speakers = [] as Peer[];

      r.peers.forEach((p) => {
        if (volumeProducerIds.includes(p.audioProducer.id)) {
          speakers.push(p);
        }
      });

      const speakerIds = speakers.map((p) => p.id);
      const ids = r.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0) {
        io.to(ids).emit("room:activeSpeaker", speakerIds);
      }
    });
    callback?.({
      ok: true,
      data: {
        ...pick(room, ["id", "createdAt"]),
      },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: err?.message ?? "Ошибка создания комнаты!" },
    });
  }
};
