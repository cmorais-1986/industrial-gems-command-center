CREATE TABLE `bom_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`productCode` varchar(32) NOT NULL,
	`componentCode` varchar(48) NOT NULL,
	`componentName` varchar(160) NOT NULL,
	`quantity` varchar(32) NOT NULL,
	`unit` varchar(16) NOT NULL,
	`revision` varchar(12) NOT NULL,
	CONSTRAINT `bom_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engineering_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`itemCode` varchar(48) NOT NULL,
	`title` varchar(180) NOT NULL,
	`revision` varchar(12) NOT NULL,
	`status` enum('Em desenvolvimento','Em aprovação','Liberado','Obsoleto') NOT NULL DEFAULT 'Em desenvolvimento',
	`ownerName` varchar(120) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engineering_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`orderCode` varchar(32) NOT NULL,
	`operatorName` varchar(120) NOT NULL,
	`machineCode` varchar(64) NOT NULL,
	`shift` enum('1º turno','2º turno','3º turno') NOT NULL,
	`goodQty` int NOT NULL,
	`scrapQty` int NOT NULL,
	`notes` text,
	`reportedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`orderCode` varchar(32) NOT NULL,
	`characteristic` varchar(120) NOT NULL,
	`specification` varchar(120) NOT NULL,
	`measuredValue` varchar(64) NOT NULL,
	`result` enum('Conforme','Não conforme','Aguardando') NOT NULL DEFAULT 'Aguardando',
	`approvedBy` varchar(120),
	`approvedAt` timestamp,
	`inspectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stamping_operations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`operationCode` varchar(48) NOT NULL,
	`orderCode` varchar(32) NOT NULL,
	`machineCode` varchar(64) NOT NULL,
	`toolCode` varchar(64) NOT NULL,
	`status` enum('Planejada','Em execução','Concluída','Parada') NOT NULL DEFAULT 'Planejada',
	`targetQty` int NOT NULL,
	`completedQty` int NOT NULL DEFAULT 0,
	CONSTRAINT `stamping_operations_id` PRIMARY KEY(`id`)
);
