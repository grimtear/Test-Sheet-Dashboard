import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface SearchableSelectProps {
    label?: string;
    value: string;
    onValueChange: (value: string) => void;
    options: readonly string[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
}

export function SearchableSelect({
    label,
    value,
    onValueChange,
    options,
    placeholder = "Select",
    searchPlaceholder = "Search...",
    emptyMessage = "No option found.",
    className = "",
}: SearchableSelectProps) {
    return (
        <div>
            {label && <Label>{label}</Label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={`justify-between ${label ? "mt-2 " : ""}${className}`}
                    >
                        {value || placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandList>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => onValueChange(option)}
                                    >
                                        <Check
                                            className={`mr-2 h-4 w-4 ${value === option ? "opacity-100" : "opacity-0"
                                                }`}
                                        />
                                        {option}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
