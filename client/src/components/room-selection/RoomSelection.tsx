import { useState } from "react";
import RoomClient from "../../room-client/RoomClient";
import "../../styles.css";
import { Consumer, Producer } from "mediasoup-client/lib/types";

const room = new RoomClient();

// interface Peer {
//   id: string;
//   roomId: string;
//   ioId: string;
//   name: string;
//   reducers: unknown[];
//   consumers: unknown[];
// }

// interface Room {
//   id: string;
//   peers: Peer[];
// }

interface CreateRoomResponse {
  peerId: string;
  roomId: string;
  ioId: string;
  status: "created" | "error";
}

interface ConnectRoomResponse {
  peername: string;
  peerId: string;
  roomId: string;
  ioId: string;
  status: "connected" | "error";
}

interface SFUState {
  peername: string;
  peerId: string;
  roomId: string;
  ioId: string;
  serverProducerIds: string[];
}

function RoomSelection() {
  const [SFUState, setSFUState] = useState<SFUState | null>(null);

  const createNewRoomHandle = async () => {
    try {
      const response = await socketSend<SFUState>("createRoom", {
        peer: {
          name: "test peer",
          ioId: socket.id,
        },
      });
      console.log("response", response);
      setSFUState(response);
    } catch (err) {
      console.log(err);
    }

    // setSFUState(response);

    // if (response.peerId && response.roomId) {
    //   webrtcclient.send(response.peerId, response.roomId);
    // }
  };

  const connectPeerHandle = async () => {
    try {
      const response = await socketSend<ConnectRoomResponse>("connectRoom", {
        name: "test peer",
        ioId: socket.id,
        roomId: "0",
      });
      console.log("response", response);
      setSFUState({
        peername: response.peername,
        peerId: response.peerId,
        roomId: response.roomId,
        ioId: response.roomId,
        serverProducerIds: [],
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <button style={{ margin: "5px" }} onClick={createNewRoomHandle}>
        1 Создать новую видеокомнату
      </button>
      <button style={{ margin: "5px" }} onClick={connectPeerHandle}>
        2 Подключиться к комнате
      </button>
      <button
        style={{ margin: "5px" }}
        onClick={() => room.produce(SFUState!.roomId, SFUState!.peerId)}
      >
        3 Отправить Media
      </button>
      <button
        style={{ margin: "5px" }}
        onClick={() => room.subscribe(SFUState!.roomId, SFUState!.peerId)}
      >
        4 Получить меди
      </button>
    </div>
  );
}

export default RoomSelection;

// socket.to(socketId).emit()
