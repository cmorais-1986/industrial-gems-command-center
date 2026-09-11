CREATE TABLE `governance_decision_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`decisionId` int NOT NULL,
	`authorName` varchar(160) NOT NULL,
	`authorEmail` varchar(320),
	`action` enum('Criada','Editada','Aprovada','Rejeitada') NOT NULL,
	`previousStatus` enum('Registrada','Aprovada','Rejeitada'),
	`newStatus` enum('Registrada','Aprovada','Rejeitada'),
	`previousDecision` varchar(160),
	`newDecision` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governance_decision_audits_id` PRIMARY KEY(`id`)
);
