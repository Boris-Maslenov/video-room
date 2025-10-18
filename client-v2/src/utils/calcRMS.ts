export const calcRMS = (data: Float32Array): number => {
  const sum = data.reduce((acc, cur) => {
    return (acc += cur * cur);
  }, 0);

  return Math.sqrt(sum / data.length);
};

export const mapLevelToValue = (level: number, max: number): number => {
  const clamped = Math.max(0, Math.min(1, level));
  return (1 - clamped) * max;
};
