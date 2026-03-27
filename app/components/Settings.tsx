import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Hand,
  Gauge,
  Clock,
  Target,
  Calendar,
  ArrowRight,
  Apple,
  Timer,
} from "lucide-react";
type ControlMode = "manual" | "threshold"  | "automations_recipe";

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

const fruitTypes = [
  { id: "mango", name: "Mango", category: "tropical" },
  { id: "banana", name: "Banana", category: "tropical" },
  { id: "pineapple", name: "Pineapple", category: "tropical" },
  { id: "papaya", name: "Papaya", category: "tropical" },
  { id: "guava", name: "Guava", category: "tropical" },
  { id: "orange", name: "Orange", category: "citrus" },
  { id: "lemon", name: "Lemon", category: "citrus" },
  { id: "grapefruit", name: "Grapefruit", category: "citrus" },
  { id: "lime", name: "Lime", category: "citrus" },
  { id: "mandarin", name: "Mandarin", category: "citrus" },
];

const factoryZones = [
  { id: "zone-a", name: "Zone A " },
  { id: "zone-b", name: "Zone B " },
];

const machinesByZone: Record<string, { id: string; name: string }[]> = {
  "zone-a": [
    { id: "M04", name: "Dryer A1" },
    { id: "dryer-a2", name: "Dryer A2" },
    { id: "dryer-a3", name: "Dryer A3" },
  ],
  "zone-b": [
    { id: "dryer-b1", name: "Dryer B1" },
    { id: "dryer-b2", name: "Dryer B2" },
    { id: "dryer-b3", name: "Dryer B3" },
  ],
};

const defaultPolicies: Record<string, PolicyConfig> = {
  mango: {
    fruitType: "mango",
    controlMode: "threshold",
    automationRules: ["safe-temp-limit", "humidity-balance"],
    selectedRecipeId: "mango-standard",
    thresholds: [
      { id: "t1", sensor: "temperature", condition: "above", value: 70, action: "Turn on exhaust fan", enabled: true },
      { id: "t2", sensor: "humidity", condition: "below", value: 35, action: "Reduce heater power", enabled: true },
    ],
    schedules: [
      { id: "s1", name: "Day Mode", startTime: "06:00", endTime: "18:00", active: true },
      { id: "s2", name: "Night Mode", startTime: "18:00", endTime: "06:00", active: true },
    ],
  },
  banana: {
    fruitType: "banana",
    controlMode: "threshold",
    automationRules: ["safe-temp-limit", "off-hour-energy-saver"],
    selectedRecipeId: "banana-standard",
    thresholds: [],
    schedules: [
      { id: "s1", name: "Active Period", startTime: "07:00", endTime: "19:00", active: true },
    ],
  },
  pineapple: {
    fruitType: "pineapple",
    controlMode: "threshold",
    automationRules: ["safe-temp-limit"],
    selectedRecipeId: "pineapple-standard",
    thresholds: [
      { id: "t1", sensor: "temperature", condition: "above", value: 75, action: "Activate cooling", enabled: true },
    ],
    schedules: [],
  },
};

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

const dryingRecipesByFruit: Record<string, DryingRecipe[]> = {
  mango: [
    {
      id: "mango-standard",
      name: "Mango Standard",
      phases: [
        { id: "p1", name: "Pre-drying", temperature: 55, humidity: 60, duration: 2 },
        { id: "p2", name: "Main Drying", temperature: 65, humidity: 45, duration: 8 },
        { id: "p3", name: "Final Drying", temperature: 60, humidity: 30, duration: 4 },
      ],
      totalTime: 14,
    },
    {
      id: "mango-fast",
      name: "Mango Fast Dry",
      phases: [
        { id: "p1", name: "Pre-drying", temperature: 58, humidity: 58, duration: 1.5 },
        { id: "p2", name: "Main Drying", temperature: 68, humidity: 42, duration: 6 },
        { id: "p3", name: "Final Drying", temperature: 62, humidity: 28, duration: 3 },
      ],
      totalTime: 10.5,
    },
  ],
  banana: [
    {
      id: "banana-standard",
      name: "Banana Standard",
      phases: [
        { id: "p1", name: "Initial Drying", temperature: 50, humidity: 55, duration: 3 },
        { id: "p2", name: "Core Drying", temperature: 60, humidity: 40, duration: 6 },
        { id: "p3", name: "Finishing", temperature: 55, humidity: 25, duration: 3 },
      ],
      totalTime: 12,
    },
    {
      id: "banana-gentle",
      name: "Banana Gentle Preserve",
      phases: [
        { id: "p1", name: "Warm-up", temperature: 48, humidity: 58, duration: 2.5 },
        { id: "p2", name: "Slow Drying", temperature: 56, humidity: 45, duration: 8 },
        { id: "p3", name: "Finishing", temperature: 52, humidity: 32, duration: 2.5 },
      ],
      totalTime: 13,
    },
  ],
  pineapple: [
    {
      id: "pineapple-standard",
      name: "Pineapple Standard",
      phases: [
        { id: "p1", name: "Pre-drying", temperature: 60, humidity: 65, duration: 2 },
        { id: "p2", name: "Main Drying", temperature: 70, humidity: 50, duration: 10 },
        { id: "p3", name: "Final Drying", temperature: 65, humidity: 35, duration: 4 },
      ],
      totalTime: 16,
    },
    {
      id: "pineapple-energy-save",
      name: "Pineapple Energy Saver",
      phases: [
        { id: "p1", name: "Pre-drying", temperature: 58, humidity: 66, duration: 2.5 },
        { id: "p2", name: "Main Drying", temperature: 66, humidity: 52, duration: 11 },
        { id: "p3", name: "Final Drying", temperature: 62, humidity: 38, duration: 4 },
      ],
      totalTime: 17.5,
    },
  ],
};

export function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFruit, setSelectedFruit] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [policy, setPolicy] = useState<PolicyConfig>({
    fruitType: "",
    controlMode: "manual",
    automationRules: [],
    selectedRecipeId: "",
    thresholds: [],
    schedules: [],
  });
  const [saved, setSaved] = useState(false);

  const zoneIdToPathValue: Record<string, string> = {
    "zone-a": "a",
    "zone-b": "b",
  };

  const pathValueToZoneId: Record<string, string> = {
    a: "zone-a",
    b: "zone-b",
  };

  useEffect(() => {
    const match = location.pathname.match(/^\/settings\/zone=(.+?)(?:\/machine=(.+))?$/);

    if (!match) {
      if (selectedZone || selectedMachine) {
        setSelectedZone("");
        setSelectedMachine("");
        setSelectedFruit("");
      }
      return;
    }

    const normalizedZonePathValue = decodeURIComponent(match[1]).replaceAll('"', "");
    const normalizedMachinePathValue = decodeURIComponent(match[2] || "").replaceAll('"', "");

    const zoneId = pathValueToZoneId[normalizedZonePathValue] || "";
    const machinesInZone = zoneId ? machinesByZone[zoneId] || [] : [];
    const hasMachineInZone = machinesInZone.some((machine) => machine.id === normalizedMachinePathValue);
    const machineId = hasMachineInZone ? normalizedMachinePathValue : "";

    if (zoneId !== selectedZone) {
      setSelectedZone(zoneId);
      setSelectedFruit("");
    }

    if (machineId !== selectedMachine) {
      setSelectedMachine(machineId);
      setSelectedFruit("");
    }
  }, [location.pathname, pathValueToZoneId, selectedMachine, selectedZone]);

  const handleFruitChange = (fruitId: string) => {
    const firstRecipeId = dryingRecipesByFruit[fruitId]?.[0]?.id || "";
    setSelectedFruit(fruitId);
    setPolicy(defaultPolicies[fruitId] || {
      fruitType: fruitId,
      controlMode: "manual",
      automationRules: [],
      selectedRecipeId: firstRecipeId,
      thresholds: [],
      schedules: [],
    });
  };

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
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const controlModeConfig = {
    manual: { label: "Manual", icon: <Hand size={14} />, color: "#64748b", desc: "Manually adjust all parameters" },
    threshold: { label: "Threshold-based", icon: <Gauge size={14} />, color: "#f59e0b", desc: "Automatic control based on sensor readings" },
    automations_recipe: { label: "Automation Recipe", icon: <Timer size={14} />, color: "#10b981", desc: "Follow multi-phase drying recipes" },
  };

  const selectedFruitData = fruitTypes.find((f) => f.id === selectedFruit);
  const selectedZoneData = factoryZones.find((zone) => zone.id === selectedZone);
  const machinesInSelectedZone = selectedZone ? machinesByZone[selectedZone] || [] : [];
  const selectedMachineData = machinesInSelectedZone.find((machine) => machine.id === selectedMachine);
  const canSelectFruit = Boolean(selectedMachine);
  const canSelectControlMode = Boolean(selectedMachine && selectedFruit);
  const availableDryingRecipes = selectedFruit ? dryingRecipesByFruit[selectedFruit] || [] : [];
  const selectedDryingRecipe = availableDryingRecipes.find((recipe) => recipe.id === policy.selectedRecipeId)
    || availableDryingRecipes[0];
  const availableAutomationRules = automationRuleOptions.filter((rule) => rule.modes.includes(policy.controlMode));
  const selectedAutomationRules = automationRuleOptions.filter((rule) => policy.automationRules.includes(rule.id));

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
            System Settings
          </h1>
          <p className="text-slate-400" style={{ fontSize: "0.8rem" }}>
            Configure factory parameters, control policies, and automation settings
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

            {/* Zone Selection */}
            <div>
              <label className="text-slate-700 mb-2 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                Select Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => {
                  const zoneId = e.target.value;
                  const zonePathValue = zoneIdToPathValue[zoneId];

                  setSelectedZone(zoneId);
                  setSelectedMachine("");
                  setSelectedFruit("");

                  if (zonePathValue) {
                    navigate(`/settings/zone=\"${zonePathValue}\"`);
                  } else {
                    navigate("/settings");
                  }
                }}
                className="w-full md:w-96 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                <option value="">Select a zone</option>
                {factoryZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>

              {selectedZoneData && (
                <p className="text-slate-400 mt-2" style={{ fontSize: "0.72rem" }}>
                  Apply this policy to: {selectedZoneData.name}
                </p>
              )}
            </div>

            {selectedZone && (
              <div>
                <label className="text-slate-700 mb-2 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  Select Machine
                </label>
                <select
                  value={selectedMachine}
                  onChange={(e) => {
                    const machineId = e.target.value;
                    const zonePathValue = zoneIdToPathValue[selectedZone];

                    setSelectedMachine(machineId);
                    setSelectedFruit("");

                    if (zonePathValue && machineId) {
                      navigate(`/settings/zone=\"${zonePathValue}\"/machine=\"${machineId}\"`);
                    } else if (zonePathValue) {
                      navigate(`/settings/zone=\"${zonePathValue}\"`);
                    } else {
                      navigate("/settings");
                    }
                  }}
                  className="w-full md:w-96 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                >
                  <option value="">Select a machine</option>
                  {machinesInSelectedZone.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="w-full h-px bg-slate-200" />

            {/* Fruit Type Selection */}
            {canSelectFruit && (
              <div>
                <label className="text-slate-700 mb-3 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  Select Fruit Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {fruitTypes.map((fruit) => (
                    <button
                      key={fruit.id}
                      onClick={() => handleFruitChange(fruit.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedFruit === fruit.id
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                      style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                    >
                      <Apple size={14} className={selectedFruit === fruit.id ? "text-emerald-600" : "text-slate-400"} />
                      {fruit.name}
                    </button>
                  ))}
                </div>
                {selectedFruitData && (
                  <p className="text-slate-400 mt-2" style={{ fontSize: "0.72rem" }}>
                    Category: <span className="capitalize">{selectedFruitData.category}</span> Fruit
                  </p>
                )}
              </div>
            )}

            {/* Control Mode Selection */}
            {canSelectControlMode && (
              <div>
                <label className="text-slate-700 mb-3 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  Control Mode
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(["manual", "threshold", "automations_recipe"] as ControlMode[]).map((mode) => {
                    const config = controlModeConfig[mode];
                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          const allowedRuleIds = automationRuleOptions
                            .filter((rule) => rule.modes.includes(mode))
                            .map((rule) => rule.id);

                          setPolicy((prev) => ({
                            ...prev,
                            controlMode: mode,
                            selectedRecipeId: mode === "automations_recipe"
                              ? (prev.selectedRecipeId || availableDryingRecipes[0]?.id || "")
                              : prev.selectedRecipeId,
                            automationRules: prev.automationRules.filter((ruleId) => allowedRuleIds.includes(ruleId)),
                          }));
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          policy.controlMode === mode
                            ? "border-current shadow-sm"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        style={{
                          color: policy.controlMode === mode ? config.color : "#64748b",
                          background: policy.controlMode === mode ? config.color + "10" : "white",
                        }}
                      >
                        <span
                          className="flex items-center justify-center w-10 h-10 rounded-full"
                          style={{
                            background: policy.controlMode === mode ? config.color + "20" : "#f1f5f9",
                            color: config.color,
                          }}
                        >
                          {config.icon}
                        </span>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{config.label}</span>
                        <span
                          className="text-center"
                          style={{
                            fontSize: "0.68rem",
                            color: policy.controlMode === mode ? config.color : "#94a3b8",
                          }}
                        >
                          {config.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>


                {policy.controlMode === "automations_recipe" && (
                  <div className="mt-4 space-y-2">
                    <label className="text-slate-700 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      Automation Recipe
                    </label>
                    {availableDryingRecipes.length > 0 ? (
                      <>
                        <select
                          value={policy.selectedRecipeId || availableDryingRecipes[0].id}
                          onChange={(e) =>
                            setPolicy((prev) => ({
                              ...prev,
                              selectedRecipeId: e.target.value,
                            }))
                          }
                          className="w-full md:w-96 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
                          style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                        >
                          {availableDryingRecipes.map((recipe) => (
                            <option key={recipe.id} value={recipe.id}>
                              {recipe.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-slate-500" style={{ fontSize: "0.72rem" }}>
                          Choose the drying recipe profile that the automation engine should run.
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-400" style={{ fontSize: "0.72rem" }}>
                        No automation recipes available for this fruit yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {canSelectControlMode && policy.controlMode === "automations_recipe" && (
              <>
                <div className="w-full h-px bg-slate-200" />
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Timer size={15} className="text-slate-500" />
                      <label className="text-slate-700" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                        Automation Drying Recipe
                      </label>
                    </div>
                    <p className="text-slate-500 mt-1" style={{ fontSize: "0.72rem" }}>
                      Preview multi-phase drying recipe from automation for the selected fruit.
                    </p>
                  </div>

                  {selectedDryingRecipe ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-slate-700" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                          {selectedDryingRecipe.name}
                        </p>
                        <span className="text-slate-500" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                          Total {selectedDryingRecipe.totalTime}h
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {selectedDryingRecipe.phases.map((phase) => (
                          <div key={phase.id} className="p-3 border border-slate-200 rounded-lg bg-white">
                            <p className="text-slate-700" style={{ fontSize: "0.76rem", fontWeight: 700 }}>
                              {phase.name}
                            </p>
                            <div className="mt-2 space-y-1 text-slate-500" style={{ fontSize: "0.7rem" }}>
                              <p>Temperature: {phase.temperature}°C</p>
                              <p>Humidity: {phase.humidity}%</p>
                              <p>Duration: {phase.duration}h</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p style={{ fontSize: "0.75rem" }}>No drying recipe template for this fruit yet</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Threshold-based Configuration */}
            {canSelectControlMode && policy.controlMode === "threshold" && (
              <>
                <div className="w-full h-px bg-slate-200" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      Sensor Thresholds
                    </label>
                    <button
                      onClick={handleAddThreshold}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      style={{ fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      <Plus size={12} />
                      Add Threshold
                    </button>
                  </div>

                  {policy.thresholds.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <Target size={32} className="mx-auto mb-2 opacity-30" />
                      <p style={{ fontSize: "0.78rem" }}>No thresholds configured</p>
                      <p style={{ fontSize: "0.72rem", marginTop: "4px" }}>Add sensor-based rules to automate machine control</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {policy.thresholds.map((threshold) => (
                        <div
                          key={threshold.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            threshold.enabled
                              ? "border-slate-200 bg-white"
                              : "border-slate-100 bg-slate-50 opacity-60"
                          }`}
                        >
                          {/* Enable Toggle */}
                          <button
                            onClick={() => handleThresholdChange(threshold.id, "enabled", !threshold.enabled)}
                            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                              threshold.enabled ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                threshold.enabled ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>

                          {/* Sensor Select */}
                          <select
                            value={threshold.sensor}
                            onChange={(e) => handleThresholdChange(threshold.id, "sensor", e.target.value)}
                            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
                            style={{ fontSize: "0.78rem", fontWeight: 600 }}
                          >
                            <option value="temperature">Temperature</option>
                            <option value="humidity">Humidity</option>
                            <option value="light">Light</option>
                          </select>

                          {/* Condition Select */}
                          <select
                            value={threshold.condition}
                            onChange={(e) => handleThresholdChange(threshold.id, "condition", e.target.value)}
                            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
                            style={{ fontSize: "0.78rem" }}
                          >
                            <option value="above">above</option>
                            <option value="below">below</option>
                          </select>

                          {/* Value Input */}
                          <input
                            type="number"
                            value={threshold.value}
                            onChange={(e) => handleThresholdChange(threshold.id, "value", Number(e.target.value))}
                            className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-right"
                            style={{ fontSize: "0.78rem", fontWeight: 700 }}
                          />

                          <ArrowRight size={14} className="text-slate-300 shrink-0" />

                          {/* Action Input */}
                          <input
                            type="text"
                            value={threshold.action}
                            onChange={(e) => handleThresholdChange(threshold.id, "action", e.target.value)}
                            placeholder="Action..."
                            className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
                            style={{ fontSize: "0.78rem" }}
                          />

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteThreshold(threshold.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Manual Mode Message */}
            {canSelectControlMode && policy.controlMode === "manual" && (
              <>
                <div className="w-full h-px bg-slate-200" />
                <div className="bg-slate-50 rounded-lg p-6 text-center border border-slate-200">
                  <Hand size={32} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                    Manual Control Mode
                  </p>
                  <p className="text-slate-500 mt-1" style={{ fontSize: "0.75rem" }}>
                    All parameters will be adjusted manually by operators during the drying process
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Policy Application Info */}
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
                This policy will be applied to all machines processing <strong>{selectedFruitData?.name || "..."}</strong>
                {selectedZoneData ? (
                  <>
                    {" "}in <strong>{selectedZoneData.name}</strong>
                  </>
                ) : null}
                {selectedMachineData ? (
                  <>
                    {" "}with machine <strong>{selectedMachineData.name}</strong>
                  </>
                ) : null}
                {selectedDryingRecipe ? (
                  <>
                    {" "}using recipe <strong>{selectedDryingRecipe.name}</strong>
                  </>
                ) : null}
                {selectedAutomationRules.length > 0 ? (
                  <>
                    {" "}with rules <strong>{selectedAutomationRules.map((rule) => rule.name).join(", ")}</strong>
                  </>
                ) : null}
                .
                The control mode and automation rules can also be linked to specific drying batches for fine-grained control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
