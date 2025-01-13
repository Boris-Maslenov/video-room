export const debaunce = <T extends (...args: any[]) => unknown>(
  callback: T,
  ms: number
) => {
  let timeout: ReturnType<typeof setTimeout>;
  const wrapper = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      callback.apply(null, args);
    }, ms);
  };

  return wrapper;
};
