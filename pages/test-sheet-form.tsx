import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- START: Added/Fixed Placeholder Constants ---
// NOTE: In a real project, these should be imported from a constants file.
// These are added to make the file compile/run.
const FORM_TYPES = ["New Installation", "Inspection", "Repair"];
const CUSTOMERS = [
  "Assmang",
  "Bokgoni",
  "Caliber",
  "Columbus Stainless (Pty)Ltd",
  "Emalahleni Water Treatment Plant",
  "Epiroc",
  "Glencore",
  "Glosam Mine",
  "Goedehoop",
  "Greenside",
  "Inmine",
  "Isibonelo",
  "Navigation",
  "KleenOil",
  "Lee's Dozers (Pty) Ltd",
  "Lubrigard",
  "Mafube",
  "Moolmans",
  "NAE",
  "Richards Bay Minerals",
  "Scaw Metals Group",
  "Seriti",
  "Team Acid Holdings",
  "Thungela Operations",
  "Transalloys (PTY) LTD",
  "Zibulo OC"
];
const TEST_ITEM_OPTIONS = ["Test Ok", "Faulty", "Not Tested", "N/A"];
const COMMENT_TYPE_OPTIONS = [
  "In Working Order",
  "Not Detected / Faulty",
  "Was not tested by Technician",
  "Bypassed",
  "N/A"
];
const PDU_INSTALLED_OPTIONS = ["Installed", "N/A"];
const YES_NO = ["Yes", "No", "N/A"];
const UNITS_REPLACED_OPTIONS = ["Yes", "No", "N/A"];
const ADMINISTRATORS = ["Collen", "Promise", "Melissa", "Rendani", "Bianco"];
const TECHNICIANS = ["Cousin", "Doctor", "Dudley", "Eric", "Freedom", "Jeofrey", "Patrick", "Kyle", "Mike", "Micheal", "N/A", "Riaan", "Vikesh", "Zondo", "Collen", "Promise", "Melissa", "Rendani", "Bianco", "Collen Inmine"];
// --- END: Added/Fixed Placeholder Constants ---


const getDefaultStartTime = () => {
  // Always return current LOCAL date/time in yyyy-MM-ddTHH:mm format
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// EPS Link Test specific status options (REMOVED REDUNDANT DECLARATION HERE)
const EPS_LINK_STATUS_OPTIONS = [
  "Message received",
  "Faulty",
  "N/A",
  "Not Tested by Technician"
] as const;

// EPS Link Test specific comment wording, per request (REMOVED REDUNDANT DECLARATION HERE)
const EPS_LINK_COMMENT_OPTIONS = [
  "Ignition On",
  "Message Received",
  "Engine Oil Pressure",
  "Hydraulic Oil Temperature",
  "Cylinder Temperature",
  "Transmission Temperature",
  "Coolant Temperature",
  "Air Filter Block",
  "Tag Removed",
  "EPS Reset",
  "Manual Shutdown Test",
  "Manual Testing",
  "Was not tested by Technician",
  "Bypass",
  "N/A",
] as const;

// ...existing code... (Removed the entire block of redundant declarations further down)

// --- START: Removed the second, redundant declarations of EPS_LINK_STATUS_OPTIONS and EPS_LINK_COMMENT_OPTIONS ---

/*
// REDUNDANT CODE REMOVED:
// EPS Link Test specific status options
  const EPS_LINK_STATUS_OPTIONS = [
    "Message received",
    "Faulty",
    "N/A",
    "Not Tested by Technician"
  ] as const;

  // EPS Link Test specific comment wording, per request
  const EPS_LINK_COMMENT_OPTIONS = [
    "Ignition On",
    "Message Received",
    "Engine Oil Pressure",
    "Hydraulic Oil Temperature",
    "Cylinder Temperature",
    "Transmission Temperature",
    "Coolant Temperature",
    "Air Filter Block",
    "Tag Removed",
    "EPS Reset",
    "Manual Shutdown Test",
    "Manual Testing",
    "Was not tested by Technician",
    "Bypass",
    "N/A",
  ] as const;
*/

// --- END: Removed the second, redundant declarations ---


type TestItemKey =
  | "GPS"
  | "GSM"
  | "Ignition"
  | "InternalBattery"
  | "MainBattery"
  | "IZWI"
  | "BinTip"
  | "Buzzer"
  | "SeatBelt"
  | "TagAuthentication"
  | "Panic"
  | "EPS"
  | "TPMS"
  | "ServiceBrake";

const TEST_ITEMS: Array<{ key: TestItemKey; label: string }> = [
  { key: "GPS", label: "GPS" },
  { key: "GSM", label: "GSM" },
  { key: "Ignition", label: "Ignition" },
  { key: "InternalBattery", label: "Internal Battery" },
  { key: "MainBattery", label: "Main Battery" },
  { key: "IZWI", label: "IZWI" },
  { key: "BinTip", label: "Bin Tip" },
  { key: "Buzzer", label: "Buzzer" },
  { key: "SeatBelt", label: "Seat Belt" },
  { key: "TagAuthentication", label: "Tag Authentication" },
  { key: "Panic", label: "Panic" },
  { key: "TPMS", label: "TPMS" },
  { key: "ServiceBrake", label: "Service Brake" },
];

const EPS_LINK_TESTS = [
  { key: "epsPowerOn", label: "1. Power ON Received" },
  { key: "epsTrip1", label: "2. EPS Trip Tested" },
  { key: "epsLockCancel1", label: "3. Lock Cancel Received" },
  { key: "epsTrip2", label: "4. 2nd EPS Trip Tested" },
  { key: "epsLockCancel2", label: "5. Lock Cancel Received" },
] as const;

interface FormData {
  formType: string;
  startTime: string;
  instruction: string;
  customer: string;
  plantName: string;
  notes: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVoltage: string;
  serialEsn: string;
  isDraft: boolean;
  administrator: string;
  adminReference: string;
  technicianName: string;
  technicianJobCardNo: string;
  pduInstalled: "Installed" | "N/A";
  epsLinked: "Yes" | "No" | "N/A";
  unitsReplaced: "Yes" | "N/A" | "";
  epsPowerOnStatus?: string;
  epsTrip1Status?: string;
  epsLockCancel1Status?: string;
  epsTrip2Status?: string;
  epsLockCancel2Status?: string;
  epsPowerOnComment?: string;
  epsTrip1Comment?: string;
  epsLockCancel1Comment?: string;
  epsTrip2Comment?: string;
  epsLockCancel2Comment?: string;
  pduVoltageParked: string;
  pduVoltageIgnition: string;
  pduVoltageIdle: string;
  simId: string;
  izwiSerial: string;
  epsSerial: string;
  oldSerialEsn: string;
  oldSimId: string;
  oldIzwiSerial: string;
  oldEpsSerial: string;
  endTime: string;
  GPS: string;
  GSM: string;
  Ignition: string;
  InternalBattery: string;
  MainBattery: string;
  IZWI: string;
  BinTip: string;
  Buzzer: string;
  SeatBelt: string;
  TagAuthentication: string;
  Panic: string;
  EPS: string;
  TPMS: string;
  ServiceBrake: string;
  GPSComment: string;
  GSMComment: string;
  IgnitionComment: string;
  InternalBatteryComment: string;
  MainBatteryComment: string;
  BuzzerComment: string;
  SeatBeltComment: string;
  TagAuthenticationComment: string;
  PanicComment: string;
  EPSComment: string;
  IZWIComment: string;
  BinTipComment: string;
  TPMSComment: string;
  ServiceBrakeComment: string;
  epsCommentType: string;
  Test: string;
  StatusComment: string;
}

export default function TestSheetForm(props: { sheetId?: string }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    // Header fields
    formType: FORM_TYPES[0],
    startTime: (() => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    })(),
    instruction: "",

    // Customer and plant
    customer: "",
    plantName: "",
    notes: "",

    // Vehicle details
    vehicleMake: "",
    vehicleModel: "",
    vehicleVoltage: "",

    // Serials
    serialEsn: "",
    simId: "",
    izwiSerial: "",
    epsSerial: "",

    // Old device identifiers (when Units Replaced = Yes)
    oldSerialEsn: "",
    oldSimId: "",
    oldIzwiSerial: "",
    oldEpsSerial: "",

    // Test items
    Test: "",
    StatusComment: "",
    GPS: "",
    GSM: "",
    Ignition: "",
    InternalBattery: "",
    MainBattery: "",
    Buzzer: "",
    SeatBelt: "",
    TagAuthentication: "",
    Panic: "",
    EPS: "",
    IZWI: "",
    BinTip: "",
    TPMS: "",
    ServiceBrake: "",
    // Per-item comments
    GPSComment: "",
    GSMComment: "",
    IgnitionComment: "",
    InternalBatteryComment: "",
    MainBatteryComment: "",
    BuzzerComment: "",
    SeatBeltComment: "",
    TagAuthenticationComment: "",
    PanicComment: "",
    EPSComment: "",
    IZWIComment: "",
    BinTipComment: "",
    TPMSComment: "",
    ServiceBrakeComment: "",

    // Comment type (only used for IZWI/EPS comment column UI)
    epsCommentType: "",

    // PDU / EPS Link controls
    pduInstalled: "N/A",
    epsLinked: "N/A",

    // Units Replaced
    unitsReplaced: "",

    // PDU measurements
    pduVoltageParked: "",
    pduVoltageIgnition: "",
    pduVoltageIdle: "",

    // EPS Link Test statuses and comments
    epsPowerOnStatus: "",
    epsPowerOnComment: "",
    epsTrip1Status: "",
    epsTrip1Comment: "",
    epsLockCancel1Status: "",
    epsLockCancel1Comment: "",
    epsTrip2Status: "",
    epsTrip2Comment: "",
    epsLockCancel2Status: "",
    epsLockCancel2Comment: "",

    // Personnel and references
    administrator: "",
    technicianName: "",
    adminReference: "",
    technicianJobCardNo: "",
    endTime: (() => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    })(), // yyyy-MM-ddTHH:mm for UI; converted on submit
    isDraft: false,
  });
  const [adminRefTouched, setAdminRefTouched] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [snapshotData, setSnapshotData] = useState<FormData | null>(null);
  const [notFound, setNotFound] = useState(false);
  // Load sheet data if editing (sheetId present)
  useEffect(() => {
    if (props.sheetId) {
      // Fetch sheet data by Job Card (sheetId)
      fetch(`/api/test-sheets/${props.sheetId}`, { credentials: "include" })
        .then(res => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then(data => {
          if (data && data.sheet) {
            setFormData({ ...formData, ...data.sheet });
          } else {
            setNotFound(true);
          }
        })
        .catch(() => setNotFound(true));
    }
  }, [props.sheetId]);

  // Helper function to convert timestamp to datetime-local format
  const formatToDatetimeLocal = (value: any): string => {
    if (!value) return "";

    // If it's already in the correct format (yyyy-MM-ddTHH:mm), return it
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return value.slice(0, 16);
    }

    // If it's a millisecond timestamp (long number), convert it
    if (typeof value === "number" || (typeof value === "string" && /^\d{13}$/.test(value))) {
      const timestamp = typeof value === "string" ? parseInt(value) : value;
      const date = new Date(timestamp);
      return date.toISOString().slice(0, 16);
    }

    // If it looks like a ISO string, format it
    if (typeof value === "string" && value.includes("T")) {
      return value.slice(0, 16);
    }

    return "";
  };

  // Get value for display - uses snapshot data if available (for PDF), otherwise current form data
  const getDisplayValue = (key: keyof typeof formData): any => {
    // Use snapshot data if it exists (shows submitted version)
    if (snapshotData) {
      return snapshotData[key];
    }
    return formData[key];
  };  // Autosave/restore draft to localStorage
  const DRAFT_KEY = "nae-tech-form-draft";
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Fix datetime fields that might have invalid timestamps
        if (parsed.endTime) {
          parsed.endTime = formatToDatetimeLocal(parsed.endTime);
        }
        // --- START OF MODIFICATION ---
        // 1. Get the current time in the required format
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const currentStartTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

        // 2. Merge the parsed draft but explicitly override startTime
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          startTime: currentStartTime, // Always show the current time on load
        }));
        // --- END OF MODIFICATION ---
      } catch { }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  // One-page PDF export of the on-screen form
  const downloadPDF = async (filename: string): Promise<string> => {
    const el = document.getElementById("test-sheet-print");
    if (!el) {
      alert("Couldn't find form to print");
      return "";
    }
    // Clone the form so we can replace interactive controls with plain text for PDF
    const clone = el.cloneNode(true) as HTMLElement;
    clone.id = "pdf-clone-temp";
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.width = "310mm"; // A4 width
    clone.style.minHeight = "397mm"; // A4 height
    clone.style.maxWidth = "310mm";
    clone.style.padding = "12mm";
    document.body.appendChild(clone);

    // Remove all IDs from clone to avoid duplicate ID errors
    const allElements = clone.querySelectorAll('[id]');
    allElements.forEach((el) => el.removeAttribute('id'));
    const allWithHtmlFor = clone.querySelectorAll('[htmlFor]');
    allWithHtmlFor.forEach((el) => el.removeAttribute('htmlFor'));

    // Copy signature canvas content to the clone
    const originalSignatureCanvas = el.querySelector<HTMLCanvasElement>('canvas');
    const cloneSignatureCanvas = clone.querySelector<HTMLCanvasElement>('canvas');
    if (originalSignatureCanvas && cloneSignatureCanvas) {
      const ctx = cloneSignatureCanvas.getContext('2d');
      if (ctx) {
        // Copy the canvas drawing
        ctx.drawImage(originalSignatureCanvas, 0, 0);
      }
    }

    // Replace button text content but preserve the button structure for layout
    const selectTriggers = Array.from(clone.querySelectorAll<HTMLElement>('button[role="combobox"]'));
    selectTriggers.forEach((trigger) => {
      const textNode = trigger.textContent?.trim() || "";
      // Clear children and set plain text
      while (trigger.firstChild) {
        trigger.removeChild(trigger.firstChild);
      }
      trigger.textContent = textNode;
      // Force full text display with underline style
      trigger.style.whiteSpace = "normal";
      trigger.style.overflow = "visible";
      trigger.style.textOverflow = "clip";
      trigger.style.wordBreak = "break-word";
      trigger.style.backgroundColor = "transparent";
      trigger.style.border = "none";
      trigger.style.borderBottom = textNode ? "2px solid #1e293b" : "none"; // Thicker, darker underline
      trigger.style.padding = "0.5rem 0.25rem";
      trigger.style.borderRadius = "0";
      trigger.style.fontSize = "0.95rem";
      trigger.style.fontWeight = "500";
      trigger.style.color = "#0f172a";
    });

    // Replace input elements with text content (inputs don't render values in html2canvas)
    const inputs = Array.from(clone.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="datetime-local"], input[type="email"]'));
    inputs.forEach((input) => {
      const value = input.value || input.placeholder || "";
      const div = document.createElement('div');
      div.textContent = value;
      div.style.padding = "0.5rem 0.25rem";
      div.style.backgroundColor = "transparent";
      div.style.border = "none";
      div.style.borderBottom = value ? "2px solid #1e293b" : "none"; // Thicker, darker underline
      div.style.minHeight = "2rem";
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.wordBreak = "break-word";
      div.style.color = "#0f172a";
      div.style.fontSize = "0.95rem";
      div.style.fontWeight = "500";
      div.style.letterSpacing = "0.01em";
      input.replaceWith(div);
    });

    // Replace textarea elements with text content
    const textareas = Array.from(clone.querySelectorAll<HTMLTextAreaElement>('textarea'));
    textareas.forEach((textarea) => {
      const value = textarea.value || "";
      const div = document.createElement('div');
      div.textContent = value;
      div.style.padding = "0.5rem 0.25rem";
      div.style.backgroundColor = "transparent";
      div.style.border = "none";
      div.style.borderBottom = value ? "2px solid #1e293b" : "none"; // Thicker, darker underline
      div.style.minHeight = "4rem";
      div.style.display = "flex";
      div.style.alignItems = "flex-start";
      div.style.whiteSpace = "pre-wrap";
      div.style.wordBreak = "break-word";
      div.style.color = "#0f172a";
      div.style.fontSize = "0.95rem";
      div.style.fontWeight = "500";
      div.style.lineHeight = "1.6";
      textarea.replaceWith(div);
    });

    // Replace select trigger content (Radix SelectTrigger components)
    const radixTriggers = Array.from(clone.querySelectorAll<HTMLElement>('[data-radix-select-trigger]'));
    radixTriggers.forEach((trigger) => {
      const textNode = trigger.textContent?.trim() || "";
      while (trigger.firstChild) {
        trigger.removeChild(trigger.firstChild);
      }
      trigger.textContent = textNode;
      trigger.style.whiteSpace = "normal";
      trigger.style.overflow = "visible";
      trigger.style.textOverflow = "clip";
      trigger.style.wordBreak = "break-word";
      trigger.style.backgroundColor = "transparent";
      trigger.style.border = "none";
      trigger.style.borderBottom = textNode ? "2px solid #1e293b" : "none"; // Thicker, darker underline
      trigger.style.padding = "0.5rem 0.25rem";
      trigger.style.fontSize = "0.95rem";
      trigger.style.fontWeight = "500";
      trigger.style.color = "#0f172a";
    });

    // Style all labels for better PDF appearance
    const labels = Array.from(clone.querySelectorAll<HTMLElement>('label'));
    labels.forEach((label) => {
      label.style.fontWeight = "600";
      label.style.fontSize = "0.875rem";
      label.style.color = "#475569";
      label.style.textTransform = "uppercase";
      label.style.letterSpacing = "0.05em";
      label.style.marginBottom = "0.25rem";
    });

    // Enhance card header styling
    const cardHeaders = Array.from(clone.querySelectorAll<HTMLElement>('[class*="CardHeader"]'));
    cardHeaders.forEach((header) => {
      header.style.background = "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)";
      header.style.color = "#ffffff";
      header.style.padding = "1.5rem";
      header.style.borderBottom = "4px solid #1e40af";
    });

    // Style card titles
    const cardTitles = Array.from(clone.querySelectorAll<HTMLElement>('[class*="CardTitle"]'));
    cardTitles.forEach((title) => {
      title.style.color = "#ffffff";
      title.style.fontSize = "1.75rem";
      title.style.fontWeight = "700";
      title.style.letterSpacing = "0.025em";
    });

    // Enhance section spacing
    const cardContent = clone.querySelector<HTMLElement>('[class*="CardContent"]');
    if (cardContent) {
      cardContent.style.padding = "2rem";
      cardContent.style.lineHeight = "1.7";
    }

    // Style grid containers for better spacing
    const grids = Array.from(clone.querySelectorAll<HTMLElement>('[class*="grid"]'));
    grids.forEach((grid) => {
      grid.style.marginBottom = "1.5rem";
    });

    // Enhance signature section
    const signatureCanvas = clone.querySelector<HTMLCanvasElement>('canvas');
    if (signatureCanvas) {
      signatureCanvas.style.border = "2px solid #1e293b";
      signatureCanvas.style.borderRadius = "4px";
      signatureCanvas.style.backgroundColor = "#ffffff";
    }

    // Style section headers (like "Test Items", "EPS Link Test")
    const sectionHeaders = Array.from(clone.querySelectorAll<HTMLElement>('[class*="font-semibold text-lg"]'));
    sectionHeaders.forEach((header) => {
      header.style.fontSize = "1.125rem";
      header.style.fontWeight = "700";
      header.style.color = "#1e293b";
      header.style.borderBottom = "2px solid #3b82f6";
      header.style.paddingBottom = "0.5rem";
      header.style.marginBottom = "1rem";
      header.style.marginTop = "1.5rem";
    });

    // Hide any elements marked as print-exclude
    const excluded = Array.from(clone.querySelectorAll<HTMLElement>("[data-print-exclude]"));
    excluded.forEach((n) => (n.style.display = "none"));

    // Hide elements with data-pdf-hide-if-empty="true" (empty fields)
    const hideIfEmpty = Array.from(clone.querySelectorAll<HTMLElement>("[data-pdf-hide-if-empty='true']"));
    hideIfEmpty.forEach((n) => (n.style.display = "none"));

    // Apply PDF capture class to normalize controls for readability
    clone.classList.add("pdf-capture");
    // Force a solid white background inline to avoid html2canvas black output
    clone.style.background = '#ffffff';

    // Hide all elements with no-print class (helper text, instructions, etc.)
    const noPrintElements = clone.querySelectorAll<HTMLElement>('.no-print');
    noPrintElements.forEach((el) => el.style.display = 'none');

    // Hide rows that are N/A-only (Status and Comment N/A or empty)
    const toHide: HTMLElement[] = [];
    const isNA = (v?: string) => !v || v.trim() === "" || v.trim().toUpperCase() === "N/A";
    try {
      // Hide Test Items with N/A status and N/A comment
      TEST_ITEMS.forEach((t) => {
        const status = (formData as any)[t.key] as string;
        const comment = (formData as any)[`${t.key}Comment`] as string;
        if (isNA(status) && isNA(comment)) {
          const row = clone.querySelector<HTMLElement>(`[data-testitem-key="${t.key}"]`);
          if (row) { toHide.push(row); row.style.display = "none"; }
        }
      });

      // Hide EPS Link Test rows with N/A status and N/A comment
      EPS_LINK_TESTS.forEach((t) => {
        const status = (formData as any)[`${t.key}Status`] as string;
        const comment = (formData as any)[`${t.key}Comment`] as string;
        if (isNA(status) && isNA(comment)) {
          const row = clone.querySelector<HTMLElement>(`[data-epslink-key="${t.key}"]`);
          if (row) { toHide.push(row); row.style.display = "none"; }
        }
      });

      console.log('Hiding', toHide.length, 'empty rows from PDF');
    } catch { /* ignore */ }
    // Remove any selection/focus highlights that could tint the capture
    try {
      (document.activeElement as HTMLElement | null)?.blur?.();
      const sel = window.getSelection?.();
      sel?.removeAllRanges?.();
    } catch { }
    // Ensure web fonts are loaded before capturing to avoid text layout glitches
    try { await (document as any).fonts?.ready; } catch { }

    // Add a small delay to ensure all DOM updates are complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Debug: log clone dimensions
    console.log('Clone dimensions:', {
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      scrollHeight: clone.scrollHeight
    });

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(clone, {
        scale: 3, // Higher quality for professional PDF
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false, // Disable for cleaner console
        removeContainer: false,
        foreignObjectRendering: false,
        allowTaint: true,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        imageTimeout: 15000, // Longer timeout for complex forms
        letterRendering: true, // Better text rendering
      });
      console.log('Canvas created:', canvas.width, 'x', canvas.height);
    } catch (err) {
      console.error('html2canvas failed:', err);
      // Attempt a minimal retry with basic settings
      canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: true
      });
    }
    // Remove the clone from DOM
    if (clone.parentNode) {
      document.body.removeChild(clone);
    }

    // Convert to high-quality image
    const imgData = canvas.toDataURL("image/jpeg", 0.95); // JPEG with 95% quality for smaller file size

    // Create PDF with better settings
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true, // Enable compression
      precision: 16 // Higher precision for better quality
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5; // 5mm margin on all sides for professional look
    const availableWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - (margin * 2);

    // Scale image to fit page with margins while preserving aspect ratio
    const imgAspect = canvas.width / canvas.height;
    const pageAspect = availableWidth / availableHeight;
    let drawW = availableWidth;
    let drawH = availableHeight;
    let dx = margin;
    let dy = margin;

    if (imgAspect > pageAspect) {
      // Image is wider than page; fit width
      drawH = availableWidth / imgAspect;
      dy = margin + (availableHeight - drawH) / 2;
    } else {
      // Image is taller; fit height
      drawW = availableHeight * imgAspect;
      dx = margin + (availableWidth - drawW) / 2;
    }

    // Add the image to PDF with high quality
    pdf.addImage(imgData, "JPEG", dx, dy, drawW, drawH, undefined, 'FAST');

    // Add metadata for professional touch
    pdf.setProperties({
      title: `Test Sheet - ${formData.adminReference || 'Draft'}`,
      subject: 'NAE Technology Test Sheet',
      author: formData.administrator || 'NAE IT Technology',
      keywords: 'test sheet, vehicle technology, NAE',
      creator: 'NAE IT Technology Test Sheet System'
    });

    const dataUrl = pdf.output('datauristring');
    pdf.save(filename);
    return dataUrl;
  };

  const generateAdminRef = () => {
    // Format: <Initials>001-<PLANTNAME>-<SiteCode><HHMM><YYYY>
    // Example: Collen Gillen @ Navigation, Plant: Testing, 13:05 2025 -> CG001-TESTING-Na13052025
    const first = (user as any)?.firstName || "";
    const last = (user as any)?.lastName || "";
    const firstInitial = first.trim().charAt(0) || "N";
    const lastInitial = last.trim().charAt(0) || "A";
    const initials = (firstInitial + lastInitial).toUpperCase();
    const seq = "001"; // fixed per request

    const sanitizePlant = (s: string) =>
      (s || "")
        .toUpperCase()
        .replace(/\s+/g, "-")
        .replace(/[^A-Z0-9-]/g, "");
    const plantCode = sanitizePlant(formData.plantName);

    const getSiteCode = (site: string) => {
      if (!site) return "NA";
      const s = site.trim();
      if (/^isibonelo/i.test(s)) return "Isi";
      const word = (s.match(/[A-Za-z]+/)?.[0] || "");
      if (!word) return "NA";
      const code = word.slice(0, 2);
      return code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
    };
    const siteCode = getSiteCode(formData.customer);

    const pad2 = (n: number) => String(n).padStart(2, "0");
    const dt = formData.startTime ? new Date(formData.startTime) : new Date();
    const hhmm = `${pad2(dt.getHours())}${pad2(dt.getMinutes())}`;
    const yyyy = dt.getFullYear();

    const ref = `${initials}${seq}${plantCode ? `-${plantCode}` : ""}-${siteCode}${hhmm}${yyyy}`;
    updateField("adminReference", ref);
    return ref;
  };

  // Auto-generate Admin Reference when sufficient info is present, but don't override manual edits
  useEffect(() => {
    const hasUserNames = !!(user as any)?.firstName && !!(user as any)?.lastName;
    const hasPlant = !!formData.plantName;
    if (!adminRefTouched && hasUserNames && hasPlant && !formData.adminReference) {
      generateAdminRef();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.firstName, user?.lastName, formData.plantName, formData.customer, formData.startTime]);

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const width = parent.clientWidth;
    const height = 180; // fixed display height
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#0f172a"; // slate-900
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
  };

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if (e instanceof TouchEvent) {
      const t = e.touches[0] || e.changedTouches[0];
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: MouseEvent | TouchEvent) => {
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e);
  };
  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const pos = getPos(e);
    const last = lastPosRef.current || pos;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  };
  const endDraw = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // Refill with white background
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  };

  // Validate minimal required fields before Save/Download
  const validateRequiredForSave = () => {
    const required: Array<{ key: keyof typeof formData; label: string }> = [
      { key: "startTime", label: "Start Time" },
      { key: "customer", label: "Customer" },
      { key: "plantName", label: "Plant Name" },
      { key: "vehicleMake", label: "Vehicle Make" },
      { key: "vehicleModel", label: "Vehicle Model" },
      { key: "vehicleVoltage", label: "Vehicle Voltage" },
      { key: "serialEsn", label: "Serial (ESN)" },
      { key: "simId", label: "SIM-ID" },
    ];
    const missing = required
      .filter(({ key }) => !String((formData as any)[key] || "").trim())
      .map((r) => r.label);
    return { ok: missing.length === 0, missing };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const check = validateRequiredForSave();
    if (!check.ok) {
      alert(`Please complete required fields before saving:\n- ${check.missing.join("\n- ")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!formData.adminReference) generateAdminRef();

      // Helper: payload creator
      const makePayload = () => {
        let signatureData: string | undefined;
        if (canvasRef.current) {
          try { signatureData = canvasRef.current.toDataURL("image/png"); } catch { }
        }
        return {
          ...formData,
          startTime: formData.startTime ? new Date(formData.startTime).getTime() : Date.now(),
          endTime: formData.endTime ? new Date(formData.endTime).getTime() : undefined,
          administratorSignature: signatureData,
        };
      };
      const payload = makePayload();

      // Save the snapshot of the form data for PDF generation
      setSnapshotData(formData);

      // 1. Persist to local storage
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        console.log("Saved to local storage:", payload);
      } catch (e) {
        console.error("Failed to save to local storage:", e);
      }

      // 2. Save to Google Sheets
      try {
        const response = await fetch("/api/test-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Google Sheets save failed:", errorText);
          alert("Failed to save to Google Sheets. Please try again.");
          return;
        }
        console.log("Saved to Google Sheets successfully");
        // Invalidate test sheet stats for admin panel
        queryClient.invalidateQueries({ queryKey: ["test-sheets-stats"] });
      } catch (e) {
        console.warn("Google Sheets save failed:", e);
        alert("An error occurred while saving to Google Sheets.");
        return;
      }

      // 3. Download PDF (no need to save to server)
      try {
        const fileName = `${formData.adminReference || "draft"}.pdf`;
        await downloadPDF(fileName);
        console.log("PDF downloaded successfully");
      } catch (e) {
        console.warn("PDF download failed:", e);
      }

      setShowPopup(true);
      // Keep form data intact after save
    } catch (error) {
      alert("Failed to save test sheet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper flags to show/hide related fields
  const showIZWI = formData.IZWI !== "N/A";
  const showEPS = formData.EPS !== "N/A";
  const showPDU = formData.pduInstalled === "Installed";
  const showEPSLink = formData.epsLinked === "Yes";

  // Old device ID section helpers (dynamic columns based on which fields are applicable)
  const oldDeviceCols = 2 + (showIZWI ? 1 : 0) + (showEPS ? 1 : 0);
  const oldColsClass = oldDeviceCols === 2 ? "md:grid-cols-2" : oldDeviceCols === 3 ? "md:grid-cols-3" : "md:grid-cols-4";

  // Comment dropdown removed per request (Image 3)

  if (props.sheetId && notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-4">Job Card Not Found</h2>
          <p className="mb-4">No test sheet found for Job Card <span className="font-mono text-blue-700">{props.sheetId}</span>.</p>
          <Button onClick={() => setLocation("/test-sheet")}>Go to New Sheet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-4">
            <img src="/c2bf33e4-d735-4534-8f68-a60ecccda7c0.jpg" alt="NAE Logo" className="w-27 h-22 object-contain" />
            <div>
              <h1 className="text-4xl font-bold text-blue-900">Test Sheet</h1>
              <p className="text-blue-600 text-lg">Complete test sheet for vehicle technology systems</p>
            </div>
          </div>
          <Badge variant="outline" className="mt-4">
            <CalendarDays className="w-4 h-4 mr-2" />
            {format(new Date(), "dd/MM/yyyy")}
          </Badge>
        </div>
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur" id="test-sheet-print">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white text-slate-800 rounded-t-lg border-b">
              <div className="flex items-center justify-start gap-2">
                <img src="/c2bf33e4-d735-4534-8f68-a60ecccda7c0.jpg" alt="NAE Logo" className="w-24 h-16 object-contain mr-4" />
                <CardTitle className="text-3xl font-bold">Test Sheet</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Row: Form Type */}
              <div className="grid grid-cols-1">
                <div>
                  <Label className="text-slate-700">Form Type</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between mt-2">
                        {formData.formType || "Select form type"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Search form type..." />
                        <CommandEmpty>No form type found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {FORM_TYPES.map((t) => (
                              <CommandItem key={t} value={t} onSelect={() => updateField("formType", t)}>
                                <Check className={`mr-2 h-4 w-4 ${formData.formType === t ? "opacity-100" : "opacity-0"}`} />
                                {t}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Row: Start Time + Customer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="w-full max-w-sm">
                  <Label className="text-slate-700">Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    className="bg-white mt-2 w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">dd-MM-yyyy HH:MM</p>
                </div>
                <div className="w-full max-w-sm">
                  <Label>Customer</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between mt-2">
                        {formData.customer || "Select customer"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Search customers..." />
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {CUSTOMERS.map((c) => (
                              <CommandItem key={c} value={c} onSelect={() => updateField("customer", c)}>
                                <Check className={`mr-2 h-4 w-4 ${formData.customer === c ? "opacity-100" : "opacity-0"}`} />
                                {c}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Row: Plant Name + Vehicle Make + Vehicle Model */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="w-full max-w-sm">
                  <Label>Plant Name</Label>
                  <Input value={formData.plantName} onChange={(e) => updateField("plantName", e.target.value)} className="bg-white mt-2 w-full" />
                  <p className="text-xs text-muted-foreground mt-1 no-print">Anything else mark as N/A</p>
                </div>
                <div className="w-full max-w-sm">
                  <Label className="text-slate-700">Vehicle Make</Label>
                  <Input value={formData.vehicleMake} onChange={(e) => updateField("vehicleMake", e.target.value)} className="bg-white mt-2 w-full" />
                  <p className="text-xs text-muted-foreground mt-1 no-print">Anything else mark as N/A</p>
                </div>
                <div className="w-full max-w-sm">
                  <Label className="text-slate-700">Vehicle Model</Label>
                  <Input value={formData.vehicleModel} onChange={(e) => updateField("vehicleModel", e.target.value)} className="bg-white mt-2 w-full" />
                  <p className="text-xs text-muted-foreground mt-1 no-print">Anything else mark as N/A</p>
                </div>
              </div>

              {/* Row: Serial (ESN) + SIM-ID + Vehicle Voltage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="w-full max-w-sm">
                  <Label>Serial (ESN)</Label>
                  <Input value={formData.serialEsn} onChange={(e) => updateField("serialEsn", e.target.value)} className="bg-white mt-2 w-full" />
                  <p className="text-xs text-muted-foreground mt-1 no-print">Anything else mark as N/A</p>
                </div>
                <div className="w-full max-w-sm">
                  <Label>SIM-ID</Label>
                  <Input value={formData.simId} onChange={(e) => updateField("simId", e.target.value)} className="bg-white mt-2 w-full" />
                  <p className="text-xs text-muted-foreground mt-1 no-print">Anything else mark as N/A</p>
                </div>
                <div className="w-full max-w-sm">
                  <Label className="text-slate-700">Vehicle Voltage</Label>
                  <Input value={formData.vehicleVoltage} onChange={(e) => updateField("vehicleVoltage", e.target.value)} className="bg-white mt-2 w-full" />
                  <p className="text-xs text-muted-foreground mt-1 no-print">Anything else mark as N/A</p>
                </div>
              </div>

              {/* Row: IZWI Serial / EPS Serial (auto-hide based on status) */}
              {(showIZWI || showEPS) && (
                <div className={`grid grid-cols-1 ${showIZWI && showEPS ? "md:grid-cols-2" : "md:grid-cols-1"} gap-6`}>
                  {showIZWI && (
                    <div className="w-full max-w-sm" data-pdf-hide-if-empty={!formData.izwiSerial?.trim()}>
                      <Label>IZWI Serial</Label>
                      <Input value={formData.izwiSerial} onChange={(e) => updateField("izwiSerial", e.target.value)} className="bg-white mt-2 w-full" />
                      <p className="text-xs text-muted-foreground mt-1 no-print">Anything else mark as N/A</p>
                    </div>
                  )}
                  {showEPS && (
                    <div className="w-full max-w-sm" data-pdf-hide-if-empty={!formData.epsSerial?.trim()}>
                      <Label>EPS Serial</Label>
                      <Input value={formData.epsSerial} onChange={(e) => updateField("epsSerial", e.target.value)} className="bg-white mt-2 w-full" />
                      <p className="text-xs text-muted-foreground mt-1 no-print">Anything else mark as N/A</p>
                    </div>
                  )}
                </div>
              )}

              {/* Units Replaced (searchable combobox) */}
              <div>
                <Label>Units Replaced</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="mt-2 w-56 justify-between">
                      {formData.unitsReplaced || "Select"}
                      <ChevronsUpDown className="ml-2 h-4 w-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search..." />
                      <CommandEmpty>No option found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {UNITS_REPLACED_OPTIONS.map((opt) => (
                            <CommandItem key={opt} value={opt} onSelect={() => updateField("unitsReplaced", opt)}>
                              <Check className={`mr-2 h-4 w-2 ${formData.unitsReplaced === opt ? "opacity-100" : "opacity-0"}`} />
                              {opt}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Device ID (OLD) - auto-hide like the rest: only when Units Replaced = Yes */}
              {formData.unitsReplaced === "Yes" && (
                <div className="space-y-3">
                  <Label>Device ID (OLD)</Label>
                  {/* Headers */}
                  <div className={`grid ${oldColsClass} gap-4 px-1`}>
                    <div className="text-center text-sm text-muted-foreground">Serial (ESN)</div>
                    <div className="text-center text-sm text-muted-foreground">SIM-ID</div>
                    {showIZWI && (
                      <div className="text-center text-sm text-muted-foreground">IZWI Serial</div>
                    )}
                    {showEPS && (
                      <div className="text-center text-sm text-muted-foreground">EPS Serial</div>
                    )}
                  </div>
                  {/* Inputs */}
                  <div className={`${oldColsClass} grid grid-cols-1 gap-4`}>
                    <Input value={formData.oldSerialEsn} onChange={(e) => updateField("oldSerialEsn", e.target.value)} className="bg-white" placeholder="" />
                    <Input value={formData.oldSimId} onChange={(e) => updateField("oldSimId", e.target.value)} className="bg-white" placeholder="" />
                    {showIZWI && (
                      <Input value={formData.oldIzwiSerial} onChange={(e) => updateField("oldIzwiSerial", e.target.value)} className="bg-white" placeholder="" />
                    )}
                    {showEPS && (
                      <Input value={formData.oldEpsSerial} onChange={(e) => updateField("oldEpsSerial", e.target.value)} className="bg-white" placeholder="" />
                    )}
                  </div>
                </div>
              )}

              {/* Test Items Section (responsive grid with borders) */}
              <div className="space-y-4">
                <div className="rounded-md border bg-white divide-y">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50">
                    <div className="col-span-4 font-medium text-slate-600">Test</div>
                    <div className="col-span-4 font-medium text-slate-600">Status</div>
                    <div className="col-span-4 font-medium text-slate-600">Comment</div>
                  </div>
                  {TEST_ITEMS.map(({ key, label }) => {
                    const commentKey = `${key}Comment` as const;
                    return (
                      <div key={key} data-testitem-key={key} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3">
                        <div className="md:col-span-4 flex items-center">
                          <span className="text-slate-700">{label}</span>
                        </div>
                        <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select value={(formData as any)[key] || ""} onValueChange={(v) => updateField(key, v)}>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="N/A" />
                            </SelectTrigger>
                            <SelectContent>
                              {TEST_ITEM_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className="w-full justify-between">
                                {(formData as any)[commentKey] || "N/A"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                              <Command>
                                <CommandInput placeholder="Search comment..." />
                                <CommandEmpty>No comment found.</CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {COMMENT_TYPE_OPTIONS.map((opt) => (
                                      <CommandItem key={opt} value={opt} onSelect={() => updateField(commentKey, opt)}>
                                        <Check className={`mr-2 h-4 w-4 ${(formData as any)[commentKey] === opt ? "opacity-100" : "opacity-0"}`} />
                                        {opt}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PDU Installed / EPS Linked controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>PDU Installed</Label>
                  <Select value={formData.pduInstalled} onValueChange={(v) => updateField("pduInstalled", v)}>
                    <SelectTrigger className="bg-white mt-2">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PDU_INSTALLED_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>EPS Linked</Label>
                  <Select value={formData.epsLinked} onValueChange={(v) => updateField("epsLinked", v)}>
                    <SelectTrigger className="bg-white mt-2">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PDU measurements (auto-hide) */}
              {showPDU && (
                <div className="space-y-3">
                  <Label>PDU</Label>
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-2" />
                    <div className="col-span-12 md:col-span-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center text-sm text-muted-foreground">Parked</div>
                        <div className="text-center text-sm text-muted-foreground">Ignition</div>
                        <div className="text-center text-sm text-muted-foreground">Idle</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-2">
                      <div className="text-sm text-muted-foreground mb-1">Voltage</div>
                    </div>
                    <div className="col-span-12 md:col-span-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input value={formData.pduVoltageParked} onChange={(e) => updateField("pduVoltageParked", e.target.value)} className="bg-white" />
                        <Input value={formData.pduVoltageIgnition} onChange={(e) => updateField("pduVoltageIgnition", e.target.value)} className="bg-white" />
                        <Input value={formData.pduVoltageIdle} onChange={(e) => updateField("pduVoltageIdle", e.target.value)} className="bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EPS Link Test (hidden unless EPS Linked = Yes) */}
              {showEPSLink && (
                <div className="space-y-3">
                  <Label>EPS Link Test</Label>
                  <div className="rounded-md border bg-white divide-y mt-2">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50">
                      <div className="col-span-6 font-medium text-slate-600">Select</div>
                      <div className="col-span-6 font-medium text-slate-600">Comment</div>
                    </div>
                    {EPS_LINK_TESTS.map((t) => {
                      const statusKey = `${t.key}Status` as const;
                      const commentKey = `${t.key}Comment` as const;
                      return (
                        <div key={t.key} data-epslink-key={t.key} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3">
                          <div className="md:col-span-12 text-slate-700 font-medium mb-1">{t.label}</div>
                          <div className="md:col-span-6 flex flex-col space-y-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                  {(formData as Record<string, any>)[commentKey] || "N/A"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                  <CommandInput placeholder="Search..." />
                                  <CommandEmpty>No option found.</CommandEmpty>
                                  <CommandList>
                                    <CommandGroup>
                                      {EPS_LINK_COMMENT_OPTIONS.map((opt) => (
                                        <CommandItem key={opt} onSelect={() => updateField(commentKey, opt)}>
                                          {opt}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="md:col-span-6 flex flex-col space-y-2">
                            <Select value={(formData as Record<string, any>)[statusKey]} onValueChange={(v) => updateField(statusKey, v)}>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {EPS_LINK_STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Row: Administrator / Technician */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Administrator</Label>
                  <Select value={formData.administrator} onValueChange={(v) => updateField("administrator", v)}>
                    <SelectTrigger className="bg-white mt-2">
                      <SelectValue placeholder="Select administrator" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMINISTRATORS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Technician</Label>
                  <Select value={formData.technicianName} onValueChange={(v) => updateField("technicianName", v)}>
                    <SelectTrigger className="bg-white mt-2">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {TECHNICIANS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row: Admin Reference / Technician Job Card No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Admin Reference</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={formData.adminReference}
                      onChange={(e) => {
                        setAdminRefTouched(true);
                        updateField("adminReference", e.target.value);
                      }}
                      className="bg-white"
                    />
                    <Button type="button" variant="outline" onClick={() => { setAdminRefTouched(true); generateAdminRef(); }} data-print-exclude>Regenerate</Button>
                  </div>
                </div>
                <div>
                  <Label>Technician Job Card No</Label>
                  <Input value={formData.technicianJobCardNo} onChange={(e) => updateField("technicianJobCardNo", e.target.value)} className="bg-white mt-2" />
                </div>
              </div>

              {/* End Time and Notes row as per screenshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    className="bg-white mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">dd-MM-yyyy HH:MM</p>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="bg-white mt-2"
                    rows={3}
                  />
                </div>
              </div>

              {/* Administrator Signature */}
              <div>
                <Label>
                  Administrator Signature <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2 rounded-md border bg-white p-2">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-[180px] touch-none select-none"
                    onMouseDown={(e) => startDraw(e.nativeEvent)}
                    onMouseMove={(e) => draw(e.nativeEvent)}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={(e) => startDraw(e.nativeEvent)}
                    onTouchMove={(e) => draw(e.nativeEvent)}
                    onTouchEnd={endDraw}
                  />
                </div>
                <div className="mt-2" data-print-exclude>
                  <Button type="button" variant="outline" onClick={clearSignature}>Clear</Button>
                </div>
              </div>

              {/* Actions - Save Only */}
              <div className="flex flex-wrap justify-between items-center gap-3 pt-6" data-print-exclude>
                <img src="/c2bf33e4-d735-4534-8f68-a60ecccda7c0.jpg" alt="NAE Logo" className="w-27 h-22 object-contain" />
                <div className="flex flex-wrap justify-end gap-3">
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
      {showPopup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white p-6 rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p>NAE Technology Form submitted successfully!</p>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setShowPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}