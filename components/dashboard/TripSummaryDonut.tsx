"use client";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface DonutProps {
  data: Array<{ name: string; value: number; color: string }>;
  centerLabel?: string;
  centerValue?: string | number;
}

export function TripSummaryDonut({ data, centerLabel, centerValue }: DonutProps) {
  return (
    <div className="relative h-[230px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-3xl font-extrabold text-brand-navy">{centerValue}</div>
        <div className="text-xs text-muted-foreground">{centerLabel}</div>
      </div>
    </div>
  );
}
