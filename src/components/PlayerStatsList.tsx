// PlayerStatsList.tsx
import { useMemo } from "react";
import type { PlayerStatsEntry } from "@/Durak";
import
{
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PlayerSubCard, ResultCell } from "./StatsComponents";

interface PlayerStatsListProps
{
  playerStats: Record<string, PlayerStatsEntry>;
}

export function PlayerStatsList({ playerStats }: PlayerStatsListProps)
{
  const sortedPlayers = useMemo(() =>
  {
    return Object.entries(playerStats)
      .map(([name, entry]) => ({ name, entry }))
      .sort((a, b) => b.entry.averageResult - a.entry.averageResult);
  }, [playerStats]);

  return (
    <div className="p-4 flex flex-col gap-6 w-full">
      <div className="space-y-2">
        <h3 className="text-xl font-bold italic">All-Time Rankings</h3>
        <p className="text-sm text-muted-foreground">
          Average result across all games played. 1st place is worth 100% and last place is worth 0%.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Avg. Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map(({ name, entry }) => (
              <TableRow key={name}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell>
                  <ResultCell value={entry.averageResult} games={entry.totalGames} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold italic">
          Pairwise Results
        </h3>
        <p className="text-sm text-muted-foreground">
          Shows the % of games where one player got a better place than another. Also shows the % separately for games where the player was on the left or right of the first.
        </p>
        <div className="space-y-2">
          {sortedPlayers.map(({ name, entry }) => (
            <PlayerSubCard key={name} name={name} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
