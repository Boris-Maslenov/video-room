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

export type CreateRoomReq = never;

export type CreatePeerReq = {
  name: string;
  roomId: string;
  isOwner: boolean;
};

export type JoinRoomReq = {
  roomId: string;
  peerId: string;
  rtpCapabilities: RtpCapabilities;
};

export type SocketEvents = {
  createRoom: (
    data: CreateRoomReq,
    callback: (response: SocketResponse<RoomDto>) => void
  ) => void;
  createPeer: (
    data: CreatePeerReq,
    callback: (response: SocketResponse<PeerDto>) => void
  ) => void;
  joinRoom: (
    data: JoinRoomReq,
    callback: (response: SocketResponse<PeerDto>) => void
  ) => void;
  getRouterRtpCapabilities: (
    data: { roomId: string },
    callback: (response: SocketResponse<RtpCapabilities>) => void
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
  rtpCapabilities: RtpCapabilities | null;
  isJoined: boolean;
  mediaState: MediaState | null;

  videoProducer: ProducerType;
  audioProducer: ProducerType;

  sendTransport: TransportType;
  recvTransport: TransportType;

  // isMediaReady: boolean; // может транслировать медиа
  // isOnline: boolean; // есть связь
  // screenProducer: null;
};

export type PeerDto = Omit<
  Peer,
  "videoProducer" | "audioProducer" | "sendTransport" | "recvTransport"
>;

export type Room = {
  id: string;
  peers: Array<Peer>;
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
