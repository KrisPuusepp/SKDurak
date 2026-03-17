// src/gameStore.ts
import path from "path";
import
{
  type GameRecord,
  type PlayerStatsEntry,
  type PlayerGameStatsBucket,
  type PlayerPairStats,
  type SessionRecord,
  type SessionPlayerSummary,
  type Suit,
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

export async function saveGameRecord(recordPartial: {
  trumpSuit: Suit;
  turnOrder: string[];
  winnerOrder: string[];
  moves: string[];
})
{
  // create the record
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

  // read existing files
  const games = await readJsonFile<GameRecord[]>(GAMES_FILE, []);
  const playerStats = await readJsonFile<Record<string, PlayerStatsEntry>>(PLAYER_FILE, {});
  const sessions = await readJsonFile<SessionRecord[]>(SESSIONS_FILE, []);

  // append game
  games.push(record);

  // update playerStats
  await updatePlayerStats(playerStats, record);

  // update sessions
  await updateSessions(sessions, record);

  // write back atomically
  await Promise.all([
    writeJsonFileAtomic(GAMES_FILE, games),
    writeJsonFileAtomic(PLAYER_FILE, playerStats),
    writeJsonFileAtomic(SESSIONS_FILE, sessions),
  ]);

  return record;
}

async function updatePlayerStats(
  playerStats: Record<string, PlayerStatsEntry>,
  record: GameRecord
)
{
  const N = record.playersCount;

  // For quick index lookup
  const positionOf: Record<string, number> = {};
  record.winnerOrder.forEach((name, idx) =>
  {
    positionOf[name] = idx;
  });

  for (const playerName of record.turnOrder)
  {
    // ensure entry exists
    if (!playerStats[playerName])
    {
      playerStats[playerName] = {
        totalGames: 0,
        gameStats: {},
        averageResult: 0,
        playerStats: {},
      };
    }

    const entry = playerStats[playerName];
    entry.totalGames += 1;

    // update gameStats for this player under playersCount N
    const key = String(N);
    if (!entry.gameStats[key])
    {
      // initialize bucket with results array length N and zeros
      entry.gameStats[key] = {
        gamesPlayed: 0,
        results: Array(N).fill(0),
      } as PlayerGameStatsBucket;
    }

    const bucket = entry.gameStats[key] as PlayerGameStatsBucket;
    bucket.gamesPlayed += 1;

    const place = positionOf[playerName] ?? (N - 1); // fallback last
    // increment result count
    bucket.results[place] = (bucket.results[place] ?? 0) + 1;

    // update averageResult (internal 0..1)
    const result = placeToResult(place, N);
    // incremental average:
    const prevCount = entry.totalGames - 1;
    const prevAverage = entry.averageResult ?? 0;
    const newAverage = (prevAverage * prevCount + result) / (prevCount + 1);
    entry.averageResult = newAverage;

    // update pairwise stats with every other player in the game
    for (const other of record.turnOrder)
    {
      if (other === playerName) continue;
      if (!entry.playerStats[other])
      {
        entry.playerStats[other] = {
          totalGames: 0,
          timesBeat: 0,
          winRate: 0,
        };
      }
      const ps = entry.playerStats[other];
      ps.totalGames += 1;
      // "timesBeat" increments when player appears before other in winnerOrder
      const playerPlace = place;
      const otherPlace = positionOf[other] ?? (N - 1);
      if (playerPlace < otherPlace)
      {
        ps.timesBeat += 1;
      }
      ps.winRate = ps.totalGames > 0 ? ps.timesBeat / ps.totalGames : 0;
    }
  }
}

async function updateSessions(sessions: SessionRecord[], record: GameRecord)
{
  const date = isoDateString(new Date(record.endedAt).getTime());
  // find or create today's session
  let session = sessions.find(s => s.date === date);
  if (!session)
  {
    session = { date, totalGames: 0, players: {} };
    sessions.push(session);
    // keep sorted by date in ascending order
    sessions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  session.totalGames += 1;

  // compute each player's result and update player sums
  const N = record.playersCount;
  const positionOf: Record<string, number> = {};
  record.winnerOrder.forEach((name, i) => positionOf[name] = i);

  for (const playerName of record.turnOrder)
  {
    const place = positionOf[playerName] ?? (N - 1);
    const result = placeToResult(place, N); // 0..1

    if (!session.players[playerName])
    {
      session.players[playerName] = {
        sumResult: 0,
        games: 0,
        averageResult: 0,
      };
    }
    const splay = session.players[playerName];
    splay.sumResult += result;
    splay.games += 1;
    splay.averageResult = splay.sumResult / splay.games;
  }
}