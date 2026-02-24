import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PlayingCardComponent } from "./components/PlayingCardComponent";
import type { GameState, Player } from "./Durak";
import { Check } from "lucide-react";

let socket: Socket;

export default function App()
{
  const [game, setGame] = useState<GameState | null>(null);
  const [name, setName] = useState("");
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  useEffect(() =>
  {
    // Get the current hostname (IP or domain) from the browser's address bar
    const host = window.location.hostname;

    // Connect to the same host on port 3000
    socket = io(`http://${host}:3000`);

    socket.on("connect", () =>
    {
      console.log("Connected:", socket.id);

      // Automatically attempt to rejoin if there is a saved myPlayerId
      const savedId = localStorage.getItem("myPlayerId");
      if (!savedId) return;

      rejoinPlayer(savedId);
    });

    socket.on("gameState", (state: GameState) =>
    {
      setGame(state);
    });

    return () =>
    {
      socket.disconnect();
    };
  }, []);

  // -------------------------
  // Actions
  // -------------------------

  function joinNewPlayer()
  {
    if (!name.trim()) return;

    socket.emit("joinNewPlayer", name, (response: { success: boolean; playerId?: string }) =>
    {
      if (response.success && response.playerId)
      {
        setMyPlayerId(response.playerId);
        localStorage.setItem("myPlayerId", response.playerId);
      }
    });
  };

  function rejoinPlayer(id: string)
  {
    socket.emit("rejoinPlayer", id, (response: { success: boolean }) =>
    {
      if (response.success)
      {
        setMyPlayerId(id);
      } else
      {
        localStorage.removeItem("myPlayerId");
      }
    });
  };

  const toggleReady = () =>
  {
    socket.emit("toggleReady");
  };

  if (!game)
  {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-900 text-white">
        Connecting...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-neutral-950 text-white relative overflow-hidden">
      {/* Table Container */}
      <div className="absolute inset-0 flex items-center justify-center">

        {/* 3D Wrapper: This holds both the top and the bottom layer */}
        <div className="relative w-[90vmin] h-[90vmin] flex items-center justify-center">

          {/* Bottom Layer (Shadow/Reflection) */}
          <div className="absolute w-full h-full rounded-full perspective-near rotate-x-320 bg-white/3 border-2 border-white/3 translate-y-[3vmin]">
            {/* This copy is shifted down (translate-y-8) and made transparent (bg-white/5) */}
          </div>

          {/* Top Layer (Main Table Surface) */}
          <div className="relative w-full h-full rounded-full perspective-near rotate-x-320 bg-[#111111] shadow-2xl shadow-[#222222] inset-shadow-sm inset-shadow-[#888888] border-2 border-[#333333]">
            {/* Main Surface */}
          </div>

          {/* Center Content: Absolutely positioned relative to the center of the table */}
          <div className="absolute z-10">
            <Center
              game={game}
              myPlayerId={myPlayerId}
              name={name}
              setName={setName}
              join={joinNewPlayer}
            />
          </div>
        </div>

        {/* Players: Wrapped around the table */}
        {game.players.map((player, index) => (
          <PlayerSeat
            key={player.id}
            player={player}
            index={index}
            total={game.players.length}
            rejoinPlayer={rejoinPlayer}
            myPlayerId={myPlayerId}
          />
        ))}
      </div>

      {/* Bottom Controls */}
      {game.phase === "waiting" && myPlayerId != null && (
        <div className={`absolute bottom-6 left-0 right-0 flex justify-center`}>
          <Button
            onClick={toggleReady}
            className={`${game.players.find((p) => p.id === myPlayerId)?.ready ? "bg-green-300 hover:bg-green-400" : ""}`}
          >
            Ready {game.players.find((p) => p.id === myPlayerId)?.ready && <Check className="ml-2 scale-150" />}
          </Button>
        </div>
      )}
    </div>
  );
}

function Center({
  game,
  myPlayerId,
  name,
  setName,
  join,
}: {
  game: GameState;
  myPlayerId: string | null;
  name: string;
  setName: (v: string) => void;
  join: () => void;
})
{
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
      {/* Center "Join Game" Popup*/}
      {game.phase === "waiting" && myPlayerId === null && (
        <div className="absolute inset-0 left-70 top-50 flex flex-col items-center justify-center gap-4 z-10">
          <Card className="p-6 bg-neutral-800 text-white w-72 space-y-4">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={join} className="w-full">
              Join Game
            </Button>
          </Card>
        </div>
      )}

      {/* Deck Container */}
      {game.deck.length > 0 && (
        <div className="relative left-80 bottom-20">
          <div className="text-5xl text-neutral-300">
            {game.deck.length}
          </div>

          <div className="relative">
            {game.deck.map((card, i) =>
            {
              const isFirst = i === 0;

              return (
                <div
                  key={card.id}
                  className="absolute"
                  style={{
                    // Offsets each card slightly to the right and down
                    top: `${i * 1}px`,
                    left: `${i * 3}px`,
                    transform: "translate(-25%, 0%)",
                    zIndex: i,
                  }}
                >
                  <PlayingCardComponent
                    key={card.id}
                    card={card}
                    // Only the first card gets the 90-degree rotation
                    className={isFirst ? "rotate-90 -left-25" : ""}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Cards */}
      <div className="flex gap-6">
        {game.table.map((pair, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <PlayingCardComponent
              key={pair.attackCard.id}
              card={pair.attackCard}
            />
            {pair.defenseCard && (
              <PlayingCardComponent
                key={pair.defenseCard.id}
                card={pair.defenseCard}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerSeat({
  player,
  index,
  total,
  rejoinPlayer,
  myPlayerId,
}: {
  player: Player;
  index: number;
  total: number;
  rejoinPlayer: (id: string) => void;
  myPlayerId: string | null;
})
{
  const radius = 360;
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;

  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle) * 0.8 + 10;

  return (
    <div
      className="absolute flex flex-col items-center gap-2"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className={`text-3xl font-medium ${player.connectionStatus == "disconnected" ? "text-gray-400 italic" : ""} ${player.ready ? "text-green-300" : ""}`}>
        {player.name}
      </div>

      {(player.connectionStatus == "disconnected") && (
        <>
          <div className="text-xs text-neutral-400 mt-1">
            {player.connectionStatus}
          </div>

          {myPlayerId === null && (
            <Button onClick={() => rejoinPlayer(player.id)} className="w-fit">
              Rejoin
            </Button>
          )}
        </>
      )}

      <div className="flex gap-1 mt-1 relative">
        {player.id === myPlayerId ?
          player.hand.map((card) => (
            <PlayingCardComponent
              key={card.id}
              card={card}
            />
          )
          ) : (
            player.hand.map((card, i) => (
              <div
                className="absolute"
                style={{
                  // Offsets each card slightly to the right and down
                  top: `${i * 3}px`,
                  left: `${i * 15}px`,
                  rotate: `${(i - 3) * 5}deg`,
                  transform: "translate(0%, 0%)",
                  zIndex: i,
                }}
              >
                <PlayingCardComponent
                  key={card.id}
                  card={card}
                />
              </div>
            )
            )
          )
        }
      </div>
    </div>
  );
}
