import { useState } from "react";
import "./styles.css";
import { useParams } from "./hooks/useParams";
import Room from "./components/room/Room";
import Dashboard from "./components/dashboard/Dashboard";
// import { apiSend } from "./api/api";
import RoomClient from "./room-client/RoomClient";
import { appendSearchParams } from "./utils/appendSearchParams";
import { ConnectStatysType } from "./components/room/Room.types";

export const roomManager = new RoomClient();

const App = () => {
  const [connectStatus, setConnectStatus] =
    useState<ConnectStatysType>("disconnect");
  const [_, setUpdate] = useState(true);
  const [room] = useParams("room");

  const connectToRoomHandle = async () => {
    // const roomId = await roomManager.connectToRoom();
    // console.log("connectToRoomHandle", roomId);
    // if (roomId) {
    //   setConnectStatus("connect");
    //   appendSearchParams("room", roomId);
    // }

    await roomManager.connectToRoom();

    setConnectStatus("connect");
    appendSearchParams("room", "0");
    console.log(roomManager.activeConsumers);
  };

  const createNewRoomHandle = async () => {
    // const roomId = await roomManager.createAndConnectRoom();
    // if (roomId) {
    //   appendSearchParams("room", roomId);
    //   // setUpdate((state) => !state);
    //   setConnectStatus("connect");
    // }

    roomManager.createAndConnectRoom();
  };

  return (
    <div className="app">
      <div className="app-inner">
        {room && connectStatus === "connect" ? (
          <Room room={room} consumers={roomManager.activeConsumers ?? []} />
        ) : (
          <Dashboard
            onCreateRoom={createNewRoomHandle}
            onConnectToRoom={connectToRoomHandle}
          />
        )}
      </div>
    </div>
  );
};

export default App;
