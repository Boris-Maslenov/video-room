import { makeAutoObservable, runInAction, observable } from "mobx";
import { RootStore } from "./RootStore";
import { getPermissions, stopStream } from "../utils/mediaUtils";

const MOBILE_CAM_DEFAULT = "user";

/**
 * Стор для работы с медиа устройствами
 */
class MediaDevicesStore {
  root: RootStore;
  stream: MediaStream | null = null;
  screenStream: MediaStream | null = null;

  facingMode: "user" | "environment" = MOBILE_CAM_DEFAULT;

  audioTrack: MediaStreamTrack | null = null;
  videoTrack: MediaStreamTrack | null = null;

  allMediaDevices: MediaDeviceInfo[];

  allowMic: boolean = false;
  allowCam: boolean = false;

  cams: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];

  micOn: boolean = true;
  camOn: boolean = true;

  selectedMic: string | null = null;
  selectedCam: string | null = null;

  cleanupTrackListeners: Map<MediaStreamTrack, () => void> = new Map();
  isMediaDevicesLoading: boolean = false;

  constructor(root: RootStore) {
    this.root = root;
    this.allMediaDevices = [];
    this.cams = [];
    this.mics = [];

    makeAutoObservable(this, {
      audioTrack: observable.ref,
      videoTrack: observable.ref,
      stream: observable.ref,
      screenStream: observable.ref,
      // ref / shallow / deep / struct
    });
  }

  /**
   * init
   * Запрашивает разрещение на камеру и микрофон, определяет список медиа устройств,
   * определяет id камеры и микрофона для старта.
   */
  async init() {
    // перед каждой инициализацией на всякий случай очистим предыдущую сессию
    this.cleanupDevicesSession();
    try {
      runInAction(() => {
        this.isMediaDevicesLoading = true;
      });

      let initMediaDevices = await navigator.mediaDevices.enumerateDevices();
      // Определяем имеются ли микрофоны и камеры в системе
      const hasAudio = initMediaDevices.some((d) => d.kind === "audioinput");
      const hasVideo = initMediaDevices.some((d) => d.kind === "videoinput");

      const { cam: allowCam, mic: allowMic } = await getPermissions(
        hasAudio,
        hasVideo
      );

      runInAction(() => {
        this.allowMic = allowMic;
        this.allowCam = allowCam;
        this.micOn = allowMic;
        this.camOn = false;
      });

      // Создаем стрим, который нужен для определения id устройства камеры
      let initStream: MediaStream | null = null;

      // если есть меди устройство и разрешение выдано,то его можно испольовать
      const micEnable = allowMic && hasAudio;
      const camEnable = allowCam && hasVideo;

      try {
        initStream =
          camEnable || micEnable
            ? await navigator.mediaDevices.getUserMedia({
                audio: micEnable,
                video: camEnable && { facingMode: this.facingMode },
              })
            : null;
      } catch (err) {
        if (err instanceof Error) {
          this.root.error.setError(err);
        }
      }

      // Когда получили разрещения, список с устройствами будет полностью информативен
      const allMediaDevices = await navigator.mediaDevices?.enumerateDevices();

      runInAction(() => {
        this.allMediaDevices = allMediaDevices;
        this.mics = this.allMediaDevices.filter(
          (d) => d.kind === "audioinput" && d.deviceId !== "communications"
        );
        this.cams = this.allMediaDevices.filter((d) => d.kind === "videoinput");
        // Выбор устройств по умолчанию
        // Не опираемся на id default так как его поведение не стабильно в разных браузерах, берем реальный id устройства
        this.selectedMic = micEnable
          ? initStream?.getAudioTracks()[0]?.getSettings().deviceId ?? null
          : null;
        this.selectedCam = camEnable
          ? initStream?.getVideoTracks()[0]?.getSettings().deviceId ?? null
          : null;
      });

      // закрываем временный видео стрим
      stopStream(initStream);

      initStream = null;

      runInAction(() => {
        this.isMediaDevicesLoading = false;
      });
    } catch (err) {
      runInAction(() => {
        this.isMediaDevicesLoading = false;
        this.micOn = false;
        this.camOn = false;
      });

      if (err instanceof Error) {
        this.root.error.setError(err);
      }

      throw err;
    }
  }

  /**
   *startMediaTracks
   * Запускает стрим с треками, по предустановленным настройкам
   */
  async startMediaTracks(): Promise<MediaStreamTrack[]> {
    // на всякий случай закроем все треки
    stopStream(this.stream);
    this.videoTrack = null;
    this.audioTrack = null;
    this.stream = null;

    let mediaTracks = [] as MediaStreamTrack[];
    // устройство готово для транслирования медиа если: включено\выбрано\выдано разрешение
    // для микрофона делаем исключение, создаем трек, даже если !this.micOn чтобы отправить пустой трек (TODO: на след. версии)
    const needAudio = Boolean(this.selectedMic && this.allowMic);
    const needVideo = Boolean(this.camOn && this.selectedCam && this.allowCam);

    /**
     * Стрим на основе выбранных устройств
     */
    const stream =
      needAudio || needVideo
        ? await navigator.mediaDevices.getUserMedia({
            audio:
              needAudio && this.selectedMic
                ? {
                    deviceId: { exact: this.selectedMic },
                  }
                : false,
            video:
              needVideo && this.selectedCam
                ? {
                    deviceId: { exact: this.selectedCam },
                    width: { max: 360 },
                    frameRate: 20,
                  }
                : false,
          })
        : null;

    if (!stream) {
      return mediaTracks;
    }

    runInAction(() => {
      this.stream = stream;
    });

    if (needAudio) {
      const track = stream.getAudioTracks()[0];
      this.attachTrack(track);
      // TODO: даже если микрофон выключен, все равно транслируем пустой поток, чтобы включение было мгновенным
      if (!this.micOn) {
        track.enabled = false;
      }
      this.audioTrack = track;

      mediaTracks.push(track);
    }

    if (needVideo) {
      const track = stream.getVideoTracks()[0];
      this.attachTrack(track);
      this.videoTrack = track;
      mediaTracks.push(track);
    }

    return mediaTracks;
  }

  toggleMic(on: boolean) {
    // мягкий mute
    runInAction(() => {
      if (this.audioTrack) {
        this.audioTrack.enabled = on;
      }
      this.micOn = on;
      this.root.mediaSoupClient.toggleMic(on);
    });
  }

  toggleCam(on: boolean) {
    // мягкий mute
    runInAction(() => {
      if (this.videoTrack) {
        this.videoTrack.enabled = on;
      }
      this.camOn = on;
    });

    if (this.root.mediaSoupClient.isJoined) {
      on ? this.startCam() : this.stopCam();
    }
  }

  async startCam() {
    let tmpStream: MediaStream | null = null;
    try {
      const oldTrack = this.videoTrack;
      if (oldTrack || !this.selectedCam) return;

      tmpStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: this.selectedCam } },
      });

      const track = tmpStream.getVideoTracks()[0];

      if (!this.stream) {
        this.stream = new MediaStream();
      }

      this.stream.addTrack(track);
      runInAction(() => {
        this.videoTrack = track;
      });
      this.attachTrack(track);
      tmpStream.removeTrack(track);

      this.root.mediaSoupClient.camOn();
    } catch (err) {
      this.root.error.setError("Устройство не включено");
      runInAction(() => {
        this.camOn = false;
      });
    } finally {
      if (tmpStream) {
        tmpStream.getTracks().forEach((t) => t.stop());
      }
    }
  }

  async stopCam() {
    try {
      const track = this.videoTrack;
      if (!track) return;

      track.stop();
      this.videoTrack = null;
      this.stream?.removeTrack(track);
      this.root.mediaSoupClient.camOff();
    } catch (err) {
      console.log(err);
    }
  }

  async toggleScreenShare(on: boolean) {
    if (this.screenStream) {
      stopStream(this.screenStream);
      this.screenStream = null;
    }

    if (on) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 15,
          width: { max: 2560 },
          height: { max: 1440 },
        },
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      this.attachTrack(screenTrack, true);

      runInAction(() => {
        this.screenStream = screenStream;
      });

      this.root.mediaSoupClient.startLocalScreenShare(screenTrack);
    } else {
      this.root.mediaSoupClient.stopLocalScreenShare();
    }
  }

  // Выбор id устройства
  async setDevice(deviceId: string, type: "audioinput" | "videoinput") {
    const allActualDevices = await navigator.mediaDevices.enumerateDevices();
    const devices = allActualDevices.filter((d) => d.kind === type);
    const findSelectedDev = devices.find((d) => d.deviceId === deviceId);

    if (!findSelectedDev) {
      throw new Error(`Что-то пошло не так при выборе устройства`);
    }

    runInAction(() => {
      if (type === "audioinput") {
        this.selectedMic = findSelectedDev.deviceId;
      }
      if (type === "videoinput") {
        this.selectedCam = findSelectedDev.deviceId;
      }
    });
  }

  /**
   * TODO: будет актуальным когда будет смена устройства во время звонка
   */
  async changeMediaTrack(deviceId: string) {
    if (!this.stream) {
      return;
    }

    const device = this.allMediaDevices.find((d) => d.deviceId === deviceId);
    const audio = device?.kind === "audioinput";
    const video = device?.kind === "videoinput";

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio,
      video,
    });

    const oldTrack = audio
      ? this.stream?.getAudioTracks()[0]
      : this.stream.getVideoTracks()[0];

    const newTrack = audio
      ? newStream.getAudioTracks()[0]
      : newStream.getVideoTracks()[0];

    this.stream?.removeTrack(oldTrack);
    this.stream?.addTrack(newTrack);
  }

  /**
   * Подписка на события трека
   */
  attachTrack(track: MediaStreamTrack, isScreenTrack: boolean = false) {
    const type = track.kind as "video" | "audio";
    const onEnded = () => {
      runInAction(() => {
        if (type === "audio" && !isScreenTrack) {
          this.audioTrack = null;
          this.micOn = false;
          this.mics = [];
          this.allowMic = false;
          // трек никогда не возобновится, выключаем микрофон
          this.root.mediaSoupClient.toggleMic(false);
        }

        if (type === "video" && !isScreenTrack) {
          this.videoTrack = null;

          this.camOn = false;
          this.cams = [];
          this.allowCam = false;
          // трек никогда не возобновится, выключаем камеру
          this.root.mediaSoupClient.camOff();
        }

        if (type === "video" && isScreenTrack) {
          this.screenStream = null;
          // трек никогда не возобновится, выключаем скриншару
          this.root.mediaSoupClient.stopLocalScreenShare();
        }

        if (this.cleanupTrackListeners.has(track)) {
          this.cleanupTrackListeners.get(track)?.();
          this.cleanupTrackListeners.delete(track);
        }
      });

      this.root.error.setError(
        new Error(
          `Медиа поток внезапно остановился, возможно нужно разрешить использование камеры или микрофона в браузере`
        )
      );
    };

    track.addEventListener("ended", onEnded);

    this.cleanupTrackListeners.set(track, () => {
      track.removeEventListener("ended", onEnded);
    });
  }

  /**
   * Смена камеры на мобильных устройства
   */
  async camReverce() {
    const curFacingMode = this.facingMode;
    let tempStreem: MediaStream | null = null;

    try {
      tempStreem = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: curFacingMode === "user" ? "environment" : "user",
        },
        audio: false,
      });
    } catch (err) {
      console.warn("front camera failed, fallback to old camera:");
    }

    if (!tempStreem) {
      return;
    }

    const newVideoTrack = tempStreem.getVideoTracks()[0];
    const oldVideoTrack = this.stream?.getVideoTracks()[0];

    if (oldVideoTrack) {
      this.stream?.addTrack(newVideoTrack);
      this.stream?.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
    }

    await this.root.mediaSoupClient.videoProducer?.replaceTrack({
      track: newVideoTrack,
    });

    tempStreem.removeTrack(newVideoTrack);
    tempStreem = null;

    runInAction(() => {
      this.facingMode = curFacingMode === "user" ? "environment" : "user";

      this.root.mediaSoupClient.updateSelfPeer({
        mediaStream: new MediaStream([newVideoTrack]),
      });
    });
  }

  getMediaTracks() {
    return [this.videoTrack, this.audioTrack].filter(
      Boolean
    ) as MediaStreamTrack[];
  }

  // Остановит все треки и удалит стрим
  cleanupDevicesSession() {
    stopStream(this.stream);
    stopStream(this.screenStream);
    this.audioTrack = null;
    this.videoTrack = null;
    this.screenStream = null;
    this.stream = null;
    this.allMediaDevices = [];
    this.cams = [];
    this.mics = [];
    this.selectedCam = null;
    this.selectedMic = null;
    this.allowMic = false;
    this.allowCam = false;
  }
}

export default MediaDevicesStore;
