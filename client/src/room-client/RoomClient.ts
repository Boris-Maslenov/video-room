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
  RoomEvents,
  RoomEventsType,
  ActiveConsumerType,
  MediaSlotDataType,
  MediaStateType,
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
      mediaState: MediaStateType;
    };
    activeProducersData: ProduserDataType[];
    [key: string]: unknown;
  };
  type: string;
};

const mediaStateDefault: MediaStateType = {
  micOn: true,
  camOn: true,
  screenOn: false,
};

/**
 * Класс реализует полную логику подключения к комнате.
 * Взаимодействует с приложением через подписки на события.
 */

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
  localMediaState: MediaStateType;

  constructor() {
    this.localMediaState = mediaStateDefault;
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

    socket.on("connect_error", (error) => {
      this.leaveRoom();
      // TODO: добавить событие disconnect
      this.subscribe("error", error);
    });

    socket.on("connect_timeout", (error) => {
      this.leaveRoom();
      // TODO: добавить событие disconnect
      this.subscribe("error", error);
    });

    socket.on("server-event", async (response: ServerEventsType) => {
      console.log("new server-event");
      switch (response.type) {
        case "connect-peer": {
          // TODO: оптимизировать это решение!
          if (!this.recvTransport) {
            await this.createRecvTransport();
          }

          for (const producerData of response.data.activeProducersData) {
            await this.createConsumer(producerData);
          }

          this.addSlot(response.data.peer.id);
          this.subscribe("update-peers", this.mediaSlots);

          break;
        }
        case "disconnect-peer": {
          this.deleteSlot(response.data.peer.id);
          this.subscribe("update-peers", this.mediaSlots);

          break;
        }
        case "device-change-state": {
          const newMediaState = response.data.peer.mediaState;

          if (newMediaState.camOn === false) {
            // Отключение камеры
            this.activeConsumers = this.activeConsumers
              .map((consumer) => {
                if (
                  consumer.kind === "video" &&
                  consumer.appData.producerData.peerId === response.data.peer.id
                ) {
                  consumer.close();
                }
                return consumer;
              })
              .filter((consumer) => {
                if (
                  consumer.kind === "video" &&
                  consumer.appData.producerData.peerId === response.data.peer.id
                ) {
                  return false;
                }
                return true;
              });

            console.log(
              "Удалили все связанные консюмеры",
              this.activeConsumers
            );
          }

          this.mediaSlots = this.mediaSlots.map((slot) => {
            if (slot.peerId === response.data.peer.id) {
              return {
                ...slot,
                mediaState: newMediaState,
              };
            }
            return slot;
          });
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
  private async getProducers(roomId: string) {
    return await socketSend<ProduserDataType[]>("getProducers", {
      roomId,
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
        // kind берется из медитрека
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
      isSelf: true,
      mediaStream: new MediaStream(this.localMediaStream.getTracks()),
      roomId: this.roomData.roomId,
      mediaState: this.localMediaState,
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
          mediaState: current.appData.producerData.mediaState,
        };
      }
      return acc;
    }, {} as MediaSlotDataType);
  }

  private deleteSlot(id: string) {
    this.activeConsumers = this.activeConsumers?.filter(
      (consumer) => consumer.appData.producerData.peerId !== id
    );

    this.mediaSlots = this.mediaSlots.filter((slot) => slot.peerId !== id);
  }

  /**
   * Cоздает слот для peer
   */
  private addSlot(peerId: string) {
    const consumers = this.activeConsumers.filter(
      (consumer) => consumer.appData.producerData.peerId === peerId
    );

    if (consumers.length === 0) return;

    // Слоты создаются на основании как минимум 1 консюмера
    let slot = this.createSlotFromConsumers(consumers);

    if (slot) {
      this.mediaSlots = this.mediaSlots.concat(slot);
    }
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
  async createRecvTransport() {
    if (!this.device || !(this.roomData?.roomId && this.roomData?.peerId))
      return;

    const transportOptions = await socketSend<TransportOptions>(
      "createConsumerTransport",
      {
        appData: { roomId: this.roomData.roomId, peerId: this.roomData.peerId },
      }
    );

    this.recvTransport = this.device.createRecvTransport(transportOptions);
    this.connectRecvTransport();
  }

  /**
   * Подключение
   */
  async connectRecvTransport(): Promise<string | undefined> {
    if (!this.recvTransport || !(this.roomData?.roomId && this.roomData.peerId))
      return;
    // Событие автоматически генерируется mediasoup-client, когда требуется передать DTLS параметры на сервер.
    this.recvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketSend("connectConsumerTransport", {
            transportId: this.recvTransport!.id,
            dtlsParameters,
            appData: {
              roomId: this.roomData!.roomId,
              peerId: this.roomData!.peerId,
            },
          });
          // сервер подтвердил соединение
          callback();
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
            return;
          }
          console.error(error);
        }
      }
    );
    try {
      return await new Promise((res, rej) => {
        if (!this.recvTransport) {
          rej("recvTransport не готов");
          return;
        }

        this.recvTransport.on("connectionstatechange", (state) => {
          if (state === "connected") {
            res("connected");
          }
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        this.subscribe("error", error);
        return;
      }
      console.error(error);
    }
  }

  /**
   * Создает Consumers
   */
  async createConsumer(producerData: ProduserDataType) {
    if (!this.device || !this.recvTransport) return;
    const { rtpCapabilities } = this.device;

    try {
      if (!producerData.id)
        throw new Error("Consumer не может быть создан без Producer id.");

      const { roomId } = producerData;

      if (roomId !== this.roomData?.roomId) {
        throw new Error("При создании Consumer  несовпадение id комнат.");
      }

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
        const audioConsumer = await this.recvTransport.consume({
          id,
          rtpParameters,
          producerId,
          kind,
          appData,
        });

        this.activeConsumers.push(audioConsumer as ActiveConsumerType);
      }

      if (kind === "video") {
        const videoConsumer = await this.recvTransport.consume({
          id,
          rtpParameters,
          producerId,
          kind,
          appData,
        });

        this.activeConsumers.push(videoConsumer as ActiveConsumerType);
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
  async produce(roomId: string, peerId: string): Promise<boolean | undefined> {
    if (!this.device) {
      await this.loadDevice();
    }

    await this.createProducerTransport(roomId, peerId);

    if (!this.sendTransport) {
      return Promise.reject(false);
    }

    try {
      const { audioTrack, videoTrack } = await this.getMediaTracks();

      const promiseResult = new Promise<boolean>((res, rej) => {
        this.sendTransport!.on("connectionstatechange", (state) => {
          if (state === "connected") {
            this.addSelfSlot();
            this.subscribe("room-connected", this.roomData!, this.mediaSlots!);
            res(true);
          }

          if (state === "disconnected" || state === "failed") {
            rej(new Error(state));
          }
        });
      });

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

      return promiseResult;
    } catch (error) {
      console.log("catch", error);
      if (error instanceof Error) {
        this.subscribe("error", error);
      }
    }
  }

  async videoStartStop() {
    if (!this.videoProducer) {
      // TODO: создание нового videoProducer
    } else {
      this.videoProducer.close();
      this.videoProducer = undefined;
      this.localMediaState.camOn = false;

      await socketSend("device-change-state", {
        roomId: this.roomData!.roomId,
        peerId: this.roomData!.peerId,
        mediaState: this.localMediaState,
      });
    }
  }

  async audioStartStop() {
    if (!this.audioProducer) return;

    if (this.audioProducer.paused) {
      this.audioProducer.resume();
      this.localMediaState.micOn = true;
    } else {
      this.audioProducer.pause();
      this.localMediaState.micOn = false;
    }

    this.mediaSlots = this.mediaSlots.map((slot) => {
      if (slot.isSelf) {
        slot.mediaState = this.localMediaState;
        return slot;
      }
      return slot;
    });

    this.subscribe("update-peers", this.mediaSlots);

    await socketSend("device-change-state", {
      roomId: this.roomData!.roomId,
      peerId: this.roomData!.peerId,
      mediaState: this.localMediaState,
    });
  }

  /**
   * Подписка на события продюсера
   */
  // async subscribeEventsProducer(producer: Producer) {
  //   if (!producer) return;
  //   producer.on("trackended", () => {
  //     console.log("Track ended, stopping producer.");
  //   });

  //   producer.on("transportclose", () => {
  //     console.log("Transport was closed, producer will be destroyed.");
  //   });
  // }

  /**
   * Прием медиа потока (подписка на все продюсеры, кроме своего)
   */
  async consume(roomId: string) {
    if (!this.device) {
      await this.loadDevice();
    }

    await this.createRecvTransport();
    const activeProducersData = await this.getProducers(roomId);

    for (const producerData of activeProducersData) {
      if (producerData.peerId !== this.roomData?.peerId) {
        await this.createConsumer(producerData);
      }
    }

    /**
     * У каждого пира может быть несколько продюсеров, сначало определим id пиров,
     * далее для каждого пира создадим слот на основании его консюмеров
     */
    this.activeConsumers
      .reduce<string[]>((acc, currnt) => {
        if (acc.includes(currnt.appData.producerData.peerId)) return acc;

        acc.push(currnt.appData.producerData.peerId);
        return acc;
      }, [])
      .forEach((peerId) => {
        this.addSlot(peerId);
      });

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

      const produceRes = await this.produce(
        this.roomData.roomId,
        this.roomData.peerId
      );

      if (!produceRes) return;

      await socketSend<boolean>("joined", {
        peerId: this.roomData.peerId,
        roomId: this.roomData.roomId,
      });

      await this.consume(this.roomData.roomId);

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
    const roomData = await this.createNewRoom(peerName);

    if (roomData?.peerId && roomData.roomId) {
      await this.produce(roomData.roomId, roomData.peerId);
    }
  }

  async leaveRoom() {
    this.localMediaStream = undefined;
    this.roomData = undefined;
    this.device = undefined;
    this.sendTransport?.close();
    this.sendTransport = undefined;
    this.recvTransport?.close();
    this.recvTransport = undefined;
    this.videoProducer?.close();
    this.videoProducer = undefined;
    this.audioProducer?.close();
    this.audioProducer = undefined;
    this.activeConsumers = [];
    this.mediaSlots = [];
  }

  async deletePeer() {
    try {
      await socketSend<boolean>("deletePeer", {
        roomId: this.roomData?.roomId,
        ioId: this.roomData?.ioId,
      });
      this.localMediaStream?.getTracks().forEach((track) => track.stop());
      this.leaveRoom();
      this.subscribe("room-disconnected");
    } catch (e) {
      console.log(e);
    }
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
