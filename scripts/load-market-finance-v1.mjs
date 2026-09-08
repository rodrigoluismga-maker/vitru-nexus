import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const EXPECTED_SHA = "ef6a1a16d4f6b839b7d3d282a9cbffed0d51e32451885a4697416c39d514ef71";
const SOURCE = process.argv[2];
const ANALYSIS_DIR =
  process.env.MARKET_FINANCE_ANALYSIS_DIR ??
  path.resolve(process.cwd(), "../vitru-nexus-data-v2/analysis");
const PAYLOAD = path.join(ANALYSIS_DIR, "treated_base.jsonl");
const ANALYSIS = path.join(ANALYSIS_DIR, "source_analysis.json");
const CHUNK_SIZE = 250;
const HEADERS = [
  "ORIGEM",
  "COMPETENCIA_DRE",
  "COMPETENCIA",
  "DIA",
  "MES",
  "ANO",
  "MARCA",
  "BU_DRE",
  "MODALIDADE",
  "PRODUTO",
  "GRUPO_DRE",
  "LINHA_DRE",
  "CT2_FILIAL",
  "CCUSTO",
  "DESCCC",
  "CONTA",
  "CONTA_DESCRI",
  "VERBA",
  "VERBA_DESCRI",
  "HISTORICO",
  "USUARIO",
  "CT2_LOTE",
  "CT2_SBLOTE",
  "VALOR",
  "LANCAMENTO_MANUAL",
  "TIPO_LANCAMENTO",
  "CATEGORIZACAO_VF",
];

if (!SOURCE || !fs.existsSync(SOURCE))
  throw new Error("Informe o caminho da BASE_REAL_MKTv2.xlsx.");
if (!fs.existsSync(PAYLOAD) || !fs.existsSync(ANALYSIS))
  throw new Error("Execute primeiro a auditoria canônica da fonte oficial.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está configurada.");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function text(value, max = 1000) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized || normalized === "-") return null;
  return normalized.slice(0, max);
}

function numberValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(
    String(value ?? "")
      .replaceAll(".", "")
      .replace(",", ".")
  );
  return Number.isFinite(parsed) ? parsed : null;
}

function jsonScalar(value) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    if ("result" in value) return jsonScalar(value.result);
    if ("text" in value) return String(value.text);
    return JSON.parse(JSON.stringify(value));
  }
  return value ?? null;
}

function postingDate(record) {
  const competence =
    record.COMPETENCIA instanceof Date ? record.COMPETENCIA : new Date(record.COMPETENCIA);
  const year = Number(record.ANO) || competence.getUTCFullYear();
  const month = Number(record.MES) || competence.getUTCMonth() + 1;
  const day = Number(record.DIA);
  const safeDay = Number.isInteger(day) && day >= 1 && day <= 31 ? day : 1;
  return new Date(Date.UTC(year, month - 1, safeDay, 12, 0, 0));
}

function attentionType(observation) {
  const value = String(observation ?? "").toLowerCase();
  if (["erro", "incorret", "imprecis", "sob análise"].some(token => value.includes(token)))
    return "imprecision";
  if (
    ["não foi considerado", "não está contemplada", "excepcional"].some(token =>
      value.includes(token)
    )
  )
    return "scope_change";
  if (
    ["transferência", "saída de contratos", "linha deve ser analisada"].some(token =>
      value.includes(token)
    )
  )
    return "reclassification";
  if (value.includes("fcst") || value.includes("forecast")) return "forecast";
  return "context";
}

async function bulkInsert(connection, table, columns, rows) {
  for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
    const chunk = rows.slice(index, index + CHUNK_SIZE);
    if (!chunk.length) continue;
    await connection.query(
      `INSERT INTO \`${table}\` (${columns.map(column => `\`${column}\``).join(",")}) VALUES ?`,
      [chunk]
    );
  }
}

async function main() {
  const sourceBytes = fs.readFileSync(SOURCE);
  const sourceSha = sha256(sourceBytes);
  if (sourceSha !== EXPECTED_SHA) throw new Error(`SHA-256 inesperado: ${sourceSha}`);

  const analysis = JSON.parse(fs.readFileSync(ANALYSIS, "utf8"));
  if (analysis.source.sha256 !== sourceSha)
    throw new Error("O payload tratado não corresponde ao hash da fonte oficial.");
  const rawRows = fs
    .readFileSync(PAYLOAD, "utf8")
    .trim()
    .split("\n")
    .map(line => {
      const record = JSON.parse(line);
      return { rowNumber: Number(record.SOURCE_EXCEL_ROW), record };
    });
  const rejectedRows = analysis.quality.rejected_rows.map(item => ({
    rowNumber: Number(item.SOURCE_EXCEL_ROW),
    record: { HISTORICO: item.HISTORICO },
    reason: item.REJECTION_REASON,
  }));
  if (rawRows.length !== analysis.source.valid_rows)
    throw new Error("Quantidade do payload tratado diverge da auditoria.");

  const seenFingerprints = new Set();
  let duplicateRows = 0;
  let totalSigned = 0;
  const entryRows = [];
  for (const { rowNumber, record } of rawRows) {
    const rawData = Object.fromEntries(HEADERS.map(header => [header, jsonScalar(record[header])]));
    const canonical = HEADERS.map(header => JSON.stringify(rawData[header] ?? null)).join("\x1f");
    const duplicateFingerprint = sha256(canonical);
    const exactDuplicate = seenFingerprints.has(duplicateFingerprint);
    if (exactDuplicate) duplicateRows += 1;
    seenFingerprints.add(duplicateFingerprint);
    const sourceRecordId = sha256(`${rowNumber}\x1e${canonical}`);
    const origin = text(record.ORIGEM, 200);
    const scenario = origin.toUpperCase().includes("FCST") ? "forecast" : "actual";
    const amountSigned = numberValue(record.VALOR);
    if (amountSigned === null) throw new Error(`Valor inválido na linha ${rowNumber}.`);
    totalSigned += amountSigned;
    const date = postingDate(record);
    const fiscalYear = Number(record.ANO) || date.getUTCFullYear();
    const month = Number(record.MES) || date.getUTCMonth() + 1;
    const qualityFlags = [];
    if (!text(record.USUARIO)) qualityFlags.push("USUARIO_AUSENTE");
    if (!text(record.VERBA)) qualityFlags.push("VERBA_AUSENTE");
    if (!text(record.DESCCC)) qualityFlags.push("DESCRICAO_CC_AUSENTE");
    if (!text(record.CONTA_DESCRI)) qualityFlags.push("DESCRICAO_CONTA_AUSENTE");
    if (
      String(record.LANCAMENTO_MANUAL ?? "")
        .trim()
        .toUpperCase() === "S"
    )
      qualityFlags.push("LANCAMENTO_MANUAL");
    if (exactDuplicate) qualityFlags.push("POSSIVEL_DUPLICIDADE_EXATA");

    entryRows.push([
      null,
      rowNumber,
      sourceRecordId,
      origin,
      scenario,
      text(record.COMPETENCIA_DRE, 6),
      `${fiscalYear}-${String(month).padStart(2, "0")}`,
      date,
      numberValue(record.DIA),
      month,
      fiscalYear,
      text(record.MARCA, 160),
      text(record.BU_DRE, 200),
      text(record.MODALIDADE, 160),
      text(record.PRODUTO, 200),
      text(record.GRUPO_DRE, 200),
      text(record.LINHA_DRE, 200),
      text(record.CT2_FILIAL, 80),
      text(record.CCUSTO, 120),
      text(record.DESCCC, 300),
      text(record.CONTA, 120),
      text(record.CONTA_DESCRI, 300),
      text(record.VERBA, 120),
      text(record.VERBA_DESCRI, 300),
      text(record.HISTORICO, 5000),
      text(record.USUARIO, 200),
      text(record.CT2_LOTE, 120),
      text(record.CT2_SBLOTE, 120),
      amountSigned.toFixed(8),
      (-amountSigned).toFixed(8),
      String(record.LANCAMENTO_MANUAL ?? "")
        .trim()
        .toUpperCase() === "S",
      text(record.TIPO_LANCAMENTO, 120),
      text(record.CATEGORIZACAO_VF, 200),
      exactDuplicate,
      duplicateFingerprint,
      JSON.stringify(qualityFlags),
      JSON.stringify(rawData),
      true,
    ]);
  }

  const glossaryRows = analysis.glossary.map(item => [
    null,
    item.category,
    item.description,
    "GLOSSÁRIO DE CATEGORIAS",
    Number(item.source_row),
  ]);
  const typeMap = {
    contexto: "context",
    forecast: "forecast",
    reclassificação: "reclassification",
    "mudança de escopo": "scope_change",
    imprecisão: "imprecision",
  };
  const attentionRows = analysis.attention.map(item => [
    null,
    item.brand,
    item.brand === "Uniasselvi" ? "EAD Uniasselvi" : "EAD Unicesumar",
    item.category,
    item.value_2025_signed === null ? null : Number(item.value_2025_signed).toFixed(8),
    item.value_2026_signed === null ? null : Number(item.value_2026_signed).toFixed(8),
    item.observation,
    typeMap[item.attention_type] ?? attentionType(item.observation),
    item.observation ? "open" : "informational",
    "PONTOS DE ATENÇÃO E IMPRECISÃO",
    Number(item.source_row),
  ]);

  const qualityRows = rejectedRows.map(({ rowNumber, record, reason }) => [
    null,
    rowNumber,
    reason,
    "warning",
    null,
    reason === "LINHA_FISICAMENTE_VAZIA"
      ? "Linha física vazia ignorada na carga de fatos."
      : "Linha residual sem origem, competência e valor; conteúdo preservado como qualidade.",
    text(record.HISTORICO, 1000),
    "open",
  ]);
  for (const row of entryRows) {
    if (!row[33]) continue;
    qualityRows.push([
      null,
      row[1],
      "POSSIVEL_DUPLICIDADE_EXATA",
      "warning",
      null,
      "Registro idêntico a uma linha anterior; preservado por ausência de chave corporativa conclusiva.",
      row[34],
      "open",
    ]);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      "SELECT id, status FROM finance_market_loads WHERE sourceSha256 = ? LIMIT 1 FOR UPDATE",
      [sourceSha]
    );
    if (existing.length)
      throw new Error(
        `A fonte já foi carregada no lote ${existing[0].id} (${existing[0].status}).`
      );
    const [ownerRows] = await connection.query("SELECT id FROM users WHERE openId = ? LIMIT 1", [
      process.env.OWNER_OPEN_ID ?? "",
    ]);
    const actorId = ownerRows[0]?.id ?? null;
    const [loadResult] = await connection.execute(
      "INSERT INTO finance_market_loads (sourceFileName, sourceSha256, sourceSheet, status, validRows, rejectedRows, duplicateRows, amountSigned, amountManagement, scenarioRule, notes, loadedBy, approvedBy, approvedAt, activatedAt) VALUES (?, ?, 'BASE_REAL_MKT', 'processing', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [
        "BASE_REAL_MKTv2.xlsx",
        sourceSha,
        rawRows.length,
        rejectedRows.length,
        duplicateRows,
        totalSigned.toFixed(8),
        (-totalSigned).toFixed(8),
        "ORIGEM = FCST => Forecast; demais origens => Realizado",
        "Fonte oficial V1 aprovada pelo usuário em 04/09/2026. Sete linhas sem chaves/valor foram registradas em qualidade.",
        actorId,
        actorId,
      ]
    );
    const loadId = Number(loadResult.insertId);
    for (const row of entryRows) row[0] = loadId;
    for (const row of glossaryRows) row[0] = loadId;
    for (const row of attentionRows) row[0] = loadId;
    for (const row of qualityRows) row[0] = loadId;

    await bulkInsert(
      connection,
      "finance_market_entries",
      [
        "loadId",
        "sourceExcelRow",
        "sourceRecordId",
        "origin",
        "scenario",
        "competenceDre",
        "period",
        "postingDate",
        "day",
        "month",
        "fiscalYear",
        "brand",
        "businessUnit",
        "modality",
        "product",
        "dreGroup",
        "dreLine",
        "branchCode",
        "costCenterCode",
        "costCenterName",
        "accountingAccountCode",
        "accountingAccountName",
        "budgetCode",
        "budgetName",
        "history",
        "sourceUser",
        "ledgerBatch",
        "ledgerSubBatch",
        "amountSigned",
        "amountManagement",
        "manualEntry",
        "entryType",
        "managementCategory",
        "exactDuplicate",
        "duplicateFingerprint",
        "qualityFlags",
        "rawData",
        "isActive",
      ],
      entryRows
    );
    await bulkInsert(
      connection,
      "finance_market_glossary",
      ["loadId", "category", "description", "sourceSheet", "sourceRow"],
      glossaryRows
    );
    await bulkInsert(
      connection,
      "finance_market_attention_points",
      [
        "loadId",
        "brand",
        "businessUnit",
        "managementCategory",
        "amount2025Signed",
        "amount2026Signed",
        "observation",
        "attentionType",
        "status",
        "sourceSheet",
        "sourceRow",
      ],
      attentionRows
    );
    await bulkInsert(
      connection,
      "finance_market_quality_issues",
      [
        "loadId",
        "sourceExcelRow",
        "issueCode",
        "severity",
        "fieldName",
        "message",
        "sourceValue",
        "status",
      ],
      qualityRows
    );
    await connection.execute(
      "UPDATE finance_market_loads SET status = 'superseded' WHERE status = 'active' AND id <> ?",
      [loadId]
    );
    await connection.execute("UPDATE finance_market_loads SET status = 'active' WHERE id = ?", [
      loadId,
    ]);
    await connection.execute(
      "INSERT INTO audit_events (actorUserId, entityType, entityId, action, summary, metadata) VALUES (?, 'finance_market_load', ?, 'activate_official_source', ?, ?)",
      [
        actorId,
        String(loadId),
        "Fonte oficial BASE_REAL_MKTv2.xlsx carregada e ativada",
        JSON.stringify({
          sourceSha,
          validRows: rawRows.length,
          rejectedRows: rejectedRows.length,
          duplicateRows,
          glossaryRows: glossaryRows.length,
          attentionRows: attentionRows.length,
        }),
      ]
    );
    await connection.commit();

    const [verification] = await connection.query(
      "SELECT l.id, l.status, l.validRows, l.rejectedRows, l.duplicateRows, COUNT(e.id) AS persistedRows, CAST(SUM(e.amountSigned) AS DECIMAL(22,8)) AS amountSigned, CAST(SUM(e.amountManagement) AS DECIMAL(22,8)) AS amountManagement, SUM(e.scenario = 'actual') AS actualRows, SUM(e.scenario = 'forecast') AS forecastRows FROM finance_market_loads l JOIN finance_market_entries e ON e.loadId = l.id WHERE l.id = ? GROUP BY l.id",
      [loadId]
    );
    console.log(
      JSON.stringify(
        {
          load: verification[0],
          glossaryRows: glossaryRows.length,
          attentionRows: attentionRows.length,
          qualityRows: qualityRows.length,
        },
        null,
        2
      )
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
