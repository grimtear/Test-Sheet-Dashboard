import { Label } from "@/components/ui/label";
import { ReactNode } from "react";

interface FormFieldProps {
    label: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
}

export function FormField({
    label,
    required = false,
    children,
    className = "",
}: FormFieldProps) {
    return (
        <div className={className}>
            <Label className="text-slate-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="mt-2">{children}</div>
        </div>
    );
}
