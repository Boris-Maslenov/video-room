import { FC, useEffect, useRef, useMemo } from "react";
import { calcRMS, mapLevelToValue } from "../../utils/calcRMS";
import { useDevicesStore } from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";

const VAR = "--level";
const MIN_VALUE = 13;
const NOISE_LEVEL = 0.01;
const BOOSTER = 10;

export const MicLevel: FC = observer(() => {
  const deviseStore = useDevicesStore();
  const track = deviseStore.audioTrack;
  const levelElem = useRef<SVGRectElement>(null);

  // создаём аудиоконтекст
  const ctxRef = useRef<AudioContext>(new AudioContext());

  useEffect(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
  }, [track]);

  // узел-источник: стрим
  const source = useMemo(() => {
    return track && track.readyState !== "ended"
      ? ctxRef.current.createMediaStreamSource(new MediaStream([track]))
      : undefined;
  }, [track]);

  // узел-анализатор
  const analyser = useMemo(() => {
    return ctxRef.current?.createAnalyser();
  }, [source]);

  useEffect(() => {
    if (!track || !source || !analyser) {
      return;
    }

    // присоединяем анализатор к источнику
    source.connect(analyser);

    let rafId: number;
    let prevTick: number = 0;
    const data = new Float32Array(analyser.fftSize);

    const tick = (timeStamp: number) => {
      if (timeStamp - prevTick > 200) {
        analyser.getFloatTimeDomainData(data);
        const rms = calcRMS(data);

        if (rms < NOISE_LEVEL) {
          const nextPx = `${MIN_VALUE}px`;

          if (levelElem.current?.style.getPropertyValue(VAR) !== nextPx) {
            levelElem.current?.style.setProperty(VAR, nextPx);
          }
        } else {
          const level = Math.max(0, Math.min(1, rms * BOOSTER));
          const levelValue = Math.ceil(mapLevelToValue(level, MIN_VALUE));

          if (levelElem.current) {
            levelElem.current.style.setProperty(VAR, `${levelValue}px`);
          }
        }
        prevTick = timeStamp;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      try {
        cancelAnimationFrame(rafId);
        source?.disconnect();
      } catch (err) {}
    };
  }, [track]);

  useEffect(
    () => () => {
      ctxRef.current?.close();
      // @ts-ignore
      ctxRef.current = undefined;
    },
    []
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      height="24px"
      width="24px"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <defs>
        <mask id="micLevel">
          <rect
            ref={levelElem}
            x="0"
            y="2"
            width="24"
            height="13"
            fill="white"
            style={{
              // @ts-ignore
              "--level": `${MIN_VALUE}px`,
              transition: "transform 0.2s",
              transform: "translateY(var(--level))",
            }}
          />
        </mask>
      </defs>
      <path d="M11.998 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4"></path>
      <g mask="url(#micLevel)">
        <path
          fill="#07a107ff"
          d="M11.998 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4"
        ></path>
      </g>
      <path d="M6.406 13.628C6.233 13.261 5.88 13 5.474 13c-.62 0-1.074.588-.829 1.157a8.01 8.01 0 0 0 6.453 4.793v2.15a.9.9 0 1 0 1.8 0v-2.15a8.01 8.01 0 0 0 6.453-4.793c.245-.57-.209-1.157-.829-1.157-.405 0-.76.261-.932.628a6.178 6.178 0 0 1-11.184 0"></path>
    </svg>
  );
});
