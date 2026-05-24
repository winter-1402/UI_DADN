import { useState, useEffect } from "react";
import { structureAPI, catalogAPI } from "../config/api.config";
import { useApiData, useConditionalApiData } from "../../hooks/useApiData";
import { Factory, Area, Dryer, Fruit } from "../types/api";
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  ArrowRight,
  Apple,
  Cpu,
  Target,
  Loader2,
  Sun,
} from "lucide-react";
type ControlMode = "manual" | "threshold" | "automations_recipe";

interface DryingPhase {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  duration: number;
}

interface DryingRecipe {
  id: string;
  name: string;
  phases: DryingPhase[];
  totalTime: number;
}

interface ThresholdRule {
  id: string;
  sensor: "temperature" | "humidity" | "light";
  condition: "above" | "below";
  value: number;
  action: string;
  enabled: boolean;
}

interface TimeSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

interface PolicyConfig {
  fruitType: string;
  controlMode: ControlMode;
  automationRules: string[];
  selectedRecipeId: string;
  thresholds: ThresholdRule[];
  schedules: TimeSchedule[];
}

interface AutomationRuleOption {
  id: string;
  name: string;
  description: string;
  modes: ControlMode[];
}

// Automation Rules - These are static options for the UI
const automationRuleOptions: AutomationRuleOption[] = [
  {
    id: "safe-temp-limit",
    name: "Safe Temperature Limit",
    description: "Auto-reduce heater output when temperature exceeds safe threshold.",
    modes: ["manual", "threshold", "automations_recipe"],
  },
  {
    id: "humidity-balance",
    name: "Humidity Balance",
    description: "Adjust fan speed automatically to stabilize humidity.",
    modes: ["threshold", "automations_recipe"],
  },
  {
    id: "off-hour-energy-saver",
    name: "Off-hour Energy Saver",
    description: "Lower power usage outside production schedule.",
    modes: ["threshold", "automations_recipe"],
  },
  {
    id: "manual-alert-assist",
    name: "Manual Alert Assist",
    description: "Notify operators when readings move outside recommended range.",
    modes: ["manual"],
  },
];

export function Settings() {
  const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedDryer, setSelectedDryer] = useState<number | null>(null);
  const [selectedFruit, setSelectedFruit] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState("");
  const [policy, setPolicy] = useState<PolicyConfig>({
    fruitType: "",
    controlMode: "threshold",
    automationRules: [],
    selectedRecipeId: "",
    thresholds: [],
    schedules: [],
  });
  const [saved, setSaved] = useState(false);

  // ============================================================================
  // API DATA - Using Custom Hooks
  // ============================================================================
  const { data: factories, loading: loadingFactories } = useApiData<Factory>(
    () => structureAPI.factories.list(),
    [],
    (data) => {
      if (data.length > 0 && !selectedFactory) setSelectedFactory(data[0].fac_id);
    }
  );

  const { data: areas, loading: loadingAreas } = useConditionalApiData<Area>(
    selectedFactory ? () => structureAPI.areas.list({ fac_id: selectedFactory }) : null,
    [selectedFactory]
  );

  const { data: dryers, loading: loadingDryers } = useConditionalApiData<Dryer>(
    selectedArea ? () => structureAPI.dryers.list({ area_id: selectedArea }) : null,
    [selectedArea]
  );

  const { data: fruits, loading: loadingFruits } = useApiData<Fruit>(
    () => catalogAPI.fruits.list(),
    []
  );

  const { data: recipes, loading: loadingRecipes } = useConditionalApiData(
    selectedFruit ? () => catalogAPI.recipes.list({ fruit_id: parseInt(selectedFruit) }) : null,
    [selectedFruit]
  );

  // Fetch recipe details (phases, policies, thresholds) - using state for single object
  const [recipeDetails, setRecipeDetails] = useState<any>(null);
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  useEffect(() => {
    // Use selectedRecipe first, fall back to policy.selectedRecipeId
    const recipeIdToFetch = selectedRecipe || policy.selectedRecipeId;
    
    if (!recipeIdToFetch) {
      setRecipeDetails(null);
      setRecipeError(null);
      return;
    }

    const fetchRecipeDetails = async () => {
      setLoadingRecipeDetails(true);
      setRecipeError(null);
      try {
        const result = await catalogAPI.recipes.get(parseInt(recipeIdToFetch));
        
        // Handle different response structures
        const recipeData = result?.data || result;
        setRecipeDetails(recipeData);
        
        if (!recipeData) {
          setRecipeError("No recipe data returned");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Error fetching recipe details:", errorMsg);
        setRecipeError(errorMsg);
        setRecipeDetails(null);
      } finally {
        setLoadingRecipeDetails(false);
      }
    };

    fetchRecipeDetails();
  }, [selectedRecipe, policy.selectedRecipeId]);

  // Fetch dryer details (controls, sensors) - using state for single object
  const [dryerDetails, setDryerDetails] = useState<any>(null);
  const [loadingDryerDetails, setLoadingDryerDetails] = useState(false);
  const [dryerError, setDryerError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDryer) {
      setDryerDetails(null);
      setDryerError(null);
      return;
    }

    const fetchDryerDetails = async () => {
      setLoadingDryerDetails(true);
      setDryerError(null);
      try {
        const result = await structureAPI.dryers.get(selectedDryer);
        
        // Handle different response structures
        const dryerData = result?.data || result;
        setDryerDetails(dryerData);
        
        if (!dryerData) {
          setDryerError("No dryer data returned");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Error fetching dryer details:", errorMsg);
        setDryerError(errorMsg);
        setDryerDetails(null);
      } finally {
        setLoadingDryerDetails(false);
      }
    };

    fetchDryerDetails();
  }, [selectedDryer]);



  const handleThresholdChange = (id: string, field: keyof ThresholdRule, value: any) => {
    setPolicy((prev) => ({
      ...prev,
      thresholds: prev.thresholds.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  };

  const handleAddThreshold = () => {
    const newThreshold: ThresholdRule = {
      id: `t${policy.thresholds.length + 1}`,
      sensor: "temperature",
      condition: "above",
      value: 70,
      action: "Turn on exhaust fan",
      enabled: true,
    };
    setPolicy((prev) => ({
      ...prev,
      thresholds: [...prev.thresholds, newThreshold],
    }));
  };

  const handleDeleteThreshold = (id: string) => {
    setPolicy((prev) => ({
      ...prev,
      thresholds: prev.thresholds.filter((t) => t.id !== id),
    }));
  };

  const handleScheduleChange = (id: string, field: keyof TimeSchedule, value: any) => {
    setPolicy((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleAddSchedule = () => {
    const newSchedule: TimeSchedule = {
      id: `s${policy.schedules.length + 1}`,
      name: `Schedule ${policy.schedules.length + 1}`,
      startTime: "08:00",
      endTime: "20:00",
      active: true,
    };
    setPolicy((prev) => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule],
    }));
  };

  const handleDeleteSchedule = (id: string) => {
    setPolicy((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== id),
    }));
  };

  const handleSave = () => {
    // persist current policy to localStorage keyed by fruitType
    try {
      const raw = localStorage.getItem("policies") || "{}";
      const parsed = JSON.parse(raw);
      if (policy && policy.fruitType) {
        parsed[policy.fruitType] = policy;
        localStorage.setItem("policies", JSON.stringify(parsed));
      }
    } catch (e) {}

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Derived values from API data
  const dryerControls = dryerDetails?.controls ?? [];
  const dryerSensors = dryerDetails?.sensors ?? [];
  const isMachineRunning = dryerDetails?.status === "Running";

  const handleToggleAutomationRule = (ruleId: string) => {
    setPolicy((prev) => {
      const isSelected = prev.automationRules.includes(ruleId);
      return {
        ...prev,
        automationRules: isSelected
          ? prev.automationRules.filter((id) => id !== ruleId)
          : [...prev.automationRules, ruleId],
      };
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-screen-xl mx-auto space-y-5">
        {/* Page Header */}
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1.25rem" }}>
            System Settings & Administration
          </h1>
          <p className="text-slate-400" style={{ fontSize: "0.8rem" }}>
            Manage factory parameters, device configuration, control policies, RBAC, automation rules, and system settings
          </p>
        </div>


        {/* Control Policy Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <SettingsIcon size={16} className="text-slate-500" />
                  <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "1rem" }}>
                    Control Policy Configuration
                  </h2>
                </div>
                <p className="text-slate-500 mt-1" style={{ fontSize: "0.75rem" }}>
                  Define control modes and automation rules for each fruit type
                </p>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                {saved ? "Saved!" : "Save Settings"}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Factory Selection */}
            <div>
              <label className="text-slate-700 mb-2 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                Select Factory
              </label>
              {loadingFactories ? (
                <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: "0.8125rem" }}>
                  <Loader2 size={14} className="animate-spin" />
                  Loading factories...
                </div>
              ) : (
                <select
                  value={selectedFactory || ""}
                  onChange={(e) => {
                    setSelectedFactory(Number(e.target.value) || null);
                    setSelectedArea(null);
                    setSelectedDryer(null);
                    setSelectedFruit("");
                  }}
                  className="w-full md:w-96 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                >
                  <option value="">Select a factory</option>
                  {factories.map((factory) => (
                    <option key={factory.fac_id} value={factory.fac_id}>
                      {factory.fac_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Area Selection */}
            {selectedFactory && (
              <div>
                <label className="text-slate-700 mb-2 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  Select Area/Zone
                </label>
                {loadingAreas ? (
                  <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: "0.8125rem" }}>
                    <Loader2 size={14} className="animate-spin" />
                    Loading areas...
                  </div>
                ) : (
                  <select
                    value={selectedArea || ""}
                    onChange={(e) => {
                      setSelectedArea(Number(e.target.value) || null);
                      setSelectedDryer(null);
                      setSelectedFruit("");
                    }}
                    className="w-full md:w-96 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                  >
                    <option value="">Select an area</option>
                    {areas.map((area) => (
                      <option key={area.area_id} value={area.area_id}>
                        {area.area_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Dryer Selection */}
            {selectedArea && (
              <div>
                <label className="text-slate-700 mb-2 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  Select Dryer Machine
                </label>
                {loadingDryers ? (
                  <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: "0.8125rem" }}>
                    <Loader2 size={14} className="animate-spin" />
                    Loading dryers...
                  </div>
                ) : (
                  <select
                    value={selectedDryer || ""}
                    onChange={(e) => {
                      setSelectedDryer(Number(e.target.value) || null);
                      setSelectedFruit("");
                    }}
                    className="w-full md:w-96 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                  >
                    <option value="">Select a dryer</option>
                    {dryers.map((dryer) => (
                      <option key={dryer.dry_id} value={dryer.dry_id}>
                        {dryer.dry_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}


            {/* Threshold-based Configuration */}
            {selectedDryer && (
              <>
                <div className="space-y-3">

                  {/* Dryer Details Section */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={15} className="text-slate-500" />
                      <label className="text-slate-700" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                        Available Controls
                      </label>
                    </div>
                    {loadingDryerDetails ? (
                      <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: "0.8125rem" }}>
                        <Loader2 size={14} className="animate-spin" />
                        Loading dryer details...
                      </div>
                    ) : dryerError ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{dryerError}</p>
                      </div>
                    ) : dryerDetails ? (
                      <div className="space-y-3">
                        
                        {/* Controls */}
                        {dryerControls.length > 0 && (
                          <div>
                            <p className="text-slate-600 text-sm font-semibold mb-2">Control Devices:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {dryerControls.map((control: any) => (
                                <div
                                  key={control.control_id}
                                  className="p-2 bg-white border border-emerald-100 rounded-lg"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  <p className="font-semibold text-emerald-700">{control.control_name}</p>
                                  <p className="text-slate-500 text-xs">
                                    {control.control_type} • {control.status}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!dryerDetails?.sensors && !dryerDetails?.controls && (
                          <p className="text-slate-500 text-sm text-center py-4">No sensors or controls available</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No dryer details available</p>
                    )}
                  </div>
                      {/* Sensors */}
                        {dryerSensors.length > 0 && (
                          <div>
                            <p className="text-slate-600 text-sm font-semibold mb-2">Sensors:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {dryerSensors.map((sensor: any) => (
                                <div
                                  key={sensor.sensor_id}
                                  className="p-2 bg-white border border-blue-100 rounded-lg"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  <p className="font-semibold text-blue-700 capitalize">
                                    {sensor.sensor_type}
                                  </p>
                                  <p className="text-slate-500 text-xs">
                                    Threshold: {sensor.threshold}, Last: {sensor.last_value ?? "N/A"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      Sensor Thresholds
                    </label>
                  </div>
                  {dryerSensors.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <Target size={32} className="mx-auto mb-2 opacity-30" />
                      <p style={{ fontSize: "0.78rem" }}>No sensors configured</p>
                      <p style={{ fontSize: "0.72rem", marginTop: "4px" }}>Add sensor to automate machine control</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dryerSensors.map((sensor: any) => (
                        <div
                          key={sensor.sensor_id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                               "border-slate-200 bg-white"
                          }`}
                        >              

                          {/* Sensor Select */}
                          <div className="w-24 text-l font-bold">
                            {sensor.sensor_type.charAt(0).toUpperCase() + sensor.sensor_type.slice(1)}
                          </div>
                          {/* Condition Select */}
                          <select
                            value={sensor.condition}
                            onChange={(e) => handleThresholdChange(sensor.sensor_id, "condition", e.target.value)}
                            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
                            style={{ fontSize: "0.78rem" }}
                          >
                            <option value="above">above</option>
                            <option value="below">below</option>
                          </select>

                          {/* Value Input */}
                          <input
                            type="number"
                            value={sensor.threshold}
                            onChange={(e) => handleThresholdChange(sensor.sensor_id, "value", Number(e.target.value))}
                            className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ fontSize: "0.78rem", fontWeight: 700 }}
                          />

                          <ArrowRight size={14} className="text-slate-300 shrink-0" />

                          {/* Action Input */}
                          <input
                            type="text"
                            value={sensor.action}
                            onChange={(e) => handleThresholdChange(sensor.sensor_id, "action", e.target.value)}
                            placeholder="Action..."
                            className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
                            style={{ fontSize: "0.78rem" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Light Sensor Configuration */}
                  {dryerSensors.some((sensor: any) => sensor.sensor_type === "light") && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Sun size={15} className="text-yellow-500" />
                        <label className="text-slate-700" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                          Light Sensor Configuration
                        </label>
                      </div>

                      {(() => {
                        const lightSensor = dryerSensors.find((s: any) => s.sensor_type === "light");
                        if (!lightSensor) return null;

                        return (
                          <div className="space-y-4">
                            {/* Current Light Reading */}
                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-slate-600 text-sm font-semibold">Current Light Level</p>
                                  <p className="text-slate-500 text-xs mt-1">Last updated: {lightSensor.updated_at ? new Date(lightSensor.updated_at).toLocaleTimeString() : "N/A"}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-3xl font-bold text-yellow-600">{lightSensor.last_value ?? "N/A"}</p>
                                  <p className="text-xs text-slate-500">lux</p>
                                </div>
                              </div>
                            </div>

                            {/* Light Threshold Settings */}
                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                              <div>
                                <label className="text-slate-700 text-sm font-semibold block mb-2">
                                  Threshold Value (lux)
                                </label>
                                <input
                                  type="number"
                                  defaultValue={lightSensor.threshold ?? 0}
                                  placeholder="e.g., 500"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-yellow-500"
                                  style={{ fontSize: "0.8125rem" }}
                                />
                                <p className="text-slate-500 text-xs mt-2">Set the light intensity threshold for automated control</p>
                              </div>

                              <div>
                                <label className="text-slate-700 text-sm font-semibold block mb-2">
                                  Trigger Condition
                                </label>
                                <select
                                  defaultValue={lightSensor.condition || "above"}
                                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-yellow-500"
                                  style={{ fontSize: "0.8125rem" }}
                                >
                                  <option value="above">When light is ABOVE threshold</option>
                                  <option value="below">When light is BELOW threshold</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-slate-700 text-sm font-semibold block mb-2">
                                  Control Action
                                </label>
                                <select
                                  defaultValue=""
                                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-yellow-500"
                                  style={{ fontSize: "0.8125rem" }}
                                >
                                  <option value="">Select action...</option>
                                  <option value="turn_on_lamp">Turn on lamp</option>
                                  <option value="turn_off_lamp">Turn off lamp</option>
                                  <option value="dim_lamp">Dim lamp</option>
                                  <option value="increase_ventilation">Increase ventilation</option>
                                  <option value="alert">Send alert</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <input
                                  type="checkbox"
                                  id="light-enabled"
                                  defaultChecked={lightSensor.threshold_enabled !== false}
                                  className="rounded accent-yellow-500"
                                />
                                <label htmlFor="light-enabled" className="text-sm text-slate-700 cursor-pointer flex-1">
                                  Enable light sensor control
                                </label>
                              </div>
                            </div>

                            {/* Light Sensor Range Info */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                              <p className="text-slate-600 font-semibold text-sm mb-2">Common Light Levels (Reference)</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                <div>Dark room: &lt;50 lux</div>
                                <div>Office: 300-500 lux</div>
                                <div>Bright room: 500-1000 lux</div>
                                <div>Sunlight: &gt;10,000 lux</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </div>

        {/* Policy Application Info */}
        {selectedDryer && selectedFruit && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <SettingsIcon size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-blue-900" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                  Policy Application
                </h3>
                <p className="text-blue-700 mt-1" style={{ fontSize: "0.75rem" }}>
                  This policy will be applied to dryer <strong>{dryers.find((d) => d.dry_id === selectedDryer)?.dry_name || "..."}</strong>
                  {selectedArea ? (
                    <>
                      {" "}in area <strong>{areas.find((a) => a.area_id === selectedArea)?.area_name}</strong>
                    </>
                  ) : null}
                  {selectedFactory ? (
                    <>
                      {" "}at factory <strong>{factories.find((f) => f.fac_id === selectedFactory)?.fac_name}</strong>
                    </>
                  ) : null}
                  {" "}for fruit <strong>{fruits.find((f) => String(f.fruit_id) === selectedFruit)?.fruit_name || "..."}</strong>
                  {policy.controlMode === "automations_recipe" ? (
                    <>
                      {" "}using recipe <strong>{recipes?.find((r) => String(r.recipe_id) === String(selectedRecipe || policy.selectedRecipeId))?.recipe_name}</strong>
                    </>
                  ) : null}
                  {policy.automationRules.length > 0 ? (
                    <>
                      {" "}with automation rules <strong>{policy.automationRules.map((id) => automationRuleOptions.find((r) => r.id === id)?.name || id).join(", ")}</strong>
                    </>
                  ) : null}
                  .
                  The control mode and automation rules can also be linked to specific drying batches for fine-grained control.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
