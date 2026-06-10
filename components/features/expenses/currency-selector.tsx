"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "@/lib/money/currencies";

type CurrencySelectorProps = {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  id?: string;
};

export function CurrencySelector({
  value,
  onChange,
  id = "expense-currency",
}: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CurrencyCode)}>
      <SelectTrigger id={id} className="w-full" data-testid="expense-currency-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((item) => (
          <SelectItem
            key={item.code}
            value={item.code}
            data-testid={`expense-currency-option-${item.code}`}
          >
            <span className="flex items-center gap-2">
              <span>{item.symbol}</span>
              <span>
                {item.code} — {item.label}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
