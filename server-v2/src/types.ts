import { Socket } from "socket.io";
import { Producer, Transport, Worker, Router } from "mediasoup/node/lib/types";

export interface SocketResponse<T = null> {
  ok: boolean;
  data?: T;
  error?: { message: string };
}

export type SocketEvents = {
  createRoom: (
    data: unknown,
    callback: (response: SocketResponse<{ room: RoomDto }>) => void
  ) => void;
  createPeer: (
    data: { name: string; roomId: string; isOwner: boolean },
    callback: (response: SocketResponse<{ peer: PeerDto }>) => void
  ) => void;
};

export type HandleParameters<T extends keyof SocketEvents> = [
  ...Parameters<SocketEvents[T]>,
  socket?: Socket<SocketEvents>
];

export type MediaState = Record<"cam" | "mic" | "screen", boolean>;

type ProducerType = Producer | null;
type TransportType = Transport | null;

export type Peer = {
  id: string;
  roomId: string;
  socketId: string;
  name: string;
  isJoined: boolean; // вошел в комнату
  // isMediaReady: boolean; // может транслировать медиа
  // isOnline: boolean; // есть связь
  mediaState: MediaState | null;
  videoProducer: ProducerType;
  audioProducer: ProducerType;
  // screenProducer: null;
  sendTransport: TransportType;
  recvTransport: TransportType;
};

export type PeerDto = Omit<
  Peer,
  "videoProducer" | "audioProducer" | "sendTransport" | "recvTransport"
>;

export type Room = {
  id: string;
  peers: Map<string, Peer>;
  ownerId?: string;
  createdAt: Date;
  worker: Worker;
  router: Router;
};

export type RoomDto = {
  id: string;
  ownerId?: string;
  createdAt: Date;
};
