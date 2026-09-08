CREATE TABLE `finance_actual_entries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`batchId` bigint NOT NULL,
	`sourceRecordId` varchar(160) NOT NULL,
	`businessKeyHash` varchar(64) NOT NULL,
	`fiscalYear` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`companyId` int NOT NULL,
	`areaId` int NOT NULL,
	`modalityId` int,
	`projectId` int,
	`ownerUserId` int NOT NULL,
	`brandId` int,
	`businessUnitId` int,
	`productId` int,
	`costCenterId` int NOT NULL,
	`accountingAccountId` int,
	`managementAccountId` int NOT NULL,
	`natureId` int NOT NULL,
	`pillarId` int,
	`channelId` int,
	`initiativeId` int,
	`campaignId` int,
	`vendorId` int,
	`contractId` int,
	`ownershipType` enum('HOUSE','CONDO') NOT NULL,
	`description` text,
	`sourceNote` varchar(1000),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`postingDate` timestamp,
	`documentNumber` varchar(120),
	`lineNumber` varchar(40),
	`actualAmount` decimal(20,2) NOT NULL,
	`reversalOfId` bigint,
	CONSTRAINT `finance_actual_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_actual_batch_source_uidx` UNIQUE(`batchId`,`sourceRecordId`)
);
--> statement-breakpoint
CREATE TABLE `finance_allocation_destinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`destinationType` varchar(60) NOT NULL,
	`destinationDimensionId` int NOT NULL,
	`driverValue` decimal(20,6),
	`allocationPercent` decimal(9,6),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_allocation_destinations_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_alloc_dest_rule_dim_uidx` UNIQUE(`ruleId`,`destinationDimensionId`)
);
--> statement-breakpoint
CREATE TABLE `finance_allocation_entries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`runId` bigint NOT NULL,
	`sourceFactType` varchar(40) NOT NULL,
	`sourceFactId` bigint NOT NULL,
	`destinationType` varchar(60) NOT NULL,
	`destinationDimensionId` int NOT NULL,
	`driverValue` decimal(20,6),
	`allocationPercent` decimal(9,6) NOT NULL,
	`allocatedAmount` decimal(20,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_allocation_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_allocation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`criteriaType` enum('fixed_percent','loaded_driver') NOT NULL,
	`sourceDimensionType` varchar(60) NOT NULL,
	`sourceDimensionId` int,
	`ownerUserId` int,
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_allocation_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_alloc_rules_cycle_code_uidx` UNIQUE(`cycleId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `finance_allocation_runs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`cycleId` int NOT NULL,
	`batchId` bigint,
	`period` varchar(7) NOT NULL,
	`status` enum('draft','validated','committed','reversed') NOT NULL DEFAULT 'draft',
	`sourceAmount` decimal(20,2) NOT NULL,
	`allocatedAmount` decimal(20,2) NOT NULL,
	`differenceAmount` decimal(20,2) NOT NULL,
	`executedBy` int,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_allocation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_batch_approvals` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`batchId` bigint NOT NULL,
	`decision` enum('submitted','approved','rejected','reversed') NOT NULL,
	`decidedBy` int,
	`comment` text,
	`decidedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_batch_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_budget_lines` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`versionId` int NOT NULL,
	`cycleId` int NOT NULL,
	`batchId` bigint NOT NULL,
	`sourceRecordId` varchar(160) NOT NULL,
	`businessKeyHash` varchar(64) NOT NULL,
	`fiscalYear` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`companyId` int NOT NULL,
	`areaId` int NOT NULL,
	`modalityId` int,
	`projectId` int,
	`ownerUserId` int NOT NULL,
	`brandId` int,
	`businessUnitId` int,
	`productId` int,
	`costCenterId` int NOT NULL,
	`accountingAccountId` int,
	`managementAccountId` int NOT NULL,
	`natureId` int NOT NULL,
	`pillarId` int,
	`channelId` int,
	`initiativeId` int,
	`campaignId` int,
	`vendorId` int,
	`contractId` int,
	`ownershipType` enum('HOUSE','CONDO') NOT NULL,
	`description` text,
	`sourceNote` varchar(1000),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`budgetAmount` decimal(20,2) NOT NULL,
	`justification` text,
	CONSTRAINT `finance_budget_lines_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_budget_version_source_uidx` UNIQUE(`versionId`,`sourceRecordId`)
);
--> statement-breakpoint
CREATE TABLE `finance_commitments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`batchId` bigint NOT NULL,
	`sourceRecordId` varchar(160) NOT NULL,
	`businessKeyHash` varchar(64) NOT NULL,
	`fiscalYear` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`companyId` int NOT NULL,
	`areaId` int NOT NULL,
	`modalityId` int,
	`projectId` int,
	`ownerUserId` int NOT NULL,
	`brandId` int,
	`businessUnitId` int,
	`productId` int,
	`costCenterId` int NOT NULL,
	`accountingAccountId` int,
	`managementAccountId` int NOT NULL,
	`natureId` int NOT NULL,
	`pillarId` int,
	`channelId` int,
	`initiativeId` int,
	`campaignId` int,
	`vendorId` int,
	`contractId` int,
	`ownershipType` enum('HOUSE','CONDO') NOT NULL,
	`description` text,
	`sourceNote` varchar(1000),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`commitmentType` varchar(80) NOT NULL,
	`commitmentDate` timestamp,
	`expectedDate` timestamp,
	`documentNumber` varchar(120),
	`originalAmount` decimal(20,2) NOT NULL,
	`realizedAmount` decimal(20,2) NOT NULL DEFAULT '0.00',
	`openAmount` decimal(20,2) NOT NULL,
	`commitmentStatus` enum('open','partially_realized','realized','cancelled','overdue') NOT NULL DEFAULT 'open',
	CONSTRAINT `finance_commitments_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_commit_batch_source_uidx` UNIQUE(`batchId`,`sourceRecordId`)
);
--> statement-breakpoint
CREATE TABLE `finance_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fiscalYear` int NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`startPeriod` varchar(7) NOT NULL,
	`endPeriod` varchar(7) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`status` enum('planned','open','closed','archived') NOT NULL DEFAULT 'planned',
	`linkedProjectId` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_cycles_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_cycles_code_uidx` UNIQUE(`code`),
	CONSTRAINT `fin_cycles_year_uidx` UNIQUE(`fiscalYear`)
);
--> statement-breakpoint
CREATE TABLE `finance_dimensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dimensionType` varchar(60) NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(200) NOT NULL,
	`parentId` int,
	`companyId` int,
	`areaId` int,
	`modalityId` int,
	`projectId` int,
	`ownerUserId` int,
	`externalCode` varchar(160),
	`taxId` varchar(30),
	`metadata` json,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_dimensions_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_dims_type_code_uidx` UNIQUE(`dimensionType`,`code`)
);
--> statement-breakpoint
CREATE TABLE `finance_forecast_lines` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`versionId` int NOT NULL,
	`cycleId` int NOT NULL,
	`batchId` bigint NOT NULL,
	`sourceRecordId` varchar(160) NOT NULL,
	`businessKeyHash` varchar(64) NOT NULL,
	`fiscalYear` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`companyId` int NOT NULL,
	`areaId` int NOT NULL,
	`modalityId` int,
	`projectId` int,
	`ownerUserId` int NOT NULL,
	`brandId` int,
	`businessUnitId` int,
	`productId` int,
	`costCenterId` int NOT NULL,
	`accountingAccountId` int,
	`managementAccountId` int NOT NULL,
	`natureId` int NOT NULL,
	`pillarId` int,
	`channelId` int,
	`initiativeId` int,
	`campaignId` int,
	`vendorId` int,
	`contractId` int,
	`ownershipType` enum('HOUSE','CONDO') NOT NULL,
	`description` text,
	`sourceNote` varchar(1000),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`forecastAmount` decimal(20,2) NOT NULL,
	`assumptionNote` text,
	CONSTRAINT `finance_forecast_lines_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_forecast_version_source_uidx` UNIQUE(`versionId`,`sourceRecordId`)
);
--> statement-breakpoint
CREATE TABLE `finance_import_batches` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`cycleId` int,
	`versionId` int,
	`loadType` enum('budget','actual','commitment','forecast','allocation','dimension') NOT NULL,
	`mode` enum('append','replace_scope','reversal') NOT NULL DEFAULT 'append',
	`status` enum('uploaded','staging','validation_failed','mapping_required','ready_for_review','approval_pending','approved','committed','rejected','reversed') NOT NULL DEFAULT 'uploaded',
	`sourceSystem` varchar(120) NOT NULL,
	`fileName` varchar(500) NOT NULL,
	`fileKey` varchar(1000) NOT NULL,
	`fileUrl` varchar(1200) NOT NULL,
	`fileHash` varchar(64) NOT NULL,
	`fileSize` bigint NOT NULL,
	`scope` json,
	`rowCount` int NOT NULL DEFAULT 0,
	`acceptedCount` int NOT NULL DEFAULT 0,
	`rejectedCount` int NOT NULL DEFAULT 0,
	`warningCount` int NOT NULL DEFAULT 0,
	`previousAmount` decimal(20,2),
	`removedAmount` decimal(20,2),
	`addedAmount` decimal(20,2),
	`variationAmount` decimal(20,2),
	`totalAmount` decimal(20,2),
	`notes` text,
	`reversalOfBatchId` bigint,
	`createdBy` int,
	`approvedBy` int,
	`approvedAt` timestamp,
	`committedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_import_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_import_errors` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`batchId` bigint NOT NULL,
	`stagingRowId` bigint,
	`rowNumber` int,
	`fieldName` varchar(120),
	`errorCode` varchar(80) NOT NULL,
	`severity` enum('warning','blocking') NOT NULL DEFAULT 'blocking',
	`receivedValue` text,
	`message` varchar(500) NOT NULL,
	`suggestedAction` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_import_errors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_import_staging_rows` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`batchId` bigint NOT NULL,
	`rowNumber` int NOT NULL,
	`rawData` json NOT NULL,
	`normalizedData` json,
	`sourceRecordId` varchar(160),
	`businessKeyHash` varchar(64),
	`amount` decimal(20,2),
	`status` enum('accepted','rejected','mapping_required','excluded') NOT NULL DEFAULT 'accepted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_import_staging_rows_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_staging_batch_row_uidx` UNIQUE(`batchId`,`rowNumber`)
);
--> statement-breakpoint
CREATE TABLE `finance_mapping_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceSystem` varchar(120) NOT NULL,
	`dimensionType` varchar(60) NOT NULL,
	`sourceValue` varchar(300) NOT NULL,
	`targetDimensionId` int NOT NULL,
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_mapping_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_mapping_source_uidx` UNIQUE(`sourceSystem`,`dimensionType`,`sourceValue`)
);
--> statement-breakpoint
CREATE TABLE `finance_user_scopes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scopeType` varchar(60) NOT NULL,
	`scopeId` int,
	`accessLevel` enum('view','contribute','approve','admin') NOT NULL DEFAULT 'view',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_user_scopes_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_scopes_user_type_id_uidx` UNIQUE(`userId`,`scopeType`,`scopeId`)
);
--> statement-breakpoint
CREATE TABLE `finance_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`code` varchar(60) NOT NULL,
	`name` varchar(160) NOT NULL,
	`versionType` enum('budget_original','budget_revision','forecast') NOT NULL,
	`versionNumber` int NOT NULL DEFAULT 1,
	`status` enum('draft','submitted','approved','superseded','locked') NOT NULL DEFAULT 'draft',
	`effectivePeriod` varchar(7),
	`notes` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_versions_cycle_code_uidx` UNIQUE(`cycleId`,`code`)
);
--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_cycleId_finance_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `finance_cycles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_batchId_finance_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_modalityId_modalities_id_fk` FOREIGN KEY (`modalityId`) REFERENCES `modalities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_brandId_finance_dimensions_id_fk` FOREIGN KEY (`brandId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_businessUnitId_finance_dimensions_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_productId_finance_dimensions_id_fk` FOREIGN KEY (`productId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_costCenterId_finance_dimensions_id_fk` FOREIGN KEY (`costCenterId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_accountingAccountId_finance_dimensions_id_fk` FOREIGN KEY (`accountingAccountId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_managementAccountId_finance_dimensions_id_fk` FOREIGN KEY (`managementAccountId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_natureId_finance_dimensions_id_fk` FOREIGN KEY (`natureId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_pillarId_finance_dimensions_id_fk` FOREIGN KEY (`pillarId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_channelId_finance_dimensions_id_fk` FOREIGN KEY (`channelId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_initiativeId_finance_dimensions_id_fk` FOREIGN KEY (`initiativeId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_campaignId_finance_dimensions_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_vendorId_finance_dimensions_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_contractId_finance_dimensions_id_fk` FOREIGN KEY (`contractId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_actual_entries` ADD CONSTRAINT `finance_actual_entries_reversalOfId_finance_actual_entries_id_fk` FOREIGN KEY (`reversalOfId`) REFERENCES `finance_actual_entries`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_destinations` ADD CONSTRAINT `finance_allocation_destinations_ruleId_finance_allocation_rules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `finance_allocation_rules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_destinations` ADD CONSTRAINT `finance_allocation_destinations_destinationDimensionId_finance_dimensions_id_fk` FOREIGN KEY (`destinationDimensionId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_entries` ADD CONSTRAINT `finance_allocation_entries_runId_finance_allocation_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `finance_allocation_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_entries` ADD CONSTRAINT `finance_allocation_entries_destinationDimensionId_finance_dimensions_id_fk` FOREIGN KEY (`destinationDimensionId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_rules` ADD CONSTRAINT `finance_allocation_rules_cycleId_finance_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `finance_cycles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_rules` ADD CONSTRAINT `finance_allocation_rules_sourceDimensionId_finance_dimensions_id_fk` FOREIGN KEY (`sourceDimensionId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_rules` ADD CONSTRAINT `finance_allocation_rules_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_rules` ADD CONSTRAINT `finance_allocation_rules_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_runs` ADD CONSTRAINT `finance_allocation_runs_ruleId_finance_allocation_rules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `finance_allocation_rules`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_runs` ADD CONSTRAINT `finance_allocation_runs_cycleId_finance_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `finance_cycles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_runs` ADD CONSTRAINT `finance_allocation_runs_batchId_finance_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_allocation_runs` ADD CONSTRAINT `finance_allocation_runs_executedBy_users_id_fk` FOREIGN KEY (`executedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_batch_approvals` ADD CONSTRAINT `finance_batch_approvals_batchId_finance_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_batch_approvals` ADD CONSTRAINT `finance_batch_approvals_decidedBy_users_id_fk` FOREIGN KEY (`decidedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_versionId_finance_versions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `finance_versions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_cycleId_finance_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `finance_cycles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_batchId_finance_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_modalityId_modalities_id_fk` FOREIGN KEY (`modalityId`) REFERENCES `modalities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_brandId_finance_dimensions_id_fk` FOREIGN KEY (`brandId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_businessUnitId_finance_dimensions_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_productId_finance_dimensions_id_fk` FOREIGN KEY (`productId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_costCenterId_finance_dimensions_id_fk` FOREIGN KEY (`costCenterId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_accountingAccountId_finance_dimensions_id_fk` FOREIGN KEY (`accountingAccountId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_managementAccountId_finance_dimensions_id_fk` FOREIGN KEY (`managementAccountId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_natureId_finance_dimensions_id_fk` FOREIGN KEY (`natureId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_pillarId_finance_dimensions_id_fk` FOREIGN KEY (`pillarId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_channelId_finance_dimensions_id_fk` FOREIGN KEY (`channelId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_initiativeId_finance_dimensions_id_fk` FOREIGN KEY (`initiativeId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_campaignId_finance_dimensions_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_vendorId_finance_dimensions_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_budget_lines` ADD CONSTRAINT `finance_budget_lines_contractId_finance_dimensions_id_fk` FOREIGN KEY (`contractId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_cycleId_finance_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `finance_cycles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_batchId_finance_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_modalityId_modalities_id_fk` FOREIGN KEY (`modalityId`) REFERENCES `modalities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_brandId_finance_dimensions_id_fk` FOREIGN KEY (`brandId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_businessUnitId_finance_dimensions_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_productId_finance_dimensions_id_fk` FOREIGN KEY (`productId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_costCenterId_finance_dimensions_id_fk` FOREIGN KEY (`costCenterId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_accountingAccountId_finance_dimensions_id_fk` FOREIGN KEY (`accountingAccountId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_managementAccountId_finance_dimensions_id_fk` FOREIGN KEY (`managementAccountId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_natureId_finance_dimensions_id_fk` FOREIGN KEY (`natureId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_pillarId_finance_dimensions_id_fk` FOREIGN KEY (`pillarId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_channelId_finance_dimensions_id_fk` FOREIGN KEY (`channelId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_initiativeId_finance_dimensions_id_fk` FOREIGN KEY (`initiativeId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_campaignId_finance_dimensions_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_vendorId_finance_dimensions_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_commitments` ADD CONSTRAINT `finance_commitments_contractId_finance_dimensions_id_fk` FOREIGN KEY (`contractId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_cycles` ADD CONSTRAINT `finance_cycles_linkedProjectId_projects_id_fk` FOREIGN KEY (`linkedProjectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_cycles` ADD CONSTRAINT `finance_cycles_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_dimensions` ADD CONSTRAINT `finance_dimensions_parentId_finance_dimensions_id_fk` FOREIGN KEY (`parentId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_dimensions` ADD CONSTRAINT `finance_dimensions_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_dimensions` ADD CONSTRAINT `finance_dimensions_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_dimensions` ADD CONSTRAINT `finance_dimensions_modalityId_modalities_id_fk` FOREIGN KEY (`modalityId`) REFERENCES `modalities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_dimensions` ADD CONSTRAINT `finance_dimensions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_dimensions` ADD CONSTRAINT `finance_dimensions_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_dimensions` ADD CONSTRAINT `finance_dimensions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_versionId_finance_versions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `finance_versions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_cycleId_finance_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `finance_cycles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_batchId_finance_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_areaId_areas_id_fk` FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_modalityId_modalities_id_fk` FOREIGN KEY (`modalityId`) REFERENCES `modalities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_brandId_finance_dimensions_id_fk` FOREIGN KEY (`brandId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_businessUnitId_finance_dimensions_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_productId_finance_dimensions_id_fk` FOREIGN KEY (`productId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_costCenterId_finance_dimensions_id_fk` FOREIGN KEY (`costCenterId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_accountingAccountId_finance_dimensions_id_fk` FOREIGN KEY (`accountingAccountId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_managementAccountId_finance_dimensions_id_fk` FOREIGN KEY (`managementAccountId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_natureId_finance_dimensions_id_fk` FOREIGN KEY (`natureId`) REFERENCES `finance_dimensions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_pillarId_finance_dimensions_id_fk` FOREIGN KEY (`pillarId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_channelId_finance_dimensions_id_fk` FOREIGN KEY (`channelId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_initiativeId_finance_dimensions_id_fk` FOREIGN KEY (`initiativeId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_campaignId_finance_dimensions_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_vendorId_finance_dimensions_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_forecast_lines` ADD CONSTRAINT `finance_forecast_lines_contractId_finance_dimensions_id_fk` FOREIGN KEY (`contractId`) REFERENCES `finance_dimensions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_import_batches` ADD CONSTRAINT `finance_import_batches_cycleId_finance_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `finance_cycles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_import_batches` ADD CONSTRAINT `finance_import_batches_versionId_finance_versions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `finance_versions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_import_batches` ADD CONSTRAINT `finance_import_batches_reversalOfBatchId_finance_import_batches_id_fk` FOREIGN KEY (`reversalOfBatchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_import_batches` ADD CONSTRAINT `finance_import_batches_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_import_batches` ADD CONSTRAINT `finance_import_batches_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_import_errors` ADD CONSTRAINT `finance_import_errors_batchId_finance_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_import_errors` ADD CONSTRAINT `finance_import_errors_stagingRowId_finance_import_staging_rows_id_fk` FOREIGN KEY (`stagingRowId`) REFERENCES `finance_import_staging_rows`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_import_staging_rows` ADD CONSTRAINT `finance_import_staging_rows_batchId_finance_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `finance_import_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_mapping_rules` ADD CONSTRAINT `finance_mapping_rules_targetDimensionId_finance_dimensions_id_fk` FOREIGN KEY (`targetDimensionId`) REFERENCES `finance_dimensions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_mapping_rules` ADD CONSTRAINT `finance_mapping_rules_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_user_scopes` ADD CONSTRAINT `finance_user_scopes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_user_scopes` ADD CONSTRAINT `finance_user_scopes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_versions` ADD CONSTRAINT `finance_versions_cycleId_finance_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `finance_cycles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_versions` ADD CONSTRAINT `finance_versions_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_versions` ADD CONSTRAINT `finance_versions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `fin_actual_period_idx` ON `finance_actual_entries` (`cycleId`,`period`);--> statement-breakpoint
CREATE INDEX `fin_actual_vendor_idx` ON `finance_actual_entries` (`vendorId`);--> statement-breakpoint
CREATE INDEX `fin_alloc_dest_rule_idx` ON `finance_allocation_destinations` (`ruleId`);--> statement-breakpoint
CREATE INDEX `fin_alloc_entries_run_idx` ON `finance_allocation_entries` (`runId`);--> statement-breakpoint
CREATE INDEX `fin_alloc_entries_dest_idx` ON `finance_allocation_entries` (`destinationDimensionId`);--> statement-breakpoint
CREATE INDEX `fin_alloc_rules_status_idx` ON `finance_allocation_rules` (`status`);--> statement-breakpoint
CREATE INDEX `fin_alloc_runs_rule_period_idx` ON `finance_allocation_runs` (`ruleId`,`period`);--> statement-breakpoint
CREATE INDEX `fin_alloc_runs_status_idx` ON `finance_allocation_runs` (`status`);--> statement-breakpoint
CREATE INDEX `fin_approvals_batch_idx` ON `finance_batch_approvals` (`batchId`,`decidedAt`);--> statement-breakpoint
CREATE INDEX `fin_budget_period_idx` ON `finance_budget_lines` (`cycleId`,`period`);--> statement-breakpoint
CREATE INDEX `fin_budget_owner_idx` ON `finance_budget_lines` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `fin_commit_period_idx` ON `finance_commitments` (`cycleId`,`period`);--> statement-breakpoint
CREATE INDEX `fin_commit_status_idx` ON `finance_commitments` (`commitmentStatus`);--> statement-breakpoint
CREATE INDEX `fin_cycles_status_idx` ON `finance_cycles` (`status`);--> statement-breakpoint
CREATE INDEX `fin_dims_type_status_idx` ON `finance_dimensions` (`dimensionType`,`status`);--> statement-breakpoint
CREATE INDEX `fin_dims_owner_idx` ON `finance_dimensions` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `fin_forecast_period_idx` ON `finance_forecast_lines` (`cycleId`,`period`);--> statement-breakpoint
CREATE INDEX `fin_forecast_owner_idx` ON `finance_forecast_lines` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `fin_batches_status_idx` ON `finance_import_batches` (`status`);--> statement-breakpoint
CREATE INDEX `fin_batches_hash_idx` ON `finance_import_batches` (`fileHash`);--> statement-breakpoint
CREATE INDEX `fin_batches_cycle_type_idx` ON `finance_import_batches` (`cycleId`,`loadType`);--> statement-breakpoint
CREATE INDEX `fin_batches_created_idx` ON `finance_import_batches` (`createdAt`);--> statement-breakpoint
CREATE INDEX `fin_errors_batch_idx` ON `finance_import_errors` (`batchId`);--> statement-breakpoint
CREATE INDEX `fin_errors_code_idx` ON `finance_import_errors` (`errorCode`);--> statement-breakpoint
CREATE INDEX `fin_staging_batch_status_idx` ON `finance_import_staging_rows` (`batchId`,`status`);--> statement-breakpoint
CREATE INDEX `fin_staging_key_idx` ON `finance_import_staging_rows` (`businessKeyHash`);--> statement-breakpoint
CREATE INDEX `fin_mapping_target_idx` ON `finance_mapping_rules` (`targetDimensionId`);--> statement-breakpoint
CREATE INDEX `fin_scopes_user_idx` ON `finance_user_scopes` (`userId`);--> statement-breakpoint
CREATE INDEX `fin_versions_cycle_status_idx` ON `finance_versions` (`cycleId`,`status`);