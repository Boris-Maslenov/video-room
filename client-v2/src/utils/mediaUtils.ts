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
