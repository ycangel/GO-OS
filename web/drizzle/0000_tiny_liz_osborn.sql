CREATE TABLE `capabilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`maturity` text DEFAULT 'emerging' NOT NULL,
	`evidence_count` integer DEFAULT 0 NOT NULL,
	`last_learned_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `capabilities_name_unique` ON `capabilities` (`name`);--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` integer,
	`title` text NOT NULL,
	`observation` text NOT NULL,
	`source` text NOT NULL,
	`freshness` text DEFAULT 'current' NOT NULL,
	`reliability` text DEFAULT 'medium' NOT NULL,
	`created_by` text DEFAULT 'GO Society' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evolution_proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`trigger_evidence` text NOT NULL,
	`proposed_change` text NOT NULL,
	`sponsor` text NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`reversible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exceptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` integer,
	`title` text NOT NULL,
	`context` text NOT NULL,
	`severity` text DEFAULT 'medium' NOT NULL,
	`required_decision` text NOT NULL,
	`accountable_owner` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_by` text DEFAULT 'GO Society' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`purpose` text NOT NULL,
	`owner` text NOT NULL,
	`status` text DEFAULT 'forming' NOT NULL,
	`authority_summary` text NOT NULL,
	`success_signal` text NOT NULL,
	`next_decision` text NOT NULL,
	`confidence` integer DEFAULT 50 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `missions_slug_unique` ON `missions` (`slug`);
--> statement-breakpoint
INSERT INTO `missions` (`slug`, `title`, `purpose`, `owner`, `status`, `authority_summary`, `success_signal`, `next_decision`, `confidence`) VALUES
('make-go-runnable', 'Make GO OS runnable', 'Turn GO OS from a constitutional framework and skill system into a usable, deployable organizational runtime.', 'Angelo Yu × 灌木丛', 'validating', 'May design, build and publish reversible open-source software. Cannot change constitutional principles or make irreversible commitments without Angelo.', 'A real organization advances a recurring mission with less coordination load and no loss of accountability.', 'Confirm whether the first Mission Cockpit exposes the minimum useful reality.', 72),
('build-go-commons', 'Build the GO Society commons', 'Create a public field of code, skills, evidence, media and contributors that compounds the ability to reinvent organizations.', 'GO Society Human–Agent Cell', 'active', 'May publish public material, invite contributors and test community rituals within the GO OS constitution.', 'External contributors reuse, challenge and improve GO capabilities through evidence.', 'Select the first public contribution mission and named steward.', 58),
('find-first-adopters', 'Find the first organizations ready to evolve', 'Reach decision-makers who want to rebuild their organization and form evidence-producing design partnerships.', 'Angelo Yu × GO Society', 'learning', 'May research, draft outreach and open conversations. Commercial promises, private data use and binding commitments require named human approval.', 'Three qualified organizations enter a bounded GO OS probe with explicit success and stop conditions.', 'Define the public invitation and selection threshold for design partners.', 41);
--> statement-breakpoint
INSERT INTO `evidence` (`mission_id`, `title`, `observation`, `source`, `freshness`, `reliability`, `created_by`) VALUES
(1, 'GO OS repository reached Public Alpha', 'The constitutional framework, core objects, skill system and machine-readable schemas are publicly accessible in one canonical repository.', 'ycangel/GO-OS', 'current', 'high', 'GO Society'),
(1, 'A deployable runtime surface now exists', 'GO Society can represent missions, authority, evidence, exceptions and evolution proposals in a running web application.', 'GO Society Web', 'current', 'high', '灌木丛'),
(2, 'The ecosystem needs a living organization, not only content', 'Promotion, community work and enterprise outreach become more credible when the same organization publicly runs on the system it advocates.', 'Founder decision', 'current', 'high', 'Angelo Yu'),
(3, 'Open-source neutrality and enterprise adoption create different obligations', 'Community stewardship requires transparent shared rules while enterprise work may require confidentiality and commercial commitments.', 'Organizational design review', 'current', 'medium', 'GO Society');
--> statement-breakpoint
INSERT INTO `exceptions` (`mission_id`, `title`, `context`, `severity`, `required_decision`, `accountable_owner`, `status`, `created_by`) VALUES
(2, 'Define the boundary between commons and commercial work', 'GO Society will both steward an open ecosystem and contact enterprises. Without a boundary, commercial incentives could distort open governance or confidential work could leak into the commons.', 'high', 'Decide whether GO Works becomes a separate commercial cell, and which artifacts, evidence and decisions must remain inside GO Commons.', 'Angelo Yu', 'open', 'GO Society');
--> statement-breakpoint
INSERT INTO `evolution_proposals` (`title`, `trigger_evidence`, `proposed_change`, `sponsor`, `status`, `reversible`) VALUES
('Evolve from founder-led cell to contributor-governed network', 'Trigger when at least 10 external contributors and 3 independent real-world deployments produce verified evidence.', 'Create a transparent stewardship council while preserving named human accountability and constitutional vetoes over irreversible changes.', 'GO Society', 'proposed', true),
('Make Field Notes part of the runtime', 'Content should expose assumptions, contradictory evidence and learning—not become a separate marketing output.', 'Generate every public article, podcast or visual from a Mission and link it back to its evidence and outcome.', '灌木丛', 'validating', true);
--> statement-breakpoint
INSERT INTO `capabilities` (`name`, `maturity`, `evidence_count`) VALUES
('Mission compilation', 'validating', 3),
('Constitutional authority design', 'validating', 4),
('Evidence reconciliation', 'emerging', 2),
('Open-source field publishing', 'emerging', 1),
('Organizational evolution design', 'emerging', 2);
