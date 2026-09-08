import { eq } from "drizzle-orm";
import { z } from "zod";
import { companies, projects } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
import { storagePut } from "../storage";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const imageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

export const mediaRouter = router({
  uploadEntityImage: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["company_logo", "project_cover"]),
        targetId: z.number().int().positive(),
        fileName: z.string().trim().min(1).max(255),
        mimeType: z.string().max(100),
        dataBase64: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertPermission(
        ctx.user,
        input.targetType === "company_logo" ? "admin.manage" : "projects.manage"
      );
      if (!imageTypes.has(input.mimeType)) throw new Error("Formato de imagem não permitido.");
      const buffer = Buffer.from(input.dataBase64, "base64");
      if (buffer.byteLength > MAX_IMAGE_SIZE) throw new Error("A imagem excede o limite de 8 MB.");
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const stored = await storagePut(
        `nexus-media/${input.targetType}/${input.targetId}/${Date.now()}-${safeName}`,
        buffer,
        input.mimeType
      );
      const db = await requireDb();
      if (input.targetType === "company_logo")
        await db
          .update(companies)
          .set({ logoKey: stored.key, logoUrl: stored.url })
          .where(eq(companies.id, input.targetId));
      else
        await db
          .update(projects)
          .set({ coverKey: stored.key, coverUrl: stored.url, updatedBy: ctx.user.id })
          .where(eq(projects.id, input.targetId));
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: input.targetType === "company_logo" ? "company" : "project",
        entityId: input.targetId,
        action: "image_uploaded",
        summary:
          input.targetType === "company_logo"
            ? "Logo da empresa atualizado."
            : "Capa do projeto atualizada.",
      });
      return stored;
    }),
});
