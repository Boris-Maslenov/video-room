import "./ScreenSharePresentation.style.scss";
import { FC, memo, useEffect, useRef } from "react";
import classNames from "classnames";
import { CollapseIcon, ExpandIcon } from "../icons";

type PropType = {
  stream: MediaStream | null;
  isCollapsed: boolean;
  onToogleCollapsed: (isCollaps: boolean) => void;
};

const ScreenSharePresentation: FC<PropType> = memo(
  ({ stream, onToogleCollapsed, isCollapsed }) => {
    const videoElem = useRef<HTMLVideoElement>(null);
    useEffect(() => {
      if (videoElem.current && stream) {
        videoElem.current.srcObject = stream;
        videoElem.current.playsInline = true;
      }
    }, [stream]);
    return (
      <div
        className={classNames("ScreenSharePresentation", {
          collapsed: isCollapsed,
        })}
      >
        <video ref={videoElem} autoPlay playsInline></video>
        <div
          className="ScreenShareControl"
          title={!isCollapsed ? "Свернуть" : "Разверунть"}
        >
          <button onClick={() => onToogleCollapsed(!isCollapsed)}>
            {isCollapsed ? (
              <ExpandIcon width="18px" height="18px" />
            ) : (
              <CollapseIcon />
            )}
          </button>
        </div>
      </div>
    );
  }
);

export default ScreenSharePresentation;
