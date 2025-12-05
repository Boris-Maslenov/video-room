export const isMobileDevice = () => {
  if (!window.navigator) {
    return false;
  }

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};
