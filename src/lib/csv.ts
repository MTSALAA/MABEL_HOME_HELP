type Cell = string | number | boolean | Date | null | undefined;

function formatCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formulas: the cells hold text typed by the public.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with a BOM so Excel opens accented characters correctly. */
export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(formatCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
