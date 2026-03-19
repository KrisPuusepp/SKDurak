// src/gameStore.ts
import path from "path";
import
{
  type GameRecord,
  type PlayerStatsEntry,
  type PlayerGameStatsBucket,
  type PlayerPairStats,
  type SessionRecord,
  type Suit,
  type PlayerPairStatsSplit,
} from "@/Durak";
import { readJsonFile, writeJsonFileAtomic } from "./storage";

const DATA_DIR = path.join(process.cwd(), "data");
const GAMES_FILE = path.join(DATA_DIR, "games.json");
const PLAYER_FILE = path.join(DATA_DIR, "playerstats.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessionstats.json");

// helpers
function isoDateString(ts = Date.now()): string
{
  const d = new Date(ts);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// convert place (0-based) into result 0..1 given playersCount N
function placeToResult(place: number, playersCount: number): number
{
  if (playersCount <= 1) return 1;
  // linear mapping: first -> 1, last -> 0
  return 1 - (place / (playersCount - 1));
}

// Loads the .json files, saves the game record, updates the other .json stats files and saves everything
export async function saveGameRecord(recordPartial: {
  trumpSuit: Suit;
  turnOrder: string[];
  winnerOrder: string[];
  moves: string[];
})
{
  const endedAt = new Date().toISOString();
  const playersCount = recordPartial.turnOrder.length;

  const record: GameRecord = {
    endedAt,
    trumpSuit: recordPartial.trumpSuit,
    turnOrder: recordPartial.turnOrder,
    winnerOrder: recordPartial.winnerOrder,
    moves: recordPartial.moves,
    playersCount,
  };

  const games = await readJsonFile<GameRecord[]>(GAMES_FILE, []);
  const playerStats = await readJsonFile<Record<string, PlayerStatsEntry>>(PLAYER_FILE, {});
  const sessionsArr = await readJsonFile<SessionRecord[]>(SESSIONS_FILE, []);

  const sessionsMap = new Map(sessionsArr.map(s => [s.date, s] as const));

  games.push(record);
  accumulatePlayerStatsMap(playerStats, record);
  accumulateSessionStats(sessionsMap, record);

  const sessions = Array.from(sessionsMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  await Promise.all([
    writeJsonFileAtomic(GAMES_FILE, games),
    writeJsonFileAtomic(PLAYER_FILE, playerStats),
    writeJsonFileAtomic(SESSIONS_FILE, sessions),
  ]);

  return record;
}

function createEmptyPlayerStatsEntry(): PlayerStatsEntry
{
  return {
    totalGames: 0,
    gameStats: {},
    sumResult: 0,
    averageResult: 0,
    playerStats: {},
  };
}

function getWinnerOrderPositionMap(record: GameRecord): Record<string, number>
{
  const positionOf: Record<string, number> = {};
  record.winnerOrder.forEach((name, i) =>
  {
    positionOf[name] = i;
  });
  return positionOf;
}

function ensurePlayerStatsEntry(
  stats: Record<string, PlayerStatsEntry>,
  playerName: string
): PlayerStatsEntry
{
  if (!stats[playerName])
  {
    stats[playerName] = createEmptyPlayerStatsEntry();
  }
  return stats[playerName];
}

function ensureBucket(
  entry: PlayerStatsEntry,
  playersCount: number
): PlayerGameStatsBucket
{
  const key = String(playersCount);

  if (!entry.gameStats[key])
  {
    entry.gameStats[key] = {
      gamesPlayed: 0,
      results: Array(playersCount).fill(0),
    };
  }

  return entry.gameStats[key]!;
}

function createEmptyPairStats(): PlayerPairStats
{
  return {
    totalGames: 0,
    timesBeat: 0,
    winRate: 0,
  };
}

function createEmptyPairStatsSplit(): PlayerPairStatsSplit
{
  return {
    overall: createEmptyPairStats(),
    left: createEmptyPairStats(),
    right: createEmptyPairStats(),
  };
}

function updatePairStats(
  ps: PlayerPairStats,
  didBeat: boolean
)
{
  ps.totalGames += 1;
  if (didBeat) ps.timesBeat += 1;
  ps.winRate = ps.timesBeat / ps.totalGames;
}

function getNeighbors(turnOrder: string[], index: number)
{
  const N = turnOrder.length;

  const left = turnOrder[(index - 1 + N) % N];
  const right = turnOrder[(index + 1) % N];

  return { left, right };
}

/**
 * Mutates a record of player stats in-place for one game.
 */
function accumulatePlayerStatsMap(
  playerStats: Record<string, PlayerStatsEntry>,
  record: GameRecord
)
{
  const N = record.playersCount;
  const positionOf = getWinnerOrderPositionMap(record);

  for (let i = 0; i < record.turnOrder.length; i++)
  {
    const playerName = record.turnOrder[i];

    const entry = ensurePlayerStatsEntry(playerStats, playerName);
    entry.totalGames += 1;

    const bucket = ensureBucket(entry, N);
    bucket.gamesPlayed += 1;

    const place = positionOf[playerName] ?? (N - 1);
    bucket.results[place] = (bucket.results[place] ?? 0) + 1;

    const result = placeToResult(place, N);
    entry.sumResult += result;
    entry.averageResult = entry.sumResult / entry.totalGames;

    const { left, right } = getNeighbors(record.turnOrder, i);

    for (const other of record.turnOrder)
    {
      if (other === playerName) continue;

      if (!entry.playerStats[other])
      {
        entry.playerStats[other] = createEmptyPairStatsSplit();
      }

      const split = entry.playerStats[other];

      const otherPlace = positionOf[other] ?? (N - 1);
      const didBeat = place < otherPlace;

      // Always update overall
      updatePairStats(split.overall, didBeat);

      // Only update left/right if meaningful
      if (N > 2)
      {
        if (other === left)
        {
          updatePairStats(split.left, didBeat);
        }
        else if (other === right)
        {
          updatePairStats(split.right, didBeat);
        }
      }
    }
  }
}

function accumulateSessionStats(
  sessionsMap: Map<string, SessionRecord>,
  record: GameRecord
)
{
  const date = isoDateString(new Date(record.endedAt).getTime());

  if (!sessionsMap.has(date))
  {
    sessionsMap.set(date, {
      date,
      totalGames: 0,
      players: {},
    });
  }

  const session = sessionsMap.get(date)!;
  session.totalGames += 1;

  accumulatePlayerStatsMap(session.players, record);
}

export function buildStatsFromGames(games: GameRecord[])
{
  const playerStats: Record<string, PlayerStatsEntry> = {};
  const sessionsMap = new Map<string, SessionRecord>();

  for (const game of games)
  {
    accumulatePlayerStatsMap(playerStats, game);
    accumulateSessionStats(sessionsMap, game);
  }

  const sessions = Array.from(sessionsMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return { playerStats, sessions };
}

export async function rebuildAllStats()
{
  const games = await readJsonFile<GameRecord[]>(GAMES_FILE, []);
  const { playerStats, sessions } = buildStatsFromGames(games);

  await Promise.all([
    writeJsonFileAtomic(PLAYER_FILE, playerStats),
    writeJsonFileAtomic(SESSIONS_FILE, sessions),
  ]);
}