import { CSSProperties } from "react";

export const mainStyle: Record<"content" | "overlay", CSSProperties> = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "476px",
    height: "250px",
    display: "flex",
    flexDirection: "column",
    padding: "15px",
    overflow: "unset",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
};
