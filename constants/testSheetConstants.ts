/**
 * Constants for Test Sheet Form
 */

export const VEHICLE_MAKES = [
    "Mercedes Benz",
    "Ford",
    "GMC",
    "Chevrolet",
    "Volvo",
    "Scania",
    "MAN",
    "DAF",
    "Iveco",
    "Freightliner",
    "Peterbilt",
    "Kenworth",
    "Mack",
    "International",
] as const;

export const VEHICLE_VOLTAGES = ["12V", "24V"] as const;

export const FORM_TYPES = [
    "Test Sheet",
    "Test Sheet (Stock/Repair)",
    "Test Sheet (Pump/Plant)",
] as const;

export const INSTRUCTIONS = [
    "Installation",
    "Repair",
    "Inspection",
    "Breakdown",
] as const;

export const CUSTOMERS = [
    "Anglo American",
    "Assmang",
    "Caliber",
    "Columbus Stainless (Pty)Ltd",
    "DIG",
    "Emalahleni Water Treatment Plant",
    "Epiroc",
    "Exxaro",
    "First Quantum Minerals",
    "Glencore",
    "Glosam Mine",
    "Goedehoop",
    "Greenside",
    "Inceku",
    "Inmine",
    "Isambane Mining",
    "Isibonelo",
    "Khwezela",
    "KleenOil",
    "KSMM Trading",
    "Lee's Dozers (Pty) Ltd",
    "Lubrigard",
    "Mafube",
    "Mbuyelo Mining",
    "Mogalakwena Mine",
    "Moolmans",
    "NAE",
    "Nkomati",
    "Pentalin Processing",
    "Rampart Loading Terminal",
    "Richards Bay Minerals",
    "Scaw Metals Group",
    "Seriti",
    "Spectrum Technical Metals & Minerals Proc",
    "Team Acid Holdings",
    "Thungela Operations",
    "Tokata Group",
    "Transalloys (PTY) LTD",
    "West Reef Plant Hire(PTY)LTD",
    "Zibulo",
] as const;

export const ADMINISTRATORS = [
    "Collen",
    "Riaan",
    "Promise",
    "Melissa",
    "Rendani",
    "Bianco",
] as const;

export const TECHNICIANS = [
    "Cousin",
    "Doctor",
    "Dudley",
    "Eric",
    "Freedom",
    "Jeofrey",
    "Kyle",
    "Micheal",
    "Mike",
    "N/A",
    "Patrick",
    "Riaan",
    "Vikesh",
    "Zondo",
] as const;

export const TEST_ITEM_OPTIONS = [
    "Working",
    "Faulty",
    "N/A",
    "Not Tested",
] as const;

export const COMMENT_TYPE_OPTIONS = [
    "N/A",
    "Replaced",
    "No Stock",
    "Repaired",
] as const;

export const UNITS_REPLACED_OPTIONS = ["Yes", "No", "N/A"] as const;

export const YES_NO = ["Yes", "No"] as const;

export const PDU_INSTALLED_OPTIONS = ["Installed", "N/A"] as const;

export const EPS_LINK_COMMENT_OPTIONS = [
    "Engine Oil Pressure",
    "Hydraulic Oil Temperature",
    "Cylinder Temperature",
    "Transmission Temperature",
    "Coolant Temperature",
    "Air Filter Block",
    "Tag Removed",
    "EPS Reset",
    "Ignition On",
    "Manual Shutdown Test",
    "Manual Testing",
    "Was not tested by Technician",
    "Bypass",
    "N/A",
] as const;

export const DEVICE_STATUS_OPTIONS = [
    "Working",
    "Faulty",
    "IZWI",
    "EPS",
] as const;

export const TEST_ITEMS = [
    { key: "horn" as const, label: "Horn" },
    { key: "reverseSiren" as const, label: "Reverse Siren" },
    { key: "lightsAndReverseLights" as const, label: "Lights And Reverse Lights" },
    { key: "preAlarm" as const, label: "Pre-Alarm" },
    { key: "seatbeltSwitch" as const, label: "Seatbelt Switch" },
    { key: "lcd" as const, label: "LCD" },
    { key: "eyesAndRadar" as const, label: "Eyes And Radar" },
    { key: "camerasAndMonitors" as const, label: "Cameras And Monitors" },
    { key: "voiceMessaging" as const, label: "Voice Messaging" },
    { key: "redBeacon" as const, label: "Red Beacon" },
    { key: "amberBeacon" as const, label: "Amber Beacon" },
    { key: "fireExtinguisher" as const, label: "Fire Extinguisher" },
    { key: "speedControl" as const, label: "Speed Control" },
    { key: "airconditioning" as const, label: "Air-Conditioning" },
    { key: "compressor" as const, label: "Compressor" },
    { key: "obdReader" as const, label: "OBD Reader" },
    { key: "engineHourMeter" as const, label: "Engine Hour Meter" },
    { key: "abs" as const, label: "ABS" },
    { key: "parkingBrake" as const, label: "Parking Brake" },
    { key: "sensorOnBeacon" as const, label: "Sensor On Beacon" },
    { key: "speedGovernor" as const, label: "Speed Governor" },
    { key: "cat797Alarm" as const, label: "CAT 797 Alarm" },
] as const;

export const EPS_LINK_TESTS = [
    { key: "epsPowerOn" as const, label: "1. Power ON Received" },
    { key: "epsTrip1" as const, label: "2. EPS Trip Tested" },
    { key: "epsLockCancel1" as const, label: "3. Lock Cancel Received" },
    { key: "epsTrip2" as const, label: "4. 2nd EPS Trip Tested" },
    { key: "epsLockCancel2" as const, label: "5. Lock Cancel Received" },
] as const;

// Type exports for better TypeScript support
export type VehicleMake = typeof VEHICLE_MAKES[number];
export type VehicleVoltage = typeof VEHICLE_VOLTAGES[number];
export type FormType = typeof FORM_TYPES[number];
export type Instruction = typeof INSTRUCTIONS[number];
export type Customer = typeof CUSTOMERS[number];
export type Administrator = typeof ADMINISTRATORS[number];
export type Technician = typeof TECHNICIANS[number];
export type TestItemOption = typeof TEST_ITEM_OPTIONS[number];
export type CommentTypeOption = typeof COMMENT_TYPE_OPTIONS[number];
export type UnitsReplacedOption = typeof UNITS_REPLACED_OPTIONS[number];
export type DeviceStatusOption = typeof DEVICE_STATUS_OPTIONS[number];
export type TestItemKey = typeof TEST_ITEMS[number]['key'];
export type YesNo = typeof YES_NO[number];
export type PDUInstalledOption = typeof PDU_INSTALLED_OPTIONS[number];
export type EPSLinkCommentOption = typeof EPS_LINK_COMMENT_OPTIONS[number];
export type EPSLinkTestKey = typeof EPS_LINK_TESTS[number]['key'];
