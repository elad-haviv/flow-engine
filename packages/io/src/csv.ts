const BOM = String.fromCharCode(0xfeff);
export type Cell = string | number | undefined;

const quote = (c: Cell): string => {
  const s = c === undefined ? "" : String(c);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV with CRLF and a byte-order mark so Excel reads Hebrew correctly. */
export const toCsv = (rows: Cell[][]): string => BOM + rows.map((r) => r.map(quote).join(",")).join("\r\n") + "\r\n";

function separatorOf(src: string): string {
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  return (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
}

interface Reader {
  src: string;
  sep: string;
  i: number;
  rows: string[][];
  row: string[];
  field: string;
}

/** Reads a quoted field up to its closing quote; "" inside is a literal quote. */
function readQuoted(r: Reader): void {
  r.i++;
  while (r.i < r.src.length) {
    const ch = r.src[r.i]!;
    if (ch === '"' && r.src[r.i + 1] === '"') {
      r.field += '"';
      r.i += 2;
    } else if (ch === '"') {
      r.i++;
      return;
    } else {
      r.field += ch;
      r.i++;
    }
  }
}

function endRow(r: Reader): void {
  r.row.push(r.field);
  r.rows.push(r.row);
  r.row = [];
  r.field = "";
}

/** Splits CSV text into rows of fields; handles quotes, escaped quotes, commas or semicolons, and a leading byte-order mark. */
export function parseCsv(text: string): string[][] {
  const src = text.startsWith(BOM) ? text.slice(1) : text;
  const r: Reader = { src, sep: separatorOf(src), i: 0, rows: [], row: [], field: "" };
  while (r.i < src.length) {
    const ch = src[r.i]!;
    if (ch === '"') readQuoted(r);
    else if (ch === r.sep) {
      r.row.push(r.field);
      r.field = "";
      r.i++;
    } else if (ch === "\n" || ch === "\r") {
      r.i += ch === "\r" && src[r.i + 1] === "\n" ? 2 : 1;
      endRow(r);
    } else {
      r.field += ch;
      r.i++;
    }
  }
  if (r.field !== "" || r.row.length) endRow(r);
  return r.rows.filter((row) => row.some((c) => c.trim() !== ""));
}
