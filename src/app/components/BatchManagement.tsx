import { useMemo, useState } from "react";
import { CheckCircle2, Layers, PencilLine, Plus, Clock, Hand, Zap, Play, Square, Trash2, AlertCircle } from "lucide-react";
import { Can } from "@/components/permission/PermissionGuards";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/types/rbac";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface BatchItem {
  id: string;
  machineId: string;
  machine: string;
  fruit: string;
  status: "running" | "completed" | "cancelled" | "error" | "paused";
  mode: "manual" | "scheduled";
  hasThreshold: boolean;
  recipe: string;
  progress: number;
  phase: number;
  totalPhases: number;
}

const initialBatches: BatchItem[] = [
  { id: "BATCH-046", machineId: "M04", machine: "Dryer A1", fruit: "Mango", status: "running", mode: "scheduled", hasThreshold: false, recipe: "Mango Dry v2.1", progress: 65, phase: 2, totalPhases: 4 },
  { id: "BATCH-047", machineId: "M04", machine: "Dryer A1", fruit: "Papaya", status: "running", mode: "scheduled", hasThreshold: true, recipe: "Papaya Dry v1.0", progress: 45, phase: 2, totalPhases: 3 },
  { id: "BATCH-048", machineId: "A2", machine: "Dryer A2", fruit: "Banana", status: "paused", mode: "manual", hasThreshold: false, recipe: "Manual Control", progress: 30, phase: 1, totalPhases: 1 },
  { id: "BATCH-049", machineId: "A2", machine: "Dryer A2", fruit: "Guava", status: "completed", mode: "scheduled", hasThreshold: true, recipe: "Guava Dry v1.5", progress: 100, phase: 3, totalPhases: 3 },
  { id: "BATCH-050", machineId: "B1", machine: "Dryer B1", fruit: "Pineapple", status: "running", mode: "scheduled", hasThreshold: false, recipe: "Pineapple Dry v3.0", progress: 72, phase: 3, totalPhases: 4 },
  { id: "BATCH-051", machineId: "B1", machine: "Dryer B1", fruit: "Orange", status: "paused", mode: "manual", hasThreshold: true, recipe: "Manual + Threshold", progress: 55, phase: 1, totalPhases: 2 },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  running: { label: "Đang chạy", color: "text-emerald-600", bg: "bg-emerald-100" },
  paused: { label: "Tạm dừng", color: "text-yellow-600", bg: "bg-yellow-100" },
  completed: { label: "Hoàn thành", color: "text-blue-600", bg: "bg-blue-100" },
  cancelled: { label: "Hủy", color: "text-slate-600", bg: "bg-slate-100" },
  error: { label: "Lỗi", color: "text-red-600", bg: "bg-red-100" },
};

const modeConfig = {
  manual: { icon: <Hand size={16} />, label: "Manual Control", color: "text-slate-700", bg: "bg-slate-100" },
  scheduled: { icon: <Clock size={16} />, label: "Scheduled Recipe", color: "text-cyan-700", bg: "bg-cyan-100" },
};

// Mock recipes and fruits
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

export function BatchManagement() {
  const [batches, setBatches] = useState(initialBatches);
  const [machineFilter, setMachineFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState<"all" | "manual" | "scheduled">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "running" | "paused" | "completed" | "cancelled" | "error">("running");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fruit: "",
    machine: "",
    recipe: "",
    mode: "scheduled" as "manual" | "scheduled",
    threshold: false,
  });

  // Permission checks
  const canCreateBatch = usePermission(Permission.CREATE_BATCH);
  const canRunBatch = usePermission(Permission.RUN_BATCH);
  const canStopBatch = usePermission(Permission.STOP_BATCH);

  const machineOptions = useMemo(
    () => Array.from(new Set(batches.map((batch) => batch.machine))),
    [batches],
  );

  const filteredBatches = useMemo(
    () =>
      batches.filter((batch) => {
        const machineMatched = machineFilter === "all" || batch.machine === machineFilter;
        const modeMatched = modeFilter === "all" || batch.mode === modeFilter;
        const statusMatched = statusFilter === "all" || batch.status === statusFilter;
        return machineMatched && modeMatched && statusMatched;
      }),
    [batches, machineFilter, modeFilter, statusFilter],
  );

  const stats = useMemo(() => ({
    total: batches.length,
    running: batches.filter(b => b.status === "running").length,
    completed: batches.filter(b => b.status === "completed").length,
    withThreshold: batches.filter(b => b.hasThreshold).length,
  }), [batches]);

  const handleCreateBatch = () => {
    if (!createForm.fruit || !createForm.machine || !createForm.recipe) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const newBatch: BatchItem = {
      id: `BATCH-${String(Math.max(...batches.map(b => parseInt(b.id.split("-")[1])), 0) + 1).padStart(3, "0")}`,
      machineId: createForm.machine,
      machine: createForm.machine,
      fruit: createForm.fruit,
      recipe: createForm.recipe,
      mode: createForm.mode,
      hasThreshold: createForm.threshold,
      status: "running",
      progress: 0,
      phase: 1,
      totalPhases: 3, // Default
    };

    setBatches([newBatch, ...batches]);
    setIsCreateOpen(false);
    setCreateForm({
      fruit: "",
      machine: "",
      recipe: "",
      mode: "scheduled",
      threshold: false,
    });
  };

  const handleRunBatch = (batchId: string) => {
    if (!canRunBatch) {
      alert("Bạn không có quyền chạy mẻ sấy");
      return;
    }

    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          // Nếu batch đã tạm dừng (paused), tiếp tục từ vị trí hiện tại
          // Nếu batch ở trạng thái khác, bắt đầu từ đầu
          return {
            ...b,
            status: "running" as const,
            progress: b.status === "paused" ? b.progress : 0,
            phase: b.status === "paused" ? b.phase : 1,
          };
        }
        return b;
      })
    );
  };

  const handleStopBatch = (batchId: string) => {
    if (!canStopBatch) {
      alert("Bạn không có quyền dừng mẻ sấy");
      return;
    }

    setBatches(
      batches.map((b) =>
        b.id === batchId ? { ...b, status: "paused" as const } : b
      )
    );
  };

  const handleDeleteBatch = (batchId: string) => {
    if (confirm("Bạn có chắc muốn xóa mẻ này?")) {
      setBatches(batches.filter((b) => b.id !== batchId));
    }
  };


  return (
    <main className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-emerald-600" />
            <div>
              <h2 className="text-slate-800" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                Batch Management
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Tạo/chạy/dừng mẻ sấy theo công thức có sẵn
              </p>
            </div>
          </div>

          {/* Create Batch Button - Permission Controlled */}
          <Can permission={Permission.CREATE_BATCH}>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus size={16} /> Mẻ sấy mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tạo mẻ sấy mới</DialogTitle>
                  <DialogDescription>
                    Chọn loại trái cây, máy sấy và công thức sấy
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Loại trái cây
                    </label>
                    <Select
                      value={createForm.fruit}
                      onValueChange={(value) =>
                        setCreateForm({
                          ...createForm,
                          fruit: value,
                          recipe: "", // Reset recipe when fruit changes
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại trái cây" />
                      </SelectTrigger>
                      <SelectContent>
                        {fruits.map((fruit) => (
                          <SelectItem key={fruit.id} value={fruit.name}>
                            {fruit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Máy sấy
                    </label>
                    <Select
                      value={createForm.machine}
                      onValueChange={(value) =>
                        setCreateForm({ ...createForm, machine: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn máy sấy" />
                      </SelectTrigger>
                      <SelectContent>
                        {machineOptions.map((machine) => (
                          <SelectItem key={machine} value={machine}>
                            {machine}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Công thức sấy
                    </label>
                    <Select
                      value={createForm.recipe}
                      onValueChange={(value) =>
                        setCreateForm({ ...createForm, recipe: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn công thức" />
                      </SelectTrigger>
                      <SelectContent>
                        {createForm.fruit &&
                          recipes[createForm.fruit.toLowerCase()]?.map((recipe) => (
                            <SelectItem key={recipe} value={recipe}>
                              {recipe}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Chế độ vận hành
                    </label>
                    <Select
                      value={createForm.mode}
                      onValueChange={(value) =>
                        setCreateForm({
                          ...createForm,
                          mode: value as "manual" | "scheduled",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Control</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="threshold"
                      checked={createForm.threshold}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          threshold: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="threshold" className="text-sm font-medium">
                      Bật tùy chọn Threshold
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleCreateBatch}>Tạo mẻ</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </Can>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-slate-500" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Tổng mẻ
            </p>
            <p className="text-slate-900" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              {stats.total}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-slate-500" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Đang chạy
            </p>
            <p className="text-emerald-600" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              {stats.running}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-slate-500" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Hoàn thành
            </p>
            <p className="text-blue-600" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              {stats.completed}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-slate-500" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Có Threshold
            </p>
            <p className="text-amber-600" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              {stats.withThreshold}
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <h3 className="text-slate-800 mb-3" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
          Bộ lọc & Tìm kiếm
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-600 block mb-2" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Lọc theo máy sấy
            </label>
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
              style={{ fontSize: "0.85rem" }}
            >
              <option value="all">Tất cả máy</option>
              {machineOptions.map((machine) => (
                <option key={machine} value={machine}>
                  {machine}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-600 block mb-2" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Chế độ vận hành
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setModeFilter("all")}
                className={`flex-1 px-2 py-2 rounded-lg border text-xs font-600 transition-all ${
                  modeFilter === "all"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setModeFilter("manual")}
                className={`flex-1 px-2 py-2 rounded-lg border text-xs font-600 transition-all ${
                  modeFilter === "manual"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setModeFilter("scheduled")}
                className={`flex-1 px-2 py-2 rounded-lg border text-xs font-600 transition-all ${
                  modeFilter === "scheduled"
                    ? "bg-cyan-600 text-white border-cyan-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Scheduled
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-600 block mb-2" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
              style={{ fontSize: "0.85rem" }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="running">Đang chạy</option>
              <option value="paused">Tạm dừng</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Hủy</option>
              <option value="error">Lỗi</option>
            </select>
          </div>
        </div>
      </section>

      {/* Batch List */}
      <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-slate-700" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
            Mẻ sấy ({filteredBatches.length})
          </p>
        </div>

        <div className="p-4 space-y-3">
          {filteredBatches.map((batch) => (
            <Card key={batch.id} className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left side - Batch info */}
                <div className="flex-1">
                  <p className="text-slate-900 font-bold text-lg">{batch.id}</p>
                  <p className="text-slate-600 text-sm">
                    {batch.machine} • {batch.fruit}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{batch.recipe}</p>
                </div>

                {/* Middle - Progress and Mode */}
                <div className="flex-1">
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                        className="text-slate-600"
                      >
                        Phase {batch.phase} of {batch.totalPhases}
                      </span>
                      <span
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                        className="text-slate-600"
                      >
                        {batch.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${batch.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${modeConfig[batch.mode].bg}`}>
                      <span className={modeConfig[batch.mode].color}>
                        {modeConfig[batch.mode].icon}
                      </span>
                      <span
                        className={`text-xs font-600 ${modeConfig[batch.mode].color}`}
                      >
                        {modeConfig[batch.mode].label}
                      </span>
                    </div>
                    {batch.hasThreshold && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100">
                        <Zap size={12} className="text-amber-600" />
                        <span className="text-xs font-600 text-amber-600">
                          + Threshold
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Status & Actions */}
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-700 ${
                      statusConfig[batch.status].bg
                    } ${statusConfig[batch.status].color}`}
                  >
                    {statusConfig[batch.status].label}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap justify-end">
                    {batch.status !== "running" && (
                      <Can permission={Permission.RUN_BATCH}>
                        <Button
                          size="sm"
                          className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleRunBatch(batch.id)}
                        >
                          <Play size={14} />
                          {batch.status === "paused" ? "Tiếp tục" : "Chạy"}
                        </Button>
                      </Can>
                    )}

                    {batch.status === "running" && (
                      <Can permission={Permission.STOP_BATCH}>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => handleStopBatch(batch.id)}
                        >
                          <Square size={14} />
                          Dừng
                        </Button>
                      </Can>
                    )}

                    {batch.status !== "running" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleDeleteBatch(batch.id)}
                      >
                        <Trash2 size={14} />
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredBatches.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400" style={{ fontSize: "0.9rem" }}>
                Không có mẻ sấy nào phù hợp với bộ lọc
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
