CREATE TABLE `material_lots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`lotCode` varchar(48) NOT NULL,
	`material` varchar(160) NOT NULL,
	`supplier` varchar(160) NOT NULL,
	`status` enum('Liberado','Quarentena','Rejeitado') NOT NULL DEFAULT 'Liberado',
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `material_lots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`orderCode` varchar(32) NOT NULL,
	`productCode` varchar(32) NOT NULL,
	`quantity` int NOT NULL,
	`customer` varchar(160) NOT NULL,
	`status` enum('Planejada','Em produção','Em inspeção','Concluída','Quarentena') NOT NULL DEFAULT 'Planejada',
	`currentStep` varchar(80) NOT NULL DEFAULT 'Mistura',
	`dueDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `production_orders_id` PRIMARY KEY(`id`)
);
