import { makeAutoObservable, runInAction, observable, reaction } from "mobx";
import { RootStore } from "./RootStore";

class MediaDevicesStore {
  root: RootStore;
  stream: MediaStream | null = null;
  screenStream: MediaStream | null = null;

  audioTrack: MediaStreamTrack | null = null;
  videoTrack: MediaStreamTrack | null = null;

  allMediaDevices: MediaDeviceInfo[];
  cams: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];
  selectedMic: string | null = null;
  selectedCam: string | null = null;
  isMediaDevicesLoading: boolean = false;
  micOn: boolean = true;
  camOn: boolean = true;
  cleanupTrackListeners: Map<MediaStreamTrack, () => void> = new Map();

  constructor(root: RootStore) {
    this.root = root;
    this.allMediaDevices = [];
    this.cams = [];
    this.mics = [];

    makeAutoObservable(this, {
      audioTrack: observable.ref,
      videoTrack: observable.ref,
      // screenTrack: observable.ref,
      stream: observable.ref,
      screenStream: observable.ref,
      // ref / shallow / deep / struct
    });
  }

  async toggleScreenShare(on: boolean) {
    if (this.screenStream) {
      this.stopAllTracks(this.screenStream);
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

  toggleMic(on: boolean) {
    // мягкий mute
    runInAction(() => {
      if (this.audioTrack) {
        this.audioTrack.enabled = on;
      }
      this.micOn = on;
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
      !on ? this.stopCam() : this.startCam();
    }
  }

  async stopCam() {
    try {
      const track = this.videoTrack;
      if (!track) return;

      track.stop();
      this.videoTrack = null;
      this.stream?.removeTrack(track);
      this.root.mediaSoupClient.camOf();
    } catch (err) {
      console.log(err);
    }
  }

  async startCam() {
    try {
      const oldTrack = this.videoTrack;
      if (oldTrack || !this.selectedCam) return;

      let tmpStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: this.selectedCam } },
      });

      const track = tmpStream.getVideoTracks()[0];

      if (!this.stream) {
        this.stream = new MediaStream();
      }

      this.stream.addTrack(track);
      this.videoTrack = track;
      this.attachTrack(track);
      tmpStream.removeTrack(track);

      this.root.mediaSoupClient.camOn();
    } catch (err) {
      console.log(err);
    }
  }

  stopAllTracks(stream: MediaStream | null) {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      this.audioTrack = null;
      this.videoTrack = null;
    }
  }

  // Выбор id устройсва
  async setDevice(deviceId: string, type: "audioinput" | "videoinput") {
    const allActualDevices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = allActualDevices.filter((d) => d.kind === type);
    const findSelectedDev = audioDevices.find((d) => d.deviceId === deviceId);

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
   * init
   * Запрашивает разрещение на камеру и микрофон, определяет список медиа устройств,
   * определяет id камеры и микрофона для старта.
   */
  async init() {
    // reaction(
    //   () => this.selectedMic,
    //   (now, prev) => {
    //     if (!prev) return;
    //     if (now) {
    //       console.log("ура я поймал событие изменение микрофона");
    //       this.changeMediaTrack(now);
    //     }
    //   },
    //   { fireImmediately: false }
    // );

    try {
      runInAction(() => {
        this.isMediaDevicesLoading = true;
      });
      const initMediaDevices = await navigator.mediaDevices.enumerateDevices();

      const hasAudio = initMediaDevices.some((d) => d.kind === "audioinput");
      const hasVideo = initMediaDevices.some((d) => d.kind === "videoinput");

      let initStream: MediaStream | null =
        await navigator.mediaDevices.getUserMedia({
          audio: hasAudio,
          video: hasVideo,
        });

      runInAction(() => {
        this.isMediaDevicesLoading = false;
      });
      const allMediaDevices = await navigator.mediaDevices.enumerateDevices();
      runInAction(() => {
        /**
         * Выбор по умолчанию
         */
        this.allMediaDevices = allMediaDevices;
        this.mics = this.allMediaDevices.filter(
          (d) => d.kind === "audioinput" && d.deviceId !== "communications"
        );
        this.cams = this.allMediaDevices.filter((d) => d.kind === "videoinput");
        this.selectedMic = hasAudio ? "default" : null;
        this.selectedCam = hasVideo
          ? initStream?.getVideoTracks()[0].getSettings().deviceId ?? null
          : null;
      });

      this.stopAllTracks(initStream);
      initStream = null;
    } catch (err) {
      runInAction(() => {
        this.isMediaDevicesLoading = false;
      });
      throw err;
    }
  }

  attachTrack(track: MediaStreamTrack, isScreenTrack: boolean = false) {
    const type = track.kind as "video" | "audio";
    const onEnded = () => {
      console.log("onEnded", track);
      runInAction(() => {
        if (type === "audio" && !isScreenTrack) {
          this.audioTrack = null;
          this.micOn = false;
          // TODO: Закрыть или приостановить продюсер
        }

        if (type === "video" && !isScreenTrack) {
          this.videoTrack = null;
          this.camOn = false;
          // TODO: Закрыть или приостановить продюсер
        }

        if (type === "video" && isScreenTrack) {
          this.screenStream = null;
        }

        if (this.cleanupTrackListeners.has(track)) {
          this.cleanupTrackListeners.get(track)?.();
          this.cleanupTrackListeners.delete(track);
        }
      });

      throw new Error(
        `Медиа поток внезапно остановился, возможно нужно разрешить использование камеры и микрофона в браузере`
      );
    };

    track.addEventListener("ended", onEnded);

    this.cleanupTrackListeners.set(track, () => {
      track.removeEventListener("ended", onEnded);
    });
  }

  async startMediaTracks(): Promise<MediaStreamTrack[]> {
    let mediaTracks = [] as MediaStreamTrack[];
    const needAudio = Boolean(this.selectedMic);
    const needVideo = Boolean(this.camOn && this.selectedCam);

    this.stopAllTracks(this.stream);
    this.stream = null;

    /**
     * Стрим на основе выбранных устройств (при смене устройства подменять трек)
     */
    const stream =
      needAudio || needVideo
        ? await navigator.mediaDevices.getUserMedia({
            audio: needAudio
              ? {
                  deviceId:
                    this.selectedMic === "default" ||
                    this.selectedMic === "communications"
                      ? this.selectedMic!
                      : { exact: this.selectedMic! },
                }
              : false,
            video: needVideo
              ? { deviceId: { exact: this.selectedCam! } }
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

  getMediaTracks() {
    return [this.videoTrack, this.audioTrack].filter(
      Boolean
    ) as MediaStreamTrack[];
  }

  // Оставиновит все треки и удалит стрим
  cleanupSession() {
    console.log("cleanupSession");
    this.stopAllTracks(this.stream);
    this.stopAllTracks(this.screenStream);
    this.screenStream = null;
    this.stream = null;
  }
}

export default MediaDevicesStore;
