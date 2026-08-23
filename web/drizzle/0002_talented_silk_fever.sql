CREATE TABLE `authority_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`grantor` text NOT NULL,
	`grantee` text NOT NULL,
	`accountable_human` text NOT NULL,
	`scope` text NOT NULL,
	`allowed_actions` text NOT NULL,
	`prohibited_actions` text NOT NULL,
	`resource_rights` text NOT NULL,
	`limits` text NOT NULL,
	`reversibility_ceiling` text NOT NULL,
	`evidence_obligations` text NOT NULL,
	`escalation` text NOT NULL,
	`conflict_rules` text NOT NULL,
	`valid_from` text,
	`expires_at` text,
	`revoked_at` text,
	`self_expansion_allowed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authority_grants_grantee_active_unique` ON `authority_grants` (`grantee`,`revoked_at`);
--> statement-breakpoint
INSERT OR IGNORE INTO `authority_grants` (
	`id`,
	`grantor`,
	`grantee`,
	`accountable_human`,
	`scope`,
	`allowed_actions`,
	`prohibited_actions`,
	`resource_rights`,
	`limits`,
	`reversibility_ceiling`,
	`evidence_obligations`,
	`escalation`,
	`conflict_rules`,
	`valid_from`,
	`expires_at`,
	`revoked_at`,
	`self_expansion_allowed`
)
SELECT
	'authority-member-' || `members`.`id` || '-v050',
	CASE WHEN `members`.`role` = 'owner' THEN 'human:Angelo Yu' ELSE 'member:1' END,
	'member:' || `members`.`id`,
	CASE WHEN `members`.`role` = 'owner' THEN `members`.`display_name` ELSE 'GO Society accountable owner' END,
	CASE
		WHEN `members`.`role` = 'owner' THEN 'Operate the bounded GO Society alpha reference instance. Constitutional and irreversible changes require explicit human judgment.'
		ELSE 'Record bounded field evidence and raise exceptions for assigned missions.'
	END,
	CASE
		WHEN `members`.`role` = 'owner' THEN '["create_evidence","create_exception","create_evolution_proposal","update_mission","custom:manage_membership"]'
		ELSE '["create_evidence","create_exception"]'
	END,
	CASE
		WHEN `members`.`role` = 'owner' THEN '["custom:expand_own_authority","custom:modify_own_authority"]'
		ELSE '["custom:expand_own_authority","custom:modify_own_authority","create_evolution_proposal","update_mission"]'
	END,
	CASE
		WHEN `members`.`role` = 'owner' THEN '{"missionMembershipRequired":false,"allowedTargetPrefixes":["mission:","organization:"]}'
		ELSE '{"missionMembershipRequired":true,"allowedTargetPrefixes":["mission:"]}'
	END,
	CASE
		WHEN `members`.`role` = 'owner' THEN '{"maxRiskClass":"high","maxResourceExposure":1,"allowedTools":["web-runtime"]}'
		ELSE '{"maxRiskClass":"low","maxResourceExposure":1,"allowedTools":["web-runtime"]}'
	END,
	CASE
		WHEN `members`.`role` = 'owner' THEN 'irreversible_allowed'
		ELSE 'reversible_only'
	END,
	'["Preserve source, consent scope, uncertainty and decision impact."]',
	'["Escalate actions outside the grant, privacy boundary or reversibility ceiling."]',
	'["Multiple active grants fail closed until an explicit conflict-resolution rule is implemented."]',
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
	`members`.`expires_at`,
	NULL,
	false
FROM `members`
WHERE `members`.`status` IN ('invited', 'active');
--> statement-breakpoint
UPDATE `missions`
SET
	`purpose` = 'Turn GO OS from a constitutional framework and Skill system into an inspectable alpha reference surface, then test whether the complete runtime loop can be validated.',
	`status` = 'validating',
	`updated_at` = CURRENT_TIMESTAMP
WHERE `slug` = 'make-go-runnable';
--> statement-breakpoint
UPDATE `public_cases`
SET
	`public_title` = 'An alpha reference surface now exists',
	`public_summary` = 'GO Society Web represents selected mission, authority, public-case, private-intake, exception and evolution-proposal boundaries. The complete eight-object cognitive loop remains unvalidated.',
	`stage` = 'probe',
	`updated_at` = CURRENT_TIMESTAMP
WHERE `public_title` = 'A deployable runtime surface now exists';
