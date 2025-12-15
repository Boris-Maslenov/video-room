import { makeAutoObservable, runInAction, observable } from "mobx";
import { RootStore } from "./RootStore";
import {
  getPermissions,
  stopStream,
  hasMedia,
  getAudioConstraints,
  getVideoConstraints,
  getScreenShareConstraints,
  getDeviceIdFromTrack,
  clearMediaTrack,
  getAudioTrackFromStream,
  getVideoTrackFromStream,
} from "../utils/mediaUtils";

const MOBILE_CAM_DEFAULT = "user";

/**
 * Стор для работы с медиа устройствами
 */
class MediaDevicesStore {
  root: RootStore;
  stream: MediaStream | null = null;
  screenStream: MediaStream | null = null;

  facingMode: "user" | "environment" = MOBILE_CAM_DEFAULT;
  isMultipleCameras: boolean = false;
  camerasPointer: number = 0;

  audioTrack: MediaStreamTrack | null = null;
  videoTrack: MediaStreamTrack | null = null;

  allMediaDevices: MediaDeviceInfo[];

  allowMic: boolean = false;
  allowCam: boolean = false;

  cams: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];

  micOn: boolean = true;
  camOn: boolean = false;

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
   * Запрашивает разрещение на камеру и микрофон, определяет список медиа устройств и
   * сразу позволяет работать с медиа устройствами,
   * проверять если ли поток и тд. при входе в комнату будет уже готовый поток.
   */
  async init() {
    this.cleanupDevicesSession();

    runInAction(() => {
      this.isMediaDevicesLoading = true;
    });

    try {
      let tmpMediaDevices = await navigator.mediaDevices.enumerateDevices();
      const { hasAudio, hasVideo } = hasMedia(tmpMediaDevices);

      /**
       * Важный момент, если устройства вообще нет в системе, то getPermissions считает, что и разрещения нет.
       */
      const { cam: camEnable, mic: micEnable } = await getPermissions(
        hasAudio,
        hasVideo
      );
      const allMediaDevices =
        (await navigator.mediaDevices?.enumerateDevices()) ?? [];

      runInAction(() => {
        this.allMediaDevices = allMediaDevices;
        this.allowMic = micEnable;
        this.allowCam = camEnable;
        this.cams = this.allMediaDevices.filter((d) => d.kind === "videoinput");
        this.mics = this.allMediaDevices.filter(
          (d) => d.kind === "audioinput" && d.deviceId !== "communications"
        );

        if (this.camOn && !this.allowCam) {
          this.camOn = false;
        }

        if (this.micOn && !this.allowMic) {
          this.micOn = false;
        }
      });

      let initStream: MediaStream | null = null;

      initStream =
        this.allowMic || this.allowCam
          ? await navigator.mediaDevices.getUserMedia({
              audio: getAudioConstraints(this.allowMic),
              video: getVideoConstraints(this.allowCam),
            })
          : null;

      const audioTrack = getAudioTrackFromStream(initStream);
      const videoTrack = getVideoTrackFromStream(initStream);

      runInAction(() => {
        this.selectedCam = getDeviceIdFromTrack(videoTrack);

        if (audioTrack) {
          this.selectedMic = getDeviceIdFromTrack(audioTrack);
          this.audioTrack = audioTrack;
        }

        /**
         * Видео поток всегда будет запущен, если выдано разрещение и существует камера,
         * но если в настройках он выключен, то необходимо  поток остановить
         */
        if (videoTrack && this.camOn) {
          this.videoTrack = videoTrack;
        } else {
          clearMediaTrack(initStream, videoTrack);
        }

        this.stream = initStream;
      });

      this.audioTrack && this.attachTrack(this.audioTrack);
      this.videoTrack && this.attachTrack(this.videoTrack);
    } catch (err) {
      if (err instanceof Error) {
        this.root.error.setError(err);
      }
    } finally {
      runInAction(() => {
        this.isMediaDevicesLoading = false;
      });
    }
  }

  toggleMic(on: boolean) {
    if (on && !this.selectedMic) {
      this.root.error.setError("Устройство не включено");
      return;
    }

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
    if (on && !this.selectedCam) {
      this.root.error.setError("Устройство не включено");
      return;
    }

    // мягкий mute
    runInAction(() => {
      if (this.videoTrack) {
        this.videoTrack.enabled = on;
      }
      this.camOn = on;
    });

    on ? this.startCam() : this.stopCam();
  }

  async startCam() {
    let tmpStream: MediaStream | null = null;

    try {
      if (this.videoTrack || !this.selectedCam) {
        return;
      }

      tmpStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: getVideoConstraints(true, this.selectedCam, this.facingMode),
      });

      const newTrack = getVideoTrackFromStream(tmpStream);

      if (!tmpStream || !newTrack) {
        throw new Error();
      }

      if (!this.stream) {
        this.stream = new MediaStream();
      }

      this.stream.addTrack(newTrack);
      tmpStream.removeTrack(newTrack);

      runInAction(() => {
        this.videoTrack = newTrack;
      });

      if (this.root.mediaSoupClient.isJoined) {
        this.root.mediaSoupClient.camOn();
      }

      this.attachTrack(newTrack);
    } catch (err) {
      this.root.error.setError("Устройство не включено");
      runInAction(() => {
        this.camOn = false;
        this.videoTrack?.stop();
        this.videoTrack = null;
      });
    }
  }

  async stopCam() {
    if (!this.videoTrack || !this.stream) {
      return;
    }
    clearMediaTrack(this.stream, this.videoTrack);
    this.videoTrack = null;

    if (this.root.mediaSoupClient.isJoined) {
      this.root.mediaSoupClient.camOff();
    }
  }

  async toggleScreenShare(on: boolean) {
    if (this.screenStream) {
      stopStream(this.screenStream);
      this.screenStream = null;
    }

    if (on) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia(
        getScreenShareConstraints()
      );

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

  /**
   * Установка нового медиа устрайства
   */
  async changeDevice(deviceId: string, type: "audioinput" | "videoinput") {
    const findSelectedDev = this.allMediaDevices.find(
      (d) => d.deviceId === deviceId
    );

    if (!findSelectedDev) {
      const error = new Error(
        `Ошибка выбора ${
          type === "audioinput" ? "микрофона" : "камеры"
        }: устройство не найдено`
      );
      this.root.error.setError(error);
      throw error;
    }

    // Сразу показываем, что устройство выбрано
    runInAction(() => {
      if (type === "audioinput") {
        this.selectedMic = findSelectedDev.deviceId;
      }
      if (type === "videoinput") {
        this.selectedCam = findSelectedDev.deviceId;
      }
    });

    // текущий аудио трек уже есть, делаем подмену на новый
    if (type === "audioinput" && this.stream && this.audioTrack) {
      // Перед созданием нового трека останавливаем старый
      clearMediaTrack(this.stream, this.audioTrack);

      let tmpStream: MediaStream | null = null;

      try {
        tmpStream = await navigator.mediaDevices.getUserMedia({
          audio: getAudioConstraints(true, findSelectedDev.deviceId),
          video: false,
        });
      } catch (err) {
        if (err instanceof Error) {
          this.root.error.setError(
            `Ошибка выбора микрофона ${findSelectedDev.label}. ${err.message}`
          );
        }
        // Откат на старое устройство
        if (this.selectedMic) {
          this.changeDevice(this.selectedMic, "audioinput");
        }
      }

      const newTrack = getAudioTrackFromStream(tmpStream);

      if (!newTrack) {
        return;
      }

      this.stream.addTrack(newTrack);

      runInAction(() => {
        this.audioTrack = newTrack;
        this.attachTrack(this.audioTrack);
      });

      if (this.root.mediaSoupClient.isJoined) {
        await this.root.mediaSoupClient.videoProducer?.replaceTrack({
          track: this.audioTrack,
        });
      }
    }
    // текущий видео трек уже есть, делаем подмену на новый
    if (type === "videoinput" && this.stream && this.videoTrack) {
      clearMediaTrack(this.stream, this.videoTrack);

      let tmpStream: MediaStream | null = null;

      try {
        tmpStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: getVideoConstraints(
            true,
            findSelectedDev.deviceId,
            this.facingMode
          ),
        });
      } catch (err) {
        if (err instanceof Error) {
          this.root.error.setError(
            `Ошибка выбора камеры ${findSelectedDev.label}. ${err.message}`
          );
        }
        // Откат на старое устройство
        if (this.selectedCam) {
          this.changeDevice(this.selectedCam, "videoinput");
        }
      }

      const newTrack = getVideoTrackFromStream(tmpStream);

      if (!newTrack) {
        const error = new Error(
          `Не смог взять трек с устройства ${findSelectedDev.label}`
        );
        this.root.error.setError(error);
        throw error;
      }

      this.stream.addTrack(newTrack);

      runInAction(() => {
        this.videoTrack = newTrack;
        this.attachTrack(this.videoTrack);
      });

      if (this.root.mediaSoupClient.isJoined) {
        this.root.mediaSoupClient.updateSelfPeer({
          mediaStream: new MediaStream([this.videoTrack]),
        });
        await this.root.mediaSoupClient.videoProducer?.replaceTrack({
          track: this.videoTrack,
        });
      }
    }
  }

  /**
   * Подписка на события трека
   */
  //todo: при событии ended желательно делать проверку на существование устройства и выданные права
  // и например если устройство было отключено, и есть права, то попытаться подключить другое устройство если есть альтернатива
  attachTrack(track: MediaStreamTrack, isScreenTrack: boolean = false) {
    const type = track.kind as "video" | "audio";
    const onEnded = () => {
      runInAction(() => {
        if (type === "audio") {
          this.audioTrack = null;
          this.micOn = false;
          this.selectedMic = null;
          // трек никогда не возобновится, выключаем микрофон
          this.root.mediaSoupClient.toggleMic(false);
          track.getSettings().deviceId;
          this.root.error.setError(
            new Error(
              `Аудио поток c устройства ${
                this.allMediaDevices.find(
                  (d) => d.deviceId === track.getSettings().deviceId
                )?.label ?? ""
              } внезапно остановился, возможно нужно разрешить использование микрофона в браузере`
            )
          );
        }

        if (type === "video") {
          // screenshare end
          if (isScreenTrack) {
            this.screenStream = null;
            // трек никогда не возобновится, выключаем скриншару
            this.root.mediaSoupClient.stopLocalScreenShare();
            return;
          }

          this.videoTrack = null;
          this.camOn = false;
          this.selectedCam = null;
          // трек никогда не возобновится, выключаем камеру
          this.root.mediaSoupClient.camOff();

          this.root.error.setError(
            new Error(
              `Видео поток c устройства ${
                this.allMediaDevices.find(
                  (d) => d.deviceId === track.getSettings().deviceId
                )?.label ?? ""
              } внезапно остановился, возможно нужно разрешить использование камеры в браузере`
            )
          );
        }

        if (this.cleanupTrackListeners.has(track)) {
          this.cleanupTrackListeners.get(track)?.();
          this.cleanupTrackListeners.delete(track);
        }
      });
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
    const allVideoDevices = this.allMediaDevices.filter(
      (d) => d.kind === "videoinput"
    );

    if (allVideoDevices.length <= 1) {
      // нет камер для переключения
      return;
    }

    const currentVidDev = allVideoDevices.find(
      (d) => d.deviceId === this.selectedCam
    );

    if (!currentVidDev) {
      // error
      return;
    }

    const currentIdx = allVideoDevices.findIndex(
      (d) => d.deviceId === currentVidDev.deviceId
    );
    const nextIdx =
      currentIdx < allVideoDevices.length - 1 ? currentIdx + 1 : 0;
    const nexVidDev = allVideoDevices[nextIdx];

    if (!nexVidDev) {
      // error
      return;
    }

    try {
      await this.changeDevice(nexVidDev.deviceId, "videoinput");
    } catch (err) {
      console.warn("Camera failed, fallback to old camera:");
      await this.changeDevice(currentVidDev.deviceId, "videoinput");
    }
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
    this.camOn = false;
    this.micOn = true;
  }
}

export default MediaDevicesStore;
