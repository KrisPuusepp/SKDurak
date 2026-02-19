import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PlayingCardComponent } from "./components/PlayingCardComponent";
import type { GameState, Player } from "./Durak";

let socket: Socket;

export default function App()
{
  const [game, setGame] = useState<GameState | null>(null);
  const [name, setName] = useState("");
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  useEffect(() =>
  {
    socket = io("http://localhost:3000");

    socket.on("connect", () =>
    {
      console.log("Connected:", socket.id);
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

  const join = () =>
  {
    if (!name.trim()) return;
    socket.emit("joinNewPlayer", name);
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
    <div className="h-screen w-screen bg-neutral-900 text-white relative overflow-hidden">
      {/* Table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[600px] h-[600px] rounded-full bg-green-900 shadow-2xl border-8 border-green-800">
          {/* Center Content */}
          {game.phase === "waiting" ? (
            <CenterWaiting
              name={name}
              setName={setName}
              join={join}
            />
          ) : (
            <CenterActive game={game} />
          )}

          {/* Players */}
          {game.players.map((player, index) => (
            <PlayerSeat
              key={player.id}
              player={player}
              index={index}
              total={game.players.length}
            />
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      {game.phase === "waiting" && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <Button onClick={toggleReady}>Toggle Ready</Button>
        </div>
      )}
    </div>
  );
}

function CenterWaiting({
  name,
  setName,
  join,
}: {
  name: string;
  setName: (v: string) => void;
  join: () => void;
})
{
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
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
  );
}

function CenterActive({ game }: { game: GameState })
{
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
      {/* Deck */}
      <div className="flex flex-col items-center gap-2">
        <PlayingCardComponent />
        <div className="text-sm text-neutral-300">
          {game.deck.length} cards
        </div>
      </div>

      {/* Table Cards */}
      <div className="flex gap-6">
        {game.table.map((pair, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <PlayingCardComponent
              rank={pair.attackCard.rank}
              suit={pair.attackCard.suit}
            />
            {pair.defenseCard && (
              <PlayingCardComponent
                rank={pair.defenseCard.rank}
                suit={pair.defenseCard.suit}
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
}: {
  player: Player;
  index: number;
  total: number;
})
{
  const radius = 260;
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;

  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="text-sm font-medium">
        {player.name}
      </div>

      <div className="flex gap-1 mt-1">
        {player.hand.map((card) => (
          <PlayingCardComponent
            key={card.id}
            rank={card.rank}
            suit={card.suit}
          />
        ))}
      </div>

      <div className="text-xs text-neutral-400 mt-1">
        {player.connectionStatus}
      </div>
    </div>
  );
}
