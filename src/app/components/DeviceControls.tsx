import { useState } from "react";
import { Wind, DoorOpen, Flame, ToggleLeft, ToggleRight, Activity } from "lucide-react";

interface DeviceButton {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  onColor: string;
  offColor: string;
  onBg: string;
  offBg: string;
  onLabel: string;
  offLabel: string;
}

const devices: DeviceButton[] = [
  {
    id: "fan",
    label: "Exhaust Fan",
    sublabel: "Ventilation System",
    icon: <Wind size={22} />,
    onColor: "text-blue-600",
    offColor: "text-slate-400",
    onBg: "bg-blue-50 border-blue-200",
    offBg: "bg-slate-50 border-slate-200",
    onLabel: "Running",
    offLabel: "Stopped",
  },
  {
    id : "light",
    label: "Drying Light",
    sublabel: "UV Sterilization",
    icon: <Flame size={22} />,
    onColor: "text-yellow-600",
    offColor: "text-slate-400",
    onBg: "bg-yellow-50 border-yellow-200",
    offBg: "bg-slate-50 border-slate-200",
    onLabel: "On",
    offLabel: "Off",
  },
  {
    id: "door",
    label: "Drying Door",
    sublabel: "Natural Air Flow",
    icon: <DoorOpen size={22} />,
    onColor: "text-emerald-600",
    offColor: "text-slate-400",
    onBg: "bg-emerald-50 border-emerald-200",
    offBg: "bg-slate-50 border-slate-200",
    onLabel: "Open",
    offLabel: "Closed",
  },
  {
    id: "heater",
    label: "Heater System",
    sublabel: "Thermal Element",
    icon: <Flame size={22} />,
    onColor: "text-orange-600",
    offColor: "text-slate-400",
    onBg: "bg-orange-50 border-orange-200",
    offBg: "bg-slate-50 border-slate-200",
    onLabel: "Active",
    offLabel: "Off",
  },
];

export function DeviceControls() {
  const [autoMode, setAutoMode] = useState(true);
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>({
    fan: true,
    door: false,
    light : false,
    heater: true,
  });

  const toggleDevice = (id: string) => {
    if (autoMode) return;
    setDeviceStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            Device Controls
          </h2>
          <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
            Machine #01 — Manual Override
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-slate-400" />
        </div>
      </div>

      {/* Auto / Manual Toggle */}
      <div
        className={`flex items-center justify-between p-4 rounded-xl mb-5 border-2 transition-all duration-300 ${
          autoMode
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div>
          <p
            className={autoMode ? "text-emerald-800" : "text-amber-800"}
            style={{ fontWeight: 700, fontSize: "0.9375rem" }}
          >
            {autoMode ? "Auto Mode" : "Manual Mode"}
          </p>
          <p
            className={autoMode ? "text-emerald-600" : "text-amber-600"}
            style={{ fontSize: "0.75rem" }}
          >
            {autoMode
              ? "System controls devices automatically"
              : "Manual control is active"}
          </p>
        </div>
        <button
          onClick={() => setAutoMode(!autoMode)}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {autoMode ? (
            <ToggleRight size={48} className="text-emerald-500" />
          ) : (
            <ToggleLeft size={48} className="text-amber-400" />
          )}
        </button>
      </div>

      {/* Device Buttons */}
      <div className="space-y-3">
        {devices.map((device) => {
          const isOn = deviceStates[device.id];
          return (
            <div
              key={device.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                isOn ? device.onBg : device.offBg
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                    isOn ? `${device.onBg} ${device.onColor}` : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {device.icon}
                </div>
                <div>
                  <p
                    className={isOn ? device.onColor.replace("text-", "text-").replace("-600", "-800") : "text-slate-600"}
                    style={{ fontWeight: 600, fontSize: "0.875rem" }}
                  >
                    {device.label}
                  </p>
                  <p className="text-slate-400" style={{ fontSize: "0.72rem" }}>
                    {device.sublabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full ${
                    isOn
                      ? `${device.onBg} ${device.onColor}`
                      : "bg-slate-100 text-slate-400"
                  }`}
                  style={{ fontSize: "0.72rem", fontWeight: 600 }}
                >
                  {isOn ? device.onLabel : device.offLabel}
                </span>
                <button
                  onClick={() => toggleDevice(device.id)}
                  disabled={autoMode}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                    autoMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  } ${isOn ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                      isOn ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {autoMode && (
        <p className="mt-3 text-slate-400 text-center" style={{ fontSize: "0.72rem" }}>
          Switch to Manual Mode to control devices
        </p>
      )}
    </div>
  );
}
