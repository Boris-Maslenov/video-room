import "./styles.css";
import { useEffect, useState } from "react";
import { useParams } from "./hooks/useParams";
import Room from "./components/room/Room";
import Dashboard from "./components/dashboard/Dashboard";
import RoomClient from "./room-client/RoomClient";
import { appendSearchParams } from "./utils/appendSearchParams";
import { RoomDataType, MediaStreamDataType } from "./room-client/types";
import { debaunce } from "./utils/debounce";

export const roomManager = new RoomClient();

roomManager.on("update-peers", () => {});

const App = () => {
  const [room] = useParams("room");
  const [roomData, setRoomData] = useState<RoomDataType>();
  const [consumersData, setConsumersData] = useState<MediaStreamDataType[]>([]);

  const connectToRoomHandle = async () => {
    await roomManager.joinToRoom();
  };
  const createNewRoomHandle = async () => {
    await roomManager.createAndJoinRoom();
  };

  useEffect(() => {
    roomManager.on("room-connected", (roomData) => {
      console.log("room-connected");
      const { roomId } = roomData;
      appendSearchParams("room", roomId);
      setRoomData(roomData);
      setConsumersData(roomManager.getMediaStreamsData());
    });

    roomManager.on(
      "update-peers",
      debaunce((mediaStreams: MediaStreamDataType[]) => {
        setConsumersData(mediaStreams);
      }, 1000)
    );

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
