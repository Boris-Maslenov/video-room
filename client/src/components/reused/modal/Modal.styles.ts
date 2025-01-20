import { CSSProperties } from "react";

export const mainStyle: { content: CSSProperties; overlay: CSSProperties } = {
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

export const closeButtonStyle: CSSProperties = {
  cursor: "pointer",
  position: "absolute",
  right: "-20px",
  top: "-20px",
  background: "#B9BBDE",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  border: 0,
  boxShadow:
    "0 0 0 1px rgba(0, 0, 0, .05), 0 1px 0 1px rgba(0, 0, 0, .05), 0 4px 6px 0 rgba(0, 0, 0, .05)",
};

export const contentBlockStyle = { flex: "1 0 auto" };

export const footerBlockStyle = { flex: "0 1 0%" };
