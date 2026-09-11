CREATE TABLE `simulation_runs` (
	`id` varchar(32) NOT NULL,
	`gemCode` varchar(32) NOT NULL,
	`gemName` varchar(160) NOT NULL,
	`scenario` varchar(255) NOT NULL,
	`process` varchar(120) NOT NULL,
	`baselinePct` int NOT NULL,
	`targetPct` int NOT NULL,
	`windowDays` int NOT NULL,
	`failureMode` varchar(160) NOT NULL,
	`status` enum('Concluída','Em revisão','Executando') NOT NULL DEFAULT 'Executando',
	`roi` varchar(32) NOT NULL DEFAULT '—',
	`resultSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
