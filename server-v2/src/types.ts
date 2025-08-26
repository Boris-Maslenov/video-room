import { Socket } from "socket.io";
import {
  Producer,
  Transport,
  Worker,
  Router,
  RtpCapabilities,
  DtlsParameters,
  RtpParameters,
} from "mediasoup/node/lib/types";
import { TransportParams } from "./utils/webRtcUtils";

export type MediaKind = "audio" | "video";

export interface SocketResponse<T = null> {
  ok: boolean;
  data?: T;
  error?: { message: string };
}

export type CreateRoomReq = unknown;

export type CreatePeerReq = {
  name: string;
  roomId: string;
  socketId: string;
  isOwner: boolean;
};

export type SocketEvents = {
  createRoom: (
    data: CreateRoomReq,
    callback: (response: SocketResponse<{ room: RoomDto }>) => void
  ) => void;
  createPeer: (
    data: CreatePeerReq,
    callback: (response: SocketResponse<{ peer: PeerDto }>) => void
  ) => void;
  joinPeer: (
    data: { id: string },
    callback: (response: SocketResponse<{ peer: PeerDto }>) => void
  ) => void;
  getRouterRtpCapabilities: (
    data: { roomId: string },
    callback: (
      response: SocketResponse<{ rtpCapabilities: RtpCapabilities }>
    ) => void
  ) => void;
  createSendTransport: (
    data: { peerId: string },
    callback: (
      response: SocketResponse<{ transportParams: TransportParams }>
    ) => void
  ) => void;
  connectSendTransport: (
    data: { dtlsParameters: DtlsParameters; peerId: string },
    callback: (
      response: SocketResponse<{ dtsParameters: TransportParams }>
    ) => void
  ) => void;
  produce: (
    data: { peerId: string; kind: MediaKind; rtpParameters: RtpParameters },
    callback: (response: SocketResponse<{ id: string }>) => void
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
