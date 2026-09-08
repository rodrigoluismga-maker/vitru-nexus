CREATE TABLE `user_invitations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`senderEmail` varchar(320),
	`provider` varchar(60) NOT NULL DEFAULT 'microsoft_graph',
	`status` enum('pending','accepted','failed','activated') NOT NULL DEFAULT 'pending',
	`attempt` int NOT NULL DEFAULT 1,
	`requestedBy` int,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`failedAt` timestamp,
	`activatedAt` timestamp,
	`providerRequestId` varchar(255),
	`errorCode` varchar(120),
	`errorMessage` varchar(500),
	`metadata` json,
	CONSTRAINT `user_invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_invitations` ADD CONSTRAINT `user_invitations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_invitations` ADD CONSTRAINT `user_invitations_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_invitations_user_requested_idx` ON `user_invitations` (`userId`,`requestedAt`);--> statement-breakpoint
CREATE INDEX `user_invitations_email_status_idx` ON `user_invitations` (`recipientEmail`,`status`);