import { FC } from "react";
import { IconsProps } from "./IconTypes";

export const MicOffIcon: FC<IconsProps> = ({
  width = "24px",
  height = "24px",
}) => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 24 24"
      height={height}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.998 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4"></path>
      <path d="M6.406 13.628C6.233 13.261 5.88 13 5.474 13c-.62 0-1.074.588-.829 1.157a8.01 8.01 0 0 0 6.453 4.793v2.15a.9.9 0 1 0 1.8 0v-2.15a8.01 8.01 0 0 0 6.453-4.793c.245-.57-.209-1.157-.829-1.157-.405 0-.76.261-.932.628a6.178 6.178 0 0 1-11.184 0"></path>
      <path d="M1.39355 2.80761L2.80777 1.3934L22.6068 21.1924L21.1925 22.6066Z" />
    </svg>
  );
};
