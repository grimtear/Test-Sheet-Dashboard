/**
 * Type definitions for Test Sheet Form
 */

import type {
    TestItemOption,
    CommentTypeOption,
    UnitsReplacedOption,
    FormType,
    Instruction,
    VehicleVoltage,
} from '@/constants/testSheetConstants';

export type TestItemKey =
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

export type EPSLinkTestKey =
    | "epsPowerOn"
    | "epsTrip1"
    | "epsLockCancel1"
    | "epsTrip2"
    | "epsLockCancel2";

export interface TestSheetFormData {
    // Form metadata
    formType: FormType | string;
    startTime: string;
    endTime: string;
    instruction: Instruction | string;
    isDraft: boolean;

    // Customer information
    customer: string;
    plantName: string;
    notes: string;

    // Vehicle details
    vehicleMake: string;
    vehicleModel: string;
    vehicleVoltage: VehicleVoltage | string;

    // Device identifiers
    serialEsn: string;
    simId: string;
    izwiSerial: string;
    epsSerial: string;

    // Old device identifiers (when units replaced)
    oldSerialEsn: string;
    oldSimId: string;
    oldIzwiSerial: string;
    oldEpsSerial: string;

    // Administrator and technician
    administrator: string;
    adminReference: string;
    technicianName: string;
    technicianJobCardNo: string;

    // PDU and Installation
    pduInstalled: "Installed" | "N/A";
    pduVoltageParked: string;
    pduVoltageIgnition: string;
    pduVoltageIdle: string;

    // Units and EPS
    unitsReplaced: UnitsReplacedOption | "";
    epsLinked: "Yes" | "No" | "N/A";

    // EPS Link Tests
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

    // Test items status
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

    // Test items comments
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

    // Additional fields
    epsCommentType: string;
    Test: string;
    StatusComment: string;
}

export interface TestSheetSubmitPayload extends TestSheetFormData {
    signature?: string;
    userId: string;
}

export interface CanvasDrawEvent {
    offsetX: number;
    offsetY: number;
    touches?: TouchList;
}
