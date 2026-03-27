import { StatsCards } from "./StatsCards";
import { SensorTelemetry } from "./SensorTelemetry";
import { DeviceControls } from "./DeviceControls";
import { TrendChart } from "./TrendChart";
import { EventLogs } from "./EventLogs";

export function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-screen-xl mx-auto space-y-5">
        {/* Row 1: Overview Stats */}
         

        {/* Row 2: Sensor Telemetry + Device Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SensorTelemetry />
          <DeviceControls />
        </div>

        {/* Row 3: Trend Chart + Event Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <TrendChart />
          </div>
          <div className="lg:col-span-1">
            <EventLogs />
          </div>
        </div>
      </div>
    </div>
  );
}
