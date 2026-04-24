export const initialZoneA = [
  { 
    id: "M01", name: "Dryer M01", zoneID: "a", status: "running", temp: 68, humidity: 42, mode: "auto", isOn: true, fruit: "Mango", runHours: 14, batchCode: "MG-240326-A", dryingStage: "Mid Drying",
    sensors: [
      { id: "S01", name: "Chamber Temperature", type: "temperature", value: "68°C" },
      { id: "S02", name: "Chamber Humidity", type: "humidity", value: "42%" },
      { id: "S03", name: "Door Status", type: "door", value: "Closed" }
    ],
    outputDevices: [
      { id: "F01", name: "Fan 1", type: "fan", status: "on" },
      { id: "F02", name: "Fan 2", type: "fan", status: "on" },
      { id: "L01", name: "Heating Lamp", type: "lamp", status: "on" }
    ]
  },
  { 
    id: "M02", name: "Dryer M02", zoneID: "a", status: "alert", temp: 77, humidity: 38, mode: "auto", isOn: true, fruit: "Banana", runHours: 9, batchCode: "BN-240326-B", dryingStage: "Final Drying",
    sensors: [
      { id: "S04", name: "Chamber Temperature", type: "temperature", value: "77°C" },
      { id: "S05", name: "Chamber Humidity", type: "humidity", value: "38%" },
      { id: "S06", name: "Door Status", type: "door", value: "Closed" }
    ],
    outputDevices: [
      { id: "F03", name: "Fan 1", type: "fan", status: "on" },
      { id: "L02", name: "Heating Lamp", type: "lamp", status: "on" }
    ]
  },
  { 
    id: "M03", name: "Dryer M03", zoneID: "a", status: "running", temp: 64, humidity: 45, mode: "manual", isOn: true, fruit: "Pineapple", runHours: 6, batchCode: "PN-240326-A", dryingStage: "Ramp-up",
    sensors: [
      { id: "S07", name: "Chamber Temperature", type: "temperature", value: "64°C" },
      { id: "S08", name: "Chamber Humidity", type: "humidity", value: "45%" },
      { id: "S09", name: "Door Status", type: "door", value: "Closed" }
    ],
    outputDevices: [
      { id: "F04", name: "Fan 1", type: "fan", status: "on" },
      { id: "L03", name: "Heating Lamp", type: "lamp", status: "off" }
    ]
  },
  { 
    id: "M04", name: "Dryer M04", zoneID: "a", status: "offline", temp: 24, humidity: 61, mode: "manual", isOn: false, fruit: "Papaya", runHours: 0, batchCode: "PP-240325-A", dryingStage: "Maintenance",
    sensors: [
      { id: "S10", name: "Chamber Temperature", type: "temperature", value: "24°C" },
      { id: "S11", name: "Chamber Humidity", type: "humidity", value: "61%" },
      { id: "S12", name: "Door Status", type: "door", value: "Open" }
    ],
    outputDevices: [
      { id: "F05", name: "Fan 1", type: "fan", status: "off" },
      { id: "L04", name: "Heating Lamp", type: "lamp", status: "off" }
    ]
  }
];

export const initialZoneB = [
  { 
    id: "M07", name: "Dryer M07", zoneID: "b", status: "running", temp: 65, humidity: 43, mode: "auto", isOn: true, fruit: "Orange", runHours: 8, batchCode: "OR-240326-A", dryingStage: "Pre-heating",
    sensors: [
      { id: "S13", name: "Chamber Temperature", type: "temperature", value: "65°C" },
      { id: "S14", name: "Chamber Humidity", type: "humidity", value: "43%" },
      { id: "S15", name: "Door Status", type: "door", value: "Closed" }
    ],
    outputDevices: [
      { id: "F06", name: "Fan 1", type: "fan", status: "on" },
      { id: "L05", name: "Heating Lamp", type: "lamp", status: "on" }
    ]
  },
  { 
    id: "M08", name: "Dryer M08", zoneID: "b", status: "running", temp: 67, humidity: 41, mode: "manual", isOn: true, fruit: "Lemon", runHours: 12, batchCode: "LM-240326-A", dryingStage: "Mid Drying",
    sensors: [
      { id: "S16", name: "Chamber Temperature", type: "temperature", value: "67°C" },
      { id: "S17", name: "Chamber Humidity", type: "humidity", value: "41%" },
      { id: "S18", name: "Door Status", type: "door", value: "Closed" }
    ],
    outputDevices: [
      { id: "F07", name: "Fan 1", type: "fan", status: "on" },
      { id: "F08", name: "Fan 2", type: "fan", status: "off" },
      { id: "L06", name: "Heating Lamp", type: "lamp", status: "on" }
    ]
  },
  { 
    id: "M09", name: "Dryer M09", zoneID: "b", status: "alert", temp: 78, humidity: 35, mode: "auto", isOn: true, fruit: "Grapefruit", runHours: 7, batchCode: "GF-240326-B", dryingStage: "Final Drying",
    sensors: [
      { id: "S19", name: "Chamber Temperature", type: "temperature", value: "78°C" },
      { id: "S20", name: "Chamber Humidity", type: "humidity", value: "35%" },
      { id: "S21", name: "Door Status", type: "door", value: "Closed" }
    ],
    outputDevices: [
      { id: "F09", name: "Fan 1", type: "fan", status: "on" },
      { id: "L07", name: "Heating Lamp", type: "lamp", status: "on" }
    ]
  },
  { 
    id: "M10", name: "Dryer M10", zoneID: "b", status: "offline", temp: 24, humidity: 63, mode: "manual", isOn: false, fruit: "Lime", runHours: 0, batchCode: "LI-240325-B", dryingStage: "Maintenance",
    sensors: [
      { id: "S22", name: "Chamber Temperature", type: "temperature", value: "24°C" },
      { id: "S23", name: "Chamber Humidity", type: "humidity", value: "63%" },
      { id: "S24", name: "Door Status", type: "door", value: "Open" }
    ],
    outputDevices: [
      { id: "F10", name: "Fan 1", type: "fan", status: "off" },
      { id: "L08", name: "Heating Lamp", type: "lamp", status: "off" }
    ]
  },
  { 
    id: "M11", name: "Dryer M11", zoneID: "b", status: "running", temp: 69, humidity: 44, mode: "auto", isOn: true, fruit: "Orange", runHours: 5, batchCode: "OR-240326-C", dryingStage: "Ramp-up",
    sensors: [
      { id: "S25", name: "Chamber Temperature", type: "temperature", value: "69°C" },
      { id: "S26", name: "Chamber Humidity", type: "humidity", value: "44%" },
      { id: "S27", name: "Door Status", type: "door", value: "Closed" }
    ],
    outputDevices: [
      { id: "F11", name: "Fan 1", type: "fan", status: "on" },
      { id: "F12", name: "Fan 2", type: "fan", status: "on" },
      { id: "L09", name: "Heating Lamp", type: "lamp", status: "on" }
    ]
  },
  { 
    id: "M12", name: "Dryer M12", zoneID: "b", status: "running", temp: 66, humidity: 47, mode: "auto", isOn: true, fruit: "Mandarin", runHours: 10, batchCode: "MD-240326-A", dryingStage: "Conditioning",
    sensors: [
      { id: "S28", name: "Chamber Temperature", type: "temperature", value: "66°C" },
      { id: "S29", name: "Chamber Humidity", type: "humidity", value: "47%" },
      { id: "S30", name: "Door Status", type: "door", value: "Closed" }
    ],
    outputDevices: [
      { id: "F13", name: "Fan 1", type: "fan", status: "on" },
      { id: "L10", name: "Heating Lamp", type: "lamp", status: "off" }
    ]
  }
];
