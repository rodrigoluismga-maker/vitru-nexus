CREATE TABLE `action_checklist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`label` varchar(240) NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`completedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `action_checklist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `action_dependencies` (
	`actionId` int NOT NULL,
	`dependsOnActionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `action_dependencies_actionId_dependsOnActionId_pk` PRIMARY KEY(`actionId`,`dependsOnActionId`)
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`managerId` int,
	`description` text,
	`color` varchar(9) NOT NULL DEFAULT '#8411CE',
	`icon` varchar(80) NOT NULL DEFAULT 'Building2',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `areas_name_uidx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`action` varchar(80) NOT NULL,
	`summary` varchar(300) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`actionId` int,
	`decisionId` int,
	`parentId` int,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`editedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`shortName` varchar(80) NOT NULL,
	`acronym` varchar(30) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`institutionalColor` varchar(9) NOT NULL DEFAULT '#281352',
	`logoKey` varchar(500),
	`logoUrl` varchar(1000),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_name_uidx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`context` text,
	`status` enum('pending','approved','rejected','deferred') NOT NULL DEFAULT 'pending',
	`ownerId` int,
	`deciderId` int,
	`dueDate` timestamp,
	`decidedAt` timestamp,
	`decision` text,
	`impact` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`milestoneId` int,
	`title` varchar(220) NOT NULL,
	`description` text,
	`dueDate` timestamp,
	`status` enum('planned','in_progress','delayed','delivered','cancelled') NOT NULL DEFAULT 'planned',
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`actionId` int,
	`decisionId` int,
	`title` varchar(220) NOT NULL,
	`kind` enum('file','link') NOT NULL DEFAULT 'file',
	`fileName` varchar(255),
	`mimeType` varchar(160),
	`fileSize` bigint,
	`storageKey` varchar(700),
	`url` varchar(1200),
	`externalUrl` varchar(1200),
	`category` varchar(100),
	`version` varchar(40) NOT NULL DEFAULT '1.0',
	`tags` json,
	`accessLevel` enum('project','restricted','executive') NOT NULL DEFAULT 'project',
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text,
	`dueDate` timestamp,
	`status` enum('planned','in_progress','delayed','done','cancelled') NOT NULL DEFAULT 'planned',
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modalities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`icon` varchar(80) NOT NULL DEFAULT 'GraduationCap',
	`color` varchar(9) NOT NULL DEFAULT '#6824D3',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modalities_id` PRIMARY KEY(`id`),
	CONSTRAINT `modalities_name_uidx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inApp` boolean NOT NULL DEFAULT true,
	`overdueActions` boolean NOT NULL DEFAULT true,
	`pendingDecisions` boolean NOT NULL DEFAULT true,
	`projectUpdates` boolean NOT NULL DEFAULT true,
	`dailyDigest` boolean NOT NULL DEFAULT false,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_user_uidx` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(80) NOT NULL,
	`title` varchar(220) NOT NULL,
	`message` text,
	`severity` enum('info','attention','critical') NOT NULL DEFAULT 'info',
	`sourceEntityType` varchar(80),
	`sourceEntityId` varchar(80),
	`dedupeKey` varchar(220),
	`dueAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_dedupe_uidx` UNIQUE(`dedupeKey`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(140) NOT NULL,
	`module` varchar(80) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `priorities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`code` varchar(40) NOT NULL,
	`weight` int NOT NULL,
	`color` varchar(9) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priorities_id` PRIMARY KEY(`id`),
	CONSTRAINT `priorities_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `project_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text,
	`ownerId` int,
	`areaId` int,
	`startDate` timestamp,
	`dueDate` timestamp,
	`status` enum('todo','in_progress','blocked','done','cancelled') NOT NULL DEFAULT 'todo',
	`priorityId` int,
	`progress` int NOT NULL DEFAULT 0,
	`estimatedHours` decimal(10,2),
	`actualHours` decimal(10,2),
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`code` varchar(60) NOT NULL,
	`description` text,
	`color` varchar(9) NOT NULL DEFAULT '#6824D3',
	`icon` varchar(80) NOT NULL DEFAULT 'Layers3',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_categories_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `project_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`unit` varchar(40),
	`direction` enum('higher','lower','target') NOT NULL DEFAULT 'target',
	`targetValue` decimal(20,4),
	`currentValue` decimal(20,4),
	`periodLabel` varchar(80),
	`source` varchar(255),
	`status` enum('on_track','attention','critical','unassessed') NOT NULL DEFAULT 'unassessed',
	`ownerId` int,
	`measuredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_indicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`memberRole` enum('sponsor','manager','member','viewer') NOT NULL DEFAULT 'member',
	`responsibility` varchar(220),
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_members_projectId_userId_pk` PRIMARY KEY(`projectId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `project_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(60) NOT NULL,
	`description` text,
	`color` varchar(9) NOT NULL,
	`icon` varchar(80) NOT NULL DEFAULT 'CircleDot',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isTerminal` boolean NOT NULL DEFAULT false,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_statuses_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `project_tags` (
	`projectId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `project_tags_projectId_tagId_pk` PRIMARY KEY(`projectId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(220) NOT NULL,
	`code` varchar(60) NOT NULL,
	`description` text,
	`companyId` int NOT NULL,
	`ownerAreaId` int NOT NULL,
	`modalityId` int,
	`managerId` int,
	`executiveSponsorId` int,
	`categoryId` int NOT NULL,
	`statusId` int NOT NULL,
	`priorityId` int NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`objective` text,
	`color` varchar(9) NOT NULL DEFAULT '#6824D3',
	`icon` varchar(80) NOT NULL DEFAULT 'FolderKanban',
	`coverKey` varchar(500),
	`coverUrl` varchar(1000),
	`progress` int NOT NULL DEFAULT 0,
	`health` enum('healthy','attention','critical','unassessed') NOT NULL DEFAULT 'unassessed',
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text,
	`probability` int NOT NULL DEFAULT 1,
	`impact` int NOT NULL DEFAULT 1,
	`status` enum('open','mitigating','accepted','closed') NOT NULL DEFAULT 'open',
	`ownerId` int,
	`dueDate` timestamp,
	`mitigation` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_profile_permissions` (
	`roleProfileId` int NOT NULL,
	`permissionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_profile_permissions_roleProfileId_permissionId_pk` PRIMARY KEY(`roleProfileId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `role_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(60) NOT NULL,
	`description` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_profiles_code_uidx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`color` varchar(9) NOT NULL DEFAULT '#A689F7',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_uidx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `user_permission_overrides` (
	`userId` int NOT NULL,
	`permissionId` int NOT NULL,
	`effect` enum('allow','deny') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_permission_overrides_userId_permissionId_pk` PRIMARY KEY(`userId`,`permissionId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `photoKey` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `users` ADD `jobTitle` varchar(160);--> statement-breakpoint
ALTER TABLE `users` ADD `areaId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `companyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `roleProfileId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('invited','active','inactive','blocked') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `action_checklist_items` ADD CONSTRAINT `action_checklist_items_actionId_project_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `project_actions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `action_checklist_items` ADD CONSTRAINT `action_checklist_items_completedBy_users_id_fk` FOREIGN KEY (`completedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `action_dependencies` ADD CONSTRAINT `action_dependencies_actionId_project_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `project_actions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `action_dependencies` ADD CONSTRAINT `action_dependencies_dependsOnActionId_project_actions_id_fk` FOREIGN KEY (`dependsOnActionId`) REFERENCES `project_actions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `areas` ADD CONSTRAINT `areas_managerId_users_id_fk` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_actionId_project_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `project_actions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_decisionId_decisions_id_fk` FOREIGN KEY (`decisionId`) REFERENCES `decisions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_parentId_comments_id_fk` FOREIGN KEY (`parentId`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_deciderId_users_id_fk` FOREIGN KEY (`deciderId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_milestoneId_milestones_id_fk` FOREIGN KEY (`milestoneId`) REFERENCES `milestones`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_actionId_project_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `project_actions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_decisionId_decisions_id_fk` FOREIGN KEY (`decisionId`) REFERENCES `decisions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_actions` ADD CONSTRAINT `project_actions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_actions` ADD CONSTRAINT `project_actions_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_actions` ADD CONSTRAINT `project_actions_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_actions` ADD CONSTRAINT `project_actions_priorityId_priorities_id_fk` FOREIGN KEY (`priorityId`) REFERENCES `priorities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_actions` ADD CONSTRAINT `project_actions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_actions` ADD CONSTRAINT `project_actions_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_indicators` ADD CONSTRAINT `project_indicators_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_indicators` ADD CONSTRAINT `project_indicators_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_tags` ADD CONSTRAINT `project_tags_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_tags` ADD CONSTRAINT `project_tags_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_ownerAreaId_areas_id_fk` FOREIGN KEY (`ownerAreaId`) REFERENCES `areas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_modalityId_modalities_id_fk` FOREIGN KEY (`modalityId`) REFERENCES `modalities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_managerId_users_id_fk` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_executiveSponsorId_users_id_fk` FOREIGN KEY (`executiveSponsorId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_categoryId_project_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `project_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_statusId_project_statuses_id_fk` FOREIGN KEY (`statusId`) REFERENCES `project_statuses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_priorityId_priorities_id_fk` FOREIGN KEY (`priorityId`) REFERENCES `priorities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `risks` ADD CONSTRAINT `risks_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `risks` ADD CONSTRAINT `risks_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `risks` ADD CONSTRAINT `risks_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_profile_permissions` ADD CONSTRAINT `role_profile_permissions_roleProfileId_role_profiles_id_fk` FOREIGN KEY (`roleProfileId`) REFERENCES `role_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_profile_permissions` ADD CONSTRAINT `role_profile_permissions_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permission_overrides` ADD CONSTRAINT `user_permission_overrides_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permission_overrides` ADD CONSTRAINT `user_permission_overrides_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `action_checklist_action_idx` ON `action_checklist_items` (`actionId`);--> statement-breakpoint
CREATE INDEX `areas_status_idx` ON `areas` (`status`);--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_events` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `comments_project_idx` ON `comments` (`projectId`);--> statement-breakpoint
CREATE INDEX `comments_action_idx` ON `comments` (`actionId`);--> statement-breakpoint
CREATE INDEX `comments_decision_idx` ON `comments` (`decisionId`);--> statement-breakpoint
CREATE INDEX `companies_status_idx` ON `companies` (`status`);--> statement-breakpoint
CREATE INDEX `decisions_project_idx` ON `decisions` (`projectId`);--> statement-breakpoint
CREATE INDEX `decisions_status_idx` ON `decisions` (`status`);--> statement-breakpoint
CREATE INDEX `decisions_due_idx` ON `decisions` (`dueDate`);--> statement-breakpoint
CREATE INDEX `deliveries_project_idx` ON `deliveries` (`projectId`);--> statement-breakpoint
CREATE INDEX `deliveries_due_idx` ON `deliveries` (`dueDate`);--> statement-breakpoint
CREATE INDEX `documents_project_idx` ON `documents` (`projectId`);--> statement-breakpoint
CREATE INDEX `documents_action_idx` ON `documents` (`actionId`);--> statement-breakpoint
CREATE INDEX `documents_decision_idx` ON `documents` (`decisionId`);--> statement-breakpoint
CREATE INDEX `milestones_project_idx` ON `milestones` (`projectId`);--> statement-breakpoint
CREATE INDEX `milestones_due_idx` ON `milestones` (`dueDate`);--> statement-breakpoint
CREATE INDEX `modalities_status_idx` ON `modalities` (`status`);--> statement-breakpoint
CREATE INDEX `notification_preferences_task_idx` ON `notification_preferences` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`,`readAt`);--> statement-breakpoint
CREATE INDEX `notifications_created_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `permissions_module_idx` ON `permissions` (`module`);--> statement-breakpoint
CREATE INDEX `priorities_weight_idx` ON `priorities` (`weight`);--> statement-breakpoint
CREATE INDEX `project_actions_project_idx` ON `project_actions` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_actions_owner_idx` ON `project_actions` (`ownerId`);--> statement-breakpoint
CREATE INDEX `project_actions_due_idx` ON `project_actions` (`dueDate`);--> statement-breakpoint
CREATE INDEX `project_actions_status_idx` ON `project_actions` (`status`);--> statement-breakpoint
CREATE INDEX `project_categories_status_idx` ON `project_categories` (`status`);--> statement-breakpoint
CREATE INDEX `project_indicators_project_idx` ON `project_indicators` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_indicators_status_idx` ON `project_indicators` (`status`);--> statement-breakpoint
CREATE INDEX `project_members_user_idx` ON `project_members` (`userId`);--> statement-breakpoint
CREATE INDEX `project_statuses_order_idx` ON `project_statuses` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `projects_company_idx` ON `projects` (`companyId`);--> statement-breakpoint
CREATE INDEX `projects_area_idx` ON `projects` (`ownerAreaId`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`statusId`);--> statement-breakpoint
CREATE INDEX `projects_health_idx` ON `projects` (`health`);--> statement-breakpoint
CREATE INDEX `risks_project_idx` ON `risks` (`projectId`);--> statement-breakpoint
CREATE INDEX `risks_status_idx` ON `risks` (`status`);--> statement-breakpoint
CREATE INDEX `role_profiles_status_idx` ON `role_profiles` (`status`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_roleProfileId_role_profiles_id_fk` FOREIGN KEY (`roleProfileId`) REFERENCES `role_profiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `users_company_idx` ON `users` (`companyId`);--> statement-breakpoint
CREATE INDEX `users_area_idx` ON `users` (`areaId`);--> statement-breakpoint
CREATE INDEX `users_profile_idx` ON `users` (`roleProfileId`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);