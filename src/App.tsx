import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PlayingCardComponent } from "./components/PlayingCardComponent";
import { canBeat, validAttackCard, type GameState, type Player, type PlayingCard } from "./Durak";
import { Check, Star } from "lucide-react";
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

        <div className="absolute -translate-y-[8vmin]">
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
          })().map((player, rotationIndex) => (
            <PlayerSeat
              key={player.id}
              game={game}
              player={player}
              rotationIndex={rotationIndex}
              rejoinPlayer={rejoinPlayer}
              myPlayerId={myPlayerId}
            />
          ))}
        </div>
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
        <div className="flex flex-col items-center justify-center gap-4 z-10">
          <Card className="p-6 w-72 space-y-4">
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

      {game.players.findIndex((p) => p.id === myPlayerId) === game.attackerIndex && game.phase === "attacking" && game.table.length > 0 ? (
        <Button
          variant="destructive"
          onClick={() => socket.emit("passAttack")}
          className="absolute left-[24vmin] -top-[5vmin] w-[14vmin] h-[14vmin] z-100 text-2xl"
        >
          Pass
        </Button>
      ) : null}

      {/* Deck Container */}
      {game.deck.length > 0 && (
        <div className="absolute left-[25vmin] bottom-[15vmin] flex flex-row items-center gap-[0.5vmin]">
          <div className="absolute text-[5vmin] text-neutral-300 text-shadow-md text-shadow-neutral-500 rounded-full z-10 -left-[14vmin] top-[11vmin] text-right w-[10vmin]">
            {game.deck.length}x
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
      <div className="flex flex-row absolute bottom-[0vmin] -left-[42vmin] scale-80 w-full">
        {game.table.map((pair, i) => (
          <div key={i} className="relative">
            <PlayingCardComponent
              key={pair.attackCard.id}
              card={pair.attackCard}
            />
            {pair.defenseCard ? (
              <div className="absolute top-[7.4vmin] z-10">
                <PlayingCardComponent
                  key={pair.defenseCard.id}
                  card={pair.defenseCard}
                />
              </div>
            ) : (game.phase === "defending" && game.players.findIndex((p) => p.id === myPlayerId) === game.defenderIndex ? (
              <Button
                variant="destructive"
                onClick={() => socket.emit("forfeitDefense")}
                className="absolute w-full mt-[1vmin] h-[6vmin] z-100 text-2xl"
              >
                Take
              </Button>
            ) : null)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerSeat({
  game,
  player,
  rotationIndex: index,
  rejoinPlayer,
  myPlayerId,
}: {
  game: GameState;
  player: Player;
  rotationIndex: number;
  rejoinPlayer: (id: string) => void;
  myPlayerId: string | null;
})
{
  const SUIT_ORDER = ["spades", "hearts", "diamonds", "clubs"];

  // We define the angle in degrees for CSS
  const angle = (index / game.players.length) * 360 + 90;

  // We use vmin for the radius so it scales automatically
  const radiusX = "45vmin";
  const radiusY = "40vmin";

  const sortedHand = player.id == myPlayerId ? [...player.hand].sort((a, b) =>
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
  }) : [];

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

  let maxPerRow = Math.max(4, 8 - trumpCards.length, 8 - nonTrumpCards.length);

  const trumpRows = chunkCards(trumpCards, maxPerRow);
  const nonTrumpRows = chunkCards(nonTrumpCards, maxPerRow);

  // When defending
  const toDefend: PlayingCard | null = (game.phase == "defending" && game.defenderIndex === player.index && game.table.length > 0) ? game.table[game.table.length - 1].attackCard : null;

  function playCard(card: PlayingCard)
  {
    socket.emit("playCard", card.id);
  }

  return (
    <div
      className="absolute flex flex-col items-center gap-[0.5vmin]"
      style={{
        left: `calc(50% + ${radiusX} * cos(${angle}deg))`,
        top: `calc(50% + ${radiusY} * sin(${angle}deg))`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className={`text-3xl font-medium text-nowrap flex gap-[0.5vmin] flex-row ${player.connectionStatus == "disconnected" ? "text-gray-400 italic" : ""} ${player.ready ? "text-green-300" : ""} ${(trumpRows.length > 2 || nonTrumpRows.length > 2) ? "translate-y-[-10vmin]" : ""}`}>
        {player.name} {" "}
        {game.winnerOrder.indexOf(player.id) >= 0 && (
          <div className="flex flex-row gap-[0.5vmin] items-center">
            <Star />
            {game.winnerOrder.indexOf(player.id) + 1}
          </div>
        )}
      </div>

      {(player.connectionStatus == "disconnected") && (
        <>
          {myPlayerId === null && (
            <Button onClick={() => rejoinPlayer(player.id)} className="w-fit absolute top-[10vmin] z-100">
              Rejoin
            </Button>
          )}
        </>
      )}

      <div className={`flex flex-row gap-[1vmin] mt-[1vmin] max-w-screen ${(trumpRows.length > 2 || nonTrumpRows.length > 2) ? "max-h-[20vmin] scale-75 translate-y-[-12vmin]" : ""}`}>
        {player.id === myPlayerId ?
          (
            <>
              {/* Trumps */}
              <div className="flex flex-col min-w-0 shrink">
                {trumpRows.map((row, rowIndex) => (
                  <div className={`flex flex-row flex-nowrap items-center justify-start`}>
                    {row.map((card, i) => (
                      <div
                        key={card.id}
                        // shrink: Allows the wrapper to get smaller than the card
                        className="shrink basis-[15vmin] min-w-[1vmin] flex justify-end"
                        style={{
                          zIndex: i + 10 * rowIndex,
                          transform: `translateY(${rowIndex * -10}vmin)`,
                        }}
                      >
                        <div className={`w-[15vmin]`}>
                          <PlayingCardComponent key={card.id} card={card} onClick={(game.phase == "attacking" && game.attackerIndex === player.index && validAttackCard(card, game)) || (toDefend && canBeat(card, toDefend, game.trumpSuit)) ? () => playCard(card) : undefined} />
                        </div>
                      </div>
                    ))}
                  </div>
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
                    className="h-[21vmin] w-[0.25vmin] bg-neutral-200/30 rounded-full mx-[0.75vmin]"
                  />
                )}
              </AnimatePresence>


              {/* Others */}
              <div className="flex flex-col min-w-0 shrink">
                {nonTrumpRows.map((row, rowIndex) => (
                  <div className="flex flex-row flex-nowrap items-center justify-start">
                    {row.map((card, i) => (
                      <div
                        key={card.id}
                        // shrink: Allows the wrapper to get smaller than the card
                        className="shrink basis-[15vmin] min-w-[1vmin]"
                        style={{
                          zIndex: i + 10 * rowIndex,
                          transform: `translateY(${rowIndex * -10}vmin)`,
                        }}
                      >
                        <div className={`w-[15vmin]`}>
                          <PlayingCardComponent key={card.id} card={card} onClick={(game.phase == "attacking" && game.attackerIndex === player.index && validAttackCard(card, game)) || (toDefend && canBeat(card, toDefend, game.trumpSuit)) ? () => playCard(card) : undefined} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="scale-[0.7] absolute max-h-[1vmin] max-w-[1vmin]">
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
