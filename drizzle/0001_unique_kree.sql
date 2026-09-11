CREATE TABLE `copilot_messages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerId` int NOT NULL,
  `simulationId` varchar(32) NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `message` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `copilot_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governance_decisions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerId` int NOT NULL,
  `simulationId` varchar(32) NOT NULL,
  `decision` varchar(160) NOT NULL,
  `rationale` text NOT NULL,
  `status` enum('Registrada','Aprovada','Rejeitada') NOT NULL DEFAULT 'Registrada',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `governance_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `simulation_runs` ADD `ownerId` int DEFAULT 0 NOT NULL;
