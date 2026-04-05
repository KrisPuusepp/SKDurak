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
  alias: string;
  index: number;
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
  | "animation" /* A special phase used for animations. No special interactions should take place during this phase. */;

export interface GameState
{
  players: Player[];

  attackerQueue: number[];
  defenderIndex: number;

  table: TablePair[];

  trumpSuit: Suit;
  deck: PlayingCard[];
  discardPile: PlayingCard[];

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
  defenseCard: PlayingCard,
  attackCard: PlayingCard,
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

export function validAttackCard(
  card: PlayingCard,
  game: GameState
): boolean
{
  if (game.table.length == 0)
    return true;

  // If table not empty, rank must match an existing rank on table

  const ranksOnTable = new Set<number>();

  for (const pair of game.table)
  {
    if (pair.attackCard.rank !== null)
      ranksOnTable.add(pair.attackCard.rank);

    if (pair.defenseCard && pair.defenseCard.rank !== null)
      ranksOnTable.add(pair.defenseCard.rank);
  }

  if (!ranksOnTable.has(card.rank!))
  {
    return false; // Invalid rank for attack
  }

  return true;
}

// ---------- Statistics Interfaces ----------

export interface GameRecord
{
  endedAt: string;          // ISO timestamp when game ended (iso string)
  trumpSuit: Suit;          // "hearts", "diamonds", "clubs", or "spades"
  turnOrder: string[];      // player names in turn order at start
  winnerOrder: string[];    // player names ordered by finish (1st ... last)
  moves: string[];          // notation array
  playersCount: number;     // number of players in the game
}

export interface PlayerGameStatsBucket
{
  gamesPlayed: number;
  results: number[]; // index 0 => first place counts, index N-1 => last place counts
}

export interface PlayerPairStats
{
  totalGames: number;
  timesBeat: number;
  winRate: number; // 0..1
}

export interface PlayerPairStatsSplit
{
  overall: PlayerPairStats;
  left: PlayerPairStats; // for games where the player is on the left
  right: PlayerPairStats; // for games where the player is on the right
}

export interface PlayerStatsEntry
{
  totalGames: number;
  gameStats: {
    // keys "2".."6"
    [playersCount: string]: PlayerGameStatsBucket | undefined;
  };
  sumResult: number;     // internal sum of result (0..1)
  averageResult: number; // 0..1
  playerStats: {
    [otherPlayerName: string]: PlayerPairStatsSplit;
  };
}

export interface TimelinePoint
{
  gameIndex: number;
  averages: Record<string, number>;
}

export interface SessionRecord
{
  date: string; // YYYY-MM-DD
  totalGames: number;
  players: { [playerName: string]: PlayerStatsEntry };
  timeline: TimelinePoint[];
}

export interface AllPlayerStats
{
  players: Record<string, PlayerStatsEntry>;
  timeline: TimelinePoint[];
}

export interface StorageSchema
{
  games: GameRecord[];                            // games.json
  playerStats: AllPlayerStats;                    // playerstats.json
  sessions: SessionRecord[];                      // sessionstats.json
}

export function cardToNotation(card: PlayingCard): string
{
  let rank;
  let suit;
  switch (card.rank)
  {
    case 0: rank = "2"; break;
    case 1: rank = "3"; break;
    case 2: rank = "4"; break;
    case 3: rank = "5"; break;
    case 4: rank = "6"; break;
    case 5: rank = "7"; break;
    case 6: rank = "8"; break;
    case 7: rank = "9"; break;
    case 8: rank = "10"; break;
    case 9: rank = "J"; break;
    case 10: rank = "Q"; break;
    case 11: rank = "K"; break;
    case 12: rank = "A"; break;
  }
  switch (card.suit)
  {
    case "hearts": suit = "H"; break;
    case "diamonds": suit = "D"; break;
    case "clubs": suit = "C"; break;
    case "spades": suit = "S"; break;
  }
  return `${rank}-${suit}`;
}