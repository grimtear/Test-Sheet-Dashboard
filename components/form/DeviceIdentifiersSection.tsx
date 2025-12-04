import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UNITS_REPLACED_OPTIONS } from "@/constants/testSheetConstants";
import type { TestSheetFormData } from "@/types/testSheet";
import { SearchableSelect } from "./SearchableSelect";

interface DeviceIdentifiersSectionProps {
    formData: TestSheetFormData;
    updateField: (field: keyof TestSheetFormData, value: any) => void;
    showIZWI: boolean;
    showEPS: boolean;
}

export function DeviceIdentifiersSection({
    formData,
    updateField,
    showIZWI,
    showEPS,
}: DeviceIdentifiersSectionProps) {
    // Determine grid layout for old device fields
    const oldColsClass = showIZWI && showEPS
        ? "md:grid-cols-4"
        : showIZWI || showEPS
            ? "md:grid-cols-3"
            : "md:grid-cols-2";

    return (
        <div className="space-y-6">
            {/* Row: Serial (ESN) / SIM-ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label>Serial (ESN)</Label>
                    <Input
                        value={formData.serialEsn}
                        onChange={(e) => updateField("serialEsn", e.target.value)}
                        className="bg-white mt-2"
                    />
                </div>
                <div>
                    <Label>SIM-ID</Label>
                    <Input
                        value={formData.simId}
                        onChange={(e) => updateField("simId", e.target.value)}
                        className="bg-white mt-2"
                    />
                </div>
            </div>

            {/* Row: IZWI Serial / EPS Serial (auto-hide based on status) */}
            {(showIZWI || showEPS) && (
                <div
                    className={`grid grid-cols-1 ${showIZWI && showEPS ? "md:grid-cols-2" : "md:grid-cols-1"
                        } gap-6`}
                >
                    {showIZWI && (
                        <div>
                            <Label>IZWI Serial</Label>
                            <Input
                                value={formData.izwiSerial}
                                onChange={(e) => updateField("izwiSerial", e.target.value)}
                                className="bg-white mt-2"
                            />
                        </div>
                    )}
                    {showEPS && (
                        <div>
                            <Label>EPS Serial</Label>
                            <Input
                                value={formData.epsSerial}
                                onChange={(e) => updateField("epsSerial", e.target.value)}
                                className="bg-white mt-2"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Units Replaced (searchable combobox) */}
            <div>
                <SearchableSelect
                    label="Units Replaced"
                    value={formData.unitsReplaced}
                    options={UNITS_REPLACED_OPTIONS}
                    onValueChange={(value) => updateField("unitsReplaced", value)}
                    className="w-56"
                />
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
                    <div className={`${oldColsClass} grid gap-4`}>
                        <Input
                            value={formData.oldSerialEsn}
                            onChange={(e) => updateField("oldSerialEsn", e.target.value)}
                            className="bg-white"
                            placeholder=""
                        />
                        <Input
                            value={formData.oldSimId}
                            onChange={(e) => updateField("oldSimId", e.target.value)}
                            className="bg-white"
                            placeholder=""
                        />
                        {showIZWI && (
                            <Input
                                value={formData.oldIzwiSerial}
                                onChange={(e) => updateField("oldIzwiSerial", e.target.value)}
                                className="bg-white"
                                placeholder=""
                            />
                        )}
                        {showEPS && (
                            <Input
                                value={formData.oldEpsSerial}
                                onChange={(e) => updateField("oldEpsSerial", e.target.value)}
                                className="bg-white"
                                placeholder=""
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
