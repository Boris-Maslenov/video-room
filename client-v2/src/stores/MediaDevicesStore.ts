import { makeAutoObservable, runInAction, observable } from "mobx";
import { RootStore } from "./RootStore";

class MediaDevicesStore {
  root: RootStore;
  stream: MediaStream | null = null;
  audioTrack: MediaStreamTrack | null = null;
  videoTrack: MediaStreamTrack | null = null;
  allMediaDevices: MediaDeviceInfo[];
  cams: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];
  selectedMic: string | null = null;
  selectedCam: string | null = null;
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
      stream: observable.ref,
      // ref / shallow / deep / struct
    });
  }

  toggleMic(on: boolean) {
    // мягкий mute
    if (this.audioTrack) {
      this.micOn = on;
      this.audioTrack.enabled = on;
    }
  }

  toggleCam(on: boolean) {
    // мягкий mute
    if (this.videoTrack) {
      this.camOn = on;
      this.videoTrack.enabled = on;
    }
  }

  stopAllTracks(stream: MediaStream | null) {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  }
  /**
   * init
   * Запрашивает разрещение на камеру и микрофон, определяет список медиа устройств,
   * определяет id камеры и микрофона для старта.
   */

  async init() {
    try {
      const initMediaDevices = await navigator.mediaDevices.enumerateDevices();
      const hasAudio = initMediaDevices.some((d) => d.kind === "audioinput");
      const hasVideo = initMediaDevices.some((d) => d.kind === "videoinput");

      let initStream: MediaStream | null =
        await navigator.mediaDevices.getUserMedia({
          audio: hasAudio,
          video: hasVideo,
        });
      const allMediaDevices = await navigator.mediaDevices.enumerateDevices();
      runInAction(() => {
        /**
         * Выбор по умолчанию
         */
        this.allMediaDevices = allMediaDevices;
        this.mics = this.allMediaDevices.filter((d) => d.kind === "audioinput");
        this.cams = this.allMediaDevices.filter((d) => d.kind === "videoinput");
        this.selectedMic = hasAudio ? "default" : null;
        this.selectedCam = hasVideo
          ? initStream?.getVideoTracks()[0].getSettings().deviceId ?? null
          : null;
      });

      this.stopAllTracks(initStream);
      initStream = null;
    } catch (err) {
      throw err;
    }
  }

  attachTrack(track: MediaStreamTrack) {
    const type = track.kind as "video" | "audio";

    const onEnded = () =>
      runInAction(() => {
        if (type === "audio") {
          this.audioTrack = null;
          this.micOn = false;
        }

        if (type === "video") {
          this.videoTrack = null;
          this.camOn = false;
        }

        if (this.cleanupTrackListeners.has(track)) {
          this.cleanupTrackListeners.get(track)?.();
          this.cleanupTrackListeners.delete(track);
        }
      });

    track.addEventListener("ended", onEnded);

    this.cleanupTrackListeners.set(track, () => {
      track.removeEventListener("ended", onEnded);
    });
  }

  async startMediaTracks(): Promise<MediaStreamTrack[]> {
    let mediaTracks = [] as MediaStreamTrack[];
    const needAudio = Boolean(this.micOn && this.selectedMic);
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
      this.audioTrack = track;
      mediaTracks.push(track);
    }

    if (needVideo) {
      const track = stream.getVideoTracks()[0];
      this.attachTrack(track);
      this.videoTrack = track;
      mediaTracks.push(track);
    }
    console.log("this.stream", this.stream);
    return mediaTracks;
  }

  getMediaTracks() {
    return [this.videoTrack, this.audioTrack].filter(
      Boolean
    ) as MediaStreamTrack[];
  }
}

export default MediaDevicesStore;
