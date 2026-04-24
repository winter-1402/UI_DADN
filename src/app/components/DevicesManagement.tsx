import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initialZoneA, initialZoneB } from "../data/mockDevices";
import {
  Plus,
  ChevronDown,
  MoreVertical,
  Thermometer,
  Droplets,
  Edit2,
  Trash2,
  Cpu,
  CheckCircle,
  AlertTriangle,
  WifiOff,
  ChevronRight,
  Wind,
  Lightbulb,
  Activity,
  ChevronUp,
} from "lucide-react";

type MachineStatus = "running" | "offline" | "alert";
type MachineMode = "auto" | "manual";

interface Sensor { id: string; name: string; type: string; value: string }
interface OutputDevice { id: string; name: string; type: string; status: "on" | "off" }

interface Machine {
  id: string;
  name: string;
  zoneID: string;
  status: MachineStatus;
  temp: number;
  humidity: number;
  mode: MachineMode;
  isOn: boolean;
  fruit: string;
  runHours: number;
  batchCode: string;
  dryingStage: string;
  sensors: Sensor[];
  outputDevices: OutputDevice[];
}

interface BatchItem {
  id: string;
  machineId: string;
  machine: string;
  fruit: string;
  status: "running" | "completed" | "cancelled" | "error" | "paused" | "scheduled";
  mode: "manual" | "scheduled";
  hasThreshold: boolean;
  recipe: string;
  progress: number;
  phase: number;
  totalPhases: number;
  scheduledAt?: string;
  policy?: any;
}

const statusConfig: Record<MachineStatus, { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  running: { label: "Running", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: <CheckCircle size={11} /> },
  offline: { label: "Offline", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", icon: <WifiOff size={11} /> },
  alert: { label: "Alert", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", icon: <AlertTriangle size={11} /> },
};

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center w-10 h-5 rounded-full transition-all duration-200 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
    >
      <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transform transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function MachineCard({ machine, onToggle, onViewDetails, onDelete }: { machine: Machine; onToggle: (id: string) => void; onViewDetails: (id: string) => void; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const s = statusConfig[machine.status];

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-visible relative ${machine.status === "alert" ? "border-red-200" : "border-slate-200"}`}>
      {machine.status === "alert" && <div className="h-0.5 w-full bg-gradient-to-r from-red-400 to-orange-400 rounded-t-xl" />}

      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${machine.isOn ? "bg-slate-800" : "bg-slate-100"}`}>
            <Cpu size={16} className={machine.isOn ? "text-emerald-400" : "text-slate-400"} />
          </div>
          <div>
            <p className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.875rem" }}>{machine.name}</p>
            <p className="text-slate-400" style={{ fontSize: "0.7rem" }}>{machine.fruit} Drying</p>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-36">
              <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-50 transition-all" style={{ fontSize: "0.8rem" }}>
                <Edit2 size={13} className="text-slate-400" /> Edit Machine
              </button>
              <button onClick={() => { setMenuOpen(false); onDelete(machine.id); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-red-500 hover:bg-red-50 transition-all" style={{ fontSize: "0.8rem" }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg} ${s.text}`} style={{ fontSize: "0.7rem", fontWeight: 600 }}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${machine.status === "alert" ? "animate-pulse" : ""}`} />
          {s.icon}
          {s.label}
        </span>
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-2.5 py-2 border border-orange-100">
          <Thermometer size={13} className="text-orange-500 shrink-0" />
          <div>
            <p className="text-slate-400" style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.03em" }}>TEMP</p>
            <p className="text-orange-700" style={{ fontWeight: 700, fontSize: "0.875rem" }}>{machine.isOn ? `${machine.temp}°C` : "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-2.5 py-2 border border-blue-100">
          <Droplets size={13} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-slate-400" style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.03em" }}>HUMIDITY</p>
            <p className="text-blue-700" style={{ fontWeight: 700, fontSize: "0.875rem" }}>{machine.isOn ? `${machine.humidity}%` : "—"}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-slate-600" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Master Power</p>
          <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>{machine.isOn ? `Active • ${machine.runHours}h runtime` : "Powered off"}</p>
        </div>
        <ToggleSwitch checked={machine.isOn} onChange={() => onToggle(machine.id)} />
      </div>

      {machine.isOn && (
        <>
          <button onClick={() => setShowDetails(!showDetails)} className="w-full px-4 py-2 border-t border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Sensors & Output Devices</span>
            {showDetails ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>

          {showDetails && (
            <div className="px-4 py-3 space-y-3 bg-slate-50">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-blue-600" />
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1e293b" }}>Input Sensors</p>
                </div>
                <div className="space-y-2">
                  {machine.sensors.map((sensor) => (
                    <div key={sensor.id} className="flex items-center justify-between bg-white rounded px-3 py-2 border border-blue-100">
                      <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{sensor.name}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#0369a1" }}>{sensor.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wind size={14} className="text-amber-600" />
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1e293b" }}>Output Devices</p>
                </div>
                <div className="space-y-2">
                  {machine.outputDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between bg-white rounded px-3 py-2 border border-amber-100">
                      <div className="flex items-center gap-2">
                        {device.type === "fan" ? <Wind size={12} className="text-amber-500" /> : <Lightbulb size={12} className="text-yellow-500" />}
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{device.name}</span>
                      </div>
                      <span className={`text-xs font-600 px-2 py-0.5 rounded ${device.status === "on" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{device.status === "on" ? "ON" : "OFF"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50 rounded-b-xl">
        <span className="text-slate-500" style={{ fontSize: "0.7rem" }}>
          <span className="text-slate-400">Mode: </span>
          <span className={machine.mode === "auto" ? "text-emerald-600" : "text-amber-600"} style={{ fontWeight: 700 }}>{machine.mode === "auto" ? "Auto" : "Manual"}</span>
        </span>
        <button onClick={() => onViewDetails(machine.id)} className="flex items-center gap-0.5 text-emerald-600 hover:text-emerald-700 transition-all" style={{ fontSize: "0.7rem", fontWeight: 600 }}>
          Details <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

function ZoneSection({ title, subtitle, machines, onToggle, onViewDetails, onDelete, show }: { title: string; subtitle: string; machines: Machine[]; onToggle: (id: string) => void; onViewDetails: (id: string) => void; onDelete: (id: string) => void; show: boolean }) {
  const runningCount = machines.filter((m) => m.status === "running").length;
  const alertCount = machines.filter((m) => m.status === "alert").length;
  if (!show) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</h2>
          <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-500" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{machines.length} Machines</span>
          {runningCount > 0 && <span className="px-2.5 py-0.5 bg-emerald-50 rounded-full text-emerald-700 border border-emerald-100" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{runningCount} Active</span>}
          {alertCount > 0 && <span className="px-2.5 py-0.5 bg-red-50 rounded-full text-red-600 border border-red-100 animate-pulse" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{alertCount} Alert</span>}
        </div>
        <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {machines.map((m) => <MachineCard key={m.id} machine={m} onToggle={onToggle} onViewDetails={onViewDetails} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

export function DevicesManagement() {
  const navigate = useNavigate();

  const loadMachines = () => {
    try {
      const raw = localStorage.getItem("machines");
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          zoneA: (parsed.zoneA ?? initialZoneA) as Machine[],
          zoneB: (parsed.zoneB ?? initialZoneB) as Machine[],
        };
      }
    } catch (e) {}
    return { zoneA: initialZoneA, zoneB: initialZoneB };
  };

  const [zoneAMachines, setZoneAMachines] = useState<Machine[]>(() => loadMachines().zoneA as Machine[]);
  const [zoneBMachines, setZoneBMachines] = useState<Machine[]>(() => loadMachines().zoneB as Machine[]);
  const [zoneFilter, setZoneFilter] = useState<string>("all");

  useEffect(() => {
    localStorage.setItem("machines", JSON.stringify({ zoneA: zoneAMachines, zoneB: zoneBMachines }));
  }, [zoneAMachines, zoneBMachines]);

  // Batches persisted in localStorage so DeviceDetail can read them
  const loadBatches = (): BatchItem[] => {
    try {
      return JSON.parse(localStorage.getItem("batches") || "[]");
    } catch (e) {
      return [];
    }
  };

  const [batches, setBatches] = useState<BatchItem[]>(() => loadBatches());
  useEffect(() => localStorage.setItem("batches", JSON.stringify(batches)), [batches]);

  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineZone, setNewMachineZone] = useState("a");

  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [createBatchForm, setCreateBatchForm] = useState({ fruit: "", machine: "", recipe: "", mode: "scheduled", threshold: false, scheduledAt: "" });

  const fruits = [
    { id: "mango", name: "Mango" },
    { id: "banana", name: "Banana" },
    { id: "papaya", name: "Papaya" },
    { id: "guava", name: "Guava" },
    { id: "pineapple", name: "Pineapple" },
    { id: "orange", name: "Orange" },
  ];

  const recipes: Record<string, string[]> = {
    mango: ["Mango Dry v2.1", "Mango Express v1.0"],
    banana: ["Banana Dry v1.5", "Banana Standard"],
    papaya: ["Papaya Dry v1.0"],
    guava: ["Guava Dry v1.5"],
    pineapple: ["Pineapple Dry v3.0"],
    orange: ["Orange Dry v2.0"],
  };

  // Auto-start scheduled batches when scheduled time arrives
  useEffect(() => {
    const timer = setInterval(() => {
      setBatches((prev) => {
        let changed = false;
        const next = prev.map((b) => {
          if (b.status === "scheduled" && b.scheduledAt && new Date(b.scheduledAt).getTime() <= Date.now()) {
            changed = true;
            return { ...b, status: "running", scheduledAt: undefined } as BatchItem;
          }
          return b;
        });
        return changed ? next : prev;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleAddMachine = () => {
    if (!newMachineName) {
      alert("Please enter machine name");
      return;
    }
    const id = `M${Math.floor(100 + Math.random() * 900)}`;
    const newMachine: Machine = {
      id,
      name: newMachineName,
      zoneID: newMachineZone,
      status: "offline",
      temp: 24,
      humidity: 60,
      mode: "manual",
      isOn: false,
      fruit: "",
      runHours: 0,
      batchCode: "",
      dryingStage: "Idle",
      sensors: [
        { id: `${id}-S1`, name: "Chamber Temperature", type: "temperature", value: "24°C" },
        { id: `${id}-S2`, name: "Chamber Humidity", type: "humidity", value: "60%" },
      ],
      outputDevices: [],
    };

    if (newMachineZone === "a") setZoneAMachines((prev) => [newMachine, ...prev]);
    else setZoneBMachines((prev) => [newMachine, ...prev]);

    setShowAddMachine(false);
    setNewMachineName("");
    setNewMachineZone("a");
  };

  const handleDeleteMachine = (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa máy này?")) return;
    setZoneAMachines((prev) => prev.filter((m) => m.id !== id));
    setZoneBMachines((prev) => prev.filter((m) => m.id !== id));
    setBatches((prev) => prev.filter((b) => b.machineId !== id));
  };

  const handleToggle = (id: string) => {
    setZoneAMachines((prev) => prev.map((m) => (m.id === id ? { ...m, isOn: !m.isOn, status: !m.isOn ? "running" : "offline" } : m)));
    setZoneBMachines((prev) => prev.map((m) => (m.id === id ? { ...m, isOn: !m.isOn, status: !m.isOn ? "running" : "offline" } : m)));
  };

  const handleViewDetails = (id: string) => {
    navigate(`/devices/${id}`);
  };

  const handleCreateBatch = () => {
    if (!createBatchForm.fruit || !createBatchForm.machine || !createBatchForm.recipe) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const machineName = [...zoneAMachines, ...zoneBMachines].find((m) => m.id === createBatchForm.machine)?.name || createBatchForm.machine;
    // attach saved policy thresholds when requested
    let attachedPolicy: any = undefined;
    if (createBatchForm.threshold) {
      try {
        const saved = JSON.parse(localStorage.getItem("policies") || "{}");
        const key = (createBatchForm.fruit || "").toLowerCase();
        attachedPolicy = saved[key];
      } catch (e) { attachedPolicy = undefined; }
    }

    const newBatch: BatchItem = {
      id: `BATCH-${Date.now()}`,
      machineId: createBatchForm.machine,
      machine: machineName,
      fruit: createBatchForm.fruit,
      recipe: createBatchForm.recipe,
      mode: createBatchForm.mode as any,
      hasThreshold: createBatchForm.threshold,
      status: createBatchForm.mode === "scheduled" ? "scheduled" : "running",
      progress: 0,
      phase: 1,
      totalPhases: 3,
      scheduledAt: createBatchForm.scheduledAt || undefined,
      policy: attachedPolicy,
    };

    setBatches((prev) => [newBatch, ...prev]);
    setShowCreateBatch(false);
    setCreateBatchForm({ fruit: "", machine: "", recipe: "", mode: "scheduled", threshold: false, scheduledAt: "" });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1.25rem" }}>Device Management</h1>
            <p className="text-slate-400" style={{ fontSize: "0.8rem" }}>Monitor, configure and control all drying machines across factory zones</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 text-slate-700 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 cursor-pointer hover:border-slate-300 transition-all" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                <option value="all">All Zones</option>
                <option value="a">Zone A Only</option>
                <option value="b">Zone B Only</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => setShowAddMachine(true)} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-150">
              <Plus size={16} /> <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Add New Machine</span>
            </button>
            <button onClick={() => setShowCreateBatch(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-150">
              <Plus size={16} /> <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>New Batch</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: "Total Machines", value: zoneAMachines.length + zoneBMachines.length, color: "text-slate-800", bg: "bg-white" }, { label: "Active / Running", value: [...zoneAMachines, ...zoneBMachines].filter((m) => m.isOn).length, color: "text-emerald-700", bg: "bg-emerald-50" }, { label: "Machines with Alert", value: [...zoneAMachines, ...zoneBMachines].filter((m) => m.status === "alert").length, color: "text-red-600", bg: "bg-red-50" }].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl border border-slate-200 px-5 py-3.5 flex items-center justify-between shadow-sm`}>
              <span className="text-slate-500" style={{ fontSize: "0.8125rem" }}>{item.label}</span>
              <span className={`${item.color}`} style={{ fontWeight: 800, fontSize: "1.5rem" }}>{item.value}</span>
            </div>
          ))}
        </div>

        <ZoneSection title="Zone A — Tropical Fruits" subtitle="High-temp drying line" machines={zoneAMachines} onToggle={handleToggle} onViewDetails={handleViewDetails} onDelete={handleDeleteMachine} show={zoneFilter === "all" || zoneFilter === "a"} />

        <ZoneSection title="Zone B — Citrus Fruits" subtitle="Mid-temp drying line" machines={zoneBMachines} onToggle={handleToggle} onViewDetails={handleViewDetails} onDelete={handleDeleteMachine} show={zoneFilter === "all" || zoneFilter === "b"} />

        {/* Add Machine Modal */}
        {showAddMachine && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800" style={{ fontWeight: 700 }}>Add New Machine</h3>
                <button onClick={() => setShowAddMachine(false)} className="text-slate-500">Close</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Machine Name</label>
                  <input value={newMachineName} onChange={(e) => setNewMachineName(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zone</label>
                  <select value={newMachineZone} onChange={(e) => setNewMachineZone(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="a">Zone A</option>
                    <option value="b">Zone B</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowAddMachine(false)} className="px-3 py-2 border rounded">Cancel</button>
                  <button onClick={handleAddMachine} className="px-3 py-2 bg-emerald-600 text-white rounded">Add</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Batch Modal */}
        {showCreateBatch && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800" style={{ fontWeight: 700 }}>Create New Batch</h3>
                <button onClick={() => setShowCreateBatch(false)} className="text-slate-500">Close</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Machine</label>
                  <select value={createBatchForm.machine} onChange={(e) => setCreateBatchForm({ ...createBatchForm, machine: e.target.value })} className="w-full px-3 py-2 border rounded">
                    <option value="">Select machine</option>
                    {[...zoneAMachines, ...zoneBMachines].map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fruit</label>
                  <select value={createBatchForm.fruit} onChange={(e) => setCreateBatchForm({ ...createBatchForm, fruit: e.target.value, recipe: "" })} className="w-full px-3 py-2 border rounded">
                    <option value="">Select fruit</option>
                    {fruits.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Recipe</label>
                  <select value={createBatchForm.recipe} onChange={(e) => setCreateBatchForm({ ...createBatchForm, recipe: e.target.value })} className="w-full px-3 py-2 border rounded">
                    <option value="">Select recipe</option>
                    {(createBatchForm.fruit && recipes[createBatchForm.fruit.toLowerCase()] || []).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mode</label>
                  <select value={createBatchForm.mode} onChange={(e) => setCreateBatchForm({ ...createBatchForm, mode: e.target.value as any })} className="w-full px-3 py-2 border rounded">
                    <option value="scheduled">Scheduled</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={createBatchForm.threshold} onChange={(e) => setCreateBatchForm({ ...createBatchForm, threshold: e.target.checked })} />
                  <label>Attach threshold</label>
                </div>
                {createBatchForm.mode === "scheduled" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Start at</label>
                    <input type="datetime-local" value={createBatchForm.scheduledAt} onChange={(e) => setCreateBatchForm({ ...createBatchForm, scheduledAt: e.target.value })} className="w-full px-3 py-2 border rounded" />
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowCreateBatch(false)} className="px-3 py-2 border rounded">Cancel</button>
                  <button onClick={handleCreateBatch} className="px-3 py-2 bg-emerald-600 text-white rounded">Create Batch</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
