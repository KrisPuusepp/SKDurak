"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { type TimelinePoint } from "@/Durak"

interface PlayerTimelineChartProps
{
  timeline: TimelinePoint[]
  title?: string
}

export function PlayerTimelineChart({ timeline, title = "Avg. Results Over Time" }: PlayerTimelineChartProps)
{
  // Prepare chart data
  const chartData = useMemo(() =>
  {
    // Gather all players ever appeared
    const allPlayers = new Set<string>();
    timeline.forEach((point) =>
    {
      Object.keys(point.averages).forEach((player) => allPlayers.add(player));
    });

    // Convert timeline into array suitable for Recharts
    return timeline.map((point) =>
    {
      const entry: Record<string, number | undefined> = { gameIndex: point.gameIndex };
      for (const player of allPlayers)
      {
        entry[player] = point.averages[player];
      }
      return entry;
    });
  }, [timeline]);

  const allPlayers = useMemo(() =>
  {
    const set = new Set<string>();
    timeline.forEach((t) => Object.keys(t.averages).forEach((p) => set.add(p)));
    return Array.from(set);
  }, [timeline]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
                  <div className="bg-muted p-2 rounded shadow-lg border">
                    <div className="font-medium mb-1 border-b pb-1">Game {label}</div>
                    {payload.map((p) =>
                    {
                      const color = p.color ?? p.stroke ?? "currentColor"; // pick the line color
                      const value = Math.round((p.value as number ?? 0) * 100);
                      return (
                        <div key={p.dataKey} className="flex justify-between gap-4" style={{ color }}>
                          <span>{p.dataKey}: </span>
                          <span className="font-bold">{value}%</span>
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
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={true}
              />
            ))}

            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
