import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDU_INSTALLED_OPTIONS, YES_NO } from "@/constants/testSheetConstants";
import type { TestSheetFormData } from "@/types/testSheet";
import { PDUSection } from "./PDUSection";
import { EPSLinkSection } from "./EPSLinkSection";

interface ConditionalSectionsProps {
    formData: TestSheetFormData;
    updateField: <K extends keyof TestSheetFormData>(field: K, value: TestSheetFormData[K]) => void;
    showPDU: boolean;
    showEPSLink: boolean;
}

export function ConditionalSections({
    formData,
    updateField,
    showPDU,
    showEPSLink,
}: ConditionalSectionsProps) {
    return (
        <div className="space-y-6">
            {/* PDU Installed / EPS Linked controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label>PDU Installed</Label>
                    <Select
                        value={formData.pduInstalled}
                        onValueChange={(v) => updateField("pduInstalled", v as any)}
                    >
                        <SelectTrigger className="bg-white mt-2">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            {PDU_INSTALLED_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>
                                    {o}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>EPS Linked</Label>
                    <Select
                        value={formData.epsLinked}
                        onValueChange={(v) => updateField("epsLinked", v as any)}
                    >
                        <SelectTrigger className="bg-white mt-2">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            {YES_NO.map((o) => (
                                <SelectItem key={o} value={o}>
                                    {o}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* PDU measurements (auto-hide) */}
            {showPDU && <PDUSection formData={formData} updateField={updateField} />}

            {/* EPS Link Test (hidden unless EPS Linked = Yes) */}
            {showEPSLink && <EPSLinkSection formData={formData} updateField={updateField} />}
        </div>
    );
}
