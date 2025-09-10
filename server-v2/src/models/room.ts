import * as mediasoup from "mediasoup";
import { mediaCodecs } from "../config";
import { Room, Peer } from "../types";
import { rooms } from "../data/rooms";

/**
 * Coздает новую комнату c собственным роутером и воркером
 */

export const createRoom = async (): Promise<Room> => {
  try {
    const worker = await mediasoup.createWorker();
    const router = await worker.createRouter({ mediaCodecs });
    const ROOM_ID = "0";

    return {
      id: ROOM_ID,
      peers: [],
      createdAt: new Date(),
      worker,
      router,
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
