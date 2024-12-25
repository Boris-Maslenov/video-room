import { useState, useRef, useEffect, RefObject, FC } from "react";
import { Consumer } from "mediasoup-client/lib/types";

const ConsumerRenderer: FC<{ stream: MediaStream }> = ({ stream }) => {
  const mediaElRef = useRef() as RefObject<HTMLVideoElement>;

  useEffect(() => {
    if (mediaElRef.current) {
      mediaElRef.current.srcObject = stream;
      mediaElRef.current.playsInline = true;
    }
  }, [mediaElRef.current]);

  return (
    <li style={{ width: "200px", height: "200px" }}>
      <video
        id={stream.id}
        style={{ width: "100%", height: "200px" }}
        autoPlay
        ref={mediaElRef}
      ></video>
    </li>
  );
};

type RoomProps = {
  room: string;
  consumers: Consumer[];
};

const Room: FC<RoomProps> = ({ consumers }) => {
  console.log("Room", consumers);
  const [mediaTracks, setMediaTracks] = useState<MediaStream[]>([]);
  const mediaStreams = consumers.map(
    (consumer) => new MediaStream([consumer.track])
  );

  return (
    <ul
      style={{
        padding: 0,
        margin: 0,
        listStyleType: "none",
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {mediaStreams.map((stream, i) => (
        <ConsumerRenderer key={stream.id + i} stream={stream} />
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
