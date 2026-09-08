ALTER TABLE `decisions` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `deliveries` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `documents` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `milestones` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `risks` ADD `archivedAt` timestamp;