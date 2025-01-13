import { useRef, useEffect, RefObject, FC } from "react";
import { MediaStreamDataType } from "../../room-client/types";

const ConsumerRenderer: FC<{ stream: MediaStream; isSelf: boolean }> = ({
  stream,
  isSelf,
}) => {
  const mediaElRef = useRef() as RefObject<HTMLVideoElement>;

  useEffect(() => {
    if (mediaElRef.current) {
      mediaElRef.current.srcObject = stream;
      mediaElRef.current.playsInline = true;
    }
  }, [mediaElRef.current]);

  return (
    <li className={"media-block"}>
      <video
        className={isSelf ? "media-elem media-elem__self" : "media-elem"}
        autoPlay
        ref={mediaElRef}
      ></video>
    </li>
  );
};

type RoomProps = {
  room: string;
  consumersData: MediaStreamDataType[];
};

const Room: FC<RoomProps> = ({ consumersData }) => {
  console.log("Room", "consumersData:", consumersData);

  return (
    <ul className="media-streems">
      {consumersData.map((data, key) => (
        <ConsumerRenderer
          key={key + data.peerId}
          stream={new MediaStream(data.mediaTracks)}
          isSelf={data.isSelf}
        />
      ))}
    </ul>
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
