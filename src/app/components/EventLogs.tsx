import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Info, Thermometer, Droplets, Zap, RefreshCw } from "lucide-react";

type LogLevel = "critical" | "warning" | "info" | "success";

interface LogEntry {
  id: number;
  time: string;
  device: string;
  status: string;
  level: LogLevel;
}

const initialLogs: LogEntry[] = [
  { id: 1, time: "10:05 AM", device: "M01-BayA", status: "Temp exceeded 70°C", level: "critical" },
  { id: 2, time: "09:52 AM", device: "M03-BayA", status: "Humidity dropped to 32%", level: "warning" },
  { id: 3, time: "09:44 AM", device: "M01-BayA", status: "Exhaust Fan turned ON", level: "info" },
  { id: 4, time: "09:31 AM", device: "M02-BayB", status: "Drying cycle completed", level: "success" },
  { id: 5, time: "09:18 AM", device: "M05-BayC", status: "Heater System activated", level: "info" },
  { id: 6, time: "09:10 AM", device: "M04-BayB", status: "Light sensor offline", level: "warning" },
  { id: 7, time: "08:57 AM", device: "M01-BayA", status: "Auto Mode engaged", level: "success" },
  { id: 8, time: "08:44 AM", device: "M06-BayC", status: "Temp alarm cleared", level: "success" },
  { id: 9, time: "08:30 AM", device: "M03-BayA", status: "Humidity target reached", level: "success" },
  { id: 10, time: "08:12 AM", device: "M02-BayB", status: "Power surge detected", level: "critical" },
];

const levelConfig: Record<LogLevel, { icon: React.ReactNode; bg: string; text: string; dot: string }> = {
  critical: {
    icon: <AlertTriangle size={13} />,
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  warning: {
    icon: <AlertTriangle size={13} />,
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-400",
  },
  info: {
    icon: <Info size={13} />,
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-400",
  },
  success: {
    icon: <CheckCircle size={13} />,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-400",
  },
};

export function EventLogs() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | LogLevel>("all");
  const [logs, setLogs] = useState(initialLogs);

  const filtered = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  const addNewLog = () => {
    const entries = [
      { status: "Temp spike: 68°C", level: "warning" as LogLevel, device: "M01-BayA" },
      { status: "Fan speed increased", level: "info" as LogLevel, device: "M03-BayA" },
      { status: "Drying batch started", level: "success" as LogLevel, device: "M02-BayB" },
      { status: "Temp critical: 76°C", level: "critical" as LogLevel, device: "M04-BayB" },
    ];
    const random = entries[Math.floor(Math.random() * entries.length)];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLogs((prev) => [
      { id: prev.length + 1, time: timeStr, ...random },
      ...prev.slice(0, 9),
    ]);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            Event Logs
          </h2>
          <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
            System activity feed
          </p>
        </div>
        <button
          onClick={addNewLog}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          title="Simulate new event"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-3">
        {(["all", "critical", "warning", "info", "success"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded-md capitalize transition-all ${
              filter === f
                ? "bg-slate-800 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
            style={{ fontSize: "0.68rem", fontWeight: 600 }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight: "320px" }}>
        {filtered.map((log) => {
          const config = levelConfig[log.level];
          return (
            <div
              key={log.id}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg ${config.bg} transition-all`}
            >
              <span className={`mt-0.5 ${config.text} shrink-0`}>{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    className="text-slate-700 truncate"
                    style={{ fontSize: "0.76rem", fontWeight: 600 }}
                  >
                    {log.device}
                  </span>
                  <span className="text-slate-400 shrink-0" style={{ fontSize: "0.68rem" }}>
                    {log.time}
                  </span>
                </div>
                <p className="text-slate-600" style={{ fontSize: "0.72rem" }}>
                  {log.status}
                </p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
            <CheckCircle size={28} />
            <p className="mt-2" style={{ fontSize: "0.75rem" }}>No events found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-slate-400" style={{ fontSize: "0.7rem" }}>
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => navigate("/reports")}
          className="text-emerald-600 hover:underline"
          style={{ fontSize: "0.72rem", fontWeight: 600 }}
        >
          View all logs → 
        </button>
      </div>
    </div>
  );
}
