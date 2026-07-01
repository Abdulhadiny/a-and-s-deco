"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  /** Name for the hidden input — consumed by FormData-based forms automatically */
  name: string;
  defaultValue?: number;
  /** Called with the parsed numeric value on every change.
   *  Use this for react-hook-form (`setValue`) or state-driven forms. */
  onChange?: (value: number) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
}

function toDisplay(digits: string): string {
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

/**
 * A money input that displays a comma-formatted value (e.g. 1,500,000)
 * while storing the raw integer string in a hidden input for form submission.
 *
 * Usage with FormData forms:
 *   <MoneyInput name="rentalPrice" defaultValue={5000} />
 *
 * Usage with react-hook-form:
 *   <MoneyInput name="_amount" onChange={(v) => setValue("amount", v)} defaultValue={watch("amount")} />
 */
export function MoneyInput({
  name,
  defaultValue,
  onChange,
  disabled,
  id,
  placeholder = "0",
  className,
}: MoneyInputProps) {
  const initial =
    defaultValue != null && defaultValue > 0
      ? String(Math.round(defaultValue))
      : "";

  const [raw, setRaw] = useState(initial);
  const [display, setDisplay] = useState(toDisplay(initial));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setRaw(digits);
    setDisplay(toDisplay(digits));
    onChange?.(digits ? Number(digits) : 0);
  }

  return (
    <>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn("tabular-nums", className)}
        autoComplete="off"
      />
      {/* Hidden input carries the raw value into FormData */}
      <input type="hidden" name={name} value={raw} />
    </>
  );
}
