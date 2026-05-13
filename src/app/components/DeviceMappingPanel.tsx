import { useEffect, useState } from "react";
import { structureAPI } from "../config/api.config";
import { useConditionalApiData } from "../../hooks/useApiData";
import { DryerDetail } from "../types/dryer";

export function DeviceMappingPanel({ 
  recipeId, 
  dryerId,
}: { 
  recipeId: string
  dryerId?: number
}) {
  // Local state for device mapping
  const [map, setMap] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem("recipeDeviceMap") || "{}");
    } catch {
      return {};
    }
  });

  // Fetch specific dryer with controls from GET /dryers/{id}
  const { data: dryerWithControls, loading: loadingDryerWithControls } = useConditionalApiData<DryerDetail>(
    dryerId ? () => structureAPI.dryers.get(dryerId) : null,
    [dryerId]
  );

  // Fetch all dryers first to get list, then fetch details for each
  const { data: allDryersBasic, loading: loadingAllDryersBasic } = useConditionalApiData<DryerDetail>(
    !dryerId ? () => structureAPI.dryers.list() : null,
    [dryerId]
  );

  const [allDryersWithControls, setAllDryersWithControls] = useState<DryerDetail[]>([]);
  const [loadingAllControls, setLoadingAllControls] = useState(false);

  // Fetch full details (with controls) for all dryers
  useEffect(() => {
    if (!dryerId && allDryersBasic.length > 0) {
      setLoadingAllControls(true);
      Promise.all(
        allDryersBasic.map(async (dryer) => {
          try {
            const result = await structureAPI.dryers.get(dryer.dry_id);
            return result.data || result;
          } catch (error) {
            console.error(`Error fetching dryer ${dryer.dry_id}:`, error);
            return dryer;
          }
        })
      ).then((dryersData) => {
        setAllDryersWithControls(dryersData);
        setLoadingAllControls(false);
      });
    }
  }, [allDryersBasic, dryerId]);

  // Determine which dryers to display
  const dryers = dryerId 
    ? dryerWithControls 
    : allDryersWithControls;

  const loading = dryerId 
    ? loadingDryerWithControls 
    : loadingAllDryersBasic || loadingAllControls;

  // Save device mapping to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("recipeDeviceMap", JSON.stringify(map));
    } catch {}
  }, [map]);

  const recipeDevices = map[recipeId] || [];

  const toggleDevice = (deviceId: string) => {
    setMap((prev) => {
      const ids = new Set(prev[recipeId] || []);
      if (ids.has(deviceId)) {
        ids.delete(deviceId);
      } else {
        ids.add(deviceId);
      }
      return { ...prev, [recipeId]: Array.from(ids) };
    });
  };

  if (loading) {
    return (
      <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-slate-500">Loading devices...</p>
      </div>
    );
  }

  // Ensure dryers is an array
  const dryersArray = Array.isArray(dryers) ? dryers : [dryers];

  return (
    <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-slate-700" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
          Device Mapping
        </h4>
        <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>
          Assign output devices to this recipe
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {dryersArray.length > 0 ? (
          dryersArray.map((dryer) => {
            const controls = dryer.controls || [];
            return (
              <div
                key={dryer.dry_id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-800" style={{ fontWeight: 700 }}>
                      {dryer.dry_name}
                    </p>
                    <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
                      ID: {dryer.dry_id} • Status: {dryer.status}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {controls.length > 0 ? (
                      controls.map((control) => (
                        <label
                          key={control.control_id}
                          className={`px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                            recipeDevices.includes(String(control.control_id))
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                          style={{ fontSize: "0.78rem" }}
                        >
                          <input
                            type="checkbox"
                            checked={recipeDevices.includes(String(control.control_id))}
                            onChange={() =>
                              toggleDevice(String(control.control_id))
                            }
                            className="mr-2"
                          />
                          {control.control_name}
                        </label>
                      ))
                    ) : (
                      <p className="text-slate-500" style={{ fontSize: "0.78rem" }}>
                        No controls available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-500 text-center py-4">No dryers available</p>
        )}
      </div>
    </div>
  );
}