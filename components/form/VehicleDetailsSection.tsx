import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { INSTRUCTIONS } from "@/constants/testSheetConstants";
import type { TestSheetFormData } from "@/types/testSheet";
import { SearchableSelect } from "./SearchableSelect";

interface VehicleDetailsSectionProps {
    formData: TestSheetFormData;
    updateField: (field: keyof TestSheetFormData, value: any) => void;
    vehicleMakeOptions: string[];
    customerOptions: string[];
}

export function VehicleDetailsSection({
    formData,
    updateField,
    vehicleMakeOptions,
    customerOptions,
}: VehicleDetailsSectionProps) {
    return (
        <div className="space-y-6">
            {/* Row: Start Time + Instruction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label className="text-slate-700">Start Time</Label>
                    <Input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => updateField("startTime", e.target.value)}
                        className="bg-white mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">dd-MM-yyyy HH:MM</p>
                </div>
                <div>
                    <Label className="text-slate-700">Instruction</Label>
                    <RadioGroup
                        value={formData.instruction}
                        onValueChange={(v) => updateField("instruction", v)}
                        className="mt-2 grid grid-cols-2 gap-4"
                    >
                        {INSTRUCTIONS.map((inst) => (
                            <div key={inst} className="flex items-center space-x-2">
                                <RadioGroupItem id={`inst-${inst}`} value={inst} />
                                <Label htmlFor={`inst-${inst}`}>{inst}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </div>

            {/* Row: Customer + Plant Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SearchableSelect
                    label="Customer"
                    value={formData.customer}
                    options={customerOptions}
                    onValueChange={(value: string) => updateField("customer", value)}
                    placeholder="Select customer"
                    searchPlaceholder="Search customers..."
                />
                <div>
                    <Label>Plant Name</Label>
                    <Input
                        value={formData.plantName}
                        onChange={(e) => updateField("plantName", e.target.value)}
                        className="bg-white mt-2"
                    />
                </div>
            </div>

            {/* Vehicle section: title above, fields below */}
            <div>
                <Label className="text-slate-700">Vehicle</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Make</div>
                        <Input
                            value={formData.vehicleMake}
                            onChange={(e) => updateField("vehicleMake", e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Model</div>
                        <Input
                            value={formData.vehicleModel}
                            onChange={(e) => updateField("vehicleModel", e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Voltage</div>
                        <Input
                            value={formData.vehicleVoltage}
                            onChange={(e) => updateField("vehicleVoltage", e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
