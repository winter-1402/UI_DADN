import { useEffect, useState } from "react";
import { initialZoneA, initialZoneB } from "../data/mockDevices";

export function DeviceMappingPanel({ recipeId }: { recipeId: string }) {
  const machines = [...initialZoneA, ...initialZoneB];

  const [map, setMap] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem("recipeDeviceMap") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("recipeDeviceMap", JSON.stringify(map));
    } catch {}
  }, [map]);

  const recipeDevices = map[recipeId] || [];

  const toggleDevice = (deviceId: string) => {
    setMap((prev) => {
      const ids = new Set(prev[recipeId] || []);
      if (ids.has(deviceId)) ids.delete(deviceId);
      else ids.add(deviceId);
      const next = { ...prev, [recipeId]: Array.from(ids) };
      return next;
    });
  };

  return (
    <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-slate-700" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
          Device Mapping
        </h4>
        <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>
          Assign output devices to this recipe (UI-only)
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {machines.map((m) => (
          <div key={m.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-800" style={{ fontWeight: 700 }}>{m.name}</p>
                <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>{m.id}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {m.outputDevices.map((dev: any) => (
                  <label key={dev.id} className={`px-2 py-1 rounded-md border ${recipeDevices.includes(dev.id) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-700"}`} style={{ fontSize: "0.78rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={recipeDevices.includes(dev.id)} onChange={() => toggleDevice(dev.id)} className="mr-2" />
                    {dev.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
