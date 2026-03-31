"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { type SessionRecord } from "@/Durak"

interface SessionPlayerTimelineChartProps
{
  session: SessionRecord
}

export function SessionPlayerTimelineChart({ session }: SessionPlayerTimelineChartProps)
{
  // Prepare chart data
  const chartData = useMemo(() =>
  {
    // Gather all players ever appeared
    const allPlayers = new Set<string>();
    session.timeline.forEach((point) =>
    {
      Object.keys(point.averages).forEach((player) => allPlayers.add(player));
    });

    // Convert timeline into array suitable for Recharts
    return session.timeline.map((point) =>
    {
      const entry: Record<string, number | undefined> = { gameIndex: point.gameIndex };
      for (const player of allPlayers)
      {
        entry[player] = point.averages[player];
      }
      return entry;
    });
  }, [session.timeline]);

  const allPlayers = useMemo(() =>
  {
    const set = new Set<string>();
    session.timeline.forEach((t) => Object.keys(t.averages).forEach((p) => set.add(p)));
    return Array.from(set);
  }, [session.timeline]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{session.date} — Avg. Results Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="gameIndex"
              tickLine={false}
              axisLine={false}
              label={{ value: "Game Index", position: "insideBottomRight", offset: -5 }}
            />
            <Tooltip
              content={({ active, payload, label }) =>
              {
                if (!active || !payload || payload.length === 0) return null;

                return (
                  <div className="bg-muted p-2 rounded shadow-lg">
                    <div className="font-medium mb-1">Game {label}</div>
                    {payload.map((p) =>
                    {
                      const color = p.color ?? p.stroke ?? "currentColor"; // pick the line color
                      const value = Math.round((p.value as number ?? 0) * 100);
                      return (
                        <div key={p.dataKey} className="flex justify-between" style={{ color }}>
                          <span>{p.dataKey}: </span>
                          <span>{value}%</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />

            {allPlayers.map((player, idx) => (
              <Line
                key={player}
                type="monotone"
                dataKey={player}
                connectNulls={true} // <-- important: continue line over gaps
                stroke={`hsl(${(idx / allPlayers.length) * 360}, 65%, 50%)`}
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 1 }}
                isAnimationActive={true}
              />
            ))}

            <Legend verticalAlign="bottom" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}