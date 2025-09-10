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
    });
  }

  toggleMic(on: boolean) {
    // мягкий mute
    this.micOn = on;
    if (this.audioTrack) this.audioTrack.enabled = on;
  }

  toggleCam(on: boolean) {
    // мягкий mute
    this.camOn = on;
    if (this.videoTrack) this.videoTrack.enabled = on;
  }

  stopAllTracks(stream: MediaStream | null) {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  }

  async init() {
    try {
      let stream: MediaStream | null =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

      const allMediaDevices = await navigator.mediaDevices.enumerateDevices();
      runInAction(() => {
        this.allMediaDevices = allMediaDevices;
        this.mics = this.allMediaDevices.filter((d) => d.kind === "audioinput");
        this.cams = this.allMediaDevices.filter((d) => d.kind === "videoinput");
        /**
         * TODO: this.stream!.getAudioTracks()[0].getSettings().deviceId;
         * Настроить выбор на мобильных устройствах
         */
        this.selectedMic = "default";
        this.selectedCam =
          stream!.getVideoTracks()[0].getSettings().deviceId ?? null;
      });
      this.stopAllTracks(stream);
      stream = null;
    } catch (err) {
      console.warn(err);
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

    return mediaTracks;
  }
}

export default MediaDevicesStore;
