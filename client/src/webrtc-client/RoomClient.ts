import { Device } from "mediasoup-client";
import { io, type Socket } from "socket.io-client";
import {
  RtpCapabilities,
  Transport,
  TransportOptions,
  ConsumerOptions,
  Consumer,
  Producer,
} from "mediasoup-client/lib/types";
import { SocketSendType, ErrorSocketType, isErrorSocketType } from "./model";

export const socket = io("ws://localhost:3001");

function socketPromise<T>(socket: Socket) {
  return (type: string, data = {}): Promise<T> =>
    new Promise((resolve, reject) => {
      socket.emit(type, data, (res: T | ErrorSocketType) =>
        isErrorSocketType(res) ? reject(res) : resolve(res)
      );
    });
}

export const socketSend: SocketSendType = socketPromise(socket);

// type ActiveConsumerType = {
//   peerId: string;
//   peerName: string;
//   roomId: string;
//   consumers: {};
// };

type ProduserDataType = {
  roomId: string;
  peerId: string;
  peerName: string;
  id: string;
  kind: "audio" | "video";
};

class RoomClient {
  roomId?: string;
  peerName?: string;
  peerId?: string;
  ioId?: string;

  device?: Device;
  sendTransport?: Transport;
  recvTransport?: Transport;

  videoProducer?: Producer;
  audioProducer?: Producer;

  activeProducersData?: ProduserDataType[];
  activeConsumers?: Consumer[];

  constructor() {
    this.roomId;
    this.peerName;
    this.peerId;
    this.ioId;

    this.device;

    this.sendTransport;
    this.recvTransport;

    this.videoProducer;
    this.audioProducer;

    this.activeProducersData = [];
    this.activeConsumers = [];
  }

  /**
   * Запросить список активных продюсеров (включая свой собственный) в пределах 1 комнаты
   */
  async getProducers(roomId: string, peerId: string) {
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
   * Позволяет определять, какие медиа он может отправлять (SendTransport) или принимать (RecvTransport).
   */
  async loadDevice() {
    if (this.device) return;

    this.device = new Device();
    const routerRtpCapabilities = await this.gerRouterRtpCapabilites();
    await this.device.load({ routerRtpCapabilities });
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
  }

  /**
   * Подключение Producer Transport
   */
  connectProducerTransport(roomId: string, peerId: string) {
    if (!this.sendTransport) return;

    const transport = this.sendTransport;
    transport.on("connect", async ({ dtlsParameters }, callback, _errback) => {
      await socketSend("connectProducerTransport", {
        dtlsParameters,
        appData: {
          roomId,
          peerId,
        },
      });
      callback();
    });

    transport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, _errback) => {
        // appData передаем в sendTransport.produce()
        const data = await socketSend<{ id: string }>("createProducer", {
          kind,
          rtpParameters,
          appData,
        });
        callback(data);
      }
    );
  }

  /**
   * Получить медиа Трэки
   */
  async getMediaTracks() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const tracks = {
      videoTrack: stream.getVideoTracks()[0],
      audioTrack: stream.getAudioTracks()[0],
    };

    return tracks;
  }

  /**
   * create Consumer Transport
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
   * Подключение RecvTransport
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
        console.log("this.recvTransport.on : connect");
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
          // Генерируется после recvTransport.consume
          // Можно воспроизводить медиапотоки.
          console.log("recvTransport: connected");
          res("connected");
        }
      });
    });
  }

  /**
   * Создает собственные Consumers
   */
  async createConsumer(produerData: ProduserDataType) {
    console.log("createSelfConsumer");
    if (!this.device || !this.recvTransport) return;
    const { roomId, peerId } = produerData;
    const { rtpCapabilities } = this.device;
    try {
      const response = await socketSend<ConsumerOptions>("createConsumer", {
        rtpCapabilities,
        appData: {
          roomId,
          peerId,
          producerId: produerData.id,
          mediaTag: produerData.kind,
        },
      });

      const { id, rtpParameters, kind, producerId } = response;

      if (kind === "video") {
        const videoConsumer = await this.recvTransport!.consume({
          id,
          rtpParameters,
          producerId,
          kind,
        });

        this.activeConsumers?.push(videoConsumer);
      }

      if (kind === "audio") {
        const audioConsumer = await this.recvTransport!.consume({
          id,
          rtpParameters,
          producerId,
          kind,
        });

        this.activeConsumers?.push(audioConsumer);
      }

      console.log("response", response);
      console.log("this.activeConsumers", this.activeConsumers);
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

    this.connectProducerTransport(roomId, peerId);

    try {
      const { videoTrack, audioTrack } = await this.getMediaTracks();

      this.videoProducer = await this.sendTransport.produce({
        track: videoTrack,
        appData: {
          mediaTag: "camera",
          peerId,
          roomId,
        },
      });

      this.audioProducer = await this.sendTransport.produce({
        track: audioTrack,
        appData: {
          mediaTag: "mic",
          peerId,
          roomId,
        },
      });

      // this.subscribeEventsProducer(this.producer);
    } catch (e) {
      console.log("catch", e);
    }

    return await new Promise((res) => {
      this.sendTransport!.on("connectionstatechange", (state) => {
        if (state === "connected") {
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
  async subscribe(roomId: string, peerId: string) {
    if (!this.device) {
      await this.loadDevice();
    }

    await this.createRecvTransport(roomId, peerId);
    const activeProducers = await this.getProducers(roomId, peerId);
    this.activeProducersData = activeProducers;
    console.log("activeProducers", this.activeProducersData);
    // Создание консумеров
    for await (const producerData of this.activeProducersData) {
      if (producerData.peerId !== peerId) {
        this.createConsumer(producerData);
      }
    }
    console.log(this.activeConsumers);
    // Соединение Consumer Transport
    await this.connectRecvTransport(roomId, peerId);
  }

  // async connect(roomId: string, peerId: string) {
  //   console.log("produce....");
  //   await this.produce(roomId, peerId);
  //   console.log("subscribe....");
  //   await this.subscribe(roomId, peerId);
  // }

  // async getVideo() {
  //   const el = document.querySelector("#video") as HTMLVideoElement;
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: true,
  //   });
  //   el.srcObject = stream;
  // }

  // Новые методы

  // 1
}

export default RoomClient;

// const combinedStream = new MediaStream();
// combinedStream.addTrack(this.videoConsumer!.track);
// combinedStream.addTrack(this.audioConsumer!.track);
// const el = document.querySelector("#video2") as HTMLVideoElement;
// el.srcObject = combinedStream;
