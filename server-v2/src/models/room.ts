import * as mediasoup from "mediasoup";
import { mediaCodecs, ROOM_ID } from "../config";
import { Room, Peer } from "../types";
import { rooms } from "../data/rooms";
import { Producer } from "mediasoup/node/lib/ProducerTypes";

/**
 * Coздает новую комнату c собственным роутером и воркером
 */
export const createRoom = async (): Promise<Room> => {
  try {
    const worker = await mediasoup.createWorker();
    const router = await worker.createRouter({ mediaCodecs });
    const audioLevelObserver = await router.createAudioLevelObserver({
      maxEntries: 3,
      threshold: -55,
      interval: 800,
    });

    return {
      id: ROOM_ID,
      peers: [],
      createdAt: new Date(),
      worker,
      router,
      consumers: [],
      audioObserver: audioLevelObserver,
    };
  } catch (err) {
    throw err;
  }
};

/**
 * Возвращает комнату
 */
export const getRoom = (id: string) => {
  if (!rooms.has(id)) {
    throw new Error(`getRoom: Комната ${id} не найдена`);
  }

  return rooms.get(id);
};

export const updateRoom = (room: Room) => {
  if (!rooms.has(room.id)) {
    throw new Error(`updateRoom: Комната ${room.id} не найдена`);
  }

  rooms.set(room.id, room);
};

/**
 * Получить пира
 */
export const getPeer = (roomId: string, peerId: string): Peer => {
  const room = getRoom(roomId);
  const foundPeer = room.peers.find(({ id }) => id === peerId);
  if (!foundPeer) {
    throw new Error(`Пир ${peerId} не найден в комнате ${roomId}`);
  }
  return foundPeer;
};

/**
 * Найти пира поего soscketId
 */
export const findPeerBySocketId = (socketId: string): Peer | undefined => {
  const allPeers = Array.from(rooms.values()).flatMap((r) => r.peers);
  return allPeers.find((p) => p.socketId === socketId);
};

/**
 * Добавление пира в комнату
 */
export const addPeer = (roomId: string, peer: Peer) => {
  const room = getRoom(roomId);
  room.peers = room.peers.concat(peer);
};

/**
 * Обновление пира в комнате
 */
export const updatePeer = (roomId: string, peer: Peer) => {
  const room = getRoom(roomId);
  const peerIndex = room.peers.findIndex(({ id }) => peer.id === id);
  room.peers[peerIndex] = peer;
};

/**
 * Удаление пира из комнаты
 */
export const deletePeer = (roomId: string, peerId: string) => {
  const room = getRoom(roomId);
  room.peers = room.peers.filter(({ id }) => peerId !== id);
};

/**
 * Вернет всех продюсеров в комнате
 */
export const getAllProducers = (roomId: string): Producer[] => {
  const room = getRoom(roomId);
  return room.peers.reduce((acc, cur) => {
    acc.push(
      ...[cur.audioProducer, cur.videoProducer, cur.screenProducer].filter(
        Boolean
      )
    );

    return acc;
  }, []);
};

/**
 * Поиск продюсера по id, когда неизвестно к какому пиру он принадлежит
 */
export const findProducer = (
  roomId: string,
  producerId: string
): Producer | null => {
  const room = getRoom(roomId);
  let result = null;

  for (const peer of room.peers) {
    const found = [
      peer.audioProducer,
      peer.videoProducer,
      peer.screenProducer,
    ].find(({ id }) => id === producerId);
    if (found) {
      result = found;
      break;
    }
  }

  return result;
};
