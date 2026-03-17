import { createServer } from "http";
import { Server } from "socket.io";
import
{
  type GameState,
  type Player,
  type PlayingCard,
  canBeat,
  createDeck,
  validAttackCard,
} from "./Durak";
import { generateUUID, getCircularElement, shuffle, } from "./lib/utils";

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
  attackerQueue: [],
  defenderIndex: 0,
  table: [],
  deck: [],
  discardPile: [],
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
      if (game.phase === "waiting" || p.id === playerId) return p;

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
    discardPile: game.discardPile.map((card) => maskCard(card)),
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
    player.hand = [];
  }
  game.winnerOrder = [];
  shuffle(game.players);
  for (var i = 0; i < game.players.length; i++)
  {
    game.players[i].index = i;
  }
  game.table = [];
  game.discardPile = [];

  game.deck = createDeck();

  game.trumpSuit = game.deck[0].suit!;

  // UI test code
  //game.players[0].hand = game.deck.slice(0, 1);
  //game.players[1].hand = game.deck.slice(1, 36);
  //game.deck = [];

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

  // Choose a random starting player
  game.defenderIndex = Math.floor(Math.random() * game.players.length);
  game.phase = "attacking";
  startNextTurn(false);
}

// --------------------
// Game Util
// --------------------

function giveCardsToPlayer(playerIndex: number) 
{
  let player = game.players.find((p) => p.index === playerIndex);
  if (!player) return;

  while (player.hand.length < 6 && game.deck.length > 0)
  {
    const card = game.deck.pop();
    if (!card) continue;
    player.hand.push(card);
  }
}

function startNextTurn(skipDefender: boolean)
{
  if (game.phase === "waiting") return;
  if (game.winnerOrder.length >= game.players.length - 1) return;

  // Move remaining table cards to discard pile
  for(const pair of game.table) {
    game.discardPile.push(pair.attackCard);
    if (pair.defenseCard) game.discardPile.push(pair.defenseCard);
  }
  game.table = [];

  // Next turn
  // Go to next defender
  game.defenderIndex = (game.defenderIndex + 1) % game.players.length;
  while (game.winnerOrder.includes(game.players[game.defenderIndex].id))
  {
    // Player has won already
    game.defenderIndex = (game.defenderIndex + 1) % game.players.length;
  }
  // Choose defender
  if (skipDefender)
  {
    // Skip this defender and go to the one after this
    game.defenderIndex = (game.defenderIndex + 1) % game.players.length;
    while (game.winnerOrder.includes(game.players[game.defenderIndex].id))
    {
      // Player has won already
      game.defenderIndex = (game.defenderIndex + 1) % game.players.length;
    }
  }

  // Create attackerQueue
  let playersStillInGame = game.players.filter((p) => !game.winnerOrder.includes(p.id));
  let defenderIndexInAboveArray = playersStillInGame.findIndex((p) => p.index === game.defenderIndex);
  game.attackerQueue = [getCircularElement<Player>(playersStillInGame, defenderIndexInAboveArray - 1).index, getCircularElement<Player>(playersStillInGame, defenderIndexInAboveArray + 1).index];
  if (game.attackerQueue[0] == game.attackerQueue[1])
    game.attackerQueue = game.attackerQueue.slice(1);

  console.log("Queue is " + game.attackerQueue.join(", "));

  game.phase = "attacking";
}

function checkForWinners()
{
  if (game.deck.length > 0) return;

  for (const player of game.players)
  {
    if (player.hand.length === 0 && !game.winnerOrder.includes(player.id))
    {
      game.winnerOrder.push(player.id);
      let stopAttackerIndex = game.attackerQueue.findIndex((i) => i === player.index);
      if (stopAttackerIndex !== -1)
        game.attackerQueue = game.attackerQueue.slice(stopAttackerIndex + 1);
    }
  }

  if (game.players.length - game.winnerOrder.length === 1)
  {
    // Game over
    game.phase = "waiting";

    // Give last player last place
    let lastPlayer = game.players.find((p) => !game.winnerOrder.includes(p.id));
    if (lastPlayer)
      game.winnerOrder.push(lastPlayer.id);
  }
}

// --------------------
// Socket Handling
// --------------------

io.on("connection", (socket) =>
{
  console.log("Client connected:", socket.id);
  socket.emit("gameState", buildStateForSocket(socket.id));

  // ---- Create & Join ----
  socket.on("joinNewPlayer", (name: string, alias: string, callback: (response: { success: boolean; playerId?: string }) => void) =>
  {
    // Deny if already a player
    if (socketToPlayer.has(socket.id))
    {
      callback({ success: false });
      return;
    }

    // Deny if already have 6 players
    if (game.players.length >= 6)
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

    name = name.trim();
    name = name.slice(0, 30);

    // Deny if name is empty
    if (name.length === 0)
    {
      callback({ success: false });
      return;
    }

    const player: Player = {
      id: generateUUID(),
      name,
      alias,
      index: game.players.length,
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
  socket.on("rejoinPlayer", (playerId: string, callback: (response: { success: boolean, player: Player | null }) => void) =>
  {
    // Deny if already a player
    if (socketToPlayer.has(socket.id))
    {
      callback({ success: false, player: null });
      return;
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player)
    {
      // Player does not exist
      callback({ success: false, player: null });
      return;
    }

    if (player.connectionStatus === "connected")
    {
      // Player is already connected
      callback({ success: false, player: null });
      return;
    }

    player.connectionStatus = "connected";
    socketToPlayer.set(socket.id, player.id);

    callback({ success: true, player: player });

    broadcastGameState();
  });

  // ---- Change Profile ----
  socket.on("changeProfile", (newName: string, newAlias: string) =>
  {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return;

    newName = newName.trim();
    newName = newName.slice(0, 30);
    newAlias = newAlias.trim();
    newAlias = newAlias.slice(0, 30);

    if (newName.length === 0) return;

    player.name = newName;
    player.alias = newAlias;

    broadcastGameState();
  });

  // ---- Toggle Ready ----
  socket.on("toggleReady", () =>
  {
    if (game.phase !== "waiting") return;

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

  // ---- Play Card ----
  socket.on("playCard", (cardID: string) =>
  {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return;

    const card = player.hand.find((c) => c.id === cardID);
    if (!card) return;

    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    if (game.defenderIndex === playerIndex)
    {
      // Defending

      if (game.phase != "defending") return;
      let attackerCard = game.table[game.table.length - 1].attackCard;
      if (!attackerCard) return;

      if (canBeat(card, attackerCard, game.trumpSuit))
      {
        // Remove card from defender hand
        player.hand = player.hand.filter((c) => c.id !== cardID);

        // Add to table
        game.table[game.table.length - 1].defenseCard = card;

        // Next phase
        if (game.table.length === 6 || player.hand.length === 0 || game.attackerQueue.length === 0)
        {
          // No more cards may be played
          game.phase = "animation";
          setTimeout(() =>
          {
            if (game.attackerQueue.length > 0)
              giveCardsToPlayer(game.attackerQueue[0]);
            giveCardsToPlayer(game.defenderIndex);
            checkForWinners();
            startNextTurn(game.players[game.defenderIndex].hand.length === 0);
            broadcastGameState();
          }, 2000);
        } else
        {
          // Attacks continue
          game.phase = "attacking";
        }

        console.log("Player " + player.name + " defends");
      }
    } else if (game.attackerQueue.length > 0 && game.attackerQueue[0] === playerIndex)
    {
      // Attacking

      if (game.phase != "attacking") return;

      const defender = game.players[game.defenderIndex];

      // Cannot attack if defender has no cards
      if (defender.hand.length === 0) return;

      if (!validAttackCard(card, game)) return;

      // Remove card from attacker hand
      player.hand = player.hand.filter((c) => c.id !== cardID);

      // Add to table
      game.table.push({ attackCard: card });

      // Next phase
      game.phase = "defending";

      console.log("Player " + player.name + " attacks");
    }

    checkForWinners();

    broadcastGameState();
  });

  // ---- Pass Attack ----
  socket.on("passAttack", () =>
  {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return;

    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    if (game.phase != "attacking") return;
    if (game.attackerQueue[0] !== playerIndex) return;
    if (player.hand.length == 0) return;
    if (game.table.length == 0) return; // Haven't attacked yet

    // Give cards
    giveCardsToPlayer(game.attackerQueue[0]);
    game.attackerQueue.shift();

    if (game.attackerQueue.length == 0)
    {
      // Attacks and defense done
      giveCardsToPlayer(game.defenderIndex);
      startNextTurn(false);
    }

    broadcastGameState();
  });

  // ---- Forfeit Defense ----
  socket.on("forfeitDefense", () =>
  {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return;

    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    if (game.phase != "defending") return;
    if (game.defenderIndex !== playerIndex) return;

    // Take all cards on the table
    for (const pair of game.table)
    {
      player.hand.push(pair.attackCard);
      if (pair.defenseCard) player.hand.push(pair.defenseCard);
    }
    game.table = [];

    game.phase = "animation";
    setTimeout(() =>
    {
      // Give cards
      giveCardsToPlayer(game.attackerQueue[0]);
      giveCardsToPlayer(game.defenderIndex);

      startNextTurn(true);

      broadcastGameState();
    }, 500);

    broadcastGameState();
  });

  // ---- Leave Game ----
  socket.on("leaveGame", (callback: (response: { success: boolean; }) => void) =>
  {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId)
    {
      callback({ success: false });
      return;
    }

    if (game.phase != "waiting")
    {
      callback({ success: false });
      return;
    }

    game.players = game.players.filter((p) => p.id !== playerId);
    socketToPlayer.delete(socket.id);

    callback({ success: true });

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
