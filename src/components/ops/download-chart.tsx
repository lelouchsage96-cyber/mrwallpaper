import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OpsSeriesPoint } from "@/lib/types";
import { formatCount } from "@/lib/utils";

export function DownloadChart({ series }: { series: OpsSeriesPoint[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="h-56 animate-pulse rounded-lg bg-surface" />;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="opsDlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-fg)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-fg)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={28}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            tickFormatter={(d: string) => {
              try {
                return format(parseISO(d), "d MMM");
              } catch {
                return d;
              }
            }}
          />
          <YAxis
            width={32}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            tickFormatter={(n: number) => formatCount(n)}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)" }}
            contentStyle={{
              background: "var(--color-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--color-fg)",
            }}
            labelFormatter={(d) => {
              try {
                return format(parseISO(String(d)), "EEE d MMM");
              } catch {
                return String(d);
              }
            }}
            formatter={(value, name) => [formatCount(Number(value) || 0), String(name)]}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Downloads"
            stroke="var(--color-fg)"
            strokeWidth={1.75}
            fill="url(#opsDlFill)"
            activeDot={{ r: 3, fill: "var(--color-fg)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
