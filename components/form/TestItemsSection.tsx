import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEST_ITEMS, TEST_ITEM_OPTIONS } from "@/constants/testSheetConstants";
import type { TestSheetFormData } from "@/types/testSheet";

interface TestItemsSectionProps {
    formData: TestSheetFormData;
    updateField: <K extends keyof TestSheetFormData>(field: K, value: TestSheetFormData[K]) => void;
}

export function TestItemsSection({ formData, updateField }: TestItemsSectionProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-white divide-y">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50">
                    <div className="col-span-4 font-medium text-slate-600">Test</div>
                    <div className="col-span-4 font-medium text-slate-600">Status</div>
                    <div className="col-span-4 font-medium text-slate-600">Comment</div>
                </div>
                {TEST_ITEMS.map(({ key, label }) => {
                    const commentKey = `${key}Comment` as keyof TestSheetFormData;
                    const statusValue = formData[key as keyof TestSheetFormData] as string || "";
                    const commentValue = formData[commentKey] as string || "";

                    return (
                        <div
                            key={key}
                            data-testitem-key={key}
                            className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3"
                        >
                            <div className="md:col-span-4 flex items-center">
                                <span className="text-slate-700">{label}</span>
                            </div>
                            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    value={statusValue}
                                    onValueChange={(v) => updateField(key as keyof TestSheetFormData, v as any)}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="N/A" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEST_ITEM_OPTIONS.map((status: string) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    value={commentValue}
                                    onChange={(e) => updateField(commentKey, e.target.value as any)}
                                    className="bg-white"
                                    placeholder="Optional comment"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}