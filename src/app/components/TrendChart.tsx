import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CalendarDays, TrendingUp } from "lucide-react";

function generateHourlyData(hours = 24) {
  const data = [];
  const now = new Date();
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60 * 60 * 1000);
    const label = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const baseTemp = 63 + Math.sin((i / 24) * Math.PI * 2) * 8;
    const baseHumid = 46 - Math.sin((i / 24) * Math.PI * 2) * 10;
    data.push({
      idx: hours - i,       // unique numeric index — used as XAxis dataKey
      time: label,          // kept for display via tickFormatter
      temperature: parseFloat((baseTemp + (Math.random() - 0.5) * 4).toFixed(1)),
      humidity: parseFloat((baseHumid + (Math.random() - 0.5) * 3).toFixed(1)),
    });
  }
  return data;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // `label` is the numeric idx; resolve to time from the first payload entry
    const timeLabel = payload[0]?.payload?.time ?? label;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[140px]">
        <p className="text-slate-500 mb-1.5" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
          {timeLabel}
        </p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: entry.color, display: "inline-block" }}
              />
              <span className="text-slate-600" style={{ fontSize: "0.75rem" }}>
                {entry.name}
              </span>
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: entry.color }}>
              {entry.value}
              {entry.name === "Temperature" ? "°C" : "%"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendChart() {
  const [range, setRange] = useState("24h");
  const [data, setData] = useState(generateHourlyData(24));

  useEffect(() => {
    const hours = range === "6h" ? 6 : range === "12h" ? 12 : 24;
    setData(generateHourlyData(hours));
  }, [range]);

  // Show every Nth label to avoid crowding
  const tickInterval = range === "6h" ? 0 : range === "12h" ? 1 : 3;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            Temp & Humidity Trends
          </h2>
          <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
            Machine #01 — Environmental tracking
          </p>
        </div>
        {/* Date Range Dropdown */}
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-slate-400" />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-emerald-400 focus:border-emerald-400 transition-colors"
            style={{ fontSize: "0.8rem", fontWeight: 500 }}
          >
            <option value="6h">Last 6 Hours</option>
            <option value="12h">Last 12 Hours</option>
            <option value="24h">Last 24 Hours</option>
          </select>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-100">
          <TrendingUp size={12} className="text-orange-500" />
          <span className="text-orange-700" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
            Avg Temp: {(data.reduce((s, d) => s + d.temperature, 0) / data.length).toFixed(1)}°C
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
          <TrendingUp size={12} className="text-blue-500" />
          <span className="text-blue-700" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
            Avg Humidity: {(data.reduce((s, d) => s + d.humidity, 0) / data.length).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            key="x-axis"
            dataKey="idx"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            tickFormatter={(idx) => data[idx]?.time ?? ""}
          />
          <YAxis
            key="y-axis-temp"
            yAxisId="temp"
            domain={[40, 90]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}°`}
          />
          <YAxis
            key="y-axis-humid"
            yAxisId="humid"
            orientation="right"
            domain={[20, 80]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip key="tooltip" content={<CustomTooltip />} />
          <Legend
            key="legend"
            wrapperStyle={{ fontSize: "0.75rem", paddingTop: "8px" }}
            formatter={(value) => (
              <span style={{ color: "#64748b", fontWeight: 500 }}>{value}</span>
            )}
          />
          <ReferenceLine
            key="ref-line-temp"
            yAxisId="temp"
            y={75}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: "⚠ 75°C", position: "right", fontSize: 10, fill: "#ef4444" }}
          />
          <Line
            key="line-temperature"
            yAxisId="temp"
            type="monotone"
            dataKey="temperature"
            name="Temperature"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#f97316" }}
          />
          <Line
            key="line-humidity"
            yAxisId="humid"
            type="monotone"
            dataKey="humidity"
            name="Humidity"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            strokeDasharray="0"
            activeDot={{ r: 5, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}