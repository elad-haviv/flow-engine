import { describe, expect, it } from "vitest";
import { applyCommand } from "../src";
import { base, cmd, ctx } from "./helpers";

describe("batch", () => {
  it("applies all commands", () => {
    const r = applyCommand(base(), cmd("batch", { commands: [cmd("device.add", { kind: "load", name: "a", params: {} }), cmd("project.rename", { name: "B" })] }), ctx);
    expect(r.ok && r.project.devices.length === 1 && r.project.name === "B").toBe(true);
  });
  it("a failing second command leaves the model unchanged (nothing returned)", () => {
    const p = base();
    const r = applyCommand(p, cmd("batch", { commands: [cmd("device.add", { kind: "load", name: "a", params: {} }), cmd("project.rename", { name: "" })] }), ctx);
    expect(r.ok).toBe(false);
    expect(p.devices).toHaveLength(0);
  });
});
