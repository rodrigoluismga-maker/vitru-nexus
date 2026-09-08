import {
  AnyMySqlColumn,
  bigint,
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const statusValues = ["active", "inactive"] as const;
const projectHealthValues = ["healthy", "attention", "critical", "unassessed"] as const;

export const companies = mysqlTable(
  "companies",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    shortName: varchar("shortName", { length: 80 }).notNull(),
    acronym: varchar("acronym", { length: 30 }).notNull(),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    institutionalColor: varchar("institutionalColor", { length: 9 }).default("#281352").notNull(),
    logoKey: varchar("logoKey", { length: 500 }),
    logoUrl: varchar("logoUrl", { length: 1000 }),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("companies_name_uidx").on(table.name),
    index("companies_status_idx").on(table.status),
  ]
);

export const modalities = mysqlTable(
  "modalities",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    icon: varchar("icon", { length: 80 }).default("GraduationCap").notNull(),
    color: varchar("color", { length: 9 }).default("#6824D3").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("modalities_name_uidx").on(table.name),
    index("modalities_status_idx").on(table.status),
  ]
);

export const roleProfiles = mysqlTable(
  "role_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 60 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    isSystem: boolean("isSystem").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("role_profiles_code_uidx").on(table.code),
    index("role_profiles_status_idx").on(table.status),
  ]
);

export const areas = mysqlTable(
  "areas",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    managerId: int("managerId").references((): AnyMySqlColumn => users.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    color: varchar("color", { length: 9 }).default("#8411CE").notNull(),
    icon: varchar("icon", { length: 80 }).default("Building2").notNull(),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("areas_name_uidx").on(table.name),
    index("areas_status_idx").on(table.status),
  ]
);

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    photoKey: varchar("photoKey", { length: 500 }),
    photoUrl: varchar("photoUrl", { length: 1000 }),
    jobTitle: varchar("jobTitle", { length: 160 }),
    areaId: int("areaId").references(() => areas.id, { onDelete: "set null" }),
    companyId: int("companyId").references(() => companies.id, { onDelete: "set null" }),
    roleProfileId: int("roleProfileId").references(() => roleProfiles.id, { onDelete: "set null" }),
    phone: varchar("phone", { length: 40 }),
    status: mysqlEnum("status", ["invited", "active", "inactive", "blocked"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn"),
  },
  table => [
    index("users_company_idx").on(table.companyId),
    index("users_area_idx").on(table.areaId),
    index("users_profile_idx").on(table.roleProfileId),
    index("users_status_idx").on(table.status),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const userInvitations = mysqlTable(
  "user_invitations",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
    senderEmail: varchar("senderEmail", { length: 320 }),
    provider: varchar("provider", { length: 60 }).default("microsoft_graph").notNull(),
    status: mysqlEnum("status", ["pending", "accepted", "failed", "activated"])
      .default("pending")
      .notNull(),
    attempt: int("attempt").default(1).notNull(),
    requestedBy: int("requestedBy").references(() => users.id, { onDelete: "set null" }),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    acceptedAt: timestamp("acceptedAt"),
    failedAt: timestamp("failedAt"),
    activatedAt: timestamp("activatedAt"),
    providerRequestId: varchar("providerRequestId", { length: 255 }),
    errorCode: varchar("errorCode", { length: 120 }),
    errorMessage: varchar("errorMessage", { length: 500 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
  },
  table => [
    index("user_invitations_user_requested_idx").on(table.userId, table.requestedAt),
    index("user_invitations_email_status_idx").on(table.recipientEmail, table.status),
  ]
);

export const permissions = mysqlTable(
  "permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 140 }).notNull(),
    module: varchar("module", { length: 80 }).notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("permissions_code_uidx").on(table.code),
    index("permissions_module_idx").on(table.module),
  ]
);

export const roleProfilePermissions = mysqlTable(
  "role_profile_permissions",
  {
    roleProfileId: int("roleProfileId")
      .notNull()
      .references(() => roleProfiles.id, { onDelete: "cascade" }),
    permissionId: int("permissionId")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.roleProfileId, table.permissionId] })]
);

export const userPermissionOverrides = mysqlTable(
  "user_permission_overrides",
  {
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: int("permissionId")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    effect: mysqlEnum("effect", ["allow", "deny"]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.userId, table.permissionId] })]
);

export const projectCategories = mysqlTable(
  "project_categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 60 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 9 }).default("#6824D3").notNull(),
    icon: varchar("icon", { length: 80 }).default("Layers3").notNull(),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("project_categories_code_uidx").on(table.code),
    index("project_categories_status_idx").on(table.status),
  ]
);

export const projectStatuses = mysqlTable(
  "project_statuses",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 60 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 9 }).notNull(),
    icon: varchar("icon", { length: 80 }).default("CircleDot").notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    isTerminal: boolean("isTerminal").default(false).notNull(),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("project_statuses_code_uidx").on(table.code),
    index("project_statuses_order_idx").on(table.sortOrder),
  ]
);

export const priorities = mysqlTable(
  "priorities",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    weight: int("weight").notNull(),
    color: varchar("color", { length: 9 }).notNull(),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("priorities_code_uidx").on(table.code),
    index("priorities_weight_idx").on(table.weight),
  ]
);

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 220 }).notNull(),
    code: varchar("code", { length: 60 }).notNull(),
    description: text("description"),
    companyId: int("companyId")
      .notNull()
      .references(() => companies.id),
    ownerAreaId: int("ownerAreaId")
      .notNull()
      .references(() => areas.id),
    modalityId: int("modalityId").references(() => modalities.id, { onDelete: "set null" }),
    managerId: int("managerId").references(() => users.id, { onDelete: "set null" }),
    executiveSponsorId: int("executiveSponsorId").references(() => users.id, {
      onDelete: "set null",
    }),
    categoryId: int("categoryId")
      .notNull()
      .references(() => projectCategories.id),
    statusId: int("statusId")
      .notNull()
      .references(() => projectStatuses.id),
    priorityId: int("priorityId")
      .notNull()
      .references(() => priorities.id),
    startDate: timestamp("startDate"),
    endDate: timestamp("endDate"),
    objective: text("objective"),
    color: varchar("color", { length: 9 }).default("#6824D3").notNull(),
    icon: varchar("icon", { length: 80 }).default("FolderKanban").notNull(),
    coverKey: varchar("coverKey", { length: 500 }),
    coverUrl: varchar("coverUrl", { length: 1000 }),
    workspaceTemplate: varchar("workspaceTemplate", { length: 60 }).default("universal").notNull(),
    progress: int("progress").default(0).notNull(),
    health: mysqlEnum("health", projectHealthValues).default("unassessed").notNull(),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    updatedBy: int("updatedBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("projects_code_uidx").on(table.code),
    index("projects_company_idx").on(table.companyId),
    index("projects_area_idx").on(table.ownerAreaId),
    index("projects_status_idx").on(table.statusId),
    index("projects_health_idx").on(table.health),
  ]
);

export const projectMembers = mysqlTable(
  "project_members",
  {
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    memberRole: mysqlEnum("memberRole", ["sponsor", "manager", "member", "viewer"])
      .default("member")
      .notNull(),
    responsibility: varchar("responsibility", { length: 220 }),
    isPrimary: boolean("isPrimary").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    primaryKey({ columns: [table.projectId, table.userId] }),
    index("project_members_user_idx").on(table.userId),
  ]
);

export const tags = mysqlTable(
  "tags",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    color: varchar("color", { length: 9 }).default("#A689F7").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("tags_name_uidx").on(table.name)]
);

export const projectTags = mysqlTable(
  "project_tags",
  {
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: int("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  table => [primaryKey({ columns: [table.projectId, table.tagId] })]
);

export const projectIndicators = mysqlTable(
  "project_indicators",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description"),
    unit: varchar("unit", { length: 40 }),
    direction: mysqlEnum("direction", ["higher", "lower", "target"]).default("target").notNull(),
    targetValue: decimal("targetValue", { precision: 20, scale: 4 }),
    currentValue: decimal("currentValue", { precision: 20, scale: 4 }),
    periodLabel: varchar("periodLabel", { length: 80 }),
    source: varchar("source", { length: 255 }),
    status: mysqlEnum("status", ["on_track", "attention", "critical", "unassessed"])
      .default("unassessed")
      .notNull(),
    ownerId: int("ownerId").references(() => users.id, { onDelete: "set null" }),
    measuredAt: timestamp("measuredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("project_indicators_project_idx").on(table.projectId),
    index("project_indicators_status_idx").on(table.status),
  ]
);

export const projectActions = mysqlTable(
  "project_actions",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    ownerId: int("ownerId").references(() => users.id, { onDelete: "set null" }),
    areaId: int("areaId").references(() => areas.id, { onDelete: "set null" }),
    startDate: timestamp("startDate"),
    dueDate: timestamp("dueDate"),
    status: mysqlEnum("status", ["todo", "in_progress", "blocked", "done", "cancelled"])
      .default("todo")
      .notNull(),
    priorityId: int("priorityId").references(() => priorities.id, { onDelete: "set null" }),
    progress: int("progress").default(0).notNull(),
    estimatedHours: decimal("estimatedHours", { precision: 10, scale: 2 }),
    actualHours: decimal("actualHours", { precision: 10, scale: 2 }),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    updatedBy: int("updatedBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("project_actions_project_idx").on(table.projectId),
    index("project_actions_owner_idx").on(table.ownerId),
    index("project_actions_due_idx").on(table.dueDate),
    index("project_actions_status_idx").on(table.status),
  ]
);

export const actionDependencies = mysqlTable(
  "action_dependencies",
  {
    actionId: int("actionId")
      .notNull()
      .references(() => projectActions.id, { onDelete: "cascade" }),
    dependsOnActionId: int("dependsOnActionId")
      .notNull()
      .references(() => projectActions.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.actionId, table.dependsOnActionId] })]
);

export const actionChecklistItems = mysqlTable(
  "action_checklist_items",
  {
    id: int("id").autoincrement().primaryKey(),
    actionId: int("actionId")
      .notNull()
      .references(() => projectActions.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 240 }).notNull(),
    isCompleted: boolean("isCompleted").default(false).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    completedAt: timestamp("completedAt"),
    completedBy: int("completedBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("action_checklist_action_idx").on(table.actionId)]
);

export const risks = mysqlTable(
  "risks",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    probability: int("probability").default(1).notNull(),
    impact: int("impact").default(1).notNull(),
    status: mysqlEnum("status", ["open", "mitigating", "accepted", "closed"])
      .default("open")
      .notNull(),
    ownerId: int("ownerId").references(() => users.id, { onDelete: "set null" }),
    dueDate: timestamp("dueDate"),
    mitigation: text("mitigation"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("risks_project_idx").on(table.projectId),
    index("risks_status_idx").on(table.status),
  ]
);

export const milestones = mysqlTable(
  "milestones",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    dueDate: timestamp("dueDate"),
    status: mysqlEnum("status", ["planned", "in_progress", "delayed", "done", "cancelled"])
      .default("planned")
      .notNull(),
    ownerId: int("ownerId").references(() => users.id, { onDelete: "set null" }),
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("milestones_project_idx").on(table.projectId),
    index("milestones_due_idx").on(table.dueDate),
  ]
);

export const deliveries = mysqlTable(
  "deliveries",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    milestoneId: int("milestoneId").references(() => milestones.id, { onDelete: "set null" }),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    dueDate: timestamp("dueDate"),
    status: mysqlEnum("status", ["planned", "in_progress", "delayed", "delivered", "cancelled"])
      .default("planned")
      .notNull(),
    ownerId: int("ownerId").references(() => users.id, { onDelete: "set null" }),
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("deliveries_project_idx").on(table.projectId),
    index("deliveries_due_idx").on(table.dueDate),
  ]
);

export const decisions = mysqlTable(
  "decisions",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    context: text("context"),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "deferred"])
      .default("pending")
      .notNull(),
    ownerId: int("ownerId").references(() => users.id, { onDelete: "set null" }),
    deciderId: int("deciderId").references(() => users.id, { onDelete: "set null" }),
    dueDate: timestamp("dueDate"),
    decidedAt: timestamp("decidedAt"),
    decision: text("decision"),
    impact: text("impact"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("decisions_project_idx").on(table.projectId),
    index("decisions_status_idx").on(table.status),
    index("decisions_due_idx").on(table.dueDate),
  ]
);

export const comments = mysqlTable(
  "comments",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").references(() => projects.id, { onDelete: "cascade" }),
    actionId: int("actionId").references(() => projectActions.id, { onDelete: "cascade" }),
    decisionId: int("decisionId").references(() => decisions.id, { onDelete: "cascade" }),
    parentId: int("parentId").references((): AnyMySqlColumn => comments.id, {
      onDelete: "cascade",
    }),
    authorId: int("authorId")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    editedAt: timestamp("editedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("comments_project_idx").on(table.projectId),
    index("comments_action_idx").on(table.actionId),
    index("comments_decision_idx").on(table.decisionId),
  ]
);

export const documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").references(() => projects.id, { onDelete: "cascade" }),
    actionId: int("actionId").references(() => projectActions.id, { onDelete: "cascade" }),
    decisionId: int("decisionId").references(() => decisions.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    kind: mysqlEnum("kind", ["file", "link"]).default("file").notNull(),
    fileName: varchar("fileName", { length: 255 }),
    mimeType: varchar("mimeType", { length: 160 }),
    fileSize: bigint("fileSize", { mode: "number" }),
    storageKey: varchar("storageKey", { length: 700 }),
    url: varchar("url", { length: 1200 }),
    externalUrl: varchar("externalUrl", { length: 1200 }),
    category: varchar("category", { length: 100 }),
    version: varchar("version", { length: 40 }).default("1.0").notNull(),
    tags: json("tags").$type<string[]>(),
    accessLevel: mysqlEnum("accessLevel", ["project", "restricted", "executive"])
      .default("project")
      .notNull(),
    uploadedBy: int("uploadedBy").references(() => users.id, { onDelete: "set null" }),
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("documents_project_idx").on(table.projectId),
    index("documents_action_idx").on(table.actionId),
    index("documents_decision_idx").on(table.decisionId),
  ]
);

export const auditEvents = mysqlTable(
  "audit_events",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: varchar("entityId", { length: 80 }).notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    summary: varchar("summary", { length: 300 }).notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("audit_entity_idx").on(table.entityType, table.entityId),
    index("audit_created_idx").on(table.createdAt),
  ]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 80 }).notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    message: text("message"),
    severity: mysqlEnum("severity", ["info", "attention", "critical"]).default("info").notNull(),
    sourceEntityType: varchar("sourceEntityType", { length: 80 }),
    sourceEntityId: varchar("sourceEntityId", { length: 80 }),
    dedupeKey: varchar("dedupeKey", { length: 220 }),
    dueAt: timestamp("dueAt"),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("notifications_dedupe_uidx").on(table.dedupeKey),
    index("notifications_user_read_idx").on(table.userId, table.readAt),
    index("notifications_created_idx").on(table.createdAt),
  ]
);

export const notificationPreferences = mysqlTable(
  "notification_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inApp: boolean("inApp").default(true).notNull(),
    overdueActions: boolean("overdueActions").default(true).notNull(),
    pendingDecisions: boolean("pendingDecisions").default(true).notNull(),
    projectUpdates: boolean("projectUpdates").default(true).notNull(),
    dailyDigest: boolean("dailyDigest").default(false).notNull(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("notification_preferences_user_uidx").on(table.userId),
    index("notification_preferences_task_idx").on(table.scheduleCronTaskUid),
  ]
);

export const expansionCities = mysqlTable(
  "expansion_cities",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    stateCode: varchar("stateCode", { length: 2 }).notNull(),
    region: varchar("region", { length: 80 }),
    ibgeCode: varchar("ibgeCode", { length: 12 }),
    population: bigint("population", { mode: "number" }),
    populationReferenceYear: int("populationReferenceYear"),
    populationSource: varchar("populationSource", { length: 1000 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    stage: mysqlEnum("stage", [
      "prospecting",
      "study",
      "approval",
      "implementation",
      "operation",
      "paused",
      "cancelled",
    ])
      .default("prospecting")
      .notNull(),
    health: mysqlEnum("health", projectHealthValues).default("unassessed").notNull(),
    marketPotentialScore: decimal("marketPotentialScore", { precision: 5, scale: 2 }),
    attractionScore: decimal("attractionScore", { precision: 5, scale: 2 }),
    competitionScore: decimal("competitionScore", { precision: 5, scale: 2 }),
    operationalReadinessScore: decimal("operationalReadinessScore", { precision: 5, scale: 2 }),
    overallScore: decimal("overallScore", { precision: 5, scale: 2 }),
    targetOpeningDate: timestamp("targetOpeningDate"),
    notes: text("notes"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    updatedBy: int("updatedBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("expansion_cities_project_name_state_uidx").on(
      table.projectId,
      table.name,
      table.stateCode
    ),
    index("expansion_cities_project_idx").on(table.projectId),
    index("expansion_cities_stage_idx").on(table.stage),
    index("expansion_cities_health_idx").on(table.health),
  ]
);

export const expansionOffers = mysqlTable(
  "expansion_offers",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    cityId: int("cityId")
      .notNull()
      .references(() => expansionCities.id, { onDelete: "cascade" }),
    companyId: int("companyId")
      .notNull()
      .references(() => companies.id),
    modalityId: int("modalityId").references(() => modalities.id, { onDelete: "set null" }),
    courseName: varchar("courseName", { length: 180 }).notNull(),
    courseCode: varchar("courseCode", { length: 60 }),
    degreeType: varchar("degreeType", { length: 80 }),
    shift: varchar("shift", { length: 80 }),
    entryPeriod: varchar("entryPeriod", { length: 40 }),
    grossPrice: decimal("grossPrice", { precision: 14, scale: 2 }),
    launchDiscount: decimal("launchDiscount", { precision: 7, scale: 4 }),
    targetNetPrice: decimal("targetNetPrice", { precision: 14, scale: 2 }),
    capacity: int("capacity"),
    status: mysqlEnum("status", [
      "study",
      "approved",
      "implementation",
      "active",
      "paused",
      "cancelled",
    ])
      .default("study")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("expansion_offers_project_idx").on(table.projectId),
    index("expansion_offers_city_idx").on(table.cityId),
    index("expansion_offers_company_idx").on(table.companyId),
  ]
);

export const expansionScenarios = mysqlTable(
  "expansion_scenarios",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    cityId: int("cityId").references(() => expansionCities.id, { onDelete: "cascade" }),
    name: mysqlEnum("name", ["conservative", "base", "accelerated"]).notNull(),
    periodLabel: varchar("periodLabel", { length: 80 }).notNull(),
    targetEnrollments: int("targetEnrollments"),
    targetLeads: int("targetLeads"),
    conversionRate: decimal("conversionRate", { precision: 7, scale: 4 }),
    averageTicket: decimal("averageTicket", { precision: 14, scale: 2 }),
    grossRevenue: decimal("grossRevenue", { precision: 18, scale: 2 }),
    totalInvestment: decimal("totalInvestment", { precision: 18, scale: 2 }),
    digitalShare: decimal("digitalShare", { precision: 7, scale: 4 }),
    assumptions: text("assumptions"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("expansion_scenarios_project_idx").on(table.projectId),
    index("expansion_scenarios_city_idx").on(table.cityId),
    index("expansion_scenarios_period_idx").on(table.periodLabel),
  ]
);

export const expansionCompetitors = mysqlTable(
  "expansion_competitors",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    cityId: int("cityId")
      .notNull()
      .references(() => expansionCities.id, { onDelete: "cascade" }),
    institutionName: varchar("institutionName", { length: 180 }).notNull(),
    isPrivate: boolean("isPrivate").default(true).notNull(),
    courseName: varchar("courseName", { length: 180 }),
    modality: varchar("modality", { length: 100 }),
    grossPrice: decimal("grossPrice", { precision: 14, scale: 2 }),
    netPrice: decimal("netPrice", { precision: 14, scale: 2 }),
    evidenceSource: varchar("evidenceSource", { length: 1000 }),
    evidenceDate: timestamp("evidenceDate"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("expansion_competitors_project_idx").on(table.projectId),
    index("expansion_competitors_city_idx").on(table.cityId),
    index("expansion_competitors_private_idx").on(table.isPrivate),
  ]
);

export const expansionMediaPlans = mysqlTable(
  "expansion_media_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    cityId: int("cityId")
      .notNull()
      .references(() => expansionCities.id, { onDelete: "cascade" }),
    campaignName: varchar("campaignName", { length: 180 }).notNull(),
    channelName: varchar("channelName", { length: 140 }).notNull(),
    channelType: mysqlEnum("channelType", [
      "digital",
      "offline",
      "partnership",
      "event",
      "other",
    ]).notNull(),
    objective: varchar("objective", { length: 220 }),
    investment: decimal("investment", { precision: 18, scale: 2 }),
    targetLeads: int("targetLeads"),
    targetEnrollments: int("targetEnrollments"),
    startDate: timestamp("startDate"),
    endDate: timestamp("endDate"),
    ownerId: int("ownerId").references(() => users.id, { onDelete: "set null" }),
    status: mysqlEnum("status", ["planned", "active", "completed", "paused", "cancelled"])
      .default("planned")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("expansion_media_project_idx").on(table.projectId),
    index("expansion_media_city_idx").on(table.cityId),
    index("expansion_media_period_idx").on(table.startDate, table.endDate),
  ]
);

export const expansionSalesPlans = mysqlTable(
  "expansion_sales_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    cityId: int("cityId")
      .notNull()
      .references(() => expansionCities.id, { onDelete: "cascade" }),
    channelName: varchar("channelName", { length: 140 }).notNull(),
    ownerId: int("ownerId").references(() => users.id, { onDelete: "set null" }),
    plannedHeadcount: int("plannedHeadcount"),
    currentHeadcount: int("currentHeadcount"),
    targetLeads: int("targetLeads"),
    targetEnrollments: int("targetEnrollments"),
    actualEnrollments: int("actualEnrollments"),
    readiness: mysqlEnum("readiness", [
      "not_started",
      "mobilizing",
      "ready",
      "operating",
      "blocked",
    ])
      .default("not_started")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("expansion_sales_project_idx").on(table.projectId),
    index("expansion_sales_city_idx").on(table.cityId),
    index("expansion_sales_owner_idx").on(table.ownerId),
  ]
);

export const expansionMetrics = mysqlTable(
  "expansion_metrics",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    cityId: int("cityId").references(() => expansionCities.id, { onDelete: "cascade" }),
    offerId: int("offerId").references(() => expansionOffers.id, { onDelete: "cascade" }),
    scenarioId: int("scenarioId").references(() => expansionScenarios.id, { onDelete: "cascade" }),
    metricCode: varchar("metricCode", { length: 80 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    unit: varchar("unit", { length: 40 }),
    periodLabel: varchar("periodLabel", { length: 80 }).notNull(),
    targetValue: decimal("targetValue", { precision: 20, scale: 4 }),
    actualValue: decimal("actualValue", { precision: 20, scale: 4 }),
    forecastValue: decimal("forecastValue", { precision: 20, scale: 4 }),
    source: varchar("source", { length: 500 }),
    measuredAt: timestamp("measuredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("expansion_metrics_project_idx").on(table.projectId),
    index("expansion_metrics_city_idx").on(table.cityId),
    index("expansion_metrics_period_idx").on(table.periodLabel),
    index("expansion_metrics_code_idx").on(table.metricCode),
  ]
);

// Finance domain — top-level Nexus module linked to Planejamento Orçamentário 2027.
export const financeCycles = mysqlTable(
  "finance_cycles",
  {
    id: int("id").autoincrement().primaryKey(),
    fiscalYear: int("fiscalYear").notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    startPeriod: varchar("startPeriod", { length: 7 }).notNull(),
    endPeriod: varchar("endPeriod", { length: 7 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
    status: mysqlEnum("status", ["planned", "open", "closed", "archived"])
      .default("planned")
      .notNull(),
    linkedProjectId: int("linkedProjectId").references(() => projects.id, { onDelete: "set null" }),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("fin_cycles_code_uidx").on(table.code),
    uniqueIndex("fin_cycles_year_uidx").on(table.fiscalYear),
    index("fin_cycles_status_idx").on(table.status),
  ]
);

export const financeVersions = mysqlTable(
  "finance_versions",
  {
    id: int("id").autoincrement().primaryKey(),
    cycleId: int("cycleId")
      .notNull()
      .references(() => financeCycles.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 60 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    versionType: mysqlEnum("versionType", [
      "budget_original",
      "budget_revision",
      "forecast",
    ]).notNull(),
    versionNumber: int("versionNumber").default(1).notNull(),
    status: mysqlEnum("status", ["draft", "submitted", "approved", "superseded", "locked"])
      .default("draft")
      .notNull(),
    effectivePeriod: varchar("effectivePeriod", { length: 7 }),
    notes: text("notes"),
    approvedBy: int("approvedBy").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approvedAt"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("fin_versions_cycle_code_uidx").on(table.cycleId, table.code),
    index("fin_versions_cycle_status_idx").on(table.cycleId, table.status),
  ]
);

export const financeDimensions = mysqlTable(
  "finance_dimensions",
  {
    id: int("id").autoincrement().primaryKey(),
    dimensionType: varchar("dimensionType", { length: 60 }).notNull(),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    parentId: int("parentId").references((): AnyMySqlColumn => financeDimensions.id, {
      onDelete: "set null",
    }),
    companyId: int("companyId").references(() => companies.id, { onDelete: "set null" }),
    areaId: int("areaId").references(() => areas.id, { onDelete: "set null" }),
    modalityId: int("modalityId").references(() => modalities.id, { onDelete: "set null" }),
    projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
    ownerUserId: int("ownerUserId").references(() => users.id, { onDelete: "set null" }),
    externalCode: varchar("externalCode", { length: 160 }),
    taxId: varchar("taxId", { length: 30 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    effectiveFrom: timestamp("effectiveFrom"),
    effectiveTo: timestamp("effectiveTo"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("fin_dims_type_code_uidx").on(table.dimensionType, table.code),
    index("fin_dims_type_status_idx").on(table.dimensionType, table.status),
    index("fin_dims_owner_idx").on(table.ownerUserId),
  ]
);

export const financeUserScopes = mysqlTable(
  "finance_user_scopes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scopeType: varchar("scopeType", { length: 60 }).notNull(),
    scopeId: int("scopeId"),
    accessLevel: mysqlEnum("accessLevel", ["view", "contribute", "approve", "admin"])
      .default("view")
      .notNull(),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("fin_scopes_user_type_id_uidx").on(table.userId, table.scopeType, table.scopeId),
    index("fin_scopes_user_idx").on(table.userId),
  ]
);

export const financeImportBatches = mysqlTable(
  "finance_import_batches",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    cycleId: int("cycleId").references(() => financeCycles.id, { onDelete: "set null" }),
    versionId: int("versionId").references(() => financeVersions.id, { onDelete: "set null" }),
    loadType: mysqlEnum("loadType", [
      "budget",
      "actual",
      "commitment",
      "forecast",
      "allocation",
      "dimension",
    ]).notNull(),
    mode: mysqlEnum("mode", ["append", "replace_scope", "reversal"]).default("append").notNull(),
    status: mysqlEnum("status", [
      "uploaded",
      "staging",
      "validation_failed",
      "mapping_required",
      "ready_for_review",
      "approval_pending",
      "approved",
      "committed",
      "rejected",
      "reversed",
    ])
      .default("uploaded")
      .notNull(),
    sourceSystem: varchar("sourceSystem", { length: 120 }).notNull(),
    fileName: varchar("fileName", { length: 500 }).notNull(),
    fileKey: varchar("fileKey", { length: 1000 }).notNull(),
    fileUrl: varchar("fileUrl", { length: 1200 }).notNull(),
    fileHash: varchar("fileHash", { length: 64 }).notNull(),
    fileSize: bigint("fileSize", { mode: "number" }).notNull(),
    scope: json("scope").$type<Record<string, unknown>>(),
    rowCount: int("rowCount").default(0).notNull(),
    acceptedCount: int("acceptedCount").default(0).notNull(),
    rejectedCount: int("rejectedCount").default(0).notNull(),
    warningCount: int("warningCount").default(0).notNull(),
    previousAmount: decimal("previousAmount", { precision: 20, scale: 2 }),
    removedAmount: decimal("removedAmount", { precision: 20, scale: 2 }),
    addedAmount: decimal("addedAmount", { precision: 20, scale: 2 }),
    variationAmount: decimal("variationAmount", { precision: 20, scale: 2 }),
    totalAmount: decimal("totalAmount", { precision: 20, scale: 2 }),
    notes: text("notes"),
    reversalOfBatchId: bigint("reversalOfBatchId", { mode: "number" }).references(
      (): AnyMySqlColumn => financeImportBatches.id,
      { onDelete: "set null" }
    ),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    approvedBy: int("approvedBy").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approvedAt"),
    committedAt: timestamp("committedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("fin_batches_status_idx").on(table.status),
    index("fin_batches_hash_idx").on(table.fileHash),
    index("fin_batches_cycle_type_idx").on(table.cycleId, table.loadType),
    index("fin_batches_created_idx").on(table.createdAt),
  ]
);

export const financeImportStagingRows = mysqlTable(
  "finance_import_staging_rows",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    batchId: bigint("batchId", { mode: "number" })
      .notNull()
      .references(() => financeImportBatches.id, { onDelete: "cascade" }),
    rowNumber: int("rowNumber").notNull(),
    rawData: json("rawData").$type<Record<string, unknown>>().notNull(),
    normalizedData: json("normalizedData").$type<Record<string, unknown>>(),
    sourceRecordId: varchar("sourceRecordId", { length: 160 }),
    businessKeyHash: varchar("businessKeyHash", { length: 64 }),
    amount: decimal("amount", { precision: 20, scale: 2 }),
    status: mysqlEnum("status", ["accepted", "rejected", "mapping_required", "excluded"])
      .default("accepted")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("fin_staging_batch_row_uidx").on(table.batchId, table.rowNumber),
    index("fin_staging_batch_status_idx").on(table.batchId, table.status),
    index("fin_staging_key_idx").on(table.businessKeyHash),
  ]
);

export const financeImportErrors = mysqlTable(
  "finance_import_errors",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    batchId: bigint("batchId", { mode: "number" })
      .notNull()
      .references(() => financeImportBatches.id, { onDelete: "cascade" }),
    stagingRowId: bigint("stagingRowId", { mode: "number" }).references(
      () => financeImportStagingRows.id,
      { onDelete: "cascade" }
    ),
    rowNumber: int("rowNumber"),
    fieldName: varchar("fieldName", { length: 120 }),
    errorCode: varchar("errorCode", { length: 80 }).notNull(),
    severity: mysqlEnum("severity", ["warning", "blocking"]).default("blocking").notNull(),
    receivedValue: text("receivedValue"),
    message: varchar("message", { length: 500 }).notNull(),
    suggestedAction: varchar("suggestedAction", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("fin_errors_batch_idx").on(table.batchId),
    index("fin_errors_code_idx").on(table.errorCode),
  ]
);

export const financeMappingRules = mysqlTable(
  "finance_mapping_rules",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceSystem: varchar("sourceSystem", { length: 120 }).notNull(),
    dimensionType: varchar("dimensionType", { length: 60 }).notNull(),
    sourceValue: varchar("sourceValue", { length: 300 }).notNull(),
    targetDimensionId: int("targetDimensionId")
      .notNull()
      .references(() => financeDimensions.id, { onDelete: "cascade" }),
    effectiveFrom: timestamp("effectiveFrom"),
    effectiveTo: timestamp("effectiveTo"),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("fin_mapping_source_uidx").on(
      table.sourceSystem,
      table.dimensionType,
      table.sourceValue
    ),
    index("fin_mapping_target_idx").on(table.targetDimensionId),
  ]
);

export const financeBatchApprovals = mysqlTable(
  "finance_batch_approvals",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    batchId: bigint("batchId", { mode: "number" })
      .notNull()
      .references(() => financeImportBatches.id, { onDelete: "cascade" }),
    decision: mysqlEnum("decision", ["submitted", "approved", "rejected", "reversed"]).notNull(),
    decidedBy: int("decidedBy").references(() => users.id, { onDelete: "set null" }),
    comment: text("comment"),
    decidedAt: timestamp("decidedAt").defaultNow().notNull(),
  },
  table => [index("fin_approvals_batch_idx").on(table.batchId, table.decidedAt)]
);

const financeLineDimensions = () => ({
  cycleId: int("cycleId")
    .notNull()
    .references(() => financeCycles.id, { onDelete: "restrict" }),
  batchId: bigint("batchId", { mode: "number" })
    .notNull()
    .references(() => financeImportBatches.id, { onDelete: "restrict" }),
  sourceRecordId: varchar("sourceRecordId", { length: 160 }).notNull(),
  businessKeyHash: varchar("businessKeyHash", { length: 64 }).notNull(),
  fiscalYear: int("fiscalYear").notNull(),
  period: varchar("period", { length: 7 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  companyId: int("companyId")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  areaId: int("areaId")
    .notNull()
    .references(() => areas.id, { onDelete: "restrict" }),
  modalityId: int("modalityId").references(() => modalities.id, { onDelete: "set null" }),
  projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
  ownerUserId: int("ownerUserId")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  brandId: int("brandId").references(() => financeDimensions.id, { onDelete: "set null" }),
  businessUnitId: int("businessUnitId").references(() => financeDimensions.id, {
    onDelete: "set null",
  }),
  productId: int("productId").references(() => financeDimensions.id, { onDelete: "set null" }),
  costCenterId: int("costCenterId")
    .notNull()
    .references(() => financeDimensions.id, { onDelete: "restrict" }),
  accountingAccountId: int("accountingAccountId").references(() => financeDimensions.id, {
    onDelete: "set null",
  }),
  managementAccountId: int("managementAccountId")
    .notNull()
    .references(() => financeDimensions.id, { onDelete: "restrict" }),
  natureId: int("natureId")
    .notNull()
    .references(() => financeDimensions.id, { onDelete: "restrict" }),
  pillarId: int("pillarId").references(() => financeDimensions.id, { onDelete: "set null" }),
  channelId: int("channelId").references(() => financeDimensions.id, { onDelete: "set null" }),
  initiativeId: int("initiativeId").references(() => financeDimensions.id, {
    onDelete: "set null",
  }),
  campaignId: int("campaignId").references(() => financeDimensions.id, { onDelete: "set null" }),
  vendorId: int("vendorId").references(() => financeDimensions.id, { onDelete: "set null" }),
  contractId: int("contractId").references(() => financeDimensions.id, { onDelete: "set null" }),
  ownershipType: mysqlEnum("ownershipType", ["HOUSE", "CONDO"]).notNull(),
  description: text("description"),
  sourceNote: varchar("sourceNote", { length: 1000 }),
  isActive: boolean("isActive").default(true).notNull(),
  deactivatedByBatchId: bigint("deactivatedByBatchId", { mode: "number" }).references(
    () => financeImportBatches.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const financeBudgetLines = mysqlTable(
  "finance_budget_lines",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    versionId: int("versionId")
      .notNull()
      .references(() => financeVersions.id, { onDelete: "restrict" }),
    ...financeLineDimensions(),
    budgetAmount: decimal("budgetAmount", { precision: 20, scale: 2 }).notNull(),
    justification: text("justification"),
  },
  table => [
    uniqueIndex("fin_budget_version_source_uidx").on(table.versionId, table.sourceRecordId),
    index("fin_budget_period_idx").on(table.cycleId, table.period),
    index("fin_budget_owner_idx").on(table.ownerUserId),
  ]
);

export const financeActualEntries = mysqlTable(
  "finance_actual_entries",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    ...financeLineDimensions(),
    postingDate: timestamp("postingDate"),
    documentNumber: varchar("documentNumber", { length: 120 }),
    lineNumber: varchar("lineNumber", { length: 40 }),
    actualAmount: decimal("actualAmount", { precision: 20, scale: 2 }).notNull(),
    reversalOfId: bigint("reversalOfId", { mode: "number" }).references(
      (): AnyMySqlColumn => financeActualEntries.id,
      { onDelete: "set null" }
    ),
  },
  table => [
    uniqueIndex("fin_actual_batch_source_uidx").on(table.batchId, table.sourceRecordId),
    index("fin_actual_period_idx").on(table.cycleId, table.period),
    index("fin_actual_vendor_idx").on(table.vendorId),
  ]
);

export const financeCommitments = mysqlTable(
  "finance_commitments",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    ...financeLineDimensions(),
    commitmentType: varchar("commitmentType", { length: 80 }).notNull(),
    commitmentDate: timestamp("commitmentDate"),
    expectedDate: timestamp("expectedDate"),
    documentNumber: varchar("documentNumber", { length: 120 }),
    originalAmount: decimal("originalAmount", { precision: 20, scale: 2 }).notNull(),
    realizedAmount: decimal("realizedAmount", { precision: 20, scale: 2 })
      .default("0.00")
      .notNull(),
    openAmount: decimal("openAmount", { precision: 20, scale: 2 }).notNull(),
    commitmentStatus: mysqlEnum("commitmentStatus", [
      "open",
      "partially_realized",
      "realized",
      "cancelled",
      "overdue",
    ])
      .default("open")
      .notNull(),
  },
  table => [
    uniqueIndex("fin_commit_batch_source_uidx").on(table.batchId, table.sourceRecordId),
    index("fin_commit_period_idx").on(table.cycleId, table.period),
    index("fin_commit_status_idx").on(table.commitmentStatus),
  ]
);

export const financeForecastLines = mysqlTable(
  "finance_forecast_lines",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    versionId: int("versionId")
      .notNull()
      .references(() => financeVersions.id, { onDelete: "restrict" }),
    ...financeLineDimensions(),
    forecastAmount: decimal("forecastAmount", { precision: 20, scale: 2 }).notNull(),
    assumptionNote: text("assumptionNote"),
  },
  table => [
    uniqueIndex("fin_forecast_version_source_uidx").on(table.versionId, table.sourceRecordId),
    index("fin_forecast_period_idx").on(table.cycleId, table.period),
    index("fin_forecast_owner_idx").on(table.ownerUserId),
  ]
);

export const financeAllocationRules = mysqlTable(
  "finance_allocation_rules",
  {
    id: int("id").autoincrement().primaryKey(),
    cycleId: int("cycleId")
      .notNull()
      .references(() => financeCycles.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    criteriaType: mysqlEnum("criteriaType", ["fixed_percent", "loaded_driver"]).notNull(),
    sourceDimensionType: varchar("sourceDimensionType", { length: 60 }).notNull(),
    sourceDimensionId: int("sourceDimensionId").references(() => financeDimensions.id, {
      onDelete: "set null",
    }),
    ownerUserId: int("ownerUserId").references(() => users.id, { onDelete: "set null" }),
    effectiveFrom: timestamp("effectiveFrom"),
    effectiveTo: timestamp("effectiveTo"),
    status: mysqlEnum("status", statusValues).default("active").notNull(),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("fin_alloc_rules_cycle_code_uidx").on(table.cycleId, table.code),
    index("fin_alloc_rules_status_idx").on(table.status),
  ]
);

export const financeAllocationDestinations = mysqlTable(
  "finance_allocation_destinations",
  {
    id: int("id").autoincrement().primaryKey(),
    ruleId: int("ruleId")
      .notNull()
      .references(() => financeAllocationRules.id, { onDelete: "cascade" }),
    destinationType: varchar("destinationType", { length: 60 }).notNull(),
    destinationDimensionId: int("destinationDimensionId")
      .notNull()
      .references(() => financeDimensions.id, { onDelete: "restrict" }),
    driverValue: decimal("driverValue", { precision: 20, scale: 6 }),
    allocationPercent: decimal("allocationPercent", { precision: 9, scale: 6 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("fin_alloc_dest_rule_dim_uidx").on(table.ruleId, table.destinationDimensionId),
    index("fin_alloc_dest_rule_idx").on(table.ruleId),
  ]
);

export const financeAllocationRuns = mysqlTable(
  "finance_allocation_runs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    ruleId: int("ruleId")
      .notNull()
      .references(() => financeAllocationRules.id, { onDelete: "restrict" }),
    cycleId: int("cycleId")
      .notNull()
      .references(() => financeCycles.id, { onDelete: "restrict" }),
    batchId: bigint("batchId", { mode: "number" }).references(() => financeImportBatches.id, {
      onDelete: "set null",
    }),
    period: varchar("period", { length: 7 }).notNull(),
    status: mysqlEnum("status", ["draft", "validated", "committed", "reversed"])
      .default("draft")
      .notNull(),
    sourceAmount: decimal("sourceAmount", { precision: 20, scale: 2 }).notNull(),
    allocatedAmount: decimal("allocatedAmount", { precision: 20, scale: 2 }).notNull(),
    differenceAmount: decimal("differenceAmount", { precision: 20, scale: 2 }).notNull(),
    executedBy: int("executedBy").references(() => users.id, { onDelete: "set null" }),
    executedAt: timestamp("executedAt").defaultNow().notNull(),
  },
  table => [
    index("fin_alloc_runs_rule_period_idx").on(table.ruleId, table.period),
    index("fin_alloc_runs_status_idx").on(table.status),
  ]
);

export const financeAllocationEntries = mysqlTable(
  "finance_allocation_entries",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    runId: bigint("runId", { mode: "number" })
      .notNull()
      .references(() => financeAllocationRuns.id, { onDelete: "cascade" }),
    sourceFactType: varchar("sourceFactType", { length: 40 }).notNull(),
    sourceFactId: bigint("sourceFactId", { mode: "number" }).notNull(),
    destinationType: varchar("destinationType", { length: 60 }).notNull(),
    destinationDimensionId: int("destinationDimensionId")
      .notNull()
      .references(() => financeDimensions.id, { onDelete: "restrict" }),
    driverValue: decimal("driverValue", { precision: 20, scale: 6 }),
    allocationPercent: decimal("allocationPercent", { precision: 9, scale: 6 }).notNull(),
    allocatedAmount: decimal("allocatedAmount", { precision: 20, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("fin_alloc_entries_run_idx").on(table.runId),
    index("fin_alloc_entries_dest_idx").on(table.destinationDimensionId),
  ]
);

// Finance V1 analytical source — official Realized and Forecast records from BASE_REAL_MKTv2.xlsx.
export const financeMarketLoads = mysqlTable(
  "finance_market_loads",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    sourceFileName: varchar("sourceFileName", { length: 500 }).notNull(),
    sourceSha256: varchar("sourceSha256", { length: 64 }).notNull(),
    sourceSheet: varchar("sourceSheet", { length: 160 }).notNull(),
    status: mysqlEnum("status", [
      "processing",
      "validated",
      "approved",
      "active",
      "superseded",
      "reversed",
      "failed",
    ])
      .default("processing")
      .notNull(),
    validRows: int("validRows").default(0).notNull(),
    rejectedRows: int("rejectedRows").default(0).notNull(),
    duplicateRows: int("duplicateRows").default(0).notNull(),
    amountSigned: decimal("amountSigned", { precision: 22, scale: 8 }).default("0").notNull(),
    amountManagement: decimal("amountManagement", { precision: 22, scale: 8 })
      .default("0")
      .notNull(),
    scenarioRule: varchar("scenarioRule", { length: 500 }).notNull(),
    notes: text("notes"),
    loadedBy: int("loadedBy").references(() => users.id, { onDelete: "set null" }),
    approvedBy: int("approvedBy").references(() => users.id, { onDelete: "set null" }),
    loadedAt: timestamp("loadedAt").defaultNow().notNull(),
    approvedAt: timestamp("approvedAt"),
    activatedAt: timestamp("activatedAt"),
  },
  table => [
    uniqueIndex("fin_market_load_sha_uidx").on(table.sourceSha256),
    index("fin_market_load_status_idx").on(table.status, table.activatedAt),
  ]
);

export const financeMarketEntries = mysqlTable(
  "finance_market_entries",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    loadId: bigint("loadId", { mode: "number" })
      .notNull()
      .references(() => financeMarketLoads.id, { onDelete: "restrict" }),
    sourceExcelRow: int("sourceExcelRow").notNull(),
    sourceRecordId: varchar("sourceRecordId", { length: 64 }).notNull(),
    origin: varchar("origin", { length: 200 }).notNull(),
    scenario: mysqlEnum("scenario", ["actual", "forecast"]).notNull(),
    competenceDre: varchar("competenceDre", { length: 6 }).notNull(),
    period: varchar("period", { length: 7 }).notNull(),
    postingDate: timestamp("postingDate"),
    day: int("day"),
    month: int("month").notNull(),
    fiscalYear: int("fiscalYear").notNull(),
    brand: varchar("brand", { length: 160 }).notNull(),
    businessUnit: varchar("businessUnit", { length: 200 }).notNull(),
    modality: varchar("modality", { length: 160 }),
    product: varchar("product", { length: 200 }),
    dreGroup: varchar("dreGroup", { length: 200 }).notNull(),
    dreLine: varchar("dreLine", { length: 200 }).notNull(),
    branchCode: varchar("branchCode", { length: 80 }),
    costCenterCode: varchar("costCenterCode", { length: 120 }),
    costCenterName: varchar("costCenterName", { length: 300 }),
    accountingAccountCode: varchar("accountingAccountCode", { length: 120 }).notNull(),
    accountingAccountName: varchar("accountingAccountName", { length: 300 }),
    budgetCode: varchar("budgetCode", { length: 120 }),
    budgetName: varchar("budgetName", { length: 300 }),
    history: text("history"),
    sourceUser: varchar("sourceUser", { length: 200 }),
    ledgerBatch: varchar("ledgerBatch", { length: 120 }),
    ledgerSubBatch: varchar("ledgerSubBatch", { length: 120 }),
    amountSigned: decimal("amountSigned", { precision: 22, scale: 8 }).notNull(),
    amountManagement: decimal("amountManagement", { precision: 22, scale: 8 }).notNull(),
    manualEntry: boolean("manualEntry").default(false).notNull(),
    entryType: varchar("entryType", { length: 120 }).notNull(),
    managementCategory: varchar("managementCategory", { length: 200 }).notNull(),
    exactDuplicate: boolean("exactDuplicate").default(false).notNull(),
    duplicateFingerprint: varchar("duplicateFingerprint", { length: 64 }),
    qualityFlags: json("qualityFlags").$type<string[]>(),
    rawData: json("rawData").$type<Record<string, unknown>>().notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("fin_market_load_source_uidx").on(table.loadId, table.sourceRecordId),
    index("fin_market_period_scenario_idx").on(
      table.loadId,
      table.fiscalYear,
      table.month,
      table.scenario
    ),
    index("fin_market_brand_category_idx").on(table.loadId, table.brand, table.managementCategory),
    index("fin_market_bu_product_idx").on(table.loadId, table.businessUnit, table.product),
    index("fin_market_account_idx").on(table.loadId, table.accountingAccountCode),
    index("fin_market_cc_idx").on(table.loadId, table.costCenterCode),
  ]
);

export const financeMarketGlossary = mysqlTable(
  "finance_market_glossary",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: bigint("loadId", { mode: "number" })
      .notNull()
      .references(() => financeMarketLoads.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 200 }).notNull(),
    description: text("description").notNull(),
    sourceSheet: varchar("sourceSheet", { length: 160 }).notNull(),
    sourceRow: int("sourceRow"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("fin_market_glossary_load_cat_uidx").on(table.loadId, table.category)]
);

export const financeMarketAttentionPoints = mysqlTable(
  "finance_market_attention_points",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: bigint("loadId", { mode: "number" })
      .notNull()
      .references(() => financeMarketLoads.id, { onDelete: "cascade" }),
    brand: varchar("brand", { length: 160 }).notNull(),
    businessUnit: varchar("businessUnit", { length: 200 }).notNull(),
    managementCategory: varchar("managementCategory", { length: 200 }).notNull(),
    amount2025Signed: decimal("amount2025Signed", { precision: 22, scale: 8 }),
    amount2026Signed: decimal("amount2026Signed", { precision: 22, scale: 8 }),
    observation: text("observation"),
    attentionType: mysqlEnum("attentionType", [
      "context",
      "forecast",
      "reclassification",
      "scope_change",
      "imprecision",
    ])
      .default("context")
      .notNull(),
    status: mysqlEnum("status", ["informational", "open", "validated", "resolved"])
      .default("informational")
      .notNull(),
    sourceSheet: varchar("sourceSheet", { length: 160 }).notNull(),
    sourceRow: int("sourceRow"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("fin_market_attention_context_idx").on(
      table.loadId,
      table.brand,
      table.managementCategory,
      table.status
    ),
  ]
);

export const financeMarketQualityIssues = mysqlTable(
  "finance_market_quality_issues",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    loadId: bigint("loadId", { mode: "number" })
      .notNull()
      .references(() => financeMarketLoads.id, { onDelete: "cascade" }),
    sourceExcelRow: int("sourceExcelRow"),
    issueCode: varchar("issueCode", { length: 100 }).notNull(),
    severity: mysqlEnum("severity", ["info", "warning", "blocking"]).default("warning").notNull(),
    fieldName: varchar("fieldName", { length: 120 }),
    message: text("message").notNull(),
    sourceValue: text("sourceValue"),
    status: mysqlEnum("status", ["open", "accepted", "resolved"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("fin_market_quality_load_idx").on(table.loadId, table.severity, table.status),
    index("fin_market_quality_row_idx").on(table.loadId, table.sourceExcelRow),
  ]
);
