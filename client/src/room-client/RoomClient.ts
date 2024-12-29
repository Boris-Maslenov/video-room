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
  MediaStreamData,
  RoomEvents,
  RoomEventsType,
  ActiveConsumerType,
} from "./types";
import { socket, apiSend as socketSend } from "../api/api";

socket.on("message", (message) => {
  console.log("Получено сообщение:", message);
});

class RoomClient {
  events: Partial<Record<RoomEvents, RoomEventsType[RoomEvents]>>;
  localMediaStream?: MediaStream;
  roomData?: RoomDataType;
  device?: Device;
  sendTransport?: Transport;
  recvTransport?: Transport;
  videoProducer?: Producer;
  audioProducer?: Producer;
  activeProducersData?: ProduserDataType[];
  activeConsumers?: ActiveConsumerType[];

  constructor() {
    this.localMediaStream;
    this.roomData;
    this.device;
    this.sendTransport;
    this.recvTransport;
    this.videoProducer;
    this.audioProducer;
    this.activeProducersData = [];
    this.activeConsumers = [];
    this.events = {};
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
      await this.device.load({ routerRtpCapabilities });
    } catch (e) {
      console.error(e);
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
        } catch (e) {
          if (e instanceof Error) {
            errback(e);
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
        } catch (e) {
          if (e instanceof Error) {
            errback(e);
          }
        }
      }
    );
  }

  getMediaStreamsData(): MediaStreamData[] {
    if (!this.roomData || !this.localMediaStream) return [];

    const selfMediaStreemData: MediaStreamData = {
      peerName: this.roomData?.peerName,
      peerId: this.roomData?.peerId,
      ioId: this.roomData?.ioId,
      isCreator: false,
      isJoined: true,
      isSelf: true,
      mediaTracks: this.localMediaStream?.getTracks(),
      roomId: this.roomData.roomId,
    };

    const prepareData =
      this.activeConsumers?.reduce<Record<string, MediaStreamData>>(
        (acc, current) => {
          const producerData = current.appData.producerData;

          if (producerData.peerId in acc) {
            acc[producerData.peerId].mediaTracks.push(current.track);
          } else {
            acc[producerData.peerId] = {
              peerName: producerData.peerName,
              peerId: producerData.peerId,
              ioId: producerData.ioId,
              isCreator: false,
              isJoined: true,
              roomId: producerData.roomId,
              mediaTracks: [current.track],
              isSelf: false,
            };
          }

          return acc;
        },
        {}
      ) ?? {};

    return [selfMediaStreemData].concat(Object.values(prepareData));
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
      videoTrack: this.localMediaStream.getVideoTracks()[0],
      audioTrack: this.localMediaStream.getAudioTracks()[0],
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
    console.log("producerData", producerData);
    const { roomId } = producerData;
    const { rtpCapabilities } = this.device;

    try {
      const response = await socketSend<ConsumerOptions>("createConsumer", {
        rtpCapabilities,
        appData: {
          roomId,
          peerId: this.roomData?.peerId,
          producerId: producerData.id,
          mediaTag: producerData.kind,
          producerData,
        },
      });

      const { id, rtpParameters, kind, producerId, appData } = response;

      console.log("response", response);

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
      this.subscribe("update-peers", this.getMediaStreamsData());
    } catch (error) {
      console.log("Oшибка создания Consumer-а", error);
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
        track: audioTrack.clone(),
        appData: {
          mediaTag: "audio",
          peerId,
          roomId,
        },
      });

      this.videoProducer = await this.sendTransport.produce({
        track: videoTrack.clone(),
        appData: {
          mediaTag: "video",
          peerId,
          roomId,
        },
      });
    } catch (e) {
      console.log("catch", e);
    }

    return await new Promise((res) => {
      this.sendTransport!.on("connectionstatechange", (state) => {
        if (state === "connected") {
          this.subscribe("room-connected", this.roomData!);
          // this.subscribe("produce");
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
    this.activeProducersData = await this.getProducers(roomId, peerId);

    for (const producerData of this.activeProducersData) {
      if (producerData.peerId !== this.roomData?.peerId) {
        this.createConsumer(producerData);
      }
    }

    await this.connectRecvTransport(roomId, peerId);
  }

  async joinToRoom(peerName = "testPeer 2", roomId = "0") {
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
    } catch (e) {
      console.log(e);
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
    } catch (e) {
      console.log(e);
    }

    return this.roomData;
  }

  async createAndJoinRoom(peerName = "testPeer 1") {
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
    this.activeProducersData = [];
    this.activeConsumers = [];
  }

  on(event: RoomEvents, callback: RoomEventsType[RoomEvents]) {
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
