import { and, asc, count, desc, eq, inArray, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  areas,
  companies,
  modalities,
  permissions,
  priorities,
  projectCategories,
  projectStatuses,
  roleProfilePermissions,
  roleProfiles,
  userInvitations,
  users,
} from "../../drizzle/schema";
import { requireDb } from "../data/database";
import {
  assertCatalogCanArchive,
  listAreas,
  listCompanies,
  listModalities,
  listUsers,
} from "../data/adminRepository";
import { protectedProcedure, router } from "../_core/trpc";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
import {
  areaSchema,
  companySchema,
  idInputSchema,
  modalitySchema,
  pageInputSchema,
  prioritySchema,
  taxonomySchema,
} from "../lib/schemas";
import { buildInvitedUser, normalizeInvitationEmail } from "../services/userInvitations";
import { deliverUserInvitation } from "../services/userInvitationDelivery";
import { getMicrosoftGraphMailReadiness } from "../services/microsoftGraphMail";

type InvitationDelivery = typeof deliverUserInvitation;

export function createAdminRouter(dependencies: { deliverInvitation?: InvitationDelivery } = {}) {
  const deliverInvitation = dependencies.deliverInvitation ?? deliverUserInvitation;
  return router({
    companies: router({
      list: protectedProcedure.input(pageInputSchema).query(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.view");
        return listCompanies(input);
      }),
      create: protectedProcedure.input(companySchema).mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.manage");
        const db = await requireDb();
        const [result] = await db.insert(companies).values(input);
        const id = Number(result.insertId);
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "company",
          entityId: id,
          action: "created",
          summary: `Empresa ${input.name} criada.`,
        });
        return { id };
      }),
      update: protectedProcedure
        .input(idInputSchema.extend({ data: companySchema.partial() }))
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "admin.manage");
          if (input.data.status === "inactive") await assertCatalogCanArchive("company", input.id);
          const db = await requireDb();
          await db.update(companies).set(input.data).where(eq(companies.id, input.id));
          await recordAudit({
            actorUserId: ctx.user.id,
            entityType: "company",
            entityId: input.id,
            action: "updated",
            summary: "Empresa atualizada.",
          });
          return { success: true };
        }),
    }),
    modalities: router({
      list: protectedProcedure.input(pageInputSchema).query(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.view");
        return listModalities(input);
      }),
      create: protectedProcedure.input(modalitySchema).mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.manage");
        const db = await requireDb();
        const [r] = await db.insert(modalities).values(input);
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "modality",
          entityId: Number(r.insertId),
          action: "created",
          summary: `Modalidade ${input.name} criada.`,
        });
        return { id: Number(r.insertId) };
      }),
      update: protectedProcedure
        .input(idInputSchema.extend({ data: modalitySchema.partial() }))
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "admin.manage");
          if (input.data.status === "inactive") await assertCatalogCanArchive("modality", input.id);
          const db = await requireDb();
          await db.update(modalities).set(input.data).where(eq(modalities.id, input.id));
          return { success: true };
        }),
    }),
    areas: router({
      list: protectedProcedure.input(pageInputSchema).query(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.view");
        return listAreas(input);
      }),
      create: protectedProcedure.input(areaSchema).mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.manage");
        const db = await requireDb();
        const [r] = await db.insert(areas).values(input);
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "area",
          entityId: Number(r.insertId),
          action: "created",
          summary: `Área ${input.name} criada.`,
        });
        return { id: Number(r.insertId) };
      }),
      update: protectedProcedure
        .input(idInputSchema.extend({ data: areaSchema.partial() }))
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "admin.manage");
          if (input.data.status === "inactive") await assertCatalogCanArchive("area", input.id);
          const db = await requireDb();
          await db.update(areas).set(input.data).where(eq(areas.id, input.id));
          return { success: true };
        }),
    }),
    taxonomies: router({
      all: protectedProcedure.query(async ({ ctx }) => {
        await assertPermission(ctx.user, "admin.view");
        const db = await requireDb();
        const [categories, statuses, priorityList, profiles] = await Promise.all([
          db.select().from(projectCategories).orderBy(asc(projectCategories.name)),
          db.select().from(projectStatuses).orderBy(asc(projectStatuses.sortOrder)),
          db.select().from(priorities).orderBy(priorities.weight),
          db.select().from(roleProfiles).orderBy(asc(roleProfiles.name)),
        ]);
        return { categories, statuses, priorities: priorityList, profiles };
      }),
      createCategory: protectedProcedure.input(taxonomySchema).mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.manage");
        const db = await requireDb();
        const [r] = await db
          .insert(projectCategories)
          .values({ ...input, icon: input.icon ?? "Layers3" });
        return { id: Number(r.insertId) };
      }),
      updateCategory: protectedProcedure
        .input(idInputSchema.extend({ data: taxonomySchema.partial() }))
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "admin.manage");
          if (input.data.status === "inactive") await assertCatalogCanArchive("category", input.id);
          const db = await requireDb();
          await db
            .update(projectCategories)
            .set(input.data)
            .where(eq(projectCategories.id, input.id));
          return { success: true };
        }),
      createStatus: protectedProcedure
        .input(
          taxonomySchema.extend({
            sortOrder: z.number().int().min(0).default(0),
            isTerminal: z.boolean().default(false),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "admin.manage");
          const db = await requireDb();
          const [r] = await db
            .insert(projectStatuses)
            .values({ ...input, icon: input.icon ?? "CircleDot" });
          return { id: Number(r.insertId) };
        }),
      updateStatus: protectedProcedure
        .input(
          idInputSchema.extend({
            data: taxonomySchema
              .extend({ sortOrder: z.number().int().min(0), isTerminal: z.boolean() })
              .partial(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "admin.manage");
          if (input.data.status === "inactive")
            await assertCatalogCanArchive("project_status", input.id);
          const db = await requireDb();
          await db.update(projectStatuses).set(input.data).where(eq(projectStatuses.id, input.id));
          return { success: true };
        }),
      createPriority: protectedProcedure.input(prioritySchema).mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.manage");
        const db = await requireDb();
        const [r] = await db.insert(priorities).values(input);
        return { id: Number(r.insertId) };
      }),
      updatePriority: protectedProcedure
        .input(idInputSchema.extend({ data: prioritySchema.partial() }))
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "admin.manage");
          if (input.data.status === "inactive") await assertCatalogCanArchive("priority", input.id);
          const db = await requireDb();
          await db.update(priorities).set(input.data).where(eq(priorities.id, input.id));
          return { success: true };
        }),
    }),
    roles: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        await assertPermission(ctx.user, "admin.view");
        const db = await requireDb();
        const [profiles, permissionList, assignments] = await Promise.all([
          db.select().from(roleProfiles).orderBy(asc(roleProfiles.name)),
          db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.name)),
          db.select().from(roleProfilePermissions),
        ]);
        return { profiles, permissions: permissionList, assignments };
      }),
      create: protectedProcedure
        .input(
          z.object({
            name: z.string().trim().min(2).max(100),
            code: z
              .string()
              .trim()
              .min(2)
              .max(60)
              .regex(/^[a-z0-9_]+$/),
            description: z.string().max(3000).nullable().optional(),
            status: z.enum(["active", "inactive"]).default("active"),
            permissionIds: z.array(z.number().int().positive()).default([]),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "roles.manage");
          const db = await requireDb();
          const [r] = await db.insert(roleProfiles).values({
            name: input.name,
            code: input.code,
            description: input.description,
            status: input.status,
          });
          const id = Number(r.insertId);
          if (input.permissionIds.length)
            await db
              .insert(roleProfilePermissions)
              .values(
                input.permissionIds.map(permissionId => ({ roleProfileId: id, permissionId }))
              );
          await recordAudit({
            actorUserId: ctx.user.id,
            entityType: "role_profile",
            entityId: id,
            action: "created",
            summary: `Perfil ${input.name} criado.`,
          });
          return { id };
        }),
      update: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            name: z.string().trim().min(2).max(100),
            description: z.string().max(3000).nullable().optional(),
            status: z.enum(["active", "inactive"]),
            permissionIds: z.array(z.number().int().positive()),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "roles.manage");
          const db = await requireDb();
          await db.transaction(async tx => {
            await tx
              .update(roleProfiles)
              .set({ name: input.name, description: input.description, status: input.status })
              .where(eq(roleProfiles.id, input.id));
            await tx
              .delete(roleProfilePermissions)
              .where(eq(roleProfilePermissions.roleProfileId, input.id));
            if (input.permissionIds.length)
              await tx.insert(roleProfilePermissions).values(
                input.permissionIds.map(permissionId => ({
                  roleProfileId: input.id,
                  permissionId,
                }))
              );
          });
          await recordAudit({
            actorUserId: ctx.user.id,
            entityType: "role_profile",
            entityId: input.id,
            action: "updated",
            summary: `Perfil ${input.name} atualizado.`,
          });
          return { success: true };
        }),
    }),
    users: router({
      list: protectedProcedure.input(pageInputSchema).query(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.view");
        return listUsers(input);
      }),
      create: protectedProcedure
        .input(
          z.object({
            name: z.string().trim().min(2).max(180),
            email: z.string().trim().toLowerCase().email().max(320),
            jobTitle: z.string().max(160).nullable().optional(),
            areaId: z.number().int().positive().nullable().optional(),
            companyId: z.number().int().positive().nullable().optional(),
            roleProfileId: z.number().int().positive().nullable().optional(),
            phone: z.string().max(40).nullable().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "users.manage");
          const db = await requireDb();
          const normalizedEmail = normalizeInvitationEmail(input.email);
          const [existing] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);
          if (existing)
            throw new TRPCError({
              code: "CONFLICT",
              message: "Já existe um usuário cadastrado com este e-mail.",
            });
          const [r] = await db.insert(users).values(buildInvitedUser(input));
          const id = Number(r.insertId);
          await recordAudit({
            actorUserId: ctx.user.id,
            entityType: "user",
            entityId: id,
            action: "invited",
            summary: `Usuário ${normalizedEmail} incluído no diretório.`,
          });
          const invitation = await deliverInvitation({
            userId: id,
            recipientName: input.name,
            recipientEmail: normalizedEmail,
            requestedBy: ctx.user.id,
          });
          return { id, invitation };
        }),
      update: protectedProcedure
        .input(
          idInputSchema.extend({
            data: z.object({
              jobTitle: z.string().max(160).nullable().optional(),
              areaId: z.number().int().positive().nullable().optional(),
              companyId: z.number().int().positive().nullable().optional(),
              roleProfileId: z.number().int().positive().nullable().optional(),
              phone: z.string().max(40).nullable().optional(),
              status: z.enum(["invited", "active", "inactive", "blocked"]).optional(),
            }),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "users.manage");
          const db = await requireDb();
          await db.update(users).set(input.data).where(eq(users.id, input.id));
          await recordAudit({
            actorUserId: ctx.user.id,
            entityType: "user",
            entityId: input.id,
            action: "updated",
            summary: "Cadastro de usuário atualizado.",
          });
          return { success: true };
        }),
      invitationConfiguration: protectedProcedure.query(async ({ ctx }) => {
        await assertPermission(ctx.user, "users.manage");
        return getMicrosoftGraphMailReadiness();
      }),
      invitationStatus: protectedProcedure
        .input(z.object({ userIds: z.array(z.number().int().positive()).max(100) }))
        .query(async ({ ctx, input }) => {
          await assertPermission(ctx.user, "admin.view");
          if (!input.userIds.length) return [];
          const db = await requireDb();
          const rows = await db
            .select()
            .from(userInvitations)
            .where(inArray(userInvitations.userId, input.userIds))
            .orderBy(desc(userInvitations.requestedAt));
          const seen = new Set<number>();
          return rows.filter(row => {
            if (seen.has(row.userId)) return false;
            seen.add(row.userId);
            return true;
          });
        }),
      invitationHistory: protectedProcedure.input(idInputSchema).query(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "users.manage");
        const db = await requireDb();
        return db
          .select()
          .from(userInvitations)
          .where(eq(userInvitations.userId, input.id))
          .orderBy(desc(userInvitations.requestedAt));
      }),
      resendInvitation: protectedProcedure.input(idInputSchema).mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "users.manage");
        const db = await requireDb();
        const [user] = await db
          .select({ id: users.id, name: users.name, email: users.email, status: users.status })
          .from(users)
          .where(eq(users.id, input.id))
          .limit(1);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." });
        if (user.status !== "invited")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "O convite só pode ser reenviado para usuários com status Convidado.",
          });
        if (!user.email)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "O usuário não possui e-mail cadastrado.",
          });
        return deliverInvitation({
          userId: user.id,
          recipientName: user.name ?? "Olá",
          recipientEmail: user.email,
          requestedBy: ctx.user.id,
        });
      }),
    }),
  });
}

export const adminRouter = createAdminRouter();
