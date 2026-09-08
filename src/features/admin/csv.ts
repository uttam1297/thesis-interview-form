/**
 * Pure CSV serialisation (RFC 4180). Kept free of data-access imports so it
 * can be reasoned about and tested on its own.
 */

export function csvField(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(row.map(csvField).join(","));
  // Byte-order mark so Excel opens UTF-8 correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}
