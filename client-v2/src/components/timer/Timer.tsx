import { useRef, useEffect, useState } from "react";

const secondConverter = (
  num: number
): Record<"hours" | "minutes" | "seconds", string> => {
  const getValue = (val: number): string => {
    return val < 10 ? `0${val}` : String(val);
  };

  const hours = Math.floor(num / 60 / 60);
  const minutes = Math.floor((num - hours * 3600) / 60);
  const seconds = num - hours * 3600 - minutes * 60;

  return {
    hours: getValue(hours),
    minutes: getValue(minutes),
    seconds: getValue(seconds),
  };
};

const Timer = () => {
  const timerRef = useRef<number | null>(null);
  const [sec, setSec] = useState<number>(0);

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setSec((prev) => prev + 1),
      1000
    );

    if (!timerRef.current) {
      timerRef.current = intervalId;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const t = secondConverter(sec);

  return (
    <>
      {t.hours}:{t.minutes}:{t.seconds}
    </>
  );
};

export default Timer;
