/**
 * Shared RFC-4180 compliant CSV export utilities for SoilSense reports.
 */

/**
 * Wraps any value in double quotes and escapes internal quotes per RFC-4180
 * so embedded commas, line breaks, or special characters never shift columns.
 */
export function escapeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/\r?\n/g, ' ');
    return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Splits an ISO timestamp into comma-free local Date (YYYY-MM-DD) and Time (hh:mm AM/PM).
 */
export function splitDateTime(isoString) {
    if (!isoString) return { date: 'N/A', time: 'N/A' };
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return { date: 'N/A', time: 'N/A' };

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const time = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return {
        date: `${year}-${month}-${day}`,
        time,
    };
}

/**
 * Formats numeric sensor readings to a consistent decimal precision.
 */
export function formatDecimal(value, decimals, fallback = 'N/A') {
    if (value === null || value === undefined || value === '') return fallback;
    const num = Number(value);
    if (Number.isNaN(num)) return fallback;
    return num.toFixed(decimals);
}

/**
 * Builds an RFC-4180 CSV string and verifies every row matches the header column count.
 */
export function buildCsvContent(headers, rows) {
    const colCount = headers.length;
    const headerLine = headers.map(escapeCsvCell).join(',');
    const dataLines = rows.map((row, idx) => {
        if (row.length !== colCount) {
            throw new Error(`CSV column count mismatch at row ${idx}: expected ${colCount}, got ${row.length}`);
        }
        return row.map(escapeCsvCell).join(',');
    });
    return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers a browser CSV file download with a UTF-8 BOM for clean Microsoft Excel compatibility.
 */
export function downloadCsv(filename, headers, rows) {
    const csvContent = buildCsvContent(headers, rows);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
