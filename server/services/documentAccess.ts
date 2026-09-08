import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  decisions,
  documents,
  projectActions,
  projectMembers,
  projects,
  roleProfiles,
  users,
  type User,
} from "../../drizzle/schema";
import { requireDb } from "../data/database";
import { hasPermission } from "../lib/rbac";

export type DocumentAccessLevel = "project" | "restricted" | "executive";

export type DocumentAccessFacts = {
  role: "user" | "admin";
  roleProfileCode: string | null;
  memberRole: "sponsor" | "manager" | "member" | "viewer" | null;
  isManager: boolean;
  isSponsor: boolean;
  isUploader: boolean;
  canViewPortfolio: boolean;
  canManageProjects: boolean;
};

const executiveProfiles = new Set(["administrator", "director", "finance_executive"]);

export function canAccessDocument(level: DocumentAccessLevel, facts: DocumentAccessFacts): boolean {
  if (facts.role === "admin") return true;
  if (level === "project") {
    return (
      facts.canViewPortfolio || facts.isManager || facts.isSponsor || Boolean(facts.memberRole)
    );
  }
  if (level === "restricted") {
    return (
      facts.isUploader ||
      facts.canManageProjects ||
      facts.isManager ||
      facts.isSponsor ||
      facts.memberRole === "manager" ||
      facts.memberRole === "sponsor"
    );
  }
  return facts.isSponsor || executiveProfiles.has(facts.roleProfileCode ?? "");
}

export async function resolveTargetProjectId(input: {
  projectId?: number | null;
  actionId?: number | null;
  decisionId?: number | null;
}): Promise<number> {
  const db = await requireDb();
  const candidates: number[] = [];
  if (input.projectId) candidates.push(input.projectId);
  if (input.actionId) {
    const [action] = await db
      .select({ projectId: projectActions.projectId })
      .from(projectActions)
      .where(eq(projectActions.id, input.actionId))
      .limit(1);
    if (!action)
      throw new TRPCError({ code: "NOT_FOUND", message: "Ação vinculada não encontrada." });
    candidates.push(action.projectId);
  }
  if (input.decisionId) {
    const [decision] = await db
      .select({ projectId: decisions.projectId })
      .from(decisions)
      .where(eq(decisions.id, input.decisionId))
      .limit(1);
    if (!decision)
      throw new TRPCError({ code: "NOT_FOUND", message: "Decisão vinculada não encontrada." });
    candidates.push(decision.projectId);
  }
  const unique = Array.from(new Set(candidates));
  if (unique.length !== 1)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: unique.length
        ? "Os vínculos do documento pertencem a projetos diferentes."
        : "Vincule o documento a um projeto, ação ou decisão.",
    });
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, unique[0]))
    .limit(1);
  if (!project)
    throw new TRPCError({ code: "NOT_FOUND", message: "Projeto vinculado não encontrado." });
  return project.id;
}

async function getAccessFacts(
  user: User,
  projectId: number | null,
  uploadedBy: number | null
): Promise<DocumentAccessFacts> {
  const db = await requireDb();
  const [[identity], projectRows, memberRows, canViewPortfolio, canManageProjects] =
    await Promise.all([
      db
        .select({ roleProfileCode: roleProfiles.code })
        .from(users)
        .leftJoin(roleProfiles, eq(roleProfiles.id, users.roleProfileId))
        .where(eq(users.id, user.id))
        .limit(1),
      projectId
        ? db
            .select({ managerId: projects.managerId, sponsorId: projects.executiveSponsorId })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)
        : Promise.resolve([]),
      projectId
        ? db
            .select({ memberRole: projectMembers.memberRole })
            .from(projectMembers)
            .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)))
            .limit(1)
        : Promise.resolve([]),
      hasPermission(user, "projects.view"),
      hasPermission(user, "projects.manage"),
    ]);
  const project = projectRows[0];
  const member = memberRows[0];
  return {
    role: user.role,
    roleProfileCode: identity?.roleProfileCode ?? null,
    memberRole: member?.memberRole ?? null,
    isManager: project?.managerId === user.id,
    isSponsor: project?.sponsorId === user.id,
    isUploader: uploadedBy === user.id,
    canViewPortfolio,
    canManageProjects,
  };
}

export async function assertDocumentAccess(
  user: User,
  document: {
    accessLevel: DocumentAccessLevel;
    projectId: number | null;
    uploadedBy: number | null;
  }
): Promise<void> {
  const facts = await getAccessFacts(user, document.projectId, document.uploadedBy);
  if (!canAccessDocument(document.accessLevel, facts))
    throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado." });
}

export async function assertDocumentWriteAccess(user: User, projectId: number): Promise<void> {
  const facts = await getAccessFacts(user, projectId, user.id);
  const isProjectParticipant = facts.isManager || facts.isSponsor || Boolean(facts.memberRole);
  if (user.role !== "admin" && !facts.canManageProjects && !isProjectParticipant) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não possui acesso de escrita neste projeto.",
    });
  }
}

export async function getAuthorizedDocument(user: User, documentId: number) {
  const db = await requireDb();
  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado." });
  await assertDocumentAccess(user, document);
  return document;
}
