import { useRef, RefObject } from "react";
import WebRTCClient from "./webrtc-client/WebRTCClient";

const webrtcclient = new WebRTCClient();

// import { io, type Socket } from "socket.io-client";
// const socket = io("ws://localhost:3001", { transports: ["websocket"] });

// socket.on("connect", async () => {
//   console.log("connect", socket.id);
// });

function App() {
  const videoEl = useRef() as RefObject<HTMLVideoElement>;
  return (
    <div>
      <ul>
        <li>
          <button
            onClick={() => {
              webrtcclient.send();
            }}
          >
            Отправить
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              console.log("subs");
              webrtcclient.subscribe();
            }}
          >
            принять
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              webrtcclient.getVideo();
            }}
          >
            получить видео
          </button>
        </li>
      </ul>
      <div className="">
        <video autoPlay id="video" ref={videoEl}></video>
      </div>
      <br />
      <div className="">
        <video autoPlay id="video2"></video>
      </div>
    </div>
  );
}

export default App;

// socket.to(socketId).emit()
