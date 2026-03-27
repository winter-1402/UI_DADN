import { Server, Activity, AlertTriangle, TrendingUp } from "lucide-react";

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
    title: "Total Machines",
    value: 24,
    subtitle: "Across 3 factory lines",
    icon: <Server size={22} />,
    iconBg: "bg-blue-100 text-blue-600",
    trend: "+2 this month",
    trendUp: true,
    accent: "border-l-blue-500",
  },
  {
    title: "Active Drying",
    value: 18,
    subtitle: "75% of total capacity",
    icon: <Activity size={22} />,
    iconBg: "bg-emerald-100 text-emerald-600",
    trend: "3 in queue",
    trendUp: true,
    accent: "border-l-emerald-500",
  },
  {
    title: "Critical Alerts",
    value: 2,
    subtitle: "Requires immediate action",
    icon: <AlertTriangle size={22} />,
    iconBg: "bg-red-100 text-red-600",
    trend: "Last: Temp >70°C",
    trendUp: false,
    accent: "border-l-red-500",
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
