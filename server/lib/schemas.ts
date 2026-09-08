import { z } from "zod";

export const statusSchema = z.enum(["active", "inactive"]);
export const pageInputSchema = z.object({
  search: z.string().trim().max(160).default(""),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
  status: statusSchema.optional(),
});

export const idInputSchema = z.object({ id: z.number().int().positive() });
export const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use uma cor hexadecimal válida.");

export const companySchema = z.object({
  name: z.string().trim().min(2).max(180),
  shortName: z.string().trim().min(2).max(80),
  acronym: z.string().trim().min(2).max(30),
  status: statusSchema.default("active"),
  institutionalColor: colorSchema.default("#281352"),
  logoUrl: z.string().trim().max(1000).nullable().optional(),
  description: z.string().trim().max(3000).nullable().optional(),
});

export const modalitySchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(3000).nullable().optional(),
  status: statusSchema.default("active"),
  icon: z.string().trim().min(2).max(80).default("GraduationCap"),
  color: colorSchema.default("#6824D3"),
});

export const areaSchema = z.object({
  name: z.string().trim().min(2).max(160),
  managerId: z.number().int().positive().nullable().optional(),
  description: z.string().trim().max(3000).nullable().optional(),
  color: colorSchema.default("#8411CE"),
  icon: z.string().trim().min(2).max(80).default("Building2"),
  status: statusSchema.default("active"),
});

export const taxonomySchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9_]+$/),
  description: z.string().trim().max(3000).nullable().optional(),
  color: colorSchema,
  icon: z.string().trim().min(2).max(80).optional(),
  status: statusSchema.default("active"),
});

export const prioritySchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/),
  weight: z.number().int().min(1).max(100),
  color: colorSchema,
  status: statusSchema.default("active"),
});

export const projectSchema = z
  .object({
    name: z.string().trim().min(3).max(220),
    code: z.string().trim().min(2).max(60),
    description: z.string().trim().max(5000).nullable().optional(),
    companyId: z.number().int().positive(),
    ownerAreaId: z.number().int().positive(),
    modalityId: z.number().int().positive().nullable().optional(),
    managerId: z.number().int().positive().nullable().optional(),
    executiveSponsorId: z.number().int().positive().nullable().optional(),
    categoryId: z.number().int().positive(),
    statusId: z.number().int().positive(),
    priorityId: z.number().int().positive(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
    objective: z.string().trim().max(5000).nullable().optional(),
    color: colorSchema.default("#6824D3"),
    icon: z.string().trim().min(2).max(80).default("FolderKanban"),
    coverUrl: z.string().trim().max(1000).nullable().optional(),
    progress: z.number().int().min(0).max(100).default(0),
    health: z.enum(["healthy", "attention", "critical", "unassessed"]).default("unassessed"),
  })
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate)
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A data final não pode ser anterior à data inicial.",
      });
  });
