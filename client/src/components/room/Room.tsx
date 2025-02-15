import { FC } from "react";
import { MediaSlotDataType } from "../../room-client/types";
import Button from "../reused/button/Button";
import SimpleBar from "simplebar-react";

import {
  MicOnIcon,
  CameraOnIcon,
  PhoneIcon,
  ShareDisplayOff,
  ShareLinkIcon,
} from "../icons";
import ConsumerRenderer from "./ConsumerRenderer";

type RoomProps = {
  room: string;
  mediaSlots: MediaSlotDataType[];
};

const Room: FC<RoomProps> = ({ mediaSlots }) => {
  console.log("render Room", "mediaSlots", mediaSlots);
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
                isSelf={data.isSelf}
                peerName={data.peerName}
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
            <Button icon={true} onClick={() => {}} title="Отключить микрофон">
              <MicOnIcon />
            </Button>

            <Button icon={true} onClick={() => {}} title="Отключить камеру">
              <CameraOnIcon />
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
            onClick={() => {}}
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

// TODO: остановка видеопотоков
// function stopVideoStream(videoElement) {
//   const stream = videoElement.srcObject;
//   if (stream) {
//     const tracks = stream.getTracks();
//     tracks.forEach(track => track.stop()); // Останавливаем все треки
//     videoElement.srcObject = null;
//   }
// }
