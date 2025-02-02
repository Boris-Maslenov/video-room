import { Device } from "mediasoup-client";
import {
  RtpCapabilities,
  Transport,
  TransportOptions,
  ConsumerOptions,
  Producer,
} from "mediasoup-client/lib/types";
import {
  ProduserDataType,
  RoomDataType,
  MediaStreamDataType,
  RoomEvents,
  RoomEventsType,
  ActiveConsumerType,
  MediaSlotDataType,
} from "./types";
import { socket, apiSend as socketSend } from "../api/api";

type ServerEventsType = {
  message: string;
  data: {
    peer: {
      id: string;
      ioId: string;
      isJoined: boolean;
      name: string;
      recvTransport: Transport;
      roomId: string;
    };
    activeProducersData: ProduserDataType[];
  };
  type: string;
};

class RoomClient {
  events: { [K in keyof RoomEventsType]?: RoomEventsType[K] };
  localMediaStream?: MediaStream;
  roomData?: RoomDataType;
  device?: Device;
  sendTransport?: Transport;
  recvTransport?: Transport;
  videoProducer?: Producer;
  audioProducer?: Producer;
  activeConsumers: ActiveConsumerType[];
  mediaSlots: MediaSlotDataType[];

  constructor() {
    this.localMediaStream;
    this.roomData;
    this.device;
    this.sendTransport;
    this.recvTransport;
    this.videoProducer;
    this.audioProducer;
    this.activeConsumers = [];
    this.events = {};
    this.mediaSlots = [];

    socket.on("server-event", async (response: ServerEventsType) => {
      switch (response.type) {
        case "connect-peer": {
          // TODO: оптимизировать это решение!
          if (!this.recvTransport) {
            await this.createRecvTransport(
              this.roomData!.roomId,
              this.roomData!.peerId
            );

            this.connectRecvTransport(
              this.roomData!.roomId,
              this.roomData!.peerId
            );
          }

          for (const p of response.data.activeProducersData) {
            await this.createConsumer(p);
          }

          this.addSlot(response.data.peer.id);
          this.subscribe("update-peers", this.mediaSlots.concat());

          break;
        }
        case "disconnect-peer": {
          console.log("disconnect-peer:", response);
          this.activeConsumers = this.activeConsumers?.filter(
            (consumer) =>
              consumer.appData.producerData.peerId !== response.data.peer.id
          );
          this.deleteSlot(response.data.peer.id);
          this.subscribe("update-peers", this.mediaSlots);

          break;
        }
        default: {
          return "";
        }
      }
    });
  }

  /**
   * Запросить список активных продюсеров (включая свой собственный) в пределах 1 комнаты
   */
  private async getProducers(roomId: string, peerId: string) {
    return await socketSend<ProduserDataType[]>("getProducers", {
      roomId,
      peerId,
    });
  }

  /**
   * Запрос RTP возможностей у роутера
   */
  async gerRouterRtpCapabilites() {
    return await socketSend<RtpCapabilities>("getRouterRtpCapabilities");
  }

  /**
   * Инициализация Device
   */
  async loadDevice() {
    if (this.device) return;

    this.device = new Device();

    try {
      const routerRtpCapabilities = await this.gerRouterRtpCapabilites();
      if (!this.device.loaded) {
        await this.device.load({ routerRtpCapabilities });
      }
    } catch (error) {
      if (error instanceof Error) {
        this.subscribe("error", error);
      }
    }
  }

  /**
   * Создание Producer Transport
   */
  async createProducerTransport(roomId: string, peerId: string) {
    if (!this.device) return;

    const params = await socketSend<TransportOptions>(
      "createProducerTransport",
      { appData: { roomId, peerId } }
    );

    this.sendTransport = this.device.createSendTransport(params);

    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketSend("connectProducerTransport", {
            dtlsParameters,
            appData: {
              roomId,
              peerId,
            },
          });
          callback();
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
          }
        }
      }
    );

    this.sendTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, errback) => {
        // appData передаем в sendTransport.produce()
        try {
          const data = await socketSend<{ id: string }>("createProducer", {
            kind,
            rtpParameters,
            appData,
          });
          callback(data);
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
          }
        }
      }
    );
  }

  private addSelfSlot() {
    if (!this.roomData || !this.localMediaStream) return;

    const selfMediaSlot = {
      peerName: this.roomData.peerName,
      peerId: this.roomData.peerId,
      ioId: this.roomData.ioId,
      isCreator: false,
      isJoined: true,
      isSelf: true,
      mediaStream: new MediaStream(this.localMediaStream.getVideoTracks()),
      roomId: this.roomData.roomId,
    };

    this.mediaSlots = this.mediaSlots.concat(selfMediaSlot);
  }

  private createSlotFromConsumers(
    consumers: ActiveConsumerType[],
    isSelf = false
  ): MediaSlotDataType | undefined {
    if (!consumers?.length) return;

    return consumers.reduce((acc, current) => {
      if (acc?.peerId) {
        acc.mediaStream.addTrack(current.track);
      } else {
        acc = {
          peerName: current.appData.producerData.peerName,
          peerId: current.appData.producerData.peerId,
          ioId: current.appData.producerData.ioId,
          isCreator: false,
          isJoined: true,
          roomId: current.appData.producerData.roomId,
          isSelf,
          mediaStream: new MediaStream([current.track]),
        };
      }
      return acc;
    }, {} as MediaSlotDataType);
  }

  private deleteSlot(id: string) {
    this.mediaSlots = this.mediaSlots.filter((slot) => slot.peerId !== id);
  }

  private addSlot(id: string) {
    const consumers = this.activeConsumers.filter(
      (consumer) => consumer.appData.producerData.peerId === id
    );

    if (consumers.length) {
      const slot = this.createSlotFromConsumers(consumers);
      slot && this.mediaSlots.push(slot);
    }
  }

  private fillSlots(data: ActiveConsumerType[]) {
    const ids = data.reduce<string[]>((acc, currnt) => {
      if (acc.includes(currnt.appData.producerData.peerId)) {
        return acc;
      }
      acc.push(currnt.appData.producerData.peerId);
      return acc;
    }, []);

    ids.forEach((id) => {
      this.addSlot(id);
    });
  }

  /**
   * Получить медиа Трэки
   */
  async getMediaTracks() {
    if (!this.localMediaStream) {
      this.localMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    }

    const tracks = {
      videoTrack: this.localMediaStream.getVideoTracks()[0].clone(),
      audioTrack: this.localMediaStream.getAudioTracks()[0].clone(),
    };

    return tracks;
  }

  /**
   * Создает consume транспорт
   */
  async createRecvTransport(roomId: string, peerId: string) {
    if (!this.device) return;

    const transportOptions = await socketSend<TransportOptions>(
      "createConsumerTransport",
      { appData: { roomId, peerId } }
    );

    this.recvTransport = this.device.createRecvTransport(transportOptions);
  }

  /**
   * Подключение
   */
  async connectRecvTransport(
    roomId: string,
    peerId: string
  ): Promise<string | undefined> {
    if (!this.recvTransport) return;
    // Событие автоматически генерируется mediasoup-client, когда требуется передать DTLS параметры на сервер.
    this.recvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketSend("connectConsumerTransport", {
            transportId: this.recvTransport!.id,
            dtlsParameters,
            appData: { roomId, peerId },
          });
          // сервер подтвердил соединение
          callback();
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
          }
        }
      }
    );

    return await new Promise((res, rej) => {
      if (!this.recvTransport) {
        rej("recvTransport не готов");
        return;
      }

      this.recvTransport.on("connectionstatechange", async (state) => {
        if (state === "connected") {
          res("connected");
        }
      });
    });
  }

  /**
   * Создает Consumers
   */
  async createConsumer(producerData: ProduserDataType) {
    if (!this.device || !this.recvTransport) return;

    const { roomId } = producerData;
    const { rtpCapabilities } = this.device;

    try {
      const { id, rtpParameters, kind, producerId, appData } =
        await socketSend<ConsumerOptions>("createConsumer", {
          rtpCapabilities,
          appData: {
            roomId,
            peerId: this.roomData?.peerId,
            producerId: producerData.id,
            mediaTag: producerData.kind,
            producerData,
          },
        });

      if (kind === "audio") {
        const audioConsumer = await this.recvTransport!.consume({
          id,
          rtpParameters,
          producerId,
          kind,
          appData,
        });

        this.activeConsumers?.push(audioConsumer as ActiveConsumerType);
      }

      if (kind === "video") {
        const videoConsumer = await this.recvTransport!.consume({
          id,
          rtpParameters,
          producerId,
          kind,
          appData,
        });

        this.activeConsumers?.push(videoConsumer as ActiveConsumerType);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.subscribe("error", error);
      }
    }
  }

  /**
   * Отправка Медиа потока в комнату
   */
  async produce(roomId: string, peerId: string): Promise<boolean> {
    if (!this.device) {
      await this.loadDevice();
    }

    await this.createProducerTransport(roomId, peerId);

    if (!this.sendTransport) {
      return false;
    }

    try {
      const { audioTrack, videoTrack } = await this.getMediaTracks();

      this.audioProducer = await this.sendTransport.produce({
        track: audioTrack,
        appData: {
          mediaTag: "audio",
          peerId,
          roomId,
        },
      });

      this.videoProducer = await this.sendTransport.produce({
        track: videoTrack,
        appData: {
          mediaTag: "video",
          peerId,
          roomId,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.subscribe("error", error);
      }
    }

    return await new Promise((res) => {
      this.sendTransport!.on("connectionstatechange", (state) => {
        if (state === "connected") {
          this.addSelfSlot();
          this.subscribe("room-connected", this.roomData!);
          res(true);
        }
      });
    });
  }

  /**
   * Подписка на события продюсера
   */
  async subscribeEventsProducer(producer: Producer) {
    if (!producer) return;
    producer.on("trackended", () => {
      console.log("Track ended, stopping producer.");
    });

    producer.on("transportclose", () => {
      console.log("Transport was closed, producer will be destroyed.");
    });
  }

  /**
   * Прием медиа потока (подписка на все продюсеры, кроме своего)
   */
  async consume(roomId: string, peerId: string) {
    if (!this.device) {
      await this.loadDevice();
    }

    await this.createRecvTransport(roomId, peerId);
    const activeProducersData = await this.getProducers(roomId, peerId);

    this.connectRecvTransport(roomId, peerId);

    for (const producerData of activeProducersData) {
      if (producerData.peerId !== this.roomData?.peerId) {
        await this.createConsumer(producerData);
      }
    }
    this.fillSlots(this.activeConsumers);
    this.subscribe("update-peers", this.mediaSlots.concat());
  }

  /**
   * Точка входа в комнату
   */
  async joinToRoom(peerName: string, roomId: string) {
    if (!peerName || !roomId)
      throw new Error(
        "Для входа в комнату нужно указать id комнаты и имя абонента!"
      );
    try {
      const roomData = await socketSend<RoomDataType>("createPeer", {
        peerName,
        roomId,
      });

      this.roomData = roomData;

      if (!this.roomData) return;

      await this.produce(this.roomData.roomId, this.roomData.peerId);

      await socketSend<boolean>("joined", {
        peerId: this.roomData.peerId,
        roomId: this.roomData.roomId,
      });

      await this.consume(this.roomData.roomId, this.roomData.peerId);

      return this.roomData;
    } catch (error) {
      if (error instanceof Error) {
        this.subscribe("error", error);
      }
    }
  }

  private async createNewRoom(
    peerName: string
  ): Promise<RoomDataType | undefined> {
    try {
      const response = await socketSend<RoomDataType>("createRoom", {
        peerName,
      });
      this.roomData = response;
    } catch (error) {
      if (error instanceof Error) {
        this.subscribe("error", error);
      }
    }

    return this.roomData;
  }

  /**
   * Точка входа в комнату
   */
  async createAndJoinRoom(peerName: string) {
    if (!peerName)
      throw new Error("Для входа в комнату нужно задать имя участника!");

    this.subscribe("room-connecting");
    await this.createNewRoom(peerName);

    if (this.roomData?.roomId && this.roomData?.peerId) {
      await this.produce(this.roomData?.roomId, this.roomData?.peerId);
    }
  }

  async leaveRoom() {
    this.localMediaStream = undefined;
    this.roomData = undefined;
    this.device = undefined;
    this.sendTransport = undefined;
    this.recvTransport = undefined;
    this.videoProducer = undefined;
    this.audioProducer = undefined;
    this.activeConsumers = [];
    this.mediaSlots = [];
  }

  on<K extends keyof RoomEventsType>(
    event: K,
    callback: RoomEventsType[K]
  ): void {
    this.events[event] = callback;
  }

  subscribe(
    event: RoomEvents,
    ...args: Parameters<RoomEventsType[RoomEvents]>
  ) {
    const callback = this.events[event] as (
      ...args: Parameters<RoomEventsType[RoomEvents]>
    ) => void;

    if (callback) {
      callback(...args);
    }
  }
}

export default RoomClient;

// const combinedStream = new MediaStream();
// combinedStream.addTrack(this.videoConsumer!.track);
// combinedStream.addTrack(this.audioConsumer!.track);
// const el = document.querySelector("#video2") as HTMLVideoElement;
// el.srcObject = combinedStream;
