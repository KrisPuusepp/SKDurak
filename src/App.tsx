import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PlayingCardComponent } from "./components/PlayingCardComponent";
import type { GameState, Player } from "./Durak";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
          <div className="absolute w-full h-full rounded-full perspective-near rotate-x-320 bg-white/3 border-[0.35vmin] border-white/3 translate-y-[3vmin]">
            {/* This copy is shifted down (translate-y-8) and made transparent (bg-white/5) */}
          </div>

          {/* Top Layer (Main Table Surface) */}
          <div className="relative w-full h-full rounded-full perspective-near rotate-x-320 bg-[#111111] shadow-2xl shadow-[#222222] inset-shadow-sm inset-shadow-[#888888] border-[0.35vmin] border-[#333333]">
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
        {(() =>
        {
          if (!myPlayerId) return game.players;

          const myIndex = game.players.findIndex(p => p.id === myPlayerId);
          if (myIndex === -1) return game.players;

          return [
            ...game.players.slice(myIndex),
            ...game.players.slice(0, myIndex),
          ];
        })().map((player, index) => (
          <PlayerSeat
            key={player.id}
            game={game}
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
    <div className="absolute inset-0 flex flex-col items-center justify-center">
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
        <div className="relative left-[35vmin] bottom-[15vmin] flex flex-col items-center gap-[0.5vmin]">
          <div className="text-5xl text-neutral-300 text-shadow-md text-shadow-neutral-500 rounded-full">
            {game.deck.length}
          </div>

          <div className="relative scale-75">
            {game.deck.map((card, i) =>
            {
              const isFirst = i === 0;

              return (
                <div
                  key={card.id}
                  className="absolute"
                  style={{
                    // Offsets each card slightly to the right and down
                    top: `${i * 0.15}vmin`,
                    left: `${i * 0.35}vmin`,
                    transform: "translate(-50%, 0%)",
                    zIndex: i,
                  }}
                >
                  <PlayingCardComponent
                    key={card.id}
                    card={card}
                    // Only the first card gets the 90-degree rotation
                    className={isFirst ? "" : "-rotate-90 top-[10.5vmin] -rotate-90 left-[1.5vmin]"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Cards */}
      <div className="flex gap-[1vmin]">
        {game.table.map((pair, i) => (
          <div key={i} className="flex flex-col items-center">
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
  game,
  player,
  index,
  total,
  rejoinPlayer,
  myPlayerId,
}: {
  game: GameState;
  player: Player;
  index: number;
  total: number;
  rejoinPlayer: (id: string) => void;
  myPlayerId: string | null;
})
{
  const SUIT_ORDER = ["spades", "hearts", "diamonds", "clubs"];

  const MAX_PER_ROW = 8;

  // We define the angle in degrees for CSS
  const angle = (index / total) * 360 + 90;

  // We use vmin for the radius so it scales automatically
  const radiusX = "42vmin";
  const radiusY = "35vmin";

  const sortedHand = [...player.hand].sort((a, b) =>
  {
    if (a.suit === null || b.suit === null || a.rank === null || b.rank === null)
    {
      return 0;
    }

    const aIsTrump = a.suit === game.trumpSuit;
    const bIsTrump = b.suit === game.trumpSuit;

    // 1. Trumps first
    if (aIsTrump !== bIsTrump)
    {
      return aIsTrump ? -1 : 1;
    }

    // 2. Higher rank first
    if (a.rank !== b.rank)
    {
      return b.rank - a.rank;
    }

    // 3. Suit tie-breaker
    return (
      SUIT_ORDER.indexOf(a.suit) -
      SUIT_ORDER.indexOf(b.suit)
    );
  })

  const trumpCards = sortedHand.filter(c => c.suit === game.trumpSuit);
  const nonTrumpCards = sortedHand.filter(c => c.suit !== game.trumpSuit);

  function chunkCards<T>(array: T[], size: number): T[][]
  {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size)
    {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  const nonTrumpRows = chunkCards(nonTrumpCards, MAX_PER_ROW);

  return (
    <div
      className="absolute flex flex-col items-center gap-[0.5vmin]"
      style={{
        left: `calc(50% + ${radiusX} * cos(${angle}deg))`,
        top: `calc(50% + ${radiusY} * sin(${angle}deg))`,
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

      <div className="flex flex-row gap-[1vmin] mt-[1vmin]">
        {player.id === myPlayerId ?
          (
            <>
              {/* Trumps */}
              <div className="flex flex-row gap-[1vmin]">
                {trumpCards.map(card => (
                  <PlayingCardComponent
                    key={card.id}
                    card={card}
                  />
                ))}
              </div>

              {/* Divider */}
              <AnimatePresence>
                {trumpCards.length > 0 && nonTrumpCards.length > 0 && (
                  <motion.div
                    key="card-divider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-inherit w-[0.25vmin] bg-neutral-200/30 rounded-full mx-[0.75vmin]"
                  />
                )}
              </AnimatePresence>


              {/* Others */}
              <div
                className="flex flex-col gap-[1vmin]"
              >
                {nonTrumpRows.map((row, rowIndex) => (
                  <div className="flex flex-row gap-[1vmin]">
                    {row.map(card => (
                      <PlayingCardComponent
                        key={card.id}
                        card={card}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="scale-[0.7]">
              {player.hand.map((card, i) => (
                <div
                  className="absolute"
                  style={{
                    // Offsets each card slightly to the right and down
                    left: `${((i + 1 - player.hand.length / 2) * 1.75) - 7.5}vmin`,
                    top: `${i * 0.2}vmin`,
                    rotate: `${(i - 3) * 4}deg`,
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
              )}
            </div>
          )
        }
      </div>
    </div>
  );
}
