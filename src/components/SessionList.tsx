// SessionList.tsx
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayerStatsEntry, SessionRecord } from "@/Durak";
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

function ResultCell({ value, games }: { value: number, games: number })
{
  const percent = Math.round(value * 100);

  return (
    <div className="flex items-center gap-3">
      <RadialPercent size={36} percent={percent} />
      <div className="text-sm">
        <div className="font-medium">{games} game{games === 1 ? "" : "s"}</div>
        <div className="text-xs text-muted-foreground">
          ({value.toFixed(4)})
        </div>
      </div>
    </div>
  );
}

function PlayerPairTable({ entry }: { entry: PlayerStatsEntry })
{
  const rows = useMemo(() =>
  {
    return Object.entries(entry.playerStats).map(([name, split]) => ({
      name,
      left: split.left.winRate ?? 0,
      right: split.right.winRate ?? 0,
      overall: split.overall.winRate ?? 0,
    }));
  }, [entry.playerStats]);

  if (rows.length === 0)
  {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No pair data
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>vs</TableHead>
          <TableHead>Left</TableHead>
          <TableHead>Right</TableHead>
          <TableHead>Overall</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.name}>
            <TableCell>{r.name}</TableCell>
            <TableCell><ResultCell value={r.left} games={entry.playerStats[r.name].left.totalGames} /></TableCell>
            <TableCell><ResultCell value={r.right} games={entry.playerStats[r.name].right.totalGames} /></TableCell>
            <TableCell><ResultCell value={r.overall} games={entry.playerStats[r.name].overall.totalGames} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PlayerSubCard({
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
          <PlayerPairTable entry={entry} />
        </CollapsibleContent>
      </Collapsible>
    </Card>
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
                Pair Results
              </p>
              <p className="text-md">
                Shows the % of games where one player got a better place than another. Also shows the % separately for games where the player was on the left or right of the other.
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

/* RadialPercent component (same as before) */
function RadialPercent({ size = 40, percent }: { size?: number; percent: number })
{
  const p = Math.max(0, Math.min(100, percent));
  const stroke = Math.max(2, Math.round(size * 0.08));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - p / 100);

  // faster color change in the middle
  const t = p / 100;

  // center around 0.5, apply power, then shift back
  const strength = 0.5; // <1 = faster in middle, >1 = slower in middle
  const adjusted =
    0.5 +
    Math.sign(t - 0.5) *
    Math.pow(Math.abs(t - 0.5) * 2, strength) / 2;

  const hue = adjusted * 120;
  const color = `hsl(${hue}, 85%, 50%)`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${p}%`}>
      <defs>
        <linearGradient id={`grad-${size}-${p}`} x1="0%" x2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>

      <g transform={`translate(${size / 2},${size / 2})`}>
        <circle r={radius} cx={0} cy={0} fill="transparent" stroke="#11182720" strokeWidth={stroke} />
        <circle r={radius} cx={0} cy={0} fill="transparent" stroke={`url(#grad-${size}-${p})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} transform="rotate(-90)" />
        <text x="0" y="0" dy="0.35em" textAnchor="middle" fontSize={Math.max(8, size * 0.3)} fill="currentColor" style={{ fontWeight: 600 }}>
          {p}%
        </text>
      </g>
    </svg>
  );
}