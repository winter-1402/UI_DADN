import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { structureAPI, catalogAPI, BATCH_ENDPOINTS, FACTORY_ENDPOINTS, apiRequest } from "../config/api.config";
import { useApiData, useConditionalApiData } from "../../hooks/useApiData";
import { convertDryerToMachine, Machine } from "../utils/dryerConverter";
import { DryerDetail } from "../types/dryer";
import { Factory, Area, Fruit } from "../types/api";
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
  Sun,
} from "lucide-react";

type MachineStatus = "running" | "offline" | "alert";

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

function MachineCard({ machine, onToggle, onViewDetails, onDelete, onChangeName }: { machine: Machine; onToggle: (id: string) => void; onViewDetails: (id: string) => void; onDelete: (id: string) => void; onChangeName: (id: string, currentName: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [freshTemp, setFreshTemp] = useState<number | null>(null);
  const [freshHumidity, setFreshHumidity] = useState<number | null>(null);
  const [freshLight, setFreshLight] = useState<number | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number | null>(null);
  const [humThreshold, setHumThreshold] = useState<number | null>(null);
  const [lightThreshold, setLightThreshold] = useState<number | null>(null);
  const [localPowerOn, setLocalPowerOn] = useState(machine.isOn ?? true);
  const [powerLoading, setPowerLoading] = useState(false);
  const s = statusConfig[(machine.status as MachineStatus)] ?? statusConfig.offline;

  // Fetch fresh dryer data including temperature and humidity
  useEffect(() => {
    const fetchFreshDryerData = async () => {
      try {
        const dryerId = Number(machine.id.replace(/^D/, ''));
        if (!dryerId) return;

        const response = await apiRequest('GET', FACTORY_ENDPOINTS.dryers.get(dryerId)) as any;
        
        // Extract dryer data from response wrapper
        const dryerData = response?.data || response;
        const sensors = dryerData?.sensors || [];
        
        const temperatureSensor = sensors.find((s: any) => s.sensor_type === 'temperature');
        const humiditySensor = sensors.find((s: any) => s.sensor_type === 'humidity');
        const lightSensor = sensors.find((s: any) => s.sensor_type === 'light');
        
        setFreshTemp(temperatureSensor?.last_value ?? null);
        setFreshHumidity(humiditySensor?.last_value ?? null);
        setFreshLight(lightSensor?.last_value ?? null);
        setTempThreshold(temperatureSensor?.threshold ?? null);
        setHumThreshold(humiditySensor?.threshold ?? null);
        setLightThreshold(lightSensor?.threshold ?? null);
        // Update power state from fetched data
        if (dryerData?.is_on !== undefined) {
          setLocalPowerOn(dryerData.is_on);
        }
      } catch (error) {
        console.error(`Failed to fetch fresh dryer data for ${machine.name}:`, error);
        // Use fallback values from machine object
        setFreshTemp(machine.temp);
        setFreshHumidity(machine.humidity);
      }
    };

    fetchFreshDryerData();
    
    // Optional: Poll for updates every 10 seconds
    const interval = setInterval(fetchFreshDryerData, 10000);
    return () => clearInterval(interval);
  }, [machine.id, machine.name]);

  // Handler for Master Power toggle - calls API to update dryer status
  const handlePowerToggle = async (newPowerState: boolean) => {
    try {
      setPowerLoading(true);
      const dryerId = Number(machine.id.replace(/^D/, ''));
      if (!dryerId) {
        toast.error("Không thể xác định ID máy");
        return;
      }

      // Call API to update dryer status - update both is_on and status
      await structureAPI.dryers.update(dryerId, {
        is_on: newPowerState,
        status: newPowerState ? "Running" : "Idle",
      });

      setLocalPowerOn(newPowerState);
      toast.success(newPowerState ? "Bật máy thành công" : "Tắt máy thành công");
    } catch (error) {
      console.error("Error updating dryer power status:", error);
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái máy");
      // Revert to previous state on error
      setLocalPowerOn(!newPowerState);
    } finally {
      setPowerLoading(false);
    }
  };

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
              <button onClick={() => {setMenuOpen(false); onChangeName(machine.id, machine.name);}} className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-50 transition-all" style={{ fontSize: "0.8rem" }}>
                <Edit2 size={13} className="text-slate-400" /> Change Name
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

      {/* Temperature & Humidity & Light Display - Only show if machine is not offline or if power is on */}
      {(machine.status !== "offline" || localPowerOn) && (
        <>
          <div className="px-4 pb-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-1 bg-orange-50 rounded-lg px-2.5 py-1.5 border border-orange-100">
              <Thermometer size={14} className="text-orange-500" />
              <span className="text-orange-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {(freshTemp !== null ? freshTemp : machine.temp).toFixed(1)}°C
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 bg-blue-50 rounded-lg px-2.5 py-1.5 border border-blue-100">
              <Droplets size={14} className="text-blue-500" />
              <span className="text-blue-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {(freshHumidity !== null ? freshHumidity : machine.humidity).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 bg-yellow-50 rounded-lg px-2.5 py-1.5 border border-yellow-100">
              <Sun size={14} className="text-yellow-500" />
              <span className="text-yellow-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {(freshLight !== null ? freshLight : 0).toFixed(0)} %
              </span>
            </div>
          </div>

          {/* Threshold Information */}
          {(tempThreshold !== null || humThreshold !== null || lightThreshold !== null) && (
            <div className="px-4 pb-3 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-1.5 bg-orange-100 rounded-lg px-2.5 py-1.5 border border-orange-200">
            <Thermometer size={12} className="text-orange-600 shrink-0" />
            <span className="text-orange-600 text-xs font-medium truncate">
              Ngưỡng: {tempThreshold ?? 0}°C
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-100 rounded-lg px-2.5 py-1.5 border border-blue-200">
            <Droplets size={12} className="text-blue-600 shrink-0" />
            <span className="text-blue-600 text-xs font-medium truncate">
              Ngưỡng: {humThreshold ?? 0}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-100 rounded-lg px-2.5 py-1.5 border border-yellow-200">
            <Sun size={12} className="text-yellow-600 shrink-0" />
            <span className="text-yellow-600 text-xs font-medium truncate">
              Ngưỡng: {lightThreshold ?? 0} %
            </span>
          </div>
        </div>
          )}
        </>
      )}

      <div className="px-4 pb-3 flex items-center justify-between">
        {machine.status === "offline" ? (
          <>
            <div>
              <p className="text-slate-600" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Master Power</p>
              <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>Offline - Không khả dụng</p>
            </div>
            <ToggleSwitch checked={localPowerOn} onChange={handlePowerToggle} disabled={false} />
          </>
        ) : (
          <>
            <div>
              <p className="text-slate-600" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Master Power</p>
              <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>{localPowerOn ? `Active` : "Powered off"}</p>
            </div>
            <ToggleSwitch checked={localPowerOn} onChange={handlePowerToggle} disabled={powerLoading} />
          </>
        )}
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-end bg-slate-50 rounded-b-xl">
        <button onClick={() => onViewDetails(machine.id)} className="flex items-center gap-0.5 text-emerald-600 hover:text-emerald-700 transition-all" style={{ fontSize: "0.7rem", fontWeight: 600 }}>
          Details <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

function ZoneSection({ title, subtitle, machines, onToggle, onViewDetails, onDelete, onChangeName, show }: { title: string; subtitle: string; machines: Machine[]; onToggle: (id: string) => void; onViewDetails: (id: string) => void; onDelete: (id: string) => void; onChangeName: (id: string, currentName: string) => void; show: boolean }) {
  const runningCount = machines.filter((m) => m.status === "running").length;
  const alertCount = machines.filter((m) => m.status === "offline").length;
  if (!show) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</h2>
          <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-500" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{machines.length} Machines</span>
          {runningCount > 0 && <span className="px-2.5 py-0.5 bg-emerald-50 rounded-full text-emerald-700 border border-emerald-100" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{runningCount} Active</span>}
          {alertCount > 0 && <span className="px-2.5 py-0.5 bg-red-50 rounded-full text-red-600 border border-red-100 animate-pulse" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{alertCount} Idle</span>}
        </div>
        <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {machines.map((m) => <MachineCard key={m.id} machine={m} onToggle={onToggle} onViewDetails={onViewDetails} onDelete={onDelete} onChangeName={onChangeName} />)}
      </div>
    </div>
  );
}

export function DevicesManagement() {
  const navigate = useNavigate();

  const [zoneFilter, setZoneFilter] = useState<string>("all");


  const { data: areas } = useApiData<Area>(
    () => structureAPI.areas.list(),
    []
  );
  const {
    data: dryers,
    loading: loadingDryers,
    error: dryersError,
    refetch: refetchDryers,
  } = useConditionalApiData<DryerDetail>(
    zoneFilter
      ? () => structureAPI.dryers.list({
          area_id: zoneFilter === "all" ? undefined : Number(zoneFilter),
        })
      : null,
    [zoneFilter]
  );

  const { data: fruits } = useApiData<Fruit>(
    () => catalogAPI.fruits.list(),
    []
  );

  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineArea, setNewMachineArea] = useState<string>("");
  const [creatingMachine, setCreatingMachine] = useState(false);


  const [showNewPatch, setShowNewPatch] = useState(false);
  const [patchForm, setPatchForm] = useState({
    dry_id: "",
    fruit_id: "",
    recipe_id: "",
    operation_mode: "scheduled",
    schedule_type: "fixed",
    fixed_time: "08:00",
    recurring_interval: 8,
    threshold_enabled: false,
    is_customize: false,
  });
  const [patchLoading, setPatchLoading] = useState(false);
  const [patchRecipes, setPatchRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Fetch recipes when fruit is selected in patch form
  useEffect(() => {
    if (patchForm.fruit_id) {
      const fetchRecipes = async () => {
        try {
          setLoadingRecipes(true);
          const result = await catalogAPI.recipes.list({ fruit_id: Number(patchForm.fruit_id) });
          if (result.data && Array.isArray(result.data)) {
            setPatchRecipes(result.data);
          } else {
            console.log("No recipe data found");
            setPatchRecipes([]);
          }
        } catch (error) {
          console.error("Error fetching recipes:", error);
          setPatchRecipes([]);
        } finally {
          setLoadingRecipes(false);
        }
      };
      fetchRecipes();
    } else {
      setPatchRecipes([]);
    }
  }, [patchForm.fruit_id]);

  const handleAddMachine = async () => {
    if (!newMachineName.trim()) {
      toast.error("Vui lòng nhập tên máy");
      return;
    }
    if (!newMachineArea) {
      toast.error("Vui lòng chọn khu vực");
      return;
    }
    try {
      setCreatingMachine(true);
      await structureAPI.dryers.create({ dry_name: newMachineName.trim(), area_id: Number(newMachineArea) });
      toast.success("Đã thêm máy sấy");
      setShowAddMachine(false);
      setNewMachineName("");
      setNewMachineArea("");
      refetchDryers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thêm máy sấy thất bại");
    } finally {
      setCreatingMachine(false);
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    if (!confirm("Bạn có chắc muốn xóa máy này?")) return;
    const dryerId = Number(machineId.replace(/^[^0-9]*/, '')) || 0;
    if (!dryerId) {
      toast.error("ID máy không hợp lệ");
      return;
    }
    try {
      await structureAPI.dryers.delete(dryerId);
      toast.success("Đã xóa máy sấy");
      refetchDryers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa máy sấy thất bại");
    }
  };

  const handleChangeMachineName = async (machineId: string, currentName: string) => {
    const nextName = prompt("Nhập tên mới cho máy:", currentName)?.trim();
    if (!nextName || nextName === currentName.trim()) return;

    const dryerId = Number(machineId.replace(/^[^0-9]*/, "")) || 0;
    if (!dryerId) {
      toast.error("ID máy không hợp lệ");
      return;
    }

    try {
      await structureAPI.dryers.update(dryerId, { dry_name: nextName });
      toast.success("Đã đổi tên máy");
      refetchDryers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đổi tên máy thất bại");
    }
  };

  const handleToggle = (_id: string) => {
    // Master power toggle now works locally without API
    toast.success("Trạng thái máy sấy được cập nhật cục bộ (không cần API)");
  };

  const handleViewDetails = (id: string) => {
    navigate(`/devices/${id}`);
  };


  const handleNewPatch = async () => {
    if (!patchForm.dry_id || !patchForm.fruit_id || !patchForm.recipe_id) {
      alert("Vui lòng điền đầy đủ thông tin: Máy, Loại trái cây, Công thức");
      return;
    }

    try {
      setPatchLoading(true);
      const result = await apiRequest('POST', BATCH_ENDPOINTS.create, {
        dry_id: Number(patchForm.dry_id),
        fruit_id: Number(patchForm.fruit_id),
        recipe_id: Number(patchForm.recipe_id),
        operation_mode: patchForm.operation_mode,
        schedule_type: patchForm.operation_mode === "scheduled" ? patchForm.schedule_type : null,
        fixed_time:
          patchForm.operation_mode === "scheduled" && patchForm.schedule_type === "fixed"
            ? patchForm.fixed_time
            : null,
        recurring_interval:
          patchForm.operation_mode === "scheduled" && patchForm.schedule_type === "recurring"
            ? patchForm.recurring_interval
            : null,
        threshold_enabled: patchForm.threshold_enabled,
        is_customize: patchForm.is_customize,
      });

      if (result.status === 'success') {
        toast.success(`Tạo mẻ sấy thành công (Batch ID: ${result.data.batch_id})`);
        setShowNewPatch(false);
        setPatchForm({
          dry_id: "",
          fruit_id: "",
          recipe_id: "",
          operation_mode: "scheduled",
          schedule_type: "fixed",
          fixed_time: "08:00",
          recurring_interval: 8,
          threshold_enabled: false,
          is_customize: false,
        });
        refetchDryers();
      } else {
        toast.error("Lỗi tạo mẻ sấy: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error creating patch:", error);
      toast.error("Lỗi khi tạo mẻ sấy: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setPatchLoading(false);
    }
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

            {/* Zone Filter */}
            <div className="relative flex items-center">
              <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 text-slate-700 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 cursor-pointer hover:border-slate-300 transition-all" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                <option value="all">All Zones</option>
                {areas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.area_name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => setShowAddMachine(true)} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-150">
              <Plus size={16} /> <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Add New Machine</span>
            </button>
            <button onClick={() => setShowNewPatch(true)} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-150">
              <Plus size={16} /> <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>New Batch</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Machines", value: dryers.length || 0, color: "text-slate-800", bg: "bg-white" },
            { label: "Active / Running", value: dryers.filter((m) => m.status === "Running").length, color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Machines Idle", value: dryers.filter((m) => m.status === "Idle").length, color: "text-yellow-600", bg: "bg-yellow-50" },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl border border-slate-200 px-5 py-3.5 flex items-center justify-between shadow-sm`}>
              <span className="text-slate-500" style={{ fontSize: "0.8125rem" }}>{item.label}</span>
              <span className={`${item.color}`} style={{ fontWeight: 800, fontSize: "1.5rem" }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Errors */}
        {(dryersError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>Không tải được dữ liệu thiết bị</p>
              <p style={{ fontSize: "0.78rem" }}>{dryersError || factoriesError}</p>
            </div>
            <button onClick={() => refetchDryers()} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
              Thử lại
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loadingDryers && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 bg-slate-200 rounded" />
                    <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-5 w-20 bg-slate-100 rounded-full" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-slate-100 rounded-lg" />
                  <div className="h-12 bg-slate-100 rounded-lg" />
                </div>
                <div className="h-8 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingDryers && !dryersError && dryers.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Không có máy sấy nào {zoneFilter !== "all" ? "trong khu vực đã chọn" : "tại nhà máy này"}.
          </div>
        )}

        {/* Dryer list from API */}
        {!loadingDryers && !dryersError && dryers.length > 0 && (
          <ZoneSection
            title={`Dryers${zoneFilter !== "all" ? ` in ${areas.find(a => a.area_id === Number(zoneFilter))?.area_name || "selected zone"}` : ""}`}
            subtitle="Real-time dryer data from API"
            machines={dryers.map((d) => convertDryerToMachine(d)).filter((m): m is Machine => m !== null)}
            onToggle={handleToggle}
            onViewDetails={handleViewDetails}
            onDelete={handleDeleteMachine}
            onChangeName={handleChangeMachineName}
            show={true}
          />
        )}

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
                  <select value={newMachineArea} onChange={(e) => setNewMachineArea(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="">Chọn khu vực...</option>
                    {areas.map((area) => (
                      <option key={area.area_id} value={area.area_id}>
                        {area.area_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowAddMachine(false)} className="px-3 py-2 border rounded">Cancel</button>
                  <button onClick={handleAddMachine} disabled={creatingMachine} className={`px-3 py-2 text-white rounded ${creatingMachine ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                    {creatingMachine ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Patch Modal */}
        {showNewPatch && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800" style={{ fontWeight: 700 }}>Create New Patch</h3>
                <button onClick={() => setShowNewPatch(false)} className="text-slate-500">Close</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Machine (Dryer)</label>
                  <select value={patchForm.dry_id} onChange={(e) => setPatchForm({ ...patchForm, dry_id: e.target.value })} className="w-full px-3 py-2 border rounded">
                    <option value="">Select machine</option>
                    {dryers.map((m) => <option key={m.dry_id} value={m.dry_id}>{m.dry_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fruit</label>
                  <select value={patchForm.fruit_id} onChange={(e) => setPatchForm({ ...patchForm, fruit_id: e.target.value })} className="w-full px-3 py-2 border rounded">
                    <option value="">Select fruit</option>
                    {fruits.map((f) => <option key={f.fruit_id} value={f.fruit_id}>{f.fruit_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Recipe</label>
                  <select value={patchForm.recipe_id} onChange={(e) => setPatchForm({ ...patchForm, recipe_id: e.target.value })} disabled={loadingRecipes || patchRecipes.length === 0} className="w-full px-3 py-2 border rounded disabled:bg-slate-100 disabled:cursor-not-allowed">
                    <option value="">{loadingRecipes ? "Loading recipes..." : "Select recipe"}</option>
                    {patchRecipes.map((recipe) => (
                      <option key={recipe.recipe_id} value={recipe.recipe_id}>
                        {recipe.recipe_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Operation Mode</label>
                  <select
                    value={patchForm.operation_mode}
                    onChange={(e) =>
                      setPatchForm({
                        ...patchForm,
                        operation_mode: e.target.value,
                        schedule_type: e.target.value === "scheduled" ? patchForm.schedule_type : "fixed",
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                {patchForm.operation_mode === "scheduled" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Schedule Type</label>
                      <select
                        value={patchForm.schedule_type}
                        onChange={(e) => setPatchForm({ ...patchForm, schedule_type: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="fixed">Fixed time</option>
                        <option value="recurring">Recurring</option>
                      </select>
                    </div>
                    {patchForm.schedule_type === "fixed" ? (
                      <div>
                        <label className="block text-sm font-medium mb-1">Fixed Time</label>
                        <input
                          type="time"
                          value={patchForm.fixed_time}
                          onChange={(e) => setPatchForm({ ...patchForm, fixed_time: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium mb-1">Recurring Interval</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={24}
                            value={patchForm.recurring_interval}
                            onChange={(e) => setPatchForm({ ...patchForm, recurring_interval: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded"
                          />
                          <span className="text-sm text-slate-500 shrink-0">hours</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={patchForm.threshold_enabled} onChange={(e) => setPatchForm({ ...patchForm, threshold_enabled: e.target.checked })} />
                  <label className="text-sm">Enable Threshold</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={patchForm.is_customize} onChange={(e) => setPatchForm({ ...patchForm, is_customize: e.target.checked })} />
                  <label className="text-sm">Customize</label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-blue-900 text-xs font-semibold">Attention</p>
                  <div className="space-y-1 text-xs text-blue-800">
                    <p>If you choose the "Customize" option, you can modify the batch phases in the devices detail</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowNewPatch(false)} className="px-3 py-2 border rounded">Cancel</button>
                  <button onClick={handleNewPatch} disabled={patchLoading} className={`px-3 py-2 text-white rounded ${patchLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {patchLoading ? "Creating..." : "Create Patch"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
