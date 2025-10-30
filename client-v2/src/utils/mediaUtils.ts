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

  return {
    mic: results[0].status === "fulfilled",
    cam: results[1].status === "fulfilled",
  };
};
