import { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Thermometer,
  Sun,
  Droplets,
  Wind,
  Flame,
  Save,
  Plus,
  Clock,
  CheckCircle2,
  Cpu,
  Layers,
  Calendar,
  Zap,
  Trash2,
  Apple,
  Edit2,
  Copy,
  ArrowRight,
  Timer,
  Settings2,
  Target,
  Hand,
  Gauge,
  Shield,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { catalogAPI } from "../config/api.config";
import { usePermission } from "../../hooks/usePermission";
import { Permission } from "../../types/rbac";

interface DryingPhase {
  id: string;
  name: string;
  duration: number; // in hours
  actions: Action[]; // array of device IDs that operate during this phase
}

interface Action {
  action_id : number;
  action_type : "activate" | "deactivate";
  control_id : number;
  control_type: string;
  start_offset_seconds : number;
}

type ControlMode = "manual" | "threshold" | "time";

interface TimeSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

interface FruitRecipe {
  id: string;
  name: string;
  phases: DryingPhase[];
  totalTime: number;
  schedules: TimeSchedule[];
  scheduleType: "fixed" | "recurring"; 
  fixedTime?: string;
  recurringInterval?: number; 
  recipe_id?: number;
}

// Helper function to transform API phase response to DryingPhase format
function transformApiPhases(phases: any[]): DryingPhase[] {
  return (phases || []).map((phase: any, index: number) => {
    // Extract control devices from actions with action_type: "activate"
    const activeDevices = (phase.actions || [])
      .filter((action: any) => action.action_type === "activate")
      .map((action: any) => {
        // Map control_type to device names (lamp -> light, fan -> fan)
      return action.control_id;
      })
      .filter((device: string, index: number, self: string[]) => self.indexOf(device) === index); // remove duplicates
    return {
      id: String(phase.phase_id || index),
      name: `Phase ${phase.phase_order || index + 1}`,
      duration: phase.duration_seconds ? phase.duration_seconds / 3600 : 0, // convert seconds to hours
      actions: phase.actions || [],
    };
  });
}

function FruitSelector({
  selected,
  onSelect,
  search,
  onSearch,
  recipes = [],
}: {
  selected: string | null;
  onSelect: (recipeId: string) => void;
  search: string;
  onSearch: (s: string) => void;
  recipes: FruitRecipe[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <Apple size={15} className="text-emerald-500" />
          <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            Recipes
          </h2>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
            style={{ fontSize: "0.78rem" }}
          />
        </div>
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Tropical Recipes */}
        {recipes.length > 0 && (
          <div>
            <div className="px-2 py-1 mb-1">
              <span className="text-slate-400" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                ALL RECIPES
              </span>
            </div>
            <div className="space-y-0.5">
              {recipes.map((fruit) => (
                <button
                  key={fruit.id}
                  onClick={() => onSelect(String(fruit.recipe_id))}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    selected === String(fruit.recipe_id)
                      ? "bg-emerald-500 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Apple size={14} className={selected === String(fruit.recipe_id) ? "text-white" : "text-emerald-500"} />
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{fruit.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add New Recipe */}
      <div className="p-3 border-t border-slate-100">
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all"
          style={{ fontSize: "0.78rem", fontWeight: 600 }}
        >
          <Plus size={13} />
          Create New Recipe
        </button>
      </div>
    </div>
  );
}

function RecipeEditor({ recipe, recipeData }: { recipe: FruitRecipe; recipeData?: any }) {
  const [phases, setPhases] = useState<DryingPhase[]>(
    recipeData?.phases && recipeData.phases.length > 0 ? recipeData.phases : recipe.phases
  );
  const [schedules, setSchedules] = useState<TimeSchedule[]>(recipe.schedules);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Permission checks
  const canDeleteRecipePhase = usePermission(Permission.DELETE_RECIPE_PHASE);

  // Sync local state with recipeData when it changes
  useEffect(() => {
    if (recipeData) {
      if (recipeData.phases && recipeData.phases.length > 0) {
        setPhases(recipeData.phases);
      }
      if (recipeData.schedules) {
        setSchedules(recipeData.schedules);
      }
    }
  }, [recipeData]);

  const handlePhaseChange = (
    phaseId: string,
    field: keyof DryingPhase,
    value: string | number | string[] | Action[],
  ) => {
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, [field]: value } : p))
    );
    console.log(`Phase ${phaseId} - Updated ${field}:`, value);
  };

  // Helper function to update specific action by control_type
  const updateActionByControlType = (
    phase: DryingPhase,
    controlType: string,
    updates: Partial<Action>
  ): Action[] => {
    const existingAction = phase.actions.find(a => a.control_type === controlType);
    if (existingAction) {
      // Update only the specified fields, keep others
      return phase.actions.map(a =>
        a.control_type === controlType ? { ...a, ...updates } : a
      );
    }
    // If action doesn't exist and we're activating, create new one
    if (updates.action_type === "activate") {
      return [...phase.actions, { 
        action_id: 0, 
        action_type: "activate", 
        control_id: 0, 
        control_type: controlType, 
        start_offset_seconds: 0,
        ...updates
      }];
    }
    return phase.actions;
  };

  const handleAddPhase = () => {
    const newPhase: DryingPhase = {
      id: `p${phases.length + 1}`,
      name: `Phase ${phases.length + 1}`,
      duration: 4,
      scheduleType: "fixed",
      fixedTime: "08:00",
      recurringInterval: 8,
      actions: []
    };
    setPhases([...phases, newPhase]);
  };

  const handleDeletePhase = (phaseId: string) => {
    if (phases.length > 1) {
      setPhases((prev) => prev.filter((p) => p.id !== phaseId));
    }
  };


  const handleScheduleChange = (id: string, field: keyof TimeSchedule, value: any) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleAddSchedule = () => {
    const newSchedule: TimeSchedule = {
      id: `s${schedules.length + 1}`,
      name: `Schedule ${schedules.length + 1}`,
      startTime: "08:00",
      endTime: "20:00",
      active: true,
    };
    setSchedules([...schedules, newSchedule]);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Save recipe data to backend
      if (recipe.recipe_id) {
        await catalogAPI.recipes.update(recipe.recipe_id, {
          phases: phases.map((p) => ({
            phase_id: Number(p.id),
            phase_order: phases.indexOf(p) + 1,
            duration_seconds: p.duration * 60, // convert mins to seconds
            schedule_type: p.scheduleType || "fixed",
            fixed_time: p.scheduleType === "fixed" ? p.fixedTime : null,
            recurring_interval: p.scheduleType === "recurring" ? p.recurringInterval : null,
            actions: p.actions,
          })),
          schedules: schedules,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Lỗi lưu recipe. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalTime = phases.reduce((sum, p) => sum + p.duration, 0);

  return (
    <div className="space-y-5">
      {/* Recipe Overview */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Apple size={16} className="text-emerald-600" />
              <h3 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1rem" }}>
                {recipe.name} Drying Recipe
              </h3>
            </div>
            <p className="text-slate-600" style={{ fontSize: "0.78rem" }}>
              Multi-phase drying process with automated temperature and humidity control
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-3 py-1 bg-white rounded-lg text-emerald-600 border border-emerald-200" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
              {phases.length} Phases
            </span>
            <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>
              Total: {totalTime.toFixed(1)}h
            </span>
          </div>
        </div>
      </div>
      {/* Phase Flow Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer size={14} className="text-slate-400" />
          <span className="text-slate-700" style={{ fontWeight: 700, fontSize: "0.875rem" }}>
            Process Flow
          </span> 
                    <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center ml-auto gap-2 px-4 py-2 rounded-lg shadow-sm transition-all ${
              isSaving 
                ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                : saved
                ? "bg-emerald-500 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
            style={{ fontSize: "0.8125rem", fontWeight: 600 }}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={14} />
                Saved!
              </>
            ) : (
              <>
                <Save size={14} />
                Save Recipe
              </>
            )}
          </button>
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
                            value={recipe?.schedule_type ?? "fixed"}
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
                      {(recipe?.schedule_type ?? "fixed") === "fixed" && (
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
                              value={recipe?.fixed_time ?? "08:00"}
                              onChange={(e) => handlePhaseChange(idx, "fixed_time", e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400"
                              style={{ fontSize: "0.7rem" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Recurring Interval */}
                      {(recipe?.schedule_type ?? "fixed") === "recurring" && (
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


        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {phases.map((phase, idx) => (
            <div key={phase.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center min-w-[140px]">
                <div className="w-full bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                  <div className="text-center mb-2">
                    <span className="text-slate-800" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                      {phase.name}
                    </span>
                  </div>
                  {/* Control Devices Icons */}
                  <div className="flex items-center justify-center gap-2 mb-2 min-h-[24px]">
                    {phase.actions && phase.actions.length > 0 ? (
                      <>
                        {phase.actions.filter(a => a.action_type === "activate").map((action, i) => (
                          <div key={i} title={action.control_type}>
                            {action.control_type === "fan" && <Wind size={16} className="text-amber-500" />}
                            {action.control_type === "lamp" && <Lightbulb size={16} className="text-yellow-500" />}
                          </div>
                        ))}
                      </>
                    ) : (
                      <span className="text-slate-400" style={{ fontSize: "0.65rem" }}>No devices</span>
                    )}
                  </div>
                  
                  {/* Device Actions Info */}
                  {phase.actions && phase.actions.length > 0 && (
                    <div className="bg-white rounded border border-slate-100 p-1.5 mb-2 space-y-1 flex flex-col items-center justify-center">
                      {(() => {
                        const elements = [];
                        
                        // Check Fan
                        if (phase.actions.some(a => a.action_type === "activate" && a.control_type === "fan")) {
                          elements.push(
                            <div key="fan-on" className="text-xs text-slate-600 flex items-center justify-center gap-1">
                              <span className="font-semibold">Fan:</span>
                              <span className="text-slate-500">ON</span>
                            </div>
                          );
                        } else if (phase.actions.some(a => a.action_type === "deactivate" && a.control_type === "fan")) {
                          elements.push(
                            <div key="fan-off" className="text-xs text-slate-600 flex items-center justify-center gap-1">
                              <span className="font-semibold">Fan:</span>
                              <span className="text-slate-500">OFF</span>
                            </div>
                          );
                        }
                        
                        // Check Lamp
                        if (phase.actions.some(a => a.action_type === "activate" && a.control_type === "lamp")) {
                          elements.push(
                            <div key="lamp-on" className="text-xs text-slate-600 flex items-center justify-center gap-1">
                              <span className="font-semibold">Lamp:</span>
                              <span className="text-slate-500">ON</span>
                            </div>
                          );
                        } else if (phase.actions.some(a => a.action_type === "deactivate" && a.control_type === "lamp")) {
                          elements.push(
                            <div key="lamp-off" className="text-xs text-slate-600 flex items-center justify-center gap-1">
                              <span className="font-semibold">Lamp:</span>
                              <span className="text-slate-500">OFF</span>
                            </div>
                          );
                        }
                        
                        return elements;
                      })()}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500" style={{ fontSize: "0.68rem" }}>Time:</span>
                    <span className="text-slate-700" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      {(phase.duration * 60).toFixed(2)} phút
                    </span>
                  </div>
                </div>
              </div>
              {idx < phases.length - 1 && (
                <ArrowRight size={16} className="text-slate-300 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
 
      {/* Phase Configuration Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-700" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            Phase Configuration
          </h3>
        </div>

        <div className="grid grid-flow-col auto-cols-[250px] gap-3 overflow-x-auto pb-1">
          {phases.map((phase, idx) => (
            <div
              key={phase.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
            {/* Phase Header */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white"
                  style={{ fontSize: "0.7rem", fontWeight: 700 }}
                >
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={phase.name}
                  onChange={(e) => handlePhaseChange(phase.id, "name", e.target.value)}
                  className="bg-transparent text-slate-800 outline-none border-b border-transparent hover:border-emerald-300 focus:border-emerald-500 transition-all"
                  style={{ fontSize: "0.875rem", fontWeight: 700, width: "200px" }}
                />
              </div>
              {canDeleteRecipePhase && (
                <button
                  onClick={() => handleDeletePhase(phase.id)}
                  disabled={phases.length === 1}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Phase Controls */}
            <div className="p-4 space-y-4">
              {/* Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    <span className="text-slate-700" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      Duration
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="30"
                      value={phase.duration * 60}
                      onChange={(e) => handlePhaseChange(phase.id, "duration", Number(e.target.value) / 60)}
                      className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 text-right"
                      style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                      min={30}
                      max={1440}
                    />
                    <span className="text-slate-400" style={{ fontSize: "0.78rem" }}>phút</span>
                  </div>
                </div>
              </div>

           

              {/* Control Devices */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={14} className="text-slate-500" />
                  <span className="text-slate-700" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                    Control Devices
                  </span>
                </div>
                <div className="space-y-2">
                  {/* Lights */}
                  <div>
                    <div className="text-slate-600" style={{ fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      Đèn (Lights)
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={phase.actions.some(a => a.action_type === "activate" && a.control_type === "lamp")}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const updatedActions = updateActionByControlType(phase, "lamp", { action_type: "activate" });
                                handlePhaseChange(phase.id, "actions", updatedActions);
                              } else {
                                handlePhaseChange(phase.id, "actions", phase.actions.filter((a) => !(a.action_type === "activate" && a.control_type === "lamp")));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 cursor-pointer"
                          />
                          <Lightbulb size={13} className="text-amber-400" />
                          <span className="text-slate-700" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                            Đèn (Light)
                          </span>
                        </label>
                    </div>
                  </div>

                  {/* Fans */}
                  <div>
                    <div className="text-slate-600" style={{ fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      Quạt (Fans)
                    </div>
                    <div className="space-y-1"> 
                        <label  className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={phase.actions.some(a => a.action_type === "activate" && a.control_type === "fan")}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const updatedActions = updateActionByControlType(phase, "fan", { action_type: "activate" });
                                handlePhaseChange(phase.id, "actions", updatedActions);
                              } else {
                                handlePhaseChange(phase.id, "actions", phase.actions.filter((a) => !(a.action_type === "activate" && a.control_type === "fan")));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 cursor-pointer"
                          />
                          <Wind size={13} className="text-blue-400" />
                          <span className="text-slate-700" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                            Quạt (Fan)
                          </span>
                        </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}

export function AutomationRules() {
  const [recipes, setRecipes] = useState<FruitRecipe[]>([]);
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [selectedRecipeData, setSelectedRecipeData] = useState<any>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // Fetch recipes list on component mount
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const response = await catalogAPI.recipes.list();
        // Transform API response to FruitRecipe format
        const transformedRecipes = (response.data || []).map((recipe: any) => ({
          id: String(recipe.recipe_id),
          name: recipe.recipe_name,
          category: recipe.fruit_id ? "tropical" : "other", // simplified categorization
          phases: recipe.phases || [],
          totalTime: recipe.phases?.reduce((sum: number, p: any) => sum + (p.duration || 0), 0) || 0,
          controlMode: "threshold" as ControlMode,
          thresholds: [],
          schedules: [],
          scheduleType : "recurring" ,
          recipe_id: recipe.recipe_id,
        }));

        // Add mock data if no recipes from API (for development/demo)
        const allRecipes = transformedRecipes.length > 0 ? transformedRecipes : getMockRecipes();
        
        setRecipes(allRecipes);
        if (allRecipes.length > 0) {
          setSelectedFruit(String(allRecipes[0].recipe_id));
          setSelectedRecipeId(allRecipes[0].recipe_id);
        }
      } catch (error) {
        console.error("Error loading recipes:", error);
        // Use mock data as fallback on error
        const mockRecipes = getMockRecipes();
        setRecipes(mockRecipes);
        if (mockRecipes.length > 0) {
          setSelectedFruit(String(mockRecipes[0].recipe_id));
          setSelectedRecipeId(mockRecipes[0].recipe_id);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  // Fetch selected recipe details
  useEffect(() => {
    if (!selectedRecipeId) return;

    const loadRecipeDetails = async () => {
      try {
        setLoadingRecipe(true);
        const response = await catalogAPI.recipes.get(selectedRecipeId);
        if (response.data) {
          // Transform phases to DryingPhase format
          const transformedData = {
            ...response.data,
            phases: transformApiPhases(response.data.phases),
          };
          setSelectedRecipeData(transformedData);
        }
      } catch (error) {
        console.error("Error loading recipe details:", error);
      } finally {
        setLoadingRecipe(false);
      }
    };

    loadRecipeDetails();
  }, [selectedRecipeId]);

  const selectedRecipe = recipes.find((f) => String(f.recipe_id) === selectedFruit);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <div className="max-w-screen-xl mx-auto flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-emerald-500 animate-spin" />
            <p className="text-slate-600" style={{ fontSize: "0.875rem" }}>Loading recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-screen-xl mx-auto">
        {/* Page Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={24} className="text-emerald-600" />
            <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1.25rem" }}>
              Control Policies & Drying Recipes
            </h1>
          </div>
          <p className="text-slate-400" style={{ fontSize: "0.8rem", marginLeft: "2rem" }}>
            Define control policies with drying recipes, threshold conditions, and device mappings for each fruit type
          </p>
        </div>

        {/* Split View */}
        <div className="flex gap-5 items-start" style={{ minHeight: "calc(100vh - 220px)" }}>
          {/* Left: Fruit Selector (1/3) */}
          <div className="w-72 shrink-0" style={{ minHeight: "500px" }}>
            <FruitSelector
              selected={selectedFruit}
              onSelect={(recipeId) => {
                setSelectedFruit(recipeId);
                const recipe = recipes.find((r) => String(r.recipe_id) === recipeId);
                if (recipe?.recipe_id) {
                  setSelectedRecipeId(recipe.recipe_id);
                }
              }}
              search={searchQuery}
              onSearch={setSearchQuery}
              recipes={recipes}
            />
          </div>

          {/* Right: Recipe Editor (2/3) */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              {loadingRecipe ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={32} className="text-emerald-500 animate-spin" />
                  <p className="text-slate-600" style={{ fontSize: "0.875rem" }}>Loading recipe details...</p>
                </div>
              ) : selectedRecipe ? (
                <RecipeEditor recipe={selectedRecipe} recipeData={selectedRecipeData} />
              ) : (
                <div className="text-center py-20 text-slate-400">
                  <Apple size={48} className="mx-auto mb-3 opacity-30" />
                  <p style={{ fontSize: "0.875rem" }}>Select a fruit type to configure its policy and drying recipe</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
