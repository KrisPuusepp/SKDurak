import { createServer } from "http";
import { Server } from "socket.io";
import
{
  type GameState,
  type Player,
  type PlayingCard,
  createDeck,
} from "./Durak";
import { generateUUID } from "./lib/utils";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

// --------------------
// In-memory game state
// --------------------

let game: GameState = {
  players: [],
  attackerIndex: 0,
  defenderIndex: 1,
  table: [],
  deck: [],
  trumpSuit: "hearts",
  phase: "waiting",
  winnerOrder: [],
};

// Map socket -> playerId
const socketToPlayer = new Map<string, string>();

// --------------------
// Utility: Broadcast
// --------------------

function maskCard(card: PlayingCard): PlayingCard
{
  return {
    id: card.id,
    suit: null,
    rank: null,
  };
}

function buildStateForSocket(socketId: string): GameState
{
  const playerId = socketToPlayer.get(socketId) || "";

  return {
    ...game,
    players: game.players.map((p) =>
    {
      if (p.id === playerId) return p;

      return {
        ...p,
        hand: p.hand.map((card) => maskCard(card)),
      };
    }),
    deck: game.deck.map((card) =>
    {
      if (card !== game.deck[0])
      {
        return maskCard(card);
      }
      return card;
    }),
  };
}

function broadcastGameState()
{
  for (const [socketId, socket] of io.sockets.sockets)
  {
    socket.emit("gameState", buildStateForSocket(socketId));
  }
}

// --------------------
// Game Setup
// --------------------

function startGame()
{
  for (const player of game.players)
  {
    player.ready = false;
  }

  game.deck = createDeck();

  game.trumpSuit = game.deck[0].suit!;

  // Deal 6 cards to each player
  for (let i = 0; i < 6; i++)
  {
    for (const player of game.players)
    {
      const card = game.deck.pop();
      if (!card) continue;
      player.hand.push(card);
    }
  }

  game.phase = "attacking";
}

// --------------------
// Socket Handling
// --------------------

io.on("connection", (socket) =>
{
  console.log("Client connected:", socket.id);
  socket.emit("gameState", buildStateForSocket(socket.id));

  // ---- Create & Join ----
  socket.on("joinNewPlayer", (name: string, callback: (response: { success: boolean; playerId?: string }) => void) =>
  {
    // Deny if already a player
    if (socketToPlayer.has(socket.id))
    {
      callback({ success: false });
      return;
    }

    // Deny if game is in progress
    if (game.phase !== "waiting")
    {
      callback({ success: false });
      return;
    }

    const player: Player = {
      id: generateUUID(),
      name,
      ready: false,
      hand: [],
      connectionStatus: "connected",
      isOut: false,
    };

    game.players.push(player);
    socketToPlayer.set(socket.id, player.id);

    callback({ success: true, playerId: player.id });

    broadcastGameState();
  });


  // ---- Rejoin Existing ----
  socket.on("rejoinPlayer", (playerId: string, callback: (response: { success: boolean }) => void) =>
  {
    // Deny if already a player
    if (socketToPlayer.has(socket.id))
    {
      callback({ success: false });
      return;
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player)
    {
      // Player does not exist
      callback({ success: false });
      return;
    }

    if (player.connectionStatus === "connected")
    {
      // Player is already connected
      callback({ success: false });
      return;
    }

    player.connectionStatus = "connected";
    socketToPlayer.set(socket.id, player.id);

    callback({ success: true });

    broadcastGameState();
  });

  // ---- Leave Game ----
  socket.on("leaveGame", () =>
  {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    game.players = game.players.filter((p) => p.id !== playerId);
    socketToPlayer.delete(socket.id);

    broadcastGameState();
  });

  // ---- Toggle Ready ----
  socket.on("toggleReady", () =>
  {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return;

    // add ready dynamically
    player.ready = !player.ready;

    console.log("Player " + player.name + " is " + (player.ready ? "ready" : "not ready"));

    const allReady =
      game.players.length > 1 &&
      game.players.every((p: any) => p.ready === true);

    if (allReady && game.phase === "waiting")
    {
      startGame();
    }

    broadcastGameState();
  });

  // ---- Disconnect ----
  socket.on("disconnect", () =>
  {
    console.log("Client disconnected:", socket.id);

    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    const player = game.players.find((p) => p.id === playerId);
    if (player)
    {
      player.connectionStatus = "disconnected";
      player.ready = false;
    }

    socketToPlayer.delete(socket.id);
    broadcastGameState();
  });
});

httpServer.listen(3000, () =>
{
  console.log("Server running on http://localhost:3000");
});
