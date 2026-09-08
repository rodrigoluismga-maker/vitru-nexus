import { and, asc, count, eq, like, or } from "drizzle-orm";
import {
  areas,
  companies,
  modalities,
  projectActions,
  projects,
  users,
} from "../../drizzle/schema";
import { requireDb } from "./database";

export type PageRequest = {
  search: string;
  page: number;
  pageSize: number;
  status?: "active" | "inactive";
};

async function pageResult<T>(
  items: Promise<T[]>,
  total: Promise<Array<{ value: number }>>,
  input: PageRequest
) {
  const [rows, [countRow]] = await Promise.all([items, total]);
  return { items: rows, total: countRow?.value ?? 0, page: input.page, pageSize: input.pageSize };
}

export async function listCompanies(input: PageRequest) {
  const db = await requireDb();
  const where = and(
    input.status ? eq(companies.status, input.status) : undefined,
    input.search
      ? or(like(companies.name, `%${input.search}%`), like(companies.acronym, `%${input.search}%`))
      : undefined
  );
  return pageResult(
    db
      .select()
      .from(companies)
      .where(where)
      .orderBy(asc(companies.name))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db.select({ value: count() }).from(companies).where(where),
    input
  );
}

export async function listModalities(input: PageRequest) {
  const db = await requireDb();
  const where = and(
    input.status ? eq(modalities.status, input.status) : undefined,
    input.search ? like(modalities.name, `%${input.search}%`) : undefined
  );
  return pageResult(
    db
      .select()
      .from(modalities)
      .where(where)
      .orderBy(asc(modalities.name))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db.select({ value: count() }).from(modalities).where(where),
    input
  );
}

export async function listAreas(input: PageRequest) {
  const db = await requireDb();
  const where = and(
    input.status ? eq(areas.status, input.status) : undefined,
    input.search ? like(areas.name, `%${input.search}%`) : undefined
  );
  return pageResult(
    db
      .select()
      .from(areas)
      .where(where)
      .orderBy(asc(areas.name))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db.select({ value: count() }).from(areas).where(where),
    input
  );
}

export async function listUsers(input: PageRequest) {
  const db = await requireDb();
  const where = input.search
    ? or(like(users.name, `%${input.search}%`), like(users.email, `%${input.search}%`))
    : undefined;
  const selection = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      jobTitle: users.jobTitle,
      status: users.status,
      lastSignedIn: users.lastSignedIn,
      role: users.role,
      companyId: users.companyId,
      areaId: users.areaId,
      roleProfileId: users.roleProfileId,
    })
    .from(users)
    .where(where)
    .orderBy(asc(users.name))
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);
  return pageResult(selection, db.select({ value: count() }).from(users).where(where), input);
}

export function ensureNoArchiveReferences(referenceCount: number) {
  if (referenceCount > 0)
    throw new Error(
      `Arquivamento bloqueado: existem ${referenceCount} vínculo(s) ativo(s). Reclassifique os registros vinculados antes de continuar.`
    );
}

export async function assertCatalogCanArchive(
  kind: "company" | "modality" | "area" | "category" | "project_status" | "priority",
  id: number
) {
  const db = await requireDb();
  const counts: Array<Promise<Array<{ value: number }>>> = [];
  if (kind === "company")
    counts.push(
      db.select({ value: count() }).from(projects).where(eq(projects.companyId, id)),
      db.select({ value: count() }).from(users).where(eq(users.companyId, id))
    );
  if (kind === "modality")
    counts.push(db.select({ value: count() }).from(projects).where(eq(projects.modalityId, id)));
  if (kind === "area")
    counts.push(
      db.select({ value: count() }).from(projects).where(eq(projects.ownerAreaId, id)),
      db.select({ value: count() }).from(users).where(eq(users.areaId, id))
    );
  if (kind === "category")
    counts.push(db.select({ value: count() }).from(projects).where(eq(projects.categoryId, id)));
  if (kind === "project_status")
    counts.push(db.select({ value: count() }).from(projects).where(eq(projects.statusId, id)));
  if (kind === "priority")
    counts.push(
      db.select({ value: count() }).from(projects).where(eq(projects.priorityId, id)),
      db.select({ value: count() }).from(projectActions).where(eq(projectActions.priorityId, id))
    );
  const results = await Promise.all(counts);
  ensureNoArchiveReferences(results.reduce((sum, [row]) => sum + (row?.value ?? 0), 0));
}
