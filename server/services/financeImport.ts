import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { Readable } from "node:stream";

export const MAX_FINANCE_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_FINANCE_ROWS = 100_000;

export const commonHeaders = [
  "source_record_id",
  "fiscal_year",
  "period",
  "currency",
  "company_code",
  "area_code",
  "cost_center_code",
  "management_account_code",
  "nature_code",
  "ownership_type",
  "owner_email",
  "amount",
  "source_note",
] as const;

export const optionalDimensionHeaders = [
  "brand_code",
  "business_unit_code",
  "modality_code",
  "product_code",
  "accounting_account_code",
  "pillar_code",
  "channel_code",
  "project_code",
  "initiative_code",
  "campaign_code",
  "vendor_code",
  "contract_code",
  "description",
] as const;

export const loadDefinitions = {
  budget: {
    sheet: "ORCAMENTO",
    required: [...commonHeaders, "version_code"],
    extra: ["justification"],
  },
  actual: {
    sheet: "REALIZADO",
    required: [...commonHeaders, "posting_date"],
    extra: ["document_number", "line_number"],
  },
  commitment: {
    sheet: "COMPROMETIDO",
    required: [...commonHeaders, "commitment_type", "original_amount", "open_amount"],
    extra: [
      "commitment_date",
      "expected_date",
      "document_number",
      "realized_amount",
      "commitment_status",
    ],
  },
  forecast: {
    sheet: "FORECAST",
    required: [...commonHeaders, "version_code"],
    extra: ["assumption_note"],
  },
  allocation: {
    sheet: "RATEIOS",
    required: [
      "rule_code",
      "allocation_type",
      "period",
      "source_fact_type",
      "source_record_id",
      "source_amount",
      "destination_type",
      "destination_code",
      "allocation_percent",
      "allocated_amount",
    ],
    extra: ["driver_value"],
  },
  dimension: {
    sheet: "CADASTROS",
    required: ["dimension_type", "code", "name", "status"],
    extra: ["parent_code", "external_code", "tax_id", "owner_email"],
  },
} as const;

export type FinanceLoadType = keyof typeof loadDefinitions;
export type ParsedRow = Record<string, unknown>;
export type ValidationIssue = {
  rowNumber: number;
  fieldName?: string;
  errorCode: string;
  severity: "warning" | "blocking";
  receivedValue?: string;
  message: string;
  suggestedAction?: string;
};

export function hashBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (
    value instanceof Date ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  if (typeof value === "object" && "result" in value && value.result !== undefined)
    return value.result;
  return cell.text || null;
}

function rowsFromWorksheet(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);
  const columnCount = Math.max(headerRow.cellCount, headerRow.actualCellCount);
  const headers = Array.from({ length: columnCount }, (_, index) =>
    String(cellValue(headerRow.getCell(index + 1)) ?? "")
      .trim()
      .toLowerCase()
  );
  const rows: ParsedRow[] = [];
  for (let rowIndex = 2; rowIndex <= worksheet.actualRowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    const record: ParsedRow = {};
    let hasValue = false;
    headers.forEach((header, index) => {
      if (!header) return;
      const value = cellValue(row.getCell(index + 1));
      record[header] = value;
      if (value !== null && value !== "") hasValue = true;
    });
    if (hasValue) rows.push(record);
  }
  return { headers: headers.filter(Boolean), rows };
}

export async function parseFinanceFile(
  buffer: Buffer,
  fileName: string,
  loadType: FinanceLoadType
) {
  if (buffer.byteLength > MAX_FINANCE_FILE_BYTES)
    throw new Error("Arquivo acima do limite de 20 MB do MVP.");
  const lower = fileName.toLowerCase();
  if (!lower.endsWith(".xlsx") && !lower.endsWith(".csv"))
    throw new Error("Formato não suportado. Envie XLSX ou CSV.");
  const isCsv = lower.endsWith(".csv");
  const workbook = new ExcelJS.Workbook();
  const expectedSheet = loadDefinitions[loadType].sheet;
  let worksheet: ExcelJS.Worksheet | undefined;
  if (isCsv)
    worksheet = await workbook.csv.read(Readable.from(buffer), {
      parserOptions: { delimiter: ",", ignoreEmpty: true },
    });
  else {
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    worksheet = workbook.getWorksheet(expectedSheet) ?? workbook.worksheets[0];
  }
  if (!worksheet) throw new Error("O arquivo não possui uma aba legível.");
  const { rows, headers } = rowsFromWorksheet(worksheet);
  if (rows.length > MAX_FINANCE_ROWS)
    throw new Error("Arquivo acima do limite de 100 mil linhas do MVP.");
  return { rows, headers, sheetName: worksheet.name || expectedSheet };
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeFinanceRow(row: ParsedRow, loadType: FinanceLoadType) {
  const normalized: ParsedRow = { ...row };
  const amount = parseNumber(row.amount);
  if (amount !== null) normalized.amount = amount;
  [
    "original_amount",
    "realized_amount",
    "open_amount",
    "source_amount",
    "allocation_percent",
    "allocated_amount",
    "driver_value",
  ].forEach(field => {
    const value = parseNumber(row[field]);
    if (value !== null) normalized[field] = value;
  });
  if (loadType !== "dimension" && loadType !== "allocation") {
    normalized.currency = String(row.currency || "BRL").toUpperCase();
    normalized.ownership_type = String(row.ownership_type || "").toUpperCase();
  }
  if (loadType === "allocation")
    normalized.allocation_type = String(row.allocation_type || "").toLowerCase();
  return normalized;
}

export function validateFinanceRows(
  rows: ParsedRow[],
  headers: string[],
  loadType: FinanceLoadType
) {
  const definition = loadDefinitions[loadType];
  const issues: ValidationIssue[] = [];
  definition.required.forEach(field => {
    if (!headers.includes(field))
      issues.push({
        rowNumber: 1,
        fieldName: field,
        errorCode: "F_REQUIRED_HEADER",
        severity: "blocking",
        message: `Cabeçalho obrigatório ausente: ${field}.`,
        suggestedAction: "Use o template oficial do tipo de carga.",
      });
  });
  const normalized = rows.map((row, index) => {
    const item = normalizeFinanceRow(row, loadType);
    definition.required.forEach(field => {
      if (item[field] === null || item[field] === undefined || item[field] === "")
        issues.push({
          rowNumber: index + 2,
          fieldName: field,
          errorCode: "F_REQUIRED",
          severity: "blocking",
          message: `Campo obrigatório sem valor: ${field}.`,
          suggestedAction: "Preencha o campo e envie um novo lote.",
        });
    });
    if (loadType !== "dimension" && loadType !== "allocation") {
      if (!/^\d{4}-\d{2}$/.test(String(item.period ?? "")))
        issues.push({
          rowNumber: index + 2,
          fieldName: "period",
          errorCode: "F_INVALID_PERIOD",
          severity: "blocking",
          receivedValue: String(item.period ?? ""),
          message: "Competência deve seguir AAAA-MM.",
        });
      if (!["HOUSE", "CONDO"].includes(String(item.ownership_type ?? "")))
        issues.push({
          rowNumber: index + 2,
          fieldName: "ownership_type",
          errorCode: "F_INVALID_ENUM",
          severity: "blocking",
          receivedValue: String(item.ownership_type ?? ""),
          message: "ownership_type deve ser HOUSE ou CONDO.",
        });
      if (typeof item.amount !== "number")
        issues.push({
          rowNumber: index + 2,
          fieldName: "amount",
          errorCode: "F_INVALID_NUMBER",
          severity: "blocking",
          receivedValue: String(item.amount ?? ""),
          message: "Valor financeiro inválido.",
        });
    }
    if (loadType === "allocation") {
      if (!["house", "condo"].includes(String(item.allocation_type ?? "")))
        issues.push({
          rowNumber: index + 2,
          fieldName: "allocation_type",
          errorCode: "F_INVALID_ENUM",
          severity: "blocking",
          receivedValue: String(item.allocation_type ?? ""),
          message: "allocation_type deve ser house ou condo.",
        });
      const percent = Number(item.allocation_percent);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 1)
        issues.push({
          rowNumber: index + 2,
          fieldName: "allocation_percent",
          errorCode: "F_INVALID_PERCENT",
          severity: "blocking",
          receivedValue: String(item.allocation_percent ?? ""),
          message: "allocation_percent deve ser maior que 0 e menor ou igual a 1.",
        });
    }
    return item;
  });
  const duplicates = new Set<string>();
  normalized.forEach((row, index) => {
    const key = String(row.source_record_id ?? `${row.dimension_type}:${row.code}`);
    if (duplicates.has(key))
      issues.push({
        rowNumber: index + 2,
        fieldName: "source_record_id",
        errorCode: "B_DUPLICATE_RECORD",
        severity: "blocking",
        receivedValue: key,
        message: "Identificador duplicado dentro do arquivo.",
      });
    duplicates.add(key);
  });
  return { normalized, issues };
}

export async function createFinanceTemplate(loadType: FinanceLoadType, format: "csv" | "xlsx") {
  const definition = loadDefinitions[loadType];
  const headers = [...definition.required, ...optionalDimensionHeaders, ...definition.extra].filter(
    (value, index, all) => all.indexOf(value) === index
  );
  if (format === "csv")
    return {
      buffer: Buffer.from(`${headers.join(",")}\n`, "utf8"),
      mimeType: "text/csv",
      extension: "csv",
    };
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(definition.sheet);
  sheet.addRow(headers);
  const output = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(output),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
  };
}
