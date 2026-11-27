import { paramValid, stateValid, terminalsFor } from "@flow/catalog";
import { newId, type ApplyContext } from "@flow/model";

export const makeContext = (now: () => string = () => new Date().toISOString()): ApplyContext => ({
  newId: () => newId(),
  now,
  terminalsFor,
  paramValid,
  stateValid,
});
