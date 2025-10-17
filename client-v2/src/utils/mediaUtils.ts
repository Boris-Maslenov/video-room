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
