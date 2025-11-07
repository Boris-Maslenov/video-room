export const safeClose = (...objs: ({ close: () => void } | null)[]) => {
  objs.forEach((o) => {
    o?.close();
  });
};
