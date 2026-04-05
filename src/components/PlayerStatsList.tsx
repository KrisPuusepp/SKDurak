// PlayerStatsList.tsx
import { useMemo, useState } from "react";
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
import { Card } from "@/components/ui/card";
import
{
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { PlayerSubCard, ResultCell, PlayerGameStatsDetails } from "./StatsComponents";

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
    <div className="p-4 flex flex-col gap-8 w-full">
      {/* 1. All-Time Rankings */}
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

      {/* 2. Detailed Player Stats */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold italic">Detailed Player Stats</h3>
        <p className="text-sm text-muted-foreground">
          Distribution of finishing positions for each player count.
        </p>
        <div className="space-y-2">
          {sortedPlayers.map(({ name, entry }) => (
            <PlayerDistributionCard key={name} name={name} entry={entry} />
          ))}
        </div>
      </div>

      {/* 3. Head-to-Head */}
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

function PlayerDistributionCard({
  name,
  entry,
}: {
  name: string;
  entry: PlayerStatsEntry;
})
{
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-3">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex justify-between items-center text-left">
            <span className="font-medium">{name}</span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <PlayerGameStatsDetails entry={entry} />
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
