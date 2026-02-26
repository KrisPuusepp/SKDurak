import { type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SettingOption
{
  value: string;
  label: ReactNode;
}

interface SettingRowProps
{
  label: string;
  id: string;
  value: string;
  options: SettingOption[];
  onChange: (value: string) => void;
}

export const SettingRow = ({ label, id, value, options, onChange }: SettingRowProps) => (
  <div className="flex items-center justify-end w-full gap-4 py-2 px-4">
    <Label htmlFor={id} className="whitespace-nowrap font-medium">
      {label}
    </Label>
    <div className="w-full max-w-[60%]">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          {/* We find the current option to display its custom label in the trigger too */}
          <SelectValue>
            {options.find((opt) => opt.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);