CREATE TABLE `finance_market_attention_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loadId` bigint NOT NULL,
	`brand` varchar(160) NOT NULL,
	`businessUnit` varchar(200) NOT NULL,
	`managementCategory` varchar(200) NOT NULL,
	`amount2025Signed` decimal(22,8),
	`amount2026Signed` decimal(22,8),
	`observation` text,
	`attentionType` enum('context','forecast','reclassification','scope_change','imprecision') NOT NULL DEFAULT 'context',
	`status` enum('informational','open','validated','resolved') NOT NULL DEFAULT 'informational',
	`sourceSheet` varchar(160) NOT NULL,
	`sourceRow` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_market_attention_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_market_entries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`loadId` bigint NOT NULL,
	`sourceExcelRow` int NOT NULL,
	`sourceRecordId` varchar(64) NOT NULL,
	`origin` varchar(200) NOT NULL,
	`scenario` enum('actual','forecast') NOT NULL,
	`competenceDre` varchar(6) NOT NULL,
	`period` varchar(7) NOT NULL,
	`postingDate` timestamp,
	`day` int,
	`month` int NOT NULL,
	`fiscalYear` int NOT NULL,
	`brand` varchar(160) NOT NULL,
	`businessUnit` varchar(200) NOT NULL,
	`modality` varchar(160),
	`product` varchar(200),
	`dreGroup` varchar(200) NOT NULL,
	`dreLine` varchar(200) NOT NULL,
	`branchCode` varchar(80),
	`costCenterCode` varchar(120),
	`costCenterName` varchar(300),
	`accountingAccountCode` varchar(120) NOT NULL,
	`accountingAccountName` varchar(300),
	`budgetCode` varchar(120),
	`budgetName` varchar(300),
	`history` text,
	`sourceUser` varchar(200),
	`ledgerBatch` varchar(120),
	`ledgerSubBatch` varchar(120),
	`amountSigned` decimal(22,8) NOT NULL,
	`amountManagement` decimal(22,8) NOT NULL,
	`manualEntry` boolean NOT NULL DEFAULT false,
	`entryType` varchar(120) NOT NULL,
	`managementCategory` varchar(200) NOT NULL,
	`exactDuplicate` boolean NOT NULL DEFAULT false,
	`duplicateFingerprint` varchar(64),
	`qualityFlags` json,
	`rawData` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_market_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_market_load_source_uidx` UNIQUE(`loadId`,`sourceRecordId`)
);
--> statement-breakpoint
CREATE TABLE `finance_market_glossary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loadId` bigint NOT NULL,
	`category` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`sourceSheet` varchar(160) NOT NULL,
	`sourceRow` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_market_glossary_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_market_glossary_load_cat_uidx` UNIQUE(`loadId`,`category`)
);
--> statement-breakpoint
CREATE TABLE `finance_market_loads` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`sourceFileName` varchar(500) NOT NULL,
	`sourceSha256` varchar(64) NOT NULL,
	`sourceSheet` varchar(160) NOT NULL,
	`status` enum('processing','validated','approved','active','superseded','reversed','failed') NOT NULL DEFAULT 'processing',
	`validRows` int NOT NULL DEFAULT 0,
	`rejectedRows` int NOT NULL DEFAULT 0,
	`duplicateRows` int NOT NULL DEFAULT 0,
	`amountSigned` decimal(22,8) NOT NULL DEFAULT '0',
	`amountManagement` decimal(22,8) NOT NULL DEFAULT '0',
	`scenarioRule` varchar(500) NOT NULL,
	`notes` text,
	`loadedBy` int,
	`approvedBy` int,
	`loadedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`activatedAt` timestamp,
	CONSTRAINT `finance_market_loads_id` PRIMARY KEY(`id`),
	CONSTRAINT `fin_market_load_sha_uidx` UNIQUE(`sourceSha256`)
);
--> statement-breakpoint
CREATE TABLE `finance_market_quality_issues` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`loadId` bigint NOT NULL,
	`sourceExcelRow` int,
	`issueCode` varchar(100) NOT NULL,
	`severity` enum('info','warning','blocking') NOT NULL DEFAULT 'warning',
	`fieldName` varchar(120),
	`message` text NOT NULL,
	`sourceValue` text,
	`status` enum('open','accepted','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_market_quality_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `finance_market_attention_points` ADD CONSTRAINT `fin_mkt_attention_load_fk` FOREIGN KEY (`loadId`) REFERENCES `finance_market_loads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_market_entries` ADD CONSTRAINT `fin_mkt_entries_load_fk` FOREIGN KEY (`loadId`) REFERENCES `finance_market_loads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_market_glossary` ADD CONSTRAINT `fin_mkt_glossary_load_fk` FOREIGN KEY (`loadId`) REFERENCES `finance_market_loads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_market_loads` ADD CONSTRAINT `fin_mkt_load_loaded_by_fk` FOREIGN KEY (`loadedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_market_loads` ADD CONSTRAINT `fin_mkt_load_approved_by_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finance_market_quality_issues` ADD CONSTRAINT `fin_mkt_quality_load_fk` FOREIGN KEY (`loadId`) REFERENCES `finance_market_loads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `fin_market_attention_context_idx` ON `finance_market_attention_points` (`loadId`,`brand`,`managementCategory`,`status`);--> statement-breakpoint
CREATE INDEX `fin_market_period_scenario_idx` ON `finance_market_entries` (`loadId`,`fiscalYear`,`month`,`scenario`);--> statement-breakpoint
CREATE INDEX `fin_market_brand_category_idx` ON `finance_market_entries` (`loadId`,`brand`,`managementCategory`);--> statement-breakpoint
CREATE INDEX `fin_market_bu_product_idx` ON `finance_market_entries` (`loadId`,`businessUnit`,`product`);--> statement-breakpoint
CREATE INDEX `fin_market_account_idx` ON `finance_market_entries` (`loadId`,`accountingAccountCode`);--> statement-breakpoint
CREATE INDEX `fin_market_cc_idx` ON `finance_market_entries` (`loadId`,`costCenterCode`);--> statement-breakpoint
CREATE INDEX `fin_market_load_status_idx` ON `finance_market_loads` (`status`,`activatedAt`);--> statement-breakpoint
CREATE INDEX `fin_market_quality_load_idx` ON `finance_market_quality_issues` (`loadId`,`severity`,`status`);--> statement-breakpoint
CREATE INDEX `fin_market_quality_row_idx` ON `finance_market_quality_issues` (`loadId`,`sourceExcelRow`);
