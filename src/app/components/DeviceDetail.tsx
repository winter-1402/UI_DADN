import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { initialZoneA, initialZoneB } from "../data/mockDevices";
import { ArrowLeft, Thermometer, Droplets, Wind, Lightbulb, Play, Square, Trash2 } from "lucide-react";

function loadMachinesForDetail() {
  try {
    const raw = localStorage.getItem("machines");
    if (raw) {
      const parsed = JSON.parse(raw);
      return [...(parsed.zoneA || []), ...(parsed.zoneB || [])];
    }
  } catch (e) {}
  return [...initialZoneA, ...initialZoneB];
}

function loadBatches(): any[] {
  try {
    return JSON.parse(localStorage.getItem("batches") || "[]");
  } catch (e) {
    return [];
  }
}

export function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [machines, setMachines] = useState(() => loadMachinesForDetail());
  const [batches, setBatches] = useState(() => loadBatches());
  const [overrides, setOverrides] = useState<Record<string, any>>(() => {
    try { return JSON.parse(localStorage.getItem("machineOverrides") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem("machineOverrides", JSON.stringify(overrides));
  }, [overrides]);

  const machine = machines.find((m: any) => m.id === id);
  if (!machine) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-screen-md mx-auto bg-white rounded-xl p-6 border">
          <button onClick={() => navigate('/devices')} className="flex items-center gap-2 text-slate-600 mb-4"><ArrowLeft /> Back to Devices</button>
          <h2 className="text-slate-800" style={{ fontWeight: 700 }}>Machine not found</h2>
          <p className="text-slate-500">The requested machine does not exist.</p>
        </div>
      </div>
    );
  }

  const machineBatches = batches.filter((b) => b.machineId === machine.id).sort((a,b) => (b.id.localeCompare(a.id)));
  const activeBatch = machineBatches.find((b) => b.status === 'running') || machineBatches.find((b)=> b.status === 'scheduled') || null;

  const startBatch = (batchId: string) => {
    const next = batches.map((b) => b.id === batchId ? { ...b, status: 'running', scheduledAt: undefined } : b);
    setBatches(next);
    localStorage.setItem('batches', JSON.stringify(next));
  };

  const stopBatch = (batchId: string) => {
    const next = batches.map((b) => b.id === batchId ? { ...b, status: 'paused' } : b);
    setBatches(next);
    localStorage.setItem('batches', JSON.stringify(next));
  };

  const cancelBatch = (batchId: string) => {
    const next = batches.filter((b) => b.id !== batchId);
    setBatches(next);
    localStorage.setItem('batches', JSON.stringify(next));
  };

  const [tempTarget, setTempTarget] = useState(overrides[machine.id]?.tempTarget ?? machine.temp);
  const [humTarget, setHumTarget] = useState(overrides[machine.id]?.humTarget ?? machine.humidity);

  const saveOverrides = () => {
    setOverrides((prev) => ({ ...prev, [machine.id]: { ...prev[machine.id], tempTarget, humTarget } }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-screen-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate('/devices')} className="flex items-center gap-2 text-slate-600 mb-1"><ArrowLeft /> Back</button>
            <h1 className="text-slate-800" style={{ fontWeight: 700 }}>{machine.name}</h1>
            <p className="text-slate-400">ID: {machine.id} • Zone: {machine.zoneID.toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">Mode</p>
            <p className={`font-bold ${machine.mode === 'auto' ? 'text-emerald-600' : 'text-amber-600'}`}>{machine.mode === 'auto' ? 'Auto' : 'Manual'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-slate-800" style={{ fontWeight: 700 }}>Sensors</h3>
            <div className="mt-3 space-y-2">
              {machine.sensors.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {s.type === 'temperature' ? <Thermometer /> : s.type === 'humidity' ? <Droplets /> : <Thermometer />}
                    <span className="text-slate-700">{s.name}</span>
                  </div>
                  <div className="text-emerald-700 font-bold">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-slate-800" style={{ fontWeight: 700 }}>Outputs</h3>
            <div className="mt-3 space-y-2">
              {machine.outputDevices.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {d.type === 'fan' ? <Wind /> : <Lightbulb />}
                    <span className="text-slate-700">{d.name}</span>
                  </div>
                  <div className="text-slate-600">{d.status === 'on' ? 'ON' : 'OFF'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-slate-800" style={{ fontWeight: 700 }}>Current Batch</h3>
            <div className="mt-3">
              {activeBatch ? (
                <div className="p-3 border rounded bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-800 font-bold">{activeBatch.id}</p>
                      <p className="text-slate-500 text-sm">{activeBatch.fruit} • {activeBatch.recipe}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600 text-sm">{activeBatch.status}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 justify-end">
                    {activeBatch.status === 'scheduled' && (
                      <>
                        <button onClick={() => startBatch(activeBatch.id)} className="px-3 py-2 bg-emerald-600 text-white rounded"><Play /></button>
                        <button onClick={() => cancelBatch(activeBatch.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded"><Trash2 /></button>
                      </>
                    )}

                    {activeBatch.status === 'running' && (
                      <button onClick={() => stopBatch(activeBatch.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded"><Square /></button>
                    )}
                  </div>
                  {activeBatch.policy && activeBatch.policy.thresholds && activeBatch.policy.thresholds.length > 0 && (
                    <div className="mt-4">
                      <p className="text-slate-700 font-semibold" style={{ fontSize: "0.85rem" }}>Attached Thresholds</p>
                      <div className="mt-2 space-y-2">
                        {activeBatch.policy.thresholds.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between p-2 border rounded bg-white">
                            <div>
                              <p className="text-slate-700" style={{ fontWeight: 700 }}>{t.sensor} {t.condition} {t.value}</p>
                              <p className="text-slate-500 text-sm">Action: {t.action}</p>
                            </div>
                            <div className={`text-xs rounded px-2 py-1 ${t.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{t.enabled ? 'Enabled' : 'Disabled'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400">No active batch for this machine</div>
              )}
            </div>
          </div>
        </div>

        {machine.mode === 'manual' && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-slate-800" style={{ fontWeight: 700 }}>Manual Parameters</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 block mb-1">Target Temperature</label>
                <input type="number" value={tempTarget} onChange={(e) => setTempTarget(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Target Humidity</label>
                <input type="number" value={humTarget} onChange={(e) => setHumTarget(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={saveOverrides} className="px-3 py-2 bg-emerald-600 text-white rounded">Save Parameters</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeviceDetail;
