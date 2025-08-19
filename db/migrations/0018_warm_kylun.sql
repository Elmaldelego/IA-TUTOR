CREATE TABLE `study_plans` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text DEFAULT 'Nuevo Plan de Estudios' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`createdAt` integer NOT NULL
);
