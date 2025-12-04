import { useState, useCallback, useRef } from "react";
import type { TestSheetFormData } from "@/types/testSheet";
import { FORM_TYPES } from "@/constants/testSheetConstants";

const DRAFT_KEY = "test-sheet-draft";

interface UseTestSheetFormOptions {
    userId?: string;
}

export function useTestSheetForm({ userId }: UseTestSheetFormOptions = {}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [formData, setFormData] = useState<TestSheetFormData>({
        // Form metadata
        formType: FORM_TYPES[0],
        startTime: new Date().toISOString().slice(0, 16),
        endTime: "",
        instruction: "",
        isDraft: false,

        // Customer information
        customer: "",
        plantName: "",
        notes: "",

        // Vehicle details
        vehicleMake: "",
        vehicleModel: "",
        vehicleVoltage: "",

        // Device identifiers
        serialEsn: "",
        simId: "",
        izwiSerial: "",
        epsSerial: "",

        // Old device identifiers
        oldSerialEsn: "",
        oldSimId: "",
        oldIzwiSerial: "",
        oldEpsSerial: "",

        // Administrator and technician
        administrator: "",
        adminReference: "",
        technicianName: "",
        technicianJobCardNo: "",

        // PDU and Installation
        pduInstalled: "N/A",
        pduVoltageParked: "",
        pduVoltageIgnition: "",
        pduVoltageIdle: "",

        // Units and EPS
        unitsReplaced: "",
        epsLinked: "N/A",

        // EPS Link Tests
        epsPowerOnStatus: "",
        epsTrip1Status: "",
        epsLockCancel1Status: "",
        epsTrip2Status: "",
        epsLockCancel2Status: "",
        epsPowerOnComment: "",
        epsTrip1Comment: "",
        epsLockCancel1Comment: "",
        epsTrip2Comment: "",
        epsLockCancel2Comment: "",

        // Test items status
        GPS: "",
        GSM: "",
        Ignition: "",
        InternalBattery: "",
        MainBattery: "",
        IZWI: "",
        BinTip: "",
        Buzzer: "",
        SeatBelt: "",
        TagAuthentication: "",
        Panic: "",
        EPS: "",
        TPMS: "",
        ServiceBrake: "",

        // Test items comments
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

        // Additional fields
        epsCommentType: "",
        Test: "",
        StatusComment: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const updateField = useCallback((field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const generateAdminRef = useCallback(() => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const ref = `NAE-${timestamp}-${random}`;
        updateField("adminReference", ref);
        return ref;
    }, [updateField]);

    const validateRequiredFields = useCallback(() => {
        const required: Array<{ key: keyof TestSheetFormData; label: string }> = [
            { key: "startTime", label: "Start Time" },
            { key: "instruction", label: "Instruction" },
            { key: "customer", label: "Customer" },
            { key: "plantName", label: "Plant Name" },
            { key: "vehicleMake", label: "Vehicle Make" },
            { key: "vehicleModel", label: "Vehicle Model" },
            { key: "vehicleVoltage", label: "Vehicle Voltage" },
            { key: "serialEsn", label: "Serial (ESN)" },
            { key: "simId", label: "SIM-ID" },
        ];

        const missing = required
            .filter(({ key }) => !String(formData[key] || "").trim())
            .map((r) => r.label);

        return { ok: missing.length === 0, missing };
    }, [formData]);

    const saveToDraft = useCallback(() => {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            return true;
        } catch (error) {
            console.error("Failed to save draft:", error);
            return false;
        }
    }, [formData]);

    const loadFromDraft = useCallback(() => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setFormData(parsed);
                return true;
            }
        } catch (error) {
            console.error("Failed to load draft:", error);
        }
        return false;
    }, []);

    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(DRAFT_KEY);
            return true;
        } catch (error) {
            console.error("Failed to clear draft:", error);
            return false;
        }
    }, []);

    const getSignatureData = useCallback(() => {
        if (canvasRef.current) {
            try {
                return canvasRef.current.toDataURL("image/png");
            } catch (error) {
                console.error("Failed to get signature:", error);
            }
        }
        return undefined;
    }, []);

    // Computed values
    const showIZWI = formData.IZWI !== "N/A";
    const showEPS = formData.EPS !== "N/A";
    const showPDU = formData.pduInstalled === "Installed";
    const showEPSLink = formData.epsLinked === "Yes";

    return {
        // State
        formData,
        isSubmitting,
        showPopup,
        canvasRef,

        // Actions
        updateField,
        generateAdminRef,
        validateRequiredFields,
        setIsSubmitting,
        setShowPopup,
        saveToDraft,
        loadFromDraft,
        clearDraft,
        getSignatureData,

        // Computed values
        showIZWI,
        showEPS,
        showPDU,
        showEPSLink,
    };
}
