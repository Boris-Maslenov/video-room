import "./styles.css";
import { useEffect, useState } from "react";
import { useParams } from "./hooks/useParams";
import Room from "./components/room/Room";
import Dashboard from "./components/dashboard/Dashboard";
import RoomClient from "./room-client/RoomClient";
import { appendSearchParams } from "./utils/appendSearchParams";
import { RoomDataType, MediaSlotDataType } from "./room-client/types";
// import { debaunce } from "./utils/debounce";

export const roomManager = new RoomClient();

roomManager.on("update-peers", () => {});

const App = () => {
  const [room] = useParams("room");
  const [roomData, setRoomData] = useState<RoomDataType>();
  const [mediaSlots, setMediaSlots] = useState<MediaSlotDataType[]>([]);

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
      console.log(1);
      setMediaSlots(roomManager.mediaSlots);
    });

    roomManager.on("update-peers", (mediaSlots) => {
      console.log("update-peers", "setConsumersData");
      console.log(2);
      setMediaSlots(mediaSlots);
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
        <Room room={room} mediaSlots={mediaSlots} />
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
