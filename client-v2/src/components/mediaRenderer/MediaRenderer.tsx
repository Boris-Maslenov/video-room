import { memo, forwardRef } from "react";
import "./MediaRenderer.styles.scss";

const MediaRenderer = memo(
  forwardRef<HTMLVideoElement, {}>(function MediaRenderer({}, ref) {
    return (
      <video className="MediaRenderer" autoPlay playsInline ref={ref}></video>
    );
  })
);

export default MediaRenderer;
