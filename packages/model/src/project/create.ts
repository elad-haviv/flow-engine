import { newId } from "../ids";
import { SCHEMA_VERSION, type Project } from "../schema/project";

export function createProject(
  name: string,
  locale: "he" | "en",
  profile: { id: string; edition: string },
  id: string = newId(),
): Project {
  return {
    id, name, locale, profile, schemaVersion: SCHEMA_VERSION,
    devices: [], terminals: [], cables: [], wires: [], junctions: [],
    circuits: [], panels: [], placements: [], annotations: [],
  };
}
