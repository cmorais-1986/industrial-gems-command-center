CREATE TABLE `engineering_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`itemId` int NOT NULL,
	`area` enum('Engenharia','Qualidade','Produção') NOT NULL,
	`status` enum('Pendente','Aprovado','Rejeitado') NOT NULL DEFAULT 'Pendente',
	`approverName` varchar(120),
	`comment` text,
	`decidedAt` timestamp,
	CONSTRAINT `engineering_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engineering_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`itemId` int NOT NULL,
	`stageName` varchar(100) NOT NULL,
	`stageOrder` int NOT NULL,
	`status` enum('Não iniciado','Em andamento','Concluída','Bloqueada') NOT NULL DEFAULT 'Não iniciado',
	`completedBy` varchar(120),
	`completedAt` timestamp,
	`notes` text,
	CONSTRAINT `engineering_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `engineering_items` ADD `currentStage` varchar(80) DEFAULT 'Requisito e conceito' NOT NULL;--> statement-breakpoint
ALTER TABLE `engineering_items` ADD `drawingKey` varchar(255);--> statement-breakpoint
ALTER TABLE `engineering_items` ADD `drawingUrl` varchar(255);--> statement-breakpoint
ALTER TABLE `engineering_items` ADD `drawingName` varchar(180);