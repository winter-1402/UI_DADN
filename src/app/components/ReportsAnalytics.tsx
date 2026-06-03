import { useState, useMemo, useEffect } from "react";
export function useIsAdmin() {
  // Tạm thời hardcode trả về true để bạn có thể xem được 
  // toàn bộ các menu của Admin trong quá trình thiết kế UI.
  // Sau này khi team Backend (Hiếu, Huy) làm phân quyền xong thì sẽ thay đổi logic ở đây.
  return true; 
}
import {TrendChart} from "./TrendChart";
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
  Loader,
} from "lucide-react";
import { monitoringAPI, structureAPI,apiRequest } from "../config/api.config";

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
  logStyle: string;
  zoneMachine: string;
  eventType: EventType;
  category: ActionCategory;
  user: string;
  details: string;
}

type ReportRow = Record<string, string | number | boolean | null | undefined>;

type LogGroup = "user" | "batch-user" | "sensor";

function getStoredAppUserId() {
  if (typeof window === "undefined") return undefined;

  const userData = localStorage.getItem("userData");
  if (!userData) return undefined;

  try {
    const parsed = JSON.parse(userData);
    return parsed?.app_user_id ? Number(parsed.app_user_id) : undefined;
  } catch {
    return undefined;
  }
}

function normalizeReportRows(response: any): ReportRow[] {
  const rows = response?.data ?? response?.items ?? response?.rows ?? response;
  return Array.isArray(rows) ? rows : [];
}

function isDateLikeValue(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(value) ||
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
  );
}

function formatReportCellValue(column: string, value: ReportRow[string]) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" && (isDateLikeValue(value) || /date|time/i.test(column))) {
    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      const datePart = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(parsedDate);

      const timePart = new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(parsedDate);

      return (
        <div className="inline-flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 leading-tight">
          <span className="text-[0.78rem] font-semibold text-slate-700">{datePart}</span>
          <span className="text-[0.68rem] uppercase tracking-[0.08em] text-slate-400">{timePart}</span>
        </div>
      );
    }
  }

  return String(value);
}

function normalizeLogText(value: unknown) {
  return String(value ?? "").toLowerCase().trim();
}

function getLogGroup(log: ActivityLog): LogGroup {
  const text = normalizeLogText([log.details, log.zoneMachine, log.user, log.category, log.eventType].join(" "));

  if (text.includes("sensor") || text.includes("threshold") || text.includes("value") || text.includes("reading") || text.includes("update sensor") || text.includes("changed sensor")) {
    return "sensor";
  }

  if (
    text.includes("batch") ||
    text.includes("start") ||
    text.includes("started") ||
    text.includes("stop") ||
    text.includes("stopped") ||
    text.includes("create user") ||
    text.includes("created user") ||
    text.includes("add user") ||
    text.includes("new user")
  ) {
    return "batch-user";
  }

  return "user";
}

function getLogGroupMeta(group: LogGroup) {
  switch (group) {
    case "sensor":
      return {
        label: "Sensor Changes",
        description: "Thay đổi giá trị sensor / ngưỡng / tín hiệu",
        chipClassName: "bg-amber-50 text-amber-700 border border-amber-100",
      };
    case "batch-user":
      return {
        label: "Batch & User Actions",
        description: "Bắt đầu, dừng batch và thao tác tạo user",
        chipClassName: "bg-cyan-50 text-cyan-700 border border-cyan-100",
      };
    default:
      return {
        label: "User Logs",
        description: "Đăng nhập, đăng xuất và hoạt động người dùng",
        chipClassName: "bg-slate-50 text-slate-700 border border-slate-200",
      };
  }
}


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

const fallbackEventTypeConfig = {
  label: "Info",
  bg: "bg-blue-50",
  text: "text-blue-600",
  icon: <Info size={11} />,
};

const fallbackCategoryConfig = {
  label: "Other",
  icon: <Cpu size={13} />,
  color: "#64748b",
};

function getEventTypeConfig(eventType: string) {
  return eventTypeConfig[eventType as EventType] ?? fallbackEventTypeConfig;
}

function getCategoryConfig(category: string) {
  return categoryConfig[category as ActionCategory] ?? fallbackCategoryConfig;
}


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

// ── Helper Functions ────────────────────────────────────────────────────────────

function getMachineIdFromString(machineStr: string): number | null {
  // Convert machine string like "m01", "m02", "m09" to dry_id (1, 2, 9)
  if (!machineStr || machineStr === "all") return null;
  const match = machineStr.match(/m(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function getMachineLabel(machineStr: string): string {
  // Get display label for machine
  if (machineStr === "all") return "All Machines";
  const match = machineStr.match(/m(\d+)/i);
  return match ? `Dryer M${match[1]}` : machineStr;
}

// ── Main Component ────────────────────────────────────────────────────────────

const LOGS_PER_PAGE = 8;

interface ReportsAnalyticsProps {
  batchId?: number;
  appUserId?: number;
}

export function ReportsAnalytics({ batchId, appUserId }: ReportsAnalyticsProps = {}) {
  const isAdmin = useIsAdmin();
  const [dateRange, setDateRange] = useState("30d");
  const [zoneMachine, setZoneMachine] = useState("all");
  const [eventFilter, setEventFilter] = useState<"all" | EventType>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ActionCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [logStyleFilter, setLogStyleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportDone, setExportDone] = useState(false);  const [exportLoading, setExportLoading] = useState(false);  
  
  // Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<"operations" | "quality" | "incidents">("operations");
  const [selectedFileFormat, setSelectedFileFormat] = useState<"xlsx" | "pdf" | "csv">("xlsx");
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  
  // Operations overview state
  const [operationsRows, setOperationsRows] = useState<ReportRow[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(true);
  const [operationsError, setOperationsError] = useState<string | null>(null);

  // Logs state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [dryers, setDryers] = useState<Array<{ dry_id: number; dry_name: string }>>([]);
  const [dryersLoading, setDryersLoading] = useState(false);

  const resolvedAppUserId = appUserId ?? getStoredAppUserId();

  useEffect(() => {
    const fetchOperationsOverview = async () => {
      try {
        setOperationsLoading(true);
        setOperationsError(null);

        const response = await monitoringAPI.reports.operations();
        setOperationsRows(normalizeReportRows(response));
      } catch (err) {
        console.error("Error fetching operations overview:", err);
        setOperationsError(err instanceof Error ? err.message : "Failed to load operations overview");
        setOperationsRows([]);
      } finally {
        setOperationsLoading(false);
      }
    };

    fetchOperationsOverview();
  }, []);

  useEffect(() => {
    if (!resolvedAppUserId) {
      setLogsError(null);
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        setLogsError(null);
        const response = await monitoringAPI.logs.list({ app_user_id: resolvedAppUserId });
        const logsData = response?.data ?? response ?? [];
        const filteredLogs = logsData.filter((log: any) => log.app_user_id === resolvedAppUserId);
        if (Array.isArray(filteredLogs)) {
          // Transform API response to ActivityLog format
          const transformedLogs: ActivityLog[] = filteredLogs.map((log, idx) => ({
            id: log.id ?? idx,
            datetime: log.datetime ?? log.created_at ?? log.createdAt ?? new Date().toLocaleString(),
            logStyle: String(log.log_style ?? log.logStyle ?? log.severity ?? "unknown"),
            zoneMachine: log.zoneMachine ?? log.zone_machine ?? log.dry_name ?? "User log",
            eventType: log.eventType ?? log.severity ?? "info",
            category: log.category ?? log.log_category ?? "batch",
            user: log.user ?? log.app_user_name ?? `User #${resolvedAppUserId}`,
            details: log.details ?? log.message ?? log.description ?? "",
          }));
          setLogs(transformedLogs);
        } else {
          setLogsError("Invalid logs data format");
          setLogs([]);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
        setLogsError(err instanceof Error ? err.message : "Failed to load logs");
        // Fallback to mock data
        setLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogs();
  }, [resolvedAppUserId]);

  useEffect(() => {
    const fetchDryers = async () => {
      try {
        setDryersLoading(true);
        const response = await structureAPI.dryers.list();
        const list = response?.data ?? response ?? [];
        setDryers(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Error fetching dryers list:", err);
        setDryers([]);
      } finally {
        setDryersLoading(false);
      }
    };

    fetchDryers();
  }, []);

  const days = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : dateRange === "60d" ? 60 : 30;
  const mockChartData = useMemo(() => generateDailyData(days), [days]);
  
  // State for trend chart data from API
  const [trendChartData, setTrendChartData] = useState<any[]>([]);

  // Stats - use real data from chart if available, otherwise use mock data
  const dataToUse = trendChartData.length > 0 ? trendChartData : mockChartData;
  const avgTemp = (dataToUse.reduce((s, d) => s + d.temperature, 0) / dataToUse.length).toFixed(1);
  const avgHumid = (dataToUse.reduce((s, d) => s + d.humidity, 0) / dataToUse.length).toFixed(1);
  const avgLight = (dataToUse.reduce((s, d) => s + (d.light ?? 0), 0) / dataToUse.length).toFixed(0);
  const selectedDryer = useMemo(
    () => dryers.find((dryer) => String(dryer.dry_id) === zoneMachine) ?? null,
    [dryers, zoneMachine]
  );

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const styleMatch = logStyleFilter === "all" || l.logStyle.toLowerCase() === logStyleFilter.toLowerCase();
      const searchMatch = searchQuery === "" ||
        l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.zoneMachine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.logStyle.toLowerCase().includes(searchQuery.toLowerCase());
      return styleMatch && searchMatch;
    });
  }, [searchQuery, logs, logStyleFilter]);

  const logStyleOptions = useMemo(() => {
    const uniqueStyles = Array.from(new Set(logs.map((log) => log.logStyle).filter(Boolean)));
    return ["all", ...uniqueStyles];
  }, [logs]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = async () => {
    try {
      setExportLoading(true);
      setShowExportModal(false);
      
      // Build export payload
      const exportPayload = {
        report_type: selectedReportType,
        file_format: selectedFileFormat,
        filters: {
          from: new Date(dateFrom + 'T00:00:00Z').toISOString(),
          to: new Date(dateTo + 'T23:59:59Z').toISOString(),
          ...(batchId && { batch_id: batchId }),
        },
      };
      
      const response = await monitoringAPI.reports.export(exportPayload as any);
      console.log('Export response:', response);
      // If response contains file data, download it
      if (response && (response.data || response.file)) {
        const link = response.data.download_url || null;
        const fileName = `report_${selectedReportType}_${new Date().toISOString().split('T')[0]}.${selectedFileFormat}`;
        
        const fileData = await apiRequest('GET', 'http://localhost:3000'+link);
        
      }
      
      setExportDone(true);
      setTimeout(() => setExportDone(false), 2500);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
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
            Reports & Analytics Dashboard
          </h1>
          <p className="text-slate-400" style={{ fontSize: "0.8rem" }}>
            Operational, quality, incident & device efficiency reports with historical sensor data and drying cycle performance analysis
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
                  <option value="all">{dryersLoading ? "Loading..." : "All Machines"}</option>
                  {dryers.map((dryer) => (
                    <option key={dryer.dry_id} value={String(dryer.dry_id)}>
                      {dryer.dry_name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Export Button */}
            {isAdmin && (
              <div className="ml-auto" >
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    exportDone
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : exportLoading
                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600"
                }`}
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {exportLoading ? (
                  <Loader size={15} className="animate-spin" />
                ) : exportDone ? (
                  <CheckCircle size={15} className="text-emerald-500" />
                ) : (
                  <Download size={15} />
                )}
                {exportLoading ? "Exporting..." : exportDone ? "Exported!" : "Export Data"}
              </button>
            </div>
            )}
          </div>
        </div>
                  
        {/* Stats Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatPill label="AVG TEMPERATURE" avg={`${avgTemp}°C`} trend="up" color="#f97316" icon={<Thermometer size={16} />} />
          <StatPill label="AVG HUMIDITY" avg={`${avgHumid}%`} trend="down" color="#3b82f6" icon={<Droplets size={16} />} />
          <StatPill label="AVG LIGHT" avg={`${avgLight} %`} trend="stable" color="#eab308" icon={<Sun size={16} />} />
        </div>

        {/* 30-Day Environmental Trends Chart */}
        {zoneMachine && zoneMachine !== "all" ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  Temp & Humidity Trends
                </h2>
                <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
                  Machine sensor tracking over time
                </p>
              </div>
            </div>
            <TrendChart
              dryId={selectedDryer?.dry_id}
              machineLabel={selectedDryer?.dry_name}
              onDataLoaded={setTrendChartData}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  Temp & Humidity Trends
                </h2>
                <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
                  Select a specific machine to view sensor data
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center h-[220px] text-slate-400">
              <p>Please select a specific machine (Dryer M01, M02, etc.) to display sensor trends</p>
            </div>
          </div>
        )}

        
        {/* Operations Overview Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                Operations Overview
              </h2>
              <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
                Data from /api/v1/reports/operations
              </p>
            </div>
            <div className="text-slate-400" style={{ fontSize: "0.75rem" }}>
              {operationsLoading ? "Loading operations..." : `${operationsRows.length} records`}
            </div>
          </div>

          {operationsError && (
            <div className="px-5 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
              {operationsError}
            </div>
          )}

          {operationsLoading ? (
            <div className="px-5 py-8 text-sm text-slate-400">Loading operations overview...</div>
          ) : operationsRows.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-400">No operations overview records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {Object.keys(operationsRows[0]).map((column) => (
                      <th
                        key={column}
                        className="text-left px-5 py-3 text-slate-500"
                        style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em" }}
                      >
                        {column.replace(/_/g, " ").toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operationsRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      {Object.keys(operationsRows[0]).map((column) => (
                        <td key={column} className="px-5 py-3.5">
                          <div className="text-slate-600" style={{ fontSize: "0.78rem" }}>
                            {formatReportCellValue(column, row[column])}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* User Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  Logs by Type {resolvedAppUserId ? `(User #${resolvedAppUserId})` : ""}
                </h2>
                <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
                  {logsLoading ? "Loading logs..." : `${filteredLogs.length} records found`} · Tách thành 3 bảng riêng theo loại log
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
                  disabled={logsLoading}
                />
              </div>
            </div>

            {/* Error state */}
            {logsError && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-red-700 text-sm">{logsError}</span>
              </div>
            )}

            {/* Loading state */}
            {logsLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader size={16} className="animate-spin text-slate-400 mr-2" />
                <span className="text-slate-400 text-sm">Loading logs data...</span>
              </div>
            )}

            {/* log_style Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 mr-1" style={{ fontSize: "0.7rem", fontWeight: 600 }}>LOG STYLE:</span>
              {logStyleOptions.map((style) => {
                const active = logStyleFilter === style;
                return (
                  <button
                    key={style}
                    onClick={() => { setLogStyleFilter(style); setCurrentPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg capitalize transition-all ${
                      active
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-50"
                    }`}
                    style={{ fontSize: "0.72rem", fontWeight: 600 }}
                  >
                    {style === "all" ? "All" : style.replace(/[_-]/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 pb-5 pt-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <h3 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    Log Table
                  </h3>
                  <p className="text-slate-400" style={{ fontSize: "0.72rem" }}>
                    Lọc trực tiếp theo log_style
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                  {filteredLogs.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Date & Time", "Log Style", "User", "Details"].map((col) => (
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
                    {filteredLogs.length > 0 ? (
                      paginatedLogs.map((log, idx) => (
                        <tr
                          key={log.id}
                          className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="text-slate-600" style={{ fontSize: "0.78rem" }}>
                              {formatReportCellValue("datetime", log.datetime)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100">
                              {log.logStyle.replace(/[_-]/g, " ")}
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-400" style={{ fontSize: "0.8rem" }}>
                          No records match the selected log_style.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-slate-800 text-lg font-bold mb-4">Export Report</h2>
              
              <div className="space-y-4">
                {/* Report Type */}
                <div>
                  <label className="block text-slate-600 text-sm font-semibold mb-2">Report Type</label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  >
                    <option value="operations">Operations Report</option>
                    <option value="quality">Quality Report</option>
                    <option value="incidents">Incidents Report</option>
                  </select>
                </div>

                {/* File Format */}
                <div>
                  <label className="block text-slate-600 text-sm font-semibold mb-2">File Format</label>
                  <select
                    value={selectedFileFormat}
                    onChange={(e) => setSelectedFileFormat(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  >
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="pdf">PDF (.pdf)</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-sm font-semibold mb-2">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-sm font-semibold mb-2">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExport}
                  disabled={exportLoading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {exportLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Export
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
