import * as mediasoup from "mediasoup";
import { Room, Peer } from "../types";
import { mediaCodecs } from "../config";
import { rooms } from "../data/rooms";

/**
 * Coздает новую комнату
 */
export const createRoom = async (): Promise<Room> => {
  try {
    const worker = await mediasoup.createWorker();
    const router = await worker.createRouter({ mediaCodecs });
    const roomId = "0";

    if (rooms.has(roomId)) {
      throw new Error(`Комната с id ${roomId} уже существует!`);
    }

    const newRoom: Room = {
      id: roomId,
      peers: new Map(),
      createdAt: new Date(),
      worker,
      router,
    };

    rooms.set(roomId, newRoom);

    return newRoom;
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }

    throw err;
  }
};
