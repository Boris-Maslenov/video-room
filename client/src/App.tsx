import { useEffect, useState } from "react";
import "./styles.css";
import { useParams } from "./hooks/useParams";
import Room from "./components/room/Room";
import Dashboard from "./components/dashboard/Dashboard";
// import { apiSend } from "./api/api";
import RoomClient from "./room-client/RoomClient";
import { appendSearchParams } from "./utils/appendSearchParams";
// import { ConnectStatysType } from "./components/room/Room.types";
import { RoomDataType, MediaStreamData } from "./room-client/types";
import { Consumer } from "mediasoup-client/lib/Consumer";

export const roomManager = new RoomClient();

roomManager.on("room-connected", () => console.log("room-connected"));
roomManager.on("room-connecting", () => console.log("room-connecting"));
// roomManager.on("update-peers", (activeConsumers: Consumer[]) =>
//   console.log("update-peers", activeConsumers)
// );
// roomManager.on("produce", () => console.log("produce"));

const App = () => {
  const [room] = useParams("room");
  const [roomData, setRoomData] = useState<RoomDataType>();
  const [consumersData, setConsumersData] = useState<MediaStreamData[]>([]);

  const connectToRoomHandle = async () => {
    await roomManager.joinToRoom();
  };
  const createNewRoomHandle = async () => {
    await roomManager.createAndJoinRoom();
  };

  useEffect(() => {
    roomManager.on("room-connected", (roomData: RoomDataType) => {
      const { roomId } = roomData;
      appendSearchParams("room", roomId);
      setRoomData(roomData);
      setConsumersData(roomManager.getMediaStreamsData());
    });

    roomManager.on("update-peers", (mediaStreams: MediaStreamData[]) => {
      setConsumersData(mediaStreams);
    });

    return () => {
      roomManager.leaveRoom();
    };
  }, []);

  useEffect(() => {
    const exitRoom = () => roomManager.leaveRoom();
    window.addEventListener("unload", exitRoom);
    return () => {
      window.removeEventListener("unload", exitRoom);
    };
  }, []);

  return (
    <div className="app-inner">
      {roomData ? (
        <Room room={room} consumersData={consumersData} />
      ) : (
        <Dashboard
          onCreateRoom={createNewRoomHandle}
          onConnectToRoom={connectToRoomHandle}
        />
      )}
    </div>
  );
};

export default App;
