import { solve, type Results } from "@flow/engine";
import { createProject, type Change, type Command, type Project } from "@flow/model";

export type Tool = { type: "select" } | { type: "place"; kind: string } | { type: "wire"; from?: string };

/** One user step: the commands that ran (with their recorded ids) and how to undo them. */
export interface Step {
  commands: Command[];
  inverses: Change[][];
}

export interface EditorState {
  project: Project;
  journal: Command[];
  undo: Step[];
  redo: Step[];
  selection: string[];
  tool: Tool;
  /** Wires drawn as their separate conductors */
  expanded: string[];
  results: Results;
  /** Last rejected action, as a diagnostic code */
  rejected?: string;
  profile: "il" | "iec";
}

export const analyse = (project: Project, profile: "il" | "iec"): Results => solve(project, { profile });

export function createEditor(project?: Project, profile: "il" | "iec" = "il"): EditorState {
  const p = project ?? createProject("", "he", { id: profile, edition: "2026" });
  return {
    project: p,
    journal: [],
    undo: [],
    redo: [],
    selection: [],
    tool: { type: "select" },
    expanded: [],
    results: analyse(p, profile),
    profile,
  };
}
