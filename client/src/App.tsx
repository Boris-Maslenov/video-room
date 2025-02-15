import "./styles.css";
import { useEffect, useState, useContext } from "react";
import { useParams } from "./hooks/useParams";
import Room from "./components/room/Room";
import Dashboard from "./components/dashboard/Dashboard";
import RoomClient from "./room-client/RoomClient";
import { appendSearchParams } from "./utils/appendSearchParams";
import { RoomDataType, MediaSlotDataType } from "./room-client/types";
import { ErrorContext } from "./context/ErrorContext";
export const roomManager = new RoomClient();

const App = () => {
  const [room] = useParams("room");
  const [roomData, setRoomData] = useState<RoomDataType>();
  const [mediaSlots, setMediaSlots] = useState<MediaSlotDataType[]>([]);
  const { addError } = useContext(ErrorContext);

  const connectRoomHandle = async (peerName: string) => {
    await roomManager.joinToRoom(peerName, room);
  };

  const createNewRoomHandle = async (peerName: string) => {
    await roomManager.createAndJoinRoom(peerName);
  };

  useEffect(() => {
    roomManager.on("room-connected", (roomData) => {
      appendSearchParams("room", roomData.roomId);
      setRoomData(roomData);
      // TODO: mediaSlots брать из callback, а не из класса
      setMediaSlots(roomManager.mediaSlots);
    });

    roomManager.on("update-peers", (mediaSlots) => {
      setMediaSlots(mediaSlots);
    });

    roomManager.on("error", (error) => {
      addError(error);
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
    <div className="app__inner">
      {roomData ? (
        <Room room={room} mediaSlots={mediaSlots} />
      ) : (
        <Dashboard
          onCreateRoom={createNewRoomHandle}
          onConnectRoom={connectRoomHandle}
        />
      )}
    </div>
  );
};

export default App;
