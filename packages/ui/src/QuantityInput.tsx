import { useEffect, useState } from "react";
import { UNIT_FAMILIES, bestUnit, fmt, parseNumber, toBase } from "./quantity";

const SHOWN: Record<string, string> = { ratio: "", percent: "%", mm2: "mm²" };

interface Props {
  id: string;
  family: string;
  si: number | undefined;
  onCommit: (si: number) => void;
}

/** A number with a unit selector. The model stores SI; the person sees kV, kW, kVA and so on. */
export function QuantityInput({ id, family, si, onCommit }: Props) {
  const initial =
    si === undefined ? { value: NaN, unit: UNIT_FAMILIES[family]?.[0]?.unit ?? family } : bestUnit(si, family);
  const [unit, setUnit] = useState(initial.unit);
  const [text, setText] = useState(Number.isNaN(initial.value) ? "" : fmt(initial.value));
  useEffect(() => {
    if (si === undefined) return;
    const d = bestUnit(si, family);
    setUnit(d.unit);
    setText(fmt(d.value));
  }, [si, family]);
  const commit = (value: string, u: string) => {
    const n = parseNumber(value);
    if (n === undefined) return;
    onCommit(toBase(n, u, family));
  };
  const units = UNIT_FAMILIES[family];
  return (
    <span className="qty">
      <input
        id={id}
        data-testid={id}
        inputMode="decimal"
        dir="ltr"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text, unit)}
        onKeyDown={(e) => e.key === "Enter" && commit(text, unit)}
      />
      {units && units.length > 1 ? (
        <select
          aria-label={family}
          value={unit}
          onChange={(e) => {
            setUnit(e.target.value);
            commit(text, e.target.value);
          }}
        >
          {units.map((u) => (
            <option key={u.unit} value={u.unit}>
              {u.unit}
            </option>
          ))}
        </select>
      ) : (
        <span className="unit">{SHOWN[unit] ?? unit}</span>
      )}
    </span>
  );
}
