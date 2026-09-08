import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { documents } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
import {
  assertDocumentAccess,
  assertDocumentWriteAccess,
  getAuthorizedDocument,
  resolveTargetProjectId,
} from "../services/documentAccess";
import { storageGetSignedUrl, storagePut } from "../storage";

export const MAX_FILE_SIZE = 15 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
export const isAllowedDocumentMime = (mimeType: string) => allowedMimeTypes.has(mimeType);

export function hasValidDocumentSignature(mimeType: string, buffer: Buffer): boolean {
  const hex = buffer.subarray(0, 12).toString("hex");
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (mimeType === "image/png") return hex.startsWith("89504e470d0a1a0a");
  if (mimeType === "image/jpeg") return hex.startsWith("ffd8ff");
  if (mimeType === "image/webp")
    return (
      buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP"
    );
  if (mimeType.includes("openxmlformats"))
    return hex.startsWith("504b0304") || hex.startsWith("504b0506") || hex.startsWith("504b0708");
  if (
    ["application/vnd.ms-excel", "application/vnd.ms-powerpoint", "application/msword"].includes(
      mimeType
    )
  )
    return hex.startsWith("d0cf11e0a1b11ae1");
  return false;
}

const targetSchema = z.object({
  projectId: z.number().int().positive().nullable().optional(),
  actionId: z.number().int().positive().nullable().optional(),
  decisionId: z.number().int().positive().nullable().optional(),
});
const metadataSchema = targetSchema.extend({
  title: z.string().trim().min(2).max(220),
  category: z.string().max(100).nullable().optional(),
  version: z.string().max(40).default("1.0"),
  tags: z.array(z.string().max(60)).max(20).optional(),
  accessLevel: z.enum(["project", "restricted", "executive"]).default("project"),
});
const httpUrlSchema = z
  .string()
  .url()
  .max(1200)
  .refine(
    value => ["http:", "https:"].includes(new URL(value).protocol),
    "Use somente links HTTP ou HTTPS."
  );
const updateMetadataSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(2).max(220).optional(),
  category: z.string().max(100).nullable().optional(),
  version: z.string().max(40).optional(),
  tags: z.array(z.string().max(60)).max(20).optional(),
  accessLevel: z.enum(["project", "restricted", "executive"]).optional(),
  externalUrl: httpUrlSchema.optional(),
});

function sanitizedDocument(document: typeof documents.$inferSelect) {
  const { storageKey: _storageKey, url: _url, externalUrl: _externalUrl, ...safe } = document;
  return safe;
}

export const documentsRouter = router({
  list: protectedProcedure.input(targetSchema).query(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "documents.view");
    const db = await requireDb();
    const targetWhere = input.actionId
      ? eq(documents.actionId, input.actionId)
      : input.decisionId
        ? eq(documents.decisionId, input.decisionId)
        : input.projectId
          ? eq(documents.projectId, input.projectId)
          : undefined;
    const where = targetWhere
      ? and(targetWhere, isNull(documents.archivedAt))
      : isNull(documents.archivedAt);
    const rows = await db.select().from(documents).where(where).orderBy(desc(documents.createdAt));
    const visible = [];
    for (const document of rows) {
      try {
        await assertDocumentAccess(ctx.user, document);
        visible.push(sanitizedDocument(document));
      } catch (error) {
        if (!(error instanceof TRPCError) || error.code !== "NOT_FOUND") throw error;
      }
    }
    return visible;
  }),
  addLink: protectedProcedure
    .input(metadataSchema.extend({ externalUrl: httpUrlSchema }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "documents.manage");
      const projectId = await resolveTargetProjectId(input);
      await assertDocumentWriteAccess(ctx.user, projectId);
      const db = await requireDb();
      const [result] = await db
        .insert(documents)
        .values({ ...input, projectId, kind: "link", uploadedBy: ctx.user.id });
      const id = Number(result.insertId);
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "document",
        entityId: id,
        action: "created",
        summary: `Link ${input.title} adicionado.`,
        metadata: { projectId, accessLevel: input.accessLevel },
      });
      return { id };
    }),
  upload: protectedProcedure
    .input(
      metadataSchema.extend({
        fileName: z.string().trim().min(1).max(255),
        mimeType: z.string().max(160),
        dataBase64: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "documents.manage");
      const projectId = await resolveTargetProjectId(input);
      await assertDocumentWriteAccess(ctx.user, projectId);
      if (!isAllowedDocumentMime(input.mimeType))
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tipo de arquivo não permitido." });
      const buffer = Buffer.from(input.dataBase64, "base64");
      if (!buffer.length || buffer.byteLength > MAX_FILE_SIZE)
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "O arquivo deve ter no máximo 15 MB.",
        });
      if (!hasValidDocumentSignature(input.mimeType, buffer))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O conteúdo do arquivo não corresponde ao tipo informado.",
        });
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const stored = await storagePut(
        `nexus/${ctx.user.id}/${Date.now()}-${safeName}`,
        buffer,
        input.mimeType
      );
      const db = await requireDb();
      const [result] = await db.insert(documents).values({
        projectId,
        actionId: input.actionId,
        decisionId: input.decisionId,
        title: input.title,
        kind: "file",
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: buffer.byteLength,
        storageKey: stored.key,
        url: null,
        category: input.category,
        version: input.version,
        tags: input.tags,
        accessLevel: input.accessLevel,
        uploadedBy: ctx.user.id,
      });
      const id = Number(result.insertId);
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "document",
        entityId: id,
        action: "uploaded",
        summary: `Documento ${input.fileName} anexado.`,
        metadata: {
          projectId,
          accessLevel: input.accessLevel,
          mimeType: input.mimeType,
          fileSize: buffer.byteLength,
        },
      });
      return { id };
    }),
  open: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "documents.view");
      const document = await getAuthorizedDocument(ctx.user, input.id);
      if (document.archivedAt)
        throw new TRPCError({ code: "NOT_FOUND", message: "Documento arquivado." });
      const url =
        document.kind === "link"
          ? document.externalUrl
          : document.storageKey
            ? await storageGetSignedUrl(document.storageKey)
            : null;
      if (!url) throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado." });
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "document",
        entityId: document.id,
        action: "opened",
        summary: "Documento aberto por usuário autorizado.",
        metadata: {
          projectId: document.projectId,
          kind: document.kind,
          accessLevel: document.accessLevel,
        },
      });
      return { url, kind: document.kind };
    }),
  update: protectedProcedure.input(updateMetadataSchema).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "documents.manage");
    const document = await getAuthorizedDocument(ctx.user, input.id);
    if (!document.projectId)
      throw new TRPCError({ code: "CONFLICT", message: "Documento sem projeto resolvido." });
    await assertDocumentWriteAccess(ctx.user, document.projectId);
    if (document.archivedAt)
      throw new TRPCError({
        code: "CONFLICT",
        message: "Documento arquivado não pode ser editado.",
      });
    const { id, ...data } = input;
    if (document.kind !== "link" && data.externalUrl)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "URL externa é válida somente para links.",
      });
    const db = await requireDb();
    await db.update(documents).set(data).where(eq(documents.id, id));
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: "document",
      entityId: id,
      action: "updated",
      summary: `Metadados do documento ${document.title} atualizados.`,
      metadata: { projectId: document.projectId, fields: Object.keys(data) },
    });
    return { success: true };
  }),
  archive: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "documents.manage");
      const document = await getAuthorizedDocument(ctx.user, input.id);
      if (!document.projectId)
        throw new TRPCError({ code: "CONFLICT", message: "Documento sem projeto resolvido." });
      await assertDocumentWriteAccess(ctx.user, document.projectId);
      const db = await requireDb();
      await db.update(documents).set({ archivedAt: new Date() }).where(eq(documents.id, input.id));
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "document",
        entityId: input.id,
        action: "archived",
        summary: `Documento ${document.title} arquivado.`,
        metadata: { projectId: document.projectId, kind: document.kind },
      });
      return { success: true };
    }),
});
