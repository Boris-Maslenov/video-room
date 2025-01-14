import { useRef, useEffect, RefObject, FC, memo } from "react";
import { MediaSlotDataType } from "../../room-client/types";

const ConsumerRenderer: FC<{ stream: MediaStream; isSelf: boolean }> = memo(
  ({ stream, isSelf }) => {
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
  }
);

type RoomProps = {
  room: string;
  mediaSlots: MediaSlotDataType[];
};

const Room: FC<RoomProps> = ({ mediaSlots }) => {
  console.log("render Room", "mediaSlots", mediaSlots);
  return (
    <ul className="media-streems">
      {mediaSlots.map((data, key) => (
        <ConsumerRenderer
          key={key + data.peerId}
          stream={data.mediaStream}
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
