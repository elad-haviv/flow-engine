const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export interface IdSource {
  now(): number;
  random(): number;
}

export const systemIdSource: IdSource = { now: () => Date.now(), random: () => Math.random() };

function encodeTime(ms: number): string {
  let out = "";
  let n = ms;
  for (let i = 0; i < 10; i++) {
    out = ALPHABET[n % 32] + out;
    n = Math.floor(n / 32);
  }
  return out;
}

/** 26-character ULID: 10 time characters, 16 random characters. */
export function newId(src: IdSource = systemIdSource): string {
  let rand = "";
  for (let i = 0; i < 16; i++) rand += ALPHABET[Math.floor(src.random() * 32)];
  return encodeTime(src.now()) + rand;
}

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type DeviceId = Brand<string, "DeviceId">;
export type WireId = Brand<string, "WireId">;
export type CableId = Brand<string, "CableId">;
export type TerminalId = Brand<string, "TerminalId">;
export type JunctionId = Brand<string, "JunctionId">;
