export const throttle = <T extends (...args: any[]) => unknown>(
  callback: T,
  ms: number
): ((...args: Parameters<T>) => unknown) => {
  let isThrottled = false;
  let savedArgs: Parameters<T> | undefined;

  const wrapper = (...args: Parameters<T>) => {
    if (isThrottled) {
      savedArgs = args;
      return;
    }

    callback.apply(null, args);

    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;

      if (savedArgs) {
        wrapper.apply(null, savedArgs);
        savedArgs = undefined;
      }
    }, ms);
  };

  return wrapper;
};
