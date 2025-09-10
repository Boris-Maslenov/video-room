import util from "util";

export const pick = <T extends {}, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
};

var colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m", // фиолетовый
  cyan: "\x1b[36m", // голубой
  reset: "\x1b[0m", // Сброс цвета
};

type ColorName = keyof typeof colors;

// chalk
export const log = (...args: any[] | [...any, ColorName]) => {
  const COLORS = Object.keys(colors);
  const foundColor = args.at(-1) as ColorName;

  if (COLORS.includes(foundColor)) {
    return console.log(
      ...args.slice(0, -1).map(
        (arg) =>
          `${colors[foundColor]}${util.inspect(arg, {
            depth: 10,
          })}${colors.reset}`
      )
    );
  }

  return console.log(
    ...args.map((arg) => util.inspect(arg, { depth: null, colors: true }))
  );
};

export const logError = (...args: any[]) => log(...args, "red");
