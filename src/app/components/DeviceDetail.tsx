import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { structureAPI, batchAPI, catalogAPI, FACTORY_ENDPOINTS, BATCH_ENDPOINTS, apiRequest } from "../config/api.config";
import { 
  ArrowLeft, Thermometer, Droplets, Wind, Lightbulb, Play, Pause, Square, Loader, AlertTriangle,
  Clock, Calendar, Zap, Trash2, Save, CheckCircle2, Loader2, Plus, Sun, Cpu, Timer, ChevronDown, X,
  ArrowRight
} from "lucide-react";
import { DryerDetail } from "../types/dryer";

type BatchStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "aborted"
  | string;


interface ScheduledInfo {
  current_phase: number | null;
  elapsed_seconds: number;
  total_duration_seconds: number;
  current_phase_remaining_seconds: number;
  total_remaining_seconds: number;
}
interface BatchItem {
  batch_id: number;
  dry_id: number;
  fruit_id?: number;
  recipe_id?: number;
  status: BatchStatus;
  operation_mode?: "manual" | "scheduled" | string;
  threshold_enabled?: boolean;
  is_customize?: boolean;
  created_at?: string;
  fruit_name?: string;
  recipe_name?: string;
  scheduled_info : ScheduledInfo;
}

interface ScheduledPhaseInfo {
  batch_id?: number;
  status?: string;
  operation_mode?: string;
  elapsed_seconds?: number;
  total_duration_seconds?: number;
  current_phase?: any;
  current_phase_order?: number | null;
  current_phase_remaining_seconds?: number;
  total_remaining_seconds?: number;
}

interface RecipeSummary {
  recipe_id: number;
  recipe_name?: string;
  fruit_id?: number;
  fruit_name?: string;
  is_active?: boolean;
}

interface RecipeDetailItem extends RecipeSummary {
  recipe_type?: string;
  description?: string;
  phases?: any[];
  policies?: any[];
}

interface FruitItem {
  fruit_id?: number;
  fruit_name?: string;
  id?: number;
  name?: string;
}

const pickActiveBatch = (list: BatchItem[]) =>
  list.find((b) => b.status === "running") ||
  list.find((b) => b.status === "paused") ||
  list.find((b) => b.status === "scheduled" || b.status === "pending") ||
  null;

const batchStatusBadge = (status: BatchStatus) => {
  switch (status) {
    case "running":
      return "bg-emerald-100 text-emerald-700";
    case "scheduled":
    case "pending":
      return "bg-blue-100 text-blue-700";
    case "paused":
      return "bg-yellow-100 text-yellow-700";
    case "completed":
      return "bg-slate-100 text-slate-600";
    case "cancelled":
    case "aborted":
    case "error":
      return "bg-red-100 text-red-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

export function DeviceDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract ID from URL path: /devices/D1 -> D1, then parse to number
  const idFromPath = location.pathname.split("/").pop() || null;
  const dryerId = idFromPath ? Number(idFromPath.toString().replace(/^[^0-9]*/, "")) || null : null;


  // Dryer detail state
  const [dryerData, setDryerData] = useState<DryerDetail | null>(null);
  const [loadingDryer, setLoadingDryer] = useState(true);
  const [dryerError, setDryerError] = useState<string | null>(null);

  // Batches state
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);
  const [batchActionId, setBatchActionId] = useState<number | null>(null);
  const [controlActionId, setControlActionId] = useState<number | null>(null);
  const [creatingControlType, setCreatingControlType] = useState<"fan" | "lamp" | null>(null);
  const [fruitNameById, setFruitNameById] = useState<Record<number, string>>({});
  const [fruitRecipes, setFruitRecipes] = useState<RecipeSummary[]>([]);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetailItem | null>(null);
  const [loadingRecipeInfo, setLoadingRecipeInfo] = useState(false);
  const [recipeInfoError, setRecipeInfoError] = useState<string | null>(null);

  // Manual parameter overrides (kept in localStorage, keyed by dry_id)
  const [tempTarget, setTempTarget] = useState(0);
  const [humTarget, setHumTarget] = useState(0);

  // Customized batch phase editing
  const [customPhases, setCustomPhases] = useState<any[]>([]);
  const [isSavingCustomPhases, setIsSavingCustomPhases] = useState(false);

  // Threshold editing state
  const [thresholdValues, setThresholdValues] = useState<Record<number, number | string>>({});
  const [savingThresholdId, setSavingThresholdId] = useState<number | null>(null);

  const [thresholdConditions, setThresholdConditions] = useState<Record<number, string>>({});
  const [scheduledPhaseInfo, setScheduledPhaseInfo] = useState<ScheduledPhaseInfo | null>(null);
  const [thresholdOperators, setThresholdOperators] = useState<Record<number, string>>({});

  // Dryers list state for dropdown filter
  const [dryersList, setDryersList] = useState<any[]>([]);
  const [loadingDryersList, setLoadingDryersList] = useState(false);
  const [thresholdEnabled, setThresholdEnabled] = useState<Record<number, boolean>>({});
  const [showDeleteControlModal, setShowDeleteControlModal] = useState(false);
  const [selectedDeleteControlId, setSelectedDeleteControlId] = useState<number | null>(null);
  const [deletingControl, setDeletingControl] = useState(false);

  // Choose the most relevant active batch (running > paused > scheduled/pending)
  const activeBatch = pickActiveBatch(batches);
  // Enriched batch detail fetched from GET /batches/{batchId}
  const [activeBatchDetail, setActiveBatchDetail] = useState<any | null>(null);
  const [loadingBatchDetail, setLoadingBatchDetail] = useState(false);
  const [batchDetailError, setBatchDetailError] = useState<string | null>(null);
  const currentBatch = activeBatchDetail ?? activeBatch;

  // ---- Fetchers -------------------------------------------------------------
  const fetchDryer = useCallback(async () => {
    if (!dryerId) return;
    try {
      setLoadingDryer(true);
      setDryerError(null);
      const response = await structureAPI.dryers.get(dryerId);
      setDryerData(response?.data ?? response ?? null);
    } catch (err) {
      setDryerError(err instanceof Error ? err.message : "Failed to fetch dryer data");
      setDryerData(null);
    } finally {
      setLoadingDryer(false);
    }
  }, [dryerId]);

  
  const fetchScheduledPhaseInfo = useCallback(async () => {
      if (!activeBatch?.batch_id) {
        setScheduledPhaseInfo(null);
        setActiveBatchDetail(null);
        return;
      }
      try {
        setLoadingBatchDetail(true);
        setBatchDetailError(null);
        const response = await batchAPI.get(activeBatch.batch_id);
        const batchDetail = response?.data ?? response ?? null;
        const nextInfo = batchDetail?.scheduled_phase_info ?? null;
        setScheduledPhaseInfo(nextInfo);
        setActiveBatchDetail(batchDetail);
      } catch (err) {
          setScheduledPhaseInfo(null);
          setActiveBatchDetail(null);
          setBatchDetailError(err instanceof Error ? err.message : String(err))
        console.error("Failed to fetch scheduled phase info:", err);
      } finally {
        setLoadingBatchDetail(false);
      }
    }, [activeBatch?.batch_id]);

  const fetchBatches = useCallback(async () => {
    if (!dryerId) return;
    try {
      setLoadingBatches(true);
      setBatchesError(null);
      const response = await batchAPI.list({ dry_id: dryerId });
      const list: BatchItem[] = response?.data ?? response ?? [];
      setBatches(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setBatchesError(err instanceof Error ? err.message : "Failed to fetch batches");
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  }, [dryerId]);

  useEffect(() => {
    fetchDryer();
  }, [fetchDryer]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    fetchScheduledPhaseInfo();
  }, [fetchScheduledPhaseInfo]);


  // Save threshold value for a sensor
  const handleSaveThreshold = async (sensorId: number) => {
    const val = thresholdValues[sensorId];
    if (val === undefined || val === null || val === "") return;
    setSavingThresholdId(sensorId);
    try {
      const numeric = Number(val);
      await structureAPI.sensors.update(sensorId, numeric);
      toast.success('Save threshold of the sensor');
      await fetchDryer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save threshold');
    } finally {
      setSavingThresholdId(null);
    }
  };
 

  // Initialize threshold enabled state from dryer data
  useEffect(() => {
    if (dryerData?.sensors) {
      const enabledMap: Record<number, boolean> = {};
      dryerData.sensors.forEach((sensor) => {
        enabledMap[sensor.sensor_id] = true; // Default to enabled
      });
      setThresholdEnabled(enabledMap);
    }
  }, [dryerData?.sensors]);

  // Fetch fruit names for clear display by fruit_id
  useEffect(() => {
    let cancelled = false;

    const fetchFruits = async () => {
      try {
        const response = await catalogAPI.fruits.list();
        const list: FruitItem[] = response?.data ?? response ?? [];

        if (!Array.isArray(list) || cancelled) {
          return;
        }

        const nextMap: Record<number, string> = {};
        list.forEach((fruit) => {
          const fruitId = Number(fruit?.fruit_id ?? fruit?.id);
          const fruitName = fruit?.fruit_name ?? fruit?.name;
          if (Number.isFinite(fruitId) && typeof fruitName === "string" && fruitName.trim()) {
            nextMap[fruitId] = fruitName.trim();
          }
        });

        setFruitNameById(nextMap);
      } catch (err) {
        console.error("Error fetching fruits:", err);
      }
    };

    fetchFruits();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch fruit recipe detail for the current active batch
  useEffect(() => {
    const currentBatch = pickActiveBatch(batches);

    if (!currentBatch) {
      setFruitRecipes([]);
      setRecipeDetail(null);
      setRecipeInfoError(null);
      return;
    }
    
    let cancelled = false;

    const fetchRecipeInfo = async () => {
      setLoadingRecipeInfo(true);
      setRecipeInfoError(null);
      try {
        if (!currentBatch.recipe_id) {setRecipeDetail(null); return;}
        const detailResponse = await catalogAPI.recipes.get(currentBatch.recipe_id);
        const detailData = detailResponse?.data ?? detailResponse ?? null;
        setRecipeDetail(detailData);
      } catch (err) {
        if (!cancelled) {
          setRecipeInfoError(err instanceof Error ? err.message : "Failed to load recipe information");
          setRecipeDetail(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRecipeInfo(false);
        }
      }
    };
    fetchRecipeInfo();
    return () => {
      cancelled = true;
    };
  }, [batches]);

  // Sync temperature/humidity targets from sensor values once dryer data is loaded
  useEffect(() => {
    if (!dryerData) return;
    const tempSensor = dryerData.sensors?.find((s) => s.sensor_type === "temperature");
    const humSensor = dryerData.sensors?.find((s) => s.sensor_type === "humidity");
    setTempTarget(tempSensor?.last_value ?? 0);
    setHumTarget(humSensor?.last_value ?? 0);
  }, [dryerData]);

  // Load custom phases if batch is customized.
  // Prefer phases stored on the active batch (batch-level custom phases).
  // Fallback to recipeDetail.phases when batch doesn't include phases.
  useEffect(() => {
    const batch = currentBatch;
    if (!batch?.is_customize) {
      setCustomPhases([]);
      return;
    }

    // If the batch itself contains phases (customized stored on batch), use them
    if (Array.isArray((batch as any).phases) && (batch as any).phases.length > 0) {
      setCustomPhases((batch as any).phases);
      return;
    }

    // Otherwise fall back to recipeDetail phases (if present)
    if (Array.isArray(recipeDetail?.phases) && recipeDetail!.phases.length > 0) {
      setCustomPhases(recipeDetail!.phases);
      return;
    }

    setCustomPhases([]);
  }, [currentBatch?.is_customize, (currentBatch as any)?.phases, recipeDetail?.phases]);

  // ---- Batch actions --------------------------------------------------------
  const runBatchAction = async (
    batchId: number,
    action: "start" | "resume" | "pause" | "abort" | "completed",
    successMsg: string
  ) => {
    setBatchActionId(batchId);
    try {
      if (action === "start") {
        await batchAPI.start(batchId);
        toast.success(successMsg);
      } else if (action === "pause") {
        await batchAPI.pause(batchId);
        toast.success(successMsg);
      } else if (action === "abort") {
        await batchAPI.abort(batchId);
        toast.success(successMsg);
        await fetchBatches();
      } else if (action === "completed") {
        await batchAPI.stop(batchId, "completed");
        toast.success(successMsg);
        await fetchBatches();
      }
      else if (action === "resume" ) {
        await batchAPI.resume(batchId);
        toast.success(successMsg);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to perform batch action");
    } finally {
      setBatchActionId(null);
    }
  };

  // Compute which phase is currently running based on the batch API response
  const runningPhaseInfo = (() => {
    if (!activeBatch) return { index: 0, phase: null, progressPercent: 0 };

    const phases = Array.isArray(recipeDetail?.phases) ? recipeDetail.phases : [];
    const phaseInfo = scheduledPhaseInfo;

    if (phaseInfo?.current_phase) {
      const durationSeconds = Number(phaseInfo.current_phase.duration_seconds ?? 0);
      const remainingSeconds = Number(
        phaseInfo.current_phase_remaining_seconds ?? phaseInfo.total_remaining_seconds ?? 0
      );
      const progressPercent =
        durationSeconds > 0
          ? Math.max(0, Math.min(100, Math.round(((durationSeconds - remainingSeconds) / durationSeconds) * 100)))
          : 0;

      return {
        index: Math.max(0, Number(phaseInfo.current_phase_order ?? 1) - 1),
        phase: phaseInfo.current_phase,
        progressPercent,
      };
    }

    if (!phases.length) {
      return { index: 0, phase: null, progressPercent: 0 };
    }

    return { index: 0, phase: phases[0] ?? null, progressPercent: 0 };
  })();

  const startBatch = (batchId: number) => runBatchAction(batchId, "start", "Batch started");
  const pauseBatch = (batchId: number) => runBatchAction(batchId, "pause", "Batch paused");
  const resumeBatch = (batchId: number) => runBatchAction(batchId, "resume", "Batch resumed");
  const abortBatch = (batchId: number) => {
    if (!confirm("Huỷ mẻ sấy này?")) return;
    runBatchAction(batchId, "abort", "Đã huỷ mẻ sấy");
  };

  const isControlOn = (status?: string) => status === "active" || status === "on";

  const handlePhaseChange = (phaseIndex: number, field: string, value: any) => {
    const updated = [...customPhases];
    updated[phaseIndex] = { ...updated[phaseIndex], [field]: value };
    setCustomPhases(updated);
  };

  const handleSaveCustomPhases = async () => {
    if (!activeBatch) return;
    try {
      setIsSavingCustomPhases(true);
      // API call to update batch phases
      await batchAPI.update(activeBatch.batch_id, {
        phases: customPhases,
      });
      toast.success("Phase updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update phase");
    } finally {
      setIsSavingCustomPhases(false);
    }
  };

  const toggleControl = async (controlId: number, currentStatus?: string) => {
    const nextStatus = isControlOn(currentStatus) ? "inactive" : "active";
    setControlActionId(controlId);
    try {
      await structureAPI.controls.update(controlId, { status: nextStatus });
      toast.success(`Successfully ${nextStatus === "active" ? "enabled" : "disabled"} the device`);
      await fetchDryer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update device");
    } finally {
      setControlActionId(null);
    }
  };



  const handleAddControl = async (controlType: "fan" | "lamp") => {
    if (!dryerId || !dryerData) return;
    console.log(dryerId);
    setCreatingControlType(controlType);
    try {
      const controls = Array.isArray(dryerData.controls) ? dryerData.controls : [];
      const countByType = controls.filter((c) => c.control_type === controlType).length;
      const nextNumber = countByType + 1;
      const controlName = `${controlType === "fan" ? "Fan" : "Lamp"} ${nextNumber}`;

     await structureAPI.controls.create(dryerId, {
        control_type: controlType,
        control_name: controlName,
     });
      toast.success(`Adding ${controlName}`);
      await fetchDryer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add output device");
    } finally {
      setCreatingControlType(null);
    }
  };

  const showFormDelete = () => {
    const controls = Array.isArray(dryerData?.controls) ? dryerData.controls : [];
    if (controls.length === 0) {
      toast.info("Không có thiết bị output để xoá");
      return;
    }

    setSelectedDeleteControlId(controls[0].control_id);
    setShowDeleteControlModal(true);
  };

  const handleDeleteSelectedControl = async () => {
    if (!selectedDeleteControlId) {
      toast.error("Please choose the device to delete");
      return;
    }

    if (!confirm("Are you sure you want to delete this device?")) {
      return;
    }

    setDeletingControl(true);
    try {
      await apiRequest("DELETE", FACTORY_ENDPOINTS.controls.delete(selectedDeleteControlId));
      toast.success("Successfully deleted the output device");
      setShowDeleteControlModal(false);
      setSelectedDeleteControlId(null);
      await fetchDryer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete the device");
    } finally {
      setDeletingControl(false);
    }
  };

  const handleThresholdToggle = async (enabled: boolean) => {
    if (!currentBatch) return;
    try {
      await batchAPI.threshold(currentBatch.batch_id, enabled);
      toast.success("Successfully updated device threshold");
      await fetchBatches();
      await fetchDryer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update device threshold");
    }
  };

  // ---- Render ---------------------------------------------------------------

  const formatDuration = (seconds?: number | null) => {
    const s = Number(seconds ?? 0);
    if (!Number.isFinite(s) || s <= 0) return "0s";
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  // Loading skeleton for dryer
  if (loadingDryer) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <div className="max-w-screen-lg mx-auto space-y-6">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader className="animate-spin" size={20} />
            <span>Loading device data...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-4 animate-pulse space-y-3">
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
                <div className="space-y-2">
                  <div className="h-10 bg-slate-100 rounded" />
                  <div className="h-10 bg-slate-100 rounded" />
                  <div className="h-10 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error / not found
  if (dryerError || !dryerData) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-screen-md mx-auto bg-white rounded-xl p-6 border border-red-200">
          <button
            onClick={() => navigate("/devices")}
            className="flex items-center gap-2 text-slate-600 mb-4"
          >
            <ArrowLeft /> Back to Devices
          </button>
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-slate-800" style={{ fontWeight: 700 }}>
                {dryerError ? "Không tải được dữ liệu thiết bị" : "Không tìm thấy thiết bị"}
              </h2>
              <p className="text-slate-500">{dryerError || "Thiết bị này không tồn tại."}</p>
            </div>
            <button
              onClick={fetchDryer}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dependent variables for display
  const matchedRecipeFromFruit =
    currentBatch?.recipe_id != null
      ? fruitRecipes.find((recipe) => recipe.recipe_id === currentBatch.recipe_id)
      : null;
  const fruitNameFromApi =
    currentBatch?.fruit_id != null ? fruitNameById[currentBatch.fruit_id] : undefined;
  const fruitDisplayName =
    fruitNameFromApi ??
    currentBatch?.fruit_name ??
    matchedRecipeFromFruit?.fruit_name ??
    (currentBatch?.fruit_id != null ? `Fruit #${currentBatch.fruit_id}` : "-");
  const recipeDisplayName =
    recipeDetail?.recipe_name ??
    matchedRecipeFromFruit?.recipe_name ??
    currentBatch?.recipe_name ??
    (currentBatch?.recipe_id != null ? `Recipe #${currentBatch.recipe_id}` : "-");
  const recipePhases = Array.isArray(recipeDetail?.phases) ? recipeDetail.phases : [];
  const sortedControls = [...(dryerData.controls ?? [])].sort((a, b) => {
    const typeRank = (type: string) => (type === "fan" ? 0 : type === "lamp" ? 1 : 2);
    const rankDiff = typeRank(a.control_type) - typeRank(b.control_type);
    if (rankDiff !== 0) return rankDiff;
    return a.control_id - b.control_id;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-screen-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/devices")}
              className="flex items-center gap-2 text-slate-600 mb-1"
            >
              <ArrowLeft /> Back
            </button>           
          </div>

          <div>
            <h1 className="text-slate-800" style={{ fontWeight: 700 }}>
              {dryerData.dry_name}
            </h1>
            <p className="text-slate-400">
              ID: {dryerData.dry_id} • Area: {dryerData.area_id}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">Status</p>
            <p
              className={`font-bold ${
                dryerData.status === "Running" ? "text-emerald-600" : "text-slate-600"
              }`}
            >
              {dryerData.status}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sensors */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-slate-800" style={{ fontWeight: 700 }}>
              Input Sensors
            </h3>
            <div className="mt-3 space-y-2">
              {(dryerData.sensors ?? []).map((sensor) => {
                const isEnabled = thresholdEnabled[sensor.sensor_id] !== false;
                const isSaving = savingThresholdId === sensor.sensor_id;

                return (
                  <div
                    key={sensor.sensor_id}
                    className="p-3 border rounded-lg bg-slate-50/60 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {sensor.sensor_type === "temperature" ? (
                          <Thermometer size={16} className="text-orange-500 mt-0.5 shrink-0" />
                        ) : sensor.sensor_type === "humidity" ? (
                          <Droplets size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        ) : sensor.sensor_type === "light" ? (
                          <Sun size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                        ) : (
                          <Thermometer size={16} className="mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="text-slate-800 capitalize text-sm font-medium block">
                            {sensor.sensor_type === "light" ? "Light" : sensor.sensor_type}
                          </span>
                          <p className="text-xs text-slate-400">
                            Last updated: {sensor.updated_at ? new Date(sensor.updated_at).toLocaleTimeString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 min-w-[4.5rem] text-right">
                        <span className="inline-flex items-center justify-center min-w-[4.5rem] px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                          {sensor.last_value != null ? sensor.last_value.toFixed(2) : "N/A"}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
              
              {/* Light Sensor Placeholder (if no light sensor exists) */}
              {(dryerData.sensors ?? []).find(s => s.sensor_type === "light") === undefined && (
                <div className="p-3 border rounded-lg bg-slate-50/60 space-y-3 opacity-60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Sun size={16} className="text-slate-300 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-slate-500 text-sm font-medium block">Light</span>
                        <p className="text-xs text-slate-300">Không có dữ liệu</p>
                      </div>
                    </div>
                    <div className="shrink-0 min-w-[4.5rem] text-right">
                      <span className="inline-flex items-center justify-center min-w-[4.5rem] px-2.5 py-1 rounded-md bg-slate-100 text-slate-400 font-bold">
                        N/A
                      </span>
                    </div>
                  </div>

                  {/* Threshold Controls - Disabled */}
                  <div className="flex items-center gap-2 px-2 py-2 bg-white rounded border border-slate-200">
                    <button
                      disabled
                      className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed"
                    >
                      OFF
                    </button>

                    <span className="text-xs text-slate-300">Ngưỡng:</span>
                    <input
                      type="number"
                      placeholder="0"
                      disabled
                      className="w-16 px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
                    />
                    <button
                      disabled
                      className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              )}

              {(!dryerData.sensors || dryerData.sensors.length === 0) && (
                <p className="text-sm text-slate-400">Chưa có cảm biến.</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-slate-800" style={{ fontWeight: 700 }}>
                Output Devices
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddControl("fan")}
                  disabled={creatingControlType !== null}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingControlType === "fan" ? "Adding..." : "+ Fan"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddControl("lamp")}
                  disabled={creatingControlType !== null}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingControlType === "lamp" ? "Adding..." : "+ Lamp"}
                </button>
                <button
                  type="button"
                  onClick={showFormDelete}
                  className="ml-2 shrink-0 text-xs rounded px-2.5 py-1 font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {sortedControls.map((control) => (
                <div
                  key={control.control_id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-slate-50/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {control.control_type === "fan" ? (
                      <Wind size={16} className="text-amber-500 shrink-0" />
                    ) : control.control_type === "lamp" ? (
                      <Lightbulb size={16} className="text-yellow-500 shrink-0" />
                    ) : (
                      <Wind size={16} className="shrink-0" />
                    )}
                    <span className="text-slate-700 capitalize text-sm font-medium truncate">
                      {control.control_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleControl(control.control_id, control.status)}
                    disabled={controlActionId === control.control_id}
                    className={`shrink-0 min-w-[3rem] text-xs rounded px-2.5 py-1 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isControlOn(control.status)
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {controlActionId === control.control_id
                      ? "..."
                      : isControlOn(control.status)
                        ? "ON"
                        : "OFF"}
                  </button>
                </div>
              ))}
              {(!dryerData.controls || dryerData.controls.length === 0) && (
                <p className="text-sm text-slate-400">Chưa có thiết bị output.</p>
              )}
            </div>
          </div>

          {/* Current batch */}
          {!loadingBatches && !batchesError && (
            <div className="bg-white rounded-xl border p-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-800" style={{ fontWeight: 700 }}>
                  Batch processing
                </h3>
                <button
                  onClick={() => {
                    fetchBatches();
                    fetchScheduledPhaseInfo();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Refresh
                </button>
              </div>
              {activeBatch && (
                <div className="mt-2 flex items-center gap-2 relative">
                  <button
                    onClick={() => pauseBatch(activeBatch.batch_id)}
                    disabled={
                      batchActionId === activeBatch.batch_id ||
                      !(activeBatch.status === "running" || activeBatch.status === "scheduled" || activeBatch.status === "pending")
                    }
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Stop
                  </button>
                  <button
                    onClick={() => abortBatch(activeBatch.batch_id)}
                    disabled={batchActionId === activeBatch.batch_id}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                  >
                    Abort
                  </button>
                  <button
                    onClick={() => {
                      if (activeBatch.status === "paused") {
                        resumeBatch(activeBatch.batch_id);
                      }
                      else {startBatch(activeBatch.batch_id);
                      }
                    }}
                    disabled={batchActionId === activeBatch.batch_id || !(activeBatch.status === "paused" || activeBatch.status === "pending")}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              )}
              {!activeBatch ? (
                <div className="mt-3 text-slate-400">Không có mẻ sấy đang hoạt động.</div>
              ) : (
                <div className="mt-3 p-4 border rounded bg-slate-50 relative">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-slate-800 font-bold text-sm">
                        Batch #{activeBatch.batch_id}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${batchStatusBadge(
                        activeBatch.status
                      )}`}
                    >
                      {activeBatch.status}
                    </span>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                    <p className="text-slate-700 text-xs font-semibold">BATCH INFORMATION</p>

                    {loadingRecipeInfo && (
                      <p className="mt-1 text-xs text-slate-400">LOADING...</p>
                    )}

                    {!loadingRecipeInfo && recipeInfoError && (
                      <p className="mt-1 text-xs text-red-500">{recipeInfoError}</p>
                    )}

                    {!loadingRecipeInfo && !recipeInfoError && (
                      <div className="mt-2 space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2 rounded border border-slate-100 bg-slate-50">
                            <span className="text-slate-400 block">Fruit name</span>
                            <span className="text-slate-700 font-semibold">{fruitDisplayName}</span>
                          </div>
                          <div className="p-2 rounded border border-slate-100 bg-slate-50">
                            <span className="text-slate-400 block">Recipe name</span>
                            <span className="text-slate-700 font-semibold">{recipeDisplayName}</span>
                          </div>
                  <div className="p-2 rounded border border-slate-100 bg-slate-50 sm:col-span-2">
                            <span className="text-slate-400 block">Threshold mode</span>
                            <span className={`font-semibold ${activeBatch.threshold_enabled ? "text-purple-700" : "text-slate-700"}`}>
                              {activeBatch.threshold_enabled ? "Yes" : "No"}
                            </span>
                          </div>
                          
                        {/* Currently Running Phase */}
              <div className="p-2 rounded border border-slate-100 bg-slate-50 sm:col-span-2">
                <h3 className="text-slate-700" style={{ fontWeight: 1000, fontSize: "0.9375rem" }}>
                  Current Phase
                </h3>

                {activeBatch && runningPhaseInfo && (
                  <div className="w-full bg-white rounded-lg border border-emerald-200 shadow-sm overflow-hidden">
                    {/* Main Container */}
                    <div className="w-full bg-gradient-to-r from-emerald-50 to-cyan-50 p-5 border-b border-emerald-200">
                      {/* Phase Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-white" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                          {runningPhaseInfo.phase && runningPhaseInfo.index != null ? `P${runningPhaseInfo.index + 1}` : "P1"}
                        </span>
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <h4 className="text-emerald-700" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                              {runningPhaseInfo.phase?.phase_name ?? runningPhaseInfo.phase?.name ?? `Phase ${runningPhaseInfo.index + 1}`}
                            </h4>
                            <p className="text-emerald-600 text-xs">
                              Phase {runningPhaseInfo.index + 1} / {recipePhases.length}
                            </p>
                          </div>

                          {/* Small pill (image-like) shown immediately to the right of the Phase text */}
                          <div className="ml-3 shrink-0">
                            <div className="inline-flex items-center bg-white border border-slate-200 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                              {`Elapsed: ${formatDuration(scheduledPhaseInfo?.elapsed_seconds ?? currentBatch?.elapsed_seconds ?? 0)}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-emerald-200 rounded-full h-3">
                        <div 
                          className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, runningPhaseInfo.progressPercent || 0))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Phase Info Cards */}
                    <div className="w-full p-5">
                      <div className="grid grid-cols-2 gap-5 w-full">
                        {/* Active Devices */}
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 w-full">
                          <div className="flex items-center gap-2 mb-4">
                            <Cpu size={18} className="text-emerald-600" />
                            <span className="text-slate-700 text-sm font-semibold">Active Devices</span>
                          </div>
                          <div className="space-y-3 min-h-[50px]">
                            {runningPhaseInfo.phase?.actions && 
                             runningPhaseInfo.phase?.actions.length > 0 ? (
                              <>
                                {runningPhaseInfo.phase?.actions
                                  .filter((a: any) => a.action_type === "activate")
                                  .map((action: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                      {action.control_type === "fan" && (
                                        <>
                                          <Wind size={18} className="text-blue-500" />
                                          <span className="text-blue-700 text-sm font-semibold">Fan: ON</span>
                                        </>
                                      )}
                                      {action.control_type === "lamp" && (
                                        <>
                                          <Lightbulb size={18} className="text-amber-500" />
                                          <span className="text-amber-700 text-sm font-semibold">Light: ON</span>
                                        </>
                                      )}
                                    </div>
                                  ))}
                              </>
                            ) : (
                              <span className="text-slate-400 text-sm">No Change</span>
                            )}
                          </div>
                        </div>

                        {/* Duration Info */}
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 w-full">
                          <div className="flex items-center gap-2 mb-4">
                            <Clock size={18} className="text-emerald-600" />
                            <span className="text-slate-700 text-sm font-semibold">Duration</span>
                          </div>
                              <div className="min-h-[50px] flex items-center">
                            <span className="text-emerald-700 font-bold text-2xl">
                              {runningPhaseInfo.phase?.duration 
                                ? Math.round(runningPhaseInfo.phase.duration * 60) 
                                : runningPhaseInfo.phase?.duration_seconds
                                  ? Math.round(runningPhaseInfo.phase.duration_seconds / 60)
                                  : 0} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
                  
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
                        
                          {activeBatch  && (
                            <div className="bg-white rounded-xl border p-4 md:col-span-2">
                            <div className="p-3 rounded border border-slate-100 bg-purple-50 sm:col-span-2">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-800 font-bold">Threshold Settings</span>
                                {activeBatch.threshold_enabled ? (
                                  <button 
                                    onClick={() => handleThresholdToggle(false)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all"
                                  >
                                    ✕ Disable threshold
                                  </button>
                                ) : (
                                <button
                                  onClick={() => handleThresholdToggle(true)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-all"
                                >
                                  ✓ Enable threshold
                                </button>
                                )
                                }
                              </div>
                              
                              <div className="space-y-3">
                                {(dryerData.sensors ?? []).map((sensor) => (
                                  <div key={sensor.sensor_id} className="bg-white rounded border border-slate-200 p-3">
                                    {/* Header với tên sensor và giá trị hiện tại */}
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                      <div className="flex items-center gap-3">
                                        {sensor.sensor_type === "temperature" ? (
                                          <Thermometer size={16} className="text-orange-500 shrink-0" />
                                        ) : sensor.sensor_type === "humidity" ? (
                                          <Droplets size={16} className="text-blue-500 shrink-0" />
                                        ) : (
                                          <Sun size={16} className="text-yellow-500 shrink-0" />
                                        )}
                                        <div>
                                          <p className="text-slate-800 font-semibold text-sm capitalize">
                                            Ngưỡng {sensor.sensor_type === "temperature" ? "nhiệt độ" : sensor.sensor_type === "humidity" ? "độ ẩm" : "light"} hiện tại là: <span className="text-purple-700">{(thresholdConditions[sensor.sensor_id] === 'lt' || thresholdConditions[sensor.sensor_id] === '<' || thresholdConditions[sensor.sensor_id] === 'less') ? 'Nhỏ hơn' : 'Lớn hơn'} {sensor.threshold ?? "-"} {sensor.sensor_type === "temperature" ? "°C" : "%" }</span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Chọn hành động khi vượt ngưỡng */}
                                    <div className={`mb-2 ${!activeBatch?.threshold_enabled ? 'opacity-60' : ''}`}>
                                      <label className="text-xs text-slate-600 block mb-1">Hành động khi vượt ngưỡng</label>
                                      <select
                                        disabled={!activeBatch?.threshold_enabled}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400"
                                      >
                                        <option value="">-- Chọn hành động --</option>
                                        <option value="stop">Dừng máy</option>
                                        <option value="alarm">Báo động</option>
                                        <option value="notify">Gửi thông báo</option>
                                        <option value="adjust">Điều chỉnh tự động</option>
                                      </select>
                                    </div>
                                    
                                    {/* Input để điều chỉnh */}
                                    <div className={`flex items-end gap-2 ${!activeBatch?.threshold_enabled ? 'opacity-60' : ''}`}>
                                      <div className="shrink-0">
                                        <label className="text-xs text-slate-600 block mb-1">So sánh</label>
                                        <select
                                          value={thresholdOperators[sensor.sensor_id] ?? thresholdConditions[sensor.sensor_id] ?? 'gt'}
                                          onChange={(e) => setThresholdOperators({...thresholdOperators, [sensor.sensor_id]: e.target.value})}
                                          disabled={!activeBatch?.threshold_enabled || savingThresholdId === sensor.sensor_id}
                                          className="px-2 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none w-28"
                                        >
                                          <option value="gt">Lớn hơn</option>
                                          <option value="lt">Nhỏ hơn</option>
                                        </select>
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-xs text-slate-600 block mb-1">Giá trị mới</label>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            value={thresholdValues[sensor.sensor_id] ?? ""}
                                            onChange={(e) => setThresholdValues({...thresholdValues, [sensor.sensor_id]: e.target.value})}
                                            placeholder={sensor.threshold?.toString() || "0"}
                                            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400"
                                            step={sensor.sensor_type === "temperature" ? "0.1" : "1"}
                                            disabled={!activeBatch?.threshold_enabled || savingThresholdId === sensor.sensor_id}
                                          />
                                          <span className="text-sm text-slate-500 font-medium shrink-0">
                                            {sensor.sensor_type === "temperature" ? "°C" : "%"}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleSaveThreshold(sensor.sensor_id)}
                                        disabled={
                                          savingThresholdId === sensor.sensor_id ||
                                          !thresholdValues[sensor.sensor_id] ||
                                          !activeBatch?.threshold_enabled
                                        }
                                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                                          savingThresholdId === sensor.sensor_id
                                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                            : thresholdValues[sensor.sensor_id] && activeBatch?.threshold_enabled
                                              ? "bg-purple-500 hover:bg-purple-600 text-white"
                                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        }`}
                                      >
                                        {savingThresholdId === sensor.sensor_id ? (
                                          <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Lưu</span>
                                          </>
                                        ) : (
                                          <>
                                            <Save size={14} />
                                            <span>Lưu</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {(!dryerData.sensors || dryerData.sensors.length === 0) && (
                                  <span className="text-sm text-slate-400">Không có cảm biến để điều chỉnh</span>
                                )}
                              </div>
                            </div>
                            </div>
                          )}       
          {/* Customized Phase Editor - Show only if batch is customized */}
          {!loadingBatches && activeBatch && activeBatch.is_customize && customPhases.length > 0 && (
            <div className="bg-white rounded-xl border p-4 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Timer size={18} className="text-emerald-600" />
                  <h3 className="text-slate-800" style={{ fontWeight: 700 }}>
                    Cấu hình Phase Tuỳ chỉnh
                  </h3>
                </div>
                <button
                  onClick={handleSaveCustomPhases}
                  disabled={isSavingCustomPhases}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all ${
                    isSavingCustomPhases
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                >
                  {isSavingCustomPhases ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Lưu Phase
                    </>
                  )}
                </button>
              </div>

              {/* Shared Schedule Settings - Outside Phase Cards */}
              <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
                {/* Schedule Type */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-500" />
                      <span className="text-slate-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        Loại lịch
                      </span>
                    </div>
                    <select
                      value={customPhases[0]?.schedule_type ?? "fixed"}
                      onChange={(e) => handlePhaseChange(0, "schedule_type", e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400"
                      style={{ fontSize: "0.7rem" }}
                    >
                      <option value="fixed">Thời gian cố định</option>
                      <option value="recurring">Lặp lại</option>
                    </select>
                  </div>
                </div>

                {/* Fixed Time */}
                {(customPhases[0]?.schedule_type ?? "fixed") === "fixed" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-emerald-500" />
                        <span className="text-slate-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          Giờ bắt đầu
                        </span>
                      </div>
                      <input
                        type="time"
                        value={customPhases[0]?.fixed_time ?? "08:00"}
                        onChange={(e) => handlePhaseChange(0, "fixed_time", e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400"
                        style={{ fontSize: "0.7rem" }}
                      />
                    </div>
                  </div>
                )}

                {/* Recurring Interval */}
                {(customPhases[0]?.schedule_type ?? "fixed") === "recurring" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" />
                        <span className="text-slate-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          Chu kỳ
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={customPhases[0]?.recurring_interval ?? 8}
                          onChange={(e) => handlePhaseChange(0, "recurring_interval", Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 text-right"
                          style={{ fontSize: "0.7rem" }}
                          min={1}
                          max={24}
                        />
                        <span className="text-slate-400" style={{ fontSize: "0.7rem" }}>giờ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Phase Cards */}
              <div className="grid grid-flow-col auto-cols-[250px] gap-3 overflow-x-auto pb-2">
                {customPhases.map((phase: any, idx: number) => {
                  // Calculate duration in minutes
                  const durationMinutes = phase?.duration 
                    ? Math.round(phase.duration * 60) 
                    : phase?.duration_seconds 
                      ? Math.round(phase.duration_seconds / 60)
                      : 0;

                  return (
                    <div key={phase?.phase_id ?? idx} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      {/* Phase Header */}
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                            {idx + 1}
                          </span>
                          <span className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                            {phase?.phase_name ?? phase?.name ?? `Phase ${idx + 1}`}
                          </span>
                        </div>
                      </div>

                      {/* Phase Content */}
                      <div className="flex-1 p-4 space-y-3">
                        {/* Devices & Duration Info */}
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5 space-y-2">
                          <div className="flex items-center justify-center gap-2 min-h-[24px]">
                            {phase?.actions && phase.actions.length > 0 ? (
                              <>
                                {phase.actions.filter((a: any) => a.action_type === "activate").map((action: any, i: number) => (
                                  <div key={i} title={action.control_type}>
                                    {action.control_type === "fan" && <Wind size={16} className="text-amber-500" />}
                                    {action.control_type === "lamp" && <Lightbulb size={16} className="text-yellow-500" />}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs">No devices</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                            <span className="text-slate-500 text-xs">Time:</span>
                            <span className="text-slate-700 text-xs font-semibold">
                              {durationMinutes} phút
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                
                })}
              </div>
            </div>
            
          )}
        </div>

        {showDeleteControlModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800" style={{ fontWeight: 700 }}>Select Device to Delete</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteControlModal(false);
                    setSelectedDeleteControlId(null);
                  }}
                  className="text-slate-500"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedControls.map((control) => (
                  <label
                    key={control.control_id}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="deleteControl"
                      checked={selectedDeleteControlId === control.control_id}
                      onChange={() => setSelectedDeleteControlId(control.control_id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{control.control_name}</p>
                      <p className="text-xs text-slate-500 capitalize">{control.control_type}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteControlModal(false);
                    setSelectedDeleteControlId(null);
                  }}
                  className="px-3 py-2 border rounded"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelectedControl}
                  disabled={deletingControl || selectedDeleteControlId == null}
                  className={`px-3 py-2 text-white rounded ${deletingControl ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {deletingControl ? "Đang xoá..." : "Xoá thiết bị"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeviceDetail;
