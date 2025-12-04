import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TestSheetFormData } from "@/types/testSheet";

interface PDUSectionProps {
    formData: TestSheetFormData;
    updateField: <K extends keyof TestSheetFormData>(field: K, value: TestSheetFormData[K]) => void;
}

export function PDUSection({ formData, updateField }: PDUSectionProps) {
    return (
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
                        <Input
                            value={formData.pduVoltageParked}
                            onChange={(e) => updateField("pduVoltageParked", e.target.value)}
                            className="bg-white"
                        />
                        <Input
                            value={formData.pduVoltageIgnition}
                            onChange={(e) => updateField("pduVoltageIgnition", e.target.value)}
                            className="bg-white"
                        />
                        <Input
                            value={formData.pduVoltageIdle}
                            onChange={(e) => updateField("pduVoltageIdle", e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
