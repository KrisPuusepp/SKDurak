import { createContext, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { lucideSuitIcons, PlayingCardComponent, svgSuitIcons } from "./components/PlayingCardComponent";
import { canBeat, validAttackCard, type GameState, type Player, type PlayingCard } from "./Durak";
import { Check, Settings, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import
{
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SettingRow } from "@/components/SettingRow";
import { Checkbox } from "./components/ui/checkbox";

const DEFAULT_SETTINGS: UserSettings = {
  backgroundTheme: "dark",
  cardTheme: "dark",
  suitShape: "classic",
  suitFill: "hollow",
  cardGlow: true,
  SKMode: false,
};

export interface UserSettings
{
  backgroundTheme: "dark" | "light";
  cardTheme: "dark" | "classic";
  suitShape: "lucide" | "classic";
  suitFill: "hollow" | "filled";
  cardGlow: boolean;
  SKMode: boolean;
}

export const SettingsContext = createContext<{
  settings: UserSettings;
  setSettings: Dispatch<SetStateAction<UserSettings>>;
} | null>(null);

const SETTING_OPTIONS = {
  backgroundTheme: [
    { value: "dark", label: <div className="flex items-center gap-2"> Dark</div> },
    { value: "light", label: <div className="flex items-center gap-2"> Light</div> },
  ],
  cardTheme: [
    { value: "dark", label: "Dark" },
    { value: "classic", label: "Classic" },
  ],
  suitShape: [
    {
      value: "lucide", label: <div className="flex items-center gap-2">
        <p>Lucide</p>
        {Object.entries(lucideSuitIcons).map(([name, Icon]) => (
          <div className="flex items-center gap-2 fill-transparent">
            <Icon className="w-4 h-4" />
          </div>
        ))}
      </div>
    },
    {
      value: "classic", label: <div className="flex items-center gap-2">
        <p>Classic</p>
        {Object.entries(svgSuitIcons).map(([name, svg]) => (
          <div className="flex items-center gap-2 fill-transparent">
            {svg}
          </div>
        ))}
      </div>
    },
  ],
  suitFill: [
    {
      value: "hollow", label: <div className="flex items-center gap-2">
        <p>Hollow</p>
        <div className="flex items-center gap-2 fill-transparent">
          {svgSuitIcons["hearts"]}
        </div>
      </div>
    },
    {
      value: "filled", label: <div className="flex items-center gap-2">
        <p>Filled</p>
        <div className="flex items-center gap-2 fill-current">
          {svgSuitIcons["hearts"]}
        </div>
      </div>
    },
  ],
};

let socket: Socket;

export default function App()
{
  const [game, setGame] = useState<GameState | null>(null);
  const [name, setName] = useState("");
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(() =>
  {
    try
    {
      const saved = localStorage.getItem("SKDurak-user-settings");
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : DEFAULT_SETTINGS;
    } catch
    {
      return DEFAULT_SETTINGS;
    }
  });
  useEffect(() =>
  {
    localStorage.setItem("SKDurak-user-settings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() =>
  {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Add the current theme class
    root.classList.add(settings.backgroundTheme);
  }, [settings.backgroundTheme]);

  const defenderRef = useRef<HTMLDivElement | null>(null)
  const attackerRef = useRef<HTMLDivElement | null>(null)
  const [positions, setPositions] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
  } | null>(null)

  useEffect(() =>
  {
    if (defenderRef.current && attackerRef.current)
    {
      const rect1 = attackerRef.current.getBoundingClientRect()
      const rect2 = defenderRef.current.getBoundingClientRect()

      setPositions({
        x1: rect1.left + rect1.width / 2,
        y1: rect1.top + rect1.height / 2,
        x2: rect2.left + rect2.width / 2,
        y2: rect2.top + rect2.height / 2,
      })
    }
  }, [game])


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
        localStorage.setItem("myPlayerId", id);
      } else
      {
        localStorage.removeItem("myPlayerId");
      }
    });
  };

  function leaveGame()
  {
    socket.emit("leaveGame", (response: { success: boolean }) =>
    {
      if (response.success)
      {
        setMyPlayerId(null);
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
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Turn Arrow Between Players */}
      {positions && game.phase !== "waiting" && (
        <svg
          className="absolute inset-0 pointer-events-none z-10 text-foreground/75"
          width="100%"
          height="100%"
        >
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="3"
              markerHeight="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 Z"
                fill="currentColor"
              />
            </marker>
          </defs>

          {(() =>
          {
            const { x1, y1, x2, y2 } = positions;

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            // How much to shorten the line from the middle (0 = no shortening, 0.1 = 10%)
            const shortenFraction = 0.2;

            // Vector from start to end
            const dx = x2 - x1;
            const dy = y2 - y1;

            // Shorten endpoints toward the center
            const startX0 = x1 + dx * shortenFraction;
            const startY0 = y1 + dy * shortenFraction;
            const endX0 = x2 - dx * shortenFraction;
            const endY0 = y2 - dy * shortenFraction;

            // Strengths for curvature and endpoint pull
            const curveStrength = -0.4;
            const endpointStrength = -0.1;

            // Pull endpoints slightly toward center (optional)
            const startX = startX0 + (centerX - startX0) * endpointStrength;
            const startY = startY0 + (centerY - startY0) * endpointStrength;
            const endX = endX0 + (centerX - endX0) * endpointStrength;
            const endY = endY0 + (centerY - endY0) * endpointStrength;

            // Midpoint for quadratic curve
            const midX = (startX + endX) / 2 + (centerX - (startX + endX) / 2) * curveStrength;
            const midY = (startY + endY) / 2 + (centerY - (startY + endY) / 2) * curveStrength;

            // Path string
            const pathData = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

            return (
              <path
                d={pathData}
                stroke="currentColor"
                strokeWidth="1vmin"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            )
          })()}
        </svg>
      )}

      <SettingsContext.Provider value={{ settings, setSettings }}>
        {/* Table Container */}
        <div className="absolute inset-0 flex items-center justify-center">

          {/* 3D Wrapper: This holds both the top and the bottom layer */}
          <div className="relative w-[90vmin] h-[90vmin] flex items-center justify-center">

            {/* Bottom Layer (Shadow/Reflection) */}
            <div className="absolute w-full h-full rounded-full perspective-near rotate-x-320 bg-[#eeeeee] dark:bg-[#151515] border-[0.35vmin] border-[#cccccc] dark:border-[#333333] translate-y-[3vmin]">
              {/* This copy is shifted down (translate-y-8) and made transparent (bg-white/5) */}
            </div>

            {/* Top Layer (Main Table Surface) */}
            <div className="relative w-full h-full rounded-full perspective-near rotate-x-320 bg-[#eeeeee] dark:bg-[#111111] shadow-2xl shadow-[#22222255] inset-shadow-sm inset-shadow-[#888888] border-[0.35vmin] border-[#999999] dark:border-[#333333]">
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

          <div className="absolute -translate-y-[6vmin]">
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
                defenderRef={defenderRef}
                attackerRef={attackerRef}
              />
            ))}
          </div>
        </div>

        {/* Top Left Settings Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="capitalize absolute top-4 left-4" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <div className="space-y-1 w-50% h-100%">
              <SettingRow
                label="Background Theme"
                id="background-theme"
                value={settings.backgroundTheme}
                options={SETTING_OPTIONS.backgroundTheme}
                onChange={(val) => setSettings({ ...settings, backgroundTheme: val as any })}
              />

              <SettingRow
                label="Card Theme"
                id="card-theme"
                value={settings.cardTheme}
                options={SETTING_OPTIONS.cardTheme}
                onChange={(val) => setSettings({ ...settings, cardTheme: val as any })}
              />

              <SettingRow
                label="Suit Shape"
                id="suit-shape"
                value={settings.suitShape}
                options={SETTING_OPTIONS.suitShape}
                onChange={(val) => setSettings({ ...settings, suitShape: val as any })}
              />

              <SettingRow
                label="Suit Fill"
                id="suit-fill"
                value={settings.suitFill}
                options={SETTING_OPTIONS.suitFill}
                onChange={(val) => setSettings({ ...settings, suitFill: val as any })}
              />

              <div className="flex items-center justify-end w-full gap-4 py-2">
                <Label htmlFor="card-glow" className="whitespace-nowrap font-medium">
                  Card Glow
                </Label>
                <div className="w-full max-w-[50%]">
                  <Checkbox
                    id="card-glow"
                    checked={settings.cardGlow}
                    onCheckedChange={(val) => setSettings({ ...settings, cardGlow: val as any })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end w-full gap-4 py-2">
                <Label htmlFor="sk-mode" className="whitespace-nowrap font-medium">
                  SK Mode
                </Label>
                <div className="w-full max-w-[50%]">
                  <Checkbox
                    id="sk-mode"
                    checked={settings.SKMode}
                    onCheckedChange={(val) => setSettings({ ...settings, SKMode: val as any })}
                  />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {myPlayerId != null && game.phase === "waiting" && (
          <Button variant="destructive" className="capitalize absolute top-16 left-4"
            onClick={() => leaveGame()}>
            Leave
          </Button>
        )}

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
      </SettingsContext.Provider>
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
          <Card className="p-6 w-72">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
            <Button onClick={join} className="w-full">
              Join Game
            </Button>
          </Card>
        </div>
      )}

      {game.players.findIndex((p) => p.id === myPlayerId) === game.attackerQueue[0] && game.phase === "attacking" && game.table.length > 0 ? (
        <Button
          variant="destructive"
          onClick={() => socket.emit("passAttack")}
          className="absolute left-[12.5vmin] -top-[4.8vmin] w-[16vmin] h-[11.25vmin] z-100 text-[4vmin]"
        >
          Pass
        </Button>
      ) : null}

      {/* Deck Container */}
      {game.deck.length > 0 && (
        <div className="absolute left-[15vmin] bottom-[15vmin] flex flex-row items-center gap-[0.5vmin]">
          <div className="absolute text-[5vmin] text-shadow-md rounded-full z-10 -left-[14vmin] top-[11vmin] text-right w-[10vmin]">
            {game.deck.length}x
          </div>

          <div className="relative scale-75">
            {game.deck.map((card, i) =>
            {
              const isFirst = i === 0;

              return (
                <div
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
                    className={isFirst ? "" : "-rotate-90 top-[10.5vmin] -rotate-90 -left-[0.5vmin]"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Cards */}
      <div className="flex flex-row absolute bottom-[25vmin] -left-[25vmin] w-full">
        {game.table.map((pair, i) => (
          <div key={i} className="absolute" style={{
            left: i * 5.5 + "vmin",
            top: i * 2 + "vmin",
            zIndex: i
          }}>
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
                className="absolute w-full mt-[1vmin] h-[6vmin] z-100 text-[3vmin]"
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
  defenderRef,
  attackerRef,
}: {
  game: GameState;
  player: Player;
  rotationIndex: number;
  rejoinPlayer: (id: string) => void;
  myPlayerId: string | null;
  defenderRef: React.RefObject<HTMLDivElement | null>;
  attackerRef: React.RefObject<HTMLDivElement | null>;
})
{
  const SUIT_ORDER = ["spades", "hearts", "diamonds", "clubs"];

  // We define the angle in degrees for CSS
  const angle = (index / game.players.length) * 360 + 90;

  // We use vmin for the radius so it scales automatically
  const radiusX = "45vmin";
  const radiusY = "38vmin";

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
      {myPlayerId === null && player.connectionStatus == "disconnected" && (
        <Button onClick={() => rejoinPlayer(player.id)} className="absolute z-100 text-[4vmin] not-italic w-[16vmin] h-[10vmin] rounded-[1vmin] top-[6vmin]">
          Rejoin
        </Button>
      )}

      <div ref={game.defenderIndex == game.players.indexOf(player) ? defenderRef : (game.attackerQueue[0] == game.players.indexOf(player) ? attackerRef : null)} className={`text-[5vmin] font-medium text-nowrap flex gap-[0.5vmin] flex-row`}>
        <p className={`bg-card p-[1vmin] rounded-[2vmin] border-[0.2vmin] border-card-border text-shadow-lg ${player.ready ? "text-green-500" : ""} ${game.phase !== "waiting" && game.defenderIndex == player.index ? "text-blue-500" : ""} ${game.phase !== "waiting" && game.attackerQueue[0] == player.index ? "text-red-500" : ""} ${(trumpRows.length > 2 || nonTrumpRows.length > 2) ? "translate-y-[-10vmin]" : ""} ${player.connectionStatus == "disconnected" ? "bg-muted text-muted-foreground italic line-through" : ""}`}>
          {player.name} {" "}
        </p>
        {game.winnerOrder.indexOf(player.id) >= 0 && (
          <div className="flex flex-row gap-[0.5vmin] items-center">
            <Star className="w-[3vmin] h-[3vmin] text-yellow-500" />
            {game.winnerOrder.indexOf(player.id) + 1}
          </div>
        )}
      </div>

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
                        // shrink: Allows the wrapper to get smaller than the card
                        className="shrink basis-[15vmin] min-w-[1vmin] flex justify-end"
                        style={{
                          zIndex: i + 10 * rowIndex,
                          transform: `translateY(${rowIndex * -10}vmin)`,
                        }}
                      >
                        <div className={`w-[15vmin]`}>
                          <PlayingCardComponent key={card.id} card={card} onClick={(game.phase == "attacking" && game.attackerQueue[0] === player.index && validAttackCard(card, game)) || (toDefend && canBeat(card, toDefend, game.trumpSuit)) ? () => playCard(card) : undefined} />
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
                    className="h-[21vmin] w-[0.25vmin] bg-primary/50 rounded-full mx-[0.75vmin]"
                  />
                )}
              </AnimatePresence>


              {/* Others */}
              <div className="flex flex-col min-w-0 shrink">
                {nonTrumpRows.map((row, rowIndex) => (
                  <div className="flex flex-row flex-nowrap items-center justify-start">
                    {row.map((card, i) => (
                      <div
                        // shrink: Allows the wrapper to get smaller than the card
                        className="shrink basis-[15vmin] min-w-[1vmin]"
                        style={{
                          zIndex: i + 10 * rowIndex,
                          transform: `translateY(${rowIndex * -10}vmin)`,
                        }}
                      >
                        <div className={`w-[15vmin]`}>
                          <PlayingCardComponent key={card.id} card={card} onClick={(game.phase == "attacking" && game.attackerQueue[0] === player.index && validAttackCard(card, game)) || (toDefend && canBeat(card, toDefend, game.trumpSuit)) ? () => playCard(card) : undefined} />
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
                    left: `${game.phase === "waiting" ?
                      ((i + 1 - player.hand.length / 2) * 8.75) - 7.5 :
                      ((i + 1 - player.hand.length / 2) * 1.75) - 7.5}vmin`,
                    top: `${i * 0.2}vmin`,
                    rotate: `${(i - 3) * 4}deg`,
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
