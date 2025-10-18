import { FC, useEffect, useRef } from "react";
import { calcRMS, mapLevelToValue } from "../../utils/calcRMS";
import { useDevicesStore } from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";

export const MicLevel: FC = observer(() => {
  console.log("MicLevel RENDER");
  const deviseStore = useDevicesStore();
  const track = deviseStore.audioTrack;

  console.log("track render", deviseStore.audioTrack);

  const levelElem = useRef<SVGRectElement>(null);
  // создаём аудиоконтекст
  const ctxRef = useRef<AudioContext>(new AudioContext());
  // узел-источник: стрим
  const sourceRef = useRef(
    track
      ? ctxRef.current.createMediaStreamSource(new MediaStream([track.clone()]))
      : undefined
  );
  // узел-анализатор
  // const analyser = ctxRef.createAnalyser();
  const analyserRef = useRef(ctxRef.current.createAnalyser());
  // присоединяем анализатор к источнику
  if (sourceRef.current) {
    sourceRef.current.connect(analyserRef.current);
  }

  useEffect(() => {
    console.log("MicLevel useEffect");
    let rafId: number;
    let prevTick: number = 0;

    const tick = (timeStamp: number) => {
      rafId = requestAnimationFrame(tick);

      if (timeStamp - prevTick < 100) {
        return;
      }

      prevTick = timeStamp;

      const data = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(data);

      const rms = calcRMS(data);
      const level = Math.max(0, Math.min(1, rms * 20));
      const levelValue = mapLevelToValue(level, 13);

      // console.log(
      //   track,
      //   analyserRef.current,
      //   sourceRef.current,
      //   ctxRef.current
      // );

      if (levelElem.current) {
        // console.log(rms, levelValue);
        levelElem.current.style.setProperty("--level", `${levelValue}px`);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      try {
        cancelAnimationFrame(rafId);
        sourceRef.current?.disconnect();
        ctxRef.current.close();
      } catch (err) {
        console.log("!!!!!!!!!!!");
      }
    };
  }, [track]);

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
              "--level": "13px",
              transition: "transform 0.2s",
              transform: "translateY(var(--level))",
            }}
          />
        </mask>
      </defs>
      <path d="M11.998 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4"></path>
      <g mask="url(#micLevel)">
        <path
          fill="green"
          d="M11.998 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4"
        ></path>
      </g>
      <path d="M6.406 13.628C6.233 13.261 5.88 13 5.474 13c-.62 0-1.074.588-.829 1.157a8.01 8.01 0 0 0 6.453 4.793v2.15a.9.9 0 1 0 1.8 0v-2.15a8.01 8.01 0 0 0 6.453-4.793c.245-.57-.209-1.157-.829-1.157-.405 0-.76.261-.932.628a6.178 6.178 0 0 1-11.184 0"></path>
    </svg>
  );
});
