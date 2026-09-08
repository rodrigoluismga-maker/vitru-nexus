CREATE TABLE `expansion_cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`stateCode` varchar(2) NOT NULL,
	`region` varchar(80),
	`ibgeCode` varchar(12),
	`population` bigint,
	`populationReferenceYear` int,
	`populationSource` varchar(1000),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`stage` enum('prospecting','study','approval','implementation','operation','paused','cancelled') NOT NULL DEFAULT 'prospecting',
	`health` enum('healthy','attention','critical','unassessed') NOT NULL DEFAULT 'unassessed',
	`marketPotentialScore` decimal(5,2),
	`attractionScore` decimal(5,2),
	`competitionScore` decimal(5,2),
	`operationalReadinessScore` decimal(5,2),
	`overallScore` decimal(5,2),
	`targetOpeningDate` timestamp,
	`notes` text,
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expansion_cities_id` PRIMARY KEY(`id`),
	CONSTRAINT `expansion_cities_project_name_state_uidx` UNIQUE(`projectId`,`name`,`stateCode`)
);
--> statement-breakpoint
CREATE TABLE `expansion_competitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`cityId` int NOT NULL,
	`institutionName` varchar(180) NOT NULL,
	`isPrivate` boolean NOT NULL DEFAULT true,
	`courseName` varchar(180),
	`modality` varchar(100),
	`grossPrice` decimal(14,2),
	`netPrice` decimal(14,2),
	`evidenceSource` varchar(1000),
	`evidenceDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expansion_competitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expansion_media_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`cityId` int NOT NULL,
	`campaignName` varchar(180) NOT NULL,
	`channelName` varchar(140) NOT NULL,
	`channelType` enum('digital','offline','partnership','event','other') NOT NULL,
	`objective` varchar(220),
	`investment` decimal(18,2),
	`targetLeads` int,
	`targetEnrollments` int,
	`startDate` timestamp,
	`endDate` timestamp,
	`ownerId` int,
	`status` enum('planned','active','completed','paused','cancelled') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expansion_media_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expansion_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`cityId` int,
	`offerId` int,
	`scenarioId` int,
	`metricCode` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`unit` varchar(40),
	`periodLabel` varchar(80) NOT NULL,
	`targetValue` decimal(20,4),
	`actualValue` decimal(20,4),
	`forecastValue` decimal(20,4),
	`source` varchar(500),
	`measuredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expansion_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expansion_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`cityId` int NOT NULL,
	`companyId` int NOT NULL,
	`modalityId` int,
	`courseName` varchar(180) NOT NULL,
	`courseCode` varchar(60),
	`degreeType` varchar(80),
	`shift` varchar(80),
	`entryPeriod` varchar(40),
	`grossPrice` decimal(14,2),
	`launchDiscount` decimal(7,4),
	`targetNetPrice` decimal(14,2),
	`capacity` int,
	`status` enum('study','approved','implementation','active','paused','cancelled') NOT NULL DEFAULT 'study',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expansion_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expansion_sales_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`cityId` int NOT NULL,
	`channelName` varchar(140) NOT NULL,
	`ownerId` int,
	`plannedHeadcount` int,
	`currentHeadcount` int,
	`targetLeads` int,
	`targetEnrollments` int,
	`actualEnrollments` int,
	`readiness` enum('not_started','mobilizing','ready','operating','blocked') NOT NULL DEFAULT 'not_started',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expansion_sales_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expansion_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`cityId` int,
	`name` enum('conservative','base','accelerated') NOT NULL,
	`periodLabel` varchar(80) NOT NULL,
	`targetEnrollments` int,
	`targetLeads` int,
	`conversionRate` decimal(7,4),
	`averageTicket` decimal(14,2),
	`grossRevenue` decimal(18,2),
	`totalInvestment` decimal(18,2),
	`digitalShare` decimal(7,4),
	`assumptions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expansion_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `workspaceTemplate` varchar(60) DEFAULT 'universal' NOT NULL;--> statement-breakpoint
ALTER TABLE `expansion_cities` ADD CONSTRAINT `expansion_cities_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_cities` ADD CONSTRAINT `expansion_cities_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_cities` ADD CONSTRAINT `expansion_cities_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_competitors` ADD CONSTRAINT `expansion_competitors_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_competitors` ADD CONSTRAINT `expansion_competitors_cityId_expansion_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `expansion_cities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_media_plans` ADD CONSTRAINT `expansion_media_plans_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_media_plans` ADD CONSTRAINT `expansion_media_plans_cityId_expansion_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `expansion_cities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_media_plans` ADD CONSTRAINT `expansion_media_plans_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_metrics` ADD CONSTRAINT `expansion_metrics_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_metrics` ADD CONSTRAINT `expansion_metrics_cityId_expansion_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `expansion_cities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_metrics` ADD CONSTRAINT `expansion_metrics_offerId_expansion_offers_id_fk` FOREIGN KEY (`offerId`) REFERENCES `expansion_offers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_metrics` ADD CONSTRAINT `expansion_metrics_scenarioId_expansion_scenarios_id_fk` FOREIGN KEY (`scenarioId`) REFERENCES `expansion_scenarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_offers` ADD CONSTRAINT `expansion_offers_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_offers` ADD CONSTRAINT `expansion_offers_cityId_expansion_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `expansion_cities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_offers` ADD CONSTRAINT `expansion_offers_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_offers` ADD CONSTRAINT `expansion_offers_modalityId_modalities_id_fk` FOREIGN KEY (`modalityId`) REFERENCES `modalities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_sales_plans` ADD CONSTRAINT `expansion_sales_plans_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_sales_plans` ADD CONSTRAINT `expansion_sales_plans_cityId_expansion_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `expansion_cities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_sales_plans` ADD CONSTRAINT `expansion_sales_plans_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_scenarios` ADD CONSTRAINT `expansion_scenarios_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expansion_scenarios` ADD CONSTRAINT `expansion_scenarios_cityId_expansion_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `expansion_cities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `expansion_cities_project_idx` ON `expansion_cities` (`projectId`);--> statement-breakpoint
CREATE INDEX `expansion_cities_stage_idx` ON `expansion_cities` (`stage`);--> statement-breakpoint
CREATE INDEX `expansion_cities_health_idx` ON `expansion_cities` (`health`);--> statement-breakpoint
CREATE INDEX `expansion_competitors_project_idx` ON `expansion_competitors` (`projectId`);--> statement-breakpoint
CREATE INDEX `expansion_competitors_city_idx` ON `expansion_competitors` (`cityId`);--> statement-breakpoint
CREATE INDEX `expansion_competitors_private_idx` ON `expansion_competitors` (`isPrivate`);--> statement-breakpoint
CREATE INDEX `expansion_media_project_idx` ON `expansion_media_plans` (`projectId`);--> statement-breakpoint
CREATE INDEX `expansion_media_city_idx` ON `expansion_media_plans` (`cityId`);--> statement-breakpoint
CREATE INDEX `expansion_media_period_idx` ON `expansion_media_plans` (`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `expansion_metrics_project_idx` ON `expansion_metrics` (`projectId`);--> statement-breakpoint
CREATE INDEX `expansion_metrics_city_idx` ON `expansion_metrics` (`cityId`);--> statement-breakpoint
CREATE INDEX `expansion_metrics_period_idx` ON `expansion_metrics` (`periodLabel`);--> statement-breakpoint
CREATE INDEX `expansion_metrics_code_idx` ON `expansion_metrics` (`metricCode`);--> statement-breakpoint
CREATE INDEX `expansion_offers_project_idx` ON `expansion_offers` (`projectId`);--> statement-breakpoint
CREATE INDEX `expansion_offers_city_idx` ON `expansion_offers` (`cityId`);--> statement-breakpoint
CREATE INDEX `expansion_offers_company_idx` ON `expansion_offers` (`companyId`);--> statement-breakpoint
CREATE INDEX `expansion_sales_project_idx` ON `expansion_sales_plans` (`projectId`);--> statement-breakpoint
CREATE INDEX `expansion_sales_city_idx` ON `expansion_sales_plans` (`cityId`);--> statement-breakpoint
CREATE INDEX `expansion_sales_owner_idx` ON `expansion_sales_plans` (`ownerId`);--> statement-breakpoint
CREATE INDEX `expansion_scenarios_project_idx` ON `expansion_scenarios` (`projectId`);--> statement-breakpoint
CREATE INDEX `expansion_scenarios_city_idx` ON `expansion_scenarios` (`cityId`);--> statement-breakpoint
CREATE INDEX `expansion_scenarios_period_idx` ON `expansion_scenarios` (`periodLabel`);