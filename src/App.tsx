import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { PlayingCard } from "./components/PlayingCard";

let socket: Socket;

function App()
{
  const [message, setMessage] = useState<string>("Not connected");

  useEffect(() =>
  {
    socket = io("http://localhost:3000");

    socket.on("connect", () =>
    {
      console.log("Connected:", socket.id);
    });

    socket.on("message", (msg: string) =>
    {
      setMessage(msg);
    });

    socket.on("pong", (msg: string) =>
    {
      setMessage(msg);
    });

    return () =>
    {
      socket.disconnect();
    };
  }, []);

  const sendPing = () =>
  {
    socket.emit("ping");
  };

  return (
    <div className="h-screen w-screen bg-neutral-900">

      <div className=" p-2 flex justify-around items-center z-10">
        <PlayingCard rank="6" suit="diamonds" />
        <PlayingCard rank="7" suit="diamonds" />
        <PlayingCard rank="8" suit="clubs" />
        <PlayingCard rank="9" suit="clubs" />
        <PlayingCard rank="10" suit="spades" />
        <PlayingCard rank="J" suit="spades" />
        <PlayingCard rank="Q" suit="hearts" />
        <PlayingCard rank="K" suit="hearts" />
        <PlayingCard rank="A" suit="hearts" />
      </div>
    </div>
  );
}

export default App;
