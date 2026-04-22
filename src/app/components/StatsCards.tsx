import { Server, Activity, AlertTriangle, TrendingUp, CheckCircle, Clock, Zap } from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
}

const stats: StatCard[] = [
  {
    title: "Machines Running",
    value: 18,
    subtitle: "Out of 24 total",
    icon: <Activity size={22} />,
    iconBg: "bg-emerald-100 text-emerald-600",
    trend: "3 stopped, 3 alert",
    trendUp: true,
    accent: "border-l-emerald-500",
  },
  {
    title: "Active Batches",
    value: 12,
    subtitle: "Running now",
    icon: <Zap size={22} />,
    iconBg: "bg-blue-100 text-blue-600",
    trend: "4 finishing <2h",
    trendUp: true,
    accent: "border-l-blue-500",
  },
  {
    title: "Batch Completion Rate",
    value: "94.8%",
    subtitle: "This week",
    icon: <CheckCircle size={22} />,
    iconBg: "bg-cyan-100 text-cyan-600",
    trend: "+2.3% vs last week",
    trendUp: true,
    accent: "border-l-cyan-500",
  },
  {
    title: "Avg Drying Time",
    value: "11.8h",
    subtitle: "All fruit types",
    icon: <Clock size={22} />,
    iconBg: "bg-orange-100 text-orange-600",
    trend: "-0.6h vs 7-day avg",
    trendUp: true,
    accent: "border-l-orange-500",
  },
  {
    title: "Threshold Alerts",
    value: 3,
    subtitle: "This week",
    icon: <AlertTriangle size={22} />,
    iconBg: "bg-red-100 text-red-600",
    trend: "2 by Zone B",
    trendUp: false,
    accent: "border-l-red-500",
  },
  {
    title: "Equipment Status",
    value: "98.2%",
    subtitle: "System uptime",
    icon: <Server size={22} />,
    iconBg: "bg-purple-100 text-purple-600",
    trend: "No downtime today",
    trendUp: true,
    accent: "border-l-purple-500",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`bg-white rounded-xl border border-slate-200 border-l-4 ${stat.accent} p-5 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 mb-1" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                {stat.title}
              </p>
              <p
                className={`${stat.title === "Critical Alerts" ? "text-red-600" : "text-slate-800"}`}
                style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.1 }}
              >
                {stat.value}
              </p>
              <p className="text-slate-400 mt-1" style={{ fontSize: "0.75rem" }}>
                {stat.subtitle}
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
              {stat.icon}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
            <TrendingUp
              size={13}
              className={stat.trendUp ? "text-emerald-500" : "text-red-500"}
            />
            <span
              className={stat.trendUp ? "text-emerald-600" : "text-red-500"}
              style={{ fontSize: "0.75rem", fontWeight: 500 }}
            >
              {stat.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
