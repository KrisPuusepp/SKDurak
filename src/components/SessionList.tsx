// SessionList.tsx
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import type { SessionRecord } from "@/Durak";
import
{
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"; // shadcn table primitives
import
{
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { SessionPlayerTimelineChart } from "./SessionPlayerTimelineChart";
import { PlayerSubCard, ResultCell } from "./StatsComponents";

export function SessionList({ sessions }: { sessions: SessionRecord[] })
{
  const rev = useMemo(() => sessions.slice().reverse(), [sessions]);

  return (
    <div className="p-4 grid grid-cols-1 gap-4 w-full">
      {rev.map((session, i) => (
        <SessionCard
          key={session.date}
          session={session}
          defaultOpen={i === 0} // only most recent open
        />
      ))}
    </div>
  );
}

function SessionCard({
  session,
  defaultOpen,
}: {
  session: SessionRecord;
  defaultOpen: boolean;
})
{
  const [open, setOpen] = useState(defaultOpen);

  const playerRows = useMemo(() =>
  {
    const rows = Object.entries(session.players).map(([name, summary]) => ({
      name,
      games: summary.totalGames,
      avg: summary.averageResult,
      summary,
    }));

    rows.sort((a, b) => b.avg - a.avg);
    return rows;
  }, [session.players]);

  return (
    <Card className="p-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between text-left">
            <h3 className="text-lg font-semibold">
              {session.date} — {session.totalGames} game{session.totalGames === 1 ? "" : "s"}
            </h3>

            <ChevronDown
              className={`h-8 w-8 transition-transform ${open ? "rotate-180" : ""
                }`}
            />
          </button>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent className="mt-4">
          <div className="overflow-auto">

            <div className="my-4">
              <p className="mt-4 text-lg italic font-bold">
                Average Results
              </p>
              <p className="text-md">
                1st place is worth 100% and last place is worth 0%.
              </p>
            </div>

            {/* Main table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Name</TableHead>
                  <TableHead className="w-[80%]">Avg. result</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {playerRows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      <ResultCell value={r.avg} games={r.games} />
                    </TableCell>
                  </TableRow>
                ))}

                {playerRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">
                      No players recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <SessionPlayerTimelineChart session={session} />

            <div className="my-4">
              <p className="mt-4 text-lg italic font-bold">
                Pairwise Results
              </p>
              <p className="text-md">
                Shows the % of games where one player got a better place than another. Also shows the % separately for games where the player was on the left or right of the first.
              </p>
            </div>

            {/* Player pair stats */}
            <div className="mt-6 space-y-2">
              {playerRows.map((r) => (
                <PlayerSubCard
                  key={r.name}
                  name={r.name}
                  entry={r.summary}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
