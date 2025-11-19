import {
  ClientRemotePeer,
  NetworkQuality,
} from "../stores/MediasoupClientStore";

export const safeClose = (...objs: ({ close: () => void } | null)[]) => {
  for (const obj of objs) {
    if (!obj) {
      continue;
    }

    obj?.close();
  }
};

export const safeStop = (...objs: ({ stop: () => void } | null)[]) => {
  for (const obj of objs) {
    if (!obj) {
      continue;
    }

    obj?.stop();
  }
};

export const stopStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
  }
};

/**
 * Определит есть ли разрешение на камеру и микрофон в системе
 *
 */
export const getPermissions = async (
  hasAudio: boolean,
  hasVideo: boolean
): Promise<{ cam: boolean; mic: boolean }> => {
  const hasMic = hasAudio
    ? navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    : Promise.reject(false);
  const hasCam = hasVideo
    ? navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    : Promise.reject(false);

  const results = await Promise.allSettled([hasMic, hasCam]);

  results.forEach((r) => {
    if (r.status === "fulfilled") {
      r.value.getTracks().forEach((t) => t.stop());
    }
  });

  return {
    mic: results[0].status === "fulfilled",
    cam: results[1].status === "fulfilled",
  };
};

/**
 * Вернет пиров, распределенных по слайдам
 */
export const getGroupShema = (peers: ClientRemotePeer[], maxCount: number) => {
  let result: Record<number, ClientRemotePeer[]> = {};
  const len = peers.length;
  if (len === 0) return {};

  let groups = 0;

  for (let i = 0; i < len; i += maxCount) {
    result[groups] = peers.slice(i, i + maxCount);
    groups++;
  }

  return result;
};

export const waitForFirstNewFrame = (
  video: HTMLVideoElement,
  opts: {
    minNewFrames?: number;
    timeoutMs?: number;
    pollIntervalMs?: number;
  } = {}
) => {
  const { minNewFrames = 10, timeoutMs = Infinity, pollIntervalMs = 50 } = opts;

  return new Promise<void>((resolve) => {
    let done = false;

    const finish = () => {
      if (done) {
        return;
      }
      done = true;

      if (tId != null) {
        clearTimeout(tId);
        tId = null;
      }

      if (iId != null) {
        clearInterval(iId);
        iId = null;
      }

      active = false;
      resolve();
    };

    let tId: number | null = null;
    let iId: number | null = null;
    let active = true;

    // Таймаут-страховка
    tId = window.setTimeout(finish, timeoutMs);

    // Помошник чтения счётчика кадров (fallback-путь)
    const readTotal = () =>
      video.getVideoPlaybackQuality?.().totalVideoFrames ??
      (video as any).webkitDecodedFrameCount ??
      0;

    // Если есть requestVideoFrameCallback — это самый точный способ
    if ("requestVideoFrameCallback" in video) {
      let seen = 0;
      const rvfc = video.requestVideoFrameCallback.bind(video);

      const step = () => {
        if (!active || done) {
          return;
        }

        seen += 1;

        if (seen >= minNewFrames) {
          return finish();
        }

        rvfc(() => step());
      };

      // первый запрос кадра
      rvfc(() => step());
      return;
    }

    // Fallback: опрос количества отрисованных кадров
    const baseline = readTotal();

    if (readTotal() - baseline >= minNewFrames) return finish();

    iId = window.setInterval(() => {
      const total = readTotal();
      if (total - baseline >= minNewFrames) {
        finish();
      }
    }, pollIntervalMs);
  });
};

export const checkTrackActive = (track: MediaStreamTrack): boolean => {
  return Boolean(track && track.readyState === "live" && track.muted === false);
};

export const calcNetworkQuality = (score: number): NetworkQuality => {
  if (score >= 8) return "good";
  if (score >= 5) return "medium";
  if (score >= 3) return "bad";
  return "very-bad";
};
