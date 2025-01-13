import { Consumer } from "mediasoup-client/lib/types";

export type KindType = "audio" | "video";

export type ProduserDataType = {
  roomId: string;
  peerId: string;
  peerName: string;
  id: string;
  kind: KindType;
  ioId: string;
};

export type MediaStreamDataType = {
  peerName: string;
  peerId: string;
  ioId: string;
  isCreator: boolean;
  isJoined: boolean;
  mediaTracks: MediaStreamTrack[];
  roomId: string;
  isSelf: boolean;
};

export type RoomDataType = {
  peerName: string;
  peerId: string;
  ioId: string;
  roomId: string;
};

export type RoomEventsType = {
  "room-connected": (roomData: RoomDataType) => void;
  "room-connecting": () => void;
  "update-peers": (mediaStreams: MediaStreamDataType[]) => void;
  "room-leave": () => void;
};

export type RoomEvents = keyof RoomEventsType;

export type ActiveConsumerType = Consumer<{ producerData: ProduserDataType }>;
