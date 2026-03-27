import { useState } from "react";
import { Wind, Thermometer, Droplets, Timer, Hand, Gauge, CheckCircle2, Plus, Trash2, Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const kpiCards = [
	{
		title: "Active Batches",
		value: "12",
		note: "4 batches finishing in < 2h",
		icon: Wind,
	},
	{
		title: "Avg Chamber Temp",
		value: "61.5 C",
		note: "Target range: 58 - 65 C",
		icon: Thermometer,
	},
	{
		title: "Avg Humidity",
		value: "42%",
		note: "Within configured threshold",
		icon: Droplets,
	},
	{
		title: "Cycle Duration",
		value: "11.8 h",
		note: "-0.6 h vs last 7 days",
		icon: Timer,
	},
];

const machines = [
	{ id: "M04", name: "Dryer A1", zone: "Zone A" },
	{ id: "dryer-a2", name: "Dryer A2", zone: "Zone A" },
	{ id: "dryer-a3", name: "Dryer A3", zone: "Zone A" },
	{ id: "dryer-b1", name: "Dryer B1", zone: "Zone B" },
	{ id: "dryer-b2", name: "Dryer B2", zone: "Zone B" },
	{ id: "dryer-b3", name: "Dryer B3", zone: "Zone B" },
];

const fruitTypes = [
	{ id: "mango", name: "Mango" },
	{ id: "banana", name: "Banana" },
	{ id: "pineapple", name: "Pineapple" },
	{ id: "papaya", name: "Papaya" },
	{ id: "guava", name: "Guava" },
	{ id: "orange", name: "Orange" },
	{ id: "lemon", name: "Lemon" },
	{ id: "grapefruit", name: "Grapefruit" },
	{ id: "lime", name: "Lime" },
	{ id: "mandarin", name: "Mandarin" },
];

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

interface PolicyConfig {
	fruitType: string;
	controlMode: ControlMode;
	automationRules: string[];
	selectedRecipeId: string;
	thresholds: ThresholdRule[];
}

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
	},
	banana: {
		fruitType: "banana",
		controlMode: "threshold",
		automationRules: ["safe-temp-limit", "off-hour-energy-saver"],
		selectedRecipeId: "banana-standard",
		thresholds: [],
	},
	pineapple: {
		fruitType: "pineapple",
		controlMode: "threshold",
		automationRules: ["safe-temp-limit"],
		selectedRecipeId: "pineapple-standard",
		thresholds: [
			{ id: "t1", sensor: "temperature", condition: "above", value: 75, action: "Activate cooling", enabled: true },
		],
	},
};

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
	],
};

const controlModeConfig: Record<ControlMode, { label: string; desc: string; icon: React.ReactNode }> = {
	manual: {
		label: "Manual",
		desc: "Operator controls the drying process manually.",
		icon: <Hand size={14} />,
	},
	threshold: {
		label: "Threshold-based",
		desc: "System reacts to sensor thresholds automatically.",
		icon: <Gauge size={14} />,
	},
	automations_recipe: {
		label: "Automation Recipe",
		desc: "Run predefined recipe steps for each fruit.",
		icon: <Timer size={14} />,
	},
};

export function DryingManagement() {
	const navigate = useNavigate();
	const [selectedMachineId, setSelectedMachineId] = useState("");
	const [selectedFruit, setSelectedFruit] = useState("");
	const [policy, setPolicy] = useState<PolicyConfig>({
		fruitType: "",
		controlMode: "manual",
		automationRules: [],
		selectedRecipeId: "",
		thresholds: [],
	});

	const selectedMachine = machines.find((machine) => machine.id === selectedMachineId);
	const selectedFruitData = fruitTypes.find((fruit) => fruit.id === selectedFruit);
	const canSelectControlMode = Boolean(selectedMachine && selectedFruit);
	const availableDryingRecipes = selectedFruit ? dryingRecipesByFruit[selectedFruit] || [] : [];
	const selectedDryingRecipe = availableDryingRecipes.find((recipe) => recipe.id === policy.selectedRecipeId)
		|| availableDryingRecipes[0];

	const handleMachineClick = (machineId: string) => {
		setSelectedMachineId(machineId);
		setSelectedFruit("");
		setPolicy({
			fruitType: "",
			controlMode: "manual",
			automationRules: [],
			selectedRecipeId: "",
			thresholds: [],
		});
	};

	const handleFruitChange = (fruitId: string) => {
		const firstRecipeId = dryingRecipesByFruit[fruitId]?.[0]?.id || "";
		setSelectedFruit(fruitId);
		setPolicy(defaultPolicies[fruitId] || {
			fruitType: fruitId,
			controlMode: "manual",
			automationRules: [],
			selectedRecipeId: firstRecipeId,
			thresholds: [],
		});
	};

	const handleThresholdChange = (id: string, field: keyof ThresholdRule, value: string | number | boolean) => {
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

	const handleGoToAutomationRules = () => {
		navigate("/automation");
	};

	return (
		<main className="flex-1 overflow-auto p-6 space-y-6">
			<section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				{kpiCards.map((card) => (
					<article
						key={card.title}
						className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm"
					>
						<div className="flex items-center justify-between mb-2">
							<p className="text-slate-500" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
								{card.title}
							</p>
							<card.icon size={16} className="text-emerald-600" />
						</div>
						<p className="text-slate-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
							{card.value}
						</p>
						<p className="text-slate-400 mt-1" style={{ fontSize: "0.75rem" }}>
							{card.note}
						</p>
					</article>
				))}
			</section>

			<section className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
				<div className="flex items-center justify-between gap-3">
					<h2 className="text-slate-800" style={{ fontSize: "1rem", fontWeight: 700 }}>
					Drying Overview
					</h2>
					<span
						className="px-2.5 py-1 rounded-full bg-red-100 text-red-700"
						style={{ fontSize: "0.75rem", fontWeight: 600 }}
					>
						All Machines: Power Off
					</span>
				</div>

				<div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
					{machines.map((machine) => (
						<button
							key={machine.id}
							onClick={() => handleMachineClick(machine.id)}
							className={`rounded-lg border px-4 py-3 text-left transition-all ${
								selectedMachineId === machine.id
									? "border-emerald-300 bg-emerald-50"
									: "border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/40"
							}`}
						>
							<div className="flex items-center justify-between gap-2">
								<p className="text-slate-800" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
									{machine.name}
								</p>
								<span
									className="px-2 py-0.5 rounded-full bg-red-100 text-red-700"
									style={{ fontSize: "0.7rem", fontWeight: 700 }}
								>
									Power Off
								</span>
							</div>
							<p className="text-slate-500 mt-1" style={{ fontSize: "0.75rem" }}>
								{machine.zone} • ID: {machine.id}
							</p>
							<p className="text-emerald-700 mt-1" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
								Click to configure fruit and action type
							</p>
						</button>
					))}
				</div>

				{selectedMachine && (
					<div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
						<div>
							<p className="text-slate-800" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
								Settings for {selectedMachine.name}
							</p>
							<p className="text-slate-500" style={{ fontSize: "0.75rem" }}>
								Choose fruit first, then select action type.
							</p>
						</div>

						<div>
							<label className="block text-slate-700 mb-1" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
								Fruit Type
							</label>
							<select
								value={selectedFruit}
								onChange={(e) => handleFruitChange(e.target.value)}
								className="w-full md:w-72 px-3 py-2 border border-slate-300 rounded-md text-slate-700 bg-white"
							>
								<option value="">Select fruit</option>
								{fruitTypes.map((fruit) => (
									<option key={fruit.id} value={fruit.id}>
										{fruit.name}
									</option>
								))}
							</select>
						</div>

						{selectedFruit && (
							<div className="space-y-3">
								<p className="text-slate-700 mb-2" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
									Action Type
								</p>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
									{(["manual", "threshold", "automations_recipe"] as ControlMode[]).map((mode) => {
										const modeConfig = controlModeConfig[mode];
										const isActive = policy.controlMode === mode;

										return (
											<button
												key={mode}
												onClick={() =>
													setPolicy((prev) => ({
														...prev,
														controlMode: mode,
													}))
												}
												className={`rounded-md border p-3 text-left transition-all ${
													isActive
														? "border-emerald-300 bg-white"
														: "border-slate-200 bg-white/70 hover:border-emerald-200"
												}`}
											>
												<div className="flex items-center gap-2 text-slate-700" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
													{modeConfig.icon}
													{modeConfig.label}
												</div>
												<p className="text-slate-500 mt-1" style={{ fontSize: "0.72rem" }}>
													{modeConfig.desc}
												</p>
											</button>
										);
									})}
								</div>

								{policy.controlMode === "automations_recipe" && (
									<div className="mt-4 space-y-2">
										<div className="flex items-center justify-between gap-2">
											<label className="text-slate-700 block" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
												Automation Recipe
											</label>
											<button
												onClick={handleGoToAutomationRules}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
												style={{ fontSize: "0.75rem", fontWeight: 600 }}
											>
												<Plus size={12} />
												Change recipe details   
											</button>
										</div>
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

															<select
																value={threshold.condition}
																onChange={(e) => handleThresholdChange(threshold.id, "condition", e.target.value)}
																className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
																style={{ fontSize: "0.78rem" }}
															>
																<option value="above">above</option>
																<option value="below">below</option>
															</select>

															<input
																type="number"
																value={threshold.value}
																onChange={(e) => handleThresholdChange(threshold.id, "value", Number(e.target.value))}
																className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-right"
																style={{ fontSize: "0.78rem", fontWeight: 700 }}
															/>

															<ArrowRight size={14} className="text-slate-300 shrink-0" />

															<input
																type="text"
																value={threshold.action}
																onChange={(e) => handleThresholdChange(threshold.id, "action", e.target.value)}
																placeholder="Action..."
																className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
																style={{ fontSize: "0.78rem" }}
															/>

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

								<div className="mt-3 flex items-center gap-2 text-emerald-700" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
									<CheckCircle2 size={15} />
									<span>
										{selectedMachine.name} • {selectedFruitData?.name} • {controlModeConfig[policy.controlMode].label}
									</span>
								</div>
							</div>
						)}
					</div>
				)}
			</section>
		</main>
	);
}
