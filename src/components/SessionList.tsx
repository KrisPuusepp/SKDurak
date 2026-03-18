// SessionList.tsx
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SessionRecord, SessionPlayerSummary } from "@/Durak";

import
{
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"; // shadcn table primitives

type SortKey = "avg" | "games";

export function SessionList({ sessions }: { sessions: SessionRecord[] })
{
  const rev = useMemo(() => sessions.slice().reverse(), [sessions]);

  return (
    <div className="p-4 grid grid-cols-1 gap-4">
      {rev.map((session) => (
        <SessionCard key={session.date} session={session} />
      ))}
    </div>
  );
}

function SessionCard({ session }: { session: SessionRecord })
{
  const playerRows = useMemo(() =>
  {
    const rows = Object.entries(session.players).map(([name, summary]) => ({
      name,
      games: summary.games,
      avg: summary.averageResult,
      summary,
    }));

    // Always sort by avg descending
    rows.sort((a, b) => b.avg - a.avg);

    return rows;
  }, [session.players]);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">
        {session.date} — {session.totalGames} games
      </h3>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Name</TableHead>
              <TableHead className="w-[20%]">Games</TableHead>
              <TableHead className="w-[35%]">Avg. result</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {playerRows.map((r) => (
              <TableRow key={r.name}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.games}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <RadialPercent size={44} percent={Math.round(r.avg * 100)} />
                    <div className="text-sm">
                      <div className="font-medium">{Math.round(r.avg * 100)}%</div>
                      <div className="text-xs text-muted-foreground">
                        ({r.avg.toFixed(2)})
                      </div>
                    </div>
                  </div>
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
      </div>
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
        <text x="0" y="0" dy="0.35em" textAnchor="middle" fontSize={Math.max(8, size * 0.25)} fill="currentColor" style={{ fontWeight: 600 }}>
          {p}
        </text>
      </g>
    </svg>
  );
}