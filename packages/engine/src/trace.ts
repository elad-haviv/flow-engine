export type Origin = "entered" | "catalog" | "standard" | "default" | "computed";
export interface TraceInput {
  name: string;
  value: number | string;
  unit: string;
  origin: Origin;
}
export interface Trace {
  quantity: string;
  formula: string;
  inputs: TraceInput[];
  standardClause?: string;
  assumed: boolean;
}
export interface Traced {
  value: number;
  unit: string;
  trace: Trace;
}

export const input = (name: string, value: number | string, unit: string, origin: Origin = "entered"): TraceInput => ({
  name,
  value,
  unit,
  origin,
});

export function traced(
  value: number,
  unit: string,
  quantity: string,
  formula: string,
  inputs: TraceInput[],
  extra: { clause?: string; assumed?: boolean } = {},
): Traced {
  const assumed = extra.assumed ?? inputs.some((i) => i.origin === "default");
  return {
    value,
    unit,
    trace: {
      quantity,
      formula,
      inputs,
      ...(extra.clause !== undefined ? { standardClause: extra.clause } : {}),
      assumed,
    },
  };
}
