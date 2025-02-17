import { Consumer } from "mediasoup-client/lib/types";

export type KindType = "audio" | "video";

export type RoomDataType = {
  roomId: string;
  peerName: string;
  peerId: string;
  ioId: string;
};

export type ProduserDataType = RoomDataType & {
  id: string;
  kind: KindType;
  // TODO: экспериментальные поля
  mediaState: MediaStateType;
};

export type MediaSlotDataType = Pick<
  ProduserDataType,
  "roomId" | "peerName" | "peerId" | "ioId" | "mediaState"
> & {
  isCreator?: boolean;
  isJoined?: boolean;
  isSelf?: boolean;
  mediaStream: MediaStream;
};

export type RoomEventsType = {
  "room-connected": (
    roomData: RoomDataType,
    mediaSlots: MediaSlotDataType[]
  ) => void;
  "room-disconnected": () => void;
  "room-connecting": () => void;
  "update-peers": (mediaSlots: MediaSlotDataType[]) => void;
  "room-leave": () => void;
  error: (error: Error) => void;
};

export type RoomEvents = keyof RoomEventsType;

export type ActiveConsumerType = Consumer<{ producerData: ProduserDataType }>;

export type MediaStateType = Record<"micOn" | "camOn" | "screenOn", boolean>;
