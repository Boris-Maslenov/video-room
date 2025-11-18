import { FC } from "react";
import { IconsProps } from "./IconTypes";
import { NetworkQuality } from "../../stores/MediasoupClientStore";

type PropsType = {
  quality: NetworkQuality | null;
};

export const QualitySignalIcon: FC<IconsProps & PropsType> = ({
  width = "24px",
  height = "24px",
  quality,
}) => {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height={width}
      width={height}
      xmlns="http://www.w3.org/2000/svg"
    >
      {(quality === "very-bad" ||
        quality === "bad" ||
        quality === "medium" ||
        quality === "good") && <path d="M2 20h.01"></path>}
      {(quality === "bad" || quality === "medium" || quality === "good") && (
        <path d="M7 20v-4"></path>
      )}
      {(quality === "medium" || quality === "good") && (
        <path d="M12 20v-8"></path>
      )}
      {quality === "good" && <path d="M17 20V8"></path>}
    </svg>
  );
};
