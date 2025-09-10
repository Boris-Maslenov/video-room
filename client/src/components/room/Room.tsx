import { FC } from "react";
import { MediaSlotDataType } from "../../room-client/types";
import Button from "../reused/button/Button";
import SimpleBar from "simplebar-react";
import { roomManager } from "../../App";

import {
  MicOnIcon,
  MicOffIcon,
  CameraOnIcon,
  CameraOffIcon,
  PhoneIcon,
  ShareDisplayOff,
  ShareLinkIcon,
} from "../icons";
import ConsumerRenderer from "./ConsumerRenderer";

type RoomProps = {
  room: string;
  mediaSlots: MediaSlotDataType[];
};

// const isTrackActive = (track?: MediaStreamTrack) => {
//   if (!track) return false;
//   if (!track.onmute && track.enabled && track.readyState === "live") {
//     return true;
//   }
// };

const Room: FC<RoomProps> = ({ mediaSlots }) => {
  console.log("render Room", "mediaSlots", mediaSlots);

  const endCallHandle = () => {
    roomManager.deletePeer();
  };

  // const videoTrackIsActive = isTrackActive(
  //   roomManager.localMediaStream?.getVideoTracks()[0]
  // );

  // const audioTrackIsActive = isTrackActive(
  //   roomManager.localMediaStream?.getAudioTracks()[0]
  // );

  const videoChangeHandle = () => {
    roomManager.videoStartStop();
  };

  const audioChangeHandle = () => {
    roomManager.audioStartStop();
  };

  return (
    <div className="room">
      <div className="room__media">
        <SimpleBar
          style={{
            maxHeight: "calc(100vh - var(--actin-height) - var(--row-gap))",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <div className="media-streems">
            {mediaSlots.map((data, key) => (
              <ConsumerRenderer
                key={key + data.peerId}
                stream={data.mediaStream}
                isSelf={data?.isSelf ?? false}
                peerName={data.peerName}
                micOn={data.mediaState.micOn}
              />
            ))}
          </div>
        </SimpleBar>
      </div>
      <div className="room__action">
        <div className="action-panel">
          <Button
            icon={true}
            onClick={() => {}}
            title="Скопировать ссылку"
            disabled={true}
          >
            <ShareLinkIcon />
          </Button>
          <div className="action-panel__center-group">
            <Button
              icon={true}
              onClick={audioChangeHandle}
              title={
                roomManager.localMediaState.micOn
                  ? "Выключить микрофон"
                  : "Отключить микрофон"
              }
            >
              {roomManager.localMediaState.micOn ? (
                <MicOnIcon />
              ) : (
                <MicOffIcon />
              )}
            </Button>

            <Button
              icon={true}
              onClick={videoChangeHandle}
              title={
                roomManager.localMediaState.camOn
                  ? "Отключить камеру"
                  : "Включить камеру"
              }
            >
              {roomManager.localMediaState.camOn ? (
                <CameraOnIcon />
              ) : (
                <CameraOffIcon />
              )}
            </Button>

            <Button
              icon={true}
              onClick={() => {}}
              title="Демонстрация"
              disabled={true}
            >
              <ShareDisplayOff />
            </Button>
          </div>

          <Button
            icon={true}
            title="Завершить сеанс"
            onClick={endCallHandle}
            style={{
              marginLeft: "auto",
            }}
          >
            <PhoneIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Room;
