/** Every standards table carries where it came from. `verified` becomes true only after the owner signs it off. */
export interface StandardTable<T> {
  id: string;
  source: string;
  edition: string;
  clause: string;
  dateTaken: string;
  verified: boolean;
  rows: T;
}
