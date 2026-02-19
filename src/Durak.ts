// Durak.ts

import { generateUUID, shuffle } from "./lib/utils";

// ---------- Basic Types ----------

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank =
  | 0   // 2
  | 1   // 3
  | 2   // 4
  | 3   // 5
  | 4   // 6
  | 5   // 7
  | 6   // 8
  | 7   // 9
  | 8   // 10
  | 9   // J
  | 10  // Q
  | 11  // K
  | 12; // A

// ---------- Playing Card ----------

export interface PlayingCard
{
  id: string;               // Unique ID for React tracking
  suit: Suit | null;        // Null if hidden
  rank: Rank | null;        // Null if hidden
}

// ---------- Table Pair ----------

export interface TablePair
{
  attackCard: PlayingCard;
  defenseCard?: PlayingCard; // Optional until defended
}

// ---------- Player ----------

export interface Player
{
  id: string;               // Socket ID or unique user ID
  name: string;
  ready: boolean;
  hand: PlayingCard[];
  connectionStatus: "connected" | "disconnected";
  isOut: boolean;           // Finished the game
}

// ---------- Game State ----------

export type GamePhase =
  | "waiting"
  | "attacking"
  | "defending"
  | "cleanup"
  | "finished";

export interface GameState
{
  players: Player[];

  attackerIndex: number;
  defenderIndex: number;

  table: TablePair[];

  trumpSuit: Suit;

  deck: PlayingCard[];
  deckTrumpCard: PlayingCard | null;

  phase: GamePhase;

  winnerOrder: string[]; // player IDs in finishing order
}

// ---------- Deck Creation ----------

// Create a standard 36-card shuffled deck
export function createDeck(): PlayingCard[]
{
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

  const deck: PlayingCard[] = [];

  for (const suit of suits)
  {
    // 0–8 = 6 through Ace (36-card deck)
    for (let rank = 4 as Rank; rank <= 12; rank++)
    {
      deck.push({
        id: `card-${generateUUID()}`,
        suit,
        rank: rank as Rank,
      });
    }
  }

  shuffle(deck);

  return deck;
}

export function canBeat(
  attackCard: PlayingCard,
  defenseCard: PlayingCard,
  trumpSuit: Suit
): boolean
{
  if (
    attackCard.rank === null ||
    attackCard.suit === null ||
    defenseCard.rank === null ||
    defenseCard.suit === null
  )
  {
    return false;
  }

  const attackIsTrump = attackCard.suit === trumpSuit;
  const defenseIsTrump = defenseCard.suit === trumpSuit;

  if (!attackIsTrump && defenseIsTrump)
  {
    return true;
  }

  if (attackCard.suit === defenseCard.suit)
  {
    return defenseCard.rank > attackCard.rank;
  }

  return false;
}

