CREATE TABLE `field_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` integer NOT NULL,
	`organization_alias` text NOT NULL,
	`source_kind` text NOT NULL,
	`role_class` text NOT NULL,
	`private_notes` text NOT NULL,
	`stage` text DEFAULT 'signal' NOT NULL,
	`consent_scope` text DEFAULT 'internal_only' NOT NULL,
	`privacy_status` text DEFAULT 'private_intake' NOT NULL,
	`created_by_member_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text,
	`display_name` text NOT NULL,
	`public_alias` text DEFAULT 'GO Society Mission Partner' NOT NULL,
	`name_public` integer DEFAULT false NOT NULL,
	`role` text DEFAULT 'mission_partner' NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`expires_at` text,
	`joined_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `mission_memberships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`can_record` integer DEFAULT true NOT NULL,
	`can_review` integer DEFAULT false NOT NULL,
	`can_publish` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mission_memberships_mission_member_unique` ON `mission_memberships` (`mission_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `public_cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` integer,
	`source_field_record_id` integer,
	`public_title` text NOT NULL,
	`public_summary` text NOT NULL,
	`organization_profile` text NOT NULL,
	`source_role_class` text NOT NULL,
	`stage` text DEFAULT 'signal' NOT NULL,
	`consent_scope` text NOT NULL,
	`reidentification_risk` text NOT NULL,
	`privacy_status` text DEFAULT 'pending' NOT NULL,
	`publication_status` text DEFAULT 'draft' NOT NULL,
	`approved_by_member_id` integer,
	`approved_at` text,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_field_record_id`) REFERENCES `field_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `publication_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_case_id` integer NOT NULL,
	`reviewer_member_id` integer NOT NULL,
	`decision` text NOT NULL,
	`pii_check_status` text NOT NULL,
	`reidentification_risk` text NOT NULL,
	`consent_scope` text NOT NULL,
	`private_notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`public_case_id`) REFERENCES `public_cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `missions` ADD `public_owner_label` text DEFAULT 'Named human owner' NOT NULL;
--> statement-breakpoint
UPDATE `missions`
SET `public_owner_label` = CASE `slug`
	WHEN 'make-go-runnable' THEN 'Angelo Yu × GO Society Agent'
	WHEN 'build-go-commons' THEN 'GO Society Human–Agent Cell'
	WHEN 'find-first-adopters' THEN 'Angelo Yu × GO Society'
	ELSE 'Named human owner'
END;
--> statement-breakpoint
INSERT INTO `missions` (
	`slug`,
	`title`,
	`purpose`,
	`owner`,
	`public_owner_label`,
	`status`,
	`authority_summary`,
	`success_signal`,
	`next_decision`,
	`confidence`
) VALUES (
	'enterprise-reality-loop',
	'Build the enterprise reality feedback loop',
	'Bring real signals from enterprise decision-makers and management consultants into GO OS without turning trust into public data.',
	'Angelo Yu × Enterprise Reality Mission Partner',
	'Angelo Yu × Enterprise Reality Mission Partner',
	'learning',
	'May introduce GO OS, run bounded conversations and record minimized feedback under aliases. May not publish identities, raw notes, recordings, contact data or identifiable enterprise context.',
	'Ten de-identified Signals lead to three bounded Probes, with contradictions and negative feedback preserved alongside positive evidence.',
	'Bind the first Mission Partner identity privately and begin a 30-day field probe.',
	38
);
--> statement-breakpoint
INSERT INTO `members` (
	`display_name`,
	`public_alias`,
	`name_public`,
	`role`,
	`status`,
	`joined_at`
) VALUES (
	'Angelo Yu',
	'Angelo Yu',
	true,
	'owner',
	'active',
	CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `mission_memberships` (
	`mission_id`,
	`member_id`,
	`can_record`,
	`can_review`,
	`can_publish`,
	`status`
)
SELECT
	`missions`.`id`,
	`members`.`id`,
	true,
	true,
	true,
	'active'
FROM `missions`
CROSS JOIN `members`
WHERE `members`.`role` = 'owner';
--> statement-breakpoint
INSERT INTO `public_cases` (
	`mission_id`,
	`public_title`,
	`public_summary`,
	`organization_profile`,
	`source_role_class`,
	`stage`,
	`consent_scope`,
	`reidentification_risk`,
	`privacy_status`,
	`publication_status`,
	`approved_by_member_id`,
	`approved_at`,
	`published_at`
) VALUES
(
	(SELECT `id` FROM `missions` WHERE `slug` = 'make-go-runnable'),
	'GO OS repository reached Public Alpha',
	'The constitutional framework, core objects, skill system and machine-readable schemas are publicly accessible in one canonical repository.',
	'Open-source project · global',
	'Public repository evidence',
	'validated_case',
	'anonymous_publication',
	'low',
	'human_approved',
	'published',
	(SELECT `id` FROM `members` WHERE `role` = 'owner' LIMIT 1),
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
),
(
	(SELECT `id` FROM `missions` WHERE `slug` = 'make-go-runnable'),
	'A deployable runtime surface now exists',
	'GO Society can represent missions, authority, public evidence, private field records, exceptions and evolution proposals in a running web application.',
	'Open-source product · global',
	'Runtime verification',
	'validated_case',
	'anonymous_publication',
	'low',
	'human_approved',
	'published',
	(SELECT `id` FROM `members` WHERE `role` = 'owner' LIMIT 1),
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
),
(
	(SELECT `id` FROM `missions` WHERE `slug` = 'build-go-commons'),
	'The ecosystem needs a living organization, not only content',
	'Promotion and community work become more falsifiable when the same organization publicly runs on the system it advocates.',
	'Founder-led open-source initiative',
	'Founder decision record',
	'signal',
	'anonymous_publication',
	'low',
	'human_approved',
	'published',
	(SELECT `id` FROM `members` WHERE `role` = 'owner' LIMIT 1),
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
),
(
	(SELECT `id` FROM `missions` WHERE `slug` = 'find-first-adopters'),
	'Open-source stewardship and enterprise work create different obligations',
	'Community transparency and enterprise confidentiality need an explicit boundary before design partnerships scale.',
	'Organizational design review',
	'Internal governance synthesis',
	'signal',
	'anonymous_publication',
	'low',
	'human_approved',
	'published',
	(SELECT `id` FROM `members` WHERE `role` = 'owner' LIMIT 1),
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `publication_reviews` (
	`public_case_id`,
	`reviewer_member_id`,
	`decision`,
	`pii_check_status`,
	`reidentification_risk`,
	`consent_scope`
)
SELECT
	`public_cases`.`id`,
	`public_cases`.`approved_by_member_id`,
	'approved',
	'passed',
	`public_cases`.`reidentification_risk`,
	`public_cases`.`consent_scope`
FROM `public_cases`
WHERE `public_cases`.`approved_by_member_id` IS NOT NULL;
--> statement-breakpoint
INSERT INTO `capabilities` (`name`, `maturity`, `evidence_count`)
VALUES ('Privacy-safe evidence publishing', 'emerging', 1);
