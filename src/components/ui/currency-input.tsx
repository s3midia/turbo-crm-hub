import React, { useState, useEffect } from "react";
import { Input } from "./input";
import { maskBRL, parseBRL } from "@/lib/formatters";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = ({ value, onChange, className, ...props }: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    // Initial format or external value change
    // Multiply by 100 because maskBRL expects an integer representing cents
    // for proper formatting from raw string, but here we have the actual number.
    // Actually, maskBRL logic: const amount = parseFloat(onlyDigits) / 100;
    // So if we have 1000.50, we need "100050" string.
    const numericString = (value * 100).toFixed(0);
    setDisplayValue(maskBRL(numericString));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const maskedValue = maskBRL(rawValue);
    setDisplayValue(maskedValue);
    
    const numericValue = parseBRL(maskedValue);
    onChange(numericValue);
  };

  return (
    <Input
      {...props}
      className={className}
      value={displayValue}
      onChange={handleChange}
    />
  );
};
