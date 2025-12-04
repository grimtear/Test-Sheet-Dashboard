import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { EPS_LINK_TESTS, EPS_LINK_COMMENT_OPTIONS, TEST_ITEM_OPTIONS } from "@/constants/testSheetConstants";
import type { TestSheetFormData } from "@/types/testSheet";

interface EPSLinkSectionProps {
    formData: TestSheetFormData;
    updateField: <K extends keyof TestSheetFormData>(field: K, value: TestSheetFormData[K]) => void;
}

export function EPSLinkSection({ formData, updateField }: EPSLinkSectionProps) {
    return (
        <div className="space-y-3">
            <Label>EPS Link Test</Label>
            <div className="rounded-md border bg-white divide-y mt-2">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50">
                    <div className="col-span-6 font-medium text-slate-600">Select</div>
                    <div className="col-span-6 font-medium text-slate-600">Comment</div>
                </div>
                {EPS_LINK_TESTS.map((t) => {
                    const statusKey = `${t.key}Status` as keyof TestSheetFormData;
                    const commentKey = `${t.key}Comment` as keyof TestSheetFormData;
                    const statusValue = formData[statusKey] as string || "";
                    const commentValue = formData[commentKey] as string || "N/A";

                    return (
                        <div
                            key={t.key}
                            data-epslink-key={t.key}
                            className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3"
                        >
                            <div className="md:col-span-12 text-slate-700 font-medium mb-1">{t.label}</div>
                            <div className="md:col-span-6 flex flex-col space-y-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                        >
                                            {commentValue}
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
                                                        <CommandItem
                                                            key={opt}
                                                            onSelect={() => updateField(commentKey, opt as any)}
                                                        >
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
                                <Select
                                    value={statusValue}
                                    onValueChange={(v) => updateField(statusKey, v as any)}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEST_ITEM_OPTIONS.map((opt) => (
                                            <SelectItem key={opt} value={opt}>
                                                {opt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
