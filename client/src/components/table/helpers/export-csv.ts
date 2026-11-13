import type { Row, RowData, Table } from "@tanstack/react-table"
import { toast } from "sonner"

import { UTILITY_COLUMN_IDS } from "../config/constants"
import type { DataTableFeatures } from "../types/column"
import { labelOf } from "./columns"

/** Turns any cell value into text: arrays become "a; b", dates become ISO strings */
function formatValue(value: unknown): string {
    if (value == null) return ""
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString()
    if (Array.isArray(value)) return value.map(formatValue).filter(Boolean).join("; ")
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
}

// A cell starting with one of these is run as a formula by spreadsheet apps
const FORMULA_START = /^[=+\-@\t\r]/
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/

function escapeCell(raw: string): string {
    // Neutralize formulas: '=HYPERLINK(...)' would otherwise run when the file is opened
    const value = FORMULA_START.test(raw) && !PLAIN_NUMBER.test(raw) ? `'${raw}` : raw
    // Quote fields containing separators, quotes, line breaks or edge spaces (RFC 4180)
    return /[",\r\n]/.test(value) || /^\s|\s$/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function buildCsv<TData extends RowData>(
    table: Table<DataTableFeatures, TData>,
    rows: Row<DataTableFeatures, TData>[]
): string {
    const columns = table
        .getVisibleLeafColumns()
        .filter((column) => !UTILITY_COLUMN_IDS.has(column.id) && column.columnDef.meta?.exportable !== false)

    const lines = [columns.map((column) => escapeCell(labelOf(column))).join(",")]

    for (const row of rows) {
        lines.push(
            columns
                .map((column) => {
                    const exportValue = column.columnDef.meta?.exportValue
                    const value = exportValue ? exportValue(row.original) : row.getValue(column.id)
                    return escapeCell(formatValue(value))
                })
                .join(",")
        )
    }

    // BOM so Excel reads the file as UTF-8; CRLF line endings for the widest compatibility
    return "\uFEFF" + lines.join("\r\n")
}

export function downloadFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Give the browser a moment to start the download before freeing the memory
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "Candidates" → "candidates-2026-10-26.csv" (local date) */
export function csvFilename(base: string) {
    const slug =
        base
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "export"
    const now = new Date()
    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-")
    return `${slug}-${date}.csv`
}

/** Downloads these rows as CSV (visible columns, as shown) and confirms with a toast */
export function exportRowsToCsv<TData extends RowData>(
    table: Table<DataTableFeatures, TData>,
    rows: Row<DataTableFeatures, TData>[],
    filename: string
) {
    if (rows.length === 0) return
    try {
        downloadFile(csvFilename(filename), buildCsv(table, rows))
        toast.success(`Exported ${rows.length} ${rows.length === 1 ? "row" : "rows"}`)
    } catch {
        toast.error("Couldn’t create the export. Try again.")
    }
}
