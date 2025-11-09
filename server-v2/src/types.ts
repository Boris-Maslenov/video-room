import { Socket } from "socket.io";
import {
  Producer,
  Transport,
  Worker,
  Router,
  RtpCapabilities,
  DtlsParameters,
  RtpParameters,
  Consumer,
} from "mediasoup/node/lib/types";
import { TransportParams } from "./utils/webRtcUtils";

export type MediaKind = "audio" | "video";

export interface SocketResponse<T = null> {
  ok: boolean;
  data?: T;
  error?: { message: string };
}

export type CreateRoomReq = never;

export type DefaultRoomData = {
  peerId: string;
  roomId: string;
};

export type CreatePeerReq = {
  name: string;
  roomId: string;
  isOwner: boolean;
  micOn: boolean;
  camOn: boolean;
};

export type JoinRoomReq = {
  roomId: string;
  peerId: string;
  rtpCapabilities: RtpCapabilities;
};

export type MediaPeerData = Pick<
  Peer,
  "name" | "id" | "roomId" | "socketId" | "isJoined"
> & {
  producerIds: string[];
};

export type Source = "audio" | "video" | "screen";

type RemotePeer = {
  id: string;
  roomId: string;
  name: string;
  producersData: { producerId: string; source: Source }[];
  socketId: string;
  isJoined: boolean;
  status: "offline" | "connecting" | "online";
};

export type ClientEvents = {
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
    callback: (
      response: SocketResponse<{ peer: PeerDto; remotePeers: RemotePeer[] }>
    ) => void
  ) => void;
  getRouterRtpCapabilities: (
    data: { roomId: string },
    callback: (response: SocketResponse<RtpCapabilities>) => void
  ) => void;
  createSendTransport: (
    data: DefaultRoomData,
    callback: (
      response: SocketResponse<{ transportParams: TransportParams }>
    ) => void
  ) => void;
  createRecvTransport: (
    data: DefaultRoomData,
    callback: (
      response: SocketResponse<{ transportParams: TransportParams }>
    ) => void
  ) => void;
  connectSendTransport: (
    data: DefaultRoomData & { dtlsParameters: DtlsParameters },
    callback: (response: SocketResponse) => void
  ) => void;
  connectRecvTransport: (
    data: DefaultRoomData & {
      dtlsParameters: DtlsParameters;
      producerId: string;
    },
    callback: (response: SocketResponse) => void
  ) => void;
  produce: (
    data: DefaultRoomData & {
      kind: MediaKind;
      rtpParameters: RtpParameters;
      appData: { source: "audio" | "video" | "screen" };
    },
    callback: (response: SocketResponse<{ id: string }>) => void
  ) => void;
  createConsumer: (
    data: DefaultRoomData & {
      rtpCapabilities: RtpCapabilities;
      producerId: string;
      paused: boolean;
    },
    callback: (
      response: SocketResponse<{
        id: string;
        rtpParameters: RtpParameters;
        kind: MediaKind;
        producerId: string;
      }>
    ) => void
  ) => void;
  getPeers: (
    data: DefaultRoomData,
    callback: (response: SocketResponse<MediaPeerData[]>) => void
  ) => void;
  peerConnected: (
    data: DefaultRoomData,
    callback: (response: SocketResponse<null>) => void
  ) => void;
  camOff: (
    data: DefaultRoomData,
    callback: (response: SocketResponse<null>) => void
  ) => void;
  camOn: (
    data: DefaultRoomData,
    callback: (response: SocketResponse<null>) => void
  ) => void;
  screenOn: (
    data: DefaultRoomData,
    callback: (response: SocketResponse<null>) => void
  ) => void;
  screenOff: (
    data: DefaultRoomData,
    callback: (response: SocketResponse<null>) => void
  ) => void;
  endCall: (
    data: DefaultRoomData,
    callback: (response: SocketResponse<null>) => void
  ) => void;
  consumerPause: (
    data: DefaultRoomData & { consumerIds: string[] },
    callback: (response: SocketResponse<null>) => void
  ) => void;
  consumerResume: (
    data: DefaultRoomData & { consumerIds: string[] },
    callback: (response: SocketResponse<null>) => void
  ) => void;
  toggleMic: (
    data: DefaultRoomData & { micOn: boolean },
    callback: (response: SocketResponse<null>) => void
  ) => void;
};

export type ServerEvents = {
  "peer:camOff": (pId: string, prodId: string) => void;
  "peer:camOn": (pId: string, prodId: string) => void;
  "peer:screenOn": (p: string, screenProdId: string) => void;
  "peer:screenOff": (p: string, screenProdId: string) => void;
  "peer:ready": (pId: RemotePeer) => void;
  "peer:closed": (pId: string) => void;
  "peer:toggleMic": (pId: string, micOn: boolean) => void;
  "room:updateCount": (count: number) => void;
};

export type HandleParameters<T extends keyof ClientEvents> = [
  ...Parameters<ClientEvents[T]>,
  socket?: Socket<ClientEvents>
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

  videoProducer: ProducerType;
  audioProducer: ProducerType;
  screenProducer: ProducerType;

  sendTransport: TransportType;
  recvTransport: TransportType;

  micOn: boolean;
  camOn: boolean;
};

export type PeerDto = Omit<
  Peer,
  | "videoProducer"
  | "audioProducer"
  | "screenProducer"
  | "sendTransport"
  | "recvTransport"
>;

export type Room = {
  id: string;
  peers: Array<Peer>;
  ownerId?: string;
  createdAt: Date;
  worker: Worker;
  router: Router;
  consumers: Consumer<{ peerId: string }>[];
};

export type RoomDto = {
  id: string;
  ownerId?: string;
  createdAt: Date;
};
