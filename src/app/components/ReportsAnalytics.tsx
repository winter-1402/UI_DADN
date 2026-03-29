import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  ChevronDown,
  CalendarDays,
  AlertTriangle,
  Info,
  Zap,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Thermometer,
  Droplets,
  Sun,
  Filter,
  Settings,
  Play,
  Pause,
  Activity,
  Cpu,
  User,
  Search,
} from "lucide-react";

// ── Data Generation ──────────────────────────────────────────────────────────

function generateDailyData(days = 30) {
  const data = [];
  const now = new Date(2026, 2, 12); // March 12 2026
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const phase = (i / days) * Math.PI * 2;
    const temp = parseFloat((62 + Math.sin(phase) * 9 + (Math.random() - 0.5) * 5).toFixed(1));
    const humidity = parseFloat((48 - Math.sin(phase) * 8 + (Math.random() - 0.5) * 4).toFixed(1));
    const light = parseFloat((50 + Math.cos(phase) * 120 + (Math.random() - 0.5) * 60).toFixed(0));
    data.push({ day: dayLabel, temperature: temp, humidity, light });
  }
  return data;
}

type EventType = "info" | "warning" | "action" | "critical";
type ActionCategory = "parameter" | "batch" | "sensor" | "machine";

interface ActivityLog {
  id: number;
  datetime: string;
  zoneMachine: string;
  eventType: EventType;
  category: ActionCategory;
  user: string;
  details: string;
}

const allLogs: ActivityLog[] = [
  { id: 1, datetime: "Mar 12, 2026 10:05 AM", zoneMachine: "Zone A / Dryer M02", eventType: "critical", category: "sensor", user: "System", details: "Temperature exceeded critical threshold: 77°C" },
  { id: 2, datetime: "Mar 12, 2026 09:52 AM", zoneMachine: "Zone A / Dryer M03", eventType: "warning", category: "sensor", user: "System", details: "Humidity dropped below minimum: 38%" },
  { id: 3, datetime: "Mar 12, 2026 09:44 AM", zoneMachine: "Zone A / Dryer M01", eventType: "action", category: "machine", user: "System", details: "Exhaust fan turned on automatically due to high temperature" },
  { id: 4, datetime: "Mar 12, 2026 09:31 AM", zoneMachine: "Zone B / Dryer M08", eventType: "info", category: "batch", user: "Operator 3", details: "Drying cycle #44 completed successfully — Lemon batch" },
  { id: 5, datetime: "Mar 12, 2026 09:18 AM", zoneMachine: "Zone B / Dryer M09", eventType: "critical", category: "sensor", user: "System", details: "Temp alarm triggered: 78°C — Heater override applied" },
  { id: 6, datetime: "Mar 12, 2026 09:10 AM", zoneMachine: "Zone A / Dryer M04", eventType: "warning", category: "sensor", user: "System", details: "Light sensor offline — fallback to manual mode" },
  { id: 7, datetime: "Mar 12, 2026 08:57 AM", zoneMachine: "Zone A / Dryer M01", eventType: "action", category: "machine", user: "Operator 2", details: "Auto Mode re-engaged after manual override period" },
  { id: 8, datetime: "Mar 12, 2026 08:44 AM", zoneMachine: "Zone B / Dryer M11", eventType: "info", category: "batch", user: "System", details: "Scheduled Day Mode started — full heater + fan active" },
  { id: 9, datetime: "Mar 12, 2026 08:30 AM", zoneMachine: "Zone A / Dryer M03", eventType: "action", category: "machine", user: "System", details: "Natural drying door opened based on light schedule rule" },
  { id: 10, datetime: "Mar 12, 2026 08:12 AM", zoneMachine: "Zone A / Dryer M02", eventType: "warning", category: "sensor", user: "System", details: "Power fluctuation detected — voltage dip to 210V" },
  { id: 11, datetime: "Mar 12, 2026 07:55 AM", zoneMachine: "Zone B / Dryer M07", eventType: "info", category: "sensor", user: "Technician 1", details: "Sensor calibration completed — all readings nominal" },
  { id: 12, datetime: "Mar 12, 2026 07:40 AM", zoneMachine: "Zone A / Dryer M05", eventType: "action", category: "machine", user: "System", details: "Humidity threshold reached — drying door closed automatically" },
  { id: 13, datetime: "Mar 12, 2026 07:22 AM", zoneMachine: "Zone A / Dryer M02", eventType: "info", category: "parameter", user: "Admin", details: "Temperature setpoint changed: 68°C → 72°C" },
  { id: 14, datetime: "Mar 12, 2026 07:10 AM", zoneMachine: "Zone B / Dryer M08", eventType: "info", category: "batch", user: "Operator 1", details: "Started drying batch #45 — Mango (12kg)" },
  { id: 15, datetime: "Mar 11, 2026 11:30 PM", zoneMachine: "Zone B / Dryer M12", eventType: "info", category: "batch", user: "System", details: "Night Mode activated — heater reduced to 40% capacity" },
  { id: 16, datetime: "Mar 11, 2026 10:15 PM", zoneMachine: "Zone A / Dryer M06", eventType: "action", category: "batch", user: "Operator 3", details: "Drying batch #43 stopped manually — cycle complete" },
  { id: 17, datetime: "Mar 11, 2026 09:00 PM", zoneMachine: "Zone B / Dryer M10", eventType: "warning", category: "machine", user: "System", details: "Exhaust fan speed reduced — ambient temperature drop" },
  { id: 18, datetime: "Mar 11, 2026 06:45 PM", zoneMachine: "Zone A / Dryer M01", eventType: "info", category: "parameter", user: "Supervisor", details: "Fan speed adjusted: 60% → 75%" },
  { id: 19, datetime: "Mar 11, 2026 06:00 AM", zoneMachine: "All Zones", eventType: "action", category: "machine", user: "System", details: "Day Mode activated across all active machines" },
  { id: 20, datetime: "Mar 11, 2026 03:15 AM", zoneMachine: "Zone B / Dryer M09", eventType: "info", category: "batch", user: "Operator 2", details: "Started drying batch #44 — Lemon (8kg)" },
  { id: 21, datetime: "Mar 10, 2026 03:22 PM", zoneMachine: "Zone A / Dryer M02", eventType: "critical", category: "sensor", user: "System", details: "Emergency stop triggered — temperature sensor fault" },
  { id: 22, datetime: "Mar 10, 2026 02:50 PM", zoneMachine: "Zone A / Dryer M03", eventType: "info", category: "parameter", user: "Admin", details: "Humidity setpoint changed: 42% → 45%" },
  { id: 23, datetime: "Mar 10, 2026 01:45 PM", zoneMachine: "Zone B / Dryer M09", eventType: "info", category: "batch", user: "Operator 1", details: "Started drying batch #42 — Grapefruit (10kg)" },
  { id: 24, datetime: "Mar 10, 2026 12:30 PM", zoneMachine: "Zone A / Dryer M05", eventType: "action", category: "machine", user: "System", details: "Heater activated based on temperature threshold rule" },
  { id: 25, datetime: "Mar 10, 2026 11:10 AM", zoneMachine: "Zone A / Dryer M01", eventType: "action", category: "parameter", user: "Supervisor", details: "Threshold rule updated — temp limit set to 72°C" },
  { id: 26, datetime: "Mar 10, 2026 09:20 AM", zoneMachine: "Zone B / Dryer M11", eventType: "info", category: "batch", user: "Operator 2", details: "Drying batch #41 stopped — quality check complete" },
  { id: 27, datetime: "Mar 10, 2026 08:00 AM", zoneMachine: "Zone A / Dryer M04", eventType: "action", category: "machine", user: "Operator 1", details: "Manual override applied — switching to Auto mode" },
  { id: 28, datetime: "Mar 09, 2026 08:30 AM", zoneMachine: "Zone A / Dryer M04", eventType: "info", category: "machine", user: "Technician 2", details: "Machine back online after maintenance window" },
  { id: 29, datetime: "Mar 09, 2026 07:15 AM", zoneMachine: "Zone B / Dryer M07", eventType: "info", category: "parameter", user: "Admin", details: "Light intensity threshold changed: 40% → 45%" },
  { id: 30, datetime: "Mar 08, 2026 04:10 PM", zoneMachine: "Zone A / Dryer M02", eventType: "warning", category: "sensor", user: "System", details: "Temperature sensor reading unstable — averaging enabled" },
];

const eventTypeConfig: Record<EventType, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  info: { label: "Info", bg: "bg-blue-50", text: "text-blue-600", icon: <Info size={11} /> },
  warning: { label: "Warning", bg: "bg-amber-50", text: "text-amber-600", icon: <AlertTriangle size={11} /> },
  action: { label: "Action", bg: "bg-emerald-50", text: "text-emerald-700", icon: <Zap size={11} /> },
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-600", icon: <AlertTriangle size={11} /> },
};

const categoryConfig: Record<ActionCategory, { label: string; icon: React.ReactNode; color: string }> = {
  parameter: { label: "Parameter Change", icon: <Settings size={13} />, color: "#8b5cf6" },
  batch: { label: "Batch Operation", icon: <Play size={13} />, color: "#06b6d4" },
  sensor: { label: "Sensor Trigger", icon: <Activity size={13} />, color: "#f59e0b" },
  machine: { label: "Machine Action", icon: <Cpu size={13} />, color: "#10b981" },
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[160px]">
        <p className="text-slate-600 mb-2" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
          {label}
        </p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>{entry.name}</span>
            </div>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: entry.color }}>
              {entry.value}
              {entry.name === "Temperature" ? "°C" : entry.name === "Humidity" ? "%" : " %"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatPill({ label, avg, trend, color, icon }: { label: string; avg: string; trend: "up" | "down" | "stable"; color: string; icon: React.ReactNode }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#ef4444" : trend === "down" ? "#10b981" : "#94a3b8";
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: color + "1a", color }}>
        {icon}
      </span>
      <div>
        <p className="text-slate-400" style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.05em" }}>
          {label}
        </p>
        <p style={{ fontWeight: 800, fontSize: "1rem", color }}>{avg}</p>
      </div>
      <TrendIcon size={14} style={{ color: trendColor, marginLeft: "auto" }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const LOGS_PER_PAGE = 8;

export function ReportsAnalytics() {
  const [dateRange, setDateRange] = useState("30d");
  const [zoneMachine, setZoneMachine] = useState("all");
  const [eventFilter, setEventFilter] = useState<"all" | EventType>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ActionCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportDone, setExportDone] = useState(false);

  const days = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : dateRange === "60d" ? 60 : 30;
  const chartData = useMemo(() => generateDailyData(days), [days]);

  // Chart tick interval
  const tickInterval = days <= 7 ? 0 : days <= 14 ? 1 : days <= 30 ? 3 : 6;

  // Stats
  const avgTemp = (chartData.reduce((s, d) => s + d.temperature, 0) / chartData.length).toFixed(1);
  const avgHumid = (chartData.reduce((s, d) => s + d.humidity, 0) / chartData.length).toFixed(1);
  const avgLight = Math.round(chartData.reduce((s, d) => s + d.light, 0) / chartData.length);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter((l) => {
      const typeMatch = eventFilter === "all" || l.eventType === eventFilter;
      const categoryMatch = categoryFilter === "all" || l.category === categoryFilter;
      const zoneMatch = zoneMachine === "all" || l.zoneMachine.toLowerCase().includes(zoneMachine.replace("-", " "));
      const searchMatch = searchQuery === "" ||
        l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.zoneMachine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.user.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && categoryMatch && zoneMatch && searchMatch;
    });
  }, [eventFilter, categoryFilter, zoneMachine, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);

  const handleExport = () => {
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2500);
  };

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-screen-xl mx-auto space-y-5">

        {/* Page Header */}
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1.25rem" }}>
            Reports & Analytics
          </h1>
          <p className="text-slate-400" style={{ fontSize: "0.8rem" }}>
            Historical sensor data, drying cycle performance, and system event logs
          </p>
        </div>

        {/* Top Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-slate-400" />
              <div className="relative flex items-center">
                <select
                  value={dateRange}
                  onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 cursor-pointer transition-all"
                  style={{ fontSize: "0.8125rem", fontWeight: 500 }}
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="14d">Last 14 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="60d">Last 60 Days</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200" />

            {/* Zone / Machine */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <div className="relative flex items-center">
                <select
                  value={zoneMachine}
                  onChange={(e) => { setZoneMachine(e.target.value); setCurrentPage(1); }}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 cursor-pointer transition-all"
                  style={{ fontSize: "0.8125rem", fontWeight: 500 }}
                >
                  <option value="all">All Zones & Machines</option>
                  <option value="zone-a">Zone A — Tropical</option>
                  <option value="zone-b">Zone B — Citrus</option>
                  <option value="m01">Dryer M01</option>
                  <option value="m02">Dryer M02</option>
                  <option value="m09">Dryer M09</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Export Button */}
            <div className="ml-auto">
              <button
                onClick={handleExport}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  exportDone
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600"
                }`}
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {exportDone ? <CheckCircle size={15} className="text-emerald-500" /> : <Download size={15} />}
                {exportDone ? "Exported!" : "Export Data"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatPill label="AVG TEMPERATURE" avg={`${avgTemp}°C`} trend="up" color="#f97316" icon={<Thermometer size={16} />} />
          <StatPill label="AVG HUMIDITY" avg={`${avgHumid}%`} trend="down" color="#3b82f6" icon={<Droplets size={16} />} />
          <StatPill label="AVG LIGHT INTENSITY" avg={`${avgLight}%`} trend="stable" color="#eab308" icon={<Sun size={16} />} />
        </div>

        {/* 30-Day Environmental Trends Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                {days}-Day Environmental Trends
              </h2>
              <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
                Average Temperature, Humidity, and Light Intensity over time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-orange-400 rounded-full inline-block" />
                <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>Temperature</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-400 rounded-full inline-block" />
                <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>Humidity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-yellow-400 rounded-full inline-block" />
                <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>Light</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
              />
              <YAxis
                key="temp-axis"
                yAxisId="temp"
                domain={[40, 90]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}°`}
              />
              <YAxis
                key="humid-axis"
                yAxisId="humid"
                orientation="right"
                domain={[20, 80]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                key="light-axis"
                yAxisId="light"
                orientation="right"
                domain={[300, 700]}
                hide
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
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
                yAxisId="humid"
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#3b82f6" }}
              />
              <Line
                yAxisId="light"
                type="monotone"
                dataKey="light"
                name="Light"
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
                activeDot={{ r: 5, fill: "#eab308" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity History & System Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  Activity History & System Logs
                </h2>
                <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
                  {filteredLogs.length} records found
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search logs..."
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  style={{ fontSize: "0.8125rem", width: "220px" }}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Event Type Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500 mr-1" style={{ fontSize: "0.7rem", fontWeight: 600 }}>SEVERITY:</span>
                {(["all", "info", "warning", "action", "critical"] as const).map((t) => {
                  const cfg = t !== "all" ? eventTypeConfig[t] : null;
                  return (
                    <button
                      key={t}
                      onClick={() => { setEventFilter(t); setCurrentPage(1); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg capitalize transition-all ${
                        eventFilter === t
                          ? t === "all"
                            ? "bg-slate-800 text-white"
                            : `${cfg!.bg} ${cfg!.text} border border-current`
                          : "text-slate-400 hover:bg-slate-50"
                      }`}
                      style={{ fontSize: "0.72rem", fontWeight: 600 }}
                    >
                      {cfg && eventFilter === t && cfg.icon}
                      {t}
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-6 bg-slate-200" />

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500 mr-1" style={{ fontSize: "0.7rem", fontWeight: 600 }}>CATEGORY:</span>
                <button
                  onClick={() => { setCategoryFilter("all"); setCurrentPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg capitalize transition-all ${
                    categoryFilter === "all"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-50"
                  }`}
                  style={{ fontSize: "0.72rem", fontWeight: 600 }}
                >
                  All
                </button>
                {(["parameter", "batch", "sensor", "machine"] as const).map((cat) => {
                  const cfg = categoryConfig[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        categoryFilter === cat
                          ? "text-white border"
                          : "text-slate-400 hover:bg-slate-50"
                      }`}
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        background: categoryFilter === cat ? cfg.color : "transparent",
                        borderColor: categoryFilter === cat ? cfg.color : "transparent",
                      }}
                    >
                      {categoryFilter === cat && cfg.icon}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Date & Time", "Zone / Machine", "Category", "Severity", "User", "Details"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-5 py-3 text-slate-500"
                      style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em" }}
                    >
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log, idx) => {
                  const typeCfg = eventTypeConfig[log.eventType];
                  const catCfg = categoryConfig[log.category];
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-slate-600" style={{ fontSize: "0.78rem" }}>
                          {log.datetime}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-slate-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          {log.zoneMachine}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white"
                          style={{ fontSize: "0.7rem", fontWeight: 700, background: catCfg.color }}
                        >
                          {catCfg.icon}
                          {catCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${typeCfg.bg} ${typeCfg.text}`}
                          style={{ fontSize: "0.7rem", fontWeight: 700 }}
                        >
                          {typeCfg.icon}
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-400" />
                          <span className="text-slate-600" style={{ fontSize: "0.78rem" }}>
                            {log.user}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-slate-600" style={{ fontSize: "0.78rem" }}>
                          {log.details}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400" style={{ fontSize: "0.8rem" }}>
                      No records match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-white">
            <span className="text-slate-400" style={{ fontSize: "0.75rem" }}>
              Showing {Math.min((currentPage - 1) * LOGS_PER_PAGE + 1, filteredLogs.length)}–
              {Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    currentPage === page
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                  style={{ fontSize: "0.8rem", fontWeight: currentPage === page ? 700 : 400 }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
