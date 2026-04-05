// GameHistoryList.tsx
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import type { GameRecord } from "@/Durak";
import
{
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import
{
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, Trophy, Zap } from "lucide-react";
import { svgSuitIcons } from "./PlayingCardComponent";

interface GameHistoryListProps
{
  games: GameRecord[];
}

export function GameHistoryList({ games }: GameHistoryListProps)
{
  const rev = useMemo(() => games.slice().reverse(), [games]);

  return (
    <div className="p-4 grid grid-cols-1 gap-4 w-full">
      {rev.map((game, i) => (
        <GameCard
          key={game.endedAt + i}
          game={game}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  );
}

function GameCard({
  game,
  defaultOpen,
}: {
  game: GameRecord;
  defaultOpen: boolean;
})
{
  const [open, setOpen] = useState(defaultOpen);

  const formattedDate = useMemo(() =>
  {
    const d = new Date(game.endedAt);
    return d.toLocaleString();
  }, [game.endedAt]);

  return (
    <Card className="p-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between text-left">
            <div className="flex flex-col">
              <span className="text-lg font-semibold">{formattedDate}</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-4 h-4 fill-current stroke-transparent">
                    {svgSuitIcons[game.trumpSuit]}
                  </div>
                  Trump
                </span>
                <span>•</span>
                <span>{game.playersCount} Players</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-yellow-500 font-medium">
                  <Trophy className="w-4 h-4" />
                  {game.winnerOrder[0]}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`h-8 w-8 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-bold italic flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Final Standings
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Player</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {game.winnerOrder.map((name, i) => (
                    <TableRow key={name}>
                      <TableCell className="font-bold">{i + 1}</TableCell>
                      <TableCell className={i === 0 ? "text-yellow-500 font-bold" : (i === game.winnerOrder.length - 1 ? "text-red-500 font-bold italic" : "")}>
                        {name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold italic flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Moves Log
              </h4>
              <div className="bg-muted p-3 rounded-md font-mono text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                {game.turnOrder.map((name, i) => `${i}: ${name}`).join("\n")}
                {"\n---\n"}
                {game.moves.join("\n")}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
