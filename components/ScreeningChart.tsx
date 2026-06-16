"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: "申込中", value: 8, color: "#3b82f6" },
  { name: "審査中", value: 7, color: "#10b981" },
  { name: "回答待ち", value: 5, color: "#f59e0b" },
  { name: "承認", value: 3, color: "#8b5cf6" },
  { name: "否決", value: 1, color: "#ef4444" },
];

const total = data.reduce((s, d) => s + d.value, 0);

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    const pct = ((payload[0].value / total) * 100).toFixed(1);
    return (
      <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", color: "#111827" }}>
        <div className="font-semibold">{payload[0].name}</div>
        <div style={{ color: "#94a3b8" }}>{payload[0].value}件 ({pct}%)</div>
      </div>
    );
  }
  return null;
};

export default function ScreeningChart() {
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-48 h-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold" style={{ color: "#111827" }}>{total}</span>
          <span className="text-xs" style={{ color: "#64748b" }}>合計</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-sm flex-1" style={{ color: "#94a3b8" }}>{d.name}</span>
            <span className="text-sm font-semibold" style={{ color: "#111827" }}>{d.value}件</span>
            <span className="text-xs w-14 text-right" style={{ color: "#64748b" }}>({((d.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
