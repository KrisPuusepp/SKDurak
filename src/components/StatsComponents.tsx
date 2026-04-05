// src/components/StatsComponents.tsx
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
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
import
{
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

/* RadialPercent component */
export function RadialPercent({ size = 40, percent }: { size?: number; percent: number })
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

export function ResultCell({ value, games }: { value: number, games: number })
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

export function PlayerPairTable({ entry }: { entry: PlayerStatsEntry })
{
  const rows = useMemo(() =>
  {
    return Object.entries(entry.playerStats).map(([name, split]) => ({
      name,
      left: split.left.winRate ?? 0,
      leftGames: split.left.totalGames,
      right: split.right.winRate ?? 0,
      rightGames: split.right.totalGames,
      overall: split.overall.winRate ?? 0,
      overallGames: split.overall.totalGames,
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
            <TableCell><ResultCell value={r.left} games={r.leftGames} /></TableCell>
            <TableCell><ResultCell value={r.right} games={r.rightGames} /></TableCell>
            <TableCell><ResultCell value={r.overall} games={r.overallGames} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PlayerSubCard({
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
