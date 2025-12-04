import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMINISTRATORS, TECHNICIANS } from "@/constants/testSheetConstants";
import type { TestSheetFormData } from "@/types/testSheet";
import { SignatureCanvas } from "./SignatureCanvas";

interface AdministratorSectionProps {
    formData: TestSheetFormData;
    updateField: <K extends keyof TestSheetFormData>(field: K, value: TestSheetFormData[K]) => void;
    generateAdminRef: () => void;
    setAdminRefTouched: (touched: boolean) => void;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    clearSignature: () => void;
}

export function AdministratorSection({
    formData,
    updateField,
    generateAdminRef,
    setAdminRefTouched,
    canvasRef,
    clearSignature,
}: AdministratorSectionProps) {
    return (
        <div className="space-y-6">
            {/* Row: Administrator / Technician */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label>Administrator</Label>
                    <Select
                        value={formData.administrator}
                        onValueChange={(v) => updateField("administrator", v)}
                    >
                        <SelectTrigger className="bg-white mt-2">
                            <SelectValue placeholder="Select administrator" />
                        </SelectTrigger>
                        <SelectContent>
                            {ADMINISTRATORS.map((a) => (
                                <SelectItem key={a} value={a}>
                                    {a}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Technician</Label>
                    <Select
                        value={formData.technicianName}
                        onValueChange={(v) => updateField("technicianName", v)}
                    >
                        <SelectTrigger className="bg-white mt-2">
                            <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                        <SelectContent>
                            {TECHNICIANS.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setAdminRefTouched(true);
                                generateAdminRef();
                            }}
                        >
                            Regenerate
                        </Button>
                    </div>
                </div>
                <div>
                    <Label>Technician Job Card No</Label>
                    <Input
                        value={formData.technicianJobCardNo}
                        onChange={(e) => updateField("technicianJobCardNo", e.target.value)}
                        className="bg-white mt-2"
                    />
                </div>
            </div>

            {/* End Time and Notes row */}
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
                <SignatureCanvas ref={canvasRef} />
                <div className="mt-2" data-print-exclude>
                    <Button type="button" variant="outline" onClick={clearSignature}>
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}
