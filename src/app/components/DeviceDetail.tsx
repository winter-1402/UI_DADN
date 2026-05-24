import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { structureAPI, batchAPI, catalogAPI } from "../config/api.config";
import { 
  ArrowLeft, Thermometer, Droplets, Wind, Lightbulb, Play, Pause, Square, Loader, AlertTriangle,
  Clock, Calendar, Zap, Trash2, Save, CheckCircle2, Loader2, Plus, Sun, Cpu, Timer, ChevronDown
} from "lucide-react";
import { DryerDetail } from "../types/dryer";

type BatchStatus =
  | "pending"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "aborted"
  | "error"
  | string;

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

  // Choose the most relevant active batch (running > paused > scheduled/pending)
  const activeBatch = pickActiveBatch(batches);

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

  // Fetch fruit recipe list and recipe detail for the current active batch
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
        let recipesByFruit: RecipeSummary[] = [];

        if (currentBatch.fruit_id) {
          const listResponse = await catalogAPI.recipes.list({ fruit_id: currentBatch.fruit_id });
          const listData = listResponse?.data ?? listResponse ?? [];
          recipesByFruit = Array.isArray(listData) ? listData : [];
        }

        if (!cancelled) {
          setFruitRecipes(recipesByFruit);
        }

        const selectedRecipeId =
          currentBatch.recipe_id ?? recipesByFruit.find((r) => r.recipe_id)?.recipe_id;

        if (!selectedRecipeId) {
          if (!cancelled) {
            setRecipeDetail(null);
          }
          return;
        }

        const detailResponse = await catalogAPI.recipes.get(selectedRecipeId);
        const detailData = detailResponse?.data ?? detailResponse ?? null;

        if (!cancelled) {
          setRecipeDetail(detailData);
        }
      } catch (err) {
        if (!cancelled) {
          setRecipeInfoError(err instanceof Error ? err.message : "Không tải được thông tin recipe");
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

  // Load custom phases if batch is customized
  useEffect(() => {
    if (activeBatch?.is_customize && recipeDetail?.phases) {
      setCustomPhases(recipeDetail.phases);
    } else {
      setCustomPhases([]);
    }
  }, [activeBatch?.is_customize, recipeDetail?.phases]);

  // ---- Batch actions --------------------------------------------------------
  const runBatchAction = async (
    batchId: number,
    action: "start" | "resume" | "abort",
    successMsg: string
  ) => {
    setBatchActionId(batchId);
    try {
      if (action === "resume" || action === "start") {
        await batchAPI.start(batchId);
        toast.success(successMsg);
      } else if (action === "pause") {
        await batchAPI.pause(batchId, "completed");
        toast.success(successMsg);
      } else if (action === "abort") {
        await batchAPI.pause(batchId, "cancelled");
        toast.success(successMsg);
        await fetchBatches();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác mẻ sấy thất bại");
    } finally {
      setBatchActionId(null);
    }
  };

  const startBatch = (batchId: number) => runBatchAction(batchId, "start", "Đã bắt đầu mẻ sấy");
  const pauseBatch = (batchId: number) => runBatchAction(batchId, "pause", "Đã tạm dừng mẻ sấy");
  const resumeBatch = (batchId: number) => runBatchAction(batchId, "resume", "Đã tiếp tục mẻ sấy");
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
      toast.success("Cập nhật phase thành công");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật phase thất bại");
    } finally {
      setIsSavingCustomPhases(false);
    }
  };

  const toggleControl = async (controlId: number, currentStatus?: string) => {
    const nextStatus = isControlOn(currentStatus) ? "inactive" : "active";
    setControlActionId(controlId);
    try {
      await structureAPI.controls.update(controlId, { status: nextStatus });
      toast.success(`Đã chuyển ${nextStatus === "active" ? "bật" : "tắt"} thiết bị`);
      await fetchDryer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thiết bị thất bại");
    } finally {
      setControlActionId(null);
    }
  };

  const handleAddControl = async (controlType: "fan" | "lamp") => {
    if (!dryerId || !dryerData) return;

    setCreatingControlType(controlType);
    try {
      const controls = Array.isArray(dryerData.controls) ? dryerData.controls : [];
      const countByType = controls.filter((c) => c.control_type === controlType).length;
      const nextNumber = countByType + 1;
      const controlName = `${controlType === "fan" ? "Fan" : "Lamp"} ${nextNumber}`;

      await structureAPI.controls.create({
        dry_id: dryerId,
        control_type: controlType,
        control_name: controlName,
        status: "inactive",
      });

      toast.success(`Đã thêm ${controlName}`);
      await fetchDryer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm output device thất bại");
    } finally {
      setCreatingControlType(null);
    }
  };

  // ---- Render ---------------------------------------------------------------

  // Loading skeleton for dryer
  if (loadingDryer) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <div className="max-w-screen-lg mx-auto space-y-6">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader className="animate-spin" size={20} />
            <span>Đang tải dữ liệu thiết bị...</span>
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
    activeBatch?.recipe_id != null
      ? fruitRecipes.find((recipe) => recipe.recipe_id === activeBatch.recipe_id)
      : null;
  const fruitNameFromApi =
    activeBatch?.fruit_id != null ? fruitNameById[activeBatch.fruit_id] : undefined;
  const fruitDisplayName =
    fruitNameFromApi ??
    activeBatch?.fruit_name ??
    matchedRecipeFromFruit?.fruit_name ??
    (activeBatch?.fruit_id != null ? `Fruit #${activeBatch.fruit_id}` : "-");
  const recipeDisplayName =
    recipeDetail?.recipe_name ??
    matchedRecipeFromFruit?.recipe_name ??
    activeBatch?.recipe_name ??
    (activeBatch?.recipe_id != null ? `Recipe #${activeBatch.recipe_id}` : "-");
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
          <div>
            <button
              onClick={() => navigate("/devices")}
              className="flex items-center gap-2 text-slate-600 mb-1"
            >
              <ArrowLeft /> Back
            </button>
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
              {(dryerData.sensors ?? []).map((sensor) => (
                <div
                  key={sensor.sensor_id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-slate-50/60"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {sensor.sensor_type === "temperature" ? (
                      <Thermometer size={16} className="text-orange-500 mt-0.5 shrink-0" />
                    ) : sensor.sensor_type === "humidity" ? (
                      <Droplets size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    ) : (
                      <Thermometer size={16} className="mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="text-slate-800 capitalize text-sm font-medium block">
                        {sensor.sensor_type}
                      </span>
                      <p className="text-xs text-slate-400">Threshold: {sensor.threshold}</p>
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
              ))}
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
                  Mẻ sấy hiện tại
                </h3>
                <button
                  onClick={fetchBatches}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Refresh
                </button>
              </div>
              {activeBatch && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => pauseBatch(activeBatch.batch_id)}
                    disabled={
                      batchActionId === activeBatch.batch_id ||
                      !(activeBatch.status === "running" || activeBatch.status === "scheduled" || activeBatch.status === "pending")
                    }
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dừng
                  </button>
                  <button
                    onClick={() => resumeBatch(activeBatch.batch_id)}
                    disabled={batchActionId === activeBatch.batch_id || activeBatch.status !== "paused"}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp tục
                  </button>
                </div>
              )}
              {!activeBatch ? (
                <div className="mt-3 text-slate-400">Không có mẻ sấy đang hoạt động.</div>
              ) : (
                <div className="mt-3 p-4 border rounded bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-slate-800 font-bold text-sm">
                        Batch #{activeBatch.batch_id}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Recipe: {recipeDisplayName}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Batch: {activeBatch.batch_id}
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

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Fruit</span>
                      <span className="text-slate-700 font-semibold">
                        {fruitDisplayName}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block">Mode</span>
                      <span className="text-slate-700 font-semibold">
                        {activeBatch.operation_mode ?? "-"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                    <p className="text-slate-700 text-xs font-semibold">Thông tin áp dụng</p>

                    {loadingRecipeInfo && (
                      <p className="mt-1 text-xs text-slate-400">Đang tải thông tin recipe...</p>
                    )}

                    {!loadingRecipeInfo && recipeInfoError && (
                      <p className="mt-1 text-xs text-red-500">{recipeInfoError}</p>
                    )}

                    {!loadingRecipeInfo && !recipeInfoError && (
                      <div className="mt-2 space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2 rounded border border-slate-100 bg-slate-50">
                            <span className="text-slate-400 block">Tên trái cây</span>
                            <span className="text-slate-700 font-semibold">{fruitDisplayName}</span>
                          </div>
                          <div className="p-2 rounded border border-slate-100 bg-slate-50">
                            <span className="text-slate-400 block">Tên recipe</span>
                            <span className="text-slate-700 font-semibold">{recipeDisplayName}</span>
                          </div>
                          <div className="p-2 rounded border border-slate-100 bg-slate-50 sm:col-span-2">
                            <span className="text-slate-400 block">Chi tiết từng phase</span>
                            {recipePhases.length === 0 ? (
                              <span className="text-slate-700 font-semibold">Recipe chưa có phase</span>
                            ) : (
                              <div className="mt-2 space-y-2">
                                {recipePhases.map((phase: any, index: number) => {
                                  const phaseName =
                                    phase?.phase_name ??
                                    phase?.name ??
                                    `Phase ${phase?.phase_number ?? index + 1}`;
                                  const rawDurationSeconds =
                                    phase?.duration_seconds ?? phase?.durationSeconds;
                                  const rawDurationHours = phase?.duration;
                                  const durationLabel =
                                    typeof rawDurationSeconds === "number"
                                      ? `${(rawDurationSeconds / 3600).toFixed(1)} giờ`
                                      : typeof rawDurationHours === "number"
                                        ? `${rawDurationHours} giờ`
                                        : "-";
                                  const targetTemp =
                                    phase?.target_temperature ??
                                    phase?.target_temp ??
                                    phase?.temp;
                                  const targetHumidity =
                                    phase?.target_humidity ??
                                    phase?.humidity_target ??
                                    phase?.humidity;

                                  return (
                                    <div key={phase?.phase_id ?? phase?.id ?? index} className="rounded border border-slate-200 bg-white p-2">
                                      <p className="text-slate-800 font-semibold">
                                        {index + 1}. {phaseName}
                                      </p>
                                      <p className="text-slate-600 mt-1">
                                        Thời lượng: {durationLabel} • Nhiệt độ: {targetTemp ?? "-"} • Độ ẩm: {targetHumidity ?? "-"}
                                      </p>
                                      {phase?.description && (
                                        <p className="text-slate-500 mt-1 break-words">Mô tả: {phase.description}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="p-2 rounded border border-slate-100 bg-slate-50 sm:col-span-2">
                            <span className="text-slate-400 block">Chế độ ngưỡng</span>
                            <span className={`font-semibold ${activeBatch.threshold_enabled ? "text-purple-700" : "text-slate-700"}`}>
                              {activeBatch.threshold_enabled ? "Có áp dụng" : "Không áp dụng"}
                            </span>
                          </div>
                          {activeBatch.threshold_enabled && (
                            <div className="p-2 rounded border border-slate-100 bg-purple-50 sm:col-span-2">
                              <span className="text-slate-400 block">Ngưỡng thiết bị</span>
                              <div className="mt-2 space-y-1">
                                {(dryerData.sensors ?? []).map((sensor) => (
                                  <div key={sensor.sensor_id} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600 capitalize">
                                      {sensor.sensor_type === "temperature" ? "Nhiệt độ" : sensor.sensor_type === "humidity" ? "Độ ẩm" : sensor.sensor_type}
                                    </span>
                                    <span className="font-semibold text-purple-700">
                                      {sensor.threshold ?? "-"}
                                      {sensor.sensor_type === "temperature" ? "°C" : sensor.sensor_type === "humidity" ? "%" : ""}
                                    </span>
                                  </div>
                                ))}
                                {(!dryerData.sensors || dryerData.sensors.length === 0) && (
                                  <span className="text-xs text-slate-400">Không có cảm biến</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

              {/* Phase Cards */}
              <div className="grid grid-flow-col auto-cols-[minmax(300px,1fr)] gap-3 overflow-x-auto pb-2">
                {customPhases.map((phase: any, idx: number) => (
                  <div key={phase?.phase_id ?? idx} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    {/* Phase Header */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={phase?.phase_name ?? phase?.name ?? `Phase ${idx + 1}`}
                          onChange={(e) => handlePhaseChange(idx, "phase_name", e.target.value)}
                          className="bg-transparent text-slate-800 outline-none border-b border-transparent hover:border-emerald-300 focus:border-emerald-500 transition-all flex-1"
                          style={{ fontSize: "0.875rem", fontWeight: 700 }}
                        />
                      </div>
                    </div>

                    {/* Phase Config */}
                    <div className="p-4 space-y-3">
                      {/* Temperature */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Thermometer size={14} className="text-orange-500" />
                            <span className="text-slate-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                              Nhiệt độ
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={phase?.target_temperature ?? phase?.temperature ?? 0}
                              onChange={(e) => handlePhaseChange(idx, "target_temperature", Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-400 text-right"
                              style={{ fontSize: "0.75rem" }}
                              min={20}
                              max={100}
                            />
                            <span className="text-slate-400" style={{ fontSize: "0.75rem" }}>°C</span>
                          </div>
                        </div>
                      </div>

                      {/* Humidity */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Droplets size={14} className="text-blue-500" />
                            <span className="text-slate-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                              Độ ẩm
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={phase?.target_humidity ?? phase?.humidity ?? 0}
                              onChange={(e) => handlePhaseChange(idx, "target_humidity", Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 text-right"
                              style={{ fontSize: "0.75rem" }}
                              min={10}
                              max={100}
                            />
                            <span className="text-slate-400" style={{ fontSize: "0.75rem" }}>%</span>
                          </div>
                        </div>
                      </div>

                      {/* Duration */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-500" />
                            <span className="text-slate-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                              Thời gian
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              value={
                                phase?.duration_seconds
                                  ? (phase.duration_seconds / 3600).toFixed(1)
                                  : phase?.duration ?? 0
                              }
                              onChange={(e) => handlePhaseChange(idx, "duration_seconds", Number(e.target.value) * 3600)}
                              className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 text-right"
                              style={{ fontSize: "0.75rem" }}
                              min={0.5}
                              max={24}
                            />
                            <span className="text-slate-400" style={{ fontSize: "0.75rem" }}>giờ</span>
                          </div>
                        </div>
                      </div>

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
                            value={phase?.schedule_type ?? "fixed"}
                            onChange={(e) => handlePhaseChange(idx, "schedule_type", e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400"
                            style={{ fontSize: "0.7rem" }}
                          >
                            <option value="fixed">Thời gian cố định</option>
                            <option value="recurring">Lặp lại</option>
                          </select>
                        </div>
                      </div>

                      {/* Fixed Time */}
                      {(phase?.schedule_type ?? "fixed") === "fixed" && (
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
                              value={phase?.fixed_time ?? "08:00"}
                              onChange={(e) => handlePhaseChange(idx, "fixed_time", e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400"
                              style={{ fontSize: "0.7rem" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Recurring Interval */}
                      {(phase?.schedule_type ?? "fixed") === "recurring" && (
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
                                value={phase?.recurring_interval ?? 8}
                                onChange={(e) => handlePhaseChange(idx, "recurring_interval", Number(e.target.value))}
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
                  </div>
                ))}
              </div>
            </div>
            
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceDetail;
